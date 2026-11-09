#!/usr/bin/env node
// S634 (pass C on name_tags.html; found there, fixed on every carrier) — seven links that open a new tab showed "↗"
// after their words, and that string was their whole name: a screen reader read "Open Name Tags north east arrow" and
// never that a tab opens. Each now carries an `_aria` twin, the Trainer's and Parsha Emojis' precedent: the visible
// words without the arrow, then "(opens in a new tab)" / "(נפתח בכרטיסייה חדשה)" — the label still starts with what
// is on screen (WCAG 2.5.3).
//
// Each link reached through its page's real path in EN light 1280 and HE dark 800: Name Tags' From the Classroom
// Dashboard box by a click (its link to the dashboard); the dashboard's Student Picker settings (its Open Name Tags,
// shown on a device holding Name Tags lists) and its parasha popup's two links (static markup, read after the
// language applies); the dictionary's word window by a click on a word; the Font Maker's starting-font picker through
// `osPickOpen` (its partner link); the Trainer's Total Torah credit line through `ttCreditHTML` with a video id (the
// YouTube link, built where the reader shows it). A visible link is read from Chromium's accessibility tree; a link
// inside a closed popup by its attribute.
//
//   node scripts/loop/probes/S634-new-tab-links-name-the-new-tab.mjs
//   exit 1 when a link's name carries ↗, lacks the new-tab words, does not start with its visible words, or a handle is
//   missing. ROOT=<a git archive of the tree> runs another copy (the tree before S634 fails all seven); --json prints
//   the record.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const JSON_OUT = process.argv.includes('--json');
const NEWTAB = { en: '(opens in a new tab)', he: '(נפתח בכרטיסייה חדשה)' };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css', '.txt': 'text/plain', '.otf': 'font/otf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const NT_LIST = JSON.stringify({ 'Class 3B': { v: 1, rows: [{ he: 'דָּוִד', en: 'David' }], extra: '' } });
const DASH = JSON.stringify({ rosters: { c1: { name: 'Grade 3', names: ['דָּוִד David'] } }, activeRosterId: 'c1' });
// [label, page, seed, reach(page) → the link's selector, how the name is read]
const LINKS = [
  ['Name Tags: Open the Classroom Dashboard\'s class lists', 'name_tags.html', { hebrewNameTags_lists: NT_LIST, hebrewNameTags_activeList: 'Class 3B', hebrewNameTags_tourSeen: '1', hebrewDashboard_settings: DASH },
    async (p) => { await p.click('#ntDashOpen'); await p.waitForSelector('#ntDashRow:not([hidden])'); return '#ntDashLink'; }, 'ax'],
  ['Dashboard: Open Name Tags', 'classroom_dashboard.html', { hebrewNameTags_lists: NT_LIST, hebrewDashboard_tourSeen: '1', hebrewDashboard_firstRunSeen: '1', hebrewDashboard_setupSeen: '1' }, async () => '#pickerNtLink', 'attr'],
  ['Dashboard: View in Torah Trainer', 'classroom_dashboard.html', { hebrewDashboard_tourSeen: '1', hebrewDashboard_firstRunSeen: '1', hebrewDashboard_setupSeen: '1' }, async () => '#ppTrainer', 'attr'],
  ['Dashboard: Open Parsha Emojis', 'classroom_dashboard.html', { hebrewDashboard_tourSeen: '1', hebrewDashboard_firstRunSeen: '1', hebrewDashboard_setupSeen: '1' }, async () => '#ppEmojis', 'attr'],
  ['Dictionary: Look up on Google', 'hebrew_dictionary.html', { hebrewDictionary_tourSeen: '1' },
    async (p) => { await p.waitForSelector('.word-card', { timeout: 15000 }); await p.click('.word-card'); await p.waitForSelector('.wm-google', { timeout: 5000 }); return '.wm-google'; }, 'ax'],
  ['Font Maker: About these fonts', 'Hebrew_Font_Maker.html', { hebrewFontMaker_wizardSeen: '1', hebrewFontMaker_tourSeen: '1' },
    async (p) => { await p.evaluate(() => osPickOpen('new')); await p.waitForSelector('#osPickIntro a', { timeout: 10000 }); return '#osPickIntro a'; }, 'ax'],
  ['Torah Trainer: Watch the full aliyah on YouTube', 'torah_trainer.html', { hebrewTorahTrainer_tourSeen: '1' },
    async (p) => { await p.evaluate(() => { const d = document.createElement('div'); d.id = 'probeCredit'; d.innerHTML = ttCreditHTML({ video: 'abcdefghijk' }, null); document.body.prepend(d); }); return '#probeCredit .tt-credit-yt'; }, 'ax'],
];
const records = []; let fail = 0;
for (const [label, pg, seed, reach, how] of LINKS) for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(String(e))); page.on('dialog', d => d.accept());
  await page.route('**/*', r => { const u = r.request().url(); (u.startsWith(BASE) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.addInitScript(([seed, lang, dark]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1');
    localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0');
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v); }, [seed, cell.lang, cell.dark]);
  const rec = { link: label, cell: tag, ok: false };
  try {
    await page.goto(`${BASE}/${pg}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.I18n); await page.evaluate(() => I18n.ready); await page.waitForLoadState('load'); await page.waitForTimeout(700);
    await page.evaluate(() => { document.querySelectorAll('.overlay.open,.fr-modal.open,#frBackdrop.open').forEach(o => o.classList.remove('open')); });
    const sel = await reach(page);
    const el = page.locator(sel).first();
    if (!(await el.count())) throw new Error('handle missing: ' + sel);
    rec.visible = (await el.textContent()).trim();
    if (how === 'ax') {
      await el.evaluate(n => n.setAttribute('data-probe-link', '1'));
      const cdp = await ctx.newCDPSession(page); await cdp.send('Accessibility.enable'); await cdp.send('DOM.enable');
      const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
      const q = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '[data-probe-link]' });
      const back = (await cdp.send('DOM.describeNode', { nodeId: q.nodeId })).node.backendNodeId;
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { backendNodeId: back, fetchRelatives: false });
      const n = nodes.find(x => x.backendDOMNodeId === back) || nodes[0];
      rec.role = n && n.role && n.role.value; rec.name = n && n.name ? n.name.value : null;
    } else rec.name = await el.getAttribute('aria-label') || rec.visible;
    const words = rec.visible.replace(/\s*↗\s*$/, '').trim();
    rec.ok = !!rec.name && !/↗/.test(rec.name) && rec.name.includes(NEWTAB[cell.lang]) && rec.name.startsWith(words) && (how !== 'ax' || rec.role === 'link');
  } catch (e) { rec.error = String(e).slice(0, 200); }
  rec.pageErrors = errors.length; if (errors.length) { rec.ok = false; rec.errors = errors.slice(0, 3); }
  if (!rec.ok) fail++;
  records.push(rec); await ctx.close();
}
await browser.close(); server.close();
if (JSON_OUT) console.log(JSON.stringify(records, null, 1));
else { for (const r of records) console.log(`${r.ok ? '✔' : '✘'} ${r.cell} — ${r.link}: ${JSON.stringify({ name: r.name, visible: r.visible, error: r.error, pageErrors: r.pageErrors })}`); console.log(fail ? `FAIL: ${fail} step(s)` : 'PASS: all seven links in both cells'); }
process.exit(fail ? 1 : 0);
