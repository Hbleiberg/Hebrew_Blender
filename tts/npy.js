/* IvritSuite Advanced TTS — minimal .npy / .npz parsing for the Kokoro voices file.
 *
 * voices-hebrew.bin is either (a) a NumPy .npz archive (ZIP magic "PK") of .npy arrays
 * keyed by voice name, or (b) a raw float32 blob for a single voice reshaped to
 * [-1, 1, 256]. This mirrors kokoro-onnx's np.load()-based loading (see CREDITS.md §4).
 * Detection is by magic bytes; both forms are supported.
 *
 * The .npz branch needs an unzip — fflate's UMD build must be loaded first (the worker
 * importScripts it from the pinned CDN; see tts-worker.js).
 *
 * Exposes NpyParser.{parseNpy, parseVoicesBin}. parseVoicesBin returns
 * { voiceName: { data: Float32Array, shape: [rows, 1, 256] }, ... }.
 */
(function (root) {
  'use strict';

  /* Parse one .npy buffer: \x93NUMPY magic, version, header (a Python dict literal
   * with descr/fortran_order/shape), then raw little-endian data. Supports the
   * '<f4' (float32) and '<f2' (float16, widened to float32) descrs Kokoro voices use. */
  function parseNpy(buf) {
    var u8 = buf instanceof Uint8Array ? u8copy(buf) : new Uint8Array(buf);
    if (!(u8[0] === 0x93 && u8[1] === 0x4E && u8[2] === 0x55 && u8[3] === 0x4D && u8[4] === 0x50 && u8[5] === 0x59)) {
      throw new Error('Not a .npy file (bad magic)');
    }
    var major = u8[6];
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var headerLen, dataStart;
    if (major >= 2) { headerLen = dv.getUint32(8, true); dataStart = 12 + headerLen; }
    else { headerLen = dv.getUint16(8, true); dataStart = 10 + headerLen; }
    var header = '';
    for (var i = dataStart - headerLen; i < dataStart; i++) header += String.fromCharCode(u8[i]);

    var descrM = header.match(/'descr'\s*:\s*'([^']+)'/);
    var shapeM = header.match(/'shape'\s*:\s*\(([^)]*)\)/);
    var fortranM = header.match(/'fortran_order'\s*:\s*(True|False)/);
    if (!descrM || !shapeM) throw new Error('Unparseable .npy header: ' + header.trim());
    if (fortranM && fortranM[1] === 'True') throw new Error('.npy fortran_order=True not supported');
    var descr = descrM[1];
    var shape = shapeM[1].split(',').map(function (s) { return parseInt(s.trim(), 10); }).filter(function (n) { return !isNaN(n); });
    var count = shape.reduce(function (a, b) { return a * b; }, 1);

    var data;
    if (descr === '<f4' || descr === '|f4' || descr === 'float32') {
      data = new Float32Array(count);
      for (var f = 0; f < count; f++) data[f] = dv.getFloat32(dataStart + f * 4, true);
    } else if (descr === '<f2') {
      data = new Float32Array(count);
      for (var h = 0; h < count; h++) data[h] = halfToFloat(dv.getUint16(dataStart + h * 2, true));
    } else {
      throw new Error('Unsupported .npy dtype "' + descr + '" (expected <f4 or <f2)');
    }
    return { data: data, shape: shape };
  }

  function u8copy(u8) { var out = new Uint8Array(u8.byteLength); out.set(u8); return out; }

  function halfToFloat(h) {
    var s = (h & 0x8000) ? -1 : 1, e = (h & 0x7C00) >> 10, f = h & 0x03FF;
    if (e === 0) return s * Math.pow(2, -14) * (f / 1024);
    if (e === 0x1F) return f ? NaN : s * Infinity;
    return s * Math.pow(2, e - 15) * (1 + f / 1024);
  }

  /* voices-hebrew.bin → { voiceName: {data, shape} }.
   * .npz: ZIP of "<voice>.npy" entries (unzipped with fflate, which the caller
   * guarantees is loaded). Raw blob: a single voice, float32, reshaped [-1, 1, 256],
   * stored under fallbackName. */
  function parseVoicesBin(buf, fallbackName, fflateLib) {
    var u8 = new Uint8Array(buf);
    var voices = {};
    if (u8[0] === 0x50 && u8[1] === 0x4B) { // "PK" → .npz
      var ff = fflateLib || (typeof fflate !== 'undefined' ? fflate : null);
      if (!ff) throw new Error('fflate is required to read .npz voices but is not loaded');
      var entries = ff.unzipSync(u8);
      Object.keys(entries).forEach(function (name) {
        var voice = name.replace(/\.npy$/, '');
        voices[voice] = parseNpy(entries[name]);
      });
      if (!Object.keys(voices).length) throw new Error('voices .npz contained no arrays');
      return voices;
    }
    if (buf.byteLength % 4 !== 0) throw new Error('voices raw blob length not float32-aligned');
    var flat = new Float32Array(buf.slice(0));
    if (flat.length % 256 !== 0) throw new Error('voices raw blob is not a multiple of 256 floats');
    voices[fallbackName || 'default'] = { data: flat, shape: [flat.length / 256, 1, 256] };
    return voices;
  }

  var NpyParser = { parseNpy: parseNpy, parseVoicesBin: parseVoicesBin };
  if (typeof module !== 'undefined' && module.exports) module.exports = NpyParser;
  else root.NpyParser = NpyParser;
})(typeof self !== 'undefined' ? self : this);
