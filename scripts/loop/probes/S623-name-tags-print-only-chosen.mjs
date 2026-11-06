#!/usr/bin/env node
// S623 — Name Tags prints only the students chosen (micro-feature, gate 1; the S551 seed): a Print box per row (ticked by
// default) leaves a student out of the preview and the print for this session; the header box ticks or clears every
// row (a mixed box ticks everyone back on first) and reads mixed while some are out; the preview's note says "Printing n of m"; nothing is saved (a reload prints
// everyone and the stored list is byte-identical).
//
//   node scripts/loop/probes/S623-name-tags-print-only-chosen.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S623 fails: there are no boxes); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const CLASS = { 'My class': { v: 1, rows: [['שִׁירָה', 'Shira'], ['דָּוִד', 'David'], ['נֹעַם', 'Noam'], ['תָּמָר', 'Tamar'], ['יוֹנָתָן', 'Yonatan'], ['רוּת', 'Ruth']].map(([he, en]) => ({ he, en })), extra: '' } };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, cls]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1'); if (!sessionStorage.getItem('__seeded')) { localStorage.setItem('hebrewNameTags_lists', JSON.stringify(cls)); localStorage.setItem('hebrewNameTags_activeList', 'My class'); sessionStorage.setItem('__seeded', '1'); } window.__prints = 0; window.print = () => { window.__prints++; }; }, [cell.lang, cell.dark, CLASS]);
  const load = async () => { await page.goto(base + '/name_tags.html', { waitUntil: 'domcontentloaded' }); await page.waitForFunction(() => window.I18n && document.querySelectorAll('#ntRows tr').length >= 6 && document.querySelectorAll('#ntPreview .nt-tag').length > 0); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(500); };
  await load();
  const stored = await page.evaluate(() => localStorage.getItem('hebrewNameTags_lists'));
  const st = async () => page.evaluate(() => { const boxes = [...document.querySelectorAll('#ntRows [data-print]')]; const all = document.getElementById('ntPrintAll');
    return { boxes: boxes.length, on: boxes.filter(b => b.checked).length, all: all ? (all.indeterminate ? 'mixed' : all.checked ? 'on' : 'off') : null, allName: all ? all.getAttribute('aria-label') : null,
      tags: document.querySelectorAll('#ntPreview .nt-frame:not(.nt-sample) .nt-tag').length, sample: document.querySelectorAll('#ntPreview .nt-sample').length, note: document.getElementById('ntPrintNote').textContent.trim(), printable: typeof ntPrintableRows === 'function' ? ntPrintableRows().length : null, prints: window.__prints, stored: localStorage.getItem('hebrewNameTags_lists') }; });
  const step = async (name, fn, check) => { try { if (fn) await fn(); } catch (e) { fail++; record.push({ cell: cell.lang, name, ok: false, error: String(e).split('\n')[0] }); if (!JSON_OUT) console.log(`✘ ${cell.lang} ${cell.w} — ${name}: ${String(e).split('\n')[0]}`); return null; } await page.waitForTimeout(350); const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r: { ...r, stored: undefined } }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify({ ...r, stored: undefined })}`); return r; };
  await step('1 six named boxes, all ticked, the header ticked, six tags, no note', null, r => r.boxes === 6 && r.on === 6 && r.all === 'on' && /\S/.test(r.allName || '') && r.tags === 6 && r.note === '');
  await step('2 unticking two students leaves four tags, a "4 of 6" note and a mixed header', async () => { await page.click('#ntRows [data-print="1"]'); await page.click('#ntRows [data-print="4"]'); }, r => r.on === 4 && r.tags === 4 && r.all === 'mixed' && /4/.test(r.note) && /6/.test(r.note) && r.printable === 4);
  await step('3 Print prints the four', async () => { await page.click('#ntPrintBtn'); }, r => r.prints === 1 && r.printable === 4);
  await step('4 the mixed header box ticks everyone back on', async () => { await page.click('#ntPrintAll'); }, r => r.on === 6 && r.all === 'on' && r.tags === 6 && r.note === '');
  await step('5 the header box off: nobody prints, the sample shows, Print refuses', async () => { await page.click('#ntPrintAll'); await page.waitForTimeout(400); await page.click('#ntPrintBtn', { force: true }); }, r => r.on === 0 && r.all === 'off' && r.printable === 0 && r.sample > 0 && r.prints === 1 && /\S/.test(r.note));
  await step('6 the header box on: all six again', async () => { await page.click('#ntPrintAll'); }, r => r.on === 6 && r.all === 'on' && r.tags === 6 && r.note === '');
  await step('7 a reload prints everyone and the stored list is unchanged', async () => { await page.click('#ntRows [data-print="2"]'); await load(); }, r => r.on === 6 && r.tags === 6 && r.stored === stored);
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
