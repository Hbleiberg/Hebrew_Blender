#!/usr/bin/env node
// S564 — in Full Screen the dashboard's board message stays on the screen and the clock and Hebrew date keep to one line
// on a short or 4:3 screen (fix 1966781). Before it, the center card stretched to the tallest rail and centred its text
// there, and a 1024×768 projector's 300px column wrapped the clock and the date: the message sat below the screen.
//
//   node scripts/loop/probes/S564-dashboard-fullscreen-fits-the-screen.mjs     exit 1 when a message leaves the screen
//   --json prints the record.
//
// Serves the repo root in-process (foreign origins answered with canned weather/Hebcal JSON or aborted, service workers
// blocked). Two boards by real clicks — the General starter with a field-trip countdown, the Hebrew classroom starter —
// each with the picker and timer on and a two-sentence message, entered into Full Screen by the header button. The
// control: at 1920×1080 the card keeps (within 10px) the rails' height, as it did, and windowed layouts are untouched.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const FAKE = u =>
  u.includes('geocoding-api.open-meteo.com') ? { results: [{ name: 'Chicago', latitude: 41.85, longitude: -87.65, country: 'United States', timezone: 'America/Chicago' }] }
  : u.includes('api.open-meteo.com') ? { current: { temperature_2m: 12, weathercode: 3 }, daily: { temperature_2m_max: [15], temperature_2m_min: [6] } }
  : u.includes('hebcal.com/shabbat') ? { items: [{ category: 'candles', title: 'Candle lighting', date: '2026-10-30T17:31:00-05:00' }, { category: 'havdalah', title: 'Havdalah', date: '2026-10-31T18:33:00-05:00' }] }
  : u.includes('hebcal.com/hebcal') ? { items: [{ title: 'Chanukah: 1 Candle', date: '2026-12-04', category: 'holiday', subcat: 'major' }] }
  : null;

async function board(starterN, w, h) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => {
    const off = new Date('2026-10-28T09:12:00').getTime() - Date.now(), RD = Date;
    window.Date = class extends RD { constructor(...a) { a.length ? super(...a) : super(RD.now() + off); } static now() { return RD.now() + off; } };
  });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    const f = FAKE(u);
    return f ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(f), headers: { 'access-control-allow-origin': '*' } }) : r.abort();
  });
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('frModal').classList.contains('open'), null, { timeout: 20000 });
  await page.fill('#frLocationInput', 'Chicago');
  await page.click(`#frStarters .fr-starter:nth-child(${starterN})`); await page.waitForTimeout(600);
  await page.click('#gearBtn'); await page.waitForTimeout(250);
  await page.click('#dashTabCalendar'); await page.fill('#eventTitleInput', 'Field trip to the zoo'); await page.fill('#eventDateInput', '2026-11-02');
  await page.click('#dashTabClass');
  if (!(await page.isChecked('#showStudentPicker'))) await page.click('label.toggle:has(#showStudentPicker) .slider');
  if (!(await page.isChecked('#showTimer'))) await page.click('label.toggle:has(#showTimer) .slider');
  await page.click('#settingsModal .settings-close:not(#drawerDarkBtn)'); await page.waitForTimeout(300);
  await page.click('#dashEditPencil'); await page.keyboard.press('Control+A');
  await page.keyboard.type("Riddle: What has keys but can't open locks? A piano!");
  await page.click('#inplaceToolbar .ed-btn:last-child'); await page.waitForTimeout(200);
  const measure = () => page.evaluate(() => {
    scrollTo(0, 0);
    const lines = id => { const e = document.getElementById(id); if (!e || !e.offsetHeight) return 0; const lh = parseFloat(getComputedStyle(e).fontSize) * 1.25; return Math.round(e.getBoundingClientRect().height / lh); };
    const msg = document.getElementById('dashTextDisplay').getBoundingClientRect();
    return { msgBottom: Math.round(msg.bottom), innerH: innerHeight, clockLines: lines('currentTime'),
      center: Math.round(document.querySelector('.dash-center').getBoundingClientRect().height), rail: Math.round(document.getElementById('zoneRight').getBoundingClientRect().height) };
  });
  const windowed = await measure();
  await page.click('#fsBtn'); await page.waitForTimeout(900);
  const full = await measure();
  await browser.close();
  return { board: starterN === 3 ? 'general' : 'hebrew', size: `${w}x${h}`, windowed, full, errors };
}
const recs = [];
for (const n of [3, 1]) for (const [w, h] of [[1024, 768], [1280, 720], [1920, 1080]]) recs.push(await board(n, w, h));
server.close();
const bad = recs.flatMap(r => {
  const out = [];
  if (r.full.msgBottom > r.full.innerH) out.push(`${r.board} ${r.size}: message ends at ${r.full.msgBottom} on a ${r.full.innerH}px screen`);
  if (r.size !== '1920x1080' && r.full.clockLines > 1) out.push(`${r.board} ${r.size}: the clock takes ${r.full.clockLines} lines`);
  if (r.size === '1920x1080' && r.full.rail - r.full.center > 10) out.push(`${r.board} 1920x1080 (control): the card is ${r.full.rail - r.full.center}px shorter than the rails`);
  if (r.errors.length) out.push(`${r.board} ${r.size}: ${r.errors.length} pageerrors`);
  return out;
});
if (JSON_OUT) console.log(JSON.stringify(recs, null, 1));
else recs.forEach(r => console.log(`${r.board.padEnd(7)} ${r.size.padEnd(9)} full screen: message ends ${r.full.msgBottom}/${r.full.innerH}, clock ${r.full.clockLines} line(s), card ${r.full.center} / rails ${r.full.rail}`));
bad.forEach(b => console.log('FAIL ' + b));
process.exit(bad.length ? 1 : 0);
