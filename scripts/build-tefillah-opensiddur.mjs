#!/usr/bin/env node
/*
 * build-tefillah-opensiddur.mjs — turn Open Siddur prayer pages into the Tefillah Trainer's snapshot files.
 * On demand only; never a site build step, and the page itself never asks opensiddur.org for anything.
 *
 *   node scripts/build-tefillah-opensiddur.mjs                 every source in data/tefillah/opensiddur-sources.json
 *   node scripts/build-tefillah-opensiddur.mjs --only <key>    one of them
 *   node scripts/build-tefillah-opensiddur.mjs --dry           read and report, write nothing
 *   node scripts/build-tefillah-opensiddur.mjs --list <file> --out-dir <dir>   another list and folder (trying a page out)
 *
 * data/tefillah/opensiddur-sources.json is the list:
 *   { "v": 1, "sources": [
 *       { "key": "modeh-ani",                      the catalog key, and the file name: data/tefillah/opensiddur/<key>.json
 *         "url": "https://opensiddur.org/…",       the prayer's page
 *         "html": "path/to/the-saved-page.html",   optional: a copy of the page saved from a browser (see below);
 *                                                  the path is read from the list's own folder
 *         "table": 1,                              optional: which Source / Translation table of the page (1 = first)
 *         "english": true,                         optional: also take the English column — only where the page's
 *                                                  licence covers the translation (your reading of the page, not a guess)
 *         "variantOrder": "fm",                    optional: which side of a "A|B" pair is feminine ("fm", the default:
 *                                                  feminine first; "mf": masculine first). Check it on each page.
 *         "title", "contributors", "license", "licenseUrl", "retrieved"   optional: what the page states, typed in when
 *                                                  the script cannot read it from the page's markup } ] }
 *
 * What it takes from a page, verbatim: the Hebrew column of its "Source (Hebrew) | Translation (English)" table,
 * one line per piece of the table (and the English column only when asked). It never writes, corrects or completes a
 * text, and it keeps the inline "A|B" pairs that give a word in two gendered forms exactly as the page has them
 * (the page shows both, or the one chosen in Settings).
 *
 * What it refuses, writing no file: a page with no such table (it lists the tables it did find); a licence it cannot
 * read or that is not one Open Siddur accepts (Public Domain, CC0, CC BY, CC BY-SA); more than one licence on the page
 * with none named in the list; no contributor credit. A text is never relabelled: its licence and its contributors
 * go into its file and are shown beside it on the page.
 *
 * opensiddur.org challenges scripts (a request from here is answered 403), so the usual way in is a saved copy: open
 * the page in a browser, save it as "Web Page, HTML only", and name that file in the entry's "html". The saved page is
 * read with scripts off and the network closed.
 *
 * After writing a file: set that prayer's "opensiddur" source in data/tefillah/catalog.json to its key, bump
 * OPENSIDDUR_DATA_V in tefillah_trainer.html when an existing file changed (the /data/ cache is keyed by ?v=), run
 * node scripts/check-tefillah-refs.mjs, and commit the file with the list.
 *
 * Needs the preinstalled Playwright + Chromium (docs/reference/ops.md → the headless recipe): the page is read through
 * a real DOM, not by regular expressions. Behind a proxy: NODE_USE_ENV_PROXY=1 node scripts/build-tefillah-opensiddur.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { licenseName } from './tefillah-sefaria.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
const LIST = opt('--list') ? path.resolve(opt('--list')) : path.join(ROOT, 'data/tefillah/opensiddur-sources.json');
const OUT_DIR = opt('--out-dir') ? path.resolve(opt('--out-dir')) : path.join(ROOT, 'data/tefillah/opensiddur');
const DRY = args.includes('--dry');
const ONLY = opt('--only');
const KEY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ACCEPTED = new Set(['Public Domain', 'CC0', 'CC BY', 'CC BY-SA']);      // what Open Siddur itself accepts
const die = (msg) => { console.error('build-tefillah-opensiddur: ' + msg); process.exit(1); };

// A Creative Commons address → the licence it names ('' when it is not one of them).
export function licenseFromUrl(url) {
  const m = /^https?:\/\/creativecommons\.org\/(publicdomain\/(zero|mark)|licenses\/(by(?:-[a-z]+)*))\//i.exec(String(url || ''));
  if (!m) return '';
  if (m[2]) return m[2].toLowerCase() === 'zero' ? 'CC0' : 'Public Domain';
  return licenseName('CC-' + m[3].toUpperCase());
}

let list;
try { list = JSON.parse(fs.readFileSync(LIST, 'utf8')); } catch (e) { die(`cannot read ${path.relative(ROOT, LIST)}: ${e.message}`); }
const sources = (Array.isArray(list.sources) ? list.sources : []).filter((s) => !ONLY || s.key === ONLY);
if (!sources.length) {
  console.log(ONLY ? `No source with the key "${ONLY}" in ${path.relative(ROOT, LIST)}.` : `${path.relative(ROOT, LIST)} lists no sources yet: nothing to build. See data/tefillah/opensiddur/README.md.`);
  process.exit(0);
}

let chromium;
try { const m = await import('/opt/node22/lib/node_modules/playwright/index.js'); chromium = (m.default || m).chromium; }
catch (e) { try { const m = await import('playwright'); chromium = (m.default || m).chromium; } catch (e2) { die('Playwright is not available (docs/reference/ops.md → the headless recipe)'); } }

async function pageHtml(src) {
  if (src.html) {
    const file = path.resolve(path.dirname(LIST), src.html);
    if (!fs.existsSync(file)) throw new Error(`the saved page ${src.html} does not exist`);
    return { html: fs.readFileSync(file, 'utf8'), retrieved: fs.statSync(file).mtime.toISOString().slice(0, 10) };
  }
  const res = await fetch(src.url, { headers: { accept: 'text/html' } });
  if (res.status === 403 || res.status === 503) throw new Error(`opensiddur.org answered ${res.status} (it challenges scripts): save the page from a browser and name the file in "html"`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return { html: await res.text(), retrieved: new Date().toISOString().slice(0, 10) };
}

// Runs in the page: the tables, the licence links and the credits the markup offers. Text only, never markup.
function readPage(which) {
  const text = (el) => {
    const c = el.cloneNode(true);
    c.querySelectorAll('sup, script, style, noscript, .footnote, .footnotes, a[href^="#fn"], a[href*="footnote"]').forEach((x) => x.remove());
    c.querySelectorAll('br').forEach((b) => b.replaceWith('\n'));
    c.querySelectorAll('p, div, li').forEach((b) => b.append('\n'));
    return c.textContent.split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  };
  const tables = [...document.querySelectorAll('table')].map((t) => {
    const rows = [...t.rows].map((r) => [...r.cells]);
    const head = rows.length ? rows[0].map((c) => c.textContent.replace(/\s+/g, ' ').trim()) : [];
    return { head, he: head.findIndex((h) => /source\s*\(\s*hebrew\s*\)/i.test(h)), en: head.findIndex((h) => /translation\s*\(\s*english\s*\)/i.test(h)), rows };
  });
  const found = tables.filter((t) => t.he > -1);
  const t = found[which - 1];
  const out = { tables: tables.map((x) => x.head.join(' | ').slice(0, 120)), matching: found.length, lines: null };
  if (t) {
    out.lines = [];
    for (const cells of t.rows.slice(1)) {
      const he = cells[t.he] ? text(cells[t.he]) : [], en = t.en > -1 && cells[t.en] ? text(cells[t.en]) : [];
      if (!he.length && !en.length) continue;
      // a row whose two cells break into as many pieces gives one line per piece; otherwise the row is one line
      if (he.length > 1 && he.length === en.length) he.forEach((h, i) => out.lines.push({ he: h, en: en[i] }));
      else out.lines.push({ he: he.join(' '), en: en.join(' ') });
    }
  }
  const h1 = document.querySelector('h1');
  out.title = (h1 ? h1.textContent : document.title).replace(/\s+/g, ' ').trim();
  out.licenses = [...new Set([...document.querySelectorAll('a[rel~="license"], a[href*="creativecommons.org/licenses/"], a[href*="creativecommons.org/publicdomain/"]')].map((a) => a.href))];
  out.contributors = [...new Set([...document.querySelectorAll('a[rel~="author"], [itemprop="author"], [itemprop="contributor"]')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean))];
  return out;
}

const browser = await chromium.launch();
let failed = 0;
try {
  for (const src of sources) {
    const where = src.key || '(no key)';
    try {
      if (!KEY_RE.test(String(src.key || ''))) throw new Error('"key" must be a catalog key (lower-case words joined by hyphens)');
      if (!/^https:\/\/opensiddur\.org\//.test(String(src.url || ''))) throw new Error('"url" must be an https://opensiddur.org/ page');
      const { html, retrieved } = await pageHtml(src);
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.route('**/*', (r) => r.abort());                     // a saved page loads nothing
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const got = await page.evaluate(readPage, Number.isInteger(src.table) && src.table > 0 ? src.table : 1);
      await ctx.close();
      if (!got.lines) throw new Error(`no "Source (Hebrew)" table${got.matching ? ` number ${src.table}` : ''} on the page. Tables found: ${got.tables.length ? got.tables.map((t, i) => `[${i + 1}] ${t || '(no header)'}`).join('; ') : 'none'}`);
      const he = got.lines.map((l) => l.he);
      if (!he.some(Boolean)) throw new Error('the Hebrew column is empty');
      // the licence: the list's, else the one the page links to (more than one and the list must say which)
      const urls = got.licenses.filter((u) => licenseFromUrl(u));
      const licenseUrl = src.licenseUrl || (urls.length === 1 ? urls[0] : '');
      const license = src.license ? licenseName(src.license) : licenseFromUrl(licenseUrl);
      if (!license) throw new Error(urls.length > 1 ? `the page links to ${urls.length} licences (${urls.join(', ')}): name the text's own in "license" and "licenseUrl"` : 'no licence could be read from the page: name it in "license" and "licenseUrl" as the page states it');
      if (!ACCEPTED.has(license)) throw new Error(`the licence reads as ${license}, which Open Siddur does not publish under: check the page`);
      const contributors = (Array.isArray(src.contributors) ? src.contributors : src.contributors ? [src.contributors] : got.contributors).map((c) => String(c).trim()).filter(Boolean);
      if (!contributors.length) throw new Error('no contributor credit could be read from the page: name them in "contributors" as the page credits them');
      const out = { key: src.key, url: src.url, title: String(src.title || got.title || '').trim(), contributors, license, licenseUrl, retrieved: src.retrieved || retrieved, he };
      if (src.english === true) {
        const en = got.lines.map((l) => l.en);
        if (!en.some(Boolean)) throw new Error('"english": true, but the page has no Translation (English) column');
        out.en = en;
      }
      out.variants = he.some((l) => /\S\|\S/.test(l));
      if (out.variants) out.variantOrder = src.variantOrder === 'mf' ? 'mf' : 'fm';
      const file = path.join(OUT_DIR, src.key + '.json');
      console.log(`${src.key}: ${he.length} lines, ${license}, ${contributors.join(', ')}${out.en ? ', with English' : ''}${out.variants ? `, gendered pairs (${out.variantOrder}: check the order on the page)` : ''}`);
      console.log(`   first: ${he.find(Boolean).split(' ').slice(0, 4).join(' ')}   last: ${[...he].reverse().find(Boolean).split(' ').slice(-3).join(' ')}`);
      if (!DRY) { fs.mkdirSync(OUT_DIR, { recursive: true }); fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n'); console.log('   wrote ' + path.relative(ROOT, file)); }
    } catch (e) { failed++; console.error(`${where}: NOT written — ${e.message}`); }
  }
} finally { await browser.close(); }
if (failed) die(`${failed} of ${sources.length} source(s) were not written`);
if (!DRY) console.log('Next: set each prayer\'s "opensiddur" source in data/tefillah/catalog.json, bump OPENSIDDUR_DATA_V in tefillah_trainer.html if a file changed, run node scripts/check-tefillah-refs.mjs.');
