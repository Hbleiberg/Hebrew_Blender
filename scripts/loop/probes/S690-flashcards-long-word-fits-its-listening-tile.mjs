#!/usr/bin/env node
// S690 — a listening round's long word fits its tile. A few dictionary words (12–15 letters: אֶפִּיסְטֵמוֹלוֹגְיָה,
// דֶּנְדְּרוֹכְּרוֹנוֹלוֹגְיָה) are wider than a two-column tile at its 3rem and ran past the tile's edge; lcFitWords() now
// sets such a word just small enough to fit and leaves every other word at the tile's size.
//
//   node scripts/loop/probes/S690-flashcards-long-word-fits-its-listening-tile.mjs   (ROOT=<tree> runs another copy)
//   375 / 560 / 800 / 1280 widths × EN light / HE dark: Listening on by a real click on its switch and Start Practicing by its button, then a card for each
//   of 3 long words whose four choices are those three and a short word (probe-only state: sampleChoices stubbed), and
//   a card for the short word with the page's own choices. Every word's ink box
//   must lie inside its tile, and every tile inside the answer grid's box; the short card's words keep the tile's computed size (the control: a fit
//   that shrank everything would pass the first check). Exit 1 otherwise, on a missing handle or a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const LONG = ['אֶפִּיסְטֵמוֹלוֹגְיָה', 'דֶּנְדְּרוֹכְּרוֹנוֹלוֹגְיָה', 'הֶטְרוֹסֶקְסוּאָלִיּוּת'], SHORT = 'שָׁלוֹם';
let fail = 0;
for (const w of [375, 560, 800, 1280]) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); }, lang);
  await ctx.addInitScript(() => { if (!window.speechSynthesis) window.speechSynthesis = { speak() {}, cancel() {}, getVoices: () => [] }; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/flash_cards.html`, { waitUntil: 'load' }); await page.waitForTimeout(1800);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  const tag = `${String(w).padStart(4)} ${lang} ${dark ? 'dark ' : 'light'}`;
  const sw = await page.$('label.switch:has(#listeningToggle)');
  if (!sw || typeof (await page.evaluate(() => typeof renderListeningCard)) !== 'string') { console.log('FAIL', tag, 'no switch'); fail++; await ctx.close(); continue; }
  await sw.scrollIntoViewIfNeeded().catch(() => {}); await sw.click().catch(() => page.evaluate(() => { const c = document.getElementById('listeningToggle'); c.checked = true; c.dispatchEvent(new Event('change', { bubbles: true })); }));
  await page.waitForTimeout(400);
  await page.click('#startBtn'); await page.waitForTimeout(800);   // the card screen, where the tiles are laid out
  const r = await page.evaluate(([LONG, SHORT]) => {
    if (typeof renderListeningCard !== 'function' || !isListeningActive()) return { err: 'listening not active' };
    if (!document.getElementById('lcChoices').getBoundingClientRect().width) return { err: 'the card screen is not shown' };
    const read = () => [...document.querySelectorAll('#lcChoices .lc-tile')].map(t => {
      const s = t.querySelector('.lc-heb, .lc-num'), tr = t.getBoundingClientRect(), cs = getComputedStyle(t);
      const a = tr.left + parseFloat(cs.borderLeftWidth), b = tr.right - parseFloat(cs.borderRightWidth);
      const sr = s.getBoundingClientRect();
      // the word inside its tile, and the tile inside the grid's own box (a long word's min-content used to widen its
      // column, so the tile held the word while the grid ran past the card)
      const g = document.getElementById('lcChoices').getBoundingClientRect();
      return { txt: s.textContent, out: Math.round(Math.max(0, a - sr.left, sr.right - b, g.left - tr.left, tr.right - g.right)), fs: getComputedStyle(s).fontSize, inline: s.style.fontSize };
    });
    const out = { long: [], short: null };
    // probe-only state: the choices are the three long words and one short one, the card a long word (a deck draws
    // its distractors at random, so two long words in one card are rare but possible — and then the columns, which
    // each grew to their word's min-content, ran the grid past the card)
    const realSample = window.sampleChoices;
    window.sampleChoices = () => [...LONG, SHORT].map(h => ({ heb: h, translit: 'x', eng: 'x' }));
    const t4 = () => { const ts = [...document.querySelectorAll('#lcChoices .lc-tile')].map(x => Math.round(x.getBoundingClientRect().width)); return Math.max(...ts) - Math.min(...ts); };
    for (const h of LONG) { renderListeningCard({ heb: h, translit: 'x', eng: 'x' }); const t = read(); out.long.push(t.find(x => x.txt === h) || { missing: h }); out.uneven = Math.max(out.uneven || 0, t4()); out.worst = Math.max(out.worst || 0, ...t.map(x => x.out)); }
    window.sampleChoices = realSample;
    renderListeningCard({ heb: SHORT, translit: 'shalom', eng: 'hello' });
    const t = read(); const me = t.find(x => x.txt === SHORT);
    const ref = document.createElement('span'); ref.className = 'lc-heb'; ref.style.position = 'absolute'; document.getElementById('lcChoices').appendChild(ref);
    out.short = { fs: me && me.fs, inline: me && me.inline, natural: getComputedStyle(ref).fontSize }; ref.remove();
    return out;
  }, [LONG, SHORT]);
  if (r.err) { console.log('FAIL', tag, r.err); fail++; await ctx.close(); continue; }
  const longOut = r.long.map(x => x.missing ? 999 : x.out);
  const ok = longOut.every(o => o === 0) && r.worst === 0 && r.uneven <= 1 && r.short.fs === r.short.natural && !r.short.inline && !errs.length;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${tag}: any word or tile out by ${r.worst} px, tiles uneven by ${r.uneven} px; the long words at ${JSON.stringify(r.long.map(x => x.fs))}; short word ${r.short.fs} (tile size ${r.short.natural}); errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
