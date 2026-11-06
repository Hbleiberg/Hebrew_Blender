#!/usr/bin/env node
// S621 — every parasha card has a "Print coloring sheet" button (micro-feature, gate 1; the S540 seed): it opens the
// Print coloring sheets popup on that parasha alone (one chip ticked, one page in the preview), Escape closes it and
// the focus comes back to the button, and the bar's own button still opens on the view's parshiyot. The button is
// named, 24px tall and dressed like its link neighbours.
//
//   node scripts/loop/probes/S621-parsha-emojis-card-prints-its-sheet.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S621 fails: the button does not exist); --json prints the record.
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
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  await page.clock.setFixedTime(new Date('2026-11-05T12:00:00'));
  await page.goto(base + '/parsha_emojis.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelector('#etCards .et-card'));
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  // the state: the cards' buttons, the popup, its chips and preview, the focus
  const st = async () => page.evaluate(() => {
    const cards = [...document.querySelectorAll('#etCards .et-card')];
    const btns = cards.map(c => c.querySelector('.et-go-btn')).filter(Boolean);
    const sizes = btns.map(b => Math.round(b.getBoundingClientRect().height));
    const ov = document.getElementById('etCsOverlay');
    const chips = [...document.querySelectorAll('#etCsChips input')];
    const a = document.activeElement;
    return { cards: cards.length, btns: btns.length, named: btns.filter(b => b.textContent.trim() && /\S/.test(b.getAttribute('aria-label') || '')).length,
      minH: sizes.length ? Math.min(...sizes) : 0, open: !!ov && !ov.hidden,
      chosen: typeof etCsChosenList === 'function' ? etCsChosenList().map(p => p.n - 1) : null,
      ticked: chips.filter(c => c.checked).map(c => Number(c.value)), pages: document.querySelectorAll('#etCsPages li').length,
      visible: typeof etVisibleIdx === 'function' ? etVisibleIdx().length : null,
      focus: a ? (a.className || a.id || a.tagName) + (a.dataset && a.dataset.sheet !== undefined ? '#' + a.dataset.sheet : '') : null };
  });
  const step = async (name, fn, check) => { if (fn) await fn(); await page.waitForTimeout(400); const r = await st(); const ok = !!check(r); if (!ok) fail++; record.push({ cell: cell.lang + (cell.dark ? ' dark ' : ' light ') + cell.w, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} — ${name}: ${JSON.stringify(r)}`); return r; };
  const first = await page.evaluate(() => Number(document.querySelector('#etCards .et-card')?.dataset.n) - 1);
  await step('1 every card has a named 24px Print coloring sheet button', null, r => r.cards > 0 && r.btns === r.cards && r.named === r.cards && r.minH >= 24);
  const has = (await st()).btns > 0;
  await step('2 the first card\'s button opens the popup on that parasha alone, one page', has ? async () => { await page.click(`#etCards .et-card[data-n="${first + 1}"] .et-go-btn`); await page.waitForFunction(() => document.querySelectorAll('#etCsPages li').length >= 1, null, { timeout: 15000 }).catch(() => {}); } : null,
    r => r.open && r.chosen && r.chosen.length === 1 && r.chosen[0] === first && r.ticked.length === 1 && r.ticked[0] === first && r.pages === 1);
  await step('3 Escape closes it and the focus is back on the button', has ? async () => { await page.keyboard.press('Escape'); } : null, r => !r.open && r.focus === 'et-go et-go-btn#' + first);
  await step('4 control: in View All the bar\'s button still opens on the view\'s 54 parshiyot', async () => { await page.click('#etViews .et-view[data-view="all"]'); await page.waitForSelector('#etCards .et-card[data-n="20"]'); await page.click('#etCsOpen'); }, r => r.open && r.chosen && r.visible === 54 && r.chosen.length === 54 && r.ticked.length === 54);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await step('5 View All: card 20\'s button opens on that parasha alone', has ? async () => { await page.click('#etCards .et-card[data-n="20"] .et-go-btn'); await page.waitForFunction(() => document.querySelectorAll('#etCsPages li').length >= 1, null, { timeout: 15000 }).catch(() => {}); } : null,
    r => r.open && r.chosen && r.chosen.length === 1 && r.chosen[0] === 19 && r.ticked.length === 1 && r.ticked[0] === 19 && r.pages === 1);
  if (errors.length) { fail++; record.push({ cell: cell.lang, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
