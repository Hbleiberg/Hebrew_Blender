#!/usr/bin/env node
// S692 — the 404 page's "Or wander somewhere useful:" line names fourteen tools as inline links; at most widths one or two
// of them broke across two lines ("Holiday / Guide", "Flash / Cards"). `.tool-links a` now keeps each name on one line.
//
//   node scripts/loop/probes/S692-404-tool-names-stay-on-one-line.mjs   (ROOT=<tree> runs another copy)
//   EN / HE × light / dark × 320 / 390 / 800 / 1024 / 1280: all 14 links present (the handle), each link one client rect,
//   none past the viewport's edges, no horizontal page scroll, no page error. Exit 1 otherwise.
//   Foreign origins are aborted, so the fallback UI font sets the line; `ROOT=` the tree before fails 8 of 20 cells (with the webfonts, 18 of 20).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0, cells = 0;
for (const lang of ['en', 'he']) for (const dark of [false, true]) for (const w of [320, 390, 800, 1024, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(([l, d]) => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); }, [lang, dark]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/404.html`, { waitUntil: 'load' }); await page.waitForTimeout(600);
  const r = await page.evaluate(() => { const as = [...document.querySelectorAll('.tool-links a')]; return { n: as.length, split: as.filter(a => a.getClientRects().length > 1).map(a => a.textContent), hs: document.documentElement.scrollWidth > innerWidth + 1, over: as.filter(a => { const b = a.getBoundingClientRect(); return b.right > innerWidth + 1 || b.left < -1; }).map(a => a.textContent) }; });
  cells++; const bad = r.n !== 14 || r.split.length || r.hs || r.over.length || errors.length; if (bad) fail++;
  console.log(`${lang} ${dark ? 'dark' : 'light'} ${w}: ${bad ? 'FAIL' : 'ok'} links ${r.n}` + (r.split.length ? ` split ${r.split.join(', ')}` : '') + (r.over.length ? ` over ${r.over.join(', ')}` : '') + (r.hs ? ' hscroll' : '') + (errors.length ? ` errors ${errors.length}` : ''));
  await ctx.close();
}
console.log(`${cells - fail}/${cells} cells pass`);
await browser.close(); server.close(); process.exit(fail ? 1 : 0);
