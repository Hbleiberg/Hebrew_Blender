#!/usr/bin/env node
// S680 — a translated sentence inside a box pinned left-to-right reads in Hebrew order in the Hebrew UI. Two carriers:
// the Trope Atlas's zarka note ("(fonts also use U+0598)", in the sign table's Unicode cell, `dir="ltr"` for the code
// points) put its opening bracket at the left of its first word; the generator's empty state (inside `.worksheet`,
// pinned LTR as the printed sheet) ended its sentence with the period at its start. Now the note carries dir="auto"
// and the empty state follows the interface's direction.
//
//   node scripts/loop/probes/S680-hebrew-in-a-pinned-ltr-box-reads-in-order.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S680 fails the HE cells).
//
// Offline (every foreign origin aborted, the worker blocked). HE light / dark at 800 and 1280: the note's "(" sits right
// of "יש" on one line and its "U+0598" left of "ב־" (on its line, or a later one); the empty state's final period sits
// left of "עבודה". EN light / dark at 1280 and 800: both boxes compute direction ltr (nothing changed for English).
// Guards: every handle resolves (the cell, the note, the empty state, each word's Range); and the census of the two
// pages — every text node holding Hebrew and a bracket, digit or Latin letter whose block computes ltr, outside
// <svg>, <kbd>, form fields and lang="en" — finds 0 in the HE cells, while a planted <p dir="ltr"> is found.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// In-page helpers: a word's first client rect inside a box; the census of Hebrew text in an LTR block.
const HELPERS = `
window.__wordRect = (box, s, from) => {
  const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { const i = n.nodeValue.indexOf(s, from || 0); if (i < 0) continue;
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + s.length); const q = r.getClientRects()[0]; if (q) return { x: q.left, r: q.right, y: Math.round(q.top) }; }
  return null; };
window.__lastRect = (box, s) => {   // the last occurrence across the box's text nodes (a sentence's final period)
  let hit = null; const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { const i = n.nodeValue.lastIndexOf(s); if (i >= 0) hit = [n, i]; }
  if (!hit) return null; const r = document.createRange(); r.setStart(hit[0], hit[1]); r.setEnd(hit[0], hit[1] + s.length);
  const q = r.getClientRects()[0]; return q ? { x: q.left, r: q.right, y: Math.round(q.top) } : null; };
window.__census = () => {
  const out = [], blk = e => { for (; e; e = e.parentElement) { const d = getComputedStyle(e).display; if (!/^inline/.test(d) && d !== 'contents') return e; } return document.body; };
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) { const t = n.nodeValue; if (!/[\\u05d0-\\u05ea]/.test(t) || !/[A-Za-z0-9()\\[\\].,:;!?]/.test(t.trim())) continue;
    const el = n.parentElement; if (!el || el.closest('svg, kbd, input, textarea, select, script, style, [lang="en"], [hidden]') || !el.getClientRects().length) continue;
    if (getComputedStyle(blk(el)).direction === 'ltr') out.push(t.trim().slice(0, 60)); }
  return out; };`;

const browser = await chromium.launch();
const CELLS = [['he', false, 800], ['he', true, 800], ['he', false, 1280], ['he', true, 1280], ['en', false, 1280], ['en', true, 1280], ['en', false, 800], ['en', true, 800]];
let pass = 0, n = 0; const fails = [];
for (const [lang, dark, vw] of CELLS) {
  const cell = `${lang} ${dark ? 'dark' : 'light'} ${vw}`;
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { try { localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0'); } catch (e) {} }, { lang, dark });
  await ctx.addInitScript({ content: HELPERS });
  await ctx.route('**/*', r => (r.request().url().startsWith(BASE) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  const why = [];
  // the Trope Atlas: the zarka note
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' }); await page.waitForTimeout(900);
  const atlas = await page.evaluate(lang => {
    const td = document.querySelector('#m-zarka td.at-mono'), note = td && td.querySelector('span');
    if (!td || !note) return { err: 'zarka cell or note missing' };
    const out = { dir: getComputedStyle(note).direction, text: note.textContent.trim() };
    if (lang === 'he') { out.open = __wordRect(note, '('); out.first = __wordRect(note, 'יש'); out.code = __wordRect(note, 'U+0598'); out.prep = __wordRect(note, 'ב־'); }
    out.census = __census();
    const p = document.createElement('p'); p.dir = 'ltr'; p.textContent = '(טקסט ב־U+0001)'; document.body.appendChild(p); out.plant = __census().length - out.census.length; p.remove();
    return out;
  }, lang);
  if (atlas.err) why.push('atlas: ' + atlas.err);
  else if (lang === 'he') {
    if (!atlas.open || !atlas.first || !atlas.code || !atlas.prep) why.push('atlas: a word did not resolve');
    else {
      if (!(atlas.open.y === atlas.first.y && atlas.open.x > atlas.first.x)) why.push(`atlas: "(" at ${Math.round(atlas.open.x)} is not right of "יש" at ${Math.round(atlas.first.x)} on its line`);
      if (!(atlas.code.y > atlas.prep.y || (atlas.code.y === atlas.prep.y && atlas.code.r <= atlas.prep.x + 1))) why.push('atlas: "U+0598" is not after "ב־" in Hebrew order');
    }
    if (atlas.census.length) why.push('atlas census: ' + atlas.census.join(' | '));
    if (atlas.plant !== 1) why.push('atlas: the census plant was not found');
  } else if (atlas.dir !== 'ltr') why.push('atlas: the English note is not ltr');
  // the generator: the empty state (the worksheet before a build)
  await page.goto(`${BASE}/hebrew_blend_generator.html`, { waitUntil: 'load' }); await page.waitForTimeout(1200);
  const gen = await page.evaluate(lang => {
    const es = document.querySelector('#worksheet .empty-state'), p = es && es.querySelector('p');
    if (!es || !p) return { err: 'empty state missing' };
    const out = { dir: getComputedStyle(es).direction, wsDir: getComputedStyle(document.getElementById('worksheet')).direction };
    if (lang === 'he') { out.word = __wordRect(p, 'עבודה'); out.dot = __lastRect(p, '.'); out.census = __census(); }
    return out;
  }, lang);
  if (gen.err) why.push('generator: ' + gen.err);
  else {
    if (gen.wsDir !== 'ltr') why.push('generator: the worksheet itself is no longer ltr');
    if (lang === 'he') {
      if (!gen.word || !gen.dot) why.push('generator: a word did not resolve');
      else if (!(gen.dot.y === gen.word.y && gen.dot.r <= gen.word.x + 1)) why.push(`generator: the period (${Math.round(gen.dot.x)}) is not left of "עבודה" (${Math.round(gen.word.x)})`);
      if (gen.census.length) why.push('generator census: ' + gen.census.join(' | '));
    } else if (gen.dir !== 'ltr') why.push('generator: the English empty state is not ltr');
  }
  if (errors.length) why.push('page errors: ' + errors.join(' | '));
  n++; if (!why.length) pass++; else fails.push(`${cell}: ${why.join('; ')}`);
  console.log(`${why.length ? '✗' : '✓'} ${cell}${why.length ? ' — ' + why.join('; ') : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${pass} / ${n}`);
process.exit(pass === n ? 0 : 1);
