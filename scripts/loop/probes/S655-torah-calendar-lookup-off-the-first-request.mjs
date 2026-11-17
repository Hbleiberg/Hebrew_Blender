#!/usr/bin/env node
// S655 — the Torah Trainer: the Calendar tab's date lookup is drawn when that tab opens, not during init. Its date line's
// toLocaleDateString is the page's only date format on a visit, and the first one loads the locale's date data
// (36–67 ms at 4× CPU); init drew the lookup, for a tab that is hidden at load, before the reading's Sefaria request
// went out — and its DOM writes left the style dirty, so staffInitWatchers' document.fonts.ready read forced a recalc
// there too.
//
//   node scripts/loop/probes/S655-torah-calendar-lookup-off-the-first-request.mjs
//   EN light 1280 / HE dark 800, Sefaria stubbed, every other foreign origin aborted, SW blocked: exit 1 when a date is
//   formatted before the reading's request starts, when the Calendar tab opens without its result or its Open row,
//   when the result is written while its panel shows (its aria-live region would announce on opening), or on a page
//   error. ROOT=<a git archive of the tree> runs another copy (the tree before S655 fails 2: one date formatted before
//   the request in each cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const HEB = ['וַיֵּצֵא יַעֲקֹב מִבְּאֵר שָׁבַע וַיֵּלֶךְ חָרָנָה', 'וַיִּפְגַּע בַּמָּקוֹם וַיָּלֶן שָׁם כִּי בָא הַשֶּׁמֶשׁ'];
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  let sefaria = 0;
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) { sefaria++; return r.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ versions: [{ language: 'he', text: HEB }] }) }); }
    (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort();
  });
  await page.addInitScript(([lang, dark]) => {
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1');
    window.__fmt = []; const rec = () => window.__fmt.push(performance.now());
    const d = Date.prototype.toLocaleDateString; Date.prototype.toLocaleDateString = function (...a) { rec(); return d.apply(this, a); };
    const D = Intl.DateTimeFormat; Intl.DateTimeFormat = function (...a) { rec(); return new D(...a); }; Intl.DateTimeFormat.prototype = D.prototype; Intl.DateTimeFormat.supportedLocalesOf = D.supportedLocalesOf;
  }, [cell.lang, cell.dark]);
  await page.goto(base + '/torah_trainer.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('[data-vk]'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const start = await page.evaluate(() => { const e = performance.getEntriesByType('resource').find(x => x.name.includes('sefaria.org/api/v3/texts/')); return e ? e.startTime : null; });
  const early = await page.evaluate(s => window.__fmt.filter(t => t <= s).length, start);
  ok(sefaria > 0 && start !== null, `${L} the reading came from the stubbed request (${sefaria} hit${sefaria === 1 ? '' : 's'})`);
  ok(early === 0, `${L} dates formatted before the reading's request: ${early}`);
  await page.evaluate(() => {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    window.__draws = []; const el = document.getElementById('lookupResult'), panel = document.getElementById('ttTabPanelCalendar');
    const desc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    Object.defineProperty(el, 'textContent', { configurable: true, get() { return desc.get.call(this); }, set(v) { window.__draws.push(panel.hidden); desc.set.call(this, v); } });
  });
  await page.click('#gearBtn'); await page.waitForTimeout(300);
  await page.click('#ttTabCalendar'); await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ res: document.getElementById('lookupResult').innerText.trim().replace(/\s+/g, ' '), open: !document.getElementById('lookupOpenRow').hidden, draws: window.__draws }));
  ok(r.res.length > 20 && r.open, `${L} the Calendar tab opens with its result «${r.res.slice(0, 70)}…» and its Open row (${r.open})`);
  ok(r.draws.every(h => h === true), `${L} the result is written only while its panel is hidden (${JSON.stringify(r.draws)})`);
  ok(errors.length === 0, `${L} 0 page errors ${errors.slice(0, 2).join(' | ')}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
