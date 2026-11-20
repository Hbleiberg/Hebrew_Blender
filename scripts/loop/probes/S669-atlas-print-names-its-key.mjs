#!/usr/bin/env node
// S669 (pass G on the Trope Atlas) — paper never said which key the staffs were drawn in: the Key select lives in the
// sticky bar, which print hid whole, while the printed notes tell a reader each melody is in its source's key "unless
// you choose a common key at the top of the page". The bar now prints its Key label and the chosen option as text.
//   Key G / B♭ / As printed × Grid / Stacked × EN / HE, Letter, by page.pdf: sheet 1 carries the select's label and the
//   chosen option's text exactly as the page shows them (compared without vowel points, bidi controls or spaces, which
//   pdftotext reorders), the printed select borderless with no arrow, no page error.
//
//   node scripts/loop/probes/S669-atlas-print-names-its-key.mjs     exit 1 on any failing cell
//   ROOT=<a git archive of another tree> runs that copy (the tree before S669's key line fails 12 of 12)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's669k-'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const norm = s => s.replace(/[֑-ׇ‎‏‪-‮⁦-⁩\s]/g, '').toUpperCase();
for (const key of ['G', 'Bb', 'orig']) for (const view of ['grid', 'cards']) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, a, d]) => { try { if (sessionStorage.getItem('__s669k')) return; sessionStorage.setItem('__s669k', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewTropeAtlas_settings', JSON.stringify(a)); } catch (e) {} }, [lang, { key, view }, key === 'Bb']);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready);
  await page.waitForFunction(() => document.querySelectorAll('#atTable svg').length > 20 && !document.getElementById('atKey').disabled, null, { timeout: 30000 });
  const shown = await page.evaluate(() => { const s = document.getElementById('atKey'); return { label: document.querySelector('label[for="atKey"]').textContent.trim(), opt: s.options[s.selectedIndex].text, value: s.value }; });
  const f = path.join(TMP, `${key}-${view}-${lang}.pdf`);
  await page.pdf({ path: f, format: 'Letter', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  const one = norm(execFileSync('pdftotext', ['-f', '1', '-l', '1', f, '-']).toString());
  await page.emulateMedia({ media: 'print' });
  const sel = await page.evaluate(() => { const s = getComputedStyle(document.getElementById('atKey')); return { shown: s.display !== 'none' && document.getElementById('atKey').getClientRects().length > 0, plain: s.appearance === 'none' && s.borderTopWidth === '0px' }; });
  // the label sits right before the option on the sheet (an intro sentence also says "key"), so look for the pair; in
  // Hebrew pdftotext reorders the signature ("(1♯)" reads "(♯)1"), so its characters are compared in any order
  const o = norm(shown.opt), cut = o.indexOf('('), name = cut < 0 ? o : o.slice(0, cut), sig = cut < 0 ? '' : o.slice(cut);
  const sorted = s => [...s].sort().join('');
  const at = one.indexOf(norm(shown.label) + name);
  const pair = at >= 0 && sorted(one.slice(at + norm(shown.label).length + name.length).slice(0, sig.length)) === sorted(sig);
  report(shown.value === key && pair && sel.shown && sel.plain && !errs.length,
    `key ${key} ${view} ${lang}: sheet 1 ${pair ? 'names' : 'does NOT name'} "${shown.label} ${shown.opt}"; the select on paper ${sel.shown ? (sel.plain ? 'as text' : 'as a control') : 'hidden'}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
