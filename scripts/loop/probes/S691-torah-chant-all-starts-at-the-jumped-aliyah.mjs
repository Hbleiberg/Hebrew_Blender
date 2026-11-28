#!/usr/bin/env node
// S691 — on the whole parsha, Chant all starts at the aliyah the reader is in (the jump bar's gold chip), not at
// aliyah 1: a student who jumped to aliyah 3 used to be sent back to the top.
//
//   node scripts/loop/probes/S691-torah-chant-all-starts-at-the-jumped-aliyah.mjs   (ROOT=<tree> runs another copy)
//   EN light 1366 and HE dark 1024: the week's parsha (Sefaria and PocketTorah live, so the network must reach them),
//   Full parsha; a real click on chip 3, then on Chant all — the reading must become aliyah 3 with its audio playing.
//   Controls: Chant all from the top opens aliyah 1; a jump to 5 then a scroll back to the top opens aliyah 1.
//   Exit 1 otherwise, on a missing handle or a page error.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let fail = 0;
for (const [lang, dark, w] of [['en', false, 1366], ['he', true, 1024]]) for (const plan of ['jump3', 'top', 'jump5-back']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 768 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); } }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') || /^https:\/\/(www\.sefaria\.org|raw\.githubusercontent\.com)\//.test(u)) ? r.continue() : r.abort(); });
  const tag = `${lang} ${dark ? 'dark' : 'light'} ${w} ${plan}`;
  try {
    await page.goto(`${BASE}/torah_trainer.html`, { waitUntil: 'load' });
    await page.waitForSelector('.tt-jump-chip[data-aliyah="3"]', { timeout: 30000 }); await page.waitForTimeout(1500);
    if (!/^parsha-full|^parsha$/.test(await page.evaluate(() => settings.scope)) && !(await page.evaluate(() => !!_aliyahStarts))) throw new Error('not the whole parsha');
    if (plan === 'jump3') await page.click('.tt-jump-chip[data-aliyah="3"]');
    if (plan === 'jump5-back') { await page.click('.tt-jump-chip[data-aliyah="5"]'); await page.waitForTimeout(1500); await page.mouse.wheel(0, -1e6); await page.keyboard.press('Home'); }
    await page.waitForTimeout(1800);
    const chip = await page.evaluate(() => { const a = document.querySelector('.tt-jump-chip.active'); return a ? a.dataset.aliyah : null; });
    await page.click('#ttChantAllBtn');
    await page.waitForFunction(() => /^parsha-aliyah-\d$/.test(settings.scope) && [...document.querySelectorAll('audio')].some(a => !a.paused), null, { timeout: 30000 });
    const got = await page.evaluate(() => settings.scope.slice(-1));
    const want = plan === 'jump3' ? '3' : '1';
    const ok = got === want && !errs.length;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag}: gold chip before ${chip}; Chant all opened aliyah ${got} (want ${want}); errors ${errs.length} ${errs.slice(0, 1)}`);
  } catch (e) { fail++; console.log('FAIL', tag, e.message.split('\n')[0]); }
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
