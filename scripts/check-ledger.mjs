#!/usr/bin/env node
/* Guard docs/IMPROVEMENT_LOG.md — the improvement loop's memory — against silent section loss.
 *
 * WHY THIS EXISTS. Every loop session restarts from CLAUDE.md + the ledger, never from chat
 * memory, so the ledger is not documentation about the work — it IS the loop's state. Two of its
 * sections are load-bearing in a way that is easy to miss:
 *   - `### Pattern health` carries each recurring pattern's DETECTION DEFINITION, and the pass-A
 *     protocol is "sweep by that definition; don't re-derive a weaker one". Lose it and pass A
 *     cannot run as specified.
 *   - `### Discovery-pass rotation` is the authority on which pass is stalest, i.e. on what the
 *     next session does first.
 *
 * The failure this catches is real, not hypothetical. The S295 close-out (be3eac8) meant to
 * archive five Done entries; it archived them correctly AND deleted 993 further lines — the whole
 * Metrics section, the sweep-status section, the rotation table and the historical pointer chain —
 * none of which reached the archive. The ledger went 1828 -> 845 lines while the archive grew by
 * 10, and nothing failed. S296 found it only because a maintainer asked why the PR diff looked
 * lopsided. The cause is mechanical and will recur: close-out archiving is a hand-written
 * line-range edit, and an end index that runs past the Done section truncates everything after it.
 *
 * TWO CHECKS.
 *   1. STRUCTURE (always): every required section heading is present, and the file still ends with
 *      a `**Next session (SN):**` pointer.
 *   2. CONSERVATION (with --vs <git-ref>): archiving MOVES content, it never destroys it. Every
 *      non-trivial line that left the ledger since <ref> must be findable in the archive as it
 *      stands now. This is the check that would have failed on be3eac8.
 *
 * Plain Node, no deps. Exit 1 on any failure. Read-only — it never edits either file.
 *
 * Usage:
 *   node scripts/check-ledger.mjs                 # structure only
 *   node scripts/check-ledger.mjs --vs origin/main # structure + conservation vs a ref
 *   node scripts/check-ledger.mjs --vs HEAD~1
 */
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = 'docs/IMPROVEMENT_LOG.md';
const ARCHIVE = 'docs/IMPROVEMENT_ARCHIVE.md';

// Headings the loop protocol depends on. Matched as a prefix so a section may carry a
// parenthetical gloss (the live ledger's headings do) without tripping the check.
const REQUIRED = [
  '## Candidates',
  '## Feature seeds',
  '## In progress',
  '## Done',
  '## Metrics',
  '### Per-session log',
  '### Tool coverage',
  '### Pattern health',
  '### Retired patterns',
  '## Recurring-pattern sweep status',
  '### Discovery-pass rotation',
];

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
  console.error(`        Recover from git (the section text is intact in history):`);
  console.error(`          git show <last-good-ref>:${LEDGER}`);
}

// The trailing pointer is what names the next session and its pass; losing it strands the loop.
const pointers = lines.filter(l => /^\*\*Next session \(S\d+\):\*\*/.test(l));
if (!pointers.length) fail(`${LEDGER} has no "**Next session (SN):**" pointer.`);
else if (pointers.length > 1) fail(`${LEDGER} has ${pointers.length} current "**Next session**" pointers; older ones take the _(prior)_ prefix.`);

/* ── 2. conservation vs a ref ─────────────────────────────────────────────────────────── */
// A line is "substantive" if it could carry state worth keeping. Blank lines, bare headings and
// short scaffolding are excluded: they legitimately churn, and counting them would be noise.
const substantive = l => l.trim().length >= 40 && !/^#{1,4} /.test(l.trim());
const countSubstantive = text => text.split('\n').filter(substantive).length;

// The check is deliberately about BULK, not about individual lines. Sessions rewrite candidate
// lines in place constantly — striking one as done replaces its text — so an exact-line "did this
// survive?" test reports normal churn as loss and a gate nobody trusts is a gate nobody runs.
// The failure worth gating is the one that happened: a whole region disappearing at once. TOLERANCE
// is sized above a session's ordinary edit churn (S294's close-out moved ~36 lines) and far below
// the real event (993).
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
    const ledgerBefore = countSubstantive(beforeLedger);
    const ledgerNow = countSubstantive(ledger);
    const archiveBefore = countSubstantive(beforeArchive);
    const archiveNow = countSubstantive(read(ARCHIVE));
    const shrank = ledgerBefore - ledgerNow;   // >0 means the ledger lost content
    const grew = archiveNow - archiveBefore;   // >0 means the archive absorbed content

    if (shrank > TOLERANCE && grew < shrank / 2) {
      fail(`${LEDGER} lost ${shrank} substantive lines since ${vsRef}, but ${ARCHIVE} gained only ${grew}.`);
      console.error('        Archiving MOVES entries between the two files. A drop this size that the');
      console.error('        archive did not absorb means the content was destroyed, not archived —');
      console.error('        which is how the whole Metrics + rotation half of the ledger was lost once.');
      console.error(`        Recover it: git show ${vsRef}:${LEDGER}`);
    } else {
      console.log(`check-ledger: conservation clean vs ${vsRef} — ledger ${shrank >= 0 ? '-' : '+'}${Math.abs(shrank)} substantive lines, archive +${grew}.`);
    }
  }
}

if (!failed) {
  console.log(`check-ledger: structure clean — all ${REQUIRED.length} required sections present, 1 current "Next session" pointer, ${lines.length} lines.`);
  process.exit(0);
}
process.exit(1);
