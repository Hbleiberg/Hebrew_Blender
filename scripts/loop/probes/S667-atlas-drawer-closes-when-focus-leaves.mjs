#!/usr/bin/env node
// S667 — trope_atlas.html below 1000px: the contents drawer closes when the keyboard focus leaves it, as Escape does.
// Left open, Tab past its last link put the focus on the sign table's first link, under the drawer (both UIs).
//   800×900 and 999×800 (mouse) × EN light / HE dark: the drawer opened by a real click on Contents, then Tab until the
//     focus leaves it — the drawer is closed (no .open, the button's aria-expanded false) and the control now focused
//     is the topmost thing at its centre; Tab on through the page never reopens it; Shift+Tab from the drawer's first
//     link (to the bar's Key select) closes it the same way, the select uncovered; Escape still closes it and returns
//     the focus to the button;
//   1280×900: the rail is no drawer — a Tab walk through all of its links never marks it open.
//
//   node scripts/loop/probes/S667-atlas-drawer-closes-when-focus-leaves.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy (the tree before S667 fails the four narrow cells).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
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
async function open(w, h, lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { if (sessionStorage.getItem('__s667')) return; sessionStorage.setItem('__s667', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('#atSysIdx a').length > 5, null, { timeout: 20000 });
  await page.evaluate(() => I18n.ready); await page.waitForTimeout(300);
  return { ctx, page, errs };
}
const state = page => page.evaluate(() => {
  const nav = document.getElementById('atIndex'), btn = document.getElementById('atIdxBtn'), a = document.activeElement;
  const r = a.getClientRects()[0] || a.getBoundingClientRect(), top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);   // a wrapped link's box centre is between its lines
  return { open: nav.classList.contains('open'), expanded: btn.getAttribute('aria-expanded'), inNav: nav.contains(a), isBtn: a === btn,
    covered: !(top && (top === a || a.contains(top))), what: (a.id ? '#' + a.id : a.tagName.toLowerCase()) + ' ' + (a.textContent || '').trim().slice(0, 24) };
});
for (const [w, h] of [[800, 900], [999, 800]]) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs } = await open(w, h, lang, dark);
  await page.locator('#atIdxBtn').click(); await page.waitForTimeout(250);
  const s0 = await state(page);
  const links = await page.evaluate(() => document.querySelectorAll('#atIndex a').length);
  let s = s0, presses = 0;
  while (presses < links + 5) { await page.keyboard.press('Tab'); presses++; await page.waitForTimeout(30); s = await state(page); if (!s.inNav) break; }
  await page.waitForTimeout(250); s = await state(page);
  const leaveOk = s0.open && s0.inNav && !s.inNav && !s.open && s.expanded === 'false' && !s.covered;
  // Tab on through the page: it never reopens
  let reopened = false; for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); if (!s.open && (await state(page)).open) reopened = true; }
  if ((await state(page)).open) { await page.keyboard.press('Escape'); await page.waitForTimeout(250); }   // the tree before: still open (it covers the button)
  await page.evaluate(() => scrollTo(0, 0));
  // Shift+Tab from the first link: out to the bar's Key select, the drawer closed
  await page.locator('#atIdxBtn').click(); await page.waitForTimeout(250);
  const first = await state(page);
  await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(250);
  const back = await state(page);
  // Escape closes it and returns the focus to the button (it is still open from the Shift+Tab step, over the button)
  if (!(await state(page)).open) { await page.locator('#atIdxBtn').click(); await page.waitForTimeout(250); }
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  const esc = await state(page);
  report(leaveOk && !reopened && first.inNav && !back.inNav && !back.open && !back.covered && !esc.open && esc.isBtn && !errs.length,
    `${w}×${h} ${lang} ${dark ? 'dark' : 'light'}: ${presses} Tabs from the first of ${links} links — the drawer ${s.open ? 'STILL OPEN' : 'closed'} (aria-expanded ${s.expanded}), focus on ${s.what} ${s.covered ? 'COVERED' : 'uncovered'}; Tab on ${reopened ? 'REOPENED it' : 'leaves it shut'}; Shift+Tab from the first link → ${back.what.slice(0, 12)} ${back.covered ? 'COVERED' : 'uncovered'}, drawer ${back.open ? 'STILL OPEN' : 'closed'}; Escape → ${esc.open ? 'STILL OPEN' : 'closed'}, focus ${esc.isBtn ? 'on the button' : esc.what}; errors ${errs.length}`);
  await ctx.close();
}
{
  const { ctx, page, errs } = await open(1280, 900, 'en', false);
  const n = await page.evaluate(() => { document.querySelector('#atIndex a').focus(); return document.querySelectorAll('#atIndex a').length; });
  let toggled = false; for (let i = 0; i < n + 2; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => document.getElementById('atIndex').classList.contains('open') || document.getElementById('atIdxBtn').getAttribute('aria-expanded') === 'true')) toggled = true; }
  report(!toggled && !errs.length, `1280×900: a Tab walk through the rail's ${n} links — ${toggled ? 'it was marked OPEN' : 'never marked open'}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
