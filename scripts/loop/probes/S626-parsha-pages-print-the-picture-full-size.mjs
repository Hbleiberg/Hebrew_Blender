#!/usr/bin/env node
// S626 — Ctrl+P on a generated parsha coloring page prints its picture filling the page (pass G on parsha_emojis + its
// parsha/ pages). The page's print rules show the picture alone, but a printed page is narrower than the 760px
// breakpoint (Letter 739px, A4 717px at the usual margins), so the narrow screens' `.pp-sheet{max-width:440px}` held on
// paper: the picture printed 4.59 × 6.07in in a corner of the 7.7 × 10.2in box. The print block lifts the cap.
//
//   node scripts/loop/probes/S626-parsha-pages-print-the-picture-full-size.mjs
//   All 54 parsha/ pages × Letter / A4 at 0.4in margins (EN light), then every sixth page in HE dark, and bereshit at
//   margins 0, 0.25, 0.75 and 1in: one page each, one image and no text on paper, the picture's placed size (from the
//   PDF's image resolution) filling the printable box on its limiting side (≥ 0.97). exit 1 when a step fails or a
//   handle is missing. Needs poppler's pdfinfo, pdfimages and pdftotext (skips loudly). ROOT=<a git archive of the tree>
//   runs another copy (the tree before S626 prints the picture 4.59 × 6.07in, 0.59–0.73 of the box, wherever the page is under
//   760px wide: 131 of 134 prints fail; only 0in margins and Letter at 0.25in fill it).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
try { for (const t of ['pdfinfo', 'pdfimages', 'pdftotext']) execFileSync(t, ['-v'], { stdio: 'ignore' }); }
catch (e) { console.log('SKIP: poppler (pdfinfo / pdfimages / pdftotext) is not installed'); process.exit(0); }
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's626-'));
const browser = await chromium.launch();
let fail = 0, checked = 0;
const bad = msg => { fail++; console.log(`✘ ${msg}`); };
const slugs = fs.readdirSync(path.join(ROOT, 'parsha')).filter(f => /\.html$/.test(f) && f !== 'index.html').map(f => f.slice(0, -5)).sort();
if (slugs.length !== 54) bad(`handle — ${slugs.length} parsha pages, 54 expected`);
const PAPER = { Letter: [8.5, 11], A4: [8.27, 11.69] };
async function check(page, label, paper, m) {
  const f = path.join(tmp, 'p.pdf');
  await page.pdf({ path: f, format: paper, margin: { top: m, bottom: m, left: m, right: m } });
  const n = +execFileSync('pdfinfo', [f]).toString().match(/Pages:\s+(\d+)/)[1];
  const text = execFileSync('pdftotext', [f, '-']).toString().replace(/\s+/g, '');
  const imgs = execFileSync('pdfimages', ['-list', f]).toString().trim().split('\n').slice(2).map(l => l.trim().split(/\s+/));
  checked++;
  if (imgs.length !== 1) return bad(`${label} ${paper} ${m}: ${imgs.length} images on paper (${n} pages)`);
  const [pxW, pxH, ppiX, ppiY] = [imgs[0][3], imgs[0][4], imgs[0][12], imgs[0][13]].map(Number);
  const wIn = pxW / ppiX, hIn = pxH / ppiY, bw = PAPER[paper][0] - 2 * parseFloat(m), bh = PAPER[paper][1] - 2 * parseFloat(m);
  const fill = Math.max(wIn / bw, hIn / bh);
  if (n !== 1 || text || fill < 0.97) bad(`${label} ${paper} ${m}: ${n} pages, text "${text.slice(0, 40)}", the picture ${wIn.toFixed(2)} × ${hIn.toFixed(2)}in in a ${bw.toFixed(2)} × ${bh.toFixed(2)}in box (fill ${fill.toFixed(2)})`);
  return fill;
}
for (const cell of [{ lang: 'en', dark: false }, { lang: 'he', dark: true }]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'}`;
  const list = cell.lang === 'en' ? slugs : slugs.filter((s, i) => i % 6 === 0);
  let lo = 9;
  for (const s of list) {
    await page.goto(`${base}/parsha/${s}.html`, { waitUntil: 'load' });
    const ready = await page.evaluate(() => { const i = document.getElementById('ppImg'); return !!i && i.complete && i.naturalWidth > 0; });
    if (!ready) { bad(`${L} ${s}: handle — #ppImg missing or not loaded`); continue; }
    for (const paper of ['Letter', 'A4']) lo = Math.min(lo, await check(page, `${L} ${s}`, paper, '0.4in') || 0);
  }
  if (cell.lang === 'en') {
    await page.goto(`${base}/parsha/bereshit.html`, { waitUntil: 'load' });
    for (const paper of ['Letter', 'A4']) for (const m of ['0in', '0.25in', '0.75in', '1in']) lo = Math.min(lo, await check(page, `${L} bereshit`, paper, m) || 0);
  }
  console.log(`${L}: ${list.length} pages printed, the smallest fill ${lo.toFixed(2)}`);
  if (errors.length) bad(`${L}: page errors ${errors.join(' | ')}`);
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
console.log(fail ? `FAIL: ${fail} of ${checked} prints` : `PASS: ${checked} prints, each one page, the picture filling it`);
process.exit(fail ? 1 : 0);
