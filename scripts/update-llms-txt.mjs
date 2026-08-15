#!/usr/bin/env node
/**
 * update-llms-txt.mjs — regenerate /llms.txt and /llms-full.txt, the curated plain-text
 * site map for LLMs and fetching agents (https://llmstxt.org).
 *
 * Plain Node, zero dependencies. Run from anywhere:
 *   node scripts/update-llms-txt.mjs
 *   node scripts/update-llms-txt.mjs --check    # exit 1 if either file is stale, write nothing
 *
 * Two files, per the convention:
 *   llms.txt       — the short index: one line per tool. What an agent reads to orient.
 *   llms-full.txt  — the expanded version: each tool's full description, how-to steps, and
 *                    questions & answers. What an agent reads to actually answer a question
 *                    like "does IvritSuite work offline?" without parsing the HTML.
 *
 * Why a generator and not hand-written files: a stale llms.txt is worse than none, so nothing
 * here is authored twice. Everything is DERIVED from metadata this repo already maintains:
 *   - sitemap.xml            -> which pages exist, and their order
 *   - index.html JSON-LD     -> WebSite name/description + the curated ItemList of tools
 *                               (names, URLs, order, one-line descriptions)
 *   - each page's JSON-LD    -> WebApplication/CollectionPage description, HowTo steps, FAQPage Q&A
 *   - each page's <head>     -> <title> and <meta name="description">
 * The ONLY hand-maintained prose is SITE_INTRO below. Edit that here, never in the output.
 *
 * Note on expectations: no major AI provider consumes llms.txt in production, and Google
 * Search explicitly ignores it. These files are a cheap forward hedge plus a readable
 * inventory for agents pointed at the site — they are not an SEO mechanism. The machinery
 * search engines actually read is sitemap.xml + the per-page JSON-LD this script reads FROM.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sitemapPath = join(repoRoot, 'sitemap.xml');
const indexOut = join(repoRoot, 'llms.txt');
const fullOut = join(repoRoot, 'llms-full.txt');
const checkOnly = process.argv.includes('--check');

const SITE_URL = 'https://ivritsuite.com/';

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
  { name: 'llms-full.txt', url: SITE_URL + 'llms-full.txt', desc: 'The expanded version of this file — every tool with its how-to steps and questions & answers.' },
];

// ── Extraction ────────────────────────────────────────────────────────────────

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

/** The page's own richest self-description, whatever schema.org type carries it. */
function selfDescOf(ld) {
  const node = ld.find((n) => n && ['WebApplication', 'CollectionPage', 'WebSite'].includes(n['@type']) && n.description);
  return node ? node.description : null;
}

/** "PT3M" / "PT1H30M" -> "about 3 minutes" / "about 1 hour 30 minutes"; null if unparseable. */
function humanDuration(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(String(iso || ''));
  if (!m || (!m[1] && !m[2])) return null;
  const parts = [];
  const plural = (n, unit) => `${n} ${unit}${Number(n) === 1 ? '' : 's'}`;
  if (m[1]) parts.push(plural(m[1], 'hour'));
  if (m[2]) parts.push(plural(m[2], 'minute'));
  return 'about ' + parts.join(' ');
}

function howToOf(ld) {
  const node = byType(ld, 'HowTo');
  if (!node || !Array.isArray(node.step)) return null;
  const steps = [...node.step]
    .sort((a, b) => (a.position || 0) - (b.position || 0))
    .map((s) => ({ name: s.name || '', text: s.text || '' }))
    .filter((s) => s.name || s.text);
  return steps.length ? { name: node.name || 'How to use it', time: humanDuration(node.totalTime), steps } : null;
}

function faqOf(ld) {
  const node = byType(ld, 'FAQPage');
  if (!node || !Array.isArray(node.mainEntity)) return [];
  return node.mainEntity
    .map((q) => ({ q: q.name || '', a: q.acceptedAnswer?.text || '' }))
    .filter((e) => e.q && e.a);
}

function readPage(file) {
  const full = join(repoRoot, file);
  if (!existsSync(full)) return null;
  const head = headOf(readFileSync(full, 'utf8'));
  const ld = jsonLdOf(head);
  return {
    file,
    name: pageName(head),
    desc: metaDescOf(head),
    selfDesc: selfDescOf(ld),
    howTo: howToOf(ld),
    faq: faqOf(ld),
    ld,
  };
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

const tools = [...itemList.itemListElement]
  .sort((a, b) => (a.position || 0) - (b.position || 0))
  .map((item) => {
    const page = pages.get(item.url) || null;
    return {
      name: item.name,
      url: item.url,
      // llms.txt wants the curated one-liner; llms-full.txt wants the page's own fuller prose.
      desc: item.description || page?.selfDesc || page?.desc || '',
      longDesc: page?.selfDesc || item.description || page?.desc || '',
      howTo: page?.howTo || null,
      faq: page?.faq || [],
    };
  });

const listed = new Set(tools.map((t) => t.url));
const secondary = locs
  .filter((loc) => loc !== indexLoc && !listed.has(loc) && pages.has(loc))
  .map((loc) => {
    const page = pages.get(loc);
    return { name: page.name, url: loc, desc: page.desc || '' };
  });

// ── Render ────────────────────────────────────────────────────────────────────
const FOOTER = '_Generated by scripts/update-llms-txt.mjs from sitemap.xml and each page\'s metadata — do not edit by hand._';

const bullet = (l) => `- [${l.name}](${l.url})${l.desc ? `: ${l.desc}` : ''}`;

const renderedIndex = [
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
  ...secondary.concat(EXTRA_LINKS).map(bullet),
  '',
  FOOTER,
  '',
].join('\n');

function renderTool(tool) {
  const out = [`## ${tool.name}`, '', tool.url, ''];
  if (tool.longDesc) out.push(tool.longDesc, '');

  if (tool.howTo) {
    out.push(`### ${tool.howTo.name}${tool.howTo.time ? ` (${tool.howTo.time})` : ''}`, '');
    tool.howTo.steps.forEach((s, i) => {
      const body = s.name && s.text ? `**${s.name}** — ${s.text}` : (s.name || s.text);
      out.push(`${i + 1}. ${body}`);
    });
    out.push('');
  }

  if (tool.faq.length) {
    out.push('### Questions', '');
    for (const { q, a } of tool.faq) out.push(`**${q}**`, '', a, '');
  }
  return out;
}

const renderedFull = [
  `# ${heading}`,
  '',
  `> ${summary}`,
  '',
  SITE_INTRO,
  '',
  `This is the expanded version of ${SITE_URL}llms.txt — every tool with its full description,`,
  'how-to steps, and questions & answers.',
  '',
  '---',
  '',
  ...tools.flatMap((t) => renderTool(t).concat('---', '')),
  '## Other pages',
  '',
  ...secondary.concat(EXTRA_LINKS.filter((l) => !l.url.endsWith('llms-full.txt'))).map(bullet),
  '',
  FOOTER,
  '',
].join('\n');

// ── Write ─────────────────────────────────────────────────────────────────────
const targets = [
  { path: indexOut, label: 'llms.txt', text: renderedIndex },
  { path: fullOut, label: 'llms-full.txt', text: renderedFull },
];

let stale = false;
for (const t of targets) {
  const previous = existsSync(t.path) ? readFileSync(t.path, 'utf8') : null;
  if (previous === t.text) {
    console.log(checkOnly ? `${t.label} is current.` : `${t.label} already current — no changes.`);
    continue;
  }
  if (checkOnly) {
    console.error(`${t.label} is STALE — run: node scripts/update-llms-txt.mjs`);
    stale = true;
  } else {
    writeFileSync(t.path, t.text);
    console.log(previous === null ? `${t.label} created.` : `${t.label} updated.`);
  }
}
if (stale) process.exit(1);

const steps = tools.reduce((n, t) => n + (t.howTo ? t.howTo.steps.length : 0), 0);
const faqs = tools.reduce((n, t) => n + t.faq.length, 0);
console.log(`  ${tools.length} tools, ${secondary.length} secondary links, from ${pages.size} pages.`);
console.log(`  ${steps} how-to steps and ${faqs} questions in llms-full.txt.`);

const missingDesc = [...tools, ...secondary].filter((l) => !l.desc).map((l) => l.name);
if (missingDesc.length) console.log('  No description found for: ' + missingDesc.join(', '));
const noFaq = tools.filter((t) => !t.faq.length).map((t) => t.name);
if (noFaq.length) console.log('  No FAQPage JSON-LD on: ' + noFaq.join(', '));
