#!/usr/bin/env node
// S680 — the Font Maker's stage legend reads in Hebrew order in the Hebrew UI. The legend line ("Drag the letter to
// move · corner ◻ scales … · ● rotates.") is interface text inside .ws-center, which is pinned LTR for the drawing
// math, so in Hebrew the sentence took LTR and its final period stood at its start (right of the first word). Its
// text lines now take the interface's direction (`translated-text-in-a-pinned-ltr-box`); the stage itself stays LTR.
//
//   node scripts/loop/probes/S680-font-maker-stage-legend-reads-in-hebrew-order.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S680's fix fails HE).
//
// Offline (foreign origins aborted, the worker blocked), the onboarding wizard dismissed the way the recipe says.
// HE light / dark × 1280 / 800: the Align legend at load, then the Trace legend after a real click on the Trace tab:
// the legend's last period sits left of its last word and its first word right of its last word, on one line.
// EN light / dark × 1280: the legend's text computes ltr. Guards: the legend resolves and holds text in each mode
// (the Trace tab's own text changed it), the stage (#stage) still computes ltr, and no page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const read = page => page.evaluate(() => {
  const el = document.getElementById('stageLegend'), sp = el && el.querySelector(':scope > span');
  if (!sp) return { err: 'no legend line' };
  const rect = (pick) => {   // first / last word or the last period, by Range over the line's text nodes
    const nodes = []; const w = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) if (n.nodeValue.trim()) nodes.push(n);
    const found = pick(nodes); if (!found) return null; const r = document.createRange(); r.setStart(found[0], found[1]); r.setEnd(found[0], found[2]);
    const q = r.getClientRects()[0]; return q ? { x: q.left, r: q.right, y: Math.round(q.top) } : null; };
  const first = rect(ns => { const n = ns[0], m = /[א-תA-Za-z]+/.exec(n.nodeValue); return m && [n, m.index, m.index + m[0].length]; });
  const lastWord = rect(ns => { for (let k = ns.length - 1; k >= 0; k--) { const t = ns[k].nodeValue, all = [...t.matchAll(/[א-תA-Za-z]+/g)]; if (all.length) { const m = all[all.length - 1]; return [ns[k], m.index, m.index + m[0].length]; } } return null; });
  const dot = rect(ns => { for (let k = ns.length - 1; k >= 0; k--) { const i = ns[k].nodeValue.lastIndexOf('.'); if (i >= 0) return [ns[k], i, i + 1]; } return null; });
  return { text: sp.textContent.trim(), dir: getComputedStyle(sp).direction, stageDir: getComputedStyle(document.getElementById('stage') || document.body).direction, first, lastWord, dot };
});

const browser = await chromium.launch();
const CELLS = [['he', false, 1280], ['he', true, 1280], ['he', false, 800], ['he', true, 800], ['en', false, 1280], ['en', true, 1280]];
let pass = 0, n = 0;
for (const [lang, dark, vw] of CELLS) {
  const cell = `${lang} ${dark ? 'dark' : 'light'} ${vw}`;
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { try { localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0'); } catch (e) {} }, { lang, dark });
  await ctx.route('**/*', r => (r.request().url().startsWith(BASE) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${BASE}/Hebrew_Font_Maker.html`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  const why = [], seen = [];
  for (const [mode, act] of [['align', null], ['trace', '#tabTrace']]) {
    if (act) { await page.click(act); await page.waitForTimeout(500); }
    const r = await read(page);
    if (r.err) { why.push(`${mode}: ${r.err}`); continue; }
    seen.push(r.text);
    if (r.stageDir !== 'ltr') why.push(`${mode}: the stage is no longer ltr`);
    if (lang === 'he') {
      if (!r.first || !r.lastWord || !r.dot) { why.push(`${mode}: a word or the period did not resolve`); continue; }
      if (r.dot.y === r.lastWord.y && !(r.dot.r <= r.lastWord.x + 1)) why.push(`${mode}: the period (${Math.round(r.dot.x)}) is not left of the last word (${Math.round(r.lastWord.x)})`);
      if (r.first.y === r.lastWord.y && !(r.first.x > r.lastWord.x)) why.push(`${mode}: the first word is not right of the last`);
      if (r.dot.y !== r.lastWord.y) why.push(`${mode}: the period and the last word are on different lines`);
    } else if (r.dir !== 'ltr') why.push(`${mode}: the English legend is not ltr`);
  }
  if (seen.length === 2 && seen[0] === seen[1]) why.push('the Trace tab did not change the legend');
  if (errors.length) why.push('page errors: ' + errors.join(' | '));
  n++; if (!why.length) pass++;
  console.log(`${why.length ? '✗' : '✓'} ${cell}${why.length ? ' — ' + why.join('; ') : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${pass} / ${n}`);
process.exit(pass === n ? 0 : 1);
