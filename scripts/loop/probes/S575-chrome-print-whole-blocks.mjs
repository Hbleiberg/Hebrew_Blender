#!/usr/bin/env node
// S575 — The chrome pages on paper: no card cut across sheets and no section heading stranded at a sheet foot (pattern
// print-block-split-at-a-sheet-foot). Resources (Links and Fonts views) and Contact keep their cards whole; Privacy and
// Terms keep each heading with its text. Measured in the PDF itself: every card gets an out-of-flow white marker at its
// first and its last text (position:absolute with no offsets is drawn at its static position, so the layout is
// untouched), every heading one at its first text and one at the first text of what follows it; pdftotext says which
// sheet each marker landed on.
//
//   node scripts/loop/probes/S575-chrome-print-whole-blocks.mjs     exit 1 on any cut card or stranded heading, in any of
//                                                                   5 views × EN/HE × Letter/A4 (Chrome's default 0.4in
//                                                                   margins, no backgrounds), or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before 044e1fa6 / f1a7ccee cuts 7
//   and strands in 6 of the cells); --json prints the record. Needs poppler's pdfinfo and pdftotext (skips loudly).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); }
catch (e) { console.log('SKIP: poppler (pdfinfo / pdftotext) is not installed'); process.exit(0); }
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's575-'));
const VIEWS = [
  { name: 'resources-links', file: 'resources.html', items: '.resource-card' },
  { name: 'resources-fonts', file: 'resources.html', items: '.resource-card', view: 'fonts' },
  { name: 'contact', file: 'contact.html', items: 'main section' },
  { name: 'privacy', file: 'privacy.html', heads: 'main h2, main h3' },
  { name: 'terms', file: 'terms.html', heads: 'main h2, main h3' },
];
const sheetsOf = (pdf) => {
  const n = +execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]; const at = {};
  for (let p = 1; p <= n; p++) for (const m of execFileSync('pdftotext', ['-f', '' + p, '-l', '' + p, pdf, '-']).toString().matchAll(/QQ([SEHF])(\d+)QQ/g)) at[m[1] + m[2]] = p;
  return { n, at };
};
const browser = await chromium.launch();
const records = [];
for (const v of VIEWS) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript((lang) => { localStorage.setItem('hebrewBlender_lang', lang); }, lang);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(BASE + '/' + v.file, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 20000 });
  await page.evaluate(() => window.I18n && I18n.ready);
  await page.waitForTimeout(800);
  if (v.view) { await page.locator(`.view-toggle button[data-view="${v.view}"]`).click(); await page.waitForTimeout(1000); }
  const meta = await page.evaluate(({ items, heads }) => {
    const mk = (t) => { const s = document.createElement('span'); s.textContent = 'QQ' + t + 'QQ'; s.style.cssText = 'position:absolute;color:#fff;font:6px/1 monospace;white-space:nowrap;'; s.setAttribute('aria-hidden', 'true'); return s; };
    const texts = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() && n.parentElement.offsetParent !== null ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }); const a = []; let n; while ((n = w.nextNode())) a.push(n); return a; };
    const vis = (e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const r = { items: [], heads: [] };
    if (items) [...document.querySelectorAll(items)].filter(vis).forEach((e, i) => { const t = texts(e); if (!t.length) return; t[0].parentNode.insertBefore(mk('S' + i), t[0]); const l = t[t.length - 1]; l.parentNode.insertBefore(mk('E' + i), l.nextSibling); r.items[i] = (e.querySelector('h2,h3,h4') || e).textContent.trim().slice(0, 40); });
    if (heads) [...document.querySelectorAll(heads)].filter(vis).forEach((h, i) => { let f = h.nextElementSibling; while (f && !vis(f)) f = f.nextElementSibling; if (!f) return; const th = texts(h), tf = texts(f); if (!th.length || !tf.length) return; th[0].parentNode.insertBefore(mk('H' + i), th[0]); tf[0].parentNode.insertBefore(mk('F' + i), tf[0]); r.heads[i] = h.textContent.trim().slice(0, 50); });
    return r;
  }, { items: v.items, heads: v.heads });
  for (const [paper, w, h] of [['Letter', 8.5, 11], ['A4', 8.27, 11.69]]) {
    const pdf = path.join(TMP, `${v.name}-${lang}-${paper}.pdf`);
    await page.pdf({ path: pdf, width: w + 'in', height: h + 'in', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
    const { n, at } = sheetsOf(pdf);
    const cut = [], stranded = [], unseen = [];
    meta.items.forEach((t, i) => { if (t == null) return; if (!at['S' + i] || !at['E' + i]) unseen.push(t); else if (at['S' + i] !== at['E' + i]) cut.push(`${t} (${at['S' + i]}→${at['E' + i]})`); });
    meta.heads.forEach((t, i) => { if (t == null) return; if (!at['H' + i] || !at['F' + i]) unseen.push(t); else if (at['H' + i] !== at['F' + i]) stranded.push(`${t} (${at['H' + i]}→${at['F' + i]})`); });
    const marked = meta.items.filter(x => x != null).length + meta.heads.filter(x => x != null).length;
    records.push({ cell: `${v.name} ${lang} ${paper}`, ok: marked > 0 && !cut.length && !stranded.length && !unseen.length && !errors.length, sheets: n, marked, cut, stranded, unseen, errors });
  }
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.cell.padEnd(26) + ` ${r.sheets} sheets, ${r.marked} marked` + (r.cut.length ? ' — cut: ' + r.cut.join(' | ') : '') + (r.stranded.length ? ' — stranded: ' + r.stranded.join(' | ') : '') + (r.unseen.length ? ' — marker not in the PDF: ' + r.unseen.join(' | ') : '') + (r.errors.length ? ' ' + r.errors.join(' | ') : '')));
const bad = records.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${records.length} cells fail` : `all ${records.length} cells pass`);
process.exit(bad ? 1 : 0);
