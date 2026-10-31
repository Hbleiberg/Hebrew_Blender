#!/usr/bin/env node
// S589 — Torah Trainer on paper: the running label on sheets 2–N (the @page margin box) reads in the same order as
// sheet 1's band. The boxes are pinned direction:ltr so the "2 / 23" counter is never bidi-reordered; in the Hebrew UI
// that also laid out a label mixing Hebrew and Latin left-to-right ("ראש השנה — יום א׳ — Genesis 21:1-34" with the Latin
// ref at the right edge, where a Hebrew reader starts), while the band above sheet 1's reading lays it out right-to-left.
// Measured in the PDF: pdftotext -bbox gives each word's x on sheet 1 (the band) and sheet 2 (the margin box); the
// label's words, left to right, must be the same sequence on both. Sefaria is stubbed from
// data/trope/trope_phrase_examples.json (the words do not matter; the label comes from the page's own reading table).
//
//   node scripts/loop/probes/S589-torah-running-label-reads-like-the-band.mjs   exit 1 when a sheet-2 label reads in
//          another order than its band, in 6 readings (an aliyah, a haftarah, a holiday, its haftarah, Triennial, a
//          megillah chapter) × EN/HE × Letter, or on a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the S589 fix fails the five
//   mixed Hebrew-UI labels and passes every English one and the all-Hebrew megillah); --json prints the record.
//   Needs poppler's pdfinfo and pdftotext (skips loudly).
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's589-'));
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const verses = rows.slice(0, 6).flatMap(r => r.ex.map(e => e.he)).slice(0, 12);
let sefHits = 0;
const sef = u => u.includes('/v3/texts/') ? { versions: [{ language: 'he', text: verses }], sections: ['1', '1'] } : u.includes('/calendars') ? { calendar_items: [] } : [];
const READINGS = {
  aliyah: { parshahKey: 'Bereshit', scope: 'parsha-aliyah-1' },
  haftarah: { parshahKey: 'Bereshit', scope: 'parsha-haftarah' },
  holiday: { scope: 'custom', holidayKey: 'rosh-hashanah-1', holidayPart: null, customRef: 'Genesis 21:1-34' },
  holidayHaftarah: { scope: 'custom', holidayKey: 'rosh-hashanah-1', holidayPart: 'haftarah', customRef: 'I Samuel 1:1-2:10' },
  triennial: { parshahKey: 'Bereshit', scope: 'parsha-aliyah-1', readingCycle: 'triennial', triennialYear: 1 },
  megillah: { scope: 'custom', holidayKey: 'megillat-esther', holidayPart: 'ch:1', customRef: 'Esther 1' },
};
// The label's words in left-to-right order within the top band of a sheet; the counter ("2", "/", "6") and a verse
// number ("1:3") are dropped on both sheets alike, and so are the invisible bidi controls pdftotext extracts (the fix's
// isolate, U+2067 … U+2069, draws nothing — looked at on the rendered sheets).
const BIDI = /[‎‏‪-‮⁦-⁩]/g;
const labelWords = (pdf, page, maxY) => {
  const xml = execFileSync('pdftotext', ['-bbox', '-f', '' + page, '-l', '' + page, pdf, '-'], { encoding: 'utf8' });
  const ws = [...xml.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)">(.*?)<\/word>/g)]
    .map(m => ({ x: +m[1], y: +m[3], t: m[4].replace(BIDI, '') })).filter(w => w.y < maxY && w.t && !/^(\d+|\/|\d+:\d+)$/.test(w.t));
  return ws.sort((a, b) => a.x - b.x).map(w => w.t);
};
const browser = await chromium.launch();
const records = [];
let errors = 0;
for (const [name, s] of Object.entries(READINGS)) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang, s]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_hintSeen', '1');
    localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ ...s, hebFontSize: 3 }));
  }, [lang, s]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { sefHits++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-word').length >= 6, null, { timeout: 30000 });
  await page.waitForTimeout(500);
  const label = await page.evaluate(() => currentRangeLabel);
  const pdf = path.join(TMP, `${name}-${lang}.pdf`);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: pdf, format: 'Letter', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });   // page.pdf fires beforeprint/afterprint
  const n = +execFileSync('pdfinfo', [pdf]).toString().match(/Pages:\s+(\d+)/)[1];
  // sheet 1: the counter in the margin box + the in-flow band (all above the first verse); sheet 2: the margin box only
  const band = labelWords(pdf, 1, 80), run = n > 1 ? labelWords(pdf, 2, 52) : null;
  const ok = !!run && run.length > 0 && band.join(' ') === run.join(' ');
  records.push({ name, lang, label, sheets: n, band: band.join(' '), run: run && run.join(' '), ok });
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
const pass = records.every(r => r.ok) && errors === 0 && sefHits > 0;
if (JSON_OUT) console.log(JSON.stringify({ pass, errors, sefHits, records }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name} ${r.lang} (${r.sheets} sheets) «${r.label}»${r.ok ? '' : `\n       band: ${r.band}\n       run:  ${r.run}`}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} labels read like their band; ${errors} page errors; sefaria stub ${sefHits}`);
}
process.exit(pass ? 0 : 1);
