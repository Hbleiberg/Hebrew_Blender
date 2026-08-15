#!/usr/bin/env node
/**
 * update-llms-txt.mjs — regenerate /llms.txt, the curated plain-text site map for
 * LLMs and fetching agents (https://llmstxt.org).
 *
 * Plain Node, zero dependencies. Run from anywhere:
 *   node scripts/update-llms-txt.mjs
 *   node scripts/update-llms-txt.mjs --check    # exit 1 if llms.txt is stale, write nothing
 *
 * Why a generator and not a hand-written file: a stale llms.txt is worse than none,
 * so nothing here is authored twice. Every tool name, URL, order and description is
 * DERIVED from metadata this repo already maintains:
 *   - sitemap.xml            -> which pages exist, and their order
 *   - index.html JSON-LD     -> WebSite name/description + the curated ItemList of tools
 *                               (names, URLs, order, one-line descriptions)
 *   - each page's JSON-LD    -> WebApplication description (fallback)
 *   - each page's <head>     -> <title> and <meta name="description"> (final fallback)
 * The ONLY hand-maintained prose is SITE_INTRO below. Edit that here, never in llms.txt.
 *
 * Note on expectations: no major AI provider consumes llms.txt in production, and Google
 * Search explicitly ignores it. This file is a cheap forward hedge plus a readable tool
 * inventory for agents pointed at the site — it is not an SEO mechanism. The machinery
 * search engines actually read is sitemap.xml + the per-page JSON-LD this script reads FROM.
 *
 * Standing end-of-session step (see CLAUDE.md): run this after any change to a page's
 * title, meta description, or JSON-LD, and after adding or removing a page.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(repoRoot, 'sitemap.xml');
const outPath = join(repoRoot, 'llms.txt');
const checkOnly = process.argv.includes('--check');

/** The one hand-maintained block: facts about the suite that live in no page's metadata. */
const SITE_INTRO = [
  'Everything runs entirely in the browser. There are no accounts, no ads, and no server:',
  'presets, settings and custom fonts are saved on your own device, and are backed up by',
  'downloading a portable `.ivrit` save file. The whole suite installs as an offline PWA.',
  'The interface is available in English and Hebrew. Content is CC BY-NC-SA 4.0 (material',
  'incorporating PocketTorah audio is CC BY-SA 4.0).',
].join('\n');

const EXTRA_LINKS = [
  { name: 'Source code', url: 'https://github.com/hbleiberg/Hebrew_Blender', desc: 'The full static site, hand-authored and open source.' },
];

/** "https://ivritsuite.com/" -> "index.html"; ".../foo.html" -> "foo.html" */
function locToFile(loc) {
  const path = new URL(loc).pathname.replace(/^\//, '');
  return path === '' ? 'index.html' : path;
}

function decodeEntities(s) {
  return String(s)
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/**
 * Everything up to the first </head>. The Font Maker's inline JS contains template
 * literals like `<title>${title}</title>`, which a whole-file regex happily mistakes
 * for the document title — so every extractor below reads the head slice only.
 */
function headOf(html) {
  const end = html.search(/<\/head>/i);
  return end === -1 ? html : html.slice(0, end);
}

function titleOf(head) {
  const m = head.match(/<title>([\s\S]*?)<\/title>/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

/** "Trope Tutor — Learn … | IvritSuite" -> "Trope Tutor — Learn …" */
function pageName(head) {
  const t = titleOf(head);
  return t ? t.split('|')[0].trim() : null;
}

function metaDescOf(head) {
  const m = head.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  return m ? decodeEntities(m[1].trim()) : null;
}

/** Every parseable JSON-LD object in the head, with @graph members flattened in. */
function jsonLdOf(head) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(head)) !== null) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);   // trusted: our own committed files
    } catch (e) {
      console.warn(`  warning: unparseable JSON-LD block skipped (${e.message})`);
      continue;
    }
    for (const node of [].concat(parsed)) {
      out.push(node);
      if (Array.isArray(node['@graph'])) out.push(...node['@graph']);
    }
  }
  return out;
}

const byType = (nodes, type) => nodes.find((n) => n && n['@type'] === type) || null;

function readPage(file) {
  const full = join(repoRoot, file);
  if (!existsSync(full)) return null;
  const head = headOf(readFileSync(full, 'utf8'));
  return { file, head, name: pageName(head), desc: metaDescOf(head), ld: jsonLdOf(head) };
}

// ── Gather ────────────────────────────────────────────────────────────────────
const locs = [...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) {
  console.error('update-llms-txt: no <loc> entries found in sitemap.xml — refusing to write an empty map.');
  process.exit(1);
}

const pages = new Map();   // absolute URL -> page record
for (const loc of locs) {
  const page = readPage(locToFile(loc));
  if (page) pages.set(loc, page);
  else console.warn(`  warning: ${locToFile(loc)} is in sitemap.xml but missing on disk — skipped`);
}

const indexLoc = locs[0];
const index = pages.get(indexLoc);
if (!index) {
  console.error('update-llms-txt: could not read index.html — it is the source of the tool list.');
  process.exit(1);
}

const site = byType(index.ld, 'WebSite');
const itemList = byType(index.ld, 'ItemList');
if (!itemList || !Array.isArray(itemList.itemListElement)) {
  console.error(
    'update-llms-txt: index.html has no JSON-LD ItemList of tools.\n' +
    '  That list is the source of the tool section (names, URLs, order, descriptions).'
  );
  process.exit(1);
}

const heading = site?.name || 'IvritSuite';
// The <meta name="description"> is the SEO-tuned one-liner and names the individual tools;
// the JSON-LD WebSite description is the terser fallback.
const summary = index.desc || site?.description || '';

/** Per-tool one-liner: curated ItemList blurb, else the page's own WebApplication description. */
function toolDesc(item) {
  const page = pages.get(item.url);
  const webApp = page ? byType(page.ld, 'WebApplication') : null;
  return item.description || webApp?.description || page?.desc || '';
}

const tools = [...itemList.itemListElement]
  .sort((a, b) => (a.position || 0) - (b.position || 0))
  .map((item) => ({ name: item.name, url: item.url, desc: toolDesc(item) }));

const listed = new Set(tools.map((t) => t.url));
const secondary = locs
  .filter((loc) => loc !== indexLoc && !listed.has(loc) && pages.has(loc))
  .map((loc) => {
    const page = pages.get(loc);
    return { name: page.name, url: loc, desc: page.desc || '' };
  })
  .concat(EXTRA_LINKS);

// ── Render ────────────────────────────────────────────────────────────────────
const bullet = (l) => `- [${l.name}](${l.url})${l.desc ? `: ${l.desc}` : ''}`;

const rendered = [
  `# ${heading}`,
  '',
  `> ${summary}`,
  '',
  SITE_INTRO,
  '',
  '## Tools',
  '',
  ...tools.map(bullet),
  '',
  '## Optional',
  '',
  ...secondary.map(bullet),
  '',
  `_Generated by scripts/update-llms-txt.mjs from sitemap.xml and each page's metadata — do not edit by hand._`,
  '',
].join('\n');

// ── Write ─────────────────────────────────────────────────────────────────────
const previous = existsSync(outPath) ? readFileSync(outPath, 'utf8') : null;

if (checkOnly) {
  if (previous === rendered) {
    console.log('llms.txt is current.');
  } else {
    console.error('llms.txt is STALE — run: node scripts/update-llms-txt.mjs');
    process.exit(1);
  }
} else if (previous === rendered) {
  console.log('llms.txt already current — no changes.');
} else {
  writeFileSync(outPath, rendered);
  console.log(previous === null ? 'llms.txt created.' : 'llms.txt updated.');
}

console.log(`  ${tools.length} tools, ${secondary.length} secondary links, from ${pages.size} pages.`);
const missingDesc = [...tools, ...secondary].filter((l) => !l.desc).map((l) => l.name);
if (missingDesc.length) console.log('  No description found for: ' + missingDesc.join(', '));
