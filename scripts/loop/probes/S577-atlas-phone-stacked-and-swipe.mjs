#!/usr/bin/env node
// S577 — Trope Atlas on a phone (pass N, its first): the Stacked layout fits the screen, and a swipe past the melody
// table's last row moves the page on. Real device descriptors (iPhone SE / 13 / Pixel 7), the worker blocked, every
// outside origin aborted; Stacked chosen by a real tap; swipes are raw touch events (CDP Input.dispatchTouchEvent —
// Input.synthesizeScrollGesture's 'touch' source moved nothing in this harness, its text control included).
//
//   node scripts/loop/probes/S577-atlas-phone-stacked-and-swipe.mjs     exit 1 unless: Stacked leaves the page as wide
//          as the screen (EN + HE, and again after a reload with it stored); once the table's box has reached its last
//          row two more swipes on it move the page, and at its first row a downward swipe on it moves the page up, as
//          a swipe on the intro text does (the control); at 1280 with a mouse the box keeps overscroll-behavior-y
//          contain; 0 page errors
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before 450b75dc / 05e71676 is 671px
//   wide in Stacked on every phone and moves the page 0px from the box); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const errs = [];
async function open(opts, lang = 'en') {
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript((lang) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_pwaDismissed', '1'); }, lang);
  const page = await ctx.newPage(); page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(base + '/trope_atlas.html', { waitUntil: 'load' });
  await settle(page);
  return { ctx, page };
}
async function settle(page) {
  await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 30000 }); await page.evaluate(() => I18n.ready);
  await page.waitForFunction(() => document.querySelectorAll('#atTable svg').length > 20, null, { timeout: 30000 }); await page.waitForTimeout(300);
}
const width = page => page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
const rec = []; let fails = 0;
const check = (name, ok, note) => { rec.push({ name, ok, note }); if (!ok) fails++; if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}  ${note}`); };
// 1. Stacked fits the screen
for (const dev of ['iPhone SE', 'iPhone 13', 'Pixel 7']) for (const lang of ['en', 'he']) {
  const { ctx, page } = await open(devices[dev], lang);
  await page.evaluate(() => document.getElementById('atlas').scrollIntoView({ behavior: 'instant' }));
  await page.tap('#atViewCards'); await page.waitForTimeout(500);
  const cards = await page.locator('.at-card').count();
  const [sw, cw] = await width(page);
  await page.reload({ waitUntil: 'load' }); await settle(page);
  const [sw2, cw2] = await width(page);
  check(`${dev} ${lang}: Stacked is as wide as the screen, and after a reload`, cards > 20 && sw === cw && sw2 === cw2, `${cards} cards; ${sw}/${cw}, reloaded ${sw2}/${cw2}`);
  await ctx.close();
}
// 2. a swipe on the box past its end moves the page (both ways); a swipe on text is the control
for (const dev of ['iPhone SE', 'iPhone 13', 'Pixel 7']) {
  const { ctx, page } = await open(devices[dev]);
  const cdp = await ctx.newCDPSession(page);
  const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  const swipe = async (x, y, dy) => { await tp('touchStart', x, y); for (let k = 1; k <= 15; k++) { await tp('touchMove', x, Math.round(y - dy * k / 15)); await page.waitForTimeout(16); } await tp('touchEnd'); await page.waitForTimeout(700); };
  const st = () => page.evaluate(() => { const g = document.getElementById('atTable'), b = g.getBoundingClientRect(), bar = document.getElementById('atBar').getBoundingClientRect(); return { y: Math.round(scrollY), gt: Math.round(g.scrollTop), gmax: g.scrollHeight - g.clientHeight, top: Math.round(b.top), bottom: Math.round(b.bottom), barB: Math.round(bar.bottom), vh: innerHeight, vw: innerWidth }; });
  const boxUnderBar = async () => { for (let i = 0; i < 6; i++) { await page.evaluate(() => { const g = document.getElementById('atTable'); window.scrollBy({ top: g.getBoundingClientRect().top - document.getElementById('atBar').getBoundingClientRect().bottom, behavior: 'instant' }); }); await page.waitForTimeout(200); } };
  await boxUnderBar();
  let s = await st();
  const x = Math.round(s.vw * 0.6), yLow = Math.min(s.bottom, s.vh) - 12, yHigh = s.barB + 30;
  if (!(s.gmax > 0)) throw new Error('the melody table is not a scrolling box');
  let atEnd = null;
  for (let i = 0; i < 30 && !atEnd; i++) { await swipe(x, yLow, yLow - yHigh); s = await st(); if (s.gt >= s.gmax - 1) atEnd = s; }
  if (!atEnd) throw new Error('the box never reached its last row');
  await swipe(x, yLow, yLow - yHigh); await swipe(x, yLow, yLow - yHigh);
  const down = (await st()).y - atEnd.y;
  check(`${dev}: two swipes on the box after its last row move the page down`, down > 100, `${down} px`);
  // back: the box at its first row, its top under the bar, a downward swipe on it
  await page.evaluate(() => { document.getElementById('atTable').scrollTop = 0; }); await boxUnderBar();
  s = await st();
  await swipe(x, yHigh, -(yLow - yHigh));
  const s2 = await st();
  check(`${dev}: at the box's first row a downward swipe on it moves the page up`, s2.gt === 0 && s.y - s2.y > 100, `${s.y - s2.y} px, box at ${s2.gt}`);
  // the control: a swipe on the intro text
  await page.evaluate(() => { document.getElementById('atlas').scrollIntoView({ behavior: 'instant' }); window.scrollBy({ top: -60, behavior: 'instant' }); }); await page.waitForTimeout(300);
  const c0 = await st();
  const p = await page.evaluate(() => { const b = document.querySelector('#atlas .at-intro').getBoundingClientRect(); return { x: Math.round(b.left + b.width / 2), y: Math.round(Math.min(b.bottom - 10, innerHeight - 10)) }; });
  await swipe(p.x, p.y, Math.min(300, p.y - 70));
  const ctl = (await st()).y - c0.y;
  check(`${dev}: the control, a swipe on the intro text, moves the page`, ctl > 100, `${ctl} px`);
  await ctx.close();
}
// 3. a mouse keeps the box's own end
{ const { ctx, page } = await open({ viewport: { width: 1280, height: 900 } });
  const ob = await page.evaluate(() => getComputedStyle(document.getElementById('atTable')).overscrollBehaviorY);
  check('1280 with a mouse: the box keeps overscroll-behavior-y contain', ob === 'contain', ob); await ctx.close(); }
check('no page error', errs.length === 0, errs.join(' | '));
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(fails ? `${fails} check(s) fail` : 'all checks pass');
process.exit(fails ? 1 : 0);
