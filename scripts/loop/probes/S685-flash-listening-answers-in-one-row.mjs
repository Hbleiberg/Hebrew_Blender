#!/usr/bin/env node
// S685 — a Flash Cards listening round lays three short answers out in one row (S683: two over one, the two-column grid
// of the four-answer round); four stay two by two, a phone keeps two columns, and an answer with a word over 5 letters
// keeps the two-column tile (a third of the card holds about 5 letters at the tile's 3rem: in three columns 209–666 of
// the dictionary's 13,080 words ran past their tile, none of the 11,036 the rule admits). By real clicks: Listening on, 3 or
// 4 choices, a content mode (2-letter, 3-letter, Other → Words from the whole dictionary, Other → Numbers), Start, then ten cards by the Next
// key; per card the tiles' rows and whether any answer overflows its tile. EN / HE × 1280 / 800 / 390.
// A cell passes when every 3-choice card at ≥ 560px whose answers are all ≤ 5 letters a word is one row, every other
// card two rows, and no answer's ink (its widest line box) is wider than its tile's content box.
//
//   node scripts/loop/probes/S685-flash-listening-answers-in-one-row.mjs   exit 1 on a wrong layout, an overflow or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S685 fails the 3-choice
//   cells at 1280 and 800). --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const MODES = [['2', null], ['3', null], ['other', 'words'], ['other', 'numbers']];
const browser = await chromium.launch();
const records = []; let fails = 0, errors = 0, cardsSeen = 0;
for (const lang of ['en', 'he']) for (const width of [1280, 800, 390]) for (const n of [3, 4]) for (const [mode, sub] of MODES) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); }, [lang]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.evaluate(() => typeof expandAllMenus === 'function' && expandAllMenus());
  if (mode === 'other') { await page.click('#otherModePill'); await page.click(`#otherSubPills .pill[data-sub="${sub}"]`);
    if (sub === 'words') await page.click('[data-wsource="alldict"]'); }   // a fresh browser has no word lists
  else await page.click(`#modePills .pill[data-mode="${mode}"]`);
  await page.locator('#listeningRow .switch').click();
  await page.click(`#listenChoicePills .pill[data-lc="${n}"]`);
  await page.click('#startBtn'); await page.waitForSelector('#screenCard.active', { timeout: 90000 });   // Words waits for the dictionary, then starts by itself
  const cells = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForSelector('#lcChoices .lc-tile', { timeout: 5000 }).catch(() => {});
    const m = await page.evaluate(() => { const t = [...document.querySelectorAll('#lcChoices .lc-tile')]; const g = document.createRange();
      const tops = [...new Set(t.map(e => Math.round(e.getBoundingClientRect().top)))];
      // an answer's ink (its text's widest line box) against the tile's content box
      const over = t.filter(e => { const f = e.querySelector('.lc-heb, .lc-num'); if (!f) return false; const cs = getComputedStyle(e);
        const inner = e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); g.selectNodeContents(f);
        return Math.max(...[...g.getClientRects()].map(x => x.width)) > inner + 0.5; }).length;
      const faces = t.map(e => (e.querySelector('.lc-heb, .lc-num') || e).textContent.trim());
      const short = faces.every(w => w.replace(/\u05BE/g, ' ').replace(/[\u0591-\u05C7]/g, '').split(/\s+/).every(x => x.length <= 5));
      return { tiles: t.length, rows: tops.length, over, short, text: faces.join(' ') }; });
    if (!m.tiles) break;
    cells.push(m); cardsSeen++;
    const next = page.locator('#nextBtn, #fcNextBtn, [data-i18n="flashcards.card.next"]').first();
    if (await next.isVisible().catch(() => false)) await next.click(); else await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(120);
  }
  const want = c => n === 3 && width >= 560 && c.short ? 1 : 2;
  const ok = cells.length > 0 && cells.every(c => c.tiles === n && c.rows === want(c) && !c.over);
  const wantRows = [...new Set(cells.map(want))].join('/');
  if (!ok) fails++;
  const worst = cells.find(c => c.rows !== want(c) || c.over) || cells[0] || {};
  records.push({ lang, width, n, mode: sub || mode, cards: cells.length, ok, worst });
  if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${lang} ${String(width).padEnd(4)} ${n} choices ${(sub || mode + '-letter').padEnd(8)} ${cells.length} cards · rows ${[...new Set(cells.map(c => c.rows))].join('/')} (want ${wantRows}) · overflow ${cells.reduce((a, c) => a + c.over, 0)}${!ok ? ' · ' + JSON.stringify(worst) : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors, cardsSeen }, null, 1));
const pass = !fails && !errors && cardsSeen > 0;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.length - fails}/${records.length} listening rounds lay out their answers as they should; ${cardsSeen} cards; ${errors} page errors`);
process.exit(pass ? 0 : 1);
