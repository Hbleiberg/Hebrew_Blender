#!/usr/bin/env node
// S624 — the Word Lists window offers "Save the N selected words…" while words are selected (micro-feature, gate 1; the
// S440 seed): opened from the header with words picked in Bulk Copy Mode it used to say only "No word lists yet. Turn
// on Bulk Copy Mode, select words…". Now a button names the count (one / other), opens the save window on that
// selection, and the list it saves is listed below it at the next open; with nothing selected the window is as before.
//
//   node scripts/loop/probes/S624-dictionary-manager-saves-the-selection.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S624 fails steps 2–6); --json prints the record.
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
const SHOTS = process.env.SHOTS || '';
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 13000, null, { timeout: 60000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  const show = async sel => { await page.evaluate(sel => { const el = document.querySelector(sel); if (!el) return; const panel = el.closest('.panel'); if (panel && panel.classList.contains('collapsed')) panel.querySelector('.panel-title').click(); const adv = el.closest('.adv-section'); if (adv && adv.classList.contains('collapsed')) adv.querySelector('.adv-section-title').click(); const sec = el.closest('.pos-sec'); if (sec && !sec.classList.contains('open')) sec.querySelector('.pos-sec-hdr').click(); el.scrollIntoView({ block: 'center' }); }, sel); await page.waitForTimeout(150); };
  const click = async sel => { await show(sel); await page.click(sel); await page.waitForTimeout(250); };
  const close = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(250); };
  const t = (k, p) => page.evaluate(([k, p]) => I18n.t(k, p), [k, p]);
  const st = async () => page.evaluate(() => {
    const ov = document.getElementById('wordModal'), body = document.getElementById('wmBody');
    const sv = body && body.querySelector('[data-wl-focus="save-selected"]');
    return { open: !!(ov && ov.classList.contains('open')), title: ((document.getElementById('wmTitle') || {}).textContent || '').trim(), button: sv ? sv.textContent.trim() : null, buttonTag: sv ? sv.tagName + ':' + sv.type : null,
      empty: body ? body.textContent.includes(I18n.t('dictionary.wordlist.manager_empty')) : null, nameBox: !!document.getElementById('wlNewName'), focus: document.activeElement ? (document.activeElement.id || document.activeElement.dataset.wlFocus || document.activeElement.tagName) : null,
      selected: typeof bulkSelected !== 'undefined' ? bulkSelected.size : null, lists: Object.values((JSON.parse(localStorage.getItem('ivritSuite_wordLists') || '{}').lists) || {}).map(l => l.name + ':' + l.words.length).join(','), body: body ? body.textContent.replace(/\s+/g, ' ').slice(0, 160) : '' };
  });
  const step = async (name, fn, check) => { try { if (fn) await fn(); } catch (e) { fail++; record.push({ cell: cell.lang, name, ok: false, error: String(e).split('\n')[0] }); if (!JSON_OUT) console.log(`✘ ${cell.lang} ${cell.w} — ${name}: ${String(e).split('\n')[0]}`); return null; } await page.waitForTimeout(250); const r = await st(); const ok = !!(await check(r)); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify({ ...r, body: undefined })}`); return r; };
  const tag = cell.lang + (cell.dark ? '-dark-' : '-light-') + cell.w;
  await step('1 nothing selected: the header\'s Word Lists says "No word lists yet…", no save button', async () => { await page.click('#dictWordListsBtn'); }, r => r.open && r.empty && r.button === null && r.selected === 0);
  await close();
  // Bulk Copy Mode on (Advanced, three folds deep) and three words ticked on their cards.
  await click('#bulkModeCb');
  await page.evaluate(() => document.querySelector('.word-card .wc-bulk-cb').scrollIntoView({ block: 'center' }));
  for (let i = 0; i < 3; i++) await page.locator('.word-card .wc-bulk-cb').nth(i).click();
  await step('2 three ticked: the header\'s Word Lists offers "Save the 3 selected words…" and no "select words" advice', async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.click('#dictWordListsBtn'); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'manager-' + tag + '.png') }); }, async r => r.open && r.selected === 3 && r.button === await t('dictionary.wordlist.save_selected.other', { count: 3 }) && /3/.test(r.button) && r.buttonTag === 'BUTTON:button' && !r.empty);
  await step('3 pressing it opens the save window on the three, the name box focused', async () => { await page.click('[data-wl-focus="save-selected"]'); await page.waitForSelector('#wlNewName'); await page.waitForTimeout(100); }, async r => r.nameBox && r.title === await t('dictionary.wordlist.save_modal_title') && r.body.includes(await t('dictionary.wordlist.selected_count.other', { count: 3 })) && r.focus === 'wlNewName');
  await step('4 a name and Enter save a list of three', async () => { await page.fill('#wlNewName', 'Probe three'); await page.keyboard.press('Enter'); }, r => r.lists === 'Probe three:3');
  await close();
  await step('5 reopened: the button again, the saved list below it', async () => { await page.click('#dictWordListsBtn'); }, r => r.open && /3/.test(r.button || '') && r.body.includes('Probe three') && !r.empty);
  await close();
  // Two unticked: one left — the singular; reached by the keyboard from the window's Close.
  await page.evaluate(() => document.querySelector('.word-card .wc-bulk-cb').scrollIntoView({ block: 'center' }));
  for (let i = 1; i < 3; i++) await page.locator('.word-card .wc-bulk-cb').nth(i).click();
  await step('6 one ticked: "Save the selected word…", reached by Tab and pressed with Enter', async () => {
    await page.evaluate(() => window.scrollTo(0, 0)); await page.click('#dictWordListsBtn'); await page.waitForTimeout(150);
    for (let i = 0; i < 8; i++) { if (await page.evaluate(() => document.activeElement && document.activeElement.dataset.wlFocus === 'save-selected')) break; await page.keyboard.press('Tab'); }
    const label = await page.evaluate(() => document.activeElement && document.activeElement.textContent.trim());
    if (label !== await t('dictionary.wordlist.save_selected.one', { count: 1 })) throw new Error('focused: ' + label);
    await page.keyboard.press('Enter'); await page.waitForSelector('#wlNewName');
  }, async r => r.nameBox && r.selected === 1 && r.body.includes(await t('dictionary.wordlist.selected_count.one', { count: 1 })));
  await close();
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in every cell');
process.exit(fail ? 1 : 0);
