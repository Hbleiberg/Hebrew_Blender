#!/usr/bin/env node
// S573 — Generator, Self-Check: the score line's ✓ / ✗ counts, the Got it / Missed buttons and the marked cards' badges
// read at AA (4.5:1, all are small bold text) against their own background in both themes. The green read 2.19:1 on the
// light bar and white on it 2.87:1; the red 4.14 / 2.82 on the light / dark bar; the dark badges 2.28 / 3.76.
//
//   node scripts/loop/probes/S573-generator-selfcheck-score-contrast.mjs     exit 1 when any pair reads under 4.5:1
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// By real clicks: the Self-Check switch, Generate, the first card flipped and marked Got it, the second flipped and
// marked Missed, the third flipped (its buttons measured); EN light / dark × 1280 / 800 and HE dark 800.
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
const browser = await chromium.launch();
const records = [];
const CELLS = [['en', false, 1280], ['en', false, 800], ['en', true, 1280], ['en', true, 800], ['he', true, 800]];
for (const [lang, dark, w] of CELLS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, [lang, dark]);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof generate === 'function', null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  // the switch: its visible slider, wherever its panel sits
  await page.evaluate(() => { const t = document.getElementById('selfCheckToggle'); let p = t; while ((p = p.parentElement)) { if (p.classList && p.classList.contains('collapsed')) p.classList.remove('collapsed'); } });
  const slider = page.locator('#selfCheckToggle + .slider, label:has(#selfCheckToggle)').first();
  await slider.scrollIntoViewIfNeeded({ timeout: 5000 });
  await slider.click({ timeout: 5000 });
  const on = await page.evaluate(() => document.getElementById('selfCheckToggle').checked);
  await page.locator('#generateBtn').click({ timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('#worksheet .flip-card').length >= 3, null, { timeout: 15000 });
  const cards = page.locator('#worksheet .flip-card');
  for (const [i, mark] of [[0, 'correct'], [1, 'incorrect'], [2, null]]) {
    const c = cards.nth(i);
    await c.scrollIntoViewIfNeeded();
    await c.locator('.flip-card-inner').click({ timeout: 5000 });
    await page.waitForTimeout(250);
    if (mark) { await c.locator('.score-btn.' + mark).click({ timeout: 5000 }); await page.waitForTimeout(250); }
  }
  const pairs = await page.evaluate(() => {
    const rgb = (s) => { const m = s.match(/[\d.]+/g).map(Number); return m.slice(0, 3); };
    const lum = (c) => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const cr = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
    const bar = document.getElementById('scScoreBar'), barBg = rgb(getComputedStyle(bar).backgroundColor);
    const out = {};
    const text = (sel, bg) => { const el = document.querySelector(sel); if (!el) return null; return +cr(rgb(getComputedStyle(el).color), bg || rgb(getComputedStyle(el).backgroundColor)).toFixed(2); };
    out.barCorrect = text('#scScoreBar .score-correct', barBg);
    out.barIncorrect = text('#scScoreBar .score-incorrect', barBg);
    const third = document.querySelectorAll('#worksheet .flip-card')[2];
    const b1 = third && third.querySelector('.score-btn.correct'), b2 = third && third.querySelector('.score-btn.incorrect');
    out.btnGotIt = b1 ? +cr(rgb(getComputedStyle(b1).color), rgb(getComputedStyle(b1).backgroundColor)).toFixed(2) : null;
    out.btnMissed = b2 ? +cr(rgb(getComputedStyle(b2).color), rgb(getComputedStyle(b2).backgroundColor)).toFixed(2) : null;
    const g = document.querySelector('#worksheet .flip-card[data-score="correct"] .flip-score-badge'), r = document.querySelector('#worksheet .flip-card[data-score="incorrect"] .flip-score-badge');
    out.badgeCorrect = g ? +cr(rgb(getComputedStyle(g).color), rgb(getComputedStyle(g).backgroundColor)).toFixed(2) : null;
    out.badgeIncorrect = r ? +cr(rgb(getComputedStyle(r).color), rgb(getComputedStyle(r).backgroundColor)).toFixed(2) : null;
    out.counts = [bar.querySelector('.score-correct').textContent, bar.querySelector('.score-incorrect').textContent];
    out.dark = document.body.classList.contains('dark');
    return out;
  });
  const vals = ['barCorrect', 'barIncorrect', 'btnGotIt', 'btnMissed', 'badgeCorrect', 'badgeIncorrect'].map(k => pairs[k]);
  const ok = on && errors.length === 0 && pairs.dark === dark && vals.every(v => typeof v === 'number' && v >= 4.5) && pairs.counts[0] === '✓ 1' && pairs.counts[1] === '✗ 1';
  records.push({ cell: `${lang} ${dark ? 'dark' : 'light'} ${w}`, ok, pairs, errors });
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.cell + ' ' + JSON.stringify(r.pairs) + (r.errors.length ? ' ' + r.errors.join(' | ') : '')));
const bad = records.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${records.length} cells fail` : `all ${records.length} cells pass`);
process.exit(bad ? 1 : 0);
