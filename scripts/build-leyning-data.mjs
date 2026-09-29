#!/usr/bin/env node
/* build-leyning-data.mjs — writes data/leyning/weekday.json and data/leyning/triennial.json (the Torah
 * Trainer's Weekday and Triennial reading cycles) from Hebcal's BSD-2-Clause data packages:
 *   @hebcal/leyning   → the Monday/Thursday reading of every parasha (its first aliyah in three)
 *   @hebcal/triennial → the Conservative movement's three-year divisions, including the variations a
 *                       sometimes-doubled parasha takes from its cycle's Together/Separate pattern
 * (their sedra code is @hebcal/core, GPL — never touched here; js/hebrew-calendar.js has its own).
 * Zero dependencies: the two tarballs come from registry.npmjs.org through curl (Node's fetch ignores
 * HTTPS_PROXY) into the gitignored source-data/leyning-cache/, so a re-run is offline and byte-identical.
 * The versions are pinned below; bump them, re-run, and bump the two fetches' ?v= in torah_trainer.html
 * (docs/reference/ops.md). Both files are keyed by parasha NUMBER (parshiyot.json's `n`, which is Hebcal's
 * `num`), never by a spelling. Run: node scripts/build-leyning-data.mjs */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const PKGS = { leyning: '10.0.2', triennial: '6.3.3' };
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(root, 'source-data', 'leyning-cache');
const outDir = join(root, 'data', 'leyning');
mkdirSync(cache, { recursive: true });
mkdirSync(outDir, { recursive: true });

function fetchPkg(name, version) {
  const dir = join(cache, `${name}-${version}`);
  if (!existsSync(join(dir, 'package', 'package.json'))) {
    const tgz = join(cache, `${name}-${version}.tgz`);
    if (!existsSync(tgz)) {
      const url = `https://registry.npmjs.org/@hebcal/${name}/-/${name}-${version}.tgz`;
      console.log('  fetching ' + url);
      execFileSync('curl', ['-sS', '--fail', '--max-time', '300', '-o', tgz + '.part', url]);
      execFileSync('mv', [tgz + '.part', tgz]);
    }
    mkdirSync(dir, { recursive: true });
    execFileSync('tar', ['xzf', tgz, '-C', dir]);
  }
  const pkg = JSON.parse(readFileSync(join(dir, 'package', 'package.json'), 'utf8'));
  assert.equal(pkg.license, 'BSD-2-Clause', `${name} is BSD-2-Clause`);
  return dir;
}
const importJson = async (dir, file) => (await import(pathToFileURL(join(dir, 'package', 'dist', 'esm', file)).href)).default;

const names = JSON.parse(readFileSync(join(root, 'data/parshiyot.json'), 'utf8'));
assert.equal(names.length, 54);
const CV = /^\d+:\d+$/;
const pair = (a) => { assert.ok(Array.isArray(a) && CV.test(a[0]) && CV.test(a[1]), 'a c:v pair: ' + JSON.stringify(a)); return [a[0], a[1]]; };
const aliyot = (o) => { const out = {}; for (const k of Object.keys(o)) { assert.ok(/^[1-7M]$/.test(k), 'aliyah key ' + k); out[k] = pair(o[k]); } return out; };
const header = (pkg, version) => ({ v: 1, license: 'BSD-2-Clause', source: `@hebcal/${pkg} ${version} (https://github.com/hebcal/hebcal-${pkg})`, copyright: 'Copyright (c) hebcal. Redistributed under the BSD 2-Clause License — see data/leyning/LICENSE.txt.' });

/* ── weekday ──────────────────────────────────────────────── */
const leyDir = fetchPkg('leyning', PKGS.leyning);
const ley = await importJson(leyDir, 'aliyot.json.js');
const weekday = { ...header('leyning', PKGS.leyning), parshiyot: {} };
for (const [key, e] of Object.entries(ley)) {
  if (e.combined || !e.weekday) continue;
  assert.ok(Number.isInteger(e.num) && e.num >= 1 && e.num <= 54, key + ' num');
  const w = aliyot(e.weekday);
  assert.deepEqual(Object.keys(w), ['1', '2', '3'], key + ' weekday has three aliyot');
  weekday.parshiyot[String(e.num)] = w;
}
assert.equal(Object.keys(weekday.parshiyot).length, 54, 'a weekday reading for all 54');
assert.deepEqual(weekday.parshiyot['1'], { 1: ['1:1', '1:5'], 2: ['1:6', '1:8'], 3: ['1:9', '1:13'] }, 'Bereshit: 1:1–5, 1:6–8, 1:9–13');

/* ── triennial ────────────────────────────────────────────── */
const triDir = fetchPkg('triennial', PKGS.triennial);
const tri = await importJson(triDir, 'triennial.json.js');
const numOf = new Map(Object.entries(ley).map(([k, e]) => [k, e.num]));   // Hebcal's spellings → numbers
const triennial = { ...header('triennial', PKGS.triennial), parshiyot: {}, combined: {} };
function resolve(entry, label) {
  const src = entry.years || entry.variations;
  assert.ok(src, label + ' has years or variations');
  const out = {};
  for (const [k, v] of Object.entries(src)) if (typeof v === 'object') { assert.ok(/^[A-Z0-9]+\.[123]$/.test(k), label + ' key ' + k); out[k] = aliyot(v); }
  for (const [k, v] of Object.entries(src)) if (typeof v === 'string') { assert.ok(out[v], `${label} ${k} same-as ${v}`); out[k] = out[v]; }
  return out;
}
for (const [key, e] of Object.entries(tri)) {
  if (key.includes(':')) continue;   // "Vaetchanan:alt": an alternative division; the page shows the standard one
  const num = numOf.get(key);
  assert.ok(num, 'known parasha ' + key);
  if (Array.isArray(num)) {
    const c = { years: resolve(e, key), patterns: e.patterns };
    assert.deepEqual(Object.keys(c.years).sort(), ['Y.1', 'Y.2', 'Y.3'], key + ' years');
    assert.ok(c.patterns && Object.keys(c.patterns).length >= 4, key + ' patterns');
    triennial.combined[num.join('-')] = c;
  } else {
    const s = { variations: resolve(e, key) };
    if (e.fullParsha) s.fullParsha = true;
    triennial.parshiyot[String(num)] = s;
  }
}
assert.equal(Object.keys(triennial.parshiyot).length, 54, 'a triennial entry for all 54');
assert.equal(Object.keys(triennial.combined).length, 7, 'seven combined entries');
// every pattern letter a combined entry names resolves, for all three years, in both singles
for (const [k, c] of Object.entries(triennial.combined)) {
  const [a, b] = k.split('-');
  for (const letter of Object.values(c.patterns)) for (const yr of [1, 2, 3]) {
    const key = letter + '.' + yr;
    // A year in which the pair is read together takes the combined Y.n; only the separate years need the singles.
    const pat = Object.entries(c.patterns).find(([, l]) => l === letter)[0];
    if (pat[yr - 1] === 'T') continue;
    assert.ok(triennial.parshiyot[a].variations[key], `${k} ${pat} year ${yr}: ${names[a - 1].en} has ${key}`);
    assert.ok(triennial.parshiyot[b].variations[key], `${k} ${pat} year ${yr}: ${names[b - 1].en} has ${key}`);
  }
}
assert.equal(triennial.combined['22-23'].patterns.TTS, 'A');
assert.deepEqual(triennial.parshiyot['1'].variations['Y.1']['1'], ['1:1', '1:5']);

/* ── write ────────────────────────────────────────────────── */
const write = (file, obj) => { const p = join(outDir, file); writeFileSync(p, JSON.stringify(obj) + '\n'); console.log('  wrote ' + p + ' (' + Buffer.byteLength(JSON.stringify(obj)) + ' bytes)'); };
write('weekday.json', weekday);
write('triennial.json', triennial);
const lic = readFileSync(join(leyDir, 'package', 'LICENSE'), 'utf8').trim();
writeFileSync(join(outDir, 'LICENSE.txt'), `The files in this folder are built by scripts/build-leyning-data.mjs from\n@hebcal/leyning ${PKGS.leyning} and @hebcal/triennial ${PKGS.triennial} (https://github.com/hebcal),\nredistributed under their license:\n\n${lic}\n`);
console.log('build-leyning-data: ok');
