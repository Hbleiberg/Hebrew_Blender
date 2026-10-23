#!/usr/bin/env node
// S553 — the service worker's install through a warm HTTP cache (pass V, arm 4).
//
// GitHub Pages answers every file with `cache-control: max-age=600`. A visit fills the browser's HTTP cache with the
// shell; a VERSION bump deployed within those ten minutes installs a new worker whose `cache.add(url)` is answered by
// that HTTP cache, so the new shell cache carries the previous deploy's copies. `sw.js` asks for each asset with
// `cache: 'no-cache'` (revalidated: a 304 when unchanged); this probe proves it on the real worker.
//
//   node scripts/loop/probes/S553-sw-precache-revalidates.mjs            fresh 3/3 expected (exit 1 on a stale copy)
//   node scripts/loop/probes/S553-sw-precache-revalidates.mjs --control  the plain cache.add(url) served instead: STALE expected
//   --json prints the record.
//
// Serves the repo root in-process with max-age=600 (nothing on disk is written; the "deploy" is an override map on the
// same port: sw.js bumped, a marker in resources.html, favicon.svg and js/tt-pitch-worklet.js), loads the hub in a
// context whose worker is live (never serviceWorkers:'block'), swaps the deploy in, calls reg.update(), awaits
// controllerchange and reads the new cache's bytes. Foreign origins fail at DNS (no proxy), so nothing hangs.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const CONTROL = process.argv.includes('--control'), JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.txt': 'text/plain' };
const MARK = '/* S553-probe-marker */';

const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const version = swSrc.match(/const VERSION = '([^']+)'/)[1];
const bumped = version.replace(/(\d+)$/, n => String(+n + 1));
let sw2 = swSrc.replace(/const VERSION = '[^']+'/, `const VERSION = '${bumped}'`);
if (CONTROL) {
  const fixed = "cache.add(new Request(url, { cache: 'no-cache' }))";
  if (!sw2.includes(fixed)) { console.error('control: the fixed install line is not in sw.js'); process.exit(2); }
  sw2 = sw2.replace(fixed, 'cache.add(url)');
}
const override = new Map();   // the deploy, served on the same port once armed
override.set('/sw.js', Buffer.from(sw2));
override.set('/resources.html', Buffer.from(fs.readFileSync(path.join(ROOT, 'resources.html'), 'utf8').replace('</head>', `<!--${MARK}--></head>`)));
override.set('/favicon.svg', Buffer.concat([fs.readFileSync(path.join(ROOT, 'favicon.svg')), Buffer.from(`\n<!--${MARK}-->\n`)]));
override.set('/js/tt-pitch-worklet.js', Buffer.concat([fs.readFileSync(path.join(ROOT, 'js', 'tt-pitch-worklet.js')), Buffer.from(`\n${MARK}\n`)]));
let deployed = false;
const hits = [];
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  hits.push(p);
  let body = deployed && override.has(p) ? override.get(p) : null;
  if (!body) {
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    body = fs.readFileSync(file);
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'content-length': body.length, 'cache-control': 'max-age=600', 'last-modified': new Date(0).toUTCString() });
  res.end(body);
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const BASE = 'http://localhost:' + server.address().port;

const browser = await chromium.launch({ args: ['--proxy-server=direct://', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'] });
const ctx = await browser.newContext();
await ctx.route('**/*', r => (r.request().url().startsWith(BASE) ? r.continue() : r.abort()));
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 });
const first = await page.evaluate(async v => (await (await caches.open('ivritsuite-' + v)).keys()).length, version);
// the deploy lands; the install of the bumped worker must ask the server for its assets, not the HTTP cache
deployed = true;
const before = hits.length;
const upd = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  const changed = new Promise(ok => navigator.serviceWorker.addEventListener('controllerchange', () => ok('controllerchange'), { once: true }));
  await reg.update();
  return Promise.race([changed, new Promise(ok => setTimeout(() => ok('no controllerchange in 30s'), 30000))]);
});
await new Promise(r => setTimeout(r, 1000));
const installAsks = hits.slice(before).filter(p => p !== '/sw.js').length;
const bytes = await page.evaluate(async ([v, mark]) => {
  const c = await caches.open('ivritsuite-' + v); const r = {};
  for (const u of ['/resources.html', '/favicon.svg', '/js/tt-pitch-worklet.js']) { const m = await c.match(u); r[u] = m ? ((await m.text()).includes(mark) ? 'fresh' : 'stale') : 'absent'; }
  return r;
}, [bumped, MARK]);
await browser.close(); server.close(); server.closeAllConnections();
const fresh = Object.values(bytes).filter(v => v === 'fresh').length, stale = Object.values(bytes).filter(v => v !== 'fresh').length;
const rec = { control: CONTROL, from: version, to: bumped, firstPrecache: first, update: upd, installAsks, bytes, fresh, stale, errors };
if (JSON_OUT) console.log(JSON.stringify(rec));
const summary = `S553 sw precache after a bump through a warm HTTP cache (${CONTROL ? 'control: plain cache.add' : 'sw.js as committed'}): fresh ${fresh}/3, stale ${stale}/3, the install asked the server for ${installAsks} assets, ${upd}, ${errors.length} page errors`;
if (CONTROL) { const fired = stale === 3; console.log(summary + ' → ' + (fired ? 'control fired' : 'CONTROL SILENT')); process.exit(fired ? 0 : 1); }
const ok = fresh === 3 && upd === 'controllerchange' && errors.length === 0 && first > 0;
console.log(summary + ' → ' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
