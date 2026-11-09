#!/usr/bin/env node
// S637 (pass M on name_tags.html) — in dark mode the class list's rows ran together: its row rules and a name cell's
// hover border were drawn in --warm-gray, which the dark palette sets to #1e2535, the table's own --white. Light drew
// a rule under every row (#e8e0d0 on white, 1.27:1); dark drew none, and hovering a name changed nothing. Dark now
// takes --border for both; a focused cell keeps its ring under the mouse, and light is unchanged.
//
// EN light 1280, EN dark 1280, HE dark 800, HE light 800; 6 students. (1) the computed rule under rows 1–5 against the
// table's ground: ≥ 1.1:1 (light exactly #e8e0d0); (2) painted: a screenshot of the table read down one column of
// the grip cells counts the lines the rows draw — ≥ 6 (the header's and five rows'; the blank row ends the table);
// (3) the real mouse over row 2's English cell: its border ≥ 1.1:1 against the row (light #e8e0d0); (4) clicked, then
// hovered: the border is the focus-ring colour (the dark hover rule must not outrank the focus look). 0 page errors.
//
//   node scripts/loop/probes/S637-name-tags-dark-class-list-keeps-its-row-lines.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S637 fails (1)–(3) in both dark cells); --json prints the record.
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
const LIGHT_RULE = 'rgb(232, 224, 208)';
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
// in the page: a colour's contrast against the table's ground (the wrap's background; the cells and rows are transparent)
const RATIO = ([sel, prop]) => {
  const p = (s) => s.match(/[\d.]+/g).map(Number);
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const e = document.querySelector(sel), w = document.querySelector('.nt-table-wrap'); if (!e || !w) return null;
  const c = getComputedStyle(e)[prop], g = getComputedStyle(w).backgroundColor, a = p(c), b = p(g);
  const alpha = a.length > 3 ? a[3] : 1, mix = [0, 1, 2].map(i => a[i] * alpha + b[i] * (1 - alpha));
  const x = lum(mix), y = lum(b);
  return { colour: c, ground: g, ratio: +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) };
};
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: '' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B');
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, ROWS]);
  try {
    await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('#ntRows tr').length === 7); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(500);
    const isDark = await page.evaluate(() => document.body.classList.contains('dark'));
    if (isDark !== cell.dark) throw new Error('theme not applied');
    await page.mouse.move(2, 2);
    // (1) the computed rule under each of rows 1–5
    const rules = [];
    for (let i = 1; i <= 5; i++) rules.push(await page.evaluate(RATIO, [`#ntRows tr:nth-child(${i}) td:nth-child(5)`, 'borderBottomColor']));
    if (rules.some(r => !r)) throw new Error('handle missing: a row cell or .nt-table-wrap');
    const minR = Math.min(...rules.map(r => r.ratio));
    out(cell.dark ? minR >= 1.1 : rules.every(r => r.colour === LIGHT_RULE), tag, '(1) a rule under every row', { min: minR, colour: rules[0].colour, ground: rules[0].ground });
    // (2) painted: the lines down one column of the grip cells (no glyph there: the cell's inline-end edge, 3px in)
    const box = await page.locator('.nt-table-wrap').boundingBox(), grip = await page.locator('#ntRows tr:nth-child(1) .nt-grip').boundingBox();
    if (!box || !grip) throw new Error('handle missing: .nt-table-wrap / .nt-grip');
    const png = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
    const lines = await page.evaluate(async ([b64, x]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const c = cv.getContext('2d'); c.drawImage(img, 0, 0);
      const d = c.getImageData(Math.round(x), 0, 1, img.height).data, bg = [d[4 * 4], d[4 * 4 + 1], d[4 * 4 + 2]];
      let n = 0, on = false;
      for (let y = 4; y < img.height - 4; y++) { const diff = Math.abs(d[4 * y] - bg[0]) + Math.abs(d[4 * y + 1] - bg[1]) + Math.abs(d[4 * y + 2] - bg[2]); if (diff > 12 && !on) { n++; on = true; } else if (diff <= 12) on = false; }
      return n;
    }, [png.toString('base64'), (cell.lang === 'he' ? grip.x - box.x + 3 : grip.x + grip.width - box.x - 3)]);
    out(lines >= 6, tag, '(2) the lines the rows paint', { lines });
    // (3) the real mouse over row 2's English cell
    const en = page.locator('#ntRows tr:nth-child(2) input[data-f="en"]');
    await en.hover(); await page.waitForTimeout(150);
    const hv = await page.evaluate(RATIO, ['#ntRows tr:nth-child(2) input[data-f="en"]', 'borderTopColor']);
    out(cell.dark ? hv.ratio >= 1.1 : hv.colour === LIGHT_RULE, tag, '(3) a hovered name cell shows its border', hv);
    // (4) clicked, still under the mouse: the focus ring's colour, not the hover's
    await en.click(); await page.waitForTimeout(150);
    const fr = await page.evaluate(() => { const e = document.querySelector('#ntRows tr:nth-child(2) input[data-f="en"]'); return { focused: document.activeElement === e, border: getComputedStyle(e).borderTopColor, ring: getComputedStyle(document.body).getPropertyValue('--focus-ring').trim() }; });
    const ringRgb = await page.evaluate((v) => { const s = document.createElement('span'); s.style.color = v; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; }, fr.ring);
    out(fr.focused && fr.border === ringRgb, tag, '(4) focused under the mouse: the ring colour', { ...fr, ringRgb });
    out(errors.length === 0, tag, '0 page errors', errors.slice(0, 2));
  } catch (e) { out(false, tag, 'ran', String(e).slice(0, 200)); }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL — ${fail} step(s)` : 'PASS');
process.exit(fail ? 1 : 0);
