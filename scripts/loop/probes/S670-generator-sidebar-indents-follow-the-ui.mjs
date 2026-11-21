#!/usr/bin/env node
// S670 (the S660 M P4 that 0d70a64c left) — the generator's sidebar indents four option rows under their switch with
// physical CSS: Self-Check's options (padding-left and a 2px border-left rule), its timer's Duration row, and Number
// Practice's transliteration-page and Bingo rows. In the Hebrew UI the sidebar runs right to left, so the indent and
// the rule stood at the far left, away from the switches they belong to (CLAUDE.md i18n rule 5: logical CSS only).
// They are now padding-inline-start / border-inline-start.
//   1280 and 800 × EN / HE × light / dark: each row shown by real clicks on its switch; its indent and rule sit on the
//   UI's start side (left in English, right in Hebrew), and the Self-Check rule is within 24px of its options' text
//   edge on that side, never across the sidebar.
//
//   node scripts/loop/probes/S670-generator-sidebar-indents-follow-the-ui.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S670 fails every Hebrew cell)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
// a hidden checkbox inside a .toggle is switched by clicking its visible slider
const flip = async (page, id) => { const s = page.locator(`#${id} + .slider`); await s.scrollIntoViewIfNeeded(); await s.click(); await page.waitForTimeout(120); };
async function rowSides(page, id) {
  return page.evaluate(id => {
    const e = document.getElementById(id), cs = getComputedStyle(e), rtl = getComputedStyle(e).direction === 'rtl';
    const r = e.getBoundingClientRect(), kid = e.firstElementChild.getBoundingClientRect();
    return { shown: e.offsetParent !== null, rtl, pl: parseFloat(cs.paddingLeft), pr: parseFloat(cs.paddingRight), bl: parseFloat(cs.borderLeftWidth), br: parseFloat(cs.borderRightWidth),
      gapStart: Math.round(rtl ? r.right - kid.right : kid.left - r.left) };
  }, id);
}
async function load(w, lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/hebrew_blend_generator.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && typeof window.getSettings === 'function', null, { timeout: 20000 });
  await page.evaluate(() => I18n.ready);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  await page.waitForTimeout(300);
  return { ctx, page, errs };
}
for (const w of [1280, 800]) for (const lang of ['en', 'he']) for (const dark of [false, true]) {
  const tag = `${w} ${lang} ${dark ? 'dark' : 'light'}`;
  let { ctx, page, errs } = await load(w, lang, dark);
  const want = lang === 'he' ? 'right' : 'left';
  const check = (id, s, indent, rule) => {
    const startPad = want === 'left' ? s.pl : s.pr, endPad = want === 'left' ? s.pr : s.pl, startB = want === 'left' ? s.bl : s.br, endB = want === 'left' ? s.br : s.bl;
    const ok = s.shown && s.rtl === (lang === 'he') && startPad === indent && endPad === 0 && startB === rule && endB === 0;
    report(ok, `${tag} #${id}: indent ${startPad}px on the ${want}, ${endPad}px on the other side; rule ${startB} / ${endB}px${s.shown ? '' : ' (NOT SHOWN)'}`);
  };
  // Self-Check (a blends worksheet's output option), then its timer
  if (await page.evaluate(() => !document.getElementById('selfCheckToggle').checked)) await flip(page, 'selfCheckToggle');
  const sc = await rowSides(page, 'selfCheckOptions');
  check('selfCheckOptions', sc, 16, 2);
  report(sc.gapStart >= 16 && sc.gapStart <= 24, `${tag} #selfCheckOptions: its text starts ${sc.gapStart}px in from the rule's side`);
  await flip(page, 'timerToggle');
  check('timerDurationRow', await rowSides(page, 'timerDurationRow'), 8, 0);
  report(!errs.length, `${tag} page errors ${errs.length} ${errs.join(' | ')}`);
  await ctx.close();
  // Number Practice, on a fresh page (Self-Check on hides the practice types): its transliteration-page row and its
  // Bingo options — a teacher's path: the Real Words practice type, then its Number Practice drill
  ({ ctx, page, errs } = await load(w, lang, dark));
  const rw = page.locator('.blend-type-btn[data-type="realwords"]'); await rw.scrollIntoViewIfNeeded(); await rw.click(); await page.waitForTimeout(300);
  const np = page.locator('.rw-drill-btn[data-drill="numpractice"]'); await np.scrollIntoViewIfNeeded(); await np.click(); await page.waitForTimeout(300);
  await flip(page, 'npShowTranslit');
  check('npTranslitPageRow', await rowSides(page, 'npTranslitPageRow'), 16, 0);
  await flip(page, 'npBingo');
  check('npBingoOptions', await rowSides(page, 'npBingoOptions'), 16, 0);
  report(!errs.length, `${tag} page errors ${errs.length} ${errs.join(' | ')}`);
  await ctx.close();
}
console.log(`\n${cells - fails}/${cells} pass`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
