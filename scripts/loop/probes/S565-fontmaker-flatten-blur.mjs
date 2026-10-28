#!/usr/bin/env node
// S565 — the Font Maker's lighting flatten (estimateBackground's box blur) stays bit-identical and fast on a phone
// photo. Its vertical pass walked each column top to bottom, a row's stride apart in memory: on a 3024×4032 photo
// that pass alone was 1.1 s of the 3.9 s the Trace step froze for (16 s at 4× CPU). The row sweep keeps one running
// sum per column, in the same order, so every pixel of the background estimate must come out the same.
//
//   node scripts/loop/probes/S565-fontmaker-flatten-blur.mjs      exit 1 if the estimate differs, or the full-size
//                                                                  estimate is not under 0.7× the column walk's time
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// The reference below is the column walk as it shipped before the fix. A photo is drawn in the page (a letter on lit
// paper with noise), picked through the wizard's default "Individual pictures" path by the real file input; then
// the page's own lumPlane → estimateBackground runs beside the reference on that photo, full size (Trace's flatten)
// and at Auto-detect's 1800 px. The Trace tab is then opened by a real click and its longest task reported.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); }
  window.__lt = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push({ s: e.startTime, d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true });
});
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
await page.goto(BASE + '/Hebrew_Font_Maker.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.getElementById('wizardOverlay')?.classList.contains('open'), null, { timeout: 60000 });
const b64 = await page.evaluate(() => {
  const W = 3024, H = 4032, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const g = c.createRadialGradient(W * 0.3, H * 0.3, 100, W / 2, H / 2, H); g.addColorStop(0, '#f6f3ec'); g.addColorStop(1, '#bdb7a9');
  c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#1b1b22'; c.font = '2000px serif'; c.textAlign = 'center'; c.fillText('א', W / 2, H * 0.68);
  const id = c.getImageData(0, 0, W, H), d = id.data;
  for (let p = 0; p < d.length; p += 4) { const n = (Math.random() - 0.5) * 22; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
  c.putImageData(id, 0, 0); return cv.toDataURL('image/jpeg', 0.88).split(',')[1];
});
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's565b-')), file = path.join(dir, 'alef.jpg');
fs.writeFileSync(file, Buffer.from(b64, 'base64'));
await page.fill('#wizName', 'Probe Photo'); await page.fill('#wizAuthor', 'Probe');
await page.click('#wizNext'); await page.click('#wizNext'); await page.click('#wizCreate');
await page.waitForTimeout(800);
await page.setInputFiles('#letterFile', file);
await page.waitForFunction(() => project.letters.some(l => l.source && l.source.dataUrl), null, { timeout: 60000 });
await page.waitForTimeout(4000);
const cmp = await page.evaluate(() => {
  function refV(src, dst, w, h, r) {   // the shipped column walk, verbatim
    const win = 2 * r + 1;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += src[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        dst[y * w + x] = acc / win;
        acc += src[Math.min(h - 1, y + r + 1) * w + x] - src[Math.max(0, y - r) * w + x];
      }
    }
  }
  const l = project.letters.find(x => x.source && x.source.dataUrl), im = imgCache[l.source.dataUrl];
  const out = {};
  for (const [label, k] of [['full', 1], ['detect', Math.min(1, 1800 / Math.max(im.width, im.height))]]) {
    const w = Math.round(im.width * k), h = Math.round(im.height * k);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true }); c.drawImage(im, 0, 0, w, h);
    const pl = lumPlane(c.getImageData(0, 0, w, h));
    let t = performance.now(); const mine = estimateBackground(pl.lum, pl.mask, w, h); const tPage = performance.now() - t;
    t = performance.now();   // the reference estimate, whole: the same fill and rounds, the column walk for V
    const n = w * h, a = new Float32Array(n), b = new Float32Array(n);
    for (let i = 0; i < n; i++) a[i] = pl.mask[i] ? pl.lum[i] : 255;
    const r = Math.max(4, Math.round(Math.min(w, h) / 8));
    for (let p = 0; p < 3; p++) { _boxBlurH(a, b, w, h, r); refV(b, a, w, h, r); } const tRef = performance.now() - t;
    const x = new Uint32Array(mine.buffer), y = new Uint32Array(a.buffer); let diff = 0;
    for (let i = 0; i < n; i++) if (x[i] !== y[i]) diff++;
    out[label] = { w, h, diff, pageMs: Math.round(tPage), refMs: Math.round(tRef), ratio: +(tPage / tRef).toFixed(2) };
  }
  return out;
});
const t0 = await page.evaluate(() => performance.now());
await page.click('#tabTrace');
await page.waitForTimeout(1500);
await page.waitForFunction(() => true, null, { timeout: 60000 });
let n = -1; for (let i = 0; i < 40; i++) { const c = await page.evaluate(t => window.__lt.filter(e => e.s >= t).length, t0); if (c === n) break; n = c; await page.waitForTimeout(700); }
const traceTasks = await page.evaluate(t => window.__lt.filter(e => e.s >= t).map(e => e.d), t0);
await browser.close(); server.close(); fs.rmSync(dir, { recursive: true, force: true });
const bad = [];
for (const [k, v] of Object.entries(cmp)) {
  if (v.diff) bad.push(`${k} (${v.w}×${v.h}): ${v.diff} pixels of the background estimate differ from the shipped blur`);
  if (k === 'full' && v.ratio > 0.7) bad.push(`${k} (${v.w}×${v.h}): estimateBackground ${v.pageMs} ms vs the column walk's ${v.refMs} (ratio ${v.ratio}, limit 0.7)`);
}
if (errors.length) bad.push(errors.length + ' pageerrors');
if (JSON_OUT) console.log(JSON.stringify({ root: ROOT, cmp, traceTasks, errors }, null, 1));
else {
  for (const [k, v] of Object.entries(cmp)) console.log(`${k.padEnd(6)} ${v.w}×${v.h}: estimate ${v.diff ? v.diff + ' pixels DIFFER' : 'bit-identical'}; ${v.pageMs} ms vs the column walk's ${v.refMs} ms (×${v.ratio})`);
  console.log(`Trace tab opened on the photo: long tasks [${traceTasks.join(', ')}]`);
}
bad.forEach(b => console.log('FAIL ' + b));
process.exit(bad.length ? 1 : 0);
