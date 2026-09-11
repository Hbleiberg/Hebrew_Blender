# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S381 Pass C — the follow-on to `daab7b2`/`516a105`, same one-Tab-stop pattern; keyboard efficiency**) | hebrew_blend_generator.html + flash_cards.html (+ any other tool with a `role=button` tile grid — F's census) | **The remaining tile grids are still one Tab stop PER TILE: the generator's three lock-position rows (`.lock-letter-tile`, `lockSelectAll(1..3)`) and the real-words …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] S | Hebrew_Font_Maker.html | **Individual pictures: pick all the photos at once.** Measured S380: `#letterFile` is single-file, so 27 letters cost 27 × (tile → browse → OS picker → Next: Trace) = 108 actions, while the combined-sheet input already carries `multiple`. A `multiple` input whose files fill the current letter and then the next untraced ones in alef-bet order (or by a …[full …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [x] 2026-09-11 | (S381 close-out) | branch/deploy note | **S381 CONTINUED `claude/improve-loop-swgwqx` (PR #229 open, draft, mergeable clean at start; base `66dd97b` = `origin/main`), 3 fix commits + this close-out (62 on the branch); a human merges and confirms the Pages run. Drift: none (`origin/main` still `66dd97b`, sw v705, FM 5.39). sw v705→v706 (Font Maker CSS, flash cards JS, generator …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | pass | flash_cards.html | **S381 Pass C (accessibility), flash cards' 5th dedicated C (S167 → S271 → S381; 46 commits to the file since S271), stalest unattended pass + tool. 16 arms in EN light 1280 + HE dark 800 (`c381/pass.mjs`, a seeded 2-result profile, injected-throw control counted in every cell): name census 173/173 visible controls named (setup expanded; 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `e100574` | Hebrew_Font_Maker.html + `docs/reference/font-maker.md` | **An `askModal` raised over the wizard, help, QA, My Fonts or mobile-warn overlay painted BENEATH it (P2, the S380 first pick): every `.overlay` was z-index 200 and `#askOverlay` precedes the others in the DOM — the My Fonts 🗑 "Remove font?" confirm could not be clicked, the wizard's template-failure dialog …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | (S380 close-out) | branch/deploy note | **S380 CONTINUED `claude/improve-loop-swgwqx` (PR #229 open, unmerged; base `66dd97b` = `origin/main`), 2 commits + this close-out (58 on the branch); a human merges and confirms the Pages run. Drift: none (`66dd97b`, sw v704, FM 5.39). sw v704→v705 (FM + locales); FM NOT bumped (two fixes, no feature). 3 of 5 iterations: the pass + 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | pass | Hebrew_Font_Maker.html | **S380 Pass H (teacher walkthrough), the Font Maker's 4th (S97 → S163 → S241 → S380), stalest unattended pass + tool. Lesson: "photograph my handwriting, one letter per picture, make a class font for Generator worksheets" — wizard → 27 uploads + auto-trace → placement → spacing → save → REAL export (engine from a local npm mirror) → My Fonts → …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | (S379 close-out) | branch/deploy note | **S379 CONTINUED `claude/improve-loop-swgwqx` (PR #229 open, unmerged; base `66dd97b` = `origin/main`), 4 commits + this close-out (55 on the branch); a human merges and confirms the Pages run. Drift: none (`66dd97b`, sw v703, FM 5.39). sw v703→v704 (8 pages); FM NOT bumped (a size step). check-i18n / inline-js / llms clean; sitemap last; …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | pass | the whole suite | **S379 Pass I (first-load & empty-state), the 29th run (S366 → S379): mechanical gates clean a 16th consecutive run** — 26 virgin cells (13 pages × EN/HE): 0 pageerrors / 0 failed / 0 raw keys / lang+dir 26/26 / Taamim 200 on all 10 carriers / virgin-write census = S353's; 22 weighted empty-state arms on the S367–S378 delta clean (`i379/arms.mjs`); the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `4f9a2e7` | index + generator + flash_cards + classroom_dashboard | **A junk stored `hebrewBlender_inputMode` hid BOTH backup panes and pressed neither toggle on all 4 `.ivrit` carriers (S379 Pass I hit, P3, `stored-json-of-the-wrong-shape-trusted`):** `setIvritMode` normalises anything but `manual` to `auto`; the hub's 2 AllTools import sites accept only the two values. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `de49066` | classroom_dashboard.html | **`applyZoom` with a non-numeric stored `zoomLevel` labelled "NaN%" and left the slider at its markup default (S379 corrupt-key arm, P4, `apply-settings-trusts-collection-members`):** `Number()` + a finite check → 100 before the clamp. | verified: `i379/zoom.mjs` "abc"/{} → 100%, "1e999" → 100 (was 200), -5/[] → 50, "75"/75 → 75 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | (S378 close-out) | branch/deploy note | **S378 CONTINUED `claude/improve-loop-swgwqx` (PR #229 open, unmerged; base `66dd97b` = `origin/main`), 4 commits + this close-out (50 on the branch); a human merges and confirms the Pages run. Drift: none (`66dd97b`, sw v702, FM 5.39, as S377 recorded). sw v702→v703 (dictionary, dashboard, torah, trope); FM NOT bumped (untouched). …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | pass | hebrew_dictionary.html | **S378 Pass D (performance), the dictionary's 2nd dedicated D (S253 → S378; 60 commits between):** 8 cold cells + CDP profiles at 1×/4× + 40 real-input arms at 1×/4×, every arm behind a 300ms busy-loop click control (301–313ms). 2 hits FIXED (`595ffca`, `589a723`); measured, not small-fixable: a 100-card relayout ≈ 27–35ms @1× (each drag frame, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `595ffca` | hebrew_dictionary.html | **The locale-ready handler no longer renders the grid before bootstrap (S378 Pass D hit, P3):** `applyI18n()` fired by `I18n.ready` ran `onFilter()` into the hidden grid (13k filter + sort + 100 cards), then `maybeBootstrap()` did it all again; the branch is gated on `_bootstrapped`. | verified: `d378/verify1.mjs`, 12 cells EN/HE × …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `589a723` | hebrew_dictionary.html | **The alphabetical sort compares a precomputed rank, not the collator, on every filter change (S378 Pass D hit, P3):** the CDP profile put `HEB_COLLATOR.compare` at 130ms of each 430–650ms filter block @4×; `finishLoad` sorts a copy once and stamps `rank`, the five alpha sites compare ranks. | verified: `d378/sortcheck.mjs` 30 state × sort …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | (S377 close-out) | branch/deploy note | **S377 CONTINUED `claude/improve-loop-swgwqx` (PR #229 open, unmerged; base `66dd97b` = `origin/main`), 4 commits + this close-out; a human merges and confirms the Pages run. Drift: none (`66dd97b`, sw v701, FM 5.39, as S376 recorded). sw v701→v702 (dictionary, flash, FM); FM NOT bumped (CSS twins only). Scripts: check-i18n, …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `eb3e6ad` | hebrew_dictionary.html | **A print job no longer ends on a blank sheet (S377 Pass G hit, P3):** the grid's 16px bottom margin + the content pane's 14–18px bottom padding paginated below the last card; the print block zeroes both (the Torah Trainer's S182 shape). | verified: 108-word set on A4 at 0.75in 8 sheets (8th blank) → 7, Letter 8 → 8 with none blank; screen …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | `a92d135` | hebrew_dictionary.html | **Screen affordances stop printing (S377 Pass G: 3 hide-list omissions + pattern `dark-print-shadow-slab` 3rd carrier; P3):** `.ec-speak` (audio on: 1,785 🔊 on an emoji print, 140 → 135 sheets), `.wc-bulk-cb` (9 box drawings), `.wl-active-exit` (EN + HE; the banner label stays, the only title on paper) join the hide list; `* { …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-11 | (S377 Pass G — print & export fidelity, `hebrew_dictionary.html`, its 2nd G since S252; 57 commits between) | **27 real-PDF cells (EN/HE × light/dark × Letter/A4; margin sweep ×8; a 108-word set; emojis audio on/off; shoresh; bulk; a 200-word saved list EN/HE; backgrounds-on) + a 6-stage export arm. Clean: 0 dark fills, 0 chrome strings, no mid-card breaks; Anki/Quizlet/emoji …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

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

- 2026-09-10 | **S367** | iters: 1 pass (**H**, user-directed seed scan) + 4 fixes = **5** | tools: trope_tutor (`92eadd0`), generator (`e529293`), dashboard (`5c7c796`), Font Maker (`33fcf13`) | patterns fixed: wrong-shape ×2 (all carriers closed), clobbered-label ×1 | pass run: H (trope_tutor + a …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-10 | **S366** | iters: 1 pass (**I**) + 3 fixes = **4** (no cap-allowed 4th) | tools: dashboard (`b98d7ae`), flash_cards (`e54dd1a`), generator (`8bf361c`) | patterns fixed: wrong-shape ×2 (NEW) | pass run: I (28th, gates clean 15th; 3 defects) | SW: v691

- 2026-09-10 | **S365** | iters: 1 pass (**D**) + 3 fixes = **4** (no cap-allowed 4th) | tools: generator (`d86e728`), dashboard (`095bc47`), trope_tutor (`772068b`) | patterns fixed: sub-floor ×2, unreferenced-key ×1 | pass run: D (trope_tutor, CLEAN, 0 defects, 1 leak read in code) | SW: v690

- 2026-09-10 | **S364** | iters: 1 pass (**G**) + 4 fixes = **5** | tools: dashboard (`eed4c03`, `0dc999c`), generator (`cabd6ca`, `b83b896`) | patterns fixed: print-hide-list ×1 (NEW), print-remap ×1, rendered-note ×1, hover-state ×1 | pass run: G (dashboard, 3 paper defects + 1 gate-2) | SW: v689

- 2026-09-09 | **S363** | iters: 1 pass (**H**) + 3 fixes = **4** (no cap-allowed 4th) | tools: generator (`a0ec809`, `128c449`), dashboard (`322223e`) | patterns fixed: save-over-existing-name ×2 (NEW), unreferenced-key ×1 | pass run: H (generator, 2 frictions + 1 leak) | SW: v688

- 2026-09-09 | **S362** | iters: 1 pass (**M**) + 4 fixes = **5** | tools: dictionary (`10be341`), generator (`9ad0df8`), dashboard (`a0cc446`), Font Maker (`26fd826`) | patterns fixed: row-siblings ×2, hover-state ×1, sub-floor ×1 | pass run: M (dictionary, 1 defect + 1 cross-page) | SW: v687

### Tool coverage (last-touched date per tool)

- **S381 (2026-09-11):** hebrew_dictionary 2026-09-11 (`f4a102d`; D S378); classroom_dashboard 2026-09-11 (`de49066`; G S364); torah_trainer 2026-09-11 (`f4a102d`); trope_tutor 2026-09-11 (`f4a102d`; M S376); flash_cards **2026-09-11 (`daab7b2`; C S381)**; Hebrew_Font_Maker **2026-09-11 (`e100574`; H S380)**; resources 2026-09-11 (`b1c0655`; N S375); privacy 2026-09-11 (`f8f23e0`; S360); hebrew_blend_generator **2026-09-11 (`516a105`; H S363)**; index 2026-09-11 (`4f9a2e7`; S379); contact / terms / 404 2026-09-09 (S359–S361 chrome).

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S379: a SCALAR sibling FIXED (`4f9a2e7`, the shared `.ivrit` engine's `setIvritMode` normalises an unknown stored mode on 4 carriers; the hub's AllTools import validates it); the I corrupt-key arm (52 cells + 8 controls) …[full text: IMPROVEMENT_ARCHIVE.md]

- **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE **S379: 1 more range-setter FIXED (`de49066`, the dashboard `applyZoom` → `Number()` + finite → 100; the Infinity string clamps to 200→100). S371 (Pass A, `junk.mjs` 176 cells): the RANGE-SLIDER SETTER shape had 13 more …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S373: the S371 twin divergence FIXED (`d5285f6`, trope `.settings-modal, .settings-backdrop`). Registered S364; hits 3 (S364 ×2 `eed4c03`, S371 ×1), clean streak 0; last swept S371.** Detection: every …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **ONE MORE ARTIFACT at 2026-09-08 (S343 Pass A), caught before a verdict: the first dashboard alert census reported `clicked=1` of 254 — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S381 Pass C re-swept `flash_cards.html` pseudo-aware (setup expanded + card + listening + results + 7 dialogs + sheet menu + Move ▾ menu, both themes): 0 hits — the only sub-24 box is an inline footer credit link (13px tall, inline text, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S377: flash ×3 FIXED (`82bbf4c`), FM ×4 FIXED (`24a4c91`); 0 open. Hits 10 (10 fixed), clean streak 0 — retirement needs 3 clean A sweeps.** Detection: `grep -nE '(max-)?height:\s*(calc\(|min\()?\s*[0-9]+vh' | …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**NEW, registered AND CLOSED 2026-08-29 (S291 iters 2+4) — 2 carriers found, both fixed, suite census clean**): a rule paints text with a token whose value is tuned for the OTHER theme's ground, so it is correct in one mode and …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S374: the 4 S371 carriers FIXED (`31a84f7` torah `karaokeRate`/`ttsRate`; `5d1d13a` trope `hebFontSize`/`playbackRate`) via `_sliderNum` at `loadSettings`; open hits 0, clean streak 0.** Shape: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S377 Pass G: 3rd carrier — the dictionary's hovered `.word-card` halo (`rgba(0,0,0,.08)`, 132×183pt) printed; FIXED `a92d135`. Hits 3 (3 fixed), streak 0.** Detection: reach the …[full text: IMPROVEMENT_ARCHIVE.md]

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

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html` (the pointer's named surface; its first whole-page O), ATTENDED and the stalest pass, so direction and staleness agreed. Detector: Impeccable JS 4.1.3 from the `skill-v4.1.3` tag — upstream HEAD (4.2.2) is now a Rust engine binary the sandbox cannot download; static arm NOT degraded (20), browser arm …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-11 (**S375 — 16th N, `resources.html`, its 2nd (S246 → S375). 4 real descriptors (SE 320, i13 390 + landscape, Pixel 7 412), 16 cells × 6 views, real taps (chips, view toggle, Preview, keyboard key, chevrons, pill, FAQ): 0 overflow, both sheets fit, × hit-testable, 0 pageerrors. Arms 1/2/4/5/6/7 clean (4× CPU load 370ms). Arm 3: 1 HIT FIXED — …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-11 (**S376 — 16th-ever M, `trope_tutor.html`, its 2nd (S245 → S376); stalest unattended pass. 8 cells (EN/HE × light/dark × 1280/800) × 8 views (learn, chip, drill start/question/results, drawer, tour, FAQ): 0 pageerrors, 0 overflow, alpha-composited contrast 0 hits (the S245 arm corrected), dark parity by design. 2 hits FIXED: `.tu-rare-tag` …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-11 (**S374 — 25th run, first since S360 (14 sessions); stalest unattended pass (O attended-only), pointer-named. 4 gates clean (18th consecutive; 5144 keys, build-locales diff-clean). Static delta `b418cf9..4a1f186` (S357→S373: 13 pages, +421 = 180 live script + 68 comment + 22 markup + 143 style): 1 raw → 0 real (FM `_pT('metric_hint', fallback)`, the S289 …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-11 (**S381 — `flash_cards.html`, its 5th dedicated C (S167 → S271 → S381; 46 commits to the file between). Stalest unattended pass (O attended-only), pointer-named tool. 16 arms, EN light 1280 + HE dark 800, every cell with an injected-throw control counted: names 173/173, 24px floor 0 hits, contrast 0 hits in both themes across setup/card/listening/results/7 …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-10 (**S371 — 30th A; A was the stalest unattended pass (O attended-only) and the S371 pointer named it AND the arms. Delta `b418cf9..1d4c9cf` (S357→S370, 60 commits, 15 code files): 15 static + 5 runtime arms (`a371/junk|print|hover|hover-fm|fmrecents|note.mjs`, every runtime arm controlled, 176 + 15 + 32 + 6 + 2 cells). 4 hits FIXED in-session: the …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-11 (**S377 — `hebrew_dictionary.html`, its 2nd G since S252 (57 commits between). Stalest unattended pass (O attended-only), pointer-named tool. 27 real-PDF cells + a 6-stage export arm: 4 hits ALL FIXED in 2 commits (`eb3e6ad` trailing blank sheet; `a92d135` 🔊/bulk-box/Exit hide-list omissions + the hover halo, `dark-print-shadow-slab` 3rd …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-11 (**S378 — `hebrew_dictionary.html`, its 2nd dedicated D (S253 → S378; 60 commits between); stalest unattended pass, pointer-named tool. `d378/` harness (longtask/mutation counters, CDP 1×/4× + profiler, a 300ms click control). COLD @1× clean; @4× 3–4 blocks of 200–310ms and the grid rendered TWICE per boot — FIXED `595ffca`. 40 real-input arms: a filter …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-11 (**S379 — 29th run, first since S366 (13 sessions); stalest unattended pass (O attended-only), pointer-named. Mechanical gates clean a SIXTEENTH consecutive run:** 26 virgin cells (`i379/gates.mjs`; 13 pages × EN/HE, a new context per load = empty localStorage AND IndexedDB, SW blocked, foreign origins aborted) → 0 pageerrors / 0 same-origin failures / 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-10 (**S370 — 29th run, first since S356 (14 sessions); B was the stalest unattended pass (O attended-only) and the S370 pointer named it AND the delta. Five arms, every probe controlled (an injected throw + a 404 fetch + a console.error counted 3/3): (1) 56 loads (14 pages × 1280/390 × light/dark): 0 pageerrors, 0 non-noise console lines (the i18n test page's …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-11 (**S373 — 18th run, first since S359 (14 sessions); stalest unattended pass (O attended-only), pointer-named. Byte-check vs `b418cf9` (S358→S372): 13/14 files moved, 0/14 crawler surfaces moved. Mechanical 12/12 clean (unique titles/descriptions, canonical = sitemap = indexable set of 12, og:image on disk, 1 h1 each, 36 JSON-LD blocks parse, FAQ twin …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-11 (**S380 — `Hebrew_Font_Maker.html`, its 4th dedicated H (S97 → S163 → S241 → S380; v5.1 → 5.39 between); stalest unattended pass (O attended-only), pointer-named tool. Lesson "one photo per letter → class font → Generator worksheet", EN light 1280 + HE dark 800, 171 real clicks, engine served from a local npm mirror so the export was …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-11 (**S372 — 30th run, first since S358 (14 sessions); stalest unattended pass (O attended-only), pointer-named. Delta `b418cf9..408dbe4` (S357→S371, 24 files). 17 arms, 15 clean, 2 drifts + 1 rule leak FIXED: sitemap lastmod ×5 → `919f478`; restore-guard/subtitle/FM-load docs → `21ea7dc`; session ids in 2 reference docs → `c2b3b10`; the S371 P3 (FM recents) …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-10 (**S369 — 29th run, first since S355 (14 sessions); F was the stalest unattended pass (O attended-only) and the S369 pointer named it AND the affordance: the TEXT-SIZE FLOOR for functional labels.** Runtime census of every visible sub-11px text node on all 13 pages (1280 EN light, panels expanded, 13/13 injected 9px controls fired, 0 pageerrors): 49 groups …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S382):** **BRANCH/PR: S369–S381 ran on `claude/improve-loop-swgwqx` (cut at `66dd97b` = `origin/main`; 62 commits at this close-out) → draft PR #229. If it is still OPEN and unmerged, continue on it; if MERGED, cut a fresh `claude/*` off latest `origin/main` — never stack on merged history. Verify via the API** (0 check runs is correct — no workflows). **⚑ DRIFT CHECK: compare `origin/main` against `66dd97b`; anything beyond THIS loop's commits is an outside-loop landing. `sw.js` v706, `FONT_MAKER_VERSION` 5.39** — re-read both. A fresh container may start shallow — `git rev-parse --is-shallow-repository` before `update-sitemap.mjs`; the HTTP server on 8080 dies across a compaction — curl it first; the scratchpad keeps `b370/`…`c381/` while the container lives (`h380/cdn/` = the ~30 MB npm mirror of pyodide 0.26.2 + fonttools 4.51.0 + Brotli + opentype 1.3.4 + harfbuzzjs 0.4.6 + jspdf 2.5.1 + html2canvas 1.4.1 with the lock sha patched — `stageB.mjs` `localFor()` routes it; rebuild per the S337 recipe in loop-findings if gone).

**⚑ STALEST PASS: O (S346, attended-only — unattended skips it), F (S369), B (S370), A (S371), E (S372), L (S373), K (S374), N (S375), M (S376), G (S377), D (S378), I (S379), H (S380), C (S381).** Unattended: take F (cross-tool consistency; affordance candidates: the DISABLED-control look, and "a `role=button` tile grid is one Tab stop" — census the dashboard, dictionary, torah and trope for click-only tile grids alongside the P4 lock-row/rw-grid candidate), then B. **O next `torah_trainer.html`; C next torah (S298) then dictionary (S285); G next: re-derive per tool from the archive; M next `index.html` (S246) then torah; N next trope (S248) then index (S249); D next flash_cards or the Font Maker (re-derive); H next the dashboard (S46) or the generator (S56); the next A sweeps `1d4c9cf..HEAD` with the range-setter arm on the Font Maker's 13 sliders + the torah/trope `_sliderNum` sites + the dashboard `applyZoom`, the `vh-capped-sheet-without-dvh-twin` row (0 open; 3 clean sweeps retire it) and the `dark-print-shadow-slab` row; the next E re-runs the 17 arms over `408dbe4..HEAD`; the next L re-runs vs `4a1f186`; the next K re-runs over `4a1f186..HEAD`; the next I re-runs `i379/gates.mjs` + `arms.mjs` + `corrupt.mjs` over the then-delta.**

**⚑ Harness (standing, Font Maker): probes pass `dismiss:false` to `b370/harness.mjs` `open()`; on a PHONE descriptor `#mobileWarnOverlay` opens INSTEAD of the wizard — call `dismissMobileWarn(false)` then wait `#wizardOverlay.open`; enter via `#wizName`/`#wizAuthor` → `#wizNext` ×2 → `#wizCreate` (Next is disabled unnamed); letter tiles are `#letterGrid .ltile` selected by `.lt-heb` glyph text (no data attribute; `.lchip[data-cp]` is the export chips); upload = `page.setInputFiles('#letterFile', png)` then `#tabTrace` auto-traces; `saveToBrowser()` re-reads the meta FORM (`onMetaChange`) — mutate through `#reservedName` or call `pushRecentProject()`; Load menu `#wizOpenProject` / `[onclick="toggleLoadMenu(event)"]:visible`, Save menu `toggleSaveMenu` → `#saveMenu .load-menu-item`; anchors panel = a letter tile then `gotoAnchors('nikkud')` / `setAnchorClass(k)`, `#savePlacementBtn`; the real export needs the `h380/cdn/` mirror routed by `stageB.mjs` `localFor()` (page-top html2canvas/jsPDF must be aborted BEFORE `goto` for an offline arm); hit-test a stacked dialog with `elementFromPoint` at the `.modal` centre (`c381/fmstack.mjs`: opens each parent overlay, raises `askModal`, real-clicks `#askBtns button`; a comma selector list + `>> nth=-1` picks the LAST button in DOM order).**

**⚑ Harness (standing, other tools): the C harness is `c381/pass.mjs` (`__c.census/floor/contrast/focusInfo/dlg/anims` injected per page; real Tab walks with a 170ms settle; `page.on('dialog')` ONCE per page — stacked `once` handlers throw "already handled"); flash cards: seed `hebrewFlashCards_profiles` `{profiles:{name:{results:[{savedAt,cards:[{heb,score}]}],ladder:{}}},active}` via a prior same-origin page, dialogs open by real clicks on `#ladderBtn` / `#viewWeaknessesBtn` / `#saveResultsBtn` and by `askCardCount(10,20)` / `chooseProfileModal()` / `ivritAskMode()`, `#printSheetBtn` by Enter, listening = click `label.switch:has(#listeningToggle)` (speechSynthesis exists headless), the generator's grid re-render = `setDageshTav(bool)`; torah stubs Sefaria with the b370 `SEF` shape; hidden toggles → click `label.toggle:has(#id)`; dashboard: `frSkip()` BEFORE any header click, `openPickOverlay()` + `renderGroupCards([[…]])`, the week editor via `openWeekEditor()`; dictionary: ready = `filtered.length>0` + `#loadingMsg` hidden, search = `#searchInput.value` + `onFilter()`, bulk = `#bulkModeCb`, `wlAddList()` → `{ok,id}` → `wlLoadListAsFilter(id)`, `wlOpenManager()`; trope drill = `setMode('drill')` then `#drillStartBtn`; PRINT `g377/`; PERF `d378/lib.mjs`; a delay `page.route` goes AFTER the catch-all; `addInitScript` re-seeds on every navigation; contrast probes composite alpha; N `n375/mobile.mjs`; M `m376/audit.mjs`; screenshot paths are cwd-relative.**

**⚑ TOP UNGATED CANDIDATES (S381): the remaining per-tile Tab-stop grids (P4: generator lock rows ×3 + `#rwLetterGrid`, flash lock rows — one `roveTileGrid(...)` line each, then measure the count with the lock panels open); the tour-card h4 → h2 ×7 (it is the "next touch of a tour engine" — extract the shared block in the same session); the remaining sub-floor M calls (bingo stepper, scaled toggles, `#rulerCorner`); the `.rw-letter-tile .name` 7.2px grid (a layout decision); the unreachable nikkud hint (P4, half gate 2). Gate 2: a `<kbd>` hint line under the tile grids (arrows move inside the grid); the dictionary drag-freeze and select-all preview-cap proposals (S378 D); the corpus's split article tokens (S377); the printed teacher-copy wording under a Hebrew header; the board's day plates under backgrounds-on; the trope FAQ a7 copy; the four English-font picker headers; the resources preview stack's Taamim fallback (S353). Gate 3/M: the Font Maker stage annotations. Gate 4 (attended only): the flash-card sticky-bar and landscape-card proposals (`n361/`). The 5 torah/trope credit rows: wire-or-prune. **Seed bench: 26. Gate 1 next attended session: the trope "drill the marks I missed" and the three dual-audience S seeds first; the FM multi-photo seed is the H headline.**
