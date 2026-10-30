#!/usr/bin/env node
// S570 — Torah Trainer: on the default PocketTorah source the first verse no longer waits for the Total Torah manifest.
// Since TOTALTORAH_PUBLIC every visit fetches data/totaltorah/manifest.json (1.5 MB, 118 KB gzipped), and init awaited it
// before the first render although on PocketTorah only the Chanting picker reads it: on Slow 4G the first verse came
// ~1 s later. init now waits for it only on a Total Torah visit; ttManifestLanded re-syncs the picker when it lands.
//
//   node scripts/loop/probes/S570-torah-manifest-off-the-first-render.mjs    exit 1 when an arm fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before 61cd88a2 fails "pocket");
//   --json prints the record.
//
// The probe's server holds the manifest HOLD ms (3,000); Sefaria is stubbed from the repo's MAM phrases
// (data/trope/trope_phrase_examples.json: an opener + an etnachta clause + a sof-pasuk clause a verse, Genesis 1:1–20).
// Arms × EN light 1280, HE dark 800:
//   pocket      the first verse is on screen before the manifest is sent; meanwhile the picker's Total Torah option is
//               enabled and the "no recording" note hidden (still loading is not "none"); once it lands the manifest is
//               loaded and the option stays enabled (Genesis 1 is recorded)
//   totaltorah  a stored Total Torah source: the first verse still waits for the manifest
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const HOLD = 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
let manifestSentAt = 0;
const server = http.createServer(async (req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  if (/data\/totaltorah\/manifest\.json$/.test(p)) { await new Promise(r => setTimeout(r, HOLD)); manifestSentAt = Date.now(); }
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
const browser = await chromium.launch();
const records = [];
for (const arm of ['pocket', 'totaltorah']) for (const [lang, dark, w] of [['en', '0', 1280], ['he', '1', 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  const seed = { parshahKey: 'Bereshit', scope: 'parsha-full', ...(arm === 'totaltorah' ? { recordingSource: 'totaltorah' } : {}) };
  await ctx.addInitScript(c => {
    if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_settings', c.seed); }
    window.__firstWordAt = 0;
    document.addEventListener('DOMContentLoaded', () => new MutationObserver((_, mo) => { if (document.querySelector('#ttReading .tt-word')) { window.__firstWordAt = Date.now(); mo.disconnect(); } }).observe(document.getElementById('ttReading'), { childList: true, subtree: true }));
  }, { lang, dark, seed: JSON.stringify(seed) });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sefaria(u)) });
    return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort();
  });
  manifestSentAt = 0;
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__firstWordAt > 0, null, { timeout: HOLD + 20000 });
  const state = () => { const sel = document.getElementById('ttRecSrcBar'), opt = sel && sel.querySelector('option[value="totaltorah"]');
    return { loaded: !!(typeof ttManifest !== 'undefined' && ttManifest && Object.keys(ttManifest).length), value: sel && sel.value, disabled: !!(opt && opt.disabled), note: !!document.getElementById('optRecSrcNote').textContent.trim() }; };   // the note is empty, not [hidden], when there is a recording (S574)
  const early = await page.evaluate(state), firstWordAt = await page.evaluate(() => window.__firstWordAt);
  await page.waitForFunction(() => typeof ttManifest !== 'undefined' && ttManifest && Object.keys(ttManifest).length > 0, null, { timeout: HOLD + 20000 });
  await page.waitForTimeout(300);
  const late = await page.evaluate(state);
  const beforeManifest = !manifestSentAt || firstWordAt < manifestSentAt;
  const ok = arm === 'pocket'
    ? beforeManifest && !early.loaded && !early.disabled && !early.note && late.loaded && !late.disabled && !late.note && late.value === 'pockettorah'
    : !beforeManifest && late.loaded && late.value === 'totaltorah' && !late.disabled;
  records.push({ arm, cell: `${lang} ${dark === '1' ? 'dark' : 'light'} ${w}`, firstVerseBeforeManifest: beforeManifest, early, late, ok, errors: errors.length });
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.arm.padEnd(10)} ${r.cell.padEnd(14)} first verse before the manifest: ${r.firstVerseBeforeManifest}  meanwhile ${JSON.stringify(r.early)}  landed ${JSON.stringify(r.late)}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
