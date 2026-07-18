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

## Authority split — this skill vs the ledger

This skill is the authority on **protocol** (how a session runs). The live ledger
`docs/IMPROVEMENT_LOG.md` is the authority on **state**: session numbers, pass-rotation membership and
dates, which sweep patterns are ACTIVE vs retired, section names and structure, candidate priorities,
and struck seeds. The loop has run ~90 sessions and its state has evolved past any snapshot this skill
could carry — so where a list or template below disagrees with the live ledger, **the ledger wins**.
(Example of why: the rotation gained a Pass K and the pattern-retirement rule gained a carve-out after
the original protocol was written; a session trusting a stale snapshot would have scheduled the wrong
pass and retired security sweeps.) If the ledger records a ratified *protocol* convention this skill
contradicts, follow the ledger and flag the divergence in your close-out summary so the maintainer can
update this skill. Never "normalize" the ledger back to this skill's templates.

## Session start (in order, before selecting anything)

1. **Read `CLAUDE.md`** — it is the constitution; every binding rule there (security patterns, i18n,
   preset wiring, AllTools registration, sw.js versioning, deploy) applies to every iteration.
2. **Read the ledger — with the long-line method.** The ledger's lines are extremely long; a raw
   `Read` of the whole file blows context. Map it first (`grep -n '^## \|^### ' docs/IMPROVEMENT_LOG.md`),
   then read sections via `sed -n 'A,Bp' docs/IMPROVEMENT_LOG.md | cut -c1-400`, widening the cut only
   for lines you act on (Candidates you select, the rotation table, the last close-out entry).
3. **Number this session.** Sessions are numbered S1, S2, … The ledger's trailing
   `**Next session (SN):**` pointer names yours — take that N and tag everything you write (Done
   entries, the per-session metrics line, rotation notes) with it. That pointer is also the
   authoritative tie-break when two passes look equally stale.
4. **Outside-loop drift check.** The maintainer ships work between sessions. Compare against the last
   `(SN close-out)` Done entry: `origin/main`'s position (new merges/PRs?), `sw.js` `VERSION`, and
   `FONT_MAKER_VERSION`. If anything landed outside the loop, note what and the version moves
   (vNNN→vNNN, FM x.y→x.y) — recent outside-loop surface is prime discovery-pass territory, and sweep
   passes should cover it. Never trust the previous close-out's version note without checking.
5. **Branch & PR protocol.** Loop sessions run on a `claude/*` branch feeding a **draft PR** — never
   push directly to `main` unless the maintainer explicitly authorizes it in-session (there is one
   ledgered precedent, S78). If the previous loop branch's draft PR is still **open and unmerged**,
   continue on that branch and PR (no branch restart, no new PR); if it **merged**, cut a fresh branch
   off latest `origin/main` and open a new draft PR at close-out. For loop sessions this supersedes
   CLAUDE.md's "commit directly to main" Git rule — the ratified practice since S76 (see the ledger's
   branch/deploy close-out notes); consequence: GitHub Pages deploys only on merge to `main`, so
   deploy `success` is verified **after merge**, not in-session.
6. Then enter the iteration protocol below — its first act is the stalest discovery pass.

## Session parameters
- **Budget:** up to **5 iterations** per session — small enough that every change stays individually
  verified and the ledger stays current. Stop earlier if verification debt accumulates: a step-4 check
  you could not actually run (an export not producible headless, a check deferred "for later"). At most
  one such unverified aspect may be outstanding — resolve it or revert that commit before the next
  iteration; if a second would accumulate, end the session. Never leave the repo mid-change at session
  end.
- **Ledger:** `docs/IMPROVEMENT_LOG.md` is the loop's memory. Read it FIRST every session (see the
  reading method above). If a v2 section (Metrics, Feature seeds, pass rotation) is genuinely missing
  — no equivalently-purposed section under any name — add it in this session's first commit; never add
  a duplicate of a section that exists under a different heading.
- **Scope guard:** one concern per iteration, one commit per iteration. If a fix reveals a second
  problem, log it as a candidate — do not chase it now.
- **Variety governor (hard rules):** the caps exist so one hot spot can't eat a whole session while
  the rest of the suite goes stale.
  - Max **2 iterations per session** on the same recurring-pattern class.
  - Max **2 iterations per session** touching the same tool (index.html counts as a tool).
  - If the top candidate violates a cap, take the highest-priority candidate that doesn't. Priority
    still wins across sessions — the cap only reorders within a session.
  - Prefer, as a tie-breaker, tools and pattern classes untouched in the last 2 sessions (check the
    Metrics section).

## Ledger structure (bootstrap template — the live ledger's own structure wins)

Use this template ONLY when creating a missing ledger or section. An existing ledger's section names,
ordering, and extra sections (e.g. `## Recurring-pattern sweep status` with its `### Discovery-pass
rotation` table nested under it, the trailing `**Next session (SN):**` pointer) are authoritative —
match them, don't restructure them.

```
# IvritSuite Improvement Log

## Candidates (prioritized, top = next)
- [ ] P1 | <file> | <one-line description> | <found: date, how>

## Feature seeds (micro-features only; see Micro-feature track)
- [ ] S | <tool> | <one-line description> | <est. size S/M> | <found: date, how>

## In progress

## Done (last 5 sessions only — older entries move to docs/IMPROVEMENT_ARCHIVE.md)
- [x] <date> | <commit> | <file> | <description> | <verified how>
- [x] <date> | (SN close-out) | branch/deploy note | <branch/PR state; drift-check result;
      SW vNNN→vNNN + which precached files changed; FM bump-or-not with reason; i18n/sitemap runs>

## Metrics
### Per-session log (one line per session)
- <date> | SN | iters: N | tools touched: … | patterns fixed: … | pass run: <letter> | SW: vNNN→vNNN
### Tool coverage (last-touched date per tool)
- generator | dashboard | flash-cards | dictionary | torah-trainer | trope-tutor | font-maker | index/chrome
### Pattern health (per recurring pattern: last swept, hits found that sweep, consecutive clean sweeps)
- <pattern>: swept <date>, hits: N, clean streak: N — ACTIVE|retired
### Retired patterns
- <pattern> | retired <date> | reason

## Recurring-pattern sweep status
- <pattern>: <last sweep's date, surface covered, and detection method / result detail>

### Discovery-pass rotation (run one per session, stalest first)
- <letter> <name>: <date> (<SN>: <one-line result>)

**Next session (SN+1):** <what this session ran and what looks stalest next>
```

**Ledger hygiene:** at close-out, if Done exceeds 5 sessions of entries, move the overflow to
`docs/IMPROVEMENT_ARCHIVE.md` (append-only, same format). The working ledger must stay small enough to
read cheaply every session.

## Iteration protocol (repeat up to budget)
1. **Discover, then select.** Run the single stalest discovery pass FIRST (per the ledger's rotation
   table; the `**Next session**` pointer resolves ties), logging everything found as Candidates /
   Feature seeds before fixing anything. The pass consumes **1 iteration** — a full session is
   `1 pass + 4 fixes = 5`, and the per-session Metrics line records it that way. The pass charges the
   iteration budget but NOT the variety governor's per-tool/per-pattern caps — fixing what the pass
   just found in its own tool is the point. Skip the pass only on explicit user direction, recording
   `pass run: — (skipped; <X> stays stalest)`. Then select the top candidate from the ledger that
   satisfies the variety governor.
2. **Ground:** open the file, grep the exact anchors, read the surrounding conventions (strict
   single-file HTML; match local style exactly). Line numbers in ledger entries drift — locate by
   pattern, not by remembered line.
3. **Fix minimally.** Smallest diff that resolves the issue. No drive-by cleanups, no reformatting
   neighboring code.
4. **Verify** per the CLAUDE.md Playwright recipe (light + dark, desktop + ~800 px) plus an
   issue-specific check you design before coding — **but serve the repo over local HTTP**
   (e.g. `python3 -m http.server 8080` from the repo root) and point Playwright at
   `http://localhost:8080/...`, not `file://`: every page loads `/js/i18n.js` root-absolute, so
   `file://` leaves `I18n` undefined and render paths throw (ledgered at S85; all recent passes run
   over local HTTP). Extend the recipe's route-abort predicate to allow your localhost origin; the
   rest of the recipe (abort external origins, `pageerror==0`, modal dismissal, the light/dark ×
   desktop/800px matrix) applies unchanged. Anything touching save data: `.ivrit` round-trip. Anything
   touching export paths (fonts, share links, CSVs, printables): produce the artifact and inspect it.
5. **Commit** with a message naming the pattern if it's a recurring one.
6. **Log:** move the item to Done with date, commit hash, and verification method; update Pattern
   health if a sweep-class fix.

**When a fix fails:** if verification fails and the correct fix isn't small, or the diff balloons past
the one-concern scope — revert cleanly, re-log the candidate with what you learned (often a priority or
size correction), and record it in Done as "attempted, reverted". A clean revert plus better
intelligence is a successful iteration; a half-verified change left in the tree is not.

## Discovery passes (STRICT rotation — always run the stalest per the ledger's rotation table; record it)
Run exactly one per session, as the session's first act. The pass letters below are the protocol
definitions; the **ledger's rotation table is the authoritative member list** — if it tracks a pass
this skill doesn't define (added after this writing), run it the way its ledger entries describe.

**A. Recurring-pattern sweep** — sweep the patterns marked **ACTIVE in the ledger's Pattern health
section** (not a fixed list — patterns get registered and retired over time; the founding registry
included falsy-zero numerics, Font-Maker undo/slider wiring, workMode reachability,
localStorage-vs-AllTools, unescaped-input/unsafe-parse, JSON-LD parity, and destructive-bulk, several
of which are now retired). Each pattern's ledger lines (Pattern health, the Recurring-pattern sweep
status log, Retired patterns) carry its detection definition — the tuned greps, the exemption list,
what counts as a hit. Sweep by that definition; don't re-derive a weaker one. Focus each sweep on surface changed since that pattern's last sweep —
including outside-loop landings found in the drift check. When a fix reveals a NEW recurring shape,
register it as a pattern with its own health line. After the sweep, update Pattern health.
**Retirement:** a pattern retires after 3 consecutive clean sweeps **unless it is
consequence-critical** (security or data-loss — e.g. unescaped-input, backup completeness,
destructive-bulk): those stay ACTIVE regardless of streak, because new code can reintroduce them any
time and they re-sweep cheaply. Retired patterns are re-checked only in pass A2.

**A2. Retired-pattern spot check (counts as pass A when A is stalest and all patterns are retired, or every 6th A):** one quick sweep of retired patterns to confirm they stayed dead; any hit un-retires the pattern.

**B. Console & error audit** — load every page headless, capture console errors/warnings and failed requests on load and one basic interaction per tool.

**C. Accessibility pass (one tool per session)** — keyboard-only walkthrough: focus order, focus visibility, Escape/Enter on modals, `aria-` on interactive SVG/canvas, `prefers-reduced-motion`, contrast in both themes. These tools are projected and used by young students and teachers on school-managed devices — touch targets and keyboard parity are not optional.

**D. Performance snapshot (one tool per session)** — cold load + one heavy interaction; log main-thread blocks >200 ms with profile evidence.

**E. Freshness & site health** — sitemap `lastmod` vs git history (`node scripts/update-sitemap.mjs`), broken internal links, SW precache list vs actual files, THIRD_PARTY_LICENSES.md vs deps, README/CLAUDE.md accuracy.

**F. Cross-tool consistency** — one UX affordance per session (empty states, share-link buttons, dark-mode toggles, Hebrew font pickers, error toasts) compared across **all seven tools** (generator, dashboard, flash cards, dictionary, torah trainer, trope tutor, font maker — plus the chrome pages where the affordance exists there); converge on the best existing implementation.

**G. Print & export fidelity (one tool per session)** — the printed page is the product a student actually holds. Print-preview (and print-to-PDF) every printable/exportable surface in one tool: margins, page breaks mid-item, nikkud clipping at print resolution, dark-mode ink bleed (nothing should print with dark backgrounds), header/footer junk, RTL alignment on paper. Compare on Letter and A4 page sizes. Log divergences as candidates (usually P2 — silently wrong artifact).

**H. Teacher walkthrough / paper-cuts (one tool per session)** — role-play a teacher preparing an actual lesson end-to-end in one tool (e.g., "make Tuesday's aleph-bet worksheet and a matching flashcard deck"). Note every friction point: extra clicks, missing defaults, unclear copy, dead-end states, things that require re-entering data another tool already has. Small frictions become Candidates (P3); missing small affordances become **Feature seeds**. This is the primary intake for the micro-feature track. Before logging new seeds, check the ledger's struck-seeds note — never re-log a seed the maintainer has explicitly struck.

**I. First-load & empty-state pass** — visit every tool as a brand-new user (a fresh browser context: empty localStorage AND IndexedDB): is the empty state instructive, does anything crash on absent keys, do sample/demo data paths work, does onboarding copy match current UI? New-teacher experience is invisible to you (your localStorage is always full) unless deliberately audited.

**J. Metrics-informed pass (only if the impact-metrics dashboard/Worker is live)** — pull usage data: which tools/features see real traffic, where do sessions end abruptly, which pages 404. Reprioritize Candidates and Feature seeds against actual usage; log anomalies (a heavily-used tool with zero export events suggests a broken or undiscoverable export). If metrics aren't live yet, skip in rotation and note it.

**K. i18n / localization audit** — run `node scripts/check-i18n.js`: Check A (hardcoded English) is a
hard gate and must stay clean; Check B's untranslated-attribute backlog is the burndown list — fix a
slice, preferring sites where CSV keys already exist (`node scripts/build-locales.js` only when adding
keys). Then probe Check A's documented blind spot: English UI strings built inside JS **template
literals** or passed as plain function arguments escape the gate — grep for them in recently-changed
surface and localize what's user-visible. Respect the translate-vs-content scope boundary in
CLAUDE.md's Internationalization section (printed output, `headerLang` content, and tab titles stay
untranslated by design).

## Micro-feature track
Small user-visible enhancements are in scope, under tight fencing:

- **Source:** only from the **Feature seeds** ledger section (populated mainly by pass H, or by explicit human request noted in the ledger). Never invent a feature mid-session.
- **Definition of "micro":** one tool — sole exception: a cross-tool **handshake seed** (emit in one
  tool, consume in the other, like the shipped S72 `?wl=` deep-link) may touch exactly its declared
  tool pair — ≤ ~150 lines of combined diff, no new dependencies, no build step, no `data/` edits.
  New localStorage keys must be reconciled per CLAUDE.md's localStorage flag guidance **in the same
  commit**: real cross-machine data registers in all three AllTools functions + the owning tool's
  `.ivrit` payload; one-time UI flags (`*_seen`/`*_dismissed`) go in `eraseAllSettings` only. Fits
  existing single-file HTML conventions and both themes.
- **Budget:** max **1 micro-feature per session**, and it costs **2 iterations** of the 5-iteration
  budget — its stricter verification is roughly a second iteration of work. Against the variety
  governor's per-tool cap it charges 1 iteration to each tool it touches. Skip it entirely in any
  session where a P1 exists.
- **Selection:** prefer seeds that serve both the Hebrew tools and secular uses (number practice, timers, student picker, English font support) — dual-audience seeds outrank single-audience at equal size.
- **Verification is stricter:** everything in step 4 of the protocol, plus a fresh-profile check (pass-I style: fresh browser context, empty localStorage AND IndexedDB) and a `.ivrit` round-trip if any state was added.
- **Abort rule:** if the diff is trending past ~150 lines or touching any tool outside the seed's declared scope, stop, revert cleanly, and split the seed into smaller seeds in the ledger. A reverted attempt is logged in Done as "attempted, split."

## Prioritization rubric (for ordering Candidates)
P1: data loss, security, broken core function, export corruption.
P2: silently wrong output (misplaced marks, wrong answers, print artifacts that mislead), undo holes, accessibility blockers.
P3: performance, dead UI, confusing copy, consistency divergences, paper-cuts.
P4: polish.
Tie-breakers, in order: (1) affects teachers' saved work, (2) affects the printed/exported artifact a student receives, (3) dual-audience (Hebrew **and** secular use) beats single-audience, (4) untouched in the last 2 sessions (variety), (5) smallest diff.

## Hard rules (non-negotiable; CLAUDE.md is the full text — these are the ones loop sessions hit most)
- `ivritSafeParse`/`ivritSafeAssign` for all untrusted JSON; `esc()` for all user-input rendering; any
  new external resource requires updating that page's CSP meta tag — and only then: never loosen or
  edit a page's CSP otherwise, and note the added directive in the commit message. (Plus SRI on any
  **new** external script — a loop-local rule stricter than CLAUDE.md; don't retrofit existing CDN
  loads as a drive-by.)
- Single-file HTML conventions preserved; no build step introduced.
- Every new/changed user-facing UI string routes through `I18n.t()`/`data-i18n*` (+ CSV key +
  `node scripts/build-locales.js`); new CSS uses logical properties; `node scripts/check-i18n.js` must
  report no NEW violations before the session ends.
- Any new control in a preset-bearing tool is wired into `getSettings()`/`applySettings()` (restores
  use `??`, never `||`, for numeric/boolean fields — the falsy-zero rule).
- A Font Maker **feature** requires one combined `FONT_MAKER_VERSION` bump + About-tab changelog entry
  per release (not per sub-feature; pure fixes/token swaps don't bump — the ledger's close-outs show
  the call being made each session).
- Isolated commits per concern, on the session's `claude/*` branch per the Branch & PR protocol above.
- `sw.js` `VERSION` (the `const VERSION = 'vNNN'` at the top — locate by pattern) bumped **once per
  session**, in the final commit, whenever any precached file changed. Deploy runs on merge to `main`;
  the close-out notes that deploy `success` is verified after merge.
- Never edit `data/` corpus files as part of an improvement iteration — data fixes are their own project.

## Session close-out (always, even on early stop)
1. **Ledger updated:** Done entries complete; Candidates and Feature seeds re-prioritized; Pattern
   health, Tool coverage, the rotation table, and the Per-session metrics line (with SN) updated; Done
   overflow archived. Write the `(SN close-out) | branch/deploy note` Done entry: branch/PR state,
   drift-check result, `sw.js` vNNN→vNNN + which precached files changed, the FONT_MAKER_VERSION
   bump-or-not call with reason, and which repo scripts ran. Update the trailing
   `**Next session (SN+1):**` pointer with what ran and what looks stalest next.
2. **Repo definition-of-done:** `node scripts/check-i18n.js` clean (no NEW violations);
   `node scripts/build-locales.js` if any CSV keys were added; `sw.js` VERSION bumped once in the
   final commit if any precached file changed; `node scripts/update-sitemap.mjs` as the **last** step
   if page content changed.
3. **Push** the session branch; ensure the draft PR exists/updated. Note that deploy verification
   (Pages run `success`) happens after the maintainer merges.
4. **Print a summary:** iterations completed, pass run, patterns swept (hits/clean), micro-feature
   shipped or split, top 3 remaining candidates + top feature seed, any protocol divergence flagged
   for this skill, and anything a human must do (starting with: merge the PR, then verify the deploy).
5. **End with a plain-language recap.** Every loop run must finish with a short **"In simple terms, what
   did this loop session do?"** section — the very last thing printed, after the technical summary above.
   Write it in jargon-free language a non-technical teacher would understand (no pass letters, ledger
   terms, commit hashes, or version numbers): what visibly changed for people using the site, what was
   checked and found fine, and what the human needs to do next.

## First-session bootstrap (only if `docs/IMPROVEMENT_LOG.md` is absent)
Create the ledger with the full v2 structure, then spend the whole session on discovery: run sweep A in full plus pass B, populate Candidates (expect 10–25 items), fix ONLY any P1s discovered, and close out. Fixing begins in earnest next session against a real backlog.
