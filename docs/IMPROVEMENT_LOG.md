# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 (**NEW S559 H — the FM at the cap**) | Hebrew_Font_Maker.html | **Auto-detect matches a printed template page only when every row's box count is exact, and rows group by the box's top edge**: lamed's ascender splits its row (print page 1: 4,4,4,3,1,4), a letter written in two strokes adds a box (the cursive alef: 5,4,4,4,4), and the page falls back to the free-form right-to-left order — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**NEW S559 H — verify first**) | Hebrew_Font_Maker.html | **5 of 132 untouched starting fonts fail the export's shaping check**: "Right-meteg check failed … expected -49/166, got -49/167" (BenOr Rashi; Miriam CLM 178/169, Shuneet Square 125/150, Shuneet Classic 97/122) and "Hataf Patach + ZWJ + meteg did not compose" (Rommvilna), so a first export says "vowels/trop may be misplaced". …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S565 D — verify first, signed in**) | Hebrew_Font_Maker.html | **The cloud autosave still clones the whole project with its photos**: `fmCloudPack` runs `JSON.parse(JSON.stringify(p))` on every 10 s save of a dirty cloud project — the copy `c85bdd1` took out of the local autosave; measure with smoke-fontmaker's `--sdk` fixture and 8 phone photos. | found S565

- [ ] P3 (**NEW S559 H — gate 2, copy**) | Hebrew_Font_Maker.html | **Help (Uploading, Download Templates) and the after-upload status still say "drag a box around each glyph"**: Auto-detect letters and Trace all (v5.59) are never named in the instructions, so the one-sheet path reads as 27 hand-drawn boxes. | found S559

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P3 (**NEW S480 D — verify first**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4× (S565: 302–502 @1×). Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P3 (**NEW S570 D — not small: yield per verse or a worker**) | torah_trainer.html | **Turning Translit on freezes the page for the reading's first transliteration pass**: one task of 520 ms @1× / 2.45 s @4× on Vayera (2,085 words; the Trope staff 447 / 2,691), and a cold load with Translit on 536–582 / 2,751–2,948 — the library's syllabification; the memos spare only re-renders (findings …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S567 P — verify first; a shared module**) | js/ivrit-saves.js | **A page write made while a slow load's sync is still settling goes up only at the next load, and the status line says "Saved in your account" meanwhile**: the dashboard's Bulk preset edit saved after a download landed while the listing and the download each took 7 s → no PATCH, the rows `local-changed` in `lastPlan`, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S566 H — gate 2, what a saved score means**) | flash_cards.html | **The progress report and the history count unreached cards as attempted**: 3 of 3 answered before a 30 s limit ran out reads "20 cards attempted · 15% accuracy · 15% best drill" on the parent report and "15% 3/20" in the history, where the results screen said 100% (3/3). The saved `total`/`pct` are deck-wide on …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S565 D — the intake half is gate 2**) | Hebrew_Font_Maker.html | **The Trace step still freezes 1.5–1.9 s on a 12 MP phone photo** (3.1–3.3 s before `6ef102d`; 16 s @4×): `flatCanvasFor` flattens the whole 3024×4032 photo (decode + `getImageData` ~1 s, the blur 0.55 s). Keeping intake photos near 2,000 px (`prepImageForItem`) would cut it ~4× and shrink every snapshot and file — a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3, the sheet's layout**) | hebrew_blend_generator.html | **Name the Letter with QR Answer Key prints the code alone on page 2** (Letter and A4, 4/4 cells; Export PDF fits it): the 40-letter sheet is 977 of the page's 989 px and the QR block needs 109, so every student copy costs an extra sheet and loses its code. No small fix keeps both: tighter cells in print when …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3 or a shorter payload**) | hebrew_blend_generator.html | **The printed answer-key QR is 2.2 cm for 81–125 modules, 0.18–0.27 mm a module** (below the ~0.33 mm print guidance): decoded from the Print PDF at 300 dpi only 3/10 shapes, at 600 dpi 10/10, so an ordinary phone at reading distance may fail. Larger box (layout) or a shorter `?ak=` payload (findings S563). | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492; S562's census, not the clamp's: the dictionary 4/4, the generator EN 7/7, the dashboard's last step — `n562/tourflip-suite.mjs`). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S559 H — the FM at the cap**) | Hebrew_Font_Maker.html | **Auto-detect is offered on every tab's sheet view but knows only the Hebrew letters**: on the English tab the English template's 30 boxes are assigned צ ץ ק … and then the traced Hebrew letters, and Apply would replace their photos and outlines (one Ctrl+Z). Hide it off the Letters tab, or make it tab-aware (seed). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S557 H — gate 2, the Trainer's deep-link contract**) | trope_tutor.html → torah_trainer.html | **A Learn card's "See it in the parsha →" replaces the Trainer's saved reading**: `?parsha=` saves the parsha with `scope:'parsha-full'` and drops a holiday, so a student on aliyah 3 of Ki Tavo or on Rosh Hashanah day 1 reopens the Trainer on Bereshit (both measured, 2 cells); a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **A cold Trope-staff load still draws the reading twice**: `ensureStaffData()` starts only when the first render asks, so the words-only fallback draws first (31–50 ms @1×, 115–180 @4×) and the staff replaces it; starting the phrase file in `init` when the layout is the staff would draw once. | found S570

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **init's synchronous work before the Sefaria request grew ~120 ms @4× since S424**: `wireSettingsForm` 55–64 ms (4–5 then: two `lookupRender` for the closed Calendar tab, ~25 each), `staffInitWatchers`' `document.fonts.ready` read forces a style + layout (30), `buildHolidayPicker` 13–15 (findings S570). | found S570

- [ ] P4 (**NEW S569 G — gate 2, copy on paper**) | flash_cards.html | **Every card-sheet page is headed with the button's label** — "Print card sheet 1 / 3", "הדפיסו דף כרטיסים 1 / 3" (`flashcards.sheet.button` reused by `printCardSheet`): an instruction printed on the artifact; a noun ("Flash cards", "כרטיסיות") would read as a title. | found S569

- [ ] P4 (**NEW S569 G — K, gate 2**) | flash_cards.html | **The progress report's Score column reads "ניקוד" in Hebrew** — in a reading tool the word for vowel points; "ציון" is the score (`flashcards.report.col_score`). | found S569

- [ ] P4 (**NEW S569 G**) | flash_cards.html | **Load (a pasted share code) for an All Dictionary deck on a first visit says "still loading — try again" and waits for a second tap**, where an emoji code starts by itself once its file lands (the link path waits since `9388361`). | found S569

- [ ] P4 (**NEW S568 M**) | torah_trainer.html | **At Hebrew size ≥ 2.5rem the trope clause line meets the Latin under each word, reading and staff alike** (−0.7 → −3.4 px at 2.5 → 3.5rem): the Latin's 0.4em margin is the Latin's em, the line's 0.68em offset the Hebrew's; `padding-block-end:0.18em` on `.tt-wh` keeps the default and holds at every size. | found S568

- [ ] P4 (**NEW S568 M — converge**) | torah_trainer.html, hebrew_blend_generator.html | **The fullscreen Exit label is 8.3 px** (`#fsExitBtn .fs-label` 0.52rem) where the dashboard and the FM use 0.7rem: the projected lesson's one way out has the page's smallest text. | found S568

- [ ] P4 (**NEW S568 M — suite-wide**) | torah, dashboard, FM, generator | **Two controls render in the UA font (Arial), not Source Sans 3**: every page's `#fsExitBtn` and torah's `#ttAudioCollapseBtn` lack `font-family:inherit` (torah's census of computed families: only these two). | found S568

- [ ] P4 (**NEW S568 M — UX rule 8**) | torah_trainer.html | **Side by side's Hebrew column heading "עִבְרִית" has no `lang="he"`** (a literal in the builder) and falls from Libre Baskerville to the system serif beside the EN UI's uppercase ENGLISH / TRANSLITERATION. | found S568

- [ ] P4 (**NEW S568 M — pattern `live-region-display-none-while-empty`**) | torah_trainer.html | **The Audio tab's `#optPitchStatus` and `#optRecSrcNote` are `hidden` live regions unhidden and filled in one task** (CDP: notRendered while their panel shows): the first message may go unannounced. | found S568

- [ ] P4 (**NEW S568 — found verifying `f6d4a231`**) | hebrew_blend_generator.html | **Export PDF carries the blend Self-Check's screen controls** (score bar, Reveal All / Hide All, Per row, "Tap a card to flip") that print hides (`.score-bar, .self-check-controls`); a flipped card's Missed / Got it buttons print and export too. | found S568

- [ ] P4 (**NEW S568 — K**) | hebrew_blend_generator.html | **Real Words Self-Check's "tap to flip" is a hardcoded English literal** in the Hebrew UI (a template literal, outside `check-i18n`'s reach). | found S568

- [ ] P4 (**NEW S566 H — K, Hebrew to author**) | flash_cards.html | **The Hebrew profile picker reads "Avi · 1 שמורים"**: `flashcards.profile.button_label` has no `.one`/`.other` split, and שמורים is masculine for results (תוצאות). | found S566

- [ ] P4 (**NEW S566 H — gate 2, copy**) | flash_cards.html | **The results actions mix the Hebrew register**: "שמור תוצאות" (singular) among "שמרו / חזרו / תרגלו / הדפיסו / שתפו" (plural); a preset row's Play / Load / Save are singular too. One register per screen. | found S566

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **Save Project (.hebrewfont) still serializes in one string**: `JSON.stringify` + `gzipBlob`, 1.6 s @1× with 8 phone photos, once per click; `autosaveParts` would serve it. | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **QA Check opens in one task**: 205–230 ms @1× on FreeSerif (346 glyphs), 795 ms @4× on a 27-letter sheet project (`qaBuild` + `qaRenderGrid`). | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **A cold load @4× has three tasks over 200 ms**: parse 391–441, `init` 687–757, the `I18n.ready` re-render 207–324 (S410: two, 306–365 + 492–560); 1× has none (top 150–160, was 96–102). | found S565

- [ ] P4 (**NEW S564 H**) | classroom_dashboard.html | **A period painted in the week editor reaches the board up to 30 s later**: the Now block names the new class at once while the board keeps the last preset until `checkSchedule`'s 30 s tick (painting the current period, Enable Schedule Sync, a cycle's "This week is"); the account download and Bulk edit already call it at once. | found S564

- [ ] P4 (**NEW S564 H**) | classroom_dashboard.html | **A `.ivrit` Merge onto a fresh device lists "My class (0)" twice**: the device's empty starter class and the file's are merged by id, so both stay; an empty default class could yield to a same-named incoming one. | found S564

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **"N pages to print" under-counts a Real Words sheet that runs on**: Identify (60) prints 4 pages under "2 pages to print" (8/8 cells), and the reading, ID Parts of Speech, Gematria, Fill Vowels and Reverse keys print 3 under "2" in some cells; `generator.md` names only the caller sheet as a known gap. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **A long Real Words answer key can print its footer alone on a page** (Letter: reading EN/HE, ID Parts of Speech EN, Reverse HE; A4: reading + QR EN, Gematria EN — 6 of 48 cells, the definitions' lengths decide): `break-before: avoid` on the key's footer, or fit the key. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **Gold that the B/W ink list misses prints at 2.75:1**: Class Set's VERSION A/B/C label (`.ws-version-label`) and Real Words Gematria's translations (inline `color:var(--gold)`), with backgrounds on or off; the print block darkens the other answer golds to `#6b4e12`. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **Blend Bingo hides Page Size (and Header Labels, Landscape) where Real Words Bingo shows them**: on A4 paper a teacher sets the size only from another mode first (the pill's value still applies). | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **The Identify key leaves a 2 px gold sliver at a page's foot**: a ★ card pushed to the next page by `break-inside: avoid` still paints its inline `outline` top edge on the previous one. | found S563

- [ ] P4 (**NEW S563 — pattern `decorative-glyph-carrier-exposed-to-assistive-tech`, census**) | FM, dashboard, generator, dictionary, letter_learner, name_tags | **11 more CSS-generated ▾ (`.panel-title::after` and kin) may join their controls' names**, as flash's 25 did before `872d772`; the fix is `content: '▾' / ''` after a plain fallback (findings S563). | found S563

- [ ] P4 (**NEW S562 N — touch parity**) | trope_tutor.html | **A Phrases chip lights its notes on the staff only by hover or focus**: a tap opens the mark's Learn card at once, so a touch user never sees which notes a chip names (`mouseenter` / `focus` → `.is-hl`; measured: the highlight flashes, then the tab changes). | found S562

- [ ] P4 (**NEW S560 C — gate 3**) | Hebrew_Font_Maker.html | **The fullscreen Exit button's no-wrap label spills 13px past its 60px plate** (EN "Exit Full Screen" 86px wide): after `f00f4bc` it still grazes 3% of Help / Tour at 1024 and 800, and a strip wide enough for it wraps the Hebrew toolbar at 1280; a plate that fits its label (or a two-line label) changes the button's look. | found S560

- [ ] P4 (**NEW S560 C**) | torah_trainer.html | **The karaoke follow-scroll recentres only past a fixed 120px band from the bottom**, while the open audio bar is 131px at 800: a chanted word can sit under the bar's top 11px without a recentre (`onAudioTimeUpdate`'s `innerHeight - 120`; the bar's live height is `--tt-audio-h` now). | found S560

- [ ] P4 (**NEW S559 H**) | Hebrew_Font_Maker.html | **After an Apply the sheet view (the navigator and Auto-detect) is gone**: the second page's Auto-detect is reached only by opening a letter with no crop, which nothing says; a two-file pick also lands on "2 of 2", and the hint keeps "Start by uploading…" until the first Apply. | found S559

- [ ] P4 (**NEW S559 H — student cell**) | Hebrew_Font_Maker.html | **Fullscreen Draw at 1024×768 starts the canvas at y≈490**, under the toolbar and the letter grid: a student sees the top third of the drawing area and scrolls to reach the baseline (strokes aimed below the fold drew nothing). Gate 3 if the grid folds. | found S559

- [ ] P4 (**NEW S559 H — verify first**) | Hebrew_Font_Maker.html | **Noto Sans's fidelity report opens on Start editing having measured 0 letter+mark combos (1,072 "unexpected shaping results") and ends "Every measured combo lands within 3 units"**: a vacuous all-clear, and the census's one stop (it covers Export). | found S559

- [ ] P4 (**NEW S558 M — gate 2, copy**) | trope_tutor.html | **The Phrases chips write the clause names in sentence case ("Sof pasuk clause", "Zakef katon clause") where the Learn chips, the drill grid and the printed chart's legend use title case ("Sof Pasuk clause")**: one casing for a mark's name across the page. | found S558

- [ ] P4 (**NEW S557 H — gate 2, copy**) | trope_tutor.html | **Under the High Holiday, Haftarah and megillah melodies the Learn examples and the Drill's Hear and Melody questions still sound PocketTorah's year-round reading**; only the Phrases examples are named (the HH note), the drill start says nothing. | found S557

- [ ] P4 (**NEW S556 M — gate 2, a title per mode**) | hebrew_dictionary.html | **The sidebar's first panel says "Word Length" in every mode**, yet in Emojis it holds the mode switcher, the gender toggle and the category tree, in Shoresh only the switcher. | found S556

- [ ] P4 (**NEW S556 M — type scale; the dictionary at the cap**) | hebrew_dictionary.html | **The last sub-10px labels: the emoji category counts (`.emoji-cat-count` 0.6rem = 9.6px), the shoresh pattern sub-labels (`.pat-sub` 9.6px) and the TTS slider's Slower / Fast (9.92px)** — the page's hints are 0.68rem. | found S556

- [ ] P4 (**NEW S552 M**) | name_tags.html | **The Look panel's Border and Background selects start 32 px apart** (49 and 81 px from the panel's edge under their labels; the font select 82): one label-column width for the three rows. | found S552

- [ ] P4 (**NEW S552 M**) | name_tags.html | **In the Hebrew UI a typed transliteration starts 30 px in from the automatic ones**: `.nt-trcell` puts the reset icon at the row's inline end — the left, beside the LTR text; pin the cell `direction:ltr` so the icon stays at the text's end. | found S552

- [ ] P4 (**NEW S551 H — gate 2, copy**) | name_tags.html | **The Avery note never names a product's twins** (8395, 5895, 15395, 25395, 45395 and 48395 share 5395's layout): a teacher holding an 8395 pack cannot tell that the "Avery 5395" tile fits it. | found S551

- [ ] P4 (**NEW S550 G — gate 2 on the first half**) | name_tags.html | **The CSV carries only a per-student extra line, never the list's** (a list moved by file loses "Grade 4" on every tag), and a `/` in the list name becomes three spaces in the file's name (`Kitah Dalet   2026.csv`). | found S550

- [ ] P4 (**NEW S549 D**) | name_tags.html | **A load renders the preview five times and the table twice** (the list, the font, the library's arrival or failure, the locale): 200 students → 5 renders of ~60 ms at 1× behind the 451 ms of load-time long tasks left after `2499371`; coalesce them behind one frame. | found S549

- [ ] P4 (**NEW S549 D**) | name_tags.html | **A keyboard move (↑/↓) rebuilds the whole table and every sheet per press** (three presses on 200 students: 3 table rebuilds + 3 renders, 425 ms at 1× before `2499371`, 227 after) — swap the two rows and renumber instead. | found S549

- [ ] P4 (**NEW S549 D**) | name_tags.html | **A structural edit rebuilds the 200-row table** (30 ms of script + the layout, ~55–75 ms at 1×, ~300 at 4×: the first key in the new row, Remove, Undo, a translit mode, the extra toggle, a list switch, a paste) — its three icon buttons are parsed from `innerHTML` 600 times; a template clone or an in-place row would do. | found S549

- [ ] P4 (**NEW S548 C**) | name_tags.html | **After a keyboard Remove, the Undo sits behind the focus**: the note is before the table, so from the 12th row Undo is 64 Shift+Tabs back (the live region does announce it). | found S548

- [ ] P4 (**NEW S544 audit — gate 2, content**) | data/hebrew_words.json | **One entry stacks tsere and patah (`טִיֵַּח`)** — the one real defect in 14,919 corpus strings (loop-findings S544, with the ~36 legitimate look-alikes); a corpus edit bumps `?v=` on every fetcher. | found S544

- [ ] P4 (**NEW S542 F — gate 2**) | FM, js/ivrit-saves.js, torah, parsha_emojis | **Retry copy diverges from "Try again / נסו שוב"** (FM, cloud status, the staff's HE; Parsha Emojis' "reload the page"). | found S542

- [ ] P4 (**NEW S541 C — gate 3**) | 14 pages | **Field edges are `--border`: 1.83:1 light, 1.22:1 dark** (1.4.11: 3:1). | found S541

- [ ] P4 (**NEW S540 H — gate 4**) | parsha_emojis.html, letter_learner.html | **At ≤800px the bulk-print popup's preview sits under every option** (PE 1.6k px down at 800, 2.7k on a phone; LL 1.0k / 1.8k). | found S540

- [ ] P4 (**NEW S539 I — gate 2**) | letter_learner.html | **The cursive tour's card step names neither the Vowels nor the Fonts tab** every cursive card shows. | found S539

- [ ] P4 (**NEW S538 D**) | parsha_emojis.html | **40 copies × 4 per sheet clone 240 sheets into the preview** (1.3 s @4×). | found S538

- [ ] P4 (**NEW S538 D**) | parsha_emojis.html | **The first open still measures every drawing** (~950 ms @4×); build the geometry with the icons. | found S538

- [ ] P4 (**NEW S537 G — gate 2**) | parsha_emojis.html | **With every sheet shrunk (landscape, Both) the popup's note names all 54 parshiyot** (539 chars). | found S537

- [ ] P4 (**NEW S536 M — gate 3**) | letter_learner.html | **A final-form card's glyph and name sit 10px above its row-mates'.** | found S536

- [ ] P4 (**NEW S536 M — F's**) | suite-wide | **In dark mode an unticked checkbox or radio is a white square.** | found S536

- [ ] P4 (**NEW S535 P — gate 2**) | classroom_dashboard.html | **Four confirms on synced data lack the `_cloud` wording** (text sizes, intermission, a day, a period). | found S535

- [ ] P4 (**NEW S534 N — gate 4**) | name_tags.html | **On a phone Remove sits 120–270px off-screen** until the table scrolls. | found S534

- [ ] P4 (**NEW S530 A — glyph census, rule first**) | dictionary, resources, flash, torah, FM, index | **Category and option emoji are still heard** (findings S530): content or decoration is unruled. | found S530

- [ ] P4 (**NEW S523 G — gate 3**) | hebrew_dictionary.html | **A long one-word headword overflows its card** (paper and phone). | found S523

- [ ] P4 (**NEW S522 M — gate 4**) | parsha_emojis.html | **On a phone (≤600px) Print still takes a row of its own** (EN 390: four rows). | found S522

- [ ] P4 (**NEW S522 M — gate 3 since S524**) | parsha_emojis.html, torah_trainer.html | **This week's badge drops its card's name 23px below its row-mates'**: on the border it needs ~9.5px of a 12/10px row gap (findings S524). | found S522

- [ ] P4 (**NEW S522 M — gate 3**) | parsha_emojis.html | **Today's lone card stops at 840px under a 1052px heading rule.** | found S522

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Real Words Matching prints "Hebrew Word Matching", ignoring the Title field** the other sheets honour. | found S512

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Name the Letter and Tracing print the default title "Hebrew Blends"** (only the subtitle is per-type). | found S512

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Name the Letter counts letters × vowels ("36 possible combinations" for 4 bare letters)**; Vowels Only blanks it. | found S512

- [ ] P4 (**NEW S512 H — design, gate 2**) | hebrew_blend_generator.html | **A quick start replays the full defaults, dropping the chosen word list and source.** | found S512

- [ ] P4 (**NEW S508 M — gate 2**) | dashboard | **"+ Add period" beside two icon buttons; "✨ Quick-start layouts…"** — the glyph belongs in the markup. | found S508

- [ ] P4 (**NEW S503 E, gate 2**) | torah_trainer.html | **Total Torah on: Chant says "(PocketTorah audio)"** (`verse_chant_aria`). | found S503

- [ ] P4 (**S502 A — radio-set twin**) | dictionary, resources | **Unnamed pressed rows**: dictionary mode, resources view (gate 2). | found S502

- [ ] P4 (**NEW S497 I — gate 2**) | classroom_dashboard.html | **A Hebrew first visit's demo message is English** (`DEFAULT_PRESET`, a `smoke-sync` canon). | found S497

- [ ] P4 (**NEW S492 N — tour engine**) | hebrew_dictionary.html | **The tour ring runs past the window on a full-width target**: `_tourReposition` clamps `left`, not the width. | found S492

- [ ] P4 (**NEW S483 C — gate 2**) | index.html | **Three `alert()`s stay**: "Use in all tools" repeats the status line; the Manual pane's two validation messages have no inline line (`#ivritStatus` is in the Automatic pane). | found S483

- [ ] P4 (**NEW S482 H — gate 2**) | torah_trainer.html | **"Select verses to copy…" opens the Copy bar with selection off** (as documented): one more click; a verse clicked meanwhile chants. | found S482

- [ ] P4 (**NEW S481 I**) | FM, i18n.js, flash, terms | **FM help's old layout; raw keys if a locale never loads; "Click Start", "use my location"** (findings S481; gate 2 ×2). | found S481

- [ ] P4 (**NEW S565 D; S567 re-measured**) | Hebrew_Font_Maker.html | **Auto-detect on a phone photo of a sheet makes three long tasks @4× (431 / 695 / 338 ms; @1× its top is 134 ms, not S565's 556)**: `adBinarize` (lumPlane → estimateBackground → flatten → Otsu) has no yield inside, but splitting it in `adRunDetection` takes the 695 only to ~400, since the first task is the 1800 px canvas's …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S562 N — unmeasured carriers**) | torah_trainer.html, hebrew_dictionary.html, flash_cards.html, classroom_dashboard.html | **The tip placement trope fixed in `4b16e61` (no room above or below → off the bottom of a phone held sideways) is the same code in 4 per-file copies**: the landscape probe opened no tip there at load (theirs sit in closed panels and drawers) — open them, then …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S556 M — pattern `live-region-display-none-while-empty`; the dictionary at the cap**) | hebrew_dictionary.html | **`#wlActiveBanner` and `#printSizeNote` leave the accessibility tree while empty** (inline `display:none` / `hidden`, both toggled by JS with their text): keep them rendered empty (`:empty{position:absolute;margin:0;padding:0;border:0}`, the S553 shape) and drop the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S554 M — hierarchy; the FM at the cap**) | Hebrew_Font_Maker.html | **The Settings tab's three group headings ("Add glyphs & languages", "Input mode", "Canvas") are 13 px serif under their own items' 11 px uppercase labels**, so a group reads lighter than its members; the `.ws-side-title` uppercase treatment, or the help modal's h4 weight, would give the group its rank (screens …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S550 G — a shared-block change: the `.ivrit` engine's six carriers + the hub; pattern `fixed-surface-missing-from-the-print-hide-list`**) | the `.ivrit` engine, js/ivrit-account.js, js/ivrit-saves.js | **The Merge/Replace ask overlay (an inline-styled fixed div with no id) and the account and saves modals have no print rule**: Ctrl+P with one open prints it over every sheet …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Sephardi haftarot and the holidays' maftirim are not offered**: `holiday-readings.json` carries `seph` and `fullkriyah.M` for every entry the table keys (the leyning builder's check could carry them). | found PR #313

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Shabbat Chazon's haftarah (Isaiah 1) is drawn in the Haftarah chart throughout**; the verses customarily chanted to Eicha's tune need a per-verse tune. | found PR #313

- [ ] P4 (**NEW PR #313**) | classroom_dashboard.html | **The dashboard's parsha line never names a special Shabbat** (Zachor, Parah, Shekalim…) though `HebCal.specialShabbat` now answers by date. | found PR #313

- [ ] P4 (**NEW 2026-10-03, gate 2 copy**) | hebrew_dictionary.html | **"Any of these letters" requires every ticked letter** (`onFilter`); the Hebrew label (כל אחת מהאותיות האלה) says so, the English label and its "Any:" chip don't. | found 2026-10-03

- [ ] P4 (**NEW S412 Pass H — five small ones; (1) FIXED S446 `c6c509ed`, (3) FIXED S448 `c54897da`, (4) FIXED S491 `adce6574`, (2) FIXED S497 `591a11ef`**) | flash_cards.html | **(5)** gate 2: the printed card …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S414 Pass F — gates 2/3 + K**) | chrome pages, the 7 tools, 404, CSV | gate 2: **(1)** dark mode's visible "Light", and FM's fullscreen "Show/Hide Panels" (S415), are not in their fixed toggle names (2.5.3); **(2)** "Back" goes to the home page (tools say "Home"); **(3)** 404 lists 4 of 8 tools. Gate 3: **(4)** Tour / Dark / Full Screen / Settings order differs per tool. K: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S394 census, retuned S395 — `04892f3` took the three SHADOWED ones that were accidents; what is left here is judgement, not dead code**) | hebrew_blend_generator.html | **The `.bingo-card-num` / `.bingo-grid` IDENTICAL twins and the `.bingo-card` SHADOWED one sit inside a deliberate later layer that re-declares the bingo shapes in print-safe literals, and `body.dark …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S394 — the non-generator half of the same census; all DIVERGENT, i.e. the earlier rule still contributes, so each needs reading rather than deleting**) | Hebrew_Font_Maker.html, classroom_dashboard.html, hebrew_dictionary.html, privacy.html, terms.html | **5 selectors declared twice with overlapping properties: FM `#fsPanelsBtn`; dashboard `textarea` and `.fr-tour`; dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — a real gap, shippable, but it is a new control + copy so it was not taken unattended-of-gate-1**) | js/ivrit-account.js + account.html | **`signOut({ scope: 'local' })` ends the session on this device only and no UI offers "sign out everywhere", so a teacher who loses a school laptop cannot revoke that device.** Supabase supports `scope: 'global'`; the shape is one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S380 Pass H — dead copy or a hint-logic choice; the copy half is gate 2**) | Hebrew_Font_Maker.html | **`nexthint_nikkud` ("Letters done! Place nikkud on {name} — {count} to go.") and the `export_nikkud_*` guard can never fire in the trace flow: `finalizeWithOutline` seeds `l.anchors` on every trace, so `coreLetterStats().unanchored` is always empty and the hint jumps from the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S377 Pass G — a CONTENT question (gate 2), so logged not shipped; if stray, one regex over `data/hebrew_words.json` + `?v=6→7` on the three fetching pages**) | data/hebrew_words.json | **Phrase entries …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S363 Pass H — GATE 2: Hebrew wording for the printed teacher copy; the sites are in loop-findings**) | hebrew_blend_generator.html | **With Header Labels = עברית the printed answer-key banner, `Answer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S327 Pass C — the one tile grid `41679da` could not lift; needs a layout decision**) | hebrew_blend_generator.html | **The real-words letter grid's names render at 7.2px** (`.rw-letter-tile .name` …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S321 Pass N arm 5 — on-screen keyboard ergonomics; the copy half is GATE 2**) | classroom_dashboard.html | **`#timerCustomInput` is `inputmode="numeric"` with an `MM:SS` placeholder, and the iOS numeric pad has no colon.** `timerSetCustom` also accepts plain digits as whole minutes, so the field works for "5" but the placeholder promises a format the keyboard cannot type. Either …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S311 Pass O — filed out of O; S335 M re-measured both M halves**) | `Hebrew_Font_Maker.html`, the help popup | **The help tab strip is 14 chips over 3 rows, 96px, crossed before any content on every tab at every width (the modal is max 640px, so 800 = 1280)** — a restructure (grouped tabs or a select) is gate 3; screenshots `m335/1280-light-en-help.png`, `m335/800-light-en-help.png`. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S285 Pass C — a cross-tool DIVERGENCE, filed for F rather than as a defect**) | classroom_dashboard.html vs the other four tooltip carriers | **The dashboard binds its tooltip to the `.tip-icon`; the other four bind the `.tip-wrap`.** `wire()` sets `tabIndex`/`role`/`aria-expanded`/`aria-describedby` on the inner icon, while `bindTip` sets them on the wrapper. Both are …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S258** - re-logged from the S257 candidate with the reason it was not taken; a geometry change, so **gate 3** if ever pursued) | Hebrew_Font_Maker.html | **`#rulerCorner.rl-corner` is 22x22, under the 24px touch floor, and cannot be fixed with a `min-height`.** Its `width`/`height` are both `var(--rl-w)` - the ruler thickness declared on `.rl-layer` (22px) - so the corner is the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S246 Pass M** — the FOURTH page with this exact shape, so it is now a suite-wide convergence question rather than a per-page note) | index.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245, name_tags S552) | **Four text sizes inside a 2.08px band: 12 / 12.8 / 13.12 / 14.08px.** `button.ie-btn`+`footer` at 12, `#darkBtn`+`.card-attr` at 12.8, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S230 Pass K**, arm 1 — the corpus's one genuine placeholder gap, recorded rather than fixed because the reason it exists is linguistic, not an oversight) | `locales/ui-strings.csv` | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S218 Pass K** — needs 4 newly authored Hebrew terms, so it is gate-2 work, not wiring) | hebrew_dictionary.html (`locales/ui-strings.csv`) | **Four part-of-speech values have no filter row and so still print English in the Hebrew UI.** `ce75604` wired 19 of the corpus's 23 values by reusing the filter panel's existing keys; the remaining four — **proverb (19 entries), definite …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — it is a mapping decision, not wiring) | hebrew_dictionary.html | **The part-of-speech badge prints raw corpus vocabulary** (`noun`, `verb`, `adjective`, … from `w.pos`, ~L2768) and stays English in the Hebrew UI. Unlike the rest of the S192 haul this is **not** authored-but-unreferenced: the string match to `dictionary.shoresh.pattern_noun` is coincidental (that key …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — same mapping-decision class as the pos badge above) | flash_cards.html | **The Colors-mode selection tiles label their swatches in raw English** (`.color-tile-label` renders `c.name` — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **Holam+rafe and shin-dot+rafe collision anchors** — `AddHebrewContextualGPOS.py`'s collision-avoidance anchors for above-mark pairs; today both attach at the shared above anchor and can overlap. Same contextual single-pos device the meteg pair uses, above class. | found: 2026-08-29, S283

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **The Yerushalam lamed-patah-hiriq rule and `jalt` wide-letter justification alternates** — `AddHebrewContextualGPOS.py` / `WideLetters.fea`. The jalt half overlaps the shipped ss02 wide forms (v5.33): the glyphs exist, only the `jalt` feature registration is missing. | found: 2026-08-29, S283

## Feature seeds (micro-features only; see the Micro-feature track in the session prompt)

- [ ] S | Hebrew_Font_Maker.html | **Auto-detect and the template link for the other alphabets**: the English, Cyrillic, Phoenician, Aramaic and Samaritan tabs have printed templates (`TEMPLATE_SPECS`) and sheet sizing already knows Latin and Cyrillic descenders, but Auto-detect matches and assigns Hebrew only, and the wizard's "Print a template sheet" prints the Hebrew sheet even with English …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | name_tags.html | **The English line in the class font**: a Font Maker font with English letters draws only the Hebrew line of a tag (the picker is "Hebrew font"); an "also for the English name" box when the font has Latin letters. | found S559 H

- [ ] S | trope_tutor.html | **A staff size for the projector**: the Learn staff stays 182×52 px (about 5 px between lines) at every width and Hebrew size while the example word grows to 69 px; a size setting, or one card shown big, lets the class read the melody from the back. | found S557 H

- [ ] S | name_tags.html | **Print only the students chosen** (a checkbox per row, or "this page only"): a new student mid-year prints the whole class again (25 students = 4 pages for one tag). | found S551 H

- [ ] S | name_tags.html | **The "no Classroom Dashboard classes" note links to the dashboard**, and the dashboard's class picker links back: the bridge is 3 clicks each way once a class exists, a dead end before. | found S551 H

- [ ] S | parsha_emojis.html | **Each card prints its own coloring sheet** (the popup with that parasha alone, as a Letter Learner card does): next week's sheet is 4 clicks and no chip marks this week's. | found S540 H

- [ ] S | parsha_emojis.html | **A split week names the other schedule's parasha** ("In Israel: Sh'lach"): an Israeli teacher sees the Diaspora card unless the Torah Trainer says Israel. | found S540 H

- [ ] S | letter_learner.html | **An open card puts `?letter=` in the URL.** **Picked S526.** | found S526 H

- [ ] S | letter_learner.html | **"Vowels to show": Select all / Clear.** **Picked S526.** | found S526 H

- [ ] S | resources.html | **The Links filters live in the address** (`?cat=&age=`): bookmarkable, kept on reload. | found S454 H

- [ ] S | hebrew_dictionary.html | **Word Lists offers "Save the N selected words"** while a selection exists (it says "No word lists yet…"). | found S440 H

- [ ] S–M | flash_cards.html (reads the dashboard's class lists) | **Make student profiles from a class list.** A class already in the dashboard (`hebrewDashboard_settings.rosters`) is re-typed one `prompt()` at a time; a "From a class list…" choice is ~50 lines + 3 keys, a handshake pair. | found: S412 Pass H

- [ ] S | flash_cards.html | **Find a child in Save Results' profile list.** With 25 profiles the picker opens scrolled to its new-name box (its title out of view) and a child is a scroll away; typing could filter the list (typing an existing name already saves to that child, unsaid). | found: S566 Pass H

- [ ] S | flash_cards.html | **Speech speed reachable mid-drill.** `speakWord()` reads `#ttsRateSlider` live, but the slider sits in `#panelAdvanced` on the setup screen, so a slower 🔊 Hear costs End Practice Early → Advanced → drag → restart. A −/+ pair beside `#fcSpeakBtn` writing the same slider is the torah `#ttLoopPauseBar` mirror shape; ~35 lines, 2 CSV keys, no storage. | found: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Pause the drill timer.** `startTimer()` is a bare `setInterval`, `stopTimer()` is terminal (clears AND hides `#timerDisplay`; callers: `showResults`, `returnToSetup`, `startTimer`), so an interruption inflates a tracked time or burns a limit. A pause chip on `#timerDisplay` reusing `formatTimerSecs`/`updateTimerDisplay`; ~40 lines, 2 CSV keys, transient state. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | classroom_dashboard.html | **One-deep undo in the week editor.** `applyCalendarImport` replaces `settings.scheduleWeek` wholesale, `clearWeekDay` / `copyWeekDayToWeekdays` / `removeWeekPeriod` guard with a native `confirm()` at most, and `weekChanged()` (the choke point) saves immediately with no history. A `weekSnapshot()` at the head of the ~8 mutators + `undoWeek()` + one toolbar …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Calmer Learn cards for young grades: examples per card (2/3/4) and a primary-name-only switch.** | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **The mark in its phrase on its Learn card, and the chart's clause order as a family order.** | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Drill answer count (2/3/4) and a second chance** before a miss counts. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | trope_tutor.html | **Drill sounds and a finish celebration**, each switchable and still under reduced motion. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Kid mode preset**: one switch for 2 answers, a second chance, the slow tune, 2 examples and bigger Hebrew. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | trope_tutor.html | **Share this setup as a `?s=` link** (length, scope, question types, melody) for a teacher to send the class. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | trope_tutor.html | **Student profiles: per-child mastery** on a shared class device (flash cards' model) — not micro. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | trope_tutor.html | **Printable mastery report**: the mastery grid, personal best and missed marks on one sheet. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **A typed confirmation before “Reset mastery & personal best”** so a curious student can't wipe a class record. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **A "what comes next?" drill**: a chart phrase with one mark hidden to pick, or its marks to put in order. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **Context variants on the Learn card**: munach's shapes and the tevir-context mercha and kadma, each a small staff with its phrase. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | trope_tutor.html | **The end-of-aliyah sof pasuk on the sof pasuk card** (Torah row 41, High Holiday rows 30–33; row 41 settled from clean scans). | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | torah_trainer.html | **Mark each aliyah's last verse** as the one sung to the end-of-aliyah sof pasuk, linking to that card. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **A munach legarmeh card** (munach + the legarmeh line) with its own figure and examples. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **A one-sheet printable phrase chart** in the teacher's chosen key: the phrases, their marks and a staff each. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | torah_trainer.html | **High Holiday recordings for the Rosh Hashanah and Yom Kippur readings** — needs a licensed recording source; not micro. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | torah_trainer.html (+ trope_tutor.html) | **A staff for a whole reading** (verse → parasha) drawn and played under the Hebrew, from `trope_phrases.json`; `docs/tropepatterns.md` § G is the design and `docs/trope_contexts_report.md` the gaps. | found: 2026-09-25, maintainer

- [ ] S–M | hebrew_blend_generator.html | **Print only the student pages, or only the answer keys** — a Class Set with keys prints its pages interleaved. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | hebrew_blend_generator.html | **1-Letter: every chosen letter once, in alef-bet order, with or without vowels** (a bare א–ת sheet). | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | hebrew_blend_generator.html | **A "Previous sheet" button after Regenerate.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | hebrew_blend_generator.html | **Trace your own lines: students' names or this week's words, in Hebrew or English.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | hebrew_blend_generator.html (reads the dashboard's class lists) | **Each child's name on their Class Set version, from a dashboard class list.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | classroom_dashboard.html | **The running timer stays visible on the Intermission screen.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M (dual) | classroom_dashboard.html | **Today's whole schedule as a strip on the board**, not just Now and Next. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | flash_cards.html | **"All N words, once each" for a word-list deck.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Print the card sheet in the drill's vowel colours.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | flash_cards.html | **Paste this week's words into a new word list from inside Words mode.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L (dual) | flash_cards.html | **Two-sided cards the teacher types, in any language** (English sight words) — not micro. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M (dual) | hebrew_dictionary.html | **A search typed in everyday spelling finds the pointed word** (כיתה → כִּתָּה). | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | hebrew_dictionary.html | **"Every word must have: [vowel]"** for this week's vowel. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | hebrew_dictionary.html | **A "Last letter" row in Filter by Letter** (words ending in ה or ת). | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | hebrew_dictionary.html | **"Letters taught so far": words made only from allowed letters.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M (dual) | Hebrew_Font_Maker.html | **Auto-detect reads the English (and other-alphabet) template sheets.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | Hebrew_Font_Maker.html | **The preview PDF's cover prints the teacher's own sample text.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | Hebrew_Font_Maker.html | **Export an English-only handwriting font** — not micro. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

## Awaiting the maintainer (an action or an answer only the maintainer can give; a session that resolves one moves it to Done)

- [ ] P3 (**NEW — the maintainer's review, by design**) | trope_review.html, data/trope/trope_approvals.json | **All 20 trope traditions approved; 19 (2026-10-28, at the maintainer's request) without the row-by-row check against their scans.** Still worth checking on `trope_review.html`: the 14 printed 3s kept as written and the raised-fifth spellings of six JE columns; a corrected row hides its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S560 C — GATE 4: short windows; deferred unattended; `c560/shots/short-zoom400-en-light.png`, `short-zoom400-he-dark.png`, `short-i13L-en-light.png`**) | flash_cards.html | **At 400% zoom (1280×1024 → 320×256) the sticky header (112–121px) and Start bar (136–138) leave the setup screen 8px in EN and none in HE** (1366×768 at 200%: 181–184 of 384; iPhone 13 landscape 140 of 342). …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S556 M — GATE 3: the suite's default vowel palette, four tools; deferred unattended; `m556/shots/1280-light-en-color.png`**) | hebrew_dictionary.html (+ dashboard, generator, flash, torah) | **The default scheme's cholam gold (#bb8800) reads 2.99:1 on the cream** — under 3.0 for the 32px headwords it colours and 4.5 for the picker's 17.6px examples (teal 3.16, tzere's purple 3.97, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S553 V — precache size vs offline completeness, the maintainer's call**) | resources.html, sw.js | **The Resources page's four partner fonts (Reuben, TzviScript, its Stroke Guide, Lakhish Bold; 56 KB) are not precached**, so offline the Fonts section's specimens render in a fallback face until the page was visited online once (every other same-origin file the 17 precached pages …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S549 D — an architecture choice, the maintainer's call**) | js/i18n.js, locales/*.json | **Every page downloads the whole suite's locale**: `en.json` 610 KB raw / 166 KB gzip, `he.json` 769 / 184, for a page's own tenth of the 6,789 keys (a first visit's largest file; the SW caches it once). A per-page split or a lazily fetched second half changes the build (`build-locales.js`) …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**NEW S465 G — maintainer**) | starting-fonts/manifest.json | **14 fonts' `copyright` is empty**: re-stage with `/addOSFont --force` (detector fixed `3609c19`; ids: findings S465). | found S465

- [ ] P3 (**NEW S510 D; shared sw.js — the maintainer's call**) | sw.js | **Pages, scripts and /locales/ are fetched with cache:'no-store', so a returning visitor re-downloads ~370 KB per page view although GitHub Pages answers 304**; `'no-cache'` keeps always-revalidate and made the same reload 0 B (findings S510). | found S510

- [ ] P3 (**NEW S451 G — gate 2, the maintainer's call**) | torah_trainer.html | **In the Trope staff layout the student handout ignores Font size and "Hide cantillation"**: the staff prints at screen scale (Hebrew 27.4pt, Large and Extra large alike) and its notes carry every trope; either print a text layout or say so beside the options. | found S451

- [ ] P3 (**NEW S292 Pass H — the pass's headline finding; GATE 2 ASKED, maintainer chose "log it only, change nothing"**) | hebrew_dictionary.html | **"⭑ Save as Word List…" is discoverable only from a theme.** Word …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S543 B — maintainer**) | the 5 loader carriers | **The translit library has no working second source** (jsDelivr needs an import map, or self-host it). | found S543

- [ ] P4 (**S430 A — the maintainer's call**) | torah_trainer.html | **The reading header keeps "Aliyah {n}" English in the Hebrew UI** beside a translated cycle label (also the copy heading, the handout). | found S430

- [ ] P4 (**NEW S418 — the maintainer's dashboard**) | Supabase project | **Security advisor: leaked-password protection is off**; passwords are never used (e-mail code + Google), so enable the toggle or accept it as moot. | found S418

- [ ] P4 (**NEW S378 Pass D — GATE 2: a preview-size choice, deferred unattended**) | hebrew_dictionary.html | **"Select all matching" on the unfiltered corpus is a 339 + 274ms block @1× (1.7s @4×) and only 27ms of it is JS: the browser lays out the 13,081-line bulk textarea.** Proposal: cap the textarea preview (first 500 lines + "…and N more") while copy/export keep the full set. | found S378

- [ ] P4 (**NEW S361 Pass N — GATE 4 (phone layout), deferred unattended; screens `n361/shot-setup-*.png`**) | flash_cards.html | **The sticky Start bar also carries the Print card sheet button: 136px = 24% of an iPhone SE, 20% of an iPhone 13, 40% in landscape (the S244 header precedent was 21.5%, approved).** Proposal: at ≤440px only Start stays sticky; Print flows below. | found S361

- [ ] P4 (**NEW S361 Pass N arm 1 — GATE 4 (landscape phone), deferred unattended; `n361/shotL-card-*.png`**) | flash_cards.html | **In iPhone 13 landscape (750×342) the card screen shows 137px of the 330px card: sticky header 64 + progress + stats bar (136–191) push it to y=205.** Proposal: a landscape height query hides the stats bar or shrinks the card. | found S361

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`; wire or prune: maintainer's call**) | torah + trope (`ui-strings.csv`) | **5 credit rows (`torah.footer.sefaria_credit`/`cantillation_credit`, `torah.audio.speeds_credit`, `trope.footer.sefaria_credit`/`cantillation_credit`): translated, referenced nowhere; markup has anchors → `data-i18n-html` cells.** | found S360

- [ ] P4 (**NEW S390 Pass P — BACKEND BOUNDARY: changing it needs a redeploy, so maintainer work, not a loop fix**) | db/functions/delete-account/index.ts | **The production Edge Function's `ALLOWED_ORIGINS` still carries `http://localhost:8080` and `http://127.0.0.1:8080` beside the two real origins.** Low risk (a web attacker cannot forge `Origin`, and the JWT is the real gate), but it is dev …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S364 Pass G — GATE 2: a default-output choice, deferred unattended; numbers + screens in loop-findings (`g364/out/board-print-en-dark.png`)**) | classroom_dashboard.html | **With background graphics ON, the board's day plates print in their screen colours under the print block's navy ink (`.day-item.colored { color: var(--text) }`): 1.12:1 on Friday's indigo, 1.58 purple, 2.58 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S337 Pass G — GATE 2: a default-behaviour choice, deferred unattended**) | Hebrew_Font_Maker.html | **The tool's two PDFs print on different paper: the Preview PDF specimen is hardcoded A4 (595×842 pt, `format:'a4'`) while the five template sheets are hardcoded Letter (612×792 pt, `format:'letter'`, and the generator's PDFs are Letter too).** A US teacher's specimen comes out …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S332 Pass L — GATE 2 / maintainer fact; deferred unattended**) | index.html | **The hub's Organization `sameAs` and the visible "Created by" link both point at `https://harrisonbleiberg.wpcomstaging.com/`, a WordPress.com staging address.** If a public author URL exists (or the site has moved), both should carry it; if the staging address IS the intended public home, waive this. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S333 Pass K — GATE 2: four Hebrew terms need authoring; deferred unattended. The S326 candidate's authored half shipped `ecd0720`**) | classroom_dashboard.html + flash_cards.html …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S546 P — a shared-module rule, the maintainer's call before a loop fix**) | js/ivrit-saves.js (flash_cards, torah_trainer, trope_tutor, classroom_dashboard, index) | **A brand-new device's first sign-in says "Your account's … settings replaced the ones this device had before you signed in" and offers a download of nothing but the page's defaults** on those five pages (each writes …[full text: IMPROVEMENT_ARCHIVE.md]

## In progress

_(none)_

## Done

- [x] 2026-10-29 | (S570 close-out) | branch/deploy note | **S570 = D on the Torah Trainer (5th: S184/S185 → S307 → S424 → S570; 143 commits since): cold 8 cells × 1× / 4× vs the S424-era page on real Vayera, 6 configurations, 21 interactions, Slow 4G, Esther, idle, heap. FOUND 7, FIXED 2 (+2 flash print P3s); 2 probes. Branch …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `5a04c5a8` | flash_cards.html, sw.js | (S570) **The Hebrew progress report and certificate print upright and unspaced** (`html[lang="he"]` resets for `.fcr-note`, `.fcc-lead`, `.fcc-suite`, `.fcc-seal-w` in the print block; patterns `hebrew-faux-italic` + `latin-tracking-on-hebrew-labels`). | `flash/italic.mjs`: print-media census × 4 cells, Hebrew italic 3 → 0, tracked 1 → 0; …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `1b368a15` | flash_cards.html, sw.js | (S570) **A Learning Path drill's printed results leave out the level strip's buttons** (`.ladder-strip-actions` joins the print block's hidden screen controls). | `flash/strip.mjs` by keys × 4 cells: under print 2 → 0, in the PDF text 2 → 0, the line prints, 1 page

- [x] 2026-10-29 | `79527496` | torah_trainer.html, sw.js, torah-and-trope.md | (S570) **The Trope staff re-measures its words when a font lands and re-wraps only if one moved** (`staffRemeasure`; the memo is keyed by the font's name). | probe `S570-torah-staff-font-remeasure.mjs` (fails on the parent); renders 3 → 2, markup identical; …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `61cd88a2` | torah_trainer.html, sw.js, torah-and-trope.md | (S570) **The first verse no longer waits for the Total Torah manifest on PocketTorah** (awaited only on a Total Torah visit; `ttManifestLanded` re-syncs the picker). | probe `S570-torah-manifest-off-the-first-render.mjs` (fails on the parent); Slow 4G 3,927 → 2,968 ms @1×, 4,632 → …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | (S569 close-out) | branch/deploy note | **S569 = G on flash (its 5th: … S423 → S569; 88 commits to the page since): the report (3 profiles × 4 cells × Letter / A4 at 0.4 / 0.5) and the certificate by real clicks, the card sheet (5 decks × single / duplex × EN light / HE dark, from setup and from results), the drill and results printed plain, `.ivrit` (3 scopes × 2 cells), share …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `33f43c64` | classroom_dashboard.html, locales | (S569) **Schedule Sync's countdown and time left read in Hebrew in the Hebrew UI** (4 keys `dashboard.schedule.dur_*`, the English byte-identical; the legacy engine too). | `g569/dash.mjs`, a seeded week at 4 fixed clocks + the legacy engine vs HEAD: EN byte-identical 5/5, HE Latin units 5 → 0; 8 cells 0 page errors

- [x] 2026-10-29 | `3c04af41` | letter_learner.html | (S569) **Keyboard focus stays clear of a card dialog's sticky head** (the dialog's `scroll-padding-block-start` from `--ll-head-h`, a `ResizeObserver` in `wireDialog`; pattern `focus-hidden-under-a-sticky-bar`, its last carrier). | `g569/llwalk.mjs`, Tab + Shift+Tab over every tab × 6 cells vs HEAD: wholly hidden 1–4 → 0 (the Vowels tab; 3 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `9388361f` | flash_cards.html | (S569) **A share link to an emoji or All Dictionary deck opens that deck on a first visit** (the link fetches the deck's corpus before applying; `fetchAllWordsData` gains an in-flight guard). | `g569/share2.mjs`, 5 decks by Copy Link → a fresh profile vs HEAD: HEAD emoji drilled the student's own blends, dictionary stayed on setup → both start …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `a7d5606d` | flash_cards.html, sw.js | (S569) **The results screen printed from dark mode prints the light theme's ink** (6 tokens restated in the print block, 3 dark rules pointed at the print navy; patterns `incomplete-print-token-reset`, `dark-literal-escapes-the-print-tokens`). | `g569/darkdiff.mjs` + `darkdiff2.mjs` vs HEAD: dark-vs-light print diffs 18 → 0 (a ladder drill …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | (S568 close-out) | branch/deploy note | **S568 = M on the Torah Trainer (its 2nd: S422 → S568): 31 views × 8 cells by real clicks (248 shots; real fonts, Sefaria stubbed from the MAM phrases), census ~16,000 text nodes, hover, Tab rings, dark fills, header gate, RTL sentences, live regions — every plant fired. FOUND 6, FIXED 2 + 4 P4; + the generator's Self-Check paper (queue) …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `f6d4a231` | hebrew_blend_generator.html | (S568) **Both Self-Check sheets print and export the card face the screen shows, unmirrored** (print and html2canvas flattened the 3D flip: every card's back — the answer, mirrored — over its front; the blend fronts' "tap to reveal" off paper too). | `m568/flipprint.mjs` (pypdf matrices) × 8 runs vs HEAD: mirrored runs 80–256 → 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `398ec8aa` | hebrew_blend_generator.html | (S568) **Self-Check's "tap to flip" stays on screen, off paper** (the print block + exportPDF's clone; S563's G P4). | `m568/fix3-verify.mjs` × 4 cells vs HEAD: screen 30 → 30, the print PDF 30 → 0, Export PDF's clone 30 → 0, one page

- [x] 2026-10-29 | `203370c8` | torah_trainer.html | (S568) **Dark mode's selected-verse chips (4.15:1) and the chosen font's credit (3.71:1) pass AA** (`#adb6c9`, the neighbours'; pattern `contrast-below-AA-on-a-tinted-or-coloured-plate`). | `m568/fix2-verify.mjs` × 8 cells vs HEAD: sub-AA 4 → 0 and 1 → 0 in dark; gold hover and navy-on-gold active still win; light unchanged

- [x] 2026-10-29 | `7f88d10d` | torah_trainer.html, sw.js | (S568) **In the Trope staff layout the trope clause line no longer crosses the transliteration** (a staff cell's 1.3 leading put the Latin 0.2em of the Hebrew higher; the Latin and its box get it back). | `m568/fix1-verify.mjs` × 8 cells × 3 modes vs HEAD: gap −3.6 → +1.2 px, the Latin inside its box, without the underline look geometry …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | (S567 close-out) | branch/deploy note | **S567 = P on the dashboard (its first since S421; 113 commits to the page): all 7 smokes with the pinned SDK, static arms 3–7 (59 checks, 7 plants fired), live read-only, and the page's signed-in editors by real clicks on the fake cloud with HEAD the control. FOUND 2, FIXED 1 (Bulk preset edit's overwrite) + 1 shared-module P3; + the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | (struck) | Hebrew_Font_Maker.html | (S567) **"Auto-detect's Apply yields only every 4th crop" struck**: every crop already awaits `loadImg` (a task boundary), and Apply's long tasks are outside the loop (@1× top 78 ms; @4× 335 / 266). | `d565/sheet.mjs` @1× and @4× on the S567 tree

- [x] 2026-10-29 | `cfb160c2` | name_tags.html | (S567) **A carried row's number stays readable in dark mode** (`tr.nt-dragging .nt-num` takes `--text`; pattern `contrast-below-AA-on-a-tinted-or-coloured-plate`). | `p567/nt-drag-contrast.mjs`, a real pointer holding the first grip × EN/HE × light/dark vs HEAD: dark 3.91 → 9.33, light 5.32 → 12.81, resting rows unchanged, Escape leaves no tint

- [x] 2026-10-29 | `3e7be195` | hebrew_blend_generator.html | (S567) **The Hebrew on every worksheet carries `lang="he"` in the English UI** (UX rule 8, at each builder: reading cells, self-check, tracing, Name the Letter, number practice, bingo's header row, gematria, the word search, the crossword, the scanned key). | `p567/gen-lang.mjs` × 25 shapes (Real Words drills by clicks): 1,348 Hebrew …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `73ac80d1` | classroom_dashboard.html | (S567) **Escape closes a hovered tip and a mouse can move onto it** (torah's `f59d609` ported; pattern `hover-tip-not-dismissible-or-hoverable`, its last carrier). | `p567/dash-hovertip.mjs` + `swm-hovertip.mjs`, 7 of 8 tips × EN light 1280 / HE dark 800 vs HEAD: the drawer or week editor closed by Escape 7 → 0, not hoverable 7 → 0, no …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `a0a45526` | classroom_dashboard.html, sw.js, scripts/smoke-sync.mjs, dashboard.md | (S567) **Bulk preset edit saves only the fields the teacher changed, onto each preset as it stands** — a download of another device's preset that landed while the editor was open is no longer sent back over it (`bpeEdits`). | smoke-sync D39 (new) fails on HEAD (2 presets counted, Monday …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | (S566 close-out) | branch/deploy note | **S566 = H on flash (first since S412; 93 commits): 6 lessons by real input × EN light 1280 / HE dark 800 + the student cell (1366 windowed and 657, fullscreen 1024 / 1280 / 1366) and the Learning Path; FOUND 8, FIXED 2 (the unreached-card tally, the results grid at gate 3) + the hover-tip port to trope and the dictionary.** Gates: gate 3 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `63c43a1` | hebrew_dictionary.html | (S566) **Escape closes a hovered tip and a mouse can move onto it** (torah's `f59d609` ported; pattern `hover-tip-not-dismissible-or-hoverable`). | `h566/dict-hovertip.mjs` × 5 sidebar tips (folds opened by clicks) × EN light 1280 / HE dark 1024 vs HEAD: 5/5 + 5/5 → 0 / 0, no setting flipped, keyboard 5/5, touch as before

- [x] 2026-10-29 | `3a401e7` | trope_tutor.html | (S566) **Escape closes a hovered tip and a mouse can move onto it** (torah's fix ported; pattern `hover-tip-not-dismissible-or-hoverable`). | `h566/trope-hovertip.mjs` × 3 tips (Learn's key bar, Settings) × EN light 1280 / HE dark 800 vs HEAD: 3/3 + 3/3 → 0 / 0, the view unchanged, keyboard 3/3, touch as before

- [x] 2026-10-29 | `91c3e41` | flash_cards.html, sw.js | (S566) **The results list is a compact grid, so Redo and Practice Mistakes stay on screen** (above 520px; a narrow chip wraps its transliteration; the phone and `#profileHistory` unchanged; gate 3 answered). | probe `S566-flash-results-grid.mjs` fails 3/4 on HEAD, passes 4/4 (Mistakes ends 685–687 of 720–768); 6 deck types × 3 widths, 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-29 | `2834cc5` | flash_cards.html | (S566) **A card the drill never reached is no longer counted as a weakness** (`analyzeWeaknesses` skips score null; `collectMissedCards` takes only the wrong). | probe `S566-flash-unreached-not-missed.mjs` fails 3/3 on HEAD, passes 3/3; viewer, weak deck and report by clicks, a seeded complete drill identical on both trees

## Metrics

### Per-session log (one line per session)

- 2026-10-29 | **S570** | iters: 5 | tools: torah ×2, flash ×2, torah-and-trope.md, scripts/loop, sw | patterns fixed: hebrew-faux-italic + latin-tracking-on-hebrew-labels ×1 | pass run: D (torah, 5th) | SW: v1118→v1122

- 2026-10-29 | **S569** | iters: 5 | tools: flash ×2, letter_learner, dashboard, locales, sw | patterns fixed: incomplete-print-token-reset + dark-literal-escapes-the-print-tokens ×1, focus-hidden-under-a-sticky-bar ×1 | pass run: G (flash, 5th) | SW: v1117→v1118

- 2026-10-29 | **S568** | iters: 5 | tools: torah ×2, generator ×2, sw | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: M (torah, 2nd) | SW: v1116→v1117

- 2026-10-29 | **S567** | iters: 5 | tools: dashboard ×2, generator, name_tags, scripts, dashboard.md, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×1, contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: P (dashboard, first since S421) | SW: v1115→v1116

- 2026-10-29 | **S566** | iters: 5 | tools: flash ×2, trope, dictionary, scripts/loop, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×2 | pass run: H (flash, first since S412) | SW: v1114→v1115

- 2026-10-28 | **S565** | iters: 5 | tools: FM ×2, dashboard, flash, font-maker.md, scripts/loop, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×1 | pass run: D (fontmaker, 4th) | SW: v1113→v1114

- 2026-10-28 | **S564** | iters: 5 | tools: dashboard ×2, dictionary, torah, scripts/loop, sw | patterns fixed: focus-hidden-under-a-sticky-bar ×1, hover-tip-not-dismissible-or-hoverable ×1 | pass run: H (dashboard, 4th) | SW: v1112→v1113

- 2026-10-27 | **S563** | iters: 5 | tools: generator ×2, trope, letter_learner, name_tags, flash, sw | patterns fixed: fixed-control-positioned-outside-the-viewport ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: G (generator, 4th) | SW: v1104→v1105

- 2026-10-27 | **S562** | iters: 5 | tools: trope ×2, generator, FM, smoke-fontmaker, font-maker.md, sw | patterns fixed: install-banner-over-a-sheet's-bottom-controls ×1, fixed-control-positioned-outside-the-viewport ×1 | pass run: N (trope, 3rd) | SW: v1103→v1104

- 2026-10-27 | **S561** | iters: 5 | tools: FM ×2, ivrit-projects, generator, smoke-fontmaker, smoke-tools, accounts-and-cloud.md, font-maker.md, sw | patterns fixed: focus-hidden-under-a-sticky-bar ×1 | pass run: P (fontmaker, first alone) | SW: v1102→v1103

- 2026-10-27 | **S560** | iters: 5 | tools: flash ×2, torah, FM, sw | patterns fixed: focus-hidden-under-a-sticky-bar ×2 | pass run: C (flash, 6th) | SW: v1101→v1102

- 2026-10-26 | **S559** | iters: 5 | tools: FM ×2, name_tags, trope, name-tags.md, sw | patterns fixed: — | pass run: H (fontmaker, 5th) | SW: v1100→v1101

- 2026-10-26 | **S558** | iters: 5 | tools: trope ×2, torah, letter_learner, name_tags, shared-components.md, sw | patterns fixed: dark-base-rule ×1 (2 carriers), tour-step-in-a-hidden-view ×1 | pass run: M (trope, 3rd) | SW: v1099→v1100

- 2026-10-26 | **S557** | iters: 5 | tools: trope, FM, dictionary ×2, shared-components.md, sw | patterns fixed: tour-step-in-a-hidden-view (NEW) ×1, dark-hover ×2, dark-navy-fill ×1 | pass run: H (trope, 5th) | SW: v1098→v1099

- 2026-10-26 | **S556** | iters: 5 | tools: dictionary ×2, flash ×2, sw | patterns fixed: contrast-below-AA ×1, text-field-16px ×2 | pass run: M (dictionary, 3rd) | SW: v1097→v1098

- 2026-10-26 | **S555** | iters: 4 | tools: flash ×2, name_tags, sw | patterns fixed: install-banner ×1, horizontal-overflow ×1, dark-base-rule ×1 | pass run: N (flash, 3rd) | SW: v1096→v1097

- 2026-10-26 | **S554** | iters: 5 | tools: FM ×2, locales (FM help + FAQ, dictionary, generator, privacy), name_tags, scripts/loop, sw | patterns fixed: dark-navy-fill ×2, latin-sentence-boundary (NEW) ×1 | pass run: M (fontmaker, 3rd) | SW: v1095→v1096

- 2026-10-23 | **S553** | iters: 4 | tools: sw, name_tags ×2, scripts/loop | patterns fixed: sub-floor ×1, live-region-display-none ×1 (+ shown-with-its-text ×1) | pass run: V (first) | SW: v1080→v1080

- 2026-10-23 | **S552** | iters: 4 | tools: name_tags ×2, index, generator, dashboard, flash, sw | patterns fixed: dark-navy-fill ×1 (4 carriers), dark-base-rule ×1 | pass run: M (name_tags, first) | SW: v1079→v1080

- 2026-10-23 | **S551** | iters: 3 | tools: name_tags ×2 | patterns fixed: — | pass run: H (name_tags, first) | SW: v1079→v1079

### Tool coverage (last-touched date per tool)

- **Snapshot S570 (2026-10-29):** sw.js, torah, flash, torah-and-trope.md, scripts/loop, loop-findings, loop-patterns S570 · letter_learner, dashboard, locales, CSV S569 · generator S568 · name_tags, scripts, dashboard.md, sitemap S567 · trope, dictionary S566 · FM, font-maker.md S565 · projects, accounts-and-cloud.md S561 · name-tags.md S559 · shared-components.md S558 · privacy S554 · ops.md, loop-passes S553 · i18n.md, index S552 · parsha_emojis S550 · resources, contact S549 · skill, ledger scripts S544 · i18n.js S541 · …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (one status line per pattern — shape, owner, detection and record: docs/reference/loop-patterns.md)

- `focus-hidden-under-a-sticky-bar` | ACTIVE | owner C | det: recipe | last S569 | streak 0

- `hover-tip-not-dismissible-or-hoverable` | ACTIVE | owner C | det: recipe | last S567 | streak 0

- `tour-step-in-a-hidden-view` | ACTIVE | owner A | det: recipe | last S558 | streak 0

- `dark-hover-resolves-to-the-rest-colour` | ACTIVE | owner A | det: recipe | last S558 | streak 1

- `latin-sentence-boundary-in-hebrew-prose` | ACTIVE | owner M | det: scripts/loop/detect-latin-sentence-boundary-in-hebrew-prose.mjs | last S554 | streak 0

- `offscreen-sheets-laid-out-on-every-rebuild` | ACTIVE | owner D | det: recipe | last S550 | streak 0

- `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

- `defaults-filed-as-the-device's-own-at-first-sign-in` | ACTIVE | owner P | det: recipe | last S546 | streak 0 | hits 6

- `selected-state-lost-in-forced-colors` | ACTIVE | owner C | det: recipe | last S549 | streak 0

- `live-region-shown-with-its-text` | ACTIVE | owner G | det: recipe | last S553 | streak 0

- `abs-child-escapes-its-scroller` | ACTIVE | owner N | det: recipe | last S555 | streak 1

- `empty-result-not-announced` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `print-trailing-padding-adds-a-sheet` | ACTIVE | owner H | det: recipe | last S530 | streak 1

- `unseen-hit-box-over-controls` | ACTIVE | owner C | det: recipe | last S530 | streak 1

- `layout-read-per-grid-at-build` | ACTIVE | owner D | det: recipe | last S524 | streak 0

- `dark-palette-baked-into-paper` | ACTIVE | owner G | det: recipe | last S563 | streak 1

- `tour-not-following-a-live-switch` | ACTIVE | owner K | det: recipe | last S522 | streak 0

- `overlay-scoped-dialog-keys` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `group-toggle-wipes-a-sibling-group` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `infinite-box-shadow-pulse-repaints-every-frame` | ACTIVE | owner D | det: recipe | last S511 | streak 0

- `new-page-print-block-without-the-ink-remap` | ACTIVE | owner G | det: recipe | last S550 | streak 1

- `page-drops-a-field-it-cannot-apply` | ACTIVE | owner P | det: recipe | last S507 | streak 0

- `theme-token-on-an-always-dark-surface` | ACTIVE | owner N | det: recipe | last S555 | streak 1

- `data-edit-under-an-unchanged-buster` | ACTIVE | owner E | det: recipe | last S503 | streak 0

- `root-var-per-input` | ACTIVE | owner D | det: recipe | last S497 | streak 1

- `dark-palette-on-the-element` | ACTIVE | owner G | det: recipe | last S495 | streak 0

- `count-noun-without-a-one-form` | DRAFT | owner I | det: none | last S533 | streak 0

- `busy-disabled-button-drops-focus` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `hidden-input-anchored-outside-its-scroller` | ACTIVE | owner C | det: recipe | last S499 | streak 0

- `hebrew-faux-italic` | ACTIVE | owner M | det: recipe | last S570 | streak 0

- `fixed-toast-duration-shorter-than-its-text` | ACTIVE | owner F | det: recipe | last S487 | streak 0

- `centred-fixed-box-shrinks-to-half-the-viewport` | ACTIVE | owner F | det: recipe | last S484 | streak 0

- `shared-module-fallback-literal-without-a-dark-twin` | ACTIVE | owner C | det: recipe | last S483 | streak 0

- `rtl-copy-names-the-english-side` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `copy-names-a-control-by-a-label-it-lacks` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `screen-frame-prints-as-rails` | ACTIVE | owner D | det: recipe | last S480 | streak 0

- `enter-ignored-beside-its-own-button` | ACTIVE | owner B | det: recipe | last S472 | streak 0

- `placeholder-keeps-the-browser-gray` | ACTIVE | owner F | det: recipe | last S470 | streak 0

- `header-wrap-gate-below-its-ceiling` | ACTIVE | owner M | det: recipe | last S568 | streak 5

- `latin-tracking-on-hebrew-labels` | ACTIVE | owner H | det: recipe | last S570 | streak 0

- `forward-arrow-points-back-in-rtl-copy` | ACTIVE | owner N | det: recipe | last S555 | streak 3

- `share-link-writes-the-teachers-saved-preferences` | ACTIVE | owner P | det: recipe | last S472 | streak 1

- `bulk-apply-skips-a-renderer-the-control-runs` | ACTIVE | owner K | det: recipe | last S472 | streak 1

- `radio-set-without-a-question` | ACTIVE | owner B | det: recipe | last S527 | streak 0

- `native-input-display-none-under-its-label` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `stale-tab-flush-writes-its-old-copy` | ACTIVE | owner A | det: recipe | last S493 | streak 0

- `flex-range-keeps-its-min-content-width` | ACTIVE | owner B | det: recipe | last S493 | streak 0

- `slider-value-announced-as-its-position` | ACTIVE | owner F | det: recipe | last S456 | streak 0

- `ltr-machine-text-field-typed-rtl` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `pre-ready-interpolated-write-never-healed` | ACTIVE | owner I | det: recipe | last S454 | streak 0

- `cdn-library-parser-blocking-for-one-action` | ACTIVE | owner D | det: recipe | last S452 | streak 0

- `dark-navy-fill-matches-its-ground` | ACTIVE | owner M | det: recipe | last S568 | streak 2

- `ring-below-3-on-light` | ACTIVE | owner F | det: recipe | last S443 | streak 0

- `tip-escape-drops-focus` | ACTIVE | owner C | det: recipe | last S441 | streak 0

- `account-wide-delete-confirm-without-signed-in-wording` | DRAFT | owner P | det: none | last S435 | streak 0

- `logical-inset-mirrors-onto-pinned-content` | ACTIVE | owner H | det: recipe | last S440 | streak 0

- `tip-name-joins-its-field's-name` | ACTIVE | owner A | det: recipe | last S488 | streak 0

- `panel-title-keyed-on-an-inner-span` | ACTIVE | owner B | det: recipe | last S439 | streak 0

- `copy-claims-success-on-a-refused-clipboard` | ACTIVE | owner F | det: recipe | last S445 | streak 0

- `button-focus-lost-to-its-own-rebuild` | ACTIVE | owner F | det: recipe | last S545 | streak 0

- `dark-literal-escapes-the-print-tokens` | ACTIVE | owner G | det: recipe | last S569 | streak 0

- `editor-re-parse-caps-a-merged-list` | ACTIVE | owner P | det: recipe | last S421 | streak 0

- `window-taller-than-a-phone-without-a-scroll` | ACTIVE | owner N | det: recipe | last S555 | streak 1

- `install-banner-over-a-sheet's-bottom-controls` | ACTIVE | owner N | det: recipe | last S562 | streak 0

- `flash-restores-captured-text-not-its-key` | ACTIVE | owner E | det: recipe | last S417 | streak 0

- `visible-label-missing-from-the-accessible-name` | ACTIVE | owner B | det: recipe | last S531 | streak 0

- `designed-key-miss-probed-through-t` | ACTIVE | owner B | det: recipe | last S533 | streak 2

- `pinned-english-without-lang` | ACTIVE | owner B | det: recipe | last S533 | streak 0

- `toggle-name-flips-with-its-pressed-state` | ACTIVE | owner F | det: recipe | last S431 | streak 0

- `author-display-defeats-the-hidden-attribute` | ACTIVE | owner F | det: recipe | last S511 | streak 0

- `button-group-label-not-programmatic` | ACTIVE | owner C | det: recipe | last S413 | streak 0

- `settings-lost-across-a-load` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `live-region-display-none-while-empty` | ACTIVE | owner M | det: recipe | last S568 | streak 0

- `dark-base-rule-outranks-variant` | ACTIVE | owner M | det: recipe | last S568 | streak 1

- `aria-disabled-lock-no-handler-checks` | ACTIVE | owner P | det: recipe | last S407 | streak 0

- `text-field-under-16px-zooms-on-ios-focus` | ACTIVE | owner N | det: recipe | last S556 | streak 0

- `textContent-rewrite-erases-a-control-icon` | ACTIVE | owner K | det: recipe | last S501 | streak 0

- `english-literal-passed-to-a-message-helper` | ACTIVE | owner K | det: recipe | last S533 | streak 1

- `translated-key-exists-page-hardcodes-english` | ACTIVE | owner K | det: recipe | last S533 | streak 1

- `per-page-code-inside-a-shared-block` | DRAFT | owner E | det: none | last S416 | streak 0

- `icon-markup-into-a-textContent-writer` | DRAFT | owner E | det: none | last S403 | streak 0

- `cached-rejected-loader-promise-blocks-every-retry` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `cdn-dependency-absent-and-unguarded` | ACTIVE | owner B | det: recipe | last S399 | streak 0

- `selector-declared-twice-in-one-stylesheet` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `untrusted-card-field-interpolated-unescaped` | ACTIVE | owner D | det: recipe | last S393 | streak 0

- `auth-param-read-before-its-cleanup-runs` | ACTIVE | owner P | det: recipe | last S390 | streak 0

- `hover-feedback-survives-the-disabled-state` | ACTIVE | owner F | det: recipe | last S394 | streak 0

- `physical-property-that-never-mirrors` | ACTIVE | owner K | det: recipe | last S534 | streak 0

- `tile-grid-built-hidden-never-roved` | DRAFT | owner P | det: none | last S382 | streak 0

- `stored-json-of-the-wrong-shape-trusted` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `validation-note-stores-rendered-text` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `popup-without-a-keyboard-contract` | ACTIVE | owner A | det: recipe | last S371 | streak 2 | hits 0

- `stale-validation-note-after-its-input-changes` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `apply-settings-trusts-collection-members` | ACTIVE | owner L | det: recipe | last S387 | streak 0

- `save-over-an-existing-name-without-confirm` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `fixed-surface-missing-from-the-print-hide-list` | ACTIVE | owner G | det: recipe | last S563 | streak 1

- `control-class-without-a-hover-state` | ACTIVE | owner L | det: recipe | last S373 | streak 0

- `false-clean-from-a-literal-only-pattern-match` | ACTIVE | owner O | det: recipe | last S309 | streak 0

- `false-clean-from-an-unverified-probe-handle` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `light-literal-text-on-the-gold-token` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `sub-floor touch target` | ACTIVE | owner E | det: recipe | last S553 | streak 0

- `vh-capped-sheet-without-dvh-twin` | ACTIVE | owner A | det: recipe | last S385 | streak 1

- `ledger-section-loss` | ACTIVE | owner F | det: recipe | last S296 | streak 0

- `dark-mode-token-as-text-on-a-light-ground` | ACTIVE | owner C | det: recipe | last S534 | streak 0

- `non-finite-number-from-a-loaded-file` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `slider-focus-lost-to-its-own-rebuild` | DRAFT | owner A | det: none | last S286 | streak 0 | hits 6

- `class-only-selected-state` | ACTIVE | owner A | det: recipe | last S357 | streak 0 | hits 0

- `animation-outside-its-reduced-motion-block` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `help-affordance-inside-a-label-forwards-its-tap` | ACTIVE | owner A | det: recipe | last S284 | streak 0

- `csv-cell-quoting-integrity` | ACTIVE | owner I | det: recipe | last S281 | streak 0

- `dark-print-shadow-slab` | DRAFT | owner A | det: none | last S385 | streak 0

- `pinned-english-prose-in-rtl-paragraph` | ACTIVE | owner M | det: recipe | last S568 | streak 5

- `fixed-width-third-party-embed-inflates-phone-layout` | ACTIVE | owner N | det: recipe | last S276 | streak 0 | hits 2

- `stale-html-fallback-behind-its-csv-value` | ACTIVE | owner K | det: recipe | last S533 | streak 0

- `undocumented-global-keyboard-shortcut` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `fixed-size-control-holding-translatable-text` | ACTIVE | owner A | det: recipe | last S264 | streak 1 | hits 0

- `legibility-destroyed-by-a-second-dimming-layer` | ACTIVE | owner A | det: recipe | last S263 | streak 0 | hits 1

- `fixed-control-positioned-outside-the-viewport` | ACTIVE | owner N | det: recipe | last S563 | streak 0 | hits 3

- `executable-javascript-in-a-localization-cell` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `i18n-html-markup-only-in-fallback` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `global-keydown-preventDefault-without-target-guard` | DRAFT | owner A | det: none | last S272 | streak 0

- `row-siblings-with-mismatched-heights` | ACTIVE | owner A | det: recipe | last S556 | streak 1

- `debounced-persistence-with-no-page-hide-flush` | ACTIVE | owner A | det: recipe | last S258 | streak 0 | hits 1

- `state-mutation-that-never-arms-its-persistence` | ACTIVE | owner A | det: recipe | last S257 | streak 0 | hits 1

- `flex-column-crushing-its-own-rows` | ACTIVE | owner N | det: recipe | last S555 | streak 1

- `translated-sibling stray` | DRAFT | owner H | det: none | last S336 | streak 0

- `mobile-input-hints` | DRAFT | owner I | det: none | last S534 | streak 0

- `i18n cross-column parity (placeholders, plurals, inline markup)` | ACTIVE | owner K | det: recipe | last S533 | streak 2 | hits 0

- `horizontal-overflow-at-narrow-widths` | ACTIVE | owner N | det: recipe | last S555 | streak 0 | hits 2

- `hover-only-affordance-under-a-synthetic-mouse-event` | ACTIVE | owner N | det: recipe | last S555 | streak 1 | hits 1

- `contrast-inverted-by-a-hover-or-active-state` | ACTIVE | owner C | det: recipe | last S368 | streak 0

- `dark-override-outranks-hover` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `contrast-below-AA-on-a-tinted-or-coloured-plate` | ACTIVE | owner M | det: recipe | last S568 | streak 0

- `async-store-backed-choice-clobbered-by-a-sync-fallback` | ACTIVE | owner A | det: recipe | last S226 | streak 1

- `rebuild-where-a-class-swap-would-do` | ACTIVE | owner A | det: recipe | last S220 | streak 0 | hits 1

- `decorative-glyph-carrier-exposed-to-assistive-tech` | ACTIVE | owner A | det: recipe | last S563 | streak 0

- `error-status-clobbered-by-a-later-routine-write` | DRAFT | owner A | det: none | last S411 | streak 0

- `content-dependent-tour-step-miscounts-the-tour` | DRAFT | owner A | det: none | last S197 | streak 0

- `per-sample-repaint-of-an-O(n)-live-preview` | DRAFT | owner A | det: none | last S196 | streak 0

- `false-positive-validator-on-the-app's-own-content` | ACTIVE | owner A | det: recipe | last S194 | streak 0

- `JSON-LD ↔ visible-content parity` | ACTIVE | owner L | det: recipe | last S432 | streak 0

- `wired-then-clobbered label` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `theme-flipping-token-on-a-fixed-colour-plate` | ACTIVE | owner A | det: recipe | last S191 | streak 0

- `two-state-ready-flag-for-a-three-state-load` | DRAFT | owner F | det: none | last S542 | streak 0

- `invalid-SVG-geometry-from-an-unclamped-difference` | DRAFT | owner A | det: none | last S187 | streak 0

- `RTL-inheritance-on-a-Latin-script-container` | ACTIVE | owner A | det: recipe | last S290 | streak 0 | hits 1

- `silent-external-media-failure` | ACTIVE | owner A | det: recipe | last S0 | streak 0

- `print-trailing-dead-space` | DRAFT | owner A | det: none | last S0 | streak 0

- `lazily-loaded-dependency-renders-an-empty-shell` | DRAFT | owner A | det: none | last S416 | streak 0

- `print-media-leak / var-chain-overridden-by-a-literal` | DRAFT | owner A | det: none | last S0 | streak 0

- `incomplete-print-token-reset` | ACTIVE | owner A | det: recipe | last S569 | streak 0

- `referenced-but-unauthored i18n key` | DRAFT | owner A | det: none | last S0 | streak 0

- `untrusted-shape-on-read` | DRAFT | owner A | det: none | last S0 | streak 0

- `blocking-alert-for-a-routine-path` | ACTIVE | owner A | det: recipe | last S512 | streak 0

- `double-localization` | DRAFT | owner A | det: none | last S0 | streak 0

- `parse-per-call on a growing store` | ACTIVE | owner A | det: recipe | last S0 | streak 0

- `authored-but-unreferenced i18n key family` | DRAFT | owner D | det: none | last S365 | streak 0

- `browser-locale-date-in-a-localized-sentence` | DRAFT | owner A | det: none | last S533 | streak 0 | hits 0

- `sub-floor touch target on a shared small-button class` | ACTIVE | owner A | det: recipe | last S410 | streak 0

- `localStorage-vs-AllTools` | ACTIVE | owner A | det: recipe | last S357 | streak 0

- `unescaped-input / unsafe-parse` | ACTIVE | owner A | det: recipe | last S158 | streak 0 | hits 0

- `destructive-bulk` | ACTIVE | owner A | det: recipe | last S272 | streak 0 | hits 0

- `ivrit-gather-gap` | DRAFT | owner A | det: none | last S185 | streak 0

- `symbol-only accessible name` | ACTIVE | owner A | det: recipe | last S0 | streak 0

- `nameless-adjacent-text-labeled control` | ACTIVE | owner A | det: recipe | last S0 | streak 0

- `dead-feature-guard` | ACTIVE | owner A | det: recipe | last S158 | streak 0

- `modal-focus-trap` | ACTIVE | owner H | det: recipe | last S426 | streak 0

- `pre-ready-i18n / never-re-rendered` | ACTIVE | owner D | det: recipe | last S538 | streak 0

- `placeholder-as-only-accessible-name` | DRAFT | owner A | det: none | last S0 | streak 0

### Discovery-pass rotation (run one per session, stalest first)

- P accounts & cloud (one surface): 2026-10-29 (**S567 — 15th P, dashboard (its first since S421; 113 commits to the page): all 7 smokes with `--sdk` (sync 216/217 in the parallel run, D31 green in 6 re-runs), static 59 checks (plants 7/7), live clean, the page's editors signed in by real clicks on the fake cloud with HEAD the control. FOUND 2, FIXED 1 (Bulk preset edit sent a stale preset back …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): SKIP since S403 — the sandbox refuses to execute the third-party detector ("Code from External"); runs again once the maintainer commits a `.claude/settings.json` permission rule for it (`docs/reference/deslop-detector.md`). Last run 2026-09-08 (S346, `flash_cards.html`, 6th O; the S399/S403 refusals are in the archive).

- N mobile & touch-device (one surface): 2026-10-27 (**S562 — 31st N, `trope_tutor.html` (3rd: S248 → S389 → S562): 16 cells (SE 320, i13 390 + landscape, Pixel 7 412 × EN/HE × light/dark) × 20 views by real taps (plants 5/5), the iOS hint forced on SE + i13, tips / sliders / the staff by finger, flips mid-drill / tour / tip / menu, 4× CPU; + a 9-page tour-flip census. FOUND 6, FIXED 2 (+1 P3 at …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-10-29 (**S568 — 32nd M, torah (2nd: S422 → S568): 31 views × 8 cells by real clicks (248 shots; real fonts, Sefaria stubbed from the MAM phrases), census ~16,000 text nodes, hover 397/386 controls × 2 themes, 820 Tab stops, dark fills, header gate 1px, RTL sentences, live regions by CDP; every plant fired. FOUND 6, FIXED 2 (the staff's clause …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-10-21 (**S533 — 36th K, `db80feb4..843984b3` (111 commits; parsha_emojis' first): CSV +209 (all resolve), 12 reworded, 0 removed; static 5,502 refs + 2,974 fallback sites (the html arm, lapsed since S475); blind 0/4,328 lines; 102 states by the real switcher (twins = base + 5 known); retry 4/4; 10 surfaces by real input + a switch mid-state. FOUND 4, FIXED 4.**)

- C accessibility (one tool): 2026-10-27 (**S560 — flash's 6th C (S381 → S560, 114 commits): a 104-load census (7,960 controls, plants 5/5), real Tab / Shift+Tab walks of 5 screens × 8 cells + 2 iPhones with the hint, dialogs, motion, spacing, 320px reflow, 400% zoom, hover content by a real mouse. FOUND 6, FIXED 2 (+ torah's carrier, the FM fullscreen P3, gate 4, 2 new patterns). C-next: …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-10-21 (**S530 — 41st A, `d77484c5..6f9a5992` (109 commits; parsha_emojis' first): 53 static + 16 runtime arms × 16 pages vs pre-delta (plants fired), 18 blocks, dialogs, print, 1px sweep. FOUND 4, FIXED 4.**)

- G print & export fidelity (one tool): 2026-10-29 (**S569 — flash (5th: … S423 → S569; 88 commits since): the report × 3 profiles × 4 cells × Letter / A4 at 0.4 / 0.5 (1 page in 48 of 48), the certificate (landscape, 1 page), the card sheet × 5 decks × single / duplex × 2 cells (duplex 200 / 200 answers behind their card, 0 cut), the drill and results printed plain from both themes, `.ivrit` 0 / …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-10-29 (**S570 — the Torah Trainer (5th: S184/S185 → S307 → S424 → S570; 143 commits since): cold 8 cells × 1× / 4× vs the S424-era page on the same real Vayera (Sefaria + Google Fonts recorded, replayed), 6 configurations, 21 interactions by real input (a 300 ms control read 300–308), Slow 4G, Esther on the staff, idle, heap. FOUND 7, FIXED 2 (the manifest off the …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-10-22 (**S539 — 40th I, S525 → S538 (93 commits; name_tags' first I, parsha_emojis' under its name): 63 virgin cells (plants 334/336); 69 seeds; 27 tours; ~250 openers; 280 bad URLs; failure paths 20. FOUND 2, FIXED 1.**)

- B console/error audit: 2026-10-22 (**S543 — 41st B, 78 commits (name_tags' first): 84 cells; name_tags, 9 tours, PE, LL, 8 retries by real input; iPhone ×42. FOUND 2, FIXED 1.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- V offline & service-worker runtime (suite): 2026-10-23 (**S553 — 1st V: the installed worker live (no block), the origin stopped by `closeAllConnections`: 17 precached pages + `/` + `?lang=he` + the unlisted page + an unknown path × light 1280 / dark 800 = 40 cells served by the worker, 0 errors, the UI strings and the self-hosted faces from the cache; the data cache seeded by 2 pages and read …[full text: IMPROVEMENT_ARCHIVE.md]

- L SEO & discoverability audit: 2026-10-21 (**S532 — 29th L, `18a7e6a3..ca9b9618` (110 commits; LL's launch, parsha_emojis' first L): 20 arms + 3 on 20 pages (plants 29/29); SEO surface unchanged 16/18; LL + parsha JSON-LD claims by real clicks; FAQ twins 10/10. FOUND 1 (gate 2), FIXED 4; S432 struck.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-10-29 (**S566 — flash (first H since S412; 93 commits): 6 lessons by real input × EN light 1280 / HE dark 800 (a vowel review to fullscreen; an ulpan's word lists by code and link; Name the Letter, Listening, the card sheet, the worksheet, an `.ivrit`; 25 children saving; the edges) + the student cell and the Learning Path. FOUND 8, FIXED 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-10-21 (**S531 — 41st E, `d7c58446..48286048` (108 commits; parsha_emojis' first): 16 arms + carrier lists (plants 18/18), docs, CSP 40 cells (plant 40/40), the stub. FOUND 2, FIXED 4.**)

- F cross-tool consistency: 2026-10-22 (**S542 — 40th F, loading states (first since S189): 14 surfaces held, then aborted. FOUND 7, FIXED 4. F-next: long-build progress.**)

**Next session (S571):** **PR `claude/improveloop-s570` (S570, #374): open → continue on it; merged → fresh branch off `origin/main`.** `sw.js` **v1122**, FM **5.59**, corpus ?v=7. ⚑ drift: main=93b6e09 sw=v1122 fm=5.59 migration=0007_saves_tool_name_tags.sql live=yes functions=a0151a3 sdk=2.116.0 config=58edf33 keepalive=aed4e7b. ⚑ Stalest: C's dictionary (S427), N's generator (S434), P's flash (S435); A/E/L/K (S530–S533) 40 sessions old (A: 27 DRAFT rows, the ▾ census). ⚑ The Trope Atlas `trope_atlas.html` (unlisted, landed S564's drift): its first N and P are due by S578. ⚑ Seeds: 54. ⚑ Torah (S570 D): Translit's first pass is the one big freeze (2.45 s @4×) — architecture, not a missing memo. ⚑ Deep links: flash's ?s= raced its lazy corpora until `9388361` — census the suite's other deep links that apply settings before a lazy corpus lands. ⚑ Sync (S567 P): the shared-module P3 (verify first); smoke-sync D31 — watch it. ⚑ FM: the photo intake size is still unasked — measure Trace's outline at ~2,000 px first. ⚑ Ports at the next A: `m554/`–`n562/`, `g563/`, `h564/`, `d565/`, `h566/`, `p567/`, `m568/`, `g569/`, `d570/` (report / cert / sheet / results / darkdiff / share2 / llwalk / dash / the recorder); traps 352, 356–425. ⚑ Queues (candidates naming one page): FM 20, generator 18, torah 13, dictionary 9, name_tags 9, flash 8, dashboard 6, trope 5, PE 5.
⚑ Maintainer: `08b8611`; O's permission rule; CI for `closeout.mjs --static`; translit second source; sw.js `no-store`; 14 fonts; torah screen reader; the locale's size and the Resources fonts' precache (Awaiting); gates 2–4 incl. the vowel palette's gold (S556), the trope link (S557), the Phrases chips' casing (S558), the FM's sheet-upload copy (S559), flash's short windows (S560, gate 4), the FM Exit label (S560, gate 3), the generator's QR layout (S563, gate 3); the S546 P3; the flash report's totals (S566, gate 2).
