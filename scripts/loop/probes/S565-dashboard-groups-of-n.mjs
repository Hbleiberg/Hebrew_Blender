#!/usr/bin/env node
// S565 — the dashboard's Make Groups, "Groups of N", keeps a small class in groups of about N. Before (fix 9cb2d28),
// computeGroupSizes took ⌊present/N⌋ groups, so 6 present with N = 4 made one group of 6.
//
//   node scripts/loop/probes/S565-dashboard-groups-of-n.mjs        exit 1 when a case below gives other group sizes
//   --json prints the record.
//
// Serves the repo root in-process (foreign origins aborted, service workers blocked). By real clicks: the General
// starter, a roster typed into the drawer's Class tab, the mode and N set there, Make Groups pressed on the board,
// the names per card counted. The controls: 25 / 4, pairs from 5 and "3 groups" of 7 keep their sizes.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const NAMES = ['Avi', 'Batya', 'Chaim', 'Dina', 'Eli', 'Freida', 'Gila', 'Hillel', 'Ilana', 'Yosef', 'Kayla', 'Levi', 'Miri', 'Noa', 'Ori', 'Penina', 'Rafi', 'Sara', 'Tali', 'Uri', 'Vered', 'Ziva', 'Adina', 'Boaz', 'Carmel'];
const CASES = [   // [present, mode, N, the expected names per card]
  [6, 'size', 4, [3, 3]], [7, 'size', 4, [4, 3]], [11, 'size', 4, [4, 4, 3]],
  [25, 'size', 4, [5, 4, 4, 4, 4, 4]], [5, 'size', 2, [3, 2]], [7, 'count', 3, [3, 2, 2]],
];
const browser = await chromium.launch();
const records = [];
for (const cell of [{ lang: 'en', dark: '0', w: 1280 }, { lang: 'he', dark: '1', w: 800 }]) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark); } }, cell);
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/classroom_dashboard.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('frModal').classList.contains('open'), null, { timeout: 20000 });
  await page.click('#frStarters .fr-starter:nth-child(3)'); await page.waitForTimeout(600);
  for (const [count, mode, n, want] of CASES) {
    await page.click('#gearBtn'); await page.waitForTimeout(250);
    await page.click('#dashTabClass');
    if (!(await page.isChecked('#showStudentPicker'))) await page.click('label.toggle:has(#showStudentPicker) .slider');
    await page.fill('#pickerRoster', NAMES.slice(0, count).join('\n')); await page.dispatchEvent('#pickerRoster', 'change');
    await page.click(`label[for="gm-${mode}"]`);
    await page.fill('#groupN', String(n)); await page.dispatchEvent('#groupN', 'change');
    await page.click('#settingsModal .settings-close:not(#drawerDarkBtn)'); await page.waitForTimeout(300);
    await page.click('button[onclick="makeGroups()"]'); await page.waitForTimeout(500);
    const got = await page.$$eval('.pick-group-card', (cards, names) => cards.map(c => names.filter(nm => c.textContent.includes(nm)).length), NAMES.slice(0, count));
    const sorted = got.slice().sort((a, b) => b - a);
    records.push({ cell: `${cell.lang} ${cell.w}`, count, mode, n, want, got: sorted, ok: JSON.stringify(sorted) === JSON.stringify(want) });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  if (errors.length) records.push({ cell: `${cell.lang} ${cell.w}`, errors });
  await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => r.errors || !r.ok);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.filter(r => !r.errors).forEach(r => console.log(`${r.cell.padEnd(8)} ${String(r.count).padStart(2)} present, ${r.mode === 'size' ? 'groups of' : 'groups ='} ${r.n}: [${r.got.join(', ')}]${r.ok ? '' : `  FAIL (want [${r.want.join(', ')}])`}`));
bad.filter(r => r.errors).forEach(r => console.log(`FAIL ${r.cell}: ${r.errors.length} pageerrors`));
process.exit(bad.length ? 1 : 0);
