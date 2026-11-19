#!/usr/bin/env node
// S664 — Blend Generator: the Self-Check rows above the cards (the timer bar, the score bar, Reveal All / Hide All with
// the per-row buttons) are the page's own controls, in the UI's language, but sat inside the worksheet, which is
// left-to-right. In the Hebrew UI they ran backwards: Start / Pause / Reset from the left, the counts from the left,
// the score bar's Reset at the right.
//   For each Self-Check that has such rows (blend with the timer, Gematria, Name the Letter, Real Words Gematria,
//   Number Practice) × EN light 1280 / HE dark 800, built by real clicks:
//     rows    — every row has the UI's direction and its children run from the UI's start edge, line by line;
//     reset   — the score bar's Reset stands at the row's end edge;
//     timer   — the clock still reads m:ss (never mirrored) and counts down after a real Start;
//     score   — a card turned and scored by real clicks moves the count.
//   The English UI is the guard: unchanged before and after.
//
//   node scripts/loop/probes/S664-generator-selfcheck-rows-follow-the-ui.mjs      exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S664 fails every Hebrew row cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))));
const sw = (page, id) => page.locator(`label.toggle:has(#${id})`).click();
const VARIANTS = [
  ['blend + timer', async (p) => { await sw(p, 'selfCheckToggle'); await settle(p); await sw(p, 'timerToggle'); }, ['timer-bar', 'score-bar', 'self-check-controls']],
  ['Gematria', async (p) => { await p.locator('.blend-type-btn[data-worksheet="gematria"]').click(); await settle(p); await sw(p, 'gematriaSelfCheck'); }, ['score-bar', 'self-check-controls']],
  ['Name the Letter', async (p) => { await p.locator('.blend-type-btn[data-type="one"]').click(); await settle(p); await p.locator('.blend-type-btn[data-worksheet="nametheletter"]').click(); await settle(p); await sw(p, 'ntlSelfCheck'); }, ['sc-controls']],
  ['Real Words Gematria', async (p) => { await p.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(p); await p.locator('.rw-drill-btn[data-drill="gematria"]').click(); await settle(p); await sw(p, 'rwGematriaSelfCheck'); }, ['score-bar']],
  ['Number Practice', async (p) => { await p.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(p); await p.locator('.rw-drill-btn[data-drill="numpractice"]').click(); await settle(p); await sw(p, 'npSelfCheck'); }, ['sc-controls']],
];
const ROWS = '.timer-bar, .score-bar, .self-check-controls, .sc-controls';

for (const c of CELLS) for (const [name, setup, must] of VARIANTS) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w} ${name}`;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { if (localStorage.getItem('__s664')) return; localStorage.setItem('__s664', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); } catch (e) {} }, [c.lang, c.dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.setDefaultTimeout(8000);
  try {
    await page.goto(`${BASE}/hebrew_blend_generator.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('.letter-tile').length > 10); await page.evaluate(() => I18n.ready); await settle(page);
    await setup(page); await settle(page);
    await page.locator('#generateBtn').click();
    await page.waitForFunction((sel) => document.querySelectorAll('#worksheet ' + sel.split(', ').join(', #worksheet ')).length > 0, ROWS); await settle(page);
    const r = await page.evaluate((sel) => {
      const ui = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
      const out = { ui, rows: [], bad: [] };
      for (const row of document.querySelectorAll('#worksheet ' + sel.split(', ').join(', #worksheet '))) {
        const cls = row.className.split(' ')[0];
        out.rows.push(cls);
        const dir = getComputedStyle(row).direction;
        if (dir !== ui) out.bad.push(`${cls} runs ${dir}`);
        // the children, line by line, from the start edge
        const kids = [...row.children].filter((k) => k.getClientRects().length && getComputedStyle(k).visibility !== 'hidden').map((k) => k.getBoundingClientRect());
        for (let i = 1; i < kids.length; i++) {
          const a = kids[i - 1], b = kids[i];
          if (Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)) > Math.max(a.height, b.height) / 2) continue;   // wrapped to the next line
          if (ui === 'rtl' ? b.right > a.left + 1 : b.left < a.right - 1) out.bad.push(`${cls} child ${i + 1} stands before child ${i}`);
        }
        if (cls === 'score-bar') {
          const btn = row.querySelector('button'), rr = row.getBoundingClientRect(), br = btn.getBoundingClientRect(), cs = getComputedStyle(row);
          const gap = ui === 'rtl' ? br.left - rr.left - parseFloat(cs.paddingLeft) : rr.right - parseFloat(cs.paddingRight) - br.right;
          out.reset = Math.round(gap);
          if (Math.abs(gap) > 2) out.bad.push(`score-bar Reset is ${Math.round(gap)}px from the end edge`);
        }
      }
      const t = document.getElementById('scTimerDisplay');
      if (t) { out.clock = t.textContent; out.clockDir = getComputedStyle(t).direction; }
      return out;
    }, ROWS);
    const missing = must.filter((m) => !r.rows.includes(m));
    report(r.rows.length > 0 && !missing.length && !r.bad.length && errs.length === 0,
      `${tag}: rows ${r.rows.join(' + ')}${missing.length ? ' (missing ' + missing.join(', ') + ')' : ''} in a ${r.ui} UI${r.reset !== undefined ? ', Reset ' + r.reset + 'px from the end edge' : ''}${r.bad.length ? ' — ' + r.bad.join('; ') : ''}, errors ${errs.length}`);
    if (name === 'blend + timer') {
      // the clock: m:ss, read left to right, and it runs
      const before = r.clock;
      await page.locator('#scTimerBar .timer-controls button').first().click();
      await page.waitForTimeout(2300);
      const after = await page.evaluate(() => document.getElementById('scTimerDisplay').textContent);
      await page.locator('#scTimerBar .timer-controls button').nth(1).click();
      const secs = (s) => { const m = /^(\d+):(\d\d)$/.exec(s); return m ? +m[1] * 60 + +m[2] : NaN; };
      report(/^\d+:\d\d$/.test(before) && r.clockDir === 'ltr' && secs(before) - secs(after) >= 1 && secs(before) - secs(after) <= 4,
        `${tag}: the clock reads ${before} (${r.clockDir}), ${after} about two seconds after a real Start`);
      // a card turned and scored
      await page.locator('#scGrid .flip-card').first().click(); await settle(page);
      await page.locator('#scGrid .flip-card').first().locator('.flip-card-score-btns button').first().click(); await settle(page);
      const sc = await page.evaluate(() => document.querySelector('#scScoreBar .score-correct').textContent.trim());
      report(/1/.test(sc) && errs.length === 0, `${tag}: after one card turned and marked right the count reads "${sc}"`);
    }
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 140)}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
