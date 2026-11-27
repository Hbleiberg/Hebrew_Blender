#!/usr/bin/env node
// S685 — the Torah Trainer's verse flash (`.tt-flash`, 1.5 s of gold fading out, when a jump or the resume chip lands
// on a verse) keeps the verse's own Read / Chant / Loop / Copy buttons legible. In dark mode its 0.45 gold start sat
// under the buttons' grey labels at 2.6:1 (S682), back to 4.5 only after ~0.7 s. By a real click on the aliyah jump
// chip (aliyah 1's id is on its first verse), the animation frozen at 0, 0.35 and 0.7 s (the chips' 0.15 s colour
// transition let finish first); per button the label's colour
// against every background under it composited down to the page. EN / HE × light / dark × 1280 / 800, Sefaria stubbed.
// A cell passes when every visible verse button in the flashed verse reads ≥ 4.5:1 at every sampled time, the flash is
// running (a control: its animation was found and its start background is not transparent).
//
//   node scripts/loop/probes/S685-torah-verse-flash-keeps-its-buttons-legible.mjs   exit 1 below 4.5:1 or on a page error
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S685 fails the dark cells).
//   --json prints the record.
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
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const HEB = rows.slice(0, 8).flatMap(r => r.ex.map(e => e.he)).slice(0, 16);
let sefHits = 0;
const sef = u => {
  if (u.includes('/texts/versions/')) return [];
  if (u.includes('/v3/texts/')) return { versions: [{ language: 'he', versionTitle: 'Miqra according to the Masorah', license: 'CC-BY-SA', text: HEB }], sections: ['1', '1'] };
  return u.includes('/calendars') ? { calendar_items: [] } : [];
};
const browser = await chromium.launch();
const records = []; let fails = 0, errors = 0;
for (const lang of ['en', 'he']) for (const dark of [false, true]) for (const width of [1280, 800]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
  await ctx.addInitScript(([lang, dark]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_hintSeen', '1');
    localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ parshahKey: 'Bereshit', scope: 'parsha-full', layout: 'interlinear', showTranslation: false })); }, [lang, dark]);
  const page = await ctx.newPage(); page.on('pageerror', () => errors++);
  await page.route('**/*', r => { const u = r.request().url();
    if (u.startsWith('https://www.sefaria.org/api/')) { sefHits++; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sef(u)) }); }
    return (u.startsWith(BASE) || /^(data|blob):/.test(u)) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/torah_trainer.html', { waitUntil: 'load' });
  await page.waitForSelector('.tt-jump-chip', { timeout: 30000 });
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
  await page.locator('.tt-jump-chip').first().click();
  await page.waitForSelector('.tt-flash');
  // freeze the flash at its start, then let the chips' own 0.15 s colour transition finish before reading them
  await page.evaluate(() => { const a = document.querySelector('.tt-flash').getAnimations().find(x => x.animationName === 'ttFlash'); if (a) { a.pause(); a.currentTime = 0; } });
  await page.waitForTimeout(250);
  const samples = [];
  for (const t of [0, 350, 700]) samples.push(await page.evaluate(t => {
    const el = document.querySelector('.tt-flash'); const anim = el.getAnimations().find(a => a.animationName === 'ttFlash');
    if (!anim) return { t, anim: false };
    anim.pause(); anim.currentTime = t;
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    const over = (top, bot) => { const a = top[3] + bot[3] * (1 - top[3]); return a ? [0, 1, 2].map(i => (top[i] * top[3] + bot[i] * bot[3] * (1 - top[3])) / a).concat(a) : [0, 0, 0, 0]; };
    const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    const bgUnder = e => { const layers = []; for (let n = e; n; n = n.parentElement) layers.push(parse(getComputedStyle(n).backgroundColor)); let c = [255, 255, 255, 1]; for (let i = layers.length - 1; i >= 0; i--) c = over(layers[i], c); return c; };
    const btns = [...el.querySelectorAll('.tt-speak, .tt-chant, .tt-loop, .tt-copy')].filter(b => b.offsetWidth);
    const out = btns.map(b => { const bg = bgUnder(b); const fg = over(parse(getComputedStyle(b).color), bg); const L1 = lum(fg), L2 = lum(bg);
      return +((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2); });
    return { t, anim: true, start: getComputedStyle(el).backgroundColor, n: btns.length, min: Math.min(...out) };
  }, t));
  const ok = samples.every(s => s.anim && s.n > 0 && s.min >= 4.5) && samples[0].start && !/rgba\(0, 0, 0, 0\)|transparent/.test(samples[0].start);
  if (!ok) fails++;
  records.push({ lang, dark, width, samples, ok });
  if (!JSON_OUT) console.log(`${ok ? 'ok  ' : 'FAIL'} ${lang} ${dark ? 'dark ' : 'light'} ${width} ` + samples.map(s => s.anim ? `${s.t}ms ${s.n} buttons min ${s.min}:1` : `${s.t}ms no flash`).join(' · ') + ` · start ${samples[0].start}`);
  await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify({ records, errors, sefHits }, null, 1));
const pass = !fails && !errors && sefHits > 0;
console.log(`${pass ? 'PASS' : 'FAIL'}: ${records.length - fails}/${records.length} flashed verses keep their buttons at 4.5:1; ${errors} page errors; sefaria stub ${sefHits}`);
process.exit(pass ? 0 : 1);
