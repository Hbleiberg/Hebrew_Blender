#!/usr/bin/env node
// S688 — Edit points' hint card ("Drag points to reshape · ? for all shortcuts") keeps clear of the canvas's side
// ruler. With the rulers on, the card was centred in the stage and capped at 96% of it, so on a phone it reached under
// the 22px vertical ruler (which sits above it) and every line lost its first letters ("Orag points", Hebrew line ends).
//
//   node scripts/loop/probes/S688-fontmaker-node-hint-clears-the-ruler.mjs   (ROOT=<tree> runs another copy)
//   iPhone SE EN light, Pixel 7 HE dark, and 1280 EN light (the control: a desktop card is narrower than its cap and
//   must keep its natural width): a project letter given an outline, Edit points opened; the leftmost edge of the
//   card's text must lie right of the ruler's right edge. Exit 1 on text under the ruler, a capped desktop card, a
//   missing ruler or hint, or a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium, devices } = pkg;
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
const CELLS = [
  { k: 'iPhone SE en light', opts: { ...devices['iPhone SE'] }, lang: 'en', dark: false },
  { k: 'Pixel 7 he dark', opts: { ...devices['Pixel 7'] }, lang: 'he', dark: true },
  { k: 'desktop 1280 en light', opts: { viewport: { width: 1280, height: 900 } }, lang: 'en', dark: false, desk: true },
];
for (const c of CELLS) {
  const ctx = await browser.newContext({ ...c.opts, serviceWorkers: 'block', colorScheme: c.dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); localStorage.setItem('hebrewFontMaker_mobileWarnDismissed', '1'); }, c.lang);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/Hebrew_Font_Maker.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    if (typeof setWorkMode !== 'function' || typeof project === 'undefined' || !project) return { err: 'no page API' };
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    const l = project.letters.find(x => x.codepoint === curCp) || project.letters[0];
    l.contours = [{ winding: 'cw', points: [[100, 0], [100, 600], [500, 600], [500, 0]] }]; l.advance = l.advance || 600;   // probe-only state
    if (!document.body.classList.contains('rulers-on') && typeof setRulersShown === 'function') setRulersShown(true);
    setWorkMode('nodes');
    return { ok: true };
  });
  if (r.err) { console.log('FAIL', c.k, r.err); fail++; await ctx.close(); continue; }
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('stage').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const hint = document.getElementById('nodeHint'), span = hint && hint.querySelector('span'), rv = document.querySelector('.rl-v');
    if (!span || hint.hidden || !hint.offsetParent) return { err: 'no visible hint' };
    if (!rv || !rv.offsetParent) return { err: 'no visible ruler (rulers-on: ' + document.body.classList.contains('rulers-on') + ')' };
    const rg = document.createRange(); rg.selectNodeContents(span);
    const inkL = Math.min(...[...rg.getClientRects()].map(q => q.left)), rulerR = rv.getBoundingClientRect().right;
    const w = hint.getBoundingClientRect().width; hint.style.maxWidth = 'none'; const natural = hint.getBoundingClientRect().width; hint.style.maxWidth = '';
    return { inkL: Math.round(inkL), rulerR: Math.round(rulerR), w: Math.round(w), natural: Math.round(natural), W: innerWidth };
  });
  if (m.err) { console.log('FAIL', c.k, m.err); fail++; await ctx.close(); continue; }
  const ok = m.inkL >= m.rulerR && (!c.desk || m.w === m.natural) && (c.desk || m.natural > m.w);   // a phone card must be wide enough to need its cap (else the cell proves nothing)
  if (!ok || errs.length) fail++;
  console.log(`${ok && !errs.length ? 'PASS' : 'FAIL'} ${c.k.padEnd(22)} width ${m.W}: text from ${m.inkL}px, ruler to ${m.rulerR}px; card ${m.w} (natural ${m.natural}); errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
