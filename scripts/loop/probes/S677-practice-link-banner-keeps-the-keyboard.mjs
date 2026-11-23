#!/usr/bin/env node
// S677 (the S674 H finding; pattern `button-focus-lost-to-its-own-rebuild`) — a practice link that carries the sender's
// look (?s=) shows a banner on the Tefillah and the Torah Trainer with two buttons, Keep these settings and Use my
// settings. Each hides the banner it sits in, and a key's press left the focus on <body>: the next Tab started again
// at the skip link. The reading below the banner (#ttReading, the skip link's own target) now takes the focus, without
// scrolling, when the press came from the banner.
//
//   node scripts/loop/probes/S677-practice-link-banner-keeps-the-keyboard.mjs     exit 1 when a cell fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S677 fails every cell).
//
// Two pages × EN / HE × the two buttons, reached by Tab (so the press is a key's) and pressed with Enter: the banner
// shows first; afterwards it is hidden, the button did its work (Keep stores the link's text size, Use my settings
// puts the reader's own back on screen), the focus is on #ttReading and the page did not scroll; the next Tab lands
// inside the reading region or after it, never on the skip link. A mouse click on Keep (the third case) leaves no
// ring on the reading. Every foreign origin is aborted (no reading loads; the banner does not need one). No page error.
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
const LOOK = Buffer.from(JSON.stringify({ v: 1, hebFontSize: 2.6 })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const PAGES = [
  ['tefillah_trainer.html', 'hebrewTefillahTrainer_settings', { hebrewTefillahTrainer_tourSeen: '1' }],
  ['torah_trainer.html', 'hebrewTorahTrainer_settings', { hebrewTorahTrainer_tourSeen: '1' }],
];
const browser = await chromium.launch(); const records = [];
for (const [file, key, store] of PAGES) for (const lang of ['en', 'he']) for (const how of ['keep', 'revert', 'keep-click']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', c.lang); for (const k in c.store) localStorage.setItem(k, c.store[k]); } }, { lang, store });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const rec = { cell: `${file.replace('.html', '')} ${lang} ${how}`, notes: [] };
  const need = (ok, what) => { if (!ok) rec.notes.push(what); };
  try {
    await page.goto(`${BASE}/${file}?s=${LOOK}`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
    need(await page.evaluate(() => { const n = document.getElementById('ttLinkView'); return !!n && !n.hidden; }), 'the banner did not show (control)');
    const btn = `#ttLinkView button:nth-of-type(${how === 'revert' ? 2 : 1})`;
    const y0 = await page.evaluate(() => scrollY);
    if (how === 'keep-click') await page.click(btn);
    else {
      await page.focus(btn); await page.keyboard.press(how === 'revert' ? 'Shift+Tab' : 'Tab'); await page.keyboard.press(how === 'revert' ? 'Tab' : 'Shift+Tab');
      need(await page.evaluate(s => document.activeElement === document.querySelector(s) && document.activeElement.matches(':focus-visible'), btn), `the keyboard did not land on ${btn}`);
      await page.keyboard.press('Enter');
    }
    await page.waitForTimeout(700);
    const st = await page.evaluate(k => {
      const a = document.activeElement, n = document.getElementById('ttLinkView');
      let saved = null; try { saved = JSON.parse(localStorage.getItem(k) || '{}').hebFontSize; } catch (e) {}
      return { hidden: !!n && n.hidden, who: a ? (a.id || a.tagName) : null, ring: !!a && a.matches(':focus-visible'), y: scrollY, saved, size: typeof settings === 'object' ? settings.hebFontSize : null };
    }, key);
    rec.focus = st.who;
    need(st.hidden, 'the banner is still up');
    if (how === 'revert') need(st.size !== 2.6, `Use my settings left the link's size on screen (${st.size})`);
    else need(st.saved === 2.6, `Keep did not store the link's size (${st.saved})`);
    need(st.who === 'ttReading', `the focus fell to ${st.who}`);
    need(Math.abs(st.y - y0) < 2, `the page scrolled ${y0} → ${st.y}`);
    if (how === 'keep-click') need(!st.ring, 'a mouse press left a ring on the reading');
    else {
      await page.keyboard.press('Tab'); await page.waitForTimeout(100);
      const next = await page.evaluate(() => { const a = document.activeElement; return { skip: !!a && a.matches('.skip-link'), id: a ? (a.id || a.className || a.tagName) : null }; });
      need(!next.skip, `the next Tab went to the skip link`);
      rec.next = next.id;
    }
  } catch (e) { rec.notes.push(String(e.message).split('\n')[0].slice(0, 160)); }
  need(!errors.length, `page errors ${errors.length}: ${errors.join(' | ').slice(0, 120)}`);
  rec.ok = !rec.notes.length; records.push(rec); await ctx.close();
}
await browser.close(); server.close();
for (const r of records) console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.cell}: focus ${r.focus}${r.next ? ', next Tab ' + r.next : ''}${r.notes.length ? ' — ' + r.notes.join('; ') : ''}`);
const failed = records.filter(r => !r.ok).length;
console.log(`\n${records.length - failed} / ${records.length} cells pass`);
process.exit(failed ? 1 : 0);
