#!/usr/bin/env node
// S675 (pass C on the Tefillah Trainer; pattern selected-state-lost-in-forced-colors) — the chosen pill of a segmented
// choice (.radio-group: a hidden radio and its label) is a white fill on a tinted track, and forced colours paint both
// Canvas: in Windows High Contrast the choice read exactly like its neighbours. Computed styles do differ there
// (Canvas against transparent) while the pixels do not, so the probe compares what is painted: each label's fill
// composited over the grounds behind it.
//
//   node scripts/loop/probes/S675-chosen-radio-pill-in-forced-colours.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S675 fails every forced cell).
//   PAGES=a.html,b.html checks other carriers (every page that carries the pills is in FIXED since S677).
//
// Per page × the system's light / dark palette × the stored theme light / dark, forced colours on: every .radio-group
// with a chosen radio paints its chosen label apart from an unchosen one (fill or text colour, 3:1 between the two
// fills), and the chosen label's text is 4.5:1 on its fill. Without forced colours (the guard) the page's own look
// holds: the chosen label keeps its own fill, not a system colour. No page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const FIXED = ['trope_tutor.html', 'torah_trainer.html', 'classroom_dashboard.html', 'tefillah_trainer.html'];   // S676: the Torah Trainer and the dashboard; S677: the Tefillah Trainer
const PAGES = process.env.PAGES ? process.env.PAGES.split(',') : FIXED;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const measure = () => {
  const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, g) => ({ r: f.r * f.a + g.r * (1 - f.a), g: f.g * f.a + g.g * (1 - f.a), b: f.b * f.a + g.b * (1 - f.a), a: 1 });
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, c) => { const x = lum(a), y = lum(c); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // what is painted behind an element's text: its own fill over its ancestors', down to the canvas
  const painted = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; } } let g = layers.length && layers[layers.length - 1].a === 1 ? layers.pop() : (parse(getComputedStyle(document.documentElement).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }); if (g.a < 1) g = over(g, { r: 255, g: 255, b: 255, a: 1 }); while (layers.length) g = over(layers.pop(), g); return g; };
  const rgb = c => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
  const out = [];
  for (const g of document.querySelectorAll('.radio-group')) {
    const on = g.querySelector('input:checked + label'), off = g.querySelector('input:not(:checked) + label'); if (!on || !off) continue;
    const a = painted(on), b = painted(off), ta = parse(getComputedStyle(on).color), tb = parse(getComputedStyle(off).color);
    out.push({ group: (g.querySelector('input') || {}).name || g.id || '?', fills: +ratio(a, b).toFixed(2), text: +ratio(over(ta, a), a).toFixed(2), on: rgb(a), off: rgb(b), sameText: rgb(over(ta, a)) === rgb(over(tb, b)), track: rgb(painted(g)) });
  }
  return out;
};
const browser = await chromium.launch(); const records = [];
for (const file of PAGES) for (const forced of [true, false]) for (const scheme of ['light', 'dark']) for (const stored of ['0', '1']) {
  if (!forced && scheme !== (stored === '1' ? 'dark' : 'light')) continue;   // the guard: the page's two own looks
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', colorScheme: scheme, forcedColors: forced ? 'active' : 'none' });
  await ctx.addInitScript(c => { try { localStorage.setItem('hebrewBlender_darkMode', c.stored); for (const k of ['hebrewTefillahTrainer_tourSeen', 'hebrewTorahTrainer_tourSeen', 'hebrewDashboard_tourSeen', 'hebrewDashboard_setupSeen', 'hebrewTropeTutor_tourSeen']) localStorage.setItem(k, '1'); } catch (e) {} }, { stored });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const rec = { cell: `${file.replace('.html', '')} ${forced ? 'forced' : 'own look'} system ${scheme} stored ${stored === '1' ? 'dark' : 'light'}`, notes: [] };
  try {
    await page.goto(`${BASE}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const rows = await page.evaluate(measure); rec.groups = rows.length;
    if (!rows.length) rec.notes.push('no .radio-group with a chosen radio');
    if (forced) { const bad = rows.filter(r => r.fills < 3 || r.text < 4.5); rec.worst = rows.length ? Math.min(...rows.map(r => r.fills)) : 0; if (bad.length) rec.notes.push(`${bad.length} of ${rows.length} groups: the chosen pill ${bad[0].on} beside ${bad[0].off} (${bad[0].fills}:1), its text ${bad[0].text}:1 — ${bad[0].group}`); }
    else { const sys = rows.filter(r => r.fills < 1.05 && r.sameText); rec.worst = rows.length ? Math.min(...rows.map(r => r.fills)) : 0; if (sys.length) rec.notes.push(`${sys.length} groups show no chosen pill in the page's own look`); const own = stored === '1' ? 'rgb(30,37,53)' : 'rgb(255,255,255)'; const off = rows.filter(r => r.on !== own); if (off.length) rec.notes.push(`${off.length} chosen pills are not the page's own fill ${own}: ${off[0].on}`); }
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  if (errors.length) rec.notes.push(`page errors ${errors.length}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close().catch(() => {});
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(56)} groups ${r.groups}, the least chosen-to-unchosen fill ratio ${r.worst}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const bad = records.filter(r => !r.ok);
console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
