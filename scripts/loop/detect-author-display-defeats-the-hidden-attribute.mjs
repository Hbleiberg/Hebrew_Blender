#!/usr/bin/env node
// Detector for the loop pattern `author-display-defeats-the-hidden-attribute` (docs/reference/loop-patterns.md).
//
// Shape: an element carries the `hidden` attribute, but an author rule (`.row { display:flex }`, an id rule,
// a class added later) outranks the user-agent's `[hidden] { display:none }`, so the "hidden" element shows —
// usually an empty row, a stray button or a second copy of a control. Fix shape: the page's own
// `X[hidden] { display:none }` (or `:not([hidden])` on the author rule), never removing the attribute.
//
// Rendered: an in-process static server over the repo root, Chromium with every foreign origin aborted and the
// service worker blocked, each root page at 1280×800 and 800×800 after its load settles; a hit is an element
// with `hidden` (not `until-found`) whose computed `display` is not `none`, outside an <svg>/<template>.
// Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], delta }
//   --plant  loads one page with a planted `<div class="plant" hidden>` under `.plant{display:block}` and
//            must report it (exit 1 if it does not)
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const ID = 'author-display-defeats-the-hidden-attribute';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');
const PW = ['/opt/node22/lib/node_modules/playwright/index.js', 'playwright'];
let chromium;
for (const p of PW) { try { chromium = (p.startsWith('/') ? (await import(p)).default : createRequire(import.meta.url)(p)).chromium; break; } catch (e) {} }
if (!chromium) { console.log(`${ID}: Playwright not found — skipped.`); process.exit(0); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const PLANT_HTML = '<style>.plant{display:block}</style><div class="plant" hidden>plant</div>';
const server = createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = normalize(join(root, u === '/' ? 'index.html' : u));
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  let body = readFileSync(f);
  if (PLANT && u === '/index.html') body = Buffer.from(body.toString('utf8').replace('</body>', PLANT_HTML + '</body>'));
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const pages = PLANT ? ['index.html'] : readdirSync(root).filter(f => f.endsWith('.html')).sort();
const browser = await chromium.launch();
const hits = [];
for (const width of PLANT ? [1280] : [1280, 800]) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width, height: 800 } });
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  for (const file of pages) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${base}/${file}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1200);
      const found = await page.evaluate(() => [...document.querySelectorAll('[hidden]')]
        .filter(e => e.getAttribute('hidden') !== 'until-found' && !e.closest('svg, template') && getComputedStyle(e).display !== 'none')
        .map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '') + ' display:' + getComputedStyle(e).display));
      for (const note of found) if (!hits.some(h => h.file === file && h.note === note)) hits.push({ file, line: 0, note: `${note} (at ${width}px)` });
    } catch (e) { hits.push({ file, line: 0, note: `load failed: ${String(e.message).split('\n')[0]}` }); }
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();

if (PLANT) {
  const ok = hits.some(h => /\.plant /.test(h.note));
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported (${hits.length} hit(s) with it).` : `${ID}: PLANT NOT REPORTED.`);
  process.exit(ok ? 0 : 1);
}
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s) over ${pages.length} pages × 2 widths.`); for (const h of hits) console.log(`  ${h.file} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
