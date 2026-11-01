#!/usr/bin/env node
// S593 — Auto-detect reads a printed Letters template in the order it was printed, whichever interface printed it.
// The template sheet inherited the page's direction, so the Hebrew UI printed alef top-RIGHT and the English UI
// top-LEFT, while Auto-detect read every page it recognised left to right: a Hebrew-UI teacher's filled-in sheet came
// back with every letter in its row swapped (0 of 20 right on page 1, 1 of 7 on page 2). Every template now prints in
// its script's direction in both languages (Hebrew right to left, English and Cyrillic left to right) and
// Auto-detect reads every sheet right to left.
//
//   node scripts/loop/probes/S593-fontmaker-template-reads-in-print-order.mjs     exit 1 when a case misassigns a box
//   ROOT=<a git archive of the tree> runs the same check on another copy (the control); --json prints the record.
//
// Serves ROOT in-process (every foreign origin aborted, service workers blocked). "Printing": the page's own
// renderTemplateCanvases builds each sheet (its direction included); html2canvas, a CDN script, is replaced by a
// stand-in that paints one solid black mark in each box where the page laid it out, and records which letter that
// box holds. "Uploading": a fresh profile in the other (or the same) language, the wizard's one-sheet path, the
// real file input and the Auto-detect button by real clicks; each proposed box is scored against the letter
// written nearest its centre. Cases: print EN/HE × page 1/2 × upload in EN/HE (4 of the 8).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's593-'));
const errors = [];
async function open(lang) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript((lang) => {
    if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); }
  }, lang);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/Hebrew_Font_Maker.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && typeof TEMPLATE_SPECS === 'object' && typeof renderTemplateCanvases === 'function', null, { timeout: 60000 });
  await page.evaluate(() => I18n.ready);
  return { ctx, page };
}
async function print(lang) {   // → [{ png, truth: [{cp, cx, cy}] }] per page of the Letters template
  const { ctx, page } = await open(lang);
  const pages = await page.evaluate(async () => {
    const spec = TEMPLATE_SPECS.letters, per = spec.cols * spec.rowsPerPage, out = [];
    window.html2canvas = async (el, opts) => {   // the stand-in: ink where the page put each box
      const items = spec.items.slice(out.length * per, (out.length + 1) * per);
      const cells = [...el.querySelectorAll(':scope > div:last-child > div')];
      const r0 = el.getBoundingClientRect(), s = (opts && opts.scale) || 1;
      const cv = document.createElement('canvas'); cv.width = Math.round(r0.width * s); cv.height = Math.round(r0.height * s);
      const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#000';
      const truth = cells.map((cell, i) => {
        const r = cell.getBoundingClientRect(), cx = (r.left + r.width / 2 - r0.left) * s, cy = (r.top + r.height / 2 - r0.top + 9) * s;
        c.fillRect(cx - 35 * s, cy - 45 * s, 70 * s, 90 * s);
        return { cp: items[i].cp, cx, cy };
      });
      out.push({ truth, dir: getComputedStyle(el).direction });
      return cv;
    };
    const canvases = await renderTemplateCanvases('letters');
    return out.map((o, i) => Object.assign(o, { png: canvases[i].toDataURL('image/png') }));
  });
  await ctx.close();
  return pages.map((p, i) => {
    const f = path.join(tmp, `sheet-${lang}-p${i + 1}.png`);
    fs.writeFileSync(f, Buffer.from(p.png.split(',')[1], 'base64'));
    return { file: f, truth: p.truth, dir: p.dir };
  });
}
async function detect(lang, sheet) {
  const { ctx, page } = await open(lang);
  await page.waitForSelector('#wizardOverlay.open', { timeout: 60000 });
  for (let i = 0; i < 8; i++) {   // the wizard, by real clicks: one image with all letters → name → create
    if (await page.evaluate(() => { const e = document.getElementById('wizSrcCombined'); const t = e && e.closest('.wiz-tile'); return !!(t && t.offsetParent && !e.checked); })) await page.click('.wiz-tile:has(#wizSrcCombined)');
    const v = await page.evaluate(() => { const v = (id) => { const e = document.getElementById(id); return !!(e && !e.hidden && e.offsetParent); }; return { next: v('wizNext'), create: v('wizCreate'), name: v('wizName') }; });
    if (v.name && !(await page.inputValue('#wizName'))) { await page.fill('#wizName', 'Probe Sheet'); await page.fill('#wizAuthor', 'Probe'); }
    if (v.create) { await page.click('#wizCreate'); break; }
    if (v.next) await page.click('#wizNext');
    await page.waitForTimeout(200);
  }
  await page.waitForFunction(() => !document.querySelector('#wizardOverlay.open'), null, { timeout: 30000 });
  if (!(await page.$('#combinedFile'))) await page.click('#modeCombined');
  await page.setInputFiles('#combinedFile', sheet.file);
  await page.waitForSelector('.cn-autodetect', { timeout: 30000 });
  await page.click('.cn-autodetect');
  await page.waitForFunction(() => typeof adState !== 'undefined' && adState && adState.boxes && adState.boxes.length, null, { timeout: 60000 });
  const ad = await page.evaluate(() => ({ matched: !!adState.matched, boxes: adState.boxes.map(b => ({ cp: b.cp, cx: b.rect.x + b.rect.w / 2, cy: b.rect.y + b.rect.h / 2 })) }));
  await ctx.close();
  let right = 0; const wrong = [];
  for (const b of ad.boxes) {
    let best = null, bd = Infinity;
    for (const t of sheet.truth) { const d = (t.cx - b.cx) ** 2 + (t.cy - b.cy) ** 2; if (d < bd) { bd = d; best = t; } }
    if (String(b.cp || '').toLowerCase() === best.cp.toLowerCase()) right++;
    else wrong.push(String.fromCodePoint(parseInt(best.cp, 16)) + '→' + (b.cp ? String.fromCodePoint(parseInt(b.cp, 16)) : '∅'));
  }
  return { matched: ad.matched, boxes: ad.boxes.length, written: sheet.truth.length, right, wrong: wrong.join(' ') };
}
const printed = { en: await print('en'), he: await print('he') };
const cases = [['en', 0, 'en'], ['he', 0, 'he'], ['en', 1, 'he'], ['he', 1, 'en']];
const records = [];
for (const [pl, pg, ul] of cases) {
  const sheet = printed[pl][pg];
  const r = Object.assign({ print: pl, page: pg + 1, upload: ul, dir: sheet.dir }, await detect(ul, sheet));
  r.ok = r.matched && r.boxes === r.written && r.right === r.written;
  records.push(r);
}
const pass = records.every(r => r.ok) && errors.length === 0;
if (JSON_OUT) console.log(JSON.stringify({ pass, records, errors }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} printed ${r.print} (${r.dir}) page ${r.page}, read in ${r.upload}: ${r.right}/${r.written} right${r.matched ? '' : ' (page not recognised)'}${r.wrong ? ' — ' + r.wrong : ''}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} — Auto-detect reads a printed template in its printed order; pageerrors ${errors.length}`);
}
await browser.close(); server.close();
process.exit(pass ? 0 : 1);
