#!/usr/bin/env node
/**
 * build-trope-phrases.mjs — build data/trope/trope_phrases.json from the printed cantillation chart.
 *
 * The source is docs/tropepatterns.md, sections B and C: every row of the book's *Torah
 * Cantillation* chart (41 rows, three sharps) and *High Holiday Torah Cantillation* chart (33 rows
 * + row 20's second setting, no key signature), transcribed note for note from clean scans into
 * fenced ```trope-torah / ```trope-hh blocks. Those blocks are the only hand-edited copy of the
 * notes: fix a note there and re-run this script — never edit the JSON. The block grammar is
 * documented in the doc's "How to read this file"; in short:
 *
 *   #<row>[b] [tag]… <Hebrew as printed>           tags: [aliyah-end] [unverified], lowercase, right
 *                                                  after the number (no bracket or Latin letter after)
 *   <tropeKey> <SYL>[-] <note>… <SYL>[-] <note>…   one line per mark, keys from TROPES + munach_legarmeh
 *   note  = [3{][~|~~|=|~=]PITCH(VALUE[,>][,-])[}]   PITCH as it sounds (C♯4, G♮4, B♭4)
 *   VALUE = 32 s ds e de q dq h dh | g (grace)       ~ slur from the previous note, ~~ dashed slur,
 *   rest(VALUE)                                      = tie from it, ~= both; 3{ … } a triplet
 *
 * Output (CC BY-SA 4.0, like the motif files):
 *   { v:1, built, license, source, tpq:48, values:{<code>:ticks},
 *     melodies: { torah:{key:"A", rows:[…]}, highholiday:{key:"C", rows:[…]} },
 *     figures:  { <melody>: { <tropeKey>: [ {refs:[[row, unitIdx]…], prev:[…], next:[…]} ] } } }
 * where each row is flat — { n, he, tags, notes:[{p, v, t, g?, r?, tie?, a?}], syl:[{t, hyphen,
 * unit, from, to}], units:[{k, from, to}], tup:[{from, to}], slur:[{from, to, dashed?}] } — p =
 * semitones from B4 (the motif files' scale), t = ticks at 48 per quarter (a triplet's notes carry
 * their real length), `tie` marks a note tied to the next, and syllables, units, triplets and
 * slurs are index spans into `notes`, so a triplet or slur may cross from one mark to the next.
 * `figures` lists each mark's distinct figures by reference (never copying notes), with the marks
 * before (`prev`, ^ = row start) and after (`next`, $ = row end) every place it is printed.
 * docs/trope_phrases_report.md shows the same catalog in the doc's notation, plus the check below.
 *
 * It also cross-checks the Trope Tutor: data/trope/trope_motifs.json and trope_motifs_hh.json must
 * carry exactly the Learn cards the doc's section A table names, each `verified`, sourced from the
 * row the table gives it, with whole-number pitches and d 1–4, and equal to that row reduced to the
 * staff's four values (a grace note becomes an eighth, tied notes merge, rests drop, anything shorter
 * than a quarter is d 1 and a longer note the nearest of d 2–4; see reduceUnit) — apart from the
 * documented departures (DEPARTURES), which are applied before the comparison while the print still
 * matches what they were decided for.
 *
 *   node scripts/build-trope-phrases.mjs              build, check, write the JSON + report
 *   node scripts/build-trope-phrases.mjs --census     also count every mark-before-mark context of
 *                                                     the Torah and the High Holiday readings against
 *                                                     the chart -> docs/trope_contexts_report.md
 *                                                     (the only networked path: Sefaria's text export,
 *                                                     cached in gitignored source-data/trope-cache/,
 *                                                     shared with build-trope-index.mjs)
 *   --doc=<path> --out=<dir> --lenient                parse another transcription (a second reading)
 *                                                     into <dir>; --lenient skips the Hebrew-marks,
 *                                                     row-count, tutor and smoke checks. --doc and
 *                                                     --lenient need an --out outside data/ and docs/.
 *
 * The TROPES taxonomy is read from both of its carriers (trope_tutor.html and
 * scripts/build-trope-index.mjs), which must be byte-identical; this script only reads it.
 * Zero dependencies. Outputs are written only when every check passes — with --census, the
 * census's too; the script exits non-zero otherwise — never commit its output without a green
 * run. `built` keeps its old date when nothing else in the JSON changed, so a re-run is
 * byte-identical. The contexts report names the sha1 of the JSON it was counted against, and a
 * plain run warns when that is not the JSON it just built (re-run with --census).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative, isAbsolute } from 'node:path';
import vm from 'node:vm';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name) => { const a = argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.slice(name.length + 3) : null; };
const LENIENT = flag('lenient');
const CENSUS = flag('census');
const DOC_PATH = opt('doc') ? resolve(opt('doc')) : join(repoRoot, 'docs', 'tropepatterns.md');
const OUT_DIR = opt('out') ? resolve(opt('out')) : null;
const JSON_PATH = OUT_DIR ? join(OUT_DIR, 'trope_phrases.json') : join(repoRoot, 'data', 'trope', 'trope_phrases.json');
const REPORT_PATH = OUT_DIR ? join(OUT_DIR, 'trope_phrases_report.md') : join(repoRoot, 'docs', 'trope_phrases_report.md');
const CENSUS_PATH = OUT_DIR ? join(OUT_DIR, 'trope_contexts_report.md') : join(repoRoot, 'docs', 'trope_contexts_report.md');
const CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');
const SIZE_BUDGET = 128 * 1024;
const LICENSE = 'Hand transcriptions of the traditional Ashkenazi Torah and High Holiday cantillation melodies from a printed chart (docs/tropepatterns.md, sections B and C). This file is CC BY-SA 4.0.';

const failures = [];
const fail = (msg) => failures.push(msg);
function die(msg) { console.error(`build-trope-phrases: ${msg}`); process.exit(1); }
// A second reading (--doc) or a lenient run skips checks, so it never writes over the committed files.
const outside = (dir) => { const r = relative(join(repoRoot, dir), OUT_DIR); return r.startsWith('..') || isAbsolute(r); };
if ((LENIENT || argv.some((a) => a === '--doc' || a.startsWith('--doc='))) && !(OUT_DIR && outside('data') && outside('docs')))
  die('--doc and --lenient build a second reading: give --out=<dir> outside the repo\'s data/ and docs/, so the committed JSON and reports stay as they are');

/* ---------- TROPES taxonomy: read (not carried) from both carriers, which must agree ---------- */
function tropesBlock(rel) {
  const s = readFileSync(join(repoRoot, rel), 'utf8');
  const a = s.indexOf('/* ═══ TROPES taxonomy'), b = s.indexOf('/* ═══ end TROPES taxonomy ═══ */');
  if (a < 0 || b < a) die(`no TROPES block in ${rel}`);
  return s.slice(a, b);
}
const TROPES_SRC = tropesBlock('trope_tutor.html');
if (TROPES_SRC !== tropesBlock('scripts/build-trope-index.mjs'))
  die('the TROPES block differs between trope_tutor.html and scripts/build-trope-index.mjs (it must be byte-identical)');
const TROPES = vm.runInNewContext(`${TROPES_SRC}\nTROPES;`);
const KEYS = [...TROPES.map((t) => t.key), 'munach_legarmeh'];
const KEY_SET = new Set(KEYS);
const CHAR_TO_KEY = {};
for (const t of TROPES) for (const ch of t.chars) CHAR_TO_KEY[ch] = t.key;
// Conjunctive ("servant") marks — the census pairs them with the mark they lead into.
const CONJUNCTIVE = new Set(['munach', 'mahpach', 'mercha', 'mercha_kefula', 'darga', 'kadma', 'telisha_ketana', 'yerach_ben_yomo']);

/* ---------- the notation ---------- */
const TPQ = 48;
const VALUES = { 32: 6, s: 12, ds: 18, e: 24, de: 36, q: 48, dq: 72, h: 96, dh: 144, g: 0 };
// A triplet is two or more sounding notes whose written values add up to three of one value, sung in the time of two.
const TRIPLET_TOTALS = new Set([3 * VALUES[32], 3 * VALUES.s, 3 * VALUES.e, 3 * VALUES.q]);
const MELODIES = {
  torah: { info: 'trope-torah', key: 'A', rows: 41, extra: [], motifs: 'data/trope/trope_motifs.json', label: 'Torah',
    // Every F, C and G is written with its ♯ or ♮ (the key signature makes a bare one ambiguous);
    // G♮ (the lowered seventh) is the chart's only chromatic note.
    spell: { F: ['♯'], C: ['♯'], G: ['♯', '♮'], A: [''], B: [''], D: [''], E: [''] } },
  highholiday: { info: 'trope-hh', key: 'C', rows: 33, extra: ['20b'], motifs: 'data/trope/trope_motifs_hh.json', label: 'High Holiday',
    // No signature: B♭ (the lowered seventh) and F♯ (telisha ketana's raised fourth) are its accidentals.
    spell: { A: [''], B: ['', '♭'], C: [''], D: [''], E: [''], F: ['', '♯'], G: [''] } },
};
const INFO_TO_MELODY = Object.fromEntries(Object.entries(MELODIES).map(([m, d]) => [d.info, m]));
const TAGS = new Set(['aliyah-end', 'unverified']);
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC = { '': 0, '♯': 1, '♭': -1, '♮': 0 };
const P_MIN = -16, P_MAX = 6;   // G3 … F5: the charts' whole range

const SYL_RE = /^([A-Z][A-Z']*)(-?)$/;
const NOTE_RE = /^(3\{)?(~~|~=|~|=)?([A-G])([♯♭♮]?)(\d)\(([^)]*)\)(\})?$/;
const REST_RE = /^(3\{)?rest\(([^)]*)\)(\})?$/;

function parseDoc(text, path) {
  const lines = text.split('\n');
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^```(trope-[a-z-]+)\s*$/);
    if (!m) continue;
    const melody = INFO_TO_MELODY[m[1]];
    if (!melody) { fail(`${path}:${i + 1}: unknown block type \`${m[1]}\``); continue; }
    const body = [];
    let j = i + 1;
    for (; j < lines.length && !/^```\s*$/.test(lines[j]); j++) body.push({ text: lines[j], line: j + 1 });
    if (j >= lines.length) { fail(`${path}:${i + 1}: block never closed`); break; }
    blocks.push({ melody, body, line: i + 1 });
    i = j;
  }
  return blocks;
}

function pitchOf(letter, acc, octave) { return (octave + 1) * 12 + LETTER_PC[letter] + ACC[acc] - 71; }

// One block -> one flat row. Errors are collected (with the doc line) rather than thrown.
function parseRow(block, path) {
  const where = (l) => `${path}:${l}`;
  const lines = block.body.filter((b) => b.text.trim() !== '');
  if (!lines.length) { fail(`${where(block.line)}: empty block`); return null; }
  const hm = lines[0].text.trim().match(/^#(\d+b?)((?:\s+\[[^\]]*\])*)\s*(.*)$/);
  if (!hm) { fail(`${where(lines[0].line)}: the first line must be "#<row> [tags] <Hebrew>"`); return null; }
  // Tags come right after the number and only as spelled in TAGS; anything bracketed or Latin after
  // them would otherwise be kept as Hebrew, and the row would silently lose its tag.
  const tags = [...hm[2].matchAll(/\[([^\]]*)\]/g)].map((x) => x[1]);
  for (const t of tags) if (!TAGS.has(t)) fail(`${where(lines[0].line)}: unknown tag [${t}] — the tags are ${[...TAGS].map((x) => `[${x}]`).join(' ')}, lowercase, right after #${hm[1]}`);
  const stray = hm[3].match(/[\[\]A-Za-z]/);
  if (stray) fail(`${where(lines[0].line)}: row #${hm[1]}'s Hebrew holds "${stray[0]}" — tags go right after #${hm[1]}, and the rest of the line is only the Hebrew as printed`);
  const row = { n: hm[1], he: hm[3].trim(), tags, notes: [], syl: [], units: [], tup: [], slur: [] };
  const spell = MELODIES[block.melody].spell;
  let tupOpen = -1, slurOpen = null;
  for (const ln of lines.slice(1)) {
    const um = ln.text.trim().match(/^([a-z_]+)\s+(.+)$/);
    if (!um) { fail(`${where(ln.line)}: expected "<tropeKey> <syllables and notes>"`); continue; }
    if (!KEY_SET.has(um[1])) { fail(`${where(ln.line)}: unknown trope key "${um[1]}"`); continue; }
    const unitIdx = row.units.length;
    const unit = { k: um[1], from: row.notes.length, to: -1 };
    let cur = null;   // the open syllable
    const closeSyl = () => {
      if (!cur) return;
      cur.to = row.notes.length - 1;
      if (cur.to < cur.from) fail(`${where(ln.line)}: syllable ${cur.t} has no notes`);
      else if (row.notes.slice(cur.from, cur.to + 1).every((n) => n.r)) fail(`${where(ln.line)}: syllable ${cur.t} is sung on nothing but rests`);
      row.syl.push(cur); cur = null;
    };
    for (const raw of um[2].trim().split(/\s+/)) {
      const tok = raw.replace(/’/g, "'");
      let m;
      if ((m = tok.match(SYL_RE))) {
        closeSyl();
        cur = { t: m[1], hyphen: m[2] === '-', unit: unitIdx, from: row.notes.length, to: -1 };
        continue;
      }
      const note = {};
      let open = false, close = false, link = '';
      if ((m = tok.match(NOTE_RE))) {
        const [, o, lk, letter, acc, oct, inner, c] = m;
        open = !!o; close = !!c; link = lk || '';
        const [val, ...flags] = inner.split(',');
        if (!Object.hasOwn(VALUES, val)) { fail(`${where(ln.line)}: unknown value "${val}" in ${tok}`); continue; }
        if (!spell[letter].includes(acc))
          fail(`${where(ln.line)}: ${letter}${acc || ''}${oct} — ${block.melody === 'torah'
            ? 'in the Torah chart write every F, C and G with its ♯ or ♮ (G♮ is the only natural); no other accidental is printed'
            : 'the High Holiday chart prints only B♭ and F♯'}`);
        note.p = pitchOf(letter, acc, +oct);
        if (note.p < P_MIN || note.p > P_MAX) fail(`${where(ln.line)}: ${tok} is outside G3–F5`);
        note.v = val;
        note.t = VALUES[val];
        if (val === 'g') note.g = 1;
        const accents = [];
        for (const f of flags) {
          if (f === '>' || f === '-') accents.push(f);
          else fail(`${where(ln.line)}: unknown mark "${f}" in ${tok} (use > or -)`);
        }
        if (accents.length) note.a = accents;
      } else if ((m = tok.match(REST_RE))) {
        const [, o, val, c] = m;
        open = !!o; close = !!c;
        if (!Object.hasOwn(VALUES, val) || val === 'g') { fail(`${where(ln.line)}: bad rest value in ${tok}`); continue; }
        note.r = 1; note.v = val; note.t = VALUES[val];
      } else {
        fail(`${where(ln.line)}: cannot read "${tok}"`);
        continue;
      }
      if (!cur && !note.r) fail(`${where(ln.line)}: ${tok} comes before the first syllable (only a rest may)`);
      const idx = row.notes.length;
      if (open) {
        if (tupOpen >= 0) fail(`${where(ln.line)}: a triplet opens inside another`);
        tupOpen = idx;
      }
      if (link === '=' || link === '~=') {
        // A tie holds one sound inside one mark's line: each staff merges its own tied notes, and a
        // grace note has no length to hold.
        const prev = row.notes[idx - 1];
        if (!prev) fail(`${where(ln.line)}: ${tok} ties from nothing (the row's first note)`);
        else if (idx === unit.from) fail(`${where(ln.line)}: ${tok} ties from the previous mark's line — a tie must stay inside one mark's line`);
        else if (prev.r || prev.p !== note.p) fail(`${where(ln.line)}: ${tok} ties from ${prev.r ? 'a rest' : 'a note of another pitch'}`);
        else if (note.g || prev.g) fail(`${where(ln.line)}: ${tok} — a grace note cannot be tied, to or from`);
        else prev.tie = 1;
      }
      if (link === '~' || link === '~~' || link === '~=') {
        const dashed = link === '~~';
        if (slurOpen && slurOpen.to === idx - 1 && !!slurOpen.dashed === dashed) slurOpen.to = idx;
        else {
          if (idx === 0) fail(`${where(ln.line)}: a slur arrives at the row's first note`);
          else if (row.notes[idx - 1].r) fail(`${where(ln.line)}: ${tok} — a slur cannot arrive from a rest`);
          slurOpen = { from: idx - 1, to: idx };
          if (dashed) slurOpen.dashed = 1;
          row.slur.push(slurOpen);
        }
      }
      row.notes.push(note);
      if (close) {
        if (tupOpen < 0) fail(`${where(ln.line)}: "}" closes no triplet`);
        else {
          const members = row.notes.slice(tupOpen, idx + 1);
          const written = members.reduce((a, n) => a + n.t, 0);
          const sounding = members.filter((n) => !n.r && !n.g).length;
          if (sounding < 2 || !TRIPLET_TOTALS.has(written))
            fail(`${where(ln.line)}: triplet of ${sounding} sounding note${sounding === 1 ? '' : 's'} written as ${written} ticks — a triplet is at least two sounding notes whose written values add up to three of one value (three 32nds, sixteenths, eighths or quarters: 18, 36, 72 or 144 ticks), sung in the time of two`);
          for (const n of members) n.t = n.t * 2 / 3;
          row.tup.push({ from: tupOpen, to: idx });
          tupOpen = -1;
        }
      }
    }
    closeSyl();
    unit.to = row.notes.length - 1;
    if (!row.syl.some((s) => s.unit === unitIdx)) fail(`${where(ln.line)}: ${unit.k} has no syllables`);
    // each mark's line is whole words, so its last syllable ends one
    else if (row.syl[row.syl.length - 1].hyphen) fail(`${where(ln.line)}: ${unit.k}'s last syllable ${row.syl[row.syl.length - 1].t}- runs on, but the next syllable is another mark's word`);
    row.units.push(unit);
  }
  if (tupOpen >= 0) fail(`${where(block.line)}: row #${row.n} ends inside a triplet`);
  for (const n of row.notes) if (!Number.isInteger(n.t)) fail(`${where(block.line)}: row #${row.n} has a duration that is not a whole tick`);
  row._src = lines;   // for the round trip; dropped before output
  return row;
}

/* ---------- serializer (the round trip, and the report's notation) ---------- */
// The only spellings each chart's rows may use (see MELODIES[…].spell), so a row writes back as it was read.
const SPELLING = {
  torah: { 1: 'C♯', 2: 'D', 4: 'E', 6: 'F♯', 7: 'G♮', 8: 'G♯', 9: 'A', 11: 'B' },
  highholiday: { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 6: 'F♯', 7: 'G', 9: 'A', 10: 'B♭', 11: 'B' },
};
function spellPitch(p, melody) {
  const midi = p + 71, pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
  return (SPELLING[melody][pc] || `?${pc}`) + oct;
}
function noteText(row, i, melody) {
  const n = row.notes[i];
  let s = '';
  if (row.tup.some((t) => t.from === i)) s += '3{';
  const inSlur = row.slur.find((sl) => sl.from < i && sl.to >= i);
  if (i > 0 && row.notes[i - 1].tie) s += inSlur ? '~=' : '=';
  else if (inSlur) s += inSlur.dashed ? '~~' : '~';
  if (n.r) s += `rest(${n.v})`;
  else s += `${spellPitch(n.p, melody)}(${[n.v, ...(n.a || [])].join(',')})`;
  if (row.tup.some((t) => t.to === i)) s += '}';
  return s;
}
function unitTokens(row, u, melody) {
  const unit = row.units[u], toks = [];
  for (let i = unit.from; i <= unit.to; i++) {
    const s = row.syl.find((x) => x.unit === u && x.from === i);
    if (s) toks.push(s.t + (s.hyphen ? '-' : ''));
    toks.push(noteText(row, i, melody));
  }
  return toks;
}
function headerTokens(row) { return [`#${row.n}`, ...row.tags.map((t) => `[${t}]`), ...(row.he ? row.he.split(/\s+/) : [])]; }

/* ---------- the Hebrew line: its printed marks must name the same marks as the lines below ---------- */
// Three mark names are two words, each printed with the mark (זָקֵ֕ף גָּד֕וֹל): such a pair is one mark.
// Every other repeat is a mark of its own, in the Hebrew and in the lines alike.
const TWO_WORD_NAMES = { zakef_gadol: 'זקף גדול', yerach_ben_yomo: 'ירח בן\u05BEיומו', karnei_parah: 'קרני פרה' };
const lettersOf = (w) => w.replace(/[^א-ת\u05BE]/g, '');   // consonants and maqaf only
function marksOfHebrew(he) {
  const keys = [];
  let prevWord = null, prevKs = [];
  for (const w of he.split(/\s+/).filter(Boolean)) {
    if (w === '׀') { if (keys.length && keys[keys.length - 1] === 'munach') keys[keys.length - 1] = 'munach_legarmeh'; prevWord = null; continue; }
    const ks = [];
    for (const ch of w) {
      const k = CHAR_TO_KEY[ch];
      if (k && !ks.includes(k)) ks.push(k);
    }
    if (w.includes('׃')) ks.push('sof_pasuk');
    if (w.includes('׀') && ks.length && ks[ks.length - 1] === 'munach') ks[ks.length - 1] = 'munach_legarmeh';
    const pair = prevWord && ks.length === 1 && prevKs.length === 1 && prevKs[0] === ks[0] && TWO_WORD_NAMES[ks[0]];
    if (!(pair && pair === `${lettersOf(prevWord)} ${lettersOf(w)}`)) keys.push(...ks);
    prevWord = w; prevKs = ks;
  }
  return keys;
}

/* ---------- build ---------- */
if (!existsSync(DOC_PATH)) die(`no transcription at ${DOC_PATH}`);
const docText = readFileSync(DOC_PATH, 'utf8');
const blocks = parseDoc(docText, DOC_PATH.replace(repoRoot + '/', ''));
const melodies = {};
for (const [m, d] of Object.entries(MELODIES)) melodies[m] = { key: d.key, rows: [] };
for (const b of blocks) {
  const row = parseRow(b, DOC_PATH.replace(repoRoot + '/', ''));
  if (!row) continue;
  const rows = melodies[b.melody].rows;
  if (rows.some((r) => r.n === row.n)) fail(`${MELODIES[b.melody].label} row #${row.n} appears twice`);
  rows.push(row);
  // round trip: the parsed row, written back, must read exactly as the block (spacing aside)
  const src = row._src.map((l) => l.text.trim().replace(/’/g, "'").split(/\s+/));
  const back = [headerTokens(row), ...row.units.map((u, i) => [u.k, ...unitTokens(row, i, b.melody)])];
  if (JSON.stringify(src) !== JSON.stringify(back))
    fail(`${MELODIES[b.melody].label} row #${row.n}: does not round-trip —\n    read:    ${src.map((l) => l.join(' ')).join(' / ')}\n    written: ${back.map((l) => l.join(' ')).join(' / ')}`);
  if (!LENIENT) {
    if (!row.he) fail(`${MELODIES[b.melody].label} row #${row.n}: no Hebrew line`);
    else {
      const printed = marksOfHebrew(row.he);
      const lines = row.units.map((u) => u.k);
      if (JSON.stringify(printed) !== JSON.stringify(lines))
        fail(`${MELODIES[b.melody].label} row #${row.n}: the Hebrew's marks (${printed.join(' ')}) are not the lines' marks (${lines.join(' ')})`);
    }
  }
}
const rowOrder = (a, b) => parseInt(a.n, 10) - parseInt(b.n, 10) || a.n.localeCompare(b.n);
for (const m of Object.values(melodies)) m.rows.sort(rowOrder);
if (!LENIENT) {
  for (const [m, d] of Object.entries(MELODIES)) {
    const want = [...Array.from({ length: d.rows }, (_, i) => String(i + 1)), ...d.extra].sort((a, b) => rowOrder({ n: a }, { n: b }));
    const have = melodies[m].rows.map((r) => r.n);
    if (JSON.stringify(want) !== JSON.stringify(have)) fail(`${d.label}: rows ${have.join(',') || '(none)'} — expected 1–${d.rows}${d.extra.length ? ' + ' + d.extra.join(', ') : ''}`);
  }
}

/* ---------- figures: each mark's distinct figures, by reference ---------- */
function unitSignature(row, u) {
  const unit = row.units[u];
  const notes = row.notes.slice(unit.from, unit.to + 1).map((n) => [n.p ?? null, n.v, n.t, n.g || 0, n.r || 0, n.tie || 0, (n.a || []).join('')]);
  const syl = row.syl.filter((s) => s.unit === u).map((s) => [s.t, s.hyphen ? 1 : 0, s.from - unit.from, s.to - unit.from]);
  const tup = row.tup.filter((t) => t.to >= unit.from && t.from <= unit.to).map((t) => [t.from - unit.from, t.to - unit.from]);
  const slur = row.slur.filter((t) => t.to >= unit.from && t.from <= unit.to).map((t) => [t.from - unit.from, t.to - unit.from, t.dashed ? 1 : 0]);
  return JSON.stringify({ notes, syl, tup, slur });
}
const figures = {};
for (const [m, mel] of Object.entries(melodies)) {
  const byKey = {};
  for (const row of mel.rows) {
    row.units.forEach((unit, u) => {
      const sig = unitSignature(row, u);
      const list = (byKey[unit.k] ||= []);
      let f = list.find((x) => x._sig === sig);
      if (!f) { f = { _sig: sig, refs: [], prev: [], next: [] }; list.push(f); }
      f.refs.push([row.n, u]);
      const prev = u > 0 ? row.units[u - 1].k : '^', next = u < row.units.length - 1 ? row.units[u + 1].k : '$';
      if (!f.prev.includes(prev)) f.prev.push(prev);
      if (!f.next.includes(next)) f.next.push(next);
    });
  }
  figures[m] = {};
  for (const k of KEYS) if (byKey[k]) figures[m][k] = byKey[k].map(({ _sig, ...f }) => f);
}

/* ---------- the Trope Tutor's staffs against their chart rows ---------- */
// A deliberate, documented departure from the print: applied to the reduced row, then compared — and
// only while the print is still the one it was decided for (`holds`); otherwise the build fails, so a
// re-read row can never slip under a correction made for different notes.
const DEPARTURES = {
  'torah:pazer': {
    why: "the maintainer holds PA-ZER's two opening D4s as one quarter note",
    print: 'PA- D4(e) ZER D4(s), two separate sounding D4s',
    holds: (row, unit) => {
      const [a, b] = row.notes.slice(unit.from, unit.from + 2);
      return !!(a && b) && [a, b].every((n) => !n.r && !n.g && !n.tie && n.p === -9) && a.v === 'e' && b.v === 's';
    },
    apply: (notes) => [{ p: notes[0].p, t: TPQ }, ...notes.slice(2)],
  },
};
// The staff's four values are d 1–4 (eighth, quarter, dotted quarter, half). A chart note reduces to
// one staff note — a grace note is drawn as an eighth, tied notes merge into one, rests drop — and
// its length decides which d values may draw it: anything shorter than a quarter (sixteenths, dotted
// eighths, every triplet value) is d 1; a longer one may use any d within a sixteenth of its length
// (a tied 52 ticks is a quarter, a tied 60 either a quarter or a dotted quarter), and anything from a
// half and a sixteenth (108 ticks) up is a half, the staff's longest value.
function reduceUnit(row, unit) {
  const out = [];
  for (let i = unit.from; i <= unit.to; i++) {
    const n = row.notes[i];
    if (n.r) continue;
    if (n.g) { out.push({ p: n.p, t: VALUES.e, grace: true }); continue; }
    let t = n.t, j = i;
    while (row.notes[j].tie && j + 1 <= unit.to) { j++; t += row.notes[j].t; }
    out.push({ p: n.p, t, tied: j > i });
    i = j;
  }
  return out;
}
// Section A's table: for each Learn card (a row whose first cell starts with a TROPES key; "(no card)"
// rows are skipped), the chart row its staff is read from in each melody, or — for none.
function cardTable(text, path) {
  const lines = text.split('\n');
  const head = lines.findIndex((l) => /^\|\s*Mark \(tutor key\)\s*\|\s*Torah row\s*\|\s*High Holiday row\s*\|/.test(l));
  if (head < 0) { fail(`${path}: no section A table ("| Mark (tutor key) | Torah row | High Holiday row | … |")`); return null; }
  const cards = { torah: {}, highholiday: {} };
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim());
    if (cells[0].includes('(no card)')) continue;
    const key = cells[0].split(/\s+/)[0];
    if (!TROPES.some((t) => t.key === key)) { fail(`${path}:${i + 1}: section A's "${cells[0]}" starts with no TROPES key (mark a row without a Learn card "(no card)")`); continue; }
    [['torah', cells[1]], ['highholiday', cells[2]]].forEach(([m, cell]) => {
      if (cell === '—') return;
      if (!/^\d+b?$/.test(cell || '')) fail(`${path}:${i + 1}: section A gives ${key} the ${MELODIES[m].label} row "${cell}" — a row number, or — for no staff`);
      else if (Object.hasOwn(cards[m], key)) fail(`${path}:${i + 1}: section A names ${key} twice`);
      else cards[m][key] = cell;
    });
  }
  return cards;
}
const staffOk = (t, d) => (t < TPQ ? d === 1 : t >= TPQ * 2.25 ? d === 4 : d >= 2 && d <= 4 && Math.abs(d * VALUES.e - t) <= VALUES.s);
function staffD(t, prefer) {   // the value a paste-ready suggestion uses: the file's own when it fits, else the nearest
  if (prefer && staffOk(t, prefer)) return prefer;
  if (t < TPQ) return 1;
  if (t >= TPQ * 2.25) return 4;
  return Math.max(2, Math.min(4, Math.round(t / VALUES.e)));
}
const crossCheck = [];
if (!LENIENT) {
  const cards = cardTable(docText, DOC_PATH.replace(repoRoot + '/', '')) || { torah: {}, highholiday: {} };
  for (const [m, d] of Object.entries(MELODIES)) {
    const file = JSON.parse(readFileSync(join(repoRoot, d.motifs), 'utf8'));
    if (file.key !== d.key) fail(`${d.motifs}: key "${file.key}" but the ${d.label} chart is written in ${d.key}`);
    const tropes = file.tropes || {};
    // exactly section A's cards: a missing entry would leave a Learn card without its staff
    for (const [key, n] of Object.entries(cards[m]))
      if (!Object.hasOwn(tropes, key)) fail(`${d.motifs}: no "${key}" entry, but section A reads its staff from ${d.label} row #${n}`);
    for (const [key, entry] of Object.entries(tropes)) {
      const rec = { melody: m, key, file: d.motifs, source: entry.source || '', status: '', note: '' };
      crossCheck.push(rec);
      const bad = (why) => { rec.status = 'MISMATCH'; rec.note = why; fail(`${d.motifs} ${key}: ${why}`); };
      if (!Object.hasOwn(cards[m], key)) { bad(`section A gives ${key} no ${d.label} row, so it has no staff to check`); continue; }
      const source = `tropepatterns.md ${d.label} #${cards[m][key]}`;
      if (entry.source !== source) { bad(`source "${entry.source}", but section A reads this staff from "${source}"`); continue; }
      if (entry.verified !== true) { bad(`verified is ${JSON.stringify(entry.verified)} — every staff is a checked transcription (verified: true)`); continue; }
      // the tutor draws d 1–4 and skips a staff whose p or d is not a number, so both must be whole
      const notes = Array.isArray(entry.notes) ? entry.notes : [];
      const odd = notes.map((n, i) => (n && Number.isInteger(n.p) && Number.isInteger(n.d) && n.d >= 1 && n.d <= 4 ? 0 : i + 1)).filter(Boolean);
      if (!notes.length || odd.length) { bad(`${notes.length ? `note ${odd.join(', ')} of ${notes.length}` : 'no notes'} — every p must be a whole number and every d one of 1, 2, 3, 4`); continue; }
      const row = melodies[m].rows.find((r) => r.n === cards[m][key]);
      const units = row ? row.units.filter((u) => u.k === key) : [];
      if (units.length !== 1) { bad(`${d.label} row #${cards[m][key]} has ${units.length} "${key}" lines (needs exactly one)`); continue; }
      let want = reduceUnit(row, units[0]);
      const dep = DEPARTURES[`${m}:${key}`];
      if (dep) {
        if (!dep.holds(row, units[0])) { bad(`departure no longer applies — "${dep.why}" was decided for ${dep.print}, and ${d.label} row #${row.n} now opens ${unitTokens(row, row.units.indexOf(units[0]), m).slice(0, 4).join(' ')}; re-check the staff, then DEPARTURES`); continue; }
        want = dep.apply(want); rec.departure = dep.why;
      }
      const have = notes.map((n) => ({ p: n.p, d: n.d }));
      const ok = have.length === want.length && have.every((h, i) => h.p === want[i].p && staffOk(want[i].t, h.d));
      if (ok) {
        const rounded = want.filter((w, i) => w.t >= TPQ && have[i].d * VALUES.e !== w.t);
        const tied = rounded.filter((w) => w.tied).length, long = rounded.length - tied;
        const plural = (n, what) => `${n} ${what} note${n > 1 ? 's' : ''}`;
        const drawn = [tied && plural(tied, 'tied'), long && plural(long, 'long')].filter(Boolean).join(' and ');
        rec.status = (dep ? 'match (documented departure)' : 'match') + (drawn ? ` — ${drawn} drawn at the nearest value` : '');
      } else {
        rec.status = 'MISMATCH';
        const sug = want.map((w, i) => ({ p: w.p, d: staffD(w.t, have[i] && have[i].p === w.p ? have[i].d : 0) }));
        rec.note = `staff ${have.map((n) => `${n.p}:${n.d}`).join(' ')} · chart ${sug.map((n) => `${n.p}:${n.d}`).join(' ')}`;
        fail(`${d.motifs} ${key} (${entry.source}): the staff differs from its chart row\n    staff: ${JSON.stringify(entry.notes)}\n    chart: ${JSON.stringify(sug)}   <- paste as "notes" if the chart reading is right`);
      }
    }
  }
}

/* ---------- smoke tests ---------- */
if (!LENIENT) {
  const t1 = melodies.torah.rows.find((r) => r.n === '1');
  const want1 = '-10:24 -7:36 -7:12 -5:36 -2:12 -7:72 -7:24 -9:24 -12:24 -14:12 -14:12 -7:48';
  const got1 = t1 ? t1.notes.map((n) => `${n.p}:${n.t}`).join(' ') : '(missing)';
  if (got1 !== want1) fail(`smoke: Torah row 1 reads ${got1}, expected ${want1}`);
  const printed = new Set(melodies.torah.rows.flatMap((r) => r.units.map((u) => u.k)));
  for (const t of TROPES) if (t.key !== 'geresh_muqdam' && !printed.has(t.key)) fail(`smoke: no Torah row prints ${t.key}`);
  const hh = new Set(melodies.highholiday.rows.flatMap((r) => r.units.map((u) => u.k)));
  const hhMissing = TROPES.map((t) => t.key).filter((k) => !hh.has(k)).sort().join(',');
  if (hhMissing !== 'geresh_muqdam,karnei_parah,mercha_kefula,shalshelet,yerach_ben_yomo')
    fail(`smoke: the High Holiday rows lack ${hhMissing}; expected exactly shalshelet, mercha kefula, karnei parah and yerach ben yomo (+ geresh muqdam)`);
}

/* ---------- JSON (one row per line, so a diff shows the row that changed) ---------- */
const clean = (row) => { const { _src, ...r } = row; return r; };
function serialize(built) {
  const head = { v: 1, built, license: LICENSE, source: 'docs/tropepatterns.md, sections B and C', tpq: TPQ, values: VALUES };
  let s = JSON.stringify(head).slice(0, -1) + ',"melodies":{\n';
  s += Object.entries(melodies).map(([m, mel]) =>
    `${JSON.stringify(m)}:{"key":${JSON.stringify(mel.key)},"rows":[\n` + mel.rows.map((r) => JSON.stringify(clean(r))).join(',\n') + '\n]}').join(',\n');
  s += '},\n"figures":{\n';
  s += Object.entries(figures).map(([m, f]) =>
    `${JSON.stringify(m)}:{\n` + Object.entries(f).map(([k, list]) => `${JSON.stringify(k)}:${JSON.stringify(list)}`).join(',\n') + '\n}').join(',\n');
  s += '\n}}\n';
  return s;
}
const today = new Date().toISOString().slice(0, 10);
let built = today;
if (existsSync(JSON_PATH)) {
  try {
    const old = readFileSync(JSON_PATH, 'utf8');
    const oldBuilt = JSON.parse(old).built;
    if (oldBuilt && serialize(oldBuilt) === old) built = oldBuilt;   // nothing changed: keep the date
  } catch { /* unreadable old file: rebuild */ }
}
const json = serialize(built);
const bytes = Buffer.byteLength(json);
try { JSON.parse(json); } catch (e) { fail(`smoke: the JSON does not parse (${e.message})`); }
if (!LENIENT && bytes > SIZE_BUDGET) fail(`smoke: trope_phrases.json is ${bytes} bytes (budget ${SIZE_BUDGET})`);

/* ---------- report ---------- */
function degree(p) {   // Torah chart: A = 1 (A3 … G♯4 plain, A4 … primed)
  const s = p + 14, oct = Math.floor(s / 12), pc = ((s % 12) + 12) % 12;
  const DEG = { 0: '1', 1: '♯1', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♯4', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7' };
  return DEG[pc] + (oct > 0 ? '′'.repeat(oct) : oct < 0 ? ','.repeat(-oct) : '');
}
function report() {
  const L = [];
  const total = (m) => melodies[m].rows.reduce((a, r) => a + r.notes.filter((n) => !n.r).length, 0);
  L.push('# Trope phrases build report', '');
  L.push(`- **Built:** ${built}`);
  L.push('- **Source:** `docs/tropepatterns.md` sections B and C — the printed chart\'s rows, transcribed from clean scans');
  L.push(`- **Output:** \`data/trope/trope_phrases.json\` — ${bytes.toLocaleString('en-US')} bytes (budget ${SIZE_BUDGET.toLocaleString('en-US')})`);
  L.push(`- **Rows:** Torah ${melodies.torah.rows.length} (${total('torah')} notes) · High Holiday ${melodies.highholiday.rows.length} (${total('highholiday')} notes)`);
  L.push('- **License:** hand transcriptions of the traditional melodies — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), like the JSON.');
  L.push('', 'Generated by `node scripts/build-trope-phrases.mjs`; do not edit by hand. To change a note, edit its row',
    'in `docs/tropepatterns.md` and re-run the script.', '');
  L.push('## Every figure of every mark, in every context the chart prints', '');
  L.push('Each mark lists its distinct figures. *Rows* are the chart rows that print it; *after* and *before* are',
    'the marks on either side there (^ = the row starts with it, $ = the row ends with it). Degrees (Torah',
    'only) count from A = 1; ′ is the octave above.', '');
  for (const [m, d] of Object.entries(MELODIES)) {
    L.push(`### ${d.label} melody`, '');
    for (const k of KEYS) {
      const list = figures[m][k];
      if (!list) continue;
      L.push(`#### ${k}`, '');
      for (const f of list) {
        const [n, u] = f.refs[0];
        const row = melodies[m].rows.find((r) => r.n === n);
        const unit = row.units[u];
        const notes = unitTokens(row, u, m).join(' ');
        const deg = m === 'torah' ? ' · degrees ' + row.notes.slice(unit.from, unit.to + 1).filter((x) => !x.r).map((x) => degree(x.p)).join(' ') : '';
        L.push(`- \`${notes}\` — rows ${f.refs.map((r) => r[0]).join(', ')} · after ${f.prev.join(', ')} · before ${f.next.join(', ')}${deg}`);
      }
      L.push('');
    }
  }
  L.push('## The Trope Tutor\'s staffs against their rows', '');
  L.push('Each Learn-card staff (`data/trope/trope_motifs.json`, `trope_motifs_hh.json`) is the chart row its',
    '`source` names, reduced to the staff\'s values: a grace note is drawn as an eighth, tied notes merge, rests',
    'drop, and anything shorter than a quarter is `d` 1 (quarter 2, dotted quarter 3, half 4).', '');
  L.push('| Melody | Mark | Source | Result |', '|---|---|---|---|');
  for (const r of crossCheck) L.push(`| ${MELODIES[r.melody].label} | ${r.key} | ${r.source} | ${r.status}${r.departure ? ` — ${r.departure}` : ''}${r.note ? ` — ${r.note}` : ''} |`);
  L.push('');
  return L.join('\n');
}

/* ---------- write: at the end of the file, once the census (with --census) has passed too ---------- */
// The contexts report names the JSON it was counted against by this digest (the file's sha1, as written).
const jsonDigest = createHash('sha1').update(json).digest('hex').slice(0, 12);
const DIGEST_RE = /^- \*\*Chart:\*\* .*?\(sha1 ([0-9a-f]{12})\)/m;
/* ══════════════════════════════════════════════════════════════════════════════════════
   CENSUS (--census) — which mark-before-mark contexts the Torah text needs, against the chart.
   docs/tropepatterns.md → G. Toward a parasha staff explains how the report is used.

   Text: Sefaria's public export, one merged.json per book, whose Torah text is the Miqra according to
   the Masorah edition (MAM; the loader refuses any other),
   through the same cache files and curl fallback as build-trope-index.mjs. Each verse is cleaned
   (footnotes, the unpointed ketiv of a ketiv/qere pair, paragraph marks and tags removed) and split
   on whitespace only: a maqaf compound (a־b) is one word with one accent, as it is sung.
   A word's marks become its units, in text order:
     - a repeated mark counts once (double pashta, a doubled telisha), and a kadma glyph on a word
       that also carries pashta is the first half of a double pashta (Unicode texts encode the
       stressed-syllable pashta with the kadma code point), so it is dropped;
     - the verse's last word adds sof_pasuk (its siluk is METEG, outside the mark range);
     - the text draws two vertical lines apart: the legarmeh line is a full-size ׀, and a paseq (a
       pause that leaves the mark before it as it is) is a small one, <small>׀</small>. The legarmeh
       line after a munach makes it munach_legarmeh; after any other mark it is only counted, and a
       paseq is only counted;
     - two different marks on one word stay two units, and their pair is reported apart.
   The double-accented passages (Genesis 35:22 and the two Decalogues) carry two cantillation
   systems at once and are left out and listed.
   ══════════════════════════════════════════════════════════════════════════════════════ */
const BOOKS = ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'];
const TEXT_EDITION = 'Miqra according to the Masorah';
const DOUBLE_ACCENTED = [
  { book: 'Genesis', from: [35, 22], to: [35, 22] },
  { book: 'Exodus', from: [20, 2], to: [20, 14] },
  { book: 'Deuteronomy', from: [5, 6], to: [5, 18] },
];
const HH_BANNED = ['shalshelet', 'mercha_kefula', 'karnei_parah', 'yerach_ben_yomo'];   // docs/tropepatterns.md → A
// The aliyot are PocketTorah's (data/pockettorah/aliyah.json), the ones the Torah Trainer shows. Hebcal's
// calendar (@hebcal/leyning) ends two of them elsewhere; the report counts what those ends would change.
const OTHER_CALENDAR_ENDS = [{ parasha: 'Terumah', aliyah: '2', end: '25:40' }, { parasha: 'Masei', aliyah: '1', end: '33:10' }];
const MARK_RANGE_G = /[֑-֯]/g;

function readRepo(rel) {
  let raw = readFileSync(join(repoRoot, rel), 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);   // aliyah.json ships a UTF-8 BOM
  return raw;
}
function loadBookText(book) {
  const path = join(CACHE_DIR, `merged-${book}.json`);
  if (!existsSync(path)) {
    const url = `https://storage.googleapis.com/sefaria-export/json/Tanakh/Torah/${book}/Hebrew/merged.json`;
    console.log(`  fetching ${url}`);
    // curl, not fetch: Node's fetch ignores HTTPS_PROXY (build-trope-index.mjs does the same)
    const body = execFileSync('curl', ['-sS', '--fail', '--max-time', '120', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(path, body);
  }
  const file = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(file.text)) die(`unexpected shape in ${path}`);
  // The paseq rule reads MAM's markup, and the report names MAM as the source, so another edition
  // must stop the census rather than be counted.
  const eds = (file.versions || []).map((v) => v[0]);
  if (eds.length !== 1 || eds[0] !== TEXT_EDITION) die(`${path} merges ${JSON.stringify(eds)}, not only "${TEXT_EDITION}": check its paseq markup and the report's source line before trusting a census`);
  return file.text;
}
const ENTITIES = { nbsp: ' ', thinsp: ' ', mdash: '—', ndash: '–', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const PASEQ_TOKEN = '⟨paseq⟩';   // the small ׀, kept apart from the legarmeh line before tags go
function cleanVerseText(s) {
  let out = s
    .replace(/<sup[^>]*>.*?<\/sup>/g, ' ')
    .replace(/<i class="footnote">.*?<\/i>/g, ' ')
    .replace(/<span class="mam-kq-k">.*?<\/span>/g, ' ')   // ketiv (read the qere)
    .replace(/<small>\s*׀\s*<\/small>/g, ` ${PASEQ_TOKEN} `)
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => ENTITIES[n] ?? m)
    .replace(/[\[\]()]/g, '');
  return out.replace(/\s+/g, ' ').trim();
}
function inRange(book, c, v, r) {
  const at = c * 1000 + v;
  return r.book === book && at >= r.from[0] * 1000 + r.from[1] && at <= r.to[0] * 1000 + r.to[1];
}

// A verse -> [{k, word, w, withinWord}] units; stats collects what the rules above had to decide.
function verseUnits(text, stats, ref) {
  const toks = text.split(' ').filter(Boolean);
  const words = [];
  for (const t of toks) {
    if (t === PASEQ_TOKEN) { if (words.length) words[words.length - 1].paseq = true; else stats.anomalies.push('a paseq opens a verse'); continue; }
    if (t === '׀') { if (words.length) words[words.length - 1].line = true; else stats.anomalies.push('a legarmeh line opens a verse'); continue; }
    if (!/[א-ת]/.test(t)) continue;
    words.push({ text: t.replace(/׀/g, ''), line: t.includes('׀') });
  }
  const units = [];
  words.forEach((w, wi) => {
    const chars = w.text.match(MARK_RANGE_G) || [];
    let keys = [];
    for (const ch of chars) {
      const k = CHAR_TO_KEY[ch];
      if (!k) { stats.unknownMarks[`U+${ch.codePointAt(0).toString(16).toUpperCase()}`] = (stats.unknownMarks[`U+${ch.codePointAt(0).toString(16).toUpperCase()}`] || 0) + 1; continue; }
      if (!keys.includes(k)) keys.push(k);
      else stats.repeated[k] = (stats.repeated[k] || 0) + 1;
    }
    if (keys.includes('kadma') && keys.includes('pashta')) { keys = keys.filter((k) => k !== 'kadma'); stats.doublePashta++; }
    const last = wi === words.length - 1;
    if (last) keys.push('sof_pasuk');
    if (!keys.length) { stats.unmarked++; if (stats.unmarkedEx.length < 5) stats.unmarkedEx.push(`${w.text} (${ref})`); return; }
    const lk = keys[keys.length - 1];
    if (w.line) {
      if (lk === 'munach') keys[keys.length - 1] = 'munach_legarmeh';
      else stats.lineAfter[lk] = (stats.lineAfter[lk] || 0) + 1;
    }
    if (w.paseq) stats.paseqAfter[lk] = (stats.paseqAfter[lk] || 0) + 1;
    if (keys.length > 1) { const combo = keys.join(' + '); stats.multi[combo] = stats.multi[combo] || { n: 0, ex: w.text }; stats.multi[combo].n++; }
    keys.forEach((k, i) => units.push({ k, word: w.text, w: wi, withinWord: i > 0 }));
  });
  return units;
}

// The chart's printed contexts for one melody (aliyah-end rows kept apart).
function printedContexts(melody) {
  const pairs = new Set(), toDisj = new Set(), marks = new Set(), endings = new Set();
  for (const row of melodies[melody].rows) {
    const ks = row.units.map((u) => u.k);
    if (row.tags.includes('aliyah-end')) { endings.add(ks.join(' ')); continue; }
    ks.forEach((k, i) => {
      marks.add(k);
      if (i + 1 < ks.length) pairs.add(`${k}>${ks[i + 1]}`);
      if (CONJUNCTIVE.has(k)) {
        const j = ks.findIndex((x, jj) => jj > i && !CONJUNCTIVE.has(x));
        if (j > 0) toDisj.add(`${k}>${ks[j]}`);
      }
    });
  }
  const printedBefore = {};   // conjunctive -> the marks the chart prints it before ($ = a row end)
  for (const [k, list] of Object.entries(figures[melody] || {}))
    if (CONJUNCTIVE.has(k)) printedBefore[k] = [...new Set(list.flatMap((f) => f.next))];
  return { pairs, toDisj, marks, endings, printedBefore };
}

function newStats() {
  return { verses: 0, words: 0, units: 0, excluded: [], anomalies: [], unknownMarks: {}, repeated: {}, doublePashta: 0,
    unmarked: 0, unmarkedEx: [], paseqAfter: {}, lineAfter: {}, multi: {}, markCount: {}, pairs: {}, legarmeh: 0 };
}
function tally(stats, units, ref) {
  stats.units += units.length;
  units.forEach((u, i) => {
    stats.markCount[u.k] = stats.markCount[u.k] || { n: 0, ex: `${ref} ${u.word}` };
    stats.markCount[u.k].n++;
    if (u.k === 'munach_legarmeh') stats.legarmeh++;
    const nx = units[i + 1];
    if (!nx) return;
    const key = `${u.k}>${nx.k}`;
    // A pair inside one word (a munach on the first syllable of a zakef word) is sung like the same
    // pair across two words, so it is counted with them; the report lists such words separately too.
    const rec = (stats.pairs[key] ||= { n: 0, ex: `${ref} ${nx.withinWord ? u.word : `${u.word} ${nx.word}`}`, disj: {} });
    rec.n++;
    if (CONJUNCTIVE.has(u.k)) {
      let d = '$';
      for (let j = i + 1; j < units.length; j++) if (!CONJUNCTIVE.has(units[j].k)) { d = units[j].k; break; }
      rec.disj[d] = (rec.disj[d] || 0) + 1;
    }
  });
}

async function census() {
  const cf = [];   // census failures
  const texts = {};
  for (const b of BOOKS) texts[b] = loadBookText(b);
  const parshiyot = JSON.parse(readRepo('data/parshiyot.json'));
  const aliyahData = JSON.parse(readRepo('data/pockettorah/aliyah.json')).parshiot.parsha;
  // the High Holiday readings, from the Torah Trainer's own table
  const tt = readRepo('torah_trainer.html');
  const hhReadings = [...tt.matchAll(/\{\s*key:'([a-z0-9-]+)',\s*name:'([^']+)',\s*ref:'([A-Za-z]+) (\d+):(\d+)-(?:(\d+):)?(\d+)',\s*melody:'highholiday'\s*\}/g)]
    .map((m) => ({ key: m[1], name: m[2], book: m[3], from: [+m[4], +m[5]], to: [m[6] ? +m[6] : +m[4], +m[7]] }));
  if (hhReadings.length !== 4) cf.push(`expected 4 High Holiday readings in torah_trainer.html's HOLIDAY_READINGS, found ${hhReadings.length}`);

  const tor = newStats(), hh = newStats();
  const pTorah = printedContexts('torah'), pHH = printedContexts('highholiday');
  const verseUnitsCache = {};   // "Book c:v" -> units
  let gen11 = null;
  for (const b of BOOKS) {
    texts[b].forEach((ch, ci) => ch.forEach((raw, vi) => {
      if (typeof raw !== 'string' || !raw.trim()) return;
      const c = ci + 1, v = vi + 1, ref = `${b} ${c}:${v}`;
      tor.verses++;
      if (DOUBLE_ACCENTED.some((r) => inRange(b, c, v, r))) { tor.excluded.push(ref); return; }
      const units = verseUnits(cleanVerseText(raw), tor, ref);
      verseUnitsCache[ref] = units;
      tor.words += new Set(units.map((u) => u.w)).size;
      if (b === 'Genesis' && c === 1 && v === 1) gen11 = units.map((u) => u.k).join(' ');
      tally(tor, units, ref);
    }));
  }
  let hhVerses = 0;
  for (const r of hhReadings) {
    const ch = texts[r.book];
    for (let c = r.from[0]; c <= r.to[0]; c++) {
      const vFrom = c === r.from[0] ? r.from[1] : 1, vTo = c === r.to[0] ? r.to[1] : ch[c - 1].length;
      for (let v = vFrom; v <= vTo; v++) {
        const ref = `${r.book} ${c}:${v}`;
        hhVerses++; hh.verses++;
        const units = verseUnitsCache[ref];
        if (!units) { hh.excluded.push(ref); continue; }
        tally(hh, units, ref);
      }
    }
  }
  // aliyah-final verses (full kriyah, aliyot 1–7): the closing run of mercha / tipcha / sof pasuk. Each
  // parasha finds its aliyot by its first verse (aliyah.json's `_verse`), never by its place in the list.
  const firstVerse = (s) => (String(s || '').match(/^[A-Za-z]+ \d+:\d+/) || [''])[0];
  const aliyotOf = new Map(aliyahData.map((a) => [firstVerse(a._verse), a]));
  if (aliyotOf.size !== aliyahData.length) cf.push('data/pockettorah/aliyah.json lists two parshiyot that open on the same verse');
  const closingRun = (ref) => {   // null for a verse the census leaves out
    const units = verseUnitsCache[ref];
    if (!units) return null;
    let j = units.length;
    while (j > 0 && ['mercha', 'tipcha', 'sof_pasuk'].includes(units[j - 1].k) && units.length - j < 4) j--;
    return units.slice(j).map((u) => u.k).join(' ');
  };
  const endings = {}, otherEndings = {}, otherEnds = [], otherSeen = new Set();
  for (const p of parshiyot) {
    const al = aliyotOf.get(firstVerse(p.ref));
    if (!al) { cf.push(`data/pockettorah/aliyah.json has no parasha opening at ${firstVerse(p.ref)} (${p.en})`); continue; }
    const seven = al.fullkriyah.aliyah.filter((x) => /^[1-7]$/.test(x._num));
    if (seven.length !== 7) cf.push(`data/pockettorah/aliyah.json gives ${p.en} ${seven.length} of the full reading's aliyot 1–7`);
    for (const x of seven) {
      const [c, v] = x._end.split(':').map(Number);
      const ref = `${p.book} ${c}:${v}`, pat = closingRun(ref);
      if (pat !== null) (endings[pat] ||= { n: 0, ex: ref }).n++;
      const other = OTHER_CALENDAR_ENDS.find((o) => o.parasha === p.en && o.aliyah === x._num);
      if (other) otherSeen.add(other);
      const moved = other && other.end !== `${c}:${v}`;
      if (moved) otherEnds.push({ ...other, book: p.book, here: `${c}:${v}` });
      const otherPat = moved ? closingRun(`${p.book} ${other.end}`) : pat;
      if (otherPat !== null) otherEndings[otherPat] = (otherEndings[otherPat] || 0) + 1;
    }
  }
  for (const o of OTHER_CALENDAR_ENDS) if (!otherSeen.has(o)) cf.push(`OTHER_CALENDAR_ENDS names ${o.parasha} aliyah ${o.aliyah}, which the aliyah data does not have`);

  // smoke tests
  if (gen11 !== 'tipcha munach etnachta mercha tipcha mercha sof_pasuk') cf.push(`Genesis 1:1 reads "${gen11}"`);
  // 5,846 in modern (Leningrad-based) numbering, which the export follows; the Masorah's own tally is 5,845
  if (tor.verses !== 5846) cf.push(`${tor.verses} Torah verses (expected 5,846)`);
  if (hhVerses !== 122) cf.push(`${hhVerses} verses in the High Holiday readings (expected 122)`);
  for (const k of HH_BANNED) if (hh.markCount[k]) cf.push(`${k} occurs ${hh.markCount[k].n}× in the High Holiday readings (${hh.markCount[k].ex}) — docs/tropepatterns.md says it never does`);
  if (!tor.legarmeh) cf.push('no munach legarmeh found (legarmeh-line handling broke)');
  if (!Object.keys(tor.paseqAfter).length) cf.push('no small paseq found: the text no longer draws paseq apart from the legarmeh line, so munach + paseq would pass for munach legarmeh');
  if (cf.length) {
    console.error(`build-trope-phrases --census: ${cf.length} problem(s):`);
    for (const f of cf) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  // The report's own date, kept while its content is unchanged (like `built` in the JSON). The caller
  // writes it, after the JSON and the phrases report.
  const args = { tor, hh, pTorah, pHH, endings, otherEndings, otherEnds, hhReadings, hhVerses, digest: jsonDigest };
  let reportBuilt = today;
  if (existsSync(CENSUS_PATH)) {
    const old = readFileSync(CENSUS_PATH, 'utf8');
    const m = old.match(/^- \*\*Built:\*\* (\d{4}-\d{2}-\d{2})$/m);
    if (m && censusReport({ ...args, built: m[1] }) + '\n' === old) reportBuilt = m[1];
  }
  return { text: censusReport({ ...args, built: reportBuilt }) + '\n', verses: tor.verses, marks: tor.units };
}

function censusReport({ tor, hh, pTorah, pHH, endings, otherEndings, otherEnds, hhReadings, hhVerses, digest, built }) {
  const L = [];
  const fmt = (n) => n.toLocaleString('en-US');
  const pct = (a, b) => (b ? `${(100 * a / b).toFixed(1)}%` : '—');
  const disjOf = (rec) => Object.entries(rec.disj).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ');
  function coverage(st, p) {
    let conj = 0, conjPrinted = 0, conjFallback = 0;
    for (const [key, rec] of Object.entries(st.pairs)) {
      const [a, b] = key.split('>');
      if (!CONJUNCTIVE.has(a)) continue;
      conj += rec.n;
      if (p.pairs.has(key)) conjPrinted += rec.n;
      else for (const [d, n] of Object.entries(rec.disj)) if (p.toDisj.has(`${a}>${d}`)) conjFallback += n;
    }
    const marksWithFigure = Object.entries(st.markCount).filter(([k]) => p.marks.has(k)).reduce((a, [, r]) => a + r.n, 0);
    return { conj, conjPrinted, conjFallback, marksWithFigure };
  }
  function gapTable(st, p) {
    const rows = Object.entries(st.pairs).filter(([key]) => CONJUNCTIVE.has(key.split('>')[0]) && !p.pairs.has(key))
      .sort((a, b) => b[1].n - a[1].n);
    const out = ['| Conjunctive → next mark | Times | The chain leads to (✓ = the chart prints this conjunctive before it) | The chart prints this conjunctive before | First example |',
      '|---|---|---|---|---|'];
    for (const [key, rec] of rows) {
      const [a] = key.split('>');
      const leads = Object.entries(rec.disj).sort((x, y) => y[1] - x[1])
        .map(([d, n]) => `${p.toDisj.has(`${a}>${d}`) ? '✓' : '✗'} ${d === '$' ? 'the verse end' : d} ${fmt(n)}`).join(', ');
      const chart = (p.printedBefore[a] || []).map((k) => (k === '$' ? 'a row end' : k)).join(', ') || 'nothing (no figure)';
      out.push(`| ${key.replace('>', ' → ')} | ${fmt(rec.n)} | ${leads || '—'} | ${chart} | ${rec.ex} |`);
    }
    return rows.length ? out : ['None.'];
  }
  L.push('# Trope contexts report — what a parasha needs against what the chart prints', '');
  L.push(`- **Built:** ${built}`);
  L.push('- **Text:** Sefaria public text export (storage.googleapis.com/sefaria-export, Hebrew merged.json per Torah book), whose Torah text is the *Miqra according to the Masorah* edition (MAM, from Hebrew Wikisource), which Sefaria lists as CC BY-SA. The example words below are quoted from it.');
  L.push(`- **Chart:** \`data/trope/trope_phrases.json\` (sha1 ${digest}), built from \`docs/tropepatterns.md\` sections B and C`);
  L.push(`- **Torah:** ${fmt(tor.verses)} verses (${tor.excluded.length} double-accented ones left out, so ${fmt(tor.verses - tor.excluded.length)} counted): ${fmt(tor.words)} marked words, ${fmt(tor.units)} marks. Left out: ${tor.excluded.join(', ')}`);
  L.push(`- **High Holiday readings:** ${hhReadings.map((r) => `${r.name} (${r.book} ${r.from.join(':')}–${r.to.join(':')})`).join('; ')} — ${hhVerses} verses`);
  L.push('- **Aliyot:** `data/pockettorah/aliyah.json`, PocketTorah\'s full-reading divisions — the aliyot the Torah Trainer shows — each paired with its parasha in `data/parshiyot.json` by the parasha\'s first verse');
  L.push('', 'Generated by `node scripts/build-trope-phrases.mjs --census`; do not edit by hand. How to read it:',
    '`docs/tropepatterns.md` → *G. Toward a parasha staff*.', '');
  const ct = coverage(tor, pTorah), ch = coverage(hh, pHH);
  L.push('## Coverage', '');
  L.push('| | Torah (year-round chart) | High Holiday readings (High Holiday chart) |', '|---|---|---|');
  L.push(`| Marks whose mark has a figure in the chart | ${pct(ct.marksWithFigure, tor.units)} | ${pct(ch.marksWithFigure, hh.units || Object.values(hh.markCount).reduce((a, r) => a + r.n, 0))} |`);
  L.push(`| Conjunctives printed before the very mark that follows | ${pct(ct.conjPrinted, ct.conj)} (${fmt(ct.conjPrinted)} of ${fmt(ct.conj)}) | ${pct(ch.conjPrinted, ch.conj)} (${fmt(ch.conjPrinted)} of ${fmt(ch.conj)}) |`);
  L.push(`| …or at least before the disjunctive the chain leads to | ${pct(ct.conjPrinted + ct.conjFallback, ct.conj)} | ${pct(ch.conjPrinted + ch.conjFallback, ch.conj)} |`);
  L.push('', 'A conjunctive (munach, mercha, mahpach, kadma, darga, telisha ketana, mercha kefula, yerach ben yomo) takes its',
    'shape from the mark it leads into, so its figure is chosen by the next mark. Pairs inside one word count too (a',
    'munach on the first syllable of a zakef word is sung before the zakef). Where the chart prints the conjunctive',
    'only before the disjunctive the chain leads to (a munach → munach → revia chain: the chart has munach before',
    'revia), that figure is the fallback (✓); ✗ means the chart has no figure of that conjunctive before that',
    'disjunctive, and the last column lists the figures it does have.', '');
  L.push('## Torah: conjunctive contexts the chart does not print', '');
  L.push(...gapTable(tor, pTorah), '');
  L.push('## High Holiday readings: conjunctive contexts the High Holiday chart does not print', '');
  L.push(...gapTable(hh, pHH), '');
  L.push('## Marks without a figure', '');
  const noFig = (st, p) => Object.entries(st.markCount).filter(([k]) => !p.marks.has(k)).sort((a, b) => b[1].n - a[1].n);
  const nf = noFig(tor, pTorah), nfh = noFig(hh, pHH);
  const allNf = [...new Set([...nf.map(([k]) => k), ...nfh.map(([k]) => k)])];
  const absent = TROPES.map((t) => t.key).filter((k) => !pTorah.marks.has(k) && !tor.markCount[k]);
  if (allNf.length) {
    L.push('| Mark | Torah | First example | High Holiday readings |', '|---|---|---|---|');
    for (const k of allNf) L.push(`| ${k} | ${tor.markCount[k] && !pTorah.marks.has(k) ? fmt(tor.markCount[k].n) : '—'} | ${tor.markCount[k] && !pTorah.marks.has(k) ? tor.markCount[k].ex : ''} | ${hh.markCount[k] && !pHH.marks.has(k) ? `${fmt(hh.markCount[k].n)} (${hh.markCount[k].ex})` : '—'} |`);
  } else L.push(`None: every mark in the text has a figure in its melody's chart${absent.length ? ` (${absent.join(', ')}, the chart's only mark without one, never occurs)` : ''}.`);
  L.push('');
  L.push('## The last verse of an aliyah', '');
  L.push('The closing run of mercha, tipcha and sof pasuk in every aliyah-final verse of the full reading (aliyot 1–7 of',
    'the 54 parshiyot, `data/pockettorah/aliyah.json`), against the chart\'s end-of-aliyah rows (Torah 41; High Holiday',
    `30–33: ${[...pHH.endings].join('; ')}).`, '');
  L.push('| Closing run | Aliyot | Printed as an end-of-aliyah row (Torah) | Example |', '|---|---|---|---|');
  const runs = Object.entries(endings).sort((a, b) => b[1].n - a[1].n);
  for (const [pat, rec] of runs)
    L.push(`| ${pat} | ${fmt(rec.n)} | ${pTorah.endings.has(pat) ? '✓' : '—'} | ${rec.ex} |`);
  L.push('');
  if (otherEnds.length) {
    const and = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs.join(''));
    const order = [...runs.map(([pat]) => pat), ...Object.keys(otherEndings).filter((pat) => !endings[pat])];
    L.push(`Other calendars end ${['', 'one aliyah', 'two aliyot'][otherEnds.length] || `${otherEnds.length} aliyot`} elsewhere: Hebcal ends ${and(otherEnds.map((o) => `${o.parasha}'s aliyah ${o.aliyah} at ${o.book} ${o.end} (here ${o.here})`))}, which would make the Aliyot column read ${and(order.map((pat) => fmt(otherEndings[pat] || 0)))}.`, '');
  }
  L.push('## Disjunctive → next mark (for reference)', '');
  L.push('A disjunctive\'s figure does not change with the mark after it in the Torah chart (some High Holiday ones do: `docs/tropepatterns.md` → G); the counts show what follows each.', '');
  const dis = {};
  for (const [key, rec] of Object.entries(tor.pairs)) {
    const [a, b] = key.split('>');
    if (CONJUNCTIVE.has(a)) continue;
    (dis[a] ||= []).push([b, rec.n]);
  }
  L.push('| Disjunctive | Followed by (Torah counts) |', '|---|---|');
  for (const k of KEYS) if (dis[k]) L.push(`| ${k} | ${dis[k].sort((x, y) => y[1] - x[1]).map(([b, n]) => `${b} ${fmt(n)}`).join(', ')} |`);
  L.push('');
  L.push('## Words with more than one mark', '');
  L.push('Their pairs are counted in the tables above as well. A kadma glyph on a word that also carries pashta would be',
    `the first half of a double pashta and is not counted as kadma (${fmt(tor.doublePashta)} such words: this text writes`,
    'a double pashta as two pashta signs, merged under *Anomalies and counts*).', '');
  L.push('| Marks on one word | Words | Example |', '|---|---|---|');
  for (const [combo, rec] of Object.entries(tor.multi).sort((a, b) => b[1].n - a[1].n)) L.push(`| ${combo} | ${fmt(rec.n)} | ${rec.ex} |`);
  L.push('');
  L.push('## Anomalies and counts', '');
  const byCount = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
  L.push(`- Munach legarmeh (munach + the full-size legarmeh line ׀): ${fmt(tor.legarmeh)}.`);
  L.push(`- The legarmeh line after a mark other than munach (kept as that mark): ${byCount(tor.lineAfter)}.`);
  L.push(`- Paseq (the small ׀, a pause that leaves the mark before it as it is): after ${byCount(tor.paseqAfter)}.`);
  L.push(`- Repeated marks merged: ${Object.entries(tor.repeated).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}.`);
  L.push(`- Marks outside the tutor's taxonomy: ${Object.entries(tor.unknownMarks).map(([k, n]) => `${k} ${n}`).join(', ') || 'none'}.`);
  L.push(`- Words with no mark: ${fmt(tor.unmarked)}${tor.unmarkedEx.length ? ` (e.g. ${tor.unmarkedEx.join(', ')})` : ''}.`);
  if (tor.anomalies.length) L.push(`- ${tor.anomalies.join('; ')}.`);
  L.push('');
  return L.join('\n');
}

// Last, after every declaration above: the census reads the constants of its section, and nothing is
// written until every check — the census's too — has passed.
if (failures.length) {
  console.error(`build-trope-phrases: ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
const counted = CENSUS ? await census() : null;   // exits non-zero, having written nothing, on a census failure
mkdirSync(dirname(JSON_PATH), { recursive: true });
writeFileSync(JSON_PATH, json);
if (!LENIENT) writeFileSync(REPORT_PATH, report() + '\n');
console.log(`build-trope-phrases: ${melodies.torah.rows.length} Torah + ${melodies.highholiday.rows.length} High Holiday rows -> ${JSON_PATH.replace(repoRoot + '/', '')} (${bytes} bytes)${LENIENT ? ' [lenient]' : `; ${crossCheck.length} staffs checked`}`);
if (counted) {
  writeFileSync(CENSUS_PATH, counted.text);
  console.log(`build-trope-phrases --census: ${counted.verses} verses, ${counted.marks} marks -> ${CENSUS_PATH.replace(repoRoot + '/', '')}`);
} else if (existsSync(CENSUS_PATH)) {
  // the contexts report was counted against another chart: warn, since only --census can bring it up to date
  const named = (readFileSync(CENSUS_PATH, 'utf8').match(DIGEST_RE) || [])[1];
  if (named !== jsonDigest)
    console.warn(`build-trope-phrases: WARNING — ${CENSUS_PATH.replace(repoRoot + '/', '')} was counted against ${named ? `trope_phrases.json ${named}` : 'an unnamed trope_phrases.json'}, not this build's ${jsonDigest}: re-run with --census`);
}
