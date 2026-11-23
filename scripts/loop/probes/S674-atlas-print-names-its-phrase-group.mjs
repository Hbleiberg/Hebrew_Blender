#!/usr/bin/env node
// S674 (the S669 G finding) — printed, the Trope Atlas's phrase section never named the chosen phrase group: its chips
// are controls and print hid the row whole, so a one-group handout showed rows numbered as in the whole chart under the
// melody's name alone. Paper now carries one line, the group's own label and the chosen chip's name.
//   The default group, a group chosen by a click, and All × EN / HE, Letter, by page.pdf: one line of the PDF holds the
//   label and the chosen name (compared without vowel points, bidi controls or spaces, which pdftotext reorders) and no
//   other group's name; under print media only the chosen chip shows, as text; no page error. On screen every chip
//   still shows as a button.
//
//   node scripts/loop/probes/S674-atlas-print-names-its-phrase-group.mjs     exit 1 on any failing cell
//   ROOT=<a git archive of another tree> runs that copy (the tree before S674 fails every cell)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's674p-'));
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
const chips = page => page.evaluate(() => [...document.querySelectorAll('#atClauses .at-chip')].map(b => ({ name: b.firstChild.nodeValue, on: b.getAttribute('aria-pressed') === 'true', shown: b.getClientRects().length > 0, border: getComputedStyle(b).borderTopWidth, display: getComputedStyle(b).display })));
for (const pick of ['default', 'second', 'all']) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(l => { try { if (sessionStorage.getItem('__s674p')) return; sessionStorage.setItem('__s674p', '1'); localStorage.setItem('hebrewBlender_lang', l); } catch (e) {} }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready);
  await page.waitForFunction(() => document.querySelectorAll('#atClauses .at-chip').length > 2 && document.querySelectorAll('#atPhraseRows .at-prow').length > 0, null, { timeout: 30000 });
  if (pick !== 'default') { await page.locator('#atClauses .at-chip').nth(pick === 'all' ? 0 : 2).click(); await page.waitForTimeout(300); }
  const screen = await chips(page);
  const label = await page.evaluate(() => document.getElementById('atClauses').getAttribute('aria-label'));
  const chosen = screen.filter(c => c.on), others = screen.filter(c => !c.on);
  const rows = await page.locator('#atPhraseRows .at-prow').count();
  const f = path.join(TMP, `${pick}-${lang}.pdf`);
  await page.pdf({ path: f, format: 'Letter', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  const lines = execFileSync('pdftotext', ['-layout', f, '-']).toString().split('\n').map(norm);
  const want = chosen.length === 1 ? norm(chosen[0].name) : '\u0000';
  const line = lines.find(l => l.includes(norm(label)) && l.includes(want)) || '';
  // no other group's name on that line (a name that contains the chosen one, or is contained in it, cannot be told apart there)
  const strays = others.map(c => norm(c.name)).filter(n => n && !want.includes(n) && !n.includes(want) && line.includes(n));
  await page.emulateMedia({ media: 'print' });
  const paper = await chips(page);
  const shownOnPaper = paper.filter(c => c.shown);
  await page.emulateMedia({ media: 'screen' });
  const back = await chips(page);
  const good = chosen.length === 1 && !!line && !strays.length && shownOnPaper.length === 1 && shownOnPaper[0].on && shownOnPaper[0].border === '0px' && /^inline/.test(shownOnPaper[0].display)
    && back.every(c => c.shown && c.border !== '0px') && screen.length === back.length && rows > 0 && !errs.length;
  report(good, `${pick} ${lang}: ${screen.length} chips, ${rows} rows, chosen "${chosen.map(c => c.name).join('|')}"; paper ${line ? 'names' : 'does NOT name'} "${label}: ${chosen[0] ? chosen[0].name : ''}"${strays.length ? ' with ' + strays.length + ' other names' : ''}; chips on paper ${shownOnPaper.length}${shownOnPaper[0] ? ' (' + shownOnPaper[0].display + ', border ' + shownOnPaper[0].border + ')' : ''}; on screen after ${back.filter(c => c.shown).length}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
