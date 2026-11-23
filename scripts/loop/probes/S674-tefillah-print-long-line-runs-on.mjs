#!/usr/bin/env node
// S674 — the Tefillah Trainer on paper: a paragraph-long line. Every line was kept whole across a sheet break, so a line
// longer than what was left of a sheet moved to the next one: Ashrei's one 173-word line left its first handout sheet
// holding the instruction alone (82% blank), and Aleinu at Extra large left sheets 92% and 79% blank. A line of 25 words
// or more ([data-long]) now runs on to the next sheet as a paragraph does; a short line is still never split.
//
//   node scripts/loop/probes/S674-tefillah-print-long-line-runs-on.mjs     exit 1 when a check fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S674 fails).
//
// A fixture prayer (an instruction, a 150-word line, a 6-word line, a 24-word line): the student handout at Large and at
// Extra large, and the plain print, each as a Letter PDF — the long line starts on the first sheet (one sheet fewer than
// kept whole), and under print media the long row may break while the short rows may not, in Line by line and Side by
// side. Sefaria is stubbed with ordinary vocabulary words from data/hebrew_words.json (never liturgical text).
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
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 180);
const bare = s => [...s].filter(isLetter).join('');
const LINES = [WORDS.slice(0, 30).map(bare).join(' '), WORDS.slice(0, 150).join(' '), WORDS.slice(150, 156).join(' '), WORDS.slice(156, 180).join(' ')];   // an instruction (unpointed), 150 words, 6 words, 24 words
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } }] };
const ANSWER = { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: LINES }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] };
const sheets = buf => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

const browser = await chromium.launch(); const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); };
// [label, stored settings, handout?, sheets wanted (the long line starting on sheet 1)]
const CELLS = [
  ['handout Large, Line by line', { layout: 'interlinear', handoutFontSize: 'large' }, true, 2],
  ['handout Extra large, Line by line', { layout: 'interlinear', handoutFontSize: 'xl' }, true, 3],
  ['handout Large, Side by side', { layout: 'sidebyside', handoutFontSize: 'large' }, true, 2],
  ['plain print, Line by line', { layout: 'interlinear' }, false, 1],
];
for (const [label, st, handout, want] of CELLS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
  await ctx.addInitScript(c => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTefillahTrainer_settings', JSON.stringify(c.st)); } }, { st });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
    if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
    if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ANSWER) });
    return r.abort();
  });
  try {
    await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#ttReading [data-vk] .tt-word', { timeout: 20000 }); await page.waitForTimeout(500);
    const rowSel = st.layout === 'sidebyside' ? '#ttReading .tt-col-heb .tt-grid-row[data-vk]' : '#ttReading .tt-verse[data-vk]';
    if (handout) {
      // The real button, with print() stubbed and the exit held: the handout's classes stay on for the PDF.
      await page.evaluate(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; });
      await page.click('#gearBtn'); await page.click('#ttTabShare');
      const btn = page.locator('#settingsModal button[onclick="printHandout()"]'); await btn.scrollIntoViewIfNeeded(); await btn.click(); await page.waitForTimeout(200);
      check(`${label}: Print handout calls print once`, await page.evaluate(() => window.__printed) === 1, '');
      await page.keyboard.press('Escape'); await page.evaluate(() => { _handoutEnter(); });
    }
    await page.emulateMedia({ media: 'print' });
    const rows = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(r => ({ words: r.querySelectorAll('.tt-word').length, long: r.hasAttribute('data-long'), brk: getComputedStyle(r).breakInside })), rowSel);
    check(`${label}: three lines of prayer text`, rows.length === 3 && rows[0].words === 150 && rows[1].words === 6 && rows[2].words === 24, JSON.stringify(rows));
    check(`${label}: the 150-word line may run on to the next sheet`, rows[0] && rows[0].long && rows[0].brk === 'auto', JSON.stringify(rows[0]));
    check(`${label}: a 6-word and a 24-word line are never split`, rows[1] && rows[2] && !rows[1].long && !rows[2].long && rows[1].brk === 'avoid' && rows[2].brk === 'avoid', JSON.stringify(rows.slice(1)));
    const n = sheets(await page.pdf({ format: 'Letter', margin: { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' } }));
    check(`${label}: ${want} sheet${want === 1 ? '' : 's'} (the long line starts on the first)`, n === want, `sheets ${n}`);
    await page.emulateMedia({ media: 'screen' });
    check(`${label}: no page error`, !errors.length, errors.join(' | ').slice(0, 160));
  } catch (e) { check(`${label}: ran`, false, String(e.message).split('\n')[0].slice(0, 200)); }
  await ctx.close();
}
await browser.close(); server.close();
const bad = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : ' — ' + c.detail}`);
console.log(`${checks.length - bad.length} / ${checks.length}`);
process.exit(bad.length ? 1 : 0);
