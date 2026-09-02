/* Shared size rules for docs/IMPROVEMENT_LOG.md — the improvement loop's live state file.
 *
 * The ledger is CURRENT STATE, not history. History lives in docs/IMPROVEMENT_ARCHIVE.md
 * (append-only, grep-only) and measurements/refutations in docs/reference/loop-findings.md.
 * These limits keep the ledger cheap to read at the start of every session; check-ledger.mjs
 * enforces them and compact-ledger.mjs moves the overflow verbatim into the archive.
 */
export const LEDGER = 'docs/IMPROVEMENT_LOG.md';
export const ARCHIVE = 'docs/IMPROVEMENT_ARCHIVE.md';
export const FINDINGS = 'docs/reference/loop-findings.md';

export const LIMITS = {
  totalBytes: 100_000,       // whole live ledger
  lineChars: 600,            // any line outside the current "Next session" handoff
  handoffLineChars: 1500,    // lines of the current handoff block (pointer + its ⚑ notes)
  doneSessions: 5,           // distinct sessions held in ## Done
  sessionLogRows: 20,        // rows in ### Per-session log
  toolCoverageRows: 1,       // ### Tool coverage is one snapshot, not a history
};

// Truncation widths compact-ledger applies per section (first line kept, rest archived).
export const TRUNC = {
  candidates: 400,
  seeds: 400,
  done: 400,
  sessionLog: 300,
  toolCoverage: 550,
  patternHealth: 280,
  retired: 550,
  sweepStatus: 240,
  rotation: 400,
};

// An open candidate whose text matches one of these is a measurement/refutation/method record,
// not a fixable defect: it moves to docs/reference/loop-findings.md (grep before re-deriving).
export const NON_ACTIONABLE = new RegExp([
  'standing MEASUREMENT', 'a MEASUREMENT', 'REFUTATION', 'METHOD (finding|carry|record|note|lesson)', 'informational',
  'measured,? (logged|not|deliberately)', 'logged not fixed', 'deliberately NOT (fixed|taken|chased)', 'not chased',
  'recorded so', 'recorded because', 'recorded, not', 'so no future', 'so a future', 'not a defect', 'NOT a live bug', 'not filed',
  'HANDED TO PASS', 'the honest limit', 'defensive-only', 'census that', 'checker-defect', 'probe DEFECT', 'probe-shape',
  'detector false', 'clean-walk', 'receipts', 'REFUTED', 'is DELIBERATE', 'Do not re-ask', 'stays UNWAIVED', 'do NOT re-file', 'GATE \\d ASKED AND ANSWERED', 'leave as-is', 'rejected in-session',
  '\\| [^|]*protocol[^|]* \\|',   // the "file" field names a loop pass/protocol, not a page
].join('|'), 'i');

// Headings the loop protocol depends on, matched as prefixes (glosses may follow).
export const REQUIRED = [
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

/** Split ledger text into { preamble: string[], sections: [{ heading, lines }] } (flat, in order). */
export function parseSections(text) {
  const lines = text.split('\n');
  const preamble = [];
  const sections = [];
  let cur = null;
  for (const l of lines) {
    if (/^#{2,3} /.test(l)) { cur = { heading: l, lines: [] }; sections.push(cur); }
    else if (cur) cur.lines.push(l);
    else preamble.push(l);
  }
  return { preamble, sections };
}

/** Blocks of a section body. A block starts at a bullet, a bold/italic paragraph opener, a comment or
 *  a heading-like line; indented lines and plain wrapped text attach to the block above; blank lines
 *  end a block. Each block is a non-empty array of lines. */
const STARTS_BLOCK = /^(- |\*\*|_\(|<!--|\d+\. )/;
export function blocksOf(lines) {
  const blocks = [];
  let cur = [];
  for (const l of lines) {
    if (l.trim() === '') { if (cur.length) { blocks.push(cur); cur = []; } continue; }
    if (STARTS_BLOCK.test(l) && cur.length) { blocks.push(cur); cur = []; }
    cur.push(l);
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

export const isPointer = l => /^\*\*Next session \(S\d+\):\*\*/.test(l);
export const isPrior = l => /^\s*_\(prior/.test(l);

/** Index range [start, end) of the current handoff inside a rotation section's block list:
 *  the current pointer block plus every following block up to the first _(prior)_ block. */
export function handoffRange(blocks) {
  const start = blocks.findIndex(b => isPointer(b[0]));
  if (start === -1) return null;
  let end = start + 1;
  while (end < blocks.length && !isPrior(blocks[end][0])) end++;
  return [start, end];
}
