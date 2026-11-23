#!/usr/bin/env node
// S675 (the S645 C finding) — Flash Cards' listening round by keyboard. A tile picked with Tab + Enter is disabled under
// its own focus, which fell to <body> and stayed there through the auto-advance: every card cost a walk back from the top
// of the page. The speaker now takes the focus when a focused tile is picked: each card starts silent, so the speaker is
// the next card's first press, and a round runs on Enter, Tab, Enter.
//
//   node scripts/loop/probes/S675-flash-listening-pick-keeps-the-keyboard.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S675 fails every cell).
//
// EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a listening round with a recording stub for the voice: Tab
// to the speaker, then three cards answered by Enter (the speaker), Tab (the first tile), Enter — after each pick the
// focus is on the speaker at once and still there once the next card has come, its ring showing; the speaker spoke once
// per card. Guards: a pick by the digit key 1 leaves the focus where it was (the speaker); a pick by the pointer shows no
// focus ring on the speaker. No page error.
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
const browser = await chromium.launch(); const records = [];
for (const [lang, dark, w] of [['en', false, 1280], ['he', true, 800], ['en', true, 800], ['he', false, 1280]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => {
    if (!sessionStorage.getItem('__s')) { sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFlashCards_tourSeen', '1'); localStorage.setItem('hebrewFlashCards_settings', JSON.stringify({ listening: true })); }
    window.__spoken = 0; window.SpeechSynthesisUtterance = function (text) { this.text = text; };
    const v = { lang: 'he-IL', name: 'Probe Hebrew', voiceURI: 'probe-he', localService: true, default: false };
    try { speechSynthesis.getVoices = () => [v]; speechSynthesis.speak = () => { window.__spoken++; }; speechSynthesis.cancel = () => {}; } catch (e) {}
  }, [lang, dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  const rec = { cell: `${lang} ${dark ? 'dark' : 'light'} ${w}`, notes: [], after: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  const at = () => page.evaluate(() => { const a = document.activeElement; return { id: !a || a === document.body ? 'BODY' : (a.id || a.className || a.tagName), fv: !!a && a.matches(':focus-visible'), index: currentIndex, spoken: window.__spoken, tilesOff: [...document.querySelectorAll('#lcChoices .lc-tile')].every(t => t.disabled) }; });
  const moved = from => page.waitForFunction(i => currentIndex !== i, from, { timeout: 4000 }).then(() => true, () => false);
  try {
    await page.goto(`${BASE}/flash_cards.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && document.getElementById('startBtn')); await page.evaluate(() => window.I18n.ready);
    await page.locator('#startBtn').scrollIntoViewIfNeeded(); await page.click('#startBtn');
    await page.waitForFunction(() => document.getElementById('screenCard').classList.contains('active')); await page.waitForTimeout(400);
    need(await page.evaluate(() => isListeningActive() && document.querySelectorAll('#lcChoices .lc-tile').length >= 2), 'not a listening round');
    // the keyboard finds the speaker
    let found = false; for (let i = 0; i < 60 && !found; i++) { await page.keyboard.press('Tab'); found = (await at()).id === 'lcReplay'; }
    need(found, 'Tab never reached the speaker');
    for (let card = 0; card < 3; card++) {
      const a0 = await at();
      await page.keyboard.press('Enter'); await page.waitForTimeout(120);                       // the speaker
      await page.keyboard.press('Tab'); await page.waitForTimeout(60);
      const onTile = await page.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('lc-tile') && !document.activeElement.disabled);
      need(onTile, `card ${card + 1}: Tab from the speaker did not land on an open tile (${(await at()).id})`);
      await page.keyboard.press('Enter'); await page.waitForTimeout(120);                       // the pick
      const a1 = await at();
      const went = await moved(a0.index); await page.waitForTimeout(150);
      const a2 = await at();
      rec.after.push(`${a1.id}→${a2.id}`);
      need(a1.id === 'lcReplay' && a1.tilesOff, `card ${card + 1}: right after the pick the focus is on ${a1.id}`);
      need(went && a2.id === 'lcReplay' && a2.fv, `card ${card + 1}: the next card ${went ? 'came' : 'did not come'}, the focus on ${a2.id}, its ring ${a2.fv}`);
      need(a2.spoken === a0.spoken + 1, `card ${card + 1}: the speaker spoke ${a2.spoken - a0.spoken} times`);
    }
    // guard: the digit key
    const d0 = await at(); await page.keyboard.press('Enter'); await page.waitForTimeout(120); await page.keyboard.press('1');
    const dWent = await moved(d0.index); await page.waitForTimeout(150); const d1 = await at();
    need(dWent && d1.id === 'lcReplay', `the digit key: the next card ${dWent ? 'came' : 'did not come'}, the focus on ${d1.id}`);
    // guard: the pointer
    const p0 = await at(); const sp = await page.locator('#lcReplay').boundingBox(); await page.mouse.click(sp.x + sp.width / 2, sp.y + sp.height / 2); await page.waitForTimeout(150);
    const tb = await page.locator('#lcChoices .lc-tile').first().boundingBox(); await page.mouse.click(tb.x + tb.width / 2, tb.y + tb.height / 2);
    const pWent = await moved(p0.index); await page.waitForTimeout(150); const p1 = await at();
    rec.pointer = `${p1.id} ring ${p1.fv}`; need(pWent && !p1.fv, `the pointer: the next card ${pWent ? 'came' : 'did not come'}, a focus ring on ${p1.id}: ${p1.fv}`);
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close().catch(() => {});
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell.padEnd(14)} the focus after each pick → once the next card came: ${r.after.join(', ')}; after a pointer's pick: ${r.pointer}${r.notes.length ? ' — ' + r.notes.join('; ').slice(0, 420) : ''}`);
const bad = records.filter(r => !r.ok);
console.log(`${records.length - bad.length} / ${records.length}`);
process.exit(bad.length ? 1 : 0);
