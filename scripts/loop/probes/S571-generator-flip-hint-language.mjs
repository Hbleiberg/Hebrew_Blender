#!/usr/bin/env node
// S571 — Generator, Real Words Self-Check: each vocab card's "tap to flip" speaks the interface's language. It was an
// English literal in the builder's template, out of check-i18n's reach, so the Hebrew UI drew it in English beside its
// translated siblings.
//
//   node scripts/loop/probes/S571-generator-flip-hint-language.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before c563fb2e fails every cell);
//   --json prints the record.
//
// Cells EN/HE × light/dark × 1280/800: Real Words → Self-Check → Generate by real clicks, every card's hint read; then the
// header's language switch and Generate again (a worksheet string follows a switch at the next Generate, like its siblings).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const WANT = { en: 'tap to flip', he: 'הקישו כדי להפוך' };
const browser = await chromium.launch();
const records = [];
for (const [lang, dark, w] of [['en', 0, 1280], ['en', 1, 1280], ['en', 0, 800], ['en', 1, 800], ['he', 0, 1280], ['he', 1, 1280], ['he', 0, 800], ['he', 1, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', String(c.dark)); localStorage.setItem('hebrewBlender_tourSeen', '1'); } }, { lang, dark });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelector('[data-type="realwords"]'), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.click('[data-type="realwords"]'); await page.waitForTimeout(500);
  await page.click('[data-drill="vocab"]'); await page.waitForTimeout(400);
  await page.locator('#generateBtn').click();
  await page.waitForFunction(() => document.querySelectorAll('#worksheet .rw-flip').length > 0, null, { timeout: 20000 });
  const hints = () => page.evaluate(() => { const h = [...document.querySelectorAll('#worksheet .rw-flip-hint')].map(e => e.textContent.trim()); return { n: h.length, uniq: [...new Set(h)] }; });
  const first = await hints();
  const other = lang === 'en' ? 'he' : 'en';
  await page.selectOption('[data-i18n-switcher] select', other); await page.waitForTimeout(1500);
  await page.locator('#generateBtn').click(); await page.waitForTimeout(1200);
  const after = await hints();
  const ok = first.n > 0 && first.uniq.length === 1 && first.uniq[0] === WANT[lang] && after.n > 0 && after.uniq.length === 1 && after.uniq[0] === WANT[other];
  records.push({ cell: `${lang} ${dark ? 'dark' : 'light'} ${w}`, first, switchedTo: other, after, ok, errors: errors.length });
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(14)} ${r.first.n} cards "${r.first.uniq.join('|')}" → ${r.switchedTo} "${r.after.uniq.join('|')}"  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
