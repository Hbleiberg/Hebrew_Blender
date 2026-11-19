#!/usr/bin/env node
// S664 — Trope Atlas: a contents link to a reading (Torah, Haftarah, High Holidays, Esther, Eicha, the Megillot) carries
// the address #grp-<reading>. Its click opens that reading's first melody in the phrase browser; the same address
// opened in a new tab (Ctrl / middle click, "Open link in new tab") or sent to someone landed at the top of the page
// on the Torah melody, because nothing on the page has that id.
//   address cells — each reading's address × EN light 1280 / HE dark 800: the phrase browser shows the reading's first
//                   melody (the one its contents link's click picks), the page is scrolled to it under the bar, the
//                   contents rail marks it, and nothing is stored (like a #sys-<id> address);
//   new-tab cells — a real Ctrl+click and a real middle click on a contents link (a reading's and a melody's): a new
//                   tab opens and lands the same way, and the first tab keeps its melody (the click handler used to
//                   take a Ctrl+click for a plain one and switch the melody in place, opening nothing);
//   guards        — an unknown reading lands nowhere without an error; #sys-<id>, #atlas-<sign> and #sources land as
//                   before; a plain click on the link still opens the melody in place and stores it.
//
//   node scripts/loop/probes/S664-atlas-reading-link-lands-on-its-melodies.mjs      exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S664 fails every address and new-tab cell).
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
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const READINGS = ['torah', 'haftarah', 'hhd', 'esther', 'eicha', 'megillot'];
const KEY = 'hebrewTropeAtlas_settings';

async function context(c) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { if (localStorage.getItem('__s664')) return; localStorage.setItem('__s664', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, [c.lang, c.dark]);   // a new tab starts on about:blank, which has no storage
  const errs = [];
  ctx.on('page', (p) => p.on('pageerror', (e) => errs.push(String(e.message || e))));
  return { ctx, errs };
}
// the charts drawn and the scroll at rest
async function landed(page) {
  await page.waitForFunction(() => document.querySelectorAll('#atPhraseRows svg.tu-pstaff').length > 0 && document.querySelectorAll('#atTable svg.tu-pstaff').length > 100, null, { timeout: 30000 });
  let last = -1;
  for (let i = 0; i < 40; i++) { const y = await page.evaluate(() => Math.round(scrollY)); if (y === last) break; last = y; await page.waitForTimeout(150); }
}
const read = (page) => page.evaluate((KEY) => {
  const mel = document.getElementById('atMel').value, head = document.getElementById('sys-' + mel);
  const bar = document.getElementById('atBar').getBoundingClientRect().bottom;
  const cur = [...document.querySelectorAll('#atIndex a.cur')].map((a) => a.getAttribute('href'));
  const first = {};
  for (const a of document.querySelectorAll('#atSysIdx > li.g > a')) { const sub = a.parentElement.querySelector(':scope > ul a'); first[a.getAttribute('href').slice(5)] = sub ? sub.getAttribute('href').slice(5) : null; }
  return { mel, top: head ? Math.round(head.getBoundingClientRect().top) : null, bar: Math.round(bar), y: Math.round(scrollY), cur, first, stored: localStorage.getItem(KEY), hash: location.hash, staffs: document.querySelectorAll('#atPhraseRows svg.tu-pstaff').length };
}, KEY);
const onIt = (r) => r.top !== null && r.top >= r.bar - 4 && r.top < 450;

for (const c of CELLS) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  for (const g of READINGS) {
    const { ctx, errs } = await context(c);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trope_atlas.html#grp-${g}`, { waitUntil: 'load' });
    await landed(page);
    const r = await read(page), want = r.first[g];
    report(!!want && r.mel === want && onIt(r) && r.cur.includes('#sys-' + want) && r.stored === null && r.staffs > 0 && errs.length === 0,
      `${tag} #grp-${g}: melody ${r.mel} (want ${want}), its heading at ${r.top} under the bar's ${r.bar}, rail marks ${JSON.stringify(r.cur)}, stored ${r.stored}, errors ${errs.length} ${errs.join(' | ').slice(0, 200)}`);
    await ctx.close();
  }
  // a real Ctrl+click and a real middle click on a contents link open its address in a new tab, which lands
  for (const [g, how, opt] of [['haftarah', 'Ctrl+click', { modifiers: ['Control'] }], ['megillot', 'middle click', { button: 'middle' }], ['sys-esther', 'Ctrl+click', { modifiers: ['Control'] }]]) {
    const { ctx, errs } = await context(c);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' });
    await landed(page);
    if (c.w < 1000) { await page.locator('#atIdxBtn').click(); await page.waitForTimeout(350); }
    const href = g.startsWith('sys-') ? '#' + g : '#grp-' + g;
    const before = await read(page);
    let tab = null;
    try { [tab] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), page.locator(`#atSysIdx a[href="${href}"]`).click(opt)]); } catch (e) {}
    if (!tab) { report(false, `${tag} ${how} on the ${href} contents link: no new tab opened`); await ctx.close(); continue; }
    await tab.waitForLoadState('load'); await tab.bringToFront();
    await landed(tab);
    const r = await read(tab), want = g.startsWith('sys-') ? g.slice(4) : r.first[g], here = await read(page);
    report(r.hash === href && !!want && r.mel === want && onIt(r) && here.mel === before.mel && here.stored === before.stored && errs.length === 0,
      `${tag} ${how} on the ${href} contents link: the new tab at ${r.hash} shows ${r.mel} (want ${want}), heading at ${r.top} under ${r.bar}; the first tab keeps ${here.mel}; errors ${errs.length} ${errs.join(' | ').slice(0, 160)}`);
    await ctx.close();
  }
  // guards
  {
    const { ctx, errs } = await context(c);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/trope_atlas.html#grp-nosuch`, { waitUntil: 'load' }); await landed(page);
    let r = await read(page);
    report(r.mel === 'torah' && r.y === 0 && r.stored === null && errs.length === 0, `${tag} guard, an unknown reading: melody ${r.mel}, scrollY ${r.y}, stored ${r.stored}, errors ${errs.length}`);
    await page.goto(`${BASE}/trope_atlas.html#sys-esther`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await landed(page);
    r = await read(page);
    report(r.mel === 'esther' && onIt(r) && r.stored === null, `${tag} guard, #sys-esther: melody ${r.mel}, heading at ${r.top} under ${r.bar}, stored ${r.stored}`);
    await page.goto(`${BASE}/trope_atlas.html#atlas-etnachta`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await landed(page);
    const row = await page.evaluate(() => { const t = document.getElementById('atlas-etnachta').getBoundingClientRect(); return { top: Math.round(t.top), focus: document.activeElement && document.activeElement.id }; });
    report(row.top > 0 && row.top < 900 && row.focus === 'atlas-etnachta', `${tag} guard, #atlas-etnachta: its row at ${row.top}, focus on ${row.focus}`);
    await page.goto(`${BASE}/trope_atlas.html#sources`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await landed(page);
    const src = await page.evaluate(() => Math.round(document.getElementById('sources').getBoundingClientRect().top));
    report(src > 0 && src < 900, `${tag} guard, #sources: the section at ${src}`);
    // a plain click still opens the melody in place and stores it
    await page.goto(`${BASE}/trope_atlas.html`, { waitUntil: 'load' }); await page.reload({ waitUntil: 'load' }); await landed(page);
    if (c.w < 1000) { await page.locator('#atIdxBtn').click(); await page.waitForTimeout(350); }
    await page.locator('#atSysIdx > li.g > a[href="#grp-eicha"]').click(); await landed(page);
    r = await read(page);
    const st = r.stored ? JSON.parse(r.stored) : {};
    report(r.mel === r.first.eicha && onIt(r) && st.mel === r.first.eicha && r.hash === '#sys-' + r.first.eicha && errs.length === 0,
      `${tag} guard, a plain click on the Eicha link: melody ${r.mel}, heading at ${r.top}, stored mel ${st.mel}, address ${r.hash}, errors ${errs.length}`);
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
