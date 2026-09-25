/* IvritSuite Torah Trainer — chant pitch shifter (AudioWorklet processor 'tt-pitch').
   Transposes the PocketTorah recording by whole semitones without changing its tempo, so a student can
   move the cantor's key into their own voice while the word highlighting keeps its timing.

   Method: time-domain WSOLA (waveform-similarity overlap-add) with the resampling folded into the
   grain read. Every HS output samples a Hann-windowed grain of W output samples is read from the input
   ring at rate r = 2^(semitones/12) (linear interpolation) and overlap-added; its start is chosen by a
   normalized cross-correlation search (±DELTA) against the natural continuation of the previous grain,
   which keeps consecutive grains phase-coherent (no granular flutter) and makes r = 1 an exact identity
   (search settles on d = 0, the periodic Hann sums to 1 at hop W/2 → output = input delayed by D).
   The latency D is constant whatever the pitch, so moving the slider to or from 0 never jumps.

   Loaded by torah_trainer.html (same origin, CSP script-src 'self'); precached by sw.js, so an edit here
   needs its VERSION bump (the request destination is 'audioworklet', which the worker serves cache-first). */
class TtPitchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'semitones', defaultValue: 0, minValue: -12, maxValue: 12, automationRate: 'k-rate' }];
  }
  constructor() {
    super();
    const K = sampleRate > 60000 ? 2 : 1;      // keep the grain ≈43 ms at 88.2/96 kHz
    this.W = 2048 * K;                          // grain length (output samples)
    this.HS = this.W >> 1;                      // synthesis hop (50 % overlap)
    this.DELTA = 768 * K;                       // search half-range: ≥ one period down to ~60 Hz
    this.D = this.W + this.DELTA + 128;         // constant latency (≈61 ms at 48 kHz)
    this.RING = 16384 * K; this.M = this.RING - 1;      // input ring (power of two, masked)
    this.ORING = 8192 * K; this.OM = this.ORING - 1;    // output overlap-add ring
    this.SEMI = Math.pow(2, 1 / 12);
    this.win = new Float32Array(this.W);        // periodic Hann: win[j] + win[j + HS] = 1
    for (let j = 0; j < this.W; j++) this.win[j] = 0.5 - 0.5 * Math.cos(2 * Math.PI * j / this.W);
    this.ring = []; this.oring = [];
    this.mix = new Float32Array(this.RING);     // mono mix: one search, the same offset for every channel
    this.inW = 0;                               // input samples received (absolute)
    this.outN = 0;                              // output samples emitted (absolute)
    this.nextGrain = 0;                         // synthesis position of the next grain (multiple of HS)
    this.prevStart = 0; this.rPrev = 1; this.r = 1; this.have = false;
  }
  _alloc(n) {
    while (this.ring.length < n) { this.ring.push(new Float32Array(this.RING)); this.oring.push(new Float32Array(this.ORING)); }
  }
  process(inputs, outputs, params) {
    const inp = inputs[0], out = outputs[0];
    if (!inp || !inp.length || !out || !out.length) return true;   // nothing connected yet: silence out, state frozen
    const nCh = out.length, nIn = inp.length, q = out[0].length;
    this._alloc(nCh);
    const M = this.M, OM = this.OM;
    // 1. append the block to the input ring
    for (let i = 0; i < q; i++) {
      const w = (this.inW + i) & M;
      let sum = 0;
      for (let c = 0; c < nCh; c++) { const v = inp[c < nIn ? c : nIn - 1][i]; this.ring[c][w] = v; sum += v; }
      this.mix[w] = sum / nCh;
    }
    this.inW += q;
    // 2. synthesize every grain whose window starts inside this output block
    const target = Math.pow(2, params.semitones[0] / 12);
    while (this.nextGrain < this.outN + q) { this._grain(this.nextGrain, target, nCh); this.nextGrain += this.HS; }
    // 3. emit the completed samples and clear their slots for reuse
    for (let c = 0; c < nCh; c++) {
      const o = out[c], oring = this.oring[c];
      for (let i = 0; i < q; i++) { const j = (this.outN + i) & OM; o[i] = oring[j]; oring[j] = 0; }
    }
    this.outN += q;
    return true;
  }
  _grain(s, target, nCh) {
    let r = target;
    if (this.have) {   // glide at most one semitone per grain: a slider drag never clicks
      const lo = this.r / this.SEMI, hi = this.r * this.SEMI;
      r = target < lo ? lo : target > hi ? hi : target;
    }
    this.r = r;
    const W = this.W, M = this.M, OM = this.OM, win = this.win;
    // The read window ENDS at s - D + W whatever r is, so the newest input sample it can touch is
    // nominal + r*W + DELTA = s - 128 ≤ inW - 128: always already received.
    const nominal = s - this.D + W - r * W;
    const d = this.have ? this._search(this.prevStart + this.rPrev * this.HS, nominal, r) : 0;
    const start = nominal + d;
    for (let c = 0; c < nCh; c++) {
      const ring = this.ring[c], oring = this.oring[c];
      for (let j = 0; j < W; j++) {
        const p = start + r * j, i0 = Math.floor(p), f = p - i0;
        oring[(s + j) & OM] += (ring[i0 & M] * (1 - f) + ring[(i0 + 1) & M] * f) * win[j];
      }
    }
    this.prevStart = start; this.rPrev = r; this.have = true;
  }
  // Offset d in [-DELTA, DELTA] whose grain best continues the previous one: normalized cross-correlation
  // between the previous grain's natural continuation (tpl…) and the candidate (nominal + d…), over the
  // overlap region L, coarse (step 4) then refined (±3). Ties prefer the smaller |d|, so the read position
  // never drifts away from the absolute nominal; silence returns 0.
  _search(tpl, nominal, r) {
    const mix = this.mix, M = this.M, HS = this.HS, DELTA = this.DELTA;
    const L = Math.min(Math.round(r * HS), 2 * HS);
    const t0 = Math.round(tpl), c0 = Math.round(nominal);
    let et = 0;
    for (let m = 0; m < L; m += 4) { const v = mix[(t0 + m) & M]; et += v * v; }
    if (et < 1e-7) return 0;
    const ncc = (d, step) => {
      let num = 0, ec = 0;
      for (let m = 0; m < L; m += step) { const a = mix[(t0 + m) & M], b = mix[(c0 + d + m) & M]; num += a * b; ec += b * b; }
      return num / Math.sqrt(ec * et + 1e-12);
    };
    let best = -Infinity, bd = 0;
    for (let d = -DELTA; d <= DELTA; d += 4) {
      const sc = ncc(d, 4);
      if (sc > best + 1e-4 || (Math.abs(sc - best) <= 1e-4 && Math.abs(d) < Math.abs(bd))) { best = sc; bd = d; }
    }
    const center = bd, lo = Math.max(-DELTA, center - 3), hi = Math.min(DELTA, center + 3);
    best = -Infinity; bd = center;
    for (let d = lo; d <= hi; d++) {
      const sc = ncc(d, 1);
      if (sc > best + 1e-4 || (Math.abs(sc - best) <= 1e-4 && Math.abs(d) < Math.abs(bd))) { best = sc; bd = d; }
    }
    return bd;
  }
}
registerProcessor('tt-pitch', TtPitchProcessor);
