# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 (**NEW S582 G — the atlas at the cap**) | trope_atlas.html | **On paper 11 (Letter) / 15 (A4) of the 598 Stacked figures lose their tail, up to 131px** (shalshelet, revia, pazer, karnei parah, zakef gadol): `.at-stf` scrolls on screen and clips in print. | found S582

- [ ] P2 (**S567 P; S573 P root-caused — a shared module, not small**) | js/ivrit-saves.js | **A page write made after a hydration planned its uploads, before it ends, is not sent, and the tab's next sync downloads the account's copy over it**: the hook is not armed yet, and step 4's `snapshotNames` takes the post-write hash as the tab's seen view, so `actionFor` reads it as another tab's write. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**NEW S559 H — the FM at the cap**) | Hebrew_Font_Maker.html | **Auto-detect matches a printed template page only when every row's box count is exact, and rows group by the box's top edge**: lamed's ascender splits its row (print page 1: 4,4,4,3,1,4), a letter written in two strokes adds a box (the cursive alef: 5,4,4,4,4), and the page falls back to the free-form right-to-left order — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**NEW S559 H — verify first**) | Hebrew_Font_Maker.html | **5 of 132 untouched starting fonts fail the export's shaping check**: "Right-meteg check failed … expected -49/166, got -49/167" (BenOr Rashi; Miriam CLM 178/169, Shuneet Square 125/150, Shuneet Classic 97/122) and "Hataf Patach + ZWJ + meteg did not compose" (Rommvilna), so a first export says "vowels/trop may be misplaced". …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S580 C — design call**) | trope_atlas.html | **The melody table is 594 tab stops (one sing button per figure)**: a keyboard user crosses the whole table to reach the phrase section; a roving tabindex (one stop per row, arrows between) or a skip past the table would fix it. | found S580

- [ ] P3 (**NEW S577 N**) | trope_atlas.html | **On a phone the melody table's sign column takes 170px of a 294–386px box**, so beside it a figure shows its clef and key only (546px columns): a narrower sign column under 560px. | found S577

- [ ] P3 (**NEW S574 M — verify paper first**) | hebrew_blend_generator.html | **The crossword's grid is never cropped to its words**: a 10-word puzzle in a 12×12 black square (~70% black). | found S574

- [ ] P3 (**NEW S571 C — not small**) | hebrew_dictionary.html | **A word card is one `role=button` holding its select box, Copy, Hear and Google controls** (a button's children are presentational): move the details action onto the headword, the card a group. | found S571

- [ ] P3 (**NEW S571 C — census first**) | torah_trainer.html | **No forced-colors block: in High Contrast the chosen font card and the open sidebar tab read like their neighbours** (computed styles). | found S571

- [ ] P3 (**NEW S565 D — verify first, signed in**) | Hebrew_Font_Maker.html | **The cloud autosave still clones the whole project with its photos**: `fmCloudPack` runs `JSON.parse(JSON.stringify(p))` on every 10 s save of a dirty cloud project — the copy `c85bdd1` took out of the local autosave; measure with smoke-fontmaker's `--sdk` fixture and 8 phone photos. | found S565

- [ ] P3 (**NEW S559 H — gate 2, copy**) | Hebrew_Font_Maker.html | **Help (Uploading, Download Templates) and the after-upload status still say "drag a box around each glyph"**: Auto-detect letters and Trace all (v5.59) are never named in the instructions, so the one-sheet path reads as 27 hand-drawn boxes. | found S559

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P3 (**NEW S480 D — verify first; S576: 13/200 on Chromium 153**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4× (S565: 302–502 @1×). Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P3 (**S572 N; S573 re-measured — gate 4: port `39e7b42`'s narrow-sheet rule; pattern `horizontal-overflow-at-narrow-widths`**) | hebrew_blend_generator.html | **A blend sheet's five columns spill past a phone's left edge (the grid is right-to-left), and in the English UI the cut cells cannot be reached** (Inverse, iPhone 13: −37 HE / −41 EN; the Hebrew page scrolls to them): 11 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S570 D — not small: yield per verse or a worker**) | torah_trainer.html | **Turning Translit on freezes the page for the reading's first transliteration pass**: one task of 520 ms @1× / 2.45 s @4× on Vayera (2,085 words; the Trope staff 447 / 2,691), and a cold load with Translit on 536–582 / 2,751–2,948 — the library's syllabification; the memos spare only re-renders (findings …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S566 H — gate 2, what a saved score means**) | flash_cards.html | **The progress report and the history count unreached cards as attempted**: 3 of 3 answered before a 30 s limit ran out reads "20 cards attempted · 15% accuracy · 15% best drill" on the parent report and "15% 3/20" in the history, where the results screen said 100% (3/3). The saved `total`/`pct` are deck-wide on …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S565 D — the intake half is gate 2**) | Hebrew_Font_Maker.html | **The Trace step still freezes 1.5–1.9 s on a 12 MP phone photo** (3.1–3.3 s before `6ef102d`; 16 s @4×): `flatCanvasFor` flattens the whole 3024×4032 photo (decode + `getImageData` ~1 s, the blur 0.55 s). Keeping intake photos near 2,000 px (`prepImageForItem`) would cut it ~4× and shrink every snapshot and file — a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3, the sheet's layout**) | hebrew_blend_generator.html | **Name the Letter with QR Answer Key prints the code alone on page 2** (Letter and A4, 4/4 cells; Export PDF fits it): the 40-letter sheet is 977 of the page's 989 px and the QR block needs 109, so every student copy costs an extra sheet and loses its code. No small fix keeps both: tighter cells in print when …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3 or a shorter payload**) | hebrew_blend_generator.html | **The printed answer-key QR is 2.2 cm for 81–125 modules, 0.18–0.27 mm a module** (below the ~0.33 mm print guidance): decoded from the Print PDF at 300 dpi only 3/10 shapes, at 600 dpi 10/10, so an ordinary phone at reading distance may fail. Larger box (layout) or a shorter `?ak=` payload (findings S563). | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492; S562's census, not the clamp's: the dictionary 4/4, the generator EN 7/7, the dashboard's last step — `n562/tourflip-suite.mjs`). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S559 H — the FM at the cap**) | Hebrew_Font_Maker.html | **Auto-detect is offered on every tab's sheet view but knows only the Hebrew letters**: on the English tab the English template's 30 boxes are assigned צ ץ ק … and then the traced Hebrew letters, and Apply would replace their photos and outlines (one Ctrl+Z). Hide it off the Letters tab, or make it tab-aware (seed). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S557 H — gate 2, the Trainer's deep-link contract**) | trope_tutor.html → torah_trainer.html | **A Learn card's "See it in the parsha →" replaces the Trainer's saved reading**: `?parsha=` saves the parsha with `scope:'parsha-full'` and drops a holiday, so a student on aliyah 3 of Ki Tavo or on Rosh Hashanah day 1 reopens the Trainer on Bereshit (both measured, 2 cells); a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S578 P — not reachable today**) | index.html | **Erase All's bounded flush names 7 of the 10 synced tools** (not Letter Learner, Emoji Torah, Name Tags): a hub write to those within 2 s of the last confirm stays unsent; two dialogs outlast the debounce. Use the module's list when next touched. | found S578

- [ ] P4 (**NEW S576 D — pattern `layout-read-per-grid-at-build`**) | classroom_dashboard.html | **A cold load lays the page out twice during init**: the rails' ceiling (`_railMaxFor`) reads `clientWidth` mid-build (~86 ms @4×, ~20 @1×), which the first frame redoes; ask it after the first frame. | found S576

- [ ] P4 (**NEW S576 D**) | classroom_dashboard.html | **Bulk preset edit's Save over 40 changed presets is one 203 ms task @4×** (unprofiled). | found S576

- [ ] P4 (**NEW S575 G — pattern `print-block-split-at-a-sheet-foot`; whole cards cost a sheet here**) | index.html | **Printed, the hub cuts a tool card across sheets (EN Letter, HE A4) and prints Bookmark and Import / Export, dead on paper**; whole cards alone add a footer-only sheet (EN Letter). | found S575

- [ ] P4 (**NEW S575 G — pattern `print-trailing-padding-adds-a-sheet`**) | privacy.html | **In English on Letter the footer prints alone on a 6th sheet** ; main's padding off does not fit it (and splits Terms' footer). | found S575

- [ ] P4 (**NEW S575 G**) | contact.html | **The contact form prints blank, with Send and the PayPal / Venmo / Zelle tabs: dead on paper.** | found S575

- [ ] P4 (**NEW S574 M — pattern `contrast-below-AA-on-a-tinted-or-coloured-plate`**) | hebrew_blend_generator.html | **In dark mode the answer keys' ★ cards read 4.46:1** (an inline 8% gold tint, two builders). | found S574

- [ ] P4 (**NEW S574 M — pattern `dark-navy-fill-matches-its-ground`**) | hebrew_blend_generator.html | **In dark mode the disabled Print button has no edge** (1.00:1) beside the outlined disabled Regenerate and Export PDF. | found S574

- [ ] P4 (**NEW S574 M — H's**) | hebrew_blend_generator.html | **The crossword's "Not placed:" note can list 50+ pool words on the student's sheet.** | found S574

- [ ] P4 (**NEW S574 M — UX rule 8**) | hebrew_blend_generator.html | **Hebrew in the English UI sits under `lang="en"`**: "עברית", the colour-coding examples, Hebrew inside English definitions. | found S574

- [ ] P4 (**NEW S574 M — component consistency**) | hebrew_blend_generator.html | **The Advanced panel's TTS speed box is not a sub-panel** like its five navy-bar neighbours. | found S574

- [ ] P4 (**NEW S573 P**) | scripts/smoke-sync.mjs | **D31 (the Trope merge after a button sign-out) failed the first full run in S567 and in S573** ("neither side merged") and passed alone and in every re-run: a timing race left in the scenario or the module. | found S573

- [ ] P4 (**NEW S572 N — pattern `horizontal-overflow-at-narrow-widths`**) | hebrew_blend_generator.html | **On an iPhone SE Real Words Bingo's caller list and Word Search's grid scroll sideways** (82 / 73 px). | found S572

- [ ] P4 (**NEW S572 N**) | hebrew_blend_generator.html | **A Real Words card's longest part-of-speech tags still run into its number** ("prepositional phrase" at 104–144px, a full desktop too). | found S572

- [ ] P4 (**NEW S571 C**) | hebrew_dictionary.html | **The export section dims its count and note to 2.12:1 and its live, unmarked buttons to 2.87:1**: `aria-disabled` them while inactive (UX rule 5) and dim only them. | found S571

- [ ] P4 (**NEW S571 C — UX rule 8**) | hebrew_dictionary.html | **The English UI's mixed strings leave their Hebrew under `lang="en"`** (the root badge, the Shoresh label, the root button, the gematria badge). | found S571

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **A cold Trope-staff load still draws the reading twice**: `ensureStaffData()` starts only when the first render asks, so the words-only fallback draws first (31–50 ms @1×, 115–180 @4×) and the staff replaces it; starting the phrase file in `init` when the layout is the staff would draw once. | found S570

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **init's synchronous work before the Sefaria request grew ~120 ms @4× since S424**: `wireSettingsForm` 55–64 ms (4–5 then: two `lookupRender` for the closed Calendar tab, ~25 each), `staffInitWatchers`' `document.fonts.ready` read forces a style + layout (30), `buildHolidayPicker` 13–15 (findings S570). | found S570

- [ ] P4 (**NEW S569 G — gate 2, copy on paper**) | flash_cards.html | **Every card-sheet page is headed with the button's label** — "Print card sheet 1 / 3", "הדפיסו דף כרטיסים 1 / 3" (`flashcards.sheet.button` reused by `printCardSheet`): an instruction printed on the artifact; a noun ("Flash cards", "כרטיסיות") would read as a title. | found S569

- [ ] P4 (**NEW S569 G — K, gate 2**) | flash_cards.html | **The progress report's Score column reads "ניקוד" in Hebrew** — in a reading tool the word for vowel points; "ציון" is the score (`flashcards.report.col_score`). | found S569

- [ ] P4 (**NEW S568 M**) | torah_trainer.html | **At Hebrew size ≥ 2.5rem the trope clause line meets the Latin under each word, reading and staff alike** (−0.7 → −3.4 px at 2.5 → 3.5rem): the Latin's 0.4em margin is the Latin's em, the line's 0.68em offset the Hebrew's; `padding-block-end:0.18em` on `.tt-wh` keeps the default and holds at every size. | found S568

- [ ] P4 (**NEW S568 M — converge**) | torah_trainer.html, hebrew_blend_generator.html | **The fullscreen Exit label is 8.3 px** (`#fsExitBtn .fs-label` 0.52rem) where the dashboard and the FM use 0.7rem: the projected lesson's one way out has the page's smallest text. | found S568

- [ ] P4 (**NEW S568 M — S578: page-wide, census first**) | torah, dashboard, FM, generator | **Buttons render in the UA font (Arial), not Source Sans 3**: dashboard 50, generator 7, torah 7, FM 3 buttons per cell (`#fsExitBtn`, torah's audio bar, the dashboard's `.btn-xs`…); one `button { font-family:inherit }` per page, then every changed width checked. | found S568

- [ ] P4 (**NEW S568 — found verifying `f6d4a231`**) | hebrew_blend_generator.html | **Export PDF carries the blend Self-Check's screen controls** (score bar, Reveal All / Hide All, Per row, "Tap a card to flip") that print hides (`.score-bar, .self-check-controls`); a flipped card's Missed / Got it buttons print and export too. | found S568

- [ ] P4 (**NEW S566 H — gate 2, copy**) | flash_cards.html | **The results actions mix the Hebrew register**: "שמור תוצאות" (singular) among "שמרו / חזרו / תרגלו / הדפיסו / שתפו" (plural); a preset row's Play / Load / Save are singular too. One register per screen. | found S566

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **Save Project (.hebrewfont) still serializes in one string**: `JSON.stringify` + `gzipBlob`, 1.6 s @1× with 8 phone photos, once per click; `autosaveParts` would serve it. | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **QA Check opens in one task**: 205–230 ms @1× on FreeSerif (346 glyphs), 795 ms @4× on a 27-letter sheet project (`qaBuild` + `qaRenderGrid`). | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **A cold load @4× has three tasks over 200 ms**: parse 391–441, `init` 687–757, the `I18n.ready` re-render 207–324 (S410: two, 306–365 + 492–560); 1× has none (top 150–160, was 96–102). | found S565

- [ ] P4 (**NEW S564 H**) | classroom_dashboard.html | **A `.ivrit` Merge onto a fresh device lists "My class (0)" twice**: the device's empty starter class and the file's are merged by id, so both stay; an empty default class could yield to a same-named incoming one. | found S564

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **"N pages to print" under-counts a Real Words sheet that runs on**: Identify (60) prints 4 pages under "2 pages to print" (8/8 cells), and the reading, ID Parts of Speech, Gematria, Fill Vowels and Reverse keys print 3 under "2" in some cells; `generator.md` names only the caller sheet as a known gap. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **A long Real Words answer key can print its footer alone on a page** (Letter: reading EN/HE, ID Parts of Speech EN, Reverse HE; A4: reading + QR EN, Gematria EN — 6 of 48 cells, the definitions' lengths decide): `break-before: avoid` on the key's footer, or fit the key. | found S563

- [ ] P4 (**NEW S563 G; S574 M: on screen too, 2.75:1**) | hebrew_blend_generator.html | **Gold that the B/W ink list misses prints at 2.75:1**: Class Set's VERSION A/B/C label (`.ws-version-label`) and Real Words Gematria's translations (inline `color:var(--gold)`), with backgrounds on or off; the print block darkens the other answer golds to `#6b4e12`. | found S563

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

- [ ] P4 (**NEW S565 D; S567 re-measured**) | Hebrew_Font_Maker.html | **Auto-detect on a phone photo of a sheet makes three long tasks @4× (431 / 695 / 338 ms; @1× its top is 134 ms, not S565's 556)**: `adBinarize` (lumPlane → estimateBackground → flatten → Otsu) has no yield inside, but splitting it in `adRunDetection` takes the 695 only to ~400, since the first task is the 1800 px canvas's …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S562 N — unmeasured carriers**) | torah_trainer.html, hebrew_dictionary.html, flash_cards.html, classroom_dashboard.html | **The tip placement trope fixed in `4b16e61` (no room above or below → off the bottom of a phone held sideways) is the same code in 4 per-file copies**: the landscape probe opened no tip there at load (theirs sit in closed panels and drawers) — open them, then …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] P1 (**NEW — the reading-assignments build's live actions; BACKEND BOUNDARY**) | workers/audio/ | **Backend live: 0008, both functions, the Worker on `recordings.ivritsuite.com` (secret, cron, lifecycle rules), the null-MX + SPF records. Left: the Supabase Auth password settings (dashboard), the merge, the iPad hand test (PWA mic, `audio/mp4`, WebM on Safari < 17.4).** | found this build

- [ ] P4 (**NEW S577 N — GATE 2: a phone's default layout; deferred unattended; `n577/sheets/atlas-phone-i13.png`**) | trope_atlas.html | **On a phone the melody table opens as the Grid, where a figure shows its clef only; Stacked shows whole figures**: open Stacked under 560px while no layout is stored? | found S577

- [ ] P3 (**NEW — the maintainer's review, by design**) | trope_review.html, data/trope/trope_approvals.json | **All 20 trope traditions approved; 19 (2026-10-28, at the maintainer's request) without the row-by-row check against their scans.** Still worth checking on `trope_review.html`: the 14 printed 3s kept as written and the raised-fifth spellings of six JE columns; a corrected row hides its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S571 C — GATE 4, not asked (flash's S560 twin waits); `c571/shots/zoom400-*.png`**) | hebrew_dictionary.html | **At 400% zoom (320×256) the sticky phone bar holds 127 of the window's 256 px.** | found S571

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

- [x] 2026-10-31 | (S582 close-out) | branch/deploy note | **S582 = G on the Trope Atlas (its first G): FOUND 3, FIXED 2, 1 P2 queued at the cap. Same PR #383, sw v1150; deploy on merge. Gates: gate 2 asked — printing the Grid → "Print as Stacked".**

- [x] 2026-10-31 | `dd1dcff6` | trope_atlas.html, sw.js | (S582) **Printing from the Grid puts every melody on paper** (beforeprint builds the Stacked cards, afterprint the Grid with its scroll back; the stored view untouched) — gate 2 answered in-session. | `g582/f2.mjs` 16 cells EN/HE × light/dark × Letter/A4: HEAD Grid 7–12 pages (7 of 98 'Binder'), tree = Stacked (79–84 pages, same text …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-31 | `deb9df3e` | trope_atlas.html, sw.js | (S582) **The printed sign tables wrap to the sheet** (print: no min-width, names/codes/ranks wrap, the box overflows visibly; was: 'What it does' off the paper, right in EN, left in HE). | `g582/f1.mjs` every td of 3 tables in 739 / 718px: HEAD 27 off-sheet × 16 cells, tree 0; A4 PDFs looked at

- [x] 2026-10-30 | this commit | trope_atlas.html, sw.js | **S580 C: `td.none` colour `--border` → `--muted` (the "no figure" dash read 1.73:1 light, 1.35:1 dark → ~6:1) and the rail's sub-links `padding-block` 2 → 3px (23 → 25px, the 24px floor)** | `d579/c.mjs` census EN light 1280 / HE dark 800: low-contrast 1 → 0, sub-24px links 8+ → 0, 0 page errors; `c6.mjs` 4 cells (EN/HE × light/dark) …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-31 | (S581 close-out) | branch/deploy note | **S581 = A, scoped to the reading-assignments landing: FOUND 1, FIXED 1, two detectors committed. Same PR #383, sw v1148; deploy on merge. Gates: none asked.**

- [x] 2026-10-30 | (S580 close-out) | branch/deploy note | **S580 = C on the Trope Atlas (its first C): FOUND 3, FIXED 2 in one commit (the "—" cells' contrast, the contents rail's 23px links), 1 P3 queued. Same PR #383, sw v1147; deploy on merge. Gates: none asked.**

- [x] 2026-10-30 | (S579 close-out) | branch/deploy note | **S579 = D on the Trope Atlas (its first D): one iteration, nothing shipped — the only measured win, `content-visibility:auto`, drops the sing buttons from the accessibility tree. Branch `claude/improveloop-s579`; ledger/findings only, no `sw.js` bump. Gates: none asked.**

- [x] 2026-10-30 | (S578 close-out) | branch/deploy note | **S578 = P on the Trope Atlas (its first P; no account wiring by design): arms 1–8 behind controls, the 7 smokes' J by `--sdk`. FOUND 3, FIXED 2 (+2 queue), 1 P4 logged, 1 rescoped. PR #377, sw v1139; deploy on merge. Gates: none asked.**

- [x] 2026-10-30 | `225fe22e` | flash_cards.html, CSV, locales | (S578, queue S566) **The Hebrew save-to-profile chooser reads "תוצאה שמורה אחת" / "{n} תוצאות שמורות"** (`.one` / `.other`; was "1 שמורים"). | `p578/flash-label.mjs` real drill + Save results: EN 1280, HE 800 dark, HE 390 (HEAD fails 2); check-i18n

- [x] 2026-10-30 | `1d7b34d5` | trope_atlas.html | (S578, queue S577) **The iOS hint steps aside while the contents drawer is open** (`install-banner-over-a-sheet's-bottom-controls`). | `n577/banner.mjs` 3 phones × EN/HE: 2–3 links → 0 (= hint dismissed); back after an outside tap and Escape

- [x] 2026-10-30 | `89f9fbfa` | scripts/smoke-account.mjs | (S578) **J checks every page that loads the analytics tag** (was: only pages already carrying `page_location`). | `--sdk`: 18 pages; the tree before the atlas fix fails on it alone; a planted bare `gtag('config')` fails it

- [x] 2026-10-30 | `1a29f606` | trope_atlas.html, sw.js | (S578) **The atlas's analytics tag counts a visit** (the suite's snippet, the sign-in code left out of `page_location`; it loaded gtag.js with no config). | `p578/atlas-recipe.mjs` 8 cells 48/48 (HEAD 16 fail); smoke-account 112/112

## Metrics

### Per-session log (one line per session)

- 2026-10-31 | **S582** | iters: 3 | tools: trope_atlas ×2, sw | patterns fixed: — | pass run: G (atlas, first) | SW: v1148→v1150

- 2026-10-31 | **S581** | iters: 4 | tools: torah, scripts/loop, sw | patterns fixed: author-display-defeats-the-hidden-attribute ×1 | pass run: A (scoped: reading assignments) | SW: v1147→v1148

- 2026-10-30 | **S580** | iters: 1 | tools: trope_atlas, sw | patterns fixed: — | pass run: C (atlas, first) | SW: v1146→v1147

- 2026-10-30 | **S579** | iters: 1 | tools: trope_atlas (measured only), loop docs | patterns fixed: — | pass run: D (atlas, first) | SW: v1146→v1146

- 2026-10-30 | **S578** | iters: 5 | tools: atlas ×2, flash, scripts/smoke-account, locales, sw | patterns fixed: install-banner-over-a-sheet's-bottom-controls ×1 | pass run: P (trope_atlas, its first) | SW: v1138→v1139

- 2026-10-30 | **S577** | iters: 5 | tools: atlas ×2, dashboard, generator, dashboard.md, scripts/loop, sw | patterns fixed: horizontal-overflow-at-narrow-widths ×1, flex-range-keeps-its-min-content-width ×1 | pass run: N (trope_atlas, its first) | SW: v1137→v1138

- 2026-10-30 | **S576** | iters: 5 | tools: dashboard ×2, flash ×2, dashboard.md, scripts/loop, sw | patterns fixed: offscreen-sheets-laid-out-on-every-rebuild ×1 (chunked) | pass run: D (dashboard, first since S438) | SW: v1136→v1137

- 2026-10-30 | **S575** | iters: 5 | tools: resources, contact, privacy, terms, generator ×2, scripts/loop, sw | patterns fixed: print-block-split-at-a-sheet-foot (NEW) ×2, contrast-below-AA ×1, live-region-display-none-while-empty ×1 | pass run: G (chrome, first since S437) | SW: v1135→v1136

- 2026-10-30 | **S574** | iters: 5 | tools: generator ×2, torah, dictionary, scripts/loop, sw | patterns fixed: header-wrap-gate (squeeze) ×1, hebrew-faux-italic ×1, live-region-display-none-while-empty ×2 | pass run: M (generator, 2nd) | SW: v1134→v1135

- 2026-10-30 | **S573** | iters: 5 | tools: flash ×2, generator ×2, smoke-sync, accounts-and-cloud.md, ops.md, scripts/loop, sw | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×2 | pass run: P (flash, first alone since S435) | SW: v1133→v1134

- 2026-10-29 | **S572** | iters: 5 | tools: generator ×2, pwa.js, name_tags, torah (reported), smoke-sync, scripts/loop, sw | patterns fixed: text-field-under-16px-zooms-on-ios-focus ×1, install-banner-over-a-sheet's-bottom-controls ×1, fixed-columns-crush-a-narrow-sheet ×1 (new) | pass run: N …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-10-29 | **S571** | iters: 5 | tools: dictionary ×2, flash, generator, torah, locales, scripts/loop, sw | patterns fixed: button-focus-lost-to-its-own-rebuild ×1, selected-state-lost-in-forced-colors ×1 | pass run: C (dictionary, first since S427) | SW: v1122→v1126

- 2026-10-29 | **S570** | iters: 5 | tools: torah ×2, flash ×2, torah-and-trope.md, scripts/loop, sw | patterns fixed: hebrew-faux-italic + latin-tracking-on-hebrew-labels ×1 | pass run: D (torah, 5th) | SW: v1118→v1122

- 2026-10-29 | **S569** | iters: 5 | tools: flash ×2, letter_learner, dashboard, locales, sw | patterns fixed: incomplete-print-token-reset + dark-literal-escapes-the-print-tokens ×1, focus-hidden-under-a-sticky-bar ×1 | pass run: G (flash, 5th) | SW: v1117→v1118

- 2026-10-29 | **S568** | iters: 5 | tools: torah ×2, generator ×2, sw | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: M (torah, 2nd) | SW: v1116→v1117

- 2026-10-29 | **S567** | iters: 5 | tools: dashboard ×2, generator, name_tags, scripts, dashboard.md, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×1, contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: P (dashboard, first since S421) | SW: v1115→v1116

- 2026-10-29 | **S566** | iters: 5 | tools: flash ×2, trope, dictionary, scripts/loop, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×2 | pass run: H (flash, first since S412) | SW: v1114→v1115

- 2026-10-28 | **S565** | iters: 5 | tools: FM ×2, dashboard, flash, font-maker.md, scripts/loop, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×1 | pass run: D (fontmaker, 4th) | SW: v1113→v1114

- 2026-10-28 | **S564** | iters: 5 | tools: dashboard ×2, dictionary, torah, scripts/loop, sw | patterns fixed: focus-hidden-under-a-sticky-bar ×1, hover-tip-not-dismissible-or-hoverable ×1 | pass run: H (dashboard, 4th) | SW: v1112→v1113

- 2026-10-27 | **S563** | iters: 5 | tools: generator ×2, trope, letter_learner, name_tags, flash, sw | patterns fixed: fixed-control-positioned-outside-the-viewport ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: G (generator, 4th) | SW: v1104→v1105

### Tool coverage (last-touched date per tool)

- **Snapshot S582 (2026-10-31):** trope_atlas, sw.js, loop docs S582 · torah, sw.js, scripts/loop, loop docs S581 · trope_atlas S580 · trope_atlas, flash, locales, CSV, sw.js, smoke-account, ops.md, torah-and-trope.md, loop docs S578 · dashboard, generator, dashboard.md, scripts/loop S577 · resources, contact, privacy, terms, sitemap S575 · torah, dictionary S574 · scripts, accounts-and-cloud.md S573 · pwa.js, name_tags, generator.md S572 · letter_learner S569 · trope S566 · FM, font-maker.md S565 · projects S561 · name-tags.md S559 · …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (one status line per pattern — shape, owner, detection and record: docs/reference/loop-patterns.md)

- `print-block-split-at-a-sheet-foot` | ACTIVE | owner G | det: scripts/loop/probes/S575-chrome-print-whole-blocks.mjs | last S575 | streak 0

- `focus-hidden-under-a-sticky-bar` | ACTIVE | owner C | det: recipe | last S569 | streak 0

- `hover-tip-not-dismissible-or-hoverable` | ACTIVE | owner C | det: recipe | last S567 | streak 0

- `tour-step-in-a-hidden-view` | ACTIVE | owner A | det: recipe | last S558 | streak 0

- `dark-hover-resolves-to-the-rest-colour` | ACTIVE | owner A | det: recipe | last S558 | streak 1

- `latin-sentence-boundary-in-hebrew-prose` | ACTIVE | owner M | det: scripts/loop/detect-latin-sentence-boundary-in-hebrew-prose.mjs | last S554 | streak 0

- `offscreen-sheets-laid-out-on-every-rebuild` | ACTIVE | owner D | det: recipe | last S576 | streak 0

- `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

- `defaults-filed-as-the-device's-own-at-first-sign-in` | ACTIVE | owner P | det: recipe | last S546 | streak 0 | hits 6

- `selected-state-lost-in-forced-colors` | ACTIVE | owner C | det: recipe | last S571 | streak 0

- `live-region-shown-with-its-text` | ACTIVE | owner G | det: recipe | last S553 | streak 0

- `abs-child-escapes-its-scroller` | ACTIVE | owner N | det: recipe | last S572 | streak 2

- `empty-result-not-announced` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `print-trailing-padding-adds-a-sheet` | ACTIVE | owner H | det: recipe | last S575 | streak 0

- `unseen-hit-box-over-controls` | ACTIVE | owner C | det: recipe | last S530 | streak 1

- `layout-read-per-grid-at-build` | ACTIVE | owner D | det: recipe | last S576 | streak 0

- `dark-palette-baked-into-paper` | ACTIVE | owner G | det: recipe | last S563 | streak 1

- `tour-not-following-a-live-switch` | ACTIVE | owner K | det: recipe | last S522 | streak 0

- `overlay-scoped-dialog-keys` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `group-toggle-wipes-a-sibling-group` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `infinite-box-shadow-pulse-repaints-every-frame` | ACTIVE | owner D | det: recipe | last S511 | streak 0

- `new-page-print-block-without-the-ink-remap` | ACTIVE | owner G | det: recipe | last S575 | streak 2

- `page-drops-a-field-it-cannot-apply` | ACTIVE | owner P | det: recipe | last S507 | streak 0

- `theme-token-on-an-always-dark-surface` | ACTIVE | owner N | det: recipe | last S572 | streak 2

- `data-edit-under-an-unchanged-buster` | ACTIVE | owner E | det: recipe | last S503 | streak 0

- `root-var-per-input` | ACTIVE | owner D | det: recipe | last S497 | streak 1

- `dark-palette-on-the-element` | ACTIVE | owner G | det: recipe | last S495 | streak 0

- `count-noun-without-a-one-form` | DRAFT | owner I | det: none | last S533 | streak 0

- `busy-disabled-button-drops-focus` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `hidden-input-anchored-outside-its-scroller` | ACTIVE | owner C | det: recipe | last S499 | streak 0

- `hebrew-faux-italic` | ACTIVE | owner M | det: recipe | last S574 | streak 0

- `fixed-toast-duration-shorter-than-its-text` | ACTIVE | owner F | det: recipe | last S487 | streak 0

- `centred-fixed-box-shrinks-to-half-the-viewport` | ACTIVE | owner F | det: recipe | last S484 | streak 0

- `shared-module-fallback-literal-without-a-dark-twin` | ACTIVE | owner C | det: recipe | last S483 | streak 0

- `rtl-copy-names-the-english-side` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `copy-names-a-control-by-a-label-it-lacks` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `screen-frame-prints-as-rails` | ACTIVE | owner D | det: recipe | last S480 | streak 0

- `enter-ignored-beside-its-own-button` | ACTIVE | owner B | det: recipe | last S472 | streak 0

- `placeholder-keeps-the-browser-gray` | ACTIVE | owner F | det: scripts/loop/detect-placeholder-keeps-the-browser-gray.mjs | last S581 | streak 1

- `header-wrap-gate-below-its-ceiling` | ACTIVE | owner M | det: recipe | last S574 | streak 0

- `latin-tracking-on-hebrew-labels` | ACTIVE | owner H | det: recipe | last S570 | streak 0

- `forward-arrow-points-back-in-rtl-copy` | ACTIVE | owner N | det: recipe | last S555 | streak 3

- `share-link-writes-the-teachers-saved-preferences` | ACTIVE | owner P | det: recipe | last S472 | streak 1

- `bulk-apply-skips-a-renderer-the-control-runs` | ACTIVE | owner K | det: recipe | last S472 | streak 1

- `radio-set-without-a-question` | ACTIVE | owner B | det: recipe | last S527 | streak 0

- `native-input-display-none-under-its-label` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `stale-tab-flush-writes-its-old-copy` | ACTIVE | owner A | det: recipe | last S493 | streak 0

- `flex-range-keeps-its-min-content-width` | ACTIVE | owner B | det: recipe | last S577 | streak 0

- `slider-value-announced-as-its-position` | ACTIVE | owner F | det: recipe | last S456 | streak 0

- `ltr-machine-text-field-typed-rtl` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `pre-ready-interpolated-write-never-healed` | ACTIVE | owner I | det: recipe | last S454 | streak 0

- `cdn-library-parser-blocking-for-one-action` | ACTIVE | owner D | det: recipe | last S452 | streak 0

- `dark-navy-fill-matches-its-ground` | ACTIVE | owner M | det: recipe | last S574 | streak 0

- `ring-below-3-on-light` | ACTIVE | owner F | det: recipe | last S443 | streak 0

- `tip-escape-drops-focus` | ACTIVE | owner C | det: recipe | last S441 | streak 0

- `account-wide-delete-confirm-without-signed-in-wording` | DRAFT | owner P | det: none | last S435 | streak 0

- `logical-inset-mirrors-onto-pinned-content` | ACTIVE | owner H | det: recipe | last S440 | streak 0

- `tip-name-joins-its-field's-name` | ACTIVE | owner A | det: recipe | last S488 | streak 0

- `panel-title-keyed-on-an-inner-span` | ACTIVE | owner B | det: recipe | last S439 | streak 0

- `copy-claims-success-on-a-refused-clipboard` | ACTIVE | owner F | det: recipe | last S445 | streak 0

- `button-focus-lost-to-its-own-rebuild` | ACTIVE | owner F | det: recipe | last S571 | streak 0

- `dark-literal-escapes-the-print-tokens` | ACTIVE | owner G | det: recipe | last S575 | streak 1

- `editor-re-parse-caps-a-merged-list` | ACTIVE | owner P | det: recipe | last S421 | streak 0

- `window-taller-than-a-phone-without-a-scroll` | ACTIVE | owner N | det: recipe | last S577 | streak 3

- `install-banner-over-a-sheet's-bottom-controls` | ACTIVE | owner N | det: scripts/loop/probes/S572-install-hint-tours.mjs | last S578 | streak 0

- `flash-restores-captured-text-not-its-key` | ACTIVE | owner E | det: recipe | last S417 | streak 0

- `visible-label-missing-from-the-accessible-name` | ACTIVE | owner B | det: recipe | last S531 | streak 0

- `designed-key-miss-probed-through-t` | ACTIVE | owner B | det: recipe | last S533 | streak 2

- `pinned-english-without-lang` | ACTIVE | owner B | det: recipe | last S533 | streak 0

- `toggle-name-flips-with-its-pressed-state` | ACTIVE | owner F | det: recipe | last S431 | streak 0

- `author-display-defeats-the-hidden-attribute` | ACTIVE | owner F | det: recipe | last S581 | streak 0 | hits 1

- `button-group-label-not-programmatic` | ACTIVE | owner C | det: recipe | last S413 | streak 0

- `settings-lost-across-a-load` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `live-region-display-none-while-empty` | ACTIVE | owner M | det: recipe | last S575 | streak 0

- `dark-base-rule-outranks-variant` | ACTIVE | owner M | det: recipe | last S574 | streak 2

- `aria-disabled-lock-no-handler-checks` | ACTIVE | owner P | det: recipe | last S407 | streak 0

- `text-field-under-16px-zooms-on-ios-focus` | ACTIVE | owner N | det: recipe | last S572 | streak 0

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

- `fixed-surface-missing-from-the-print-hide-list` | ACTIVE | owner G | det: recipe | last S575 | streak 2

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

- `pinned-english-prose-in-rtl-paragraph` | ACTIVE | owner M | det: recipe | last S574 | streak 6

- `fixed-width-third-party-embed-inflates-phone-layout` | ACTIVE | owner N | det: recipe | last S276 | streak 0 | hits 2

- `stale-html-fallback-behind-its-csv-value` | ACTIVE | owner K | det: recipe | last S533 | streak 0

- `undocumented-global-keyboard-shortcut` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `fixed-size-control-holding-translatable-text` | ACTIVE | owner A | det: recipe | last S264 | streak 1 | hits 0

- `legibility-destroyed-by-a-second-dimming-layer` | ACTIVE | owner A | det: recipe | last S263 | streak 0 | hits 1

- `fixed-control-positioned-outside-the-viewport` | ACTIVE | owner N | det: recipe | last S572 | streak 1 | hits 3

- `executable-javascript-in-a-localization-cell` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `i18n-html-markup-only-in-fallback` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `global-keydown-preventDefault-without-target-guard` | DRAFT | owner A | det: none | last S272 | streak 0

- `row-siblings-with-mismatched-heights` | ACTIVE | owner A | det: recipe | last S556 | streak 1

- `debounced-persistence-with-no-page-hide-flush` | ACTIVE | owner A | det: recipe | last S258 | streak 0 | hits 1

- `state-mutation-that-never-arms-its-persistence` | ACTIVE | owner A | det: recipe | last S257 | streak 0 | hits 1

- `flex-column-crushing-its-own-rows` | ACTIVE | owner N | det: recipe | last S572 | streak 2

- `translated-sibling stray` | DRAFT | owner H | det: none | last S336 | streak 0

- `mobile-input-hints` | DRAFT | owner I | det: none | last S534 | streak 0

- `i18n cross-column parity (placeholders, plurals, inline markup)` | ACTIVE | owner K | det: recipe | last S533 | streak 2 | hits 0

- `horizontal-overflow-at-narrow-widths` | ACTIVE | owner N | det: recipe | last S577 | streak 0 | hits 5

- `fixed-columns-crush-a-narrow-sheet` | ACTIVE | owner N | det: scripts/loop/probes/S572-generator-realwords-narrow-cards.mjs | last S572 | streak 0 | hits 1

- `hover-only-affordance-under-a-synthetic-mouse-event` | ACTIVE | owner N | det: recipe | last S577 | streak 3 | hits 1

- `contrast-inverted-by-a-hover-or-active-state` | ACTIVE | owner C | det: recipe | last S368 | streak 0

- `dark-override-outranks-hover` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `contrast-below-AA-on-a-tinted-or-coloured-plate` | ACTIVE | owner M | det: recipe | last S575 | streak 0

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

- P accounts & cloud (one surface): 2026-10-30 (**S578 — 17th P, `trope_atlas.html` (its first; no account by design): arms 1–8 behind controls (a stored session untouched, the tutor the control), live read-only clean, smoke-account `--sdk` (J widened, planted). FOUND 3, FIXED 2 (+2 queue). P-next: generator (S463), chrome (S477).**)

- O deslop — AI-design-tell sweep (one surface): SKIP since S403 — the sandbox refuses to execute the third-party detector ("Code from External"); runs again once the maintainer commits a `.claude/settings.json` permission rule for it (`docs/reference/deslop-detector.md`). Last run 2026-09-08 (S346, `flash_cards.html`, 6th O; the S399/S403 refusals are in the archive).

- N mobile & touch-device (one surface): 2026-10-30 (**S577 — 33rd N, `trope_atlas.html` (its first audit): 16 phone cells × 11 views by real taps, raw-touch swipes, the iOS hint, 4× CPU, 11 widths. FOUND 6, FIXED 2 (+2 queue). N-next: torah (S448), fontmaker (S476).**)

- M aesthetics & visual design (one surface): 2026-10-30 (**S574 — 33rd M, generator (2nd: S436 → S574): 34 views × 8 cells by real clicks (272 loads, real fonts), census, hover 3,478 controls × 2 themes, dark fills, live regions by CDP, header 1px × EN/HE × mouse/touch, RTL 887 blocks; every plant fired. FOUND 10, FIXED 2 (the tablet header at gate 3, Hebrew faux italic) + 8 logged at the cap. …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-10-21 (**S533 — 36th K, `db80feb4..843984b3` (111 commits; parsha_emojis' first): CSV +209 (all resolve), 12 reworded, 0 removed; static 5,502 refs + 2,974 fallback sites (the html arm, lapsed since S475); blind 0/4,328 lines; 102 states by the real switcher (twins = base + 5 known); retry 4/4; 10 surfaces by real input + a switch mid-state. FOUND 4, FIXED 4.**)

- C accessibility (one tool): 2026-10-30 (**S580 — `trope_atlas.html` (its first C): EN light 1280 / HE dark 800 — headings, landmarks, names of 721 tab stops, ids, svg roles, contrast of every text node, 24px floor, a 100-stop Tab walk for focus under the sticky bar (smooth-scroll latency waited out). FOUND 3: 2 FIXED, 1 queued. C-next: torah (S441), trope (S455).**)

- A recurring-pattern sweep: 2026-10-31 (**S581 — 42nd A, scoped to the outside-loop reading-assignments landing (`a7fa5f1..aab737c`, 18 of its 53 commits; `reading_assignments.html`, `js/ivrit-assignments.js`, the Trainer's +838): the security arms (no `innerHTML`, reviver-safe parses, URL sinks, an anonymous Trainer loads no assignments module), then two catalog recipes committed as detectors …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-10-31 (**S582 — `trope_atlas.html` (its first G): Grid and Stacked × EN/HE × light/dark × Letter/A4 by `page.pdf` (0.4in margins) and print-width measures of every sign-table cell and staff; page sheets looked at. FOUND 3, FIXED 2 (the sign tables clipped, the Grid printing 1–2 of 26 melodies — gate 2), 1 P2 queued. G-next: torah (S451), fontmaker …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-10-30 (**S579 — `trope_atlas.html` (its first D): cold load at 1× and 4× by profiler and `Performance.getMetrics`, the build counted by mutation (one 598-staff build, not two), 5 containment / `content-visibility` candidates measured, the accessibility tree read for the one that paid. FOUND 1 (P3, no small fix), FIXED 0. D-next: generator (S452), chrome (S466).**)

- I first-load & empty-state: 2026-10-22 (**S539 — 40th I, S525 → S538 (93 commits; name_tags' first I, parsha_emojis' under its name): 63 virgin cells (plants 334/336); 69 seeds; 27 tours; ~250 openers; 280 bad URLs; failure paths 20. FOUND 2, FIXED 1.**)

- B console/error audit: 2026-10-22 (**S543 — 41st B, 78 commits (name_tags' first): 84 cells; name_tags, 9 tours, PE, LL, 8 retries by real input; iPhone ×42. FOUND 2, FIXED 1.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- V offline & service-worker runtime (suite): 2026-10-23 (**S553 — 1st V: the installed worker live (no block), the origin stopped by `closeAllConnections`: 17 precached pages + `/` + `?lang=he` + the unlisted page + an unknown path × light 1280 / dark 800 = 40 cells served by the worker, 0 errors, the UI strings and the self-hosted faces from the cache; the data cache seeded by 2 pages and read …[full text: IMPROVEMENT_ARCHIVE.md]

- L SEO & discoverability audit: 2026-10-21 (**S532 — 29th L, `18a7e6a3..ca9b9618` (110 commits; LL's launch, parsha_emojis' first L): 20 arms + 3 on 20 pages (plants 29/29); SEO surface unchanged 16/18; LL + parsha JSON-LD claims by real clicks; FAQ twins 10/10. FOUND 1 (gate 2), FIXED 4; S432 struck.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-10-29 (**S566 — flash (first H since S412; 93 commits): 6 lessons by real input × EN light 1280 / HE dark 800 (a vowel review to fullscreen; an ulpan's word lists by code and link; Name the Letter, Listening, the card sheet, the worksheet, an `.ivrit`; 25 children saving; the edges) + the student cell and the Learning Path. FOUND 8, FIXED 2 …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-10-21 (**S531 — 41st E, `d7c58446..48286048` (108 commits; parsha_emojis' first): 16 arms + carrier lists (plants 18/18), docs, CSP 40 cells (plant 40/40), the stub. FOUND 2, FIXED 4.**)

- F cross-tool consistency: 2026-10-22 (**S542 — 40th F, loading states (first since S189): 14 surfaces held, then aborted. FOUND 7, FIXED 4. F-next: long-build progress.**)

**Next session (S583):** **Branch `claude/improveloop-s579` (S579–S582, PR #383): open → continue on it; merged → fresh branch off `origin/main`.** `sw.js` **v1150**, FM **5.59**, corpus ?v=7. ⚑ drift: main=aab737c sw=v1150 fm=5.59 migration=0009_assignment_enrolment.sql live=yes functions=bcbee20 sdk=2.116.0 config=58edf33 keepalive=aed4e7b. ⚑ The atlas still has no H or M (never-audited: they outrank everything); its printed Stacked figures clip (P2, S582). ⚑ The signed-in reading-assignments UI still wants its first P and H (smoke-assignments' fake cloud). ⚑ Stalest suite passes: E (S531), L (S532), K (S533). ⚑ Closeout runs two rendered detectors (~2.5 min). ⚑ 54 seeds.
⚑ Sync P2 (S573): a write after a hydration's plan is not sent. ⚑ The account page signed in is unprinted (needs `--sdk`): the next G or P on the chrome. ⚑ Gate 4 to propose with phone shots: the generator's blend sheets past a phone's left edge; gate 2: the atlas's phone default (Awaiting). ⚑ smoke-sync D31 flake (P4). ⚑ Ports at the next A: the `m554/`–`p578/` harnesses; traps 352, 356–455. ⚑ Queues: generator 26, FM 20, dictionary 11, torah 11, name_tags 8, dashboard 7, flash 6, PE 5, trope 3, atlas 3, index 2, LL 2, privacy 1, contact 1.
