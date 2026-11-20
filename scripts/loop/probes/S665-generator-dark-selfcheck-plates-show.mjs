#!/usr/bin/env node
// S665 — Blend Generator, dark mode: the Self-Check timer bar and score bar and the sidebar's Print tip are plates
// filled with --warm-gray, which dark mode sets to the dark card colour, the colour of the sheet and the sidebar they
// sit on: each plate read 1.00:1 on its ground (light 1.31), so the rows had no bar and the tip no box. They take the
// suite's dark badge tint, with the score counts and the tip's text lightened to stay AA on it
// (pattern dark-navy-fill-matches-its-ground).
//   Dark cells (EN 1280, HE 800), built by real clicks:
//     plates — the timer bar and the score bar (blend Self-Check with the timer; Gematria Self-Check) and the Print tip
//              (a plain worksheet) each stand at least 1.25:1 off the composited ground under them;
//     text   — every text node on each plate is at least 4.5:1 on it (3:1 for large type), before and after a card is
//              turned and marked right and another wrong.
//   Light guard (EN 1280): the plates, the counts' colours and the tip are what they were.
//
//   node scripts/loop/probes/S665-generator-dark-selfcheck-plates-show.mjs     exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S665 fails every dark plates cell).
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
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40)))));
const sw = (page, id) => page.locator(`label.toggle:has(#${id})`).click();
// each plate: its composited fill against the composited ground under it, and its text against the fill
const plates = (sel) => {
  const P = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const p = m[1].split(/[, \/]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => [f[0] * f[3] + b[0] * (1 - f[3]), f[1] * f[3] + b[1] * (1 - f[3]), f[2] * f[3] + b[2] * (1 - f[3]), 1];
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const ground = (el) => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = P(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let b = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b); return b; };
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    if (!el.getClientRects().length) continue;
    const under = ground(el.parentElement), fill = ground(el);
    const row = { cls: el.id || el.className.split(' ')[0], plate: +ratio(fill, under).toFixed(2), fill: fill.slice(0, 3).map(Math.round).join(','), low: [], colours: {} };
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) {
      const t = n.textContent.trim(), pe = n.parentElement; if (!t || !pe.getClientRects().length) continue;
      const cs = getComputedStyle(pe), fg = P(cs.color), bg = ground(pe), r = ratio(over(fg, bg), bg), px = parseFloat(cs.fontSize), need = (px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700)) ? 3 : 4.5;
      row.colours[pe.className.split(' ')[0] || pe.tagName.toLowerCase()] = cs.color;
      if (r < need) row.low.push(`"${t.slice(0, 14)}" ${r.toFixed(2)}:1`);
    }
    out.push(row);
  }
  return out;
};
const good = (rows, min) => rows.length > 0 && rows.every((r) => r.plate >= min && !r.low.length);
const say = (rows) => rows.map((r) => `${r.cls} ${r.plate}:1 off its ground${r.low.length ? ', low text ' + r.low.join(' ') : ''}`).join('; ') || '(no plate found)';

for (const c of [{ lang: 'en', dark: true, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: false, w: 1280 }]) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  const open = async () => {
    const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block' });
    await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
    await ctx.addInitScript(([l, d]) => { try { if (localStorage.getItem('__s665')) return; localStorage.setItem('__s665', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); } catch (e) {} }, [c.lang, c.dark]);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
    page.setDefaultTimeout(10000);
    await page.goto(`${BASE}/hebrew_blend_generator.html`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('.letter-tile').length > 10); await page.evaluate(() => I18n.ready); await settle(page);
    return { ctx, page, errs };
  };
  try {
    // blend Self-Check with its timer
    let { ctx, page, errs } = await open();
    await sw(page, 'selfCheckToggle'); await settle(page); await sw(page, 'timerToggle'); await settle(page);
    await page.locator('#generateBtn').click(); await page.waitForFunction(() => document.querySelector('#worksheet .timer-bar') && document.querySelector('#worksheet .score-bar')); await settle(page);
    const a = await page.evaluate(plates, '#worksheet .timer-bar, #worksheet .score-bar');
    // one card right, one wrong
    for (const [i, which] of [[0, 'first'], [1, 'last']]) { const card = page.locator('#scGrid .flip-card').nth(i); await card.click(); await settle(page); await card.locator('.flip-card-score-btns button')[which]().click(); await settle(page); }
    const b = await page.evaluate(plates, '#worksheet .timer-bar, #worksheet .score-bar');
    const counts = await page.evaluate(() => [document.querySelector('#scScoreBar .score-correct').textContent.trim(), document.querySelector('#scScoreBar .score-incorrect').textContent.trim()].join(' '));
    await ctx.close();
    // Gematria Self-Check's score bar
    ({ ctx, page } = await open());
    await page.locator('.blend-type-btn[data-worksheet="gematria"]').click(); await settle(page); await sw(page, 'gematriaSelfCheck'); await settle(page);
    await page.locator('#generateBtn').click(); await page.waitForFunction(() => document.querySelector('#worksheet .score-bar')); await settle(page);
    const g = await page.evaluate(plates, '#worksheet .score-bar');
    await ctx.close();
    // the Print tip under a plain worksheet
    ({ ctx, page } = await open());
    await page.locator('#generateBtn').click(); await page.waitForFunction(() => { const t = document.getElementById('printTip'); return t && t.getClientRects().length > 0; }); await settle(page);
    const t = await page.evaluate(plates, '#printTip');
    await ctx.close();
    if (c.dark) {
      report(good(a, 1.25) && good(g, 1.25) && good(t, 1.25) && errs.length === 0, `${tag} plates: ${say(a)}; Gematria ${say(g)}; ${say(t)}; errors ${errs.length}`);
      report(good(b, 1.25) && /1/.test(counts), `${tag} text after one right and one wrong ("${counts}"): ${say(b)}`);
    } else {
      const sb = a.find((r) => /score/i.test(r.cls)) || { colours: {} };
      report(a.every((r) => r.fill === '232,224,208' && !r.low.length) && sb.colours['score-correct'] === 'rgb(25, 112, 60)' && sb.colours['score-incorrect'] === 'rgb(169, 50, 38)' && t.length === 1 && t[0].fill === '232,224,208' && errs.length === 0,
        `${tag} guard: the bars' fill ${a.map((r) => r.fill).join(' / ')}, counts ${sb.colours['score-correct']} / ${sb.colours['score-incorrect']}, the tip's fill ${t[0] && t[0].fill} (${say(t)})`);
    }
  } catch (e) { report(false, `${tag}: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
