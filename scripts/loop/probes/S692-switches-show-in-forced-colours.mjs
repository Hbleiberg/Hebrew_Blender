#!/usr/bin/env node
// S692 — an on / off switch (`label.toggle` / `.switch` > checkbox + `.slider`) is a filled track and a white knob; in forced
// colours (Windows High Contrast) both became Canvas on Canvas, so every switch vanished, on and off alike. The Torah and
// Tefillah Trainers already carried the fix (an edged track, a ButtonText knob, the selection pair when on, GrayText when
// disabled); the pages below now carry the same rules (pattern selected-state-lost-in-forced-colors).
//
//   node scripts/loop/probes/S692-switches-show-in-forced-colours.mjs [page …]   (ROOT=<tree> runs another copy)
//   Per page: its real switch reached the way a teacher reaches it, then under forcedColors active × colour scheme light / dark ×
//   stored theme light / dark, plus the same four with forced colours off (the control: unchanged numbers outside HC). A
//   clip of the switch must differ from a clip of the ground beside it, and a real click must change it (mean channel
//   difference > 8, decoded in the page's own canvas — the Playwright build here ships no PNG decoder) and leave the
//   checkbox checked. Exit 1 otherwise or on a page error. `ROOT=` the tree before fails every forced cell (0.0 / 0.0).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const SEEN = ['hebrewDashboard_tourSeen', 'hebrewDashboard_setupSeen', 'hebrewFlashCards_tourSeen', 'hebrewBlendGenerator_tourSeen', 'hebrewTropeTutor_tourSeen'];
const PAGES = {
  'classroom_dashboard.html': { open: async p => { await p.click('#gearBtn'); await p.waitForTimeout(500); }, sw: 'label.toggle:has(#hideZoomBar)', input: '#hideZoomBar' },
  'flash_cards.html': { open: async () => {}, sw: 'label.switch:has(#inverseToggle)', input: '#inverseToggle' },
  'hebrew_blend_generator.html': { open: async () => {}, sw: 'label.toggle:has(#answerKeyToggle)', input: '#answerKeyToggle' },
  'trope_tutor.html': { open: async p => { await p.click('#tabSettings'); await p.waitForTimeout(400); }, sw: 'label.toggle:has(#optTuneEcho)', input: '#optTuneEcho' },
};
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PAGES);
const diff = (page, a, b) => page.evaluate(async ([a, b]) => {
  const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
  const [A, B] = await Promise.all([load(a), load(b)]); const c = document.createElement('canvas'); c.width = A.width; c.height = A.height; const x = c.getContext('2d');
  x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, c.width, c.height).data; x.clearRect(0, 0, c.width, c.height); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, c.width, c.height).data;
  let s = 0; for (let i = 0; i < da.length; i += 4) s += Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]); return s / (da.length / 4) / 3;
}, [a.toString('base64'), b.toString('base64')]);
let fail = 0, cells = 0;
for (const f of want) for (const fc of ['active', 'none']) for (const scheme of ['light', 'dark']) for (const stored of [0, 1]) {
  const P = PAGES[f]; if (!P) { console.log(`${f}: no entry`); fail++; continue; }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', colorScheme: scheme, forcedColors: fc });
  await ctx.addInitScript(([d, seen]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); localStorage.setItem('hebrewBlender_darkMode', String(d)); for (const k of seen) localStorage.setItem(k, '1'); }, [stored, SEEN]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/${f}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await P.open(page);
  const sw = page.locator(P.sw).first(); await sw.scrollIntoViewIfNeeded(); await page.mouse.move(2, 2); await page.waitForTimeout(200);
  const was = await page.locator(P.input).isChecked();
  const b = await sw.boundingBox(); const clip = { x: b.x - 4, y: b.y - 4, width: b.width + 8, height: b.height + 8 };
  const before = await page.screenshot({ clip }), ground = await page.screenshot({ clip: { ...clip, x: clip.x - 60 } });
  await sw.click(); await page.mouse.move(2, 2); await page.waitForTimeout(450);
  const now = await page.locator(P.input).isChecked();
  const after = await page.screenshot({ clip });
  const vis = await diff(page, before, ground), state = await diff(page, before, after);
  const ok = now !== was && vis > 8 && state > 8 && !errors.length; cells++; if (!ok) fail++;
  console.log(`${f} forced=${fc} scheme=${scheme} stored=${stored ? 'dark' : 'light'}: switch vs ground ${vis.toFixed(1)}, click changed it ${state.toFixed(1)}, checked ${was} → ${now}${errors.length ? `, errors ${errors.length}` : ''} ${ok ? 'ok' : 'FAIL'}`);
  await ctx.close();
}
console.log(`${cells - fail}/${cells} cells pass`);
await browser.close(); server.close(); process.exit(fail ? 1 : 0);
