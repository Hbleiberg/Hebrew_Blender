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
// the English model that reads each video's spoken intro (the boundaries pass; loaded by the aligner on first use)
export const MODEL_EN = 'facebook/wav2vec2-base-960h';
export const MODEL_EN_REVISION = '22aad52d435eb6dbaf354bdad9b0da84ce7d6156';
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
export function detectSegments(file, thresh = '-50dB', mindur = '0.6', maxS = null) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...(maxS ? ['-t', String(maxS)] : []), '-i', file, '-af', `silencedetect=noise=${thresh}:d=${mindur}`, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
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
    this.englishModel = opts.englishModel || MODEL_EN;
    this.englishRevision = opts.englishRevision === undefined ? MODEL_EN_REVISION : opts.englishRevision;
    this.window = opts.window; this.overlap = opts.overlap;
    this.proc = null; this.pending = new Map(); this.seq = 0; this.exited = false; this.stderr = ''; this.info = null;
  }
  start() {
    if (this.ready) return this.ready;
    const args = [ALIGNER, '--serve', '--model', this.model, '--english-model', this.englishModel];
    if (this.revision) args.push('--revision', this.revision);
    if (this.englishRevision) args.push('--english-revision', this.englishRevision);
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
// The intro: every Total Torah video opens with a spoken English announcement — "Parashat B'reishit, Year 1,
// Aliyah 4" (a maftir: "…, Maftir"; Ha'azinu and V'Zot HaBerachah name no year) — that must never reach a verse
// file. Its end is read off the English model's transcript of the first `introMax` seconds: the aliyah number
// the row expects, found by fuzzy match after an "aliyah"-like token (the model spells it ALIA, ALYA, A YA…),
// gives the time of the announcement's last word; the cut snaps to the first pause of 0.15 s or more that
// follows within 1.5 s (else the word's end plus a tenth). Neither silence nor a Hebrew alignment can do this
// alone: the cantor sometimes runs straight from the announcement into the first words (no pause the silence
// table sees), sometimes pauses inside the announcement, and a forced alignment of the Hebrew parks the first
// words on the English and scores the rest no worse. When the transcript shows no match the first-silence rule
// decides (`legacyIntroEnd`: the first silence of 0.6 s after at least a second of sound) and the result is
// flagged `introUnconfirmed` — listen before anything is verified. `intro` may also be a number (confirmed by
// ear) or 'silence' (that rule alone); the transcript and both rules' values are printed either way.
export function legacyIntroEnd(segs) {
  const i = segs.findIndex((g) => g.end - g.start >= 1.0);
  return i >= 0 && segs[i + 1] ? segs[i + 1].start : 0;
}
const NUMBER_WORDS = { 1: 'ONE', 2: 'TWO', 3: 'THREE', 4: 'FOUR', 5: 'FIVE', 6: 'SIX', 7: 'SEVEN' };
// how the English model has spelled each number after "aliyah" (ALIAJAN, ALIAWAN, ALIATO, ALIATHRI, ALIASEX…)
const NUMBER_SPELLINGS = { 1: ['ONE', 'WAN', 'JAN', 'AN', 'WON'], 2: ['TWO', 'TO', 'TOO'], 3: ['THREE', 'THRI', 'THRE', 'TREE'], 4: ['FOUR', 'FOR', 'FOR'], 5: ['FIVE', 'FIF'], 6: ['SIX', 'SEX'], 7: ['SEVEN', 'SEVN'] };
const ALIYAH_SPELLINGS = ['ALIYA', 'ALIA', 'ALYA', 'AYA', 'ARIA'];
const MAFTIR_SPELLINGS = ['MAFTIR', 'MAFTEER', 'MAFTIER', 'MAFTHIER', 'MOFTIR'];
const INTRO_TAIL_RE = /\b(YEAR|CHAPTER|VERSE|VERSES|GENESIS|EXODUS|LEVITICUS|NUMBERS|DEUTERONOMY|CHAZAK|HAZAK|WITH|MAFTIR|ALIYA|ALIA|ALYA)\b/;
// a word the announcement may go on with after the aliyah number ("and maftir for the parsha", "with chazak")
const INTRO_TAIL_WORD_RE = /^(AND|AN|MAFTIR|MAFTEER|MAFTIER|FOR|THE|PARSHA|PARSHAT|PARASHA|PARASHAT|WITH|CHAZAK|HAZAK|YEAR|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|CHAPTER|VERSE|VERSES|TO|THROUGH|OF|GENESIS|EXODUS|LEVITICUS|NUMBERS|DEUTERONOMY|ALSO|PLUS)$/;
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
// the best fuzzy occurrence of one of `targets` in `s` (no spaces): { start, end, dist, target }, earliest on ties;
// a target tolerates a third of its length in edits (AYAONE 2, ALIATHREE 3), so a short target cannot match loosely
export function fuzzyFind(s, targets, limit = s.length) {
  let best = null;
  for (const t of targets) {
    const maxDist = Math.floor(t.length / 3);
    for (let i = 0; i < Math.min(limit, s.length); i++) {
      for (let len = Math.max(1, t.length - 2); len <= t.length + 2 && i + len <= s.length; len++) {
        const d = levenshtein(s.slice(i, i + len), t);
        if (d <= maxDist && (!best || d < best.dist || (d === best.dist && i < best.start))) best = { start: i, end: i + len, dist: d, target: t };
      }
    }
  }
  return best;
}
// the first pause after `t` (within 1.5 s, or starting up to 0.25 s before it), looking for ever shorter and
// louder gaps: a quiet recording shows one at -50 dB, a noisier one only at -40 or -30 dB
export function pauseAfter(src, t, maxS) {
  for (const [thresh, mindur] of [['-50dB', '0.15'], ['-40dB', '0.12'], ['-30dB', '0.08']]) {
    const p = detectSegments(src, thresh, mindur, maxS).silences.find((x) => x.s >= t - 0.25 && x.s <= t + 1.5);
    if (p) return { ...p, thresh, mindur };
  }
  return null;
}
// The announcement's end from the English transcript (see above). Returns { introEnd, by, transcript, match, tEnd,
// snapped, unconfirmed, warning }; `by` is 'english' or 'silence (unconfirmed)'.
export async function englishIntroEnd({ src, flac, row, dur, client, legacy, maxS = 30, log = console.log }) {
  const out = { introEnd: legacy, by: 'silence (unconfirmed)', transcript: '', match: null, tEnd: null, snapped: null, unconfirmed: true, warning: null };
  const end = Math.min(dur, maxS);
  if (end < 0.5) { out.warning = 'the file is shorter than half a second'; return out; }
  let r;
  try { r = await client.align({ english: true, audio: flac, offset: 0, end }); }
  catch (e) { out.warning = `the English transcript failed: ${e.message}`; log(`  intro: ${out.warning}`); return out; }
  out.transcript = r.text;
  const chars = (r.chars || []).filter((c) => c[0] !== ' ');
  const s = chars.map((c) => c[0]).join('');
  const targets = row.aliyah === 'M' ? MAFTIR_SPELLINGS : ALIYAH_SPELLINGS.flatMap((a) => NUMBER_SPELLINGS[row.aliyah].map((n) => a + n));
  // the announcement is over within a few seconds: a match that starts later is the chant mis-heard
  const limit = chars.findIndex((c) => c[1] > 9);
  const m = fuzzyFind(s, targets, limit < 0 ? s.length : limit);
  log(`  intro: the English model hears "${r.text}"`);
  if (!m) {
    // "Parashat …" at the start means an announcement the model did not read to the end; nothing of the kind
    // at the start means a video that opens on the chant itself (a few do)
    const opening = fuzzyFind(s.slice(0, 14), ['PARSHAT', 'PARSHOT', 'PARCHAT', 'HARSHAT', 'PARASHAT']);
    if (opening) { out.warning = `"Parashat…" heard but no "aliyah ${row.aliyah === 'M' ? 'maftir' : NUMBER_WORDS[row.aliyah]}" after it — the first-silence rule decides (${legacy.toFixed(2)} s); listen`; }
    else { out.introEnd = 0; out.by = 'none heard (unconfirmed)'; out.warning = `no announcement heard at the start — the chant may begin at once; cut at 0 s; listen`; }
    log(`  intro: ${out.warning}`);
    return out;
  }
  let tEnd = chars[m.end - 1][2];
  out.match = { text: s.slice(m.start, m.end), target: m.target, dist: m.dist };
  out.unconfirmed = false; out.by = 'english';
  // the announcement sometimes goes on past the aliyah number ("… and maftir for the parsha", "with Chazak"):
  // walk the following words while they are announcement words, and cut after the last of them — flagged, since
  // the walk is a vocabulary guess
  const words = [];
  for (const c of r.chars || []) { if (c[0] === ' ') { if (words.length && words[words.length - 1].text) words.push({ text: '', s: null, e: null }); continue; } const w = words[words.length - 1]; if (w && w.s !== null) { w.text += c[0]; w.e = c[2]; } else { if (w) words.pop(); words.push({ text: c[0], s: c[1], e: c[2] }); } }
  const tail = [];
  let wi = words.findIndex((w) => w.s !== null && w.e >= tEnd - 0.01 && w.s <= tEnd);
  for (let k = wi + 1; k < words.length && words[k].s !== null; k++) {
    const w = words[k];
    if (w.s - tEnd > 1.0 || !INTRO_TAIL_WORD_RE.test(w.text)) break;
    tail.push(w.text); tEnd = w.e;
  }
  if (tail.length) { out.unconfirmed = true; out.by = 'english (unconfirmed)'; out.warning = `the announcement goes on after "${out.match.text}" ("${tail.join(' ')}") — cut after it; listen`; }
  out.tEnd = r2(tEnd);
  // the first pause right after the word: a clean cut; none at any threshold → a little after the word
  const pause = pauseAfter(src, tEnd, maxS + 2);
  out.snapped = pause ? r2(pause.e) : null;
  out.introEnd = pause ? r2(pause.e) : r2(tEnd + 0.15);
  if (!pause) { out.unconfirmed = true; out.by = 'english (unconfirmed)'; out.warning = `no pause after "${tail.length ? tail[tail.length - 1] : out.match.text}" at any threshold — cut ${out.introEnd} s, a little after the word; listen`; }
  // still more announcement right after the cut (a verse range the walk did not know)? say so
  const after = (r.chars || []).filter((c) => c[1] >= out.introEnd && c[1] <= out.introEnd + 2.5).map((c) => c[0]).join('').trim();
  if (INTRO_TAIL_RE.test(after)) { out.unconfirmed = true; out.by = 'english (unconfirmed)'; out.warning = `the announcement seems to go on after the cut ("${after}") — listen`; }
  log(`  intro: "${out.match.text}" ≈ ${m.target} (distance ${m.dist})${tail.length ? ` + "${tail.join(' ')}"` : ''} ends at ${tEnd.toFixed(2)} s → cut at ${out.introEnd.toFixed(2)} s (${pause ? `the pause ${pause.s.toFixed(2)}–${pause.e.toFixed(2)} s at ${pause.thresh}` : 'no pause within 1.5 s'})${out.warning ? `\n  ⚠ ${out.warning}` : ''}`);
  return out;
}
export async function computeBoundaries({ id, row, src, client, intro = 'auto', pad = DEFAULT_PAD, introMax = 30, keep16k = true, log = console.log, cacheDir = CACHE_DIR }) {
  if (!row || !row.ref) throw new Error(`${id} has no ref — the whitelist row needs one before anything is cut`);
  const verses = refVerses(row.ref);
  const N = verses.length;
  const { segs, dur } = detectSegments(src);
  log(`boundaries: ${id} "${row.parsha}" Y${row.year} A${row.aliyah} ${row.ref}: ${N} verses, ${dur.toFixed(2)} s\n  silence table (-50dB, 0.6 s):\n${segTable(segs)}`);
  const flac = to16k(src, join(cacheDir, `${id}.16k.flac`));
  const legacy = legacyIntroEnd(segs);
  let introEnd, introBy, english = null;
  if (typeof intro === 'number') { introEnd = intro; introBy = 'given'; }
  else if (intro === 'silence') { introEnd = legacy; introBy = 'silence'; }
  else {
    english = await englishIntroEnd({ src, flac, row, dur, client, legacy, maxS: introMax, log });
    introEnd = english.introEnd; introBy = english.by;
  }
  if (!isFinite(introEnd) || introEnd < 0 || introEnd >= dur) throw new Error(`intro end ${introEnd} is outside the file`);
  log(`  intro: 0 – ${introEnd.toFixed(2)} s (${introBy}; the first-silence rule says ${legacy.toFixed(2)} s${Math.abs(legacy - introEnd) > 0.3 ? ' — differs' : ''})`);
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
  const firstGap = r2(a.onsets[0] - introEnd);
  if (firstGap > 3) log(`  ⚠ the first word is aligned ${firstGap} s after the intro end — something (more announcement? a long pause?) sits between them; listen`);
  const result = { id, ref: row.ref, introEnd: b[0], introBy, legacyIntro: r2(legacy), boundaries: b, gaps, pad, dur: r2(dur),
    introTranscript: english ? english.transcript : null, introMatch: english ? english.match : null, introUnconfirmed: english ? english.unconfirmed || firstGap > 3 : false, introWarning: english ? english.warning : null,
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
