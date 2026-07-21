/* IvritSuite Advanced TTS — Web Worker: onnxruntime-web session + Kokoro inference.
 *
 * Loaded as a classic same-origin worker by tts-engine.js. All network fetches for the
 * model assets happen HERE, through a cache-first Cache API wrapper ('tts-models-v1' —
 * kept across deploys by sw.js's activate keep-list). The inference interface mirrors
 * kokoro-onnx (MIT, github.com/thewh1teagle/kokoro-onnx — see CREDITS.md §4):
 * per-char vocab token ids, [0, ...ids, 0] padding, ≤510 tokens, style row selected by
 * pre-pad token count with shape [1, 256], 24 kHz output.
 *
 * Messages in:  {type:'init', cfg}  {type:'synth', id, phonemes, voice, speed}  {type:'dispose'}
 * Messages out: {type:'progress', file, loaded, total}  {type:'ready', ep, vocab, voices, modelUrl}
 *               {type:'result', id, samples, sampleRate}  {type:'error', stage, message, id?}
 * All failures post a structured error — never a silent hang.
 */
'use strict';

var CFG = null;
var session = null;
var activeEP = null;
var vocab = null;
var voices = null;      // { name: {data: Float32Array, shape} }
var speedKind = null;   // 'float32' | 'int32' — resolved on first synth (export flavors differ)
var inputStyle = null;  // 'input_ids' (newer) | 'tokens' (legacy)

var SAMPLE_RATE = 24000;
var MAX_PHONEME_LENGTH = 510;

function fail(stage, err, id) {
  var msg = (err && (err.message || String(err))) || 'unknown error';
  self.postMessage({ type: 'error', stage: stage, message: msg, id: id });
}

// onnxruntime-web's create()/run() have NO built-in timeout: a hung WebGPU shader
// compile or a stalled WASM OOM otherwise blocks init forever (the field bug this
// worker was hardened against). Bound every long ORT call so a hang becomes a
// recoverable error and the EP loop can fall through to the next provider.
var CREATE_TIMEOUT_MS = 45000;   // per execution-provider session create
var WARMUP_TIMEOUT_MS = 30000;   // per-provider warm-up inference (doubles as EP validation)
function withTimeout(p, ms, label) {
  return new Promise(function (resolve, reject) {
    var settled = false;
    var timer = setTimeout(function () {
      if (!settled) { settled = true; reject(new Error((label || 'operation') + ' timed out after ' + ms + 'ms')); }
    }, ms);
    Promise.resolve(p).then(
      function (v) { if (!settled) { settled = true; clearTimeout(timer); resolve(v); } },
      function (e) { if (!settled) { settled = true; clearTimeout(timer); reject(e); } }
    );
  });
}

/* Cache-first fetch. Cache keys are synthetic versioned URLs so a MODEL_VERSION bump
 * invalidates cleanly regardless of the source host; the network URL is only used on miss. */
function cacheKey(name) { return 'https://tts-cache.invalid/' + CFG.modelVersion + '/' + name; }

async function cachedFetch(name, url, onProgress) {
  var cache = null;
  try { cache = await caches.open(CFG.cacheName); } catch (e) { /* Cache API unavailable (rare) */ }
  if (cache) {
    var hit = await cache.match(cacheKey(name));
    if (hit) return await hit.arrayBuffer();
  }
  var res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' fetching ' + url);
  var total = parseInt(res.headers.get('content-length') || '0', 10) || 0;
  var chunks = [], loaded = 0;
  var reader = res.body && res.body.getReader ? res.body.getReader() : null;
  if (reader) {
    for (;;) {
      var step = await reader.read();
      if (step.done) break;
      chunks.push(step.value);
      loaded += step.value.length;
      if (onProgress) onProgress(loaded, total);
    }
  } else {
    var whole = new Uint8Array(await res.arrayBuffer());
    chunks.push(whole);
    if (onProgress) onProgress(whole.length, total || whole.length);
  }
  var blob = new Blob(chunks);
  if (cache) {
    try { await cache.put(cacheKey(name), new Response(blob, { headers: { 'Content-Type': 'application/octet-stream' } })); }
    catch (e) { /* quota — keep going, synthesis still works this session */ }
  }
  return await blob.arrayBuffer();
}

async function isCached(name) {
  try {
    var cache = await caches.open(CFG.cacheName);
    return !!(await cache.match(cacheKey(name)));
  } catch (e) { return false; }
}

/* Prefer an int8 model when available: cached int8 → cached fp32 → HEAD-probe int8
 * upstream (the repo may publish one later) → fp32. */
async function chooseModel() {
  if (CFG.modelInt8Url && await isCached('model-int8')) return { name: 'model-int8', url: CFG.modelInt8Url };
  if (await isCached('model')) return { name: 'model', url: CFG.modelUrl };
  if (CFG.modelInt8Url && CFG.modelInt8Url !== CFG.modelUrl) {
    try {
      // Bounded — a slow/hanging HEAD must never stall the whole init.
      var head = await withTimeout(fetch(CFG.modelInt8Url, { method: 'HEAD' }), 8000, 'int8 probe');
      if (head.ok) return { name: 'model-int8', url: CFG.modelInt8Url };
    } catch (e) { /* fall through to fp32 */ }
  }
  return { name: 'model', url: CFG.modelUrl };
}

async function init(cfg) {
  CFG = cfg;
  try {
    importScripts(CFG.ortScript, CFG.fflateUrl, CFG.npyUrl);
  } catch (e) { return fail('load-scripts', e); }
  try {
    ort.env.wasm.wasmPaths = CFG.ortBase;
    // GitHub Pages sends no COOP/COEP, so cross-origin isolation is normally absent:
    // single-threaded WASM is the baseline, threads are a bonus where isolated.
    ort.env.wasm.numThreads = (self.crossOriginIsolated && navigator.hardwareConcurrency)
      ? Math.min(4, navigator.hardwareConcurrency) : 1;
  } catch (e) { return fail('ort-env', e); }

  var configBuf, voicesBuf, modelBuf, model;
  try {
    configBuf = await cachedFetch('config', CFG.configUrl, null);
    vocab = JSON.parse(new TextDecoder().decode(configBuf));
    if (vocab && vocab.vocab) vocab = vocab.vocab;
    if (!vocab || typeof vocab !== 'object') throw new Error('config.json has no vocab');
  } catch (e) { return fail('fetch-config', e); }
  try {
    voicesBuf = await cachedFetch('voices', CFG.voicesUrl, null);
    voices = NpyParser.parseVoicesBin(voicesBuf, CFG.defaultVoice, self.fflate);
  } catch (e) { return fail('fetch-voices', e); }
  try {
    model = await chooseModel();
    modelBuf = await cachedFetch(model.name, model.url, function (loaded, total) {
      self.postMessage({ type: 'progress', file: 'model', loaded: loaded, total: total });
    });
  } catch (e) { return fail('fetch-model', e); }

  try {
    var modelBytes = new Uint8Array(modelBuf);
    modelBuf = null; // release the source ArrayBuffer; createSession copies as needed
    await createSession(modelBytes);
  } catch (e) { return fail('create-session', e); }

  self.postMessage({
    type: 'ready', ep: activeEP, vocab: vocab,
    voices: Object.keys(voices), modelUrl: model.url
  });
}

/* Try execution providers in order, each fully bounded. A provider must both create()
 * AND pass a warm-up inference to count — an EP that creates but can't run (or hangs on
 * the first shader compile) is rejected and the next is tried. WebGPU is attempted only
 * when the worker actually exposes it (navigator.gpu); the documented ORT EP-array
 * fallback is unreliable on init error (#20729), so selection is explicit here. Each
 * attempt gets FRESH model bytes — ORT can transfer/detach the input buffer to its proxy
 * worker, which would poison the next provider's create() (#19157 / #10774). */
async function createSession(modelBytes) {
  var want = CFG.executionProviders || ['webgpu', 'wasm'];
  var eps = [];
  var hasGpu = (typeof navigator !== 'undefined') && !!navigator.gpu;
  if (want.indexOf('webgpu') !== -1 && hasGpu) eps.push('webgpu');
  if (want.indexOf('wasm') !== -1) eps.push('wasm');
  if (!eps.length) eps = ['wasm'];

  var lastErr = null;
  for (var i = 0; i < eps.length; i++) {
    var ep = eps[i];
    var isLast = i === eps.length - 1;
    // Non-final attempts get a copy so the original survives for the next provider;
    // the final attempt uses the original directly (no extra 310 MB peak on the common
    // single-provider path — matters on memory-tight mobile).
    var input = modelBytes;
    if (!isLast) { input = new Uint8Array(modelBytes.length); input.set(modelBytes); }
    var sess = null;
    try {
      self.postMessage({ type: 'phase', phase: 'create', ep: ep });
      sess = await withTimeout(
        ort.InferenceSession.create(input, { executionProviders: [ep] }),
        CREATE_TIMEOUT_MS, ep + ' session create');
      session = sess;
      activeEP = ep;
      inputStyle = session.inputNames.indexOf('input_ids') !== -1 ? 'input_ids' : 'tokens';
      // Warm-up = shader compile now (so the first real speak is fast) AND EP validation.
      self.postMessage({ type: 'phase', phase: 'warmup', ep: ep });
      await withTimeout(runInference('ʃalˈom', CFG.defaultVoice, 1.0), WARMUP_TIMEOUT_MS, ep + ' warm-up');
      return; // provider works
    } catch (e) {
      lastErr = e;
      session = null; activeEP = null; speedKind = null;
      try { if (sess && sess.release) await sess.release(); } catch (_) {}
    }
  }
  throw lastErr || new Error('no execution provider could load the model');
}

function tokenize(phonemes) {
  // Mirrors kokoro-onnx's Tokenizer.tokenize: per-char vocab lookup. The phonemizer
  // already validated against this vocab, so drops here indicate a bug upstream.
  var ids = [];
  for (var i = 0; i < phonemes.length; i++) {
    var id = vocab[phonemes[i]];
    if (id !== undefined) ids.push(id);
  }
  return ids;
}

function styleFor(voiceName, tokenCount) {
  var v = voices[voiceName] || voices[Object.keys(voices)[0]];
  if (!v) throw new Error('no voices loaded');
  var dim = v.shape[v.shape.length - 1];
  var rows = v.data.length / dim;
  var row = Math.min(tokenCount, rows - 1); // kokoro-onnx: voice[len(tokens)]
  return { data: v.data.subarray(row * dim, (row + 1) * dim), dim: dim };
}

/* Shared inference core (used by both real synth and the warm-up/EP-validation run).
 * Returns a freshly-copied Float32Array of samples so the caller can transfer it without
 * detaching ORT-owned memory. */
async function runInference(phonemes, voice, speed) {
  var ids = tokenize(phonemes);
  if (!ids.length) throw new Error('no tokens produced from "' + phonemes + '"');
  if (ids.length > MAX_PHONEME_LENGTH) {
    throw new Error('too many tokens (' + ids.length + ' > ' + MAX_PHONEME_LENGTH + ') — split the text');
  }
  var padded = new BigInt64Array(ids.length + 2);
  for (var i = 0; i < ids.length; i++) padded[i + 1] = BigInt(ids[i]);
  var style = styleFor(voice || CFG.defaultVoice, ids.length);

  var feeds = {};
  feeds[inputStyle] = new ort.Tensor('int64', padded, [1, padded.length]);
  feeds.style = new ort.Tensor('float32', new Float32Array(style.data), [1, style.dim]);

  // Export flavors disagree on the speed dtype (kokoro-onnx feeds int32 to the newer
  // export, float32 to the legacy one). Resolve adaptively once, then remember.
  var kinds = speedKind ? [speedKind] : ['float32', 'int32'];
  var out = null, lastErr = null;
  for (var k = 0; k < kinds.length && !out; k++) {
    try {
      feeds.speed = kinds[k] === 'float32'
        ? new ort.Tensor('float32', new Float32Array([speed]), [1])
        : new ort.Tensor('int32', new Int32Array([Math.max(1, Math.round(speed))]), [1]);
      out = await session.run(feeds);
      speedKind = kinds[k];
    } catch (e) { lastErr = e; }
  }
  if (!out) throw lastErr || new Error('inference failed');

  var first = out[session.outputNames[0]];
  var samples = first.data instanceof Float32Array ? first.data : Float32Array.from(first.data);
  var copy = new Float32Array(samples.length);
  copy.set(samples);
  return copy;
}

async function synth(msg) {
  if (!session) return fail('synth', new Error('session not initialized'), msg.id);
  try {
    var speed = typeof msg.speed === 'number' ? msg.speed : 1.0;
    var copy = await runInference(msg.phonemes, msg.voice, speed);
    self.postMessage({ type: 'result', id: msg.id, samples: copy, sampleRate: SAMPLE_RATE }, [copy.buffer]);
  } catch (e) { fail('synth', e, msg.id); }
}

self.onmessage = function (ev) {
  var msg = ev.data || {};
  if (msg.type === 'init') init(msg.cfg);
  else if (msg.type === 'synth') synth(msg);
  else if (msg.type === 'dispose') { try { if (session && session.release) session.release(); } catch (e) {} session = null; self.close(); }
};
