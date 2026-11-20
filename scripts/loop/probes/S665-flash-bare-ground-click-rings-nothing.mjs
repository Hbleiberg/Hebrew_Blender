#!/usr/bin/env node
// S665 — Flash Cards: <main id="mainContent" tabindex="-1"> is the skip link's target, so a click on bare page ground
// focuses it, and the next key press (Shift, an arrow, a shortcut) switched the browser to keyboard focus and drew its
// focus ring around the whole content column (760 × 2,630px). The target takes focus without a ring now, as on the
// Holiday Guide and the Parsha Emojis page (pattern skip-target-rings-the-whole-column).
//   Per cell (EN light 1280, HE dark 800) × the setup screen and a running card:
//     ground — a real click on bare ground inside main, then Shift: main holds the focus and has no outline, and the
//              window looks the same as with nothing focused (pixel-equal screenshots);
//     skip   — from a fresh load the first Tab is the skip link (ringed), Enter moves focus to main, and the next Tab
//              lands on a control inside main;
//     rings  — the first six controls inside main still show a focus ring by keyboard.
//
//   node scripts/loop/probes/S665-flash-bare-ground-click-rings-nothing.mjs     exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S665 fails every ground cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fails = 0, cells = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 60)))));
// a point of bare ground inside main: nothing focusable or clickable between it and main
const ground = () => {
  const m = document.getElementById('mainContent'), mr = m.getBoundingClientRect();
  for (let y = Math.max(mr.top, 0) + 4; y < Math.min(innerHeight, mr.bottom) - 2; y += 6) for (let x = mr.left + 3; x < mr.right - 2; x += 14) {
    const e = document.elementFromPoint(x, y);
    if (!e || !m.contains(e) || e.closest('a,button,input,select,textarea,label,summary,[tabindex]:not(#mainContent),[contenteditable],[onclick],[role=button]')) continue;
    return { x, y };
  }
  return null;
};
async function load(c) {
  const ctx = await browser.newContext({ viewport: { width: c.w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', (r) => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([l, d]) => { try { localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); } catch (e) {} }, [c.lang, c.dark]);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/flash_cards.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.getElementById('mainContent')); await page.evaluate(() => I18n.ready); await settle(page); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll('.overlay.open, .modal.open').forEach((m) => m.classList.remove('open')));
  return { ctx, page, errs };
}

for (const c of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const tag = `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
  for (const screen of ['setup', 'card']) {
    try {
      const { ctx, page, errs } = await load(c);
      if (screen === 'card') { await page.locator('#startBtn').click(); await page.waitForFunction(() => { const s = document.getElementById('startBtn'); return !s || !s.getClientRects().length || document.querySelector('.card, #cardScreen, .fc-card'); }); await settle(page); await page.waitForTimeout(400); }
      const pt = await page.evaluate(ground);
      if (!pt) { report(false, `${tag} ${screen} ground: no bare ground inside main`); await ctx.close(); continue; }
      await page.mouse.click(pt.x, pt.y); await page.mouse.move(1, 1); await settle(page);
      await page.keyboard.press('Shift'); await settle(page);
      const a = await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e), r = e.getBoundingClientRect(); return { el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : ''), fv: e.matches(':focus-visible'), outline: cs.outlineStyle, box: Math.round(r.width) + ' × ' + Math.round(r.height) }; });
      const focused = await page.screenshot();
      await page.evaluate(() => document.activeElement.blur()); await settle(page);
      const blurred = await page.screenshot();
      report(a.el === 'main#mainContent' && a.outline === 'none' && Buffer.compare(focused, blurred) === 0 && errs.length === 0,
        `${tag} ${screen} ground: a click on bare ground then Shift → focus on ${a.el} (${a.box}), :focus-visible ${a.fv}, outline ${a.outline}, the window ${Buffer.compare(focused, blurred) === 0 ? 'unchanged' : 'CHANGED'} against nothing focused; errors ${errs.length}`);
      await ctx.close();
    } catch (e) { report(false, `${tag} ${screen} ground: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
  }
  try {
    const { ctx, page, errs } = await load(c);
    await page.keyboard.press('Tab');
    const sk = await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e), r = e.getBoundingClientRect(); return { cls: e.className, outline: cs.outlineStyle, top: Math.round(r.top) }; });
    await page.keyboard.press('Enter'); await settle(page);
    const tgt = await page.evaluate(() => document.activeElement.id);
    await page.keyboard.press('Tab');
    const nx = await page.evaluate(() => { const e = document.activeElement; return { inside: !!e.closest('#mainContent') && e.id !== 'mainContent', el: e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') }; });
    report(sk.cls === 'skip-link' && sk.outline !== 'none' && sk.top >= 0 && tgt === 'mainContent' && nx.inside && errs.length === 0, `${tag} skip: the first Tab is ${sk.cls} (outline ${sk.outline}, at ${sk.top}), Enter → #${tgt}, the next Tab → ${nx.el} ${nx.inside ? 'inside main' : 'OUTSIDE main'}`);
    // the controls inside main still ring
    const rings = [nx.el + ':' + await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); const l = document.activeElement.closest('label'); return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' || (l && getComputedStyle(l).outlineStyle !== 'none') || !![...document.activeElement.parentElement.children].find((s) => getComputedStyle(s).outlineStyle !== 'none'); })];
    for (let i = 0; i < 5; i++) { await page.keyboard.press('Tab'); rings.push(await page.evaluate(() => { const e = document.activeElement, cs = getComputedStyle(e), l = e.closest('label'); const ok = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' || (l && getComputedStyle(l).outlineStyle !== 'none') || !![...e.parentElement.children].find((s) => getComputedStyle(s).outlineStyle !== 'none'); return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + ':' + ok; })); }
    report(rings.every((r) => r.endsWith(':true')), `${tag} rings: ${rings.join(', ')}`);
    await ctx.close();
  } catch (e) { report(false, `${tag} skip: could not run — ${String(e.message || e).split('\n')[0].slice(0, 160)}`); }
}
await browser.close(); server.close();
console.log(fails ? `${fails} of ${cells} cells FAIL` : `all ${cells} cells pass`);
process.exit(fails ? 1 : 0);
