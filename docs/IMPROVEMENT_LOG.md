# IvritSuite Improvement Log

The memory of the continuous-improvement loop. **Read this first every session.** One concern per
iteration, one commit per iteration. Prioritization: P1 (data loss/security/broken core/export
corruption) > P2 (silently wrong output/undo holes/a11y blockers) > P3 (perf/dead UI/confusing
copy/consistency) > P4 (polish). Tie-breakers: (1) affects teachers' saved work, (2) affects the
printed/exported artifact a student receives, (3) dual-audience (Hebrew + secular) wins, (4) smallest diff.

## Candidates (prioritized, top = next)

- [ ] P4 (**NEW S541 C — pattern**) | 7 pages | **A pressed or selected state vanishes in High Contrast** (findings S541). | found S541

- [ ] P4 (**NEW S541 C — gate 3**) | 14 pages | **Field edges are `--border`: 1.83:1 light, 1.22:1 dark** (1.4.11: 3:1). | found S541

- [ ] P4 (**NEW S540 H — gate 4**) | parsha_emojis.html, letter_learner.html | **At ≤800px the bulk-print popup's preview sits under every option** (PE 1.6k px down at 800, 2.7k on a phone; LL 1.0k / 1.8k). | found S540

- [ ] P4 (**NEW S539 I — gate 2**) | letter_learner.html | **The cursive tour's card step names neither the Vowels nor the Fonts tab** every cursive card shows. | found S539

- [ ] P4 (**NEW S538 D; S539 re-measured**) | parsha_emojis.html | **A size drag relays out all 54 preview sheets per value** (≤57 ms @1×, ≤232 @4×); the refit after it ≤674 @4×. | found S538

- [ ] P4 (**NEW S538 D**) | parsha_emojis.html | **40 copies × 4 per sheet clone 240 sheets into the preview** (1.3 s @4×). | found S538

- [ ] P4 (**NEW S538 D**) | parsha_emojis.html | **The first open still measures every drawing** (~950 ms @4×); build the geometry with the icons. | found S538

- [ ] P4 (**NEW S537 G — gate 2**) | parsha_emojis.html | **With every sheet shrunk (landscape, Both) the popup's note names all 54 parshiyot** (539 chars). | found S537

- [ ] P4 (**NEW S536 M — gate 3**) | letter_learner.html | **A final-form card's glyph and name sit 10px above its row-mates'.** | found S536

- [ ] P4 (**NEW S536 M — F's**) | suite-wide | **In dark mode an unticked checkbox or radio is a white square.** | found S536

- [ ] P4 (**NEW S534 N — gate 4**) | name_tags.html | **On a phone Remove sits 120–270px off-screen** until the table scrolls. | found S534

- [ ] P4 (**NEW S535 P — gate 2**) | classroom_dashboard.html | **Four confirms on synced data lack the `_cloud` wording** (text sizes, intermission, a day, a period). | found S535

- [ ] P4 (**NEW S530 A — glyph census, rule first**) | dictionary, resources, flash, torah, FM, index | **Category and option emoji are still heard** (findings S530): content or decoration is unruled. | found S530

- [ ] P4 (**NEW S523 G — gate 3**) | hebrew_dictionary.html | **A long one-word headword overflows its card** (paper and phone). | found S523

- [ ] P4 (**NEW S522 M — gate 4**) | parsha_emojis.html | **On a phone (≤600px) Print still takes a row of its own** (EN 390: four rows). | found S522

- [ ] P4 (**NEW S522 M — gate 3 since S524**) | parsha_emojis.html, torah_trainer.html | **This week's badge drops its card's name 23px below its row-mates'**: on the border it needs ~9.5px of a 12/10px row gap (findings S524). | found S522

- [ ] P4 (**NEW S522 M — gate 3**) | parsha_emojis.html | **Today's lone card stops at 840px under a 1052px heading rule.** | found S522

- [ ] P3 (**NEW S510 D; shared sw.js — the maintainer's call**) | sw.js | **Pages, scripts and /locales/ are fetched with cache:'no-store', so a returning visitor re-downloads ~370 KB per page view although GitHub Pages answers 304**; `'no-cache'` keeps always-revalidate and made the same reload 0 B (findings S510). | found S510

- [ ] P3 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Nothing says a preset, the remembered setup or an `.ivrit` file made under "Imported List" keeps no words** (memory-only; *Save as Word List* exists for this): the reopen shows an empty pool + the "No words match" note. A share link does carry them. | found S512

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Real Words Matching prints "Hebrew Word Matching", ignoring the Title field** the other sheets honour. | found S512

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Name the Letter and Tracing print the default title "Hebrew Blends"** (only the subtitle is per-type). | found S512

- [ ] P4 (**NEW S512 H — gate 2**) | hebrew_blend_generator.html | **Name the Letter counts letters × vowels ("36 possible combinations" for 4 bare letters)**; Vowels Only blanks it. | found S512

- [ ] P4 (**NEW S512 H — design, gate 2**) | hebrew_blend_generator.html | **A quick start replays the full defaults, dropping the chosen word list and source.** | found S512

- [ ] P4 (**NEW S508 M — gate 2**) | dashboard | **"+ Add period" beside two icon buttons; "✨ Quick-start layouts…"** — the glyph belongs in the markup. | found S508

- [ ] P4 (**NEW S503 E, gate 2**) | torah_trainer.html | **Total Torah on: Chant says "(PocketTorah audio)"** (`verse_chant_aria`). | found S503

- [ ] P4 (**S502 A — radio-set twin**) | dictionary, resources | **Unnamed pressed rows**: dictionary mode, resources view (gate 2). | found S502

- [ ] P4 (**NEW S497 I — gate 2**) | classroom_dashboard.html | **A Hebrew first visit's demo message is English** (`DEFAULT_PRESET`, a `smoke-sync` canon). | found S497

- [ ] P3 (**NEW S492 N — needs the tour-engine extraction, UX rule 1**) | 7 tools' tour engines | **A tour does not follow a rotation**: `resize` re-places the card but never scrolls its target back; 4 of 7 dictionary steps strand it off-screen (findings S492). | found S492

- [ ] P4 (**NEW S492 N — tour engine**) | hebrew_dictionary.html | **The tour ring runs past the window on a full-width target**: `_tourReposition` clamps `left`, not the width. | found S492

- [ ] P4 (**NEW S483 C — gate 2**) | index.html | **Three `alert()`s stay**: "Use in all tools" repeats the status line; the Manual pane's two validation messages have no inline line (`#ivritStatus` is in the Automatic pane). | found S483

- [ ] P4 (**NEW S482 H — gate 2**) | torah_trainer.html | **"Select verses to copy…" opens the Copy bar with selection off** (as documented): one more click; a verse clicked meanwhile chants. | found S482

- [ ] P3 (**NEW S480 D — verify first**) | torah_trainer.html | **Off-screen verses (`content-visibility:auto`) leave Chromium's accessibility tree** (test page 37/200): a screen reader may stop at the rendered ones; check with a real one (findings S480). | found S480

- [ ] P4 (**NEW S481 I**) | FM, i18n.js, flash, terms | **FM help's old layout; raw keys if a locale never loads; "Click Start", "use my location"** (findings S481; gate 2 ×2). | found S481

- [ ] P4 (**NEW S479 G**) | trope_tutor.html | **Paper waste: Phrases 9–12 sheets at ~4 cards; 2 Letter charts end on the credits alone, EN Learn on one card.** | found S479

- [ ] P4 (**NEW S479 G — gate 2**) | trope_tutor.html | **Only the Haftarah note says the Phrases tab has no examples** (Esther, Megillot, Eicha lack them too). | found S479

- [ ] P4 (**NEW S478 M**) | 6 chrome headers | **A phone header leaves the star alone on a row** (EN contact ≤396, account ≤474). S489: a title beside the star stacks 3 lines at 320 (taller) — gate 3. S520: privacy/terms' dark toggle alone on a 3rd row at 320. | found S478

- [ ] P4 (**NEW S478 M**) | 6 chrome footers | **A "·" ends a footer line below ~700px.** S489: no CSS-only fix; a bound dot starts the line instead — gate 3. | found S478

- [ ] P4 (S476 N) | Hebrew_Font_Maker.html | **Guides reorder by drag only** (`attachGuideSortable`). | found S476

- [ ] P4 (S476 N — gate 4) | hebrew_blend_generator.html | **On desktop the Generate bar covers 1–3 footer FAQ rows at the page end** (phones fixed `dbf2d7a0`). | found S476

- [ ] P2 (**NEW S465 G — maintainer**) | starting-fonts/manifest.json | **14 fonts' `copyright` is empty**: re-stage with `/addOSFont --force` (detector fixed `3609c19`; ids: findings S465). | found S465

- [ ] P4 (**NEW S466 D**) | js/ivrit-saves.js | **A fresh device's first signed-in load rewrites the whole sync memory once per row** (tasks 50→340 ms, settled in 47 s @4×, 410 rows) and fetches each row by its own GET (457). | found S466

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Sephardi haftarot and the holidays' maftirim are not offered**: `holiday-readings.json` carries `seph` and `fullkriyah.M` for every entry the table keys (the leyning builder's check could carry them). | found PR #313

- [ ] P4 (**NEW PR #313**) | torah_trainer.html | **Shabbat Chazon's haftarah (Isaiah 1) is drawn in the Haftarah chart throughout**; the verses customarily chanted to Eicha's tune need a per-verse tune. | found PR #313

- [ ] P4 (**NEW PR #313**) | classroom_dashboard.html | **The dashboard's parsha line never names a special Shabbat** (Zachor, Parah, Shekalim…) though `HebCal.specialShabbat` now answers by date. | found PR #313

- [ ] P4 (**NEW 2026-10-03, gate 2 copy**) | hebrew_dictionary.html | **"Any of these letters" requires every ticked letter** (`onFilter`); the Hebrew label (כל אחת מהאותיות האלה) says so, the English label and its "Any:" chip don't. | found 2026-10-03

- [ ] P4 (**NEW S452 D — G's**) | hebrew_blend_generator.html | **"N pages to print" counts a caller sheet as one page**; an 8-card set's takes 3 (says 3, sends 5). S497: not small (findings). | found S452

- [ ] P4 (**NEW S452 D — gate 2**) | hebrew_blend_generator.html | **jsPDF re-decodes each PNG page in JS** (561–660 ms a bingo page, 1.85 s a caller sheet); JPEG skips it but is lossy. | found S452

- [ ] P3 (**NEW S451 G — gate 2, the maintainer's call**) | torah_trainer.html | **In the Trope staff layout the student handout ignores Font size and "Hide cantillation"**: the staff prints at screen scale (Hebrew 27.4pt, Large and Extra large alike) and its notes carry every trope; either print a text layout or say so beside the options. | found S451

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **A theme saved over 200 words drops its A→Z tail** (Animals loses fox, octopus, chicken…). | found S440

- [ ] P3 (**S440 H, gate 2**) | hebrew_dictionary.html | **"Words from this root" calls the word's letters its root** on 9,321 words (findings S440). | found S440

- [ ] P4 (**NEW S437 G — gate 2, copy**) | index.html | **Import All Settings' confirm still says it "will overwrite your current dashboard settings and merge … presets and schedules"**; it merges every tool's data. | found S437

- [ ] P3 (**NEW S436 M — layout, gate 3/4**) | hebrew_blend_generator.html | **The bingo preview is unreadable in a narrow window**: at 800px a 4-up card is ~120px and its blends overrun their cells (print/PDF fine since `141aa8f7`). | found S436

- [ ] P4 (**NEW S436 M**) | hebrew_blend_generator.html | **Export PDF below 700px still carries the phone rules** (stacked header, Hebrew at 0.75×) (`141aa8f7` pins only the width). S495: size from the clone (findings). | found S436

- [ ] P4 (**NEW S448 N — gate 2, new copy**) | torah_trainer.html | **The one-time tip says "click any Hebrew word" on a touch phone** (the Hebrew "לחצו" covers both); a `tap` twin under `pointer:coarse` is new copy. | found S448

- [ ] P4 (**NEW S447 K — the corpus's shva slips, the doubled-yod half FIXED `a86b5a16`**) | data/hebrew_emojis.json | **Some transliterations read a silent shva as a vowel or drop a voiced one** ("seport", "michnsey gi'yns", "mistovvim"); a corpus edit with a `?v=3` bump, best done as a reviewed list. | found S447

- [ ] P4 (**NEW S435 P — gate 2, new copy ×5**) | dashboard, generator, torah, dictionary, flash | **The vowel-colour reset confirm names no account-wide effect while signed in**, though all five reset overrides that travel. | found S435

- [ ] P4 (**S430 A — the maintainer's call**) | torah_trainer.html | **The reading header keeps "Aliyah {n}" English in the Hebrew UI** beside a translated cycle label (also the copy heading, the handout). | found S430

- [ ] P4 (**NEW S421 Pass P**) | classroom_dashboard.html | **The "Now showing {name} — the classes from your account are in the class list" switch runs on every signed-in load and credits the account even when it holds nothing** (**S450 attempt reverted**: needs the landed ids; findings S450) | found S421

- [ ] P4 (**NEW S421 Pass P — for H**) | classroom_dashboard.html | **A class list beyond the picker's cap keeps its names now (`288af4a`) but the picker draws only the first 60 chips** (`rosterNames()` slices), so students 61+ of a merged class are stored and counted ("65 names (max 60)") yet never picked; say so in the drawer or raise the chip cap. | found S421

- [ ] P3 (**NEW 2026-09-26**) | trope_tutor.html (trope_index.json) | **8 Learn example clips sit where PocketTorah's taps slip by a word** (`build-trope-phrases.mjs` TIMING_SLIPS), so each likely plays a neighbouring word; the index builder could skip those verses. **S454: not small** (findings S454). | found 2026-09-26

- [ ] P3 (**NEW 2026-09-26**) | torah_trainer.html | **The karaoke highlight likely runs a word off in the 19 TIMING_SLIPS stretches** (Shemini 6 from Leviticus 11:8 on), where a timing file slips while its count still matches. | found 2026-09-26

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **The first transliteration of a reading is still one long task**: ~600 ms @1× / 3.3–4.1 s @4× on a full parsha, the library ~93% (profiled); fill the rows in idle chunks or a worker. `40c5154` fixed every re-render after it. | found S424

- [ ] P4 (**NEW S424 Pass D**) | torah_trainer.html | **Side by side with a translation is layout-bound at 4×**: re-renders 450–930 ms (≤280 @1×), ~80% style/layout; long-standing (the S307-era page 461–676 on the same stub); interlinear ≤195. | found S424

- [ ] P4 (**NEW S422 Pass M — five small ones; (1) FIXED S446 `0daed724`, (4) FIXED S448 `0f9ddbe1`**) | torah_trainer.html | **(2)** drawer segments break mid-label at 380px; **(3)** Audio tracks start ragged; **(5)** "Custom range…" has no icon. | found S422

- [ ] P4 (**NEW S422 Pass M — gate 3 / gate 2**) | torah_trainer.html | **(1)** dark Chant all is 1.1:1 on the page; **(2)** Hebrew-only side by side keeps an empty half; **(3)** "עִבְרִית" in Libre Baskerville; **(4)** gate 2: the Audio help's 🔊 / 🎵, not the icons. | found S422

- [ ] P4 (**NEW S418 — the maintainer's dashboard**) | Supabase project | **Security advisor: leaked-password protection is off**; passwords are never used (e-mail code + Google), so enable the toggle or accept it as moot. | found S418

- [ ] P4 (**NEW S412 Pass H — five small ones; (1) FIXED S446 `c6c509ed`, (3) FIXED S448 `c54897da`, (4) FIXED S491 `adce6574`, (2) FIXED S497 `591a11ef`**) | flash_cards.html | **(5)** gate 2: the printed card …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S413 Pass C — gate 3**) | 404.html | **The lost star wanders forever with no pause** (WCAG 2.2.2); only reduced motion stops it. | found S413

- [ ] P4 (**NEW S414 Pass F — gates 2/3 + K**) | chrome pages, the 7 tools, 404, CSV | gate 2: **(1)** dark mode's visible "Light", and FM's fullscreen "Show/Hide Panels" (S415), are not in their fixed toggle names (2.5.3); **(2)** "Back" goes to the home page (tools say "Home"); **(3)** 404 lists 4 of 8 tools. Gate 3: **(4)** Tour / Dark / Full Screen / Settings order differs per tool. K: …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S411 Pass I — K's**) | Hebrew_Font_Maker.html | **QA Check's outline warning names a glyph by its JS-built English `name` in the Hebrew UI** ("A (uppercase)"; the English, Cyrillic, Phoenician and Aramaic tables build `name` with no key, e.g. "Д (Cyrillic de, uppercase)"). | found S411

- [ ] P3 (**S410 D; S480 re-measured; `content-visibility` reverted**) | Hebrew_Font_Maker.html | **The Spacing tab rebuilds all kerning rows on each show, pair click, add and delete**: 2,000 pairs 213–251ms @1×, 1.0–1.2s @4×. Next: a pair click rebuilds the editor only (findings S480). | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **Continue runs a synchronous `autosaveNow()` inside the click's task** (88–114ms of 575–616ms @4×), re-saving the snapshot it just restored. | found S410

- [ ] P4 (**NEW S410 Pass D**) | Hebrew_Font_Maker.html | **The partner wizard's Create re-renders every grid once per setter** (`setMarkEnabled` ×2, `setAddEnglishLetters`, `setInputMode`…): 3 tasks of 465–678ms @4×, top 146–201ms @1× (engine blocked; with it, Pyodide's own blocks dominate). | found S410

- [ ] P4 (**S394 census, retuned S395 — `04892f3` took the three SHADOWED ones that were accidents; what is left here is judgement, not dead code**) | hebrew_blend_generator.html | **The `.bingo-card-num` / `.bingo-grid` IDENTICAL twins and the `.bingo-card` SHADOWED one sit inside a deliberate later layer that re-declares the bingo shapes in print-safe literals, and `body.dark …[full text: IMPROVEMENT_ARCHIVE.md]

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

- [ ] P4 (**NEW S323 Pass H — GATE 2 copy; deferred unattended**) | index.html (`locales/ui-strings.csv`) | **The Manual-input import's confirm and success copy still describe the pre-AllTools dashboard-only import:** `home.alltools.import_confirm` "This will overwrite your current dashboard settings and merge all imported presets and schedules" and `home.alltools.import_success` "Import …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S321 Pass N arm 5 — on-screen keyboard ergonomics; the copy half is GATE 2**) | classroom_dashboard.html | **`#timerCustomInput` is `inputmode="numeric"` with an `MM:SS` placeholder, and the iOS numeric pad has no colon.** `timerSetCustom` also accepts plain digits as whole minutes, so the field works for "5" but the placeholder promises a format the keyboard cannot type. Either …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**NEW S319 Pass L — the inverse arm's whole-corpus hit; GATE 2 (copy), deferred unattended**) | index.html (+ every tool page) | **The Hebrew-language interface is claimed NOWHERE a crawler can see.** `js/i18n.js` landed 2026-07-11 and every page ships a visible EN/HE switcher, yet 0 of 14 pages carry interface/bilingual/"in Hebrew or English" vocabulary in `<title>`, description, OG, …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P4 (**S311 Pass O — filed out of O; S335 M re-measured both M halves**) | `Hebrew_Font_Maker.html`, the help popup | **The help tab strip is 14 chips over 3 rows, 96px, crossed before any content on every tab at every width (the modal is max 640px, so 800 = 1280)** — a restructure (grouped tabs or a select) is gate 3; screenshots `m335/1280-light-en-help.png`, `m335/800-light-en-help.png`. …[full text: IMPROVEMENT_ARCHIVE.md]

- [ ] P3 (**NEW S292 Pass H — the pass's headline finding; GATE 2 ASKED, maintainer chose "log it only, change nothing"**) | hebrew_dictionary.html | **"⭑ Save as Word List…" is discoverable only from a theme.** Word …[full text: IMPROVEMENT_ARCHIVE.md]

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

## In progress

_(none)_

## Done

- [x] 2026-10-22 | (S541 close-out) | branch/deploy note | **S541 = C on parsha_emojis: FOUND 6, FIXED 4.** On #357; no drift. sw v1069→v1070; no FM bump. Deferred: gate 3.

- [x] 2026-10-22 | `063cbec5` | parsha_emojis | (S541) **A short window unpins the view bar.** | 200% zoom 0.48 → 0

- [x] 2026-10-22 | `76049ae7` | LL | (S541) **Mode and tab show in High Contrast.** | 0/3 → 3/3; 0/4 → 4/4

- [x] 2026-10-22 | `2ad22355` | js/i18n.js | (S541) **Switcher options carry `lang`.** | 0/40 → 40/40

- [x] 2026-10-22 | `94c605ee` | parsha_emojis | (S541) **The pressed view shows in High Contrast.** | 0/7 → 7/7

## Metrics

### Per-session log (one line per session)

- 2026-10-22 | **S541** | iters: 5 | tools: parsha_emojis ×2, LL, i18n.js, sw.js | patterns fixed: selected-state-lost-in-forced-colors ×2 | pass run: C | SW: v1069→v1070

### Tool coverage (last-touched date per tool)

- **Snapshot S541 (2026-10-22):** parsha_emojis, LL, i18n.js, sw.js S541 · CSV S540 · name_tags S539 · flash, torah, trope, FM S538 · 5 toast pages S537 · saves, resources S536 · scripts S535 · index, README, sitemap S532 · account, contact, privacy, terms, 404 S530 · corpus S524 · pwa S472.

### Pattern health (per recurring pattern: last swept, hits that sweep, consecutive clean sweeps; detail in the sweep log below)

- **`selected-state-lost-in-forced-colors`** (NEW S541 C; ×2 fixed; open: 7 pages): ACTIVE, streak 0. A state drawn only by colour flattens in forced colours. Detection: `c541/fcensus.mjs`, then computed styles.

- **`live-region-shown-with-its-text`** (NEW S537; `61762cf` ×8, `6d095c0` ×3): ACTIVE, streak 0. A status region made or un-hidden with its first message. Detection: findings S537 (grep + CDP).

- **`abs-child-escapes-its-scroller`** (NEW S534 N; `f7c4981`): ACTIVE, streak 0. An absolute `.vh` escaping its `overflow` box widens the page. Detection: `n534/escape.mjs`.

- **`empty-result-not-announced`** (NEW S528 F; resources ×2 `34ae261b`; S529 dictionary roots `28a52123`; open 0): ACTIVE, streak 1 (S530: no new no-match surface). A no-match landing no live region speaks. Detection: `f528/empty.mjs`; `b529/fix1.mjs` (real typing, live text …[full text: IMPROVEMENT_ARCHIVE.md]

- **`print-trailing-padding-adds-a-sheet`** (NEW S526 H; account S523, LL `198ccfac`): ACTIVE, streak 1 (S530 `a530/pcs.mjs`). Detection: `h526/fix1.mjs` (a header-only or empty PDF sheet).

- **`unseen-hit-box-over-controls`** (NEW S527 C; LL `82a3f0b2`): ACTIVE, streak 1 (S530 `a530/rt.mjs`). An unpainted box over a control eats its clicks. Detection: `c527/cover3.mjs` + a real click (`swallow.mjs`).

- **`layout-read-per-grid-at-build`** (NEW S524 D; `roveTileGrid` ×3 FIXED `aa14beba`; open 0): ACTIVE, streak 0. A builder's layout read (`offsetParent`, a rect) per grid while the page still builds. Detection: `d524/trace.mjs` (forced Layout by stack line).

- **`dark-palette-baked-into-paper`** (NEW S523 G; torah, dictionary, generator fixed; open 0): ACTIVE, streak 0. Detection: `getNikudColor` output that reaches paper (print, `onclone`) resolves the light palette; a PDF from dark = light's.

- **`tour-not-following-a-live-switch`** (NEW S519 K; fixed LL, trope, dashboard, dictionary, torah, FM S519–S522; open 0): ACTIVE, streak 0. Detection: `tourswitch.mjs`; torah `torahtour.mjs` (Sefaria gated).

- **`overlay-scoped-dialog-keys`** (NEW S514 F; LL, flash; S515 `.ivrit` ask ×4, Torah favorite; **S516 hub Erase + I/E `973eb309`; open: none**): ACTIVE, streak 1 (S530: 3 new dialogs, `a530/dialogs.mjs`). A click on a dialog's text puts focus on `<body>`: an overlay listener …[full text: IMPROVEMENT_ARCHIVE.md]

- **`group-toggle-wipes-a-sibling-group`** (NEW S512 H; generator FIXED `ff980a7`; the match-target re-sync was an earlier work-around): ACTIVE, streak 0. A class-wide `.active` toggle on a button class another row shares. Detection: `grep -n "querySelectorAll('\\.[a-z-]*btn')" …[full text: IMPROVEMENT_ARCHIVE.md]

- **`infinite-box-shadow-pulse-repaints-every-frame`** (NEW S510 D; letter_learner FIXED `fd6cfdc`; S511 the 6 carriers FIXED `f1cfd83` — open 0): ACTIVE, streak 0. Detection: `grep -n attnPulse *.html` → keyframes on `box-shadow`; `i511/pulse.mjs` paints per 3 s (0 = fixed; the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`new-page-print-block-without-the-ink-remap`** (NEW S509 G; letter_learner FIXED `be4a13f`; 14 others clean): ACTIVE, streak 0. Detection: `--text:` inside the print block of every page with dark tokens; `g509/g509.mjs` ink dark vs light.

- **`page-drops-a-field-it-cannot-apply`** (NEW S507 P; trope `3b9915b9`): ACTIVE, streak 0. A page rebuilds a synced blob from its known fields, dropping a newer build's field from the account. Detection: `p507/trope.mjs` T6.

- **`theme-token-on-an-always-dark-surface`** (NEW S506 N; dashboard picker Close `87745776`; suite unswept): ACTIVE, streak 0. A theme token (`--text`, `.btn-secondary`) on an overlay that is dark in both themes. Detection: `n506/pickcon.mjs`.

- **`data-edit-under-an-unchanged-buster`** (NEW S503 E; 2 FIXED `39265428`): ACTIVE, streak 0. Detection: `e503/e2b.py` (findings S503).

- **`root-var-per-input`** (NEW S496 D; dictionary FIXED `c049ab67`; S497: generator ×2 + trope under 200 ms @4×, closed): ACTIVE, streak 1. Detection: archive.

- **`dark-palette-on-the-element`** (NEW S495 G; `.hol-ico` FIXED; `.fx-*` FIXED `e5b3dc47`; open: none): ACTIVE, streak 0. Detection: findings S495.

- **`count-noun-without-a-one-form`** (NEW S497 I; bulk edit ×3 `d438f151`; S498 FM fidelity ×5 FIXED `fc56d212`; S501 FM `{max} units` + status/banner counts FIXED `c6db7170` via a `{units}` phrase; S504 dashboard `bulk_skipped` FIXED `13c10bf3`; S533 K: 6 delta `{count}` keys, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`busy-disabled-button-drops-focus`** (NEW S498 H; contact + resources FIXED `68adddee`; S499 generator PDF `1ca449db`; S500 dashboard Current Location `82218419`; trope ×2 REFUTED (both hand focus back); open: FM export (an error modal opens mid-export: hand back only if …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hidden-input-anchored-outside-its-scroller`** (NEW S499 C; dashboard's 25 drawer radios FIXED `55891185`, torah fixed outside the loop; latent: `.vh-file` ×4, its label on screen on every path measured): ACTIVE, streak 0. Detection: a `position:absolute|fixed` focusable …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hebrew-faux-italic`** (NEW S494 M; S526 closed the HE census: folder tree `9515b0dc`, dictionary `dd291fd5`; S527 the EN arm's one, dictionary `237f8547`; open 0): ACTIVE, streak 0. Detection: `h526/ital.mjs` (`L=en` = EN arm; a hidden plant fires).

- **`fixed-toast-duration-shorter-than-its-text`** (NEW S484 F; FIXED `8037c22d` ×4, `5ffa32ba`; resources `3c539498` S487; open 0): ACTIVE, streak 0. A fixed toast timer under 1000 + 50 ms/char of its longest message. Detection: `f484/durations.mjs`; exempt sticky/explicit-ms …[full text: IMPROVEMENT_ARCHIVE.md]

- **`centred-fixed-box-shrinks-to-half-the-viewport`** (NEW S484 F; FIXED `78738db4` ×7): ACTIVE, streak 0. A fixed `left:50%; translateX(-50%)` box with no width is capped at vw/2. Detection: `f484/width.mjs` (width = vw/2 at 390); fix `width:max-content`.

- **`shared-module-fallback-literal-without-a-dark-twin`** (NEW S483; FIXED `cb226a04` ×2): ACTIVE, streak 0. A module's `var(--token, #light-literal)` on a page lacking the token. Detection: findings S483 (3); 7 tokens, 1 hit, 0 open.

- **`rtl-copy-names-the-english-side`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (b).

- **`copy-names-a-control-by-a-label-it-lacks`** (NEW S481 ×2): ACTIVE, streak 0. Detection: findings S481 (a).

- **`screen-frame-prints-as-rails`** (NEW S480; trope `8de41993`): ACTIVE, streak 0. A plate's border around multi-sheet content prints its sides down every middle page. Detection: `d480/rails.py` (prove on HEAD). Fix: print `border-color:transparent`.

- **`enter-ignored-beside-its-own-button`** (NEW S471; dashboard ×5, generator ×2; S472 torah range ×3 `60229f0f`): ACTIVE, streak 0. Detection: `a472/enter.py`, then typed Enter vs the button.

- **`placeholder-keeps-the-browser-gray`** (NEW S470 `45a3073e`): ACTIVE, streak 0. Detection: `f470/ph.mjs` < 4.5:1 (plant 1.3:1).

- **`header-wrap-gate-below-its-ceiling`** (NEW S478 M; ×8 `92a21164`; S489 `f620c768`; S520 touch ×8 `186ea5f4`): ACTIVE, streak 0. Detection: `n520/gates2.mjs` (1px 320-1000, EN/HE × themes, mouse+touch, real fonts); HEAD the control.

- **`latin-tracking-on-hebrew-labels`** (gate 3: drop suite-wide; S502 dashboard + dictionary; S503 flash; S504 torah `8e48daa5`; S505 Beta badges `0abb1f57`; S511 flash report `th` `90e592b`; **S513 generator `.ws-version-label` `c6fe147` — open: none known** …[full text: IMPROVEMENT_ARCHIVE.md]

- **`forward-arrow-points-back-in-rtl-copy`** (NEW S462 N; FIXED S464 `5f7f8a40` ×48; open 0): ACTIVE, streak 2 (S533: 9 delta rows with arrows, 0 — the LL key titles mirror the handler; S472: 47, 0). Detection: the S462 CSV census; exempt "(→)", A→Z, Back labels, the orphan …[full text: IMPROVEMENT_ARCHIVE.md]

- **`share-link-writes-the-teachers-saved-preferences`** (NEW S463 P, `1eeaacb8`): ACTIVE, streak 1 (S472 dictionary clean). Detection: `p463/link-fix.mjs`, `a472/dshare.mjs`.

- **`bulk-apply-skips-a-renderer-the-control-runs`** (NEW S461; FIXED ×3): ACTIVE, streak 1 (S472 clean). Detection: `x3/parity.mjs`, `p463/loc-fix.mjs`. Open: none known.

- **`radio-set-without-a-question`** (S501–S518: 7 fixes; S519 FM ×14 `75637fef`, contact `929089d4`; S527 the `.ivrit` toggles ×5 `1ecaad0c`; open: dictionary, resources (gate 2), pills): ACTIVE, streak 0. Detection: static …[full text: IMPROVEMENT_ARCHIVE.md]

- **`native-input-display-none-under-its-label`** (NEW S458, `ea43be7e`): ACTIVE, streak 0. Detection: `a458/radios.mjs`; control torah. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-tab-flush-writes-its-old-copy`** (NEW S458; `c1714e2f`, `027fc597`, flash `070582d8`; S493 the hidden-flush variant, module `c57f0b79`): ACTIVE, streak 0. Detection: `a458/twotabsigned.mjs`, smoke-sync D37, `p493/t7v.mjs` (4 tab orders); control `027fc597^`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`flex-range-keeps-its-min-content-width`** (NEW S457; `ddcb4237`; a text input too: dictionary `#shoreshInput` `dcfdcf16` S493): ACTIVE, streak 0. A `flex:1` range without `min-width:0` keeps its 129px and pushes the row's last item out of a …[full text: IMPROVEMENT_ARCHIVE.md]

- **`slider-value-announced-as-its-position`** (NEW S456; `0ca1e29b`): ACTIVE, streak 0. Detection: `f456/census.mjs` (readout numbers lack the value, no `aria-valuetext`).

- **`ltr-machine-text-field-typed-rtl`** (NEW S454; `b1eb9659`, 4 carriers): ACTIVE, streak 0. Detection: `type="email|url"` (or JS `.type`) without `dir="ltr"`; a translated placeholder adds `:placeholder-shown { direction: inherit }`.

- **`pre-ready-interpolated-write-never-healed`** (NEW S453; `728e4075`; **S454 `ab9a133e`**): ACTIVE, streak 0. Detection: `i453/gates.mjs` `LDELAY=700`; `h454/ttver.mjs`.

- **`cdn-library-parser-blocking-for-one-action`** (NEW S452 D; generator `82bbe313`, FM `d01a33cd`): ACTIVE, streak 0. A parser-blocking CDN `<script src>` in `<head>` for one action. Detection: `grep -n '<script[^>]*src="https\?://' *.html | grep -v ' async\| …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-navy-fill-matches-its-ground`** (NEW S450 M; flash ×2 `c9e2bc2b`, `68055510`; S451 census: dictionary `5deb5472`, generator `f9ca0909`; S464 keyboard block ×4 `f98367f8`): ACTIVE, streak 0. Detection (`g451/navy.mjs`): every visible …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ring-below-3-on-light`** (NEW S442; FIXED on 14 pages `91fede71` + 3 modules `a46342c1`; S443 the last two non-outline rings, FM `e05b25d1` + torah's fav dot `1c320ae8`): ACTIVE, streak 0. A focus outline drawn in `--gold` (2.1–2.75:1 on the light surfaces). Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tip-escape-drops-focus`** (NEW S441; all 5 carriers FIXED `97c54dfb`): ACTIVE, streak 0. A keyboard tooltip whose Escape calls `blur()` drops the focus to the body, and an unstopped Escape closes the drawer under it. Detection (scratchpad `c441/v2.mjs`): Tab onto a visible …[full text: IMPROVEMENT_ARCHIVE.md]

- **`account-wide-delete-confirm-without-signed-in-wording`** (NEW S435 P; flash's result delete FIXED `e56d95be`; the colour reset ×5 OPEN, gate 2): ACTIVE, consequence-adjacent (a teacher reads a deletion as local), streak 0. A `confirm()` before a delete/reset of a synced …[full text: IMPROVEMENT_ARCHIVE.md]

- **`logical-inset-mirrors-onto-pinned-content`** (NEW S440; FIXED `23b7bb0f`): ACTIVE, streak 0. A logical inset over physically pinned content lands on it in Hebrew. Detection: HE, text Range rects ∩ the control's box.

- **`tip-name-joins-its-field's-name`** (NEW S430; generator `10a0c18f`; torah ×3 `d477e15c`; S488 dashboard `f722eeba`): ACTIVE, streak 0 (no open carrier). A `<label>` holding a `.tip-wrap` names its field "… More information". …[full text: IMPROVEMENT_ARCHIVE.md]

- **`panel-title-keyed-on-an-inner-span`** (NEW S429; S439 generator FIXED `1ce9eabd`, torah stale — no collapsing panels left): ACTIVE, streak 0. Detection: a `.panel-title` with no own `data-i18n`, then toggle + reload.

- **`copy-claims-success-on-a-refused-clipboard`** (NEW S428; FIXED `bbd5f65`, `0d2a941`; S444 index `90e1a057`, dashboard `18344f69`; **S445 generator `3dad5c11`, flash `58ee7a4f` — all 7 carriers fixed, 0 open**): ACTIVE, streak 0. Detection: every `execCommand('copy')` whose …[full text: IMPROVEMENT_ARCHIVE.md]

- **`button-focus-lost-to-its-own-rebuild`** (**S513 FM glyph tiles `a54e6d2`; S500 hebrew-keyboard tabs + layout, 4 carriers `1c701fc9`; S499 torah Try again ×2 `80c0a440`; S488 trope Try again ×2 `183605ba`; S483 hub `ab1a235e`; S474 flash Return to Options `3235f8eb`; S473 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-literal-escapes-the-print-tokens`** (NEW S437 G; resources FIXED `5320a668`): ACTIVE, streak 1 (S479 trope clean; plant fired). Detection: PDFs dark vs light, ink per page (<200 at 40 dpi); a lighter dark sheet = a `body.dark` literal the print …[full text: IMPROVEMENT_ARCHIVE.md]

- **`editor-re-parse-caps-a-merged-list`** (**NEW S421 Pass P — 1 carrier, FIXED `288af4a`**): ACTIVE, consequence-critical (a sync carries the cut list to the account); never retires. A list the sync merges uncapped is re-parsed by its tool's editor or restore path through the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`window-taller-than-a-phone-without-a-scroll`** (NEW S476 N; FM `fe808b64`; S506 variant, a sticky head covering its own scroller in landscape: dashboard bulk edit `232ea19e`): ACTIVE, streak 0. Detection: `n476` `modalFit` on an SE + 13 landscape, a tapped last button; …[full text: IMPROVEMENT_ARCHIVE.md]

- **`install-banner-over-a-sheet's-bottom-controls`** (NEW S420 N, hub `f44a17e`; **S472 generator bar `8081fc83` (pwa.js `--pwa-banner-space`), FM's 16 windows `56c7a179`; S476 torah gallery `30fcc886` — no open carrier**): ACTIVE, streak 0. Detection: `a472/banner2.mjs` (sheet …[full text: IMPROVEMENT_ARCHIVE.md]

- **`flash-restores-captured-text-not-its-key`** (NEW S417 — 2 FIXED `1f7f869`; S415 `38e5b62`): ACTIVE, streak 0. A "Copied!" flash restoring the text captured at click time, so a 2nd click captures the flash. Detection: `orig = (btn|lbl)\.(textContent|innerHTML)` + …[full text: IMPROVEMENT_ARCHIVE.md]

- **`visible-label-missing-from-the-accessible-name`** (S415–S425: 4 fixes; **S427 the dictionary's Word Lists windows `ee5f6f2`**; **S531 parsha's card link FIXED `6e8b6848`**): ACTIVE, streak 0. Detection `a416/labelname.mjs` + `fieldnames.mjs`; S427 `c427/probe-dlgname.mjs`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`designed-key-miss-probed-through-t`** (NEW S415; FM `gName()` FIXED `95d5f46`): ACTIVE, streak 2 (S533: 0 over 102 states + 10 surfaces; S416: 0 on the delta). Detection: `[i18n] missing key` in B's interaction arm; static: `=== k ?` fallbacks without `I18n.has`.

- **`pinned-english-without-lang`** (NEW S415; `f4bbfe8` ×20; resources ×43; torah + trope; **S516 LL ×7 `e7d72c6e`**; **S533 an attribute twin: the parsha coloring sheets' picture `aria-label` English under `lang=he` ×54 `b05b759e`**; open: none): ACTIVE, streak 0. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **`toggle-name-flips-with-its-pressed-state`** (NEW S414 `f9e67b2`; S416 trope tune `96275c2`; S430 found torah's Trope staff Tune all + every verse Tune; **S431 FIXED `aa97e2e`**): ACTIVE, streak 0 (last swept S430). Detection `f414/toggles2.mjs`: real click per …[full text: IMPROVEMENT_ARCHIVE.md]

- **`author-display-defeats-the-hidden-attribute`** (S414 `391114b`; **S511 letter_learner `#llVoiceRow` `d4c5e02`**; S416 FM `3bf0112`; S425 trope ×2; S430 torah ×2; **S472 torah lookup `306003c3`**; S472 detection `a472/hidrec.mjs`): ACTIVE, streak 0. Detection: rendered …[full text: IMPROVEMENT_ARCHIVE.md]

- **`button-group-label-not-programmatic`** (**NEW S413 Pass C — resources ×8 rows FIXED `945b397`; generator, dictionary, hub unmeasured (no `role="group"` at all)**): ACTIVE, streak 0. A row of `aria-pressed` buttons sits under a visible label (a `<span>`, or a `<label>` with …[full text: IMPROVEMENT_ARCHIVE.md]

- **`settings-lost-across-a-load`** (NEW S412; dictionary ×4 FIXED S482 `8d99ad93`, flash FIXED S491 `adce6574`; 0 open): ACTIVE, streak 0. A setting comes back changed after a reload. Detection (`h482/dictsave.mjs`): change each control by a real click, wait out the save, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`live-region-display-none-while-empty`** (S408; **all 4 FIXED `efbc98a` S409**; **S530 4 more FIXED `66ecdc9f`, `a530/fix1.mjs`**): ACTIVE, streak 0. Detection: `:empty{display:none}` on a `role=status`/`aria-live` line, then CDP AX on it empty (`notRendered` = hit); …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-base-rule-outranks-variant`** (S408; FIXED `4a5d353`, `b26f7d6`; EXEMPT the dead `.preset-item.drag-over` ×2): ACTIVE, streak 0. Detection: `m408/darkvariant.py` (comments stripped), then drive the state by a real click in both themes.

- **`aria-disabled-lock-no-handler-checks`** (**NEW, registered 2026-09-23 (S407 Pass P) — 1 carrier, fixed `e5c4784`**): ACTIVE, clean streak 0. A control marked busy or invalid by `aria-disabled="true"` whose activation handler never reads that state: the look says locked, a …[full text: IMPROVEMENT_ARCHIVE.md]

- **`text-field-under-16px-zooms-on-ios-focus`** (NEW S406; FIXED ×2; S465 contact ×4 `5a7a8ed`; S492 dictionary ×6 `07177214`; S506 torah ×17, trope ×3; S507 dashboard ×23, flash ×10; S508 resources ×6, account ×2; open: none): ACTIVE, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`textContent-rewrite-erases-a-control-icon`** (S405; S415; S453 `ac796dba`; **S501 generator Export PDF `d7355d03`**): ACTIVE, streak 0. Add (d): load-time icon count. Detection: (a) EN→HE→EN icon count; (b) key census …[full text: IMPROVEMENT_ARCHIVE.md]

- **`english-literal-passed-to-a-message-helper`** (NEW S475): ACTIVE, streak 1 (S533: 0 over 4,328 added lines, plants 7/7). …[full text: IMPROVEMENT_ARCHIVE.md]

- **`translated-key-exists-page-hardcodes-english`** (**S533 K: 0 new** — runtime EN-in-HE over 102 states + 10 surfaces, the 2 CSV twins content by design; streak 1. S461 K: 1 FIXED `74b2ee0c`, dictionary Bulk Copy count; streak 0. S433 K: 0 new — the orphan census 121 raw, 86 …[full text: IMPROVEMENT_ARCHIVE.md]

- **`per-page-code-inside-a-shared-block`** (**NEW, registered 2026-09-22 (S403 Pass E) — 2 carriers, both fixed `6e28af3`**): ACTIVE, clean streak 1 (S416). Page code pasted INSIDE a `═══` block instead of below its end …[full text: IMPROVEMENT_ARCHIVE.md]

- **`icon-markup-into-a-textContent-writer`** (**NEW, registered 2026-09-22 (S403 Pass E) — 1 carrier (2 buttons), fixed `7552ba0`**): ACTIVE, clean streak 0. An `ICON_*`/`FT_ICON_*`/`HK_ICON` SVG const reaches a helper that writes `textContent`, so the button prints its SVG …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cached-rejected-loader-promise-blocks-every-retry`** (**NEW, registered 2026-09-17 (S399 Pass A)**): ACTIVE — **1 carrier found and fixed (`05341a7`); 6 censused, 5 already correct.** A module memoises its in-flight loader promise to de-duplicate concurrent callers, but …[full text: IMPROVEMENT_ARCHIVE.md]

- **`cdn-dependency-absent-and-unguarded`** (registered 2026-09-17 (S398 Pass B)): ACTIVE — **S399 (Pass A), FIRST re-sweep: 0 hits, clean streak 0→1.** A global a third-party `<script src>` defines, or a retry waiting for one, reached where nothing handles its absence — the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`selector-declared-twice-in-one-stylesheet`** (registered 2026-09-16 (S394); swept S395 — 3 fixed `04892f3`): ACTIVE. **S399 (Pass A): 13 overlapping pairs, 0 NEW across a 1,172-insertion / 18-file delta — clean streak 0→1.** One file declares the same selector twice in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **`untrusted-card-field-interpolated-unescaped`** (**NEW, registered 2026-09-16 (S393 Pass D)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** A field of a *generated item* (a flash card, a worksheet cell, a word row) is …[full text: IMPROVEMENT_ARCHIVE.md]

- **`auth-param-read-before-its-cleanup-runs`** (**NEW, registered 2026-09-16 (S390 Pass P)**): ACTIVE — **consequence-critical (security), so it never retires on clean streaks alone.** An inline `<script>` in a root HTML page reads `location.href`/`.search`/`document.referrer` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`hover-feedback-survives-the-disabled-state`** (registered 2026-09-15, S383 Pass F): ACTIVE — consequence-adjacent (a locked destructive control that still lights up invites the click), so it never retires on a clean streak. **S394: the LAST open carrier CLOSED (`767064e`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`physical-property-that-never-mirrors`** (registered S388 K; S438 torah `947b452d`; S508 dashboard ×5 `323ad66`; S534 dashboard `#ttsRateVal` `c9ab327`; open 0): ACTIVE, streak 0. Detection: grep …[full text: IMPROVEMENT_ARCHIVE.md]

- **`tile-grid-built-hidden-never-roved`** (registered 2026-09-15 (S382) — 11 carriers, all fixed): ACTIVE. A `roveTileGrid()` call placed in a builder that runs while the container is `display:none` silently does nothing: the helper's tile list filters `offsetParent !== null`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stored-json-of-the-wrong-shape-trusted`**: ACTIVE. **S502: Bulk edit `c35aec8d`; streak 0.** Detection: `a502/dash-shape.mjs`. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`validation-note-stores-rendered-text`**: ACTIVE. **S371 (Pass A, delta): the dashboard's `#swmPrintBtn` empty-week title re-reads in Hebrew after `setLang('he')`, the FM export label held from S370 — hits 0, clean streak 1.** **S364: 1 FIXED (`cabd6ca` the generator's …[full text: IMPROVEMENT_ARCHIVE.md]

- **`popup-without-a-keyboard-contract`**: ACTIVE. **S371 (Pass A, delta `b418cf9..1d4c9cf`): 0 new openers (no added `role=dialog`/`aria-modal`; the flash dialogs only gained classes) — hits 0, clean streak 2.** **Re-swept 2026-09-09 (S357 Pass A, delta `e0a94d9..HEAD`): 1 new …[full text: IMPROVEMENT_ARCHIVE.md]

- **`stale-validation-note-after-its-input-changes`**: ACTIVE. **S371 (Pass A, delta): 1 new `aria-disabled` writer, the dashboard's Print-week gate — retires on a real `+ Add period` click (disabled=false, attribute removed, title re-labelled) — hits 0, clean streak 2.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **`apply-settings-trusts-collection-members`**: ACTIVE (consequence-critical: garbage is applied AND SAVED, so every later load rethrows — never retires). **S387: the axis swept to completion across ALL FOUR `.ivrit` engine carriers — 254 cells through the real restore path …[full text: IMPROVEMENT_ARCHIVE.md]

- **`save-over-an-existing-name-without-confirm`**: ACTIVE **S371 (Pass A): 3rd carrier FIXED `b85b579` — the dashboard's `saveWeekScheduleAs` (its comment even said "same-name save overwrites, like savePreset" — from before savePreset confirmed). Census: every other …[full text: IMPROVEMENT_ARCHIVE.md]

- **`fixed-surface-missing-from-the-print-hide-list`**: ACTIVE. **S496: `.bpe-*` FIXED `4c4dd3ae`.** **S392 (Pass G, `hebrew_blend_generator.html`): swept CLEAN — first clean sweep since registration, clean …[full text: IMPROVEMENT_ARCHIVE.md]

- **`control-class-without-a-hover-state`**: ACTIVE. **S373: the S371 P4 FIXED (`c365786`, dashboard `.swm-swatch:hover` ring). Registered S313; hits S313 20, S314 2, S357 1, S371 1 — all fixed; clean streak 0; last swept S371.** Detection: a class with `cursor:pointer` or …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-a-literal-only-pattern-match`** (**NEW, registered 2026-09-01 (S309 Pass O) — 1 carrier, and it had ALREADY been reported to the maintainer as a completed clean sweep before it was caught. ACTIVE — consequence-critical (it manufactures false assurance), so …[full text: IMPROVEMENT_ARCHIVE.md]

- **`false-clean-from-an-unverified-probe-handle`**: ACTIVE (never retires). **S502 +1: `BASE` read at import; assert `page.url()`.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **`light-literal-text-on-the-gold-token`** (registered 2026-09-17 (S396)): ACTIVE — **S399 (Pass A), FIRST real sweep: 7 NEW carriers, all on `hebrew_dictionary.html`, all fixed `273f449`; clean streak stays 0.** `color:#fff` (or another light literal) painted on `var(--gold)` …[full text: IMPROVEMENT_ARCHIVE.md]

- **`sub-floor touch target`**: ACTIVE. **S531: parsha_emojis' 7 popup sliders + its card link (23px HE) FIXED `0c8a2bba`.** **S529: LL sliders FIXED `84154c76`.** **S516 FM ×4 `36e804ac`.** **S513 dashboard ×2 `787c434`.** **S483 hub clean.** **S456: `85e294b2`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`vh-capped-sheet-without-dvh-twin`**: ACTIVE (registered S375). **S385 (Pass A), first re-sweep since the S377 fixes: 20 raw → 0 real, clean streak 1 of the 3 that retire it.** Every raw hit is an exemption the row names — 11 inner scrollers with their own `overflow:auto`, …[full text: IMPROVEMENT_ARCHIVE.md]

- **`ledger-section-loss`** (**NEW, registered 2026-08-30 (S296) — 1 carrier found and fixed, and a DETECTOR shipped with it**): a close-out edit that **deletes** ledger content instead of **moving** it to `docs/IMPROVEMENT_ARCHIVE.md`. The carrier: the S295 close-out …[full text: IMPROVEMENT_ARCHIVE.md]

- **`dark-mode-token-as-text-on-a-light-ground`** (**REOPENED S413 Pass C — contact's script-written success line FIXED `f40d142`; S534 the generator's `sub.style.color` print half `a153826`; screen gold = S141's keep, C's call**): ACTIVE, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

- **`non-finite-number-from-a-loaded-file`**: ACTIVE (consequence-critical). **S458 FM `fitScale` `2bb2ead0`; S374 torah, trope.** Open 0, streak 0. …[full text: IMPROVEMENT_ARCHIVE.md]

- **slider-focus-lost-to-its-own-rebuild**: **CLASS CLOSED 2026-08-29 (S286 iter 2) — the last 6 known carriers fixed (`9a01f3b`); hits: 6, clean streak: 0 — ACTIVE.** Registered S284 (3 fixed, 6 logged unreachable). All six routed through the shared re-focus helper …[full text: IMPROVEMENT_ARCHIVE.md]

- **class-only-selected-state**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages incl. the torah handout bar and trope Drill tab): 0 visible `.active/.selected/.current/.on` controls with siblings and no `aria-pressed/-selected/-current/-checked` — hits 0, …[full text: IMPROVEMENT_ARCHIVE.md]

- **animation-outside-its-reduced-motion-block**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, runtime, 11 delta pages): under `reducedMotion:'reduce'` 0 elements keep an animation or transition (the `no-preference` control counts 1–684 per page) — hits 0, clean streak 2.** S286 …[full text: IMPROVEMENT_ARCHIVE.md]

- **help-affordance-inside-a-label-forwards-its-tap** (**NEW, registered 2026-08-29 (S284 iter 5) — 6 carriers in one file, all fixed**): a tooltip/help trigger placed INSIDE a `<label>` that wraps a form control inherits the label's activation forwarding, so one tap produces a …[full text: IMPROVEMENT_ARCHIVE.md]

- **csv-cell-quoting-integrity** (**NEW, registered 2026-08-28 (S281 iters 3–4) — 4 carriers found in one sweep, all fixed**): both `parseCSV` copies (`check-i18n.js`, `build-locales.js`, byte-identical) flip `inQuotes` on a `"` met outside quote mode **without appending it**, …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-print-shadow-slab**: ACTIVE (registered S279: dictionary `#appToast`, flash `.panel`). **S385 (Pass A): 2 MORE FIXED — trope `.tu-view` (`7be7591`, `var(--shadow-sm)` = rgba(0,0,0,.4) in dark over 4,466,776 px², the largest slab this pattern has produced; the print …[full text: IMPROVEMENT_ARCHIVE.md]

- **pinned-english-prose-in-rtl-paragraph** (NEW S277; FIXED ×3; contact's server note open): ACTIVE, streak 0. Detection: Range x-order of the phrase and its period in the HE UI; exempt lists, single runs, print.

- **fixed-width-third-party-embed-inflates-phone-layout**: **REGISTERED + first swept suite-wide 2026-08-28 (S276 Pass N) — hits: 2 carriers, BOTH fixed in-session (`23b2387` contact inline auto-render → data-size=compact ≤388 + ≤430 containment belt; `e4aaa44` resources …[full text: IMPROVEMENT_ARCHIVE.md]

- **stale-html-fallback-behind-its-csv-value**: ACTIVE, clean streak 0. **S533 (K, `k533/stale.py`, html.parser with exact offsets, 2,974 sites, plant 1/1): 1 FIXED `2c82a0b9` — the LL subtitle, stale since 10-17 (S519's K ran no html arm: run it every K); the generator's 4 …[full text: IMPROVEMENT_ARCHIVE.md]

- **undocumented-global-keyboard-shortcut**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A, delta-only): 0 new `document`-level `keydown` handlers (the erase gate's is scoped to its overlay: Escape + Tab trap, exempt shapes) — hits 0, clean streak 2.** S264 1 hit fixed (`f65ce58`); …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-size-control-holding-translatable-text**: **re-swept 2026-08-27 (S264 iter 3), WIDENED PAST ITS REGISTERED BLIND SPOT for the first time -- hits: 0 real. Clean streak: 1 -- ACTIVE.** Sweep 2 measured the shape sweep 1 could not see: leaf elements carrying NO …[full text: IMPROVEMENT_ARCHIVE.md]

- **legibility-destroyed-by-a-second-dimming-layer**: **re-swept 2026-08-27 (S263, all 3 `#fsExitBtn` carriers) -- hits: 1 (`hebrew_blend_generator.html`, the LAST unfixed carrier), fixed in-pass (`eb0eab3`); clean streak: 0 -- ACTIVE, consequence-critical (legibility), never …[full text: IMPROVEMENT_ARCHIVE.md]

- **fixed-control-positioned-outside-the-viewport**: **REGISTERED + first swept suite-wide 2026-08-26 (S262 Pass N) -- hits: 1 carrier (`hebrew_blend_generator.html` `#sidebarToggleBtn`), fixed in-pass (`5f6a0a0`); census 78 cells (13 pages x 3 phone descriptors x EN/HE) …[full text: IMPROVEMENT_ARCHIVE.md]

- **executable-javascript-in-a-localization-cell**: ACTIVE (consequence-critical: security-shaped, never retires). **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows carry no handler or URL; Check C1 clean over 5140 keys × 2 columns — hits 0, clean streak 1.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n-html-markup-only-in-fallback**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): the delta's 8 new CSV rows and their sites carry no markup (plain `data-i18n` / `I18n.t()`) — hits 0, clean streak 1.** Registered S260 (21 fixed), S261 re-swept (2 fixed `ae95aba`). …[full text: IMPROVEMENT_ARCHIVE.md]

- **global-keydown-preventDefault-without-target-guard** (**NEW, registered 2026-08-28 (S272 Pass A) from S271’s `38ab28f`**): a document/window-level `keydown` handler that calls `preventDefault()` on Enter/Space (or another activation/printable key) with no interactive-target …[full text: IMPROVEMENT_ARCHIVE.md]

- **row-siblings-with-mismatched-heights**: ACTIVE. **S385 (Pass A): 1 hit FIXED — `hebrew_blend_generator.html`'s account chip (`0a46f67`) stood 41px at top 14 beside five 35px controls at top 17, because `.ivacct` carries `align-self:stretch` and that header's flex line is its …[full text: IMPROVEMENT_ARCHIVE.md]

- **debounced-persistence-with-no-page-hide-flush**: **re-swept 2026-08-26 (S258 Pass A) - hits: 1 NEW carrier (`classroom_dashboard.html`), fixed in-pass (`cf244df`); clean streak: 0 - ACTIVE, consequence-critical (data loss), never retires on streak.** **The hit widens the …[full text: IMPROVEMENT_ARCHIVE.md]

- **state-mutation-that-never-arms-its-persistence**: **re-swept 2026-08-26 (S257) - hits: 1, the knowingly-deferred `setInputMode`, now fixed (`57abf9c`); clean streak: 0 - ACTIVE (consequence-critical: data loss, so it never retires on streak).** **The fix shape is the finding …[full text: IMPROVEMENT_ARCHIVE.md]

- **flex-column-crushing-its-own-rows** (**NEW, registered 2026-08-23 (S249 Pass N arm 4)**): a `display:flex; flex-direction:column` container that is ALSO height-constrained and scrollable (`max-height`/`flex:1` + `overflow-y:auto`) silently **compresses its children instead …[full text: IMPROVEMENT_ARCHIVE.md]

- **translated-sibling stray** **S336: +1 carrier FIXED `c1e4427` — the Font Maker's nine raw `.name` display sites (header, drop zone, mark-editor modal, 4 toasts) now go through `gName()`, the sibling the tiles already used.**  (a display site rendering a raw English …[full text: IMPROVEMENT_ARCHIVE.md]

- **mobile-input-hints** (a text field for Hebrew, names, numbers or codes shipping without `inputmode`/`autocapitalize`/`autocorrect`/`spellcheck` fitting its content) | **ACTIVE — UN-RETIRED S411; S534 Name Tags ×7 FIXED `c156628`** (retired S343; the S267 row is in the …[full text: IMPROVEMENT_ARCHIVE.md]

- **i18n cross-column parity (placeholders, plurals, inline markup)**: **S533 (K): 41 raw `{placeholder}` mismatches over 6,593 keys, all the `.one` shape — hits 0, streak 2.** **re-swept 2026-09-03 (S320 Pass K, detector 1 only): `{placeholder}` sets en vs he over 5,128 keys, …[full text: IMPROVEMENT_ARCHIVE.md]

- **horizontal-overflow-at-narrow-widths**: **re-swept 2026-09-03 (S334 Pass N, `torah_trainer.html`, 12 real-descriptor loads × 10 views incl. the S324 presentation toolbar) — hits: 1, the clipped-not-scrolled variant (`.tt-fs-plate` 340px in a 320px viewport, −10..330, A− and …[full text: IMPROVEMENT_ARCHIVE.md]

- **hover-only-affordance-under-a-synthetic-mouse-event**: **re-swept 2026-08-23 (S249 Pass N arm 4) — hits: 1, the THIRD and FINAL carrier (`hebrew_dictionary.html`), fixed `383aa2a`; clean streak: 0 — ACTIVE.** **The class is now fully swept: all three `bindTip` carriers are …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-inverted-by-a-hover-or-active-state**: **S368 (Pass C, Font Maker at RUNTIME, 26/23 controls × 2 themes, real mouse + 420 ms): 1 hit FIXED (`6549b60` `.fld-help` hover 2.75 / 2.14 → 6.22 / 6.92:1); the disabled undo/redo pair (opacity 0.45) is exempt — inactive …[full text: IMPROVEMENT_ARCHIVE.md]

- **dark-override-outranks-hover**: ACTIVE. **Re-swept 2026-09-09 (S357 Pass A): static detector 0/14 pages; runtime 34 cells on the 8 fixed carriers, every one with real-hover feedback (light as the control) — hits 0, clean streak 1.** S354–S356: 8 carriers fixed. Detection: …[full text: IMPROVEMENT_ARCHIVE.md]

- **contrast-below-AA-on-a-tinted-or-coloured-plate**: **S501 `[DEFAULT]` on the dark active font tile, dashboard + torah `0053db78` (3.71→5.56:1).** **S488 dashboard ribbon `5da9ecbe`.** **S422: torah's vowel Letter on the trope tint FIXED `e55b811` (1.85:1; streak 0).** …[full text: IMPROVEMENT_ARCHIVE.md]

- **async-store-backed-choice-clobbered-by-a-sync-fallback**: **swept 2026-08-19 (S226 Pass A, 2nd sweep) — CLEAN with receipts, extended past fonts as its own note directed. clean streak: 1 — ACTIVE, and consequence-critical (it destroys saved user data), so it does NOT retire …[full text: IMPROVEMENT_ARCHIVE.md]

- **rebuild-where-a-class-swap-would-do**: **REGISTERED 2026-08-16 (S220)** — not yet swept suite-wide, hits: 1 (`26b9e7e`), clean streak: 0 — ACTIVE. **Definition:** a settings toggle whose visual effect is ALREADY gated in CSS on a body/root class, yet whose handler calls the …[full text: IMPROVEMENT_ARCHIVE.md]

- **decorative-glyph-carrier-exposed-to-assistive-tech** (**S530: header ✡︎ ×13 `eee7080d`, generator ⚡/🔍 `b298abb2` FIXED (`a530/fix2.mjs`, `fix4.mjs`); category emoji unruled (candidate).** **S529: generator start screen + chips `19ece1f1`.** **S528: resources' icons FIXED …[full text: IMPROVEMENT_ARCHIVE.md]

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

- **lazily-loaded-dependency-renders-an-empty-shell** (S416: +1 open, trope HH) (a feature whose data comes from a lazily-loaded external module keeps rendering its full chrome — column, header, row label, legend — when the module never arrives, so …[full text: IMPROVEMENT_ARCHIVE.md]

- **print-media-leak / var-chain-overridden-by-a-literal** (a screen-only `@media (max-width:N)` block whose declarations also apply to PAPER — print media has a width too — or, more generally, a literal `font-size`/colour declaration that out-specifies a `var(--x)` chain the …[full text: IMPROVEMENT_ARCHIVE.md]

- **incomplete-print-token-reset** (a `@media print` dark-token re-statement that restates SOME of the theme tokens the dark block overrides but not all — the missing ones keep their dark values on paper. Detection: diff the token list inside the print block's `html.dark-early …[full text: IMPROVEMENT_ARCHIVE.md]

- **referenced-but-unauthored i18n key** (a key the code LOOKS UP that does not exist in the CSV — the exact inverse of `authored-but-unreferenced`. The user sees the English fallback, so nothing looks broken, but every render logs an `[i18n] missing key` warning, and those …[full text: IMPROVEMENT_ARCHIVE.md]

- **untrusted-shape-on-read** (a store that arrives from an imported `.ivrit` / AllTools file — hand-editable text — is read back with its SHAPE assumed: `results.map`, `(r.cards||[]).forEach`, `results.slice().reverse()`. A `null` entry, a non-array `results`, or a non-array …[full text: IMPROVEMENT_ARCHIVE.md]

- **blocking-alert-for-a-routine-path**: ACTIVE, streak 0. **S512 (H): the generator's three Real Words "no words" alerts → the inline Generate note, FIXED `59714ef`; its 11 other `alert(` sites are catch / import-error / capability branches.** **Re-swept 2026-09-09 (S357 Pass …[full text: IMPROVEMENT_ARCHIVE.md]

- **double-localization** (an already-localized string passed BACK through the localizer, so the lookup key is derived from output rather than from source data. Silent on screen — the fallback that makes these helpers idempotent returns the string unchanged — but it emits a …[full text: IMPROVEMENT_ARCHIVE.md]

- **parse-per-call on a growing store** (a helper re-parsing a whole localStorage blob on every call, called once per item, so the cost grows with the teacher's saved work): ACTIVE, consequence-critical (a freeze that scales with use reads as data loss). Hits: flash …[full text: IMPROVEMENT_ARCHIVE.md]

- **authored-but-unreferenced i18n key family** (a translated CSV key referenced nowhere): **S365: 1 hit FIXED (`772068b`, `trope.learn.no_example` + `trope.learn.examples_unavailable` — `renderLearn` passed the raw English; Geresh Muqdam has no chanted example, so the Hebrew UI …[full text: IMPROVEMENT_ARCHIVE.md]

- **`browser-locale-date-in-a-localized-sentence`** **S533 (K): 0 on the delta (`etLang()`, `I18n.lang`; the dashboard's `en-US` dates are projected content), streak 2.** **S371 (Pass A): 0 `toLocale(Date|Time)String(undefined` in the corpus — hits 0, clean streak 1.** …[full text: IMPROVEMENT_ARCHIVE.md]

- **sub-floor touch target on a shared small-button class** (registered S193; **S410 FIXED the hub's inline-styled My Fonts row `ee38b98`, 6 buttons 24 → 30px — S236's class-less sub-shape**): a small-control class — `.btn-xs` and its kin — whose size comes from `padding` …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero: swept 2026-07-17 (S93), hits: 0 (the dashboard movable-panels feature 639fcf8/53e50fc uses array-order `panelLayout` with no numeric restores; zone reorder is array-index splicing; its guards use `=== undefined`, not `||`), clean streak: **3 → RETIRED S93** (3 …[full text: IMPROVEMENT_ARCHIVE.md]

- localStorage-vs-AllTools: ACTIVE (consequence-critical: backup completeness, never retires). **Re-swept 2026-09-09 (S357 Pass A, delta-only): 1 new key, `hebrewBlender_lastBackupAt` (S347) — in `eraseAllSettings` with a written per-device reason, export-exempt by design — hits …[full text: IMPROVEMENT_ARCHIVE.md]

- unescaped-input / unsafe-parse: **re-swept 2026-07-25 (S158), hits: 0** (`0dc1e50..HEAD` — **0 new `innerHTML`/`insertAdjacentHTML`/`outerHTML`, 0 new `JSON.parse`/`Object.assign`, 0 new `fetch`/`setAttribute('href'|'src'|'on*')`**. Tightened beyond added-sink-lines to catch …[full text: IMPROVEMENT_ARCHIVE.md]

- destructive-bulk: **re-swept 2026-08-28 (S272 Pass A, delta `b2f455b..HEAD`), hits: 0** (zero new loops write stored per-item data; the S268 calendar import writes cells only through its preview+confirm flow, the S269 purge is confirm-guarded and deletes only the legacy rows …[full text: IMPROVEMENT_ARCHIVE.md]

- **ivrit-gather-gap** — **3rd fix landed 2026-08-06 (S185)**: flash_cards' `hebrewFlashCards_pbStreak`, absent from BOTH of the tool's save paths and from `apply()`, now round-trips with AllTools' max rule (94d1222). The class's remaining known surface is clean. Original …[full text: IMPROVEMENT_ARCHIVE.md]

- **symbol-only accessible name** (an icon-only control whose ENTIRE accessible name is a glyph with no letter or digit — "×", "↺", "✕", "⬛", an emoji run — because for `button`/`a`/`role=button` the ACCNAME chain takes **name-from-content BEFORE `title`**, so a correct …[full text: IMPROVEMENT_ARCHIVE.md]

- nameless-adjacent-text-labeled control (a visible interactive control — toggle switch, slider, number field, select, colour well — whose only label is **adjacent text** that is never programmatically associated, so it has NO accessible name; the wrapping `<label …[full text: IMPROVEMENT_ARCHIVE.md]

- dead-feature-guard (a `typeof X === 'function'` / feature-detection guard whose **preferred** implementation does not exist on that page, so the guarded branch can never run and control silently falls through to a worse path — or to nothing): **re-swept 2026-07-25 (S158, Pass …[full text: IMPROVEMENT_ARCHIVE.md]

- **modal-focus-trap** (**S426: HIT — the account screen (gone since the account cleanup; the layer's dialogs are now the name step and the device-extras card), js/ivrit-saves.js, which the S179 sweep predates; FIXED `91c45d6`; streak 0**) …[full text: IMPROVEMENT_ARCHIVE.md]

- pre-ready-i18n / never-re-rendered — **6th instance FIXED S538 `f0905fb6`: the missing-font note on flash ×2, torah, trope ; LL, Name Tags, generator heal.** ACTIVE, …[full text: IMPROVEMENT_ARCHIVE.md]

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

- invisible-rebuild-on-a-hot-render-path (a render entry point rebuilding a container that is hidden by default under the DEFAULT view, with cost that scales with data) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: carrier fixed FM `renderSpacingPanel`/`renderKerningSection` (`fa1f88f`), then clean S299, S317, S330 (the S317→S330 delta adds no `innerHTML` writer; …[full text: IMPROVEMENT_ARCHIVE.md]

- var()-on-an-undefined-custom-property (a `var(--x)` with no fallback whose token is declared nowhere on that page) | retired 2026-09-03 (S330) | 3 consecutive clean sweeps: last hit `hebrew_dictionary` `--navy-deep` (`5e9a6d2`, S285), then clean S299, S317, S330 (the 14 `var()` references added since S317 — `--gold-text`, `--navy`, `--text`, `--white`, `--border` — all …[full text: IMPROVEMENT_ARCHIVE.md]

- falsy-zero (`s.field || default` silently discarding a stored `0`/`''`/`false` in a numeric/boolean restore) | retired 2026-07-17 (S93) | 3 consecutive clean sweeps: 1 hit S64 (FM `spec.version||1.0`, b9c1aa3), then clean S73, S83 (FM v4.18→v4.26 slider/geometry guards), S93 (dashboard movable-panels — array-order `panelLayout`, no numeric restores). Correctness-scoped (a …[full text: IMPROVEMENT_ARCHIVE.md]

- shadowed-global helper (a top-level helper — `esc`/`status`/`applyI18n`/`t`/… — shadowed by an inner decl so a global-expecting call site gets the wrong one) | retired 2026-07-13 (S73) | 3 consecutive clean sweeps: registered S40 (2 torah `esc`-shadow hits fixed, d88fa99), clean S64, clean S73 over the site-wide i18n rollout (one `esc`/`applyI18n` per file; FM's local `t()` …[full text: IMPROVEMENT_ARCHIVE.md]

- listener/interval accumulation (a `setInterval`/`setTimeout`/`addEventListener` attached repeatedly without clear/remove) | retired 2026-07-10 (S64) | 3 consecutive clean sweeps (S52, and S64 over the S53–S63 surface — generator chunked-build timer single/self-chaining + `cancelWorksheetBuild` clears on re-entry, `beforeprint` attached once, torah color fns add no listeners, `_appToastTimer` clear-guarded). Structural/perf-scoped → auto-retired. Re-checked only in Pass A2.

- workMode/step reachability (controls reachable in only one workMode/step while the workflow steers users past it) | retired 2026-07-10 (S52) | 3 consecutive clean sweeps (S36, S41-scoped, S52 — trope_tutor's drawer/tabs/tour-skip/mid-drill-return all reachable-by-design). Re-checked only in Pass A2.

- undo-wiring (Font Maker: `markDirty()` without `udDo`/`udBurstBegin`/`udNudgeTick`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; the S25–26 keyboard additions (node-insert, crop) verified as routing through `udDo` or deliberately non-undoable. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the un-swept FM v3.9–v4.2 additions (auto-detect Apply via `udDo(...withSource)`, pen contour, node delete/paste/transform/specks/fillet all `udDo`; `_hiddenContours`/opacity/snapGuides are documented view-only).

- slider-commit (Font Maker: `oninput` range sliders lacking `onchange="udBurstCommit()"`) | retired 2026-07-08 (S36) | 3 consecutive clean sweeps; every project-data slider commits, and no new range slider has been added. Re-checked only in Pass A2. **Re-verified CLEAN 2026-07-09 (S41)** over the FM v3.9–v4.2 sliders (fillet `filletLiveInput`/`filletCommit` burst; size setters commit; mark-editor `meSetDotSize` uses its own `meBeginEdit`/`meCommitEdit` stack; `adSep`/`adTh` are detection-only until Apply).

## Recurring-pattern sweep status

- _(history)_ **The per-sweep result rows (S141–S357, 83 rows) moved verbatim to `docs/IMPROVEMENT_ARCHIVE.md` in S361 ("Sweep-status rows moved out of the ledger"); the current state of every pattern lives in Pattern health above.** Grep …[full text: IMPROVEMENT_ARCHIVE.md]

### Discovery-pass rotation (run one per session, stalest first)

- P accounts & cloud (one surface): 2026-10-21 (**S535 — 12th P, name_tags (first): W1–W8 29/29, static 26/26, plants 13/13; live clean. Page clean; 1 suite-wide FIXED, 1 gate-2. P-next: LL (never), dashboard (S421).**)

- O deslop — AI-design-tell sweep (one surface): 2026-09-08 (**S346 — 6th O, `flash_cards.html`. ⚑ BLOCKED HERE TWICE (S399, S403) — NOT "needs an attended session". Clone + the 4 parsers install fine; EXECUTING the detector is refused by the sandbox's auto-mode classifier ("Code from External"), and the refusal names the remedy: the maintainer adds a Bash permission rule for the detector (or …[full text: IMPROVEMENT_ARCHIVE.md]

- N mobile & touch-device (one surface): 2026-10-21 (**S534 — 27th N, `name_tags.html` (first audit): 20 cells, rows, tour by taps, 1px header sweep, fingers, rotation, 4×; plants 5/5. FOUND 6, FIXED 4. N-next: LL (never), contact (S276).**)

- M aesthetics & visual design (one surface): 2026-10-21 (**S536 — 27th M, LL (first): 120 shots × 12 cells, real fonts, row census, real Next clicks; plants fired. FOUND 5, FIXED 3 + S464. M-next: FM (S335).**)

- K i18n / localization audit: 2026-10-21 (**S533 — 36th K, `db80feb4..843984b3` (111 commits; parsha_emojis' first): CSV +209 (all resolve), 12 reworded, 0 removed; static 5,502 refs + 2,974 fallback sites (the html arm, lapsed since S475); blind 0/4,328 lines; 102 states by the real switcher (twins = base + 5 known); retry 4/4; 10 surfaces by real input + a switch mid-state. FOUND 4, FIXED 4.**)

- C accessibility (one tool): 2026-10-22 (**S541 — parsha_emojis' first C: 9 surfaces × 6 cells, Tab, dialog 140/140, motion, spacing (all plants fired); forced colours, field borders, zoom. FOUND 6, FIXED 4. C-next: name_tags (never), torah (S298).**)

- A recurring-pattern sweep: 2026-10-21 (**S530 — 41st A, `d77484c5..6f9a5992` (109 commits; parsha_emojis' first): 53 static + 16 runtime arms × 16 pages vs pre-delta (plants fired), 18 blocks, dialogs, print, 1px sweep. FOUND 4, FIXED 4.**)

- G print & export fidelity (one tool): 2026-10-21 (**S537 — parsha_emojis' first G: 56 card PDFs, 108 sheet combos; plants fired. FOUND 2, FIXED 1. G-next: dashboard (S364).**)

- D performance (one tool): 2026-10-22 (**S538 — parsha_emojis' first D (trope was S480, not S365): cold, 33 real-click arms × 1×/4×, traces, idle, leak; controls fired. FOUND 4, FIXED 1. D-next: name_tags (never), FM (S410).**)

- I first-load & empty-state: 2026-10-22 (**S539 — 40th I, S525 → S538 (93 commits; name_tags' first I, parsha_emojis' under its name): 63 virgin cells (plants 334/336); 69 seeds; 27 tours; ~250 openers; 280 bad URLs; failure paths 20. FOUND 2, FIXED 1.**)

- B console/error audit: 2026-10-21 (**S529 — 40th B, `1a3ab8af..5dfff187` (109 commits; parsha_emojis' first B): controls 12/12; 80 load cells × 20 pages; parsha_emojis, LL Coloring + bulk, hub What's-new, dashboard parsha popup, Trainer gallery, 4 tours mid-switch, by real input; 32 wrong-shape stores; iPhone 13 × 20 pages. CLEAN.**)

- J metrics-informed: never run — SKIP in rotation until the impact-metrics dashboard/Worker is live (not live)

- L SEO & discoverability audit: 2026-10-21 (**S532 — 29th L, `18a7e6a3..ca9b9618` (110 commits; LL's launch, parsha_emojis' first L): 20 arms + 3 on 20 pages (plants 29/29); SEO surface unchanged 16/18; LL + parsha JSON-LD claims by real clicks; FAQ twins 10/10. FOUND 1 (gate 2), FIXED 4; S432 struck.**)

- H teacher walkthrough / paper-cuts (one tool): 2026-10-22 (**S540 — parsha_emojis' first H: 11 lessons by real clicks × 2 cells (+ 6 widths, 1920, 5 dated weeks). FOUND 4, FIXED 1. H-next: name_tags, privacy/terms/404 (never), trope (S367).**)

- E freshness/site-health: 2026-10-21 (**S531 — 41st E, `d7c58446..48286048` (108 commits; parsha_emojis' first): 16 arms + carrier lists (plants 18/18), docs, CSP 40 cells (plant 40/40), the stub. FOUND 2, FIXED 4.**)

- F cross-tool consistency: 2026-10-21 (**S528 — 39th F, empty states: 6 no-match surfaces × 4 cells by real input (plants 72/72), 12-page census. FOUND 4, FIXED 1 (+ LL ×2). F-next: loading states.**)

**Next session (S542):** **PR: `claude/improveloop-s535` open → continue; merged → fresh branch.** `sw.js` **v1070**, FM **5.59**, corpus ?v=7. ⚑ Stalest: F (S528), B (S529), A (S530). ⚑ Keep-alive #40 (10-22): confirm green. ⚑ Seeds: 48. ⚑ Maintainer: sw.js `no-store`; 14 fonts; torah screen reader; A/B week eyes; gates 2–4 (+ field borders); O's Bash rule.
