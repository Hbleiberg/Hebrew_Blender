#!/usr/bin/env node
// S663 — a blend setup keeps its practice type across the Real Words modes. Two ways it was lost, both in
// applySettings():
//  (a) the page remembers the Real Words drill last used (the Real Words button returns to it), so a blend setup
//      made after a visit to Number Practice is saved with rwDrillType 'numpractice' beside its own blend type;
//      that was handed to setRealWordDrill(), which switches the page into Number Practice — the remembered
//      2-Letter sheet, its preset and its share link all opened as a numbers sheet;
//  (b) the blend type lives only in its button's highlight, and setBlendType() ends in updateModeVisibility(),
//      which clears every blend button while a Real Words / Number Practice switch is still on — a 1-Letter
//      preset loaded while the page was in Real Words came back as 2-Letter.
// Per cell (EN light 1280, HE dark 800) × the four blend types, by real clicks: Real Words → Number Practice → the
// blend type; then (1) Save preset, Number Practice again, Load; (2) a reload; (3) Share, the link in a fresh
// browser. Each must show the blend type with Number Practice off; on 2-Letter the generated sheet is a blend
// sheet (two-letter cells with their sounds). The memory stays: Real Words afterwards returns to Number Practice.
// Then (4), on a fresh page that never saw Number Practice: the blend type, Save preset, Real Words (Reading),
// Load — the blend type again. Controls: a setup made in Number Practice still reloads as Number Practice (its
// sheet: number words, no sounds), and one saved before the drill was recorded (numberPractice alone) still
// opens Number Practice.
//
//   node scripts/loop/probes/S663-generator-blend-setup-keeps-its-practice-type.mjs
//   exit 1 on a setup that changed mode or type; ROOT=<a git archive of the tree> runs another copy (the tree
//   before this fix fails every preset, reload and link check of (1)-(3), and (4) on every type but 2-Letter,
//   which is the fallback it showed).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const PAGE = `${base}/hebrew_blend_generator.html`;
const CELLS = [{ lang: 'en', dark: '0', w: 1280 }, { lang: 'he', dark: '1', w: 800 }];
const browser = await chromium.launch();
let fails = 0, n = 0;
const say = (ok, msg) => { n++; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); };

async function open(cell, url, seed) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url())) ? r.continue() : r.abort());
  await ctx.addInitScript(([c, seed]) => {
    if (sessionStorage.getItem('__s663')) return; sessionStorage.setItem('__s663', '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); localStorage.setItem('hebrewBlender_tourSeen', '1');
    if (seed) for (const k in seed) localStorage.setItem(k, seed[k]);
  }, [cell, seed || null]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  page.setDefaultTimeout(8000);
  await page.goto(url || PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof getSettings === 'function' && typeof applySettings === 'function', null, { timeout: 15000 });
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
// what the page is set to: the saved fields and the highlighted practice-type button
const read = page => page.evaluate(() => { const s = getSettings(); return { type: s.blendType, np: s.numberPractice, rw: s.realWords, drill: s.rwDrillType, active: (document.querySelector('.blend-type-btn.active[data-type]') || { dataset: {} }).dataset.type }; });
const isBlend = (x, t) => x.type === t && x.active === t && x.np === false && x.rw === false;
const isNumbers = x => x.np === true && x.rw === false && x.active === 'realwords' && x.drill === 'numpractice';
const show = x => `${x.active}${x.np ? ' + Number Practice' : ''}`;
const settle = page => page.waitForTimeout(250);
const generate = async page => { await page.locator('#generateBtn').click(); await page.waitForFunction(() => document.querySelectorAll('#worksheet .blend-cell').length > 0, null, { timeout: 20000 }); return page.evaluate(() => [...document.querySelectorAll('#worksheet .blend-cell')].slice(0, 12).map(c => c.textContent)); };
const hebLetters = t => (t.match(/[א-ת]/g) || []).length;
const blendSheet = cells => cells.length > 0 && cells.every(t => hebLetters(t) === 2 && /[A-Za-z]/.test(t));      // two letters and their sound
const numberSheet = cells => cells.length > 0 && cells.every(t => !/[A-Za-z]/.test(t)) && cells.some(t => hebLetters(t) >= 4);   // number words

for (const cell of CELLS) {
  for (const t of ['two', 'one', 'three', 'nikud']) {
    const tag = `${cell.lang} ${cell.dark === '1' ? 'dark' : 'light'} ${cell.w} ${t}`;
    const { ctx, page, errs } = await open(cell);
    try {
      const themed = await page.evaluate(c => document.documentElement.lang === c.lang && document.body.classList.contains('dark') === (c.dark === '1'), cell);
      await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
      await page.locator('.rw-drill-btn[data-drill="numpractice"]').click(); await settle(page);
      const inNp = await read(page);
      await page.locator(`.blend-type-btn[data-type="${t}"]`).click(); await settle(page);
      const made = await read(page);
      say(themed && isNumbers(inNp) && isBlend(made, t) && made.drill === 'numpractice', `${tag}: the clicks went through Number Practice to the blend type (${show(made)}, the drill remembered: ${made.drill})`);

      // (1) preset
      await page.locator('#presetName').fill('S663 ' + t);
      await page.locator('#savePresetBtn').click(); await settle(page);
      await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
      const away = await read(page);
      await page.locator(`#presetList [data-ft-item="S663 ${t}"] button`).first().click(); await settle(page);
      const loaded = await read(page);
      say(isNumbers(away) && isBlend(loaded, t), `${tag}: the preset loads as the blend type (${show(loaded)})`);
      if (t === 'two') { const cells = await generate(page); say(blendSheet(cells), `${tag}: its sheet is a blend sheet (${JSON.stringify(cells.slice(0, 2))})`); }

      // (3) the share link, by the button, read before the reload
      await page.locator('#shareBtn').click(); await settle(page);
      const link = await page.evaluate(() => location.href);

      // (2) the remembered setup
      await page.goto(PAGE, { waitUntil: 'load' }); await page.waitForFunction(() => typeof getSettings === 'function'); await page.waitForTimeout(500);
      const back = await read(page);
      say(isBlend(back, t), `${tag}: a reload brings the blend setup back (${show(back)})`);
      // the memory is kept: Real Words returns to Number Practice, as it did before the reload
      await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
      const again = await read(page);
      say(isNumbers(again), `${tag}: Real Words still returns to Number Practice afterwards (${show(again)})`);
      say(errs.length === 0, `${tag}: 0 page errors${errs.length ? ' — ' + errs[0] : ''}`);
      await ctx.close();

      const fresh = await open(cell, link);
      const shared = await read(fresh.page);
      say(/[?&#]s=/.test(link) && isBlend(shared, t) && fresh.errs.length === 0, `${tag}: the share link opens as the blend type in a fresh browser (${show(shared)})`);
      await fresh.ctx.close();
    } catch (e) { say(false, `${tag}: a step could not run — ${String(e.message || e).split('\n')[0]}`); await ctx.close().catch(() => {}); }
  }

  // (4) no Number Practice anywhere: a blend preset loaded while the page is in Real Words (Reading)
  for (const t of ['two', 'one', 'three', 'nikud']) {
    const tag = `${cell.lang} ${cell.dark === '1' ? 'dark' : 'light'} ${cell.w} ${t} from Real Words`;
    const { ctx, page, errs } = await open(cell);
    try {
      await page.locator(`.blend-type-btn[data-type="${t}"]`).click(); await settle(page);
      const made = await read(page);
      await page.locator('#presetName').fill('S663 plain ' + t);
      await page.locator('#savePresetBtn').click(); await settle(page);
      await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
      const away = await read(page);
      await page.locator(`#presetList [data-ft-item="S663 plain ${t}"] button`).first().click(); await settle(page);
      const loaded = await read(page);
      say(isBlend(made, t) && made.drill === 'reading' && away.rw === true && away.active === 'realwords' && isBlend(loaded, t) && errs.length === 0, `${tag}: the preset loads as the blend type (${show(loaded)})`);
    } catch (e) { say(false, `${tag}: a step could not run — ${String(e.message || e).split('\n')[0]}`); }
    await ctx.close().catch(() => {});
  }

  // control 1: a setup made in Number Practice reloads as Number Practice, and its sheet is a numbers sheet
  {
    const tag = `${cell.lang} ${cell.dark === '1' ? 'dark' : 'light'} ${cell.w} control`;
    const { ctx, page, errs } = await open(cell);
    try {
      await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
      await page.locator('.rw-drill-btn[data-drill="numpractice"]').click(); await settle(page);
      await page.locator('#generateBtn').click(); await settle(page);
      await page.goto(PAGE, { waitUntil: 'load' }); await page.waitForFunction(() => typeof getSettings === 'function'); await page.waitForTimeout(500);
      const back = await read(page);
      const cells = await generate(page);
      say(isNumbers(back) && numberSheet(cells) && errs.length === 0, `${tag}: a Number Practice setup reloads as Number Practice with a numbers sheet (${show(back)}, ${JSON.stringify(cells.slice(0, 2))})`);
      // control 2: a preset from before the drill was recorded — numberPractice alone — still opens Number Practice
      const old = await page.evaluate(() => { const s = getSettings(); delete s.rwDrillType; return s; });
      await ctx.close();
      const o = await open(cell, PAGE, { hebrewBlender_lastState: JSON.stringify(old) });
      const legacy = await read(o.page);
      say(old.numberPractice === true && isNumbers(legacy) && o.errs.length === 0, `${tag}: a setup with Number Practice on and no drill recorded opens Number Practice (${show(legacy)})`);
      await o.ctx.close();
    } catch (e) { say(false, `${tag}: a step could not run — ${String(e.message || e).split('\n')[0]}`); await ctx.close().catch(() => {}); }
  }
}

await browser.close(); server.close();
console.log(`${n - fails} / ${n} checks: a blend setup keeps its practice type across the Real Words modes`);
process.exit(fails ? 1 : 0);
