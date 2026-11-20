#!/usr/bin/env node
// S669 (found by pass G on the Trope Atlas; pattern header-ink-on-a-plate-print-drops) — a page header is white type on
// a navy plate, and the plate is a background, which paper drops (backgrounds off by default): the title printed white
// on white (Chrome darkens it to a pale grey, #878787–#ababab, 2.3–3.6:1) and the gold-light tagline at 1.4–1.5:1, so a
// printed page lost its own name. Account, Contact, Privacy, Terms, Resources, the Holiday Guide and Reading
// assignments now print their header white under navy ink (the Letter Learner's and the Trope Tutor's earlier fix), and
// the last two leave their header links and toggles off paper as the chrome pages do.
//   Every root page but the harnesses × light / dark, under print media at Letter's 739px: each visible text run inside
//   <header> reads at least 3:1 on white paper, and no header link or button prints. OPEN names the carriers still
//   queued (reported, not failed); a page in OPEN that passes fails the run, so the list is re-trued when one is fixed.
//
//   node scripts/loop/probes/S669-header-title-prints-in-ink.mjs     exit 1 on any failing page
//   ROOT=<a git archive of another tree> runs that copy (the tree before S669 fails 7 pages)
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const OPEN = { 'trope_atlas.html': 'queued S669: the atlas had spent its two touches', 'Hebrew_Font_Maker.html': 'an app with no print design at all (S669 P4)' };
const SKIP = /^(account-test|saves-test|i18n-test|googlee)/;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && !SKIP.test(f) && /<header[\s>]/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))).sort();
let fails = 0, measured = 0;
for (const p of pages) {
  const found = [];
  for (const dark of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 739, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
    await ctx.addInitScript(d => { try { localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, dark);
    const page = await ctx.newPage(); page.on('dialog', d => d.dismiss().catch(() => {}));
    try { await page.goto(`${BASE}/${p}`, { waitUntil: 'load', timeout: 30000 }); } catch (e) { found.push('load failed'); await ctx.close(); continue; }
    await page.waitForTimeout(600);
    await page.emulateMedia({ media: 'print' });
    const r = await page.evaluate(() => {
      const shown = e => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === 'none' || s.visibility === 'hidden') return false; } return e.getClientRects().length > 0; };
      const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const ratio = c => { const m = c.match(/[\d.]+/g); const a = m.length > 3 ? +m[3] : 1; const [r, g, b] = m.slice(0, 3).map(v => 255 - (255 - v) * a); return 1.05 / (0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) + 0.05); };
      const out = []; let runs = 0;
      for (const hd of document.querySelectorAll('header')) {
        if (!shown(hd)) continue;
        const w = document.createTreeWalker(hd, NodeFilter.SHOW_TEXT);
        for (let n; (n = w.nextNode());) {
          const t = n.textContent.trim(), e = n.parentElement; if (!t || !shown(e) || e.closest('[aria-hidden="true"]')) continue;
          runs++; const cr = ratio(getComputedStyle(e).color);
          if (cr < 3) out.push(`"${t.slice(0, 24)}" ${cr.toFixed(2)}:1`);
        }
        for (const c of hd.querySelectorAll('a[href], button, select, input')) if (shown(c) && !c.closest('.brand-lockup')) out.push(`a control prints: "${(c.textContent || c.getAttribute('aria-label') || c.tagName).trim().slice(0, 20)}"`);
      }
      return { out, runs };
    });
    if (r.runs) measured++;
    for (const o of r.out) found.push(`${dark ? 'dark' : 'light'}: ${o}`);
    await ctx.close();
  }
  const uniq = [...new Set(found)];
  if (OPEN[p]) { const ok = uniq.length > 0; if (!ok) fails++; console.log(`${ok ? 'OPEN' : 'FAIL'} ${p}: ${ok ? OPEN[p] + ' — ' + uniq.slice(0, 2).join('; ') : 'passes now — take it out of OPEN'}`); continue; }
  if (uniq.length) fails++;
  console.log(`${uniq.length ? 'FAIL' : 'PASS'} ${p}${uniq.length ? ': ' + uniq.slice(0, 4).join('; ') + (uniq.length > 4 ? ` (+${uniq.length - 4})` : '') : ''}`);
}
await browser.close(); server.close();
if (!measured) { console.log('nothing measured — the probe did not resolve'); process.exit(1); }
console.log(`\n${pages.length - fails}/${pages.length} pages pass (${Object.keys(OPEN).length} open carriers listed)`);
process.exit(fails ? 1 : 0);
