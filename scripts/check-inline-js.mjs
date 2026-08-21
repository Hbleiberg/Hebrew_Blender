#!/usr/bin/env node
/* Parse every inline <script> in every root HTML page.
 *
 * The whole suite is hand-authored single-file apps: one syntax error anywhere in a page's inline
 * script kills that page's ENTIRE app while the static HTML still renders, so the failure looks like
 * a styling glitch rather than a dead page. That is exactly how a stray backtick inside a JS template
 * literal (the v5.18 changelog listing the ` symbol) took the Font Maker down in production.
 *
 * Parse-only — nothing is executed. type="application/ld+json" blocks are validated as JSON instead,
 * and <script src=…> is ignored. Plain Node, no deps. Exit 1 on any failure.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pages = readdirSync(root).filter(f => f.endsWith('.html')).sort();
const RE = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;

// Several pages document their own structure in HTML comments that contain the literal text
// "<script>" — matching those swallows English prose as if it were code. Blank comments out
// first, preserving byte offsets so reported line numbers stay true.
const stripComments = h => h.replace(/<!--[\s\S]*?-->/g, c => c.replace(/[^\n]/g, ' '));

let checked = 0, json = 0, skipped = 0, failures = [];
for (const page of pages) {
  const html = stripComments(readFileSync(join(root, page), 'utf8'));
  let m, i = -1;
  while ((m = RE.exec(html)) !== null) {
    i++;
    const attrs = (m[1] || '').trim(), body = m[2];
    const line = html.slice(0, m.index).split('\n').length;
    if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) {
      json++;
      try { JSON.parse(body); }
      catch (e) { failures.push(`${page}:${line}  JSON-LD block #${i} — ${e.message}`); }
      continue;
    }
    if (!body.trim()) continue;
    checked++;
    // ESM blocks need a module parser; vm.SourceTextModule is behind a flag, so when it is not
    // available they are counted as skipped rather than silently claimed as checked.
    const isModule = /type\s*=\s*["']module["']/i.test(attrs);
    if (isModule && typeof vm.SourceTextModule !== 'function') { checked--; skipped++; continue; }
    try {
      if (isModule) new vm.SourceTextModule(body, { identifier: `${page}#${i}` });
      else new vm.Script(body, { filename: `${page}#${i}` });
    } catch (e) { failures.push(`${page}:${line}  inline script block #${i} — ${e.message}`); }
  }
}

if (failures.length) {
  console.error(`\ncheck-inline-js: ${failures.length} PARSE FAILURE(S)\n`);
  failures.forEach(f => console.error('  ' + f));
  console.error('\nA syntax error here disables the whole page\'s JavaScript in the browser.\n');
  process.exit(1);
}
console.log(`check-inline-js: clean — ${checked} classic inline script block(s) + ${json} JSON-LD block(s) across ${pages.length} pages parse.` + (skipped ? ` (${skipped} type="module" block(s) skipped — run with `
  + `--experimental-vm-modules to include them.)` : ''));
