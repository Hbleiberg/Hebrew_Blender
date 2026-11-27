#!/usr/bin/env node
// S684 — Torah Trainer on paper: a printed reading ends with its credits. The page's print block hid the whole footer
// (a July hide list that predates the navy footer), so no sheet credited the Hebrew text (Sefaria's Miqra according to
// the Masorah, CC BY-SA) or the translation's licence, while the Tefillah Trainer prints its credits with every reading.
// Now the footer prints as the header-icons block's compact strip, and its translation line only where a translation
// is on the sheet (off, or in the handout, it printed the screen's "pick a version" advice).
// Measured in the PDF (pdftotext): the credit line, the Hebrew edition with its licence, and "Translation:" with the
// version's title present exactly when a translation is printed; nothing of the strip's screen-only parts (Related
// Hebrew Tools, Follow, social names).
//
//   node scripts/loop/probes/S684-torah-print-carries-its-credits.mjs   exit 1 when a sheet set misses its credits, credits
//          a translation it does not print, prints the footer's links, or on a page error — 4 layouts × translation
//          on / off × EN/HE + the handout × EN/HE, Letter, Sefaria stubbed
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S684 fails every cell that
//   should carry credits). --json prints the record. Needs poppler's pdfinfo and pdftotext (skips loudly).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
try { execFileSync('pdftotext', ['-v'], { stdio: 'ignore' }); execFileSync('pdfinfo', ['-v'], { stdio: 'ignore' }); }
catch (e) { console.log('SKIP: poppler (pdfinfo / pdftotext) is not installed'); process.exit(0); }
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's684-'));
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const HEB = rows.slice(0, 6).flatMap(r => r.ex.map(e => e.he)).slice(0, 12);
const HE_ED = 'Miqra according to the Masorah', JPS = 'The Holy Scriptures: A New Translation (JPS 1917)';
let sefHits = 0;
const sef = u => {
  if (u.includes('/texts/versions/')) return [{ versionTitle: JPS, language: 'en', actualLanguage: 'en', license: 'Public Domain' }];
  if (u.includes('/v3/texts/')) {
    const versions = [{ language: 'he', versionTitle: HE_ED, license: 'CC-BY-SA', text: HEB }];
    if (/translation%7C|translation\|/.test(u)) versions.push({ language: 'en', versionTitle: JPS, actualLanguage: 'en', license: 'Public Domain', text: HEB.map((_, i) => `English line ${i + 1} of the stub.`) });
    return { versions, sections: ['1', '1'] };
  }
  return u.includes('/calendars') ? { calendar_items: [] } : [];
};
const CELLS = [];
for (const layout of ['interlinear', 'sidebyside', 'biblepage', 'staff']) for (const trans of [true, false]) for (const lang of ['en', 'he']) CELLS.push({ layout, trans, lang, handout: false });
for (const lang of ['en', 'he']) CELLS.push({ layout: 'interlinear', trans: true, lang, handout: true });
const browser = await chromium.launch();
const records = [];
let errors = 0, fails = 0;
for (const c of CELLS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang, s]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_hintSeen', '1');
    localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify(s));
  }, [c.lang, { parshahKey: 'Bereshit', scope: 'parsha-aliyah-1', layout: c.layout, showTranslation: c.trans, translationVersion: JPS }]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { sefHits++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-word, #ttReading svg').length >= 6, null, { timeout: 30000 });
  if (c.trans) await page.waitForFunction(() => document.querySelector('#ttReading :is(.tt-translation, .tt-col-translation, .tt-bible-translation)'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  if (c.handout) { if (await page.evaluate(() => typeof _handoutEnter !== 'function')) throw new Error('no _handoutEnter'); await page.evaluate(() => _handoutEnter()); }
  const printsTrans = await page.evaluate(() => !!document.querySelector('#ttReading :is(.tt-translation, .tt-col-translation, .tt-bible-translation)'));
  const pdf = path.join(TMP, `${c.layout}-${c.trans}-${c.lang}-${c.handout}.pdf`);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: pdf, format: 'Letter', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
  if (c.handout) await page.evaluate(() => _handoutExit());
  const n = +execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  const all = execFileSync('pdftotext', [pdf, '-'], { encoding: 'utf8' }).replace(/[‎‏‪-‮⁦-⁩]/g, '');
  const last = execFileSync('pdftotext', ['-f', '' + n, '-l', '' + n, pdf, '-'], { encoding: 'utf8' }).replace(/[‎‏‪-‮⁦-⁩]/g, '');
  const got = {
    by: /Created by Harrison Bleiberg/.test(last),
    heb: last.includes(HE_ED) && /CC BY-SA/.test(last),
    trans: /Translation:|תרגום/.test(all), transTitle: all.includes('JPS 1917'),
    advice: /none selected|לא נבחר/.test(all),
    links: /Related Hebrew Tools|Instagram|Facebook|Privacy Policy/.test(all),
  };
  const wantTrans = printsTrans;   // the stub always serves the translation when asked, so this is c.trans && !c.handout
  const ok = got.by && got.heb && got.trans === wantTrans && got.transTitle === wantTrans && !got.advice && !got.links && wantTrans === (c.trans && !c.handout);
  if (!ok) fails++;
  records.push({ ...c, sheets: n, printsTrans, ...got, ok });
  if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${c.layout.padEnd(11)} trans ${c.trans ? 'on ' : 'off'} ${c.lang}${c.handout ? ' handout' : '        '} ${n} sheets · credit ${got.by} · Hebrew edition ${got.heb} · translation line ${got.trans} (${got.transTitle ? 'titled' : 'untitled'}) · advice ${got.advice} · links ${got.links}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors, sefHits }, null, 1));
const pass = !fails && !errors && sefHits > 0;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${CELLS.length - fails}/${CELLS.length} printed readings carry their credits as they should; ${errors} page errors; sefaria stub ${sefHits}`);
process.exit(pass ? 0 : 1);
