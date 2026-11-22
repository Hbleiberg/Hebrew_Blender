#!/usr/bin/env node
/* Builds the home page's kintsugi cracks: brand/kintsugi/<id>.svg, one file per fracture, from the hand-kept
   brand/kintsugi/fractures.json. Never edit an output; edit the JSON and run this again, then bump sw.js VERSION and
   run scripts/smoke-kintsugi.mjs (a fracture stays 6px from text wherever it shows, or a gate hides it).
     node scripts/build-kintsugi.mjs            write the files
     node scripts/build-kintsugi.mjs --print    also print the two <div class="kin"> blocks and the position rules for index.html
     node scripts/build-kintsugi.mjs --check    exit 1 if a file on disk differs from what the JSON builds
   A crack is drawn in runs of three segments, each with its own width, so it swells and thins like a real seam:
   a dark underlay, the gold with a fine grain, and a pale highlight on the thicker runs. */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'brand', 'kintsugi');
const data = JSON.parse(readFileSync(path.join(DIR, 'fractures.json'), 'utf8'));
const GRAIN = '<pattern id="g" patternUnits="userSpaceOnUse" width="7" height="7"><rect width="7" height="7" fill="#d6a23a"/><circle cx="0.83" cy="3.52" r="0.38" fill="#fffbe6"/><circle cx="6.02" cy="0.72" r="0.22" fill="#a87420"/><circle cx="4.35" cy="2.94" r="0.38" fill="#a87420"/><circle cx="5.90" cy="5.44" r="0.3" fill="#a87420"/><circle cx="3.09" cy="0.02" r="0.22" fill="#fff3b0"/><circle cx="2.01" cy="0.69" r="0.22" fill="#fffbe6"/><circle cx="3.43" cy="2.20" r="0.3" fill="#e0a832"/><circle cx="2.43" cy="6.99" r="0.3" fill="#c9922a"/><circle cx="7.00" cy="3.60" r="0.22" fill="#fffbe6"/><circle cx="2.38" cy="3.90" r="0.3" fill="#e0a832"/><circle cx="3.20" cy="6.14" r="0.38" fill="#fffbe6"/><circle cx="4.04" cy="0.17" r="0.38" fill="#e0a832"/><circle cx="2.54" cy="2.96" r="0.3" fill="#a87420"/><circle cx="3.88" cy="6.07" r="0.3" fill="#a87420"/><circle cx="5.62" cy="6.07" r="0.3" fill="#c9922a"/><circle cx="6.42" cy="1.81" r="0.3" fill="#a87420"/><circle cx="6.48" cy="3.35" r="0.38" fill="#fff3b0"/><circle cx="4.03" cy="5.36" r="0.22" fill="#fffbe6"/><circle cx="3.66" cy="4.69" r="0.38" fill="#a87420"/><circle cx="3.01" cy="1.00" r="0.22" fill="#fff3b0"/><circle cx="4.39" cy="3.20" r="0.3" fill="#fffbe6"/><circle cx="6.51" cy="6.91" r="0.38" fill="#e0a832"/><circle cx="3.92" cy="4.69" r="0.3" fill="#a87420"/><circle cx="5.60" cy="3.51" r="0.3" fill="#c9922a"/><circle cx="3.03" cy="2.06" r="0.3" fill="#fff3b0"/><circle cx="0.23" cy="4.59" r="0.38" fill="#c9922a"/></pattern>';
const f = (x) => x.toFixed(1);

// Catmull-Rom through the run's points, written as cubic Béziers
function smooth(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = i ? pts[i - 1] : pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = i + 2 < pts.length ? pts[i + 2] : p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function build(fr) {
  const runs = [];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of fr.cracks) {
    const n = c.p.length - 1;
    if (c.w.length !== Math.ceil(n / 3)) throw new Error(`${fr.id}: a crack with ${n} segments needs ${Math.ceil(n / 3)} widths, has ${c.w.length}`);
    for (let i = 0, k = 0; i < n; i += 3, k++) runs.push([smooth(c.p.slice(i, Math.min(n, i + 3) + 1)), c.w[k]]);
    for (const [x, y] of c.p) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  const box = [Math.floor(x0) - 4, Math.floor(y0) - 4, Math.ceil(x1) + 4, Math.ceil(y1) + 4];
  const w = box[2] - box[0], h = box[3] - box[1];
  const layer = (fn) => runs.map(fn).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box[0]} ${box[1]} ${w} ${h}" width="${w}" height="${h}"><defs>${GRAIN}</defs>`
    + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<g stroke="#3a2706" opacity="0.5">${layer(([d, s]) => `<path d="${d}" stroke-width="${(s + 0.8).toFixed(2)}"/>`)}</g>`
    + `<g stroke="url(#g)">${layer(([d, s]) => `<path d="${d}" stroke-width="${s.toFixed(2)}"/>`)}</g>`
    + `<g stroke="#fff6d2" opacity="0.55" transform="translate(-0.35 -0.45)">${layer(([d, s]) => (s > 0.9 ? `<path d="${d}" stroke-width="${Math.max(0.25, s * 0.35).toFixed(2)}"/>` : ''))}</g>`
    + `</g></svg>\n`;
  return { svg, box, w, h };
}

// Where a file sits in its bar: from the edge its fracture is anchored to (logical, so the Hebrew UI mirrors it).
function position(fr, b) {
  const [fw, fh] = fr.frame, [ax, ay] = fr.anchor;
  const inline = ax === 'start' ? `inset-inline-start:${b.box[0]}px` : ax === 'end' ? `inset-inline-end:${fw - b.box[2]}px` : `inset-inline-start:calc(50% ${b.box[0] < fw / 2 ? '-' : '+'} ${Math.abs(fw / 2 - b.box[0])}px)`;
  const block = ay === 'top' ? `inset-block-start:${b.box[1]}px` : `inset-block-end:${fh - b.box[3]}px`;
  return `${inline};${block}`;
}

const args = new Set(process.argv.slice(2));
const tags = { header: [], footer: [] }, rules = [];
let stale = 0;
if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
for (const fr of data.fractures) {
  const b = build(fr), file = path.join(DIR, fr.id + '.svg');
  if (args.has('--check')) { if (!existsSync(file) || readFileSync(file, 'utf8') !== b.svg) { stale++; console.error('stale: brand/kintsugi/' + fr.id + '.svg'); } }
  else writeFileSync(file, b.svg);
  // the wide set was drawn for the 1280px bars, the narrow set for the 390px footer
  const set = fr.area === 'footer-phone' ? 'narrow' : 'wide';
  tags[fr.area === 'header' ? 'header' : 'footer'].push(`<img class="kin-f kin-${set} kin-${fr.id}" src="/brand/kintsugi/${fr.id}.svg" width="${b.w}" height="${b.h}" alt="" loading="lazy" decoding="async">`);
  rules.push(`.kin-${fr.id}{${position(fr, b)};}`);
}
if (args.has('--print')) {
  for (const host of ['header', 'footer']) console.log(`<!-- ${host} -->\n<div class="kin" aria-hidden="true">${tags[host].join('')}</div>\n`);
  console.log(rules.join('\n'));
}
if (args.has('--check')) { if (stale) process.exit(1); console.log('kintsugi: ' + data.fractures.length + ' files match fractures.json'); }
else console.log('kintsugi: wrote ' + data.fractures.length + ' files to brand/kintsugi/');
