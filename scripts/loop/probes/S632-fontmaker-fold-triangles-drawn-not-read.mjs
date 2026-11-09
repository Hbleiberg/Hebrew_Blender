#!/usr/bin/env node
// S632 — the Font Maker's fold triangles are drawn, not read (pattern decorative-glyph-carrier-exposed-to-assistive-tech;
// the S563 census's last page, "count it with a project open"). The Points step's disclosures (Transform, Round corners,
// Reduce points, Contours: `.npnl-disc summary::before`, ▸) carried the triangle in their accessible names
// ("▸ Transform"); `.panel-title::after` (▾) is the same carrier on the category panels, display:none in the tabbed
// layout today. Both take the empty alt, the form the other tool pages' panel triangles took in S587–S595.
//
//   node scripts/loop/probes/S632-fontmaker-fold-triangles-drawn-not-read.mjs
//   EN light 1280 / HE dark 800 / EN dark 800 / HE light 1280, a fresh profile, every foreign origin aborted, SW blocked.
//   A Drawing-mode project made through the onboarding wizard by real clicks. The real carriers are out of reach there
//   (the Points step's disclosures need a letter with outlines; the category titles are display:none in the tabbed
//   layout), so both are built in the visible category host as the page builds them — four <details class="node-xform
//   npnl-disc"><summary>…</summary> and a .panel > .panel-title — under the page's own stylesheet. CDP
//   Accessibility.getFullAXTree: the four disclosures' names and the title's, and the count of names holding ▾ / ▸
//   anywhere on the page. Pass = at least 4 disclosures counted, none of their
//   names and not the title's holding a triangle, 0 triangle names in the whole tree, both triangles still painted
//   (::before / ::after content), 0 page errors. exit 1 otherwise. ROOT=<a git archive of the tree> runs another copy.
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ROOT = path.resolve(process.env.ROOT || REPO);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css', '.wasm': 'application/wasm', '.txt': 'text/plain' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TRI = /[▾▸◂▴]/;
const browser = await chromium.launch();
const CELLS = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }, { lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }];
for (const cell of CELLS) {
  const tag = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { if (!sessionStorage.getItem('__s')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); localStorage.setItem('hebrewFontMaker_tourSeen', '1'); sessionStorage.setItem('__s', '1'); } }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  try {
    await page.goto(`${base}/Hebrew_Font_Maker.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('wizardOverlay')?.classList.contains('open'), null, { timeout: 30000 });
    await page.fill('#wizName', 'Probe'); await page.fill('#wizAuthor', 'Loop');
    for (let i = 0; i < 6; i++) {   // the wizard's steps by real clicks: Next until Drawing mode and Create show
      const st = await page.evaluate(() => ({ next: !!document.getElementById('wizNext')?.getClientRects().length, create: !!document.getElementById('wizCreate')?.getClientRects().length, draw: !!document.querySelector('.wiz-tile:has(#wizSrcDraw)')?.getClientRects().length }));
      if (st.draw) await page.click('.wiz-tile:has(#wizSrcDraw)');
      if (st.create) { await page.click('#wizCreate'); break; }
      if (st.next) await page.click('#wizNext');
      await page.waitForTimeout(300);
    }
    await page.waitForFunction(() => typeof project === 'object' && project && Object.keys(project.letters || {}).length > 10, null, { timeout: 30000 });
    await page.waitForTimeout(600);
    const h = await page.evaluate(() => {
      // The Points step's disclosures need a letter with outlines and the category titles are display:none in the tabbed
      // layout, so the carriers are built here as the page builds them — nodeEditPanelHTML's
      // <details class="node-xform npnl-disc"><summary>…</summary>, and a .panel > .panel-title — and put in the visible
      // category host (the sidebar itself is hidden in that layout), under the page's own stylesheet. Any real ones on screen are counted too.
      const host = [document.getElementById('catHost'), document.querySelector('.app'), document.body].find(e => e && e.getBoundingClientRect().width > 100);
      const wrap = document.createElement('div'); wrap.id = 'probeCarriers';
      wrap.innerHTML = '<div class="panel"><div class="panel-title">Probe panel</div><div class="panel-body">x</div></div>'
        + ['Transform', 'Round corners', 'Reduce points', 'Contours'].map(t => '<details class="node-xform npnl-disc" open><summary>' + t + '</summary><div>x</div></details>').join('');
      host.prepend(wrap);
      const t = wrap.querySelector('.panel-title'), s = wrap.querySelector('.npnl-disc summary');
      return { discs: document.querySelectorAll('.npnl-disc summary').length, title: t.textContent.trim(),
        shown: t.getBoundingClientRect().width > 0 && s.getBoundingClientRect().width > 0,
        paintT: getComputedStyle(t, '::after').content, paintS: getComputedStyle(s, '::before').content };
    });
    await page.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const live = nodes.filter(n => !n.ignored && n.name && typeof n.name.value === 'string');
    const tri = live.filter(n => TRI.test(n.name.value));
    const summaries = live.filter(n => n.role && /DisclosureTriangle/i.test(n.role.value) && /Transform|Round corners|Reduce points|Contours/.test(n.name.value)).map(n => n.name.value);
    const title = live.find(n => /Probe panel/i.test(n.name.value) && n.role && n.role.value !== 'InlineTextBox');
    ok(!!h && h.shown && h.discs >= 4 && summaries.length >= 4, `${tag} handles: ${h ? h.discs : '—'} .npnl-disc summaries on screen, ${summaries.length} read as disclosures; title "${h && h.title}"`);
    ok(summaries.length > 0 && !summaries.some(n => TRI.test(n)), `${tag} disclosure names: ${summaries.map(n => JSON.stringify(n)).join(', ')}`);
    ok(!!title && !TRI.test(title.name.value), `${tag} panel title name: ${title ? JSON.stringify(title.name.value) : '(not found)'}`);
    ok(tri.length === 0, `${tag} names with a triangle in the whole tree: ${tri.length}${tri.length ? ' — ' + [...new Set(tri.map(n => n.role.value + ':' + n.name.value.slice(0, 30)))].slice(0, 6).join(' | ') : ''}`);
    ok(!!h && /▾/.test(String(h.paintT)) && /▸/.test(String(h.paintS)), `${tag} still drawn: title ${h && h.paintT}, disclosure ${h && h.paintS}`);
  } catch (e) { ok(false, `${tag} harness: ${String(e).split('\n')[0]}`); }
  ok(errors.length === 0, `${tag} 0 page errors ${errors.join(' | ')}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
