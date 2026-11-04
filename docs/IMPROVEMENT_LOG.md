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

- [ ] P3 (**NEW S602 — found verifying `3ab8b385`; its gate-4 answer covers it, measure Export PDF landscape first**) | hebrew_blend_generator.html | **With Landscape Print on, the on-screen blend sheet keeps ten columns where they do not fit**: Inverse 46–61px past the sheet at 1280/1600; on an iPhone 13 Reading 106–119px, Inverse 445px (paper unchanged). | found S602

- [ ] P3 (**NEW S593 G — verify on a Mac first**) | Hebrew_Font_Maker.html | **Every font named only in Hebrew exports with nameID 6 `MyHebrewFont-Regular` (and `MyHebrewFont.ttf`)**: two such fonts share one PostScript name, which Font Book and Mac apps key fonts by; a stem from the name (a short hash or a transliteration) would keep them apart. | found S593

- [ ] P3 (**NEW S580 C — design call**) | trope_atlas.html | **The melody table is 594 tab stops (one sing button per figure)**: a keyboard user crosses the whole table to reach the phrase section; a roving tabindex (one stop per row, arrows between) or a skip past the table would fix it. | found S580

- [ ] P3 (**NEW S574 M — verify paper first**) | hebrew_blend_generator.html | **The crossword's grid is never cropped to its words**: a 10-word puzzle in a 12×12 black square (~70% black). | found S574

- [ ] P3 (**NEW S571 C — not small**) | hebrew_dictionary.html | **A word card is one `role=button` holding its select box, Copy, Hear and Google controls** (a button's children are presentational): move the details action onto the headword, the card a group. | found S571

- [ ] P3 (**NEW S565 D — verify first, signed in**) | Hebrew_Font_Maker.html | **The cloud autosave still clones the whole project with its photos**: `fmCloudPack` runs `JSON.parse(JSON.stringify(p))` on every 10 s save of a dirty cloud project — the copy `c85bdd1` took out of the local autosave; measure with smoke-fontmaker's `--sdk` fixture and 8 phone photos. | found S565

- [ ] P3 (**NEW S559 H — gate 2, copy**) | Hebrew_Font_Maker.html | **Help (Uploading, Download Templates) and the after-upload status still say "drag a box around each glyph"**: Auto-detect letters and Trace all (v5.59) are never named in the instructions, so the one-sheet path reads as 27 hand-drawn boxes. | found S559

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P3 (**NEW S480 D — verify first; S576: 13/200 on Chromium 153**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4× (S565: 302–502 @1×). Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P3 (**NEW S595 N — needs the tour-engine extraction, UX rule 1**) | Hebrew_Font_Maker.html, hebrew_dictionary.html, tour engine | **On a landscape phone (750×342) the tour card falls back onto its own target**: the starting-font tour's steps 2, 3, 7 covered 93–100%; the shared engine shares the fallback; the dictionary's own engine (S601 N) covers 31–54% of steps 2–5 at 750×342 and 863×360. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S570 D — not small: yield per verse or a worker**) | torah_trainer.html | **Turning Translit on freezes the page for the reading's first transliteration pass**: one task of 520 ms @1× / 2.45 s @4× on Vayera (2,085 words; the Trope staff 447 / 2,691), and a cold load with Translit on 536–582 / 2,751–2,948 — the library's syllabification; the memos spare only re-renders (findings …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S565 D — the intake half is gate 2**) | Hebrew_Font_Maker.html | **The Trace step still freezes 1.5–1.9 s on a 12 MP phone photo** (3.1–3.3 s before `6ef102d`; 16 s @4×): `flatCanvasFor` flattens the whole 3024×4032 photo (decode + `getImageData` ~1 s, the blur 0.55 s). Keeping intake photos near 2,000 px (`prepImageForItem`) would cut it ~4× and shrink every snapshot and file — a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3, the sheet's layout**) | hebrew_blend_generator.html | **Name the Letter with QR Answer Key prints the code alone on page 2** (Letter and A4, 4/4 cells; Export PDF fits it): the 40-letter sheet is 977 of the page's 989 px and the QR block needs 109, so every student copy costs an extra sheet and loses its code. No small fix keeps both: tighter cells in print when …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S563 G — gate 3 or a shorter payload**) | hebrew_blend_generator.html | **The printed answer-key QR is 2.2 cm for 81–125 modules, 0.18–0.27 mm a module** (below the ~0.33 mm print guidance): decoded from the Print PDF at 300 dpi only 3/10 shapes, at 600 dpi 10/10, so an ordinary phone at reading distance may fail. Larger box (layout) or a shorter `?ak=` payload (findings S563). | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492; S562's census, not the clamp's: the dictionary 4/4, the generator EN 7/7, the dashboard's last step — `n562/tourflip-suite.mjs`). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S559 H — the FM at the cap**) | Hebrew_Font_Maker.html | **Auto-detect is offered on every tab's sheet view but knows only the Hebrew letters**: on the English tab the English template's 30 boxes are assigned צ ץ ק … and then the traced Hebrew letters, and Apply would replace their photos and outlines (one Ctrl+Z). Hide it off the Letters tab, or make it tab-aware (seed). | found …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S557 H — gate 2, the Trainer's deep-link contract**) | trope_tutor.html → torah_trainer.html | **A Learn card's "See it in the parsha →" replaces the Trainer's saved reading**: `?parsha=` saves the parsha with `scope:'parsha-full'` and drops a holiday, so a student on aliyah 3 of Ki Tavo or on Rosh Hashanah day 1 reopens the Trainer on Bereshit (both measured, 2 cells); a …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S605 — found running the smoke for `577b5c80`**) | scripts/smoke-assignments.mjs | **C ("the class view lists both students as Submitted") can read the grid before its badges**: it waits for two rows, not their statuses — once in three tree runs every badge read `null` (HEAD 1/1, tree 2/2 green otherwise); wait for a `.badge` per row. | found S605

- [ ] P4 (**NEW S599 H**) | torah_trainer.html | **After Create, the Assign dialog's fields stay live** (New code word changes only the box); the feedback label sits at its textarea's foot. | found S599

- [ ] P4 (**NEW S597 G — after `18d72e52`**) | trope_tutor.html | **15 of 232 printed charts still end on a sheet holding only the footer credits** (the Torah and High Holiday Phrases at Letter, 4 cells each; 4 traditions' Learn in HE A4; 3 more): what is left is the credits block itself (~100px on paper); a shorter credit set on paper is a copy call (findings S597). | found S597

- [ ] P4 (**NEW S595 N**) | Hebrew_Font_Maker.html | **A window opened mid-tour opens under the tour's card**: on a phone the card covers its Close (the card's ✕ still ends the tour). | found S595

- [ ] P4 (**NEW S595 N — gate 2/4**) | Hebrew_Font_Maker.html | **A phone turned sideways gets the tablet notice** (tiered by width alone); one over 820px gets none. | found S595

- [ ] P4 (**NEW S594 C**) | generator, dictionary | **A control inside a collapse header joins its name**: "Saved Presets More information", "1st Letter Clear" ×7. | found S594

- [ ] P4 (**NEW S590 — found verifying `d37fd204`**) | hebrew_blend_generator.html | **Real Words Gematria Self-Check's flipped card spills its back in Export PDF**: the translation runs past the card's edge and the Hebrew word sits above it (print not checked). | found S590

- [ ] P4 (**NEW S589 G**) | torah_trainer.html | **Side by side at the Hebrew size's maximum (3.5rem) with transliteration under each word, a verse row taller than a Letter sheet leaves its bottom rule alone on the next sheet** (4 of 50 sheets; A4 none). | found S589

- [ ] P4 (**NEW S588 M — glyph pattern; shared block**) | folder-tree block (5 carriers) | **The twisty ▾ and the strings "Move ▾", "⌂ Root" are read**: `aria-hidden` / markup in the block, re-paste, sha-verify. | found S588

- [ ] P4 (**NEW S588 M — 13 carriers**) | footer About column | **At ~800px the licence line wraps after a separator** ("CC BY-NC-SA 4.0 · GitHub ·" / "Contact & Support"). | found S588

- [ ] P4 (**NEW S585 H**) | hebrew_dictionary.html | **A Hebrew search matches its letters across word gaps**: `w.bare` holds no spaces, so "כלב" finds אַל תִּסְתַּכֵּל בַּקַּנְקַן (…כֵּל בַּ…); since `9b6b2a7d` such a hit sorts after the word and its phrases — whether to match within words only is a behaviour call. | found S585

- [ ] P4 (**NEW S584 M — verify on a real device**) | trope_atlas.html | **The sof pasuk mark (׃) in the sign table's role text has zero advance in headless Chromium on Linux** ("the two dots ׃ close" draws as "dots :close"): the cell's stack is `"Source Sans 3", sans-serif`, no Hebrew face; check a Mac / iPhone before wrapping ׃ and ׀ in a Hebrew-font span (the strings are i18n). | found S584

- [ ] P4 (**NEW S576 D**) | classroom_dashboard.html | **Bulk preset edit's Save over 40 changed presets is one 203 ms task @4×** (unprofiled). | found S576

- [ ] P4 (**NEW S575 G — pattern `print-block-split-at-a-sheet-foot`; whole cards cost a sheet here; S591: its dead buttons FIXED `61d3a8ab` — re-measure the sheets**) | index.html | **Printed, the hub cuts a tool card across sheets (EN Letter, HE A4)**; whole cards alone added a footer-only sheet (EN Letter). | found S575

- [ ] P4 (**NEW S575 G — pattern `print-trailing-padding-adds-a-sheet`**) | privacy.html | **In English on Letter the footer prints alone on a 6th sheet** ; main's padding off does not fit it (and splits Terms' footer). | found S575

- [ ] P4 (**NEW S574 M — H's**) | hebrew_blend_generator.html | **The crossword's "Not placed:" note can list 50+ pool words on the student's sheet.** | found S574

- [ ] P4 (**NEW S574 M — UX rule 8; S595: the sidebar half FIXED `a339e56`**) | hebrew_blend_generator.html | **Hebrew inside the English Real Words definitions sits under `lang="en"`** (findings S595). | found S574

- [ ] P4 (**NEW S574 M — component consistency**) | hebrew_blend_generator.html | **The Advanced panel's TTS speed box is not a sub-panel** like its five navy-bar neighbours. | found S574

- [ ] P4 (**NEW S572 N — pattern `horizontal-overflow-at-narrow-widths`**) | hebrew_blend_generator.html | **On an iPhone SE Real Words Bingo's caller list and Word Search's grid scroll sideways** (82 / 73 px). | found S572

- [ ] P4 (**NEW S572 N**) | hebrew_blend_generator.html | **A Real Words card's longest part-of-speech tags still run into its number** ("prepositional phrase" at 104–144px, a full desktop too). | found S572

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **A cold Trope-staff load still draws the reading twice**: `ensureStaffData()` starts only when the first render asks, so the words-only fallback draws first (31–50 ms @1×, 115–180 @4×) and the staff replaces it; starting the phrase file in `init` when the layout is the staff would draw once. | found S570

- [ ] P4 (**NEW S570 D**) | torah_trainer.html | **init's synchronous work before the Sefaria request grew ~120 ms @4× since S424**: `wireSettingsForm` 55–64 ms (4–5 then: two `lookupRender` for the closed Calendar tab, ~25 each), `staffInitWatchers`' `document.fonts.ready` read forces a style + layout (30), `buildHolidayPicker` 13–15 (findings S570). | found S570

- [ ] P4 (**NEW S569 G — gate 2, copy on paper**) | flash_cards.html | **Every card-sheet page is headed with the button's label** — "Print card sheet 1 / 3", "הדפיסו דף כרטיסים 1 / 3" (`flashcards.sheet.button` reused by `printCardSheet`): an instruction printed on the artifact; a noun ("Flash cards", "כרטיסיות") would read as a title. | found S569

- [ ] P4 (**NEW S568 M**) | torah_trainer.html | **At Hebrew size ≥ 2.5rem the trope clause line meets the Latin under each word, reading and staff alike** (−0.7 → −3.4 px at 2.5 → 3.5rem): the Latin's 0.4em margin is the Latin's em, the line's 0.68em offset the Hebrew's; `padding-block-end:0.18em` on `.tt-wh` keeps the default and holds at every size. | found S568

- [ ] P4 (**NEW S568 M — S578: page-wide, census first**) | torah, dashboard, FM, generator | **Buttons render in the UA font (Arial), not Source Sans 3**: dashboard 50, generator 7, torah 7, FM 3 buttons per cell (`#fsExitBtn`, torah's audio bar, the dashboard's `.btn-xs`…); one `button { font-family:inherit }` per page, then every changed width checked. | found S568

- [ ] P4 (**NEW S566 H — gate 2, copy**) | flash_cards.html | **The results actions mix the Hebrew register**: "שמור תוצאות" (singular) among "שמרו / חזרו / תרגלו / הדפיסו / שתפו" (plural); a preset row's Play / Load / Save are singular too. One register per screen. | found S566

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **Save Project (.hebrewfont) still serializes in one string**: `JSON.stringify` + `gzipBlob`, 1.6 s @1× with 8 phone photos, once per click; `autosaveParts` would serve it. | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **QA Check opens in one task**: 205–230 ms @1× on FreeSerif (346 glyphs), 795 ms @4× on a 27-letter sheet project (`qaBuild` + `qaRenderGrid`). | found S565

- [ ] P4 (**NEW S565 D**) | Hebrew_Font_Maker.html | **A cold load @4× has three tasks over 200 ms**: parse 391–441, `init` 687–757, the `I18n.ready` re-render 207–324 (S410: two, 306–365 + 492–560); 1× has none (top 150–160, was 96–102). | found S565

- [ ] P4 (**NEW S564 H**) | classroom_dashboard.html | **A `.ivrit` Merge onto a fresh device lists "My class (0)" twice**: the device's empty starter class and the file's are merged by id, so both stay; an empty default class could yield to a same-named incoming one. | found S564

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **"N pages to print" under-counts a Real Words sheet that runs on**: Identify (60) prints 4 pages under "2 pages to print" (8/8 cells), and the reading, ID Parts of Speech, Gematria, Fill Vowels and Reverse keys print 3 under "2" in some cells; `generator.md` names only the caller sheet as a known gap. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **A long Real Words answer key can print its footer alone on a page** (Letter: reading EN/HE, ID Parts of Speech EN, Reverse HE; A4: reading + QR EN, Gematria EN — 6 of 48 cells, the definitions' lengths decide): `break-before: avoid` on the key's footer, or fit the key. | found S563

- [ ] P4 (**NEW S563 G**) | hebrew_blend_generator.html | **Blend Bingo hides Page Size (and Header Labels, Landscape) where Real Words Bingo shows them**: on A4 paper a teacher sets the size only from another mode first (the pill's value still applies). | found S563

- [ ] P4 (**NEW S563 — glyph census; dictionary, generator FIXED**) | Hebrew_Font_Maker.html | **CSS-drawn ▾ in control names: count it with a project open.** | found S563

- [ ] P4 (**NEW S562 N — touch parity**) | trope_tutor.html | **A Phrases chip lights its notes on the staff only by hover or focus**: a tap opens the mark's Learn card at once, so a touch user never sees which notes a chip names (`mouseenter` / `focus` → `.is-hl`; measured: the highlight flashes, then the tab changes). | found S562

- [ ] P4 (**NEW S560 C — gate 3**) | Hebrew_Font_Maker.html | **The fullscreen Exit button's no-wrap label spills 13px past its 60px plate** (EN "Exit Full Screen" 86px wide): after `f00f4bc` it still grazes 3% of Help / Tour at 1024 and 800, and a strip wide enough for it wraps the Hebrew toolbar at 1280; a plate that fits its label (or a two-line label) changes the button's look. | found S560

- [ ] P4 (**NEW S559 H**) | Hebrew_Font_Maker.html | **After an Apply the sheet view (the navigator and Auto-detect) is gone**: the second page's Auto-detect is reached only by opening a letter with no crop, which nothing says; a two-file pick also lands on "2 of 2", and the hint keeps "Start by uploading…" until the first Apply. | found S559

- [ ] P4 (**NEW S559 H — student cell**) | Hebrew_Font_Maker.html | **Fullscreen Draw at 1024×768 starts the canvas at y≈490**, under the toolbar and the letter grid: a student sees the top third of the drawing area and scrolls to reach the baseline (strokes aimed below the fold drew nothing). Gate 3 if the grid folds. | found S559

- [ ] P4 (**NEW S559 H — verify first**) | Hebrew_Font_Maker.html | **Noto Sans's fidelity report opens on Start editing having measured 0 letter+mark combos (1,072 "unexpected shaping results") and ends "Every measured combo lands within 3 units"**: a vacuous all-clear, and the census's one stop (it covers Export). | found S559

- [ ] P4 (**NEW S558 M — gate 2, copy**) | trope_tutor.html | **The Phrases chips write the clause names in sentence case ("Sof pasuk clause", "Zakef katon clause") where the Learn chips, the drill grid and the printed chart's legend use title case ("Sof Pasuk clause")**: one casing for a mark's name across the page. | found S558

- [ ] P4 (**NEW S557 H — gate 2, copy**) | trope_tutor.html | **Under the High Holiday, Haftarah and megillah melodies the Learn examples and the Drill's Hear and Melody questions still sound PocketTorah's year-round reading**; only the Phrases examples are named (the HH note), the drill start says nothing. | found S557

- [ ] P4 (**NEW S556 M — gate 2, a title per mode**) | hebrew_dictionary.html | **The sidebar's first panel says "Word Length" in every mode**, yet in Emojis it holds the mode switcher, the gender toggle and the category tree, in Shoresh only the switcher. | found S556

- [ ] P4 (**NEW S551 H — gate 2, copy**) | name_tags.html | **The Avery note never names a product's twins** (8395, 5895, 15395, 25395, 45395 and 48395 share 5395's layout): a teacher holding an 8395 pack cannot tell that the "Avery 5395" tile fits it. | found S551

- [ ] P4 (**NEW S550 G — gate 2; the file-name half FIXED S593 `96f562e`**) | name_tags.html | **The CSV carries only a per-student extra line, never the list's**: a list moved by file loses "Grade 4" on every tag. | found S550

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

- [ ] P4 (**NEW S530 A — glyph census, rule first; S604: the hub's two control labels FIXED `7c33a1d8`**) | dictionary, resources, flash, torah, FM | **Category and option emoji are still heard** (findings S530): content or decoration is unruled. | found S530

- [ ] P4 (**NEW S523 G — gate 3**) | hebrew_dictionary.html | **A long one-word headword overflows its card** (paper and phone). | found S523

- [ ] P4 (**NEW S522 M — gate 4**) | parsha_emojis.html | **On a phone (≤600px) Print still takes a row of its own** (EN 390: four rows). | found S522

- [ ] P4 (**NEW S522 M — gate 3 since S524**) | parsha_emojis.html, torah_trainer.html | **This week's badge drops its card's name 23px below its row-mates'**: on the border it needs ~9.5px of a 12/10px row gap (findings S524). | found S522

- [ ] P4 (**NEW S522 M — gate 3**) | parsha_emojis.html | **Today's lone card stops at 840px under a 1052px heading rule.** | found S522

- [ ] P4 (**NEW S596 P — the "only if they have students" half of gate 2**) | account.html | **The account page lists and downloads none of a teacher's reading-assignment data** (classes, student logins, assignments, recordings): the listing and the .zip cover saves and Font Maker projects only; counting them needs `js/ivrit-assignments.js` on that page (CLAUDE.md accounts rule 2 names its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S573 P; S596: alone 1 of 3 green**) | scripts/smoke-sync.mjs, js/ivrit-saves.js | **D31 (the Trope merge after a button sign-out) fails more often**: the S596 full run red and alone 1 of 3 green (S592: alone 3/3), always "neither side merged" with `settled` true — the shape of the S567 P2 above (a page write after the hydration planned is not sent; the Trope Learn tab saves on its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S590 D — not small: `content-visibility` on off-screen sheets, a11y + print first**) | hebrew_blend_generator.html | **Dragging the sidebar seam over a 40-version Class Set reflows all 40 sheets per move**: one forced layout of ~134 ms @4× per pointer move (`positionSidebarTab` reads the sidebar's rect after the width write), 7 s for a 150px drag; 11 ms with one sheet (findings …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] S | hebrew_dictionary.html | **Save as Word List from a filtered view proposes no name** (the theme path prefills "Animals"): a name built from the active filters ("3-letter · ב · kamatz, patach") would save the typing. | found S585 H

- [ ] S | trope_atlas.html | **From a melody-table figure to its phrases**: a teacher at Haftarah's zakef katon scrolls to the phrase browser, picks Haftarah and then the zakef clause by hand; a link on the figure (or its column heading) opening that melody at the clause that holds the sign would make it one click. | found S583 H

- [ ] S | trope_atlas.html | **Print one melody's phrases as a handout**: printing is all or nothing (Stacked 79–84 pages; filtered to Torah + Haftarah still 48), so a one-melody sheet means a PDF and a page range; a "Print these phrases" on the phrase browser that prints its melody and group alone. | found S583 H

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

- [ ] P4 (**NEW S598 D — GATE 2/3 ASKED, the maintainer chose "log it only"**) | trope_tutor.html | **A tradition's Phrases tab draws all its rows at once ("All rows", by design), so on the two long ones (cons_torah 31, cons_haftarah 36 rows, 77 staves) a key step, a melody choice or a language switch is one task of 216–475 ms @4× (56–108 @1×)**; the seven melodies page ~4 rows a group (≤127 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S585 H — a corpus content call**) | data/hebrew_words.json, hebrew_dictionary.html | **The word corpus carries adult and explicit terms that an elementary search surfaces** (a child's search for "ילד" listed one 4th on HEAD, below the word and its phrases after `9b6b2a7d`); nothing in the page filters content. Dropping or hiding a list of entries (with the corpus `?v=` bump on …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] P4 (**NEW S364 Pass G — GATE 2: a default-output choice, deferred unattended; numbers + screens in loop-findings (`g364/out/board-print-en-dark.png`)**) | classroom_dashboard.html | **With background graphics ON, the board's day plates print in their screen colours under the print block's navy ink (`.day-item.colored { color: var(--text) }`): 1.12:1 on Friday's indigo, 1.58 purple, 2.58 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S337 Pass G — GATE 2: a default-behaviour choice, deferred unattended**) | Hebrew_Font_Maker.html | **The tool's two PDFs print on different paper: the Preview PDF specimen is hardcoded A4 (595×842 pt, `format:'a4'`) while the five template sheets are hardcoded Letter (612×792 pt, `format:'letter'`, and the generator's PDFs are Letter too).** A US teacher's specimen comes out …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S332 Pass L — GATE 2 / maintainer fact; deferred unattended**) | index.html | **The hub's Organization `sameAs` and the visible "Created by" link both point at `https://harrisonbleiberg.wpcomstaging.com/`, a WordPress.com staging address.** If a public author URL exists (or the site has moved), both should carry it; if the staging address IS the intended public home, waive this. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S546 P — a shared-module rule, the maintainer's call before a loop fix**) | js/ivrit-saves.js (flash_cards, torah_trainer, trope_tutor, classroom_dashboard, index) | **A brand-new device's first sign-in says "Your account's … settings replaced the ones this device had before you signed in" and offers a download of nothing but the page's defaults** on those five pages (each writes …[full text: IMPROVEMENT_ARCHIVE.md]

## In progress

_(none)_

## Done

- [x] 2026-11-04 | (S605 close-out) | branch/deploy note | **S605 = D on the dictionary (its first since S496; 53 commits): cold 10 cells, 40 interaction arms by real input × 3 cells, profiles, a layout trace and two interleaved A/Bs. FOUND 1, FIXED 1 (the language switch's double layout); 1 refuted (the Translation sort); + 3 from the queue (the Trainer in High Contrast, the class view's case, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-04 | `8f520b80` | hebrew_dictionary.html, sw.js | (S605, the S556 M P4) **The emoji category counts, Shoresh pattern sub-labels and TTS slider ends reach the page's hint size** (9.6 / 9.92 → 10.88 px). | 10 cells by real clicks: no overflow, no name newly truncated, the tree's height unchanged; tiles 1 px taller

- [x] 2026-11-04 | `577b5c80` | reading_assignments.html, sw.js | (S605, the S599 H P4) **The class view shows student names and assignment titles as the teacher typed them** (`th.cv-typed`; the column labels stay uppercase). | fake cloud, 4 cells: typed 4/4 (HEAD 0/4); smoke-assignments 135/135 ×2, test-rls 167/167

- [x] 2026-11-04 | `09bf98dd` | torah_trainer.html, sw.js | (S605, the S571 C P3) **The karaoke word and every chosen control stand out in High Contrast** (the page's first forced-colours block; pattern `selected-state-lost-in-forced-colors`). | census 11 groups flat on HEAD; real clicks × 4 cells: selection share 0–7 % → 14–77 %, swatch Δ 0 → 151; outside HC = HEAD 28/28

- [x] 2026-11-04 | `2f1ff394` | hebrew_dictionary.html, sw.js | (S605 D) **A language switch lays the page out once, not twice** (the hide-tab's rect read after the card rebuild; pattern `layout-read-per-grid-at-build`). | A/B ×6 @4×: layout 189 → 112 ms, long-task sum 609 → 509; the tab = HEAD 24/24, a plant 0/2

- [x] 2026-11-04 | (S604 close-out) | branch/deploy note | **S604 = G on the dashboard (its first since S495; 64 commits): the board on paper (8 cells × Letter/A4 × backgrounds off/on, three colouring modes), 14 states for fixed surfaces × 4 cells, the week sheet by its real Print button (64 PDFs), the `.ivrit` round trip and the manual Export box. FOUND 2, FIXED 2; + 2 from the queue (hub, …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-04 | `f3921689` | hebrew_dictionary.html, sw.js | (S604, the S601 N P4) **A search being typed keeps its focus and caret when the phone turns or the window crosses 680px** (a blur the layout makes before the media query's event is remembered). | EN/HE × light/dark, both ways + a phone load: 40/40 in 3 runs (HEAD 20/40); focus elsewhere never pulled in

- [x] 2026-11-04 | `7c33a1d8` | index.html, locales, sw.js | (S604, the S530 / S603 line) **The hub's Hebrew Fonts and Contact & Support links carry an icon, not an emoji in the string** (`hi-type`, a new `hi-mail`; pattern `decorative-glyph-carrier-exposed-to-assistive-tech`). | 12 cells: AX names, icons on the line, a live switch, click + Enter: 92/92 (HEAD 40/92)

- [x] 2026-11-04 | `2dc62d0f` | classroom_dashboard.html, sw.js | (S604 G) **The panel titles' fold triangles stay off paper, and the titles print centred** (4.2 → 0.0 px). | 16 cells: 72/72 (HEAD 40/72); PDF ▾ 0; pages = HEAD 16/16

- [x] 2026-11-04 | `e1531d5c` | classroom_dashboard.html, CLAUDE.md, dashboard.md, sw.js | (S604 G) **Colour-coded nikkud prints in the light palette from dark mode, and Highlight prints as an underline** (pattern `dark-palette-baked-into-paper`). | 22 cells × modes + Talam + overrides: 90/90 (HEAD 70/90); screen = HEAD in 20/20 cells (1,109 syllables)

- [x] 2026-11-03 | (S603 close-out) | branch/deploy note | **S603 = M on the chrome bundle (the hub's first M since S246, the account page's since S408): 84 full-page cells + the hub's states, the signed-in account page, Resources' Fonts view and suggest form; 6 arms behind plants. FOUND 3, FIXED 3; 1 amended, 4 settled. PR #393, sw v1233; deploy on merge.** No gate asked (a gate-3 idea …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-03 | `09e2ca28` | index.html, sw.js | (S603 M) **A tool card's button label that wraps is centred in its button** (it hugged the start edge, up to 171px off-centre). | EN/HE × 1280/1024/800/390 + dark: 156/156 (HEAD 127/156, 29 labels); 132 button boxes identical to HEAD

- [x] 2026-11-03 | `918d4924` | contact.html, privacy.html, terms.html, account.html, sw.js | (S603 M) **The header title is bold again on the four pages whose h1 became a div** (an h1 is bold by default); the phone rule drops the 0.01em tracking so the Contact title keeps one line at 360px. | 7 pages × 18 cells: 504/504 (HEAD 432/504); header geometry = HEAD in 72/72 cells; smoke-account-page …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-11-03 | `21874438` | index.html, sw.js | (S603 M) **In dark mode the hub's 11 tool-card buttons and the Import / Export primaries take the suite's dark navy fill** (1.03:1 on their card before; pattern `dark-navy-fill-matches-its-ground`). | EN/HE × light/dark × 1280/800, real hovers: 104/104 (HEAD 76/104); print navy; light unchanged

- [x] 2026-11-03 | (S602 close-out) | branch/deploy note | **S602 = P on the Torah Trainer (first since S493): four smokes + 3 new signed-in scenarios, arms 3–7 static, the live project read-only. FOUND 1, FIXED 1 (a new pattern); + the generator's blend sheets on a phone (gate 4). PR #393, sw v1230; deploy on merge.** One gate 4 asked and answered; no live action.

- [x] 2026-11-03 | `afea099b` | torah_trainer.html, scripts/smoke-sync.mjs, torah-and-trope.md, sw.js | (S602 P) **A practice link's look stays on screen when the load's own sync downloads another device's settings** (pattern `link-undone-by-its-loads-first-sync`). | smoke-sync D43 6/6 (HEAD 3/6); sync 235/236 (D31 flake), migration 47, assignments 135, tools 18; signed out 24/24

- [x] 2026-11-03 | (S601 close-out) | branch/deploy note | **S601 = N on the dictionary (first since S492): FOUND 4, FIXED 2 (one gate 4) + 2 from the S599 queue. PR #393, sw v1228; deploy on merge.** One gate 4 answered; no live action.

- [x] 2026-11-03 | `1c14d49a` | hebrew_dictionary.html, sw.js | (S601 N, gate 4) **On a phone, Return in the search and Shoresh boxes lowers the keyboard** (`enterkeyhint="search"`; desktop keeps the focus). | fix2.mjs 4 touch + 2 desktop cells 6/6 (HEAD 0/6)

- [x] 2026-11-03 | `617243e1` | 5 keyboard carriers, shared-components.md, sw.js | (S601 N) **The on-screen Hebrew keyboard no longer raises the phone's own keyboard on each key** (no `focus()` under `pointer:coarse`; re-sha'd). | fix1.mjs 5 carriers × touch/mouse, caret mid-text 10/10 (HEAD 5/10)

## Metrics

### Per-session log (one line per session)

- 2026-11-04 | **S605** | iters: 5 | tools: dictionary ×2, torah, reading_assignments, sw | patterns fixed: layout-read-per-grid-at-build ×1, selected-state-lost-in-forced-colors ×1 | pass run: D (dictionary, first since S496) | SW: v1237→v1241

- 2026-11-04 | **S604** | iters: 5 | tools: dashboard ×2, index, dictionary, locales, sw | patterns fixed: dark-palette-baked-into-paper ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: G (dashboard, first since S495) | SW: v1233→v1237

- 2026-11-03 | **S603** | iters: 4 | tools: index, contact, privacy, terms, account, sw | patterns fixed: dark-navy-fill-matches-its-ground ×1 | pass run: M (chrome, first since S494) | SW: v1230→v1233

- 2026-11-03 | **S602** | iters: 3 | tools: torah, generator, sw | patterns fixed: link-undone-by-its-loads-first-sync ×1, horizontal-overflow-at-narrow-widths ×1 | pass run: P (torah, first since S493) | SW: v1228→v1230

- 2026-11-03 | **S601** | iters: 5 | tools: dictionary ×2, resources, fontmaker, dashboard, name_tags, torah, reading_assignments, sw | patterns fixed: author-display-defeats-the-hidden-attribute ×1 | pass run: N (dictionary, first since S492) | SW: v1224→v1228

- 2026-11-03 | **S600** | iters: 5 | tools: torah ×2, index, resources, locales, sw | patterns fixed: focus-hidden-under-a-sticky-bar ×1 | pass run: C (chrome, first since S483) | SW: v1220→v1224

- 2026-11-03 | **S599** | iters: 4 | tools: reading_assignments ×2, torah ×2, trope, locales, sw | patterns fixed: — | pass run: H (torah + the reading assignments, first since S482) | SW: v1217→v1220

- 2026-11-03 | **S598** | iters: 5 | tools: trope ×2, fontmaker, generator, sw | patterns fixed: dark-navy-fill-matches-its-ground ×1 | pass run: D (trope, first since S480) | SW: v1213→v1217

- 2026-11-03 | **S597** | iters: 4 | tools: trope ×2, generator, scripts/loop, sw | patterns fixed: author-display-defeats-the-hidden-attribute ×1, print-trailing-padding-adds-a-sheet ×1 | pass run: G (trope, first since S479) | SW: v1210→v1213

- 2026-11-01 | **S596** | iters: 5 | tools: account, index, flash ×2, locales, sw | patterns fixed: — | pass run: P (chrome, first since S477) | SW: v1203→v1207

- 2026-11-01 | **S595** | iters: 5 | tools: fontmaker ×2, generator ×2, locales, sw | patterns fixed: text-field-under-16px-zooms-on-ios-focus ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: N (fontmaker) | SW: v1199→v1203

- 2026-11-01 | **S594** | iters: 5 | tools: generator ×2, dictionary ×2, locales, sw | patterns fixed: hover-tip-not-dismissible-or-hoverable ×1, help-affordance-inside-a-label-forwards-its-tap ×1, sub-floor touch target ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: C …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-01 | **S593** | iters: 5 | tools: fontmaker ×2, name_tags, dashboard, scripts/loop, sw | patterns fixed: RTL-inheritance-on-a-Latin-script-container ×1, decorative-glyph-carrier-exposed-to-assistive-tech ×1 | pass run: G (fontmaker, first since S465) | SW: v1191→v1195

- 2026-11-01 | **S592** | iters: 5 | tools: generator ×2, dashboard, torah, dictionary, flash, delete-account (function, deployed v7), smoke-sync, scripts/loop, locales, sw | patterns fixed: account-wide-delete-confirm-without-signed-in-wording ×5 carriers (gate 2) | pass run: P (generator, first …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-11-01 | **S591** | iters: 5 | tools: trope ×2, dictionary, index, scripts/loop, sw | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1, fixed-surface-missing-from-the-print-hide-list ×1 | pass run: C (trope, first since S455) | SW: v1183→v1187

- 2026-11-01 | **S590** | iters: 5 | tools: generator ×2, resources, dashboard, scripts/loop, sw | patterns fixed: cdn-library-parser-blocking-for-one-action ×1, fixed-surface-missing-from-the-print-hide-list ×1, contrast-below-AA-on-a-tinted-or-coloured-plate ×1, layout-read-per-grid-at-build ×1 | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-10-31 | **S589** | iters: 5 | tools: torah ×2, flash ×2, dashboard, locales, scripts/loop, sw | patterns fixed: — | pass run: G (torah, first since S451) | SW: v1175→v1179

- 2026-10-31 | **S588** | iters: 5 | tools: flash ×2, dashboard, fontmaker, locales, scripts/loop, sw | patterns fixed: flex-box-drops-a-sentence-space ×1 (NEW), decorative-glyph-carrier-exposed-to-assistive-tech ×2 | pass run: M (flash, first since S450) | SW: v1171→v1175

- 2026-10-31 | **S587** | iters: 5 | tools: torah ×2, name_tags, letter_learner, sw | patterns fixed: decorative-glyph-carrier-exposed-to-assistive-tech ×2 | pass run: N (torah, first since S448) | SW: v1164→v1168

- 2026-10-31 | **S586** | iters: 5 | tools: torah ×2, dictionary, generator, sw | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1 | pass run: C (torah, first since S441) | SW: v1160→v1164

### Tool coverage (last-touched date per tool)

- **Snapshot S605 (2026-11-04):** dictionary, torah, reading_assignments, sw.js, loop docs S605 · dashboard, index, dictionary, locales, sw.js, CLAUDE.md, loop docs S604 · index, contact, privacy, terms, account, sw.js, loop docs S603 · torah, generator, sw.js, scripts/smoke-sync, loop docs S602 · dictionary, resources, fontmaker, dashboard, name_tags, torah, reading_assignments, sw.js, loop docs S601 · torah, index, resources, locales, sw.js, loop docs S600 · reading_assignments, torah, trope, locales, llms, sw.js, loop docs S599 · trope, …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (one status line per pattern — shape, owner, detection and record: docs/reference/loop-patterns.md)

- `print-block-split-at-a-sheet-foot` | ACTIVE | owner G | det: scripts/loop/probes/S575-chrome-print-whole-blocks.mjs | last S575 | streak 0

- `focus-hidden-under-a-sticky-bar` | ACTIVE | owner C | det: recipe | last S600 | streak 0

- `hover-tip-not-dismissible-or-hoverable` | ACTIVE | owner C | det: recipe | last S594 | streak 0

- `tour-step-in-a-hidden-view` | ACTIVE | owner A | det: recipe | last S558 | streak 0

- `dark-hover-resolves-to-the-rest-colour` | ACTIVE | owner A | det: recipe | last S558 | streak 1

- `latin-sentence-boundary-in-hebrew-prose` | ACTIVE | owner M | det: scripts/loop/detect-latin-sentence-boundary-in-hebrew-prose.mjs | last S554 | streak 0

- `offscreen-sheets-laid-out-on-every-rebuild` | ACTIVE | owner D | det: recipe | last S576 | streak 0

- `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

- `defaults-filed-as-the-device's-own-at-first-sign-in` | ACTIVE | owner P | det: recipe | last S546 | streak 0 | hits 6

- `selected-state-lost-in-forced-colors` | ACTIVE | owner C | det: recipe | last S605 | streak 0

- `live-region-shown-with-its-text` | ACTIVE | owner G | det: recipe | last S553 | streak 0

- `abs-child-escapes-its-scroller` | ACTIVE | owner N | det: recipe | last S595 | streak 3

- `empty-result-not-announced` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `print-trailing-padding-adds-a-sheet` | ACTIVE | owner H | det: recipe | last S597 | streak 0

- `unseen-hit-box-over-controls` | ACTIVE | owner C | det: recipe | last S530 | streak 1

- `layout-read-per-grid-at-build` | ACTIVE | owner D | det: recipe | last S605 | streak 0

- `dark-palette-baked-into-paper` | ACTIVE | owner G | det: recipe | last S604 | streak 0

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

- `hebrew-faux-italic` | ACTIVE | owner M | det: recipe | last S603 | streak 2

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

- `latin-tracking-on-hebrew-labels` | ACTIVE | owner H | det: recipe | last S570 | streak 0

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

- `dark-navy-fill-matches-its-ground` | ACTIVE | owner M | det: recipe | last S603 | streak 0

- `ring-below-3-on-light` | ACTIVE | owner F | det: recipe | last S443 | streak 0

- `tip-escape-drops-focus` | ACTIVE | owner C | det: recipe | last S441 | streak 0

- `account-wide-delete-confirm-without-signed-in-wording` | ACTIVE | owner P | det: recipe | last S596 | streak 1

- `logical-inset-mirrors-onto-pinned-content` | ACTIVE | owner H | det: recipe | last S440 | streak 0

- `tip-name-joins-its-field's-name` | ACTIVE | owner A | det: recipe | last S488 | streak 0

- `panel-title-keyed-on-an-inner-span` | ACTIVE | owner B | det: recipe | last S439 | streak 0

- `copy-claims-success-on-a-refused-clipboard` | ACTIVE | owner F | det: recipe | last S445 | streak 0

- `button-focus-lost-to-its-own-rebuild` | ACTIVE | owner F | det: recipe | last S571 | streak 0

- `dark-literal-escapes-the-print-tokens` | ACTIVE | owner G | det: recipe | last S604 | streak 2

- `editor-re-parse-caps-a-merged-list` | ACTIVE | owner P | det: recipe | last S421 | streak 0

- `window-taller-than-a-phone-without-a-scroll` | ACTIVE | owner N | det: recipe | last S595 | streak 4

- `install-banner-over-a-sheet's-bottom-controls` | ACTIVE | owner N | det: scripts/loop/probes/S572-install-hint-tours.mjs | last S578 | streak 0

- `flash-restores-captured-text-not-its-key` | ACTIVE | owner E | det: recipe | last S417 | streak 0

- `visible-label-missing-from-the-accessible-name` | ACTIVE | owner B | det: recipe | last S531 | streak 0

- `designed-key-miss-probed-through-t` | ACTIVE | owner B | det: recipe | last S533 | streak 2

- `pinned-english-without-lang` | ACTIVE | owner B | det: recipe | last S533 | streak 0

- `toggle-name-flips-with-its-pressed-state` | ACTIVE | owner F | det: recipe | last S431 | streak 0

- `author-display-defeats-the-hidden-attribute` | ACTIVE | owner F | det: recipe | last S601 | streak 0 | hits 1

- `button-group-label-not-programmatic` | ACTIVE | owner C | det: recipe | last S413 | streak 0

- `settings-lost-across-a-load` | ACTIVE | owner H | det: recipe | last S551 | streak 1

- `live-region-display-none-while-empty` | ACTIVE | owner M | det: recipe | last S584 | streak 1

- `dark-base-rule-outranks-variant` | ACTIVE | owner M | det: recipe | last S603 | streak 4

- `aria-disabled-lock-no-handler-checks` | ACTIVE | owner P | det: recipe | last S407 | streak 0

- `text-field-under-16px-zooms-on-ios-focus` | ACTIVE | owner N | det: recipe | last S595 | streak 0

- `textContent-rewrite-erases-a-control-icon` | ACTIVE | owner K | det: recipe | last S501 | streak 0

- `english-literal-passed-to-a-message-helper` | ACTIVE | owner K | det: recipe | last S533 | streak 1

- `translated-key-exists-page-hardcodes-english` | ACTIVE | owner K | det: recipe | last S533 | streak 1

- `per-page-code-inside-a-shared-block` | DRAFT | owner E | det: none | last S416 | streak 0

- `icon-markup-into-a-textContent-writer` | DRAFT | owner E | det: none | last S403 | streak 0

- `cached-rejected-loader-promise-blocks-every-retry` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `cdn-dependency-absent-and-unguarded` | ACTIVE | owner B | det: recipe | last S399 | streak 0

- `selector-declared-twice-in-one-stylesheet` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `untrusted-card-field-interpolated-unescaped` | ACTIVE | owner D | det: recipe | last S393 | streak 0

- `auth-param-read-before-its-cleanup-runs` | ACTIVE | owner P | det: recipe | last S596 | streak 1

- `hover-feedback-survives-the-disabled-state` | ACTIVE | owner F | det: recipe | last S394 | streak 0

- `physical-property-that-never-mirrors` | ACTIVE | owner K | det: recipe | last S534 | streak 0

- `tile-grid-built-hidden-never-roved` | DRAFT | owner P | det: none | last S382 | streak 0

- `stored-json-of-the-wrong-shape-trusted` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `validation-note-stores-rendered-text` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `popup-without-a-keyboard-contract` | ACTIVE | owner A | det: recipe | last S371 | streak 2 | hits 0

- `stale-validation-note-after-its-input-changes` | DRAFT | owner A | det: none | last S371 | streak 0 | hits 0

- `apply-settings-trusts-collection-members` | ACTIVE | owner L | det: recipe | last S387 | streak 0

- `save-over-an-existing-name-without-confirm` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `fixed-surface-missing-from-the-print-hide-list` | ACTIVE | owner G | det: recipe | last S604 | streak 1

- `control-class-without-a-hover-state` | ACTIVE | owner L | det: recipe | last S373 | streak 0

- `false-clean-from-a-literal-only-pattern-match` | ACTIVE | owner O | det: recipe | last S309 | streak 0

- `false-clean-from-an-unverified-probe-handle` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `light-literal-text-on-the-gold-token` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `sub-floor touch target` | ACTIVE | owner E | det: recipe | last S594 | streak 0

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

- `stale-html-fallback-behind-its-csv-value` | ACTIVE | owner K | det: recipe | last S533 | streak 0

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

- `mobile-input-hints` | DRAFT | owner I | det: none | last S534 | streak 0

- `i18n cross-column parity (placeholders, plurals, inline markup)` | ACTIVE | owner K | det: recipe | last S533 | streak 2 | hits 0

- `horizontal-overflow-at-narrow-widths` | ACTIVE | owner N | det: recipe | last S602 | streak 0 | hits 6

- `fixed-columns-crush-a-narrow-sheet` | ACTIVE | owner N | det: scripts/loop/probes/S572-generator-realwords-narrow-cards.mjs | last S572 | streak 0 | hits 1

- `hover-only-affordance-under-a-synthetic-mouse-event` | ACTIVE | owner N | det: recipe | last S595 | streak 4 | hits 1

- `contrast-inverted-by-a-hover-or-active-state` | ACTIVE | owner C | det: recipe | last S368 | streak 0

- `dark-override-outranks-hover` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `contrast-below-AA-on-a-tinted-or-coloured-plate` | ACTIVE | owner M | det: recipe | last S603 | streak 1

- `async-store-backed-choice-clobbered-by-a-sync-fallback` | ACTIVE | owner A | det: recipe | last S226 | streak 1

- `rebuild-where-a-class-swap-would-do` | ACTIVE | owner A | det: recipe | last S220 | streak 0 | hits 1

- `decorative-glyph-carrier-exposed-to-assistive-tech` | ACTIVE | owner A | det: recipe | last S604 | streak 0

- `error-status-clobbered-by-a-later-routine-write` | DRAFT | owner A | det: none | last S411 | streak 0

- `content-dependent-tour-step-miscounts-the-tour` | DRAFT | owner A | det: none | last S197 | streak 0

- `per-sample-repaint-of-an-O(n)-live-preview` | DRAFT | owner A | det: none | last S196 | streak 0

- `false-positive-validator-on-the-app's-own-content` | ACTIVE | owner A | det: recipe | last S194 | streak 0

- `JSON-LD ↔ visible-content parity` | ACTIVE | owner L | det: recipe | last S432 | streak 0

- `wired-then-clobbered label` | ACTIVE | owner A | det: recipe | last S371 | streak 0

- `theme-flipping-token-on-a-fixed-colour-plate` | ACTIVE | owner A | det: recipe | last S191 | streak 0

- `two-state-ready-flag-for-a-three-state-load` | DRAFT | owner F | det: none | last S542 | streak 0

- `invalid-SVG-geometry-from-an-unclamped-difference` | DRAFT | owner A | det: none | last S187 | streak 0

- `RTL-inheritance-on-a-Latin-script-container` | ACTIVE | owner A | det: recipe | last S593 | streak 0 | hits 2

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

- P accounts & cloud (one surface): 2026-11-03 (**S602 — 20th P, `torah_trainer.html` (first since S493; 75 commits, the reading assignments among them): smoke-tools / sync / migration / assignments with the pinned SDK, 3 new signed-in scenarios (the practice link, `?reader=`), arms 3–7 static behind 7 plants, the live project read-only. FOUND 1: FIXED (D43, a new pattern); + the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): SKIP since S403 — the sandbox refuses to execute the third-party detector ("Code from External"); runs again once the maintainer commits a `.claude/settings.json` permission rule for it (`docs/reference/deslop-detector.md`). Last run 2026-09-08 (S346, `flash_cards.html`, 6th O; the S399/S403 refusals are in the archive).

- N mobile & touch-device (one surface): 2026-11-03 (**S601 — 36th N, `hebrew_dictionary.html` (first since S492; 53 commits): 12 phone cells × 12 views by real taps, touch parity, fields, flips, 4× CPU. FOUND 4: 2 FIXED (one gate 4), 1 P4, 1 carrier; + 2 from the queue. N-next: dashboard (S506), chrome (S520).**)

- M aesthetics & visual design (one surface): 2026-11-03 (**S603 — 36th M, chrome (index, resources, contact, privacy + terms, 404, account signed out and in; the bundle's first M since S494, the hub's since S246): 84 full-page cells, the hub's modal / menu / What's-new / hover states, 6 arms behind plants. FOUND 3, FIXED 3; 1 amended, 4 settled. M-next: dashboard (S508), parsha_emojis (S522).**)

- K i18n / localization audit: 2026-10-21 (**S533 — 36th K, `db80feb4..843984b3` (111 commits; parsha_emojis' first): CSV +209 (all resolve), 12 reworded, 0 removed; static 5,502 refs + 2,974 fallback sites (the html arm, lapsed since S475); blind 0/4,328 lines; 102 states by the real switcher (twins = base + 5 known); retry 4/4; 10 surfaces by real input + a switch mid-state. FOUND 4, FIXED 4.**)

- C accessibility (one tool): 2026-11-03 (**S600 — chrome (index, resources, contact, privacy + terms, 404, account signed out and in; first since S483): census 128 cells, Tab walks 44 + 3 dialogs, motion, forced colours, 1.4.12, headings. FOUND 2, FIXED 2. C-next: dashboard (S499), fontmaker (S513).**)

- A recurring-pattern sweep: 2026-10-31 (**S581 — 42nd A, scoped to the outside-loop reading-assignments landing (`a7fa5f1..aab737c`, 18 of its 53 commits; `reading_assignments.html`, `js/ivrit-assignments.js`, the Trainer's +838): the security arms (no `innerHTML`, reviver-safe parses, URL sinks, an anonymous Trainer loads no assignments module), then two catalog recipes committed as detectors …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-11-04 (**S604 — `classroom_dashboard.html` (first since S495; 64 commits: Bulk preset edit's switches, Make Groups, the parsha popup, the Name Tags class copy among them): the board on paper (8 cells × Letter/A4 × backgrounds off/on; Letter, Highlight and Underline colouring), 14 states for fixed surfaces × 4 cells, the week sheet by its real Print …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-11-04 (**S605 — `hebrew_dictionary.html` (first since S496; 53 commits: the Hebrew search ranking, the phone bar's focus keeping, the drawn fold triangles among them): cold 10 cells (@1× 0 tasks >200, ready 399–449 ms; @4× one task of 293–364), 40 arms by real input × 3 cells, profiles, a layout trace, two interleaved A/Bs. FOUND 1: FIXED (the language switch's …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-10-22 (**S539 — 40th I, S525 → S538 (93 commits; name_tags' first I, parsha_emojis' under its name): 63 virgin cells (plants 334/336); 69 seeds; 27 tours; ~250 openers; 280 bad URLs; failure paths 20. FOUND 2, FIXED 1.**)

- B console/error audit: 2026-10-22 (**S543 — 41st B, 78 commits (name_tags' first): 84 cells; name_tags, 9 tours, PE, LL, 8 retries by real input; iPhone ×42. FOUND 2, FIXED 1.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- V offline & service-worker runtime (suite): 2026-10-23 (**S553 — 1st V: the installed worker live (no block), the origin stopped by `closeAllConnections`: 17 precached pages + `/` + `?lang=he` + the unlisted page + an unknown path × light 1280 / dark 800 = 40 cells served by the worker, 0 errors, the UI strings and the self-hosted faces from the cache; the data cache seeded by 2 pages and read …[full text: IMPROVEMENT_ARCHIVE.md]

- L SEO & discoverability audit: 2026-10-21 (**S532 — 29th L, `18a7e6a3..ca9b9618` (110 commits; LL's launch, parsha_emojis' first L): 20 arms + 3 on 20 pages (plants 29/29); SEO surface unchanged 16/18; LL + parsha JSON-LD claims by real clicks; FAQ twins 10/10. FOUND 1 (gate 2), FIXED 4; S432 struck.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-11-03 (**S599 — `torah_trainer.html` (first since S482) + the reading assignments' first H, on the smoke's fake cloud: a first assignment (19 clicks), the student by link (9; fullscreen mid-take), the review; EN light 1280, HE dark 800. FOUND 10: 3 FIXED (2 by gate), 7 logged. H-next: chrome (S498), generator (S512).**)

- E freshness/site-health: 2026-10-21 (**S531 — 41st E, `d7c58446..48286048` (108 commits; parsha_emojis' first): 16 arms + carrier lists (plants 18/18), docs, CSP 40 cells (plant 40/40), the stub. FOUND 2, FIXED 4.**)

- F cross-tool consistency: 2026-10-22 (**S542 — 40th F, loading states (first since S189): 14 surfaces held, then aborted. FOUND 7, FIXED 4. F-next: long-build progress.**)

**Next session (S606):** **Branch `claude/improveloop-s597` (S597–S605, PR #393): open → continue on it; merged → fresh branch off `origin/main`.** `sw.js` **v1241**, FM **5.59**, corpus ?v=7. ⚑ drift: main=baaaaae sw=v1241 fm=5.59 migration=0012_helpers_out_of_api.sql live=yes functions=eb3e7ad sdk=2.116.0 config=58edf33 keepalive=aed4e7b ⚑ Stalest now: H chrome (S498), C dashboard (S499), N dashboard (S506), P trope (S507), M dashboard (S508), G letter_learner (S509), D letter_learner (S510); suite E (S531), L (S532), K (S533). ⚑ Harnesses: dictionary D `d605/` (`lib.mjs`, `cold`, `inter` + `inter2`, `profclick`, `tracelang`, `ablang`), Trainer forced colours `t605/` (`fc.mjs` census, `fix2` / `fix2sw` on `h599/`'s Sefaria stand-in — `SDK=` even signed out), dashboard G `g604/`. ⚑ Closeout ~2.5 min. ⚑ 57 seeds.
⚑ Sync P2 (S573): D31 still fails alone about 1 in 3 (S602: HEAD 2/3, tree 3/3). ⚑ The S602 gate-4 answer also covers the landscape blend-sheet P3 — S604: `body.landscape-mode .blends-grid` (0,2,1) outranks the floor rule, and Export PDF's clone is laid out with screen media, so measure the landscape PDF before any change — and the SE Bingo / Word Search P4s. ⚑ The footer's dangling "·" (the S588 line, 13 carriers) needs a session whose caps leave the dashboard free. ⚑ Two gate-3 P4s are small but gated: the Letter Learner's final-form cards 10px high, the dictionary's long headword. ⚑ Ports at the next A: `m554/`–`m603/`, `g604/`, `d605/`, `t605/`; traps 352, 356–515. ⚑ The dashboard's bulk-edit Save (S576 P4, 203 ms @4×) is the 9k-node modal's close, not script: leave it unless the modal changes. ⚑ Queues (first file of each candidate): FM 26, generator 19, torah 11, dictionary 9, name_tags 7, parsha_emojis 7, trope 6, dashboard 6; the rest ≤ 4.
