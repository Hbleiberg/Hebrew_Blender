#!/usr/bin/env node
// S626 — Parsha Emojis' Print coloring sheets note names the first five sheets it shrank (or could not fit) and counts
// the rest (pass G; gate 2 → "first 5, then 'and N more'"). Landscape with both languages shrinks the text of all 54
// sheets, and the note listed every name: 539 characters in a live region, read out after each option change.
//
//   node scripts/loop/probes/S626-parsha-emojis-fit-note-names-five.mjs
//   EN light 1280 / HE dark 800, the options stored as a teacher's (landscape, both languages; at 150% the text no longer
//   fits): by real clicks — View All → Print coloring sheets: the note names five in Torah order and "and 49 more"; Clear
//   then 7, 6 and 3 parshiyot ticked out of order: 7 → five and "2 more", 6 and 3 → every name, in Torah order; the
//   "still doesn't fit" note the same way; a live language switch rewrites it. exit 1 when a step fails or a handle is
//   missing. ROOT=<a git archive of the tree> runs another copy (the tree before S626 lists every name, a list ticked out of
//   order in the order of the ticks: 24 failures, 6 a cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
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
const guard = async (label, fn) => { try { await fn(); } catch (e) { fail++; console.log(`✘ ${label}: ${String(e).split('\n')[0]}`); } };
const SET = big => JSON.stringify({ v: 1, orient: 'landscape', textLang: 'both', sizeSummary: big, sizeWhy: big });
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  for (const big of [100, 150]) {
    const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} ${big}%`;
    await guard(L, async () => {
      const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
      await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
      await ctx.addInitScript(([lang, dark, s]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewEmojiTorah_settings', s); }, [cell.lang, cell.dark, SET(big)]);
      const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
      await page.goto(base + '/parsha_emojis.html', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.I18n && !document.getElementById('etCsOpen').disabled);
      await page.evaluate(() => window.I18n.ready);
      await page.click('.et-view[data-view="all"]'); await page.click('#etCsOpen');
      await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden && document.querySelectorAll('#etCsPages .et-cs-sheet').length === 54);
      const key = big === 150 ? 'emojitorah.coloring.over_note' : 'emojitorah.coloring.fit_note';
      // the note once the fit has settled: its verdicts, and the sentence the page would write for a given list
      const read = async n => {
        await page.waitForFunction(n => { const s = [..._etCsSheets.values()]; return s.length === n && s.every(e => e.over || e.k < 1); }, n, { timeout: 15000 });
        await page.waitForTimeout(150);
        return page.evaluate(key => {
          const he = etLang() === 'he', all = etCsChosenList().map(p => he ? p.he : p.en);
          const want = l => I18n.t(key, { names: l.length > 6 ? I18n.t('emojitorah.coloring.names_more', { names: l.slice(0, 5).join(', '), count: l.length - 5 }) : l.join(', ') });
          return { note: document.getElementById('etCsNote').textContent, want: want(all), live: document.getElementById('etCsNote').getAttribute('role'), all };
        }, key);
      };
      let r = await read(54);
      ok(r.note.includes(r.want) && r.note.length < 200 && r.live === 'status', `${L}: all 54 → "${r.note.slice(0, 120)}…" (${r.note.length} characters)`);
      ok(!r.note.includes(r.all[5]) && r.note.includes(r.all[4]) && /49/.test(r.note), `${L}: five names in Torah order, the sixth counted ("${r.all[4]}" named, "${r.all[5]}" not, 49 more)`);
      // Clear, then tick by real clicks out of order: 7, then 6, then 3
      await page.click('#etCsNone');
      const chips = page.locator('#etCsChips input[type="checkbox"]');
      for (const i of [8, 2, 0, 5, 1, 3, 4]) await chips.nth(i).check();
      r = await read(7);
      ok(r.note.includes(r.want) && r.note.includes(r.all[0]) && !r.note.includes(r.all[5]) && /\b2\b/.test(r.note), `${L}: 7 ticked out of order → five in Torah order and 2 more ("${r.note.slice(0, 110)}")`);
      await chips.nth(8).uncheck();
      r = await read(6);
      ok(r.note.includes(r.want) && r.all.every(n => r.note.includes(n)) && r.note.indexOf(r.all[0]) < r.note.indexOf(r.all[5]), `${L}: 6 → every name, in Torah order`);
      for (const i of [5, 4, 3]) await chips.nth(i).uncheck();
      r = await read(3);
      ok(r.note.includes(r.want) && r.all.every(n => r.note.includes(n)), `${L}: 3 → every name ("${r.note.slice(0, 90)}")`);
      // a live language switch rewrites the note in the other language
      await page.evaluate(() => { document.getElementById('etCsNone').click(); document.getElementById('etCsAll').click(); });
      await read(54);
      await page.evaluate(l => I18n.setLang(l), cell.lang === 'en' ? 'he' : 'en'); await page.waitForTimeout(600);
      r = await read(54);
      ok(r.note.includes(r.want) && r.note.length < 200, `${L}: after the language switch "${r.note.slice(0, 90)}…"`);
      ok(errors.length === 0, `${L}: 0 page errors ${errors.join(' | ')}`);
      await ctx.close();
    });
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the note names five and counts the rest in every cell');
process.exit(fail ? 1 : 0);
