#!/usr/bin/env node
// S639 — the shell cache keeps one copy of a page, whatever its query (pass V's S638 candidate).
//
// sw.js stores every network-first page (and script) it fetches. Keyed by the full request, each distinct query string
// kept its own full copy until the next deploy: a Torah Trainer `?parsha=` ~948 KB apiece, a generator `?s=` ~867 KB, a
// sign-in return's `?code=` URL as a cache key. A page's bytes never vary by its query and the offline lookups already
// ignore it, so sw.js now stores the copy under the path alone; offline, a query never visited online is still answered.
//
//   node scripts/loop/probes/S639-sw-one-copy-per-page.mjs            PASS expected (exit 1 on a query-keyed copy)
//   node scripts/loop/probes/S639-sw-one-copy-per-page.mjs --control  the copy keyed by the request again: copies expected
//   --json prints the record.  ROOT=<dir> serves another copy (a git archive of a commit).
//
// Serves the repo root in-process, the worker live (never serviceWorkers:'block'), no Playwright route (routing disables
// the HTTP cache, the worker's fetches included), foreign origins failing at DNS; six query URLs online, then the server
// stopped (close + closeAllConnections — setOffline never reaches a worker) and two queries never visited.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT ? path.resolve(process.env.ROOT) : path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const CONTROL = process.argv.includes('--control'), JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.txt': 'text/plain' };

let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const FIXED = 'cache.put(url.origin + url.pathname, copy)';
if (CONTROL) {
  if (!sw.includes(FIXED)) { console.error('control: the path-keyed put is not in this sw.js'); process.exit(2); }
  sw = sw.replace(FIXED, 'cache.put(req, copy)');
}
const sockets = new Set();
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  let body = p === '/sw.js' ? Buffer.from(sw) : null;
  if (!body) {
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    body = fs.readFileSync(file);
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'content-length': body.length, 'cache-control': 'no-store' });
  res.end(body);
});
server.on('connection', s => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const BASE = 'http://localhost:' + server.address().port;

const browser = await chromium.launch({ args: ['--proxy-server=direct://', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 });
await page.waitForTimeout(1000);
const VISITS = ['/torah_trainer.html?parsha=Noach', '/torah_trainer.html?parsha=Vayera', '/torah_trainer.html?lang=he', '/hebrew_blend_generator.html?s=abc', '/hebrew_blend_generator.html?s=abd', '/index.html?code=fake-auth-code'];
for (const u of VISITS) { await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(700); }
await page.waitForTimeout(1500);
const census = await page.evaluate(async () => {
  const q = [], paths = {};
  for (const k of await caches.keys()) {
    if (!/^ivritsuite-v\d/.test(k)) continue;
    const c = await caches.open(k);
    for (const r of await c.keys()) {
      const u = new URL(r.url);
      const n = (await (await c.match(r)).clone().arrayBuffer()).byteLength;
      if (u.search) q.push(u.pathname + u.search + ' ' + n);
      else if (['/torah_trainer.html', '/hebrew_blend_generator.html', '/index.html'].includes(u.pathname)) paths[u.pathname] = (paths[u.pathname] || 0) + 1;
    }
  }
  return { q, paths };
});
const sizes = Object.fromEntries(['/torah_trainer.html', '/hebrew_blend_generator.html', '/index.html'].map(p => [p, fs.statSync(path.join(ROOT, p)).size]));
const stored = await page.evaluate(async (ps) => { const out = {}; for (const p of ps) { const r = await caches.match(p); out[p] = r ? (await r.arrayBuffer()).byteLength : null; } return out; }, Object.keys(sizes));
await new Promise(ok => { server.close(() => ok()); server.closeAllConnections(); for (const s of sockets) s.destroy(); });
let refused = false; try { await fetch(BASE + '/index.html'); } catch (e) { refused = true; }
const offline = [];
for (const u of ['/torah_trainer.html?parsha=Bereshit', '/hebrew_blend_generator.html?s=never-seen']) {
  const resp = await page.goto(BASE + u, { waitUntil: 'load' }).catch(() => null);
  await page.waitForTimeout(800);
  offline.push({ u, status: resp && resp.status(), fromSW: !!(resp && resp.fromServiceWorker()), url: page.url().replace(BASE, ''), title: (await page.title()).slice(0, 40) });
}
await browser.close();
const answered = offline.every(o => o.status === 200 && o.fromSW && o.url === o.u);
const fresh = Object.keys(sizes).every(p => stored[p] === sizes[p]);
const rec = { control: CONTROL, queryKeyed: census.q, pathEntries: census.paths, stored, sizes, refused, offline, answered, fresh, errors };
if (JSON_OUT) console.log(JSON.stringify(rec));
const kb = census.q.reduce((s, l) => s + +l.split(' ').pop(), 0) / 1024;
const summary = `S639 one shell copy per page (${CONTROL ? 'control: keyed by the request' : 'sw.js as committed'}): ${VISITS.length} query visits → ${census.q.length} query-keyed copies (${Math.round(kb)} KB); path copies ${JSON.stringify(census.paths)}, the stored copy = the served file ${fresh}; offline, two unvisited queries → ${offline.map(o => `${o.url} ${o.status}${o.fromSW ? ' sw' : ''}`).join(', ')}; ${errors.length} page errors`;
if (!refused) { console.log(summary + ' → INCONCLUSIVE (the outage did not hold)'); process.exit(2); }
if (CONTROL) { console.log(summary + ' → ' + (census.q.length ? 'control fired' : 'CONTROL SILENT')); process.exit(census.q.length ? 0 : 1); }
const ok = census.q.length === 0 && answered && fresh;
console.log(summary + ' → ' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
