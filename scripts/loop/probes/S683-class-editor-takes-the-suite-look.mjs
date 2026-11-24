#!/usr/bin/env node
// S683 — the shared class-list editor (js/ivrit-classes.js) draws in the suite's look on every page that opens it.
// It drew in the browser's system look — system-ui, ButtonFace-grey buttons, a near-black Canvas in dark mode — beside
// pages in navy, gold and cream; in dark mode its red Delete class and × read 3.14:1 on the grey buttons. Gate 3
// (S683, the maintainer: "Restyle it now"): the host's font and the suite's palette, the icon glyphs in the system face.
//
//   node scripts/loop/probes/S683-class-editor-takes-the-suite-look.mjs
//   Flash Cards (opened by its Edit classes… button, a real click), the Dashboard, Name Tags and reading assignments
//   (IvritClasses.openEditor) × EN light 1280 / HE dark 800, a class seeded: the dialog's headings, labels, buttons and
//   class list in the page's body font; the ↕ ▲ ▼ × buttons in system-ui; the dialog white / #1e2535 and no button on
//   the system greys; every visible text at 4.5:1 or more over its composited ground (dimmed aria-disabled buttons
//   aside); forced colours keep the system pair; 0 page errors. exit 1 when a step fails. ROOT=<a git archive of the
//   tree> runs another copy (the tree before S683 fails the font, the ground and, in dark, the contrast).
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
const CLASSES = JSON.stringify({ v: 1, classes: { c_bet: { id: 'c_bet', name: 'Kitah Bet', extra: 'Room 4', order: 1, created: T, updated: T, students: [{ id: 's1', he: 'דָּוִד', en: 'David', tr: 'Dovid', t: { en: T } }, { id: 's2', he: 'שָׂרָה', en: 'Sarah', tr: 'Sara', t: { en: T } }], gone: {}, t: { name: T } } }, retired: {} });
const HOSTS = [
  { page: 'flash_cards.html', open: async p => { await p.addStyleTag({ content: '.start-cta{position:static!important}' }); await p.locator('#panelTeacherTools .panel-title').click(); await p.waitForTimeout(200); await p.locator('#fcEditClassesBtn').click(); } },
  { page: 'classroom_dashboard.html', open: p => p.evaluate(() => IvritClasses.openEditor({ classId: 'c_bet' })) },
  { page: 'name_tags.html', open: p => p.evaluate(() => IvritClasses.openEditor({ classId: 'c_bet' })) },
  { page: 'reading_assignments.html', open: p => p.evaluate(() => IvritClasses.openEditor({ classId: 'c_bet' })) },
];
const AUDIT = () => {
  const dlg = document.querySelector('.ivc-dialog'); if (!dlg) return null;
  const rgb = s => { const m = s.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const over = (top, under) => { const a = top[3] ?? 1; return [0, 1, 2].map(i => top[i] * a + under[i] * (1 - a)); };
  const ground = e => { const st = []; for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if ((c[3] ?? 1) > 0) { st.push(c); if ((c[3] ?? 1) >= 1) break; } } let g = [255, 255, 255]; for (let i = st.length - 1; i >= 0; i--) g = over(st[i], g); return g; };
  const low = []; let n = 0;
  for (const e of dlg.querySelectorAll('*')) {
    const own = [...e.childNodes].some(t => t.nodeType === 3 && t.textContent.trim()); if (!own || !e.getClientRects().length) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden') continue;
    let op = 1; for (let x = e; x; x = x.parentElement) op *= +getComputedStyle(x).opacity; if (op < .9) continue;
    const g = ground(e), fg = over(rgb(cs.color), g), L1 = lum(fg), L2 = lum(g), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05); n++;
    if (cr < 4.5) low.push(`"${e.textContent.trim().slice(0, 16)}" ${cr.toFixed(2)}`);
  }
  const fam = s => s.split(',')[0].replace(/["']/g, '').trim();
  const body = fam(getComputedStyle(document.body).fontFamily);
  const textEls = [...dlg.querySelectorAll('h2, .ivc-btn:not(.ivc-icon), .ivc-lbl, th, .ivc-class')];
  const iconEls = [...dlg.querySelectorAll('.ivc-icon')];
  const grey = new Set(['rgb(239, 239, 239)', 'rgb(107, 107, 107)', 'rgb(18, 18, 18)']);
  return { n, low, body, textOff: textEls.filter(e => fam(getComputedStyle(e).fontFamily) !== body).length, textN: textEls.length, iconOff: iconEls.filter(e => fam(getComputedStyle(e).fontFamily) !== 'system-ui').length, iconN: iconEls.length, bg: getComputedStyle(dlg).backgroundColor, greyBtns: [...dlg.querySelectorAll('.ivc-btn')].filter(b => grey.has(getComputedStyle(b).backgroundColor)).length };
};
const browser = await chromium.launch();
for (const h of HOSTS) for (const cell of [{ lang: 'en', dark: false, vw: 1280, bg: 'rgb(255, 255, 255)' }, { lang: 'he', dark: true, vw: 800, bg: 'rgb(30, 37, 53)' }]) {
  const tag = `${h.page} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.vw}`;
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => {
    if (sessionStorage.getItem('s683seed')) return; sessionStorage.setItem('s683seed', '1');
    for (const k of ['hebrewFlashCards_tourSeen', 'hebrewDashboard_tourSeen', 'hebrewDashboard_setupSeen', 'hebrewNameTags_tourSeen']) localStorage.setItem(k, '1');
    localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0');
    localStorage.setItem('ivritSuite_classes', c.classes);
  }, { ...cell, classes: CLASSES });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/' + h.page, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && window.IvritClasses && document.documentElement.lang, null, { timeout: 30000 });
  await page.evaluate(() => I18n.ready); await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  await h.open(page); await page.waitForSelector('.ivc-dialog', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(300);
  const r = await page.evaluate(AUDIT);
  ok(!!r && r.n > 30 && r.textN > 10 && r.iconN >= 5, `${tag}: the editor open — ${r ? `${r.n} texts, ${r.textN} text controls, ${r.iconN} icon buttons` : 'no dialog'} (the handles)`);
  if (r) {
    ok(r.textOff === 0 && r.iconOff === 0, `${tag}: text in the page's "${r.body}" (${r.textOff} off), icons in system-ui (${r.iconOff} off)`);
    ok(r.bg === cell.bg && r.greyBtns === 0, `${tag}: dialog ${r.bg}, ${r.greyBtns} buttons on the system greys`);
    ok(r.low.length === 0, `${tag}: ${r.low.length} texts under 4.5:1 ${r.low.slice(0, 3).join(', ')}`);
  }
  ok(errors.length === 0, `${tag}: ${errors.length} page errors`);
  await ctx.close();
}
{ // forced colours: the system pair stays
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', forcedColors: 'active' });
  await ctx.addInitScript(cls => { localStorage.setItem('ivritSuite_classes', cls); localStorage.setItem('hebrewNameTags_tourSeen', '1'); localStorage.setItem('hebrewBlender_darkMode', '1'); }, CLASSES);
  const page = await ctx.newPage();
  await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' }); await page.waitForFunction(() => window.IvritClasses); await page.waitForTimeout(300);
  await page.evaluate(() => IvritClasses.openEditor({ classId: 'c_bet' })); await page.waitForTimeout(300);
  const f = await page.evaluate(() => { const d = document.querySelector('.ivc-dialog'), b = d && d.querySelector('.ivc-btn'); return d && b ? [getComputedStyle(d).backgroundColor, getComputedStyle(d).color, getComputedStyle(b).borderTopColor] : null; });
  ok(!!f && f[0] !== f[1] && f[2] === f[1], `forced colours (dark site): dialog ${f && f[0]} / ${f && f[1]}, a button's border ${f && f[2]}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} failed` : '\nall passed');
process.exit(fail ? 1 : 0);
