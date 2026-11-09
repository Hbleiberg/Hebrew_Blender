#!/usr/bin/env node
// S633 (pass P, pattern `button-focus-lost-to-its-own-rebuild`, its dialog-opener twin) — a language switch while the
// Print coloring sheets popup is open re-renders the cards, so the card's "Print coloring sheet" button that opened it
// is replaced. Signed in, the switch comes by itself: the account's language preference lands after the listing, which
// a teacher who pressed a card's Print first is already past. Close used to send the focus to the bar's "Print coloring
// sheets" button (the opener had left the document); it now lands on the same card's rebuilt button. The bar's button
// and the ?parsha= link (no card opened them) still close to the bar's button.
//
//   node scripts/loop/probes/S633-parsha-emojis-close-finds-the-rebuilt-card.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S633 fails steps 2 and 4 in every cell: the focus lands on #etCsOpen; 1, 3, 5 and 6 pass); --json prints the record.
// The switch is I18n.setLang(), the call js/ivrit-saves.js makes when the account's Suite prefs carry another language
// (the signed-in path itself was measured with smoke-sync's fake cloud: findings S633, W8).
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
const CELLS = [{ lang: 'en', to: 'he', dark: false, w: 1280 }, { lang: 'he', to: 'en', dark: true, w: 800 }, { lang: 'en', to: 'he', dark: true, w: 1280 }, { lang: 'he', to: 'en', dark: false, w: 800 }];
for (const cell of CELLS) {
  const tag = `${cell.lang}→${cell.to} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); sessionStorage.setItem('seeded', '1'); } }, [cell.lang, cell.dark]);
  await page.clock.setFixedTime(new Date('2026-11-05T12:00:00'));
  const load = async (q) => {
    await page.goto(base + '/parsha_emojis.html' + (q || ''), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.querySelector('#etCards .et-card') && !document.getElementById('etCsOpen').disabled);
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  };
  const st = () => page.evaluate(() => {
    const ov = document.getElementById('etCsOverlay'), a = document.activeElement;
    return { lang: window.I18n && I18n.lang, open: !!ov && !ov.hidden,
      focus: a ? (a.id || a.className || a.tagName) + (a.dataset && a.dataset.sheet !== undefined ? '#' + a.dataset.sheet : '') : null,
      ring: !!(a && a.matches && a.matches(':focus-visible')), inDoc: !!(a && document.contains(a)) };
  });
  const step = async (name, fn, check) => { let r = null, ok = false; try { if (fn) await fn(); await page.waitForTimeout(350); r = await st(); ok = !!check(r); } catch (e) { r = { error: String(e).slice(0, 200) }; } if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
  const switchLang = () => page.evaluate((to) => I18n.setLang(to), cell.to).then(() => page.waitForFunction((to) => I18n.lang === to && document.documentElement.lang === to, cell.to)).then(() => page.waitForTimeout(400));
  // Keyboard to the card's button: focus the bar's control before it, then Tab until a card's sheet button holds the focus.
  const tabToCard = async () => {
    await page.focus('#etCsOpen');
    for (let i = 0; i < 40; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(() => !!document.activeElement.matches('.et-go-btn[data-sheet]'))) return page.evaluate(() => document.activeElement.dataset.sheet); }
    return null;
  };
  await load();
  // 1–2: View All, a card's button by keyboard, the language switches under the popup, Escape.
  await page.click('#etViews .et-view[data-view="all"]'); await page.waitForSelector('#etCards .et-card[data-n="20"]');
  const n = await tabToCard();
  await step('1 a card\'s Print coloring sheet, reached by Tab and pressed with Enter, opens the popup', async () => { if (n == null) throw new Error('no card button reached by Tab'); await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden); await switchLang(); },
    r => r.open && r.lang === cell.to);
  await step('2 after the language switch, Escape returns the focus to that card\'s rebuilt button, with its ring', async () => { await page.keyboard.press('Escape'); },
    r => !r.open && r.focus === 'et-go et-go-btn#' + n && r.inDoc && r.ring);
  // 3: control — no switch: the original button (focused afresh, still in the document) takes the focus back.
  await step('3 control: no switch — Enter, Escape, the same button', async () => { await page.focus('.et-go-btn[data-sheet="' + n + '"]'); await page.keyboard.press('Enter'); await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden); await page.keyboard.press('Escape'); },
    r => !r.open && r.focus === 'et-go et-go-btn#' + n);
  // 4: a card's button by mouse in the Today view, then the switch back.
  await page.click('#etViews .et-view[data-view="today"]').catch(() => {}); await page.waitForTimeout(300);
  const first = await page.evaluate(() => document.querySelector('#etCards .et-go-btn[data-sheet]')?.dataset.sheet);
  await step('4 a clicked card button (Today), the language switched back, Escape → that card', async () => { await page.click('#etCards .et-go-btn[data-sheet="' + first + '"]'); await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden); await page.evaluate((to) => I18n.setLang(to), cell.lang); await page.waitForFunction((l) => I18n.lang === l, cell.lang); await page.waitForTimeout(400); await page.keyboard.press('Escape'); },
    r => !r.open && r.focus === 'et-go et-go-btn#' + first && r.inDoc);
  // 5: control — the bar's button with a switch closes back to the bar's button.
  await step('5 control: the bar\'s Print coloring sheets, a switch, Escape → the bar\'s button', async () => { await page.click('#etCsOpen'); await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden); await switchLang(); await page.keyboard.press('Escape'); },
    r => !r.open && r.focus === 'etCsOpen');
  // 6: control — ?parsha=noach (no card opened it) closes to the bar's button.
  await step('6 control: ?parsha=noach, Escape → the bar\'s button', async () => { await load('?parsha=noach'); await page.waitForFunction(() => !document.getElementById('etCsOverlay').hidden); await page.keyboard.press('Escape'); },
    r => !r.open && r.focus === 'etCsOpen');
  if (errors.length) { fail++; record.push({ cell: tag, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in all four cells');
process.exit(fail ? 1 : 0);
