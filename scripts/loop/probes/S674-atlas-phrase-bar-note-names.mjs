#!/usr/bin/env node
// S674 (the S671 H finding) — the Trope Atlas's Note names switch sat only in the melody table's bar, yet it writes the
// names under the phrase staffs too: from the phrase browser the switch was a screen up in the Grid and some thirty in
// Stacked. The phrase bar now carries the same switch a second time (one setting, two switches).
//   1280×800 EN light / HE dark, 800×1000 EN dark / HE light and an iPhone 13 (EN) × Grid / Stacked, by real clicks or
//   taps on the phrase bar's switch: names appear under the phrase staffs and the table's figures, both switches agree,
//   the setting is stored, the switch has not moved under the pointer (the table above it grew), it keeps the focus,
//   it sits inside its bar with no sideways scroll; off again; the table's own switch drives this one; a reload restores.
//
//   node scripts/loop/probes/S674-atlas-phrase-bar-note-names.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S674 has no such switch: every cell fails)
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
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const CELLS = [
  ['1280 en light', { viewport: { width: 1280, height: 800 } }, 'en', false], ['1280 he dark', { viewport: { width: 1280, height: 800 } }, 'he', true],
  ['800 en dark', { viewport: { width: 800, height: 1000 } }, 'en', true], ['800 he light', { viewport: { width: 800, height: 1000 } }, 'he', false],
  ['iPhone 13 en', { ...devices['iPhone 13'] }, 'en', false],
];
const state = page => page.evaluate(() => {
  const sw = document.getElementById('atNamesPhr'), bar = document.querySelector('.at-phrasebar');
  if (!sw) return null;
  const lab = sw.closest('label'), r = lab.getBoundingClientRect(), b = bar.getBoundingClientRect();
  return { top: sw.getBoundingClientRect().top, on: sw.checked, table: document.getElementById('atNames').checked,
    phraseNames: document.querySelectorAll('#atPhraseRows .tu-nn').length, tableNames: document.querySelectorAll('#atTable .tu-nn').length,
    stored: (() => { try { return JSON.parse(localStorage.getItem('hebrewTropeAtlas_settings') || '{}').names === true; } catch (e) { return null; } })(),
    focus: document.activeElement === sw, inBar: r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5,
    h: Math.round(r.height), text: lab.textContent.trim(), tableText: document.getElementById('atNames').closest('label').textContent.trim(),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 };
});
for (const [cell, dev, lang, dark] of CELLS) for (const view of ['grid', 'cards']) {
  const touch = !!dev.hasTouch;
  const ctx = await browser.newContext({ ...dev, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, v, d]) => { try { if (sessionStorage.getItem('__s674n')) return; sessionStorage.setItem('__s674n', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewTropeAtlas_settings', JSON.stringify({ view: v })); } catch (e) {} }, [lang, view, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  const ready = async () => { await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready); await page.waitForFunction(() => document.querySelectorAll('#atTable svg').length > 20 && document.querySelectorAll('#atPhraseRows .at-prow svg').length > 0, null, { timeout: 30000 }); };
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' }); await ready();
  const notes = [];
  let good = true; const need = (ok, what) => { if (!ok) { good = false; notes.push(what); } };
  const sw = page.locator('#atNamesPhr');
  if (!(await sw.count())) { report(false, `${cell} ${view}: the phrase bar has no Note names switch`); await ctx.close(); continue; }
  await page.evaluate(() => document.querySelector('.at-phrasebar').scrollIntoView({ block: 'center' })); await page.waitForTimeout(250);
  const press = async () => { if (touch) await sw.tap(); else await sw.click(); await page.waitForTimeout(350); };
  const a = await state(page);
  need(a && !a.on && !a.table && a.phraseNames === 0 && a.inBar && !a.overflow && a.h >= 24 && a.text === a.tableText && a.text.length > 2, `start ${JSON.stringify(a)}`);
  await press(); const b = await state(page);
  need(b.on && b.table && b.stored === true && b.phraseNames > 0 && b.tableNames > 0, `on ${JSON.stringify(b)}`);
  need(Math.abs(b.top - a.top) <= 1.5, `the switch moved ${Math.round(b.top - a.top)}px when turned on`);
  need(b.focus && b.inBar && !b.overflow, `after on: focus ${b.focus}, in its bar ${b.inBar}, overflow ${b.overflow}`);
  await press(); const c = await state(page);
  need(!c.on && !c.table && c.stored === false && c.phraseNames === 0 && c.tableNames === 0 && Math.abs(c.top - b.top) <= 1.5, `off ${JSON.stringify(c)} moved ${Math.round(c.top - b.top)}`);
  // the table's own switch drives this one, and a reload restores both
  await page.locator('#atNames').scrollIntoViewIfNeeded(); if (touch) await page.locator('#atNames').tap(); else await page.locator('#atNames').click(); await page.waitForTimeout(350);
  const d = await state(page); need(d.on && d.table && d.phraseNames > 0, `the table's switch ${JSON.stringify(d)}`);
  await page.reload({ waitUntil: 'load' }); await ready();
  const e = await state(page); need(e.on && e.table && e.phraseNames > 0 && e.tableNames > 0, `after a reload ${JSON.stringify(e)}`);
  need(!errs.length, `page errors ${errs.length}`);
  report(good, `${cell} ${view}: names under the phrase staffs ${b.phraseNames}, under the table's ${b.tableNames}; the switch moved ${Math.round(b.top - a.top)}px on, ${Math.round(c.top - b.top)}px off; ${a.h}px tall${notes.length ? ' — ' + notes.join('; ').slice(0, 300) : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
