# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492). | found S492

- [ ] P3 (**NEW S480 D — verify first**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4×. Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S546 — C's**) | trope_tutor.html | **The drill's armed / right / wrong answer states are colour-only** (`.tu-choice.armed` / `.good` / `.bad` tints; in High Contrast all three paint alike). | found S546

- [ ] P4 (**NEW S544 audit — gate 2, content**) | data/hebrew_words.json | **One entry stacks tsere and patah (`טִיֵַּח`)** — the one real defect in 14,919 corpus strings (loop-findings S544, with the ~36 legitimate look-alikes); a corpus edit bumps `?v=` on every fetcher. | found S544

- [ ] P4 (**NEW S542 F — gate 2**) | FM, js/ivrit-saves.js, torah, parsha_emojis | **Retry copy diverges from "Try again / נסו שוב"** (FM, cloud status, the staff's HE; Parsha Emojis' "reload the page"). | found S542

- [ ] P4 (**NEW S541 C — pattern; S543 ×2, S545 ×2, S546 ×2**) | Hebrew_Font_Maker.html | **A pressed or selected state vanishes in High Contrast** (FM's letter tiles, modes and two tab sets; findings S541, S545, S546). | found S541

- [ ] P4 (**NEW S541 C — gate 3**) | 14 pages | **Field edges are `--border`: 1.83:1 light, 1.22:1 dark** (1.4.11: 3:1). | found S541

- [ ] P4 (**NEW S540 H — gate 4**) | parsha_emojis.html, letter_learner.html | **At ≤800px the bulk-print popup's preview sits under every option** (PE 1.6k px down at 800, 2.7k on a phone; LL 1.0k / 1.8k). | found S540

- [ ] P4 (**NEW S539 I — gate 2**) | letter_learner.html | **The cursive tour's card step names neither the Vowels nor the Fonts tab** every cursive card shows. | found S539

- [ ] P4 (**NEW S538 D; S539 re-measured**) | parsha_emojis.html | **A size drag relays out all 54 preview sheets per value** (≤57 ms @1×, ≤232 @4×); the refit after it ≤674 @4×. | found S538

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

- [ ] P4 (**NEW S479 G**) | trope_tutor.html | **Paper waste: Phrases 9–12 sheets at ~4 cards; 2 Letter charts end on the credits alone, EN Learn on one card.** | found S479

- [ ] P4 (**NEW S479 G — gate 2**) | trope_tutor.html | **Only the Haftarah note says the Phrases tab has no examples** (Esther, Megillot, Eicha lack them too). | found S479

- [ ] P4 (**NEW S478 M**) | 6 chrome headers | **A phone header leaves the star alone on a row** (EN contact ≤396, account ≤474). S489: a title beside the star stacks 3 lines at 320 (taller) — gate 3. S520: privacy/terms' dark toggle alone on a 3rd row at 320. | found S478

- [ ] P4 (**NEW S478 M**) | 6 chrome footers | **A "·" ends a footer line below ~700px.** S489: no CSS-only fix; a bound dot starts the line instead — gate 3. | found S478

- [ ] P4 (S476 N) | Hebrew_Font_Maker.html | **Guides reorder by drag only** (`attachGuideSortable`). | found S476

- [ ] P4 (S476 N — gate 4) | hebrew_blend_generator.html | **On desktop the Generate bar covers 1–3 footer FAQ rows at the page end** (phones fixed `dbf2d7a0`). | found S476

- [ ] P4 (**NEW S466 D**) | js/ivrit-saves.js | **A fresh device's first signed-in load rewrites the whole sync memory once per row** (tasks 50→340 ms, settled in 47 s @4×, 410 rows) and fetches each row by its own GET (457). | found S466

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

- [ ] P4 (**NEW S246 Pass M** — the FOURTH page with this exact shape, so it is now a suite-wide convergence question rather than a per-page note) | index.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245) | **Four text sizes inside a 2.08px band: 12 / 12.8 / 13.12 / 14.08px.** `button.ie-btn`+`footer` at 12, `#darkBtn`+`.card-attr` at 12.8, `p`+`.bookmark-btn` at 13.12, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S230 Pass K**, arm 1 — the corpus's one genuine placeholder gap, recorded rather than fixed because the reason it exists is linguistic, not an oversight) | `locales/ui-strings.csv` | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S218 Pass K** — needs 4 newly authored Hebrew terms, so it is gate-2 work, not wiring) | hebrew_dictionary.html (`locales/ui-strings.csv`) | **Four part-of-speech values have no filter row and so still print English in the Hebrew UI.** `ce75604` wired 19 of the corpus's 23 values by reusing the filter panel's existing keys; the remaining four — **proverb (19 entries), definite …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — it is a mapping decision, not wiring) | hebrew_dictionary.html | **The part-of-speech badge prints raw corpus vocabulary** (`noun`, `verb`, `adjective`, … from `w.pos`, ~L2768) and stays English in the Hebrew UI. Unlike the rest of the S192 haul this is **not** authored-but-unreferenced: the string match to `dictionary.shoresh.pattern_noun` is coincidental (that key …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — same mapping-decision class as the pos badge above) | flash_cards.html | **The Colors-mode selection tiles label their swatches in raw English** (`.color-tile-label` renders `c.name` — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **Holam+rafe and shin-dot+rafe collision anchors** — `AddHebrewContextualGPOS.py`'s collision-avoidance anchors for above-mark pairs; today both attach at the shared above anchor and can overlap. Same contextual single-pos device the meteg pair uses, above class. | found: 2026-08-29, S283

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **The Yerushalam lamed-patah-hiriq rule and `jalt` wide-letter justification alternates** — `AddHebrewContextualGPOS.py` / `WideLetters.fea`. The jalt half overlaps the shipped ss02 wide forms (v5.33): the glyphs exist, only the `jalt` feature registration is missing. | found: 2026-08-29, S283

## Feature seeds (micro-features only; see the Micro-feature track in the session prompt)

- [ ] S | parsha_emojis.html | **Each card prints its own coloring sheet** (the popup with that parasha alone, as a Letter Learner card does): next week's sheet is 4 clicks and no chip marks this week's. | found S540 H

- [ ] S | parsha_emojis.html | **A split week names the other schedule's parasha** ("In Israel: Sh'lach"): an Israeli teacher sees the Diaspora card unless the Torah Trainer says Israel. | found S540 H

- [ ] S | letter_learner.html | **An open card puts `?letter=` in the URL.** **Picked S526.** | found S526 H

- [ ] S | letter_learner.html | **"Vowels to show": Select all / Clear.** **Picked S526.** | found S526 H

- [ ] S | resources.html | **The Links filters live in the address** (`?cat=&age=`): bookmarkable, kept on reload. | found S454 H

- [ ] S | hebrew_dictionary.html | **Word Lists offers "Save the N selected words"** while a selection exists (it says "No word lists yet…"). | found S440 H

- [ ] S–M | flash_cards.html (reads the dashboard's class lists) | **Make student profiles from a class list.** A class already in the dashboard (`hebrewDashboard_settings.rosters`) is re-typed one `prompt()` at a time; a "From a class list…" choice is ~50 lines + 3 keys, a handshake pair. | found: S412 Pass H

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

- [x] 2026-10-22 | (S546 close-out) | branch/deploy note | **S546 = P on parsha_emojis (first) + letter_learner (first, the clean surface's second): PE clean; LL FOUND 1, FIXED 1 (+1 suite P3, +1 C's P4); then 2 HC carriers.** Branch `claude/friendly-newton-nq3mkj` (PR #359 continued), draft PR; drift: none. sw v1073→v1074; no FM bump. Unattended: no gate asked.

- [x] 2026-10-22 | `e9759f0` | hebrew_dictionary.html | (S546) **Chosen Words / Emoji mode shows in HC** (`selected-state-lost-in-forced-colors`). | 2.8/2.7 → 127/86

- [x] 2026-10-22 | `ce31c96` | trope_tutor.html | (S546) **Open tab, chosen family, chosen font and pressed Slow show in HC** (`selected-state-lost-in-forced-colors`; the pressed control's `:hover` twin named). | 1.4–3.7 → 38–126; Slow 217 → 122

- [x] 2026-10-22 | `b577692` | letter_learner.html | (S546) **A new device's first sign-in no longer files the defaults as its own settings** (`defaults-filed-as-the-device's-own-at-first-sign-in`). | note + download 1/1 → 0/1; W1–W9 27/27; sync 215, migration 47, tools 47

- [x] 2026-10-22 | (S545 close-out) | branch/deploy note | **S545 = N on letter_learner (first): FOUND 1, FIXED 1 (+3 candidates).** Branch `claude/friendly-newton-nq3mkj`, draft PR; drift: only the S544 merge. sw v1072→v1073; no FM bump. Unattended: no gate asked; LL's gated rows stand.

- [x] 2026-10-22 | `09ff400` | torah_trainer.html | (S545) **The staff's Try again keeps the keyboard's focus** (`button-focus-lost-to-its-own-rebuild`). | body 2/2 → new Try again / Tune 2/2

- [x] 2026-10-22 | `6f51774` | hebrew_blend_generator.html | (S545) **Pressed blend type, colour mode and letter tiles show in HC** (`selected-state-lost-in-forced-colors`). | 0.1–5 → 78–138

- [x] 2026-10-22 | `bbf201c` | flash_cards.html | (S545) **Chosen deck, count, letters and vowels show in HC** (`selected-state-lost-in-forced-colors`). | 1–7 → 54–158

- [x] 2026-10-22 | `1c24c5f` | letter_learner.html | (S545) **The install hint steps aside while a card, the popup or the tour is open** (`install-banner-over-a-sheet's-bottom-controls`). | 4/4 covered → 0/4

- [x] 2026-10-22 | (S544 close-out) | branch/deploy note | **S544 = the protocol audit, no pass.** Branch `claude/sleepy-lamport-howch1`, draft PR; drift: PR 357 (S535–S543) merged to `main` mid-session, nothing else (sw v1072, FM 5.59, migration 0007 live). Pattern health → one-line rows + `loop-patterns.md` (28 DRAFT); Candidates sorted, 18 → Awaiting, 18 aged P4 archived; passes → …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-22 | (S543 close-out) | branch/deploy note | **S543 = B: FOUND 2, FIXED 1 (+3).** #357; no drift. sw v1071→v1072; no FM bump. Deferred: translit source.

- [x] 2026-10-22 | `277c7d58` | dictionary | (S543) **Emoji failure said.** | 0/4 → 4/4

- [x] 2026-10-22 | `61577b70` | contact | (S543) **Chosen pill shows in HC.** | 0/3 → 3/3

- [x] 2026-10-22 | `ff0eb611` | resources | (S543) **Pressed toggles show in HC.** | 0/8 → 8/8

- [x] 2026-10-22 | `7383dfb9` | 5 loader pages | (S543) **jsDelivr's wrong answers = a failed load.** | 10 → 0

## Metrics

### Per-session log (one line per session)

- 2026-10-22 | **S546** | iters: 4 | tools: letter_learner, trope, dictionary, sw | patterns fixed: defaults-filed ×1, forced-colors ×2 | pass run: P (parsha_emojis + letter_learner, both first) | SW: v1073→v1074

- 2026-10-22 | **S545** | iters: 5 | tools: letter_learner, flash, generator, torah, sw | patterns fixed: install-banner ×1, forced-colors ×2, button-focus ×1 | pass run: N (letter_learner, first) | SW: v1072→v1073

- 2026-10-22 | **S544** | iters: 0 | tools: skill, ledger scripts, scripts/loop, docs/reference | patterns fixed: — | pass run: — (protocol audit, no discovery pass) | SW: v1072→v1072

- 2026-10-22 | **S543** | iters: 5 | tools: gen, dict ×2, flash, torah, name_tags, resources, contact, sw | patterns fixed: forced-colors ×2 | pass run: B | SW: v1071→v1072

### Tool coverage (last-touched date per tool)

- **Snapshot S546 (2026-10-22):** letter_learner, trope, dictionary, sw.js, loop-findings, loop-patterns S546 · flash, generator, torah S545 · skill, ledger scripts, scripts/loop, loop-passes S544 · name_tags, resources, contact S543 · parsha_emojis, CSV S542 · i18n.js S541 · FM S538 · 5 toast pages S537 · saves S536 · scripts S535 · index, README, sitemap S532 · account, privacy, terms, 404 S530 · corpus S524 · pwa S472.

### Pattern health (one status line per pattern — shape, owner, detection and record: docs/reference/loop-patterns.md)

- `dated-surface-walk` | DRAFT | owner A | det: none | last S544 | streak 0

- `defaults-filed-as-the-device's-own-at-first-sign-in` | ACTIVE | owner P | det: recipe | last S546 | streak 0 | hits 6

- `selected-state-lost-in-forced-colors` | ACTIVE | owner C | det: recipe | last S546 | streak 0

- `live-region-shown-with-its-text` | ACTIVE | owner G | det: recipe | last S537 | streak 0

- `abs-child-escapes-its-scroller` | ACTIVE | owner N | det: recipe | last S534 | streak 0

- `empty-result-not-announced` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `print-trailing-padding-adds-a-sheet` | ACTIVE | owner H | det: recipe | last S530 | streak 1

- `unseen-hit-box-over-controls` | ACTIVE | owner C | det: recipe | last S530 | streak 1

- `layout-read-per-grid-at-build` | ACTIVE | owner D | det: recipe | last S524 | streak 0

- `dark-palette-baked-into-paper` | ACTIVE | owner G | det: recipe | last S523 | streak 0

- `tour-not-following-a-live-switch` | ACTIVE | owner K | det: recipe | last S522 | streak 0

- `overlay-scoped-dialog-keys` | ACTIVE | owner F | det: recipe | last S530 | streak 1

- `group-toggle-wipes-a-sibling-group` | ACTIVE | owner H | det: recipe | last S512 | streak 0

- `infinite-box-shadow-pulse-repaints-every-frame` | ACTIVE | owner D | det: recipe | last S511 | streak 0

- `new-page-print-block-without-the-ink-remap` | ACTIVE | owner G | det: recipe | last S509 | streak 0

- `page-drops-a-field-it-cannot-apply` | ACTIVE | owner P | det: recipe | last S507 | streak 0

- `theme-token-on-an-always-dark-surface` | ACTIVE | owner N | det: recipe | last S506 | streak 0

- `data-edit-under-an-unchanged-buster` | ACTIVE | owner E | det: recipe | last S503 | streak 0

- `root-var-per-input` | ACTIVE | owner D | det: recipe | last S497 | streak 1

- `dark-palette-on-the-element` | ACTIVE | owner G | det: recipe | last S495 | streak 0

- `count-noun-without-a-one-form` | DRAFT | owner I | det: none | last S533 | streak 0

- `busy-disabled-button-drops-focus` | ACTIVE | owner H | det: recipe | last S500 | streak 0

- `hidden-input-anchored-outside-its-scroller` | ACTIVE | owner C | det: recipe | last S499 | streak 0

- `hebrew-faux-italic` | ACTIVE | owner M | det: recipe | last S527 | streak 0

- `fixed-toast-duration-shorter-than-its-text` | ACTIVE | owner F | det: recipe | last S487 | streak 0

- `centred-fixed-box-shrinks-to-half-the-viewport` | ACTIVE | owner F | det: recipe | last S484 | streak 0

- `shared-module-fallback-literal-without-a-dark-twin` | ACTIVE | owner C | det: recipe | last S483 | streak 0

- `rtl-copy-names-the-english-side` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `copy-names-a-control-by-a-label-it-lacks` | ACTIVE | owner I | det: recipe | last S481 | streak 0

- `screen-frame-prints-as-rails` | ACTIVE | owner D | det: recipe | last S480 | streak 0

- `enter-ignored-beside-its-own-button` | ACTIVE | owner B | det: recipe | last S472 | streak 0

- `placeholder-keeps-the-browser-gray` | ACTIVE | owner F | det: recipe | last S470 | streak 0

- `header-wrap-gate-below-its-ceiling` | ACTIVE | owner M | det: recipe | last S520 | streak 0

- `latin-tracking-on-hebrew-labels` | ACTIVE | owner H | det: recipe | last S513 | streak 0

- `forward-arrow-points-back-in-rtl-copy` | ACTIVE | owner N | det: recipe | last S533 | streak 2

- `share-link-writes-the-teachers-saved-preferences` | ACTIVE | owner P | det: recipe | last S472 | streak 1

- `bulk-apply-skips-a-renderer-the-control-runs` | ACTIVE | owner K | det: recipe | last S472 | streak 1

- `radio-set-without-a-question` | ACTIVE | owner B | det: recipe | last S527 | streak 0

- `native-input-display-none-under-its-label` | ACTIVE | owner A | det: recipe | last S458 | streak 0

- `stale-tab-flush-writes-its-old-copy` | ACTIVE | owner A | det: recipe | last S493 | streak 0

- `flex-range-keeps-its-min-content-width` | ACTIVE | owner B | det: recipe | last S493 | streak 0

- `slider-value-announced-as-its-position` | ACTIVE | owner F | det: recipe | last S456 | streak 0

- `ltr-machine-text-field-typed-rtl` | ACTIVE | owner H | det: recipe | last S454 | streak 0

- `pre-ready-interpolated-write-never-healed` | ACTIVE | owner I | det: recipe | last S454 | streak 0

- `cdn-library-parser-blocking-for-one-action` | ACTIVE | owner D | det: recipe | last S452 | streak 0

- `dark-navy-fill-matches-its-ground` | ACTIVE | owner M | det: recipe | last S464 | streak 0

- `ring-below-3-on-light` | ACTIVE | owner F | det: recipe | last S443 | streak 0

- `tip-escape-drops-focus` | ACTIVE | owner C | det: recipe | last S441 | streak 0

- `account-wide-delete-confirm-without-signed-in-wording` | DRAFT | owner P | det: none | last S435 | streak 0

- `logical-inset-mirrors-onto-pinned-content` | ACTIVE | owner H | det: recipe | last S440 | streak 0

- `tip-name-joins-its-field's-name` | ACTIVE | owner A | det: recipe | last S488 | streak 0

- `panel-title-keyed-on-an-inner-span` | ACTIVE | owner B | det: recipe | last S439 | streak 0

- `copy-claims-success-on-a-refused-clipboard` | ACTIVE | owner F | det: recipe | last S445 | streak 0

- `button-focus-lost-to-its-own-rebuild` | ACTIVE | owner F | det: recipe | last S545 | streak 0

- `dark-literal-escapes-the-print-tokens` | ACTIVE | owner G | det: recipe | last S479 | streak 1

- `editor-re-parse-caps-a-merged-list` | ACTIVE | owner P | det: recipe | last S421 | streak 0

- `window-taller-than-a-phone-without-a-scroll` | ACTIVE | owner N | det: recipe | last S506 | streak 0

- `install-banner-over-a-sheet's-bottom-controls` | ACTIVE | owner N | det: recipe | last S545 | streak 0

- `flash-restores-captured-text-not-its-key` | ACTIVE | owner E | det: recipe | last S417 | streak 0

- `visible-label-missing-from-the-accessible-name` | ACTIVE | owner B | det: recipe | last S531 | streak 0

- `designed-key-miss-probed-through-t` | ACTIVE | owner B | det: recipe | last S533 | streak 2

- `pinned-english-without-lang` | ACTIVE | owner B | det: recipe | last S533 | streak 0

- `toggle-name-flips-with-its-pressed-state` | ACTIVE | owner F | det: recipe | last S431 | streak 0

- `author-display-defeats-the-hidden-attribute` | ACTIVE | owner F | det: recipe | last S511 | streak 0

- `button-group-label-not-programmatic` | ACTIVE | owner C | det: recipe | last S413 | streak 0

- `settings-lost-across-a-load` | ACTIVE | owner H | det: recipe | last S491 | streak 0

- `live-region-display-none-while-empty` | ACTIVE | owner M | det: recipe | last S530 | streak 0

- `dark-base-rule-outranks-variant` | ACTIVE | owner M | det: recipe | last S408 | streak 0

- `aria-disabled-lock-no-handler-checks` | ACTIVE | owner P | det: recipe | last S407 | streak 0

- `text-field-under-16px-zooms-on-ios-focus` | ACTIVE | owner N | det: recipe | last S508 | streak 0

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

- `fixed-surface-missing-from-the-print-hide-list` | ACTIVE | owner G | det: recipe | last S496 | streak 0

- `control-class-without-a-hover-state` | ACTIVE | owner L | det: recipe | last S373 | streak 0

- `false-clean-from-a-literal-only-pattern-match` | ACTIVE | owner O | det: recipe | last S309 | streak 0

- `false-clean-from-an-unverified-probe-handle` | ACTIVE | owner A | det: recipe | last S502 | streak 0

- `light-literal-text-on-the-gold-token` | ACTIVE | owner A | det: recipe | last S399 | streak 0

- `sub-floor touch target` | ACTIVE | owner E | det: recipe | last S531 | streak 0

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

- `pinned-english-prose-in-rtl-paragraph` | ACTIVE | owner M | det: recipe | last S277 | streak 0

- `fixed-width-third-party-embed-inflates-phone-layout` | ACTIVE | owner N | det: recipe | last S276 | streak 0 | hits 2

- `stale-html-fallback-behind-its-csv-value` | ACTIVE | owner K | det: recipe | last S533 | streak 0

- `undocumented-global-keyboard-shortcut` | ACTIVE | owner A | det: recipe | last S357 | streak 2 | hits 0

- `fixed-size-control-holding-translatable-text` | ACTIVE | owner A | det: recipe | last S264 | streak 1 | hits 0

- `legibility-destroyed-by-a-second-dimming-layer` | ACTIVE | owner A | det: recipe | last S263 | streak 0 | hits 1

- `fixed-control-positioned-outside-the-viewport` | ACTIVE | owner N | det: recipe | last S262 | streak 0 | hits 1

- `executable-javascript-in-a-localization-cell` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `i18n-html-markup-only-in-fallback` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `global-keydown-preventDefault-without-target-guard` | DRAFT | owner A | det: none | last S272 | streak 0

- `row-siblings-with-mismatched-heights` | ACTIVE | owner A | det: recipe | last S385 | streak 0

- `debounced-persistence-with-no-page-hide-flush` | ACTIVE | owner A | det: recipe | last S258 | streak 0 | hits 1

- `state-mutation-that-never-arms-its-persistence` | ACTIVE | owner A | det: recipe | last S257 | streak 0 | hits 1

- `flex-column-crushing-its-own-rows` | ACTIVE | owner N | det: recipe | last S249 | streak 0

- `translated-sibling stray` | DRAFT | owner H | det: none | last S336 | streak 0

- `mobile-input-hints` | DRAFT | owner I | det: none | last S534 | streak 0

- `i18n cross-column parity (placeholders, plurals, inline markup)` | ACTIVE | owner K | det: recipe | last S533 | streak 2 | hits 0

- `horizontal-overflow-at-narrow-widths` | ACTIVE | owner N | det: recipe | last S334 | streak 0 | hits 1

- `hover-only-affordance-under-a-synthetic-mouse-event` | ACTIVE | owner N | det: recipe | last S249 | streak 0 | hits 1

- `contrast-inverted-by-a-hover-or-active-state` | ACTIVE | owner C | det: recipe | last S368 | streak 0

- `dark-override-outranks-hover` | ACTIVE | owner A | det: recipe | last S357 | streak 1 | hits 0

- `contrast-below-AA-on-a-tinted-or-coloured-plate` | ACTIVE | owner M | det: recipe | last S501 | streak 0

- `async-store-backed-choice-clobbered-by-a-sync-fallback` | ACTIVE | owner A | det: recipe | last S226 | streak 1

- `rebuild-where-a-class-swap-would-do` | ACTIVE | owner A | det: recipe | last S220 | streak 0 | hits 1

- `decorative-glyph-carrier-exposed-to-assistive-tech` | ACTIVE | owner A | det: recipe | last S530 | streak 0

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

- `incomplete-print-token-reset` | ACTIVE | owner A | det: recipe | last S0 | streak 0

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

- P accounts & cloud (one surface): 2026-10-22 (**S546 — 13th P, parsha_emojis (first) + letter_learner (first, the clean surface's second): PE W1–W8 21/21, static 17/17 (plants 5/5), harness plants 9 red; LL W1–W9 27/27 after the fix; a fresh-device arm on 10 pages; live clean. PE clean; LL FOUND 1, FIXED 1; suite 1 candidate. P-next: fontmaker (S382), dashboard (S421).**)

- O deslop — AI-design-tell sweep (one surface): SKIP since S403 — the sandbox refuses to execute the third-party detector ("Code from External"); runs again once the maintainer commits a `.claude/settings.json` permission rule for it (`docs/reference/deslop-detector.md`). Last run 2026-09-08 (S346, `flash_cards.html`, 6th O; the S399/S403 refusals are in the archive).

- N mobile & touch-device (one surface): 2026-10-22 (**S545 — 28th N, `letter_learner.html` (first audit): 16 cells × 23 views by real taps, rotation, finger drags, 4×, the forced iOS hint; plants 7/7. FOUND 1, FIXED 1. N-next: parsha_emojis (never), flash (S361).**)

- M aesthetics & visual design (one surface): 2026-10-21 (**S536 — 27th M, LL (first): 120 shots × 12 cells, real fonts, row census, real Next clicks; plants fired. FOUND 5, FIXED 3 + S464. M-next: FM (S335).**)

- K i18n / localization audit: 2026-10-21 (**S533 — 36th K, `db80feb4..843984b3` (111 commits; parsha_emojis' first): CSV +209 (all resolve), 12 reworded, 0 removed; static 5,502 refs + 2,974 fallback sites (the html arm, lapsed since S475); blind 0/4,328 lines; 102 states by the real switcher (twins = base + 5 known); retry 4/4; 10 surfaces by real input + a switch mid-state. FOUND 4, FIXED 4.**)

- C accessibility (one tool): 2026-10-22 (**S541 — parsha_emojis' first C: 9 surfaces × 6 cells, Tab, dialog 140/140, motion, spacing (all plants fired); forced colours, field borders, zoom. FOUND 6, FIXED 4. C-next: name_tags (never), flash (S381).**)

- A recurring-pattern sweep: 2026-10-21 (**S530 — 41st A, `d77484c5..6f9a5992` (109 commits; parsha_emojis' first): 53 static + 16 runtime arms × 16 pages vs pre-delta (plants fired), 18 blocks, dialogs, print, 1px sweep. FOUND 4, FIXED 4.**)

- G print & export fidelity (one tool): 2026-10-21 (**S537 — parsha_emojis' first G: 56 card PDFs, 108 sheet combos; plants fired. FOUND 2, FIXED 1. G-next: name_tags (never), generator (S392).**)

- D performance (one tool): 2026-10-22 (**S538 — parsha_emojis' first D (trope was S480, not S365): cold, 33 real-click arms × 1×/4×, traces, idle, leak; controls fired. FOUND 4, FIXED 1. D-next: name_tags (never), FM (S410).**)

- I first-load & empty-state: 2026-10-22 (**S539 — 40th I, S525 → S538 (93 commits; name_tags' first I, parsha_emojis' under its name): 63 virgin cells (plants 334/336); 69 seeds; 27 tours; ~250 openers; 280 bad URLs; failure paths 20. FOUND 2, FIXED 1.**)

- B console/error audit: 2026-10-22 (**S543 — 41st B, 78 commits (name_tags' first): 84 cells; name_tags, 9 tours, PE, LL, 8 retries by real input; iPhone ×42. FOUND 2, FIXED 1.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- V offline & service-worker runtime (suite): never run — registered 2026-10-22 (S544; `docs/reference/loop-passes.md` → V: the installed worker serving the shell with the server stopped, the data cache, the VERSION+1 activate path)

- L SEO & discoverability audit: 2026-10-21 (**S532 — 29th L, `18a7e6a3..ca9b9618` (110 commits; LL's launch, parsha_emojis' first L): 20 arms + 3 on 20 pages (plants 29/29); SEO surface unchanged 16/18; LL + parsha JSON-LD claims by real clicks; FAQ twins 10/10. FOUND 1 (gate 2), FIXED 4; S432 struck.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-10-22 (**S540 — parsha_emojis' first H: 11 lessons by real clicks × 2 cells (+ 6 widths, 1920, 5 dated weeks). FOUND 4, FIXED 1. H-next: name_tags (never), trope (S367), FM (S380); the chrome bundle S498 (privacy/terms/404 never as pages).**)

- E freshness/site-health: 2026-10-21 (**S531 — 41st E, `d7c58446..48286048` (108 commits; parsha_emojis' first): 16 arms + carrier lists (plants 18/18), docs, CSP 40 cells (plant 40/40), the stub. FOUND 2, FIXED 4.**)

- F cross-tool consistency: 2026-10-22 (**S542 — 40th F, loading states (first since S189): 14 surfaces held, then aborted. FOUND 7, FIXED 4. F-next: long-build progress.**)

**Next session (S547):** **PR `claude/friendly-newton-nq3mkj` (S545–S546, #359): open → continue on it; merged → fresh branch off `origin/main`.** `sw.js` **v1074**, FM **5.59**, corpus ?v=7. ⚑ drift: main=44fc930 sw=v1074 fm=5.59 migration=0007_saves_tool_name_tags.sql live=yes functions=a0151a3 sdk=2.116.0 config=58edf33 keepalive=aed4e7b. ⚑ Stalest: suite A (S530), E (S531), L (S532), V (never — its first run, `loop-passes.md` → V); surface: name_tags never had C/D/G/H/M, parsha_emojis never had N (the new-page rule: overdue). ⚑ Keep-alive #40 (10-22) green; #41 (10-23): confirm. ⚑ Seeds: 48. ⚑ 27 DRAFT pattern rows still need a recipe or retirement at the next A. ⚑ The S546 P3 (the false "replaced" note on five pages) is a shared-module rule — the maintainer's call before a loop fix; `defaults-filed-as-the-device's-own-at-first-sign-in` is its row. ⚑ Maintainer: O's Bash permission rule (`.claude/settings.json`); a CI workflow running `closeout.mjs --static`; translit second source; sw.js `no-store`; 14 fonts; torah screen reader; A/B week eyes; gates 2–4 (+ field borders, retry copy).
