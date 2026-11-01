#!/usr/bin/env node
// S593 — the right-side meteg (<meteg, CGJ, vowel>, the v5.36 uniE0B1 form) sits where each vowel's own mirrored
// pair puts it. buildFEA grouped the vowels by their LEFT pair (dv, dm) and wrote one right-side value per group,
// its first member's: two vowels whose left pair rounds alike can round apart on the right, so BenOr Rashi's qamats
// and patach shipped 1 unit off and every untouched BenOr Rashi export stopped at "Shaping check failed … the meteg
// on the right (expected -49/166, got -49/167)". The group key now holds both pairs.
//
//   node scripts/loop/probes/S593-fontmaker-right-meteg-per-vowel.mjs --opentype path/to/opentype.min.js
//   exit 1 when a below vowel's NIK_METEG_VR / NIK_METEG_MR values in the built FEA differ from its own
//   metegPairRightFor (dv, dm), for three starting fonts opened by ?start= (BenOr Rashi, FreeSans, Frank Ruhl Libre).
//   Without --opentype (opentype.js 1.3.4, which the import parses the font with: `npm pack opentype.js@1.3.4`) it
//   skips (exit 0, says so). ROOT=<a git archive of the tree> runs another copy (the control: the tree before S593
//   fails BenOr Rashi's 05B7 and 05B8); --json prints the record.
//
// Serves ROOT in-process (every other foreign origin aborted, service workers blocked); the partner wizard is taken by
// real clicks; the FEA is the page's own buildFontSpec() — no font engine runs.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const arg = (n) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : null; };
const OT = arg('--opentype');
if (!OT || !fs.existsSync(OT)) { console.log('SKIP: needs --opentype <opentype.js 1.3.4 dist/opentype.min.js> (npm pack opentype.js@1.3.4)'); process.exit(0); }
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const FONTS = ['benor-rashi', 'freesans', 'frank-ruhl-libre'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const errors = [], records = [];
let otHits = 0;
for (const id of FONTS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', 'en'); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(id + ': ' + e.message));
  page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u === 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js') { otHits++; return r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(OT) }); }
    return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort();
  });
  const rec = { id };
  try {
    await page.goto(`${BASE}/Hebrew_Font_Maker.html?start=${id}`, { waitUntil: 'load' });
    await page.waitForSelector('#wizardOverlay.open', { timeout: 60000 });
    for (let i = 0; i < 8; i++) {   // the partner wizard: a name, the tour off, Next … Start editing
      const v = await page.evaluate(() => { const v = (x) => { const e = document.getElementById(x); return !!(e && !e.hidden && e.offsetParent); }; return { next: v('wizNext'), create: v('wizCreate'), name: v('wizOsName') }; });
      if (v.name) { await page.fill('#wizOsName', 'Probe Meteg'); if (await page.$('#wizOsAuthor')) await page.fill('#wizOsAuthor', 'Probe'); }
      const tour = await page.$('#wizOsTour');
      if (tour && await tour.isChecked() && await page.evaluate(() => !!document.getElementById('wizOsTour').closest('label').offsetParent)) await page.click('label:has(#wizOsTour)');
      if (v.create) { await page.click('#wizCreate'); break; }
      if (v.next) await page.click('#wizNext');
      await page.waitForTimeout(200);
    }
    await page.waitForFunction(() => !document.querySelector('#wizardOverlay.open') && !document.querySelector('#importProgressOverlay.open'), null, { timeout: 120000 });
    Object.assign(rec, await page.evaluate(() => {
      const fea = buildFontSpec().fea, name2cp = {};
      MARK_CPS.forEach(cp => { name2cp[gname(cp)] = cp; });
      const vr = {}, mr = {};
      for (const m of fea.matchAll(/lookup NIK_METEG_VR_(\d+) \{\s*pos \[([^\]]+)\] <(-?\d+) 0 0 0>;/g)) vr[m[1]] = { names: m[2].trim().split(/\s+/), dv: +m[3] };
      for (const m of fea.matchAll(/lookup NIK_METEG_MR_(\d+) \{\s*pos \[[^\]]+\] <(-?\d+) 0 0 0>;/g)) mr[m[1]] = +m[2];
      let vowels = 0, exact = 0; const off = [];
      Object.keys(vr).forEach(gi => vr[gi].names.forEach(n => {
        const cp = name2cp[n]; if (!cp) return;
        const want = metegPairRightFor(cp); if (!want) return;
        vowels++;
        if (want.dv === vr[gi].dv && want.dm === mr[gi]) exact++;
        else off.push(cp + ' ' + vr[gi].dv + '/' + mr[gi] + ' (own ' + want.dv + '/' + want.dm + ')');
      }));
      return { groups: Object.keys(vr).length, vowels, exact, off: off.join('; ') };
    }));
    rec.ok = rec.vowels > 0 && rec.exact === rec.vowels;
  } catch (e) { rec.fatal = String(e.message || e).slice(0, 300); rec.ok = false; }
  records.push(rec);
  await ctx.close();
}
const pass = records.every(r => r.ok) && errors.length === 0 && otHits > 0;
if (JSON_OUT) console.log(JSON.stringify({ pass, records, errors, otHits }, null, 1));
else {
  for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.id}: ${r.exact}/${r.vowels} vowels' right-side meteg at their own pair (${r.groups} groups)${r.off ? ' — ' + r.off : ''}${r.fatal ? ' ' + r.fatal : ''}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.filter(r => r.ok).length}/${records.length} — opentype.js served ${otHits}×; pageerrors ${errors.length}`);
}
await browser.close(); server.close();
process.exit(pass ? 0 : 1);
