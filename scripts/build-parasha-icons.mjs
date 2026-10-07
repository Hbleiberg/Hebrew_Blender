#!/usr/bin/env node
/**
 * build-parasha-icons.mjs — build js/parasha-icons.js, js/parasha-notes.js and the docs/parasha-emojis/ previews
 * from ParashaEmojis.md.
 *
 * ParashaEmojis.md (the repo root) is the catalog of the 54 weekly parasha icons: each portion's reading, a
 * one-sentence summary, what its emoji shows and why it was chosen, the summary and the reason again in Hebrew, and
 * the drawing — the inner markup of a 48×48 SVG, on one line, in the section's one ```html block. The catalog is the
 * only hand-edited copy of a drawing and of its summary and reason: fix them there and re-run this script; never edit
 * js/parasha-icons.js, js/parasha-notes.js or a preview by hand.
 *
 * Before writing anything it checks that the catalog has 54 sections numbered 1–54 in order, each headed with the
 * names data/parshiyot.json gives that parasha (en and he) and showing the preview named after it, and that every
 * drawing is built only from what the holiday icons use: <path>, <circle>, <ellipse>, <rect>, <line>, <polyline>,
 * <polygon> and <g>, with geometry attributes, stroke settings and rotate/translate transforms, every fill and
 * stroke `none` or a var(--hol-*) token — no id, style, url(), <text> or <defs>, so an icon follows the dark
 * palette without a re-render and can appear twice on one page. It does not measure a drawing's extent: look at
 * the preview.
 *
 * It also checks each section's prose. The paragraphs come in one order — the preview, **Reading:** (equal to
 * parshiyot.json's ref), **Summary:**, **Emoji: <Title>.**, **Why this emoji:**, then the Hebrew twins
 * **תקציר:** and **למה האימוג׳י הזה:**, then the drawing. Each summary and reason is one plain-text sentence of
 * 40–400 characters, its wrapped lines joined with one space (so no line may end in a hyphen, dash or maqaf): curly
 * quotes and apostrophes, no markup, entity, ASCII quote, control or bidi character. The Hebrew ones are Hebrew with
 * no Latin letter, no nikkud or cantillation, and never the divine name written in full (ה׳ and אלוקים instead).
 * Those four sentences per parasha become js/parasha-notes.js, the Torah Trainer's emoji gallery text.
 *
 *   node scripts/build-parasha-icons.mjs                  check, then write the two modules + docs/parasha-emojis/<key>.svg
 *   node scripts/build-parasha-icons.mjs --check          check only, and exit 1 if a file it writes would change
 *   node scripts/build-parasha-icons.mjs --catalog=<path> check a copy of the catalog only; write nothing
 *
 * Both modules are precached: a changed one needs a VERSION bump in sw.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = 'ParashaEmojis.md';
const OUT_JS = 'js/parasha-icons.js';
const OUT_NOTES = 'js/parasha-notes.js';
const PREVIEW_DIR = 'docs/parasha-emojis';
const CHECK = process.argv.includes('--check');
const CATALOG_ARG = process.argv.find((a) => a.startsWith('--catalog='));
const CATALOG_PATH = CATALOG_ARG ? path.resolve(CATALOG_ARG.slice('--catalog='.length)) : path.join(ROOT, CATALOG);

const TOKENS = ['line', 'gold', 'gold-lt', 'paper', 'navy', 'red', 'green', 'blue', 'flame', 'ground'];
const COLOUR = new RegExp(`^(none|var\\(--hol-(${TOKENS.join('|')})\\))$`);
const TAGS = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'g']);
const ATTRS = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'transform', 'fill-rule']);
const TRANSFORM = /^\s*(rotate|translate)\([-\d.\s,]*\)(\s+(rotate|translate)\([-\d.\s,]*\))*\s*$/;
// The holiday-icons CSS block's palettes, built into each preview so it can be opened on its own.
const LIGHT = '--hol-line:#1a2744;--hol-gold:#c9922a;--hol-gold-lt:#f0d080;--hol-paper:#fffaf0;--hol-navy:#2a3b66;--hol-red:#c0392b;--hol-green:#3a7d44;--hol-blue:#3b6fb6;--hol-flame:#f0a030;--hol-ground:#fdf8ef';
const DARK = '--hol-line:#e8e0d0;--hol-gold:#e0a832;--hol-gold-lt:#f5d97a;--hol-paper:#e8e0d0;--hol-navy:#5a6d9c;--hol-red:#e0584a;--hol-green:#5aa865;--hol-blue:#6a9ae0;--hol-flame:#f6b84a;--hol-ground:#161c2a';

// A section's paragraphs, in this order; the prose ones carry the label they open with.
const PARAS = [
  ['img', /^<img src="/], ['reading', /^\*\*Reading:\*\* \S/],
  ['summary.en', /^\*\*Summary:\*\*\s/, '**Summary:**'], ['emoji', /^\*\*Emoji: /],
  ['why.en', /^\*\*Why this emoji:\*\*\s/, '**Why this emoji:**'],
  ['summary.he', /^\*\*תקציר:\*\*\s/u, '**תקציר:**'], ['why.he', /^\*\*למה האימוג׳י הזה:\*\*\s/u, '**למה האימוג׳י הזה:**'],
  ['html', /^```html\n/],
];
// Plain text: the gallery shows it through textContent-equivalent escaping, and nothing in it needs escaping in JS.
const PROSE_BANNED = /[<>&`\\$*_~[\]"'\u0000-\u001f\u007f\u00a0\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/u;
const POINTS = /[\u0591-\u05bd\u05bf-\u05c7]/u;          // nikkud and cantillation (the maqaf, U+05BE, is punctuation)
const DIVINE = /יהוה|אלהים|אלוהים/u;
const HEB = /[\u05d0-\u05ea]/u, LATIN = /[A-Za-z]/, SENTENCE_END = /[.!?][”’)]*$/u;
const cp = (c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

const keyOf = (en) => en.toLowerCase().replace(/[^a-z]/g, '');
const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

// Every character of a drawing belongs to an allowed tag; attributes and colours as above; <g> balanced.
function checkDrawing(where, svg) {
  if (/[\n'\\`]|\$\{|<\/script/i.test(svg)) fail(where, 'the drawing must be one line with no single quote, backslash, backtick, ${ or </script');
  const TAG = /<(\/?)([a-z]+)((?:\s+[a-z-]+="[^"]*")*)\s*(\/?)>/gy;
  let pos = 0, depth = 0, n = 0;
  while (pos < svg.length) {
    if (/\s/.test(svg[pos])) { pos++; continue; }
    TAG.lastIndex = pos;
    const m = TAG.exec(svg);
    if (!m) { fail(where, `unexpected markup at «${svg.slice(pos, pos + 40)}»`); return; }
    pos = TAG.lastIndex;
    const [, close, tag, attrs, selfClose] = m;
    if (!TAGS.has(tag)) fail(where, `element <${tag}>`);
    if (close) { if (tag !== 'g' || attrs.trim() || --depth < 0) fail(where, `stray </${tag}>`); continue; }
    n++;
    if (tag === 'g' && !selfClose) depth++;
    else if (tag !== 'g' && !selfClose) fail(where, `<${tag}> must close itself`);
    for (const [, name, value] of attrs.matchAll(/([a-z-]+)="([^"]*)"/g)) {
      if (!ATTRS.has(name)) fail(where, `attribute ${name} on <${tag}>`);
      if ((name === 'fill' || name === 'stroke') && !COLOUR.test(value.trim())) fail(where, `${name}="${value}" on <${tag}>`);
      if (name === 'transform' && !TRANSFORM.test(value)) fail(where, `transform="${value}"`);
    }
  }
  if (depth !== 0) fail(where, 'unbalanced <g>');
  if (!n) fail(where, 'empty drawing');
}

// One summary or reason: the label stripped, wrapped lines joined, then held to the rules in the header.
function prose(where, kind, para, label) {
  if (/[-–־]\n/u.test(para)) fail(where, `${label} breaks a line after a hyphen, dash or maqaf (the lines are joined with a space)`);
  const t = para.slice(label.length).replace(/\s*\n\s*/g, ' ').trim();
  if (!t) { fail(where, `${label} is empty`); return ''; }
  const bad = t.match(PROSE_BANNED);
  if (bad) fail(where, `${label} has ${JSON.stringify(bad[0])} (${cp(bad[0])}): plain text only — curly quotes “ ” ’, Hebrew geresh ׳ and gershayim ״`);
  if (!SENTENCE_END.test(t)) fail(where, `${label} does not end a sentence`);
  if (t.length < 40 || t.length > 400) fail(where, `${label} is ${t.length} characters (one sentence of 40–400)`);
  if (kind.endsWith('.he')) {
    if (!HEB.test(t)) fail(where, `${label} has no Hebrew letters`);
    if (LATIN.test(t)) fail(where, `${label} has Latin letters`);
    const pt = t.match(POINTS);
    if (pt) fail(where, `${label} has nikkud or cantillation (${cp(pt[0])}): the Hebrew text is unpointed`);
    if (DIVINE.test(t)) fail(where, `${label} writes the divine name in full: ה׳, or אלוקים in a quoted verse`);
  }
  return t;
}

const parshiyot = JSON.parse(readFileSync(path.join(ROOT, 'data/parshiyot.json'), 'utf8'));
if (parshiyot.length !== 54) fail('data/parshiyot.json', `${parshiyot.length} entries, expected 54`);
const md = readFileSync(CATALOG_PATH, 'utf8');
// A section runs from its "### N. En · He" heading to the next heading of level 2 or 3.
const heads = [...md.matchAll(/^### (\d+)\. (.+?) · (.+?)\s*$/gm)];
const icons = [];
heads.forEach((h, i) => {
  const [, num, en, he] = h;
  const where = `${CATALOG} § ${num}. ${en}`;
  const n = Number(num), p = parshiyot[i];
  if (n !== i + 1) fail(where, `numbered ${n}, expected ${i + 1}`);
  if (!p) return;
  if (p.n !== n || p.en !== en || p.he !== he) fail(where, `heading should read "### ${p.n}. ${p.en} · ${p.he}" (data/parshiyot.json)`);
  const start = h.index + h[0].length;
  const next = md.slice(start).search(/^#{2,3} /m);
  const body = md.slice(start, next < 0 ? md.length : start + next);
  const key = keyOf(p.en);
  if (!body.includes(`<img src="${PREVIEW_DIR}/${key}.svg"`)) fail(where, `no <img src="${PREVIEW_DIR}/${key}.svg"> preview`);
  const blocks = [...body.matchAll(/^```html\n([^\n]*)\n```$/gm)];
  if (blocks.length !== 1) { fail(where, `${blocks.length} one-line \`\`\`html drawing blocks, expected 1`); return; }
  const svg = blocks[0][1].trim();
  checkDrawing(where, svg);
  // The prose: every paragraph recognised, all of them present, in order.
  const paras = body.split(/\n[ \t]*\n/).map((s) => s.trim()).filter(Boolean);
  const kinds = paras.map((t) => (PARAS.find(([, re]) => re.test(t)) || [null])[0]);
  paras.forEach((t, j) => kinds[j] || fail(where, `unrecognized paragraph «${t.slice(0, 48).replace(/\n/g, ' ')}»` +
    (/^\*\*(תקציר|למה)/u.test(t) ? ' — the Hebrew labels are exactly **תקציר:** and **למה האימוג׳י הזה:** (geresh U+05F3)' : '')));
  const order = PARAS.map(([k]) => k).join(', ');
  if (kinds.join(', ') !== order) fail(where, `paragraphs are ${kinds.map((k) => k || '?').join(', ')}; expected ${order}`);
  const text = {};
  for (const [k, , label] of PARAS) if (label) { const j = kinds.indexOf(k); text[k] = j < 0 ? '' : prose(where, k, paras[j], label); }
  const ri = kinds.indexOf('reading');
  const reading = ri < 0 ? '' : paras[ri].slice('**Reading:** '.length).trim();
  if (reading !== p.ref.replace(/-/g, '–')) fail(where, `**Reading:** should be ${p.ref.replace(/-/g, '–')} (data/parshiyot.json)`);
  icons.push({ n: p.n, en: p.en, key, svg, summary: { en: text['summary.en'], he: text['summary.he'] }, why: { en: text['why.en'], he: text['why.he'] } });
});
if (heads.length !== 54) fail(CATALOG, `${heads.length} "### N. Name · שם" sections, expected 54`);
if (problems.length) {
  console.error(`build-parasha-icons: ${problems.length} problem(s), nothing written:\n  ` + problems.join('\n  '));
  process.exit(1);
}

const js = `/* ══════════════════════════════════════════════════════
   IvritSuite — the weekly parasha icons: js/parasha-icons.js
   GENERATED by scripts/build-parasha-icons.mjs from ParashaEmojis.md, the catalog that gives each drawing's
   parasha summary and why it was chosen: edit a drawing there and re-run the script, never this file (a changed
   file needs a VERSION bump in sw.js — it is precached).
   Loaded by classroom_dashboard.html (its parsha line) and torah_trainer.html (the reading's header, the date
   lookup and the emoji gallery), each as a classic script placed before the page's inline <script>
   (window.ParashaIcons). It reads no settings, no I18n and no DOM.
   One flat 48×48 drawing per parasha, in the holiday icons' style: the outline and every fill come from the
   .hol-ico wrapper and the --hol-* tokens of the holiday-icons CSS block both pages carry, so the dark palette
   needs no re-render. The icon is decorative (aria-hidden): the parasha's name always follows it.
   ParashaIcons.html(i) — the icon for parasha index i (0 = Bereshit … 53 = V'Zot HaBerachah: HebCal's idx,
   parshiyot.json's n − 1) as '<span class="hol-ico" aria-hidden="true"><svg …>…</svg></span>', or '' for
   anything else; an array of indices gives one icon each, in its order (a doubled week shows both halves).
   ══════════════════════════════════════════════════════ */
'use strict';
(function () {
  const ICONS = [
${icons.map((ic) => `    /* ${ic.n} ${ic.en.replace(/\*\//g, '')} */ '${ic.svg}',`).join('\n')}
  ];
  function one(i) {
    const svg = Number.isInteger(i) ? ICONS[i] : undefined;
    return svg ? '<span class="hol-ico" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false">' + svg + '</svg></span>' : '';
  }
  function html(idx) { return Array.isArray(idx) ? idx.map(one).join('') : one(idx); }
  window.ParashaIcons = { html, count: ICONS.length };
})();
`;
const notesJs = `/* ══════════════════════════════════════════════════════
   IvritSuite — the weekly parasha notes: js/parasha-notes.js
   GENERATED by scripts/build-parasha-icons.mjs from ParashaEmojis.md: each section's **Summary:** and
   **Why this emoji:** sentences and their Hebrew twins (**תקציר:**, **למה האימוג׳י הזה:**), wrapped lines joined
   with one space. Edit the catalog and re-run the script, never this file (a changed file needs a VERSION bump in
   sw.js — it is precached).
   Loaded by torah_trainer.html only, as a deferred classic script (window.ParashaNotes), for the parasha emoji
   gallery its reading header opens; nothing reads it before that click. It reads no settings, no I18n and no DOM.
   ParashaNotes.get(i) — for parasha index i (0 = Bereshit … 53 = V'Zot HaBerachah, as ParashaIcons.html) returns
   a frozen { summary: { en, he }, why: { en, he } } of plain-text sentences (the build refuses markup, entities and
   ASCII quotes; a page still escapes them), or null for anything else. ParashaNotes.count is 54.
   ══════════════════════════════════════════════════════ */
'use strict';
(function () {
  const NOTES = [
${icons.map((ic) => `    /* ${ic.n} ${ic.en.replace(/\*\//g, '')} */ ${JSON.stringify({ summary: ic.summary, why: ic.why })},`).join('\n')}
  ];
  NOTES.forEach((n) => { Object.freeze(n.summary); Object.freeze(n.why); Object.freeze(n); });
  function get(i) { return Number.isInteger(i) && i >= 0 && i < NOTES.length ? NOTES[i] : null; }
  window.ParashaNotes = { get, count: NOTES.length };
})();
`;

// No browser gate parses js/: run both modules here and read them back.
try {
  const box = { window: {} };
  vm.runInNewContext(js, box);
  const I = box.window.ParashaIcons;
  if (!I || I.count !== icons.length || !I.html(0) || I.html(icons.length) !== '') fail(OUT_JS, 'does not load or answer as ParashaIcons');
} catch (e) { fail(OUT_JS, `does not parse: ${e.message}`); }
try {
  const box = { window: {} };
  vm.runInNewContext(notesJs, box);
  const N = box.window.ParashaNotes;
  if (!N || N.count !== icons.length || N.get(icons.length) !== null || N.get(-1) !== null) fail(OUT_NOTES, 'does not load or answer as ParashaNotes');
  else icons.forEach((ic, i) => {
    if (JSON.stringify(N.get(i)) !== JSON.stringify({ summary: ic.summary, why: ic.why })) fail(OUT_NOTES, `parasha ${ic.n} does not read back as written`);
  });
} catch (e) { fail(OUT_NOTES, `does not parse: ${e.message}`); }
if (problems.length) {
  console.error(`build-parasha-icons: ${problems.length} problem(s), nothing written:\n  ` + problems.join('\n  '));
  process.exit(1);
}
if (CATALOG_ARG) {
  console.log(`build-parasha-icons --catalog: ${path.relative(process.cwd(), CATALOG_PATH)} is valid (${icons.length} sections); nothing written.`);
  process.exit(0);
}

const preview = (ic) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
<!-- Preview of the ${ic.key} parasha emoji (ParashaEmojis.md): the holiday-icons palette, light and dark. -->
<style>
svg{${LIGHT};stroke:var(--hol-line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none}
@media (prefers-color-scheme:dark){svg{${DARK}}}
</style>
${ic.svg}
</svg>
`;

const files = [[OUT_JS, js], [OUT_NOTES, notesJs], ...icons.map((ic) => [`${PREVIEW_DIR}/${ic.key}.svg`, preview(ic)])];
const stale = files.filter(([rel, text]) => {
  const abs = path.join(ROOT, rel);
  return !existsSync(abs) || readFileSync(abs, 'utf8') !== text;
});
const MODULES = [OUT_JS, OUT_NOTES];
if (CHECK) {
  if (stale.length) {
    console.error(`build-parasha-icons --check: ${stale.length} file(s) out of date with ${CATALOG}:\n  ` + stale.map(([rel]) => rel).join('\n  ') +
      `\nRun node scripts/build-parasha-icons.mjs (and bump VERSION in sw.js if ${MODULES.join(' or ')} changed).`);
    process.exit(1);
  }
  console.log(`build-parasha-icons --check: ${icons.length} drawings and notes, every file up to date.`);
} else {
  for (const [rel, text] of stale) writeFileSync(path.join(ROOT, rel), text);
  console.log(`build-parasha-icons: ${icons.length} drawings and notes checked; ${stale.length ? 'wrote ' + stale.map(([rel]) => rel).join(', ') : 'every file already up to date'}.`);
  const changed = stale.map(([rel]) => rel).filter((rel) => MODULES.includes(rel));
  if (changed.length) console.log(`${changed.join(' and ')} changed: bump VERSION in sw.js.`);
}
