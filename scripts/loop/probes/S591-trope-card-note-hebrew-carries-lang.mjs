#!/usr/bin/env node
// S591 — Trope Tutor: in the English UI a Learn card note's Hebrew carries lang="he" (UX rule 8). Sof pasuk's note
// ends "…followed by the ׃ mark.", one text node under lang="en", so a screen reader gave the mark the English voice.
// The note now puts each Hebrew run in a lang="he" span in the English UI and stays one text node in the Hebrew UI.
// Every foreign origin is aborted; families chosen by real clicks; the language switched by the page's own switcher.
//
//   node scripts/loop/probes/S591-trope-card-note-hebrew-carries-lang.mjs   exit 1 when, in EN/HE × light/dark:
//     A  across the seven families, a Hebrew text node in a Learn card sits outside lang="he" in the English UI;
//     B  a note in the Hebrew UI holds a span (its DOM is to stay one text node);
//     C  after a live switch to the other language and back, A or B fails for the sof pasuk note;
//   or on a page error. ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the
//   S591 fix fails all four: A and C in the English cells, C in the Hebrew ones once switched); --json prints the record.
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
const BASE = `http://127.0.0.1:${server.address().port}`;
// Hebrew text nodes in the cards outside any lang="he" (English UI), and notes holding a span (Hebrew UI).
const READ = () => {
  const cards = document.getElementById('tuCards'); const w = document.createTreeWalker(cards, NodeFilter.SHOW_TEXT); let n, unmarked = 0;
  while ((n = w.nextNode())) if (/[֐-׿]/.test(n.nodeValue) && !n.parentElement.closest('[lang^="he"]') && !n.parentElement.closest('[aria-hidden="true"]') && n.parentElement.getClientRects().length) unmarked++;
  const notes = [...cards.querySelectorAll('.tu-card-note')];
  return { lang: document.documentElement.lang, unmarked, notes: notes.length, withSpan: notes.filter(x => x.querySelector('span')).length };
};
const ok = r => r.lang === 'en' ? r.unmarked === 0 : r.withSpan === 0;
async function cell(lang, dark) {
  const ctx = await browser.newContext({ viewport: { width: dark ? 800 : 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewTropeTutor_tourSeen', '1'); }, [lang, dark]);
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  const page = await ctx.newPage(); let errors = 0; page.on('pageerror', () => errors++);
  await page.goto(BASE + '/trope_tutor.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#tuFamilyChips button').length >= 7 && document.querySelector('#tuCards .tu-card'), null, { timeout: 20000 });
  const r = { lang, theme: dark ? 'dark' : 'light', A: [], C: [] };
  const fams = await page.$$eval('#tuFamilyChips button', b => b.length);
  for (let i = 0; i < fams; i++) { await page.click(`#tuFamilyChips button >> nth=${i}`); await page.waitForTimeout(150); r.A.push(await page.evaluate(READ)); }
  r.notes = r.A.reduce((a, x) => a + x.notes, 0);
  await page.click('#tuFamilyChips button >> nth=0'); await page.waitForTimeout(150);   // sof pasuk's family
  for (const to of lang === 'en' ? ['he', 'en'] : ['en', 'he']) { await page.selectOption('.i18n-switch select', to); await page.waitForTimeout(700); r.C.push(await page.evaluate(READ)); }
  r.errors = errors;
  r.ok = errors === 0 && r.notes >= 16 && r.A.every(x => ok(x)) && r.C.every(x => ok(x)) && r.C.some(x => x.lang === 'en') && r.C.some(x => x.lang === 'he');
  await ctx.close();
  return r;
}
const browser = await chromium.launch();
const records = [];
for (const lang of ['en', 'he']) for (const dark of [false, true]) records.push(await cell(lang, dark));
await browser.close(); server.close();
const pass = records.every(r => r.ok);
if (JSON_OUT) console.log(JSON.stringify({ pass, records }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.lang} ${r.theme} notes ${r.notes} unmarked ${r.A.map(x => x.unmarked).join('')} spans ${r.A.map(x => x.withSpan).join('')} switch ${r.C.map(x => `${x.lang}:${x.unmarked}/${x.withSpan}`).join(' ')} errors ${r.errors}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} cells — a card note's Hebrew carries lang="he" in the English UI, the Hebrew UI's notes unchanged`);
}
process.exit(pass ? 0 : 1);
