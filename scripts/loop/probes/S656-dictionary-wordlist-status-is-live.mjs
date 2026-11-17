#!/usr/bin/env node
// S656 — the Save as Word List and Add to Word List windows speak their status line: it is a polite live region
// (role status) from the window's first paint, before any text, and "Enter a name", "Saved…", the taken-name note and
// "Added…" land in it, by the keyboard alone (Bulk Copy on by Space, two cards by Space, Save as Word List by Enter,
// Enter in the empty name field, a typed name + Enter, the same name again; then a word's details window → Add to
// Word List → Add), × EN/HE × light/dark × 1280/800.
//
//   node scripts/loop/probes/S656-dictionary-wordlist-status-is-live.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S656 fails every live-region step: the line reads as a generic div); --json prints the record.
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
// The line's inline style re-serializes ("min-height: 1.1em") once a message sets its colour: match both spellings.
const SEL = '#wmBody div[style*="1.1em"]';
const record = []; let fail = 0;
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 1280 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 800 }];
for (const cell of (process.env.ONE ? CELLS.slice(0, 1) : CELLS)) {
  const id = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('s656')) return; sessionStorage.setItem('s656', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  await page.goto(base + '/hebrew_dictionary.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('#resultsGrid .word-card').length > 10, null, { timeout: 60000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(300);
  const cdp = await ctx.newCDPSession(page);
  const ax = async () => {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: SEL });
    if (!nodeId) return null;
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const n = nodes[0]; const p = Object.fromEntries((n.properties || []).map(x => [x.name, x.value.value]));
    return { role: n.role && n.role.value, live: p.live || null, ignored: !!n.ignored, text: await page.$eval(SEL, e => e.textContent) };
  };
  const step = async (name, fn, check) => {
    let r = null;
    try { if (fn) await fn(); r = await ax(); } catch (e) { r = { error: String(e).split('\n')[0] }; }
    const ok = !!(r && !r.error && check(r)); if (!ok) fail++;
    record.push({ cell: id, name, ok, r });
    if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${id} — ${name}: ${JSON.stringify(r)}`);
  };
  const live = r => r.role === 'status' && r.live === 'polite' && !r.ignored;
  // Bulk Copy Mode on (its section opened by its own header), two cards picked, Save as Word List — keyboard only
  await page.evaluate(() => { const s = document.getElementById('appSidebar'); if (s.getBoundingClientRect().width < 50) { const b = document.getElementById('sidebarShowBtn'); if (b) b.click(); } });
  await page.evaluate(() => { const p = document.getElementById('panelAdvanced'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); const t = document.querySelector('.adv-section-title[data-i18n="dictionary.copy.opts_head"]'); if (t.closest('.adv-section').classList.contains('collapsed')) t.click(); });
  await step('1 Save as Word List: the status line is live before any text', async () => {
    await page.focus('#bulkModeCb'); await page.keyboard.press('Space'); await page.waitForTimeout(150);
    const cards = await page.$$('#resultsGrid .word-card');
    await cards[0].focus(); await page.keyboard.press('Space'); await cards[2].focus(); await page.keyboard.press('Space');
    await page.focus('#wlSaveBtn'); await page.keyboard.press('Enter'); await page.waitForSelector('#wlNewName'); await page.waitForTimeout(200);
  }, r => live(r) && r.text === '');
  await step('2 Enter in the empty name field: "Enter a name" lands in it, the focus stays in the field', async () => {
    await page.fill('#wlNewName', ''); await page.keyboard.press('Enter'); await page.waitForTimeout(150);
    if (await page.evaluate(() => document.activeElement.id) !== 'wlNewName') throw new Error('focus left the name field');
  }, r => live(r) && r.text.length > 5);
  await step('3 a typed name + Enter: "Saved…" lands in it', async () => { await page.keyboard.type('S656 list'); await page.keyboard.press('Enter'); await page.waitForTimeout(200); }, r => live(r) && r.text.includes('S656 list'));
  await step('4 the same name again: the taken-name note lands in it', async () => { await page.keyboard.type('S656 list'); await page.keyboard.press('Enter'); await page.waitForTimeout(150); }, r => live(r) && r.text.length > 5 && !r.text.includes('S656 list'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await step('5 a word\'s details → Add to Word List: the status line is live before any text', async () => {
    await page.focus('#bulkModeCb'); await page.keyboard.press('Space'); await page.waitForTimeout(250);
    const c = (await page.$$('#resultsGrid .word-card'))[5]; await c.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
    // the details window's last action is Add to Word List (offered once a list exists)
    const btns = await page.$$('#wmBody .wm-actions .wm-act'); if (btns.length < 2) throw new Error('no Add to Word List button');
    await btns[btns.length - 1].focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
    if (!(await page.$('#wmBody select'))) throw new Error('the Add to Word List window did not open');
  }, r => live(r) && r.text === '');
  await step('6 Add: "Added…" lands in it', async () => { await page.focus('#wmBody .wm-root-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(200); }, r => live(r) && r.text.length > 3);
  if (errors.length) { fail++; record.push({ cell: id, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ fail, record }, null, 1));
else console.log(fail ? `FAIL ${fail}` : `PASS ${record.length} steps`);
process.exit(fail ? 1 : 0);
