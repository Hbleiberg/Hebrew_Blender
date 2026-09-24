# Torah Trainer, Trope Tutor & vowel color schemes — reference

> Binding rules live in `CLAUDE.md`; this file is how nikkud/trope color coding and the Trope Tutor work.

## Vowel Color Scheme — Default / TaL AM (all three picker tools)

There are **two selectable vowel color schemes**, chosen by a single setting
`vowelColorScheme: 'default' | 'talam'` present on **`classroom_dashboard.html`**,
**`hebrew_blend_generator.html`**, **`flash_cards.html`**, and **`torah_trainer.html`**
(every tool that color-codes nikkud):

- **`default`** — the original 7-group palette/arrangement (Aqua/AH, Red/EH, Grey/Tzere,
  Green/EE, Yellow/OH, Blue/OO, Purple/Shva).
- **`talam`** — matches the **TaL AM curriculum vowel poster**: 6 color families, a different
  order, and a different grouping. Tzere **merges into the Eh/gold group**, Cholam is **navy**,
  Shva is **grey** (deliberately *not* black — black is unreadable in highlight/underline modes).

TaL AM grouping & poster order (top→bottom):

| Group color | Sound | Vowel keys (in order) |
|---|---|---|
| Red | AH | `a`, `patah`, `hpatah`, `hkamatz` |
| Gold/Yellow | EH | `tzere`, `e`, `hsegol` |
| Green | EE | `i` |
| Navy/Blue | OH | `vcholam`, `o` |
| Orange | OO | `shuruk`, `u` |
| Grey | Shva | `sh` |

### How it's wired (identical pattern in all four files)

`classroom_dashboard.html` and `torah_trainer.html` are **display-only** (no vowel picker), so they
have `activeNikudDefaults` + `activeColorDefs` but **not** `activeVowelGroups`/`VOWEL_GROUPS_TALAM`.
The generator and flash cards add the picker pieces on top.

Three scheme-aware accessors sit next to the color constants and are the **only** lookups the
rest of the code uses:

```js
let vowelColorScheme = 'default';                 // dashboard uses settings.vowelColorScheme
function activeNikudDefaults(dark){ /* TALAM_DEFAULTS_* vs NIKUD_DEFAULTS_* */ }
function activeColorDefs(){        /* VOWEL_COLOR_DEFS_TALAM vs VOWEL_COLOR_DEFS */ }
function activeVowelGroups(){      /* VOWEL_GROUPS_TALAM vs VOWEL_GROUPS — gen/cards only */ }
```

- **`getNikudColor`** reads `activeNikudDefaults(isDark)` (override check still first), so
  **`colorizeHebrew` output recolors automatically** — no change to the colorizer itself.
  **Torah Trainer exception:** its `colorizeHebrew` no longer bakes inline `style=` per
  syllable — it emits `<span class="nik nik-<key>">`, and a single **`applyNikkudColors()`** pushes
  the active palette into `--nikv-<key>`/`--nikh-<key>` body vars + a `body.nik-mode-<mode>` class
  (mirroring the trope layer's CSS-var model). So on the Torah page a color / mode / scheme / dark
  change is a **var+class swap with no reading re-render** (the heavy `renderText` tokenize+innerHTML
  is skipped — `data-twi` karaoke indices are untouched); only `showNikkud`/`showCantillation`/
  layout/on-off, which change the actual text or span presence, still call `renderText`. The other
  three tools still recolor via a re-render.
- **`initColorPickers`** iterates `activeColorDefs()` → the per-vowel picker **list re-orders**.
- **`initVowels`** / `refreshVowelGroupColors` (generator + flash cards) iterate
  `activeVowelGroups()` → the **vowel picker boxes re-group/recolor**. In TaL AM mode
  `initVowels` **omits the group headers** (the colored boxes already convey the grouping);
  `refreshVowelGroupColors` targets the header via `.vowel-group-header` so it's a no-op when absent.
- **`setVowelScheme(s)`** sets the scheme, **clears `nikudColorOverrides`** (so the new palette
  shows cleanly), re-runs the builders, calls `syncSchemeButtons()`, re-renders output, and saves.
- **`resetNikudColors`** (the **Reset** button) **must first `confirm()`** — because
  `nikudColorOverrides` is keyed by vowel and shared across schemes, resetting clears the user's
  custom colors for **both** Default and TaL AM. Bail out if the user cancels:
  ```js
  if (!confirm('Are you sure? This resets your custom vowel colors for both the Default and TaL AM schemes.')) return;
  ```

### Where the switch is surfaced
The three controls live in one row **below the color-picker list**, in the order
**Default · TaL AM · Reset** (Default/TaL AM pick the scheme via `setVowelScheme`; Reset clears
overrides via the confirm-gated `resetNikudColors`):
- **Dashboard:** `#vowelSchemeRow` (three `.vowel-scheme-btn` buttons).
- **Torah Trainer:** `#colorResetRow` (reuses the `.vowel-scheme-row` / `.vowel-scheme-btn` styles;
  shown via `toggleColorOptionsVisibility`, which calls `syncSchemeButtons()`).
- **Generator / Flash Cards:** a three-button segmented control inside the
  **"Color Code Nikkud" / color-coding section of Advanced Settings**.

The scheme is serialized in `getSettings()`/`applySettings()` (gen/cards → presets + `.ivrit`)
and in the dashboard / Torah Trainer `settings` objects (`hebrewDashboard_settings` /
`hebrewTorahTrainer_settings`), so it needs **no extra `index.html` AllTools wiring**.

### Rule for any future vowel / color-coding option
A new vowel key or color-coding control must be added to **both schemes**: the default **and**
TaL AM color maps (`NIKUD_DEFAULTS_*` + `TALAM_DEFAULTS_*`), **both** ordered picker-def arrays
(`VOWEL_COLOR_DEFS` + `VOWEL_COLOR_DEFS_TALAM`), and **both** group arrays
(`VOWEL_GROUPS` + `VOWEL_GROUPS_TALAM`, generator + flash cards) — then to
`getSettings()`/`applySettings()`. Keep the vowel **keys** identical across both schemes so the
key-based helpers (`getNikudColor`, All/Main/None) work under either scheme. **Torah Trainer also
needs a matching `.nik-<key>{--nik-c:var(--nikv-<key>);--nik-h:var(--nikh-<key>)}` CSS line** (the
`applyNikkudColors()` loop over `VOWEL_COLOR_DEFS` sets the vars for any new key automatically, but
the CSS class→var mapping is manual).

---

## Trope Color Coding (`torah_trainer.html`)

A second, composable color dimension alongside nikkud coloring: each **word** is classed by its
cantillation **clause family**. Settings keys (in the `hebrewTorahTrainer_settings` blob, so no
AllTools wiring): `colorCodeTrope` (bool) + `tropeColorOverrides` (family → hex, validated on
every read with the **strict `TROPE_HEX6_RE`** (`#rrggbb` only, not the looser `HEX_COLOR_RE`) —
imported blobs are untrusted, AND the value takes an appended `59` alpha suffix and seeds
`<input type=color>`, both of which require the 6-digit form).

- **Taxonomy**: `TROPE_CHAR_TO_FAMILY` maps codepoints to 6 families (`sofpasuk`, `katon`,
  `segol`, `revia`, `geresh`, `rare`; ordered defs in `TROPE_COLOR_DEFS` — the single source of
  truth: `TROPE_FAMILIES` and the legend chips are derived from it). Sof pasuk is
  **positional** — the last Hebrew token of each verse (tokenizeHebrew is one-verse-per-call);
  U+05BD is never mapped (Unicode unifies siluk with meteg). Zarqa/zinor U+0598 **and** U+05AE
  both map to `segol` (Unicode names are swapped in the wild). U+05AB/AC/AD (poetic accents)
  deliberately unmapped. Multi-family word → **last** mark wins (`tropeFamilyOf`). The chart is
  a **deliberate per-mark pedagogical approximation**: conjunctives (munach, mercha, kadma,
  darga) serve several clause types in real leining (munach often serves zakef katon/revia), so
  a munach word can show a different family than its disjunctive — known and accepted;
  context-aware clause propagation is a possible future refinement.
- **Detection reads the ORIGINAL verse text** (parallel split zipped by index) so trope coloring
  works with cantillation hidden. `stripNikkud`'s range swallows maqaf/paseq, so the zip is
  guarded by an array-length equality check; on mismatch `tropeRealignFamilies` recovers each
  display word's family by letter-matching (letters are never stripped), bailing to uncolored on
  any desync — no color, never wrong color. The splitter and `data-twi` sequencing are
  untouched — karaoke timing alignment depends on them.
- **Presentation is class-based, never inline styles**: `trope-<fam>` classes on `.tt-word` +
  `--trope-<fam>-bg`/`-line` CSS vars set on `<body>` by `applyTropeColors()` (the chokepoint,
  called at the top of `renderText()`). All trope selectors are **`:where()`-wrapped** at
  (0,1,0) specificity so `.tt-word:hover` and karaoke `.active` always win — keep it that way.
- **Collision rule (automatic, no setting)**: nikkud coloring on **and** `colorCodingMode ===
  'highlight'` (and nikkud shown) → `body.trope-underline-fallback` switches words from
  background tint to a thick `text-decoration` clause underline (offset below the nikkud).
- **Legend** `#ttTropeLegend` sits above `#ttReading` (renderText never touches it); chips are
  generated once at init from `TROPE_COLOR_DEFS`, and swatches read the body vars so
  theme/picker changes recolor them for free. It shows only when trope coloring is on **and** a
  reading is loaded (hidden over the empty state). The "Learn the trope names →" link renders
  only when `const TROPE_TUTOR_URL` is non-null — set to `'trope_tutor.html'` since the Trope
  Tutor shipped (see its section below). **A Rosh Hashanah or Yom Kippur reading links to the
  tutor's High Holiday melody instead:** the four readings carry `melody:'highholiday'` in
  `HOLIDAY_READINGS`, `readingTutorMelody()` reads it off the loaded reading (custom scope +
  `holidayKey`, so a range narrowed inside the reading keeps it), and then the legend shows its
  twin link `#ttTropeTutorLinkHH` (each link has its own static `data-i18n`; `syncTropeTutorLink()`,
  called from `applyTropeColors`, flips `hidden` and sets the hrefs) and the reading header adds
  `.tt-hh-link` whether or not trope colour is on (screen-only like the header; off in fullscreen).
  Both open `trope_tutor.html?melody=highholiday`. The chant recordings for those readings are
  still PocketTorah's year-round melody. On paper the color→family key travels via the **print
  band** (superseding the older in-flow legend print): `#ttPrintBand`, print-only, in flow
  directly above `#ttReading` (so it prints once, on sheet 1), populated by `buildPrintBand()`
  in the beforeprint handler: range label + compact clause key. The old card's 35%-tint
  (`--trope-<fam>-bg`) swatches collapsed into one grey band on a greyscale copier, so the
  band's swatches use the SOLID `--trope-<fam>-line` ink the printed underlines use. **Sheets
  2..N are identified by `@page` margin boxes** (`@top-left`/`@top-right`, Chromium 131+;
  other engines print an unlabelled margin): the range label on the reading's start side and
  a `counter(page) " / " counter(pages)` opposite, fed by four `--tt-print-*` custom properties
  `setPrintMarginVars()` sets on `<html>` in beforeprint and clears on afterprint, with
  `@page :first` suppressing the label on sheet 1 (the band is there). The boxes are pinned
  `direction:ltr` (a Hebrew UI would bidi-reorder "2 / 23"). **Never re-stamp the band with a
  `position:fixed` element at a negative `top`:** Blink stacks page areas contiguously, so each
  sheet's copy paints at the FOOT of the previous sheet, over its last line, and the last sheet
  gets none (measured on 30 PDFs at every margin setting; the receipts are in `loop-findings.md`). The in-flow legend card and
  `.tt-ref-hdr` are print-hidden (the band replaces them on paper); on-screen legend behavior
  is unchanged. The band never prints spuriously — beforeprint hides it when no reading is
  loaded, and its chips render only with trope coloring on.

---

## Trope Tutor (`trope_tutor.html`)

A standalone Learn + Drill page for the cantillation marks. **Zero runtime Sefaria dependency** —
it consumes only the pre-built static index plus PocketTorah MP3 streams. Its CSP therefore has
**no `sefaria.org`** (and no `esm.sh`); if a change seems to need either, the design has drifted —
stop and reconsider. Shell (dark mode, tooltips, tour, toast, My Fonts) is copied from
`torah_trainer.html`. **Settings are the third tab**
(Learn | Drill | Settings) laid out like the Font Maker's Settings tab: a serif heading per group over a
hairline rule, the group's items in a grid (three across, two below 1024px, one below 640px) with small
uppercase item labels, and nothing to collapse — so the page carries no panel-collapse memory. The
groups are names and tradition (primary names, melody), drill, Hebrew font, and a shared row of progress,
cloud saves and about.
There is no header gear; `openSettings()` survives only as `setMode('settings')` for the account chip's
"Cloud saves…" item (which then scrolls to `#setCloud`) and the tools smoke. Switching to the tab
re-syncs the controls from `settings`; every control saves on change. Print hides the tab like Drill.

- **Index**: `data/trope/trope_index.json` — `{v:1, system:"torah", built, tropes:{<key>:[{p,a,w,ref,he,s,e}]}}`
  where `p` = parsha pocket key, `a` = aliyah "1"–"7", `w` = 0-based sung-word index (= timings
  index), `s`/`e` = clip bounds in seconds (**`0` is valid — never `||`-default these**). Built
  offline by **`node scripts/build-trope-index.mjs`** (plain Node, zero deps; `--source=export`
  default = Sefaria's public GCS text export, `--source=api` mirrors the live v3 endpoint; HTTP
  cache in gitignored `source-data/trope-cache/`). The builder excludes any aliyah whose word count
  doesn't match its PocketTorah timings — never a shifted clip. Timings semantics (audio-audited, mirrored in torah_trainer's `loadKaraoke`): a leading `0.0` is word 0's *nominal
  onset*, NEVER a droppable lead-in sentinel; in the two files with one extra timing (Shemot-1,
  Bamidbar-3) the extra value is a TRAILING end-of-last-word marker, dropped before the count
  check. (The old leading-drop rule shifted those two aliyot one word late.) The builder also
  fails loudly on its Genesis 1:1 smoke test. It rewrites `docs/trope_index_report.md`; re-run it,
  commit both files together, AND bump the `?v=` on the page's index fetch (the sw.js `DATA_CACHE`
  matches exact URLs — the `?v=` bump is what refreshes returning users) whenever the taxonomy or
  selection rules change.
- **Melody motifs**: `data/trope/trope_motifs.json` — `{v:1, system:"torah", key, built, license,
  tropes:{<key>:{notes:[{p,d}], verified, source}}}`, where `p` = semitones from B4 (the treble
  middle line: the chart's tonic A4 is `-2`, its low A3 `-14`) and `d` = relative duration 1–4
  (eighths, sixteenths and triplet eighths 1, quarters 2, dotted quarters 3, halves 4). The
  top-level `key` is a major key name (`"A"`); the page draws that signature and spells in-key
  notes without accidentals, so a natural appears only where the chart prints one. A note outside
  the key is spelled the way the charts print chromatic notes — raised 1st and 4th, lowered 3rd,
  6th and 7th (`motifPitchPos`) — so A major's lowered seventh is G♮ and C major writes F♯ and B♭.
  **The file is the Learn cards' staff, nothing else** — the drill's Melody questions play
  PocketTorah recordings, not the motifs — and it is fetched `?v=4`. **Every shipped entry is `verified:true`,
  hand-transcribed from the printed Ashkenazi cantillation chart recorded in
  `docs/tropepatterns.md`** (each `source` names the chart row it comes from; a grace note is
  written as a full eighth, since the staff has no smaller value — zarka's F♯4 before KA and the D4
  each telisha sings T′ on; `geresh_muqdam` has no figure and no entry). To change a motif, edit the JSON by hand,
  keep `verified:true`, update the row in `docs/tropepatterns.md`, bump the `?v=`, and audition it
  with the card's tune button. Figures longer than eight notes widen their staff, and one reaching
  below A3 deepens it; the card header wraps it below the names.
  **The High Holiday melody is a second file, `data/trope/trope_motifs_hh.json`** (same shape,
  `system:"highholiday"`, `key:"C"` — no signature, so its B♭ and telisha ketana's F♯ draw with their
  accidentals), transcribed from the same book's High Holiday chart for the 21 marks it covers;
  shalshelet, mercha kefula, karnei parah and yerach ben yomo have no entry (they never occur in the
  Rosh Hashanah or Yom Kippur readings). Its one grace note, yetiv's Y′, is a full eighth as in the
  Torah file (A4 A4 G4). It is fetched `?v=3` beside the Torah file and validated the same way,
  each file on its own, so one failing never blanks the other melody's staffs. **Settings → Melody** (`settings.melody`,
  `'torah'` by default or `'highholiday'`) picks which file draws the staffs and feeds the tune
  button; any other stored value shows the year-round staffs and stays stored (`melodyKey()`), so a
  newer page's choice survives a round trip. **`?melody=highholiday` or `?melody=torah`** (the Torah
  Trainer's Rosh Hashanah and Yom Kippur readings link with the first) shows that melody for the
  visit only — `_melodyOverride`, read once at init, never saved or synced, silent on any other
  value; the Settings radios show it. Choosing a melody in Settings, or Reset all, replaces it and
  drops the param with `history.replaceState` (the other params and the hash stay), so a reload
  after a choice does not bring the link's melody back. While the High Holiday melody is on, the Learn tab
  shows a banner naming it (`#tuMelodyNote` — it prints with the chart; its Change button, which
  opens the setting, does not), a card with no High Holiday figure says why where its staff would
  be, and the staff's aria-label names the melody. The builder never reads or writes this file —
  there are no High Holiday recordings to draft from — so it is edited by hand like a verified
  entry, and its `?v=` is bumped on every change.
  **The tune button** (beside the names on every card with a motif) plays the staff as Web Audio
  oscillator tones at the written pitch (B4 = 493.88 Hz, the octave children and women sing), one
  `d` unit = 0.32 s divided by the Settings speed slider, lighting each `.tu-motif-note` with
  `.is-sounding` as it sounds; one tune at a time, it stops the clip engine before starting and a
  clip start or a mode switch stops it (`stopTune()`). The highlight re-finds the card by its
  `data-key` on every note, so a language-switch re-render mid-tune keeps working. No new CSP
  origin: it is `AudioContext` only.
  The machine path still exists: **`node scripts/build-trope-motifs.mjs`** `[--force]
  [--only=<tropeKey>]` pitch-tracks (YIN) the same PocketTorah clips the Learn cards play and takes
  the medoid contour across 2–3 examples, writing `verified:false` drafts and rewriting
  `docs/trope_motifs_report.md`; commit both files together and bump the `?v=` exactly as for the
  index above. Three things that make this builder unlike every other script here:
  - **`verified:true` entries are HUMAN work and the default run preserves them verbatim**, extra
    fields (`source`) and the top-level `key` included; with the whole file verified, a default run
    rewrites only the top level and the report. **`--force` re-analyzes verified entries too and
    will silently discard those corrections** — it is the one destructive flag in `scripts/`.
    Prefer `--only=<tropeKey>`, which carries every other entry through untouched. The smoke test
    allows up to sixteen notes per entry (drafts are cut at eight).
  - **It is the ONE builder with an npm dependency** — a deliberate, documented exception to the
    repo's zero-dep rule: MP3 decoding needs `mpg123-decoder` (`npm install` it at the repo root;
    `node_modules/`, `package.json`, `package-lock.json` are gitignored, so nothing is committed).
    Downloads go through `curl` because Node's `fetch` ignores `HTTPS_PROXY`; MP3s cache in
    gitignored `source-data/motif-cache/`, so re-runs are offline and byte-identical.
  - **Its output is CC BY-SA 4.0**, not the repo's license: the hand transcriptions are released
    that way to match, and any machine draft derives from PocketTorah recordings (© Russel Neiss &
    Rabbi Charlie Schwartz). Both the JSON and the report carry the notice; keep it on anything
    derived from them.
  The script exits non-zero if a smoke test fails — never commit its output without a green run.
- **`TROPES` taxonomy** — one `═══`-marked table (26 entries — zarka is a single entry carrying
  both codepoints: key, chars, display, Ashkenazi +
  Sephardi names, family, rare flag) kept **byte-identical** between `scripts/build-trope-index.mjs`
  and `trope_tutor.html` (same convention as the `.ivrit` engine; copy, don't rewrite). Family
  assignment mirrors torah_trainer's `TROPE_CHAR_TO_FAMILY`; family hues mirror
  `TROPE_DEFAULTS_LIGHT/_DARK` — keep both pages' color language in sync. `sof_pasuk` has no chars
  (positional; siluk = meteg U+05BD, never mapped); `zarka` matches BOTH U+0598 and U+05AE
  (Unicode's swapped names) and displays corpus-dominant U+05AE; `geresh_muqdam` has zero corpus
  occurrences (the Learn card handles example-less tropes).
- **Audio clip engine**: ONE `<audio id="tuAudio">`; `playClip({p,a,w,ref,he,s,e})` resolves the MP3
  via `manifest[p].audioBase` (URL = `POCKET_AUDIO_BASE + encodeURIComponent(audioBase + '-' + a + '.mp3')`),
  swaps `src` only when the aliyah file changes, seeks after `loadedmetadata`, and stops at `e` via
  an rAF watcher + `timeupdate` fallback (the `_verseEndStopAt` pattern; iOS timeupdate is ~4 Hz).
  `playbackRate` is re-asserted in the `play` handler (iOS resets it). Failures add the file to
  `_badFiles` and call `onError` — drills **never dead-end**: substitute example → regenerate
  question (different trope) → skip, with a toast at each step.
- **Rendering is DOM-built** (`createElement`/`textContent`) for all index-derived Hebrew —
  `renderMarkedWord` clusters base letters + combining marks (U+0591–U+05C7) and wraps the hit
  cluster in `.mark-hit`; index strings never pass through `innerHTML`. Glyph tiles render marks on
  the `GLYPH_CARRIER` (`'◌'` dotted circle — one constant; flip to `'א'` if a font floats marks).
  Frank Ruhl Libre has no te'amim or `◌`, so any cluster carrying a mark renders whole (letter +
  nikkud + te'am) from the `'IvritSuite Taamim'` fallback at the end of every `--heb-font` stack
  (`fonts/NotoSerifHebrew-Taamim.ttf`); without it every mark is tofu on stock macOS/iOS.
  Postpositive/prepositive marks sitting at word edges is **correct**, not a bug.
- **Persistence** (no presets, no `.ivrit` engine — AllTools-only backup):
  `hebrewTropeTutor_settings` (tradition ashk/seph, hebFont, hebFontSize, drill-type toggles,
  `drillScope`, `drillLength`,
  playbackRate) and `hebrewTropeTutor_progress` (`{v:1, tropes:{key:{r,w}}, families:{}, pbStreak}`).
  Registered in all five AllTools sites in `index.html`; progress imports go through
  `tropeProgressMerge` (r/w/pbStreak = max, families = union). `hebrewTropeTutor_tourSeen` is the
  export-exempt, erase-cleared tour flag.
  `renderLearn` marks the family on screen visited (`families`) and saves as it renders, except under
  `_chartPrintBuild` (the print chart) or `_i18nRerender` (the `applyI18n` re-render) — both read-only paths.
- **Drill**: 5 / 10 / 20 questions per session (`drillLength`, default 10, picked on the drill start
  screen); `drillScope` and `drillLength` are both **validated at read time**, never at load, because
  a settings blob arrives from an AllTools import or a cloud download — and both selects are JS-built,
  so `syncDrillSelects()` rebuilds them from every path that can change the stored value (a language
  switch, a cloud download, a settings reset). Three types (Identify / Hear / Melody) toggleable in settings
  (last one refuses to uncheck **inline**, no alert). Answers sampled weighted by
  `0.35 + (1 − mastery)` (rare ×0.5, no adjacent repeats); questions stable-sorted by clip file key
  to minimize MP3 hops; distractors sampled without replacement, weighted toward same-family ∪
  `CONFUSABLE_PAIRS` (pashta↔kadma etc.) as the answer's mastery rises. Melody choices are two-tap:
  first tap plays, second tap answers.
- **Results screen**: `showResults()` distils the session's wrong answers into `_lastMissed` (first
  miss per mark wins, keeping the clip that was playing) and `buildMissedReview()` renders that list
  **read-only** — safe to re-render on a language or font change, it never touches progress. Each row
  offers ▶ (replay the clip) and "Study →" (`openLearnFor(key)`); "Drill these marks" sets
  `_missedPool`, a **one-session answer-pool override** that `startDrill()` consumes on its first
  line, before any bail can return, so it can never leak into the next ordinary drill (no storage
  key, nothing synced, nothing to reset). The button lives inside `#resReview`, so a clean sweep
  hides it with the list. Both mastery grids render `.tu-mcell` as a real `<button>` calling
  `openLearnFor(key)`, which switches `currentFamily`, renders, scrolls to and focuses the card
  (`data-key`) and flashes `.pulse-attn`; it **deliberately marks the family visited** — unlike the
  `_i18nRerender` / `_chartPrintBuild` read-only paths — because the student really is about to
  study it. `setMode('drill')` re-shows the start screen whenever no session is active, so a Learn
  detour from the results screen ends there: the score is gone, but while `_lastMissed` holds marks
  the start screen repeats the count and "Drill these marks" (`#drillStartReview`, filled by
  `updateDrillStart()`, so a tab switch, a language change and a reset all keep it current).

---

## Practice link — the sender's look (`?s=`, the link view)

`torah_trainer.html`'s Copy link (`copyPracticeLink`; the readable-param half is in
`shared-components.md` → *Share links*) has an **Include my settings** switch beside it
(`#ttShareSettings` → `settings.shareIncludeDisplay`, remembered and synced with the blob).

- **What travels.** `LINK_DISPLAY` is the one list of carried keys, each with the check a value must
  pass: layout, the four show-toggles (nikkud, te'amim, transliteration, translation), the
  transliteration style, the Hebrew font and the three text sizes, vowel coding (on, mode, scheme,
  overrides), trope coding (on, overrides), karaoke style and follow. Enum lists are read from the
  page's own radios and `<option>`s, colors must be `#rrggbb` (`TROPE_HEX6_RE`), sizes are clamped to
  their sliders, and a font must be in `HEB_FONTS`. **Both ends run the checks:** the sender, so only
  what this page can re-validate ever leaves, and the reader, because anyone can edit a link. `?s=` is
  base64url JSON `{v: LINK_VIEW_V, …}` holding only what differs from `DEFAULTS`.
- **What never travels:** the reading (the readable params carry it), audio speeds and the click
  action, copy and handout preferences, the schedule, and **`translationVersion`**. A version title
  would reach Sefaria, and nothing from a link may. A My Font lives on its own device, so it is
  left out, the toast names it, and the reader gets the standard font.
- **The reader's side is a live view, never a save.** `linkViewApply()` runs right after
  `loadSettings()`. It is silent on garbage: the payload must be an object with the current `v`, at
  most 4096 characters. A key the link leaves out takes `DEFAULTS`, so the reader sees the sender's
  whole look rather than a blend with their own. A key it names but whose value fails its check keeps
  the reader's own. The keys that differ become `_linkView = {own, shown}`, and **`storedSettings()`
  is what every write stores**: `saveSettings`, `saveSettingsFlush` (the cloud `flush`) and the
  handout's pending-save flush. It stores the live settings with each still-shown key put back to
  `own`. A key whose live value no longer equals `shown` was changed by the reader and is saved from
  then on (released).
- **Ending it.** The `#ttLinkView` note offers Keep (`linkViewKeep`: end the view, save) and Use my
  settings (`linkViewRevert`: write the stored form, then `cloudReread()`, which already repaints every
  control and the reading). The view also ends on Reset, on a cloud download (`cloudReread`) and once
  every key has been released. Ending it drops `?s=` from the address bar and keeps the reading
  params, so a later reload shows what the reader chose. Until then, a reload shows the link's look
  again. Print and fullscreen hide the note.

---


## Cloud saves — what the two pages round-trip

Both pages sync one settings blob (and the Trope Tutor its mastery progress) through the shared module
(`docs/reference/accounts-and-cloud.md`); what matters here is what a download must not change.

- **Torah Trainer's translation version is display-only when it cannot be honoured.** `settings.translationVersion`
  is the teacher's choice and is written only by the Version box (and once, as a first-ever default, by
  `populateVersionDropdown`). When a book's licence-filtered list does not offer it, or the version returns no
  English for a passage, the substitute (JPS 1917, else the first safe version) lives in `_versionFallback`,
  `effectiveVersion()` is what every `fetchSefariaText` call and the Version box / footer show, and the stored
  choice travels through a sync untouched. The fallback is cleared on a book change and by a new choice.
- **A download during the handout print override waits.** `onLocalChanged` sets `_pendingCloudReread` while
  `_handoutActive` (the module's flush is a no-op then, so the download stays in the store) and `_handoutExit`
  runs `cloudReread()` — the `resetAllSettings()` sequence plus `syncParshaSelect`, `syncHandoutForm` and the
  fallback reset — afterwards. The Trope Tutor's hook also rebuilds the drill-scope box (`buildDrillScopeSel`),
  which is otherwise built once at init.
- **A practice link's look never reaches the account.** While a link view is up, every write (the module's
  `flush` included) stores the reader's own display values, so opening a link cannot make the settings row read
  "newer here". A download ends the view (`cloudReread` calls `linkViewEnd` first).
- **A font this device lacks stays chosen.** `setHebFont` on an unknown name keeps `settings.hebFont`, clears
  the `.font-opt` highlights and, once `refreshMyFonts()` has answered (`_myFontsLoaded`), shows
  `shared.fonts.missing_note` under `#fontOptions`.
- **A deliberate reset forgets the sync memory** (`IvritSaves.forgetRow`) so the next listing reads the row as
  changed in both places: the settings blob is asked about on the account screen, the Trope mastery is merged
  back losslessly — a reset never overwrites the account's copy by itself. The confirms say so while signed in
  (`*.confirm.reset_*_cloud`).
- By design: `?parsha=` / `?holiday=` / `?ref=` deep links persist the reading and travel (a bookmark on one
  device is the next device's starting point); a `?ref=` range seeds `parshahKey` only when the device has
  none, so a teacher's own week survives opening a colleague's link; `lastPos` and `loopVerse` stay per
  device (omitted); the Trope merge
  maxes `w` as well as `r` (mastery can read lower after a lossless merge, never higher than either side);
  `progress.v` is maxed and then forced to the current schema version.
