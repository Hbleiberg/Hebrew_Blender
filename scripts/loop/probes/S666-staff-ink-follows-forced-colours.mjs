#!/usr/bin/env node
// S666 — the three staff pages (Trope Atlas, Trope Tutor, the Torah Trainer's Trope staff layout): a staff's ink is the
// page's own colour (`color: var(--text)` on the SVG), and forced colours never replace a colour an SVG sets for itself.
// With a stored theme opposite the system palette — a Windows contrast theme that is dark while the site was last left in
// light mode, or the reverse — every staff drew navy on black or cream on white (1.28–1.42:1). In forced colours the ink
// now follows the system's text colour, the highlighted and the sounding note its selection colour, the family bars its
// muted one (pattern svg-ink-keeps-the-page-theme-in-forced-colors).
//   Per page × forced colours × (system dark | light) × (stored theme light | dark):
//     ink      — every painted part of every staff (stroke and fill; a line paints no fill) is at least 3:1 on its ground;
//     sounding — one note given the page's own sounding class is at least 3:1 and not the staff's plain ink colour;
//   and per page × (light | dark) WITHOUT forced colours:
//     own      — the staff's ink is still the page's text colour (the rules stay inside the media query).
//   The Trainer's reading is a fixture built from data/trope/trope_phrase_examples.json, as the S570 probes build it.
//
//   node scripts/loop/probes/S666-staff-ink-follows-forced-colours.mjs     exit 1 on a failing cell or a page error
//   ROOT=<a git archive of the tree> runs another copy (the tree before S666 fails every mismatched ink cell).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/trope/trope_phrase_examples.json'), 'utf8')).melodies.torah;
const pick = (re) => rows.filter((r) => re.test(r.k)).flatMap((r) => r.ex.map((e) => e.he));
const open_ = pick(/zakef_katon$/), etn = pick(/etnachta$/), sof = pick(/sof_pasuk$/);
const verses = Array.from({ length: 12 }, (_, i) => `${open_[i % open_.length]} ${etn[i % etn.length]} ${sof[i % sof.length]}`);
const sefaria = (u) => { if (u.includes('/v3/texts/')) { const m = decodeURIComponent(u).match(/texts\/[A-Za-z_]+\.(\d+)\.(\d+)/); return { versions: [{ language: 'he', text: verses }], sections: m ? [m[1], m[2]] : ['1', '1'] }; } return u.includes('/calendars') ? { calendar_items: [] } : []; };

const measure = ([sel, note]) => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const P = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); return m ? m[1].split(/[, \/]+/).map(Number) : null; };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const p = P(getComputedStyle(e).backgroundColor); if (p && (p.length < 4 || p[3] >= 1)) return p; } return P(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255]; };
  const inks = (root, g) => { const out = []; for (const n of root.querySelectorAll('line, path, ellipse, circle, rect, text, polygon')) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue; for (const prop of ['fill', 'stroke']) { if (prop === 'fill' && n.tagName === 'line') continue; const c = P(cs[prop]); if (!c || (c.length === 4 && c[3] === 0)) continue; if (prop === 'stroke' && parseFloat(cs.strokeWidth) === 0) continue; out.push({ k: ratio(c, g), c: c.slice(0, 3).join(','), what: n.tagName + '.' + (n.getAttribute('class') || '') + ' ' + prop }); } } return out; };
  const svgs = [...document.querySelectorAll(sel)].filter((s) => s.getClientRects().length);
  let min = 99, low = 0, parts = 0; const worst = {};
  for (const s of svgs.slice(0, 60)) { const g = bgOf(s); for (const i of inks(s, g)) { parts++; if (i.k < min) min = i.k; if (i.k < 3) { low++; worst[i.what] = +i.k.toFixed(2); } } }
  // one note with the page's own sounding class
  let sound = null; const first = svgs[0], n = first && first.querySelector(note);
  if (n) { const plain = P(getComputedStyle(first).color).slice(0, 3).join(','); n.classList.add('is-sounding'); const got = inks(n, bgOf(first)); n.classList.remove('is-sounding'); sound = { parts: got.length, min: got.length ? Math.min(...got.map((i) => i.k)) : 0, differs: got.some((i) => i.c !== plain) }; }
  return { svgs: svgs.length, parts, low, min: +min.toFixed(2), worst, sound, ink: first ? getComputedStyle(first).color : '', text: getComputedStyle(document.body).color };
};
const PAGES = [
  { file: 'trope_atlas.html', sel: 'svg.tu-pstaff', note: '.tu-pn', ready: () => document.querySelectorAll('#atTable svg.tu-pstaff').length > 100 },
  { file: 'trope_tutor.html', name: 'trope_tutor.html (Learn motifs)', sel: 'svg.tu-motif', note: '.tu-motif-note', ready: () => document.querySelectorAll('svg.tu-motif').length > 0 },
  { file: 'trope_tutor.html', name: 'trope_tutor.html (Phrases)', sel: 'svg.tu-pstaff', note: '.tu-pn', ready: () => true, prep: async (page) => { await page.evaluate(() => { const t = [...document.querySelectorAll('.tu-tab')].find((b) => /phrase/i.test((b.id || '') + (b.dataset.tab || '') + b.textContent)); if (t) t.click(); }); await page.waitForFunction(() => document.querySelectorAll('svg.tu-pstaff').length > 0, null, { timeout: 20000 }); } },
  { file: 'torah_trainer.html', sel: '.tt-staff-sys > svg, .tt-staff-sys > .tt-staff-svg', note: '.tu-pn', ready: () => document.querySelectorAll('.tt-staff-sys svg').length > 0 },
];
const browser = await chromium.launch();
let fails = 0, cells = 0, pageErrors = 0;
const report = (good, msg) => { cells++; if (!good) fails++; console.log(`${good ? 'PASS' : 'FAIL'} ${msg}`); };
async function load(pg, { forced, scheme, stored }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', forcedColors: forced ? 'active' : 'none', colorScheme: scheme });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { pageErrors++; console.log('PAGE ERROR ' + e); });
  await page.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith('https://www.sefaria.org/api/')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(sefaria(u)) }); if (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) r.continue(); else r.abort(); });
  await page.addInitScript(([stored, seed]) => { try { if (sessionStorage.getItem('__s666')) return; sessionStorage.setItem('__s666', '1'); localStorage.setItem('hebrewBlender_darkMode', stored); localStorage.setItem('hebrewBlender_lang', 'en'); localStorage.setItem('hebrewTropeTutor_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_tourSeen', '1'); localStorage.setItem('hebrewTorahTrainer_settings', seed); } catch (e) {} }, [stored, JSON.stringify({ parshahKey: 'Bereshit', scope: 'parsha-full', layout: 'staff' })]);
  await page.goto(BASE + '/' + pg.file, { waitUntil: 'load' });
  await page.waitForFunction(pg.ready, null, { timeout: 60000 });
  if (pg.prep) await pg.prep(page);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300)))));
  const r = await page.evaluate(measure, [pg.sel, pg.note]);
  await ctx.close();
  return r;
}
for (const pg of PAGES) {
  const name = pg.name || pg.file;
  for (const [scheme, stored] of [['dark', '0'], ['light', '1'], ['dark', '1'], ['light', '0']]) {
    const tag = `${name}, forced, system ${scheme}, stored ${stored === '1' ? 'dark' : 'light'}${(scheme === 'dark') !== (stored === '1') ? ' (mismatch)' : ''}`;
    let r; try { r = await load(pg, { forced: true, scheme, stored }); } catch (e) { report(false, `${tag}: did not load (${String(e.message).split('\n')[0]})`); continue; }
    report(r.svgs > 0 && r.parts > 0 && r.low === 0, `${tag} ink: ${r.parts - r.low} of ${r.parts} parts on ${r.svgs} staffs at 3:1 or more (lowest ${r.min}:1)${r.low ? ' ' + JSON.stringify(r.worst).slice(0, 160) : ''}`);
    report(!!r.sound && r.sound.parts > 0 && r.sound.min >= 3 && r.sound.differs, `${tag} sounding: ${r.sound ? `a sounding note's ${r.sound.parts} parts lowest ${r.sound.min.toFixed(2)}:1, ${r.sound.differs ? 'not the plain ink' : 'THE SAME as the plain ink'}` : 'no note found'}`);
  }
  for (const stored of ['0', '1']) {
    let r; try { r = await load(pg, { forced: false, scheme: stored === '1' ? 'dark' : 'light', stored }); } catch (e) { report(false, `${name}, no forced colours: did not load`); continue; }
    report(r.svgs > 0 && r.ink === r.text, `${name}, no forced colours, ${stored === '1' ? 'dark' : 'light'} own: staff ink ${r.ink} ${r.ink === r.text ? '=' : '≠'} page text ${r.text}`);
  }
}
await browser.close(); server.close();
console.log(`${cells - fails} / ${cells} cells pass, ${pageErrors} page errors`);
process.exit(fails || pageErrors ? 1 : 0);
