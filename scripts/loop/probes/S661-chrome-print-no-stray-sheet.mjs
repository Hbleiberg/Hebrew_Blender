#!/usr/bin/env node
// S661 — three chrome pages on paper, each a sheet-shape the screen never shows (patterns print-media-leak,
// print-trailing-padding-adds-a-sheet, fixed-surface-missing-from-the-print-hide-list):
//   hub      — printed while the one-time What's-new card shows (a returning visitor): the sheets and the first text's
//              position equal a print without the card (its reserved edge had opened sheet 1 about 3in down, a sheet
//              more on Letter);
//   contact  — one sheet, the footer's credit line on it (the old footer's social row had printed alone on a second
//              Letter sheet; the navy footer prints as one line of credits, its links and social buttons off paper);
//   fonts    — the Resources Fonts view: the first card on sheet 1 (in Hebrew on Letter the grid had moved whole to
//              sheet 2, leaving the heading alone), no sheet under 100 characters, no card button label on paper.
// × EN/HE × Letter/A4 (0.4in, no backgrounds), page.pdf read back with poppler. Sheet fit depends on the faces, so the
// page's Google Fonts are fetched through curl (the sandbox proxy) into a temp cache when they can be; FONTS=system,
// or no network, prints with the system faces (said loudly — Contact's Hebrew Letter cell fits either way there).
//
//   node scripts/loop/probes/S661-chrome-print-no-stray-sheet.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S661 fails 10 of the 12 with the web fonts: all but Contact on A4)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); }
catch (e) { console.log('SKIP: poppler (pdfinfo / pdftotext) is not installed'); process.exit(0); }
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's661-'));
const CACHE = path.join(os.tmpdir(), 's661-fontcache'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
let webFonts = process.env.FONTS !== 'system', fontMiss = 0;
const fetched = (url) => {   // a Google Fonts response through curl, cached on disk; null when it cannot be had
  const f = path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex'));
  try {
    if (!fs.existsSync(f)) { const hdr = execFileSync('curl', ['-sS', '-m', '20', '-A', UA, '-D', '-', '-o', f, url]).toString(); const m = hdr.match(/content-type:\s*([^\r\n]+)/i); if (!/ 200/.test(hdr.split('\n')[0])) { fs.rmSync(f, { force: true }); return null; } fs.writeFileSync(f + '.type', m ? m[1] : 'application/octet-stream'); }
    return { body: fs.readFileSync(f), type: fs.readFileSync(f + '.type', 'utf8') };
  } catch (e) { fs.rmSync(f, { force: true }); return null; }
};
const route = async (ctx) => ctx.route('**/*', r => {
  const u = r.request().url();
  if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
  if (webFonts && /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) { const c = fetched(u); if (c) return r.fulfill({ status: 200, body: c.body, headers: { 'content-type': c.type, 'access-control-allow-origin': '*' } }); fontMiss++; }
  return r.abort();
});
const PAPERS = [['Letter', 8.5, 11], ['A4', 8.27, 11.69]];
const sheets = (pdf) => { const n = +execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1]; const t = []; for (let p = 1; p <= n; p++) t.push(execFileSync('pdftotext', ['-f', '' + p, '-l', '' + p, pdf, '-']).toString()); return t; };
const firstY = (pdf) => Math.round(Math.min(...[...execFileSync('pdftotext', ['-bbox', '-f', '1', '-l', '1', pdf, '-']).toString().matchAll(/yMin="([\d.]+)"/g)].map(m => +m[1])));
async function load(file, lang, { card = false, view } = {}) {
  const ctx = await (await browserP).newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await route(ctx);
  await ctx.addInitScript(([lang, card]) => { if (sessionStorage.getItem('__s661')) return; sessionStorage.setItem('__s661', '1'); localStorage.setItem('hebrewBlender_lang', lang); if (!card) localStorage.setItem('hebrewBlender_whatsNewSeen', '2026-11-name-tags'); }, [lang, card]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/${file}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 20000 });
  await page.evaluate(() => I18n.ready); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(800);
  if (view) { await page.locator(`.view-toggle button[data-view="${view}"]`).click(); await page.waitForTimeout(1000); }
  return { ctx, page, errs };
}
const pdfOf = async (page, id, w, h) => { const f = path.join(TMP, id + '.pdf'); await page.pdf({ path: f, width: w + 'in', height: h + 'in', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } }); return f; };
const browserP = chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
for (const lang of ['en', 'he']) {
  // hub: with the card vs without
  const a = await load('index.html', lang, { card: true }), b = await load('index.html', lang);
  const shown = await a.page.evaluate(() => !document.getElementById('wnPop').hidden);
  for (const [paper, w, h] of PAPERS) {
    const pa = await pdfOf(a.page, `hub-card-${lang}-${paper}`, w, h), pb = await pdfOf(b.page, `hub-${lang}-${paper}`, w, h);
    const na = sheets(pa).length, nb = sheets(pb).length, ya = firstY(pa), yb = firstY(pb);
    report(shown && na === nb && Math.abs(ya - yb) <= 2 && !a.errs.length && !b.errs.length, `hub ${lang} ${paper}: the What's-new card ${shown ? 'shown' : 'NOT SHOWN (no control)'} → ${na} sheets, first text at ${ya}pt; without it ${nb} sheets, ${yb}pt`);
  }
  await a.ctx.close(); await b.ctx.close();
  // contact: one sheet, the footer's credit line on it, and no social names (they are buttons, nothing on paper)
  const c = await load('contact.html', lang);
  for (const [paper, w, h] of PAPERS) {
    const t = sheets(await pdfOf(c.page, `contact-${lang}-${paper}`, w, h));
    report(t.length === 1 && /CC BY-NC-SA 4\.0/.test(t[0]) && !/Threads/.test(t.join(' ')) && !c.errs.length, `contact ${lang} ${paper}: ${t.length} sheet${t.length > 1 ? 's' : ''}, the credit line ${/CC BY-NC-SA 4\.0/.test(t[0]) ? 'on sheet 1' : 'on sheet ' + (t.findIndex(x => /CC BY-NC-SA 4\.0/.test(x)) + 1)}${/Threads/.test(t.join(' ')) ? ', the social names printed' : ''}`);
  }
  await c.ctx.close();
  // resources Fonts view: the first card on sheet 1, no near-empty sheet, no button label
  const r = await load('resources.html', lang, { view: 'fonts' });
  const labels = await r.page.evaluate(() => [...new Set([...document.querySelectorAll('.font-card .font-actions button')].map(b => b.textContent.trim()).filter(Boolean))]);
  await r.page.emulateMedia({ media: 'print' });
  const marked = await r.page.evaluate(() => { const c = [...document.querySelectorAll('.font-card')].find(e => e.getClientRects().length); const t = c && document.createTreeWalker(c, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && n.parentElement.getClientRects().length ? 1 : 2 }).nextNode(); if (!t) return false; const s = document.createElement('span'); s.textContent = 'QQFIRSTQQ'; s.style.cssText = 'position:absolute;color:#fff;font:6px/1 monospace;'; t.parentNode.insertBefore(s, t); return true; });
  await r.page.emulateMedia({ media: null });   // page.pdf prints with print styles; a media left emulated would print it instead
  for (const [paper, w, h] of PAPERS) {
    const t = sheets(await pdfOf(r.page, `fonts-${lang}-${paper}`, w, h));
    const first = t.findIndex(x => x.includes('QQFIRSTQQ')) + 1, chars = t.map(x => x.replace(/QQFIRSTQQ/g, '').replace(/\s/g, '').length);
    const dead = labels.filter(l => t.some(x => x.includes(l)));
    report(marked && labels.length === 3 && first === 1 && chars.every(n => n >= 100) && !dead.length && !r.errs.length, `fonts ${lang} ${paper}: ${t.length} sheets [${chars}], the first card on sheet ${first || '?'}${labels.length !== 3 ? `, ${labels.length} button labels read (no control)` : ''}${dead.length ? `, printed: ${dead.join(' / ')}` : ''}`);
  }
  await r.ctx.close();
}
await (await browserP).close(); server.close();
if (fontMiss) console.log(`note: ${fontMiss} Google Fonts requests could not be fetched — those cells printed with system faces`);
else if (!webFonts) console.log('note: FONTS=system — printed with the system faces');
console.log(fails ? `${fails} / ${cells} cells fail` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
