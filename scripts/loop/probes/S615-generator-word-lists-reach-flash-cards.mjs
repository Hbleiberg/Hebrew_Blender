#!/usr/bin/env node
// S615 — the generator's "Practice these in Flash Cards" on a Real Words worksheet drawn from My Word Lists hands Flash
// Cards those lists, not the letter grid. It used to send the selected letters and vowels whatever the worksheet was, so
// a teacher on a Food list got two-letter blends of the whole alef-bet; its title said "these letters and vowels" too.
// Now, in that source, the link carries a Words drill over the ticked lists (by id, read from the device's shared store),
// the title names the word lists, and with no list ticked the button says so instead of opening a window.
//
//   node scripts/loop/probes/S615-generator-word-lists-reach-flash-cards.mjs
//   exit 1 when, in EN or HE: the title in My Word Lists still names letters; a press with no list ticked opens a window;
//   or a press with two lists ticked does not open Flash Cards on a card from one of them (or the letters hand-off, on a
//   blends worksheet, stops sending letters). ROOT=<a git archive of the tree> runs another copy (the tree before S615
//   fails the first three); --json prints the record.
//
// Serves ROOT in-process (every other foreign origin aborted, service workers blocked).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const FOOD = [['לֶחֶם', 'bread'], ['תַּפּוּחַ', 'apple'], ['חָלָב', 'milk'], ['בֵּיצָה', 'egg'], ['גְּבִינָה', 'cheese']].map(([word, translation]) => ({ word, translation, translit: '' }));
const COLORS = [['אָדֹם', 'red'], ['כָּחֹל', 'blue'], ['יָרֹק', 'green']].map(([word, translation]) => ({ word, translation, translit: '' }));
const WL = { v: 1, lists: { wl_food: { name: 'Food', words: FOOD }, wl_col: { name: 'Colors', words: COLORS } } };
const WORDS = [...FOOD, ...COLORS].map(w => w.word);
const decode = u => { try { return JSON.parse(Buffer.from(new URL(u).searchParams.get('s').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')); } catch (e) { return null; } };
const browser = await chromium.launch();
const records = [];
for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = []; const pops = [];
  ctx.on('page', p => pops.push(p));
  page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, wl]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_tourSeen', '1'); localStorage.setItem('hebrewFlashCards_tourSeen', '1');
    localStorage.setItem('ivritSuite_wordLists', JSON.stringify(wl)); }, [lang, WL]);
  const rec = { lang, ok: false };
  const wait = async n => { for (let i = 0; i < 30 && pops.length < n; i++) await page.waitForTimeout(100); };
  try {
    await page.goto(`${BASE}/hebrew_blend_generator.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready); await page.waitForLoadState('load'); await page.waitForTimeout(800);
    await page.evaluate(() => { document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); });
    const btn = page.locator('#fcHandoffBtn');
    // the letters hand-off on a blends worksheet (unchanged)
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await wait(1);
    const p0 = pops[0] ? decode(pops[0].url()) : null; rec.letters = !!(p0 && Array.isArray(p0.selectedLetters) && p0.selectedLetters.length && !p0.wordsSource);
    for (const x of pops.splice(0)) await x.close();
    const t0 = await btn.getAttribute('title');
    await page.locator('.blend-type-btn[data-type="realwords"]').click(); await page.waitForTimeout(300);
    await page.locator('[data-rwsrc="lists"]').click(); await page.waitForTimeout(300);
    const t1 = await btn.getAttribute('title');
    rec.title = t1 !== t0 && (lang === 'en' ? /word lists/.test(t1) : /רשימות המילים/.test(t1));
    await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(800);
    rec.noneTicked = { windows: pops.length, note: (await page.locator('#shareNotice').textContent()).trim().slice(0, 60) };
    for (const x of pops.splice(0)) await x.close();
    for (const n of ['Food', 'Colors']) await page.locator('#rwListPicker label', { hasText: n }).locator('input').check();
    await page.waitForTimeout(300);
    await btn.click(); await wait(1);
    if (pops[0]) {
      const fc = pops[0]; await fc.waitForLoadState('load'); await fc.waitForTimeout(1500);
      const p1 = decode(fc.url());
      rec.payload = p1;
      rec.card = await fc.evaluate(() => ({ screen: document.querySelector('.screen.active')?.id, text: (document.getElementById('fcFrontHeb')?.textContent || '').trim() }));
    }
    const ids = rec.payload && Array.isArray(rec.payload.selectedWordListIds) ? [...rec.payload.selectedWordListIds].sort().join(',') : '';
    rec.ok = rec.letters && rec.title && rec.noneTicked.windows === 0 && rec.noneTicked.note.length > 0
      && ids === 'wl_col,wl_food' && rec.card && rec.card.screen === 'screenCard' && WORDS.some(w => rec.card.text.includes(w));
  } catch (e) { rec.error = String(e).slice(0, 160); }
  rec.pageErrors = errors.length; if (errors.length) rec.ok = false;
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.lang}${r.ok ? ` (card ${r.card.text})` : ' ' + JSON.stringify(r).slice(0, 400)}`);
process.exit(records.every(r => r.ok) ? 0 : 1);
