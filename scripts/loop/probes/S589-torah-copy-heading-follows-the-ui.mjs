#!/usr/bin/env node
// S589 — Torah Trainer, Copy verses with color coding: the rich payload's heading (the reading's label) is laid out in
// the UI's direction. It was pinned dir="ltr", so in the Hebrew UI a label mixing Hebrew and Latin ("ראש השנה — יום א׳ —
// Genesis 21:1-34") pasted left-aligned with the Latin ref at the right edge, above right-aligned verses. Measured as a
// paste lands: the payload buildCopyHTML returns is set into a blank left-to-right document, and the heading's words,
// left to right, must be the sequence the print band shows for the same label (the page's own layout of it, read
// under print media), and its writing direction must be the UI's. Sefaria is stubbed from
// data/trope/trope_phrase_examples.json.
//
//   node scripts/loop/probes/S589-torah-copy-heading-follows-the-ui.mjs   exit 1 when a pasted heading reads in another
//          order than the band, or in the other direction, in 6 readings × EN/HE, or on a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the S589 fix fails every
//   Hebrew-UI cell); --json prints the record.
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
// An element's words in left-to-right visual order (a Range per whitespace-separated word).
const ORDER = el => {
  const out = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) for (const m of n.data.matchAll(/\S+/g)) {
    const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
    const b = r.getBoundingClientRect(); if (b.width) out.push({ x: b.left, t: m[0] });
  }
  return out.sort((a, b) => a.x - b.x).map(w => w.t).join(' ');
};
const browser = await chromium.launch();
const records = [];
let errors = 0;
for (const [name, s] of Object.entries(READINGS)) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang, s]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_hintSeen', '1');
    localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ ...s, copyColorCoding: true, copyIncludeHeading: true, colorCodeNikkud: true }));
  }, [lang, s]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { sefHits++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-word').length >= 6, null, { timeout: 30000 });
  await page.waitForTimeout(400);
  const got = await page.evaluate(() => ({ html: typeof buildCopyHTML === 'function' ? buildCopyHTML(currentVerses.slice(0, 2)) : '', label: currentRangeLabel, ui: getComputedStyle(document.documentElement).direction }));
  // the band's own layout of the label, under print media
  await page.emulateMedia({ media: 'print' });
  const band = await page.evaluate(ORDER_SRC => { buildPrintBand(); const ORDER = eval(ORDER_SRC); const el = document.querySelector('#ttPrintBand .pbnd-ref'); return el ? ORDER(el) : ''; }, ORDER.toString());
  await page.emulateMedia({ media: 'screen' });
  // the paste: the payload in a blank document (no dir anywhere but the payload's own)
  const doc = await ctx.newPage();
  await doc.setContent(`<!doctype html><meta charset="utf-8"><body style="width:760px;margin:20px;font:16px serif">${got.html}</body>`);
  const pasted = await doc.evaluate(ORDER_SRC => { const ORDER = eval(ORDER_SRC); const h = document.querySelector('body > div > p'); return h ? { order: ORDER(h), dir: getComputedStyle(h).direction, text: h.textContent } : null; }, ORDER.toString());
  const ok = !!pasted && pasted.text === got.label && !!band && pasted.order === band && pasted.dir === got.ui;
  records.push({ name, lang, label: got.label, ui: got.ui, band, pasted: pasted && pasted.order, dir: pasted && pasted.dir, ok });
  await ctx.close();
}
await browser.close(); server.close();
const pass = records.every(r => r.ok) && errors === 0 && sefHits > 0;
if (JSON_OUT) console.log(JSON.stringify({ pass, errors, sefHits, records }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.name} ${r.lang} «${r.label}» heading ${r.dir}${r.ok ? '' : `\n       band:   ${r.band}\n       pasted: ${r.pasted}`}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} pasted headings read like the band, in the UI's direction; ${errors} page errors; sefaria stub ${sefHits}`);
}
process.exit(pass ? 0 : 1);
