#!/usr/bin/env node
// S670 (the S669 G P4) — reading_assignments.html printed while signed out put its Sign in button on paper, a dead
// control under the note that asks for a sign-in. The print block now leaves it off, beside the header's controls.
//   EN / HE × light / dark, signed out (the SDK's origins aborted, so no session), under print media at Letter's 739px
//   and A4's 718px: the note prints, and no button, select or field inside <main> does (a link inside the lede's prose
//   is text, and is allowed).
//
//   node scripts/loop/probes/S670-assignments-signed-out-print-has-no-button.mjs     exit 1 on any failure
//   ROOT=<a git archive of another tree> runs that copy (the tree before S670 fails all 8 cells)
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
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
for (const lang of ['en', 'he']) for (const dark of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, [lang, dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/reading_assignments.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n, null, { timeout: 20000 }); await page.evaluate(() => I18n.ready);
  const out = await page.waitForFunction(() => !document.getElementById('stOut').hidden && document.getElementById('outNote').textContent.trim(), null, { timeout: 15000 }).then(() => true, () => false);
  for (const w of [739, 718]) {
    await page.setViewportSize({ width: w, height: 1000 });
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => {
      const shown = e => { for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden') return false; } return e.getClientRects().length > 0; };
      const ctl = [...document.querySelectorAll('main button, main select, main input, main textarea, main a[href]')].filter(e => shown(e) && !e.closest('.lede'))
        .map(e => (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' "' + (e.textContent || '').trim().slice(0, 20) + '"');
      return { ctl, note: shown(document.getElementById('outNote')) };
    });
    report(out && r.note && !r.ctl.length, `${lang} ${dark ? 'dark' : 'light'} ${w}: signed out ${out}, the note prints ${r.note}; controls on paper ${r.ctl.length} ${r.ctl.join(', ')}`);
    await page.emulateMedia({ media: null });
  }
  if (errs.length) report(false, `${lang} ${dark ? 'dark' : 'light'}: page errors ${errs.join(' | ')}`);
  await ctx.close();
}
console.log(`\n${cells - fails}/${cells} pass`);
await browser.close(); server.close();
process.exit(fails ? 1 : 0);
