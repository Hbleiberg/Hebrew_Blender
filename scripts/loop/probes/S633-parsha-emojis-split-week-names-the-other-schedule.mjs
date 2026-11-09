#!/usr/bin/env node
// S633 micro-feature (gate 1; the S540 seed) — in a split week Today's parasha names what the other schedule reads that
// Shabbat: after the Diaspora's second day of Shavuot (or eighth day of Pesach) falls on Shabbat, Israel reads a
// parasha ahead for a few weeks, and a teacher saw only the schedule the Torah Trainer is set to (Diaspora unless it
// says Israel). One line under the heading: "In Israel: Beha'alotcha", "Outside Israel: Nasso", "Outside Israel: a
// holiday reading", a doubled pair joined ("Chukat–Balak", "חֻקַּת־בָּלָק"); a week both schedules share has none.
//
//   node scripts/loop/probes/S633-parsha-emojis-split-week-names-the-other-schedule.mjs
//   exit 1 when a step fails or a handle is missing. ROOT=<a git archive of the tree> runs another copy (the tree
//   before S633 fails every split case: no line); --json prints the record.
// The expected names come from data/parshiyot.json and the expected sentences from locales/<lang>.json, so the probe
// checks the page's choice of reading and template, not a copy of its strings. The dates are the 2026 split after
// Shavuot (js/hebrew-calendar.js, proved against Hebcal by scripts/smoke-hebrew-calendar.mjs).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const HERE_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PARSHIYOT = JSON.parse(fs.readFileSync(path.join(HERE_ROOT, 'data/parshiyot.json'), 'utf8'));
const LOC = { en: JSON.parse(fs.readFileSync(path.join(HERE_ROOT, 'locales/en.json'), 'utf8')), he: JSON.parse(fs.readFileSync(path.join(HERE_ROOT, 'locales/he.json'), 'utf8')) };
const flat = (o, p = '', out = {}) => { for (const [k, v] of Object.entries(o)) { if (v && typeof v === 'object') flat(v, p + k + '.', out); else out[p + k] = v; } return out; };
const T = { en: flat(LOC.en), he: flat(LOC.he) };
const tr = (lang, key, params) => String(T[lang][key] ?? T[lang]['strings.' + key] ?? Object.entries(T[lang]).find(([k]) => k.endsWith(key))?.[1] ?? '').replace(/\{(\w+)\}/g, (_, n) => params[n]);
const byEn = (en) => PARSHIYOT.find(p => p.en === en);
const nameOf = (lang, ens) => { const ps = ens.map(byEn); if (ps.some(p => !p)) return null; const ns = ps.map(p => lang === 'he' ? p.he : p.en); return ns.length > 1 ? tr(lang, 'emojitorah.today.other_pair', { first: ns[0], second: ns[1] }) : ns[0]; };
// date, the Trainer's schedule, the cards expected, what the line says (null: no line)
const CASES = [
  { id: 'A', date: '2026-05-27T12:00:00', israel: false, cards: ['Nasso'], line: (l) => tr(l, 'emojitorah.today.other_israel', { name: nameOf(l, ["Beha'alotcha"]) }) },
  { id: 'B', date: '2026-05-27T12:00:00', israel: true, cards: ["Beha'alotcha"], line: (l) => tr(l, 'emojitorah.today.other_diaspora', { name: nameOf(l, ['Nasso']) }) },
  { id: 'C', date: '2026-05-20T12:00:00', israel: false, cards: ['Nasso'], holiday: true, line: (l) => tr(l, 'emojitorah.today.other_israel', { name: nameOf(l, ["Beha'alotcha"]) }) },
  { id: 'D', date: '2026-05-20T12:00:00', israel: true, cards: ['Nasso'], line: (l) => tr(l, 'emojitorah.today.other_diaspora_holiday', {}) },
  { id: 'E', date: '2026-06-24T12:00:00', israel: false, cards: ['Chukat', 'Balak'], line: (l) => tr(l, 'emojitorah.today.other_israel', { name: nameOf(l, ['Balak']) }) },
  { id: 'F', date: '2026-06-24T12:00:00', israel: true, cards: ['Balak'], line: (l) => tr(l, 'emojitorah.today.other_diaspora', { name: nameOf(l, ['Chukat', 'Balak']) }) },
  { id: 'G (control: a shared week)', date: '2026-11-05T12:00:00', israel: false, cards: ['Chayei Sara'], line: () => null },
  { id: 'H (control: a shared week, Israel)', date: '2026-11-05T12:00:00', israel: true, cards: ['Chayei Sara'], line: () => null },
];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const record = []; let fail = 0;
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }, { lang: 'en', dark: true, w: 800 }];
const out = (ok, tag, name, r) => { if (!ok) fail++; record.push({ cell: tag, name, ok, r }); if (!JSON_OUT) console.log(`${ok ? '✔' : '✘'} ${tag} — ${name}: ${JSON.stringify(r)}`); };
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  for (const c of CASES) {
    const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(String(e)));
    await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
    await page.addInitScript(([lang, dark, israel]) => {
      localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
      if (israel) localStorage.setItem('hebrewTorahTrainer_settings', JSON.stringify({ schedule: 'israel' }));
    }, [cell.lang, cell.dark, c.israel]);
    await page.clock.setFixedTime(new Date(c.date));
    await page.goto(base + '/parsha_emojis.html', { waitUntil: 'domcontentloaded' });
    let r = null, ok = false;
    try {
      await page.waitForFunction(() => window.I18n && document.querySelector('#etCards .et-featured .et-card'));
      await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(300);
      const read = () => page.evaluate(() => {
        const sec = document.querySelector('#etCards .et-sec');
        const lines = [...document.querySelectorAll('#etCards .et-other')];
        const de = document.documentElement;
        return { cards: [...document.querySelectorAll('#etCards .et-featured .et-card')].map(li => Number(li.dataset.n)),
          holidayNote: !!sec && [...sec.querySelectorAll('.et-sub')].some(p => p.textContent === (window.I18n && I18n.t('emojitorah.today.holiday_note'))),
          lines: lines.map(p => p.textContent), lineVisible: lines.length === 1 && lines[0].getClientRects().length > 0,
          lineBeforeCards: lines.length === 1 && !!(lines[0].compareDocumentPosition(document.querySelector('#etCards .et-featured')) & Node.DOCUMENT_POSITION_FOLLOWING),
          overflow: de.scrollWidth > de.clientWidth, lang: I18n.lang };
      });
      r = await read();
      const wantCards = c.cards.map(e => byEn(e)?.n);
      const want = c.line(cell.lang);
      ok = JSON.stringify(r.cards) === JSON.stringify(wantCards) && !r.overflow && (c.holiday ? r.holidayNote : true)
        && (want === null ? r.lines.length === 0 : (r.lines.length === 1 && r.lines[0] === want && r.lineVisible && r.lineBeforeCards));
      r.want = want;
      // the live switch: the line follows the language
      if (c.id === 'F' && ok) {
        const other = cell.lang === 'en' ? 'he' : 'en';
        await page.evaluate((l) => I18n.setLang(l), other); await page.waitForFunction((l) => I18n.lang === l, other); await page.waitForTimeout(400);
        const r2 = await read(), want2 = c.line(other);
        const ok2 = r2.lines.length === 1 && r2.lines[0] === want2 && !r2.overflow;
        out(ok2, tag, `F after a live switch to ${other}: the line in ${other}`, { lines: r2.lines, want: want2 });
      }
    } catch (e) { r = Object.assign(r || {}, { error: String(e).slice(0, 200) }); }
    if (errors.length) { ok = false; r = Object.assign(r || {}, { errors }); }
    out(ok, tag, `${c.id} ${c.date.slice(0, 10)} ${c.israel ? 'Israel' : 'Diaspora'}`, r);
    await ctx.close();
  }
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(record, null, 1));
else console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: every step in all four cells');
process.exit(fail ? 1 : 0);
