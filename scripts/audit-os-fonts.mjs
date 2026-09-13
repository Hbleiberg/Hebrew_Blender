#!/usr/bin/env node
/**
 * audit-os-fonts.mjs — compare the Open Siddur Project's published font list against the
 * Font Maker's staged starting fonts (starting-fonts/manifest.json).
 *
 * Plain Node ≥ 18, zero dependencies. Run from anywhere:
 *   node scripts/audit-os-fonts.mjs                 # fetch the live list, write the report
 *   node scripts/audit-os-fonts.mjs --source x.json # audit a local copy instead
 *   node scripts/audit-os-fonts.mjs --dump          # also print the raw list's shape (fields, samples)
 *   node scripts/audit-os-fonts.mjs --no-write      # report to stdout only
 *
 * The partner list is the DISCOVERY source (what exists, what changed); it is never the
 * licensing truth — every font still goes through scripts/add_os_font.py, which reads the
 * license text shipped inside the archive (see .claude/skills/addOSFont/SKILL.md).
 *
 * Outputs (under starting-fonts/):
 *   opensiddur-fonts.json — the partner list as last seen, normalized (name / url / license /
 *                           designer / category / version + the raw entry). Committed so the next
 *                           run can say what changed since.
 *   AUDIT.md              — the human report: new fonts to intake, staged fonts that dropped off
 *                           the list, license-label disagreements, download-URL changes, and the
 *                           delta against the previous snapshot.
 *
 * Exit code: 0 on success (whatever the findings), 1 when the list cannot be fetched or parsed.
 * The GitHub Actions workflow (.github/workflows/os-fonts-audit.yml) runs this weekly, commits
 * the two outputs when they change, and opens/updates an issue when anything needs a human.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, basename } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SF_DIR = join(ROOT, 'starting-fonts');
const DEFAULT_SOURCE = 'https://opensiddur.org/wp-content/plugins/custom-fonts-display/data/fonts.json';
const SNAPSHOT = join(SF_DIR, 'opensiddur-fonts.json');
const REPORT = join(SF_DIR, 'AUDIT.md');

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt; };
const source = opt('--source', DEFAULT_SOURCE);

// ---------- helpers ----------
const slug = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
// Looser key for name matching: drop separators entirely ("Keter Aram Tsova" ~ "KeterAramTsova").
const nkey = (s) => slug(s).replace(/-/g, '');
const stem = (url) => { try { return decodeURIComponent(basename(new URL(url).pathname)).replace(/\.(zip|ttf|otf|woff2?)$/i, ''); } catch { return ''; } };
const isUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v);
const isFontUrl = (v) => isUrl(v) && /\.(zip|ttf|otf|woff2?)(\?|#|$)/i.test(v);

// License labels on the partner page are coarser than shipped text; normalize to a family +
// (when stated) the font-exception flag so a mere wording difference is not a "conflict".
function licFamily(label) {
  const s = String(label ?? '').toLowerCase();
  if (!s) return { fam: '', fe: null };
  if (/ofl|open font/.test(s)) return { fam: 'OFL', fe: null };
  if (/apache/.test(s)) return { fam: 'Apache', fe: null };
  if (/lppl|latex/.test(s)) return { fam: 'LPPL', fe: null };
  if (/ufl|ubuntu font/.test(s)) return { fam: 'UFL', fe: null };
  if (/cc0|public domain|cc-?zero/.test(s)) return { fam: 'CC0', fe: null };
  if (/cc[- ]?by/.test(s)) return { fam: /sa/.test(s) ? 'CC-BY-SA' : 'CC-BY', fe: null };
  if (/gpl|general public/.test(s)) return { fam: 'GPL', fe: /exception|\+ ?fe|font ex/.test(s) };
  if (/mit\b/.test(s)) return { fam: 'MIT', fe: null };
  return { fam: s.trim(), fe: null };
}

// ---------- 1. load the partner list ----------
async function loadSource(src) {
  if (isUrl(src)) {
    // The partner site sits behind a WordPress/CDN bot filter that answers 403 to a bare or
    // script-looking user-agent, so try an honest one first and a browser-shaped one second.
    const uas = [
      'Mozilla/5.0 (compatible; IvritSuite-fonts-audit/1.0; +https://ivritsuite.com)',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36',
    ];
    let last = '';
    for (const ua of uas) {
      const res = await fetch(src, { headers: { 'user-agent': ua, accept: 'application/json, text/plain;q=0.9, */*;q=0.5', 'accept-language': 'en' } });
      const text = await res.text();
      if (res.ok) return JSON.parse(text);
      last = `HTTP ${res.status} (server: ${res.headers.get('server') ?? '?'}, ua: ${ua.slice(0, 40)}…) body: ${text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)}`;
    }
    throw new Error(`fetch ${src} → ${last}`);
  }
  return JSON.parse(readFileSync(resolve(src), 'utf8'));
}

// Flatten whatever shape the plugin exports into a list of {entry, category} pairs.
function flatten(data) {
  const out = [];
  const looksLikeFont = (o) => o && typeof o === 'object' && !Array.isArray(o)
    && Object.values(o).some((v) => typeof v === 'string');
  const walk = (node, category) => {
    if (Array.isArray(node)) { node.forEach((n) => walk(n, category)); return; }
    if (!node || typeof node !== 'object') return;
    const arrays = Object.entries(node).filter(([, v]) => Array.isArray(v) && v.some((x) => x && typeof x === 'object'));
    const objs = Object.entries(node).filter(([, v]) => v && typeof v === 'object' && !Array.isArray(v));
    if (arrays.length) {
      // A wrapper such as {fonts:[…]} or a category such as {name:'Stam', fonts:[…]}
      const cat = node.name ?? node.title ?? node.category ?? category;
      arrays.forEach(([, v]) => walk(v, typeof cat === 'string' ? cat : category));
      return;
    }
    if (looksLikeFont(node) && objs.length === 0) { out.push({ entry: node, category }); return; }
    // A map keyed by font name/category
    objs.forEach(([k, v]) => walk(v, typeof node.name === 'string' ? node.name : (category ?? k)));
  };
  walk(data, undefined);
  return out;
}

// Pick the fields we care about by key name, falling back to value shape.
function normalize({ entry, category }, idx) {
  const keys = Object.keys(entry);
  const pick = (re) => { const k = keys.find((k) => re.test(k)); return k ? entry[k] : undefined; };
  const str = (v) => (typeof v === 'string' ? v.trim() : Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(', ') : v == null ? '' : String(v));
  let url = keys.map((k) => entry[k]).find(isFontUrl)
    ?? str(pick(/^(download|zip|file|url|href|link|src)/i) ?? pick(/download|zip|url|file/i));
  const name = str(pick(/^(name|title|font_?name|family|font)$/i) ?? pick(/name|title|family/i)) || (url ? stem(url) : `entry ${idx + 1}`);
  return {
    name,
    url: isUrl(url) ? url : '',
    license: str(pick(/licen[cs]e/i)),
    designer: str(pick(/designer|author|creator|foundry/i)),
    category: str(pick(/categor|type|group|tags?$/i)) || str(category),
    version: str(pick(/version/i)),
    raw: entry,
  };
}

// ---------- 2. load our side ----------
const manifest = JSON.parse(readFileSync(join(SF_DIR, 'manifest.json'), 'utf8'));
const notStaged = existsSync(join(SF_DIR, 'not-staged.json')) ? JSON.parse(readFileSync(join(SF_DIR, 'not-staged.json'), 'utf8')) : {};
const staged = manifest.fonts.filter((f) => (f.partner ?? 'opensiddur') === 'opensiddur');

// Index staged fonts by every handle a partner entry could plausibly carry.
const byUrl = new Map(), byKey = new Map();
const addKey = (k, f) => { if (k && !byKey.has(k)) byKey.set(k, f); };
for (const f of staged) {
  if (f.upstream) { byUrl.set(f.upstream, f); addKey(nkey(stem(f.upstream)), f); }
  addKey(nkey(f.id), f); addKey(nkey(f.displayName), f); addKey(nkey(f.nameTableFamily), f);
  addKey(nkey(basename(f.file).replace(/\.(ttf|otf)$/i, '')), f);
}
// The listing names recorded at intake time are the best alias table we have.
const aliasLists = [notStaged.partnerDeclared, notStaged.discrepancies, notStaged.notStaged].filter(Array.isArray);
for (const list of aliasLists) for (const e of list) {
  const f = staged.find((x) => x.id === e.id);
  if (f) addKey(nkey(e.name), f);
}
const refused = new Map((notStaged.notStaged ?? []).map((e) => [nkey(e.name), e]));

// ---------- 3. match ----------
async function main() {
  let raw;
  try { raw = await loadSource(source); } catch (err) { console.error(`audit-os-fonts: ${err.message}`); process.exit(1); }
  const flat = flatten(raw);
  const list = flat.map(normalize);
  if (flag('--dump')) {
    const fieldCount = {};
    for (const { entry } of flat) for (const k of Object.keys(entry)) fieldCount[k] = (fieldCount[k] ?? 0) + 1;
    console.log('--- shape: top-level', Array.isArray(raw) ? `array[${raw.length}]` : `object{${Object.keys(raw).join(', ')}}`);
    console.log('--- entries:', flat.length, ' fields:', JSON.stringify(fieldCount));
    console.log('--- samples:', JSON.stringify(flat.slice(0, 3).map((x) => x.entry), null, 1));
  }
  if (!list.length) { console.error('audit-os-fonts: the list parsed but contained no font entries — run with --dump'); process.exit(1); }

  const seen = new Set();
  const rows = list.map((p) => {
    let f = (p.url && byUrl.get(p.url)) || null, how = f ? 'url' : '';
    if (!f && p.url) { f = byKey.get(nkey(stem(p.url))) ?? null; how = f ? 'url-stem' : ''; }
    if (!f) { f = byKey.get(nkey(p.name)) ?? null; how = f ? 'name' : ''; }
    if (f) seen.add(f.id);
    return { p, f, how };
  });

  const fresh = rows.filter((r) => !r.f && !refused.has(nkey(r.p.name)));
  const refusedStill = rows.filter((r) => !r.f && refused.has(nkey(r.p.name)));
  const dropped = staged.filter((f) => !seen.has(f.id));
  const licConflict = [], licCoarse = [], urlChanged = [];
  for (const { p, f, how } of rows) {
    if (!f) continue;
    if (p.license) {
      const a = licFamily(p.license), b = licFamily(f.licenseName ?? f.licenseId);
      if (a.fam && b.fam && a.fam !== b.fam) licConflict.push({ p, f });
      else if (a.fam === 'GPL' && a.fe !== null && b.fe !== null && a.fe !== b.fe) licCoarse.push({ p, f });
    }
    if (p.url && how !== 'url' && f.upstream && p.url !== f.upstream) urlChanged.push({ p, f });
  }

  // Delta against the previous snapshot (by name key).
  let delta = null;
  if (existsSync(SNAPSHOT)) {
    try {
      const prev = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));
      const pm = new Map((prev.fonts ?? []).map((x) => [nkey(x.name), x]));
      const cm = new Map(list.map((x) => [nkey(x.name), x]));
      const changed = [];
      for (const [k, c] of cm) {
        const o = pm.get(k); if (!o) continue;
        const diffs = ['url', 'license', 'designer', 'category', 'version'].filter((fld) => (o[fld] ?? '') !== (c[fld] ?? ''));
        if (diffs.length) changed.push({ name: c.name, diffs: diffs.map((d) => `${d}: "${o[d] ?? ''}" → "${c[d] ?? ''}"`) });
      }
      delta = {
        added: [...cm.keys()].filter((k) => !pm.has(k)).map((k) => cm.get(k).name),
        removed: [...pm.keys()].filter((k) => !cm.has(k)).map((k) => pm.get(k).name),
        changed,
      };
    } catch { delta = null; }
  }

  // ---------- 4. report ----------
  const today = new Date().toISOString().slice(0, 10);
  const actionable = fresh.length + dropped.length + licConflict.length + urlChanged.length
    + (delta ? delta.added.length + delta.removed.length + delta.changed.length : 0);
  const L = [];
  L.push('# OpenSiddur font list audit', '',
    `_Generated by \`scripts/audit-os-fonts.mjs\` on ${today} from <${source}>. Do not hand-edit; the next run overwrites it._`, '',
    '| | count |', '|---|---|',
    `| Fonts on the partner list | ${list.length} |`,
    `| Staged starting fonts (OpenSiddur) | ${staged.length} |`,
    `| Matched | ${rows.filter((r) => r.f).length} (by URL ${rows.filter((r) => r.how === 'url').length}, by file stem ${rows.filter((r) => r.how === 'url-stem').length}, by name ${rows.filter((r) => r.how === 'name').length}) |`,
    `| **New on the list, not staged** | **${fresh.length}** |`,
    `| Staged but no longer listed | ${dropped.length} |`,
    `| License label disagrees | ${licConflict.length} |`,
    `| Download URL changed | ${urlChanged.length} |`,
    `| Previously refused, still listed | ${refusedStill.length} |`, '');
  const row = (p, extra = '') => `- **${p.name}**${p.category ? ` (${p.category})` : ''}${p.license ? ` — listed license: ${p.license}` : ''}${p.designer ? ` — ${p.designer}` : ''}${p.url ? ` — <${p.url}>` : ''}${extra}`;
  L.push('## New on the list — run `/addOSFont` on each', '');
  L.push(...(fresh.length ? fresh.map((r) => row(r.p)) : ['_none_']), '');
  L.push('## Staged here but not on the partner list', '',
    '_Not removed automatically: a font may have moved or been renamed. Confirm with the partner before pulling it._', '');
  L.push(...(dropped.length ? dropped.map((f) => `- **${f.displayName}** (\`${f.id}\`) — upstream <${f.upstream}>`) : ['_none_']), '');
  L.push('## License label disagreements', '',
    '_The shipped license text decides (see the intake skill). A disagreement is recorded in `not-staged.json`, never silently resolved._', '');
  L.push(...(licConflict.length ? licConflict.map(({ p, f }) => `- **${f.displayName}** (\`${f.id}\`): partner says "${p.license}", staged as ${f.licenseName ?? f.licenseId}`) : ['_none_']), '');
  if (licCoarse.length) {
    L.push('<details><summary>Coarser labels (same family, font-exception wording differs)</summary>', '');
    L.push(...licCoarse.map(({ p, f }) => `- ${f.displayName}: partner "${p.license}" vs staged ${f.licenseName ?? f.licenseId}`), '', '</details>', '');
  }
  L.push('## Download URL changed', '', '_A new archive may carry a new version — re-run the intake with `--force` after checking the license text._', '');
  L.push(...(urlChanged.length ? urlChanged.map(({ p, f }) => `- **${f.displayName}** (\`${f.id}\`): now <${p.url}>, staged from <${f.upstream}>`) : ['_none_']), '');
  if (refusedStill.length) {
    L.push('## Previously refused, still listed', '');
    L.push(...refusedStill.map((r) => row(r.p, ` — refused: ${refused.get(nkey(r.p.name)).reason ?? ''}`)), '');
  }
  L.push('## Changes since the previous snapshot', '');
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
    writeFileSync(SNAPSHOT, JSON.stringify({ schema: 1, source, fonts: list }, null, 2) + '\n');
  }
  // Machine-readable summary for the workflow.
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `actionable=${actionable}\nnew=${fresh.length}\ndropped=${dropped.length}\nconflicts=${licConflict.length}\n`, { flag: 'a' });
  }
}
main();
