#!/usr/bin/env node
// S674 — the Tefillah Trainer's fullscreen in the Hebrew interface. The Exit fullscreen button is pinned to the physical
// top right (the suite's place for it), which is where a right-to-left page's first row starts: the prayer's name began
// under the button (70px of it), and on the Shema the "Open in Torah Trainer" row above the name did. In the Hebrew
// interface the fullscreen page now starts below the button; left to right, the one row that can reach the button (the
// Shema's four Torah links at 800px, in a fallback font) wraps before it.
//
//   node scripts/loop/probes/S674-tefillah-fullscreen-first-row-clears-exit.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S674 fails the six Hebrew cells).
//
// EN/HE × 800 / 1024 / 1366 wide × a prayer with and without Torah links, fullscreen entered by a click on the header's
// button: no text of the page under the button. English: the page still starts 30px down (nothing moved there).
// Windowed (both languages): the page's top padding is what it is in English fullscreen-off, i.e. untouched by the rule.
// Sefaria is stubbed with ordinary vocabulary words from data/hebrew_words.json (never liturgical text).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 40);
const LINES = [WORDS.slice(0, 22).join(' '), WORDS.slice(22, 28).join(' '), WORDS.slice(28, 40).join(' ')];
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [
    { key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } },
    { key: 'beta', nameKey: '', en: 'Fixture beta', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Beta', torah: ['Deuteronomy 6:4', 'Deuteronomy 6:5-9', 'Deuteronomy 11:13-21', 'Numbers 15:37-41'] } },
  ] };
const ANSWER = { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: LINES }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] };

const browser = await chromium.launch(); const records = [];
for (const lang of ['en', 'he']) for (const width of [800, 1024, 1366]) for (const prayer of ['alpha', 'beta']) {
  const ctx = await browser.newContext({ viewport: { width, height: 768 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); } }, { lang });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ANSWER) });
    return r.abort();
  });
  const rec = { cell: `${lang} ${width} ${prayer}`, lang, note: '', hits: [] };
  try {
    await page.goto(`${BASE}/tefillah_trainer.html?prayer=${prayer}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ttReading [data-vk] .tt-word', { timeout: 20000 }); await page.waitForTimeout(500);
    rec.rtl = await page.evaluate(() => document.documentElement.dir === 'rtl');
    rec.links = await page.evaluate(() => document.querySelectorAll('#ttTorahLinks:not([hidden]) a').length);
    rec.padWindowed = await page.evaluate(() => getComputedStyle(document.querySelector('.tt-page')).paddingTop);
    await page.click('#fsBtn'); await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const btn = document.getElementById('fsExitBtn'), b = btn.getBoundingClientRect(), hits = [];
      const w = document.createTreeWalker(document.querySelector('.tt-page'), NodeFilter.SHOW_TEXT); let t, texts = 0;
      while ((t = w.nextNode())) {
        if (!t.nodeValue.trim() || !t.parentElement.getClientRects().length || getComputedStyle(t.parentElement).visibility === 'hidden') continue;
        texts++;
        const r = document.createRange(); r.selectNodeContents(t);
        for (const q of r.getClientRects()) {
          const ox = Math.min(q.right, b.right) - Math.max(q.left, b.left), oy = Math.min(q.bottom, b.bottom) - Math.max(q.top, b.top);
          if (q.width >= 1 && ox > 1 && oy > 1) hits.push(`${t.nodeValue.trim().slice(0, 20)} ${Math.round(ox)}x${Math.round(oy)}`);
        }
      }
      return { fullscreen: document.body.classList.contains('fullscreen'), shown: b.width > 20 && getComputedStyle(btn).display !== 'none', btnBottom: Math.round(b.bottom), texts, hits, pad: getComputedStyle(document.querySelector('.tt-page')).paddingTop };
    });
    Object.assign(rec, m);
  } catch (e) { rec.note = String(e.message).split('\n')[0].slice(0, 160); }
  rec.errors = errors.length;
  rec.ok = !rec.note && !rec.errors && rec.fullscreen && rec.shown && rec.texts > 10 && !rec.hits.length && rec.rtl === (lang === 'he')
    && rec.links === (prayer === 'beta' ? 4 : 0) && (lang === 'he' || rec.pad === '30px');
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const pads = new Set(records.map(r => r.padWindowed));
const windowedSame = pads.size === 1;   // the rule is fullscreen's only: windowed, both languages keep one top padding
const bad = records.filter(r => !r.ok);
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(16)} fullscreen ${r.fullscreen ? 'on' : 'OFF'}, button ends ${r.btnBottom}px, page starts ${r.pad}, Torah links ${r.links}, texts ${r.texts}, under the button ${r.hits.length}${r.hits.length ? ' (' + r.hits[0] + ')' : ''}${r.note ? ' — ' + r.note : ''} errors ${r.errors}`);
console.log(`windowed top padding ${[...pads].join(' / ')} ${windowedSame ? 'ok' : 'FAIL'}`);
console.log(`${records.length - bad.length + (windowedSame ? 1 : 0)} / ${records.length + 1}`);
process.exit(bad.length || !windowedSame ? 1 : 0);
