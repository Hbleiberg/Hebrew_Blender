#!/usr/bin/env node
// S679 — the Tefillah Trainer's picker bar holds still while a search is typed. The prayer list is a <select>, as wide
// as its longest option, and the search rebuilds its options, so each letter re-sized it and slid everything after it
// along the row — the search box under the caret too (29–161px at 1280) — while the "23 prayers" / "No prayer
// matches" note beside the filters pushed the reveal switches and Settings along the row or onto the next. Now the
// list keeps its width while narrowed and the note hangs under the search box, adding nothing to the row.
//
//   node scripts/loop/probes/S679-prayer-search-holds-the-picker-bar-still.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S679 fails).
//
// Offline by design (the catalog is the repo's; Sefaria and every other origin are aborted — the bar does not need a
// reading). EN / HE × 1280 / 1200 / 1024 / 800 / 390: the bar's controls at rest, then after every key of "ash", of
// "zzqq" (typed into a cleared box), and after the Service filter set to Shabbat by the real list. Asserted: no
// control moves along the row or changes width at any step; above phone width (where the group has a row of its own
// and the note is in the flow) nothing moves at all, and the shown note lies inside the bar and over no control; with
// every prayer listed again, the list is its own width. Guards: the note says something while the list is narrowed and
// nothing otherwise, it is rendered (not display:none) while empty, the list loses options as it narrows, and the page
// never scrolls sideways.
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

const SEL = ['#prayerSelect', '#nusachSelect', '#prayerSearch', '#filterService', '#filterDay', '.tt-stack-toggles', '#gearBtn'];
const snap = page => page.evaluate(S => {
  const box = e => { const b = e.getBoundingClientRect(); return b.width ? [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)] : null; };
  const out = {};
  for (const s of S) { const e = document.querySelector(s); out[s] = e && box(e); }
  const n = document.getElementById('prayerFilterNote'), sel = document.getElementById('prayerSelect'), bar = document.querySelector('.tt-controls');
  out.note = n ? n.textContent.trim() : null; out.noteDisplay = n ? getComputedStyle(n).display : null;
  out.noteBox = n && n.textContent.trim() ? (() => { const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; })() : null;
  out.bar = bar && box(bar);
  out.options = sel ? sel.options.length : 0; out.inlineStyle = sel ? sel.style.inlineSize : '';
  out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return out;
}, SEL);
const overlaps = (a, b) => Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 0 && Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 0;
const inside = (a, b) => a[0] >= b[0] && a[1] >= b[1] && a[0] + a[2] <= b[0] + b[2] && a[1] + a[3] <= b[1] + b[3];
const CELLS = [['en', 1280], ['en', 1200], ['en', 1024], ['en', 800], ['en', 390], ['he', 1280], ['he', 1200], ['he', 1024], ['he', 800], ['he', 390]];
const browser = await chromium.launch(); const records = [];
for (const [lang, vw] of CELLS) {
  const rec = { cell: `${lang} ${vw}`, notes: [] };
  const need = (ok, what) => { if (!ok && rec.notes.length < 6) rec.notes.push(what); };
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(l => { try { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); } catch (e) {} }, lang);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  try {
    await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#prayerSelect option').length > 5 && document.documentElement.lang, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
    const find = await page.$('#prayerFindBtn');
    if (find && await find.isVisible()) { await find.click(); await page.waitForTimeout(200); }
    const rest = await snap(page);
    need(rest.note === '' && rest.noteDisplay !== 'none', `at rest the note is "${rest.note}" / ${rest.noteDisplay}`);
    const steps = [];
    const key = async (k, label) => { await page.keyboard.press(k); await page.waitForTimeout(200); steps.push([label, await snap(page)]); };
    await page.click('#prayerSearch');
    for (const k of 'ash') await key(k, 'ash:' + k);
    await page.keyboard.press('ControlOrMeta+a'); await key('Backspace', 'cleared');
    for (const k of 'zzqq') await key(k, 'zzqq:' + k);
    await page.keyboard.press('ControlOrMeta+a'); await key('Backspace', 'cleared2');
    await page.selectOption('#filterService', 'shabbat'); await page.waitForTimeout(200); steps.push(['service', await snap(page)]);
    await page.selectOption('#filterService', 'all'); await page.waitForTimeout(200); steps.push(['service-all', await snap(page)]);
    const phone = vw <= 720;
    for (const [label, s] of steps) {
      const narrowed = !/^cleared|service-all/.test(label);
      for (const c of SEL) {
        const a = rest[c], b = s[c];
        if (!a || !b) { need(false, `${label}: ${c} missing`); continue; }
        need(a[0] === b[0] && a[2] === b[2], `${label}: ${c} moved along the row ${a[0]},${a[2]} → ${b[0]},${b[2]}`);
        if (!phone) need(a[1] === b[1] && a[3] === b[3], `${label}: ${c} moved up or down (top ${a[1]} → ${b[1]})`);
      }
      need(narrowed ? s.note.length > 0 : s.note === '', `${label}: the note reads "${s.note}"`);
      need(s.noteDisplay !== 'none', `${label}: the note is display:none`);
      need(s.overflow <= 0, `${label}: the page scrolls sideways by ${s.overflow}px`);
      if (!phone && s.noteBox) {
        need(inside(s.noteBox, s.bar), `${label}: the note ${JSON.stringify(s.noteBox)} leaves the bar ${JSON.stringify(s.bar)}`);
        for (const c of SEL) if (s[c]) need(!overlaps(s.noteBox, s[c]), `${label}: the note lies over ${c}`);
      }
      if (narrowed) need(s.options < rest.options, `${label}: the list kept ${s.options} of ${rest.options} options`);
      else need(s.inlineStyle === '', `${label}: the list kept a set width (${s.inlineStyle}) with every prayer listed`);
    }
    rec.r = { rest: rest['#prayerSearch'], after: steps[2][1]['#prayerSearch'], note: steps[2][1].note, noteBox: steps[2][1].noteBox };
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}${r.ok && r.r ? ` — search box ${JSON.stringify(r.r.rest)} → ${JSON.stringify(r.r.after)} after "ash", note "${r.r.note}" at ${JSON.stringify(r.r.noteBox)}` : ''}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
