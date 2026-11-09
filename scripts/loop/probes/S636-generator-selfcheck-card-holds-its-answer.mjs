#!/usr/bin/env node
// S636 (the S590 / S613 generator P4s) — a Self-Check card's two faces were absolute boxes in a fixed 90px card, so a
// face whose content is taller ran past it: every Real Words Gematria card's back (the word, its value, the
// transliteration, the translation: 116–161px) spilled above the card and over its Got it / Missed and the next row —
// on screen, with Reveal All on paper, and in Export PDF — and a long Real Words translation was cut (S613's "Beth, Bet
// (the second letter in Hebrew script and"). The faces now share one grid cell, so a card is as tall as its taller face;
// one whose faces fit stays 90px, and the Real Words cards of a row stay one height.
//
// Blend, Gematria, Real Words (vocab) and Real Words Gematria Self-Checks under a seeded Math.random, EN light 1280 and
// HE dark 800, by real clicks: (1) on screen, no face's content overflows it (scrollHeight vs clientHeight — flex items
// shrink, so the children's own boxes cannot show it), unflipped and with every card revealed (Reveal All, or each Real
// Words card clicked); (2) in print media, revealed, the shown face fits and no card overlaps the row under it; (3) the
// Blend and Gematria cards that fit stay 90px tall unflipped; (4) the Real Words cards of a row are one height. 0 errors.
//
//   node scripts/loop/probes/S636-generator-selfcheck-card-holds-its-answer.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S636 fails (1) and (2) on both Real Words Self-Checks in both cells); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const check = id => async p => { await p.evaluate(s => { const c = document.getElementById(s); if (c && !c.checked) c.click(); }, id); };
const VARIANTS = {
  blend: async p => { await check('selfCheckToggle')(p); },
  gematria: async p => { await p.click('[data-worksheet="gematria"]'); await check('gematriaSelfCheck')(p); },
  realWords: async p => { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="vocab"]'); },
  realWordsGematria: async p => { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="gematria"]'); await check('rwGematriaSelfCheck')(p); },
};
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
// faces whose content overflows them (only faces that are laid out), the card heights, and row overlaps
const READ = () => {
  const cards = [...document.querySelectorAll('#worksheet .flip-card, #worksheet .rw-flip')];
  const over = [];
  for (const c of cards) for (const f of c.querySelectorAll('.flip-card-front, .flip-card-back, .rw-flip-front, .rw-flip-back')) {
    if (getComputedStyle(f).display === 'none') continue;
    if (f.scrollHeight > f.clientHeight + 1) over.push(Math.round(f.scrollHeight - f.clientHeight));
  }
  const inner = cards.map(c => c.querySelector('.flip-card-inner, .rw-flip-inner').getBoundingClientRect());
  const rows = {}; inner.forEach(r => { const k = Math.round(r.top); (rows[k] = rows[k] || []).push(Math.round(r.height)); });
  const tops = Object.keys(rows).map(Number).sort((a, b) => a - b);
  let overlap = 0; inner.forEach(r => { const next = tops.find(t => t > Math.round(r.top)); if (next !== undefined && r.bottom > next + 0.5) overlap++; });
  return { cards: cards.length, over: over.length, worst: Math.max(0, ...over), heights: [...new Set(inner.map(r => Math.round(r.height)))].sort((a, b) => a - b), unevenRows: Object.values(rows).filter(h => new Set(h).size > 1).length, overlap };
};
for (const cell of CELLS) for (const [name, setup] of Object.entries(VARIANTS)) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} ${name}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.addInitScript(([l, d]) => {
    Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1');
  }, [cell.lang, cell.dark]);
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'load' }); await page.evaluate(() => window.I18n && I18n.ready);
    await page.click('#generateBtn'); await page.waitForTimeout(200); await setup(page); await page.click('#generateBtn'); await page.waitForTimeout(600);
    const a = await page.evaluate(READ);
    if (!a.cards) throw new Error('handle missing: no Self-Check card');
    const ra = page.locator('#worksheet button[onclick="flipAllCards(true)"]');
    if (await ra.count()) await ra.first().click(); else { const c = page.locator('#worksheet .rw-flip-inner'); const n = await c.count(); for (let k = 0; k < n; k++) await c.nth(k).click(); }
    await page.waitForTimeout(300);
    const flipped = await page.evaluate(() => document.querySelectorAll('#worksheet .flipped').length);
    const b = await page.evaluate(READ);
    await page.emulateMedia({ media: 'print' }); const c = await page.evaluate(READ); await page.emulateMedia({ media: 'screen' });
    out(a.over === 0 && b.over === 0 && flipped === a.cards, tag, 'on screen no face overflows its card, unflipped or revealed', { cards: a.cards, flipped, unflipped: a.over, revealed: b.over, worst: b.worst || a.worst });
    out(c.over === 0 && c.overlap === 0, tag, 'printed with every card revealed: the shown face fits, no card runs into the next row', { over: c.over, worst: c.worst, overlap: c.overlap });
    if (name === 'blend' || name === 'gematria') out(a.heights.length === 1 && a.heights[0] === 90, tag, 'cards that fit stay 90px', { heights: a.heights });
    if (name === 'realWords') out(a.unevenRows === 0, tag, 'a row of Real Words cards is one height', { heights: a.heights, unevenRows: a.unevenRows });
  } catch (e) { out(false, tag, 'the steps ran', { error: String(e).slice(0, 200) }); }
  if (errors.length) out(false, tag, 'no page errors', errors.slice(0, 3));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every variant in both cells');
process.exit(fail ? 1 : 0);
