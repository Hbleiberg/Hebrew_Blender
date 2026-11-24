#!/usr/bin/env node
// S682 — the Tefillah Trainer: a stored favorite's Open button names its prayer in its title from the first paint.
// The Favorites list is drawn on I18n.ready, usually before the prayer catalog lands, and the title takes the prayer's
// name from the catalog, so it read "Open " / "פתיחת " until a language switch redrew the list (S674). The catalog's
// arrival now redraws it.
//
//   node scripts/loop/probes/S682-tefillah-favorite-open-title-names-its-prayer.mjs
//   EN light 1280 / HE dark 800 × the catalog answered at once / 1.5 s late (a counted route hit: the handle check):
//   two favorites seeded in storage; Settings → Favorites by real clicks; each Open title names its prayer ("Open
//   Ashrei · Sefard") and equals the title after a language round trip; 0 page errors (Sefaria is aborted: the
//   reading's own failure card is not an error). exit 1 when a step fails. ROOT=<a git archive of the tree> runs
//   another copy (the tree before S682: "Open " in every cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const FAV = JSON.stringify({ 'My Ashrei': { v: 1, ref: { kind: 'prayer', prayer: 'ashrei', nusach: 'sefard' }, color: '#c9922a', ts: 1 }, 'Shema (Torah)': { v: 1, ref: { kind: 'prayer', prayer: 'shema', nusach: 'torah' }, color: '#3b82c4', ts: 2 } });
const browser = await chromium.launch();
for (const cell of [{ lang: 'en', dark: false, vw: 1280 }, { lang: 'he', dark: true, vw: 800 }]) for (const delay of [0, 1500]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.vw}, the catalog +${delay}ms`;
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (sessionStorage.getItem('s682seed')) return; sessionStorage.setItem('s682seed', '1');
    localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0');
    localStorage.setItem('hebrewTefillahTrainer_favorites', c.fav);
  }, { ...cell, fav: FAV });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  let hits = 0;
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith(BASE) && /\/data\/tefillah\/catalog\.json/.test(u)) { hits++; if (delay) await new Promise(res => setTimeout(res, delay)); return r.continue(); }
    return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort();
  });
  await page.goto(BASE + '/tefillah_trainer.html', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof prayerByKey !== 'undefined' && prayerByKey.size > 0 && document.querySelectorAll('#ttFavList button').length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const titles = () => page.evaluate(() => [...document.querySelectorAll('#ttFavList button.btn:not(.btn-secondary)')].map(b => b.title));
  await page.locator('#gearBtn').click(); await page.waitForTimeout(300);
  const t1 = await titles();
  await page.evaluate(l => I18n.setLang(l === 'en' ? 'he' : 'en'), cell.lang); await page.waitForFunction(l => document.documentElement.lang !== l, cell.lang); await page.waitForTimeout(500);
  await page.evaluate(l => I18n.setLang(l), cell.lang); await page.waitForFunction(l => document.documentElement.lang === l, cell.lang); await page.waitForTimeout(500);
  const t2 = await titles();
  ok(hits > 0 && t1.length === 2, `${tag}: the catalog requested ${hits}×, ${t1.length} favorites listed (the handles)`);
  ok(t1.length === 2 && t1.every(t => /\S\s+\S/.test(t) && !/\s$/.test(t)) && JSON.stringify(t1) === JSON.stringify(t2), `${tag}: Open titles at load ${JSON.stringify(t1)}, after a language round trip ${JSON.stringify(t2)}`);
  ok(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
