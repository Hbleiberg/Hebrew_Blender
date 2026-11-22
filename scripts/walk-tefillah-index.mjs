#!/usr/bin/env node
/*
 * Walk Sefaria's three siddur indexes and print what the Tefillah Trainer's catalog
 * (data/tefillah/catalog.json) is resolved from. On demand only; never a site build step.
 *
 *   node scripts/walk-tefillah-index.mjs                       every leaf node of the three siddurim
 *   node scripts/walk-tefillah-index.mjs --index "Siddur Sefard"   one siddur
 *   node scripts/walk-tefillah-index.mjs --grep "Kiddush|Havdal"   leaves whose path matches
 *   node scripts/walk-tefillah-index.mjs --lines "<leaf ref>"      that node line by line
 *   node scripts/walk-tefillah-index.mjs --lines "<leaf ref>" --full   …with each line whole
 *
 * --lines prints, for each openly licensed Hebrew edition of the node, every Sefaria segment with
 * its number, its kind (T = pointed prayer text, i = unpointed instruction or heading, - = empty)
 * and its first and last words — what a catalog entry's line range ("<leaf ref>:3-5") is read
 * from. A ref is never guessed: it is a leaf path this script printed, and a range is segments it
 * printed.
 *
 * Behind a proxy: NODE_USE_ENV_PROXY=1 node scripts/walk-tefillah-index.mjs …
 */
import { SIDDUR_INDEXES, leafPaths, fetchVersion, isOpenLicense, licenseName, plainText, lineKind, firstWords, lastWords } from './tefillah-sefaria.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const FULL = process.argv.includes('--full');
const KIND = { text: 'T', instruction: 'i', empty: '-', other: 'o' };
// A line as the listing shows it: whole with --full, else its first six words and, when it is longer, its last three.
function brief(p) {
  if (FULL) return p;
  const n = p.split(' ').length;
  return n <= 9 ? p.replace(/[\u0591-\u05AF\u05BD]/g, '') : `${firstWords(p, 6)} … ${lastWords(p, 3)}`;
}

async function printLines(node) {
  const first = await fetchVersion(node, 'hebrew');
  const editions = first.available.filter((v) => v.language === 'he' && isOpenLicense(v.license));
  const english = first.available.filter((v) => { const m = /\[([a-z]{2,3})\]\s*$/.exec(String(v.versionTitle || '')); return v.language === 'en' && isOpenLicense(v.license) && (m ? m[1] : (v.actualLanguage || 'en')) === 'en'; });
  console.log(`# ${node}`);
  console.log(`open Hebrew editions: ${editions.map((v) => `${v.versionTitle.trim()} [${licenseName(v.license)}]`).join(' / ') || 'NONE'}`);
  for (const e of english) {
    const en = await fetchVersion(node, 'english', e.versionTitle);
    console.log(`open translation: ${e.versionTitle.trim()} [${licenseName(e.license)}] — ${en.version ? en.version.lines.length : 0} lines`);
  }
  if (!english.length) console.log('open translation: NONE');
  for (const e of editions) {
    const he = await fetchVersion(node, 'hebrew', e.versionTitle);
    if (!he.version || !isOpenLicense(he.version.license)) { console.log(`\n## ${e.versionTitle.trim()} — returned without an open licence, skipped`); continue; }
    console.log(`\n## ${he.version.versionTitle.trim()} [${licenseName(he.version.license)}] — ${he.version.lines.length} lines`);
    he.version.lines.forEach((raw, i) => {
      const p = plainText(raw);
      console.log(`${String(i + 1).padStart(4)} ${KIND[lineKind(p)]} ${brief(p)}`);
    });
  }
}

async function main() {
  const lines = arg('--lines');
  if (lines) { await printLines(lines); return; }
  const only = arg('--index');
  const re = arg('--grep') ? new RegExp(arg('--grep'), 'i') : null;
  for (const title of SIDDUR_INDEXES) {
    if (only && only !== title) continue;
    const leaves = await leafPaths(title);
    const shown = re ? leaves.filter((p) => re.test(p)) : leaves;
    console.log(`# ${title} — ${leaves.length} leaf nodes${re ? `, ${shown.length} matching` : ''}`);
    shown.forEach((p) => console.log(p));
    console.log('');
  }
}
main().catch((e) => { console.error('walk-tefillah-index: ' + e.message); process.exit(1); });
