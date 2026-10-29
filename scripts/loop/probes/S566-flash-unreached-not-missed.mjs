#!/usr/bin/env node
// S566 — Flash Cards: a card the drill never reached is not a weakness. Before the fix,
// analyzeWeaknesses and collectMissedCards counted every card whose score was not `true` as missed, so a drill ended
// early or cut off by its time limit saved its unreached cards (score null) as misses: a student who answered 3 of 3
// before a 30 s limit ran out got "Gimel + Shva missed 6/7" in the weakness viewer, a 16-card weak deck and the same
// focus areas on the printed progress report.
//
//   node scripts/loop/probes/S566-flash-unreached-not-missed.mjs     exit 1 when an unreached card counts as missed
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// Serves the tree in-process (foreign origins aborted, service workers blocked). By real clicks: בּ ג ד × kamatz +
// chirik; E ends early after 6 marks (2 ✗) of 10, T lets a 30 s limit run out after 3 ✓ of 20; the result is saved
// to a new profile through the Save Results dialog; then the Teacher Tools weak-card button and the page's own
// collectMissedCards / analyzeWeaknesses are read against the saved result's own scores.
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
const browser = await chromium.launch();
const records = [];
for (const [sc, lang, dark, w] of [['E', 'en', '0', 1280], ['E', 'he', '1', 800], ['T', 'en', '0', 1280]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); } }, { lang, dark });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => d.accept());   // End Practice Early asks first
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  const openPanel = async id => { if (await page.evaluate(i => document.getElementById(i).classList.contains('collapsed'), id)) await page.click(`#${id} > .panel-title`); await page.waitForTimeout(200); };
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('.letter-tile').length > 20, null, { timeout: 20000 }); await page.waitForTimeout(600);
  await page.click('#letterNone'); for (const x of ['בּ', 'ג', 'ד']) await page.click(`.letter-tile[data-heb="${x}"]`);
  await page.click('#vowelNone'); for (const k of ['a', 'i']) await page.click(`.vtile[data-key="${k}"]`);
  await page.click(`.count-btn[data-n="${sc === 'T' ? 20 : 10}"]`);
  if (sc === 'T') { await openPanel('panelTimer'); await page.click('#timerModePills [data-tmode="limit"]'); await page.click('#timeLimitPills [data-secs="30"]'); }
  await page.click('#startBtn'); await page.waitForTimeout(400);
  for (const m of sc === 'T' ? 'yyy' : 'ynyyny') { await page.click('#fcCard', { position: { x: 20, y: 20 } }); await page.waitForTimeout(600); await page.click(m === 'y' ? '#markYes' : '#markNo'); await page.waitForTimeout(400); }
  if (sc === 'T') await page.waitForFunction(() => document.querySelector('.screen.active')?.id === 'screenResults', null, { timeout: 40000 });
  else await page.click('#endEarlyBtn');
  await page.waitForTimeout(500);
  await page.click('#saveResultsBtn'); await page.waitForTimeout(300);
  await page.fill('#newProfileNameInput', 'Noa'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  await page.click('#backToSetupBtn'); await page.waitForTimeout(400);
  await openPanel('panelTeacherTools');
  const rec = await page.evaluate(() => {
    if (typeof collectMissedCards !== 'function' || typeof analyzeWeaknesses !== 'function') return { handle: false };
    const r = JSON.parse(localStorage.getItem('hebrewFlashCards_profiles')).profiles.Noa.results[0];
    const unreached = r.cards.filter(c => c.score === null).length;
    const wrongHeb = new Set(r.cards.filter(c => c.score === false).map(c => c.heb)).size;
    const st = analyzeWeaknesses('Noa'); const seen = Object.values(st.vowels).reduce((n, v) => n + v.seen, 0);
    const answeredVowelHits = r.cards.filter(c => c.score !== null).reduce((n, c) => n + new Set(parseHebUnits(c.heb).map(u => u.vowelKey).filter(Boolean)).size, 0);
    return { handle: true, unreached, missedCards: collectMissedCards('Noa').length, wrongHeb, vowelSeen: seen, answeredVowelHits, weakBtn: document.getElementById('weaknessesBtn').getAttribute('aria-disabled') };
  });
  rec.ok = rec.handle && rec.unreached > 0 && rec.missedCards === rec.wrongHeb && rec.vowelSeen === rec.answeredVowelHits && (sc !== 'T' || rec.weakBtn === 'true');
  records.push({ cell: `${sc} ${lang} ${w}`, ...rec, errors: errors.length });
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log(`${r.cell.padEnd(10)} unreached ${r.unreached}; weak deck ${r.missedCards} (wrong cards ${r.wrongHeb}); vowels seen ${r.vowelSeen} (on answered cards ${r.answeredVowelHits}); weak button aria-disabled ${r.weakBtn}; pageerrors ${r.errors}${r.ok && !r.errors ? '' : '  FAIL'}`));
process.exit(bad.length ? 1 : 0);
