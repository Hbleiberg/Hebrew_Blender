#!/usr/bin/env node
// S635 (the S618 D Candidate, from the queue) — `fcTrackStickies()` read the header's and the Start bar's `offsetHeight`
// inside the DOMContentLoaded task, forcing the page's first layout mid-boot (panel memory and the translated labels
// then change the page, which lays out again); its ResizeObserver's first callback, after the first layout and before
// the first paint, already delivers both heights. The read is now the observer's alone (the fallback without one keeps it).
//
// Flash Cards in EN light 1280, HE dark 800 and EN light 390: (1) neither element's offsetHeight is read before
// DOMContentLoaded's listeners finish (the getter instrumented from an init script; a planted read in the same task
// is the control); (2) after load `--fc-head-h` / `--fc-cta-h` equal the two heights and the root's scroll padding
// carries them (the S560 focus fix's input); (3) the window narrowed to 390 (the header wraps) and widened back: the
// variables follow the new heights. 0 page errors.
//
//   node scripts/loop/probes/S635-flash-cards-sticky-heights-read-after-first-layout.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S635 fails (1) in every cell); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: false, w: 390 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
for (const plant of [true, false]) for (const cell of (plant ? CELLS.slice(0, 1) : CELLS)) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}${plant ? ' (control)' : ''}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, plant]) => {
    // every offsetHeight read of the header or the Start bar, and whether DOMContentLoaded's listeners had finished
    window.__reads = []; window.__dclDone = false;
    const d = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { if (this.matches && this.matches('.app-header, .start-cta')) window.__reads.push({ el: this.className.split(' ')[0], afterDcl: window.__dclDone }); return d.get.call(this); } });
    document.addEventListener('DOMContentLoaded', () => { if (plant) { const h = document.querySelector('.app-header'); if (h) h.offsetHeight; } }, true);
    window.addEventListener('DOMContentLoaded', () => { window.__dclDone = true; });   // the window's listeners run after the document's
    if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1');
  }, [cell.lang, cell.dark, plant]);
  let r = {}, ok = false;
  try {
    await page.goto(BASE + '/flash_cards.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready); await page.waitForTimeout(800);
    const st = () => page.evaluate(() => { const h = document.querySelector('.app-header'), c = document.querySelector('.start-cta'), s = document.documentElement.style, cs = getComputedStyle(document.documentElement);
      return h && c ? { head: s.getPropertyValue('--fc-head-h'), cta: s.getPropertyValue('--fc-cta-h'), hh: h.getBoundingClientRect().height, ch: c.getBoundingClientRect().height, pad: cs.scrollPaddingBlockStart } : null; });
    const a = await st(); if (!a) throw new Error('handle missing: .app-header / .start-cta');
    r.mid = await page.evaluate(() => window.__reads.filter(x => !x.afterDcl).length);
    r.reads = await page.evaluate(() => window.__reads.length);
    r.load = a;
    const tracks = (x) => Math.abs(parseFloat(x.head) - Math.round(x.hh)) <= 1 && Math.abs(parseFloat(x.cta) - Math.round(x.ch)) <= 1 && Math.abs(parseFloat(x.pad) - (parseFloat(x.head) + 8)) <= 1;
    if (plant) { ok = r.mid >= 1; out(ok, tag, 'a planted read in the DOMContentLoaded task is counted', r); await ctx.close(); continue; }
    await page.setViewportSize({ width: 360, height: 900 }); await page.waitForTimeout(400); const narrow = await st();
    await page.setViewportSize({ width: cell.w, height: 900 }); await page.waitForTimeout(400); const back = await st();
    r.narrow = narrow; r.back = back;
    ok = r.mid === 0 && tracks(a) && tracks(narrow) && tracks(back) && (narrow.hh !== a.hh || cell.w <= 390);   // the narrowing must move the header, unless it already wraps
  } catch (e) { r.error = String(e).slice(0, 160); }
  if (errors.length) { ok = false; r.errors = errors.slice(0, 3); }
  if (!plant) out(ok, tag, 'no height read mid-boot; the variables follow the header and the Start bar', r);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: the control fired; every cell');
process.exit(fail ? 1 : 0);
