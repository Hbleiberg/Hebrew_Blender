#!/usr/bin/env node
/*
 * Check every ref in the Tefillah Trainer's catalog (data/tefillah/catalog.json) against Sefaria,
 * and print the table the catalog is reviewed from. On demand only; never a site build step.
 *
 *   node scripts/check-tefillah-refs.mjs                 check, print the report (markdown) to stdout
 *   node scripts/check-tefillah-refs.mjs --out docs/tefillah-refs-report.md   …to the committed report
 *   node scripts/check-tefillah-refs.mjs --stamp          also write each range's first and last words
 *                                                          (from / to) into the catalog
 *   node scripts/check-tefillah-refs.mjs --only modeh-ani,shema
 *
 * For every source of every prayer it reports: the ref resolves and is a leaf node of its siddur;
 * the Hebrew edition shown and its licence; other openly licensed Hebrew editions and whether they
 * divide the node the same way; each openly licensed English translation and whether its line
 * count matches the Hebrew (what the page shows line against line); a translation the catalog pins
 * to the Hebrew by position ("en", see tefillah-sefaria.mjs), with every paired line printed at the
 * end for a person to read; whether real te'amim are present; and the first and last pointed words
 * of the lines shown.
 *
 * It fails (exit 1) on: a ref that does not resolve, a node that is not a leaf, a pinned edition
 * Sefaria no longer serves under an open licence, a source with no openly licensed Hebrew, a
 * range whose first / last words differ from the ones stamped in the catalog, or a pinned
 * translation that is gone, not open, empty over those lines, translated where the Hebrew has no
 * line, or whose first / last words differ from its stamp.
 *
 * docs/tefillah-refs-report.md is this script's output: after a catalog edit, re-run with --out and commit both.
 *
 * Nothing here writes or corrects a text: every `from` / `to` is copied from Sefaria's response.
 * Behind a proxy: NODE_USE_ENV_PROXY=1 node scripts/check-tefillah-refs.mjs …
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  SEFARIA_API, SIDDUR_INDEXES, NUSACHIM, sefariaJSON, leafPaths, fetchVersion, splitRef, isTanakhRef, sourceParts,
  licenseName, isOpenLicense, flatText, plainText, lineKind, hasTeamim, rangeEnds, englishWords, englishEnds, formatCatalog,
} from './tefillah-sefaria.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CATALOG = path.join(ROOT, 'data/tefillah/catalog.json');
const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : null; };
const STAMP = process.argv.includes('--stamp');
const ONLY = arg('--only') ? new Set(arg('--only').split(',')) : null;
const OUT = arg('--out');

const cat = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const problems = [];        // blocking
const notes = { noEnglish: [], unmatched: [], editionsDiffer: [], nulls: [], licences: new Map(), sharedSegment: [], pinned: [], pinOffDefault: [] };
const pairings = new Map();  // "<node> — <Hebrew edition> ⇄ <translation>" → Map(line number → [Hebrew, English]) for the review section
const short = (t) => String(t).trim();
const lic = (l) => licenseName(l) || `NOT OPEN (${l || 'none'})`;
const isEnglish = (v) => v.language === 'en' && (v.actualLanguage || 'en') === 'en';
const isHebrew = (v) => v.language === 'he' && (v.actualLanguage || 'he') === 'he';

function pickEdition(open, pref) {
  for (const p of pref) { const hit = open.find((v) => v.versionTitle.includes(p)); if (hit) return hit; }
  return open[0] || null;
}

// One siddur part → what the page would show for it, measured.
async function checkSiddurPart(part, where, leaves) {
  const { node, from, to } = splitRef(part.ref);
  const index = SIDDUR_INDEXES.find((t) => node.startsWith(t + ', '));
  if (!index) { problems.push(`${where}: "${part.ref}" is not in one of the three siddurim`); return null; }
  if (!leaves.get(index).has(node)) { problems.push(`${where}: "${node}" is not a leaf node of ${index}`); return null; }
  let first;
  try { first = await fetchVersion(node, 'hebrew'); } catch (e) { problems.push(`${where}: ${part.ref} does not resolve (${e.message})`); return null; }
  first.available.forEach((v) => { const k = String(v.license); notes.licences.set(k, (notes.licences.get(k) || 0) + 1); });
  const openHe = first.available.filter((v) => isHebrew(v) && isOpenLicense(v.license));
  if (!openHe.length) { problems.push(`${where}: ${node} has no openly licensed Hebrew`); return null; }
  const ranged = from !== null;
  let chosen;
  if (ranged) {
    if (!part.he) { problems.push(`${where}: ${part.ref} is a range and names no Hebrew edition ("he")`); return null; }
    chosen = openHe.find((v) => v.versionTitle === part.he);
    if (!chosen) { problems.push(`${where}: the pinned edition ${JSON.stringify(part.he)} is not an open Hebrew edition of ${node}`); return null; }
  } else chosen = pickEdition(openHe, cat.hebrewPreference || []);
  const he = (await fetchVersion(node, 'hebrew', chosen.versionTitle)).version;
  if (!he || he.versionTitle !== chosen.versionTitle || !isOpenLicense(he.license)) {
    problems.push(`${where}: asked ${node} for ${JSON.stringify(chosen.versionTitle)}, got ${he ? JSON.stringify(he.versionTitle) + ' [' + he.license + ']' : 'nothing'}`); return null;
  }
  const total = he.lines.length;
  if (ranged && (from < 1 || to > total || from > to)) { problems.push(`${where}: ${part.ref} is outside the node's ${total} lines`); return null; }
  const shown = ranged ? he.lines.slice(from - 1, to) : he.lines;
  const kinds = shown.map((raw) => lineKind(plainText(raw)));
  const ends = rangeEnds(shown);
  if (ranged) {
    if (STAMP) { part.from = ends.from; part.to = ends.to; }
    else if (part.from !== ends.from || part.to !== ends.to) problems.push(`${where}: ${part.ref} now reads "${ends.from} … ${ends.to}", the catalog says "${part.from} … ${part.to}"`);
    if (!kinds.includes('text')) problems.push(`${where}: ${part.ref} holds no pointed text`);
  }
  // Other open Hebrew editions: do they divide the node the same way?
  const others = [];
  for (const v of openHe) {
    if (v.versionTitle === he.versionTitle) continue;
    const o = (await fetchVersion(node, 'hebrew', v.versionTitle)).version;
    const n = o ? o.lines.length : 0;
    others.push(`${short(v.versionTitle)} [${lic(v.license)}]${n !== total ? ` ≠ ${n} lines` : ''}`);
    if (n !== total) notes.editionsDiffer.push(`${node}: ${short(he.versionTitle)} ${total} lines, ${short(v.versionTitle)} ${n}`);
  }
  // Open English translations, and whether each matches the Hebrew line for line (whole node).
  const english = [];
  for (const v of first.available.filter((x) => isEnglish(x) && isOpenLicense(x.license))) {
    const e = (await fetchVersion(node, 'english', v.versionTitle)).version;
    const ok = !!e && e.versionTitle === v.versionTitle && isOpenLicense(e.license);
    const n = ok ? e.lines.length : 0;
    english.push({ title: short(v.versionTitle), licence: lic(v.license), match: ok && n === total, n, raw: v.versionTitle });
  }
  // A pinned translation: line n of it beside line n of the Hebrew edition it was read against.
  if (part.en != null) {
    const pin = part.en;
    const bad = (msg) => { problems.push(`${where}: ${part.ref}: the pinned translation ${msg}`); };
    if (!pin || typeof pin !== 'object' || typeof pin.v !== 'string' || !pin.v) bad('must be { "v": "<title>", … }');
    else if (!ranged && (typeof pin.he !== 'string' || !pin.he)) bad('of a whole node must name the Hebrew edition it was read against ("he")');
    else if (ranged && pin.he !== undefined) bad('of a line range takes its Hebrew edition from the part, not from "en"');
    else {
      const entry = english.find((e) => e.raw === pin.v);
      let against = he;
      if (!ranged && pin.he !== he.versionTitle) {
        const o = openHe.find((v) => v.versionTitle === pin.he) ? (await fetchVersion(node, 'hebrew', pin.he)).version : null;
        against = o && o.versionTitle === pin.he && isOpenLicense(o.license) ? o : null;
        if (against) notes.pinOffDefault.push(`${node}: pinned against ${short(pin.he)}, the page shows ${short(he.versionTitle)} first`);
      }
      const e = entry ? (await fetchVersion(node, 'english', pin.v)).version : null;
      if (!entry || !e || e.versionTitle !== pin.v || !isOpenLicense(e.license)) bad(`${JSON.stringify(pin.v)} is not an open English translation of ${node}`);
      else if (!against) bad(`names ${JSON.stringify(pin.he)}, which is not an open Hebrew edition of ${node}`);
      else {
        const a = ranged ? from : 1, b = ranged ? to : against.lines.length;
        const enLines = e.lines.slice(a - 1, b);
        const ends = englishEnds(enLines);
        if (!ends.from) bad(`${JSON.stringify(pin.v)} has no translated line among lines ${a}-${b}`);
        else {
          if (STAMP) { pin.from = ends.from; pin.to = ends.to; }
          else if (pin.from !== ends.from || pin.to !== ends.to) bad(`now reads "${ends.from} … ${ends.to}", the catalog says "${pin.from} … ${pin.to}"`);
          const key = `${node} — ${short(against.versionTitle)} ⇄ ${short(pin.v)} [${lic(e.license)}]`;
          if (!pairings.has(key)) pairings.set(key, new Map());
          let translated = 0;
          for (let i = a; i <= b; i++) {
            const h = plainText(against.lines[i - 1] || ''), t = plainText(e.lines[i - 1] || '');
            const has = englishWords(t).length > 0;
            if (has) translated++;
            if (has && !h) bad(`has a line ${i} where the Hebrew has none`);
            pairings.get(key).set(i, [h, has ? t : '']);
          }
          entry.pinned = true;
          entry.pinnedLines = `${translated} of ${b - a + 1}`;
          if (!ranged) entry.pinnedHe = short(against.versionTitle);
        }
      }
    }
  }
  return {
    ref: part.ref, added: !!part.added, node, lines: shown.length, pointed: kinds.filter((k) => k === 'text').length,
    edition: `${short(he.versionTitle)} [${lic(he.license)}]`, others, english, teamim: shown.some((raw) => hasTeamim(plainText(raw))), ends,
  };
}

async function checkTanakhPart(part, where) {
  let data;
  try { data = await sefariaJSON(`${SEFARIA_API}/v3/texts/${encodeURIComponent(part.ref)}?version=hebrew&return_format=text_only`); }
  catch (e) { problems.push(`${where}: ${part.ref} does not resolve (${e.message})`); return null; }
  if (data.error) { problems.push(`${where}: ${part.ref}: ${String(data.error).slice(0, 120)}`); return null; }
  const v = (data.versions || []).find((x) => x.language === 'he');
  if (!v || !isOpenLicense(v.license)) { problems.push(`${where}: ${part.ref}: the Hebrew Sefaria serves by default is not openly licensed (${v ? v.license : 'none'})`); return null; }
  const lines = flatText(v.text);
  const english = (data.available_versions || []).filter((x) => isEnglish(x) && isOpenLicense(x.license))
    .map((x) => ({ title: short(x.versionTitle), licence: lic(x.license), match: true, n: lines.length }));
  return {
    ref: part.ref, added: false, node: part.ref, lines: lines.length, pointed: lines.length, edition: `${short(v.versionTitle)} [${lic(v.license)}]`,
    others: [], english, teamim: lines.some((l) => hasTeamim(l)), ends: rangeEnds(lines),
  };
}

function row(prayer, nusach, parts) {
  const ref = parts.length === 1 ? parts[0].ref : `${parts.length} parts: ${parts[0].ref} … ${parts[parts.length - 1].ref}`;
  const uniq = (a) => [...new Set(a)];
  const editions = uniq(parts.map((p) => p.edition)).join('<br>');
  const others = uniq(parts.flatMap((p) => p.others)).join('<br>') || '—';
  // A translation counts for the source only if every siddur part offers it; ✓ when it matches in all of them,
  // ⇄ when the catalog pins it to the Hebrew by position in at least one part and it pairs in every part.
  const titles = uniq(parts.flatMap((p) => p.english.map((e) => e.title)));
  const eng = titles.map((t) => {
    const per = parts.map((p) => p.english.find((e) => e.title === t));
    const everywhere = per.every(Boolean);
    const match = everywhere && per.every((e) => e.match || e.pinned);
    const pins = per.filter((e) => e && e.pinned);
    const mark = match ? (pins.length ? '⇄' : '✓') : '✗';
    const how = pins.length ? ` (pinned: ${pins.length === 1 ? pins[0].pinnedLines + ' lines translated' : pins.length + ' parts'}${pins[0].pinnedHe ? ', with ' + pins[0].pinnedHe : ''})` : '';
    return `${mark} ${t} [${per.find(Boolean).licence}]${how}${everywhere ? '' : ' (not in every part)'}`;
  });
  const lines = parts.reduce((n, p) => n + p.lines, 0), pointed = parts.reduce((n, p) => n + p.pointed, 0);
  const ends = `${parts[0].ends.from} … ${parts[parts.length - 1].ends.to}`;
  if (!titles.length) notes.noEnglish.push(`${prayer.key} (${nusach})`);
  else if (eng.some((e) => e.startsWith('⇄'))) notes.pinned.push(`${prayer.key} (${nusach})`);
  else if (!eng.some((e) => e.startsWith('✓'))) notes.unmatched.push(`${prayer.key} (${nusach})`);
  return `| ${prayer.en} | ${nusach} | ${ref} | ${lines} (${pointed}) | ${editions} | ${others} | ${eng.join('<br>') || 'none'} | ${parts.some((p) => p.teamim) ? 'yes' : 'no'} | ${ends} |`;
}

// An Open Siddur source names a snapshot file (scripts/build-tefillah-opensiddur.mjs): it must exist, hold Hebrew,
// carry its own key and name an open licence — what the page checks before it shows the text.
function checkOpenSiddur(prayerKey, key) {
  const where = `${prayerKey}/opensiddur`;
  if (typeof key !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) { problems.push(`${where}: the source must be a snapshot key`); return; }
  const file = path.join(path.dirname(CATALOG), 'opensiddur', key + '.json');
  if (!fs.existsSync(file)) { problems.push(`${where}: data/tefillah/opensiddur/${key}.json does not exist`); return; }
  let d = null;
  try { d = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { problems.push(`${where}: ${key}.json is not JSON`); return; }
  if (d.key !== key) problems.push(`${where}: ${key}.json names the key "${d.key}"`);
  if (!Array.isArray(d.he) || !d.he.some((l) => typeof l === 'string' && l.trim())) problems.push(`${where}: ${key}.json holds no Hebrew`);
  if (!isOpenLicense(d.license)) problems.push(`${where}: ${key}.json names no open licence (${d.license})`);
  if (!d.contributors || !(Array.isArray(d.contributors) ? d.contributors.length : String(d.contributors).trim())) problems.push(`${where}: ${key}.json names no contributor`);
}

async function main() {
  const leaves = new Map();
  for (const t of SIDDUR_INDEXES) leaves.set(t, new Set(await leafPaths(t)));
  const keys = new Set();
  const rows = [];
  for (const prayer of cat.prayers) {
    if (keys.has(prayer.key)) problems.push(`duplicate key ${prayer.key}`);
    keys.add(prayer.key);
    if (!cat.groups.some((g) => g.key === prayer.group)) problems.push(`${prayer.key}: unknown group ${prayer.group}`);
    if (ONLY && !ONLY.has(prayer.key)) continue;
    for (const nusach of NUSACHIM) {
      const src = prayer.sources[nusach];
      if (nusach === 'opensiddur') { if (src != null) checkOpenSiddur(prayer.key, src); continue; }   // a key into data/tefillah/opensiddur/
      if (src == null) { if (nusach !== 'torah') notes.nulls.push(`${prayer.key} (${nusach})`); continue; }
      const where = `${prayer.key}/${nusach}`;
      const parts = [];
      for (const part of sourceParts(src)) {
        const tanakh = isTanakhRef(part.ref);
        if (tanakh && nusach !== 'torah') { problems.push(`${where}: a Tanakh ref belongs in the torah source`); continue; }
        const got = tanakh ? await checkTanakhPart(part, where) : await checkSiddurPart(part, where, leaves);
        if (got) parts.push(got);
      }
      if (parts.length === sourceParts(src).length && parts.length) rows.push(row(prayer, nusach, parts));
      process.stderr.write('.');
    }
  }
  process.stderr.write('\n');
  if (STAMP && !ONLY) fs.writeFileSync(CATALOG, formatCatalog(cat));
  else if (STAMP) problems.push('--stamp writes the whole catalog; run it without --only');

  const out = [];
  out.push(`## Tefillah Trainer — catalog refs checked against Sefaria`, '');
  out.push(`${cat.prayers.length} prayers, ${rows.length} sources checked. Lines = Sefaria segments shown (pointed = lines that hold prayer text; the rest are instructions or headings). ✓ = the translation has as many lines as the Hebrew node, so the page shows it line against line; ⇄ = it has fewer or more lines, but the catalog pins it to the Hebrew by position (line n beside line n), read by a person and listed line by line at the end of this report; ✗ = neither, so a whole node shows it as one block and a line range shows none. An equal count is the test the page can make, not proof of a correct pairing. First … last = the first two and last two pointed words of the lines shown (consonants only).`, '');
  out.push('| Prayer | Nusach | Ref | Lines (pointed) | Hebrew edition | Other open Hebrew editions | Open English translations | Te\'amim | First … last words |');
  out.push('|---|---|---|---|---|---|---|---|---|');
  out.push(...rows, '');
  const list = (title, a) => { out.push(`**${title}** (${a.length}): ${a.length ? a.join(', ') : 'none'}`, ''); };
  list('No source in this nusach (null)', notes.nulls);
  list('No openly licensed English translation', notes.noEnglish);
  list('Shown line against line through a pinned translation (⇄)', notes.pinned);
  list('Translations exist but none matches the Hebrew line for line (a whole node shows one as a block; a line range shows none)', notes.unmatched);
  list('Pinned against a Hebrew edition the page does not show first (the pairing applies only once a visitor picks that edition)', [...new Set(notes.pinOffDefault)]);
  list('Hebrew editions that divide a node differently', [...new Set(notes.editionsDiffer)]);
  out.push(`**Licence strings Sefaria uses on these nodes:** ${[...notes.licences].sort((a, b) => b[1] - a[1]).map(([k, n]) => `\`${k}\` ×${n} → ${licenseName(k) || 'refused'}`).join('; ')}`, '');
  out.push(problems.length ? `**Problems (${problems.length}):**\n${problems.map((p) => '- ' + p).join('\n')}` : '**Problems:** none.', '');
  // Every pinned pairing, for a person to read: the page shows each English line beside the Hebrew line of the same number.
  if (pairings.size) {
    const cut = (t, n) => { const w = t.replace(/[\u0591-\u05AF\u05BD]/g, '').split(' '); return (w.length > n ? w.slice(0, n).join(' ') + ' …' : w.join(' ')).replace(/\|/g, '\\|'); };
    out.push('## Pinned translations, line by line', '');
    out.push('Each table is one siddur node: the lines the catalog pins, the Hebrew edition they were read against and the translation, both as Sefaria serves them (first words only). The page shows the two cells of a row side by side. An empty English cell is a line the translation leaves out; an empty Hebrew cell is an empty line at Sefaria.', '');
    for (const [key, lines] of pairings) {
      out.push(`### ${key}`, '', '| Line | Hebrew | English |', '|---|---|---|');
      for (const i of [...lines.keys()].sort((x, y) => x - y)) { const [h, t] = lines.get(i); out.push(`| ${i} | ${cut(h, 7)} | ${cut(t, 11)} |`); }
      out.push('');
    }
  }
  const text = out.join('\n');
  if (OUT) fs.writeFileSync(OUT, text); else console.log(text);
  console.error(`check-tefillah-refs: ${rows.length} sources, ${problems.length} problem(s)${STAMP && !ONLY ? ', catalog stamped' : ''}`);
  if (problems.length) { if (OUT) console.error(problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
}
main().catch((e) => { console.error('check-tefillah-refs: ' + e.message); process.exit(1); });
