#!/usr/bin/env node
/*
 * Render the Letter Learner's drawings into contact sheets for review: docs/letter_learner_review/
 * batch<N>-{thumbs,large}-{light,dark}.png — one row per letter (hint variant A, hint variant B, the four
 * words), at 120 px (the dialog's word pictures) and 400 px (a projected hint), in both themes.
 *
 * The drawings are read from letter_learner.html itself (LETTER_DATA, after the page's own validator ran),
 * and rendered inside the live page so its tokens, dark palette and .ll-anim CSS apply exactly as in
 * production — the sheet shows what a learner sees. A validator warning fails the build: a malformed drawing
 * never reaches a sheet.
 *
 * Usage:  node scripts/letter-learner-review-sheet.mjs [--batch 1] [--ids alef,bet] [--port 8097]
 * Needs the preinstalled Playwright + Chromium (docs/reference/ops.md → the headless recipe). Starts its own
 * python3 -m http.server on the repo root; every other origin is blocked, so the sheet is fully offline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'letter_learner_review');
const BATCHES = { 1: ['alef', 'bet', 'vet', 'gimel', 'dalet'], 2: ['he', 'vav', 'zayin', 'chet', 'tet'], 3: ['yod', 'kaf', 'chaf', 'kaf_sofit', 'lamed'], 4: ['mem', 'mem_sofit', 'nun', 'nun_sofit', 'samech'], 5: ['ayin', 'pe', 'fe', 'pe_sofit', 'tzadi', 'tzadi_sofit'] };
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const batch = opt('--batch', '1');
const ids = (opt('--ids', '') || (BATCHES[batch] || []).join(',')).split(',').filter(Boolean);
const PORT = Number(opt('--port', '8097'));
if (!ids.length) { console.error('letter-learner-review-sheet: nothing to render (unknown --batch; pass --ids)'); process.exit(2); }

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { console.error('letter-learner-review-sheet: Playwright is not available'); process.exit(2); } }

const BASE = 'http://localhost:' + PORT;
const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
await new Promise(r => setTimeout(r, 900));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
let failed = false;
try {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [], warnings = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'warning' && m.text().startsWith('[letters]')) warnings.push(m.text()); });
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/letter_learner.html', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  if (errors.length) { console.error('pageerror: ' + errors.join(' | ')); failed = true; }
  if (warnings.length) { console.error('the page\'s validator rejected a drawing:\n  ' + warnings.join('\n  ')); failed = true; }
  const known = await page.evaluate((ids) => ids.filter(id => !LETTERS[id]), ids);
  if (known.length) { console.error('unknown ids: ' + known.join(', ')); failed = true; }
  if (!failed) {
    for (const [tag, size] of [['thumbs', 120], ['large', 400]]) {
      for (const dark of [false, true]) {
        await page.evaluate(({ ids, size, dark }) => {
          document.body.classList.toggle('dark', dark);
          document.documentElement.classList.remove('dark-early');
          const sheet = document.createElement('div');
          sheet.style.cssText = 'padding:18px;background:var(--cream);color:var(--text);font-family:Source Sans 3,sans-serif;';
          ids.forEach(id => {
            const L = LETTERS[id];
            const row = document.createElement('div');
            row.style.cssText = 'display:flex;gap:14px;align-items:flex-start;margin-bottom:18px;';
            const head = document.createElement('div');
            head.style.cssText = 'width:70px;flex-shrink:0;text-align:center;';
            head.innerHTML = '<div lang="he" dir="rtl" style="font-family:var(--heb-font);font-size:2.6rem;line-height:1">' + L.glyph + '</div><div style="font-weight:700">' + L.name + '</div>';
            row.appendChild(head);
            const cell = (inner, label, sub) => {
              const c = document.createElement('div');
              c.style.cssText = 'width:' + size + 'px;flex-shrink:0;text-align:center;';
              const box = document.createElement('div');
              box.style.cssText = 'width:' + size + 'px;height:' + size + 'px;border:1px dashed var(--border);border-radius:8px;';
              if (inner) { const svg = llSvg(inner, label); svg.style.cssText = 'width:100%;height:100%;display:block;'; box.appendChild(svg); }
              else { box.style.display = 'flex'; box.style.alignItems = 'center'; box.style.justifyContent = 'center'; box.style.color = 'var(--muted)'; box.textContent = '—'; }
              c.appendChild(box);
              const cap = document.createElement('div');
              cap.style.cssText = 'font-size:' + (size > 200 ? '0.95rem' : '0.72rem') + ';margin-top:4px;line-height:1.25;';
              cap.textContent = label;
              if (sub) { const s = document.createElement('div'); s.lang = 'he'; s.dir = 'rtl'; s.style.cssText = 'font-family:var(--heb-font);font-size:' + (size > 200 ? '1.4rem' : '1rem'); s.textContent = sub; cap.appendChild(s); }
              c.appendChild(cap);
              return c;
            };
            const variants = (L.hint && L.hint.variants) || [];
            for (let i = 0; i < 2; i++) row.appendChild(cell(variants[i] && variants[i].svg, 'hint ' + ((variants[i] && variants[i].label) || String.fromCharCode(65 + i)) + ((L.hint && L.hint.show === i) ? ' (shown)' : '')));
            (L.words || []).forEach(w => row.appendChild(cell(w.svg, w.en, w.he)));
            sheet.appendChild(row);
          });
          document.body.innerHTML = '';
          document.body.appendChild(sheet);
        }, { ids, size, dark });
        await page.waitForTimeout(150);
        const file = path.join(OUT, 'batch' + batch + '-' + tag + '-' + (dark ? 'dark' : 'light') + '.png');
        await page.screenshot({ path: file, fullPage: true });
        console.log('wrote ' + path.relative(ROOT, file));
        // Each pass starts from the real page again so nothing leaks between passes.
        await page.goto(BASE + '/letter_learner.html', { waitUntil: 'load' });
        await page.waitForTimeout(300);
      }
    }
  }
  await ctx.close();
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
