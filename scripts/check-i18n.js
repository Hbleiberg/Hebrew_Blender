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
 * Check B (debt report): lists locales/ui-strings.csv keys with an empty cell in any non-`en`
 *   language column (the CSV schema is column-driven — see build-locales.js).
 * Check C (corpus gate): the localization corpus is DATA, and data-i18n-html writes it straight
 *   into innerHTML, so two shapes are blocking —
 *     C1: a cell carrying an inline event handler (onclick=…) or a javascript: URL. The corpus is
 *         trusted, so this is not an XSS today; it is CLAUDE.md Security rule 2's carve-out ("rebuild
 *         that spot with addEventListener") and it puts executable JS in a translator's file, where
 *         localizing an argument silently breaks a working control.
 *     C2: a data-i18n-html key whose value interpolates a {placeholder} — interpolated content would
 *         reach innerHTML. (The binding safety gate registered alongside the pattern below.)
 * Check D (quoting gate): every value cell must be valid RFC-4180. Both parseCSV copies (here and
 *   in build-locales.js) are LENIENT in one specific way: a `"` met outside quote mode flips into
 *   quote mode WITHOUT being appended, so any quote that is not part of a properly-doubled pair is
 *   silently DELETED from the built value. Two shapes are blocking —
 *     D1: a bare `"` inside an unquoted field (the quotes vanish from the shipped string).
 *     D2: a quoted field whose closing quote is followed by anything but a comma / newline / EOF,
 *         i.e. an undoubled inner quote closed the field early. A strict reader (Excel, Sheets, a
 *         CAT tool, Python csv) truncates such a row and scatters the remainder into later columns,
 *         so a maintainer round-tripping this file through a spreadsheet would destroy it.
 *   Registered after S281 found three carriers, all of them Hebrew cells quoting a UI control's
 *   name ("Show panels", "Tidy strokes", "Other" mode) — the quotes had been stripped in output.
 *   …plus a warn-only markup-parity report (the `i18n-html-markup-only-in-fallback` pattern): a
 *   data-i18n-html fallback whose tag multiset disagrees with a built value, and a plain data-i18n
 *   element carrying markup — applyStaticI18n sets textContent there, so the tags are dropped
 *   unconditionally and the CSV cannot rescue them; such a site must become data-i18n-html.
 *
 * A literal is only linguistic if it contains an ASCII letter (pure symbol/emoji/number/computed
 * strings like '✕', '⠿', '0.75×', '(' + n + ')' are skipped). RHS/args that contain I18n.t( are
 * compliant; concatenations with a variable are treated as content-derived. Suppress a legitimate
 * literal with a same-line `i18n-ignore` comment.
 *
 * Exit 1 on un-suppressed Check-A violations or any Check-C1/C2 finding (Check B and the C markup-
 * parity report are warn-only). Plain Node, zero deps.
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
// Keys whose empty cell is intentional English (Check B allowlist — applies to every language column).
const EMPTY_ALLOW = new Set(['worksheet.layout.title_default']);

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

// ── Check D: RFC-4180 quoting integrity ──
// parseCSV above drops any `"` that isn't a doubled pair inside a quoted field, so a malformed cell
// loses its quotes SILENTLY rather than failing the build. This scan is the strict reader that says
// so. Returns [{line, col, key, shape, excerpt}] — see the Check D note in the header comment.
function findQuotingViolations(text) {
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const out = [];
  let line = 1, col = 0, field = '', firstField = '', inQuotes = false, quoted = false;
  const near = (i) => text.slice(Math.max(0, i - 28), i + 28).replace(/\n/g, '\\n');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; continue; }
        inQuotes = false;
        const nx = text[i + 1];
        // D2: the field closed here, so only a delimiter, a newline or EOF may follow.
        if (nx !== undefined && nx !== ',' && nx !== '\n' && nx !== '\r') {
          out.push({ line, col, key: firstField, shape: 'D2', excerpt: near(i) });
        }
      } else { field += c; }
      continue;
    }
    if (c === '"') {
      // D1: a quote may only OPEN a field. Mid-field it is a bare quote in an unquoted cell.
      if (field !== '') out.push({ line, col, key: firstField, shape: 'D1', excerpt: near(i) });
      else quoted = true;
      inQuotes = true;
    } else if (c === ',') {
      if (col === 0) firstField = field;
      col++; field = ''; quoted = false;
    } else if (c === '\n') {
      line++; col = 0; field = ''; firstField = ''; quoted = false;
    } else if (c !== '\r') { field += c; }
  }
  // One malformed pair trips both shapes (the opening quote is D1, its closing quote D2); collapse
  // them so a site is reported once, keeping every shape that fired.
  const seen = new Map();
  for (const v of out) {
    const id = v.line + ':' + v.col;
    if (seen.has(id)) { const p = seen.get(id); if (!p.shape.includes(v.shape)) p.shape += '+' + v.shape; }
    else seen.set(id, Object.assign({}, v));
  }
  return [...seen.values()];
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
// Column-driven like build-locales.js: languages = the header columns between `key` and
// `context,notes`; the first (`en`) is the fallback source, so only the OTHER language
// columns carry translation debt.
function checkDebt() {
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0] || [];
  const langs = header.slice(1, Math.max(1, header.length - 2));
  const debt = {};                                    // lang -> [keys with an empty cell]
  for (let i = 1; i < langs.length; i++) {
    const lang = langs[i], col = 1 + i;
    const empties = [];
    rows.slice(1).forEach((r) => {
      if (r.length > col && r[0] && r[col].trim() === '' && !EMPTY_ALLOW.has(r[0])) empties.push(r[0]);
    });
    if (empties.length) debt[lang] = empties;
  }
  return debt;
}

// ── Check C ──
// Column-driven like Check B, so a new language column is covered with no edit here.
const EVENT_ATTR_RE = /\son(?:click|dblclick|change|input|submit|load|error|focus|blur|scroll|wheel|contextmenu|mouse[a-z]+|key[a-z]+|touch[a-z]+|pointer[a-z]+|drag[a-z]*|drop)\s*=/i;
const JS_URL_RE = /(?:href|src|action)\s*=\s*"?\s*javascript:/i;
// Tag multiset of a markup string, order-independent: <strong>x</strong> → 'strong,strong'.
const tagMultiset = (s) => (String(s).match(/<\/?([a-zA-Z][\w-]*)/g) || [])
  .map(t => t.replace(/[<\/]/g, '').toLowerCase()).sort().join(',');
// Tags a plain data-i18n element may still carry: applyStaticI18n drops everything, but <br>/<wbr>
// in a fallback is a deliberate pre-load line break, not lost emphasis.
const BARE_TAG_OK = new Set(['br', 'wbr']);

// Shallow element reader: every element carrying `attrRe`, with its inner HTML and 1-based line.
function elementsWithAttr(html, attrRe) {
  const out = [];
  const openRe = /<([a-zA-Z][\w-]*)\b([^>]*)>/g;
  let m;
  while ((m = openRe.exec(html))) {
    const [, tag, attrs] = m;
    attrRe.lastIndex = 0;
    if (!attrRe.test(attrs)) continue;
    const scan = new RegExp('<(/?)' + tag + '\\b[^>]*>', 'gi');
    scan.lastIndex = openRe.lastIndex;
    let depth = 1, end = -1, mm;
    while ((mm = scan.exec(html))) {
      if (mm[1] === '/') { if (--depth === 0) { end = mm.index; break; } }
      else if (!/\/>$/.test(mm[0])) depth++;
    }
    if (end < 0) continue;
    out.push({ attrs, inner: html.slice(openRe.lastIndex, end), line: lineNoAt(html, m.index) });
  }
  return out;
}

function checkCorpus(targets) {
  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  const header = rows[0] || [];
  const langs = header.slice(1, Math.max(1, header.length - 2));
  const values = {};                                  // key -> { lang: value }
  rows.slice(1).forEach((r) => {
    if (!r[0]) return;
    const byLang = {};
    langs.forEach((lang, i) => { if (r.length > 1 + i) byLang[lang] = r[1 + i]; });
    values[r[0]] = byLang;
  });

  const rel = f => path.relative(ROOT, f);
  const c1 = [], c2 = [], parity = [];

  // C1 — executable JS anywhere in the corpus, in any language column.
  for (const key of Object.keys(values)) {
    for (const [lang, v] of Object.entries(values[key])) {
      if (!v) continue;
      if (EVENT_ATTR_RE.test(v)) c1.push({ key, lang, why: 'inline event handler' });
      else if (JS_URL_RE.test(v)) c1.push({ key, lang, why: 'javascript: URL' });
    }
  }

  const htmlKeysSeen = new Set();
  for (const file of targets) {
    if (!file.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');

    for (const el of elementsWithAttr(html, /\bdata-i18n-html\s*=/)) {
      const key = (el.attrs.match(/\bdata-i18n-html\s*=\s*"([^"]+)"/) || [])[1];
      if (!key) continue;
      htmlKeysSeen.add(key);
      const fb = tagMultiset(el.inner);
      for (const [lang, v] of Object.entries(values[key] || {})) {
        if (v === undefined || v === '') continue;     // empty cell falls back to `en` (Check B owns it)
        if (tagMultiset(v) !== fb) {
          parity.push({ file: rel(file), line: el.line, key, msg: 'fallback markup differs from the `' + lang + '` value (fallback [' + fb + '] vs [' + tagMultiset(v) + '])' });
        }
      }
    }

    for (const el of elementsWithAttr(html, /\bdata-i18n(?![-\w])\s*=/)) {
      const key = (el.attrs.match(/\bdata-i18n(?![-\w])\s*=\s*"([^"]+)"/) || [])[1];
      if (!key) continue;
      const tags = [...new Set((el.inner.match(/<\/?([a-zA-Z][\w-]*)/g) || [])
        .map(t => t.replace(/[<\/]/g, '').toLowerCase()))].filter(t => !BARE_TAG_OK.has(t));
      if (tags.length) {
        parity.push({ file: rel(file), line: el.line, key, msg: 'plain data-i18n element carries <' + tags.join('>, <') + '> — applyStaticI18n sets textContent, so the markup is dropped; use data-i18n-html' });
      }
    }
  }

  // C2 — a data-i18n-html key must not interpolate; {placeholder} content would reach innerHTML.
  for (const key of htmlKeysSeen) {
    for (const [lang, v] of Object.entries(values[key] || {})) {
      if (v && /\{\w+\}/.test(v)) c2.push({ key, lang });
    }
  }

  return { c1, c2, parity, keys: Object.keys(values).length, langs };
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

  // Check B — translation-debt report (warn-only), per non-`en` language column.
  const debt = checkDebt();
  const debtLangs = Object.keys(debt);
  if (debtLangs.length) {
    for (const lang of debtLangs) {
      const empties = debt[lang];
      const preview = empties.slice(0, 50);
      console.warn('\ncheck-i18n: WARNING — ' + empties.length + ' key(s) have an empty `' + lang + '` (translation debt):');
      console.warn('  ' + preview.join('\n  '));
      if (empties.length > preview.length) console.warn('  … and ' + (empties.length - preview.length) + ' more.');
    }
  } else {
    console.log('check-i18n: Check B clean — every ui-strings.csv key is translated in every language column (allowlisted exceptions aside).');
  }

  // Check C — corpus gate (C1/C2 blocking) + markup-parity report (warn-only).
  const corpus = checkCorpus(targets);
  if (corpus.c1.length) {
    console.error('\ncheck-i18n: ' + corpus.c1.length + ' localization cell(s) contain executable JavaScript — rebuild the site with addEventListener (CLAUDE.md Security rule 2):');
    corpus.c1.forEach(v => console.error('  ' + v.key + '  [' + v.lang + ']  ' + v.why));
  }
  if (corpus.c2.length) {
    console.error('\ncheck-i18n: ' + corpus.c2.length + ' data-i18n-html key(s) interpolate a {placeholder} into innerHTML — split the interpolated part out, or use plain data-i18n:');
    corpus.c2.forEach(v => console.error('  ' + v.key + '  [' + v.lang + ']'));
  }
  if (!corpus.c1.length && !corpus.c2.length) {
    console.log('check-i18n: Check C clean — no executable JS in ' + corpus.keys + ' key(s) × ' + corpus.langs.length + ' language column(s), and no data-i18n-html key interpolates.');
  }
  if (corpus.parity.length) {
    console.warn('\ncheck-i18n: WARNING — ' + corpus.parity.length + ' data-i18n markup-parity finding(s) (the `i18n-html-markup-only-in-fallback` pattern):');
    corpus.parity.sort(byLoc).forEach(v => console.warn('  ' + v.file + ':' + v.line + '  ' + v.key + ' — ' + v.msg));
  }

  // Check D — CSV quoting integrity (blocking). A malformed cell loses its quotes silently.
  const quoting = findQuotingViolations(fs.readFileSync(CSV_PATH, 'utf8'));
  if (quoting.length) {
    console.error('\ncheck-i18n: ' + quoting.length + ' malformed CSV quoting site(s) in locales/ui-strings.csv — double the inner quote ("" per RFC-4180), or the value ships without it:');
    quoting.forEach(v => console.error('  line ' + v.line + ' col ' + v.col + '  [' + v.shape + ']  ' + v.key + '  …' + v.excerpt + '…'));
  } else {
    console.log('check-i18n: Check D clean — locales/ui-strings.csv is valid RFC-4180 (no quote is silently dropped from a built value).');
  }

  const blocking = fresh.length + corpus.c1.length + corpus.c2.length + quoting.length;
  if (!blocking) console.log('\ncheck-i18n: clean (no new blocking violations).');
  process.exit(blocking ? 1 : 0);
}

main();
