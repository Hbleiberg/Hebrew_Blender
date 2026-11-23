#!/usr/bin/env node
// S676 — the Tefillah Trainer asked for its transliteration module only from the row's own switches and at load while
// the row was on. Include transliteration (a copy option) is stored, so a later visit with the row off copied every
// line without it and the copy bar said the module "could not be loaded" (it was never requested); a restored .ivrit
// file or an account download that turned the row on showed "No transliteration" the same way. renderText() now asks
// whenever the row or the copy's line wants it.
//
//   node scripts/loop/probes/S676-tefillah-translit-loads-for-a-stored-choice.mjs     exit 1 when a check fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S676 fails (a) and (b)).
//
// Offline by design: Sefaria is stubbed with ordinary vocabulary words from data/hebrew_words.json (never liturgical
// text), and the module's two CDN addresses answer with a fake module that passes the page's self-test and writes
// "tl" + an x per letter for each word, so a copied transliteration is recognisable. EN and HE UI:
//   (a) Include transliteration stored on, the row off: the module is requested, Copy All and a line's Copy carry it,
//       no prerequisite note;  (b) a fresh profile restores a file whose settings turn the row on: every row fills in;
//   (c) the control: defaults (both off) request nothing from either CDN through a load and a layout change;
//   (d) the CDNs blocked: the copy bar still says the module could not be loaded.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 30);
const LINES = [WORDS.slice(0, 10).join(' '), WORDS.slice(10, 20).join(' '), WORDS.slice(20, 30).join(' ')];
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } }] };
const ANSWER = { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: LINES }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] };
// The fake module: the page's self-test transliterates שָׁלוֹם and wants Latin letters back.
const FAKE = `export class SBL { constructor(o) { this.o = o || {}; } }
export function transliterate(s) { return String(s).split(/\\s+/).filter(Boolean).map(w => 'tl' + 'x'.repeat((w.match(/[\\u05D0-\\u05EA]/g) || []).length)).join(' '); }`;
const FAKE_SCHEMAS = 'export const brillAcademic = {};';
const CDN = /^https:\/\/(esm\.sh\/hebrew-transliteration|cdn\.jsdelivr\.net\/npm\/hebrew-transliteration)/;

const browser = await chromium.launch(); const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); };
async function openPage(lang, st, { block = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewTefillahTrainer_settings', JSON.stringify(c.st)); } }, { st, lang });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  const hits = { cdn: 0 };
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ANSWER) });
    if (CDN.test(u)) {
      hits.cdn++;
      if (block) return r.abort();
      return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: /schemas/.test(u) ? FAKE_SCHEMAS : FAKE });
    }
    return r.abort();
  });
  await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#ttReading [data-vk] .tt-word', { timeout: 20000 }); await page.waitForTimeout(1200);
  return { ctx, page, errors, hits };
}
const tlCount = s => (String(s).match(/\btlx+\b/g) || []).length;
async function copyAll(page) {
  await page.click('#gearBtn'); await page.click('#ttTabShare');
  const opener = page.locator('#ttTabPanelShare button[onclick="openCopyBarFromDrawer()"]'); await opener.scrollIntoViewIfNeeded(); await opener.click();
  await page.click('label.toggle:has(#ttCopyBulkCb) .slider');
  await page.click('#ttCopyBulkPanel button[onclick="selectAllVerses()"]');
  const note = await page.evaluate(() => { const n = document.getElementById('ttCopyPrereqNote'); return n && !n.hidden ? n.textContent : ''; });
  await page.click('#ttCopyAllBtn'); await page.waitForTimeout(400);
  return { note, text: await page.evaluate(() => navigator.clipboard.readText()) };
}
for (const lang of ['en', 'he']) {
  try {
    // (a)
    let o = await openPage(lang, { prayerKey: 'alpha', nusach: 'ashkenaz', copyIncludeTranslit: true });
    check(`${lang} (a) the module is requested`, o.hits.cdn > 0, `requests ${o.hits.cdn}`);
    let c = await copyAll(o.page);
    check(`${lang} (a) Copy All carries a transliteration for all 30 words`, tlCount(c.text) === 30, `tl tokens ${tlCount(c.text)}`);
    check(`${lang} (a) no prerequisite note`, !c.note, c.note);
    await o.page.click('#ttCopyBar button[onclick="closeCopyBar()"]');
    const lineBtn = o.page.locator('#ttReading .tt-copy').first(); await lineBtn.scrollIntoViewIfNeeded(); await lineBtn.click(); await o.page.waitForTimeout(400);
    check(`${lang} (a) a line's Copy carries it`, tlCount(await o.page.evaluate(() => navigator.clipboard.readText())) === 10, '');
    check(`${lang} (a) no page error`, !o.errors.length, o.errors.join(' | ').slice(0, 160));
    await o.ctx.close();
    // (b)
    const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 's676-')), 'restore.ivrit');
    fs.writeFileSync(file, JSON.stringify({ _ivritSuite: 1, format: 'ivrit-save', version: 1, tool: 'TefillahTrainer', savedAt: new Date().toISOString(), data: { favorites: {}, favoriteFolders: { v: 1, root: [] }, liveState: { prayerKey: 'alpha', nusach: 'ashkenaz', showTranslit: true } } }));
    o = await openPage(lang, { prayerKey: 'alpha', nusach: 'ashkenaz' });
    const before = o.hits.cdn;
    await o.page.click('#gearBtn'); await o.page.click('#ttTabMore');
    await o.page.setInputFiles('#ivritFileInput', file);
    await o.page.click('.ivrit-ask-btn[data-act="replace"]');
    await o.page.waitForTimeout(2500);
    const rows = await o.page.evaluate(() => [...document.querySelectorAll('#ttReading .tt-translit')].map(e => (e.textContent.match(/\btlx+\b/g) || []).length));
    const chip = await o.page.evaluate(() => !!document.querySelector('#ttReading .tt-notice-chip'));
    check(`${lang} (b) a restored row fills in: 3 rows of 10`, rows.length === 3 && rows.every(n => n === 10) && !chip, `rows ${JSON.stringify(rows)}, "No transliteration" chip ${chip}, requests ${before} → ${o.hits.cdn}`);
    check(`${lang} (b) no page error`, !o.errors.length, o.errors.join(' | ').slice(0, 160));
    await o.ctx.close();
    // (c)
    o = await openPage(lang, { prayerKey: 'alpha', nusach: 'ashkenaz' });
    await o.page.click('#gearBtn'); await o.page.click('#ttTabText');
    const side = o.page.locator('label[for="ttLayoutSide"]'); await side.scrollIntoViewIfNeeded(); await side.click(); await o.page.waitForTimeout(800);
    check(`${lang} (c) defaults: nothing requested from either CDN`, o.hits.cdn === 0 && await o.page.evaluate(() => settings.layout === 'sidebyside'), `requests ${o.hits.cdn}`);
    await o.ctx.close();
    // (d)
    o = await openPage(lang, { prayerKey: 'alpha', nusach: 'ashkenaz', copyIncludeTranslit: true }, { block: true });
    c = await copyAll(o.page);
    check(`${lang} (d) blocked: the copy bar says the module could not be loaded`, !!c.note && tlCount(c.text) === 0, `note "${c.note}", requests ${o.hits.cdn}`);
    check(`${lang} (d) no page error`, !o.errors.length, o.errors.join(' | ').slice(0, 160));
    await o.ctx.close();
  } catch (e) { check(`${lang}: ran`, false, String(e.message).split('\n')[0].slice(0, 200)); }
}
await browser.close(); server.close();
const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
console.log(`\n${checks.length - failed.length} / ${checks.length} checks pass`);
process.exit(failed.length ? 1 : 0);
