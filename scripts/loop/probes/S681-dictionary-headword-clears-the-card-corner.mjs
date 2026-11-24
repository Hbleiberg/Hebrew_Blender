#!/usr/bin/env node
// S681 — a word card's headword never runs beneath the card's corner controls. The copy / Google / Hear trio floats
// over the card's top-left corner and Bulk Copy Mode's select box over its top-right, the headword's first line between
// them: a long word ran under the trio (742 of the 13,081 cards at 1366px, 1,764 with Hear on) and the box sat on
// every word's first letter. A float at each corner, the size of the control's reach, now shortens that first line —
// a phrase wraps clear, a single word too long to sit beside them starts below — on screen only (paper hides them).
//
//   node scripts/loop/probes/S681-dictionary-headword-clears-the-card-corner.mjs
//   EN light 1366 / HE dark 800 / EN light 390 (the phone bar's Filters button first): Word Length → All Words off → 7-Letter and 8+ Letter by real clicks, every
//   page of cards rendered, then by real clicks Advanced → Audio → Show pronunciation button, then Copy Options → Bulk
//   Copy Mode. In each of the three states: every card has its visible controls (a handle check), and 0 headwords have a
//   text box crossing a visible control. A planted rule that drops the corner floats must bring the collisions back.
//   On paper (print media) the floats are gone. 0 page errors. exit 1 when a step fails or a handle is missing.
//   ROOT=<a git archive of the tree> runs another copy (the tree before S681: hundreds under the trio, every word
//   under the box).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
// Cards whose headword text box crosses a visible corner control, and cards missing a control they should show.
const census = () => {
  const vis = el => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0;
  const wantSpeak = document.body.classList.contains('dict-audio-on'), wantBox = document.body.classList.contains('bulk-mode');
  const r = { cards: 0, under: 0, missing: 0, ex: [] };
  for (const c of document.querySelectorAll('#resultsGrid .word-card')) {
    r.cards++;
    const ctl = ['.wc-copy', '.wc-search', '.wc-speak', '.wc-bulk-cb'].map(s => c.querySelector(s));
    if (!vis(ctl[0]) || !vis(ctl[1]) || vis(ctl[2]) !== wantSpeak || vis(ctl[3]) !== wantBox) r.missing++;
    const h = c.querySelector('.wc-heb'); const rg = document.createRange(); rg.selectNodeContents(h);
    const rects = [...rg.getClientRects()].filter(t => t.width > 0);
    const hit = ctl.filter(vis).some(el => { const i = el.getBoundingClientRect(); return rects.some(t => t.left < i.right - 1 && t.right > i.left + 1 && t.top < i.bottom - 1 && t.bottom > i.top + 1); });
    if (hit) { r.under++; if (r.ex.length < 3) r.ex.push(c.dataset.shword); }
  }
  return r;
};
for (const cell of [{ lang: 'en', dark: false, vw: 1366 }, { lang: 'he', dark: true, vw: 800 }, { lang: 'en', dark: false, vw: 390 }]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.vw}`;
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (sessionStorage.getItem('s681seed')) return; sessionStorage.setItem('s681seed', '1');
    localStorage.setItem('hebrewDictionary_tourSeen', '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0');
  }, cell);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/hebrew_dictionary.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#resultsGrid .word-card').length > 5, null, { timeout: 30000 });
  // On a phone the filters live behind the bar's Filters button.
  const filtersBtn = page.locator('#mobileFiltersBtn');
  if (await filtersBtn.isVisible()) { await filtersBtn.click(); await page.waitForTimeout(300); }
  const clickIn = async sel => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded(); await l.click(); await page.waitForTimeout(200); };
  await clickIn('#lenAllCb'); await clickIn('.lcb[value="7"]'); await clickIn('.lcb[value="8plus"]');
  const renderAll = () => page.evaluate(() => { for (let i = 0; i < 100 && shown < filtered.length; i++) loadMore(); return document.querySelectorAll('#resultsGrid .word-card').length; });
  const n = await renderAll();
  // A panel or section is opened only while it is collapsed (a phone opens them expanded; a click would close it).
  const expand = async (box, title) => { if (await page.locator(box).first().evaluate(e => e.classList.contains('collapsed'))) await clickIn(title); };
  await expand('#panelAdvanced', '#panelAdvanced > .panel-title');
  const states = [];
  states.push(['plain', await page.evaluate(census)]);
  await expand('#panelAdvanced .adv-section:has(#dictAudioToggle)', '#panelAdvanced .adv-section:has(#dictAudioToggle) > .adv-section-title'); await clickIn('#dictAudioToggle');
  states.push(['Hear on', await page.evaluate(census)]);
  await expand('#copyOptsSec', '#copyOptsSec > .adv-section-title'); await clickIn('#bulkModeCb'); await renderAll();
  states.push(['Hear + Bulk', await page.evaluate(census)]);
  for (const [name, r] of states)
    ok(n > 1500 && r.cards === n && r.missing === 0 && r.under === 0,
      `${tag} ${name}: ${r.cards} / ${n} cards of 7+ letters, ${r.missing} missing a control, ${r.under} with the headword under a control${r.ex.length ? ': ' + r.ex.join(' | ') : ''}`);
  // The plant: drop the corner floats — the census must find the collisions again (the detector is not blind).
  await page.addStyleTag({ content: '.wc-heb::before,.wc-heb>span::before{display:none!important}' });
  const planted = await page.evaluate(census);
  ok(planted.under > 100, `${tag} plant (the floats dropped): ${planted.under} headwords under a control`);
  await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('display:none!important') && s.textContent.startsWith('.wc-heb::before')) s.remove(); }));
  await page.emulateMedia({ media: 'print' });
  const onPaper = await page.evaluate(() => { const h = document.querySelector('#resultsGrid .word-card .wc-heb'); return [getComputedStyle(h, '::before').float, getComputedStyle(h.firstElementChild, '::before').float]; });
  ok(onPaper.every(f => f === 'none'), `${tag} on paper: the corner floats are ${onPaper.join(' / ')}`);
  ok(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
