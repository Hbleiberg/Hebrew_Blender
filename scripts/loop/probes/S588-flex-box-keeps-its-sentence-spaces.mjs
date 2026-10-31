#!/usr/bin/env node
// S588 — a flex or grid box makes each child text run an anonymous item and trims the run's edge spaces, so a
// sentence whose words sit beside an inline element inside such a box loses the space between them
// ("Count<span lang=he>וֹ/וּ</span>as a letter" in Flash Cards' vowel options). The census reads every rendered
// flex/grid box with a zero column gap, finds a text run that begins or ends with a space next to an element sibling,
// and measures the painted distance between them in the box's own direction: under 1px is a lost space.
//
//   node scripts/loop/probes/S588-flex-box-keeps-its-sentence-spaces.mjs           Flash Cards, every panel opened,
//          EN/HE × light/dark × 1280/800; exit 1 on any lost space or if the planted control does not fire
//   --all   the suite's root tool and chrome pages (EN/HE × light × 1280), slower
//   ROOT=<a git archive of the tree> runs it on another copy (the control: the tree before the S588 fix reports
//   the vav label in 8/8 cells); --json prints the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ALL = process.argv.includes('--all'), JSON_OUT = process.argv.includes('--json');
const PAGES = ALL ? ['flash_cards', 'hebrew_blend_generator', 'hebrew_dictionary', 'classroom_dashboard', 'torah_trainer', 'trope_tutor', 'trope_atlas', 'Hebrew_Font_Maker', 'letter_learner', 'parsha_emojis', 'name_tags', 'index', 'resources', 'contact', 'privacy', 'terms', '404', 'account'] : ['flash_cards'];
const CELLS = [];
for (const lang of ['en', 'he']) for (const dark of ALL ? [false] : [false, true]) for (const width of ALL ? [1280] : [1280, 800]) CELLS.push({ lang, dark, width, tag: `${lang}-${dark ? 'dark' : 'light'}-${width}` });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const CENSUS = () => {
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (!/flex|grid/.test(cs.display) || (parseFloat(cs.columnGap) || 0) > 0) continue;
    const box = el.getBoundingClientRect(); if (!box.width || !box.height) continue;
    const kids = [...el.childNodes].filter(n => n.nodeType === 3 || (n.nodeType === 1 && getComputedStyle(n).display !== 'none' && !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(n.tagName)));
    const rtl = cs.direction === 'rtl';
    kids.forEach((n, i) => {
      if (n.nodeType !== 3 || !n.data.trim()) return;
      const prev = kids[i - 1], next = kids[i + 1];
      const lead = /^\s/.test(n.data) && prev && prev.nodeType === 1;
      const trail = /\s$/.test(n.data) && next && next.nodeType === 1;
      if (!lead && !trail) return;
      const rg = document.createRange(); rg.selectNodeContents(n); const t = rg.getBoundingClientRect();
      const gapTo = (sib, after) => { const s = sib.getBoundingClientRect(); return after ? (rtl ? t.left - s.right : s.left - t.right) : (rtl ? s.left - t.right : t.left - s.right); };
      if ((lead && gapTo(prev, false) < 1) || (trail && gapTo(next, true) < 1)) out.push({ sel: el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : ''), key: el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html') || '', text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 70) });
    });
  }
  return out;
};
const browser = await chromium.launch();
const hits = new Map(); let errs = 0, plantFired = 0, plantCells = 0;
for (const file of PAGES) for (const c of CELLS) {
  const ctx = await browser.newContext({ viewport: { width: c.width, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/*', r => { const u = r.request().url(); return (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => {
    if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    for (const k of ['hebrewFlashCards_tourSeen', 'hebrewBlender_tourSeen', 'hebrewDictionary_tourSeen', 'hebrewDashboard_tourSeen', 'hebrewTorahTrainer_tourSeen', 'hebrewTropeTutor_tourSeen', 'hebrewLetterLearner_tourSeen']) localStorage.setItem(k, '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
  }, [c.lang, c.dark]);
  const page = await ctx.newPage();
  page.on('pageerror', e => { errs++; if (!JSON_OUT) console.log('pageerror', file, c.tag, String(e).slice(0, 160)); });
  page.on('dialog', d => d.accept());
  await page.goto(`${base}/${file}.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.I18n && document.documentElement.lang, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.I18n && I18n.ready).catch(() => {});
  await page.waitForTimeout(500);
  const plant = file === PAGES[0];
  await page.evaluate(plant => {
    document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'));
    document.querySelectorAll('.panel.collapsed').forEach(p => p.classList.remove('collapsed'));
    if (plant) { const d = document.createElement('div'); d.id = '__plant'; d.style.display = 'flex'; d.innerHTML = 'Planted <b>bold</b> words'; document.body.prepend(d); }
  }, plant);
  let fired = false;
  for (const h of await page.evaluate(CENSUS)) {
    if (h.sel === 'div#__plant') { fired = true; continue; }
    const k = `${file} ${h.sel}`; if (!hits.has(k)) hits.set(k, { file, ...h, cells: [] });
    if (!hits.get(k).cells.includes(c.tag)) hits.get(k).cells.push(c.tag);
  }
  if (fired) plantFired++;
  if (plant) plantCells++;
  await ctx.close();
}
await browser.close(); server.close();
const ok = hits.size === 0 && errs === 0 && plantFired >= plantCells && plantCells > 0;
if (JSON_OUT) console.log(JSON.stringify({ ok, hits: [...hits.values()], pageerrors: errs, plant: `${plantFired}/${plantCells}` }, null, 1));
else {
  for (const h of hits.values()) console.log(`LOST SPACE ${h.file} ${h.sel} [${h.key}] "${h.text}" — ${h.cells.length} cells`);
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${hits.size} lost-space boxes over ${PAGES.length} page(s) × ${CELLS.length} cells; control ${plantFired}/${plantCells}; ${errs} page errors`);
}
process.exit(ok ? 0 : 1);
