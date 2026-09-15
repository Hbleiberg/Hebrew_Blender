# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S382 Pass P census — a JUDGEMENT call, not the same defect: these are action toolbars, not homogeneous selection grids, and one stop per button is defensible**) | classroom_dashboard.html + torah_trainer.html | **`.fs-strip-btn` ×6, `.timer-preset-btn` ×5, `drawerToolbar .ed-btn` ×9; torah `.tt-fs-btn` ×6, `#ttTropeLegend .tt-trope-chip` ×6.** ARIA APG would rove a toolbar; the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S382 Pass P arm 4 — the sibling of the shipped `a44a181`, deliberately NOT changed**) | hebrew_blend_generator.html | **`restoreLastSetup()` drops a corrupt snapshot (`!Array.isArray(saved.selectedLetters)`) with `removeItem(LAST_SETUP_KEY)` and no `forgetRow`, so that row also reads "Deleted on this device".** Forgetting it would offer to download the same bad row back, so the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S380 Pass H — dead copy or a hint-logic choice; the copy half is gate 2**) | Hebrew_Font_Maker.html | **`nexthint_nikkud` ("Letters done! Place nikkud on {name} — {count} to go.") and the `export_nikkud_*` guard can never fire in the trace flow: `finalizeWithOutline` seeds `l.anchors` on every trace, so `coreLetterStats().unanchored` is always empty and the hint jumps from the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S377 Pass G — a CONTENT question (gate 2), so logged not shipped; if stray, one regex over `data/hebrew_words.json` + `?v=6→7` on the three fetching pages**) | data/hebrew_words.json | **Phrase entries carry a prefix or the definite article as its own space-separated token — "עָלָיו הַ שָּׁלוֹם", "הָ עוֹלָם הַ בָּא", "בְּ רוּחַ הַ זְּמַן", "חֶבֶל הַ טַּבּוּר" — and that spacing …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S378 Pass D — GATE 2: a drag-behaviour choice, deferred unattended; numbers in loop-findings**) | hebrew_dictionary.html | **The sidebar seam drag relays out every visible word card per pointer move: 40 real moves = 40 tasks of 107–139ms @4× at the default 100 cards (max 204), 238ms avg at 400 cards; 0 longtasks @1× at 100 cards.** The S325 scoping holds (one `aside@style` write …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S378 Pass D — GATE 2: a preview-size choice, deferred unattended**) | hebrew_dictionary.html | **"Select all matching" on the unfiltered corpus is a 339 + 274ms block @1× (1.7s @4×) and only 27ms of it is JS: the browser lays out the 13,081-line bulk textarea.** Proposal: cap the textarea preview (first 500 lines + "…and N more") while copy/export keep the full set. | found S378

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

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md] …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | classroom_dashboard.html | **A/B or rotating week cycles.** Needs a cycle dimension on `scheduleWeek` (cells per cycle-week), a "which week is it" anchor date, and cycle awareness in `computeWeekState`'s next-school-day scan — a real model change, not a sidecar. | found: 2026-08-06, weekly-grid build

## In progress

_(none)_

## Done

- [x] 2026-09-15 | (S387 close-out) | branch/deploy note | **S387 CONTINUED `claude/wizardly-tesla-xu0ikd` (PR #242 open, unmerged; base `4d6c02d` = `origin/main`), 3 fix commits + this close-out on top of S382–S386's 22; a human merges and confirms the Pages run.** Drift: **none** — `origin/main` still `4d6c02d` with nothing on it this branch lacks, `sw.js` v753, FM 5.44, migrations 0001–0003 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `68552b3` | classroom_dashboard.html | **A wrong-shaped video URL no longer blanks the board: `extractYouTubeId` called `url.match()` behind a bare truthiness guard, so `[]` and `{}` — truthy objects with no `.match` — threw, and because the import had already written the value to storage the throw repeated on every later load (S387, P3, the sibling `9614a80`'s own sweep never …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `831b414` | hebrew_dictionary.html | **The word-list controls stop hand-rolling the locked look — `#wlSaveBtn` kept `cursor:pointer` and still took `.pos-all-btn:hover`'s gold while disabled (the pattern's 8th carrier, invisible to the S383 census because the page declares no `:disabled` rule to grep), and the `↑`/`↓` sat at `opacity:0.3`, below the suite's 0.35 floor (S387, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `f77b6da` | trope_tutor.html + sw.js | **The last two locked buttons stop lighting up, closing `hover-feedback-survives-the-disabled-state` at 7 of 7 carriers: `#drillStartBtn` (`.btn-lg`, `aria-disabled`) and `#tuRetryBtn` (`.btn-secondary`, native `disabled` — and not dimmed at all, because `.btn`'s dim keyed only off `aria-disabled`) (S387, P3, the top ungated candidate)** | …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | pass | repo-wide | **S387 Pass L (SEO & discoverability), the 19th L and the first since S373 (13 sessions); L was the stalest unattended pass (O attended-only) and the S387 pointer named it. L's FIRST sight of the accounts landing — `account.html` as a 13th indexable page, with `account-test.html`/`saves-test.html` as `noindex` harnesses. 14 mechanical arms over the static …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | (S386 close-out) | branch/deploy note | **S386 CONTINUED `claude/wizardly-tesla-xu0ikd` (PR #242 open, unmerged; base `4d6c02d` = `origin/main`), 4 fix commits + this close-out on top of S382+S383+S384+S385’s 13; a human merges and confirms the Pages run.** Drift: **none** — `origin/main` still `4d6c02d` with nothing on it this branch lacks, `sw.js` v752, FM 5.44, migrations …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `e89e6dd` | sitemap.xml | **Two `lastmod` dates catch up with the pages they describe: `resources.html` said 2026-09-13 and `contact.html` 2026-09-14, both last touched on the 15th by `df9ff3b` — the same loop-branch drift the 30th E found and the same one-command fix (S386, P4, pass E)** | `scripts/update-sitemap.mjs`, then the arm re-run: 13 entries, 0 stale, a second …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `fba22e1` | account.html + sw.js | **A locked button stops lighting up, the delete button included: `#dlBtn`, `#delGo` (`class="btn danger"`, the DESTRUCTIVE one) and `#delCancel` all key off `aria-disabled` and all three dimmed without cancelling `:hover`, so each lit under a cursor already shaped "you cannot click this" (S386, P3, opportunistic — the top ungated candidate, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | pass | repo-wide | **S386 Pass E (freshness & site health), the 31st E and the first since S372 (13 sessions); E was the stalest unattended pass (O attended-only) and the S386 pointer named it. The delta is the largest E has faced — `408dbe4..HEAD`, 146 commits, 65 files, 26,576 insertions — and E’s FIRST sight of the accounts layer, `db/`, `partners/`, the 7 backend smokes and …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | (S385 close-out) | branch/deploy note | **S385 CONTINUED `claude/wizardly-tesla-xu0ikd` (PR #242 open, unmerged; base `4d6c02d` = `origin/main`), 3 fix commits + this close-out on top of S382+S383+S384's 10; a human merges and confirms the Pages run.** Drift: **none** — `origin/main` still `4d6c02d`, `sw.js` v751, FM 5.44, migrations 0001–0003 all `Live? = yes`, exactly as S384 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `902d3ff` | classroom_dashboard.html | **The board's columns stop printing a grey band down each edge: the print block's shadow reset was scoped to `body.dark`, where it rode in beside the literal dark slab, so the light theme's `rgba(26,39,68,.05)` column shadow reached paper unopposed across 477k + 151k + 47k px² (S385, P4, pass A, `dark-print-shadow-slab`)** | …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | pass | suite-wide | **S385 Pass A (recurring-pattern sweep), the 31st A and the first since S371 (13 sessions); A was the stalest unattended pass (O attended-only) and the S385 pointer named it AND the rows to add. The delta is the largest A has ever faced — `1d4c9cf..HEAD`, 147 commits, 65 files, 26,198 insertions, the WHOLE accounts layer (4 `js/` modules, `account.html`, 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | (S384 close-out) | branch/deploy note | **S384 CONTINUED `claude/wizardly-tesla-xu0ikd` (PR #242 open, unmerged; base `4d6c02d` = `origin/main`), 3 fix commits + this close-out on top of S382+S383's 7; a human merges and confirms the Pages run.** Drift: **none** — `origin/main` still `4d6c02d`, `sw.js` v750, FM 5.44, migrations 0001–0003 all `Live? = yes`, exactly as S383 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `df9ff3b` | contact.html + resources.html | **A locked submit button stops inviting the click: both pages dim the primary button while disabled but left `:hover` — and contact's `:active` press dip — unguarded (S384, P3, pass B, carriers 2–3 of the S383 census, `hover-feedback-survives-the-disabled-state`)** | `b384/verify2.mjs` 8 cells (2 pages × light/dark × 1280/800), each …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | `a585608` | Hebrew_Font_Maker.html | **A disabled control stops lighting up under the cursor: `.ctl-btn:disabled` dims to 0.4/`cursor:default` but both `:hover` rules were unguarded, so undo, redo, the node-bar twins and the mark-editor pair — which ship disabled — kept lighting up (S384, P3, pass B, carrier 1 of 5, `hover-feedback-survives-the-disabled-state`)** | …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-15 | (S383 close-out) | branch/deploy note | **S383 CONTINUED `claude/wizardly-tesla-xu0ikd` (PR #242 open, unmerged; base `4d6c02d` = `origin/main`), 3 fix commits + this close-out on top of S382's 4; a human merges and confirms the Pages run.** Drift: **none** — `origin/main` still `4d6c02d`, `sw.js` v749, FM 5.44, migrations 0001–0003 all `Live? = yes`, exactly as S382 recorded …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

- 2026-09-15 | **S387** | iters: 1 pass (**L**) + the `.ivrit` junk-shape sweep + 3 fixes = **5** (full budget) | tools: trope_tutor (`f77b6da`), hebrew_dictionary (`831b414`), classroom_dashboard (`68552b3`) | patterns fixed: hover-feedback-survives-the-disabled-state ×2 (its session cap; carrier …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S386** | iters: 1 pass (**E**) + 4 fixes = **5** (full budget) | tools: account (`fba22e1`), THIRD_PARTY_LICENSES (`e65f7e5`), README (`ad6bcd8`), sitemap (`e89e6dd`) | patterns fixed: hover-feedback-survives-the-disabled-state ×1 (3 controls, carrier 4 of 7) | pass run: E (31st; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S385** | iters: 1 pass (**A**) + 3 fixes = **4** (the 5th unspent: `dark-print-shadow-slab` hit its 2-per-session cap and every other arm came back clean or non-actionable) | tools: hebrew_blend_generator (`0a46f67`), trope_tutor (`7be7591`), classroom_dashboard (`902d3ff`) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S384** | iters: 1 pass (**B**) + 3 fixes = **4** (the hover-vs-disabled class hit its 2-per-session cap; every other open candidate is gated or P4) | tools: classroom_dashboard (`9614a80`), Hebrew_Font_Maker (`a585608`), contact + resources (`df9ff3b`) | patterns fixed: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S383** | iters: 1 pass (**F**) + 3 fixes = **4** (the new hover-vs-disabled class hit its 2-per-session cap, and flash_cards + hebrew_dictionary both hit their 2-per-tool cap, so no cap-allowed 4th) | tools: flash_cards (`a234f9f`), the two shared account modules = every page with …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S382** | iters: 1 pass (**P**) + 3 fixes = **4** (both touched tools at their 2-per-tool cap and the tile-grid class at its 2-per-session cap; every other open candidate is gated) | tools: hebrew_blend_generator ×2 (`a44a181`, `b5f06f5`), flash_cards ×2 (`b5f06f5`, `b86faca`) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S381** | iters: 1 pass (**C**) + 3 fixes = **4** (keyboard-efficiency pattern at its 2-per-session cap; no other ungated small candidate open) | tools: Hebrew_Font_Maker (`e100574`), flash_cards (`daab7b2`), hebrew_blend_generator (`516a105`) | patterns fixed: one-Tab-stop tile …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S380** | iters: 1 pass (**H**) + 2 fixes = **3** (Font Maker at its 2-per-tool cap; no ungated non-FM small candidate open) | tools: Hebrew_Font_Maker ×2 (`df8786a`, `e71ec09`) | patterns fixed: — | pass run: H (Font Maker, 4th dedicated; 2 P3 fixed, 1 P2 + 1 P4 logged, 1 seed; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S379** | iters: 1 pass (**I**) + 4 fixes = **5** (full budget) | tools: index + generator + flash + dashboard (`4f9a2e7`), generator + dictionary + torah + trope (`f4a102d`), Hebrew_Font_Maker (`0346a0b`), classroom_dashboard (`de49066`) | patterns fixed: …[full text: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S378** | iters: 1 pass (**D**) + 4 fixes = **5** (full budget) | tools: dictionary ×2 (`595ffca`, `589a723`), classroom_dashboard (`e452c8f`), torah + trope + dashboard (`20baafc`) | patterns fixed: logical-CSS ×1 | pass run: D (dictionary, 2nd dedicated; 2 hits fixed, 3 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S377** | iters: 1 pass (**G**) + 4 fixes = **5** (full budget) | tools: dictionary ×2 (`eb3e6ad`, `a92d135`), flash_cards (`82bbf4c`), Hebrew_Font_Maker (`24a4c91`) | patterns fixed: vh-capped-sheet-without-dvh-twin ×2 (7 sites → 0 open), dark-print-shadow-slab ×1 | pass run: G …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S376** | iters: 1 pass (**M**) + 4 fixes = **5** (full budget) | tools: trope ×2 (`9f19a0d`, `16f2d18`), dictionary (`7f55878`), dashboard (`d1f04d2`) | patterns fixed: vh-capped-sheet-without-dvh-twin ×2, text-size floor ×1, logical-CSS ×1 | pass run: M (16th; trope_tutor, 64 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S375** | iters: 1 pass (**N**) + 4 fixes = **5** (full budget) | tools: resources (`b1c0655`), privacy (`f8f23e0`), generator (`5dfae78`), flash (`c5a491e`) | patterns fixed: vh-capped-sheet-without-dvh-twin ×1 (registered), text-size floor ×3 | pass run: N (16th; resources, 16 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S374** | iters: 1 pass (**K**) + 4 fixes = **5** (full budget) | tools: torah (`31a84f7`), trope (`5d1d13a`), resources (`f4b3326`), dictionary (`1de1ee8`) | patterns fixed: non-finite-number-from-a-loaded-file ×2 (4 fields) | pass run: K (25th; 4 gates clean 18th consecutive; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S373** | iters: 1 pass (**L**) + 4 fixes = **5** (full budget) | tools: dashboard (`c365786`), Font Maker (`9257fb8`), trope (`d5285f6`), flash (`5fd4bc1`) | patterns fixed: control-class-without-hover ×1, sub-floor touch target ×1, fixed-surface-print-hide ×1 | pass run: L (18th; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S372** | iters: 1 pass (**E**) + 4 fixes = **5** (full budget) | tools: sitemap (`919f478`), Font Maker (`dcfb085`), docs/reference ×5 files (`21ea7dc`, `c2b3b10`) | patterns fixed: stored-json-wrong-shape ×1 (FM recents) | pass run: E (30th; 17 arms, 15 clean, 2 drifts + 1 rule …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S371** | iters: 1 pass (**A**) + 4 fixes = **5** (full budget) | tools: dashboard (`b85b579`, `1568296`), dictionary (`e5dac20`), generator + locales (`e4c8d75`) | patterns fixed: save-over-name ×1, apply-settings ×2 (13 setter sites), wired-then-clobbered ×1 | pass run: A (30th; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S370** | iters: 1 pass (**B**) + 4 fixes = **5** (full budget) | tools: Font Maker (`df7f98e`), generator (`70f62c0`, `edf4b2e`), index + dashboard + flash + dictionary (`edf4b2e`), flash (`966179f`) | patterns fixed: stored-json-wrong-shape ×1 (FM project file), apply-settings ×1 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S369** | iters: 1 pass (**F**) + 3 fixes = **4** (no cap-allowed 4th: text-floor at the 2/pattern cap, FM/dictionary/dashboard at the 2/tool cap, the rest gated) | tools: Font Maker + resources + dictionary + dashboard (`ce8c9d5`), the 6 font-picker carriers (`869ee1c`), Font Maker …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S368** | iters: 1 pass (**C**) + 3 fixes = **4** (no cap-allowed 4th: FM at cap, the rest gated) | tools: Font Maker (`6549b60`, `880c664`), generator (`9fc75c7`) | patterns fixed: hover-contrast ×1, text-floor ×12 sites | pass run: C (Font Maker, 4th; 2 defects + 4 candidates; 4 …[full text: IMPROVEMENT_ARCHIVE.md]

### Tool coverage (last-touched date per tool)

- **S387 (2026-09-15):** trope_tutor **2026-09-15 (`f77b6da`; L S387 suite-wide, M-audited S376)**; hebrew_dictionary **2026-09-15 (`831b414`; G S377 + D S378)**; classroom_dashboard **2026-09-15 (`68552b3`; A S385 + B S384, **H stalest since S46**)**; account 2026-09-15 (`fba22e1`; **L-audited S387, its first**; E S386, P S382); repo metadata — README, THIRD_PARTY_LICENSES, sitemap 2026-09-15 (E S386); hebrew_blend_generator 2026-09-15 (`0a46f67`; A S385, P S382); Hebrew_Font_Maker 2026-09-15 (`a585608`; B S384, H S380); contact + resources …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F — 7 carriers found, **all 7 now closed, plus an 8th the census could not see**): ACTIVE. **S387 (Pass L session, ×2 — the class's cap): carrier 7 FIXED (`f77b6da`) and it was TWO controls …[full text: IMPROVEMENT_ARCHIVE.md]

- **`synced-key-wiped-without-forgetRow`** (**NEW, registered 2026-09-15 (S382 Pass P arm 4) — 1 carrier found and fixed**): ACTIVE, consequence-critical (it turns a local reset into an account-wide deletion offer), so it never retires on streak. **S382: 1 FIXED (`a44a181`, the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S379: a SCALAR sibling FIXED (`4f9a2e7`, the shared `.ivrit` engine's `setIvritMode` normalises an unknown stored mode on 4 carriers; the hub's AllTools import validates it); the I corrupt-key arm (52 cells + 8 controls) …[full text: IMPROVEMENT_ARCHIVE.md]

- **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED, so every later load rethrows — never retires). **S387: the axis swept to completion across ALL FOUR `.ivrit` engine carriers — 254 cells through the real restore path …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S373: the S371 twin divergence FIXED (`d5285f6`, trope `.settings-modal, .settings-backdrop`). Registered S364; hits 3 (S364 ×2 `eed4c03`, S371 ×1), clean streak 0; last swept S371.** Detection: every …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **THREE MORE ARTIFACTS at 2026-09-15 (S385 Pass A), all caught before a verdict, and two of them false POSITIVES rather than false cleans — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S381 Pass C re-swept `flash_cards.html` pseudo-aware (setup expanded + card + listening + results + 7 dialogs + sheet menu + Move ▾ menu, both themes): 0 hits — the only sub-24 box is an inline footer credit link (13px tall, inline text, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**NEW, registered AND CLOSED 2026-08-29 (S291 iters 2+4) — 2 carriers found, both fixed, suite census clean**): a rule paints text with a token whose value is tuned for the OTHER theme's ground, so it is correct in one mode and …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S374: the 4 S371 carriers FIXED (`31a84f7` torah `karaokeRate`/`ttsRate`; `5d1d13a` trope `hebFontSize`/`playbackRate`) via `_sliderNum` at `loadSettings`; open hits 0, clean streak 0.** Shape: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **row-siblings-with-mismatched-heights**: ACTIVE. **S385 (Pass A): 1 hit FIXED — `hebrew_blend_generator.html`'s account chip (`0a46f67`) stood 41px at top 14 beside five 35px controls at top 17, because `.ivacct` carries `align-self:stretch` and that header's flex line is its …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **wired-then-clobbered label** **S371 (Pass A): +1 carrier FIXED `e4c8d75` — the generator's `#headerSub` (`data-i18n` page subtitle) overwritten by `setBlendType`'s four English literals on every practice-type click; now four CSV keys. Static census: 6 `data-i18n` ids written …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **`browser-locale-date-in-a-localized-sentence`** **S371 (Pass A): 0 `toLocale(Date|Time)String(undefined` in the corpus — hits 0, clean streak 1.** (`toLocaleDateString(undefined, …)` inside a translated sentence or row): **all 3 carriers FIXED — hub `f8b716b`, flash …[full …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **`uncompressed-jspdf-raster`**: RETIRED 2026-09-10 (S371 Pass A, clean streak 3: S343, S357, S371 — 0 new `addImage(` sites, 3/3 carry `'FAST'`). Shape: a jsPDF `addImage(...)` with no `compression` argument stores the raster raw (~11 MB per Letter page); S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Detection: `grep -n "addImage(" *.html` and read the argument list; verify by the PDF's `FlateDecode` streams. Un-retires on any new `addImage(` without `'FAST'` (A2 spot-check).

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

- P accounts & cloud (one surface): 2026-09-15 (**S382 — registered THIS session: the skill defines P but the rotation table had no row and no ledgered removal or SKIP, so it was a never-run pass and therefore the stalest. FIRST EVER RUN, and the right one — the drift check found `sw.js` v706→v748, FM 5.39→5.44 and Accounts phases 9–10 landed outside the loop, which is P's surface and no other …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html` (the pointer's named surface; its first whole-page O), ATTENDED and the stalest pass, so direction and staleness agreed. Detector: Impeccable JS 4.1.3 from the `skill-v4.1.3` tag — upstream HEAD (4.2.2) is now a Rust engine binary the sandbox cannot download; static arm NOT degraded (20), browser arm …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-11 (**S375 — 16th N, `resources.html`, its 2nd (S246 → S375). 4 real descriptors (SE 320, i13 390 + landscape, Pixel 7 412), 16 cells × 6 views, real taps (chips, view toggle, Preview, keyboard key, chevrons, pill, FAQ): 0 overflow, both sheets fit, × hit-testable, 0 pageerrors. Arms 1/2/4/5/6/7 clean (4× CPU load 370ms). Arm 3: 1 HIT FIXED — …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-11 (**S376 — 16th-ever M, `trope_tutor.html`, its 2nd (S245 → S376); stalest unattended pass. 8 cells (EN/HE × light/dark × 1280/800) × 8 views (learn, chip, drill start/question/results, drawer, tour, FAQ): 0 pageerrors, 0 overflow, alpha-composited contrast 0 hits (the S245 arm corrected), dark parity by design. 2 hits FIXED: `.tu-rare-tag` …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-11 (**S374 — 25th run, first since S360 (14 sessions); stalest unattended pass (O attended-only), pointer-named. 4 gates clean (18th consecutive; 5144 keys, build-locales diff-clean). Static delta `b418cf9..4a1f186` (S357→S373: 13 pages, +421 = 180 live script + 68 comment + 22 markup + 143 style): 1 raw → 0 real (FM `_pT('metric_hint', fallback)`, the S289 …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-11 (**S381 — `flash_cards.html`, its 5th dedicated C (S167 → S271 → S381; 46 commits to the file between). Stalest unattended pass (O attended-only), pointer-named tool. 16 arms, EN light 1280 + HE dark 800, every cell with an injected-throw control counted: names 173/173, 24px floor 0 hits, contrast 0 hits in both themes across setup/card/listening/results/7 …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-15 (**S385 — 31st A, first since S371 (13 sessions); A was the stalest unattended pass (O attended-only) and the S385 pointer named it AND the rows to add. Delta `1d4c9cf..HEAD`: 147 commits, 65 files, 26,198 insertions — the largest A has faced, and the accounts layer's FIRST A (4 `js/` modules, `account.html`, 2 test harnesses). 13 static + 6 runtime arms, …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-11 (**S377 — `hebrew_dictionary.html`, its 2nd G since S252 (57 commits between). Stalest unattended pass (O attended-only), pointer-named tool. 27 real-PDF cells + a 6-stage export arm: 4 hits ALL FIXED in 2 commits (`eb3e6ad` trailing blank sheet; `a92d135` 🔊/bulk-box/Exit hide-list omissions + the hover halo, `dark-print-shadow-slab` 3rd …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-11 (**S378 — `hebrew_dictionary.html`, its 2nd dedicated D (S253 → S378; 60 commits between); stalest unattended pass, pointer-named tool. `d378/` harness (longtask/mutation counters, CDP 1×/4× + profiler, a 300ms click control). COLD @1× clean; @4× 3–4 blocks of 200–310ms and the grid rendered TWICE per boot — FIXED `595ffca`. 40 real-input arms: a filter …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-11 (**S379 — 29th run, first since S366 (13 sessions); stalest unattended pass (O attended-only), pointer-named. Mechanical gates clean a SIXTEENTH consecutive run:** 26 virgin cells (`i379/gates.mjs`; 13 pages × EN/HE, a new context per load = empty localStorage AND IndexedDB, SW blocked, foreign origins aborted) → 0 pageerrors / 0 same-origin failures / 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-15 (**S384 — 30th run, first since S370 (14 sessions); B was the stalest unattended pass (O attended-only) and the S384 pointer named it. The delta it finally saw is the largest B has ever faced — 145 commits, 65 files, the WHOLE accounts layer, `account.html` and the two new test harnesses, none of which any prior B had loaded. Arms 1/2/4/5, every probe …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-15 (**S387 — 19th run, first since S373 (13 sessions); L was the stalest unattended pass (O attended-only) and the S387 pointer named it. **L's FIRST sight of the accounts landing:** `account.html` as a 13th indexable page, `account-test.html`/`saves-test.html` as `noindex` harnesses. **14 mechanical arms, 0 HITS — and the zero is measured: 17 planted …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-11 (**S380 — `Hebrew_Font_Maker.html`, its 4th dedicated H (S97 → S163 → S241 → S380; v5.1 → 5.39 between); stalest unattended pass (O attended-only), pointer-named tool. Lesson "one photo per letter → class font → Generator worksheet", EN light 1280 + HE dark 800, 171 real clicks, engine served from a local npm mirror so the export was …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-15 (**S386 — 31st run, first since S372 (13 sessions); stalest unattended pass (O attended-only), pointer-named. Delta `408dbe4..HEAD` (S371→S385): 146 commits, 65 files, 26,576 insertions — the largest E has faced, and E’s FIRST sight of the accounts layer, `db/`, `partners/`, the 7 backend smokes and the 2 authored workflows. **19 arms (17 + `ops.md`’s CSP …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-15 (**S383 — 30th run, first since S369 (14 sessions); F was the stalest unattended pass for three sessions running (O attended-only) and the S383 pointer named it AND the affordance: THE DISABLED-CONTROL LOOK, which none of F's 29 prior runs had swept.** CSSOM census over all 14 pages (0 pageerrors, rule counts 79–790, so every result counts): the suite has …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S388):** **BRANCH/PR: S382–S387 all ran on `claude/wizardly-tesla-xu0ikd` (PR #242, draft, open, unmerged; base `4d6c02d`), now 22 commits + 6 close-outs. If that PR is still open and unmerged, CONTINUE on it; if merged, cut a fresh `claude/*` off latest `origin/main` and open a new draft PR at close-out. Verify via the API** (no workflow runs on `pull_request`, so `get_status` reads `pending`/`total_count: 0` — GitHub's default for a commit with no legacy statuses, NOT a queued check. `get_check_runs` answers: 1 run, `Supabase Preview`, concluded **`skipped`** — correct, since migrations live in `db/` not `supabase/` so no paid preview branch spins up. That is a GREEN PR, not a failure to chase.) **⚑ DRIFT CHECK: compare `origin/main` against `4d6c02d` + this loop's commits; S383–S387 all found NONE — CHECK IT, never trust this unread. `sw.js` v754, FM 5.44, migrations 0001–0003 all `Live? = yes`.** A fresh container starts SHALLOW — `git fetch --unshallow` before `update-sitemap.mjs`, and before any `git log`-dated arm (a shallow clone returns the boundary date and the sitemap check passes falsely; S387's was full at 3,066). The `--sdk` fixture the backend smokes need: `npm pack @supabase/supabase-js@2.116.0` (the npm registry IS reachable; the CDNs are not), untar, pass `package/dist/umd/supabase.js`; **pass `--sdk` to `smoke-tools.mjs` too or its signed-in B arms silently SKIP** (114 checks without it, 135 with).

**⚑ STALEST PASS: O (S346, attended-only — unattended skips it), K (S374), N (S375), M (S376), G (S377), D (S378), I (S379), H (S380), C (S381), P (S382), F (S383), B (S384), A (S385), E (S386), L (S387).** Unattended: take **K** (i18n audit) — 14 sessions stale and the longest-standing unattended gap. Run `node scripts/check-i18n.js` and read **Check E's OUTPUT, not the exit code** (the accounts landing added `privacy.legal.*`/`terms.legal.*` slots, and E is what stops a legal edit silently serving English); Check B's backlog is the burndown; then probe the gate's blind spot — English in template literals and plain-argument strings, over `4a1f186..HEAD`. O next `torah_trainer.html`; C next torah (S298); M next `index.html` (S246); N next trope (S248); D next flash_cards or the FM; H next the dashboard (**S46, the stalest tool pairing in the table**); P next the dashboard or dictionary; F next the disabled CURSOR idiom or the empty-state re-sweep; the next I re-runs `i379/gates.mjs`; **the next A sweeps `b8ba5ef..HEAD` and re-reads the 3 rows S385 left at clean streak 1 — `hover-feedback-survives-the-disabled-state` is now 8 of 8 closed, so A's job there is arm (b) of its widened definition, the hand-rolled carriers that declare no disabled rule.** The next E extends `e386/`; the next L re-runs `l387/audit.mjs` + `bytecheck.mjs` against this session's endpoint.

**⚑ RUNTIME-PROBE HARNESS (standing; S384–S387 traps, all spelled out in loop-findings).** (1) `hebrewBlender_darkMode` stores `'1'`/`'0'` — prove each cell's theme from a themed token (`--gold`, `--warm-gray`) or VOID it. (2) Routes match in REVERSE order — catch-all abort FIRST. (3) `requestfailed` never fires for a 404. (4) Never hand-roll an accessible-name walker. (5) Census a dialog OPEN. (6) Seed `hebrewDashboard_setupSeen`. (7) An UNDETECTED plant can mean immunity — read plant + result together. (8) `ivritRestore` BLOCKS on the Merge modal — fire unawaited, click `[data-act="merge"]`, fresh context per import. (9) An attribute reader must capture the opening quote and match its kind, then assert or VOID. (10) Census LOAD sites only. (11) An unanchored CSS `url(…)` also matches JS `URL(`. (12) SPECIFICITY is a measurement — measure the dark cell too, UNLESS the rest colour is a themed token. **(13) NEW S387 — a top-level `const`/`let` in a classic inline script is SCRIPT-SCOPED: `window.IVRIT_CFG` is `undefined` and a probe reading it reports a false VOID; use the bare identifier in `page.evaluate`. (14) A junk-shape axis MUST include a truthy non-string (`[]`, `{}`) — exactly what a bare `x ? …` guard lets through. (15) A JSON-LD `@type` census must walk `@graph` members, not the wrapper. (16) `pkill -f <pat>` in a compound command matches that command's own text and kills the shell (exit 144) — S386 and S387 both hit it.**

**⚑ TOP UNGATED CANDIDATES (S387): the tour-card h4 → h2 ×7** (the "next touch of a tour engine" — extract the shared block in the same session); **the remaining sub-floor touch targets** (bingo stepper, scaled toggles, `#rulerCorner`); **`.pos-all-btn`'s disabled look on the OTHER pages that paste it** (S387 fixed the dictionary's; arm (b) of the widened pattern definition should sweep whether any other page hand-rolls a locked look with no disabled rule). Decide-then-sweep: whether an action TOOLBAR should rove like a selection grid; whether the disabled CURSOR should converge (the suite now runs `not-allowed` on trope's `.btn` and `default` on the dictionary's, the FM's and account's — F's call). Gate 2: the flash-card swatch labels; the generator's `restoreLastSetup` corrupt-drop; the dictionary drag-freeze + select-all cap; the corpus's split article tokens; the printed teacher-copy wording; the board's day plates; the trope FAQ a7 copy; the resources preview Taamim fallback; the FM's `nexthint_nikkud` dead copy. Gate 3/M: the Font Maker stage annotations; **`account.html`'s dark theme has no `.btn.ghost` variant and its dark `.btn.danger` has no hover response — both pre-existing, both diagnosed in loop-findings, both M's call, not a disabled-state fix.** Gate 4 (attended only): the flash-card sticky-bar and landscape-card proposals. **Seed bench: 26. Gate 1 next attended session: the trope "drill the marks I missed" and the three dual-audience S seeds first.**
