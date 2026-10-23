#!/usr/bin/env node
/*
 * build-totaltorah-bulk.mjs — the whole "Tricks of the Trope – Total Torah" series (Cantor Arianne Brown, Adas Israel
 * Congregation; written permission, Oct 2026) through the Torah Trainer's pipeline at once, instead of one video at a
 * time with /addTOTT. Six steps, each one resumable and safe to re-run:
 *
 *   adas      [--accept]                  the permission record from the Adas pages — source-data/totaltorah-adas/*.tsv,
 *                                         one row per video link read off https://www.adasisrael.org/trope-<book> — into
 *                                         scripts/totaltorah-videos.mjs, each row's verse range cross-checked against
 *                                         data/leyning/triennial.json. Without --accept it only reports.
 *   meta      [--only ids] [--limit N] [--sleep s] [--redo]
 *                                         yt-dlp's metadata for each whitelisted video, no media (this works from a cloud
 *                                         address; the media does not): <id>.info.json in the cache, and title, duration,
 *                                         upload_date on the row; the title ("B'reishit, Year 1 Aliyah 1") is checked
 *                                         against the row → `check`. Progress is written as it goes.
 *   inventory --from <dir>                what a dump holds — the maintainer's own downloads of the series, in any folder
 *                                         layout (book/parasha/year folders, or flat) — matched to the whitelist by the id
 *                                         in a file name "[id]", a yt-dlp .info.json sidecar, or a video list in the dump
 *                                         (a .txt of "<title> - https://www.youtube.com/watch?v=<id>" lines: the files are
 *                                         named by title, so the list says which upload each one is), else by the parasha,
 *                                         year and aliyah named in the file or folder names (English in any common spelling,
 *                                         or Hebrew). Reports what matched, what did not, and which videos are still missing.
 *   stage     --from <dir> [--apply] [--copy]
 *                                         the matched files into the cache as <id>.<ext> (hard links; --copy copies) with
 *                                         an <id>.info.json each (the sidecar, else synthesized from the row and ffprobe).
 *                                         Without --apply it only reports (same as inventory).
 *   run       [--book B] [--parsha P] [--only ids] [--limit N] [--timings derive|realign|none]
 *             [--maftir] [--chazak] [--redo] [--dry-run] [--pad s] [--intro s|silence  (one video: --only <id> --redo)]
 *                                         for each staged video, in Torah order: the boundaries pass (the intro's end
 *                                         read off the English transcript, one whole-file alignment), split --boundaries auto --keep-existing
 *                                         (the series repeats some readings — the first cut of a verse wins), and the
 *                                         timings (derive = from the whole-file alignment, the default; realign = a
 *                                         second pass per verse FLAC). One aligner process for the whole run; a video
 *                                         that fails is logged and the run goes on; a re-run skips what is done.
 *                                         Maftir and "w/Chazak" videos repeat verses an aliyah already holds, so they
 *                                         are skipped unless asked for.
 *   status                                the ledger: per parasha, videos / staged / cut / timed / verified, and the
 *                                         verify commands for what is cut and unheard.
 *
 * Shared: --cache <dir> --out <dir> (a self-test's folders — never --out inside data/ for a test) --videos <file> (the
 * whitelist adas --accept and meta write; default scripts/totaltorah-videos.mjs). Nothing here flips `verified`: the
 * maintainer listens, then build-totaltorah-audio.mjs verify --video <id> / --parsha <name>.
 *
 * The ledger and logs live in <cache>/bulk/ (gitignored with the cache): status.json, inventory.json, logs/<id>.log.
 * run --ledger <name> keeps its own status-<name>.json, so two runs can go at once on different --book / --out pairs
 * (never the same --out: each run merges that folder's manifest); status reads every ledger.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, linkSync, copyFileSync, unlinkSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CACHE_DIR as REAL_CACHE, OUT_DIR as REAL_OUT, BOOK_CODE, SOURCE_EXTS, DEFAULT_PAD, AlignerClient, checkEnv, sourceAudio, computeBoundaries,
  refVerses, deriveVideoTimings, alignVerses, ffprobeDuration, parseRef, loadBookText, r2 } from './totaltorah-lib.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_SCRIPT = join(repoRoot, 'scripts', 'build-totaltorah-audio.mjs');
const ADAS_DIR = join(repoRoot, 'source-data', 'totaltorah-adas');
const REAL_VIDEOS = join(repoRoot, 'scripts', 'totaltorah-videos.mjs');

/* ---------- args ---------- */
const argv = process.argv.slice(2);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) {
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) { flags[a.slice(2)] = next; i++; } else flags[a.slice(2)] = true;
  } else positional.push(a);
}
const cmd = positional[0] || null;
const CACHE = flags.cache ? String(flags.cache) : REAL_CACHE;
const OUT = flags.out ? String(flags.out) : REAL_OUT;
const VIDEOS_PATH = flags.videos ? String(flags.videos) : REAL_VIDEOS;
const BULK_DIR = join(CACHE, 'bulk');
const LOG_DIR = join(BULK_DIR, 'logs');
// --ledger <name>: a run of its own ledger (status-<name>.json), so two runs can go at once on different books with
// different --out folders; `status` reads every ledger. Two runs must never share an --out (each merges its manifest).
const STATUS_PATH = join(BULK_DIR, flags.ledger ? `status-${String(flags.ledger).replace(/[^\w-]/g, '_')}.json` : 'status.json');
const INVENTORY_PATH = join(BULK_DIR, 'inventory.json');
const MANIFEST = join(OUT, 'manifest.json');
const AUDIO_DIR = join(OUT, 'audio');
const TIMINGS_DIR = join(OUT, 'timings');
const FLAC_DIR = join(CACHE, 'verses');
const fail = (msg, code = 1) => { console.error(`\n✗ ${msg}`); process.exit(code); };
const today = () => new Date().toISOString().slice(0, 10);
const fmtS = (s) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${(s / 60).toFixed(1)} min` : `${Math.round(s)} s`);

/* ---------- the tables ---------- */
const PARSHIYOT = JSON.parse(readFileSync(join(repoRoot, 'data', 'parshiyot.json'), 'utf8'));
const TRI = JSON.parse(readFileSync(join(repoRoot, 'data', 'leyning', 'triennial.json'), 'utf8'));
const BOOKS = Object.keys(BOOK_CODE);
const byN = new Map(PARSHIYOT.map((p) => [p.n, p]));
const byEn = new Map(PARSHIYOT.map((p) => [p.en, p]));
const PAIRS = Object.keys(TRI.combined).map((k) => k.split('-').map(Number));   // [[22,23], …]
const pairOf = (n) => PAIRS.find((pr) => pr.includes(n)) || null;
const ALIYAH_KEYS = ['1', '2', '3', '4', '5', '6', '7', 'M'];
const SINGLE_SET = new Set([53, 54]);   // Ha'azinu and V'Zot HaBerachah: one set of videos for all three years

/* ---------- names: any spelling of a parasha (English or Hebrew) to its number ---------- */
// The skeleton drops what transliterations disagree on: apostrophes, vowels, a final h, kh/ch, tz/ts/z, q/k, w/v.
function skel(s) {
  let t = String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/[א-ת]/.test(t)) return t.replace(/[֑-ׇ]/g, '').replace(/[^א-ת]/g, '').replace(/[ךםןףץ]/g, (c) => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }[c]));
  t = t.replace(/[’'`ʼ‘]/g, '').replace(/kh/g, 'ch').replace(/tz|ts/g, 'z').replace(/ph/g, 'f').replace(/q/g, 'k').replace(/w/g, 'v');
  t = t.split(/[^a-z]+/).filter(Boolean).map((w) => w.replace(/h$/, '')).join('');
  return t.replace(/[aeiou]/g, '').replace(/(.)\1+/g, '$1');   // Nasso/Naso, Tissa/Tisa
}
const NAME_INDEX = new Map();   // skeleton → parasha number
function addName(name, n) { const k = skel(name); if (!k) return; if (NAME_INDEX.has(k) && NAME_INDEX.get(k) !== n) throw new Error(`name skeleton collision: "${name}" (${k}) → ${n} and ${NAME_INDEX.get(k)}`); NAME_INDEX.set(k, n); }
for (const p of PARSHIYOT) { addName(p.en, p.n); addName(p.pocket, p.n); addName(p.he, p.n); }
const ALIASES = { Noah: 2, Jethro: 17, Korah: 38, Pinhas: 41, Phinehas: 41, 'Shlach Lecha': 37, 'Shelach Lecha': 37, 'Shelach': 37, Vayehi: 12, 'Vezot Haberakhah': 54, 'Simchat Torah': 54, 'Simhat Torah': 54, Haazinu: 53, Hukkat: 39, Toledot: 6, Toldos: 6, 'Achare Mot': 29, 'Aharei Mot': 29, Mikeitz: 10, Breishit: 1, Bereishit: 1, Vaera: 14, Shmot: 13, Dvarim: 44, Bmidbar: 34 };
for (const [name, n] of Object.entries(ALIASES)) addName(name, n);
const BOOK_INDEX = new Map(BOOKS.map((b) => [skel(b), b]));
// → { kind: 'parasha', n } | { kind: 'pair', ns: [a, b] } | { kind: 'book', book } | null
export function matchName(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const whole = NAME_INDEX.get(skel(s));
  if (whole) return { kind: 'parasha', n: whole };
  if (BOOK_INDEX.has(skel(s))) return { kind: 'book', book: BOOK_INDEX.get(skel(s)) };
  const parts = s.split(/\s*[-–—/]\s*/).map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const ns = parts.map((x) => NAME_INDEX.get(skel(x)) || null);
    if (ns[0] && ns[1]) {
      const pr = pairOf(ns[0]);
      if (pr && pr.includes(ns[1]) && ns[0] !== ns[1]) return { kind: 'pair', ns: [Math.min(ns[0], ns[1]), Math.max(ns[0], ns[1])] };
    }
    if (ns[0]) return { kind: 'parasha', n: ns[0] };
  }
  return null;
}
const unitName = (u) => (u.kind === 'pair' ? u.ns.map((n) => byN.get(n).en).join('-') : byN.get(u.n).en);
const unitBook = (u) => byN.get(u.kind === 'pair' ? u.ns[0] : u.n).book;
const unitFirstN = (u) => (u.kind === 'pair' ? u.ns[0] : u.n);
// a whitelist row's parsha field back to a unit ('Lech-Lecha' is one parasha; 'Vayakhel-Pekudei' a pair)
function rowUnit(row) { return byEn.has(row.parsha) ? { kind: 'parasha', n: byEn.get(row.parsha).n } : matchName(row.parsha); }

/* ---------- labels and titles: "B'reishit, Year 1 Aliyah 1", "Maftir, Vayakhel w/Chazak:", "Year 3, Aliyah 7 w/Chazak" ---------- */
export function parseBits(text) {
  let s = String(text || '').replace(/\[[\w-]{11}\]/g, ' ').replace(/\.(mp3|m4a|webm|opus|ogg|wav|flac|aac)$/i, '');
  const out = { year: null, aliyah: null, chazak: /chazak|hazak/i.test(s), nameText: '' };
  let m = /\byear\s*[-:_#]?\s*([1-3])\b/i.exec(s) || /\by(?:r)?\s*[-:_#]?\s*([1-3])\b/i.exec(s);
  if (m) out.year = +m[1];
  m = /\baliy(?:ah|a|yah)?\s*[-:_#]?\s*([1-7])\b/i.exec(s);
  if (m) out.aliyah = +m[1];
  if (/\bmaftir\b/i.test(s)) out.aliyah = 'M';
  s = s.replace(/\byear\s*[-:_#]?\s*[1-3]\b/ig, ' ').replace(/\by(?:r)?\s*[-:_#]?\s*[1-3]\b/ig, ' ')
    .replace(/\baliy(?:ah|a|yah)?\s*[-:_#]?\s*[1-7]\b/ig, ' ').replace(/\bmaftir\b/ig, ' ')
    .replace(/\b(?:w\/|with)\s*(?:chazak|hazak)\b/ig, ' ').replace(/\b(?:chazak|hazak)\b/ig, ' ')
    .replace(/\bparsh[a]?t\b/ig, ' ').replace(/\bw\//g, ' ').replace(/[:,;|_]+/g, ' ').replace(/\s+/g, ' ').trim();
  out.nameText = s;
  return out;
}

/* ---------- hebcal ---------- */
function hebcalAliyah(unit, year, key) {
  if (unit.kind === 'pair') { const c = TRI.combined[unit.ns.join('-')]; const v = c && c.years && c.years[`Y.${year}`]; return (v && v[key]) || null; }
  const e = TRI.parshiyot[String(unit.n)];
  const v = e && e.variations && e.variations[`Y.${year}`];
  return (v && v[key]) || null;
}
function hebcalMaftirs(unit) {   // every M range the tables know for the unit, with the year when it is a Y.* table
  const out = [];
  if (unit.kind === 'pair') { const c = TRI.combined[unit.ns.join('-')]; for (const y of [1, 2, 3]) { const v = c.years[`Y.${y}`]; if (v && v.M) out.push({ range: v.M, year: y }); } return out; }
  const e = TRI.parshiyot[String(unit.n)];
  for (const [vk, v] of Object.entries(e.variations || {})) if (v.M) out.push({ range: v.M, year: vk.startsWith('Y.') ? +vk.slice(2) : null, variation: vk });
  return out;
}
const rangeStr = (r) => `${r[0]}-${r[1]}`;
const refOf = (book, r) => `${book} ${r[0]}-${r[1]}`;

/* ---------- the page's ranges ---------- */
export function parsePageRange(s) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  const m = /^(\d+)\s*[:.]\s*(\d+)\s*(?:[-–—]+|\s)\s*(?:(\d+)\s*[:.]\s*)?(\d+)$/.exec(t);
  if (!m) return null;
  const c1 = +m[1], v1 = +m[2], c2 = m[3] ? +m[3] : c1, v2 = +m[4];
  return { c1, v1, c2, v2, pair: [`${c1}:${v1}`, `${c2}:${v2}`], ordered: c1 < c2 || (c1 === c2 && v1 <= v2) };
}
const _chapters = {};
function chaptersOf(book) {   // Sefaria's export, when it can be had; null offline (the bounds check is then skipped)
  if (_chapters[book] !== undefined) return _chapters[book];
  try { _chapters[book] = loadBookText(book); } catch { _chapters[book] = null; }
  return _chapters[book];
}
function rangeInBook(book, pr) {
  const ch = chaptersOf(book);
  if (!ch) return true;
  return !!(ch[pr.c1 - 1] && ch[pr.c2 - 1] && pr.v1 >= 1 && pr.v2 >= 1 && pr.v1 <= ch[pr.c1 - 1].length && pr.v2 <= ch[pr.c2 - 1].length);
}
const cvLe = (a, b) => a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1]);
const cvOf = (s) => s.split(':').map(Number);
// the verses a unit spans (data/parshiyot.json's ref; a pair spans from the first's start to the second's end)
function unitSpan(unit) {
  const first = byN.get(unitFirstN(unit)), last = byN.get(unit.kind === 'pair' ? unit.ns[1] : unit.n);
  const m1 = /(\d+):(\d+)-(\d+):(\d+)$/.exec(first.ref), m2 = /(\d+):(\d+)-(\d+):(\d+)$/.exec(last.ref);
  return { start: [+m1[1], +m1[2]], end: [+m2[3], +m2[4]] };
}
function rangeInSpan(unit, pr) { const sp = unitSpan(unit); return cvLe(sp.start, [pr.c1, pr.v1]) && cvLe([pr.c2, pr.v2], sp.end); }
function verseCount(book, pr) {
  const ch = chaptersOf(book);
  if (!ch) return pr.c1 === pr.c2 ? pr.v2 - pr.v1 + 1 : 999;
  let n = 0;
  for (let c = pr.c1; c <= pr.c2; c++) { const from = c === pr.c1 ? pr.v1 : 1, to = c === pr.c2 ? pr.v2 : ch[c - 1].length; n += to - from + 1; }
  return n;
}
function nextVerse(book, cv) {   // the verse after c:v, across a chapter end (null when the text is not at hand)
  const ch = chaptersOf(book);
  if (!ch) return null;
  return cv[1] < ch[cv[0] - 1].length ? [cv[0], cv[1] + 1] : [cv[0] + 1, 1];
}

/* ---------- the whitelist file ---------- */
async function loadVideos(path = VIDEOS_PATH) {
  if (!existsSync(path)) return {};
  const mod = await import(pathToFileURL(path).href + `?t=${Date.now()}`);
  return mod.VIDEOS || {};
}
const isIdent = (k) => /^[A-Za-z_$][\w$]*$/.test(k);
const lit = (v) => (v === null ? 'null' : typeof v === 'number' || typeof v === 'boolean' ? String(v) : `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ')}'`);
const ROW_KEYS = ['parsha', 'year', 'aliyah', 'ref', 'page', 'variant', 'note', 'title', 'duration', 'upload_date', 'check'];
function rowLiteral(r) { return `{ ${ROW_KEYS.filter((k) => r[k] !== undefined).map((k) => `${k}: ${lit(r[k])}`).join(', ')} }`; }
function rowOrder(id, r) {
  const u = rowUnit(r);
  const n = u ? unitFirstN(u) : 99;
  const book = u ? BOOKS.indexOf(unitBook(u)) : 9;
  const al = r.aliyah === 'M' ? 8 : +r.aliyah || 0;
  return [book, n, r.year ?? 0, al, r.variant ? 1 : 0, id];
}
const cmpOrder = (a, b) => { for (let i = 0; i < a.length; i++) { if (a[i] < b[i]) return -1; if (a[i] > b[i]) return 1; } return 0; };
function sortedIds(videos) { return Object.keys(videos).sort((a, b) => cmpOrder(rowOrder(a, videos[a]), rowOrder(b, videos[b]))); }
export function writeVideos(videos, path, missing = []) {
  const ids = sortedIds(videos);
  const lines = [
    '// The Tricks of the Trope – Total Torah videos the pipeline may touch — the permission record, one row per video.',
    '// Grown from https://www.adasisrael.org/trope (its five book pages, kept as source-data/totaltorah-adas/*.tsv) by',
    '// `build-totaltorah-bulk.mjs adas --accept`, or one video at a time by the /addTOTT skill — never from a dump\'s file names.',
    '// A row: parsha (as data/parshiyot.json spells it; a doubled pair joined by \'-\'), year (1–3; null = one set for every year),',
    '// aliyah (1–7 or \'M\'), ref (the verse range the video chants — the cut and the alignment follow it; data/leyning/triennial.json\'s',
    '// division unless `note` says otherwise), page (the range as the Adas page prints it), variant (\'chazak\': the Chazak ending),',
    '// note (a cross-check that did not agree); after `meta`: title, duration (s), upload_date and check (the title cross-check).',
  ];
  if (missing.length) { lines.push('// Listed on the page without a video link (no row until an id is known):'); for (const m of missing) lines.push(`//   ${m}`); }
  lines.push('export const VIDEOS = {');
  for (const id of ids) lines.push(`  ${isIdent(id) ? id : lit(id)}: ${rowLiteral(videos[id])},`);
  lines.push('};');
  lines.push(`export const BOOK_CODE = { Genesis: 'gen', Exodus: 'exo', Leviticus: 'lev', Numbers: 'num', Deuteronomy: 'deu' };`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, lines.join('\n') + '\n');
}

/* ================================================================== adas ================================================================== */
function readAdasListing() {
  if (!existsSync(ADAS_DIR)) fail(`${ADAS_DIR} is missing`);
  const rows = [];
  for (const f of readdirSync(ADAS_DIR).filter((x) => x.endsWith('.tsv')).sort()) {
    const book = BOOKS.find((b) => b.toLowerCase() === basename(f, '.tsv').toLowerCase());
    if (!book) fail(`${f}: the file name must be a Torah book (genesis.tsv … deuteronomy.tsv)`);
    const text = readFileSync(join(ADAS_DIR, f), 'utf8');
    text.split('\n').forEach((line, i) => {
      if (!line.trim() || line.startsWith('#')) return;
      const cells = line.split('\t');
      if (cells.length !== 5) fail(`${f}:${i + 1}: ${cells.length} columns, not 5`);
      const [heading, label, pos, id, range] = cells.map((c) => c.trim());
      if (id !== 'NONE' && !/^[\w-]{11}$/.test(id)) fail(`${f}:${i + 1}: "${id}" is not a YouTube id`);
      rows.push({ book, file: f, line: i + 1, heading, label, pos: +pos, id: id === 'NONE' ? null : id, range });
    });
  }
  return rows;
}
// First pass: what the page row says (unit, year, aliyah, its parsed range); the ref is decided in rowFromListing
// once the neighbours are known, because the page's own division wins over hebcal's when it is consistent.
export function describeListing(e) {
  const notes = [];
  const unit = matchName(e.heading);
  if (!unit || unit.kind === 'book') return { error: `heading "${e.heading}" is no parasha` };
  if (unitBook(unit) !== e.book) notes.push(`heading is a ${unitBook(unit)} parasha in ${e.file}`);
  const bits = parseBits(e.label);
  // the unit the label names (a maftir of one part of a pair), else the heading's
  let target = unit;
  if (bits.nameText) { const named = matchName(bits.nameText); if (named && named.kind !== 'book') target = named; }
  const key = bits.aliyah === 'M' ? 'M' : bits.aliyah ? String(bits.aliyah) : null;
  if (!key) return { error: `label "${e.label}" names no aliyah` };
  const single = SINGLE_SET.has(unitFirstN(unit));
  const year = bits.year ?? (key === 'M' ? null : single ? null : e.pos);
  if (key !== 'M' && !single && !bits.year && !(e.pos >= 1 && e.pos <= 3)) return { error: `position ${e.pos} is not a year column` };
  const book = unitBook(target);
  const pr = parsePageRange(e.range);
  const pageOk = !!(pr && pr.ordered && rangeInBook(book, pr));
  if (!pr) notes.push(`unreadable range "${e.range}"`);
  else if (!pr.ordered) notes.push(`page range "${e.range}" runs backwards`);
  else if (!pageOk) notes.push(`page range "${e.range}" is outside ${book}`);
  else if (!rangeInSpan(target, pr)) notes.push(`page range "${e.range}" is outside ${unitName(target)}`);
  const usable = pageOk && rangeInSpan(target, pr) && verseCount(book, pr) <= 80;
  return { d: { e, unit, target, key, year, single, book, pr, usable, chazak: bits.chazak, notes } };
}
// The ref of one described row. `neighbours` are the same unit+year's aliyah rows (by key), for the chain test:
// a page range that follows its predecessor and leads into its successor is the division the videos were cut
// to, hebcal or not (Adas divides a few readings differently); a range that breaks the chain is a typo.
export function rowFromListing(d, neighbours = {}) {
  const { target, key, book, pr, usable, single, chazak } = d;
  let { year } = d;
  const notes = d.notes.slice();
  let ref = null;
  if (key === 'M') {
    const cands = hebcalMaftirs(target);
    const hit = usable && cands.find((c) => rangeStr(c.range) === rangeStr(pr.pair));
    if (hit) { ref = refOf(book, pr.pair); if (year === null && hit.year) year = hit.year; }
    else if (usable) { ref = refOf(book, pr.pair); notes.push(`maftir differs from hebcal's (${[...new Set(cands.map((c) => rangeStr(c.range)))].join(', ') || 'none'})`); }
    else { const last = cands.find((c) => c.year === 3) || cands[cands.length - 1]; if (last) { ref = refOf(book, last.range); year = year ?? last.year ?? null; notes.push(`ref taken from hebcal's ${last.variation || 'Y.' + last.year} maftir ${rangeStr(last.range)}`); } }
  } else {
    const hb = hebcalAliyah(target, year ?? 1, key);
    const pageIsHebcal = usable && hb && rangeStr(hb) === rangeStr(pr.pair);
    let chainOk = usable;
    if (usable) {
      const prev = neighbours[String(+key - 1)], next = neighbours[String(+key + 1)];
      if (prev && prev.usable) { const nv = nextVerse(book, [prev.pr.c2, prev.pr.v2]); if (nv && (nv[0] !== pr.c1 || nv[1] !== pr.v1)) chainOk = false; }
      if (next && next.usable) { const nv = nextVerse(book, [pr.c2, pr.v2]); if (nv && (nv[0] !== next.pr.c1 || nv[1] !== next.pr.v1)) chainOk = false; }
    }
    if (pageIsHebcal) ref = refOf(book, pr.pair);
    else if (usable && (chainOk || !hb)) {
      ref = refOf(book, pr.pair);
      const other = [1, 2, 3].find((y) => y !== (year ?? 1) && hebcalAliyah(target, y, key) && rangeStr(hebcalAliyah(target, y, key)) === rangeStr(pr.pair));
      if (other) notes.push(`range is hebcal's Y.${other} aliyah ${key} — the title check decides the year`);
      else notes.push(hb ? `page division differs from hebcal (${rangeStr(hb)})` : 'no hebcal entry — ref from the page');
    } else if (hb) { ref = refOf(book, hb); notes.push(usable ? `page says ${rangeStr(pr.pair)}, which breaks the chain; ref follows hebcal ${rangeStr(hb)}` : `ref taken from hebcal ${rangeStr(hb)}`); }
    else if (usable) ref = refOf(book, pr.pair);
  }
  if (single && year === null && key !== 'M') notes.push('one set for every year');
  const row = { parsha: unitName(target), year, aliyah: key === 'M' ? 'M' : +key, ref, page: d.e.range };
  if (chazak) row.variant = 'chazak';
  if (notes.length) row.note = notes.join('; ');
  return row;
}
async function cmdAdas() {
  const listing = readAdasListing();
  const existing = await loadVideos();
  const videos = {};
  const missing = [];
  const problems = [];
  const dupIds = new Map();
  const described = [];
  for (const e of listing) {
    const { d, error } = describeListing(e);
    if (error) { problems.push(`${e.file}:${e.line}: ${error}`); continue; }
    described.push(d);
  }
  // the neighbours of each plain aliyah row: the same unit and year, keyed by aliyah number
  const groups = new Map();
  for (const d of described) {
    if (d.key === 'M' || d.chazak) continue;
    const g = `${unitName(d.target)}|${d.year ?? '-'}`;
    if (!groups.has(g)) groups.set(g, {});
    groups.get(g)[d.key] = d;
  }
  for (const d of described) {
    const e = d.e;
    const row = rowFromListing(d, groups.get(`${unitName(d.target)}|${d.year ?? '-'}`) || {});
    if (!e.id) { missing.push(`${e.heading} ${e.label} (position ${e.pos}, ${e.range}) → ${row.parsha} Y${row.year ?? '-'} A${row.aliyah}`); continue; }
    if (videos[e.id]) { dupIds.set(e.id, (dupIds.get(e.id) || 1) + 1); problems.push(`${e.file}:${e.line}: id ${e.id} appears more than once (also ${videos[e.id].parsha} Y${videos[e.id].year} A${videos[e.id].aliyah})`); continue; }
    const prev = existing[e.id] || {};
    for (const k of ['title', 'duration', 'upload_date', 'check']) if (prev[k] !== undefined) row[k] = prev[k];
    videos[e.id] = row;
  }
  // rows the page does not list (added by hand through /addTOTT) stay
  const kept = Object.keys(existing).filter((id) => !videos[id]);
  for (const id of kept) videos[id] = existing[id];
  const ids = Object.keys(videos);
  const refDup = new Map();
  for (const id of ids) { const r = videos[id]; if (r.ref && !r.variant && r.aliyah !== 'M') refDup.set(r.ref, (refDup.get(r.ref) || []).concat(id)); }
  const repeats = [...refDup.entries()].filter(([, v]) => v.length > 1);
  const perBook = {};
  for (const id of ids) { const u = rowUnit(videos[id]); const b = u ? unitBook(u) : '?'; perBook[b] = (perBook[b] || 0) + 1; }
  console.log(`adas: ${listing.length} page rows → ${Object.keys(videos).length - kept.length} video rows (${missing.length} without a video link, ${problems.length} problems)${kept.length ? `; ${kept.length} existing row(s) not on the page kept` : ''}`);
  console.log(`  per book: ${BOOKS.map((b) => `${b} ${perBook[b] || 0}`).join(', ')}`);
  const counts = { aliyot: 0, maftir: 0, chazak: 0, noRef: 0, noted: 0, allYears: 0 };
  for (const id of ids) { const r = videos[id]; if (r.variant) counts.chazak++; else if (r.aliyah === 'M') counts.maftir++; else counts.aliyot++; if (!r.ref) counts.noRef++; if (r.note) counts.noted++; if (r.year === null && r.aliyah !== 'M') counts.allYears++; }
  console.log(`  ${counts.aliyot} aliyah videos (${counts.allYears} of them one set for every year), ${counts.maftir} maftir videos, ${counts.chazak} Chazak variants; ${counts.noRef} without a ref; ${counts.noted} with a note`);
  if (repeats.length) console.log(`  ${repeats.length} ranges chanted by more than one video (the series repeats some readings; the first cut wins):\n` + repeats.map(([ref, v]) => `    ${ref}: ${v.join(', ')}`).join('\n'));
  if (missing.length) console.log(`  page entries without a video link:\n` + missing.map((m) => `    ${m}`).join('\n'));
  const noted = ids.filter((id) => videos[id].note && !/one set for every year/.test(videos[id].note) || !videos[id].ref);
  if (noted.length) console.log(`  notes:\n` + noted.map((id) => `    ${id}  ${videos[id].parsha} Y${videos[id].year ?? '-'} A${videos[id].aliyah}${videos[id].variant ? ' chazak' : ''}: ${videos[id].note}${videos[id].ref ? '' : ' → NO REF (skipped by run until set by hand)'}`).join('\n'));
  if (problems.length) console.log(`  problems:\n` + problems.map((p) => `    ${p}`).join('\n'));
  if (flags.accept) {
    writeVideos(videos, VIDEOS_PATH, missing);
    console.log(`\nwrote ${VIDEOS_PATH} (${Object.keys(videos).length} rows)`);
  } else console.log(`\n(report only — add --accept to write ${VIDEOS_PATH})`);
}

/* ================================================================== meta ================================================================== */
function ytDlpPath() {
  if (flags['yt-dlp']) return String(flags['yt-dlp']);
  const local = join(CACHE, 'tools-env', 'bin', 'yt-dlp');
  if (existsSync(local)) return local;
  const w = spawnSync('which', ['yt-dlp'], { encoding: 'utf8' });
  return w.status === 0 && w.stdout.trim() ? w.stdout.trim() : null;
}
export function titleCheck(row, info) {
  const problems = [];
  const chan = `${info.channel || ''} ${info.uploader || ''}`;
  if (!/total torah|tricks of the trope/i.test(chan)) problems.push(`channel "${(info.channel || info.uploader || '?').trim()}"`);
  const bits = parseBits(info.title || '');
  if (bits.year && row.year && bits.year !== row.year) problems.push(`title says year ${bits.year}`);
  if (bits.aliyah && String(bits.aliyah) !== String(row.aliyah)) problems.push(`title says aliyah ${bits.aliyah}`);
  if (!!bits.chazak !== (row.variant === 'chazak')) problems.push(bits.chazak ? 'title says Chazak' : 'title has no Chazak');
  const named = matchName(bits.nameText);
  const unit = rowUnit(row);
  if (named && named.kind !== 'book' && unit) {
    const rowNs = unit.kind === 'pair' ? unit.ns : [unit.n];
    const titleNs = named.kind === 'pair' ? named.ns : [named.n];
    if (!titleNs.every((n) => rowNs.includes(n) || (pairOf(n) && rowNs.some((m) => pairOf(n).includes(m))))) problems.push(`title names "${bits.nameText}"`);
  }
  return problems.length ? problems.join('; ') : 'ok';
}
// Two ways to read a video's metadata without its media: YouTube's oEmbed endpoint (the default — title and channel,
// no bot gate, a few hundred milliseconds each) or yt-dlp (--ytdlp: also the duration and upload date, written as
// <id>.info.json for split; YouTube's bot gate refuses it from a cloud address after a call or two).
async function cmdMeta() {
  const videos = await loadVideos();
  const method = flags.ytdlp ? 'ytdlp' : 'oembed';
  const ytdlp = method === 'ytdlp' ? ytDlpPath() : null;
  if (method === 'ytdlp' && !ytdlp) fail('yt-dlp is not installed (pip install -U yt-dlp into source-data/totaltorah-cache/tools-env, or --yt-dlp <path>)', 2);
  const only = flags.only ? new Set(String(flags.only).split(',').map((s) => s.trim())) : null;
  const limit = flags.limit ? +flags.limit : Infinity;
  const sleepMs = Math.round((flags.sleep !== undefined ? parseFloat(flags.sleep) : method === 'ytdlp' ? 1.5 : 0.3) * 1000);
  mkdirSync(CACHE, { recursive: true });
  let done = 0, ok = 0, flagged = 0, failed = 0, dirty = 0;
  const ids = sortedIds(videos).filter((id) => !only || only.has(id));
  const isDone = (id) => (method === 'ytdlp' ? videos[id].title && existsSync(join(CACHE, `${id}.info.json`)) : videos[id].check === 'ok');
  const todo = ids.filter((id) => flags.redo || !isDone(id));
  console.log(`meta (${method}): ${todo.length} of ${ids.length} videos to fetch (metadata only; about ${fmtS(todo.length * (sleepMs / 1000 + (method === 'ytdlp' ? 3 : 0.4)))})`);
  const t0 = Date.now();
  for (const id of todo) {
    if (done >= limit) break;
    const row = videos[id];
    const infoPath = join(CACHE, `${id}.info.json`);
    let info = null;
    if (method === 'oembed') {
      const r = spawnSync('curl', ['-sS', '--max-time', '30', '-w', '\n%{http_code}', `https://www.youtube.com/oembed?url=https://youtu.be/${id}&format=json`], { encoding: 'utf8' });
      const lines = (r.stdout || '').trim().split('\n');
      const code = lines.pop();
      let j = null;
      if (r.status === 0 && code === '200') { try { j = JSON.parse(lines.join('\n')); } catch { j = null; } }
      if (!j || !j.title) {
        failed++; done++; dirty++;
        row.check = code === '400' || code === '404' ? `no such video (http ${code}) — the id may be mistyped on the listing, or the video is private`
          : code === '403' ? 'oEmbed refused (http 403): embedding is off or the video is restricted — the id is probably right; confirm with meta --ytdlp from a home address'
            : `metadata failed (http ${code || '?'})`;
        console.log(`  ✗ ${id} ${row.parsha} Y${row.year ?? '-'} A${row.aliyah}: ${row.check}`);
        if (code === '429') { console.log('  YouTube is throttling this address — stopping; re-run later to resume.'); break; }
        if (sleepMs) await new Promise((res) => setTimeout(res, sleepMs));
        continue;
      }
      info = { id, title: j.title, channel: j.author_name || '', uploader: j.author_name || '' };
    } else if (!flags.redo && existsSync(infoPath)) { try { info = JSON.parse(readFileSync(infoPath, 'utf8')); } catch { info = null; } }
    if (!info) {
      const args = ['--skip-download', '--write-info-json', '--no-playlist', '--no-warnings', '--js-runtimes', `node:${process.execPath}`, '-o', join(CACHE, '%(id)s.%(ext)s'), `https://youtu.be/${id}`];
      if (process.env.HTTPS_PROXY) args.unshift('--proxy', process.env.HTTPS_PROXY);
      const r = spawnSync(ytdlp, args, { encoding: 'utf8', timeout: 180000 });
      if (r.status !== 0 || !existsSync(infoPath)) {
        failed++; done++;
        const why = (r.stderr || r.stdout || '').trim().split('\n').pop() || `exit ${r.status}`;
        row.check = `metadata failed: ${why.slice(0, 160)}`;
        dirty++;
        console.log(`  ✗ ${id} ${row.parsha} Y${row.year ?? '-'} A${row.aliyah}: ${why.slice(0, 200)}`);
        if (/429|too many requests|sign in to confirm/i.test(why)) { console.log('  YouTube is throttling this address — stopping; re-run later to resume.'); break; }
        if (sleepMs) await new Promise((res) => setTimeout(res, sleepMs));
        continue;
      }
      info = JSON.parse(readFileSync(infoPath, 'utf8'));
    }
    row.title = info.title || '';
    if (typeof info.duration === 'number') row.duration = info.duration;
    if (info.upload_date) row.upload_date = info.upload_date;
    row.check = titleCheck(row, info);
    if (row.check === 'ok') ok++; else flagged++;
    done++; dirty++;
    console.log(`  ${row.check === 'ok' ? '✓' : '⚠'} ${id} ${row.parsha} Y${row.year ?? '-'} A${row.aliyah}${row.variant ? ' chazak' : ''} — "${row.title}" ${row.duration ?? '?'} s${row.check === 'ok' ? '' : ' — ' + row.check}`);
    if (dirty >= 10) { writeVideos(videos, VIDEOS_PATH); dirty = 0; }
    if (sleepMs && !existsSync(join(CACHE, '.no-sleep'))) await new Promise((res) => setTimeout(res, sleepMs));
  }
  if (dirty) writeVideos(videos, VIDEOS_PATH);
  console.log(`\nmeta: ${done} fetched (${ok} ok, ${flagged} flagged, ${failed} failed) in ${fmtS((Date.now() - t0) / 1000)}; ${todo.length - done} left. Rows updated in ${VIDEOS_PATH}.`);
  const bad = Object.keys(videos).filter((id) => videos[id].check && videos[id].check !== 'ok');
  if (bad.length) console.log(`flagged rows (${bad.length}):\n` + bad.map((id) => `  ${id} ${videos[id].parsha} Y${videos[id].year ?? '-'} A${videos[id].aliyah}: ${videos[id].check}`).join('\n'));
}

/* ================================================================== inventory / stage ================================================================== */
function walk(dir, out = [], root = dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const p = join(dir, name);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out, root);
    else if (SOURCE_EXTS.includes(extname(name).slice(1).toLowerCase())) out.push({ path: p, rel: relative(root, p), name, size: st.size, mtime: st.mtimeMs });
  }
  return out;
}
function sidecarOf(file) {
  const base = file.path.slice(0, -extname(file.path).length);
  for (const cand of [`${base}.info.json`, `${file.path}.info.json`, `${base}.json`]) {
    if (!existsSync(cand)) continue;
    try { const j = JSON.parse(readFileSync(cand, 'utf8')); if (j && typeof j === 'object' && /^[\w-]{11}$/.test(j.id || '')) return { path: cand, info: j }; } catch { /* not yt-dlp's */ }
  }
  return null;
}
// A dump's own video list: any .txt under it whose lines read "<title> - https://www.youtube.com/watch?v=<id>" (the
// list the maintainer downloaded the series from). yt-dlp names each file by its title, so the list is the id each
// file was fetched from — exact where the names are not: the channel re-uploaded a few aliyot under a title that
// differs by a comma, and the Adas page links only one of the two.
const YT_FILENAME_CHARS = { ':': '：', '/': '⧸', '\\': '⧹', '?': '？', '"': '＂', '*': '＊', '<': '＜', '>': '＞', '|': '｜' };   // yt-dlp's full-width stand-ins
export function titleAsFileName(title) { return String(title).replace(/[:/\\?"*<>|]/g, (c) => YT_FILENAME_CHARS[c]).replace(/\s+/g, ' ').trim(); }
export function readVideoLists(from) {
  const index = new Map();   // the title as a file name → [{ id, title, list }]
  (function walkTxt(dir) {
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const p = join(dir, name);
      let st; try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) { walkTxt(p); continue; }
      if (!/\.txt$/i.test(name) || st.size > 4 * 1024 * 1024) continue;
      for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
        const m = /^(.+?)\s+-\s+https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})\s*$/.exec(line.trim());
        if (!m) continue;
        const k = titleAsFileName(m[1]);
        const hits = index.get(k) || [];
        if (!hits.some((h) => h.id === m[2])) index.set(k, hits.concat({ id: m[2], title: m[1].trim(), list: relative(from, p) }));
      }
    }
  })(from);
  return index;
}
// what the path says about the file: id (from "[id]" in the name, a yt-dlp sidecar, or the dump's video list), and
// (from the file name first, then its folders) parasha, year, aliyah, chazak
export function describeFile(file, videos, lists = null) {
  const d = { id: null, idFrom: null, year: null, aliyah: null, chazak: false, unit: null, book: null, title: null };
  const stem = basename(file.name, extname(file.name));
  let m = /\[([\w-]{11})\]/.exec(stem);
  if (m) { d.id = m[1]; d.idFrom = 'file name'; }
  else if (/^[\w-]{11}$/.test(stem) && videos[stem]) { d.id = stem; d.idFrom = 'file name'; }
  const side = sidecarOf(file);
  if (side) { if (!d.id) { d.id = side.info.id; d.idFrom = 'sidecar'; } d.title = side.info.title || null; d.sidecar = side.path; }
  const listed = lists && lists.get(titleAsFileName(stem));
  if (!d.id && listed) {
    const onList = listed.filter((h) => videos[h.id]);
    const pick = listed.length === 1 ? listed[0] : onList.length === 1 ? onList[0] : null;   // two uploads of one title: the one the Adas page links
    if (pick) { d.id = pick.id; d.idFrom = listed.length === 1 ? 'video list' : `video list; ${listed.length} uploads share this title, this one is on the Adas page`; d.title = d.title || pick.title; }
    else d.listIds = listed.map((h) => h.id);
  }
  const segments = [stem, ...file.rel.split(/[\\/]/).slice(0, -1).reverse()];
  for (const seg of segments) {
    const bits = parseBits(seg);
    if (d.year === null && bits.year) d.year = bits.year;
    if (d.aliyah === null && bits.aliyah) d.aliyah = bits.aliyah;
    if (bits.chazak) d.chazak = true;
    if (!d.unit && bits.nameText) {
      const u = matchName(bits.nameText);
      if (u && u.kind !== 'book') d.unit = u;
      else if (u && u.kind === 'book' && !d.book) d.book = u.book;
    }
  }
  if (d.title) { const tb = parseBits(d.title); if (tb.year) d.year = tb.year; if (tb.aliyah) d.aliyah = tb.aliyah; if (tb.chazak) d.chazak = true; const u = matchName(tb.nameText); if (u && u.kind !== 'book') d.unit = u; }
  return d;
}
function rowKey(parshaUnitName, year, aliyah, chazak) { return `${parshaUnitName}|${year ?? '-'}|${aliyah}|${chazak ? 'chazak' : ''}`; }
function matchFiles(files, videos, lists = null) {
  const keyIndex = new Map();
  for (const [id, r] of Object.entries(videos)) { const k = rowKey(r.parsha, r.year, r.aliyah, r.variant === 'chazak'); keyIndex.set(k, (keyIndex.get(k) || []).concat(id)); }
  const matched = new Map();   // id → [files]
  const unmatched = [];
  for (const f of files) {
    const d = describeFile(f, videos, lists);
    let id = null, how = null, why = null;
    if (d.id) { if (videos[d.id]) { id = d.id; how = `id (${d.idFrom})`; } else why = `id ${d.id} is not on the Adas listing`; }
    else if (d.listIds) why = `the video list gives ${d.listIds.length} ids for this title (${d.listIds.join(', ')}) and ${d.listIds.filter((x) => videos[x]).length ? 'more than one is' : 'none is'} on the Adas listing`;
    if (!id && !why) {
      if (!d.unit) why = 'no parasha name found in the file or folder names';
      else if (d.aliyah === null) why = 'no aliyah number (or Maftir) found';
      else {
        const name = unitName(d.unit);
        const tries = [rowKey(name, d.year, d.aliyah, d.chazak)];
        if (d.year !== null) tries.push(rowKey(name, null, d.aliyah, d.chazak));   // Ha'azinu: one set for every year
        // a title that says "with Chazak" where the listing has no separate Chazak video (Vayechi's year 3 aliyah 7), or the reverse
        tries.push(rowKey(name, d.year, d.aliyah, !d.chazak));
        if (d.year !== null) tries.push(rowKey(name, null, d.aliyah, !d.chazak));
        if (d.year === null && d.aliyah !== 'M') why = `no year found (${name} aliyah ${d.aliyah})`;
        for (const t of tries) { const ids = keyIndex.get(t); if (ids && ids.length === 1) { id = ids[0]; how = 'names'; why = null; break; } if (ids && ids.length > 1) why = `several videos fit (${ids.join(', ')})`; }
        if (!id && !why) why = `no video for ${name} Y${d.year ?? '-'} A${d.aliyah}${d.chazak ? ' chazak' : ''} on the listing`;
      }
    }
    if (id) matched.set(id, (matched.get(id) || []).concat({ ...f, how, desc: d }));
    else unmatched.push({ ...f, why, desc: d });
  }
  return { matched, unmatched };
}
function inventoryReport(videos, matched, unmatched, files, from) {
  const ids = sortedIds(videos);
  const perUnit = new Map();
  for (const id of ids) {
    const r = videos[id];
    const k = r.parsha;
    if (!perUnit.has(k)) perUnit.set(k, { book: unitBook(rowUnit(r) || { kind: 'parasha', n: 1 }), rows: 0, have: 0, missing: [], skip: 0 });
    const u = perUnit.get(k);
    const extra = r.variant === 'chazak' || r.aliyah === 'M';
    u.rows++;
    if (extra) u.skip++;
    if (matched.has(id)) u.have++; else if (!extra) u.missing.push(`Y${r.year ?? '-'}A${r.aliyah}`);
  }
  const dups = [...matched.entries()].filter(([, fs]) => fs.length > 1);
  console.log(`inventory: ${files.length} audio files under ${from}; ${matched.size} videos matched (${[...matched.values()].reduce((s, v) => s + v.length, 0)} files), ${unmatched.length} files unmatched, ${dups.length} videos with more than one file`);
  const hows = new Map();
  for (const fs of matched.values()) for (const f of fs) { const h = f.how.includes(';') ? f.how.slice(0, f.how.indexOf(';')) + ')' : f.how; hows.set(h, (hows.get(h) || 0) + 1); }
  console.log(`  matched by: ${[...hows.entries()].map(([h, n]) => `${h} ${n}`).join(', ')}`);
  for (const book of BOOKS) {
    const units = [...perUnit.entries()].filter(([, u]) => u.book === book);
    if (!units.length) continue;
    console.log(`  ${book}:`);
    for (const [name, u] of units) {
      const need = u.rows - u.skip;
      const state = !u.have ? 'no files' : u.missing.length ? `missing ${u.missing.join(' ')}` : 'complete';
      console.log(`    ${name.padEnd(22)} ${String(u.have).padStart(3)}/${String(need).padStart(3)} aliyah videos${u.skip ? ` (+${u.skip} maftir/Chazak, optional)` : ''}  ${state}`);
    }
  }
  if (dups.length) console.log(`  more than one file for a video (the first is used; check they are the same recording):\n` + dups.map(([id, fs]) => `    ${id}: ${fs.map((f) => f.rel).join(' | ')}`).join('\n'));
  if (unmatched.length) {
    console.log(`  unmatched files (${unmatched.length}; first 60):`);
    for (const f of unmatched.slice(0, 60)) console.log(`    ${f.rel} — ${f.why}`);
  }
  const notStaged = ids.filter((id) => !matched.has(id) && videos[id].aliyah !== 'M' && !videos[id].variant);
  console.log(`  aliyah videos with no file in the dump: ${notStaged.length} of ${ids.filter((id) => videos[id].aliyah !== 'M' && !videos[id].variant).length}`);
  mkdirSync(BULK_DIR, { recursive: true });
  writeFileSync(INVENTORY_PATH, JSON.stringify({ from, at: new Date().toISOString(), files: files.length, matched: Object.fromEntries([...matched.entries()].map(([id, fs]) => [id, fs.map((f) => ({ rel: f.rel, how: f.how, size: f.size }))])), unmatched: unmatched.map((f) => ({ rel: f.rel, why: f.why })), notStaged }, null, 1) + '\n');
  console.log(`  wrote ${INVENTORY_PATH}`);
}
async function cmdInventory(apply) {
  const from = flags.from ? String(flags.from) : null;
  if (!from || !existsSync(from)) fail('--from <dir> (the folder the files were dumped into) is required', 2);
  const videos = await loadVideos();
  if (!Object.keys(videos).length) fail('the whitelist is empty — run adas --accept first', 2);
  const files = walk(from);
  const lists = readVideoLists(from);
  if (lists.size) console.log(`inventory: a video list under ${from} names ${lists.size} titles (${[...new Set([...lists.values()].flat().map((h) => h.list))].join(', ')})`);
  const { matched, unmatched } = matchFiles(files, videos, lists);
  inventoryReport(videos, matched, unmatched, files, from);
  if (!apply) { if (cmd === 'stage') console.log('\n(report only — add --apply to stage the matched files into the cache)'); return; }
  mkdirSync(CACHE, { recursive: true });
  let staged = 0, already = 0, warned = 0;
  const problems = [];
  for (const [id, fs] of matched) {
    const f = fs[0];
    const row = videos[id];
    const ext = extname(f.name).slice(1).toLowerCase();
    const dest = join(CACHE, `${id}.${ext}`);
    const have = sourceAudio(id, CACHE);
    if (have && !flags.redo) { already++; }
    else {
      if (have) { try { unlinkSync(have); } catch { /* fine */ } }
      try { if (flags.copy) copyFileSync(f.path, dest); else { try { linkSync(f.path, dest); } catch { copyFileSync(f.path, dest); } } }
      catch (e) { problems.push(`${id}: could not stage ${f.rel}: ${e.message}`); continue; }
      staged++;
    }
    const infoPath = join(CACHE, `${id}.info.json`);
    if (!existsSync(infoPath) || flags.redo) {
      if (f.desc.sidecar) copyFileSync(f.desc.sidecar, infoPath);
      else {
        let probe = null; try { probe = r2(ffprobeDuration(dest)); } catch (e) { problems.push(`${id}: ffprobe failed on ${f.rel}: ${e.message}`); continue; }
        if (typeof row.duration === 'number' && Math.abs(probe - row.duration) > 2) { warned++; console.log(`  ⚠ ${id} ${row.parsha} Y${row.year ?? '-'} A${row.aliyah}: ${f.rel} is ${probe} s but the video is ${row.duration} s — wrong file? (split will refuse it)`); }
        const info = { id, title: row.title || f.desc.title || basename(f.name, extname(f.name)), duration: typeof row.duration === 'number' ? row.duration : probe, upload_date: row.upload_date || '',
          channel: 'Tricks of the Trope: Total Torah', uploader: 'Tricks of the Trope: Total Torah', webpage_url: `https://www.youtube.com/watch?v=${id}`, _synthesized: true, _from: f.rel, _probe: probe, _staged: today() };
        writeFileSync(infoPath, JSON.stringify(info, null, 1) + '\n');
      }
    }
  }
  console.log(`\nstage: ${staged} files staged into ${CACHE} (${already} were already there${warned ? `, ${warned} with a duration that differs from the video's` : ''})`);
  if (problems.length) console.log(`problems:\n` + problems.map((p) => `  ${p}`).join('\n'));
  console.log(`next: node scripts/build-totaltorah-bulk.mjs run --book Genesis   (or --parsha Bereshit, or --limit 3 to try a few)`);
}

/* ================================================================== run ================================================================== */
function readStatus() { try { return JSON.parse(readFileSync(STATUS_PATH, 'utf8')); } catch { return {}; } }
// every ledger in the bulk folder, the main one first and each named one over it (status, and a run's "already done" check)
function readAllStatus() {
  const all = {};
  if (!existsSync(BULK_DIR)) return all;
  for (const f of ['status.json', ...readdirSync(BULK_DIR).filter((x) => /^status-[\w-]+\.json$/.test(x)).sort()]) {
    const p = join(BULK_DIR, f);
    if (p === STATUS_PATH || !existsSync(p)) continue;
    try { Object.assign(all, JSON.parse(readFileSync(p, 'utf8'))); } catch { /* a half-written ledger: skipped */ }
  }
  return Object.assign(all, readStatus());   // this run's own ledger last
}
function writeStatus(s) { mkdirSync(BULK_DIR, { recursive: true }); writeFileSync(STATUS_PATH, JSON.stringify(s, null, 1) + '\n'); }
function readManifest() { try { return JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { return null; } }
function selectRows(videos) {
  const only = flags.only ? new Set(String(flags.only).split(',').map((s) => s.trim())) : null;
  const ids = sortedIds(videos).filter((id) => {
    const r = videos[id];
    if (only) return only.has(id);
    if (r.aliyah === 'M' && !flags.maftir) return false;
    if (r.variant === 'chazak' && !flags.chazak) return false;
    if (flags.book) { const u = rowUnit(r); if (!u || unitBook(u) !== flags.book) return false; }
    if (flags.parsha) { const u = rowUnit(r); const names = u ? (u.kind === 'pair' ? u.ns.map((n) => byN.get(n).en) : [byN.get(u.n).en]) : []; if (!names.includes(String(flags.parsha)) && r.parsha !== flags.parsha) return false; }
    return true;
  });
  return ids;
}
async function cmdRun() {
  const videos = await loadVideos();
  const status = readStatus();          // this run's ledger: what it writes
  const known = readAllStatus();        // every ledger: what is already done or has a boundaries file to reuse
  const pad = flags.pad !== undefined ? parseFloat(flags.pad) : DEFAULT_PAD;
  const timingsMode = flags.timings ? String(flags.timings) : 'derive';
  if (!['derive', 'realign', 'none'].includes(timingsMode)) fail('--timings takes derive, realign or none', 2);
  const limit = flags.limit ? +flags.limit : Infinity;
  const ids = selectRows(videos);
  const plan = [];
  let noRef = 0, notStaged = 0, doneBefore = 0;
  for (const id of ids) {
    const r = videos[id];
    const st = known[id] || {};
    if (!r.ref) { noRef++; continue; }
    const src = sourceAudio(id, CACHE);
    if (!src) { notStaged++; continue; }
    const finished = st.split && st.split.ok && (timingsMode === 'none' || (st.timings && st.timings.ok && st.timings.mode === timingsMode)) || st.duplicate || st.preexisting;
    if (finished && !flags.redo) { doneBefore++; continue; }
    plan.push({ id, r, src });
  }
  const todo = plan.slice(0, limit);
  // --intro <s> | silence: the announcement's end by hand (one video, with --only and --redo), for the few videos whose
  // announcement goes on into a spoken lesson the transcript walk cannot follow
  let introFlag = 'auto';
  if (flags.intro !== undefined) {
    if (todo.length !== 1) fail(`--intro is for one video at a time (use --only <id> --redo); ${todo.length} selected`, 2);
    introFlag = flags.intro === 'silence' ? 'silence' : parseFloat(String(flags.intro));
    if (typeof introFlag === 'number' && !isFinite(introFlag)) fail('--intro takes seconds, or "silence"', 2);
  }
  console.log(`run: ${ids.length} videos selected; ${noRef} without a ref, ${notStaged} not staged, ${doneBefore} already done → ${todo.length} to process${plan.length > todo.length ? ` (${plan.length - todo.length} more after --limit)` : ''}; timings: ${timingsMode}; pad ${pad} s${introFlag !== 'auto' ? `; intro ${introFlag}` : ''}`);
  if (!todo.length) { console.log('nothing to do'); return; }
  // the repo holds a mockup's worth of audio, never the corpus (≈ 735 MB for the whole Torah — Phase 2 hosts it on R2):
  // more than a parasha or so into data/totaltorah/ needs saying so
  if (OUT === REAL_OUT && !flags['into-repo']) {
    let n = 0;
    for (const p of todo) { try { n += refVerses(p.r.ref).length; } catch { n += 10; } }
    if (n > 400) fail(`this run would write about ${n} verse MP3s (~${Math.round(n * 0.13)} MB) into ${REAL_OUT}, inside the repo — the series does not belong in git. Use --out source-data/totaltorah-out (gitignored) for the full set, --parsha/--limit for a pilot, or --into-repo to confirm.`, 2);
  }
  if (flags['dry-run']) { for (const p of todo) console.log(`  would process ${p.id}  ${p.r.parsha} Y${p.r.year ?? '-'} A${p.r.aliyah}  ${p.r.ref}  (${basename(p.src)})`); return; }
  checkEnv();
  mkdirSync(LOG_DIR, { recursive: true });
  const client = new AlignerClient();
  let stop = false;
  process.on('SIGINT', () => { if (stop) process.exit(130); stop = true; console.log('\nstopping after this video (press again to abort)…'); });
  const t0 = Date.now();
  let okCount = 0, failCount = 0, dupCount = 0;
  try {
    for (let i = 0; i < todo.length && !stop; i++) {
      const { id, r, src } = todo[i];
      const label = `${id} ${r.parsha} Y${r.year ?? '-'} A${r.aliyah}${r.variant ? ' chazak' : ''}`;
      const logLines = [`# ${label} — ${r.ref} — ${new Date().toISOString()}`];
      const log = (s) => logLines.push(String(s));
      const st = status[id] = { ...(known[id] || {}), ref: r.ref, started: new Date().toISOString() };
      delete st.error;
      const tv = Date.now();
      try {
        // 1. verses already cut: by this video in an earlier session (/addTOTT, or a run whose ledger is gone — a re-cut
        //    file is unheard again, so it is never redone silently), or by another video (the series repeats readings)
        const verses = refVerses(r.ref);
        const manifest0 = readManifest() || {};
        const mine = verses.filter((v) => manifest0[v.key] && manifest0[v.key].video === id && manifest0[v.key].file === `${v.file}.mp3` && existsSync(join(AUDIO_DIR, `${v.file}.mp3`)));
        if (mine.length === verses.length && !flags.redo) {
          st.preexisting = true;
          console.log(`  = ${label}: all ${verses.length} verses already cut from this video in an earlier session — skipped (--redo recuts them, and they would need listening to again)`);
          writeStatus(status);
          continue;
        }
        delete st.preexisting;
        const others = verses.filter((v) => manifest0[v.key] && manifest0[v.key].video && manifest0[v.key].video !== id && manifest0[v.key].file === `${v.file}.mp3`);
        if (others.length === verses.length && !flags.redo) {
          st.duplicate = [...new Set(others.map((v) => manifest0[v.key].video))];
          dupCount++;
          console.log(`  = ${label}: every verse already cut from ${st.duplicate.join(', ')} — skipped`);
          writeStatus(status);
          continue;
        }
        delete st.duplicate;
        // 2. boundaries (skipped when a good one is on disk)
        const bp = join(CACHE, `${id}.boundaries.json`);
        let bj = null;
        if (st.boundaries && st.boundaries.ok && existsSync(bp) && !flags.redo) {
          bj = JSON.parse(readFileSync(bp, 'utf8'));
          if (bj.ref !== r.ref || !Array.isArray(bj.verses)) bj = null;
        }
        if (!bj) {
          bj = await computeBoundaries({ id, row: r, src, client, intro: introFlag, pad, keep16k: false, log, cacheDir: CACHE });
          st.boundaries = { ok: true, at: today(), introEnd: bj.introEnd, introBy: bj.introBy, legacyIntro: bj.legacyIntro, introUnconfirmed: !!bj.introUnconfirmed, introWarning: bj.introWarning || null, introTranscript: bj.introTranscript || null, minGap: bj.gaps.length ? Math.min(...bj.gaps) : null, wall: bj.wall, windows: bj.windows };
        }
        // 3. split (the audio script owns the manifest, the license and the triennial cross-check)
        if (!(st.split && st.split.ok) || flags.redo) {
          const args = [AUDIO_SCRIPT, 'split', '--video', id, '--boundaries', 'auto', '--pad', String(pad), '--keep-existing'];
          if (flags.cache) args.push('--cache', CACHE);
          if (flags.out) args.push('--out', OUT);
          const sp = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
          log(sp.stdout || ''); if (sp.stderr) log(sp.stderr);
          if (sp.status !== 0) throw new Error(`split exited ${sp.status}: ${(sp.stderr || sp.stdout || '').trim().split('\n').pop()}`);
          const kept = (sp.stdout.match(/ kept — already cut from /g) || []).length;
          const mismatch = /MISMATCH/.test(sp.stdout);
          st.split = { ok: true, at: today(), verses: verses.length, kept, triennial: mismatch ? 'MISMATCH' : /MATCH/.test(sp.stdout) ? 'match' : 'n/a' };
        }
        // 4. timings
        if (timingsMode !== 'none' && (!(st.timings && st.timings.ok && st.timings.mode === timingsMode) || flags.redo)) {
          const manifest = readManifest();
          if (!manifest) throw new Error('no manifest after split');
          let res;
          if (timingsMode === 'derive') res = deriveVideoTimings({ id, manifest, log, cacheDir: CACHE, timingsDir: TIMINGS_DIR });
          else {
            const keys = verses.map((v) => v.key).filter((k) => manifest[k] && manifest[k].video === id);
            res = await alignVerses({ keys, manifest, client, log, flacDir: FLAC_DIR, timingsDir: TIMINGS_DIR });
          }
          writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
          const low = res.results.reduce((s, x) => s + (x.low ? x.low.length : 0), 0);
          const words = res.results.reduce((s, x) => s + x.words.length, 0);
          st.timings = { ok: res.failures.length === 0, at: today(), mode: timingsMode, verses: res.results.length, words, low, failures: res.failures.map((f) => `${f.key}: ${f.error}`) };
          if (res.failures.length) log(`timings: ${res.failures.length} verse(s) not written: ${st.timings.failures.join('; ')}`);
        }
        st.wall = r2((Date.now() - tv) / 1000);
        okCount++;
        const b = st.boundaries || {};
        console.log(`  ✓ ${label}: ${verses.length} verses${st.split && st.split.kept ? ` (${st.split.kept} kept)` : ''}, intro ${b.introEnd} s (${b.introBy}${b.legacyIntro !== undefined && Math.abs(b.legacyIntro - b.introEnd) > 0.3 ? `, silence rule ${b.legacyIntro} s` : ''})${b.introUnconfirmed ? ' ⚠ intro unconfirmed' : ''}, min gap ${b.minGap} s${st.timings ? `, ${st.timings.low} low-score words of ${st.timings.words}` : ''}${st.split && st.split.triennial === 'MISMATCH' ? ', triennial MISMATCH' : ''}, ${st.wall} s`);
      } catch (e) {
        failCount++;
        st.error = e && e.message ? e.message : String(e);
        log(`ERROR: ${st.error}`);
        console.log(`  ✗ ${label}: ${st.error}`);
        if (/the aligner (exited|is not running)/.test(st.error)) { writeStatus(status); throw e; }
      } finally {
        writeFileSync(join(LOG_DIR, `${id}.log`), logLines.join('\n') + '\n');
        writeStatus(status);
      }
      const elapsed = (Date.now() - t0) / 1000, per = elapsed / (i + 1), left = (todo.length - i - 1) * per;
      if ((i + 1) % 5 === 0 || i === todo.length - 1) console.log(`  — ${i + 1}/${todo.length} in ${fmtS(elapsed)} (${fmtS(per)}/video; about ${fmtS(left)} left)`);
    }
  } finally { await client.close(); }
  console.log(`\nrun: ${okCount} processed, ${dupCount} duplicates skipped, ${failCount} failed, in ${fmtS((Date.now() - t0) / 1000)}. Ledger: ${STATUS_PATH}; logs: ${LOG_DIR}/`);
  console.log(`next: node scripts/build-totaltorah-bulk.mjs status   — then listen, and flip what you accept with build-totaltorah-audio.mjs verify --video <id> (or --parsha <name>), and again with --timings`);
}

/* ================================================================== status ================================================================== */
async function cmdStatus() {
  const videos = await loadVideos();
  const status = readAllStatus();
  const manifest = readManifest() || {};
  const ids = sortedIds(videos);
  const byUnit = new Map();
  for (const id of ids) {
    const r = videos[id];
    if (!byUnit.has(r.parsha)) byUnit.set(r.parsha, { book: unitBook(rowUnit(r)), videos: 0, optional: 0, noRef: 0, staged: 0, done: 0, dup: 0, failed: 0, verses: 0, verified: 0, timed: 0, timingsVerified: 0, lowWords: 0, words: 0 });
    const u = byUnit.get(r.parsha);
    const optional = r.aliyah === 'M' || r.variant === 'chazak';
    u.videos++;
    if (optional) u.optional++;
    if (!r.ref) u.noRef++;
    if (sourceAudio(id, CACHE)) u.staged++;
    const st = status[id];
    if (st && st.duplicate) u.dup++;
    else if (st && st.split && st.split.ok) u.done++;
    if (st && st.error) u.failed++;
    if (st && st.timings) { u.lowWords += st.timings.low || 0; u.words += st.timings.words || 0; }
  }
  for (const [k, e] of Object.entries(manifest)) {
    if (k === 'credit') continue;
    const u = byUnit.get(e.parsha);
    if (!u) continue;
    u.verses++;
    if (e.verified) u.verified++;
    if (e.timings) u.timed++;
    if (e.timingsVerified) u.timingsVerified++;
  }
  let bytes = 0, files = 0;
  if (existsSync(AUDIO_DIR)) for (const f of readdirSync(AUDIO_DIR)) if (f.endsWith('.mp3')) { bytes += statSync(join(AUDIO_DIR, f)).size; files++; }
  console.log(`status: ${ids.length} videos on the whitelist; ${files} verse MP3s in ${AUDIO_DIR} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`  ${'parasha'.padEnd(22)} videos  staged  cut  dup  fail | verses verified  timed  t.verified  low/words`);
  for (const book of BOOKS) {
    const units = [...byUnit.entries()].filter(([, u]) => u.book === book);
    if (!units.length) continue;
    console.log(`  ${book}`);
    for (const [name, u] of units) console.log(`    ${name.padEnd(20)} ${String(u.videos).padStart(6)}${u.optional ? `(${u.optional})`.padEnd(4) : '    '}${String(u.staged).padStart(4)} ${String(u.done).padStart(4)} ${String(u.dup).padStart(4)} ${String(u.failed).padStart(5)} | ${String(u.verses).padStart(6)} ${String(u.verified).padStart(8)} ${String(u.timed).padStart(6)} ${String(u.timingsVerified).padStart(11)}  ${u.words ? `${u.lowWords}/${u.words}` : ''}`);
  }
  console.log('  (videos: total, with maftir/Chazak extras in parentheses — those are skipped by run unless asked for)');
  const failed = ids.filter((id) => status[id] && status[id].error);
  if (failed.length) console.log(`\nfailed videos (${failed.length}; re-run picks them up, --redo recomputes):\n` + failed.map((id) => `  ${id} ${videos[id].parsha} Y${videos[id].year ?? '-'} A${videos[id].aliyah}: ${status[id].error}`).join('\n'));
  const mismatch = ids.filter((id) => status[id] && status[id].split && status[id].split.triennial === 'MISMATCH');
  if (mismatch.length) console.log(`\ntriennial cross-check mismatches (reported, data left as is): ${mismatch.join(', ')}`);
  const unconfirmed = ids.filter((id) => status[id] && status[id].boundaries && status[id].boundaries.introUnconfirmed);
  if (unconfirmed.length) console.log(`\nintro end not confirmed by the English transcript (${unconfirmed.length}; the first-silence rule decided — listen to the first verse before verifying):\n` + unconfirmed.map((id) => `  ${id} ${videos[id].parsha} Y${videos[id].year ?? '-'} A${videos[id].aliyah}: cut at ${status[id].boundaries.introEnd} s — ${status[id].boundaries.introWarning || ''}`).join('\n'));
  const noRef = ids.filter((id) => !videos[id].ref);
  if (noRef.length) console.log(`\nvideos without a ref (set it by hand in the whitelist): ${noRef.map((id) => `${id} (${videos[id].parsha} Y${videos[id].year ?? '-'} A${videos[id].aliyah})`).join(', ')}`);
  const toHear = [...byUnit.entries()].filter(([, u]) => u.verses && u.verified < u.verses).map(([name]) => name);
  if (toHear.length) {
    console.log(`\nlistening pass — parshiyot with cut, unheard verses (flip what you accept):`);
    for (const name of toHear) console.log(`  node scripts/build-totaltorah-audio.mjs verify --parsha "${name}"            # then, after the karaoke check:\n  node scripts/build-totaltorah-audio.mjs verify --timings --parsha "${name}"`);
  }
}

/* ---------- main ---------- */
try {
  if (cmd === 'adas') await cmdAdas();
  else if (cmd === 'meta') await cmdMeta();
  else if (cmd === 'inventory') await cmdInventory(false);
  else if (cmd === 'stage') await cmdInventory(!!flags.apply);
  else if (cmd === 'run') await cmdRun();
  else if (cmd === 'status') await cmdStatus();
  else { console.log('usage: build-totaltorah-bulk.mjs (adas|meta|inventory|stage|run|status) … (see the header comment)'); process.exit(2); }
} catch (e) {
  fail(e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n') : String(e));
}
