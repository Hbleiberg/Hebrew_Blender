---
name: improveloop
description: >-
  Run one bounded, ledger-driven continuous-improvement session on the IvritSuite / Hebrew Blender
  codebase using the v2 improvement-loop protocol — read docs/IMPROVEMENT_LOG.md first, select the top
  candidate under the variety governor, run the single stalest rotating discovery pass (A–N, incl.
  the SEO & discoverability audit, the aesthetics/beautification pass and the mobile & touch-device
  pass), make small single-concern verified fixes (up to a 5-iteration budget, one commit each),
  optionally ship one micro-feature, pause at decision gates to ask the maintainer, then update
  the ledger, bump sw.js VERSION once, print a close-out summary, and compact the session context.
  Use this whenever the user invokes
  /improveloop, or asks to run, continue, resume, or "rerun" the improvement loop / an improvement
  session / iteration / pass, run a discovery / SEO / recurring-pattern / aesthetics-or-design /
  mobile-or-touch sweep, or hunt-and-fix small verified issues across the suite — even loosely
  phrased ("run the loop", "do an improvement pass", "beautify the site a bit", "check how it looks
  on a phone", "improveloop").
---

# IvritSuite — Continuous Improvement Loop (v2)

You are running a bounded improvement loop on the IvritSuite codebase. This skill is reusable: every
session follows the same protocol and persists its state, so any future session can resume without any
prior session's context. The loop's value is many small, verified, isolated wins — not a grand
refactor. v2 adds a variety governor, health metrics, and a narrow micro-feature track; two
maintainer-requested additions (2026-08-19) are the aesthetics pass (M — slow beautification, with
decision gate 3 and its screenshot rule) and mandatory end-of-session context compaction
(close-out step 6). A third (2026-08-22) is the mobile & touch-device pass (N — one surface per
session on real device emulation, with decision gate 4 and a screenshot rule stricter than M's:
a phone contact sheet ships even when the run finds nothing).

## Authority split — this skill vs the ledger

This skill is the authority on **protocol** (how a session runs). The live ledger
`docs/IMPROVEMENT_LOG.md` is the authority on **state**: session numbers, pass-rotation membership and
dates, which sweep patterns are ACTIVE vs retired, section names and structure, candidate priorities,
and struck seeds. The loop has run ~140 sessions and its state has evolved past any snapshot this skill
could carry — so where a list or template below disagrees with the live ledger, **the ledger wins**.
(Example of why: the rotation gained a Pass K and the pattern-retirement rule gained a carve-out after
the original protocol was written; a session trusting a stale snapshot would have scheduled the wrong
pass and retired security sweeps.) If the ledger records a ratified *protocol* convention this skill
contradicts, follow the ledger and flag the divergence in your close-out summary so the maintainer can
update this skill. Never "normalize" the ledger back to this skill's templates. **One additive
exception:** a discovery pass this skill defines that the ledger's rotation table lacks — with no
ledgered removal, retirement, or SKIP note for it anywhere — is ledger *lag*, not ledger
disagreement; registering a never-run row for it (per the rotation bootstrap rule in the Discovery
passes preamble) is required and is not "normalizing". A ledgered removal or SKIP note still wins.

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
  - Max **2 iterations per session** touching the same tool — and **each chrome page counts as its
    own tool** (index, resources, contact, privacy, terms, 404), not one shared "chrome" bucket.
  - If the top candidate violates a cap, take the highest-priority candidate that doesn't. Priority
    still wins across sessions — the cap only reorders within a session.
  - Prefer, as a tie-breaker, tools and pattern classes untouched in the last 2 sessions (check the
    Metrics section).

## Decision gates — ask the maintainer

Small verified fixes stay autonomous — that's the loop's whole value. But the decisions below are
the maintainer's, not the loop's: at each gate, stop and ask via the **AskUserQuestion tool**
(concise options, mark a recommended default) before acting. Read this section before iteration 1
— the discovery pass itself can trip gate 2.

- **Gate 1 — micro-feature selection.** Before building any Feature seed: ask which seed to build,
  or whether to skip the micro-feature this session.
- **Gate 2 — user-visible copy & SEO-facing text.** Before changing user-facing wording or default
  behavior beyond a small fix (renaming a button is gated; fixing its typo is not), and before ANY
  change to page titles, meta descriptions, OG copy, or JSON-LD claims — the site's public face.
- **Gate 3 — dramatic aesthetic changes.** The aesthetics track (pass M) beautifies the site
  slowly; small visual refinements (a spacing/alignment fix, a stray radius/shadow/border
  inconsistency, converging one control on the suite's best existing look) stay autonomous. But any
  visual change a returning teacher would immediately notice — a palette or font change, layout
  restructuring, a component redesign, whole-page re-theming — is proposed, never shipped unasked:
  capture the current state (screenshots, per pass M's screenshot rule), describe what would change
  and why, then ask. Applies to ANY iteration that would dramatically change the site's look,
  whichever pass surfaced it.
- **Gate 4 — mobile restructuring & desktop-affecting mobile fixes.** The mobile track (pass N)
  fixes phones the way M beautifies: a change scoped *inside* a phone-width media query — a wrap, a
  stacked row, a bigger tap box, an `inputmode`, a safe-area pad — stays autonomous. Ask before:
  (a) anything that changes what **desktop** users see in service of phones; (b) restructuring,
  reordering, or **hiding** content at phone widths — what a teacher can reach on a phone is an
  information-architecture call, not a CSS one; (c) a new touch-only interaction (swipe,
  long-press, pull-to-refresh) or a phone-specific warning/blocking screen, incl. declaring any
  surface desktop-only (the Font Maker's `hebrewFontMaker_mobileWarnDismissed` notice is the one
  existing precedent — it is not a licence to add more); (d) a page-wide unit or breakpoint
  migration (`100vh` → `dvh` across a page, retuning a shared breakpoint). Propose with the
  current-state phone screenshots, state what changes on phone AND on desktop, then ask. Applies to
  ANY iteration that would do one of those, whichever pass surfaced it.

**Batching:** collect gate questions at natural points — the post-discovery-pass selection moment,
then iteration boundaries — up to 4 questions per AskUserQuestion call. Never gate small mechanical
fixes; a session with no gated work asks nothing.

**Unattended fallback (skip & defer):** if no answer can arrive (a scheduled or otherwise
unattended run), take the conservative default — gate 1: skip the micro-feature this session;
gate 2: leave the copy unchanged and log the proposed change as a Candidate; gate 3: don't ship
the dramatic change — log the written proposal as a Candidate (note the current-state screenshots'
paths in the entry); gate 4: same — don't ship, log the proposal as a Candidate with its phone
screenshots' paths (the pass's own measure-and-log arms still run in full) — and record each
under **"Decisions deferred to maintainer"** in the `(SN close-out)` Done entry and the close-out
summary, so the next attended session can ask. A gate must degrade gracefully; it never stalls or
errors the session.

Gates complement, never replace, the existing explicit-direction rules (pass skip, direct-to-main
authorization).

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

   **Run a firing control before trusting any zero (S294/S295).** A measurement of "nothing happened"
   is worthless until you have shown the same probe reporting something when something *does* happen.
   Two hard-won specifics: (a) **drive a longtask control with a real `page.click`** — a busy loop
   inside `page.evaluate` produces no longtask entry at all, and S294 lost a whole round of zeros to
   that; (b) **a silent control means DIAGNOSE the silence, not abandon the arm.** It has two causes
   and only one condemns the arm: a *bad control* (S295's control string used a namespace outside the
   detector's own prefix list, so nothing could ever match it — the arm was fine and its 26-load zero
   stood) versus a *blind detector* (S295's dictionary probe used selectors the markup does not have —
   that one was correctly discarded). Taken literally without this distinction, the rule throws away
   good arms.
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
**When you re-derive a pass's per-tool history ("which tool is stalest for D?"), grep
`docs/IMPROVEMENT_ARCHIVE.md` as well** — each rotation row keeps only a short recent window, so the
table alone will hand you a target that was audited 40 sessions ago (S292).
**Rotation bootstrap (the inverse):** if this skill defines a pass the table lacks, and the ledger
nowhere records its removal or a SKIP note for it, add a row
`- <letter> <name>: never run — registered <date> (skill update)` at session start, before picking
the stalest pass. Never-run rows are stalest (an explicit per-row SKIP note, like J's, still
excludes a pass from being picked). This is additive registration, not "normalizing" — see the
Authority split section.

**A. Recurring-pattern sweep** — sweep the patterns marked **ACTIVE in the ledger's Pattern health
section** (not a fixed list — patterns get registered and retired over time; the founding registry
included falsy-zero numerics, Font-Maker undo/slider wiring, workMode reachability,
localStorage-vs-AllTools, unescaped-input/unsafe-parse, JSON-LD parity (now owned by pass L), and
destructive-bulk, several of which are now retired). Each pattern's ledger lines (Pattern health, the Recurring-pattern sweep
status log, Retired patterns) carry its detection definition — the tuned greps, the exemption list,
what counts as a hit. Sweep by that definition; don't re-derive a weaker one. Focus each sweep on surface changed since that pattern's last sweep —
including outside-loop landings found in the drift check. When a fix reveals a NEW recurring shape,
register it as a pattern with its own health line. After the sweep, update Pattern health.
**Retirement:** a pattern retires after 3 consecutive clean sweeps **unless it is
consequence-critical** (security or data-loss — e.g. unescaped-input, backup completeness,
destructive-bulk): those stay ACTIVE regardless of streak, because new code can reintroduce them any
time and they re-sweep cheaply. Retired patterns are re-checked only in pass A2.

**A2. Retired-pattern spot check (counts as pass A when A is stalest and all patterns are retired, or every 6th A):** one quick sweep of retired patterns to confirm they stayed dead; any hit un-retires the pattern. (A retired pattern subsumed by a dedicated pass — currently JSON-LD parity → pass L — is checked there instead **once that pass has its first ledgered run**; until then A2 keeps it, so coverage never goes ownerless.)

**B. Console & error audit** — load every page headless, capture console errors/warnings and failed requests on load and one basic interaction per tool.

**C. Accessibility pass (one tool per session)** — keyboard-only walkthrough: focus order, focus visibility, Escape/Enter on modals, `aria-` on interactive SVG/canvas, `prefers-reduced-motion`, contrast in both themes. These tools are projected and used by young students and teachers on school-managed devices — touch targets and keyboard parity are not optional.

**D. Performance snapshot (one tool per session)** — cold load + one heavy interaction; log main-thread blocks >200 ms with profile evidence.

**E. Freshness & site health** — sitemap `lastmod` vs git history (`node scripts/update-sitemap.mjs`), broken internal links, SW precache list vs actual files, THIRD_PARTY_LICENSES.md vs deps, README/CLAUDE.md accuracy. **Boundary with pass L:** E owns *mechanical freshness/integrity* (lastmod-vs-git, precache both directions, licenses, broken links, robots/CNAME present-and-parses); L owns *indexability semantics* (canonical/OG/JSON-LD/title-description correctness, robots intent, sitemap↔canonical agreement). E's older ledgered runs also covered robots/sitemap coverage — after L's first run, record the handoff in both rotation rows.

**F. Cross-tool consistency** — one UX affordance per session (empty states, share-link buttons, dark-mode toggles, Hebrew font pickers, error toasts) compared across **all seven tools** (generator, dashboard, flash cards, dictionary, torah trainer, trope tutor, font maker — plus the chrome pages where the affordance exists there); converge on the best existing implementation.

**G. Print & export fidelity (one tool per session)** — the printed page is the product a student actually holds, **and so is a compiled font binary**: G's artifacts are paper *and* every exported file (the Font Maker's `.ttf`/`.otf`/UFO output, `.ivrit` saves, PDFs, CSVs, share links). Inspect the artifact itself — an FM font export went unaudited for 124 sessions because this text read as paper-only (S293). Print-preview (and print-to-PDF) every printable/exportable surface in one tool: margins, page breaks mid-item, nikkud clipping at print resolution, dark-mode ink bleed (nothing should print with dark backgrounds), header/footer junk, RTL alignment on paper. Compare on Letter and A4 page sizes. Log divergences as candidates (usually P2 — silently wrong artifact).

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

**L. SEO & discoverability audit** — audit the **static HTML source**, not the rendered DOM
(crawlers index the statically-served source; nothing writes `document.title` — see CLAUDE.md's
i18n scope boundary): grep/parse the raw HTML, and JSON-parse every extracted
`application/ld+json` block via a small node script; go headless only for the crawl-graph and
og:image-existence checks. Fully offline — never call external validator services. Checks:
- Per-page unique `<title>` + `<meta name="description">`: length sanity (title ~50–60 chars,
  description ~150–160), no cross-page duplicates.
- `rel=canonical` = `https://ivritsuite.com/<page>.html` — **except the homepage, whose canonical
  is the bare root `https://ivritsuite.com/`**. `404.html` (`noindex, follow`) and
  `i18n-test.html` (`noindex`) are **deliberately excluded** from the indexable set (= the 11
  sitemap pages) — never "fix" them into it.
- OG/Twitter tag parity with title/description/canonical; `og:image` resolves to a real file
  (strip the `?v=` query string before checking).
- Every JSON-LD block parses, and its FAQ/HowTo/ItemList claims match the visible UI. **This
  subsumes the retired JSON-LD-parity pattern** — on this pass's first run, amend the ledger's
  Retired-patterns line for it (re-checks move from A2 to here).
- sitemap.xml covers exactly the indexable set, sitemap↔canonical agreement, robots.txt intent
  (mechanical robots/CNAME/lastmod checks stay pass E — see the E/L boundary there).
- Crawl-graph: every indexable page reachable from the homepage via plain static `<a href>` links.
- One `h1` per page; alt text on content images (crawler-facing view only — deep a11y stays pass C).

Guardrails: browser-tab titles and meta descriptions stay **English** (a documented decision —
never "localize" them); **never** propose clean-URL/subfolder restructuring (evaluated and
rejected — see CLAUDE.md's Deploy section); no keyword stuffing — JSON-LD must match visible
content; any `<head>` edit is a precached-file edit → `sw.js` VERSION bump per the existing
once-per-session rule. **Copy fixes to titles, descriptions, or JSON-LD claims are gate-2
decisions** — the pass logs candidates and batches the questions; it never auto-rewrites SEO
copy. Expect the first run to be mostly measure-and-log.

**M. Aesthetics & visual-design pass (one surface per session)** — the slow-beautification track:
the site should get gradually more refined without ever changing abruptly under a teacher's feet.
Pick the least-recently-audited surface (the 7 tools plus the chrome pages — index, resources,
contact, privacy/terms, 404; the rotation row's result notes track which surfaces are covered).
Load it over local HTTP in the full matrix (light + dark × desktop + ~800px) and audit it like a
designer: typography (scale, hierarchy, line-height, Hebrew/English pairing), spacing rhythm
(consistent padding/gap/margin steps), alignment and grid discipline, color harmony, component
consistency (buttons, inputs, panels, radii, shadows, focus states — judged against the suite's
best existing implementation: convergence beats invention), visual hierarchy (does the eye land
where it should), and dark-mode parity (nothing that only looks right in light mode). Log findings
as Candidates — usually P4, P3 where the sloppiness impairs use; a contrast/readability failure
keeps the severity pass C would give it. (Boundary with C: C owns accessibility *semantics* —
keyboard, focus, ARIA, reduced-motion, contrast compliance; M owns visual *refinement*.) Small
refinements may then be fixed as normal iterations this session; **anything dramatic is decision
gate 3** — propose with current-state screenshots, never ship unasked; if approved but too big for
the remaining budget, log it as an `approved <date>` candidate at the top of its priority band for
the next session. **Screenshot rule (binding for every aesthetics-track change, gated or not):**
capture BEFORE screenshots ahead of the edit and AFTER screenshots once verified — light + dark at
the affected breakpoint(s) — saved under the session's scratchpad/temp dir, NEVER committed to the
repo, and delivered to the maintainer at close-out (send them as files/attachments where the
harness supports it; otherwise print their paths). New CSS obeys the hard rules like everything
else (logical properties, both themes, the once-per-session `sw.js` bump).

**N. Mobile & touch-device pass (one surface per session)** — the suite installs as a PWA, and
teachers reach for it on a phone between classes and on school-issued tablets; but every other pass
measures it on a desktop with a mouse. Pick the least-recently-audited surface
(the 7 tools plus the chrome pages — index, resources, contact, privacy/terms, 404; the rotation
row's result notes track which surfaces are covered).

**Recipe delta — a resized window is NOT a phone (binding).** CLAUDE.md's Playwright recipe applies
unchanged (serve over local HTTP, route-abort external origins, `serviceWorkers:'block'` for any
failure path, assert `pageerror === 0`, dismiss auto-open modals), plus a **real device descriptor**:
```js
const { chromium, devices } = pkg;                       // devices is on the CJS default export
const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
```
The descriptor — not the viewport size — is what flips `(pointer: coarse)` and `(hover: none)` to
true and sets `maxTouchPoints`/DPR. Measured here 2026-08-22: `devices['iPhone 13']` →
`coarse:true, hoverNone:true, dpr:3, maxTouchPoints:1`; a plain 390px-wide desktop context →
`false, false, 1, 0`. **Resizing alone silently misses every hover-only and coarse-pointer
finding.** Use `page.tap()` (requires `hasTouch`) when the question is whether *touch* works.
Descriptors present in this container: `iPhone SE` (320×568), `iPhone 13` (390×664), `Pixel 7`
(412×839), `iPhone 13 landscape` (750×342), `iPad (gen 7)` (810×1080) — 143 in total.

Arms (run what the surface has; log what you skip and why):
- **1. Reflow & overflow** at 320 / 390 / 412 portrait plus one landscape, **both themes, EN and
  HE** (Hebrew labels run longer — narrow width is where they break):
  `documentElement.scrollWidth <= documentElement.clientWidth` — **NOT `window.innerWidth`**, which on
  a device descriptor includes the scrollbar-free visual viewport and makes the comparison
  structurally blind (measured S290: the check could not fire on the very descriptors this pass
  mandates),
  nothing clipped by an `overflow:hidden` ancestor, no sticky/fixed bar covering the primary
  action, modals and drawers fitting the screen with their close control reachable.
- **2. Viewport & zoom contract** — one viewport-meta shape per page (there are **three** spellings
  across the 14 root HTML files as of 2026-08-22); never `user-scalable=no` or a `maximum-scale`
  under 5 (clean today — keep the check as the control that proves the detector can fire);
  `viewport-fit=cover` and `env(safe-area-inset-*)` present together or not at all (today only
  `flash_cards.html` has either, and it has both).
- **3. Dynamic browser chrome** — `100vh` is taller than the *visible* viewport while iOS Safari's
  URL bar is expanded, stranding whatever sits at the bottom of a full-height surface. **Headless
  cannot measure this** (no collapsing chrome: the probe above measured `visualViewport.height ===
  innerHeight`), so audit it **statically** and reason about it: 13 pages use `100vh`, none use
  `dvh`/`svh`. For the surface under audit, decide per use site whether it paints a full-height
  sheet (drawer, overlay, stage) whose bottom control a phone would hide. One use site swapped to
  `dvh` is a fix; a page-wide migration is gate 4.
- **4. Touch-only interaction parity** — walk the surface's whole interaction inventory with taps
  only: no hover-to-reveal as the only affordance, no HTML5 drag-and-drop as the only path (DnD
  does not fire on touch — the folder tree's "Move ▾" menu is the sanctioned precedent in
  CLAUDE.md), sliders draggable by finger, canvas/stage gestures usable, and the accessible-tooltip
  tap contract actually firing under `hasTouch`. As of 2026-08-22 only 3 root files carry any touch
  handler and CLAUDE.md records that no tool ships touch-gesture equivalents — so *absence* is the
  expected finding; the pass's job is to say which absences actually cost a teacher something.
- **5. On-screen-keyboard ergonomics** — `type`/`inputmode` on numeric fields (a number pad beats a
  full keyboard), `autocapitalize`/`autocorrect`/`spellcheck` on Hebrew and name fields, and whether
  the focused field stays visible once the keyboard covers the bottom ~45% (emulate by shrinking the
  context's viewport height and re-reading the focused element's rect). Give `prompt()`-driven flows
  (folder rename / new folder) a real tap-through.
- **6. Standalone / PWA reality** — installed to a home screen there is **no browser back button**:
  hunt dead ends (a modal with no ✕, a view escapable only by browser-back), plus notch/safe-area
  treatment and an orientation flip mid-session.
- **7. Phone-grade performance** — one throttled arm (4× CPU, slow network) on the surface's
  heaviest path; the `data/` corpora are multi-MB and school phones are slow. Boundary: **D** owns
  desktop profiling and anything deeper — N runs the phone arm and hands off.

**Boundaries.** **C** owns accessibility *semantics* (keyboard, focus, ARIA, reduced motion,
contrast) **and** the WCAG 2.5.8 touch-target *size* rule with its registered `sub-floor touch
target` pattern — N never re-files a size finding; it files *reachability* and *operability* ones.
**M** owns visual refinement — a phone-width finding that is purely aesthetic becomes an M
candidate. **B**/**I** own load-time gates at narrow widths (both have run 375px load arms); N
starts after load, in interaction, in the second theme and the second language. **G** owns paper.
When in doubt the pass that owns the *pattern* keeps it; N logs the finding and points at it.

**Screenshot rule (binding, and stricter than M's — this is what the pass delivers):** every run
ships a **phone contact sheet even when it finds nothing** — the audited surface captured
full-page at the portrait width(s) run, every major view/tab it has, light + dark, EN + HE — plus
BEFORE/AFTER pairs at the affected width
(and orientation, where the finding is orientation-dependent) for every fix. Saved under the
session's scratchpad/temp dir, **NEVER committed to the repo**, and delivered to the maintainer at
close-out (send them as files/attachments where the harness supports it; otherwise print their
paths). A clean run with no screenshots is not a run: "it's fine on a phone" is a claim the
maintainer has to be able to *see*.

**Fixes** this pass finds verify at the phone width(s) where they were found **in addition to** the
standard matrix (light + dark × desktop + ~800px) — a mobile fix that regresses the desktop layout
is a net loss. New CSS obeys every hard rule (logical properties, both themes, the once-per-session
`sw.js` bump), and prefers extending a page's existing phone media query over inventing a
breakpoint: the suite already carries **44 distinct `max-width` values, 37 of them under 1000px**
(re-measured 2026-08-30, S294: `grep -ho 'max-width: *[0-9]*px' *.html` over the root HTML, distinct
values — note this counts ALL `max-width` declarations, not just `@media` breakpoints, of which
there are 19 / 17), so converge, don't multiply.
**Anything dramatic is decision gate 4** — propose with the current-state phone screenshots, never
ship unasked; if approved but too big for the remaining budget, log it as an `approved <date>`
candidate at the top of its priority band for the next session.

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
- **Selection:** prefer seeds that serve both the Hebrew tools and secular uses (number practice, timers, student picker, English font support) — dual-audience seeds outrank single-audience at equal size. The final seed choice (or skipping the micro-feature) is **decision gate 1**, confirmed at the post-pass batch point; unattended default = skip this session and log the deferral.
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
   bump-or-not call with reason, which repo scripts ran, and any decisions deferred to the
   maintainer. Update the trailing
   `**Next session (SN+1):**` pointer with what ran and what looks stalest next.
2. **Repo definition-of-done:** `node scripts/check-i18n.js` clean (no NEW violations);
   `node scripts/build-locales.js` if any CSV keys were added; `sw.js` VERSION bumped once in the
   final commit if any precached file changed; `node scripts/update-sitemap.mjs` as the **last** step
   if page content changed. **And after editing the ledger — especially after archiving — run
   `node scripts/check-ledger.mjs --vs origin/main`** (added S296). It asserts the ledger still
   carries all 11 required sections and a single `**Next session**` pointer, and that archiving was
   *conservative*: content the ledger lost must have been absorbed by the archive rather than
   deleted. This is not hypothetical bookkeeping — the S295 close-out archived five Done entries
   correctly while silently destroying 993 further lines (the whole Metrics section, Pattern health
   with every pattern's detection definition, and the rotation table), and nothing caught it for a
   session. Both of the script's checks fire on that commit.
3. **Push** the session branch; ensure the draft PR exists/updated. Note that deploy verification
   (Pages run `success`) happens after the maintainer merges.
4. **Print a summary:** iterations completed, pass run, patterns swept (hits/clean), micro-feature
   shipped or split, before/after screenshots for any aesthetics-track changes (per pass M's
   screenshot rule) and the phone contact sheet + before/after pairs for any mobile-track run (per
   pass N's, which ships even on a clean run), top 3 remaining candidates + top feature seed,
   decision gates asked
   (question → answer) and any decisions deferred to the maintainer, any protocol divergence flagged
   for this skill, and anything a human must do (starting with: merge the PR, then verify the deploy).
5. **End with a plain-language recap.** Every loop run must finish with a short **"In simple terms, what
   did this loop session do?"** section — the very last thing printed, after the technical summary above.
   Write it in jargon-free language a non-technical teacher would understand (no pass letters, ledger
   terms, commit hashes, or version numbers): what visibly changed for people using the site, what was
   checked and found fine, and what the human needs to do next.
6. **Compact the context — the session's standing final act, never skipped (early stops included).**
   The loop is designed for repeated runs in one long-lived conversation, and every session restarts
   from CLAUDE.md + the ledger, never from chat memory — so once the recap is printed, this
   session's working context is disposable and must not pile up across runs. `/compact` is
   user-initiated: no current harness lets the model execute built-in slash commands itself
   (verified against the Claude Code docs, 2026-08), so the recap's "what to do next" list must END
   with the instruction to run **`/compact` now, before the next loop session**, plus a one-line
   reassurance that this is safe because the loop keeps all its state in the ledger, not the chat.
   In a harness that compacts/summarizes context automatically with no `/compact` command (e.g. the
   remote web environment), state that auto-compaction covers it instead of asking; if a future
   harness ever exposes a model-invocable compaction mechanism, invoke it after the recap instead
   of asking.

## First-session bootstrap (only if `docs/IMPROVEMENT_LOG.md` is absent)
Create the ledger with the full v2 structure, then spend the whole session on discovery: run sweep A in full plus pass B, populate Candidates (expect 10–25 items), fix ONLY any P1s discovered, and close out. Fixing begins in earnest next session against a real backlog.
