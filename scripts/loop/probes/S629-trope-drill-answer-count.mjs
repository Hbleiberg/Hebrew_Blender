#!/usr/bin/env node
// S629 — the Trope Tutor's drill offers 2, 3 or 4 answers per question (the micro-feature from the maintainer's seed
// "Drill answer count (2/3/4)": two buttons for a first grade). The Drill start screen's "How many answers to choose
// from?" (`#drillChoicesSel`, settings.drillChoices, validated on every read like the question count) sets how many
// answer buttons every question shows: the right mark and one, two or three distractors.
//
//   node scripts/loop/probes/S629-trope-drill-answer-count.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, every press a real click (the select by
//   selectOption): the select offers 2 / 3 / 4 with 4 chosen; a 10-question drill at 2, then at 3 (back to the start
//   screen each time by Back to Learn and the Drill tab), shows exactly that
//   many buttons on every question (Identify, Hear and Melody all asked), the right answer always among them, and the
//   results screen comes up; a reload keeps 3; a High Holiday drill (the chart's tunes, distractors that sound alike
//   left out) at 2 shows 2. Controls: the default drill shows 4 on every question, and a stored junk value ("7",
//   "__proto__", 1) shows 4 with the select on 4. PocketTorah's MP3s are answered by a tone with 206 ranges (a seekable
//   stub); every other foreign origin is aborted. exit 1 when a step fails or a handle is missing. ROOT=<a git archive
//   of the tree> runs another copy (the tree before S629 has no select: every cell fails).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
// A 15-minute 330 Hz tone, 8 kHz 8-bit mono: an aliyah file seeks anywhere in it.
const SR = 8000, N = SR * 900, WAV = Buffer.alloc(44 + N);
WAV.write('RIFF', 0); WAV.writeUInt32LE(36 + N, 4); WAV.write('WAVE', 8); WAV.write('fmt ', 12); WAV.writeUInt32LE(16, 16); WAV.writeUInt16LE(1, 20); WAV.writeUInt16LE(1, 22);
WAV.writeUInt32LE(SR, 24); WAV.writeUInt32LE(SR, 28); WAV.writeUInt16LE(1, 32); WAV.writeUInt16LE(8, 34); WAV.write('data', 36); WAV.writeUInt32LE(N, 40);
for (let i = 0; i < N; i++) WAV[44 + i] = 128 + Math.round(20 * Math.sin(2 * Math.PI * 330 * i / SR));
let audioHits = 0;
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
async function open(cell, stored) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://raw.githubusercontent.com/rneiss/PocketTorah/') || u.startsWith('https://audio.ivritsuite.com/')) {
      audioHits++;
      const m = /bytes=(\d+)-(\d*)/.exec(r.request().headers()['range'] || '');
      if (!m) return r.fulfill({ status: 200, headers: { 'content-type': 'audio/wav', 'accept-ranges': 'bytes' }, body: WAV });
      const s = +m[1], e = m[2] ? Math.min(+m[2], WAV.length - 1) : WAV.length - 1;
      return r.fulfill({ status: 206, headers: { 'content-type': 'audio/wav', 'accept-ranges': 'bytes', 'content-range': `bytes ${s}-${e}/${WAV.length}` }, body: WAV.subarray(s, e + 1) });
    }
    return r.abort();
  });
  await ctx.addInitScript(([lang, dark, stored]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); if (stored) localStorage.setItem('hebrewTropeTutor_settings', stored); }, [cell.lang, cell.dark, stored]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/trope_tutor.html', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.getElementById('tabDrill') && document.querySelectorAll('#tuCards svg').length > 0, null, { timeout: 30000 });
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(600);
  await page.click('#tabDrill'); await page.waitForTimeout(400);
  return { ctx, page, errors };
}
const selState = page => page.evaluate(() => { const s = document.getElementById('drillChoicesSel'); return s ? { opts: [...s.options].map(o => o.value).join(','), value: s.value, label: (document.querySelector('label[for="drillChoicesSel"]') || {}).textContent || '' } : null; });
// One session by real clicks; per question: the button count, the type (from the buttons' shape) and whether the right
// answer is among them.
async function drillRun(page) {
  await page.click('#drillStartBtn'); await page.waitForTimeout(600);
  const seen = [];
  for (let step = 0; step < 60; step++) {
    const st = await page.evaluate(() => {
      const ch = [...document.querySelectorAll('#qChoices .tu-choice')];
      return { res: !document.getElementById('drillResults').hidden, next: !!document.getElementById('qNextBtn'), n: ch.length, live: ch.filter(b => !b.disabled).length,
        type: ch.some(b => b.hasAttribute('aria-pressed')) ? 'melody' : ch.some(b => b.querySelector('.c-glyph')) ? 'hear' : 'identify',
        keys: ch.map(b => b.dataset.key), answer: (typeof drill !== 'undefined' && drill.qs[drill.i]) ? drill.qs[drill.i].key : null, i: typeof drill !== 'undefined' ? drill.i : -1 };
    });
    if (st.res) return { seen, done: true };
    if (st.next) { await page.click('#qNextBtn'); await page.waitForTimeout(200); continue; }
    if (!st.live) { await page.waitForTimeout(300); continue; }
    if (!seen.length || seen[seen.length - 1].i !== st.i) seen.push({ i: st.i, n: st.n, type: st.type, hasAnswer: st.keys.includes(st.answer) });
    const b = page.locator('#qChoices .tu-choice:not([disabled])').first();
    await b.click(); await page.waitForTimeout(250);
    if (await page.evaluate(() => !document.getElementById('qNextBtn') && document.querySelectorAll('#qChoices .tu-choice:not([disabled])').length > 0)) { await b.click(); await page.waitForTimeout(250); }
  }
  return { seen, done: false };
}
const verdict = (r, want) => r.done && r.seen.length >= 5 && r.seen.every(q => q.n === want && q.hasAnswer);
const types = r => [...new Set(r.seen.map(q => q.type))].sort().join('/');
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    // the default: 4, and a drill shows 4 (control)
    let o = await open(cell, null);
    let s = await selState(o.page);
    if (!s) { ok(false, `${L}: no "How many answers" select on the Drill start screen`); await o.ctx.close(); continue; }
    let r = await drillRun(o.page);
    ok(s.opts === '2,3,4' && s.value === '4' && s.label.trim().length > 3 && verdict(r, 4), `${L}: default — options ${s.opts}, chosen ${s.value}, "${s.label.trim()}"; ${r.seen.length} questions (${types(r)}) with ${[...new Set(r.seen.map(q => q.n))]} buttons`);
    // 2, then 3, by the select; the results' Drill again goes back through the start screen
    const back = async () => { await o.page.click('#drillResults .btn-secondary'); await o.page.waitForTimeout(300); await o.page.click('#tabDrill'); await o.page.waitForTimeout(300); };
    await back();
    await o.page.selectOption('#drillChoicesSel', '2'); await o.page.waitForTimeout(200);
    r = await drillRun(o.page);
    ok(verdict(r, 2) && types(r) === 'hear/identify/melody', `${L}: 2 answers — ${r.seen.length} questions (${types(r)}), buttons ${[...new Set(r.seen.map(q => q.n))]}, the right answer always offered ${r.seen.every(q => q.hasAnswer)}`);
    await back();
    await o.page.selectOption('#drillChoicesSel', '3'); await o.page.waitForTimeout(200);
    r = await drillRun(o.page);
    ok(verdict(r, 3), `${L}: 3 answers — ${r.seen.length} questions (${types(r)}), buttons ${[...new Set(r.seen.map(q => q.n))]}`);
    const stored = await o.page.evaluate(() => JSON.parse(localStorage.getItem('hebrewTropeTutor_settings') || '{}').drillChoices);
    await o.page.reload({ waitUntil: 'domcontentloaded' });
    await o.page.waitForFunction(() => window.I18n && document.getElementById('drillChoicesSel') && document.getElementById('drillChoicesSel').options.length === 3);
    await o.page.waitForTimeout(500);
    s = await selState(o.page);
    ok(stored === 3 && s.value === '3' && o.errors.length === 0, `${L}: stored ${stored}; after a reload the select shows ${s.value}; ${o.errors.length} errors${o.errors.length ? ' — ' + o.errors[0].slice(0, 80) : ''}`);
    await o.ctx.close();
    // a melody nobody recorded (the chart's tunes; alike-sounding distractors left out) at 2
    o = await open(cell, '{"melody":"highholiday","drillChoices":2}');
    r = await drillRun(o.page);
    ok(verdict(r, 2) && o.errors.length === 0, `${L}: High Holidays at 2 — ${r.seen.length} questions (${types(r)}), buttons ${[...new Set(r.seen.map(q => q.n))]}; ${o.errors.length} errors`);
    await o.ctx.close();
    // junk stored values read as 4
    for (const junk of ['"7"', '"__proto__"', '1']) {
      o = await open(cell, `{"drillChoices":${junk},"drillLength":5}`);
      s = await selState(o.page); r = await drillRun(o.page);
      ok(s.value === '4' && verdict(r, 4) && o.errors.length === 0, `${L}: stored ${junk} → select ${s.value}, ${r.seen.length} questions with ${[...new Set(r.seen.map(q => q.n))]} buttons; ${o.errors.length} errors`);
      await o.ctx.close();
    }
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
await browser.close(); server.close();
ok(audioHits > 0, `the recordings stub answered ${audioHits} requests (the Hear and Melody questions played)`);
console.log(fail ? `FAIL: ${fail}` : 'PASS: the drill shows the chosen number of answers (2, 3 or 4) on every question');
process.exit(fail ? 1 : 0);
