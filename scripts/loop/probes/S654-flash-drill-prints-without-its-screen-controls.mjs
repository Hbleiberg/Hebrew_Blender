#!/usr/bin/env node
// S654 — flash cards: a plain Ctrl+P of a drill or its results puts no screen control on paper. The print block hid the
// drill's older controls but not the ones added since: the timer's Pause, the voice-speed row (− 0.75× +), a listening
// round's speaker and its "Tap 🔊 to hear" line; the results' "Results ▾" printed its fold triangle, and after a perfect
// score (the list folds on screen by design) a bare "Results" heading over nothing; and a listening round's choices,
// dimmed until the speaker is pressed (.lc-wait), printed at 45% ink.
//
//   node scripts/loop/probes/S654-flash-drill-prints-without-its-screen-controls.mjs
//   EN light 1280 / HE dark 800 × a flip drill with a timer and Hear on, a listening round with a time limit, and the
//   results after a perfect 3-card drill (real clicks and keys): page.pdf on Letter → pdftotext (DUMP=1 prints each
//   page's text). exit 1 when a control's label reaches paper, when the card, the timer readout or the results' three
//   cards are missing from it, when a listening choice prints below full opacity, or on a page error. ROOT=<a git
//   archive of the tree> runs another copy (the tree before S654 fails 12: Pause, the speed row, the hint and ▾ on
//   paper, the tiles at 0.45, the perfect drill's cards absent). Needs poppler's pdftotext.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's654-'));
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
async function open(cell, settings) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, s]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); localStorage.setItem('hebrewFlashCards_settings', JSON.stringify(s)); }, [cell.lang, cell.dark, settings]);
  await page.goto(base + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('startBtn'));
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  await page.click('#startBtn'); await page.waitForTimeout(500);
  return { ctx, page, errors };
}
async function paper(page, name) {
  const f = path.join(TMP, name + '.pdf');
  // page.pdf follows emulateMedia: after an emulateMedia('screen') it prints SCREEN styles, so print media is pinned here
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: f, format: 'Letter', printBackground: false, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  await page.emulateMedia({ media: null });
  const out = execFileSync('pdftotext', ['-layout', f, '-']).toString();
  if (process.env.DUMP) console.log("---- " + name + "\n" + out.replace(/\n{2,}/g, "\n")); return out;
}
const t = (page, k) => page.evaluate(k => I18n.t(k), k);
const guard = async (label, fn) => { try { await fn(); } catch (e) { fail++; console.log(`✘ ${label}: ${String(e).split('\n')[0]}`); } };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  await guard(`${L} flip`, async () => {
    const { ctx, page, errors } = await open(cell, { timerMode: 'track', timerShowOnScreen: true, audioEnabled: true, cardCount: 10 });
    await page.click('#flipBtn'); await page.waitForTimeout(700);
    const pause = await t(page, 'flashcards.timer.pause'), speed = await t(page, 'flashcards.card.speed_label');
    const shown = await page.evaluate(() => ({ pause: !!document.getElementById('timerPauseBtn').getClientRects().length, speed: !document.getElementById('fcSpeed').hidden, tr: document.getElementById('fcBackTr').textContent.trim() }));
    ok(shown.pause && shown.speed && shown.tr, `${L} flip: on screen the drill shows Pause and the speed row (the probe's handles), the back reads «${shown.tr}»`);
    const txt = await paper(page, `${cell.lang}-flip`);
    ok(!txt.includes(pause) && !txt.includes(speed) && !/0\.75×|×0\.75/.test(txt), `${L} flip: «${pause}», «${speed}» and 0.75× are not on paper`);
    ok(txt.includes(shown.tr) && /0:0\d/.test(txt), `${L} flip: the card's answer «${shown.tr}» and the timer readout still print`);
    ok(errors.length === 0, `${L} flip: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
  await guard(`${L} listen`, async () => {
    const { ctx, page, errors } = await open(cell, { timerMode: 'limit', timeLimitSeconds: 120, timerShowOnScreen: true, listening: true, listeningChoices: 4, cardCount: 10 });
    const tap = await t(page, 'flashcards.card.listen_hint_tap');
    const tiles = await page.evaluate(() => [...document.querySelectorAll('#lcChoices .lc-tile')].map(b => b.textContent.replace(/^\d/, '').trim()));
    ok(tiles.length === 4 && await page.evaluate(() => document.getElementById('lcChoices').classList.contains('lc-wait')), `${L} listen: 4 choices on screen, dimmed until the speaker is pressed`);
    await page.emulateMedia({ media: 'print' });
    const op = await page.evaluate(() => [...document.querySelectorAll('#lcChoices .lc-tile')].map(b => getComputedStyle(b).opacity));
    await page.emulateMedia({ media: 'screen' });
    ok(op.every(o => o === '1'), `${L} listen: under print every choice is at full opacity (${op.join(', ')})`);
    const txt = await paper(page, `${cell.lang}-listen`);
    // pdftotext reorders a Hebrew line's words, so the hint is matched by its longest word ("hear" / "לשמוע")
    const word = tap.split(/\s+/).filter(w => !/🔊/.test(w)).sort((a, b) => b.length - a.length)[0];
    ok(word && !txt.includes(word), `${L} listen: «${tap}» is not on paper (its word «${word}» absent)`);
    ok(!txt.includes(await t(page, 'flashcards.timer.pause')), `${L} listen: Pause is not on paper`);
    ok(errors.length === 0, `${L} listen: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
  await guard(`${L} results`, async () => {
    const { ctx, page, errors } = await open(cell, { cardCount: 3 });
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(350); await page.keyboard.press('y'); await page.waitForTimeout(550); }
    await page.waitForSelector('#screenResults.active'); await page.waitForTimeout(1200);
    const rows = await page.evaluate(() => document.querySelectorAll('#resultsList li').length);
    const txt = await paper(page, `${cell.lang}-results`);
    ok(rows === 3, `${L} results: 3 cards listed on screen`);
    ok(!txt.includes('▾'), `${L} results: the Results heading prints without its fold triangle`);
    ok((txt.match(/✓/g) || []).length >= 3, `${L} results: the three graded cards still print (${(txt.match(/✓/g) || []).length} ✓)`);
    ok(errors.length === 0, `${L} results: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(fail ? `FAIL: ${fail}` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
