#!/usr/bin/env node
// S634 (the S588 candidate; pattern decorative-glyph-carrier-exposed-to-assistive-tech) — the shared folder-tree block's
// Move button and its menu's top level read their glyphs: the strings were "Move ▾" / "העבר ▾" and "⌂ Root" / "⌂ שורש",
// so a screen reader announced "Move down-pointing small triangle" on every preset, profile, schedule and favorite
// reading, and the menu itself took that name. The strings are the words; the block's CSS draws the ▾ after the button's
// word and the ⌂ before the top level's, each with an empty alt (`content: '…' / ''`), so the look is unchanged.
//
//   node scripts/loop/probes/S634-folder-tree-move-glyphs-drawn-not-read.mjs
//   exit 1 when, on any of the four carriers that render a tree (generator, flash cards, dashboard, Torah Trainer) in
//   EN light 1280 or HE dark 800: the Move button's or the menu's accessible name, or the top-level item's, carries ▾ or
//   ⌂; a StaticText node with either glyph is left in the tree's row or the open menu; or the glyph no longer paints
//   (the button's ::after / the item's ::before). ROOT=<a git archive of the tree> runs another copy (the tree before
//   S634 fails every carrier in both cells); --json prints the record.
//
// Serves ROOT in-process (every other foreign origin aborted, service workers blocked); the dashboard's and the
// Trainer's trees sit in the settings drawer, opened by a real click on the gear and the drawer tab that holds them
// (S614's probe's route). The menu opens by a real click on the item's Move button.
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
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const records = []; let fail = 0;
const GLYPH = /[▾⌂]/;
const ITEM = '[data-ft-item="Probe item"]';
for (const P of PAGES) for (const cell of CELLS) {
  const tag = `${P.page} ${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([P, lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    for (const k of ['hebrewBlender_tourSeen', 'hebrewFlashCards_tourSeen', 'hebrewDashboard_tourSeen', 'hebrewDashboard_firstRunSeen', 'hebrewTorahTrainer_tourSeen']) localStorage.setItem(k, '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    localStorage.setItem(P.items, JSON.stringify({ 'Probe item': P.val }));
    localStorage.setItem(P.tree, JSON.stringify({ v: 1, root: [{ t: 'folder', id: 'f_probe', name: 'Probe folder', collapsed: false, children: [{ t: 'item', name: 'Probe item' }] }] })); }, [P, cell.lang, cell.dark]);
  const rec = { cell: tag, ok: false };
  try {
    await page.goto(`${BASE}/${P.page}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready); await page.waitForLoadState('load'); await page.waitForTimeout(800);
    await page.evaluate(() => { document.querySelectorAll('.overlay.open,.fr-modal.open,#frBackdrop.open').forEach(o => o.classList.remove('open')); });
    if (!(await page.evaluate(s => !!document.querySelector(s + ' .ft-move-btn'), ITEM))) throw new Error('handle missing: the seeded item\'s Move button');
    if (P.drawer) {
      await page.click('#gearBtn'); await page.waitForTimeout(500);
      const tab = await page.evaluate(s => { const h = document.querySelector(s); const t = [...document.querySelectorAll('[role=tab][aria-controls]')].find(t => document.getElementById(t.getAttribute('aria-controls'))?.contains(h)); return t ? t.id : null; }, ITEM);
      if (tab) { await page.click('#' + tab); await page.waitForTimeout(300); }
    }
    await page.evaluate(s => { let p = document.querySelector(s); while (p) { p.classList?.remove('collapsed'); if (p.tagName === 'DETAILS') p.open = true; p = p.parentElement; } document.querySelector(s).scrollIntoView({ block: 'center' }); }, ITEM);
    await page.evaluate(s => document.querySelector(s + ' .ft-move-btn').setAttribute('data-probe', 'move'), ITEM);
    await page.click(ITEM + ' .ft-move-btn'); await page.waitForSelector('.ft-move-menu [role=menuitem]', { timeout: 3000 });
    await page.evaluate(() => document.querySelector('.ft-move-menu').setAttribute('data-probe', 'menu'));
    const cdp = await ctx.newCDPSession(page); await cdp.send('Accessibility.enable'); await cdp.send('DOM.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const byId = new Map(nodes.map(n => [n.nodeId, n]));
    // the DOM node of each AX node, for scoping: the item's row and the menu
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const scopeIds = async (sel) => { const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel }); const out = new Set(); for (const id of nodeIds) { const { node } = await cdp.send('DOM.describeNode', { nodeId: id, depth: -1, pierce: false }); (function walk(n) { out.add(n.backendNodeId); (n.children || []).forEach(walk); })(node); } return out; };
    const inRow = await scopeIds(ITEM), inMenu = await scopeIds('[data-probe="menu"]');
    const nameOf = (pred) => { const n = nodes.find(pred); return n ? (n.name && n.name.value) || '' : null; };
    const moveNode = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-probe="move"]' });
    const moveBackend = (await cdp.send('DOM.describeNode', { nodeId: moveNode.nodeId })).node.backendNodeId;
    const menuBackend = (await cdp.send('DOM.describeNode', { nodeId: (await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-probe="menu"]' })).nodeId })).node.backendNodeId;
    rec.moveName = nameOf(n => n.backendDOMNodeId === moveBackend);
    rec.menuName = nameOf(n => n.backendDOMNodeId === menuBackend);
    rec.items = nodes.filter(n => !n.ignored && n.role && n.role.value === 'menuitem' && inMenu.has(n.backendDOMNodeId)).map(n => (n.name && n.name.value) || '');
    rec.glyphText = nodes.filter(n => !n.ignored && n.role && /StaticText|text/.test(n.role.value) && (inRow.has(n.backendDOMNodeId) || inMenu.has(n.backendDOMNodeId) || (n.parentId && (inRow.has(byId.get(n.parentId)?.backendDOMNodeId) || inMenu.has(byId.get(n.parentId)?.backendDOMNodeId)))) && GLYPH.test((n.name && n.name.value) || '')).length;
    rec.paint = await page.evaluate(() => ({ caret: getComputedStyle(document.querySelector('[data-probe="move"]'), '::after').content, root: (() => { const b = document.querySelector('[data-probe="menu"] [role=menuitem]'); return b ? getComputedStyle(b, '::before').content + ' | ' + b.textContent : null; })() }));
    const paintsCaret = /▾/.test(rec.paint.caret) || /▾/.test(await page.evaluate(() => document.querySelector('[data-probe="move"]').textContent));
    const paintsHouse = /⌂/.test(rec.paint.root || '');
    rec.ok = rec.moveName !== null && rec.items.length >= 1 && !GLYPH.test(rec.moveName) && !GLYPH.test(rec.menuName || '') && rec.items.every(x => !GLYPH.test(x)) && rec.glyphText === 0 && paintsCaret && paintsHouse && !!rec.moveName.trim() && !!rec.items[0].trim();
  } catch (e) { rec.error = String(e).slice(0, 200); }
  rec.pageErrors = errors.length; if (errors.length) { rec.ok = false; rec.errors = errors; }
  if (!rec.ok) fail++;
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else { for (const r of records) console.log(`${r.ok ? '✔' : '✘'} ${r.cell}: ${JSON.stringify({ move: r.moveName, menu: r.menuName, items: r.items, glyphText: r.glyphText, paint: r.paint, error: r.error, pageErrors: r.pageErrors })}`); console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every carrier in both cells'); }
process.exit(fail ? 1 : 0);
