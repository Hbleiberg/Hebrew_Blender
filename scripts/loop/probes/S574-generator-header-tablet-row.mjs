#!/usr/bin/env node
// S574 — Generator: at tablet widths the header's buttons take their own row under a one-line title. Between the mobile
// gate (700px) and 960px (860px in Hebrew, whose shorter title keeps one line further) the title column shrank to
// 125–250px beside the buttons: three lines of title over a tagline of up to seven, a header 142–248px tall (gate 3,
// the maintainer chose "buttons on their own row").
//
//   node scripts/loop/probes/S574-generator-header-tablet-row.mjs     exit 1 when, inside the band, the header is over
//                                                                     125px, the title or tagline takes more than one
//                                                                     line, or a control sits beside the title; or when,
//                                                                     at any width 1000 → 320, the page overflows or a
//                                                                     header control overlaps another or leaves the window
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before the fix fails the band);
//   --json prints the record.
//
// 1px steps 1000 → 320, EN and HE, a mouse and a touch pointer (the touch language select reads 16px, wider).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const records = [];
for (const lang of ['en', 'he']) for (const touch of [false, true]) {
  const ctx = await browser.newContext(Object.assign({ viewport: { width: 1000, height: 800 }, serviceWorkers: 'block' }, touch ? { hasTouch: true } : {}));
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript((lang) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, lang);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof generate === 'function' && document.documentElement.lang, null, { timeout: 20000 });
  await page.waitForTimeout(800);
  const top = lang === 'he' ? 860 : 960;
  const fails = []; let maxIn = 0;
  for (let w = 1000; w >= 320; w--) {
    await page.setViewportSize({ width: w, height: 800 });
    const r = await page.evaluate(() => {
      const hdr = document.querySelector('header');
      const ctl = [...hdr.querySelectorAll('button, a, select, [role=button]')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 2 && getComputedStyle(e).visibility !== 'hidden'; });
      const bx = ctl.map(e => e.getBoundingClientRect());
      let overlap = 0;
      for (let i = 0; i < bx.length; i++) for (let j = i + 1; j < bx.length; j++) { if (ctl[i].contains(ctl[j]) || ctl[j].contains(ctl[i])) continue; const a = bx[i], b = bx[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlap++; }
      const lines = (el) => { if (!el || !el.getClientRects().length) return 0; const rg = document.createRange(); rg.selectNodeContents(el); return new Set([...rg.getClientRects()].map(x => Math.round(x.top))).size; };
      const h1 = hdr.querySelector('h1');
      return { hh: Math.round(hdr.getBoundingClientRect().height), tl: lines(h1), sl: lines(document.getElementById('headerSub')), below: Math.min(...bx.map(b => b.top)) >= h1.getBoundingClientRect().bottom - 1,
        ovx: document.documentElement.scrollWidth - document.documentElement.clientWidth, overlap, out: bx.filter(b => b.left < -1 || b.right > document.documentElement.clientWidth + 1).length };
    });
    if (r.ovx > 0 || r.overlap || r.out) fails.push({ w, ...r });
    if (w > 700 && w <= top) { maxIn = Math.max(maxIn, r.hh); if (r.hh > 125 || r.tl !== 1 || r.sl !== 1 || !r.below) fails.push({ w, ...r }); }
  }
  records.push({ cell: `${lang} ${touch ? 'touch' : 'mouse'}`, ok: !fails.length && !errors.length, band: `701–${top}`, maxHeaderInBand: maxIn, fails: fails.slice(0, 5), failCount: fails.length, errors });
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.cell + ` band ${r.band}: header max ${r.maxHeaderInBand}px` + (r.ok ? '' : ` — ${r.failCount} widths, first ${JSON.stringify(r.fails[0])}`) + (r.errors.length ? ' ' + r.errors.join(' | ') : '')));
const bad = records.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${records.length} cells fail` : `all ${records.length} cells pass`);
process.exit(bad ? 1 : 0);
