#!/usr/bin/env node
// S625 — the Letter Learner's final-form cards line up with their row-mates (pass M, the S536 gate-3 Candidate; the
// maintainer chose "keep centred"): a card's content is centred, and a final form's "Final form" badge added a line, so
// its glyph, name and sound sat 10px above the cards beside it. Now every card without a badge keeps an empty badge line.
//
//   node scripts/loop/probes/S625-letter-learner-final-cards-line-up.mjs
//   Block and Cursive × EN light 1280 / HE dark 800 / EN dark 390 (a phone width): in every grid row the glyph, the name
//   and the sound share one top; a final card's badge stays inside its card, under its sound; every card's accessible
//   name is its aria-label (the empty line adds nothing); the Vowels grid is untouched (no empty line on a vowel card).
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S625 fails the row check in every cell).
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
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 390 }]) {
  for (const mode of ['', '?mode=cursive', '?mode=vowels']) {
    const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
    const page = await ctx.newPage(); page.setDefaultTimeout(15000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
    await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewLetterLearner_tourSeen', '1'); }, [cell.lang, cell.dark]);
    await page.goto(base + '/letter_learner.html' + mode, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('#llGrid .ll-card').length > 10, null, { timeout: 30000 });
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('#llGrid .ll-card')];
      const rows = {};
      cards.forEach(c => { const t = Math.round(c.getBoundingClientRect().top + scrollY); (rows[t] = rows[t] || []).push(c); });
      const spread = (list, sel) => { const v = list.map(c => { const e = c.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top - c.getBoundingClientRect().top) : null; }).filter(x => x !== null); return v.length ? Math.max(...v) - Math.min(...v) : -1; };
      const worst = { glyph: 0, name: 0, sound: 0 };
      Object.values(rows).forEach(l => { worst.glyph = Math.max(worst.glyph, spread(l, '.ll-card-glyph')); worst.name = Math.max(worst.name, spread(l, '.ll-card-name')); worst.sound = Math.max(worst.sound, spread(l, '.ll-card-sound')); });
      const finals = cards.filter(c => c.classList.contains('is-final')).map(c => { const r = c.getBoundingClientRect(), s = c.querySelector('.ll-card-sound').getBoundingClientRect(), b = c.querySelector('.ll-badge').getBoundingClientRect(); return { gap: Math.round(b.top - s.bottom), inside: b.bottom <= r.bottom - 2 && b.height > 6 }; });
      const after = cards.map(c => getComputedStyle(c, '::after').content);
      const vcards = cards.filter(c => c.classList.contains('ll-vcard')).length;
      return { n: cards.length, rows: Object.keys(rows).length, worst, finals, afterOn: after.filter(a => a && a !== 'none' && a !== 'normal').length, vcards, names: cards.slice(0, 3).map(c => c.textContent.replace(/\s+/g, ' ').trim()) };
    });
    // the accessibility tree's name of the first card and of a final card: their text, nothing added
    const snap = await page.locator('#llGrid').ariaSnapshot();
    const label = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} ${mode.replace('?mode=', '') || 'block'}`;
    if (mode === '?mode=vowels') {
      ok(r.n >= 12 && r.vcards === r.n && r.afterOn === 0, `${label}: ${r.n} vowel cards, none carries the empty line (${r.afterOn})`);
    } else {
      ok(r.n >= 27 && r.rows >= 4, `${label}: handle — ${r.n} cards in ${r.rows} rows`);
      ok(r.worst.glyph <= 1 && r.worst.name <= 1 && r.worst.sound <= 1, `${label}: every row's glyphs, names and sounds share one top (worst spread ${JSON.stringify(r.worst)})`);
      ok(r.finals.length === 5 && r.finals.every(f => f.inside && f.gap >= 3), `${label}: the 5 final badges sit under their sound inside the card (${JSON.stringify(r.finals.map(f => f.gap))})`);
      ok(r.afterOn === r.n - 5, `${label}: the empty line on the ${r.n - 5} cards without a badge (${r.afterOn})`);
      const wanted = await page.evaluate(() => [...document.querySelectorAll('#llGrid .ll-card')].map(c => c.getAttribute('aria-label')).filter(Boolean));
      const named = wanted.filter(l => snap.includes('button "' + l + '"'));
      ok(wanted.length === r.n && named.length === r.n && !snap.includes(String.fromCharCode(160)), `${label}: every card's accessible name is its aria-label, nothing added (${named.length}/${r.n}, e.g. "${wanted[0]}")`);
    }
    ok(errors.length === 0, `${label}: 0 page errors`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: every row lines up in every cell');
process.exit(fail ? 1 : 0);
