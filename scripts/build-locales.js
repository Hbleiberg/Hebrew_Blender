#!/usr/bin/env node
'use strict';

/*
 * build-locales.js — turn locales/ui-strings.csv into per-locale JSON.
 *
 * Single source of truth: locales/ui-strings.csv (columns: key,en,he,context,notes).
 * Emits flat key->string maps to locales/en.json and locales/he.json.
 *
 *   - Empty `he` cell  -> falls back to the `en` value (and the key is reported as untranslated).
 *   - Literal "\n" in a CSV value -> a real newline in the JSON string.
 *   - Fails loudly (exit 1) on a bad header, a row without exactly 5 fields, or duplicate keys.
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
const OUT_EN = path.join(ROOT, 'locales', 'en.json');
const OUT_HE = path.join(ROOT, 'locales', 'he.json');
const EXPECTED_HEADER = ['key', 'en', 'he', 'context', 'notes'];

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
  const headerOk = header.length === EXPECTED_HEADER.length &&
    EXPECTED_HEADER.every((h, i) => header[i] === h);
  if (!headerOk) {
    die('unexpected header — got [' + header.join(', ') + '], expected [' + EXPECTED_HEADER.join(', ') + '].');
  }

  const en = {};
  const he = {};
  const seen = new Set();
  const dups = new Set();
  const untranslated = [];

  rows.slice(1).forEach((r, idx) => {
    const lineNo = idx + 2; // 1-based, accounting for the header row
    if (r.length !== 5) {
      die('row ' + lineNo + ' has ' + r.length + ' field(s), expected 5: ' + JSON.stringify(r));
    }
    const key = r[0];
    if (!key) die('row ' + lineNo + ' has an empty key.');
    if (seen.has(key)) dups.add(key); else seen.add(key);

    const enStr = unescapeNewlines(r[1]);
    en[key] = enStr;
    if (r[2].trim() !== '') {
      he[key] = unescapeNewlines(r[2]);
    } else {
      he[key] = enStr;          // fall back to English
      untranslated.push(key);
    }
  });

  if (dups.size > 0) {
    die('duplicate key(s) (' + dups.size + '): ' + [...dups].join(', '));
  }

  writeSortedJSON(OUT_EN, en);
  writeSortedJSON(OUT_HE, he);

  const total = Object.keys(en).length;
  console.log('build-locales: wrote ' + path.relative(ROOT, OUT_EN) + ' and ' +
    path.relative(ROOT, OUT_HE) + ' (' + total + ' keys each).');

  if (untranslated.length > 0) {
    const preview = untranslated.slice(0, 50);
    console.warn('\nbuild-locales: WARNING — ' + untranslated.length + ' of ' + total +
      ' key(s) are untranslated (empty `he` → English fallback):');
    console.warn('  ' + preview.join('\n  '));
    if (untranslated.length > preview.length) {
      console.warn('  … and ' + (untranslated.length - preview.length) + ' more.');
    }
  } else {
    console.log('build-locales: all ' + total + ' keys translated.');
  }
  process.exit(0);
}

main();
