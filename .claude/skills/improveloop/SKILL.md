---
name: improveloop
description: >-
  Run one bounded, ledger-driven continuous-improvement session on the IvritSuite / Hebrew Blender
  codebase using the v2 improvement-loop protocol — read docs/IMPROVEMENT_LOG.md first, select the top
  candidate under the variety governor, run the single stalest rotating discovery pass, make small
  single-concern verified fixes (up to a 5-iteration budget, one commit each), optionally ship one
  micro-feature, then update the ledger, bump sw.js VERSION once, and print a close-out summary. Use
  this whenever the user invokes /improveloop, or asks to run, continue, resume, or "rerun" the
  improvement loop / an improvement session / iteration / pass, run a discovery or recurring-pattern
  sweep, or hunt-and-fix small verified issues across the suite — even loosely phrased ("run the loop",
  "do an improvement pass", "improveloop").
---

# IvritSuite — Continuous Improvement Loop (v2)

You are running a bounded improvement loop on the IvritSuite codebase. This skill is reusable: every
session follows the same protocol and persists its state, so any future session can resume without any
prior session's context. The loop's value is many small, verified, isolated wins — not a grand
refactor. v2 adds a variety governor, health metrics, and a narrow micro-feature track.

## Session parameters
- **Budget:** up to **5 iterations** per session, or stop earlier if verification debt accumulates. Never leave the repo mid-change at session end.
- **Ledger:** `docs/IMPROVEMENT_LOG.md` is the loop's memory. Read it FIRST every session. If v2 sections (Metrics, Feature seeds, Pass rotation) are missing, add them in this session's first commit.
- **Scope guard:** one concern per iteration, one commit per iteration. If a fix reveals a second problem, log it as a candidate — do not chase it now.
- **Variety governor (hard rules):**
  - Max **2 iterations per session** on the same recurring-pattern class.
  - Max **2 iterations per session** touching the same tool (index.html counts as a tool).
  - If the top candidate violates a cap, take the highest-priority candidate that doesn't. Priority still wins across sessions — the cap only reorders within a session.
  - Prefer, as a tie-breaker, tools and pattern classes untouched in the last 2 sessions (check the Metrics section).

## Ledger structure (`docs/IMPROVEMENT_LOG.md`)
```
# IvritSuite Improvement Log

## Candidates (prioritized, top = next)
- [ ] P1 | <file> | <one-line description> | <found: date, how>

## Feature seeds (micro-features only; see Micro-feature track)
- [ ] S | <tool> | <one-line description> | <est. size S/M> | <found: date, how>

## In progress

## Done (last 5 sessions only — older entries move to docs/IMPROVEMENT_ARCHIVE.md)
- [x] <date> | <commit> | <file> | <description> | <verified how>

## Metrics
### Per-session log (one line per session)
- <date> | iters: N | tools touched: … | patterns fixed: … | pass run: <letter> | SW: vNNN→vNNN
### Tool coverage (last-touched date per tool)
- font-maker: <date> | dashboard: <date> | worksheets: <date> | flashcards: <date> | torah-trainer: <date> | shabbat: <date> | index: <date>
### Pattern health (per recurring pattern: last swept, hits found that sweep, consecutive clean sweeps)
- falsy-zero: swept <date>, hits: N, clean streak: N
- (one line per pattern; RETIRE a pattern to the Retired list after 3 consecutive clean sweeps — retired patterns are re-checked only in pass A2)
### Retired patterns
- <pattern> | retired <date> | reason

## Pass rotation (last-run date per discovery pass A–J)
- A: <date> | B: <date> | … | J: <date>
```

**Ledger hygiene:** at close-out, if Done exceeds 5 sessions of entries, move the overflow to `docs/IMPROVEMENT_ARCHIVE.md` (append-only, same format). The working ledger must stay small enough to read cheaply every session.

## Iteration protocol (repeat up to budget)
1. **Select** the top candidate from the ledger that satisfies the variety governor. If Candidates has fewer than 3 items, run ONE discovery pass first to refill it, logging everything found before fixing anything.
2. **Ground:** open the file, grep the exact anchors, read the surrounding conventions (strict single-file HTML; match local style exactly). Read `CLAUDE.md` at the start of every session — it is the constitution.
3. **Fix minimally.** Smallest diff that resolves the issue. No drive-by cleanups, no reformatting neighboring code.
4. **Verify** per the CLAUDE.md Playwright recipe (light + dark, desktop + ~800 px) plus an issue-specific check you design before coding. Anything touching save data: `.ivrit` round-trip. Anything touching export paths (fonts, share links, CSVs, printables): produce the artifact and inspect it.
5. **Commit** with a message naming the pattern if it's a recurring one.
6. **Log:** move the item to Done with date, commit hash, and verification method; update Pattern health if a sweep-class fix.

## Discovery passes (STRICT rotation — always run the stalest per the Pass rotation table; record it)
Run exactly one per session, before the first fix.

**A. Recurring-pattern sweep** — sweep only ACTIVE (non-retired) patterns:
1. **Falsy-zero on numeric fields:** `grep -nE '\.(advance|lsb|rsb|offset|nudge|scale|spread|opacity)[a-zA-Z]*\)? *\|\|' *.html` — any `x || default` where 0 is legal.
2. **Mutations outside the undo system (Font Maker):** `markDirty()` without `udDo`/`udCapture`/`udBurstBegin`.
3. **Sliders with `oninput` but no `onchange="udBurstCommit()"`** in Font Maker.
4. **Controls reachable in only one workMode/step** while the workflow steers users past that step.
5. **localStorage keys missing from AllTools** (index.html gather/import/erase) or from the owning tool's `.ivrit` payload.
6. **Unescaped user input:** innerHTML interpolation bypassing `esc()`; `JSON.parse` bypassing `ivritSafeParse`.
7. **JSON-LD ↔ visible-content parity.**
8. **Destructive bulk operations without preservation or confirm.**
Update Pattern health after the sweep; retire per the 3-clean-streak rule.

**A2. Retired-pattern spot check (counts as pass A when A is stalest and all patterns are retired, or every 6th A):** one quick sweep of retired patterns to confirm they stayed dead; any hit un-retires the pattern.

**B. Console & error audit** — load every page headless, capture console errors/warnings and failed requests on load and one basic interaction per tool.

**C. Accessibility pass (one tool per session)** — keyboard-only walkthrough: focus order, focus visibility, Escape/Enter on modals, `aria-` on interactive SVG/canvas, `prefers-reduced-motion`, contrast in both themes. These tools are projected and used by young students and teachers on school-managed devices — touch targets and keyboard parity are not optional.

**D. Performance snapshot (one tool per session)** — cold load + one heavy interaction; log main-thread blocks >200 ms with profile evidence.

**E. Freshness & site health** — sitemap `lastmod` vs git history (`scripts/update-sitemap.mjs` if present), broken internal links, SW precache list vs actual files, THIRD_PARTY_LICENSES.md vs deps, README/CLAUDE.md accuracy.

**F. Cross-tool consistency** — one UX affordance per session (empty states, share-link buttons, dark-mode toggles, Hebrew font pickers, error toasts) compared across all six tools; converge on the best existing implementation.

**G. Print & export fidelity (one tool per session)** — the printed page is the product a student actually holds. Print-preview (and print-to-PDF) every printable/exportable surface in one tool: margins, page breaks mid-item, nikkud clipping at print resolution, dark-mode ink bleed (nothing should print with dark backgrounds), header/footer junk, RTL alignment on paper. Compare on Letter and A4 page sizes. Log divergences as candidates (usually P2 — silently wrong artifact).

**H. Teacher walkthrough / paper-cuts (one tool per session)** — role-play a teacher preparing an actual lesson end-to-end in one tool (e.g., "make Tuesday's aleph-bet worksheet and a matching flashcard deck"). Note every friction point: extra clicks, missing defaults, unclear copy, dead-end states, things that require re-entering data another tool already has. Small frictions become Candidates (P3); missing small affordances become **Feature seeds**. This is the primary intake for the micro-feature track.

**I. First-load & empty-state pass** — clear all localStorage and visit every tool as a brand-new user: is the empty state instructive, does anything crash on absent keys, do sample/demo data paths work, does onboarding copy match current UI? New-teacher experience is invisible to you (your localStorage is always full) unless deliberately audited.

**J. Metrics-informed pass (only if the impact-metrics dashboard/Worker is live)** — pull usage data: which tools/features see real traffic, where do sessions end abruptly, which pages 404. Reprioritize Candidates and Feature seeds against actual usage; log anomalies (a heavily-used tool with zero export events suggests a broken or undiscoverable export). If metrics aren't live yet, skip in rotation and note it.

## Micro-feature track
Small user-visible enhancements are in scope, under tight fencing:

- **Source:** only from the **Feature seeds** ledger section (populated mainly by pass H, or by explicit human request noted in the ledger). Never invent a feature mid-session.
- **Definition of "micro":** one tool, ≤ ~150 lines of diff, no new dependencies, no build step, no `data/` edits, no new localStorage keys without registering them in the AllTools index + `.ivrit` payload in the same commit, fits existing single-file HTML conventions and both themes.
- **Budget:** max **1 micro-feature per session**, and it costs **2 iterations** of the 5-iteration budget. Skip it entirely in any session where a P1 exists.
- **Selection:** prefer seeds that serve both the Hebrew tools and secular uses (number practice, timers, student picker, English font support) — dual-audience seeds outrank single-audience at equal size.
- **Verification is stricter:** everything in step 4 of the protocol, plus a fresh-profile check (pass-I style, empty localStorage) and a `.ivrit` round-trip if any state was added.
- **Abort rule:** if the diff is trending past ~150 lines or touching a second tool, stop, revert cleanly, and split the seed into smaller seeds in the ledger. A reverted attempt is logged in Done as "attempted, split."

## Prioritization rubric (for ordering Candidates)
P1: data loss, security, broken core function, export corruption.
P2: silently wrong output (misplaced marks, wrong answers, print artifacts that mislead), undo holes, accessibility blockers.
P3: performance, dead UI, confusing copy, consistency divergences, paper-cuts.
P4: polish.
Tie-breakers, in order: (1) affects teachers' saved work, (2) affects the printed/exported artifact a student receives, (3) dual-audience (Hebrew **and** secular use) beats single-audience, (4) untouched in the last 2 sessions (variety), (5) smallest diff.

## Hard rules (from CLAUDE.md — non-negotiable)
- `ivritSafeParse`/`ivritSafeAssign` for all untrusted JSON; `esc()` for all user-input rendering; CSP meta tags untouched unless the change requires and documents a new directive; SRI on any external script.
- Single-file HTML conventions preserved; no build step introduced.
- Isolated commits per concern, committed directly to `main`.
- `sw.js` `VERSION` (check current value at L2) bumped **once per session**, in the final commit, whenever any precached file changed; confirm the Pages deploy run concludes `success`.
- Never edit `data/` corpus files as part of an improvement iteration — data fixes are their own project.

## Session close-out (always, even on early stop)
1. Ledger updated: Done entries complete; Candidates and Feature seeds re-prioritized; Pattern health, Tool coverage, Pass rotation, and Per-session metrics lines updated; Done overflow archived.
2. SW bump + deploy verification.
3. Print a summary: iterations completed, pass run, patterns swept (hits/clean), micro-feature shipped or split, top 3 remaining candidates + top feature seed, and anything a human must do.

## First-session bootstrap (only if `docs/IMPROVEMENT_LOG.md` is absent)
Create the ledger with the full v2 structure, then spend the whole session on discovery: run sweep A in full plus pass B, populate Candidates (expect 10–25 items), fix ONLY any P1s discovered, and close out. Fixing begins in earnest next session against a real backlog.
