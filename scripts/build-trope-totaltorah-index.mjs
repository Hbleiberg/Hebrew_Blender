#!/usr/bin/env node
/**
 * build-trope-totaltorah-index.mjs — build data/trope/trope_index_totaltorah.json for trope_tutor.html.
 *
 * The Trope Tutor's "Year Round [Conservative]" melody plays its example clips (the Learn cards and the
 * Drill's Hear and Melody questions) from the Total Torah recordings — Cantor Arianne Brown's
 * "Tricks of the Trope – Total Torah" (Adas Israel Congregation), the per-verse MP3s the Torah Trainer
 * streams from TT_AUDIO_BASE (https://audio.ivritsuite.com/audio/<file>), used by written permission.
 * This script mines data/totaltorah/manifest.json + data/totaltorah/timings/ (one onset per word, index =
 * word index, one trailing end-of-last-word value) plus Sefaria's Hebrew-with-te'amim Torah text to write
 * a static index of real chanted example words for every cantillation mark:
 *   { v:1, system:"torah", clips:"totaltorah", built:"YYYY-MM-DD", license:"...", credit:{...},
 *     tropes: { "<tropeKey>": [ {p, ref, f, v, w, he, s, e}, ... ] } }
 * where p = the parasha's PocketTorah key (data/parshiyot.json `pocket` — the Learn cards' "See it in the
 * parsha" link and the drill's same-parasha preference read it), ref = "chapter:verse", f = the verse's
 * file name (gen-001-001.mp3), v = the source video's YouTube id (the permission's per-verse link),
 * w = the 0-based word index of the clip's first word (= timings index), he = the sung word (marks intact;
 * a maqaf compound joined), s/e = clip start/end seconds in the verse MP3 — e is null for the verse's last
 * word (the clip plays to the file's end, which the pipeline cut at the next pause).
 *
 * A verse is read into words exactly as the page reads it: js/trope-staff.js is loaded in a vm (the way
 * scripts/smoke-trope-staff.mjs loads it) and tropeUnitsOfVerse() splits the verse — piece i is the i-th
 * .tt-word the Trainer emits, which is also timings index i — so this script carries no copy of the TROPES
 * taxonomy. The text is the Sefaria export (Miqra according to the Masorah, the edition the timings were
 * aligned against), cached in the gitignored source-data/trope-cache/ by scripts/totaltorah-lib.mjs.
 *
 * Plain Node, zero dependencies. Run from anywhere:
 *   node scripts/build-trope-totaltorah-index.mjs            writes the index and docs/trope_totaltorah_index_report.md
 *   node scripts/build-trope-totaltorah-index.mjs --check    rebuilds in memory and exits non-zero if the committed
 *                                                            index differs (an idempotency proof; writes nothing)
 * `built` keeps its date while `tropes` is unchanged, so a re-run is byte-identical. The script exits non-zero
 * if any smoke test fails — never commit its output without a green run.
 *
 * Licensing: the recordings are © Cantor Arianne Brown / Adas Israel Congregation, all rights reserved, used by
 * permission — not a Creative Commons work (THIRD_PARTY_LICENSES.md). This file holds clip BOUNDS only, no
 * audio; the output's `license` says so, and every clip carries the id of its complete video.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import vm from 'node:vm';
import { loadBookText, cleanVerse, tokenizeWords, TEXT_CACHE_DIR, TIMINGS_DIR, MANIFEST as MANIFEST_PATH } from './totaltorah-lib.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(repoRoot, 'data', 'trope', 'trope_index_totaltorah.json');
const REPORT_PATH = join(repoRoot, 'docs', 'trope_totaltorah_index_report.md');
const PARSHIYOT_PATH = join(repoRoot, 'data', 'parshiyot.json');
const STAFF_PATH = join(repoRoot, 'js', 'trope-staff.js');

const CHECK = process.argv.includes('--check');
for (const a of process.argv.slice(2)) {
  if (a !== '--check') { console.error(`Unknown argument ${a} (use --check)`); process.exit(1); }
}

/* ── constants ─────────────────────────────────────────────────────────── */
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const TEXT_EDITION = 'Miqra according to the Masorah';   // the edition the timings were aligned against (scripts/align_totaltorah.py)
// The double-accented passages carry two cantillation systems at once (build-trope-phrases.mjs's table).
const DOUBLE_ACCENTED = [
  { book: 'Genesis', from: [35, 22], to: [35, 22] },
  { book: 'Exodus', from: [20, 2], to: [20, 14] },
  { book: 'Deuteronomy', from: [5, 6], to: [5, 18] },
];
// The Trainer's validators (torah_trainer.html, the manifest reader): nothing else reaches a URL or an href.
const FILE_RE = /^[a-z]{3}-\d{3}-\d{3}\.mp3$/;
const VIDEO_RE = /^[\w-]{11}$/;
const KEY_RE = /^([A-Z][a-z]+) (\d+):(\d+)$/;
// Clip-length bounds (s). Cantor Brown chants more slowly than PocketTorah's reader, so the PocketTorah index
// builder's 4 s / 8 s ceilings would starve pazer (median cell 4.9 s), telisha gedola (4.5 s) and every
// shalshelet (10–14 s: the ornament is the lesson). Measured on the whole corpus; the report prints the medians.
const CLIP_MIN = 0.35, CLIP_MAX = 6.0, CLIP_MAX_RARE = 8.0;
const CLIP_MAX_BY_KEY = { shalshelet: 15.0 };
const SWEET_MIN = 0.6, SWEET_MAX = 3.0;          // preferred clip-length band (s): ranked first within a parasha
const CAP_PER_TROPE = 40;
const SIZE_BUDGET = 160 * 1024;                   // bytes, output JSON (≈ 99 KB measured)
const LICENSE = '© Cantor Arianne Brown / Adas Israel Congregation. All rights reserved. Clip bounds into the "Tricks of the Trope – Total Torah" verse recordings (https://www.adasisrael.org/trope), used in IvritSuite by written permission (October 2026); not CC-licensed — no audio is redistributed and every clip links to its complete video on YouTube. Hebrew text: Sefaria, Miqra according to the Masorah.';

/* ── small utils ───────────────────────────────────────────────────────── */
const round2 = (x) => Math.round(x * 100) / 100;
const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const fmt = (n) => n.toLocaleString('en-US');
function readJSON(path) {
  let txt = readFileSync(path, 'utf8');
  if (txt.charCodeAt(0) === 0xfeff) txt = txt.slice(1);
  return JSON.parse(txt);
}
function die(msg) { console.error(msg); process.exit(1); }

/* ── the page's own reading of a verse: js/trope-staff.js in a vm ──────── */
const stubEl = () => ({ setAttribute() {}, appendChild() {}, style: {}, textContent: '' });
const staff = vm.runInNewContext(readFileSync(STAFF_PATH, 'utf8') + '\n;({ TROPES, tropeUnitsOfVerse })',
  { document: { createElementNS: stubEl }, console });
const TROPES = JSON.parse(JSON.stringify(staff.TROPES));   // this realm's arrays
const TROPE_BY_KEY = Object.fromEntries(TROPES.map((t) => [t.key, t]));
const RARE_KEYS = new Set(TROPES.filter((t) => t.rare).map((t) => t.key));
const maxDurOf = (key) => CLIP_MAX_BY_KEY[key] ?? (RARE_KEYS.has(key) ? CLIP_MAX_RARE : CLIP_MAX);

/* ── the parashot: verse → parasha by data/parshiyot.json's ref ranges ──── */
const parshiyot = readJSON(PARSHIYOT_PATH).map((p, pi) => {
  const m = /^([A-Z][a-z]+) (\d+):(\d+)-(\d+):(\d+)$/.exec(p.ref || '');
  if (!m || !p.pocket) die(`parshiyot.json entry ${pi} has no parsable ref/pocket: ${JSON.stringify(p)}`);
  return { pi, pocket: p.pocket, book: m[1], from: +m[2] * 1000 + +m[3], to: +m[4] * 1000 + +m[5] };
});
function parashaOf(book, c, v) {
  const n = c * 1000 + v;
  return parshiyot.find((p) => p.book === book && n >= p.from && n <= p.to) || null;
}
const isDoubleAccented = (book, c, v) => DOUBLE_ACCENTED.some((d) => d.book === book
  && c * 1000 + v >= d.from[0] * 1000 + d.from[1] && c * 1000 + v <= d.to[0] * 1000 + d.to[1]);

/* ── the text (Sefaria export, MAM) ────────────────────────────────────── */
const texts = {};
for (const b of BOOKS) {
  texts[b] = loadBookText(b);                      // chapters[c-1][v-1]; fetches into source-data/trope-cache/ once
  const file = readJSON(join(TEXT_CACHE_DIR, `merged-${b}.json`));
  const eds = (file.versions || []).map((x) => x[0]);
  if (eds.length !== 1 || eds[0] !== TEXT_EDITION) die(`merged-${b}.json merges ${JSON.stringify(eds)}, not only "${TEXT_EDITION}": the timings were aligned against MAM's word split`);
}

/* ── the manifest and the timings ──────────────────────────────────────── */
const manifest = readJSON(MANIFEST_PATH);
const credit = manifest.credit && typeof manifest.credit === 'object' ? manifest.credit : {};
for (const k of ['reader', 'congregation', 'series', 'url']) if (typeof credit[k] !== 'string' || !credit[k]) die(`manifest credit lacks ${k}`);
const creditOut = { reader: credit.reader, congregation: credit.congregation, series: credit.series, url: credit.url };

const census = { versesInText: 0, unrecorded: [], doubleAccented: 0, excluded: [], aligned: 0, cells: 0, pieces: 0 };
const skipped = { twoMark: 0, legarmeh: 0, separator: 0, tooShort: 0, tooLong: 0 };
const durations = Object.fromEntries(TROPES.map((t) => [t.key, []]));   // every one-key cell's duration, before the bounds
const candidates = Object.fromEntries(TROPES.map((t) => [t.key, []]));
let gen11 = null;   // the Genesis 1:1 candidates, for the smoke test and the report

for (const book of BOOKS) {
  const chapters = texts[book];
  for (let c = 1; c <= chapters.length; c++) {
    const verses = chapters[c - 1] || [];
    for (let v = 1; v <= verses.length; v++) {
      const raw = cleanVerse(verses[v - 1]);
      if (!raw) continue;
      census.versesInText++;
      const key = `${book} ${c}:${v}`;
      const entry = manifest[key];
      if (!entry || typeof entry !== 'object') { census.unrecorded.push(key); continue; }
      if (isDoubleAccented(book, c, v)) { census.doubleAccented++; continue; }
      if (entry.verified !== true || entry.timingsVerified !== true || typeof entry.timings !== 'string') { census.excluded.push({ key, why: 'not verified (audio or timings)' }); continue; }
      if (!FILE_RE.test(entry.file || '')) { census.excluded.push({ key, why: `file "${entry.file}" fails the Trainer's pattern` }); continue; }
      if (!VIDEO_RE.test(entry.video || '')) { census.excluded.push({ key, why: `video "${entry.video}" fails the Trainer's pattern` }); continue; }
      const timingsPath = join(TIMINGS_DIR, entry.timings);
      if (!/^[a-z]{3}-\d{3}-\d{3}\.txt$/.test(entry.timings) || !existsSync(timingsPath)) { census.excluded.push({ key, why: `timings file ${entry.timings} missing` }); continue; }
      const t = readFileSync(timingsPath, 'utf8').trim().split(',').map(parseFloat).filter((x) => !isNaN(x));
      const u = staff.tropeUnitsOfVerse(raw);
      const pieces = JSON.parse(JSON.stringify(u.pieces)), cells = JSON.parse(JSON.stringify(u.cells));
      if (pieces.length !== tokenizeWords(raw).length) { census.excluded.push({ key, why: `the engine's split (${pieces.length} pieces) differs from the Trainer's tokenization (${tokenizeWords(raw).length} words)` }); continue; }
      if (t.length !== pieces.length + 1) { census.excluded.push({ key, why: `${pieces.length} words vs ${t.length} timings (expected ${pieces.length + 1})` }); continue; }
      if (t.some((x, i) => i && x < t[i - 1]) || t[0] < 0) { census.excluded.push({ key, why: 'onsets step backwards' }); continue; }
      const parasha = parashaOf(book, c, v);
      if (!parasha) { census.excluded.push({ key, why: 'outside every parasha range' }); continue; }
      census.aligned++;
      census.pieces += pieces.length;
      census.cells += cells.length;
      const toks = raw.split(/(\s+|־)/);   // tropeUnitsOfVerse's own split: pieces[].ti indexes it
      const verseCands = [];
      cells.forEach((cell, ci) => {
        const keys = cell.keys.map((x) => x.k);
        if (keys.length !== 1) { skipped.twoMark++; return; }
        const k = keys[0];
        if (!TROPE_BY_KEY[k]) { skipped.legarmeh++; return; }   // munach_legarmeh: the Phrases tab's mark, no Learn card
        // the sung word as printed: the pieces with whatever stands between them (a maqaf, or the space before a
        // word that joined its marked neighbour); anything else between (a paseq) makes it no example
        let he = '', ok = true;
        cell.pieces.forEach((pi, j) => {
          if (j) {
            const between = toks.slice(pieces[cell.pieces[j - 1]].ti + 1, pieces[pi].ti).join('');
            if (!/^(\s+|־)$/.test(between)) ok = false;
            he += between === '־' ? '־' : ' ';
          }
          he += pieces[pi].tok;
        });
        if (!ok) { skipped.separator++; return; }
        const w = cell.pieces[0];
        const last = ci === cells.length - 1;
        const s = t[w], end = last ? t[t.length - 1] : t[cells[ci + 1].pieces[0]];
        const dur = end - s;
        durations[k].push(dur);
        if (dur < CLIP_MIN) { skipped.tooShort++; return; }
        if (dur > maxDurOf(k)) { skipped.tooLong++; return; }
        const cand = { key: k, p: parasha.pocket, pi: parasha.pi, c, v, ref: `${c}:${v}`, f: entry.file, vid: entry.video, w, he,
          s: round2(s), e: last ? null : round2(end), dur, sweet: dur >= SWEET_MIN && dur <= SWEET_MAX };
        candidates[k].push(cand);
        verseCands.push(cand);
      });
      if (book === 'Genesis' && c === 1 && v === 1) gen11 = { pieces: pieces.map((x) => x.tok), t, cands: verseCands };
    }
  }
}

/* ── deterministic selection: spread across the parashot, cap per trope ── */
const tropes = {};
const selStats = [];
for (const tr of TROPES) {
  const pool = candidates[tr.key];
  const byParsha = new Map();
  for (const cnd of pool) { if (!byParsha.has(cnd.pi)) byParsha.set(cnd.pi, []); byParsha.get(cnd.pi).push(cnd); }
  // within a parasha: the sweet band first, then Torah order
  for (const list of byParsha.values()) list.sort((x, y) => ((x.sweet ? 0 : 1) - (y.sweet ? 0 : 1)) || (x.c - y.c) || (x.v - y.v) || (x.w - y.w));
  const order = [...byParsha.keys()].sort((a, b) => a - b);
  const picked = [];
  // One pick per parasha per pass; a pass that cannot take every parasha (the cap is below the 54) takes them
  // evenly spaced through the Torah, so Deuteronomy is heard as often as Genesis.
  for (let pass = 0; picked.length < CAP_PER_TROPE; pass++) {
    const avail = order.filter((pi) => pass < byParsha.get(pi).length);
    if (!avail.length) break;
    const need = CAP_PER_TROPE - picked.length;
    const take = avail.length <= need ? avail : Array.from({ length: need }, (_, i) => avail[Math.floor(i * avail.length / need)]);
    for (const pi of take) picked.push(byParsha.get(pi)[pass]);
  }
  picked.sort((x, y) => (x.pi - y.pi) || (x.c - y.c) || (x.v - y.v) || (x.w - y.w));   // Torah order: the page's spreadPick lands on four parts of it
  tropes[tr.key] = picked.map(({ p, ref, f, vid, w, he, s, e }) => ({ p, ref, f, v: vid, w, he, s, e }));
  const durs = durations[tr.key];
  selStats.push({ key: tr.key, family: tr.family, rare: tr.rare, cells: durs.length, median: median(durs), found: pool.length, selected: picked.length,
    parshiyot: new Set(picked.map((x) => x.p)).size, videos: new Set(picked.map((x) => x.vid)).size,
    maxDur: picked.length ? Math.max(...picked.map((x) => x.dur)) : 0, ceiling: maxDurOf(tr.key) });
}

/* ── emit (built keeps its date while the clips are unchanged) ─────────── */
let prev = null;
try { prev = existsSync(INDEX_PATH) ? readJSON(INDEX_PATH) : null; } catch { prev = null; }
const same = prev && prev.v === 1 && JSON.stringify(prev.tropes) === JSON.stringify(tropes) && JSON.stringify(prev.credit) === JSON.stringify(creditOut) && prev.license === LICENSE;
const built = same && typeof prev.built === 'string' ? prev.built : new Date().toISOString().slice(0, 10);
const index = { v: 1, system: 'torah', clips: 'totaltorah', built, license: LICENSE, credit: creditOut, tropes };
const serialized = JSON.stringify(index);
const bytes = Buffer.byteLength(serialized);

/* ── smoke tests — fail loudly, never ship a red build ─────────────────── */
const failures = [];
const G11 = [['tipcha', 0, 0.14, 2.26], ['munach', 1, 2.26, 3.72], ['etnachta', 2, 3.72, 5.47], ['mercha', 3, 5.47, 6.29], ['tipcha', 4, 6.29, 8.13], ['mercha', 5, 8.13, 9.17], ['sof_pasuk', 6, 9.17, null]];
if (!gen11) failures.push('Genesis 1:1 was not read (unrecorded or excluded)');
else {
  if (gen11.pieces.length !== 7) failures.push(`Genesis 1:1 splits into ${gen11.pieces.length} pieces, expected 7`);
  if (gen11.cands.length !== G11.length) failures.push(`Genesis 1:1 yields ${gen11.cands.length} candidates, expected ${G11.length}`);
  G11.forEach(([k, w, s, e], i) => {
    const cnd = gen11.cands[i];
    if (!cnd || cnd.key !== k || cnd.w !== w || cnd.s !== s || cnd.e !== e)
      failures.push(`Genesis 1:1 candidate ${i} should be ${k} w${w} ${s}–${e}, is ${cnd ? `${cnd.key} w${cnd.w} ${cnd.s}–${cnd.e}` : 'missing'}`);
  });
  for (const k of ['tipcha', 'sof_pasuk'])
    if (!tropes[k].some((x) => x.p === 'Bereshit' && x.ref === '1:1')) failures.push(`the selected ${k} clips should include Bereshit 1:1`);
}
if (census.excluded.some((x) => x.key.startsWith('Genesis 1:'))) failures.push('a verse of Genesis 1 was excluded — alignment regression');
const pocketSet = new Set(parshiyot.map((p) => p.pocket));
const EXPECT_COUNT = { shalshelet: 4, mercha_kefula: 5, karnei_parah: 1, yerach_ben_yomo: 1 };
for (const st of selStats) {
  if (!st.rare && st.key !== 'geresh_muqdam' && st.selected < 4) failures.push(`non-rare trope "${st.key}" has only ${st.selected} examples (< 4)`);
  if (EXPECT_COUNT[st.key] !== undefined && st.selected !== EXPECT_COUNT[st.key]) failures.push(`"${st.key}" has ${st.selected} examples, expected ${EXPECT_COUNT[st.key]} (the corpus's every occurrence that fits)`);
  if ((st.key === 'pazer' || st.key === 'telisha_gedola') && st.selected < 30) failures.push(`"${st.key}" has only ${st.selected} examples: the ${st.ceiling} s ceiling no longer fits the recordings`);
}
for (const k of ['karnei_parah', 'yerach_ben_yomo'])
  if (!tropes[k].every((x) => x.p === 'Masei' && x.ref === '35:5')) failures.push(`${k} should come from Numbers 35:5 (Masei) only, has ${JSON.stringify(tropes[k].map((x) => x.p + ' ' + x.ref))}`);
for (const [key, list] of Object.entries(tropes)) {
  const tr = TROPE_BY_KEY[key];
  if (!tr) { failures.push(`index key "${key}" not in TROPES`); continue; }
  for (const ex of list) {
    if (!FILE_RE.test(ex.f)) failures.push(`${key}: file "${ex.f}" fails the pattern`);
    if (!VIDEO_RE.test(ex.v)) failures.push(`${key}: video "${ex.v}" fails the pattern`);
    if (!pocketSet.has(ex.p)) failures.push(`${key}: "${ex.p}" is not a parshiyot.json pocket key`);
    if (!/^\d+:\d+$/.test(ex.ref)) failures.push(`${key}: ref "${ex.ref}"`);
    const pp = parshiyot.find((p) => p.pocket === ex.p), [c, v] = ex.ref.split(':').map(Number);
    if (pp && !(c * 1000 + v >= pp.from && c * 1000 + v <= pp.to && `${pp.book.slice(0, 3).toLowerCase()}` === ex.f.slice(0, 3))) failures.push(`${key}: ${ex.p} ${ex.ref} lies outside its parasha or names another book's file (${ex.f})`);
    if (!Number.isInteger(ex.w) || ex.w < 0) failures.push(`${key}: w ${ex.w}`);
    if (!(ex.s >= 0)) failures.push(`${key}: s ${ex.s}`);
    if ((ex.e === null) !== (key === 'sof_pasuk')) failures.push(`${key}: e ${ex.e} (only a sof pasuk clip plays to the file's end)`);
    if (ex.e !== null && !(ex.e > ex.s)) failures.push(`${key}: e ${ex.e} not after s ${ex.s}`);
    if (ex.e !== null && (ex.e - ex.s < CLIP_MIN - 0.011 || ex.e - ex.s > maxDurOf(key) + 0.011)) failures.push(`bad clip bounds for ${key}: ${JSON.stringify(ex)}`);
    if (key === 'sof_pasuk' ? !ex.he.endsWith('׃') : !tr.chars.some((ch) => ex.he.includes(ch))) failures.push(`${key}: "${ex.he}" does not carry the mark`);
    if (ex.he.includes('׀')) failures.push(`${key}: "${ex.he}" carries a paseq`);
  }
}
if (bytes > SIZE_BUDGET) failures.push(`index is ${bytes} bytes (> ${SIZE_BUDGET}); lower CAP_PER_TROPE`);
if (census.unrecorded.length !== 2 || census.unrecorded.join(',') !== 'Genesis 28:5,Genesis 28:6')
  failures.push(`unrecorded verses: ${census.unrecorded.length} (${census.unrecorded.slice(0, 5).join(', ')}) — the series skips only Genesis 28:5–6`);

/* ── report ─────────────────────────────────────────────────────────────── */
const skippedWhy = `two marks on one word ${fmt(skipped.twoMark)} (a kadma or munach with its zakef, a mercha with its tevir…), munach legarmeh ${fmt(skipped.legarmeh)} (no Learn card), a paseq inside the word ${fmt(skipped.separator)}, shorter than ${CLIP_MIN} s ${fmt(skipped.tooShort)}, longer than the mark's ceiling ${fmt(skipped.tooLong)}`;
const report = `# Total Torah clip index — build report

- **Built:** ${index.built}
- **Recordings:** ${credit.reader}, ${credit.congregation} — *${credit.series}* (${credit.url}), used by written
  permission; the per-verse MP3s the Torah Trainer streams (\`TT_AUDIO_BASE\`), never redistributed. This index holds
  clip bounds only.
- **Text:** Sefaria's public export (storage.googleapis.com/sefaria-export, Hebrew merged.json per Torah book, the
  *${TEXT_EDITION}* edition the timings were aligned against); each verse split by \`tropeUnitsOfVerse\`
  (\`js/trope-staff.js\`, loaded in a vm), so piece *i* is timings index *i*.
- **Output:** \`data/trope/trope_index_totaltorah.json\` — ${fmt(bytes)} bytes (budget ${fmt(SIZE_BUDGET)})
- **Verses:** ${fmt(census.versesInText)} in the text; ${census.unrecorded.length} without a recording (${census.unrecorded.join(', ') || 'none'});
  ${census.doubleAccented} double-cantillation verses left out (Genesis 35:22 and the two Decalogues); ${census.excluded.length} excluded
  (below); **${fmt(census.aligned)} aligned** (${fmt(census.pieces)} words, ${fmt(census.cells)} sung words).
- **Selection:** a sung word (a maqaf compound joined; an unmarked word with the marked neighbour it sings with) whose
  marks map to exactly one Learn-card key; the verse's last word is the \`sof_pasuk\` pool and plays to the file's end
  (\`e: null\`); clip ${CLIP_MIN}–${CLIP_MAX} s (${CLIP_MAX_RARE} s for rare-flagged marks, ${CLIP_MAX_BY_KEY.shalshelet} s for shalshelet — the
  cantor chants more slowly than PocketTorah's reader, and the long marks' length is the lesson), the
  ${SWEET_MIN}–${SWEET_MAX} s band first, one per parasha per pass spread through the Torah, cap ${CAP_PER_TROPE} per mark, in Torah order.
- **Sung words skipped:** ${skippedWhy}.

## Per-trope corpus counts

Median = the median length of every one-mark sung word carrying the mark, before the bounds (what the ceilings answer to).

| Trope | Family | Sung words | Median s | Candidates | Selected | Parashot | Videos | Longest s | Ceiling s | Rare |
|---|---|---|---|---|---|---|---|---|---|---|
${selStats.map((s) => `| ${s.key} | ${s.family} | ${fmt(s.cells)} | ${s.median.toFixed(2)} | ${fmt(s.found)} | ${s.selected} | ${s.parshiyot} | ${s.videos} | ${s.maxDur.toFixed(2)} | ${s.ceiling} | ${s.rare ? 'yes' : ''} |`).join('\n')}

## Excluded verses (${census.excluded.length})

${census.excluded.length === 0 ? '_None — every recorded verse outside the double-cantillation passages aligned._'
    : census.excluded.map((x) => `- ${x.key}: ${x.why}`).join('\n')}

## Genesis 1:1 smoke test

Words (timings indices 0–${gen11 ? gen11.pieces.length - 1 : '?'}): ${gen11 ? gen11.pieces.join(' · ') : 'UNAVAILABLE'}
Timings: ${gen11 ? gen11.t.join(', ') : 'UNAVAILABLE'}

${G11.map(([k, w, s, e], i) => { const c = gen11 && gen11.cands[i]; const ok = c && c.key === k && c.w === w && c.s === s && c.e === e; return `- ${k} w${w} ${s}–${e === null ? 'end' : e}: ${ok ? '✓' : '✗'}`; }).join('\n')}
- the selected tipcha and sof_pasuk clips include Bereshit 1:1: ${['tipcha', 'sof_pasuk'].every((k) => tropes[k].some((x) => x.p === 'Bereshit' && x.ref === '1:1')) ? '✓' : '✗'}

## Permission

${credit.permission || ''}
${credit.license || ''}

${failures.length === 0 ? '**All smoke tests passed.**' : '**SMOKE TEST FAILURES:**\n' + failures.map((f) => `- ${f}`).join('\n')}
`;

if (CHECK) {
  const committed = existsSync(INDEX_PATH) ? readFileSync(INDEX_PATH, 'utf8') : '';
  if (committed !== serialized) failures.push('the committed index differs from a fresh build (run the script and commit its output)');
} else {
  mkdirSync(dirname(INDEX_PATH), { recursive: true });
  writeFileSync(INDEX_PATH, serialized);
  writeFileSync(REPORT_PATH, report);
  console.log(`\nindex: ${INDEX_PATH} (${fmt(bytes)} bytes)`);
  console.log(`report: ${REPORT_PATH}`);
}
console.log(`aligned verses: ${fmt(census.aligned)}; unrecorded: ${census.unrecorded.length}; double-cantillation: ${census.doubleAccented}; excluded: ${census.excluded.length}`);
if (failures.length) {
  console.error('\nSMOKE TEST FAILURES:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(CHECK ? 'the committed index matches a fresh build; all smoke tests passed.' : 'all smoke tests passed.');
