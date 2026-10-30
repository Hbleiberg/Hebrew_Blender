#!/usr/bin/env node
// S576 — Dashboard: a Schedule Sync edit reaches the board at once, and an edit that does not change the period on
// now leaves the board's text alone. A week with "Math" on Wednesday 10:00–11:00 (its message MATHTEXT; "Reading"
// holds READTEXT), the clock frozen at Wednesday 10:15, every step a real click; the board read at once and again
// after the 30 s tick (clock.runFor).
//
//   node scripts/loop/probes/S576-dashboard-schedule-edit-reaches-board.mjs     exit 1 unless: Enable Schedule Sync
//          puts MATHTEXT up at once; painting the period on now with Reading and closing the editor puts READTEXT up
//          at once; a note typed on the board survives a paint of Thursday's period, and a live language switch,
//          through the tick; the 11:00 boundary still applies Wednesday's next period on its tick; 0 page errors
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before 3b031f01 waits for the
//   tick and replaces the note); --json prints the record.
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
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
await ctx.addInitScript(() => { if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1'); localStorage.setItem('hebrewDashboard_tourSeen', '1'); localStorage.setItem('hebrewDashboard_setupSeen', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); });
const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
page.on('dialog', d => d.accept());
await page.clock.install({ time: new Date('2026-10-28T10:15:00') });
await page.clock.pauseAt(new Date('2026-10-28T10:15:05'));
const settle = async () => { await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 30000 }); await page.evaluate(() => I18n.ready); await page.waitForTimeout(800); };
await page.goto(base + '/classroom_dashboard.html', { waitUntil: 'load' }); await settle();
await page.evaluate(() => {
  const b = getSettings({ forPreset: true });
  const mk = t => Object.assign(JSON.parse(JSON.stringify(b)), { dashTextHTML: t, enableDashText: true });
  localStorage.setItem('hebrewDashboard_presets', JSON.stringify({ Math: mk('MATHTEXT'), Reading: mk('READTEXT') }));
  const cells = { sun: [null, null], mon: [null, null], tue: [null, null], wed: ['Math', null], thu: [null, 'Math'], fri: [null, null], sat: [null, null] };
  settings.scheduleWeek = { v: 1, periods: [{ start: '10:00', end: '11:00' }, { start: '11:00', end: '12:00' }], weekend: false, cells };
  settings.scheduleEnabled = false; settings.enableDashText = true;
  saveSettingsToStorage();
});
await page.reload({ waitUntil: 'load' }); await settle();
const board = () => page.evaluate(() => document.getElementById('dashTextDisplay').innerText.trim().slice(0, 40));
const tick = async () => { await page.clock.runFor(31000); await page.waitForTimeout(200); };
const drawer = async () => { if (!(await page.locator('#settingsModal.open').count())) { await page.click('#gearBtn'); await page.waitForTimeout(300); } await page.click('#dashTabPresets'); await page.waitForTimeout(200); };
const paint = async (preset, day, period) => {
  await drawer(); await page.click('#swmOpenBtn'); await page.waitForTimeout(300);
  await page.locator('#swmModal .swm-chip-arm', { hasText: preset }).first().click();
  await page.click(`#swmGrid .swm-cell[data-day="${day}"][data-period="${period}"]`);
  await page.click('#swmModal .fr-close'); await page.waitForTimeout(300);
};
const note = async (text) => { await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.click('#dashEditPencil'); await page.keyboard.press('Control+A'); await page.keyboard.type(text); await page.keyboard.press('Escape'); await page.waitForTimeout(300); };
const rec = []; let fails = 0;
const check = (name, ok, note) => { rec.push({ name, ok, note }); if (!ok) fails++; if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}  ${note}`); };
await drawer(); await page.locator('label.toggle:has(#scheduleEnabled)').click(); await page.waitForTimeout(300);
let now = await board(); check('Enable Schedule Sync during a period applies it at once', now === 'MATHTEXT', `board: ${now}`);
await paint('Reading', 3, 0);
now = await board(); check('painting the period on now applies it as the editor closes', now === 'READTEXT', `board: ${now}`);
await note('MY NOTE');
await paint('Reading', 4, 1); await tick();
now = await board(); check("a paint of Thursday's period leaves the board's note through the tick", now === 'MY NOTE', `board: ${now}`);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.selectOption('.i18n-select', 'he'); await page.waitForFunction(() => document.documentElement.lang === 'he'); await tick();
now = await board(); check('a live language switch leaves the note through the tick', now === 'MY NOTE', `board: ${now}`);
await page.selectOption('.i18n-select', 'en'); await page.waitForTimeout(300);
await paint('Math', 3, 1);
await page.clock.runFor(Date.parse('2026-10-28T11:00:20') - (await page.evaluate(() => Date.now()))); await page.waitForTimeout(300);
now = await board(); check('the 11:00 boundary applies the next period on its tick', now === 'MATHTEXT', `board: ${now}`);
check('no page error', errs.length === 0, errs.join(' | '));
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(fails ? `${fails} check(s) fail` : 'all checks pass');
process.exit(fails ? 1 : 0);
