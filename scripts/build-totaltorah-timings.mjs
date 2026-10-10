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
 * Zero npm dependencies; the Python side is the one isolated environment.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/* ---------- main ---------- */
if (flags.setup) setupEnv();
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
