#!/usr/bin/env node
// S667 — letter_discrimination.html: on a touch screen the round's paper opens on one screen. Below the header and the
// round bar a phone's paper did not fit — the key's second row and Done sat under the fold (iPhone 13: Done's bottom
// 822px in a 664px window), and the swipe a participant makes to reach them, on a grid that fills the width
// (touch-action:none), paints squares instead (each one an answer in the data). After the participant's Start press:
//   portrait phones (320×568, iPhone SE, 13, Pixel 7) × EN/HE: the whole grid, the key and Done are on screen without a
//     further scroll; Done twice (the blank warning, then finish) brings round 2's ready card with its Start on screen,
//     and round 2's paper opens on one screen again;
//   landscape phones (iPhone SE, 13, Pixel 7) × EN/HE: the whole grid is on screen and the key starts on it (above 820px
//     the key column is sized by the window's width, so Pixel 7's runs past a 360px screen: a logged candidate);
//   tablets (iPad Mini, iPad, iPad landscape, Galaxy Tab S4 both ways) × EN: the grid, the key and Done on screen;
//   a mouse (1280×900, 1366×768, 800×600): the page does not scroll (the header stays where it was).
//
//   node scripts/loop/probes/S667-letterdisc-paper-opens-on-one-screen.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy (the tree before S667 fails every portrait-phone cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
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
const SE320 = { ...devices['iPhone SE'], viewport: { width: 320, height: 568 }, screen: { width: 320, height: 568 } };
async function start(ctxOpts, lang) {
  const ctx = await browser.newContext({ ...ctxOpts, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(l => localStorage.setItem('hebrewBlender_lang', l), lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  const ready = async () => { await page.waitForFunction(() => window.I18n && typeof window.ldStart === 'function', null, { timeout: 20000 }); await page.evaluate(() => I18n.ready); };
  await page.goto(`${BASE}/letter_discrimination.html?seed=7`, { waitUntil: 'load' }); await ready();
  await page.evaluate(async () => { for (const [n, f] of [['Akoderf Test', '/fonts/Akoderf-Regular.ttf'], ['Reuben Test', '/fonts/Reuben.ttf']]) await saveUserFont(n, new Uint8Array(await (await fetch(f)).arrayBuffer()), n); });
  await page.reload({ waitUntil: 'load' }); await ready();
  await page.waitForFunction(() => typeof MY_FONTS !== 'undefined' && MY_FONTS.length === 2, null, { timeout: 10000 });
  await page.evaluate(() => { S.fonts = ['Akoderf Test', 'Reuben Test']; ldRenderSetup(); });
  const act = sel => ctxOpts.hasTouch ? page.locator(sel).tap() : page.locator(sel).click();
  await act('#ldStartBtn'); await page.waitForSelector('#ldGoBtn:not([hidden])', { timeout: 15000 });
  const go = async () => { await act('#ldGoBtn'); await page.waitForSelector('#ldPaper:not([hidden]) .ld-cell'); await page.waitForTimeout(150); };
  await go();
  return { ctx, page, errs, act, go };
}
// what of the paper is on screen right now (no scrolling by the probe)
const onScreen = page => page.evaluate(() => {
  const vis = id => { const r = document.getElementById(id).getBoundingClientRect(); return r.width > 0 && r.top >= -0.5 && r.bottom <= innerHeight + 0.5; };
  const k = document.getElementById('ldKey').getBoundingClientRect();
  return { grid: vis('ldGrid'), key: vis('ldKey'), keyTop: k.top >= -0.5 && k.top < innerHeight - 40, keyPast: Math.max(0, Math.round(k.bottom - innerHeight)), done: vis('ldDoneBtn'), y: Math.round(scrollY), vh: innerHeight, vw: innerWidth };
});
const say = s => `grid ${s.grid ? 'on' : 'OFF'} / key ${s.key ? 'on' : s.keyTop ? `starts on (${s.keyPast}px past the fold)` : 'OFF'} / Done ${s.done ? 'on' : 'OFF'} screen, scrolled ${s.y}px`;
for (const [name, d] of [['320×568', SE320], ['iPhone SE', devices['iPhone SE']], ['iPhone 13', devices['iPhone 13']], ['Pixel 7', devices['Pixel 7']]]) for (const lang of ['en', 'he']) {
  const { ctx, page, errs, act, go } = await start(d, lang);
  const s1 = await onScreen(page);
  await act('#ldDoneBtn'); await act('#ldDoneBtn');
  await page.waitForSelector('#ldGoBtn:not([hidden])', { timeout: 15000 });
  const readyOn = await page.evaluate(() => { const r = document.getElementById('ldGoBtn').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
  await go();
  const s2 = await onScreen(page);
  report(s1.grid && s1.key && s1.done && readyOn && s2.grid && s2.key && s2.done && !errs.length,
    `portrait ${name} ${lang} ${s1.vw}×${s1.vh}: round 1 ${say(s1)}; round 2's Start ${readyOn ? 'on' : 'OFF'} screen; round 2 ${say(s2)}; errors ${errs.length}`);
  await ctx.close();
}
for (const d of ['iPhone SE landscape', 'iPhone 13 landscape', 'Pixel 7 landscape']) for (const lang of ['en', 'he']) {
  const { ctx, page, errs } = await start(devices[d], lang);
  const s = await onScreen(page);
  report(s.grid && s.keyTop && !errs.length, `landscape ${d} ${lang} ${s.vw}×${s.vh}: ${say(s)}; errors ${errs.length}`);
  await ctx.close();
}
for (const d of ['iPad Mini', 'iPad (gen 7)', 'iPad (gen 7) landscape', 'Galaxy Tab S4', 'Galaxy Tab S4 landscape']) {
  const { ctx, page, errs } = await start(devices[d], 'en');
  const s = await onScreen(page);
  report(s.grid && s.key && s.done && !errs.length, `tablet ${d} ${s.vw}×${s.vh}: ${say(s)}; errors ${errs.length}`);
  await ctx.close();
}
for (const [w, h] of [[1280, 900], [1366, 768], [800, 600]]) {
  const { ctx, page, errs } = await start({ viewport: { width: w, height: h } }, 'en');
  const s = await onScreen(page);
  report(s.y === 0 && !errs.length, `mouse ${w}×${h}: the page stays at the top (scrolled ${s.y}px; ${say(s)}); errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
