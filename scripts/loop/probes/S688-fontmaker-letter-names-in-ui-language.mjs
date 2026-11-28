#!/usr/bin/env node
// S688 — the Font Maker's letter-picking dialogs and the Nikkud panel's titles name each letter in the UI's language.
// The grids have always gone through gName() (the `fontmaker.glyphname.*` keys), but Auto-detect's box picker, the
// kerning class, Apply alignment, Apply nikkud and Copy outline lists, the delete confirms, and the Align / Nikkud
// panel titles and hints printed the raw English name ("Alef", "Bet") in the Hebrew UI.
//
//   node scripts/loop/probes/S688-fontmaker-letter-names-in-ui-language.mjs   (ROOT=<tree> runs another copy)
//   EN and HE UI, a project with two letters given an outline: the four checklists, the kerning class list and the
//   Nikkud panel title are opened and every Hebrew letter's row read. HE: the name must hold Hebrew and no Latin
//   letter; EN: a Latin name (the control — a blind read fails it). Exit 1 on an English name in the Hebrew UI, a
//   Hebrew one in the English UI, an empty list or a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
for (const [lang, dark, w] of [['en', false, 1280], ['he', true, 800]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); }, lang);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('dialog', d => d.accept().catch(() => {}));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/Hebrew_Font_Maker.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const res = await page.evaluate(() => {
    const need = ['openKernClass', 'openApplyAlign', 'openApplyNikkud', 'openCopyOutline', 'gName', 'curLetter', 'setWorkMode'];
    const miss = need.filter(f => typeof window[f] !== 'function'); if (miss.length) return { err: 'missing ' + miss.join(',') };
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    // two letters with a square outline, so Copy outline has a source and the Nikkud panel a letter (probe-only state)
    const sq = () => [{ winding: 'cw', points: [[100, 0], [100, 600], [500, 600], [500, 0]] }];
    for (const cp of ['05D0', '05D1']) { const l = project.letters.find(x => x.codepoint === cp); if (l) { l.contours = sq(); l.advance = l.advance || 600; } }
    const heb = s => /[א-ת]/.test(s), lat = s => /[A-Za-z]/.test(s);
    const rows = (hostId) => [...document.querySelectorAll('#' + hostId + ' label')].map(lb => {
      const g = lb.querySelector('span'); const ch = g ? g.textContent : '';
      return { ch, name: lb.textContent.replace(ch, '').trim() };
    }).filter(r => /^[א-ת]$/.test(r.ch));
    const out = {};
    const take = (key, open, host) => { try { open(); } catch (e) { out[key] = { err: e.message }; return; } const r = rows(host); out[key] = { n: r.length, heb: r.filter(x => heb(x.name) && !lat(x.name)).length, lat: r.filter(x => lat(x.name) && !heb(x.name)).length, sample: r.slice(0, 2).map(x => x.name) }; document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')); };
    take('kernClass', () => openKernClass(), 'kernClassList');
    take('applyAlign', () => openApplyAlign(), 'applyAlignList');
    take('applyNikkud', () => openApplyNikkud(), 'applyNikkudList');
    curCp = '05D1'; take('copyOutline', () => openCopyOutline(), 'copyOutlineList');
    // the Nikkud step's panel title: "{name}: place the…"
    curCp = '05D0'; try { setWorkMode('anchors'); } catch (e) {}
    const t = [...document.querySelectorAll('.ws-side-title')].map(e => e.textContent).find(s => /…/.test(s)) || '';
    const nm = t.split(':')[0].trim();
    out.nikkudTitle = { n: t ? 1 : 0, heb: heb(nm) && !lat(nm) ? 1 : 0, lat: lat(nm) && !heb(nm) ? 1 : 0, sample: [t] };
    return out;
  });
  if (res.err) { console.log(lang, res.err); fail++; }
  else for (const [k, v] of Object.entries(res)) {
    const ok = v.n > 0 && (lang === 'he' ? v.heb === v.n : v.lat === v.n);
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${lang} ${k.padEnd(12)} rows ${v.n} hebrew ${v.heb} latin ${v.lat} e.g. ${JSON.stringify(v.sample || v.err)}`);
  }
  if (errs.length) { fail++; console.log(lang, 'page errors', errs.slice(0, 3)); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
