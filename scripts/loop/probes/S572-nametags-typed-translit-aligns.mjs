#!/usr/bin/env node
// S572 — Name Tags, the class table's transliteration column: a typed transliteration starts where the automatic ones do,
// its back-to-automatic icon after the text. In the Hebrew UI the icon took the row's inline end (the left, before the
// Latin text), so a typed name started 30px in from its automatic neighbours (42px on an iPhone 13).
//
//   node scripts/loop/probes/S572-nametags-typed-translit-aligns.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the page before 522220fc fails the Hebrew cells);
//   --json prints the record.
//
// A seeded four-name list (one transliteration stored), a second typed by real keystrokes; EN/HE × light/dark × 1280/800 and
// an iPhone 13: every row's text-start x (field edge + border + padding) equal, every shown icon after its field.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const seed = JSON.stringify({ 'Room 4': { v: 1, rows: [{ he: 'דָּוִד' }, { he: 'שָׂרָה' }, { he: 'מִרְיָם' }, { he: 'יוֹסֵף', tr: 'Yossi' }], extra: '' } });
const browser = await chromium.launch();
const records = [];
for (const [lang, dark, w] of [['en', 0, 1280], ['en', 1, 1280], ['en', 0, 800], ['en', 1, 800], ['he', 0, 1280], ['he', 1, 1280], ['he', 0, 800], ['he', 1, 800], ['he', 0, 'iPhone 13'], ['en', 1, 'iPhone 13']]) {
  const ctx = await browser.newContext({ ...(typeof w === 'string' ? devices[w] : { viewport: { width: w, height: 900 } }), serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', String(c.dark)); localStorage.setItem('hebrewNameTags_tourSeen', '1'); localStorage.setItem('hebrewNameTags_lists', c.seed); localStorage.setItem('hebrewNameTags_activeList', 'Room 4'); } }, { lang, dark, seed });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/name_tags.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelectorAll('.nt-table input[data-f="tr"]').length >= 4, null, { timeout: 20000 }); await page.waitForTimeout(600);
  const f = page.locator('.nt-table input[data-f="tr"]').nth(1); await f.scrollIntoViewIfNeeded(); await f.click(); await page.keyboard.type('Sarah'); await page.keyboard.press('Tab'); await page.waitForTimeout(500);
  const rows = await page.evaluate(() => [...document.querySelectorAll('.nt-table tbody tr')].slice(0, 4).map(tr => { const i = tr.querySelector('input[data-f="tr"]'); const s = getComputedStyle(i); const r = i.getBoundingClientRect(); const b = tr.querySelector('.nt-auto'); const br = b && !b.hidden ? b.getBoundingClientRect() : null; return { typed: i.value, x: Math.round(r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft)), icon: br ? (br.left >= r.right - 1 ? 'after' : 'before') : '-' }; }));
  const rec = { cell: `${lang} ${dark ? 'dark' : 'light'} ${w}`, rows, errors: errors.length };
  rec.ok = rows.filter(r => r.typed).length === 2 && new Set(rows.map(r => r.x)).size === 1 && rows.filter(r => r.typed).every(r => r.icon === 'after');
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
const bad = records.filter(r => !r.ok || r.errors);
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else for (const r of records) console.log(`${r.ok && !r.errors ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(18)} text x ${r.rows.map(x => x.x).join(',')}  icons ${r.rows.map(x => x.icon).join(',')}  errors ${r.errors}`);
process.exit(bad.length ? 1 : 0);
