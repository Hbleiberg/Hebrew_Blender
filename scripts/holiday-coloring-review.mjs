#!/usr/bin/env node
/*
 * Render the Holiday Guide's drawings into contact sheets for review: docs/holiday-coloring-review/holidays.png (the
 * seventeen holiday symbols) and one <slug>.png per holiday that has its symbols (its six, and their meaning pictures
 * where it has them). One row a drawing: as the site shows it in light and in dark, the line art a coloring sheet
 * prints, and the coloured-in print (the light palette on white paper).
 *
 * The drawings come straight from HolidayGuide.md (scripts/holiday-catalog.mjs) and the conversion is the site's own
 * (js/coloring-art.js → etCsConvert), loaded into a blank page: it reads only the drawing's attributes and its laid-out
 * geometry, so no site page is needed. A conversion error fails the run. Re-run it whenever HolidayGuide.md changes a
 * drawing, and look at every row: the rules were tuned on the parasha drawings and are not retuned for a holiday
 * one (that would change all 54 parasha pictures) — a drawing that converts badly is redrawn.
 *
 * Usage:  node scripts/holiday-coloring-review.mjs [--only <slug>] [--size 150] [--out <dir>]
 * Needs the preinstalled Playwright + Chromium (docs/reference/ops.md → the headless recipe). Fully offline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readHolidayCatalog } from './holiday-catalog.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const ONLY = opt('--only', '');
const SIZE = Number(opt('--size', '150'));
const OUT = path.resolve(opt('--out', path.join(ROOT, 'docs', 'holiday-coloring-review')));

const { holidays, problems } = readHolidayCatalog();
if (problems.length) { console.error('holiday-coloring-review: the catalog has problems:\n  ' + problems.join('\n  ')); process.exit(1); }

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('holiday-coloring-review: Playwright is not available'); process.exit(2); } }

const LIGHT = '--hol-line:#1a2744;--hol-gold:#c9922a;--hol-gold-lt:#f0d080;--hol-paper:#fffaf0;--hol-navy:#2a3b66;--hol-red:#c0392b;--hol-green:#3a7d44;--hol-blue:#3b6fb6;--hol-flame:#f0a030;--hol-ground:#fdf8ef';
const DARK = '--hol-line:#e8e0d0;--hol-gold:#e0a832;--hol-gold-lt:#f5d97a;--hol-paper:#e8e0d0;--hol-navy:#5a6d9c;--hol-red:#e0584a;--hol-green:#5aa865;--hol-blue:#6a9ae0;--hol-flame:#f6b84a;--hol-ground:#161c2a';
const sheets = [];
if (!ONLY || ONLY === 'holidays') sheets.push({ name: 'holidays', rows: holidays.map((h) => ({ label: h.n + '. ' + h.en, svg: h.icon, key: h.slug })) });
for (const h of holidays) {
  if (!h.symbols.length || (ONLY && ONLY !== h.slug)) continue;
  const rows = [];
  for (const s of h.symbols) {
    rows.push({ label: s.n + '. ' + s.en, svg: s.svg, key: h.slug + '/' + s.n });
    if (s.meaning) rows.push({ label: '   ↳ ' + s.meaning.en, svg: s.meaning.svg, key: h.slug + '/' + s.n + '/m' });
  }
  sheets.push({ name: h.slug, rows });
}
if (!sheets.length) { console.error('holiday-coloring-review: nothing named ' + ONLY); process.exit(2); }

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 190 + 4 * (SIZE + 14), height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' });
  for (const sheet of sheets) {
    // A page of its own per sheet: js/coloring-art.js declares top-level constants, which one page takes only once.
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.setContent('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#fff;font-family:sans-serif}' +
      '.site svg{stroke:var(--hol-line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;fill:none}' +
      '.lt{' + LIGHT + ';background:#fdf8ef}.dk{' + DARK + ';background:#161c2a}</style></head><body></body></html>');
    await page.addScriptTag({ path: path.join(ROOT, 'js/coloring-art.js') });
    const bad = await page.evaluate(({ rows, size }) => {
      const NS = 'http://www.w3.org/2000/svg', bad = [];
      const make = (inner) => { const t = document.createElement('template'); t.innerHTML = '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '">' + inner + '</svg>'; return t.content.firstChild; };
      const paper = (inner, colored, key) => {
        const svg = make(inner);
        [['fill', 'none'], ['stroke', 'var(--hol-line)'], ['stroke-width', '2'], ['stroke-linecap', 'round'], ['stroke-linejoin', 'round']].forEach(([a, v]) => svg.setAttribute(a, v));
        try { etCsConvert(svg, colored, key); } catch (e) { bad.push(key + ': ' + e.message); }
        return svg;
      };
      const box = document.createElement('div');
      box.id = 'sheet';
      box.style.cssText = 'padding:12px;display:inline-block;';
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;gap:14px;margin-bottom:8px;font-size:13px;color:#555;';
      ['', 'site, light', 'site, dark', 'line art', 'coloured in'].forEach((t, j) => { const c = document.createElement('div'); c.style.width = (j ? size : 150) + 'px'; c.textContent = t; head.appendChild(c); });
      box.appendChild(head);
      for (const r of rows) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:14px;align-items:center;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:6px;';
        const lab = document.createElement('div');
        lab.textContent = r.label; lab.style.cssText = 'width:150px;font-weight:700;font-size:14px;white-space:pre-wrap;';
        row.appendChild(lab);
        for (const cls of ['site lt', 'site dk']) { const c = document.createElement('div'); c.className = cls; c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;'; c.appendChild(make(r.svg)); row.appendChild(c); }
        for (const colored of [false, true]) { const c = document.createElement('div'); c.style.cssText = 'width:' + size + 'px;height:' + size + 'px;background:#fff;outline:1px solid #eee;'; c.appendChild(paper(r.svg, colored, r.key)); row.appendChild(c); }
        box.appendChild(row);
      }
      document.body.appendChild(box);
      if (/var\(/.test([...document.querySelectorAll('#sheet > div > div:nth-child(n+4) svg')].map((s) => s.outerHTML).join(''))) bad.push('a palette token survived on paper');
      return bad;
    }, { rows: sheet.rows, size: SIZE });
    if (bad.length || errors.length) { failed = true; console.error(`holiday-coloring-review: ${sheet.name}: ` + [...bad, ...errors].join('; ')); await page.close(); continue; }
    const file = path.join(OUT, sheet.name + '.png');
    await page.locator('#sheet').screenshot({ path: file });
    await page.close();
    console.log('wrote ' + path.relative(process.cwd(), file) + ' (' + sheet.rows.length + ' drawings)');
  }
} finally { await browser.close(); }
if (failed) process.exit(1);
