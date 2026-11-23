#!/usr/bin/env node
// S673 — pwa.js's iOS install hint against the two trainers' settings drawer and copy dock. On an iPhone the hint (fixed
// at the bottom, above every z-index) sat over the drawer's last control once the drawer was scrolled to its end (Print
// handout, Reset all, the last font; the Torah Trainer's last holiday) and over the dock's Copy All and Clear, so a tap
// landed on the hint. Each page now hides it while its drawer is open or its dock is up.
// Also the detection recipe of pattern install-banner-over-a-sheet's-bottom-controls for a drawer and a fixed dock
// (S572's probe covers the tours).
//
//   node scripts/loop/probes/S673-install-hint-clears-drawer-and-dock.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S673 fails every cell);
//   PAGES=a,b limits the pages; --json prints the record.
//
// The hint forced (navigator.standalone false on the iPhone UA, the dismiss key absent) on iPhone SE, 13 and SE sideways
// × EN/HE. By real taps: Settings, every tab scrolled to its end with each control in view hit-tested at its centre and
// bottom edge, close; then Share → Select lines to copy…, Select lines on, a line picked, the dock's two buttons
// hit-tested and Clear tapped. The hint must be hidden while the drawer or the dock is up and back afterwards.
// Sefaria is stubbed (ordinary vocabulary words from data/hebrew_words.json, never liturgical text): the dock needs lines.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const PAGES = (process.env.PAGES || 'tefillah_trainer,torah_trainer').split(',');
// Fixture text: pointed vocabulary words.
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 40);
const LINES = [0, 1, 2, 3, 4, 5].map(i => WORDS.slice(i * 5, i * 5 + 5).join(' '));
const NODE = 'Siddur Ashkenaz, Probe, Alpha';
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: NODE } }] };
const tefillahAnswer = () => ({ versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: LINES }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] });
const torahAnswer = () => ({ ref: 'Genesis 1:1-6', sections: ['1', '1'], versions: [{ language: 'he', text: LINES }] });
const CELLS = [['iPhone SE', 'en'], ['iPhone SE', 'he'], ['iPhone 13', 'en'], ['iPhone 13', 'he'], ['iPhone SE landscape', 'en'], ['iPhone SE landscape', 'he']];
const hintState = () => { const b = document.getElementById('pwaInstallBanner'); return b ? getComputedStyle(b).visibility : 'none'; };
// Every control of `root` that is in view: is its centre and its bottom edge its own? Returns the ones the hint covers.
const coveredIn = (rootSel) => {
  const root = document.querySelector(rootSel); if (!root) return ['no ' + rootSel];
  const hint = document.getElementById('pwaInstallBanner'); const ch = document.documentElement.clientHeight; const out = [];
  for (const e of root.querySelectorAll('button, select, a[href], label.toggle, label[for], input[type=range], textarea, [role=button]')) {
    const r = e.getClientRects()[0]; if (!r || r.width < 2 || getComputedStyle(e).visibility === 'hidden') continue;
    if (r.bottom < 0 || r.top > ch) continue;
    for (const [x, y] of [[r.left + r.width / 2, r.top + r.height / 2], [r.left + r.width / 2, r.bottom - 2]]) {
      if (y < 0 || y > ch) continue; const t = document.elementFromPoint(x, y);
      if (t && hint && hint.contains(t)) { out.push((e.id || e.textContent.trim().slice(0, 18) || e.className)); break; }
    }
  }
  return out;
};
const browser = await chromium.launch();
const records = [];
for (const pg of PAGES) for (const [dev, lang] of CELLS) {
  const ctx = await browser.newContext({ ...devices[dev], serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); for (const k of ['hebrewTefillahTrainer_tourSeen', 'hebrewTorahTrainer_tourSeen', 'hebrewTorahTrainer_hintSeen']) localStorage.setItem(k, '1'); } try { Object.defineProperty(navigator, 'standalone', { get: () => false }); } catch (e) {} }, { lang });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(pg === 'tefillah_trainer' ? tefillahAnswer() : torahAnswer()) });
    return r.abort();
  });
  const rec = { cell: `${pg} ${dev} ${lang}`, lines: 0, hint: [], covered: [], tabs: 0, dock: null, note: '' };
  try {
    await page.goto(`${BASE}/${pg}.html${pg === 'torah_trainer' ? '?ref=Genesis%201:1-6' : ''}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ttReading [data-vk]', { timeout: 20000 }); await page.waitForTimeout(2200);
    rec.lines = await page.locator('#ttReading [data-vk]').count();
    rec.hint.push(await page.evaluate(hintState));                                             // 0: at load — visible
    const gear = page.locator('#gearBtn'); await gear.scrollIntoViewIfNeeded(); await gear.tap(); await page.waitForTimeout(500);
    rec.hint.push(await page.evaluate(hintState));                                             // 1: the drawer open — hidden
    for (const tab of await page.locator('#settingsModal [role=tab]').all()) {
      if (!(await tab.isVisible())) continue;
      await tab.tap(); await page.waitForTimeout(220); rec.tabs++;
      await page.evaluate(() => { const b = document.querySelector('#settingsModal .settings-body'); if (b) b.scrollTop = b.scrollHeight; }); await page.waitForTimeout(120);
      const c = await page.evaluate(coveredIn, '#settingsModal'); if (c.length) rec.covered.push(`${await tab.getAttribute('id')}: ${c.join(', ')}`);
    }
    // Share → Select lines to copy… (closes the drawer and opens the bar)
    await page.locator('#ttTabShare').tap(); await page.waitForTimeout(200);
    const launch = page.locator('#settingsModal button[onclick="openCopyBarFromDrawer()"]'); await launch.scrollIntoViewIfNeeded(); await launch.tap(); await page.waitForTimeout(600);
    rec.hint.push(await page.evaluate(hintState));                                             // 2: the drawer closed, nothing picked — visible
    await page.locator('label.toggle:has(#ttCopyBulkCb) .slider').tap(); await page.waitForTimeout(200);
    const cb = page.locator('#ttReading [data-vk]').nth(1).locator('.tt-bulk-cb'); await cb.scrollIntoViewIfNeeded(); await cb.tap(); await page.waitForTimeout(400);   // the line's own checkbox: a tap on the row can land on one of its buttons
    rec.dock = await page.evaluate(() => { const d = document.getElementById('ttBulkDock'); return !!d && !d.hidden && d.getBoundingClientRect().height > 0; });
    rec.hint.push(await page.evaluate(hintState));                                             // 3: the dock up — hidden
    const c = await page.evaluate(coveredIn, '#ttBulkDock'); if (c.length) rec.covered.push('dock: ' + c.join(', '));
    await page.locator('#ttBulkDock .btn-secondary').tap({ timeout: 2500 }).catch(() => { rec.note = 'Clear could not be tapped'; }); await page.waitForTimeout(400);
    rec.hint.push(await page.evaluate(hintState));                                             // 4: cleared — visible
  } catch (e) { rec.note = String(e.message).split('\n')[0].slice(0, 160); }
  rec.errors = errors.length;
  rec.ok = rec.lines > 1 && rec.tabs >= 5 && rec.dock === true && !rec.covered.length && !rec.note && rec.hint.join() === 'visible,hidden,visible,hidden,visible';
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(44)} tabs ${r.tabs} lines ${r.lines} hint ${r.hint.join('→')} covered ${r.covered.length ? r.covered.join(' | ').slice(0, 150) : 0}${r.note ? ' — ' + r.note : ''} errors ${r.errors}`);
if (!JSON_OUT) console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
