#!/usr/bin/env node
// S691 — a parasha that is not this week's names the special Shabbat of the date it is next read, dated: a teacher
// pressing › to prepare Vayeshev (5 Dec 2026, Shabbat Chanukah — day 1) used to see its regular maftir and haftarah
// with no word that Numbers 7 and Zechariah replace them. This week's parasha keeps the undated "This Shabbat" chip.
//
//   node scripts/loop/probes/S691-torah-next-weeks-special-shabbat-chip.mjs   (ROOT=<tree> runs another copy)
//   The clock fixed at Saturday 28 Nov 2026 (Vayishlach), EN light 1280 and HE dark 800, Sefaria live: a real click
//   on › must show a dated chip naming Shabbat Chanukah — day 1 and its date, and a real click on its Open it → must
//   open Numbers 7:1-17. Controls: Vayishlach itself shows no chip (its Shabbat has none); the clock at 5 Dec on
//   Vayeshev shows the undated This-Shabbat chip; a parasha whose next date has no special (HebCal's own answer)
//   shows none. Exit 1 otherwise, on a missing handle or a page error.
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
const chip = page => page.evaluate(() => { const c = document.querySelector('#ttReading .tt-special-chip'); return c ? { text: c.textContent, tip: c.getAttribute('data-tip') } : null; });
async function open(lang, dark, w, day) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light' });
  await ctx.addInitScript(l => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewBlender_lang', l); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); } }, lang);
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.clock.install({ time: new Date(`${day}T10:00:00`) });
  await page.route('**/*', r => { const u = r.request().url(); return (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:') || /^https:\/\/www\.sefaria\.org\//.test(u)) ? r.continue() : r.abort(); });
  await page.goto(`${BASE}/torah_trainer.html`, { waitUntil: 'load' });
  await page.waitForSelector('#ttReading .tt-speak', { timeout: 30000 }); await page.waitForTimeout(1200);
  return { ctx, page, errs };
}
const settle = page => page.waitForFunction(() => document.querySelector('#ttReading .tt-speak'), null, { timeout: 30000 }).then(() => page.waitForTimeout(1200));
for (const [lang, dark, w] of [['en', false, 1280], ['he', true, 800]]) {
  const tag = `${lang} ${dark ? 'dark' : 'light'} ${w}`;
  try {
    const { ctx, page, errs } = await open(lang, dark, w, '2026-11-28');
    const here = await page.evaluate(() => settings.parshahKey), c0 = await chip(page);
    await page.click('#ttWeekNext'); await settle(page);
    const next = await page.evaluate(() => settings.parshahKey), c1 = await chip(page);
    const want = await page.evaluate(() => holidayName(holidayByKey('shabbat-chanukah-1')));
    const dated = !!c1 && c1.text.includes(want) && /5/.test(c1.text) && c1.tip.includes(want) && /5/.test(c1.tip);
    let opened = null;
    if (c1) { await page.click('#ttReading .tt-special-open'); await settle(page); opened = await page.evaluate(() => settings.customRef || ''); }
    // control: step on until a parasha whose next date HebCal says has no special, and expect no chip there
    let none = null;
    for (let i = 0; i < 6 && none === null; i++) {
      await page.click('#ttWeekNext'); await settle(page);
      const has = await page.evaluate(() => { const p = parshiyotData.find(x => x.en === settings.parshahKey); const nx = HebCal.nextOccurrence(p.n - 1, new Date(), {}); return !!(nx && HebCal.specialShabbat(nx.date, {})); });
      if (!has) none = { key: await page.evaluate(() => settings.parshahKey), chip: await chip(page) };
    }
    await ctx.close();
    const t = await open(lang, dark, w, '2026-12-05');
    const c2 = await chip(t.page), wk = await t.page.evaluate(() => settings.parshahKey);
    const thisWeek = await t.page.evaluate(n => I18n.t('torah.reading.special_chip', { name: n }), want);
    await t.ctx.close();
    const ok = here === 'Vayishlach' && !c0 && next === 'Vayeshev' && dated && /^Numbers 7:1-17$/.test(opened) && none && !none.chip && wk === 'Vayeshev' && c2 && c2.text === thisWeek && !errs.length && !t.errs.length;
    if (!ok) fail++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${tag}: ${here} chip ${JSON.stringify(c0)}; › ${next} chip ${JSON.stringify(c1 && c1.text)} (tip ${JSON.stringify(c1 && c1.tip)}); Open it → ${opened}; ${none ? none.key : 'no plain week found'} chip ${JSON.stringify(none && none.chip)}; on 5 Dec ${wk} chip ${JSON.stringify(c2 && c2.text)}; errors ${errs.length + t.errs.length}`);
  } catch (e) { fail++; console.log('FAIL', tag, e.message.split('\n')[0]); }
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
