#!/usr/bin/env node
// S628 — the Trope Atlas finds no melody or clause named after a built-in (pass I, the URL-contract arm). Its melodies
// and clause counts were plain objects, so an address `#sys-__proto__` / `#sys-constructor`, or a stored melody of either
// name, passed as a melody: the phrase browser threw "Cannot read properties of undefined (reading 'length')" and stayed
// empty with a blank melody select; a stored clause `constructor` / `__proto__` showed no phrases and no chip pressed.
//
//   node scripts/loop/probes/S628-trope-atlas-built-in-names.mjs
//   EN light 1280 / HE dark 800, a fresh profile per case: 4 addresses and 4 stored settings naming a built-in → 0 errors,
//   the phrase browser on the first melody with its phrases and a clause chip pressed; controls, proving the address and
//   the stored values are read: `#sys-haftarah` and a stored `haftarah` open Haftarah, a stored clause `all` presses All;
//   then a real choice in the melody select still rebuilds the list. exit 1 when a step fails or a handle is missing.
//   ROOT=<a git archive of the tree> runs another copy (the tree before S628: 18 failures, 9 a cell).
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
const browser = await chromium.launch();
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
async function open(cell, hash, stored) {
  const ctx = await browser.newContext({ viewport: { width: cell.w, height: 900 }, serviceWorkers: 'block', colorScheme: cell.dark ? 'dark' : 'light' });
  await ctx.route('**/*', r => { const u = r.request().url(); (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await ctx.addInitScript(([lang, dark, stored]) => { if (sessionStorage.getItem('__s')) return; sessionStorage.setItem('__s', '1'); localStorage.setItem('hebrewBlender_lang', lang); localStorage.setItem('hebrewBlender_darkMode', dark ? '1' : '0'); if (stored) localStorage.setItem('hebrewTropeAtlas_settings', stored); }, [cell.lang, cell.dark, stored]);
  const page = await ctx.newPage(); page.setDefaultTimeout(20000); const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.goto(base + '/trope_atlas.html' + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.I18n && document.querySelectorAll('#atTable table tr, #atTable .at-card').length > 0);
  await page.evaluate(() => window.I18n.ready); await page.waitForTimeout(500);
  return { ctx, page, errors };
}
const read = page => page.evaluate(() => ({
  mel: document.getElementById('atMel').value, opts: document.getElementById('atMel').options.length,
  rows: document.querySelectorAll('#atPhraseRows .at-prow').length, chips: document.querySelectorAll('#atClauses .at-chip').length,
  pressed: [...document.querySelectorAll('#atClauses .at-chip[aria-pressed="true"]')].map(b => b.firstChild && b.firstChild.textContent.trim()),
  head: (document.querySelector('#atMelInfo h3') || {}).textContent || '',
}));
const BUILTIN = [['#sys-__proto__', null], ['#sys-constructor', null], ['#sys-__proto__', '{"mel":"haftarah"}'], ['#sys-constructor', '{"clause":"all"}'],
  ['', '{"mel":"__proto__"}'], ['', '{"mel":"constructor"}'], ['', '{"clause":"constructor"}'], ['', '{"mel":"haftarah","clause":"__proto__"}']];
for (const cell of [{ lang: 'en', dark: false, w: 1280 }, { lang: 'he', dark: true, w: 800 }]) {
  const L = `${cell.lang} ${cell.dark ? 'dark' : 'light'} ${cell.w}`;
  try {
    // controls: the address and the stored values are read
    let o = await open(cell, '#sys-haftarah', null); let r = await read(o.page);
    const ctlA = r.mel === 'haftarah' && r.rows > 0; await o.ctx.close();
    o = await open(cell, '', '{"mel":"haftarah","clause":"all"}'); r = await read(o.page);
    const allLabel = await o.page.evaluate(() => I18n.t('atlas.table.all'));
    const ctlS = r.mel === 'haftarah' && r.pressed.length === 1 && r.pressed[0] === allLabel; await o.ctx.close();
    ok(ctlA && ctlS, `${L}: controls — #sys-haftarah opens Haftarah (${ctlA}); a stored haftarah + all opens it on "${allLabel}" (${ctlS})`);
    for (const [hash, stored] of BUILTIN) {
      o = await open(cell, hash, stored); r = await read(o.page);
      const wantMel = stored && /"mel":"haftarah"/.test(stored) ? 'haftarah' : 'torah';
      ok(o.errors.length === 0 && r.mel === wantMel && r.opts > 5 && r.rows > 0 && r.pressed.length === 1 && r.head.length > 0,
        `${L}: ${hash || '(no address)'} ${stored || ''} → ${o.errors.length} errors, melody "${r.mel}" (want ${wantMel}), ${r.rows} phrases, pressed [${r.pressed.join()}]${o.errors.length ? ' — ' + o.errors[0].slice(0, 70) : ''}`);
      await o.ctx.close();
    }
    // after a built-in address, a real choice in the select still works
    o = await open(cell, '#sys-__proto__', null);
    await o.page.selectOption('#atMel', 'esther'); await o.page.waitForTimeout(400); r = await read(o.page);
    ok(o.errors.length === 0 && r.mel === 'esther' && r.rows > 0 && /#sys-esther$/.test(o.page.url()), `${L}: after #sys-__proto__, choosing Esther → ${r.rows} phrases, the address ${o.page.url().split('#')[1]}`);
    await o.ctx.close();
  } catch (e) { fail++; console.log(`✘ ${L}: ${String(e).split('\n')[0]}`); }
}
await browser.close(); server.close();
console.log(fail ? `FAIL: ${fail}` : 'PASS: a built-in name is no melody and no clause; the first melody opens');
process.exit(fail ? 1 : 0);
