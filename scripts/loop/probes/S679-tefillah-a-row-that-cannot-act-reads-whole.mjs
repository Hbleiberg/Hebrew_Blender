#!/usr/bin/env node
// S679 — the Tefillah Trainer's drawer: a row that cannot act on the text on screen reads as one. On a prayer without
// te'amim the Text tab's "Show cantillation marks" switch is disabled, but only its name dimmed — the switch kept its
// full "on" gold — and its note ("This text has no cantillation marks…") sat under the next row, Show nikkud. In the
// Colors tab the trope list was the inverse: its choices dimmed, its name ("Color-code trope") at full strength.
//
//   node scripts/loop/probes/S679-tefillah-a-row-that-cannot-act-reads-whole.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S679 fails).
//
// Offline by design: Sefaria is stubbed — a siddur prayer of ordinary pointed words (no te'amim, no trope), one whose
// lines carry the repo's MAM te'amim (te'amim, no trope), and a Torah text (te'amim and trope). EN / HE × the three,
// the drawer opened by the real gear button and each tab by its real tab: the te'amim row's name and switch share one
// opacity, under 1 exactly when the switch is disabled; the note is shown exactly then, is the row's next sibling and
// sits between it and the Show nikkud row; the trope list's name and its choices share one opacity, under 1 exactly
// when the text has no trope. Guards: the switch's disabled state follows the text, both tabs were reached, no page
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

const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 18);
const PLAIN = [WORDS.slice(0, 6).join(' '), WORDS.slice(6, 12).join(' '), WORDS.slice(12, 18).join(' ')];
const MAM = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah.slice(0, 4).flatMap(r => r.ex.map(e => e.he)).slice(0, 4);
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [
    { key: 'plain', nameKey: '', en: 'Fixture plain', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Plain' } },
    { key: 'marks', nameKey: '', en: 'Fixture marks', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Marks' } },
    { key: 'verse', nameKey: '', en: 'Fixture verse', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { torah: ['Deuteronomy 6:4'] } },
  ] };
const AVAIL = [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }];
const answer = u => {
  const lines = /Marks/.test(decodeURIComponent(u)) ? MAM : /Deuteronomy/.test(decodeURIComponent(u)) ? MAM.slice(0, 1) : PLAIN;
  return { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/he', text: lines }], available_versions: AVAIL };
};
const CASES = [['plain', 'ashkenaz', { teamim: false, trope: false }], ['marks', 'ashkenaz', { teamim: true, trope: false }], ['verse', 'torah', { teamim: true, trope: true }]];
const browser = await chromium.launch(); const records = [];
for (const lang of ['en', 'he']) for (const [prayerKey, nusach, want] of CASES) {
  const rec = { cell: `${lang} ${prayerKey}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { try { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTefillahTrainer_settings', JSON.stringify({ prayerKey: c.prayerKey, nusach: c.nusach })); } catch (e) {} }, { lang, prayerKey, nusach });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(answer(u)) });
    return r.abort();
  });
  try {
    await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof _readingLoading !== 'undefined' && !_readingLoading && document.querySelector('#ttReading .tt-word'), null, { timeout: 30000 });
    await page.click('#gearBtn'); await page.waitForSelector('#settingsModal.open');
    await page.click('#ttTabText'); await page.waitForTimeout(300);
    const t = await page.evaluate(() => {
      const op = e => { let o = 1; for (let x = e; x && x !== document.body; x = x.parentElement) o *= +getComputedStyle(x).opacity; return Math.round(o * 100) / 100; };
      const cb = document.getElementById('optShowCantillation'), row = cb.closest('.form-row'), note = document.getElementById('ttTeamimNote');
      const nik = document.getElementById('optShowNikkud').closest('.form-row');
      const rb = row.getBoundingClientRect(), nb = note.getBoundingClientRect(), kb = nik.getBoundingClientRect();
      return { shown: !!document.getElementById('ttTabPanelText').getClientRects().length, disabled: cb.disabled, name: op(row.querySelector(':scope > label:first-child')), sw: op(row.querySelector(':scope > .toggle')),
        noteShown: !note.hidden && !!note.getClientRects().length, nextIsNote: row.nextElementSibling === note, between: nb.top >= rb.bottom - 1 && nb.bottom <= kb.top + 1 };
    });
    await page.click('#ttTabColors'); await page.waitForTimeout(300);
    const c = await page.evaluate(() => {
      const op = e => { let o = 1; for (let x = e; x && x !== document.body; x = x.parentElement) o *= +getComputedStyle(x).opacity; return Math.round(o * 100) / 100; };
      const grp = document.querySelector('.radio-group[aria-labelledby="lblColorCodeTrope"]');
      return { shown: !!document.getElementById('ttTabPanelColors').getClientRects().length, name: op(document.getElementById('lblColorCodeTrope')), choices: op(grp) };
    });
    rec.r = { t, c };
    need(t.shown && c.shown, 'a tab did not open');
    need(t.disabled === !want.teamim, `the te'amim switch is ${t.disabled ? '' : 'not '}disabled`);
    need(t.name === t.sw, `te'amim row: name ${t.name}, switch ${t.sw}`);
    need((t.sw < 1) === !want.teamim, `te'amim row: switch opacity ${t.sw}`);
    need(t.noteShown === !want.teamim, `te'amim note ${t.noteShown ? 'shown' : 'hidden'}`);
    need(t.nextIsNote, 'the te\'amim note is not the row\'s next sibling');
    if (t.noteShown) need(t.between, 'the shown note is not between its row and Show nikkud');
    need(c.name === c.choices, `trope list: name ${c.name}, choices ${c.choices}`);
    need((c.choices < 1) === !want.trope, `trope list: choices opacity ${c.choices}`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}${r.ok && r.r ? ` — te'amim row ${r.r.t.name}/${r.r.t.sw} note ${r.r.t.noteShown ? 'shown' : 'hidden'}, trope list ${r.r.c.name}/${r.r.c.choices}` : ''}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
