#!/usr/bin/env node
// S666 — the dashboard's Schedule Sync week grid: a sticky Start / End column inside a box that scrolls sideways, and day
// cells on a roving tabindex. The browser's own focus scroll stops at the box's edge, which the column covers, and leaves
// a partly shown control where it is, so an arrow press could land on a cell wholly under the column (88 of 88px at 800px
// in Hebrew, at 600px and below in English). Keyboard focus nudges the box now, as the Trope Atlas's Grid does (pattern
// focus-hidden-under-a-sticky-bar, the sideways arm).
//   Per cell (EN light 1280, HE dark 800, EN light 600, HE light 480, EN dark 390), two periods and the weekend shown:
//     arrows — 26 arrow presses across both rows and back: the focused cell is never under the column or past the box;
//     tab    — every day's ⋯ menu, every time field and every row's Remove, reached by Tab from the first to the last and
//              back: the same, and a time field is never past the box's edge;
//     mouse  — a real press on a day cell at the box's far edge paints it and moves the box not at all.
//
//   node scripts/loop/probes/S666-dashboard-week-grid-focus-clears-the-time-column.mjs   exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S666 fails the arrows and tab cells below 1280px).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0, pageErrors = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const settle = (page, ms = 40) => page.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms);
// how much of the focused control sits under the sticky column or outside the box (px), or why it cannot be read
const hidden = () => {
  const a = document.activeElement, w = document.querySelector('.swm-gridwrap'), g = document.getElementById('swmGrid');
  if (!a || !g.contains(a)) return { lost: (a && (a.id || a.className || a.tagName)) || 'nothing' };
  const r = a.getBoundingClientRect(), wr = w.getBoundingClientRect(), rtl = getComputedStyle(w).direction === 'rtl';
  let under = 0;
  if (!a.closest('.swm-timecell')) for (const t of g.querySelectorAll('.swm-timecell')) {
    const tr = t.getBoundingClientRect(); if (tr.bottom <= r.top || tr.top >= r.bottom) continue;
    under = Math.max(under, rtl ? r.right - tr.left : tr.right - r.left);
  }
  return { under: Math.round(Math.max(0, Math.min(under, r.width))), outside: Math.round(Math.max(0, Math.min(Math.max(wr.left - r.left, r.right - wr.right), r.width))), fv: a.matches(':focus-visible') || a.type === 'time' };   // a time field's inner parts change hands without the field matching for a frame
};
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: false, w: 600 }, { lang: 'he', dark: false, w: 480 }, { lang: 'en', dark: true, w: 390 }];
for (const c of CELLS) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 800 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { pageErrors++; console.log('PAGE ERROR ' + e); });
  await page.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) r.continue(); else r.abort(); });
  await page.addInitScript(([dark, lang]) => { try { if (localStorage.getItem('__s666')) return; localStorage.setItem('__s666', '1'); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewDashboard_setupSeen', '1'); localStorage.setItem('hebrewDashboard_tourSeen', '1'); } catch (e) {} }, [c.dark, c.lang]);
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof openWeekEditor === 'function' && typeof addWeekPeriod === 'function' && typeof setWeekWeekend === 'function');
  await page.waitForTimeout(900);
  await page.evaluate(() => { try { if (typeof frSkip === 'function' && document.querySelector('#frModal.open')) frSkip(); } catch (e) {} openWeekEditor(); });
  await settle(page, 150);
  await page.click('#swmAddPeriod'); await page.click('#swmAddPeriod');
  await page.evaluate(() => { const b = document.getElementById('swmWeekend'); if (!b.checked) b.click(); });
  await settle(page, 150);
  const built = await page.evaluate(() => ({ cells: document.querySelectorAll('#swmGrid .swm-cell').length, lead: document.querySelectorAll('#swmGrid .swm-timecell').length, scrolls: document.querySelector('.swm-gridwrap').scrollWidth > document.querySelector('.swm-gridwrap').clientWidth + 1 }));
  if (built.cells !== 14 || built.lead !== 3) { report(false, `${tag}: the week grid did not build (${JSON.stringify(built)})`); await ctx.close(); continue; }

  // arrows
  await page.focus('#swmGrid .swm-cell[tabindex="0"]'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  const fwd = c.lang === 'he' ? 'ArrowLeft' : 'ArrowRight', back = c.lang === 'he' ? 'ArrowRight' : 'ArrowLeft';
  let bad = [], n = 0;
  for (const k of [fwd, fwd, fwd, fwd, fwd, fwd, back, back, back, back, back, back, 'ArrowDown', fwd, fwd, fwd, fwd, fwd, fwd, 'ArrowUp', back, back, back, back, back, back]) {
    await page.keyboard.press(k); await settle(page); n++;
    const m = await page.evaluate(hidden);
    if (m.lost || !m.fv || m.under > 2 || m.outside > 2) bad.push(m.lost ? 'lost:' + m.lost : `${m.under}/${m.outside}`);
  }
  report(!bad.length, `${tag} arrows: ${n - bad.length} of ${n} presses leave the focused cell clear of the column and inside the box${bad.length ? ' (px under / outside: ' + bad.slice(0, 6).join(', ') + ')' : ''}${built.scrolls ? '' : ' — the box does not scroll at this width'}`);

  // tab: the ⋯ menus and the Remove buttons
  await page.evaluate(() => { document.querySelector('.swm-gridwrap').scrollLeft = 0; });
  await page.focus('#swmAddPeriod');
  bad = []; n = 0; let stops = 0;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab'); await settle(page);
    const m = await page.evaluate(hidden);
    if (m.lost) { if (stops) break; continue; }
    stops++; n++;
    if (!m.fv || m.under > 2 || m.outside > 2) bad.push(`${m.under}/${m.outside}`);
  }
  for (let i = 0; i < stops + 1; i++) {
    await page.keyboard.press('Shift+Tab'); await settle(page);
    const m = await page.evaluate(hidden);
    if (m.lost) continue;
    n++; if (!m.fv || m.under > 2 || m.outside > 2) bad.push(`${m.under}/${m.outside}`);
  }
  report(stops >= 14 && !bad.length, `${tag} tab: ${n - bad.length} of ${n} Tab stops in the grid (${stops} forward) clear of the column and inside the box${bad.length ? ' (px under / outside: ' + bad.slice(0, 6).join(', ') + ')' : ''}`);

  // mouse: a press on a cell at the far edge paints and does not move the box
  await page.evaluate(() => { document.activeElement.blur(); document.querySelector('.swm-gridwrap').scrollLeft = 0; });
  await page.click('#swmPalette .swm-chip'); await settle(page);
  const pt = await page.evaluate(() => {
    const w = document.querySelector('.swm-gridwrap').getBoundingClientRect(), rtl = getComputedStyle(document.querySelector('.swm-gridwrap')).direction === 'rtl';
    let best = null;
    for (const cell of document.querySelectorAll('#swmGrid .swm-cell[data-period="0"]')) { const r = cell.getBoundingClientRect(); const x = rtl ? Math.max(r.left, w.left) + 6 : Math.min(r.right, w.right) - 6; if (x > r.left + 1 && x < r.right - 1 && x > w.left && x < w.right && document.elementFromPoint(x, r.top + r.height / 2) === cell) { if (!best || (rtl ? x < best.x : x > best.x)) best = { x, y: r.top + r.height / 2, day: cell.dataset.day, cut: Math.round(rtl ? Math.max(0, w.left - r.left) : Math.max(0, r.right - w.right)) }; } }
    return best && Object.assign(best, { sl: document.querySelector('.swm-gridwrap').scrollLeft });
  });
  if (!pt) report(false, `${tag} mouse: no day cell found at the box's far edge`);
  else {
    await page.mouse.click(pt.x, pt.y); await settle(page);
    const after = await page.evaluate((day) => { const cell = document.querySelector('#swmGrid .swm-cell[data-period="0"][data-day="' + day + '"]'); return { sl: document.querySelector('.swm-gridwrap').scrollLeft, painted: !cell.classList.contains('swm-cell-free') }; }, pt.day);
    report(after.painted && Math.abs(after.sl - pt.sl) < 1, `${tag} mouse: a press on day ${pt.day} at the far edge (${pt.cut}px of it past the box) ${after.painted ? 'paints it' : 'does NOT paint it'} and moves the box ${Math.round(after.sl - pt.sl)}px`);
  }
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${cells - fails} / ${cells} cells pass, ${pageErrors} page errors`);
process.exit(fails || pageErrors ? 1 : 0);
