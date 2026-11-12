# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P2 (**NEW S559 H — the FM at the cap; S593: the order half FIXED `55e45af`**) | Hebrew_Font_Maker.html | **Auto-detect matches a printed template page only when every row's box count is exact, and rows group by the box's top edge**: lamed's ascender splits its row (4,4,4,3,1,4), a letter in two strokes or a ה in two pieces adds a box (5,4,4,4,4; 21 for 20), and every later letter shifts one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**NEW S559 H; S593 root-caused, BenOr Rashi FIXED `cd875c6`**) | Hebrew_Font_Maker.html | **4 of 132 untouched starting fonts still fail the export's shaping check**: Miriam CLM (9 units) and Shuneet Square / Classic (25) pin their vowels, and `uniE0B1` attaches at the shared below anchor, not the qamats's pin (riding the meteg's pin put it on the wrong side: findings S593; Shuneet's …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P2 (**S567 P; S573 P root-caused — a shared module, not small**) | js/ivrit-saves.js | **A page write made after a hydration planned its uploads, before it ends, is not sent, and the tab's next sync downloads the account's copy over it**: the hook is not armed yet, and step 4's `snapshotNames` takes the post-write hash as the tab's seen view, so `actionFor` reads it as another tab's write. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S644 H — not small**) | Hebrew_Font_Maker.html | **Below 1181px the fullscreen Draw canvas window (`100vh − 300px`) clips its drawing**: at 1024×768 the baseline sits 16px under its edge. | found S644

- [ ] P3 (**NEW S602 — found verifying `3ab8b385`; its gate-4 answer covers it, measure Export PDF landscape first**) | hebrew_blend_generator.html | **With Landscape Print on, the on-screen blend sheet keeps ten columns where they do not fit**: Inverse 46–61px past the sheet at 1280/1600; on an iPhone 13 Reading 106–119px, Inverse 445px (paper unchanged). | found S602

- [ ] P3 (**NEW S593 G — verify on a Mac first**) | Hebrew_Font_Maker.html | **Every font named only in Hebrew exports with nameID 6 `MyHebrewFont-Regular` (and `MyHebrewFont.ttf`)**: two such fonts share one PostScript name, which Font Book and Mac apps key fonts by; a stem from the name (a short hash or a transliteration) would keep them apart. | found S593

- [ ] P3 (**NEW S574 M — verify paper first**) | hebrew_blend_generator.html | **The crossword's grid is never cropped to its words**: a 10-word puzzle in a 12×12 black square (~70% black). | found S574

- [ ] P3 (**NEW S571 C — not small**) | hebrew_dictionary.html | **A word card is one `role=button` holding its select box, Copy, Hear and Google controls** (a button's children are presentational): move the details action onto the headword, the card a group. | found S571

- [ ] P3 (**NEW S559 H — gate 2, copy**) | Hebrew_Font_Maker.html | **Help (Uploading, Download Templates) and the after-upload status still say "drag a box around each glyph"**: Auto-detect letters and Trace all (v5.59) are never named in the instructions, so the one-sheet path reads as 27 hand-drawn boxes. | found S559

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P3 (**NEW S480 D — verify first; S576: 13/200 on Chromium 153**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4× (S565: 302–502 @1×). Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P3 (**NEW S618 D — not small: the cache's contract is "another tab wrote"**) | flash_cards.html | **`readProfiles()` compares the whole stored profiles string on every call** (about twice per profile per render): with 12 students × 100 results (4 MB) one switch of the active student holds the page 1.1–1.7 s @4× (`readProfiles` 700–1,100 ms self); a write counter or the `storage` event could …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S618 D — a shared module + the shared engine block, not small**) | js/ivrit-saves.js, .ivrit engine | **A large profiles store is reviver-parsed twice at every Flash Cards load, signed out too**: `attach()`'s `snapshotLocal` (`safeParse`, 410 ms @4×) and `readProfiles` (`ivritSafeParse`, 665) on the 4 MB class; a fast path (plain `JSON.parse` when the text holds no `__proto__` / …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S595 N — needs the tour-engine extraction, UX rule 1**) | Hebrew_Font_Maker.html, hebrew_dictionary.html, tour engine | **On a landscape phone (750×342) the tour card falls back onto its own target**: the starting-font tour's steps 2, 3, 7 covered 93–100%; the shared engine shares the fallback; the dictionary's own engine (S601 N) covers 31–54% of steps 2–5 at 750×342 and 863×360. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S570 D — not small: yield per verse or a worker**) | torah_trainer.html | **Turning Translit on freezes the page for the reading's first transliteration pass**: one task of 520 ms @1× / 2.45 s @4× on Vayera (2,085 words; the Trope staff 447 / 2,691), and a cold load with Translit on 536–582 / 2,751–2,948 — the library's syllabification; the memos spare only re-renders (findings …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S565 D — the intake half is gate 2**) | Hebrew_Font_Maker.html | **The Trace step still freezes 1.5–1.9 s on a 12 MP phone photo** (3.1–3.3 s before `6ef102d`; 16 s @4×): `flatCanvasFor` flattens the whole 3024×4032 photo (decode + `getImageData` ~1 s, the blur 0.55 s). Keeping intake photos near 2,000 px (`prepImageForItem`) would cut it ~4× and shrink every snapshot and file — a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3, the sheet's layout**) | hebrew_blend_generator.html | **Name the Letter with QR Answer Key prints the code alone on page 2** (Letter and A4, 4/4 cells; Export PDF fits it): the 40-letter sheet is 977 of the page's 989 px and the QR block needs 109, so every student copy costs an extra sheet and loses its code. No small fix keeps both: tighter cells in print when …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3 or a shorter payload**) | hebrew_blend_generator.html | **The printed answer-key QR is 2.2 cm for 81–125 modules, 0.18–0.27 mm a module** (below the ~0.33 mm print guidance): decoded from the Print PDF at 300 dpi only 3/10 shapes, at 600 dpi 10/10, so an ordinary phone at reading distance may fail. Larger box (layout) or a shorter `?ak=` payload (findings S563). | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492; S562's census, not the clamp's: the dictionary 4/4, the generator EN 7/7, the dashboard's last step — `n562/tourflip-suite.mjs`). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S557 H — gate 2, the Trainer's deep-link contract**) | trope_tutor.html → torah_trainer.html | **A Learn card's "See it in the parsha →" replaces the Trainer's saved reading**: `?parsha=` saves the parsha with `scope:'parsha-full'` and drops a holiday, so a student on aliyah 3 of Ki Tavo or on Rosh Hashanah day 1 reopens the Trainer on Bereshit (both measured, 2 cells); a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S646 P — attribute first**) | Hebrew_Font_Maker.html | **On a project of 8 phone photos the local snapshot still makes long tasks after every edit**: 4 of 51–77 ms @1× (the S565 probe) and, in a cloud autosave's window (two snapshots), ~25 of 200–290 ms @4× on HEAD and the tree alike — the gzip stream over 29 M chars is the likely source (findings S646). | found S646

- [ ] P4 (**NEW S645 C**) | flash_cards.html | **A listening tile picked by Tab + Enter is disabled under the focus**, which falls to `<body>` through the auto-advance (Chromium's start point still sends the next Tab to the next card's first tile). | found S645

- [ ] P4 (**NEW S644 H**) | Hebrew_Font_Maker.html | **Continue reopens on Alef**, not the letter left on (`applyProjectData`). | found S644

- [ ] P4 (**NEW S644 H**) | Hebrew_Font_Maker.html | **At 1366×768 a tile pick leaves the canvas below the fold** (stage 555–1025). | found S644

- [ ] P4 (**NEW S644 H**) | Hebrew_Font_Maker.html | **Fullscreen's floating Exit / Show Panels plates cover the workspace's top controls** (mode buttons, zoom Reset). | found S644

- [ ] P4 (**NEW S642 M — a suite question: the other tools' intros run full width too**) | trope_tutor.html | **The Learn intro runs ~170 characters a line at 1280** (six lines since the Conservative melody's sentences joined it): a measure near 75ch would read easier. | found S642

- [ ] P4 (**NEW S638 V — intermittent, measure first**) | sw.js | **After a deploy the previous version's cache can come back**: the fetch handler's `caches.open(CACHE).then(put)` runs outside `waitUntil`, so an old worker answering after the activate's delete reopens `ivritsuite-v<old>` (4 of 7 S638 runs; partial, never the approvals), kept until the next deploy. | found S638

- [ ] P4 (**NEW S637 M — 6 carriers, one with name_tags: a suite question for F or K**) | name_tags, letter_learner, hebrew_blend_generator, hebrew_dictionary, flash_cards, Hebrew_Font_Maker | **In the Hebrew UI a collapsed panel's triangle (`▾` turned −90°) points right, back at its own title**; a right-to-left disclosure points left. | found S637

- [ ] P4 (**NEW S614 C — the tour engine's**) | Hebrew_Font_Maker.html | **Tab out of an open tour and back leaves its Close and Next off-screen** (the fixed card follows its target out of view); S620 FIXED on the shared block's three carriers `79654c0f` — this page's own engine stays. | found S614

- [ ] P4 (**NEW S613 H — gate 2, copy**) | hebrew_blend_generator.html | **Real Words Bingo's too-few note never names a grid that fits**: 14 words at 5×5 says "Need at least 24…"; 3×3 builds 30 cards from them, and the Grid size select sits in Bingo Options below. | found S613

- [ ] P4 (**NEW S611 G — the picture's own call**) | letter_learner.html | **The hello picture's sleeve (a cuff drawn to y 103 of its 0–100 frame) touches שָׁלוֹם under it on the cursive coloring sheets** (3–8px of ink at 60 dpi, cursive landscape and portrait at 100%; 0.1–0.6px clear in Block). | found S611

- [ ] P4 (**NEW S608 N — verify on an iPhone first**) | classroom_dashboard.html | **The board's text editor and Bulk preset edit's five message editors are contenteditable at 15.2px under a finger** (`.editor` 0.95rem): if iOS zooms into a focused editor as into a field, 1.05×; the coarse rule covers inputs only. | found S608

- [ ] P4 (**NEW S599 H**) | torah_trainer.html | **After Create, the Assign dialog's fields stay live** (New code word changes only the box); the feedback label sits at its textarea's foot. | found S599

- [ ] P4 (**NEW S597 G — after `18d72e52`**) | trope_tutor.html | **15 of 232 printed charts still end on a sheet holding only the footer credits** (the Torah and High Holiday Phrases at Letter, 4 cells each; 4 traditions' Learn in HE A4; 3 more): what is left is the credits block itself (~100px on paper); a shorter credit set on paper is a copy call (findings S597). | found S597

- [ ] P4 (**NEW S595 N**) | Hebrew_Font_Maker.html | **A window opened mid-tour opens under the tour's card**: on a phone the card covers its Close (the card's ✕ still ends the tour). | found S595

- [ ] P4 (**NEW S595 N — gate 2/4**) | Hebrew_Font_Maker.html | **A phone turned sideways gets the tablet notice** (tiered by width alone); one over 820px gets none. | found S595

- [ ] P4 (**NEW S589 G**) | torah_trainer.html | **Side by side at the Hebrew size's maximum (3.5rem) with transliteration under each word, a verse row taller than a Letter sheet leaves its bottom rule alone on the next sheet** (4 of 50 sheets; A4 none). | found S589

- [ ] P4 (**NEW S588 M — 13 carriers**) | footer About column | **At ~800px the licence line wraps after a separator** ("CC BY-NC-SA 4.0 · GitHub ·" / "Contact & Support"). | found S588

- [ ] P4 (**NEW S584 M — verify on a real device**) | trope_atlas.html | **The sof pasuk mark (׃) in the sign table's role text has zero advance in headless Chromium on Linux** ("the two dots ׃ close" draws as "dots :close"): the cell's stack is `"Source Sans 3", sans-serif`, no Hebrew face; check a Mac / iPhone before wrapping ׃ and ׀ in a Hebrew-font span (the strings are i18n). | found S584

- [ ] P4 (**NEW S576 D**) | classroom_dashboard.html | **Bulk preset edit's Save over 40 changed presets is one 203 ms task @4×** (unprofiled). | found S576

- [ ] P4 (**NEW S575 G — pattern `print-block-split-at-a-sheet-foot`; whole cards cost a sheet here; S591: its dead buttons FIXED `61d3a8ab` — re-measure the sheets**) | index.html | **Printed, the hub cuts a tool card across sheets (EN Letter, HE A4)**; whole cards alone added a footer-only sheet (EN Letter). | found S575

- [ ] P4 (**NEW S575 G — pattern `print-trailing-padding-adds-a-sheet`**) | privacy.html | **In English on Letter the footer prints alone on a 6th sheet** ; main's padding off does not fit it (and splits Terms' footer). | found S575

- [ ] P4 (**NEW S574 M — H's**) | hebrew_blend_generator.html | **The crossword's "Not placed:" note can list 50+ pool words on the student's sheet.** | found S574

- [ ] P4 (**NEW S574 M — component consistency**) | hebrew_blend_generator.html | **The Advanced panel's TTS speed box is not a sub-panel** like its five navy-bar neighbours. | found S574

- [ ] P4 (**NEW S572 N — pattern `horizontal-overflow-at-narrow-widths`**) | hebrew_blend_generator.html | **On an iPhone SE Real Words Bingo's caller list and Word Search's grid scroll sideways** (82 / 73 px). | found S572

- [ ] P4 (**NEW S572 N**) | hebrew_blend_generator.html | **A Real Words card's longest part-of-speech tags still run into its number** ("prepositional phrase" at 104–144px, a full desktop too). | found S572

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **A cold Trope-staff load still draws the reading twice**: `ensureStaffData()` starts only when the first render asks, so the words-only fallback draws first (31–50 ms @1×, 115–180 @4×) and the staff replaces it; starting the phrase file in `init` when the layout is the staff would draw once. | found S570

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **init's synchronous work before the Sefaria request grew ~120 ms @4× since S424**: `wireSettingsForm` 55–64 ms (4–5 then: two `lookupRender` for the closed Calendar tab, ~25 each), `staffInitWatchers`' `document.fonts.ready` read forces a style + layout (30), `buildHolidayPicker` 13–15 (findings S570). | found S570

- [ ] P4 (**NEW S569 G — gate 2, copy on paper**) | flash_cards.html | **Every card-sheet page is headed with the button's label** — "Print card sheet 1 / 3", "הדפיסו דף כרטיסים 1 / 3" (`flashcards.sheet.button` reused by `printCardSheet`): an instruction printed on the artifact; a noun ("Flash cards", "כרטיסיות") would read as a title. | found S569

- [ ] P4 (**NEW S566 H — gate 2, copy**) | flash_cards.html | **The results actions mix the Hebrew register**: "שמור תוצאות" (singular) among "שמרו / חזרו / תרגלו / הדפיסו / שתפו" (plural); a preset row's Play / Load / Save are singular too. One register per screen. | found S566

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **Save Project (.hebrewfont) still serializes in one string**: `JSON.stringify` + `gzipBlob`, 1.6 s @1× with 8 phone photos, once per click; `autosaveParts` would serve it. | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **QA Check opens in one task**: 205–230 ms @1× on FreeSerif (346 glyphs), 795 ms @4× on a 27-letter sheet project (`qaBuild` + `qaRenderGrid`). | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **A cold load @4× has three tasks over 200 ms**: parse 391–441, `init` 687–757, the `I18n.ready` re-render 207–324 (S410: two, 306–365 + 492–560); 1× has none (top 150–160, was 96–102). | found S565

- [ ] P4 (**NEW S564 H**) | classroom_dashboard.html | **A `.ivrit` Merge onto a fresh device lists "My class (0)" twice**: the device's empty starter class and the file's are merged by id, so both stay; an empty default class could yield to a same-named incoming one. | found S564

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **"N pages to print" under-counts a Real Words sheet that runs on**: Identify (60) prints 4 pages under "2 pages to print" (8/8 cells), and the reading, ID Parts of Speech, Gematria, Fill Vowels and Reverse keys print 3 under "2" in some cells; `generator.md` names only the caller sheet as a known gap. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **A long Real Words answer key can print its footer alone on a page** (Letter: reading EN/HE, ID Parts of Speech EN, Reverse HE; A4: reading + QR EN, Gematria EN — 6 of 48 cells, the definitions' lengths decide): `break-before: avoid` on the key's footer, or fit the key. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **Blend Bingo hides Page Size (and Header Labels, Landscape) where Real Words Bingo shows them**: on A4 paper a teacher sets the size only from another mode first (the pill's value still applies). | found S563

- [ ] P4 (**NEW S562 N — touch parity**) | trope_tutor.html | **A Phrases chip lights its notes on the staff only by hover or focus**: a tap opens the mark's Learn card at once, so a touch user never sees which notes a chip names (`mouseenter` / `focus` → `.is-hl`; measured: the highlight flashes, then the tab changes). | found S562

- [ ] P4 (**NEW S560 C — gate 3**) | Hebrew_Font_Maker.html | **The fullscreen Exit button's no-wrap label spills 13px past its 60px plate** (EN "Exit Full Screen" 86px wide): after `f00f4bc` it still grazes 3% of Help / Tour at 1024 and 800, and a strip wide enough for it wraps the Hebrew toolbar at 1280; a plate that fits its label (or a two-line label) changes the button's look. | found S560

- [ ] P4 (**NEW S559 H**) | Hebrew_Font_Maker.html | **After an Apply the sheet view (the navigator and Auto-detect) is gone**: the second page's Auto-detect is reached only by opening a letter with no crop, which nothing says; a two-file pick also lands on "2 of 2", and the hint keeps "Start by uploading…" until the first Apply. | found S559

- [ ] P4 (**NEW S559 H — student cell**) | Hebrew_Font_Maker.html | **Fullscreen Draw at 1024×768 starts the canvas at y≈490**, under the toolbar and the letter grid: a student sees the top third of the drawing area and scrolls to reach the baseline (strokes aimed below the fold drew nothing). Gate 3 if the grid folds. | found S559

- [ ] P4 (**NEW S559 H — verify first**) | Hebrew_Font_Maker.html | **Noto Sans's fidelity report opens on Start editing having measured 0 letter+mark combos (1,072 "unexpected shaping results") and ends "Every measured combo lands within 3 units"**: a vacuous all-clear, and the census's one stop (it covers Export). | found S559

- [ ] P4 (**NEW S558 M — gate 2, copy**) | trope_tutor.html | **The Phrases chips write the clause names in sentence case ("Sof pasuk clause", "Zakef katon clause") where the Learn chips, the drill grid and the printed chart's legend use title case ("Sof Pasuk clause")**: one casing for a mark's name across the page. | found S558

- [ ] P4 (**NEW S549 D; S635: a translit mode, the extra toggle and the header Print box FIXED `577019e1`, a move `f620a674`**) | name_tags.html | **A structural edit rebuilds the 200-row table** (S635 @4×: 98–168 ms of script + 147–196 of layout; @1× 66–113: the first key in the new row, Remove, Undo, a list switch, a paste or import) — its three icon buttons are parsed from `innerHTML` 600 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S627 — found verifying the micro-feature; HEAD alike; S632 measured: gate 2/3, findings S632**) | hebrew_dictionary.html | **In the English UI every Filter by Letter grid is 265px in its 245px box** (`repeat(7,1fr)` cannot go under "Samech" / "Shin/Sin" at the 11.2px floor), so its alef column spills ~7px past the panel's edge; the Hebrew UI fits. How the names wrap is M's call. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S624 P — a shared module + every carrier, not small**) | js/ivrit-account.js (+ 38 `_cloud` confirms on 11 pages, the restore dialogs) | **A stored student session counts as a syncing teacher's**: every `_cloud` confirm and the `.ivrit` / AllTools restore's Merge-only rule read `hasStoredSession()`, though a student account never syncs (Name Tags' delete says "removed from your …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S621 E — the loop's tooling**) | scripts/loop/ | **E's shape-drift arm has no fixtures or static check yet** (`scripts/loop/fixtures/` was never created; the arm has been defined in loop-passes.md since S543's jsDelivr hit): lift the smokes' canned Sefaria / Hebcal / Open-Meteo / Nominatim / Web3Forms responses with a dropped-field control and check each parser reads only fields …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S610 M — CLAUDE.md's header-icons rule; pattern `decorative-glyph-carrier-exposed-to-assistive-tech`**) | classroom_dashboard.html, locales | **Nine control strings still lead with a glyph**: ↔ Move panels, 📍 Current Location (drawer + setup card), ✨ Quick-start layouts…, + Add period, 🎲 Pick Again, 🔀 Reshuffle, 🔄 New round, ✅ Everyone's here; the picture belongs in markup …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S596 P — the "only if they have students" half of gate 2**) | account.html | **The account page lists and downloads none of a teacher's reading-assignment data** (classes, student logins, assignments, recordings): the listing and the .zip cover saves and Font Maker projects only; counting them needs `js/ivrit-assignments.js` on that page (CLAUDE.md accounts rule 2 names its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S573 P; S596: alone 1 of 3 green**) | scripts/smoke-sync.mjs, js/ivrit-saves.js | **D31 (the Trope merge after a button sign-out) fails more often**: the S596 full run red and alone 1 of 3 green (S592: alone 3/3), always "neither side merged" with `settled` true — the shape of the S567 P2 above (a page write after the hydration planned is not sent; the Trope Learn tab saves on its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S590 D — not small: `content-visibility` on off-screen sheets, a11y + print first**) | hebrew_blend_generator.html | **Dragging the sidebar seam over a 40-version Class Set reflows all 40 sheets per move**: one forced layout of ~134 ms @4× per pointer move (`positionSidebarTab` reads the sidebar's rect after the width write), 7 s for a 150px drag; 11 ms with one sheet (findings …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S565 D; S567 re-measured**) | Hebrew_Font_Maker.html | **Auto-detect on a phone photo of a sheet makes three long tasks @4× (431 / 695 / 338 ms; @1× its top is 134 ms, not S565's 556)**: `adBinarize` (lumPlane → estimateBackground → flatten → Otsu) has no yield inside, but splitting it in `adRunDetection` takes the 695 only to ~400, since the first task is the 1800 px canvas's …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S550 G — a shared-block change: the `.ivrit` engine's six carriers + the hub; pattern `fixed-surface-missing-from-the-print-hide-list`**) | the `.ivrit` engine, js/ivrit-account.js, js/ivrit-saves.js | **The Merge/Replace ask overlay (an inline-styled fixed div with no id) and the account and saves modals have no print rule**: Ctrl+P with one open prints it over every sheet …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Sephardi haftarot and the holidays' maftirim are not offered**: `holiday-readings.json` carries `seph` and `fullkriyah.M` for every entry the table keys (the leyning builder's check could carry them). | found PR #313

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Shabbat Chazon's haftarah (Isaiah 1) is drawn in the Haftarah chart throughout**; the verses customarily chanted to Eicha's tune need a per-verse tune. | found PR #313

- [ ] P4 (**NEW PR #313**) | classroom_dashboard.html | **The dashboard's parsha line never names a special Shabbat** (Zachor, Parah, Shekalim…) though `HebCal.specialShabbat` now answers by date. | found PR #313

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

- [ ] S | trope_atlas.html | **From a melody-table figure to its phrases**: a teacher at Haftarah's zakef katon scrolls to the phrase browser, picks Haftarah and then the zakef clause by hand; a link on the figure (or its column heading) opening that melody at the clause that holds the sign would make it one click. | found S583 H

- [ ] S | trope_atlas.html | **Print one melody's phrases as a handout**: printing is all or nothing (Stacked 79–84 pages; filtered to Torah + Haftarah still 48), so a one-melody sheet means a PDF and a page range; a "Print these phrases" on the phrase browser that prints its melody and group alone. | found S583 H

- [ ] S | Hebrew_Font_Maker.html | **Auto-detect and the template link for the other alphabets**: the English, Cyrillic, Phoenician, Aramaic and Samaritan tabs have printed templates (`TEMPLATE_SPECS`) and sheet sizing already knows Latin and Cyrillic descenders, but Auto-detect matches and assigns Hebrew only, and the wizard's "Print a template sheet" prints the Hebrew sheet even with English …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | name_tags.html | **The English line in the class font**: a Font Maker font with English letters draws only the Hebrew line of a tag (the picker is "Hebrew font"); an "also for the English name" box when the font has Latin letters. | found S559 H

- [ ] S | trope_tutor.html | **A staff size for the projector**: the Learn staff stays 182×52 px (about 5 px between lines) at every width and Hebrew size while the example word grows to 69 px; a size setting, or one card shown big, lets the class read the melody from the back. | found S557 H

- [ ] S–M | parsha_emojis.html (reads the dashboard's class lists) | **Each child's name on their coloring sheet's Name line, from a class list**: a teacher printing 22 copies of this week's sheet writes 22 names by hand; a class choice beside Copies would print one sheet per child, named (the generator's Class Set names seed is its twin). | found S629 H

- [ ] S | resources.html | **The Links filters live in the address** (`?cat=&age=`): bookmarkable, kept on reload. | found S454 H

- [ ] S–M | flash_cards.html (reads the dashboard's class lists) | **Make student profiles from a class list.** A class already in the dashboard (`hebrewDashboard_settings.rosters`) is re-typed one `prompt()` at a time; a "From a class list…" choice is ~50 lines + 3 keys, a handshake pair. | found: S412 Pass H

- [ ] S | flash_cards.html | **Find a child in Save Results' profile list.** With 25 profiles the picker opens scrolled to its new-name box (its title out of view) and a child is a scroll away; typing could filter the list (typing an existing name already saves to that child, unsaid). | found: S566 Pass H

- [ ] S–M | classroom_dashboard.html | **One-deep undo in the week editor.** `applyCalendarImport` replaces `settings.scheduleWeek` wholesale, `clearWeekDay` / `copyWeekDayToWeekdays` / `removeWeekPeriod` guard with a native `confirm()` at most, and `weekChanged()` (the choke point) saves immediately with no history. A `weekSnapshot()` at the head of the ~8 mutators + `undoWeek()` + one toolbar …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **Calmer Learn cards for young grades: examples per card (2/3/4) and a primary-name-only switch.** | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | trope_tutor.html | **The mark in its phrase on its Learn card, and the chart's clause order as a family order.** | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | trope_tutor.html | **A second chance before a miss counts** (the seed's other half, the answer count, shipped S629 `97b5fa86`): mark and disable the first wrong pick, allow one more try, and decide what a second-try right answer records. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] S–M (dual) | classroom_dashboard.html | **Today's whole schedule as a strip on the board**, not just Now and Next. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | flash_cards.html | **"All N words, once each" for a word-list deck.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Print the card sheet in the drill's vowel colours.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | flash_cards.html | **Paste this week's words into a new word list from inside Words mode.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L (dual) | flash_cards.html | **Two-sided cards the teacher types, in any language** (English sight words) — not micro. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M (dual) | hebrew_dictionary.html | **A search typed in everyday spelling finds the pointed word** (כיתה → כִּתָּה). | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | hebrew_dictionary.html | **"Every word must have: [vowel]"** for this week's vowel. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | hebrew_dictionary.html | **"Letters taught so far": words made only from allowed letters.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M (dual) | Hebrew_Font_Maker.html | **Auto-detect reads the English (and other-alphabet) template sheets.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S (dual) | Hebrew_Font_Maker.html | **The preview PDF's cover prints the teacher's own sample text.** | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | Hebrew_Font_Maker.html | **Export an English-only handwriting font** — not micro. | found: 2026-10-03, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

## Awaiting the maintainer (an action or an answer only the maintainer can give; a session that resolves one moves it to Done)

- [ ] P4 (**NEW S631 B — a licence fact, the maintainer's call**) | the 9 font pickers (generator, dictionary, flash, torah, trope, dashboard, fontmaker, letter_learner, name_tags) | **Shlomo's own file says "You may not use this font for commercial purposes." (nameID 13), while every picker credits it "Shlomo Orbach — OFL"** (the upstream aharonium/fonts folder is named "(OFL)"): confirm the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S598 D — GATE 2/3 ASKED, the maintainer chose "log it only"**) | trope_tutor.html | **A tradition's Phrases tab draws all its rows at once ("All rows", by design), so on the two long ones (cons_torah 31, cons_haftarah 36 rows, 77 staves) a key step, a melody choice or a language switch is one task of 216–475 ms @4× (56–108 @1×)**; the seven melodies page ~4 rows a group (≤127 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S585 H — a corpus content call**) | data/hebrew_words.json, hebrew_dictionary.html | **The word corpus carries adult and explicit terms that an elementary search surfaces** (a child's search for "ילד" listed one 4th on HEAD, below the word and its phrases after `9b6b2a7d`); nothing in the page filters content. Dropping or hiding a list of entries (with the corpus `?v=` bump on …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P1 (**NEW — the reading-assignments build's live actions; BACKEND BOUNDARY**) | workers/audio/ | **Backend live: 0008, both functions, the Worker on `recordings.ivritsuite.com` (secret, cron, lifecycle rules), the null-MX + SPF records. Left: the Supabase Auth password settings (dashboard), the merge, the iPad hand test (PWA mic, `audio/mp4`, WebM on Safari < 17.4).** | found this build

- [ ] P4 (**NEW S577 N — GATE 2: a phone's default layout; deferred unattended; `n577/sheets/atlas-phone-i13.png`**) | trope_atlas.html | **On a phone the melody table opens as the Grid, where a figure shows its clef only; Stacked shows whole figures**: open Stacked under 560px while no layout is stored? | found S577

- [ ] P3 (**NEW — the maintainer's review, by design**) | trope_review.html, data/trope/trope_approvals.json | **All 20 trope traditions approved; 19 (2026-10-28, at the maintainer's request) without the row-by-row check against their scans.** Still worth checking on `trope_review.html`: the 14 printed 3s kept as written and the raised-fifth spellings of six JE columns; a corrected row hides its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S571 C — GATE 4, not asked (flash's S560 twin waits); `c571/shots/zoom400-*.png`**) | hebrew_dictionary.html | **At 400% zoom (320×256) the sticky phone bar holds 127 of the window's 256 px.** | found S571

- [ ] P3 (**NEW S560 C — GATE 4: short windows; deferred unattended; `c560/shots/short-zoom400-en-light.png`, `short-zoom400-he-dark.png`, `short-i13L-en-light.png`**) | flash_cards.html | **At 400% zoom (1280×1024 → 320×256) the sticky header (112–121px) and Start bar (136–138) leave the setup screen 8px in EN and none in HE** (1366×768 at 200%: 181–184 of 384; iPhone 13 landscape 140 of 342). …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S556 M — GATE 3: the suite's default vowel palette, four tools; deferred unattended; `m556/shots/1280-light-en-color.png`**) | hebrew_dictionary.html (+ dashboard, generator, flash, torah) | **The default scheme's cholam gold (#bb8800) reads 2.99:1 on the cream** — under 3.0 for the 32px headwords it colours and 4.5 for the picker's 17.6px examples (teal 3.16, tzere's purple 3.97, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S553 V — precache size vs offline completeness, the maintainer's call**) | resources.html, sw.js | **The Resources page's four partner fonts (Reuben, TzviScript, its Stroke Guide, Lakhish Bold; 56 KB) are not precached**, so offline the Fonts section's specimens render in a fallback face until the page was visited online once (every other same-origin file the 17 precached pages …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S638 V — joins the S553 precache-size call above**) | letter_learner.html, parsha_emojis.html, sw.js | **The two coloring-sheet illustrations (41 + 49 KB, lazy) are not precached**: on a first offline visit each is a 380×200 broken box with its alt text (`v638/out/sheets-offline-letter_learner.png`); precache them, or accept it. | found S638

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

- [ ] P4 (**NEW S364 Pass G — GATE 2: a default-output choice, deferred unattended; numbers + screens in loop-findings (`g364/out/board-print-en-dark.png`)**) | classroom_dashboard.html | **With background graphics ON, the board's day plates print in their screen colours under the print block's navy ink (`.day-item.colored { color: var(--text) }`): 1.12:1 on Friday's indigo, 1.58 purple, 2.58 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S337 Pass G — GATE 2: a default-behaviour choice, deferred unattended**) | Hebrew_Font_Maker.html | **The tool's two PDFs print on different paper: the Preview PDF specimen is hardcoded A4 (595×842 pt, `format:'a4'`) while the five template sheets are hardcoded Letter (612×792 pt, `format:'letter'`, and the generator's PDFs are Letter too).** A US teacher's specimen comes out …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S332 Pass L — GATE 2 / maintainer fact; deferred unattended**) | index.html | **The hub's Organization `sameAs` and the visible "Created by" link both point at `https://harrisonbleiberg.wpcomstaging.com/`, a WordPress.com staging address.** If a public author URL exists (or the site has moved), both should carry it; if the staging address IS the intended public home, waive this. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S546 P — a shared-module rule, the maintainer's call before a loop fix**) | js/ivrit-saves.js (flash_cards, torah_trainer, trope_tutor, classroom_dashboard, index) | **A brand-new device's first sign-in says "Your account's … settings replaced the ones this device had before you signed in" and offers a download of nothing but the page's defaults** on those five pages (each writes …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S642 M — the maintainer's view only**) | trope_tutor.html | **The `?preview=traditions` banner sits between the tabs and their panel**, so the active tab no longer joins its panel (it floats over a dashed box); placed inside the panel's top, or above the tabs, the join stays. | found S642

## In progress

_(none)_

## Done

- [x] 2026-11-12 | (S646 close-out) | branch/deploy note | **S646 = P on `Hebrew_Font_Maker.html` (its 2nd P alone: S561 → S646; 31 commits to the page since) + `letter_learner.html` (its 2nd alone: S561 → S646; a clean surface buys a second): all seven smokes with the pinned SDK green (fontmaker 63, sync 236, tools 220, account 112, account-page 65, migration 47, saves 15); arms 3–7 10/10 behind …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-12 | `14cafd37` | Hebrew_Font_Maker.html, font-maker.md, sw.js | (S646, the S559 P3) **Auto-detect is offered only on the Letters tab** (it assigns the Hebrew letters; on English it gave A–Z's template א ב ג ד and Apply replaced their photos) | `p646/fix3ad.mjs`, the wizard + a 30-box sheet by real clicks × 4 cells vs HEAD: HEAD both tabs, 05D0–05D3 on English's A; now Letters 30 …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-12 | `3138f5db` | flash_cards.html, sw.js | (S646, the S645 P3) **A graded card's ✓ / ✗ badge reads in dark mode** (the deep navy, as `.lc-mark`) | `c645/fix4.mjs`, a real drill + Prev, front and back × 5 cells vs HEAD: dark 2.43 / 3.20 → 8.13 / 6.18, light 5.66 / 6.28 unchanged; 0 errors

- [x] 2026-11-12 | `365e4f70` | Hebrew_Font_Maker.html, font-maker.md, sw.js, probes | (S646 P, the S565 P3) **The account copy no longer clones the project** (names the photos, then one replacer pass) | `p646/fix1eq.mjs` EQUIVALENT on every slot kind (control DIFFERENT); `w2.mjs` signed in, 8 photos: before its first yield 123–125 → 1 ms @1×, 512–600 → 4–5 @4×; smoke-fontmaker 63/63; probe …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-12 | (S645 close-out) | branch/deploy note | **S645 = C on `flash_cards.html` (its 7th dedicated C: … S381 → S560 → S645; 33 commits to the page since: the drill's Pause and voice speed, the compact results, the card sheet's layout, the folder trees' keys, the install hint's step-aside): census 18 views × 8 desktop cells + 4 phones (9 plant kinds in every view), real-Tab and …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-12 | `767db918` | Hebrew_Font_Maker.html, sw.js | (S645, the S644 P3) **A drawn letter's picture leaves the saved file when the strokes rebuild it exactly** (same PNG, same placement) | `c645/fix3.mjs`, 27 letters by real strokes + one unsaved stroke × EN light 1280 / HE dark 800: 798,516 → 34,309 B, the unsaved letter keeps its picture; the file and a full copy reopen equal (also …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-12 | `f9805666` | flash_cards.html, sw.js | (S645 C, gate 2 answered) **Space presses a drill button the keyboard reached** (read at focusin; a pointer press clears it) | `c645/fix2.mjs`, 17 cases × 4 cells by real Tab / Space / clicks: 17 / 17; HEAD 10 / 17 (the 7 keyboard cases); 0 errors

- [x] 2026-11-12 | `beb53ead` | flash_cards.html, locales, sw.js | (S645 C, gate 2 answered) **A listening answer is marked ✓ / ✗ and spoken, not only coloured** (2 keys) | `c645/fix1.mjs` × 8 cells (2 phones): marks on the right tiles, aria-hidden, ink 5.66–8.13:1, clear of the word and the key; the line with the word's lang; HEAD neither; 0 errors

- [x] 2026-11-11 | (S644 close-out) | branch/deploy note | **S644 = H on `Hebrew_Font_Maker.html` (its 6th H: S97 → S163 → S241 → S380 → S559 → S644; 33 commits to the page since): 3 lessons by real input × EN light 1280 / HE dark 800 (a class font drawn letter by letter → QA Check → Export → My Fonts → the generator; save to the computer → a fresh browser → rename → export; Simple CLM from the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `6679ae8e` | name_tags.html, sw.js, name-tags.md | (S644, the S643 P3) **A headerless class column is the extra line, not the transliteration** | `h644/fix3.mjs`, 12 cases × 4 cells vs HEAD by real input: 8 as meant, 4 byte-identical; 0 errors

- [x] 2026-11-11 | `b2011e0f` | Hebrew_Font_Maker.html, sw.js | (S644 H) **Full Screen in Draw scrolls the canvas up to the screen** | `h644/fix2.mjs` × 4 sizes vs HEAD by the real press: baseline in the window 1 / 4 → 4 / 4, stroke + Save traced 4 / 4; Trace-step control unmoved; 0 errors

- [x] 2026-11-11 | `f76afd83` | Hebrew_Font_Maker.html, locales, sw.js | (S644 H) **The Continue prompts' {time} in Hebrew** (8 `fontmaker.modals.reltime.*` keys) | `h644/fix1.mjs`, a real reload × 4 cells vs HEAD: English byte-identical, Hebrew English phrases 9 / 9 → 0 / 9; 0 errors

- [x] 2026-11-11 | (S643 close-out) | branch/deploy note | **S643 = H on `name_tags.html` (its 2nd H: S551 → S643; 29 commits to the page since: the Print column, the roster import, the Dashboard link both ways, the row grips, the omitted line): 6 lessons by real input × EN light 1280 / HE dark 800 (the office's First / Last / Hebrew / Homeroom spreadsheet → 2-a-page tent cards in Ashkenazi; two …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `7d3411f4` | Hebrew_Font_Maker.html, sw.js | (S643, the S639 M P4) **The export-format menu answers the mouse**: `.tbtn-select:hover` takes `.tbtn:hover`'s brightness | `m639/hv643.mjs` by the real mouse × 4 cells vs a HEAD archive: the select's hover filter none → brightness(1.06), its outlined neighbour's the same (the control); 0 errors

- [x] 2026-11-11 | `4e6b2101` | Hebrew_Font_Maker.html, sw.js | (S643, the S639 M P4) **The Spacing tab's three sliders start and end together**: one `.sp-sliders` grid (a label column, the track, a 3ch monospace readout column; the word-spacing hint spans it) | `m639/sp643.mjs` × 4 cells vs HEAD: tracks 118 / 114 / 109 → 599 / 584 / 592 (EN 1280) and 441–456 → 691–696 (HE 800) become 118–584 and …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `307f39b0` | name_tags.html, sw.js, name-tags.md | (S643 H) **"David" no longer prints above "David Cohen"**: the omitted transliteration also matches the English name's first words, as many as it has (`ntSameLatinLead`) | `h643/fix2.mjs`, 3 lists × Modern / Ashkenazi × English on / off × 2 cells vs HEAD: 32 of 168 tags change, each losing only its transliteration with every …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `6dce57e8` | name_tags.html, sw.js, name-tags.md | (S643 H) **A class's one imported extra line is the list's**: an import into an empty list whose every row carries one value (a Homeroom "3B") sets the list's extra line, a row repeating the list's line carries none, Export writes each row's printed line | `h643/fix1.mjs` + `fix1b.mjs` × 2 cells vs HEAD: the trip line typed in …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | (S642 close-out) | branch/deploy note | **S642 = M on `trope_tutor.html` (its 4th M: S245 → S376 → S558 → S642; 23 commits to the page and `js/trope-staff.js` since: the Year Round [Conservative] melody with Total Torah clips, the 20 traditions, the Drill's melody menu and its 2 / 3 / 4 answers, the tour engine's return): 23 views × 8 cells (EN/HE × light/dark × 1280/800) by …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `07617924` | name_tags.html, sw.js | (S642, the S637 M P4) **The Paste, Dashboard and Rename rows' labels at the form's size**: `.nt-inline > label { font-size:0.88rem }`, the extra-line row's label size | `m641/fix4s642.mjs` × 8 cells vs a HEAD copy, each row opened by a real click: 16.00 → 14.08px beside 13.76–14.4px fields and 13.12px buttons; Paste adds three students, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `0de12299` | hebrew_dictionary.html, sw.js | (S642, the S641 M P4) **Bulk Copy's Select buttons and the export hints at the page's sizes**: the two Select buttons drop their inline 10.4px for `.pos-all-btn`'s 11.52px (their Clear / Copy All siblings'); the export hint, its instructions and the Word Lists description 10.4 → 10.88px (the Bulk Copy hint's) | `m641/fix3s642.mjs` × …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `9dbf8295` | Hebrew_Font_Maker.html, sw.js | (S642, the S639 M P4) **Every slider gold**: one page-wide `input[type=range]{accent-color:var(--gold)}`, the per-slider rules unchanged | `m639/fix6.mjs` × EN light 1280 / HE dark 800 / EN dark 1280 / HE light 800 on `?start=simple-clm` (Nikkud, Place Trop, the point editor's four sections open, Spacing): HEAD 10 of 27 visible …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-11 | `7295d598` | trope_tutor.html, sw.js | (S642 M) **The mastery grid's Geresh group keeps Pazer on its row**: `.tu-mgrid` max-width 720 → 760px | `m642/fix1.mjs` × 8 cells, the start screen and the results of a real 5-question drill vs a HEAD copy: at 1280 the Geresh row 2 lines → 1 (its cells need 598px, had 594, now 634), every other family one line as before; at 800 the page …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

- 2026-11-12 | **S646** | iters: 4 | tools: Hebrew_Font_Maker ×2, flash_cards, font-maker.md ×2, sw ×3, probes | patterns fixed: — | pass run: P (fontmaker, first since S561; + letter_learner, a clean surface buys a second; FOUND 0 new) + 3 queue items (the S565, S645 and S559 P3s) | SW: v1366→v1369

- 2026-11-12 | **S645** | iters: 4 | tools: flash_cards ×2, Hebrew_Font_Maker, locales, sw ×3 | patterns fixed: — | pass run: C (flash_cards, first since S560; FOUND 4, FIXED 2) + the FM's S644 P3 | SW: v1363→v1366

- 2026-11-11 | **S644** | iters: 4 | tools: Hebrew_Font_Maker ×2, name_tags, locales, name-tags.md, sw ×3 | patterns fixed: — | pass run: H (fontmaker, first since S559; FOUND 7, FIXED 2) + Name Tags' S643 P3 | SW: v1360→v1363

- 2026-11-11 | **S643** | iters: 5 | tools: name_tags ×2, Hebrew_Font_Maker ×2, name-tags.md, sw ×4 | patterns fixed: — | pass run: H (name_tags, first since S551; FOUND 3, FIXED 2) + the FM's two S639 P4s | SW: v1356→v1360

- 2026-11-11 | **S642** | iters: 5 | tools: trope_tutor, Hebrew_Font_Maker, hebrew_dictionary, name_tags, sw ×4 | patterns fixed: — | pass run: M (trope_tutor, first since S558; FOUND 3, FIXED 1) + 3 queue P4s (the FM, the dictionary, Name Tags) | SW: v1352→v1356

- 2026-11-11 | **S641** | iters: 5 | tools: hebrew_dictionary ×2, Hebrew_Font_Maker, name_tags, sw ×4, loop-patterns | patterns fixed: dark-base-rule-outranks-variant ×1, dark-navy-fill-matches-its-ground ×1, contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: M (hebrew_dictionary, first …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-11 | **S640** | iters: 5 | tools: flash_cards ×2, Hebrew_Font_Maker ×2, sw ×4, loop-patterns | patterns fixed: install-banner-over-a-sheet's-bottom-controls ×1, mobile-input-hints ×1, contrast-below-AA-on-a-tinted-or-coloured-plate ×2 | pass run: N (flash_cards, first since S555; FOUND 2, …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-11 | **S639** | iters: 4 | tools: Hebrew_Font_Maker ×2, sw ×3, ops.md, loop probe, loop README | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1, native-control-outside-the-field-rule ×1 | pass run: M (Hebrew_Font_Maker, first since S554; FOUND 7, FIXED 2) + the S638 P3 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-11 | **S638** | iters: 4 | tools: sw ×2, loop probes ×3, ops.md, torah-and-trope.md, loop README | patterns fixed: — | pass run: V (suite, first since S553; 480 commits; FOUND 6, FIXED 3) | SW: v1339→v1341

- 2026-11-09 | **S637** | iters: 5 | tools: name_tags ×2, Hebrew_Font_Maker, trope_tutor, hebrew_blend_generator, sw | patterns fixed: dark-hover-resolves-to-the-rest-colour ×1, RTL-inheritance-on-a-Latin-script-container ×1 | pass run: M (name_tags, first since S552; FOUND 2, FIXED 2) + the S554 …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-09 | **S636** | iters: 5 | tools: name_tags ×2, generator ×2, locales, name-tags.md, generator.md, sw | patterns fixed: RTL-inheritance-on-a-Latin-script-container ×1 | pass run: G (name_tags, first since S550; FOUND 2, FIXED 2) + the S590/S613 generator P4s | SW: v1329→v1333

- 2026-11-09 | **S635** | iters: 4 | tools: name_tags ×2, flash, name-tags.md, sw | patterns fixed: rebuild-where-a-class-swap-would-do ×1 | pass run: D (name_tags, first since S549; FOUND 2, FIXED 2) + the S618 flash P4 | SW: v1326→v1329

- 2026-11-09 | **S634** | iters: 4 | tools: name_tags ×2, classroom_dashboard ×2, torah_trainer ×2, flash, generator, index, dictionary, fontmaker, locales, sw | patterns fixed: decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: C (name_tags, first since S548; FOUND 2, FIXED 2) + the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-09 | **S633** | iters: 5 | tools: parsha_emojis ×2 (+ micro), account, locales, sw | patterns fixed: button-focus-lost-to-its-own-rebuild ×1 | pass run: P (parsha_emojis, first since S546; FOUND 1, FIXED 1) + the S606 account P4 + micro-feature (gate 1: split-week line) | SW: v1320→v1323

- 2026-11-09 | **S632** | iters: 4 | tools: trope_atlas, js/i18n.js (every page), fontmaker, sw | patterns fixed: decorative-glyph-carrier-exposed-to-assistive-tech ×2 | pass run: N (letter_learner, first since S545 + parsha_emojis, first since S547, with the `parsha/` pages' first) | SW: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-08 | **S631** | iters: 5 | tools: the 9 font pickers, name_tags, dashboard, letter_learner, locales, sw | patterns fixed: async-export-runs-twice-on-a-second-press ×1 | pass run: B (suite, S543 → S630, 503 commits) + micro-feature | SW: v1312→v1315

- 2026-11-08 | **S630** | iters: 5 | tools: generator, fontmaker, flash, locales, sw | patterns fixed: async-export-runs-twice-on-a-second-press ×2 | pass run: F (suite, long-build progress; first since S542) + micro-feature | SW: v1309→v1312

- 2026-11-08 | **S629** | iters: 5 | tools: trope_tutor, parsha/ + build-parsha-pages, data/hebrew_words.json + dictionary/generator/flash (?v=), locales, sw | patterns fixed: — | pass run: H (parsha_emojis, first since S540; + its parsha/ pages + trope_tutor, first since S557) + micro-feature | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-08 | **S628** | iters: 4 | tools: trope_atlas ×2, torah_trainer, locales, sw | patterns fixed: — | pass run: I (suite, first since S539; 503 commits) | SW: v1304→v1307

- 2026-11-08 | **S627** | iters: 4 | tools: parsha_emojis, hebrew_dictionary, locales, sw | patterns fixed: — | pass run: D (parsha_emojis, first since S538; + its parsha/ pages, their first D) + micro-feature | SW: v1302→v1304

### Tool coverage (last-touched date per tool)

- **Snapshot S646 (2026-11-12):** Hebrew_Font_Maker ×2, flash_cards, font-maker.md ×2, sw.js ×3, probes, loop docs S646 · flash_cards ×2, Hebrew_Font_Maker, locales, sw.js ×3, loop docs S645 · Hebrew_Font_Maker ×2, name_tags, locales, name-tags.md, sw.js ×3, loop docs S644 · name_tags ×2, Hebrew_Font_Maker ×2, name-tags.md, sw.js ×4, loop docs S643 · trope_tutor, Hebrew_Font_Maker, hebrew_dictionary, name_tags, sw.js ×4, loop docs S642 · hebrew_dictionary ×2, Hebrew_Font_Maker, name_tags, sw.js ×4, loop docs S641

### Pattern health (one status line per pattern — shape, owner, detection and record: docs/reference/loop-patterns.md)

- `async-export-runs-twice-on-a-second-press` | ACTIVE | owner F | det: recipe | last S631 | streak 0 | hits 3

- `print-block-split-at-a-sheet-foot` | ACTIVE | owner G | det: scripts/loop/probes/S575-chrome-print-whole-blocks.mjs | last S617 | streak 0

- `focus-hidden-under-a-sticky-bar` | ACTIVE | owner C | det: recipe | last S607 | streak 0

- `hover-tip-not-dismissible-or-hoverable` | ACTIVE | owner C | det: recipe | last S594 | streak 0

- `tour-step-in-a-hidden-view` | ACTIVE | owner A | det: recipe | last S558 | streak 0

- `dark-hover-resolves-to-the-rest-colour` | ACTIVE | owner A | det: recipe | last S637 | streak 0 | hits 1

- `latin-sentence-boundary-in-hebrew-prose` | ACTIVE | owner M | det: scripts/loop/detect-latin-sentence-boundary-in-hebrew-prose.mjs | last S554 | streak 0

- `offscreen-sheets-laid-out-on-every-rebuild` | ACTIVE | owner D | det: recipe | last S612 | streak 0

- `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

- `defaults-filed-as-the-device's-own-at-first-sign-in` | ACTIVE | owner P | det: recipe | last S546 | streak 0 | hits 6

- `selected-state-lost-in-forced-colors` | ACTIVE | owner C | det: recipe | last S613 | streak 0

- `live-region-shown-with-its-text` | ACTIVE | owner G | det: recipe | last S553 | streak 0

- `abs-child-escapes-its-scroller` | ACTIVE | owner N | det: recipe | last S595 | streak 3

- `empty-result-not-announced` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `print-trailing-padding-adds-a-sheet` | ACTIVE | owner H | det: recipe | last S597 | streak 0

- `unseen-hit-box-over-controls` | ACTIVE | owner C | det: recipe | last S530 | streak 1

- `layout-read-per-grid-at-build` | ACTIVE | owner D | det: recipe | last S605 | streak 0

- `dark-palette-baked-into-paper` | ACTIVE | owner G | det: recipe | last S604 | streak 0

- `tour-not-following-a-live-switch` | ACTIVE | owner K | det: recipe | last S623 | streak 1

- `overlay-scoped-dialog-keys` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `group-toggle-wipes-a-sibling-group` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `infinite-box-shadow-pulse-repaints-every-frame` | ACTIVE | owner D | det: recipe | last S511 | streak 0

- `new-page-print-block-without-the-ink-remap` | ACTIVE | owner G | det: recipe | last S575 | streak 2

- `page-drops-a-field-it-cannot-apply` | ACTIVE | owner P | det: recipe | last S507 | streak 0

- `theme-token-on-an-always-dark-surface` | ACTIVE | owner N | det: recipe | last S572 | streak 2

- `data-edit-under-an-unchanged-buster` | ACTIVE | owner E | det: recipe | last S621 | streak 1

- `root-var-per-input` | ACTIVE | owner D | det: recipe | last S497 | streak 1

- `dark-palette-on-the-element` | ACTIVE | owner G | det: recipe | last S495 | streak 0

- `count-noun-without-a-one-form` | DRAFT | owner I | det: none | last S533 | streak 0

- `busy-disabled-button-drops-focus` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `hidden-input-anchored-outside-its-scroller` | ACTIVE | owner C | det: recipe | last S499 | streak 0

- `hebrew-faux-italic` | ACTIVE | owner M | det: recipe | last S608 | streak 0

- `flex-box-drops-a-sentence-space` | ACTIVE | owner M | det: scripts/loop/probes/S588-flex-box-keeps-its-sentence-spaces.mjs | last S588 | streak 0 | hits 1

- `fixed-toast-duration-shorter-than-its-text` | ACTIVE | owner F | det: recipe | last S487 | streak 0

- `centred-fixed-box-shrinks-to-half-the-viewport` | ACTIVE | owner F | det: recipe | last S484 | streak 0

- `shared-module-fallback-literal-without-a-dark-twin` | ACTIVE | owner C | det: recipe | last S483 | streak 0

- `rtl-copy-names-the-english-side` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `copy-names-a-control-by-a-label-it-lacks` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `screen-frame-prints-as-rails` | ACTIVE | owner D | det: recipe | last S480 | streak 0

- `enter-ignored-beside-its-own-button` | ACTIVE | owner B | det: recipe | last S472 | streak 0

- `placeholder-keeps-the-browser-gray` | ACTIVE | owner F | det: scripts/loop/detect-placeholder-keeps-the-browser-gray.mjs | last S581 | streak 1

- `header-wrap-gate-below-its-ceiling` | ACTIVE | owner M | det: recipe | last S584 | streak 1

- `latin-tracking-on-hebrew-labels` | ACTIVE | owner H | det: recipe | last S611 | streak 0

- `forward-arrow-points-back-in-rtl-copy` | ACTIVE | owner N | det: recipe | last S555 | streak 3

- `share-link-writes-the-teachers-saved-preferences` | ACTIVE | owner P | det: recipe | last S472 | streak 1

- `link-undone-by-its-loads-first-sync` | ACTIVE | owner P | det: scripts/smoke-sync.mjs | last S602 | streak 0 | hits 1

- `bulk-apply-skips-a-renderer-the-control-runs` | ACTIVE | owner K | det: recipe | last S472 | streak 1

- `radio-set-without-a-question` | ACTIVE | owner B | det: recipe | last S527 | streak 0

- `native-input-display-none-under-its-label` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `stale-tab-flush-writes-its-old-copy` | ACTIVE | owner A | det: recipe | last S493 | streak 0

- `flex-range-keeps-its-min-content-width` | ACTIVE | owner B | det: recipe | last S577 | streak 0

- `slider-value-announced-as-its-position` | ACTIVE | owner F | det: recipe | last S456 | streak 0

- `ltr-machine-text-field-typed-rtl` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `pre-ready-interpolated-write-never-healed` | ACTIVE | owner I | det: recipe | last S454 | streak 0

- `cdn-library-parser-blocking-for-one-action` | ACTIVE | owner D | det: recipe | last S590 | streak 0

- `dark-navy-fill-matches-its-ground` | ACTIVE | owner M | det: recipe | last S641 | streak 0

- `ring-below-3-on-light` | ACTIVE | owner F | det: recipe | last S443 | streak 0

- `tip-escape-drops-focus` | ACTIVE | owner C | det: recipe | last S441 | streak 0

- `account-wide-delete-confirm-without-signed-in-wording` | ACTIVE | owner P | det: recipe | last S596 | streak 1

- `logical-inset-mirrors-onto-pinned-content` | ACTIVE | owner H | det: recipe | last S440 | streak 0

- `tip-name-joins-its-field's-name` | ACTIVE | owner A | det: recipe | last S607 | streak 0

- `panel-title-keyed-on-an-inner-span` | ACTIVE | owner B | det: recipe | last S439 | streak 0

- `copy-claims-success-on-a-refused-clipboard` | ACTIVE | owner F | det: recipe | last S445 | streak 0

- `button-focus-lost-to-its-own-rebuild` | ACTIVE | owner F | det: recipe | last S633 | streak 0

- `dark-literal-escapes-the-print-tokens` | ACTIVE | owner G | det: recipe | last S636 | streak 3

- `editor-re-parse-caps-a-merged-list` | ACTIVE | owner P | det: recipe | last S421 | streak 0

- `window-taller-than-a-phone-without-a-scroll` | ACTIVE | owner N | det: recipe | last S595 | streak 4

- `install-banner-over-a-sheet's-bottom-controls` | ACTIVE | owner N | det: scripts/loop/probes/S572-install-hint-tours.mjs | last S640 | streak 0

- `flash-restores-captured-text-not-its-key` | ACTIVE | owner E | det: recipe | last S417 | streak 0

- `visible-label-missing-from-the-accessible-name` | ACTIVE | owner B | det: recipe | last S531 | streak 0

- `designed-key-miss-probed-through-t` | ACTIVE | owner B | det: recipe | last S533 | streak 2

- `pinned-english-without-lang` | ACTIVE | owner B | det: recipe | last S533 | streak 0

- `toggle-name-flips-with-its-pressed-state` | ACTIVE | owner F | det: recipe | last S431 | streak 0

- `author-display-defeats-the-hidden-attribute` | ACTIVE | owner F | det: recipe | last S601 | streak 0 | hits 1

- `button-group-label-not-programmatic` | ACTIVE | owner C | det: recipe | last S413 | streak 0

- `settings-lost-across-a-load` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `live-region-display-none-while-empty` | ACTIVE | owner M | det: recipe | last S584 | streak 1

- `dark-base-rule-outranks-variant` | ACTIVE | owner M | det: recipe | last S641 | streak 0

- `aria-disabled-lock-no-handler-checks` | ACTIVE | owner P | det: recipe | last S407 | streak 0

- `text-field-under-16px-zooms-on-ios-focus` | ACTIVE | owner N | det: recipe | last S608 | streak 0

- `textContent-rewrite-erases-a-control-icon` | ACTIVE | owner K | det: recipe | last S623 | streak 1

- `english-literal-passed-to-a-message-helper` | ACTIVE | owner K | det: recipe | last S623 | streak 2

- `translated-key-exists-page-hardcodes-english` | ACTIVE | owner K | det: recipe | last S623 | streak 2

- `per-page-code-inside-a-shared-block` | DRAFT | owner E | det: none | last S416 | streak 0

- `icon-markup-into-a-textContent-writer` | DRAFT | owner E | det: none | last S403 | streak 0

- `cached-rejected-loader-promise-blocks-every-retry` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `cdn-dependency-absent-and-unguarded` | ACTIVE | owner B | det: recipe | last S399 | streak 0

- `selector-declared-twice-in-one-stylesheet` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `untrusted-card-field-interpolated-unescaped` | ACTIVE | owner D | det: recipe | last S393 | streak 0

- `auth-param-read-before-its-cleanup-runs` | ACTIVE | owner P | det: recipe | last S596 | streak 1

- `hover-feedback-survives-the-disabled-state` | ACTIVE | owner F | det: recipe | last S394 | streak 0

- `physical-property-that-never-mirrors` | ACTIVE | owner K | det: recipe | last S623 | streak 1

- `tile-grid-built-hidden-never-roved` | DRAFT | owner P | det: none | last S382 | streak 0

- `stored-json-of-the-wrong-shape-trusted` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `validation-note-stores-rendered-text` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `popup-without-a-keyboard-contract` | ACTIVE | owner A | det: recipe | last S371 | streak 2 | hits 0

- `stale-validation-note-after-its-input-changes` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `apply-settings-trusts-collection-members` | ACTIVE | owner L | det: recipe | last S387 | streak 0

- `save-over-an-existing-name-without-confirm` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `fixed-surface-missing-from-the-print-hide-list` | ACTIVE | owner G | det: recipe | last S636 | streak 2

- `control-class-without-a-hover-state` | ACTIVE | owner L | det: recipe | last S373 | streak 0

- `false-clean-from-a-literal-only-pattern-match` | ACTIVE | owner O | det: recipe | last S309 | streak 0

- `false-clean-from-an-unverified-probe-handle` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `light-literal-text-on-the-gold-token` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `sub-floor touch target` | ACTIVE | owner E | det: recipe | last S614 | streak 0

- `vh-capped-sheet-without-dvh-twin` | ACTIVE | owner A | det: recipe | last S385 | streak 1

- `ledger-section-loss` | ACTIVE | owner F | det: recipe | last S296 | streak 0

- `dark-mode-token-as-text-on-a-light-ground` | ACTIVE | owner C | det: recipe | last S534 | streak 0

- `non-finite-number-from-a-loaded-file` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `slider-focus-lost-to-its-own-rebuild` | DRAFT | owner A | det: none | last S286 | streak 0 | hits 6

- `class-only-selected-state` | ACTIVE | owner A | det: recipe | last S357 | streak 0 | hits 0

- `animation-outside-its-reduced-motion-block` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `help-affordance-inside-a-label-forwards-its-tap` | ACTIVE | owner A | det: recipe | last S594 | streak 0

- `csv-cell-quoting-integrity` | ACTIVE | owner I | det: recipe | last S281 | streak 0

- `dark-print-shadow-slab` | DRAFT | owner A | det: none | last S385 | streak 0

- `pinned-english-prose-in-rtl-paragraph` | ACTIVE | owner M | det: recipe | last S584 | streak 7

- `fixed-width-third-party-embed-inflates-phone-layout` | ACTIVE | owner N | det: recipe | last S276 | streak 0 | hits 2

- `stale-html-fallback-behind-its-csv-value` | ACTIVE | owner K | det: recipe | last S623 | streak 0 | hits 4

- `undocumented-global-keyboard-shortcut` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `fixed-size-control-holding-translatable-text` | ACTIVE | owner A | det: recipe | last S264 | streak 1 | hits 0

- `legibility-destroyed-by-a-second-dimming-layer` | ACTIVE | owner A | det: recipe | last S263 | streak 0 | hits 1

- `fixed-control-positioned-outside-the-viewport` | ACTIVE | owner N | det: recipe | last S595 | streak 2 | hits 3

- `executable-javascript-in-a-localization-cell` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `i18n-html-markup-only-in-fallback` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `global-keydown-preventDefault-without-target-guard` | DRAFT | owner A | det: none | last S272 | streak 0

- `row-siblings-with-mismatched-heights` | ACTIVE | owner A | det: recipe | last S556 | streak 1

- `debounced-persistence-with-no-page-hide-flush` | ACTIVE | owner A | det: recipe | last S258 | streak 0 | hits 1

- `state-mutation-that-never-arms-its-persistence` | ACTIVE | owner A | det: recipe | last S257 | streak 0 | hits 1

- `flex-column-crushing-its-own-rows` | ACTIVE | owner N | det: recipe | last S572 | streak 2

- `translated-sibling stray` | DRAFT | owner H | det: none | last S336 | streak 0

- `mobile-input-hints` | ACTIVE | owner I | det: recipe | last S640 | streak 0

- `i18n cross-column parity (placeholders, plurals, inline markup)` | ACTIVE | owner K | det: recipe | last S623 | streak 3 | hits 0

- `horizontal-overflow-at-narrow-widths` | ACTIVE | owner N | det: recipe | last S602 | streak 0 | hits 6

- `fixed-columns-crush-a-narrow-sheet` | ACTIVE | owner N | det: scripts/loop/probes/S572-generator-realwords-narrow-cards.mjs | last S572 | streak 0 | hits 1

- `hover-only-affordance-under-a-synthetic-mouse-event` | ACTIVE | owner N | det: recipe | last S595 | streak 4 | hits 1

- `contrast-inverted-by-a-hover-or-active-state` | ACTIVE | owner C | det: recipe | last S368 | streak 0

- `dark-override-outranks-hover` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `contrast-below-AA-on-a-tinted-or-coloured-plate` | ACTIVE | owner M | det: recipe | last S641 | streak 0

- `native-control-outside-the-field-rule` | ACTIVE | owner M | det: recipe | last S639 | streak 0 | hits 2

- `async-store-backed-choice-clobbered-by-a-sync-fallback` | ACTIVE | owner A | det: recipe | last S226 | streak 1

- `rebuild-where-a-class-swap-would-do` | ACTIVE | owner A | det: recipe | last S635 | streak 0 | hits 2

- `decorative-glyph-carrier-exposed-to-assistive-tech` | ACTIVE | owner A | det: recipe | last S634 | streak 0

- `error-status-clobbered-by-a-later-routine-write` | DRAFT | owner A | det: none | last S411 | streak 0

- `content-dependent-tour-step-miscounts-the-tour` | DRAFT | owner A | det: none | last S197 | streak 0

- `per-sample-repaint-of-an-O(n)-live-preview` | DRAFT | owner A | det: none | last S196 | streak 0

- `false-positive-validator-on-the-app's-own-content` | ACTIVE | owner A | det: recipe | last S194 | streak 0

- `JSON-LD ↔ visible-content parity` | ACTIVE | owner L | det: recipe | last S622 | streak 1

- `wired-then-clobbered label` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `theme-flipping-token-on-a-fixed-colour-plate` | ACTIVE | owner A | det: recipe | last S191 | streak 0

- `two-state-ready-flag-for-a-three-state-load` | DRAFT | owner F | det: none | last S542 | streak 0

- `invalid-SVG-geometry-from-an-unclamped-difference` | DRAFT | owner A | det: none | last S187 | streak 0

- `RTL-inheritance-on-a-Latin-script-container` | ACTIVE | owner A | det: recipe | last S637 | streak 0 | hits 5

- `silent-external-media-failure` | ACTIVE | owner A | det: recipe | last S0 | streak 0

- `print-trailing-dead-space` | DRAFT | owner A | det: none | last S0 | streak 0

- `lazily-loaded-dependency-renders-an-empty-shell` | DRAFT | owner A | det: none | last S416 | streak 0

- `print-media-leak / var-chain-overridden-by-a-literal` | ACTIVE | owner A | det: recipe | last S626 | streak 0 | hits 1

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

- P accounts & cloud (one surface): 2026-11-12 (**S646 — 24th P, `Hebrew_Font_Maker.html` (its 2nd alone, S561 → S646; 31 commits — the autosave without its copy, the deleted-copy unlink, the slimmer drawn-letter file, the Continue prompt's Hebrew time) + `letter_learner.html` (its 2nd alone, S561 → S646; 14 commits — the open card in the address bar, Select all / Clear): all seven smokes with …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): SKIP since S403 — the sandbox refuses to execute the third-party detector ("Code from External"); runs again once the maintainer commits a `.claude/settings.json` permission rule for it (`docs/reference/deslop-detector.md`). Last run 2026-09-08 (S346, `flash_cards.html`, 6th O; the S399/S403 refusals are in the archive).

- N mobile & touch-device (one surface): 2026-11-11 (**S640 — 40th N, `flash_cards.html` (its 4th: S244 → S361 → S555 → S640; 37 commits to the page since: the drill's Pause and voice speed, the compact results, the sticky bars' measured heights, the printable card sheet, the folder tree's keys): 18 views × 16 cells (iPhone SE, 13, 13 sideways, Pixel 7 × EN/HE × light/dark) by real taps on a …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-11-11 (**S642 — 43rd M, `trope_tutor.html` (its 4th: S245 → S376 → S558 → S642; 23 commits to the page and `js/trope-staff.js` since: the Conservative melody, the traditions, the Drill's melody and answer count): 23 views × 8 cells by real clicks, 184 loads, 21,355 text readings (plant 184/184), hover 619 × 2 themes (plant 11/11), fills 0 …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-11-06 (**S623 — 37th K, `843984b3..2d9e7e23` (525 commits; the Trope Atlas', Name Tags', the assignments and review pages' and the `parsha/` pages' first K): CSV +925 / −2 / 67 reworded (parity, arrows, plurals read); static 5,956 refs (0 missing) + 3,460 fallback sites; blind 0/12,102 added lines; 42 live-switch cells on the tree and the base (raw keys 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-11-12 (**S645 — `flash_cards.html` (its 7th dedicated C: S381 → S560 → S645; 33 commits to the page since): census 18 views × 8 cells + 4 phones (9 plant kinds in every view), Tab and Shift+Tab walks over 5 screens (ringless plant 5/5), dialogs, the drill keys, reflow, motion, forced colours, hover, 1.4.12 (plant 6/6). FOUND 4, FIXED 2 (gate 2 both): a listening …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-10-31 (**S581 — 42nd A, scoped to the outside-loop reading-assignments landing (`a7fa5f1..aab737c`, 18 of its 53 commits; `reading_assignments.html`, `js/ivrit-assignments.js`, the Trainer's +838): the security arms (no `innerHTML`, reviver-safe parses, URL sinks, an anonymous Trainer loads no assignments module), then two catalog recipes committed as detectors …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-11-09 (**S636 — `name_tags.html` (its 2nd G: S550 → S636; 29 commits to the page since: the Print column, the typed transliteration, the omitted line, the roster import): 28 layouts × EN light 1280 / HE dark 800 on 24 students, 3 unticked (56 PDFs; pages, paper, margin, each page's letters = its frame's; 4 plants fired; dark = light), mid-typing print, …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-11-09 (**S635 — `name_tags.html` (its 2nd D: S549 → S635; 46 commits to the page since: the Print column, the row grips, the Dashboard link both ways, the roster import): cold 12 cells (200 students @1× 458–588 ms of long tasks, @4× 2,725–3,099; S549 after its fix 451 / 3,660), 48 arms by real input × 4 cells behind a 300 ms control; every table rebuild @4× …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-11-08 (**S628 — 41st I, S539 → S627 (503 commits; the Trope Atlas', reading assignments', the review page's and the 55 `parsha/` pages' first I): 81 virgin cells (plants 482/486); storage = S539's; 88 seeds; 27 tours; ~260 openers + 24 drawer tabs; 164 bad URLs; the Atlas' load paths; 55 parsha pages. FOUND 4, FIXED 3.**)

- B console/error audit: 2026-11-08 (**S631 — 42nd B, S543 → S630 (503 commits; the Trope Atlas', reading assignments', the review page's and the `parsha/` pages' first B): 210 load cells, 10 tours, 1,890 crawl presses + 15 Settings tabs, both recording sources, iPhone ×48, 55 external URLs. 0 page errors. FOUND 1, FIXED 1 (+1 licence question).**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- V offline & service-worker runtime (suite): 2026-11-11 (**S638 — 2nd V, `c349f98e..ad39f20` (480 commits; the Trope Atlas', the `parsha/` pages', the precached assignments module's and the approvals branch's first V): the outage 24 paths × light 1280 EN / dark 800 HE = 48 cells from the worker, 0 errors, 0 raw keys; VERSION+1 (the old cache gone, the data cache kept); plants 2/2; a signed-in …[full text: IMPROVEMENT_ARCHIVE.md]

- L SEO & discoverability audit: 2026-11-06 (**S622 — 30th L, `ca9b9618..b816c43d` (527 commits; the Trope Atlas', Name Tags', the assignments page's, the review page's and the 54 `parsha/` pages' first L): 20 static arms over 79 pages (titles, descriptions, canonicals, robots, OG = Twitter + the images on disk and at 1200×630, every JSON-LD block parsing with its breadcrumbs resolving and its …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-11-11 (**S644 — `Hebrew_Font_Maker.html` (its 6th: S97 → S163 → S241 → S380 → S559 → S644; 33 commits to the page since): 3 lessons by real input × EN light 1280 / HE dark 800 (a drawn class font → Export → My Fonts → the generator; a next-day file → rename → export; Simple CLM → a moved qamats → Preview PDF → Export) + the student cell (Draw …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-11-06 (**S621 — 42nd E, `48286048..6985aaf4` (530 commits; the Trope Atlas', Name Tags', the assignments page's, the `parsha/` pages' and the Worker's first E): 31 static arms rebuilt (`e621/arms.py`: precache both ways + the loaded scripts, `?v=` agreement + ops.md, 2,045 refs + md links, og = twitter, CSP first / account origins / 279 external refs, …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-11-08 (**S630 — 41st F, long-build progress (S542's F-next; the affordance's first F): 13 presses that build before they answer, by real clicks with an animation-frame recorder, real PDF libraries from a cache, a held CDN, double presses at raw points. FOUND 2, FIXED 2 (+1 P4). F-next: destructive-action confirms.**)

**Next session (S647):** **Branch `claude/lucid-brahmagupta-t4hdnh` (S638–S646, draft PR Hbleiberg/Hebrew_Blender#399): open → continue on it; merged → fresh branch off `origin/main`.** `sw.js` **v1369**, FM **5.59**, corpus ?v=**8**. ⚑ drift: main=ad39f20 sw=v1369 fm=5.59 migration=0012_helpers_out_of_api.sql live=yes functions=eb3e7ad sdk=2.116.0 config=58edf33 keepalive=aed4e7b ⚑ Stalest now: N trope (S562), G generator (S563), H dashboard (S564), D fontmaker (S565), P dashboard (S567), M torah (S568), C dictionary (S571), A (S581). ⚑ Queue: the FM's S644 P3 (fullscreen Draw clips below 1181px, not small); the local snapshot's long tasks on a photo project (S646 P4, attribute first). ⚑ A suite question for the next F or C: do other tools show an answer's right / wrong by colour alone (S645's listening tiles did)? ⚑ Harness `p646/` (the smoke-fontmaker slice + `h644` strokes), traps 631–635 (findings S646). ⚑ `print-media-leak`: `leak.mjs` hits on 6 pages for each page's next G. ⚑ 46 seeds.
