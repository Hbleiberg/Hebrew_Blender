#!/usr/bin/env node
// S631 — the Letter Learner card's coloring-sheet Print runs once a press and says what it waits for (the S630 P4,
// pattern `async-export-runs-twice-on-a-second-press`). `llCsPrint` waits up to 4 s for the sheet's faces before
// `window.print()` with the button live and nothing said: with a picker font still arriving, a second press in that
// wait printed the sheet twice (two print dialogs, one after the other).
//
//   node scripts/loop/probes/S631-letter-learner-card-print-once.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile with the sheet's font set to Alef (a Google
//   Fonts face: its stylesheet answered at once, its font file held 1.5 s, a counted route hit; every other foreign
//   origin aborted), `window.print` counted. Alef's card opened and its Coloring sheet tab, each by a real click; the
//   tab's Print pressed by a real click and again 150 ms later (a raw click at the same point, trap 568): 1 print; the
//   button reads the page's own "Loading fonts…" and is disabled within 400 ms of the first press; afterwards it reads
//   "Print" again, enabled, with the focus on it. Then a press with the face already in: 1 more print, at once.
//   0 page errors. exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy
//   (the tree before S631 prints twice and says nothing).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ROOT = path.resolve(process.env.ROOT || REPO);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const FACE = fs.readFileSync(path.join(REPO, 'fonts', 'FrankRuhlLibre-Regular.ttf'));   // a Hebrew stand-in for Alef's file
const browser = await chromium.launch();
async function point(page, sel) {
  await page.locator(sel).first().scrollIntoViewIfNeeded();
  const p = await page.evaluate(sel => { const b = document.querySelector(sel); if (!b) return null; const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, e = document.elementFromPoint(x, y); return { x, y, hit: !!e && b.contains(e) }; }, sel);
  if (!p || !p.hit) throw new Error((p ? 'covered: ' : 'no ') + sel);
  return p;
}
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const hits = { css: 0, face: 0 };
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://fonts.googleapis.com/css2?family=Alef')) { hits.css++; return r.fulfill({ status: 200, contentType: 'text/css', body: "@font-face{font-family:'Alef';font-weight:400;src:url(https://fonts.gstatic.com/s/alef/probe-alef.ttf) format('truetype');}" }); }
    if (u === 'https://fonts.gstatic.com/s/alef/probe-alef.ttf') { hits.face++; await new Promise(res => setTimeout(res, 1500)); return r.fulfill({ status: 200, contentType: 'font/ttf', body: FACE, headers: { 'access-control-allow-origin': '*' } }); }
    return r.abort();
  });
  await ctx.addInitScript(([lang, dark]) => {
    window.__prints = []; const t0 = performance.now();
    window.print = () => { window.__prints.push(Math.round(performance.now() - t0)); };
    try { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
      localStorage.setItem('hebrewLetterLearner_settings', JSON.stringify({ colorFont: 'Alef' })); } catch (e) {}
  }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000);
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(base + '/letter_learner.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n, null, { timeout: 30000 }); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600);
    let p = await point(page, '.ll-card[data-id="alef"]'); await page.mouse.click(p.x, p.y);
    await page.waitForFunction(() => !document.getElementById('llOverlay').hidden);
    p = await point(page, '#llTab-coloring'); await page.mouse.click(p.x, p.y);
    await page.waitForSelector('#llCsPrint', { state: 'visible' });
    const want = await page.evaluate(() => ({ busy: I18n.t('letterlearner.font.loading'), idle: I18n.t('letterlearner.coloring.print') }));
    // the label and state every animation frame from the first press
    const arm = () => page.evaluate(() => { const R = window.__w = { t0: performance.now(), seen: [], stop: false }; const b = document.getElementById('llCsPrint');
      (function tick() { const t = (b.querySelector('.hi-lbl') || b).textContent.trim() + (b.disabled ? ' [disabled]' : ''); if (!R.seen.some(x => x[0] === t)) R.seen.push([t, Math.round(performance.now() - R.t0)]); if (!R.stop) requestAnimationFrame(tick); })(); });
    p = await point(page, '#llCsPrint');
    await arm(); await page.mouse.click(p.x, p.y); await page.waitForTimeout(150); await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(4500);
    const a = await page.evaluate(() => { window.__w.stop = true; const b = document.getElementById('llCsPrint'); return { prints: window.__prints.length, seen: window.__w.seen, label: (b.querySelector('.hi-lbl') || b).textContent.trim(), enabled: !b.disabled, focus: document.activeElement === b }; });
    const busy = a.seen.find(x => x[0] === want.busy + ' [disabled]');
    ok(a.prints === 1 && !!busy && busy[1] <= 400 && a.label === want.idle && a.enabled && a.focus && hits.face > 0,
      `${L} Print ×2 with the face held: ${a.prints} print(s); «${want.busy}» disabled at ${busy ? busy[1] + ' ms' : 'never'}; seen ${JSON.stringify(a.seen.map(x => x[0]))}; after «${a.label}», enabled ${a.enabled}, focus ${a.focus}; face hits ${hits.face}`);
    // the face is in now: one press prints at once
    const before = a.prints;
    p = await point(page, '#llCsPrint'); await page.mouse.click(p.x, p.y); await page.waitForTimeout(600);
    const b = await page.evaluate(() => window.__prints.length);
    ok(b === before + 1 && errors.length === 0, `${L} a press with the face in: ${b - before} more print; ${errors.length} errors${errors.length ? ' ' + errors[0].slice(0, 120) : ''}`);
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: the card\'s Print runs once a press and says it is loading the fonts');
process.exit(fail ? 1 : 0);
