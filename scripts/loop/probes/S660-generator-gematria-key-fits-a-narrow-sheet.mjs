#!/usr/bin/env node
// S660 — the Real Words Gematria answer key stays inside a narrow sheet (the S657 P3). The key's cells hold the word
// with its reading, gloss and value, and its grid had no narrow-sheet floor (`3ab8b385` gave the student grid one, not
// the key), so its five 1fr columns grew to their content and ran past the sheet — off the left edge in the English UI,
// where nothing scrolls to it: up to 167px on an iPhone 13, 87–92 in an 800px window.
// Real Words → Gematria → Generate by real clicks, then five sheets by real Regenerate presses, × EN / HE on an iPhone 13,
// EN on an iPhone SE, EN / HE in an 800px window and EN at 1280: every key cell inside the sheet's content box (≤ 1px),
// the student grid too, and the desktop sheet still the builder's five columns; then the same 1280 sheet with
// #worksheet pinned at its max-width as Export PDF captures it — five columns. 0 page errors. Widths only, so the web
// fonts are not needed (foreign origins aborted; the floor holds whatever the face).
//
//   node scripts/loop/probes/S660-generator-gematria-key-fits-a-narrow-sheet.mjs
//   exit 1 on a cell past the sheet; ROOT=<a git archive of the tree> runs another copy (the tree before S660 fails
//   every narrow cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const CELLS = [
  { id: 'iPhone 13 EN', lang: 'en', opt: devices['iPhone 13'] },
  { id: 'iPhone 13 HE', lang: 'he', opt: devices['iPhone 13'] },
  { id: 'iPhone SE EN', lang: 'en', opt: devices['iPhone SE'] },
  { id: '800 EN', lang: 'en', opt: { viewport: { width: 800, height: 900 } } },
  { id: '800 HE', lang: 'he', opt: { viewport: { width: 800, height: 900 } } },
  { id: '1280 EN', lang: 'en', opt: { viewport: { width: 1280, height: 900 } }, desk: true },
];
const SHEETS = 5;
const measure = () => {
  const out = {};
  for (const [k, sel] of [['key', '.answer-key-sheet .blends-grid'], ['student', '.sheet:not(.answer-key-sheet) .blends-grid']]) {
    const g = document.querySelector(sel); if (!g || !g.children.length) { out[k] = null; continue; }
    const sheet = g.closest('.sheet'), sr = sheet.getBoundingClientRect(), cs = getComputedStyle(sheet);
    const L = sr.left + parseFloat(cs.paddingLeft), R = sr.right - parseFloat(cs.paddingRight);
    let past = 0; const top = g.children[0].getBoundingClientRect().top, cols = new Set();
    for (const c of g.children) { const r = c.getBoundingClientRect(); past = Math.max(past, L - r.left, r.right - R); if (Math.abs(r.top - top) < 2) cols.add(Math.round(r.left)); }
    out[k] = { past: Math.round(past), cols: cols.size };
  }
  return out;
};
const browser = await chromium.launch();
let fails = 0;
for (const cell of CELLS) {
  const ctx = await browser.newContext({ ...cell.opt, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url())) ? r.continue() : r.abort());
  await ctx.addInitScript(lang => { if (sessionStorage.getItem('__s660')) return; sessionStorage.setItem('__s660', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, cell.lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${base}/hebrew_blend_generator.html`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const expand = page.locator('button[onclick="expandAllMenus()"]'); if (await expand.isVisible()) await expand.click();
  await page.locator('[data-type="realwords"]').click(); await page.waitForTimeout(200);
  await page.locator('[data-drill="gematria"]').click(); await page.waitForTimeout(200);
  const side = page.locator('#generateBtn');
  if (await side.isVisible()) await side.click(); else await page.locator('#genFab .gen-fab-primary button').first().click();
  await page.waitForTimeout(600);
  const worst = { key: -1, student: -1 }, cols = { key: new Set(), student: new Set() }; let missing = 0;
  for (let i = 0; i < SHEETS; i++) {
    if (i) { await page.locator('#regenBtn').click(); await page.waitForTimeout(450); }
    const m = await page.evaluate(measure);
    for (const k of ['key', 'student']) { if (!m[k]) { missing++; continue; } worst[k] = Math.max(worst[k], m[k].past); cols[k].add(m[k].cols); }
  }
  let pdfCols = null;
  if (cell.desk) { pdfCols = await page.evaluate(m => { const w = document.getElementById('worksheet'); w.style.width = getComputedStyle(w).maxWidth; w.style.maxWidth = 'none'; const r = (new Function('return ' + m))()(); return r.key && r.key.cols; }, measure.toString()); }
  const good = !missing && worst.key <= 1 && worst.student <= 1 && !errs.length && (!cell.desk || ([...cols.key].join() === '5' && pdfCols === 5));
  if (!good) fails++;
  console.log(`${good ? 'PASS' : 'FAIL'} ${cell.id}: over ${SHEETS} sheets the key ${worst.key > 1 ? `runs ${worst.key}px past the sheet` : 'stays inside the sheet'} in ${[...cols.key].join('/')} columns, the student grid ${worst.student > 1 ? `${worst.student}px past` : 'inside'}${cell.desk ? `; pinned as Export PDF captures it, the key takes ${pdfCols} columns` : ''}${missing ? `; ${missing} grids missing` : ''}${errs.length ? `; ${errs.length} page errors` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${CELLS.length - fails} / ${CELLS.length} cells`);
process.exit(fails ? 1 : 0);
