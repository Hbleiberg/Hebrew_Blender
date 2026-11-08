#!/usr/bin/env node
// S625 — flash cards: the drill timer has Pause / Resume (micro-feature, gate 1; the S367 seed). The timer was a bare
// setInterval, so an interruption (a visitor, a question, a fire drill) went into a recorded time or used up a time
// limit. Now a button beside the readout stops the clock and the drill waits with it — the card, its marks, Prev / Next
// and the keys — while End Practice Early stays live; Resume carries on from the same second.
//
//   node scripts/loop/probes/S625-flash-cards-pause-the-drill-timer.mjs
//   EN light 1280 / HE dark 800, the clock faked (page.clock), every press a real click or key: Record Time and Time
//   Limit drills paused and resumed, the readout frozen while paused, the drill inert (a click on the card, Y, Space and
//   → change nothing), the saved time leaves the pause out, the limit runs out only after the pause, a new drill starts
//   running, No Timer shows no button. exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree>
//   runs another copy (the tree before S625 has no #timerPauseBtn: 8 failures, each Pause scenario stopped at its first press).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
async function open(cell, settings) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.clock.install();
  await page.addInitScript(([lang, dark, s]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); localStorage.setItem('hebrewFlashCards_settings', JSON.stringify(s)); }, [cell.lang, cell.dark, settings]);
  await page.goto(base + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('startBtn'));
  await page.evaluate(() => window.I18n.ready); await page.clock.runFor(500);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  await page.click('#startBtn'); await page.clock.runFor(300);
  return { ctx, page, errors };
}
const st = page => page.evaluate(() => {
  const btn = document.getElementById('timerPauseBtn'), d = document.getElementById('timerDisplay');
  return { card: document.getElementById('screenCard').classList.contains('active'), shown: !!d && d.style.display !== 'none', text: (document.getElementById('timerText') || d || {}).textContent || '', btn: btn ? btn.textContent.trim() : null, btnVisible: !!btn && !!btn.getClientRects().length && d.style.display !== 'none', paused: document.getElementById('screenCard').classList.contains('fc-paused'),
    inert: ['.fc-perspective', '.fc-mark-row', '.fc-nav'].map(s => !!document.querySelector('#screenCard ' + s).inert), meta: document.getElementById('cardMeta').textContent, flipped: document.getElementById('fcCard').classList.contains('flipped'), correct: document.getElementById('statCorrect').textContent };
});
const t = (page, k) => page.evaluate(k => I18n.t(k), k);
// A scenario that throws (a missing handle: the old tree has no Pause) counts as a failure and the run goes on.
const guard = async (label, fn) => { try { await fn(); } catch (e) { fail++; console.log(`✘ ${label}: ${String(e).split('\n')[0]}`); } };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  // ---- Record Time ----
  await guard(`${L} track`, async () => {
    const { ctx, page, errors } = await open(cell, { timerMode: 'track', timerShowOnScreen: true });
    let s = await st(page);
    const pauseLbl = await t(page, 'flashcards.timer.pause'), resumeLbl = await t(page, 'flashcards.timer.resume');
    ok(s.card && s.shown && s.btnVisible && s.btn === pauseLbl && /0:00/.test(s.text), `${L} track: the drill opens with "${s.text}" and a "${s.btn}" button beside it`);
    await page.clock.runFor(5000); s = await st(page);
    ok(/0:05/.test(s.text), `${L} track: 5 s later the readout says ${s.text}`);
    await page.click('#timerPauseBtn'); await page.clock.runFor(200); s = await st(page);
    ok(s.paused && s.btn === resumeLbl && s.inert.every(Boolean), `${L} track: Pause → the button says "${s.btn}", the card, marks and nav inert (${s.inert})`);
    const frozen = s.text; await page.clock.runFor(60000); s = await st(page);
    ok(s.text === frozen, `${L} track: a minute paused, the readout stays ${s.text}`);
    const before = s; await page.mouse.click(...(await page.locator('#fcCard').boundingBox().then(b => [b.x + b.width / 2, b.y + b.height / 2])));
    await page.keyboard.press('y'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('n'); await page.clock.runFor(300); s = await st(page);
    ok(!s.flipped && s.meta === before.meta && s.correct === before.correct, `${L} track: while paused a click on the card, Y, → and N change nothing (${s.meta}, ${s.correct})`);
    await page.focus('#timerPauseBtn'); await page.keyboard.press('Enter'); await page.clock.runFor(200); s = await st(page);
    ok(!s.paused && s.btn === pauseLbl && s.inert.every(x => !x), `${L} track: Enter on Resume → running again, "${s.btn}", nothing inert`);
    await page.clock.runFor(3000); s = await st(page);
    ok(/0:08/.test(s.text), `${L} track: 3 s after Resume the readout says ${s.text} (5 + 3, the minute paused left out)`);
    await page.keyboard.press('y'); await page.clock.runFor(300); s = await st(page);
    ok(/^1\//.test(s.correct.trim()) || /1\s*\/\s*1/.test(s.correct), `${L} track: running again, Y marks the card (${s.correct})`);
    // End Practice Early stays live while paused, and its result keeps the paused-out time
    await page.click('#timerPauseBtn'); await page.clock.runFor(30000);
    page.once('dialog', d => d.accept());
    await page.click('#endEarlyBtn'); await page.clock.runFor(400);
    const res = await page.evaluate(() => ({ results: document.getElementById('screenResults').classList.contains('active'), paused: document.getElementById('screenCard').classList.contains('fc-paused'), inert: !!document.querySelector('#screenCard .fc-nav').inert, sec: typeof timerElapsed === 'number' ? timerElapsed : null }));
    ok(res.results && !res.paused && !res.inert && res.sec === 8, `${L} track: End Practice Early while paused → results, the pause undone, the time ${res.sec} s`);
    // a new drill starts running
    await page.evaluate(() => returnToSetup()); await page.click('#startBtn'); await page.clock.runFor(2300); s = await st(page);
    ok(!s.paused && s.btn === pauseLbl && /0:02/.test(s.text), `${L} track: the next drill runs from 0 (${s.text}, "${s.btn}")`);
    ok(errors.length === 0, `${L} track: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
  // ---- Time Limit: the pause does not spend it ----
  await guard(`${L} limit`, async () => {
    const { ctx, page, errors } = await open(cell, { timerMode: 'limit', timeLimitSeconds: 30, timerShowOnScreen: true });
    let s = await st(page);
    ok(/0:30/.test(s.text) && s.btnVisible, `${L} limit: the countdown opens at ${s.text} with its Pause`);
    await page.clock.runFor(10000); await page.click('#timerPauseBtn'); await page.clock.runFor(120000); s = await st(page);
    ok(s.card && /0:20/.test(s.text), `${L} limit: 10 s then two minutes paused → still on the card at ${s.text}`);
    await page.click('#timerPauseBtn'); await page.clock.runFor(19000); s = await st(page);
    ok(s.card && /0:01/.test(s.text), `${L} limit: 19 s after Resume → ${s.text}, still drilling`);
    await page.clock.runFor(1500);
    const done = await page.evaluate(() => document.getElementById('screenResults').classList.contains('active'));
    ok(done, `${L} limit: the last second runs out → the results`);
    ok(errors.length === 0, `${L} limit: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
  // ---- No Timer: no readout, no button ----
  await guard(`${L} off`, async () => {
    const { ctx, page, errors } = await open(cell, { timerMode: 'off' });
    const s = await st(page);
    ok(s.card && !s.shown && !s.btnVisible, `${L} off: no readout, no Pause`);
    ok(errors.length === 0, `${L} off: 0 page errors`);
    await ctx.close();
  });
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
