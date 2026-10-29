#!/usr/bin/env node
// S572 — pwa.js's iOS install hint and the tours: on an iPhone the hint (fixed at the bottom, above every z-index) sat
// over the tour card's Next on the steps that place it low, so a real tap landed on the hint and six tours stalled
// (the dashboard's, the Font Maker's and Name Tags' at step 1 on an SE). The hint now steps aside while #tourCard is up.
// Also the detection recipe of pattern install-banner-over-a-sheet's-bottom-controls for the tour state.
//
//   node scripts/loop/probes/S572-install-hint-tours.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before 6bda33bc stalls 22 of the six
//   pages' 24 cells); PAGES=a,b limits the pages; --json prints the record.
//
// The hint forced (navigator.standalone false on the iPhone UA, the dismiss key absent) on iPhone SE and 13 × EN/HE, every
// tour page: the whole tour by real taps on Next; Next / Back / × hit-tested at centre and bottom edge on every step; the
// hint hidden while the tour is up and shown again after it ends.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
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
const PAGES = (process.env.PAGES || 'classroom_dashboard,hebrew_dictionary,name_tags,torah_trainer,Hebrew_Font_Maker,hebrew_blend_generator,flash_cards,letter_learner,trope_tutor').split(',');
const SEEN = ['hebrewDashboard_tourSeen', 'hebrewDictionary_tourSeen', 'hebrewNameTags_tourSeen', 'hebrewTorahTrainer_tourSeen', 'hebrewBlender_tourSeen', 'hebrewFontMaker_tourSeen', 'hebrewFontMaker_mobileWarnDismissed', 'hebrewDashboard_setupSeen', 'hebrewFlashCards_tourSeen', 'hebrewLetterLearner_tourSeen', 'hebrewTropeTutor_tourSeen'];
const hintState = () => { const b = document.getElementById('pwaInstallBanner'); return b ? getComputedStyle(b).visibility : 'none'; };
const covered = () => ['#tourNext', '#tourBack', '#tourClose'].map(s => {
  const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') return null;
  const ch = document.documentElement.clientHeight; const bad = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + r.width / 2, r.bottom - 2]].filter(([x, y]) => y >= 0 && y <= ch && (t => !(t && (t === e || e.contains(t))))(document.elementFromPoint(x, y)));
  return bad.length ? s : null;
}).filter(Boolean);
const browser = await chromium.launch();
const records = [];
for (const pg of PAGES) for (const dev of ['iPhone SE', 'iPhone 13']) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ ...devices[dev], serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); for (const k of c.seen) localStorage.setItem(k, '1'); } try { Object.defineProperty(navigator, 'standalone', { get: () => false }); } catch (e) {} }, { lang, seen: SEEN });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/${pg}.html`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
  await page.evaluate(() => { document.querySelectorAll('.overlay.open, .modal.open').forEach(o => o.classList.remove('open')); document.querySelectorAll('dialog[open]').forEach(d => d.close()); });
  const rec = { cell: `${pg} ${dev} ${lang}`, hintAtLoad: await page.evaluate(hintState), steps: 0, stalled: null, covered: [], during: null };
  const tb = page.locator('#tourBtn'); await tb.scrollIntoViewIfNeeded(); await tb.tap(); await page.waitForTimeout(700);
  for (let i = 0; i < 30; i++) {
    if (await page.locator('#tourCard[hidden]').count() || !(await page.locator('#tourCard').isVisible())) break;
    rec.steps++; if (rec.steps === 1) rec.during = await page.evaluate(hintState);
    const c = await page.evaluate(covered); if (c.length) rec.covered.push(`${rec.steps}:${c.join(',')}`);
    const nx = page.locator('#tourNext'); if (!(await nx.isVisible())) break;
    try { await nx.tap({ timeout: 2500 }); } catch (e) { rec.stalled = rec.steps; break; }
    await page.waitForTimeout(500);
  }
  rec.after = await page.evaluate(hintState); rec.errors = errors.length;
  rec.ok = rec.hintAtLoad === 'visible' && rec.steps > 1 && rec.stalled === null && !rec.covered.length && rec.during === 'hidden' && rec.after === 'visible';
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(36)} steps ${r.steps}${r.stalled ? ' STALLED at ' + r.stalled : ''} covered ${r.covered.length} hint ${r.hintAtLoad}→${r.during}→${r.after}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
