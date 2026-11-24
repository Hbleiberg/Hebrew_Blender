#!/usr/bin/env node
// S682 — the Trope Atlas's sign table fits its box between a phone and a wide window. It kept a min-width of 860px and
// its code points and rank on one line, so in a 700–859px box (windows of 750–900 and 1000–1140px, the contents rail
// beside it from 1000) it scrolled sideways by 10–150px and cut the "What it does" column. A container query on the
// box lets the code points and the rank wrap there and pads the cells 8px; a phone keeps the scroll, a wider box its
// one-line cells, and paper its own print rules.
//
//   node scripts/loop/probes/S682-atlas-sign-table-fits-between-phone-and-desktop.mjs
//   EN light / HE dark, the window every 20px from 320 to 1600. The web fonts are not fetched, and the fallback sans is
//   wider than Source Sans 3 (the English table needs 885px with it, before any fix), so the probe stands the local
//   Carlito in for Source Sans 3 (close in width) and asserts it loaded. The table exists (a handle check); in a
//   700–859px box it scrolls 0px and its last column is wholly
//   inside the box; a Hebrew name never wraps; a box of 860px or more scrolls 0px; a narrower one (a phone) keeps the
//   860px table. On paper the cells keep the print block's 6px padding. A plant (the 860px floor restored) must bring
//   the scroll back. 0 page errors. exit 1 when a step fails. ROOT=<a git archive of the tree> runs another copy (the
//   tree before S682 scrolls in every 700–859px box).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const READ = () => {
  const t = document.getElementById('atSigns'); if (!t) return null;
  const w = t.closest('.at-tablewrap'), wr = w.getBoundingClientRect();
  const last = [...t.querySelectorAll('tbody tr')].map(r => r.cells[r.cells.length - 1].getBoundingClientRect());
  const inside = last.every(r => r.left >= wr.left - 1 && r.right <= wr.right + 1);
  const nameWraps = [...t.querySelectorAll('td.at-hename')].filter(c => { const g = document.createRange(); g.selectNodeContents(c); return new Set([...g.getClientRects()].map(x => Math.round(x.top))).size > 1; }).length;
  return { box: w.clientWidth, over: w.scrollWidth - w.clientWidth, table: t.offsetWidth, inside, nameWraps };
};
for (const [lang, dark] of [['en', false], ['he', true]]) {
  const tag = `${lang} ${dark ? 'dark' : 'light'}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0'); }, { lang, dark });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/trope_atlas.html', { waitUntil: 'load' });
  await page.waitForFunction(l => document.documentElement.lang === l && document.getElementById('atSigns'), lang, { timeout: 15000 });
  await page.addStyleTag({ content: "@font-face{font-family:'Source Sans 3';src:local('Carlito Regular'),local('Carlito-Regular'),local('Carlito');font-weight:100 900;}" });
  const stand = await page.evaluate(async () => { try { await document.fonts.load("16px 'Source Sans 3'"); } catch (e) { /* the page's own (aborted) faces reject */ } await document.fonts.ready; return [...document.fonts].some(f => f.family.replace(/["']/g, '') === 'Source Sans 3' && f.status === 'loaded'); });
  ok(stand, `${tag}: the local stand-in for Source Sans 3 loaded (else the widths below mean nothing)`);
  await page.waitForTimeout(300);
  const mid = [], wide = [], phone = [], names = [];
  for (let vw = 320; vw <= 1600; vw += 20) {
    await page.setViewportSize({ width: vw, height: 900 }); await page.waitForTimeout(40);
    const r = await page.evaluate(READ);
    if (r.nameWraps) names.push(vw);
    if (r.box >= 700 && r.box < 860) mid.push({ vw, ok: r.over === 0 && r.inside, r });
    else if (r.box >= 860) wide.push({ vw, ok: r.over === 0, r });
    else phone.push({ vw, ok: r.table === 860, r });
  }
  const bad = a => a.filter(x => !x.ok).map(x => `${x.vw} (box ${x.r.box}, over ${x.r.over})`).join(', ') || 'none';
  ok(mid.length >= 12 && mid.every(x => x.ok), `${tag}: ${mid.length} windows with a 700–859px box: the table fits, its last column whole — failing: ${bad(mid)}`);
  ok(wide.length > 0 && wide.every(x => x.ok), `${tag}: ${wide.length} windows with a box of 860px or more fit — failing: ${bad(wide)}`);
  ok(phone.length > 0 && phone.every(x => x.ok), `${tag}: ${phone.length} narrower windows keep the 860px table (a phone scrolls it) — failing: ${bad(phone)}`);
  ok(names.length === 0, `${tag}: a Hebrew name wraps at ${names.length ? names.join(', ') + 'px' : 'no width'}`);
  // the plant: the 860px floor back — the 1000px window must scroll again
  await page.setViewportSize({ width: 1000, height: 900 }); await page.waitForTimeout(60);
  const st = await page.evaluate(() => { const s = document.createElement('style'); s.id = 'plant'; s.textContent = 'table.at-signs:not(.at-small){min-width:860px!important}'; document.head.appendChild(s); });
  const planted = await page.evaluate(READ);
  await page.evaluate(() => document.getElementById('plant').remove());
  ok(planted.over > 0, `${tag} plant (the 860px floor restored at 1000px): the table scrolls ${planted.over}px`);
  await page.emulateMedia({ media: 'print' });
  const pad = await page.evaluate(() => getComputedStyle(document.querySelector('#atSigns td')).paddingInlineStart);
  ok(pad === '6px', `${tag} on paper: a cell pads ${pad} (the print block's 6px)`);
  ok(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
