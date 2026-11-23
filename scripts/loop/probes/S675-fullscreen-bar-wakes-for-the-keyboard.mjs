#!/usr/bin/env node
// S675 (pass C on the Tefillah Trainer) — a fullscreen bar that hides itself took the keyboard's focus unseen. The Tefillah
// and the Torah Trainer's presentation bar (#ttFsBar) and the Classroom Dashboard's quick-controls strip (#fsStrip) fade
// after four idle seconds and come back on pointer activity only: Tab then walked onto their buttons at opacity 0, and a
// bar a key had just used faded again with the focus still resting on it. The bar now shows when the keyboard's focus
// enters it and stays while it rests there; a pointer's press still lets it fade.
//
//   node scripts/loop/probes/S675-fullscreen-bar-wakes-for-the-keyboard.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S675 fails every cell).
//
// Three pages × EN / HE, fullscreen entered by a click on the header's button: the bar has faded after 4.7 s; Tab reaches
// one of its buttons and the bar is back (opacity 1); 4.7 s resting there it is still up; Enter twice on a button
// (the Dashboard's opens a popup and closes it) and 4.7 s more, still up; the focus moved out of the bar by Shift+Tab, it fades again;
// a pointer's press on a bar button, the pointer taken off the bar, still lets it fade. No page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const IDLE = 4700;
// [page, the bar, a bar button a key may press without leaving the page as it is, storage that keeps first-run cards away]
const PAGES = [
  ['tefillah_trainer.html', '#ttFsBar', '#ttFsSizeUp', { hebrewTefillahTrainer_tourSeen: '1' }],
  ['torah_trainer.html', '#ttFsBar', '#ttFsSizeUp', { hebrewTorahTrainer_tourSeen: '1' }],
  ['classroom_dashboard.html', '#fsStrip', '#fsTimerBtn', { hebrewDashboard_tourSeen: '1', hebrewDashboard_setupSeen: '1' }],
];
const browser = await chromium.launch(); const records = [];
for (const [file, barSel, pressSel, store] of PAGES) for (const lang of ['en', 'he']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); for (const k in c.store) localStorage.setItem(k, c.store[k]); } }, { lang, store });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const rec = { cell: `${file.replace('.html', '')} ${lang}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const bar = () => page.evaluate(s => { const b = document.querySelector(s), a = document.activeElement; const inBar = !!a && b.contains(a); let hit = false; if (inBar) { const r = a.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); hit = !!t && (a.contains(t) || t.contains(a)); } return { opacity: +getComputedStyle(b).opacity, inBar, hit, who: a ? a.id || a.tagName : '' }; }, barSel);
  try {
    await page.goto(`${BASE}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
    await page.mouse.move(400, 300);
    await page.click('#fsBtn'); await page.waitForTimeout(600);
    need(await page.evaluate(() => document.body.classList.contains('fullscreen')), 'fullscreen did not start');
    const shown = await bar(); need(shown.opacity > 0.99, `the bar is not up on entering (opacity ${shown.opacity})`);
    await page.waitForTimeout(IDLE);
    const faded = await bar(); need(faded.opacity < 0.01, `the bar did not fade when idle (opacity ${faded.opacity})`);
    // the keyboard walks in
    let reached = false; for (let i = 0; i < 14 && !reached; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(60); reached = (await bar()).inBar; }
    await page.waitForTimeout(500);
    const inA = await bar(); rec.afterTab = inA.opacity;
    need(reached, 'Tab never reached the bar'); need(inA.opacity > 0.99, `Tab onto ${inA.who}: the bar's opacity ${inA.opacity}`);
    await page.waitForTimeout(IDLE);
    const inB = await bar(); rec.resting = inB.opacity; need(inB.inBar && inB.opacity > 0.99, `resting on ${inB.who} for ${IDLE} ms: opacity ${inB.opacity}`);
    // a key uses a button (twice: the Dashboard's opens a popup and closes it), and the bar stays under the focus
    await page.focus(pressSel); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); await page.waitForTimeout(100);
    need(await page.evaluate(s => document.activeElement === document.querySelector(s), pressSel), `the keyboard did not land on ${pressSel}`);
    await page.keyboard.press('Enter'); await page.waitForTimeout(250); await page.keyboard.press('Enter');
    await page.waitForTimeout(IDLE);
    const inC = await bar(); rec.afterKey = inC.opacity; need(inC.inBar && inC.opacity > 0.99, `after Enter on ${pressSel} and ${IDLE} ms: in the bar ${inC.inBar}, opacity ${inC.opacity}`);
    // the focus leaves: the bar may fade again
    for (let i = 0; i < 14 && (await bar()).inBar; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(60); }
    await page.waitForTimeout(IDLE + 400);
    const out = await bar(); rec.left = out.opacity; need(!out.inBar && out.opacity < 0.01, `the focus left (${out.who}) and the bar stayed (opacity ${out.opacity})`);
    // a pointer's press does not pin it
    await page.mouse.move(420, 320); await page.waitForTimeout(300);
    const box = await page.locator(pressSel).boundingBox(); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(250); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(200); need((await bar()).opacity > 0.99, 'the bar is not up under the pointer');
    await page.mouse.move(420, 320); await page.waitForTimeout(IDLE + 600);
    const ptr = await bar(); rec.pointer = ptr.opacity; need(ptr.opacity < 0.01, `after a pointer's press and ${IDLE} ms the bar is still up (opacity ${ptr.opacity}, focus ${ptr.who})`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(24)} after Tab ${r.afterTab}, resting ${r.resting}, after a key ${r.afterKey}, focus gone ${r.left}, after a pointer's press ${r.pointer}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const bad = records.filter(r => !r.ok);
console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
