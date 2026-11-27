#!/usr/bin/env node
// S684 — the shared class roster editor (js/ivrit-classes.js) marks, in its list of classes, the class its table shows.
// drawSide() ran before drawMain(), whose selected() falls back to the first class, and marked ed.classId as it was:
// opened with no class chosen (Flash Cards' "All classes", the dashboard and Name Tags with none active) the table
// showed the first class and the list marked none; the same after the shown class was deleted.
// Driven by real clicks on Flash Cards' Edit classes button: 3 classes; open with none chosen; open on the third; the
// third deleted from storage while the editor is open; EN / HE × light / dark. A cell passes when exactly one list
// button carries aria-current and it names the class in the table's name box.
//
//   node scripts/loop/probes/S684-class-editor-marks-the-class-it-shows.mjs   exit 1 on a wrong mark or a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S684 fails the cells opened
//   with no class chosen and the deleted class). --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
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
const browser = await chromium.launch();
const records = []; let errors = 0, fails = 0;
const mark = page => page.evaluate(() => {
  const cur = [...document.querySelectorAll('.ivc-class[aria-current="true"]')].map(b => b.querySelector('bdi').textContent);
  const nameBox = document.querySelector('.ivc-dialog [data-k="name"]');
  return { cur, shown: nameBox ? nameBox.value : null, listed: document.querySelectorAll('.ivc-class').length };
});
for (const lang of ['en', 'he']) for (const dark of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript(([lang, dark]) => {
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    localStorage.setItem('hebrewFlashCards_tourSeen', '1');
  }, [lang, dark]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/flash_cards.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.IvritClasses && typeof IvritClasses.addClass === 'function' && document.getElementById('fcEditClassesBtn'));
  const ids = await page.evaluate(() => ['Kitah Alef', 'Kitah Bet', 'Kitah Gimel'].map(n => IvritClasses.addClass(n, [{ he: 'דָּנִי', en: 'Dani' }])));
  if (ids.some(x => !x)) throw new Error('addClass returned no id');
  // The button lives in Teacher Tools; reveal it if it is folded, then press it for real.
  const press = async () => {
    const btn = page.locator('#fcEditClassesBtn');
    if (!(await btn.isVisible())) await page.evaluate(() => { let n = document.getElementById('fcEditClassesBtn'); while (n && n !== document.body) { if (n.hidden) n.hidden = false; if (n.tagName === 'DETAILS') n.open = true; n.classList.remove('collapsed'); if (getComputedStyle(n).display === 'none') n.style.display = 'block'; n = n.parentElement; } });
    await btn.click(); await page.waitForSelector('.ivc-dialog .ivc-class');
  };
  const close = () => page.evaluate(() => IvritClasses.closeEditor());
  const cells = [];
  await press(); cells.push(['opened with none chosen', await mark(page)]); await close();
  await page.evaluate(id => IvritClasses.openEditor({ classId: id }), ids[2]); await page.waitForSelector('.ivc-dialog .ivc-class');
  cells.push(['opened on the third', await mark(page)]);
  await page.evaluate(id => IvritClasses.deleteClass(id), ids[2]); await page.waitForTimeout(200);
  cells.push(['its class deleted', await mark(page)]); await close();
  for (const [name, m] of cells) {
    const ok = m.cur.length === 1 && m.cur[0] === m.shown && m.listed >= 2;
    if (!ok) fails++;
    records.push({ lang, dark, cell: name, ...m, ok });
    if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${lang} ${dark ? 'dark ' : 'light'} ${name.padEnd(24)} shows «${m.shown}» · marked [${m.cur.join(', ')}] of ${m.listed}`);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors }, null, 1));
const pass = !fails && !errors;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.length - fails}/${records.length} editor views mark the class they show; ${errors} page errors`);
process.exit(pass ? 0 : 1);
