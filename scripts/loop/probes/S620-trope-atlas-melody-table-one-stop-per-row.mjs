#!/usr/bin/env node
// S620 — the Trope Atlas melody table is one Tab stop per sign (the S580 C candidate: 594 Sing buttons were 594 stops
// between the table and the phrase browser). Tab lands on one Sing button per row (Grid) or card (Stacked); inside a
// row Left / Right follow the page's direction, Home / End reach its ends, Up / Down keep the tradition; the stop a row
// keeps is the last figure focused there, by key or by click; Enter still sings; a rebuild (Stacked, a language
// switch) keeps the arrangement.
//
//   node scripts/loop/probes/S620-trope-atlas-melody-table-one-stop-per-row.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S620 fails: every Sing button is a stop); --json prints the record.
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
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light', reducedMotion: 'reduce' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.removeItem('hebrewTropeAtlas_settings'); }, [cell.lang, cell.dark]);
  const ready = async () => { await page.waitForFunction(() => window.I18n && document.querySelectorAll('#atTable .at-sing').length > 20); await page.evaluate(() => I18n.ready); await page.waitForTimeout(400); };
  const cellName = cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w;
  const F = () => page.evaluate(() => { const a = document.activeElement; const w = a && a.closest && a.closest('[data-sing]'); const row = a && a.closest && a.closest('tr, .at-card'); const cs = a && getComputedStyle(a);
    return { sing: !!(a && a.matches && a.matches('.at-sing')), id: w ? w.dataset.sing : (a && (a.id || a.className || a.tagName)), inTable: !!(a && a.closest && a.closest('#atTable')), row: row ? row.id : null, fv: !!(a && a.matches && a.matches(':focus-visible')), ring: !!(cs && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0), pressed: a && a.getAttribute && a.getAttribute('aria-pressed') }; });
  const step = (name, ok, r) => { if (!ok) fail++; record.push({ cell: cellName, name, ok, r }); if (!JSON_OUT) console.log((ok ? 'ok  ' : 'FAIL') + ' ' + cellName + ' ' + name + (ok ? '' : ' ' + JSON.stringify(r))); };
  await page.goto(base + '/trope_atlas.html'); await ready();
  const total = await page.evaluate(() => document.querySelectorAll('#atTable .at-sing').length);
  const rowsWith = await page.evaluate(() => [...document.querySelectorAll('#atTable tr, #atTable .at-card')].filter(r => r.querySelector('.at-sing')).length);
  // 1. Tab through the table: stops inside #atTable from its region to the first stop after it
  const walk = async () => { await page.evaluate(() => { const h = document.getElementById('atTable'); if (h.tabIndex >= 0) h.focus(); else [...document.querySelectorAll('#atGroups button')].pop().focus(); });   /* Stacked has no region stop: start on the last filter chip */ const stops = []; for (let i = 0; i < 700; i++) { await page.keyboard.press('Tab'); const f = await F(); if (!f.inTable) break; stops.push(f); } return stops; };
  const stops = await walk();
  const sings = stops.filter(s => s.sing), other = stops.filter(s => !s.sing).map(s => s.id);
  step(`Tab stops inside the table: ${sings.length} Sing buttons of ${total}, ${rowsWith} rows` + (other.length ? ` (+${other.length} scroller stops)` : ''), sings.length === rowsWith && stops.every(s => s.fv), { n: sings.length, total, rowsWith, other: [...new Set(other)], noRing: stops.filter(s => !s.fv).length });
  // 2. arrows along the first row, by direction
  const first = await page.evaluate(() => { const b = document.querySelector('#atTable tr .at-sing, #atTable .at-card .at-sing'); b.focus(); return b.closest('[data-sing]').dataset.sing; });
  const rtl = cell.lang === 'he';
  await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight'); let f = await F();
  const second = await page.evaluate(() => { const row = document.activeElement.closest('tr, .at-card'); return row.querySelectorAll('[data-sing]')[1].dataset.sing; });
  step('the forward arrow (by direction) moves to the row\'s 2nd figure, ringed', f.id === second && f.id !== first && f.fv, f);
  await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft'); f = await F();
  step('the back arrow returns to the 1st', f.id === first, f);
  await page.keyboard.press(rtl ? 'ArrowRight' : 'ArrowLeft'); f = await F();
  step('the back arrow at the 1st stays (no wrap, no scroll jump)', f.id === first, f);
  await page.keyboard.press('End'); f = await F(); const last = await page.evaluate(() => { const l = document.activeElement.closest('tr, .at-card').querySelectorAll('[data-sing]'); return l[l.length - 1].dataset.sing; });
  step('End reaches the row\'s last figure', f.id === last, f);
  await page.keyboard.press('Home'); f = await F(); step('Home the first', f.id === first, f);
  // 3. Down keeps the tradition
  await page.keyboard.press(rtl ? 'ArrowLeft' : 'ArrowRight'); const before = await F(); await page.keyboard.press('ArrowDown'); f = await F();
  step('Down moves to the next row, the same tradition', f.row !== before.row && f.id.split(':')[1] === before.id.split(':')[1], { before: before.id, after: f.id, rows: [before.row, f.row] });
  await page.keyboard.press('ArrowUp'); f = await F(); step('Up comes back', f.id === before.id, f);
  // 4. the row remembers its stop: Tab leaves to the next row's stop, Shift+Tab returns to the 2nd figure
  await page.keyboard.press('Tab'); const next = await F(); await page.keyboard.press('Shift+Tab'); f = await F();
  step('Tab leaves the row to the next row\'s stop; Shift+Tab returns to the figure left', next.row !== before.row && next.inTable && f.id === before.id, { next: next.id, back: f.id });
  // 5. a click on a middle figure makes it the row's stop (and sings); Enter stops it
  const mid = await page.evaluate(() => { const row = document.querySelectorAll('#atTable tr, #atTable .at-card')[6]; const l = row.querySelectorAll('.at-sing'); const b = l[Math.min(3, l.length - 1)]; return { id: b.closest('[data-sing]').dataset.sing }; });
  await page.click('[data-sing="' + mid.id + '"] .at-sing'); await page.waitForTimeout(300); f = await F();
  step('a click focuses that figure and sings it', f.id === mid.id && f.pressed === 'true', f);
  await page.keyboard.press('Enter'); await page.waitForTimeout(200); f = await F(); step('Enter stops it', f.id === mid.id && f.pressed === 'false', f);
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); f = await F(); step('after a click the row\'s stop is that figure', f.id === mid.id, f);
  // 6. Stacked: the same count rule
  await page.click('#atViewCards'); await page.waitForTimeout(600);
  const totalC = await page.evaluate(() => document.querySelectorAll('#atTable .at-sing').length), cardsWith = await page.evaluate(() => [...document.querySelectorAll('#atTable .at-card')].filter(r => r.querySelector('.at-sing')).length);
  const stopsC = await walk();
  const singsC = stopsC.filter(s => s.sing), otherC = stopsC.filter(s => !s.sing).map(s => s.id);
  step(`Stacked: ${singsC.length} Sing stops of ${totalC}, ${cardsWith} cards` + (otherC.length ? ` (+${otherC.length} scroller stops)` : ''), singsC.length === cardsWith && stopsC.every(s => s.fv), { n: singsC.length, totalC, cardsWith, other: [...new Set(otherC)] });
  await page.evaluate(() => { document.querySelector('#atTable .at-card .at-sing').focus(); }); await page.keyboard.press('ArrowDown'); f = await F();
  step('Stacked: Down moves to the next card', f.inTable && f.row && f.row !== (await page.evaluate(() => document.querySelector('#atTable .at-card').id)), f);
  await page.click('#atViewGrid'); await page.waitForTimeout(600);
  // 7. a language switch rebuilds and keeps one stop per row
  await page.evaluate(lang => I18n.setLang(lang === 'en' ? 'he' : 'en'), cell.lang); await page.waitForTimeout(900);
  const stopsL = await walk();
  step(`after a language switch: ${stopsL.filter(s => s.sing).length} Sing stops`, stopsL.filter(s => s.sing).length === rowsWith, { n: stopsL.length, rowsWith });
  if (errors.length) step('page errors', false, errors);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
console.log(fail ? `S620 atlas one stop per row: ${fail} FAILED` : 'S620 atlas one stop per row: all steps pass');
process.exit(fail ? 1 : 0);
