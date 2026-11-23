#!/usr/bin/env node
/*
 * smoke-kintsugi.mjs — the gold cracks (brand/kintsugi/) keep clear of text: the home page's, and every other header's.
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
 *   - EN and HE, light and dark, a mouse and a finger (hasTouch + isMobile, which flips pointer:coarse), signed out
 *     and signed in with a 16-letter first name (a stored session with the SDK request held, so the chip shows the
 *     cached name: the S659 probe's method) — the phone header's two fractures sit beside the lockup while the
 *     controls keep a row of their own, and the chip's width decides where that stops.
 * It also checks that the wide set shows only from 1280px and the narrow set only up to 600px.
 *
 * Every other page shows the header drawings in the gap between its title and its controls (.kin-gap: a spacer in the
 * header's row; docs/reference/home.md → Kintsugi cracks). For each such page — every root page that carries a gap, and
 * one generated parsha page and one holiday page, after checking that every generated page of a kind has the same header —
 * this measures, at 1280-1920px in 8px steps and at 2000 / 2200 / 2560, EN and HE, a mouse and a finger, signed out and
 * (where the page has the account chip) signed in with a 16-letter first name, in the dark theme (its "Light" label is
 * the widest):
 *   - every drawing that shows keeps its centre line CLEAR px from the header's text and controls, and lies whole inside its gap;
 *   - the gap reaches the bar's top and bottom edges (the page's --kin-pt / --kin-pb match its header's padding);
 *   - no gap shows below 1280px (checked at 390, 1024 and 1279), and at 2560px every gap shows a drawing;
 *   - on a page that takes the phone drawing (.kin-pgap, a spacer inside a short title's block), at 320-600px in 2px
 *     steps: the spacer starts at the bar's top edge and the title shares the lockup's row, the drawing lies whole
 *     inside the spacer and keeps CLEAR px from the header's text and controls, it shows at some phone width, and
 *     nothing of it is laid out above 600px.
 * And every page's navy footer (.sf-bar; the generated pages as above), in EN and HE: each fracture and seam drawing that
 * shows keeps CLEAR px from the bar's text, its social buttons and Sefaria's badge at 1280-1500px in 4px steps and at
 * 1600 / 1920 / 2560, and at 320-600px in 4px steps; the wide set shows only from 1280px and the narrow set only up to
 * 600px; and a footer shows cracks at all (three or more on a desktop, two or more on a phone).
 *
 *   node scripts/smoke-kintsugi.mjs            exit 1 when a fracture that shows comes within CLEAR px of text
 *   node scripts/smoke-kintsugi.mjs --report   shows every fracture whatever its gate says and prints the widths at
 *                                              which each is clear: how a gate is set (hide the fracture below the
 *                                              first width from which it stays clear), never a reason to move one
 *                                              (the home page only: a gap has no gate to set)
 *   node scripts/smoke-kintsugi.mjs --home     the home page only          --gaps   the other pages only
 *   node scripts/smoke-kintsugi.mjs --only contact.html [--only …]         those pages' gaps only
 *
 * Run it whenever a header control, a page's title or tagline, a header's padding, a footer link or its label, the
 * lockup's size or fractures.json changes.
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
const ONLY = process.argv.map((a, i) => (a === '--only' ? process.argv[i + 1] : null)).filter(Boolean);
const DO_HOME = !process.argv.includes('--gaps') && !ONLY.length, DO_GAPS = !process.argv.includes('--home') && !REPORT;
const CLEAR = 6;                                   // px between a stroke's centre line and the nearest text or control
const NAME = 'Alexandrinaelena Vos';               // 16 letters before the space: the chip's longest first name
const SHORT = 'i';                                 // …and its shortest: the narrowest chip, with which the phone header keeps one row from the smallest width
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
  return { id: f.id, set: f.area.endsWith('-phone') ? 'narrow' : 'wide', bar: f.area.startsWith('header') ? 'header' : 'footer', pts };
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
  const bars = { header: document.querySelector('header'), footer: document.querySelector('footer.site-footer .sf-bar') };
  if (!bars.header || !bars.footer) return { missing: 'header or footer.site-footer .sf-bar' };
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
if (DO_HOME) for (const lang of ['en', 'he']) for (const dark of [true, false]) for (const touch of [false, true]) {
  for (const name of ['', NAME]) for (const [set, widths] of [['wide', WIDE], ['narrow', NARROW]]) RUNS.push({ set, widths, lang, dark, touch, name });
  RUNS.push({ set: 'narrow', widths: NARROW, lang, dark, touch, name: SHORT });
}
const browser = await chromium.launch();
let fails = 0;
for (const run of RUNS) {
  const label = `${run.set} set, ${run.lang} ${run.dark ? 'dark' : 'light'} ${run.touch ? 'touch' : 'mouse'}${run.name ? (run.name === SHORT ? ' signed in, a short name' : ' signed in') : ' signed out'}`;
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
/* ───── Every other page: the header drawings in the gap between the title and the controls ───── */
function measureGap(CLEAR) {
  const header = document.querySelector('header'), rtl = document.documentElement.dir === 'rtl';
  const hb = header.getBoundingClientRect(), cs = getComputedStyle(header);
  const top = hb.top + parseFloat(cs.borderTopWidth), bottom = hb.bottom - parseFloat(cs.borderBottomWidth);
  const rs = [], add = q => { if (q.width > 1 && q.height > 1) rs.push([q.left, q.top, q.right, q.bottom]); };
  header.querySelectorAll('a, button, select, input, img, [role="button"]').forEach(el => { if (!el.closest('.kin-gap, .ivacct-menu') && el.getClientRects().length) add(el.getBoundingClientRect()); });
  const tw = document.createTreeWalker(header, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.nodeValue.trim() || n.parentElement.closest('.kin-gap, .ivacct-menu, script, style')) continue; const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) add(q); }
  const chip = document.querySelector('.ivacct-btn');
  const out = { gaps: 0, rendered: 0, shown: 0, min: 9999, who: '', edge: 0, outside: '', empty: 0, chip: chip ? `${chip.textContent.trim()} [${chip.getAttribute('data-state')}]` : '' };
  for (const gap of header.querySelectorAll('.kin-gap')) {
    out.gaps++; if (!gap.getClientRects().length) continue;
    out.rendered++; const g = gap.getBoundingClientRect(); let here = 0;
    out.edge = Math.max(out.edge, Math.abs(g.top - top), Math.abs(g.bottom - bottom));
    for (const img of gap.querySelectorAll('img')) {
      if (!img.getClientRects().length) continue;
      here++; out.shown++; const id = img.className.replace('kg-', ''), b = img.getBoundingClientRect();
      if (b.left < g.left + CLEAR - 0.6 || b.right > g.right - CLEAR + 0.6) out.outside = id;   // a drawing keeps CLEAR px inside each end of its gap
      for (const [x, y] of window.__kinPts[id]) { const px = rtl ? b.right - x : b.left + x, py = b.top + y; if (py < top || py > bottom) continue;
        for (const [l, t, r, bt] of rs) { const d = Math.hypot(Math.max(l - px, 0, px - r), Math.max(t - py, 0, py - bt)); if (d < out.min) { out.min = d; out.who = id; } } }
    }
    if (!here) out.empty++;
  }
  out.min = Math.round(out.min * 10) / 10; out.edge = Math.round(out.edge * 10) / 10;
  return out;
}
/* A phone: the one drawing in the free space after a short title (.kin-pgap, the last child of the title block). */
function measurePhoneGap(CLEAR) {
  const header = document.querySelector('header'), rtl = document.documentElement.dir === 'rtl';
  const top = header.getBoundingClientRect().top + parseFloat(getComputedStyle(header).borderTopWidth);
  const rs = [], add = q => { if (q.width > 1 && q.height > 1) rs.push([q.left, q.top, q.right, q.bottom]); };
  header.querySelectorAll('a, button, select, input, img, [role="button"]').forEach(el => { if (!el.closest('.kin-gap, .kin-pgap, .ivacct-menu') && el.getClientRects().length) add(el.getBoundingClientRect()); });
  const tw = document.createTreeWalker(header, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (!n.nodeValue.trim() || n.parentElement.closest('.kin-gap, .kin-pgap, .ivacct-menu, script, style')) continue; const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) add(q); }
  const gap = header.querySelector('.kin-pgap'), out = { has: !!gap, rendered: false, shown: false, min: 9999, edge: 0, outside: false, lock: false };
  if (!gap || !gap.getClientRects().length) return out;
  out.rendered = true; const g = gap.getBoundingClientRect(), img = gap.querySelector('img');
  out.edge = Math.round(Math.abs(g.top - top) * 10) / 10;                       // the spacer starts at the bar's top edge: the crack's root
  const lock = header.querySelector('.brand-lockup'); out.lock = !!lock && Math.abs(lock.getBoundingClientRect().top - gap.parentElement.getBoundingClientRect().top) > 30;   // the title has left the lockup's row
  if (!img.getClientRects().length) return out;
  out.shown = true; const b = img.getBoundingClientRect(), id = img.className.replace('kg-', '');
  if (b.left < g.left + CLEAR - 0.6 || b.right > g.right - CLEAR + 0.6) out.outside = true;
  for (const [x, y] of window.__kinPts[id]) { const px = rtl ? b.right - x : b.left + x, py = b.top + y; if (py < g.top || py > g.bottom) continue;   // cut where the title's row ends
    for (const [l, t, r, bt] of rs) { const d = Math.hypot(Math.max(l - px, 0, px - r), Math.max(t - py, 0, py - bt)); if (d < out.min) out.min = d; } }
  out.min = Math.round(out.min * 10) / 10; return out;
}
function measureFooter() {
  const bar = document.querySelector('footer.site-footer .sf-bar'); if (!bar) return null;
  const rtl = document.documentElement.dir === 'rtl', rs = [], add = q => { if (q.width > 1 && q.height > 1) rs.push([q.left, q.top, q.right, q.bottom]); };
  bar.querySelectorAll('.hf-inner img:not(.kin-f), .footer-social a').forEach(e => { if (e.getClientRects().length) add(e.getBoundingClientRect()); });
  const tw = document.createTreeWalker(bar.querySelector('.hf-inner'), NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { const pe = n.parentElement; if (!n.nodeValue.trim() || !pe.getClientRects().length || pe.closest('.footer-social')) continue;
    let hid = false; for (let e = pe; e && e !== bar; e = e.parentElement) if (getComputedStyle(e).clipPath !== 'none') hid = true;   // a heading kept for a screen reader only
    if (hid) continue; const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) add(q); }
  const clip = bar.getBoundingClientRect(), out = { shown: 0, min: 9999, who: '', sets: [] };
  for (const img of bar.querySelectorAll('.kin-f')) {
    if (!img.getClientRects().length) continue;
    const seam = img.closest('.hf-seam'), id = img.getAttribute('src').match(/([a-z]\d)\.svg/)[1], b = img.getBoundingClientRect(), c2 = seam ? seam.getBoundingClientRect() : clip;
    out.shown++; out.sets.push(img.classList.contains('kin-narrow') ? 'narrow' : 'wide');
    for (const [x, y] of window.__kinPts[id]) { const px = rtl ? b.right - x : b.left + x, py = b.top + y; if (px < c2.left || px > c2.right || py < Math.max(c2.top, clip.top) || py > clip.bottom) continue;
      for (const [l, t, r, bt] of rs) { const d = Math.hypot(Math.max(l - px, 0, px - r), Math.max(t - py, 0, py - bt)); if (d < out.min) { out.min = d; out.who = id + (seam ? ' (seam)' : ''); } } }
  }
  out.min = Math.round(out.min * 10) / 10; return out;
}
let gapRuns = 0, gapFails = 0;
if (DO_GAPS) {
  let pages = fs.readdirSync(ROOT).filter(n => n.endsWith('.html') && fs.readFileSync(path.join(ROOT, n), 'utf8').includes('class="kin-gap')).sort();
  // the generated pages: every page of a kind carries the same header, so one of each stands for all of them
  for (const dir of ['parsha', 'holidays']) {
    const files = fs.readdirSync(path.join(ROOT, dir)).filter(n => n.endsWith('.html') && n !== 'index.html').sort();
    const heads = new Set(files.map(n => (fs.readFileSync(path.join(ROOT, dir, n), 'utf8').match(/<header>[\s\S]*?<\/header>/) || [''])[0]));
    if (heads.size !== 1 || ![...heads][0].includes('class="kin-gap')) { gapFails++; gapRuns++; console.log(`FAIL ${dir}/: the generated pages do not all carry one header with a gap (${heads.size} different headers)`); }
    else pages.push(`${dir}/${files[0]}`);
  }
  if (ONLY.length) pages = pages.filter(p => ONLY.includes(p));
  const GW = [390, 1024, 1279, ...Array.from({ length: 81 }, (_, i) => 1280 + i * 8), 2000, 2200, 2560];
  const PTS = Object.fromEntries(FR.map(f => [f.id, f.pts]));
  const FW = [...Array.from({ length: 56 }, (_, i) => 1280 + i * 4), 1600, 1920, 2560, ...Array.from({ length: 71 }, (_, i) => 320 + i * 4), 601, 800, 1024, 1279];
  const PW = [...Array.from({ length: 141 }, (_, i) => 320 + i * 2), 601, 800, 1024, 1280];
  const jobs = [];
  for (const pg of pages) { const src = fs.readFileSync(path.join(ROOT, pg), 'utf8'), chip = /<script[^>]*src="\/?js\/ivrit-account\.js/.test(src);   // the page loads the account module, so its header has the chip
    for (const lang of ['en', 'he']) for (const touch of [false, true]) for (const name of chip ? ['', NAME] : ['']) jobs.push({ pg, lang, touch, name, chip, phone: src.includes('class="kin-pgap"') }); }
  async function gapRun(job) {
    const label = `gap ${job.pg}, ${job.lang} ${job.touch ? 'touch' : 'mouse'}${job.chip ? (job.name ? ' signed in' : ' signed out') : ''}`;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block', hasTouch: job.touch, isMobile: job.touch });
    await ctx.route('**/*', async route => {
      const u = route.request().url();
      if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
      if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) { try { const c = font(u); return route.fulfill({ status: 200, body: c.body, headers: { 'content-type': c.type, 'access-control-allow-origin': '*' } }); } catch (e) { fontFail++; return route.abort(); } }
      if (job.name && (u.startsWith('https://cdn.jsdelivr.net/npm/@supabase') || u.startsWith('https://hhkmqwpjsyxdeuhvcyis.supabase.co'))) return;   // held: the chip stays on the cached name
      return route.abort();
    });
    await ctx.addInitScript(([lang, name]) => {
      if (sessionStorage.getItem('__kin')) return;
      sessionStorage.setItem('__kin', '1');
      localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', '1');
      if (name) { localStorage.setItem('sb-hhkmqwpjsyxdeuhvcyis-auth-token', JSON.stringify({ user: { id: '00000000-0000-4000-8000-000000000659' } })); localStorage.setItem('ivritSuite_accountCache', JSON.stringify({ email: 'teacher@example.com', name })); }
    }, [job.lang, job.name]);
    const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
    await page.goto(`${base}/${job.pg}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500); await page.evaluate(() => document.fonts.ready);
    if (fontFail) { await ctx.close(); return null; }
    await page.evaluate(pts => { window.__kinPts = pts; }, PTS);
    const bad = []; let nearest = [9999, '', 0], most = 0, chip = '';
    for (const w of GW) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const m = await page.evaluate(measureGap, CLEAR);
      chip = chip || m.chip;
      if (!m.gaps) { bad.push('no .kin-gap in the header'); break; }
      if (job.chip && (job.name ? !(m.chip.includes('[loading]') && m.chip.includes(job.name.split(' ')[0])) : !m.chip.includes('[anonymous]'))) { bad.push(`the account chip left its state: ${m.chip}`); break; }
      if (w < 1280) { if (m.rendered) bad.push(`a gap shows at ${w}px`); continue; }
      if (m.rendered !== m.gaps) bad.push(`a gap is not laid out at ${w}px`);
      if (m.edge > 1) bad.push(`at ${w}px the gap misses the bar's edge by ${m.edge}px (--kin-pt / --kin-pb)`);
      if (m.outside) bad.push(`at ${w}px ${m.outside} is not ${CLEAR}px inside its gap`);
      if (m.shown && m.min < CLEAR) bad.push(`at ${w}px ${m.who} is ${m.min}px from text`);
      if (m.shown && m.min < nearest[0]) nearest = [m.min, m.who, w];
      if (w === 2560 && m.empty) bad.push('a gap shows no drawing at 2560px');
      most = Math.max(most, m.shown);
    }
    // a phone: the page's one drawing after its title, at every second width up to 600px, and nowhere above
    let phone = '';
    if (job.phone && !bad.length) {
      let near = [9999, 0], at = [];
      for (const w of PW) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const m = await page.evaluate(measurePhoneGap, CLEAR);
        if (!m.has) { bad.push('no .kin-pgap in the header'); break; }
        if (w > 600) { if (m.rendered) bad.push(`the phone gap shows at ${w}px`); continue; }
        if (!m.rendered) { bad.push(`the phone gap is not laid out at ${w}px`); continue; }
        if (m.lock) bad.push(`at ${w}px the title is not on the lockup's row`);
        if (m.edge > 1) bad.push(`at ${w}px the phone gap misses the bar's top edge by ${m.edge}px (--kin-ppt)`);
        if (!m.shown) continue;
        at.push(w);
        if (m.outside) bad.push(`at ${w}px the phone drawing is not ${CLEAR}px inside its gap`);
        if (m.min < CLEAR) bad.push(`at ${w}px the phone drawing is ${m.min}px from text`);
        if (m.min < near[0]) near = [m.min, w];
      }
      if (!at.length) bad.push('the phone gap shows no drawing at any phone width');
      phone = `; phone: the drawing shows at ${spans(PW, at) || 'no width'}px, nearest ${near[0]}px (${near[1]}px wide)`;
    }
    // the page's footer: once per language is enough (nothing in it follows the pointer or the sign-in state)
    let foot = '';
    if (!job.touch && !job.name && !bad.length) {
      await page.evaluate(() => Promise.all([...document.querySelectorAll('.sf-bar img:not(.kin-f)')].map(i => { i.loading = 'eager'; return i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }); })));
      let near = [9999, '', 0], at1440 = 0, at390 = 0, has = true;
      for (const w of FW) {
        await page.setViewportSize({ width: w, height: 900 });
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        const m = await page.evaluate(measureFooter);
        if (!m) { has = false; break; }
        if (m.sets.includes('wide') && w < 1280) bad.push(`the footer's wide set shows at ${w}px`);
        if (m.sets.includes('narrow') && w > 600) bad.push(`the footer's narrow set shows at ${w}px`);
        if (m.shown && m.min < CLEAR) bad.push(`in the footer at ${w}px ${m.who} is ${m.min}px from text`);
        if (m.shown && m.min < near[0]) near = [m.min, m.who, w];
        if (w === 1440) at1440 = m.shown; if (w === 392) at390 = m.shown;
      }
      if (has) { if (at1440 < 3) bad.push(`the footer shows ${at1440} cracks at 1440px`); if (at390 < 2) bad.push(`the footer shows ${at390} cracks at 392px`);
        foot = `; footer: ${at1440} cracks at 1440px, ${at390} at 392px, the nearest ${near[1]} at ${near[0]}px (${near[2]}px wide)`; }
      else foot = '; footer: its own (no navy bar)';
    }
    await ctx.close();
    if (errs.length) bad.push(`${errs.length} page errors`);
    const uniq = [...new Set(bad)];
    console.log(`${uniq.length ? 'FAIL' : 'PASS'} ${label}${chip ? ` (${chip})` : ''}: up to ${most} drawings, the nearest ${nearest[1]} at ${nearest[0]}px (${nearest[2]}px wide)${phone}${foot}${uniq.length ? ' — ' + uniq.slice(0, 4).join('; ') + (uniq.length > 4 ? `; and ${uniq.length - 4} more` : '') : ''}`);
    return !uniq.length;
  }
  // four pages at a time: each run is its own browser context
  let next = 0, skipped = false;
  await Promise.all(Array.from({ length: 4 }, async () => { while (next < jobs.length && !skipped) { const job = jobs[next++]; const ok = await gapRun(job); if (ok === null) { skipped = true; break; } gapRuns++; if (!ok) gapFails++; } }));
  if (skipped) { console.log(`SKIP: Google Fonts unreachable (${fontFail} requests) — the real UI fonts are needed; the header gaps were not measured.`); await browser.close(); server.close(); process.exit(fails ? 1 : 0); }
}
await browser.close(); server.close();
if (badgeFail) console.log(`NOTE: Sefaria's badge could not be fetched (${badgeFail} requests) — the footer was measured with its alt text in the badge's place.`);
console.log(REPORT ? 'report only: nothing asserted' : `${RUNS.length - fails} / ${RUNS.length} home-page runs clean` + (DO_GAPS ? `; ${gapRuns - gapFails} / ${gapRuns} header-gap runs clean` : ''));
process.exit(!REPORT && (fails || gapFails) ? 1 : 0);
