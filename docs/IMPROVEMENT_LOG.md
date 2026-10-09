# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S488 A — header-wrap-gate**) | classroom_dashboard.html | **Header gates 558/652 sit under the EN ceilings 564/657**: 1-6px sideways at 559-564, 653-657. | found S488

- [ ] P4 (**NEW S488 A — latin-tracking**) | classroom_dashboard.html | **Now/Next labels track Hebrew** (week chip, `.nn-lbl`). | found S488

- [ ] P4 (**NEW S488 A**) | Hebrew_Font_Maker.html | **The sheet-crop caption sits under the top ruler**: unseen with rulers on (the default). | found S488

- [ ] P4 (**NEW S484 F**) | app-toast ×4, torah, trope | **Six toasts create their `role=status` element with its first text** (resources and FM pre-render it); pre-create it empty at load — a screen reader decides. | found S484

- [ ] P4 (**NEW S487 B — for K**) | torah_trainer.html | **The Hebrew UI's load-failed status names the reading in English** ("טעינת Bereshit — Genesis 1:1-6:8 נכשלה"): `r.label` is not localized where the status is built; check how the select names it. | found S487

- [ ] P4 (**NEW S483 C — gate 2**) | index.html | **Three `alert()`s stay**: "Use in all tools" repeats the status line; the Manual pane's two validation messages have no inline line (`#ivritStatus` is in the Automatic pane). | found S483

- [ ] P4 (**NEW S482 H — gate 2**) | torah_trainer.html | **"Select verses to copy…" opens the Copy bar with selection off** (as documented): one more click; a verse clicked meanwhile chants. | found S482

- [ ] P3 (**NEW S480 D — verify first**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P4 (**NEW S481 I**) | FM, i18n.js, flash, terms | **FM help's old layout; raw keys if a locale never loads; "Click Start", "use my location"** ; `compact-ledger` re-truncates its own marker (findings S481; gate 2 ×2). | found S481

- [ ] P4 (**NEW S479 G**) | trope_tutor.html | **Paper waste: Phrases 9–12 sheets at ~4 cards; 2 Letter charts end on the credits alone, EN Learn on one card.** | found S479

- [ ] P4 (**NEW S479 G — gate 2**) | trope_tutor.html | **Only the Haftarah note says the Phrases tab has no examples** (Esther, Megillot, Eicha lack them too). | found S479

- [ ] P4 (**NEW S478 M**) | 6 chrome headers | **A phone header leaves the star alone on a row** (EN contact ≤396, account ≤474). | found S478

- [ ] P4 (**NEW S478 M**) | 6 chrome footers | **A "·" ends a footer line below ~700px.** | found S478

- [ ] P4 (S476 N) | Hebrew_Font_Maker.html | **Guides reorder by drag only** (`attachGuideSortable`). | found S476

- [ ] P4 (S476 N — gate 4) | hebrew_blend_generator.html | **On desktop the Generate bar covers 1–3 footer FAQ rows at the page end** (phones fixed `dbf2d7a0`). | found S476

- [ ] P4 (**NEW S474 L — gate 2**) | index.html, torah_trainer.html | **The hub's ItemList one-liner and Torah's WebApplication + HowTo descriptions name the weekly parsha only** (not the holidays or Megillot). | found S474

- [ ] P2 (**NEW S465 G — maintainer**) | starting-fonts/manifest.json | **14 fonts' `copyright` is empty**: re-stage with `/addOSFont --force` (detector fixed `3609c19`; ids: findings S465). | found S465

- [ ] P4 (**NEW S466 D**) | js/ivrit-saves.js | **A fresh device's first signed-in load rewrites the whole sync memory once per row** (tasks 50→340 ms, settled in 47 s @4×, 410 rows) and fetches each row by its own GET (457). | found S466

- [ ] P4 (**NEW S465 G**) | Hebrew_Font_Maker.html | **3 starting fonts fail Chrome's sanitizer**; the picker says so only on hover. | found S465

- [ ] P4 (**NEW S465 G — gate 2 ANSWERED: name + date**) | Hebrew_Font_Maker.html | **A saved project is named by date alone.** | found S465

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Sephardi haftarot and the holidays' maftirim are not offered**: `holiday-readings.json` carries `seph` and `fullkriyah.M` for every entry the table keys (the leyning builder's check could carry them). | found PR #313

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Shabbat Chazon's haftarah (Isaiah 1) is drawn in the Haftarah chart throughout**; the verses customarily chanted to Eicha's tune need a per-verse tune. | found PR #313

- [ ] P4 (**NEW PR #313**) | classroom_dashboard.html | **The dashboard's parsha line never names a special Shabbat** (Zachor, Parah, Shekalim…) though `HebCal.specialShabbat` now answers by date. | found PR #313

- [ ] P4 (**NEW S464 M**) | resources.html | **The Links/Fonts toggle mixes a line icon with a colour 🔤** (`resources.view.fonts`). | found S464

- [ ] P4 (**NEW S464 M — gate 3 ANSWERED: drop it suite-wide**) | resources.html (+ suite) | **Hebrew labels keep the Latin uppercase tracking** (53 nodes; pattern row). | found S464

- [ ] P4 (**NEW S464 M**) | resources.html | **Below ~1020px wrapped chips flow back under their row label.** | found S464

- [ ] P4 (**NEW S463 P**) | hebrew_blend_generator.html | **The comment above `saveImportedAsWordList` says a saved list waits for an upload the teacher chooses**; signed in it goes up at once (W5). | found S463

- [ ] P4 (**NEW S460 — pattern radio-set-without-a-question**) | classroom_dashboard.html | **The video position radios have no group or question**; a name needs a new string. | found S460

- [ ] P4 (**NEW S460 — ANSWERED S462: drop it**) | Hebrew_Font_Maker.html | **The About footer says "(the font engine loads on first export)"** (`fontmaker.about.footer_about_body`). | found S460

- [ ] P4 (**NEW S458**) | scripts/smoke-sync.mjs | **Scenario 2 fails Mon 08:00–09:30, Tue 08:00–08:45 local** (its schedule's preset goes up): pin the clock. | found S458

- [ ] P4 (**NEW S454 H — gate 2**) | resources.html | **"Jewish Interactive" is listed twice** (one URL; "All" counts 43 for 42). | found S454

- [ ] P4 (**NEW S455 C**) | trope_tutor.html | **The Learn and Phrases cards carry no heading** (h1 only), so a screen reader cannot jump card to card. | found S455

- [ ] P4 (**NEW 2026-10-03, gate 2 copy**) | hebrew_dictionary.html | **"Any of these letters" requires every ticked letter** (`onFilter`); the Hebrew label (כל אחת מהאותיות האלה) says so, the English label and its "Any:" chip don't. | found 2026-10-03

- [ ] P4 (**NEW S452 D — G's**) | hebrew_blend_generator.html | **"N pages to print" counts a caller sheet as one page**; an 8-card set's takes 3 (says 3, sends 5). | found S452

- [ ] P4 (**NEW S452 D — gate 2**) | hebrew_blend_generator.html | **jsPDF re-decodes each PNG page in JS** (561–660 ms a bingo page, 1.85 s a caller sheet); JPEG skips it but is lossy. | found S452

- [ ] P3 (**NEW S451 G — gate 2, the maintainer's call**) | torah_trainer.html | **In the Trope staff layout the student handout ignores Font size and "Hide cantillation"**: the staff prints at screen scale (Hebrew 27.4pt, Large and Extra large alike) and its notes carry every trope; either print a text layout or say so beside the options. | found S451

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P4 (**S440 H, gate 2**) | hebrew_blend_generator.html | **The vav tip says unchecked is the default**; it ships checked. | found S440

- [ ] P4 (**NEW S437 G — gate 2, copy**) | index.html | **Import All Settings' confirm still says it "will overwrite your current dashboard settings and merge … presets and schedules"**; it merges every tool's data. | found S437

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P4 (**NEW S436 M**) | hebrew_blend_generator.html | **Export PDF below 700px still carries the phone rules** (stacked header, Hebrew at 0.75×) (`141aa8f7` pins only the width). | found S436

- [ ] P4 (**NEW S448 N — gate 2, new copy**) | torah_trainer.html | **The one-time tip says "click any Hebrew word" on a touch phone** (the Hebrew "לחצו" covers both); a `tap` twin under `pointer:coarse` is new copy. | found S448

- [ ] P4 (**NEW S447 K — the corpus's shva slips, the doubled-yod half FIXED `a86b5a16`**) | data/hebrew_emojis.json | **Some transliterations read a silent shva as a vowel or drop a voiced one** ("seport", "michnsey gi'yns", "mistovvim"); a corpus edit with a `?v=3` bump, best done as a reviewed list. | found S447

- [ ] P4 (**NEW S435 P — gate 2, new copy ×5**) | dashboard, generator, torah, dictionary, flash | **The vowel-colour reset confirm names no account-wide effect while signed in**, though all five reset overrides that travel. | found S435

- [ ] P4 (**NEW S432 L — gate 2**) | index.html | **The hub's og:/twitter:description name every tool but the Font Maker.** | found S432

- [ ] P4 (**S430 A — the maintainer's call**) | torah_trainer.html | **The reading header keeps "Aliyah {n}" English in the Hebrew UI** beside a translated cycle label (also the copy heading, the handout). | found S430

- [ ] P4 (**NEW S421 Pass P**) | classroom_dashboard.html | **The "Now showing {name} — the classes from your account are in the class list" switch runs on every signed-in load and credits the account even when it holds nothing** (**S450 attempt reverted**: needs the landed ids; findings S450) | found S421

- [ ] P4 (**NEW S421 Pass P — for H**) | classroom_dashboard.html | **A class list beyond the picker's cap keeps its names now (`288af4a`) but the picker draws only the first 60 chips** (`rosterNames()` slices), so students 61+ of a merged class are stored and counted ("65 names (max 60)") yet never picked; say so in the drawer or raise the chip cap. | found S421

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **The first transliteration of a reading is still one long task**: ~600 ms @1× / 3.3–4.1 s @4× on a full parsha, the library ~93% (profiled); fill the rows in idle chunks or a worker. `40c5154` fixed every re-render after it. | found S424

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **Side by side with a translation is layout-bound at 4×**: re-renders 450–930 ms (≤280 @1×), ~80% style/layout; long-standing (the S307-era page 461–676 on the same stub); interlinear ≤195. | found S424

- [ ] P4 (**NEW S422 Pass M — five small ones; (1) FIXED S446 `0daed724`, (4) FIXED S448 `0f9ddbe1`**) | torah_trainer.html | **(2)** drawer segments break mid-label at 380px; **(3)** Audio tracks start ragged; **(5)** "Custom range…" has no icon. | found S422

- [ ] P4 (**NEW S422 Pass M — gate 3 / gate 2**) | torah_trainer.html | **(1)** dark Chant all is 1.1:1 on the page; **(2)** Hebrew-only side by side keeps an empty half; **(3)** "עִבְרִית" in Libre Baskerville; **(4)** gate 2: the Audio help's 🔊 / 🎵, not the icons. | found S422

- [ ] P4 (**NEW S425 Pass I — extract the tour engine first, UX rule 1**) | trope_tutor.html | **With `trope_motifs.json` missing the tour counts "Step 3 of 8 → Step 5 of 8"**; torah/dictionary use `_tourCounter`. | found S425

- [ ] P4 (**NEW S425 Pass I — for F**) | CSV, 8 pages | **22 Hebrew strings end in "→", pointing back in RTL** (home CTAs, trope nav, torah links); 25 use "←". | found S425

- [ ] P4 (**NEW S418 — the maintainer's dashboard**) | Supabase project | **Security advisor: leaked-password protection is off**; passwords are never used (e-mail code + Google), so enable the toggle or accept it as moot. | found S418

- [ ] P4 (**NEW S412 Pass H — five small ones; (1) FIXED S446 `c6c509ed`, (3) FIXED S448 `c54897da`**) | flash_cards.html | **(2)** a timed drill paints the previous value for 1 s; **(4)** a load in 1-letter mode narrows "Vowel on letter" `[2]` → `[1]`; **(5)** gate 2: the printed card …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S413 Pass C — gate 3**) | 404.html | **The lost star wanders forever with no pause** (WCAG 2.2.2); only reduced motion stops it. | found S413

- [ ] P4 (**NEW S414 Pass F — gates 2/3 + K**) | chrome pages, the 7 tools, 404, CSV | gate 2: **(1)** dark mode's visible "Light", and FM's fullscreen "Show/Hide Panels" (S415), are not in their fixed toggle names (2.5.3); **(2)** "Back" goes to the home page (tools say "Home"); **(3)** 404 lists 4 of 7 tools. Gate 3: **(4)** Tour / Dark / Full Screen / Settings order differs per tool. K: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S415**) | torah_trainer.html, trope_tutor.html | **The Sefaria / PocketTorah credits are pinned English with no `dir="ltr"` or `lang="en"`**; `dir` changes the Hebrew rendering, so compare crops. | found S415

- [ ] P4 (**NEW S411 Pass I — K's**) | Hebrew_Font_Maker.html | **QA Check's outline warning names a glyph by its JS-built English `name` in the Hebrew UI** ("A (uppercase)"; the English, Cyrillic, Phoenician and Aramaic tables build `name` with no key, e.g. "Д (Cyrillic de, uppercase)"). | found S411

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4×. Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **Continue runs a synchronous `autosaveNow()` inside the click's task** (88–114ms of 575–616ms @4×), re-saving the snapshot it just restored. | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **The partner wizard's Create re-renders every grid once per setter** (`setMarkEnabled` ×2, `setAddEnglishLetters`, `setInputMode`…): 3 tasks of 465–678ms @4×, top 146–201ms @1× (engine blocked; with it, Pyodide's own blocks dominate). | found S410

- [ ] P4 (**NEW S409 Pass G**) | account.html | **Printing splits cards across sheets, spends an A4 sheet on the footer and prints 6 inert controls.** | found S409

- [ ] P4 (**NEW S405 Pass K gate controls — K's, doc-only**) | scripts/check-i18n.js + docs/reference/i18n.md | **The gate's header says `.innerHTML = '<literal>'` is flagged; rule 2 skips innerHTML by design**, and its exit-contract comment omits D and E (both block). i18n.md's "Known blind spot" names template literals, plain arguments and ternaries, not a plain innerHTML literal, and its …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S405 — found beside `f78ad1b`**) | Hebrew_Font_Maker.html | **The Upload help tab's link to Download Templates exists only in the English authored HTML** (`openHelp('templates')`); the translated Upload body is CSV prose, so a Hebrew reader gets no link. A `data-fmact` action (the dispatcher's CSV-safe route) would carry it. | found S405

- [ ] P4 (**S394 census, retuned S395 — `04892f3` took the three SHADOWED ones that were accidents; what is left here is judgement, not dead code**) | hebrew_blend_generator.html | **The `.bingo-card-num` / `.bingo-grid` IDENTICAL twins and the `.bingo-card` SHADOWED one sit inside a deliberate later layer that re-declares the bingo shapes in print-safe literals, and `body.dark …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S394 — the non-generator half of the same census; all DIVERGENT, i.e. the earlier rule still contributes, so each needs reading rather than deleting**) | Hebrew_Font_Maker.html, classroom_dashboard.html, hebrew_dictionary.html, privacy.html, terms.html | **5 selectors declared twice with overlapping properties: FM `#fsPanelsBtn`; dashboard `textarea` and `.fr-tour`; dictionary …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — BACKEND BOUNDARY: changing it needs a redeploy, so maintainer work, not a loop fix**) | db/functions/delete-account/index.ts | **The production Edge Function's `ALLOWED_ORIGINS` still carries `http://localhost:8080` and `http://127.0.0.1:8080` beside the two real origins.** Low risk (a web attacker cannot forge `Origin`, and the JWT is the real gate), but it is dev …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S390 Pass P — a real gap, shippable, but it is a new control + copy so it was not taken unattended-of-gate-1**) | js/ivrit-account.js + account.html | **`signOut({ scope: 'local' })` ends the session on this device only and no UI offers "sign out everywhere", so a teacher who loses a school laptop cannot revoke that device.** Supabase supports `scope: 'global'`; the shape is one …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S380 Pass H — dead copy or a hint-logic choice; the copy half is gate 2**) | Hebrew_Font_Maker.html | **`nexthint_nikkud` ("Letters done! Place nikkud on {name} — {count} to go.") and the `export_nikkud_*` guard can never fire in the trace flow: `finalizeWithOutline` seeds `l.anchors` on every trace, so `coreLetterStats().unanchored` is always empty and the hint jumps from the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S377 Pass G — a CONTENT question (gate 2), so logged not shipped; if stray, one regex over `data/hebrew_words.json` + `?v=6→7` on the three fetching pages**) | data/hebrew_words.json | **Phrase entries …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S378 Pass D — GATE 2: a preview-size choice, deferred unattended**) | hebrew_dictionary.html | **"Select all matching" on the unfiltered corpus is a 339 + 274ms block @1× (1.7s @4×) and only 27ms of it is JS: the browser lays out the 13,081-line bulk textarea.** Proposal: cap the textarea preview (first 500 lines + "…and N more") while copy/export keep the full set. | found S378

- [ ] P4 (**NEW S361 Pass N — GATE 4 (phone layout), deferred unattended; screens `n361/shot-setup-*.png`**) | flash_cards.html | **The sticky Start bar also carries the Print card sheet button: 136px = 24% of an iPhone SE, 20% of an iPhone 13, 40% in landscape (the S244 header precedent was 21.5%, approved).** Proposal: at ≤440px only Start stays sticky; Print flows below. | found S361

- [ ] P4 (**NEW S361 Pass N arm 1 — GATE 4 (landscape phone), deferred unattended; `n361/shotL-card-*.png`**) | flash_cards.html | **In iPhone 13 landscape (750×342) the card screen shows 137px of the 330px card: sticky header 64 + progress + stats bar (136–191) push it to y=205.** Proposal: a landscape height query hides the stats bar or shrinks the card. | found S361

- [ ] P4 (**NEW S360 Pass K — `authored-but-unreferenced i18n key`; wire or prune: maintainer's call**) | torah + trope (`ui-strings.csv`) | **5 credit rows (`torah.footer.sefaria_credit`/`cantillation_credit`, `torah.audio.speeds_credit`, `trope.footer.sefaria_credit`/`cantillation_credit`): translated, referenced nowhere; markup has anchors → `data-i18n-html` cells.** | found S360

- [ ] P4 (**NEW S363 Pass H — GATE 2: Hebrew wording for the printed teacher copy; the sites are in loop-findings**) | hebrew_blend_generator.html | **With Header Labels = עברית the printed answer-key banner, `Answer …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S364 Pass G — GATE 2: a default-output choice, deferred unattended; numbers + screens in loop-findings (`g364/out/board-print-en-dark.png`)**) | classroom_dashboard.html | **With background graphics ON, the board's day plates print in their screen colours under the print block's navy ink (`.day-item.colored { color: var(--text) }`): 1.12:1 on Friday's indigo, 1.58 purple, 2.58 …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S364 — pattern `sub-floor touch target`, an M call like the `.toggle` switches**) | hebrew_blend_generator.html | **The bingo card stepper's ▲/▼ buttons are 18.7×10.5 / 18.7×9.5px at 8.8px type (Bingo mode, `.bingo-step`).** A 24px pair doubles the 90px control's height — a visible size change, not a hit-box trick (the two stack inside a 1px-bordered box). | found S364

- [ ] P4 (**NEW S337 Pass G — GATE 2: a default-behaviour choice, deferred unattended**) | Hebrew_Font_Maker.html | **The tool's two PDFs print on different paper: the Preview PDF specimen is hardcoded A4 (595×842 pt, `format:'a4'`) while the five template sheets are hardcoded Letter (612×792 pt, `format:'letter'`, and the generator's PDFs are Letter too).** A US teacher's specimen comes out …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S332 Pass L — GATE 2 / maintainer fact; deferred unattended**) | index.html | **The hub's Organization `sameAs` and the visible "Created by" link both point at `https://harrisonbleiberg.wpcomstaging.com/`, a WordPress.com staging address.** If a public author URL exists (or the site has moved), both should carry it; if the staging address IS the intended public home, waive this. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S327 Pass C — the one tile grid `41679da` could not lift; needs a layout decision**) | hebrew_blend_generator.html | **The real-words letter grid's names render at 7.2px** (`.rw-letter-tile .name` …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S333 Pass K — GATE 2: four Hebrew terms need authoring; deferred unattended. The S326 candidate's authored half shipped `ecd0720`**) | classroom_dashboard.html + flash_cards.html …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S321 Pass N arm 5 — on-screen keyboard ergonomics; the copy half is GATE 2**) | classroom_dashboard.html | **`#timerCustomInput` is `inputmode="numeric"` with an `MM:SS` placeholder, and the iOS numeric pad has no colon.** `timerSetCustom` also accepts plain digits as whole minutes, so the field works for "5" but the placeholder promises a format the keyboard cannot type. Either …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S311 Pass O — filed out of O; S335 M re-measured both M halves**) | `Hebrew_Font_Maker.html`, the help popup | **The help tab strip is 14 chips over 3 rows, 96px, crossed before any content on every tab at every width (the modal is max 640px, so 800 = 1280)** — a restructure (grouped tabs or a select) is gate 3; screenshots `m335/1280-light-en-help.png`, `m335/800-light-en-help.png`. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S292 Pass H — the pass's headline finding; GATE 2 ASKED, maintainer chose "log it only, change nothing"**) | hebrew_dictionary.html | **"⭑ Save as Word List…" is discoverable only from a theme.** Word …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S285 Pass C — a cross-tool DIVERGENCE, filed for F rather than as a defect**) | classroom_dashboard.html vs the other four tooltip carriers | **The dashboard binds its tooltip to the `.tip-icon`; the other four bind the `.tip-wrap`.** `wire()` sets `tabIndex`/`role`/`aria-expanded`/`aria-describedby` on the inner icon, while `bindTip` sets them on the wrapper. Both are …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S258** - re-logged from the S257 candidate with the reason it was not taken; a geometry change, so **gate 3** if ever pursued) | Hebrew_Font_Maker.html | **`#rulerCorner.rl-corner` is 22x22, under the 24px touch floor, and cannot be fixed with a `min-height`.** Its `width`/`height` are both `var(--rl-w)` - the ruler thickness declared on `.rl-layer` (22px) - so the corner is the …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S246 Pass M** — the FOURTH page with this exact shape, so it is now a suite-wide convergence question rather than a per-page note) | index.html (+ Hebrew_Font_Maker S225, hebrew_dictionary S237, trope_tutor S245) | **Four text sizes inside a 2.08px band: 12 / 12.8 / 13.12 / 14.08px.** `button.ie-btn`+`footer` at 12, `#darkBtn`+`.card-attr` at 12.8, `p`+`.bookmark-btn` at 13.12, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S230 Pass K**, arm 1 — the corpus's one genuine placeholder gap, recorded rather than fixed because the reason it exists is linguistic, not an oversight) | `locales/ui-strings.csv` | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S218 Pass K** — needs 4 newly authored Hebrew terms, so it is gate-2 work, not wiring) | hebrew_dictionary.html (`locales/ui-strings.csv`) | **Four part-of-speech values have no filter row and so still print English in the Hebrew UI.** `ce75604` wired 19 of the corpus's 23 values by reusing the filter panel's existing keys; the remaining four — **proverb (19 entries), definite …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — it is a mapping decision, not wiring) | hebrew_dictionary.html | **The part-of-speech badge prints raw corpus vocabulary** (`noun`, `verb`, `adjective`, … from `w.pos`, ~L2768) and stays English in the Hebrew UI. Unlike the rest of the S192 haul this is **not** authored-but-unreferenced: the string match to `dictionary.shoresh.pattern_noun` is coincidental (that key …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (needs a gate — same mapping-decision class as the pos badge above) | flash_cards.html | **The Colors-mode selection tiles label their swatches in raw English** (`.color-tile-label` renders `c.name` — …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **Holam+rafe and shin-dot+rafe collision anchors** — `AddHebrewContextualGPOS.py`'s collision-avoidance anchors for above-mark pairs; today both attach at the shared above anchor and can overlap. Same contextual single-pos device the meteg pair uses, above class. | found: 2026-08-29, S283

- [ ] P4 (**NEW S283**) | Hebrew_Font_Maker.html | **The Yerushalam lamed-patah-hiriq rule and `jalt` wide-letter justification alternates** — `AddHebrewContextualGPOS.py` / `WideLetters.fea`. The jalt half overlaps the shipped ss02 wide forms (v5.33): the glyphs exist, only the `jalt` feature registration is missing. | found: 2026-08-29, S283

## Feature seeds (micro-features only; see the Micro-feature track in the session prompt)

- [ ] S | resources.html | **The Links filters live in the address** (`?cat=&age=`): bookmarkable, kept on reload. | found S454 H

- [ ] S | hebrew_dictionary.html | **Word Lists offers "Save the N selected words"** while a selection exists (it says "No word lists yet…"). | found S440 H

- [ ] S | hebrew_dictionary.html | **An English search lists exact-gloss matches first** ("dog": כֶּלֶב 8th of 15). | found S440 H

- [ ] S–M | flash_cards.html (reads the dashboard's class lists) | **Make student profiles from a class list.** A class already in the dashboard (`hebrewDashboard_settings.rosters`) is re-typed one `prompt()` at a time; a "From a class list…" choice is ~50 lines + 3 keys, a handshake pair. | found: S412 Pass H

- [ ] S | flash_cards.html | **Speech speed reachable mid-drill.** `speakWord()` reads `#ttsRateSlider` live, but the slider sits in `#panelAdvanced` on the setup screen, so a slower 🔊 Hear costs End Practice Early → Advanced → drag → restart. A −/+ pair beside `#fcSpeakBtn` writing the same slider is the torah `#ttLoopPauseBar` mirror shape; ~35 lines, 2 CSV keys, no storage. | found: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | flash_cards.html | **Pause the drill timer.** `startTimer()` is a bare `setInterval`, `stopTimer()` is terminal (clears AND hides `#timerDisplay`; callers: `showResults`, `returnToSetup`, `startTimer`), so an interruption inflates a tracked time or burns a limit. A pause chip on `#timerDisplay` reusing `formatTimerSecs`/`updateTimerDisplay`; ~40 lines, 2 CSV keys, transient state. | …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Maftir in the Reading picker.** `data/pockettorah/aliyah.json` carries a `_num:"M"` entry with `_begin`/`_end` for every parsha (210 entries verified S367) and `aliyahLookup()` keys `aliyot[num]` by the raw `_num`, so `aliyot['M']` is built on every lookup and read nowhere: `resolveRef` matches `/parsha-aliyah-(\d)/`, `refreshScopeLabels` loops 1–7 and `.filter(n …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] S | torah_trainer.html | **Projector mode can't turn the translation / transliteration off.** `#ttShowTranslit` and `#ttShowTranslation` exist only inside `.tt-controls`, which `body.fullscreen .tt-controls { display:none }` removes; the drawer's Display panel (reachable via `#ttFsSettings`) carries cantillation and nikkud but not these two. Two more `.tt-fs-btn` toggles dispatching …[full …[full text: IMPROVEMENT_ARCHIVE.md]

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

## In progress

_(none)_

## Done

- [x] 2026-10-09 | (S488 close-out) | branch/deploy note | **S488 = A + 4 fixes; PR #319 merged (deploy `success`), draft PR #320.** No drift; sw v968→v969; no FM bump; no gate; traps 204-207.

- [x] 2026-10-09 | `5da9ecbe` `f722eeba` `183605ba` `87fea4c4` | dashboard ×2, trope, FM | (S488) **Ribbon 9.85:1; "Count down to" named; Try again keeps focus; crop caption in HE.** | findings S488.

- [x] 2026-10-09 | (S487 close-out) | branch/deploy note | **S487 = B (the S471 delta) + 4 fixes, PR #319 continued.** No drift; sw v967→v968; no FM bump; no gate (unattended: the seed skipped); smoke-saves 15/15, smoke-sync 207/207; traps 200–203 (findings S487).

- [x] 2026-10-09 | `6ce2e1fb` `3c539498` `a1df6d90` `eba490f5` | flash, resources ×2, contact, js/ivrit-saves.js | (S487) **Flash's toast sits above the Start bar on setup (150 px); the resources font toast follows its text (3.4 → 4.6 s); hCaptcha takes the page's theme on contact + resources; the saves module's `fontsChanged` comment re-trued.** | HEAD controls, a fake hCaptcha API, smokes …[full text: IMPROVEMENT_ARCHIVE.md]

- [x] 2026-10-09 | (S486 close-out) | branch/deploy note | **S486 = one L feature on direction (week cycles; 5 answers in chat), PR #319 continued; pass skipped (B stays stalest).** No drift; sw v966→v967; no FM bump; smoke-sync 207/207; trap 199 (findings S486).

- [x] 2026-10-09 | `4875ef78` | classroom_dashboard.html + locales + 2 docs | (S486) **Schedule Sync week cycles: a "Schedule repeats" ribbon (1 / A/B / 3 / 4), week tabs over one bell schedule, "This week is" re-anchoring, Copy from Week A, a Week chip on Now / Next; `cells` stays Week A for old builds.** | 144 checks (findings S486).

- [x] 2026-10-09 | (S485 close-out) | branch/deploy note | **S485 = the micro-feature alone (gate 1: the maintainer's pick), PR #319 continued; pass skipped on direction (B stays stalest).** No drift; sw v965→v966; no FM bump; traps 197–198 (findings S485).

- [x] 2026-10-09 | `5163e4ca` | classroom_dashboard.html + locales + 2 reference docs | (S485) **Micro-feature: a countdown to the teacher's own event — name + date under Date & Time → a second gold line under the holiday countdown, gone by itself after the day; out of presets and starters like `intermissionHTML`, carried by `.ivrit`, AllTools and the account row.** | 96 checks (findings S485).

- [x] 2026-10-09 | (S484 close-out) | branch/deploy note | **S484 = F (toasts) + 4 fixes, PR #319 continued.** No drift; sw v964→v965; no FM bump; no gate; trap 196.

- [x] 2026-10-09 | `8037c22d` `78738db4` `5ffa32ba` `c7726222` | shared toast ×4, 7 toasts, FM ×2 | (S484) **Toast time follows its text (2.6→8 s; FM strip too); no toast stops at half the viewport; kerning labels in Hebrew.** | findings S484.

## Metrics

### Per-session log (one line per session)

- 2026-10-09 | **S488** | iters: 1 pass (**A**) + 4 fixes = **5** | tools: dashboard ×2, trope, FM | patterns fixed: contrast-plate, tip-name, button-focus | pass run: A | SW: v968→v969

- 2026-10-09 | **S487** | iters: 1 pass (**B**) + 4 fixes = **5** | tools: flash, resources ×2, contact, saves | patterns fixed: fixed-toast-duration ×1 | pass run: B | SW: v967→v968

- 2026-10-09 | **S486** | iters: 2 (L feature) | tools: dashboard | patterns fixed: — | pass run: — (skipped; B stays stalest) | SW: v966→v967

- 2026-10-09 | **S485** | iters: 2 (micro-feature) | tools: dashboard | patterns fixed: — | pass run: — (skipped on direction; B stays stalest) | SW: v965→v966

- 2026-10-09 | **S484** | iters: 5 | tools: 4 shared-block carriers ×2, torah, trope, resources, FM ×2 | patterns fixed: toast-duration (NEW) ×2, centred-fixed-box (NEW) ×7, translated-key-exists ×1 | pass run: F | SW: v964→v965

- 2026-10-09 | **S483** | iters: 5 | tools: index, saves modules (shared), torah, FM | patterns fixed: button-focus-lost ×1, module-fallback-literal (NEW) ×2 | pass run: C | SW: v963→v964

- 2026-10-08 | **S482** | iters: 5 | tools: torah ×2, dictionary ×2 | patterns fixed: radio-set-without-a-question ×1, settings-lost-across-a-load ×1 | pass run: H | SW: v962→v963

- 2026-10-08 | **S481** | iters: 5 | tools: generator, index, FM ×2 | patterns fixed: rtl-copy-names-the-english-side ×2, copy-names-a-control-by-a-label-it-lacks ×2 | pass run: I | SW: v962

- 2026-10-08 | **S480** | iters: 5 | tools: trope ×2, FM ×2 (1 reverted), dashboard | patterns fixed: screen-frame-prints-as-rails (NEW) ×1 | pass run: D | SW: v960→v961

- 2026-10-08 | **S479** | iters: 5 | tools: trope ×2, dictionary, torah | patterns fixed: — | pass run: G | SW: v959→v960

- 2026-10-08 | **S478** | iters: 5 | tools: privacy ×2, contact ×2, i18n.js, +6 headers | patterns fixed: latin-tracking ×1, header-gate (NEW) ×8 | pass run: M | SW: v958→v959

- 2026-10-08 | **S477** | iters: 5 | tools: index ×2, resources, FM | patterns fixed: — | pass run: P | SW: v957→v958

- 2026-10-08 | **S476** | iters: 5 | tools: FM ×2, torah, generator | patterns fixed: install-banner ×1, tall-window ×1 | pass run: N | SW: v956→v957

- 2026-10-08 | **S475** | iters: 5 | tools: torah ×2, FM, trope, i18n.js | patterns fixed: english-literal ×2, stale ×1 | pass run: K | SW: v955→v956

- 2026-10-08 | **S474** | iters: 1 pass (**L**) + 4 fixes = **5** | tools: torah ×2, flash, index | patterns fixed: button-focus ×1 | pass run: L | SW: v954→v955

- 2026-10-08 | **S473** | iters: 1 pass (**E**) + 4 fixes = **5** | tools: docs, flash, dictionary, torah | patterns fixed: button-focus ×2 | pass run: E | SW: v953→v954

- 2026-10-08 | **S472** | iters: 1 pass (**A**) + 4 fixes = **5** | tools: torah ×2, generator + pwa.js, FM | patterns fixed: author-display ×1, enter-ignored ×1, install-banner ×2 | pass run: A | SW: v952→v953

- 2026-10-07 | **S471** | iters: 1 pass (**B**) + 4 fixes = **5** | tools: dashboard ×2, generator, index | patterns fixed: enter-ignored (NEW) ×2, button-focus ×1 | pass run: B | SW: v951→v952

- 2026-10-07 | **S470** | iters: 1 pass (**F**) + 4 fixes = **5** | tools: 14 pages (dashboard, FM, torah ×2) | patterns fixed: placeholder ×14, button-focus ×1 | pass run: F | SW: v950→v951

- 2026-10-07 | **S469** | iters: 1 pass (**C**) + 3 fixes = **4** | tools: generator ×2, flash ×2 | patterns fixed: button-focus-lost-to-its-own-rebuild ×2 | pass run: C | SW: v949→v950

### Tool coverage (last-touched date per tool)

- **Snapshot S488 (2026-10-09):** dashboard, trope, FM S488 · flash, resources, contact, saves S487 · docs S486 · generator, dictionary, torah S484 · index S483 · privacy, terms, account, i18n.js S478 · pwa S472 · 404 S470.

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`fixed-toast-duration-shorter-than-its-text`** (NEW S484 F; FIXED `8037c22d` ×4, `5ffa32ba`; resources `3c539498` S487; open 0): ACTIVE, streak 0. A fixed toast timer under 1000 + 50 ms/char of its longest message. Detection: `f484/durations.mjs`; exempt sticky/explicit-ms …[full text: IMPROVEMENT_ARCHIVE.md]

- **`centred-fixed-box-shrinks-to-half-the-viewport`** (NEW S484 F; FIXED `78738db4` ×7): ACTIVE, streak 0. A fixed `left:50%; translateX(-50%)` box with no width is capped at vw/2. Detection: `f484/width.mjs` (width = vw/2 at 390); fix `width:max-content`.

- **`shared-module-fallback-literal-without-a-dark-twin`** (NEW S483; FIXED `cb226a04` ×2): ACTIVE, streak 0. A module's `var(--token, #light-literal)` on a page lacking the token. Detection: findings S483 (3); 7 tokens, 1 hit, 0 open.

- **`rtl-copy-names-the-english-side`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (b).

- **`copy-names-a-control-by-a-label-it-lacks`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (a).

- **`screen-frame-prints-as-rails`** (NEW S480; trope `8de41993`): ACTIVE, streak 0. A plate's border around multi-sheet content prints its sides down every middle page. Detection: `d480/rails.py` (prove on HEAD). Fix: print `border-color:transparent`.

- **`enter-ignored-beside-its-own-button`** (NEW S471; dashboard ×5, generator ×2; S472 torah range ×3 `60229f0f`): ACTIVE, streak 0. Detection: `a472/enter.py`, then typed Enter vs the button.

- **`placeholder-keeps-the-browser-gray`** (NEW S470 `45a3073e`): ACTIVE, streak 0. Detection: `f470/ph.mjs` < 4.5:1 (plant 1.3:1).

- **`header-wrap-gate-below-its-ceiling`** (NEW S478 M; FIXED ×8 `92a21164`; S488 dashboard open): ACTIVE, streak 0. Detection: `m478/gates.mjs` (1px 400-900, EN/HE × light/dark, every page); HEAD the control.

- **`latin-tracking-on-hebrew-labels`** (NEW S464 M; gate 3: drop suite-wide; ~180 rules/15 pages; S478 contact `936629b4`; S488 +1 dashboard): ACTIVE, streak 0. Detection: `m464/census.mjs` (a): Hebrew own-text, letter-spacing > 0; exempt `lang="en"`.

- **`forward-arrow-points-back-in-rtl-copy`** (NEW S462 N; FIXED S464 `5f7f8a40` ×48; open 0): ACTIVE, streak 1 (S472: 47 delta rows, 0). Detection: the S462 CSV census; exempt "(→)", A→Z, Back labels, the orphan `flashcards.header.home`.

- **`share-link-writes-the-teachers-saved-preferences`** (NEW S463 P, `1eeaacb8`): ACTIVE, streak 1 (S472 dictionary clean). Detection: `p463/link-fix.mjs`, `a472/dshare.mjs`.

- **`bulk-apply-skips-a-renderer-the-control-runs`** (NEW S461; FIXED ×3): ACTIVE, streak 1 (S472 clean). Detection: `x3/parity.mjs`, `p463/loc-fix.mjs`. Open: none known.

- **`radio-set-without-a-question`** (NEW S460; dictionary FIXED S482 `9528698d`): ACTIVE, streak 0. Radios in no named radiogroup/group/fieldset. Detection: walk each static radio up to its group; a hit lacks one or its name. Open: dashboard `videoLayout`.

- **`native-input-display-none-under-its-label`** (NEW S458, `ea43be7e`): ACTIVE, streak 0. Detection: `a458/radios.mjs`; control torah. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-tab-flush-writes-its-old-copy`** (NEW S458; `c1714e2f`, `027fc597`, flash `070582d8`): ACTIVE, streak 0. Detection: `a458/twotabsigned.mjs`; control `027fc597^`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`flex-range-keeps-its-min-content-width`** (NEW S457; `ddcb4237`): ACTIVE, streak 0. A `flex:1` range without `min-width:0` keeps its 129px and pushes the row's last item out of a narrow card. Detection: grep `input\[type=range\][^{]*{[^}]*flex: *1` lacking `min-width: *0`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`slider-value-announced-as-its-position`** (NEW S456; `0ca1e29b`): ACTIVE, streak 0. Detection: `f456/census.mjs` (readout numbers lack the value, no `aria-valuetext`).

- **`ltr-machine-text-field-typed-rtl`** (NEW S454; `b1eb9659`, 4 carriers): ACTIVE, streak 0. Detection: `type="email|url"` (or JS `.type`) without `dir="ltr"`; a translated placeholder adds `:placeholder-shown { direction: inherit }`.

- **`pre-ready-interpolated-write-never-healed`** (NEW S453; `728e4075`; **S454 `ab9a133e`**): ACTIVE, streak 0. Detection: `i453/gates.mjs` `LDELAY=700`; `h454/ttver.mjs`.

- **`cdn-library-parser-blocking-for-one-action`** (NEW S452 D; generator `82bbe313`, FM `d01a33cd`): ACTIVE, streak 0. A parser-blocking CDN `<script src>` in `<head>` for one action. Detection: `grep -n '<script[^>]*src="https\?://' *.html | grep -v ' async\| …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-navy-fill-matches-its-ground`** (NEW S450 M; flash ×2 `c9e2bc2b`, `68055510`; S451 census: dictionary `5deb5472`, generator `f9ca0909`; S464 keyboard block ×4 `f98367f8`): ACTIVE, streak 0. Detection (`g451/navy.mjs`): every visible …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ring-below-3-on-light`** (NEW S442; FIXED on 14 pages `91fede71` + 3 modules `a46342c1`; S443 the last two non-outline rings, FM `e05b25d1` + torah's fav dot `1c320ae8`): ACTIVE, streak 0. A focus outline drawn in `--gold` (2.1–2.75:1 on the light surfaces). Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tip-escape-drops-focus`** (NEW S441; all 5 carriers FIXED `97c54dfb`): ACTIVE, streak 0. A keyboard tooltip whose Escape calls `blur()` drops the focus to the body, and an unstopped Escape closes the drawer under it. Detection (scratchpad `c441/v2.mjs`): Tab onto a visible …[full text: IMPROVEMENT_ARCHIVE.md]

- **`account-wide-delete-confirm-without-signed-in-wording`** (NEW S435 P; flash's result delete FIXED `e56d95be`; the colour reset ×5 OPEN, gate 2): ACTIVE, consequence-adjacent (a teacher reads a deletion as local), streak 0. A `confirm()` before a delete/reset of a synced …[full text: IMPROVEMENT_ARCHIVE.md]

- **`logical-inset-mirrors-onto-pinned-content`** (NEW S440; FIXED `23b7bb0f`): ACTIVE, streak 0. A logical inset over physically pinned content lands on it in Hebrew. Detection: HE, text Range rects ∩ the control's box.

- **`tip-name-joins-its-field's-name`** (NEW S430; generator `10a0c18f`; torah ×3 `d477e15c`; S488 dashboard `f722eeba`): ACTIVE, streak 0 (no open carrier). A `<label>` holding a `.tip-wrap` names its field "… More information". …[full text: IMPROVEMENT_ARCHIVE.md]

- **`panel-title-keyed-on-an-inner-span`** (NEW S429; S439 generator FIXED `1ce9eabd`, torah stale — no collapsing panels left): ACTIVE, streak 0. Detection: a `.panel-title` with no own `data-i18n`, then toggle + reload.

- **`copy-claims-success-on-a-refused-clipboard`** (NEW S428; FIXED `bbd5f65`, `0d2a941`; S444 index `90e1a057`, dashboard `18344f69`; **S445 generator `3dad5c11`, flash `58ee7a4f` — all 7 carriers fixed, 0 open**): ACTIVE, streak 0. Detection: every `execCommand('copy')` whose …[full text: IMPROVEMENT_ARCHIVE.md]

- **`button-focus-lost-to-its-own-rebuild`** (**S488 trope Try again ×2 `183605ba`; S483 hub `ab1a235e`; S474 flash Return to Options `3235f8eb`; S473 flash start `3e8e2f79`, torah tune radios `9fbcfce8`; S471 dashboard `c0c5856e`; S470 torah favorites `fc3ec234`; S469 generator …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-literal-escapes-the-print-tokens`** (NEW S437 G; resources FIXED `5320a668`): ACTIVE, streak 1 (S479 trope clean; plant fired). Detection: PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.dark` literal the print …[full text: …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`editor-re-parse-caps-a-merged-list`** (**NEW S421 Pass P — 1 carrier, FIXED `288af4a`**): ACTIVE, consequence-critical (a sync carries the cut list to the account); never retires. A list the sync merges uncapped is re-parsed by its tool's editor or restore path through the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`window-taller-than-a-phone-without-a-scroll`** (NEW S476 N; FM `fe808b64`): ACTIVE, streak 0. Detection: `n476` `modalFit` on an SE + 13 landscape, a tapped last button; plant 900px. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`install-banner-over-a-sheet's-bottom-controls`** (NEW S420 N, hub `f44a17e`; **S472 generator bar `8081fc83` (pwa.js `--pwa-banner-space`), FM's 16 windows `56c7a179`; S476 torah gallery `30fcc886` — no open carrier**): ACTIVE, streak 0. Detection: `a472/banner2.mjs` (sheet …[full text: IMPROVEMENT_ARCHIVE.md]

- **`flash-restores-captured-text-not-its-key`** (NEW S417 — 2 FIXED `1f7f869`; S415 `38e5b62`): ACTIVE, streak 0. A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash. Detection: `orig = (btn|lbl)\.(textContent|innerHTML)` + …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`visible-label-missing-from-the-accessible-name`** (S415–S425: 4 fixes; **S427 the dictionary's Word Lists windows `ee5f6f2`**): ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 `c427/probe-dlgname.mjs`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`designed-key-miss-probed-through-t`** (NEW S415; FM `gName()` FIXED `95d5f46`): ACTIVE, streak 1 (S416: 0 on the delta). Detection: `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.has`.

- **`pinned-english-without-lang`** (NEW S415; 20 FIXED `f4bbfe8`; S422 resources ×43 `8c56a89`; torah/trope open): ACTIVE, streak 0 (S416 `a416/pinned.mjs`: only those). Detection: HE UI, `closest('[lang]')` of each pinned-English element = "en"; control: a planted span …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`toggle-name-flips-with-its-pressed-state`** (NEW S414 `f9e67b2`; S416 trope tune `96275c2`; S430 found torah's Trope staff Tune all + every verse Tune; **S431 FIXED `aa97e2e`**): ACTIVE, streak 0 (last swept S430). Detection `f414/toggles2.mjs`: real click per …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`author-display-defeats-the-hidden-attribute`** (S414 `391114b`; S416 FM `3bf0112`; S425 trope ×2; S430 torah ×2; **S472 torah lookup `306003c3`**; S472 detection `a472/hidrec.mjs`): ACTIVE, streak 0. Detection: rendered `[hidden]` with display ≠ none (S430 …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`button-group-label-not-programmatic`** (**NEW S413 Pass C — resources ×8 rows FIXED `945b397`; generator, dictionary, hub unmeasured (no `role="group"` at all)**): ACTIVE, streak 0. A row of `aria-pressed` buttons sits under a visible label (a `<span>`, or a `<label>` with …[full text: IMPROVEMENT_ARCHIVE.md]

- **`settings-lost-across-a-load`** (NEW S412; flash ×2, dictionary ×4 FIXED S482 `8d99ad93`; 1 P4 open): ACTIVE, streak 0. A setting comes back changed after a reload. Detection (`h482/dictsave.mjs`): change each control by a real click, wait out the save, reload, require it …[full text: IMPROVEMENT_ARCHIVE.md]

- **`live-region-display-none-while-empty`** (S408; **all 4 FIXED `efbc98a` S409**): ACTIVE, streak 0. Detection: `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit); flex-wrap rows need `position:absolute`, not height.

- **`dark-base-rule-outranks-variant`** (S408; FIXED `4a5d353`, `b26f7d6`; EXEMPT the dead `.preset-item.drag-over` ×2): ACTIVE, streak 0. Detection: `m408/darkvariant.py` (comments stripped), then drive the state by a real click in both themes.

- **`aria-disabled-lock-no-handler-checks`** (**NEW, registered 2026-09-23 (S407 Pass P) — 1 carrier, fixed `e5c4784`**): ACTIVE, clean streak 0. A control marked busy or invalid by `aria-disabled="true"` whose activation handler never reads that state: the look says locked, a …[full text: IMPROVEMENT_ARCHIVE.md]

- **`text-field-under-16px-zooms-on-ios-focus`** (NEW S406; FIXED ×2; S465 contact ×4 `5a7a8ed`; S488 +2 in the dashboard's gated drawer): ACTIVE, streak 0. Detection: computed `font-size` < 16px under an iPhone descriptor; plant a 12px field.

- **`textContent-rewrite-erases-a-control-icon`** (S405; S415; **S453 `ac796dba`**): ACTIVE, streak 0. Add (d): load-time icon count. Detection: (a) EN→HE→EN icon count; (b) key census …[full text: IMPROVEMENT_ARCHIVE.md]

- **`english-literal-passed-to-a-message-helper`** (NEW S475): ACTIVE, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`translated-key-exists-page-hardcodes-english`** (S461 K: 1 FIXED `74b2ee0c`, dictionary Bulk Copy count; streak 0. S433 K: 0 new — the orphan census 121 raw, 86 with a live English twin, all S405/S419 classes; the delta's surfaces by a runtime EN-in-HE detector, 3 …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`per-page-code-inside-a-shared-block`** (**NEW, registered 2026-09-22 (S403 Pass E) — 2 carriers, both fixed `6e28af3`**): ACTIVE, clean streak 1 (S416). Page code pasted INSIDE a `═══` block instead of below its end …[full text: IMPROVEMENT_ARCHIVE.md]

- **`icon-markup-into-a-textContent-writer`** (**NEW, registered 2026-09-22 (S403 Pass E) — 1 carrier (2 buttons), fixed `7552ba0`**): ACTIVE, clean streak 0. An `ICON_*`/`FT_ICON_*`/`HK_ICON` SVG const reaches a helper that writes `textContent`, so the button prints its SVG …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`physical-property-that-never-mirrors`** (registered S388 K; S438 torah's jump bar `947b452d`): ACTIVE. A physical `margin-`/`padding-`/`border-left|right`, `left`/`right` inset, `text-align:left|right` or `float` on content that mirrors under `dir=rtl`. **Detection:** grep …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S444 (Pass A): 1 NEW carrier FIXED `2854e747` — torah's Favorites: a string row threw on Recolor/Duplicate (strict mode); streak 0.** **S379: a SCALAR sibling FIXED (`4f9a2e7`, the shared `.ivrit` engine's `setIvritMode` …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **`sub-floor touch target`**: ACTIVE. **S483 hub clean.** **S456: `85e294b2`, `924c9407`.** **S449: the emoji ▾ + rows FIXED `1ae29189` (the S427 carrier closed). S429: `.wm-mini` FIXED `359e0e2`.** …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**REOPENED S413 Pass C — a 3rd carrier the CSS grep could not see: contact's script-written success line, `var(--gold)` 2.75:1 on light, FIXED `f40d142`; open: the generator's `sub.style.color` (A's)**): ACTIVE, streak 0. …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S458 FM `fitScale` `2bb2ead0`; S374 torah, trope.** Open 0, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (NEW S277; FIXED ×3; contact's server note open): ACTIVE, streak 0. Detection: Range x-order of the phrase and its period in the HE UI; exempt lists, single runs, print.

- **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value**: ACTIVE, clean streak 0. **S475: 2 FIXED `ca67ec0d`.** **S447 (K, `k447/stale.py` html.parser census, plants 2/2): 4 hits = S432's …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **contrast-below-AA-on-a-tinted-or-coloured-plate**: **S488 dashboard ribbon `5da9ecbe`.** **S422: torah's vowel Letter on the trope tint FIXED `e55b811` (1.85:1; streak 0).** …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **parse-per-call on a growing store** (a helper re-parsing a whole localStorage blob on every call, called once per item, so the cost grows with the teacher's saved work): ACTIVE, consequence-critical (a freeze that scales with use reads as data loss). Hits: flash …[full text: …[full text: IMPROVEMENT_ARCHIVE.md]

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

- P accounts & cloud (one surface): 2026-10-08 (**S477 — 8th P, the hub's own wiring (S463's P-next): smoke-tools 21/21 (plant 20/21), sync 207, migration 47; H1–H8 on a fake cloud by real clicks; static 23/23 (plants 9/9); live read-only. FIXED 2 on the hub. P-next: torah (never alone).**)

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html`. ⚑ BLOCKED HERE TWICE (S399, S403) — NOT "needs an attended session". Clone + the 4 parsers install fine; EXECUTING the detector is refused by the sandbox's auto-mode classifier ("Code from External"), and the refusal names the remedy: the maintainer adds a Bash permission rule for the detector (or …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-10-08 (**S476 — 23rd N, FM (S290 →): 632 views, 4 phones, partner path, touch, 4×; plants fired. FIXED 4. N-next: dictionary (S303).**)

- M aesthetics & visual design (one surface): 2026-10-08 (**S478 — 23rd M, contact (S291 →): 140 shots, census, plants; FOUND 5 + 8 headers scrolling sideways; FIXED 2. M-next: privacy/terms.**)

- K i18n / localization audit: 2026-10-08 (**S475 — 32nd K: FIXED 4.**)

- C accessibility (one tool): 2026-10-09 (**S483 — hub (S340 →): 8 census cells + modal + chip menu, 4 Tab walks, 11 keyboard scenarios ×2, motion, hover, 1.4.12, 320, phone; plants fired. FOUND 2, FIXED 2 (+ torah, FM). C-next: dashboard (S354).**)

- A recurring-pattern sweep: 2026-10-09 (**S488 — 38th A on `eb806705..fee5fe0` (78 commits): 44 static arms, a 14-page battery, the new dashboard surfaces by real input; plants fired. FOUND 5, FIXED 2 (+ trope, FM).**)

- G print & export fidelity (one tool): 2026-10-08 (**S479 — trope (S351 →): 96 PDFs, variants, every tab, the .ivrit; plants 4/4. FOUND 6, FIXED 2. G-next: dashboard (S364).**)

- D performance (one tool): 2026-10-08 (**S480 — trope's 5th D (S365 →, 86 commits): 10 cold + 4 interaction cells by real input; controls fired. CLEAN: 0 page-code tasks >200 ms (worst 127 @4×); only the browser's PDF. D-next: dictionary (S378).**)

- I first-load & empty-state: 2026-10-08 (**S481 — 36th I: 136 cells clean, plants fired; label + side-word arms NEW; FIXED 4.**)

- B console/error audit: 2026-10-09 (**S487 — 37th B on the S471 delta (73 commits): 68 load cells (8 controls fired) + the delta by real input on every page, the i18n retry, the install banner (findings S487). All 0; one P4 logged for K.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-10-08 (**S474 — 25th L on `a2cf7f8..4326086a`: `l474/` (20 arms), 21 plants fired, tree 0; 3 FAQ blocks moved, all true. FIXED (gate 2): Torah's stale "Enable karaoke" step; its snippet.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-10-08 (**S482 — torah (S336 →): 4 lessons, EN + HE, phone. FOUND 4, FIXED 2 (+2 dictionary). H-next: contact (S350).**)

- E freshness/site-health: 2026-10-08 (**S473 — 37th E on `665d7b56..c5bfca3c` (107 commits, 113 files): 30 arms, 17 plants fired (findings S473). FOUND + FIXED `df0fdc21`: torah-and-trope.md named 2 removed functions; README's 2 corpus sizes.**)

- F cross-tool consistency: 2026-10-09 (**S484 — 36th F, the toast contract on all 8 carriers (5th look, S111 →): 24 cells + reduce, width, bars; plants 4/4. FOUND 4, FIXED 3 (+ FM kerning). F-next: the tabs / segmented-control keyboard contract (never swept).**)

**Next session (S489):** **BRANCH/PR: `claude/nifty-cray-0dvnxz` → draft PR #320 (S488): open → continue; merged → restart from `origin/main`.** `sw.js` **v969**, FM **5.59**. ⚑ Stalest: E (S473), L, K; O blocked. ⚑ Untaken: dashboard header gates, Now/Next tracking, FM crop caption (P4s). ⚑ Seeds: 47 (gate 1). ⚑ Maintainer: re-stage 14 fonts; torah on a screen reader; week cycles: an A/B school's eyes.
