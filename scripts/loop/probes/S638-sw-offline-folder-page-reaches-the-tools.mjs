#!/usr/bin/env node
// S638 — offline, a parsha/ page never visited online leads back to the tools (pass V, arm 1).
//
// A navigation the worker cannot answer gets the hub. The hub's links are relative, so its shell answered at
// /parsha/bereshit.html sent Flash Cards to /parsha/flash_cards.html — the hub again, and so on: from Parsha Emojis
// offline, a tap on any coloring page never visited online ended in a loop. sw.js now redirects such a navigation (a
// path under a folder) to the root; a root-level unknown path keeps the hub at its own URL (S553's design).
//
//   node scripts/loop/probes/S638-sw-offline-folder-page-reaches-the-tools.mjs            PASS expected
//   node scripts/loop/probes/S638-sw-offline-folder-page-reaches-the-tools.mjs --control  the plain hub fallback: LOOP expected
//   --json prints the record.  ROOT=<dir> serves another copy (a git archive of a commit).
//
// Serves the repo root in-process, the worker live (never serviceWorkers:'block'), no Playwright route (routing
// disables the HTTP cache, the worker's fetches included), foreign origins failing at DNS; Parsha Emojis online, the
// server stopped (close + closeAllConnections — setOffline never reaches a worker), then real clicks.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT ? path.resolve(process.env.ROOT) : path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const CONTROL = process.argv.includes('--control'), JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.txt': 'text/plain' };

let sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const FIXED = "return url.pathname.indexOf('/', 1) > 0 ? Response.redirect('/', 302) : caches.match('/index.html');";
if (CONTROL) {
  if (!sw.includes(FIXED)) { console.error('control: the folder redirect is not in this sw.js'); process.exit(2); }
  sw = sw.replace(FIXED, "return caches.match('/index.html');");
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
const here = async () => ({ url: page.url().replace(BASE, ''), title: (await page.title()).slice(0, 50) });
async function clickTo(sel) {
  const a = page.locator(sel).first();
  if (!(await a.count())) return null;
  await a.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForNavigation({ waitUntil: 'load' }).catch(() => {}), a.click()]);
  await page.waitForTimeout(1200);
  return here();
}
await page.goto(BASE + '/index.html', { waitUntil: 'load' });
await page.waitForFunction(() => navigator.serviceWorker && navigator.serviceWorker.controller, null, { timeout: 30000 });
await page.goto(BASE + '/parsha_emojis.html', { waitUntil: 'load' }); await page.waitForTimeout(2000);
await new Promise(ok => { server.close(() => ok()); server.closeAllConnections(); for (const s of sockets) s.destroy(); });
let refused = false; try { await fetch(BASE + '/index.html'); } catch (e) { refused = true; }
await page.goto(BASE + '/parsha_emojis.html', { waitUntil: 'load' }); await page.waitForTimeout(1500);
const toPage = await clickTo('a[href="parsha/bereshit.html"]');            // a coloring page never visited online
const toTool = await clickTo('a[href="flash_cards.html"]');                 // the hub's Flash Cards link
const flashUi = await page.locator('#startBtn').count();
await page.goto(BASE + '/no-such-page.html', { waitUntil: 'load' }); await page.waitForTimeout(800);
const rootUnknown = await here();                                           // the design kept: the hub at its own URL
const rootTool = await clickTo('a[href="flash_cards.html"]');
await browser.close();
const reached = !!(toTool && toTool.url === '/flash_cards.html' && flashUi > 0);
const rec = { control: CONTROL, refused, toPage, toTool, flashUi, rootUnknown, rootTool, reached, errors };
if (JSON_OUT) console.log(JSON.stringify(rec));
const summary = `S638 offline, an unvisited parsha page → the hub's Flash Cards (${CONTROL ? 'control: the plain hub fallback' : 'sw.js as committed'}): tap → ${toPage && toPage.url}, then Flash Cards → ${toTool && toTool.url} (${toTool && toTool.title}); root unknown path → ${rootUnknown.url} "${rootUnknown.title}", its Flash Cards → ${rootTool && rootTool.url}; ${errors.length} page errors`;
if (!refused || !toPage) { console.log(summary + ' → INCONCLUSIVE (the outage did not hold, or no parsha link)'); process.exit(2); }
if (CONTROL) { console.log(summary + ' → ' + (reached ? 'CONTROL SILENT' : 'control fired')); process.exit(reached ? 1 : 0); }
const ok = reached && rootUnknown.url === '/no-such-page.html' && rootTool && rootTool.url === '/flash_cards.html' && errors.length === 0;
console.log(summary + ' → ' + (ok ? 'PASS' : 'FAIL'));
process.exit(ok ? 0 : 1);
