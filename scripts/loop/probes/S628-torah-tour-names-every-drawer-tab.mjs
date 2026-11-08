#!/usr/bin/env node
// S628 — the Torah Trainer's tour names every tab of the settings drawer (pass I, onboarding copy vs the UI). Its
// Settings step said "Seven tabs: Favorites, Text, Colors, Audio, Calendar, Share and More" while the drawer shows eight:
// the Teacher tab (reading assignments) sits before More for every visitor, signed in or not.
//
//   node scripts/loop/probes/S628-torah-tour-names-every-drawer-tab.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile: the tour by real clicks (Tour, then Next)
//   to its Settings step (the gear its spot), whose text must name each tab label the drawer shows (read after a real
//   click on the gear, in the drawer's order) and lead with that many in words; the step's counter runs to its end. exit 1
//   when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before S628:
//   4 failures, one a cell, "Teacher" / "מורה" unnamed).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
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
const COUNT = { en: ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'], he: ['', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'] };
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  try {
    await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
    await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
    const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.goto(base + '/torah_trainer.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.getElementById('tourBtn') && document.getElementById('gearBtn'));
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(1500);
    // the drawer's tabs, as a visitor sees them
    await page.click('#gearBtn'); await page.waitForTimeout(400);
    const tabs = await page.evaluate(() => [...document.querySelectorAll('[role="tablist"] .tt-tab')].filter(t => t.getClientRects().length && !t.hidden).map(t => t.textContent.trim()));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (tabs.length < 2) { ok(false, `${L}: the drawer's tabs not found (${tabs.length})`); await ctx.close(); continue; }
    // the tour to its Settings step
    await page.click('#tourBtn'); await page.waitForTimeout(500);
    let step = null, n = 0;
    for (let i = 0; i < 12; i++) {
      const s = await page.evaluate(() => { const c = document.getElementById('tourCard'); if (!c || c.hidden) return null; const g = document.getElementById('gearBtn').getBoundingClientRect(), sp = document.getElementById('tourSpot').getBoundingClientRect();
        return { body: document.getElementById('tourCardBody').textContent.trim(), counter: document.getElementById('tourStep').textContent.trim(), onGear: Math.abs(sp.left + sp.width / 2 - (g.left + g.width / 2)) < 12 && Math.abs(sp.top + sp.height / 2 - (g.top + g.height / 2)) < 12 }; });
      if (!s) break; n++;
      if (s.onGear) step = s;
      await page.click('#tourNext'); await page.waitForTimeout(400);
    }
    if (!step) { ok(false, `${L}: no tour step spotlights the gear (${n} steps)`); await ctx.close(); continue; }
    const missing = tabs.filter(t => !step.body.includes(t));
    const lead = COUNT[cell.lang][tabs.length];
    const order = tabs.map(t => step.body.indexOf(t)).every((x, i, a) => i === 0 || x > a[i - 1]);
    ok(missing.length === 0 && step.body.startsWith(lead) && order && errors.length === 0,
      `${L}: the Settings step (${step.counter}) names ${tabs.length - missing.length} of the drawer's ${tabs.length} tabs in order ${order}${missing.length ? ' — missing ' + missing.join(', ') : ''}; leads with "${step.body.split(/[:：]/)[0]}" (want "${lead}"); ${errors.length} errors`);
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : "PASS: the tour's Settings step names every drawer tab, with their count");
process.exit(fail ? 1 : 0);
