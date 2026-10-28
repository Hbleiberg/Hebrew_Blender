#!/usr/bin/env node
// S564 — the dashboard's holiday countdown, Shabbat times and Omer line follow a settings change that arrives through
// applySettings (a starter, a preset Load; a .ivrit file and a Schedule Sync period take the same path), as they follow
// their own switches. Fix 1c886d3: the General starter kept a Chanukah countdown it turns off, a preset kept the
// Shabbat times it hides, the Omer line stayed up.
//
//   node scripts/loop/probes/S564-dashboard-calendar-lines-follow-settings.mjs          exit 1 on a line out of step
//   --json prints the record.
//
// Serves the repo root in-process; Hebcal and Open-Meteo are answered with canned JSON (the page's own parsers read
// them), every other foreign origin aborted, service workers blocked. Two dates: a Chanukah countdown day and an Omer
// day. The control arm is the drawer's own switches (a real click on each slider), which must hide and show the lines.
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

// A line up that its setting turns off is always wrong; a line down that its setting wants is wrong only where that
// date has one to show (the countdown on the Chanukah date, the Omer line on the Omer date, Shabbat times on both).
async function run(fakeNow, canShow) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(now => {
    const off = new Date(now).getTime() - Date.now(), RD = Date;
    window.Date = class extends RD { constructor(...a) { a.length ? super(...a) : super(RD.now() + off); } static now() { return RD.now() + off; } };
  }, fakeNow);
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    const f = FAKE(u);
    return f ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(f), headers: { 'access-control-allow-origin': '*' } }) : r.abort();
  });
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('frModal').classList.contains('open'), null, { timeout: 20000 });
  const read = () => page.evaluate(() => {
    const on = id => { const e = document.getElementById(id); return getComputedStyle(e).display !== 'none' && e.offsetHeight > 0; };
    return { holiday: on('holidayCountdown'), shabbat: on('shabbatTimes'), omer: on('omerPanel'),
      want: { holiday: settings.showHolidayCountdown !== false, shabbat: settings.showShabbatTimes !== false, omer: settings.showOmerCounter !== false } };
  });
  const out = {};
  const starter = async n => { await page.click(`#frStarters .fr-starter:nth-child(${n})`); await page.waitForTimeout(800); };
  const slider = id => page.click(`label.toggle:has(#${id}) .slider`);
  await page.fill('#frLocationInput', 'Chicago');
  await starter(1); out.hebrewStarter = await read();                       // all three on
  await page.click('#gearBtn'); await page.waitForTimeout(250); await page.click('#dashTabPresets');
  await page.click('#starterLayoutsBtn'); await page.waitForTimeout(300); await starter(3); out.generalStarter = await read();   // all three off
  await page.click('#starterLayoutsBtn'); await page.waitForTimeout(300); await starter(1); out.hebrewAgain = await read();
  await page.click('#dashTabCalendar'); await slider('showHolidayCountdown'); await slider('showShabbatTimes'); await page.waitForTimeout(400);
  out.controlOff = await read();                                            // the control: the switches themselves
  await page.click('#dashTabPresets'); await page.fill('#presetName', 'Quiet'); await page.click('#savePresetBtn');
  await page.click('#dashTabCalendar'); await slider('showHolidayCountdown'); await slider('showShabbatTimes'); await page.waitForTimeout(600);
  out.controlOn = await read();
  await page.click('#dashTabPresets');
  let loaded = false;
  for (const b of await page.$$('#presetList button')) {
    if ((await b.innerText()).trim() !== 'Load') continue;
    if (/Quiet/.test(await b.evaluate(x => (x.closest('[data-name]') || x.parentElement).innerText))) { await b.click(); loaded = true; break; }
  }
  await page.waitForTimeout(700); out.loadQuiet = await read();
  await browser.close();
  const bad = Object.entries(out).flatMap(([arm, s]) => ['holiday', 'shabbat', 'omer']
    .filter(k => (s[k] && !s.want[k]) || (!s[k] && s.want[k] && canShow.includes(k))).map(k => `${arm}.${k}`));
  return { fakeNow, out, bad, loaded, errors };
}
const records = [await run('2026-10-28T09:10:00', ['holiday', 'shabbat']), await run('2027-04-28T09:10:00', ['shabbat', 'omer'])];
server.close();
// The control must have fired: the switches hid and re-showed the countdown on the Chanukah date.
const c = records[0].out;
const controlFired = c.controlOff.holiday === false && c.controlOn.holiday === true && c.hebrewStarter.omer === false && records[1].out.hebrewStarter.omer === true;
const fail = !controlFired || records.some(r => r.bad.length || r.errors.length || !r.loaded);
if (JSON_OUT) console.log(JSON.stringify({ controlFired, records }, null, 1));
else records.forEach(r => console.log(`${r.fakeNow}: ${r.bad.length ? 'OUT OF STEP ' + r.bad.join(', ') : 'every line follows its setting'}${r.errors.length ? ' | pageerrors ' + r.errors.length : ''}${r.loaded ? '' : ' | preset Load not found'}`));
if (!controlFired) console.log('control did not fire: the switches did not hide/show the lines, or the Omer date did not show the counter');
process.exit(fail ? 1 : 0);
