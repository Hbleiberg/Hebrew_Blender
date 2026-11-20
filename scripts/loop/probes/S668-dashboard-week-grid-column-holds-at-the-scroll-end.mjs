#!/usr/bin/env node
// S668 (the S666 P4) — classroom_dashboard.html's Schedule Sync week grid: the sticky Start / End column's containing
// block is the grid's own box, which was `min-width: 540px` while its tracks are 642px (five days) or 824 (the weekend
// shown). Scrolled to its end in a narrow window, the column slid away with the box: 42–43px off its edge at 480px, 127
// at 390, EN and HE. The box is `min-width: min-content` now, as wide as its tracks; wider windows are unchanged.
//   1280, 1024, 800, 600, 480, 390 × EN light / HE dark × five / seven days, two periods added by real clicks and the
//   weekend by its checkbox: the wrap scrolled to its far end (the start in Hebrew), every time cell at the box's start
//   edge (each cell prints the box's and the tracks' widths).
//
//   node scripts/loop/probes/S668-dashboard-week-grid-column-holds-at-the-scroll-end.mjs   exit 1 on a failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy (the tree before S668 fails the four seven-day cells at 480 and 390).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg; const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(); let n = 0, bad = 0;
const settle = (page, ms = 60) => page.evaluate(ms => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms);
for (const w of [1280, 1024, 800, 600, 480, 390]) for (const [lang, dark] of [['en', false], ['he', true]]) for (const weekend of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, serviceWorkers: 'block' }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.addInitScript(([d, l]) => { try { if (localStorage.getItem('__p')) return; localStorage.setItem('__p', '1'); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_lang', l); } catch (e) {} }, [dark, lang]);
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof openWeekEditor === 'function'); await page.waitForTimeout(900);
  await page.evaluate(() => { try { if (typeof frSkip === 'function' && document.querySelector('#frModal.open')) frSkip(); } catch (e) {} openWeekEditor(); }); await settle(page, 150);
  await page.click('#swmAddPeriod'); await page.click('#swmAddPeriod');
  if (weekend) await page.locator('#swmWeekend').check(); await settle(page, 150);
  const g = await page.evaluate(() => { const wr = document.querySelector('.swm-gridwrap'), grid = document.getElementById('swmGrid');
    const rtl = getComputedStyle(wr).direction === 'rtl'; wr.scrollLeft = rtl ? -wr.scrollWidth : wr.scrollWidth; return null; });
  await settle(page);
  const m = await page.evaluate(() => { const wr = document.querySelector('.swm-gridwrap'), grid = document.getElementById('swmGrid'), rtl = getComputedStyle(wr).direction === 'rtl';
    const wb = wr.getBoundingClientRect(), gb = grid.getBoundingClientRect();
    const tc = [...grid.querySelectorAll('.swm-timecell')].map(t => t.getBoundingClientRect());
    const off = Math.max(...tc.map(r => rtl ? Math.round(wb.right - r.right) : Math.round(r.left - wb.left)));   // 0 = at the box's start edge
    const cellsW = [...grid.querySelectorAll('.swm-cell')].map(c => Math.round(c.getBoundingClientRect().width));
    return { box: Math.round(gb.width), wrap: Math.round(wb.width), scrollW: wr.scrollWidth, off, minCell: Math.min(...cellsW), scrolls: wr.scrollWidth > wr.clientWidth + 1 }; });
  const good = !m.scrolls || Math.abs(m.off) <= 1; n++; if (!good || errs.length) bad++;
  console.log(`${good ? 'PASS' : 'FAIL'} ${w} ${lang}${dark ? ' dark' : ''} ${weekend ? '7 days' : '5 days'}: grid box ${m.box} in a ${m.wrap} box, tracks ${m.scrollW}; scrolled to the end the column is ${m.scrolls ? (Math.abs(m.off) <= 1 ? 'at the start edge' : `${-m.off}px OFF its edge`) : 'n/a (no scroll)'}; narrowest day ${m.minCell}px; errors ${errs.length}`);
  await ctx.close();
}
console.log(`${n - bad}/${n}`); await browser.close(); server.close(); process.exit(bad ? 1 : 0);
