#!/usr/bin/env node
// S687 — the Font Maker's template sheets draw every box's sample glyph as the shape to write. A sheet flows right to
// left (every set but English and Cyrillic), and the sample sat in that flow, so each bidi-mirrored character showed
// mirrored: "(" in Right Paren's box, ">" in Less Than's, "]" in Left Bracket's — and a font written from the sheet
// shipped its brackets backwards. The sample is now a left-to-right isolate (as the Preview PDF's punctuation page).
//
//   node scripts/loop/probes/S687-fontmaker-template-samples-never-mirror.mjs   (ROOT=<tree> runs another copy)
//   For the punctuation sheet, EN and HE UI: each mirrored character's sample, screenshotted, must equal the same
//   character drawn left to right, and differ from it drawn right to left (the control: a blind compare fails). Exit 1
//   on a mirrored sample or a silent control.
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
const MIRRORED = ['0028', '0029', '003C', '003E', '005B', '005D', '007B', '007D', '00AB', '00BB'];
const browser = await chromium.launch();
let fail = 0;
for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); }, lang);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/Hebrew_Font_Maker.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const ids = await page.evaluate((cps) => {
    if (typeof buildTemplatePageHTML !== 'function' || !TEMPLATE_SPECS || !TEMPLATE_SPECS.punct) return null;
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    const spec = TEMPLATE_SPECS.punct, items = spec.items.filter(it => cps.includes(it.cp.toUpperCase()));
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;';
    // the sheet exactly as renderTemplateCanvases mounts it (right to left), holding only the boxes under test
    const sheet = document.createElement('div');
    sheet.style.cssText = 'box-sizing:border-box;direction:rtl;width:' + TPL_PAGE.w + 'px;height:' + TPL_PAGE.h + 'px;padding:' + TPL_PAGE.pad + 'px;background:#fff;font-family:\'Source Sans 3\',sans-serif;overflow:hidden;';
    sheet.innerHTML = buildTemplatePageHTML(spec, items, 0, 1);
    host.appendChild(sheet); document.body.appendChild(host);
    const out = [];
    items.forEach((it, i) => {
      const ch = String.fromCodePoint(parseInt(it.cp, 16));
      const sample = [...sheet.querySelectorAll('span')].find(s => s.textContent === ch && /font-size:\s*22px/.test(s.getAttribute('style') || ''));
      if (!sample) { out.push({ cp: it.cp, missing: true }); return; }
      sample.id = 'smp' + i;
      for (const d of ['ltr', 'rtl']) {   // the references: the same span's style, alone in a block of each direction
        const blk = document.createElement('div'); blk.style.cssText = 'direction:' + d + ';display:inline-block;margin:4px;';
        const s = document.createElement('span'); s.setAttribute('style', sample.getAttribute('style').replace(/direction:[^;]*;?|unicode-bidi:[^;]*;?/g, '')); s.textContent = ch; s.id = d + i;
        blk.appendChild(s); host.prepend(blk);
      }
      out.push({ cp: it.cp, i });
    });
    return out;
  }, MIRRORED);
  if (!ids) { console.log(lang, 'FAIL: buildTemplatePageHTML / TEMPLATE_SPECS.punct not found'); fail++; await ctx.close(); continue; }
  await page.evaluate(() => document.fonts.ready);
  const rows = [];
  for (const r of ids) {
    if (r.missing) { rows.push(r.cp + ' no sample'); fail++; continue; }
    const shot = async sel => 'data:image/png;base64,' + (await (await page.$(sel)).screenshot()).toString('base64');
    const [s, l, rt] = await Promise.all([shot('#smp' + r.i), shot('#ltr' + r.i), shot('#rtl' + r.i)]);
    // each image cropped to its ink and scaled to a 16x24 grid; the sample is compared with both references
    const [vs, vl, vr] = await page.evaluate(async urls => Promise.all(urls.map(async u => {
      const im = new Image(); im.src = u; await im.decode();
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      const g = cv.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
      for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) { const k = (y * cv.width + x) * 4; if (255 - Math.min(d[k], d[k + 1], d[k + 2]) > 60) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
      if (x1 < 0) return null;
      const W = 16, H = 24, o = document.createElement('canvas'); o.width = W; o.height = H;
      const og = o.getContext('2d'); og.fillStyle = '#fff'; og.fillRect(0, 0, W, H); og.drawImage(cv, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, W, H);
      const od = og.getImageData(0, 0, W, H).data, v = [];
      for (let k = 0; k < od.length; k += 4) v.push(255 - Math.min(od[k], od[k + 1], od[k + 2]));
      return v;
    })), [s, l, rt]);
    const dist = (a, b) => a.reduce((t, x, k) => t + Math.abs(x - b[k]), 0) / a.length;
    const control = vl && vr && dist(vl, vr) > 12;
    const asLtr = vs && dist(vs, vl) < dist(vs, vr) * 0.75;
    if (!control) { rows.push(r.cp + ' control silent'); fail++; }
    else if (!asLtr) { rows.push(r.cp + ' MIRRORED'); fail++; }
    else rows.push(r.cp + ' ok');
  }
  if (errs.length) { fail++; rows.push('pageerrors ' + errs.length); }
  console.log(lang, rows.join(' · '));
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL (${fail})` : 'PASS');
process.exit(fail ? 1 : 0);
