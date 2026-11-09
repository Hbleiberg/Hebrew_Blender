#!/usr/bin/env node
// S634 (pass C on name_tags.html) — the class list's Print boxes (a checkbox per student and the header's, S623) showed
// no keyboard focus ring: the table's text-cell rule `.nt-table input:focus { outline:none; border…; box-shadow:inset… }`
// matched them too, and a native checkbox paints neither that border nor the inset shadow, so the page's own
// `:focus-visible` ring was switched off and nothing replaced it (12–20 changed pixels of 3,600 at 2×; a sidebar
// checkbox's ring changes ~770). The rule is now the text cells' only.
//
// Each box is focused by a real Tab from the control before it (so :focus-visible holds), and a clip 6px around it is
// compared unfocused vs focused, decoded in a blank page (no PNG library): the pixels that change outside the box's own
// rectangle are the ring (on HEAD a light cell's box only darkened its own edge — 264 of 3,600 pixels, all inside). Control: the sidebar's English-name checkbox
// (its ring must read too, or the measure is blind). Guard: a Hebrew-name cell keeps its own focus look (outline none,
// the inset shadow).
//
//   node scripts/loop/probes/S634-name-tags-print-box-shows-its-focus-ring.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S634 fails both Print boxes in every cell); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium, devices } = pkg;
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
const NAMES = [['דָּוִד', 'David'], ['שָׂרָה', 'Sarah'], ['יְהוּדָה', 'Yehuda'], ['רִבְקָה', 'Rivka'], ['מֹשֶׁה', 'Moshe']];
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 1280 }, { lang: 'he', dark: false, w: 800 }, { device: 'iPhone 13', lang: 'he', dark: false }];
const TARGETS = [['the header Print box', '#ntPrintAll', 'ring'], ['a student\'s Print box', '#ntRows tr:nth-child(2) [data-print]', 'ring'], ['control: the sidebar English-name box', '#ntOptEnglish', 'ring'], ['guard: a Hebrew-name cell', '#ntRows tr:nth-child(2) input[data-f="he"]', 'cell']];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
const decoder = await browser.newPage();
// changed pixels outside the control's own box (a ring paints there; a change of the box's own edge does not count)
const changed = (a, b, inset, dpr) => decoder.evaluate(async ([a, b, inset, dpr]) => {
  const dec = async (s) => { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })); const c = new OffscreenCanvas(bm.width, bm.height); const x = c.getContext('2d'); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height); };
  const A = await dec(a), B = await dec(b); let n = 0, inside = 0;
  const x0 = Math.floor(inset.x * dpr), y0 = Math.floor(inset.y * dpr), x1 = Math.ceil((inset.x + inset.w) * dpr), y1 = Math.ceil((inset.y + inset.h) * dpr);
  for (let i = 0; i < A.data.length; i += 4) {
    if (Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2])) <= 40) continue;
    const p = i / 4, x = p % A.width, y = Math.floor(p / A.width);
    if (x >= x0 && x < x1 && y >= y0 && y < y1) inside++; else n++;
  }
  return { outside: n, inside, of: A.width * A.height };
}, [a.toString('base64'), b.toString('base64'), inset, dpr]);
for (const cell of CELLS) {
  const tag = cell.device ? `${cell.device} ${cell.lang} ${cell.dark ? 'dark' : 'light'}` : `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctxOpts = cell.device ? { ...devices[cell.device] } : { viewport: { width: cell.w, height: 900 }, deviceScaleFactor: 2 };
  const ctx = await browser.newContext(Object.assign(ctxOpts, { serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' }));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: '' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B');
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, NAMES.map(([he, en]) => ({ he, en }))]);
  await page.goto(base + '/name_tags.html', { waitUntil: 'domcontentloaded' });
  try {
    await page.waitForFunction(() => window.I18n && document.querySelector('#ntRows [data-print]'));
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(400);
  } catch (e) { out(false, tag, 'the page loads with its Print boxes', { error: String(e).slice(0, 160) }); await ctx.close(); continue; }
  for (const [name, sel, kind] of TARGETS) {
    let r = null, ok = false;
    try {
      const h = page.locator(sel).first();
      if (!(await h.count())) throw new Error('handle missing: ' + sel);
      await h.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.mouse.move(1, 1); await page.waitForTimeout(100);
      const bb = await h.boundingBox(); const clip = { x: Math.max(bb.x - 6, 0), y: Math.max(bb.y - 6, 0), width: bb.width + 12, height: bb.height + 12 };
      const off = await page.screenshot({ clip });
      const prevOk = await page.evaluate((s) => { const n = document.querySelector(s); const all = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x => x.getClientRects().length && !x.disabled && x.tabIndex >= 0); const i = all.indexOf(n); if (i < 1) return false; all[i - 1].focus(); return true; }, sel);
      await page.keyboard.press('Tab'); await page.waitForTimeout(100);
      const st = await page.evaluate((s) => { const a = document.activeElement, n = document.querySelector(s), cs = getComputedStyle(n); return { focused: a === n, fv: n.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow }; }, sel);
      const on = await page.screenshot({ clip });
      const px = await changed(off, on, { x: bb.x - clip.x, y: bb.y - clip.y, w: bb.width, h: bb.height }, await page.evaluate(() => devicePixelRatio));
      r = { prevOk, ...st, ...px };
      ok = prevOk && st.focused && st.fv && (kind === 'ring' ? px.outside >= px.of * 0.1 : (st.outline.startsWith('none') && /inset/.test(st.shadow)));
    } catch (e) { r = Object.assign(r || {}, { error: String(e).slice(0, 160) }); }
    if (errors.length) { ok = false; r = Object.assign(r || {}, { errors }); }
    out(ok, tag, name + (kind === 'ring' ? ': focused by Tab, its ring paints' : ': keeps its own focus look'), r);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in all five cells');
process.exit(fail ? 1 : 0);
