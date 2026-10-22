#!/usr/bin/env node
/* Compact docs/IMPROVEMENT_LOG.md to current state — moving, never deleting.
 *
 * Every section the loop protocol defines as CURRENT STATE (open candidates, last-5 Done, the
 * per-session log window, one tool-coverage snapshot, one row per pattern, one row per pass, one
 * handoff pointer) tends to be written as append-only history. This script restores the schema:
 *   - blocks that leave the ledger are appended VERBATIM to docs/IMPROVEMENT_ARCHIVE.md under a
 *     dated compaction heading, one sub-heading per source section;
 *   - open candidates that are measurement records / refutations / method notes (not fixable
 *     defects — see NON_ACTIONABLE in ledger-rules.mjs) go to docs/reference/loop-findings.md,
 *     appended as one dated section grouped by file, AND to the archive;
 *   - the surviving candidates are sorted P1 → P4, newest first within a priority, so the
 *     bounded session-start read ("top = next") sees the most urgent work;
 *   - a candidate that waits on the maintainer (MAINTAINER_ACTION) moves to ## Awaiting the
 *     maintainer (created after ## Feature seeds if the ledger lacks it), and a P4 found more than
 *     LIMITS.candidateAgeSessions sessions ago goes to the archive under its own sub-heading;
 *   - a ### Pattern health row is never cut (it is one status line by rule; check-ledger enforces the
 *     format) — a duplicate id or a `retired` row leaves for the archive (the catalog keeps the entry);
 *   - surviving blocks keep their first line, cut at the per-section width, with a
 *     " …[full text: IMPROVEMENT_ARCHIVE.md]" tail when anything was cut (the full block is then
 *     also in the archive).
 * Run at every close-out, before check-ledger.mjs. Dry-run by default.
 *
 * Usage:
 *   node scripts/compact-ledger.mjs            # report what would move
 *   node scripts/compact-ledger.mjs --apply    # write ledger, archive, findings
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEDGER, ARCHIVE, FINDINGS, CATALOG, LIMITS, TRUNC, NON_ACTIONABLE, SESSION_RE, PATTERN_ROW_RE, priorityOf, foundSession,
  MAINTAINER_ACTION, AWAITING_HEADING,
  parseSections, blocksOf, isPointer, isPrior, handoffRange,
} from './ledger-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const read = p => readFileSync(join(root, p), 'utf8');

const ledgerText = read(LEDGER);
const { preamble, sections } = parseSections(ledgerText);

const pointerLine = ledgerText.split('\n').find(isPointer) || '';
const sessionTag = (pointerLine.match(/\(S(\d+)\)/) || [])[1] || '?';
const currentSession = /^\d+$/.test(sessionTag) ? Number(sessionTag) : null;   // null: never age anything

// The ledger gains ## Awaiting the maintainer on first run, right after ## Feature seeds.
if (!sections.some(s => s.heading.startsWith('## Awaiting the maintainer'))) {
  const at = sections.findIndex(s => s.heading.startsWith('## Feature seeds'));
  sections.splice(at === -1 ? sections.length : at + 1, 0, { heading: AWAITING_HEADING, lines: ['', '_(none)_', ''] });
}
const today = new Date().toISOString().slice(0, 10);

const archived = [];   // { section, blocks }
const findings = [];   // blocks (candidate records)
const awaiting = [];   // candidate blocks routed to ## Awaiting the maintainer
const retiredRows = [];   // pattern ids whose `retired` row left the ledger this run
const stats = [];

const TAIL = ' …[full text: IMPROVEMENT_ARCHIVE.md]';
const MARK = ' …[full';   // the start of TAIL, which is all a cut through an old marker leaves of it
const STACKED = /^( …\[full( text:)?)+$/;
function truncate(block, width) {
  let first = block[0];
  // A line an earlier run cut ends with TAIL, and its full block is in the archive already: judge only the text before
  // the marker, and drop the fragments an earlier run stacked into it ("…[full text: …[full text: …"). Measured with
  // the marker included, every cut line was over its width again, so each run re-cut it, stacked a marker and
  // re-archived the block. Text written after an old marker is not a fragment: it stays, or is cut and archived.
  const wasCut = first.endsWith(TAIL);
  if (wasCut) {
    first = first.slice(0, -TAIL.length);
    const m = first.indexOf(MARK); if (m !== -1 && STACKED.test(first.slice(m))) first = first.slice(0, m);
  }
  const cut = first.length > width;
  if (!cut && block.length === 1) return { block: wasCut ? [first + TAIL] : block, archive: false };
  let head = cut ? first.slice(0, width) : first;
  if (cut) { const sp = head.lastIndexOf(' '); if (sp > width * 0.6) head = head.slice(0, sp); }
  const m = head.indexOf(MARK); if (m !== -1) head = head.slice(0, m);   // a cut through an old marker keeps none of it
  return { block: [head + TAIL], archive: true };
}

const sessionOf = l => { const m = l.match(SESSION_RE); return m ? Number(m[1]) : -1; };

function compactSection(sec) {
  const h = sec.heading;
  const blocks = blocksOf(sec.lines);
  const keep = [];
  const toArchive = [];
  const aged = [];
  let toFindings = 0, toAwaiting = 0, toAged = 0;
  const bump = (b, width) => { const r = truncate(b, width); if (r.archive) toArchive.push(b); keep.push(r.block); };

  if (h.startsWith('## Candidates')) {
    const cands = [];   // kept blocks, sorted below: P1 first, then newest first (a stable sort keeps ties as written)
    for (const b of blocks) {
      const f = b[0];
      if (f.startsWith('- [ ]')) {
        const text = b.join(' ');
        if (NON_ACTIONABLE.test(text)) { findings.push(b); toArchive.push(b); toFindings++; continue; }
        if (MAINTAINER_ACTION.test(text)) { awaiting.push(b); toAwaiting++; continue; }
        const pri = priorityOf(f), found = foundSession(text);
        if (currentSession !== null && pri === 4 && found !== -1 && found < currentSession - LIMITS.candidateAgeSessions) { aged.push(b); toAged++; }
        else cands.push({ b, pri, found });
      } else toArchive.push(b);
    }
    cands.sort((x, y) => x.pri - y.pri || y.found - x.found);
    for (const c of cands) bump(c.b, TRUNC.candidates);
    if (aged.length) archived.push({ section: `## Candidates — aged P4 (found more than ${LIMITS.candidateAgeSessions} sessions before S${sessionTag})`, blocks: aged });
  } else if (h.startsWith('## Awaiting the maintainer')) {
    const own = blocks.filter(b => b[0].startsWith('- [ ]'));
    for (const b of blocks) if (!b[0].startsWith('- [ ]') && !/^_\(none\)_$/.test(b[0].trim())) toArchive.push(b);
    const all = [...own, ...awaiting];
    if (all.length) for (const b of all) bump(b, TRUNC.awaiting); else keep.push(['_(none)_']);
    awaiting.length = 0;
  } else if (h.startsWith('## Feature seeds')) {
    for (const b of blocks) (b[0].startsWith('- [ ]') ? bump(b, TRUNC.seeds) : toArchive.push(b));
  } else if (h.startsWith('## Done')) {
    const sessions = [...new Set(blocks.map(b => sessionOf(b[0])))].sort((a, b) => b - a).slice(0, LIMITS.doneSessions);
    for (const b of blocks) (sessions.includes(sessionOf(b[0])) ? bump(b, TRUNC.done) : toArchive.push(b));
  } else if (h.startsWith('### Per-session log')) {
    let n = 0;
    for (const b of blocks) {
      if (b[0].startsWith('- ') && n < LIMITS.sessionLogRows) { n++; bump(b, TRUNC.sessionLog); }
      else toArchive.push(b);
    }
  } else if (h.startsWith('### Tool coverage')) {
    let n = 0;
    for (const b of blocks) {
      if (b[0].startsWith('- ') && n < LIMITS.toolCoverageRows) { n++; bump(b, TRUNC.toolCoverage); }
      else toArchive.push(b);
    }
  } else if (h.startsWith('### Pattern health')) {
    const seen = new Set();
    for (const b of blocks) {
      const m = b[0].match(PATTERN_ROW_RE);
      if (m && seen.has(m[1])) { toArchive.push(b); continue; }
      if (m) seen.add(m[1]);
      if (m && m[2] === 'retired') { toArchive.push(b); retiredRows.push(m[1]); continue; }
      keep.push(b);
    }
  } else if (h.startsWith('### Discovery-pass rotation')) {
    const seen = new Set();
    const range = handoffRange(blocks);
    blocks.forEach((b, i) => {
      if (range && i >= range[0] && i < range[1]) { keep.push(b); return; }   // current handoff, verbatim
      const m = b[0].match(/^- ([A-Z])\d? /);
      if (m && !seen.has(m[1])) { seen.add(m[1]); bump(b, TRUNC.rotation); }
      else toArchive.push(b);
    });
  } else {
    for (const b of blocks) keep.push(b);   // ## In progress, ## Metrics (empty body)
  }

  const before = sec.lines.join('\n').length;
  const out = keep.map(b => b.join('\n')).join('\n\n');
  const after = out.length;
  if (toArchive.length) archived.push({ section: h, blocks: toArchive });
  stats.push({ section: h.replace(/\s*\(.*$/, ''), blocks: blocks.length, kept: keep.length, archived: toArchive.length + toAged, findings: toFindings, awaiting: toAwaiting, before, after });
  return { heading: h, body: out };
}

const compacted = sections.map(compactSection);

/* ── assemble outputs ─────────────────────────────────────────────────────────────────── */
const newLedger = [preamble.join('\n').replace(/\n+$/, ''), ...compacted.map(s => `${s.heading}\n\n${s.body}`.replace(/\n+$/, ''))].join('\n\n') + '\n';

let archiveAppend = '';
if (archived.length) {
  archiveAppend = `\n\n<!-- archived by compact-ledger at the S${sessionTag} boundary, ${today} -->\n` +
    `## Compaction (S${sessionTag}, ${today}) — moved verbatim from the live ledger\n`;
  for (const { section, blocks } of archived) {
    archiveAppend += `\n### from ${section.replace(/^#+ /, '')}\n\n` + blocks.map(b => b.join('\n')).join('\n\n') + '\n';
  }
}

function fileKey(block) {
  const fields = block[0].split(' | ');
  const src = fields.length > 1 ? fields[1] : block[0];
  const m = src.match(/[\w.-]+\.(?:html|js|mjs|py|json|csv)/);
  return m ? m[0] : 'suite-wide';
}
function appendFindings(existing, blocks) {
  const groups = new Map();
  for (const b of blocks) { const k = fileKey(b); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
  let text = existing;
  if (!text) {
    text = `# Loop findings — measurements and refutations already made\n\n` +
      `> Grep this file for the file you are about to audit **before** re-deriving a measurement or filing a "defect" that a\n` +
      `> previous session already refuted. Never read it whole. Entries are moved here verbatim from the ledger's Candidates\n` +
      `> by \`scripts/compact-ledger.mjs\`; they are records, not open work. Full history: \`docs/IMPROVEMENT_ARCHIVE.md\`.\n`;
  }
  // One dated section per run, appended at the end and grouped by file inside it. The file is grep-only, so
  // newest-last keeps every earlier line number stable; an earlier version inserted into per-file sections
  // mid-file, which left the file with three layouts and moved existing entries on every run.
  let out = `\n\n## Moved from the ledger's Candidates at the S${sessionTag} boundary (${today})\n`;
  for (const [k, bs] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    out += `\n### ${k}\n\n` + bs.map(b => b.join('\n')).join('\n\n') + '\n';
  }
  return text.replace(/\n*$/, '') + out;
}

/* ── report ───────────────────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s).padEnd(n);
console.log(`compact-ledger (${apply ? 'APPLY' : 'dry run'}) — S${sessionTag}, ${today}`);
console.log(pad('section', 36) + pad('blocks', 8) + pad('kept', 6) + pad('archived', 10) + pad('findings', 10) + pad('awaiting', 10) + pad('bytes before', 14) + 'after');
for (const s of stats) console.log(pad(s.section, 36) + pad(s.blocks, 8) + pad(s.kept, 6) + pad(s.archived, 10) + pad(s.findings, 10) + pad(s.awaiting, 10) + pad(s.before, 14) + s.after);
const bytesOf = (t) => Buffer.byteLength(t);   // LIMITS.totalBytes is BYTES, and check-ledger
// measures Buffer.byteLength — reporting string .length here counted UTF-16 units instead, so a
// ledger carrying Hebrew and em-dashes read ~1.5 KB smaller than it is and looked compacted while
// the gate still failed. Report and judge in the same unit the limit is written in.
console.log(`ledger: ${bytesOf(ledgerText)} → ${bytesOf(newLedger)} bytes; archive +${bytesOf(archiveAppend)} bytes; findings +${findings.length} records`);
if (bytesOf(newLedger) > LIMITS.totalBytes) {
  console.log(`ledger: STILL ${bytesOf(newLedger) - LIMITS.totalBytes} bytes over the ${LIMITS.totalBytes} limit after compaction —`);
  console.log('        the fixed TRUNC widths cannot shrink it further, so trim this session\'s own new text.');
}
const longest = newLedger.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
console.log(`longest live line: ${longest} chars (limit ${LIMITS.lineChars}, handoff ${LIMITS.handoffLineChars})`);

if (retiredRows.length) console.log(`retired this run (set Status: retired on their catalog entries in ${CATALOG}): ${retiredRows.join(', ')}`);

if (apply) {
  writeFileSync(join(root, LEDGER), newLedger);
  if (archiveAppend) writeFileSync(join(root, ARCHIVE), read(ARCHIVE).replace(/\n*$/, '\n') + archiveAppend);
  if (findings.length) {
    const existing = existsSync(join(root, FINDINGS)) ? read(FINDINGS) : '';
    writeFileSync(join(root, FINDINGS), appendFindings(existing, findings));
  }
  console.log('written. Now run: node scripts/check-ledger.mjs --vs origin/main');
} else if (archived.length || findings.length) {
  console.log('dry run — re-run with --apply to write.');
}
