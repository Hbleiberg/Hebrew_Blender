#!/usr/bin/env node
// S636 (pass G on name_tags.html) — a ticked student whose tag would carry no line under "On each tag" (an English
// name alone with "Show the English name" off; an extra line alone with the extra line off) dropped out of the preview
// and the print without a word: 5 students, 2 of them English-only → "3 tags", and with one unticked "Printing 2 of 3
// students" for a list of 5; a list of English-only students showed the sample as "type a name" and Print said "Add a
// student to the list first". The note under Print now counts them (`nametags.preview.no_line`), the "of" counts the
// whole list, and the sample stands without "type a name".
//
// EN light 1280 and HE dark 800, by real clicks (Print, aria-disabled, by a mouse click at its centre; window.print
// counted): (1) 5 students, 2 English-only, the English name turned off: 3 tags and the two-student note; (2) one more
// unticked: "Printing 2 of 5" + the note; (3) the English name back on: 5 tags, no note; (4) a list of 2 English-only
// students, English off: the sample with no count, the note, a Print press the same and no print(); (5) one
// English-only student: the singular; (6) a row holding only an extra line, the extra line off: the singular, on: no
// note; (7) an empty list: the sample line and "Add a student…" (the control: the messages the fix keeps). 0 errors.
//
//   node scripts/loop/probes/S636-name-tags-a-student-with-no-line-is-named.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S636 fails (1), (2), (4), (5) and (6) in both cells); --json prints the record.
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
const MIXED = [{ he: 'דָּוִד', en: 'David' }, { he: 'שָׂרָה', en: 'Sarah' }, { he: '', en: 'Sam Smith' }, { he: '', en: 'Mia Jones' }, { he: 'רִבְקָה', en: 'Rivka' }];
const M = { en: { two: '2 students have nothing to print', one: 'One student has nothing to print', some: 'Printing 2 of 5', empty: 'Add a student to the list first', sample: 'A sample' },
  he: { two: 'ל־2 תלמידים אין מה להדפיס', one: 'לתלמיד אחד אין מה להדפיס', some: 'מדפיסים 2 מתוך 5', empty: 'הוסיפו קודם תלמיד לרשימה', sample: 'דוגמה' } };
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const SCEN = [['mixed', MIXED], ['english-only', [{ he: '', en: 'Sam Smith' }, { he: '', en: 'Mia Jones' }]], ['one', [{ he: 'דָּוִד', en: 'David' }, { he: '', en: 'Sam Smith' }]],
  ['extra-only', [{ he: 'דָּוִד', en: 'David' }, { he: '', en: '', ex: 'Room 12' }]], ['empty', null]];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
for (const cell of CELLS) for (const [scen, rows] of SCEN) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} [${scen}]`, T = M[cell.lang];
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([lang, dark, rows]) => {
    window.__prints = 0; window.print = () => { window.__prints++; };
    if (sessionStorage.getItem('seeded')) return;
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewNameTags_tourSeen', '1');
    if (rows) { localStorage.setItem('hebrewNameTags_lists', JSON.stringify({ 'Class 3B': { v: 1, rows, extra: '' } })); localStorage.setItem('hebrewNameTags_activeList', 'Class 3B'); }
    sessionStorage.setItem('seeded', '1');
  }, [cell.lang, cell.dark, rows]);
  const st = () => page.evaluate(() => { const n = document.getElementById('ntPrintNote'), t = document.getElementById('ntPrevTags'), b = document.getElementById('ntPrintBtn');
    return n && t && b ? { note: n.textContent, tags: t.textContent, disabled: b.getAttribute('aria-disabled'), prints: window.__prints, sheets: document.querySelectorAll('#ntPreview .nt-frame:not(.nt-sample)').length } : null; });
  const press = async () => { const bb = await page.locator('#ntPrintBtn').boundingBox(); await page.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(200); };
  const toggle = async (id) => { await page.evaluate((id) => { const pl = document.getElementById(id).closest('.panel'); if (pl && pl.classList.contains('collapsed')) pl.querySelector('.panel-title').click(); }, id); const c = page.locator('#' + id); await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(250); };
  try {
    await page.goto(BASE + '/name_tags.html', { waitUntil: 'load' });
    await page.waitForFunction(() => window.I18n && document.querySelector('#ntRows tr')); await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600);
    if (!(await st())) throw new Error('handle missing: #ntPrintNote / #ntPrevTags / #ntPrintBtn');
    if (scen === 'mixed') {
      await toggle('ntOptEnglish'); const a = await st();
      out(/3/.test(a.tags) && a.note.startsWith(T.two), tag, 'English off: 3 tags and the two English-only students counted', a);
      await page.locator('#ntRows tr:nth-child(1) [data-print]').click(); await page.waitForTimeout(200); const b = await st();
      out(b.note.startsWith(T.some) && b.note.includes(T.two), tag, 'one more unticked: "2 of 5" and the note', b);
      await page.locator('#ntRows tr:nth-child(1) [data-print]').click(); await page.waitForTimeout(100);
      await toggle('ntOptEnglish'); const c = await st();
      out(/5/.test(c.tags) && c.note === '', tag, 'the English name back on: 5 tags, no note', c);
    } else if (scen === 'english-only') {
      await toggle('ntOptEnglish'); const a = await st(); await press(); const b = await st();
      out(a.tags === '' && a.disabled === 'true' && a.note.startsWith(T.two) && b.note.startsWith(T.two) && b.prints === 0, tag, 'nothing to print: the sample with no count, the note, Print says the same', { a, b });
    } else if (scen === 'one') {
      await toggle('ntOptEnglish'); const a = await st();
      out(a.note.startsWith(T.one) && a.sheets === 1, tag, 'one English-only student: the singular', a);
    } else if (scen === 'extra-only') {
      const a = await st(); await toggle('ntOptExtra'); const b = await st();
      out(a.note.startsWith(T.one) && b.note === '' && /2/.test(b.tags), tag, 'a row with only an extra line: counted while the extra line is off', { off: a, on: b });
    } else {
      const a = await st(); await press(); const b = await st();
      out(a.tags.startsWith(T.sample) && a.note === '' && b.note.startsWith(T.empty) && b.prints === 0, tag, 'an empty list keeps the sample line and "Add a student…"', { a, b });
    }
  } catch (e) { out(false, tag, 'the steps ran', { error: String(e).slice(0, 200) }); }
  if (errors.length) out(false, tag, 'no page errors', errors.slice(0, 3));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in both cells');
process.exit(fail ? 1 : 0);
