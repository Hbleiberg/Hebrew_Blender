#!/usr/bin/env node
// S681 — every dotted circle in the word corpus shows the one mark its gloss is about. The ten vowel-name entries
// (dagesh, kamats, cholam, segol, tsere, kubuts, the three chatafs, chirik) illustrated their mark as "(ִ◌ָ)": a stray
// chirik (U+05B4) before every ◌, so the gloss of קָמָץ drew a chirik under its bracket beside the kamats, and the
// cholam's read "( ◌ֹ)". The corpus now reads "(◌ָ)", and its three fetchers moved ?v=8 → 9 together (the /data/ cache
// is exact-URL-keyed: without the bump the fix reaches nobody).
//
//   node scripts/loop/probes/S681-corpus-dotted-circle-carries-one-mark.mjs
//   Static: every string in data/hebrew_words.json — each ◌ has no Hebrew mark or space before it and exactly one
//   mark after it (a planted "(ִ◌ָ)" and "( ◌ֹ)" must be caught); the ten entries keep their ◌; the dictionary, the
//   generator and the flash cards fetch one ?v=, the one ops.md names. Runtime, EN light 1280 / HE dark 800: the
//   dictionary, typed "kamatz" by the real keyboard, shows קָמָץ's card with "(◌ָ)" in its gloss and no mark before the
//   ◌; its corpus request carries that ?v= (a counted route hit); the flash cards' All Dictionary deck's request too; 0 page errors.
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S681: ten bad circles, the card's gloss reads "(ִ◌ָ)").
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const isMark = c => c >= 0x0591 && c <= 0x05C7 && c !== 0x05BE && c !== 0x05C0 && c !== 0x05C3 && c !== 0x05C6;
// The dotted circles of a string that do not show exactly one mark: a mark or a space before the ◌, or not one after.
function badCircles(s) {
  const cps = [...s].map(ch => ch.codePointAt(0)), out = [];
  cps.forEach((c, i) => {
    if (c !== 0x25CC) return;
    const before = cps[i - 1], a1 = cps[i + 1], a2 = cps[i + 2];
    if ((before !== undefined && (isMark(before) || before === 0x20)) || !(a1 !== undefined && isMark(a1)) || (a2 !== undefined && isMark(a2))) out.push(i);
  });
  return out;
}
const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'));
const strings = [];
(function walk(v) { if (typeof v === 'string') strings.push(v); else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k]); })(corpus);
const circles = strings.filter(s => s.includes('◌'));
const bad = circles.filter(s => badCircles(s).length);
ok(badCircles('(ִ◌ָ)').length === 1 && badCircles('( ◌ֹ)').length === 1 && badCircles('(◌ָ)').length === 0,
  'the check catches a planted "(ִ◌ָ)" and "( ◌ֹ)" and passes "(◌ָ)"');
ok(strings.length > 50000 && circles.length === 10 && bad.length === 0,
  `${strings.length} strings in the corpus, ${circles.length} with a dotted circle, ${bad.length} drawing a stray mark${bad.length ? ': …' + bad.map(s => s.slice(s.indexOf('◌') - 3, s.indexOf('◌') + 3)).join(' …') : ''}`);
const vOf = f => { const m = /data\/hebrew_words\.json\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, f), 'utf8')); return m ? m[1] : null; };
const vs = ['hebrew_dictionary.html', 'hebrew_blend_generator.html', 'flash_cards.html'].map(vOf);
const opsV = (/hebrew_words\.json\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, 'docs/reference/ops.md'), 'utf8')) || [])[1];
ok(vs.every(v => v && v === vs[0]) && vs[0] === opsV, `the three fetchers ask for ?v=${vs.join(' / ?v=')}; ops.md names ?v=${opsV}`);

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
async function openPage(url, { lang, dark, vw }) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (sessionStorage.getItem('s681seed')) return; sessionStorage.setItem('s681seed', '1');
    for (const k of ['hebrewDictionary_tourSeen', 'hebrewFlashCards_tourSeen']) localStorage.setItem(k, '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0');
  }, { lang, dark });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  const corpusHits = [];
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/hebrew_words.json')) corpusHits.push(new URL(u).searchParams.get('v'));
    return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort();
  });
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded' });
  return { ctx, page, errors, corpusHits };
}
for (const cell of [{ lang: 'en', dark: false, vw: 1280 }, { lang: 'he', dark: true, vw: 800 }]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.vw}`;
  const { ctx, page, errors, corpusHits } = await openPage('/hebrew_dictionary.html', cell);
  await page.waitForFunction(() => document.querySelectorAll('#resultsGrid .word-card').length > 5, null, { timeout: 30000 });
  await page.click('#searchInput'); await page.keyboard.type('kamatz'); await page.waitForTimeout(800);
  const card = page.locator('#resultsGrid .word-card[data-shword="קָמָץ"]');
  const n = await card.count();
  const gloss = n ? await card.first().locator('.wc-transl').textContent() : '';
  ok(n === 1 && gloss.includes('(◌ָ)') && badCircles(gloss).length === 0,
    `${tag}: typed "kamatz", the card of קָמָץ (${n}) glosses "${gloss.slice(gloss.indexOf('◌') - 2, gloss.indexOf('◌') + 3)}" — one kamats on its circle`);
  ok(corpusHits.length >= 1 && corpusHits.every(v => v === vs[0]) && errors.length === 0,
    `${tag}: the dictionary asked for the corpus with ?v=${corpusHits.join(', ?v=')}; ${errors.length} page errors`);
  await ctx.close();
}
{
  const { ctx, page, errors, corpusHits } = await openPage('/flash_cards.html', { lang: 'en', dark: false, vw: 1280 });
  await page.waitForLoadState('load');
  // the All Dictionary deck, by real clicks (the deck fetches the corpus on demand)
  await page.click('#otherModePill'); await page.click('#otherSubPills .pill[data-sub="words"]'); await page.click('#wordsSourcePills .pill[data-wsource="alldict"]');
  await page.waitForTimeout(1500);
  ok(corpusHits.length >= 1 && corpusHits.every(v => v === vs[0]) && errors.length === 0,
    `flash cards: asked for the corpus with ?v=${corpusHits.join(', ?v=') || '(none)'}; ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
