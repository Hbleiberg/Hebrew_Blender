#!/usr/bin/env node
// S673 — the Tefillah Trainer's "Side by side" on a phone. At 720px and under the layout is one column, and the Hebrew row
// kept its number and Copy button in a strip beside the whole line (65px of 296px at 320px, 78px in the Hebrew UI), so a
// paragraph-long line read about four words a row. At 600px and under the strip now lies above its line as one row,
// starting at the UI's own edge, and the text takes the full width.
//
//   node scripts/loop/probes/S673-tefillah-side-by-side-phone-head-row.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S673 fails the phone cells).
//
// iPhone SE and 13 × EN/HE: every Hebrew row's number, checkbox and Copy on one row above a line as wide as its row, the
// number at the UI's start edge. 601px and 1280px: the strip still beside its line (nothing above the phone width moves).
// Sefaria is stubbed with ordinary vocabulary words from data/hebrew_words.json (never liturgical text).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 60);
const LINES = [WORDS.slice(0, 30).join(' '), WORDS.slice(30, 36).join(' '), WORDS.slice(36, 60).join(' ')];   // a paragraph, a short line, a paragraph
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } }] };
const ANSWER = { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: LINES }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] };
const CELLS = [
  ['iPhone SE en', { ...devices['iPhone SE'] }, 'en', 'above'], ['iPhone SE he', { ...devices['iPhone SE'] }, 'he', 'above'],
  ['iPhone 13 en', { ...devices['iPhone 13'] }, 'en', 'above'], ['iPhone 13 he', { ...devices['iPhone 13'] }, 'he', 'above'],
  ['601px en', { viewport: { width: 601, height: 900 } }, 'en', 'beside'], ['1280px he', { viewport: { width: 1280, height: 900 } }, 'he', 'beside'],
];
const browser = await chromium.launch(); const records = [];
for (const [cell, dev, lang, want] of CELLS) {
  const ctx = await browser.newContext({ ...dev, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTefillahTrainer_settings', JSON.stringify({ layout: 'sidebyside' })); } }, { lang });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ANSWER) });
    return r.abort();
  });
  const rec = { cell, want, rows: 0, bad: [], note: '' };
  try {
    await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ttReading .tt-col-heb .tt-grid-row[data-vk]', { timeout: 20000 }); await page.waitForTimeout(600);
    // Select lines on, so the row's checkbox is part of what is measured.
    await page.evaluate(() => { openCopyBarFromDrawer(); }); await page.waitForTimeout(300);
    await page.locator('label.toggle:has(#ttCopyBulkCb) .slider').click(); await page.waitForTimeout(250);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#ttReading .tt-col-heb .tt-grid-row[data-vk]')].map(r => {
      const row = r.getBoundingClientRect(), v = r.querySelector('.tt-vnum').getBoundingClientRect(), c = r.querySelector('.tt-cell').getBoundingClientRect();
      const n = r.querySelector('.tt-num').getBoundingClientRect(), b = r.querySelector('.tt-copy').getBoundingClientRect(), cb = r.querySelector('.tt-bulk-cb').getBoundingClientRect();
      const mid = x => (x.top + x.bottom) / 2, rtl = document.documentElement.dir === 'rtl';
      return { above: v.bottom <= c.top + 1, full: Math.abs(c.width - row.width) < 1.5, oneRow: Math.abs(mid(n) - mid(b)) < 8 && Math.abs(mid(cb) - mid(b)) < 8,
        apart: (cb.right <= b.left + 0.5 || cb.left >= b.right - 0.5) && (n.right <= cb.left + 0.5 || n.left >= cb.right - 0.5), startEdge: rtl ? (n.right > b.right && n.right > cb.right) : (n.left < b.left && n.left < cb.left),
        beside: v.bottom > c.top + 4 && c.width < row.width - 30, inside: v.left >= row.left - 1 && v.right <= row.right + 1 && b.left >= 0 && b.right <= document.documentElement.clientWidth };
    }));
    rec.rows = rows.length;
    rows.forEach((g, i) => { const ok = want === 'above' ? g.above && g.full && g.oneRow && g.apart && g.startEdge && g.inside : g.beside && g.inside; if (!ok) rec.bad.push(i + ':' + JSON.stringify(g)); });
    rec.overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  } catch (e) { rec.note = String(e.message).split('\n')[0].slice(0, 160); }
  rec.errors = errors.length; rec.ok = rec.rows === 3 && !rec.bad.length && !rec.note && !rec.overflow;
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(16)} wants the strip ${r.want} its line: rows ${r.rows}, wrong ${r.bad.length}${r.bad.length ? ' ' + r.bad[0].slice(0, 200) : ''}${r.note ? ' — ' + r.note : ''} errors ${r.errors}`);
console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
