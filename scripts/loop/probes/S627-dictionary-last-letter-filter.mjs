#!/usr/bin/env node
// S627 — the dictionary's Filter by Letter has a "Last Letter" row (micro-feature, gate 1; the seed "A 'Last letter' row in
// Filter by Letter"). The rows counted from the start (1st to 6th), so "words ending in ה or ת" — a silent final ה, a
// feminine ending — could not be asked.
//
//   node scripts/loop/probes/S627-dictionary-last-letter-filter.mjs
//   EN light 1280 / HE dark 800, a fresh profile, every press a real click: the row's heading ("Last Letter" / "אות
//   אחרונה") under the 6th; ה ticked → the results are the words whose spelling ends in ה, counted afresh from each word's
//   own Hebrew (not from the page's letter list); ה + ת → either; with מ as the 1st letter → both rows hold; the chip
//   names it and its ✕ clears it; Copy link → a fresh page opens on the same words with the row's tiles pressed; a reload
//   keeps it; a link made before the row (six positions) still opens, the last row empty; the print header names it;
//   Reset all clears it. exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another
//   copy (the tree before S627 has no such row: 2 failures, one a cell, at its first read).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
async function ctxFor(cell) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  return ctx;
}
async function load(ctx, url, errors) {
  const page = await ctx.newPage(); page.setDefaultTimeout(30000); page.on('pageerror', e => errors.push(String(e)));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 10000 && document.getElementById('pg0'));
  await page.evaluate(() => I18n.ready); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach(o => o.classList.remove('open')));
  return page;
}
// the current results, and the words each rule should give, read from each word's own Hebrew spelling
const read = page => page.evaluate(() => {
  const ends = w => { const l = String(w.word || '').replace(/[֑-ׇ]/g, '').match(/[א-ת]/g) || []; return { first: l[0] || '', last: l[l.length - 1] || '' }; };
  return { n: filtered.length, words: filtered.map(w => w.word), endsOf: filtered.map(w => ends(w)) };
});
const tile = (page, row, h) => page.click(`#pg${row} .lpt[data-h="${h}"]`);
const pressed = (page, row) => page.evaluate(row => [...document.querySelectorAll(`#pg${row} .lpt.selected`)].map(t => t.dataset.h + ':' + t.getAttribute('aria-pressed')), row);
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    const errors = [], ctx = await ctxFor(cell);
    const page = await load(ctx, base + '/hebrew_dictionary.html', errors);
    const all = await read(page);
    const want = cell.lang === 'he' ? 'אות אחרונה' : 'Last Letter';
    const head = await page.evaluate(() => { const l = document.getElementById('pl6'), secs = [...document.querySelectorAll('#posFilterBody .pos-sec')]; return l ? { text: l.textContent.trim(), at: secs.indexOf(l.closest('.pos-sec')), prev: (document.getElementById('pl5') || {}).textContent } : null; });
    if (!head) { ok(false, `${L}: no Last Letter row (#pl6 missing)`); await ctx.close(); continue; }
    ok(head.text === want && head.at === 6, `${L}: the 7th row reads "${head.text}" (want "${want}"), after "${head.prev}"`);
    // open the panel and the row by real clicks
    if (await page.evaluate(() => document.getElementById('panelLetter').classList.contains('collapsed'))) await page.click('#panelLetter .panel-title');
    await page.click('#pl6');
    await tile(page, 6, 'ה'); await page.waitForTimeout(300);
    let r = await read(page);
    const wantHe = all.words.filter((w, j) => all.endsOf[j].last === 'ה').length;
    ok(r.n > 1000 && r.n === wantHe && r.endsOf.every(e => e.last === 'ה'), `${L}: ה ticked → ${r.n} words, every one ending in ה (${wantHe} of the ${all.n} end so)`);
    await tile(page, 6, 'ת'); await page.waitForTimeout(300);
    r = await read(page);
    const wantHT = all.words.filter((w, j) => ['ה', 'ת'].includes(all.endsOf[j].last)).length;
    ok(r.n === wantHT && r.endsOf.every(e => e.last === 'ה' || e.last === 'ת'), `${L}: ה + ת → ${r.n} words ending in either (${wantHT})`);
    await page.click('#pl0'); await tile(page, 0, 'מ'); await page.waitForTimeout(300);
    r = await read(page);
    const wantAnd = all.words.filter((w, j) => all.endsOf[j].first === 'מ' && ['ה', 'ת'].includes(all.endsOf[j].last)).length;
    ok(r.n === wantAnd && r.n > 50 && r.endsOf.every(e => e.first === 'מ'), `${L}: + 1st letter מ → ${r.n} words, both rows held (${wantAnd})`);
    const chips = await page.evaluate(() => document.getElementById('filterChips').textContent);
    const chipWant = cell.lang === 'he' ? 'אות אחרונה: ה ת' : 'Last letter: ה ת';
    ok(chips.includes(chipWant), `${L}: the chip reads "${chipWant}"`);
    // Copy link → a fresh page on the same words
    await page.click('#dictShareBtn'); await page.waitForTimeout(400);
    const url = page.url();
    const errors2 = [], ctx2 = await ctxFor(cell);
    const p2 = await load(ctx2, url, errors2);
    const r2 = await read(p2);
    ok(/\?s=/.test(url) && r2.n === r.n && r2.words.join() === r.words.join() && (await pressed(p2, 6)).join() === 'ה:true,ת:true', `${L}: the copied link opens on the same ${r2.n} words, the row's ה ת pressed`);
    // a link from before the row: six positions
    const old = await p2.evaluate(() => location.origin + location.pathname + '?s=' + _dictB64Encode(JSON.stringify({ posLetters: [['מ'], [], [], [], [], []] })));
    const p3 = await load(ctx2, old, errors2);
    const r3 = await read(p3);
    const wantOld = all.words.filter((w, j) => all.endsOf[j].first === 'מ').length;
    ok(r3.n === wantOld && (await pressed(p3, 6)).length === 0 && (await pressed(p3, 0)).join() === 'מ:true', `${L}: a six-position link still opens (${r3.n} words from מ; the last row empty)`);
    await ctx2.close();
    // a reload keeps it
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 10000 && document.getElementById('pg6')); await page.waitForTimeout(600);
    r = await read(page);
    ok(r.n === wantAnd && (await pressed(page, 6)).join() === 'ה:true,ת:true', `${L}: a reload keeps the last row (${r.n} words)`);
    // the print header names it
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint'))); await page.waitForTimeout(150);
    const hdr = await page.evaluate(() => document.body.innerText.includes(I18n.t('dictionary.filters.pos_letter_heading', { ordinal: I18n.t('dictionary.ordinal_last') })));
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    ok(hdr, `${L}: the print header names the last-letter rule`);
    // the chip's ✕ clears the row alone; then Reset all
    await page.click('#filterChips [data-reset="pos6"]'); await page.waitForTimeout(300);
    r = await read(page);
    ok(r.n === wantOld && (await pressed(page, 6)).length === 0 && (await pressed(page, 0)).join() === 'מ:true', `${L}: the chip's ✕ clears the last row alone (${r.n} words from מ)`);
    if (!(await page.evaluate(() => document.getElementById('pl6').closest('.pos-sec').classList.contains('open')))) await page.click('#pl6');   // a reload folds the rows
    await tile(page, 6, 'ה'); await page.waitForTimeout(200);
    await page.click('#filterChips [data-chip="resetAll"]'); await page.waitForTimeout(300);
    r = await read(page);
    ok(r.n === all.n && (await pressed(page, 6)).length === 0, `${L}: Reset all → all ${r.n} words`);
    ok(errors.length === 0 && errors2.length === 0, `${L}: 0 page errors ${errors.concat(errors2).join(' | ')}`);
    await ctx.close();
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the Last Letter row filters, shares, restores and clears in every cell');
process.exit(fail ? 1 : 0);
