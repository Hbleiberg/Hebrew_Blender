#!/usr/bin/env node
// S572 — Generator, Real Words sheets on a narrow screen: no card narrower than 100px on screen, no Hebrew word past its
// card, and the builder's own columns kept where they fit, on paper and in a full desktop window. The builder set 4–6
// columns from the item count alone, so a phone or an ~800px window squeezed each card into 44–93px (its number ran into
// its part-of-speech tag; on an iPhone SE about half the words were cut).
//
//   node scripts/loop/probes/S572-generator-realwords-narrow-cards.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before 39e7b42b fails every narrow cell);
//   --json prints the record.
//
// Cells: iPhone SE / 13 / 13 landscape / Pixel 7 (real descriptors, real taps) and 800 / 1280 windows × EN/HE × Reading and
// Self-Check; at 1280 also the print media at Letter width.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const SETUPS = { se: devices['iPhone SE'], i13: devices['iPhone 13'], i13l: devices['iPhone 13 landscape'], px7: devices['Pixel 7'], w800: { viewport: { width: 800, height: 900 } }, w1280: { viewport: { width: 1280, height: 900 } } };
const measure = () => {
  const g = document.querySelector('#worksheet .rw-grid'); const cards = [...g.children].filter(c => c.getBoundingClientRect().width);
  const cut = cards.filter(c => { const h = c.querySelector('.rw-flip-front > .rw-heb, :scope > .rw-heb'); if (!h) return false; const cr = c.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(h); return [...r.getClientRects()].some(a => a.left < cr.left - 0.5 || a.right > cr.right + 0.5); }).length;
  const want = +(g.style.getPropertyValue('--rw-cols') || (g.style.gridTemplateColumns.match(/repeat\((\d+)/) || [])[1]);
  return { cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, want, minW: Math.round(Math.min(...cards.map(c => c.getBoundingClientRect().width))), cut, n: cards.length };
};
const browser = await chromium.launch();
const records = [];
for (const [name, opts] of Object.entries(SETUPS)) for (const lang of ['en', 'he']) for (const drill of ['reading', 'vocab']) {
  const touch = !name.startsWith('w');
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c); localStorage.setItem('hebrewBlender_tourSeen', '1'); } }, lang);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('generateBtn'), null, { timeout: 30000 }); await page.waitForTimeout(700);
  const press = async sel => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); if (touch) await l.tap(); else await l.click(); await page.waitForTimeout(250); };
  if (!(await page.locator('[data-type="realwords"]').isVisible())) await press('[onclick^="expandAllMenus"]');
  await press('[data-type="realwords"]'); if (drill === 'vocab') await press('[data-drill="vocab"]');
  await press('#generateBtn'); await page.waitForFunction(() => document.querySelector('#worksheet .rw-grid'), null, { timeout: 20000 }); await page.waitForTimeout(500);
  const rec = { cell: `${name} ${lang} ${drill}`, screen: await page.evaluate(measure) };
  // On screen every card is whole and ≥ 100px (each sheet here holds two at least); a full desktop window keeps the builder's columns.
  rec.ok = rec.screen.cut === 0 && rec.screen.minW >= 99 && (name !== 'w1280' || rec.screen.cols === rec.screen.want);
  if (name === 'w1280') { await page.emulateMedia({ media: 'print' }); await page.setViewportSize({ width: 816, height: 1056 }); await page.waitForTimeout(300); rec.print = await page.evaluate(measure); rec.ok = rec.ok && rec.print.cols === rec.print.want && rec.print.cut === 0; }
  rec.errors = errors.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(18)} ${r.screen.cols}/${r.screen.want} cols, cards ≥ ${r.screen.minW}px, cut ${r.screen.cut}${r.print ? `  print ${r.print.cols}/${r.print.want} cols` : ''}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
