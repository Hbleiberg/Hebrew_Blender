#!/usr/bin/env node
// S630 — the Font Maker's template download and Preview PDF run once a press, and say so before their libraries load
// (pass F, long-build progress). Both are async builds of a few seconds with no lock: a second press drew the sheet (or
// built the font) again alongside and saved a second file; and the template's "Building … template…" line came only
// after html2canvas + jsPDF arrived from cdnjs (563 KB), so on a slow line the press went unanswered (3.1 s measured
// with the library held 3 s).
//
//   node scripts/loop/probes/S630-fontmaker-template-and-preview-once.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile. html2canvas and jsPDF are answered by
//   stand-ins at their cdnjs URLs, held 1.5 s (a counted route hit): the capture holds the main thread 300 ms, `save()`
//   is counted. (1) The wizard's "Print a template sheet (PDF)" (step 3, the name and author typed) pressed by a real
//   click and again 150 ms later (a raw click at the same point): the status line reads the template's "Building …"
//   sentence within 400 ms of the first press, while the library is still held; 1 save; the line ends on "… saved".
//   (2) The wizard finished (Create font on step 3; a first visit's has no Cancel), one letter given an outline, the font build answered by a counted stand-in (the real
//   one needs the Pyodide engine) that takes 800 ms: the toolbar's Preview PDF pressed twice the same way (the
//   library already in from (1), so this half proves the lock) — the "building the font" sentence within 400 ms, 1 build,
//   1 more save. 0 page errors. exit 1 when a step fails or a
//   handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before S630 fails every cell: the
//   template saved twice, its line only after the library; the preview built twice in 3 of the 4 cells).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const H2C = `window.html2canvas = async (el, o) => { await new Promise(r => setTimeout(r, 0)); const t = performance.now(); while (performance.now() - t < 300) {} const c = document.createElement('canvas'); c.width = 400; c.height = 520; return c; };`;
const JSPDF = `window.__saves = window.__saves || []; window.jspdf = { jsPDF: function () { const t = { internal: { pageSize: { getWidth: () => 612, getHeight: () => 792 } }, save: name => { window.__saves.push(name); } };
  return new Proxy(t, { get: (o, k) => (k in o ? o[k] : () => undefined) }); } };`;
const TTF = fs.readFileSync(path.join(ROOT, 'fonts', 'Reuben.ttf')).toString('base64');
const hits = { lib: 0 };
const browser = await chromium.launch();
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.route(/cdnjs\.cloudflare\.com\/ajax\/libs\/(html2canvas|jspdf)\//, async r => { hits.lib++; const h = /html2canvas/.test(r.request().url()); await new Promise(res => setTimeout(res, 1500)); r.fulfill({ status: 200, contentType: 'text/javascript', body: h ? H2C : JSPDF }); });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  // The status line's sentences, each with the ms since the press (polled every animation frame from the page).
  const watch = () => page.evaluate(() => { const R = window.__w = { t0: performance.now(), seen: [], stop: false }; const s = document.getElementById('statusMsg');
    (function tick() { const t = s.textContent.trim(); if (t && !R.seen.some(x => x[0] === t)) R.seen.push([t, Math.round(performance.now() - R.t0)]); if (!R.stop) requestAnimationFrame(tick); })(); });
  // A raw click at the button's centre, scrolled in and re-read before each press (Create font's scroll to the editor
  // lands meanwhile: a second click at the old point hit the letter grid), each point checked to hit the button.
  const point = async sel => {
    const p = await page.evaluate(sel => { const b = document.querySelector(sel); const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y); return { x, y, hit: !!e && b.contains(e) }; }, sel);
    if (!p.hit) throw new Error('covered: ' + sel);
    return p;
  };
  const twice = async sel => {
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    const p = await point(sel);
    await watch(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(150);
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    const q = await point(sel); await page.mouse.click(q.x, q.y);
  };
  try {
    await page.goto(base + '/Hebrew_Font_Maker.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.getElementById('wizardOverlay').classList.contains('open')); await page.evaluate(() => window.I18n.ready);
    const want = await page.evaluate(() => ({ build: I18n.t('fontmaker.status.building_template', { title: I18n.t(TEMPLATE_SPECS.letters.titleKey) }), saved: I18n.t('fontmaker.status.template_saved', { title: I18n.t(TEMPLATE_SPECS.letters.titleKey) }), font: I18n.t('fontmaker.status.building_font_preview') }));
    // (1) the template, from the wizard's step 3
    await page.click('#wizName'); await page.keyboard.type('Test'); await page.click('#wizAuthor'); await page.keyboard.type('Me');
    await page.click('#wizNext'); await page.waitForTimeout(200); await page.click('#wizNext'); await page.waitForTimeout(200);
    const LINK = '#wizardOverlay button.wiz-tile-link[onclick*="downloadTemplate"]';
    await page.waitForSelector(LINK, { state: 'visible' });
    await twice(LINK);
    await page.waitForFunction(saved => document.getElementById('statusMsg').textContent.trim() === saved, want.saved, { timeout: 30000 });
    await page.waitForTimeout(2500);   // a second build, if one started, lands meanwhile
    const a = await page.evaluate(() => { window.__w.stop = true; return { saves: (window.__saves || []).length, seen: window.__w.seen }; });
    const early = a.seen.find(x => x[0] === want.build);
    ok(a.saves === 1 && !!early && early[1] <= 400 && a.seen.some(x => x[0] === want.saved),
      `${L} template: ${a.saves} save(s) for 2 presses; «${want.build}» at ${early ? early[1] + ' ms' : 'never'} (the library held 1.5 s); ends «${a.seen.length ? a.seen[a.seen.length - 1][0] : ''}»`);
    // (2) Preview PDF from the toolbar, the wizard closed
    await page.click('#wizCreate');   // a first visit's wizard is a gate (no Cancel): finish it with step 3's default source
    await page.waitForFunction(() => !document.getElementById('wizardOverlay').classList.contains('open') && typeof project !== 'undefined' && !!project);   // a top-level let, not a window property
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
    await page.evaluate(b64 => {
      window.__builds = 0;
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      window.buildFontBytes = async () => { window.__builds++; await new Promise(r => setTimeout(r, 800)); return bytes; };
      const l = project.letters.find(x => x.key === 'alef' || x.cp === '05D0') || project.letters[0];
      l.contours = [[[100, 0], [400, 0], [400, 600], [100, 600]]];
    }, TTF);
    const PREV = 'button[onclick="generatePreviewPDF()"]';
    await page.waitForSelector(PREV, { state: 'visible' });
    await twice(PREV);
    await page.waitForFunction(() => window.__saves && window.__saves.length >= 2, null, { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const b = await page.evaluate(() => { window.__w.stop = true; return { saves: (window.__saves || []).length, builds: window.__builds, seen: window.__w.seen }; });
    const fearly = b.seen.find(x => x[0] === want.font);
    ok(b.builds === 1 && b.saves === 2 && !!fearly && fearly[1] <= 400 && errors.length === 0 && hits.lib > 0,
      `${L} preview: ${b.builds} font build(s), ${b.saves - a.saves} more save(s) for 2 presses; «${want.font}» at ${fearly ? fearly[1] + ' ms' : 'never'}; route hits ${hits.lib}; ${errors.length} errors${errors.length ? ' ' + errors[0].slice(0, 120) : ''}`);
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the template and Preview PDF run once a press and speak before their libraries load');
process.exit(fail ? 1 : 0);
