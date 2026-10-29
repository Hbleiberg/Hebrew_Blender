#!/usr/bin/env node
// S573 — Flash Cards: loading or playing a preset keeps this device's audio, voice speed, hidden home button and
// two-sided printing (the four fields the account's settings row leaves per device). Before (gate 2, the maintainer
// chose "keep the device's four"), a preset saved on a classroom tablet — home button hidden, audio off, 0.5× — and
// synced to the teacher's laptop hid the laptop's home button, muted it and slowed its voice when loaded.
//
//   node scripts/loop/probes/S573-flash-preset-keeps-device-fields.mjs     exit 1 when a Load or Play click does not
//                                                                          apply the preset's lesson, or changes any
//                                                                          of the four device fields
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// By real clicks on the preset's Play and Load buttons (Expand all menus first), at EN light / dark × 1280 / 800 and
// HE light 800.
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
const CELLS = [['en', false, 1280], ['en', false, 800], ['en', true, 1280], ['en', true, 800], ['he', false, 800]];
for (const [lang, dark, w] of CELLS) for (const how of ['load', 'play']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.addInitScript(([lang, dark]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); } }, [lang, dark]);
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof getSettings === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(1000);
  // this device: audio on, 1.0×, home shown, single-sided; the tablet's preset: the opposite, and a lesson of mode 3 / 25 cards
  await page.evaluate(() => {
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewFlashCards_settings', JSON.stringify(Object.assign(getSettings(), { audioEnabled: true, ttsRate: 1, hideHomeBtn: false, sheetDuplex: false })));
    const tablet = Object.assign(getSettings(), { mode: 3, cardCount: 25, audioEnabled: false, ttsRate: 0.5, hideHomeBtn: true, sheetDuplex: true });
    localStorage.setItem('hebrewFlashCards_presets', JSON.stringify({ Tablet: { settings: tablet, order: 1 } }));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof getSettings === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  const before = await page.evaluate(() => mode);
  await page.click('button[onclick="expandAllMenus()"]', { timeout: 5000 });
  const btn = page.locator('#presetList [data-ft-item="Tablet"] > button').nth(how === 'load' ? 1 : 0);   // Play, Load, Save, Duplicate, Delete
  await btn.scrollIntoViewIfNeeded({ timeout: 5000 });
  await btn.click({ timeout: 5000 });
  await page.waitForTimeout(600);
  const st = await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('hebrewFlashCards_settings')), home = document.getElementById('homeBtn');
    return { mode, cardCount, audioEnabled, ttsRate: parseFloat(document.getElementById('ttsRateSlider').value), hideHomeBtn, sheetDuplex,
      homeHidden: home ? getComputedStyle(home).visibility === 'hidden' : null, onCard: document.getElementById('screenCard').classList.contains('active'),
      stored: { audioEnabled: stored.audioEnabled, ttsRate: stored.ttsRate, hideHomeBtn: stored.hideHomeBtn, sheetDuplex: stored.sheetDuplex } };
  });
  const lesson = before !== 3 && st.mode === 3 && (how === 'play' ? st.onCard : st.cardCount === 25);
  const kept = st.audioEnabled === true && st.ttsRate === 1 && st.hideHomeBtn === false && st.sheetDuplex === false && st.homeHidden === false
    && st.stored.audioEnabled === true && st.stored.ttsRate === 1 && st.stored.hideHomeBtn === false && st.stored.sheetDuplex === false;
  records.push({ cell: `${lang} ${dark ? 'dark' : 'light'} ${w} ${how}`, ok: lesson && kept && errors.length === 0, lesson, kept, st, errors });
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.cell + (r.ok ? '' : ' — ' + JSON.stringify({ lesson: r.lesson, kept: r.kept, ...r.st, errors: r.errors }))));
const bad = records.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${records.length} cells fail` : `all ${records.length} cells pass`);
process.exit(bad ? 1 : 0);
