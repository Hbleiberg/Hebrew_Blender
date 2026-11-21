#!/usr/bin/env node
// S670 (found by pass N on the Holiday Guide, its first N) — below 860px the coloring-sheet popup is one scrolling
// column with the pages above the options, so a choice that changes how many pages there are (Symbols per page, All /
// None, a symbol's chip, another holiday) grew or shrank everything above the option the finger was on. Chromium's
// scroll anchoring hid it; Safari has none (caniuse: unsupported through iOS 26.5), and there the option left the
// screen by 600–2,500px — "1 (one big picture)" dropped the teacher among the six pages it made. hgBuild now keeps
// the options where they were on the screen; the popup still opens on the sheet, and side by side nothing moves.
//   iPhone 13 and SE descriptors × EN / HE × with Chromium's anchoring and without it (overflow-anchor:none, as
//   Safari): seven real taps, each control within 4px of where it was and on screen; the open and a reopen land on
//   the sheet; another tab's change with the sheet in view keeps the sheet; at 1280 neither pane moves.
//
//   node scripts/loop/probes/S670-holiday-options-stay-under-the-finger.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S670 fails every no-anchoring tap)
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
async function openPage(desc, lang, noAnchor) {
  const ctx = await browser.newContext({ ...desc, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(l => { try { if (sessionStorage.getItem('__s670')) return; sessionStorage.setItem('__s670', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', '0'); } catch (e) {} }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/holiday_guide.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.querySelector('#hgCards[data-ready="1"]'), null, { timeout: 20000 });
  await page.evaluate(() => I18n.ready);
  if (noAnchor) await page.addStyleTag({ content: '*{overflow-anchor:none !important}' });
  return { ctx, page, errs };
}
const ready = page => page.waitForFunction(() => document.querySelector('#hgPages[data-ready="1"]'), null, { timeout: 20000 });
const topOf = (page, sel) => page.evaluate(s => Math.round(document.querySelector(s).getBoundingClientRect().top), sel);
for (const [dev, desc] of [['iPhone 13', devices['iPhone 13']], ['iPhone SE', devices['iPhone SE']]]) for (const lang of ['en', 'he']) for (const noAnchor of [true, false]) {
  const tag = `${dev} ${lang} ${noAnchor ? 'no anchoring' : 'anchoring'}`;
  const { ctx, page, errs } = await openPage(desc, lang, noAnchor);
  await page.tap('#hgHero [data-make]'); await ready(page);
  const open = await page.evaluate(() => ({ st: document.querySelector('.hg-panes').scrollTop, sheet: Math.round(document.querySelector('#hgPages .hg-sheet').getBoundingClientRect().top) }));
  report(open.st === 0 && open.sheet < 200, `${tag}: opens on the sheet ${JSON.stringify(open)}`);
  const steps = [['input[name="hgPer"][value="1"]', 'per 1'], ['input[name="hgPer"][value="6"]', 'per 6'], ['input[name="hgPer"][value="2"]', 'per 2'],
    ['#hgSymNone', 'None'], ['#hgSymAll', 'All'], ['#hgSyms .hg-chip input', 'a symbol chip'], ['#hgPick input[value="purim"]', 'another holiday']];
  for (const [sel, label] of steps) {
    const anchorSel = sel.startsWith('#hgSym') && !sel.includes('chip') ? sel : null;
    const loc = anchorSel ? page.locator(sel) : page.locator(sel).first().locator('xpath=..');
    await loc.scrollIntoViewIfNeeded();
    await page.evaluate(s => { const e = document.querySelector(s); const el = e.closest('label') || e; const p = document.querySelector('.hg-panes'); p.scrollTop += el.getBoundingClientRect().top - innerHeight / 2; }, sel);
    await page.waitForTimeout(60);
    const before = await topOf(page, sel);
    await loc.tap();
    if (label !== 'None') await ready(page); else await page.waitForTimeout(150);
    await page.waitForTimeout(120);
    const after = await topOf(page, sel), vh = await page.evaluate(() => innerHeight);
    report(Math.abs(after - before) < 4 && after > 0 && after < vh, `${tag}: ${label} — the control ${before} → ${after}`);
  }
  // another tab's change while the sheet is in view: the sheet stays where it is
  await page.evaluate(() => { document.querySelector('.hg-panes').scrollTop = 0; });
  const sheetBefore = await topOf(page, '#hgPages .hg-sheet');
  const other = await ctx.newPage();
  await other.goto(`${BASE}/holiday_guide.html`, { waitUntil: 'domcontentloaded' });
  await other.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewHolidayGuide_settings') || '{}'); s.per = 1; localStorage.setItem('hebrewHolidayGuide_settings', JSON.stringify(s)); });
  await page.waitForFunction(() => document.querySelectorAll('#hgPages .hg-sheet').length > 3, null, { timeout: 10000 }).catch(() => {});
  await ready(page); await page.waitForTimeout(120);
  const sheetAfter = await topOf(page, '#hgPages .hg-sheet'), n = await page.evaluate(() => document.querySelectorAll('#hgPages .hg-sheet').length);
  report(n > 3 && Math.abs(sheetAfter - sheetBefore) < 4, `${tag}: another tab's change with the sheet in view — ${n} pages, the sheet ${sheetBefore} → ${sheetAfter}`);
  await other.close();
  // a reopen after scrolling down lands on the sheet again
  await page.evaluate(() => { const p = document.querySelector('.hg-panes'); p.scrollTop = p.scrollHeight; });
  await page.tap('#hgClose'); await page.locator('#hgHero [data-make]').scrollIntoViewIfNeeded(); await page.tap('#hgHero [data-make]'); await ready(page);
  const re = await page.evaluate(() => document.querySelector('.hg-panes').scrollTop);
  report(re === 0, `${tag}: a reopen lands on the sheet (scrollTop ${re})`);
  report(!errs.length, `${tag}: page errors ${errs.length} ${errs.join(' | ')}`);
  await ctx.close();
}
// side by side (1280): each pane scrolls alone, and a build moves neither
{
  const { ctx, page, errs } = await openPage({ viewport: { width: 1280, height: 800 } }, 'en', true);
  await page.click('#hgHero [data-make]'); await ready(page);
  await page.evaluate(() => { const s = document.querySelector('.hg-side'); s.scrollTop = 200; });
  const before = await page.evaluate(() => [document.querySelector('.hg-side').scrollTop, document.querySelector('.hg-main').scrollTop, document.querySelector('.hg-panes').scrollTop]);
  await page.click('input[name="hgPer"][value="1"]'); await ready(page);
  const after = await page.evaluate(() => [document.querySelector('.hg-side').scrollTop, document.querySelector('.hg-main').scrollTop, document.querySelector('.hg-panes').scrollTop]);
  report(JSON.stringify(before) === JSON.stringify(after), `1280 side by side: the panes' scroll ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  report(!errs.length, `1280: page errors ${errs.length}`);
  await ctx.close();
}
console.log(`\n${cells - fails}/${cells} pass`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
