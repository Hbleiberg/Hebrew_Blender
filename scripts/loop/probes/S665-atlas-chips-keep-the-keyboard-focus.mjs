#!/usr/bin/env node
// S665 — Trope Atlas: the "Show:" reading chips and the phrase browser's group chips are rebuilt by their own press
// (the pressed state and the counts are redrawn), so the chip a keyboard user had just pressed no longer existed and
// the focus fell to <body>: the next Tab started again from the top of the page. Where the same chips stand, only
// their pressed state changes now, so the pressed chip is still there, focused.
//   Per cell (EN light 1280, HE dark 800), by real keys:
//     readings — Space on a reading chip: it is pressed and still focused, with its ring; Enter again releases it,
//                still focused; Tab goes on to the next chip; Enter on All: focused and pressed;
//     groups   — Space on a phrase-group chip: pressed and focused, the rows redrawn; Shift+Tab goes to the chip before;
//     guards   — a pointer press on a chip presses it and shows no ring, and the page does not scroll; a Melody change
//                and a language switch leave the focus on their own selects (the rebuilt chips take nothing).
//
//   node scripts/loop/probes/S665-atlas-chips-keep-the-keyboard-focus.mjs     exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S665 fails the readings and groups cells).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 80)))));
// where the focus is: the host's id and the chip's place in it, its pressed state and whether a ring shows
const where = () => { const e = document.activeElement; if (!e || e === document.body) return { host: 'BODY' }; const host = e.parentElement; return { host: host.id || e.id || e.tagName.toLowerCase(), at: [...host.children].indexOf(e), pressed: e.getAttribute('aria-pressed'), ring: getComputedStyle(e).outlineStyle !== 'none', txt: (e.textContent || '').trim().slice(0, 18) }; };
const say = (w) => w.host === 'BODY' ? 'the BODY (lost)' : `#${w.host}[${w.at}] "${w.txt}" pressed ${w.pressed}${w.ring ? ', ringed' : ', no ring'}`;

for (const c of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { if (localStorage.getItem('__s665')) return; localStorage.setItem('__s665', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, [c.lang, c.dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.setDefaultTimeout(20000);
  try {
    await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelectorAll('#atPhraseRows svg.tu-pstaff').length > 0 && document.querySelectorAll('#atTable svg.tu-pstaff').length > 100, null, { timeout: 60000 });
    await settle(page);
    // readings: reach the first chip by keyboard from the Note names box, then the second
    await page.locator('#atNames').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    const start = await page.evaluate(where);
    await page.keyboard.press('Space'); await settle(page);
    const a = await page.evaluate(where); const cols1 = await page.evaluate(() => document.querySelectorAll('#atTable thead th').length);
    await page.keyboard.press('Enter'); await settle(page);
    const b = await page.evaluate(where);
    await page.keyboard.press('Enter'); await settle(page);   // pressed again, so All is free to press
    await page.keyboard.press('Tab');
    const n = await page.evaluate(where);
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter'); await settle(page);
    const all = await page.evaluate(where); const cols2 = await page.evaluate(() => document.querySelectorAll('#atTable thead th').length);
    report(start.host === 'atGroups' && start.at === 1 && a.host === 'atGroups' && a.at === 1 && a.pressed === 'true' && a.ring && b.host === 'atGroups' && b.at === 1 && b.pressed === 'false' && n.host === 'atGroups' && n.at === 2 && all.host === 'atGroups' && all.at === 0 && all.pressed === 'true' && cols1 < cols2 && errs.length === 0,
      `${tag} readings: Space → ${say(a)} (${cols1} columns); Enter → ${say(b)}; Tab → ${say(n)}; Enter on All → ${say(all)} (${cols2} columns); errors ${errs.length}`);
    // groups
    await page.locator('#atMel').focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    const rowsNow = () => page.evaluate(() => [...document.querySelectorAll('#atPhraseRows .at-prow .num')].map((n) => n.textContent.trim()).join(' '));
    const g0 = await page.evaluate(where); const rows0 = await rowsNow();
    await page.keyboard.press('Space'); await settle(page);
    const g1 = await page.evaluate(where); const rows1 = await rowsNow();
    await page.keyboard.press('Shift+Tab');
    const g2 = await page.evaluate(where);
    report(g0.host === 'atClauses' && g1.host === 'atClauses' && g1.at === g0.at && g1.pressed === 'true' && g1.ring && rows1 !== rows0 && g2.host === 'atClauses' && g2.at === g0.at - 1 && errs.length === 0,
      `${tag} groups: from ${say(g0)} (rows ${rows0}) Space → ${say(g1)} (rows ${rows1}); Shift+Tab → ${say(g2)}; errors ${errs.length}`);
    // guards: a pointer press, a Melody change, a language switch
    const chip = page.locator('#atClauses .at-chip').nth(3);   // not the chip the keyboard is on: a press there changes no focus
    await chip.scrollIntoViewIfNeeded(); await settle(page);
    const y0 = await page.evaluate(() => Math.round(scrollY));
    await chip.click(); await settle(page);
    const m = await page.evaluate(where); const y1 = await page.evaluate(() => Math.round(scrollY));
    await page.locator('#atMel').focus(); await page.keyboard.press('ArrowDown'); await settle(page);
    const mel = await page.evaluate(() => document.activeElement.id);
    const other = c.lang === 'he' ? 'en' : 'he';
    await page.locator('[data-i18n-switcher] select').focus(); await page.locator('[data-i18n-switcher] select').selectOption(other);
    await page.waitForFunction((l) => document.documentElement.lang === l, other); await settle(page);
    const sw = await page.evaluate(() => { const e = document.activeElement; return e.closest('[data-i18n-switcher]') ? 'the language select' : (e === document.body ? 'BODY' : e.tagName.toLowerCase() + '#' + e.id); });
    report(m.pressed === 'true' && !m.ring && y1 === y0 && mel === 'atMel' && sw === 'the language select' && errs.length === 0,
      `${tag} guards: a pointer press → ${say(m)}, the page moved ${y1 - y0}px; a Melody change leaves focus on #${mel}; a language switch on ${sw}; errors ${errs.length}`);
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
