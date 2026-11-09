#!/usr/bin/env node
// S637 (the S636 P4; pattern RTL-inheritance-on-a-Latin-script-container) — a Self-Check card's hint ("tap to reveal")
// and its score buttons ("✓ Got it" / "✗ Missed") are UI chrome, but they sat in .self-check-grid's right-to-left (the
// cards' order on a Hebrew sheet): in the English UI "✓ Got it" read "Got ✓ / it" and Missed stood before Got it. They
// now take the UI's direction; the Hebrew UI is unchanged. Screen only (the print and Export PDF hide both).
//
// The blend, Gematria and Real Words Gematria Self-Checks × EN light 1280 and HE dark 800, the first card flipped by a
// real click: (1) EN: the hint and the buttons left-to-right, the ✓ / ✗ before their words, Got it left of Missed;
// (2) HE: right-to-left, Got it right of Missed (as before); (3) a click on Got it scores the card (data-score);
// 0 page errors.
//
//   node scripts/loop/probes/S637-generator-selfcheck-chrome-follows-the-ui.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S637 fails (1) on all three sheets).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r)); const BASE = `http://127.0.0.1:${server.address().port}`;
let fail = 0; const ok = (c, m, r) => { if (!c) fail++; console.log(`${c ? '✔' : '✘'} ${m}: ${JSON.stringify(r)}`); };
const check = id => async p => { await p.evaluate(s => { const c = document.getElementById(s); if (c && !c.checked) c.click(); }, id); };
const SHEETS = { blend: check('selfCheckToggle'), gematria: async p => { await p.click('[data-worksheet="gematria"]'); await check('gematriaSelfCheck')(p); },
  'real-words gematria': async p => { await p.click('[data-type="realwords"]'); await p.waitForTimeout(300); await p.click('[data-drill="gematria"]'); await check('rwGematriaSelfCheck')(p); } };
const browser = await chromium.launch();
for (const cell of [{ lang: 'en', w: 1280, dark: false }, { lang: 'he', w: 800, dark: true }]) for (const [name, setup] of Object.entries(SHEETS)) {
  const tag = `${name} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.addInitScript(([l, d]) => { Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'load' }); await page.evaluate(() => window.I18n && I18n.ready);
    await page.click('#generateBtn'); await page.waitForTimeout(200); await setup(page); await page.click('#generateBtn'); await page.waitForTimeout(800);
    const card = page.locator('.self-check-grid .flip-card').first();
    if (!(await card.count())) throw new Error('handle missing: .self-check-grid .flip-card');
    await card.scrollIntoViewIfNeeded(); await card.click(); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const c = document.querySelector('.self-check-grid .flip-card'), hint = c.querySelector('.flip-card-hint'), row = c.querySelector('.flip-card-score-btns');
      const [got, missed] = [...c.querySelectorAll('.score-btn')];
      if (!hint || !row || !got || !missed) return null;
      // the glyph reads first: on an earlier line (a narrow button wraps "✗ / Missed"), or on the same line before the word
      const order = (b) => { const t = b.firstChild, s = b.textContent, rg = document.createRange(), at = (i) => { rg.setStart(t, i); rg.setEnd(t, i + 1); return rg.getBoundingClientRect(); };
        const g = at(s.search(/[✓✗]/)), w = at(s.search(/[A-Za-zא-ת]/));
        return { glyphFirst: g.y < w.y - 2 || (Math.abs(g.y - w.y) <= 2 && g.x < w.x) }; };
      return { hint: getComputedStyle(hint).direction, row: getComputedStyle(row).direction, got: { dir: getComputedStyle(got).direction, ...order(got), x: got.getBoundingClientRect().x }, missed: { dir: getComputedStyle(missed).direction, ...order(missed), x: missed.getBoundingClientRect().x } };
    });
    if (!r) throw new Error('handle missing: the hint or the score buttons');
    if (cell.lang === 'en') ok(r.hint === 'ltr' && r.row === 'ltr' && r.got.glyphFirst && r.missed.glyphFirst && r.got.x < r.missed.x, `${tag} — (1) the chrome reads left to right`, r);
    else ok(r.hint === 'rtl' && r.row === 'rtl' && r.got.x > r.missed.x, `${tag} — (2) the Hebrew UI keeps right to left`, r);
    await page.locator('.self-check-grid .flip-card').first().locator('.score-btn.correct').click(); await page.waitForTimeout(200);
    const scored = await page.evaluate(() => document.querySelector('.self-check-grid .flip-card').dataset.score);
    ok(scored != null, `${tag} — (3) Got it scores the card`, { score: scored });
    ok(errors.length === 0, `${tag} — 0 page errors`, errors.slice(0, 2));
  } catch (e) { ok(false, `${tag} — ran`, String(e).slice(0, 200)); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL — ${fail} step(s)` : 'PASS');
process.exit(fail ? 1 : 0);
