/*
 * Shared helpers for the Tefillah Trainer's on-demand scripts (walk-tefillah-index.mjs,
 * check-tefillah-refs.mjs). Never a site build step: nothing here runs on a push or a deploy.
 *
 * Everything the Tefillah Trainer shows comes from Sefaria verbatim. These helpers only fetch,
 * measure and classify; none of them writes or changes a liturgical text.
 *
 * In a sandbox whose outbound traffic goes through a proxy, run the scripts with
 * NODE_USE_ENV_PROXY=1 (Node's built-in fetch ignores HTTPS_PROXY without it).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SEFARIA_API = 'https://www.sefaria.org/api';
export const SIDDUR_INDEXES = ['Siddur Ashkenaz', 'Siddur Sefard', 'Siddur Edot HaMizrach'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const _cache = new Map();
let _last = 0;
// TEFILLAH_CACHE_DIR=<dir> keeps every response on disk, so a second run (a check after a --stamp,
// a re-run after a fix) asks Sefaria for nothing it already answered. Delete the directory to
// check against Sefaria afresh.
const CACHE_DIR = process.env.TEFILLAH_CACHE_DIR || '';
const cacheFile = (url) => path.join(CACHE_DIR, crypto.createHash('sha1').update(url).digest('hex') + '.json');
// One request at a time, about one a second, and patient with HTTP 429: a catalog check makes a
// few hundred requests and must not lean on Sefaria's API.
export async function sefariaJSON(url) {
  if (_cache.has(url)) return _cache.get(url);
  if (CACHE_DIR && fs.existsSync(cacheFile(url))) {
    const hit = JSON.parse(fs.readFileSync(cacheFile(url), 'utf8'));
    _cache.set(url, hit);
    return hit;
  }
  let err = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = _last + 900 - Date.now();
    if (wait > 0) await sleep(wait);
    _last = Date.now();
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } });
      if (res.status === 429) {
        const after = parseInt(res.headers.get('retry-after') || '', 10);
        await sleep(Math.min(120, Number.isFinite(after) && after > 0 ? after : 15 * (attempt + 1)) * 1000);
        err = new Error('HTTP 429');
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      _cache.set(url, data);
      if (CACHE_DIR) { fs.mkdirSync(CACHE_DIR, { recursive: true }); fs.writeFileSync(cacheFile(url), JSON.stringify(data)); }
      return data;
    } catch (e) { err = e; await sleep(1500 * (attempt + 1)); }
  }
  throw new Error(`${url}: ${err && err.message}`);
}

// The index's leaf nodes as full refs ("Siddur Ashkenaz, Weekday, Shacharit, Amidah, Patriarchs"), in the
// siddur's own order. A `default` node adds nothing to the path, as Sefaria's refs have it.
export async function leafPaths(indexTitle) {
  const idx = await sefariaJSON(`${SEFARIA_API}/v2/index/${encodeURIComponent(indexTitle.replace(/ /g, '_'))}`);
  const out = [];
  (function walk(node, path) {
    const here = node.default ? path : (path ? path + ', ' + node.title : node.title);
    const kids = node.nodes || [];
    if (!kids.length) out.push(here); else kids.forEach((k) => walk(k, here));
  })({ title: idx.title, nodes: (idx.schema || idx).nodes || [] }, '');
  return out;
}

// A catalog ref names a whole leaf node, or lines of one after a colon:
//   "…, The Shema:3-5" → { node: "…, The Shema", from: 3, to: 5 }; "…, Modeh Ani:2" → from = to = 2.
// The colon is a spelling Sefaria itself resolves (its canonical form is a space), and the only one
// that cannot be mistaken for a title: "…, Hallel, Psalm 118" is a node, "…, Psalm 118:2-3" its lines.
// Tanakh refs ("Deuteronomy 6:4-9") are not split here; the page reads them on its Tanakh path.
export const isTanakhRef = (ref) => /^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy)\s+\d/.test(ref);
export function splitRef(ref) {
  const s = String(ref);
  const m = isTanakhRef(s) ? null : s.match(/^(.*[^\s:]):(\d{1,4})(?:-(\d{1,4}))?$/);
  if (!m) return { node: s, from: null, to: null };
  const from = +m[2], to = m[3] === undefined ? from : +m[3];
  return { node: m[1], from, to };
}

// The licence rule the page uses (tefillah_trainer.html → licenseName): only Public Domain, CC0,
// CC BY, CC BY-SA, CC BY-NC and CC BY-NC-SA. "unknown", an empty value, a "Copyright: …" string
// and every NoDerivatives licence are refused.
export function licenseName(lic) {
  const s = String(lic || '').trim().toLowerCase().replace(/[\s_]+/g, ' ');
  if (!s) return '';
  if (s === 'public domain') return 'Public Domain';
  if (/^cc ?0( 1\.0)?$/.test(s)) return 'CC0';
  const m = s.match(/^cc[- ]by((?:[- ](?:nc|sa|nd))*)(?:[- ]?\d(?:\.\d)?)?$/);
  if (!m) return '';
  const parts = m[1].split(/[- ]/).filter(Boolean);
  if (parts.includes('nd')) return '';
  return 'CC BY' + (parts.includes('nc') ? '-NC' : '') + (parts.includes('sa') ? '-SA' : '');
}
export const isOpenLicense = (lic) => !!licenseName(lic);

export const flatText = (text) => (Array.isArray(text) ? text.flat(4) : [text]).map((x) => (typeof x === 'string' ? x : ''));
// Tags out, <br> as a space (it separates words), an inline tag as nothing (it never splits a word:
// שְׁמַ<big>ע</big> is one word), entities decoded for the few Sefaria uses.
export function plainText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&thinsp;|&ensp;|&emsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}
const NIKKUD_RE = /[ְ-ׇּׁׂ]/;
const HEB_RE = /[א-ת]/;
export const hasHebrew = (s) => HEB_RE.test(s);
export const hasNikkud = (s) => NIKKUD_RE.test(s);
// Real cantillation. The Metsudah editions use U+0592 (over a sheva na) and U+05AF (a pause circle)
// as editorial marks, so those two never count; U+05BD is meteg, not an accent.
export const hasTeamim = (s) => /[֑֓-֮]/.test(s);
// What a line is, by the page's own rule: unpointed Hebrew is an instruction or a heading.
export function lineKind(plain) {
  if (!plain) return 'empty';
  if (!hasHebrew(plain)) return 'other';
  return hasNikkud(plain) ? 'text' : 'instruction';
}
export function firstWords(plain, n = 4) {
  return plain.replace(/[֑-ֽ֯]/g, '').split(' ').slice(0, n).join(' ');
}
export function lastWords(plain, n = 3) {
  const w = plain.replace(/[֑-ֽ֯]/g, '').split(' ');
  return w.slice(Math.max(0, w.length - n)).join(' ');
}

// One version of one whole node: { versionTitle, license, lines[] } or null when Sefaria holds none
// under that title. `lang` is 'hebrew' or 'english'; no title asks for Sefaria's default.
export async function fetchVersion(node, lang, title) {
  const url = `${SEFARIA_API}/v3/texts/${encodeURIComponent(node)}?version=${encodeURIComponent(title ? `${lang}|${title}` : lang)}&return_format=strip_only_footnotes`;
  const data = await sefariaJSON(url);
  if (data.error) throw new Error(String(data.error).slice(0, 160));
  const want = lang === 'hebrew' ? 'he' : 'en';
  const v = (data.versions || []).find((x) => x.language === want);
  return {
    available: data.available_versions || [],
    version: v ? { versionTitle: v.versionTitle, license: v.license, actualLanguage: v.actualLanguage, lines: flatText(v.text) } : null,
  };
}

// ── The catalog (data/tefillah/catalog.json) ─────────────────────────────────────────────────
// A source is null, one part, or an ordered list of parts. A part is a ref string (a whole leaf
// node, or a Tanakh ref inside a `torah` source) or, for lines of a node, an object
//   { "ref": "<leaf>:<a-b>", "he": "<the Hebrew edition the lines were read from, exact>",
//     "from": "<first two pointed words>", "to": "<last two pointed words>", "added"?: true }
// `from` / `to` are consonant skeletons stamped by check-tefillah-refs.mjs --stamp from Sefaria's
// own text (never typed): the page compares them and refuses a range that no longer starts and
// ends where it did, so an edit at Sefaria cannot shift a prayer silently.
export const NUSACHIM = ['ashkenaz', 'sefard', 'edot', 'torah', 'opensiddur'];
export function sourceParts(src) {
  if (src == null) return [];
  return (Array.isArray(src) ? src : [src]).map((p) => (typeof p === 'string' ? { ref: p } : p));
}
// Letters only: no nikkud, no accents, no punctuation; maqaf separates words.
export function skeleton(s) {
  return String(s || '').replace(/־/g, ' ').replace(/[^א-ת\s]/g, '').replace(/\s+/g, ' ').trim();
}
// The pointed words of a plain line, in order (an unpointed word is an instruction's).
export function pointedWords(plain) {
  return String(plain || '').replace(/־/g, ' ').split(/\s+/).filter((w) => hasNikkud(w) && hasHebrew(w));
}
export function rangeEnds(lines) {
  const words = lines.map((raw) => pointedWords(plainText(raw)));
  const first = words.find((w) => w.length), last = [...words].reverse().find((w) => w.length);
  if (!first || !last) return { from: '', to: '' };
  return { from: skeleton(first.slice(0, 2).join(' ')), to: skeleton(last.slice(-2).join(' ')) };
}

// The file is written by this function only (by --stamp), so a hand edit and a stamped copy read alike.
export function formatCatalog(cat) {
  const j = (v) => JSON.stringify(v);
  const part = (p) => (typeof p === 'string' || p === null ? j(p)
    : '{ ' + Object.keys(p).map((k) => `${j(k)}: ${j(p[k])}`).join(', ') + ' }');
  const source = (s) => (Array.isArray(s) ? '[\n' + s.map((p) => '          ' + part(p)).join(',\n') + '\n        ]' : part(s));
  const out = ['{', `  "v": ${j(cat.v)},`, `  "hebrewPreference": ${j(cat.hebrewPreference)},`, '  "groups": ['];
  out.push(cat.groups.map((g) => '    { ' + Object.keys(g).map((k) => `${j(k)}: ${j(g[k])}`).join(', ') + ' }').join(',\n'));
  out.push('  ],', '  "prayers": [');
  out.push(cat.prayers.map((p) => {
    const head = ['key', 'nameKey', 'en', 'he'].map((k) => `${j(k)}: ${j(p[k])}`).join(', ');
    const meta = ['group', 'service', 'days'].map((k) => `${j(k)}: ${j(p[k])}`).join(', ');
    const extra = Object.keys(p).filter((k) => !['key', 'nameKey', 'en', 'he', 'group', 'service', 'days', 'sources'].includes(k)).map((k) => `,\n      ${j(k)}: ${j(p[k])}`).join('');
    const src = NUSACHIM.map((n) => `        ${j(n)}: ${source(p.sources[n] === undefined ? null : p.sources[n])}`).join(',\n');
    return `    { ${head},\n      ${meta}${extra},\n      "sources": {\n${src}\n      } }`;
  }).join(',\n'));
  out.push('  ]', '}');
  return out.join('\n') + '\n';
}
