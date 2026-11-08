#!/usr/bin/env node
// S627 — Parsha Emojis' Print coloring sheets measure each drawing once: the colored copy reuses the line art's geometry
// (pass D). A drawing's shapes are the same whichever way it is painted, and the measuring is most of a conversion, so
// "Colored in" on View All's 54 sheets measured all 54 again (356 ms median @4× CPU; 99–131 after).
//
//   node scripts/loop/probes/S627-parsha-emojis-colored-in-measures-once.mjs
//   EN light 1280 / HE dark 800, by real clicks: View All → Print coloring sheets (54 drawings measured) → Colored in on, off,
//   on → still 54 measurings, the counter wrapped through `window` (it resolves there) and proved by the first open's
//   count; the colored sheets' drawings equal a fresh page's that opened colored-in (measured afresh, not shared), and the
//   line art after the round trip equals the first open's. exit 1 when a step fails or a handle is missing. ROOT=<a git
//   archive of the tree> runs another copy (the tree before S627 measures 108: 2 failures, one a cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
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
const guard = async (label, fn) => { try { await fn(); } catch (e) { fail++; console.log(`✘ ${label}: ${String(e).split('\n')[0]}`); } };
async function open(cell, colored) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark, colored]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); if (colored) localStorage.setItem('hebrewEmojiTorah_settings', JSON.stringify({ v: 1, colored: true })); }, [cell.lang, cell.dark, colored]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/parsha_emojis.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && !document.getElementById('etCsOpen').disabled);
  await page.evaluate(() => window.I18n.ready);
  const wrapped = await page.evaluate(() => { if (typeof window.etCsMeasure !== 'function') return false; window.__m = 0; const o = window.etCsMeasure; window.etCsMeasure = function (...a) { window.__m++; return o.apply(this, a); }; return true; });
  await page.click('.et-view[data-view="all"]'); await page.click('#etCsOpen');
  await page.waitForFunction(() => document.querySelectorAll('#etCsPages .et-cs-sheet').length === 54);
  return { ctx, page, errors, wrapped };
}
const art = page => page.evaluate(() => [...document.querySelectorAll('#etCsPages .et-cs-sheet .et-cs-pic svg')].map(s => s.outerHTML));
const toggle = async page => { await page.click('#etCsColored'); await page.waitForFunction(() => document.querySelectorAll('#etCsPages .et-cs-sheet').length === 54); await page.waitForTimeout(200); };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  await guard(L, async () => {
    const { ctx, page, errors, wrapped } = await open(cell, false);
    const m0 = await page.evaluate(() => window.__m), line0 = await art(page);
    ok(wrapped && m0 === 54 && line0.length === 54, `${L}: the first open measures each of the 54 drawings once (${m0}; the counter wrapped ${wrapped})`);
    await toggle(page); const col = await art(page);
    await toggle(page); const line1 = await art(page);
    await toggle(page);
    const m1 = await page.evaluate(() => window.__m);
    ok(m1 === 54, `${L}: Colored in on, off, on → still ${m1} measurings (54)`);
    const f = await open(cell, true); const fresh = await art(f.page); const mf = await f.page.evaluate(() => window.__m);
    ok(fresh.length === 54 && mf === 54 && col.every((s, j) => s === fresh[j]) && col.some((s, j) => s !== line0[j]), `${L}: the colored drawings equal a fresh colored-in page's (measured afresh, ${mf}) and differ from the line art`);
    ok(line1.every((s, j) => s === line0[j]), `${L}: the line art after the round trip equals the first open's`);
    ok(errors.length === 0 && f.errors.length === 0, `${L}: 0 page errors ${errors.concat(f.errors).join(' | ')}`);
    await f.ctx.close(); await ctx.close();
  });
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: each drawing is measured once, whichever way it is painted');
process.exit(fail ? 1 : 0);
