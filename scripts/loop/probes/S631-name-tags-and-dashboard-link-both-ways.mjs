#!/usr/bin/env node
// S631 — Name Tags and the Classroom Dashboard link to each other's class lists (the micro-feature from the S551 seed,
// gate 1). Before: Name Tags' "From the Classroom Dashboard" box said "There are no class lists in the Classroom
// Dashboard on this device yet." and stopped there, and the dashboard's "Make a class from a Name Tags list" row had
// no way back to the page (Name Tags is unlisted: the hub never links it).
// Now the box carries "Open the Classroom Dashboard's class lists ↗" (a new tab, `?settings=picker`: Settings opens on
// the Student Picker section, in place of a first visit's starter card), its menu re-reads the classes when the
// dashboard's tab saves them, and the dashboard's row carries "Open Name Tags ↗" (`?from=dashboard`: the box opens on
// the class that is live there). Each param is dropped on arrival.
//
//   node scripts/loop/probes/S631-name-tags-and-dashboard-link-both-ways.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, every foreign origin aborted. All by real
//   clicks and typing, the two pages in one browser profile (one localStorage, storage events between the tabs):
//   (1) Name Tags: the box opened — the "none" note, the link (a 24 px target, a new tab, its href). (2) The link
//   pressed: the dashboard's tab opens Settings on the Class tab with the Student Picker heading focused, no starter
//   card, the address without the param. (3) Three names typed in its roster and Tab: back in Name Tags the menu lists
//   that class (3 students), Bring in enabled, the note gone, the focus not moved. (4) Bring in → Make a new list: the
//   dashboard's tab shows its Name Tags row. (5) "Open Name Tags ↗" pressed: a Name Tags tab with the box open on the
//   dashboard's live class, the menu focused, the address without the param. (6) `?settings=bogus` on a fresh profile:
//   no Settings, the starter card as before, the param dropped. 0 page errors. exit 1 when a step fails or a handle is
//   missing. ROOT=<a git archive of the tree> runs another copy (the tree before S631 fails at (1): no link).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
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
const browser = await chromium.launch();
// A real click at the control's centre, checked to land on it first.
async function press(page, sel) {
  const loc = page.locator(sel).first(); await loc.scrollIntoViewIfNeeded();
  const b = await loc.boundingBox(); if (!b) throw new Error('no box: ' + sel);
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  const hit = await page.evaluate(([s, x, y]) => { const t = document.querySelector(s), e = document.elementFromPoint(x, y); return !!t && !!e && t.contains(e); }, [sel, x, y]);
  if (!hit) throw new Error('covered: ' + sel);
  await page.mouse.click(x, y);
  return b;
}
async function ready(page) { await page.waitForFunction(() => window.I18n, null, { timeout: 30000 }); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600); }
async function newCtx(cell) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  // (a new tab's first document is about:blank, whose localStorage throws: the seed waits for the served page)
  await ctx.addInitScript(([lang, dark]) => { try { if (location.protocol !== 'http:' || localStorage.getItem('__seeded')) return; localStorage.setItem('__seeded', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); } catch (e) {} }, [cell.lang, cell.dark]);
  const errors = [];
  ctx.on('page', p => { p.on('pageerror', e => errors.push(String(e))); p.on('dialog', d => d.accept().catch(() => {})); });
  return { ctx, errors };
}
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const { ctx, errors } = await newCtx(cell);
  try {
    // (1) Name Tags, the box with no dashboard classes
    const nt = await ctx.newPage(); nt.setDefaultTimeout(20000);
    await nt.goto(base + '/name_tags.html', { waitUntil: 'load' }); await ready(nt);
    await press(nt, '#ntDashOpen'); await nt.waitForTimeout(200);
    const a = await nt.evaluate(() => { const l = document.getElementById('ntDashLink'); if (!l) return null; const r = l.getBoundingClientRect();
      return { note: document.getElementById('ntDashNote').textContent, none: I18n.t('nametags.dash.none'), text: l.textContent.trim(), want: I18n.t('nametags.dash.open_dashboard'), href: l.getAttribute('href'), target: l.target, rel: l.rel, h: Math.round(r.height), shown: l.getClientRects().length > 0 }; });
    if (!a) throw new Error('no #ntDashLink');
    ok(a.shown && a.note === a.none && a.text === a.want && a.href === 'classroom_dashboard.html?settings=picker' && a.target === '_blank' && /noopener/.test(a.rel) && a.h >= 24,
      `${L} (1) Name Tags' box: note «${a.note.slice(0, 50)}…», link «${a.text}» → ${a.href} (${a.target}, ${a.h} px)`);
    // (2) the link → the dashboard's tab, Settings on the Student Picker
    const [dash] = await Promise.all([ctx.waitForEvent('page'), press(nt, '#ntDashLink')]);
    const focus1 = await nt.evaluate(() => document.activeElement && document.activeElement.id);   // the link, once pressed
    dash.setDefaultTimeout(20000);
    await dash.waitForLoadState('load'); await ready(dash);
    await dash.waitForFunction(() => document.getElementById('settingsModal').classList.contains('open'), null, { timeout: 10000 }).catch(() => {});
    const b = await dash.evaluate(() => { const ae = document.activeElement; return { open: document.getElementById('settingsModal').classList.contains('open'), tab: (document.querySelector('#settingsModal [role="tab"][aria-selected="true"]') || {}).id, focus: !!ae && !!ae.closest('.tt-set[data-set="picker"]') && ae.classList.contains('tt-set-title'), starter: document.getElementById('frBackdrop').classList.contains('open'), search: location.search }; });
    ok(b.open && b.tab === 'dashTabClass' && b.focus && !b.starter && b.search === '', `${L} (2) the dashboard's tab: Settings ${b.open}, tab ${b.tab}, the Student Picker heading focused ${b.focus}, starter card ${b.starter}, address «${b.search}»`);
    // (3) a class typed in the dashboard reaches the open box
    await press(dash, '#pickerRoster');
    await dash.keyboard.press('ControlOrMeta+a'); await dash.keyboard.type('Ava\nNoah\nדָּוִד'); await dash.keyboard.press('Tab');
    await nt.waitForFunction(() => document.querySelectorAll('#ntDashSel option').length > 0, null, { timeout: 10000 }).catch(() => {});
    const c = await nt.evaluate(() => ({ opts: [...document.querySelectorAll('#ntDashSel option')].map(o => o.textContent), sel: document.getElementById('ntDashSel').disabled, add: document.getElementById('ntDashAdd').disabled, note: document.getElementById('ntDashNote').textContent, focus: document.activeElement && document.activeElement.id }));
    ok(c.opts.length === 1 && /3/.test(c.opts[0]) && !c.sel && !c.add && c.note === '' && c.focus === focus1, `${L} (3) back in Name Tags: menu ${JSON.stringify(c.opts)}, Bring in enabled ${!c.add}, note «${c.note}», focus #${c.focus} (was #${focus1})`);
    // (4) Bring in → Make a new list: the dashboard shows its Name Tags row
    await nt.bringToFront(); await press(nt, '#ntDashAdd'); await nt.waitForTimeout(200);
    const msg = await nt.evaluate(() => document.getElementById('ntImportMsg').textContent);
    await press(nt, '#ntImportNew'); await nt.waitForTimeout(300);
    await dash.waitForFunction(() => !document.getElementById('pickerFromNtRow').hidden, null, { timeout: 10000 }).catch(() => {});
    const d = await dash.evaluate(() => { const l = document.getElementById('pickerNtLink'); if (!l) return null; const r = l.getBoundingClientRect(); return { row: !document.getElementById('pickerFromNtRow').hidden, text: l.textContent.trim(), want: I18n.t('dashboard.picker.open_nametags'), href: l.getAttribute('href'), target: l.target, h: Math.round(r.height), active: JSON.parse(localStorage.getItem('hebrewDashboard_settings') || '{}').activeRosterId }; });
    if (!d) throw new Error('no #pickerNtLink');
    ok(/3/.test(msg) && d.row && d.text === d.want && d.href === 'name_tags.html?from=dashboard' && d.target === '_blank' && d.h >= 24, `${L} (4) «${msg.slice(0, 60)}» → a new list; the dashboard's row shown ${d.row}, link «${d.text}» → ${d.href} (${d.h} px)`);
    // (5) "Open Name Tags ↗": the box open on the dashboard's live class
    await dash.bringToFront();
    const [nt2] = await Promise.all([ctx.waitForEvent('page'), press(dash, '#pickerNtLink')]);
    nt2.setDefaultTimeout(20000);
    await nt2.waitForLoadState('load'); await ready(nt2);
    await nt2.waitForFunction(() => !document.getElementById('ntDashRow').hidden, null, { timeout: 10000 }).catch(() => {});
    const e = await nt2.evaluate(() => ({ row: !document.getElementById('ntDashRow').hidden, val: document.getElementById('ntDashSel').value, focus: document.activeElement && document.activeElement.id, search: location.search, folded: document.getElementById('ntListSection').classList.contains('collapsed'), exp: document.getElementById('ntDashOpen').getAttribute('aria-expanded') }));
    ok(e.row && e.val === d.active && e.focus === 'ntDashSel' && e.search === '' && !e.folded && e.exp === 'true', `${L} (5) Name Tags from the dashboard: box open ${e.row} (${e.exp}), class ${e.val} = the live one ${d.active}, focus #${e.focus}, address «${e.search}», list folded ${e.folded}`);
    ok(errors.length === 0, `${L} 0 page errors across 3 tabs (${errors.length}${errors.length ? ': ' + errors[0].slice(0, 120) : ''})`);
  } catch (err) { fail++; console.log(`✘ ${L}: ${String(err).split('\n')[0]}`); }
  await ctx.close();
  // (6) a bogus section on a fresh profile
  const f = await newCtx(cell);
  try {
    const p = await f.ctx.newPage(); p.setDefaultTimeout(20000);
    await p.goto(base + '/classroom_dashboard.html?settings=bogus#x', { waitUntil: 'load' }); await ready(p); await p.waitForTimeout(400);
    const g = await p.evaluate(() => ({ open: document.getElementById('settingsModal').classList.contains('open'), starter: document.getElementById('frBackdrop').classList.contains('open'), url: location.search + location.hash }));
    ok(!g.open && g.starter && g.url === '#x' && f.errors.length === 0, `${L} (6) ?settings=bogus: Settings ${g.open}, the starter card ${g.starter}, address «${g.url}», ${f.errors.length} errors`);
  } catch (err) { fail++; console.log(`✘ ${L} (6): ${String(err).split('\n')[0]}`); }
  await f.ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: Name Tags and the Classroom Dashboard link to each other\'s class lists');
process.exit(fail ? 1 : 0);
