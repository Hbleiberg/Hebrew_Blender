---
name: improveloop
description: >-
  Run one bounded, ledger-driven continuous-improvement session on the IvritSuite / Hebrew Blender
  codebase: read the ledger, run the stalest discovery pass (A–P), ship up to four small verified
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
ledger, the ledger wins — except that a pass this skill defines and the rotation table lacks (with no
ledgered removal or SKIP note) is registered as a never-run row, not ignored. If the ledger records a
ratified protocol convention this skill contradicts, follow the ledger and flag it in the close-out.

## Session start (in order)
1. **Read `CLAUDE.md`**, then the `docs/reference/<topic>.md` for each area you touch (its index maps
   topics to files). Every binding rule there applies to every iteration.
2. **Read the ledger — bounded.** `grep -n '^## \|^### ' docs/IMPROVEMENT_LOG.md` to map it, then read
   only: the `**Next session (SN):**` handoff (the pointer and the `⚑`/`/!\` notes under it), the top
   ~15 Candidates, `### Discovery-pass rotation`, `### Pattern health`, the last `(SN close-out)` Done
   entry, and the last 5 per-session lines. Lines carry `…[full text: IMPROVEMENT_ARCHIVE.md]` when
   they were cut — grep the archive for the full entry only for items you act on. Before auditing a
   file, `grep docs/reference/loop-findings.md` for it: measurements and refutations already made
   live there so no session re-derives them or re-files a refuted "defect".
3. **Number this session** from the pointer's `SN`; tag everything you write with it. The pointer is
   the tie-break when two passes look equally stale.
4. **Outside-loop drift check.** Compare against the last close-out entry: `origin/main` position,
   `sw.js` `VERSION`, `FONT_MAKER_VERSION`, the highest-numbered `db/migrations/` file with its `Live?`
   state (`db/README.md`), `db/functions/*` source (a source edit with no recorded deploy is drift),
   `js/supabase-config.js` (the SDK pin and the key), the keep-alive workflow file, and the keep-alive's
   last scheduled run (through the connector or the Actions tab). Note what landed outside the loop
   (version moves included); backend phases land there and leave no ledger trace at all, so a jump in any
   of these is where the unaudited surface is; that surface is prime discovery territory. Never trust the
   previous close-out's numbers unread.
5. **Branch & PR.** Loop sessions follow CLAUDE.md's Git rule: a `claude/*` branch feeding a draft PR —
   never push to `main` unless the maintainer explicitly authorizes it in-session, and that authorization
   is never standing. If the previous loop PR is open and unmerged, continue on it; if merged, cut a fresh
   branch off latest `origin/main` and open a new draft PR at close-out. Pages deploys only on merge, so
   deploy `success` is verified after merge, not in-session.
6. Enter the iteration protocol; its first act is the stalest discovery pass.

## Session parameters
| Parameter | Rule |
|---|---|
| Budget | **5 iterations**: 1 discovery pass + up to 4 fixes. A micro-feature costs 2. |
| Scope guard | One concern per iteration, one commit per iteration. A fix that reveals a second problem logs it as a candidate — never chase it now. |
| Verification debt | At most one unverified aspect outstanding; resolve or revert it before the next iteration, and end the session rather than accumulate a second. Never leave the tree mid-change. |
| Variety governor | Max 2 iterations/session on one recurring-pattern class; max 2 touching one tool (each chrome page — index, resources, contact, privacy, terms, 404, **account** — is its own tool; at most **one iteration per session** may change a shared script every page loads — `js/i18n.js`, `pwa.js`, the four backend modules — any of them, and that iteration does not also spend the per-page touches). The pass charges the budget but not the caps. If the top candidate breaks a cap, take the highest-priority one that doesn't; priority still wins across sessions. Tie-break toward tools and patterns untouched in the last 2 sessions. |

**Backend boundary — the loop never changes the live project.** No migration applied, no Edge Function
deployed, no key rotated, no policy or grant altered — and no gate makes it askable. `db/` is deliberately
not `supabase/`, so there is **one shared production project**: a loop branch would mutate it before its own
draft PR is reviewed, and with `drop` forbidden neither "revert cleanly" nor the verification-debt rule can
hold for server state. A finding that needs one is logged as a Candidate or Feature seed with the SQL
**drafted as the next `db/migrations/NNNN_<name>.sql`, `Live?` = no**, and named in the close-out as
maintainer work. The browser-side backend files (`js/ivrit-*.js`, `js/supabase-config.js`, `account.html`)
are ordinary loop surface — verified by the smokes, not by the generic recipe.
**Reading the live project is allowed and expected** where the Supabase connector is present — `list_migrations`,
`list_tables`, `get_advisors`, `list_edge_functions`, `get_edge_function`, `query_logs` — and nothing else:
`apply_migration`, `deploy_edge_function`, any `execute_sql` that writes, `pause_project` / `restore_project`,
branch and key operations, and the workflow's `cron:` line are never the loop's, and no gate makes them askable.
**Nothing from a live read — an e-mail, a user id, a row name, a log line — is written into the ledger, the
findings file or a commit** (the ledger is public); a read that finds drift logs a Candidate naming the
maintainer action only.

## Decision gates — ask the maintainer (AskUserQuestion, concise options, a recommended default)
Small verified fixes stay autonomous. These decisions are the maintainer's:
1. **Micro-feature selection** — which Feature seed to build, or skip this session.
2. **User-visible copy & SEO text** — any wording or default-behavior change beyond a small fix
   (renaming a button is gated; fixing its typo is not), and ANY change to titles, meta descriptions,
   OG copy or JSON-LD claims.
3. **Dramatic aesthetics** (pass M) — anything a returning teacher would immediately notice: palette,
   font, layout restructuring, component redesign, re-theming. Small refinements stay autonomous.
   Propose with current-state screenshots.
4. **Mobile restructuring** (pass N) — a fix scoped inside a phone-width media query stays autonomous.
   Ask before anything that changes what desktop users see, hides or reorders content at phone widths,
   adds a touch-only interaction or a phone-specific blocking screen, or migrates a unit/breakpoint
   page-wide. Propose with current-state phone screenshots, stating what changes on phone AND desktop.
5. **Every Deslop proposal** (pass O) — O has no autonomous fix path: each change that alters rendered
   output, and each waiver of a finding as brand truth, ships only after the maintainer sees a rendered
   before/after pair and answers. Batch into ONE contact sheet and ONE question per session.

**Batching:** collect gate questions at the post-pass selection moment and at iteration boundaries, up
to 4 per call. Never gate small mechanical fixes; a session with no gated work asks nothing.
**Unattended fallback (no answer can arrive):** gate 1 — skip the micro-feature; gates 2–4 — ship
nothing dramatic, log the proposal as a Candidate with its screenshot paths; gate 5 — **do not run O
at all**: write `needs an attended session` in O's rotation row and take the next-stalest pass. Record
every deferral under "Decisions deferred to maintainer" in the close-out entry. A gate degrades
gracefully; it never stalls the session.

## Iteration protocol (repeat up to budget)
1. **Discover, then select.** Run the single stalest pass first (rotation table; pointer breaks ties),
   logging everything found as Candidates / Feature seeds before fixing anything. Skip the pass only on
   explicit user direction, recording `pass run: — (skipped; <X> stays stalest)`. Then select the top
   candidate the variety governor allows.
2. **Ground.** Open the file, grep the exact anchors, read the surrounding conventions (strict
   single-file HTML; match local style). Ledger line numbers drift — locate by pattern.
3. **Fix minimally.** Smallest diff that resolves the issue; no drive-by cleanups or reformatting.
4. **Verify** per CLAUDE.md's Playwright recipe (light + dark × desktop + ~800px) plus an
   issue-specific check designed before coding. **A change touching `js/supabase-config.js`,
   `js/ivrit-account.js`, `js/ivrit-saves.js`, `js/ivrit-projects.js`, `account.html` or a page's account
   wiring is verified by the matching smoke** (`docs/reference/ops.md` → *Backend smokes*), **not** by the
   recipe: the recipe route-aborts the SDK CDN and the project URL, so the signed-in path never runs and a
   broken sync merge, a wrong registry row or an RLS denial all pass clean — the false zero of the three
   measurement rules below, at a layer they do not name. Save data → `.ivrit` round-trip; export paths → produce
   the artifact and inspect it. Three measurement rules for any probe: **fire a control before trusting
   a zero** (drive it with a real `page.click`, not a loop inside `page.evaluate`); **a silent control
   means diagnose, not discard** (a bad control string is not a blind detector); **assert the probe's
   handle resolves before its result counts** — a missing function or an unmatched selector returns a
   falsely reassuring zero, so guard with `typeof fn === 'function'`, a non-null `querySelector`, and
   best of all a counted side effect (e.g. a `page.route` hit counter).
5. **Commit**, naming the pattern if it's a recurring one.
6. **Log.** Move the item to Done (date, commit, verification method); update Pattern health for a
   sweep-class fix.

**When a fix fails:** if the correct fix isn't small or the diff balloons past one concern — revert
cleanly, re-log the candidate with what you learned, record "attempted, reverted" in Done. A clean
revert with better intelligence is a successful iteration; a half-verified change in the tree is not.

## Discovery passes (strict rotation — one per session, the stalest first)
The ledger's rotation table is the authoritative member list. Re-deriving per-tool history ("which
tool is stalest for D?") means grepping `docs/IMPROVEMENT_ARCHIVE.md` too — rows keep only the last
run. A pass defined here but absent from the table (no ledgered removal or SKIP) gets a row
`- <letter> <name>: never run — registered <date>` at session start; never-run rows are stalest.
"One tool/surface per session" passes pick the least-recently-audited of the 7 tools + chrome pages
(index, resources, contact, privacy/terms, 404, account); the row's result note tracks coverage.

- **A. Recurring-pattern sweep** — sweep every pattern marked ACTIVE in Pattern health, by the
  detection definition its row carries (tuned greps, exemptions, what counts as a hit); never re-derive
  a weaker one. Focus on surface changed since that pattern's last sweep, outside-loop landings
  included. A fix that reveals a new recurring shape registers it with its own health row. Retirement:
  3 consecutive clean sweeps, **unless consequence-critical** (security, data loss — those stay ACTIVE).
  **A2** (every 6th A, or when all patterns are retired): spot-check retired patterns; a hit un-retires.
- **B. Console & error audit** — load every root page headless, `account.html` and the two harnesses
  included; capture console errors/warnings and failed requests on load and one basic interaction per tool.
- **C. Accessibility (one tool)** — keyboard-only walkthrough: focus order and visibility,
  Escape/Enter on modals, `aria-` on interactive SVG/canvas, reduced motion, contrast in both themes,
  touch-target size (WCAG 2.5.8 — C owns the `sub-floor touch target` pattern). These tools are
  projected and used by young students on school-managed devices.
- **D. Performance snapshot (one tool)** — cold load + one heavy interaction; log main-thread blocks
  >200 ms with profile evidence.
- **E. Freshness & site health** — sitemap `lastmod` vs git, broken internal links, SW precache list vs
  files (both directions — the four backend `js/` modules and `account.html` belong in it), each page's CSP
  allowlist against what that page actually loads (`docs/reference/ops.md`; the two account origins must be
  present exactly where the account scripts are), THIRD_PARTY_LICENSES vs deps, robots/CNAME present and
  parsing, README / CLAUDE.md / `docs/reference/*` accuracy. Indexability *semantics* are L's.
- **F. Cross-tool consistency** — one UX affordance (empty states, share buttons, dark toggles, font
  pickers, toasts…) compared across all seven tools and the chrome pages; converge on the best
  existing implementation.
- **G. Print & export fidelity (one tool)** — the artifact a student holds: paper AND every exported
  file (`.ttf`/`.otf`/UFO, `.ivrit`, PDF, CSV, share links). Print-preview every printable surface on
  Letter and A4: margins, mid-item page breaks, nikkud clipping, dark-mode ink bleed, header/footer
  junk, RTL alignment. Inspect exported files themselves. Divergences are usually P2.
- **H. Teacher walkthrough (one tool)** — role-play preparing a real lesson end-to-end; log every
  friction (extra clicks, missing defaults, unclear copy, dead ends, re-entering data another tool
  has). Frictions → P3 Candidates; missing small affordances → Feature seeds (the micro-feature
  intake). Never re-log a seed the maintainer struck.
- **I. First-load & empty-state** — every tool and `account.html` in a fresh context (empty localStorage
  AND IndexedDB — no `sb-*` key, no sync memory: the anonymous path): instructive empty states, no crash
  on absent keys, demo data paths, onboarding copy matches the UI.
- **K. i18n audit** — `node scripts/check-i18n.js`: Check A stays clean; Check B's backlog is the
  burndown (prefer sites whose CSV keys exist). Checks C, D and **E** are blocking — E keeps every
  `data-legal-block`'s slot count equal to its `\n` segments, which is what stops a privacy/terms edit
  silently serving English, so a session that touched `privacy.legal.*` / `terms.legal.*` reads E's output
  rather than the exit code. Then probe its blind spot: English built in template literals or passed as
  plain arguments. Respect the translate-vs-content boundary in CLAUDE.md.
- **L. SEO & discoverability** — audit the static HTML source, offline: unique `<title>` (~50–60) and
  description (~150–160) per page; `rel=canonical` = `https://ivritsuite.com/<page>.html` (homepage:
  bare root); `404.html`, `i18n-test.html`, `account-test.html` and `saves-test.html` stay out of the indexable set (the last two are `noindex` harnesses, absent from the sitemap, `llms.txt` and the precache by design); `account.html` is **in** it; OG/Twitter parity and
  `og:image` resolving (strip `?v=`); every JSON-LD block parses and its claims match the visible UI;
  sitemap = indexable set, sitemap↔canonical agreement; crawl-graph from the homepage via static
  `<a href>`; one `h1`, alt text on content images. Titles and descriptions stay English; never propose
  clean-URL restructuring; copy fixes are gate 2 — the pass logs and batches questions.
- **M. Aesthetics (one surface)** — audit like a designer in the full matrix: typography (scale,
  hierarchy, Hebrew/English pairing), spacing rhythm, alignment, color harmony, component consistency
  (judged against the suite's best existing implementation — convergence beats invention), hierarchy,
  dark-mode parity. Usually P4, P3 where sloppiness impairs use; contrast keeps C's severity. Small
  refinements ship as normal iterations; anything dramatic is gate 3. **Screenshot rule:** BEFORE and
  AFTER, light + dark at the affected breakpoints, saved in the scratchpad (never committed) and
  delivered at close-out.
- **N. Mobile & touch (one surface)** — use a **real device descriptor**, not a resized window:
  `browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' })` (this is what flips
  `pointer: coarse` / `hover: none` and sets `maxTouchPoints`); `page.tap()` needs `hasTouch`. Arms
  (run what the surface has, log what you skip): **1** reflow/overflow at 320/390/412 + one landscape,
  both themes, EN and HE (`scrollWidth <= clientWidth` on `documentElement`, nothing clipped, no fixed
  bar over the primary action, modals fit with their close reachable); **2** viewport meta contract (one
  shape per page; never `user-scalable=no`; `viewport-fit=cover` with `safe-area-inset` or neither);
  **3** dynamic browser chrome — `100vh` vs `dvh` audited statically per use site (headless can't
  measure it; one site swapped is a fix, page-wide is gate 4); **4** touch-only parity (no hover-only
  or DnD-only path — the folder tree's "Move ▾" is the sanctioned precedent — sliders by finger,
  tooltip tap contract under `hasTouch`); **5** on-screen keyboard ergonomics (`inputmode`,
  `autocapitalize`/`autocorrect` on Hebrew/name fields, focused field visible with the keyboard up);
  **6** standalone/PWA dead ends (no browser back: every view escapable, safe-area, orientation flip);
  **7** phone-grade performance (4× CPU, slow network) on the heaviest path — deeper is D's.
  Boundaries: C owns a11y semantics and target size; M owns pure aesthetics; B/I own load gates; G owns
  paper. Fixes verify at the found phone width **plus** the standard matrix; extend an existing phone
  media query rather than inventing a breakpoint. **Screenshot rule:** every run ships a phone contact
  sheet even when clean (every major view, light + dark, EN + HE) plus BEFORE/AFTER pairs per fix.
- **O. Deslop — AI-design-tell sweep (one surface; attended sessions only)** — asks "does this look
  like nobody chose it?" using the Impeccable anti-pattern detector; how to run both arms, the DEGRADED
  rule, waiver syntax and rule-id ownership: `docs/reference/deslop-detector.md`. Triage every finding
  into: **tell** (O's, gated), **brand truth** (waive inline with the reason — gated: the site's
  navy/gold/parchment, Frank Ruhl Libre, siddur identity is deliberate, the Google "G" on the sign-in button is
  official path data kept unmodified as Google's terms require and inline so no CSP grows, and a finding that contradicts
  a documented choice is a false positive), **another pass's** (file it there), or **detector wrong
  here** (record the rule id and why). O owns tells, not quality in general: contrast and legibility
  → C, refinement → M, main-thread cost → D, phone reachability → N; when both M and O could claim a
  finding, a detector rule id wins it for O. Never a general beautification. **Proposal gate:** BEFORE
  on a clean tree → apply, never commit → AFTER (same frame) → revert and prove `git status` empty →
  present one side-by-side composite per proposal → ship only what came back approved, then re-run the
  arm to confirm the rule id is gone. Never present an AFTER you did not render. Prefer converging a
  token or shared block over patching call sites.
- **P. Accounts & cloud (one surface)** — the layer no other pass can see. Pick the least-recently-audited
  wired surface (the 7 tools, the hub's cloud panels, `account.html`). Arms, running what the surface has:
  **1** anonymous parity — the page's full localStorage dump byte-identical to a control run with the account
  scripts blocked (`smoke-tools.mjs --only <file>`, with `--sdk` or its signed-in arms silently skip), the bar
  being that an anonymous visit is unchanged;
  **2** signed-in behaviour through the matching smoke, never the generic recipe (see iteration step 4);
  **3** registry integrity — every `IVRIT_SYNC_REGISTRY` key registered at all three AllTools sites and in the
  page's own `IVRIT_CFG`, and the kind of data it carries named in `privacy.legal.*` / `terms.legal.*`
  (CLAUDE.md accounts rule 8); **4** every reset control on a syncing page calls `forgetRow(tool, kind)` — its
  absence turns a local reset into an account-wide one and nothing else detects it; **5** the two CSP origins
  present exactly where the account scripts are, and nowhere else, and every gtag page carrying the
  `page_location` snippet with the same keys as `AUTH_QUERY_KEYS` (the A-sweep pattern owns detection; P
  confirms the carrier count); **6** the four `js/` modules and `account.html` in `sw.js` `CORE_ASSETS`;
  **7** `var TOOLS` still equal to `saves.tool`'s CHECK; **8** (connector present, read-only) the recorded
  migrations plus `db/README.md`'s object queries against its `Live?` column (a hand-pasted migration has no
  history row, so an absent record alone is not drift), the security and performance advisors clean,
  `delete-account` deployed with its JWT check on and its deployed source equal to
  `db/functions/delete-account/index.ts`, and the keep-alive's latest scheduled run green. **Control:**
  plant a defect — rename a registry key, delete a `forgetRow` call — and confirm the probe fires before any
  clean result counts; a fake cloud that answered nothing looks exactly like a layer with no bugs. Findings
  needing a migration, a deploy or a key stop at the backend boundary and are logged, not shipped.

(J, the metrics-informed pass, is permanently SKIP in the rotation: its feature was removed.)

## Micro-feature track
- **Source:** only the ledger's Feature seeds (from pass H or explicit human request). Never invent one.
- **Micro:** one tool (a declared cross-tool handshake pair is the sole exception), ≤ ~150 lines of
  diff, no dependencies, no build step, no `data/` edits, storage keys reconciled per CLAUDE.md in the
  same commit, both themes, single-file conventions. Never across the backend boundary — no migration, no
  deploy, no new `saves.tool` value; a seed that adds a synced key ships its registry row, its `omit` list and
  its `privacy.legal.*` / `terms.legal.*` text and passes `smoke-sync` + `smoke-migration` in the same commit,
  or it is not micro.
- **Budget:** max 1 per session, costs 2 iterations (1 per touched tool against the caps). Skip when a
  P1 exists. Selection is gate 1; unattended default is skip and log.
- **Verification:** the full step 4 plus a fresh-profile check and a `.ivrit` round-trip if state was
  added. Prefer dual-audience seeds (Hebrew and secular use) at equal size.
- **Abort:** diff trending past ~150 lines or outside the declared scope → revert, split the seed in
  the ledger, log "attempted, split."

## Prioritization rubric
P1 data loss, security, broken core function, export corruption, an account-wide deletion or overwrite (a
reset pushed up, a sync that removes), a secret or session token reaching a page or analytics, an anonymous
visit that downloads or calls the account layer · P2 silently wrong output, undo holes,
a11y blockers · P3 performance, dead UI, confusing copy, consistency, paper-cuts · P4 polish.
Tie-breakers: (1) teachers' saved work, (2) the printed/exported artifact, (3) dual-audience beats
single, (4) untouched in the last 2 sessions, (5) smallest diff.

## Ledger schema and size rules
The ledger is **current state**; history goes to `docs/IMPROVEMENT_ARCHIVE.md` (append-only, grep-only)
and measurements/refutations to `docs/reference/loop-findings.md`. `scripts/check-ledger.mjs` fails a
close-out that breaks these; `node scripts/compact-ledger.mjs --apply` moves overflow verbatim to the
archive. Limits live in `scripts/ledger-rules.mjs`:
- Whole ledger ≤ 100 KB; any line ≤ 600 chars (the current handoff's lines ≤ 1500). Write the
  headline; detail that matters goes to the archive entry, not the ledger line.
- `## Candidates`: `- [ ] P<n> | <file> | <one-sentence defect> | found S<N>`. Open, fixable work only.
  A measurement, refutation, method note or "recorded so nobody re-derives it" is not a candidate —
  it goes straight to `loop-findings.md`. Striking a candidate moves it to Done, never to a `[x]` line.
- `## Feature seeds`: open seeds only; shipped or struck ones move to the archive.
- `## Done`: last 5 sessions. Entry: `- [x] <date> | <commit> | <file> | <what> | <verified how>`; plus
  one `(SN close-out) | branch/deploy note` per session (branch/PR state, drift check, `sw.js`
  vNNN→vNNN + files, FM bump-or-not with reason, scripts run, decisions deferred).
- `### Per-session log`: last 20 rows,
  `- <date> | SN | iters: N | tools: … | patterns fixed: … | pass run: <letter> | SW: vNNN→vNNN`.
- `### Tool coverage`: ONE snapshot row (every tool with its last-touched date), rewritten in place.
- `### Pattern health`: one row per pattern, updated in place: name, ACTIVE|retired, last swept, hits,
  clean streak, and the detection definition (grep + exemptions).
- `### Discovery-pass rotation`: one row per pass `- <letter> <name>: <date> (SN: <one-line result +
  surface covered>)`, updated in place — no `_(prior)_` chains. Then the single
  `**Next session (SN+1):**` handoff: the pointer plus at most a few `⚑` notes (branch/PR state, what
  is stalest, the strongest untaken candidate, the seed bench). The previous handoff moves to the archive.

## Session close-out (always, even on early stop)
1. **Ledger:** Done entries, the close-out entry, Candidates/Feature seeds re-prioritized, Pattern
   health, Tool coverage, the rotation row, the per-session line, the new handoff pointer.
2. **Compact and check:** `node scripts/compact-ledger.mjs --apply`, then
   `node scripts/check-ledger.mjs --vs origin/main` — both must be clean.
3. **Repo definition of done** — walk CLAUDE.md's checklist itself, not this paraphrase: `check-i18n`
   (+ `build-locales` if CSV keys were added), `check-inline-js` if any inline `<script>` changed, the
   **backend smokes** if a backend file changed, the page's CSP if a new origin is loaded, the `data/`
   `?v=N` bump on every fetcher if a corpus changed, `FONT_MAKER_VERSION` + one changelog entry if a Font
   Maker feature shipped, `sw.js` VERSION bumped once in the final commit if any precached file changed,
   then `update-sitemap` and `update-llms-txt` last if page content or metadata changed.
4. **Push** the session branch; ensure the draft PR exists or is updated.
5. **Summary**, then the recap. Summary: iterations, pass run and its result, patterns swept
   (hits/clean), micro-feature shipped/split, screenshots delivered (M/N/O rules), gates asked → answers,
   decisions deferred, protocol divergences to fold into this skill, and what a human must do (merge
   the PR, verify the deploy, apply a drafted migration, redeploy a changed function, set the keep-alive's
   `cron:` line from their own account if never done, re-enable the workflow if the Actions tab shows it off). Then **"In simple terms, what did this loop session do?"** — a short,
   jargon-free recap for a teacher: what visibly changed, what was checked and found fine, what to do
   next — ending with "run `/compact` now before the next session" (or, in a harness that
   auto-compacts, that this is covered). The loop keeps its state in the ledger, not the chat.

If the ledger is missing, stop and ask the maintainer — never bootstrap a new one silently.
