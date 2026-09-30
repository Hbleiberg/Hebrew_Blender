# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**S432 L, gate 2 APPROVED; S433**) | torah_trainer.html | **Search copy omits the Trope staff.** FAQ a1 (page + JSON-LD) + "a Trope staff layout (beta) that draws the reading on a music staff with each word under its notes," after "cantillation strip,"; app description + "a Trope staff layout that draws the reading on a music staff," after "trope-family clause coloring,". | found S432

- [ ] P4 (**NEW S432 L — gate 2**) | index.html | **The hub's og:/twitter:description name every tool but the Font Maker.** | found S432

- [ ] P4 (**S430 A**) | torah_trainer.html | **The cycle note's "Try again" drops the focus to `<body>`** (a failed load). | found S430

- [ ] P4 (**S430 A; NEW pattern**) | torah ×3 + generator | **Four fields are named "… More information"** (the label's tip joins the name; model `#ttShareSettings`). | found S430

- [ ] P4 (**S430 A — the maintainer's call**) | torah_trainer.html | **The reading header keeps "Aliyah {n}" English in the Hebrew UI** beside a translated cycle label (also the copy heading, the handout). | found S430

- [ ] P4 (**NEW S431 E**) | torah_trainer.html | **Two comments name only Chol HaMoed as the Sefaria fallback** (`goToCurrentParshah`, `init`); since `8cb1a2c` the Diaspora's Pesach 8 / Shavuot 2 too. | found S431

- [ ] P4 (**NEW S428 Pass F — 7 carriers**) | index, dashboard, generator ×2, flash ×3 | **A copy both routes refused still says "Copied"** (`execCommand`'s answer ignored; model `dictCopyText`); the backup-textarea Copy buttons go unannounced. | found S428

- [ ] P4 (**NEW S428**) | torah_trainer.html | **Colour-coded copy's rich fallback leaves the focus on `<body>`** (a framed page; HEAD too). | found S428

- [ ] P4 (**NEW S429 B; NEW pattern**) | torah_trainer.html + hebrew_blend_generator.html | **Two panels forget their open/closed state on a reload** (torah "Trope staff", generator "Saved Presets"): their title keys sit on an inner span the panel memory never reads. | found S429

- [ ] P4 (**NEW S429**) | hebrew_dictionary.html | **The empty state's "Clear search" and "Search without vowels" drop the focus to `<body>`**; reuse `refocusAfterFilterReset`. | found S429

- [ ] P4 (**NEW S427**) | hebrew_dictionary.html | **Closing Add to Word List, opened from a word's details, drops the focus to `<body>`.** | found S427

- [ ] P4 (**NEW S427 Pass C — four small ones**) | hebrew_dictionary.html | **(1)** the emoji tree's ▾ 15×9 px, rows 21 px apart; **(2)** "♀ Feminine" 4.42:1 at 0.62rem; **(3)** Shoresh's empty tiles 2.79:1 / 3.13:1; **(4)** Enter in Save as Word List's name field does nothing. | found S427

- [ ] P4 (**NEW 2026-09-28**) | hebrew_dictionary.html | **A loaded Word List outlives a switch to Emojis or Shoresh**: `setDictMode` hides the banner but keeps `wlFilterOverride`, so a language switch then writes the list's count into `#resultCount` ("2 מילים" over 1,581 emojis). | found 2026-09-28

- [ ] P4 (**NEW S421 Pass P**) | classroom_dashboard.html | **The "Now showing {name} — the classes from your account are in the class list" switch runs on every signed-in load and credits the account even when it holds nothing**: with the pointer on the untouched default and a class this device made itself, the page switches to that class and says it came from the account …[full text: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S421 Pass P — for H**) | classroom_dashboard.html | **A class list beyond the picker's cap keeps its names now (`288af4a`) but the picker draws only the first 60 chips** (`rosterNames()` slices), so students 61+ of a merged class are stored and counted ("65 names (max 60)") yet never picked; say so in the drawer or raise the chip cap. | found S421

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **The first transliteration of a reading is still one long task**: ~600 ms @1× / 3.3–4.1 s @4× on a full parsha, the library ~93% (profiled); fill the rows in idle chunks or a worker. `40c5154` fixed every re-render after it. | found S424

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **Side by side with a translation is layout-bound at 4×**: re-renders 450–930 ms (≤280 @1×), ~80% style/layout; long-standing (the S307-era page 461–676 on the same stub); interlinear ≤195. | found S424

- [ ] P4 (**NEW S423 Pass G**) | flash_cards.html | **A plain Ctrl+P prints screen controls**: the drill's `<kbd>` hint row (`f803b78`) and the results screen's five buttons; add them to the print hide list. | found S423

- [ ] P4 (**NEW S422 Pass M — the jump bar's readout, two**) | torah_trainer.html | **(1)** `.tt-jump-pos` and `.tt-audio-credit` use `margin-left:auto` (`physical-property-that-never-mirrors`): in HE the readout hugs the chips; **(2)** the readout is blank on load and stale after a jump to the top, so a one-aliyah reading shows "CURRENT VERSE" and nothing. | found S422

- [ ] P4 (**NEW S422 Pass M — five small ones**) | torah_trainer.html | **(1)** page view's drop cap is `--gold`, 2.6:1 on light (print uses `--gold-text`); **(2)** drawer segments break mid-label at 380px; **(3)** Audio tracks start ragged; **(4)** Translit Style clips "[DEFAULT]"; **(5)** "Custom range…" has no icon. | found S422

- [ ] P4 (**NEW S422 Pass M — gate 3 / gate 2**) | torah_trainer.html | **(1)** dark Chant all is 1.1:1 on the page; **(2)** Hebrew-only side by side keeps an empty half; **(3)** "עִבְרִית" in Libre Baskerville; **(4)** gate 2: the Audio help's 🔊 / 🎵, not the icons. | found S422

- [ ] P4 (**NEW S425 Pass I**) | torah_trainer.html | **A stored layout or translit style this page does not know gets no display fallback** (`layout:'grid'`: side by side, no radio checked; an unknown style: blank); accounts rule 7. | found S425

- [ ] P4 (**NEW S425 Pass I — extract the tour engine first, UX rule 1**) | trope_tutor.html | **With `trope_motifs.json` missing the tour counts "Step 3 of 8 → Step 5 of 8"**; torah/dictionary use `_tourCounter`. | found S425

- [ ] P4 (**NEW S425 Pass I — for F**) | CSV, 8 pages | **22 Hebrew strings end in "→", pointing back in RTL** (home CTAs, trope nav, torah links); 25 use "←". | found S425

- [ ] P4 (**NEW S418 — the maintainer's dashboard**) | Supabase project | **Security advisor: leaked-password protection is off**; passwords are never used (e-mail code + Google), so enable the toggle or accept it as moot. | found S418

- [ ] P4 (**NEW S420 Pass N — for F or A; the z-index table is in loop-findings**) | pwa.js + the 7 sheet-bearing pages | **The install banner (position:fixed, z-index 2147483000) floats over any open sheet's bottom band on a short phone**; the hub hides it by its own state (`f44a17e`), and a lower z-index alone is not the suite fix (the generator's `.gen-fab` z 90 equals the dashboard/torah …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S412 Pass H — five small ones**) | flash_cards.html | **(1)** a tied personal best reads as new (`>=` against a `pbStreak` raised live); **(2)** a timed drill paints the previous value for 1 s; **(3)** the "New" profile button's second `class` is ignored (no `.hi-btn`); **(4)** a load in 1-letter mode narrows "Vowel on letter" `[2]` → `[1]`; **(5)** gate 2: the printed card …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S412 Pass H**) | data/hebrew_emojis.json | **🥝 קִיוִוי reads "kivivy"** (+ "di.en.eyy.", "beruneyy"); the fix bumps the corpus `?v=`. | found S412

- [ ] P4 (**NEW S413 Pass C**) | resources.html | **Card focus lacks hover's affordances** (the trio's (1) directory `lang="en"` and (3) ✓ 3.41:1 FIXED S422 `8c56a89`, `d28cf34`). | found S413

- [ ] P4 (**NEW S413 Pass C — gate 3**) | 404.html | **The lost star wanders forever with no pause** (WCAG 2.2.2); only reduced motion stops it. | found S413

- [ ] P4 (**NEW S414 Pass F — gates 2/3 + K**) | chrome pages, the 7 tools, 404, CSV | gate 2: **(1)** dark mode's visible "Light", and FM's fullscreen "Show/Hide Panels" (S415), are not in their fixed toggle names (2.5.3); **(2)** "Back" goes to the home page (tools say "Home"); **(3)** 404 lists 4 of 7 tools. Gate 3: **(4)** Tour / Dark / Full Screen / Settings order differs per tool. K: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S415**) | torah_trainer.html, trope_tutor.html | **The Sefaria / PocketTorah credits are pinned English with no `dir="ltr"` or `lang="en"`**; `dir` changes the Hebrew rendering, so compare crops. | found S415

- [ ] P4 (**NEW S411 Pass I — F/O's, a census, not I's to fix**) | 8 pages | **~37 chrome controls still lead their label with a glyph**, against CLAUDE.md's "a control string never carries a glyph": resources' 11 category chips, FM's node-editor modes + back arrows (10), flash cards 7, dashboard 4 (`📍` ×2, `↔`, `✨`), generator `🃏`, trope `🎯`. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S411 Pass I — K's**) | Hebrew_Font_Maker.html | **QA Check's outline warning names a glyph by its JS-built English `name` in the Hebrew UI** ("A (uppercase)"; the English, Cyrillic, Phoenician and Aramaic tables build `name` with no key, e.g. "Д (Cyrillic de, uppercase)"). | found S411

- [ ] P3 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **The Spacing tab renders every kerning pair on each show and each kern edit**: FreeSerif's 2,000 imported pairs → 238ms @1×, 1.3–1.6s @4×; each row finds its members with a linear `project.letters.find` (`kernCpTraced`). **S422: the find is ~ms, not 238ms — profile first (loop-findings S422 (6)).** | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **Continue runs a synchronous `autosaveNow()` inside the click's task** (88–114ms of 575–616ms @4×), re-saving the snapshot it just restored. | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **The partner wizard's Create re-renders every grid once per setter** (`setMarkEnabled` ×2, `setAddEnglishLetters`, `setInputMode`…): 3 tasks of 465–678ms @4×, top 146–201ms @1× (engine blocked; with it, Pyodide's own blocks dominate). | found S410

- [ ] P4 (**NEW S409 Pass G**) | account.html | **Printing splits cards across sheets, spends an A4 sheet on the footer and prints 6 inert controls.** | found S409

- [ ] P4 (**NEW S409**) | classroom_dashboard.html, hebrew_blend_generator.html | **Dead drag code**: the dashboard's `.preset-item.drag-over` has no writer; the generator's `makeSortable()` no caller. | found S409

- [ ] P4 (**NEW S404 — the icon sweep's one missed tab**) | trope_tutor.html + locales/ui-strings.csv | **The Drill tab's label is still `🎯 Drill` / `🎯 תרגול` (CSV note `leading-emoji`) while its sibling Learn tab carries the `hi-book` SVG with a glyph-free label** — the one mode tab the sweep did not convert. The 49-glyph set has no target shape, so the fix picks an existing glyph or adds one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S405 Pass K fallback arm**) | Hebrew_Font_Maker.html | **`_pT('special_intro', …)`'s English fallback still describes only the wide letterforms** ("Pick one, then use the Width slider") since `fdcb140` widened the panel and its CSV text to the dagesh/mapiq forms and yod-with-hiriq; seen only before I18n.ready or with the dictionary missing. Copy the CSV `en` into the fallback. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S405 Pass K gate controls — K's, doc-only**) | scripts/check-i18n.js + docs/reference/i18n.md | **The gate's header says `.innerHTML = '<literal>'` is flagged; rule 2 skips innerHTML by design**, and its exit-contract comment omits D and E (both block). i18n.md's "Known blind spot" names template literals, plain arguments and ternaries, not a plain innerHTML literal, and its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S405 orphan census — a prune list; each key needs S361's proof**) | locales/ui-strings.csv | **Dead duplicates the pages reach through another key:** `dashboard.text.underline`, `dashboard.text.done_btn_title`, `dashboard.weather.city_current`, `fontmaker.adpick.box_title`, `dashboard.weather.wmo_*` (the board's table carries its own he/en), and the 5 `fontmaker.templates.*_meta` …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S405 — found beside `f78ad1b`**) | Hebrew_Font_Maker.html | **The Upload help tab's link to Download Templates exists only in the English authored HTML** (`openHelp('templates')`); the translated Upload body is CSV prose, so a Hebrew reader gets no link. A `data-fmact` action (the dispatcher's CSV-safe route) would carry it. | found S405

- [ ] P4 (**NEW S403 Pass E arm 20 — K's to fix; CLASSIFIED S405**) | locales/ui-strings.csv | **121 rows keep a `leading-emoji` note although their `en` no longer leads with a glyph** (the icon sweep re-noted 74 others `svg-icon-in-markup`); a translator adding a third language would put the emoji back. S405 read every row's use sites: 99 ICON → `svg-icon-in-markup`, 11 PLAIN → drop the token, 9 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S398 Pass B — REPLACES the S397 flash-cards line and CORRECTS its trope verdict; measured on the RENDERED outline, not the static DOM**) | flash_cards.html, Hebrew_Font_Maker.html, trope_tutor.html | **Three pages skip a heading level for a reason the tour card is not.** Rendered at load: flash `h1,h3×8` and FM `h1,h3×16` both jump 1→3 (their h3s are panel/modal titles, all …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S396 Pass C — filed rather than fixed BECAUSE it cannot be measured in this harness; do not ship it on an assertion**) | account.html | **`#holdsList` carries `list-style:none`, which is the shape that makes WebKit/VoiceOver drop a list's semantics** (the count and the "list" role), leaving the account's holdings as loose text. The nested `.holds-kinds` / `.holds-names` keep their …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S394 census, retuned S395 — `04892f3` took the three SHADOWED ones that were accidents; what is left here is judgement, not dead code**) | hebrew_blend_generator.html | **The `.bingo-card-num` / `.bingo-grid` IDENTICAL twins and the `.bingo-card` SHADOWED one sit inside a deliberate later layer that re-declares the bingo shapes in print-safe literals, and `body.dark …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S394 — the non-generator half of the same census; all DIVERGENT, i.e. the earlier rule still contributes, so each needs reading rather than deleting**) | Hebrew_Font_Maker.html, classroom_dashboard.html, hebrew_dictionary.html, privacy.html, terms.html | **5 selectors declared twice with overlapping properties: FM `#fsPanelsBtn`; dashboard `textarea` and `.fr-tour`; dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — BACKEND BOUNDARY: changing it needs a redeploy, so maintainer work, not a loop fix**) | db/functions/delete-account/index.ts | **The production Edge Function's `ALLOWED_ORIGINS` still carries `http://localhost:8080` and `http://127.0.0.1:8080` beside the two real origins.** Low risk (a web attacker cannot forge `Origin`, and the JWT is the real gate), but it is dev …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — a real gap, shippable, but it is a new control + copy so it was not taken unattended-of-gate-1**) | js/ivrit-account.js + account.html | **`signOut({ scope: 'local' })` ends the session on this device only and no UI offers "sign out everywhere", so a teacher who loses a school laptop cannot revoke that device.** Supabase supports `scope: 'global'`; the shape is one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S388 Pass K RTL arm — MEASURED and deliberately logged, not shipped; the third session to adjudicate this shape the same way (S248 `#fsExitBtn`, S376 `.pick-close`)**) | classroom_dashboard.html | **`.dash-edit-pencil` is pinned `top:4px; right:4px` and does not mirror — logical start-offset 520px in `en`, 4px in `he`, the physical right corner in both.** Held back because the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S382 Pass P census — a JUDGEMENT call, not the same defect: these are action toolbars, not homogeneous selection grids, and one stop per button is defensible**) | classroom_dashboard.html + torah_trainer.html | **`.fs-strip-btn` ×6, `.timer-preset-btn` ×5, `drawerToolbar .ed-btn` ×9; torah `.tt-fs-btn` ×6, `#ttTropeLegend .tt-trope-chip` ×6.** ARIA APG would rove a toolbar; the …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] S–M | flash_cards.html (reads the dashboard's class lists) | **Make student profiles from a class list.** A class already in the dashboard (`hebrewDashboard_settings.rosters`) is re-typed one `prompt()` at a time; a "From a class list…" choice is ~50 lines + 3 keys, a handshake pair. | found: S412 Pass H

- [ ] S | flash_cards.html | **"Print the deck we just drilled" on the results screen.** `wireResultsScreen()` binds Save / Redo / Mistakes / Back only; the only caller of `printCardSheet()` is `#sheetPrintBtn` inside `#sheetMenu`, opened from the setup screen's sticky CTA — and `sheetPracticed` + `savedCards` already exist for exactly this moment (`openSheetMenu` unhides `#sheetPracticedRow` …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Speech speed reachable mid-drill.** `speakWord()` reads `#ttsRateSlider` live, but the slider sits in `#panelAdvanced` on the setup screen, so a slower 🔊 Hear costs End Practice Early → Advanced → drag → restart. A −/+ pair beside `#fcSpeakBtn` writing the same slider is the torah `#ttLoopPauseBar` mirror shape; ~35 lines, 2 CSV keys, no storage. | found: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Pause the drill timer.** `startTimer()` is a bare `setInterval`, `stopTimer()` is terminal (clears AND hides `#timerDisplay`; callers: `showResults`, `returnToSetup`, `startTimer`), so an interruption inflates a tracked time or burns a limit. A pause chip on `#timerDisplay` reusing `formatTimerSecs`/`updateTimerDisplay`; ~40 lines, 2 CSV keys, transient state. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Maftir in the Reading picker.** `data/pockettorah/aliyah.json` carries a `_num:"M"` entry with `_begin`/`_end` for every parsha (210 entries verified S367) and `aliyahLookup()` keys `aliyot[num]` by the raw `_num`, so `aliyot['M']` is built on every lookup and read nowhere: `resolveRef` matches `/parsha-aliyah-(\d)/`, `refreshScopeLabels` loops 1–7 and `.filter(n …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Projector mode can't turn the translation / transliteration off.** `#ttShowTranslit` and `#ttShowTranslation` exist only inside `.tt-controls`, which `body.fullscreen .tt-controls { display:none }` removes; the drawer's Display panel (reachable via `#ttFsSettings`) carries cantillation and nikkud but not these two. Two more `.tt-fs-btn` toggles dispatching …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S–M | classroom_dashboard.html | **One-deep undo in the week editor.** `applyCalendarImport` replaces `settings.scheduleWeek` wholesale, `clearWeekDay` / `copyWeekDayToWeekdays` / `removeWeekPeriod` guard with a native `confirm()` at most, and `weekChanged()` (the choke point) saves immediately with no history. A `weekSnapshot()` at the head of the ~8 mutators + `undoWeek()` + one toolbar …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M | resources.html | **"Submit a font" is a `mailto:` while "Suggest a Resource" is a real form.** Measured 2026-09-01: `openSubmitFont` builds a `mailto:` with a pre-filled subject and body and sets `window.location.href`; the sibling flow one view away is a Web3Forms POST with 5 required fields, 18 choice pills and hCaptcha. So the contribution pat …[full text: IMPROVEMENT_ARCHIVE.md] …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | index.html | **Show which tools already hold your saved work, on the tool cards.** A returning teacher scanning eight cards has no way to see where their presets live; measured 2026-08-31, index has **no** per-card data indicator and no recency affordance at all — the only `badge` in the file is the flash-cards *Beta* tag, and the two `recent` hits are Font Maker key comments inside …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] M (dual) | classroom_dashboard.html | **Per-day period-time overrides** (early-dismissal Friday). The locked v1 model is ONE shared bell schedule across all days; an `overrides: {fri: [{start,end}…]}` sidecar on `scheduleWeek` could relax that without touching the cells model. The engine already resolves times per-day at one point (`computeWeekState`'s `timed` build). | found: 2026-08-06, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] L | classroom_dashboard.html | **A/B or rotating week cycles.** Needs a cycle dimension on `scheduleWeek` (cells per cycle-week), a "which week is it" anchor date, and cycle awareness in `computeWeekState`'s next-school-day scan — a real model change, not a sidecar. | found: 2026-08-06, weekly-grid build

- [ ] S | trope_tutor.html | **Tune practice: its own tempo with a “slow for learning” preset, a repeat count (1–3) and an echo gap** for the class to sing it back. | found: 2026-09-24, maintainer …[full text: IMPROVEMENT_ARCHIVE.md]

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

## In progress

_(none)_

## Done

- [x] 2026-09-30 | (account cleanup — outside the loop, branch `claude/account-system-cleanup-iv9j2n`) | js/ivrit-saves.js, js/ivrit-account.js, the 7 wired pages | **The Cloud saves panels, the account screen, the splash, `forgetRow` and `registerSummary` are gone: signed in, the account is where saves live** (hydrate at load, write-through, one status line, two gates). Closed as moot: the late-`attach()` offer (session 430), the panel error (428), the screen's self-link (426), the empty band (422), the `restoreLastSetup` sibling (382), the empty-account seed (426 H).

- [x] 2026-09-30 | (S432 close-out) | branch/deploy note | **S432 = pass L + 4 fixes → draft PR #293.** DRIFT: none. sw v888→v889; FM not bumped. Gates 5/5. Smokes: none owed.

- [x] 2026-09-30 | `7fb0eea` | terms.html | (S432 L, gate 2) **The Hebcal line names the Torah Trainer's data (BSD-2); effective date Sept 30.** | verified: HEAD vs fix ×4 + static; 11 slots

- [x] 2026-09-30 | `1badd3d` | trope_tutor.html | (S432 L, gate 2) **The Settings tour step names the Haftarah melody.** | verified: real clicks to 8/8 ×4; HEAD control

- [x] 2026-09-30 | `3cdc95e` | torah_trainer.html | (S432 L, gate 2) **FAQ 6: the page finds this week's reading itself** (EN + HE + JSON-LD). | verified: ×4 + HEAD; 105 Shabbatot (D 3 / IL 2 ask Sefaria); set-clock clicks

- [x] 2026-09-30 | `8938513` | trope_tutor.html + torah_trainer.html | (S432 L) **Two static fallbacks match their CSV** (trope's intro, torah's tip). | verified: detector 2 → 0 (5 plants); HEAD vs fix ×8

## Metrics

### Per-session log (one line per session)

- 2026-09-30 | **S432** | iters: 1 pass (**L**) + 4 fixes = **5** | tools: torah ×2, trope ×2, terms | patterns fixed: stale-fallback ×2, JSON-LD parity ×1 | pass run: L | SW: v888→v889

- 2026-09-30 | **S431** | iters: 1 pass (**E**) + 4 fixes = **5** | tools: torah, THIRD_PARTY_LICENSES, README, ops.md + font-maker.md | patterns fixed: toggle-name-flips-with-its-pressed-state ×1 | pass run: E | SW: v887→v888

- 2026-09-30 | **S430** | iters: 1 pass (**A**) + 4 fixes = **5** | tools: torah ×2, trope, js/ivrit-saves.js (shared) | patterns fixed: author-display ×2, stale-fallback ×3 | pass run: A | SW: v886→v887

- 2026-09-29 | **S429** | iters: 1 pass (**B**) + 4 fixes = **5** | tools: trope, dictionary ×2, shared ×2 | patterns fixed: button-focus-lost, sub-floor | pass run: B | SW: v884→v885

- 2026-09-29 | **S428** | iters: 1 pass (**F**) + 4 fixes = **5** | tools: torah, dictionary ×2, js/ivrit-saves.js | patterns fixed: copy-claims-success-on-a-refused-clipboard ×2 (NEW) | pass run: F | SW: v883→v884

- 2026-09-28 | **S427** | iters: 1 pass (**C**) + 4 fixes = **5** | tools: dictionary ×2, js/ivrit-account.js (shared), account | patterns fixed: button-focus-lost ×1, visible-label-missing ×1 | pass run: C | SW: v870→v871

- 2026-09-28 | **S426** | iters: 1 pass (**H**) + 4 fixes = **5** | tools: account ×2, js/ivrit-saves.js (shared), manifest | patterns fixed: modal-focus-trap ×1, button-focus-lost-to-its-own-rebuild ×1 (NEW) | pass run: H | SW: v869→v870

- 2026-09-28 | **S425** | iters: 1 pass (**I**) + 4 fixes = **5** (full budget) | tools: trope ×2, js/ivrit-account.js (shared), torah | patterns fixed: author-display-defeats-the-hidden-attribute ×2, visible-label-missing-from-the-accessible-name ×1 | pass run: I | SW: v867→v868

- 2026-09-28 | **S424** | iters: 1 pass (**D**) + 4 fixes = **5** (full budget) | tools: torah ×2, flash ×2 | patterns fixed: — | pass run: D | SW: v866→v867

- 2026-09-27 | **S423** | iters: 1 pass (**G**) + 4 fixes = **5** (full budget) | tools: flash ×2, torah ×2 | patterns fixed: visible-label-missing-from-the-accessible-name ×1 | pass run: G | SW: v865→v866

- 2026-09-27 | **S422** | iters: 1 pass (**M**) + 4 fixes = **5** (full budget) | tools: torah ×2, resources ×2 | patterns fixed: contrast-below-AA-on-a-tinted-or-coloured-plate ×1, pinned-english-without-lang ×1 | pass run: M | SW: v864→v865

- 2026-09-25 | **S421** | iters: 1 pass (**P**) + 3 fixes = **4** | tools: dashboard, index, js/ivrit-saves.js (shared) | patterns fixed: editor-re-parse-caps-a-merged-list ×1 (NEW) | pass run: P | SW: v854→v855

- 2026-09-25 | **S420** | iters: 1 pass (**N**) + 3 fixes = **4** | tools: index ×2, flash | patterns fixed: text-field-under-16px ×1, translated-key-exists-page-hardcodes-english ×1 (NEW install-banner-over-a-sheet's-bottom-controls ×1) | pass run: N | SW: v853→v854

- 2026-09-25 | **S419** | iters: 1 pass (**K**) + 4 fixes = **5** | tools: FM, trope ×2, torah | patterns fixed: translated-key-exists-page-hardcodes-english ×2 | pass run: K | SW: v852→v853

- 2026-09-25 | **S418** | iters: 1 pass (**L**) + 4 fixes = **5** | tools: torah, 404, dictionary + resources, resources | patterns fixed: stale-html-fallback-behind-its-csv-value ×3 | pass run: L | SW: v851→v852

- 2026-09-25 | **S417** | iters: 1 pass (**E**) + 4 fixes = **5** | tools: README, shared-components.md, dictionary + flash, trope | patterns fixed: flash-restores-captured-text-not-its-key ×2 (NEW) | pass run: E | SW: v850→v851

- 2026-09-24 | **S416** | iters: 1 pass (**A**) + 4 fixes = **5** | tools: flash, trope ×2, FM | patterns fixed: visible-label, toggle-name, translated-key, author-display | pass run: A | SW: v846→v847

- 2026-09-24 | **S415** | iters: 1 pass (**B**) + 4 fixes = **5** | tools: flash ×2, FM ×2 + i18n.js, gen. ×2, torah, 8 more footers | patterns fixed: textContent-rewrite ×2, 3 NEW (label-in-name, key-miss probe, pinned-english) | pass run: B | SW: v837→v838

- 2026-09-24 | **S414** | iters: 1 pass (**F**) + 4 fixes = **5** | tools: flash ×2, dict., FM, gen. | patterns fixed: author-display-defeats-the-hidden-attribute (un-retired), translated-key-exists-page-hardcodes-english, toggle-name-flips-with-its-pressed-state ×2 | pass run: F | SW: v836→v837

- 2026-09-23 | **S413** | iters: 1 pass (**C**) + 4 fixes = **5** | tools: resources ×2 (at cap), contact, 404 | patterns fixed: dark-mode-token-as-text-on-a-light-ground ×1 (REOPENED), button-group-label-not-programmatic ×8 rows (NEW) | pass run: C | SW: v835→v836

### Tool coverage (last-touched date per tool)

- **S432 (2026-09-30):** torah (**S432** ×2; S431; **C-next** C S298); trope (**S432** ×2; S430); terms (**S432**); licences, README, ops.md, font-maker.md (S431); js/ivrit-saves.js (S430); dictionary (S429; **H-next** H S292); js/ivrit-account.js (S429); account (S427); manifest (S426); flash (S424; **P-next**); resources (S422); index (S421; **G-next**); dashboard (S421; **D-next**); FM (S419); 404 (S418); generator (S415; **N-next**); chrome + i18n.js (S415); no M: generator, flash, terms.

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`tip-name-joins-its-field's-name`** (NEW S430; torah ×3 + generator OPEN): ACTIVE, streak 0. A `<label>` holding a `.tip-wrap` names its field "… More information". Detection `a430/moreinfo.mjs` (AX tree, panels open, a planted control). Fix: `aria-labelledby` on the text …[full text: IMPROVEMENT_ARCHIVE.md]

- **`panel-title-keyed-on-an-inner-span`** (NEW S429; torah, generator open; S430: the lookup panel clean): ACTIVE, streak 0. Detection: a `.panel-title` with no own `data-i18n`, then toggle + reload.

- **`copy-claims-success-on-a-refused-clipboard`** (NEW S428; FIXED `bbd5f65`, `0d2a941`; 7 open): ACTIVE, streak 0. Detection `f428/copy.mjs`: sentinel, real click, 3 contexts.

- **`button-focus-lost-to-its-own-rebuild`** (**S426 account `e091820`; S427 the dictionary's Word Lists `7a631f6`, chips/Reset FIXED `cea92bf`; empty-state Clear OPEN; S430 torah's cycle-note Try again OPEN**): ACTIVE, streak 0. Detection: press each button of a JS-built list; …[full text: IMPROVEMENT_ARCHIVE.md]

- **`editor-re-parse-caps-a-merged-list`** (**NEW S421 Pass P — 1 carrier, FIXED `288af4a`**): ACTIVE, consequence-critical (a sync carries the cut list to the account); never retires. A list the sync merges uncapped is re-parsed by its tool's editor or restore path through the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`install-banner-over-a-sheet's-bottom-controls`** (**NEW S420 Pass N — the hub FIXED `f44a17e`, a CSS state hiding it while the sheet is open; 6 other sheet pages unmeasured**): ACTIVE, streak 0. pwa.js's `#pwaInstallBanner` (fixed, bottom, z 2147483000, phones under 768px) …[full text: IMPROVEMENT_ARCHIVE.md]

- **`flash-restores-captured-text-not-its-key`** (NEW S417 — 2 FIXED `1f7f869`; S415 `38e5b62`): ACTIVE, streak 0. A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash. Detection: `orig = (btn|lbl)\.(textContent|innerHTML)` + …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`visible-label-missing-from-the-accessible-name`** (S415–S425: 4 fixes; **S427 the dictionary's Word Lists windows `ee5f6f2`**): ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 `c427/probe-dlgname.mjs`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`designed-key-miss-probed-through-t`** (NEW S415; FM `gName()` FIXED `95d5f46`): ACTIVE, streak 1 (S416: 0 on the delta). Detection: `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.has`.

- **`pinned-english-without-lang`** (NEW S415; 20 FIXED `f4bbfe8`; S422 resources ×43 `8c56a89`; torah/trope open): ACTIVE, streak 0 (S416 `a416/pinned.mjs`: only those). Detection: HE UI, `closest('[lang]')` of each pinned-English element = "en"; control: a planted span …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`toggle-name-flips-with-its-pressed-state`** (NEW S414 `f9e67b2`; S416 trope tune `96275c2`; S430 found torah's Trope staff Tune all + every verse Tune; **S431 FIXED `aa97e2e`**): ACTIVE, streak 0 (last swept S430). Detection `f414/toggles2.mjs`: real click per …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`author-display-defeats-the-hidden-attribute`** (S414 `391114b`; S416 FM `3bf0112`; S425 trope ×2; **S430 torah ×2 `136cf30`**): ACTIVE, streak 0. Detection: rendered `[hidden]` with display ≠ none (S430 `a430/hiddenrec.mjs`: every `hidden` write + a flex plant) …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`button-group-label-not-programmatic`** (**NEW S413 Pass C — resources ×8 rows FIXED `945b397`; generator, dictionary, hub unmeasured (no `role="group"` at all)**): ACTIVE, streak 0. A row of `aria-pressed` buttons sits under a visible label (a `<span>`, or a `<label>` with …[full text: IMPROVEMENT_ARCHIVE.md]

- **`settings-lost-across-a-load`** (**NEW S412 Pass H — flash ×2 FIXED `51e8f3c`, `abb0a1e`; 1 P4 open**): ACTIVE, streak 0. A stored setting comes back changed after a reload because the load path rewrites it. Detection (`h412/v1.mjs`): set each mode / enum control by a real …[full text: IMPROVEMENT_ARCHIVE.md]

- **`live-region-display-none-while-empty`** (S408; **all 4 FIXED `efbc98a` S409**): ACTIVE, streak 0. Detection: `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit); flex-wrap rows need `position:absolute`, not height.

- **`dark-base-rule-outranks-variant`** (S408; FIXED `4a5d353`, `b26f7d6`; EXEMPT the dead `.preset-item.drag-over` ×2): ACTIVE, streak 0. Detection: `m408/darkvariant.py` (comments stripped), then drive the state by a real click in both themes.

- **`aria-disabled-lock-no-handler-checks`** (**NEW, registered 2026-09-23 (S407 Pass P) — 1 carrier, fixed `e5c4784`**): ACTIVE, clean streak 0. A control marked busy or invalid by `aria-disabled="true"` whose activation handler never reads that state: the look says locked, a …[full text: IMPROVEMENT_ARCHIVE.md]

- **`text-field-under-16px-zooms-on-ios-focus`** (**NEW S406 Pass N — S408: the sign-in menu's 2 FIXED `0cd524c`; S420: the hub's backup box FIXED `b9ea89f` (16px under `(pointer:coarse)`, the desktop box unchanged); the switcher `<select>` (12.48px on 14 pages, js/i18n.js — …[full text: IMPROVEMENT_ARCHIVE.md]

- **`textContent-rewrite-erases-a-control-icon`** (S405; 7 writers FIXED `1e8991f`; "Copied!" flashes: dictionary `53d3579`, flash ×2 `38e5b62` S415): ACTIVE, streak 2 (S416; S430 torah + trope, a plant −1). Detection: (a) EN→HE→EN icon count; (b) key census vs whole-control …[full text: IMPROVEMENT_ARCHIVE.md]

- **`translated-key-exists-page-hardcodes-english`** (S420: flash "Untitled list" `73554ab`, the S405 census' LAST carrier — 0 known open; S419: FM `whoHasCp` `58a04a2` + torah licence labels `e3700cc`; S416 trope `3331a54`; registered S405 Pass K — flash `0a420fc`, generator …[full text: IMPROVEMENT_ARCHIVE.md]

- **`per-page-code-inside-a-shared-block`** (**NEW, registered 2026-09-22 (S403 Pass E) — 2 carriers, both fixed `6e28af3`**): ACTIVE, clean streak 1 (S416). Page code pasted INSIDE a `═══` block instead of below its end …[full text: IMPROVEMENT_ARCHIVE.md]

- **`icon-markup-into-a-textContent-writer`** (**NEW, registered 2026-09-22 (S403 Pass E) — 1 carrier (2 buttons), fixed `7552ba0`**): ACTIVE, clean streak 0. An `ICON_*`/`FT_ICON_*`/`HK_ICON` SVG const reaches a helper that writes `textContent`, so the button prints its SVG …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`physical-property-that-never-mirrors`** (**NEW, registered 2026-09-16 (S388 Pass K) — the shape has now surfaced in THREE sessions (S248, S376, S388), which is what makes it recurring rather than incidental**): ACTIVE. **S422: 2 torah carriers open (`.tt-jump-pos`, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S379: a SCALAR sibling FIXED (`4f9a2e7`, the shared `.ivrit` engine's `setIvritMode` normalises an unknown stored mode on 4 carriers; the hub's AllTools import validates it); the I corrupt-key arm (52 cells + 8 controls) …[full text: IMPROVEMENT_ARCHIVE.md]

- **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED, so every later load rethrows — never retires). **S387: the axis swept to completion across ALL FOUR `.ivrit` engine carriers — 254 cells through the real restore path …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S392 (Pass G, `hebrew_blend_generator.html`): swept CLEAN — first clean sweep since registration, clean streak 0 → 1.** 36 print-media cells (18 printable shapes × EN light / HE dark, at the 749px Letter content …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (consequence-critical: it manufactures false assurance — never retires). **THREE MORE ARTIFACTS at 2026-09-15 (S385 Pass A), all caught before a verdict, and two of them false POSITIVES rather than false cleans — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`light-literal-text-on-the-gold-token`** (registered 2026-09-17 (S396)): ACTIVE — **S399 (Pass A), FIRST real sweep: 7 NEW carriers, all on `hebrew_dictionary.html`, all fixed `273f449`; clean streak stays 0.** `color:#fff` (or another light literal) painted on `var(--gold)` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S429: `.wm-mini` FIXED `359e0e2`; the emoji ▾ open.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**REOPENED S413 Pass C — a 3rd carrier the CSS grep could not see: contact's script-written success line, `var(--gold)` 2.75:1 on light, FIXED `f40d142`; open: the generator's `sub.style.color` (A's)**): ACTIVE, streak 0. …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S374: the 4 S371 carriers FIXED (`31a84f7` torah `karaokeRate`/`ttsRate`; `5d1d13a` trope `hebFontSize`/`playbackRate`) via `_sliderNum` at `loadSettings`; open hits 0, clean streak 0.** Shape: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (**NEW, registered 2026-08-28 (S277 Pass M) from S276's `15684a6` + S277's `eb4ce00`/`f70d500` — three carriers of one shape inside two sessions**): deliberately-untranslated English PROSE (attribution credits, directory data, @handles …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value**: ACTIVE, clean streak 0. **S432 (8th sweep, `l432/fallback.py`: 2,614 sites incl. 73 `data-i18n-html` — S430's had no html arm): 2 hits, trope `trope.learn.intro` (NEW) + torah's tip (S430's), FIXED `8938513`; 5 plants fire, 1 …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **mobile-input-hints** (a text field for Hebrew, names, numbers or codes shipping without `inputmode`/`autocapitalize`/`autocorrect`/`spellcheck` fitting its content) | **ACTIVE — UN-RETIRED S411** (retired S343; the S267 row is in the archive): account.html's `#nameInput` …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n cross-column parity (placeholders, plurals, inline markup)**: **re-swept 2026-09-03 (S320 Pass K, detector 1 only): `{placeholder}` sets en vs he over 5,128 keys, raw 30 → hits: 0 — all thirty are the S261-refuted `.one` plural shape (Hebrew spells the singular number; …[full text: IMPROVEMENT_ARCHIVE.md]

- **horizontal-overflow-at-narrow-widths**: **re-swept 2026-09-03 (S334 Pass N, `torah_trainer.html`, 12 real-descriptor loads × 10 views incl. the S324 presentation toolbar) — hits: 1, the clipped-not-scrolled variant (`.tt-fs-plate` 340px in a 320px viewport, −10..330, A− and …[full text: IMPROVEMENT_ARCHIVE.md]

- **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-inverted-by-a-hover-or-active-state**: **S368 (Pass C, Font Maker at RUNTIME, 26/23 controls × 2 themes, real mouse + 420 ms): 1 hit FIXED (`6549b60` `.fld-help` hover 2.75 / 2.14 → 6.22 / 6.92:1); the disabled undo/redo pair (opacity 0.45) is exempt — inactive …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-below-AA-on-a-tinted-or-coloured-plate**: **S422: torah's vowel Letter on the trope tint FIXED `e55b811` (1.85:1; streak 0).** **re-swept 2026-08-23 (S249 Pass M, `flash_cards.html` — card front AND back, results screen, and setup screen with every …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire …[full text: IMPROVEMENT_ARCHIVE.md]

- **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the …[full text: IMPROVEMENT_ARCHIVE.md]

- **decorative-glyph-carrier-exposed-to-assistive-tech** (**2nd instance fixed 2026-08-15, S219, c2399f1 — Font Maker QA column heads**. That instance sharpened the pattern in a way every future sweep needs: **`aria-label` on the element is NOT a fix for this class.** The FM …[full text: IMPROVEMENT_ARCHIVE.md]

- **error-status-clobbered-by-a-later-routine-write** (**NEW, registered S199**; **S411: +1 carrier FIXED `25d2277`** — FM `fmCloudOpen`'s missing-photo notice, replaced by "Opened from your account" in ~40 ms): a status/live-region line that correctly reports a FAILURE is then …[full text: IMPROVEMENT_ARCHIVE.md]

- **content-dependent-tour-step-miscounts-the-tour** (**NEW, registered S197**): a guided-tour step whose `target()` only exists once remote/corpus content has rendered. The engines all skip an unresolvable step **silently by design** ("skip gracefully when hidden"), but the …[full text: IMPROVEMENT_ARCHIVE.md]

- **per-sample-repaint-of-an-O(n)-live-preview** (**NEW, registered S196**): a continuous gesture — `pointermove`, a slider drag — that rebuilds an **O(n) preview from its whole accumulated buffer once per input SAMPLE** rather than once per animation frame, so the gesture is …[full text: IMPROVEMENT_ARCHIVE.md]

- **false-positive-validator-on-the-app's-own-content** (**NEW, registered S194**): a QA/lint/warning rule whose **detector is broader than the failure it warns about**, so it fires on artwork or data the app itself ships — the user cannot act on it, cannot clear it, and it is …[full text: IMPROVEMENT_ARCHIVE.md]

- **JSON-LD ↔ visible-content parity** (UN-RETIRED S190; owned by L): ACTIVE, streak 0. **S432: 1 hit, shape (b) — torah FAQ a6 and its visible twin (EN + HE) said the week comes from Sefaria's calendar; FIXED `3cdc95e` (gate 2), byte parity. Arm: `l432/claims.py` (control …[full text: IMPROVEMENT_ARCHIVE.md]

- **wired-then-clobbered label** **S371 (Pass A): +1 carrier FIXED `e4c8d75` — the generator's `#headerSub` (`data-i18n` page subtitle) overwritten by `setBlendType`'s four English literals on every practice-type click; now four CSV keys. Static census: 6 `data-i18n` ids written …[full text: IMPROVEMENT_ARCHIVE.md]

- **theme-flipping-token-on-a-fixed-colour-plate** (NEW, registered S191): a control or text node styled with a colour token that **inverts with the theme** — `var(--text)`, `var(--white)`, `var(--muted)` — placed inside a container painted a **fixed** colour that does not …[full text: IMPROVEMENT_ARCHIVE.md]

- **two-state-ready-flag-for-a-three-state-load** (NEW, registered S189): a lazily-fetched corpus or module whose UI decides what to render from a single truthiness check — `REAL_WORDS.length`, `EMOJI_DATA`, `_wordsReady`. **That flag has two states; the fetch has three** (never …[full text: IMPROVEMENT_ARCHIVE.md]

- **invalid-SVG-geometry-from-an-unclamped-difference** (NEW, registered S187): an SVG `width`/`height` computed as the difference of two mapped coordinates (`fx(b) - fx(a)`, `x1 - x0`) where one side comes from a **derived** value that can legitimately go negative — so the …[full text: IMPROVEMENT_ARCHIVE.md]

- **RTL-inheritance-on-a-Latin-script-container**: **re-swept 2026-08-29 (S290 iter 4, `hebrew_dictionary.html` word cards) — hits: 1 carrier (`.wc-transl` + `.wc-translit`), fixed `21538fc`; clean streak: 0 — ACTIVE.** **4th carrier of the shape registered at S185, and the …[full text: IMPROVEMENT_ARCHIVE.md]

- **silent-external-media-failure** (an `<audio>`/`<video>`/media element pointed at a third-party host with play/pause/ended handlers wired but **no `error` handler**, so a blocked or dead origin produces silence while the controls still show a live playing state. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **print-trailing-dead-space** (padding/margin BELOW the last line of a print flow — page-container bottom padding, a scroll wrapper's, the last block's own margin — which paginates exactly like content, so a document ending near a page boundary pushes empty box onto a sheet of …[full text: IMPROVEMENT_ARCHIVE.md]

- **lazily-loaded-dependency-renders-an-empty-shell** (S416: +1 open, trope HH) (a feature whose data comes from a lazily-loaded external module keeps rendering its full chrome — column, header, row label, legend — when the module never arrives, so …[full text: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **print-media-leak / var-chain-overridden-by-a-literal** (a screen-only `@media (max-width:N)` block whose declarations also apply to PAPER — print media has a width too — or, more generally, a literal `font-size`/colour declaration that out-specifies a `var(--x)` chain the …[full text: IMPROVEMENT_ARCHIVE.md]

- **incomplete-print-token-reset** (a `@media print` dark-token re-statement that restates SOME of the theme tokens the dark block overrides but not all — the missing ones keep their dark values on paper. Detection: diff the token list inside the print block's `html.dark-early …[full text: IMPROVEMENT_ARCHIVE.md]

- **referenced-but-unauthored i18n key** (a key the code LOOKS UP that does not exist in the CSV — the exact inverse of `authored-but-unreferenced`. The user sees the English fallback, so nothing looks broken, but every render logs an `[i18n] missing key` warning, and those …[full text: IMPROVEMENT_ARCHIVE.md]

- **untrusted-shape-on-read** (a store that arrives from an imported `.ivrit` / AllTools file — hand-editable text — is read back with its SHAPE assumed: `results.map`, `(r.cards||[]).forEach`, `results.slice().reverse()`. A `null` entry, a non-array `results`, or a non-array …[full text: IMPROVEMENT_ARCHIVE.md]

- **blocking-alert-for-a-routine-path**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `alert(` sites (the hub's erase gate is a dialog; its final `confirm()` is a destructive guard) — hits 0, clean streak 2.** S343: dashboard 77-control click census, 0 alerts. …[full text: IMPROVEMENT_ARCHIVE.md]

- **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a …[full text: IMPROVEMENT_ARCHIVE.md]

- **parse-per-call on a growing store** (a `read<Store>()` helper that re-parses its whole localStorage blob on every call, called O(n) times per render, over a store that grows without bound as the teacher uses the tool — so the tool punishes use, and the cost is invisible at …[full text: IMPROVEMENT_ARCHIVE.md]

- **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S365: 1 hit FIXED (`772068b`, `trope.learn.no_example` + `trope.learn.examples_unavailable` — `renderLearn` passed the raw English; Geresh Muqdam has no chanted example, so the Hebrew UI …[full text: IMPROVEMENT_ARCHIVE.md]

- **`browser-locale-date-in-a-localized-sentence`** **S371 (Pass A): 0 `toLocale(Date|Time)String(undefined` in the corpus — hits 0, clean streak 1.** (`toLocaleDateString(undefined, …)` inside a translated sentence or row): **all 3 carriers FIXED — hub `f8b716b`, flash …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **sub-floor touch target on a shared small-button class** (registered S193; **S410 FIXED the hub's inline-styled My Fonts row `ee38b98`, 6 buttons 24 → 30px — S236's class-less sub-shape**): a small-control class — `.btn-xs` and its kin — whose size comes from `padding` …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero: swept 2026-07-17 (S93), hits: 0 (the dashboard movable-panels feature 639fcf8/53e50fc uses array-order `panelLayout` with no numeric restores; zone reorder is array-index splicing; its guards use `=== undefined`, not `||`), clean streak: **3 → RETIRED S93** (3 …[full text: IMPROVEMENT_ARCHIVE.md]

- localStorage-vs-AllTools: ACTIVE (consequence-critical: backup completeness, never retires). **Re-swept 2026-09-09 (S357 Pass A, delta-only): 1 new key, `hebrewBlender_lastBackupAt` (S347) — in `eraseAllSettings` with a written per-device reason, export-exempt by design — hits …[full text: IMPROVEMENT_ARCHIVE.md]

- unescaped-input / unsafe-parse: **re-swept 2026-07-25 (S158), hits: 0** (`0dc1e50..HEAD` — **0 new `innerHTML`/`insertAdjacentHTML`/`outerHTML`, 0 new `JSON.parse`/`Object.assign`, 0 new `fetch`/`setAttribute('href'|'src'|'on*')`**. Tightened beyond added-sink-lines to catch …[full text: IMPROVEMENT_ARCHIVE.md]

- destructive-bulk: **re-swept 2026-08-28 (S272 Pass A, delta `b2f455b..HEAD`), hits: 0** (zero new loops write stored per-item data; the S268 calendar import writes cells only through its preview+confirm flow, the S269 purge is confirm-guarded and deletes only the legacy rows …[full text: IMPROVEMENT_ARCHIVE.md]

- **ivrit-gather-gap** — **3rd fix landed 2026-08-06 (S185)**: flash_cards' `hebrewFlashCards_pbStreak`, absent from BOTH of the tool's save paths and from `apply()`, now round-trips with AllTools' max rule (94d1222). The class's remaining known surface is clean. Original …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **symbol-only accessible name** (an icon-only control whose ENTIRE accessible name is a glyph with no letter or digit — "×", "↺", "✕", "⬛", an emoji run — because for `button`/`a`/`role=button` the ACCNAME chain takes **name-from-content BEFORE `title`**, so a correct …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- nameless-adjacent-text-labeled control (a visible interactive control — toggle switch, slider, number field, select, colour well — whose only label is **adjacent text** that is never programmatically associated, so it has NO accessible name; the wrapping `<label …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- dead-feature-guard (a `typeof X === 'function'` / feature-detection guard whose **preferred** implementation does not exist on that page, so the guarded branch can never run and control silently falls through to a worse path — or to nothing): **re-swept 2026-07-25 (S158, Pass …[full text: IMPROVEMENT_ARCHIVE.md]

- **modal-focus-trap** (**S426: HIT — the account screen (gone since the account cleanup; the layer's dialogs are now the name step and the device-extras card), js/ivrit-saves.js, which the S179 sweep predates; FIXED `91c45d6`; streak 0**) …[full text: IMPROVEMENT_ARCHIVE.md]

- pre-ready-i18n / never-re-rendered — **4th instance fixed 2026-08-06 (S185)**: torah_trainer's TTS voice readout, which `applyI18n` had never re-run (30fe852). **Fix-shape note for the next instance: adding the function to `applyI18n` is only half the fix.** If the pre-ready …[full text: IMPROVEMENT_ARCHIVE.md]

- _**Retirement rule (as applied):** a pattern retires after 3 consecutive clean sweeps **UNLESS it is consequence-critical** (security or data-loss). The three that hit 3-clean at S64 — unescaped-input/unsafe-parse (XSS), localStorage-vs-AllTools (backup), destructive-bulk …[full text: IMPROVEMENT_ARCHIVE.md]

- **placeholder-as-only-accessible-name** (a text input/textarea whose ONLY name source is its `placeholder` — no `aria-label`, `aria-labelledby`, `label[for]`, wrapping `<label>` or `title`. Under ACCNAME `placeholder` is the last-resort source, so the name is announced on an …[full text: IMPROVEMENT_ARCHIVE.md]

### Retired patterns

- **`synced-key-wiped-without-forgetRow`**: RETIRED 2026-09-30 (the account cleanup, outside the loop — not a clean streak). Shape: a reset wiping a synced key without `forgetRow`, so the wiped copy read "newer here" and offered an account-wide reset. `forgetRow` and the panels are gone: signed in, resets and deletes write through by design, and the guard is the confirm (the `*_cloud` keys while `hasStoredSession()`), which pass P arm 4 now checks. Un-retires only if a memory-forgetting path returns.

- **`uncompressed-jspdf-raster`**: RETIRED 2026-09-10 (S371 Pass A, clean streak 3: S343, S357, S371 — 0 new `addImage(` sites, 3/3 carry `'FAST'`). Shape: a jsPDF `addImage(...)` with no `compression` argument stores the raster raw (~11 MB per Letter page); S337 fixed 2 (`e0caf12`), S338 the 3rd (`5b55d19`). Detection: `grep -n "addImage(" *.html` and read the argument list; verify by the PDF's `FlateDecode` streams. Un-retires on any new `addImage(` without `'FAST'` (A2 spot-check).

- **`custom-property-written-on-documentElement-per-frame`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 5 new `setProperty('--heb-font'` writers are one-shot). Shape: a per-frame writer sets a root custom property. Detection: `grep -n 'documentElement.style.setProperty' *.html`, keep writers on a drag/slider/rAF path. Fix: write on the consumers' nearest ancestor. An A2 hit un-retires.

- **`dark-hover-resolves-to-the-rest-colour`**: RETIRED 2026-09-09 (S357 Pass A, clean streak 3: S330, S343, S357 — the delta's 17 new `:hover` rules all measured with feedback). Shape: a `:hover` that resolves to the rest background in the OTHER theme (dark `--warm-gray` = dark `--white`). Detection: `warm-gray` hover rules minus those with a `body.dark X:hover` twin, confirmed by a real dark hover. Fix shape: `body.dark X:hover{background:#2a3349;}`. An A2 hit un-retires.

- elevation-cue-doubled-or-dead (a box-shadow that doubles a border cue, or resolves invisible in the theme it is used in) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: last hits S311 (14 in the FM help popup, `0c86195`/`88f4940`), then clean S317, S330, S343 (the delta's one new shadow, dictionary `.sidebar-toggle-btn`, is `border:none` + the generator twin's ratified shape). Detector caveat stands: the Impeccable rule id is unreliable as a counter and its threshold is exactly 16px. Re-checked only in Pass A2 / O.

- sibling-page-missing-a-shared-declaration (a chrome/tool page lacking a rule or meta its siblings all carry) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: 3 hits S304 (`e093389`), then clean S317, S330, S343 (`og:locale` on 12/12 indexable pages, the `summary:hover` idiom on all 8 `<details>` pages; `resources.html` remains a deliberate compact chrome). Detection: census the declaration across every sibling, then diff. Re-checked only in Pass A2 / E.

- panel-collapse-writer-mismatch (a `.collapsed` writer that skips `panelMemSave()`, or a panel title without the `data-i18n` key the memory is keyed by) | retired 2026-09-08 (S343) | 3 consecutive clean sweeps: first swept S303 (Pass N), then clean S317, S330, S343 (0 `.collapsed` writers added since S303). Detection: `grep -n "classList.add('collapsed')"` (and `.toggle`/`.remove`) over the six carriers, read each writer for the save call. Re-checked only in Pass A2.

- invisible-rebuild-on-a-hot-render-path (a render entry point rebuilding a container that is hidden by default under the DEFAULT view, with cost that scales with data) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: carrier fixed FM `renderSpacingPanel`/`renderKerningSection` (`fa1f88f`), then clean S299, S317, S330 (the S317→S330 delta adds no `innerHTML` writer; torah `buildPrintBand` is bounded by `TROPE_COLOR_DEFS`). Detection kept for A2: list the containers the hot renderer writes, check each at runtime with `offsetParent !== …[full text: IMPROVEMENT_ARCHIVE.md]

- var()-on-an-undefined-custom-property (a `var(--x)` with no fallback whose token is declared nowhere on that page) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: last hit `hebrew_dictionary` `--navy-deep` (`5e9a6d2`, S285), then clean S299, S317, S330 (the 14 `var()` references added since S317 — `--gold-text`, `--navy`, `--text`, `--white`, `--border` — all declared on their pages). Detection kept for A2: per file, diff `--token:` declarations + `setProperty('--token'` literals against fallback-less `var(--token)` references, …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a wrong restored value, not data-loss) → not a consequence-critical carve-out → auto-retired. Re-checked only in Pass A2. **Watch:** any new tool with numeric/boolean …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()` in `shortcutGroups()` and `pwa.js`'s self-contained `t(key,fallback)` are intentional in-scope locals, never reach a global-`t` call site). Correctness-scoped, not …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- listener/interval accumulation (a `setInterval`/`setTimeout`/`addEventListener` attached repeatedly without clear/remove) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 over the S53–S63 surface — generator chunked-build timer single/self-chaining + `cancelWorksheetBuild` clears on re-entry, `beforeprint` attached once, torah color fns add no listeners, `_appToastTimer` clear-guarded). Structural/perf-scoped → auto-retired. Re-checked only in Pass A2.

- workMode/step reachability (controls reachable in only one workMode/step while the workflow steers users past it) | retired 2026-07-10 (S52) | 3 consecutive clean sweeps (S36, S41-scoped, S52 — trope_tutor's drawer/tabs/tour-skip/mid-drill-return all reachable-by-design). Re-checked only in Pass A2.

- undo-wiring (Font Maker: `markDirty()` without `udDo`/`udBurstBegin`/`udNudgeTick`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; the S25–26 keyboard additions (node-insert, crop) verified as routing through `udDo` or deliberately non-undoable. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the un-swept FM v3.9–v4.2 additions (auto-detect Apply via `udDo(...withSource)`, pen contour, node delete/paste/transform/specks/fillet all `udDo`; `_hiddenContours`/opacity/snapGuides are documented view-only).

- slider-commit (Font Maker: `oninput` range sliders lacking `onchange="udBurstCommit()"`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; every project-data slider commits, and no new range slider has been added. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the FM v3.9–v4.2 sliders (fillet `filletLiveInput`/`filletCommit` burst; size setters commit; mark-editor `meSetDotSize` uses its own `meBeginEdit`/`meCommitEdit` stack; `adSep`/`adTh` are detection-only until Apply).

## Recurring-pattern sweep status

- _(history)_ **The per-sweep result rows (S141–S357, 83 rows) moved verbatim to `docs/IMPROVEMENT_ARCHIVE.md` in S361 ("Sweep-status rows moved out of the ledger"); the current state of every pattern lives in Pattern health above.** Grep …[full text: IMPROVEMENT_ARCHIVE.md]

### Discovery-pass rotation (run one per session, stalest first)

- P accounts & cloud (one surface): 2026-09-25 (**S421 — 4th P, first since S407; stalest runnable (O blocked). Surface: the dashboard's own wiring, the first P on one tool page. 8 arms + 9 fake-cloud scenarios + 17 static checks, every zero controlled. FOUND + FIXED: a merged 65-name class cut to 60 by one edit and carried to the account (P2, `288af4a`, NEW pattern); a cloud-only class/word list …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html`. ⚑ BLOCKED HERE TWICE (S399, S403) — NOT "needs an attended session". Clone + the 4 parsers install fine; EXECUTING the detector is refused by the sandbox's auto-mode classifier ("Code from External"), and the refusal names the remedy: the maintainer adds a Bash permission rule for the detector (or …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-25 (**S420 — 19th N, `index.html`, its 2nd (S249 → S420). 16 cells on real descriptors (SE 320, i13 390 + landscape 750, Pixel 7 412 × EN/HE × light/dark) × 14 views; 7 arms, every tap real, the hover scan behind a 2/2 plant, the banner probe behind a standalone control. Arms 1/2/3/6 clean; FOUND: the banner over the sheet's Erase (P3, `f44a17e`), …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-27 (**S422 — 19th M, `torah_trainer.html`, its FIRST: the coverage row's "no M" list, and changed outside the loop since S421. 16 cells × 6 views (48 loads) in the real web fonts, Sefaria stubbed from the repo's MAM phrases, the chant from a WAV, transliteration bundled from npm; 38,480 contrast rows behind 8 plants; 0 pageerrors. FOUND: vowel …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-25 (**S419 — 28th K, first since S405 (14 sessions); stalest runnable (O blocked). Delta `14c185d..HEAD`: 89 commits, i18n surface 21 files +1,718/−831, CSV +54/−7. Gates A–E clean, 7 plants fire every class. 9 arms, every zero controlled; 28 runtime cells clean. FOUND 0 new; 2 S405 carriers fixed (`58a04a2`, `e3700cc`); the 6-key prune `6ffce11`; census 196 …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-28 (**S427 — `hebrew_dictionary.html`, first since S285. Census, Tab walks, 13 scenarios, modes, dialogs; every zero controlled. FOUND 5 P3 + 4 P4; FIXED `7a631f6`, `ee5f6f2`. C-next: torah (S298).**)

- A recurring-pattern sweep: 2026-09-30 (**S430 — 34th A: the delta `a907bf1..99f9fa5` + S416→now; 14 arms, every zero controlled, Hebcal as oracle. FOUND P2, P3 ×2, 4 stale fallbacks, NEW pattern ×4, 3 P4s; FIXED 3.**)

- G print & export fidelity (one tool): 2026-09-27 (**S423 — `flash_cards.html`, its 4th G (S159 → S219 → S279 → S423), over 80 commits since. 8 arms, every zero behind a control: a census of every printable card (13,081 words, 275 emoji, 26 colours, 0–9999) at 4 paper widths, 9 sheet PDFs (duplex 84/84), 20 report + 16 certificate PDFs, plain print, the .ivrit Replace round trip 6/6, share links …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-28 (**S424 — `torah_trainer.html`, its 4th D (S184/185 → S307 → S424), 71 commits since. A full-parsha stub (146 verses / 2,117 words), 15 cold cells, 21 interactions at 1× and 4×, chant + pitch, idle, heap after GC; the S307-era and pre-S422 pages as controls. FOUND + FIXED: Chant all never started or advanced over a whole parsha (P1, `50d48bd`), every …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-28 (**S425 — 32nd run, first since S411; the stalest runnable pass (O blocked). Delta `3bb0567..HEAD`: 116 commits, the trope Phrases tab, torah's pitch/under-word/link settings and the dashboard's Intermission landing outside the loop. Gates clean on 34 virgin cells behind 7 plants; census = S411's; 0 SDK/project requests (plant counted); tours 7/7 (plant …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-29 (**S429 — 33rd B. 136 loads, 68 interactions, 12 delta scenarios, all controlled: 0 pageerrors. FOUND the trope tabs' overflow (P3, `3b0bebd`) + 2 forgetful panels (P4).**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-30 (**S432 — 22nd L (S418 → 121 commits). 21 audit arms, 2,614 fallback sites, claims + a manual read; every zero controlled. FOUND 2 fallbacks, torah FAQ a6, trope's tour, terms' Hebcal, 2 gate-2 lines; FIXED 4.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-09-28 (**S426 — `account.html`, its FIRST H. 6 lessons by real clicks on a fake cloud + the pinned SDK, EN 1280 + HE dark 800. FOUND 7 + 1 seed; FIXED `e091820`, `91c45d6`, `ffef51d`. H-next: the dictionary (S292).**)

- E freshness/site-health: 2026-09-30 (**S431 — 34th E, first since S417 (127 commits). 17 arms, every zero controlled. FOUND 4 (Hebcal data uncredited, README map, CSP/smoke doc claims, 2 comments); FIXED 3.**)

- F cross-tool consistency: 2026-09-29 (**S428 — the copy contract: 13 controls × direct / LMS frame / planted double failure, every zero controlled. FOUND 3 claiming over the old clipboard (P3, FIXED `bbd5f65`, `0d2a941`), 9 ignoring execCommand (2 fixed), 4 unannounced.**)

**Next session (S433):** **BRANCH/PR: S430–S432 on `claude/improve-loop-s430` → draft PR #293 (base `99f9fa5`). Open → CONTINUE; merged → restart from `origin/main`.** Closed at `sw.js` **v889**, FM **5.56**, SDK **2.116.0**; backend unchanged (keep-alive #17); email template `Live?` = no.

**⚑ STALEST PASS: O (S346 — BLOCKED, no permission rule), K (S419), then N P M G D I H C F B A E L.** Take **K**.

**⚑ STRONGEST UNTAKEN:** first torah's Trope-staff copy (APPROVED, wording in its Candidate). P4s: tip-name ×4, Try again, inner-span panels, 7 copy carriers, torah's 2 Sefaria comments, the hub's og (gate 2); "Aliyah" is the maintainer's call. **Seed bench: 30.**

**⚑ HARNESS: traps 1–217 in loop-findings** (`l432/`, `a430/`; `--sdk` = `npm pack @supabase/supabase-js@2.116.0`); compaction once (trap 140); the old handoff and the oldest Done move by hand.
