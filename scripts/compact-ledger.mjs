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
 *     grouped by file, AND to the archive;
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
  LEDGER, ARCHIVE, FINDINGS, LIMITS, TRUNC, NON_ACTIONABLE,
  parseSections, blocksOf, isPointer, isPrior, handoffRange,
} from './ledger-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apply = process.argv.includes('--apply');
const read = p => readFileSync(join(root, p), 'utf8');

const ledgerText = read(LEDGER);
const { preamble, sections } = parseSections(ledgerText);

const pointerLine = ledgerText.split('\n').find(isPointer) || '';
const sessionTag = (pointerLine.match(/\(S(\d+)\)/) || [])[1] || '?';
const today = new Date().toISOString().slice(0, 10);

const archived = [];   // { section, blocks }
const findings = [];   // blocks (candidate records)
const stats = [];

const TAIL = ' …[full text: IMPROVEMENT_ARCHIVE.md]';
function truncate(block, width) {
  const first = block[0];
  const cut = first.length > width;
  if (!cut && block.length === 1) return { block, changed: false };
  let head = cut ? first.slice(0, width) : first;
  if (cut) { const sp = head.lastIndexOf(' '); if (sp > width * 0.6) head = head.slice(0, sp); }
  return { block: [head + TAIL], changed: true };
}

const sessionOf = l => { const m = l.match(/\bS(\d{2,3})\b/); return m ? Number(m[1]) : -1; };

function compactSection(sec) {
  const h = sec.heading;
  const blocks = blocksOf(sec.lines);
  const keep = [];
  const toArchive = [];
  let toFindings = 0;
  const bump = (b, width) => { const r = truncate(b, width); if (r.changed) toArchive.push(b); keep.push(r.block); };

  if (h.startsWith('## Candidates')) {
    for (const b of blocks) {
      const f = b[0];
      if (f.startsWith('- [ ]')) {
        if (NON_ACTIONABLE.test(b.join(' '))) { findings.push(b); toArchive.push(b); toFindings++; }
        else bump(b, TRUNC.candidates);
      } else toArchive.push(b);
    }
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
      const m = b[0].match(/^- \*\*`?([^`*]+?)`?\*\*/);
      if (m) { if (seen.has(m[1])) { toArchive.push(b); continue; } seen.add(m[1]); }
      bump(b, TRUNC.patternHealth);
    }
  } else if (h.startsWith('### Retired patterns')) {
    for (const b of blocks) bump(b, TRUNC.retired);
  } else if (h.startsWith('## Recurring-pattern sweep status')) {
    for (const b of blocks) bump(b, TRUNC.sweepStatus);
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
  stats.push({ section: h.replace(/\s*\(.*$/, ''), blocks: blocks.length, kept: keep.length, archived: toArchive.length, findings: toFindings, before, after });
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
function mergeFindings(existing, blocks) {
  const groups = new Map();
  for (const b of blocks) { const k = fileKey(b); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(b); }
  let text = existing;
  if (!text) {
    text = `# Loop findings — measurements and refutations already made\n\n` +
      `> Grep this file for the file you are about to audit **before** re-deriving a measurement or filing a "defect" that a\n` +
      `> previous session already refuted. Never read it whole. Entries are moved here verbatim from the ledger's Candidates\n` +
      `> by \`scripts/compact-ledger.mjs\`; they are records, not open work. Full history: \`docs/IMPROVEMENT_ARCHIVE.md\`.\n`;
  }
  for (const [k, bs] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const heading = `## ${k}`;
    const body = bs.map(b => b.join('\n')).join('\n\n');
    const idx = text.indexOf(`\n${heading}\n`);
    if (idx === -1) text = text.replace(/\n*$/, '') + `\n\n${heading}\n\n${body}\n`;
    else { const at = idx + heading.length + 2; text = text.slice(0, at) + `\n${body}\n` + text.slice(at); }
  }
  return text;
}

/* ── report ───────────────────────────────────────────────────────────────────────────── */
const pad = (s, n) => String(s).padEnd(n);
console.log(`compact-ledger (${apply ? 'APPLY' : 'dry run'}) — S${sessionTag}, ${today}`);
console.log(pad('section', 36) + pad('blocks', 8) + pad('kept', 6) + pad('archived', 10) + pad('findings', 10) + pad('bytes before', 14) + 'after');
for (const s of stats) console.log(pad(s.section, 36) + pad(s.blocks, 8) + pad(s.kept, 6) + pad(s.archived, 10) + pad(s.findings, 10) + pad(s.before, 14) + s.after);
console.log(`ledger: ${ledgerText.length} → ${newLedger.length} bytes; archive +${archiveAppend.length} bytes; findings +${findings.length} records`);
const longest = newLedger.split('\n').reduce((m, l) => Math.max(m, l.length), 0);
console.log(`longest live line: ${longest} chars (limit ${LIMITS.lineChars}, handoff ${LIMITS.handoffLineChars})`);

if (apply) {
  writeFileSync(join(root, LEDGER), newLedger);
  if (archiveAppend) writeFileSync(join(root, ARCHIVE), read(ARCHIVE).replace(/\n*$/, '\n') + archiveAppend);
  if (findings.length) {
    const existing = existsSync(join(root, FINDINGS)) ? read(FINDINGS) : '';
    writeFileSync(join(root, FINDINGS), mergeFindings(existing, findings));
  }
  console.log('written. Now run: node scripts/check-ledger.mjs --vs origin/main');
} else if (archived.length || findings.length) {
  console.log('dry run — re-run with --apply to write.');
}
