#!/usr/bin/env node
// S576 — Dashboard: Bulk preset edit opens with a screenful of cards and builds the rest a chunk per task (pattern
// offscreen-sheets-laid-out-on-every-rebuild; content-visibility:auto is ruled out here because Chromium leaves a
// skipped card out of the accessibility tree). Built in one go, 100 presets made one ~1.1 s task at 4× CPU.
//
//   node scripts/loop/probes/S576-dashboard-bulk-edit-builds-in-chunks.mjs     exit 1 when, with 200 presets at 4×
//                                                                              CPU, the open (a real click) holds a
//                                                                              task over 400 ms; or a master switch or
//                                                                              Copy to all clicked mid-build misses a
//                                                                              card; or Cancel mid-build leaves a card;
//                                                                              or the cards or the accessibility tree
//                                                                              lack one; or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before e6808987 holds one task of
//   ~2.8 s and builds every card before the second click); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const N = 200;
const browser = await chromium.launch();
const rec = []; let fails = 0;
const check = (name, ok, note) => { rec.push({ name, ok, note }); if (!ok) fails++; if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}  ${note}`); };
async function cell() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
    if (sessionStorage.getItem('__seeded')) return; sessionStorage.setItem('__seeded', '1');
    localStorage.setItem('hebrewDashboard_tourSeen', '1'); localStorage.setItem('hebrewDashboard_setupSeen', '1');
  });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('dialog', d => d.accept());
  const settle = async () => { await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 30000 }); await page.evaluate(() => I18n.ready); await page.waitForTimeout(800); };
  await page.goto(base + '/classroom_dashboard.html', { waitUntil: 'load' }); await settle();
  await page.evaluate((N) => {
    const b = getSettings({ forPreset: true }); const p = {};
    for (let i = 0; i < N; i++) { const s = JSON.parse(JSON.stringify(b)); s.dashTextHTML = `<b>Period ${i + 1}</b> — practise <span style="color:#c00">א ב ג</span>`; s.showOmerCounter = i % 2 === 0; p['Class ' + (i + 1)] = s; }
    localStorage.setItem('hebrewDashboard_presets', JSON.stringify(p));
  }, N);
  await page.reload({ waitUntil: 'load' }); await settle();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.click('#gearBtn'); await page.waitForTimeout(400); await page.click('#dashTabPresets'); await page.waitForTimeout(300);
  return { ctx, page, errs };
}
const count = page => page.evaluate(() => document.querySelectorAll('#bpeCards .bpe-card').length);
const allBuilt = page => page.waitForFunction((N) => document.querySelectorAll('#bpeCards .bpe-card').length === N, N, { timeout: 60000, polling: 50 });
{ // the open's longest task, then a master switch mid-build
  const { ctx, page, errs } = await cell();
  await page.evaluate(() => { window.__lt.length = 0; });
  await page.click('#bulkPresetBtn');
  const atOpen = await count(page);
  await page.locator('#bpeMaster .bpe-mchip input[type=checkbox]').first().click();
  const atSwitch = await count(page);
  await allBuilt(page); await page.waitForTimeout(300);
  const lt = await page.evaluate(() => Math.max(0, ...window.__lt));
  check('the open holds no task over 400 ms (4x, 200 presets)', lt <= 400, `longest ${lt} ms; ${atOpen} cards in the click`);
  const r = await page.evaluate(() => { const m = document.querySelector('#bpeMaster .bpe-mchip input[type=checkbox]'); const it = BPE_GROUPS[0].items[0]; const cards = [...document.querySelectorAll('#bpeCards .bpe-card')]; return { want: m.checked, chips: cards.map(c => c.querySelector('.bpe-chip[data-key="' + it.key + '"] input')).filter(Boolean).filter(cb => cb.checked === m.checked).length }; });
  check('a master switch clicked mid-build reaches every card', atSwitch < N && r.chips === N, `${atSwitch} built at the click; ${r.chips}/${N} chips follow it`);
  const ax = (await cdp(page)).filter(x => !x.ignored && x.role && x.role.value === 'textbox' && x.name && /^Class \d+$/.test(x.name.value)).length;
  check('the accessibility tree names every card editor', ax === N, `${ax}/${N}`);
  check('no page error (open + switch)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
async function cdp(page) { const s = await page.context().newCDPSession(page); return (await s.send('Accessibility.getFullAXTree')).nodes; }
{ // Copy to all mid-build
  const { ctx, page, errs } = await cell();
  await page.click('#bulkPresetBtn');
  await page.locator('#bpeCards .bpe-card').first().locator('.bpe-row button').first().click();
  const atCopy = await count(page);
  await allBuilt(page); await page.waitForTimeout(300);
  const same = await page.evaluate(() => { const eds = [...document.querySelectorAll('#bpeCards .bpe-editor')]; return eds.filter(e => e.innerHTML === eds[0].innerHTML).length; });
  check('Copy to all clicked mid-build reaches every editor', atCopy < N && same === N, `${atCopy} built at the click; ${same}/${N} editors`);
  check('no page error (copy)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
{ // Cancel mid-build, then a reopen
  const { ctx, page, errs } = await cell();
  await page.click('#bulkPresetBtn');
  const atCancel = await count(page);
  await page.click('#bpeModal .fr-close'); await page.waitForTimeout(2500);
  const left = await page.evaluate(() => document.querySelectorAll('#bpeCards *').length);
  check('Cancel mid-build leaves no card behind', atCancel < N && left === 0, `${atCancel} built at Cancel; ${left} nodes 2.5 s later`);
  await page.click('#bulkPresetBtn'); await allBuilt(page); await page.waitForTimeout(1500);
  const ids = await page.evaluate(() => { const e = [...document.querySelectorAll('#bpeCards .bpe-editor')].map(x => x.id); return { n: e.length, uniq: new Set(e).size }; });
  check('a reopen builds every card once', ids.n === N && ids.uniq === N, JSON.stringify(ids));
  check('no page error (cancel + reopen)', errs.length === 0, errs.join(' | '));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(fails ? `${fails} check(s) fail` : 'all checks pass');
process.exit(fails ? 1 : 0);
