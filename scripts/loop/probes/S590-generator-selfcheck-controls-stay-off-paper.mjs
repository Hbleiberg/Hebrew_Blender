#!/usr/bin/env node
// S590 — Generator: a Self-Check's screen controls stay off paper. The print block hid the blend Self-Check's
// .score-bar / .self-check-controls / .timer-bar, but not Name the Letter's and Number Practice's .sc-controls (Reveal All,
// Hide All, the per-row buttons) nor a flipped card's Got it / Missed (.flip-card-score-btns), and Export PDF — which
// captures #worksheet whole when a Self-Check has no .sheet — dropped none of them (Real Words Gematria exported its
// score bar, Reset, both control rows and Got it / Missed). Measured as each lands: one card flipped by a real click,
// then (a) under print media, (b) in Export PDF's clone after the page's own onclone (html2canvas wrapped), every visible
// button or control row inside the captured region is counted — a button on paper is always wrong.
//
//   node scripts/loop/probes/S590-generator-selfcheck-controls-stay-off-paper.mjs   exit 1 when a button or control row
//          reaches print in any of 6 Self-Check variants (blend, Name the Letter, Gematria, Real Words Self-Check,
//          Real Words Gematria, Number Practice), or Export PDF where its button shows, or the live controls are not
//          back on screen after the export, or on a page error
//   PDF_LIBS=<dir holding html2canvas.min.js (1.4.1) and jspdf.umd.min.js (2.5.1)> serves cdnjs from disk for the
//   export arm (`npm pack html2canvas@1.4.1 jspdf@2.5.1`, their dist/ files); without it that arm skips loudly.
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the S590 fix fails 5 of the
//   6 variants); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const LIBS = process.env.PDF_LIBS || '';
const haveLibs = !!LIBS && ['html2canvas.min.js', 'jspdf.umd.min.js'].every(f => fs.existsSync(path.join(LIBS, f)));
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const check = sel => async p => { await p.evaluate(s => { const c = document.getElementById(s); if (c && !c.checked) c.click(); }, sel); };
const VARIANTS = {
  blend: async p => { await check('selfCheckToggle')(p); await check('timerToggle')(p); },
  nameTheLetter: async p => { await p.click('[data-type="one"]'); await p.waitForTimeout(200); await p.click('[data-worksheet="nametheletter"]'); await check('ntlSelfCheck')(p); },
  gematria: async p => { await p.click('[data-worksheet="gematria"]'); await check('gematriaSelfCheck')(p); },
  rwSelfCheck: async p =>   // the clean twin: its cards carry no screen controls (guarded by its flipped card alone)
    { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="vocab"]'); },
  rwGematria: async p => { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="gematria"]'); await check('rwGematriaSelfCheck')(p); },
  numberPractice: async p => { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="numpractice"]'); await check('npSelfCheck')(p); },
};
// Visible buttons and control rows inside el (a hidden ancestor hides them too).
const VIS = el => {
  const out = [];
  el.querySelectorAll('button, .score-bar, .timer-bar, .self-check-controls, .sc-controls').forEach(b => {
    const r = b.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) return;
    for (let a = b; a && a !== el.parentElement; a = a.parentElement) if (getComputedStyle(a).visibility === 'hidden') return;
    out.push(b.tagName === 'BUTTON' ? 'button «' + (b.textContent.trim().slice(0, 16) || b.className) + '»' : '.' + b.className.split(' ')[0]);
  });
  return out;
};
const browser = await chromium.launch();
const records = [];
let libHits = 0;
for (const [name, setup] of Object.entries(VARIANTS)) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); localStorage.setItem('hebrewBlender_tourSeen', '1'); });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE) || /^(data|blob):/.test(u)) return r.continue();
    if (haveLibs && u.startsWith('https://cdnjs.cloudflare.com/')) { libHits++; return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(LIBS, path.basename(new URL(u).pathname))) }); }
    return r.abort();
  });
  const page = await ctx.newPage(); let errors = 0; page.on('pageerror', () => errors++);
  await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'load' });
  await page.evaluate(() => window.I18n && I18n.ready);
  await page.click('#generateBtn'); await page.waitForTimeout(200);
  await setup(page); await page.click('#generateBtn'); await page.waitForTimeout(600);
  const card = page.locator('#worksheet .flip-card-inner, #worksheet .rw-flip-inner').first();
  const cards = await card.count(); if (cards) { await card.click(); await page.waitForTimeout(300); }
  const flipped = await page.evaluate(() => document.querySelectorAll('#worksheet .flipped').length);
  const screen = await page.evaluate(src => eval(src)(document.getElementById('worksheet')), VIS.toString());
  await page.emulateMedia({ media: 'print' });
  const print = await page.evaluate(src => eval(src)(document.getElementById('worksheet')), VIS.toString());
  await page.emulateMedia({ media: 'screen' });
  const r = { name, flipped, screenControls: screen.length, print };
  r.pdfButton = await page.isVisible('#pdfBtn');
  if (r.pdfButton && haveLibs) {
    await page.evaluate(() => ensurePdfLibs());
    await page.evaluate(src => { const VIS = eval(src); window.__cl = []; const h = window.html2canvas; window.html2canvas = function (el, o) { const oc = o.onclone; o.onclone = (d, c) => { if (oc) oc(d, c); window.__cl.push(VIS(c)); }; return h.call(this, el, o); }; }, VIS.toString());
    const dl = page.waitForEvent('download', { timeout: 120000 }); await page.click('#pdfBtn'); await dl;
    r.export = await page.evaluate(() => window.__cl.flat());
    r.screenAfter = (await page.evaluate(src => eval(src)(document.getElementById('worksheet')), VIS.toString())).length;
  }
  r.errors = errors;
  r.ok = flipped >= 1 && (r.screenControls > 0 || name === 'rwSelfCheck') && r.print.length === 0 && (!r.export || r.export.length === 0) && (r.screenAfter === undefined || r.screenAfter === r.screenControls) && errors === 0;
  records.push(r);
  await ctx.close();
}
await browser.close(); server.close();
const pass = records.every(r => r.ok) && (!haveLibs || libHits > 0);
if (JSON_OUT) console.log(JSON.stringify({ pass, exportArm: haveLibs, libHits, records }, null, 1));
else {
  if (!haveLibs) console.log('SKIP (export arm): set PDF_LIBS=<dir with html2canvas.min.js and jspdf.umd.min.js> to run Export PDF; the print arm runs');
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name}: ${r.screenControls} on screen; print ${r.print.length ? r.print.join(', ') : 'none'}${r.export ? `; export ${r.export.length ? r.export.join(', ') : 'none'}, back on screen ${r.screenAfter}` : r.pdfButton ? '; export skipped' : '; no Export PDF button'} (flipped ${r.flipped}, errors ${r.errors})`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} Self-Check variants keep their screen controls off paper`);
}
process.exit(pass ? 0 : 1);
