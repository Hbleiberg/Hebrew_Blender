#!/usr/bin/env node
// S656 — a word window's gematria badge is a button that lists every word of the same value (the user's request,
// after the "tap a number" lookup of a roots page): by real clicks and keys × EN/HE × light/dark × 1280/800 —
//   1 the badge is a button named by what it shows ("ג N"), described by its title, ≥ 24px tall;
//   2 a click: the window closes, Words mode, Show Gematria Value on, the filter "Exact value N", the list = every
//     corpus word of value N, the chip "Gematria = N", the focus on the first result;
//   3 by the keyboard from a search: the search is cleared (it would leave only that word), the same list;
//   4 a theme on: the theme stays (the list = the theme ∩ N, both chips shown);
//   5 from Shoresh mode: back to Words with the filter;
//   6 a reload keeps the filter (the session state);
//   7 the button's text at rest and under the pointer ≥ 4.5:1 in both themes.
//
//   node scripts/loop/probes/S656-dictionary-gematria-badge-finds-its-value.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before it fails step 1: the badge is a span); --json prints the record.
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
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }];
for (const cell of (process.env.ONE ? CELLS.slice(0, 1) : CELLS)) {
  const id = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('s656g')) return; sessionStorage.setItem('s656g', '1'); localStorage.clear(); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewDictionary_tourSeen', '1'); }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  const load = async (q = '') => {
    await page.goto(base + '/hebrew_dictionary.html' + q, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelectorAll('#resultsGrid .word-card').length > 0 && typeof ALL_WORDS !== 'undefined' && ALL_WORDS.length > 13000, null, { timeout: 60000 });
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(300);
  };
  const cdp = await ctx.newCDPSession(page);
  const axOf = async sel => {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel });
    if (!nodeId) return null;
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
    const n = nodes[0]; return { role: n.role && n.role.value, name: n.name && n.name.value, desc: n.description && n.description.value };
  };
  // The page's own view of the result: what is listed against the corpus' words of that value.
  const view = V => page.evaluate(V => {
    const all = ALL_WORDS.filter(w => w.gem === V).length;
    const a = document.activeElement;
    return {
      windowOpen: document.getElementById('wordModal').classList.contains('open'),
      mode: shoreshMode ? 'shoresh' : emojiMode ? 'emojis' : 'words',
      search: document.getElementById('searchInput').value,
      show: document.getElementById('showGematriaCb').checked,
      type: document.getElementById('gematriaFilterType').value, v1: document.getElementById('gematriaVal1').value,
      listed: filtered.length, allOfValue: all, allMatch: filtered.every(w => w.gem === V),
      chips: [...document.querySelectorAll('#filterChips .fchip-body')].map(c => c.textContent.trim()),
      animals: document.querySelector('.tcb[value="animals"]').checked,
      cardsShowValue: [...document.querySelectorAll('#resultsGrid .word-card .b-gem')].slice(0, 5).every(b => b.textContent.replace(/\D/g, '') === String(V)),
      focus: a && a.classList.contains('word-card') ? 'first-card:' + (a === document.querySelector('#resultsGrid .word-card')) : (a ? a.tagName + '#' + a.id : null),
      count: document.getElementById('resultCount').textContent,
    };
  }, V);
  const step = async (name, fn, check) => {
    let r = null;
    try { r = await fn(); } catch (e) { r = { error: String(e).split('\n')[0] }; }
    const ok = !!(r && !r.error && check(r)); if (!ok) fail++;
    record.push({ cell: id, name, ok, r });
    if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${id} — ${name}: ${JSON.stringify(r)}`);
    return r;
  };
  // each step starts from the defaults: the chips' Reset all, by a real click (a reload would restore the filter)
  const resetAll = async () => { const r = await page.$('#filterChips .fchip-reset'); if (r) { await r.scrollIntoViewIfNeeded(); await r.click(); await page.waitForTimeout(400); } };
  const openCard = async (sel, i) => { const c = (await page.$$(sel))[i]; await c.scrollIntoViewIfNeeded(); const b = await c.boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height * 0.7); await page.waitForSelector('#wordModal.open .wm-gem-btn'); };
  const valueOf = async () => Number((await page.$eval('#wordModal .wm-gem-btn', b => b.textContent)).replace(/\D/g, ''));
  const filteredOK = (r, V) => r.windowOpen === false && r.mode === 'words' && r.search === '' && r.show && r.type === 'exact' && r.v1 === String(V) && r.allMatch && r.cardsShowValue && r.chips.some(c => c.includes(String(V)));

  await load();
  let V = 0;
  await step('1 the badge is a button named by what it shows, described by its title, ≥ 24px', async () => {
    await openCard('#resultsGrid .word-card', 2); V = await valueOf();
    const ax = await axOf('#wordModal .wm-gem-btn');
    const box = await (await page.$('#wordModal .wm-gem-btn')).boundingBox();
    return { V, ax, h: box.height, w: box.width };
  }, r => r.V > 0 && r.ax.role === 'button' && r.ax.name.includes('ג') && r.ax.name.includes(String(r.V)) && r.ax.desc && r.ax.desc.includes(String(r.V)) && r.h >= 24 && r.w >= 24);
  await step('2 a click lists every word of that value, the focus on the first result', async () => {
    const b = await (await page.$('#wordModal .wm-gem-btn')).boundingBox(); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(400);
    return Object.assign({ V }, await view(V));
  }, r => filteredOK(r, V) && r.listed === r.allOfValue && r.focus === 'first-card:true');
  // 7 (rest + hover) is measured on the next window
  await step('3 by the keyboard from a search: the search cleared, the same full list', async () => {
    await resetAll();
    await page.fill('#searchInput', cell.lang === 'he' ? 'שלום' : 'peace'); await page.waitForTimeout(700);
    const c = await page.$('#resultsGrid .word-card'); await c.focus(); await page.keyboard.press('Enter'); await page.waitForSelector('#wordModal.open .wm-gem-btn');
    V = await valueOf();
    await page.focus('#wordModal .wm-gem-btn'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    return Object.assign({ V }, await view(V));
  }, r => filteredOK(r, V) && r.listed === r.allOfValue && r.listed > 1 && r.focus === 'first-card:true');
  await step('4 a theme on: the theme stays, the list = the theme ∩ the value', async () => {
    await resetAll();
    await page.evaluate(() => { const s = document.getElementById('appSidebar'); if (s.getBoundingClientRect().width < 50) { const b = document.getElementById('sidebarShowBtn'); if (b) b.click(); } const p = document.getElementById('panelThemes'); if (p.classList.contains('collapsed')) p.querySelector('.panel-title').click(); });
    await page.click('label:has(input.tcb[value="animals"])'); await page.waitForTimeout(500);
    await openCard('#resultsGrid .word-card', 1); V = await valueOf();
    await page.click('#wordModal .wm-gem-btn'); await page.waitForTimeout(400);
    const r = await view(V);
    r.themeAndValue = await page.evaluate(V => ALL_WORDS.filter(w => w.gem === V && (w.themes || []).includes('animals')).length, V);
    return Object.assign({ V }, r);
  }, r => filteredOK(r, V) && r.animals && r.listed >= 1 && r.listed <= r.allOfValue && r.chips.length >= 2);
  await step('5 from Shoresh mode: back to Words with the filter', async () => {
    await resetAll();
    await page.evaluate(() => { const s = document.getElementById('appSidebar'); if (s.getBoundingClientRect().width < 50) { const b = document.getElementById('sidebarShowBtn'); if (b) b.click(); } });
    await page.click('button[data-dict-mode="shoresh"]'); await page.fill('#shoreshInput', 'כתב'); await page.press('#shoreshInput', 'Enter'); await page.waitForTimeout(800);
    await openCard('#shoreshResults .word-card', 0); V = await valueOf();
    await page.click('#wordModal .wm-gem-btn'); await page.waitForTimeout(500);
    return Object.assign({ V }, await view(V));
  }, r => filteredOK(r, V) && r.listed === r.allOfValue && r.focus === 'first-card:true');
  await step('6 a reload keeps the filter', async () => { await page.waitForTimeout(800); await load(); return Object.assign({ V }, await view(V)); }, r => r.type === 'exact' && r.v1 === String(V) && r.show && r.allMatch && r.listed === r.allOfValue);
  await step('7 the button\'s text at rest and under the pointer ≥ 4.5:1', async () => {
    await openCard('#resultsGrid .word-card', 0);
    const read = () => page.$eval('#wordModal .wm-gem-btn', btn => {
      const cv = document.createElement('canvas').getContext('2d');
      const rgb = c => { cv.fillStyle = '#000'; cv.fillStyle = c; const f = cv.fillStyle; if (f[0] === '#') { const n = parseInt(f.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255, 1]; } const p = f.match(/[\d.]+/g).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
      const over = (t, b) => [0, 1, 2].map(i => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
      let g = [255, 255, 255, 1]; const chain = []; for (let e = btn; e; e = e.parentElement) chain.push(getComputedStyle(e).backgroundColor);
      for (let i = chain.length - 1; i >= 0; i--) { const c = rgb(chain[i]); if (c[3] > 0) g = over(c, g); }
      const fg = over(rgb(getComputedStyle(btn).color), g);
      const L = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const a = L(fg), b = L(g); return +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
    });
    await page.mouse.move(2, 2); await page.waitForTimeout(150); const rest = await read();
    await page.hover('#wordModal .wm-gem-btn'); await page.waitForTimeout(200); const hover = await read();
    return { rest, hover };
  }, r => r.rest >= 4.5 && r.hover >= 4.5);
  if (errors.length) { fail++; record.push({ cell: id, name: 'page errors', ok: false, errors }); if (!JSON_OUT) console.log('✘ page errors', errors); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ fail, record }, null, 1));
else console.log(fail ? `FAIL ${fail}` : `PASS ${record.length} steps`);
process.exit(fail ? 1 : 0);
