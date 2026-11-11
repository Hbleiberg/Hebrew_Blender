#!/usr/bin/env node
// S638 — the trope traditions' approvals survive a deploy offline (pass V, arm 2).
//
// `data/trope/trope_approvals.json` is network-first in sw.js; offline the pages get "the copy last fetched". That copy
// lived in the versioned CACHE, which every VERSION bump's activate deletes — so after any deploy an offline Trope Tutor
// offered 7 melodies instead of 27 and the Atlas 6 instead of 26 (every approved tradition gone until an online visit).
// sw.js keeps the copy in the version-independent DATA_CACHE; this probe proves it on the real worker.
//
//   node scripts/loop/probes/S638-sw-approvals-survive-a-deploy.mjs            the traditions offline after a bump (exit 1 if lost)
//   node scripts/loop/probes/S638-sw-approvals-survive-a-deploy.mjs --control  the copy put in CACHE instead: LOST expected
//   --json prints the record.
//
// Serves the repo root in-process (an override map is the deploy: sw.js with VERSION+1 on the same port), the worker live
// (never serviceWorkers:'block'), no Playwright route (routing disables the HTTP cache, the worker's fetches included),
// foreign origins failing at DNS. Online: the Tutor and the Atlas; then the bump; then the server stopped
// (close + closeAllConnections — setOffline never reaches a worker) and both pages again.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT ? path.resolve(process.env.ROOT) : path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const CONTROL = process.argv.includes('--control'), JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.txt': 'text/plain' };

let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const FIXED = /(if \(url\.pathname === '\/data\/trope\/trope_approvals\.json'\)[\s\S]*?caches\.open\()DATA_CACHE(\))/;
if (CONTROL) {
  if (!FIXED.test(sw)) { console.error('control: the approvals branch does not put into DATA_CACHE in this sw.js'); process.exit(2); }
  sw = sw.replace(FIXED, '$1CACHE$2');
}
const version = sw.match(/const VERSION = '([^']+)'/)[1];
const bumped = version.replace(/(\d+)$/, n => String(+n + 1));
const override = new Map([['/sw.js', Buffer.from(sw)]]);
let deployed = false;
const sockets = new Set();
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  let body = override.get(p) || null;
  if (p === '/sw.js' && deployed) body = Buffer.from(sw.replace(/const VERSION = '[^']+'/, `const VERSION = '${bumped}'`));
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
const PORT = server.address().port, BASE = 'http://localhost:' + PORT;

const browser = await chromium.launch({ args: ['--proxy-server=direct://', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
const melodies = () => page.evaluate(() => ({
  tutor: (document.getElementById('tuMelodySel') || { options: [] }).options.length,
  atlas: (document.getElementById('atMel') || { options: [] }).options.length,
}));
async function visit(u) { await page.goto(BASE + u, { waitUntil: 'load' }); await page.waitForTimeout(3000); return melodies(); }
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 });
const online = { tutor: (await visit('/trope_tutor.html')).tutor, atlas: (await visit('/trope_atlas.html')).atlas };
deployed = true;
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
const upd = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  const changed = new Promise(ok => navigator.serviceWorker.addEventListener('controllerchange', () => ok('controllerchange'), { once: true }));
  await reg.update();
  return Promise.race([changed, new Promise(ok => setTimeout(() => ok('no controllerchange in 30s'), 30000))]);
});
await page.waitForTimeout(1000);
const keys = await page.evaluate(() => caches.keys());
await new Promise(ok => { server.close(() => ok()); server.closeAllConnections(); for (const s of sockets) s.destroy(); });
let refused = false; try { await fetch(BASE + '/index.html'); } catch (e) { refused = true; }
const offline = { tutor: (await visit('/trope_tutor.html')).tutor, atlas: (await visit('/trope_atlas.html')).atlas };
await browser.close();
const kept = offline.tutor === online.tutor && offline.atlas === online.atlas;
const rec = { control: CONTROL, from: version, to: bumped, update: upd, keys, refused, online, offline, kept, errors };
if (JSON_OUT) console.log(JSON.stringify(rec));
const summary = `S638 the traditions' approvals offline after a deploy (${CONTROL ? 'control: the copy in the versioned cache' : 'sw.js as committed'}): ${version} → ${bumped} ${upd}; Tutor melodies ${online.tutor} online → ${offline.tutor} offline, Atlas ${online.atlas} → ${offline.atlas}; caches ${keys.join(', ')}; ${errors.length} page errors`;
if (!refused || online.tutor < 8 || online.atlas < 7) { console.log(summary + ' → INCONCLUSIVE (the outage or the online traditions did not hold)'); process.exit(2); }
if (CONTROL) { console.log(summary + ' → ' + (kept ? 'CONTROL SILENT' : 'control fired')); process.exit(kept ? 1 : 0); }
const ok = kept && upd === 'controllerchange' && errors.length === 0;
console.log(summary + ' → ' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
