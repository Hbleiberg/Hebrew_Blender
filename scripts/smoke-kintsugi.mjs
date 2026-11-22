#!/usr/bin/env node
/*
 * smoke-kintsugi.mjs — the home page's gold cracks (brand/kintsugi/) keep clear of its text.
 *
 * A fracture is decoration in the navy header or footer of index.html. The rule (docs/reference/home.md → Kintsugi):
 * wherever a fracture shows, its strokes stay CLEAR px or more from every piece of text and every control in its bar;
 * where a layout cannot give it that, a gate in the page's CSS hides it. This measures the rule:
 *   - the centre line of every crack (fractures.json), sampled every 2px and placed through its image's box on
 *     screen (mirrored in the Hebrew UI, cut off where the bar ends);
 *   - against what is drawn in that bar: the box of every control that has one (the lockup, the language switcher,
 *     the account chip, the dark toggle, the social buttons, Sefaria's logo) and the line boxes of the words
 *     everywhere else (the footer's links, headings and credits);
 *   - at every width its set shows at: the wide set at 1280-1500px and at 1600 / 1920 / 2560, the narrow set at
 *     320-600px;
 *   - EN and HE, light and dark, a mouse and a finger (hasTouch + isMobile, which flips pointer:coarse), and for the
 *     wide set signed out and signed in with a 16-letter first name (a stored session with the SDK request held, so
 *     the chip shows the cached name: the S659 probe's method).
 * It also checks that the wide set shows only from 1280px and the narrow set only up to 600px.
 *
 *   node scripts/smoke-kintsugi.mjs            exit 1 when a fracture that shows comes within CLEAR px of text
 *   node scripts/smoke-kintsugi.mjs --report   shows every fracture whatever its gate says and prints the widths at
 *                                              which each is clear: how a gate is set (hide the fracture below the
 *                                              first width from which it stays clear), never a reason to move one
 *
 * Run it whenever a header control, a footer link or its label, the lockup's size or fractures.json changes.
 * Measured in the real UI fonts (the fallback faces are wider and invent collisions): Google Fonts are fetched by
 * curl through the environment's proxy into a cache under the OS temp dir; without them the script skips loudly.
 * Sefaria's badge in the footer is fetched the same way, so its real box is measured; where its host cannot be
 * reached the footer shows the image's alt text instead and the run says so.
 */
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REPORT = process.argv.includes('--report');
const CLEAR = 6;                                   // px between a stroke's centre line and the nearest text or control
const NAME = 'Alexandrinaelena Vos';               // 16 letters before the space: the chip's longest first name
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const WIDE = [...range(1280, 1500), 1600, 1920, 2560], NARROW = range(320, 600), BETWEEN = [601, 800, 1024, 1279];
const allowed = { wide: w => w >= 1280, narrow: w => w <= 600 };

/* The fractures: each crack's centre line every 2px, in its own file's coordinates (the viewBox the builder cut). */
const DIR = path.join(ROOT, 'brand', 'kintsugi');
const FR = JSON.parse(fs.readFileSync(path.join(DIR, 'fractures.json'), 'utf8')).fractures.map(f => {
  const vb = fs.readFileSync(path.join(DIR, f.id + '.svg'), 'utf8').match(/viewBox="(-?[\d.]+) (-?[\d.]+) /);
  if (!vb) throw new Error(`brand/kintsugi/${f.id}.svg has no viewBox: run node scripts/build-kintsugi.mjs`);
  const pts = [];
  for (const c of f.cracks) for (let i = 0; i < c.p.length - 1; i++) {
    const [ax, ay] = c.p[i], [bx, by] = c.p[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2));
    for (let k = 0; k <= n; k++) pts.push([+(ax + (bx - ax) * k / n - vb[1]).toFixed(1), +(ay + (by - ay) * k / n - vb[2]).toFixed(1)]);
  }
  return { id: f.id, set: f.area === 'footer-phone' ? 'narrow' : 'wide', bar: f.area === 'header' ? 'header' : 'footer', pts };
});

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
let fontFail = 0, badgeFail = 0;
function font(url) {
  const f = path.join(CACHE, crypto.createHash('sha1').update(url).digest('hex'));
  if (!fs.existsSync(f)) {
    const hdr = execFileSync('curl', ['-sSf', '--max-time', '20', '-A', UA, '-D', '-', '-o', f, url], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    const m = hdr.match(/content-type:\s*([^\r\n]+)/i); fs.writeFileSync(f + '.type', m ? m[1] : 'application/octet-stream');
  }
  return { body: fs.readFileSync(f), type: fs.readFileSync(f + '.type', 'utf8') };
}

/* Runs in the page: for each fracture, null when it is hidden, else how close its centre line comes to the bar's text. */
function measure() {
  const rtl = document.documentElement.dir === 'rtl';
  // What a crack must keep away from is what is drawn: the box of a control that has one (the header's controls, the
  // round social buttons, an image) and the line boxes of the words themselves everywhere else (a footer link is words
  // alone, and its 40px tap row on a phone is not ink).
  const boxes = (bar) => { const rs = [], add = q => { if (q.width > 1 && q.height > 1) rs.push([q.left, q.top, q.right, q.bottom]); };
    const lines = el => { const r = document.createRange(); r.selectNodeContents(el); for (const q of r.getClientRects()) add(q); };
    bar.querySelectorAll('a, button, select, img, p, .hf-head, .hf-tip, .ivacct, [data-i18n-switcher]').forEach(el => {
      if (el.closest('.kin, [hidden], .ivacct-menu')) return;
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.matches('p, .hf-head, .hf-tip') || (el.closest('footer') && el.matches('a, button') && !el.closest('.footer-social'))) lines(el);
      else add(el.getBoundingClientRect()); });
    return rs; };
  const bars = { header: document.querySelector('header'), footer: document.querySelector('footer.home-footer') };
  if (!bars.header || !bars.footer) return { missing: 'header or footer.home-footer' };
  const text = { header: boxes(bars.header), footer: boxes(bars.footer) };
  const chip = document.querySelector('.ivacct-btn');
  const out = { chip: chip ? `${chip.textContent.trim()} [${chip.getAttribute('data-state')}]` : '', fr: {} };
  for (const f of window.__kinFR) {
    const img = document.querySelector('.kin-' + f.id);
    if (!img) return { missing: '.kin-' + f.id };
    if (getComputedStyle(img).display === 'none') { out.fr[f.id] = null; continue; }
    const b = img.getBoundingClientRect(), clip = img.closest('.kin').getBoundingClientRect();
    let min = 9999;
    for (const [x, y] of f.pts) {
      const px = rtl ? b.right - x : b.left + x, py = b.top + y;
      if (px < clip.left || px > clip.right || py < clip.top || py > clip.bottom) continue;   // cut off by the bar's edge
      for (const [l, t, r, bt] of text[f.bar]) { const d = Math.hypot(Math.max(l - px, 0, px - r), Math.max(t - py, 0, py - bt)); if (d < min) min = d; }
    }
    out.fr[f.id] = Math.round(min * 10) / 10;
  }
  return out;
}
// "1280-1323, 1400": the members of `some`, as runs of neighbours in the tested list `all`
const spans = (all, some) => { const s = new Set(some), out = []; let a = null, z = null;
  for (const w of [...all, null]) { if (w !== null && s.has(w)) { if (a === null) a = w; z = w; } else if (a !== null) { out.push(a === z ? `${a}` : `${a}-${z}`); a = null; } }
  return out.join(', '); };

const RUNS = [];
for (const lang of ['en', 'he']) for (const dark of [true, false]) for (const touch of [false, true]) {
  for (const name of ['', NAME]) RUNS.push({ set: 'wide', widths: WIDE, lang, dark, touch, name });
  RUNS.push({ set: 'narrow', widths: NARROW, lang, dark, touch, name: '' });
}
const browser = await chromium.launch();
let fails = 0;
for (const run of RUNS) {
  const label = `${run.set} set, ${run.lang} ${run.dark ? 'dark' : 'light'} ${run.touch ? 'touch' : 'mouse'}${run.set === 'wide' ? (run.name ? ' signed in' : ' signed out') : ''}`;
  const ctx = await browser.newContext({ viewport: { width: run.widths[0], height: 900 }, serviceWorkers: 'block', hasTouch: run.touch, isMobile: run.touch });
  await ctx.route('**/*', async route => {
    const u = route.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
    if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) { try { const c = font(u); return route.fulfill({ status: 200, body: c.body, headers: { 'content-type': c.type, 'access-control-allow-origin': '*' } }); } catch (e) { fontFail++; return route.abort(); } }
    if (u.startsWith('https://files.readme.io/')) { try { const c = font(u); return route.fulfill({ status: 200, body: c.body, headers: { 'content-type': c.type } }); } catch (e) { badgeFail++; return route.abort(); } }   // Sefaria's badge
    if (run.name && (u.startsWith('https://cdn.jsdelivr.net/npm/@supabase') || u.startsWith('https://hhkmqwpjsyxdeuhvcyis.supabase.co'))) return;   // held: the chip stays on the cached name
    return route.abort();
  });
  await ctx.addInitScript(([lang, dark, name]) => {
    if (sessionStorage.getItem('__kin')) return;
    sessionStorage.setItem('__kin', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    localStorage.setItem('hebrewBlender_whatsNewSeen', '2026-11-name-tags');   // the What's-new card stays away
    if (name) { localStorage.setItem('sb-hhkmqwpjsyxdeuhvcyis-auth-token', JSON.stringify({ user: { id: '00000000-0000-4000-8000-000000000659' } })); localStorage.setItem('ivritSuite_accountCache', JSON.stringify({ email: 'teacher@example.com', name })); }
  }, [run.lang, run.dark, run.name]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500); await page.evaluate(() => document.fonts.ready);
  // the footer's badge is lazy: load the one that shows, so the crack beside it is measured against its real box
  await page.evaluate(() => Promise.all([...document.querySelectorAll('.hf-sefaria img')].filter(i => getComputedStyle(i).display !== 'none').map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); })));
  if (fontFail) { console.log(`SKIP: Google Fonts unreachable (${fontFail} requests) — the real UI fonts are needed; nothing measured.`); await browser.close(); server.close(); process.exit(0); }
  await page.evaluate(fr => { window.__kinFR = fr; }, FR);
  if (REPORT) await page.addStyleTag({ content: `.kin-${run.set}{display:block !important;}` });
  const tested = [...run.widths, ...(REPORT || run.name ? [] : BETWEEN)], table = {}; let missing = null, chip = '';
  for (const w of tested) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const m = await page.evaluate(measure);
    if (m.missing) { missing = m.missing; break; }
    chip = chip || m.chip;
    if (run.name ? !(m.chip.includes('[loading]') && m.chip.includes(run.name.split(' ')[0])) : !m.chip.includes('[anonymous]')) { missing = `the account chip left its state: ${m.chip}`; break; }
    table[w] = m.fr;
  }
  await ctx.close();
  if (missing) { fails++; console.log(`FAIL ${label}: missing handle — ${missing}`); continue; }
  const close = [], stray = []; let nearest = [9999, ''], shown = 0;
  if (REPORT) console.log(`REPORT ${label} (${chip}): every fracture of the set forced on`);
  for (const f of FR) {
    const at = tested.filter(w => table[w][f.id] !== null);
    if (!REPORT) { const off = at.filter(w => !allowed[f.set](w)); if (off.length) stray.push(`${f.id} shows at ${spans(tested, off)}px`); }
    if (f.set !== run.set) continue;
    if (at.length) shown++;
    const near = at.filter(w => table[w][f.id] < CLEAR), min = at.length ? Math.min(...at.map(w => table[w][f.id])) : null;
    if (min !== null && min < nearest[0]) nearest = [min, f.id];
    if (REPORT) console.log(`   ${f.id}: clear at ${spans(tested, at.filter(w => table[w][f.id] >= CLEAR)) || 'no width'}; closest ${min}px${near.length ? `; within ${CLEAR}px at ${spans(tested, near)}` : ''}`);
    else if (near.length) close.push(`${f.id} is ${min}px from text at ${spans(tested, near)}px`);
  }
  const ok = !close.length && !stray.length && !errs.length;
  if (!ok && !REPORT) fails++;
  if (!REPORT) console.log(`${ok ? 'PASS' : 'FAIL'} ${label} (${chip}): ${shown} fractures show, the nearest ${nearest[1]} at ${nearest[0]}px${close.length ? ' — ' + close.join('; ') : ''}${stray.length ? ' — outside its range: ' + stray.join('; ') : ''}${errs.length ? ` — ${errs.length} page errors` : ''}`);
  else if (errs.length) console.log(`   ${errs.length} page errors`);
}
await browser.close(); server.close();
if (badgeFail) console.log(`NOTE: Sefaria's badge could not be fetched (${badgeFail} requests) — the footer was measured with its alt text in the badge's place.`);
console.log(REPORT ? 'report only: nothing asserted' : `${RUNS.length - fails} / ${RUNS.length} runs clean`);
process.exit(!REPORT && fails ? 1 : 0);
