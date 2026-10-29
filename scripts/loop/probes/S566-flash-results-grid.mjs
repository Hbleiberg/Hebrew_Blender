#!/usr/bin/env node
// S566 — Flash Cards: after a 10-card drill with misses, Practice This Drill's Mistakes is on screen on a laptop.
// Before (gate 3, the maintainer chose the compact grid), the auto-expanded per-card list was one full-width 53px row
// per card, so Redo and Mistakes sat ~1,030–1,140px down on a 1366×768 laptop or a projector. Above phone width the
// list is now a grid of chips; on a phone it stays one column; #profileHistory (same .results-list class) keeps rows.
//
//   node scripts/loop/probes/S566-flash-results-grid.mjs     exit 1 when Mistakes is below the fold above phone
//                                                             width, a chip overflows, the page scrolls sideways,
//                                                             or the phone list is not one column
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// By real clicks: בּ ג ד ה × segol + tzere, 10 cards, every 3rd marked ✗, at EN light / HE dark 1366×768,
// EN dark 1280×720 and an EN 390px phone.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
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
const browser = await chromium.launch();
const records = [];
for (const [lang, dark, w, h] of [['en', '0', 1366, 768], ['he', '1', 1366, 768], ['en', '1', 1280, 720], ['en', '0', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); localStorage.setItem('hebrewFlashCards_mobileWarnDismissed', '1'); } }, { lang, dark });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('.letter-tile').length > 20, null, { timeout: 20000 }); await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  await page.click('#letterNone'); for (const x of ['בּ', 'ג', 'ד', 'ה']) await page.click(`.letter-tile[data-heb="${x}"]`);
  await page.click('#vowelNone'); for (const k of ['e', 'tzere']) await page.click(`.vtile[data-key="${k}"]`);
  await page.click('.count-btn[data-n="10"]');
  await page.click('#startBtn'); await page.waitForTimeout(400);
  for (let i = 0; i < 14 && await page.evaluate(() => document.querySelector('.screen.active')?.id) === 'screenCard'; i++) {
    await page.click('#fcCard', { position: { x: 20, y: 20 } }); await page.waitForTimeout(600); await page.click(i % 3 === 1 ? '#markNo' : '#markYes'); await page.waitForTimeout(420);
  }
  const m = await page.evaluate(() => {
    const items = [...document.querySelectorAll('#resultsList .result-item')];
    return { chips: items.length, open: !document.getElementById('panelResults').classList.contains('collapsed'), cols: new Set(items.map(e => Math.round(e.getBoundingClientRect().left))).size,
      mistakesBottom: Math.round(document.getElementById('mistakesBtn').getBoundingClientRect().bottom), vh: innerHeight,
      over: items.filter(e => [e, ...e.children].some(x => x.scrollWidth > x.clientWidth + 1)).length, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      history: getComputedStyle(document.getElementById('profileHistory')).display };
  });
  const phone = w <= 520;
  m.ok = m.chips === 10 && m.open && !m.over && !m.hscroll && m.history === 'block' && (phone ? m.cols === 1 : m.cols >= 3 && m.mistakesBottom <= m.vh);
  records.push({ cell: `${lang} ${dark === '1' ? 'dark' : 'light'} ${w}x${h}`, ...m, errors: errors.length });
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log(`${r.cell.padEnd(18)} ${r.chips} chips in ${r.cols} column(s); Practice Mistakes ends at ${r.mistakesBottom} of ${r.vh}; overflowing chips ${r.over}; page scrolls sideways ${r.hscroll}; pageerrors ${r.errors}${r.ok && !r.errors ? '' : '  FAIL'}`));
process.exit(bad.length ? 1 : 0);
