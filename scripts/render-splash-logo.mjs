#!/usr/bin/env node
/*
 * Render the splash screens' logo rasters from the brand lockup drawn for dark grounds
 * (brand/ivritsuite-lockup-english-dark.svg): the cube alone and the IvritSuite wordmark alone, each on a
 * transparent ground, large enough that splash/gen_splash.py only ever scales them down.
 *
 *   node scripts/render-splash-logo.mjs      writes splash/logo-cube.png and splash/logo-wordmark.png
 *
 * Run it whenever the lockup changes, then `python3 splash/gen_splash.py` (docs/reference/ops.md → App Version &
 * Splash Screens). The splash generator itself stays Python + Pillow; this is the one step that needs a browser
 * (Playwright's Chromium, as the other headless scripts use).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'brand', 'ivritsuite-lockup-english-dark.svg');
const OUT = path.join(ROOT, 'splash');
const CUBE_PX = 1200;      // the cube's square render, px
const WORD_H_PX = 420;     // the wordmark's render height, px

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { const m = await import('playwright'); chromium = (m.default || m).chromium; }

const svg = readFileSync(SRC, 'utf8');
// The lockup draws the cube first and closes it with the cube's outline path; everything after is the wordmark.
const CUBE_END = 'stroke-linecap="round"></path>';
const open = svg.slice(0, svg.indexOf('>', svg.indexOf('<svg')) + 1);
const head = svg.slice(open.length, svg.indexOf(CUBE_END) + CUBE_END.length).replace(/<title[^<]*<\/title>/, '');
const word = svg.slice(svg.indexOf(CUBE_END) + CUBE_END.length, svg.lastIndexOf('</svg>'));
if (!head.includes('<path') || !word.includes('<path')) throw new Error('could not split the lockup into cube and wordmark');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
async function render(inner, file, fit) {
  // Measure the part's own box, then draw it into a canvas that box defines (1 unit of air on each side).
  await page.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" id="m" width="400" height="400" viewBox="0 0 400 400"><g id="g">${inner}</g></svg></body></html>`);
  const b = await page.evaluate(() => { const r = document.getElementById('g').getBBox(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const vb = fit(b);
  const px = { w: Math.round(vb.scale * vb.w), h: Math.round(vb.scale * vb.h) };
  await page.setViewportSize({ width: px.w, height: px.h });
  await page.setContent(`<html><body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${px.w}" height="${px.h}" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" style="display:block">${inner}</svg></body></html>`);
  await page.locator('svg').screenshot({ path: path.join(OUT, file), omitBackground: true });
  console.log(`  ${file}  ${px.w}x${px.h}  (viewBox ${[vb.x, vb.y, vb.w, vb.h].map(v => +v.toFixed(2)).join(' ')})`);
}
// The cube: a square around its box (the outline's stroke reaches 1.5 units past the path), centred.
await render(head, 'logo-cube.png', (b) => {
  const side = Math.max(b.w, b.h) + 2 * 2.5, cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  return { x: cx - side / 2, y: cy - side / 2, w: side, h: side, scale: CUBE_PX / side };
});
// The wordmark: its own box plus a unit of air, at a fixed height.
await render(word, 'logo-wordmark.png', (b) => {
  const x = b.x - 1, y = b.y - 1, w = b.w + 2, h = b.h + 2;
  return { x, y, w, h, scale: WORD_H_PX / h };
});
await browser.close();
