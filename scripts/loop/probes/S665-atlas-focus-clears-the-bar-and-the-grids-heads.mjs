#!/usr/bin/env node
// S665 — Trope Atlas: the browser's focus scroll brings a control just into view at an edge. The page has a sticky bar
// at the top, and the melody table's Grid scrolls in its own box under a sticky heading row and a sticky sign column,
// so a figure reached by Shift+Tab or by the table's arrow keys came to rest under one of them, its focus ring hidden
// (the sign column covered whole buttons, 103–166px). The bar's height is the page's scroll padding now and the heads'
// live sizes the box's (pattern focus-hidden-under-a-sticky-bar).
//   Per cell (EN light 1280, HE dark 800, EN light 390) × Grid and Stacked, by real keys, each step waiting out the
//   page's smooth scroll:
//     arrows    — 84 arrow / Home / End presses over the table: no focused figure lies under the bar, the heading row
//                 or the sign column, or outside its box (five sample points must hit the figure);
//     Shift+Tab — 40 stops back from the Melody select, then 40 Tabs forward: the same;
//     padding   — the box's scroll padding is its heading row's height and its sign column's width + 6px (none in
//                 Stacked), and follows a language switch;
//     guard     — a pointer press on a figure half out of the box's far edge still sings it and the box stays put;
//     anchors   — #signs, #sys-esther and a sign's jump still land right under the bar (the offset is not doubled).
//
//   node scripts/loop/probes/S665-atlas-focus-clears-the-bar-and-the-grids-heads.mjs     exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S665 fails the arrows, Shift+Tab and padding cells).
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
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const CELLS = [{ lang: 'en', dark: false, w: 1280, h: 900 }, { lang: 'he', dark: true, w: 800, h: 900 }, { lang: 'en', dark: false, w: 390, h: 780 }];

async function load(c, view, hash = '') {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d, v]) => { try { if (localStorage.getItem('__s665')) return; localStorage.setItem('__s665', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); if (v === 'cards') localStorage.setItem('hebrewTropeAtlas_settings', JSON.stringify({ view: 'cards' })); } catch (e) {} }, [c.lang, c.dark, view]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html${hash}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#atPhraseRows svg.tu-pstaff').length > 0 && document.querySelectorAll('#atTable svg.tu-pstaff').length > 100, null, { timeout: 60000 });
  await rest(page);
  return { ctx, page, errs };
}
// the page and the Grid's box at rest (the page scrolls smoothly)
async function rest(page) {
  let last = '';
  for (let i = 0; i < 50; i++) { const y = await page.evaluate(() => Math.round(scrollY) + ':' + [...document.querySelectorAll('.at-grid')].map((g) => Math.round(g.scrollTop) + ',' + Math.round(g.scrollLeft)).join()); if (y === last) break; last = y; await page.waitForTimeout(110); }
}
// '' when the focused control is in the clear; else what covers it
const covered = () => {
  const el = document.activeElement; if (!el || el === document.body) return 'focus on the body';
  if (el.closest('#atBar, body > header')) return '';
  const r = el.getBoundingClientRect(), bar = document.getElementById('atBar').getBoundingClientRect();
  const name = (el.getAttribute('aria-label') || el.textContent || el.id || '').trim().slice(0, 26);
  const out = [];
  if (r.top < bar.bottom - 1) out.push('under the bar by ' + Math.round(bar.bottom - r.top));
  const box = el.classList.contains('at-grid');   // the Grid's own box is a region up to 80% of the window tall: its top is what must show
  if (r.bottom > innerHeight + 1 && !box) out.push('below the window');
  const grid = el.closest('.at-grid');
  if (grid && el !== grid) {
    const th = grid.querySelector('thead th').getBoundingClientRect(), g = grid.getBoundingClientRect(), lead = el.closest('tr').querySelector('.lead').getBoundingClientRect();
    if (r.top < th.bottom - 1) out.push('under the heading row by ' + Math.round(th.bottom - r.top));
    const ov = document.documentElement.dir === 'rtl' ? r.right - lead.left : lead.right - r.left;
    if (ov > 1) out.push('under the sign column by ' + Math.round(ov));
    if (r.bottom > g.bottom + 1 || r.right > g.right + 1 || r.left < g.left - 1) out.push('outside its box');
  }
  // five sample points: each must hit the control (or its label)
  let miss = 0;
  for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) { const hit = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); if (!hit || !(el.contains(hit) || hit.contains(el) || (hit.closest('label') && hit.closest('label').contains(el)))) miss++; }
  if (miss && !out.length && !box) out.push(miss + ' of 5 points covered');
  return out.length ? `"${name}" ${out.join(', ')}` : '';
};

for (const c of CELLS) for (const view of ['grid', 'cards']) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w} ${view === 'grid' ? 'Grid' : 'Stacked'}`;
  try {
    const { ctx, page, errs } = await load(c, view);
    // arrows
    await page.locator('#atTable .at-sing').first().focus(); await rest(page);
    const fwd = c.lang === 'he' ? 'ArrowLeft' : 'ArrowRight', bwd = c.lang === 'he' ? 'ArrowRight' : 'ArrowLeft';
    const seq = [...Array(8).fill('ArrowDown'), ...Array(14).fill(fwd), ...Array(6).fill('ArrowDown'), ...Array(14).fill(bwd), 'End', ...Array(12).fill('ArrowDown'), 'Home', ...Array(20).fill('ArrowUp'), 'End', ...Array(6).fill('ArrowUp'), 'Home'];
    let bad = [], moves = 0, last = '';
    for (const [i, k] of seq.entries()) {
      await page.keyboard.press(k); await rest(page);
      const cv = await page.evaluate(covered); const id = await page.evaluate(() => document.activeElement.getAttribute('aria-label'));
      if (id !== last) moves++; last = id;
      if (cv) bad.push(`${i} ${k} ${cv}`);
    }
    report(moves >= 60 && !bad.length && errs.length === 0, `${tag} arrows: ${seq.length} keys, ${moves} moves, ${bad.length} covered${bad.length ? ' — ' + bad.slice(0, 3).join('; ') : ''}, errors ${errs.length}`);
    // Shift+Tab back from the Melody select, then Tab forward
    await page.locator('#atMel').focus(); await rest(page);
    bad = []; let inTable = 0;
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Shift+Tab'); await rest(page); const cv = await page.evaluate(covered); if (cv) bad.push(`back ${i} ${cv}`); if (await page.evaluate(() => !!document.activeElement.closest('#atTable'))) inTable++; }
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); await rest(page); const cv = await page.evaluate(covered); if (cv) bad.push(`forward ${i} ${cv}`); }
    report(inTable >= 20 && !bad.length && errs.length === 0, `${tag} Shift+Tab ×40 then Tab ×40: ${inTable} stops in the table going back, ${bad.length} covered${bad.length ? ' — ' + bad.slice(0, 3).join('; ') : ''}, errors ${errs.length}`);
    // the box's padding
    const pad = () => page.evaluate(() => { const host = document.getElementById('atTable'), th = host.querySelector('thead th.lead'), cs = getComputedStyle(host); return { top: cs.scrollPaddingBlockStart, start: cs.scrollPaddingInlineStart, head: th ? th.offsetHeight : null, lead: th ? th.offsetWidth : null }; });
    const want = (p) => view === 'grid' ? p.top === (p.head + 6) + 'px' && p.start === (p.lead + 6) + 'px' : p.top === 'auto' && p.start === 'auto';
    const p1 = await pad();
    await page.evaluate((l) => I18n.setLang(l), c.lang === 'he' ? 'en' : 'he');
    await page.waitForFunction((l) => document.documentElement.lang === l, c.lang === 'he' ? 'en' : 'he'); await rest(page); await page.waitForTimeout(250);
    const p2 = await pad();
    report(want(p1) && want(p2) && errs.length === 0, `${tag} padding: ${p1.top} / ${p1.start} over a ${p1.head}px heading row and a ${p1.lead}px sign column; after a language switch ${p2.top} / ${p2.start} over ${p2.head} and ${p2.lead}`);
    // guard: a pointer press on a figure half out of the box still sings it, and the box stays put
    if (view === 'grid') {
      await page.evaluate((l) => I18n.setLang(l), c.lang); await page.waitForFunction((l) => document.documentElement.lang === l, c.lang); await rest(page);
      const at = await page.evaluate(() => {
        const g = document.querySelector('.at-grid'), b = document.querySelectorAll('#atlas-etnachta .at-sing')[3], gr = g.getBoundingClientRect();
        g.scrollIntoView({ block: 'center' }); g.scrollTop = 0; g.scrollLeft = 0;
        const r0 = b.getBoundingClientRect(), rtl = document.documentElement.dir === 'rtl';
        g.scrollLeft = rtl ? r0.right - (gr.left + g.clientLeft) - 14 : r0.left - (gr.left + g.clientLeft + g.clientWidth) + 14;   // 14px of it showing at the far edge
        const r = b.getBoundingClientRect();
        return { x: rtl ? r.right - 6 : r.left + 6, y: r.top + r.height / 2, sl: g.scrollLeft };
      });
      await rest(page);
      const pt = await page.evaluate(() => { const g = document.querySelector('.at-grid'), b = document.querySelectorAll('#atlas-etnachta .at-sing')[3], r = b.getBoundingClientRect(), rtl = document.documentElement.dir === 'rtl'; return { x: rtl ? r.right - 6 : r.left + 6, y: r.top + r.height / 2, sl: g.scrollLeft }; });
      await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(250);
      const after = await page.evaluate(() => { const g = document.querySelector('.at-grid'), b = document.querySelectorAll('#atlas-etnachta .at-sing')[3]; return { pressed: b.getAttribute('aria-pressed'), sl: g.scrollLeft, focus: document.activeElement === b }; });
      report(after.pressed === 'true' && Math.abs(after.sl - pt.sl) < 1 && errs.length === 0, `${tag} guard, a pointer press on a figure 14px inside the far edge: pressed ${after.pressed}, the box moved ${Math.round(after.sl - pt.sl)}px`);
    }
    await ctx.close();
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
}
// anchors land right under the bar, once
for (const c of CELLS.slice(0, 2)) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  const tops = [];
  for (const [hash, sel] of [['#signs', '#signs'], ['#sys-esther', '#sys-esther'], ['#sources', '#sources']]) {
    const { ctx, page, errs } = await load(c, 'grid', hash);
    const r = await page.evaluate((s) => { const t = document.querySelector(s).getBoundingClientRect(), b = document.getElementById('atBar').getBoundingClientRect(); return { gap: Math.round(t.top - b.bottom), end: Math.round(document.documentElement.scrollHeight - innerHeight - scrollY) }; }, sel);
    tops.push(`${hash} ${r.gap}px under the bar${r.end <= 1 ? ' (the page\'s end)' : ''}`);
    if (!((r.gap >= 4 && r.gap <= 16) || (r.end <= 1 && r.gap >= 4)) || errs.length) tops.push('← WRONG');
    await ctx.close();
  }
  const { ctx, page, errs } = await load(c, 'cards');
  await page.locator('#m-tevir .at-jump').focus(); await page.keyboard.press('Enter'); await rest(page);
  const j = await page.evaluate(() => { const t = document.getElementById('atlas-tevir').getBoundingClientRect(), b = document.getElementById('atBar').getBoundingClientRect(); return { gap: Math.round(t.top - b.bottom), focus: document.activeElement.id }; });
  report(!tops.includes('← WRONG') && j.focus === 'atlas-tevir' && j.gap >= 4 && j.gap <= 16 && errs.length === 0, `${tag} anchors: ${tops.join(', ')}; a sign's jump to its Stacked card ${j.gap}px under the bar, focus on #${j.focus}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
