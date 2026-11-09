#!/usr/bin/env node
// S635 (pass D on name_tags.html) — moving a student (a grip's ↑/↓, or a drag of the grip) rebuilt all of the class
// list's rows, though a move changes only the places from one end to the other: on a 200-student list each ↑/↓ press
// was a 413–536 ms task at 4× CPU (three presses 1.6–2.1 s), and a drag's drop 418–455 ms. Only the rows between the
// two ends are drawn again now; a drag that ends where it started, or is cancelled, is still put back by a full rebuild.
//
// A 200-student list (one row unticked for print) in EN light 1280 and HE dark 800, by real keys and a real mouse:
// ↓ ×3 on row 2, ↑ ×2 on row 100, a drag of row 20 down six places from mid-window, a drag held at the window's bottom
// edge (the page scrolls under it), a drag out and back, a drag cancelled by Escape. Before each step every <tr> is
// tagged; after it: (1) the rows outside the changed places are the same nodes and the rows inside are new (a move) —
// the changed places read from the store before and after; (2) the rows' order, their indices and numbers equal the
// store; (3) the table equals a full rebuild's (rows' markup and controls' properties, read, `ntRenderTable()`, read
// again); (4) focus is on the moved row's grip and the announcement names its place; (5) a cancelled or put-back drag
// leaves the order as it was.
//
//   node scripts/loop/probes/S635-name-tags-a-move-redraws-only-its-rows.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree before
//   S635 fails (1) on every move in both cells); --json prints the record.
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
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
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
    await page.waitForFunction(() => window.I18n && document.querySelectorAll('#ntRows tr').length >= 200);
    await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(1500);
    const b = page.locator('#ntRows tr:nth-child(3) [data-print]'); await b.scrollIntoViewIfNeeded(); await b.click(); await page.waitForTimeout(200);
  } catch (e) { out(false, tag, 'the page loads with 200 rows', { error: String(e).slice(0, 160) }); await ctx.close(); continue; }
  const order = () => page.evaluate(() => JSON.parse(localStorage.getItem('hebrewNameTags_lists'))['Class 3B'].rows.map(r => r.en));
  const read = () => page.evaluate(() => [...document.querySelectorAll('#ntRows tr')].map(tr => tr.outerHTML + '|' + [...tr.querySelectorAll('input,button')].map(x => [x.value, x.placeholder, x.checked, x.indeterminate, x.disabled, x.hidden, x.title].join('~')).join('#')));
  const grip = (k) => page.locator(`#ntRows tr:nth-child(${k}) [data-move]`);
  const keys = async (k, key, times) => { const g = grip(k); await g.scrollIntoViewIfNeeded(); await g.focus(); for (let i = 0; i < times; i++) { await page.keyboard.press(key); await page.waitForTimeout(120); } };
  const drag = async (k, by, o = {}) => {
    const g = grip(k); await g.scrollIntoViewIfNeeded();
    await page.evaluate(([k, at]) => { const r = document.querySelector('#ntRows tr:nth-child(' + k + ') [data-move]').getBoundingClientRect(); window.scrollBy(0, r.top - innerHeight * at); }, [k, o.at || 0.3]); await page.waitForTimeout(100);
    const bb = await g.boundingBox(), rh = await page.evaluate(() => document.querySelector('#ntRows tr').getBoundingClientRect().height);
    const x = bb.x + bb.width / 2, y = bb.y + bb.height / 2; await page.mouse.move(x, y); await page.mouse.down();
    const to = o.edge ? 900 - 20 - y : by * rh, n = 18;
    for (let i = 1; i <= n; i++) { await page.mouse.move(x, y + to * i / n); await page.waitForTimeout(16); }
    if (o.edge) await page.waitForTimeout(o.edge);
    if (o.back) for (let i = n - 1; i >= 0; i--) { await page.mouse.move(x, y + to * i / n); await page.waitForTimeout(16); }
    if (o.esc) await page.keyboard.press('Escape');
    await page.mouse.up();
  };
  const STEPS = [
    ['row 2 ↓ ×3 (the unticked row among them)', () => keys(2, 'ArrowDown', 3), 'move'],
    ['row 100 ↑ ×2', () => keys(100, 'ArrowUp', 2), 'move'],
    ['row 20 dragged down six places', () => drag(20, 6), 'move'],
    ['row 30 dragged to the window\'s edge (the page scrolls under it)', () => drag(30, 0, { at: 0.5, edge: 600 }), 'move'],
    ['row 40 dragged out and back', () => drag(40, 5, { back: true }), 'same'],
    ['row 50 dragged, then Escape', () => drag(50, 4, { esc: true }), 'same'],
  ];
  for (const [name, fn, kind] of STEPS) {
    let r = {}, ok = false;
    try {
      const before = await order();
      const n = await page.evaluate(() => { const trs = [...document.querySelectorAll('#ntRows tr')]; trs.forEach((tr, k) => { tr.__probe = k + 1; }); return trs.length; });
      await fn(); await page.waitForTimeout(500);
      const after = await order();
      let lo = 0, hi = -1; for (let i = 0; i < after.length; i++) if (after[i] !== before[i]) { if (hi < 0) lo = i; hi = i; }
      r.changed = hi < 0 ? 0 : hi - lo + 1;
      const st = await page.evaluate(([lo, hi]) => {
        const trs = [...document.querySelectorAll('#ntRows tr')], rows = JSON.parse(localStorage.getItem('hebrewNameTags_lists'))['Class 3B'].rows;
        const inOrder = trs.length === rows.length && trs.every((tr, i) => tr.querySelector('input[data-f="en"]').value === rows[i].en && tr.querySelector('input[data-f="he"]').dataset.r === String(i) && tr.querySelector('[data-move]').dataset.move === String(i) && tr.querySelector('.nt-num').textContent === String(i + 1));
        const keptOut = trs.filter((tr, i) => (i < lo || i > hi) && tr.__probe).length, keptIn = trs.filter((tr, i) => i >= lo && i <= hi && tr.__probe).length;
        const a = document.activeElement, said = document.getElementById('a11yStatus').textContent;
        return { inOrder, keptOut, keptIn, focus: a && a.dataset ? a.dataset.move : null, said, carrying: document.body.classList.contains('nt-carrying') || !!document.querySelector('.nt-dragging') };
      }, [lo, hi]);
      Object.assign(r, st);
      const inPlace = await read(); await page.evaluate(() => ntRenderTable()); const rebuilt = await read();
      r.sameAsRebuild = inPlace.length === rebuilt.length && inPlace.every((x, k) => x === rebuilt[k]);
      if (kind === 'move') {
        const place = Number((st.said.match(/(\d+)\D+\d+\D*$/) || [])[1]);
        r.place = place;
        ok = r.changed >= 2 && st.inOrder && st.keptOut === n - r.changed && st.keptIn === 0 && r.sameAsRebuild && st.focus === String(place - 1) && !st.carrying;
      } else ok = r.changed === 0 && st.inOrder && r.sameAsRebuild && !st.carrying;
    } catch (e) { r.error = String(e).slice(0, 160); }
    if (errors.length) { ok = false; r.errors = errors.slice(0, 3); }
    out(ok, tag, name + (kind === 'move' ? ': only the changed places are drawn again' : ': the order stays as it was'), r);
  }
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every move in both cells');
process.exit(fail ? 1 : 0);
