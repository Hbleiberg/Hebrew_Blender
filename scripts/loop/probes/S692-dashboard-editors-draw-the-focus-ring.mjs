#!/usr/bin/env node
// S692 — the settings drawer's two rich-text editors (#dashEditor, the board's words; #intermissionEditor, the
// Intermission screen) showed keyboard focus only as their 1px border turning gold, where every other drawer control draws
// the suite's 2px focus ring. `.editor:focus-visible` now draws that ring inside the box (the toolbar sits on its top edge).
//
//   node scripts/loop/probes/S692-dashboard-editors-draw-the-focus-ring.mjs   (ROOT=<tree> runs another copy)
//   EN / HE × light / dark × 1280 / 800: ⚙ by Enter, the Text tab by a real click, then Tab from the tab until both editors
//   have been focused (the handle: both must be reached); each must show a solid outline >= 2px whose colour stands >= 3:1
//   against the editor's ground, and a real mouse click into the board's editor shows it too. Exit 1 otherwise or on a page
//   error. `ROOT=` the tree before fails 8 of 8 cells.
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
const lum = c => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let fail = 0, cells = 0;
for (const lang of ['en', 'he']) for (const dark of [false, true]) for (const w of [1280, 800]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([l, d]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewDashboard_tourSeen', '1'); localStorage.setItem('hebrewDashboard_setupSeen', '1'); }, [lang, dark]);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/classroom_dashboard.html`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  await page.focus('#gearBtn'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  await page.click('#dashTabText'); await page.waitForTimeout(300); await page.focus('#dashTabText');
  const got = {};
  for (let i = 0; i < 60 && Object.keys(got).length < 2; i++) {
    await page.keyboard.press('Tab');
    const r = await page.evaluate(() => { const e = document.activeElement; if (!e.classList.contains('editor')) return null; const cs = getComputedStyle(e); return { id: e.id, os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oc: cs.outlineColor, bg: cs.backgroundColor }; });
    if (r) got[r.id] = r;
  }
  await page.click('#dashEditor');
  const click = await page.evaluate(() => document.activeElement.id === 'dashEditor' && getComputedStyle(document.activeElement).outlineStyle === 'solid');
  const ok = ['dashEditor', 'intermissionEditor'].every(id => got[id] && got[id].os === 'solid' && got[id].ow >= 2 && ratio(got[id].oc, got[id].bg) >= 3) && click && !errors.length;
  cells++; if (!ok) fail++;
  console.log(`${lang} ${dark ? 'dark' : 'light'} ${w}: ${ok ? 'ok' : 'FAIL'} ` + ['dashEditor', 'intermissionEditor'].map(id => got[id] ? `${id} ${got[id].os} ${got[id].ow}px ${ratio(got[id].oc, got[id].bg).toFixed(2)}:1` : `${id} not reached`).join(' / ') + ` | click ${click}` + (errors.length ? ` | errors ${errors.length}` : ''));
  await ctx.close();
}
console.log(`${cells - fail}/${cells} cells pass`);
await browser.close(); server.close(); process.exit(fail ? 1 : 0);
