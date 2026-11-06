#!/usr/bin/env node
// S621 — a Hebrew search matches inside one word of a phrase, or a run of its words, never across a word gap (the
// S585 P4; gate 2 answered "within one word only"): "כלב" finds כֶּלֶב and כֶּלֶב יָם and no longer the saying whose
// letters run …כֵּל בַּ…; "כלב ים" (two words) finds כֶּלֶב יָם; a query with the gap typed in ("כל ב") still reaches the
// saying (the control), and an English search is untouched.
//
//   node scripts/loop/probes/S621-dictionary-hebrew-search-within-a-word.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S621 fails steps 1–3: the saying is listed under "כלב", and neither "כלב ים" nor "כל ב" finds anything); --json prints the record.
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
const SAYING = 'אַל תִּסְתַּכֵּל בַּ קַּנְקַן', DOG = 'כֶּלֶב', SEADOG = 'כֶּלֶב יָם';
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 13000 && typeof filtered !== 'undefined', null, { timeout: 60000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  // the state after a real search: the matched words (first 400), the count readout, whether a saying is in
  const st = async () => page.evaluate(([SAYING, DOG, SEADOG]) => {
    const words = filtered.map(w => w.word);
    return { n: words.length, first: words[0] || null, dog: words.includes(DOG), seadog: words.includes(SEADOG), saying: words.includes(SAYING),
      count: (document.getElementById('resultCount').textContent || '').trim(), q: document.getElementById('searchInput').value, cards: document.querySelectorAll('#resultsGrid .word-card').length };
  }, [SAYING, DOG, SEADOG]);
  const type = async q => { await page.fill('#searchInput', ''); await page.fill('#searchInput', q); await page.waitForTimeout(600); };
  const step = async (name, fn, check) => { if (fn) await fn(); const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify(r)}`); return r; };
  await step('1 "כלב": the dog first, כֶּלֶב יָם in, the saying out', () => type('כלב'), r => r.n > 0 && r.first === DOG && r.seadog && !r.saying && r.cards > 0);
  await step('2 "כלב ים": a two-word query finds the phrase', () => type('כלב ים'), r => r.n >= 1 && r.seadog && !r.saying);
  await step('3 control: "כל ב" (the gap typed) still reaches the saying', () => type('כל ב'), r => r.saying);
  await step('4 control: "dog" in English finds the dog as before', () => type('dog'), r => r.n > 5 && r.dog && r.first === DOG);
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
