#!/usr/bin/env node
// S636 (pass G on name_tags.html) — with every student on the list unticked for print, the preview showed the sample
// as "A sample — type a name to see your own tags", Print's note said "Add a student to the list first — the sample
// tags do not print." and, unticked one by one, the note kept the last "Printing 1 of 6 students": all three false (the
// list has six students). The preview now says nothing beside the sample and the note (and a Print press) says
// "No student is ticked to print"; an empty list keeps its own two messages.
//
// EN light 1280 and HE dark 800, 6 students, by real clicks (Print, aria-disabled, by a mouse click at its centre;
// window.print counted): (1) unticked one by one to none: the note is the none-ticked sentence, the tags line empty,
// Print aria-disabled; (2) a Print press: the same note, print() not called; (3) the header box on: 6 tags, the note
// empty; off: the none-ticked note; (4) one unticked: "Printing 5 of 6" (unchanged); (5) every student unticked, then
// removed one by one: the note empties when the list does, and a Print press says "Add a student…"; (6) a fresh empty
// list: the sample line and a Print press's "Add a student…" (the control: the messages the fix keeps). 0 page errors.
//
//   node scripts/loop/probes/S636-name-tags-nobody-ticked-says-so.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S636 fails (1)–(3) in both cells); --json prints the record.
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
const MSG = { en: { none: 'No student is ticked to print', empty: 'Add a student to the list first', sample: 'A sample', some: 'Printing 5 of 6' },
  he: { none: 'אף תלמיד לא מסומן להדפסה', empty: 'הוסיפו קודם תלמיד לרשימה', sample: 'דוגמה', some: 'מדפיסים 5 מתוך 6' } };
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
for (const cell of CELLS) for (const empty of [false, true]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}${empty ? ' (empty list)' : ''}`, M = MSG[cell.lang];
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    window.__prints = 0; window.print = () => { window.__prints++; };
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    if (rows) { localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: '' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B'); }
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, empty ? null : ROWS]);
  const st = () => page.evaluate(() => { const n = document.getElementById('ntPrintNote'), t = document.getElementById('ntPrevTags'), b = document.getElementById('ntPrintBtn');
    return n && t && b ? { note: n.textContent, tags: t.textContent, disabled: b.getAttribute('aria-disabled'), prints: window.__prints, rows: document.querySelectorAll('#ntRows [data-print]').length } : null; });
  const press = async () => { const bb = await page.locator('#ntPrintBtn').boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(200); };
  try {
    await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelector('#ntRows tr')); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600);
    if (!(await st())) throw new Error('handle missing: #ntPrintNote / #ntPrevTags / #ntPrintBtn');
    if (empty) {
      const a = await st(); await press(); const b = await st();
      out(a.tags.startsWith(M.sample) && a.note === '' && b.note.startsWith(M.empty) && b.prints === 0, tag, 'an empty list keeps the sample line and "Add a student…"', { a, b });
    } else {
      for (let k = 1; k <= 6; k++) { await page.locator(`#ntRows tr:nth-child(${k}) [data-print]`).click(); await page.waitForTimeout(120); }
      const a = await st();
      out(a.note.startsWith(M.none) && a.tags === '' && a.disabled === 'true', tag, 'unticked one by one to none: the note says nobody is ticked', a);
      await press(); const b = await st();
      out(b.note.startsWith(M.none) && b.prints === 0, tag, 'Print with nobody ticked says so and prints nothing', b);
      await page.locator('#ntPrintAll').click(); await page.waitForTimeout(150); const c = await st();
      await page.locator('#ntPrintAll').click(); await page.waitForTimeout(150); const d = await st();
      out(c.note === '' && /6/.test(c.tags) && d.note.startsWith(M.none) && d.tags === '', tag, 'the header box: on prints all, off says nobody is ticked', { on: c, off: d });
      await page.locator('#ntPrintAll').click(); await page.waitForTimeout(150);
      await page.locator('#ntRows tr:nth-child(2) [data-print]').click(); await page.waitForTimeout(150); const e = await st();
      out(e.note.startsWith(M.some), tag, 'one unticked: "Printing 5 of 6" as before', e);
      await page.locator('#ntPrintAll').click(); await page.waitForTimeout(100); await page.locator('#ntPrintAll').click(); await page.waitForTimeout(150);   // mixed → all on → all off
      const f0 = await st();
      for (let k = 0; k < 6; k++) { await page.locator('#ntRows tr:first-child [data-del]').click(); await page.waitForTimeout(150); }
      const f = await st(); await press(); const g = await st();
      out(f0.note.startsWith(M.none) && f.rows <= 1 && f.note === '' && f.tags.startsWith(M.sample) && g.note.startsWith(M.empty), tag, 'nobody ticked, then every student removed: the empty list\'s messages', { before: f0, emptied: f, pressed: g });
    }
  } catch (e) { out(false, tag, 'the steps ran', { error: String(e).slice(0, 200) }); }
  if (errors.length) out(false, tag, 'no page errors', errors.slice(0, 3));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
