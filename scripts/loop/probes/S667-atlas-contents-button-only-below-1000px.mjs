#!/usr/bin/env node
// S667 — trope_atlas.html: the bar's Contents button exists only below 1000px, where the rail is a drawer (the page's
// contract). At 1000px and up the header-icons block's later `.hi-btn{display:inline-flex}` outranked the page's
// `.at-idxbtn{display:none}`, so a Contents button stood over the always-open rail, and a press marked it expanded
// (aria-expanded true) while nothing opened.
//   1000, 1280, 1920 × EN light / HE dark: the button takes no box and no Tab stop (a Tab walk from the page's start to
//     the rail's first link never lands on it);
//   999 and 800 × EN light / HE dark, and an iPhone 13: the button shows with its book icon and label, and a real
//     press opens the drawer (aria-expanded true, the rail on screen, the focus on its first link).
//
//   node scripts/loop/probes/S667-atlas-contents-button-only-below-1000px.mjs     exit 1 on any failing cell or a page error
//   ROOT=<a git archive of another tree> runs that copy (the tree before S667 fails the six wide cells).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
async function open(opts, lang, dark) {
  const ctx = await browser.newContext({ ...opts, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('#atSysIdx a').length > 5, null, { timeout: 20000 });
  await page.evaluate(() => I18n.ready); await page.waitForTimeout(300);
  return { ctx, page, errs };
}
const btn = page => page.evaluate(() => { const b = document.getElementById('atIdxBtn'), r = b.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), icon: !!b.querySelector('svg.hi-book'), label: (b.querySelector('.hi-lbl') || {}).textContent || '', expanded: b.getAttribute('aria-expanded') }; });
for (const w of [1000, 1280, 1920]) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs } = await open({ viewport: { width: w, height: 900 } }, lang, dark);
  const b = await btn(page);
  // a Tab walk from the page's start to the rail's first link
  let stops = 0, onBtn = false;
  for (; stops < 40; stops++) { await page.keyboard.press('Tab'); const at = await page.evaluate(() => [document.activeElement.id, document.getElementById('atIndex').querySelector('a') === document.activeElement]); if (at[0] === 'atIdxBtn') onBtn = true; if (at[1]) break; }
  report(!b.w && !b.h && !onBtn && stops < 40 && !errs.length, `${w}px ${lang} ${dark ? 'dark' : 'light'}: the Contents button ${b.w ? `SHOWS ${b.w}×${b.h}` : 'takes no box'}; a Tab walk ${onBtn ? 'STOPS ON IT' : 'passes no such stop'} on its way to the rail (${stops + 1} Tabs); errors ${errs.length}`);
  await ctx.close();
}
for (const [name, opts] of [['999px', { viewport: { width: 999, height: 800 } }], ['800px', { viewport: { width: 800, height: 900 } }], ['iPhone 13', devices['iPhone 13']]]) for (const [lang, dark] of [['en', false], ['he', true]]) {
  const { ctx, page, errs } = await open(opts, lang, dark);
  const b = await btn(page);
  if (opts.hasTouch) await page.locator('#atIdxBtn').tap(); else await page.locator('#atIdxBtn').click();
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => { const n = document.getElementById('atIndex'), r = n.getBoundingClientRect();
    return { open: n.classList.contains('open'), onScreen: r.left >= -1 && r.right <= innerWidth + 1, focus: n.querySelector('a') === document.activeElement, expanded: document.getElementById('atIdxBtn').getAttribute('aria-expanded') }; });
  report(b.w > 40 && b.h >= 24 && b.icon && b.label.trim().length > 2 && after.open && after.onScreen && after.focus && after.expanded === 'true' && !errs.length,
    `${name} ${lang} ${dark ? 'dark' : 'light'}: the button ${b.w}×${b.h} (icon ${b.icon ? 'yes' : 'NO'}, "${b.label.trim()}"); a press → drawer ${after.open && after.onScreen ? 'open on screen' : 'NOT OPEN'}, focus ${after.focus ? 'on its first link' : 'ELSEWHERE'}, aria-expanded ${after.expanded}; errors ${errs.length}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
