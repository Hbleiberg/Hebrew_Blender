#!/usr/bin/env node
// S628 — the Trope Atlas' Grid / Stacked buttons work before its charts land (pass I). While the phrase file loads, or
// after it failed (the status line with its Try again), a press built the table from no charts and threw
// "Cannot convert undefined or null to object" on every press.
//
//   node scripts/loop/probes/S628-trope-atlas-view-before-the-charts.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, every press a real click:
//   failed load → Stacked, Grid, Stacked: 0 errors, the pressed state follows, the choice stored; Try again (its gate
//   counted) → the table opens Stacked. Held load → Stacked while "Loading" shows → released, the table opens Stacked.
//   A load that works → Stacked builds cards, Grid the table (unchanged). exit 1 when a step fails or a handle is
//   missing. ROOT=<a git archive of the tree> runs another copy (the tree before S628 throws: 12 failures, 3 a cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
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
async function open(cell, mode) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  const gate = { hits: 0, release: null };
  const held = new Promise(r => { gate.release = r; });
  if (mode !== 'normal') await page.route('**/data/trope/trope_phrases.json*', async r => { gate.hits++; if (mode === 'hold') { await held; return r.continue(); } return gate.hits === 1 ? r.abort() : r.continue(); });
  await page.goto(base + '/trope_atlas.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('atStatus'));
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600);
  return { ctx, page, errors, gate };
}
const state = page => page.evaluate(() => ({
  grid: document.getElementById('atViewGrid').getAttribute('aria-pressed'), cards: document.getElementById('atViewCards').getAttribute('aria-pressed'),
  stored: (JSON.parse(localStorage.getItem('hebrewTropeAtlas_settings') || '{}')).view || null,
  nCards: document.querySelectorAll('#atTable .at-card').length, nRows: document.querySelectorAll('#atTable table tr').length,
  status: document.getElementById('atStatus').textContent.trim(), retry: !!document.querySelector('#atStatus button'),
}));
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    // a failed load: the buttons before any chart, then Try again
    let o = await open(cell, 'abort');
    let s = await state(o.page);
    if (!s.retry) { ok(false, `${L}: the failed load shows no Try again (gate hits ${o.gate.hits})`); await o.ctx.close(); continue; }
    await o.page.click('#atViewCards'); await o.page.waitForTimeout(150);
    await o.page.click('#atViewGrid'); await o.page.waitForTimeout(150);
    await o.page.click('#atViewCards'); await o.page.waitForTimeout(150);
    s = await state(o.page);
    ok(o.errors.length === 0 && s.cards === 'true' && s.grid === 'false' && s.stored === 'cards' && s.retry, `${L}: failed load → Stacked, Grid, Stacked: ${o.errors.length} errors, Stacked pressed ${s.cards}, stored ${s.stored}, Try again still offered ${s.retry}${o.errors.length ? ' — ' + o.errors[0].slice(0, 80) : ''}`);
    await o.page.click('#atStatus button'); await o.page.waitForFunction(() => document.querySelectorAll('#atTable .at-card, #atTable table tr').length > 0);
    s = await state(o.page);
    ok(o.gate.hits === 2 && s.nCards > 20 && s.nRows === 0 && s.cards === 'true' && o.errors.length === 0, `${L}: Try again (gate hit ${o.gate.hits}) → the table opens Stacked: ${s.nCards} cards, ${s.nRows} grid rows`);
    await o.ctx.close();
    // a held load: Stacked while "Loading" shows
    o = await open(cell, 'hold');
    s = await state(o.page);
    const loadingShown = s.status.length > 0 && !s.retry && o.gate.hits === 1;
    await o.page.click('#atViewCards'); await o.page.waitForTimeout(150);
    const mid = await state(o.page);
    o.gate.release(); await o.page.waitForFunction(() => document.querySelectorAll('#atTable .at-card, #atTable table tr').length > 0);
    s = await state(o.page);
    ok(loadingShown && mid.cards === 'true' && s.nCards > 20 && s.nRows === 0 && o.errors.length === 0, `${L}: Stacked while "${mid.status}" shows → pressed ${mid.cards}; released → ${s.nCards} cards, ${o.errors.length} errors`);
    await o.ctx.close();
    // a load that works: unchanged
    o = await open(cell, 'normal');
    await o.page.waitForFunction(() => document.querySelectorAll('#atTable table tr').length > 0);
    const g0 = await state(o.page);
    await o.page.click('#atViewCards'); await o.page.waitForTimeout(200); const c1 = await state(o.page);
    await o.page.click('#atViewGrid'); await o.page.waitForTimeout(200); const g1 = await state(o.page);
    ok(g0.nRows > 20 && c1.nCards > 20 && c1.nRows === 0 && g1.nRows === g0.nRows && g1.nCards === 0 && g1.grid === 'true' && o.errors.length === 0, `${L}: a working load → Grid ${g0.nRows} rows, Stacked ${c1.nCards} cards, Grid again ${g1.nRows} rows, ${o.errors.length} errors`);
    await o.ctx.close();
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: Grid and Stacked wait for the charts, then open the chosen view');
process.exit(fail ? 1 : 0);
