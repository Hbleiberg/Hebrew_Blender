#!/usr/bin/env node
// S676 — the Tefillah Trainer on paper: the credits ("Text sources", kept whole) moved to a sheet of their own whenever
// they did not fit under the last line, and 28 of 312 real prints (Letter / A4, EN / HE) ended on a sheet holding the
// credits alone — Lecha Dodi's default print on Letter was three sheets, the third three lines of attribution. In Line by
// line the last line now goes over with them: the credits avoid a break before them, and the reading's two wrappers are
// flattened on paper so that rule can reach a line on a sheet the reading has already crossed onto (a block already
// broken across sheets has nothing to pull back: the 22-line fixture kept its lonely sheet with the rule alone).
//
//   node scripts/loop/probes/S676-tefillah-credits-never-print-alone.mjs     exit 1 when a check fails
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before S676 fails the Line by line
//   lengths 11 and 22 on Letter, 12 and 24 on A4).
//
// A fixture prayer of N lines of 12 vocabulary words (data/hebrew_words.json, never liturgical text), N = 8…30:
//   Line by line, Letter and A4 — the last sheet holds prayer text, the first sheet too, and the print is at most one
//   sheet longer than the reading printed without its credits;
//   Side by side with the transliteration beside it (the parallel grid, which the rule leaves alone: a grid answered it by
//   pushing the whole reading off the first sheet) — the first sheet holds prayer text and the print is at most one sheet
//   longer than the reading alone.
// The transliteration module's CDN answers with a fake that passes the page's self-test; Sefaria is stubbed.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 's676c-'));
const isPoint = c => { const n = c.charCodeAt(0); return n >= 0x05B0 && n <= 0x05BC; }, isLetter = c => { const n = c.charCodeAt(0); return n >= 0x05D0 && n <= 0x05EA; };
const WORDS = Object.values(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hebrew_words.json'), 'utf8'))).flat().map(w => String((w && w.word) || ''))
  .filter(w => [...w].every(c => isPoint(c) || isLetter(c)) && [...w].filter(isLetter).length >= 3 && [...w].some(isPoint)).filter((w, i, a) => a.indexOf(w) === i).slice(0, 400);
const lines = n => Array.from({ length: n }, (_, i) => Array.from({ length: 12 }, (_, j) => WORDS[(i * 12 + j) % WORDS.length]).join(' '));
const CATALOG = { v: 1, hebrewPreference: ['Open'], versesEnglish: [], groups: [{ key: 'probe', nameKey: '', en: 'Probe fixtures', he: '' }],
  prayers: [{ key: 'alpha', nameKey: '', en: 'Fixture alpha', he: '', group: 'probe', service: ['shacharit'], days: ['weekday'], sources: { ashkenaz: 'Siddur Ashkenaz, Probe, Alpha' } }] };
const FAKE = `export class SBL { constructor(o) { this.o = o || {}; } }
export function transliterate(s) { return String(s).split(/\\s+/).filter(Boolean).map(w => 'tl' + 'x'.repeat((w.match(/[\\u05D0-\\u05EA]/g) || []).length)).join(' '); }`;
const MARGIN = { top: '0.4in', bottom: '0.4in', left: '0.4in', right: '0.4in' };
const pointed = (f, k) => /[ְ-ּ]/.test(execFileSync('pdftotext', ['-f', String(k), '-l', String(k), f, '-']).toString());

const browser = await chromium.launch(); const checks = [];
const check = (name, ok, detail) => { checks.push({ name, ok: !!ok, detail }); };
for (const [label, st, wantLast] of [['Line by line', { layout: 'interlinear' }, true], ['Side by side + transliteration', { layout: 'sidebyside', showTranslit: true }, false]]) {
  const bad = { last: [], first: [], extra: [] }; let cells = 0;
  for (let n = 8; n <= 30; n++) {
    const ANSWER = { versions: [{ language: 'he', versionTitle: 'An Open Edition', license: 'CC0', versionSource: 'https://example.invalid/source', text: lines(n) }], available_versions: [{ language: 'he', actualLanguage: 'he', versionTitle: 'An Open Edition', license: 'CC0' }] };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(c => { localStorage.setItem('hebrewTefillahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTefillahTrainer_settings', JSON.stringify(c)); }, { prayerKey: 'alpha', nusach: 'ashkenaz', ...st });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => {
      const u = r.request().url();
      if (u.startsWith(BASE + '/data/tefillah/catalog.json')) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(CATALOG) });
      if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      if (u.startsWith('https://www.sefaria.org/api/v3/texts/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(ANSWER) });
      if (/hebrew-transliteration/.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: /schemas/.test(u) ? 'export const brillAcademic = {};' : FAKE });
      return r.abort();
    });
    try {
      await page.goto(`${BASE}/tefillah_trainer.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#ttReading [data-vk] .tt-word', { timeout: 20000 }); await page.waitForTimeout(600);
      if (st.showTranslit) await page.waitForSelector('#ttReading .tt-cell.translit, #ttReading .tt-translit', { timeout: 10000 });
      await page.emulateMedia({ media: 'print' });
      for (const fmt of ['Letter', 'A4']) {
        cells++;
        const f = path.join(TMP, `p.pdf`);
        const buf = await page.pdf({ format: fmt, margin: MARGIN }); fs.writeFileSync(f, buf);
        const k = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        await page.addStyleTag({ content: '#ttCredits { display:none !important; }' });
        const r = ((await page.pdf({ format: fmt, margin: MARGIN })).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        await page.evaluate(() => { const s = [...document.querySelectorAll('style')].pop(); if (s && /ttCredits/.test(s.textContent)) s.remove(); });
        if (wantLast && !pointed(f, k)) bad.last.push(`${n}/${fmt}`);
        if (!pointed(f, 1)) bad.first.push(`${n}/${fmt}`);
        if (k > r + 1) bad.extra.push(`${n}/${fmt} ${k} vs ${r}`);
      }
      if (errors.length) bad.first.push(`${n}: page error ${errors[0].slice(0, 80)}`);
    } catch (e) { bad.first.push(`${n}: ${String(e.message).split('\n')[0].slice(0, 120)}`); }
    await ctx.close();
  }
  if (wantLast) check(`${label}: the last sheet holds prayer text (${cells} prints)`, !bad.last.length, bad.last.join(', '));
  check(`${label}: the first sheet holds prayer text (${cells} prints)`, !bad.first.length, bad.first.join(', '));
  check(`${label}: never more than one sheet over the reading alone (${cells} prints)`, !bad.extra.length, bad.extra.join(', '));
}
await browser.close(); server.close();
const failed = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ' — ' + c.detail : ''}`);
console.log(`\n${checks.length - failed.length} / ${checks.length} checks pass`);
process.exit(failed.length ? 1 : 0);
