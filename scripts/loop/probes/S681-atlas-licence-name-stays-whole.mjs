#!/usr/bin/env node
// S681 — the Trope Atlas notes keep the licence name "CC BY-SA 4.0" on one line. In the Hebrew interface the notes'
// transcriptions item broke it at its hyphen ("CC BY-" / "SA 4.0") at 800–1280px; the link is now one unit
// (`white-space:nowrap`), and nothing else in the notes moves.
//
//   node scripts/loop/probes/S681-atlas-licence-name-stays-whole.mjs
//   HE light / HE dark / EN light (the theme and language seeded, the real page), the window every 20px from 320 to
//   1400 (where the name meets a line's end depends on the width and the font): the licence link exists (a handle
//   check) and lays out on 1 line box at every width; the notes list scrolls nothing sideways and the page is no wider
//   than the window; a plant (the link's text with a breakable space in
//   a 60px box) must lay out on 2 lines; 0 page errors. exit 1 when a step fails. ROOT=<a git archive of the tree>
//   runs another copy (the tree before S681: broken in the Hebrew cells — at 390px in the fallback fonts this
//   probe loads, 800–1280px in the real web fonts).
import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = pkg;
const ROOT = path.resolve(process.env.ROOT || path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..', '..'));
let fail = 0;
const ok = (cond, msg) => { if (!cond) fail++; console.log(`${cond ? '✔' : '✘'} ${msg}`); };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let planted = false;
for (const [lang, dark] of [['he', false], ['he', true], ['en', false]]) {
  {
    const tag = `${lang} ${dark ? 'dark' : 'light'}`;
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, serviceWorkers: 'block' });
    await ctx.addInitScript(c => { localStorage.setItem('hebrewBlender_lang', c.lang); localStorage.setItem('hebrewBlender_darkMode', c.dark ? '1' : '0'); }, { lang, dark });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', r => { const u = r.request().url(); return u.startsWith(BASE) || /^(data|blob):/.test(u) ? r.continue() : r.abort(); });
    await page.goto(BASE + '/trope_atlas.html', { waitUntil: 'load' });
    await page.waitForFunction(l => document.documentElement.lang === l && document.querySelector('.at-notes a[href*="creativecommons.org"]'), lang, { timeout: 15000 });
    await page.waitForTimeout(300);
    // Where the name meets a line's end depends on the width and the font, so every 20px from 320 to 1400 is read.
    const broken = [], over = []; let text = '', widths = 0;
    for (let vw = 320; vw <= 1400; vw += 20) {
      await page.setViewportSize({ width: vw, height: 900 }); await page.waitForTimeout(40);
      const r = await page.evaluate(() => {
        const a = document.querySelector('.at-notes a[href*="creativecommons.org"]'), ul = document.querySelector('.at-notes');
        const tops = new Set([...a.getClientRects()].filter(x => x.width > 0).map(x => Math.round(x.top)));
        return { text: a.textContent, lines: tops.size, ulOver: ul.scrollWidth - ul.clientWidth, pageOver: document.documentElement.scrollWidth - innerWidth };
      });
      text = r.text; widths++;
      if (r.lines !== 1) broken.push(vw);
      if (r.ulOver > 0 || r.pageOver > 0) over.push(vw);
    }
    ok(text === 'CC BY-SA 4.0' && widths === 55 && broken.length === 0 && over.length === 0 && errors.length === 0,
      `${tag}, ${widths} widths 320–1400: "${text}" broken across lines at ${broken.length ? broken.join(', ') + 'px' : 'none'}; the notes or the page too wide at ${over.length ? over.join(', ') + 'px' : 'none'}; ${errors.length} page errors`);
    if (!planted) {
      planted = true;
      const lines = await page.evaluate(() => { const d = document.createElement('div'); d.style.cssText = 'width:60px;position:absolute;top:0;left:0'; d.innerHTML = '<a>CC BY-SA 4.0</a>'; document.body.appendChild(d); const n = new Set([...d.firstChild.getClientRects()].map(x => Math.round(x.top))).size; d.remove(); return n; });
      ok(lines === 2, `plant: the same text in a 60px box without the rule lays out on ${lines} lines (the line count can see a break)`);
    }
    await ctx.close();
  }
}
await browser.close(); server.close();
console.log(fail ? `\n${fail} check(s) failed` : '\nall checks passed');
process.exit(fail ? 1 : 0);
