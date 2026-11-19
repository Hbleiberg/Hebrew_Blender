#!/usr/bin/env node
// S664 — Classroom Dashboard, Bulk preset edit: each card's four switch groups were a balanced multi-column box
// (`columns: 3 220px`), and balancing 40 cards' columns was over half of the editor's layout (its open ran twice as
// long as before the groups landed). They are placed on a grid now, in the same three arrangements:
//   one column below 468px of card width (and on a phone-width window), Board cards | the other three from 468px,
//   Board cards | Date & time | the two short groups from 716px.
// This probe opens the editor by real clicks (Settings → Presets → Bulk preset edit) over 12 presets, per width ×
// EN / HE, and reads every card:
//   columns   — the number of columns the card's width calls for, the same on every card, and none of the boxes a
//               multi-column container (the regression guard: `column-count` stays `auto`);
//   placement — Board cards alone in the first column; the last two groups stacked in the last column, 10px apart;
//               each column starts at the same top and the tallest ends at the box's edge (no trailing gap);
//   switches  — every switch sits at its group's start edge, in one line per column;
//   use       — a real click on a card's switch and on the master row's switch still reach the drafts (the footer's
//               note counts the change; the master's switch moves every card's).
//   BEFORE=<a git archive of an older tree> adds the comparison the fix was verified with: every card, group, label,
//   switch and box at the same place within 0.03px (multi-column and grid round a third of a width 1/64px apart).
//
//   node scripts/loop/probes/S664-dashboard-bulk-edit-switch-groups-on-a-grid.mjs     exit 1 on a failing cell or a page error
//   ROOT=<tree> runs another copy: the tree before S664 fails only the "no multi-column box" cells.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
function serve(root) {
  const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, base: `http://127.0.0.1:${server.address().port}` })));
}
const HEAD = await serve(ROOT), OLD = process.env.BEFORE ? await serve(process.env.BEFORE) : null;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const presets = {};
for (let i = 0; i < 12; i++) presets['Preset ' + String(i + 1).padStart(2, '0')] = { dashTextHTML: i % 3 === 0 ? '<b>שלום</b> כיתה ' + i : i % 3 === 1 ? 'Morning meeting <i>' + i + '</i>' : '', dashTextSize: 1.8 + (i % 4) * 0.2, hideWeather: i % 2 === 0, showNikkud: true, showTimer: i % 3 === 0 };
const SEED = { hebrewDashboard_presets: JSON.stringify(presets), hebrewDashboard_tourSeen: '1', hebrewDashboard_setupSeen: '1' };
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))));

async function openEditor(srv, lang, dark, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(srv.base) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d, seed]) => { try { if (localStorage.getItem('__s664')) return; localStorage.setItem('__s664', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); for (const k in seed) localStorage.setItem(k, seed[k]); } catch (e) {} }, [lang, dark, SEED]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.setDefaultTimeout(15000);
  await page.goto(`${srv.base}/classroom_dashboard.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && typeof openSettings === 'function'); await page.evaluate(() => I18n.ready); await settle(page); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach((m) => m.classList.remove('open')));
  await page.locator('#gearBtn').click(); await settle(page);
  await page.locator('#dashTabPresets').click(); await settle(page);
  await page.locator('#bulkPresetBtn').click();
  await page.waitForFunction(() => document.querySelectorAll('#bpeCards .bpe-card').length >= 12); await settle(page);
  return { ctx, page, errs };
}
const read = (page) => page.evaluate(() => {
  const rtl = document.documentElement.dir === 'rtl';
  const cards = [];
  for (const card of document.querySelectorAll('#bpeCards .bpe-card')) {
    const c = card.getBoundingClientRect(), chips = card.querySelector('.bpe-chips'), b = chips.getBoundingClientRect(), cs = getComputedStyle(chips);
    const groups = [...chips.querySelectorAll('.bpe-cgroup')].map((g) => { const r = g.getBoundingClientRect(); return { start: Math.round((rtl ? b.right - r.right : r.left - b.left) * 100) / 100, top: Math.round((r.top - b.top) * 100) / 100, bottom: Math.round((r.bottom - b.top) * 100) / 100, w: r.width, boxes: [...g.querySelectorAll('.bpe-chip .toggle')].map((i) => { const x = i.getBoundingClientRect(); return Math.round((rtl ? r.right - x.right : x.left - r.left) * 100) / 100; }) }; });
    const all = [];
    for (const el of card.querySelectorAll('.bpe-chips, .bpe-cgroup, .bpe-cgroup-lbl, .bpe-chip, .bpe-chip .toggle, .bpe-chip > span:last-child')) { const r = el.getBoundingClientRect(); all.push([r.left - c.left, r.top - c.top, r.width, r.height]); }
    cards.push({ W: b.width, H: b.height, pad: parseFloat(cs.paddingTop), cardH: c.height, groups, all, multicol: [...card.querySelectorAll('*')].filter((e) => getComputedStyle(e).columnCount !== 'auto').length });
  }
  return cards;
});

const WIDTHS = [1280, 1000, 880, 800, 700, 600, 561, 560, 390];
for (const lang of ['en', 'he']) for (const w of WIDTHS) {
  const dark = (w === 800 || w === 390);
  const tag = `${lang} ${dark ? 'dark' : 'light'} ${w}`;
  const o = await openEditor(HEAD, lang, dark, w);
  try {
    const cards = await read(o.page);
    const bad = [];
    let cols = null;
    cards.forEach((c, ci) => {
      const want = w <= 560 ? 1 : c.W >= 716 ? 3 : c.W >= 468 ? 2 : 1;
      const starts = [...new Set(c.groups.map((g) => Math.round(g.start)))].sort((a, b) => a - b);
      if (cols === null) cols = starts.length;
      if (starts.length !== want) bad.push(`card ${ci + 1}: ${starts.length} columns at ${Math.round(c.W)}px (want ${want})`);
      if (c.multicol) bad.push(`card ${ci + 1}: ${c.multicol} multi-column box`);
      const g = c.groups, col = (x) => starts.indexOf(Math.round(x.start));
      if (g.length !== 4) { bad.push(`card ${ci + 1}: ${g.length} groups`); return; }
      if (want === 3 && !(col(g[0]) === 0 && col(g[1]) === 1 && col(g[2]) === 2 && col(g[3]) === 2)) bad.push(`card ${ci + 1}: groups in columns ${g.map(col).join(',')}`);
      if (want === 2 && !(col(g[0]) === 0 && col(g[1]) === 1 && col(g[2]) === 1 && col(g[3]) === 1)) bad.push(`card ${ci + 1}: groups in columns ${g.map(col).join(',')}`);
      // a column's first group at the box's padding; stacked groups 10px apart; the tallest column ends at the box's edge
      const firsts = want === 3 ? [g[0], g[1], g[2]] : want === 2 ? [g[0], g[1]] : [g[0]];
      for (const f of firsts) if (Math.abs(f.top - c.pad - 1) > 0.6) bad.push(`card ${ci + 1}: a column starts ${f.top}px down (padding ${c.pad})`);   // 1px: the box's dashed rule
      const stacks = want === 3 ? [[g[2], g[3]]] : want === 2 ? [[g[1], g[2]], [g[2], g[3]]] : [[g[0], g[1]], [g[1], g[2]], [g[2], g[3]]];
      for (const [a, b] of stacks) if (Math.abs(b.top - a.bottom - 10) > 0.6) bad.push(`card ${ci + 1}: stacked groups ${Math.round((b.top - a.bottom) * 10) / 10}px apart`);
      const end = Math.max(...g.map((x) => x.bottom)), gap = c.H - end;
      if (Math.abs(gap - (want === 1 ? 10 : 0)) > 0.6) bad.push(`card ${ci + 1}: ${Math.round(gap * 10) / 10}px under the tallest column`);
      for (const x of g) if (new Set(x.boxes.map((v) => Math.round(v))).size !== 1 || Math.abs(x.boxes[0]) > 1) bad.push(`card ${ci + 1}: a switch off its group's start edge (${x.boxes.join(',')})`);
    });
    report(cards.length === 12 && !bad.length && o.errs.length === 0, `${tag}: 12 cards, ${cols} column${cols === 1 ? '' : 's'} at ${Math.round(cards[0].W)}px${bad.length ? ' — ' + bad.slice(0, 3).join('; ') : ''}, errors ${o.errs.length}`);

    if (w === 1280 || w === 800 || w === 390) {
      // use: one card's switch, then the master row's
      const note0 = await o.page.locator('#bpeModal .bpe-note').textContent();
      const first = o.page.locator('#bpeCards .bpe-card').first().locator('.bpe-chip[data-key="showTimer"]');
      const was = await first.locator('input').isChecked();
      await first.click(); await settle(o.page);
      const now = await first.locator('input').isChecked(), note1 = await o.page.locator('#bpeModal .bpe-note').textContent();
      if (await o.page.evaluate(() => document.getElementById('bpeMaster').classList.contains('collapsed'))) { await o.page.locator('#bpeMaster .bpe-master-toggle').click(); await settle(o.page); }
      // the master row's third box is Hide days panel (BPE_GROUPS' order), off on every seeded preset
      await o.page.locator('#bpeMaster .bpe-mgrid .bpe-mchip').nth(2).click(); await settle(o.page);
      const vals = await o.page.evaluate(() => [...document.querySelectorAll('#bpeCards .bpe-chip[data-key="hideDOW"] input')].map((i) => i.checked));
      const masterOk = vals.length === 12 && vals.every(Boolean);
      report(now !== was && note1 !== note0 && masterOk && o.errs.length === 0, `${tag}: a card's switch ${was} → ${now}, the note "${(note0 || '').trim().slice(0, 30)}" → "${(note1 || '').trim().slice(0, 40)}", the master row's box turned ${vals.filter(Boolean).length} of 12 cards' switches on, errors ${o.errs.length}`);
    }
    if (OLD) {
      const q = await openEditor(OLD, lang, dark, w);
      const old = await read(q.page);
      let moved = 0, worst = 0;
      cards.forEach((c, ci) => c.all.forEach((b, bi) => { const p = old[ci] && old[ci].all[bi]; if (!p) { moved++; return; } const d = Math.max(...b.map((v, k) => Math.abs(v - p[k]))); worst = Math.max(worst, d); if (d > 0.03) moved++; }));
      const heights = cards.every((c, ci) => old[ci] && Math.abs(c.cardH - old[ci].cardH) < 0.01);
      report(moved === 0 && heights && cards.length === old.length, `${tag}: against BEFORE, ${cards.reduce((s, c) => s + c.all.length, 0)} boxes, ${moved} moved more than 0.03px (largest ${worst.toFixed(3)}px), card heights ${heights ? 'equal' : 'differ'}`);
      await q.ctx.close();
    }
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
  await o.ctx.close();
}
await browser.close(); HEAD.server.close(); if (OLD) OLD.server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
