#!/usr/bin/env node
/**
 * build-trope-phrases.mjs — build data/trope/trope_phrases.json from the printed cantillation chart.
 *
 * The source is docs/tropepatterns.md, sections B, C and H: every row of the book's *Torah
 * Cantillation* chart (41 rows, three sharps) and *High Holiday Torah Cantillation* chart (33 rows
 * + row 20's second setting, no key signature), transcribed note for note from clean scans into
 * fenced ```trope-torah / ```trope-hh blocks, and the Haftarah rows (36, D minor written with F
 * major's one flat — an unverified rendering from memory, every row tagged) in ```trope-haftarah
 * blocks. Those blocks are the only hand-edited copy of the
 * notes: fix a note there and re-run this script — never edit the JSON (nor trope_motifs_haftarah.json,
 * the Learn-card file this script derives from the Haftarah rows). The block grammar is
 * documented in the doc's "How to read this file"; in short:
 *
 *   #<row>[a-z] [tag]… <Hebrew as printed>         tags: [aliyah-end] [unverified] [derived], lowercase,
 *                                                  right after the number (no bracket or Latin letter after)
 *   <tropeKey> <SYL>[-] <note>… <SYL>[-] <note>…   one line per mark, keys from TROPES + munach_legarmeh
 *   note  = [N{][~|~~|=|~=]PITCH(VALUE[,>][,-])[}]   PITCH as it sounds (C♯4, G♮4, B♭4)
 *   VALUE = 32 s ds e de q dq h dh | g (grace)       ~ slur from the previous note, ~~ dashed slur,
 *   rest(VALUE)                                      = tie from it, ~= both; N{ … } a bracket of N notes
 *                                                  (3 a triplet, 6 a sextuplet — scaled; any other N as written)
 *
 * Output (CC BY-SA 4.0, like the motif files):
 *   { v:1, built, license, source, tpq:48, values:{<code>:ticks},
 *     melodies: { torah:{key:"A", rows:[…]}, highholiday:{key:"C", rows:[…]}, haftarah:{key:"F", rows:[…]} },
 *     figures:  { <melody>: { <tropeKey>: [ {refs:[[row, unitIdx]…], prev:[…], next:[…]} ] } } }
 * where each row is flat — { n, he, tags, notes:[{p, v, t, g?, r?, tie?, a?}], syl:[{t, hyphen,
 * unit, from, to}], units:[{k, from, to}], tup:[{from, to}], slur:[{from, to, dashed?}] } — p =
 * semitones from B4 (the motif files' scale), t = ticks at 48 per quarter (a triplet's notes carry
 * their real length), `tie` marks a note tied to the next, and syllables, units, brackets (`tup`, with
 * `n` when the bracket is not a triplet) and slurs are index spans into `notes`, so a bracket or slur
 * may cross from one mark to the next.
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
 *                                                     the chart -> docs/trope_contexts_report.md, and
 *                                                     find each row's real examples (PocketTorah's
 *                                                     timings) -> data/trope/trope_phrase_examples.json
 *                                                     (the only networked path: Sefaria's text export,
 *                                                     cached in gitignored source-data/trope-cache/,
 *                                                     shared with build-trope-index.mjs)
 *   --census --audit-audio                           also listen to every PocketTorah recording for
 *                                                     the pause before each verse, and fail unless
 *                                                     TIMING_SLIPS lists exactly the stretches whose
 *                                                     taps slip by a word (downloads ~640 MB once; keeps
 *                                                     only a loudness envelope in source-data/trope-cache/;
 *                                                     needs `npm install mpg123-decoder`, like
 *                                                     build-trope-motifs.mjs)
 *   --doc=<path> --out=<dir> --lenient                parse another transcription (a second reading)
 *                                                     into <dir>; --lenient skips the Hebrew-marks,
 *                                                     row-count, tutor and smoke checks. --doc and
 *                                                     --lenient need an --out outside data/ and docs/.
 *
 * The TROPES taxonomy is read from both of its carriers (js/trope-staff.js, the staff engine
 * both pages load, and scripts/build-trope-index.mjs), which must be byte-identical; this script only reads it.
 * Zero dependencies (--audit-audio aside). Outputs are written only when every check passes — with --census, the
 * census's too; the script exits non-zero otherwise — never commit its output without a green
 * run. `built` keeps its old date when nothing else in the JSON changed, so a re-run is
 * byte-identical. The contexts report names the sha1 of the JSON it was counted against, and a
 * plain run warns when that is not the JSON it just built (re-run with --census).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
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
const AUDIT_AUDIO = flag('audit-audio');
const DOC_PATH = opt('doc') ? resolve(opt('doc')) : join(repoRoot, 'docs', 'tropepatterns.md');
const OUT_DIR = opt('out') ? resolve(opt('out')) : null;
const JSON_PATH = OUT_DIR ? join(OUT_DIR, 'trope_phrases.json') : join(repoRoot, 'data', 'trope', 'trope_phrases.json');
const REPORT_PATH = OUT_DIR ? join(OUT_DIR, 'trope_phrases_report.md') : join(repoRoot, 'docs', 'trope_phrases_report.md');
const CENSUS_PATH = OUT_DIR ? join(OUT_DIR, 'trope_contexts_report.md') : join(repoRoot, 'docs', 'trope_contexts_report.md');
const EXAMPLES_PATH = OUT_DIR ? join(OUT_DIR, 'trope_phrase_examples.json') : join(repoRoot, 'data', 'trope', 'trope_phrase_examples.json');
const CACHE_DIR = join(repoRoot, 'source-data', 'trope-cache');
const SIZE_BUDGET = 256 * 1024;   // six melodies at one row per line (the teacher's two charts and Portnoy & Wolff's four)
const LICENSE = 'Hand transcriptions of the traditional Ashkenazi Torah and High Holiday cantillation melodies from a printed chart (docs/tropepatterns.md, sections B and C), and an unverified rendering of the Ashkenazi Haftarah melody written from memory (section H). This file is CC BY-SA 4.0.';

const failures = [];
const fail = (msg) => failures.push(msg);
function die(msg) { console.error(`build-trope-phrases: ${msg}`); process.exit(1); }
if (AUDIT_AUDIO && !CENSUS) die('--audit-audio listens to the recordings the census aligns: give --census too');
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
const TROPES_SRC = tropesBlock('js/trope-staff.js');
if (TROPES_SRC !== tropesBlock('scripts/build-trope-index.mjs'))
  die('the TROPES block differs between js/trope-staff.js and scripts/build-trope-index.mjs (it must be byte-identical)');
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
// A bracket N{ … } groups N notes. A triplet (3) is two or more sounding notes whose written values add up to
// three of one plain value, sung in the time of two, and a sextuplet (6) six of one value in the time of four:
// both scale their notes by 2/3. Any other bracket the charts print (4, 5, 8, 11) groups a run of exactly N
// notes and keeps their written values — the books' brackets count the run; they imply no ratio.
const PLAIN_TICKS = [VALUES[32], VALUES.s, VALUES.e, VALUES.q];
const MELODIES = {
  torah: { info: 'trope-torah', key: 'A', rows: 41, extra: [], motifs: 'data/trope/trope_motifs.json', label: 'Torah',
    // Every F, C and G is written with its ♯ or ♮ (the key signature makes a bare one ambiguous);
    // G♮ (the lowered seventh) is the chart's only chromatic note.
    spell: { F: ['♯'], C: ['♯'], G: ['♯', '♮'], A: [''], B: [''], D: [''], E: [''] },
    rule: 'in the Torah chart write every F, C and G with its ♯ or ♮ (G♮ is the only natural); no other accidental is printed' },
  highholiday: { info: 'trope-hh', key: 'C', rows: 33, extra: ['20b'], motifs: 'data/trope/trope_motifs_hh.json', label: 'High Holiday',
    // No signature: B♭ (the lowered seventh) and F♯ (telisha ketana's raised fourth) are its accidentals.
    spell: { A: [''], B: ['', '♭'], C: [''], D: [''], E: [''], F: ['', '♯'], G: [''] },
    rule: 'the High Holiday chart prints only B♭ and F♯' },
  // The Haftarah rows (section H) are not from the book: an unverified rendering from memory, in D minor
  // written with F major's one flat, so every B carries its sign and nothing else is altered (a C♯ would be
  // spelled D♭ by the tutor's pitch model). Its motif file (the tutor's Learn cards) is DERIVED from the rows
  // on every run (`derived`), never hand-edited — each entry verified:false while its row carries
  // [unverified] — and there are no examples: the census reads no Nevi'im text.
  haftarah: { info: 'trope-haftarah', key: 'F', rows: 36, extra: [], motifs: 'data/trope/trope_motifs_haftarah.json', derived: true, label: 'Haftarah', examples: false,
    spell: { A: [''], B: ['♭', '♮'], C: [''], D: [''], E: [''], F: [''], G: [''] },
    rule: 'the Haftarah rows write every B with its ♭ or ♮ and no other accidental' },
};
const INFO_TO_MELODY = Object.fromEntries(Object.entries(MELODIES).map(([m, d]) => [d.info, m]));
const TAGS = new Set(['aliyah-end', 'unverified', 'derived']);   // [derived]: a row not printed but read off a printed one (its number + a letter) — checked below
const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const ACC = { '': 0, '♯': 1, '♭': -1, '♮': 0 };
const P_MIN = -16, P_MAX = 6;   // G3 … F5: the charts' whole range

const SYL_RE = /^([A-Z][A-Z']*)(-?)$/;
const NOTE_RE = /^(\d+\{)?(~~|~=|~|=)?([A-G])([♯♭♮]?)(\d)\(([^)]*)\)(\})?$/;
const REST_RE = /^(\d+\{)?rest\(([^)]*)\)(\})?$/;

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
  const hm = lines[0].text.trim().match(/^#(\d+[a-z]?)((?:\s+\[[^\]]*\])*)\s*(.*)$/);
  if (!hm) { fail(`${where(lines[0].line)}: the first line must be "#<row> [tags] <Hebrew>"`); return null; }
  // Tags come right after the number and only as spelled in TAGS; anything bracketed or Latin after
  // them would otherwise be kept as Hebrew, and the row would silently lose its tag.
  const tags = [...hm[2].matchAll(/\[([^\]]*)\]/g)].map((x) => x[1]);
  for (const t of tags) if (!TAGS.has(t)) fail(`${where(lines[0].line)}: unknown tag [${t}] — the tags are ${[...TAGS].map((x) => `[${x}]`).join(' ')}, lowercase, right after #${hm[1]}`);
  const stray = hm[3].match(/[\[\]A-Za-z]/);
  if (stray) fail(`${where(lines[0].line)}: row #${hm[1]}'s Hebrew holds "${stray[0]}" — tags go right after #${hm[1]}, and the rest of the line is only the Hebrew as printed`);
  const row = { n: hm[1], he: hm[3].trim(), tags, notes: [], syl: [], units: [], tup: [], slur: [] };
  const spell = MELODIES[block.melody].spell;
  let tupOpen = -1, tupN = 0, slurOpen = null;
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
      let open = 0, close = false, link = '';   // open: the bracket's number (the N of N{), 0 for none
      if ((m = tok.match(NOTE_RE))) {
        const [, o, lk, letter, acc, oct, inner, c] = m;
        open = o ? parseInt(o, 10) : 0; close = !!c; link = lk || '';
        const [val, ...flags] = inner.split(',');
        if (!Object.hasOwn(VALUES, val)) { fail(`${where(ln.line)}: unknown value "${val}" in ${tok}`); continue; }
        if (!spell[letter].includes(acc))
          fail(`${where(ln.line)}: ${letter}${acc || ''}${oct} — ${MELODIES[block.melody].rule}`);
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
        open = o ? parseInt(o, 10) : 0; close = !!c;
        if (!Object.hasOwn(VALUES, val) || val === 'g') { fail(`${where(ln.line)}: bad rest value in ${tok}`); continue; }
        note.r = 1; note.v = val; note.t = VALUES[val];
      } else {
        fail(`${where(ln.line)}: cannot read "${tok}"`);
        continue;
      }
      if (!cur && !note.r) fail(`${where(ln.line)}: ${tok} comes before the first syllable (only a rest may)`);
      const idx = row.notes.length;
      if (open) {
        if (tupOpen >= 0) fail(`${where(ln.line)}: a bracket opens inside another`);
        else if (open < 3) fail(`${where(ln.line)}: ${tok} opens a bracket of ${open} — the charts print none below 3`);
        tupOpen = idx; tupN = open;
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
        if (tupOpen < 0) fail(`${where(ln.line)}: "}" closes no bracket`);
        else {
          const members = row.notes.slice(tupOpen, idx + 1);
          const written = members.reduce((a, n) => a + n.t, 0);
          const sounding = members.filter((n) => !n.r && !n.g).length;
          const N = tupN;
          if (N === 3 || N === 6) {
            // a triplet or a sextuplet: N of one plain value, sung in the time of two (or four)
            if (sounding < 2 || written % N !== 0 || !PLAIN_TICKS.includes(written / N))
              fail(`${where(ln.line)}: ${N}{ … } of ${sounding} sounding note${sounding === 1 ? '' : 's'} written as ${written} ticks — a ${N === 3 ? 'triplet' : 'sextuplet'} is at least two sounding notes whose written values add up to ${N === 3 ? 'three' : 'six'} of one value (32nds, sixteenths, eighths or quarters: ${PLAIN_TICKS.map((t) => t * N).join(', ')} ticks), sung in the time of ${N === 3 ? 'two' : 'four'}`);
            for (const n of members) n.t = n.t * 2 / 3;
          } else {
            // any other bracket: the chart's number over a run of exactly N notes, kept at their written values
            const heads = members.filter((n) => !n.g).length;
            if (sounding < 2 || heads !== N)
              fail(`${where(ln.line)}: ${N}{ … } holds ${heads} note${heads === 1 ? '' : 's'} — a bracket of ${N} groups exactly ${N} notes (grace notes aside), at least two of them sounding, and keeps their written values`);
          }
          const tp = { from: tupOpen, to: idx };
          if (N !== 3) tp.n = N;   // a plain triplet carries no number
          row.tup.push(tp);
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
  if (tupOpen >= 0) fail(`${where(block.line)}: row #${row.n} ends inside a bracket`);
  for (const n of row.notes) if (!Number.isInteger(n.t)) fail(`${where(block.line)}: row #${row.n} has a duration that is not a whole tick`);
  row._src = lines;   // for the round trip; dropped before output
  return row;
}

/* ---------- serializer (the round trip, and the report's notation) ---------- */
// The only spellings each chart's rows may use (see MELODIES[…].spell), so a row writes back as it was read.
const SPELLING = {
  torah: { 1: 'C♯', 2: 'D', 4: 'E', 6: 'F♯', 7: 'G♮', 8: 'G♯', 9: 'A', 11: 'B' },
  highholiday: { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 6: 'F♯', 7: 'G', 9: 'A', 10: 'B♭', 11: 'B' },
  haftarah: { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 10: 'B♭', 11: 'B♮' },
};
function spellPitch(p, melody) {
  const midi = p + 71, pc = ((midi % 12) + 12) % 12, oct = Math.floor(midi / 12) - 1;
  return (SPELLING[melody][pc] || `?${pc}`) + oct;
}
function noteText(row, i, melody) {
  const n = row.notes[i];
  let s = '';
  const tp = row.tup.find((t) => t.from === i);
  if (tp) s += `${tp.n || 3}{`;
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
// A mark whose name is two words may be printed on both of them: this chart prints telisha gedola
// at each end of its name (תְּ֠לִישָׁא גְּדוֹלָה֠), and such a pair is one mark. It prints zakef gadol and
// karnei parah on one word, but a doubled print of those is one mark too. Every other repeat is a
// mark of its own, in the Hebrew and in the lines alike.
const TWO_WORD_NAMES = { telisha_gedola: 'תלישא גדולה', zakef_gadol: 'זקף גדול', karnei_parah: 'קרני פרה' };
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
// A [derived] row is one the chart does not print but a reader derives from a printed row of the same
// melody — its number is that row's plus one letter — and the builder proves the derivation: the source
// exists and is printed, the derived row carries every tag of its source, and its marks are the source's
// in order with some left out, each unit kept note for note.
const derivedFrom = [];   // {m, n, from} for the report
if (!LENIENT) {
  for (const [m, mel] of Object.entries(melodies)) for (const row of mel.rows) {
    if (!row.tags.includes('derived')) continue;
    const label = MELODIES[m].label, src = row.n.match(/^(\d+)[a-z]$/);
    const from = src && mel.rows.find((r) => r.n === src[1]);
    if (!from) { fail(`${label} row #${row.n} is [derived], but there is no printed row #${src ? src[1] : '?'} to derive it from (a derived row's number is its source's plus one letter)`); continue; }
    if (from.tags.includes('derived')) { fail(`${label} row #${row.n} derives from #${from.n}, itself [derived]`); continue; }
    for (const t of from.tags) if (!row.tags.includes(t)) fail(`${label} row #${row.n} lacks its source #${from.n}'s tag [${t}]`);
    let j = 0;
    row.units.forEach((u, i) => {
      const sig = unitSignature(row, i);
      while (j < from.units.length && !(from.units[j].k === u.k && unitSignature(from, j) === sig)) j++;
      if (j >= from.units.length) fail(`${label} row #${row.n}: its ${u.k} (line ${i + 2}) is not a unit of #${from.n}, in order and note for note — a derived row is its source with units left out`);
      else j++;
    });
    derivedFrom.push({ m, n: row.n, from: from.n });
  }
}

/* ---------- figures: each mark's distinct figures, by reference ---------- */
function unitSignature(row, u) {
  const unit = row.units[u];
  const notes = row.notes.slice(unit.from, unit.to + 1).map((n) => [n.p ?? null, n.v, n.t, n.g || 0, n.r || 0, n.tie || 0, (n.a || []).join('')]);
  const syl = row.syl.filter((s) => s.unit === u).map((s) => [s.t, s.hyphen ? 1 : 0, s.from - unit.from, s.to - unit.from]);
  const tup = row.tup.filter((t) => t.to >= unit.from && t.from <= unit.to).map((t) => [t.from - unit.from, t.to - unit.from, t.n || 3]);
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
const emptyCards = () => Object.fromEntries(Object.keys(MELODIES).map((m) => [m, {}]));
function cardTable(text, path) {
  const lines = text.split('\n');
  const head = lines.findIndex((l) => /^\|\s*Mark \(tutor key\)\s*\|/.test(l));
  if (head < 0) { fail(`${path}: no section A table ("| Mark (tutor key) | Torah row | … |")`); return null; }
  // one "<label> row" column per melody, found by its heading, wherever it stands
  const heads = lines[head].split('|').slice(1, -1).map((c) => c.trim());
  const cols = [];
  for (const [m, d] of Object.entries(MELODIES)) {
    const idx = heads.indexOf(`${d.label} row`);
    if (idx < 0) fail(`${path}:${head + 1}: section A's table has no "${d.label} row" column`);
    else cols.push([m, idx]);
  }
  const cards = emptyCards();
  for (let i = head + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim());
    if (cells[0].includes('(no card)')) continue;
    const key = cells[0].split(/\s+/)[0];
    if (!TROPES.some((t) => t.key === key)) { fail(`${path}:${i + 1}: section A's "${cells[0]}" starts with no TROPES key (mark a row without a Learn card "(no card)")`); continue; }
    cols.forEach(([m, idx]) => {
      const cell = cells[idx];
      if (cell === '—') return;
      if (!/^\d+[a-z]?$/.test(cell || '')) fail(`${path}:${i + 1}: section A gives ${key} the ${MELODIES[m].label} row "${cell}" — a row number, or — for no staff`);
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
// A derived motif file (MELODIES[m].derived): the Learn-card staff of every mark section A names, reduced from
// its row exactly as the check below reduces a hand-edited file's row, so the two can never disagree. Written
// after every check has passed; `built` keeps its date while the entries are unchanged.
const derivedMotifs = {};
function deriveMotifs(m, d, cards) {
  const tropes = {};
  for (const [key, n] of Object.entries(cards)) {
    const row = melodies[m].rows.find((r) => r.n === n);
    const units = row ? row.units.filter((u) => u.k === key) : [];
    if (units.length !== 1) { fail(`${d.motifs}: ${d.label} row #${n} has ${units.length} "${key}" lines (needs exactly one)`); continue; }
    tropes[key] = { notes: reduceUnit(row, units[0]).map((w) => ({ p: w.p, d: staffD(w.t, 0) })), verified: !row.tags.includes('unverified'), source: `tropepatterns.md ${d.label} #${n}` };
  }
  const file = { v: 1, system: m, key: d.key, built: new Date().toISOString().slice(0, 10), license: `An unverified rendering of the Ashkenazi ${d.label} melody written from memory, reduced from docs/tropepatterns.md section H by scripts/build-trope-phrases.mjs (never edit this file: fix the row and re-run the builder). This file is CC BY-SA 4.0.`, tropes };
  const path = join(repoRoot, d.motifs);
  if (existsSync(path)) {
    try {
      const old = JSON.parse(readFileSync(path, 'utf8'));
      if (old.built && JSON.stringify({ ...file, built: old.built }) === JSON.stringify(old)) file.built = old.built;
    } catch { /* unreadable old file: rebuild */ }
  }
  derivedMotifs[m] = file;
  return file;
}
if (!LENIENT) {
  const cards = cardTable(docText, DOC_PATH.replace(repoRoot + '/', '')) || emptyCards();
  for (const [m, d] of Object.entries(MELODIES)) {
    if (!d.motifs) continue;
    const file = d.derived ? deriveMotifs(m, d, cards[m]) : JSON.parse(readFileSync(join(repoRoot, d.motifs), 'utf8'));
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
      // a checked transcription is verified:true; a derived entry follows its row's [unverified] tag
      const rowOf = melodies[m].rows.find((r) => r.n === cards[m][key]);
      if (rowOf && rowOf.tags.includes('derived')) { bad(`section A reads this staff from ${d.label} row #${rowOf.n}, a [derived] row — name the printed row it comes from`); continue; }
      const wantVerified = !(d.derived && rowOf && rowOf.tags.includes('unverified'));
      if (entry.verified !== wantVerified) { bad(wantVerified ? `verified is ${JSON.stringify(entry.verified)} — every staff is a checked transcription (verified: true)` : `verified is ${JSON.stringify(entry.verified)}, but ${d.label} row #${cards[m][key]} is tagged [unverified]`); continue; }
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
        rec.status = (dep ? 'match (documented departure)' : d.derived ? 'derived from the row' : 'match') + (drawn ? ` — ${drawn} drawn at the nearest value` : '');
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
  // Per melody: the marks its chart leaves out (geresh muqdam has a figure nowhere), its key, its sounding
  // range (semitones from B4) and its closing rows with the verse endings they close. The Haftarah rows draw
  // a whole haftarah on their own (the Trainer never falls back to the Torah chart for them).
  const FOUR_ENDINGS = ['mercha tipcha mercha sof_pasuk', 'mercha tipcha sof_pasuk', 'tipcha mercha sof_pasuk', 'tipcha sof_pasuk'];
  const SMOKE = {
    torah: { missing: ['geresh_muqdam'], key: 'A', range: [-14, 0], ends: ['41'], endings: [FOUR_ENDINGS[0]] },
    highholiday: { missing: ['geresh_muqdam', 'karnei_parah', 'mercha_kefula', 'shalshelet', 'yerach_ben_yomo'], key: 'C', range: [-16, -1], ends: ['30', '31', '32', '33'], endings: FOUR_ENDINGS },
    haftarah: { missing: ['geresh_muqdam'], key: 'F', range: [-14, -1], ends: ['33', '34', '35', '36'], endings: FOUR_ENDINGS },
  };
  for (const [m, want] of Object.entries(SMOKE)) {
    const rows = melodies[m].rows, label = MELODIES[m].label;
    const printed = new Set(rows.flatMap((r) => r.units.map((u) => u.k)));
    const missing = KEYS.filter((k) => !printed.has(k)).sort();
    if (missing.join(',') !== [...want.missing].sort().join(',')) fail(`smoke: the ${label} rows lack ${missing.join(', ') || 'nothing'}; expected exactly ${want.missing.join(', ')}`);
    const endRows = rows.filter((r) => r.tags.includes('aliyah-end'));
    if (endRows.map((r) => r.n).join(',') !== want.ends.join(',')) fail(`smoke: the ${label} closings are rows ${endRows.map((r) => r.n).join(', ') || '(none)'}; expected ${want.ends.join(', ')}`);
    const endings = endRows.map((r) => r.units.map((u) => u.k).join(' ')).sort();
    if (endings.join('|') !== [...want.endings].sort().join('|')) fail(`smoke: the ${label} closings end ${endings.join(' | ') || '(none)'}; expected ${want.endings.join(' | ')}`);
    if (MELODIES[m].key !== want.key) fail(`smoke: the ${label} chart is written in ${want.key}, not ${MELODIES[m].key}`);
    for (const r of rows) for (const n of r.notes) if (!n.r && (n.p < want.range[0] || n.p > want.range[1])) fail(`smoke: ${label} row #${r.n} leaves ${spellPitch(want.range[0], m)}–${spellPitch(want.range[1], m)}`);
  }
}

/* ---------- JSON (one row per line, so a diff shows the row that changed) ---------- */
const clean = (row) => { const { _src, ...r } = row; return r; };
function serialize(built) {
  const head = { v: 1, built, license: LICENSE, source: 'docs/tropepatterns.md, sections B, C and H', tpq: TPQ, values: VALUES };
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
  L.push('- **Source:** `docs/tropepatterns.md` sections B and C — the printed chart\'s rows, transcribed from clean scans — and H, the Haftarah rows (unverified: written from memory of the commonly taught melody)');
  L.push(`- **Output:** \`data/trope/trope_phrases.json\` — ${bytes.toLocaleString('en-US')} bytes (budget ${SIZE_BUDGET.toLocaleString('en-US')})`);
  L.push(`- **Rows:** ${Object.entries(MELODIES).map(([m, d]) => `${d.label} ${melodies[m].rows.length} (${total(m)} notes)`).join(' · ')}`);
  if (derivedFrom.length) L.push(`- **Derived rows** (not printed: a printed row with units left out, each kept note for note): ${derivedFrom.map((x) => `${MELODIES[x.m].label} ${x.n} from ${x.from}`).join(', ')}`);
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

// A cleaned verse -> its sung words [{text, line, paseq, parts}], unmarked ones included. `parts` counts
// the word's maqaf-joined pieces: PocketTorah times each piece, so a word takes that many timing slots.
// stats (optional) collects what the rules had to decide.
function verseWords(text, stats) {
  const words = [];
  for (const t of text.split(' ').filter(Boolean)) {
    if (t === PASEQ_TOKEN) { if (words.length) words[words.length - 1].paseq = true; else if (stats) stats.anomalies.push('a paseq opens a verse'); continue; }
    if (t === '׀') { if (words.length) words[words.length - 1].line = true; else if (stats) stats.anomalies.push('a legarmeh line opens a verse'); continue; }
    if (!/[א-ת]/.test(t)) continue;
    const bare = t.replace(/׀/g, '');
    words.push({ text: bare, line: t.includes('׀'), parts: bare.split('־').filter((x) => /[א-ת]/.test(x)).length });
  }
  return words;
}
// A verse -> [{k, word, w, withinWord}] units, w indexing verseWords' list.
function verseUnits(text, stats, ref) {
  const words = verseWords(text, stats);
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

/* ---------- real examples of every row, for the Trope Tutor's Phrases tab (with --census) ----------
   A row's example is a run of consecutive words in one verse that carry the row's marks, one mark per
   word, in order, with no pause (paseq or legarmeh line) inside it. It is complete when no connecting
   mark leads into it (the word before is not a conjunctive), so an ending such as tipcha etnachta is
   not taken out of a longer phrase. An [aliyah-end] row's run ends an aliyah; no other row's does.
   - Year-round rows search the whole Torah and keep PocketTorah's timing of the words, so the tutor
     can play the recording: a run starts at its first word's onset and ends at the next word's (an
     aliyah's last word has none: e is null and the recording plays out). A run whose onsets step
     backwards, repeat, or wait longer than GAP_MAX (a timing slip) is dropped, and so is every run in
     a verse TIMING_SLIPS lists. Complete runs are preferred; a row with none (mercha kefula, yerach
     ben yomo) takes any.
   - High Holiday rows search the four Rosh Hashanah and Yom Kippur readings and keep only the words:
     PocketTorah has no recording in that melody. Complete runs only.
   Picks spread over books, then parshiyot (the readings, for High Holiday rows), preferring a typical
   length. */
const EXAMPLES_PER_ROW = 4;
const EXAMPLES_BUDGET = 64 * 1024;
const GAP_MAX = 4, GAP_MAX_RARE = 10;   // seconds from one word onset to the next (10 where a rare mark is sung)
const EXAMPLES_LICENSE = "Real examples of docs/tropepatterns.md's rows: Hebrew words from the Miqra according to the Masorah edition (Sefaria's export; Sefaria lists it as CC BY-SA), clip times from PocketTorah's word timings (c) Russel Neiss & Rabbi Charlie Schwartz (CC BY-SA 4.0). This file is CC BY-SA 4.0.";
// The High Holiday readings' aliyah ends: the weekday and Shabbat divisions together, from @hebcal/leyning
// 10.0.0's holiday readings (Yom Kippur afternoon: the traditional reading, ending at 18:30).
const HH_ALIYAH_ENDS = {
  'rosh-hashanah-1': ['21:4', '21:8', '21:12', '21:17', '21:21', '21:27', '21:34'],
  'rosh-hashanah-2': ['22:3', '22:8', '22:14', '22:19', '22:24'],
  'yom-kippur': ['16:3', '16:6', '16:11', '16:17', '16:24', '16:30', '16:34'],
  'yom-kippur-mincha': ['18:5', '18:21', '18:30'],
};
// The aliyot whose word and timing counts still differ, and the five onsets known to step backwards or
// repeat (each must fail the gap rule, so no example spans one).
const EXPECTED_UNALIGNED = ["Beha'alotcha 5", 'Nasso 6', 'Tetzaveh 3'];
const KNOWN_TIMING_GLITCHES = [['Shemot', '5', 53], ['Shemot', '7', 188], ['Tetzaveh', '1', 203], ['Nasso', '4', 557], ['Eikev', '3', 66]];

/* ---------- --audit-audio: are the taps where the recording says? (with --census) ----------
   A timing file can slip by a word for a stretch and slip back later (an extra tap in one place, a
   missing one in another), so its count still matches the words and only the recording can tell.
   Nearly every verse opens after a pause, and a tap well placed for a verse's first word sits right
   beside it (just before the pause or just after it, as each tapper worked). A verse start whose own
   tap is in singing while the tap before or after it sits beside the pause has slipped. A run of verse
   starts that slipped or are unclear, at least one of them slipped, marks its verses, from the verse
   before the run to the run's last; runs at most SLIP_JOIN verses apart join. The marked verses are
   TIMING_SLIPS, and no example is taken from them: --audit-audio fails unless the table is exactly what
   it hears. It downloads each recording once, decodes it with mpg123-decoder (npm install it, as for
   build-trope-motifs.mjs) and keeps only a 10 ms loudness envelope in source-data/trope-cache/audio-env/. */
const TIMING_SLIPS = {
  'Noach 6': ['10:16-10:17'],
  'Vayera 3': ['19:7-19:18'],
  'Vayera 4': ['19:38-20:1'],
  'Vayera 5': ['21:11-21:12'],
  'Vayishlach 5': ['34:30-34:31'],
  'Vayishlach 6': ['35:16-35:17', '35:28-35:29'],
  'Vayishlach 7': ['36:35-36:36'],
  'Vayeshev 3': ['37:26-37:27'],
  'Vayeshev 4': ['38:24-38:25'],
  'Vayigash 3': ['45:14-45:15'],
  'Shemot 1': ['1:5-1:6'],
  'Shemot 5': ['3:18-3:19'],
  "Va'eira 5": ['8:11-8:12'],
  'Tetzaveh 1': ['28:4-28:11'],
  'Shemini 6': ['11:8-11:32'],
  'Bamidbar 3': ['2:12-2:13', '2:25-2:32'],
  'Nasso 5': ['7:11-7:14'],
};
const AUDIO_ENV_DIR = join(CACHE_DIR, 'audio-env');
const AUDIT_NEAR = 0.35;   // seconds either side of a tap
// Loudness on the recording's own scale: 0 is its median, -1 its 5th percentile.
const AUDIT_OK = -0.55, AUDIT_SUNG = -0.35, AUDIT_PAUSE = -0.6;
const SLIP_JOIN = 3;
const inSlip = (id, c, v) => (TIMING_SLIPS[id] || []).some((r) => {
  const [a, b] = r.split('-').map((x) => x.split(':').map(Number)), k = c * 1000 + v;
  return k >= a[0] * 1000 + a[1] && k <= b[0] * 1000 + b[1];
});
async function audioEnvelope(decoder, id, url) {
  const path = join(AUDIO_ENV_DIR, `${id.replace(/[^A-Za-z0-9]+/g, '_')}.json`);
  if (existsSync(path)) {
    const rec = JSON.parse(readFileSync(path, 'utf8'));
    if (rec.url === url) return rec;
  }
  mkdirSync(AUDIO_ENV_DIR, { recursive: true });
  const mp3 = `${path}.mp3`;
  for (let i = 0; ; i++) {
    try { execFileSync('curl', ['-sS', '--fail', '--max-time', '300', '-o', mp3, url]); break; }
    catch { if (i === 3) throw new Error(`could not download ${url}`); await new Promise((r) => setTimeout(r, 2000 * 2 ** i)); }
  }
  await decoder.reset();
  const { channelData, sampleRate } = decoder.decode(new Uint8Array(readFileSync(mp3)));
  unlinkSync(mp3);
  const d = channelData[0], hop = Math.round(sampleRate / 100), env = new Int8Array(Math.floor(d.length / hop));
  for (let f = 0; f < env.length; f++) {
    let sum = 0;
    for (let i = f * hop; i < (f + 1) * hop; i++) sum += d[i] * d[i];
    env[f] = Math.max(-127, Math.round(10 * Math.log10(sum / hop + 1e-13)));
  }
  const rec = { url, env: Buffer.from(env.buffer).toString('base64') };
  writeFileSync(path, JSON.stringify(rec));
  return rec;
}
// Each verse start after the aliyah's first: 'ok', '+1' (the pause sits by the next tap: the taps run a
// word early), '-1' (by the tap before: a word late) or '?'.
function tapVerdicts(al, env) {
  const sorted = Int8Array.from(env).sort();
  const med = sorted[sorted.length >> 1], scale = Math.max(3, med - sorted[Math.floor(sorted.length * 0.05)]);
  const near = (t) => {   // the quietest 100 ms within AUDIT_NEAR of t
    const f0 = Math.max(0, Math.round((t - AUDIT_NEAR) * 100)), f1 = Math.min(env.length, Math.round((t + AUDIT_NEAR) * 100));
    let lo = Infinity;
    for (let g = f0; g + 10 <= f1; g++) { let sum = 0; for (let k = g; k < g + 10; k++) sum += env[k]; lo = Math.min(lo, sum / 10); }
    return lo === Infinity ? 0 : (lo - med) / scale;
  };
  return al.verses.slice(1).map((vs) => {
    const b = vs.slots[0];
    const [before, at, after] = [b - 1, b, b + 1].map((k) => (k >= 1 && k < al.t.length ? near(al.t[k]) : 0));
    if (at <= AUDIT_OK) return 'ok';
    if (at >= AUDIT_SUNG && after <= AUDIT_PAUSE) return '+1';
    if (at >= AUDIT_SUNG && before <= AUDIT_PAUSE) return '-1';
    return '?';
  });
}
function slipRanges(al, verdicts) {
  const ranges = [];   // [first, last] indices into al.verses
  for (let i = 0; i < verdicts.length;) {
    if (verdicts[i] === 'ok') { i++; continue; }
    let j = i;
    while (j + 1 < verdicts.length && verdicts[j + 1] !== 'ok') j++;
    if (verdicts.slice(i, j + 1).some((x) => x !== '?')) {
      const prev = ranges[ranges.length - 1];   // verdicts[i] is the start of al.verses[i + 1]
      if (prev && i - prev[1] <= SLIP_JOIN + 1) prev[1] = j + 1; else ranges.push([i, j + 1]);
    }
    i = j + 1;
  }
  return ranges.map(([f, l]) => `${al.verses[f].c}:${al.verses[f].v}-${al.verses[l].c}:${al.verses[l].v}`);
}
async function auditAudio(aligned, manifest, cf) {
  let MPEGDecoder;
  try { ({ MPEGDecoder } = await import('mpg123-decoder')); }
  catch { die('--audit-audio needs mpg123-decoder: npm install mpg123-decoder (node_modules/ and package*.json are gitignored)'); }
  const base = (readRepo('trope_tutor.html').match(/const POCKET_AUDIO_BASE = '([^']+)'/) || [])[1];
  if (!base) die("--audit-audio: trope_tutor.html's POCKET_AUDIO_BASE was not found");
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const found = {}, tally = { ok: 0, '+1': 0, '-1': 0, '?': 0 };
  let n = 0;
  for (const al of aligned) {
    let rec;
    try { rec = await audioEnvelope(decoder, al.id, base + encodeURIComponent(`${manifest[al.p].audioBase}-${al.a}.mp3`)); }
    catch (e) { cf.push(`--audit-audio: ${e.message}`); continue; }
    const buf = Buffer.from(rec.env, 'base64');
    const verdicts = tapVerdicts(al, new Int8Array(buf.buffer, buf.byteOffset, buf.length));
    for (const x of verdicts) tally[x]++;
    const r = slipRanges(al, verdicts);
    if (r.length) found[al.id] = r;
    if (++n % 50 === 0) console.log(`  --audit-audio: ${n} of ${aligned.length} recordings`);
  }
  decoder.free();
  const show = (o) => aligned.filter((al) => o[al.id]).map((al) => `  ${JSON.stringify(al.id)}: [${o[al.id].map((x) => `'${x}'`).join(', ')}],`).join('\n');
  if (show(found) !== show(TIMING_SLIPS)) cf.push(`--audit-audio: TIMING_SLIPS is not what the recordings show; they show:\n${show(found)}`);
  if (found['Bereshit 1']) cf.push('--audit-audio: Bereshit 1, whose taps are known good, was heard slipping (the thresholds have drifted)');
  console.log(`build-trope-phrases --audit-audio: ${n} recordings; verse starts ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(', ')}; ${Object.values(found).flat().length} slipped stretches in ${Object.keys(found).length} aliyot`);
}
const round2 = (x) => Math.round(x * 100) / 100;
const cmpTuple = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1; return 0; };

// Up to EXAMPLES_PER_ROW of the ranked candidates: new books first (for High Holiday rows, new
// readings), then new parshiyot, then any — returned in text order.
function spreadPick(ranked, passes, order) {
  const chosen = [];
  const seen = passes.map(() => new Set());
  for (let pi = 0; pi < passes.length && chosen.length < EXAMPLES_PER_ROW; pi++) {
    for (const c of ranked) {
      if (chosen.length >= EXAMPLES_PER_ROW) break;
      if (chosen.includes(c)) continue;
      if (passes[pi] && seen[pi].has(passes[pi](c))) continue;
      chosen.push(c);
      passes.forEach((f, i) => { if (f) seen[i].add(f(c)); });
    }
  }
  return chosen.sort((a, b) => cmpTuple(order(a), order(b)));
}

async function buildExamples({ texts, parshiyot, aliyotOf, firstVerse, verseUnitsCache, hhReadings, cf }) {
  const manifest = JSON.parse(readRepo('data/pockettorah/manifest.json'));
  const rare = new Set(TROPES.filter((t) => t.rare).map((t) => t.key));
  // one verse: every sung word (marked or not, each takes its timing slots) and each word's marks
  const verseOf = (book, c, v) => {
    const raw = (texts[book][c - 1] || [])[v - 1];
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const ref = `${book} ${c}:${v}`, units = verseUnitsCache[ref] || null;   // none: a double-accented verse
    const words = verseWords(cleanVerseText(raw), null);
    const keys = words.map(() => []);
    if (units) for (const u of units) keys[u.w].push(u.k);
    return { ref, c, v, words, keys, marked: !!units };
  };
  // runs of the row's marks K in one verse -> [{j, complete}]
  const runsIn = (vs, K, endsAliyahVerse, aliyahEnd) => {
    const out = [];
    if (!vs.marked) return out;
    for (let j = 0; j + K.length <= vs.words.length; j++) {
      let hit = true;
      for (let q = 0; q < K.length && hit; q++) {
        const ks = vs.keys[j + q], w = vs.words[j + q];
        if (ks.length !== 1 || ks[0] !== K[q]) hit = false;
        else if (q < K.length - 1 && (w.paseq || (w.line && ks[0] !== 'munach_legarmeh'))) hit = false;   // a pause inside the run
      }
      if (!hit) continue;
      if ((endsAliyahVerse && j + K.length === vs.words.length) !== aliyahEnd) continue;
      const pk = j > 0 ? vs.keys[j - 1] : [];
      out.push({ j, complete: !pk.length || !CONJUNCTIVE.has(pk[pk.length - 1]) });
    }
    return out;
  };
  const wordsOfRun = (vs, j, n) => vs.words.slice(j, j + n).map((w) => w.text + (w.line ? ' ׀' : '')).join(' ');

  // PocketTorah's aliyot, each word given its first timing slot (a maqaf-joined word takes one per piece)
  const aligned = [], unaligned = [];
  parshiyot.forEach((p, pi) => {
    const al = aliyotOf.get(firstVerse(p.ref));
    if (!al) return;   // the census has already failed on it
    const m = manifest[p.pocket];
    for (const x of al.fullkriyah.aliyah.filter((y) => /^[1-7]$/.test(y._num))) {
      const id = `${p.pocket} ${x._num}`;
      const label = m && !(m.missing || []).includes(x._num) && m.labels && m.labels[x._num];
      if (!label) { unaligned.push({ id, why: 'no recording' }); continue; }
      const [bc, bv] = x._begin.split(':').map(Number), [ec, ev] = x._end.split(':').map(Number);
      const verses = [];
      let slot = 0, ok = true;
      for (let c = bc; c <= ec && ok; c++) {
        const n = (texts[p.book][c - 1] || []).length;
        for (let v = c === bc ? bv : 1; v <= (c === ec ? ev : n); v++) {
          const vs = verseOf(p.book, c, v);
          if (!vs) { ok = false; break; }
          vs.slots = vs.words.map((w) => { const s0 = slot; slot += w.parts; return s0; });
          verses.push(vs);
        }
      }
      if (!ok || !verses.length) { unaligned.push({ id, why: 'verse range unresolved' }); continue; }
      let t = readFileSync(join(repoRoot, 'data', 'pockettorah', 'timings', label), 'utf8')
        .trim().split(',').map(parseFloat).filter((n) => !isNaN(n));
      if (t.length > 1 && t[0] === 0 && t.length === slot + 1) t = t.slice(0, -1);   // a trailing end marker (the index builder's rule)
      if (t.length !== slot) { unaligned.push({ id, why: `${slot} words vs ${t.length} timings` }); continue; }
      aligned.push({ id, p: p.pocket, a: x._num, pi, book: p.book, verses, t });
    }
  });
  if (AUDIT_AUDIO) await auditAudio(aligned, manifest, cf);

  let gapRejects = 0, slipRejects = 0;
  const torah = melodies.torah.rows.map((row) => {
    const K = row.units.map((u) => u.k), isEnd = row.tags.includes('aliyah-end');
    const cap = K.some((k) => rare.has(k)) ? GAP_MAX_RARE : GAP_MAX;
    const cands = [];
    for (const al of aligned) al.verses.forEach((vs, vi) => {
      const slipped = inSlip(al.id, vs.c, vs.v);
      for (const r of runsIn(vs, K, vi === al.verses.length - 1, isEnd)) {
        if (slipped) { slipRejects++; continue; }
        const last = r.j + K.length - 1;
        const s0 = vs.slots[r.j], s1 = vs.slots[last] + vs.words[last].parts;   // the run's slots are [s0, s1)
        let slip = false;
        for (let n = s0; n < s1 && n + 1 < al.t.length && !slip; n++) {
          const gap = al.t[n + 1] - al.t[n];
          if (gap <= 0 || gap > cap) slip = true;
        }
        if (slip) { gapRejects++; continue; }
        const s = al.t[s0], e = isEnd ? null : al.t[s1];
        cands.push({ p: al.p, a: al.a, pi: al.pi, book: al.book, ref: vs.ref, he: wordsOfRun(vs, r.j, K.length),
          s, e, dur: (e ?? al.t[s1 - 1]) - s, slot: s0, complete: r.complete });
      }
    });
    const complete = cands.filter((c) => c.complete);
    const pool = complete.length ? complete : cands;
    const durs = pool.map((c) => c.dur).sort((x, y) => x - y);
    const med = durs.length ? durs[Math.floor((durs.length - 1) / 2)] : 0;
    const ranked = pool.slice().sort((x, y) => cmpTuple(
      [x.dur < 0.6 * med ? 1 : 0, x.dur > 1.3 * med ? 1 : 0, Math.abs(x.dur - 0.85 * med), x.pi, +x.a, x.slot],
      [y.dur < 0.6 * med ? 1 : 0, y.dur > 1.3 * med ? 1 : 0, Math.abs(y.dur - 0.85 * med), y.pi, +y.a, y.slot]));
    const chosen = spreadPick(ranked, [(c) => c.book, (c) => c.pi, null], (c) => [c.pi, +c.a, c.slot]);
    return { n: row.n, k: K.join(' '), matches: cands.length, complete: complete.length, cands, chosen,
      ex: chosen.map((c) => ({ p: c.p, a: c.a, ref: c.ref, he: c.he, s: round2(c.s), e: c.e === null ? null : round2(c.e) })) };
  });

  const highholiday = melodies.highholiday.rows.map((row) => {
    const K = row.units.map((u) => u.k), isEnd = row.tags.includes('aliyah-end');
    const cands = [];
    let matches = 0;
    hhReadings.forEach((r, ri) => {
      const ends = new Set(HH_ALIYAH_ENDS[r.key] || []);
      for (let c = r.from[0]; c <= r.to[0]; c++) {
        const vTo = c === r.to[0] ? r.to[1] : (texts[r.book][c - 1] || []).length;
        for (let v = c === r.from[0] ? r.from[1] : 1; v <= vTo; v++) {
          const vs = verseOf(r.book, c, v);
          if (!vs) continue;
          for (const m of runsIn(vs, K, ends.has(`${c}:${v}`), isEnd)) {
            matches++;
            if (m.complete) cands.push({ ri, c, v, j: m.j, ref: vs.ref, he: wordsOfRun(vs, m.j, K.length) });
          }
        }
      }
    });
    const ranked = cands.slice().sort((x, y) => cmpTuple([x.ri, x.c, x.v, x.j], [y.ri, y.c, y.v, y.j]));
    const chosen = spreadPick(ranked, [(c) => c.ri, null], (c) => [c.ri, c.c, c.v, c.j]);
    return { n: row.n, k: K.join(' '), matches, complete: cands.length, chosen, ex: chosen.map(({ ref, he }) => ({ ref, he })) };
  });

  // smoke tests
  const ids = unaligned.map((u) => u.id).sort();
  if (aligned.length !== 375 || JSON.stringify(ids) !== JSON.stringify(EXPECTED_UNALIGNED))
    cf.push(`examples: ${aligned.length} aliyot align (expected 375); not aligned: ${unaligned.map((u) => `${u.id} (${u.why})`).join(', ')}`);
  const row1 = torah.find((r) => r.n === '1'), row2 = torah.find((r) => r.n === '2');
  const gen13 = row1 && row1.cands.find((c) => c.ref === 'Genesis 1:3');
  if (!gen13 || gen13.p !== 'Bereshit' || gen13.a !== '1' || !gen13.complete || round2(gen13.s) !== 23.6 || round2(gen13.e) !== 26.3
      || gen13.he !== 'וַיֹּ֥אמֶר אֱלֹהִ֖ים יְהִ֣י א֑וֹר')
    cf.push(`examples: row 1 should find Genesis 1:3 (Bereshit 1, 23.60–26.30 s, complete); found ${JSON.stringify(gen13 || null)}`);
  if (!row2 || !row2.cands.some((c) => c.ref === 'Genesis 1:1' && c.complete)) cf.push('examples: row 2 should find Genesis 1:1');
  for (const [id, ranges] of Object.entries(TIMING_SLIPS)) {
    const al = aligned.find((x) => x.id === id);
    if (!al) { cf.push(`TIMING_SLIPS names ${id}, which does not align`); continue; }
    const at = (c, v) => al.verses.findIndex((vs) => vs.c === c && vs.v === v);
    for (const r of ranges) {
      const m = r.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
      if (!m || at(+m[1], +m[2]) < 0 || at(+m[3], +m[4]) < at(+m[1], +m[2])) cf.push(`TIMING_SLIPS ${id} ${r} is not a verse range inside that aliyah`);
    }
  }
  if (!inSlip('Shemini 6', 11, 9)) cf.push('TIMING_SLIPS should cover Shemini 6 at Leviticus 11:9, where the taps run a word early');
  for (const [p, a, idx] of KNOWN_TIMING_GLITCHES) {
    const al = aligned.find((x) => x.p === p && x.a === a);
    if (!al || !(al.t[idx + 1] - al.t[idx] <= 0)) cf.push(`examples: the known timing slip ${p} ${a} at ${idx} is ${al ? 'not a backward or repeated onset' : 'in an aliyah that did not align'}`);
  }
  for (const r of torah) {
    const isEnd = r.n === '41';
    if (!r.ex.length) cf.push(`examples: Torah row #${r.n} (${r.k}) has no example`);
    const pool = r.complete ? r.cands.filter((c) => c.complete) : r.cands;
    if (new Set(pool.map((c) => c.book)).size >= EXAMPLES_PER_ROW && new Set(r.chosen.map((c) => c.book)).size < EXAMPLES_PER_ROW)
      cf.push(`examples: Torah row #${r.n} has candidates in ${new Set(pool.map((c) => c.book)).size} books but picks fewer`);
    for (const x of r.ex) {
      if ((x.e === null) !== isEnd) cf.push(`examples: Torah row #${r.n} ${x.ref} has e ${x.e} (only the end-of-aliyah row plays to the recording's end)`);
      if (x.e !== null && !(x.s >= 0 && x.s < x.e && x.e - x.s <= 12)) cf.push(`examples: Torah row #${r.n} ${x.ref} runs ${x.s}–${x.e} s`);
      if (!manifest[x.p] || !manifest[x.p].labels[x.a]) cf.push(`examples: Torah row #${r.n} ${x.ref} names ${x.p} ${x.a}, not in the manifest`);
    }
  }
  const row40 = torah.find((r) => r.n === '40');
  if (!row40 || row40.ex.length !== 1 || row40.ex[0].ref !== 'Numbers 35:5') cf.push(`examples: Torah row #40 should have exactly Numbers 35:5, has ${JSON.stringify(row40 && row40.ex.map((x) => x.ref))}`);
  const hhKeys = hhReadings.map((r) => r.key).sort().join(','), endKeys = Object.keys(HH_ALIYAH_ENDS).sort().join(',');
  if (hhKeys !== endKeys) cf.push(`examples: HH_ALIYAH_ENDS names ${endKeys}, the readings are ${hhKeys}`);
  for (const r of hhReadings) {
    const ends = HH_ALIYAH_ENDS[r.key] || [];
    if (!ends.includes(`${r.to[0]}:${r.to[1]}`)) cf.push(`examples: ${r.key}'s last verse ${r.to.join(':')} is not among its aliyah ends`);
    for (const e of ends) { const [c, v] = e.split(':').map(Number); if (c * 1000 + v < r.from[0] * 1000 + r.from[1] || c * 1000 + v > r.to[0] * 1000 + r.to[1]) cf.push(`examples: ${r.key} aliyah end ${e} lies outside the reading`); }
  }
  const keyOf = (row) => row.units.map((u) => u.k).join(' ');
  for (const [m, list] of [['torah', torah], ['highholiday', highholiday]])
    if (list.map((r) => `${r.n}:${r.k}`).join('|') !== melodies[m].rows.map((row) => `${row.n}:${keyOf(row)}`).join('|'))
      cf.push(`examples: the ${m} rows do not follow the chart's rows`);
  return { torah, highholiday, aligned: aligned.length, unaligned, gapRejects, slipRejects };
}
function serializeExamples(built, ex) {
  const head = { v: 1, built, license: EXAMPLES_LICENSE, source: "docs/tropepatterns.md's rows; the words from Sefaria's MAM export; the clip times from PocketTorah's word timings" };
  let s = JSON.stringify(head).slice(0, -1) + ',"melodies":{\n';
  s += [['torah', ex.torah], ['highholiday', ex.highholiday]].map(([m, rows]) =>
    `${JSON.stringify(m)}:[\n` + rows.map((r) => JSON.stringify({ n: r.n, k: r.k, ex: r.ex })).join(',\n') + '\n]').join(',\n');
  return s + '\n}}\n';
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
  const ex = await buildExamples({ texts, parshiyot, aliyotOf, firstVerse, verseUnitsCache, hhReadings, cf });
  if (cf.length) {
    console.error(`build-trope-phrases --census: ${cf.length} problem(s):`);
    for (const f of cf) console.error(`  ✗ ${f}`);
    process.exit(1);
  }
  // The report's own date, kept while its content is unchanged (like `built` in the JSON). The caller
  // writes it, after the JSON and the phrases report.
  let exBuilt = today;
  if (existsSync(EXAMPLES_PATH)) {
    const old = readFileSync(EXAMPLES_PATH, 'utf8');
    const m = old.match(/^\{"v":1,"built":"(\d{4}-\d{2}-\d{2})"/);
    if (m && serializeExamples(m[1], ex) === old) exBuilt = m[1];
  }
  const examples = serializeExamples(exBuilt, ex);
  if (Buffer.byteLength(examples) > EXAMPLES_BUDGET) {
    console.error(`build-trope-phrases --census: trope_phrase_examples.json is ${Buffer.byteLength(examples)} bytes, over its ${EXAMPLES_BUDGET}-byte budget`);
    process.exit(1);
  }
  const args = { tor, hh, pTorah, pHH, endings, otherEndings, otherEnds, hhReadings, hhVerses, digest: jsonDigest,
    ex, exBytes: Buffer.byteLength(examples) };
  let reportBuilt = today;
  if (existsSync(CENSUS_PATH)) {
    const old = readFileSync(CENSUS_PATH, 'utf8');
    const m = old.match(/^- \*\*Built:\*\* (\d{4}-\d{2}-\d{2})$/m);
    if (m && censusReport({ ...args, built: m[1] }) + '\n' === old) reportBuilt = m[1];
  }
  return { text: censusReport({ ...args, built: reportBuilt }) + '\n', verses: tor.verses, marks: tor.units, examples,
    exRows: ex.torah.length + ex.highholiday.length, exCount: [...ex.torah, ...ex.highholiday].reduce((a, r) => a + r.ex.length, 0) };
}

function censusReport({ tor, hh, pTorah, pHH, endings, otherEndings, otherEnds, hhReadings, hhVerses, digest, built, ex, exBytes }) {
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
  L.push(`- **Chart:** \`data/trope/trope_phrases.json\` (sha1 ${digest}), built from \`docs/tropepatterns.md\` sections B, C and H`);
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
  L.push('## Real examples for the Phrases tab', '');
  L.push(`\`data/trope/trope_phrase_examples.json\` (${fmt(exBytes)} bytes) gives each chart row up to ${EXAMPLES_PER_ROW} places where the Torah`,
    'sings it: a run of consecutive words carrying the row\'s marks, one mark per word and in order, with no pause (paseq',
    'or legarmeh line) inside it. A run is *complete* when no connecting mark leads into it, so an ending such as tipcha',
    'etnachta is not lifted out of a longer phrase; complete runs are preferred. An end-of-aliyah row\'s run ends an',
    'aliyah; no other row\'s does. Double-accented verses are left out.', '');
  L.push(`- **Year-round rows:** the whole Torah, timed by PocketTorah's word timings (\`data/pockettorah/timings\`). ${fmt(ex.aligned)} of the`,
    `  ${fmt(ex.aligned + ex.unaligned.length)} aliyot align word for word; not aligned: ${ex.unaligned.map((u) => `${u.id} (${u.why})`).join(', ') || 'none'}.`,
    '  A clip starts at its first word\'s onset and ends at the next word\'s (an aliyah\'s last word has none: the',
    `  clip plays out the recording). ${fmt(ex.gapRejects)} runs were dropped for a timing slip: an onset that steps back, repeats, or`,
    `  comes more than ${GAP_MAX} s after the one before (${GAP_MAX_RARE} s where a rare mark is sung), and ${fmt(ex.slipRejects)} more`,
    '  for lying where the taps slip by a word for a stretch while the count still matches (an extra tap in one place,',
    '  a missing one in another). `--audit-audio` finds those stretches by listening for the pause before each verse:',
    `  ${Object.entries(TIMING_SLIPS).map(([id, rs]) => `${id} ${rs.map((r) => r.replace('-', '–')).join(', ')}`).join('; ') || 'none'}.`,
    '  Picks spread over books, then parshiyot, preferring a typical length; a row with no complete run takes any.');
  L.push(`- **High Holiday rows:** the four readings above, words only (PocketTorah has no recording in that melody).`,
    `  Complete runs only. Aliyah ends (the weekday and Shabbat divisions together): ${Object.entries(HH_ALIYAH_ENDS).map(([k, v]) => `${k} ${v.join(', ')}`).join('; ')}.`, '');
  L.push('Listen to a few of these against the chart before trusting a new build: a slip neither rule catches (a tap',
    'missing and another extra inside one verse) plays the wrong words.', '');
  const exTable = (rows, timed) => {
    const out = ['| Row | Marks | Runs | Complete | Examples |', '|---|---|---|---|---|'];
    for (const r of rows) {
      const list = r.ex.map((x) => `${x.ref}${timed ? ` (${x.p} ${x.a}, ${x.s.toFixed(2)}–${x.e === null ? 'end' : x.e.toFixed(2)} s)` : ''}`).join('; ');
      out.push(`| ${r.n} | ${r.k} | ${fmt(r.matches)} | ${fmt(r.complete)} | ${list || 'none'} |`);
    }
    return out;
  };
  L.push('### Year-round melody', '', ...exTable(ex.torah, true), '');
  L.push('### High Holiday melody', '', ...exTable(ex.highholiday, false), '');
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
if (!LENIENT) for (const [m, d] of Object.entries(MELODIES)) if (d.derived && derivedMotifs[m]) writeFileSync(join(repoRoot, d.motifs), JSON.stringify(derivedMotifs[m]) + '\n');
if (!LENIENT) writeFileSync(REPORT_PATH, report() + '\n');
console.log(`build-trope-phrases: ${Object.entries(MELODIES).map(([m, d]) => `${melodies[m].rows.length} ${d.label}`).join(' + ')} rows -> ${JSON_PATH.replace(repoRoot + '/', '')} (${bytes} bytes)${LENIENT ? ' [lenient]' : `; ${crossCheck.length} staffs checked`}`);
if (counted) {
  writeFileSync(CENSUS_PATH, counted.text);
  writeFileSync(EXAMPLES_PATH, counted.examples);
  console.log(`build-trope-phrases --census: ${counted.verses} verses, ${counted.marks} marks -> ${CENSUS_PATH.replace(repoRoot + '/', '')}; ${counted.exCount} examples of ${counted.exRows} rows -> ${EXAMPLES_PATH.replace(repoRoot + '/', '')} (${Buffer.byteLength(counted.examples)} bytes)`);
} else {
  // the contexts report and the examples were counted against another chart: warn, since only --census can
  // bring them up to date
  if (existsSync(CENSUS_PATH)) {
    const named = (readFileSync(CENSUS_PATH, 'utf8').match(DIGEST_RE) || [])[1];
    if (named !== jsonDigest)
      console.warn(`build-trope-phrases: WARNING — ${CENSUS_PATH.replace(repoRoot + '/', '')} was counted against ${named ? `trope_phrases.json ${named}` : 'an unnamed trope_phrases.json'}, not this build's ${jsonDigest}: re-run with --census`);
  }
  if (existsSync(EXAMPLES_PATH)) {
    let same = false;
    try {
      const old = JSON.parse(readFileSync(EXAMPLES_PATH, 'utf8'));
      same = Object.keys(MELODIES).filter((m) => MELODIES[m].examples !== false).every((m) => (old.melodies[m] || []).map((r) => `${r.n}:${r.k}`).join('|')
        === melodies[m].rows.map((row) => `${row.n}:${row.units.map((u) => u.k).join(' ')}`).join('|'));
    } catch { /* unreadable: stale */ }
    if (!same) console.warn(`build-trope-phrases: WARNING — ${EXAMPLES_PATH.replace(repoRoot + '/', '')} no longer follows the chart's rows: re-run with --census`);
  }
}
