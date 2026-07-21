/* IvritSuite Advanced TTS — main-thread engine (window.HebrewTTS).
 *
 * Fully client-side Hebrew TTS: rule-based phonemizer (tts/phonemizer.js) → Kokoro
 * Hebrew ONNX model in a Web Worker (tts/tts-worker.js) → 16-bit WAV clips cached in
 * IndexedDB so every unique word is slow exactly once per device, then instant.
 *
 * Licensing: the Hebrew voice model is NON-COMMERCIAL (see CREDITS.md). Weights are
 * fetched at runtime from Hugging Face — never bundled or redistributed by this repo.
 *
 * Public API (all methods safe to call any time):
 *   HebrewTTS.enable(opts)      — MUST be called from a user gesture; downloads +
 *                                 warms the model, resolves when ready.
 *   HebrewTTS.speak(text, opts) — phonemize → IndexedDB cache → synth → play.
 *                                 opts: {voice, speed, el}. Returns a Promise.
 *   HebrewTTS.prefetch(texts)   — idle-time background synthesis, abortable.
 *   HebrewTTS.stop()            — stop current playback.
 *   HebrewTTS.isReady() / HebrewTTS.getStatus() / HebrewTTS.on(event, fn)
 *   Events: 'state', 'progress', 'speakstart', 'speakend', 'error'.
 *
 * States: uninitialized → initializing → ready ⇄ suspended (idle teardown frees the
 * worker/session RAM after IDLE_TEARDOWN_MS; re-init from Cache API is cheap) — or
 * 'webspeech' (Web Speech he-IL fallback) / 'unavailable' on hard failure.
 */
(function (root) {
  'use strict';

  /* ═══ Advanced-TTS asset configuration — the ONE place model URLs live ═══
   * If the model host ever changes: update these, bump MODEL_VERSION (invalidates the
   * Cache API copies cleanly), and update the integrated pages' CSP connect-src (see
   * README "Voice & Audio Credits" + tools/README.md). Versions are pinned; jsdelivr
   * versioned URLs are immutable. SRI note: these libraries are loaded inside the
   * worker via importScripts(), which has no SRI mechanism — exact-version pinning on
   * an immutable CDN is the integrity control. */
  var TTS_CONFIG = {
    MODEL_VERSION: 'hebrew-nc-1',
    HF_BASE: 'https://huggingface.co/thewh1teagle/kokoro-hebrew-nc/resolve/main/',
    get MODEL_URL() { return this.HF_BASE + 'kokoro.onnx'; },          // fp32, ~310 MB
    get MODEL_INT8_URL() { return this.HF_BASE + 'kokoro.int8.onnx'; },// preferred if upstream ships it
    get VOICES_URL() { return this.HF_BASE + 'voices-hebrew.bin'; },
    get CONFIG_URL() { return this.HF_BASE + 'config.json'; },
    ORT_BASE: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/',
    get ORT_SCRIPT() { return this.ORT_BASE + 'ort.webgpu.min.js'; },  // WebGPU + WASM fallback bundle
    FFLATE_URL: 'https://cdn.jsdelivr.net/npm/fflate@0.8.3/umd/index.js',
    WORKER_URL: '/tts/tts-worker.js',
    NPY_URL: '/tts/npy.js',
    CACHE_NAME: 'tts-models-v1',          // kept across deploys by sw.js activate keep-list
    DB_NAME: 'ivritsuite-tts', DB_VERSION: 1, STORE: 'tts-audio',
    DEFAULT_VOICE: 'he_shaul',
    MODEL_SIZE_HINT_MB: 310,
    IDLE_TEARDOWN_MS: 5 * 60 * 1000,
    MAX_CLIPS: 4000,                      // soft IndexedDB cap; oldest pruned beyond this
    ENABLED_FLAG: 'ivritSuite_ttsEnabled',    // per-device (model lives on this device)
    VOCAB_CACHE: 'ivritSuite_ttsVocab'        // vocab snapshot for workerless cache-hits
  };

  var state = 'uninitialized';
  var worker = null;
  var activeEP = null;
  var chosenModelUrl = null;
  var audioCtx = null;
  var currentSource = null;
  var currentEl = null;
  var idleTimer = null;
  var initPromise = null;
  var pendingSynth = {};   // id → {resolve, reject}
  var synthSeq = 0;
  var prefetchToken = 0;
  var listeners = {};

  function emit(ev, data) { (listeners[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) {} }); }
  function setState(s, detail) { state = s; emit('state', { state: s, detail: detail }); }

  // ── IndexedDB WAV-clip cache ───────────────────────────────────────────────
  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(TTS_CONFIG.DB_NAME, TTS_CONFIG.DB_VERSION);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(TTS_CONFIG.STORE)) {
          var store = db.createObjectStore(TTS_CONFIG.STORE, { keyPath: 'key' });
          store.createIndex('created', 'created');
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbGet(key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(TTS_CONFIG.STORE, 'readonly');
        var rq = tx.objectStore(TTS_CONFIG.STORE).get(key);
        rq.onsuccess = function () { resolve(rq.result || null); };
        rq.onerror = function () { resolve(null); };
      });
    }).catch(function () { return null; });
  }
  function idbPut(record) {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(TTS_CONFIG.STORE, 'readwrite');
        tx.objectStore(TTS_CONFIG.STORE).put(record);
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    }).catch(function () { return false; });
  }
  function idbCount() {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var rq = db.transaction(TTS_CONFIG.STORE, 'readonly').objectStore(TTS_CONFIG.STORE).count();
        rq.onsuccess = function () { resolve(rq.result); };
        rq.onerror = function () { resolve(0); };
      });
    }).catch(function () { return 0; });
  }
  function idbPrune() {
    idbCount().then(function (n) {
      if (n <= TTS_CONFIG.MAX_CLIPS) return;
      openDb().then(function (db) {
        var tx = db.transaction(TTS_CONFIG.STORE, 'readwrite');
        var idx = tx.objectStore(TTS_CONFIG.STORE).index('created');
        var toDelete = n - TTS_CONFIG.MAX_CLIPS + 200;
        idx.openCursor().onsuccess = function (ev) {
          var cur = ev.target.result;
          if (cur && toDelete-- > 0) { cur.delete(); cur.continue(); }
        };
      });
    });
  }
  function idbClear() {
    return openDb().then(function (db) {
      return new Promise(function (resolve) {
        var tx = db.transaction(TTS_CONFIG.STORE, 'readwrite');
        tx.objectStore(TTS_CONFIG.STORE).clear();
        tx.oncomplete = function () { resolve(true); };
        tx.onerror = function () { resolve(false); };
      });
    }).catch(function () { return false; });
  }

  // ── cache key: hash(modelVersion|voice|speed|phonemes) ─────────────────────
  function clipKey(phonemes, voice, speed) {
    var raw = TTS_CONFIG.MODEL_VERSION + '|' + voice + '|' + speed + '|' + phonemes;
    if (root.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)).then(function (buf) {
        var b = new Uint8Array(buf), hex = '';
        for (var i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, '0');
        return hex;
      });
    }
    var h = 5381; // djb2 fallback (non-secure contexts only)
    for (var i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
    return Promise.resolve('djb2-' + (h >>> 0).toString(16) + '-' + raw.length);
  }

  // ── WAV encode (16-bit PCM mono) ───────────────────────────────────────────
  function encodeWav(samples, sampleRate) {
    var len = samples.length;
    var buf = new ArrayBuffer(44 + len * 2);
    var dv = new DataView(buf);
    function ws(off, s) { for (var i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i)); }
    ws(0, 'RIFF'); dv.setUint32(4, 36 + len * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    ws(36, 'data'); dv.setUint32(40, len * 2, true);
    for (var i = 0; i < len; i++) {
      var s = Math.max(-1, Math.min(1, samples[i]));
      dv.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return new Blob([buf], { type: 'audio/wav' });
  }

  // ── playback ───────────────────────────────────────────────────────────────
  function ensureAudioCtx() {
    if (!audioCtx) {
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) throw new Error('Web Audio API unavailable');
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function stopPlayback() {
    var wasPlaying = !!currentSource;
    if (currentSource) { try { currentSource.stop(); } catch (e) {} currentSource = null; }
    if (wasPlaying) { emit('speakend', { el: currentEl }); }
    currentEl = null;
  }
  function playBlob(blob, el) {
    return blob.arrayBuffer().then(function (buf) {
      var ctx = ensureAudioCtx();
      return new Promise(function (resolve, reject) {
        ctx.decodeAudioData(buf.slice(0), function (audio) {
          stopPlayback();
          var src = ctx.createBufferSource();
          src.buffer = audio;
          src.connect(ctx.destination);
          currentSource = src;
          currentEl = el || null;
          emit('speakstart', { el: currentEl });
          src.onended = function () {
            if (currentSource === src) { currentSource = null; emit('speakend', { el: currentEl }); currentEl = null; }
            resolve();
          };
          src.start();
        }, reject);
      });
    });
  }

  // ── worker lifecycle ───────────────────────────────────────────────────────
  function workerCfg() {
    return {
      modelVersion: TTS_CONFIG.MODEL_VERSION,
      modelUrl: TTS_CONFIG.MODEL_URL,
      modelInt8Url: TTS_CONFIG.MODEL_INT8_URL,
      voicesUrl: TTS_CONFIG.VOICES_URL,
      configUrl: TTS_CONFIG.CONFIG_URL,
      ortBase: TTS_CONFIG.ORT_BASE,
      ortScript: TTS_CONFIG.ORT_SCRIPT,
      fflateUrl: TTS_CONFIG.FFLATE_URL,
      npyUrl: TTS_CONFIG.NPY_URL,
      cacheName: TTS_CONFIG.CACHE_NAME,
      defaultVoice: TTS_CONFIG.DEFAULT_VOICE
    };
  }

  function bootWorker() {
    if (initPromise) return initPromise;
    setState('initializing');
    initPromise = new Promise(function (resolve, reject) {
      var w;
      try { w = new Worker(TTS_CONFIG.WORKER_URL); }
      catch (e) { initPromise = null; return reject(e); }
      w.onerror = function (e) {
        if (state === 'initializing') { initPromise = null; reject(new Error('worker error: ' + (e.message || 'load failed'))); }
      };
      w.onmessage = function (ev) {
        var msg = ev.data || {};
        if (msg.type === 'progress') {
          emit('progress', { loaded: msg.loaded, total: msg.total });
        } else if (msg.type === 'ready') {
          worker = w;
          activeEP = msg.ep;
          chosenModelUrl = msg.modelUrl;
          if (root.HebrewPhonemizer) HebrewPhonemizer.setVocab(msg.vocab);
          try { localStorage.setItem(TTS_CONFIG.VOCAB_CACHE, JSON.stringify(msg.vocab)); } catch (e) {}
          setState('ready', { ep: msg.ep });
          resolve();
        } else if (msg.type === 'result') {
          var p = pendingSynth[msg.id];
          if (p) { delete pendingSynth[msg.id]; p.resolve({ samples: msg.samples, sampleRate: msg.sampleRate }); }
        } else if (msg.type === 'error') {
          if (msg.id !== undefined && pendingSynth[msg.id]) {
            var pe = pendingSynth[msg.id]; delete pendingSynth[msg.id];
            pe.reject(new Error(msg.stage + ': ' + msg.message));
          } else if (state === 'initializing') {
            initPromise = null;
            try { w.terminate(); } catch (e) {}
            reject(new Error(msg.stage + ': ' + msg.message));
          } else {
            emit('error', { stage: msg.stage, message: msg.message });
          }
        }
      };
      w.postMessage({ type: 'init', cfg: workerCfg() });
    });
    return initPromise;
  }

  function teardownWorker() {
    if (!worker) return;
    try { worker.postMessage({ type: 'dispose' }); } catch (e) {}
    try { worker.terminate(); } catch (e) {}
    worker = null;
    initPromise = null;
    if (state === 'ready') setState('suspended');
  }
  function touchIdle() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(teardownWorker, TTS_CONFIG.IDLE_TEARDOWN_MS);
  }

  function restoreVocab() {
    if (root.HebrewPhonemizer && !HebrewPhonemizer.getVocab()) {
      try {
        var cached = localStorage.getItem(TTS_CONFIG.VOCAB_CACHE);
        if (cached) HebrewPhonemizer.setVocab(JSON.parse(cached));
      } catch (e) {}
    }
  }

  function workerSynth(phonemes, voice, speed) {
    var id = ++synthSeq;
    return new Promise(function (resolve, reject) {
      pendingSynth[id] = { resolve: resolve, reject: reject };
      worker.postMessage({ type: 'synth', id: id, phonemes: phonemes, voice: voice, speed: speed });
      setTimeout(function () {
        if (pendingSynth[id]) { delete pendingSynth[id]; reject(new Error('synthesis timed out')); }
      }, 60000);
    });
  }

  // ── Web Speech fallback ────────────────────────────────────────────────────
  function hasHebrewWebSpeech() {
    if (!root.speechSynthesis) return false;
    try {
      return speechSynthesis.getVoices().some(function (v) { return /^he(-|_|$)/i.test(v.lang); });
    } catch (e) { return false; }
  }
  function webSpeechSpeak(text, opts) {
    var utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'he-IL';
    utt.rate = (opts && opts.speed) || 1.0;
    speechSynthesis.cancel();
    speechSynthesis.speak(utt);
    return Promise.resolve();
  }

  // ── synth-to-cache core (shared by speak + prefetch) ───────────────────────
  function synthToCache(text, voice, speed) {
    restoreVocab();
    var phonemes = HebrewPhonemizer.phonemize(text);
    return clipKey(phonemes, voice, speed).then(function (key) {
      return idbGet(key).then(function (hit) {
        if (hit) { emit('clip', { cached: true, text: text }); return { blob: hit.blob, cached: true }; }
        return bootWorker().then(function () {
          touchIdle();
          return workerSynth(phonemes, voice, speed).then(function (res) {
            var blob = encodeWav(res.samples, res.sampleRate);
            idbPut({ key: key, blob: blob, created: Date.now(), bytes: blob.size, text: text }).then(idbPrune);
            emit('clip', { cached: false, text: text });
            return { blob: blob, cached: false };
          });
        });
      });
    });
  }

  // ── public API ─────────────────────────────────────────────────────────────
  var HebrewTTS = {
    CONFIG: TTS_CONFIG,
    on: function (ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },

    /* Call from a user gesture. Downloads (with 'progress' events), creates the
     * session, pre-warms with a dummy synth so the first real speak is fast. */
    enable: function () {
      try { ensureAudioCtx(); } catch (e) { /* still usable for cache+download */ }
      return bootWorker().then(function () {
        try { localStorage.setItem(TTS_CONFIG.ENABLED_FLAG, '1'); } catch (e) {}
        touchIdle();
        return workerSynth('ʃalˈom', TTS_CONFIG.DEFAULT_VOICE, 1.0).then(function () {}, function () {});
      }).catch(function (err) {
        if (hasHebrewWebSpeech()) setState('webspeech', { reason: err.message });
        else setState('unavailable', { reason: err.message });
        throw err;
      });
    },

    /* Speak pointed-Hebrew text. Cache hit plays immediately (<100 ms); miss synths,
     * stores, plays. In 'webspeech' state, routes to the browser voice instead. */
    speak: function (text, opts) {
      opts = opts || {};
      var voice = opts.voice || TTS_CONFIG.DEFAULT_VOICE;
      var speed = typeof opts.speed === 'number' ? opts.speed : 1.0;
      if (state === 'webspeech') return webSpeechSpeak(text, opts);
      if (state === 'unavailable') return Promise.reject(new Error('advanced TTS unavailable on this device'));
      return synthToCache(text, voice, speed).then(function (res) {
        touchIdle();
        return playBlob(res.blob, opts.el);
      }).catch(function (err) {
        if (hasHebrewWebSpeech() && state !== 'ready') { setState('webspeech', { reason: err.message }); return webSpeechSpeak(text, opts); }
        emit('error', { stage: 'speak', message: err.message });
        throw err;
      });
    },

    /* Background-synthesize an array of texts at idle priority. Returns a cancel fn;
     * also auto-aborted whenever prefetch() is called again (grid regenerated). */
    prefetch: function (texts, opts) {
      opts = opts || {};
      var token = ++prefetchToken;
      var queue = (texts || []).slice();
      var voice = opts.voice || TTS_CONFIG.DEFAULT_VOICE;
      var speed = typeof opts.speed === 'number' ? opts.speed : 1.0;
      var ric = root.requestIdleCallback || function (fn) { return setTimeout(function () { fn({ timeRemaining: function () { return 50; } }); }, 500); };
      function pump() {
        if (token !== prefetchToken || !queue.length || state === 'webspeech' || state === 'unavailable') return;
        var text = queue.shift();
        synthToCache(text, voice, speed).catch(function () {}).then(function () {
          if (token === prefetchToken && queue.length) ric(pump);
        });
      }
      ric(pump);
      return function cancel() { if (token === prefetchToken) prefetchToken++; };
    },

    stop: function () {
      stopPlayback();
      if (root.speechSynthesis) { try { speechSynthesis.cancel(); } catch (e) {} }
    },

    isReady: function () { return state === 'ready'; },
    isEnabledOnDevice: function () {
      try { return localStorage.getItem(TTS_CONFIG.ENABLED_FLAG) === '1'; } catch (e) { return false; }
    },
    getState: function () { return state; },

    getStatus: function () {
      return Promise.all([
        idbCount(),
        caches.has ? caches.open(TTS_CONFIG.CACHE_NAME).then(function (c) { return c.keys(); }).then(function (k) { return k.length; }).catch(function () { return 0; }) : Promise.resolve(0)
      ]).then(function (r) {
        return {
          state: state, ep: activeEP, modelUrl: chosenModelUrl,
          modelVersion: TTS_CONFIG.MODEL_VERSION,
          cachedClips: r[0], cachedModelFiles: r[1],
          vocabLoaded: !!(root.HebrewPhonemizer && HebrewPhonemizer.getVocab())
        };
      });
    },

    /* test-harness helpers */
    clearClipCache: idbClear,
    clearModelCache: function () {
      try { localStorage.removeItem(TTS_CONFIG.ENABLED_FLAG); localStorage.removeItem(TTS_CONFIG.VOCAB_CACHE); } catch (e) {}
      return caches.delete ? caches.delete(TTS_CONFIG.CACHE_NAME) : Promise.resolve(false);
    },
    _teardownForTest: teardownWorker
  };

  root.HebrewTTS = HebrewTTS;
})(typeof self !== 'undefined' ? self : this);
