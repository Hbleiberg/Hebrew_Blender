#!/usr/bin/env node
// Detector for the loop pattern `skip-target-rings-the-whole-column` (docs/reference/loop-patterns.md).
//
// Shape: a page's skip link points at its main column, which carries tabindex="-1" so the link can move the focus
// there. Nothing takes that element's outline off, so once the focus is on it and the keyboard is in use — the skip
// link pressed, or a click on bare ground inside the column followed by any key — the browser's focus ring is drawn
// around the whole column. Fix shape: `main:focus { outline:none; }` (or the target's own selector) beside the page's
// `.skip-link:focus` rule; the next Tab still lands on the column's first control.
//
// Rendered: an in-process static server over the repo root, Chromium with every foreign origin aborted and the service
// worker blocked. Every root page that carries a `.skip-link` is loaded once; the link's target takes the focus, one
// Shift press puts the page in keyboard modality, and the target must then hold the focus, match :focus-visible and
// compute `outline-style: none`. A page whose target cannot take the focus or never matches :focus-visible is reported
// as an unresolved probe, never as clean. Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], measured, delta }
//   --plant  gives Flash Cards' column its ring back with one injected rule and must report it (exit 1 if not)
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize } from 'node:path';
import { createRequire } from 'node:module';

const ID = 'skip-target-rings-the-whole-column';
const root = process.env.ROOT || join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');
const PLANT_FILE = 'flash_cards.html';
const PW = ['/opt/node22/lib/node_modules/playwright/index.js', 'playwright'];
let chromium;
for (const p of PW) { try { chromium = (p.startsWith('/') ? (await import(p)).default : createRequire(import.meta.url)(p)).chromium; break; } catch (e) {} }
if (!chromium) { console.log(`${ID}: Playwright not found — skipped.`); process.exit(0); }

const files = readdirSync(root).filter(f => f.endsWith('.html') && /class="skip-link"/.test(readFileSync(join(root, f), 'utf8'))).sort();
const lineOf = (file, id) => { const i = readFileSync(join(root, file), 'utf8').split('\n').findIndex(l => l.includes('id="' + id + '"')); return i < 0 ? 0 : i + 1; };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const f = normalize(join(root, u === '/' ? 'index.html' : u));
  if (!f.startsWith(root) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
const hits = []; let measured = 0;
for (const file of (PLANT ? [PLANT_FILE] : files)) {
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
  await ctx.route('**/*', r => (r.request().url().startsWith(base) || /^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));
  try {
    await page.goto(`${base}/${file}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(300);
    if (PLANT) await page.addStyleTag({ content: 'main:focus { outline: 2px solid red !important; }' });
    const id = await page.evaluate(() => {
      const a = document.querySelector('a.skip-link'), id = a && (a.getAttribute('href') || '').replace(/^#/, ''), t = id && document.getElementById(id);
      if (!t) return null;
      // whatever opened by itself (a first-run window, a wizard) must not hold the focus for this reading
      document.querySelectorAll('[inert]').forEach(e => e.removeAttribute('inert'));
      t.focus({ preventScroll: true });
      return id;
    });
    if (!id) { hits.push({ file, line: 0, note: 'probe: the skip link or its target did not resolve' }); await ctx.close(); continue; }
    await page.keyboard.press('Shift');
    const r = await page.evaluate((id) => {
      const t = document.getElementById(id), cs = getComputedStyle(t);
      return { tabindex: t.getAttribute('tabindex'), held: document.activeElement === t, fv: t.matches(':focus-visible'), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) || 0, w: Math.round(t.getBoundingClientRect().width), h: Math.round(t.getBoundingClientRect().height) };
    }, id);
    if (r.tabindex === null && !r.held) { measured++; await ctx.close(); continue; }   // a target that never takes the focus has no ring to draw
    if (!r.held || !r.fv) hits.push({ file, line: lineOf(file, id), note: `probe: #${id} ${r.held ? 'never matched :focus-visible' : 'did not take the focus'}` });
    else { measured++; if (r.style !== 'none' && r.width > 0) hits.push({ file, line: lineOf(file, id), note: `#${id} (${r.w} × ${r.h}px) draws a ${r.width}px ${r.style} focus ring around the whole column once the keyboard is in use` }); }
  } catch (e) { hits.push({ file, line: 0, note: 'load failed: ' + String(e.message || e).split('\n')[0] }); }
  await ctx.close();
}
await browser.close(); server.close();

if (PLANT) {
  const ok = hits.some(h => h.file === PLANT_FILE && /focus ring around the whole column/.test(h.note));
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported.` : `${ID}: PLANT NOT REPORTED.`);
  process.exit(ok ? 0 : 1);
}
if (!measured) { console.log(`${ID}: nothing measured — the probe did not resolve.`); process.exit(1); }
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, measured, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s) over ${measured} skip targets on ${files.length} pages.`); for (const h of hits) console.log(`  ${h.file}:${h.line} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
