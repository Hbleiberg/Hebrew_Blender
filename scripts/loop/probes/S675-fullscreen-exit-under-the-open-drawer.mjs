#!/usr/bin/env node
// S675 (pass C on the Tefillah Trainer) — in fullscreen the Exit Full Screen button lay over the open settings drawer.
// The button is pinned to the physical top right at z-index 200; the drawer (100) opens on the inline end, which left to
// right is that corner: the button covered the drawer's dark toggle and its Close button whole, and the tops of its last
// tabs, so the keyboard's focus landed on a Close button nobody could see and a click there left fullscreen instead.
// On the Tefillah Trainer, the Torah Trainer and the Classroom Dashboard the button now goes under the drawer's backdrop
// while the drawer is open.
//
//   node scripts/loop/probes/S675-fullscreen-exit-under-the-open-drawer.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S675 fails every cell).
//
// Three pages × EN / HE × 1280 / 1024 wide, fullscreen entered and Settings opened from the bar by real clicks: every
// button of the drawer's header and every tab is the top element at its own centre, and so is the focused control; a
// click on the drawer's Close closes the drawer and fullscreen stays on; the Exit button is then on top again and a click
// on it leaves fullscreen. With the drawer open, a click where the Exit button stands does not leave fullscreen (in the
// Hebrew interface, where the drawer is on the other side, the backdrop takes it and the drawer closes). No page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const PAGES = [
  ['tefillah_trainer.html', '#ttFsSettings', { hebrewTefillahTrainer_tourSeen: '1' }],
  ['torah_trainer.html', '#ttFsSettings', { hebrewTorahTrainer_tourSeen: '1' }],
  ['classroom_dashboard.html', '#fsStrip button[onclick="openSettings()"]', { hebrewDashboard_tourSeen: '1', hebrewDashboard_setupSeen: '1' }],
];
const browser = await chromium.launch(); const records = [];
for (const [file, openSel, store] of PAGES) for (const lang of ['en', 'he']) for (const [w, h] of [[1280, 800], [1024, 768]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); for (const k in c.store) localStorage.setItem(k, c.store[k]); } }, { lang, store });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const rec = { cell: `${file.replace('.html', '')} ${lang} ${w}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const state = () => page.evaluate(() => ({ fs: document.body.classList.contains('fullscreen'), open: document.getElementById('settingsModal').classList.contains('open') }));
  const openDrawer = async () => { await page.mouse.move(300, 300); await page.waitForTimeout(250); await page.click(openSel); await page.waitForTimeout(600); };
  try {
    await page.goto(`${BASE}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.click('#fsBtn'); await page.waitForTimeout(600);
    await openDrawer();
    let s = await state(); need(s.fs && s.open, `fullscreen ${s.fs}, drawer ${s.open}`);
    const m = await page.evaluate(() => {
      const modal = document.getElementById('settingsModal'); const covered = []; let n = 0;
      const top = e => { const r = e.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && modal.contains(t) && (e.contains(t) || t.contains(e)); };
      for (const e of modal.querySelectorAll('.settings-header button, [role=tab]')) { if (!e.getClientRects().length) continue; n++; if (!top(e)) covered.push(e.id || e.getAttribute('aria-label')); }
      const a = document.activeElement; const ex = document.getElementById('fsExitBtn').getBoundingClientRect();
      const close = modal.querySelector('.settings-close:not(#drawerDarkBtn)').getBoundingClientRect();
      return { n, covered, focusIn: modal.contains(a), focusTop: modal.contains(a) && top(a), exit: { x: ex.left + ex.width / 2, y: ex.top + ex.height / 2 }, close: { x: close.left + close.width / 2, y: close.top + close.height / 2 } };
    });
    rec.controls = m.n; rec.covered = m.covered.length;
    need(m.n >= 6, `only ${m.n} header buttons and tabs`); need(!m.covered.length, `covered: ${m.covered.join(', ')}`); need(m.focusIn && m.focusTop, `the focus is ${m.focusIn ? 'on a covered control' : 'outside the drawer'}`);
    // a click where the Exit button stands, the drawer open: fullscreen stays
    await page.mouse.click(m.exit.x, m.exit.y); await page.waitForTimeout(500);
    s = await state(); rec.exitSpot = `fullscreen ${s.fs ? 'on' : 'OFF'}, drawer ${s.open ? 'open' : 'closed'}`;
    need(s.fs, 'a click where the Exit button stands left fullscreen with the drawer open'); if (lang === 'he') need(!s.open, 'the backdrop did not take the click');
    if (!s.fs) { await page.click('#fsBtn'); await page.waitForTimeout(600); }
    if (!(await state()).open) await openDrawer();
    // the drawer's own Close
    await page.mouse.click(m.close.x, m.close.y); await page.waitForTimeout(500);
    s = await state(); need(s.fs && !s.open, `a click on the drawer's Close: fullscreen ${s.fs}, drawer ${s.open}`);
    // the Exit button is back on top and works
    if (!s.fs) { await page.click('#fsBtn'); await page.waitForTimeout(600); } if ((await state()).open) { await page.keyboard.press('Escape'); await page.waitForTimeout(400); }
    await page.mouse.move(300, 300); await page.waitForTimeout(250);
    const onTop = await page.evaluate(() => { const b = document.getElementById('fsExitBtn'), r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && b.contains(t) && getComputedStyle(b).zIndex === '200'; });
    need(onTop, 'the drawer closed, the Exit button is not back on top');
    await page.mouse.click(m.exit.x, m.exit.y); await page.waitForTimeout(600);
    s = await state(); need(!s.fs, 'the Exit button did not leave fullscreen');
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close().catch(() => {});
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(30)} header buttons and tabs ${r.controls}, covered ${r.covered}; a click on the Exit button's spot: ${r.exitSpot}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const bad = records.filter(r => !r.ok);
console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
