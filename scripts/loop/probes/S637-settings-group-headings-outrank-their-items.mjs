#!/usr/bin/env node
// S637 (pass M; the S554 M P4) — the Font Maker's Settings tab heads its three groups ("Add glyphs & languages",
// "Input mode", "Canvas") with `.adv-group-title`, 0.8rem regular serif, over items each led by a bold uppercase
// 0.74rem `.ctl-label`: a group read lighter than its own members. The Trope Tutor's Settings tab copies that layout
// (`.tu-set-title` over `.tu-set-label`) and had the same inversion. Both headings now take the help modal's h4
// treatment, 0.98rem bold, and stay twins.
//
// Each page × EN light 1280 and HE dark 800 (the Font Maker by its onboarding wizard's real clicks to a Drawing
// project, then its Settings tab; the Tutor by its Settings tab): (1) every group heading's font size ≥ 1.25× its
// items' label and its weight ≥ theirs; (2) each heading on one line; (3) the twins agree (size, weight, family);
// 0 page errors.
//
//   node scripts/loop/probes/S637-settings-group-headings-outrank-their-items.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S637 fails (1) in every cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css', '.wasm': 'application/wasm', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg, r) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}: ${JSON.stringify(r)}`); };
const browser = await chromium.launch();
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const READ = ([head, label]) => {
  const st = (e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return { fs: parseFloat(c.fontSize), fw: +c.fontWeight, fam: c.fontFamily.split(',')[0].replace(/"/g, ''), h: r.height, lh: parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.3, text: e.textContent.trim().slice(0, 30) }; };
  const heads = [...document.querySelectorAll(head)].filter(e => e.getClientRects().length).map(st), labels = [...document.querySelectorAll(label)].filter(e => e.getClientRects().length).map(st);
  return { heads, label: labels[0] || null, nLabels: labels.length };
};
const twins = {};
for (const cell of CELLS) for (const tool of ['fontmaker', 'tutor']) {
  const tag = `${tool} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); localStorage.setItem('hebrewFontMaker_mobileWarnDismissed', '1'); localStorage.setItem('hebrewTropeTutor_tourSeen', '1'); sessionStorage.setItem('__s', '1'); } }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  try {
    let sel;
    if (tool === 'fontmaker') {
      await page.goto(`${base}/Hebrew_Font_Maker.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('wizardOverlay')?.classList.contains('open'), null, { timeout: 30000 });
      await page.fill('#wizName', 'Probe'); await page.fill('#wizAuthor', 'Loop');
      for (let i = 0; i < 6; i++) {
        const st = await page.evaluate(() => ({ next: !!document.getElementById('wizNext')?.getClientRects().length, create: !!document.getElementById('wizCreate')?.getClientRects().length, draw: !!document.querySelector('.wiz-tile:has(#wizSrcDraw)')?.getClientRects().length }));
        if (st.draw) await page.click('.wiz-tile:has(#wizSrcDraw)');
        if (st.create) { await page.click('#wizCreate'); break; }
        if (st.next) await page.click('#wizNext');
        await page.waitForTimeout(300);
      }
      await page.waitForFunction(() => typeof project === 'object' && project && Object.keys(project.letters || {}).length > 10, null, { timeout: 30000 });
      await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
      await page.click('.ctab[data-cat="advanced"]');
      sel = ['.cat-panel[data-cat="advanced"] .adv-group-title', '.cat-panel[data-cat="advanced"] .ctl-label'];
    } else {
      await page.goto(`${base}/trope_tutor.html`, { waitUntil: 'load' });
      await page.waitForFunction(() => window.I18n); await page.evaluate(() => window.I18n.ready);
      await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
      await page.click('#tabSettings');
      sel = ['#settingsView .tu-set-title', '#settingsView .tu-set-label'];
    }
    await page.waitForTimeout(500);
    const r = await page.evaluate(READ, sel);
    if (!r.heads.length || !r.label) throw new Error('handle missing: ' + sel.join(' / '));
    const L = r.label;
    ok(r.heads.every(h => h.fs >= 1.25 * L.fs && h.fw >= L.fw), `${tag} — (1) every group heading outranks its items' label`, { heads: r.heads.map(h => [h.text, h.fs, h.fw]), label: [L.fs, L.fw] });
    ok(r.heads.every(h => h.h < 1.6 * h.lh), `${tag} — (2) each heading on one line`, r.heads.map(h => [h.text, Math.round(h.h), Math.round(h.lh)]));
    (twins[cell.lang + cell.dark] ||= {})[tool] = { fs: r.heads[0].fs, fw: r.heads[0].fw, fam: r.heads[0].fam };
    ok(errors.length === 0, `${tag} — 0 page errors`, errors.slice(0, 2));
  } catch (e) { ok(false, `${tag} — ran`, String(e).slice(0, 200)); }
  await ctx.close();
}
for (const [k, t] of Object.entries(twins)) ok(t.fontmaker && t.tutor && JSON.stringify(t.fontmaker) === JSON.stringify(t.tutor), `(3) the twins agree (${k})`, t);
await browser.close(); server.close();
console.log(fail ? `FAIL — ${fail} step(s)` : 'PASS');
process.exit(fail ? 1 : 0);
