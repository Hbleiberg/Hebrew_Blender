#!/usr/bin/env node
// S573 — Generator: the screen-only gold text and the Real Words flip hint read at AA (4.5:1, small text) in both
// themes: Fill Vowels' transliteration under each blend (.blend-answer), the answer keys' "Answer Key — Teacher Copy"
// line (.ws-ak-subtitle, the Gematria key's among them) and a Self-Check vocab card's "tap to flip" (.rw-flip-hint).
// They read 2.75:1 (brand --gold on white) and 2.60:1 (the hint at opacity 0.6); paper already darkens the gold.
//
//   node scripts/loop/probes/S573-generator-gold-answers-and-flip-hint.mjs     exit 1 when any reads under 4.5:1
//   ROOT=<a git archive of the tree> runs it on another copy (the control); --json prints the record.
//
// By real clicks: the Fill Vowels sheet (with its answer key) → Generate; the Gematria sheet (with its key) → Generate; Real Words →
// Self-Check → Generate. Colour is composited with every ancestor's opacity over the first opaque background.
// EN light / dark × 1280 / 800 and HE dark 800.
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
const records = [];
// the lowest contrast over every element matching sel inside #worksheet (null when none is shown)
const measure = (page, sel) => page.evaluate((sel) => {
  const parse = (s) => { const m = (s.match(/[\d.]+/g) || []).map(Number); return { c: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
  const lum = (c) => { const v = c.map(x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const cr = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  let worst = null;
  document.querySelectorAll('#worksheet ' + sel).forEach(el => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (!r.width || cs.visibility === 'hidden' || cs.display === 'none' || !el.textContent.trim()) return;
    let op = 1, bg = null;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n); op *= parseFloat(s.opacity);
      if (!bg) { const b = parse(s.backgroundColor); if (b.a >= 0.99) bg = b.c; }
    }
    if (!bg) bg = parse(getComputedStyle(document.body).backgroundColor).c;
    const fg = parse(cs.color); const a = fg.a * op;
    const eff = fg.c.map((x, i) => x * a + bg[i] * (1 - a));
    const v = +cr(eff, bg).toFixed(2);
    if (worst === null || v < worst) worst = v;
  });
  return worst;
}, sel);
const click = async (page, sel) => { if (process.env.DBG) console.log('  click', sel); const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded({ timeout: 5000 }); await l.click({ timeout: 5000 }); await page.waitForTimeout(300); };
const toggle = async (page, id, on) => {
  await page.evaluate((id) => { let p = document.getElementById(id); while ((p = p && p.parentElement)) if (p.classList && p.classList.contains('collapsed')) p.classList.remove('collapsed'); }, id);
  if (await page.evaluate((id) => document.getElementById(id).checked, id) !== on) await click(page, `label:has(#${id})`);
};
const CELLS = [['en', false, 1280], ['en', false, 800], ['en', true, 1280], ['en', true, 800], ['he', true, 800]];
for (const [lang, dark, w] of CELLS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewBlender_tourSeen', '1'); }, [lang, dark]);
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(String(e.message || e)));
  const load = async () => {
    await page.goto(BASE + '/hebrew_blend_generator.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n && typeof generate === 'function', null, { timeout: 20000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open')));
  };
  const out = {};
  // 1. Fill Vowels, with its answer key
  await load();
  await click(page, '[data-worksheet="fillvowels"]');
  await toggle(page, 'fillVowelsAnswerKey', true);
  await click(page, '#generateBtn'); await page.waitForTimeout(1000);
  out.fillVowelsAnswer = await measure(page, '.blend-answer');
  out.akSubtitle = await measure(page, '.ws-ak-subtitle');
  // 2. Gematria with its answer key
  await page.evaluate(() => localStorage.removeItem('hebrewBlender_lastState'));
  await load();
  await click(page, '[data-worksheet="gematria"]');
  await toggle(page, 'gematriaAnswerKey', true);
  await click(page, '#generateBtn'); await page.waitForTimeout(1000);
  out.gematriaAkSubtitle = await measure(page, '.ws-ak-subtitle');
  // 3. Real Words Self-Check
  await page.evaluate(() => localStorage.removeItem('hebrewBlender_lastState'));
  await load();
  await click(page, '[data-type="realwords"]');
  await click(page, '[data-drill="vocab"]');
  await click(page, '#generateBtn'); await page.waitForTimeout(1200);
  out.flipHint = await measure(page, '.rw-flip-hint');
  out.dark = await page.evaluate(() => document.body.classList.contains('dark'));
  const vals = ['fillVowelsAnswer', 'akSubtitle', 'gematriaAkSubtitle', 'flipHint'].map(k => out[k]);
  const ok = errors.length === 0 && out.dark === dark && vals.every(v => typeof v === 'number' && v >= 4.5);
  records.push({ cell: `${lang} ${dark ? 'dark' : 'light'} ${w}`, ok, out, errors });
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else records.forEach(r => console.log((r.ok ? 'PASS ' : 'FAIL ') + r.cell + ' ' + JSON.stringify(r.out) + (r.errors.length ? ' ' + r.errors.join(' | ') : '')));
const bad = records.filter(r => !r.ok).length;
console.log(bad ? `${bad} of ${records.length} cells fail` : `all ${records.length} cells pass`);
process.exit(bad ? 1 : 0);
