#!/usr/bin/env node
// S571 — Torah Trainer, Side by side: the Hebrew column's head "עִבְרִית" carries lang="he" (UX rule 8). It was a literal in
// the builder with no lang, so in the English UI it sat under lang="en" and a screen reader voiced it with the English voice.
//
//   node scripts/loop/probes/S571-torah-side-by-side-hebrew-head-lang.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before 4c0b957c fails the English cells);
//   --json prints the record.
//
// Sefaria is stubbed from the repo's MAM phrases (data/trope/trope_phrase_examples.json); cells EN/HE × light/dark × 1280/800
// with the Side by side layout seeded: the head's nearest [lang] is "he", and its text and computed font are unchanged.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const verses = rows.slice(0, 6).flatMap(r => r.ex.map(e => e.he)).slice(0, 12);
const sefaria = u => u.includes('/v3/texts/') ? { versions: [{ language: 'he', text: verses }, { language: 'en', text: verses.map((_, i) => `Verse ${i + 1}.`) }], sections: ['1', '1'] } : u.includes('/calendars') ? { calendar_items: [] } : [];
const browser = await chromium.launch();
const records = [];
for (const [lang, dark, w] of [['en', 0, 1280], ['en', 1, 1280], ['en', 0, 800], ['en', 1, 800], ['he', 0, 1280], ['he', 1, 1280], ['he', 0, 800], ['he', 1, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', String(c.dark)); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_settings', c.seed); } }, { lang, dark, seed: JSON.stringify({ parshahKey: 'Bereshit', scope: 'parsha-full', layout: 'sidebyside' }) });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sefaria(u)) });
    return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort();
  });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('.tt-grid-col.tt-col-heb h3'), null, { timeout: 30000 });
  const rec = await page.evaluate(() => { const h = document.querySelector('.tt-grid-col.tt-col-heb h3'); return { text: h.textContent, lang: h.closest('[lang]').getAttribute('lang'), font: getComputedStyle(h).fontFamily }; });
  rec.cell = `${lang} ${dark ? 'dark' : 'light'} ${w}`;
  rec.ok = rec.text === 'עִבְרִית' && rec.lang === 'he' && /Libre Baskerville/.test(rec.font);
  rec.errors = errors.length;
  records.push(rec);
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(14)} "${r.text}" lang ${r.lang}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
