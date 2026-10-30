#!/usr/bin/env node
// S576 — Flash Cards on a first visit, while the ~3 MB dictionary downloads (held 2.5 s here): a pasted share code
// for an All Dictionary deck starts once the file lands, and the "Dictionary still loading" Start note clears when
// the file lands or the deck stops using it. The code is made by real clicks in a teacher profile (Generate Share
// Code); every other step is a real click in a fresh profile.
//
//   node scripts/loop/probes/S576-flash-dictionary-wait.mjs     exit 1 unless: Load starts the drill with one start
//          and the dictionary deck; a reader who taps Numbers before the file lands gets no drill and no stale note;
//          Start's note clears (Start enabled) once the file lands, and at once on My Word Lists; 0 page errors
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before 5584ef2b / 7e510fd6 stays
//   on setup under "still loading"); --json prints the record.
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
const browser = await chromium.launch();
const errs = [];
async function open(hold) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) return r.abort();
    if (hold && u.includes('/data/hebrew_words.json')) await new Promise(res => setTimeout(res, hold));
    return r.continue();
  });
  await ctx.addInitScript(() => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); });
  const page = await ctx.newPage(); page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  page.on('dialog', d => d.accept());
  await page.goto(base + '/flash_cards.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang); await page.evaluate(() => I18n.ready); await page.waitForTimeout(500);
  await page.evaluate(() => { const o = window.resetSessionStats; window.__starts = 0; window.resetSessionStats = function () { window.__starts++; return o.apply(this, arguments); }; });
  return { ctx, page };
}
async function teacherTools(page) {
  const h = page.locator('h3[data-i18n="flashcards.teachertools.panel_title"]');
  if (await h.evaluate(el => el.closest('.panel').classList.contains('collapsed'))) await h.click();
}
const dictDeck = async page => { await page.click('#otherModePill'); await page.click('#otherSubPills .pill[data-sub="words"]'); await page.click('#wordsSourcePills .pill[data-wsource="alldict"]'); };
const state = page => page.evaluate(() => { const n = document.getElementById('startNote'); return { screen: document.querySelector('.screen.active').id, starts: window.__starts, note: n && n.style.display !== 'none' ? n.textContent.slice(0, 40) : '', startDisabled: document.getElementById('startBtn').getAttribute('aria-disabled'), deck: `${otherModeActive}/${otherSubMode}/${wordsSource}` }; });
// the teacher's code
const t = await open(0);
await dictDeck(t.page); await t.page.waitForFunction(() => !!ALL_WORDS_DATA, null, { timeout: 30000 });
await teacherTools(t.page); await t.page.click('#generateShareBtn');
const code = await t.page.inputValue('#shareCodeOutput'); await t.ctx.close();
const rec = []; let fails = 0;
const check = (name, ok, note) => { rec.push({ name, ok, note }); if (!ok) fails++; if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}  ${note}`); };
{ const { ctx, page } = await open(2500); await teacherTools(page); await page.fill('#shareCodeInput', code); await page.click('#applyShareBtn'); await page.waitForTimeout(5000);
  const s = await state(page); check('a pasted All Dictionary code starts once the file lands', s.screen === 'screenCard' && s.starts === 1 && s.deck === 'true/words/alldict', JSON.stringify(s)); await ctx.close(); }
{ const { ctx, page } = await open(2500); await teacherTools(page); await page.fill('#shareCodeInput', code); await page.click('#applyShareBtn'); await page.click('#otherSubPills .pill[data-sub="numbers"]'); await page.waitForTimeout(5000);
  const s = await state(page); check('Numbers tapped before the file lands: no drill, no stale note', s.screen === 'screenSetup' && s.starts === 0 && s.note === '', JSON.stringify(s)); await ctx.close(); }
{ const { ctx, page } = await open(2500); await dictDeck(page); await page.click('#startBtn', { force: true }); const s0 = await state(page); await page.waitForTimeout(5000);
  const s = await state(page); check("Start's \"still loading\" note clears once the file lands", s0.note !== '' && s.note === '' && s.startDisabled === 'false', `at Start "${s0.note}"; then ${JSON.stringify(s)}`); await ctx.close(); }
{ const { ctx, page } = await open(2500); await dictDeck(page); await page.click('#startBtn', { force: true }); const s0 = await state(page); await page.click('#wordsSourcePills .pill[data-wsource="mylists"]');
  const s = await state(page); check('the note clears at once on My Word Lists', s0.note !== '' && s.note === '', `at Start "${s0.note}"; then ${JSON.stringify(s)}`); await ctx.close(); }
check('no page error', errs.length === 0, errs.join(' | '));
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
else console.log(fails ? `${fails} check(s) fail` : 'all checks pass');
process.exit(fails ? 1 : 0);
