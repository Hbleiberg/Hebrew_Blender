#!/usr/bin/env node
/* Guard docs/IMPROVEMENT_LOG.md — the improvement loop's memory — against silent section loss
 * AND against unbounded growth.
 *
 * WHY. Every loop session restarts from CLAUDE.md + the ledger, never from chat memory, so the
 * ledger IS the loop's state. Two failure modes have both happened:
 *   - LOSS: a hand-written archiving edit once deleted 993 lines (the whole Metrics section, every
 *     pattern's detection definition, the rotation table) and nothing failed. Check 2 catches it.
 *   - GROWTH: every "current state" section was written as append-only history until the ledger
 *     reached 1.7 MB and a session could no longer read its own state. Check 3 catches it; the
 *     fixer is `node scripts/compact-ledger.mjs --apply` (moves overflow verbatim to the archive).
 *
 * THREE CHECKS.
 *   1. STRUCTURE (always): every required section heading is present, and exactly one current
 *      `**Next session (SN):**` pointer exists.
 *   2. CONSERVATION (with --vs <git-ref>): archiving MOVES content, it never destroys it. A bulk
 *      drop in substantive ledger lines since <ref> must be matched by archive growth.
 *   3. SIZE (always): the limits in scripts/ledger-rules.mjs — total bytes, line width (outside
 *      the current handoff), Done ≤ N sessions, per-session log ≤ N rows, one tool-coverage
 *      snapshot, one row per pattern, one row per pass, no _(prior)_ history rows.
 *
 * Plain Node, no deps. Exit 1 on any failure. Read-only — it never edits either file.
 *
 * Usage:
 *   node scripts/check-ledger.mjs                 # structure + size
 *   node scripts/check-ledger.mjs --vs origin/main # + conservation vs a ref
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEDGER, ARCHIVE, LIMITS, REQUIRED, parseSections, blocksOf, isPointer, isPrior, handoffRange } from './ledger-rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const vsIdx = args.indexOf('--vs');
const vsRef = vsIdx === -1 ? null : args[vsIdx + 1];
if (vsIdx !== -1 && !vsRef) {
  console.error('check-ledger: --vs needs a git ref, e.g. --vs origin/main');
  process.exit(1);
}

const read = p => readFileSync(join(root, p), 'utf8');
const atRef = (ref, p) =>
  execFileSync('git', ['show', `${ref}:${p}`], { cwd: root, maxBuffer: 1 << 28 }).toString();

let failed = false;
const fail = m => { failed = true; console.error('check-ledger: FAIL — ' + m); };

/* ── 1. structure ─────────────────────────────────────────────────────────────────────── */
const ledger = read(LEDGER);
const lines = ledger.split('\n');
const headings = lines.filter(l => /^#{1,4} /.test(l));

const missing = REQUIRED.filter(r => !headings.some(h => h.startsWith(r)));
if (missing.length) {
  fail(`${LEDGER} is missing ${missing.length} required section heading(s):`);
  for (const m of missing) console.error(`          ${m}`);
  console.error('        Archiving MOVES entries between files; it must never delete a section.');
  console.error(`        Recover from git: git show <last-good-ref>:${LEDGER}`);
}

const pointers = lines.filter(isPointer);
if (!pointers.length) fail(`${LEDGER} has no "**Next session (SN):**" pointer.`);
else if (pointers.length > 1) fail(`${LEDGER} has ${pointers.length} current "**Next session**" pointers; older ones take the _(prior)_ prefix.`);

/* ── 2. conservation vs a ref ─────────────────────────────────────────────────────────── */
// A line is "substantive" if it could carry state worth keeping. Blank lines, bare headings and
// short scaffolding are excluded: they legitimately churn, and counting them would be noise.
const substantive = l => l.trim().length >= 40 && !/^#{1,4} /.test(l.trim());
const countSubstantive = text => text.split('\n').filter(substantive).length;

// The check is deliberately about BULK, not about individual lines: sessions rewrite candidate
// lines in place constantly, so an exact-line test reports normal churn as loss. TOLERANCE sits
// above a session's ordinary edit churn (~36 lines) and far below the real event (993).
const TOLERANCE = 60;

if (vsRef) {
  let beforeLedger = null, beforeArchive = null;
  try {
    beforeLedger = atRef(vsRef, LEDGER);
    beforeArchive = atRef(vsRef, ARCHIVE);
  } catch {
    fail(`cannot read the ledger/archive at "${vsRef}" — is the ref valid, and the clone non-shallow?`);
  }
  if (beforeLedger !== null && beforeArchive !== null) {
    const shrank = countSubstantive(beforeLedger) - countSubstantive(ledger);   // >0: ledger lost content
    const grew = countSubstantive(read(ARCHIVE)) - countSubstantive(beforeArchive); // >0: archive absorbed content
    if (shrank > TOLERANCE && grew < shrank / 2) {
      fail(`${LEDGER} lost ${shrank} substantive lines since ${vsRef}, but ${ARCHIVE} gained only ${grew}.`);
      console.error('        Archiving MOVES entries between the two files. A drop this size that the');
      console.error('        archive did not absorb means the content was destroyed, not archived.');
      console.error(`        Recover it: git show ${vsRef}:${LEDGER}`);
    } else {
      console.log(`check-ledger: conservation clean vs ${vsRef} — ledger ${shrank >= 0 ? '-' : '+'}${Math.abs(shrank)} substantive lines, archive +${grew}.`);
    }
  }
}

/* ── 3. size — the ledger is current state, not history ───────────────────────────────── */
const bytes = Buffer.byteLength(ledger);
if (bytes > LIMITS.totalBytes) fail(`${LEDGER} is ${bytes} bytes (limit ${LIMITS.totalBytes}). Run: node scripts/compact-ledger.mjs --apply`);

const { sections } = parseSections(ledger);
const section = prefix => sections.find(s => s.heading.startsWith(prefix));
const rotation = section('### Discovery-pass rotation');
const rotBlocks = rotation ? blocksOf(rotation.lines) : [];
const handoff = new Set();
if (rotation) {
  const r = handoffRange(rotBlocks);
  if (r) for (let i = r[0]; i < r[1]; i++) for (const l of rotBlocks[i]) handoff.add(l);
}
const tooLong = [];
for (const l of lines) {
  const cap = handoff.has(l) ? LIMITS.handoffLineChars : LIMITS.lineChars;
  if (l.length > cap) tooLong.push(l);
}
if (tooLong.length) {
  fail(`${tooLong.length} line(s) exceed ${LIMITS.lineChars} chars (${LIMITS.handoffLineChars} inside the current handoff). Detail belongs in the archive; the ledger keeps the headline. First:`);
  for (const l of tooLong.slice(0, 3)) console.error(`          (${l.length}) ${l.slice(0, 90)}…`);
}

const done = section('## Done');
if (done) {
  const ids = new Set(blocksOf(done.lines).map(b => (b[0].match(/\bS(\d{2,3})\b/) || [])[1]).filter(Boolean));
  if (ids.size > LIMITS.doneSessions) fail(`## Done holds ${ids.size} sessions (limit ${LIMITS.doneSessions}); archive the overflow (compact-ledger does it).`);
}
const log = section('### Per-session log');
if (log) {
  const n = blocksOf(log.lines).filter(b => b[0].startsWith('- ')).length;
  if (n > LIMITS.sessionLogRows) fail(`### Per-session log has ${n} rows (limit ${LIMITS.sessionLogRows}).`);
}
const cov = section('### Tool coverage');
if (cov) {
  const n = blocksOf(cov.lines).filter(b => b[0].startsWith('- ')).length;
  if (n !== LIMITS.toolCoverageRows) fail(`### Tool coverage has ${n} snapshot rows; it is ONE current snapshot (rewrite it in place, archive nothing).`);
}
const health = section('### Pattern health');
if (health) {
  const names = blocksOf(health.lines).map(b => (b[0].match(/^- \*\*`?([^`*]+?)`?\*\*/) || [])[1]).filter(Boolean);
  const dup = names.filter((n, i) => names.indexOf(n) !== i);
  if (dup.length) fail(`### Pattern health has duplicate rows for: ${[...new Set(dup)].join(', ')} — one row per pattern, updated in place.`);
}
if (rotation) {
  const letters = rotBlocks.map(b => (b[0].match(/^- ([A-Z])\d? /) || [])[1]).filter(Boolean);
  const dup = letters.filter((n, i) => letters.indexOf(n) !== i);
  if (dup.length) fail(`### Discovery-pass rotation has duplicate rows for pass ${[...new Set(dup)].join(', ')} — one row per pass, updated in place.`);
  const prior = rotation.lines.filter(isPrior).length;
  if (prior) fail(`### Discovery-pass rotation carries ${prior} _(prior)_ history line(s); history goes to the archive.`);
}

if (!failed) {
  console.log(`check-ledger: clean — ${REQUIRED.length} required sections, 1 pointer, ${lines.length} lines, ${bytes} bytes.`);
  process.exit(0);
}
process.exit(1);
