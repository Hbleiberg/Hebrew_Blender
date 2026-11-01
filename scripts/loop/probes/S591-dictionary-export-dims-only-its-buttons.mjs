#!/usr/bin/env node
// S591 — Dictionary: while Export Selected Words is inactive (Bulk Copy Mode off, or nothing picked), only its two
// buttons dim, and they say so (aria-disabled). The whole box used to dim to opacity .5, so the "0 words selected"
// count and the Anki / Quizlet instructions read 2.12:1 light / 2.38:1 dark, which is live text that nothing marked
// inactive. The buttons, at 2.87:1 / 4.10:1, were live and unmarked too. A press of a dimmed button still explains
// itself in the error line, as before. Every foreign origin is aborted; real clicks and a real mouse throughout.
//
//   node scripts/loop/probes/S591-dictionary-export-dims-only-its-buttons.mjs   exit 1 when, in EN/HE × light/dark:
//     A  inactive, a button lacks aria-disabled="true" or opacity .5, or the count or the instructions read under 4.5:1;
//     B  a press of the inactive Anki button downloads, or writes no error;
//     C  with Bulk Copy Mode on and one word picked, a button keeps aria-disabled="true" or its dim, or Quizlet does
//        not download a .csv;
//     D  Bulk Copy Mode off again does not mark both buttons inactive;
//   or on a page error. ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the
//   S591 fix fails A in all four cells); --json prints the record.
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
// Text contrast with every translucent layer composited (opacity on the element and its ancestors, then each tinted
// background down to the first opaque one).
const READ = () => {
  const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = el => {
    let fg = parse(getComputedStyle(el).color); let o = 1; for (let e = el; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; fg = { ...fg, a: fg.a * o };
    const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
    let bg = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    const x = lum(over(fg, bg)), y = lum(bg); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2);
  };
  const box = document.getElementById('exportBox'); const bs = [...box.querySelectorAll('button')];
  const note = [...box.children].find(d => d.matches('[data-i18n="dictionary.export.instructions"]'));
  return { aria: bs.map(b => b.getAttribute('aria-disabled')), opacity: bs.map(b => +getComputedStyle(b).opacity), count: ratio(document.getElementById('exportCount')), note: ratio(note) };
};
async function cell(lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: dark ? 800 : 1280, height: 900 }, serviceWorkers: 'block', acceptDownloads: true });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [lang, dark]);
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  const page = await ctx.newPage(); let errors = 0; page.on('pageerror', () => errors++);
  let downloads = []; page.on('download', d => downloads.push(d.suggestedFilename()));
  await page.goto(BASE + '/hebrew_dictionary.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('.word-card').length > 5, null, { timeout: 20000 });
  await page.click('#panelAdvanced .panel-title'); await page.click('#copyOptsSec .adv-section-title');
  await page.locator('#exportBox').scrollIntoViewIfNeeded();
  const r = { lang, theme: dark ? 'dark' : 'light' };
  const a = await page.evaluate(READ);
  r.A = { ...a, ok: a.aria.every(v => v === 'true') && a.opacity.every(v => v === 0.5) && a.count >= 4.5 && a.note >= 4.5 };
  await page.locator('#exportBox button').first().click({ force: true }); await page.waitForTimeout(400);   // force: Playwright won't press an aria-disabled button; a mouse does
  r.B = { err: (await page.textContent('#exportErr')).trim(), downloads: downloads.length }; r.B.ok = !!r.B.err && r.B.downloads === 0;
  await page.click('#bulkModeCb'); await page.locator('.word-card').first().click(); await page.waitForTimeout(300);
  const c = await page.evaluate(READ);
  await page.locator('#exportBox button').nth(1).click(); await page.waitForTimeout(800);
  r.C = { aria: c.aria, opacity: c.opacity, file: downloads[0] || null }; r.C.ok = c.aria.every(v => v === 'false') && c.opacity.every(v => v === 1) && /\.csv$/.test(r.C.file || '');
  await page.click('#bulkModeCb'); await page.waitForTimeout(300);
  const d = await page.evaluate(READ); r.D = { aria: d.aria, ok: d.aria.every(v => v === 'true') };
  r.errors = errors; r.ok = errors === 0 && ['A', 'B', 'C', 'D'].every(k => r[k].ok);
  await ctx.close();
  return r;
}
const browser = await chromium.launch();
const records = [];
for (const lang of ['en', 'he']) for (const dark of [false, true]) records.push(await cell(lang, dark));
await browser.close(); server.close();
const pass = records.every(r => r.ok);
if (JSON_OUT) console.log(JSON.stringify({ pass, records }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.lang} ${r.theme} ${JSON.stringify({ A: r.A, B: r.B, C: r.C, D: r.D })} errors ${r.errors}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} cells — inactive, only the export buttons dim (aria-disabled); the count and instructions read at AA`);
}
process.exit(pass ? 0 : 1);
