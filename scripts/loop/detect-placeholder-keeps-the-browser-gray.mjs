#!/usr/bin/env node
// Detector for the loop pattern `placeholder-keeps-the-browser-gray` (docs/reference/loop-patterns.md).
//
// Shape: a text field's placeholder keeps the browser's default gray (or a page token that is too faint), so the
// hint reads below 4.5:1 against the field — on the suite's cream fields and in dark mode most of all, where the
// UA gray sits on a navy field. Fix shape: the page's own `::placeholder { color: var(--muted); opacity: 1 }`
// (Firefox lowers placeholder opacity by default) with a dark twin when the token does not already flip.
//
// Rendered: an in-process static server over the repo root, Chromium with every foreign origin aborted and the
// service worker blocked, each root page but the test harnesses (check-i18n's SKIP_HTML) in light and in dark (the suite's `hebrewBlender_darkMode`); every
// <input>/<textarea> with a non-empty placeholder, its `::placeholder` colour (alpha and opacity folded in)
// against the first opaque background up its ancestors. A hit is < 4.5:1. Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], delta }
//   --plant  loads the hub with a planted #d8d8d8-on-white placeholder and must report it (exit 1 if not)
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const ID = 'placeholder-keeps-the-browser-gray';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');
const PW = ['/opt/node22/lib/node_modules/playwright/index.js', 'playwright'];
let chromium;
for (const p of PW) { try { chromium = (p.startsWith('/') ? (await import(p)).default : createRequire(import.meta.url)(p)).chromium; break; } catch (e) {} }
if (!chromium) { console.log(`${ID}: Playwright not found — skipped.`); process.exit(0); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg' };
const PLANT_HTML = '<style>.plant{background:#fff;color:#000}.plant::placeholder{color:#d8d8d8}</style><input class="plant" placeholder="plant">';
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

// The test harnesses are no teacher's page: the one list of them is check-i18n's SKIP_HTML (CLAUDE.md accounts rule 2).
const SKIP = new Set((/const SKIP_HTML = new Set\(\[([^\]]*)\]/.exec(readFileSync(join(root, 'scripts/check-i18n.js'), 'utf8')) || [, ''])[1].match(/[\w.-]+\.html/g) || []);
if (!PLANT && !SKIP.size) { console.log(`${ID}: could not read SKIP_HTML from scripts/check-i18n.js.`); process.exit(1); }
const pages = PLANT ? ['index.html'] : readdirSync(root).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort();
const browser = await chromium.launch();
const hits = []; let measured = 0;
for (const dark of PLANT ? [false] : [false, true]) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(d => { try { localStorage.setItem('hebrewBlender_darkMode', d ? '1' : '0'); } catch (e) {} }, dark);
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  for (const file of pages) {
    const page = await ctx.newPage();
    try {
      await page.goto(`${base}/${file}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1200);
      const found = await page.evaluate(() => {
        const rgba = s => { const m = (s.match(/[\d.]+/g) || []).map(Number); return [m[0] || 0, m[1] || 0, m[2] || 0, m.length > 3 ? m[3] : 1]; };
        const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
        const mix = (f, b, a) => f.slice(0, 3).map((v, i) => v * a + b[i] * (1 - a));
        const bgOf = e => { const stack = []; for (; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 0.99) break; }
          let b = [255, 255, 255]; for (let i = stack.length - 1; i >= 0; i--) b = mix(stack[i], b, stack[i][3]); return b; };
        const out = []; let n = 0;
        for (const e of document.querySelectorAll('input[placeholder], textarea[placeholder]')) {
          if (!e.placeholder.trim() || /^(hidden|checkbox|radio|range|color|file|submit|button)$/.test(e.type)) continue;
          n++;
          const ps = getComputedStyle(e, '::placeholder'), b = bgOf(e), f = rgba(ps.color), a = f[3] * (parseFloat(ps.opacity) || 1);
          const fg = mix(f, b, a), L1 = lum(fg), L2 = lum(b), cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
          if (cr < 4.5) out.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).trim().split(/\s+/).join('.') : '')) + ' ' + cr.toFixed(2) + ':1 (' + ps.color + ')');
        }
        return { out, n };
      });
      measured += found.n;
      for (const note of found.out) hits.push({ file, line: 0, note: `${note} ${dark ? 'dark' : 'light'}` });
    } catch (e) { hits.push({ file, line: 0, note: `load failed: ${String(e.message).split('\n')[0]}` }); }
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();

if (!PLANT && !measured) { console.log(`${ID}: no placeholder field measured — the probe did not resolve.`); process.exit(1); }
if (PLANT) {
  const ok = hits.some(h => /\.plant /.test(h.note));
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported (${hits.length} hit(s) with it).` : `${ID}: PLANT NOT REPORTED.`);
  process.exit(ok ? 0 : 1);
}
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, measured, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s) over ${measured} placeholder fields on ${pages.length} pages × light/dark.`); for (const h of hits) console.log(`  ${h.file} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
