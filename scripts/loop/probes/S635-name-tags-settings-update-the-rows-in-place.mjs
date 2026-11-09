#!/usr/bin/env node
// S635 (pass D on name_tags.html) — the transliteration's mode and style, the extra-line checkbox and the header's Print
// box rebuilt every row of the class list, though each changes only how the rows read (a placeholder, the back-to-
// automatic button, a checkbox, the extra column's class): on a 200-student list that was a 320–410 ms task at 4× CPU
// (900–950 ms for Ashkenazi, the library's 200 names included), 66–178 ms at 1×. They now update the rows in place.
//
// A 200-student list (two typed transliterations, a name without nikkud, an extra value) in EN light 1280 and HE dark 800;
// each control pressed by a real click. Before it every <tr> is tagged with an expando; after it (1) every row is still
// the same node (a rebuild makes new ones), (2) the control fired (the stored setting, the boxes, the column's class
// changed), and (3) the table equals what a full rebuild gives: the rows' markup and their inputs' and buttons' value,
// placeholder, checked, indeterminate, disabled, hidden and title, the transliteration note, the header box's checked and
// mixed states, the extra row — read, then `ntRenderTable()` called, then read again. The library's origins are aborted
// (its failure path is a decorate like any other).
//
//   node scripts/loop/probes/S635-name-tags-settings-update-the-rows-in-place.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S635 fails (1) on every control in both cells); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const FIRST = [['דָּוִד', 'David'], ['שָׂרָה', 'Sarah'], ['יְהוּדָה', 'Yehuda'], ['רִבְקָה', 'Rivka'], ['מֹשֶׁה', 'Moshe'], ['לֵאָה', 'Leah'], ['אַבְרָהָם', 'Avraham'], ['רָחֵל', 'Rachel']];
const LAST = [['כֹּהֵן', 'Cohen'], ['לֵוִי', 'Levi'], ['פֶּרֶץ', 'Peretz'], ['שָׁלוֹם', 'Shalom'], ['כַּץ', 'Katz']];
const ROWS = Array.from({ length: 200 }, (_, k) => { const [fh, fe] = FIRST[k % 8], [lh, le] = LAST[Math.floor(k / 8) % 5]; return { he: fh + ' ' + lh, en: fe + ' ' + le + ' ' + (k + 1) }; });
ROWS[1].tr = 'Sorah'; ROWS[4].tr = 'Moishe'; ROWS[6].he = 'אברהם כהן'; ROWS[7].ex = 'Room 12';
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
// [name, selector clicked, what firing reads (before vs after must differ)]
const STEPS = [
  ['header Print box: clear every row', '#ntPrintAll', 'boxes'], ['header Print box: tick every row', '#ntPrintAll', 'boxes'],
  ['transliteration style: Ashkenazi', 'input[name="ntStyle"][value="ashkenazi"]', 'settings'], ['transliteration style: Modern', 'input[name="ntStyle"][value="modern"]', 'settings'],
  ['transliteration: type my own', 'input[name="ntTranslit"][value="custom"]', 'placeholders'], ['transliteration: none', 'input[name="ntTranslit"][value="off"]', 'placeholders'],
  ['transliteration: automatic', 'input[name="ntTranslit"][value="auto"]', 'settings'],
  ['extra line on', '#ntOptExtra', 'table'], ['extra line off', '#ntOptExtra', 'table'],
];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: 'Grade 3' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B');
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, ROWS]);
  try {
    await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('#ntRows tr').length >= 200);
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.panel.collapsed').forEach(x => x.classList.remove('collapsed')));
  } catch (e) { out(false, tag, 'the page loads with 200 rows', { error: String(e).slice(0, 160) }); await ctx.close(); continue; }
  const read = () => page.evaluate(() => {
    const tb = document.getElementById('ntRows'), all = document.getElementById('ntPrintAll');
    return { rows: [...tb.querySelectorAll('tr')].map(tr => tr.outerHTML + '|' + [...tr.querySelectorAll('input,button')].map(x => [x.value, x.placeholder, x.checked, x.indeterminate, x.disabled, x.hidden, x.title].join('~')).join('#')),
      note: document.getElementById('ntTrNote').textContent, all: [all.checked, all.indeterminate], extraRow: document.getElementById('ntExtraRow').hidden, table: document.getElementById('ntTable').className };
  });
  const fired = (kind) => page.evaluate((kind) => kind === 'boxes' ? [...document.querySelectorAll('#ntRows [data-print]')].map(b => b.checked ? 1 : 0).join('')
    : kind === 'settings' ? localStorage.getItem('hebrewNameTags_settings') : kind === 'table' ? document.getElementById('ntTable').className
    : [...document.querySelectorAll('#ntRows input[data-f="tr"]')].map(i => i.placeholder).join('|'), kind);
  for (const [name, sel, kind] of STEPS) {
    let r = {}, ok = false;
    try {
      const h = page.locator(sel).first();
      if (!(await h.count())) throw new Error('handle missing: ' + sel);
      await h.scrollIntoViewIfNeeded();
      const n = await page.evaluate(() => { const trs = [...document.querySelectorAll('#ntRows tr')]; trs.forEach((tr, k) => { tr.__probe = k + 1; }); return trs.length; });
      const before = await fired(kind);
      await h.click(); await page.waitForTimeout(400);
      const after = await fired(kind);
      r.kept = await page.evaluate(() => [...document.querySelectorAll('#ntRows tr')].filter(tr => tr.__probe).length); r.of = n;
      r.fired = before !== after;
      const inPlace = await read();
      await page.evaluate(() => ntRenderTable());
      const rebuilt = await read();
      const diff = Object.keys(rebuilt).filter(k => JSON.stringify(rebuilt[k]) !== JSON.stringify(inPlace[k]));
      r.sameAsRebuild = !diff.length; if (diff.length) r.differs = diff.concat(inPlace.rows.map((x, k) => x === rebuilt.rows[k] ? -1 : k).filter(k => k >= 0).slice(0, 3));
      ok = n >= 200 && r.kept === n && r.fired && r.sameAsRebuild;
    } catch (e) { r.error = String(e).slice(0, 160); }
    if (errors.length) { ok = false; r.errors = errors.slice(0, 3); }
    out(ok, tag, name + ': the rows update in place, as a rebuild would draw them', r);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every control in both cells');
process.exit(fail ? 1 : 0);
