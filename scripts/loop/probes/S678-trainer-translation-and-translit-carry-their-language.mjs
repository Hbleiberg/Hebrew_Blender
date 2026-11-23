#!/usr/bin/env node
// S678 — the Tefillah and Torah Trainers: a translation and a transliteration row name their language (UX rule 8's other
// half). The Tefillah Trainer's translation carried no lang at all and the Torah Trainer's only for a language other than
// English, so in the Hebrew UI a screen reader read the English under the page's lang="he"; the transliteration rows
// (line by line, Side by side and Page view) carried none on either page, while the under-word one already said he-Latn.
//
//   node scripts/loop/probes/S678-trainer-translation-and-translit-carry-their-language.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S678 fails every cell).
//
// Offline by design: Sefaria is stubbed with ordinary vocabulary words from data/hebrew_words.json (the Tefillah
// Trainer, one fixture prayer with an instruction line and an English translation as long as its Hebrew) and the
// repo's MAM phrases (the Torah Trainer, as S571's probe), and the transliteration module's CDN addresses answer with a
// fake module that writes "tl" + an x per letter. Both pages × EN / HE UI × Line by line / Side by side / Page view,
// translation and transliteration on: every translation element's nearest [lang] is "en", every transliteration's
// "he-Latn"; guards — each kind is on screen (a count), the Hebrew words stay "he", the UI's own row labels and column
// heads keep the page's language, no page error.
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
const browser = await chromium.launch(); const records = [];
for (const P of PAGES) for (const lang of ['en', 'he']) for (const layout of ['interlinear', 'sidebyside', 'biblepage']) {
  const rec = { cell: `${P.page} ${lang} ${layout}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { try { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem(c.tour, '1'); localStorage.setItem(c.key, JSON.stringify(c.st)); } catch (e) {} },
    { lang, tour: P.tour, key: P.key, st: { ...P.seed, layout, showTranslit: true, showTranslation: true } });
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
    await page.waitForFunction(() => document.querySelector('#ttReading .tt-translit .tt-tlw, #ttReading .tt-translit, #ttReading .tt-cell.translit') && /tlx/.test(document.getElementById('ttReading').textContent), null, { timeout: 30000 });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const R = document.getElementById('ttReading');
      const eff = el => { const x = el.closest('[lang]'); return x ? x.getAttribute('lang') : '(none)'; };
      const tally = els => { const m = {}; for (const e of els) { if (!e.textContent.trim()) continue; const k = eff(e); m[k] = (m[k] || 0) + 1; } return m; };
      const q = s => [...R.querySelectorAll(s)];
      return {
        trans: tally(q('.tt-translation, .tt-col-translation .tt-cell, .tt-col-translation .tt-inst-en, .tt-inst-en, .tt-trans-block p:not(.tt-trans-block-note), .tt-bible-translation')),
        translit: tally(q('.tt-translit, .tt-cell.translit, .tt-bible-translit')),
        words: tally(q('.tt-word').filter(e => !e.closest('.tt-translit, .tt-cell.translit, .tt-bible-translit'))),   // a transliteration's own words are .tt-word too
        labels: tally(q('.tt-rowlabel, .tt-col-translation > h3, .tt-col-translit > h3')),
        uiLang: document.documentElement.lang,
      };
    });
    const only = (m, k) => Object.keys(m).length === 1 && m[k] > 0;
    rec.r = r;
    need(only(r.trans, 'en'), `translation ${JSON.stringify(r.trans)}`);
    need(only(r.translit, 'he-Latn'), `transliteration ${JSON.stringify(r.translit)}`);
    need(only(r.words, 'he'), `Hebrew words ${JSON.stringify(r.words)}`);
    need(layout === 'biblepage' ? true : only(r.labels, r.uiLang), `UI labels ${JSON.stringify(r.labels)} (page ${r.uiLang})`);
    need(r.uiLang === lang, `the page came up in ${r.uiLang}`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}${r.ok && r.r ? ` — translation ${JSON.stringify(r.r.trans)}, translit ${JSON.stringify(r.r.translit)}` : ''}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
