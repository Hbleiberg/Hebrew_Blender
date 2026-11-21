#!/usr/bin/env node
// S671 (found by pass H on the Trope Atlas, its 2nd H) — a teacher who jumped from the sign table to zakef katon's row
// in the Grid (or scrolled the Grid's box to it) and pressed Stacked to see its melodies as one card landed on the first
// card, sof pasuk, with zakef katon's 14,000px below. A layout change now keeps the sign on screen: its card or row is
// shown (at once, no glide) and focused; with the first sign on screen nothing moves and the focus stays on the button.
//   1280×800 EN light / HE dark and 800×1000 EN dark / HE light, by real clicks: (a) the sign table's Zakef Katon, then
//   Stacked; (b) the Grid's box scrolled by the wheel to Revia, then Stacked; (c) back to the Grid by Space on its button
//   with the card on screen; (d) the controls: Stacked and Grid pressed with the first sign on screen move nothing.
//
//   node scripts/loop/probes/S671-atlas-layout-change-keeps-the-sign.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S671 fails a, b and c; d passes on both)
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
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };

async function settle(page) {   // smooth scroll: wait until the window has held still for 300ms
  let last = -1, still = 0;
  for (let i = 0; i < 80 && still < 3; i++) { const y = await page.evaluate(() => scrollY); still = y === last ? still + 1 : 0; last = y; await page.waitForTimeout(100); }
}
// where a sign's row or card stands: whole in the clear part of the window (and of the Grid's box), or its card's head there
const place = (page, k) => page.evaluate((k) => {
  const t = document.getElementById('atlas-' + k), host = document.getElementById('atTable');
  if (!t) return { found: false };
  const r = t.getBoundingClientRect();
  let top = document.getElementById('atBar').getBoundingClientRect().bottom, bottom = innerHeight;
  const grid = host.classList.contains('at-grid');
  if (grid) { const b = host.getBoundingClientRect(); top = Math.max(top, b.top, host.querySelector('thead th').getBoundingClientRect().bottom); bottom = Math.min(bottom, b.bottom); }   // the heading cells are the sticky part
  const head = grid ? r : t.querySelector('.head').getBoundingClientRect();
  return { found: true, grid, inView: head.top >= top - 1 && head.bottom <= bottom + 1, headTop: Math.round(head.top - top), focus: document.activeElement ? document.activeElement.id : null };
}, k);
async function wheelUpTo(page, sel) {
  for (let i = 0; i < 30; i++) {
    const pt = await page.evaluate(() => {   // over the page's own column outside the Grid's box, so the wheel moves the window
      const b = document.getElementById('atTable').getBoundingClientRect(), bar = document.getElementById('atBar').getBoundingClientRect().bottom;
      return { x: b.left + b.width / 2, y: b.bottom + 20 < innerHeight - 5 ? b.bottom + 20 : Math.max(bar + 5, b.top - 10) };
    });
    await page.mouse.move(pt.x, pt.y);
    const t = await page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top - document.getElementById('atBar').getBoundingClientRect().bottom, sel);
    if (t >= 4) return;
    await page.mouse.wheel(0, -100); await page.waitForTimeout(150); await settle(page);
  }
}
const CELLS = [[1280, 800, 'en', false], [1280, 800, 'he', true], [800, 1000, 'en', true], [800, 1000, 'he', false]];
for (const [w, h, lang, dark] of CELLS) {
  const tag = `${w} ${lang} ${dark ? 'dark' : 'light'}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', serviceWorkers: 'block' });
  await ctx.addInitScript((lang) => { try { if (!sessionStorage.getItem('p671')) { sessionStorage.setItem('p671', '1'); localStorage.clear(); localStorage.setItem('hebrewBlender_lang', lang); } } catch (e) {} }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#atTable [data-sing]').length > 100, null, { timeout: 30000 });
  await settle(page);
  // (d) controls first: the Grid untouched, Stacked and back move nothing
  await page.locator('#atViewGrid').scrollIntoViewIfNeeded(); await settle(page);
  let y0 = await page.evaluate(() => scrollY);
  await page.locator('#atViewCards').click(); await page.waitForTimeout(300); await settle(page);
  let y1 = await page.evaluate(() => scrollY), f = await page.evaluate(() => document.activeElement.id);
  report(Math.abs(y1 - y0) <= 2 && f === 'atViewCards', `${tag} (d) Stacked from the first sign: moved ${y1 - y0}px, focus ${f}`);
  await page.locator('#atViewGrid').click(); await page.waitForTimeout(300); await settle(page);
  y1 = await page.evaluate(() => scrollY); f = await page.evaluate(() => document.activeElement.id);
  report(Math.abs(y1 - y0) <= 2 && f === 'atViewGrid', `${tag} (d) Grid from the first card: moved ${y1 - y0}px, focus ${f}`);
  // (a) the sign table's Zakef Katon → its Grid row → Stacked
  await page.locator('#m-zakef_katon a').first().click(); await page.waitForTimeout(300); await settle(page);
  const a0 = await place(page, 'zakef_katon');
  report(a0.grid && a0.inView, `${tag} (a) control: the jump shows zakef katon's row (${JSON.stringify(a0)})`);
  await wheelUpTo(page, '#atViewCards');   // as a hand would: notch by notch until the button shows (an auto-scroll centres it)
  await page.locator('#atViewCards').click(); await page.waitForTimeout(300); await settle(page);
  const a1 = await place(page, 'zakef_katon');
  report(!a1.grid && a1.inView && a1.focus === 'atlas-zakef_katon', `${tag} (a) Stacked keeps zakef katon: head ${a1.headTop}px under the bar, focus ${a1.focus}`);
  // (c) back to the Grid by Space on its button, the card on screen
  await page.evaluate(() => document.getElementById('atViewGrid').focus({ preventScroll: true }));
  await page.keyboard.press('Space'); await page.waitForTimeout(300); await settle(page);
  const c1 = await place(page, 'zakef_katon');
  report(c1.grid && c1.inView && c1.focus === 'atlas-zakef_katon', `${tag} (c) Grid keeps zakef katon: in view ${c1.inView}, focus ${c1.focus}`);
  // (b) the box scrolled by the wheel to Revia (from the top), then Stacked
  await page.evaluate(() => { document.getElementById('atTable').scrollTop = 0; });
  await page.locator('#atViewGrid').scrollIntoViewIfNeeded(); await settle(page);
  const box = await page.locator('#atTable').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height, h - box.y) / 2);
  for (let i = 0; i < 40; i++) {
    const t = await page.evaluate(() => { const host = document.getElementById('atTable'), r = document.getElementById('atlas-revia').getBoundingClientRect(); return r.top - host.querySelector('thead th').getBoundingClientRect().bottom; });
    if (t <= 40) break;
    await page.mouse.wheel(0, Math.min(200, t - 10)); await page.waitForTimeout(120);
  }
  const want = await page.evaluate(() => {   // what the reader sees first under the heading row: the expected sign
    const host = document.getElementById('atTable'), top = Math.max(host.querySelector('thead th').getBoundingClientRect().bottom, document.getElementById('atBar').getBoundingClientRect().bottom);
    const row = [...host.querySelectorAll('tbody tr')].find((r) => r.getBoundingClientRect().bottom - top > r.offsetHeight / 2);
    return row ? row.id.slice(6) : null;
  });
  report(want && want !== 'sof_pasuk', `${tag} (b) control: the wheel brought ${want} to the top of the box`);
  await page.locator('#atViewCards').click(); await page.waitForTimeout(300); await settle(page);
  const b1 = await place(page, want);
  report(!b1.grid && b1.inView, `${tag} (b) Stacked keeps ${want}: head ${b1.headTop}px under the bar`);
  report(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
