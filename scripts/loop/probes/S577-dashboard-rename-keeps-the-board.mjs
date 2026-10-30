#!/usr/bin/env node
// S577 — Dashboard: renaming the preset that is on now leaves the board as it is. A week with "Math" on Wednesday
// 10:00–11:00 (its message MATHTEXT) and Thursday 11:00, the clock frozen at Wednesday 10:15, Schedule Sync on, a note
// typed on the board; the preset renamed by its row's rename button (the prompt answered), the board read after the
// 30 s tick (clock.runFor).
//
//   node scripts/loop/probes/S577-dashboard-rename-keeps-the-board.mjs     exit 1 unless: the note survives the tick
//          after "Math" (on now) is renamed "Maths", and after "Reading" (not on now) is renamed; the week's cells
//          follow the new name; the next run of the renamed preset (Thursday 11:00) still applies it on its tick;
//          0 page errors
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before this fix re-applies
//   MATHTEXT over the note at the tick after the rename); --json prints the record.
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
let answer = null; let prompts = 0;
page.on('dialog', d => { if (d.type() === 'prompt') { prompts++; return d.accept(answer); } return d.accept(); });
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
const note = async (text) => { await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.click('#dashEditPencil'); await page.keyboard.press('Control+A'); await page.keyboard.type(text); await page.keyboard.press('Escape'); await page.waitForTimeout(300); };
const rename = async (from, to) => {
  await drawer();
  const title = await page.evaluate(() => I18n.t('dashboard.preset.rename_title'));
  const btn = page.locator(`#presetList [data-ft-item="${from}"] button[title="${title}"]`);
  if (!(await btn.count())) throw new Error(`no rename button on the "${from}" row`);
  answer = to; const before = prompts; await btn.click(); await page.waitForTimeout(300);
  if (prompts !== before + 1) throw new Error('the rename prompt never opened');
};
const rec = []; let fails = 0;
const check = (name, ok, note) => { rec.push({ name, ok, note }); if (!ok) fails++; if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}  ${note}`); };
await drawer(); await page.locator('label.toggle:has(#scheduleEnabled)').click(); await page.waitForTimeout(300);
let now = await board(); check('Schedule Sync on: the period on now is up (precondition)', now === 'MATHTEXT', `board: ${now}`);
await note('MY NOTE');
await rename('Reading', 'Reading 2'); await tick();
now = await board(); check('renaming a preset that is not on now leaves the note through the tick', now === 'MY NOTE', `board: ${now}`);
await rename('Math', 'Maths'); await tick();
now = await board(); check('renaming the preset on now leaves the note through the tick', now === 'MY NOTE', `board: ${now}`);
const cells = await page.evaluate(() => JSON.stringify([settings.scheduleWeek.cells.wed[0], settings.scheduleWeek.cells.thu[1], Object.keys(presets).sort()]));
check("the week's cells and the store follow the new name", cells === JSON.stringify(['Maths', 'Maths', ['Maths', 'Reading 2']]), cells);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.clock.fastForward(Date.parse('2026-10-29T11:00:05') - (await page.evaluate(() => Date.now()))); await tick();   // a day on: fastForward fires each due timer once
now = await board(); check("the renamed preset's next run (Thursday 11:00) still applies it on its tick", now === 'MATHTEXT', `board: ${now}`);
check('no page error', errs.length === 0, errs.join(' | '));
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(fails ? `${fails} check(s) fail` : 'all checks pass');
process.exit(fails ? 1 : 0);
