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
 * end for a person to read; the Tanakh verses a part's lines are said to hold ("verses"), each line
 * compared with the verses' own Hebrew, and the open translations of those verses the page then
 * offers; whether real te'amim are present; and the first and last pointed words of the lines shown.
 *
 * It fails (exit 1) on: a ref that does not resolve, a node that is not a leaf, a pinned edition
 * Sefaria no longer serves under an open licence, a source with no openly licensed Hebrew, a
 * range whose first / last words differ from the ones stamped in the catalog, or a pinned
 * translation that is gone, not open, empty over those lines, translated where the Hebrew has no
 * line, or whose first / last words differ from its stamp, or a line that does not open with the
 * verses the catalog says it holds.
 *
 * docs/tefillah-refs-report.md is this script's output: after a catalog edit, re-run with --out and commit both.
 *
 * Nothing here writes or corrects a text: every `from` / `to` is copied from Sefaria's response.
 * Behind a proxy: NODE_USE_ENV_PROXY=1 node scripts/check-tefillah-refs.mjs …
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  SEFARIA_API, SIDDUR_INDEXES, SIDDUR_BY_NUSACH, NUSACHIM, sefariaJSON, leafPaths, fetchVersion, splitRef, isTanakhRef, sourceParts,
  licenseName, isOpenLicense, flatText, plainText, lineKind, hasTeamim, rangeEnds, englishWords, englishEnds, formatCatalog,
  parseVerses, versesFit, lettersOnly,
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
const versePairs = new Map();  // "<node> — <Hebrew edition>" → Map(line number → [Hebrew, verses, found, English]) for the review section
notes.tanakh = []; notes.versesOffDefault = []; notes.thin = [];
// One Tanakh chapter: its Hebrew verses, the open English translations Sefaria lists for it that have every verse
// (the page passes over one that leaves a verse out), and one of them (JPS 1917 where there is one) for the review table.
const JPS_1917 = /JPS\s*1917|1917.*JPS|Holy Scriptures.*1917|Holy Scriptures.*New Translation/i;
const _chapters = new Map();
async function tanakhChapter(book, chapter) {
  const key = book + ' ' + chapter;
  if (_chapters.has(key)) return _chapters.get(key);
  let out = null;
  try {
    const base = `${SEFARIA_API}/v3/texts/${encodeURIComponent(key)}`;
    const d = await sefariaJSON(`${base}?version=hebrew&return_format=text_only`);
    const hv = (d.versions || []).find((v) => v.language === 'he');
    if (!d.error && hv) {
      const he = flatText(hv.text).map((t) => t.replace(/\{[^}]*\}/g, ''));
      const open = [], texts = new Map();
      for (const v of (d.available_versions || []).filter((x) => isEnglish(x) && isOpenLicense(x.license))) {
        const e = await sefariaJSON(`${base}?version=${encodeURIComponent('english|' + v.versionTitle)}&return_format=text_only`);
        const ev = (e.versions || []).find((x) => x.language === 'en');
        const lines = ev && ev.versionTitle === v.versionTitle && isOpenLicense(ev.license) ? flatText(ev.text) : [];
        const have = he.filter((_, i) => plainText(lines[i] || '')).length;
        if (have === he.length) { open.push(v); texts.set(v.versionTitle, lines); }
        else notes.thin.push(`${key}: ${short(v.versionTitle)} has ${have} of ${he.length} verses`);
      }
      const first = (cat.versesEnglish || [])[0];
      if (first && !open.some((v) => v.versionTitle === first)) problems.push(`${key}: the catalog's first "versesEnglish" title, ${JSON.stringify(first)}, is not an open translation that has every verse of this chapter`);
      const show = (cat.versesEnglish || []).map((t) => open.find((v) => v.versionTitle === t)).find(Boolean) || open.find((v) => JPS_1917.test(v.versionTitle)) || open[0] || null;
      out = { he, open, sample: show ? { title: show.versionTitle, lines: texts.get(show.versionTitle) } : null };
    }
  } catch (e) { out = null; }
  _chapters.set(key, out);
  return out;
}
const short = (t) => String(t).trim();
const lic = (l) => licenseName(l) || `NOT OPEN (${l || 'none'})`;
// English by the title's own trailing tag ("… [ro]") before Sefaria's actualLanguage, which calls a few other-language versions English (the page's isEnglishVersion).
const isEnglish = (v) => { const m = /\[([a-z]{2,3})\]\s*$/.exec(String(v.versionTitle || '')); return v.language === 'en' && (m ? m[1] : (v.actualLanguage || 'en')) === 'en'; };
const isHebrew = (v) => v.language === 'he' && (v.actualLanguage || 'he') === 'he';

function pickEdition(open, pref) {
  for (const p of pref) { const hit = open.find((v) => v.versionTitle.includes(p)); if (hit) return hit; }
  return open[0] || null;
}

// One siddur part → what the page would show for it, measured.
async function checkSiddurPart(part, where, leaves, nusach) {
  const { node, from, to } = splitRef(part.ref);
  const index = SIDDUR_INDEXES.find((t) => node.startsWith(t + ', '));
  if (!index) { problems.push(`${where}: "${part.ref}" is not in one of the siddurim this catalog reads`); return null; }
  if (!(SIDDUR_BY_NUSACH[nusach] || []).includes(index)) { problems.push(`${where}: ${index} is not a siddur of this nusach`); return null; }
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
  // Lines that are Tanakh verses: every named line must open with its verses, and the translations offered are the
  // open ones of every chapter the part names.
  const verseMaps = part.verses == null ? [] : (Array.isArray(part.verses) ? part.verses : [part.verses]);
  if (Array.isArray(part.verses) && ranged) problems.push(`${where}: ${part.ref}: a line range has one Hebrew edition, so one map of verses`);
  if (Array.isArray(part.verses) && new Set(part.verses.map((m) => m && m.he)).size !== part.verses.length) problems.push(`${where}: ${part.ref}: two maps of verses name the same Hebrew edition`);
  const shownMapped = !verseMaps.length || ranged || verseMaps.some((m) => m && m.he === he.versionTitle);
  let offeredOnce = false;
  for (const vv of verseMaps) {
    const bad = (msg) => { problems.push(`${where}: ${part.ref}: the verses ${msg}`); };
    if (!vv || typeof vv !== 'object' || !Array.isArray(vv.lines)) bad('must be { "lines": [ … ] }');
    else if (!ranged && (typeof vv.he !== 'string' || !vv.he)) bad('of a whole node must name the Hebrew edition whose lines were counted ("he")');
    else if (ranged && vv.he !== undefined) bad('of a line range take their Hebrew edition from the part, not from "verses"');
    else {
      let against = he;
      if (!ranged && vv.he !== he.versionTitle) {
        const o = openHe.find((v) => v.versionTitle === vv.he) ? (await fetchVersion(node, 'hebrew', vv.he)).version : null;
        against = o && o.versionTitle === vv.he && isOpenLicense(o.license) ? o : null;
        if (against && !shownMapped) notes.versesOffDefault.push(`${node}: counted in ${short(vv.he)}, the page shows ${short(he.versionTitle)} first`);
      }
      const a = ranged ? from : 1, b = ranged ? to : (against ? against.lines.length : 0);
      if (!against) bad(`name ${JSON.stringify(vv.he)}, which is not an open Hebrew edition of ${node}`);
      else if (vv.lines.length !== b - a + 1) bad(`name ${vv.lines.length} lines; the part has ${b - a + 1}`);
      else {
        const key = `${node} — ${short(against.versionTitle)}`;
        if (!versePairs.has(key)) versePairs.set(key, new Map());
        let offered = null, ok = true, mapped = 0;
        for (let i = a; i <= b; i++) {
          const entry = vv.lines[i - a], linePlain = plainText(against.lines[i - 1] || '');
          if (entry === null) {
            if (lineKind(linePlain) === 'text') versePairs.get(key).set(i, [linePlain, '—', '', '']);
            continue;
          }
          const pv = parseVerses(entry);
          if (!pv) { bad(`entry ${JSON.stringify(entry)} is not "Psalms <chapter>:<verses>"`); ok = false; continue; }
          const chap = await tanakhChapter(pv.book, pv.chapter);
          if (!chap) { bad(`entry ${entry}: ${pv.book} ${pv.chapter} does not resolve`); ok = false; continue; }
          if (pv.ranges.some(([, y]) => y > chap.he.length)) { bad(`entry ${entry} is outside the chapter's ${chap.he.length} verses`); ok = false; continue; }
          const verse = (n) => chap.he[n - 1];
          const line = lettersOnly(linePlain.split(' ').filter((w) => /[\u05B0-\u05BC\u05C1\u05C2\u05C7]/.test(w)).join(' '));
          const all = pv.ranges.flatMap(([x, y]) => Array.from({ length: y - x + 1 }, (_, k) => x + k));
          const found = all.filter((n) => line.includes(lettersOnly(verse(n)).slice(0, 6))).length;
          const lastIn = pv.ranges.every(([, y]) => line.includes(lettersOnly(verse(y)).slice(0, 8)));
          if (!versesFit(linePlain, pv.ranges, verse)) { bad(`line ${i} does not open with ${entry}`); ok = false; }
          else if (!lastIn) { bad(`line ${i} opens with ${entry} but does not hold its last verse`); ok = false; }
          else mapped++;
          if (!chap.open.length) { bad(`entry ${entry}: Sefaria lists no openly licensed English translation of ${pv.book} ${pv.chapter}`); ok = false; }
          offered = offered ? offered.filter((x) => chap.open.some((y) => y.versionTitle === x.versionTitle)) : chap.open.slice();
          const eng = chap.sample ? all.map((n) => plainText(chap.sample.lines[n - 1] || '')).join(' ') : '';
          versePairs.get(key).set(i, [linePlain, entry.replace(/^\w+ /, ''), `${found} of ${all.length}`, eng]);
        }
        if (ok && mapped && offered) {
          if (!offered.length) bad('name chapters that share no openly licensed English translation');
          if (!offeredOnce) for (const v of offered) english.push({ title: short(v.versionTitle), licence: lic(v.license), match: true, n: total, raw: v.versionTitle, tanakh: true });
          offeredOnce = true;
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
  // ◇ is a translation of the Tanakh verses the lines hold: it counts when every part that names verses offers it
  // (a blessing before or after the psalms has no verses and no translation).
  const titles = uniq(parts.flatMap((p) => p.english.map((e) => e.title)));
  const versed = parts.filter((p) => p.english.some((e) => e.tanakh));
  const eng = titles.map((t) => {
    const per = parts.map((p) => p.english.find((e) => e.title === t));
    const first = per.find(Boolean);
    if (first.tanakh) {
      const all = versed.every((p) => p.english.some((e) => e.title === t && e.tanakh));
      return `${all ? '◇' : '✗'} ${t} [${first.licence}]${all ? '' : ' (not for every psalm)'}`;
    }
    const everywhere = per.every(Boolean);
    const match = everywhere && per.every((e) => e.match || e.pinned);
    const pins = per.filter((e) => e && e.pinned);
    const mark = match ? (pins.length ? '⇄' : '✓') : '✗';
    const how = pins.length ? ` (pinned: ${pins.length === 1 ? pins[0].pinnedLines + ' lines translated' : pins.length + ' parts'}${pins[0].pinnedHe ? ', with ' + pins[0].pinnedHe : ''})` : '';
    return `${mark} ${t} [${first.licence}]${how}${everywhere ? '' : ' (not in every part)'}`;
  });
  const lines = parts.reduce((n, p) => n + p.lines, 0), pointed = parts.reduce((n, p) => n + p.pointed, 0);
  const ends = `${parts[0].ends.from} … ${parts[parts.length - 1].ends.to}`;
  if (!titles.length) notes.noEnglish.push(`${prayer.key} (${nusach})`);
  else if (eng.some((e) => e.startsWith('◇'))) notes.tanakh.push(`${prayer.key} (${nusach})`);
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
        const got = tanakh ? await checkTanakhPart(part, where) : await checkSiddurPart(part, where, leaves, nusach);
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
  out.push(`${cat.prayers.length} prayers, ${rows.length} sources checked. Lines = Sefaria segments shown (pointed = lines that hold prayer text; the rest are instructions or headings). ✓ = the translation has as many lines as the Hebrew node, so the page shows it line against line; ⇄ = it has fewer or more lines, but the catalog pins it to the Hebrew by position (line n beside line n), read by a person and listed line by line at the end of this report; ◇ = the siddur node has no open translation, but its lines are whole Tanakh verses (checked against the verses' Hebrew, listed at the end) and the page offers these translations of them; ✗ = neither, so a whole node shows it as one block and a line range shows none. An equal count is the test the page can make, not proof of a correct pairing. First … last = the first two and last two pointed words of the lines shown (consonants only).`, '');
  out.push('| Prayer | Nusach | Ref | Lines (pointed) | Hebrew edition | Other open Hebrew editions | Open English translations | Te\'amim | First … last words |');
  out.push('|---|---|---|---|---|---|---|---|---|');
  out.push(...rows, '');
  const list = (title, a) => { out.push(`**${title}** (${a.length}): ${a.length ? a.join(', ') : 'none'}`, ''); };
  list('No source in this nusach (null)', notes.nulls);
  list('No openly licensed English translation', notes.noEnglish);
  list('Shown line against line through a pinned translation (⇄)', notes.pinned);
  list('Translated through the Tanakh verses their lines hold (◇)', notes.tanakh);
  list('Verses counted in a Hebrew edition the page does not show first (they apply only once a visitor picks that edition)', [...new Set(notes.versesOffDefault)]);
  list('Open translations of a named chapter that leave verses out (the page passes over them and stops listing them)', [...new Set(notes.thin)]);
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
  // Every line the catalog says is Tanakh verses, for a person to read.
  if (versePairs.size) {
    const cut = (t, n) => { const w = t.replace(/[\u0591-\u05AF\u05BD]/g, '').split(' '); return (w.length > n ? w.slice(0, n).join(' ') + ' …' : w.join(' ')).replace(/\|/g, '\\|'); };
    const tail = (t, n) => { const w = t.replace(/[\u0591-\u05AF\u05BD]/g, '').split(' '); return (w.length > n ? '… ' + w.slice(-n).join(' ') : '').replace(/\|/g, '\\|'); };
    out.push('## Lines that are Tanakh verses', '');
    out.push('Each table is one siddur node in the Hebrew edition whose lines were counted. *Verses* is what the catalog says the line holds; *Found* is how many of those verses\' openings the checker found in the line\'s own letters (a spelling that differs from the Tanakh\'s misses one; the first verse must open the line and the last must be in it, or the check fails). The English is those verses in ' + ([..._chapters.values()].find((c) => c && c.sample) || { sample: { title: 'the first open translation' } }).sample.title + ', first and last words; the page sets the whole of it beside the line, in whichever open translation the visitor picks. A row marked — is a line of prayer text with no verse of its own, shown without a translation.', '');
    for (const [key, lines] of versePairs) {
      out.push(`### ${key}`, '', '| Line | Hebrew opens | Hebrew closes | Verses | Found | English opens | English closes |', '|---|---|---|---|---|---|---|');
      for (const i of [...lines.keys()].sort((x, y) => x - y)) { const [h, v, found, t] = lines.get(i); out.push(`| ${i} | ${cut(h, 5)} | ${tail(h, 3)} | ${v} | ${found} | ${cut(t, 8)} | ${tail(t, 5)} |`); }
      out.push('');
    }
  }
  const text = out.join('\n');
  if (OUT) fs.writeFileSync(OUT, text); else console.log(text);
  console.error(`check-tefillah-refs: ${rows.length} sources, ${problems.length} problem(s)${STAMP && !ONLY ? ', catalog stamped' : ''}`);
  if (problems.length) { if (OUT) console.error(problems.map((p) => '  - ' + p).join('\n')); process.exit(1); }
}
main().catch((e) => { console.error('check-tefillah-refs: ' + e.message); process.exit(1); });
