#!/usr/bin/env node
// S657 — Bulk Copy's Select page, Select all matching and Clear speak the new count: each writes "N selected" (the very
// text of the count line beside them) into the page's polite status region, while the focus stays on the button pressed.
// Keyboard only: Bulk Copy Mode on by Space, then Enter on Select page, Select all matching, Clear and Select page again
// (after a search narrows the list), × EN/HE × light/dark × 1280/800. The region's role and politeness are read from
// Chromium's accessibility tree.
//
//   node scripts/loop/probes/S657-dictionary-bulk-count-is-spoken.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S657 fails every step: the status region keeps whatever it last said); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 1280 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 800 }];
for (const cell of (process.env.ONE ? CELLS.slice(0, 1) : CELLS)) {
  const id = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('s657')) return; sessionStorage.setItem('s657', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('#resultsGrid .word-card').length > 10, null, { timeout: 60000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  const read = async () => {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '#a11yStatus' });
    if (!nodeId) return null;
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const n = nodes[0]; const p = Object.fromEntries((n.properties || []).map(x => [x.name, x.value.value]));
    return await page.evaluate(([role, live, ignored]) => ({ role, live, ignored, said: document.getElementById('a11yStatus').textContent, count: document.getElementById('bulkCount').textContent, cards: document.querySelectorAll('#resultsGrid .wc-bulk-cb:checked').length, focus: document.activeElement && (document.activeElement.getAttribute('onclick') || document.activeElement.id) }), [n.role && n.role.value, p.live || null, !!n.ignored]);
  };
  const step = async (name, fn, check) => {
    let r = null;
    try { await fn(); await page.waitForTimeout(200); r = await read(); } catch (e) { r = { error: String(e).split('\n')[0] }; }
    const ok = !!(r && !r.error && r.role === 'status' && r.live === 'polite' && !r.ignored && r.said === r.count && check(r)); if (!ok) fail++;
    record.push({ cell: id, name, ok, r });
    if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${id} — ${name}: ${JSON.stringify(r)}`);
  };
  // Bulk Copy Mode on: its section opened by its own header, the box by Space
  await page.evaluate(() => { const s = document.getElementById('appSidebar'); if (s.getBoundingClientRect().width < 50) { const b = document.getElementById('sidebarShowBtn'); if (b) b.click(); } });
  await page.evaluate(() => { const p = document.getElementById('panelAdvanced'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); const t = document.querySelector('.adv-section-title[data-i18n="dictionary.copy.opts_head"]'); if (t.closest('.adv-section').classList.contains('collapsed')) t.click(); });
  await page.focus('#bulkModeCb'); await page.keyboard.press('Space'); await page.waitForTimeout(250);
  const btn = sel => page.locator(`#bulkPanel button[onclick="${sel}"]`);
  const enter = async sel => { await btn(sel).focus(); await page.keyboard.press('Enter'); };
  await step('1 Select page: the page\'s count is spoken', () => enter('selectAllOnPage()'), r => r.cards > 0 && r.said.includes(String(r.cards)) && r.focus === 'selectAllOnPage()');
  await step('2 Select all matching: the whole list\'s count is spoken', () => enter('selectAllMatching()'), r => /\d/.test(r.said) && r.focus === 'selectAllMatching()');
  await step('3 Clear: "0 selected" is spoken', () => enter('clearBulkSelection()'), r => r.cards === 0 && /(^|\D)0(\D|$)/.test(r.said) && r.focus === 'clearBulkSelection()');
  await step('4 a search, then Select page: the narrower count is spoken', async () => {
    await page.fill('#searchInput', cell.lang === 'he' ? 'שלום' : 'peace'); await page.waitForTimeout(700); await enter('selectAllOnPage()');
  }, r => r.cards > 0 && r.said.includes(String(r.cards)));
  if (errors.length) { fail++; record.push({ cell: id, name: 'page errors', ok: false, r: errors.slice(0, 2) }); if (!JSON_OUT) console.log('✘', id, 'page errors', errors.slice(0, 2)); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(`${record.filter(r => r.ok).length}/${record.length} ok`);
process.exit(fail ? 1 : 0);
