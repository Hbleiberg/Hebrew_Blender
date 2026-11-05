#!/usr/bin/env node
// S619 — the Letter Learner's open card is in the address bar (micro-feature, gate 1): a card opened by a click puts
// ?letter=<id> (&tab=<tab> past its first tab) or ?vowel=<id> there, a tab click or Next updates it, a close takes it
// out, and the mirrored address reopens that card on that tab. Every other param survives (a planted ?foo=1), the mode
// param stays llSetMode's, and nothing is pushed on the history.
//
//   node scripts/loop/probes/S619-letter-learner-card-in-the-address.mjs
//   exit 1 when any step's address differs from the expected one, the reopened card or tab differs, history.length
//   grew, or a step's handle is missing (the dialog never opened). ROOT=<a git archive of the tree> runs another copy
//   (the tree before S619 fails: the address never changes); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const q = s => { const u = new URLSearchParams(s); const o = {}; [...u.keys()].sort().forEach(k => { o[k] = u.get(k); }); return JSON.stringify(o); };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewLetterLearner_tourSeen', '1'); }, [cell.lang, cell.dark]);
  const ready = async () => { await page.waitForFunction(() => window.I18n && document.querySelector('#llGrid .ll-card')); await page.evaluate(() => I18n.ready); await page.waitForTimeout(300); };
  const st = async () => page.evaluate(() => ({ s: location.search, open: !document.getElementById('llOverlay').hidden, id: document.querySelector('.ll-dialog .ll-dlg-glyph')?.textContent, tab: document.querySelector('.ll-tabs [role=tab][aria-selected="true"]')?.id.replace('llTab-', ''), hl: history.length, pressed: document.querySelector('.ll-mode-btn[aria-pressed="true"]')?.dataset.mode }));
  const step = async (name, expect, fn) => { if (fn) await fn(); await page.waitForTimeout(250); const r = await st(); const ok = q(r.s) === q(expect) && (expect.open === undefined || r.open === expect.open); if (!ok) fail++; record.push({ ...cell, step: name, got: r.s, expect, open: r.open, tab: r.tab, ok }); return r; };
  await page.goto(base + '/letter_learner.html?foo=1'); await ready();
  const hl0 = (await st()).hl;
  await step('load', '?foo=1');
  await step('open bet', '?foo=1&letter=bet', () => page.click('#llGrid .ll-card[data-id="bet"]'));
  await step('coloring tab', '?foo=1&letter=bet&tab=coloring', () => page.click('#llTab-coloring'));
  await step('next keeps tab', '?foo=1&letter=vet&tab=coloring', () => page.click('#llNext'));
  await step('letter tab (first) drops tab', '?foo=1&letter=vet', () => page.click('#llTab-letter'));
  await step('escape', '?foo=1', () => page.keyboard.press('Escape'));
  await step('cursive mode', '?foo=1&mode=cursive', () => page.click('#llModeCursive'));
  await step('open cursive gimel on coloring', '?foo=1&mode=cursive&letter=gimel&tab=coloring', async () => { await page.click('#llGrid .ll-card[data-id="gimel"]'); await page.click('#llTab-coloring'); });
  // the mirrored address, pasted by a colleague: same card, same tab, same mode
  const addr = await page.evaluate(() => location.href);
  await page.goto(addr); await ready();
  const re = await st();
  const reOk = re.open && re.tab === 'coloring' && re.pressed === 'cursive' && q(re.s) === q('?foo=1&mode=cursive&letter=gimel&tab=coloring');
  if (!reOk) fail++; record.push({ ...cell, step: 'reopen by address', got: re.s, open: re.open, tab: re.tab, mode: re.pressed, ok: reOk });
  await step('escape again', '?foo=1&mode=cursive', () => page.keyboard.press('Escape'));
  await step('vowels mode', '?foo=1&mode=vowels', () => page.click('#llModeVowels'));
  const firstVowel = await page.evaluate(() => document.querySelector('#llGrid .ll-card')?.dataset.id);
  await step('open a vowel', `?foo=1&mode=vowels&vowel=${firstVowel}`, () => page.click(`#llGrid .ll-card[data-id="${firstVowel}"]`));
  await step('close by X', '?foo=1&mode=vowels', () => page.click('#llClose'));
  const hl1 = (await st()).hl;
  if (hl1 > hl0 + 1) { fail++; }   // every mirror is a replaceState; the one goto above adds at most one entry (none when its address is the current one)
  record.push({ ...cell, step: 'history.length', before: hl0, after: hl1, ok: hl1 <= hl0 + 1 });
  if (errors.length) { fail++; record.push({ ...cell, errors }); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else record.forEach(r => console.log(`${r.lang} ${r.dark ? 'dark' : 'light'} ${r.w} ${r.step || ''}: ${r.got ?? ''}${r.expect ? ' (want ' + r.expect + ')' : ''}${r.step === 'history.length' ? r.before + ' -> ' + r.after : ''} ${r.ok === false ? 'FAIL' : r.errors ? 'ERRORS ' + r.errors : 'ok'}`));
process.exit(fail ? 1 : 0);
