#!/usr/bin/env node
// Detector for the loop pattern `restore-step-undoes-a-saved-choice` (docs/reference/loop-patterns.md).
//
// Shape: a page's restore (applySettings) sets a control from the saved state and a LATER step of the same restore —
// a mode or drill setter written for a click, a visibility pass — puts a default back over it, or reads the page's
// old mode while the new one is half applied. The saved state is right; what the teacher sees after a preset load,
// the remembered setup, a share link or an .ivrit file is not, and the next save (signed in: the next sync) writes
// the wrong value back. Fix shape: restore the fields a setter defaults AFTER it has run, and leave the old mode
// before setting what only shows in the new one.
//
// Rendered: an in-process static server over the repo root, Chromium with every foreign origin aborted and the service
// worker blocked, the three pages with a global getSettings / applySettings pair. On hebrew_blend_generator.html three
// deterministic arms, each "save s = getSettings(), move the page elsewhere, applySettings(s), read getSettings()
// again" — a hit is any field that comes back different:
//   1. per Real Words drill × each display control (the two switches, their placements, the star and its placement,
//      Mix), flipped by a click on the visible control, restored over the pristine page;
//   2. a load matrix: the page in Blends / Real Words / Number Practice × a saved blend type × the remembered drill;
//   3. seeded random walks over the visible sidebar controls, a second walk, then the first state over it.
// On flash_cards.html and classroom_dashboard.html (added S666) the walk arm alone, each control group equally likely:
// Flash Cards over the setup screen's controls (150 walks, each state also restored over the pristine page), the
// dashboard over five tabs of its settings drawer (Display, Calendar, Weather, Class, Text; 100 walks) — class lists,
// the schedule, presets, fonts and the message editor are left alone (they are not one-click states).
// Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], measured, delta }
//   --plant  wraps each page's applySettings so it ends by putting one control back (the generator's Show
//            Transliteration, Flash Cards' Inverse switch, the dashboard's Omer line) and must report all three
//            (exit 1 if not)
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const ID = 'restore-step-undoes-a-saved-choice';
const root = process.env.ROOT || join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');
const FILE = 'hebrew_blend_generator.html';
const PW = ['/opt/node22/lib/node_modules/playwright/index.js', 'playwright'];
let chromium;
for (const p of PW) { try { chromium = (p.startsWith('/') ? (await import(p)).default : createRequire(import.meta.url)(p)).chromium; break; } catch (e) {} }
if (!chromium) { console.log(`${ID}: Playwright not found — skipped.`); process.exit(0); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = normalize(join(root, u === '/' ? 'index.html' : u));
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => { try { localStorage.setItem('hebrewBlender_tourSeen', '1'); } catch (e) {} window.print = () => {}; });
await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
const page = await ctx.newPage();
const errors = []; page.on('pageerror', e => errors.push(String(e.message || e))); page.on('dialog', d => d.dismiss().catch(() => {}));
let out = null, loadErr = null;
try {
  await page.goto(`${base}/${FILE}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(() => typeof getSettings === 'function' && typeof applySettings === 'function' && typeof SHARE_DEFAULTS === 'object' && !!SHARE_DEFAULTS, null, { timeout: 20000 });
  await page.waitForTimeout(600);
  if (PLANT) await page.evaluate(() => {
    const real = applySettings;
    // eslint-disable-next-line no-global-assign
    applySettings = function (s) { real(s); document.getElementById('rwShowTranslit').checked = true; };
  });
  out = await page.evaluate(async (PLANT) => {
    const tick = () => new Promise(r => setTimeout(r, 0));
    const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const clone = o => JSON.parse(JSON.stringify(o));
    const pristine = clone(SHARE_DEFAULTS);
    const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    const hits = []; let measured = 0;
    const note = (arm, where, a, b, keys) => hits.push(`${arm}: ${where} — ` + keys.slice(0, 4).map(k => `${k} ${JSON.stringify(a[k])} → ${JSON.stringify(b[k])}`).join(', ') + (keys.length > 4 ? ` (+${keys.length - 4})` : ''));
    const rwBtn = () => document.querySelector('.blend-type-btn[data-type="realwords"]');
    const drills = [...document.querySelectorAll('.rw-drill-btn[data-drill]')].map(b => b.dataset.drill);
    if (!rwBtn() || drills.length < 8) return { hits: ['probe: the Real Words button or the drill row did not resolve'], measured: 0 };

    // arm 1 — one display control at a time, per drill
    const acts = {
      rwShowTranslit: () => document.getElementById('rwShowTranslit'),
      rwShowTranslation: () => document.getElementById('rwShowTranslation'),
      rwTranslitPage: () => [...document.querySelectorAll('[data-translit]')].find(b => vis(b) && !b.classList.contains('active')),
      rwTranslPage: () => [...document.querySelectorAll('[data-transl]')].find(b => vis(b) && !b.classList.contains('active')),
      rwStarReal: () => document.getElementById('rwStarReal'),
      rwStarPage: () => [...document.querySelectorAll('[data-star]')].find(b => vis(b) && !b.classList.contains('active')),
      rwMixed: () => document.getElementById('rwMixed'),
    };
    for (const d of drills) for (const f of Object.keys(acts)) {
      applySettings(clone(pristine)); await tick();
      rwBtn().click(); await tick();
      document.querySelector('.rw-drill-btn[data-drill="' + d + '"]').click(); await tick();
      const def = getSettings(), el = acts[f]();
      if (!vis(el)) continue;
      el.click(); await tick();
      const s = clone(getSettings());
      if (JSON.stringify(s[f]) === JSON.stringify(def[f])) continue;   // the click changed nothing here
      measured++;
      applySettings(clone(pristine)); await tick();
      applySettings(clone(s)); await tick();
      const keys = diff(s, getSettings());
      if (keys.length) note('control', `${d} / ${f}`, s, getSettings(), keys);
    }
    if (PLANT) return { hits, measured };

    // arm 2 — the load matrix
    for (const cur of ['blends', 'realwords', 'numbers']) for (const t of ['two', 'one', 'three', 'nikud']) for (const mem of ['reading', 'numpractice']) {
      const saved = Object.assign({}, clone(pristine), { blendType: t, rwDrillType: mem, numberPractice: false, realWords: false });
      applySettings(clone(pristine)); await tick();
      if (cur !== 'blends') { rwBtn().click(); await tick(); document.querySelector('.rw-drill-btn[data-drill="' + (cur === 'numbers' ? 'numpractice' : 'reading') + '"]').click(); await tick(); }
      applySettings(clone(saved)); await tick();
      measured++;
      const back = getSettings(), keys = diff(saved, back);
      const shown = (document.querySelector('.blend-type-btn.active[data-type]') || { dataset: {} }).dataset.type;
      if (keys.length || shown !== t) note('matrix', `a ${t} setup (drill remembered: ${mem}) over a page in ${cur}, button shown: ${shown}`, saved, back, keys);
    }

    // arm 3 — seeded walks: state A, a second walk, then A over it
    let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const side = document.getElementById('appSidebar');
    const SKIP = /generate|print|export|pdf|preset|share|copy|tour|reset|import|backup|ivrit|fresh|keyboard|upload|font/i;
    const step = () => {
      const cands = [...side.querySelectorAll('button.blend-type-btn, button.rw-drill-btn, input[type=checkbox], select')]
        .filter(e => !e.disabled && (e.type === 'checkbox' && e.closest('label') ? vis(e.closest('label')) : vis(e)) && !SKIP.test((e.id || '') + ' ' + (e.getAttribute('onclick') || '') + ' ' + (e.className || '')) && !e.closest('#panelPresets, #panelAdvanced, .ivrit-wrap'));
      if (!cands.length) return '';
      const e = cands[Math.floor(rnd() * cands.length)];
      try { if (e.tagName === 'SELECT') { const os = [...e.options].filter(o => !o.disabled); e.value = os[Math.floor(rnd() * os.length)].value; e.dispatchEvent(new Event('change', { bubbles: true })); } else e.click(); } catch (err) {}
      return e.id || (e.dataset && (e.dataset.drill || e.dataset.type || e.dataset.translit || e.dataset.transl || e.dataset.star)) || '';
    };
    if (!side) return { hits: ['probe: #appSidebar did not resolve'], measured };
    let clicks = 0;
    for (let w = 0; w < 120; w++) {
      applySettings(clone(pristine)); await tick();
      const trail = [];
      for (let i = 0; i < 12; i++) { trail.push(step()); clicks++; await tick(); }
      const s = clone(getSettings());
      for (let i = 0; i < 8; i++) { step(); await tick(); }
      applySettings(clone(s)); await tick();
      measured++;
      const keys = diff(s, getSettings());
      if (keys.length) note('walk', trail.filter(Boolean).join(' > '), s, getSettings(), keys);
    }
    if (clicks < 1000) hits.push('probe: the walks made only ' + clicks + ' clicks');
    return { hits, measured };
  }, PLANT);
} catch (e) { loadErr = String(e.message || e).split('\n')[0]; }

// The walk arm on the two other pages with the pair. `conf` is plain data; the walk itself runs in the page.
const EXTRA = [
  { file: 'flash_cards.html', seen: ['hebrewFlashCards_tourSeen'], walks: 150, first: 10, more: 8, overPristine: true, root: '#mainContent', panels: '',
    skip: 'start|print|export|pdf|preset|share|copy|tour|reset|import|backup|ivrit|keyboard|upload|font|home|dark|lang|fullscreen|sheet|delete|save|wl|wordlist|report|progress|student|profile|hear|speak|tts|close|clear|install|account|hkToggle|ft-',
    outside: '.ivrit-box, .overlay, [role=dialog], .hk-panel, header, footer, .tour-card, #hebFontGrid, #engFontGrid', ignore: [],
    plant: () => { const real = applySettings; applySettings = function (s) { real(s); document.getElementById('inverseToggle').click(); }; }, plantRe: /inverse (true|false) → (true|false)/ },
  { file: 'classroom_dashboard.html', seen: ['hebrewDashboard_tourSeen', 'hebrewDashboard_setupSeen'], walks: 100, first: 10, more: 8, overPristine: false, root: '#settingsModal', panels: '.tt-tabpanel:not([hidden]) ', tabs: ['display', 'calendar', 'weather', 'class', 'text'],
    skip: 'print|export|pdf|preset|share|copy|tour|reset|import|backup|ivrit|keyboard|upload|font|home|dark|lang|fullscreen|delete|save|close|clear|install|account|hkToggle|ft-|bpe|roster|class|student|picker|sched|geo|locat|zip|city|video|youtube|nametag|erase|remove|add|move|ed-btn|test',
    outside: '.tip-wrap', ignore: ['dashTextHTML'],
    plant: () => { const real = applySettings; applySettings = function (s, o) { real(s, o); settings.showOmer = !settings.showOmer; }; }, plantRe: /showOmer (true|false) → (true|false)/ },
];
const extra = [];
for (const conf of EXTRA) {
  const c2 = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await c2.addInitScript((keys) => { try { for (const k of keys) localStorage.setItem(k, '1'); } catch (e) {} window.print = () => {}; }, conf.seen);
  await c2.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  const p2 = await c2.newPage();
  p2.on('pageerror', e => errors.push(conf.file + ': ' + String(e.message || e))); p2.on('dialog', d => d.dismiss().catch(() => {}));
  let res = null, err = null;
  try {
    await p2.goto(`${base}/${conf.file}`, { waitUntil: 'load', timeout: 30000 });
    await p2.waitForFunction(() => typeof getSettings === 'function' && typeof applySettings === 'function', null, { timeout: 20000 });
    await p2.waitForTimeout(1200);
    await p2.evaluate(() => { try { if (typeof frSkip === 'function' && document.querySelector('#frModal.open')) frSkip(); } catch (e) {} });
    if (PLANT) await p2.evaluate(conf.plant);
    res = await p2.evaluate(async ({ conf, walks }) => {
      const tick = () => new Promise(r => setTimeout(r, 0));
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
      const clone = o => JSON.parse(JSON.stringify(o));
      const pristine = clone(getSettings());
      const IGN = new Set(conf.ignore), SKIP = new RegExp(conf.skip, 'i');
      const diff = (a, b) => [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(k => !IGN.has(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k]));
      const root = document.querySelector(conf.root);
      if (!root) return { hits: ['probe: ' + conf.root + ' did not resolve'], measured: 0, clicks: 0 };
      const sel = ['button', 'input[type=checkbox]', 'input[type=radio]', 'select', '.pill', '[role=button]', '[role=switch]'].map(x => conf.panels + x).join(', ');
      const cands = () => [...root.querySelectorAll(sel)].filter(e => !e.disabled && e.getAttribute('aria-disabled') !== 'true'
        && ((/checkbox|radio/.test(e.type || '') && e.closest('label')) ? vis(e.closest('label')) : vis(e))
        && !SKIP.test((e.id || '') + ' ' + (e.getAttribute('onclick') || '') + ' ' + (typeof e.className === 'string' ? e.className : '') + ' ' + (e.dataset ? Object.keys(e.dataset).join(' ') : ''))
        && !e.closest(conf.outside));
      const key = x => x.id || (x.dataset && Object.keys(x.dataset)[0]) || (typeof x.className === 'string' ? x.className.split(' ')[0] : '') || x.tagName;
      const name = e => e.id || (e.dataset && Object.entries(e.dataset).filter(([k]) => !/^i18n/.test(k)).map(([k, v]) => k + '=' + v).join(',')) || key(e);
      let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      const hits = []; let measured = 0, clicks = 0;
      const step = async () => {
        if (conf.tabs) { if (!root.classList.contains('open')) openSettings(); setSettingsTab(conf.tabs[Math.floor(rnd() * conf.tabs.length)]); await tick(); }
        const groups = {}; for (const c of cands()) (groups[key(c)] = groups[key(c)] || []).push(c);
        const gs = Object.keys(groups); if (!gs.length) return '';
        const g = groups[gs[Math.floor(rnd() * gs.length)]], e = g[Math.floor(rnd() * g.length)];
        try { if (e.tagName === 'SELECT') { const os = [...e.options].filter(o => !o.disabled); e.value = os[Math.floor(rnd() * os.length)].value; e.dispatchEvent(new Event('change', { bubbles: true })); } else e.click(); } catch (err) {}
        clicks++; await tick(); return name(e);
      };
      const say = (s, back, keys) => keys.slice(0, 4).map(k => `${k} ${JSON.stringify(s[k]).slice(0, 80)} → ${JSON.stringify(back[k]).slice(0, 80)}`).join(', ') + (keys.length > 4 ? ` (+${keys.length - 4})` : '');
      for (let w = 0; w < walks; w++) {
        applySettings(clone(pristine)); await tick();
        const trail = []; for (let i = 0; i < conf.first; i++) trail.push(await step());
        const s = clone(getSettings());
        for (let i = 0; i < conf.more; i++) await step();
        applySettings(clone(s)); await tick(); measured++;
        let back = getSettings(), keys = diff(s, back);
        if (keys.length) hits.push('walk: ' + trail.filter(Boolean).join(' > ') + ' — ' + say(s, back, keys));
        if (conf.overPristine) { applySettings(clone(pristine)); await tick(); applySettings(clone(s)); await tick(); measured++; back = getSettings(); keys = diff(s, back); if (keys.length) hits.push('walk (over the pristine page): ' + trail.filter(Boolean).join(' > ') + ' — ' + say(s, back, keys)); }
      }
      if (clicks < walks * conf.first * 0.8) hits.push('probe: the walks made only ' + clicks + ' clicks');
      return { hits, measured, clicks };
    }, { conf: { root: conf.root, panels: conf.panels, tabs: conf.tabs || null, skip: conf.skip, outside: conf.outside, ignore: conf.ignore, first: conf.first, more: conf.more, overPristine: conf.overPristine }, walks: PLANT ? 6 : conf.walks });
  } catch (e) { err = String(e.message || e).split('\n')[0]; }
  extra.push({ conf, res, err });
  await c2.close();
}
await browser.close(); server.close();

const hits = (out ? out.hits : []).map(n => ({ file: FILE, line: 0, note: n }));
if (loadErr) hits.push({ file: FILE, line: 0, note: 'load failed: ' + loadErr });
for (const e of errors) hits.push({ file: FILE, line: 0, note: 'page error: ' + e });
let measured = out ? out.measured : 0;
const per = [`${FILE} ${measured}`];
let unmeasured = !measured;
for (const x of extra) {
  if (x.err) hits.push({ file: x.conf.file, line: 0, note: 'load failed: ' + x.err });
  for (const n of (x.res ? x.res.hits : [])) hits.push({ file: x.conf.file, line: 0, note: n });
  const m = x.res ? x.res.measured : 0; measured += m; per.push(`${x.conf.file} ${m}`); if (!m) unmeasured = true;
}
if (PLANT) {
  const missed = [];
  if (!hits.some(h => h.file === FILE && /rwShowTranslit false → true/.test(h.note))) missed.push(FILE);
  for (const x of extra) if (!hits.some(h => h.file === x.conf.file && x.conf.plantRe.test(h.note))) missed.push(x.conf.file);
  const ok = !missed.length;
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported on all three pages (${hits.length} hit(s) with it).` : `${ID}: PLANT NOT REPORTED on ${missed.join(', ')}.`);
  process.exit(ok ? 0 : 1);
}
if (unmeasured) { console.log(`${ID}: nothing measured on a page (${per.join(', ')}) — the probe did not resolve.`); process.exit(1); }
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, measured, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s) over ${measured} save-and-restore round trips (${per.join(', ')}).`); for (const h of hits) console.log(`  ${h.file} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
