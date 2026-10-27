# Loop patterns — the catalog behind the ledger's Pattern health rows

> The improvement loop's file (session ids and digests live here by design, as in `loop-findings.md`). The ledger
> (`docs/IMPROVEMENT_LOG.md` → `### Pattern health`) keeps one status line per pattern; this file keeps what that
> line cannot: the shape, the owner, the consequence class, the detection recipe or detector path, and the record.
> Read an entry by its id (grep the id; every entry heading is the id in backticks) — never the file whole. A new
> ledger row needs its entry here in the same commit (`scripts/check-ledger.mjs` fails otherwise), and a new row
> ships its detector or its recipe in that commit too. Measurements and refutations: `docs/reference/loop-findings.md`;
> full history: `docs/IMPROVEMENT_ARCHIVE.md`.
>
> **Row format in the ledger:** `- <id in backticks> | ACTIVE|DRAFT|GUARD|retired | owner <letter> | det: <scripts/… path, recipe or none> | last S<N> | streak n [| hits n]`
> — `det: recipe` means this file's **Detection** line is the method; `det: none` forces DRAFT (no streak can be
> earned); GUARD is a consequence-critical pattern whose check moved into `scripts/loop/closeout.mjs` and runs every
> session. Streaks count detector runs once `scripts/loop/sweep.mjs` writes them; until then they are A's sweeps.
>
> _**Retirement rule (as applied):** a pattern retires after 3 consecutive clean sweeps **UNLESS it is consequence-critical** (security or data-loss). The three that hit 3-clean at S64 — unescaped-input/unsafe-parse (XSS), localStorage-vs-AllTools (backup), destructive-bulk …[full text: IMPROVEMENT_ARCHIVE.md]
>
> _(history)_ **The per-sweep result rows (S141–S357, 83 rows) moved verbatim to `docs/IMPROVEMENT_ARCHIVE.md` in S361 ("Sweep-status rows moved out of the ledger"); the current state of every pattern lives in Pattern health above.** Grep …[full text: IMPROVEMENT_ARCHIVE.md]

## Active, draft and guard patterns (166; newest first, as the ledger lists them)

## `focus-hidden-under-a-sticky-bar`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S561 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A sticky or fixed bar at a window edge (a header, a Start / action bar, a jump bar, an audio bar) and the browser's focus scrolling: Tab, Shift+Tab or a page's roving arrow-key focus brings a control just into view at that edge — under the bar, its indicator wholly hidden (WCAG 2.4.11).
- **Detection:** a real Tab and Shift+Tab walk of each screen (and the page's roving-focus keys over its widest list), five sample points per stop by `elementFromPoint`, a point counting when it lands in a sticky / fixed ancestor that does not contain the stop; wholly hidden = every on-screen point; HEAD routed as the control, a phone with the install hint as an extra cell (`c560/tabwalk.mjs`, `phonewalk.mjs`, `torahwalk.mjs`, `p561/genwalk.mjs` — scratchpad paths never committed: port them at the next A, or the row goes DRAFT). Start a walk by clicking the page ground at the top (trap 373) and key its loop detection on an expando id (trap 374).
- **Fix shape:** the root's `scroll-padding-block` reserves the bars' live heights — a `ResizeObserver` writes `--…-h` on `<html>` (0 while a bar is hidden or closed), `+ 8px`; a bar that only one screen shows is scoped with `html:has(#screen.active)`, and a bar that rides above the install hint adds `--pwa-banner-space`. Centred scrolls (`block:'center'`) then centre in the clear band.
- **Carriers:** parsha_emojis FIXED S522 `297ea36` (the first: its pinned bar); flash FIXED S560 `7032085` (`fcTrackStickies`: header + Start bar); torah FIXED S560 `a22de39` (`ttTrackStickies`: jump bar + karaoke bar); generator FIXED S561 `e9e07d8` (the fixed Generate bar over the sidebar's end: `initGenFab` writes `--gen-fab-h`; its sticky `.main-toolbar` measured clean) — open 0 measured. Unprobed: the dictionary's phone `#mobileBar`, the Letter Learner's sticky dialog head (inside a scroller: that scroller's own `scroll-padding`).
- **Record (S561):** generator — 5–10 stops wholly + 0–1 partly under the Generate bar going forward in all 8 cells, 2–6 at 390 → 0; Shift+Tab 0 (findings S561).
- **Record (S560):** NEW — flash setup 34 wholly + 2 partly under the Start bar, Shift+Tab 8–17 + 9–20 under the header (8 cells), 48–72 on two iPhones with the hint → 0; torah 7 + 21 under the jump bar, 28 + 0–35 under the open audio bar → 0 (findings S560).

## `hover-tip-not-dismissible-or-hoverable`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S560 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A tooltip opened by mouse hover (`pointerenter` on the trigger) cannot be dismissed by Escape unless the trigger has the focus (the Escape handler sits on the trigger), and vanishes when the pointer moves onto the bubble (`#tipFloat` is `pointer-events:none` and the trigger's `pointerleave` hides it) — WCAG 1.4.13's dismissible and hoverable.
- **Detection:** `c560/hovertip.mjs` (`PAGE=<file>`) — each visible `[data-tip]` hovered by a real mouse with the focus on `<body>`: shown, still shown after 3 s (persistent), still shown after Escape (not dismissible), and after a re-hover still shown with the pointer moved onto the bubble's centre (hoverable). The control comes with the first fix: the fixed carrier must read 0 / 0.
- **Fix shape (proposed):** a document-level Escape that hides a shown tip before anything else answers it (closing only the bubble, the `tip-escape-drops-focus` rule), and a hover bridge — the bubble takes pointer events while shown, the trigger's `pointerleave` waits ~150 ms, the bubble's `pointerenter` cancels the hide and its `pointerleave` runs it. The idiom is per page (not a `═══` block): `openEl` on flash, `openWrap` on the dictionary, trope, torah and dashboard.
- **Carriers:** flash (7 tips: 7/7 not dismissible, 5/7 not hoverable — measured S560); the dictionary, trope, torah and dashboard carry the same idiom, unmeasured. Open 5.
- **Record (S560):** NEW — measured on flash only (findings S560); the candidate names the five pages.

## `tour-step-in-a-hidden-view`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S558 · **Streak:** 0 · **Detector:** recipe
- **Record (S558):** letter_learner FIXED `0d6cacb` — `llTourStart()` brings the options sidebar out before the engine: hidden 6 / 5 steps (Block / Vowels; HEAD 4 / 3) × 8 cells, store byte-equal, focus back on Tour. Open carriers: 0 (the six per-file engines unprobed).
- **Shape:** A tour step whose target sits in a view the page lets the user hide — another tab, a hidden sidebar, a folded section — is skipped by the shared engine (`_resolveStep` → `_tourVisible`), so the Tour pressed from that state shows fewer steps, never explains that part, and gives no sign that anything was left out.
- **Detection:** per tour carrier, list the states the page can be in when Tour is pressed (each tab or mode, the sidebar shown or hidden, each fold, a session in progress); press Tour by a real click in each and count the steps to Done; a count below the default view's is a hit. Control: the default state, or HEAD, shows the full count.
- **Fix shape:** the page's own Tour button opens the view before calling the engine (`ntTourStart`: the sidebar and the class list; `tuTourStart`: the Learn tab) — a view switch that saves no setting, no progress and no panel memory; the shared engine stays byte-identical.
- **Carriers:** name_tags FIXED (`ntTourStart`, before S557); trope_tutor FIXED S557 `69bb568`; letter_learner FIXED S558 `0d6cacb` (`llTourStart`) — open 0. Unprobed: the six per-file engines, whose steps reveal hidden panels by design (`docs/reference/shared-components.md`).
- **Record (S557):** NEW — trope from Phrases 6 of 9, from Drill or Settings 4 of 9 (8 cells, HEAD the control) → 9 from every tab, settings and progress byte-equal across the tour, a drill resuming its question; the Letter Learner 6 → 4 with its sidebar hidden (EN 1280, HE 800), candidate.

## `dark-hover-resolves-to-the-rest-colour`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S558 · **Streak:** 1 · **Detector:** recipe
- **Record (S558):** trope clean — the hover arm's fill test over 967 controls × 2 themes found no dark hover equal to its rest fill (the font cards were the base-rule shape, a border).
- **Shape:** Shape: a `:hover` that resolves to the rest background in the OTHER theme (dark `--warm-gray` = dark `--white`).
- **Detection:** `warm-gray` hover rules minus those with a `body.dark X:hover` twin, confirmed by a real dark hover. Fix shape: `body.dark X:hover{background:#2a3349;}`. An A2 hit un-retires.
- **Record (ledger row at S544):** - **`dark-hover-resolves-to-the-rest-colour`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 17 new `:hover` rules all measured with feedback). Shape: a `:hover` that resolves to the rest background in the OTHER theme (dark `--warm-gray` = dark `--white`). Detection: `warm-gray` hover rules minus those with a `body.dark X:hover` twin, confirmed by a real dark hover. Fix shape: `body.dark X:hover{background:#2a3349;}`. An A2 hit un-retires.
- **Fix shape:** the page's own dark hover fill, `body.dark X:hover{background:#2a3349}` (FM `.ctl-btn`, dictionary `.emoji-gender-btn`); light keeps `--warm-gray`.
- **Carriers (S557):** FM `.mark-sq` FIXED `14f9875`; dictionary `.shoresh-chip` + `.dict-tool-btn` FIXED `39e085a` — open 0.
- **Record (S557):** UN-RETIRED — two M passes found carriers after the S357 retirement (S554 the FM's 12 nikkud tiles, S556 the dictionary's 787 root chips and toolbar), both FIXED: by the real mouse in 8 cells with HEAD served as the control, dark 0/12 → 12/12 tiles (the active one too) and 0/3, 0/40 → 3/3, 40/40; labels ≥ 9.85:1 on #2a3349; light unchanged. Owner stays A: its sweep, and M's hover arm, catch it.

## `offscreen-sheets-laid-out-on-every-rebuild`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S550 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A multi-sheet preview rebuilds every sheet on every change (a slider's `input`, a tile, a keystroke) and the browser then styles, lays out and paints the sheets off-screen too, so the cost of one gesture grows with the whole document rather than the part in view: a 25-sheet Name Tags list spent ~80 ms a frame at 1× (650 ms a frame at 4×) on a size-slider drag with 0 of 25 frames in the viewport.
- **Detection:** `d549/prof.mjs` + `ab.mjs` — a `devtools.timeline` trace of one real slider move (`UpdateLayoutTree` + `Layout` against the count of frames intersecting the viewport, read by `getBoundingClientRect`) and the long tasks per gesture on alternated fresh loads of HEAD and the tree, medians of 3, at 1× and 4×; a planted 300 ms busy loop pressed by a real click is the control. A carrier is a container of N sheet-sized frames where the trace's layout time scales with N while the frames in view stay ≤ 2.
- **Fix shape:** `content-visibility:auto` on the per-sheet frame whose own size is explicit (the column's height and scroll never change), with `content-visibility:visible !important` in the page's print block so every sheet prints; verify the markup, the print PDF (pages + text), the geometry and the layer count equal HEAD's — the screen pixels shift by a sub-pixel phase under paint containment (trap 343), so a pixel-identical screenshot is the wrong identity test.
- **Carriers:** name_tags `.nt-frame` FIXED S549 `2499371` (the drag 646 → 0 ms of long tasks at 1×, 7,000 → 3,035 at 4×); Parsha Emojis' coloring-sheets popup FIXED S550 `887e8c5`. Next to measure: the generator's chunked worksheet (`flushWorksheetBuild`).
- **Record (S550):** second carrier FIXED — Parsha Emojis' coloring-sheets popup `887e8c5` (`content-visibility:auto` on the preview's pages and papers only: the fit measures off-screen clones of the same class, so the selector is scoped to `#etCsPages`; the print run is a separate area, so no print pin). 54 chosen @4×, medians of 3: the open 2,089 → 1,739 ms, a 20-move drag + refit 1,374 → 826; 36/54 skipped; identical verdicts, markup, note, print run; a scroll to the end now costs 153–247 ms @4× (0 @1×), the sheets rendering as they come into view. Next: the generator's chunked worksheet. Trap 346: a carrier's `checkVisibility` is asked of a descendant.
- **Record (ledger row at S549):** - `offscreen-sheets-laid-out-on-every-rebuild` | ACTIVE | owner D | det: recipe | last S549 | streak 0

## `dated-surface-walk`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S544 · **Streak:** 0 · **Detector:** none
- **Shape:** A date-driven surface (the dashboard's inline Hebrew-date and Omer copy, its countdown, the Trainer's parasha-by-date, Parsha Emojis' week) shows the wrong parasha, holiday or count on some date of the Hebrew year — a double parasha, an Israel/Diaspora split week, Adar II in a leap year, the Omer's day boundary.
- **Planned detection (not yet run, hence DRAFT):** the clock pinned per Shabbat and holiday of one Hebrew year (`page.clock.setFixedTime` or an `addInitScript` Date shim) with the vm-loaded `js/hebrew-calendar.js` as oracle (Hebcal-proven over 5660–5900 by `scripts/smoke-hebrew-calendar.mjs --hebcal`; `@hebcal/core` is GPL and never fetched), the dashboard countdown behind a `route.fulfill` fixture; controls: a planted one-day offset and a flipped `israel`. Registered by the S544 protocol audit after the year-walk pass proposal was refuted (loop-findings S544): the module and the Trainer's festival Shabbatot were covered; the dashboard's inline copy (`docs/reference/dashboard.md`: the two copies "are meant to stay identical … not yet done"), the countdown and a leap-year pin were not.
- **Record (ledger row at S544):** - `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

## `defaults-filed-as-the-device's-own-at-first-sign-in`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** normal · **Last:** S546 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A page writes its settings key on a plain first load (or its account flush writes the defaults before the module's first read), so a brand-new device's first sign-in on an account whose row differs is told "Your account's … settings replaced the ones this device had before you signed in" and offered a download of nothing but the defaults; on an empty account the defaults go up as the account's row.
- **Detection:** on the smoke-sync fake cloud (`p546/fresh.mjs`, `note.mjs`): a fresh device (no keys, `meta2:false`) on an empty account — a `saves` POST for the page's settings row with no teacher action is the seed of the shape; then one field of that row changed and a second fresh device opened — `ivritSuite_replaced` holding a `#signin@` entry, an `.ivsav-note` in the status host and a Download button is the hit. A page whose flush writes nothing on a load (parsha_emojis, letter_learner since `b577692`) is clean; a page that writes its key on an anonymous first load (flash, torah, trope, dashboard; `anon.mjs`) carries it until the module can tell a load's first write from a choice.
- **Record (ledger row at S546):** - **`defaults-filed-as-the-device's-own-at-first-sign-in`** (NEW S546 P; ×1 fixed (S546: letter_learner `b577692` — the flush writes nothing while no key exists and the live object is still the defaults); the hub's inputMode half went in S535 `7ac2ccc` (kept only when fields are lost); open: flash, torah, trope, dashboard, index — a module rule, the maintainer's call): ACTIVE, streak 0.

## `selected-state-lost-in-forced-colors`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S549 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A state drawn only by colour flattens in forced colours.
- **Detection:** `c541/fcensus.mjs`, then computed styles; a fix is measured by `page.screenshot({clip})` of the pressed element centred in the viewport against a sibling under `forcedColors:'active'` (`n545/hc.mjs`: an element screenshot there is not the page's paint, and a clip in the viewport's bottom band shows the sticky bar over it). A toggle with no unpressed sibling is the same button clipped before and after a real press (`n545/slow2.mjs`). Name the pressed control's `:hover` twin too: after a click the pointer still rests on it, and a `.x[aria-pressed="true"]:hover` rule of higher specificity outranks the block (computed white, S546 trope Slow). Pairs per page: `n547/hc2.mjs` (`SET=fm|trope`); a disabled button keeps an author system colour (the drill's answered choices paint Highlight), and a thin ring scores 19–25 by the mean metric (its threshold is a fill's), so a ring is judged by its clip too (`n547/hcshot.mjs`). — `c541/fcensus.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Fix shape (S548):** the selected rule carries `forced-color-adjust:none` beside its explicit `Highlight` / `HighlightText` pair — Chromium paints a Canvas backplate behind every text run it adjusts, so on a Highlight fill the label is a blank block (white on white under the emulation; Windows' default themes pair HighlightText with Canvas too); opted out, the system colours still follow the theme (`c548/bp.mjs`). A distance pass does not catch it: zoom a clip of the selected control and count grey levels. The S541–S547 blocks predate this (candidate).
- **Detection (S548):** `c548/fc2.mjs` / `fc3.mjs` — the same control clipped before and after a real click and re-queried by its selected state (a picker that rebuilds its buttons loses a temporary id); 0–17 is indistinct, the fixed ones score 52–143. A rule in a body-level `<style>` (the dashboard's Backup panel) sits after the head block in source order, so its selector takes one more class; a drawer tab's transparent underline turns CanvasText on every tab, so the block sets it `Canvas` except under the open one (the Letter Learner's rule).
- **Record (S549):** `37966be` carried the S548 backplate correction (`forced-color-adjust:none` on the filled selected rule) to the nine earlier blocks (parsha_emojis, letter_learner, resources, contact, flash, generator, trope, dictionary, FM — 15 states measured, light and dark), and `9140333` closed the last open carriers: `.hk-tab.active` on the dictionary and resources, `.ivrit-mode-btn.active` on flash, the generator and the hub (its first block, at the end of its head CSS, (0,3,0) past the AllTools panel's body-level `<style>`). **Open carriers: none — the census is complete.** Detection (S549): `d549/hc.mjs` — 4× clips under `forcedColors:'active'` × light/dark of each selected state reached by a real click, classified against the page's computed system colours with a planted control pair (A: the pair alone reads ~52 % white, a block; B: with the opt-out ~12 %, glyphs); the emulation paints `Highlight` at alpha 0.8 and `HighlightText` equals `Canvas`, so the share of Canvas-coloured pixels is the signal (findings S549, traps 344–345).
- **Record (ledger row at S548):** - **`selected-state-lost-in-forced-colors`** (NEW S541 C; ×12 fixed (S543: resources, contact; S545: flash `bbf201c`, generator `6f51774` — the block ends the page's own CSS so source order cannot outrank it; S546: trope `ce31c96` tabs, family chips, font cards, Slow (its `:hover` twin named), dictionary `e9759f0` mode buttons; S547: FM `d6be009` letter tiles, step and category tabs, English case, brushes, node modes and toggles, help tabs, wizard dots, piece rows, mark tiles (a ring), trope drill `4fa1538` armed / right / wrong (a dashed ring for the wrong pick); S548: name_tags `ebf8dd1` per-page tile, Backup mode, keyboard tab, dashboard `c89eedf` drawer tab, font, vowel scheme, emoji set, Backup mode, keyboard tab); the S541 census's pages all fixed; open: `.hk-tab.active` on dictionary + resources, `.ivrit-mode-btn.active` on flash, generator, index): ACTIVE, streak 0. A state drawn only by colour flattens in forced colours. Detection: `c541/fcensus.mjs`, then computed styles.

## `live-region-shown-with-its-text`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S553 · **Streak:** 0 · **Detector:** recipe
- **Record (S553):** name_tags' `#ntFontMissing` (the S550 candidate, the pattern's last open carrier) FIXED `2ba4ff9` with the page's display-none fix: `hidden` dropped, the writer sets text only, `:empty` out of flow; CDP notRendered → `status` at load in 4 cells. No open carrier known.
- **Shape:** A status region made or un-hidden with its first message.
- **Detection:** findings S537 (grep + CDP).
- **Record (S550):** 2 hits by the recipe on the two font-note carriers the S537 fix left (both toggled `hidden` with the sentence): the generator FIXED `2b86472` (`genfont.mjs`: AX ignored → `status` at load, the panel's layout identical); name_tags' `#ntFontMissing` open (Candidate, the governor's third touch). The recipe's probe stays `Accessibility.getPartialAXTree` on the node before any text, with the panel that holds it opened first (a collapsed panel reads ignored for every note).
- **Record (ledger row at S544):** - **`live-region-shown-with-its-text`** (NEW S537; `61762cf` ×8, `6d095c0` ×3): ACTIVE, streak 0. A status region made or un-hidden with its first message. Detection: findings S537 (grep + CDP).

## `abs-child-escapes-its-scroller`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 1 · **Detector:** recipe
- **Record (S555):** flash_cards clean: 0 escaping elements in 256 cells (the `.vh` file input included); the wide-absolute plant fired once the audit measured against `documentElement.clientWidth` (trap 352). Recipe: `n555/common.mjs` `__n.audit().escapes`.
- **Shape:** An absolute `.
- **Detection:** `n534/escape.mjs`. — `n534/escape.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`abs-child-escapes-its-scroller`** (NEW S534 N; `f7c4981`): ACTIVE, streak 0. An absolute `.vh` escaping its `overflow` box widens the page. Detection: `n534/escape.mjs`.

## `empty-result-not-announced`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S530 · **Streak:** 1 · **Detector:** recipe
- **Shape:** A no-match landing no live region speaks.
- **Detection:** `f528/empty.mjs`; `b529/fix1.mjs` (real typing, live text — `f528/empty.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`empty-result-not-announced`** (NEW S528 F; resources ×2 `34ae261b`; S529 dictionary roots `28a52123`; open 0): ACTIVE, streak 1 (S530: no new no-match surface). A no-match landing no live region speaks. Detection: `f528/empty.mjs`; `b529/fix1.mjs` (real typing, live text
- **Archived full text (latest compaction copy):** - **`empty-result-not-announced`** (NEW S528 F; resources ×2 `34ae261b`; S529 dictionary roots `28a52123`; open 0): ACTIVE, streak 1 (S530: no new no-match surface). A no-match landing no live region speaks. Detection: `f528/empty.mjs`; `b529/fix1.mjs` (real typing, live text read).

## `print-trailing-padding-adds-a-sheet`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S530 · **Streak:** 1 · **Detector:** recipe
- **Detection:** `h526/fix1.mjs` (a header-only or empty PDF sheet). — `a530/pcs.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`print-trailing-padding-adds-a-sheet`** (NEW S526 H; account S523, LL `198ccfac`): ACTIVE, streak 1 (S530 `a530/pcs.mjs`). Detection: `h526/fix1.mjs` (a header-only or empty PDF sheet).

## `unseen-hit-box-over-controls`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S530 · **Streak:** 1 · **Detector:** recipe
- **Detection:** `c527/cover3.mjs` + a real click (`swallow.mjs`). — `a530/rt.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`unseen-hit-box-over-controls`** (NEW S527 C; LL `82a3f0b2`): ACTIVE, streak 1 (S530 `a530/rt.mjs`). An unpainted box over a control eats its clicks. Detection: `c527/cover3.mjs` + a real click (`swallow.mjs`).

## `layout-read-per-grid-at-build`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S524 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A builder's layout read (`offsetParent`, a rect) per grid while the page still builds.
- **Detection:** `d524/trace.mjs` (forced Layout by stack line). — `d524/trace.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`layout-read-per-grid-at-build`** (NEW S524 D; `roveTileGrid` ×3 FIXED `aa14beba`; open 0): ACTIVE, streak 0. A builder's layout read (`offsetParent`, a rect) per grid while the page still builds. Detection: `d524/trace.mjs` (forced Layout by stack line).

## `dark-palette-baked-into-paper`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S563 · **Streak:** 1 · **Detector:** recipe
- **Record (S563, G generator):** clean — colour-coded reading sheets printed from dark: every Letter-mode glyph fill is one of the light palette's colours, and Underline's stroke colours equal light's set (`g563/nikpaper.mjs`, pdfplumber's `non_stroking_color` / `stroking_color`).
- **Shape:** Detection: `getNikudColor` output that reaches paper (print, `onclone`) resolves the light palette; a PDF from dark = light's.
- **Detection:** `getNikudColor` output that reaches paper (print, `onclone`) resolves the light palette; a PDF from dark = light's.
- **Record (ledger row at S544):** - **`dark-palette-baked-into-paper`** (NEW S523 G; torah, dictionary, generator fixed; open 0): ACTIVE, streak 0. Detection: `getNikudColor` output that reaches paper (print, `onclone`) resolves the light palette; a PDF from dark = light's.

## `tour-not-following-a-live-switch`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S522 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `tourswitch.
- **Detection:** `tourswitch.mjs`; torah `torahtour.mjs` (Sefaria gated). — `tourswitch.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`tour-not-following-a-live-switch`** (NEW S519 K; fixed LL, trope, dashboard, dictionary, torah, FM S519–S522; open 0): ACTIVE, streak 0. Detection: `tourswitch.mjs`; torah `torahtour.mjs` (Sefaria gated).

## `overlay-scoped-dialog-keys`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S530 · **Streak:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **`overlay-scoped-dialog-keys`** (NEW S514 F; LL, flash; S515 `.ivrit` ask ×4, Torah favorite; **S516 hub Erase + I/E `973eb309`; open: none**): ACTIVE, streak 1 (S530: 3 new dialogs, `a530/dialogs.mjs`). A click on a dialog's text puts focus on `<body>`: an overlay listener
- **Archived full text (latest compaction copy):** - **`overlay-scoped-dialog-keys`** (NEW S514 F; LL, flash; S515 `.ivrit` ask ×4, Torah favorite; **S516 hub Erase + I/E `973eb309`; open: none**): ACTIVE, streak 1 (S530: 3 new dialogs, `a530/dialogs.mjs`). A click on a dialog's text puts focus on `<body>`: an overlay listener (or a first/last-only trap) lets Shift+Tab …[full text: IMPROVEMENT_ARCHIVE.md]

## `group-toggle-wipes-a-sibling-group`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S551 · **Streak:** 1 · **Detector:** recipe
- **Record (S551):** name_tags clean: no `querySelectorAll('.…btn')` class-wide toggle on the page (its radios, tiles and tabs each set their own state).
- **Shape:** A class-wide `.
- **Detection:** `grep -n "querySelectorAll('\\.[a-z-]*btn')"
- **Record (ledger row at S544):** - **`group-toggle-wipes-a-sibling-group`** (NEW S512 H; generator FIXED `ff980a7`; the match-target re-sync was an earlier work-around): ACTIVE, streak 0. A class-wide `.active` toggle on a button class another row shares. Detection: `grep -n "querySelectorAll('\\.[a-z-]*btn')"
- **Archived full text (latest compaction copy):** - **`group-toggle-wipes-a-sibling-group`** (NEW S512 H; generator FIXED `ff980a7`; the match-target re-sync was an earlier work-around): ACTIVE, streak 0. A class-wide `.active` toggle on a button class another row shares. Detection: `grep -n "querySelectorAll('\\.[a-z-]*btn')" *.html`, each toggle vs the rows sharing the class (`.sc-cols-btn`: one group, clean).

## `infinite-box-shadow-pulse-repaints-every-frame`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S511 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `grep -n attnPulse *.
- **Detection:** `grep -n attnPulse *.html` → keyframes on `box-shadow`; `i511/pulse.mjs` paints per 3 s (0 = fixed; the — `i511/pulse.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`infinite-box-shadow-pulse-repaints-every-frame`** (NEW S510 D; letter_learner FIXED `fd6cfdc`; S511 the 6 carriers FIXED `f1cfd83` — open 0): ACTIVE, streak 0. Detection: `grep -n attnPulse *.html` → keyframes on `box-shadow`; `i511/pulse.mjs` paints per 3 s (0 = fixed; the
- **Archived full text (latest compaction copy):** - **`infinite-box-shadow-pulse-repaints-every-frame`** (NEW S510 D; letter_learner FIXED `fd6cfdc`; S511 the 6 carriers FIXED `f1cfd83` — open 0): ACTIVE, streak 0. Detection: `grep -n attnPulse *.html` → keyframes on `box-shadow`; `i511/pulse.mjs` paints per 3 s (0 = fixed; the dashboard's clock counts 6). Exempt: a once-only flash on an overflow-clipped card (trope `attnPulseShadow`).

## `new-page-print-block-without-the-ink-remap`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S550 · **Streak:** 1 · **Detector:** recipe
- **Shape:** Detection: `--text:` inside the print block of every page with dark tokens; `g509/g509.
- **Detection:** `--text:` inside the print block of every page with dark tokens; `g509/g509.mjs` ink dark vs light. — `g509/g509.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (S550, G name_tags):** clean — the print block has no `--text:` remap and needs none: everything themed is hidden on paper and the sheets' ink is literal (dark = light 56/56).
- **Record (ledger row at S544):** - **`new-page-print-block-without-the-ink-remap`** (NEW S509 G; letter_learner FIXED `be4a13f`; 14 others clean): ACTIVE, streak 0. Detection: `--text:` inside the print block of every page with dark tokens; `g509/g509.mjs` ink dark vs light.

## `page-drops-a-field-it-cannot-apply`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** normal · **Last:** S507 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A page rebuilds a synced blob from its known fields, dropping a newer build's field from the account.
- **Detection:** `p507/trope.mjs` T6. — `p507/trope.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`page-drops-a-field-it-cannot-apply`** (NEW S507 P; trope `3b9915b9`): ACTIVE, streak 0. A page rebuilds a synced blob from its known fields, dropping a newer build's field from the account. Detection: `p507/trope.mjs` T6.

## `theme-token-on-an-always-dark-surface`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 1 · **Detector:** recipe
- **Record (S555):** flash_cards clean: 0 text nodes under 4.5:1 (3:1 large) across 256 cells, the navy card back, the dark dialogs and the listening tiles included (a `#777`-on-navy plant fired).
- **Shape:** A theme token (`--text`, `.
- **Detection:** `n506/pickcon.mjs`. — `n506/pickcon.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`theme-token-on-an-always-dark-surface`** (NEW S506 N; dashboard picker Close `87745776`; suite unswept): ACTIVE, streak 0. A theme token (`--text`, `.btn-secondary`) on an overlay that is dark in both themes. Detection: `n506/pickcon.mjs`.

## `data-edit-under-an-unchanged-buster`
- **Status:** ACTIVE · **Owner:** E · **Consequence:** normal · **Last:** S503 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `e503/e2b.
- **Detection:** `e503/e2b.py` (findings S503). — `e503/e2b.py` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`data-edit-under-an-unchanged-buster`** (NEW S503 E; 2 FIXED `39265428`): ACTIVE, streak 0. Detection: `e503/e2b.py` (findings S503).

## `root-var-per-input`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S497 · **Streak:** 1 · **Detector:** recipe
- **Shape:** Detection: archive.
- **Detection:** archive.
- **Record (ledger row at S544):** - **`root-var-per-input`** (NEW S496 D; dictionary FIXED `c049ab67`; S497: generator ×2 + trope under 200 ms @4×, closed): ACTIVE, streak 1. Detection: archive.

## `dark-palette-on-the-element`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S495 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: findings S495.
- **Detection:** findings S495.
- **Record (ledger row at S544):** - **`dark-palette-on-the-element`** (NEW S495 G; `.hol-ico` FIXED; `.fx-*` FIXED `e5b3dc47`; open: none): ACTIVE, streak 0. Detection: findings S495.

## `count-noun-without-a-one-form`
- **Status:** DRAFT · **Owner:** I · **Consequence:** normal · **Last:** S533 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`count-noun-without-a-one-form`** (NEW S497 I; bulk edit ×3 `d438f151`; S498 FM fidelity ×5 FIXED `fc56d212`; S501 FM `{max} units` + status/banner counts FIXED `c6db7170` via a `{units}` phrase; S504 dashboard `bulk_skipped` FIXED `13c10bf3`; S533 K: 6 delta `{count}` keys,
- **Archived full text (latest compaction copy):** - **`count-noun-without-a-one-form`** (NEW S497 I; bulk edit ×3 `d438f151`; S498 FM fidelity ×5 FIXED `fc56d212`; S501 FM `{max} units` + status/banner counts FIXED `c6db7170` via a `{units}` phrase; S504 dashboard `bulk_skipped` FIXED `13c10bf3`; S533 K: 6 delta `{count}` keys, all shown only above 1 — 0; open: none known): ACTIVE, …[full text: IMPROVEMENT_ARCHIVE.md]

## `busy-disabled-button-drops-focus`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S551 · **Streak:** 1 · **Detector:** recipe
- **Record (S551):** name_tags clean: no `.disabled = true` on a pressed control before an `await` (the CSV reader, the library load and the Dashboard bring-in leave the button enabled).
- **Detection:** `.disabled = true` on the pressed control before an `await`, no hand-back; runtime: Enter it, after it lands `activeElement` is the control; control: HEAD reads `<body>`.
- **Record (ledger row at S544):** - **`busy-disabled-button-drops-focus`** (NEW S498 H; contact + resources FIXED `68adddee`; S499 generator PDF `1ca449db`; S500 dashboard Current Location `82218419`; trope ×2 REFUTED (both hand focus back); open: FM export (an error modal opens mid-export: hand back only if
- **Archived full text (latest compaction copy):** - **`busy-disabled-button-drops-focus`** (NEW S498 H; contact + resources FIXED `68adddee`; S499 generator PDF `1ca449db`; S500 dashboard Current Location `82218419`; trope ×2 REFUTED (both hand focus back); open: FM export (an error modal opens mid-export: hand back only if focus is on `<body>`)): ACTIVE, streak 0. Detection: `.disabled = true` on the pressed control before an `await`, no hand-back; runtime: Enter it, after it lands `activeElement` is the control; control: HEAD reads `<body>`.

## `hidden-input-anchored-outside-its-scroller`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S499 · **Streak:** 0 · **Detector:** recipe
- **Detection:** a `position:absolute|fixed` focusable — `c499/anchor.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`hidden-input-anchored-outside-its-scroller`** (NEW S499 C; dashboard's 25 drawer radios FIXED `55891185`, torah fixed outside the loop; latent: `.vh-file` ×4, its label on screen on every path measured): ACTIVE, streak 0. Detection: a `position:absolute|fixed` focusable
- **Archived full text (latest compaction copy):** - **`hidden-input-anchored-outside-its-scroller`** (NEW S499 C; dashboard's 25 drawer radios FIXED `55891185`, torah fixed outside the loop; latent: `.vh-file` ×4, its label on screen on every path measured): ACTIVE, streak 0. Detection: a `position:absolute|fixed` focusable input with a scroll container between it and its containing block (`c499/anchor.mjs`; plant: torah's `.radio-group{position:static}` → 53); runtime: Tab/Shift+Tab, the focused label inside the scroller.

## `hebrew-faux-italic`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 4 · **Detector:** recipe
- **Record (S558):** trope clean — 0 italic Hebrew text nodes in 17 views × 8 cells (~24,800 nodes; `m558/shots.mjs`).
- **Record (S556):** dictionary clean: 0 of ~12,000 visible text nodes per cell (19 views × 8 cells) with Hebrew in a synthesized italic; an inline-italic plant fired.
- **Record (S554):** fontmaker clean: 0 of ~15,600 visible text nodes (14 views × 8 cells) with Hebrew in a synthesized italic; an inline-italic plant fired.
- **Record (S552):** name_tags clean: 0 of 1,253 / 1,240 visible elements with Hebrew in a synthesized italic (EN light 1280, HE dark 800; a planted `<i>` fired).
- **Shape:** Detection: `h526/ital.
- **Detection:** `h526/ital.mjs` (`L=en` = EN arm; a hidden plant fires). — `h526/ital.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`hebrew-faux-italic`** (NEW S494 M; S526 closed the HE census: folder tree `9515b0dc`, dictionary `dd291fd5`; S527 the EN arm's one, dictionary `237f8547`; open 0): ACTIVE, streak 0. Detection: `h526/ital.mjs` (`L=en` = EN arm; a hidden plant fires).

## `fixed-toast-duration-shorter-than-its-text`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S487 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A fixed toast timer under 1000 + 50 ms/char of its longest message.
- **Detection:** `f484/durations.mjs`; exempt sticky/explicit-ms — `f484/durations.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`fixed-toast-duration-shorter-than-its-text`** (NEW S484 F; FIXED `8037c22d` ×4, `5ffa32ba`; resources `3c539498` S487; open 0): ACTIVE, streak 0. A fixed toast timer under 1000 + 50 ms/char of its longest message. Detection: `f484/durations.mjs`; exempt sticky/explicit-ms
- **Archived full text (latest compaction copy):** - **`fixed-toast-duration-shorter-than-its-text`** (NEW S484 F; FIXED `8037c22d` ×4, `5ffa32ba`; resources `3c539498` S487; open 0): ACTIVE, streak 0. A fixed toast timer under 1000 + 50 ms/char of its longest message. Detection: `f484/durations.mjs`; exempt sticky/explicit-ms calls.

## `centred-fixed-box-shrinks-to-half-the-viewport`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S484 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A fixed `left:50%; translateX(-50%)` box with no width is capped at vw/2.
- **Detection:** `f484/width.mjs` (width = vw/2 at 390); fix `width:max-content`. — `f484/width.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`centred-fixed-box-shrinks-to-half-the-viewport`** (NEW S484 F; FIXED `78738db4` ×7): ACTIVE, streak 0. A fixed `left:50%; translateX(-50%)` box with no width is capped at vw/2. Detection: `f484/width.mjs` (width = vw/2 at 390); fix `width:max-content`.

## `shared-module-fallback-literal-without-a-dark-twin`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S483 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A module's `var(--token, #light-literal)` on a page lacking the token.
- **Detection:** findings S483 (3); 7 tokens, 1 hit, 0 open.
- **Record (ledger row at S544):** - **`shared-module-fallback-literal-without-a-dark-twin`** (NEW S483; FIXED `cb226a04` ×2): ACTIVE, streak 0. A module's `var(--token, #light-literal)` on a page lacking the token. Detection: findings S483 (3); 7 tokens, 1 hit, 0 open.

## `rtl-copy-names-the-english-side`
- **Status:** ACTIVE · **Owner:** I · **Consequence:** normal · **Last:** S481 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: findings S481 (b).
- **Detection:** findings S481 (b). — `i481/fix3.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`rtl-copy-names-the-english-side`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (b).

## `copy-names-a-control-by-a-label-it-lacks`
- **Status:** ACTIVE · **Owner:** I · **Consequence:** normal · **Last:** S481 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: findings S481 (a).
- **Detection:** findings S481 (a). — `i481/refs.py` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`copy-names-a-control-by-a-label-it-lacks`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (a).

## `screen-frame-prints-as-rails`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S480 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A plate's border around multi-sheet content prints its sides down every middle page.
- **Detection:** `d480/rails.py` (prove on HEAD). Fix: print `border-color:transparent`. — `d480/rails.py` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`screen-frame-prints-as-rails`** (NEW S480; trope `8de41993`): ACTIVE, streak 0. A plate's border around multi-sheet content prints its sides down every middle page. Detection: `d480/rails.py` (prove on HEAD). Fix: print `border-color:transparent`.

## `enter-ignored-beside-its-own-button`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S472 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `a472/enter.
- **Detection:** `a472/enter.py`, then typed Enter vs the button. — `a472/enter.py` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`enter-ignored-beside-its-own-button`** (NEW S471; dashboard ×5, generator ×2; S472 torah range ×3 `60229f0f`): ACTIVE, streak 0. Detection: `a472/enter.py`, then typed Enter vs the button.

## `placeholder-keeps-the-browser-gray`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S470 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `f470/ph.
- **Detection:** `f470/ph.mjs` < 4.5:1 (plant 1.3:1). — `f470/ph.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`placeholder-keeps-the-browser-gray`** (NEW S470 `45a3073e`): ACTIVE, streak 0. Detection: `f470/ph.mjs` < 4.5:1 (plant 1.3:1).

## `header-wrap-gate-below-its-ceiling`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 4 · **Detector:** recipe
- **Record (S558):** trope clean — 1px from 1000 to 320, EN/HE × fine/coarse: no overflow; the actions wrap under the title at 746/756 (EN), 494/504 (HE); the nowrap plant overflowed 173–209 widths (`m558/gate.mjs`).
- **Record (S556):** dictionary clean: 1 px 1000 → 320 × EN/HE × fine/coarse in the real faces — no overflow at any width and the actions never drop below the title (the header stacks by its own rule); a nowrap plant overflowed 541 → 320 (max 117px).
- **Record (S554):** fontmaker clean: 1 px 1000 → 320 × EN/HE × fine/coarse in the real faces — no overflow at any width; the header's own `flex-wrap` drops the actions below the title at 786 (EN) / 697 (HE) and the 560 rule then shrinks the buttons; a nowrap plant overflowed 491 → 320 (max 173 px).
- **Record (S552):** name_tags clean: 1 px 720 → 540 × EN/HE × fine/coarse in the real faces — no overflow above the gate, the first wrap at exactly 576 / 585; a nowrap plant fired in each. Read the wrap against `.htitle`'s bottom, not the `h1`'s (the centred controls dip below a two-line title from 696 down).
- **Shape:** Detection: `n520/gates2.
- **Detection:** `n520/gates2.mjs` (1px 320-1000, EN/HE × themes, mouse+touch, real fonts); HEAD the control. — `n520/gates2.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`header-wrap-gate-below-its-ceiling`** (NEW S478 M; ×8 `92a21164`; S489 `f620c768`; S520 touch ×8 `186ea5f4`): ACTIVE, streak 0. Detection: `n520/gates2.mjs` (1px 320-1000, EN/HE × themes, mouse+touch, real fonts); HEAD the control.

## `latin-tracking-on-hebrew-labels`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S551 · **Streak:** 1 · **Detector:** recipe
- **Record (S551):** name_tags clean: the four tracked rules (panel titles, legends, table heads, keyboard subheads) each carry the `html[lang=he]` reset.
- **Detection:** `a502/dash-track.mjs`; torah …[full text: IMPROVEMENT_ARCHIVE.md] — `a502/dash-track.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`latin-tracking-on-hebrew-labels`** (gate 3: drop suite-wide; S502 dashboard + dictionary; S503 flash; S504 torah `8e48daa5`; S505 Beta badges `0abb1f57`; S511 flash report `th` `90e592b`; **S513 generator `.ws-version-label` `c6fe147` — open: none known**
- **Archived full text (latest compaction copy):** - **`latin-tracking-on-hebrew-labels`** (gate 3: drop suite-wide; S502 dashboard + dictionary; S503 flash; S504 torah `8e48daa5`; S505 Beta badges `0abb1f57`; S511 flash report `th` `90e592b`; open: generator `.ws-version-label` — Hebrew by headerLang, outside `html[lang=he]` (S512 H)): ACTIVE, streak 0. Detection: `a502/dash-track.mjs`; torah …[full text: IMPROVEMENT_ARCHIVE.md]

## `forward-arrow-points-back-in-rtl-copy`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 3 · **Detector:** recipe
- **Record (S555):** flash_cards clean: 6 `flashcards.*` Hebrew rows carry an arrow, all exempt or correct (prev/next "(→)/(←)", the Home orphan, "לשלב הבא ←", "שמיעה ← זיהוי", the emoji-gender tip).
- **Detection:** the S462 CSV census; exempt "(→)", A→Z, Back labels, the orphan
- **Record (ledger row at S544):** - **`forward-arrow-points-back-in-rtl-copy`** (NEW S462 N; FIXED S464 `5f7f8a40` ×48; open 0): ACTIVE, streak 2 (S533: 9 delta rows with arrows, 0 — the LL key titles mirror the handler; S472: 47, 0). Detection: the S462 CSV census; exempt "(→)", A→Z, Back labels, the orphan
- **Archived full text (latest compaction copy):** - **`forward-arrow-points-back-in-rtl-copy`** (NEW S462 N; FIXED S464 `5f7f8a40` ×48; open 0): ACTIVE, streak 2 (S533: 9 delta rows with arrows, 0 — the LL key titles mirror the handler; S472: 47, 0). Detection: the S462 CSV census; exempt "(→)", A→Z, Back labels, the orphan `flashcards.header.home`.

## `share-link-writes-the-teachers-saved-preferences`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** normal · **Last:** S472 · **Streak:** 1 · **Detector:** recipe
- **Shape:** Detection: `p463/link-fix.
- **Detection:** `p463/link-fix.mjs`, `a472/dshare.mjs`. — `p463/link-fix.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`share-link-writes-the-teachers-saved-preferences`** (NEW S463 P, `1eeaacb8`): ACTIVE, streak 1 (S472 dictionary clean). Detection: `p463/link-fix.mjs`, `a472/dshare.mjs`.

## `bulk-apply-skips-a-renderer-the-control-runs`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S472 · **Streak:** 1 · **Detector:** recipe
- **Shape:** Detection: `x3/parity.
- **Detection:** `x3/parity.mjs`, `p463/loc-fix.mjs`. Open: none known. — `p463/loc-fix.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`bulk-apply-skips-a-renderer-the-control-runs`** (NEW S461; FIXED ×3): ACTIVE, streak 1 (S472 clean). Detection: `x3/parity.mjs`, `p463/loc-fix.mjs`. Open: none known.

## `radio-set-without-a-question`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S527 · **Streak:** 0 · **Detector:** recipe
- **Detection:** static
- **Record (ledger row at S544):** - **`radio-set-without-a-question`** (S501–S518: 7 fixes; S519 FM ×14 `75637fef`, contact `929089d4`; S527 the `.ivrit` toggles ×5 `1ecaad0c`; open: dictionary, resources (gate 2), pills): ACTIVE, streak 0. Detection: static
- **Archived full text (latest compaction copy):** - **`radio-set-without-a-question`** (S501–S518: 7 fixes; S519 FM ×14 `75637fef`, contact `929089d4`; S527 the `.ivrit` toggles ×5 `1ecaad0c`; open: dictionary, resources (gate 2), pills — flash 18 rows, generator 14, dashboard 3 (S527 walk)): ACTIVE, streak 0. Detection: static walk + runtime `unnamedGroups` …[full text: IMPROVEMENT_ARCHIVE.md]

## `native-input-display-none-under-its-label`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S458 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `a458/radios.
- **Detection:** `a458/radios.mjs`; control torah. — `a458/radios.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`native-input-display-none-under-its-label`** (NEW S458, `ea43be7e`): ACTIVE, streak 0. Detection: `a458/radios.mjs`; control torah.
- **Archived full text (latest compaction copy):** - **`native-input-display-none-under-its-label`** (NEW S458; dashboard `ea43be7e`, 27 radios): ACTIVE, streak 0. A native radio or checkbox hidden with `display:none` behind its styled label: the mouse works, the keyboard and screen readers lose it, and a Tab walk cannot see what it never reaches. Detection: grep `input[^{]*{[^}]*display: *none`, then `a458/radios.mjs` (real Tab per drawer tab, groups reached vs visible); control: torah's drawer (17/17). Fix shape: torah's and trope's 1px, opacity 0, label ring.

## `stale-tab-flush-writes-its-old-copy`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S493 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `a458/twotabsigned.
- **Detection:** `a458/twotabsigned.mjs`, smoke-sync D37, `p493/t7v.mjs` (4 tab orders); control `027fc597^`. — `a458/twotabsigned.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`stale-tab-flush-writes-its-old-copy`** (NEW S458; `c1714e2f`, `027fc597`, flash `070582d8`; S493 the hidden-flush variant, module `c57f0b79`): ACTIVE, streak 0. Detection: `a458/twotabsigned.mjs`, smoke-sync D37, `p493/t7v.mjs` (4 tab orders); control `027fc597^`.
- **Archived full text (latest compaction copy):** - **`stale-tab-flush-writes-its-old-copy`** (NEW S458; outside the loop trope/torah/dictionary `c1714e2f`, dashboard `027fc597`; flash `070582d8`): ACTIVE, streak 0. A hide or close flush that writes the tab's whole in-memory copy, so closing an older tab reverts a newer tab's change. Detection: `a458/twotabsigned.mjs` V/H/HV, the store read as the old tab closes (trap 253); control: the dashboard at `027fc597^`. Fix shape: write only what this tab changed since it last wrote or read.

## `flex-range-keeps-its-min-content-width`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S493 · **Streak:** 0 · **Detector:** recipe
- **Detection:** grep `input\[type=range\][^{]*{[^}]*flex: *1` lacking `min-width: *0`, …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **`flex-range-keeps-its-min-content-width`** (NEW S457; `ddcb4237`; a text input too: dictionary `#shoreshInput` `dcfdcf16` S493): ACTIVE, streak 0. A `flex:1` range without `min-width:0` keeps its 129px and pushes the row's last item out of a
- **Archived full text (latest compaction copy):** - **`flex-range-keeps-its-min-content-width`** (NEW S457; `ddcb4237`; S492: a text input has the same min-content width — dictionary `#shoreshInput`, candidate): ACTIVE, streak 0. A `flex:1` range without `min-width:0` keeps its 129px and pushes the row's last item out of a narrow card. Detection: grep `input\[type=range\][^{]*{[^}]*flex: *1` lacking `min-width: *0`, …[full text: IMPROVEMENT_ARCHIVE.md]

## `slider-value-announced-as-its-position`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S456 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `f456/census.
- **Detection:** `f456/census.mjs` (readout numbers lack the value, no `aria-valuetext`). — `f456/census.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`slider-value-announced-as-its-position`** (NEW S456; `0ca1e29b`): ACTIVE, streak 0. Detection: `f456/census.mjs` (readout numbers lack the value, no `aria-valuetext`).

## `ltr-machine-text-field-typed-rtl`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S551 · **Streak:** 1 · **Detector:** recipe
- **Record (S551):** name_tags clean: no `type="email"` / `type="url"` field on the page.
- **Shape:** Detection: `type="email|url"` (or JS `.
- **Detection:** `type="email|url"` (or JS `.type`) without `dir="ltr"`; a translated placeholder adds `:placeholder-shown { direction: inherit }`.
- **Record (ledger row at S544):** - **`ltr-machine-text-field-typed-rtl`** (NEW S454; `b1eb9659`, 4 carriers): ACTIVE, streak 0. Detection: `type="email|url"` (or JS `.type`) without `dir="ltr"`; a translated placeholder adds `:placeholder-shown { direction: inherit }`.

## `pre-ready-interpolated-write-never-healed`
- **Status:** ACTIVE · **Owner:** I · **Consequence:** normal · **Last:** S454 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: `i453/gates.
- **Detection:** `i453/gates.mjs` `LDELAY=700`; `h454/ttver.mjs`. — `i453/gates.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`pre-ready-interpolated-write-never-healed`** (NEW S453; `728e4075`; **S454 `ab9a133e`**): ACTIVE, streak 0. Detection: `i453/gates.mjs` `LDELAY=700`; `h454/ttver.mjs`.

## `cdn-library-parser-blocking-for-one-action`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** normal · **Last:** S452 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A parser-blocking CDN `<script src>` in `<head>` for one action.
- **Detection:** `grep -n '<script[^>]*src="https\?://' *.html | grep -v ' async\|
- **Record (ledger row at S544):** - **`cdn-library-parser-blocking-for-one-action`** (NEW S452 D; generator `82bbe313`, FM `d01a33cd`): ACTIVE, streak 0. A parser-blocking CDN `<script src>` in `<head>` for one action. Detection: `grep -n '<script[^>]*src="https\?://' *.html | grep -v ' async\|
- **Archived full text (latest compaction copy):** - **`cdn-library-parser-blocking-for-one-action`** (NEW S452 D; generator `82bbe313`, FM `d01a33cd`): ACTIVE, streak 0. A parser-blocking CDN `<script src>` in `<head>` for one action. Detection: `grep -n '<script[^>]*src="https\?://' *.html | grep -v ' async\| …[full text: IMPROVEMENT_ARCHIVE.md]

## `dark-navy-fill-matches-its-ground`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 1 · **Detector:** recipe
- **Record (S558):** trope clean — 2,362 filled controls × 14 views × 4 dark cells: no navy fill on its ground (the hits are bordered dark cards and the gold-text selected segment); plant 2/2 (`m558/navy.mjs`).
- **Record (S557):** dictionary FIXED `488d4a7` — `.b-len` and `.ec-tag.cat` take `body.dark … {background:#2a4070}`: 100 + 100 chips × 8 cells, dark chip vs card 1.03 → 1.51:1, the gold label ≥ 7.3:1, light 14.81 unchanged, print still the transparent outlined chip (its `!important` rule); open 0 on the dictionary.
- **Record (S556):** dictionary: the length badge `.b-len` (11 per view) and the emoji card's `.ec-tag.cat` (100 per emoji view) at 1.03:1 on the dark card plate — the chip vanishes, its gold label floats (5.02:1 itself); candidate (the governor), fix `body.dark .b-len, body.dark .ec-tag.cat{background:#2a4070}`. 6,558 controls × 4 dark cells × 15 views; `.shoresh-lookup-btn` 1.15 on the page (S451's suite look) and the header's switcher / account chip 1.03 with a 1.18 edge (S552's ruling) exempt; a ground-painted `.load-more-btn` plant fired.
- **Record (S554):** fontmaker: `.ctl-btn.primary` on the dark panels (Re-trace 1.03, Confirm placement / Add pair 1.15, Save letter & next) FIXED `7a3faf7` — `body.dark .ctl-btn.primary{background:#2a4070;border-color:#4a6aaa}` reads 1.51–1.67 with a 2.87–3.19 edge; name_tags' Merge button FIXED `24e9f73`, the rule's fifth carrier (open 0). 479 controls × 4 dark cells; the 213 readings at 1.11–1.22 are the suite's dark tiles, tabs and selects (S552's ruling); a ground-painted ghost `tbtn` plant fired.
- **Record (S552):** name_tags: the restore dialog's Merge button 1.03:1 on its dark card — the rule's five carriers; the hub, generator, dashboard and flash cards FIXED `c1f42ae` with their pressed Backup toggle (1.03–1.14:1 beside the unpressed one), name_tags' Merge button a candidate (the governor). Clean otherwise over 72–112 controls × 6 states × 2 dark cells (the panel titles' 1.15:1 are the suite's dark look; a ground-coloured plant fired).
- **Shape:** Detection (`g451/navy.
- **Detection:** every visible — `g451/navy.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`dark-navy-fill-matches-its-ground`** (NEW S450 M; flash ×2 `c9e2bc2b`, `68055510`; S451 census: dictionary `5deb5472`, generator `f9ca0909`; S464 keyboard block ×4 `f98367f8`): ACTIVE, streak 0. Detection (`g451/navy.mjs`): every visible
- **Archived full text (latest compaction copy):** - **`dark-navy-fill-matches-its-ground`** (NEW S450 M; flash ×2 `c9e2bc2b`, `68055510`; S451 census: dictionary `5deb5472`, generator `f9ca0909`; **S464: the shared keyboard block, 4 carriers, `f98367f8`**): ACTIVE, streak 0. Detection (`g451/navy.mjs`): every visible button/.btn/[role=button]/.active/[aria-pressed=true] in dark, its fill …[full text: IMPROVEMENT_ARCHIVE.md]

## `ring-below-3-on-light`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S443 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A focus outline drawn in `--gold` (2.
- **Detection:** - **`ring-below-3-on-light`** (NEW S442; FIXED on 14 pages `91fede71` + 3 modules `a46342c1`; S443 the last two non-outline rings, FM `e05b25d1` + torah's fav dot `1c320ae8`): ACTIVE, streak 0. A focus outline drawn in `--gold` (2.1–2.75:1 on the light surfaces). Detection: …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **`ring-below-3-on-light`** (NEW S442; FIXED on 14 pages `91fede71` + 3 modules `a46342c1`; S443 the last two non-outline rings, FM `e05b25d1` + torah's fav dot `1c320ae8`): ACTIVE, streak 0. A focus outline drawn in `--gold` (2.1–2.75:1 on the light surfaces). Detection:
- **Archived full text (latest compaction copy):** - **`ring-below-3-on-light`** (NEW S442; FIXED on 14 pages `91fede71` + 3 modules `a46342c1`; S443 the last two non-outline rings, FM `e05b25d1` + torah's fav dot `1c320ae8`): ACTIVE, streak 0. A focus outline drawn in `--gold` (2.1–2.75:1 on the light surfaces). Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

## `tip-escape-drops-focus`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S441 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A keyboard tooltip whose Escape calls `blur()` drops the focus to the body, and an unstopped Escape closes the drawer under it.
- **Detection:** Tab onto a visible — `c441/v2.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`tip-escape-drops-focus`** (NEW S441; all 5 carriers FIXED `97c54dfb`): ACTIVE, streak 0. A keyboard tooltip whose Escape calls `blur()` drops the focus to the body, and an unstopped Escape closes the drawer under it. Detection (scratchpad `c441/v2.mjs`): Tab onto a visible
- **Archived full text (latest compaction copy):** - **`tip-escape-drops-focus`** (NEW S441; all 5 carriers FIXED `97c54dfb`): ACTIVE, streak 0. A keyboard tooltip whose Escape calls `blur()` drops the focus to the body, and an unstopped Escape closes the drawer under it. Detection (scratchpad `c441/v2.mjs`): Tab onto a visible …[full text: IMPROVEMENT_ARCHIVE.md]

## `account-wide-delete-confirm-without-signed-in-wording`
- **Status:** DRAFT · **Owner:** P · **Consequence:** adjacent · **Last:** S435 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`account-wide-delete-confirm-without-signed-in-wording`** (NEW S435 P; flash's result delete FIXED `e56d95be`; the colour reset ×5 OPEN, gate 2): ACTIVE, consequence-adjacent (a teacher reads a deletion as local), streak 0. A `confirm()` before a delete/reset of a synced
- **Archived full text (latest compaction copy):** - **`account-wide-delete-confirm-without-signed-in-wording`** (NEW S435 P; flash's result delete FIXED `e56d95be`; the colour reset ×5 OPEN, gate 2): ACTIVE, consequence-adjacent (a teacher reads a deletion as local), streak 0. A `confirm()` before a delete/reset of a synced …[full text: IMPROVEMENT_ARCHIVE.md]

## `logical-inset-mirrors-onto-pinned-content`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S440 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A logical inset over physically pinned content lands on it in Hebrew.
- **Detection:** HE, text Range rects ∩ the control's box.
- **Record (ledger row at S544):** - **`logical-inset-mirrors-onto-pinned-content`** (NEW S440; FIXED `23b7bb0f`): ACTIVE, streak 0. A logical inset over physically pinned content lands on it in Hebrew. Detection: HE, text Range rects ∩ the control's box.

## `tip-name-joins-its-field's-name`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S488 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A `<label>` holding a `.
- **Detection:** the AX tree with every panel and drawer tab …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **`tip-name-joins-its-field's-name`** (NEW S430; generator `10a0c18f`; torah ×3 `d477e15c`; S488 dashboard `f722eeba`): ACTIVE, streak 0 (no open carrier). A `<label>` holding a `.tip-wrap` names its field "… More information".
- **Archived full text (latest compaction copy):** - **`tip-name-joins-its-field's-name`** (NEW S430; generator FIXED S440 `10a0c18f`; torah ×3 FIXED S442 `d477e15c`; **S488 dashboard "Count down to" `f722eeba`**): ACTIVE, streak 0 (no open carrier). A `<label>` holding a `.tip-wrap` names its field "… More information". Detection: the AX tree with every panel and drawer tab …[full text: IMPROVEMENT_ARCHIVE.md]

## `panel-title-keyed-on-an-inner-span`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S439 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection: a `.
- **Detection:** a `.panel-title` with no own `data-i18n`, then toggle + reload.
- **Record (ledger row at S544):** - **`panel-title-keyed-on-an-inner-span`** (NEW S429; S439 generator FIXED `1ce9eabd`, torah stale — no collapsing panels left): ACTIVE, streak 0. Detection: a `.panel-title` with no own `data-i18n`, then toggle + reload.

## `copy-claims-success-on-a-refused-clipboard`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S445 · **Streak:** 0 · **Detector:** recipe
- **Detection:** every `execCommand('copy')` whose
- **Record (ledger row at S544):** - **`copy-claims-success-on-a-refused-clipboard`** (NEW S428; FIXED `bbd5f65`, `0d2a941`; S444 index `90e1a057`, dashboard `18344f69`; **S445 generator `3dad5c11`, flash `58ee7a4f` — all 7 carriers fixed, 0 open**): ACTIVE, streak 0. Detection: every `execCommand('copy')` whose
- **Archived full text (latest compaction copy):** - **`copy-claims-success-on-a-refused-clipboard`** (NEW S428; FIXED `bbd5f65`, `0d2a941`; S444 index `90e1a057`, dashboard `18344f69`; **S445 generator `3dad5c11`, flash `58ee7a4f` — all 7 carriers fixed, 0 open**): ACTIVE, streak 0. Detection: every `execCommand('copy')` whose …[full text: IMPROVEMENT_ARCHIVE.md]

## `button-focus-lost-to-its-own-rebuild`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S545 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A control whose own press rebuilds or disables it (Try again, a tab strip, a tile grid) drops the keyboard's focus to the page.
- **Detection:** reach the control by Tab (so `:focus-visible` holds), press Enter, let the attempt settle, then read `document.activeElement`: `body` is a hit; the fix lands it on the rebuilt control or the one that stands in its place unless focus moved meanwhile (`n545/staffretry.mjs` is the shape, with the network path behind it stubbed). S545 torah staff Try again `09ff400`.
- **Record (ledger row at S545):** - **`button-focus-lost-to-its-own-rebuild`** (**S542 dictionary Try again ×2 `72b005c1`; S513 FM glyph tiles `a54e6d2`; S500 hebrew-keyboard tabs + layout, 4 carriers `1c701fc9`; S499 torah Try again ×2 `80c0a440`; S488
- **Archived full text (latest compaction copy):** - **`button-focus-lost-to-its-own-rebuild`** (**S542 dictionary corpus Try again ×2 `72b005c1`, parsha_emojis' new Try again built to it `20823f85`; S513 FM glyph tiles `a54e6d2`; S500 hebrew-keyboard tabs + layout, 4 carriers `1c701fc9`; S499 torah Try again ×2 `80c0a440`; S488 trope Try again ×2 `183605ba`; S483 hub `ab1a235e`; S474 flash Return to Options `3235f8eb`; S473 …[full text: IMPROVEMENT_ARCHIVE.md]

## `dark-literal-escapes-the-print-tokens`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S563 · **Streak:** 3 · **Detector:** recipe
- **Record (S563, G generator):** clean — the ink census with backgrounds off and on reads the same hits printed from HE dark as from EN light on 36 shapes; Export PDF's mean luminance is 250–252 from both themes.
- **Shape:** Detection: PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.
- **Detection:** PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.dark` literal the print
- **Record (S550, G name_tags):** clean — 28 layouts' PDFs from HE dark equal EN light's at the pixel (56 cells, a 1 px-tolerant diff; the inverted-sheet plant read 1,201 px); the sheet's ink, paper and cut lines are literal colours.
- **Record (ledger row at S544):** - **`dark-literal-escapes-the-print-tokens`** (NEW S437 G; resources FIXED `5320a668`): ACTIVE, streak 1 (S479 trope clean; plant fired). Detection: PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.dark` literal the print
- **Archived full text (latest compaction copy):** - **`dark-literal-escapes-the-print-tokens`** (NEW S437 G; resources FIXED `5320a668`): ACTIVE, streak 1 (S479 trope clean; plant fired). Detection: PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.dark` literal the print …[full text: IMPROVEMENT_ARCHIVE.md]

## `editor-re-parse-caps-a-merged-list`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** critical · **Last:** S421 · **Streak:** 0 · **Detector:** recipe
- **Detection:** no explicit method recorded; consequence-critical, so it stays ACTIVE and the record's shape sentence is the recipe until the next A writes an explicit one (grep the shape's named call or attribute over the delta).
- **Record (ledger row at S544):** - **`editor-re-parse-caps-a-merged-list`** (**NEW S421 Pass P — 1 carrier, FIXED `288af4a`**): ACTIVE, consequence-critical (a sync carries the cut list to the account); never retires. A list the sync merges uncapped is re-parsed by its tool's editor or restore path through the
- **Archived full text (latest compaction copy):** - **`editor-re-parse-caps-a-merged-list`** (**NEW S421 Pass P — 1 carrier, FIXED `288af4a`**): ACTIVE, consequence-critical (a sync carries the cut list to the account); never retires. A list the sync merges uncapped is re-parsed by its tool's editor or restore path through the …[full text: IMPROVEMENT_ARCHIVE.md]

## `window-taller-than-a-phone-without-a-scroll`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 1 · **Detector:** recipe
- **Record (S555):** flash_cards clean: every dialog (ladder, weaknesses, profile picker, backup, sheet menu, tour card) fits the SE and i13 landscape with its close hit-testable and its list scrolling; a 900px planted box fired.
- **Detection:** `n476` `modalFit` on an SE + 13 landscape, a tapped last button;
- **Record (ledger row at S544):** - **`window-taller-than-a-phone-without-a-scroll`** (NEW S476 N; FM `fe808b64`; S506 variant, a sticky head covering its own scroller in landscape: dashboard bulk edit `232ea19e`): ACTIVE, streak 0. Detection: `n476` `modalFit` on an SE + 13 landscape, a tapped last button;
- **Archived full text (latest compaction copy):** - **`window-taller-than-a-phone-without-a-scroll`** (NEW S476 N; FM `fe808b64`; S506 variant, a sticky head covering its own scroller in landscape: dashboard bulk edit `232ea19e`): ACTIVE, streak 0. Detection: `n476` `modalFit` on an SE + 13 landscape, a tapped last button; plant 900px. …[full text: IMPROVEMENT_ARCHIVE.md]

## `install-banner-over-a-sheet's-bottom-controls`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S562 · **Streak:** 0 · **Detector:** recipe
- **Record (S562):** trope_tutor FOUND + FIXED `e75e9ef`: the iOS hint forced on SE + i13 × EN/HE × light/dark — a real tap on the tour's Next stalled at step 2 (SE) / 4 (i13) in 8/8 cells, and on the SE a drill question's Next sat under it; the hint now hides while `#tourCard` or `#drillQ` is up (`n562/banner.mjs`: the whole tour 9/9 and 5/5 drill Nexts by real taps, the hint back after). In-page controls under the hint at rest scroll out — exempt, as the page's own end.
- **Record (S555):** flash_cards FOUND + FIXED `0bfe77e`: the iOS hint forced on SE + i13 (EN/HE) sat over the sticky Start bar (Print whole, Start's lower half), the tour's Next and, on the SE, the marks after a flip; the bar rides above it by `--pwa-banner-space` (≤767px) and the hint hides while `#tourCard` or `#screenCard` is up (`n555/banner.mjs`, `fix1-verify.mjs`: every control hit-testable at centre and bottom edge, real taps; a tap on Next had timed out under the hint). Open: torah gallery.
- **Shape:** pwa.js's install hint (fixed at the bottom, above every z-index) sits over a sheet's, a modal's or the tour's bottom controls on a phone; the carrier hides it while that state is open (`body:has(…) #pwaInstallBanner { visibility:hidden }`) or lifts its bar by `--pwa-banner-space`.
- **Detection:** force the iOS hint (`Object.defineProperty(navigator,'standalone',{get:()=>false})` on an iPhone descriptor, the dismiss key cleared), open each modal and the tour, and read `elementFromPoint` at each bottom control's centre (`n545/banner2.mjs`, `n547/banner.mjs`); S545 letter_learner `1c24c5f` (two modals + the tour); S547 parsha_emojis `37bb922` (the coloring-sheets popup's pinned footer, the hide rule keyed on the page's own `body.et-cs-open`). A page's own end is exempt: pwa.js adds a spacer, so the footer scrolls out from under the hint. Earlier: `a472/banner2.mjs` (sheet — `a472/banner2.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S547):** - **`install-banner-over-a-sheet's-bottom-controls`** (NEW S420 N, hub `f44a17e`; S472 generator bar `8081fc83` (pwa.js `--pwa-banner-space`), FM's 16 windows `56c7a179`; S476 torah gallery `30fcc886`; S545 letter_learner `1c24c5f`; S547 parsha_emojis `37bb922` — open: none known; Name Tags' S534 N predates the recipe, so its next N runs it): ACTIVE, streak 0. Detection: `n547/banner.mjs`; earlier `a472/banner2.mjs` (sheet
- **Archived full text (latest compaction copy):** - **`install-banner-over-a-sheet's-bottom-controls`** (NEW S420 N, hub `f44a17e`; **S472 generator bar `8081fc83` (pwa.js `--pwa-banner-space`), FM's 16 windows `56c7a179`; S476 torah gallery `30fcc886` — no open carrier**): ACTIVE, streak 0. Detection: `a472/banner2.mjs` (sheet …[full text: IMPROVEMENT_ARCHIVE.md]

## `flash-restores-captured-text-not-its-key`
- **Status:** ACTIVE · **Owner:** E · **Consequence:** normal · **Last:** S417 · **Streak:** 0 · **Detector:** recipe
- **Shape:** A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash.
- **Detection:** `orig = (btn|lbl)\.(textContent|innerHTML)` +
- **Record (ledger row at S544):** - **`flash-restores-captured-text-not-its-key`** (NEW S417 — 2 FIXED `1f7f869`; S415 `38e5b62`): ACTIVE, streak 0. A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash. Detection: `orig = (btn|lbl)\.(textContent|innerHTML)` +
- **Archived full text (latest compaction copy):** - **`flash-restores-captured-text-not-its-key`** (NEW S417 — 2 FIXED `1f7f869`; S415 `38e5b62`): ACTIVE, streak 0. A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash. Detection: `orig = (btn|lbl)\.(textContent|innerHTML)` + …[full text: IMPROVEMENT_ARCHIVE.md]

## `visible-label-missing-from-the-accessible-name`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S531 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection `a416/labelname.
- **Detection:** ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 adds dialogs named by an absent `aria-labelledby` target (`c427/probe-dlgname.mjs`). EXEMPT: …[full text: IMPROVEMENT_ARCHIVE.md] — `a416/labelname.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`visible-label-missing-from-the-accessible-name`** (S415–S425: 4 fixes; **S427 the dictionary's Word Lists windows `ee5f6f2`**; **S531 parsha's card link FIXED `6e8b6848`**): ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 `c427/probe-dlgname.mjs`.
- **Archived full text (latest compaction copy):** - **`visible-label-missing-from-the-accessible-name`** (S415 `9856b9d`; S416 flash `66b8021`; S423 torah chips `0b481a8`; S425 the account chip `eb004eb`; **S427 the dictionary's Word Lists windows + fields `ee5f6f2`**): ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 adds dialogs named by an absent `aria-labelledby` target (`c427/probe-dlgname.mjs`). EXEMPT: …[full text: IMPROVEMENT_ARCHIVE.md]

## `designed-key-miss-probed-through-t`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S533 · **Streak:** 2 · **Detector:** recipe
- **Shape:** Detection: `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.
- **Detection:** `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.has`.
- **Record (ledger row at S544):** - **`designed-key-miss-probed-through-t`** (NEW S415; FM `gName()` FIXED `95d5f46`): ACTIVE, streak 2 (S533: 0 over 102 states + 10 surfaces; S416: 0 on the delta). Detection: `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.has`.

## `pinned-english-without-lang`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S533 · **Streak:** 0 · **Detector:** recipe
- **Detection:** - **`pinned-english-without-lang`** (NEW S415; `f4bbfe8` ×20; resources ×43; torah + trope; **S516 LL ×7 `e7d72c6e`**; **S533 an attribute twin: the parsha coloring sheets' picture `aria-label` English under `lang=he` ×54 `b05b759e`**; open: none): ACTIVE, streak 0. Detection: HE UI, visible Latin-only text outside `[data-i18n*]` whose `closest('[lang]')` ≠ en, by real clicks …[full text: IMPROVEM
- **Record (ledger row at S544):** - **`pinned-english-without-lang`** (NEW S415; `f4bbfe8` ×20; resources ×43; torah + trope; **S516 LL ×7 `e7d72c6e`**; **S533 an attribute twin: the parsha coloring sheets' picture `aria-label` English under `lang=he` ×54 `b05b759e`**; open: none): ACTIVE, streak 0. Detection:
- **Archived full text (latest compaction copy):** - **`pinned-english-without-lang`** (NEW S415; `f4bbfe8` ×20; resources ×43; torah + trope; **S516 LL ×7 `e7d72c6e`**; **S533 an attribute twin: the parsha coloring sheets' picture `aria-label` English under `lang=he` ×54 `b05b759e`**; open: none): ACTIVE, streak 0. Detection: HE UI, visible Latin-only text outside `[data-i18n*]` whose `closest('[lang]')` ≠ en, by real clicks …[full text: IMPROVEMENT_ARCHIVE.md]

## `toggle-name-flips-with-its-pressed-state`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S431 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Detection `f414/toggles2.
- **Detection:** real click per — `f414/toggles2.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`toggle-name-flips-with-its-pressed-state`** (NEW S414 `f9e67b2`; S416 trope tune `96275c2`; S430 found torah's Trope staff Tune all + every verse Tune; **S431 FIXED `aa97e2e`**): ACTIVE, streak 0 (last swept S430). Detection `f414/toggles2.mjs`: real click per
- **Archived full text (latest compaction copy):** - **`toggle-name-flips-with-its-pressed-state`** (NEW S414 `f9e67b2`; S416 trope tune `96275c2`; S430 found torah's Trope staff Tune all + every verse Tune; **S431 FIXED `aa97e2e`**): ACTIVE, streak 0 (last swept S430). Detection `f414/toggles2.mjs`: real click per …[full text: IMPROVEMENT_ARCHIVE.md]

## `author-display-defeats-the-hidden-attribute`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S511 · **Streak:** 0 · **Detector:** recipe
- **Detection:** rendered — `a472/hidrec.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`author-display-defeats-the-hidden-attribute`** (S414 `391114b`; **S511 letter_learner `#llVoiceRow` `d4c5e02`**; S416 FM `3bf0112`; S425 trope ×2; S430 torah ×2; **S472 torah lookup `306003c3`**; S472 detection `a472/hidrec.mjs`): ACTIVE, streak 0. Detection: rendered
- **Archived full text (latest compaction copy):** - **`author-display-defeats-the-hidden-attribute`** (S414 `391114b`; **S511 letter_learner `#llVoiceRow` `d4c5e02`**; S416 FM `3bf0112`; S425 trope ×2; S430 torah ×2; **S472 torah lookup `306003c3`**; S472 detection `a472/hidrec.mjs`): ACTIVE, streak 0. Detection: rendered `[hidden]` with display ≠ none (S430 …[full text: IMPROVEMENT_ARCHIVE.md]

## `button-group-label-not-programmatic`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S413 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`button-group-label-not-programmatic`** (**NEW S413 Pass C — resources ×8 rows FIXED `945b397`; generator, dictionary, hub unmeasured (no `role="group"` at all)**): ACTIVE, streak 0. A row of `aria-pressed` buttons sits under a visible label (a `<span>`, or a `<label>` with
- **Archived full text (latest compaction copy):** - **`button-group-label-not-programmatic`** (**NEW S413 Pass C — resources ×8 rows FIXED `945b397`; generator, dictionary, hub unmeasured (no `role="group"` at all)**): ACTIVE, streak 0. A row of `aria-pressed` buttons sits under a visible label (a `<span>`, or a `<label>` with …[full text: IMPROVEMENT_ARCHIVE.md]

## `settings-lost-across-a-load`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S551 · **Streak:** 1 · **Detector:** recipe
- **Record (S551):** name_tags clean (`h551/lessons.mjs` L7): font, nikkud, pronunciation style, transliteration mode, English, extra line + its text, four sizes, two colours, border, background, paper, per page, Avery, outlines set by real input, a reload, every one back (trap 353: set the style radios while they are enabled).
- **Shape:** A setting comes back changed after a reload.
- **Detection:** change each control by a real click, wait out the save, — `h482/dictsave.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`settings-lost-across-a-load`** (NEW S412; dictionary ×4 FIXED S482 `8d99ad93`, flash FIXED S491 `adce6574`; 0 open): ACTIVE, streak 0. A setting comes back changed after a reload. Detection (`h482/dictsave.mjs`): change each control by a real click, wait out the save,
- **Archived full text (latest compaction copy):** - **`settings-lost-across-a-load`** (NEW S412; dictionary ×4 FIXED S482 `8d99ad93`, flash FIXED S491 `adce6574`; 0 open): ACTIVE, streak 0. A setting comes back changed after a reload. Detection (`h482/dictsave.mjs`): change each control by a real click, wait out the save, reload, require it …[full text: IMPROVEMENT_ARCHIVE.md]

## `live-region-display-none-while-empty`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 1 · **Detector:** recipe
- **Record (S558):** trope clean — every `[role=status]`/`aria-live` region in a shown view is in the CDP tree while empty (9 states); the flagged ones sit inside hidden tab panels; plant fired (`m558/live.mjs`).
- **Record (S556):** dictionary: 2 hits — `#wlActiveBanner` (inline `display:none` until a list loads as a filter) and `#printSizeNote` (`hidden` until a large set) notRendered while empty in 10 states by CDP, both filled and shown by JS in one task; candidate (the governor). `#exportErr` notRendered only with its collapsed panel (the S553 shape); `#resultCount`, `#a11yStatus`, `#appToast` rendered empty; a `display:none` `role=status` plant fired 10/10.
- **Record (S554):** fontmaker clean: 13 regions × 7 views by CDP — `#statusMsg` (`:empty{padding-block:0}`) and `#nextStepHint` (refilled on every render) rendered while empty; `#nodeHint`, `#nsSel`, `#wizOsNameNote`, `#drawSelLive` notRendered only with their hidden row (the S553 shape); a `display:none` `role=status` plant fired.
- **Record (S553):** name_tags' 4 hits FIXED `2ba4ff9` — `:empty{position:absolute;margin:0}` (the flex-gap shape: in flow an empty line still takes its panel's gap); CDP in 4 cells: notRendered → `status` on the list and print notes and on the rename note once a real message is cleared (its row `hidden` until Rename opens, it is notRendered with the row — correct); every other box unmoved.
- **Record (S552):** name_tags: 4 hits — `.nt-note:empty{display:none}` on `#ntListNote`, `#ntRenameNote`, `#ntPrintNote`, `#ntTrNote` (`#ntTentNote` the same rule, text at load), CDP `notRendered` on each while empty; a planted hidden `role=status` fired. Candidate (the governor), one concern with `#ntFontMissing`.
- **Detection:** `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit); — `a530/fix1.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`live-region-display-none-while-empty`** (S408; **all 4 FIXED `efbc98a` S409**; **S530 4 more FIXED `66ecdc9f`, `a530/fix1.mjs`**): ACTIVE, streak 0. Detection: `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit);
- **Archived full text (latest compaction copy):** - **`live-region-display-none-while-empty`** (S408; **all 4 FIXED `efbc98a` S409**; **S530 4 more FIXED `66ecdc9f`, `a530/fix1.mjs`**): ACTIVE, streak 0. Detection: `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit); flex-wrap rows need `position:absolute`, not height.

## `dark-base-rule-outranks-variant`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 0 · **Detector:** recipe
- **Record (S558):** trope + torah FIXED `1feea8e` — `body.dark .font-opt{border-color:var(--border)}` outranked `.font-opt:hover`, so in dark none of the 16 Hebrew font cards moved; `body.dark .font-opt:hover{border-color:var(--gold)}` before `.active` (the generator's and dictionary's twin). Real mouse × 8 cells × 2 pages, HEAD the control: dark 0/16 → 16/16. Trope otherwise clean: 967 controls × 10 views × 2 themes (`m558/hover.mjs`; a dark tab plant fired 3/3). The dashboard's dark base rule sets only the fill, so its hover stands.
- **Record (S556):** dictionary clean: 2,778 (EN) + 2,762 (HE) controls × 12 views hovered by the real mouse in both themes — 0 whose light hover lacks a dark twin; a planted dark base rule on `.dict-tool-btn` fired 4/4. The sibling `dark-hover-resolves-to-the-rest-colour` shape: the 787 shoresh chips and the 4 toolbar buttons hover to `--warm-gray` = dark `--white` (only the border moves) — candidate.
- **Record (S555):** name_tags FIXED `05e585a`: `.nt-sb-tab` (the sidebar's hide / show edge tab) — `body.dark .nt-sb-tab` outranked its hover; `body.dark .nt-sb-tab:hover { background:#345090 }` (real mouse: #2a4070 → #345090; the pre-fix page unchanged, the control).
- **Record (S554):** fontmaker clean: 392 controls × 7 views hovered by the real mouse in both themes — 0 whose light hover lacks a dark twin (the 12 `.mark-sq` tiles move their gold border in dark while the fill stays the rest colour: the `dark-hover-resolves-to-the-rest-colour` shape, a P4 candidate); the plant — a dark base rule on `.ctl-btn` (`body.dark .ctl-btn{background:#1e2535 !important}`) — fired on 6 controls; a first plant on the ghost `tbtn` was silent because that class's light hover moves no fill (a plant must mirror the detector's own test).
- **Record (S552):** name_tags: 1 hit — the edge tab (`body.dark .nt-sb-tab` outranks `.nt-sb-tab:hover`; 28 controls hovered in both themes, the plant fired) — candidate (the governor); the same shape pre-empted on the four carriers' new dark Merge rule by its hover twin (`c1f42ae`).
- **Shape:** Detection: `m408/darkvariant.
- **Detection:** `m408/darkvariant.py` (comments stripped), then drive the state by a real click in both themes. — `m408/darkvariant.py` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`dark-base-rule-outranks-variant`** (S408; FIXED `4a5d353`, `b26f7d6`; EXEMPT the dead `.preset-item.drag-over` ×2): ACTIVE, streak 0. Detection: `m408/darkvariant.py` (comments stripped), then drive the state by a real click in both themes.

## `aria-disabled-lock-no-handler-checks`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** normal · **Last:** S407 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`aria-disabled-lock-no-handler-checks`** (**NEW, registered 2026-09-23 (S407 Pass P) — 1 carrier, fixed `e5c4784`**): ACTIVE, clean streak 0. A control marked busy or invalid by `aria-disabled="true"` whose activation handler never reads that state: the look says locked, a
- **Archived full text (latest compaction copy):** - **`aria-disabled-lock-no-handler-checks`** (**NEW, registered 2026-09-23 (S407 Pass P) — 1 carrier, fixed `e5c4784`**): ACTIVE, clean streak 0. A control marked busy or invalid by `aria-disabled="true"` whose activation handler never reads that state: the look says locked, a …[full text: IMPROVEMENT_ARCHIVE.md]

## `text-field-under-16px-zooms-on-ios-focus`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S556 · **Streak:** 0 · **Detector:** recipe
- **Record (S556):** flash FIXED ×2 — `#newProfileNameInput` 14.08 → 16px (+ `min-width:0`: the Save button back inside the dialog on an iPhone SE) `730e84e`; `.share-out` 11.84 → 16px `ffbd65b`; by descriptor against a HEAD copy; open carriers: 0 known.
- **Record (S555):** flash_cards 2 open carriers: `#newProfileNameInput` 14.08px (inline `0.88rem`, the profile picker) and `#shareCodeOutput` 11.84px (`.share-out`, readonly — a tap to copy still focuses it); P4s behind the governor (16px in the coarse-pointer rule, `!important` against the inline style). The 14 other text-like fields are 16px (`n555/common.mjs` fields arm; a 13px plant fired).
- **Detection:** computed …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **`text-field-under-16px-zooms-on-ios-focus`** (NEW S406; FIXED ×2; S465 contact ×4 `5a7a8ed`; S492 dictionary ×6 `07177214`; S506 torah ×17, trope ×3; S507 dashboard ×23, flash ×10; S508 resources ×6, account ×2; open: none): ACTIVE, streak 0.
- **Archived full text (latest compaction copy):** - **`text-field-under-16px-zooms-on-ios-focus`** (NEW S406; FIXED ×2; S465 contact ×4 `5a7a8ed`; S492 dictionary ×6 `07177214`; S506 torah ×17, trope ×3; S507 dashboard ×23, flash ×10; S508 resources ×6 `f07cd8c`, account ×2 `43b24e2`; open: none known): ACTIVE, streak 0. Detection: computed …[full text: IMPROVEMENT_ARCHIVE.md]

## `textContent-rewrite-erases-a-control-icon`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S501 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Add (d): load-time icon count.
- **Detection:** (a) EN→HE→EN icon count; (b) key census — `i453/genicon.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`textContent-rewrite-erases-a-control-icon`** (S405; S415; S453 `ac796dba`; **S501 generator Export PDF `d7355d03`**): ACTIVE, streak 0. Add (d): load-time icon count. Detection: (a) EN→HE→EN icon count; (b) key census
- **Archived full text (latest compaction copy):** - **`textContent-rewrite-erases-a-control-icon`** (S405; 7 writers FIXED `1e8991f`; flashes `53d3579`, `38e5b62`; **S453 the generator's Generate button `ac796dba`**): ACTIVE, streak 0. Missed by (a) (erased at load, before the first count) and (b) (a ternary writer); add (d): the markup's icons vs the rendered ones after load (`i453/genicon.mjs`). Detection: (a) EN→HE→EN icon count; (b) key census vs whole-control …[full text: IMPROVEMENT_ARCHIVE.md]

## `english-literal-passed-to-a-message-helper`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S533 · **Streak:** 1 · **Detector:** recipe
- **Detection:** backtick strings holding `${}` and a capitalized English word; `status|setStatus|showHintToast|askSvgError|toast(` args with an English literal outside `I18n.t`. Exempt: printed/projected content, key caps, keyed fallbacks. Open: FM `kernSideLabel`.
- **Record (ledger row at S544):** - **`english-literal-passed-to-a-message-helper`** (NEW S475): ACTIVE, streak 1 (S533: 0 over 4,328 added lines, plants 7/7).
- **Archived full text (latest compaction copy):** - **`english-literal-passed-to-a-message-helper`** (NEW S475 K; torah `resolveRef` ×3 `8d3f2c95`, FM `status()` ×7 + `askSvgError()` ×5 `02965f8f`): ACTIVE, streak 0. English built in a template literal or passed to a message helper, where Check A cannot see it. Detection (`k475/`): backtick strings holding `${}` and a capitalized English word; `status|setStatus|showHintToast|askSvgError|toast(` args with an English literal outside `I18n.t`. Exempt: printed/projected content, key caps, keyed fallbacks. Open: FM `kernSideLabel`.

## `translated-key-exists-page-hardcodes-english`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S533 · **Streak:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **`translated-key-exists-page-hardcodes-english`** (**S533 K: 0 new** — runtime EN-in-HE over 102 states + 10 surfaces, the 2 CSV twins content by design; streak 1. S461 K: 1 FIXED `74b2ee0c`, dictionary Bulk Copy count; streak 0. S433 K: 0 new — the orphan census 121 raw, 86
- **Archived full text (latest compaction copy):** - **`translated-key-exists-page-hardcodes-english`** (**S533 K: 0 new** — runtime EN-in-HE over 102 states + 10 surfaces, the 2 CSV twins content by design; streak 1. S461 K: 1 FIXED `74b2ee0c`, dictionary Bulk Copy count; streak 0. S433 K: 0 new — the orphan census 121 raw, 86 with a live English twin, all S405/S419 classes; the delta's surfaces by a runtime EN-in-HE detector, 3 …[full text: IMPROVEMENT_ARCHIVE.md]

## `per-page-code-inside-a-shared-block`
- **Status:** DRAFT · **Owner:** E · **Consequence:** normal · **Last:** S416 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`per-page-code-inside-a-shared-block`** (**NEW, registered 2026-09-22 (S403 Pass E) — 2 carriers, both fixed `6e28af3`**): ACTIVE, clean streak 1 (S416). Page code pasted INSIDE a `═══` block instead of below its end
- **Archived full text (latest compaction copy):** - **`per-page-code-inside-a-shared-block`** (**NEW, registered 2026-09-22 (S403 Pass E) — 2 carriers, both fixed `6e28af3`**): ACTIVE, clean streak 1 (**S416: 15 blocks sha-identical; folder-tree CSS/JS apart**). Page code pasted INSIDE a `═══` block instead of below its end marker, so the block is no longer byte-identical and the next …[full text: IMPROVEMENT_ARCHIVE.md]

## `icon-markup-into-a-textContent-writer`
- **Status:** DRAFT · **Owner:** E · **Consequence:** normal · **Last:** S403 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`icon-markup-into-a-textContent-writer`** (**NEW, registered 2026-09-22 (S403 Pass E) — 1 carrier (2 buttons), fixed `7552ba0`**): ACTIVE, clean streak 0. An `ICON_*`/`FT_ICON_*`/`HK_ICON` SVG const reaches a helper that writes `textContent`, so the button prints its SVG
- **Archived full text (latest compaction copy):** - **`icon-markup-into-a-textContent-writer`** (**NEW, registered 2026-09-22 (S403 Pass E) — 1 carrier (2 buttons), fixed `7552ba0`**): ACTIVE, clean streak 0. An `ICON_*`/`FT_ICON_*`/`HK_ICON` SVG const reaches a helper that writes `textContent`, so the button prints its SVG …[full text: IMPROVEMENT_ARCHIVE.md]

## `cached-rejected-loader-promise-blocks-every-retry`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S399 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but
- **Archived full text (latest compaction copy):** - **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but …[full text: IMPROVEMENT_ARCHIVE.md]

## `cdn-dependency-absent-and-unguarded`
- **Status:** ACTIVE · **Owner:** B · **Consequence:** normal · **Last:** S399 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the
- **Archived full text (latest compaction copy):** - **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the …[full text: IMPROVEMENT_ARCHIVE.md]

## `selector-declared-twice-in-one-stylesheet`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S399 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the
- **Archived full text (latest compaction copy):** - **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the …[full text: IMPROVEMENT_ARCHIVE.md]

## `untrusted-card-field-interpolated-unescaped`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** critical · **Last:** S393 · **Streak:** 0 · **Detector:** recipe
- **Detection:** no explicit method recorded; consequence-critical, so it stays ACTIVE and the record's shape sentence is the recipe until the next A writes an explicit one (grep the shape's named call or attribute over the delta).
- **Record (ledger row at S544):** - **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is
- **Archived full text (latest compaction copy):** - **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is …[full text: IMPROVEMENT_ARCHIVE.md]

## `auth-param-read-before-its-cleanup-runs`
- **Status:** ACTIVE · **Owner:** P · **Consequence:** critical · **Last:** S390 · **Streak:** 0 · **Detector:** recipe
- **Detection:** no explicit method recorded; consequence-critical, so it stays ACTIVE and the record's shape sentence is the recipe until the next A writes an explicit one (grep the shape's named call or attribute over the delta).
- **Record (ledger row at S544):** - **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer`
- **Archived full text (latest compaction copy):** - **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer` …[full text: IMPROVEMENT_ARCHIVE.md]

## `hover-feedback-survives-the-disabled-state`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** critical · **Last:** S394 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`,
- **Archived full text (latest compaction copy):** - **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`, …[full text: IMPROVEMENT_ARCHIVE.md]

## `physical-property-that-never-mirrors`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S534 · **Streak:** 0 · **Detector:** recipe
- **Detection:** grep
- **Record (ledger row at S544):** - **`physical-property-that-never-mirrors`** (registered S388 K; S438 torah `947b452d`; S508 dashboard ×5 `323ad66`; S534 dashboard `#ttsRateVal` `c9ab327`; open 0): ACTIVE, streak 0. Detection: grep
- **Archived full text (latest compaction copy):** - **`physical-property-that-never-mirrors`** (registered S388 K; S438 torah's jump bar `947b452d`; S508 M dashboard ×5 FIXED `323ad66` — the three centered modals' and the tour card's × + title margins, the edit pencil; open: `#ttsRateVal` inline `text-align:right`; deliberate, logged: the fullscreen exit plate + zoom-bar pair, `.wake-dot-fs`): ACTIVE, streak 0. A physical `margin-`/`padding-`/`border-left|right`, `left`/`right` inset, `text-align:left|right` or `float` on content that mirrors under `dir=rtl`. **Detection:** grep …[full text: IMPROVEMENT_ARCHIVE.md]

## `tile-grid-built-hidden-never-roved`
- **Status:** DRAFT · **Owner:** P · **Consequence:** normal · **Last:** S382 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`,
- **Archived full text (latest compaction copy):** - **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`, …[full text: IMPROVEMENT_ARCHIVE.md]

## `stored-json-of-the-wrong-shape-trusted`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S502 · **Streak:** 0 · **Detector:** recipe
- **Detection:** `a502/dash-shape.mjs`. — `a502/dash-shape.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S502: Bulk edit `c35aec8d`; streak 0.** Detection: `a502/dash-shape.mjs`.
- **Archived full text (latest compaction copy):** - **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S444 (Pass A): 1 NEW carrier FIXED `2854e747` — torah's Favorites: a string row threw on Recolor/Duplicate (strict mode); streak 0.** **S379: a SCALAR sibling FIXED (`4f9a2e7`, the shared `.ivrit` engine's `setIvritMode` …[full text: IMPROVEMENT_ARCHIVE.md]

## `validation-note-stores-rendered-text`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 0 · **Hits:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's
- **Archived full text (latest compaction copy):** - **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

## `popup-without-a-keyboard-contract`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 2 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new
- **Archived full text (latest compaction copy):** - **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new …[full text: IMPROVEMENT_ARCHIVE.md]

## `stale-validation-note-after-its-input-changes`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 0 · **Hits:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.**
- **Archived full text (latest compaction copy):** - **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.** …[full text: IMPROVEMENT_ARCHIVE.md]

## `apply-settings-trusts-collection-members`
- **Status:** ACTIVE · **Owner:** L · **Consequence:** critical · **Last:** S387 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED, so every later load rethrows — never retires). **S387: the axis swept to completion across ALL FOUR `.ivrit` engine carriers — 254 cells through the real restore path
- **Archived full text (latest compaction copy):** - **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED, so every later load rethrows — never retires). **S387: the axis swept to completion across ALL FOUR `.ivrit` engine carriers — 254 cells through the real restore path …[full text: IMPROVEMENT_ARCHIVE.md]

## `save-over-an-existing-name-without-confirm`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other
- **Archived full text (latest compaction copy):** - **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other …[full text: IMPROVEMENT_ARCHIVE.md]

## `fixed-surface-missing-from-the-print-hide-list`
- **Status:** ACTIVE · **Owner:** G · **Consequence:** normal · **Last:** S563 · **Streak:** 1 · **Detector:** recipe
- **Record (S563, G generator):** clean — 36 shapes × 2 cells in print media: 0 fixed or sticky boxes over 400 px² visible (the plant, a fixed box, fired in both cells). A screen-only *in-flow* notice is the same family: the QR's "too many items" note printed on student copies (FIXED `7f8a628`, print hide plus `onclone`).
- **Record (S550, G name_tags):** the page's own surfaces clean — 12 states by real clicks (toast, tour, keyboard, edge tab, paste, import choice, rename, install banner with pwa.js's own rule) print nothing outside the sheets (plant: a fixed box → on paper). 1 HIT, suite-wide: the `.ivrit` engine's Merge/Replace ask overlay is an inline-styled fixed div with no id or class (`ivritAskMode`), and `js/ivrit-account.js`' `.ivacct-modal` and `js/ivrit-saves.js`' `.ivsav-overlay` carry no print rule either — open during Ctrl+P, each prints over every sheet (Candidate: a shared-block change across the six carriers and the hub).
- **Record (ledger row at S544):** - **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S496: `.bpe-*` FIXED `4c4dd3ae`.** **S392 (Pass G, `hebrew_blend_generator.html`): swept CLEAN — first clean sweep since registration, clean
- **Archived full text (latest compaction copy):** - **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S495 (G, dashboard): 1 HIT OPEN — Bulk preset edit's `.bpe-*` (added outside the loop); streak → 0.** **S392 (Pass G, `hebrew_blend_generator.html`): swept CLEAN — first clean sweep since registration, clean streak 0 → 1.** 36 print-media cells (18 printable shapes × EN light / HE dark, at the 749px Letter content …[full text: IMPROVEMENT_ARCHIVE.md]

## `control-class-without-a-hover-state`
- **Status:** ACTIVE · **Owner:** L · **Consequence:** normal · **Last:** S373 · **Streak:** 0 · **Detector:** recipe
- **Detection:** a class with `cursor:pointer` or
- **Record (ledger row at S544):** - **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or
- **Archived full text (latest compaction copy):** - **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or …[full text: IMPROVEMENT_ARCHIVE.md]

## `false-clean-from-a-literal-only-pattern-match`
- **Status:** ACTIVE · **Owner:** O · **Consequence:** critical · **Last:** S309 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so
- **Archived full text (latest compaction copy):** - **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

## `false-clean-from-an-unverified-probe-handle`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S502 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (never retires). **S502 +1: `BASE` read at import; assert `page.url()`.**
- **Archived full text (latest compaction copy):** - **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **THREE MORE ARTIFACTS at 2026-09-15 (S385 Pass A), all caught before a verdict, and two of them false POSITIVES rather than false cleans — the …[full text: IMPROVEMENT_ARCHIVE.md]

## `light-literal-text-on-the-gold-token`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S399 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`light-literal-text-on-the-gold-token`** (registered 2026-09-17 (S396)): ACTIVE — **S399 (Pass A), FIRST real sweep: 7 NEW carriers, all on `hebrew_dictionary.html`, all fixed `273f449`; clean streak stays 0.** `color:#fff` (or another light literal) painted on `var(--gold)`
- **Archived full text (latest compaction copy):** - **`light-literal-text-on-the-gold-token`** (registered 2026-09-17 (S396)): ACTIVE — **S399 (Pass A), FIRST real sweep: 7 NEW carriers, all on `hebrew_dictionary.html`, all fixed `273f449`; clean streak stays 0.** `color:#fff` (or another light literal) painted on `var(--gold)` …[full text: IMPROVEMENT_ARCHIVE.md]

## `sub-floor touch target`
- **Status:** ACTIVE · **Owner:** E · **Consequence:** normal · **Last:** S553 · **Streak:** 0 · **Detector:** recipe
- **Record (S553):** name_tags: the five size sliders (16 px) and the fold button (23.5) FIXED `abb81be` (`height:24px`, the LL rule; `min-height:24px`); 4 cells vs HEAD, the page's under-24 census 32 → 26 / 30 → 24 (what stays: labelled 18 px boxes, hidden file inputs, the resize seam, the edge tab); the S548 C candidate closed.
- **Detection:** visible controls < …[full text: IMPROVEMENT_ARCHIVE.md] — `b529/fix4.mjs` is a scratchpad path that was never committed: port it to `scripts/loop/detect-<id>.mjs` (with `--plant`) at the next A, or the row goes DRAFT.
- **Record (ledger row at S544):** - **`sub-floor touch target`**: ACTIVE. **S531: parsha_emojis' 7 popup sliders + its card link (23px HE) FIXED `0c8a2bba`.** **S529: LL sliders FIXED `84154c76`.** **S516 FM ×4 `36e804ac`.** **S513 dashboard ×2 `787c434`.** **S483 hub clean.** **S456: `85e294b2`,
- **Archived full text (latest compaction copy):** - **`sub-floor touch target`**: ACTIVE. **S529: LL sliders FIXED `84154c76`; open: parsha_emojis' 7 popup sliders (`b529/fix4.mjs`) + its card link (23px HE, S530).** **S516 FM ×4 `36e804ac`.** **S513 dashboard ×2 `787c434`.** **S483 hub clean.** **S456: `85e294b2`, `924c9407`.** Detection: visible controls < …[full text: IMPROVEMENT_ARCHIVE.md]

## `vh-capped-sheet-without-dvh-twin`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S385 · **Streak:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`,
- **Archived full text (latest compaction copy):** - **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`, …[full text: IMPROVEMENT_ARCHIVE.md]

## `ledger-section-loss`
- **Status:** ACTIVE · **Owner:** F · **Consequence:** normal · **Last:** S296 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out
- **Archived full text (latest compaction copy):** - **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full text: IMPROVEMENT_ARCHIVE.md]

## `dark-mode-token-as-text-on-a-light-ground`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S534 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **`dark-mode-token-as-text-on-a-light-ground`** (**REOPENED S413 Pass C — contact's script-written success line FIXED `f40d142`; S534 the generator's `sub.style.color` print half `a153826`; screen gold = S141's keep, C's call**): ACTIVE, streak 0.
- **Archived full text (latest compaction copy):** - **`dark-mode-token-as-text-on-a-light-ground`** (**REOPENED S413 Pass C — a 3rd carrier the CSS grep could not see: contact's script-written success line, `var(--gold)` 2.75:1 on light, FIXED `f40d142`; open: the generator's `sub.style.color` (A's) — **S534: its print half converged `a153826` (the `ws-ak-subtitle` hook); its screen gold is all 12 teacher-copy subtitles' (S141's keep, 2.75:1 light) — C's call**)**: ACTIVE, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

## `non-finite-number-from-a-loaded-file`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S458 · **Streak:** 0 · **Detector:** recipe
- **Detection:** no explicit method recorded; consequence-critical, so it stays ACTIVE and the record's shape sentence is the recipe until the next A writes an explicit one (grep the shape's named call or attribute over the delta).
- **Record (ledger row at S544):** - **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S458 FM `fitScale` `2bb2ead0`; S374 torah, trope.** Open 0, streak 0.
- **Archived full text (latest compaction copy):** - **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S458: FM `fitScale` FIXED `2bb2ead0` (a loaded sheet's raw 1e999 gave a boxed letter a NaN transform). S374: torah ×2 `31a84f7`, trope ×2 `5d1d13a` (`_sliderNum`). Open 0, streak 0.** Shape: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

## `slider-focus-lost-to-its-own-rebuild`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S286 · **Streak:** 0 · **Hits:** 6 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper
- **Archived full text (latest compaction copy):** - **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: IMPROVEMENT_ARCHIVE.md]

## `class-only-selected-state`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 0 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0,
- **Archived full text (latest compaction copy):** - **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

## `animation-outside-its-reduced-motion-block`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 2 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286
- **Archived full text (latest compaction copy):** - **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

## `help-affordance-inside-a-label-forwards-its-tap`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S284 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a
- **Archived full text (latest compaction copy):** - **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

## `csv-cell-quoting-integrity`
- **Status:** ACTIVE · **Owner:** I · **Consequence:** normal · **Last:** S281 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**,
- **Archived full text (latest compaction copy):** - **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

## `dark-print-shadow-slab`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S385 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print
- **Archived full text (latest compaction copy):** - **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print …[full text: IMPROVEMENT_ARCHIVE.md]

## `latin-sentence-boundary-in-hebrew-prose`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S554 · **Streak:** 0 · **Detector:** `scripts/loop/detect-latin-sentence-boundary-in-hebrew-prose.mjs`
- **Shape:** In a Hebrew sentence a Latin term ends one sentence and a Latin term opens the next ("…לחצו על Install Font. Windows: לחצו…"): the bidi algorithm resolves the period and the space between two strong-LTR runs as LTR, so "Install Font. Windows:" becomes one left-to-right island — the reader meets the next sentence's first word before this one's end, and the period sits mid-island. The sibling `pinned-english-prose-in-rtl-paragraph` is the pinned-span version; this one needs no markup at all to go wrong.
- **Detection:** the committed detector, static over `locales/ui-strings.csv`'s `he` column (tags stripped; each `\n` segment on its own, so a list or paragraph break is exempt): `<Latin | digit | closing bracket><.?!><spaces><Latin capital>` with no U+200F between; `--plant` adds one row and must report it; `closeout.mjs` runs both. Runtime confirmation (S554, `m554/rtl.mjs`): the Range x-order of the phrase and of its period in the HE UI — a period whose box sits right of its phrase is the hit; a planted `<span dir=ltr>roster.csv.</span>` fired on every help tab.
- **Fix shape:** a right-to-left mark (U+200F, the literal character, as the CSV already writes it after a Latin run that a Hebrew comma or period follows — `TrueType‹RLM›, WOFF2`) right after the terminator; never a `dir` span (the sibling pattern's trap). Then `node scripts/build-locales.js`.
- **Carriers:** 9 sites in 7 strings FIXED S554: the Font Maker's help (export ×1, licenses ×1, share ×3) and FAQ (install ×1), the dictionary's export instructions, the generator's page-size tooltip, the privacy page's analytics paragraph. `privacy.legal.thirdparty` is exempt by its `\n` list.
- **Record (S554):** NEW — found by M's RTL-prose arm on the Font Maker's Hebrew help (5 of the 37 mixed Hebrew-and-Latin blocks across its 14 tabs); the static sweep then found 4 more in 3 other tools; all 9 FIXED, 0 open; the plant fires; the runtime arm reads 0 of 37 blocks after the fix.

## `pinned-english-prose-in-rtl-paragraph`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 4 · **Detector:** recipe
- **Record (S558):** trope clean — HE × 13 views incl. all 9 tour steps: 0; plant 1/1 (`m558/rtl.mjs`).
- **Record (S556):** dictionary clean: 0 pinned-span hits over 120 mixed blocks × 13 HE views incl. all 7 tour steps; a pinned `<span dir=ltr>roster.csv.</span>` plant fired in the sidebar and the tour card.
- **Record (S554):** fontmaker clean: 0 pinned-span hits over 37 mixed blocks × 14 help tabs + 9 views; the 5 period-mid-island hits are the new sibling `latin-sentence-boundary-in-hebrew-prose` (FIXED `bf895ee`); a pinned `<span dir=ltr>roster.csv.</span>` plant fired 14/14.
- **Record (S552):** name_tags clean: the HE UI's one sentence mixing Hebrew and Latin ("… ב־roster.csv.") ends with its period at the left; a pinned `<span dir=ltr>Avery 5395.</span>` plant fired.
- **Shape:** Detection: Range x-order of the phrase and its period in the HE UI; exempt lists, single runs, print.
- **Detection:** Range x-order of the phrase and its period in the HE UI; exempt lists, single runs, print.
- **Record (ledger row at S544):** - **pinned-english-prose-in-rtl-paragraph** (NEW S277; FIXED ×3; contact's server note open): ACTIVE, streak 0. Detection: Range x-order of the phrase and its period in the HE UI; exempt lists, single runs, print.

## `fixed-width-third-party-embed-inflates-phone-layout`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S276 · **Streak:** 0 · **Hits:** 2 · **Detector:** recipe
- **Record (ledger row at S544):** - **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources
- **Archived full text (latest compaction copy):** - **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full text: IMPROVEMENT_ARCHIVE.md]

## `stale-html-fallback-behind-its-csv-value`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S533 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **stale-html-fallback-behind-its-csv-value**: ACTIVE, clean streak 0. **S533 (K, `k533/stale.py`, html.parser with exact offsets, 2,974 sites, plant 1/1): 1 FIXED `2c82a0b9` — the LL subtitle, stale since 10-17 (S519's K ran no html arm: run it every K); the generator's 4
- **Archived full text (latest compaction copy):** - **stale-html-fallback-behind-its-csv-value**: ACTIVE, clean streak 0. **S533 (K, `k533/stale.py`, html.parser with exact offsets, 2,974 sites, plant 1/1): 1 FIXED `2c82a0b9` — the LL subtitle, stale since 10-17 (S519's K ran no html arm: run it every K); the generator's 4 `<br>` tooltips and the dashboard's `&#10;` placeholder are normalisation.** **S475: 2 FIXED `ca67ec0d`.** **S447 (K, `k447/stale.py` html.parser census, plants 2/2): 4 hits = S432's …[full text: IMPROVEMENT_ARCHIVE.md]

## `undocumented-global-keyboard-shortcut`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 2 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **undocumented-global-keyboard-shortcut**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `document`-level `keydown` handlers (the erase gate's is scoped to its overlay: Escape + Tab trap, exempt shapes) — hits 0, clean streak 2.** S264 1 hit fixed (`f65ce58`);
- **Archived full text (latest compaction copy):** - **undocumented-global-keyboard-shortcut**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `document`-level `keydown` handlers (the erase gate's is scoped to its overlay: Escape + Tab trap, exempt shapes) — hits 0, clean streak 2.** S264 1 hit fixed (`f65ce58`); …[full text: IMPROVEMENT_ARCHIVE.md]

## `fixed-size-control-holding-translatable-text`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S264 · **Streak:** 1 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **fixed-size-control-holding-translatable-text**: **re-swept 2026-08-27 (S264 iter 3), WIDENED PAST ITS REGISTERED BLIND SPOT for the first time -- hits: 0 real. Clean streak: 1 -- ACTIVE.** Sweep 2 measured the shape sweep 1 could not see: leaf elements carrying NO
- **Archived full text (latest compaction copy):** - **fixed-size-control-holding-translatable-text**: **re-swept 2026-08-27 (S264 iter 3), WIDENED PAST ITS REGISTERED BLIND SPOT for the first time -- hits: 0 real. Clean streak: 1 -- ACTIVE.** Sweep 2 measured the shape sweep 1 could not see: leaf elements carrying NO …[full text: IMPROVEMENT_ARCHIVE.md]

## `legibility-destroyed-by-a-second-dimming-layer`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S263 · **Streak:** 0 · **Hits:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **legibility-destroyed-by-a-second-dimming-layer**: **re-swept 2026-08-27 (S263, all 3 `#fsExitBtn` carriers) -- hits: 1 (`hebrew_blend_generator.html`, the LAST unfixed carrier), fixed in-pass (`eb0eab3`); clean streak: 0 -- ACTIVE, consequence-critical (legibility), never
- **Archived full text (latest compaction copy):** - **legibility-destroyed-by-a-second-dimming-layer**: **re-swept 2026-08-27 (S263, all 3 `#fsExitBtn` carriers) -- hits: 1 (`hebrew_blend_generator.html`, the LAST unfixed carrier), fixed in-pass (`eb0eab3`); clean streak: 0 -- ACTIVE, consequence-critical (legibility), never …[full text: IMPROVEMENT_ARCHIVE.md]

## `fixed-control-positioned-outside-the-viewport`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S563 · **Streak:** 0 · **Hits:** 3 · **Detector:** recipe
- **Record (S563):** the S562 P3 FIXED `00c7d7a`: the shared tour engine clamps to `documentElement.clientWidth/Height`. Every step, iPhone 13 portrait → landscape → portrait (`n562/tourflip-suite.mjs`, HEAD copies the control): trope EN 2 → 0, Name Tags EN 2 → 0, the Letter Learner 0 → 0. Desktop × 8 cells × 3 pages: every card rect equals HEAD's. The six per-page engines carry the same line, with no stranding measured from it there.
- **Record (S562):** trope_tutor — two carriers the at-rest census cannot see. (1) The Melody tip on a phone held sideways: no room above or below its icon, 38 / 49 px off the bottom — FIXED `4b16e61` (pinned inside the window). (2) The shared tour engine after a flip: `_tourReposition` clamps to `innerWidth`/`innerHeight`, which read the zoomed-out viewport for the one `resize` a flip fires while the card still sits at its old place (461 for 390) — trope EN steps 8–9 and Name Tags EN 4–5 stranded; P3 (the clamp to `documentElement.clientWidth/Height` measured 2 → 0 on both). Detection extends to a flip mid-state (`setViewportSize` portrait ⇄ landscape on the descriptor) and every tip opened in landscape, judged by `clientWidth/clientHeight` (`n562/tourflip-suite.mjs`, `tip-suite.mjs`).
- **Record (S555):** flash_cards clean: 0 fixed elements outside the viewport in 256 cells (a sticky bar scrolled away at the page's end is its natural position, not a hit; a fixed plant at left:−40 fired).
- **Record (ledger row at S544):** - **fixed-control-positioned-outside-the-viewport**: **REGISTERED + first swept suite-wide 2026-08-26 (S262 Pass N) -- hits: 1 carrier (`hebrew_blend_generator.html` `#sidebarToggleBtn`), fixed in-pass (`5f6a0a0`); census 78 cells (13 pages x 3 phone descriptors x EN/HE)
- **Archived full text (latest compaction copy):** - **fixed-control-positioned-outside-the-viewport**: **REGISTERED + first swept suite-wide 2026-08-26 (S262 Pass N) -- hits: 1 carrier (`hebrew_blend_generator.html` `#sidebarToggleBtn`), fixed in-pass (`5f6a0a0`); census 78 cells (13 pages x 3 phone descriptors x EN/HE) …[full text: IMPROVEMENT_ARCHIVE.md]

## `executable-javascript-in-a-localization-cell`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S357 · **Streak:** 1 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **executable-javascript-in-a-localization-cell**: ACTIVE (consequence-critical: security-shaped, never retires). **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows carry no handler or URL; Check C1 clean over 5140 keys × 2 columns — hits 0, clean streak 1.**
- **Archived full text (latest compaction copy):** - **executable-javascript-in-a-localization-cell**: ACTIVE (consequence-critical: security-shaped, never retires). **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows carry no handler or URL; Check C1 clean over 5140 keys × 2 columns — hits 0, clean streak 1.** …[full text: IMPROVEMENT_ARCHIVE.md]

## `i18n-html-markup-only-in-fallback`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 1 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **i18n-html-markup-only-in-fallback**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows and their sites carry no markup (plain `data-i18n` / `I18n.t()`) — hits 0, clean streak 1.** Registered S260 (21 fixed), S261 re-swept (2 fixed `ae95aba`).
- **Archived full text (latest compaction copy):** - **i18n-html-markup-only-in-fallback**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows and their sites carry no markup (plain `data-i18n` / `I18n.t()`) — hits 0, clean streak 1.** Registered S260 (21 fixed), S261 re-swept (2 fixed `ae95aba`). …[full text: IMPROVEMENT_ARCHIVE.md]

## `global-keydown-preventDefault-without-target-guard`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S272 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **global-keydown-preventDefault-without-target-guard** (**NEW, registered 2026-08-28 (S272 Pass A) from S271’s `38ab28f`**): a document/window-level `keydown` handler that calls `preventDefault()` on Enter/Space (or another activation/printable key) with no interactive-target
- **Archived full text (latest compaction copy):** - **global-keydown-preventDefault-without-target-guard** (**NEW, registered 2026-08-28 (S272 Pass A) from S271’s `38ab28f`**): a document/window-level `keydown` handler that calls `preventDefault()` on Enter/Space (or another activation/printable key) with no interactive-target …[full text: IMPROVEMENT_ARCHIVE.md]

## `row-siblings-with-mismatched-heights`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S556 · **Streak:** 1 · **Detector:** recipe
- **Record (S556):** dictionary clean: the header's 5 controls 30 ×5 in 4 cells (the S362 fix holds), the mode switcher 24 ×3; the toolbar's 30 beside the 32px print note is S362's known border.
- **Record (ledger row at S544):** - **row-siblings-with-mismatched-heights**: ACTIVE. **S385 (Pass A): 1 hit FIXED — `hebrew_blend_generator.html`'s account chip (`0a46f67`) stood 41px at top 14 beside five 35px controls at top 17, because `.ivacct` carries `align-self:stretch` and that header's flex line is its
- **Archived full text (latest compaction copy):** - **row-siblings-with-mismatched-heights**: ACTIVE. **S385 (Pass A): 1 hit FIXED — `hebrew_blend_generator.html`'s account chip (`0a46f67`) stood 41px at top 14 beside five 35px controls at top 17, because `.ivacct` carries `align-self:stretch` and that header's flex line is its …[full text: IMPROVEMENT_ARCHIVE.md]

## `debounced-persistence-with-no-page-hide-flush`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S258 · **Streak:** 0 · **Hits:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **debounced-persistence-with-no-page-hide-flush**: **re-swept 2026-08-26 (S258 Pass A) - hits: 1 NEW carrier (`classroom_dashboard.html`), fixed in-pass (`cf244df`); clean streak: 0 - ACTIVE, consequence-critical (data loss), never retires on streak.** **The hit widens the
- **Archived full text (latest compaction copy):** - **debounced-persistence-with-no-page-hide-flush**: **re-swept 2026-08-26 (S258 Pass A) - hits: 1 NEW carrier (`classroom_dashboard.html`), fixed in-pass (`cf244df`); clean streak: 0 - ACTIVE, consequence-critical (data loss), never retires on streak.** **The hit widens the …[full text: IMPROVEMENT_ARCHIVE.md]

## `state-mutation-that-never-arms-its-persistence`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S257 · **Streak:** 0 · **Hits:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **state-mutation-that-never-arms-its-persistence**: **re-swept 2026-08-26 (S257) - hits: 1, the knowingly-deferred `setInputMode`, now fixed (`57abf9c`); clean streak: 0 - ACTIVE (consequence-critical: data loss, so it never retires on streak).** **The fix shape is the finding
- **Archived full text (latest compaction copy):** - **state-mutation-that-never-arms-its-persistence**: **re-swept 2026-08-26 (S257) - hits: 1, the knowingly-deferred `setInputMode`, now fixed (`57abf9c`); clean streak: 0 - ACTIVE (consequence-critical: data loss, so it never retires on streak).** **The fix shape is the finding …[full text: IMPROVEMENT_ARCHIVE.md]

## `flex-column-crushing-its-own-rows`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 1 · **Detector:** recipe
- **Record (S555):** flash_cards clean: no crushed rows in the ladder, weaknesses, profile-picker or backup dialogs on the SE or in i13 landscape; the plant needs `min-height:0` rows — flex items with `min-height:auto` overflow instead of crushing (then it is `window-taller…`'s shape).
- **Record (ledger row at S544):** - **flex-column-crushing-its-own-rows** (**NEW, registered 2026-08-23 (S249 Pass N arm 4)**): a `display:flex; flex-direction:column` container that is ALSO height-constrained and scrollable (`max-height`/`flex:1` + `overflow-y:auto`) silently **compresses its children instead
- **Archived full text (latest compaction copy):** - **flex-column-crushing-its-own-rows** (**NEW, registered 2026-08-23 (S249 Pass N arm 4)**): a `display:flex; flex-direction:column` container that is ALSO height-constrained and scrollable (`max-height`/`flex:1` + `overflow-y:auto`) silently **compresses its children instead …[full text: IMPROVEMENT_ARCHIVE.md]

## `translated-sibling stray`
- **Status:** DRAFT · **Owner:** H · **Consequence:** normal · **Last:** S336 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **translated-sibling stray** **S336: +1 carrier FIXED `c1e4427` — the Font Maker's nine raw `.name` display sites (header, drop zone, mark-editor modal, 4 toasts) now go through `gName()`, the sibling the tiles already used.**  (a display site rendering a raw English
- **Archived full text (latest compaction copy):** - **translated-sibling stray** **S336: +1 carrier FIXED `c1e4427` — the Font Maker's nine raw `.name` display sites (header, drop zone, mark-editor modal, 4 toasts) now go through `gName()`, the sibling the tiles already used.**  (a display site rendering a raw English …[full text: IMPROVEMENT_ARCHIVE.md]

## `mobile-input-hints`
- **Status:** DRAFT · **Owner:** I · **Consequence:** normal · **Last:** S534 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **mobile-input-hints** (a text field for Hebrew, names, numbers or codes shipping without `inputmode`/`autocapitalize`/`autocorrect`/`spellcheck` fitting its content) | **ACTIVE — UN-RETIRED S411; S534 Name Tags ×7 FIXED `c156628`** (retired S343; the S267 row is in the
- **Archived full text (latest compaction copy):** - **mobile-input-hints** (a text field for Hebrew, names, numbers or codes shipping without `inputmode`/`autocapitalize`/`autocorrect`/`spellcheck` fitting its content) | **ACTIVE — UN-RETIRED S411; S534 Name Tags ×7 FIXED `c156628`** (retired S343; the S267 row is in the archive): account.html's `#nameInput` …[full text: IMPROVEMENT_ARCHIVE.md]

## `i18n cross-column parity (placeholders, plurals, inline markup)`
- **Status:** ACTIVE · **Owner:** K · **Consequence:** normal · **Last:** S533 · **Streak:** 2 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **i18n cross-column parity (placeholders, plurals, inline markup)**: **S533 (K): 41 raw `{placeholder}` mismatches over 6,593 keys, all the `.one` shape — hits 0, streak 2.** **re-swept 2026-09-03 (S320 Pass K, detector 1 only): `{placeholder}` sets en vs he over 5,128 keys,
- **Archived full text (latest compaction copy):** - **i18n cross-column parity (placeholders, plurals, inline markup)**: **S533 (K): 41 raw `{placeholder}` mismatches over 6,593 keys, all the `.one` shape — hits 0, streak 2.** **re-swept 2026-09-03 (S320 Pass K, detector 1 only): `{placeholder}` sets en vs he over 5,128 keys, raw 30 → hits: 0 — all thirty are the S261-refuted `.one` plural shape (Hebrew spells the singular number; …[full text: IMPROVEMENT_ARCHIVE.md]

## `horizontal-overflow-at-narrow-widths`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 0 · **Hits:** 2 · **Detector:** recipe
- **Record (S555):** flash_cards FOUND + FIXED `8198628` (the clipped variant): a saved preset's row needs 426 px (EN) / 380 (HE) and `.panel` clips — Move ▾ 125/82/60 px past the panel on SE/i13/Pixel 7, the ⧉ and × with it on the SE, a profile's row on the SE; `.preset-item { flex-wrap: wrap }` under the 526px header query. Found only by a real preset save (S361's seed had no preset). Census 16 cells × 16 views: 0 `scrollWidth` overflow; escapes measured against `documentElement.clientWidth` (trap 352).
- **Record (ledger row at S544):** - **horizontal-overflow-at-narrow-widths**: **re-swept 2026-09-03 (S334 Pass N, `torah_trainer.html`, 12 real-descriptor loads × 10 views incl. the S324 presentation toolbar) — hits: 1, the clipped-not-scrolled variant (`.tt-fs-plate` 340px in a 320px viewport, −10..330, A− and
- **Archived full text (latest compaction copy):** - **horizontal-overflow-at-narrow-widths**: **re-swept 2026-09-03 (S334 Pass N, `torah_trainer.html`, 12 real-descriptor loads × 10 views incl. the S324 presentation toolbar) — hits: 1, the clipped-not-scrolled variant (`.tt-fs-plate` 340px in a 320px viewport, −10..330, A− and …[full text: IMPROVEMENT_ARCHIVE.md]

## `hover-only-affordance-under-a-synthetic-mouse-event`
- **Status:** ACTIVE · **Owner:** N · **Consequence:** normal · **Last:** S555 · **Streak:** 1 · **Hits:** 1 · **Detector:** recipe
- **Record (S555):** flash_cards clean: 0 `:hover` rules that reveal content (static); the tooltip's tap contract holds (tap opens, a second tap closes); `.lc-tile:hover` moves only a border.
- **Record (ledger row at S544):** - **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are
- **Archived full text (latest compaction copy):** - **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are …[full text: IMPROVEMENT_ARCHIVE.md]

## `contrast-inverted-by-a-hover-or-active-state`
- **Status:** ACTIVE · **Owner:** C · **Consequence:** normal · **Last:** S368 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **contrast-inverted-by-a-hover-or-active-state**: **S368 (Pass C, Font Maker at RUNTIME, 26/23 controls × 2 themes, real mouse + 420 ms): 1 hit FIXED (`6549b60` `.fld-help` hover 2.75 / 2.14 → 6.22 / 6.92:1); the disabled undo/redo pair (opacity 0.45) is exempt — inactive
- **Archived full text (latest compaction copy):** - **contrast-inverted-by-a-hover-or-active-state**: **S368 (Pass C, Font Maker at RUNTIME, 26/23 controls × 2 themes, real mouse + 420 ms): 1 hit FIXED (`6549b60` `.fld-help` hover 2.75 / 2.14 → 6.22 / 6.92:1); the disabled undo/redo pair (opacity 0.45) is exempt — inactive …[full text: IMPROVEMENT_ARCHIVE.md]

## `dark-override-outranks-hover`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 1 · **Hits:** 0 · **Detector:** recipe
- **Detection:** - **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection:
- **Archived full text (latest compaction copy):** - **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

## `contrast-below-AA-on-a-tinted-or-coloured-plate`
- **Status:** ACTIVE · **Owner:** M · **Consequence:** normal · **Last:** S558 · **Streak:** 1 · **Detector:** recipe
- **Record (S558):** trope clean — ~24,800 text nodes × 8 cells, 0 under AA; the one flag (`.mark-hit` 1.99:1 while an example plays) was the helper compositing two translucent tints as opaque (findings trap 362): 4.24 / 7.55:1.
- **Record (S556):** dictionary: the bulk-selected card's transliteration 4.19:1 on the dark 10% gold tint and a filled shoresh pattern's sub-label 4.03 on its 12% tint FIXED `ef4eb37` (5% in dark → 4.61 both, the plates 1.21:1 above the grid; light unchanged); every other text node ≥ 4.5 (large ≥ 3) over ~12,000 nodes × 8 cells × 19 views; the colour-coding picker's 8 palette examples (2.99–4.28 at 17.6px) are the content itself — Awaiting, gate 3; plants 1.15 / 1.00 / 1.69 fired.
- **Record (S554):** fontmaker clean: every visible text node ≥ 4.5:1 (large ≥ 3) over ~15,600 nodes × 112 cells; the one 1.31 reading was the probe's own `color(srgb)` parse of the gold Below chip (5.2:1 by hand); plants 1.03 / 1.00 / 1.52 fired.
- **Record (S552):** name_tags: 1 hit — the carried row's number 3.91:1 on the gold drag tint in dark (light 5.32); every other text node ≥ 5.02 dark / 5.38 light across 13 states × 4 cells, the tags' text on the six pastels ≥ 3; plants 1.39 / 1.64 fired. Candidate (the governor).
- **Record (ledger row at S544):** - **contrast-below-AA-on-a-tinted-or-coloured-plate**: **S501 `[DEFAULT]` on the dark active font tile, dashboard + torah `0053db78` (3.71→5.56:1).** **S488 dashboard ribbon `5da9ecbe`.** **S422: torah's vowel Letter on the trope tint FIXED `e55b811` (1.85:1; streak 0).**
- **Archived full text (latest compaction copy):** - **contrast-below-AA-on-a-tinted-or-coloured-plate**: **S488: the dashboard's cycle ribbon 4.13:1 dark FIXED `5da9ecbe`.** **S422: torah's vowel Letter on the trope tint FIXED `e55b811` (1.85:1; streak 0).** **re-swept 2026-08-23 (S249 Pass M, `flash_cards.html` — card front AND back, results screen, and setup screen with every …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

## `async-store-backed-choice-clobbered-by-a-sync-fallback`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S226 · **Streak:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire
- **Archived full text (latest compaction copy):** - **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire …[full text: IMPROVEMENT_ARCHIVE.md]

## `rebuild-where-a-class-swap-would-do`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S220 · **Streak:** 0 · **Hits:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the
- **Archived full text (latest compaction copy):** - **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the …[full text: IMPROVEMENT_ARCHIVE.md]

## `decorative-glyph-carrier-exposed-to-assistive-tech`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S563 · **Streak:** 0 · **Detector:** recipe
- **Record (S563):** flash_cards FIXED `872d772`: three CSS-generated ▾ (`.panel-title::after`, `.adv-subhead::before`, `.vgroup-head::after`) joined 25 accessible names ("Mode ▾", "▾ Presets", the selects "▾ Profiles & Results" / "▾ Transliteration", "AH Sound – Aqua ▾"). The fix is `content: '▾' / ''` after a plain `content` fallback. Recipe extension for generated content: CDP `Accessibility.getFullAXTree`, names matching the glyph, with full-page screenshots byte-equal as the visual control (25 → 0 in 8/8 cells). Open: 11 like rules on 6 pages (candidate).
- **Record (ledger row at S544):** - **decorative-glyph-carrier-exposed-to-assistive-tech** (**S530: header ✡︎ ×13 `eee7080d`, generator ⚡/🔍 `b298abb2` FIXED (`a530/fix2.mjs`, `fix4.mjs`); category emoji unruled (candidate).** **S529: generator start screen + chips `19ece1f1`.** **S528: resources' icons FIXED
- **Archived full text (latest compaction copy):** - **decorative-glyph-carrier-exposed-to-assistive-tech** (**S530: header ✡︎ ×13 `eee7080d`, generator ⚡/🔍 `b298abb2` FIXED (`a530/fix2.mjs`, `fix4.mjs`); category emoji unruled (candidate).** **S529: generator start screen + chips `19ece1f1`.** **S528: resources' icons FIXED `34ae261b`.** **2nd instance fixed 2026-08-15, S219, c2399f1 — …[full text: IMPROVEMENT_ARCHIVE.md]

## `error-status-clobbered-by-a-later-routine-write`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S411 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **error-status-clobbered-by-a-later-routine-write** (**NEW, registered S199**; **S411: +1 carrier FIXED `25d2277`** — FM `fmCloudOpen`'s missing-photo notice, replaced by "Opened from your account" in ~40 ms): a status/live-region line that correctly reports a FAILURE is then
- **Archived full text (latest compaction copy):** - **error-status-clobbered-by-a-later-routine-write** (**NEW, registered S199**; **S411: +1 carrier FIXED `25d2277`** — FM `fmCloudOpen`'s missing-photo notice, replaced by "Opened from your account" in ~40 ms): a status/live-region line that correctly reports a FAILURE is then …[full text: IMPROVEMENT_ARCHIVE.md]

## `content-dependent-tour-step-miscounts-the-tour`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S197 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **content-dependent-tour-step-miscounts-the-tour** (**NEW, registered S197**): a guided-tour step whose `target()` only exists once remote/corpus content has rendered. The engines all skip an unresolvable step **silently by design** ("skip gracefully when hidden"), but the
- **Archived full text (latest compaction copy):** - **content-dependent-tour-step-miscounts-the-tour** (**NEW, registered S197**): a guided-tour step whose `target()` only exists once remote/corpus content has rendered. The engines all skip an unresolvable step **silently by design** ("skip gracefully when hidden"), but the …[full text: IMPROVEMENT_ARCHIVE.md]

## `per-sample-repaint-of-an-O(n)-live-preview`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S196 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **per-sample-repaint-of-an-O(n)-live-preview** (**NEW, registered S196**): a continuous gesture — `pointermove`, a slider drag — that rebuilds an **O(n) preview from its whole accumulated buffer once per input SAMPLE** rather than once per animation frame, so the gesture is
- **Archived full text (latest compaction copy):** - **per-sample-repaint-of-an-O(n)-live-preview** (**NEW, registered S196**): a continuous gesture — `pointermove`, a slider drag — that rebuilds an **O(n) preview from its whole accumulated buffer once per input SAMPLE** rather than once per animation frame, so the gesture is …[full text: IMPROVEMENT_ARCHIVE.md]

## `false-positive-validator-on-the-app's-own-content`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S194 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **false-positive-validator-on-the-app's-own-content** (**NEW, registered S194**): a QA/lint/warning rule whose **detector is broader than the failure it warns about**, so it fires on artwork or data the app itself ships — the user cannot act on it, cannot clear it, and it is
- **Archived full text (latest compaction copy):** - **false-positive-validator-on-the-app's-own-content** (**NEW, registered S194**): a QA/lint/warning rule whose **detector is broader than the failure it warns about**, so it fires on artwork or data the app itself ships — the user cannot act on it, cannot clear it, and it is …[full text: IMPROVEMENT_ARCHIVE.md]

## `JSON-LD ↔ visible-content parity`
- **Status:** ACTIVE · **Owner:** L · **Consequence:** normal · **Last:** S432 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **JSON-LD ↔ visible-content parity** (UN-RETIRED S190; owned by L): ACTIVE, streak 0. **S432: 1 hit, shape (b) — torah FAQ a6 and its visible twin (EN + HE) said the week comes from Sefaria's calendar; FIXED `3cdc95e` (gate 2), byte parity. Arm: `l432/claims.py` (control
- **Archived full text (latest compaction copy):** - **JSON-LD ↔ visible-content parity** (UN-RETIRED S190; owned by L): ACTIVE, streak 0. **S432: 1 hit, shape (b) — torah FAQ a6 and its visible twin (EN + HE) said the week comes from Sefaria's calendar; FIXED `3cdc95e` (gate 2), byte parity. Arm: `l432/claims.py` (control …[full text: IMPROVEMENT_ARCHIVE.md]

## `wired-then-clobbered label`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **wired-then-clobbered label** **S371 (Pass A): +1 carrier FIXED `e4c8d75` — the generator's `#headerSub` (`data-i18n` page subtitle) overwritten by `setBlendType`'s four English literals on every practice-type click; now four CSV keys. Static census: 6 `data-i18n` ids written
- **Archived full text (latest compaction copy):** - **wired-then-clobbered label** **S371 (Pass A): +1 carrier FIXED `e4c8d75` — the generator's `#headerSub` (`data-i18n` page subtitle) overwritten by `setBlendType`'s four English literals on every practice-type click; now four CSV keys. Static census: 6 `data-i18n` ids written …[full text: IMPROVEMENT_ARCHIVE.md]

## `theme-flipping-token-on-a-fixed-colour-plate`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S191 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **theme-flipping-token-on-a-fixed-colour-plate** (NEW, registered S191): a control or text node styled with a colour token that **inverts with the theme** — `var(--text)`, `var(--white)`, `var(--muted)` — placed inside a container painted a **fixed** colour that does not
- **Archived full text (latest compaction copy):** - **theme-flipping-token-on-a-fixed-colour-plate** (NEW, registered S191): a control or text node styled with a colour token that **inverts with the theme** — `var(--text)`, `var(--white)`, `var(--muted)` — placed inside a container painted a **fixed** colour that does not …[full text: IMPROVEMENT_ARCHIVE.md]

## `two-state-ready-flag-for-a-three-state-load`
- **Status:** DRAFT · **Owner:** F · **Consequence:** normal · **Last:** S542 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **two-state-ready-flag-for-a-three-state-load** (S542 trope `97de5370`) (NEW, registered S189): a lazily-fetched corpus or module whose UI decides what to render from a single truthiness check —
- **Archived full text (latest compaction copy):** - **two-state-ready-flag-for-a-three-state-load** (S542 F: trope's Learn cards + Drill note claimed "unavailable" mid-load, FIXED `97de5370`; streak 0) (NEW, registered S189): a lazily-fetched corpus or module whose UI decides what to render from a single truthiness check — `REAL_WORDS.length`, `EMOJI_DATA`, `_wordsReady`. **That flag has two states; the fetch has three** (never …[full text: IMPROVEMENT_ARCHIVE.md]

## `invalid-SVG-geometry-from-an-unclamped-difference`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S187 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **invalid-SVG-geometry-from-an-unclamped-difference** (NEW, registered S187): an SVG `width`/`height` computed as the difference of two mapped coordinates (`fx(b) - fx(a)`, `x1 - x0`) where one side comes from a **derived** value that can legitimately go negative — so the
- **Archived full text (latest compaction copy):** - **invalid-SVG-geometry-from-an-unclamped-difference** (NEW, registered S187): an SVG `width`/`height` computed as the difference of two mapped coordinates (`fx(b) - fx(a)`, `x1 - x0`) where one side comes from a **derived** value that can legitimately go negative — so the …[full text: IMPROVEMENT_ARCHIVE.md]

## `RTL-inheritance-on-a-Latin-script-container`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S290 · **Streak:** 0 · **Hits:** 1 · **Detector:** recipe
- **Record (ledger row at S544):** - **RTL-inheritance-on-a-Latin-script-container**: **re-swept 2026-08-29 (S290 iter 4, `hebrew_dictionary.html` word cards) — hits: 1 carrier (`.wc-transl` + `.wc-translit`), fixed `21538fc`; clean streak: 0 — ACTIVE.** **4th carrier of the shape registered at S185, and the
- **Archived full text (latest compaction copy):** - **RTL-inheritance-on-a-Latin-script-container**: **re-swept 2026-08-29 (S290 iter 4, `hebrew_dictionary.html` word cards) — hits: 1 carrier (`.wc-transl` + `.wc-translit`), fixed `21538fc`; clean streak: 0 — ACTIVE.** **4th carrier of the shape registered at S185, and the …[full text: IMPROVEMENT_ARCHIVE.md]

## `silent-external-media-failure`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Detection:** - **silent-external-media-failure** (an `<audio>`/`<video>`/media element pointed at a third-party host with play/pause/ended handlers wired but **no `error` handler**, so a blocked or dead origin produces silence while the controls still show a live playing state. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - **silent-external-media-failure** (an `<audio>`/`<video>`/media element pointed at a third-party host with play/pause/ended handlers wired but **no `error` handler**, so a blocked or dead origin produces silence while the controls still show a live playing state. Detection:
- **Archived full text (latest compaction copy):** - **silent-external-media-failure** (an `<audio>`/`<video>`/media element pointed at a third-party host with play/pause/ended handlers wired but **no `error` handler**, so a blocked or dead origin produces silence while the controls still show a live playing state. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

## `print-trailing-dead-space`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **print-trailing-dead-space** (padding/margin BELOW the last line of a print flow — page-container bottom padding, a scroll wrapper's, the last block's own margin — which paginates exactly like content, so a document ending near a page boundary pushes empty box onto a sheet of
- **Archived full text (latest compaction copy):** - **print-trailing-dead-space** (padding/margin BELOW the last line of a print flow — page-container bottom padding, a scroll wrapper's, the last block's own margin — which paginates exactly like content, so a document ending near a page boundary pushes empty box onto a sheet of …[full text: IMPROVEMENT_ARCHIVE.md]

## `lazily-loaded-dependency-renders-an-empty-shell`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S416 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **lazily-loaded-dependency-renders-an-empty-shell** (S416: +1 open, trope HH) (a feature whose data comes from a lazily-loaded external module keeps rendering its full chrome — column, header, row label, legend — when the module never arrives, so
- **Archived full text (latest compaction copy):** - **lazily-loaded-dependency-renders-an-empty-shell** (S416: +1 open, trope HH) (a feature whose data comes from a lazily-loaded external module keeps rendering its full chrome — column, header, row label, legend — when the module never arrives, so …[full text: IMPROVEMENT_ARCHIVE.md]

## `print-media-leak / var-chain-overridden-by-a-literal`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **print-media-leak / var-chain-overridden-by-a-literal** (a screen-only `@media (max-width:N)` block whose declarations also apply to PAPER — print media has a width too — or, more generally, a literal `font-size`/colour declaration that out-specifies a `var(--x)` chain the
- **Archived full text (latest compaction copy):** - **print-media-leak / var-chain-overridden-by-a-literal** (a screen-only `@media (max-width:N)` block whose declarations also apply to PAPER — print media has a width too — or, more generally, a literal `font-size`/colour declaration that out-specifies a `var(--x)` chain the …[full text: IMPROVEMENT_ARCHIVE.md]

## `incomplete-print-token-reset`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Detection:** diff the token list inside the print block's `html.dark-early
- **Record (ledger row at S544):** - **incomplete-print-token-reset** (a `@media print` dark-token re-statement that restates SOME of the theme tokens the dark block overrides but not all — the missing ones keep their dark values on paper. Detection: diff the token list inside the print block's `html.dark-early
- **Archived full text (latest compaction copy):** - **incomplete-print-token-reset** (a `@media print` dark-token re-statement that restates SOME of the theme tokens the dark block overrides but not all — the missing ones keep their dark values on paper. Detection: diff the token list inside the print block's `html.dark-early …[full text: IMPROVEMENT_ARCHIVE.md]

## `referenced-but-unauthored i18n key`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **referenced-but-unauthored i18n key** (a key the code LOOKS UP that does not exist in the CSV — the exact inverse of `authored-but-unreferenced`. The user sees the English fallback, so nothing looks broken, but every render logs an `[i18n] missing key` warning, and those
- **Archived full text (latest compaction copy):** - **referenced-but-unauthored i18n key** (a key the code LOOKS UP that does not exist in the CSV — the exact inverse of `authored-but-unreferenced`. The user sees the English fallback, so nothing looks broken, but every render logs an `[i18n] missing key` warning, and those …[full text: IMPROVEMENT_ARCHIVE.md]

## `untrusted-shape-on-read`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **untrusted-shape-on-read** (a store that arrives from an imported `.ivrit` / AllTools file — hand-editable text — is read back with its SHAPE assumed: `results.map`, `(r.cards||[]).forEach`, `results.slice().reverse()`. A `null` entry, a non-array `results`, or a non-array
- **Archived full text (latest compaction copy):** - **untrusted-shape-on-read** (a store that arrives from an imported `.ivrit` / AllTools file — hand-editable text — is read back with its SHAPE assumed: `results.map`, `(r.cards||[]).forEach`, `results.slice().reverse()`. A `null` entry, a non-array `results`, or a non-array …[full text: IMPROVEMENT_ARCHIVE.md]

## `blocking-alert-for-a-routine-path`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S512 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **blocking-alert-for-a-routine-path**: ACTIVE, streak 0. **S512 (H): the generator's three Real Words "no words" alerts → the inline Generate note, FIXED `59714ef`; its 11 other `alert(` sites are catch / import-error / capability branches.** **Re-swept 2026-09-09 (S357 Pass
- **Archived full text (latest compaction copy):** - **blocking-alert-for-a-routine-path**: ACTIVE, streak 0. **S512 (H): the generator's three Real Words "no words" alerts → the inline Generate note, FIXED `59714ef`; its 11 other `alert(` sites are catch / import-error / capability branches.** **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `alert(` sites (the hub's erase gate is a dialog; its final `confirm()` is a destructive guard) — hits 0, clean streak 2.** S343: dashboard 77-control click census, 0 alerts. …[full text: IMPROVEMENT_ARCHIVE.md]

## `double-localization`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a
- **Archived full text (latest compaction copy):** - **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a …[full text: IMPROVEMENT_ARCHIVE.md]

## `parse-per-call on a growing store`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Detection:** no explicit method recorded; consequence-critical, so it stays ACTIVE and the record's shape sentence is the recipe until the next A writes an explicit one (grep the shape's named call or attribute over the delta).
- **Record (ledger row at S544):** - **parse-per-call on a growing store** (a helper re-parsing a whole localStorage blob on every call, called once per item, so the cost grows with the teacher's saved work): ACTIVE, consequence-critical (a freeze that scales with use reads as data loss). Hits: flash
- **Archived full text (latest compaction copy):** - **parse-per-call on a growing store** (a helper re-parsing a whole localStorage blob on every call, called once per item, so the cost grows with the teacher's saved work): ACTIVE, consequence-critical (a freeze that scales with use reads as data loss). Hits: flash …[full text: IMPROVEMENT_ARCHIVE.md]

## `authored-but-unreferenced i18n key family`
- **Status:** DRAFT · **Owner:** D · **Consequence:** normal · **Last:** S365 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S365: 1 hit FIXED (`772068b`, `trope.learn.no_example` + `trope.learn.examples_unavailable` — `renderLearn` passed the raw English; Geresh Muqdam has no chanted example, so the Hebrew UI
- **Archived full text (latest compaction copy):** - **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S365: 1 hit FIXED (`772068b`, `trope.learn.no_example` + `trope.learn.examples_unavailable` — `renderLearn` passed the raw English; Geresh Muqdam has no chanted example, so the Hebrew UI …[full text: IMPROVEMENT_ARCHIVE.md]

## `browser-locale-date-in-a-localized-sentence`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S533 · **Streak:** 0 · **Hits:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **`browser-locale-date-in-a-localized-sentence`** **S533 (K): 0 on the delta (`etLang()`, `I18n.lang`; the dashboard's `en-US` dates are projected content), streak 2.** **S371 (Pass A): 0 `toLocale(Date|Time)String(undefined` in the corpus — hits 0, clean streak 1.**
- **Archived full text (latest compaction copy):** - **`browser-locale-date-in-a-localized-sentence`** **S533 (K): 0 on the delta (`etLang()`, `I18n.lang`; the dashboard's `en-US` dates are projected content), streak 2.** **S371 (Pass A): 0 `toLocale(Date|Time)String(undefined` in the corpus — hits 0, clean streak 1.** (`toLocaleDateString(undefined, …)` inside a translated sentence or row): **all 3 carriers FIXED — hub `f8b716b`, flash …[full text: IMPROVEMENT_ARCHIVE.md]

## `sub-floor touch target on a shared small-button class`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S410 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **sub-floor touch target on a shared small-button class** (registered S193; **S410 FIXED the hub's inline-styled My Fonts row `ee38b98`, 6 buttons 24 → 30px — S236's class-less sub-shape**): a small-control class — `.btn-xs` and its kin — whose size comes from `padding`
- **Archived full text (latest compaction copy):** - **sub-floor touch target on a shared small-button class** (registered S193; **S410 FIXED the hub's inline-styled My Fonts row `ee38b98`, 6 buttons 24 → 30px — S236's class-less sub-shape**): a small-control class — `.btn-xs` and its kin — whose size comes from `padding` …[full text: IMPROVEMENT_ARCHIVE.md]

## `localStorage-vs-AllTools`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** critical · **Last:** S357 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - localStorage-vs-AllTools: ACTIVE (consequence-critical: backup completeness, never retires). **Re-swept 2026-09-09 (S357 Pass A, delta-only): 1 new key, `hebrewBlender_lastBackupAt` (S347) — in `eraseAllSettings` with a written per-device reason, export-exempt by design — hits
- **Archived full text (latest compaction copy):** - localStorage-vs-AllTools: ACTIVE (consequence-critical: backup completeness, never retires). **Re-swept 2026-09-09 (S357 Pass A, delta-only): 1 new key, `hebrewBlender_lastBackupAt` (S347) — in `eraseAllSettings` with a written per-device reason, export-exempt by design — hits …[full text: IMPROVEMENT_ARCHIVE.md]

## `unescaped-input / unsafe-parse`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S158 · **Streak:** 0 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - unescaped-input / unsafe-parse: **re-swept 2026-07-25 (S158), hits: 0** (`0dc1e50..HEAD` — **0 new `innerHTML`/`insertAdjacentHTML`/`outerHTML`, 0 new `JSON.parse`/`Object.assign`, 0 new `fetch`/`setAttribute('href'|'src'|'on*')`**. Tightened beyond added-sink-lines to catch
- **Archived full text (latest compaction copy):** - unescaped-input / unsafe-parse: **re-swept 2026-07-25 (S158), hits: 0** (`0dc1e50..HEAD` — **0 new `innerHTML`/`insertAdjacentHTML`/`outerHTML`, 0 new `JSON.parse`/`Object.assign`, 0 new `fetch`/`setAttribute('href'|'src'|'on*')`**. Tightened beyond added-sink-lines to catch …[full text: IMPROVEMENT_ARCHIVE.md]

## `destructive-bulk`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S272 · **Streak:** 0 · **Hits:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - destructive-bulk: **re-swept 2026-08-28 (S272 Pass A, delta `b2f455b..HEAD`), hits: 0** (zero new loops write stored per-item data; the S268 calendar import writes cells only through its preview+confirm flow, the S269 purge is confirm-guarded and deletes only the legacy rows
- **Archived full text (latest compaction copy):** - destructive-bulk: **re-swept 2026-08-28 (S272 Pass A, delta `b2f455b..HEAD`), hits: 0** (zero new loops write stored per-item data; the S268 calendar import writes cells only through its preview+confirm flow, the S269 purge is confirm-guarded and deletes only the legacy rows …[full text: IMPROVEMENT_ARCHIVE.md]

## `ivrit-gather-gap`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S185 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **ivrit-gather-gap** — **3rd fix landed 2026-08-06 (S185)**: flash_cards' `hebrewFlashCards_pbStreak`, absent from BOTH of the tool's save paths and from `apply()`, now round-trips with AllTools' max rule (94d1222). The class's remaining known surface is clean. Original
- **Archived full text (latest compaction copy):** - **ivrit-gather-gap** — **3rd fix landed 2026-08-06 (S185)**: flash_cards' `hebrewFlashCards_pbStreak`, absent from BOTH of the tool's save paths and from `apply()`, now round-trips with AllTools' max rule (94d1222). The class's remaining known surface is clean. Original …[full text: IMPROVEMENT_ARCHIVE.md]

## `symbol-only accessible name`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **symbol-only accessible name** (an icon-only control whose ENTIRE accessible name is a glyph with no letter or digit — "×", "↺", "✕", "⬛", an emoji run — because for `button`/`a`/`role=button` the ACCNAME chain takes **name-from-content BEFORE `title`**, so a correct
- **Archived full text (latest compaction copy):** - **symbol-only accessible name** (an icon-only control whose ENTIRE accessible name is a glyph with no letter or digit — "×", "↺", "✕", "⬛", an emoji run — because for `button`/`a`/`role=button` the ACCNAME chain takes **name-from-content BEFORE `title`**, so a correct …[full text: IMPROVEMENT_ARCHIVE.md]

## `nameless-adjacent-text-labeled control`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - nameless-adjacent-text-labeled control (a visible interactive control — toggle switch, slider, number field, select, colour well — whose only label is **adjacent text** that is never programmatically associated, so it has NO accessible name; the wrapping `<label
- **Archived full text (latest compaction copy):** - nameless-adjacent-text-labeled control (a visible interactive control — toggle switch, slider, number field, select, colour well — whose only label is **adjacent text** that is never programmatically associated, so it has NO accessible name; the wrapping `<label …[full text: IMPROVEMENT_ARCHIVE.md]

## `dead-feature-guard`
- **Status:** ACTIVE · **Owner:** A · **Consequence:** normal · **Last:** S158 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - dead-feature-guard (a `typeof X === 'function'` / feature-detection guard whose **preferred** implementation does not exist on that page, so the guarded branch can never run and control silently falls through to a worse path — or to nothing): **re-swept 2026-07-25 (S158, Pass
- **Archived full text (latest compaction copy):** - dead-feature-guard (a `typeof X === 'function'` / feature-detection guard whose **preferred** implementation does not exist on that page, so the guarded branch can never run and control silently falls through to a worse path — or to nothing): **re-swept 2026-07-25 (S158, Pass …[full text: IMPROVEMENT_ARCHIVE.md]

## `modal-focus-trap`
- **Status:** ACTIVE · **Owner:** H · **Consequence:** normal · **Last:** S426 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - **modal-focus-trap** (**S426: HIT — the account screen (gone since the account cleanup; the layer's dialogs are now the name step and the device-extras card), js/ivrit-saves.js, which the S179 sweep predates; FIXED `91c45d6`; streak 0**)
- **Archived full text (latest compaction copy):** - **modal-focus-trap** (**S426: HIT — the account screen `.ivsav-card` (js/ivrit-saves.js), which the last sweep (S179) predates: 7/6 escapes on 9 pages, FIXED `91c45d6`; streak 0**) (an element declaring `role="dialog"` + `aria-modal="true"` with no Tab/Shift+Tab wrap) …[full text: IMPROVEMENT_ARCHIVE.md]

## `pre-ready-i18n / never-re-rendered`
- **Status:** ACTIVE · **Owner:** D · **Consequence:** critical · **Last:** S538 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - pre-ready-i18n / never-re-rendered — **6th instance FIXED S538 `f0905fb6`: the missing-font note on flash ×2, torah, trope ; LL, Name Tags, generator heal.** ACTIVE,
- **Archived full text (latest compaction copy):** - pre-ready-i18n / never-re-rendered — **6th instance FIXED S538 `f0905fb6`: the missing-font note on flash ×2, torah, trope (a store answering before the locale wrote the raw key; a switch left it); generator, LL, Name Tags already heal.** 5th S533 `e83db20c`. ACTIVE, consequence-critical; sweep both languages. …[full text: IMPROVEMENT_ARCHIVE.md]

## `placeholder-as-only-accessible-name`
- **Status:** DRAFT · **Owner:** A · **Consequence:** normal · **Last:** S0 · **Streak:** 0 · **Detector:** none
- **Detection:** none recorded — DRAFT until a recipe or a committed detector lands (the next A writes one or retires the row).
- **Record (ledger row at S544):** - **placeholder-as-only-accessible-name** (a text input/textarea whose ONLY name source is its `placeholder` — no `aria-label`, `aria-labelledby`, `label[for]`, wrapping `<label>` or `title`. Under ACCNAME `placeholder` is the last-resort source, so the name is announced on an
- **Archived full text (latest compaction copy):** - **placeholder-as-only-accessible-name** (a text input/textarea whose ONLY name source is its `placeholder` — no `aria-label`, `aria-labelledby`, `label[for]`, wrapping `<label>` or `title`. Under ACCNAME `placeholder` is the last-resort source, so the name is announced on an …[full text: IMPROVEMENT_ARCHIVE.md]

## Retired patterns (14)

## `synced-key-wiped-without-forgetRow`
- **Status:** retired · **Owner:** P · **Consequence:** critical · **Last:** S0 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Shape: a reset wiping a synced key without `forgetRow`, so the wiped copy read "newer here" and offered an account-wide reset.
- **Record (ledger row at S544):** - **`synced-key-wiped-without-forgetRow`**: RETIRED 2026-09-30 (the account cleanup, outside the loop — not a clean streak). Shape: a reset wiping a synced key without `forgetRow`, so the wiped copy read "newer here" and offered an account-wide reset. `forgetRow` and the panels are gone: signed in, resets and deletes write through by design, and the guard is the confirm (the `*_cloud` keys while `hasStoredSession()`), which pass P arm 4 now checks. Un-retires only if a memory-forgetting path returns.

## `uncompressed-jspdf-raster`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S371 · **Streak:** 3 · **Detector:** recipe
- **Shape:** Shape: a jsPDF `addImage(.
- **Detection:** `grep -n "addImage(" *.html` and read the argument list; verify by the PDF's `FlateDecode` streams. Un-retires on any new `addImage(` without `'FAST'` (A2 spot-check).
- **Record (ledger row at S544):** - **`uncompressed-jspdf-raster`**: RETIRED 2026-09-10 (S371 Pass A, clean streak 3: S343, S357, S371 — 0 new `addImage(` sites, 3/3 carry `'FAST'`). Shape: a jsPDF `addImage(...)` with no `compression` argument stores the raster raw (~11 MB per Letter page); S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Detection: `grep -n "addImage(" *.html` and read the argument list; verify by the PDF's `FlateDecode` streams. Un-retires on any new `addImage(` without `'FAST'` (A2 spot-check).

## `custom-property-written-on-documentElement-per-frame`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S357 · **Streak:** 3 · **Detector:** recipe
- **Shape:** Shape: a per-frame writer sets a root custom property.
- **Detection:** `grep -n 'documentElement.style.setProperty' *.html`, keep writers on a drag/slider/rAF path. Fix: write on the consumers' nearest ancestor. An A2 hit un-retires.
- **Record (ledger row at S544):** - **`custom-property-written-on-documentElement-per-frame`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 5 new `setProperty('--heb-font'` writers are one-shot). Shape: a per-frame writer sets a root custom property. Detection: `grep -n 'documentElement.style.setProperty' *.html`, keep writers on a drag/slider/rAF path. Fix: write on the consumers' nearest ancestor. An A2 hit un-retires.

## `elevation-cue-doubled-or-dead`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S343 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - elevation-cue-doubled-or-dead (a box-shadow that doubles a border cue, or resolves invisible in the theme it is used in) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: last hits S311 (14 in the FM help popup, `0c86195`/`88f4940`), then clean S317, S330, S343 (the delta's one new shadow, dictionary `.sidebar-toggle-btn`, is `border:none` + the generator twin's ratified shape). Detector caveat stands: the Impeccable rule id is unreliable as a counter and its threshold is exactly 16px. Re-checked only in Pass A2 / O.

## `sibling-page-missing-a-shared-declaration`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S343 · **Streak:** 0 · **Detector:** recipe
- **Detection:** census the declaration across every sibling, then diff. Re-checked only in Pass A2 / E.
- **Record (ledger row at S544):** - sibling-page-missing-a-shared-declaration (a chrome/tool page lacking a rule or meta its siblings all carry) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: 3 hits S304 (`e093389`), then clean S317, S330, S343 (`og:locale` on 12/12 indexable pages, the `summary:hover` idiom on all 8 `<details>` pages; `resources.html` remains a deliberate compact chrome). Detection: census the declaration across every sibling, then diff. Re-checked only in Pass A2 / E.

## `panel-collapse-writer-mismatch`
- **Status:** retired · **Owner:** N · **Consequence:** normal · **Last:** S343 · **Streak:** 0 · **Detector:** recipe
- **Detection:** `grep -n "classList.add('collapsed')"` (and `.toggle`/`.remove`) over the six carriers, read each writer for the save call. Re-checked only in Pass A2.
- **Record (ledger row at S544):** - panel-collapse-writer-mismatch (a `.collapsed` writer that skips `panelMemSave()`, or a panel title without the `data-i18n` key the memory is keyed by) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: first swept S303 (Pass N), then clean S317, S330, S343 (0 `.collapsed` writers added since S303). Detection: `grep -n "classList.add('collapsed')"` (and `.toggle`/`.remove`) over the six carriers, read each writer for the save call. Re-checked only in Pass A2.

## `invisible-rebuild-on-a-hot-render-path`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S330 · **Streak:** 0 · **Detector:** recipe
- **Detection:** list the containers the hot renderer writes, check each at runtime with `offsetParent !== …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - invisible-rebuild-on-a-hot-render-path (a render entry point rebuilding a container that is hidden by default under the DEFAULT view, with cost that scales with data) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: carrier fixed FM `renderSpacingPanel`/`renderKerningSection` (`fa1f88f`), then clean S299, S317, S330 (the S317→S330 delta adds no `innerHTML` writer;
- **Archived full text (latest compaction copy):** - invisible-rebuild-on-a-hot-render-path (a render entry point rebuilding a container that is hidden by default under the DEFAULT view, with cost that scales with data) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: carrier fixed FM `renderSpacingPanel`/`renderKerningSection` (`fa1f88f`), then clean S299, S317, S330 (the S317→S330 delta adds no `innerHTML` writer; torah `buildPrintBand` is bounded by `TROPE_COLOR_DEFS`). Detection kept for A2: list the containers the hot renderer writes, check each at runtime with `offsetParent !== …[full text: IMPROVEMENT_ARCHIVE.md]

## `var`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S330 · **Streak:** 0 · **Detector:** recipe
- **Detection:** per file, diff `--token:` declarations + `setProperty('--token'` literals against fallback-less `var(--token)` references, …[full text: IMPROVEMENT_ARCHIVE.md]
- **Record (ledger row at S544):** - var()-on-an-undefined-custom-property (a `var(--x)` with no fallback whose token is declared nowhere on that page) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: last hit `hebrew_dictionary` `--navy-deep` (`5e9a6d2`, S285), then clean S299, S317, S330 (the 14 `var()` references added since S317 — `--gold-text`, `--navy`, `--text`, `--white`, `--border` — all
- **Archived full text (latest compaction copy):** - var()-on-an-undefined-custom-property (a `var(--x)` with no fallback whose token is declared nowhere on that page) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: last hit `hebrew_dictionary` `--navy-deep` (`5e9a6d2`, S285), then clean S299, S317, S330 (the 14 `var()` references added since S317 — `--gold-text`, `--navy`, `--text`, `--white`, `--border` — all declared on their pages). Detection kept for A2: per file, diff `--token:` declarations + `setProperty('--token'` literals against fallback-less `var(--token)` references, …[full text: IMPROVEMENT_ARCHIVE.md]

## `falsy-zero`
- **Status:** retired · **Owner:** A · **Consequence:** critical · **Last:** S93 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a
- **Archived full text (latest compaction copy):** - falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a wrong restored value, not data-loss) → not a consequence-critical carve-out → auto-retired. Re-checked only in Pass A2. **Watch:** any new tool with numeric/boolean …[full text: IMPROVEMENT_ARCHIVE.md]

## `shadowed-global helper`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S73 · **Streak:** 0 · **Detector:** recipe
- **Record (ledger row at S544):** - shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()`
- **Archived full text (latest compaction copy):** - shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()` in `shortcutGroups()` and `pwa.js`'s self-contained `t(key,fallback)` are intentional in-scope locals, never reach a global-`t` call site). Correctness-scoped, not …[full text: IMPROVEMENT_ARCHIVE.md]

## `listener/interval accumulation`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S64 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Structural/perf-scoped → auto-retired.
- **Record (ledger row at S544):** - listener/interval accumulation (a `setInterval`/`setTimeout`/`addEventListener` attached repeatedly without clear/remove) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 over the S53–S63 surface — generator chunked-build timer single/self-chaining + `cancelWorksheetBuild` clears on re-entry, `beforeprint` attached once, torah color fns add no listeners, `_appToastTimer` clear-guarded). Structural/perf-scoped → auto-retired. Re-checked only in Pass A2.

## `workMode/step reachability`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S52 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Re-checked only in Pass A2.
- **Record (ledger row at S544):** - workMode/step reachability (controls reachable in only one workMode/step while the workflow steers users past it) | retired 2026-07-10 (S52) | 3 consecutive clean sweeps (S36, S41-scoped, S52 — trope_tutor's drawer/tabs/tour-skip/mid-drill-return all reachable-by-design). Re-checked only in Pass A2.

## `undo-wiring`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S41 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Re-checked only in Pass A2.
- **Record (ledger row at S544):** - undo-wiring (Font Maker: `markDirty()` without `udDo`/`udBurstBegin`/`udNudgeTick`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; the S25–26 keyboard additions (node-insert, crop) verified as routing through `udDo` or deliberately non-undoable. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the un-swept FM v3.9–v4.2 additions (auto-detect Apply via `udDo(...withSource)`, pen contour, node delete/paste/transform/specks/fillet all `udDo`; `_hiddenContours`/opacity/snapGuides are documented view-only).

## `slider-commit`
- **Status:** retired · **Owner:** A · **Consequence:** normal · **Last:** S41 · **Streak:** 0 · **Detector:** recipe
- **Shape:** Re-checked only in Pass A2.
- **Record (ledger row at S544):** - slider-commit (Font Maker: `oninput` range sliders lacking `onchange="udBurstCommit()"`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; every project-data slider commits, and no new range slider has been added. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the FM v3.9–v4.2 sliders (fillet `filletLiveInput`/`filletCommit` burst; size setters commit; mark-editor `meSetDotSize` uses its own `meBeginEdit`/`meCommitEdit` stack; `adSep`/`adTh` are detection-only until Apply).
