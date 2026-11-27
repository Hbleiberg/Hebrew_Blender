#!/usr/bin/env node
// S685 — the dark toggle's label on a dark visit, before the locale has loaded. The 15 pages with a labelled toggle
// set it at DOMContentLoaded through I18n.t(), which returned the raw key until the locale landed — the markup's "Dark"
// became "shared.darkmode.label_light" for the length of the locale fetch on every first dark visit, and for good when
// that fetch failed. js/i18n.js now answers those two keys in English until a locale has loaded.
// Cells: every root page with a .hi-lbl in its dark toggle × EN / HE × the locale held 1.2 s / the locale failing.
// A cell passes when the label reads "Light" while held or failed, the locale's own word once it lands ("Light" /
// "בהיר"), and the other word after a real click on the toggle ("Dark" / "כהה"). Counted: the locale requests, the
// carriers found (a page whose toggle has no label is skipped; 0 carriers fails).
//
//   node scripts/loop/probes/S685-dark-label-before-the-locale.mjs   exit 1 on a raw key, a wrong word or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S685 fails every held and
//   failed cell). --json prints the record.
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
const PAGES = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !/test/.test(f)).sort();
const WORD = { en: { light: 'Light', dark: 'Dark' }, he: { light: 'בהיר', dark: 'כהה' } };
const browser = await chromium.launch();
const records = []; let fails = 0, errors = 0, localeHits = 0; const carriers = new Set();
for (const file of PAGES) for (const lang of ['en', 'he']) for (const mode of ['held', 'failed']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', colorScheme: 'dark' });
  await ctx.addInitScript(([lang]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', '1'); }, [lang]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  let release; const gate = new Promise(r => release = r);
  await page.route('**/*', async r => { const u = r.request().url();
    if (/\/locales\/[a-z]+\.json/.test(u)) { localeHits++; if (mode === 'failed') return r.abort(); await gate; return r.continue(); }
    return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/' + file, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1200);
  const label = () => page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.querySelector('.hi-moon') && x.querySelector('.hi-lbl'));
    return b ? b.querySelector('.hi-lbl').textContent.trim() : null; });
  const before = await label();
  if (before === null) { await ctx.close(); continue; }
  carriers.add(file);
  release(); await page.waitForTimeout(mode === 'failed' ? 300 : 1500);
  const loaded = await label();
  let clicked = null;
  if (mode === 'held') { await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));   // the Font Maker's wizard
    await page.locator('button:has(.hi-moon):has(.hi-lbl)').first().click(); await page.waitForTimeout(150); clicked = await label(); }
  const ok = before === 'Light' && (mode === 'failed' ? loaded === 'Light' : loaded === WORD[lang].light && clicked === WORD[lang].dark);
  if (!ok) fails++;
  records.push({ file, lang, mode, before, loaded, clicked, ok });
  if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${file.padEnd(30)} ${lang} ${mode.padEnd(6)} before «${before}» loaded «${loaded}»${clicked !== null ? ` clicked «${clicked}»` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors, localeHits, carriers: [...carriers] }, null, 1));
const pass = !fails && !errors && carriers.size > 0 && localeHits > 0;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.length - fails}/${records.length} cells on ${carriers.size} pages keep a word in the dark toggle; ${errors} page errors; locale requests ${localeHits}`);
process.exit(pass ? 0 : 1);
