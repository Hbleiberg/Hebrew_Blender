#!/usr/bin/env node
// S625 — "Vowels to show" keeps every vowel's name on one line (pass M on letter_learner.html): the options' columns
// were at least 118px, and "Chataf Kamatz" needs ~153 (box, the sample on alef, the name), so wherever the options sit
// side by side — stacked under the grid at 500–800px, or a sidebar dragged wider than ~304px — two to four names broke
// onto a second line and their rows stood taller than the rest. The minimum is 10rem now.
//
//   node scripts/loop/probes/S625-letter-learner-vowel-options-one-line.mjs
//   EN light / HE dark × the sidebar at its default 300px, dragged to 380 and 520 (1280 wide), and stacked at 800, 700,
//   600, 500 and 390: each of the 13 options is one line, every row of options the same height, no option wider than
//   the panel; then a real click on Chataf Kamatz's box unticks it and the Vowels grid loses its card (the options still
//   work). exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S625 fails the one-line check at 380, 520, 800, 700, 600 and 500 in English, 700 in Hebrew — the probe loads
//   no Google Fonts, and its fallback face is wider than Source Sans 3: four names break at 800 where the real face breaks two).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const LAYOUTS = [{ w: 1280, sb: 300 }, { w: 1280, sb: 380 }, { w: 1280, sb: 520 }, { w: 800 }, { w: 700 }, { w: 600 }, { w: 500 }, { w: 390 }];
for (const cell of [{ lang: 'en', dark: false }, { lang: 'he', dark: true }]) {
  for (const L of LAYOUTS) {
    const ctx = await browser.newContext({ viewport: { width: L.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
    const page = await ctx.newPage(); page.setDefaultTimeout(15000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
    await page.addInitScript(([lang, dark, sb]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewLetterLearner_tourSeen', '1'); if (sb) localStorage.setItem('hebrewLetterLearner_sidebarW', String(sb)); }, [cell.lang, cell.dark, L.sb || 0]);
    await page.goto(base + '/letter_learner.html?mode=vowels', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('.ll-vowel-grid .ll-opt').length >= 13, null, { timeout: 30000 });
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const grid = document.querySelector('.ll-vowel-grid'), opts = [...grid.querySelectorAll('.ll-opt')];
      const panel = grid.closest('.panel-body') || grid.parentElement;
      const pr = panel.getBoundingClientRect();
      const lines = opts.map(o => { const n = o.lastElementChild; const lh = parseFloat(getComputedStyle(n).lineHeight) || parseFloat(getComputedStyle(n).fontSize) * 1.3; return { name: n.textContent.trim(), two: n.getBoundingClientRect().height > lh * 1.5, wide: o.getBoundingClientRect().right > pr.right + 1 || o.getBoundingClientRect().left < pr.left - 1 }; });
      const rows = {}; opts.forEach(o => { const t = Math.round(o.getBoundingClientRect().top); (rows[t] = rows[t] || []).push(Math.round(o.getBoundingClientRect().height)); });
      const hs = Object.values(rows).map(l => Math.max(...l) - Math.min(...l));
      const all = opts.map(o => Math.round(o.getBoundingClientRect().height));
      return { n: opts.length, cols: Math.max(...Object.values(rows).map(l => l.length)), sbw: Math.round(document.getElementById('llSidebar').getBoundingClientRect().width), two: lines.filter(l => l.two).map(l => l.name), wide: lines.filter(l => l.wide).map(l => l.name), ragged: Math.max(...hs), spread: Math.max(...all) - Math.min(...all) };
    });
    const label = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${L.w}${L.sb ? ' sidebar ' + L.sb : ''}`;
    ok(r.n === 13, `${label}: handle — 13 options, ${r.cols} a row, the sidebar ${r.sbw}px`);
    ok(r.two.length === 0 && r.spread <= 1, `${label}: every name on one line, every option one height (two-line: ${r.two.join(', ') || 'none'}; heights spread ${r.spread})`);
    ok(r.wide.length === 0, `${label}: no option past the panel's edge (${r.wide.join(', ') || 'none'})`);
    if (L.w === 800 || L.sb === 380) {
      // the options still work: a real click on Chataf Kamatz's box takes its card out of the Vowels grid
      const before = await page.locator('#llGrid .ll-card').count();
      const box = page.locator('.ll-vowel-grid .ll-opt').filter({ hasText: cell.lang === 'he' ? 'חֲטַף קָמָץ' : 'Chataf Kamatz' }).locator('input');
      await box.scrollIntoViewIfNeeded(); await box.click(); await page.waitForTimeout(300);
      const after = await page.locator('#llGrid .ll-card').count();
      const stored = await page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('hebrewLetterLearner_settings') || '{}').vowels || {}).filter(Boolean).length);
      ok(before === 13 && after === 12 && stored === 12, `${label}: a click on Chataf Kamatz's box → ${before} → ${after} cards, ${stored} vowels stored`);
    }
    ok(errors.length === 0, `${label}: 0 page errors`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: every vowel name on one line in every layout');
process.exit(fail ? 1 : 0);
