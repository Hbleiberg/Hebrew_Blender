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
 * Cursive mode (--mode cursive): the rows are the handwritten forms — the head glyph in the cursive face beside the print
 * glyph, the hint cells from CURSIVE_TRICKS (the dot-pair halves are not rows: they share their base's drawing), the word
 * cells as above with the word set in the cursive face; batches c1–c3 are the chart's rows; output cursive-batch<N>-….png.
 *
 * Usage:  node scripts/letter-learner-review-sheet.mjs [--batch 1] [--ids alef,bet] [--port 8097] [--mode cursive]
 * Needs the preinstalled Playwright + Chromium (docs/reference/ops.md → the headless recipe). Starts its own
 * python3 -m http.server on the repo root; every other origin is blocked, so the sheet is fully offline.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs', 'letter_learner_review');
const BATCHES = { 1: ['alef', 'bet', 'vet', 'gimel', 'dalet'], 2: ['he', 'vav', 'zayin', 'chet', 'tet'], 3: ['yod', 'kaf', 'chaf', 'kaf_sofit', 'lamed'], 4: ['mem', 'mem_sofit', 'nun', 'nun_sofit', 'samech'], 5: ['ayin', 'pe', 'fe', 'pe_sofit', 'tzadi', 'tzadi_sofit'], 6: ['kuf', 'resh', 'shin', 'sin', 'tav', 'tzadi', 'tzadi_sofit'] };
const CURSIVE_BATCHES = { c1: ['alef', 'bet', 'gimel', 'dalet', 'he', 'vav', 'zayin', 'chet', 'tet'], c2: ['yod', 'kaf', 'kaf_sofit', 'lamed', 'mem', 'mem_sofit', 'nun', 'nun_sofit', 'samech'], c3: ['ayin', 'pe', 'pe_sofit', 'tzadi', 'tzadi_sofit', 'kuf', 'resh', 'shin', 'tav'] };
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const cursive = opt('--mode', '') === 'cursive';
const batch = opt('--batch', cursive ? 'c1' : '1');
const ids = (opt('--ids', '') || ((cursive ? CURSIVE_BATCHES : BATCHES)[batch] || []).join(',')).split(',').filter(Boolean);
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
  await page.evaluate(() => { if (typeof llCheckDrawings === 'function') Object.values(LETTERS).forEach(llCheckDrawings); });   // the page checks a letter's drawings when it is first shown; the sheet checks them all
  if (cursive) await page.evaluate(() => { if (typeof llCheckCursive === 'function') Object.values(CURSIVE).forEach(llCheckCursive); });
  if (cursive) await page.evaluate(() => document.fonts.load('40px "IvritSuite Ktav"', 'א')).catch(() => {});   // the head glyphs; same origin, so the route allows it
  await page.waitForTimeout(500);
  if (errors.length) { console.error('pageerror: ' + errors.join(' | ')); failed = true; }
  if (warnings.length) { console.error('the page\'s validator rejected a drawing:\n  ' + warnings.join('\n  ')); failed = true; }
  const known = await page.evaluate(({ ids, cursive }) => ids.filter(id => !LETTERS[id] || (cursive && !CURSIVE[id])), { ids, cursive });
  if (known.length) { console.error('unknown ids: ' + known.join(', ')); failed = true; }
  if (!failed) {
    for (const [tag, size] of [['thumbs', 120], ['large', 400]]) {
      for (const dark of [false, true]) {
        await page.evaluate(({ ids, size, dark, cursive }) => {
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
            head.innerHTML = cursive
              ? '<div lang="he" dir="rtl" style="font-family:var(--heb-cursive-font);font-size:2.6rem;line-height:1">' + L.glyph + '</div><div lang="he" dir="rtl" style="font-family:var(--heb-font);font-size:1.3rem;line-height:1;color:var(--muted)">' + L.glyph + '</div><div style="font-weight:700">' + L.name + '</div>'
              : '<div lang="he" dir="rtl" style="font-family:var(--heb-font);font-size:2.6rem;line-height:1">' + L.glyph + '</div><div style="font-weight:700">' + L.name + '</div>';
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
              if (sub) { const s = document.createElement('div'); s.lang = 'he'; s.dir = 'rtl'; s.style.cssText = 'font-family:var(' + (cursive ? '--heb-cursive-font' : '--heb-font') + ');font-size:' + (size > 200 ? '1.4rem' : '1rem'); s.textContent = sub; cap.appendChild(s); }
              c.appendChild(cap);
              return c;
            };
            const hint = cursive ? CURSIVE[id].hint : L.hint;
            const variants = (hint && hint.variants) || [];
            // Every variant gets a cell (two by default; a letter with three concepts shows three); a variant's own
            // caption is printed under it on the large sheet, since the concepts differ there. A cursive row prints the
            // write-up's Picture under the shown drawing.
            const lead = cursive ? (CURSIVE[id].picture || '') : '';
            for (let i = 0; i < Math.max(cursive ? 1 : 2, variants.length); i++) row.appendChild(cell(variants[i] && variants[i].svg, 'hint ' + ((variants[i] && variants[i].label) || String.fromCharCode(65 + i)) + ((hint && hint.show === i) ? ' (shown)' : '') + ((size > 200 && variants[i] && variants[i].caption) ? ' — ' + variants[i].caption : '') + ((size > 200 && lead && hint && hint.show === i) ? ' — ' + lead : '')));
            (L.words || []).forEach(w => row.appendChild(cell(w.svg, w.en, w.he)));
            sheet.appendChild(row);
          });
          document.body.innerHTML = '';
          document.body.appendChild(sheet);
        }, { ids, size, dark, cursive });
        await page.waitForTimeout(150);
        const file = path.join(OUT, (cursive ? 'cursive-batch' + batch.replace(/^c/, '') : 'batch' + batch) + '-' + tag + '-' + (dark ? 'dark' : 'light') + '.png');
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
