#!/usr/bin/env node
// S671 (found by pass H on the Trope Atlas, its 2nd H) — a contents link to a melody or a reading scrolled to the
// Phrase patterns section's own intro, so the melody the teacher picked started at the window's foot (its first
// pattern cut: 639 of 768 at 1366×768) and the focus stayed in the rail (the S665 P4: the next Tab was the rail's next
// link). The same address opened cold landed on the melody's heading. The click now lands there too and moves the
// focus to the heading, so the next Tab is the melody's own (its source mark, then its groups).
//   1366×768 EN light / HE dark and 800×1000 (the drawer) EN dark / HE light × a click on a melody link, a click on a
//   reading link and Enter on a melody link: the heading within 24px under the bar, the first pattern whole on screen,
//   the focus on the heading, and after Enter the next Tab in the melody's own content (its source mark or a group
//   chip); each click lands within 2px of where its address lands cold.
//
//   node scripts/loop/probes/S671-atlas-melody-link-lands-on-its-melody.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S671 fails every landing and focus cell)
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
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };

async function open(w, h, lang, dark, hash = '') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: dark ? 'dark' : 'light', serviceWorkers: 'block' });
  await ctx.addInitScript((lang) => { try { localStorage.setItem('hebrewBlender_lang', lang); } catch (e) {} }, lang);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/trope_atlas.html${hash}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#atPhraseRows [data-sing]').length > 0 && document.querySelectorAll('#atIndex a[href^="#sys-"]').length > 5, null, { timeout: 30000 });
  await settle(page);
  return { ctx, page, errors };
}
async function settle(page) {   // smooth scroll: wait until the window has held still for 300ms
  let last = -1, still = 0;
  for (let i = 0; i < 80 && still < 3; i++) { const y = await page.evaluate(() => scrollY); still = y === last ? still + 1 : 0; last = y; await page.waitForTimeout(100); }
}
const where = (page, id) => page.evaluate((id) => {
  const head = document.getElementById('sys-' + id), staff = document.querySelector('#atPhraseRows [data-sing]');
  const bar = document.getElementById('atBar').getBoundingClientRect().bottom;
  return { head: head ? head.getBoundingClientRect().top - bar : null, staffBottom: staff ? staff.getBoundingClientRect().bottom : null, vh: innerHeight,
    focus: document.activeElement ? document.activeElement.id : null, mel: document.getElementById('atMel').value };
}, id);
async function viaRail(page, w, href, how) {
  if (w < 1000) { await page.locator('#atIdxBtn').click(); await page.waitForTimeout(250); }
  const a = page.locator(`#atIndex a[href="${href}"]`);
  if (how === 'enter') { await a.focus(); await page.keyboard.press('Enter'); } else await a.click();
  await page.waitForTimeout(150); await settle(page);
}
const CELLS = [[1366, 768, 'en', false], [1366, 768, 'he', true], [800, 1000, 'en', true], [800, 1000, 'he', false]];
for (const [w, h, lang, dark] of CELLS) {
  const tag = `${w} ${lang} ${dark ? 'dark' : 'light'}`;
  const { ctx, page, errors } = await open(w, h, lang, dark);
  for (const [href, id, how] of [['#sys-cons_haftarah', 'cons_haftarah', 'click'], ['#grp-esther', 'esther', 'click'], ['#sys-je_torah_sp', 'je_torah_sp', 'enter']]) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await settle(page);
    await viaRail(page, w, href, how);
    const r = await where(page, id);
    report(r.mel === id, `${tag} ${how} ${href}: the melody is ${r.mel}`);
    report(r.head != null && r.head >= 0 && r.head <= 24, `${tag} ${how} ${href}: its heading ${r.head == null ? 'missing' : Math.round(r.head) + 'px'} under the bar`);
    report(r.staffBottom != null && r.staffBottom <= r.vh, `${tag} ${how} ${href}: the first pattern ends at ${Math.round(r.staffBottom)} of ${r.vh}`);
    report(r.focus === 'sys-' + id, `${tag} ${how} ${href}: focus on ${r.focus || 'body'}`);
    if (how === 'enter') {
      await page.keyboard.press('Tab');
      const nxt = await page.evaluate(() => { const a = document.activeElement; return { own: !!a.closest('#atMelInfo, #atClauses'), rail: !!a.closest('#atIndex'), txt: (a.textContent || '').trim().slice(0, 30) }; });
      report(nxt.own && !nxt.rail, `${tag} then Tab: ${nxt.rail ? 'the rail' : nxt.own ? "the melody's own (its source mark or a group chip)" : 'elsewhere'} (${nxt.txt})`);
    } else {
      const cold = await open(w, h, lang, dark, href);
      const c = await where(cold.page, id);
      report(c.head != null && Math.abs(c.head - r.head) <= 2, `${tag} ${href}: the click lands ${Math.round(r.head)}px, its address cold ${c.head == null ? 'missing' : Math.round(c.head) + 'px'}`);
      await cold.ctx.close();
    }
  }
  report(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(`${cells - fails}/${cells} pass`);
process.exit(fails ? 1 : 0);
