#!/usr/bin/env node
/**
 * build-trope-motifs.mjs — build data/trope/trope_motifs.json for trope_tutor.html.
 *
 * Machine-drafts a Western-notation melodic motif for every cantillation mark by
 * pitch-tracking the same PocketTorah clips the Trope Tutor's Learn cards play
 * (examples come straight from data/trope/trope_index.json):
 *   { v:1, system:"torah", built:"YYYY-MM-DD", license:"...",
 *     tropes: { "<tropeKey>": { notes:[{p,d},...], verified:false } } }
 * where p = pitch in semitones relative to the reciting/reference tone (the
 * clip's final sustained pitch, rendered as B on the middle line of a treble
 * staff) and d = relative duration units 1–4. Every emitted entry is
 * verified:false — a DRAFT. A human verifies each motif by ear (the page's
 * ?debug=motifs audition mode), hand-corrects the JSON, and flips verified to
 * true; re-running this script preserves verified entries verbatim.
 *
 * Pipeline per trope: pick 2–3 example clips (prefer longer, multi-syllable
 * words; prefer aliyah MP3s already being downloaded), download + cache the
 * MP3s, decode, slice s→e, YIN pitch detection (80–400 Hz), quantize to
 * semitones vs the final sustained pitch, collapse runs into notes, and pick
 * the medoid contour across the examples. docs/trope_motifs_report.md shows
 * every per-example contour so cross-example disagreements stay visible.
 *
 * Run from anywhere:
 *   node scripts/build-trope-motifs.mjs [--force] [--only=<tropeKey>]
 *
 *   (default)      re-analyze every trope EXCEPT entries already verified:true
 *                  in the existing trope_motifs.json (those copy through
 *                  verbatim — human work is never clobbered)
 *   --force        re-analyze everything, including verified entries
 *   --only=mercha  re-analyze just that key; all other existing entries
 *                  (verified or not) copy through verbatim
 *
 * ONE dependency (deliberate exception to the repo's zero-dep builder rule):
 * MP3 decoding uses the pure-WASM `mpg123-decoder` npm package — there is no
 * reasonable pure-stdlib MP3 decoder, and this machine has no ffmpeg/sox.
 * `npm install mpg123-decoder` at the repo root; node_modules/, package.json,
 * and package-lock.json are already gitignored, so nothing gets committed.
 * The pitch detector itself (YIN) is plain JS below.
 *
 * MP3s are cached in source-data/motif-cache/ (gitignored), so re-runs are
 * offline and byte-identical. Downloads go through curl (Node fetch ignores
 * HTTPS_PROXY). The script exits non-zero if any smoke test fails — never
 * commit its output without a green run.
 *
 * Licensing: the transcriptions are derived from PocketTorah recordings
 * (© Russel Neiss & Rabbi Charlie Schwartz, CC BY-SA 4.0), so the output JSON
 * and report are likewise CC BY-SA 4.0 (noted in both).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(repoRoot, 'data', 'trope', 'trope_index.json');
const MANIFEST_PATH = join(repoRoot, 'data', 'pockettorah', 'manifest.json');
const MOTIFS_PATH = join(repoRoot, 'data', 'trope', 'trope_motifs.json');
const REPORT_PATH = join(repoRoot, 'docs', 'trope_motifs_report.md');
const CACHE_DIR = join(repoRoot, 'source-data', 'motif-cache');

const POCKET_AUDIO_BASE = 'https://raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio/';
const LICENSE_NOTE =
  'Motif transcriptions machine-drafted from PocketTorah recordings © Russel Neiss & Rabbi Charlie Schwartz (CC BY-SA 4.0); this file is likewise CC BY-SA 4.0.';

const FORCE = process.argv.includes('--force');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;
for (const a of process.argv.slice(2)) {
  if (a !== '--force' && !a.startsWith('--only=')) {
    console.error(`Unknown argument ${a} (use --force and/or --only=<tropeKey>)`);
    process.exit(1);
  }
}

/* ── analysis constants ─────────────────────────────────────────────────── */
const EXAMPLES_PER_TROPE = 3;
const F0_MIN = 80, F0_MAX = 400;      // male chant fundamental band, Hz
const HOP_SEC = 0.01;                 // 10 ms analysis hop
const YIN_THRESHOLD = 0.15;           // CMND dip threshold
const RMS_GATE = 0.35;                // frame RMS < gate × clip median RMS → unvoiced
const REF_MIN_SEC = 0.12;             // min length of the final "sustained" segment
const BLIP_SEC = 0.06;                // segments shorter than this merge into a neighbor
const GAP_SEC = 0.06;                 // voiced-frame gap that breaks a note segment
const MAX_NOTES = 8;
const MAX_D = 4;
const SIZE_BUDGET = 16 * 1024;        // bytes, output JSON

/* ── deps ───────────────────────────────────────────────────────────────── */
let MPEGDecoder;
try {
  ({ MPEGDecoder } = await import('mpg123-decoder'));
} catch {
  console.error('Missing dependency: mpg123-decoder (pure-WASM MP3 decoder).');
  console.error('Run:  npm install mpg123-decoder');
  console.error('(node_modules/, package.json, package-lock.json are already gitignored — nothing gets committed.)');
  process.exit(1);
}

/* ── small utils ────────────────────────────────────────────────────────── */
function readRepoJSON(rel) {
  let txt = readFileSync(join(repoRoot, rel), 'utf8');
  if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
  return JSON.parse(txt);
}
function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const round2 = (x) => Math.round(x * 100) / 100;
// Niqqud vowel points (hataf segol U+05B1 … qubuts U+05BB, + qamats qatan
// U+05C7) as a syllable-count proxy — favors words that carry the full motif.
const syllCount = (he) => (he.match(/[ֱ-ׇֻ]/g) || []).length;

/* ── example selection ──────────────────────────────────────────────────── */
function selectExamples(pool, plannedFiles) {
  const cands = pool.map((ex, i) => ({
    ex, i,
    base: Math.min(ex.e - ex.s, 3.0) + 0.3 * syllCount(ex.he),
  }));
  const picked = [];
  const pickedWords = new Set();
  while (picked.length < EXAMPLES_PER_TROPE) {
    let best = null;
    for (const c of cands) {
      if (c.done || pickedWords.has(c.ex.he)) continue;
      const eff = c.base + (plannedFiles.has(c.ex.p + '|' + c.ex.a) ? 0.4 : 0);
      if (!best || eff > best.eff || (eff === best.eff && c.i < best.c.i)) best = { c, eff };
    }
    if (!best) break;
    best.c.done = true;
    picked.push({ ex: best.c.ex, score: best.eff });
    pickedWords.add(best.c.ex.he);
    plannedFiles.add(best.c.ex.p + '|' + best.c.ex.a);
  }
  return picked;
}

/* ── MP3 download + cache (curl: Node fetch ignores HTTPS_PROXY) ────────── */
let downloads = 0, cacheHits = 0;
function cachedMp3(audioBase, a) {
  const file = audioBase + '-' + a + '.mp3';
  const name = file.replace(/[^\w.-]/g, '_');
  const path = join(CACHE_DIR, name);
  if (existsSync(path)) { cacheHits++; return path; }
  mkdirSync(CACHE_DIR, { recursive: true });
  const url = POCKET_AUDIO_BASE + encodeURIComponent(file);
  console.log(`  downloading ${file} …`);
  execFileSync('curl', ['-sS', '--fail', '--max-time', '300', '-o', path + '.part', url]);
  renameSync(path + '.part', path); // never leave a truncated file under the real name
  downloads++;
  return path;
}

/* ── decode + clip slicing ──────────────────────────────────────────────── */
async function decodeMp3(decoder, path) {
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(path)));
  return { channelData, sampleRate };
}
// Mixdown to mono and (at CD-ish rates) decimate by 2: YIN cost scales with
// rate², and 22.05 kHz is ample for an 80–400 Hz fundamental.
function clipPcm(decoded, s, e) {
  const { channelData, sampleRate } = decoded;
  const a = Math.max(0, Math.floor(s * sampleRate));
  const b = Math.min(channelData[0].length, Math.ceil(e * sampleRate));
  const n = Math.max(0, b - a);
  const ch = channelData.length;
  const dec = sampleRate >= 32000 ? 2 : 1;
  const out = new Float32Array(Math.floor(n / dec));
  for (let i = 0; i < out.length; i++) {
    let v = 0;
    for (let k = 0; k < dec; k++) {
      const j = a + i * dec + k;
      for (let c = 0; c < ch; c++) v += channelData[c][j];
    }
    out[i] = v / (ch * dec);
  }
  return { x: out, rate: sampleRate / dec };
}

/* ── YIN pitch tracking ─────────────────────────────────────────────────── */
function yinTrack(x, rate) {
  const W = rate >= 32000 ? 2048 : 1024;
  const hop = Math.max(1, Math.round(rate * HOP_SEC));
  const tauMin = Math.max(2, Math.floor(rate / F0_MAX));
  const tauMax = Math.ceil(rate / F0_MIN);
  const frames = [];
  if (x.length < W + tauMax + 1) return frames;
  const d = new Float64Array(tauMax + 1);
  for (let start = 0; start + W + tauMax < x.length; start += hop) {
    let rms = 0;
    for (let j = start; j < start + W; j++) rms += x[j] * x[j];
    rms = Math.sqrt(rms / W);
    // difference function
    for (let tau = 1; tau <= tauMax; tau++) {
      let sum = 0;
      for (let j = 0; j < W; j++) {
        const diff = x[start + j] - x[start + j + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
    }
    // cumulative-mean-normalized difference
    let cum = 0, tauBest = -1;
    const dn = new Float64Array(tauMax + 1);
    dn[0] = 1;
    for (let tau = 1; tau <= tauMax; tau++) {
      cum += d[tau];
      dn[tau] = cum > 0 ? (d[tau] * tau) / cum : 1;
    }
    for (let tau = tauMin; tau <= tauMax; tau++) {
      if (dn[tau] < YIN_THRESHOLD) {
        while (tau + 1 <= tauMax && dn[tau + 1] < dn[tau]) tau++;
        tauBest = tau;
        break;
      }
    }
    let midi = null;
    if (tauBest > 0) {
      let tau = tauBest;
      if (tau > 1 && tau < tauMax) { // parabolic interpolation for sub-sample tau
        const a0 = dn[tau - 1], a1 = dn[tau], a2 = dn[tau + 1];
        const denom = a0 - 2 * a1 + a2;
        if (Math.abs(denom) > 1e-12) tau += 0.5 * (a0 - a2) / denom;
      }
      const f0 = rate / tau;
      if (f0 >= F0_MIN && f0 <= F0_MAX) midi = 69 + 12 * Math.log2(f0 / 440);
    }
    frames.push({ t: start / rate, midi, rms });
  }
  // relative-RMS consonant/silence gate
  const medRms = median(frames.map((f) => f.rms));
  for (const f of frames) if (f.rms < RMS_GATE * medRms) f.midi = null;
  return frames;
}

/* ── smoothing: 5-frame median within voiced runs + octave-error folding ── */
function smoothTrack(frames) {
  const runs = [];
  let cur = null;
  frames.forEach((f, i) => {
    if (f.midi !== null) { if (!cur) { cur = []; runs.push(cur); } cur.push(i); }
    else cur = null;
  });
  for (const run of runs) {
    const vals = run.map((i) => frames[i].midi);
    run.forEach((idx, k) => {
      const lo = Math.max(0, k - 2), hi = Math.min(vals.length, k + 3);
      frames[idx].midi = median(vals.slice(lo, hi));
    });
    // fold isolated octave jumps (±11–13 semitones against both neighbors)
    for (let k = 1; k < run.length - 1; k++) {
      const p = frames[run[k - 1]].midi, c = frames[run[k]].midi, n = frames[run[k + 1]].midi;
      const dp = c - p, dnn = c - n;
      if (Math.abs(dp) >= 11 && Math.abs(dp) <= 13 && Math.abs(dnn) >= 11 && Math.abs(dnn) <= 13 &&
          Math.sign(dp) === Math.sign(dnn)) {
        frames[run[k]].midi = c - Math.sign(dp) * 12;
      }
    }
  }
}

/* ── transcription: frames → {p,d} notes relative to the final pitch ────── */
function transcribe(frames) {
  const voiced = frames.filter((f) => f.midi !== null);
  const voicedRatio = frames.length ? voiced.length / frames.length : 0;
  if (voiced.length < 4) return { notes: [], voicedRatio, warnings: ['too little voiced audio'] };

  // pitch-stability segments (±0.5 st of the running segment median, ≤30 ms gaps)
  const segs = [];
  let seg = null;
  for (const f of voiced) {
    if (seg && f.t - seg.tEnd <= 0.03 && Math.abs(f.midi - median(seg.midis)) <= 0.5) {
      seg.midis.push(f.midi);
      seg.tEnd = f.t;
    } else {
      seg = { midis: [f.midi], tStart: f.t, tEnd: f.t };
      segs.push(seg);
    }
  }
  // reference = last segment sustained ≥ REF_MIN_SEC (fallback: the last one)
  let refSeg = segs[segs.length - 1];
  for (let i = segs.length - 1; i >= 0; i--) {
    if (segs[i].tEnd - segs[i].tStart + HOP_SEC >= REF_MIN_SEC) { refSeg = segs[i]; break; }
  }
  const refMidi = median(refSeg.midis);

  // quantize per frame, then collapse runs (a >GAP_SEC unvoiced gap breaks a run)
  const warnings = [];
  let notes = [];
  let run = null;
  for (const f of voiced) {
    const rel = Math.round(f.midi - refMidi);
    if (run && rel === run.p && f.t - run.tEnd <= GAP_SEC) {
      run.sec += HOP_SEC;
      run.tEnd = f.t;
    } else {
      run = { p: rel, sec: HOP_SEC, tEnd: f.t };
      notes.push(run);
    }
  }
  // merge blips (<BLIP_SEC) into the previous note (first note merges forward)
  for (let i = 0; i < notes.length; ) {
    if (notes[i].sec < BLIP_SEC && notes.length > 1) {
      if (i > 0) { notes[i - 1].sec += notes[i].sec; notes.splice(i, 1); }
      else { notes[1].sec += notes[0].sec; notes.splice(0, 1); }
    } else i++;
  }
  mergeAdjacentEqual(notes);
  // cap: merge the shortest note into its shorter neighbor
  let capped = false;
  while (notes.length > MAX_NOTES) {
    capped = true;
    let mi = 0;
    for (let i = 1; i < notes.length; i++) if (notes[i].sec < notes[mi].sec) mi = i;
    const left = mi > 0 ? notes[mi - 1] : null;
    const right = mi < notes.length - 1 ? notes[mi + 1] : null;
    const into = !left ? right : !right ? left : (left.sec <= right.sec ? left : right);
    into.sec += notes[mi].sec;
    notes.splice(mi, 1);
    mergeAdjacentEqual(notes);
  }
  if (capped) warnings.push('note cap applied');

  // relative duration units d ∈ 1..MAX_D
  const secs = notes.map((n) => n.sec);
  let u = Math.min(...secs);
  if (Math.max(...secs) / u > MAX_D) u = Math.max(...secs) / MAX_D;
  const out = notes.map((n) => ({ p: n.p, d: Math.min(MAX_D, Math.max(1, Math.round(n.sec / u))) }));

  if (voicedRatio < 0.5) warnings.push(`low voiced ratio ${Math.round(voicedRatio * 100)}%`);
  const ps = out.map((n) => n.p);
  if (Math.max(...ps) - Math.min(...ps) > 12) warnings.push('range >12 semitones');
  if (out.length && out[out.length - 1].p !== 0) warnings.push(`final note p=${out[out.length - 1].p} (≠0)`);
  return { notes: out, voicedRatio, warnings };
}
function mergeAdjacentEqual(notes) {
  for (let i = 1; i < notes.length; ) {
    if (notes[i].p === notes[i - 1].p) {
      notes[i - 1].sec += notes[i].sec;
      notes[i - 1].tEnd = notes[i].tEnd;
      notes.splice(i, 1);
    } else i++;
  }
}

/* ── medoid selection across a trope's example contours ─────────────────── */
// Levenshtein over p-sequences: substitution cost min(|Δp|,3)/3, indel 1.
function contourDist(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => new Float64Array(n + 1));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = Math.min(Math.abs(a[i - 1] - b[j - 1]), 3) / 3;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + sub);
    }
  }
  return dp[m][n];
}
function pickMedoid(results) {
  const usable = results.filter((r) => r.notes.length);
  if (!usable.length) return null;
  let best = null;
  for (const r of usable) {
    const sum = usable.reduce((acc, o) => (o === r ? acc : acc + contourDist(r.notes.map((n) => n.p), o.notes.map((n) => n.p))), 0);
    if (!best || sum < best.sum - 1e-9 || (Math.abs(sum - best.sum) <= 1e-9 && r.score > best.r.score)) {
      best = { r, sum };
    }
  }
  return best;
}

/* ── main ───────────────────────────────────────────────────────────────── */
const index = readRepoJSON('data/trope/trope_index.json');
const manifest = readRepoJSON('data/pockettorah/manifest.json');
if (!index || index.v !== 1 || !index.tropes) {
  console.error(`Bad index shape in ${INDEX_PATH}`);
  process.exit(1);
}
let existing = null;
if (existsSync(MOTIFS_PATH)) existing = readRepoJSON('data/trope/trope_motifs.json');
if (ONLY && !(ONLY in index.tropes)) {
  console.error(`--only=${ONLY}: no such trope key in trope_index.json`);
  process.exit(1);
}

const tropeKeys = Object.keys(index.tropes);
const outTropes = {};
const reportRows = [];   // {key, kept, examples:[{ex,score,res}], medoid, warnings}
const plannedFiles = new Set();
const plan = [];         // [{key, picks}]

for (const key of tropeKeys) {
  const pool = index.tropes[key] || [];
  const prior = existing && existing.tropes && existing.tropes[key];
  const keepVerified = !FORCE && prior && prior.verified === true;
  const skipForOnly = ONLY && key !== ONLY;
  if ((keepVerified || skipForOnly) && prior) {
    outTropes[key] = prior;
    reportRows.push({ key, kept: keepVerified ? 'kept (human-verified)' : 'kept (--only run)', prior });
    continue;
  }
  if (skipForOnly) continue;           // --only + no prior entry → nothing to carry
  if (!pool.length) continue;          // geresh_muqdam: no examples → no entry
  plan.push({ key, picks: selectExamples(pool, plannedFiles) });
}

// analyze, decoding each aliyah MP3 exactly once
const byFile = new Map();
for (const { key, picks } of plan) {
  for (const pk of picks) {
    const fk = pk.ex.p + '|' + pk.ex.a;
    if (!byFile.has(fk)) byFile.set(fk, []);
    byFile.get(fk).push({ key, pk });
  }
}
console.log(`Analyzing ${plan.length} tropes across ${byFile.size} aliyah files …`);
const decoder = new MPEGDecoder();
await decoder.ready;
const analyses = new Map(); // key → [{ex, score, res}]
for (const [fk, items] of byFile) {
  const [p, a] = fk.split('|');
  const m = manifest[p];
  if (!m) { console.error(`No manifest entry for parsha "${p}"`); process.exit(1); }
  const path = cachedMp3(m.audioBase, a);
  const decoded = await decodeMp3(decoder, path);
  for (const { key, pk } of items) {
    const { x, rate } = clipPcm(decoded, pk.ex.s, pk.ex.e);
    const frames = yinTrack(x, rate);
    smoothTrack(frames);
    const res = transcribe(frames);
    if (!analyses.has(key)) analyses.set(key, []);
    analyses.get(key).push({ ex: pk.ex, score: pk.score, ...res });
  }
}
decoder.free();

for (const { key } of plan) {
  const results = analyses.get(key) || [];
  // keep the trope's original selection order for the report
  const medoid = pickMedoid(results);
  if (medoid) outTropes[key] = { notes: medoid.r.notes, verified: false };
  reportRows.push({ key, examples: results, medoid });
}
reportRows.sort((a, b) => tropeKeys.indexOf(a.key) - tropeKeys.indexOf(b.key));

// emit in trope_index key order
const ordered = {};
for (const key of tropeKeys) if (outTropes[key]) ordered[key] = outTropes[key];
const built = new Date().toISOString().slice(0, 10);
const output = { v: 1, system: 'torah', built, license: LICENSE_NOTE, tropes: ordered };
const json = JSON.stringify(output);
writeFileSync(MOTIFS_PATH, json + '\n');
const bytes = json.length + 1;

/* ── smoke tests ────────────────────────────────────────────────────────── */
const failures = [];
try { JSON.parse(readFileSync(MOTIFS_PATH, 'utf8')); } catch (e) { failures.push(`output does not round-trip: ${e.message}`); }
for (const key of Object.keys(ordered)) {
  if (!(key in index.tropes)) failures.push(`output key ${key} not in trope_index`);
}
for (const key of tropeKeys) {
  const hasExamples = (index.tropes[key] || []).length > 0;
  if (hasExamples && !(key in ordered) && !(ONLY && key !== ONLY)) {
    failures.push(`trope ${key} has index examples but no motif entry`);
  }
}
if ('geresh_muqdam' in ordered) failures.push('geresh_muqdam has an entry despite zero corpus examples');
for (const [key, m] of Object.entries(ordered)) {
  if (!Array.isArray(m.notes) || m.notes.length < 1 || m.notes.length > MAX_NOTES) {
    failures.push(`${key}: notes length ${m.notes && m.notes.length} outside 1..${MAX_NOTES}`);
  } else {
    for (const n of m.notes) {
      if (!Number.isInteger(n.p) || n.p < -24 || n.p > 24) failures.push(`${key}: bad p ${n.p}`);
      if (!Number.isInteger(n.d) || n.d < 1 || n.d > MAX_D) failures.push(`${key}: bad d ${n.d}`);
    }
  }
  if (typeof m.verified !== 'boolean') failures.push(`${key}: verified is not boolean`);
}
if (bytes > SIZE_BUDGET) failures.push(`output ${bytes} bytes exceeds budget ${SIZE_BUDGET}`);

/* ── report ─────────────────────────────────────────────────────────────── */
const fmtContour = (notes) => notes.map((n) => `${n.p}:${n.d}`).join(' · ') || '(none)';
let report = `# Trope motifs build report

- **Built:** ${built}
- **Source:** PocketTorah aliyah recordings (raw.githubusercontent.com/rneiss/PocketTorah), clips selected from \`data/trope/trope_index.json\`
- **Output:** \`data/trope/trope_motifs.json\` — ${bytes} bytes (budget ${SIZE_BUDGET.toLocaleString('en-US')})
- **Decoder:** mpg123-decoder (WASM); pitch detection: YIN (${F0_MIN}–${F0_MAX} Hz band, ${HOP_SEC * 1000} ms hop, threshold ${YIN_THRESHOLD})
- **Reference pitch:** each clip's final sustained segment (≥${REF_MIN_SEC * 1000} ms); p = semitones relative to it (notated as B, middle line, treble clef)
- **Examples analyzed:** ${[...analyses.values()].reduce((a, r) => a + r.length, 0)} clips across ${byFile.size} aliyah MP3s (${downloads} downloaded, ${cacheHits} cache hits)
- **Run mode:** ${FORCE ? '--force (verified entries re-analyzed)' : ONLY ? `--only=${ONLY}` : 'default (verified entries kept verbatim)'}
- **License:** transcriptions derived from PocketTorah audio © Russel Neiss & Rabbi Charlie Schwartz — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); this report and the output JSON are likewise CC BY-SA 4.0.

Every non-kept entry is \`verified: false\` — a machine draft awaiting by-ear
verification (audition via \`trope_tutor.html?debug=motifs\`, correct the JSON,
flip \`verified\` to \`true\`; re-runs keep verified entries).

## Per-trope contours
`;
for (const row of reportRows) {
  report += `\n### ${row.key}\n\n`;
  if (row.prior) {
    report += `- **${row.kept}** — motif: \`${fmtContour(row.prior.notes)}\` (verified: ${row.prior.verified})\n`;
    continue;
  }
  report += `| Example | Word | Dur | Voiced% | Contour (p:d) |\n|---|---|---|---|---|\n`;
  row.examples.forEach((r) => {
    report += `| ${r.ex.p} ${r.ex.ref} | ${r.ex.he} | ${round2(r.ex.e - r.ex.s)}s | ${Math.round(r.voicedRatio * 100)}% | ${fmtContour(r.notes)} |\n`;
  });
  if (row.medoid) {
    const which = row.examples.indexOf(row.medoid.r) + 1;
    report += `\n- Chosen: example ${which} (medoid, Σdist ${round2(row.medoid.sum)})\n`;
    report += `- Motif: \`${fmtContour(row.medoid.r.notes)}\`\n`;
    const warns = row.medoid.r.warnings;
    report += `- Warnings: ${warns.length ? warns.join('; ') : '(none)'}\n`;
  } else {
    report += `\n- **No usable contour** (all examples too unvoiced) — no entry emitted\n`;
  }
}
report += `\n## Smoke tests\n\n`;
report += failures.length
  ? `**SMOKE TEST FAILURES:**\n\n${failures.map((f) => `- ${f}`).join('\n')}\n`
  : `**All smoke tests passed.**\n`;
writeFileSync(REPORT_PATH, report);

console.log(`\nWrote ${MOTIFS_PATH} (${bytes} bytes, ${Object.keys(ordered).length} tropes)`);
console.log(`Wrote ${REPORT_PATH}`);
if (failures.length) {
  console.error(`\nSMOKE TEST FAILURES (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('All smoke tests passed.');
