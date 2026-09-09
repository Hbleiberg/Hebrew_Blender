# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S360 Pass K — `browser-locale-date-in-a-localized-sentence`, 3rd carrier; class at cap in S360**) | Hebrew_Font_Maker.html | **`myFontsDate` (My Fonts created date) and `recentDate` (Load-menu recents) use `toLocaleDateString(undefined, …)`, so the Hebrew UI shows an English month beside Hebrew chrome.** Fix = `(window.I18n && I18n.lang) || undefined` (`f8b716b`). | found S360

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`, dead-by-decision rows; mechanical, the `fa4dce9` precedent**) | locales/ui-strings.csv | **`shared.footer.created_by` and `shared.footer.word_data` are translated and referenced nowhere: the 12 carriers pin those credits English on purpose (`eb4ce00`), so the rows are dead.** 2-row deletion + build-locales. | found S360

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`; wire or prune: maintainer's call**) | torah + trope (`ui-strings.csv`) | **5 credit rows (`torah.footer.sefaria_credit`/`cantillation_credit`, `torah.audio.speeds_credit`, `trope.footer.sefaria_credit`/`cantillation_credit`): translated, referenced nowhere; markup has anchors → `data-i18n-html` cells.** | found S360

- [ ] P4 (**NEW S359 — pattern `control-class-without-a-hover-state`, static census; hover UNVERIFIED — real mouse move first**) | hebrew_blend_generator.html + classroom_dashboard.html + Hebrew_Font_Maker.html | **The generator's `#headerLangEn`/`#headerLangHe` paint `background:var(--navy)` inline (an inline colour outranks any hover rule); its `#tourBtn`/`#darkToggle`/`#fsBtn` + bingo ±, the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S357 Pass A — pattern `sub-floor touch target`, M calls like the week-editor swatches**) | hebrew_blend_generator.html + Hebrew_Font_Maker.html | **The generator's `.toggle` switches are 40×22 (one 32×18) on every option row; the Font Maker's `#rulerCorner` zoom-reset is 22×22, sized by `--rl-w` (the ruler thickness).** A 24px switch/ruler is a visible size change; the mechanical …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S354 Pass C — the S309 O hand-off `skipped-heading`, now LOCATED: it is the tour card, on all 7 tools**) | the 7 tour carriers (`#tourCardTitle`) | **`<h4 id="tourCardTitle">` is the only h4 on pages whose outline is h1 → h2, so the tour dialog's title skips two levels; every page styles `.tour-card h4`.** Fix = an `h2` with a class (selectors re-pointed) on all 7 — and CLAUDE.md …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S355 — pattern `sub-floor touch target`, split from the S354 week-editor candidate**) | classroom_dashboard.html | **The week editor's colour swatches (`.swm-swatch` 18px, `.swm-swatch-input` 16px) sit under the 24px floor beside the now-25px chip arms.** A 24px swatch is a visible size change on every chip — a small M call, not a mechanical fix. | found S355

- [ ] P4 (**NEW S353 Pass I — a default-behaviour choice for the maintainer (gate 2-class); found on the `f2384a7` surface**) | resources.html | **The font-preview modal's render stack is `'<gallery font>', serif` with no `'IvritSuite Taamim'` fallback (`_fpFamily`), so a trop-less gallery font previews cantillation — typed from the keyboard's own Trop tab into the preview box — as boxes on stock …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S351 Pass G — GATE 2 copy, for L/the maintainer**) | trope_tutor.html (`locales/ui-strings.csv`, the FAQ JSON-LD) | **The FAQ answer `trope.footer.faq_a7` and its JSON-LD copy promise "prints all 26 marks as one reference sheet"; the chart is 8 sheets at Letter / 9 at A4 since `d9541e3` (S353; it was 13).** "as one reference chart" (the button's own wording) would be accurate; the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S337 Pass G — GATE 2: a default-behaviour choice, deferred unattended**) | Hebrew_Font_Maker.html | **The tool's two PDFs print on different paper: the Preview PDF specimen is hardcoded A4 (595×842 pt, `format:'a4'`) while the five template sheets are hardcoded Letter (612×792 pt, `format:'letter'`, and the generator's PDFs are Letter too).** A US teacher's specimen comes out …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S332 Pass L — GATE 2 / maintainer fact; deferred unattended**) | index.html | **The hub's Organization `sameAs` and the visible "Created by" link both point at `https://harrisonbleiberg.wpcomstaging.com/`, a WordPress.com staging address.** If a public author URL exists (or the site has moved), both should carry it; if the staging address IS the intended public home, waive this. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S327 Pass C — the one tile grid `41679da` could not lift; needs a layout decision**) | hebrew_blend_generator.html | **The real-words letter grid's names render at 7.2px** (`.rw-letter-tile .name` 0.45rem, six 46px columns, abbreviated "Tzadi sf" / "שין שמאלית"): at the 0.62rem step "שין שמאלית" needs 49.7px in a 40px content box, so any lift wraps HE. Options: five columns (7 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S333 Pass K — GATE 2: four Hebrew terms need authoring; deferred unattended. The S326 candidate's authored half shipped `ecd0720`**) | classroom_dashboard.html + flash_cards.html (`locales/ui-strings.csv`) | **The English-font pickers' Sans, Serif, Easy Reading and Kid-Friendly headers still render "גופני Sans", "גופני Serif", "גופני Easy Reading", "גופני Kid-Friendly" in the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S321 Pass N arm 5 — on-screen keyboard ergonomics; the copy half is GATE 2**) | classroom_dashboard.html | **`#timerCustomInput` is `inputmode="numeric"` with an `MM:SS` placeholder, and the iOS numeric pad has no colon.** `timerSetCustom` also accepts plain digits as whole minutes, so the field works for "5" but the placeholder promises a format the keyboard cannot type. Either …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S311 Pass O — filed out of O; S335 M re-measured both M halves**) | `Hebrew_Font_Maker.html`, the help popup | **The help tab strip is 14 chips over 3 rows, 96px, crossed before any content on every tab at every width (the modal is max 640px, so 800 = 1280)** — a restructure (grouped tabs or a select) is gate 3; screenshots `m335/1280-light-en-help.png`, `m335/800-light-en-help.png`. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S292 Pass H — the pass's headline finding; GATE 2 ASKED, maintainer chose "log it only, change nothing"**) | hebrew_dictionary.html | **"⭑ Save as Word List…" is discoverable only from a theme.** Word lists are the hub of the suite's whole cross-tool pipeline — `?wl=` feeds both the generator worksheet and the flash-cards drill — and there are three ways in, of which only two are …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S285 Pass C — a cross-tool DIVERGENCE, filed for F rather than as a defect**) | classroom_dashboard.html vs the other four tooltip carriers | **The dashboard binds its tooltip to the `.tip-icon`; the other four bind the `.tip-wrap`.** `wire()` sets `tabIndex`/`role`/`aria-expanded`/`aria-describedby` on the inner icon, while `bindTip` sets them on the wrapper. Both are …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S277 Pass M — a DISMISSAL with reasoning, the S276 email-period lesson's sibling**) | resources.html (+ any HE surface showing numeric ranges) | **HE grade ranges displaying '12–9' are Hebrew range typography, not scrambled data.** In an RTL paragraph a '9–12' range's digits stay LTR but the range reads right-to-left — Hebrew style legitimately writes ranges this way, and the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S260 Pass L; HALF-CLOSED S262** — one of the two shipped, one deliberately not) | flash_cards.html + hebrew_blend_generator.html | **~~(1) The dictionary is printable and never says so~~ — ✅ CLOSED S262, `ef8fc5a`, GATE-2 ASKED AND APPROVED ("dictionary printability only").** Shipped as the FAQ + `WebApplication.description` + visible `<details>` twin, all in one commit; copy …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S258** - re-logged from the S257 candidate with the reason it was not taken; a geometry change, so **gate 3** if ever pursued) | Hebrew_Font_Maker.html | **`#rulerCorner.rl-corner` is 22x22, under the 24px touch floor, and cannot be fixed with a `min-height`.** Its `width`/`height` are both `var(--rl-w)` - the ruler thickness declared on `.rl-layer` (22px) - so the corner is the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S248 Pass M** — the SIXTH carrier of the standing suite-wide shape; no longer a per-page note) | classroom_dashboard.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245, index S246, hebrew_blend_generator S247) | **Type-scale and radius micro-fragmentation on the projected board: 13 distinct font sizes over 47 text-bearing nodes, and 5 distinct radii …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S247 Pass M** — the FIFTH page with this exact shape; a suite-wide convergence question, unchanged in kind since FM S225) | hebrew_blend_generator.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245, index S246) | **Type-scale micro-fragmentation and radius fragmentation, at the largest scale yet measured.** The generator renders text at **23 distinct sizes**, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S246 Pass M** — the FOURTH page with this exact shape, so it is now a suite-wide convergence question rather than a per-page note) | index.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245) | **Four text sizes inside a 2.08px band: 12 / 12.8 / 13.12 / 14.08px.** `button.ie-btn`+`footer` at 12, `#darkBtn`+`.card-attr` at 12.8, `p`+`.bookmark-btn` at 13.12, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S242 Pass L** — the deliberately-unshipped half of the gate-2 answer; ask again when the maintainer next wants SEO reach) | Hebrew_Font_Maker.html + index.html | **Three of the five crawler-facing FM surfaces still frame the tool as handwriting-only.** S242 fixed the WebApplication summary + added an import FAQ, because gate 2 was answered "minimal — structured data only". Still …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S230 Pass K**, arm 1 — the corpus's one genuine placeholder gap, recorded rather than fixed because the reason it exists is linguistic, not an oversight) | `locales/ui-strings.csv` | **`shared.folders.empty_list` is the only row in 4,375 that drops a placeholder for a real reason.** EN `“No saved {noun}s yet.”` → HE `“אין עדיין פריטים שמורים.”` (“no saved items yet”), losing which …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S218 Pass K** — needs 4 newly authored Hebrew terms, so it is gate-2 work, not wiring) | hebrew_dictionary.html (`locales/ui-strings.csv`) | **Four part-of-speech values have no filter row and so still print English in the Hebrew UI.** `ce75604` wired 19 of the corpus's 23 values by reusing the filter panel's existing keys; the remaining four — **proverb (19 entries), definite …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — it is a mapping decision, not wiring) | hebrew_dictionary.html | **The part-of-speech badge prints raw corpus vocabulary** (`noun`, `verb`, `adjective`, … from `w.pos`, ~L2768) and stays English in the Hebrew UI. Unlike the rest of the S192 haul this is **not** authored-but-unreferenced: the string match to `dictionary.shoresh.pattern_noun` is coincidental (that key …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — same mapping-decision class as the pos badge above) | flash_cards.html | **The Colors-mode selection tiles label their swatches in raw English** (`.color-tile-label` renders `c.name` — Red/Blue/… — straight from the COLOR_ITEMS table; proved at the reveal in HE, S207). No `flashcards.colors.*` key family exists — the `vowelgroup.color_*` reverse-lookup matches are …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**GATE 2 — panel copy/IA wording**; split from the S180 set S209) | torah_trainer.html | **The "Hebrew font" panel holds 17 typefaces and no size control, while the size sliders live ~330px away under "Display → Font sizes"** — neither panel references the other. Any fix is wording/IA (a cross-reference hint line, or moving a slider), so the wording is the maintainer's. | found: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283** — Culmus follow-ons from the meteg build; each names its source in Iorsh's fontforge-scripts) | Hebrew_Font_Maker.html | **Narrow-vowel variants under narrow letters** (vav/yod/nun/gimel/zayin/quf) when a meteg is present — `NarrowVowels.fea` + `CreatePrecomposedGlyphs.py`. Needs synthesized `.narrow` vowel glyphs + a ccmp chain keyed on the base letter. The natural next …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **Holam+rafe and shin-dot+rafe collision anchors** — `AddHebrewContextualGPOS.py`'s collision-avoidance anchors for above-mark pairs; today both attach at the shared above anchor and can overlap. Same contextual single-pos device the meteg pair uses, above class. | found: 2026-08-29, S283

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **The Yerushalam lamed-patah-hiriq rule and `jalt` wide-letter justification alternates** — `AddHebrewContextualGPOS.py` / `WideLetters.fea`. The jalt half overlaps the shipped ss02 wide forms (v5.33): the glyphs exist, only the `jalt` feature registration is missing. | found: 2026-08-29, S283

- [ ] P4 (**NEW S314 Pass O — bucket 4, to loop-findings once confirmed**) | Hebrew_Font_Maker.html | **`tight-leading` reports "1.30x (need >=1.3)" — a rounding false positive in the detector, not a leading defect.** | found S314

## Feature seeds (micro-features only; see the Micro-feature track in the session prompt)

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md] …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | classroom_dashboard.html | **A/B or rotating week cycles.** Needs a cycle dimension on `scheduleWeek` (cells per cycle-week), a "which week is it" anchor date, and cycle awareness in `computeWeekState`'s next-school-day scan — a real model change, not a sidecar. | found: 2026-08-06, weekly-grid build

## In progress

_(none)_

## Done

- [x] 2026-09-09 | (S360 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `52d4621` at start) → S360 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges + confirms the Pages run. Drift: none (`f2384a7`, sw v684, FM 5.39). sw v684→v685 (7 pages); FM not bumped. Scripts: full definition of done + compact/check-ledger. Deferred: micro-feature; O; credit rows.**

- [x] 2026-09-09 | `8094579` | flash_cards.html | **the Results History rows, the printed report and the certificate date via `I18n.lang`, not the browser locale (S360, P4, `browser-locale-date-in-a-localized-sentence`)** | `k360/fcdates.mjs`, seeded profile, 8 cells: Hebrew months in every HE cell (before: English), EN unchanged, 0 pageerrors

- [x] 2026-09-09 | `f8b716b` | index.html | **`_ivFmt` (last-backup line + My Fonts created date) formats in `I18n.lang` (S360, P4, `browser-locale-date-in-a-localized-sentence` — NEW pattern, hub = 1st carrier)** | `k360/lastbackup.mjs` 16 cells + `myfonts.mjs`: Hebrew dates in HE (before: English), live setLang re-formats both ways, 0 pageerrors

- [x] 2026-09-09 | `ddb0072` | index + contact + privacy + terms + 404 | **the footer's license sentence gets `data-i18n="shared.footer.license_note"` on all 5 landing pages (S360, P3, `authored-but-unreferenced i18n key`)** | `k360/footer.mjs`: the CSV's Hebrew sentence on 5/5 in HE (before: English), EN + links unchanged, 0 pageerrors; check-i18n clean

- [x] 2026-09-09 | `853d1d9` | hebrew_blend_generator.html + ui-strings.csv | **the "Count וֹ/וּ as a letter" label gets `data-i18n-html="worksheet.vowels.count_vav"`; the cells take the flash-card twin's heb-font span (S360, P3, `authored-but-unreferenced i18n key`)** | `k360/countvav.mjs` 8 cells: Hebrew label in HE (before: English), span font + `lang=he` kept, real-click toggle ok

- [x] 2026-09-09 | (S359 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `55f694d` at start) → S359 CONTINUED `claude/inspiring-meitner-rhqskk`, 3 commits; a human merges and confirms the Pages run. Drift: none (`origin/main` `f2384a7`, sw v683, FM 5.39). `sw.js` v683→v684 (1 precached page: flash_cards); FM not bumped (no FM change). Scripts: check-i18n, check-inline-js, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `7e8cb37` | flash_cards.html | **the weaknesses viewer's four `.weak-tab`s get stylesheet rules (`paintTabs()` keeps only the `aria-pressed` sync) and its × and the Learner Ladder's × take `.fc-dlg-x` (S359, P4, `control-class-without-a-hover-state`)** | `l359/weakdlg.mjs` 4 cells (light/dark × 1280/800): hover feedback on tabs + both ×, 5.97–18.06:1, the tab moves by a real …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `bcae3ec` | flash_cards.html | **the profile-picker (`chooseProfileModal`) and card-count (`askCardCount`) dialogs move from inline-styled class-less buttons to `.fc-dlg-btn[data-act]` / `.fc-dlg-pick` (+ `is-active`/`is-on`) / `.fc-dlg-x` per-page CSS with hover plates; `paint()` toggles a class; the × reaches 24px (S359, P4, `control-class-without-a-hover-state` + `sub-floor …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | (S358 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `b418cf9` at start) → S358 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges and confirms the Pages run. Drift: none (`origin/main` `f2384a7`, sw v682, FM 5.39). `sw.js` v682→v683 (5 precached pages: hebrew_dictionary, flash_cards, classroom_dashboard, hebrew_blend_generator, index); …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `dd2bac2` | flash_cards + classroom_dashboard + hebrew_blend_generator + index (the `.ivrit` engine block + the hub superset) | **the Merge / Replace / Cancel dialog buttons move from inline styles to `.ivrit-ask-btn[data-act]` per-page CSS with hover plates (gold/navy, #8a2828, the drag-plate tint) (S358, P4, `control-class-without-a-hover-state`)** | `e358/askmode.mjs` 16 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `a2eddd9` | hebrew_dictionary.html | **`applyDictState` applies `copyMode` only when its radio group offers it and keeps `shoreshRoot` only as a string (S358, P3, `apply-settings-trusts-collection-members` — the enum shape's last open sites)** | `arm4.mjs hebrew_dictionary shoreshRoot,copyMode`: 16 loads, 0 leaks (before 14; the one PERSISTED row is a legit string root), …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `c32ef93` | docs/reference/storage-and-backup.md + generator.md | **the value-level restore guards recorded (`applySelectValue`, `applyNumberValue`, `isOffered`, `_clampEnum`/`_clampChoice`, the dictionary's radio match) (S358 Pass E, doc drift 2)** | every name grepped against the S356–S358 code

- [x] 2026-09-09 | `a0e51f1` | docs/reference/shared-components.md | **§5 re-trued: contact's kept-renderer note shape (`showStatus(render)`/`_statusRender`) and the hub's erase dialog (`ivritAskErase`; the final `confirm()` stays) (S358 Pass E, doc drift 1)** | grep of the S350/S357 code paths

- [x] 2026-09-09 | (S357 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `9263d9a` at start) → S357 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges and confirms the Pages run. Drift: none (`origin/main` `f2384a7`, sw v681, FM 5.39). `sw.js` v681→v682 (4 precached pages: flash_cards, hebrew_blend_generator, index, contact); FM not bumped (no FM change). …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `8a18689` | flash_cards.html | **19 enum-string settings restore only a value the UI offers via `_clampEnum` (S357, P3, `apply-settings-trusts-collection-members`): an array/number/misspelt mode used to be assigned raw, render nothing, and be saved back; `sheetDuplex`/`sheetPracticed` take only a boolean, font ids only a string.** | Verified: `?s=` 56 keys × 8 wrong types (448 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `46b82b0` | hebrew_blend_generator.html | **15 enum-string settings + 2 booleans apply only a value the UI offers via `isOffered(v, list | rowSelector, key)` (S357, P3, `apply-settings-trusts-collection-members`); an unoffered value leaves the current pick instead of being assigned raw and saved.** | Verified: `?s=` 17 keys × 8 wrong types (136 loads) → 0 leaks, control fired; …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `86d4307` | contact.html | **The form's status notes follow a live language switch (S357, P4, `validation-note-stores-rendered-text`): the renderer is kept and re-run from `applyI18n`.** | Verified: submit with the captcha widget absent → note + mailto link; `I18n.setLang('he')` → Hebrew note, link kept (before: heading Hebrew, note English); back to EN; 4 cells, check-i18n + …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | (S356 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `70bebe1` at start) → S356 CONTINUED `claude/inspiring-meitner-rhqskk`, 6 commits; a human merges and confirms the Pages run. Drift: none (`origin/main` `f2384a7`, sw v680, FM 5.39). `sw.js` v680→v681 (6 precached pages); FM not bumped. Scripts: check-i18n, check-inline-js, update-sitemap, compact-ledger …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `8f4def9` | hebrew_blend_generator.html | **11 number/range inputs restore only a finite number via `applyNumberValue` (S356, P3, `apply-settings-trusts-collection-members`): a non-number made "" (0 bingo cards), "NaN×", `--trace-gap: NaNrem`, then saved.** | Verified: 11 × 7 garbage shapes kept, good numbers applied, 4 cells; `?s=` bingoCards "str" → 800 cells, saved "30"; 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `914a959` | hebrew_blend_generator.html | **16 selects restore only an offered value via `applySelectValue` (the blendCount rule, converged) (S356, P3, same pattern): an unoffered value made .value "" — 0 bingo cells — and saved it.** | Verified: 16 × 7 shapes kept, offered applied, 4 cells; `?s=` bingoGrid 9 → 800 cells, saved "5"; .ivrit preset round-trip; 0 pageerr

- [x] 2026-09-09 | `ffb14bf` | hebrew-keyboard CSS block (FM, dashboard, dictionary, resources) | **`.hk-layout` 20→24px via `min-block-size:24px` (S356, P4, `sub-floor touch target`); block byte-identical, sha `f93a6b1f9ff8`→`6fd62ebd25ea` ×4.** | Verified: real click on each keyboard toggle, 16 cells 24px, the button still flips the layout

- [x] 2026-09-09 | `f08842e` | classroom_dashboard.html | **`.fr-starter` dark hover twin `#24345c` — the 8th and last `dark-override-outranks-hover` carrier (S356, P4).** | Verified: real mouse move + 450 ms, dark bg+border feedback, 9.55:1; light unchanged; 1280 + 800

## Metrics

### Per-session log (one line per session)

- 2026-09-09 | **S360** | iters: 1 pass (**K**) + 4 fixes = **5** | tools: generator (`853d1d9`), index + 4 chrome (`ddb0072`), index (`f8b716b`), flash (`8094579`) | patterns fixed: `authored-but-unreferenced i18n key` ×2, `browser-locale-date…` ×2 (NEW) | pass run: K (2 hits) | SW: v685

- 2026-09-09 | **S359** | iters: 1 pass (**L**) + 2 fixes = **3** (4th/5th unspent — flash_cards AND the hover class at cap; every other open candidate is gated, an M call or the 7-page tour extraction) | tools touched: flash_cards ×2 (`bcae3ec`, `7e8cb37` — AT CAP) | patterns fixed: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S358** | iters: 1 pass (**E**) + 4 fixes = **5** (full budget) | tools touched: hebrew_dictionary ×1 (`a2eddd9`), flash_cards + classroom_dashboard + hebrew_blend_generator + index ×1 (`dd2bac2`), docs ×2 (`a0e51f1`, `c32ef93`) | patterns fixed: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S357** | iters: 1 pass (**A**) + 4 fixes = **5** (full budget; the `apply-settings` class at cap) | tools touched: flash_cards ×1 (`8a18689`), hebrew_blend_generator ×1 (`46b82b0`), index ×1 (`6a0809c`), contact ×1 (`86d4307`) | patterns fixed: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S356** | iters: 1 pass (**B**) + 4 fixes = **5** (full budget; generator + the `apply-settings` class at cap) | tools touched: classroom_dashboard ×2 (`f08842e`, `ffb14bf`), Hebrew_Font_Maker + hebrew_dictionary + resources ×1 (`ffb14bf`), hebrew_blend_generator ×2 (`914a959`, …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S355** | iters: 1 pass (**F**) + 4 fixes = **5** (full budget; hover class + dashboard at cap) | tools touched: hebrew_dictionary ×1 (`d0c84cf`), hebrew_blend_generator + resources + torah_trainer ×1 each (`82417f8`), classroom_dashboard ×2 (`51b7028`, `2fdc30e`) | patterns fixed: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S354** | iters: 1 pass (**C**) + 2 fixes = **3** (4th/5th unspent — dashboard at cap, hover-contrast pattern at cap, every other candidate gated) | tools touched: classroom_dashboard ×2 (`d7264e0` shared block, `1f27219`), Hebrew_Font_Maker ×1 + hebrew_dictionary ×1 + resources ×1 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S353** | iters: 1 pass (**I**) + 2 fixes = **3** (4th/5th unspent — no other ungated candidate open) | tools touched: trope_tutor ×1 (`d9541e3`), index ×1 (`0d28564`), docs ×1 (loop-findings) | patterns fixed: — | micro-feature: none (unattended → skipped, logged) | pass run: I …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-09 | **S352** | iters: 1 pass (**D**) + 4 fixes = **5** (full budget) | tools touched: index ×1 (`f7c9a88`), torah_trainer ×2 (`97b68b4`, `4b9273f`), trope_tutor ×1 (`43ae79e`), docs ×1 (loop-findings) | patterns fixed: — | micro-feature: none (unattended → skipped, logged) | pass run: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S351** | iters: 1 pass (**G**) + 2 fixes + 1 micro-feature (2) = **5** | tools touched: trope_tutor ×2 (`bdfd57c`, `d9176bc`), torah_trainer ×1 (`dca9609`, micro-feature), docs ×1 (loop-findings) | patterns fixed: — | micro-feature: **SHIPPED** scroll-style handout (`dca9609`) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S350** | iters: 1 pass (**H**) + 1 micro-feature (2) + 1 fix = **4** (5th unspent — no ungated candidate open) | tools touched: index ×1 (`aab1392`, micro-feature), contact ×1 (`ac5f930`), docs ×1 (loop-findings) | patterns fixed: — | micro-feature: **SHIPPED** erase-offers-backup …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S349** | iters: 1 pass (**M**) + 1 fix + 1 micro-feature (2) = **4** (5th unspent — no ungated candidate open) | tools touched: 404 ×1 (`5e64c95`), torah_trainer ×1 (`c3d2e11`, micro-feature), docs ×1 (loop-findings) | patterns fixed: — | micro-feature: **SHIPPED** the handout …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S348** | iters: 1 pass (**N**) + 1 micro-feature (2) = **3** (4th/5th unspent — N clean, no ungated candidate open) | tools touched: torah_trainer ×1 (`4329006`, micro-feature), docs ×1 (shared-components.md, loop-findings) | patterns fixed: — | micro-feature: **SHIPPED** the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S347** | iters: 1 pass (**K**) + 1 micro-feature (2) + 1 fix = **4** (5th unspent — every remaining open candidate is a gate or a decision) | tools touched: index ×1 (`72104a2`, micro-feature), flash_cards ×1 (`7c6337a`), docs ×1 (storage-and-backup.md, loop-findings) | patterns …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S346** | iters: 1 pass (**O**, attended) + 1 fix = **2** (3rd–5th unspent — O clean of unratified tells; the one new candidate is M's, every other open candidate gated or a decision) | tools touched: flash_cards ×1 (`66386bb`), docs ×1 (loop-findings + deslop-detector) | patterns …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S345** | iters: 1 pass (**L**) + 2 fixes = **3** (4th/5th unspent — L clean, the one ungated candidate taken, every other open candidate gated or a decision) | tools touched: classroom_dashboard ×1 (`4e25247`), docs ×1 (`101cf5b` loop-findings) | patterns fixed: …[full text: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S344** | iters: 1 pass (**E**) + 4 fixes = **5 (FULL BUDGET)** | tools touched: flash_cards ×1 (`c7e990e`), hebrew_blend_generator ×1 (`608aa28`), docs ×2 (`3e3836b` storage-and-backup, `74ec03d` shared-components §5) | patterns fixed: `validation-note-stores-rendered-text` ×2 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-08 | **S343** | iters: 1 pass (**A**) + 3 fixes = **4** (5th unspent — dashboard AT CAP, the fixed pattern class at cap, every other open candidate gated or a decision) | tools touched: flash_cards ×1 (`3866c82`), classroom_dashboard ×2 (`df367c9` week-save note + `6fce9be` class-limit …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-04 | **S342** | iters: 1 pass (**B**) + 2 fixes = **3** (4th/5th unspent — both pass findings taken; every other open candidate is gated or a decision) | tools touched: flash_cards ×1 + hebrew_blend_generator ×1 (`114cae6`), classroom_dashboard ×1 (`655f4d7`) | patterns fixed: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-04 | **S341** | iters: 1 pass (**F**) + 4 fixes = **5 (FULL BUDGET)** | tools touched: resources ×1 (`39cf34a` both modals), index ×2 (`ccd4898` block carrier + `9068087` chip — AT CAP), classroom_dashboard ×2 (`ccd4898` block + `2d985c1` day menu — AT CAP), flash_cards ×1 + …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

### Tool coverage (last-touched date per tool)

- **S360 (2026-09-09):** hebrew_blend_generator **2026-09-09 (`853d1d9`)**; index **2026-09-09 (×2, `ddb0072`, `f8b716b`)**; contact / privacy / terms / 404 **2026-09-09 (`ddb0072`)**; flash_cards **2026-09-09 (`8094579`)**; hebrew_dictionary 2026-09-09 (S358); classroom_dashboard 2026-09-09 (S358); Hebrew_Font_Maker 2026-09-09 (S356); resources 2026-09-09 (S356); torah_trainer 2026-09-09 (S355); trope_tutor 2026-09-09 (S353).

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`validation-note-stores-rendered-text`**: ACTIVE. **S357 Pass A: HIT — contact's `#formStatus` notes (captcha-required, sending, sent, failed) were written as rendered text with no `applyI18n` re-render; driven: after `I18n.setLang('he')` the heading flipped, the note stayed …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new opener, the hub's first-erase gate `ivritAskErase` (S350) — driven by real keys: role=dialog + labelledby, focus enters, Tab ×3 wraps, Escape closes and returns …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new note helpers or `aria-disabled` writers; the torah handout's new selected-verses row hides itself when the selection empties — hits 0, clean streak 1.** S343 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`uncompressed-jspdf-raster`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): 0 new `addImage(` sites; 3/3 carry `'FAST'` — hits 0, clean streak 2.** Registered S337 Pass G; S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Definition: a jsPDF `addImage(...)` with no …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED — never retires). **S358: the ENUM-STRING shape CLOSED on its last sites — the dictionary's `copyMode` (radio match) + `shoreshRoot` (string only), `a2eddd9`; S356–S357 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S359: flash cards' 3 dialogs FIXED — `bcae3ec` (profile picker + card count → `.fc-dlg-btn[data-act]`/`.fc-dlg-pick`/`.fc-dlg-x`), `7e8cb37` (weaknesses tabs + 2 ×); S358 the `.ivrit` engine row, S357 the hub's erase gate. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **ONE MORE ARTIFACT at 2026-09-08 (S343 Pass A), caught before a verdict: the first dashboard alert census reported `clicked=1` of 254 — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S359: flash cards' card-count × 21→24px inside `bcae3ec`. S357 Pass A runtime census (11 delta pages): 2 open carriers — the generator's `.toggle` switches (40×22, one 32×18) and the Font Maker's `#rulerCorner` (22×22, `--rl-w`), both …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**NEW, registered AND CLOSED 2026-08-29 (S291 iters 2+4) — 2 carriers found, both fixed, suite census clean**): a rule paints text with a token whose value is tuned for the OTHER theme's ground, so it is correct in one mode and …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical: saved work). **Re-swept 2026-09-09 (S357 Pass A, delta-only): the delta's numeric paths are the S356 `applyNumberValue` (`Number.isFinite` gate) and the torah `?holiday=` key lookup (a string) — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab** (**NEW, registered 2026-08-28 (S279 Pass G) from the S252 dictionary `#appToast` + this session's flash_cards `.panel` — two carriers of one shape, 27 sessions apart**): a box-shadow is a DRAWING, so `printBackground:false` / the print dialog's …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (**NEW, registered 2026-08-28 (S277 Pass M) from S276's `15684a6` + S277's `eb4ce00`/`f70d500` — three carriers of one shape inside two sessions**): deliberately-untranslated English PROSE (attribution credits, directory data, @handles …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value**: **RE-SWEPT 2026-09-03 (S320 Pass K, 4th sweep, suite-wide): census 1,789 leaf sites (this reader skips nested block markup; S302's 2,310 counted it), raw 3 → hits: 0** (one `&ldquo;`/`&rdquo;` entity the reader did not decode, two …[full text: IMPROVEMENT_ARCHIVE.md]

- **undocumented-global-keyboard-shortcut**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `document`-level `keydown` handlers (the erase gate's is scoped to its overlay: Escape + Tab trap, exempt shapes) — hits 0, clean streak 2.** S264 1 hit fixed (`f65ce58`); …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-size-control-holding-translatable-text**: **re-swept 2026-08-27 (S264 iter 3), WIDENED PAST ITS REGISTERED BLIND SPOT for the first time -- hits: 0 real. Clean streak: 1 -- ACTIVE.** Sweep 2 measured the shape sweep 1 could not see: leaf elements carrying NO …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **legibility-destroyed-by-a-second-dimming-layer**: **re-swept 2026-08-27 (S263, all 3 `#fsExitBtn` carriers) -- hits: 1 (`hebrew_blend_generator.html`, the LAST unfixed carrier), fixed in-pass (`eb0eab3`); clean streak: 0 -- ACTIVE, consequence-critical (legibility), never …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-control-positioned-outside-the-viewport**: **REGISTERED + first swept suite-wide 2026-08-26 (S262 Pass N) -- hits: 1 carrier (`hebrew_blend_generator.html` `#sidebarToggleBtn`), fixed in-pass (`5f6a0a0`); census 78 cells (13 pages x 3 phone descriptors x EN/HE) …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **executable-javascript-in-a-localization-cell**: ACTIVE (consequence-critical: security-shaped, never retires). **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows carry no handler or URL; Check C1 clean over 5140 keys × 2 columns — hits 0, clean streak 1.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n-html-markup-only-in-fallback**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows and their sites carry no markup (plain `data-i18n` / `I18n.t()`) — hits 0, clean streak 1.** Registered S260 (21 fixed), S261 re-swept (2 fixed `ae95aba`). …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **global-keydown-preventDefault-without-target-guard** (**NEW, registered 2026-08-28 (S272 Pass A) from S271’s `38ab28f`**): a document/window-level `keydown` handler that calls `preventDefault()` on Enter/Space (or another activation/printable key) with no interactive-target …[full text: IMPROVEMENT_ARCHIVE.md]

- **row-siblings-with-mismatched-heights**: **re-swept 2026-08-26 (S259, `hebrew_dictionary.html` header, EN/HE × 8 widths) — hits: 1, fixed in-pass (`3b895d7`); clean streak: 0 — ACTIVE.** Heights 24/37/39 → 24/24/25. **The detector's registered weakness showed again and the …[full text: IMPROVEMENT_ARCHIVE.md]

- **debounced-persistence-with-no-page-hide-flush**: **re-swept 2026-08-26 (S258 Pass A) - hits: 1 NEW carrier (`classroom_dashboard.html`), fixed in-pass (`cf244df`); clean streak: 0 - ACTIVE, consequence-critical (data loss), never retires on streak.** **The hit widens the …[full text: IMPROVEMENT_ARCHIVE.md]

- **state-mutation-that-never-arms-its-persistence**: **re-swept 2026-08-26 (S257) - hits: 1, the knowingly-deferred `setInputMode`, now fixed (`57abf9c`); clean streak: 0 - ACTIVE (consequence-critical: data loss, so it never retires on streak).** **The fix shape is the finding …[full text: IMPROVEMENT_ARCHIVE.md]

- **flex-column-crushing-its-own-rows** (**NEW, registered 2026-08-23 (S249 Pass N arm 4)**): a `display:flex; flex-direction:column` container that is ALSO height-constrained and scrollable (`max-height`/`flex:1` + `overflow-y:auto`) silently **compresses its children instead …[full text: IMPROVEMENT_ARCHIVE.md]

- **translated-sibling stray** **S336: +1 carrier FIXED `c1e4427` — the Font Maker's nine raw `.name` display sites (header, drop zone, mark-editor modal, 4 toasts) now go through `gName()`, the sibling the tiles already used.**  (a display site rendering a raw English …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- `mobile-input-hints` (a text input that takes a code, a URL, or non-English text but carries no typing hints): **re-swept 2026-08-28 (S267 iter 3, `flash_cards.html` `#presetName` — the twin-reconciliation the S266 feature build logged) — hits: 1, fixed (`05fdcab`); clean …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n cross-column parity (placeholders, plurals, inline markup)**: **re-swept 2026-09-03 (S320 Pass K, detector 1 only): `{placeholder}` sets en vs he over 5,128 keys, raw 30 → hits: 0 — all thirty are the S261-refuted `.one` plural shape (Hebrew spells the singular number; …[full text: IMPROVEMENT_ARCHIVE.md]

- **horizontal-overflow-at-narrow-widths**: **re-swept 2026-09-03 (S334 Pass N, `torah_trainer.html`, 12 real-descriptor loads × 10 views incl. the S324 presentation toolbar) — hits: 1, the clipped-not-scrolled variant (`.tt-fs-plate` 340px in a 320px viewport, −10..330, A− and …[full text: IMPROVEMENT_ARCHIVE.md]

- **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-inverted-by-a-hover-or-active-state**: **re-swept 2026-09-09 (S354 Pass C — the dashboard at RUNTIME, 73 targets × 2 themes, real mouse + 400 ms settle, drawer open and every panel expanded) — hits: 2, BOTH FIXED (`d7264e0` the shared keyboard block's …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-below-AA-on-a-tinted-or-coloured-plate**: **re-swept 2026-08-23 (S249 Pass M, `flash_cards.html` — card front AND back, results screen, and setup screen with every `.panel`/`<details>` force-expanded) — hits: 0 across 20 cells; clean streak: 1 — ACTIVE …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire …[full text: IMPROVEMENT_ARCHIVE.md]

- **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the …[full text: IMPROVEMENT_ARCHIVE.md]

_(**S214 Pass A swept the delta `b0414e5..HEAD`** — 58 commits, 1,747 added lines, 13 files. **2 classes HIT and reset to streak 0** (`animation-outside-its-reduced-motion-block`, `decorative-glyph-carrier-exposed-to-assistive-tech`); the consequence-critical trio …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **decorative-glyph-carrier-exposed-to-assistive-tech** (**2nd instance fixed 2026-08-15, S219, c2399f1 — Font Maker QA column heads**. That instance sharpened the pattern in a way every future sweep needs: **`aria-label` on the element is NOT a fix for this class.** The FM …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **blocking-alert-for-a-routine-path**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `alert(` sites (the hub's erase gate is a dialog; its final `confirm()` is a destructive guard) — hits 0, clean streak 2.** S343: dashboard 77-control click census, 0 alerts. …[full text: IMPROVEMENT_ARCHIVE.md]

- **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a …[full text: IMPROVEMENT_ARCHIVE.md]

- **parse-per-call on a growing store** (a `read<Store>()` helper that re-parses its whole localStorage blob on every call, called O(n) times per render, over a store that grows without bound as the teacher uses the tool — so the tool punishes use, and the cost is invisible at …[full text: IMPROVEMENT_ARCHIVE.md]

- **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere, so the Hebrew UI shows English): **re-swept 2026-09-09 (S360 Pass K): 2 hits FIXED (`853d1d9` `worksheet.vowels.count_vav`, `ddb0072` `shared.footer.license_note`); 7 dead/undecided rows …[full text: IMPROVEMENT_ARCHIVE.md]

- **`browser-locale-date-in-a-localized-sentence`** (a date formatted with `toLocaleDateString(undefined, …)` — the browser locale — inside a sentence or row the UI translates, so the Hebrew UI shows an English month): **registered 2026-09-09 (S360 Pass K): 3 carriers; hub FIXED …[full text: IMPROVEMENT_ARCHIVE.md]

- **sub-floor touch target on a shared small-button class** (NEW, registered S193): a small-control class — `.btn-xs` and its kin — whose size comes from `padding` **alone**, so its rendered height lands below the suite's ratified **30px** floor (WCAG 2.5.8 asks 24px). Because …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero: swept 2026-07-17 (S93), hits: 0 (the dashboard movable-panels feature 639fcf8/53e50fc uses array-order `panelLayout` with no numeric restores; zone reorder is array-index splicing; its guards use `=== undefined`, not `||`), clean streak: **3 → RETIRED S93** (3 …[full text: IMPROVEMENT_ARCHIVE.md]

- localStorage-vs-AllTools: ACTIVE (consequence-critical: backup completeness, never retires). **Re-swept 2026-09-09 (S357 Pass A, delta-only): 1 new key, `hebrewBlender_lastBackupAt` (S347) — in `eraseAllSettings` with a written per-device reason, export-exempt by design — hits …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **`custom-property-written-on-documentElement-per-frame`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 5 new `setProperty('--heb-font'` writers are one-shot). Shape: a per-frame writer sets a root custom property. Detection: `grep -n 'documentElement.style.setProperty' *.html`, keep writers on a drag/slider/rAF path. Fix: write on the consumers' nearest ancestor. An A2 hit un-retires.

- **`dark-hover-resolves-to-the-rest-colour`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 17 new `:hover` rules all measured with feedback). Shape: a `:hover` that resolves to the rest background in the OTHER theme (dark `--warm-gray` = dark `--white`). Detection: `warm-gray` hover rules minus those with a `body.dark X:hover` twin, confirmed by a real dark hover. Fix shape: `body.dark X:hover{background:#2a3349;}`. An A2 hit un-retires.

- **`author-display-defeats-the-hidden-attribute`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330 runtime 55/55, S343, S357 — the torah handout's 3 new `hidden` rows ship their own `[hidden]{display:none}`). Shape: an element carrying `hidden` whose CSS also sets `display`. Detection: runtime — every `[hidden]` with computed `display !== 'none'` (injected control). Fix shape: `.x[hidden]{display:none}`. An A2 hit un-retires.

_(**All six re-confirmed dead 2026-08-01, S179 — the first A2 to cover the whole retired set in one pass.** Delta-only (`30d653f..HEAD`, 611 added lines), per-class receipts in the sweep-status entry above. None un-retired.)_

- elevation-cue-doubled-or-dead (a box-shadow that doubles a border cue, or resolves invisible in the theme it is used in) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: last hits S311 (14 in the FM help popup, `0c86195`/`88f4940`), then clean S317, S330, S343 (the delta's one new shadow, dictionary `.sidebar-toggle-btn`, is `border:none` + the generator twin's ratified shape). Detector caveat stands: the Impeccable rule id is unreliable as a counter and its threshold is exactly 16px. Re-checked only in Pass A2 / O.

- sibling-page-missing-a-shared-declaration (a chrome/tool page lacking a rule or meta its siblings all carry) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: 3 hits S304 (`e093389`), then clean S317, S330, S343 (`og:locale` on 12/12 indexable pages, the `summary:hover` idiom on all 8 `<details>` pages; `resources.html` remains a deliberate compact chrome). Detection: census the declaration across every sibling, then diff. Re-checked only in Pass A2 / E.

- panel-collapse-writer-mismatch (a `.collapsed` writer that skips `panelMemSave()`, or a panel title without the `data-i18n` key the memory is keyed by) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: first swept S303 (Pass N), then clean S317, S330, S343 (0 `.collapsed` writers added since S303). Detection: `grep -n "classList.add('collapsed')"` (and `.toggle`/`.remove`) over the six carriers, read each writer for the save call. Re-checked only in Pass A2.

- mobile-input-hints (a text field for Hebrew/names/numbers shipping without `inputmode`/`autocapitalize`/`autocorrect`/`spellcheck` fitting its content) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: swept S292 (FM), then clean S317, S330 (`#pickerRoster`), S343 (`#timerCustomInput` `inputmode=numeric maxlength=5`). Detection: every `<input`/`<textarea` added in the delta, read its attributes against the file's own split. Pass N arm 5 keeps the phone-keyboard check. Re-checked only in Pass A2.

- invisible-rebuild-on-a-hot-render-path (a render entry point rebuilding a container that is hidden by default under the DEFAULT view, with cost that scales with data) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: carrier fixed FM `renderSpacingPanel`/`renderKerningSection` (`fa1f88f`), then clean S299, S317, S330 (the S317→S330 delta adds no `innerHTML` writer; torah `buildPrintBand` is bounded by `TROPE_COLOR_DEFS`). Detection kept for A2: list the containers the hot renderer writes, check each at runtime with `offsetParent !== …[full text: IMPROVEMENT_ARCHIVE.md]

- var()-on-an-undefined-custom-property (a `var(--x)` with no fallback whose token is declared nowhere on that page) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: last hit `hebrew_dictionary` `--navy-deep` (`5e9a6d2`, S285), then clean S299, S317, S330 (the 14 `var()` references added since S317 — `--gold-text`, `--navy`, `--text`, `--white`, `--border` — all declared on their pages). Detection kept for A2: per file, diff `--token:` declarations + `setProperty('--token'` literals against fallback-less `var(--token)` references, …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a wrong restored value, not data-loss) → not a consequence-critical carve-out → auto-retired. Re-checked only in Pass A2. **Watch:** any new tool with numeric/boolean …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()` in `shortcutGroups()` and `pwa.js`'s self-contained `t(key,fallback)` are intentional in-scope locals, never reach a global-`t` call site). Correctness-scoped, not …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- listener/interval accumulation (a `setInterval`/`setTimeout`/`addEventListener` attached repeatedly without clear/remove) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 over the S53–S63 surface — generator chunked-build timer single/self-chaining + `cancelWorksheetBuild` clears on re-entry, `beforeprint` attached once, torah color fns add no listeners, `_appToastTimer` clear-guarded). Structural/perf-scoped → auto-retired. Re-checked only in Pass A2.

- ~~JSON-LD ↔ visible-content parity~~ **← UN-RETIRED 2026-08-08 (S190); it now has an ACTIVE Pattern-health line above. Kept here for its history only.** (an `application/ld+json` FAQ/HowTo/ItemList claim drifting from the visible UI or code constants) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 — no `ld+json` block changed across S53–S63; spot-checked torah/generator/trope/FM claims still accurate). SEO/cosmetic-scoped → auto-retired. **Re-check ownership moved from Pass A2 → Pass L (SEO & discoverability) on L's …[full text: IMPROVEMENT_ARCHIVE.md]

- workMode/step reachability (controls reachable in only one workMode/step while the workflow steers users past it) | retired 2026-07-10 (S52) | 3 consecutive clean sweeps (S36, S41-scoped, S52 — trope_tutor's drawer/tabs/tour-skip/mid-drill-return all reachable-by-design). Re-checked only in Pass A2.

- undo-wiring (Font Maker: `markDirty()` without `udDo`/`udBurstBegin`/`udNudgeTick`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; the S25–26 keyboard additions (node-insert, crop) verified as routing through `udDo` or deliberately non-undoable. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the un-swept FM v3.9–v4.2 additions (auto-detect Apply via `udDo(...withSource)`, pen contour, node delete/paste/transform/specks/fillet all `udDo`; `_hiddenContours`/opacity/snapGuides are documented view-only).

- slider-commit (Font Maker: `oninput` range sliders lacking `onchange="udBurstCommit()"`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; every project-data slider commits, and no new range slider has been added. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the FM v3.9–v4.2 sliders (fillet `filletLiveInput`/`filletCommit` burst; size setters commit; mark-editor `meSetDotSize` uses its own `meBeginEdit`/`meCommitEdit` stack; `adSep`/`adTh` are detection-only until Apply).

## Recurring-pattern sweep status

- **S357 Pass A (2026-09-09) — 20 arms over `e0a94d9..9263d9a` (52 commits, 27 files), every runtime arm controlled.** Hits, all fixed: `apply-settings` enum shape (36 sites, `8a18689` + `46b82b0`, re-probed 448 + 136 loads → 0); …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **S343 Pass A (2026-09-08) — 18 arms over the S330→S342 delta (`d0bcad8..e0a94d9`: 50 commits, 13 files, +504 −154 on the pages; 0 outside-loop landings), every runtime arm controlled.** Hits: …[full text: IMPROVEMENT_ARCHIVE.md]

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

### Discovery-pass rotation (run one per session, stalest first)

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html` (the pointer's named surface; its first whole-page O), ATTENDED and the stalest pass, so direction and staleness agreed. Detector: Impeccable JS 4.1.3 from the `skill-v4.1.3` tag — upstream HEAD (4.2.2) is now a Rust engine binary the sandbox cannot download; static arm NOT degraded (20), browser arm …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-08 (**S348 — 14th-ever N, `privacy.html` + `terms.html` (one template; `404.html` run alongside, same template) — their FIRST-EVER N: the archive's N rows cover every tool and contact/resources/index but no privacy, terms or 404, so never-audited was stalest; the pointer named N and the maintainer's invocation pre-selected the micro-feature (gate …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-08 (**S349 — 14th-ever M, `404.html`, its FIRST dedicated M (the S304 row named it as the one chrome page still owed one; S291 had audited only its hero from contact's session) — so M COVERAGE IS NOW COMPLETE for every tool AND every chrome page. M was the stalest pass and the pointer named it; the maintainer's invocation pre-selected the …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-09 (**S360 — 24th run, first since S347 (13 sessions); stalest unattended pass (O attended-only), pointer-named. 4 gates clean (17th consecutive; 5140 keys). Static delta `d11f3cd..52d4621` (47 commits, 11 pages, 503 added lines; 270 live script + 168 markup): 0 hits, 10/10 controls. Plain-argument probe (whole corpus): 15 raw, all printed-output or …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-09 (**S354 — `classroom_dashboard.html`, its 3rd dedicated C (S135 → S236 → S354; 71 commits between, incl. the calendar import, blackout, roster keyboard, width lock, week-editor menu). Target from the S340 row's ordering (dashboard S236 the stalest); C was the stalest pass and the pointer named it. 8 census cells + drawer + week editor, 8 Tab-walk cells, 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-09 (**S357 — A was the stalest pass and the S357 pointer named it AND its two lead arms; 20 arms over `e0a94d9..9263d9a` (52 commits, 27 files), every runtime arm controlled. 3 hits, all fixed in-session (36 enum sites on 2 pages; the hub's 4 hover-less erase buttons; contact's status note), 2 sub-floor carriers + the `.ivrit` engine's hover-less Merge row …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-08 (**S351 — `trope_tutor.html`, its 2nd dedicated G (S195 → S351, ~156 sessions; the whole-chart print `cb79a15`, the S253 toast hide and the dark-remap landed between). Target RE-DERIVED from the per-session lines' "pass run: G" rows: trope S195 < dashboard S231 < dictionary S252 < generator S265 < flash S279 < chrome S306 < torah S324 < FM S337 — …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-09 (**S352 — `index.html`, the hub: its FIRST-EVER D and the first chrome-page D (S338's own note: none had one). Target re-derived from the archive's D rows: generator S338 > dashboard S325 > torah S307 > FM S294 > flash S266 > dictionary S253 > trope S232 > chrome never. 16 cold cells 0 blocks >200 ms (max 116 @4×); seeded 743 KB + 10 fonts (3.4 MB): cold 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-09 (**S353 — 27th run, its first since S339 (14 sessions); I was the stalest pass and the S353 pointer named it AND the `f2384a7` te'amim surface. Mechanical gates clean a FOURTEENTH consecutive run:** 26 virgin loads (13 pages × EN/HE via `?lang=he`, a new context per load = empty localStorage AND IndexedDB, SW blocked, foreign origins aborted) → 0 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-09 (**S356 — 28th run, its first since S342 (14 sessions); B was the stalest pass and the S356 pointer named it. Five arms, every probe controlled: (1) 56 loads (14 pages × 1280/390 × light/dark): 0 pageerrors, 0 non-noise console lines, 0 failed same-origin requests (an injected throw + 404 control counted); (2) 13 pages × light/dark real-click interactions clean …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-09 (**S359 — 17th run, first since S345 (14 sessions); stalest unattended pass, pointer-named. Byte-check vs `aebb86b` (S345→S358): 11/14 files moved, 0/14 crawler surfaces moved (title, description, canonical, OG/Twitter, JSON-LD, h1, FAQ summary TEXT). Mechanical 14/14 clean, every detector fired by a mutated-copy control; sitemap lastmod = git 12/12; 7 …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-08 (**S350 — `contact.html`, its FIRST-EVER H: the archive's H rows cover every tool plus resources (S305) and the hub (S323), so contact — the one remaining chrome page with a real teacher task — was the never-audited target. H was the stalest pass and the pointer named it; the maintainer's invocation pre-selected the micro-feature (gate …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-09 (**S358 — 29th run, first since S344 (14 sessions); stalest pass, pointer-named. Delta `ab79059..b418cf9` (57 commits, 27 files). 16 arms, 14 clean, 2 doc drifts FIXED: `shared-components.md` §5 (contact renderer, hub erase dialog) → `a0e51f1`; `storage-and-backup.md` + `generator.md` (value-level restore guards) → `c32ef93`. Clean receipts (precache, refs, …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-09 (**S355 — 28th run, its first since S341 (14 sessions); F was the stalest pass and the S355 pointer named it AND the affordance: DARK-MODE HOVER FEEDBACK on plate controls (the `dark-override-outranks-hover` twins).** Method: the corrected static detector over all 14 pages (8 pairs on 5 pages) + a runtime census with a REAL `page.mouse.move` + 450 ms in …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S361):** **BRANCH/PR: S360 CONTINUED `claude/inspiring-meitner-rhqskk` → draft PR #227 (base `origin/main` `f2384a7`; S352–S360 = 39 commits). Continue it if open; if merged, cut a fresh `claude/*` off latest `origin/main`. Verify via the API** (0 check runs is correct — no workflows). **Drift note: `sw.js` v685, `FONT_MAKER_VERSION` 5.39** — re-read both.

**⚑ STALEST PASS: O (S346, attended-only — unattended skips to N), N (S348), M (S349), H (S350), G (S351), D (S352), I (S353), C (S354), F (S355), B (S356), A (S357), E (S358), L (S359), K (S360).** Unattended: take N (15th run) on `flash_cards.html` (its last N was S244) with a real device descriptor — all 7 arms, phone contact sheet even when clean. **O next `torah_trainer.html`; H the generator (S251); C the Font Maker (S257).**

**⚑ Harness (standing): torah verification stubs Sefaria by fulfilling `**/*sefaria.org/**` (calendars → one Parashat Hashavua item, `ref:'Genesis 1:1-6:8'`; v3 texts → 2-D per chapter); hidden toggle inputs → click `label.toggle:has(#id)`; the HTTP server does not survive a compaction — curl it before every Playwright run; pypdf needs a stub `cryptography` package; a hover-contrast read needs a REAL `page.mouse.move` + 400 ms, an opacity/`:focus-visible` read a real Tab, never `page.focus()`; a hover census measures rest state BEFORE opening any modal; a probe's row buttons need the host open by ITS path (dashboard schedules live inside `openWeekEditor()`), and an `elementFromPoint` receipt precedes every real click; `arm4.mjs <page> k1,k2` filters the `?s=` probe; modal probes read the LAST `[aria-modal]` — the hub's erase gate sits over the IE modal, and the engine's `ivritAskMode()` dialog opens by calling it inside `page.evaluate` (a Promise — never await it) (S357–S358); a control directory is REAL copies (`cp`), never symlinks over the repo root, a crawl-graph control breaks the link on EVERY page, and a ctrl copy of a repo-reading script must tolerate a non-git ROOT (S359, receipts in loop-findings); the HE-screen census (`k360/hecensus.mjs`) is K's strongest arm — grep each survivor's `en` value in the CSV; `I18n.setLang` counts one `framenavigated` (replaceState), not a reload (S360).**

**⚑ TOP UNGATED CANDIDATES (S360):** the Font Maker's two browser-locale date sites (P4, the new date pattern — FM untouched since S356); the 2 dead pinned-footer CSV rows (P4, a 2-row prune); the static census's class-less inline-styled buttons on the generator / dashboard / Font Maker (P4, `control-class-without-a-hover-state`, hover UNVERIFIED); the tour-card h4 → h2 ×7. The 5 torah/trope credit rows are a wire-or-prune call for the maintainer. **Seed bench:** unchanged.
