#!/usr/bin/env node
/**
 * audit-os-fonts.mjs — compare the Open Siddur Project's published font list against the
 * Font Maker's staged starting fonts (starting-fonts/manifest.json).
 *
 * Plain Node ≥ 18, zero dependencies. Run from anywhere:
 *   node scripts/audit-os-fonts.mjs                 # fetch the partner list, write the report
 *   node scripts/audit-os-fonts.mjs --source x.json # audit a local copy (or another URL) instead
 *   node scripts/audit-os-fonts.mjs --dump          # also print the raw list's shape (fields, samples)
 *   node scripts/audit-os-fonts.mjs --no-write      # report to stdout only
 *   node scripts/audit-os-fonts.mjs --emit-new p.json # also write the unmatched entries (input to stage_os_fonts.py)
 *
 * Source. The list is the data file of the partner's WordPress plugin ("custom-fonts-display"):
 *   live:   https://opensiddur.org/wp-content/plugins/custom-fonts-display/data/fonts.json
 *   mirror: https://raw.githubusercontent.com/aharonium/opensiddur.org/master/plugins/custom-fonts-display/data/fonts.json
 * The live URL sits behind a Cloudflare JavaScript challenge that answers any non-browser client
 * with a "Just a moment…" page (HTTP 403), so it is tried first and the committed copy in the
 * partner's site repository is the fallback. The report says which one it read.
 *
 * Shape (schemaVersion 0.7.0): { _meta, categories, fonts: [ { slug, name, family, categories[],
 * diacriticSupport, style, foundry, foundryUrl, typographer, version, versionDate, license,
 * licenseUrl, notes, positioningErrors[], scriptTags[], missingChars{} } ] }. There is NO download
 * URL; the archive lives at https://opensiddur.org/wp-content/uploads/fonts/<family>/<family>.zip
 * for every font staged so far, so the report prints that as the *probable* archive for a new
 * font — a hint for the intake, never a recorded fact. The partner's `slug` is our manifest `id`
 * for almost every font and `family` is the archive/file stem, so matching goes slug → family →
 * name (via the listing names recorded in not-staged.json at intake time).
 *
 * The partner list is the DISCOVERY source (what exists, what changed); it is never the licensing
 * truth — every font still goes through scripts/add_os_font.py, which reads the license text
 * shipped inside the archive (see .claude/skills/addOSFont/SKILL.md).
 *
 * Outputs (under starting-fonts/, both generated — never hand-edit):
 *   opensiddur-fonts.json — the partner list as last seen, slimmed to the descriptive fields
 *                           (the per-font `missingChars` map is ~2 MB of the 3.7 MB file and is
 *                           dropped). Committed so the next run can say what changed since.
 *   AUDIT.md              — the human report: new fonts to intake, staged fonts that dropped off
 *                           the list, license-label disagreements, and the delta since last run
 *                           (version / date / license / category changes per font).
 *
 * Exit code: 0 on success (whatever the findings), 1 when no source can be fetched or parsed.
 * The GitHub Actions workflow (.github/workflows/os-fonts-audit.yml) runs this weekly, commits
 * the two outputs when they change, and opens/updates an issue when anything needs a human.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SF_DIR = join(ROOT, 'starting-fonts');
const SOURCES = [
  'https://opensiddur.org/wp-content/plugins/custom-fonts-display/data/fonts.json',
  'https://raw.githubusercontent.com/aharonium/opensiddur.org/master/plugins/custom-fonts-display/data/fonts.json',
];
const ARCHIVE = (family) => `https://opensiddur.org/wp-content/uploads/fonts/${encodeURIComponent(family)}/${encodeURIComponent(family)}.zip`;
const SNAPSHOT = join(SF_DIR, 'opensiddur-fonts.json');
const REPORT = join(SF_DIR, 'AUDIT.md');
const KEEP = ['slug', 'name', 'family', 'categories', 'diacriticSupport', 'style', 'foundry', 'foundryUrl',
  'typographer', 'version', 'versionDate', 'license', 'licenseUrl', 'notes', 'scriptTags'];
const DELTA_FIELDS = ['name', 'family', 'version', 'versionDate', 'license', 'licenseUrl', 'categories', 'style', 'foundry', 'typographer', 'notes'];

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt; };

// ---------- helpers ----------
const slug = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
// Looser key for name matching: drop separators entirely ("Keter Aram Tsova" ~ "KeterAramTsova").
const nkey = (s) => slug(s).replace(/-/g, '');
const stem = (url) => { try { return decodeURIComponent(basename(new URL(url).pathname)).replace(/\.(zip|ttf|otf|woff2?)$/i, ''); } catch { return ''; } };
const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);
const str = (v) => (typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.map(str).join(', ') : v == null ? '' : String(v));

// License labels on the partner page are coarser than shipped text ("GPL 3.0" for a font whose
// text states the font exception) and sometimes dual ("GPL+FE, SIL OFL 1.1"). Normalize a label
// to the set of families it names, each with a font-exception flag where the label states one.
function licFamilies(label) {
  return String(label ?? '').split(/,|&|\bor\b|\//).map((s) => s.trim().toLowerCase()).filter(Boolean).map((s) => {
    if (/ofl|open font/.test(s)) return { fam: 'OFL', fe: null };
    if (/apache/.test(s)) return { fam: 'Apache', fe: null };
    if (/lppl|latex/.test(s)) return { fam: 'LPPL', fe: null };
    if (/ufl|ubuntu font/.test(s)) return { fam: 'UFL', fe: null };
    if (/cc0|public domain|cc-?zero/.test(s)) return { fam: 'CC0', fe: null };
    if (/cc[- ]?by/.test(s)) return { fam: /\bsa\b|share/.test(s) ? 'CC-BY-SA' : 'CC-BY', fe: null };
    if (/gpl|general public/.test(s)) return { fam: 'GPL', fe: /exception|\+ ?fe\b|font ex/.test(s) };
    if (/\bmit\b/.test(s)) return { fam: 'MIT', fe: null };
    return { fam: s, fe: null };
  });
}

// ---------- 1. load the partner list ----------
async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; IvritSuite-fonts-audit/1.0; +https://ivritsuite.com)', accept: 'application/json, text/plain;q=0.9, */*;q=0.5' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} (server: ${res.headers.get('server') ?? '?'}): ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)}`);
  return JSON.parse(text);
}
async function loadSource() {
  const explicit = opt('--source', '');
  if (explicit && !isUrl(explicit)) return { data: JSON.parse(readFileSync(resolve(explicit), 'utf8')), source: explicit, tried: [] };
  const tried = [];
  for (const url of explicit ? [explicit] : SOURCES) {
    try { return { data: await fetchJson(url), source: url, tried }; } catch (err) { tried.push(`${url} → ${err.message}`); console.error(`audit-os-fonts: ${url} → ${err.message}`); }
  }
  throw new Error(`no source could be read:\n  ${tried.join('\n  ')}`);
}

// Accept the documented shape, but also a bare array or a {fonts:[…]} wrapper.
function entries(data) {
  const list = Array.isArray(data) ? data : Array.isArray(data?.fonts) ? data.fonts : null;
  if (!list) throw new Error('unrecognized shape: expected an array or {fonts:[…]} — run with --dump');
  return list.filter((e) => e && typeof e === 'object');
}
function normalize(e, idx) {
  const out = {};
  for (const k of KEEP) if (e[k] !== undefined) out[k] = Array.isArray(e[k]) ? e[k].map(str) : str(e[k]);
  out.name ||= out.family || out.slug || `entry ${idx + 1}`;
  out.slug ||= slug(out.name);
  return out;
}

// ---------- 2. load our side ----------
const manifest = JSON.parse(readFileSync(join(SF_DIR, 'manifest.json'), 'utf8'));
const notStaged = existsSync(join(SF_DIR, 'not-staged.json')) ? JSON.parse(readFileSync(join(SF_DIR, 'not-staged.json'), 'utf8')) : {};
const staged = manifest.fonts.filter((f) => (f.partner ?? 'opensiddur') === 'opensiddur');

// Index staged fonts by every handle a partner entry could plausibly carry.
const byId = new Map(staged.map((f) => [f.id, f]));
const byStem = new Map(), byName = new Map();
const add = (map, k, f) => { if (k && !map.has(k)) map.set(k, f); };
for (const f of staged) {
  add(byStem, nkey(stem(f.upstream)), f);
  add(byStem, nkey(basename(f.file).replace(/\.(ttf|otf)$/i, '')), f);
  add(byName, nkey(f.id), f); add(byName, nkey(f.displayName), f); add(byName, nkey(f.nameTableFamily), f);
}
// The listing names recorded at intake time are the best alias table we have.
for (const list of [notStaged.partnerDeclared, notStaged.discrepancies, notStaged.notStaged]) {
  if (!Array.isArray(list)) continue;
  for (const e of list) { const f = byId.get(e.id); if (f) add(byName, nkey(e.name), f); }
}
const refused = new Map((notStaged.notStaged ?? []).map((e) => [nkey(e.name), e]));
// Disagreements the maintainer already reviewed (partner label vs shipped text) — reported, not counted.
const recorded = new Map((notStaged.discrepancies ?? []).map((e) => [e.id, e]));

// ---------- 3. match ----------
async function main() {
  let loaded;
  try { loaded = await loadSource(); } catch (err) { console.error(`audit-os-fonts: ${err.message}`); process.exit(1); }
  const { data, source } = loaded;
  let raw;
  try { raw = entries(data); } catch (err) { console.error(`audit-os-fonts: ${err.message}`); process.exit(1); }
  if (flag('--dump')) {
    const fieldCount = {};
    for (const e of raw) for (const k of Object.keys(e)) fieldCount[k] = (fieldCount[k] ?? 0) + 1;
    console.log('--- shape: top-level', Array.isArray(data) ? `array[${data.length}]` : `object{${Object.keys(data).join(', ')}}`, ' schemaVersion:', data?._meta?.schemaVersion ?? '?');
    console.log('--- entries:', raw.length, ' fields:', JSON.stringify(fieldCount));
    console.log('--- sample:', JSON.stringify(normalize(raw[0] ?? {}, 0), null, 1));
  }
  const list = raw.map(normalize);
  if (!list.length) { console.error('audit-os-fonts: the list parsed but contained no font entries — run with --dump'); process.exit(1); }

  const seen = new Set();
  const rows = list.map((p) => {
    let f = byId.get(p.slug) ?? null, how = f ? 'slug' : '';
    if (!f && p.family) { f = byStem.get(nkey(p.family)) ?? null; how = f ? 'family' : ''; }
    if (!f) { f = byName.get(nkey(p.name)) ?? byName.get(nkey(p.slug)) ?? null; how = f ? 'name' : ''; }
    if (f) seen.add(f.id);
    return { p, f, how };
  });
  const isRefused = (p) => refused.has(nkey(p.name)) || refused.has(nkey(p.slug));
  const fresh = rows.filter((r) => !r.f && !isRefused(r.p));
  const refusedStill = rows.filter((r) => !r.f && isRefused(r.p));
  const dropped = staged.filter((f) => !seen.has(f.id));
  const licConflict = [], licCoarse = [];
  for (const { p, f } of rows) {
    if (!f || !p.license) continue;
    const listed = licFamilies(p.license), ours = licFamilies(f.licenseName ?? f.licenseId)[0];
    if (!ours || !listed.length) continue;
    const same = listed.find((l) => l.fam === ours.fam), known = recorded.get(f.id);
    if (!same) licConflict.push({ p, f, known });
    else if (same.fam === 'GPL' && same.fe !== null && ours.fe !== null && same.fe !== ours.fe) licCoarse.push({ p, f, known });
  }

  // Delta against the previous snapshot (by slug).
  let delta = null;
  if (existsSync(SNAPSHOT)) {
    try {
      const prev = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
      const pm = new Map((prev.fonts ?? []).map((x) => [x.slug, x]));
      const cm = new Map(list.map((x) => [x.slug, x]));
      const changed = [];
      for (const [k, c] of cm) {
        const o = pm.get(k); if (!o) continue;
        const diffs = DELTA_FIELDS.filter((fld) => JSON.stringify(o[fld] ?? '') !== JSON.stringify(c[fld] ?? ''));
        if (diffs.length) changed.push({ name: c.name, diffs: diffs.map((d) => `${d}: "${str(o[d])}" → "${str(c[d])}"`) });
      }
      delta = {
        added: [...cm.keys()].filter((k) => !pm.has(k)).map((k) => cm.get(k).name),
        removed: [...pm.keys()].filter((k) => !cm.has(k)).map((k) => pm.get(k).name),
        changed,
      };
    } catch { delta = null; }
  }

  // ---------- 4. report ----------
  const newConflicts = licConflict.filter((c) => !c.known).length;
  const actionable = fresh.length + dropped.length + newConflicts
    + (delta ? delta.added.length + delta.removed.length + delta.changed.length : 0);
  const n = (arr, how) => arr.filter((r) => r.how === how).length;
  const L = [];
  L.push('# OpenSiddur font list audit', '',
    `_Generated by \`scripts/audit-os-fonts.mjs\` from <${source}>` +
    (loaded.tried.length ? ` (after ${loaded.tried.length} failed source${loaded.tried.length > 1 ? 's' : ''})` : '') +
    `; partner schema ${data?._meta?.schemaVersion ?? '?'}. Generated file — do not hand-edit._`, '',
    '| | count |', '|---|---|',
    `| Fonts on the partner list | ${list.length} |`,
    `| Staged starting fonts (OpenSiddur) | ${staged.length} |`,
    `| Matched | ${rows.filter((r) => r.f).length} (by slug ${n(rows, 'slug')}, by family ${n(rows, 'family')}, by name ${n(rows, 'name')}) |`,
    `| **New on the list, not staged** | **${fresh.length}** |`,
    `| Staged but no longer listed | ${dropped.length} |`,
    `| License label disagrees | ${licConflict.length} (${newConflicts} not yet recorded in \`not-staged.json\`) |`,
    `| Previously refused, still listed | ${refusedStill.length} |`, '');
  const row = (p, extra = '') => `- **${p.name}** (\`${p.slug}\`)` +
    (p.style ? ` — ${p.style}` : '') + (p.diacriticSupport ? `; ${p.diacriticSupport}` : '') +
    (p.license ? ` — listed license: ${p.license}` : '') + (p.foundry ? ` — ${p.foundry}` : '') +
    (p.family ? ` — probable archive: <${ARCHIVE(p.family)}>` : '') + extra;
  L.push('## New on the list — run `/addOSFont` on each', '',
    '_The archive link follows the partner\'s upload convention and is a hint, not a record; the intake verifies the file and reads the license it ships._', '');
  L.push(...(fresh.length ? fresh.map((r) => row(r.p)) : ['_none_']), '');
  L.push('## Staged here but not on the partner list', '',
    '_Not removed automatically: a font may have been renamed or re-slugged. Confirm with the partner before pulling it._', '');
  L.push(...(dropped.length ? dropped.map((f) => `- **${f.displayName}** (\`${f.id}\`) — upstream <${f.upstream}>`) : ['_none_']), '');
  L.push('## License label disagreements', '',
    '_The shipped license text decides (see the intake skill). A disagreement is recorded in `not-staged.json`, never silently resolved._', '');
  const rec = (known) => (known ? ` — recorded in \`not-staged.json\`: ${known.note ?? ''}` : ' — **NEW, not yet recorded**');
  L.push(...(licConflict.length ? licConflict.map(({ p, f, known }) => `- **${f.displayName}** (\`${f.id}\`): partner lists "${p.license}", staged as ${f.licenseName ?? f.licenseId}${rec(known)}`) : ['_none_']), '');
  if (licCoarse.length) {
    L.push('<details><summary>Coarser labels (same family, font-exception wording differs)</summary>', '');
    L.push(...licCoarse.map(({ p, f, known }) => `- ${f.displayName} (\`${f.id}\`): partner "${p.license}" vs staged ${f.licenseName ?? f.licenseId}${known ? ' — recorded' : ''}`), '', '</details>', '');
  }
  if (refusedStill.length) {
    L.push('## Previously refused, still listed', '');
    L.push(...refusedStill.map((r) => row(r.p, ` — refused: ${(refused.get(nkey(r.p.name)) ?? refused.get(nkey(r.p.slug)))?.reason ?? ''}`)), '');
  }
  L.push('## Changes since the previous snapshot', '',
    '_A version or date change on a staged font means the partner ships a newer archive — re-run the intake with `--force` after checking its license text._', '');
  if (!delta) L.push('_No previous snapshot — this is the first run._', '');
  else if (!delta.added.length && !delta.removed.length && !delta.changed.length) L.push('_No change._', '');
  else {
    if (delta.added.length) L.push('**Added:** ' + delta.added.join(', '), '');
    if (delta.removed.length) L.push('**Removed:** ' + delta.removed.join(', '), '');
    for (const c of delta.changed) L.push(`- **${c.name}**: ${c.diffs.join('; ')}`);
    L.push('');
  }
  const report = L.join('\n');
  console.log(report);

  if (!flag('--no-write')) {
    writeFileSync(REPORT, report + '\n');
    writeFileSync(SNAPSHOT, JSON.stringify({ schema: 1, source, partnerSchemaVersion: data?._meta?.schemaVersion ?? null, fonts: list }, null, 2) + '\n');
  }
  const emit = opt('--emit-new', '');
  if (emit) writeFileSync(resolve(emit), JSON.stringify(fresh.map((r) => r.p), null, 2) + '\n');
  // Machine-readable summary for the workflow.
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `actionable=${actionable}\nnew=${fresh.length}\ndropped=${dropped.length}\nconflicts=${newConflicts}\nchanged=${delta ? delta.changed.length : 0}\n`, { flag: 'a' });
  }
}
main();
