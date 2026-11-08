#!/usr/bin/env node
// S631 — the "Shlomo" Hebrew font loads on every page that offers it (pass B: a failed request). Nine pickers (the
// generator, dictionary, flash cards, Torah Trainer, Trope Tutor, dashboard, Font Maker, Letter Learner, Name Tags)
// pointed its @font-face at `…/Shlomo%20Orbach%20(OFL)/Shlomo/Shlomo.ttf`, a folder the aharonium/fonts tree does
// not have: jsDelivr answers 404 (both the bare and the @master spelling, measured S631), so a teacher who picked
// Shlomo got the fallback serif on screen, on paper and in the PDF. The file is one folder up,
// `…/Shlomo%20Orbach%20(OFL)/Shlomo.ttf` (200, "Shlomo" Regular: 27 letters, the nikkud and the te'amim), beside
// ShlomoStam.ttf and ShlomoSemiStam.ttf, which the pages already load from there.
//
//   node scripts/loop/probes/S631-shlomo-font-loads-from-its-real-path.mjs            (jsDelivr modelled as measured)
//   LIVE=1 node scripts/loop/probes/S631-shlomo-font-loads-from-its-real-path.mjs     (the real CDN, by curl)
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile. The aharonium/fonts CDN is answered by
//   route as measured: the folder that does not exist → 404, every other path → a Hebrew TTF stand-in (counted hits by
//   path). (1) The generator, dictionary and flash cards: their sidebar's "Expand all menus" and then the Shlomo tile,
//   each by a real click — the tile reads pressed, `--heb-font` names Shlomo and its face is `loaded`. (2) All nine
//   pages: the page's own HEB_FONTS entry through the page's own loader (`loadHebFont`, Name Tags' `ntLoadHebFont`),
//   then `document.fonts.load` — the face `loaded`, the real path fetched, the missing folder never asked for.
//   0 page errors. exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy
//   (the tree before S631 fails every cell: the face `error`, the 404 path fetched).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
const STANDIN = fs.readFileSync(path.join(REPO, 'fonts', 'FrankRuhlLibre-Regular.ttf'));
const DEAD = /\/Shlomo%20Orbach%20\(OFL\)\/Shlomo\/Shlomo\.ttf$/, REAL = /\/Shlomo%20Orbach%20\(OFL\)\/Shlomo\.ttf$/;
const liveCache = {};
function cdn(u) {
  if (!process.env.LIVE) return DEAD.test(u) ? { status: 404, body: 'Not found' } : { status: 200, body: STANDIN };
  if (!liveCache[u]) { const out = execFileSync('curl', ['-s', '-L', '--max-time', '30', '-w', '\n%{http_code}', u], { maxBuffer: 1 << 26 }); const i = out.lastIndexOf(10); liveCache[u] = { status: +out.subarray(i + 1).toString() || 502, body: out.subarray(0, i) }; }
  return liveCache[u];
}
const PAGES = ['hebrew_blend_generator.html', 'hebrew_dictionary.html', 'flash_cards.html', 'torah_trainer.html', 'trope_tutor.html', 'classroom_dashboard.html', 'Hebrew_Font_Maker.html', 'letter_learner.html', 'name_tags.html'];
const CLICK = new Set(['hebrew_blend_generator.html', 'hebrew_dictionary.html', 'flash_cards.html']);
const browser = await chromium.launch();
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  for (const pg of PAGES) {
    const hits = { dead: 0, real: 0 };
    const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
    await ctx.route('**/*', r => {
      const u = r.request().url();
      if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      if (u.startsWith('https://cdn.jsdelivr.net/gh/aharonium/fonts')) {
        if (DEAD.test(u)) hits.dead++; if (REAL.test(u)) hits.real++;
        const x = cdn(u); return r.fulfill({ status: x.status, contentType: x.status === 200 ? 'font/ttf' : 'text/plain', body: x.body, headers: { 'access-control-allow-origin': '*' } });
      }
      return r.abort();
    });
    await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDashboard_setupSeen', '1'); }, [cell.lang, cell.dark]);
    const page = await ctx.newPage(); page.setDefaultTimeout(20000);
    const errors = []; page.on('pageerror', e => errors.push(String(e)));
    page.on('dialog', d => d.accept().catch(() => {}));
    const face = () => page.evaluate(async () => { try { await document.fonts.load("24px 'Shlomo'", 'אבג'); } catch (e) {} await new Promise(r => setTimeout(r, 300)); return [...document.fonts].filter(f => f.family.replace(/["']/g, '') === 'Shlomo').map(f => f.status).join(',') || 'none'; });
    try {
      await page.goto(base + '/' + pg, { waitUntil: 'load' });
      await page.waitForFunction(() => window.I18n, null, { timeout: 30000 }); await page.evaluate(() => window.I18n.ready);
      await page.waitForTimeout(800);
      if (CLICK.has(pg)) {
        // a real click at the centre of a control, checked to hit it first
        const press = async sel => { const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); if (!b) throw new Error('no box: ' + sel);
          const x = b.x + b.width / 2, y = b.y + b.height / 2; const hit = await page.evaluate(([s, x, y]) => { const t = document.querySelector(s), e = document.elementFromPoint(x, y); return !!t && !!e && t.contains(e); }, [sel, x, y]);
          if (!hit) throw new Error('covered: ' + sel); await page.mouse.click(x, y); };
        await press('button[onclick="expandAllMenus()"]'); await page.waitForTimeout(400);
        const TILE = '.font-opt[data-font-name="Shlomo"], .font-opt[data-font="Shlomo"]';
        if (!(await page.$(TILE))) throw new Error('no Shlomo tile');
        await press(TILE); await page.waitForTimeout(300);
        const st = await face();
        const ui = await page.evaluate(T => ({ pressed: document.querySelector(T).getAttribute('aria-pressed'), v: getComputedStyle(document.documentElement).getPropertyValue('--heb-font') }), TILE);
        ok(st === 'loaded' && ui.pressed === 'true' && /Shlomo/.test(ui.v) && hits.real > 0 && hits.dead === 0,
          `${L} ${pg} by clicks: the tile pressed ${ui.pressed}, --heb-font «${ui.v.trim().slice(0, 40)}», face ${st}; fetched the real path ${hits.real}×, the missing folder ${hits.dead}×`);
      }
      const r = await page.evaluate(async () => {
        const list = typeof HEB_FONTS !== 'undefined' ? HEB_FONTS : null;
        const load = typeof ntLoadHebFont === 'function' ? ntLoadHebFont : (typeof loadHebFont === 'function' ? loadHebFont : null);
        const f = list && list.find(x => x.name === 'Shlomo');
        if (!f || !load) return { handle: false };
        await load(f);
        return { handle: true, src: (/url\('([^']+)'\)/.exec(f.load.css) || [])[1] || '' };
      });
      if (!r.handle) throw new Error('no HEB_FONTS Shlomo entry or loader');
      const st = await face();
      ok(st === 'loaded' && hits.real > 0 && hits.dead === 0 && errors.length === 0,
        `${L} ${pg} by its loader: face ${st}; src …${r.src.slice(-44)}; the real path ${hits.real}×, the missing folder ${hits.dead}×; ${errors.length} errors${errors.length ? ' ' + errors[0].slice(0, 120) : ''}`);
    } catch (e) { fail++; console.log(`✘ ${L} ${pg}: ${String(e).split('\n')[0]}`); }
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: Shlomo loads from its real path on all nine pages');
process.exit(fail ? 1 : 0);
