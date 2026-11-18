#!/usr/bin/env node
// S660 — the generator's frozen Generate bar stays under the sidebar when the window resizes. Above 700px the bar is
// placed from the sidebar's rect, and only a ResizeObserver on the sidebar re-placed it: the observer hears a size
// change, never a move, and in the Hebrew UI the sidebar is the right-hand column, so a wider or narrower window moved
// it at the same width while the bar kept its old x — wholly off the screen after 1440 → 800 (Generate, Print and PDF
// gone), over the worksheet after 1000 → 1440.
// Per UI (EN / HE) × six window changes across the 700px line and above it, after a real Generate (the bar then keeps
// its actions and shows at every scroll): the bar spans the sidebar exactly above 700px and the full width at or below
// it, before and after the resize; 0 page errors. Positions only, so the web fonts are not needed (foreign origins
// aborted).
//
//   node scripts/loop/probes/S660-generator-bar-follows-the-sidebar.mjs
//   exit 1 on a misplaced bar; ROOT=<a git archive of the tree> runs another copy (the tree before S660 fails the four
//   Hebrew resizes above 700px).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const CHANGES = [[1280, 1000], [1000, 1440], [1440, 800], [800, 1280], [600, 1100], [1100, 760]];
const browser = await chromium.launch();
let fails = 0, n = 0;
for (const lang of ['en', 'he']) for (const [from, to] of CHANGES) {
  const ctx = await browser.newContext({ viewport: { width: from, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url())) ? r.continue() : r.abort());
  await ctx.addInitScript(lang => { if (sessionStorage.getItem('__s660')) return; sessionStorage.setItem('__s660', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${base}/hebrew_blend_generator.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  await page.locator('#generateBtn').click();
  await page.waitForFunction(() => document.getElementById('genFab').classList.contains('has-actions'), null, { timeout: 10000 });
  const read = () => page.evaluate(() => {
    const fab = document.getElementById('genFab'), side = document.getElementById('appSidebar');
    if (!fab || !side) return null;
    const f = fab.getBoundingClientRect(), s = side.getBoundingClientRect(), cs = getComputedStyle(fab);
    return { fab: [Math.round(f.left), Math.round(f.right)], side: [Math.round(s.left), Math.round(s.right)], vw: document.documentElement.clientWidth, shown: cs.visibility !== 'hidden' && cs.display !== 'none' };
  });
  const a = await read();
  await page.setViewportSize({ width: to, height: 900 }); await page.waitForTimeout(400);
  const b = await read();
  const ok = x => x && x.shown && (x.vw <= 700 ? x.fab[0] === 0 && x.fab[1] >= x.vw - 1 : Math.abs(x.fab[0] - x.side[0]) <= 1 && Math.abs(x.fab[1] - x.side[1]) <= 1);
  const good = htmlLang === lang && ok(a) && ok(b) && !errs.length;
  n++; if (!good) fails++;
  console.log(`${good ? 'PASS' : 'FAIL'} ${lang} ${from} → ${to}px: the bar ${b ? b.fab.join('–') : '?'} under the sidebar ${b ? b.side.join('–') : '?'} in a ${b ? b.vw : '?'}px window (before the resize ${a ? a.fab.join('–') : '?'})${htmlLang !== lang ? `, the page is in ${htmlLang}` : ''}${errs.length ? `, ${errs.length} page errors` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${n - fails} / ${n} resizes keep the bar under the sidebar`);
process.exit(fails ? 1 : 0);
