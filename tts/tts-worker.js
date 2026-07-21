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
  if (CFG.modelInt8Url) {
    try {
      var head = await fetch(CFG.modelInt8Url, { method: 'HEAD' });
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
    var eps = CFG.executionProviders || ['webgpu', 'wasm'];
    var lastErr = null;
    for (var i = 0; i < eps.length && !session; i++) {
      try {
        session = await ort.InferenceSession.create(modelBuf, { executionProviders: [eps[i]] });
        activeEP = eps[i];
      } catch (e) { lastErr = e; }
    }
    if (!session) throw lastErr || new Error('no execution provider available');
    inputStyle = session.inputNames.indexOf('input_ids') !== -1 ? 'input_ids' : 'tokens';
  } catch (e) { return fail('create-session', e); }

  self.postMessage({
    type: 'ready', ep: activeEP, vocab: vocab,
    voices: Object.keys(voices), modelUrl: model.url
  });
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

async function synth(msg) {
  if (!session) return fail('synth', new Error('session not initialized'), msg.id);
  try {
    var ids = tokenize(msg.phonemes);
    if (!ids.length) throw new Error('no tokens produced from "' + msg.phonemes + '"');
    if (ids.length > MAX_PHONEME_LENGTH) {
      throw new Error('too many tokens (' + ids.length + ' > ' + MAX_PHONEME_LENGTH + ') — split the text');
    }
    var padded = new BigInt64Array(ids.length + 2);
    for (var i = 0; i < ids.length; i++) padded[i + 1] = BigInt(ids[i]);
    var style = styleFor(msg.voice || CFG.defaultVoice, ids.length);
    var speed = typeof msg.speed === 'number' ? msg.speed : 1.0;

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
    // Copy so the transfer never detaches ORT-owned memory.
    var copy = new Float32Array(samples.length);
    copy.set(samples);
    self.postMessage({ type: 'result', id: msg.id, samples: copy, sampleRate: SAMPLE_RATE }, [copy.buffer]);
  } catch (e) { fail('synth', e, msg.id); }
}

self.onmessage = function (ev) {
  var msg = ev.data || {};
  if (msg.type === 'init') init(msg.cfg);
  else if (msg.type === 'synth') synth(msg);
  else if (msg.type === 'dispose') { try { if (session && session.release) session.release(); } catch (e) {} session = null; self.close(); }
};
