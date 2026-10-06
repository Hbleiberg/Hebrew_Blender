#!/usr/bin/env node
/**
 * build-parasha-icons.mjs — build js/parasha-icons.js and the docs/parasha-emojis/ previews from ParashaEmojis.md.
 *
 * ParashaEmojis.md (the repo root) is the catalog of the 54 weekly parasha icons: each portion's reading, a
 * one-sentence summary, what its emoji shows and why it was chosen, and the drawing — the inner markup of a 48×48
 * SVG, on one line, in the section's one ```html block. That block is the only hand-edited copy of a drawing: fix
 * it there and re-run this script; never edit js/parasha-icons.js or a preview by hand.
 *
 * Before writing anything it checks that the catalog has 54 sections numbered 1–54 in order, each headed with the
 * names data/parshiyot.json gives that parasha (en and he) and showing the preview named after it, and that every
 * drawing is built only from what the holiday icons use: <path>, <circle>, <ellipse>, <rect>, <line>, <polyline>,
 * <polygon> and <g>, with geometry attributes, stroke settings and rotate/translate transforms, every fill and
 * stroke `none` or a var(--hol-*) token — no id, style, url(), <text> or <defs>, so an icon follows the dark
 * palette without a re-render and can appear twice on one page. It does not measure a drawing's extent: look at
 * the preview.
 *
 *   node scripts/build-parasha-icons.mjs           check, then write js/parasha-icons.js + docs/parasha-emojis/<key>.svg
 *   node scripts/build-parasha-icons.mjs --check   check only, and exit 1 if a file it writes would change
 *
 * js/parasha-icons.js is precached: a changed file needs a VERSION bump in sw.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = 'ParashaEmojis.md';
const OUT_JS = 'js/parasha-icons.js';
const PREVIEW_DIR = 'docs/parasha-emojis';
const CHECK = process.argv.includes('--check');

const TOKENS = ['line', 'gold', 'gold-lt', 'paper', 'navy', 'red', 'green', 'blue', 'flame', 'ground'];
const COLOUR = new RegExp(`^(none|var\\(--hol-(${TOKENS.join('|')})\\))$`);
const TAGS = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'g']);
const ATTRS = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'transform', 'fill-rule']);
const TRANSFORM = /^\s*(rotate|translate)\([-\d.\s,]*\)(\s+(rotate|translate)\([-\d.\s,]*\))*\s*$/;
// The holiday-icons CSS block's palettes, built into each preview so it can be opened on its own.
const LIGHT = '--hol-line:#1a2744;--hol-gold:#c9922a;--hol-gold-lt:#f0d080;--hol-paper:#fffaf0;--hol-navy:#2a3b66;--hol-red:#c0392b;--hol-green:#3a7d44;--hol-blue:#3b6fb6;--hol-flame:#f0a030;--hol-ground:#fdf8ef';
const DARK = '--hol-line:#e8e0d0;--hol-gold:#e0a832;--hol-gold-lt:#f5d97a;--hol-paper:#e8e0d0;--hol-navy:#5a6d9c;--hol-red:#e0584a;--hol-green:#5aa865;--hol-blue:#6a9ae0;--hol-flame:#f6b84a;--hol-ground:#161c2a';

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

const parshiyot = JSON.parse(readFileSync(path.join(ROOT, 'data/parshiyot.json'), 'utf8'));
if (parshiyot.length !== 54) fail('data/parshiyot.json', `${parshiyot.length} entries, expected 54`);
const md = readFileSync(path.join(ROOT, CATALOG), 'utf8');
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
  icons.push({ n: p.n, en: p.en, key, svg });
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
   Loaded by classroom_dashboard.html (its parsha line) and torah_trainer.html (the reading's header and the date
   lookup), each as a classic script placed before the page's inline <script> (window.ParashaIcons). It reads no
   settings, no I18n and no DOM.
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
const preview = (ic) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
<!-- Preview of the ${ic.key} parasha emoji (ParashaEmojis.md): the holiday-icons palette, light and dark. -->
<style>
svg{${LIGHT};stroke:var(--hol-line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none}
@media (prefers-color-scheme:dark){svg{${DARK}}}
</style>
${ic.svg}
</svg>
`;

const files = [[OUT_JS, js], ...icons.map((ic) => [`${PREVIEW_DIR}/${ic.key}.svg`, preview(ic)])];
const stale = files.filter(([rel, text]) => {
  const abs = path.join(ROOT, rel);
  return !existsSync(abs) || readFileSync(abs, 'utf8') !== text;
});
if (CHECK) {
  if (stale.length) {
    console.error(`build-parasha-icons --check: ${stale.length} file(s) out of date with ${CATALOG}:\n  ` + stale.map(([rel]) => rel).join('\n  ') +
      '\nRun node scripts/build-parasha-icons.mjs (and bump VERSION in sw.js if js/parasha-icons.js changed).');
    process.exit(1);
  }
  console.log(`build-parasha-icons --check: ${icons.length} drawings, every file up to date.`);
} else {
  for (const [rel, text] of stale) writeFileSync(path.join(ROOT, rel), text);
  console.log(`build-parasha-icons: ${icons.length} drawings checked; ${stale.length ? 'wrote ' + stale.map(([rel]) => rel).join(', ') : 'every file already up to date'}.`);
  if (stale.some(([rel]) => rel === OUT_JS)) console.log('js/parasha-icons.js changed: bump VERSION in sw.js.');
}
