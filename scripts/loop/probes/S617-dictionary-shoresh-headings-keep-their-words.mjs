#!/usr/bin/env node
// S617 — on paper a Shoresh group heading ("Noun (14)") and the patterns panel's title stay on the sheet of what
// they head (pattern print-block-split-at-a-sheet-foot). The cards print whole, so a heading near a sheet foot used
// to print alone there, its words opening the next sheet: 23 of 280 headings over 16 roots × EN/HE × Letter/A4.
//
//   node scripts/loop/probes/S617-dictionary-shoresh-headings-keep-their-words.mjs
//   exit 1 when, for any root × EN/HE × Letter/A4: a group heading lands on an earlier sheet than its first card, the
//   patterns title on an earlier sheet than its first pattern, a heading's first card is cut across two sheets, or a
//   marker is missing (the probe's own handle). ROOT=<a git archive of the tree> runs another copy (the tree before
//   S617 fails); --json prints the record.
//
// Out-of-flow white markers (position:absolute, no offsets: drawn at the static position, layout untouched) placed
// under print media; pdftotext per sheet says where each landed. Serves ROOT in-process (every other origin aborted,
// so the page prints in its fallback faces: the roots below strand on HEAD in those too).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const ROOTS = ['כתב', 'למד', 'שמר', 'אכל', 'הלך', 'ספר', 'דבר', 'עבד', 'שבר', 'פתח', 'סגר', 'כנס', 'שלח', 'זכר', 'קרא', 'חשב'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's617-'));
const browser = await chromium.launch();
const rec = { headings: 0, stranded: 0, cut: 0, titles: 0, titlesStranded: 0, missing: 0, sheets: 0, pageErrors: 0, hits: [] };
for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); page.setDefaultTimeout(15000);
  page.on('pageerror', () => rec.pageErrors++); page.on('dialog', d => d.accept());
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(lang => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, lang);
  await page.goto(`${BASE}/hebrew_dictionary.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready);
  await page.waitForFunction(() => typeof _wordsReady !== 'undefined' && _wordsReady);
  await page.click('[data-dict-mode="shoresh"]'); await page.waitForTimeout(600);
  for (const root of ROOTS) {
    await page.fill('#shoreshInput', root); await page.press('#shoreshInput', 'Enter'); await page.waitForTimeout(700);
    const n = await page.evaluate(() => document.querySelectorAll('#shoreshResults .shoresh-group-hdr').length);
    if (!n) { rec.missing++; rec.hits.push(`${lang} ${root}: no groups rendered`); continue; }
    for (const format of ['Letter', 'A4']) {
      await page.emulateMedia({ media: 'print' });
      await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
      await page.evaluate(() => {
        const mk = (txt, host, end) => { const s = document.createElement('span'); s.className = 's617m'; s.textContent = txt;
          s.style.cssText = 'position:absolute;color:#fff;font:6px monospace;direction:ltr;unicode-bidi:isolate;'; end ? host.appendChild(s) : host.prepend(s); };
        document.querySelectorAll('#shoreshResults .shoresh-group-hdr').forEach((h, i) => {
          mk(`QH${i}Q`, h); const c = h.nextElementSibling && h.nextElementSibling.querySelector('.word-card');
          if (c) { mk(`QC${i}Q`, c); mk(`QE${i}Q`, c.lastElementChild || c, true); } });
        const t = document.querySelector('.shoresh-patterns-title'); const b = t && t.nextElementSibling && t.nextElementSibling.querySelector('*');
        if (t) mk('QPTQ', t); if (b) mk('QPBQ', b);
      });
      const pdf = path.join(TMP, `${lang}-${format}.pdf`);
      await page.pdf({ path: pdf, format, margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } });
      await page.evaluate(() => { document.querySelectorAll('.s617m').forEach(e => e.remove()); window.dispatchEvent(new Event('afterprint')); });
      await page.emulateMedia({ media: null });
      const np = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdf]).toString())[1]); rec.sheets += np;
      const at = {};
      for (let p = 1; p <= np; p++) for (const m of execFileSync('pdftotext', ['-f', String(p), '-l', String(p), pdf, '-']).toString().matchAll(/Q([HCE]\d+|PT|PB)Q/g)) at[m[1]] = p;
      const cell = `${lang} ${root} ${format}`;
      for (let i = 0; i < n; i++) { rec.headings++;
        if (at['H' + i] == null || at['C' + i] == null || at['E' + i] == null) { rec.missing++; rec.hits.push(`${cell}: heading ${i} marker missing`); continue; }
        if (at['C' + i] > at['H' + i]) { rec.stranded++; rec.hits.push(`${cell}: heading ${i} on sheet ${at['H' + i]}, its first word on ${at['C' + i]}`); }
        if (at['E' + i] !== at['C' + i]) { rec.cut++; rec.hits.push(`${cell}: heading ${i}'s first card cut across sheets ${at['C' + i]}–${at['E' + i]}`); } }
      if (at.PT != null) { rec.titles++;
        if (at.PB == null) { rec.missing++; rec.hits.push(`${cell}: patterns body marker missing`); }
        else if (at.PB > at.PT) { rec.titlesStranded++; rec.hits.push(`${cell}: patterns title on sheet ${at.PT}, its patterns on ${at.PB}`); } }
    }
  }
  await ctx.close();
}
await browser.close(); server.close(); fs.rmSync(TMP, { recursive: true, force: true });
const ok = rec.headings > 0 && rec.titles > 0 && !rec.stranded && !rec.cut && !rec.titlesStranded && !rec.missing && !rec.pageErrors;
if (JSON_OUT) console.log(JSON.stringify(rec, null, 1));
console.log(`${ok ? 'ok  ' : 'FAIL'} headings ${rec.headings} (stranded ${rec.stranded}, first card cut ${rec.cut}), patterns titles ${rec.titles} (stranded ${rec.titlesStranded}), missing markers ${rec.missing}, sheets ${rec.sheets}, page errors ${rec.pageErrors}`);
for (const h of rec.hits.slice(0, 30)) console.log('   ' + h);
process.exit(ok ? 0 : 1);
