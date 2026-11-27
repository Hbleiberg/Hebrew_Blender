#!/usr/bin/env node
// S685 — Flash Cards' drill and results screens end near the footer. main.wrap's 100px foot is the setup screen's
// (its sticky Start bar's −100px margin cancels it, so the bar reaches the wrap's edge); the card and results screens
// kept it and ended 140–150px above the footer (S683). Now only the setup screen carries it.
// By real clicks: Start, then End Practice Early; EN / HE × light / dark × 1280 / 800. Per screen the gap from the
// last visible box in the screen to the footer's top; the setup screen's Start bar's rect and its gap are recorded too.
// A cell passes when the card and results gaps are 40–96px (the other pages' range) and the setup screen's gap and Start bar match the control.
//
//   node scripts/loop/probes/S685-flash-screens-end-near-the-footer.mjs   exit 1 on a gap out of range or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S685 fails the card and
//   results gaps). SETUP_REF=<json from a control run's --json> compares the setup screen. --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const REF = process.env.SETUP_REF ? JSON.parse(fs.readFileSync(process.env.SETUP_REF, 'utf8')).records : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const gap = (page, id) => page.evaluate(id => {
  const s = document.getElementById(id); if (!s || !s.classList.contains('active')) return null;
  let bottom = -1; for (const e of s.querySelectorAll('*')) { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (r.height && r.width && cs.visibility !== 'hidden' && cs.position !== 'fixed') bottom = Math.max(bottom, r.bottom); }
  const f = document.querySelector('footer.site-footer').getBoundingClientRect().top;
  const cta = document.querySelector('.start-cta'); const c = cta && cta.getBoundingClientRect();
  return { gap: Math.round(f - bottom), cta: c && c.height ? [Math.round(c.top - f), Math.round(c.height)] : null };
}, id);
const browser = await chromium.launch();
const records = []; let fails = 0, errors = 0;
for (const lang of ['en', 'he']) for (const dark of [false, true]) for (const width of [1280, 800]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); }, [lang, dark]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  const setup = await gap(page, 'screenSetup');
  await page.click('#startBtn'); await page.waitForSelector('#screenCard.active'); await page.waitForTimeout(300);
  const card = await gap(page, 'screenCard');
  await page.click('#endEarlyBtn'); await page.waitForSelector('#screenResults.active'); await page.waitForTimeout(300);
  const results = await gap(page, 'screenResults');
  const ref = REF && REF.find(r => r.lang === lang && r.dark === dark && r.width === width);
  const setupSame = !ref || JSON.stringify(ref.setup) === JSON.stringify(setup);
  const ok = card && results && card.gap >= 40 && card.gap <= 96 && results.gap >= 40 && results.gap <= 96 && setupSame;
  if (!ok) fails++;
  records.push({ lang, dark, width, setup, card, results, setupSame, ok });
  if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${lang} ${dark ? 'dark ' : 'light'} ${width} setup gap ${setup.gap} bar ${JSON.stringify(setup.cta)}${ref ? (setupSame ? ' (= control)' : ' (≠ control)') : ''} · card ${card && card.gap} · results ${results && results.gap}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors }, null, 1));
const pass = !fails && !errors;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.length - fails}/${records.length} cells end the card and results screens near the footer; ${errors} page errors`);
process.exit(pass ? 0 : 1);
