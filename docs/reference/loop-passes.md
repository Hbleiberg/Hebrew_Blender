# Improvement loop — the discovery passes (reference)

> Read only the section for the pass you are about to run (plus *Probe rules* and *Surfaces*), never the
> file whole. The protocol that chooses the pass — the roster, the rotation rule, the budget, the gates —
> is `.claude/skills/improveloop/SKILL.md`; which pass ran when, and on what, is the ledger's rotation
> table (`docs/IMPROVEMENT_LOG.md`) and `node scripts/loop/coverage.mjs`. Recurring shapes a pass
> registers live in `docs/reference/loop-patterns.md`; measurements and refutations already made live in
> `docs/reference/loop-findings.md` — grep both before re-deriving anything.

## Probe rules (every pass, every fix)

Verify per CLAUDE.md's Playwright recipe (light + dark × desktop + ~800px) plus an issue-specific check
designed before coding. **A change touching `js/supabase-config.js`, `js/ivrit-account.js`,
`js/ivrit-saves.js`, `js/ivrit-projects.js`, `account.html` or a page's account wiring is verified by
the matching smoke** (`docs/reference/ops.md` → *Backend smokes*), **not** by the recipe: the recipe
route-aborts the SDK CDN and the project URL, so the signed-in path never runs and a broken sync merge,
a wrong registry row or an RLS denial all pass clean — the false zero of the three measurement rules
below, at a layer they do not name. Save data → `.ivrit` round-trip; export paths → produce the
artifact and inspect it.

Three measurement rules for any probe:
1. **Fire a control before trusting a zero** — drive it with a real `page.click`, not a loop inside
   `page.evaluate`.
2. **A silent control means diagnose, not discard** — a bad control string is not a blind detector.
3. **Assert the probe's handle resolves before its result counts** — a missing function or an unmatched
   selector returns a falsely reassuring zero, so guard with `typeof fn === 'function'`, a non-null
   `querySelector`, and best of all a counted side effect (e.g. a `page.route` hit counter).

Two recorded traps: `context.setOffline(true)` never reaches a service worker's own fetches (stop the
local server instead), and a page with one bare `JSON.parse` never sets `({}).polluted` — `JSON.parse`
defines `__proto__` as an own property, so a pollution control needs a bare parse *plus* a bare merge
into a target.

## Surfaces

Two kinds of pass: a **suite** pass (A, B, E, F, I, K, L) covers the whole suite over the commit delta
since its last run; a **surface** pass (C, D, G, H, M, N, P) takes one surface per run. The surfaces are
the ten tool pages — generator, dictionary, flash cards, Torah Trainer, Trope Tutor, dashboard, Font
Maker, Letter Learner, Parsha Emojis, Name Tags — plus one **chrome bundle** (index, resources, contact,
privacy + terms, 404, account, audited together as one surface; for the variety governor's caps each
chrome page is still its own tool). A surface pass picks the least-recently-audited surface as
`node scripts/loop/coverage.mjs` reports it (a never-audited surface outranks everything) and records its
next targets in the rotation row's `X-next:` note; `coverage.mjs --check` rejects a note that contradicts
the record.

## A — Recurring-pattern sweep (suite)

Sweep every pattern marked ACTIVE in Pattern health, by the detection its catalog entry carries
(`docs/reference/loop-patterns.md`: a committed `scripts/loop/detect-<id>.mjs` run with its `--plant`
control, or the entry's **Detection** recipe — tuned greps, exemptions, what counts as a hit); never
re-derive a weaker one. Focus on surface changed since that pattern's last sweep, outside-loop landings
included. A fix that reveals a new recurring shape registers it with its own ledger row **and its
catalog entry and detector or recipe in the same commit**; a row with no method is DRAFT and earns no
streak — the next A writes its recipe or retires it. Retirement: 3 consecutive clean detector runs
spanning ≥ 30 commits of delta, **unless consequence-critical** (security, data loss — those stay ACTIVE
or become GUARD checks in `scripts/loop/closeout.mjs`). **A2** (every 6th A, or when all patterns are
retired): spot-check retired patterns (the catalog's retired section); a hit un-retires. A2 also
re-classifies every `JSON.parse` in the whole tree by the provenance of its input (the delta-only sweeps
of `unescaped-input / unsafe-parse` cannot see a trusted parser that a later change fed untrusted data).

The dated-surface walk is an A pattern, not a pass: the clock pinned per Shabbat of one Hebrew year with
the vm-loaded `js/hebrew-calendar.js` as oracle (already Hebcal-proven; `@hebcal/core` is GPL and never
fetched), covering the dashboard's inline Hebrew-date and Omer copy, the countdown behind a
`route.fulfill` fixture, and a leap-year Adar II pin; control: a planted one-day offset or a flipped
`israel`.

## B — Console & error audit (suite)

Load every root page headless, `account.html` and the two harnesses included; capture console
errors/warnings and failed requests on load and one basic interaction per tool.

## C — Accessibility (one surface)

Keyboard-only walkthrough: focus order and visibility, Escape/Enter on modals, `aria-` on interactive
SVG/canvas, reduced motion, contrast in both themes, touch-target size (WCAG 2.5.8 — C owns the
`sub-floor touch target` pattern). These tools are projected and used by young students on
school-managed devices. C keeps the legibility floor for projected surfaces; raising it is a gate-2
question, not a new pass.

## D — Performance snapshot (one surface)

Cold load + one heavy interaction; log main-thread blocks >200 ms with profile evidence.

## E — Freshness & site health (suite)

Sitemap `lastmod` vs git (`node scripts/update-sitemap.mjs --check`), broken internal links, SW precache
list vs files (both directions — the four backend `js/` modules and `account.html` belong in it; the
unlisted `name_tags.html` deliberately does not), each page's CSP allowlist against what that page
actually loads (`docs/reference/ops.md`; the two account origins must be present exactly where the
account scripts are), THIRD_PARTY_LICENSES vs deps, robots/CNAME present and parsing, README /
CLAUDE.md / `docs/reference/*` accuracy. Indexability *semantics* are L's.

**Shape-drift arm.** An endpoint that is absent, slow or erroring is B's, I's and F's; an endpoint that
still answers but with a different shape is E's. Scope: Sefaria `v3/texts`, Hebcal `hebcal` + `shabbat`,
Open-Meteo geocoding + forecast, Nominatim reverse, Web3Forms, the jsDelivr ESM libraries — never a
same-origin `data/` corpus. The arm: committed fixtures (`scripts/loop/fixtures/`, lifted from the
smokes' canned responses, with a dropped-field control) and a static check that each parser reads only
fields its fixture has. The sandbox never sees upstream, so the live fetch-and-diff is a weekly
workflow the maintainer enables, never a session's.

## F — Cross-tool consistency (suite)

One UX affordance (empty states, share buttons, dark toggles, font pickers, toasts…) compared across
all seven tools and the chrome pages; converge on the best existing implementation.

## G — Print & export fidelity (one surface)

The artifact a student holds: paper AND every exported file (`.ttf`/`.otf`/UFO, `.ivrit`, PDF, CSV,
share links). Print-preview every printable surface on Letter and A4: margins, mid-item page breaks,
nikkud clipping, dark-mode ink bleed, header/footer junk, RTL alignment. Inspect exported files
themselves; the `.ivrit` arm is export → fresh profile → import byte-diff, with the normalized-by-design
fields as the allowlist. Divergences are usually P2.

## H — Teacher walkthrough (one surface)

Role-play preparing a real lesson end-to-end; log every friction (extra clicks, missing defaults,
unclear copy, dead ends, re-entering data another tool has). Frictions → P3 Candidates; missing small
affordances → Feature seeds (the micro-feature intake). Never re-log a seed the maintainer struck.

**Student cell** (one per run): the tool's drill or game flow by clicks only, windowed at 1366×768 and
in the page's own fullscreen/Present mode at 1024×768; dead ends to H, functional text below C's floor
to C.

## I — First-load & empty-state (suite)

Every tool and `account.html` in a fresh context (empty localStorage AND IndexedDB — no `sb-*` key, no
sync memory: the anonymous path): instructive empty states, no crash on absent keys, demo data paths,
onboarding copy matches the UI.

## J — Metrics-informed

Permanently SKIP: its feature (the impact-metrics dashboard) was removed. The rotation row stays as the
record.

## K — i18n audit (suite)

`node scripts/check-i18n.js`: Check A stays clean; Check B's backlog is the burndown (prefer sites whose
CSV keys exist). Checks C, D and **E** are blocking — E keeps every `data-legal-block`'s slot count
equal to its `\n` segments, which is what stops a privacy/terms edit silently serving English, so a
session that touched `privacy.legal.*` / `terms.legal.*` reads E's output rather than the exit code.
Then probe its blind spot: English built in template literals or passed as plain arguments. Respect the
translate-vs-content boundary in CLAUDE.md.

## L — SEO & discoverability (suite)

Audit the static HTML source, offline: unique `<title>` (~50–60) and description (~150–160) per page;
`rel=canonical` = `https://ivritsuite.com/<page>.html` (homepage: bare root); `404.html`,
`i18n-test.html`, `account-test.html` and `saves-test.html` stay out of the indexable set (the last two
are `noindex` harnesses, absent from the sitemap, `llms.txt` and the precache by design), and so does
the unlisted `name_tags.html` (`docs/reference/ops.md` → *An unlisted page*: never "fix" it by linking
or listing it); `account.html` is **in** it; OG/Twitter parity and `og:image` resolving (strip `?v=`);
every JSON-LD block parses and its claims match the visible UI; sitemap = indexable set,
sitemap↔canonical agreement; crawl-graph from the homepage via static `<a href>`; one `h1`, alt text on
content images. Titles and descriptions stay English; never propose clean-URL restructuring; copy fixes
are gate 2 — the pass logs and batches questions.

## M — Aesthetics (one surface)

Audit like a designer in the full matrix: typography (scale, hierarchy, Hebrew/English pairing), spacing
rhythm, alignment, color harmony, component consistency (judged against the suite's best existing
implementation — convergence beats invention), hierarchy, dark-mode parity. Usually P4, P3 where
sloppiness impairs use; contrast keeps C's severity. Small refinements ship as normal iterations;
anything dramatic is gate 3. **Screenshot rule:** BEFORE and AFTER, light + dark at the affected
breakpoints, saved in the scratchpad (never committed) and delivered at close-out.

## N — Mobile & touch (one surface)

Use a **real device descriptor**, not a resized window:
`browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' })` (this is what flips
`pointer: coarse` / `hover: none` and sets `maxTouchPoints`); `page.tap()` needs `hasTouch`. Arms (run
what the surface has, log what you skip): **1** reflow/overflow at 320/390/412 + one landscape, both
themes, EN and HE (`scrollWidth <= clientWidth` on `documentElement`, nothing clipped, no fixed bar over
the primary action, modals fit with their close reachable); **2** viewport meta contract (one shape per
page; never `user-scalable=no`; `viewport-fit=cover` with `safe-area-inset` or neither); **3** dynamic
browser chrome — `100vh` vs `dvh` audited statically per use site (headless can't measure it; one site
swapped is a fix, page-wide is gate 4); **4** touch-only parity (no hover-only or DnD-only path — the
folder tree's "Move ▾" is the sanctioned precedent — sliders by finger, tooltip tap contract under
`hasTouch`); **5** on-screen keyboard ergonomics (`inputmode`, `autocapitalize`/`autocorrect` on
Hebrew/name fields, focused field visible with the keyboard up); **6** standalone/PWA dead ends (no
browser back: every view escapable, safe-area, orientation flip); **7** phone-grade performance (4× CPU,
slow network) on the heaviest path — deeper is D's. Boundaries: C owns a11y semantics and target size;
M owns pure aesthetics; B/I own load gates; G owns paper; V owns what the installed worker serves.
Fixes verify at the found phone width **plus** the standard matrix; extend an existing phone media query
rather than inventing a breakpoint. **Screenshot rule:** every run ships a phone contact sheet even when
clean (every major view, light + dark, EN + HE) plus BEFORE/AFTER pairs per fix.

## O — Deslop, the AI-design-tell sweep (one surface; attended sessions only)

**SKIP until the maintainer commits a `.claude/settings.json` permission rule that lets the sandbox
execute the detector** (the sandbox refuses to run third-party code; the rotation row records the
refusal). When runnable: asks "does this look like nobody chose it?" using the Impeccable anti-pattern
detector; how to run both arms, the DEGRADED rule, waiver syntax and rule-id ownership:
`docs/reference/deslop-detector.md`. Triage every finding into: **tell** (O's, gated), **brand truth**
(waive inline with the reason — gated: the site's navy/gold/parchment, Frank Ruhl Libre, siddur identity
is deliberate, the Google "G" on the sign-in button is official path data kept unmodified as Google's
terms require and inline so no CSP grows, and a finding that contradicts a documented choice is a false
positive), **another pass's** (file it there), or **detector wrong here** (record the rule id and why).
O owns tells, not quality in general: contrast and legibility → C, refinement → M, main-thread cost →
D, phone reachability → N; when both M and O could claim a finding, a detector rule id wins it for O.
Never a general beautification. **Proposal gate:** BEFORE on a clean tree → apply, never commit → AFTER
(same frame) → revert and prove `git status` empty → present one side-by-side composite per proposal →
ship only what came back approved, then re-run the arm to confirm the rule id is gone. Never present an
AFTER you did not render. Prefer converging a token or shared block over patching call sites.

## P — Accounts & cloud (one surface)

The layer no other pass can see. Pick the least-recently-audited wired surface (the tools, the hub's
account block, `account.html`). Arms, running what the surface has: **1** anonymous parity — the page's
full localStorage dump byte-identical to a control run with the account scripts blocked
(`smoke-tools.mjs --only <file>`, with `--sdk` or its signed-in arms silently skip), the bar being that
an anonymous visit is unchanged; **2** signed-in behaviour through the matching smoke, never the generic
recipe (see *Probe rules*); **3** registry integrity — every `IVRIT_SYNC_REGISTRY` key registered at all
three AllTools sites and in the page's own `IVRIT_CFG`, and the kind of data it carries named in
`privacy.legal.*` / `terms.legal.*` (CLAUDE.md accounts rule 8); **4** every reset or delete control on
a syncing page is a plain write (it reaches the account by design) whose confirm, while a session is
stored (`IvritAccount.hasStoredSession()`), names the account-wide effect (the `*_cloud` confirm keys),
and no `forgetRow` reference remains anywhere — that memory-forgetting call is gone with the panels;
**5** the two CSP origins present exactly where the account scripts are, and nowhere else, and every
gtag page carrying the `page_location` snippet with the same keys as `AUTH_QUERY_KEYS` (the A-sweep
pattern owns detection; P confirms the carrier count); **6** the four `js/` modules and `account.html`
in `sw.js` `CORE_ASSETS`; **7** `var TOOLS` still equal to `saves.tool`'s CHECK; **8** (connector
present, read-only) the recorded migrations plus `db/README.md`'s object queries against its `Live?`
column (a hand-pasted migration has no history row, so an absent record alone is not drift), the
security and performance advisors clean, `delete-account` deployed with its JWT check on and its
deployed source equal to `db/functions/delete-account/index.ts`, and the keep-alive's latest scheduled
run green. **Control:** plant a defect — rename a registry key, swap a `_cloud` confirm key for its
plain twin — and confirm the probe fires before any clean result counts; a fake cloud that answered
nothing looks exactly like a layer with no bugs. Findings needing a migration, a deploy or a key stop at
the backend boundary and are logged, not shipped.

## V — Offline & service-worker runtime (suite)

What the installed worker does at runtime, which the recipe blocks by construction and E reads only
statically: the precached shell served with the origin server stopped, `DATA_CACHE` hits and `?v=`
eviction, and the VERSION+1 install/activate path (old `ivritsuite-vN` gone, the new worker
controlling). Arms: **1** a context *without* `serviceWorkers: 'block'`, load `index.html`, wait for
`navigator.serviceWorker.controller`, seed the data cache with one online fetch, then **stop the local
server** (not `setOffline` — see *Probe rules*) and navigate every `CORE_ASSETS` page plus one `data/`
fetcher: 0 `pageerror`, content rendered, an unknown path as the control; **2** serve a `git archive`
copy with `sw.js` bumped, call `reg.update()`, await `controllerchange`, read `caches.keys()`; **3**
plant a dropped `CORE_ASSETS` entry and confirm arm 1 reports it. Boundaries: E keeps the static
`CORE_ASSETS` and `?v=` history census, B/I keep load gates with the worker blocked, D keeps `sw.js`'s
fetch cost, N arm 6 keeps standalone navigation dead ends.

## Standing arm R — Regression re-run (session start)

Nothing else re-runs an issue-specific page-layer probe (A re-checks pattern classes over the delta; the
backend smokes' D-scenarios cover sync fixes). A fix commits its probe as
`scripts/loop/probes/S<N>-<slug>.mjs` on the shared harness **only when no smoke scenario or ACTIVE
pattern row covers it**; `node scripts/loop/regress.mjs --last 2` runs in session-start step 4 on HEAD
beside its `git archive <fix>^` control; a probe needing the `--sdk` build, web fonts or Pyodide skips
loudly; a failure is a P2 ahead of the rotation pass.
