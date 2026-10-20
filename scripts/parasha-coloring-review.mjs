#!/usr/bin/env node
/*
 * Render the parasha drawings' coloring-sheet versions into contact sheets for review:
 * docs/parasha-coloring-review/batch-<N>.png — nine parshiyot a sheet, one row each: the drawing as the site shows it,
 * the line art a coloring sheet prints, and the coloured-in print (the light palette on white paper).
 *
 * The conversion is the page's own (emoji_torah.html → etCsDrawing / etCsConvert), run inside the live page so its
 * measuring and tokens apply exactly as in production. A conversion warning or a page error fails the run: a drawing
 * whose palette token survives never reaches a sheet unnoticed. Re-run it whenever ParashaEmojis.md changes a drawing,
 * and look at every row: the rules are general (docs/reference/shared-components.md → The parsha emojis page), and a
 * new drawing can meet a case they were never tuned on.
 *
 * Usage:  node scripts/parasha-coloring-review.mjs [--batch 3] [--size 190] [--port 8098]
 * Needs the preinstalled Playwright + Chromium (docs/reference/ops.md → the headless recipe). Starts its own
 * python3 -m http.server on the repo root; every other origin is blocked, so the sheet is fully offline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'parasha-coloring-review');
const PER = 9, COUNT = 54;
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const only = opt('--batch', '');
const SIZE = Number(opt('--size', '190'));
const PORT = Number(opt('--port', '8098'));
const batches = [];
for (let b = 1; b <= Math.ceil(COUNT / PER); b++) if (!only || String(b) === only) batches.push(b);
if (!batches.length) { console.error('parasha-coloring-review: no such batch (1–' + Math.ceil(COUNT / PER) + ')'); process.exit(2); }

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('parasha-coloring-review: Playwright is not available'); process.exit(2); } }

const BASE = 'http://localhost:' + PORT;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = false;
try {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 180 + 3 * (SIZE + 14), height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'warning' && m.text().startsWith('[coloring]')) warnings.push(m.text()); });
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  for (const b of batches) {
    // Each batch starts from the real page so nothing leaks between batches.
    await page.goto(BASE + '/emoji_torah.html', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof etData !== 'undefined' && etData && window.ParashaIcons, null, { timeout: 15000 }).catch(() => {});   // etData is the page's own top-level let
    const ok = await page.evaluate(() => typeof etCsDrawing === 'function' && typeof etData !== 'undefined' && Array.isArray(etData) && etData.length > 0);
    if (!ok) { console.error('parasha-coloring-review: the page did not load its data or its converter'); failed = true; break; }
    await page.evaluate(({ start, end, size }) => {
      const names = etData.map(p => p.en);
      const sheet = document.createElement('div');
      sheet.style.cssText = 'padding:12px;background:#fff;color:#000;font-family:Source Sans 3,sans-serif;';
      const head = document.createElement('div');
      head.style.cssText = 'display:flex;gap:14px;margin-bottom:8px;font-size:13px;color:#555;';
      ['', 'site', 'line art', 'coloured in'].forEach((t, j) => { const c = document.createElement('div'); c.style.width = (j ? size : 120) + 'px'; c.textContent = t; head.appendChild(c); });
      sheet.appendChild(head);
      for (let i = start; i < end; i++) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:14px;align-items:center;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:6px;';
        const lab = document.createElement('div');
        lab.textContent = (i + 1) + '. ' + names[i];
        lab.style.cssText = 'width:120px;font-weight:700;font-size:14px;';
        row.appendChild(lab);
        const site = document.createElement('div');
        site.innerHTML = ParashaIcons.html(i);   // generated markup, the same the page shows
        const sp = site.firstElementChild;
        sp.style.cssText = 'width:' + size + 'px;height:' + size + 'px;margin:0;';
        row.appendChild(sp);
        for (const colored of [false, true]) {
          const box = document.createElement('div');
          box.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border:1px dashed #ccc;';
          const svg = etCsDrawing(i, colored);
          if (svg) { svg.setAttribute('width', size); svg.setAttribute('height', size); box.appendChild(svg); }
          row.appendChild(box);
        }
        sheet.appendChild(row);
      }
      document.body.className = '';
      document.documentElement.classList.remove('dark-early');
      document.body.style.cssText = 'display:block;background:#fff;';
      document.body.innerHTML = '';
      document.body.appendChild(sheet);
    }, { start: (b - 1) * PER, end: Math.min(COUNT, b * PER), size: SIZE });
    await page.waitForTimeout(150);
    const file = path.join(OUT, 'batch-' + b + '.png');
    await page.screenshot({ path: file, fullPage: true });
    console.log('wrote ' + path.relative(ROOT, file));
  }
  if (errors.length) { console.error('pageerror: ' + errors.join(' | ')); failed = true; }
  if (warnings.length) { console.error('the converter could not finish a drawing:\n  ' + warnings.join('\n  ')); failed = true; }
  await ctx.close();
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
