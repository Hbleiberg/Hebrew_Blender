#!/usr/bin/env node
// S629 — no word in the Hebrew word corpus carries two vowel points on one letter (gate 2, approved). S544's content
// audit found one: `טִיֵַּח` "to plaster" (translit tiyéakh) stacked a tsere and a patach (with the dagesh) on its yod;
// the patach is the het's furtive patach, so the entry is now `טִיֵּחַ`. A corpus edit is reached only through a new
// `?v=` on every page that fetches it (the /data/ cache is exact-URL-keyed), so the three fetchers moved 7 → 8 together.
//
//   node scripts/loop/probes/S629-corpus-one-vowel-per-letter.mjs
//   Static: every Hebrew string in data/hebrew_words.json, split into letters (a base letter and the marks after it):
//   0 letters carry two vowel points (U+05B0–U+05BB, U+05C7) — a planted stacked copy of a real word must be caught;
//   the entry reads טִיֵּחַ, NFC; the dictionary, the generator and the flash cards fetch the corpus with one and the
//   same ?v=, the one ops.md names. Runtime, EN light 1280 / HE dark 800: the dictionary, typed "plaster" by the real
//   keyboard, shows טִיֵּחַ on its card, its corpus request carries that ?v= (a counted route hit), 0 page errors.
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S629: the stacked word is found, the entry and the card read טִיֵַּח).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const RIGHT = 'טִיֵּחַ', STACKED = 'טִיֵַּח';
const isVowel = c => (c >= 0x05B0 && c <= 0x05BB) || c === 0x05C7;
const isLetter = c => c >= 0x05D0 && c <= 0x05EA;
// The letters of a string that carry more than one vowel point.
function stacked(s) {
  const out = []; let vowels = 0, start = -1;
  const cps = [...s];
  cps.forEach((ch, i) => {
    const c = ch.codePointAt(0);
    if (isLetter(c)) { if (vowels > 1) out.push(start); vowels = 0; start = i; }
    else if (isVowel(c) && start >= 0) vowels++;
    else if (!(c >= 0x0591 && c <= 0x05C7)) { if (vowels > 1) out.push(start); vowels = 0; start = -1; }
  });
  if (vowels > 1) out.push(start);
  return out;
}
const corpus = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'));
const strings = [];
(function walk(v) { if (typeof v === 'string') { if (/[א-ת]/.test(v)) strings.push(v); } else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k]); })(corpus);
const hits = strings.filter(s => stacked(s).length);
ok(stacked(STACKED).length === 1 && stacked(RIGHT).length === 0 && stacked('שָׁלוֹם').length === 0, `the check finds a planted stacked word (${stacked(STACKED).length}) and passes the fixed one and שָׁלוֹם`);
ok(strings.length > 10000 && hits.length === 0, `${strings.length} Hebrew strings in the corpus, ${hits.length} with two vowels on one letter${hits.length ? ': ' + hits.slice(0, 5).join(' ') : ''}`);
const entry = JSON.stringify(corpus).includes(RIGHT), entryOld = JSON.stringify(corpus).includes(STACKED);
ok(entry && !entryOld && RIGHT.normalize('NFC') === RIGHT, `"to plaster" reads טִיֵּחַ (${entry}), the stacked form gone (${!entryOld}), NFC`);
const vOf = f => { const m = /data\/hebrew_words\.json\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, f), 'utf8')); return m ? m[1] : null; };
const vs = ['hebrew_dictionary.html', 'hebrew_blend_generator.html', 'flash_cards.html'].map(vOf);
const opsV = (/hebrew_words\.json\?v=(\d+)/.exec(fs.readFileSync(path.join(ROOT, 'docs/reference/ops.md'), 'utf8')) || [])[1];
ok(vs.every(v => v && v === vs[0]) && vs[0] === opsV, `the three fetchers ask for ?v=${vs.join(' / ?v=')}; ops.md names ?v=${opsV}`);

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  try {
    const asked = [];
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.includes('/data/hebrew_words.json')) asked.push(new URL(u).search); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
    await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
    const page = await ctx.newPage(); page.setDefaultTimeout(30000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('.word-card').length > 0, null, { timeout: 60000 });
    await page.evaluate(() => window.I18n.ready);
    await page.click('#searchInput'); await page.keyboard.type('plaster', { delay: 30 });
    await page.waitForTimeout(1200);
    const words = await page.evaluate(() => [...document.querySelectorAll('.word-card')].slice(0, 30).map(c => c.textContent));
    const shown = words.some(t => t.includes('טִיֵּחַ')), shownOld = words.some(t => t.includes('טִיֵַּח'));
    ok(shown && !shownOld && asked.length > 0 && asked.every(q => q === '?v=' + vs[0]) && errors.length === 0,
      `${L}: "plaster" → ${words.length} cards, טִיֵּחַ shown ${shown}, the stacked form ${shownOld}; corpus asked as ${[...new Set(asked)].join(',') || 'never'}; ${errors.length} errors`);
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: one vowel per letter across the corpus; "to plaster" reads טִיֵּחַ everywhere');
process.exit(fail ? 1 : 0);
