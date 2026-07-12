#!/usr/bin/env node
'use strict';

/*
 * check-i18n.js — enforce the Internationalization convention (see CLAUDE.md § Internationalization).
 *
 * Check A (regression gate): flags hardcoded English UI-string literals that don't go through
 *   I18n.t() / data-i18n* —
 *     - alert()/confirm()/prompt() whose argument isn't I18n.t(…)/t(…),
 *     - .textContent / .innerHTML / .placeholder / .title = '<English literal>',
 *     - .setAttribute('aria-label'|'title'|'placeholder', '<English literal>'),
 *     - HTML title="…" / aria-label="…" / placeholder="…" attributes with no paired data-i18n-* sibling.
 * Check B (debt report): lists locales/ui-strings.csv keys whose `he` cell is empty.
 *
 * A literal is only linguistic if it contains an ASCII letter (pure symbol/emoji/number/computed
 * strings like '✕', '⠿', '0.75×', '(' + n + ')' are skipped). RHS/args that contain I18n.t( are
 * compliant; concatenations with a variable are treated as content-derived. Suppress a legitimate
 * literal with a same-line `i18n-ignore` comment.
 *
 * Exit 1 only on un-suppressed Check-A violations (Check B is warn-only). Plain Node, zero deps.
 * Run: node scripts/check-i18n.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'locales', 'ui-strings.csv');
// Baseline of pre-existing Check-A findings, so the gate fails only on NEW violations while the
// known debt (untranslated UI the rollout missed) + intentional printed-output literals are tracked
// explicitly. Regenerate with `node scripts/check-i18n.js --update-baseline`. Pass K burns down the
// "backlog" section; the "intentional" section is permanent (printed-output / boundary literals).
const BASELINE_PATH = path.join(__dirname, 'check-i18n-baseline.txt');

// Files whose *.html we deliberately do NOT scan (the i18n dev harness).
const SKIP_HTML = new Set(['i18n-test.html']);
// Keys whose empty `he` is intentional English (Check B allowlist).
const EMPTY_HE_ALLOW = new Set(['worksheet.layout.title_default']);

// ── RFC-4180 CSV parser (copied verbatim from build-locales.js — house style: copy shared logic) ──
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
  return rows.filter(r => !(r.length === 1 && r[0] === ''));
}

// ── helpers ──
const hasLetters = (s) => /[A-Za-z]/.test(s);
const goesThroughI18n = (s) => /\bI18n\.t\s*\(/.test(s) || /\besc\s*\(\s*I18n\.t\s*\(/.test(s) || /(^|[^.\w])t\s*\(\s*['"`]/.test(s);

// Read a JS string literal that STARTS at s[0] (a quote). Returns the inner text, or null if s
// doesn't start with a quote. Handles \-escapes; template literals are read up to the closing `.
function readLeadingLiteral(s) {
  const q = s[0];
  if (q !== '"' && q !== "'" && q !== '`') return null;
  let out = '';
  for (let i = 1; i < s.length; i++) {
    const c = s[i];
    if (c === '\\') { out += s[i + 1] || ''; i++; continue; }
    if (c === q) return { text: out, end: i };
    out += c;
  }
  return { text: out, end: s.length - 1 }; // unterminated on this line — take what we have
}

// Blank the CONTENT of <script>/<style> regions (keep tags + newlines) so the HTML-attribute
// pass never mistakes JS/CSS (e.g. `for (i<n)`) for markup. Offsets/line numbers are preserved.
function blankRegions(text) {
  return text.replace(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (full, tag, inner) => full.replace(inner, inner.replace(/[^\n]/g, ' ')));
}

const lineNoAt = (text, idx) => text.slice(0, idx).split('\n').length;

// A plain quoted literal is "structural, not prose" if it looks like HTML/markup (a `<` tag).
const looksLikeHtml = (s) => /<[a-zA-Z!/]/.test(s);

// ── Check A ──
// errors  = high-confidence hardcoded-literal violations (fail the build).
// warnings = the static-HTML tooltip-attribute backlog (advisory; a code fix routes it through
//            data-i18n-*, but tooltips are numerous/low-value so they don't block).
function scanFile(file, errors, warnings) {
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const suppressed = (ln) => /i18n-ignore/.test(lines[ln - 1] || '');
  const push = (bucket, ln, msg, snippet) => {
    if (suppressed(ln)) return;
    bucket.push({ file: rel, line: ln, msg, snippet: snippet.trim().slice(0, 100) });
  };

  // JS-shaped checks (errors), line by line.
  lines.forEach((line, i) => {
    const ln = i + 1;
    let m;

    // 1) alert/confirm/prompt with a literal argument not wrapped in t()/I18n.t().
    const callRe = /\b(alert|confirm|prompt)\s*\(/g;
    while ((m = callRe.exec(line))) {
      const arg = line.slice(m.index + m[0].length).replace(/^\s*/, '');
      if (/^(I18n\.t\s*\(|esc\s*\(\s*I18n\.t\s*\(|t\s*\()/.test(arg)) continue; // compliant
      const lit = readLeadingLiteral(arg);
      if (lit && hasLetters(lit.text)) push(errors, ln, m[1] + '() with a hardcoded English literal', line);
    }

    // 2) .textContent/.placeholder/.title = a PLAIN quoted literal (skip innerHTML/backticks —
    //    those build markup / interpolate data and are too noisy to classify statically).
    const assignRe = /\.(textContent|placeholder|title)\s*=\s*(['"])/g;
    while ((m = assignRe.exec(line))) {
      const rhs = line.slice(m.index + m[0].length - 1); // start at the quote
      const lit = readLeadingLiteral(rhs);
      if (!lit || !hasLetters(lit.text) || looksLikeHtml(lit.text)) continue;
      const after = rhs.slice(lit.end + 1).replace(/^\s*/, '');
      if (after.startsWith('+')) continue;                 // concatenated with a variable → content-derived
      push(errors, ln, '.' + m[1] + ' assigned a hardcoded English literal', line);
    }

    // 3) setAttribute('aria-label'|'title'|'placeholder', '<plain literal>').
    const setRe = /\.setAttribute\s*\(\s*(['"])(aria-label|title|placeholder)\1\s*,\s*/g;
    while ((m = setRe.exec(line))) {
      if (line.includes("'data-i18n-" + m[2] + "'") || line.includes('"data-i18n-' + m[2] + '"')) continue; // paired data-i18n-* fallback
      const rhs = line.slice(m.index + m[0].length);
      if (goesThroughI18n(rhs)) continue;
      const lit = readLeadingLiteral(rhs);
      if (!lit || !hasLetters(lit.text) || looksLikeHtml(lit.text)) continue;
      const after = rhs.slice(lit.end + 1).replace(/^\s*/, '');
      if (after.startsWith('+')) continue;                 // concatenated with a variable
      push(errors, ln, "setAttribute('" + m[2] + "', <hardcoded English literal>)", line);
    }
  });

  // 4) Static HTML title/aria-label/placeholder attributes with no data-i18n-* sibling (WARNING).
  //    Scanned over script/style-blanked markup so JS (`for (i<n)`) is never read as a tag.
  const markup = blankRegions(text);
  const tagRe = /<[a-zA-Z][^>]*>/g;
  const ATTRS = ['title', 'aria-label', 'placeholder'];
  let t;
  while ((t = tagRe.exec(markup))) {
    const tag = t[0];
    for (const attr of ATTRS) {
      const am = tag.match(new RegExp('(?<![-\\w])' + attr + '="([^"]*)"'));
      if (!am || !hasLetters(am[1])) continue;
      if (tag.includes('data-i18n-' + attr)) continue;     // paired data-i18n-* fallback → compliant
      push(warnings, lineNoAt(markup, t.index), attr + '="' + am[1].slice(0, 30) + '" with no data-i18n-' + attr + ' sibling', tag);
    }
  }
}

// ── baseline (line-number-independent signature: file | msg | snippet) ──
const sigOf = (v) => v.file + '\t' + v.msg + '\t' + v.snippet;
function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return new Set();
  return new Set(
    fs.readFileSync(BASELINE_PATH, 'utf8').split('\n')
      .map(l => l.replace(/\r$/, ''))
      .filter(l => l.trim() !== '' && !l.startsWith('#'))
  );
}

// ── Check B ──
function checkDebt() {
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  const empties = [];
  rows.slice(1).forEach((r) => {
    if (r.length >= 3 && r[0] && r[2].trim() === '' && !EMPTY_HE_ALLOW.has(r[0])) empties.push(r[0]);
  });
  return empties;
}

function main() {
  // Targets: every root *.html (minus the harness) + pwa.js.
  const targets = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('.html') && !SKIP_HTML.has(f))
    .map(f => path.join(ROOT, f));
  const pwa = path.join(ROOT, 'pwa.js');
  if (fs.existsSync(pwa)) targets.push(pwa);

  const errors = [];
  const warnings = [];
  targets.forEach(f => scanFile(f, errors, warnings));
  const byLoc = (a, b) => a.file.localeCompare(b.file) || a.line - b.line;

  // `--update-baseline`: snapshot the current Check-A findings as the accepted baseline.
  if (process.argv.includes('--update-baseline')) {
    const sigs = [...new Set(errors.map(sigOf))].sort();
    const header = '# check-i18n baseline — pre-existing Check-A findings that do NOT fail the gate.\n' +
      '# Signature per line: <relpath>\\t<message>\\t<snippet>. Regenerate: node scripts/check-i18n.js --update-baseline\n' +
      '# Group A below = intentional printed-output / boundary literals (permanent — do not translate).\n' +
      '# Group B below = untranslated UI the rollout missed (the Pass K backlog — remove a line when fixed).\n';
    fs.writeFileSync(BASELINE_PATH, header + sigs.join('\n') + '\n', 'utf8');
    console.log('check-i18n: wrote baseline with ' + sigs.length + ' signature(s) to ' + path.relative(ROOT, BASELINE_PATH));
    process.exit(0);
  }

  // Split Check-A findings into NEW (fail the gate) vs baselined/known (tracked, non-failing).
  const baseline = loadBaseline();
  const fresh = errors.filter(v => !baseline.has(sigOf(v)));
  const known = errors.length - fresh.length;

  if (fresh.length) {
    console.error('check-i18n: ' + fresh.length + ' NEW hardcoded-literal violation(s) — route through I18n.t() (or add an i18n-ignore comment / --update-baseline if intentional):');
    fresh.sort(byLoc).forEach(v => console.error('  ' + v.file + ':' + v.line + '  ' + v.msg + '\n      ' + v.snippet));
  } else {
    console.log('check-i18n: Check A clean — no NEW hardcoded UI-string literals in JS.');
  }
  if (known) console.log('check-i18n: (' + known + ' baselined Check-A finding(s) — see scripts/check-i18n-baseline.txt.)');

  // Check A tooltip-attribute backlog (warn-only).
  if (warnings.length) {
    console.warn('\ncheck-i18n: WARNING — ' + warnings.length + ' static title/aria-label/placeholder attribute(s) lack a data-i18n-* sibling (untranslated tooltips — advisory backlog):');
    const preview = warnings.sort(byLoc).slice(0, 40);
    preview.forEach(v => console.warn('  ' + v.file + ':' + v.line + '  ' + v.msg));
    if (warnings.length > preview.length) console.warn('  … and ' + (warnings.length - preview.length) + ' more.');
  }

  // Check B — translation-debt report (warn-only).
  const empties = checkDebt();
  if (empties.length) {
    const preview = empties.slice(0, 50);
    console.warn('\ncheck-i18n: WARNING — ' + empties.length + ' key(s) have an empty `he` (translation debt):');
    console.warn('  ' + preview.join('\n  '));
    if (empties.length > preview.length) console.warn('  … and ' + (empties.length - preview.length) + ' more.');
  } else {
    console.log('check-i18n: Check B clean — every ui-strings.csv key has Hebrew (allowlisted exceptions aside).');
  }

  if (!fresh.length) console.log('\ncheck-i18n: clean (no new blocking violations).');
  process.exit(fresh.length ? 1 : 0);
}

main();
