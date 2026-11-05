#!/usr/bin/env node
// S618 — the printable card sheet sizes every front in one layout. fcsFitSizes() wrote a font size and read it back
// per card per size, one forced layout each, and the page's :has() rules make each of those re-check the document:
// the sheet's Print over 200 letter cards held the page 545–1,293 ms at a 4× slower CPU (the results screen's
// Print This Card Set 425–1,416), now 130–346.
//
//   node scripts/loop/probes/S618-flash-card-sheet-fits-in-one-layout.mjs
//   exit 1 when the setup screen's Print card sheet (200 cards) or the results screen's Print This Card Set forces more
//   than 10 layouts from script, or when the sheet or the print never happens (the probe's own handle: window.print is
//   counted and #fcSheet must fill). ROOT=<a git archive of the tree> runs another copy (the tree before S618 fails
//   with ~200 forced layouts per print); --json prints the record.
//
// Forced layouts are counted from a devtools trace: a Layout event that carries a JS stack was asked for by script.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => {
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1');
    window.__prints = 0; window.print = () => { window.__prints++; };
  }, [cell.lang, cell.dark]);
  const ready = async () => { await page.waitForFunction(() => window.I18n && document.querySelector('#screenSetup.active #startBtn')); await page.evaluate(() => I18n.ready); await page.waitForTimeout(500); };
  await page.goto(base + '/flash_cards.html'); await ready();
  await page.evaluate(() => { const s = getSettings(); s.cardCount = 200; localStorage.setItem('hebrewFlashCards_settings', JSON.stringify(s)); });
  await page.reload(); await ready();
  const cdp = await ctx.newCDPSession(page);
  const forcedDuring = async fn => {
    const events = []; const onData = d => events.push(...d.value); cdp.on('Tracing.dataCollected', onData);
    const done = new Promise(r => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.stack', transferMode: 'ReportEvents' });
    await page.evaluate(() => { window.__sheet = 0; const el = document.getElementById('fcSheet'); new MutationObserver(() => { if (el.children.length) window.__sheet = el.querySelectorAll('.fcs-cell').length; }).observe(el, { childList: true }); });
    const p0 = await page.evaluate(() => window.__prints);
    await fn(); await page.waitForTimeout(800);
    await cdp.send('Tracing.end'); await done; cdp.off('Tracing.dataCollected', onData);
    const forced = events.filter(e => e.name === 'Layout' && e.args?.beginData?.stackTrace?.length).length;
    return { forced, printed: (await page.evaluate(() => window.__prints)) - p0, cells: await page.evaluate(() => window.__sheet) };
  };
  // A mouse click at the button's box, as a teacher's: Playwright's own click first scrolls the target into view, and
  // the root's scroll-padding (the sticky Start bar) makes it scroll for a button inside that bar, which closes the menu.
  const box = await page.locator('#printSheetBtn').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.locator('#sheetPrintBtn').waitFor({ state: 'visible', timeout: 5000 });
  const pb = await page.locator('#sheetPrintBtn').boundingBox();
  const menu = await forcedDuring(() => page.mouse.click(pb.x + pb.width / 2, pb.y + pb.height / 2));
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.click('#startBtn');
  let n = 0; while (await page.evaluate(() => document.getElementById('screenCard').classList.contains('active')) && n < 300) { await page.keyboard.press(n % 3 ? 'y' : 'n'); await page.waitForTimeout(240); n++; }
  await page.waitForSelector('#screenResults.active');
  const results = await forcedDuring(() => page.click('#printDeckBtn'));
  for (const [k, r] of [['menu', menu], ['results', results]]) {
    const bad = r.forced > 10 || r.printed !== 1 || r.cells < 200;
    if (bad) fail++;
    record.push({ ...cell, arm: k, ...r, ok: !bad });
  }
  if (errors.length) { fail++; record.push({ ...cell, errors }); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else record.forEach(r => console.log(`${r.lang} ${r.dark ? 'dark' : 'light'} ${r.w} ${r.arm || ''}: forced ${r.forced} printed ${r.printed} cells ${r.cells} ${r.ok === false ? 'FAIL' : r.errors ? 'ERRORS ' + r.errors : 'ok'}`));
process.exit(fail ? 1 : 0);
