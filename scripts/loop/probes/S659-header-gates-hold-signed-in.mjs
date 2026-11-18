#!/usr/bin/env node
// S659 — the header wrap gates hold signed in. The account chip is a header control whose label changes: "Sign in"
// signed out, the avatar and a first name of up to 16 letters signed in (62px wider). Each page's gate was measured
// signed out, so a signed-in teacher's one-row header spilled past the screen: the home page up to 511px (521 under a
// finger), Flash Cards up to 726px (735), the Trope Tutor up to 499px (509) — the dark toggle cut off at the edge.
// Per page × EN / HE × mouse / touch (hasTouch + isMobile, pointer:coarse) × signed out / a 16-letter first name, at
// 1px steps over the page's band: nothing in the header past either screen edge and no sideways document scroll.
// "Signed in" = a stored session with the SDK request held, so the chip shows the cached name (status "loading",
// the same avatar + first name the signed-in chip draws); the chip's label is asserted before a width counts.
// Measured in the real UI fonts (the fallback faces are wider and invent bands): Google Fonts are fetched by curl
// through the environment's proxy into a cache under the OS temp dir; without them the probe skips loudly.
//
//   node scripts/loop/probes/S659-header-gates-hold-signed-in.mjs
//   exit 1 when a width spills or a handle is missing; ROOT=<a git archive of the tree> runs another copy (the tree
//   before S659 fails all three pages signed in); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PAGES = [
  { page: 'index.html', from: 440, to: 560 },
  { page: 'trope_tutor.html', from: 440, to: 560 },
  { page: 'flash_cards.html', from: 640, to: 900 },
];
const NAME = 'Alexandrinaelena Vos';   // 16 letters before the space: the chip's longest first name
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const CACHE = path.join(os.tmpdir(), 'ivrit-probe-fonts'); fs.mkdirSync(CACHE, { recursive: true });
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
let fontFail = 0;
function font(url) {
  const f = path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex'));
  if (!fs.existsSync(f)) {
    const hdr = execFileSync('curl', ['-sSf', '--max-time', '20', '-A', UA, '-D', '-', '-o', f, url]).toString();
    const m = hdr.match(/content-type:\s*([^\r\n]+)/i); fs.writeFileSync(f + '.type', m ? m[1] : 'application/octet-stream');
  }
  return { body: fs.readFileSync(f), type: fs.readFileSync(f + '.type', 'utf8') };
}
const browser = await chromium.launch();
const results = []; let fails = 0, missing = 0;
for (const { page: pg, from, to } of PAGES) for (const lang of ['en', 'he']) for (const touch of [false, true]) for (const name of ['', NAME]) {
  const ctx = await browser.newContext({ viewport: { width: to, height: 800 }, serviceWorkers: 'block', hasTouch: touch, isMobile: touch });
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) { try { const c = font(u); return route.fulfill({ status: 200, body: c.body, headers: { 'content-type': c.type, 'access-control-allow-origin': '*' } }); } catch (e) { fontFail++; return route.abort(); } }
    if (u.startsWith('https://cdn.jsdelivr.net/npm/@supabase') || u.startsWith('https://hhkmqwpjsyxdeuhvcyis.supabase.co')) return;   // held: the chip stays "loading" on the cached name
    return route.abort();
  });
  await ctx.addInitScript(([lang, name]) => {
    if (sessionStorage.getItem('__s659')) return;
    sessionStorage.setItem('__s659', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', '1');   // dark: its "Light" label is the widest
    if (name) { localStorage.setItem('sb-hhkmqwpjsyxdeuhvcyis-auth-token', JSON.stringify({ user: { id: '00000000-0000-4000-8000-000000000659' } })); localStorage.setItem('ivritSuite_accountCache', JSON.stringify({ email: 'teacher@example.com', name })); }
  }, [lang, name]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${base}/${pg}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500); await page.evaluate(() => document.fonts.ready);
  if (fontFail) { console.log(`SKIP: Google Fonts unreachable (${fontFail} requests) — the real UI fonts are needed; nothing measured.`); await browser.close(); server.close(); process.exit(0); }
  const spills = []; let label = null;
  for (let w = to; w >= from; w--) {
    await page.setViewportSize({ width: w, height: 800 });
    const m = await page.evaluate(() => new Promise(r => requestAnimationFrame(() => {
      const h = document.querySelector('header'), chip = document.querySelector('.ivacct-btn');
      if (!h || !chip) return r({ missing: true });
      const iw = document.documentElement.clientWidth; let o = document.documentElement.scrollWidth - iw;
      for (const el of h.querySelectorAll('*')) { const c = el.getBoundingClientRect(); if (!c.width || el.closest('.ivacct-menu,[hidden]')) continue; o = Math.max(o, c.right - iw, -c.left); }
      r({ o: Math.round(o), state: chip.getAttribute('data-state'), text: chip.textContent });
    })));
    if (m.missing) { missing++; break; }
    if (label === null) label = `${m.text} [${m.state}]`;
    if (name ? m.state !== 'loading' || !m.text.includes(name.split(' ')[0]) : m.state !== 'anonymous') { missing++; label += ' — the chip left its state'; break; }
    if (m.o > 0) spills.push(`${w}:${m.o}`);
  }
  const ok = !spills.length && !errs.length && label !== null;
  if (!ok) fails++;
  const rec = { page: pg, lang, pointer: touch ? 'touch' : 'mouse', chip: label, band: `${from}–${to}`, spills: spills.slice(0, 6), errors: errs.length };
  results.push(rec);
  if (!JSON_OUT) console.log(`${ok ? 'PASS' : 'FAIL'} ${pg} ${lang} ${rec.pointer} ${name ? 'signed in' : 'signed out'} (${label}): ${spills.length ? 'spills at ' + spills.slice(0, 6).join(' ') + (spills.length > 6 ? ` … (${spills.length} widths)` : '') : `nothing past the screen at ${from}–${to}px`}${errs.length ? `, ${errs.length} page errors` : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(results, null, 1));
console.log(`${results.length - fails} / ${results.length} cells clean${missing ? `; ${missing} with a missing handle` : ''}`);
process.exit(fails || missing ? 1 : 0);
