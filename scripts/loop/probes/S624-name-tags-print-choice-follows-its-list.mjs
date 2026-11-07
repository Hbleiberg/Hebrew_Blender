#!/usr/bin/env node
// S624 — Name Tags' Print choice follows its list when the rows are read again (pass P on name_tags, a P4 found by its
// two-tab arm): another tab's edit of the list, a design change from another tab, and another list opened and this one
// back all re-read the store, which gave every row a new object and silently ticked everyone again ("Printing 2 of 4"
// gone). Now an unchanged row keeps its choice and a changed row prints (never a different student left out).
//
//   node scripts/loop/probes/S624-name-tags-print-choice-follows-its-list.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S624 fails steps 3–6 in both cells: 8); --json prints the record.
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
const room = (names) => ({ v: 1, rows: names.map(([he, en]) => ({ he, en })), extra: '' });
const LISTS = { 'Room 4': room([['שִׁירָה', 'Shira'], ['דָּוִד', 'David'], ['נֹעַם', 'Noam'], ['תָּמָר', 'Tamar']]), 'Room 5': room([['רוּת', 'Ruth'], ['יוֹנָתָן', 'Yonatan']]) };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark, lists]) => { if (!localStorage.getItem('__seeded')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1'); localStorage.setItem('hebrewNameTags_lists', JSON.stringify(lists)); localStorage.setItem('hebrewNameTags_activeList', 'Room 4'); localStorage.setItem('__seeded', '1'); } }, [cell.lang, cell.dark, LISTS]);
  const errors = [];
  const open = async () => { const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', e => errors.push(String(e))); await p.goto(base + '/name_tags.html', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.I18n && document.querySelectorAll('#ntRows [data-print]').length >= 4 && document.querySelectorAll('#ntPreview .nt-tag').length > 0); await p.evaluate(() => window.I18n.ready); await p.waitForTimeout(400); return p; };
  const A = await open();
  const st = async () => A.evaluate(() => { const boxes = [...document.querySelectorAll('#ntRows [data-print]')]; const all = document.getElementById('ntPrintAll');
    return { list: document.getElementById('ntListSel').value, on: boxes.map(b => b.checked ? 1 : 0).join(''), names: [...document.querySelectorAll('#ntRows input[data-f="en"]')].map(i => i.value).filter(Boolean).join(','), all: all ? (all.indeterminate ? 'mixed' : all.checked ? 'on' : 'off') : null,
      tags: document.querySelectorAll('#ntPreview .nt-frame:not(.nt-sample) .nt-tag').length, note: document.getElementById('ntPrintNote').textContent.trim(), printable: typeof ntPrintableRows === 'function' ? ntPrintableRows().map(r => r.en).join(',') : null }; });
  const step = async (name, fn, check) => { try { if (fn) await fn(); } catch (e) { fail++; record.push({ cell: cell.lang, name, ok: false, error: String(e).split('\n')[0] }); if (!JSON_OUT) console.log(`✘ ${cell.lang} ${cell.w} — ${name}: ${String(e).split('\n')[0]}`); return null; } await A.waitForTimeout(500); const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify(r)}`); return r; };
  await step('1 Room 4 open, four ticked, four tags', null, r => r.list === 'Room 4' && r.on === '1111' && r.tags === 4 && r.note === '');
  await step('2 David and Tamar unticked by clicks: two tags, a mixed header, "2 of 4"', async () => { await A.click('#ntRows [data-print="1"]'); await A.click('#ntRows [data-print="3"]'); }, r => r.on === '1010' && r.tags === 2 && r.all === 'mixed' && /2/.test(r.note) && /4/.test(r.note) && r.printable === 'Shira,Noam');
  // Another tab (same browser, same store) edits Noam's English name: the storage event re-reads the list in A.
  const B = await open();
  await step('3 another tab renames Noam to Noa: David and Tamar stay out, Noa prints', async () => { const c = B.locator('#ntRows input[data-f="en"][data-r="2"]'); await c.click(); await B.keyboard.press('End'); await B.keyboard.press('Backspace'); await B.keyboard.press('Tab'); await A.bringToFront(); await A.waitForFunction(() => [...document.querySelectorAll('#ntRows input[data-f="en"]')].some(i => i.value === 'Noa')); }, r => r.names === 'Shira,David,Noa,Tamar' && r.on === '1010' && r.tags === 2 && r.printable === 'Shira,Noa');
  // The other tab changes a design setting (Extra line on/off is a settings write): the settings adopt re-reads the list too.
  await step('4 another tab changes the design: the choice holds', async () => { await B.bringToFront(); await B.evaluate(() => { const s = JSON.parse(localStorage.getItem('hebrewNameTags_settings') || '{}'); s.__probe = Date.now(); localStorage.setItem('hebrewNameTags_settings', JSON.stringify(s)); }); await A.bringToFront(); }, r => r.on === '1010' && r.tags === 2);
  // A student the other tab changes that was out prints again (a changed row is a different row): Tamar → Tamara.
  await step('5 another tab edits Tamar (left out) to Tamara: she prints again, David stays out', async () => { await B.bringToFront(); const c = B.locator('#ntRows input[data-f="en"][data-r="3"]'); await c.click(); await B.keyboard.press('End'); await B.keyboard.type('a'); await B.keyboard.press('Tab'); await A.bringToFront(); await A.waitForFunction(() => [...document.querySelectorAll('#ntRows input[data-f="en"]')].some(i => i.value === 'Tamara')); }, r => r.on === '1011' && r.tags === 3 && r.printable === 'Shira,Noa,Tamara');
  await B.close();
  await step('6 Room 5 opened and Room 4 back: David still out', async () => { await A.selectOption('#ntListSel', 'Room 5'); await A.waitForTimeout(300); await A.selectOption('#ntListSel', 'Room 4'); }, r => r.list === 'Room 4' && r.on === '1011' && r.tags === 3);
  await step('7 a reload prints the class again', async () => { await A.reload({ waitUntil: 'domcontentloaded' }); await A.waitForFunction(() => document.querySelectorAll('#ntRows [data-print]').length >= 4 && document.querySelectorAll('#ntPreview .nt-tag').length > 0); }, r => r.on === '1111' && r.tags === 4 && r.note === '');
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
