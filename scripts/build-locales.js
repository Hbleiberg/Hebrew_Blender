#!/usr/bin/env node
'use strict';

/*
 * build-locales.js — turn locales/ui-strings.csv into per-locale JSON.
 *
 * Single source of truth: locales/ui-strings.csv. The schema is COLUMN-DRIVEN:
 * `key`, then one language column per locale (the FIRST language column must be
 * `en` — it is the fallback source), then `context,notes` as the last two
 * columns. Currently `key,en,he,context,notes`; adding a language = adding a
 * column here (plus the runtime/sw.js steps in CLAUDE.md "Adding a new UI
 * language"). Emits a flat key->string map to locales/<lang>.json per language.
 *
 *   - Empty non-`en` cell -> falls back to the `en` value (and the key is reported as untranslated).
 *   - Literal "\n" in a CSV value -> a real newline in the JSON string.
 *   - Fails loudly (exit 1) on a bad header, a row whose field count doesn't
 *     match the header, or duplicate keys.
 *
 * Plain Node, zero dependencies. Run: node scripts/build-locales.js
 * (No deploy-time build — the JSON is committed and served statically.)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
// Optional CSV path override (process.argv[2]) is used for testing validation
// against throwaway copies; validation errors exit before any file is written.
const CSV_PATH = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'locales', 'ui-strings.csv');

function die(msg) {
  console.error('build-locales: ERROR — ' + msg);
  process.exit(1);
}

// RFC-4180 CSV parser -> array of rows (each an array of string fields).
// Handles quoted fields, embedded commas/newlines, and "" escapes.
function parseCSV(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // strip BOM
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }   // escaped quote
        else { inQuotes = false; }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') { inQuotes = true; }
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\r') { /* ignore CR (CRLF handled via LF) */ }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else { field += c; }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  // drop blank lines (a single empty field)
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

// Literal "\n" (or "\r\n") in a CSV value -> real newline.
function unescapeNewlines(s) {
  return s.replace(/\\r\\n|\\n/g, '\n');
}

function writeSortedJSON(file, obj) {
  const sorted = {};
  for (const k of Object.keys(obj).sort()) sorted[k] = obj[k];
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

function main() {
  if (!fs.existsSync(CSV_PATH)) die('CSV not found: ' + CSV_PATH);
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  if (rows.length === 0) die('CSV is empty: ' + CSV_PATH);

  const header = rows[0];
  // Column-driven schema: key, <language columns…>, context, notes.
  const headerOk = header.length >= 4 && header[0] === 'key' &&
    header[header.length - 2] === 'context' && header[header.length - 1] === 'notes';
  if (!headerOk) {
    die('unexpected header — got [' + header.join(', ') + '], expected [key, <lang columns…>, context, notes].');
  }
  const langs = header.slice(1, header.length - 2);
  if (langs[0] !== 'en') die('the first language column must be `en` (got `' + langs[0] + '`).');
  if (new Set(langs).size !== langs.length) die('duplicate language column(s) in header: [' + langs.join(', ') + '].');

  const dicts = {};           // lang -> { key -> string }
  const untranslated = {};    // lang -> [keys with an empty cell]
  for (const l of langs) { dicts[l] = {}; untranslated[l] = []; }
  const seen = new Set();
  const dups = new Set();

  rows.slice(1).forEach((r, idx) => {
    const lineNo = idx + 2; // 1-based, accounting for the header row
    if (r.length !== header.length) {
      die('row ' + lineNo + ' has ' + r.length + ' field(s), expected ' + header.length + ': ' + JSON.stringify(r));
    }
    const key = r[0];
    if (!key) die('row ' + lineNo + ' has an empty key.');
    if (seen.has(key)) dups.add(key); else seen.add(key);

    const enStr = unescapeNewlines(r[1]);
    dicts.en[key] = enStr;
    for (let i = 1; i < langs.length; i++) {
      const cell = r[1 + i];
      if (cell.trim() !== '') {
        dicts[langs[i]][key] = unescapeNewlines(cell);
      } else {
        dicts[langs[i]][key] = enStr;          // fall back to English
        untranslated[langs[i]].push(key);
      }
    }
  });

  if (dups.size > 0) {
    die('duplicate key(s) (' + dups.size + '): ' + [...dups].join(', '));
  }

  for (const l of langs) writeSortedJSON(path.join(ROOT, 'locales', l + '.json'), dicts[l]);

  const total = Object.keys(dicts.en).length;
  console.log('build-locales: wrote ' + langs.map(l => 'locales/' + l + '.json').join(' and ') +
    ' (' + total + ' keys each).');

  let anyDebt = false;
  for (const l of langs.slice(1)) {
    if (untranslated[l].length === 0) continue;
    anyDebt = true;
    const preview = untranslated[l].slice(0, 50);
    console.warn('\nbuild-locales: WARNING — ' + untranslated[l].length + ' of ' + total +
      ' key(s) are untranslated (empty `' + l + '` → English fallback):');
    console.warn('  ' + preview.join('\n  '));
    if (untranslated[l].length > preview.length) {
      console.warn('  … and ' + (untranslated[l].length - preview.length) + ' more.');
    }
  }
  if (!anyDebt) console.log('build-locales: all ' + total + ' keys translated in every language.');
  process.exit(0);
}

main();
