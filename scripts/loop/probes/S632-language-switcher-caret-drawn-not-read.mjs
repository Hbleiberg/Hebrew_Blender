#!/usr/bin/env node
// S632 — the language switcher's caret is drawn, not read (pattern decorative-glyph-carrier-exposed-to-assistive-tech;
// found running the S563 census's Font Maker arm). js/i18n.js injects `.i18n-switch::after { content:"\25BE" }`, and
// generated text is in the accessibility tree: every page that mounts the switcher exposed a StaticText "▾" beside the
// language menu, which a screen reader reads as "down-pointing triangle". The rule now gives it the empty alt.
//
//   node scripts/loop/probes/S632-language-switcher-caret-drawn-not-read.mjs
//   Every root .html page that mounts the switcher plus one parsha/ page, in EN light 1280 and HE dark 800; index,
//   Hebrew_Font_Maker and letter_learner also in EN dark 800 and HE light 1280. Fresh profile, every foreign origin
//   aborted, SW blocked. Per page: the switcher mounted (a counted handle), CDP Accessibility.getFullAXTree → the count of
//   unignored nodes whose name holds ▾ inside the switcher (prose elsewhere that names a menu by its ▾ is content), the select's own name, and the caret still painted
//   (getComputedStyle(…, '::after').content holds ▾). PIXELS=<git archive of the previous tree>: a 2× clip of the switcher
//   on index in 4 cells is byte-compared with the same clip there (the caret looks the same). Pass = 0 ▾ names on every
//   page, every handle resolved, 0 page errors (and, with PIXELS, 4/4 identical). exit 1 otherwise. ROOT=<a tree> runs
//   another copy (the tree before S632: one ▾ per page).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..');
const ROOT = path.resolve(process.env.ROOT || REPO);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.css': 'text/css', '.wasm': 'application/wasm', '.txt': 'text/plain' };
function serve(root) {
  const server = http.createServer((req, res) => {
    const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, base: `http://127.0.0.1:${server.address().port}` })));
}
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; if (!cond || process.env.VERBOSE) console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const browser = await chromium.launch();
const C2 = [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }];
const C4 = C2.concat([{ lang: 'en', dark: true, w: 800 }, { lang: 'he', dark: false, w: 1280 }]);
const tagOf = c => `${c.lang} ${c.dark ? 'dark' : 'light'} ${c.w}`;
async function open(base, cell, pg) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light', deviceScaleFactor: 2 });
  await ctx.route('**/*', r => { const u = r.request().url(); return u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:') ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark]) => { try { if (!sessionStorage.getItem('__s')) { localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); sessionStorage.setItem('__s', '1'); } } catch (e) {} }, [cell.lang, cell.dark]);
  const page = await ctx.newPage(); page.setDefaultTimeout(30000);
  const errors = []; page.on('pageerror', e => errors.push(String(e).split('\n')[0]));
  await page.goto(`${base}/${pg}`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!document.querySelector('.i18n-switch select'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}
const { server, base } = await serve(ROOT);
const roots = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
const jobs = [];
for (const pg of roots.concat(['parsha/noach.html'])) for (const cell of (['index.html', 'Hebrew_Font_Maker.html', 'letter_learner.html'].includes(pg) ? C4 : C2)) jobs.push([pg, cell]);
let mounted = 0, pages = 0;
for (const [pg, cell] of jobs) {
  const { ctx, page, errors } = await open(base, cell, pg);
  try {
    const h = await page.evaluate(() => { const w = document.querySelector('.i18n-switch'); return w ? { paint: getComputedStyle(w, '::after').content } : null; });
    if (!h) { await ctx.close(); continue; }   // a page without the switcher (a redirect, a harness): nothing to count
    pages++; mounted++;
    const cdp = await ctx.newCDPSession(page);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    // Only what sits inside the switcher counts: prose elsewhere may name a menu by its ▾ (privacy.html's
    // "Load Project ▾ → In your account") and is content, not a carrier.
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.i18n-switch' });
    const swBackend = (await cdp.send('DOM.describeNode', { nodeId })).node.backendNodeId;
    const byId = Object.fromEntries(nodes.map(n => [n.nodeId, n]));
    const inSwitch = n => { for (let p = n; p; p = byId[p.parentId]) if (p.backendDOMNodeId === swBackend) return true; return false; };
    const tri = nodes.filter(n => !n.ignored && n.name && /▾/.test(n.name.value || '') && inSwitch(n));
    const sel = nodes.find(n => n.role && n.role.value === 'combobox' && n.name && /language|שפה/i.test(n.name.value || ''));
    ok(tri.length === 0, `${pg} ${tagOf(cell)}: ${tri.length} ▾ in the accessibility tree${tri.length ? ' (' + tri.map(n => n.role.value).join(', ') + ')' : ''}`);
    ok(/▾|25BE/.test(h.paint), `${pg} ${tagOf(cell)}: the caret still painted (${h.paint})`);
    ok(!sel || !/▾/.test(sel.name.value), `${pg} ${tagOf(cell)}: the select's name ${sel ? JSON.stringify(sel.name.value) : '(not matched)'}`);
  } catch (e) { ok(false, `${pg} ${tagOf(cell)} harness: ${String(e).split('\n')[0]}`); }
  ok(errors.length === 0, `${pg} ${tagOf(cell)}: 0 page errors ${errors.join(' | ')}`);
  await ctx.close();
}
ok(pages >= 20, `handles: the switcher mounted on ${pages} page loads`);
server.close();
if (process.env.PIXELS) {
  const other = await serve(path.resolve(process.env.PIXELS));
  const mine = await serve(ROOT);
  for (const cell of C4) {
    const shots = [];
    for (const s of [mine, other]) {
      const { ctx, page } = await open(s.base, cell, 'index.html');
      const box = await page.locator('.i18n-switch').boundingBox();
      shots.push(await page.screenshot({ clip: { x: box.x - 2, y: box.y - 2, width: box.width + 4, height: box.height + 4 } }));
      await ctx.close();
    }
    ok(shots[0].equals(shots[1]), `index ${tagOf(cell)}: the switcher's pixels identical to the other tree (${shots[0].length} / ${shots[1].length} bytes)`);
  }
  mine.server.close(); other.server.close();
}
await browser.close();
console.log(`${jobs.length} loads, ${pages} with the switcher`);
console.log(fail ? `FAIL ${fail}` : 'PASS');
process.exit(fail ? 1 : 0);
