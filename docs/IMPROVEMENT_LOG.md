# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S369 Pass F — the BETA/Beta badge, 5 pages, 4 sizes; a shared-idiom convergence, pattern text-size floor**) | index.html + classroom_dashboard.html + hebrew_blend_generator.html + flash_cards.html + hebrew_dictionary.html | **The same gold Beta badge renders at 8.8px (`.beta-tag` 0.55rem on index and the dashboard), 8px/9.6px/10.4px (three inline styles on the generator: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S369 Pass F — the letter-grid tile names diverge between the two tools that share the grid; pattern text-size floor**) | flash_cards.html | **`.letter-tile small` renders the 31 letter names at 9.28px (0.58rem) while the generator's identical grid took the `41679da` step to 9.92px (0.62rem, 1px tile sides).** Take the same step on flash cards after re-running the S327 tile …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S369 Pass F — the remaining sub-11px FUNCTIONAL labels outside the Font Maker, one batch per page; the census is in loop-findings**) | resources.html + hebrew_dictionary.html + hebrew_blend_generator.html + flash_cards.html + privacy.html | **resources `.card-cat-badge` 9.6px ×43 + `.filter-label` 10.88 ×2; dictionary `.theme-count` 9.6 ×14 + `.pos-arrow` 10.4 ×7; generator …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S368 Pass C — the inline remainder of the S314 handoff, a batch for the next Font Maker session**) | Hebrew_Font_Maker.html | **~30 JS-template hints carry `style="font-size:0.6–0.66rem"` (9.6–10.6px): the wide-form, holam-vav, dagesh-size, precomp, kern-preview, accents and fidelity-pin hints.** The class rules were lifted in `880c664`; these inline sites render only in their …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S361 Pass N — GATE 4 (phone layout), deferred unattended; screens `n361/shot-setup-*.png`**) | flash_cards.html | **The sticky Start bar also carries the Print card sheet button: 136px = 24% of an iPhone SE, 20% of an iPhone 13, 40% in landscape (the S244 header precedent was 21.5%, approved).** Proposal: at ≤440px only Start stays sticky; Print flows below. | found S361

- [ ] P4 (**NEW S361 Pass N arm 1 — GATE 4 (landscape phone), deferred unattended; `n361/shotL-card-*.png`**) | flash_cards.html | **In iPhone 13 landscape (750×342) the card screen shows 137px of the 330px card: sticky header 64 + progress + stats bar (136–191) push it to y=205.** Proposal: a landscape height query hides the stats bar or shrinks the card. | found S361

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`; wire or prune: maintainer's call**) | torah + trope (`ui-strings.csv`) | **5 credit rows (`torah.footer.sefaria_credit`/`cantillation_credit`, `torah.audio.speeds_credit`, `trope.footer.sefaria_credit`/`cantillation_credit`): translated, referenced nowhere; markup has anchors → `data-i18n-html` cells.** | found S360

- [ ] P4 (**NEW S363 Pass H — GATE 2: Hebrew wording for the printed teacher copy; the sites are in loop-findings**) | hebrew_blend_generator.html | **With Header Labels = עברית the printed answer-key banner, `Answer Key — Teacher Copy` subtitle, the sheet footers and the Fill-Vowels instruction stay English — only Name/Date (`wsMetaHTML`) flip.** ~10 render sites; authoring, not wiring. | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S364 Pass G — GATE 2: a default-output choice, deferred unattended; numbers + screens in loop-findings (`g364/out/board-print-en-dark.png`)**) | classroom_dashboard.html | **With background graphics ON, the board's day plates print in their screen colours under the print block's navy ink (`.day-item.colored { color: var(--text) }`): 1.12:1 on Friday's indigo, 1.58 purple, 2.58 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S364 — pattern `sub-floor touch target`, an M call like the `.toggle` switches**) | hebrew_blend_generator.html | **The bingo card stepper's ▲/▼ buttons are 18.7×10.5 / 18.7×9.5px at 8.8px type (Bingo mode, `.bingo-step`).** A 24px pair doubles the 90px control's height — a visible size change, not a hit-box trick (the two stack inside a 1px-bordered box). | found S364

- [ ] P4 (**S357 Pass A → PARTLY FIXED S365 (`d86e728`: the 7 unscaled 40×22 toggles → 40×24); pattern `sub-floor touch target`, the rest are M calls**) | hebrew_blend_generator.html + Hebrew_Font_Maker.html | **Three sub-option toggles carry `style="transform:scale(0.75)"` (32×19 / 30×18 after the floor); the Font Maker's `#rulerCorner` zoom-reset is 22×22, sized by `--rl-w`.** Unscaling the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S354 Pass C — the S309 O hand-off `skipped-heading`, now LOCATED: it is the tour card, on all 7 tools**) | the 7 tour carriers (`#tourCardTitle`) | **`<h4 id="tourCardTitle">` is the only h4 on pages whose outline is h1 → h2, so the tour dialog's title skips two levels; every page styles `.tour-card h4`.** Fix = an `h2` with a class (selectors re-pointed) on all 7 — and CLAUDE.md …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] S | trope_tutor.html | **"Drill the marks I missed" on the results screen.** `_lastMissed` holds the keys + clips the review list renders, but the only next steps are Drill again (the same scope) and Back to Learn; `drillScope()` is family-only (`TROPE_FAMILY_DEFS`). A transient key-pool override in `startDrill` (no storage key, 1–2 CSV keys, ~35 lines) turns the review list into the next …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Missed-review rows and mastery cells open the mark's Learn card.** Measured S367: results → the Learn card of a missed mark is 2 clicks AND the student must know its family (the review row shows name + ▶ only; `.tu-mcell` is an inert `div`: no `tabindex`/`role`/`onclick`, cursor auto). A "Study →" per review row and a click on a mastery cell (`currentFamily = …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Drill length 5 / 10 / 20.** `QUESTIONS_PER_SESSION = 10` is a const and the start heading `trope.drill.heading` names "10"; a 5-question warm-up for young students or a 20-question test both need a reload-free choice. Rides the settings blob as a read-validated field (the `drillScope` precedent), 2–3 CSV keys; the heading becomes `{n}` — gate 2 for its wording. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **"Print the deck we just drilled" on the results screen.** `wireResultsScreen()` binds Save / Redo / Mistakes / Back only; the only caller of `printCardSheet()` is `#sheetPrintBtn` inside `#sheetMenu`, opened from the setup screen's sticky CTA — and `sheetPracticed` + `savedCards` already exist for exactly this moment (`openSheetMenu` unhides `#sheetPracticedRow` …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Speech speed reachable mid-drill.** `speakWord()` reads `#ttsRateSlider` live, but the slider sits in `#panelAdvanced` on the setup screen, so a slower 🔊 Hear costs End Practice Early → Advanced → drag → restart. A −/+ pair beside `#fcSpeakBtn` writing the same slider is the torah `#ttLoopPauseBar` mirror shape; ~35 lines, 2 CSV keys, no storage. | found: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Pause the drill timer.** `startTimer()` is a bare `setInterval`, `stopTimer()` is terminal (clears AND hides `#timerDisplay`; callers: `showResults`, `returnToSetup`, `startTimer`), so an interruption inflates a tracked time or burns a limit. A pause chip on `#timerDisplay` reusing `formatTimerSecs`/`updateTimerDisplay`; ~40 lines, 2 CSV keys, transient state. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Maftir in the Reading picker.** `data/pockettorah/aliyah.json` carries a `_num:"M"` entry with `_begin`/`_end` for every parsha (210 entries verified S367) and `aliyahLookup()` keys `aliyot[num]` by the raw `_num`, so `aliyot['M']` is built on every lookup and read nowhere: `resolveRef` matches `/parsha-aliyah-(\d)/`, `refreshScopeLabels` loops 1–7 and `.filter(n …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Projector mode can't turn the translation / transliteration off.** `#ttShowTranslit` and `#ttShowTranslation` exist only inside `.tt-controls`, which `body.fullscreen .tt-controls { display:none }` removes; the drawer's Display panel (reachable via `#ttFsSettings`) carries cantillation and nikkud but not these two. Two more `.tt-fs-btn` toggles dispatching …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | hebrew_dictionary.html | **A print header — every printed page is anonymous.** No `@page` rule; the print CSS hides `header, .toolbar, .filter-chips`, the only elements naming the view, so a filtered set for a sub carries no title, date or filter. `computeActiveChips()` already returns `{key,label}` per active filter; fill a print-only header inside the existing `beforeprint` handler …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | hebrew_dictionary.html | **Saved Word List actions: Copy this list / Export to Anki / Quizlet.** `exportAnki()` / `exportQuizlet()` take no arguments and read `exportSelectedWords()` (the live bulk selection), and `copyBulkText()` reads `bulkSelected` — so a list that is already saved must be reloaded as a filter, bulk-mode enabled and select-all'd first; `wlRenderManagerInto` offers …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | hebrew_blend_generator.html | **Say how many sheets Print will produce.** `#printBtn` is `onclick="window.print()"` and no key mentions a page or sheet count, so Class Bingo (30 cards) or a 40-version Class Set goes to a shared school printer unannounced; `exportPDF` already counts `.sheet` nodes, `#printTip` is the ready host and `onGenerateSettled()` the hook (the dictionary's …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | hebrew_blend_generator.html | **A switch for the Name / Date line.** `wsMetaHTML()` hardcodes both fields in both header languages from 12 render sites, so bingo cards, caller sheets and projected reading sheets all carry "Name: ___ Date: ___". One toggle guards the single function; the wiring is `getSettings()` + `applySettings()` + `LIVE_PRESENTATION_KEYS`. ~30 lines, 2 CSV keys. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | hebrew_blend_generator.html | **"⭑ Save these as a Word List" beside the pasted-list import.** `clearCustomWordlist`'s own comment says the pasted list "lives only in memory"; `customWordlistData` appears in neither `getSettings()` nor `applySettings()` while `rwSource` does, so a preset saved in imported mode restores an empty pool. A writer into the suite key …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | classroom_dashboard.html | **"Everyone's here" — clear the class's absences in one click.** Absences toggle one chip at a time (`toggleAbsent`) into `settings.pickerSessions[id].absent`, which persists and rides presets/`.ivrit`, so Monday's absentees stay grey on Thursday; `resetPickerCycle` clears `picked` only and there is no `clearAbsences` anywhere. One `.btn-xs` in …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | classroom_dashboard.html | **"+1 min" on the running timer.** The control surface is start / pause / reset + four fixed `timerPreset(60|180|300|600)` and Custom; nothing adds to `timerRemaining` after a start, so "one more minute" restarts the clock or takes four interactions on a projected board. Reuses `timerRemaining`/`timerTotal`/`renderTimerDisplay` (+ `fsTimerStart` for the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | classroom_dashboard.html | **One-deep undo in the week editor.** `applyCalendarImport` replaces `settings.scheduleWeek` wholesale, `clearWeekDay` / `copyWeekDayToWeekdays` / `removeWeekPeriod` guard with a native `confirm()` at most, and `weekChanged()` (the choke point) saves immediately with no history. A `weekSnapshot()` at the head of the ~8 mutators + `undoWeek()` + one toolbar …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | Hebrew_Font_Maker.html | **"Only show problems" in the QA grid.** `qaRenderGrid()` paints `qaRows()` × `qaColumns(tab)` with findings marked only by a `.flag` class on cells; `qaRenderSummary()` already counts them (`fontmaker.qa.summary_needs.*`) but offers no way to act. A toggle in `#qaOverlay`'s tab bar filtering `qaCellReasons()`; ~45 lines, a field in `hebrewFontMaker_uiPrefs` if …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | Hebrew_Font_Maker.html | **Remove a project from the Recent list.** `MAX_RECENT = 6`, `pushRecentProject` evicts by `list.pop()`, and the rows in `toggleLoadMenu` are bare `loadRecentProject(i)` buttons — six experiments push the real font out of the only in-browser recovery list with no delete. Per-row 🗑 via `askModal` + `status()`, the My Fonts rows' precedent; ~35 lines, 2 CSV keys. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md] …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | classroom_dashboard.html | **A/B or rotating week cycles.** Needs a cycle dimension on `scheduleWeek` (cells per cycle-week), a "which week is it" anchor date, and cycle awareness in `computeWeekState`'s next-school-day scan — a real model change, not a sidecar. | found: 2026-08-06, weekly-grid build

## In progress

_(none)_

## Done

- [x] 2026-09-10 | (S369 close-out) | branch/deploy note | **S369 on a FRESH `claude/improve-loop-swgwqx` cut at `66dd97b` = `origin/main` (PR #228 merged); draft PR opened at close-out. Drift: none (`66dd97b`, sw v693, FM 5.39 — all as the S368 close-out recorded). sw v693→v694 (9 pages); FM NOT bumped (CSS-only floor fixes, no feature). check-i18n / check-inline-js / compact / check clean; no …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `7e5905f` | Hebrew_Font_Maker.html | **`.ctl-btn` gets `min-height:24px`: the Spacing tab's six tricky-combo chips (`padding:2px 8px`, 0.68rem) 41×22 / 37×22 → 41×24 / 37×24; every other `.ctl-btn` stays 29px (border-box) (S369, P4, `sub-floor touch target`, the S368 candidate)** | `f369/fix3b.mjs` 4 cells through the wizard + `setCatTab('spacing')`: BEFORE (stash) 6 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `869ee1c` | classroom_dashboard + flash_cards + torah_trainer + trope_tutor + hebrew_blend_generator + hebrew_dictionary | **`.font-section-hdr` 0.62 / 0.65 / 0.66 / 0.68rem (9.92–10.88px) → 0.7rem on all six font-picker carriers (S369, P4, Pass F's headline convergence, text-size floor)** | `f369/fix2.mjs` + `fix2-dict2.mjs`: 24 cells (6 pages × 1280/800 × light/dark), headers …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `ce8c9d5` | the `hebrew-keyboard CSS` + `test-phrases CSS` shared blocks (Font Maker, resources, dictionary, dashboard) | **`.hk-subhead` and `.tp-label` 0.62rem → 0.7rem on every carrier in one commit; both blocks sha-identical across carriers after (S369, P4, the S368 candidate, text-size floor)** | `f369/fix1-dict.mjs` + `fix1-res.mjs`: 8 cells (dictionary keyboard + …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S369 Pass F — cross-tool consistency, 29th run, first since S355; F was the stalest unattended pass (O attended-only) and the S369 pointer named it AND the affordance: the TEXT-SIZE FLOOR for functional labels) | all 13 pages | **Runtime census `f369/census.mjs`: every visible text node under 11px at 1280 EN light, panels/details expanded, SW blocked, foreign origins aborted, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S368 close-out) | branch/deploy note | **S368 CONTINUED `claude/awesome-bardeen-jpi6sn` → PR #228 (4 commits). LANDED: a maintainer-authorized direct push fast-forwarded S367+S368 (`0ff0989..0e5cab4`) onto `main`, PR #228 auto-merged, Pages concluded **success** on `0e5cab4` — deploy VERIFIED in-session. Drift: none (`0ff0989`, sw v692, FM 5.39). sw v692→v693 (2 pages); FM NOT …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `9fc75c7` | hebrew_blend_generator.html | **`loadPreset` shows the Quick Start "Loaded {name}" notice while live preview is armed + on — the S367 candidate's "sheet unchanged" premise REFUTED first (applySettings already re-renders; receipts in loop-findings), so the fix is the confirmation only (S368, P3)** | `c368/gen.mjs` + `gen2.mjs`: real Save/Load in EN light 1280 + HE …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `6549b60` | Hebrew_Font_Maker.html | **`.fld-help` "?" buttons: rest `--muted` on `--border` 3.36:1 light / 4.13 dark → `--text` 8.09 / 9.85; hover white on `--gold` 2.75 / 2.14 → white on `--gold-text` 6.22 light, navy on gold 6.92 dark; 0.7rem glyph (S368, P3, Pass C, `contrast-inverted-by-a-hover-or-active-state`)** | `c368/fix1.mjs` 4 cells: real-mouse hover ratios as …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S368 Pass C — accessibility, `Hebrew_Font_Maker.html`, its 4th dedicated C (S125 → S202 → S257 → S368; v5.33 → v5.39 between: partner starting fonts, meteg on the vowel line, next-unfinished jump, the slimmer footer, Send to IvritSuite). C was the stalest unattended pass (O attended-only) and the S368 pointer named it AND the tool) | Hebrew_Font_Maker.html | **Eight arms, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S367 close-out) | branch/deploy note | **PR #227 MERGED before the session → S367 ran on the FRESH designated branch `claude/awesome-bardeen-jpi6sn` cut at `0ff0989` = `origin/main`; a NEW draft PR #228 opened at close-out; a human merges + confirms Pages. Drift: none (`0ff0989`, sw v691, FM 5.39). sw v691→v692 (4 pages + locales); FM NOT bumped (a …[full text: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `33fcf13` | Hebrew_Font_Maker.html + locales | **The Export button's label follows the picked format through `fontmaker.toolbar.export_btn_fmt` (`{fmt}` = TTF / WOFF2 / TTF + WOFF2 / UFO) and `applyI18n` re-runs `onExportFormatChange` — four hardcoded English labels, and a live language switch reset the button to TTF (S367, P3, `wired-then-clobbered label`)** | `h367/fm.mjs` 4 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `5c7c796` | classroom_dashboard.html | **`loadPresets` / `loadSchedulesStorage` accept only a plain object — a stored string listed 5 phantom rows in BOTH lists, an array 2, a number left no Default preset (S367, P3, `stored-json-of-the-wrong-shape-trusted`; the S366 candidate, last carriers)** | `h367/dash.mjs` 6 shapes × 2 cells via ⚙ → Presets: the Default row only + empty …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `e529293` | hebrew_blend_generator.html | **Nine readers of `hebrewBlender_presets` go through one `readPresets()` (the flash idiom): a string listed 5 phantom rows, an array 2, null / invalid JSON left the panel blank (S367, P3, `stored-json-of-the-wrong-shape-trusted`; the S366 candidate)** | `h367/gen.mjs` 6 shapes × 2 cells: 0 presets, the empty state, `.ivrit` gather `{}`, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | `92eadd0` | trope_tutor.html | **Identify questions fall back to the full example pool once every loadable clip has failed, and an empty session stays on the start screen with the audio-unavailable toast (S367, P3, Pass H) — under blocked audio each Identify answer's silent autoplay marked a file bad, `pickExample` excluded those examples for questions that need no audio, and a …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S367 Pass H — teacher walkthrough / paper-cuts, `trope_tutor.html`, its 4th dedicated H (S87 → S140 → S228 → S367; 40 commits between: the scope select, the missed review, the Drill-tab print, the 8-sheet chart, the fullscreen idle-hide, the empty-state keys). User-directed: "scan for more microfeature seeds", so H (the seed intake) ran instead of the stalest pass C, on H's …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-10 | (S366 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `054b643`) → S366 CONTINUED `claude/inspiring-meitner-rhqskk`, 4 commits; a human merges + confirms Pages. Drift: none (`f2384a7`, sw v690, FM 5.39). sw v690→v691 (3 pages); FM untouched; sitemap moved. DoD + compact/check. Deferred: micro-feature; O; 2 gate-4; credits; teacher copy; day plates; FAQ a7.**

- [x] 2026-09-10 | `8bf361c` | hebrew_blend_generator.html | **`restoreLastSetup` drops a snapshot whose `selectedLetters` is not an array — a sanitised `__proto__` blob / hand-edited key restored an EMPTY selection and Generate built nothing (S366, P3, `stored-json-of-the-wrong-shape-trusted`)** | `i366/fix3.mjs`: 4 shapes × 2 cells → 26 defaults, key removed, sheet builds; 4 snapshot controls

- [x] 2026-09-10 | `e54dd1a` | flash_cards.html | **`readPresets` returns `{}` for any non-plain-object — a stored `null` threw in `Object.keys` and left the profile picker unrendered; a string listed its characters as presets (S366, P3, `stored-json-of-the-wrong-shape-trusted`)** | `i366/fix2.mjs`: 5 shapes × 2 cells → 0 pageerrors, empty list, picker rendered; a written preset still lists

- [x] 2026-09-10 | `b98d7ae` | classroom_dashboard.html | **Print week is disabled (+`aria-disabled`, reason title, `.btn-xs:disabled` look) on an empty week and `printWeekGrid` no-ops — a virgin week printed a sheet carrying only the "+ Add period" hint (S366, P4, Pass I)** | `i366/fix1.mjs` 8 cells: real click prints 0, +period prints 1, −period disables, language switch relabels

- [x] 2026-09-10 | (S365 close-out) | branch/deploy note | **PR #227 open (draft, clean, head `4be5b6f`) → S365 CONTINUED `claude/inspiring-meitner-rhqskk`, 4 commits; a human merges + confirms Pages. Drift: none (`f2384a7`, sw v689, FM 5.39). sw v689→v690 (3 pages); FM untouched; sitemap moved. DoD + compact/check. Deferred: micro-feature; O; 2 gate-4; credits; teacher copy; day plates; FAQ a7.**

- [x] 2026-09-10 | `772068b` | trope_tutor.html | **`renderLearn`'s empty-state line reads `trope.learn.no_example` / `trope.learn.examples_unavailable` instead of raw English (S365, P4, `authored-but-unreferenced i18n key`)** | `d365/trope.mjs` 6 cells: Geresh Muqdam's line Hebrew in HE (before English), follows a live switch both ways; index aborted → HE line on 5/5 cards + retry; gates clean

- [x] 2026-09-10 | `095bc47` | classroom_dashboard.html | **the week editor's `.swm-swatch-input` overhangs its 18px swatch by 4px → a 24×24 target, nothing visible moves (S365, P4, `sub-floor touch target`)** | `d365/fix.mjs` 8 cells by `openWeekEditor()`: input 16→24px, `elementFromPoint` at ±3px → the input (before: the chip), palette PNGs byte-identical, chip 28px + arm hit unchanged

- [x] 2026-09-10 | `d86e728` | hebrew_blend_generator.html | **`.toggle` 40×22 → 40×24, knob top 3→4 (the `f92ae1d` torah/trope step) (S365, P4, `sub-floor touch target`)** | `d365/fix.mjs` 8 cells, all panels expanded: 7/7 unscaled switches 40×24 (before 22), knob centred 4+16+4, a real edge click still flips `#answerKeyToggle`; the 3 `scale(0.75)` ones stay logged

## Metrics

### Per-session log (one line per session)

- 2026-09-10 | **S369** | iters: 1 pass (**F**) + 3 fixes = **4** (no cap-allowed 4th: text-floor at the 2/pattern cap, FM/dictionary/dashboard at the 2/tool cap, the rest gated) | tools: Font Maker + resources + dictionary + dashboard (`ce8c9d5`), the 6 font-picker carriers (`869ee1c`), Font Maker …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S368** | iters: 1 pass (**C**) + 3 fixes = **4** (no cap-allowed 4th: FM at cap, the rest gated) | tools: Font Maker (`6549b60`, `880c664`), generator (`9fc75c7`) | patterns fixed: hover-contrast ×1, text-floor ×12 sites | pass run: C (Font Maker, 4th; 2 defects + 4 candidates; 4 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S367** | iters: 1 pass (**H**, user-directed seed scan) + 4 fixes = **5** | tools: trope_tutor (`92eadd0`), generator (`e529293`), dashboard (`5c7c796`), Font Maker (`33fcf13`) | patterns fixed: wrong-shape ×2 (all carriers closed), clobbered-label ×1 | pass run: H (trope_tutor + a …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S366** | iters: 1 pass (**I**) + 3 fixes = **4** (no cap-allowed 4th) | tools: dashboard (`b98d7ae`), flash_cards (`e54dd1a`), generator (`8bf361c`) | patterns fixed: wrong-shape ×2 (NEW) | pass run: I (28th, gates clean 15th; 3 defects) | SW: v691

- 2026-09-10 | **S365** | iters: 1 pass (**D**) + 3 fixes = **4** (no cap-allowed 4th) | tools: generator (`d86e728`), dashboard (`095bc47`), trope_tutor (`772068b`) | patterns fixed: sub-floor ×2, unreferenced-key ×1 | pass run: D (trope_tutor, CLEAN, 0 defects, 1 leak read in code) | SW: v690

- 2026-09-10 | **S364** | iters: 1 pass (**G**) + 4 fixes = **5** | tools: dashboard (`eed4c03`, `0dc999c`), generator (`cabd6ca`, `b83b896`) | patterns fixed: print-hide-list ×1 (NEW), print-remap ×1, rendered-note ×1, hover-state ×1 | pass run: G (dashboard, 3 paper defects + 1 gate-2) | SW: v689

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

### Tool coverage (last-touched date per tool)

- **S369 (2026-09-10):** Hebrew_Font_Maker **2026-09-10 (`7e5905f`; C-audited S368)**; hebrew_blend_generator **2026-09-10 (`869ee1c`; H-audited S363)**; trope_tutor **2026-09-10 (`869ee1c`; H-audited S367)**; classroom_dashboard **2026-09-10 (`869ee1c`; G-audited S364)**; hebrew_dictionary **2026-09-10 (`869ee1c`; M-audited S362)**; index 2026-09-09 (S360; F-censused S369); contact / privacy / terms / 404 2026-09-09 (S360; F-censused S369); flash_cards **2026-09-10 (`869ee1c`; N-audited S361)**; resources **2026-09-10 (`ce8c9d5`; S356)**; …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S367: the 3 remaining carriers FIXED (`e529293` generator `readPresets()` over 9 sites; `5c7c796` dashboard `loadPresets` + `loadSchedulesStorage`) — all 5 known carriers closed, clean streak 0; the dictionary's …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`validation-note-stores-rendered-text`**: ACTIVE. **S364: 1 FIXED (`cabd6ca` the generator's live-preview notice — `showPreviewNotice` keeps its renderer, every site passes `() => I18n.t(…)`; the S363 H find). S357: contact `#formStatus` (`86d4307`). Hits 9 lifetime (S344 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new opener, the hub's first-erase gate `ivritAskErase` (S350) — driven by real keys: role=dialog + labelledby, focus enters, Tab ×3 wraps, Escape closes and returns …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new note helpers or `aria-disabled` writers; the torah handout's new selected-verses row hides itself when the selection empties — hits 0, clean streak 1.** S343 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`uncompressed-jspdf-raster`**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): 0 new `addImage(` sites; 3/3 carry `'FAST'` — hits 0, clean streak 2.** Registered S337 Pass G; S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Definition: a jsPDF `addImage(...)` with no …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED — never retires). **S358: the ENUM-STRING shape CLOSED on its last sites — the dictionary's `copyMode` (radio match) + `shoreshRoot` (string only), `a2eddd9`; S356–S357 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE — **REGISTERED S363 (Pass H): a Save-by-typed-name that replaces an existing preset with no confirm, while the row's own ↺ button confirms. 2 carriers, both FIXED in-session: generator `savePreset` (`a0ec809`), dashboard …[full text: IMPROVEMENT_ARCHIVE.md]

- **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE — **REGISTERED S364 (Pass G): a `position:fixed` surface added after a page's `@media print` hide list was written, so it prints over the sheet when open (the dashboard's presenter blackout `0f9272e` and its in-place …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S364: 1 FIXED (`b83b896` the generator's bingo ▲/▼ stepper → `.bingo-step`; real mouse 0/8 → 8/8). S362 FM custom-glyph ✕/↔ (`26fd826`); the generator header trio REFUTED (S362). Open: none known — the next A sweeps the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **ONE MORE ARTIFACT at 2026-09-08 (S343 Pass A), caught before a verdict: the first dashboard alert census reported `clicked=1` of 254 — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S369: the `.ctl-btn` pair FIXED (`7e5905f`, `min-height:24px` on the class; 6 chips 22→24, the rest unchanged). S368 (Pass C, Font Maker census): 2 NEW carriers logged (`.ctl-btn` 41×22 / 37×22 on the Spacing tab — cap-blocked), …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **contrast-inverted-by-a-hover-or-active-state**: **S368 (Pass C, Font Maker at RUNTIME, 26/23 controls × 2 themes, real mouse + 420 ms): 1 hit FIXED (`6549b60` `.fld-help` hover 2.75 / 2.14 → 6.22 / 6.92:1); the disabled undo/redo pair (opacity 0.45) is exempt — inactive …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **wired-then-clobbered label** **S367: +1 carrier FIXED `33fcf13` — the Font Maker's `#exportBtn` (`data-i18n` TTF label) overwritten by `onExportFormatChange`'s four English literals; now one `{fmt}` key + an `applyI18n` re-run. Clean streak 0 — ACTIVE.** (registered S192): …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S365: 1 hit FIXED (`772068b`, `trope.learn.no_example` + `trope.learn.examples_unavailable` — `renderLearn` passed the raw English; Geresh Muqdam has no chanted example, so the Hebrew UI …[full text: IMPROVEMENT_ARCHIVE.md]

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

- C accessibility (one tool): 2026-09-10 (**S368 — `Hebrew_Font_Maker.html`, its 4th dedicated C (S125 → S202 → S257 → S368; v5.33 → v5.39 between). C was the stalest unattended pass (O attended-only) and the pointer named it AND the tool (FM S257 < the rest). 8 controlled arms, EN light 1280 + HE dark 800, in through the wizard: names / Tab walk / modals / reduced motion CLEAN; 2 defects FIXED …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-09 (**S357 — A was the stalest pass and the S357 pointer named it AND its two lead arms; 20 arms over `e0a94d9..9263d9a` (52 commits, 27 files), every runtime arm controlled. 3 hits, all fixed in-session (36 enum sites on 2 pages; the hub's 4 hover-less erase buttons; contact's status note), 2 sub-floor carriers + the `.ivrit` engine's hover-less Merge row …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-10 (**S364 — `classroom_dashboard.html`, its 2nd dedicated G (S231 → S364, ~133 sessions; 78 commits on the file between — the blackout, the in-place editor, the roster keyboard, the week-editor menu, the calendar import). G was the stalest unattended pass (O attended-only) and the pointer named it AND the tool, from the S351 row's ordering. Arms …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-10 (**S365 — `trope_tutor.html`, its 4th dedicated D (S95 → S138 → S232 → S365; 47 commits on the file between: the print chart + its 8-sheet CSS, the drawer resize block, the fullscreen idle-hide, the retry path, the roving tabs). D was the stalest unattended pass (O attended-only) and the pointer named it AND the tool from the S352 row's ordering. CLEAN — 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-10 (**S366 — 28th run, its first since S353 (13 sessions); I was the stalest unattended pass (O attended-only) and the S366 pointer named it AND the S353–S365 surfaces. Mechanical gates clean a FIFTEENTH consecutive run:** 26 virgin loads (13 pages × EN/HE, a new context per load = empty localStorage AND IndexedDB, SW blocked, foreign origins aborted; …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-09 (**S356 — 28th run, its first since S342 (14 sessions); B was the stalest pass and the S356 pointer named it. Five arms, every probe controlled: (1) 56 loads (14 pages × 1280/390 × light/dark): 0 pageerrors, 0 non-noise console lines, 0 failed same-origin requests (an injected throw + 404 control counted); (2) 13 pages × light/dark real-click interactions clean …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-09 (**S359 — 17th run, first since S345 (14 sessions); stalest unattended pass, pointer-named. Byte-check vs `aebb86b` (S345→S358): 11/14 files moved, 0/14 crawler surfaces moved (title, description, canonical, OG/Twitter, JSON-LD, h1, FAQ summary TEXT). Mechanical 14/14 clean, every detector fired by a mutated-copy control; sitemap lastmod = git 12/12; 7 …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-10 (**S367 — `trope_tutor.html`, its 4th dedicated H (S87 → S140 → S228 → S367). USER-DIRECTED ("scan for more microfeature seeds"): H ran instead of the stalest pass C, on H's stalest tool, plus a grep-grounded seed scan of the other six tools. Class-unit scenario, EN light 1280 + HE dark 800, real clicks, 0 pageerrors: 1 P3 defect FIXED …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-09 (**S358 — 29th run, first since S344 (14 sessions); stalest pass, pointer-named. Delta `ab79059..b418cf9` (57 commits, 27 files). 16 arms, 14 clean, 2 doc drifts FIXED: `shared-components.md` §5 (contact renderer, hub erase dialog) → `a0e51f1`; `storage-and-backup.md` + `generator.md` (value-level restore guards) → `c32ef93`. Clean receipts (precache, refs, …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-10 (**S369 — 29th run, first since S355 (14 sessions); F was the stalest unattended pass (O attended-only) and the S369 pointer named it AND the affordance: the TEXT-SIZE FLOOR for functional labels.** Runtime census of every visible sub-11px text node on all 13 pages (1280 EN light, panels expanded, 13/13 injected 9px controls fired, 0 pageerrors): 49 groups …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S370):** **BRANCH/PR: S369 ran on `claude/improve-loop-swgwqx` (cut at `66dd97b` = `origin/main`, 4 commits) → a draft PR opened at close-out. If it is still OPEN and unmerged, continue on it; if MERGED, cut a fresh `claude/*` off latest `origin/main` — never stack on merged history. Verify via the API** (0 check runs is correct — no workflows). **⚑ DRIFT CHECK: compare `origin/main` against `66dd97b`; anything beyond THIS loop's 4 commits (+ the ledger commit) is an outside-loop landing. `sw.js` v694, `FONT_MAKER_VERSION` 5.39** — re-read both.

**⚑ STALEST PASS: O (S346, attended-only — unattended skips it), B (S356), A (S357), E (S358), L (S359), K (S360), N (S361), M (S362), G (S364), D (S365), I (S366), H (S367), C (S368), F (S369).** Unattended: take B (console & error audit) over the S356–S369 delta — 14 sessions of landings: the generator's `readPresets()`/Load-preset notice, the dashboard's `loadPresets`/`loadSchedulesStorage` guards, the Font Maker's `.fld-help`/floor CSS, the S369 floor commits; then A. **O next `torah_trainer.html`; D next dictionary (S253); G next dictionary (S252); H next Font Maker (S241); N next resources (S246); M next trope_tutor (S245); C next flash_cards (S271); F next the disabled-control look; the next I re-runs `i366/{gates,arms,corrupt,strshape}.mjs` and weights the S366–S369 fixes.**

**⚑ Harness (standing): torah stubs Sefaria by fulfilling `**/*sefaria.org/**` (`b356/harness.mjs`); hidden toggle inputs → click `label.toggle:has(#id)`; the HTTP server dies across a compaction — curl it first; the paper/PDF harness notes (pypdf stub, `afterprint`, no PyMuPDF) live in the S368 handoff in the archive; a hover read needs a REAL `page.mouse.move` + 400 ms, a focus read a real Tab (never `page.focus()`); open a probe's host by ITS path (dashboard: `openWeekEditor()`, dismiss `#frBackdrop` via `frSkip()`, expand collapsed panels by `.panel-title`; the generator's live-preview toggle is in the collapsed Advanced panel, presets CARRY `livePreview`, and `applySettings` rebuilds `#letterGrid` — re-query tile handles; FM: enter the workspace through the wizard (`#wizName`/`#wizAuthor` → `#wizNext` ×2 → `wizardCreate()`), Save Project ▾ = `[data-i18n="fontmaker.toolbar.save_project_menu"]`, the Spacing panel = `setCatTab('spacing')` + drop `.collapsed` on `.cat-panel[data-cat="spacing"]`; the dictionary's collapsed bodies are `display:none !important` — open them with a REAL click on the Expand-all-menus button, not an inline style); an `elementFromPoint` receipt precedes a real click; modal probes read the LAST `[aria-modal]` whose computed `display` is not none; a `let` page global is not on `window` but IS reachable by bare name in `page.evaluate`; probe screenshot paths are cwd-relative (run from the scratchpad).**

**⚑ TOP UNGATED CANDIDATES (S369):** the Beta badge convergence (5 pages, 4 sizes → one `.beta-tag` at 0.7rem; a 5-page idiom change, so take it as ONE commit when the tool caps allow); the flash letter-tile names 9.28 → 9.92 (re-run the S327 tile arithmetic first); the per-page sub-11px batches (resources ×45, dictionary ×21, generator, flash, privacy — `f369/census-en.txt`); the ~30 inline Font Maker hints under 11px (one batch); the tour-card h4 → h2 ×7 (not small); the remaining sub-floor M calls (the generator's 33 `scale(0.75)` sub-option toggles, gate 3; the bingo ▲/▼ stepper; FM `#rulerCorner`). Gate 2: the printed teacher-copy wording under a Hebrew header; the board's day plates under backgrounds-on (`g364/out/board-print-en-dark.png`); the trope FAQ a7 copy. Gate 3/M: the Font Maker stage annotations. Gate 4 (attended only): the flash-card sticky-bar and landscape-card proposals (`n361/`). The 5 torah/trope credit rows: wire-or-prune. The next A sweeps the S357–S369 delta with the print-hide-list arm, the wrong-shape arm, a `wired-then-clobbered label` re-sweep, and the sub-floor arm measured pseudo-aware; the next K greps every authored key literally. **Seed bench: 25 (unchanged; F is not an intake). Gate 1 next attended session: the trope "drill the marks I missed" and the three dual-audience S seeds first.**
