#!/usr/bin/env node
// S657 — the generator's zoom slider above 100% keeps the whole sheet within scrolling reach: the sheet grows from its
// top start corner (top left in the English UI, top right in the Hebrew one), so it spills only toward the scroll
// area's end. Before, it grew from the top centre and half the growth ran off the start edge, where no scrolling
// reaches: the title and the first column of blends (English) or the Name / Date lines (Hebrew), 146–386px at 1280.
// Zoomed out it still shrinks toward the top centre. By the keyboard on the real slider (End = 200%, then Home = 50%,
// arrows for 150%) after a real Generate, × 1280 EN light / HE dark, 800 EN dark, iPhone 13 HE light (by a tap).
// Per zoom: the sheet's content past the scroll area's start edge ≤ 2px, and after scrolling the area to its start
// and to its end, both of the sheet's side edges have been inside it; at 50% and 100% the sheet is centred as before.
//
//   node scripts/loop/probes/S657-generator-zoom-keeps-its-start-edge.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S657 fails every 150% and 200% step); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const CELLS = [
  { id: '1280 en light', dev: { viewport: { width: 1280, height: 900 } }, lang: 'en', dark: false },
  { id: '1280 he dark', dev: { viewport: { width: 1280, height: 900 } }, lang: 'he', dark: true },
  { id: '800 en dark', dev: { viewport: { width: 800, height: 1000 } }, lang: 'en', dark: true },
  { id: 'i13 he light', dev: devices['iPhone 13'], lang: 'he', dark: false },
];
function measure() {
  const sc = document.querySelector('.main-content'), sheet = document.getElementById('worksheet'), scaler = document.getElementById('worksheetScaler');
  if (!sc || !sheet || !scaler) return { missing: true };
  const rtl = getComputedStyle(sc).direction === 'rtl';
  const sr = sc.getBoundingClientRect();
  let unreach = 0;
  for (const el of sheet.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.width < 1) continue; unreach = Math.max(unreach, rtl ? r.right - sr.right : sr.left - r.left); }
  const before = sc.scrollLeft; let leftIn = false, rightIn = false;
  for (const x of [-1e6, 1e6]) {
    sc.scrollLeft = x; const s = sc.getBoundingClientRect(), w = sheet.getBoundingClientRect();
    if (w.left >= s.left - 1) leftIn = true;
    if (w.right <= s.right + 1) rightIn = true;
  }
  sc.scrollLeft = before;
  const w = sheet.getBoundingClientRect(), s = sc.getBoundingClientRect();
  const centred = Math.abs((w.left - s.left) - (s.right - w.right)) <= 2;
  return { zoom: document.getElementById('zoomSlider').value, unreach: Math.round(unreach), leftIn, rightIn, centred, origin: getComputedStyle(scaler).transformOrigin };
}
const record = []; let fail = 0;
for (const cell of (process.env.ONE ? CELLS.slice(0, 1) : CELLS)) {
  const ctx = await browser.newContext({ ...cell.dev, serviceWorkers: 'block' });
  const touch = !!cell.dev.hasTouch;
  const page = await ctx.newPage(); page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('s657z')) return; sessionStorage.setItem('s657z', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, [cell.lang, cell.dark]);
  const press = async sel => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); if (touch) await l.tap(); else await l.click(); await page.waitForTimeout(150); };
  await page.goto(base + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('genFab') && document.getElementById('zoomSlider'), null, { timeout: 30000 }); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  const fab = await page.evaluate(() => !document.getElementById('genFab').classList.contains('gen-fab-hidden'));
  await press(fab ? '#genFab .gen-fab-primary button' : '#generateBtn'); await page.waitForTimeout(600);
  const z = page.locator('#zoomSlider'); await z.scrollIntoViewIfNeeded(); await z.focus();
  // the slider mirrors in the Hebrew UI: the arrow that raises the value is the one pointing to its end
  const up = cell.lang === 'he' ? 'ArrowLeft' : 'ArrowRight';
  const settle = () => page.waitForTimeout(450);   // the scaler's 0.2s transition
  const steps = [
    ['100%', async () => {}],
    ['200% (End)', async () => { await page.keyboard.press('End'); }],
    ['50% (Home)', async () => { await page.keyboard.press('Home'); }],
    ['150% (arrows)', async () => { for (let i = 0; i < 100; i++) await page.keyboard.press(up); }],
  ];
  for (const [name, go] of steps) {
    let ok = false, got;
    try {
      await go(); await settle();
      got = await page.evaluate(measure);
      const v = +got.zoom;
      ok = !got.missing && got.unreach <= 2 && got.leftIn && got.rightIn && (v > 100 || got.centred);
      if (name.startsWith('150') && v !== 150) { ok = false; got.why = 'slider not at 150'; }
    } catch (e) { got = { error: String(e).split('\n')[0] }; }
    if (!ok) fail++;
    record.push({ cell: cell.id, step: name, ok, got });
    if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${cell.id.padEnd(14)} ${name.padEnd(14)} ${JSON.stringify(got)}`);
  }
  if (errors.length) { fail++; record.push({ cell: cell.id, step: 'page errors', ok: false, got: errors.slice(0, 2) }); if (!JSON_OUT) console.log('FAIL', cell.id, 'page errors', errors.slice(0, 2)); }
  await page.evaluate(() => localStorage.removeItem('hebrewBlender_zoom'));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(`${record.filter(r => r.ok).length}/${record.length} ok`);
process.exit(fail ? 1 : 0);
