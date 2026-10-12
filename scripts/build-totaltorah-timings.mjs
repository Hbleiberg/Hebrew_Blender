#!/usr/bin/env node
/*
 * build-totaltorah-timings.mjs — word-level karaoke timings for the Total Torah verse files, by forced
 * alignment. Run after build-totaltorah-audio.mjs split; works per verse FLAC, never on the whole video.
 *
 *   node scripts/build-totaltorah-timings.mjs [--only "Genesis 1:1,Genesis 1:2"] [--minscore 0.5] [--audit] [--setup]
 *
 * For each manifest verse with a FLAC in source-data/totaltorah-cache/verses/:
 *   1. the verse's Hebrew (Sefaria's export, the index builder's cache) is tokenized by the Trainer's own rule
 *      (split on whitespace and maqaf; a token is a sung word iff it carries a Hebrew letter — each side of a
 *      maqaf is its own word, as tokenizeHebrew emits .tt-word cells) and stripped to consonants;
 *   2. scripts/align_totaltorah.py (CTC forced alignment over a Hebrew wav2vec2 model, in the venv at
 *      source-data/totaltorah-cache/align-env/) returns one onset, end and confidence per word;
 *   3. data/totaltorah/timings/<file>.txt is written in the PocketTorah label format the page already reads —
 *      comma-separated word onsets, index = word index, plus ONE trailing value, the end of the last word —
 *      and the manifest entry gets `timings: "<file>.txt"`. `timingsVerified` is never set here: the maintainer
 *      flips it with build-totaltorah-audio.mjs verify --timings after listening with karaoke on. A word under
 *      --minscore (0.5) is reported; the file is still written so it can be audited by ear.
 *
 * --setup creates the venv and installs the pinned requirements (torch CPU, torchaudio, transformers, soundfile,
 * huggingface_hub); the model is pinned by MODEL + MODEL_REVISION below (fill the revision in from the first
 * successful run's output and commit it). If the venv, torch or the model cannot be installed or downloaded the
 * script exits 1 — there is no heuristic fallback (equal split, syllable count): a plausibly wrong highlight is
 * exactly what must not ship.
 *
 * --audit writes source-data/totaltorah-cache/audit.html (gitignored): the verse words with a play button each
 * that plays the verse file from that onset for 1.2 s. Plain <audio> + JS.
 *
 * --boundaries <videoId> [--intro <s>] — the verse boundaries of a whole video, for build-totaltorah-audio.mjs
 * split --boundaries auto. Every Total Torah video opens with a spoken intro, and the cantor's mid-verse pauses
 * (etnachta, zakef) are quieter than her breaths between verses, so silence alone never finds the verses. This
 * mode prints the silence table, takes the intro to end at the first silence after at least a second of sound
 * (--intro <s> overrides it — confirm it by ear), aligns the rest of the file against the aliyah's whole text in
 * one pass, cuts midway through each gap between a verse's last word and the next verse's first, and writes
 * source-data/totaltorah-cache/<id>.boundaries.json. Needs the venv (--setup) and the source audio in the cache.
 *
 * Zero npm dependencies; the Python side is the one isolated environment.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIDEOS, BOOK_CODE } from './totaltorah-videos.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(repoRoot, 'source-data', 'totaltorah-cache');
const TEXT_CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');
const FLAC_DIR = join(CACHE_DIR, 'verses');
const ENV_DIR = join(CACHE_DIR, 'align-env');
const OUT_DIR = join(repoRoot, 'data', 'totaltorah');
const TIMINGS_DIR = join(OUT_DIR, 'timings');
const MANIFEST = join(OUT_DIR, 'manifest.json');
const ALIGNER = join(repoRoot, 'scripts', 'align_totaltorah.py');

const MODEL = 'imvladikon/wav2vec2-xls-r-300m-hebrew';
const MODEL_REVISION = null;   // pin to the commit sha the first successful run prints; null = main
const PIP_REQUIREMENTS = ['torch', 'torchaudio', 'transformers', 'soundfile', 'huggingface_hub'];
const TORCH_CPU_INDEX = 'https://download.pytorch.org/whl/cpu';

const argv = process.argv.slice(2);
const flags = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith('--')) continue;
  const next = argv[i + 1];
  if (next !== undefined && !next.startsWith('--')) { flags[a.slice(2)] = next; i++; } else flags[a.slice(2)] = true;
}
const fail = (msg, code = 1) => { console.error(`\n✗ ${msg}`); process.exit(code); };
const MINSCORE = flags.minscore !== undefined ? parseFloat(flags.minscore) : 0.5;

/* ---------- the Trainer's tokenization, ported (mirrors countHebrewWords / tokenizeHebrew) ---------- */
const NAMED_ENTITIES = { nbsp: ' ', thinsp: ' ', mdash: '—', ndash: '–', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m);
}
function cleanVerse(s) {
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

function loadBookText(book) {
  mkdirSync(TEXT_CACHE_DIR, { recursive: true });
  const path = join(TEXT_CACHE_DIR, `merged-${book}.json`);
  if (!existsSync(path)) {
    const url = `https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/${book}/Hebrew/merged.json`;
    console.log(`  fetching ${url}`);
    writeFileSync(path, execFileSync('curl', ['-sS', '--fail', '--max-time', '120', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
  }
  return JSON.parse(readFileSync(path, 'utf8')).text;
}

/* ---------- the venv ---------- */
const py = join(ENV_DIR, 'bin', 'python3');
function setupEnv() {
  if (!existsSync(py)) {
    console.log(`setup: creating ${ENV_DIR}`);
    const r = spawnSync('python3', ['-m', 'venv', ENV_DIR], { encoding: 'utf8' });
    if (r.status !== 0) fail(`venv failed: ${r.stderr}`);
  }
  console.log(`setup: pip install ${PIP_REQUIREMENTS.join(' ')} (torch from ${TORCH_CPU_INDEX})`);
  const r = spawnSync(join(ENV_DIR, 'bin', 'pip'), ['install', '-q', '--extra-index-url', TORCH_CPU_INDEX, ...PIP_REQUIREMENTS], { encoding: 'utf8', stdio: ['ignore', 'inherit', 'pipe'] });
  if (r.status !== 0) { process.stderr.write(r.stderr || ''); fail('pip install failed — torch will not install on this machine; stopping (no heuristic aligner).'); }
  console.log('setup: ok');
}
function checkEnv() {
  if (!existsSync(py)) fail(`no alignment venv at ${ENV_DIR} — run with --setup first`);
  const r = spawnSync(py, ['-c', 'import torch, torchaudio, transformers; print(torch.__version__, torchaudio.__version__, transformers.__version__)'], { encoding: 'utf8' });
  if (r.status !== 0) fail(`the venv cannot import torch/torchaudio/transformers:\n${r.stderr}`);
  console.log(`env: torch/torchaudio/transformers ${r.stdout.trim()}`);
}

/* ---------- boundaries of a whole video (the cut split --boundaries auto takes) ---------- */
function ffprobeDuration(file) {
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' }).trim());
}
function detectSegments(file, thresh, mindur) {
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
  if (open !== null) silences.push({ s: Math.max(0, open), e: dur });
  const segs = [];
  let prev = 0;
  for (const sil of silences) { if (sil.s - prev > 0.05) segs.push({ start: prev, end: sil.s }); prev = sil.e; }
  if (dur - prev > 0.05) segs.push({ start: prev, end: dur });
  return { segs, dur };
}
function parseRef(ref) {
  const m = /^([A-Z][a-z]+) (\d+):(\d+)-(\d+):(\d+)$/.exec(ref || '');
  if (!m || !BOOK_CODE[m[1]]) fail(`bad ref "${ref}"`, 2);
  return { book: m[1], sc: +m[2], sv: +m[3], ec: +m[4], ev: +m[5] };
}
async function boundariesMode(id) {
  const row = VIDEOS[id];
  if (!row) fail(`"${id}" is not in scripts/totaltorah-videos.mjs — add its row first (the permission record)`, 2);
  let src = null;
  for (const ext of ['m4a', 'mp3']) { const p = join(CACHE_DIR, `${id}.${ext}`); if (existsSync(p)) { src = p; break; } }
  if (!src) fail(`no ${join(CACHE_DIR, id)}.m4a or .mp3 — run build-totaltorah-audio.mjs fetch, or drop the file there`, 2);
  checkEnv();
  const r = parseRef(row.ref);
  const chapters = loadBookText(r.book);
  const verses = [];
  for (let c = r.sc; c <= r.ec; c++) {
    const ch = chapters[c - 1]; if (!ch) fail(`${r.book} has no chapter ${c}`);
    const from = c === r.sc ? r.sv : 1, to = c === r.ec ? r.ev : ch.length;
    for (let v = from; v <= to; v++) verses.push({ key: `${r.book} ${c}:${v}`, words: tokenizeWords(cleanVerse(ch[v - 1])) });
  }
  const N = verses.length;
  const { segs, dur } = detectSegments(src, '-50dB', '0.6');
  console.log(`boundaries: ${id} "${row.parsha}" Y${row.year} A${row.aliyah} ${row.ref}: ${N} verses, ${dur.toFixed(2)} s\n  silence table (-50dB, 0.6 s):`);
  segs.forEach((g, i) => console.log(`  ${String(i + 1).padStart(2)}  ${g.start.toFixed(2).padStart(7)} – ${g.end.toFixed(2).padStart(7)}  (${(g.end - g.start).toFixed(2)} s)`));
  // the intro: every video opens with one; it ends at the first silence after at least a second of sound
  let introEnd;
  if (flags.intro !== undefined) introEnd = parseFloat(flags.intro);
  else { const i = segs.findIndex((g) => g.end - g.start >= 1.0); introEnd = i >= 0 && segs[i + 1] ? segs[i + 1].start : 0; }
  if (!isFinite(introEnd) || introEnd < 0 || introEnd >= dur) fail(`intro end ${introEnd} is outside the file`, 2);
  console.log(`  intro: 0 – ${introEnd.toFixed(2)} s ${flags.intro !== undefined ? '(given)' : '(first silence after ≥1 s of sound — confirm by ear; --intro <s> overrides)'}`);
  const flac = join(CACHE_DIR, `${id}.16k.flac`);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'flac', flac]);
  const words = [], display = [];
  for (const v of verses) for (const w of v.words) { words.push(consonants(w)); display.push(w); }
  if (words.some((w) => !w)) fail('a word stripped to nothing');
  const wordsPath = join(CACHE_DIR, `${id}.full.words.json`), alignPath = join(CACHE_DIR, `${id}.full.align.json`);
  writeFileSync(wordsPath, JSON.stringify({ key: row.ref, words, display, counts: verses.map((v) => v.words.length) }, null, 1));
  const args = [ALIGNER, '--audio', flac, '--words', wordsPath, '--out', alignPath, '--model', MODEL, '--offset', String(introEnd)];
  if (MODEL_REVISION) args.push('--revision', MODEL_REVISION);
  console.log(`  aligning ${words.length} words from ${introEnd.toFixed(2)} s …`);
  const ar = spawnSync(py, args, { encoding: 'utf8' });
  if (ar.status !== 0) { process.stderr.write(ar.stderr || ''); fail('whole-file alignment failed'); }
  const a = JSON.parse(readFileSync(alignPath, 'utf8'));
  const b = [Math.round(introEnd * 100) / 100];
  let i = 0;
  const gaps = [];
  verses.forEach((v, vi) => {
    const n = v.words.length;
    const first = a.onsets[i], lastEnd = a.ends[i + n - 1], minScore = Math.min(...a.scores.slice(i, i + n));
    console.log(`  ${v.key.padEnd(14)} ${first.toFixed(2).padStart(7)} – ${lastEnd.toFixed(2).padStart(7)}  (${n} words, min score ${minScore.toFixed(2)})`);
    if (vi > 0) {
      const prevEnd = a.ends[i - 1];
      const gap = first - prevEnd;
      gaps.push(Math.round(gap * 100) / 100);
      if (gap < 0.3) console.log(`  ⚠ only ${gap.toFixed(2)} s between ${verses[vi - 1].key} and ${v.key} — check this cut by ear`);
      b.push(Math.round(((prevEnd + first) / 2) * 100) / 100);
    }
    i += n;
  });
  b.push(Math.round(Math.min(dur, a.ends[a.ends.length - 1] + 0.4) * 100) / 100);
  const out = { id, ref: row.ref, introEnd: b[0], boundaries: b, gaps, wall: a.wall, model: a.model, revision: a.revision, built: new Date().toISOString().slice(0, 10) };
  writeFileSync(join(CACHE_DIR, `${id}.boundaries.json`), JSON.stringify(out, null, 1) + '\n');
  console.log(`\nboundaries: ${b.join(',')}  (gaps between verses: ${gaps.join(', ')} s; alignment ${a.wall} s)\nwrote ${join(CACHE_DIR, id + '.boundaries.json')}\nnext: node scripts/build-totaltorah-audio.mjs split --video ${id} --boundaries auto`);
}

/* ---------- main ---------- */
if (flags.setup) setupEnv();
if (flags.boundaries) { await boundariesMode(String(flags.boundaries)); process.exit(0); }
if (!existsSync(MANIFEST)) fail(`${MANIFEST} is missing — run build-totaltorah-audio.mjs split first`);
const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const only = flags.only ? new Set(String(flags.only).split(',').map((s) => s.trim())) : null;
const keys = Object.keys(manifest).filter((k) => k !== 'credit' && (!only || only.has(k)));
if (!keys.length) fail('no manifest verses to align');
checkEnv();
mkdirSync(TIMINGS_DIR, { recursive: true });
const books = {};
const results = [];
let anyLow = false;
for (const key of keys) {
  const e = manifest[key];
  const m = /^(\w+) (\d+):(\d+)$/.exec(key);
  if (!m) { console.log(`skip ${key}: not a verse key`); continue; }
  const [, book, c, v] = m;
  const base = e.file.replace(/\.mp3$/, '');
  const flac = join(FLAC_DIR, `${base}.flac`);
  if (!existsSync(flac)) { console.log(`skip ${key}: no ${flac} (re-run split)`); continue; }
  books[book] = books[book] || loadBookText(book);
  const raw = books[book][+c - 1] && books[book][+c - 1][+v - 1];
  if (!raw) fail(`${key}: no text in the Sefaria export`);
  const words = tokenizeWords(cleanVerse(raw));
  const cons = words.map(consonants);
  if (cons.some((w) => !w)) fail(`${key}: a word stripped to nothing (${JSON.stringify(words)})`);
  const wordsPath = join(CACHE_DIR, `${base}.words.json`), alignPath = join(CACHE_DIR, `${base}.align.json`);
  writeFileSync(wordsPath, JSON.stringify({ key, words: cons, display: words }, null, 1));
  const args = [ALIGNER, '--audio', flac, '--words', wordsPath, '--out', alignPath, '--model', MODEL];
  if (MODEL_REVISION) args.push('--revision', MODEL_REVISION);
  console.log(`\nalign ${key}: ${words.length} words`);
  const r = spawnSync(py, args, { encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(r.stderr || ''); fail(`${key}: alignment failed — stopping, nothing written for this verse (no heuristic fallback).`); }
  const a = JSON.parse(readFileSync(alignPath, 'utf8'));
  if (a.onsets.length !== words.length) fail(`${key}: ${a.onsets.length} onsets for ${words.length} words — the page would highlight the wrong words; nothing written`);
  // monotonic onsets, or the file cannot be a karaoke track
  for (let i = 1; i < a.onsets.length; i++) if (a.onsets[i] < a.onsets[i - 1]) fail(`${key}: onsets step back at word ${i}`);
  const low = a.scores.map((s, i) => (s < MINSCORE ? i : -1)).filter((i) => i >= 0);
  if (low.length) anyLow = true;
  console.log(`  ${'#'.padStart(3)}  ${'onset'.padStart(7)}  ${'end'.padStart(7)}  score  word`);
  words.forEach((w, i) => console.log(`  ${String(i).padStart(3)}  ${a.onsets[i].toFixed(2).padStart(7)}  ${a.ends[i].toFixed(2).padStart(7)}  ${a.scores[i].toFixed(2)}${a.scores[i] < MINSCORE ? ' ⚠' : '  '}  ${w}`));
  console.log(`  wall-clock ${a.wall} s · model ${a.model}@${a.revision}${low.length ? ` · ${low.length} word(s) under --minscore ${MINSCORE} → leave timingsVerified:false` : ''}`);
  const line = [...a.onsets.map((t) => t.toFixed(3)), a.ends[a.ends.length - 1].toFixed(3)].join(',');
  writeFileSync(join(TIMINGS_DIR, `${base}.txt`), line + '\n');
  e.timings = `${base}.txt`;
  if (e.timingsVerified) { e.timingsVerified = false; console.log('  (timingsVerified reset: the file was rewritten — listen again)'); }
  results.push({ key, base, words, onsets: a.onsets, ends: a.ends, scores: a.scores, wall: a.wall, low });
}
// write the manifest back in the audio script's order (credit first, verses as they were)
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
console.log(`\nwrote ${results.length} timings file(s) to ${TIMINGS_DIR}/ and updated ${MANIFEST}`);
if (results.length) {
  const total = results.reduce((s, r) => s + r.wall, 0);
  const perVerse = total / results.length;
  console.log(`alignment wall-clock: ${total.toFixed(1)} s for ${results.length} verses (${perVerse.toFixed(1)} s/verse) → 5,845 verses ≈ ${(5845 * perVerse / 3600).toFixed(1)} h on this CPU`);
}
if (anyLow) console.log(`some words scored under ${MINSCORE}: audit those verses by ear before flipping timingsVerified`);
console.log(`\nAfter listening with karaoke on:\n  node scripts/build-totaltorah-audio.mjs verify --timings --verses "${results.map((r) => r.key).join(',')}"`);

if (flags.audit && results.length) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rel = (p) => '../../' + p;   // audit.html sits in source-data/totaltorah-cache/
  let html = `<!doctype html><meta charset="utf-8"><title>Total Torah alignment audit</title>
<style>body{font-family:system-ui;margin:24px;max-width:900px}h2{margin:28px 0 8px}.w{display:inline-flex;gap:4px;align-items:center;margin:4px;padding:4px 6px;border:1px solid #ccc;border-radius:6px;font-size:1.3rem}.w small{font-size:.7rem;color:#666}.low{border-color:#c33}button{font-size:1rem}</style>
<h1>Total Torah alignment audit</h1><p>Each button plays the verse file from the word's onset for 1.2 s. Red: score under ${MINSCORE}.</p>`;
  for (const r of results) {
    html += `<h2>${esc(r.key)} <small>(${r.wall} s)</small></h2><audio id="a-${esc(r.base)}" src="${esc(rel('data/totaltorah/audio/' + r.base + '.mp3'))}" preload="auto" controls></audio><div dir="rtl" lang="he">`;
    r.words.forEach((w, i) => {
      html += `<span class="w${r.scores[i] < MINSCORE ? ' low' : ''}"><button type="button" onclick="playAt('a-${esc(r.base)}',${r.onsets[i]})">▶</button>${esc(w)}<small dir="ltr">${r.onsets[i].toFixed(2)} · ${r.scores[i].toFixed(2)}</small></span>`;
    });
    html += '</div>';
  }
  html += `<script>let _t=null;function playAt(id,t){const a=document.getElementById(id);if(_t)clearTimeout(_t);a.currentTime=t;a.play();_t=setTimeout(()=>a.pause(),1200);}<\/script>`;
  writeFileSync(join(CACHE_DIR, 'audit.html'), html);
  console.log(`audit page: ${join(CACHE_DIR, 'audit.html')} (open it over a local HTTP server from the repo root, e.g. http://localhost:8080/source-data/totaltorah-cache/audit.html)`);
}
