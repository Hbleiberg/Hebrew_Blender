#!/usr/bin/env node
// S636 (pattern RTL-inheritance-on-a-Latin-script-container) — a Real Words Gematria Self-Check card sits in the
// right-to-left .self-check-grid, and its transliteration and translation lines inherited that direction: on screen,
// on paper and in Export PDF "A vacation (especially from school)." read "A vacation )especially from .school(" and
// "Related to exile, migration." ".Related to exile, migration" (the sheet's own .gem-tn lines already pin ltr).
// The four lines now pin their direction; a wrapped translation is centred, clear of the card's edge.
//
// Real Words Gematria with Self-Check, seeded Math.random, EN light 1280 and HE dark 800, Reveal All by a real click:
// (1) every Latin-led line on a card (front and back; the hint and Got it / Missed, screen chrome, apart) is laid out
// left to right; (2) every translation that ends in a
// full stop or a bracket has that character at the right end of its last line (Range rects), on screen and in print
// media; (3) the Real Words Gematria sheet (no Self-Check), whose lines already pinned ltr, reads the same (the
// control: it passes on both trees). 0 page errors.
//
//   node scripts/loop/probes/S636-generator-gematria-card-latin-reads-left-to-right.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S636 fails (1) and (2) in both cells); --json prints the record.
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
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const record = []; let fail = 0;
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
// Latin-led text elements in the region: their direction, and for a trailing . or ) whether it sits at its line's right end
const READ = (sel) => {
  const root = document.querySelector(sel); if (!root) return null;
  let latin = 0, rtl = 0, ends = 0, endsWrong = 0; const ex = [];
  for (const el of root.querySelectorAll('*')) {
    if (el.closest('.flip-card-hint, .flip-card-score-btns')) continue;   // the screen's own chrome, in the UI's language (logged apart)
    if (!el.getClientRects().length || getComputedStyle(el).display === 'none') continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!own) continue;
    const t = el.textContent.trim(), first = t.match(/[A-Za-zא-ת]/); if (!first || !/[A-Za-z]/.test(first[0])) continue;
    latin++; if (getComputedStyle(el).direction === 'rtl') { rtl++; if (ex.length < 2) ex.push(t.slice(0, 40)); }
    if (/[.)]$/.test(t)) {
      ends++;
      const last = [...el.childNodes].reverse().find(n => n.nodeType === 3 && n.textContent.trim()); if (!last) continue;
      const s = last.textContent.replace(/\s+$/, ''), r = document.createRange(); r.setStart(last, s.length - 1); r.setEnd(last, s.length);
      const lr = r.getBoundingClientRect(), all = document.createRange(); all.selectNodeContents(el);
      const line = [...all.getClientRects()].filter(q => Math.abs(q.top - lr.top) < 3 && q.width > 0);
      if (line.some(q => q.right > lr.right + 1)) { endsWrong++; if (ex.length < 3) ex.push('end: ' + t.slice(-30)); }
    }
  }
  return { latin, rtl, ends, endsWrong, ex };
};
for (const cell of CELLS) for (const sc of [true, false]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w} ${sc ? 'Self-Check' : 'sheet (control)'}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.addInitScript(([l, d]) => {
    Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1');
  }, [cell.lang, cell.dark]);
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'load' }); await page.evaluate(() => window.I18n && I18n.ready);
    await page.click('#generateBtn'); await page.waitForTimeout(200);
    await page.click('[data-type="realwords"]'); await page.waitForTimeout(300); await page.click('[data-drill="gematria"]');
    await page.evaluate((on) => { const c = document.getElementById('rwGematriaSelfCheck'); if (c && c.checked !== on) c.click(); }, sc);
    await page.click('#generateBtn'); await page.waitForTimeout(700);
    const sel = sc ? '#scGrid' : '#worksheet';
    if (sc) { const ra = page.locator('#worksheet button[onclick="flipAllCards(true)"]'); if (!(await ra.count())) throw new Error('handle missing: Reveal All'); await ra.first().click(); await page.waitForTimeout(300); }
    const a = await page.evaluate(READ, sel); if (!a || !a.latin) throw new Error('handle missing: no Latin line in ' + sel);
    await page.emulateMedia({ media: 'print' }); const b = await page.evaluate(READ, sel); await page.emulateMedia({ media: 'screen' });
    out(a.rtl === 0 && b.rtl === 0, tag, 'every Latin line reads left to right', { lines: a.latin, rtl: a.rtl, printRtl: b.rtl, ex: a.ex });
    out(a.ends > 0 && a.endsWrong === 0 && b.endsWrong === 0, tag, 'a translation\'s final . or ) sits at its line\'s right end, screen and print', { ends: a.ends, wrong: a.endsWrong, printWrong: b.endsWrong, ex: a.ex.concat(b.ex).slice(0, 3) });
  } catch (e) { out(false, tag, 'the steps ran', { error: String(e).slice(0, 200) }); }
  if (errors.length) out(false, tag, 'no page errors', errors.slice(0, 3));
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every line in both cells');
process.exit(fail ? 1 : 0);
