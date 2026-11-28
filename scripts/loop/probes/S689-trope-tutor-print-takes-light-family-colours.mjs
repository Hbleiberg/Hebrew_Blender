#!/usr/bin/env node
// S689 — a dark-theme print of the Trope Tutor draws the trope families in the LIGHT palette. The family hues are
// inline body vars (applyFamilyColors) that outrank the print block's token reset, so the Phrases sheet's coloured
// bars and every chip's edge printed in the pale dark-screen inks (the Torah Trainer swaps its palette on beforeprint).
//
//   node scripts/loop/probes/S689-trope-tutor-print-takes-light-family-colours.mjs   (ROOT=<tree> runs another copy)
//   EN dark 1280 and HE dark 800 (+ EN light 1280, the control: nothing to swap): the Phrases tab, a real click on
//   Print phrases (window.print stubbed), then page.pdf — which fires beforeprint / afterprint — while a beforeprint
//   listener registered last records every family's printed --trope-*-line and a .tu-pbar's computed fill. Each must
//   equal TROPE_DEFAULTS_LIGHT; after the print the screen's own palette is back. Exit 1 otherwise, or on a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
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
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 's689-'));
let fail = 0;
for (const [lang, dark, w] of [['en', true, 1280], ['he', true, 800], ['en', false, 1280]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewTropeTutor_tourSeen', '1'); }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/trope_tutor.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#tuMelodySel option').length > 5, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const ok0 = await page.evaluate(() => {
    if (typeof TROPE_DEFAULTS_LIGHT !== 'object' || typeof TROPE_FAMILY_DEFS === 'undefined') return false;
    window.print = () => {}; window.__rec = null;
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    return true;
  });
  if (!ok0) { console.log('FAIL', lang, 'no page API'); fail++; await ctx.close(); continue; }
  await page.click('#tabPhrases'); await page.waitForTimeout(500);
  await page.click('#tuPrintPhrases'); await page.waitForTimeout(300);
  // registered after the page's own listeners, so it reads what the snapshot is drawn with
  await page.evaluate(() => window.addEventListener('beforeprint', () => {
    const bar = document.querySelector('#tuPhrasePrintSheet .tu-pbar');
    const cs = getComputedStyle(document.body);
    window.__rec = { vars: Object.fromEntries(TROPE_FAMILY_DEFS.map(f => [f.key, cs.getPropertyValue(`--trope-${f.key}-line`).trim().toLowerCase()])), bar: bar ? getComputedStyle(bar).fill : null, barFam: bar ? [...bar.classList].find(c => c.startsWith('fam-')) : null };
  }));
  await page.pdf({ path: path.join(tmp, `${lang}${dark}.pdf`), format: 'Letter' });
  const r = await page.evaluate(() => {
    const hex2rgb = h => { const n = parseInt(h.slice(1, 7), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    const screenPal = document.body.classList.contains('dark') ? TROPE_DEFAULTS_DARK : TROPE_DEFAULTS_LIGHT;
    const cs = getComputedStyle(document.body);
    const rec = window.__rec;
    if (!rec) return { err: 'beforeprint never fired' };
    const wrong = TROPE_FAMILY_DEFS.filter(f => rec.vars[f.key] !== String(TROPE_DEFAULTS_LIGHT[f.key]).toLowerCase()).map(f => `${f.key} ${rec.vars[f.key]}`);
    const fam = rec.barFam && rec.barFam.slice(4);
    const barOk = !!fam && rec.bar === hex2rgb(TROPE_DEFAULTS_LIGHT[fam]);
    const back = TROPE_FAMILY_DEFS.filter(f => cs.getPropertyValue(`--trope-${f.key}-line`).trim().toLowerCase() !== String(screenPal[f.key]).toLowerCase()).length;
    return { n: TROPE_FAMILY_DEFS.length, wrong, bar: rec.bar, fam, barOk, back };
  });
  if (r.err) { console.log('FAIL', lang, dark, r.err); fail++; await ctx.close(); continue; }
  const ok = !r.wrong.length && r.barOk && r.back === 0 && !errs.length;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${lang} ${dark ? 'dark ' : 'light'} ${w}: printed families off the light palette ${r.wrong.length}/${r.n} ${JSON.stringify(r.wrong.slice(0, 3))}; a ${r.fam} bar printed ${r.bar} (${r.barOk ? 'light' : 'NOT light'}); screen palette back ${r.back === 0 ? 'yes' : 'no (' + r.back + ')'}; errors ${errs.length}`);
  await ctx.close();
}
fs.rmSync(tmp, { recursive: true, force: true });
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
