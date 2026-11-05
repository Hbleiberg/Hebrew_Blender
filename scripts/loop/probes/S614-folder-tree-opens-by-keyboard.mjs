#!/usr/bin/env node
// S614 — a folder in the shared folder-tree block opens and closes from the keyboard. The folder head was a <div>
// with a click listener and nothing else (no tab stop, no role, no key), so a collapsed folder's presets, profiles,
// schedules or favorite readings were out of reach of a keyboard: 400 Tabs never landed in the head. The folder name
// is now a <button aria-expanded>, the twisty is aria-hidden, and focus stays on the name across the rebuild a toggle
// makes.
//
//   node scripts/loop/probes/S614-folder-tree-opens-by-keyboard.mjs
//   exit 1 when, on any of the four carriers that render a tree (generator, flash cards, dashboard, Torah Trainer),
//   a collapsed folder holding one item cannot be reached by Tab, opened by Enter (the item shown, aria-expanded
//   "true", focus still on the name) or closed again by Space. ROOT=<a git archive of the tree> runs another copy
//   (the control: the tree before S614 fails all four); --json prints the record.
//
// Serves ROOT in-process (every other foreign origin aborted, service workers blocked); the dashboard's and the
// Trainer's trees sit in the settings drawer, opened by a real click on the gear and the drawer tab that holds them.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PAGES = [
  { page: 'hebrew_blend_generator.html', items: 'hebrewBlender_presets', tree: 'hebrewBlender_presetsFolders', val: {} },
  { page: 'flash_cards.html', items: 'hebrewFlashCards_presets', tree: 'hebrewFlashCards_presetsFolders', val: {} },
  { page: 'classroom_dashboard.html', items: 'hebrewDashboard_presets', tree: 'hebrewDashboard_presetsFolders', val: {}, drawer: true },
  { page: 'torah_trainer.html', items: 'hebrewTorahTrainer_favorites', tree: 'hebrewTorahTrainer_favoritesFolders', val: { v: 1, ref: 'Genesis 1:1-1:5', color: '#4caf50', ts: 1 }, drawer: true },
];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const records = [];
const SEL = '[data-ft-folder="f_probe"]';
for (const P of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(P => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    for (const k of ['hebrewBlender_tourSeen', 'hebrewFlashCards_tourSeen', 'hebrewDashboard_tourSeen', 'hebrewDashboard_firstRunSeen', 'hebrewTorahTrainer_tourSeen']) localStorage.setItem(k, '1');
    localStorage.setItem(P.items, JSON.stringify({ 'Probe item': P.val }));
    localStorage.setItem(P.tree, JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f_probe', name: 'Probe folder', collapsed: true, children: [{ t: 'item', name: 'Probe item' }] }] })); }, P);
  const rec = { page: P.page, ok: false };
  try {
    await page.goto(`${BASE}/${P.page}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready); await page.waitForLoadState('load'); await page.waitForTimeout(800);
    await page.evaluate(() => { document.querySelectorAll('.overlay.open,.fr-modal.open,#frBackdrop.open').forEach(o => o.classList.remove('open')); });
    rec.seeded = await page.evaluate(s => !!document.querySelector(s + ' .ft-folder-head'), SEL);
    if (!rec.seeded) throw new Error('the seeded folder did not render');
    if (P.drawer) {
      await page.click('#gearBtn'); await page.waitForTimeout(500);
      const tab = await page.evaluate(s => { const h = document.querySelector(s); const t = [...document.querySelectorAll('[role=tab][aria-controls]')].find(t => document.getElementById(t.getAttribute('aria-controls'))?.contains(h)); return t ? t.id : null; }, SEL);
      if (tab) { await page.click('#' + tab); await page.waitForTimeout(300); }
    }
    await page.evaluate(s => { let p = document.querySelector(s); while (p) { p.classList?.remove('collapsed'); if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } document.querySelector(s).scrollIntoView({ block: 'center' }); }, SEL);
    // Tab from the element before the head (its nearest preceding focusable), counting at most 60 presses
    await page.evaluate(s => { const head = document.querySelector(s + ' .ft-folder-head'); const all = [...document.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')].filter(e => e.tabIndex >= 0 && e.offsetParent && !e.disabled);
      const before = all.filter(e => head.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_PRECEDING).pop(); if (before) before.focus(); }, SEL);
    for (let i = 0; i < 60 && !rec.reached; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(s => { const a = document.activeElement; return !!a.closest(s + ' > .ft-folder-head') && !a.closest('.ft-folder-actions'); }, SEL)) rec.reached = i + 1; }
    if (rec.reached) {
      await page.keyboard.press('Enter'); await page.waitForTimeout(250);
      rec.open = await page.evaluate(s => ({ shown: !!document.querySelector(s + ' [data-ft-item="Probe item"]')?.offsetParent, exp: document.activeElement.getAttribute('aria-expanded'), focusOnName: document.activeElement.matches(s + ' .ft-folder-name') }), SEL);
      await page.keyboard.press(' '); await page.waitForTimeout(250);
      rec.close = await page.evaluate(s => ({ hidden: !document.querySelector(s + ' [data-ft-item="Probe item"]')?.offsetParent, exp: document.activeElement.getAttribute('aria-expanded'), focusOnName: document.activeElement.matches(s + ' .ft-folder-name') }), SEL);
      rec.ok = rec.open.shown && rec.open.exp === 'true' && rec.open.focusOnName && rec.close.hidden && rec.close.exp === 'false' && rec.close.focusOnName;
    }
  } catch (e) { rec.error = String(e).slice(0, 160); }
  rec.pageErrors = errors.length; if (errors.length) rec.ok = false;
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
const bad = records.filter(r => !r.ok);
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.page}${r.ok ? ` (Tab ×${r.reached})` : ' ' + JSON.stringify(r)}`);
process.exit(bad.length ? 1 : 0);
