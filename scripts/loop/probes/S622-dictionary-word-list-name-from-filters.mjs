#!/usr/bin/env node
// S622 — Save as Word List proposes a name read off the active filters (micro-feature, gate 1; the S440 seed): with
// no filter the name box stays empty; with a letter, one length and one era chosen the box reads
// "<letter> · <length label> · <era label>" in the UI's language; the theme path's own name still wins (the control).
//
//   node scripts/loop/probes/S622-dictionary-word-list-name-from-filters.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S622 fails step 2: the box is empty); --json prints the record.
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
for (const cell of (process.env.ONE ? [{ lang: 'en', dark: false, w: 1280 }] : [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }])) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 13000, null, { timeout: 60000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  // open a collapsed panel or section before clicking inside it
  const show = async sel => { await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return; const panel = el.closest('.panel'); if (panel && panel.classList.contains('collapsed')) panel.querySelector('.panel-title').click(); const adv = el.closest('.adv-section'); if (adv && adv.classList.contains('collapsed')) adv.querySelector('.adv-section-title').click(); const sec = el.closest('.pos-sec'); if (sec && !sec.classList.contains('open')) sec.querySelector('.pos-sec-hdr').click(); el.scrollIntoView({ block: 'center' }); }, sel); await page.waitForTimeout(150); };
  const click = async sel => { await show(sel); await page.click(sel); await page.waitForTimeout(250); };
  const openSave = async () => { const on = await page.evaluate(() => document.getElementById('bulkModeCb').checked); if (!on) await click('#bulkModeCb'); await click('button[onclick="selectAllMatching()"]'); await click('#wlSaveBtn'); await page.waitForSelector('#wlNewName', { timeout: 5000 }); };
  const closeSave = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); if (await page.$('#wlNewName')) await page.evaluate(() => { if (typeof closeWordModal === 'function') closeWordModal(); }); await page.waitForTimeout(150); };
  const st = async () => page.evaluate(() => {
    const box = document.getElementById('wlNewName');
    const lab = sel => { const c = document.querySelector(sel); const s = c && c.parentElement.querySelector('span'); return s ? s.textContent.trim() : null; };
    return { name: box ? box.value : null, open: !!box, selected: typeof bulkSelected !== 'undefined' ? bulkSelected.size : null, len3: lab('.lcb[value="3"]'), bib: lab('#eraBib'), animals: (document.querySelector('.tcb[value="animals"]') && document.querySelector('.tcb[value="animals"]').parentElement.querySelector('[data-i18n]').textContent.trim()) || null, filtered: typeof filtered !== 'undefined' ? filtered.length : null };
  });
  const step = async (name, fn, check) => { try { if (fn) await fn(); } catch (e) { record.push({ cell: cell.lang, name, ok: false, error: String(e).split('\n')[0] }); fail++; if (!JSON_OUT) console.log(`✘ ${cell.lang} ${cell.w} — ${name}: ${String(e).split('\n')[0]}`); return null; } const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify(r)}`); return r; };
  await step('1 no filter: the name box is empty', openSave, r => r.open && r.name === '' && r.selected > 1000);
  await closeSave();
  await step('2 a letter, one length and one era: the name reads them in the UI\'s words', async () => {
    for (const v of ['1', '2', '4', '5', '6', '7', '8plus']) await click(`.lcb[value="${v}"]`);
    await click('#pgAny .lpt[data-h="ב"]');
    await click('#eraMod');
    await openSave();
  }, r => r.open && r.filtered > 0 && r.filtered < 2000 && r.name === `ב · ${r.len3} · ${r.bib}`);
  await closeSave();
  await step('3 control: the theme path still names the list after its theme', async () => {
    await click('#eraMod'); await click('#pgAny .lpt[data-h="ב"]'); for (const v of ['1', '2', '4', '5', '6', '7', '8plus']) await click(`.lcb[value="${v}"]`);
    await click('.tcb[value="animals"]'); await click('#themeSaveWlBtn'); await page.waitForSelector('#wlNewName', { timeout: 5000 });
  }, r => r.open && r.animals && r.name === r.animals);
  await closeSave();
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in all four cells');
process.exit(fail ? 1 : 0);
