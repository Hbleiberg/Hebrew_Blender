#!/usr/bin/env node
// S664 — Classroom Dashboard, Bulk preset edit: the dialog's scroll padding reserves its sticky head's and footer's
// live heights through two custom properties written on the dialog (--bpe-head-h / --bpe-foot-h). Plain custom
// properties inherit, so each write restyled every element of every card (6,856 over 40 presets, 21–35 ms at 1× CPU
// on each fold of the master row, and twice more while the cards were still being built). They are registered and
// non-inherited now: the dialog is their only reader.
//   Per cell (EN light 1280, HE dark 800, EN light 390), opened by real clicks over 12 presets:
//     padding  — the dialog's scroll padding is the head's and the footer's height + 8px (8px at the top where the
//                head scrolls with the cards), and follows the head when the master row is folded by a real click;
//     scope    — a card does not inherit the property (its computed value is the initial 0px);
//     restyle  — folding the master row restyles fewer than 150 elements (a CDP trace's UpdateLayoutTree counts;
//                the tree before restyles every element under the dialog: 2,100 with 12 presets);
//     keyboard — 30 Tabs from the first card and 30 Shift+Tabs from the footer: no focused control inside a card
//                lies under the sticky head or footer.
//
//   node scripts/loop/probes/S664-dashboard-bulk-edit-sticky-heights-restyle-one-element.mjs    exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S664 fails the scope and restyle cells).
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
const presets = {};
for (let i = 0; i < 12; i++) presets['Preset ' + String(i + 1).padStart(2, '0')] = { dashTextHTML: i % 2 ? 'Morning meeting ' + i : '<b>שלום</b> כיתה ' + i, dashTextSize: 1.8, hideWeather: i % 2 === 0 };
const SEED = { hebrewDashboard_presets: JSON.stringify(presets), hebrewDashboard_tourSeen: '1', hebrewDashboard_setupSeen: '1' };
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))));
const state = (page) => page.evaluate(() => {
  const m = document.getElementById('bpeModal'), h = m.querySelector('.bpe-head'), f = m.querySelector('.bpe-footer'), cs = getComputedStyle(m);
  return { head: h.offsetHeight, foot: f.offsetHeight, sticky: getComputedStyle(h).position === 'sticky', top: parseFloat(cs.scrollPaddingTop), bottom: parseFloat(cs.scrollPaddingBottom),
    onModal: cs.getPropertyValue('--bpe-head-h').trim(), onCard: getComputedStyle(m.querySelector('.bpe-card')).getPropertyValue('--bpe-head-h').trim(), under: m.querySelectorAll('*').length };
});

for (const c of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: false, w: 390 }]) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d, seed]) => { try { if (localStorage.getItem('__s664')) return; localStorage.setItem('__s664', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); for (const k in seed) localStorage.setItem(k, seed[k]); } catch (e) {} }, [c.lang, c.dark, SEED]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.setDefaultTimeout(15000);
  try {
    await page.goto(`${BASE}/classroom_dashboard.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && typeof openSettings === 'function'); await page.evaluate(() => I18n.ready); await settle(page); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach((m) => m.classList.remove('open')));
    await page.locator('#gearBtn').click(); await settle(page);
    await page.locator('#dashTabPresets').click(); await settle(page);
    await page.locator('#bulkPresetBtn').click();
    await page.waitForFunction(() => document.querySelectorAll('#bpeCards .bpe-card').length >= 12); await settle(page); await page.waitForTimeout(200);
    const a = await state(page);
    const wantTop = a.sticky ? a.head + 8 : 8;
    report(Math.abs(a.top - wantTop) < 1 && Math.abs(a.bottom - (a.foot + 8)) < 1 && errs.length === 0,
      `${tag} padding: head ${a.head}px (${a.sticky ? 'sticky' : 'scrolls with the cards'}), footer ${a.foot}px → scroll padding ${a.top} / ${a.bottom} (want ${wantTop} / ${a.foot + 8})`);
    report(a.onModal === a.head + 'px' && a.onCard === '0px', `${tag} scope: --bpe-head-h is ${a.onModal} on the dialog and ${a.onCard || '(unset)'} on a card (want ${a.head}px and 0px)`);
    // fold the master row under a trace
    const cdp = await ctx.newCDPSession(page);
    const events = []; cdp.on('Tracing.dataCollected', (d) => events.push(...d.value));
    await cdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'blink'] } });
    await page.locator('#bpeMaster .bpe-master-toggle').click(); await settle(page); await page.waitForTimeout(300);
    const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); await done;
    const counts = events.filter((e) => e.name === 'UpdateLayoutTree' && e.ph === 'X').map((e) => (e.args && (e.args.elementCount ?? (e.args.beginData && e.args.beginData.elementCount))) || 0);
    const most = Math.max(0, ...counts);
    const b = await state(page);
    report(counts.length > 0 && most < 150 && b.head < a.head, `${tag} restyle: folding the master row (head ${a.head} → ${b.head}px) restyled at most ${most} elements in one pass (${b.under} under the dialog)`);
    const wantTop2 = b.sticky ? b.head + 8 : 8;
    report(Math.abs(b.top - wantTop2) < 1, `${tag} padding after the fold: scroll padding ${b.top} (want ${wantTop2})`);
    await page.locator('#bpeMaster .bpe-master-toggle').click(); await settle(page); await page.waitForTimeout(200);
    // keyboard: nothing focused inside a card lies under the sticky head or footer
    const under = async () => page.evaluate(() => {
      const m = document.getElementById('bpeModal'), el = document.activeElement;
      if (!el || !el.closest('#bpeCards')) return null;
      const h = m.querySelector('.bpe-head'), f = m.querySelector('.bpe-footer'), r = el.getBoundingClientRect();
      const hb = getComputedStyle(h).position === 'sticky' ? h.getBoundingClientRect().bottom : -Infinity, ft = f.getBoundingClientRect().top;
      return (r.top < hb - 1 || r.bottom > ft + 1) ? `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} at ${Math.round(r.top)}–${Math.round(r.bottom)} (head to ${Math.round(hb)}, footer from ${Math.round(ft)})` : '';
    });
    const hidden = []; let seen = 0;
    await page.locator('#bpeCards .bpe-card').first().locator('.bpe-editor').focus();
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); const u = await under(); if (u !== null) { seen++; if (u) hidden.push(u); } }
    await page.locator('#bpeModal .bpe-footer button').first().focus();
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Shift+Tab'); const u = await under(); if (u !== null) { seen++; if (u) hidden.push(u); } }
    report(seen >= 40 && !hidden.length && errs.length === 0, `${tag} keyboard: ${seen} stops inside the cards over 30 Tabs and 30 Shift+Tabs, ${hidden.length} under a sticky bar${hidden.length ? ' — ' + hidden.slice(0, 2).join('; ') : ''}, errors ${errs.length}`);
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
