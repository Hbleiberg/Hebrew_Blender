#!/usr/bin/env node
// S678 — the Tefillah and Torah Trainers' fullscreen bar: a switched-on Translit / Translation button (white 14.4px bold on
// a white fill over the navy plate) read 4.18:1 in light mode, under the pointer too (S675 C, S653 M). The fill is now
// .18, not .24; the gold border and the gold underline still mark the state.
//
//   node scripts/loop/probes/S678-fullscreen-reveal-pressed-keeps-its-contrast.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S678 fails the light cells).
//
// Offline: S678's translation probe's fixtures (Sefaria stubbed with vocabulary words and the repo's MAM phrases, a fake
// transliteration module), both rows on. Both pages × EN / HE × light / dark, fullscreen entered by a click on the
// header's button: each pressed button screenshotted with the pointer away from it and resting on it; its lightest fill
// pixel (the button's top band, inside its border, above the word) against the word's white must reach 4.5:1. Guards: both
// buttons are aria-pressed, the word is white, the gold underline is still drawn, the unpressed A+ keeps 4.5:1, no page
// error.
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

// The Tefillah fixture: three pointed lines and one unpointed (an instruction), with an English line for each.
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 24);
const unpoint = s => [...s].filter(c => !isPoint(c)).join('');
const HE_LINES = [WORDS.slice(0, 8).join(' '), unpoint(WORDS.slice(8, 11).join(' ')), WORDS.slice(11, 18).join(' '), WORDS.slice(18, 24).join(' ')];
const EN_LINES = ['The first line, in English.', 'An instruction, in English.', 'The second line, in English.', 'The third line, in English.'];
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } }] };
const AVAIL = [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }, { language: 'en', actualLanguage: 'en', versionTitle: 'An Open Translation', license: 'CC0' }];
const tefillahAnswer = u => {
  const en = /^english/.test(new URL(u).searchParams.get('version') || '');
  return { versions: [en ? { language: 'en', versionTitle: 'An Open Translation', license: 'CC0', versionSource: 'https://example.invalid/en', text: EN_LINES }
                         : { language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/he', text: HE_LINES }], available_versions: AVAIL };
};
// The Torah fixture: S571's.
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const verses = rows.slice(0, 6).flatMap(r => r.ex.map(e => e.he)).slice(0, 12);
const torahAnswer = u => u.includes('/v3/texts/') ? { versions: [{ language: 'he', text: verses }, { language: 'en', text: verses.map((_, i) => `Verse ${i + 1}.`) }], sections: ['1', '1'] } : u.includes('/calendars') ? { calendar_items: [] } : [];
const FAKE = `export class SBL { constructor(o) { this.o = o || {}; } }
export function transliterate(s) { return String(s).split(/\\s+/).filter(Boolean).map(w => 'tl' + 'x'.repeat((w.match(/[\\u05D0-\\u05EA]/g) || []).length)).join(' '); }`;
const FAKE_SCHEMAS = 'export const brillAcademic = {};';
const CDN = /^https:\/\/(esm\.sh\/hebrew-transliteration|cdn\.jsdelivr\.net\/npm\/hebrew-transliteration)/;

const PAGES = [
  { page: 'tefillah_trainer.html', key: 'hebrewTefillahTrainer_settings', tour: 'hebrewTefillahTrainer_tourSeen', seed: { prayerKey: 'alpha', nusach: 'ashkenaz' }, answer: tefillahAnswer, catalog: true },
  { page: 'torah_trainer.html', key: 'hebrewTorahTrainer_settings', tour: 'hebrewTorahTrainer_tourSeen', seed: { parshahKey: 'Bereshit', scope: 'parsha-full' }, answer: torahAnswer, catalog: false },
];
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const browser = await chromium.launch(); const records = [];
const decoder = await browser.newPage();
// The lightest pixel of the fill's top band (inside the border, clear of its rounded corners, above the word) of a PNG, and whether a gold pixel sits in the bottom 3 rows.
const scan = (png, inset) => decoder.evaluate(async ([b64, inset]) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height;
  const L = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let best = null;   // x from 12px: clear of the 10px corners' gold border
  for (let y = inset; y < Math.floor(H * 0.3); y++) for (let i = 12; i < W - 12; i++) { const k = (y * W + i) * 4, p = [d[k], d[k + 1], d[k + 2]]; if (!best || L(...p) > L(...best)) best = p; }
  let gold = false;
  for (let y = H - 4; y < H - 1; y++) for (let i = inset * 2; i < W - inset * 2; i++) { const k = (y * W + i) * 4; if (d[k] > 150 && d[k] - d[k + 2] > 60) gold = true; }
  return { best, gold, W, H };
}, [png.toString('base64'), inset]);
for (const P of PAGES) for (const lang of ['en', 'he']) for (const dark of [false, true]) {
  const rec = { cell: `${P.page} ${lang} ${dark ? 'dark' : 'light'}`, notes: [], r: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(c => { try { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0'); localStorage.setItem('hebrewBlender_pwaDismissed', '1'); localStorage.setItem(c.tour, '1'); localStorage.setItem(c.key, JSON.stringify(c.st)); } catch (e) {} },
    { lang, dark, tour: P.tour, key: P.key, st: { ...P.seed, showTranslit: true, showTranslation: true } });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (P.catalog && u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(P.answer(u)) });
    if (CDN.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: /schemas/.test(u) ? FAKE_SCHEMAS : FAKE });
    return r.abort();
  });
  try {
    await page.goto(`${BASE}/${P.page}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => /tlx/.test((document.getElementById('ttReading') || {}).textContent || ''), null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    await page.mouse.move(640, 200);
    await page.click('#fsBtn'); await page.waitForTimeout(700);
    need(await page.evaluate(() => document.body.classList.contains('fullscreen')), 'fullscreen did not start');
    for (const id of ['ttFsTranslit', 'ttFsTranslation']) {
      const b = page.locator('#' + id);
      const facts = await b.evaluate(e => ({ pressed: e.getAttribute('aria-pressed'), color: getComputedStyle(e).color }));
      need(facts.pressed === 'true', `${id} is not pressed (${facts.pressed})`);
      need(facts.color === 'rgb(255, 255, 255)', `${id}'s word is ${facts.color}`);
      for (const where of ['away', 'under the pointer']) {
        const box = await b.boundingBox();
        if (where === 'away') await page.mouse.move(640, 200); else await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.evaluate(() => { const bar = document.getElementById('ttFsBar'); bar.classList.add('visible'); });
        await page.waitForTimeout(350);
        const s = await scan(await b.screenshot(), 3);
        const cr = ratio([255, 255, 255], s.best);
        rec.r.push(`${id.replace('ttFs', '')} ${where} ${cr.toFixed(2)}`);
        need(cr >= 4.5, `${id} ${where}: white on rgb(${s.best.join(',')}) is ${cr.toFixed(2)}:1`);
        need(s.gold, `${id} ${where}: no gold underline`);
      }
    }
    await page.mouse.move(640, 200); await page.evaluate(() => document.getElementById('ttFsBar').classList.add('visible')); await page.waitForTimeout(300);
    const up = await scan(await page.locator('#ttFsSizeUp').screenshot(), 3);
    const upCr = ratio([255, 255, 255], up.best); rec.r.push(`A+ ${upCr.toFixed(2)}`);
    need(upCr >= 4.5, `the unpressed A+ is ${upCr.toFixed(2)}:1`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}: ${r.r.join(', ')}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
