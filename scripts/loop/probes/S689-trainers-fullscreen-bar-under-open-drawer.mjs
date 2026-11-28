#!/usr/bin/env node
// S689 — in full screen the presentation bar (#ttFsBar, bottom, z-index 200) goes under the settings drawer it opened,
// as the Exit button does: it stays up while the drawer is open, and at 1024px its plate lay over the drawer's
// bottom-start corner (both trainers).
//
//   node scripts/loop/probes/S689-trainers-fullscreen-bar-under-open-drawer.mjs   (ROOT=<tree> runs another copy)
//   torah_trainer and tefillah_trainer × EN light 1024×768, HE dark 1024×768, EN light 1280×800: full screen by a real
//   click on #fsBtn, the bar woken by the mouse, the drawer opened by a real click on the bar's #ttFsSettings; every
//   4px point where the drawer's box and the bar's plate meet must hit-test inside the drawer. A cell where they do not
//   meet passes only if the bar was shown (1280's control). Exit 1 on a point the bar holds, a missing handle or a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
for (const pg of ['torah_trainer', 'tefillah_trainer']) for (const [lang, dark, w, h] of [['en', false, 1024, 768], ['he', true, 1024, 768], ['en', false, 1280, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); for (const k of ['hebrewTorahTrainer_tourSeen', 'hebrewTefillahTrainer_tourSeen']) localStorage.setItem(k, '1'); }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/${pg}.html`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach(o => o.classList.remove('open')));
  const tag = `${pg} ${lang} ${dark ? 'dark' : 'light'} ${w}`;
  if (!(await page.$('#fsBtn')) || !(await page.$('#ttFsSettings'))) { console.log('FAIL', tag, 'no #fsBtn / #ttFsSettings'); fail++; await ctx.close(); continue; }
  await page.click('#fsBtn'); await page.waitForTimeout(500);
  await page.mouse.move(w / 2, h - 30); await page.mouse.move(w / 2 + 5, h - 25); await page.waitForTimeout(400);
  await page.click('#ttFsSettings'); await page.waitForTimeout(700);
  const m = await page.evaluate(() => {
    const modal = document.getElementById('settingsModal'), bar = document.getElementById('ttFsBar');
    const plate = bar && (bar.querySelector('.tt-fs-plate') || bar.firstElementChild);
    if (!modal || !modal.classList.contains('open') || !plate) return { err: 'drawer not open or no plate (fullscreen ' + document.body.classList.contains('fullscreen') + ')' };
    const a = modal.getBoundingClientRect(), b = plate.getBoundingClientRect();
    const shown = getComputedStyle(bar).opacity > 0.5;
    const l = Math.max(a.left, b.left), r = Math.min(a.right, b.right), t = Math.max(a.top, b.top), btm = Math.min(a.bottom, b.bottom);
    let pts = 0, barHits = 0;
    for (let x = l + 1; x < r - 1; x += 4) for (let y = t + 1; y < btm - 1; y += 4) { pts++; const e = document.elementFromPoint(x, y); if (e && bar.contains(e)) barHits++; }
    return { shown, pts, barHits, fs: document.body.classList.contains('fullscreen') };
  });
  if (m.err) { console.log('FAIL', tag, m.err); fail++; await ctx.close(); continue; }
  const ok = m.fs && m.shown && m.barHits === 0 && !errs.length;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${tag.padEnd(32)} bar shown ${m.shown}; drawer ∩ plate ${m.pts} points, the bar on top at ${m.barHits}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
