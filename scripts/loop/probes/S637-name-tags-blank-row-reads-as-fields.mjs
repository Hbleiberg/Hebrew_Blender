#!/usr/bin/env node
// S637 (pass M on name_tags.html) — the class list's blank last row is where the next student is typed, but its only
// cue was a 5% gold tint (1.03:1) and its name fields drew no edge until hovered, so an empty list — a first visit's
// "My class" — showed its headings over a blank band and no place to type. The blank row's name fields now show at
// rest the edge a hovered cell shows (#e8e0d0 in light, --border in dark); the student rows still read as text.
//
// EN light 1280, EN dark 1280, HE dark 800, HE light 800; an empty list and a 3-student list. (1) the blank row's
// Hebrew, transliteration and English fields at rest: each border ≥ 1.1:1 against the table's ground; (2) the student
// rows' name fields at rest: transparent (unchanged); (3) the blank Hebrew field clicked: the focus-ring colour; (4) a
// name typed into it: that row becomes a student row (its fields transparent again, the mouse moved away) and a new
// blank row draws its edges. 0 page errors.
//
//   node scripts/loop/probes/S637-name-tags-blank-row-reads-as-fields.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S637 fails (1) and (4) in every cell); --json prints the record.
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
const ROWS = [['דָּוִד', 'David'], ['שָׂרָה', 'Sarah'], ['יְהוּדָה', 'Yehuda'], ['רִבְקָה', 'Rivka'], ['מֹשֶׁה', 'Moshe'], ['לֵאָה', 'Leah']].map(([he, en]) => ({ he, en }));
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'en', dark: true, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'he', dark: false, w: 800 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
// in the page: each name field's border colour against the table's ground, for the blank row or a student row
const EDGES = (rowSel) => {
  const p = (s) => s.match(/[\d.]+/g).map(Number);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const w = document.querySelector('.nt-table-wrap'), tr = document.querySelector(rowSel); if (!w || !tr) return null;
  const b = p(getComputedStyle(w).backgroundColor);
  return ['he', 'tr', 'en'].map(f => {
    const e = tr.querySelector(`input[data-f="${f}"]`); if (!e) return { f, missing: true };
    const c = getComputedStyle(e).borderTopColor, a = p(c), al = a.length > 3 ? a[3] : 1, mix = [0, 1, 2].map(i => a[i] * al + b[i] * (1 - al));
    const x = lum(mix), y = lum(b);
    return { f, colour: c, ratio: +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) };
  });
};
for (const cell of CELLS) for (const n of [0, 3]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} (${n ? n + ' students' : 'empty list'})`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    if (rows.length) { localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: '' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B'); }
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, ROWS.slice(0, n)]);
  try {
    await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' });
    await page.waitForFunction((k) => window.I18n && document.querySelectorAll('#ntRows tr').length === k, n + 1); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(500);
    if (await page.evaluate(() => document.body.classList.contains('dark')) !== cell.dark) throw new Error('theme not applied');
    await page.mouse.move(2, 2); await page.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
    const blank = await page.evaluate(EDGES, '#ntRows tr.nt-new');
    if (!blank || blank.some(x => x.missing)) throw new Error('handle missing: the blank row or a name field');
    out(blank.every(x => x.ratio >= 1.1), tag, '(1) the blank row\'s fields show their edge', blank.map(x => x.ratio));
    if (n) {
      const st = await page.evaluate(EDGES, '#ntRows tr:nth-child(1)');
      out(st.every(x => x.ratio === 1), tag, '(2) a student row still reads as text', st.map(x => x.colour));
    }
    const he = page.locator('#ntRows tr.nt-new input[data-f="he"]');
    await he.click(); await page.waitForTimeout(150);
    const fr = await page.evaluate(() => { const e = document.querySelector('#ntRows tr.nt-new input[data-f="he"]'); const s = document.createElement('span'); s.style.color = getComputedStyle(document.body).getPropertyValue('--focus-ring').trim(); document.body.appendChild(s); const ring = getComputedStyle(s).color; s.remove(); return { focused: document.activeElement === e, border: e && getComputedStyle(e).borderTopColor, ring }; });
    out(fr.focused && fr.border === fr.ring, tag, '(3) the clicked blank field shows the focus ring', fr);
    await page.keyboard.type('נועה', { delay: 20 }); await page.waitForTimeout(400);
    await page.mouse.move(2, 2); await page.locator('#ntListToggle').focus(); await page.waitForTimeout(300);
    const after = await page.evaluate(([k, sel]) => ({ rows: document.querySelectorAll('#ntRows tr').length, typed: (() => { const tr = document.querySelector(`#ntRows tr:nth-child(${k})`); return tr && !tr.classList.contains('nt-new') && tr.querySelector('input[data-f="he"]').value; })() }), [n + 1]);
    const typedRow = await page.evaluate(EDGES, `#ntRows tr:nth-child(${n + 1})`), next = await page.evaluate(EDGES, '#ntRows tr.nt-new');
    out(after.rows === n + 2 && after.typed === 'נועה' && typedRow.every(x => x.ratio === 1) && next && next.every(x => x.ratio >= 1.1), tag,
      '(4) a typed name becomes a student row; the next blank row shows its edges', { ...after, typedRow: typedRow.map(x => x.ratio), next: next && next.map(x => x.ratio) });
    out(errors.length === 0, tag, '0 page errors', errors.slice(0, 2));
  } catch (e) { out(false, tag, 'ran', String(e).slice(0, 200)); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL — ${fail} step(s)` : 'PASS');
process.exit(fail ? 1 : 0);
