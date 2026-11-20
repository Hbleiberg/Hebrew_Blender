#!/usr/bin/env node
// S667 (the maintainer's gate-4 answer: "fit the key column to the screen height") — letter_discrimination.html's round:
// the key column (two swatches a row, 1 / 1.15 each, then Eraser, Done and the note) never reaches past the window,
// and with the number badges shown (a mouse) no key letter runs into its badge.
//   mouse 1366×768, 1366×657 (a Chromebook's browser window), 1280×800, 1280×720, 1280×600, 1024×768 × EN light /
//     HE dark: right after Start the whole paper — the grid, the key, Eraser, Done — is on screen with no scroll, the
//     swatches keep 1 / 1.15, and each letter's ink (canvas text metrics in the round's own face) clears its badge;
//     a real click on the last swatch, then on a square, paints it (the tree before: Done's bottom at 802px whatever
//     the height, the key's last row past a 657px window);
//   mouse 800×600 (a narrow column of 57px swatches): every letter clears its badge (the tree before: they ran into it);
//   mouse 1440×900 and 1920×1080: the column is still 22% of the stage (227px), the letters 3.4rem — unchanged;
//   a 2- and a 4-letter study at 1366×657: the key is short enough, so the column keeps 227px;
//   touch: iPad and Galaxy Tab S4 landscape show the whole paper; Pixel 7 landscape (863px, wider than 820) shows the
//     grid, the key and Done once the page opens on the paper; iPhone 13 and 14 Pro Max landscape (750 and 814px) keep
//     the 820px rule's 118px column, the grid and the key on screen (Done is one swipe on the column, which scrolls);
//     iPhone 13 portrait keeps its four-swatch key row.
//
//   node scripts/loop/probes/S667-letterdisc-key-column-fits-the-height.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy.
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
async function paper(ctxOpts, lang, dark, letters) {
  const ctx = await browser.newContext({ ...ctxOpts, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  const ready = async () => { await page.waitForFunction(() => window.I18n && typeof window.ldStart === 'function', null, { timeout: 20000 }); await page.evaluate(() => I18n.ready); };
  await page.goto(`${BASE}/letter_discrimination.html?seed=7`, { waitUntil: 'load' }); await ready();
  await page.evaluate(async () => { for (const [n, f] of [['Akoderf Test', '/fonts/Akoderf-Regular.ttf'], ['Reuben Test', '/fonts/Reuben.ttf']]) await saveUserFont(n, new Uint8Array(await (await fetch(f)).arrayBuffer()), n); });
  await page.reload({ waitUntil: 'load' }); await ready();
  await page.waitForFunction(() => typeof MY_FONTS !== 'undefined' && MY_FONTS.length === 2, null, { timeout: 10000 });
  await page.evaluate(l => { S.fonts = ['Akoderf Test', 'Reuben Test']; if (l) S.letters = S.letters.slice(0, l); ldRenderSetup(); }, letters || 0);
  const act = sel => ctxOpts.hasTouch ? page.locator(sel).tap() : page.locator(sel).click();
  await act('#ldStartBtn'); await page.waitForSelector('#ldGoBtn:not([hidden])', { timeout: 15000 });
  await act('#ldGoBtn'); await page.waitForSelector('#ldPaper:not([hidden]) .ld-cell'); await page.waitForTimeout(200);
  const g = await page.evaluate(() => {
    const q = s => document.querySelector(s).getBoundingClientRect();
    const on = r => r.top >= -0.5 && r.bottom <= innerHeight + 0.5 && r.width > 0;
    const sw = [...document.querySelectorAll('.ld-swatch')];
    // each letter's ink box, from canvas metrics in the swatch's own face, against its badge (when one shows)
    const cv = document.createElement('canvas').getContext('2d');
    let clash = 0, clashAt = '';
    for (const b of sw) {
      const k = b.querySelector('kbd'), kr = k.getBoundingClientRect(), r = b.getBoundingClientRect(), cs = getComputedStyle(b);
      if (getComputedStyle(k).display === 'none') continue;
      const fs = parseFloat(cs.fontSize); cv.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`; cv.textAlign = 'center';
      const m = cv.measureText(b.firstChild.nodeValue);
      const base = r.top + r.height / 2 - fs / 2 + (fs - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2 + m.fontBoundingBoxAscent;
      const cx = r.left + r.width / 2;
      const ink = { l: cx - m.actualBoundingBoxLeft, r: cx + m.actualBoundingBoxRight, t: base - m.actualBoundingBoxAscent, b: base + m.actualBoundingBoxDescent };
      if (ink.r > kr.left + 1 && ink.l < kr.right - 1 && ink.b > kr.top + 1 && ink.t < kr.bottom - 1) { clash++; clashAt = clashAt || b.firstChild.nodeValue; }
    }
    const s0 = sw[0].getBoundingClientRect();
    return { vw: innerWidth, vh: innerHeight, y: Math.round(scrollY), grid: on(q('#ldGrid')), key: on(q('#ldKey')), eraser: on(q('#ldEraser')), done: on(q('#ldDoneBtn')),
      paperBottom: Math.round(q('#ldPaper').bottom), side: Math.round(q('.ld-side').width), sw: [Math.round(s0.width), Math.round(s0.height)], ratio: s0.height / s0.width,
      font: parseFloat(getComputedStyle(sw[0]).fontSize), clash, clashAt, n: sw.length, perRow: Math.round(q('#ldKey').width / s0.width) };
  });
  return { ctx, page, errs, g, act };
}
const say = g => `${g.vw}×${g.vh}: column ${g.side}px, swatches ${g.sw.join('×')} (${g.perRow} a row), letter ${g.font.toFixed(1)}px, ${g.clash ? `${g.clash} letter(s) INTO a badge (${g.clashAt})` : 'letters clear of their badges'}; grid ${g.grid ? 'on' : 'OFF'} / key ${g.key ? 'on' : 'OFF'} / Eraser ${g.eraser ? 'on' : 'OFF'} / Done ${g.done ? 'on' : 'OFF'} screen, paper's foot ${g.paperBottom}, scrolled ${g.y}px`;
const mouse = (w, h) => ({ viewport: { width: w, height: h } });
for (const [w, h] of [[1366, 768], [1366, 657], [1280, 800], [1280, 720], [1280, 600], [1024, 768]]) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs, g, act } = await paper(mouse(w, h), lang, dark);
  await act('.ld-swatch:last-of-type'); await act('.ld-cell >> nth=40');
  const painted = await page.evaluate(() => RUN.round.cells[40].chosen === RUN.cfg.letters.length - 1);
  report(g.y === 0 && g.grid && g.key && g.eraser && g.done && g.paperBottom <= h && Math.abs(g.ratio - 1.15) < 0.03 && !g.clash && painted && !errs.length,
    `mouse ${lang} ${dark ? 'dark' : 'light'} ${say(g)}; the last swatch then a square ${painted ? 'paints' : 'did NOT paint'}; errors ${errs.length}`);
  await ctx.close();
}
for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, errs, g } = await paper(mouse(800, 600), lang, dark);
  report(g.side === 118 && !g.clash && g.done && !errs.length, `mouse 800px ${lang} ${dark ? 'dark' : 'light'} ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
for (const [w, h] of [[1440, 900], [1920, 1080]]) {
  const { ctx, errs, g } = await paper(mouse(w, h), 'en', false);
  report(g.side === 227 && Math.abs(g.font - 54.4) < 0.1 && !g.clash && g.done && !errs.length, `mouse (unchanged) ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
for (const n of [2, 4]) {
  const { ctx, errs, g } = await paper(mouse(1366, 657), 'en', false, n);
  report(g.n === n && g.side === 227 && g.done && !g.clash && !errs.length, `mouse ${n}-letter study ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
for (const d of ['iPad (gen 7) landscape', 'Galaxy Tab S4 landscape']) {
  const { ctx, errs, g } = await paper(devices[d], 'en', false);
  report(g.grid && g.key && g.done && !errs.length, `touch ${d} ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
for (const d of ['Pixel 7 landscape']) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, errs, g } = await paper(devices[d], lang, dark);
  report(g.grid && g.key && g.done && Math.abs(g.ratio - 1.15) < 0.03 && !errs.length, `touch ${d} ${lang} ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
for (const d of ['iPhone 13 landscape', 'iPhone 14 Pro Max landscape']) {
  const { ctx, errs, g } = await paper(devices[d], 'en', false);
  report(g.side === 118 && g.grid && g.key && !errs.length, `touch ${d} (unchanged) ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
{
  const { ctx, errs, g } = await paper(devices['iPhone 13'], 'en', false);
  report(g.perRow === 4 && g.grid && g.key && g.done && !errs.length, `touch iPhone 13 portrait (unchanged) ${say(g)}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
