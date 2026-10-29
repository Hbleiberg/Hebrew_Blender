#!/usr/bin/env node
// S570 — Torah Trainer, Trope staff: a font finishing its load re-takes the staff's remembered word widths, and the
// staff re-wraps only when one moved. The widths are memoized by the font's name, not its load state, and a load used
// to force a full re-render that re-read the same memo: a face landing after the staff data left the fallback's widths
// for the visit, and every cold staff load paid a whole re-render (0.6–0.9 s at 4×) that changed nothing.
//
//   node scripts/loop/probes/S570-torah-staff-font-remeasure.mjs     exit 1 when an arm fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before 79527496 fails both arms);
//   --json prints the record.
//
// Sefaria is stubbed from the repo's MAM phrases (an opener + an etnachta clause + a sof-pasuk clause a verse,
// Genesis 1:1–20); Google Fonts is aborted, so the reading's Frank Ruhl is the self-hosted TTF. Arms × EN light 1280,
// HE dark 800, the Trope staff layout:
//   late  the server holds /fonts/FrankRuhlLibre-Regular.ttf 2,500 ms: once settled, every remembered width equals a
//         fresh canvas measurement in its own font
//   noop  the reading settled, a FontFace no text uses (the Taamim TTF under a new family) loads: no renderText runs
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
let holdTtf = 0;
const server = http.createServer(async (req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  if (holdTtf && /fonts\/FrankRuhlLibre-Regular\.ttf$/.test(p)) await new Promise(r => setTimeout(r, holdTtf));
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const pick = re => rows.filter(r => re.test(r.k)).flatMap(r => r.ex.map(e => e.he));
const open_ = pick(/zakef_katon$/), etn = pick(/etnachta$/), sof = pick(/sof_pasuk$/);
const verses = Array.from({ length: 20 }, (_, i) => `${open_[i % open_.length]} ${etn[i % etn.length]} ${sof[i % sof.length]}`);
const sefaria = u => {
  if (u.includes('/v3/texts/')) { const m = decodeURIComponent(u).match(/texts\/[A-Za-z_]+\.(\d+)\.(\d+)/); return { versions: [{ language: 'he', text: verses }], sections: m ? [m[1], m[2]] : ['1', '1'] }; }
  return u.includes('/calendars') ? { calendar_items: [] } : [];
};
const settle = async page => { let last = -1; for (let i = 0; i < 40; i++) { const n = await page.evaluate(() => window.__renders); if (n === last) return; last = n; await page.waitForTimeout(900); } };
const browser = await chromium.launch();
const records = [];
for (const arm of ['late', 'noop']) for (const [lang, dark, w] of [['en', '0', 1280], ['he', '1', 800]]) {
  holdTtf = arm === 'late' ? 2500 : 0;
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_settings', c.seed); }
    window.__renders = 0;
    document.addEventListener('DOMContentLoaded', () => { const R = window.renderText; window.renderText = function (...a) { window.__renders++; return R.apply(this, a); }; });
  }, { lang, dark, seed: JSON.stringify({ parshahKey: 'Bereshit', scope: 'parsha-full', layout: 'staff' }) });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sefaria(u)) });
    return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort();
  });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('#ttReading .tt-staff-sys').length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(holdTtf + 1200); await settle(page);
  const rec = { arm, cell: `${lang} ${dark === '1' ? 'dark' : 'light'} ${w}`, systems: await page.evaluate(() => document.querySelectorAll('#ttReading .tt-staff-sys').length) };
  if (arm === 'late') {
    Object.assign(rec, await page.evaluate(() => {
      const c = document.createElement('canvas').getContext('2d'); let n = 0, stale = 0;
      for (const [k, v] of _staffMeasureMemo) { const [, font, text] = k.split('\u0001'); c.font = font; n++; if (Math.abs(c.measureText(text).width - v) > 0.01) stale++; }
      return { widths: n, stale };
    }));
    rec.ok = rec.widths > 0 && rec.stale === 0;
  } else {
    const before = await page.evaluate(() => window.__renders);
    rec.loadingdone = await page.evaluate(async () => {
      let fired = 0; const on = () => fired++; document.fonts.addEventListener('loadingdone', on);
      // a url() source loads through the set and fires loadingdone (an ArrayBuffer face is loaded on construction and fires nothing)
      const f = new FontFace('S570 Probe Unused', 'url(/fonts/NotoSerifHebrew-Taamim.ttf?s570)'); document.fonts.add(f); await f.load();
      await new Promise(r => setTimeout(r, 50)); document.fonts.removeEventListener('loadingdone', on); return fired;
    });
    await page.waitForTimeout(800); await settle(page);
    rec.rendersAfterLoad = (await page.evaluate(() => window.__renders)) - before;
    rec.ok = rec.loadingdone > 0 && rec.rendersAfterLoad === 0;
  }
  rec.ok = rec.ok && rec.systems > 0; rec.errors = errors.length;
  records.push(rec);
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.arm.padEnd(5)} ${r.cell.padEnd(14)} systems ${r.systems}  ${r.arm === 'late' ? `stale widths ${r.stale} of ${r.widths}` : `loadingdone ${r.loadingdone}, renders after it ${r.rendersAfterLoad}`}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
