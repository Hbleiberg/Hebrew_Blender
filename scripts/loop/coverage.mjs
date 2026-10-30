#!/usr/bin/env node
/* Surface × pass coverage — which surface each per-surface pass (C, D, G, H, M, N, P) last audited.
 *
 * WHY. The rotation rows in the ledger are overwritten in place, so their "X-next:" notes drift from
 * the record (one said torah's last C was S298 when it had run at S441). The record is spread over
 * the live rotation rows, the archive's compacted rotation rows and the findings file's session
 * headings; this script reads all three and prints, per pass, every surface from stalest to newest.
 *
 * Surfaces: the eleven tool pages plus one chrome bundle (index, resources, contact, privacy, terms,
 * 404, account — one surface for a per-surface pass; the variety governor still counts each page).
 *
 * Usage:
 *   node scripts/loop/coverage.mjs            # the matrix, stalest first per pass
 *   node scripts/loop/coverage.mjs --check    # exit 1 when a live row's "X-next:" note contradicts the record
 *   node scripts/loop/coverage.mjs --json
 * Read-only.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER, ARCHIVE, FINDINGS } from '../ledger-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = p => existsSync(join(root, p)) ? readFileSync(join(root, p), 'utf8') : '';
const SURFACE_PASSES = ['C', 'D', 'G', 'H', 'M', 'N', 'P'];
const SURFACES = ['generator', 'dictionary', 'flash', 'torah', 'trope', 'dashboard', 'fontmaker', 'letter_learner', 'parsha_emojis', 'name_tags', 'atlas', 'chrome'];
// First alias that matches wins; order matters (a chrome page named beside a tool loses to the tool).
const ALIASES = [
  ['generator', /hebrew_blend_generator\.html|\bgenerator\b|\bgen\b/i],
  ['dictionary', /hebrew_dictionary\.html|\bdictionary\b|\bdict\b/i],
  ['flash', /flash_cards\.html|\bflash\b/i],
  ['torah', /torah_trainer\.html|\btorah\b|\btrainer\b/i],
  ['atlas', /trope_atlas\.html|trope[ _]atlas|\batlas\b/i],   // before trope: "Trope Atlas" ties with \btrope\b at the same index
  ['trope', /trope_tutor\.html|\btrope\b|\btutor\b/i],
  ['dashboard', /classroom_dashboard\.html|\bdashboard\b/i],
  ['fontmaker', /Hebrew_Font_Maker\.html|font[ _]maker/i], ['fontmaker', /\bFM\b/],
  ['letter_learner', /letter_learner\.html|letter[ _]learner/i], ['letter_learner', /\bLL\b/],
  ['parsha_emojis', /parsha_emojis\.html|emoji_torah\.html|parsha[ _]emojis/i], ['parsha_emojis', /\bPE\b/],
  ['name_tags', /name_tags\.html|name[ _]tags/i],
  ['chrome', /index\.html|\bhub\b|resources\.html|contact\.html|privacy(\.html|\/terms)?|terms\.html|404\.html|account\.html|\bchrome\b|\bresources\b|\bcontact\b|\baccount\b/i],
];
const surfaceOf = text => { let best = null; for (const [s, re] of ALIASES) { const m = text.match(re); if (m && (best === null || m.index < best.i)) best = { s, i: m.index }; } return best && best.s; };
const headOf = text => text.split(/[A-P]-next:|-next:|\bnext:/)[0];   // the note's own surface, never its "next" list

const last = Object.fromEntries(SURFACE_PASSES.map(p => [p, {}]));   // pass → surface → { s, date, src }
// A second surface audited in the same session ("a clean surface buys a second") is joined to the first with a literal
// " + " — "parsha_emojis (first) + letter_learner (…)" in the rotation row, "on `a.html` + `b.html`" in the findings
// heading — and is credited too. The join must sit before the row's first colon (its arms follow it) and outside every
// parenthesis: "FIXED 2 (+ dashboard, i18n.js)" and "(trope was S480, not S365)" name no audited surface.
const surfacesOf = head => {
  const out = []; const first = surfaceOf(head); if (first) out.push(first);
  let core = head.replace(/^[\s\S]*?\*\*S\d+/, '').split(':')[0];
  for (let i = 0; i < 3; i++) core = core.replace(/\([^()]*\)/g, ' ');
  for (const m of core.matchAll(/\+\s*`?([A-Za-z_]+(?:\.html)?)`?/g)) { const s = surfaceOf(m[1]); if (s && !out.includes(s)) out.push(s); }
  return out;
};
const note = (pass, text, s, date, src) => {
  if (!last[pass]) return;
  for (const surf of surfacesOf(headOf(text))) {
    const cur = last[pass][surf]; if (!cur || cur.s < s) last[pass][surf] = { s, date, src };
  }
};
const rot = /^- ([A-P]) [^:\n]+: (\d{4}-\d\d-\d\d) \(\*\*S(\d+)[^\n]*/gm;
for (const src of [LEDGER, ARCHIVE]) for (const m of read(src).matchAll(rot)) note(m[1], m[0], Number(m[3]), m[2], src);
for (const m of read(FINDINGS).matchAll(/^## S(\d+) \((\d{4}-\d\d-\d\d)\) — pass ([A-P])\b([^\n]*)/gm)) note(m[3], m[4], Number(m[1]), m[2], FINDINGS);

const rows = {};
for (const p of SURFACE_PASSES) {
  rows[p] = SURFACES.map(s => ({ surface: s, ...(last[p][s] || { s: 0, date: null, src: null }) })).sort((a, b) => a.s - b.s);
}
if (process.argv.includes('--json')) { console.log(JSON.stringify(rows, null, 1)); process.exit(0); }

const fmt = r => `${r.surface} ${r.s ? 'S' + r.s : 'never'}`;
console.log('coverage — per pass, stalest surface first (source: live rotation rows, archive rows, findings headings)');
for (const p of SURFACE_PASSES) console.log(`  ${p}: ${rows[p].map(fmt).join(' · ')}`);

if (process.argv.includes('--check')) {
  let bad = 0;
  const live = read(LEDGER);
  for (const m of live.matchAll(/^- ([A-P]) [^:\n]+: \d{4}-\d\d-\d\d \(\*\*S\d+[^\n]*?([A-P])-next:([^\n]*)/gm)) {
    const pass = m[2]; if (!last[pass]) continue;
    for (const item of m[3].split(',')) {
      const im = item.match(/^\s*([^()]+?)\s*\((never|S(\d+))\)/); if (!im) continue;
      const surf = surfaceOf(im[1]); if (!surf) continue;
      const rec = last[pass][surf];
      const claimed = im[2] === 'never' ? 0 : Number(im[3]);
      if ((rec ? rec.s : 0) > claimed) { bad++; console.error(`coverage: FAIL — pass ${pass}'s note says ${surf} ${im[2]} but the record has S${rec.s} (${rec.date}, ${rec.src}).`); }
    }
  }
  if (bad) process.exit(1);
  console.log('coverage: every live X-next note agrees with the record.');
}
