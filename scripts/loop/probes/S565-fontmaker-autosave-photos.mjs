#!/usr/bin/env node
// S565 — the Font Maker's autosave no longer freezes the page on a project of phone photos. Before, each snapshot
// copied every photo into one two-byte JSON string and its UTF-8 Blob: 8 photos of 3024×4032 froze the page for
// ~2 s at 1× (8–9 s at 4× CPU) three seconds after every edit. The snapshot must still hold exactly
// JSON.stringify(project), and Continue must bring the same project back.
//
//   node scripts/loop/probes/S565-fontmaker-autosave-photos.mjs        exit 1 on a long autosave, a changed snapshot or restore
//   ROOT=<a git archive of the tree> runs the same check on another copy (the control); --json prints the record.
//
// Serves ROOT in-process (every foreign origin aborted, service workers blocked). The photos are drawn here (a
// letter on lit paper with sensor noise, JPEG), picked by the real multi-photo input on the wizard's default path.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const N = 8, LIMIT = 150;   // ms the snapshot may hold the page before its first yield (before the fix: 0.5–2 s at 1×)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); }
  window.__lt = [];
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push({ s: e.startTime, d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true });
});
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
await page.goto(BASE + '/Hebrew_Font_Maker.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.getElementById('wizardOverlay')?.classList.contains('open'), null, { timeout: 60000 });
// The photos, drawn in the page.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 's565-'));
const names = ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav', 'zayin', 'het'].slice(0, N);
for (let i = 0; i < N; i++) {
  const b64 = await page.evaluate(i => {
    const W = 3024, H = 4032, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const g = c.createRadialGradient(W * 0.3, H * 0.3, 100, W / 2, H / 2, H); g.addColorStop(0, '#f6f3ec'); g.addColorStop(1, '#bdb7a9');
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#1b1b22'; c.font = '2000px serif'; c.textAlign = 'center';
    c.fillText('אבגדהוזח'[i], W / 2, H * 0.68);
    const id = c.getImageData(0, 0, W, H), d = id.data;
    for (let p = 0; p < d.length; p += 4) { const n = (Math.random() - 0.5) * 22; d[p] += n; d[p + 1] += n; d[p + 2] += n; }
    c.putImageData(id, 0, 0); return cv.toDataURL('image/jpeg', 0.88).split(',')[1];
  }, i);
  fs.writeFileSync(path.join(dir, names[i] + '.jpg'), Buffer.from(b64, 'base64'));
}
await page.fill('#wizName', 'Probe Photos'); await page.fill('#wizAuthor', 'Probe');
await page.click('#wizNext'); await page.click('#wizNext'); await page.click('#wizCreate');
await page.waitForTimeout(800);
await page.setInputFiles('#letterFile', names.map(n => path.join(dir, n + '.jpg')));
await page.waitForFunction(n => project.letters.filter(l => l.source && l.source.dataUrl).length >= n, N, { timeout: 60000 });
// Snapshot read back: the gunzipped record vs JSON.stringify(project), after the pick's own autosave has finished.
const snapshot = () => page.evaluate(async () => {
  const rec = await autosaveGet(); if (!rec || !rec.gz) return { ok: false, why: 'no snapshot' };
  const text = await gunzipText(rec.gz), json = JSON.stringify(project);
  return { ok: text === json, chars: json.length };
});
const settle = async () => { let n = -1; for (let i = 0; i < 60; i++) { await page.waitForTimeout(500); const c = await page.evaluate(() => window.__lt.length); if (c === n && !(await page.evaluate(() => _autosaveInFlight))) break; n = c; } };
await page.waitForTimeout(5000); await settle();
const first = await snapshot();
// The edit's autosave, as the page schedules it (markDirty is what every setter calls; a tile click is no edit),
// timed from the moment it is scheduled; then the snapshot's synchronous part on its own — the work done before
// autosaveNow() first yields, i.e. the stretch the page cannot answer a click — best of three calls.
const t0 = await page.evaluate(() => { markDirty(); return performance.now(); });
await page.waitForFunction(() => _autosaveInFlight, null, { timeout: 10000, polling: 20 }).catch(() => {});
await page.waitForFunction(() => !_autosaveInFlight, null, { timeout: 120000 });
await page.waitForTimeout(1500);
const tasks = await page.evaluate(t => window.__lt.filter(e => e.s >= t).map(e => e.d), t0);
const sync = [];
for (let i = 0; i < 3; i++) {
  sync.push(await page.evaluate(async () => { const t = performance.now(); const p = autosaveNow(); const d = performance.now() - t; await p; return Math.round(d); }));
}
const second = await snapshot();
const chars = await page.evaluate(() => JSON.stringify(project).length);
// Continue after a reload brings the same photos back, placed the same (the restore's own backfills — an empty
// markShapes, customFonts — are migrateProject's and not compared).
const photosOf = () => page.evaluate(() => JSON.stringify({ name: project.font.familyName, letters: project.letters.filter(l => l.source && l.source.dataUrl).map(l => [l.codepoint, l.source.dataUrl, l.transform, l.binThreshold]) }));
const want = await photosOf();
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('#askBtns button'), null, { timeout: 60000 });
await page.click('#askBtns button:first-child');
await page.waitForFunction(n => typeof project !== 'undefined' && project.letters.filter(l => l.source && l.source.dataUrl).length >= n, N, { timeout: 60000 });
const restored = (await photosOf()) === want;
await browser.close(); server.close(); fs.rmSync(dir, { recursive: true, force: true });
const top = tasks.length ? Math.max(...tasks) : 0, best = Math.min(...sync);
const rec = { root: ROOT, photos: N, projectChars: chars, snapshotAfterPick: first, snapshotAfterEdit: second, autosaveTasks: tasks, top, syncMs: sync, restored, errors };
const bad = [];
if (!first.ok || !second.ok) bad.push('the snapshot is not JSON.stringify(project)');
if (best > LIMIT) bad.push(`the autosave holds the page for ${best} ms before it yields (limit ${LIMIT})`);
if (!restored) bad.push('Continue did not bring the same photos back');
if (errors.length) bad.push(errors.length + ' pageerrors');
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(`${N} photos, project ${(chars / 1e6).toFixed(1)} M chars: autosave before its first yield ${sync.join(' / ')} ms; long tasks in the edit's window [${tasks.join(', ')}]; snapshot ${second.ok ? 'identical' : 'DIFFERENT'}; Continue ${restored ? 'same photos' : 'DIFFERENT'}`);
bad.forEach(b => console.log('FAIL ' + b));
process.exit(bad.length ? 1 : 0);
