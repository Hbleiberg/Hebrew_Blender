#!/usr/bin/env node
// S668 (the S651 P4, wider than logged) — flash_cards.html presented fullscreen: the card was `min(60vh, 620px)` tall
// whatever stood around it, so with a timer the ✓ / ✗ row ended 14–50px past the screen's foot at 1024×768, 1280×720,
// 1280×800 and 1366×768, and Prev / Flip / Next past it at every height up to 900. The card now also fits the screen's
// height (`max(300px, 98vh − 380px)`); 1080p keeps 620px.
//   1024×768, 1280×720, 1280×800, 1366×768, 1440×900, 1920×1080 × Record Time / No Timer × EN light / HE dark: a deck
//     started by real clicks, fullscreen by the header's button, the card flipped by Flip — the ✓ / ✗ row and the nav
//     row end inside the screen, the card at 300px or more, at 1920×1080 still 620px;
//   1280×720 EN light / HE dark: the first five cards' faces, front and back, inside the shorter card.
//
//   node scripts/loop/probes/S668-flash-fullscreen-keeps-mark-and-nav-on-screen.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy (the tree before S668 fails 18 of 26: every cell at 720–800px
//   and the two timer cells at 900).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ args: ['--hide-scrollbars'] });
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
async function present(w, h, mode, lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, screen: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { if (sessionStorage.getItem('__s668')) return; sessionStorage.setItem('__s668', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); } catch (e) {} }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/flash_cards.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  if (mode !== 'off') {   // the Timer panel starts folded: open it by its title, then the mode
    const pill = page.locator(`#timerModePills [data-tmode="${mode}"]`);
    if (!(await pill.isVisible())) await page.locator('#panelTimer .panel-title').click();
    await pill.click();
  }
  await page.locator('#startBtn').click(); await page.waitForSelector('#screenCard.active', { timeout: 10000 });
  await page.locator('#fsBtn').click(); await page.waitForFunction(() => document.body.classList.contains('fc-fullscreen'), null, { timeout: 5000 });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errs };
}
const box = sel => document.querySelector(sel) ? (r => r.height ? [Math.round(r.top), Math.round(r.bottom)] : null)(document.querySelector(sel).getBoundingClientRect()) : null;
for (const [w, h] of [[1024, 768], [1280, 720], [1280, 800], [1366, 768], [1440, 900], [1920, 1080]]) for (const mode of ['track', 'off']) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs } = await present(w, h, mode, lang, dark);
  await page.locator('#flipBtn').click(); await page.waitForTimeout(700); await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
  const g = await page.evaluate(`({ timer: (${box})('#timerDisplay'), card: (${box})('#fcCard'), mark: (${box})('.fc-mark-row'), nav: (${box})('.fc-nav') })`);
  const cardH = g.card ? g.card[1] - g.card[0] : 0;
  const good = g.mark && g.nav && g.mark[1] <= h && g.nav[1] <= h && cardH >= 300 && (h < 1080 || cardH === 620) && (mode === 'off' ? !g.timer : !!g.timer) && !errs.length;
  report(good, `${w}×${h} ${mode === 'off' ? 'no timer' : 'Record Time'} ${lang} ${dark ? 'dark' : 'light'}: timer ${g.timer ? g.timer.join('–') : 'none'}, card ${g.card && g.card.join('–')} (${cardH}px), ✓ / ✗ ${g.mark && g.mark.join('–')}, Prev / Flip / Next ${g.nav && g.nav.join('–')} of ${h}; errors ${errs.length}`);
  await ctx.close();
}
for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs } = await present(1280, 720, 'track', lang, dark);
  const out = [];
  for (let i = 0; i < 5; i++) {
    for (const face of ['front', 'back']) {
      const r = await page.evaluate(id => { const c = document.getElementById('fcCard').getBoundingClientRect(), e = document.getElementById(id), b = e.getBoundingClientRect();
        return b.height && (b.top < c.top - 1 || b.bottom > c.bottom + 1) ? `${id} "${e.textContent.trim().slice(0, 12)}" ${Math.round(b.top)}–${Math.round(b.bottom)} in ${Math.round(c.top)}–${Math.round(c.bottom)}` : ''; }, face === 'front' ? 'fcFrontHeb' : 'fcBackTr');
      if (r) out.push(r);
      await page.locator('#flipBtn').click(); await page.waitForTimeout(650);
    }
    await page.locator('#nextBtn').click(); await page.waitForTimeout(450);
  }
  report(!out.length && !errs.length, `1280×720 ${lang} ${dark ? 'dark' : 'light'}: five cards' faces, front and back — ${out.length ? 'OUTSIDE: ' + out.join('; ') : 'every one inside the card'}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
