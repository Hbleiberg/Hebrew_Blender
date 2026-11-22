#!/usr/bin/env node
/*
 * Render the tab icon's PNG copies from favicon.svg: icon-192.png and icon-512.png in the repo root, the cube alone on
 * a transparent ground. They are the rel="icon" candidates for a browser that takes no SVG icon, so every candidate a
 * page offers is the same mark. A PNG cannot follow the browser's theme, so they carry the cube's light-ground colours.
 * The home-screen icons (apple-touch-icon.png and icons/, the manifest's) keep their cream plate and are not made here:
 * a phone fills a transparent one with black.
 *
 *   node scripts/render-tab-icons.mjs      writes icon-192.png and icon-512.png
 *
 * Run it whenever favicon.svg changes, then bump those icons' ?v= on every page and in the three page builders
 * (docs/reference/ops.md → Tab icon). Playwright's Chromium draws them, as it draws the splash logo.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SIZES = [192, 512];

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { const m = await import('playwright'); chromium = (m.default || m).chromium; }

const svg = readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8');
if (!/^<svg [^>]*viewBox="/.test(svg)) throw new Error('favicon.svg does not open with an <svg viewBox> tag');

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1, colorScheme: 'light' });
for (const px of SIZES) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${px}" height="${px}" style="display:block" `)}</body></html>`);
  await page.locator('svg').screenshot({ path: path.join(ROOT, `icon-${px}.png`), omitBackground: true });
  console.log(`  icon-${px}.png  ${px}x${px}`);
}
await browser.close();
