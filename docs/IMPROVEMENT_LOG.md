# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S361 Pass N — GATE 4 (phone layout), deferred unattended; screens `n361/shot-setup-*.png`**) | flash_cards.html | **The sticky Start bar also carries the Print card sheet button: 136px = 24% of an iPhone SE, 20% of an iPhone 13, 40% in landscape (the S244 header precedent was 21.5%, approved).** Proposal: at ≤440px only Start stays sticky; Print flows below. | found S361

- [ ] P4 (**NEW S361 Pass N arm 1 — GATE 4 (landscape phone), deferred unattended; `n361/shotL-card-*.png`**) | flash_cards.html | **In iPhone 13 landscape (750×342) the card screen shows 137px of the 330px card: sticky header 64 + progress + stats bar (136–191) push it to y=205.** Proposal: a landscape height query hides the stats bar or shrinks the card. | found S361

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`; wire or prune: maintainer's call**) | torah + trope (`ui-strings.csv`) | **5 credit rows (`torah.footer.sefaria_credit`/`cantillation_credit`, `torah.audio.speeds_credit`, `trope.footer.sefaria_credit`/`cantillation_credit`): translated, referenced nowhere; markup has anchors → `data-i18n-html` cells.** | found S360

- [ ] P4 (**NEW S363 Pass H — GATE 2: Hebrew wording for the printed teacher copy; the sites are in loop-findings**) | hebrew_blend_generator.html | **With Header Labels = עברית the printed answer-key banner, `Answer Key — Teacher Copy` subtitle, the sheet footers and the Fill-Vowels instruction stay English — only Name/Date (`wsMetaHTML`) flip.** ~10 render sites; authoring, not wiring. | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S363 Pass H — the `validation-note-stores-rendered-text` shape on the preview notice; the preset-name note got `d9c0d86`**) | hebrew_blend_generator.html | **`showPreviewNotice` stores rendered text, so a live EN⇄HE switch leaves a "Settings changed" / "waiting for selection" notice in the old language until it is dismissed or re-fired.** Fix = keep the key and re-render from …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [x] 2026-09-09 | (S363 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `c1d970c`) → S363 CONTINUED `claude/inspiring-meitner-rhqskk`, 4 commits; a human merges + confirms the Pages run. Drift: none (`f2384a7`, sw v687, FM 5.39). sw v687→v688 (2 pages); FM untouched. DoD + compact/check-ledger. Deferred: micro-feature; O; 2 gate-4; credit rows; teacher-copy wording.**

- [x] 2026-09-09 | `322223e` | classroom_dashboard.html | **`savePreset` confirms before replacing a same-named preset (`dashboard.preset.overwrite_confirm`); the name stays on Cancel (S363, P3, `save-over-an-existing-name-without-confirm`)** | `h363/dashdup.mjs` 8 cells by ⚙ → Presets: 0 dialogs before; after: asks once, Cancel keeps snapshot + name, OK replaces, new name never asks

- [x] 2026-09-09 | `128c449` | hebrew_blend_generator.html | **both `livePulseGenerate` sites read `worksheet.preview.settings_changed` instead of the raw English (S363, P3, `authored-but-unreferenced i18n key`)** | `h363/notice.mjs` 4 cells: HE notice in Hebrew (before: English), EN unchanged, pulse arms; check-i18n clean

- [x] 2026-09-09 | `a0ec809` | hebrew_blend_generator.html | **`savePreset` confirms before replacing a same-named preset (the ↺ button's own key); the name stays on Cancel (S363 Pass H, P3, `save-over-an-existing-name-without-confirm` — NEW)** | `h363/savedup.mjs` 8 cells: 0 dialogs + silent 40→20 before; after: asks once, Cancel keeps both, OK replaces + clears, new name never asks

- [x] 2026-09-09 | (S362 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `ae63425`) → S362 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges + confirms the Pages run. Drift: none (`f2384a7`, sw v686, FM 5.39). sw v686→v687 (4 pages); FM not bumped (hover fix). DoD + compact/check-ledger. Deferred: micro-feature; O; 2 gate-4; credit rows.**

- [x] 2026-09-09 | `26fd826` | Hebrew_Font_Maker.html | **Custom-glyph tile ✕/↔ → `.cg-tile-btn` (+`-del`/`-cvt`), hover muted → `--text` (white in a selected tile); physical corners kept — the letter grid is RTL in both UI langs (S362, P4, `control-class-without-a-hover-state`)** | `m362/fmcg.mjs` by the panel's own path, 4 cells: hover changed 3/3 (before 0/3), corners identical, delete confirms

- [x] 2026-09-09 | `a0cc446` | classroom_dashboard.html | **`.preset-copy-btn::after` inset −5px 0 → a 25px hit box, visible 36×17 unchanged (S362, P4, `sub-floor touch target`; the `.swm-chip-arm::after` idiom)** | `m362/dashcopy2.mjs`, 8 cells by the box's path: `elementFromPoint` 3px above/below = the button (before: the textarea), an edge click copies

- [x] 2026-09-09 | `9ad0df8` | hebrew_blend_generator.html | **Header switcher slot `align-self:center` + select `min-height:35px` — it stretched to the title block: 41px at 1280, 94 (EN) / 55 (HE) at 800, beside 35px buttons (S362, P4, `row-siblings-with-mismatched-heights`)** | `m362/genhdr2.mjs`, 8 cells: 1 height (before 2 in 8/8), caret re-centred

- [x] 2026-09-09 | `10be341` | hebrew_dictionary.html | **`.nav-btn`/`.dark-btn` min-height 24 → 30: the row ran switcher 30 / Home 24 / Tour 24 / Dark 25, the suite's only uneven header row (S362 Pass M, P4, `row-siblings-with-mismatched-heights`; the S259 carrier, re-hit on the sibling that detector skipped)** | `m362/dicthdr.mjs`, 12 cells: 30.0 ×4 (before 0/12 uniform), header height unchanged

- [x] 2026-09-09 | (S361 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `00eedcb`) → S361 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges + confirms the Pages run. Drift: none (`f2384a7`, sw v685, FM 5.39). sw v685→v686 (3 pages); FM not bumped. DoD + compact/check-ledger; 83 sweep rows → archive. Deferred: micro-feature; O; 2 gate-4; credit rows.**

- [x] 2026-09-09 | `4680a2b` | classroom_dashboard.html | **`#presetCopyBtn` → `.preset-copy-btn` with a hover (gold border, text → `--text`) and `inset-inline-end` (S361, P4, `control-class-without-a-hover-state`)** | `n361/dashcopy.mjs` by the box's path (⚙ → Presets → Manual), real hover, 8 cells: 6.15/6.12 → 14.81/14.61:1, HE placement right → left, ✓ on a real click, 0 pageerrors

- [x] 2026-09-09 | `1f102f0` | hebrew_blend_generator.html | **`#headerLangEn`/`#headerLangHe` join `.color-mode-btn` (`.active` via `setHeaderLang`); `.color-mode-btn:not(.active):hover` added, light + dark (S361, P4, `control-class-without-a-hover-state`)** | `n361/hlang.mjs` real hover, 4 cells: unselected pill 11.29 / 9.85:1 (was no change); click + applySettings restore; aria-pressed synced

- [x] 2026-09-09 | `04e4f0e` | locales/ui-strings.csv (+ en/he.json) | **`shared.footer.created_by` + `shared.footer.word_data` pruned — pinned-English credits by `eb4ce00`; 5140 → 5138 keys (S361, P4, `authored-but-unreferenced i18n key`)** | 0 refs (grep + prefix census); `n361/prune.mjs` 26 loads: 0 missing-key lines, credits still English; build-locales + check-i18n clean

- [x] 2026-09-09 | `ba7b14f` | Hebrew_Font_Maker.html | **`myFontsDate` + `recentDate` format in `I18n.lang` (S361, P4, `browser-locale-date-in-a-localized-sentence` — 3rd and last carrier)** | `n361/fm.mjs` 8 cells, seeded recents, real click on Load Project: HE "26 ביולי | 3 בספט׳" (before "Jul 26 | Sep 3"), EN unchanged, 0 pageerrors

- [x] 2026-09-09 | (S360 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `52d4621` at start) → S360 CONTINUED `claude/inspiring-meitner-rhqskk`, 5 commits; a human merges + confirms the Pages run. Drift: none (`f2384a7`, sw v684, FM 5.39). sw v684→v685 (7 pages); FM not bumped. Scripts: full definition of done + compact/check-ledger. Deferred: micro-feature; O; credit rows.**

- [x] 2026-09-09 | `8094579` | flash_cards.html | **the Results History rows, the printed report and the certificate date via `I18n.lang`, not the browser locale (S360, P4, `browser-locale-date-in-a-localized-sentence`)** | `k360/fcdates.mjs`, seeded profile, 8 cells: Hebrew months in every HE cell (before: English), EN unchanged, 0 pageerrors

- [x] 2026-09-09 | `f8b716b` | index.html | **`_ivFmt` (last-backup line + My Fonts created date) formats in `I18n.lang` (S360, P4, `browser-locale-date-in-a-localized-sentence` — NEW pattern, hub = 1st carrier)** | `k360/lastbackup.mjs` 16 cells + `myfonts.mjs`: Hebrew dates in HE (before: English), live setLang re-formats both ways, 0 pageerrors

- [x] 2026-09-09 | `ddb0072` | index + contact + privacy + terms + 404 | **the footer's license sentence gets `data-i18n="shared.footer.license_note"` on all 5 landing pages (S360, P3, `authored-but-unreferenced i18n key`)** | `k360/footer.mjs`: the CSV's Hebrew sentence on 5/5 in HE (before: English), EN + links unchanged, 0 pageerrors; check-i18n clean

- [x] 2026-09-09 | `853d1d9` | hebrew_blend_generator.html + ui-strings.csv | **the "Count וֹ/וּ as a letter" label gets `data-i18n-html="worksheet.vowels.count_vav"`; the cells take the flash-card twin's heb-font span (S360, P3, `authored-but-unreferenced i18n key`)** | `k360/countvav.mjs` 8 cells: Hebrew label in HE (before: English), span font + `lang=he` kept, real-click toggle ok

- [x] 2026-09-09 | (S359 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `55f694d` at start) → S359 CONTINUED `claude/inspiring-meitner-rhqskk`, 3 commits; a human merges and confirms the Pages run. Drift: none (`origin/main` `f2384a7`, sw v683, FM 5.39). `sw.js` v683→v684 (1 precached page: flash_cards); FM not bumped (no FM change). Scripts: check-i18n, check-inline-js, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `7e8cb37` | flash_cards.html | **the weaknesses viewer's four `.weak-tab`s get stylesheet rules (`paintTabs()` keeps only the `aria-pressed` sync) and its × and the Learner Ladder's × take `.fc-dlg-x` (S359, P4, `control-class-without-a-hover-state`)** | `l359/weakdlg.mjs` 4 cells (light/dark × 1280/800): hover feedback on tabs + both ×, 5.97–18.06:1, the tab moves by a real …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-09 | `bcae3ec` | flash_cards.html | **the profile-picker (`chooseProfileModal`) and card-count (`askCardCount`) dialogs move from inline-styled class-less buttons to `.fc-dlg-btn[data-act]` / `.fc-dlg-pick` (+ `is-active`/`is-on`) / `.fc-dlg-x` per-page CSS with hover plates; `paint()` toggles a class; the × reaches 24px (S359, P4, `control-class-without-a-hover-state` + `sub-floor …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

- 2026-09-09 | **S363** | iters: 1 pass (**H**) + 3 fixes = **4** (no cap-allowed 4th) | tools: generator (`a0ec809`, `128c449`), dashboard (`322223e`) | patterns fixed: save-over-existing-name ×2 (NEW), unreferenced-key ×1 | pass run: H (generator, 2 frictions + 1 leak) | SW: v688

- 2026-09-09 | **S362** | iters: 1 pass (**M**) + 4 fixes = **5** | tools: dictionary (`10be341`), generator (`9ad0df8`), dashboard (`a0cc446`), Font Maker (`26fd826`) | patterns fixed: row-siblings ×2, hover-state ×1, sub-floor ×1 | pass run: M (dictionary, 1 defect + 1 cross-page) | SW: v687

- 2026-09-09 | **S361** | iters: 1 pass (**N**) + 4 fixes = **5** | tools: Font Maker (`ba7b14f`), locales (`04e4f0e`), generator (`1f102f0`), dashboard (`4680a2b`) | patterns fixed: date ×1 (closed), unreferenced-key ×1, hover-state ×2 | pass run: N (flash cards, 0 defects, 2 gate-4) | SW: v686

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

### Tool coverage (last-touched date per tool)

- **S363 (2026-09-09):** hebrew_blend_generator **2026-09-09 (`a0ec809`, `128c449`; H-audited S363)**; classroom_dashboard **2026-09-09 (`322223e`)**; hebrew_dictionary 2026-09-09 (`10be341`; M-audited S362); Hebrew_Font_Maker 2026-09-09 (`26fd826`); index 2026-09-09 (S360); contact / privacy / terms / 404 2026-09-09 (S360); flash_cards 2026-09-09 (S360; N-audited S361); resources 2026-09-09 (S356); torah_trainer 2026-09-09 (S355); trope_tutor 2026-09-09 (S353).

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`validation-note-stores-rendered-text`**: ACTIVE. **S357 Pass A: HIT — contact's `#formStatus` notes (captcha-required, sending, sent, failed) were written as rendered text with no `applyI18n` re-render; driven: after `I18n.setLang('he')` the heading flipped, the note stayed …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new opener, the hub's first-erase gate `ivritAskErase` (S350) — driven by real keys: role=dialog + labelledby, focus enters, Tab ×3 wraps, Escape closes and returns …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new note helpers or `aria-disabled` writers; the torah handout's new selected-verses row hides itself when the selection empties — hits 0, clean streak 1.** S343 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`uncompressed-jspdf-raster`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): 0 new `addImage(` sites; 3/3 carry `'FAST'` — hits 0, clean streak 2.** Registered S337 Pass G; S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Definition: a jsPDF `addImage(...)` with no …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED — never retires). **S358: the ENUM-STRING shape CLOSED on its last sites — the dictionary's `copyMode` (radio match) + `shoreshRoot` (string only), `a2eddd9`; S356–S357 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE — **REGISTERED S363 (Pass H): a Save-by-typed-name that replaces an existing preset with no confirm, while the row's own ↺ button confirms. 2 carriers, both FIXED in-session: generator `savePreset` (`a0ec809`), dashboard …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S362: 1 FIXED (`26fd826` FM custom-glyph ✕/↔ → `.cg-tile-btn`); the generator header trio REFUTED by a real mouse (`header > a:hover, header > button:hover`, S313). Open: the generator's bingo ± (Bingo mode only, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **ONE MORE ARTIFACT at 2026-09-08 (S343 Pass A), caught before a verdict: the first dashboard alert census reported `clicked=1` of 254 — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S362: `#presetCopyBtn` FIXED (`a0cc446`, a `::after` hit box — no visible change; it measures from the padding box). S359: flash cards' card-count × 21→24 (`bcae3ec`). Open: generator `.toggle` switches (40×22), FM `#rulerCorner` …[full …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **row-siblings-with-mismatched-heights**: ACTIVE. **S362: 2 hits FIXED — `hebrew_dictionary.html` header (`10be341`: switcher 30 / 24 / 24 / 25 → 30 ×4; the S259 carrier, re-hit on the sibling that detector skipped — the shared switcher) and `hebrew_blend_generator.html` …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S363 Pass H: 1 hit FIXED (`128c449`, `worksheet.preview.settings_changed` — both call sites passed the raw English; found by walking the live-preview-off path in HE). S361: 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`browser-locale-date-in-a-localized-sentence`** (`toLocaleDateString(undefined, …)` inside a translated sentence or row): **all 3 carriers FIXED — hub `f8b716b`, flash `8094579` (S360), Font Maker `ba7b14f` (S361); clean streak 0 — ACTIVE.** Detection: `grep -n …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

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

- _(history)_ **The per-sweep result rows (S141–S357, 83 rows) moved verbatim to `docs/IMPROVEMENT_ARCHIVE.md` in S361 ("Sweep-status rows moved out of the ledger"); the current state of every pattern lives in Pattern health above.** Grep …[full text: IMPROVEMENT_ARCHIVE.md]

### Discovery-pass rotation (run one per session, stalest first)

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html` (the pointer's named surface; its first whole-page O), ATTENDED and the stalest pass, so direction and staleness agreed. Detector: Impeccable JS 4.1.3 from the `skill-v4.1.3` tag — upstream HEAD (4.2.2) is now a Rust engine binary the sandbox cannot download; static arm NOT degraded (20), browser arm …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-09 (**S361 — 15th-ever N, `flash_cards.html`, its 2nd (S244 → S361: the ladder, profiles, dialogs, tour and sticky CTA landed between); stalest unattended pass (O attended-only), pointer-named. Real descriptors (iPhone SE 320×568, iPhone 13 390×664 + landscape 750×342, Pixel 7 412×839; `pointer:coarse`, `hover:none`, `maxTouchPoints` 1), SW …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-09 (**S362 — 15th-ever M, `hebrew_dictionary.html`, its 2nd (S237 → S362); stalest unattended pass (O attended-only), pointer-named. 10 cells (EN/HE × light/dark × 1280/800 + 640 EN) + 7 views (word modal, Word Lists empty state, keyboard, Emojis, Shoresh למד, sidebar hidden, tour): 0 pageerrors, 0 overflow, dark parity clean, card grid …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-09 (**S360 — 24th run, first since S347 (13 sessions); stalest unattended pass (O attended-only), pointer-named. 4 gates clean (17th consecutive; 5140 keys). Static delta `d11f3cd..52d4621` (47 commits, 11 pages, 503 added lines; 270 live script + 168 markup): 0 hits, 10/10 controls. Plain-argument probe (whole corpus): 15 raw, all printed-output or …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-09 (**S354 — `classroom_dashboard.html`, its 3rd dedicated C (S135 → S236 → S354; 71 commits between, incl. the calendar import, blackout, roster keyboard, width lock, week-editor menu). Target from the S340 row's ordering (dashboard S236 the stalest); C was the stalest pass and the pointer named it. 8 census cells + drawer + week editor, 8 Tab-walk cells, 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-09 (**S357 — A was the stalest pass and the S357 pointer named it AND its two lead arms; 20 arms over `e0a94d9..9263d9a` (52 commits, 27 files), every runtime arm controlled. 3 hits, all fixed in-session (36 enum sites on 2 pages; the hub's 4 hover-less erase buttons; contact's status note), 2 sub-floor carriers + the `.ivrit` engine's hover-less Merge row …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-08 (**S351 — `trope_tutor.html`, its 2nd dedicated G (S195 → S351, ~156 sessions; the whole-chart print `cb79a15`, the S253 toast hide and the dark-remap landed between). Target RE-DERIVED from the per-session lines' "pass run: G" rows: trope S195 < dashboard S231 < dictionary S252 < generator S265 < flash S279 < chrome S306 < torah S324 < FM S337 — …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-09 (**S352 — `index.html`, the hub: its FIRST-EVER D and the first chrome-page D (S338's own note: none had one). Target re-derived from the archive's D rows: generator S338 > dashboard S325 > torah S307 > FM S294 > flash S266 > dictionary S253 > trope S232 > chrome never. 16 cold cells 0 blocks >200 ms (max 116 @4×); seeded 743 KB + 10 fonts (3.4 MB): cold 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-09 (**S353 — 27th run, its first since S339 (14 sessions); I was the stalest pass and the S353 pointer named it AND the `f2384a7` te'amim surface. Mechanical gates clean a FOURTEENTH consecutive run:** 26 virgin loads (13 pages × EN/HE via `?lang=he`, a new context per load = empty localStorage AND IndexedDB, SW blocked, foreign origins aborted) → 0 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-09 (**S356 — 28th run, its first since S342 (14 sessions); B was the stalest pass and the S356 pointer named it. Five arms, every probe controlled: (1) 56 loads (14 pages × 1280/390 × light/dark): 0 pageerrors, 0 non-noise console lines, 0 failed same-origin requests (an injected throw + 404 control counted); (2) 13 pages × light/dark real-click interactions clean …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-09 (**S359 — 17th run, first since S345 (14 sessions); stalest unattended pass, pointer-named. Byte-check vs `aebb86b` (S345→S358): 11/14 files moved, 0/14 crawler surfaces moved (title, description, canonical, OG/Twitter, JSON-LD, h1, FAQ summary TEXT). Mechanical 14/14 clean, every detector fired by a mutated-copy control; sitemap lastmod = git 12/12; 7 …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-09 (**S363 — `hebrew_blend_generator.html`, its 3rd dedicated H (S130 → S251 → S363; 69 commits between: the remembered setup, the flash-card handoff, the restore guards, the header-language pills). H was the stalest unattended pass (O attended-only) and the pointer named it AND the tool. Lesson DISTINCT from S251's aleph-bet+deck walk: a …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-09 (**S358 — 29th run, first since S344 (14 sessions); stalest pass, pointer-named. Delta `ab79059..b418cf9` (57 commits, 27 files). 16 arms, 14 clean, 2 doc drifts FIXED: `shared-components.md` §5 (contact renderer, hub erase dialog) → `a0e51f1`; `storage-and-backup.md` + `generator.md` (value-level restore guards) → `c32ef93`. Clean receipts (precache, refs, …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-09 (**S355 — 28th run, its first since S341 (14 sessions); F was the stalest pass and the S355 pointer named it AND the affordance: DARK-MODE HOVER FEEDBACK on plate controls (the `dark-override-outranks-hover` twins).** Method: the corrected static detector over all 14 pages (8 pairs on 5 pages) + a runtime census with a REAL `page.mouse.move` + 450 ms in …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S364):** **BRANCH/PR: S363 CONTINUED `claude/inspiring-meitner-rhqskk` → draft PR #227 (base `origin/main` `f2384a7`; S352–S363 = 53 commits). Continue it if open; if merged, cut a fresh `claude/*` off latest `origin/main`. Verify via the API** (0 check runs is correct — no workflows). **Drift note: `sw.js` v688, `FONT_MAKER_VERSION` 5.39** — re-read both.

**⚑ STALEST PASS: O (S346, attended-only — unattended skips it), G (S351), D (S352), I (S353), C (S354), F (S355), B (S356), A (S357), E (S358), L (S359), K (S360), N (S361), M (S362), H (S363).** Unattended: take G (print & export fidelity) on `classroom_dashboard.html` — its last G was S231, the stalest tool per the S351 row's ordering (trope S195→S351 < dashboard S231 < dictionary S252 < generator S265 < flash S279 < chrome S306 < torah S324 < FM S337); print-preview every printable surface on Letter and A4, both themes, and inspect every exported file (`.ivrit`, share code, calendar/CSV if any). **O next `torah_trainer.html`; H next trope_tutor (S228); C the Font Maker (S257); N next resources (S246); M next trope_tutor (S245).**

**⚑ Harness (standing): torah verification stubs Sefaria by fulfilling `**/*sefaria.org/**` (calendars → one Parashat Hashavua item, `ref:'Genesis 1:1-6:8'`; v3 texts → 2-D per chapter); hidden toggle inputs → click `label.toggle:has(#id)`; the HTTP server dies across a compaction — curl it first; pypdf needs a stub `cryptography` package; a hover-contrast read needs a REAL `page.mouse.move` + 400 ms, an opacity/`:focus-visible` read a real Tab, never `page.focus()`; a probe's row buttons need the host open by ITS path (dashboard schedules: `openWeekEditor()`; the dashboard backup box: ⚙ → Presets → `#ivritModeManual`; the dashboard message editor `#dashEditor` is INSIDE the settings modal; the FM Custom glyphs tab: Advanced → `label.chk:has(#addCustomGlyphsChk)`), and an `elementFromPoint` receipt precedes a real click; modal probes read the LAST `[aria-modal]`, and `ivritAskMode()` opens by calling it inside `page.evaluate` (never await it); the harness auto-accepts dialogs — a confirm probe installs a handler that dismisses; a control directory is real copies (`cp`); K's strongest arm is `k360/hecensus.mjs`; N runs on real descriptors with a `dialog` handler; a probe's screenshot path is cwd-relative — run probes from the scratchpad; the shared language switcher stretches to its flex LINE, so every header census measures `[data-i18n-switcher] > *` too; the FM letter grid is RTL in both UI languages; a `::after` hit box measures from the padding box.**

**⚑ TOP UNGATED CANDIDATES (S363):** the generator's preview notice re-render on a live language switch (small; the `d9c0d86` idiom); the generator's bingo ± hover (drive Bingo mode first); the tour-card h4 → h2 ×7 (CLAUDE.md: the next touch of a tour engine extracts it into a shared block — not small); generator `.toggle` switches 40×22 / FM `#rulerCorner` 22×22 / dashboard swatches (sub-floor, M calls). Gate 2: the printed teacher-copy wording under a Hebrew header. Gate 4 (attended only): the flash-card sticky-bar and landscape-card proposals (`n361/`). The 5 torah/trope credit rows: wire-or-prune. **Seed bench:** unchanged (4 seeds: resources font-submit form, hub saved-work badges, dashboard per-day overrides, dashboard week cycles).
