#!/usr/bin/env node
// S683 — Flash Cards: Teacher Tools' "Class" label sits on the centre line of its class menu.
// The class row (`.preset-row.fc-classbar`) is a flex row that stretches its children, so the label's box took the
// 40px menu's height and its text sat at the top, 11px above the menu's centre (S683 Pass M); `align-self:center`.
//
//   node scripts/loop/probes/S683-flash-class-label-centred-on-its-menu.mjs
//   EN light / dark 1280, HE light / dark 800, HE light 320: a class and a linked profile seeded, Teacher Tools opened and
//   the class chosen by real input; the label's text centre within 2px of the menu's centre, one line, the row as tall as
//   its tallest control and nothing past its edges; a control row (the label forced to the top) must read off-centre, or the handle is blind;
//   0 page errors. exit 1 when a step fails. ROOT=<a git archive of the tree> runs another copy (before S683: −11px).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const T = 1763900000000;
const CLASSES = JSON.stringify({ v: 1, classes: { c_bet: { id: 'c_bet', name: 'Kitah Bet', order: 1, created: T, updated: T, students: [{ id: 's1', he: 'דָּוִד', en: 'David', t: { en: T } }], gone: {}, t: { name: T } } }, retired: {} });
const PROFILES = JSON.stringify({ activeProfile: 'David', profiles: { David: { created: T, order: T, studentId: 's1', results: [] } } });
const browser = await chromium.launch();
const measure = () => {
  const l = document.querySelector('.fc-classbar-lbl'), s = document.getElementById('profileClassSel'), row = document.querySelector('.fc-classbar');
  if (!l || !s || !row) return null;
  const rg = document.createRange(); rg.selectNodeContents(l);
  const t = rg.getBoundingClientRect(), sb = s.getBoundingClientRect(), rb = row.getBoundingClientRect();
  const kids = [...row.children].map(k => k.getBoundingClientRect());
  return { off: ((t.top + t.bottom) / 2) - ((sb.top + sb.bottom) / 2), lines: rg.getClientRects().length, rowH: rb.height, tallest: Math.max(...kids.map(k => k.height)), out: kids.some(k => k.left < rb.left - 0.5 || k.right > rb.right + 0.5), text: l.textContent.trim() };
};
for (const cell of [{ lang: 'en', dark: false, vw: 1280 }, { lang: 'en', dark: true, vw: 1280 }, { lang: 'he', dark: false, vw: 800 }, { lang: 'he', dark: true, vw: 800 }, { lang: 'he', dark: false, vw: 320 }]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.vw}`;
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (sessionStorage.getItem('s683seed')) return; sessionStorage.setItem('s683seed', '1');
    localStorage.setItem('hebrewFlashCards_tourSeen', '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0');
    localStorage.setItem('ivritSuite_classes', c.classes); localStorage.setItem('hebrewFlashCards_profiles', c.profiles);
  }, { ...cell, classes: CLASSES, profiles: PROFILES });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang && document.querySelector('#profileClassSel'), null, { timeout: 30000 });
  await page.evaluate(() => I18n.ready); await page.waitForTimeout(300);
  await page.addStyleTag({ content: '.start-cta{position:static!important}' });   // the sticky Start bar off the panel
  await page.locator('#panelTeacherTools .panel-title').click(); await page.waitForTimeout(250);
  await page.locator('#profileClassSel').selectOption({ label: 'Kitah Bet' }); await page.waitForTimeout(250);
  const m = await page.evaluate(measure);
  ok(!!m, `${tag}: the label, the menu and the row resolve (the handles)`);
  if (m) {
    ok(Math.abs(m.off) <= 2 && m.lines === 1, `${tag}: "${m.text}" ${m.off.toFixed(1)}px from the menu's centre, ${m.lines} line`);
    ok(Math.abs(m.rowH - m.tallest) < 0.5 && !m.out, `${tag}: the row ${Math.round(m.rowH)}px, its tallest control's height, ${m.out ? 'a child past its edge' : 'nothing past its edges'}`);
  }
  await page.addStyleTag({ content: '.fc-classbar-lbl{align-self:flex-start!important}' });
  const c = await page.evaluate(measure);
  ok(!!c && Math.abs(c.off) > 6, `${tag}: control — the label forced to the row's top reads ${c ? c.off.toFixed(1) : '?'}px off`);
  ok(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} failed` : '\nall passed');
process.exit(fail ? 1 : 0);
