#!/usr/bin/env node
// S663 — a Real Words setup keeps its display choices through a preset, the remembered setup and a share link.
// applySettings() restored Show Transliteration / Show Translation, their placements and Star Real Words, then
// called setRealWordDrill(), which gives a drill its default display state (what a click on the drill means): a
// preset that hid the transliteration, or put the translation on the worksheet, came back showing both on the
// answer key, and the next page leave wrote that into the remembered setup (signed in: into the account).
// Per cell (EN light 1280, HE dark 800) × four drills (Reading, Self-Check, Bingo, Identify — the three placement
// rows and the star row), by real clicks: Show Transliteration off, the translation's placement off its default
// (Identify: the star's too); then (1) Save preset, another drill, Load; (2) a reload (the remembered setup),
// the stored blob unchanged by a second reload; (3) Share, the link opened in a fresh browser. Each must show
// the choices as made. On Reading the sheet itself: translations on it, no transliteration (control: switched
// back on and placed on the worksheet, the same counter finds them). Two guards: a setup carrying another
// drill's placement keeps this drill's default, and one saved before the fields existed takes the defaults.
//
//   node scripts/loop/probes/S663-generator-realwords-display-choices-restore.mjs
//   exit 1 on a lost choice; ROOT=<a git archive of the tree> runs another copy (the tree before S663 fails
//   every preset, reload and link check).
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
const FIELDS = ['realWords', 'rwDrillType', 'rwShowTranslit', 'rwShowTranslation', 'rwTranslitPage', 'rwTranslPage', 'rwStarReal', 'rwStarPage'];
// drill → its placement row's class suffix, the translation placement to pick (never the drill's default), the star's
const DRILLS = [
  { drill: 'reading',  flavor: 'reading', transl: 'same',  def: 'key' },
  { drill: 'vocab',    flavor: 'vocab',   transl: 'front', def: 'back' },
  { drill: 'bingo',    flavor: 'bingo',   transl: 'card',  def: 'caller' },
  { drill: 'identify', flavor: 'reading', transl: 'same',  def: 'key', star: 'same' },
];
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
  await page.goto(url || PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => typeof getSettings === 'function' && typeof applySettings === 'function', null, { timeout: 15000 });
  await page.waitForTimeout(500);
  return { ctx, page, errs };
}
const read = page => page.evaluate(F => { const s = getSettings(), o = {}; F.forEach(k => o[k] = s[k]); return o; }, FIELDS);
const same = (a, b) => FIELDS.every(k => JSON.stringify(a[k]) === JSON.stringify(b[k]));
const diff = (a, b) => FIELDS.filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k])).map(k => `${k} ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`).join(', ') || 'as made';
const settle = page => page.waitForTimeout(250);

for (const cell of CELLS) for (const d of DRILLS) {
  const tag = `${cell.lang} ${cell.dark === '1' ? 'dark' : 'light'} ${cell.w} ${d.drill}`;
  const { ctx, page, errs } = await open(cell);
  page.setDefaultTimeout(8000);
  try {
  const themed = await page.evaluate(c => document.documentElement.lang === c.lang && document.body.classList.contains('dark') === (c.dark === '1'), cell);
  // the choices, by real clicks
  await page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(page);
  await page.locator(`.rw-drill-btn[data-drill="${d.drill}"]`).click(); await settle(page);
  const atDefault = await read(page);
  await page.locator('label.toggle:has(#rwShowTranslit)').click(); await settle(page);
  await page.locator(`.rw-transl-page-${d.flavor} [data-transl="${d.transl}"]`).click(); await settle(page);
  if (d.star) { await page.locator(`[data-star="${d.star}"]`).click(); await settle(page); }
  const made = await read(page);
  say(themed && made.realWords === true && made.rwDrillType === d.drill && atDefault.rwShowTranslit === true && made.rwShowTranslit === false && atDefault.rwTranslPage === d.def && made.rwTranslPage === d.transl && (!d.star || made.rwStarPage === d.star),
    `${tag}: the clicks made the choices (transliteration off, translation on "${made.rwTranslPage}"${d.star ? `, star on "${made.rwStarPage}"` : ''})`);

  // (1) preset: save, leave for another drill, load
  await page.locator('#presetName').fill('S663 ' + d.drill);
  await page.locator('#savePresetBtn').click(); await settle(page);
  await page.locator('.rw-drill-btn[data-drill="gematria"]').click(); await settle(page);
  const away = await read(page);
  await page.locator(`#presetList [data-ft-item="S663 ${d.drill}"] button`).first().click(); await settle(page);
  const loaded = await read(page);
  say(away.rwDrillType === 'gematria' && same(made, loaded), `${tag}: the preset loads its choices (${diff(made, loaded)})`);

  if (d.drill === 'reading') {
    const count = () => page.evaluate(() => { const ws = document.getElementById('worksheet'); return { cards: ws.querySelectorAll('.rw-card').length, tr: ws.querySelectorAll('.rw-card .rw-translit:not(.rw-flip-hint)').length, tn: ws.querySelectorAll('.rw-card .rw-translation').length }; });
    await page.locator('#generateBtn').click();
    await page.waitForFunction(() => document.querySelectorAll('#worksheet .rw-card').length > 0, null, { timeout: 20000 });
    const sheet = await count();
    say(sheet.cards > 0 && sheet.tr === 0 && sheet.tn > 0, `${tag}: the loaded preset's sheet carries ${sheet.tn} translations and ${sheet.tr} transliterations on ${sheet.cards} cards`);
    // control: the counter finds a transliteration once it is switched on and placed on the worksheet
    if (!(await page.evaluate(() => document.getElementById('rwShowTranslit').checked))) { await page.locator('label.toggle:has(#rwShowTranslit)').click(); await settle(page); }
    await page.locator('.rw-translit-page-reading [data-translit="same"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#worksheet .rw-card .rw-translit:not(.rw-flip-hint)').length > 0, null, { timeout: 20000 }).catch(() => {});
    const ctl = await count();
    say(ctl.tr > 0, `${tag}: control — switched on and placed on the worksheet, the same counter finds ${ctl.tr} transliterations`);
    // back to the choices as made, through the preset
    await page.locator(`#presetList [data-ft-item="S663 ${d.drill}"] button`).first().click(); await settle(page);
  }

  // (3) the share link, made by the button (the address bar takes it) — read before the reloads
  await page.locator('#shareBtn').click(); await settle(page);
  const link = await page.evaluate(() => location.href);

  // (2) the remembered setup: a reload restores it, and the stored blob is the same after a second reload
  await page.goto(PAGE, { waitUntil: 'load' }); await page.waitForFunction(() => typeof getSettings === 'function'); await page.waitForTimeout(500);
  const back = await read(page);
  const stored1 = await page.evaluate(() => localStorage.getItem('hebrewBlender_lastState'));
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction(() => typeof getSettings === 'function'); await page.waitForTimeout(500);
  const back2 = await read(page);
  const stored2 = await page.evaluate(() => localStorage.getItem('hebrewBlender_lastState'));
  let storedOk = false; try { const a = JSON.parse(stored1), b = JSON.parse(stored2); storedOk = same(made, a) && same(made, b); } catch (e) {}
  say(same(made, back) && same(made, back2), `${tag}: a reload brings the setup back as made (${diff(made, back)})`);
  say(storedOk, `${tag}: the remembered setup still holds the choices after two reloads`);
  say(errs.length === 0, `${tag}: 0 page errors${errs.length ? ' — ' + errs[0] : ''}`);
  await ctx.close();

  const fresh = await open(cell, link);
  const shared = await read(fresh.page);
  say(/[?&#]s=/.test(link) && same(made, shared) && fresh.errs.length === 0, `${tag}: the share link opens with the choices in a fresh browser (${diff(made, shared)})`);
  await fresh.ctx.close();
  } catch (e) { say(false, `${tag}: a step could not run — ${String(e.message || e).split('\n')[0]}`); await ctx.close().catch(() => {}); }   // a step that cannot run is a failed cell, not a crashed probe
}

// Guards, on a remembered setup edited by hand (EN light 1280): a real Bingo snapshot, then its fields changed.
{
  let o = await open(CELLS[0]);
  await o.page.locator('.blend-type-btn[data-type="realwords"]').click(); await settle(o.page);
  await o.page.locator('.rw-drill-btn[data-drill="bingo"]').click(); await settle(o.page);
  const snap = await o.page.evaluate(() => getSettings());
  await o.ctx.close();
  const mk = edit => { const c = JSON.parse(JSON.stringify(snap)); edit(c); return { hebrewBlender_lastState: JSON.stringify(c) }; };
  // another drill's placement ("key" belongs to the Worksheet / Answer Key row) must not land on Bingo
  o = await open(CELLS[0], PAGE, mk(c => { c.rwTranslitPage = 'key'; c.rwTranslPage = 'key'; }));
  let s = await read(o.page);
  say(snap.rwDrillType === 'bingo' && s.rwDrillType === 'bingo' && s.rwTranslitPage === 'caller' && s.rwTranslPage === 'caller' && o.errs.length === 0, `guard: Bingo keeps its own placement when the setup carries another row's (${s.rwTranslitPage} / ${s.rwTranslPage})`);
  await o.ctx.close();
  // a setup saved before the fields existed takes the drill's defaults
  o = await open(CELLS[0], PAGE, mk(c => { for (const k of ['rwShowTranslit', 'rwShowTranslation', 'rwTranslitPage', 'rwTranslPage', 'rwStarReal', 'rwStarPage']) delete c[k]; }));
  s = await read(o.page);
  say(s.rwDrillType === 'bingo' && s.rwShowTranslit === true && s.rwShowTranslation === true && s.rwTranslitPage === 'caller' && s.rwTranslPage === 'caller' && o.errs.length === 0, `guard: a setup without the fields takes Bingo's defaults (${s.rwShowTranslit}, ${s.rwTranslitPage})`);
  await o.ctx.close();
}

await browser.close(); server.close();
console.log(`${n - fails} / ${n} checks: a Real Words setup keeps its display choices`);
process.exit(fails ? 1 : 0);
