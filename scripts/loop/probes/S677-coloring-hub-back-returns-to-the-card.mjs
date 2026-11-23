#!/usr/bin/env node
// S677 (pass N on `jewish-coloring-pages.html`, its first) — Back from a sheet the hub links to put the page back at the
// scroll it left, but in the Hebrew UI the browser can do that before the language lands: in the English layout, which
// is longer above the cards, so the card the teacher had tapped came back 100–230px lower (5 of 30 Hebrew runs on
// three phones with an instant local server, 0 of 10 in English). The hub now keeps the tapped card and its place on
// the screen in history.state and, once the language is in, puts the card back there unless the reader has scrolled.
//
//   node scripts/loop/probes/S677-coloring-hub-back-returns-to-the-card.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S677 fails the delayed
//   Hebrew cells).
//
// The race made certain: on the way back the Hebrew locale file answers 900ms late (the English layout is what the
// browser restores into). iPhone SE / iPhone 13 / Pixel 7 × light / dark × three links tapped by a finger (a parsha
// card in a book chosen by its tab, an alef-bet tile, a "This week" card) → the sheet → Back: the tapped link is within
// 3px of where it was, its book still open. Guards: the English UI with the same delay and the Hebrew UI with none
// (the browser's own restore, unchanged); a reader who scrolls while the locale is late keeps their own scroll. No page
// error. Every foreign origin is aborted (fallback fonts).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const LINKS = [
  ['a parsha card', async page => { await page.locator('#chTab-exodus').tap(); return page.locator('#chBook-exodus a.ch-card').nth(5); }, 'exodus'],
  ['an alef-bet tile', async page => page.locator('.ch-letters a.ch-letter').nth(14), null],
  ['a This week card', async page => page.locator('#chNow a.ch-card').first(), null],
];
const CELLS = [];
for (const dev of ['iPhone SE', 'iPhone 13', 'Pixel 7']) for (const dark of [false, true]) for (const link of LINKS) CELLS.push({ dev, dark, lang: 'he', delay: 900, link });
CELLS.push({ dev: 'iPhone 13', dark: false, lang: 'en', delay: 900, link: LINKS[0] }, { dev: 'iPhone SE', dark: true, lang: 'en', delay: 900, link: LINKS[1] });
CELLS.push({ dev: 'iPhone SE', dark: false, lang: 'he', delay: 0, link: LINKS[0] }, { dev: 'Pixel 7', dark: true, lang: 'he', delay: 0, link: LINKS[2] });
CELLS.push({ dev: 'iPhone 13', dark: false, lang: 'he', delay: 1500, link: LINKS[0], scroll: true });
const browser = await chromium.launch(); const records = [];
for (const c of CELLS) {
  const ctx = await browser.newContext({ ...devices[c.dev], serviceWorkers: 'block', colorScheme: c.dark ? 'dark' : 'light' });
  await ctx.addInitScript(o => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', o.lang); localStorage.setItem('hebrewBlender_darkMode', o.dark ? '1' : '0'); localStorage.setItem('hebrewBlender_pwaDismissed', '1'); } }, { lang: c.lang, dark: c.dark });
  await ctx.clock.setFixedTime(new Date('2026-11-23T10:00:00'));   // a week with a parsha and a holiday in This week
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  let back = false, delayed = 0;
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (!(u.startsWith(BASE) || /^(data|blob):/.test(u))) return r.abort();
    if (back && c.delay && /\/locales\/(he|en)\.json/.test(u)) { delayed++; await new Promise(res => setTimeout(res, c.delay)); }
    return r.continue();
  });
  const rec = { cell: `${c.dev} ${c.lang} ${c.dark ? 'dark' : 'light'} ${c.link[0]}${c.delay ? ' (locale +' + c.delay + 'ms)' : ''}${c.scroll ? ' + a scroll' : ''}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  try {
    await page.goto(`${BASE}/jewish-coloring-pages.html`, { waitUntil: 'load' }); await page.waitForTimeout(600);
    const a = await c.link[1](page);
    need(await a.count() === 1, 'the link was not found (control)');
    await a.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
    const href = await a.getAttribute('href'), inNow = await a.evaluate(el => !!el.closest('#chNow'));
    const top0 = await a.evaluate(el => el.getBoundingClientRect().top);
    back = true;
    await Promise.all([page.waitForURL(u => !u.pathname.endsWith('/jewish-coloring-pages.html')), a.tap()]);
    await page.waitForTimeout(500);
    if (c.scroll) {
      await page.goBack({ waitUntil: 'commit' });
      await page.waitForTimeout(500);
      await page.mouse.move(150, 300); await page.mouse.wheel(0, -400); await page.waitForTimeout(c.delay + 900);
    } else { await page.goBack({ waitUntil: 'load' }); await page.waitForTimeout(c.delay + 700); }
    need(!c.delay || delayed > 0, 'the locale was never delayed (control)');
    const st = await page.evaluate(([h, n]) => {
      const el = [...document.querySelectorAll('a[href]')].find(x => x.getAttribute('href') === h && !!x.closest('#chNow') === n);
      const tab = document.querySelector('.ch-book-tab[aria-selected="true"]');
      return { top: el ? el.getBoundingClientRect().top : null, book: tab ? tab.dataset.book : null, lang: document.documentElement.lang, y: scrollY };
    }, [href, inNow]);
    rec.moved = st.top === null ? 'lost' : Math.round(st.top - top0);
    need(st.lang === c.lang, `the page came back in ${st.lang}`);
    if (c.link[2]) need(st.book === c.link[2], `the book on Back is ${st.book}`);
    if (c.scroll) need(st.top !== null && Math.abs(st.top - top0) > 100, `a reader's scroll was undone (the card back at ${Math.round(st.top)}, it was ${Math.round(top0)})`);
    else need(st.top !== null && Math.abs(st.top - top0) <= 3, `the card came back ${rec.moved}px from where it was`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}: moved ${r.moved}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
