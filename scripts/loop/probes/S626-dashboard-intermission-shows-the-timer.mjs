#!/usr/bin/env node
// S626 — Classroom Dashboard: the Intermission screen shows the running countdown under its words (micro-feature,
// gate 1; the seed "The running timer stays visible on the Intermission screen"). Pressing I for a timed break covered
// the timer panel: the class saw "Snack time" and nothing of the 4:12 left, and only the end sound got through.
//
//   node scripts/loop/probes/S626-dashboard-intermission-shows-the-timer.mjs
//   EN light 1280 / HE dark 800, the clock faked (page.clock), every press a real click or key: at rest the sheet shows
//   no countdown; a 1-min preset then I → the sheet's countdown reads what the panel reads, tick by tick, under the
//   words and above the hint row, inside the window; the last 10 s are marked; "Time!" shows, then the line goes once
//   the 3 s hold ends; a pause part-way keeps the paused time up and frozen, Reset takes it away; with "Repeat until
//   dismissed" on, "Time!" stays until a tap acknowledges it; under reduced motion the "Time!" flash is neutralised.
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S626 has no countdown on the sheet: 11 failures, every scenario but the resting one at its first read).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
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
const guard = async (label, fn) => { try { await fn(); } catch (e) { fail++; console.log(`✘ ${label}: ${String(e).split('\n')[0]}`); } };
async function open(cell, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 800 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light', reducedMotion: opts.reduce ? 'reduce' : 'no-preference' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewDashboard_tourSeen', '1'); localStorage.setItem('hebrewDashboard_setupSeen', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(15000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  page.on('dialog', d => d.accept());
  await page.clock.install({ time: new Date('2026-11-04T10:15:00') });
  await page.goto(base + '/classroom_dashboard.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang && document.getElementById('timerDisplay'));
  await page.evaluate(() => I18n.ready); await page.clock.runFor(800);
  await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach(o => o.classList.remove('open')));
  return { ctx, page, errors };
}
// the sheet, its countdown and the panel's display, read together
const read = page => page.evaluate(() => {
  const sheet = document.getElementById('intermission'), el = document.getElementById('imTimer'), d = document.getElementById('timerDisplay');
  const r = el && el.getBoundingClientRect(), t = document.getElementById('intermissionText').getBoundingClientRect(), f = sheet.querySelector('.im-foot').getBoundingClientRect();
  const shown = !!el && !el.hidden && !!el.getClientRects().length;
  return { open: sheet.classList.contains('open'), handle: !!el, shown, text: el ? el.textContent : null, panel: d.textContent, warn: !!el && el.classList.contains('warn'), done: !!el && el.classList.contains('done'),
    clear: shown ? (r.top >= t.bottom - 1 && r.bottom <= f.top + 1 && r.top >= 0 && r.bottom <= innerHeight && r.height > 20) : null, color: el ? getComputedStyle(el).color : '', anim: el ? getComputedStyle(el).animationDuration : '' };
});
const key = async (page, k) => { await page.keyboard.press(k); await page.clock.runFor(300); };
const closeSheet = async page => { if ((await read(page)).open) await key(page, 'Escape'); };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  await guard(`${L} run`, async () => {
    const { ctx, page, errors } = await open(cell);
    const done = await page.evaluate(() => I18n.t('dashboard.timer.done'));
    await page.locator('body').focus().catch(() => {}); await key(page, 'i');
    let s = await read(page);
    ok(s.open && !s.shown, `${L}: at rest, I opens the sheet with no countdown on it (handle ${s.handle})`);
    await closeSheet(page);
    await page.click('.timer-preset-btn[onclick="timerPreset(60)"]'); await page.clock.runFor(5000);
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); await key(page, 'i');
    s = await read(page);
    ok(s.open && s.shown && s.text === s.panel && /^0:5\d$/.test(s.text) && s.clear, `${L}: 1 min running, then I → the sheet reads "${s.text}" as the panel does, under the words and above the hint (${s.clear})`);
    ok(/255, 255, 255/.test(s.color), `${L}: its ink is white on the black sheet (${s.color})`);
    const want = '0:' + String(Number(s.text.split(':')[1]) - 5).padStart(2, '0');
    await page.clock.runFor(5000); s = await read(page);
    ok(s.text === s.panel && s.text === want && !s.warn, `${L}: 5 s later both read "${s.text}" (${want})`);
    await page.clock.runFor(Number(s.text.split(':')[1]) * 1000 - 8000); s = await read(page);
    ok(s.warn && s.text === s.panel, `${L}: the last 10 s marked (${s.text}, warn ${s.warn})`);
    await page.clock.runFor(9000); s = await read(page);
    ok(s.open && s.shown && s.done && s.text === done, `${L}: "${s.text}" on the sheet, which stays up`);
    await page.clock.runFor(3500); s = await read(page);
    ok(s.open && !s.shown, `${L}: the 3 s hold over → the countdown leaves the sheet (panel "${s.panel}")`);
    // paused part-way: the paused time stays up, frozen; Reset takes it away
    await closeSheet(page);
    await page.click('.timer-preset-btn[onclick="timerPreset(60)"]'); await page.clock.runFor(20000);
    await page.click('#timerPauseBtn'); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await key(page, 'i');
    s = await read(page); const paused = s.text;
    await page.clock.runFor(10000); s = await read(page);
    ok(s.shown && s.text === paused && /^0:4\d$/.test(paused) && s.text === s.panel, `${L}: paused part-way → "${paused}" stays up, still "${s.text}" 10 s later`);
    await closeSheet(page); await page.click('#timerResetBtn'); await page.evaluate(() => document.activeElement && document.activeElement.blur()); await key(page, 'i');
    s = await read(page);
    ok(s.open && !s.shown, `${L}: after Reset the sheet has no countdown`);
    ok(errors.length === 0, `${L}: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
  // Repeat until dismissed: "Time!" waits on the sheet until a tap acknowledges it
  await guard(`${L} repeat`, async () => {
    const { ctx, page, errors } = await open(cell);
    await page.evaluate(() => { settings.timerRepeat = true; settings.timerSound = 'none'; });
    await page.click('.timer-preset-btn[onclick="timerPreset(60)"]'); await page.clock.runFor(50000);
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); await key(page, 'i');
    await page.clock.runFor(16000);
    let s = await read(page);
    ok(s.open && s.shown && s.done, `${L} repeat: the finish while the sheet is up → "${s.text}"`);
    await page.clock.runFor(8000); s = await read(page);
    ok(s.shown && s.done, `${L} repeat: 8 s later "${s.text}" still waits`);
    await page.mouse.click(30, 30); await page.clock.runFor(400); s = await read(page);
    ok(!s.shown, `${L} repeat: a tap acknowledges it → the countdown is gone (sheet open ${s.open})`);
    ok(errors.length === 0, `${L} repeat: 0 page errors ${errors.join(' | ')}`);
    await ctx.close();
  });
}
// reduced motion: the "Time!" flash is neutralised by the page's universal block
await guard('reduce', async () => {
  const { ctx, page } = await open({ lang: 'en', dark: false, w: 1280 }, { reduce: true });
  await page.click('.timer-preset-btn[onclick="timerPreset(60)"]'); await page.clock.runFor(60500);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await key(page, 'i');
  const s = await read(page);
  ok(s.shown && s.done && parseFloat(s.anim) < 0.01, `reduced motion: "${s.text}" shown, its flash ${s.anim}`);
  await ctx.close();
});
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the Intermission screen carries the countdown in every cell');
process.exit(fail ? 1 : 0);
