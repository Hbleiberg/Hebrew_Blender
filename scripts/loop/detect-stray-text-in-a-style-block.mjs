#!/usr/bin/env node
// Detector for the loop pattern `stray-text-in-a-style-block` (docs/reference/loop-patterns.md).
//
// Shape: text that is not CSS sits inside a page's <style> (a builder's status line pasted with the block it printed,
// a stray word, an unclosed comment's tail). The browser reads it as the start of the next rule's selector, so that
// whole rule is dropped without a sound; at the end of a block it drops nothing but is still junk waiting for the next
// rule pasted after it. Fix shape: delete the text; a builder whose output is pasted keeps its status line off stdout.
//
// Rendered: every *.html at the root and in parsha/ and holidays/; each <style> element's text as the markup holds it
// (the source with its <script> elements and comments set aside), parsed by Chromium in one blank page, so no page
// loads, redirects or injects a style of its own. For each block: the top-level rules its text holds (a brace scanner
// that skips comments and strings) against the rules the browser kept (sheet.cssRules.length); a style rule whose
// selector the browser cannot parse (CSS.supports('selector(…)'), a list part by part) is named; text after the last
// rule is a hit too. Exit 1 on hits.
//   --json   { id, hits: [{ file, line, note }], delta }
//   --plant  adds a block with a stray line before a rule to the hub's and must report it (exit 1 if not)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

const ID = 'stray-text-in-a-style-block';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const JSON_OUT = process.argv.includes('--json');
const PLANT = process.argv.includes('--plant');
const PW = ['/opt/node22/lib/node_modules/playwright/index.js', 'playwright'];
let chromium;
for (const p of PW) { try { chromium = (p.startsWith('/') ? (await import(p)).default : createRequire(import.meta.url)(p)).chromium; break; } catch (e) {} }
if (!chromium) { console.log(`${ID}: Playwright not found — skipped.`); process.exit(0); }

const PLANT_CSS = '.plant-a{color:red}\nplanted: a status line\n.plant-b{color:blue}';
const list = dir => existsSync(join(root, dir)) ? readdirSync(join(root, dir)).filter(f => f.endsWith('.html')).sort().map(f => (dir ? dir + '/' : '') + f) : [];
const pages = PLANT ? ['index.html'] : [...list(''), ...list('parsha'), ...list('holidays')];
// Each page's <style> texts with their offsets: <script> elements and comments are blanked to spaces first (same
// length, so an offset still points into the file), which keeps a style written inside a script's template out.
const blocksOf = src => {
  const masked = src.replace(/<script\b[^>]*>[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, m => ' '.repeat(m.length));
  return [...masked.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)].map(m => ({ text: m[1], at: m.index + m[0].indexOf('>') + 1 }));
};
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<!doctype html><html><head></head><body></body></html>');
const hits = []; let blocks = 0;
for (const file of pages) {
  const src = readFileSync(join(root, file), 'utf8');
  const found = blocksOf(src);
  if (PLANT) found.push({ text: PLANT_CSS, at: -1 });
  const res = await page.evaluate(texts => texts.map(text => {
    const scan = css => {   // top-level rules: their preludes (comments dropped, offset of their first character) and the text after the last one
      const preludes = []; let depth = 0, i = 0, start = 0;
      const clean = s => s.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const lead = k => { const m = /^(\s|\/\*[\s\S]*?\*\/)*/.exec(css.slice(k)); return k + m[0].length; };
      while (i < css.length) {
        const c = css[i];
        if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? css.length : e + 2; continue; }
        if (c === '"' || c === "'") { i++; while (i < css.length && css[i] !== c) { if (css[i] === '\\') i++; i++; } i++; continue; }
        if (c === '{') { if (depth === 0) preludes.push({ text: clean(css.slice(start, i)), at: lead(start) }); depth++; }
        else if (c === '}') { depth--; if (depth === 0) start = i + 1; }
        else if (c === ';' && depth === 0) { const p = clean(css.slice(start, i)); if (/^@(import|charset|namespace|layer)\b/.test(p)) preludes.push({ text: p, at: lead(start) }); start = i + 1; }
        i++;
      }
      return { preludes, tail: clean(css.slice(start)), tailAt: lead(start) };
    };
    // selector() takes one complex selector, so a list is tried part by part (split on the commas outside brackets)
    const parts = t => { const out = []; let d = 0, b = 0; for (let k = 0; k < t.length; k++) { const c = t[k]; if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; else if (c === ',' && !d) { out.push(t.slice(b, k)); b = k + 1; } } out.push(t.slice(b)); return out.map(x => x.trim()); };
    const el = document.createElement('style'); el.textContent = text; document.head.appendChild(el);
    const kept = el.sheet ? el.sheet.cssRules.length : -1; el.remove();
    const r = scan(text);
    const bad = r.preludes.filter(p => !p.text.startsWith('@') && parts(p.text).some(x => !CSS.supports('selector(' + x + ')')));
    return { n: r.preludes.length, kept, bad: bad.map(p => ({ text: p.text.slice(0, 120), at: p.at })), tail: r.tail.slice(0, 120), tailAt: r.tailAt };
  }), found.map(b => b.text));
  const lineAt = off => off < 0 ? 0 : src.slice(0, off).split('\n').length;
  res.forEach((r, k) => {
    const b = found[k]; if (!b.text.trim()) return;
    blocks++;
    const at = o => b.at < 0 ? -1 : b.at + o;
    if (r.kept >= 0 && r.kept < r.n) {
      if (r.bad.length) for (const p of r.bad) hits.push({ file, line: lineAt(at(p.at)), note: `a rule dropped: its selector reads "${p.text.split('\n')[0]}"` });
      else hits.push({ file, line: lineAt(at(0)), note: `${r.n - r.kept} of ${r.n} top-level rules dropped by the parser` });
    }
    if (r.tail) hits.push({ file, line: lineAt(at(r.tailAt)), note: `text after the last rule: "${r.tail.split('\n')[0]}"` });
  });
}
await browser.close();

if (!PLANT && !blocks) { console.log(`${ID}: no <style> block measured — the probe did not resolve.`); process.exit(1); }
if (PLANT) {
  const ok = hits.some(h => /planted: a status line/.test(h.note));
  if (JSON_OUT) console.log(JSON.stringify({ id: ID, plant: ok }));
  else console.log(ok ? `${ID}: plant reported (${hits.length} hit(s) with it).` : `${ID}: PLANT NOT REPORTED.`);
  process.exit(ok ? 0 : 1);
}
if (JSON_OUT) console.log(JSON.stringify({ id: ID, hits, measured: blocks, delta: null }, null, 1));
else { console.log(`${ID}: ${hits.length} hit(s) over ${blocks} <style> blocks on ${pages.length} pages.`); for (const h of hits) console.log(`  ${h.file}:${h.line} ${h.note}`); }
process.exit(hits.length ? 1 : 0);
