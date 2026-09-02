# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P3 (**NEW S313 Pass F — the pass's largest leftover, held back only by the 2-per-pattern cap**) | flash_cards.html | **The mode pills (`.pill-group .pill`, 4) and the ten card-count buttons (`.count-btn`) have no hover rule at all** — the page's own `.btn:hover` uses `background:var(--paper)`, and every sibling chip class in the suite hovers (generator `.blend-type-btn`, dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S313 Pass F**) | hebrew_blend_generator.html | **The header's `← Home` link, `#darkToggle` and `#fsBtn` are inline-styled (`border:1.5px solid var(--gold-light)`) with no hover rule** — the only tool whose header buttons give no pointer feedback; dashboard/torah/trope `.hbtn:hover` (white .18 + border .3), flash `.h-btn`, dictionary `.dark-btn`/`#fsBtn` all hover. Fix = one CSS …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S313 Pass F**) | classroom_dashboard.html | **`.btn-xs` (Reset, ↺ Refresh) carries no `.btn` class so `.btn:hover` never reaches it, and the `.spoiler` toggle and the weather "links" anchor have no hover rule either** — the drawer's local idiom is `.timer-preset-btn:hover{border-color:var(--gold)}`. Three small rules; drawer chrome, so P4. Pattern …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**S312 Pass C rest-state gold, REDUCED — the three `role=status` notes shipped in `9cf8942`**) | Hebrew_Font_Maker.html, hebrew_blend_generator.html | **Text still painted brand `--gold` on light grounds at rest (2.6:1):** the Font Maker's `.hint-link`, `.wiz-os-row a`, `.sc-group h4`, `.pin-badge`, `.lt-need` (0.5rem); the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S312 Pass C — the S309 backlog's SMALLEST string, measured at RUNTIME**) | classroom_dashboard.html | **"Full Screen" under the header's fullscreen icon renders at 8px** (`.fs-btn .fs-cap` 0.5rem, 1280 and 800px alike) — the suite's smallest functional label, on the PROJECTED tool. The constraint is arithmetic, and a comment at `.hbtn.fs-btn` records why: icon 16 + gap 1 + cap 8 + …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S312 Pass C** — settings-drawer chrome, not projected content, so P4; four sibling carriers, converge together) | trope_tutor.html + torah_trainer.html (+ hebrew_blend_generator.html, hebrew_dictionary.html at 0.52rem) | **The font picker's attribution line renders at 8.64px and its `[DEFAULT]` marker at 8.8px** (`.font-opt-attr` 0.54rem; the inline `font-size:0.55rem` span in …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S312 Pass C** — one extra Tab stop on a two-tab strip; APG divergence, not a blocker) | trope_tutor.html | **Both Learn/Drill tabs are Tab stops** — neither carries `tabindex`, so the unselected tab is reachable by Tab as well as by arrows, where the APG tabs pattern puts only the selected tab in the Tab sequence (`tabindex="-1"` on the rest; arrows/Home/End already move + …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S311 Pass O — filed OUT of O per the pass's own boundaries; O keeps only tells**) | `Hebrew_Font_Maker.html`, the help popup | Three findings the popup sweep surfaced that belong to other passes. **To M:** `line-length` fires on all 14 tabs, but the detector's "~86 chars" is wrong — **measured 78 chars** at the real 592px body width and 13.76px type, i.e. just inside the 80 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S309 Pass O — DEFERRED BY THE MAINTAINER at gate 5: "wait, decide after the token lands", because `3333d60` changes what the right answer is in dark mode. Re-render and re-propose in S310.**) | classroom_dashboard.html ×4, flash_cards.html, torah_trainer.html, trope_tutor.html | **Seven `gpt-thin-border-wide-shadow` carriers that deliver their shadow through `var(--shadow-lg)` and …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S292 Pass H — the pass's headline finding; GATE 2 ASKED, maintainer chose "log it only, change nothing"**) | hebrew_dictionary.html | **"⭑ Save as Word List…" is discoverable only from a theme.** Word lists are the hub of the suite's whole cross-tool pipeline — `?wl=` feeds both the generator worksheet and the flash-cards drill — and there are three ways in, of which only two are …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S285 Pass C — a cross-tool DIVERGENCE, filed for F rather than as a defect**) | classroom_dashboard.html vs the other four tooltip carriers | **The dashboard binds its tooltip to the `.tip-icon`; the other four bind the `.tip-wrap`.** `wire()` sets `tabIndex`/`role`/`aria-expanded`/`aria-describedby` on the inner icon, while `bindTip` sets them on the wrapper. Both are …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S277 Pass M — a DISMISSAL with reasoning, the S276 email-period lesson's sibling**) | resources.html (+ any HE surface showing numeric ranges) | **HE grade ranges displaying '12–9' are Hebrew range typography, not scrambled data.** In an RTL paragraph a '9–12' range's digits stay LTR but the range reads right-to-left — Hebrew style legitimately writes ranges this way, and the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S260 Pass L; HALF-CLOSED S262** — one of the two shipped, one deliberately not) | flash_cards.html + hebrew_blend_generator.html | **~~(1) The dictionary is printable and never says so~~ — ✅ CLOSED S262, `ef8fc5a`, GATE-2 ASKED AND APPROVED ("dictionary printability only").** Shipped as the FAQ + `WebApplication.description` + visible `<details>` twin, all in one commit; copy …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S258** - re-logged from the S257 candidate with the reason it was not taken; a geometry change, so **gate 3** if ever pursued) | Hebrew_Font_Maker.html | **`#rulerCorner.rl-corner` is 22x22, under the 24px touch floor, and cannot be fixed with a `min-height`.** Its `width`/`height` are both `var(--rl-w)` - the ruler thickness declared on `.rl-layer` (22px) - so the corner is the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S248 Pass M** — the SIXTH carrier of the standing suite-wide shape; no longer a per-page note) | classroom_dashboard.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245, index S246, hebrew_blend_generator S247) | **Type-scale and radius micro-fragmentation on the projected board: 13 distinct font sizes over 47 text-bearing nodes, and 5 distinct radii …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S248 Pass N arm 3** — re-measured LIVE on a device descriptor, strengthening the S245 STATIC log rather than adding a carrier) | trope_tutor.html | **`.settings-modal` `height: 100vh` confirmed on real hardware emulation** — 664px === `innerHeight` === `visualViewport.height` on an iPhone 13, `#settingsBackdrop` likewise. S245 logged this page's drawer from source; this is the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S247 Pass N arm 3** — the THIRD carrier of a shape S245 already logged; now a suite-wide convergence question rather than a per-page note) | classroom_dashboard.html (+ torah_trainer.html, trope_tutor.html from S245) | **`.settings-modal` is `height: 100vh`, so on iOS Safari with the URL bar expanded the drawer's bottom sits under the browser chrome.** The ✕ is at the TOP of the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S247 Pass M** — the FIFTH page with this exact shape; a suite-wide convergence question, unchanged in kind since FM S225) | hebrew_blend_generator.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245, index S246) | **Type-scale micro-fragmentation and radius fragmentation, at the largest scale yet measured.** The generator renders text at **23 distinct sizes**, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S246 Pass M** — the FOURTH page with this exact shape, so it is now a suite-wide convergence question rather than a per-page note) | index.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245) | **Four text sizes inside a 2.08px band: 12 / 12.8 / 13.12 / 14.08px.** `button.ie-btn`+`footer` at 12, `#darkBtn`+`.card-attr` at 12.8, `p`+`.bookmark-btn` at 13.12, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S245 Pass N arm 3** — the one arm headless genuinely cannot measure, audited statically and reasoned per use site, exactly as the pass prescribes) | torah_trainer.html + trope_tutor.html | **The settings drawer is `height:100vh`, so on iOS Safari with the URL bar expanded its last panel sits in the strip the chrome covers.** Measured with the drawer open on iPhone 13: body …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S242 Pass L** — the deliberately-unshipped half of the gate-2 answer; ask again when the maintainer next wants SEO reach) | Hebrew_Font_Maker.html + index.html | **Three of the five crawler-facing FM surfaces still frame the tool as handwriting-only.** S242 fixed the WebApplication summary + added an import FAQ, because gate 2 was answered "minimal — structured data only". Still …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S230 Pass K**, arm 1 — the corpus's one genuine placeholder gap, recorded rather than fixed because the reason it exists is linguistic, not an oversight) | `locales/ui-strings.csv` | **`shared.folders.empty_list` is the only row in 4,375 that drops a placeholder for a real reason.** EN `“No saved {noun}s yet.”` → HE `“אין עדיין פריטים שמורים.”` (“no saved items yet”), losing which …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S218 Pass K** — needs 4 newly authored Hebrew terms, so it is gate-2 work, not wiring) | hebrew_dictionary.html (`locales/ui-strings.csv`) | **Four part-of-speech values have no filter row and so still print English in the Hebrew UI.** `ce75604` wired 19 of the corpus's 23 values by reusing the filter panel's existing keys; the remaining four — **proverb (19 entries), definite …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — it is a mapping decision, not wiring) | hebrew_dictionary.html | **The part-of-speech badge prints raw corpus vocabulary** (`noun`, `verb`, `adjective`, … from `w.pos`, ~L2768) and stays English in the Hebrew UI. Unlike the rest of the S192 haul this is **not** authored-but-unreferenced: the string match to `dictionary.shoresh.pattern_noun` is coincidental (that key …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — same mapping-decision class as the pos badge above) | flash_cards.html | **The Colors-mode selection tiles label their swatches in raw English** (`.color-tile-label` renders `c.name` — Red/Blue/… — straight from the COLOR_ITEMS table; proved at the reveal in HE, S207). No `flashcards.colors.*` key family exists — the `vowelgroup.color_*` reverse-lookup matches are …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**GATE 2 — panel copy/IA wording**; split from the S180 set S209) | torah_trainer.html | **The "Hebrew font" panel holds 17 typefaces and no size control, while the size sliders live ~330px away under "Display → Font sizes"** — neither panel references the other. Any fix is wording/IA (a cross-reference hint line, or moving a slider), so the wording is the maintainer's. | found: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 | Hebrew_Font_Maker.html | **The template PDF path could not be verified offline.** jsPDF and html2canvas are both CDN-blocked in the harness, so S169's Pass G produced artifacts through the **PNG-equivalent** route only (building the same page DOM `buildTemplatePageHTML` emits at `TPL_PAGE` size and letting the browser rasterize it). That covers layout, ink, clipping and page count — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283** — Culmus follow-ons from the meteg build; each names its source in Iorsh's fontforge-scripts) | Hebrew_Font_Maker.html | **Narrow-vowel variants under narrow letters** (vav/yod/nun/gimel/zayin/quf) when a meteg is present — `NarrowVowels.fea` + `CreatePrecomposedGlyphs.py`. Needs synthesized `.narrow` vowel glyphs + a ccmp chain keyed on the base letter. The natural next …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **Holam+rafe and shin-dot+rafe collision anchors** — `AddHebrewContextualGPOS.py`'s collision-avoidance anchors for above-mark pairs; today both attach at the shared above anchor and can overlap. Same contextual single-pos device the meteg pair uses, above class. | found: 2026-08-29, S283

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **The Yerushalam lamed-patah-hiriq rule and `jalt` wide-letter justification alternates** — `AddHebrewContextualGPOS.py` / `WideLetters.fea`. The jalt half overlaps the shipped ss02 wide forms (v5.33): the glyphs exist, only the `jalt` feature registration is missing. | found: 2026-08-29, S283

## Feature seeds (micro-features only; see the Micro-feature track in the session prompt)

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution path that actually needs a **file …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Erase should offer the backup it already tells you to take.** `home.alltools.erase_confirm1` reads *"This cannot be undone. Export a backup first if you want to keep your data."* — the flow **advises an action it does not offer**: the only way to comply is to cancel out, click Save, and start over, and the second `confirm()` then repeats the warning without repeating the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | classroom_dashboard.html | **A/B or rotating week cycles.** Needs a cycle dimension on `scheduleWeek` (cells per cycle-week), a "which week is it" anchor date, and cycle awareness in `computeWeekState`'s next-school-day scan — a real model change, not a sidecar. | found: 2026-08-06, weekly-grid build

## In progress

_(none)_

## Done

- [x] 2026-09-02 | (S313 close-out) | branch/deploy note | **⚑ LANDED DIRECT TO `main` ON MAINTAINER DIRECTION** ("push to main" after the close-out printed — the S306/S308/S311 authorization; `origin/main` re-verified at `facfbb6`, clean fast-forward `facfbb6..1ef6f74`, so PR #218 closes as merged). **Branch/PR: CONTINUED `claude/improve-loop-rzsgeu` → draft PR #218**, verified via the API first (`open, draft, merged:false, mergeable_state:clean`, head `8104f23`, base `facfbb6`). **Drift check: ZERO outside-loop drift** — `origin/main` still `facfbb6`, `sw.js` v631, `FONT_MAKER_VERSION` 5.37; clone still shallow. **`sw.js` …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `fc93f8f` | trope_tutor.html | (**S313 iter 5 — the S312 P3 the pointer named first for a trope-touching session**) **The mastery grid's 26 names (9.6px) and ✓/✗ stats (9.92px) move to 0.7rem = 11.2px**, the page's only sub-11px functional strings. | Measured before/after at 1280 + 800, EN + HE (names are transliteration, identical in both): 0/26 names wrap, no overflow, cells …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `9cf8942` | classroom_dashboard.html, flash_cards.html | (**S313 iter 4 — the rest-state half of the S309 gold backlog, the three `role=status` VALIDATION notes**) `#pickerClassNote`, `#presetNameNote` (dashboard) and `#startNote` (flash cards) painted `--gold` at rest, 2.6:1 on light — text a teacher must read to fix an error. Inline `color:var(--gold)` → `var(--gold-text)`, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `6c93749` | Hebrew_Font_Maker.html | (**S313 iter 3 — pattern `control-class-without-a-hover-state`, 2nd of 2 this session**) **14 unselected controls with no hover rule: 3 wizard `.wtab`, 7 category `.ctab`, 4 `.mode-btn` segments.** Tabs converge on the file's own `.ltile:hover` border-gold + `--text`; mode buttons on the generator's chip `--warm-gray` with an …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `8fef206` | index.html, resources.html, contact.html, privacy.html, terms.html, 404.html | (**S313 iter 2 — pattern `control-class-without-a-hover-state`, 1st of 2**) **The footer links had no hover rule on ANY chrome page** — gold, `text-decoration:none`, nothing changes under the pointer. One rule per page, `footer a:hover{text-decoration:underline}`, the idiom the 404 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | (S312 close-out) | branch/deploy note | **Branch/PR: NEW `claude/improve-loop-rzsgeu` → draft PR #218**, cut exactly where the S312 pointer said — but the pointer's expected base (`74573fa`) had moved: `origin/main` was force-updated to `facfbb6` before the session (`+ d3e299a...facfbb6 main -> origin/main (forced update)` on fetch), and the branch started AT `facfbb6`, so the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `5ac0fbd` | index.html, resources.html, hebrew_blend_generator.html, hebrew_dictionary.html, classroom_dashboard.html, torah_trainer.html, Hebrew_Font_Maker.html | (**S312 iter 4 — the S309 low-contrast backlog's hover half, suite-wide; pattern `contrast-inverted-by-a-hover-or-active-state`, colour-only shape**) **26 `:hover` rules on seven pages painted text `var(--gold)` on …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `56d85ad` | trope_tutor.html | (**S312 iter 3 — Pass C finding 2; pattern `sub-floor touch target`**) **The five "See it in the parsha →" links were 14px-tall targets** — a standalone 12.16px inline anchor on its own `.tu-card-links` row (no other text in the row, so not in-sentence-exempt), under the WCAG 2.5.8 24px floor and the suite's 30px bar. `padding-block:5px` on the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `3b98338` | trope_tutor.html | (**S312 iter 2 — Pass C finding 1; pattern `contrast-inverted-by-a-hover-or-active-state`, WIDENED to the colour-only shape**) **The tab strip and the slider ↺ reset painted `--gold` on hover — 2.6:1 on the cream ground in light mode** (14.72px bold and 12.48px text; AA needs 4.5:1), against rest states that pass. Both rules now use `--gold-text`, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | S312 iter 1 (**Pass C — accessibility, one tool; `trope_tutor.html`**) | trope_tutor.html (+ the 8-page hover census it spawned) | **Target from the rotation row's own per-tool history (trope S213 = stalest, generator S224 next), the S312 pointer's "RUN C" honoured after three consecutive O sessions; the S309/S310 backlog handed to C (gold-on-light contrast, sub-11px runtime …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | (S311 close-out) | branch/deploy note | **⚑ LANDED DIRECT TO `main` ON MAINTAINER DIRECTION.** After the close-out was printed the maintainer said "Push to main" — the same explicit authorization given at S306 and S308, superseding the loop's branch/PR protocol for this session. `origin/main` was re-verified still at `78761c8` and the branch confirmed a **clean fast-forward** …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `88f4940` | 9 files (index, resources, dictionary ×2, Font Maker, dashboard, flash cards, generator, torah, trope) | (**S311 iter 4 — the S310 gate-5 question, finally answered "Yes — restore the hairline on all 10"**) **Completed the S309/S310 reconciliation**: 7 `.tour-card` copies + `.wm-dialog` + `.ie-modal` + `.sg-modal` regain `1px solid var(--border)` and step their blur …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `a564269` | `Hebrew_Font_Maker.html` + `locales/ui-strings.csv` + `locales/{en,he}.json` | (**S311 iter 3 — Pass O bucket 1, gate-5 approved "Remove the duplicate"**) **The help popup offered "Take a tour" and "Shortcuts" twice on one screen** — the modal chrome carries both above the tab strip on all 14 tabs, and the Getting Started copy repeated them ~250px lower. Removed the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `0c86195` | `Hebrew_Font_Maker.html` | (**S311 iter 2 — Pass O bucket 1, gate-5 approved "Option A" + "Fix all four"**) **Pattern `elevation-cue-doubled-or-dead`, the "dead in the theme it is used in" inverse.** Seven `.active` rules in this file fill with `var(--navy)`; two carried a `body.dark` override and **four did not** — and `--navy` is one of the few tokens dark mode …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | (S310 close-out) | branch/deploy note | **Branch/PR: CONTINUED `claude/improveloop-deslop-pass-kaych8` → draft PR #216**, verified via the API before any work (`state:open, draft:true, merged:false, mergeable_state:clean`, head `2f6bf26`, base `78761c8`). **Drift check: ZERO outside-loop drift for the SEVENTEENTH straight session** — `origin/main` still `78761c8`, `sw.js` v628, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | `21d0067` | classroom_dashboard.html + flash_cards.html + torah_trainer.html + trope_tutor.html | (**S310 iter 2 — the S309 pointer's PRE-APPROVED first job, delivered; GATE 5 ASKED with two rendered sheets and answered "I like the hairline border" + "I like b"**) | **The 7 token-delivered `gpt-thin-border-wide-shadow` carriers, cleared by ONE rule.** These survived S309's …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-02 | S310 iter 1 (**Pass O — deslop, 2nd-ever run; the pass itself, no code change**) | `hebrew_blend_generator.html` (the target the S309 pointer named — 49 findings, the suite's largest, never O-audited) | **Detector: Impeccable 4.1.2 from the scratchpad clone; static arm NOT degraded, browser arm live under `PUPPETEER_EXECUTABLE_PATH` + `CI=1`.** **The generator is essentially …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | (S309 close-out) | branch/deploy note | **Branch/PR: CONTINUED `claude/improveloop-deslop-pass-kaych8` → draft PR #216**, verified via the API before any work (`state:open, draft:true, merged:false, mergeable_state:clean`, head `2d0a170`, base `78761c8`). The branch was cut fresh off `origin/main` exactly as the S309 pointer directed. **⚑ `git rev-parse --is-shallow-repository` …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | `3333d60` | classroom_dashboard.html + torah_trainer.html + trope_tutor.html | (**S309 iter 5 — GATE 5 ASKED with a 4-pair rendered before/after composite; the maintainer chose "Ship it — match Flash Cards"**) | **Dark mode had no working elevation on three pages.** All three define `--shadow-sm/md/lg` navy-tinted and never override them in the dark block, so …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | `2d0a170` | Hebrew_Font_Maker.html + classroom_dashboard.html + flash_cards.html + hebrew_blend_generator.html + hebrew_dictionary.html + torah_trainer.html + trope_tutor.html + resources.html | (**S309 iter 4 — GATE 5 ASKED; the maintainer chose "Sweep all 14 including .tour-card". ONE shared-component decision across 8 files, per O's "one decision, not thirteen" rule**) | …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | `e9ac7a4` | index.html + sw.js | (**S309 iter 3 — GATE 5 ASKED with the first before/after composite the pass ever produced; the maintainer chose "Option A"**) | **`.ie-modal` (the AllTools import/export dialog) stops hedging between two elevation cues** — the 1px hairline is dropped and the shadow deepened to `0 12px 32px rgba(0,0,0,0.24)`, since the modal already floats over …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | `e13cb9f` + `838f979` | .claude/skills/improveloop/SKILL.md | (**S309 iters 1–2 — the pass itself, built then de-coupled from its plugin**) | **Pass O ("Deslop") added to the rotation, with decision gate 5.** O asks a narrower question than M: not *is this beautiful* but **does this look like nobody chose it** — the reflex defaults that make generated interfaces recognizable on …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-01 | S309 iter 1 (**Pass O — deslop / AI-design-tell sweep, REGISTERED AND FIRST-EVER RUN; the pass itself, no code change**) | `index.html` then `classroom_dashboard.html`, with the static arm run over all 13 root pages for context | **Detector: Impeccable 4.1.2, shallow-cloned to the scratchpad; static arm NOT degraded (all four parser modules present) and browser arm live via …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

- 2026-09-02 | **S313** | iters: 1 pass (**F**) + 4 fixes = **5 (FULL BUDGET)** | tools touched: index, resources, contact, privacy, terms, 404 **×1 each** (`8fef206`), Hebrew_Font_Maker ×1 (`6c93749`), classroom_dashboard ×1 + flash_cards ×1 (`9cf8942`), trope_tutor ×1 (`fc93f8f`) | patterns …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-02 | **S312** | iters: 1 pass (**C**) + 3 fixes = **4 of 5** (the 5th deliberately unspent — trope's remaining P3s sit behind its cap, the dashboard caption is a header-rhythm decision, nothing else above P4 was verified-safe inside the caps) | tools touched: trope_tutor **×2 (AT CAP**: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-02 | **S311** | iters: 1 pass (**O**) + 3 fixes = **4 of 5** (the 5th deliberately unspent — the pass's remaining findings all belong to other passes or are gate-2 copy) | tools touched: font-maker **×3 (OVER CAP — divergence declared in the close-out entry**: iters 2+3 are the scoped …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-02 | **S310** | iters: 1 pass (**O**) + 1 fix + 2 (render/propose/revert cycles for the gate-5 proposals) + 1 close-out = **5 (FULL BUDGET)** | tools touched: dashboard **×1**, flash-cards **×1**, torah **×1**, trope **×1** (all inside `21d0067`, one shared decision) | patterns fixed: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-01 | **S309** | iters: 1 pass (**O — REGISTERED AND FIRST-EVER RUN**) + 1 skill build + 3 fixes = **5 (FULL BUDGET)** | tools touched: dashboard **×2 (AT CAP** — `2d0a170` sweep, `3333d60` shadow tokens**)**, torah **×2 (AT CAP)**, trope **×2 (AT CAP)**, index **×2 (AT CAP** — `e9ac7a4`, …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-01 | **S308** | iters: 1 pass (**I**) + 1 fix + 2 (micro-feature) + 1 fix = **5 (FULL BUDGET)** | tools touched: resources **×2, AT CAP** (`4ed31d9` the preview title stomped by a language switch; `53ab419` the next/prev font stepper — **the gate-1 micro-feature, charging 1 iteration**) + …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-01 | **S307** | iters: 1 pass (**D**) + 2 (micro-feature) + 1 fix + 1 fix = **5 (FULL BUDGET)** | tools touched: resources **×2** (`ff977f9` the preview decision footer — **the gate-1 micro-feature, charging 1 iteration**; `848fed9` the print rule — **cap-EXEMPT under the convention the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-01 | **S306** | iters: 1 pass (**G**) + 4 fixes = **5 (FULL BUDGET)** | tools touched: resources **×3 (⚑ OVER THE 2-PER-TOOL CAP — declared in the close-out; `afb5f3b` reverts cleanly if the maintainer wants the cap honoured)**, privacy **×2 (AT CAP** — `3748f52`, `44bd07c`**)**, terms …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-01 | **S305** | iters: 1 pass (**H**) + 1 fix + 1 fix + 1 seed-intake arm + 1 fix = **5 (FULL BUDGET)** | tools touched: resources **×2 (AT CAP** — `b7fa961` the filter chip counts + `5d8d28a` the fonts documentation & JSON-LD; **also the cap-exempt Pass-H target, its FIRST-EVER H and the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-31 | **S304** | iters: 1 pass (**M**) + 1 fix + 1 fix + 2 (micro-feature) = **5 (FULL BUDGET)** | tools touched: privacy **×1** + terms **×1** (`e093389` — **also the cap-exempt Pass-M target**), contact **×1** (`e093389`), hebrew_dictionary **×1** / hebrew_blend_generator **×1** / …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-31 | **S303** | iters: 1 pass (**N**) + 1 fix + 1 fix + 1 fix = **4 of 5** (gate 1 chose three fixes over a micro-feature, which is what the 5th would have cost) | tools touched: hebrew_dictionary **×2 (AT CAP** — `d2f6bc7` the unremembered Collapse-all, `73ec804` the phone rewriting the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-31 | **S302** | iters: 1 pass (**K**) + 1 fix + 1 (refutation) + 1 fix + 1 fix = **5 (FULL BUDGET)** | tools touched: hebrew_blend_generator **×2 (AT CAP** — `9f7dd36` the ternary tooltip, `32aed90` the class-set button label**)**, Hebrew_Font_Maker **×2 (AT CAP** — `2245a5a` two stale …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-31 | **S301** | iters: 1 pass (**L**) + 1 fix + 1 (seed intake) + 1 (verification closure) + 1 fix = **5 (FULL BUDGET)** | tools touched: classroom_dashboard **×1** (`0475af0`, the gate-2 enumeration fix), hebrew_blend_generator **×1** (`9125eb0`, the tour reveal) — both well inside the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-31 | **S299** | iters: 1 pass (**A**) + 2 (micro-feature) + 1 fix + 1 (seed intake) = **5 (FULL BUDGET)** | tools touched: classroom_dashboard **×1** (`143d482`, the gate-1 micro-feature), plus marker-comment-only edits to hebrew_dictionary / resources / Hebrew_Font_Maker in the same …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S298** | iters: 1 pass (**C**) + 2 fixes = **3 of 5 — STOPPED DELIBERATELY, first non-full session since S292** | tools touched: torah_trainer **×1**, trope_tutor **×1**, classroom_dashboard **×1** (all three in `1206653`), hebrew_blend_generator **×1** (`63cf248`). **No tool near …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S297** | iters: 1 pass (**B**) + 4 fixes = **5 (FULL BUDGET — fifth consecutive full session)** | tools touched: trope_tutor **×1** (`20ae43d`, the only site change); the rest is non-tool surface — SKILL.md ×2, the ledger ×2. **No tool near its ×2 cap.** | patterns fixed: **TWO NEW …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S296** | iters: 1 pass (**F**) + 4 fixes = **5 (FULL BUDGET — the fourth consecutive full session)** | tools touched: torah_trainer **×1** (`30e7ed0`), hebrew_dictionary **×1** + flash_cards **×1** (both in `38511d2`), plus `scripts/` + SKILL.md (`68575a9`) and CLAUDE.md …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S295** | iters: 1 pass (**I**) + 1 fix + 2 (micro-feature) + 1 fix = **5 (FULL BUDGET — the third consecutive full session)** | tools touched: flash_cards **×1** (`f803b78`, the gate-1 micro-feature); Hebrew_Font_Maker **×1** (`0c2b551`, comment-only); plus `locales/` (`f6f2b45`) …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S294** | iters: 1 pass (**D**) + 4 fixes = **5 (FULL BUDGET — the second consecutive full session)** | tools touched: Hebrew_Font_Maker **×1** (`fa1f88f`, **also the cap-exempt Pass-D target**), hebrew_dictionary **×1** (`6115d4b`), contact **×1** (`c055044`), improveloop skill …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-08-30 | **S293** | iters: 1 pass (**G**) + 2 fixes + 2 (micro-feature) = **5 (FULL BUDGET — the first full session since S290, and it broke the two-session short streak by doing exactly what the S293 pointer prescribed: weighting the discovery pass onto a surface that would actually yield)** …[full text: IMPROVEMENT_ARCHIVE.md]

### Tool coverage (last-touched date per tool)

- **S313 (2026-09-02):** index, resources, contact, privacy, terms, 404 **2026-09-02 (×1 each, `8fef206` footer hover)**; Hebrew_Font_Maker **2026-09-02 (×1, `6c93749` tab/mode-button hover)**; classroom_dashboard + flash_cards **2026-09-02 (×1 each, `9cf8942` validation-note gold)**; trope_tutor **2026-09-02 (×1, `fc93f8f` mastery-grid floor)**; hebrew_dictionary, hebrew_blend_generator, torah_trainer 2026-09-02 (S312 `5ac0fbd`); `locales/` 2026-09-02 (S311).

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`control-class-without-a-hover-state`** (**NEW, registered 2026-09-02 (S313 Pass F) — 20 carriers on 7 pages fixed in 2 commits (`8fef206`, `6c93749`), 3 classes logged as Candidates (flash `.pill`/`.count-btn`, generator header trio, dashboard `.btn-xs`/spoiler/links). …[full text: IMPROVEMENT_ARCHIVE.md]

- **`elevation-cue-doubled-or-dead`**: **re-swept 2026-09-02 (S311 Pass O, `Hebrew_Font_Maker.html` help popup) — hits: 14, ALL FIXED. Clean streak: 0 — ACTIVE.** Two shapes this sweep, and the second is the more interesting: **(a) 4 DEAD SELECTION CUES** (`0c86195`) — …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sibling-page-missing-a-shared-declaration`** (**NEW, registered 2026-08-31 (S304 Pass M) — 3 carriers found and fixed in one commit**): several pages render the *same* markup (a shared header/footer element, a chrome component) but one or more of them omit a declaration the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`panel-collapse-writer-mismatch`** (**NEW, registered 2026-08-31 (S303) — swept across all 6 panel-collapse carriers; 4 hits in 3 files, ALL FIXED; 2 carriers clean. ACTIVE**): a **bulk** writer of the `.collapsed` class that disagrees with the panel-collapse memory's …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: **FOUR MORE ARTIFACTS at 2026-08-31 (S300), all caught before any verdict was filed — the pattern is now four-for-four and remains the loop's most valuable registered pattern. ACTIVE (method pattern; never retires).** S300's …[full text: IMPROVEMENT_ARCHIVE.md]

- **`invisible-rebuild-on-a-hot-render-path`**: **re-swept 2026-08-31 (S299 Pass A) — hits: 0. Clean streak: 1 — ACTIVE.** Swept on the exact four surfaces the S294 registration named as unswept (dashboard settings drawer, flash-cards setup, torah + trope drawers), by the …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: **re-swept 2026-09-02 (S312 Pass C, `trope_tutor.html`, pseudo-aware) — hits: 1 class (the 5 `.tu-card-links a` at 14px tall), FIXED `56d85ad`; clean streak: 0 — ACTIVE.** S298's tooltip fix HOLDS (`.tip-icon::after { inset:-5px }` = 25×25; …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`author-display-defeats-the-hidden-attribute`** (**NEW, registered 2026-08-30 (S297) — 1 carrier found and fixed, then the whole suite swept CLEAN**): an element carrying the `hidden` **attribute** whose CSS also sets a `display`. The UA stylesheet's `[hidden] { display:none …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`mobile-input-hints`**: **re-swept 2026-08-30 (S292 iter 4) — hits: 1, FIXED** (`a393343`, `Hebrew_Font_Maker.html` `.guide-name`, closing the S290 Pass N arm-5 candidate — the file's one field with `spellcheck` but no `autocapitalize`/`autocorrect`; all three attribute sets …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**NEW, registered AND CLOSED 2026-08-29 (S291 iters 2+4) — 2 carriers found, both fixed, suite census clean**): a rule paints text with a token whose value is tuned for the OTHER theme's ground, so it is correct in one mode and …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: **2nd carrier FIXED 2026-08-29 (S287 iter 2, `5197b1e`) — the flash-cards half the S286 registration sweep found and filed. Hits this session: 1 carrier (6 fields). Clean streak: 0 — ACTIVE** (consequence-critical: a tab-freezing …[full text: IMPROVEMENT_ARCHIVE.md]

- **`var()-on-an-undefined-custom-property`**: **re-swept 2026-08-29 (S286 Pass A) — hits: 0. Clean streak: 1 — ACTIVE.** **⚑ THE DETECTOR IS NOW A RUNTIME ONE AND THE STATIC SUSPECT-GENERATOR IS RETIRED — do not go back to grepping.** S285 registered a static reader with a 46:1 …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: **re-swept 2026-08-29 (S286 Pass A, suite-wide runtime) — hits: 0. Clean streak: 1 — ACTIVE.** Detector: any element carrying `.active`/`.selected`/`.current`/`.on` that is a control (button/link/`role`/`onclick`/tabbable), is visible, has **≥1 …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: **re-swept 2026-08-29 (S286 Pass A, all 13 pages at runtime) — hits: 0. Clean streak: 1 — ACTIVE.** Measured, never grepped, per the CLAUDE.md rule: `newContext({reducedMotion:'reduce'})` then count every element with a …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab** (**NEW, registered 2026-08-28 (S279 Pass G) from the S252 dictionary `#appToast` + this session's flash_cards `.panel` — two carriers of one shape, 27 sessions apart**): a box-shadow is a DRAWING, so `printBackground:false` / the print dialog's …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (**NEW, registered 2026-08-28 (S277 Pass M) from S276's `15684a6` + S277's `eb4ce00`/`f70d500` — three carriers of one shape inside two sessions**): deliberately-untranslated English PROSE (attribution credits, directory data, @handles …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value**: **RE-SWEPT 2026-08-31 (S302 Pass K, 3rd sweep, suite-wide) — census 2,310 sites (up from S289's 2,188 — the surface keeps growing), raw 7 → hits: 3**, all fixed in-pass (`2245a5a`) and re-swept 0; **clean streak: 0 — ACTIVE.** The …[full text: IMPROVEMENT_ARCHIVE.md]

- **undocumented-global-keyboard-shortcut**: **swept 2026-08-27 (S265 iter 4, sweep 2 — WIDENED past both registered blind spots), hits: 0. Clean streak: 1 — ACTIVE.** First swept S264 (1 hit, `flash_cards.html`, fixed `f65ce58`).** **Definition:** a `document`-level `keydown` …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-size-control-holding-translatable-text**: **re-swept 2026-08-27 (S264 iter 3), WIDENED PAST ITS REGISTERED BLIND SPOT for the first time -- hits: 0 real. Clean streak: 1 -- ACTIVE.** Sweep 2 measured the shape sweep 1 could not see: leaf elements carrying NO …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **legibility-destroyed-by-a-second-dimming-layer**: **re-swept 2026-08-27 (S263, all 3 `#fsExitBtn` carriers) -- hits: 1 (`hebrew_blend_generator.html`, the LAST unfixed carrier), fixed in-pass (`eb0eab3`); clean streak: 0 -- ACTIVE, consequence-critical (legibility), never …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-control-positioned-outside-the-viewport**: **REGISTERED + first swept suite-wide 2026-08-26 (S262 Pass N) -- hits: 1 carrier (`hebrew_blend_generator.html` `#sidebarToggleBtn`), fixed in-pass (`5f6a0a0`); census 78 cells (13 pages x 3 phone descriptors x EN/HE) …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **executable-javascript-in-a-localization-cell**: **REGISTERED 2026-08-26 (S261 Pass K) — swept the whole corpus, hits: 2 rows / 4 cells, all fixed in-pass (`ff1789e`); clean streak: 0 — ACTIVE, consequence-critical (security-shaped), never retires on streak.** **Definition:** …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n-html-markup-only-in-fallback**: **re-swept 2026-08-26 (S261 Pass K, suite-wide, K inherits this pattern from S260) — hits: 2 carriers, both fixed in-pass (`ae95aba`); clean streak: 0 — ACTIVE.** **THE DETECTOR IS NOW WIDER THAN THE ONE S260 REGISTERED, and the widening …[full text: IMPROVEMENT_ARCHIVE.md]

- **global-keydown-preventDefault-without-target-guard** (**NEW, registered 2026-08-28 (S272 Pass A) from S271’s `38ab28f`**): a document/window-level `keydown` handler that calls `preventDefault()` on Enter/Space (or another activation/printable key) with no interactive-target …[full text: IMPROVEMENT_ARCHIVE.md]

- **row-siblings-with-mismatched-heights**: **re-swept 2026-08-26 (S259, `hebrew_dictionary.html` header, EN/HE × 8 widths) — hits: 1, fixed in-pass (`3b895d7`); clean streak: 0 — ACTIVE.** Heights 24/37/39 → 24/24/25. **The detector's registered weakness showed again and the …[full text: IMPROVEMENT_ARCHIVE.md]

- **debounced-persistence-with-no-page-hide-flush**: **re-swept 2026-08-26 (S258 Pass A) - hits: 1 NEW carrier (`classroom_dashboard.html`), fixed in-pass (`cf244df`); clean streak: 0 - ACTIVE, consequence-critical (data loss), never retires on streak.** **The hit widens the …[full text: IMPROVEMENT_ARCHIVE.md]

- **state-mutation-that-never-arms-its-persistence**: **re-swept 2026-08-26 (S257) - hits: 1, the knowingly-deferred `setInputMode`, now fixed (`57abf9c`); clean streak: 0 - ACTIVE (consequence-critical: data loss, so it never retires on streak).** **The fix shape is the finding …[full text: IMPROVEMENT_ARCHIVE.md]

- **flex-column-crushing-its-own-rows** (**NEW, registered 2026-08-23 (S249 Pass N arm 4)**): a `display:flex; flex-direction:column` container that is ALSO height-constrained and scrollable (`max-height`/`flex:1` + `overflow-y:auto`) silently **compresses its children instead …[full text: IMPROVEMENT_ARCHIVE.md]

- **translated-sibling stray** (a display site rendering a raw English name/string while an authored AND translated key for that exact string is already used by a sibling site in the same file — often one or two lines away): **REGISTERED 2026-08-22 (S243) on its FOURTH …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- `mobile-input-hints` (a text input that takes a code, a URL, or non-English text but carries no typing hints): **re-swept 2026-08-28 (S267 iter 3, `flash_cards.html` `#presetName` — the twin-reconciliation the S266 feature build logged) — hits: 1, fixed (`05fdcab`); clean …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n cross-column parity (placeholders, plurals, inline markup)**: **REGISTERED 2026-08-19 (S230) — a NEW pattern, owned by pass K. hits this sweep: 1 real (`dictionary.translit.credit`, fixed 63b15bf) + 1 logged-by-design (`shared.folders.empty_list`, closed 3fc6bda by gate …[full text: IMPROVEMENT_ARCHIVE.md]

- **horizontal-overflow-at-narrow-widths**: **re-swept 2026-08-29 (S290 Pass N, `Hebrew_Font_Maker.html`) — hits: 0 across 15 cells; clean streak: +1 — ACTIVE.** **⚑⚑ THE DETECTOR THIS PATTERN AND PASS N's ARM 1 HAD BEEN USING CANNOT FIRE ON A PHONE — read this before any future …[full text: IMPROVEMENT_ARCHIVE.md]

- **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-inverted-by-a-hover-or-active-state**: **re-swept 2026-09-02 (S312 Pass C + iters 2 + 4, suite-wide at RUNTIME) — hits: 28 `:hover` rules on 8 pages, ALL FIXED (`3b98338` trope, `5ac0fbd` the other seven); clean streak: 0 — ACTIVE (consequence-critical: a …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-below-AA-on-a-tinted-or-coloured-plate**: **re-swept 2026-08-23 (S249 Pass M, `flash_cards.html` — card front AND back, results screen, and setup screen with every `.panel`/`<details>` force-expanded) — hits: 0 across 20 cells; clean streak: 1 — ACTIVE …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire …[full text: IMPROVEMENT_ARCHIVE.md]

- **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the …[full text: IMPROVEMENT_ARCHIVE.md]

_(**S215 ran Pass E, a discovery pass — no ACTIVE sweep pattern was exercised, so no streak moved.** One adjacent receipt worth keeping: `animation-outside-its-reduced-motion-block` (hit at S214, streak 0) was **re-measured at runtime on the two pages S214 did not touch** — …[full text: IMPROVEMENT_ARCHIVE.md]

_(**S214 Pass A swept the delta `b0414e5..HEAD`** — 58 commits, 1,747 added lines, 13 files. **2 classes HIT and reset to streak 0** (`animation-outside-its-reduced-motion-block`, `decorative-glyph-carrier-exposed-to-assistive-tech`); the consequence-critical trio …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

_(**S213 exercised NO ACTIVE sweep pattern** — Pass C is an accessibility audit of one tool, not a pattern sweep. Every existing pattern's streak and last-swept date is unchanged; **one NEW pattern is registered below**. The S212 pointer's warning still stands for whoever runs A …[full text: IMPROVEMENT_ARCHIVE.md]

- **decorative-glyph-carrier-exposed-to-assistive-tech** (**2nd instance fixed 2026-08-15, S219, c2399f1 — Font Maker QA column heads**. That instance sharpened the pattern in a way every future sweep needs: **`aria-label` on the element is NOT a fix for this class.** The FM …[full text: IMPROVEMENT_ARCHIVE.md]

_(**S211 exercised NO ACTIVE sweep pattern** — Pass F is a cross-tool consistency audit, not a pattern sweep, and none of its four fixes fell in a registered class. Every pattern's streak and last-swept date is unchanged from S203's sweep; the trio of consequence-critical …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **error-status-clobbered-by-a-later-routine-write** (**NEW, registered S199**): a status/live-region line that correctly reports a FAILURE is then overwritten, on the same code path, by a later **routine** write that assumes the happy state — so the diagnostic exists in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **content-dependent-tour-step-miscounts-the-tour** (**NEW, registered S197**): a guided-tour step whose `target()` only exists once remote/corpus content has rendered. The engines all skip an unresolvable step **silently by design** ("skip gracefully when hidden"), but the …[full text: IMPROVEMENT_ARCHIVE.md]

- **per-sample-repaint-of-an-O(n)-live-preview** (**NEW, registered S196**): a continuous gesture — `pointermove`, a slider drag — that rebuilds an **O(n) preview from its whole accumulated buffer once per input SAMPLE** rather than once per animation frame, so the gesture is …[full text: IMPROVEMENT_ARCHIVE.md]

- **false-positive-validator-on-the-app's-own-content** (**NEW, registered S194**): a QA/lint/warning rule whose **detector is broader than the failure it warns about**, so it fires on artwork or data the app itself ships — the user cannot act on it, cannot clear it, and it is …[full text: IMPROVEMENT_ARCHIVE.md]

- **JSON-LD ↔ visible-content parity** (**UN-RETIRED 2026-08-08, S190** — retired at S64, re-check ownership moved A2→Pass L at S142, and L's 5th run found it recurred): an `application/ld+json` FAQ/HowTo/ItemList claim that no longer describes the shipped tool. **Detection, as …[full text: IMPROVEMENT_ARCHIVE.md]

- **wired-then-clobbered label** (NEW, registered S192): an element that carries a **correct `data-i18n` binding** and is then **overwritten by a JS setter with a hardcoded English literal** — so `applyStaticI18n` translates it and the setter immediately reverts it. Distinct …[full text: IMPROVEMENT_ARCHIVE.md]

- **theme-flipping-token-on-a-fixed-colour-plate** (NEW, registered S191): a control or text node styled with a colour token that **inverts with the theme** — `var(--text)`, `var(--white)`, `var(--muted)` — placed inside a container painted a **fixed** colour that does not …[full text: IMPROVEMENT_ARCHIVE.md]

- **two-state-ready-flag-for-a-three-state-load** (NEW, registered S189): a lazily-fetched corpus or module whose UI decides what to render from a single truthiness check — `REAL_WORDS.length`, `EMOJI_DATA`, `_wordsReady`. **That flag has two states; the fetch has three** (never …[full text: IMPROVEMENT_ARCHIVE.md]

- **invalid-SVG-geometry-from-an-unclamped-difference** (NEW, registered S187): an SVG `width`/`height` computed as the difference of two mapped coordinates (`fx(b) - fx(a)`, `x1 - x0`) where one side comes from a **derived** value that can legitimately go negative — so the …[full text: IMPROVEMENT_ARCHIVE.md]

- **RTL-inheritance-on-a-Latin-script-container**: **re-swept 2026-08-29 (S290 iter 4, `hebrew_dictionary.html` word cards) — hits: 1 carrier (`.wc-transl` + `.wc-translit`), fixed `21538fc`; clean streak: 0 — ACTIVE.** **4th carrier of the shape registered at S185, and the …[full text: IMPROVEMENT_ARCHIVE.md]

- **silent-external-media-failure** (an `<audio>`/`<video>`/media element pointed at a third-party host with play/pause/ended handlers wired but **no `error` handler**, so a blocked or dead origin produces silence while the controls still show a live playing state. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **print-trailing-dead-space** (padding/margin BELOW the last line of a print flow — page-container bottom padding, a scroll wrapper's, the last block's own margin — which paginates exactly like content, so a document ending near a page boundary pushes empty box onto a sheet of …[full text: IMPROVEMENT_ARCHIVE.md]

- **lazily-loaded-dependency-renders-an-empty-shell** (a feature whose data comes from a lazily-loaded external module keeps rendering its full chrome — column, header, row label, legend — when the module never arrives, so the user gets a labelled void with the toggle still …[full text: IMPROVEMENT_ARCHIVE.md]

- **print-media-leak / var-chain-overridden-by-a-literal** (a screen-only `@media (max-width:N)` block whose declarations also apply to PAPER — print media has a width too — or, more generally, a literal `font-size`/colour declaration that out-specifies a `var(--x)` chain the …[full text: IMPROVEMENT_ARCHIVE.md]

- **incomplete-print-token-reset** (a `@media print` dark-token re-statement that restates SOME of the theme tokens the dark block overrides but not all — the missing ones keep their dark values on paper. Detection: diff the token list inside the print block's `html.dark-early …[full text: IMPROVEMENT_ARCHIVE.md]

- **referenced-but-unauthored i18n key** (a key the code LOOKS UP that does not exist in the CSV — the exact inverse of `authored-but-unreferenced`. The user sees the English fallback, so nothing looks broken, but every render logs an `[i18n] missing key` warning, and those …[full text: IMPROVEMENT_ARCHIVE.md]

- **untrusted-shape-on-read** (a store that arrives from an imported `.ivrit` / AllTools file — hand-editable text — is read back with its SHAPE assumed: `results.map`, `(r.cards||[]).forEach`, `results.slice().reverse()`. A `null` entry, a non-array `results`, or a non-array …[full text: IMPROVEMENT_ARCHIVE.md]

- **blocking-alert-for-a-routine-path** (an `alert()` guarding an outcome that is NORMAL rather than exceptional — a denied permission on a managed device, a primary action that cannot run yet — where CLAUDE.md's inline-validation rule wants an inline note plus `aria-disabled` + …[full text: IMPROVEMENT_ARCHIVE.md]

- **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a …[full text: IMPROVEMENT_ARCHIVE.md]

- **parse-per-call on a growing store** (a `read<Store>()` helper that re-parses its whole localStorage blob on every call, called O(n) times per render, over a store that grows without bound as the teacher uses the tool — so the tool punishes use, and the cost is invisible at …[full text: IMPROVEMENT_ARCHIVE.md]

- **authored-but-unreferenced i18n key family** (a `*.<family>.*` group that exists in `ui-strings.csv`, is fully translated, and is referenced **nowhere** in the page that owns it — so a Hebrew-UI user sees English while the translation sits in the repo. Costs nothing to fix …[full text: IMPROVEMENT_ARCHIVE.md]

- **sub-floor touch target on a shared small-button class** (NEW, registered S193): a small-control class — `.btn-xs` and its kin — whose size comes from `padding` **alone**, so its rendered height lands below the suite's ratified **30px** floor (WCAG 2.5.8 asks 24px). Because …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero: swept 2026-07-17 (S93), hits: 0 (the dashboard movable-panels feature 639fcf8/53e50fc uses array-order `panelLayout` with no numeric restores; zone reorder is array-index splicing; its guards use `=== undefined`, not `||`), clean streak: **3 → RETIRED S93** (3 …[full text: IMPROVEMENT_ARCHIVE.md]

- localStorage-vs-AllTools: **swept 2026-08-16 (S221 Pass I), hits: 1 — clean streak 3→0 — ACTIVE** (consequence-critical: data loss / backup completeness, so it stays ACTIVE regardless of streak). **The hit SHARPENS this pattern's detection definition and every prior sweep of …[full text: IMPROVEMENT_ARCHIVE.md]

- unescaped-input / unsafe-parse: **re-swept 2026-07-25 (S158), hits: 0** (`0dc1e50..HEAD` — **0 new `innerHTML`/`insertAdjacentHTML`/`outerHTML`, 0 new `JSON.parse`/`Object.assign`, 0 new `fetch`/`setAttribute('href'|'src'|'on*')`**. Tightened beyond added-sink-lines to catch …[full text: IMPROVEMENT_ARCHIVE.md]

- destructive-bulk: **re-swept 2026-08-28 (S272 Pass A, delta `b2f455b..HEAD`), hits: 0** (zero new loops write stored per-item data; the S268 calendar import writes cells only through its preview+confirm flow, the S269 purge is confirm-guarded and deletes only the legacy rows …[full text: IMPROVEMENT_ARCHIVE.md]

- **ivrit-gather-gap** — **3rd fix landed 2026-08-06 (S185)**: flash_cards' `hebrewFlashCards_pbStreak`, absent from BOTH of the tool's save paths and from `apply()`, now round-trips with AllTools' max rule (94d1222). The class's remaining known surface is clean. Original …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **symbol-only accessible name** (an icon-only control whose ENTIRE accessible name is a glyph with no letter or digit — "×", "↺", "✕", "⬛", an emoji run — because for `button`/`a`/`role=button` the ACCNAME chain takes **name-from-content BEFORE `title`**, so a correct …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- nameless-adjacent-text-labeled control (a visible interactive control — toggle switch, slider, number field, select, colour well — whose only label is **adjacent text** that is never programmatically associated, so it has NO accessible name; the wrapping `<label …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- dead-feature-guard (a `typeof X === 'function'` / feature-detection guard whose **preferred** implementation does not exist on that page, so the guarded branch can never run and control silently falls through to a worse path — or to nothing): **re-swept 2026-07-25 (S158, Pass …[full text: IMPROVEMENT_ARCHIVE.md]

- **modal-focus-trap** (an element declaring `role="dialog"` + `aria-modal="true"` — which tells assistive tech the rest of the page is inert — with **no Tab/Shift+Tab wrap**, so keyboard focus walks out behind the dialog onto controls the AT has been told do not exist; worst on …[full text: IMPROVEMENT_ARCHIVE.md]

- pre-ready-i18n / never-re-rendered — **4th instance fixed 2026-08-06 (S185)**: torah_trainer's TTS voice readout, which `applyI18n` had never re-run (30fe852). **Fix-shape note for the next instance: adding the function to `applyI18n` is only half the fix.** If the pre-ready …[full text: IMPROVEMENT_ARCHIVE.md]

- _(**shadowed-global helper RETIRED at S73** — 3 consecutive clean sweeps (registered S40 w/ 2 torah hits fixed, then clean S64 + S73 over the i18n rollout: one `esc`/`applyI18n` per file; FM `t()` + `pwa.js` `t()` are intentional in-scope locals); correctness-scoped, not …[full text: IMPROVEMENT_ARCHIVE.md]

- _**Retirement rule (as applied):** a pattern retires after 3 consecutive clean sweeps **UNLESS it is consequence-critical** (security or data-loss). The three that hit 3-clean at S64 — unescaped-input/unsafe-parse (XSS), localStorage-vs-AllTools (backup), destructive-bulk …[full text: IMPROVEMENT_ARCHIVE.md]

- **placeholder-as-only-accessible-name** (a text input/textarea whose ONLY name source is its `placeholder` — no `aria-label`, `aria-labelledby`, `label[for]`, wrapping `<label>` or `title`. Under ACCNAME `placeholder` is the last-resort source, so the name is announced on an …[full text: IMPROVEMENT_ARCHIVE.md]

### Retired patterns

_(**All six re-confirmed dead 2026-08-01, S179 — the first A2 to cover the whole retired set in one pass.** Delta-only (`30d653f..HEAD`, 611 added lines), per-class receipts in the sweep-status entry above. None un-retired.)_

- falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a wrong restored value, not data-loss) → not a consequence-critical carve-out → auto-retired. Re-checked only in Pass A2. **Watch:** any new tool with numeric/boolean …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()` in `shortcutGroups()` and `pwa.js`'s self-contained `t(key,fallback)` are intentional in-scope locals, never reach a global-`t` call site). Correctness-scoped, not …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- listener/interval accumulation (a `setInterval`/`setTimeout`/`addEventListener` attached repeatedly without clear/remove) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 over the S53–S63 surface — generator chunked-build timer single/self-chaining + `cancelWorksheetBuild` clears on re-entry, `beforeprint` attached once, torah color fns add no listeners, `_appToastTimer` clear-guarded). Structural/perf-scoped → auto-retired. Re-checked only in Pass A2.

- ~~JSON-LD ↔ visible-content parity~~ **← UN-RETIRED 2026-08-08 (S190); it now has an ACTIVE Pattern-health line above. Kept here for its history only.** (an `application/ld+json` FAQ/HowTo/ItemList claim drifting from the visible UI or code constants) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 — no `ld+json` block changed across S53–S63; spot-checked torah/generator/trope/FM claims still accurate). SEO/cosmetic-scoped → auto-retired. **Re-check ownership moved from Pass A2 → Pass L (SEO & discoverability) on L's …[full text: IMPROVEMENT_ARCHIVE.md]

- workMode/step reachability (controls reachable in only one workMode/step while the workflow steers users past it) | retired 2026-07-10 (S52) | 3 consecutive clean sweeps (S36, S41-scoped, S52 — trope_tutor's drawer/tabs/tour-skip/mid-drill-return all reachable-by-design). Re-checked only in Pass A2.

- undo-wiring (Font Maker: `markDirty()` without `udDo`/`udBurstBegin`/`udNudgeTick`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; the S25–26 keyboard additions (node-insert, crop) verified as routing through `udDo` or deliberately non-undoable. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the un-swept FM v3.9–v4.2 additions (auto-detect Apply via `udDo(...withSource)`, pen contour, node delete/paste/transform/specks/fillet all `udDo`; `_hiddenContours`/opacity/snapGuides are documented view-only).

- slider-commit (Font Maker: `oninput` range sliders lacking `onchange="udBurstCommit()"`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; every project-data slider commits, and no new range slider has been added. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the FM v3.9–v4.2 sliders (fillet `filletLiveInput`/`filletCommit` burst; size setters commit; mark-editor `meSetDotSize` uses its own `meBeginEdit`/`meCommitEdit` stack; `adSep`/`adTh` are detection-only until Apply).

## Recurring-pattern sweep status

- `sibling-page-missing-a-shared-declaration`: **first sweep 2026-08-31 (S304 Pass M) — 3 hits, all fixed in `e093389`.** Surface covered: every root page carrying `<span class="star">` (12 of the 14), computed `color` censused in BOTH …[full text: IMPROVEMENT_ARCHIVE.md]

- `panel-collapse-writer-mismatch`: **first sweep 2026-08-31 (S303, Pass N iters 2–3).** Surface: all six carriers of the shared panel-collapse block (`torah_trainer`, `classroom_dashboard`, `trope_tutor`, `hebrew_blend_generator`, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`mobile-input-hints`**: swept 2026-08-30 (S292 iter 4) over `Hebrew_Font_Maker.html`, the one carrier the S290 Pass-N arm-5 candidate named, plus a targeted re-check of `hebrew_dictionary.html`. **Detection used here was not a grep for …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`**: swept 2026-08-29 (S291 iters 2+4) over **all 14 root HTML files** via `grep -o '[^{};]*{[^{}]*color:var(--gold-light)[^{}]*}'`, then per-hit adjudication of the EFFECTIVE background (walk …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: swept 2026-08-29 (S287 iter 2) over `flash_cards.html`, the carrier S286's registration sweep had identified but not had budget to fix. **Method:** poison one field at a time with …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **S286 Pass A (2026-08-29)** — surface `919f8fc..HEAD` = **43 commits / 23 files / +1,123 −197** (the whole S273–S285 haul plus, as the prize, the S283 meteg build's +525 lines in the Font Maker, which no A had ever swept). **Nothing …[full text: IMPROVEMENT_ARCHIVE.md]

- **`var()-on-an-undefined-custom-property`**: swept 2026-08-29 (S285 iter 4) over **all 14 root HTML files** — the pattern's registering sweep. Static pass (definitions + `setProperty` literals vs no-fallback `var()` references) raised …[full text: IMPROVEMENT_ARCHIVE.md]

- **`theme-flipping-token-on-a-fixed-colour-plate`**: swept 2026-08-29 (S285 Pass C) over `hebrew_dictionary` in full plus a targeted 6-carrier cross-tool census of the shared font-picker labels. **2 hits, both fixed.** Detection was the …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild** (S284 iter 3, 2026-08-29): registration sweep — **15 sliders driven by real ArrowRight presses across all 6 other tools (generator 3, dashboard 4, torah 5, trope 2, flash_cards 1): 0 lost focus.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (S284 iter 5, 2026-08-29): registration sweep — live census on an iPhone 13 descriptor of every `.tip-wrap`/`.has-tip`/`.tip-icon` in the five `bindTip` carriers, counting only triggers …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab** (S279 Pass G, 2026-08-28): registration sweep — flash_cards' `.panel` fixed (`7e77b28`, universal print shadow-kill + the ✓/✗ mark row print-hidden); census of trope/dictionary/generator/dashboard/torah …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (S277 Pass M, 2026-08-28): registration sweep — the three KNOWN carriers measured and fixed (footer credit phrases ×10 pages `eb4ce00`, BEFORE control 10/10; resources descs `f70d500`, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-width-third-party-embed-inflates-phone-layout** (S276 Pass N, 2026-08-28): first sweep, suite-wide mount census (`.h-captcha` / `hcaptcha.render` / `<iframe` / embed SDKs): 3 mounts → 2 carriers fixed (contact `23b2387`, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value** (S302 Pass K, 2026-08-31): **3rd sweep, suite-wide — 14 root pages, 2,310 sites with an authored fallback → raw 7, true 3, all fixed `2245a5a`, re-swept 0.** Detection: parse static markup …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value** (S289 Pass K, 2026-08-29): **2nd sweep, suite-wide — 13 root pages, 1,760 text fallbacks + 428 attr twins = 2,188 sites → 8 stale, all fixed `1292e80`, re-swept 0.** The attr-twin surface grew …[full text: IMPROVEMENT_ARCHIVE.md]

- undocumented-global-keyboard-shortcut: **sweep 2, 2026-08-27 (S265 iter 4) — CLEAN, 0 new hits, both registered blind spots closed.** Widened detector: brace-matched full handler bodies (16 key-bearing global handlers across all 14 root …[full text: IMPROVEMENT_ARCHIVE.md]

- fixed-size-control-holding-translatable-text: **swept 2026-08-27 (S264 iter 3) -- sweep 2, the WIDENED arm.** Surface: 13 pages x EN/HE, as loaded then with settings drawers opened and all `.panel.collapsed` expanded. Method: for every …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-size-control-holding-translatable-text**: first swept **2026-08-27 (S263)**. Surface: all 13 root pages x EN/HE, run twice -- as-loaded and again with every settings drawer opened and every `.panel.collapsed` expanded (52 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-control-positioned-outside-the-viewport**: first sweep 2026-08-26 (S262 Pass N). Surface: **all 13 root pages x iPhone SE 320 / iPhone 13 390 / Pixel 7 412 x EN/HE = 78 cells**, real device descriptors (not resized windows). …[full text: IMPROVEMENT_ARCHIVE.md]

- **S261 Pass K (2026-08-26) — the i18n corpus, swept as data rather than as strings.** Surface: `d662a92..HEAD` = 133 commits / 20 files / +7,293 −420 (all of S244–S260 plus the 8 outside-loop commits: 132 starting fonts, the dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- **S260 (2026-08-26, Pass L — SEO & discoverability, 10th run, first since S242).** Surface: `21066b2..HEAD` = 122 commits / 22 files / +4,637 −442. **Byte check 14/14 byte-identical** (SEO-bearing tags + every ld+json), control 6/6 …[full text: IMPROVEMENT_ARCHIVE.md]

- **S259 (2026-08-26, Pass E — freshness & site health, 22nd run, first since S240).** Surface: `7441c63..HEAD` = 126 commits / 23 files / +4,839 −444. **15 dimensions, 15 CLEAN.** Registered dimensions D1–D12 all held (detail in the Done …[full text: IMPROVEMENT_ARCHIVE.md]

- **S258 (2026-08-26, Pass A - first A since S238, ~20 sessions).** Surface: the S239-S257 haul plus the three settings-blob tools the class had never been swept in. **Two pointer-named targets, both inverted.** *Arm 1 - …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **S257 Pass C (accessibility, `Hebrew_Font_Maker.html`)**: surface = the whole file at its current head, with every optional v5.32/v5.33 category panel force-enabled so the new tabs were actually in scope. Detection: (a) a static map of …[full text: IMPROVEMENT_ARCHIVE.md]

- `mobile-input-hints`: **swept 2026-08-26 (S256) - the Font Maker, its FIRST-EVER pass, plus the last shared control.** Surface: `Hebrew_Font_Maker.html` (13 fields hinted, per-field via the three-answer rule) and the four manual-backup …[full text: IMPROVEMENT_ARCHIVE.md]

- `mobile-input-hints`: **swept 2026-08-25 (S255) — the pattern's FIRST true suite-wide sweep, and the first under a CORRECTED detector.** Surface: all 14 root HTML pages, every `<input>`/`<textarea>`. **Detection method (use this one, not …[full text: IMPROVEMENT_ARCHIVE.md]

- **M/N (S246, 2026-08-23): the `row-siblings-with-mismatched-heights` detector corrected a SECOND time, and the chrome set re-censused under it.** S245 re-opened the class and prescribed "group by the parent row ELEMENT, never by a …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **N (S246, 2026-08-23): first-ever touch test of the two shared components that landed outside the loop.** `hebrew-keyboard` (carriers: resources, hebrew_dictionary, Hebrew_Font_Maker) and `test-phrases` (Hebrew_Font_Maker, resources) …[full text: IMPROVEMENT_ARCHIVE.md]

- **A (S238, 2026-08-20): diff signatures + 3 runtime arms over `3b572b5..HEAD` (60 commits, +2,975, 30 files — S227–S237 plus the outside-loop Starting-Fonts/FM v5.14–5.15 partner surface no A had seen). 16 classes CLEAN with receipts; …[full text: IMPROVEMENT_ARCHIVE.md]

- **A (S226, 2026-08-19): 28 diff signatures + 4 runtime detectors over `867b716..HEAD` (69 commits, +528 added lines, 15 files — the whole S215–S225 haul, which no A had ever seen), 2 HITS + 4 classes CLEAN with receipts + 3 candidate …[full text: IMPROVEMENT_ARCHIVE.md]

- **row-siblings-with-mismatched-heights**: registered + first swept 2026-08-19 (**S225 Pass M**). Surface: **10 pages current-state** (7 tools + index/resources/contact), EN light 1280 — a current-state sweep, not a delta, because the …[full text: IMPROVEMENT_ARCHIVE.md]

- **debounced-persistence-with-no-page-hide-flush**: registered + first swept 2026-08-16 (**S223 Pass B**). Surface: all 13 root pages, **current-state** rather than delta — the class had never been looked for, so a delta sweep would have …[full text: IMPROVEMENT_ARCHIVE.md]

- **async-store-backed-choice-clobbered-by-a-sync-fallback**: registered + first swept 2026-08-16 (**S222 Pass F**). Surface: the My Fonts picker of all **6** font-selector tools (`hebrew_blend_generator`, `flash_cards`, …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **localStorage-vs-AllTools**: swept 2026-08-16 (**S221 Pass I**) over the WHOLE suite rather than a commit delta, because the erase-side question had never been asked and a delta sweep would have inherited the same blind spot. Surface: …[full text: IMPROVEMENT_ARCHIVE.md]

- **A (S214, 2026-08-15): 31 signatures over `b0414e5..HEAD` (58 commits, +1,747 added lines, 13 files — the S204–S213 haul, the out-of-band panel-collapse landing and the new terms.html), 2 HITS + 9 classes clean + 1 exclusion proven.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **decorative-glyph-carrier-exposed-to-assistive-tech**: first sweep 2026-08-15 (S213). Surface: `trope_tutor.html`, all 4 `tropeGlyphSpan` call sites, grounded by reading each builder rather than by selector. Method that made it real: …[full text: IMPROVEMENT_ARCHIVE.md]

- **A (S203, 2026-08-13): 9 classes over `2771b39..HEAD` (56 commits, +441 — the S194–S202 fixes + the outside-loop v5.12 feature), 8 clean / 1 hit, hit fixed in-session (1410e7b).** Method: delta-diff signature greps over added lines …[full text: IMPROVEMENT_ARCHIVE.md]

- **error-status-clobbered-by-a-later-routine-write (NEW, S199):** FIRST sweep 2026-08-12 (S199 Pass B), narrow and receipted. Surface: the **3 tools that fetch a `data/` corpus at load** (torah_trainer, trope_tutor, hebrew_dictionary); …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block (NEW, S198):** FIRST sweep 2026-08-12 (S198), and deliberately a **narrow** one — the census covered the `.settings-backdrop`/`.settings-modal` drawer shape across its **3 carriers** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **content-dependent-tour-step-miscounts-the-tour:** FIRST sweep 2026-08-12 (S197 Pass I). Surface: all 7 tour-bearing tools, current-state (the class had never been looked for, so a delta sweep would have under-covered it). Method: drive …[full text: IMPROVEMENT_ARCHIVE.md]

- **wired-then-clobbered label (NEW, S192):** FIRST sweep 2026-08-11 (S192 Pass K). Surface: all 13 root HTML files, current-state detection (not delta-scoped — the class had never been looked for, so a delta sweep would have under-covered …[full text: IMPROVEMENT_ARCHIVE.md]

- **authored-but-unreferenced i18n key family:** **re-swept 2026-08-11 (S192 Pass K) with a NEW and far better method — 35 hits, 8 real, 2 fixed.** The static census this pattern was originally defined around has now failed **three times** …[full text: IMPROVEMENT_ARCHIVE.md]

- JSON-LD ↔ visible-content parity: **swept 2026-08-15 (S216 Pass L, 7th run) — 1 HIT** (torah_trainer's three closed enumerations vs its shipped Copy panel + printed sheets; fixed 6fdf370, twin completed be6afe3). Surface: all **36** …[full text: IMPROVEMENT_ARCHIVE.md]

- **theme-flipping-token-on-a-fixed-colour-plate (NEW, S191):** FIRST sweep 2026-08-10 (S191 Pass C). Surface: every text-bearing element of `torah_trainer.html` with the copy bar, bulk dock and settings drawer all open (all panels …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **two-state-ready-flag-for-a-three-state-load**: FIRST sweep 2026-08-08 (S189, carried by Pass F). Surface: the primary slow operation of all 7 tools, each stalled 2.6–3.0 s and separately answered with a 502, sampled mid-flight and …[full text: IMPROVEMENT_ARCHIVE.md]

- **invalid-SVG-geometry-from-an-unclamped-difference (NEW, S187):** swept 2026-08-08 over all 21 `<rect` emitters in `Hebrew_Font_Maker.html`, the file that had just absorbed ~1,083 lines of Draw-mode code. Method: an `innerHTML` setter …[full text: IMPROVEMENT_ARCHIVE.md]

- **RTL-inheritance-on-a-Latin-script-container:** re-swept 2026-08-29 (S290 iter 4) over `hebrew_dictionary.html`'s word-card chokepoints `.wc-transl`/`.wc-translit`, driven from the S237 Pass-M candidate. Method: render the Hebrew UI, …[full text: IMPROVEMENT_ARCHIVE.md]

- **silent-external-media-failure:** swept 2026-08-08 (S187) over `trope_tutor.html`'s `#tuAudio` clip engine — the carrier the S186 pointer named. **CLEAN, measured with a 502-fulfilled MP3** (not an abort, per S183): `MediaError.code 4`, …[full text: IMPROVEMENT_ARCHIVE.md]

- silent-external-media-failure: **registered + first swept 2026-08-02 (S183)**, `torah_trainer.html` only. Method: fulfil the media URL with an error response (NOT `route.abort()`, which leaves the element stalled and never fires `error`) …[full text: IMPROVEMENT_ARCHIVE.md]

- print-trailing-dead-space: **re-swept 2026-08-15 (S219) across ALL 12 root pages — the S182 coverage gap is closed.** Surface: every root page in its default print state, plus flash-cards' three explicit artifact modes. Method (broadened …[full text: IMPROVEMENT_ARCHIVE.md]

- lazily-loaded-dependency-renders-an-empty-shell: **registered + first swept 2026-08-02 (S182)**, `torah_trainer.html` only. Method: abort the module origin at the network layer (the loop's Playwright harness already aborts every external …[full text: IMPROVEMENT_ARCHIVE.md]

- print-media-leak / var-chain-overridden-by-a-literal: **2nd instance found + fixed 2026-08-02 (S182)** — `.tt-grid{align-items:start}`, correct on screen (the grid items are the 3 column wrappers) but wrong in print, where …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- print-media-leak / var-chain-overridden-by-a-literal: **registered + first swept 2026-08-02 (S181 Pass G)** over `torah_trainer.html`'s full stylesheet. 3 `@media (max-width:…)` blocks (600/900/**720**px); the 720px one was unqualified …[full text: IMPROVEMENT_ARCHIVE.md]

- **H teacher walkthrough (S180, 2026-08-02):** `torah_trainer.html`, its **2nd-ever H and the first since S77 — 103 sessions, the stalest-H tool by a wide margin** (flash_cards S120, generator S130, trope_tutor S140, dashboard S107, Font …[full text: IMPROVEMENT_ARCHIVE.md]

- **A recurring-pattern sweep + A2 (S179, 2026-08-01):** the ~17 ACTIVE classes over `30d653f..HEAD` (74 commits, +822 net / 1,755 added lines, 16 files) — the first sweep ever to cover the four out-of-band **Learning Path** features …[full text: IMPROVEMENT_ARCHIVE.md]

- console/error audit (Pass B): 2026-07-30 — **S172 — 15th run, first over S163–S171 + the out-of-band Learner Ladder / progress report / card sheet. FULLY CLEAN: 24 cells (12 pages × EN/HE), on load and after one real interaction per tool …[full text: IMPROVEMENT_ARCHIVE.md]

- first-load & empty-state (Pass I): 2026-07-29 — **S171 — 14th run, first over S162–S170 and the first ever over the out-of-band Learner Ladder + printable progress report.** S161's gates re-run and **24/24 cells clean** (12 pages × …[full text: IMPROVEMENT_ARCHIVE.md]

- performance (Pass D): 2026-07-29 — **S170 — flash_cards.html, 3rd dedicated D (S15→S75→S170) and the stalest D tool in loop history at 95 sessions; first D ever over the Learner Ladder, printable progress report and cut-out card sheet.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **S165 (2026-07-27): `pre-ready-i18n / never-re-rendered` hit a 3rd time, and the test harness itself was found unsound for failure paths.** Pass F swept failure behaviour across all seven tools: the dictionary's parse-time fetch threw a …[full text: IMPROVEMENT_ARCHIVE.md]

- **S164 (2026-07-27): the S157 `nameless-adjacent-text-labeled control` pattern was NOT clean — re-opened.** Pass E itself came back 6/6 with one licences finding, but chasing the S163 mark-editor candidate surfaced **20 nameless …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **S163 (2026-07-26): two NEW patterns registered and swept to zero.** (1) `placeholder-as-only-accessible-name` — the S161 P4 recorded 2 instances; the real class was **17 across 6 tools**, found by computing the ACCNAME precedence chain …[full text: IMPROVEMENT_ARCHIVE.md]

- modal-focus-trap: **first sweep 2026-07-26 (S161, Pass I)** — all **9** `aria-modal="true"` dialogs in the suite, each opened through its genuine opener and tab-cycled in both directions. **7 trapped, 2 not** (both …[full text: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **S158 (Pass A, 2026-07-25): 5 of 6 ACTIVE classes clean, 1 real hit (fixed)** over `0dc1e50..HEAD` (S148–S157, never A-swept). **Clean:** localStorage-vs-AllTools (0 new localStorage calls at all in the delta), …[full text: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **S136 (Pass A, 2026-07-22): CLEAN, 0 hits** across the 3 active consequence-critical classes over the delta `0ccaa7c..HEAD` (the surface changed since S126's A sweep, none of it A-swept since: design-call batch c1591a8 + S127/S129 …[full text: IMPROVEMENT_ARCHIVE.md]

- **S126 (Pass A, 2026-07-21): CLEAN, 0 hits** across the 3 active consequence-critical classes over `fd0fd11..HEAD` (S115 FM v5.5 export chain + S116–S125 loop changes + the substantial **outside-loop TTS drift**: Advanced TTS/Kokoro-ONNX …[full text: IMPROVEMENT_ARCHIVE.md]

- **S114 (Pass A, 2026-07-20): CLEAN, 0 hits** across the 3 active consequence-critical classes over `36161c0..fd0fd11` (S104–S113 loop changes + the substantial **outside-loop FM v5.2→v5.4 drift** — combined-form mark-grid tiles that …[full text: IMPROVEMENT_ARCHIVE.md]

- **S103 (Pass A, 2026-07-19): CLEAN, 0 hits** across the 3 active consequence-critical classes over the surface changed since S93's A sweep — the **outside-loop FM v5.0→v5.1** (precomposed שׁ/שׂ+ḥolam anchor/stacking, spacing-preview …[full text: IMPROVEMENT_ARCHIVE.md]

- **S93 (Pass A, 2026-07-17): CLEAN, 0 hits** across the 4 active classes over the surface changed since S83 — the outside-loop **dashboard movable-widget-panels feature** (639fcf8 + review-fixes 53e50fc), the S84–S92 loop changes, and the …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero: re-swept 2026-07-15 **S83** over the FM v4.18→v4.26 + S74–S82 surface — **CLEAN, 0 hits.** The new FM geometry/slider code guards a legal 0 correctly: vowel-pair `dx` read via `typeof(c.dx)==='number'` (preserves stored 0); …[full text: IMPROVEMENT_ARCHIVE.md]

- undo-wiring (Font Maker mutations that `markDirty()` without `udDo`/`udBurstBegin`): re-verified clean 2026-07-06 — all 12 `markDirty()` sites are undo-plumbing, burst-adjacent, or documented-exempt (custom-glyph CRUD, …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- slider-commit (Font Maker `oninput` sliders lacking `onchange="udBurstCommit()"`): re-verified clean 2026-07-06 — every project-data slider commits; the kern-value slider (staging draft) and opacity view-prefs are correctly outside the …[full text: IMPROVEMENT_ARCHIVE.md]

- workMode/step reachability (controls reachable in only one workMode while the workflow steers past it): swept 2026-07-06 — CLEAN. Letter Metrics now renders in Align, Trace, AND Nodes; the Trace tab (with the SVG-only …[full text: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- localStorage-vs-AllTools (keys written by a tool but missing from index.html gather/import/erase or the owning `.ivrit`): re-swept 2026-07-06 **S17** — all cross-machine data keys registered; `hebrewFontMaker_inputMode` (UI-flag class) …[full text: IMPROVEMENT_ARCHIVE.md]

- unescaped-input / unsafe-parse (innerHTML interpolation bypassing `esc()`; untrusted `JSON.parse` bypassing `ivritSafeParse`): re-swept 2026-07-07 **S22** over the hardening-pass + Word Lists additions — found + fixed a **P1** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- listener/interval accumulation (S10, new pattern): all `setInterval`s in the 6 tools are `clearInterval`-guarded or one-shot (dashboard's unassigned `checkSchedule` interval is inside one-shot DOMContentLoaded — fine, but it's the only …[full text: IMPROVEMENT_ARCHIVE.md]

- JSON-LD ↔ visible-content parity: swept in depth 2026-07-06 (all 11 files) — every FAQ Q&A visible on-page, HowTo steps match real UI (incl. flash_cards post-drawer-removal + post-tour), dictionary's "7-step walkthrough" claim matches …[full text: IMPROVEMENT_ARCHIVE.md]

- destructive-bulk (loops over all items/letters overwriting per-item customizations unconditionally): swept 2026-07-06 — `applyOutlineToAll` confirm-gated this session (94b1d14); `resetTropSideColumns`/`resetAllAnchors` confirm+undo, …[full text: IMPROVEMENT_ARCHIVE.md]

- SEO & discoverability audit (Pass L): re-run 2026-07-24 **S153** (2nd run) — **structurally clean** (canonicals, noindex exclusions, sitemap↔canonical 11/11, 32 JSON-LD blocks parse + **135 claims verified against visible content**, 1 …[full text: IMPROVEMENT_ARCHIVE.md]

- console/error audit (Pass B): re-run 2026-07-23 **S141** (12th run — 24 load runs [12 pages × light/dark] over local HTTP + a synthetic-reading interaction audit of the 4 new outside-loop Torah Trainer features [handout+שם ה׳ detect, …[full text: IMPROVEMENT_ARCHIVE.md]

- freshness/site-health (Pass E): re-run 2026-07-24 **S154** (14th run) — **7/7 CLEAN, 0 findings** (SW precache both directions, 372 internal refs, sitemap↔git 11/11, 13 loaded origins + 5 fonts documented, root files + manifest, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- cross-tool consistency (Pass F): re-run 2026-07-24 **S155** (13th) — **UX-affordance form**: transient user feedback across all 7 tools + chrome. Contract met everywhere (`role="status"` + reduced-motion). 1 divergence fixed (dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- performance (Pass D): 2026-07-20 — **S117 — classroom_dashboard.html, 3rd dedicated D (S13→S35→S117); thoroughly CLEAN, 1 per-second-churn fix (b5d4261).** Cold-load boot longtask **@1× max 195 ms (UNDER the 200 ms bar — clean at real …[full text: IMPROVEMENT_ARCHIVE.md]

- accessibility (Pass C): **S157 — hebrew_blend_generator.html, 2nd-ever dedicated C on the generator (first since S27, 2026-07-08 — the shallowest pass in the rotation's history). Structurally a11y-strong; ONE very large systemic naming …[full text: IMPROVEMENT_ARCHIVE.md]

- symbol-only accessible name (NEW, registered S167): swept 2026-07-29 **S167** over **all 12 root pages**, source scan + runtime ACCNAME scan cross-checked (neither alone was complete — see Pattern health). **50 hits, 6 tools, all fixed** …[full text: IMPROVEMENT_ARCHIVE.md]

- **A + A2 (S168, 2026-07-29):** swept the ~10 ACTIVE classes over the S158→S167 surface. **Constraint worth knowing: the working clone is shallow (55 commits, oldest = the S160 close-out)**, so a diff-based delta only reaches S161–S167; …[full text: IMPROVEMENT_ARCHIVE.md]

- **G print & export fidelity (S169, 2026-07-29):** `Hebrew_Font_Maker.html` printable templates. **Coverage tally recorded for future tool-picks:** torah 6 G runs, dictionary 6, flash_cards 5, generator 4, trope 3, font-maker 1, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **sub-floor touch target on a shared small-button class (NEW, S193):** FIRST sweep 2026-08-11 (S193 Pass A). Surface: every rendered `.btn-xs` on the 5 files that carry the class, both themes × 1280/800, all panels and drawers open. …[full text: IMPROVEMENT_ARCHIVE.md]

### Discovery-pass rotation (run one per session, stalest first)

- O deslop — AI-design-tell sweep (one surface): 2026-09-02 (**S311 — 3rd-ever O, `Hebrew_Font_Maker.html`'s HELP POPUP, scoped by explicit maintainer direction ("deslop the help popup in fontmaker") — the FM was also the target the S310 pointer named. Run on direction, not staleness; C was and remains the stalest pass by date (2026-08-30) — divergence declared for the third O in a row. Detector: …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-08-31 (**S303 — 11th-ever N, `hebrew_dictionary.html`, and the FIRST RE-AUDIT N has ever run: the dictionary's 2nd N (S239 → S303, 64 sessions). Target taken from the S290 row's own instruction — "only privacy/terms/404 remain never-audited, all static text — so a future N should re-audit a CHANGED surface instead" — then MEASURED rather than …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-08-31 (**S304 — 11th-ever M, `privacy.html` + `terms.html`, and with it M COVERAGE IS COMPLETE: all 7 tools plus all 6 chrome pages have now had a dedicated aesthetics audit.** M was the single stalest by BOTH date and session number and the S304 pointer named it; the S196 re-derivation AGREED and then SHARPENED the target — **privacy and terms …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-08-31 (**S302 — 20th run, its first since S289; K was the single stalest by BOTH date and session number and the S302 pointer named it. Delta `592234c..HEAD` = 59 commits / 23 files / +1,442 −125. ALL FOUR GATES CLEAN — the 13th consecutive clean-gates K, so the value was again entirely past them.** **Blind-spot probe: 0 real / 338 live added script lines, …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-02 (**S312 — `trope_tutor.html`, its 3rd dedicated C (S113 → S213 → S312, ~99 sessions) and the first C after three consecutive O sessions; C was the single stalest pass by date and the S312 pointer named it. Target = this row's own per-tool history (trope S213 stalest, generator S224 next); the S309/S310 backlog handed to C was folded in as two runtime arms. …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-08-31 (**S299 — A was the single stalest (2026-08-29/S286) and the S299 pointer handed it a ready-made target. FIVE patterns swept, 0 hits, every arm controlled.** Headline: **`invisible-rebuild-on-a-hot-render-path` swept on the four surfaces its own health line named as unswept** — the dashboard drawer, flash-cards setup, and the torah/trope drawers — by the …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-01 (**S306 — `index.html`'s AllTools `.ivrit` export + ALL SIX CHROME PAGES' printed output; the FIRST-EVER G ON A CHROME PAGE and the first-ever audit of the suite's master backup file.** G was the single stalest by BOTH date and session number and the S306 pointer named it. **Target re-derived against the ARCHIVE per S292 — and the re-derivation …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-01 (**S307 — `torah_trainer.html`, its first dedicated D since S184/S185 (2026-08-06, ~122 sessions). D was the single stalest pass by BOTH date and session number and the S307 pointer named it; the S196 re-derivation AGREED for the first time ever without tension — unprofiled surface since each tool's own last D is torah **+2,120 −309 / 82 commits** vs …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-01 (**S308 — 24th run, its first since S295 (~13 sessions); I was the single stalest pass by BOTH date and session number and the S308 pointer named it AND supplied both weighted arms. CLEAN IN EVERY ARM — and unlike a bare re-run it CLOSED the question the pointer set.** **Mechanical gates clean an ELEVENTH consecutive run:** 26 genuinely-virgin loads (13 …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-08-30 (**S297 — 24th run, its first since S284 (~13 sessions); B was the single stalest by BOTH date and session number and the S297 pointer named it AND supplied the weighting that made it worth running: "B's last four runs were all clean, so point it somewhere it can actually fire." CLEAN in all arms — but the NEW arm is the keeper.** **Arm 1, happy path:** 26 …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-08-31 (**S301 — 13th run, its first since S288 (~13 sessions); L was the single stalest by BOTH date and session number and the S301 pointer named it. Ran EXACTLY the S288-prescribed shape and it held a fifth time. **Byte check `be7bff9..HEAD` (59 commits / 22 files / +1,525 −153, 12 of the 14 root pages touched): 14/14 pages BYTE-IDENTICAL across the whole …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-01 (**S305 — `resources.html`, its FIRST-EVER dedicated H and the FIRST CHROME PAGE H HAS EVER WALKED.** H was the single stalest pass by BOTH date and session number (2026-08-30/S292) and the S305 pointer named the target; the re-derivation AGREED and the reason is structural, not a tie-break: **H had covered all seven tools and no chrome …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-08-31 (**S300 — 25th run, its first since S287 (~13 sessions); E was the single stalest by BOTH date and session number and the S300 pointer named it AND all three of its weighted arms. EIGHT arms; 2 findings, BOTH FIXED THIS SESSION; 6 clean.** Headline: **the ~380-file `pockettorah/timings/*.txt` corpus was the ONE `/data/` family fetched with no `?v=`** — …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-02 (**S313 — 25th run, its first since S296 (~17 sessions); F was the single stalest by BOTH date and session number and the S313 pointer named it AND the affordance: THE HOVER/PRESSED-STATE COLOUR LANGUAGE.** Method: every `:hover`/`:active` rule on all 13 pages tallied by the properties it sets, then EVERY visible control hovered with a real `page.mouse` and …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S314):** **BRANCH/PR: `claude/improve-loop-rzsgeu` LANDED ON `main` (S312 + S313, `facfbb6..1ef6f74` fast-forward on maintainer direction), so PR #218 is merged — cut a FRESH `claude/*` branch off latest `origin/main` and open a new draft PR at close-out.** VERIFY via the API first anyway. No `.github/workflows`, so 0 check runs is correct; deploy is verifiable only AFTER a merge. **⚑ clone still shallow** — `git fetch --unshallow` before `update-sitemap.mjs`. **Drift note: `sw.js` is now v632, `FONT_MAKER_VERSION` stays 5.37** — re-read both.

**⚑ THE STALEST PASS IS B (2026-08-30, S297), THEN A (S299), E (S300).** F ran this session. B's last five runs were clean on the happy path; point it at what changed since S297: the 8 pages the S312/S313 hover work touched plus the dashboard's first-run modal path (S313 found `.fr-modal.open` covering every control on a virgin load — B's basic-interaction arm should open the drawer THROUGH that modal, not around it). Reuse S297's failure-path arm (`serviceWorkers:'block'` + aborted `/data/`).

**⚑ THE STRONGEST UNTAKEN CANDIDATES ARE THE THREE `control-class-without-a-hover-state` LEFTOVERS** (flash `.pill`/`.count-btn` — 14 controls, P3; generator header trio, P3; dashboard `.btn-xs`, P4) — all one-rule fixes with `verifyHover.mjs` ready in the scratchpad recipe (real `page.mouse` hover, diff computed props, light + dark × 1280 + 800). The pattern cap allows 2 per session. Then the reduced rest-state gold candidate (FM `.hint-link` etc.; generator worksheet tokens need the print check first).

**/!\ THE S313 METHOD LESSONS.** (a) **A hover census is only as good as its overlay dismissal** — the dashboard's `.fr-backdrop.open`/`.fr-modal.open` first-run modal is NOT `.overlay.open`; 23 controls read as dead until `elementFromPoint` showed the backdrop on top. Any runtime probe must assert `elementFromPoint(centre) === el || el.contains(...)` before trusting a no-change. (b) **A diff-based hover probe counts an expected no-change as a failure** — read `FAILS` against the selected-state controls you deliberately included. (c) **Dark `--warm-gray` equals dark `--white` in the Font Maker** (#1e2535 both) — a light-mode bg hover on a `--white` control needs its own dark value. (d) A perl `s|...|` replacement that ends a CSS comment must carry the `*/` INSIDE the replacement — an unterminated comment silently ate the next rule until the count of `/*` vs `*/` was compared against HEAD.
