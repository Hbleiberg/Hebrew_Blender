#!/usr/bin/env node
// S669 (pass G on the Trope Atlas; pattern print-block-split-at-a-sheet-foot) — printed, the atlas left one to seven
// sign cards' heads alone at a sheet's foot, their staffs over the page under no name, and a section heading or two
// ("Melody table", "Reading the staffs") alone the same way. Paper now keeps a heading with what follows it, a figure
// and a phrase row whole, the footer whole, and pays the sheet back (main's and the footer links' screen padding).
//   Grid (the cards the print swaps in) and Stacked with a common key, note names and the Eicha phrases × EN / HE ×
//   Letter / A4 by page.pdf at 0.4in (8 PDFs): out-of-flow white markers at each card's head, its first figure and its
//   end, each phrase row's start and end, and each heading and its follower, added by a beforeprint listener that runs
//   after the page's own; pdftotext per sheet says where each landed. Every cell: 27 cards marked, no card head or
//   heading on a sheet before its follower, no phrase row split, no sheet under 120 characters, no page error; the
//   Grid's English A4 print no longer than 79 sheets.
//
//   node scripts/loop/probes/S669-atlas-print-card-heads-keep-their-figures.mjs     exit 1 on any failing cell
//   FONTS=system skips the Google Fonts fetch (curl through the proxy) and prints in the system faces
//   ROOT=<a git archive of another tree> runs that copy (the tree before S669 fails 8 of 8 with the web faces)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's669-'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
// the page's Google Fonts, fetched once by curl (it goes through the session's proxy) and served from a cache
const FONT_CSS = 'https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;600;700&display=swap';
let fontCss = null;
if (process.env.FONTS !== 'system') {
  try {
    fontCss = execFileSync('curl', ['-sSf', '-A', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', FONT_CSS], { timeout: 30000 }).toString();
    for (const u of new Set(fontCss.match(/https:\/\/fonts\.gstatic\.com[^)]+/g) || [])) execFileSync('curl', ['-sSf', u, '-o', path.join(TMP, u.replace(/\W/g, '_'))], { timeout: 30000 });
  } catch (e) { fontCss = null; console.log('NOTE the Google Fonts fetch failed: printing in the system faces'); }
}
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
const MARK = () => {
  const mk = (host, txt, atEnd) => { const s = document.createElement('span'); s.className = 's669m'; s.textContent = ' ' + txt + ' ';
    s.style.cssText = 'position:absolute;font:2px monospace;color:#fff;white-space:nowrap;pointer-events:none;';
    if (atEnd) host.appendChild(s); else host.insertBefore(s, host.firstChild); };
  document.querySelectorAll('.at-card').forEach((c, i) => { mk(c.querySelector('.head'), 'QQH' + i); const t = c.querySelector('.trad'); if (t) mk(t, 'QQT' + i); mk(c, 'QQE' + i, true); });
  document.querySelectorAll('.at-prow').forEach((r, i) => { mk(r, 'QQR' + i); mk(r, 'QQZ' + i, true); });
  document.querySelectorAll('main h2, main h3').forEach((hd, i) => { let n = hd.nextElementSibling; if (!n && hd.parentElement.classList.contains('syshead')) n = hd.parentElement.nextElementSibling; if (n) { mk(hd, 'QQG' + i); mk(n, 'QQN' + i); } });
};
const VIEWS = { Grid: null, Stacked: { view: 'cards', key: 'G', names: true, mel: 'eicha', clause: 'all' } };
for (const [view, atlas] of Object.entries(VIEWS)) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE) || /^(data|blob):/.test(u)) return r.continue();
    if (fontCss && u.startsWith('https://fonts.googleapis.com/css2')) return r.fulfill({ status: 200, contentType: 'text/css', body: fontCss, headers: { 'access-control-allow-origin': '*' } });
    const f = path.join(TMP, u.replace(/\W/g, '_'));
    if (fontCss && u.startsWith('https://fonts.gstatic.com/') && fs.existsSync(f)) return r.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(f), headers: { 'access-control-allow-origin': '*' } });
    return r.abort();
  });
  await ctx.addInitScript(([l, a]) => { try { if (sessionStorage.getItem('__s669')) return; sessionStorage.setItem('__s669', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', '0'); if (a) localStorage.setItem('hebrewTropeAtlas_settings', JSON.stringify(a)); } catch (e) {} }, [lang, atlas]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready);
  await page.waitForFunction(() => document.querySelectorAll('#atTable svg').length > 20 && document.querySelectorAll('#atPhraseRows svg').length > 0, null, { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.evaluate(`window.addEventListener('beforeprint', ${MARK}); window.addEventListener('afterprint', () => document.querySelectorAll('.s669m').forEach(e => e.remove()));`);
  for (const paper of ['Letter', 'A4']) {
    const f = path.join(TMP, `${view}-${lang}-${paper}.pdf`);
    await page.pdf({ path: f, format: paper, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
    const sheets = execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 1 << 28 }).toString().split('\f');
    if (sheets[sheets.length - 1].trim() === '') sheets.pop();
    const where = {}; sheets.forEach((t, i) => { for (const m of t.matchAll(/QQ([A-Z])(\d+)/g)) where[m[1] + m[2]] ??= i + 1; });
    const alone = [];
    for (const [k, p] of Object.entries(where)) { const n = k.slice(1);
      if (k[0] === 'H' && where['T' + n] && where['T' + n] !== p) alone.push(`card ${n}'s head on sheet ${p}, its first figure on ${where['T' + n]}`);
      if (k[0] === 'G' && where['N' + n] && where['N' + n] !== p) alone.push(`heading ${n} on sheet ${p}, its text on ${where['N' + n]}`);
      if (k[0] === 'R' && where['Z' + n] && where['Z' + n] !== p) alone.push(`phrase row ${n} split ${p}→${where['Z' + n]}`); }
    const cards = Object.keys(where).filter(k => k[0] === 'H').length, rows = Object.keys(where).filter(k => k[0] === 'R').length;
    const short = sheets.map((t, i) => [i + 1, t.replace(/QQ[A-Z]\d+/g, '').replace(/\s+/g, ' ').trim().length]).filter(([, n]) => n < 120).map(([i, n]) => `sheet ${i} (${n} characters)`);
    const long = fontCss && view === 'Grid' && lang === 'en' && paper === 'A4' && sheets.length > 79;
    report(cards === 27 && rows > 0 && !alone.length && !short.length && !long && !errs.length,
      `${view} ${lang} ${paper}: ${sheets.length} sheets, ${cards} cards and ${rows} phrase rows marked; ${alone.length ? 'ALONE: ' + alone.slice(0, 4).join('; ') + (alone.length > 4 ? ` (+${alone.length - 4})` : '') : 'every head and heading with what follows it'}; ${short.length ? 'SHORT: ' + short.join(', ') : 'no near-empty sheet'}${long ? '; LONGER than 79 sheets' : ''}; errors ${errs.length}`);
  }
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${cells - fails}/${cells} pass${fontCss ? '' : ' (system faces)'}`);
process.exit(fails ? 1 : 0);
