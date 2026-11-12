#!/usr/bin/env node
// S646 — the Font Maker's account copy no longer freezes the page on a project of phone photos. fmCloudPack, which
// every 10 s cloud autosave of an edited account project runs, began with JSON.parse(JSON.stringify(project)): with
// 8 photos of 3024×4032 that held the page ~120 ms at 1× (~0.5–0.6 s at 4× CPU) at every save. It now names each
// photo first and writes the JSON with a replacer, never copying the project.
//
//   node scripts/loop/probes/S646-fontmaker-cloud-pack-no-clone.mjs     exit 1 on a long pack or a wrong file
//   ROOT=<a git archive of the tree> runs the same check on another copy (the control); --json prints the record.
//
// No sign-in needed: fmCloudPack is pure (the bytes go up through js/ivrit-projects.js, which smoke-fontmaker.mjs
// covers with --sdk). Serves ROOT in-process (every foreign origin aborted, service workers blocked); the photos are
// drawn in the page (a letter on lit paper with sensor noise, JPEG, as the S565 probe draws them) and land through
// applyProjectData. Measured: the pack's stretch before its first yield, every photo already named (the state of
// every save after the first), best of three; and the file it writes — one 'cloud:' name per photo, no photo inline.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const N = 8, LIMIT = 40;   // ms the pack may hold the page before its first yield (before the fix: ~120 at 1×)
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
await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); } });
const page = await ctx.newPage(); const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
await page.goto(BASE + '/Hebrew_Font_Maker.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.getElementById('wizardOverlay')?.classList.contains('open'), null, { timeout: 60000 });
await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
const handle = await page.evaluate(() => typeof fmCloudPack === 'function' && typeof applyProjectData === 'function' && typeof _cloudNames !== 'undefined');
const rec = await page.evaluate(async (N) => {
  const p = JSON.parse(JSON.stringify(project));
  p.font.familyName = 'Probe Photos'; p.font.reservedFontName = 'Probe Photos';
  for (let i = 0; i < N; i++) {
    const W = 3024, H = 4032, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const g = c.createRadialGradient(W * 0.3, H * 0.3, 100, W / 2, H / 2, H); g.addColorStop(0, '#f6f3ec'); g.addColorStop(1, '#bdb7a9');
    c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = '#1b1b22'; c.font = '2000px serif'; c.textAlign = 'center';
    c.fillText('אבגדהוזח'[i], W / 2, H * 0.68);
    const id = c.getImageData(0, 0, W, H), d = id.data;
    for (let q = 0; q < d.length; q += 4) { const n = (Math.random() - 0.5) * 22; d[q] += n; d[q + 1] += n; d[q + 2] += n; }
    c.putImageData(id, 0, 0);
    p.letters[i].source = { kind: 'single', dataUrl: cv.toDataURL('image/jpeg', 0.88), cropRect: null, sheetId: null };
  }
  await applyProjectData(p);
  project.cloudId = '00000000-0000-4000-8000-000000000000'; project.cloudRev = '2026-11-12T00:00:00.000Z';
  const chars = JSON.stringify(project).length;
  _cloudNames.clear();
  const first = await fmCloudPack(project);   // names (and hashes) every photo, as the first save does
  const sync = [];
  let packed = null;
  for (let i = 0; i < 3; i++) { const t = performance.now(); const pr = fmCloudPack(project); const dt = performance.now() - t; packed = await pr; sync.push(Math.round(dt)); }
  const j = JSON.parse(packed.json);
  const inlineRasters = (packed.json.match(/"data:image\/(png|jpeg|webp|gif)[^"]{4096,}"/g) || []).length;
  return { chars, sync, sameAsFirst: packed.json === first.json, sources: packed.sources.length, names: j.letters.slice(0, N).filter(l => /^cloud:[0-9a-f]{16}\.jpg$/.test(l.source.dataUrl)).length, inlineRasters, manifest: Object.keys(j.cloudSources || {}).length, noRev: !('cloudRev' in j), liveKept: project.letters.slice(0, N).every(l => l.source.dataUrl.startsWith('data:image/jpeg')) };
}, N);
await browser.close(); server.close();
const best = Math.min(...rec.sync);
const bad = [];
if (!handle) bad.push('the page has no fmCloudPack / applyProjectData / _cloudNames (the probe cannot measure)');
if (best > LIMIT) bad.push(`the pack holds the page for ${best} ms before it yields (limit ${LIMIT})`);
if (rec.names !== N || rec.sources !== N || rec.manifest !== N || rec.inlineRasters || !rec.noRev) bad.push('the file is wrong: ' + JSON.stringify({ names: rec.names, sources: rec.sources, manifest: rec.manifest, inlineRasters: rec.inlineRasters, noRev: rec.noRev }));
if (!rec.sameAsFirst) bad.push('a save after the first writes a different file');
if (!rec.liveKept) bad.push('the live project lost its photos');
if (errors.length) bad.push(errors.length + ' pageerrors');
if (JSON_OUT) console.log(JSON.stringify(Object.assign({ root: ROOT, photos: N, errors }, rec), null, 1));
else console.log(`${N} photos, project ${(rec.chars / 1e6).toFixed(1)} M chars: the pack before its first yield ${rec.sync.join(' / ')} ms; ${rec.names} photos named, ${rec.inlineRasters} inline; repeat save ${rec.sameAsFirst ? 'identical' : 'DIFFERENT'}`);
bad.forEach(b => console.log('FAIL ' + b));
process.exit(bad.length ? 1 : 0);
