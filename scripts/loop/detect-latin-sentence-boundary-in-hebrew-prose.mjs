#!/usr/bin/env node
// Detector for the loop pattern `latin-sentence-boundary-in-hebrew-prose` (docs/reference/loop-patterns.md).
//
// Shape: in a Hebrew (RTL) sentence a Latin term ends one sentence and another Latin term begins the next
// ("…לחצו על Install Font. Windows: לחצו…"). The bidi algorithm resolves the period and the space between
// two strong-LTR runs as LTR, so the whole "Install Font. Windows:" becomes one left-to-right island: the
// reader meets the next sentence's first word before this sentence's end, and the period sits mid-island.
// The suite's fix is a right-to-left mark (U+200F) right after the terminator, the idiom the CSV already uses
// after a Latin run that a Hebrew comma or period follows (`TrueType‹RLM›, WOFF2`).
//
// Static over locales/ui-strings.csv's `he` column (the single source of truth): tags stripped, each line of a
// cell scanned on its own (a newline is a list or paragraph boundary, never a sentence running on), a hit is
// `<Latin/digit/closing bracket><.?!><spaces><Latin capital>` with no U+200F between. Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], delta }
//   --plant  scans an in-memory copy with one planted row and must report it (exit 1 if it does not)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ID = 'latin-sentence-boundary-in-hebrew-prose';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSV = 'locales/ui-strings.csv';
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');

// Minimal RFC-4180 reader that keeps the row's starting line number (cells may span lines).
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false, line = 1, rowLine = 1;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else { cell += c; if (c === '\n') line++; }
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push({ line: rowLine, cells: row }); row = []; cell = ''; line++; rowLine = line; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push({ line: rowLine, cells: row }); }
  return rows;
}

const BOUNDARY = /([A-Za-z0-9)\]][.?!])((?:\s|&nbsp;)+)(?=[A-Z][A-Za-z])/g;
function scan(rows, file) {
  const hits = [];
  for (const { line, cells } of rows) {
    const [key, , he] = cells; if (!he || !/[֐-׿]/.test(he)) continue;
    const plain = he.replace(/<[^>]+>/g, ' ');
    for (const seg of plain.split(/\\n|\n/)) {
      let m; BOUNDARY.lastIndex = 0;
      while ((m = BOUNDARY.exec(seg))) {
        if (m[2].includes('‏') || seg[m.index + m[1].length] === '‏') continue;
        hits.push({ file, line, note: `${key}: …${seg.slice(Math.max(0, m.index - 20), m.index + m[0].length + 12).replace(/\s+/g, ' ')}…` });
      }
    }
  }
  return hits;
}

const text = readFileSync(join(root, CSV), 'utf8');
let rows = parseCsv(text).slice(1);
if (PLANT) rows = rows.concat([{ line: 0, cells: ['plant.latin_boundary', 'x', 'פתחו את Word. Google Docs לא תומך בזה.', '', ''] }]);
const hits = scan(rows, CSV);
if (PLANT) {
  const ok = hits.some(h => h.line === 0);
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported (${hits.length} hit(s) with it).` : `${ID}: PLANT NOT REPORTED.`);
  process.exit(ok ? 0 : 1);
}
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s).`); for (const h of hits) console.log(`  ${h.file}:${h.line} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
