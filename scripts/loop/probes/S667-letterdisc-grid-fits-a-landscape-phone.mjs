#!/usr/bin/env node
// S667 — letter_discrimination.html's round on a touch screen: the grid's fit-to-height formula (the screen's height less
// 250px of chrome) never drops below what a landscape phone can show once the page scrolls past the header.
//   landscape phones (iPhone SE, 13, 14 Pro Max, Pixel 7) × EN/HE × 9×9 and 12×12: the grid is at least
//     min(360, height − 24) − 2 px tall and no taller than the screen less 20 (the paper's padding), so scrolled to the
//     paper the whole grid shows and a real tap on its last square paints it (the tree before S667: 70–180px grids,
//     8–20px squares);
//   portrait phones and tablets (SE, 13, Pixel 7, iPad Mini, iPad, iPad landscape, Galaxy Tab S4) keep the old
//     geometry: a portrait phone's grid fills the width (the 560px rule), a tablet's is height − 250;
//   a mouse (1366×768, 1280×600, 800×600) never sees the touch rule: the grid's max-width is (height − 250) × cols / rows.
//
//   node scripts/loop/probes/S667-letterdisc-grid-fits-a-landscape-phone.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy. Two local faces go into My Fonts so a session can start
//   (foreign origins are aborted, as in the recipe).
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
async function paper(ctxOpts, lang, rows, cols) {
  const ctx = await browser.newContext({ ...ctxOpts, serviceWorkers: 'block', reducedMotion: 'reduce' });
  let hits = 0;
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith(BASE)) hits++; return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(l => localStorage.setItem('hebrewBlender_lang', l), lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  const ready = async () => { await page.waitForFunction(() => window.I18n && typeof window.ldStart === 'function', null, { timeout: 20000 }); await page.evaluate(() => I18n.ready); };
  await page.goto(`${BASE}/letter_discrimination.html?seed=7`, { waitUntil: 'load' }); await ready();
  await page.evaluate(async () => { for (const [n, f] of [['Akoderf Test', '/fonts/Akoderf-Regular.ttf'], ['Reuben Test', '/fonts/Reuben.ttf']]) await saveUserFont(n, new Uint8Array(await (await fetch(f)).arrayBuffer()), n); });
  await page.reload({ waitUntil: 'load' }); await ready();
  await page.waitForFunction(() => typeof MY_FONTS !== 'undefined' && MY_FONTS.length === 2, null, { timeout: 10000 });
  await page.evaluate(([r, c]) => { S.fonts = ['Akoderf Test', 'Reuben Test']; S.rows = r; S.cols = c; ldRenderSetup(); }, [rows, cols]);
  const touch = !!ctxOpts.hasTouch, act = sel => touch ? page.tap(sel) : page.click(sel);
  await act('#ldStartBtn'); await page.waitForSelector('#ldGoBtn:not([hidden])', { timeout: 15000 });
  await act('#ldGoBtn'); await page.waitForSelector('#ldPaper:not([hidden]) .ld-cell'); await page.waitForTimeout(150);
  const g = await page.evaluate(() => {
    const gr = document.getElementById('ldGrid').getBoundingClientRect(), c = document.querySelector('.ld-cell').getBoundingClientRect();
    const wrap = document.querySelector('.ld-gridwrap');
    return { vw: innerWidth, vh: innerHeight, w: gr.width, h: gr.height, cell: c.width, maxW: getComputedStyle(wrap).maxWidth, coarse: matchMedia('(pointer: coarse)').matches, n: document.querySelectorAll('.ld-cell').length };
  });
  return { ctx, page, errs, g, hits: () => hits, act };
}
const fmt = g => `${g.vw}×${g.vh}: grid ${Math.round(g.w)}×${Math.round(g.h)}, squares ${g.cell.toFixed(1)}px`;
// 1. landscape phones
for (const d of ['iPhone SE landscape', 'iPhone 13 landscape', 'iPhone 14 Pro Max landscape', 'Pixel 7 landscape']) for (const lang of ['en', 'he']) for (const [rows, cols] of [[9, 9], [12, 12]]) {
  const { ctx, page, errs, g, hits } = await paper(devices[d], lang, rows, cols);
  const want = Math.min(360, g.vh - 24) - 2;
  let tapped = false, inView = false;
  if (g.h >= want && g.h <= g.vh - 20) {
    await page.locator('.ld-swatch').first().tap();
    await page.evaluate(() => document.getElementById('ldPaper').scrollIntoView({ block: 'start' })); await page.waitForTimeout(100);
    inView = await page.evaluate(() => { const r = document.getElementById('ldGrid').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    await page.locator('.ld-cell').last().tap();
    tapped = await page.evaluate(() => RUN.round.cells[RUN.round.cells.length - 1].chosen === 0);
  }
  report(g.coarse && hits() > 5 && g.n === rows * cols && g.h >= want && g.h <= g.vh - 20 && inView && tapped && !errs.length,
    `${d} ${lang} ${rows}×${cols} ${fmt(g)} (want ${want}–${g.vh - 20} tall); scrolled to the paper the grid ${inView ? 'shows whole' : 'does NOT show whole'}, its last square ${tapped ? 'paints' : 'NOT painted'} by a tap; errors ${errs.length}`);
  await ctx.close();
}
// 2. portrait phones and tablets keep their geometry
for (const d of ['iPhone SE', 'iPhone 13', 'Pixel 7', 'iPad Mini', 'iPad (gen 7)', 'iPad (gen 7) landscape', 'Galaxy Tab S4']) for (const lang of ['en', 'he']) {
  const { ctx, errs, g } = await paper(devices[d], lang, 9, 9);
  const portraitPhone = g.vw <= 560;
  const ok = portraitPhone ? g.maxW === 'none' : Math.abs(g.h - Math.min(g.vh - 250, g.w)) <= 2.5;
  report(g.coarse && ok && !errs.length, `${d} ${lang} ${fmt(g)}: ${portraitPhone ? `fills the width (max-width ${g.maxW})` : `height − 250 = ${g.vh - 250}`}; errors ${errs.length}`);
  await ctx.close();
}
// 3. a mouse never sees the touch rule
for (const [w, h] of [[1366, 768], [1280, 600], [800, 600]]) {
  const { ctx, errs, g } = await paper({ viewport: { width: w, height: h } }, 'en', 9, 9);
  report(!g.coarse && Math.abs(parseFloat(g.maxW) - (h - 250)) < 0.5 && !errs.length, `mouse ${fmt(g)}: max-width ${g.maxW} (want ${h - 250}px); errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
