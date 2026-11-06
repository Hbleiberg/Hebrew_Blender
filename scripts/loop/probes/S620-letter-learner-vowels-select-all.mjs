#!/usr/bin/env node
// S620 — "Vowels to show" has Select all / Clear (micro-feature, gate 1; the S526 seed): one click ticks or unticks every
// vowel box, the setting is stored (a reload keeps it), the Vowels grid and an open card's Vowels tab follow at once
// (Clear leaves the grid's "every vowel is switched off" note and the tab's), Select all brings every card back, and
// the two buttons are named, 24px tall and reachable by Tab and Enter.
//
//   node scripts/loop/probes/S620-letter-learner-vowels-select-all.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S620 fails: the buttons do not exist); --json prints the record.
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
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewLetterLearner_tourSeen', '1'); }, [cell.lang, cell.dark]);
  const ready = async () => { await page.waitForFunction(() => window.I18n && (document.querySelector('#llGrid .ll-card') || (document.getElementById('llGridNote') && !document.getElementById('llGridNote').hidden)));   /* every vowel off in Vowels mode shows the note, no card */ await page.evaluate(() => I18n.ready); await page.waitForTimeout(300); };
  // the state: boxes ticked, the stored vowels, the Vowels-mode grid (cards + note), the open card's Vowels tab rows + note
  const st = async () => page.evaluate(() => {
    const boxes = [...document.querySelectorAll('#llVowelGrid input')]; let stored = null;
    try { stored = JSON.parse(localStorage.getItem('hebrewLetterLearner_settings') || 'null')?.vowels || null; } catch (e) {}
    const btn = id => { const b = document.getElementById(id); if (!b) return null; const r = b.getBoundingClientRect(); return { name: (b.textContent || '').trim(), h: Math.round(r.height), w: Math.round(r.width), vis: r.width > 0 }; };
    const note = document.getElementById('llGridNote');
    const vp = document.getElementById('llPanel-vowels');
    return { n: boxes.length, on: boxes.filter(b => b.checked).length, storedOn: stored ? Object.values(stored).filter(Boolean).length : null,
      all: btn('llVowAll'), none: btn('llVowNone'), mode: document.querySelector('.ll-mode-btn[aria-pressed="true"]')?.dataset.mode,
      cards: document.querySelectorAll('#llGrid .ll-card').length, note: note && !note.hidden ? note.textContent.trim() : '',
      dlg: !document.getElementById('llOverlay').hidden, vrows: vp && !vp.hidden ? vp.querySelectorAll('.ll-vrow, .ll-vowel-row, tr, li').length : null, vnote: vp && !vp.hidden ? vp.textContent.trim().slice(0, 60) : null };
  });
  const step = async (name, fn, check) => { if (fn) await fn(); await page.waitForTimeout(300); const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log((ok ? 'ok  ' : 'FAIL') + ' ' + record[record.length - 1].cell + ' ' + name + (ok ? '' : ' ' + JSON.stringify(r))); };
  await page.goto(base + '/letter_learner.html'); await ready();
  await step('load: buttons present, named, 24px, every box on', null, r => r.all && r.none && r.all.vis && r.none.vis && r.all.name && r.none.name && r.all.h >= 24 && r.none.h >= 24 && r.all.w >= 24 && r.n >= 10 && r.on === r.n);
  if (!(await st()).all) { if (!JSON_OUT) console.log('     (no buttons on this tree — the rest of the cell is skipped)'); await ctx.close(); continue; }
  await step('Clear: every box off, stored', () => page.click('#llVowNone'), r => r.on === 0 && r.storedOn === 0);
  await step('Vowels mode after Clear: no cards, the note', () => page.click('#llModeVowels'), r => r.mode === 'vowels' && r.cards === 0 && r.note.length > 0);
  await step('Select all: every box on, every card back', () => page.click('#llVowAll'), r => r.on === r.n && r.storedOn === r.n && r.cards >= 10 && r.note === '');
  await step('reload keeps Select all', async () => { await page.reload(); await ready(); }, r => r.on === r.n);
  await step('Clear, reload keeps it', async () => { await page.click('#llVowNone'); await page.waitForTimeout(200); await page.reload(); await ready(); }, r => r.on === 0 && r.cards === 0);
  // a card's Vowels tab follows the setting (the card is modal: the options are ticked with it closed)
  await step('Letters mode, Bet open on Vowels after Clear: the empty note', async () => { await page.click('#llModeLetters'); await page.click('#llGrid .ll-card[data-id="bet"]'); await page.click('#llTab-vowels'); }, r => r.dlg && r.vnote && r.vnote.length > 0);
  const emptyNote = (await st()).vnote;
  await step('Escape, Select all, Bet on Vowels again: rows, not the note', async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.click('#llVowAll'); await page.click('#llGrid .ll-card[data-id="bet"]'); await page.click('#llTab-vowels'); }, r => r.dlg && r.on === r.n && r.vnote !== emptyNote);
  await step('Escape closes the card', () => page.keyboard.press('Escape'), r => !r.dlg);
  // keyboard: focus the button, Enter
  await step('Enter on Select all', async () => { await page.focus('#llVowAll'); await page.keyboard.press('Enter'); }, r => r.on === r.n);
  await step('Enter on Clear', async () => { await page.focus('#llVowNone'); await page.keyboard.press('Enter'); }, r => r.on === 0);
  await step('one box ticked by hand after Clear', () => page.click('#llVowelGrid label >> nth=0'), r => r.on === 1 && r.storedOn === 1);
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, r: errors }); if (!JSON_OUT) console.log('FAIL page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
console.log(fail ? `S620 vowels select all / clear: ${fail} FAILED` : 'S620 vowels select all / clear: all steps pass');
process.exit(fail ? 1 : 0);
