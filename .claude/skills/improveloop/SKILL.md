---
name: improveloop
description: >-
  Run one bounded, ledger-driven continuous-improvement session on the IvritSuite / Hebrew Blender
  codebase: read the ledger, run the stalest discovery pass (A–P, V), ship up to four small verified
  fixes (one commit each), optionally one micro-feature, ask the maintainer at decision gates, update
  the ledger, close out. Use whenever the user invokes /improveloop, or asks to run, continue, resume
  or "rerun" the improvement loop / an improvement session / pass / sweep, or to hunt-and-fix small
  verified issues across the suite — even loosely phrased ("run the loop", "do an improvement pass",
  "beautify the site a bit", "check how it looks on a phone", "deslop the site", "improveloop").
---

# IvritSuite — Continuous Improvement Loop

A bounded session that persists all of its state in `docs/IMPROVEMENT_LOG.md` (the **ledger**), so any
future session resumes with no prior chat context. The loop's value is many small, verified, isolated
wins — never a grand refactor.

**Authority split.** This skill owns *protocol*; the ledger owns *state* (session numbers, rotation
rows, which patterns are active, candidate priorities). Where a template here disagrees with the live
ledger, the ledger wins — except that a pass this skill's roster lists and the rotation table lacks (no
ledgered removal or SKIP note) is registered as a never-run row, not ignored. If the ledger records a
ratified protocol convention this skill contradicts, follow the ledger and flag it in the close-out.

**The loop's files.** Passes: `docs/reference/loop-passes.md` — read only *Probe rules*, *Surfaces*
and the section of the pass you run. Patterns: `docs/reference/loop-patterns.md` — the catalog behind
every Pattern-health row; grep an entry by its id, never read it whole. History:
`docs/IMPROVEMENT_ARCHIVE.md` (grep-only). Measurements and refutations already made:
`docs/reference/loop-findings.md` — grep it for a file before auditing that file, and for a pass idea
before proposing one. Tooling: `scripts/loop/` (`drift.mjs`, `coverage.mjs`, `closeout.mjs`, the
detectors and probes as they land; `scripts/loop/README.md`).

## Session start (in order)
1. **Read `CLAUDE.md`**, then the `docs/reference/<topic>.md` for each area you touch. Every binding
   rule there applies to every iteration.
2. **Read the ledger — bounded.** `grep -n '^## \|^### ' docs/IMPROVEMENT_LOG.md` to map it, then read
   only: the `**Next session (SN):**` handoff (pointer and `⚑` notes), the top ~15 Candidates (they
   are priority-sorted, P1 first), the headlines of `## Awaiting the maintainer` (not yours to fix —
   a session that *can* resolve one moves it to Done), `### Discovery-pass rotation`, `### Pattern
   health` as status lines, the catalog entries of the patterns your pass owns (and of any pattern a
   fix touches), the last `(SN close-out)` Done entry and the last 5 per-session lines. Lines ending
   `…[full text: IMPROVEMENT_ARCHIVE.md]` were cut — grep the archive only for items you act on.
3. **Number this session** from the pointer's `SN`; tag everything you write with it. The pointer is
   the tie-break when two passes look equally stale.
4. **Drift and regressions.** `node scripts/loop/drift.mjs --vs '<the ⚑ drift line in the handoff>'`
   — every field that moved (base commit, `sw.js` VERSION, `FONT_MAKER_VERSION`, migrations and their
   `Live?`, `db/functions/*`, the SDK pin and key, the keep-alive workflow) landed outside the loop and
   left no ledger trace: that surface is prime discovery territory. Never trust the previous
   close-out's numbers unread. Then, once it exists, `node scripts/loop/regress.mjs --last 2` (standing
   arm R: a failed fix probe is a P2 ahead of the pass).
5. **Branch & PR.** CLAUDE.md's Git rule: a `claude/*` branch feeding a draft PR — never push to
   `main` unless the maintainer explicitly authorizes it in-session, never standing. If the previous
   loop PR is open and unmerged, continue on it; if merged, cut a fresh branch off latest
   `origin/main`. Pages deploys only on merge, so deploy `success` is verified after merge.
6. Pick the pass by the **rotation rule** below (`node scripts/loop/coverage.mjs` names the stalest
   surface for a surface pass) and enter the iteration protocol.

## Session parameters
| Parameter | Rule |
|---|---|
| Budget | **5 iterations**: 1 discovery pass + up to 4 fixes. A micro-feature costs 2. |
| Scope guard | One concern per iteration, one commit per iteration. A fix that reveals a second problem logs it as a candidate — never chase it now. |
| Verification debt | At most one unverified aspect outstanding; resolve or revert it before the next iteration, and end the session rather than accumulate a second. Never leave the tree mid-change. |
| Variety governor | Max 2 iterations/session on one recurring-pattern class; max 2 touching one tool (each chrome page — index, resources, contact, privacy, terms, 404, **account** — is its own tool for this cap; at most **one iteration per session** may change a shared script every page loads — `js/i18n.js`, `pwa.js`, the four backend modules — and that iteration does not also spend the per-page touches). The pass charges the budget but not the caps. If the top candidate breaks a cap, take the highest-priority one that doesn't; priority still wins across sessions. Tie-break toward tools and patterns untouched in the last 2 sessions. |

**Backend boundary — the loop never changes the live project** (CLAUDE.md accounts rules 6 and 10: no
migration applied, no function deployed, no key, policy or grant touched, and no gate makes it
askable). A finding that needs one becomes a Candidate or seed with the SQL drafted as the next
`db/migrations/NNNN_<name>.sql`, `Live?` = no, and is named in the close-out as maintainer work.
Reading the live project through the connector is allowed and expected (`list_migrations`,
`list_tables`, `get_advisors`, `list_edge_functions`, `get_edge_function`, `query_logs`) — nothing
that writes, pauses, restores, branches or rotates. **Nothing from a live read — an e-mail, a user id,
a row name, a log line — is written into the ledger, the findings file or a commit** (the ledger is
public); a read that finds drift logs a Candidate naming the maintainer action only.

## Rotation rule
Passes are **suite** passes (A, B, E, F, I, K, L, V: the whole suite over the commit delta since their
last run) or **surface** passes (C, D, G, H, M, N, P: one surface per run — the surfaces are in
`loop-passes.md` → *Surfaces*; the chrome pages form one bundle there). **Stalest first across both
classes:** a surface pass's staleness is the age of its least-recently-audited surface as
`coverage.mjs` reports it (a never-audited surface outranks everything); a suite pass's is its last
run. Overrides: (1) **yield deferral** — a suite pass whose last two runs together FOUND ≤ 2 and whose
delta is < 40 commits yields its slot once to the stalest surface pass, noting
`deferred S<N>: delta n, yield y` in its row, and never defers twice running; (2) **a clean surface
buys a second** — a surface pass that finds nothing by mid-session takes its next-stalest surface in
the same session; (3) **static arms are free** — `closeout.mjs` runs every committed detector every
session, so a suite pass is its runtime and judgement arms over the delta, never a re-grep; (4) **a
new page's first visit** — a page that landed outside the loop gets its first N and P within 14
sessions. J and O are SKIP (O until the maintainer commits the permission rule its row names). The
pointer breaks ties. Skip the pass only on explicit user direction, recording
`pass run: — (skipped; <X> stays stalest)`. A per-surface row's `X-next:` note must agree with
`coverage.mjs --check`.

**Roster** (full definitions, arms and boundaries: `loop-passes.md`):
A recurring-pattern sweep (suite; A2 every 6th) · B console & errors (suite) · C accessibility
(surface; owns target size and legibility) · D performance (surface) · E freshness & site health
(suite; + the API shape-drift arm) · F cross-tool consistency (suite) · G print & export (surface;
owns paper and the exported file) · H teacher walkthrough (surface; + one student cell) · I first-load
& empty state (suite) · J SKIP · K i18n (suite) · L SEO (suite) · M aesthetics (surface) · N mobile
& touch (surface) · O deslop (SKIP) · P accounts & cloud (surface) · V offline & service-worker
runtime (suite) · R regression re-run (standing arm at session start, not a letter).

## Decision gates — ask the maintainer (AskUserQuestion, concise options, a recommended default)
Small verified fixes stay autonomous. These decisions are the maintainer's:
1. **Micro-feature selection** — which Feature seed to build, or skip this session.
2. **User-visible copy & SEO text** — any wording or default-behavior change beyond a small fix
   (renaming a button is gated; fixing its typo is not), and ANY change to titles, meta descriptions,
   OG copy or JSON-LD claims.
3. **Dramatic aesthetics** (pass M) — anything a returning teacher would immediately notice: palette,
   font, layout restructuring, component redesign, re-theming. Propose with current-state screenshots.
4. **Mobile restructuring** (pass N) — a fix scoped inside a phone-width media query stays autonomous;
   ask before anything that changes what desktop users see, hides or reorders content at phone widths,
   adds a touch-only interaction or a phone-specific blocking screen, or migrates a unit/breakpoint
   page-wide. Propose with phone screenshots, stating what changes on phone AND desktop.
5. **Every Deslop proposal** (pass O, when it runs) — no autonomous fix path; one contact sheet and one
   question per session.

**Batching:** collect gate questions at the post-pass selection moment and at iteration boundaries,
up to 4 per call. Never gate small mechanical fixes; a session with no gated work asks nothing.
**Unattended fallback (no answer can arrive):** gate 1 — skip the micro-feature; gates 2–4 — ship
nothing dramatic, log the proposal under `## Awaiting the maintainer` with its screenshot paths.
Record every deferral under "Decisions deferred to maintainer" in the close-out entry. A gate degrades
gracefully; it never stalls the session.

## Iteration protocol (repeat up to budget)
1. **Discover, then select.** Run the pass the rotation rule picked, logging everything found as
   Candidates / Feature seeds before fixing anything. Then select the top candidate the variety
   governor allows.
2. **Ground.** Open the file, grep the exact anchors, read the surrounding conventions (strict
   single-file HTML; match local style). Ledger line numbers drift — locate by pattern.
3. **Fix minimally.** Smallest diff that resolves the issue; no drive-by cleanups or reformatting.
4. **Verify** per *Probe rules* in `loop-passes.md`: CLAUDE.md's Playwright recipe (light + dark ×
   desktop + ~800px) plus an issue-specific check designed before coding; a backend file or a page's
   account wiring by the matching smoke, never the recipe; fire a control before trusting a zero.
   Commit the probe under `scripts/loop/probes/` only when no smoke scenario or ACTIVE pattern covers
   the fix.
5. **Commit**, naming the pattern if it's a recurring one.
6. **Log.** Move the item to Done (date, commit, verification method); update the pattern's ledger
   row and catalog entry for a sweep-class fix; a new recurring shape gets its row **and** its catalog
   entry with a detector or recipe in the same commit (a row with neither is DRAFT and earns no streak).

**When a fix fails:** if the correct fix isn't small or the diff balloons past one concern — revert
cleanly, re-log the candidate with what you learned, record "attempted, reverted" in Done. A clean
revert with better intelligence is a successful iteration; a half-verified change in the tree is not.

## Micro-feature track
One per session at most, costing 2 iterations, from the ledger's Feature seeds only; selection is gate 1
(unattended: skip and log). What counts as micro, its verification and its abort rule:
`loop-passes.md` → *Micro-feature track*.

## Prioritization rubric
P1 data loss, security, broken core function, export corruption, an account-wide deletion or overwrite
(a reset pushed up, a sync that removes), a secret or session token reaching a page or analytics, an
anonymous visit that downloads or calls the account layer · P2 silently wrong output, undo holes, a11y
blockers · P3 performance, dead UI, confusing copy, consistency, paper-cuts · P4 polish.
Tie-breakers: (1) teachers' saved work, (2) the printed/exported artifact, (3) dual-audience beats
single, (4) untouched in the last 2 sessions, (5) smallest diff.

## Ledger schema
The ledger is **current state**; `scripts/check-ledger.mjs` fails a close-out that breaks the schema
and `scripts/compact-ledger.mjs --apply` moves overflow verbatim to the archive (both run by
`closeout.mjs`). Limits and row regexes: `scripts/ledger-rules.mjs`. Write the headline; detail goes to
the archive entry or the catalog, never the ledger line.
- Candidates `- [ ] P<n> | <file> | <one-sentence defect> | found S<N>`, priority-sorted, open fixable
  work only (measurements → `loop-findings.md`; waits on the maintainer → `## Awaiting the
  maintainer`; a P4 older than 90 sessions → archive; struck → Done, never a `[x]` line).
- Feature seeds: open only. Awaiting the maintainer: resolved → Done. Done: last 5 sessions,
  `- [x] <date> | <commit> | <file> | <what> | <verified how>` plus one `(SN close-out) |
  branch/deploy note` per session. Per-session log: last 20 rows. Tool coverage: one snapshot row.
- Pattern health: `` - `<id>` | ACTIVE|DRAFT|GUARD|retired | owner <letter> | det: <path | recipe |
  none> | last S<N> | streak n [| hits n] `` — everything else in the catalog entry; a retired row
  leaves the ledger.
- Rotation: one row per pass `- <letter> <name>: <date> (SN: <result + surface> … X-next: …)`,
  updated in place; then the single `**Next session (SN+1):**` handoff (pointer, the `⚑ drift:`
  line, a few `⚑` notes). The previous handoff moves to the archive.

## Session close-out (always, even on early stop)
1. **Ledger:** Done entries and the close-out entry, Candidates and seeds re-prioritized, the pattern
   rows and catalog entries touched, Tool coverage, the rotation row (its `X-next:` from
   `coverage.mjs`), the per-session line, the new handoff with this session's `drift.mjs` line.
2. **`node scripts/loop/closeout.mjs`** — compaction, the ledger checks, `check-i18n`,
   `check-inline-js`, the llms/sitemap checks, `coverage --check`, every detector and static check that
   exists — must come back clean. Then walk **CLAUDE.md's definition of done** for what it cannot
   check: `sw.js` VERSION if a precached file changed, `FONT_MAKER_VERSION` + one changelog entry if a
   Font Maker feature shipped, the `data/` `?v=N` bump on every fetcher if a corpus changed, the backend
   smokes if a backend file changed, the CSP if a new origin is loaded, `privacy/terms` text if stored
   data changed, `update-sitemap` / `update-llms-txt` if page content or metadata changed.
3. **Push** the session branch; ensure the draft PR exists or is updated.
4. **Summary**: iterations, the pass and its result, patterns swept, micro-feature shipped/split,
   screenshots delivered (M/N rules), gates asked → answers, deferrals, protocol divergences to fold
   into this skill, and what a human must do (merge, verify the deploy, apply a drafted migration,
   redeploy a changed function, the keep-alive). Then **"In simple terms, what did this loop session
   do?"** — a short, jargon-free recap for a teacher: what visibly changed, what was checked and
   found fine, what to do next — ending with "run `/compact` now before the next session" (or that
   the harness auto-compacts).

If the ledger is missing, stop and ask the maintainer — never bootstrap a new one silently.
