/*
 * totaltorah-lib.mjs — what build-totaltorah-timings.mjs and build-totaltorah-bulk.mjs share: the cache paths, the
 * Trainer's tokenization (ported), the Sefaria text cache, the ffmpeg helpers, the aligner client (one
 * align_totaltorah.py --serve process, the model loaded once for a whole run), the boundaries pass of a video
 * (intro end, one whole-file alignment, a cut midway through each inter-verse gap) and the timings writers.
 * Importing it runs nothing; build-totaltorah-audio.mjs keeps its own copies on purpose (it is the one that
 * touches the manifest and the permission record, and it must stay readable on its own).
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';
import { BOOK_CODE } from './totaltorah-videos.mjs';

export { BOOK_CODE };
export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE_DIR = join(repoRoot, 'source-data', 'totaltorah-cache');
export const TEXT_CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');   // the index builder's Sefaria export cache
export const FLAC_DIR = join(CACHE_DIR, 'verses');
export const ENV_DIR = join(CACHE_DIR, 'align-env');
export const OUT_DIR = join(repoRoot, 'data', 'totaltorah');
export const AUDIO_DIR = join(OUT_DIR, 'audio');
export const TIMINGS_DIR = join(OUT_DIR, 'timings');
export const MANIFEST = join(OUT_DIR, 'manifest.json');
export const ALIGNER = join(repoRoot, 'scripts', 'align_totaltorah.py');
export const PY = join(ENV_DIR, 'bin', 'python3');

export const MODEL = 'imvladikon/wav2vec2-xls-r-300m-hebrew';
export const MODEL_REVISION = 'b2e683004903f1b11bee2c6092a7c323ed858d82';   // the commit the first runs aligned with; null = main
export const PIP_REQUIREMENTS = ['torch', 'torchaudio', 'transformers', 'soundfile', 'huggingface_hub'];
export const TORCH_CPU_INDEX = 'https://download.pytorch.org/whl/cpu';
// the source audio a video may be staged as: yt-dlp's m4a, or whatever the maintainer's extractor produced
export const SOURCE_EXTS = ['m4a', 'mp3', 'webm', 'opus', 'ogg', 'wav', 'flac', 'aac'];
export const DEFAULT_PAD = 0.15;

export const r2 = (x) => Math.round(x * 100) / 100;
export const r3 = (x) => Math.round(x * 1000) / 1000;
export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);

/* ---------- the Trainer's tokenization, ported (mirrors countHebrewWords / tokenizeHebrew) ---------- */
const NAMED_ENTITIES = { nbsp: ' ', thinsp: ' ', mdash: '—', ndash: '–', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
export function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}
export function cleanVerse(s) {
  if (typeof s !== 'string' || !s) return '';
  let out = s.replace(/<[^>]*>/g, '');
  out = out.replace(/\{[פסףפ׳ס׳PSFps]\}/g, '');
  out = decodeEntities(out);
  return out.replace(/\s+/g, ' ').trim();
}
export function tokenizeWords(verse) {
  return verse.split(/(\s+|־)/).filter((t) => t && !/^\s+$/.test(t) && t !== '־' && /[א-ת]/.test(t));
}
const ALL_MARKS_RE = /[֑-ׇ]/g;   // nikkud + te'amim + the punctuation marks in that block (sof pasuq, paseq…)
export function consonants(word) { return word.replace(ALL_MARKS_RE, '').replace(/[^א-ת]/g, ''); }

/* ---------- refs and verse text (Sefaria export, the index builder's cache) ---------- */
const _books = {};
export function loadBookText(book) {
  if (_books[book]) return _books[book];
  mkdirSync(TEXT_CACHE_DIR, { recursive: true });
  const path = join(TEXT_CACHE_DIR, `merged-${book}.json`);
  if (!existsSync(path)) {
    const url = `https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/${book}/Hebrew/merged.json`;
    console.log(`  fetching ${url}`);
    writeFileSync(path, execFileSync('curl', ['-sS', '--fail', '--max-time', '120', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  }
  _books[book] = JSON.parse(readFileSync(path, 'utf8')).text;   // chapters[c-1][v-1]
  return _books[book];
}
export function parseRef(ref) {
  const m = /^([A-Z][a-z]+) (\d+):(\d+)-(\d+):(\d+)$/.exec(ref || '');
  if (!m || !BOOK_CODE[m[1]]) throw new Error(`a ref looks like "Genesis 1:1-1:5" (got "${ref}")`);
  return { book: m[1], sc: +m[2], sv: +m[3], ec: +m[4], ev: +m[5] };
}
export function versesOfRef(r, chapters) {
  const out = [];
  for (let c = r.sc; c <= r.ec; c++) {
    const ch = chapters[c - 1];
    if (!ch) throw new Error(`${r.book} has no chapter ${c}`);
    const from = c === r.sc ? r.sv : 1;
    const to = c === r.ec ? r.ev : ch.length;
    if (to > ch.length) throw new Error(`${r.book} ${c} has only ${ch.length} verses, not ${to}`);
    for (let v = from; v <= to; v++) out.push({ c, v, key: `${r.book} ${c}:${v}`, file: `${BOOK_CODE[r.book]}-${String(c).padStart(3, '0')}-${String(v).padStart(3, '0')}` });
  }
  if (!out.length) throw new Error(`the ref ${r.book} ${r.sc}:${r.sv}-${r.ec}:${r.ev} holds no verses`);
  return out;
}
// the verses of a ref with their words (the Trainer's tokens) — what every alignment is built on
export function refVerses(ref) {
  const r = parseRef(ref);
  const chapters = loadBookText(r.book);
  return versesOfRef(r, chapters).map((vs) => {
    const words = tokenizeWords(cleanVerse(chapters[vs.c - 1][vs.v - 1]));
    const cons = words.map(consonants);
    if (!words.length || cons.some((w) => !w)) throw new Error(`${vs.key}: a word stripped to nothing (${JSON.stringify(words)})`);
    return { ...vs, words, cons };
  });
}
export const verseKeyRe = /^(\w+) (\d+):(\d+)$/;

/* ---------- ffmpeg ---------- */
export function needTool(name) {
  const w = spawnSync('which', [name], { encoding: 'utf8' });
  if (w.status !== 0) throw new Error(`${name} is not on PATH — install it and re-run.`);
}
export function ffprobeDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
  const d = parseFloat(out.trim());
  if (!isFinite(d)) throw new Error(`ffprobe could not read a duration from ${file}`);
  return d;
}
export function meanVolume(file) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /mean_volume:\s*(-?[\d.]+)\s*dB/.exec(r.stderr || '');
  if (!m) throw new Error(`volumedetect gave no mean_volume for ${file}`);
  return parseFloat(m[1]);
}
export function detectSegments(file, thresh = '-50dB', mindur = '0.6') {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', file, '-af', `silencedetect=noise=${thresh}:d=${mindur}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const silences = [];
  let open = null;
  for (const line of (r.stderr || '').split('\n')) {
    let m = /silence_start:\s*(-?[\d.]+)/.exec(line);
    if (m) { open = parseFloat(m[1]); continue; }
    m = /silence_end:\s*([\d.]+)/.exec(line);
    if (m && open !== null) { silences.push({ s: Math.max(0, open), e: parseFloat(m[1]) }); open = null; }
  }
  const dur = ffprobeDuration(file);
  if (open !== null) silences.push({ s: Math.max(0, open), e: dur });   // silence running to the end
  const segs = [];
  let prev = 0;
  for (const sil of silences) { if (sil.s - prev > 0.05) segs.push({ start: prev, end: sil.s }); prev = sil.e; }
  if (dur - prev > 0.05) segs.push({ start: prev, end: dur });
  return { segs, dur, silences };
}
export function segTable(segs) {
  return segs.map((g, i) => `  ${String(i + 1).padStart(2)}  ${g.start.toFixed(2).padStart(7)} – ${g.end.toFixed(2).padStart(7)}  (${(g.end - g.start).toFixed(2)} s)`).join('\n');
}
// the staged source audio of a video: yt-dlp's m4a, or the file the maintainer extracted elsewhere
export function sourceAudio(id, cacheDir = CACHE_DIR) {
  for (const ext of SOURCE_EXTS) { const p = join(cacheDir, `${id}.${ext}`); if (existsSync(p)) return p; }
  return null;
}
// a 16 kHz mono FLAC of the source (soundfile reads no m4a/mp3); returned path is inside the cache
export function to16k(src, dest) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'flac', dest]);
  return dest;
}

/* ---------- the venv ---------- */
export function setupEnv(log = console.log) {
  if (!existsSync(PY)) {
    log(`setup: creating ${ENV_DIR}`);
    const r = spawnSync('python3', ['-m', 'venv', ENV_DIR], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`venv failed: ${r.stderr}`);
  }
  log(`setup: pip install ${PIP_REQUIREMENTS.join(' ')} (torch from ${TORCH_CPU_INDEX})`);
  const r = spawnSync(join(ENV_DIR, 'bin', 'pip'), ['install', '-q', '--extra-index-url', TORCH_CPU_INDEX, ...PIP_REQUIREMENTS], { encoding: 'utf8', stdio: ['ignore', 'inherit', 'pipe'] });
  if (r.status !== 0) { process.stderr.write(r.stderr || ''); throw new Error('pip install failed — torch will not install on this machine; stopping (no heuristic aligner).'); }
  log('setup: ok');
}
export function checkEnv(log = console.log) {
  if (!existsSync(PY)) throw new Error(`no alignment venv at ${ENV_DIR} — run build-totaltorah-timings.mjs --setup first`);
  const r = spawnSync(PY, ['-c', 'import torch, torchaudio, transformers; print(torch.__version__, torchaudio.__version__, transformers.__version__)'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`the venv cannot import torch/torchaudio/transformers:\n${r.stderr}`);
  log(`env: torch/torchaudio/transformers ${r.stdout.trim()}`);
}

/* ---------- the aligner client: one align_totaltorah.py --serve process, jobs over stdin/stdout ---------- */
export class AlignerClient {
  constructor(opts = {}) {
    this.python = opts.python || PY;
    this.model = opts.model || MODEL;
    this.revision = opts.revision === undefined ? MODEL_REVISION : opts.revision;
    this.window = opts.window; this.overlap = opts.overlap;
    this.proc = null; this.pending = new Map(); this.seq = 0; this.exited = false; this.stderr = ''; this.info = null;
  }
  start() {
    if (this.ready) return this.ready;
    const args = [ALIGNER, '--serve', '--model', this.model];
    if (this.revision) args.push('--revision', this.revision);
    if (this.window) args.push('--window', String(this.window));
    if (this.overlap) args.push('--overlap', String(this.overlap));
    this.proc = spawn(this.python, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stderr.on('data', (d) => { this.stderr = (this.stderr + d).slice(-20000); });
    this.ready = new Promise((resolve, reject) => { this._resolveReady = resolve; this._rejectReady = reject; });
    this.ready.catch(() => {});
    createInterface({ input: this.proc.stdout }).on('line', (line) => {
      let msg; try { msg = JSON.parse(line); } catch { return; }
      if (msg.ready) { this.info = msg; this._resolveReady(msg); return; }
      const p = this.pending.get(msg.id);
      if (p) { this.pending.delete(msg.id); p.resolve(msg); }
    });
    this.proc.on('exit', (code) => {
      this.exited = true;
      const err = new Error(`the aligner exited (${code}): ${this.stderr.trim().split('\n').slice(-4).join(' | ')}`);
      this._rejectReady(err);
      for (const p of this.pending.values()) p.reject(err);
      this.pending.clear();
    });
    return this.ready;
  }
  // job: { audio, words (consonants), offset?, end?, offsets? } → the aligner's result object; throws on {error}
  async align(job) {
    await this.start();
    if (this.exited) throw new Error('the aligner is not running');
    const id = `j${++this.seq}`;
    const msg = await new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.proc.stdin.write(JSON.stringify({ ...job, id }) + '\n');
    });
    if (msg.error) throw new Error(msg.error);
    return msg;
  }
  async close() {
    if (this.proc && !this.exited) { this.proc.stdin.end(); await new Promise((r) => this.proc.once('exit', r)); }
  }
}

/* ---------- the boundaries pass of one video ---------- */
// The intro: every Total Torah video opens with a spoken intro that must never reach a verse file. The candidates
// for its end are the file's start and every sound segment start (a silence end) in the first `introMax` seconds;
// the first verse's words are force-aligned from each candidate on ONE emission pass, and the candidate whose
// alignment scores best wins — the intro's English speech scores badly against Hebrew text, and a start inside
// the verse loses words. `intro` may also be a number (confirmed by ear) or 'silence' (the old rule: the first
// silence after at least a second of sound), and the chosen value is printed beside the old rule's either way.
export function legacyIntroEnd(segs) {
  const i = segs.findIndex((g) => g.end - g.start >= 1.0);
  return i >= 0 && segs[i + 1] ? segs[i + 1].start : 0;
}
export async function computeBoundaries({ id, row, src, client, intro = 'auto', pad = DEFAULT_PAD, introMax = 30, keep16k = true, log = console.log, cacheDir = CACHE_DIR }) {
  if (!row || !row.ref) throw new Error(`${id} has no ref — the whitelist row needs one before anything is cut`);
  const verses = refVerses(row.ref);
  const N = verses.length;
  const { segs, dur } = detectSegments(src);
  log(`boundaries: ${id} "${row.parsha}" Y${row.year} A${row.aliyah} ${row.ref}: ${N} verses, ${dur.toFixed(2)} s\n  silence table (-50dB, 0.6 s):\n${segTable(segs)}`);
  const flac = to16k(src, join(cacheDir, `${id}.16k.flac`));
  const legacy = legacyIntroEnd(segs);
  let introEnd, introBy, candidates = [];
  if (typeof intro === 'number') { introEnd = intro; introBy = 'given'; }
  else if (intro === 'silence') { introEnd = legacy; introBy = 'silence'; }
  else {
    const cands = [0];
    for (const g of segs) if (g.start > 0.05 && g.start <= introMax && cands.every((c) => Math.abs(c - g.start) > 0.05)) cands.push(r2(g.start));
    if (cands.length === 1) { introEnd = legacy; introBy = 'silence'; }
    else {
      const w1 = verses[0].cons;
      const end = Math.min(dur, Math.max(...cands) + 1.5 * w1.length + 4);
      const res = await client.align({ audio: flac, words: w1, offsets: cands, end });
      candidates = res.results.map((x) => ({ t: x.offset, score: x.error ? -1 : r3(mean(x.scores)), first: x.error ? null : x.onsets[0], error: x.error || null }));
      let best = candidates[0];
      for (const c of candidates) if (c.score >= best.score) best = c;   // ties go to the later candidate (less intro can leak)
      introEnd = best.t; introBy = 'scored';
      // no clear winner (every candidate within 0.02 of the best): the scores carry no signal, so the old rule decides
      const legacyCand = candidates.find((c) => Math.abs(c.t - legacy) < 0.06);
      if (legacyCand && legacyCand.t !== best.t && best.score - legacyCand.score < 0.02) { introEnd = legacyCand.t; introBy = 'silence (scores tied)'; }
    }
  }
  if (!isFinite(introEnd) || introEnd < 0 || introEnd >= dur) throw new Error(`intro end ${introEnd} is outside the file`);
  if (candidates.length) {
    log('  intro candidates (first verse aligned from each; mean score, first onset):');
    for (const c of candidates) log(`    ${c.t.toFixed(2).padStart(6)} s  ${c.error ? 'error: ' + c.error : `score ${c.score.toFixed(2)}  first word at ${c.first.toFixed(2)} s`}${c.t === introEnd ? '  ← chosen' : ''}`);
  }
  log(`  intro: 0 – ${introEnd.toFixed(2)} s (${introBy}; the first-silence rule says ${legacy.toFixed(2)} s${Math.abs(legacy - introEnd) > 0.3 ? ' — DIFFERS, listen' : ''})`);
  const words = [], display = [];
  for (const v of verses) for (let i = 0; i < v.cons.length; i++) { words.push(v.cons[i]); display.push(v.words[i]); }
  log(`  aligning ${words.length} words from ${introEnd.toFixed(2)} s …`);
  const a = await client.align({ audio: flac, words, offset: introEnd });
  const b = [r2(introEnd)];
  const gaps = [];
  const out = [];
  let i = 0;
  verses.forEach((v, vi) => {
    const n = v.cons.length;
    const onsets = a.onsets.slice(i, i + n), ends = a.ends.slice(i, i + n), scores = a.scores.slice(i, i + n);
    const first = onsets[0], lastEnd = ends[n - 1], minScore = Math.min(...scores);
    log(`  ${v.key.padEnd(14)} ${first.toFixed(2).padStart(7)} – ${lastEnd.toFixed(2).padStart(7)}  (${n} words, min score ${minScore.toFixed(2)})`);
    if (vi > 0) {
      const prevEnd = a.ends[i - 1];
      const gap = first - prevEnd;
      gaps.push(r2(gap));
      if (gap < 0.3) log(`  ⚠ only ${gap.toFixed(2)} s between ${verses[vi - 1].key} and ${v.key} — check this cut by ear`);
      b.push(r2((prevEnd + first) / 2));
    }
    out.push({ key: v.key, file: v.file, n, first, lastEnd, minScore: r3(minScore), words: v.words, onsets, ends, scores });
    i += n;
  });
  b.push(r2(Math.min(dur, a.ends[a.ends.length - 1] + 0.4)));
  const result = { id, ref: row.ref, introEnd: b[0], introBy, legacyIntro: r2(legacy), candidates, boundaries: b, gaps, pad, dur: r2(dur),
    verses: out, wall: a.wall, windows: a.windows, model: a.model, revision: a.revision, built: new Date().toISOString().slice(0, 10) };
  writeFileSync(join(cacheDir, `${id}.boundaries.json`), JSON.stringify(result, null, 1) + '\n');
  if (!keep16k) { try { unlinkSync(flac); } catch { /* already gone */ } }
  log(`\nboundaries: ${b.join(',')}  (gaps between verses: ${gaps.join(', ')} s; alignment ${a.wall} s, ${a.windows} window(s))\nwrote ${join(cacheDir, id + '.boundaries.json')}`);
  return result;
}

/* ---------- timings files ---------- */
// PocketTorah label format: comma-separated word onsets, index = word index, ONE trailing value = the end of the last word
export function timingsLine(onsets, end) { return [...onsets.map((t) => t.toFixed(3)), end.toFixed(3)].join(','); }
export function writeTimingsFile(base, onsets, end, dir = TIMINGS_DIR) {
  mkdirSync(dir, { recursive: true });
  for (let i = 1; i < onsets.length; i++) if (onsets[i] < onsets[i - 1]) throw new Error(`${base}: onsets step back at word ${i}`);
  writeFileSync(join(dir, `${base}.txt`), timingsLine(onsets, end) + '\n');
  return `${base}.txt`;
}
// The verse's timings read off the whole-file alignment of its video (no second model pass): the cut starts
// `pad` before its boundary, so each onset moves back by that start; clamped to the file.
export function deriveVerseTimings(bj, i) {
  const v = bj.verses && bj.verses[i];
  if (!v) throw new Error(`boundaries file has no verse ${i}`);
  const pad = bj.pad ?? DEFAULT_PAD;
  const cutStart = Math.max(0, bj.boundaries[i] - pad);
  return { key: v.key, file: v.file, words: v.words, onsets: v.onsets.map((t) => r3(Math.max(0, t - cutStart))), end: r3(Math.max(0, v.ends[v.ends.length - 1] - cutStart)), scores: v.scores, wall: 0 };
}
// the per-word table every timings writer prints
export function wordTable(res, minscore, log = console.log) {
  log(`  ${'#'.padStart(3)}  ${'onset'.padStart(7)}  score  word`);
  res.words.forEach((w, i) => log(`  ${String(i).padStart(3)}  ${res.onsets[i].toFixed(2).padStart(7)}  ${res.scores[i].toFixed(2)}${res.scores[i] < minscore ? ' ⚠' : '  '}  ${w}`));
}
// the audit page: each word plays its verse file from its onset for 1.2 s; red = under minscore
export function auditHtml(results, minscore) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rel = (p) => '../../' + p;   // audit.html sits in source-data/totaltorah-cache/
  let html = `<!doctype html><meta charset="utf-8"><title>Total Torah alignment audit</title>
<style>body{font-family:system-ui;margin:24px;max-width:900px}h2{margin:28px 0 8px}.w{display:inline-flex;gap:4px;align-items:center;margin:4px;padding:4px 6px;border:1px solid #ccc;border-radius:6px;font-size:1.3rem}.w small{font-size:.7rem;color:#666}.low{border-color:#c33}button{font-size:1rem}</style>
<h1>Total Torah alignment audit</h1><p>Each button plays the verse file from the word's onset for 1.2 s. Red: score under ${minscore}.</p>`;
  for (const r of results) {
    html += `<h2>${esc(r.key)} <small>(${r.wall} s)</small></h2><audio id="a-${esc(r.file)}" src="${esc(rel('data/totaltorah/audio/' + r.file + '.mp3'))}" preload="auto" controls></audio><div dir="rtl" lang="he">`;
    r.words.forEach((w, i) => {
      html += `<span class="w${r.scores[i] < minscore ? ' low' : ''}"><button type="button" onclick="playAt('a-${esc(r.file)}',${r.onsets[i]})">▶</button>${esc(w)}<small dir="ltr">${r.onsets[i].toFixed(2)} · ${r.scores[i].toFixed(2)}</small></span>`;
    });
    html += '</div>';
  }
  html += `<script>let _t=null;function playAt(id,t){const a=document.getElementById(id);if(_t)clearTimeout(_t);a.currentTime=t;a.play();_t=setTimeout(()=>a.pause(),1200);}<\/script>`;
  return html;
}

/* ---------- per-verse alignment of the cut FLACs (the second-pass path) ---------- */
// For each manifest verse key with a FLAC in FLAC_DIR: align its text against the cut, write the timings file,
// set `timings` on the entry (and reset timingsVerified: a rewritten file is unheard again). Never exits: returns
// { results, failures } and leaves the manifest object updated for the caller to write.
export async function alignVerses({ keys, manifest, client, minscore = 0.5, log = console.log, flacDir = FLAC_DIR, timingsDir = TIMINGS_DIR }) {
  const results = [], failures = [];
  for (const key of keys) {
    const e = manifest[key];
    const m = verseKeyRe.exec(key);
    if (!m || !e) { log(`skip ${key}: not a manifest verse`); continue; }
    const base = e.file.replace(/\.mp3$/, '');
    const flac = join(flacDir, `${base}.flac`);
    if (!existsSync(flac)) { log(`skip ${key}: no ${flac} (re-run split)`); failures.push({ key, error: 'no FLAC' }); continue; }
    let words;
    try {
      const chapters = loadBookText(m[1]);
      const raw = chapters[+m[2] - 1] && chapters[+m[2] - 1][+m[3] - 1];
      if (!raw) throw new Error('no text in the Sefaria export');
      words = tokenizeWords(cleanVerse(raw));
      if (!words.length || words.map(consonants).some((w) => !w)) throw new Error(`a word stripped to nothing (${JSON.stringify(words)})`);
    } catch (err) { log(`✗ ${key}: ${err.message}`); failures.push({ key, error: err.message }); continue; }
    log(`\nalign ${key}: ${words.length} words`);
    let a;
    try { a = await client.align({ audio: flac, words: words.map(consonants) }); } catch (err) { log(`✗ ${key}: alignment failed — nothing written for this verse (no heuristic fallback): ${err.message}`); failures.push({ key, error: err.message }); continue; }
    if (a.onsets.length !== words.length) { log(`✗ ${key}: ${a.onsets.length} onsets for ${words.length} words — the page would highlight the wrong words; nothing written`); failures.push({ key, error: 'onset count' }); continue; }
    const res = { key, file: base, words, onsets: a.onsets, ends: a.ends, end: a.ends[a.ends.length - 1], scores: a.scores, wall: a.wall, low: a.scores.map((s, i) => (s < minscore ? i : -1)).filter((i) => i >= 0) };
    try { writeTimingsFile(base, res.onsets, res.end, timingsDir); } catch (err) { log(`✗ ${err.message}`); failures.push({ key, error: err.message }); continue; }
    wordTable(res, minscore, log);
    log(`  wall-clock ${a.wall} s · model ${a.model}@${a.revision}${res.low.length ? ` · ${res.low.length} word(s) under --minscore ${minscore} → leave timingsVerified:false` : ''}`);
    e.timings = `${base}.txt`;
    if (e.timingsVerified) { e.timingsVerified = false; log('  (timingsVerified reset: the file was rewritten — listen again)'); }
    results.push(res);
  }
  return { results, failures };
}
// The timings of every verse of a video from its boundaries file (no model): same outputs as alignVerses.
export function deriveVideoTimings({ id, manifest, minscore = 0.5, log = console.log, cacheDir = CACHE_DIR, timingsDir = TIMINGS_DIR }) {
  const bp = join(cacheDir, `${id}.boundaries.json`);
  if (!existsSync(bp)) throw new Error(`no ${bp} — run the boundaries pass first`);
  const bj = JSON.parse(readFileSync(bp, 'utf8'));
  if (!Array.isArray(bj.verses)) throw new Error(`${bp} predates the per-word boundaries format — re-run the boundaries pass`);
  const results = [], failures = [], skipped = [];
  bj.verses.forEach((v, i) => {
    const e = manifest[v.key];
    if (!e) { log(`skip ${v.key}: not in the manifest (run split first)`); failures.push({ key: v.key, error: 'not in manifest' }); return; }
    if (e.video !== id || e.file !== `${v.file}.mp3`) { log(`skip ${v.key}: the manifest's file comes from ${e.video}, not ${id} (kept from the earlier cut)`); skipped.push({ key: v.key, video: e.video }); return; }
    const res = deriveVerseTimings(bj, i);
    if (e.dur && res.end > e.dur + 0.5) { log(`✗ ${v.key}: derived end ${res.end} s is past the file's ${e.dur} s — the cut and the boundaries disagree; re-run split --boundaries auto`); failures.push({ key: v.key, error: 'end past file' }); return; }
    res.low = res.scores.map((s, k) => (s < minscore ? k : -1)).filter((k) => k >= 0);
    try { writeTimingsFile(res.file, res.onsets, res.end, timingsDir); } catch (err) { log(`✗ ${err.message}`); failures.push({ key: v.key, error: err.message }); return; }
    log(`\ntimings ${v.key}: ${res.words.length} words (from the whole-file alignment)`);
    wordTable(res, minscore, log);
    if (res.low.length) log(`  ${res.low.length} word(s) under --minscore ${minscore} → leave timingsVerified:false`);
    e.timings = `${res.file}.txt`;
    if (e.timingsVerified) { e.timingsVerified = false; log('  (timingsVerified reset: the file was rewritten — listen again)'); }
    results.push(res);
  });
  return { results, failures, skipped, bj };
}
