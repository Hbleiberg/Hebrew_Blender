#!/usr/bin/env node
// S671 (the S653 M P4) — a selected verse's gold ring (Copy verses → Select verses) and a looping verse's pulsing one are
// drawn inset at the row's own edge, where its verse number begins, so the ring ran through the number's first digit
// (0px from its ink). The plate now stands 8px out from the row, its padding cancelling its margin: the number clears
// the ring and nothing in the row, or after it, moves.
//   1280 EN light / 800 HE dark / a 390px phone EN light × the default layout, Interlinear and the Trope staff, by real
//   clicks (Settings → Text → the layout; Share → Copy verses → Select verses; a press on the second verse): the verse
//   is selected, the ring stands ≥ 6px off the number's ink, the number and the next verse do not move, and the plate
//   stays inside the window. The looping ring is the same rule on the same rows (its loop needs recorded audio).
//   The Trainer's reading is a fixture built from data/trope/trope_phrase_examples.json, as the S666 probe builds it.
//
//   node scripts/loop/probes/S671-torah-selected-verse-ring-clears-its-number.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S671 fails every gap cell)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const pick = (re) => rows.filter((r) => re.test(r.k)).flatMap((r) => r.ex.map((e) => e.he));
const open_ = pick(/zakef_katon$/), etn = pick(/etnachta$/), sof = pick(/sof_pasuk$/);
const verses = Array.from({ length: 12 }, (_, i) => `${open_[i % open_.length]} ${etn[i % etn.length]} ${sof[i % sof.length]}`);
const sefaria = (u) => { if (u.includes('/v3/texts/')) { const m = decodeURIComponent(u).match(/texts\/[A-Za-z_]+\.(\d+)\.(\d+)/); return { versions: [{ language: 'he', text: verses }], sections: m ? [m[1], m[2]] : ['1', '1'] }; } return u.includes('/calendars') ? { calendar_items: [] } : []; };
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
// the second verse's row, its number's ink and the next row: where they stand
const geo = () => {
  const v = [...document.querySelectorAll('#ttReading [data-vk]')].filter((e) => e.getClientRects().length);
  const el = v[1], num = el && el.querySelector('.tt-verse-num, .tt-vnum');
  if (!el || !num) return null;
  const rtl = getComputedStyle(el).direction === 'rtl';
  const rg = document.createRange(); rg.selectNodeContents(num); const n = rg.getBoundingClientRect(), r = el.getBoundingClientRect();
  return { vk: el.dataset.vk, sel: el.classList.contains('tt-bulk-selected'), gap: rtl ? r.right - n.right : n.left - r.left, numX: rtl ? n.right : n.left, numY: n.top,
    nextTop: v[2] ? v[2].getBoundingClientRect().top : null, inWin: r.left >= 0 && r.right <= innerWidth, cls: el.className };
};
const CELLS = [[1280, 900, 'en', false], [800, 900, 'he', true], [390, 844, 'en', false]];
const LAYOUTS = [['sidebyside', '#ttLayoutSide'], ['interlinear', '#ttLayoutInter'], ['staff', '#ttLayoutStaff']];
for (const [w, h, lang, dark] of CELLS) {
  for (const [lay, radio] of LAYOUTS) {
    const tag = `${w} ${lang} ${dark ? 'dark' : 'light'} ${lay}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
    await page.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sefaria(u)) }); if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) r.continue(); else r.abort(); });
    await page.addInitScript(([lang, dark]) => { try { if (sessionStorage.getItem('__s671')) return; sessionStorage.setItem('__s671', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); } catch (e) {} }, [lang, dark]);
    await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#ttReading [data-vk]').length > 3, null, { timeout: 60000 });
    await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal-backdrop.open').forEach((o) => { if (o.id !== 'settingsBackdrop') o.classList.remove('open'); }));
    // the layout, by the drawer's Text tab
    await page.locator('#gearBtn').click();
    await page.locator('#ttTabText').click();
    if (!(await page.locator(radio).isChecked())) await page.locator(`label[for="${radio.slice(1)}"]`).click();
    // Copy verses → Select verses
    await page.locator('#ttTabShare').click();
    await page.locator('#ttTabPanelShare [data-set="copy"] button.hi-btn').first().click();
    await page.waitForTimeout(400);
    await page.locator('label[for="ttCopyBulkCb"]').click();
    await page.waitForFunction(() => document.body.classList.contains('tt-bulk-mode'), null, { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => document.querySelectorAll('#ttReading [data-vk]').length > 3, null, { timeout: 30000 });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const v = [...document.querySelectorAll('#ttReading [data-vk]')].filter((e) => e.getClientRects().length); v[1].scrollIntoView({ block: 'center', behavior: 'instant' }); });
    await page.waitForTimeout(300);
    const before = await page.evaluate(geo);
    if (!before) { report(false, `${tag}: no second verse with a number`); await ctx.close(); continue; }
    // press the verse on its first Hebrew word, as a teacher would
    const word = page.locator(`#ttReading [data-vk="${before.vk}"] .tt-word`).first();
    await word.click();
    await page.waitForTimeout(400);
    const after = await page.evaluate(geo);
    report(after.sel, `${tag}: the press selected verse ${before.vk} (${after.cls})`);
    report(after.gap >= 6, `${tag}: the ring stands ${after.gap.toFixed(1)}px off the number (before: ${before.gap.toFixed(1)})`);
    report(Math.abs(after.numX - before.numX) <= 0.5 && Math.abs(after.numY - before.numY) <= 0.5, `${tag}: the number stays put (${(after.numX - before.numX).toFixed(1)}, ${(after.numY - before.numY).toFixed(1)})`);
    report(after.nextTop == null || Math.abs(after.nextTop - before.nextTop) <= 0.5, `${tag}: the next verse stays put (${after.nextTop == null ? 'none' : (after.nextTop - before.nextTop).toFixed(1)})`);
    report(after.inWin, `${tag}: the plate stays inside the window`);
    report(errs.length === 0, `${tag}: ${errs.length} page errors`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(`${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
