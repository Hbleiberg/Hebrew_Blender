#!/usr/bin/env node
// S632 — the Trope Atlas' Key and Melody selects wait, disabled, until the charts land (the S628 P4). While the phrase
// file was loading, or after it failed (the status line's Try again), both selects sat empty and enabled — a press opened
// an empty list beside a hint that the Key "moves every staff".
//
//   node scripts/loop/probes/S632-trope-atlas-selects-wait-for-the-charts.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, every foreign origin aborted, SW blocked.
//   (1) the phrase file held (a counted route hit): both selects disabled with 0 options while "Loading the charts…"
//   shows; released, both enabled, Key with 10 options and Melody with at least the six charts, Key reading "orig".
//   (2) the phrase file aborted once: both disabled and empty beside the status line's Try again; Try again by a real
//   click → the charts land and both selects are enabled and filled. (3) a plain load: enabled and filled, and a Key
//   change by the select still re-renders (the staffs' key follows). 0 page errors. exit 1 when a step fails or a handle
//   is missing. ROOT=<a git archive of the tree> runs another copy (the tree before S632: enabled while empty).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ROOT = path.resolve(process.env.ROOT || REPO);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const browser = await chromium.launch();
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }];
const read = page => page.evaluate(() => {
  const k = document.getElementById('atKey'), m = document.getElementById('atMel'), s = document.getElementById('atStatus');
  if (!k || !m || !s) return null;
  return { kDis: k.disabled, mDis: m.disabled, kN: k.options.length, mN: m.options.length, kVal: k.value, status: s.textContent.trim(), retry: !!s.querySelector('button'), staffs: document.querySelectorAll('#atTable svg, #atTable .at-staff').length };
});
async function open(cell, mode) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); sessionStorage.setItem('__s', '1'); } }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  const gate = { hits: 0 }; let release; const held = new Promise(r => { release = r; });
  await page.route('**/data/trope/trope_phrases.json*', async r => {
    gate.hits++;
    if (mode === 'hold') { await held; return r.continue(); }
    if (mode === 'abort' && gate.hits === 1) return r.abort();
    return r.continue();
  });
  await page.goto(base + '/trope_atlas.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.I18n && window.I18n.ready);
  return { ctx, page, errors, gate, release };
}
const filled = x => x && !x.kDis && !x.mDis && x.kN === 10 && x.mN >= 6;
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  { // (1) held
    const { ctx, page, errors, gate, release } = await open(cell, 'hold');
    await page.waitForTimeout(1200);
    const a = await read(page);
    ok(gate.hits === 1 && a && a.kDis && a.mDis && a.kN === 0 && a.mN === 0 && a.status.length > 0 && !a.retry, `${tag} held: both selects disabled and empty while "${a && a.status}" (route hits ${gate.hits})`);
    release(); await page.waitForFunction(() => document.getElementById('atKey').options.length > 0, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    const b = await read(page);
    ok(filled(b) && b.kVal === 'orig', `${tag} released: both enabled, Key ${b && b.kN} options (${b && b.kVal}), Melody ${b && b.mN}`);
    ok(errors.length === 0, `${tag} held: 0 page errors ${errors.join('|')}`);
    await ctx.close();
  }
  { // (2) failed, then Try again by a real click
    const { ctx, page, errors, gate } = await open(cell, 'abort');
    await page.waitForFunction(() => !!document.querySelector('#atStatus button'), null, { timeout: 15000 }).catch(() => {});
    const a = await read(page);
    ok(a && a.retry && a.kDis && a.mDis && a.kN === 0 && a.mN === 0, `${tag} failed: both disabled and empty beside Try again`);
    if (a && a.retry) {
      await page.locator('#atStatus button').scrollIntoViewIfNeeded();
      const box = await page.locator('#atStatus button').boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForFunction(() => document.getElementById('atKey').options.length > 0, null, { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(400);
    }
    const b = await read(page);
    ok(gate.hits === 2 && filled(b), `${tag} Try again (route hits ${gate.hits}): both enabled and filled`);
    ok(errors.length === 0, `${tag} failed path: 0 page errors ${errors.join('|')}`);
    await ctx.close();
  }
  { // (3) a plain load, and a Key change still re-renders
    const { ctx, page, errors } = await open(cell, 'plain');
    await page.waitForFunction(() => document.getElementById('atKey').options.length > 0, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(400);
    const a = await read(page);
    ok(filled(a), `${tag} plain load: both enabled and filled`);
    const before = await page.evaluate(() => document.getElementById('atTable').innerHTML.length);
    await page.selectOption('#atKey', 'D'); await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({ html: document.getElementById('atTable').innerHTML.length, stored: (JSON.parse(localStorage.getItem('hebrewTropeAtlas_settings') || '{}').key) }));
    ok(after.stored === 'D' && after.html !== before, `${tag} Key → D stored and the staffs redrawn (${before} → ${after.html} chars)`);
    ok(errors.length === 0, `${tag} plain: 0 page errors ${errors.join('|')}`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
