#!/usr/bin/env node
// S620 — the shared tour engine (trope_tutor, letter_learner, name_tags): a keyboard user who Tabs on from the card
// round the whole page scrolls it to its foot while the fixed card follows its target at the top; when the focus
// re-enters the card (Tab round, or Shift+Tab back) the target scrolls back into view first, so Back, Next and End are
// on the screen where the focus is. Stepping by Enter and Escape's return to the Tour button are unchanged.
//
//   node scripts/loop/probes/S620-tour-card-back-in-view-on-focus.mjs
//   exit 1 when the card is off the screen when the focus re-enters it, a step's card is off the screen, or Escape
//   does not end the tour on its button. ROOT=<a git archive of the tree> runs another copy (the tree before S620
//   fails: the card sits 600–2,100 px above the screen); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const rect = p => p.evaluate(() => { const c = document.getElementById('tourCard'); const r = c.getBoundingClientRect(); const a = document.activeElement; const vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  return { hidden: c.hidden, inView: r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw, top: Math.round(r.top), focus: a.id || a.className || a.tagName, inCard: !!a.closest('#tourCard'), fv: a.matches(':focus-visible'), sy: Math.round(scrollY) }; });
for (const file of ['letter_learner.html', 'trope_tutor.html', 'name_tags.html']) for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const name = file.replace('.html', '') + ' ' + cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 700 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/' + file, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('tourBtn')); await page.evaluate(() => I18n.ready); await page.waitForLoadState('load'); await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  const step = (n, ok, r) => { if (!ok) fail++; record.push({ cell: name, step: n, ok, r }); if (!JSON_OUT) console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name + ' ' + n + (ok ? '' : ' ' + JSON.stringify(r))); };
  await page.focus('#tourBtn'); await page.keyboard.press('Enter'); await page.waitForTimeout(700);
  const s0 = await rect(page); step('Enter on the Tour button: the card shows, Next focused, in view', !s0.hidden && s0.focus === 'tourNext' && s0.inView, s0);
  let s1 = null, n = 0; for (let i = 0; i < 400; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(12); n++; s1 = await rect(page); if (i > 2 && s1.inCard) break; }
  await page.waitForTimeout(300); s1 = await rect(page);
  step(`Tab round the page (${n} stops) back into the card: the card in view, the stop ringed`, s1.inCard && s1.inView && s1.fv, s1);
  // Shift+Tab out and back
  await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(50); await page.keyboard.press('Tab'); await page.waitForTimeout(300);
  const s1b = await rect(page); step('out by Shift+Tab and back by Tab: still in view', s1b.inCard && s1b.inView, s1b);
  // the steps by Enter, each in view
  await page.evaluate(() => document.getElementById('tourNext').focus());
  let steps = 0, out = 0; for (let i = 0; i < 12; i++) { if (await page.evaluate(() => document.getElementById('tourCard').hidden)) break; steps++; const r = await rect(page); if (!r.inView) out++; await page.keyboard.press('Enter'); await page.waitForTimeout(400); }
  step(`${steps} steps by Enter, every card in view, the tour ends`, out === 0 && await page.evaluate(() => document.getElementById('tourCard').hidden), { steps, out });
  await page.focus('#tourBtn'); await page.keyboard.press('Enter'); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const s4 = await rect(page); step('Escape ends the tour on its button', s4.hidden && s4.focus === 'tourBtn', s4);
  if (errors.length) step('page errors', false, errors);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
console.log(fail ? `S620 tour card back in view: ${fail} FAILED` : 'S620 tour card back in view: all steps pass');
process.exit(fail ? 1 : 0);
