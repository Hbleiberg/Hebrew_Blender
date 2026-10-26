/**
 * parasha-catalog.mjs — read and check ParashaEmojis.md, the catalog of the 54 weekly parasha icons, for the two
 * builders that write from it: scripts/build-parasha-icons.mjs (js/parasha-icons.js, js/parasha-notes.js and the
 * docs/parasha-emojis/ previews) and scripts/build-parsha-pages.mjs (the parsha/ coloring pages). One parser, so
 * the two never read the catalog differently.
 *
 * readCatalog(catalogPath) → { icons, problems }. `problems` lists every rule a section breaks (empty when the
 * catalog is valid); `icons` has one entry per section that could be read, in order:
 *   { n, en, he, book, ref, key, svg, alt, emoji: { title, text }, spelled: [...],
 *     summary: { en, he }, why: { en, he } }
 * The rules are the ones build-parasha-icons.mjs's header describes; **Also spelled:** is the one optional
 * paragraph (after **Reading:**): a comma-separated list of other English spellings of the parasha's name
 * (Bereishit, Breishit), each letters with single spaces, hyphens or apostrophes between them, none the same
 * letters as the name itself or as another in the list. The coloring pages show it and search engines read it.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CATALOG = 'ParashaEmojis.md';
export const PREVIEW_DIR = 'docs/parasha-emojis';

const TOKENS = ['line', 'gold', 'gold-lt', 'paper', 'navy', 'red', 'green', 'blue', 'flame', 'ground'];
const COLOUR = new RegExp(`^(none|var\\(--hol-(${TOKENS.join('|')})\\))$`);
const TAGS = new Set(['path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'g']);
const ATTRS = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'x1', 'y1', 'x2', 'y2', 'points',
  'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'transform', 'fill-rule']);
const TRANSFORM = /^\s*(rotate|translate)\([-\d.\s,]*\)(\s+(rotate|translate)\([-\d.\s,]*\))*\s*$/;

// A section's paragraphs, in this order; the prose ones carry the label they open with. OPTIONAL ones may be absent.
const PARAS = [
  ['img', /^<img src="/], ['reading', /^\*\*Reading:\*\* \S/], ['spelled', /^\*\*Also spelled:\*\* \S/],
  ['summary.en', /^\*\*Summary:\*\*\s/, '**Summary:**'], ['emoji', /^\*\*Emoji: /],
  ['why.en', /^\*\*Why this emoji:\*\*\s/, '**Why this emoji:**'],
  ['summary.he', /^\*\*תקציר:\*\*\s/u, '**תקציר:**'], ['why.he', /^\*\*למה האימוג׳י הזה:\*\*\s/u, '**למה האימוג׳י הזה:**'],
  ['html', /^```html\n/],
];
const OPTIONAL = new Set(['spelled']);
// Plain text: the gallery shows it through textContent-equivalent escaping, and nothing in it needs escaping in JS.
const PROSE_BANNED = /[<>&`\\$*_~[\]"'\u0000-\u001f\u007f\u00a0\u200b-\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069\ufeff]/u;
const POINTS = /[\u0591-\u05bd\u05bf-\u05c7]/u;          // nikkud and cantillation (the maqaf, U+05BE, is punctuation)
const DIVINE = /יהוה|אלהים|אלוהים/u;
const HEB = /[\u05d0-\u05ea]/u, LATIN = /[A-Za-z]/, SENTENCE_END = /[.!?][”’)]*$/u;
const SPELLING = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;
const cp = (c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');

export const keyOf = (en) => en.toLowerCase().replace(/[^a-z]/g, '');

export function readCatalog(catalogPath = path.join(ROOT, CATALOG)) {
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

  // **Also spelled:** Bereishit, Breishit — other spellings, none the name itself or a repeat.
  function spellings(where, para, en) {
    const items = para.slice('**Also spelled:**'.length).replace(/\s*\n\s*/g, ' ').split(',').map((s) => s.trim());
    const seen = new Set([keyOf(en)]);
    for (const s of items) {
      if (!SPELLING.test(s)) fail(where, `**Also spelled:** «${s}» — letters with single spaces, hyphens or apostrophes between them`);
      else if (seen.has(keyOf(s))) fail(where, `**Also spelled:** «${s}» has the same letters as ${keyOf(s) === keyOf(en) ? 'the name' : 'another spelling'}`);
      seen.add(keyOf(s));
    }
    return items;
  }

  const parshiyot = JSON.parse(readFileSync(path.join(ROOT, 'data/parshiyot.json'), 'utf8'));
  if (parshiyot.length !== 54) fail('data/parshiyot.json', `${parshiyot.length} entries, expected 54`);
  const md = readFileSync(catalogPath, 'utf8');
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
    // The prose: every paragraph recognised, all of them present (the optional ones may be absent), in order.
    const paras = body.split(/\n[ \t]*\n/).map((s) => s.trim()).filter(Boolean);
    const kinds = paras.map((t) => (PARAS.find(([, re]) => re.test(t)) || [null])[0]);
    paras.forEach((t, j) => kinds[j] || fail(where, `unrecognized paragraph «${t.slice(0, 48).replace(/\n/g, ' ')}»` +
      (/^\*\*(תקציר|למה)/u.test(t) ? ' — the Hebrew labels are exactly **תקציר:** and **למה האימוג׳י הזה:** (geresh U+05F3)' : '')));
    const order = PARAS.map(([k]) => k).filter((k) => !OPTIONAL.has(k) || kinds.includes(k)).join(', ');
    if (kinds.join(', ') !== order) fail(where, `paragraphs are ${kinds.map((k) => k || '?').join(', ')}; expected ${order}`);
    const text = {};
    for (const [k, , label] of PARAS) if (label) { const j = kinds.indexOf(k); text[k] = j < 0 ? '' : prose(where, k, paras[j], label); }
    const para = (k) => { const j = kinds.indexOf(k); return j < 0 ? '' : paras[j]; };
    const reading = para('reading').slice('**Reading:** '.length).trim();
    if (reading !== p.ref.replace(/-/g, '–')) fail(where, `**Reading:** should be ${p.ref.replace(/-/g, '–')} (data/parshiyot.json)`);
    const alt = (para('img').match(/\balt="([^"]*)"/) || [])[1] || '';
    if (!alt) fail(where, 'the preview <img> has no alt text (the coloring pages describe the drawing with it)');
    const em = para('emoji').replace(/\s*\n\s*/g, ' ').match(/^\*\*Emoji: (.+?)\*\*\s*(.*)$/);
    if (!em || !em[2]) fail(where, '**Emoji: <Title>.** is followed by what the drawing shows');
    const spelled = para('spelled') ? spellings(where, para('spelled'), p.en) : [];
    icons.push({ n: p.n, en: p.en, he: p.he, book: p.book, ref: p.ref, key, svg, alt,
      emoji: { title: em ? em[1].replace(/\.$/, '') : '', text: em ? em[2] : '' }, spelled,
      summary: { en: text['summary.en'], he: text['summary.he'] }, why: { en: text['why.en'], he: text['why.he'] } });
  });
  if (heads.length !== 54) fail(CATALOG, `${heads.length} "### N. Name · שם" sections, expected 54`);
  return { icons, problems };
}
