#!/usr/bin/env node
// S690 — "Continue where you left off" reopens the letter that was on screen, not Alef. The autosave record keeps
// {kind, cp} beside the project (UI state, never inside it) and the two Continue buttons hand it to
// applyProjectData, which selects it when the project still has it.
//
//   node scripts/loop/probes/S690-fontmaker-continue-reopens-the-open-letter.mjs   (ROOT=<tree> runs another copy)
//   EN light 1280 and HE dark 800: a new font through the wizard by real clicks (name, author, Next…, Create), a real click on
//   the Gimel tile, an outline given to Gimel and the autosave flushed (probe-only state), a reload, then the real
//   Continue button: the page must reopen on Gimel with its tile selected. Control: a reload that picks Alef first
//   reopens on Alef (the restore follows what was open, not a fixed letter). Exit 1 otherwise or on a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
const vis = (page, id) => page.evaluate(x => { const e = document.getElementById(x); return !!(e && !e.hidden && e.offsetParent); }, id);
async function tile(page, cp) {   // the Hebrew grid's tile for a code point, by its glyph
  const ch = String.fromCodePoint(parseInt(cp, 16));
  const tiles = await page.$$('#letterGrid .ltile');
  for (const t of tiles) if ((await t.$eval('.lt-heb', e => e.textContent)) === ch) return t;
  return null;
}
for (const [lang, dark, w] of [['en', false, 1280], ['he', true, 800]]) for (const pick of ['05D2', '05D0']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); localStorage.setItem('hebrewFontMaker_mobileWarnDismissed', '1'); } }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  const tag = `${lang} ${dark ? 'dark' : 'light'} ${w} pick ${pick}`;
  try {
    await page.goto(`${BASE}/Hebrew_Font_Maker.html`, { waitUntil: 'load' });
    await page.waitForSelector('#wizardOverlay.open', { timeout: 30000 });
    for (let i = 0; i < 12; i++) {
      if (!(await page.evaluate(() => !!document.querySelector('#wizardOverlay.open')))) break;
      if (await vis(page, 'wizName') && !(await page.inputValue('#wizName'))) await page.fill('#wizName', 'Probe Font');
      if (await vis(page, 'wizAuthor') && !(await page.inputValue('#wizAuthor'))) await page.fill('#wizAuthor', 'Probe');   // Next stays aria-disabled until both are filled
      if (await vis(page, 'wizCreate')) { await page.click('#wizCreate'); break; }
      if (await vis(page, 'wizNext')) await page.click('#wizNext'); else break;
      await page.waitForTimeout(250);
    }
    await page.waitForFunction(() => !document.querySelector('#wizardOverlay.open') && typeof project !== 'undefined' && project, null, { timeout: 30000 });
    await page.waitForTimeout(600);
    if (await page.isVisible('#tourCard').catch(() => false)) await page.click('#tourClose');
    const t = await tile(page, pick); if (!t) throw new Error('no tile ' + pick);
    if (pick !== '05D0') { await t.click(); await page.waitForTimeout(300); }
    else { const g = await tile(page, '05D2'); await g.click(); await page.waitForTimeout(200); await (await tile(page, '05D0')).click(); await page.waitForTimeout(300); }
    const before = await page.evaluate(() => curCp);
    await page.evaluate(async () => {   // probe-only state: an outline on the open letter, so the snapshot is worth continuing
      const l = project.letters.find(x => x.codepoint === curCp); l.contours = [{ winding: 'cw', points: [[100, 0], [100, 600], [500, 600], [500, 0]] }]; l.advance = l.advance || 600;
      markDirty(); await autosaveNow();
    });
    await page.reload({ waitUntil: 'load' });
    const cont = page.locator('.modal-btns button, .ask-btns button, button').filter({ hasText: lang === 'en' ? /^Continue$/ : /^(להמשיך|המשך|המשיכו)$/ });
    await cont.first().waitFor({ timeout: 30000 });
    await cont.first().click();
    await page.waitForFunction(() => typeof project !== 'undefined' && project && !document.querySelector('#wizardOverlay.open'), null, { timeout: 30000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const sel = document.querySelector('#letterGrid .ltile.sel .lt-heb');
      return { kind: curKind, cp: curCp, tile: sel ? sel.textContent.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') : null };
    });
    const ok = before === pick && r.kind === 'letter' && r.cp === pick && r.tile === pick && !errs.length;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag}: open before the reload ${before}; Continue reopened ${r.kind} ${r.cp}, tile ${r.tile}; errors ${errs.length} ${errs.slice(0, 1)}`);
  } catch (e) { fail++; console.log('FAIL', tag, e.message.split('\n')[0]); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
