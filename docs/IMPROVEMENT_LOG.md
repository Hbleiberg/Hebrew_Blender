# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P3 (**NEW S400 re-check**) | trope_tutor.html | **After "Study →" the results screen is gone.** `setMode('drill')` re-shows the start screen whenever no session is active, so a student who studies one missed mark and returns to the Drill tab finds neither the score nor "Drill these marks" — measured: `_lastMissed` still holds the marks, `#drillResults` hidden, the button unreachable. Fix …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S398 Pass B — REPLACES the S397 flash-cards line and CORRECTS its trope verdict; measured on the RENDERED outline, not the static DOM**) | flash_cards.html, Hebrew_Font_Maker.html, trope_tutor.html | **Three pages skip a heading level for a reason the tour card is not.** Rendered at load: flash `h1,h3×8` and FM `h1,h3×16` both jump 1→3 (their h3s are panel/modal titles, all …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S396 Pass C — filed rather than fixed BECAUSE it cannot be measured in this harness; do not ship it on an assertion**) | account.html | **`#holdsList` carries `list-style:none`, which is the shape that makes WebKit/VoiceOver drop a list's semantics** (the count and the "list" role), leaving the account's holdings as loose text. The nested `.holds-kinds` / `.holds-names` keep their …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S394 census, retuned S395 — `04892f3` took the three SHADOWED ones that were accidents; what is left here is judgement, not dead code**) | hebrew_blend_generator.html | **The `.bingo-card-num` / `.bingo-grid` IDENTICAL twins and the `.bingo-card` SHADOWED one sit inside a deliberate later layer that re-declares the bingo shapes in print-safe literals, and `body.dark …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S394 — the non-generator half of the same census; all DIVERGENT, i.e. the earlier rule still contributes, so each needs reading rather than deleting**) | Hebrew_Font_Maker.html, classroom_dashboard.html, hebrew_dictionary.html, privacy.html, terms.html | **5 selectors declared twice with overlapping properties: FM `#fsPanelsBtn`; dashboard `textarea` and `.fr-tour`; dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — BACKEND BOUNDARY: changing it needs a redeploy, so maintainer work, not a loop fix**) | db/functions/delete-account/index.ts | **The production Edge Function's `ALLOWED_ORIGINS` still carries `http://localhost:8080` and `http://127.0.0.1:8080` beside the two real origins.** Low risk (a web attacker cannot forge `Origin`, and the JWT is the real gate), but it is dev …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — a real gap, shippable, but it is a new control + copy so it was not taken unattended-of-gate-1**) | js/ivrit-account.js + account.html | **`signOut({ scope: 'local' })` ends the session on this device only and no UI offers "sign out everywhere", so a teacher who loses a school laptop cannot revoke that device.** Supabase supports `scope: 'global'`; the shape is one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S388 Pass K RTL arm — MEASURED and deliberately logged, not shipped; the third session to adjudicate this shape the same way (S248 `#fsExitBtn`, S376 `.pick-close`)**) | classroom_dashboard.html | **`.dash-edit-pencil` is pinned `top:4px; right:4px` and does not mirror — logical start-offset 520px in `en`, 4px in `he`, the physical right corner in both.** Held back because the …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [x] 2026-09-17 | (S400 close-out) | branch/deploy note | **S400 was a feature-seeds session, not a pass: three Trope Tutor seeds pushed STRAIGHT TO MAIN (`4ce56bb` `3249dba` `c57eb53` + `ee2d5f4` llms-full regen), each Pages run green — run 1238 for `ee2d5f4` is the deploy; `sw.js` v776→v777; this close-out was written afterwards (2026-09-18) on `claude/improveloop-feature-seeds-3tczsw` / draft PR #250 (a …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `c57eb53` | trope_tutor.html + CSV | **Missed rows and mastery cells open the mark's Learn card — shipped (S400, seed S367).** `openLearnFor(key)`: cards gain `data-key`; switches family, renders, scrolls, focuses and flashes `.pulse-attn`; marks the family visited on purpose. "Study →" per review row; `.tu-mcell` is a real `<button>` on both grids (+26 Tab stops, deliberate). …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `3249dba` | trope_tutor.html + CSV | **"Drill these marks" on the results screen — shipped (S400, seed S367).** `_missedPool` is a one-session answer-pool override consumed on `startDrill()`'s first line, before any bail can leak it; the button sits inside `#resReview`, so a clean sweep hides it with the list; no storage key, nothing synced. | verified: the commit's …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `4ce56bb` | trope_tutor.html + CSV + reference | **Drill length 5 / 10 / 20 — shipped (S400, seed S367).** `drillLength` in DEFAULTS, validated on every read like `drillScope`; `startDrill` reads it once; the heading is written by `updateDrillStart()` through `trope.drill.heading {n}`; `syncDrillSelects()` also closes reset never rebuilding the scope select; FAQ + JSON-LD name …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S399 close-out) | branch/deploy note | **S399 CONTINUED `claude/improve-loop-e8ak03` / PR #248 (read through the API: open, draft, unmerged, `mergeable_state` clean, base `ef75c79`, head `10a24f2`, 10 commits) — 4 fix commits + this close-out on top of S397–S398's 10; a human merges and confirms the Pages run.** **DRIFT: NONE a second consecutive session** — `origin/main` …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `9568ad3` | resources.html + CSV | **The suggestion form stops asking for a check that is not on screen** (S399, maintainer gate 2). With js.hcaptcha.com filtered no widget renders, yet Send still said "complete the 'I'm human' check"; that path now says what happened and offers the email the page's other failure branches already build. **`contact.html` was the model but NOT …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `ab491a7` | Hebrew_Font_Maker.html + CSV | **A blocked image builder stops being reported as a PDF problem** (S399, maintainer gate 2). Template sheets download as PNG or PDF; both refusals showed the PDF message, so a teacher behind a cdnjs filter asking for PNG was sent after the wrong library. The guard is unchanged — only the message it picks. New key …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `05341a7` | Hebrew_Font_Maker.html | **"Extract letters from a font" can be retried after the CDN blips** (S399 Pass A, P3). `ensureOpentype` memoised its loader promise and never cleared it on failure, so the rejection was cached for the tab's life and every later call re-threw WITHOUT re-requesting — while the modal said "check your internet connection". **Third loader of its …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `273f449` | hebrew_dictionary.html | **Seven gold buttons stop printing white on a light ground** (S399 Pass A). `--gold` is a LIGHT surface in BOTH themes: `.search-clear:hover`, `.fchip-x:hover`, `.wl-active-exit:hover`, `.empty .empty-btn:hover`, `.wm-close:hover`, `.dict-tool-btn.copied`, `.wm-act.copied` all measured **2.75:1 light / 2.14:1 dark** against a 4.5 floor. …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S399 Pass A iter 1) | 17 pages + the 4 `js/` modules | **32nd A, first since S385 (14 sessions), over the `eb53e8e..HEAD` delta: 18 files, 1,172 insertions. 6 arms, 5 clean with proven zeros, 1 arm found 7 carriers.** (1) `selector-declared-twice`: the S394 detector REBUILT from the loop-findings recipe (its scratchpad died with its container) and controlled against the …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S398 close-out) | branch/deploy note | **S398 CONTINUED on `claude/improve-loop-e8ak03` / PR #248 (open, unmerged, `mergeable_state` clean, 0 review threads, 0 CI runs — neither authored workflow's push paths match it and Pages runs only on `main`). DRIFT: NONE — `origin/main` still `ef75c79`, `sw.js` v774, FM 5.46, SDK 2.116.0, migrations 0001–0003 all `Live?` yes, …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `3f93c03` | hebrew_blend_generator, hebrew_dictionary, classroom_dashboard, torah_trainer | **The tour card's title `h4` → `h2` on the four carriers whose rendered outline skips** (maintainer-scoped in S397; flash cards, FM and trope keep their h4). CSS rule moved with it. | Outlines re-derived, not inherited: before generator/dashboard/torah `h1,h2,h4` and dictionary `h1,h4`; …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S398 Pass B iter 1) | 17 pages + the accounts layer | **31st B, first since S384 (14 sessions), aimed by the S398 handoff at the 313 outside-loop Font Maker lines no pass had loaded. 4 arms, 2 CLEAN with proven zeros, 2 real findings.** Arm 1 load census **extended to 17 pages** (the 14 + i18n-test + account-test + saves-test, which B's definition names and which no prior B …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S397 close-out) | branch/deploy note | **S397 cut a FRESH branch `claude/improve-loop-e8ak03` off latest `origin/main` (`ef75c79`) because PR #246 had MERGED (`dd6c6c5`) — never stack on merged history. 5 commits + this close-out; draft PR opened; a human merges and confirms the Pages run.** **DRIFT: YES, the first in six sessions** — `origin/main` `b304db0` → `ef75c79`: the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S397 Pass F iter 5) | the 7 tour carriers | **REFUTATION: the S354 "tour-card h4 skips two levels on all 7 tools" is wrong on 3 of its carriers, and a source grep is what made it look right.** DOM outlines: generator `h1,h2,h4`, dictionary `h1,h4`, dashboard `h1,h2,h4`, torah `h1,h2,h4` all **skip**; flash cards `h1,h3×8,h4`, Font Maker `h1,h3×16,h4×7` and trope `h1,h2,h3,h4` …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `bc6df0f` | 12 root pages + `locales/ui-strings.csv` | **Each page's skip link names where it goes** (S397, maintainer gate 2). The shared "Skip to main content" is replaced by twelve page-scoped keys using each page's own vocabulary — the shape torah/trope already had. A first CSV attempt re-sorted the whole file to place the rows and moved 1559 unrelated lines; reverted, rows …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `ecb9706` | Hebrew_Font_Maker.html | **Closing the onboarding wizard no longer drops the keyboard out of the page** (S397, P3). The wizard auto-opens, so `aOpenModal` records `opener = <body>`; on close the browser keeps the sequential-focus start at the hidden `#wizName`, which sits after the whole workspace, and the next Tab leaves the document. **The obvious fix — skip the …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `7e8b427` | hebrew_dictionary.html, classroom_dashboard.html | **The two projected classroom tools get a main landmark** (S397 Pass F, P3). 12 of 14 pages wrap content in `<main>` and index marks its hero `role="main"`; these two had **neither**, so this session's new skip link was landing on a plain `<div>`. Both now carry `role="main"` on the element the link already targets. …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `1348930` | 14 root pages | **Every page offers the same keyboard bypass of the header** (S397 Pass F, P4 — the pass's headline). Only torah and trope had one; chrome stops before the first content control were 6/6/6/5/4/3/3/3/3/3/2. The other twelve get the existing rule, each pointing at its own main element (`tabindex="-1"`). Two corrections while making it one rule: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | (S396 close-out) | branch/deploy note | **S396 CONTINUED `claude/loving-einstein-cdmbbz` (PR #246 open, unmerged, draft, `mergeable_state: clean`, base `b304db0` = `origin/main`, read through the API not assumed) — 3 fix commits + this close-out on top of S391–S395's 21; a human merges and confirms the Pages run.** **Drift: NONE a FIFTH consecutive session** — `origin/main` …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `ffe9d9a` | account.html | **Escape leaves the delete confirmation** (S396 Pass C, P4). The box already behaved like the suite's other focus-managed surfaces at both ends but one — `openDel()` moves focus in to `#delCheck`, `cancelDel()` moves it back to `#delBtn` — yet the page bound Escape nowhere, and the box it was missing from holds the destructive control. Before: Escape …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `3cc3ae5` | js/ivrit-account.js | **The account chip's avatar initials stop being white on gold** (S396 Pass C, P3; the session's one shared-script iteration). 10.56px bold white on a token that is a LIGHT surface in both themes: **22 of 22 cells below the 4.5 floor** across all eleven carriers × 2 themes — 2.75:1 on `#c9922a`, 2.40 on flash cards' paler `#c9a24a`, 2.14 on …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-09-17 | `b15ef0e` | account.html | **The page says so when the account is gone** (S396 Pass C, P3 — the pass's headline find, on the page's first dedicated pass of any kind). Delete permanently succeeds, the deleted tile appears, and focus falls to `<body>`: showing that tile hides the one holding `#delGo`, and `#delStatus` — the live region that had been speaking — goes with it, so …[full text: IMPROVEMENT_ARCHIVE.md]

## Metrics

### Per-session log (one line per session)

- 2026-09-17 | **S400** | iters: 3 micro-features, no pass (feature-seeds session, outside the 1-per-session micro budget) = **3** | tools: trope_tutor ×3 (`4ce56bb`, `3249dba`, `c57eb53`) | patterns fixed: — | pass run: none | SW: v776→v777

- 2026-09-17 | **S399** | iters: 1 pass (**A**) + 4 fixes = **5** (full budget) | tools: hebrew_dictionary (`273f449`), Hebrew_Font_Maker ×2 (`05341a7`, `ab491a7`), resources (`9568ad3`) | patterns fixed: light-literal-text-on-the-gold-token ×7 carriers (its first sweep hit), …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-17 | **S398** | iters: 1 pass (**B**) + 4 fixes = **5** (full budget) | tools: hebrew_blend_generator ×2 (`12ecb5f`, `3f93c03`), resources (`c71b556`), hebrew_dictionary ×2 (`3f93c03`, `e53b78e`), classroom_dashboard + torah_trainer (`3f93c03`) | patterns fixed: …[full text: …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-17 | **S397** | iters: 1 pass (**F**) + 3 fixes + 1 refutation = **5** (full budget) | tools: suite-wide sweep ×14 (`1348930`, `bc6df0f`), hebrew_dictionary + classroom_dashboard (`7e8b427`), Hebrew_Font_Maker (`ecb9706`) | patterns fixed: physical-property-that-never-mirrors ×2 (the …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-17 | **S396** | iters: 1 pass (**C**) + 3 fixes + 1 measurement = **5** (full budget) | tools: account ×2 (`b15ef0e`, `ffe9d9a`), js/ivrit-account (`3cc3ae5`, the one shared-script iteration), suite-wide (measured, no code) | patterns fixed: light-literal-text-on-the-gold-token ×1 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-17 | **S395** | iters: 1 pass (**H**) + 3 fixes + 1 measurement = **5** (full budget) | tools: classroom_dashboard ×2 (`3e40f28`, `dd2aac6`), hebrew_blend_generator (`04892f3`), Hebrew_Font_Maker (measured, no code) | patterns fixed: selector-declared-twice-in-one-stylesheet ×1 (3 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S394** | iters: 1 pass (**I**) + 4 fixes = **5** (full budget) | tools: torah_trainer (`767064e`), js/ivrit-account (`a3d288d`), hebrew_blend_generator (`7de7842`), Hebrew_Font_Maker (`d14c4f9`) | patterns fixed: hover-feedback-survives-the-disabled-state ×1 (**its last open …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S392** | iters: 1 pass (**G**) + 2 fixes = **3** (4th/5th unspent: all 4 of G's defects are in one tool and the governor caps it at 2; the torah hover carrier stayed a VOID rather than ship half-verified) | tools: generator (`bf5126d`, `a05e1cf`) | patterns fixed: — …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S391** | iters: 1 pass (**M**) + 4 fixes = **5** (full budget) | tools: index (`fa001b0`), scripts+harness (`bfcdc15`), generator (`95fe5ec`), Font Maker (`d5ee54c`) | patterns fixed: hover-feedback-survives-the-disabled-state ×2 (3 controls, closing all 3 open unconfirmed …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S390** | iters: 1 pass (**P**, security-focused per user direction) + 2 fixes = **3** (4th/5th unspent: every remaining finding is backend-boundary maintainer work or was answered "leave as-is" at a gate, and padding the count with a change nobody asked for is not a win) | tools: …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S389** | iters: 1 pass (**N**) + 2 fixes = **3** (4th and 5th unspent: both fixes are shared `js/` modules, so every one of the 9 account-bearing pages is at the 2-per-tool cap, and the only open candidates on the uncapped chrome pages are gate-2 class, deferred unattended) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-16 | **S388** | iters: 1 pass (**K**) + 3 fixes = **4** (5th unspent: the torah arm-(b) carrier could not be driven — it needs a loaded parsha and that run's control went silent — and a half-verified change is not an iteration) | tools: js/ivrit-account (`cfb1ce0`), hebrew_blend_generator …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S387** | iters: 1 pass (**L**) + 3 fixes = **4** (5th unspent: the hover-vs-disabled class hit its 2-per-session cap and every other open candidate is gated or adjudicated not-a-defect; the 254-cell junk sweep was `68552b3`'s grounding, not its own iteration) | tools: trope_tutor …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S386** | iters: 1 pass (**E**) + 4 fixes = **5** (full budget) | tools: account (`fba22e1`), THIRD_PARTY_LICENSES (`e65f7e5`), README (`ad6bcd8`), sitemap (`e89e6dd`) | patterns fixed: hover-feedback-survives-the-disabled-state ×1 (3 controls, carrier 4 of 7) | pass run: E (31st; …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S385** | iters: 1 pass (**A**) + 3 fixes = **4** (the 5th unspent: `dark-print-shadow-slab` hit its 2-per-session cap and every other arm came back clean or non-actionable) | tools: hebrew_blend_generator (`0a46f67`), trope_tutor (`7be7591`), classroom_dashboard (`902d3ff`) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S384** | iters: 1 pass (**B**) + 3 fixes = **4** (the hover-vs-disabled class hit its 2-per-session cap; every other open candidate is gated or P4) | tools: classroom_dashboard (`9614a80`), Hebrew_Font_Maker (`a585608`), contact + resources (`df9ff3b`) | patterns fixed: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S383** | iters: 1 pass (**F**) + 3 fixes = **4** (the new hover-vs-disabled class hit its 2-per-session cap, and flash_cards + hebrew_dictionary both hit their 2-per-tool cap, so no cap-allowed 4th) | tools: flash_cards (`a234f9f`), the two shared account modules = every page with …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-15 | **S382** | iters: 1 pass (**P**) + 3 fixes = **4** (both touched tools at their 2-per-tool cap and the tile-grid class at its 2-per-session cap; every other open candidate is gated) | tools: hebrew_blend_generator ×2 (`a44a181`, `b5f06f5`), flash_cards ×2 (`b5f06f5`, `b86faca`) | …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S381** | iters: 1 pass (**C**) + 3 fixes = **4** (keyboard-efficiency pattern at its 2-per-session cap; no other ungated small candidate open) | tools: Hebrew_Font_Maker (`e100574`), flash_cards (`daab7b2`), hebrew_blend_generator (`516a105`) | patterns fixed: one-Tab-stop tile …[full text: IMPROVEMENT_ARCHIVE.md]

- 2026-09-11 | **S380** | iters: 1 pass (**H**) + 2 fixes = **3** (Font Maker at its 2-per-tool cap; no ungated non-FM small candidate open) | tools: Hebrew_Font_Maker ×2 (`df8786a`, `e71ec09`) | patterns fixed: — | pass run: H (Font Maker, 4th dedicated; 2 P3 fixed, 1 P2 + 1 P4 logged, 1 seed; …[full text: IMPROVEMENT_ARCHIVE.md]

### Tool coverage (last-touched date per tool)

- **S400 (2026-09-17):** all-page passes keep the *dedicated pass* the useful column. index (M S391, F S397); hebrew_blend_generator (G S392, **D S338 — D-next**); flash_cards (D S393, **H S264 — the stalest H tool**, G S279); hebrew_dictionary (`273f449`; **C S285 — C-next**); classroom_dashboard (H S395); torah_trainer (**O-next — the ledgered O target, never O-audited**; N S248); trope_tutor (**S400: 3 seeds shipped** `4ce56bb` `3249dba` `c57eb53`; N S389, C S312); Hebrew_Font_Maker (`05341a7`+`ab491a7`; B S398, H S380); account (C S396, P …[full text: IMPROVEMENT_ARCHIVE.md]

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`physical-property-that-never-mirrors`** (**NEW, registered 2026-09-16 (S388 Pass K) — the shape has now surfaced in THREE sessions (S248, S376, S388), which is what makes it recurring rather than incidental**): ACTIVE. **S397 (Pass F): 2 carriers FIXED (`1348930`) — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`synced-key-wiped-without-forgetRow`** (**NEW, registered 2026-09-15 (S382 Pass P arm 4) — 1 carrier found and fixed**): ACTIVE, consequence-critical (it turns a local reset into an account-wide deletion offer), so it never retires on streak. **S382: 1 FIXED (`a44a181`, the …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **`sub-floor touch target`**: ACTIVE. **S396 Pass C swept `account.html` (signed in, names lists expanded, delete box open, 4 cells): 21 targets, 5 undersized, 0 REAL failures — and the sweep tightened this row's own definition.** **Detection (use this, not `min(w,h) < 24` …[full text: IMPROVEMENT_ARCHIVE.md]

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

- P accounts & cloud (one surface): 2026-09-16 (**S390 — 2nd-ever P, and the first run steered by explicit user direction ("focus on security with the new backend") rather than staleness; M stays the stalest unattended pass.** Surface: the whole layer, security-first. **2 REAL FINDINGS, both FIXED:** the PKCE `?code=` and `?error_description=` reaching Google Analytics (`c0659f3`, all 14 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html`. ⚑ S399 ATTEMPTED O AND COULD NOT RUN IT — this is NOT "needs an attended session".** The session WAS attended, the maintainer was asked first per the S399 pointer and CHOSE O, and the target was correctly derived as `torah_trainer.html` (the S346 row names it; never O-audited). The detector was cloned …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-09-16 (**S389 — 17th N, `trope_tutor.html`, its 2nd (S248 -> S389; 56 commits and +518/-74 between, incl. the print chart, the drawer resize block, roving tabindex and the WHOLE accounts layer, which no N had seen on a phone). N was the stalest unattended pass (O attended-only since S346) and the pointer named both pass and surface. 4 real descriptors …[full text: IMPROVEMENT_ARCHIVE.md]

- M aesthetics & visual design (one surface): 2026-09-16 (**S391 — 17th-ever M, `index.html`, its 2nd (S246 → S391): 48 commits and +512/-66 between, and the FIRST aesthetics look at the accounts-era hub panels (cloud saves, My Fonts manager, last-backup line, erase gate). Stalest unattended pass for a second session running, and the pointer named both pass and surface. 8 cells (EN/HE × …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- K i18n / localization audit: 2026-09-16 (**S388 — 26th run, first since S374 (14 sessions); K was the stalest unattended pass (O attended-only) and the S388 pointer named it. K's LARGEST delta ever — `4a1f186..HEAD`, 146 commits, 66 files, 25,891 insertions — and its FIRST sight of the accounts layer (the 4 `js/` modules, `account.html`, 2 harnesses). 5 gates clean (5,516 keys), and the zero is …[full text: IMPROVEMENT_ARCHIVE.md]

- C accessibility (one tool): 2026-09-17 (**S396 — `account.html`, and its FIRST dedicated pass of any kind; C was the longest unattended gap (S381, 15 sessions) and the pointer named the target. ⚑ THE POINTER'S OTHER NAMED TARGET WAS WRONG: it offered `trope_tutor.html` as "a tool C has never had" — trope has had THREE (S113 → S213 → S312). Re-derived from the ARCHIVE, which is what moved the …[full text: IMPROVEMENT_ARCHIVE.md]

- A recurring-pattern sweep: 2026-09-17 (**S399 — 32nd A, first since S385 (14 sessions). A was NOT the stalest: the maintainer chose O, the sandbox refused to execute the detector, and A was taken on a second question — recorded as a divergence, not as staleness.** Delta `eb53e8e..HEAD`: 18 files, 1,172 insertions. **6 arms, 5 clean with proven zeros, 1 arm with 7 carriers.** (1) …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- G print & export fidelity (one tool): 2026-09-16 (**S392 — `hebrew_blend_generator.html`, its 3rd dedicated G (S137 → S265 → S392) and the stalest G surface by both date and session; G itself was the longest-standing unattended gap (14 sessions) and the S392 pointer named both pass and tool. 85 commits and +777/−274 to the file since S265.** 18 printable shapes driven by real clicks. **4 REAL …[full text: IMPROVEMENT_ARCHIVE.md]

- D performance (one tool): 2026-09-16 (**S393 — `flash_cards.html`, its 4th dedicated D (S75 -> S170 -> S266 -> S393) and the tool the coverage row had carried `D-next` on for several sessions; D was the longest unattended gap (14 sessions, S378) and the S393 pointer named both pass and tool. Delta since S266: 73 commits, +768/-208, including the WHOLE accounts layer — the cloud panel, 4 sync …[full text: IMPROVEMENT_ARCHIVE.md]

- I first-load & empty-state: 2026-09-16 (**S394 — 30th run, first since S379 (15 sessions); I was the longest unattended gap and the S394 pointer named it. I's FIRST sight of the accounts layer: `account.html` was added three sessions AFTER S379, and the delta is 142 commits / 67 files / +26,291 — the largest I has faced.** The S379 scratchpad was gone, so `i394/` is a rebuild. **Mechanical …[full text: IMPROVEMENT_ARCHIVE.md]

- B console/error audit: 2026-09-17 (**S398 — 31st run, first since S384 (14 sessions). B was the stalest UNATTENDED pass; O is stalest overall and attended-only, the session WAS attended, so the maintainer was asked and chose B. Aimed by the pointer at the 313 outside-loop Font Maker lines (punctuation tab, round-pen preview, Preview-PDF digits, Save-all-drawings) that no pass had loaded.** 4 …[full text: IMPROVEMENT_ARCHIVE.md]

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-09-15 (**S387 — 19th run, first since S373 (13 sessions); L was the stalest unattended pass (O attended-only) and the S387 pointer named it. **L's FIRST sight of the accounts landing:** `account.html` as a 13th indexable page, `account-test.html`/`saves-test.html` as `noindex` harnesses. **14 mechanical arms, 0 HITS — and the zero is measured: 17 planted …[full text: IMPROVEMENT_ARCHIVE.md]

- H teacher walkthrough / paper-cuts (one tool): 2026-09-17 (**S395 — `classroom_dashboard.html`, its 3rd dedicated H (S107 → S278 → S395), across 92 commits and +1125/−171 to the file since S278 — the accounts layer and its cloud panel, the presenter blackout, the fullscreen quick strip, panel-width lock, move-panels, the video panel and the class manager, none of which any H had seen. H was the …[full text: IMPROVEMENT_ARCHIVE.md]

- E freshness/site-health: 2026-09-15 (**S386 — 31st run, first since S372 (13 sessions); stalest unattended pass (O attended-only), pointer-named. Delta `408dbe4..HEAD` (S371→S385): 146 commits, 65 files, 26,576 insertions — the largest E has faced, and E’s FIRST sight of the accounts layer, `db/`, `partners/`, the 7 backend smokes and the 2 authored workflows. **19 arms (17 + `ops.md`’s CSP …[full text: IMPROVEMENT_ARCHIVE.md]

- F cross-tool consistency: 2026-09-17 (**S397 — 31st run, first since S383 (14 sessions); F was the stalest unattended pass (O attended-only since S346) and the S397 pointer named it AND the affordance: THE KEYBOARD BYPASS.** Census by a real Tab walk over all 14 root pages, 0 pageerrors, 120 route aborts, torah/trope as the control: **2 of 14 carried a header skip link**; chrome stops before …[full text: IMPROVEMENT_ARCHIVE.md]

**Next session (S401):** **BRANCH/PR: S400 shipped three Trope Tutor seeds STRAIGHT TO MAIN (`4ce56bb` `3249dba` `c57eb53` `ee2d5f4`, each Pages run green) and wrote its close-out on `claude/improveloop-feature-seeds-3tczsw` / draft PR #250. If #250 is still open and unmerged, CONTINUE on it; if merged, cut a FRESH branch off latest `origin/main` and never stack on merged history.** **/!\ DRIFT vs S399: `origin/main` moved `ef75c79`→`ee2d5f4`** (PR #248 merged — S397–S399's fixes and close-outs — then the four trope commits). S400 closed at `sw.js` **v777**, FM **5.46**, SDK **2.116.0**; the backend numbers (migrations 0001–0003 `Live?` yes, `delete-account` untouched since `f141b7d`, keep-alive cron `41 4 * * *`) are S399's readings, NOT re-read in S400. **Never trust these numbers unread.**

**⚑ /!\ O WAS CHOSEN AND COULD NOT BE RUN — read O's rotation row before re-offering it.** The session was attended, the maintainer picked O over A, the target derived correctly as `torah_trainer.html` — and this sandbox refuses to EXECUTE the Impeccable detector ("Code from External"), though cloning it and resolving all four parsers worked. **O's row says blocked-here, NOT "needs an attended session" — do not degrade it to the unattended fallback.** Before re-offering O, test execution first (one `node <detector> <page>.html`) and say the answer in the question: S399 spent two round trips finding this out mid-pass. Target stays `torah_trainer.html`.

**⚑ /!\ RE-DERIVE, DO NOT INHERIT — a FIFTH session running, and this time it was a TOOL and a SELECTOR, not a date.** (a) `i394/dupcss2.py` is **gone with its container**, as every scratchpad is; S399 rebuilt it from the loop-findings recipe and **controlled the rebuild against the recorded census before trusting a number**. A ledger line naming a scratchpad script means the recipe, never the file. (b) The S398 bench said to copy `contact.html`'s captcha branch; its `.h-captcha iframe` test is a class **hCaptcha adds itself**, absent on resources for EITHER reason, so the copy would have been silently true forever. Ported to `#sgHcaptcha`. **Copy the shape, re-measure the handle.** Per-tool history: `IMPROVEMENT_ARCHIVE.md`; measurements: `loop-findings.md`. **Grep loop-findings for the file before auditing it.**

**⚑ STALEST PASS: O (S346, BLOCKED here — see above), E (S386), L (S387), K (S388), N (S389), P (S390), M (S391), G (S392), D (S393), I (S394), H (S395), C (S396), F (S397), B (S398), A (S399).** Unattended or if O cannot run, take **E** (14 sessions stale): sitemap `lastmod` vs git, broken internal links, SW precache vs files BOTH ways, each page's CSP against what it loads (**S399 did the two account origins: 17/17 exact — do not re-derive that arm**), THIRD_PARTY_LICENSES vs deps, README / CLAUDE.md / `docs/reference/*` accuracy. Then L, K, N, P, M (`account.html`), G (`flash_cards.html`, S279), D (the **generator**, S338), H (**`flash_cards.html`, S264, the stalest H tool**), C (**`hebrew_dictionary.html`, S285** — or `resources`/`contact`/`privacy`/`terms`/`404`, none of which has had a dedicated pass; `resources` is strongest).

**⚑ RUNTIME-PROBE HARNESS (standing). Traps 1–34 S384–S392, 35–40 S393, 41–47 S394, 48–54 S395, 55–61 S396, 62–65 S397, 66–67 S398, 68–70 S399 — all in full in loop-findings, read them there first.** S399's three: **(68)** in Chrome **every `CSSStyleRule` carries an empty but TRUTHY `.cssRules`** (nested CSS), so a CSSOM walk testing `.cssRules` before `.selectorText` collects nothing and returns a falsely clean zero — S399's first contrast run called all seven carriers AND its control "unresolved"; test `selectorText` first. **(69)** a **no-op stub for a rendering library is not a stub** — `window.html2canvas = function(){}` passed the guard then threw downstream at `.toBlob`, which reads exactly like a defect in the code under test; stub functionally or that cell is uninterpretable. **(70)** a **vendor-added class is not a handle**: `.h-captcha` is absent both when the widget is filtered and when the page never uses that markup, so a test on it cannot tell them apart — anchor on the element the page itself creates. **Also standing: `compact-ledger.mjs --apply` is NOT idempotent — run it ONCE; it tags its archive heading from the handoff pointer, so write the new pointer BEFORE compacting; and the outgoing handoff is NOT archived by the script — move it yourself, the schema requires it.**

**⚑ TOP UNGATED CANDIDATES (S399, +1 in S400 — the trope Study → detour, P3, a start-screen affordance or keeping the results screen through a Learn detour): the bench barely moved — the budget went to the pass, its two finds and the two gate-2 answers.** Strongest: **flash cards / Font Maker / trope heading-level trio** (flash `h1,h3×8` and FM `h1,h3×16` jump 1→3, trope `h1,h4` jumps 1→4; fixing means deciding what each page's h2 IS — a structure call, not a tag swap). Then **account's `#holdsList` list-semantics** (needs a WebKit engine, NOT an assertion). Held back: **sub-floor touch targets** (generator `.bingo-step`, FM `#rulerCorner` — gate 3); **"sign out everywhere"** (gate 1/2); **the Edge Function's `localhost` origins** (backend — maintainer redeploy). The 13 `selector-declared-twice` rows are all DIVERGENT or the adjudicated bingo layer: **that pattern's next A is a census and an intent decision, not a fix list; S399 proved it stable across 1,172 insertions.**

**⚑ GATE BENCH — BOTH of S398's open gate-2 questions were asked and SHIPPED** (`ab491a7` the FM's image-vs-PDF message, `9568ad3` the resources captcha wording), so the bench is shorter than in several sessions. **Gate 2's strongest remaining: the generator's Header Labels translating only Name/Date** (~10 sites, authoring, not wiring). Gate 3/M: the FM stage annotations; account's dark `.btn.ghost`/`.btn.danger` (S386: specificity, not a leak); `.dash-edit-pencil`'s side in Hebrew; the hub's 2.4px type band. Gate 4: the flash-card sticky-bar + landscape proposals. **Gate 5 is O's, and O is blocked here, not deferred.** **Seed bench: 17** — S400 shipped the three Trope Tutor seeds; S399's "26" was stale (the section already held 20: earlier shipped seeds had left it without the count following).
