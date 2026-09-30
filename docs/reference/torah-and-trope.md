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
AllTools wiring): `colorCodeTrope` (bool) + `tropeCodingMode` (`'highlight'` tint by default or
`'underline'`, read through `tropeModeKey()`: any other stored value shows as Highlight and stays
stored) + `tropeColorOverrides` (family → hex, validated on
every read with the **strict `TROPE_HEX6_RE`** (`#rrggbb` only, not the looser `HEX_COLOR_RE`) —
imported blobs are untrusted, AND the value takes an appended `59` alpha suffix and seeds
`<input type=color>`, both of which require the 6-digit form).

- **The Colors tab's two sections are one list each, and the list is the on/off switch.** Vowel
  color coding is No highlight · Letter · Highlight · Underline (radios `optColorMode`), trope
  color coding No highlight · Highlight · Underline (`optTropeMode`). No highlight writes
  `colorCodeNikkud` / `colorCodeTrope` = `false` and keeps the stored mode (the "Color-code the
  trope" chip turns trope coloring back on in it); the booleans stay the storage because older
  pages, practice links, cloud rows and AllTools files all read them. During a practice link's view
  a pick is one decision (`linkViewClaim`): a look makes both of its list's settings the reader's at
  once, No highlight only the on/off, and the chip, the list's choice of the stored look, claims
  both. `syncFormToSettings` (and
  `syncTropeModeRadios()`, which the "Color-code the trope" chip above the reading also calls)
  is the settings → list half: an unknown vowel mode shows as Letter, the way
  `applyNikkudColors` draws it. Turning vowel coloring on or off re-renders (the `.nik` spans
  exist only while it is on); every other change is a var/class swap. Layout: each list drops
  under its label when it does not fit beside it, no choice breaks mid-label, and the vowel list
  is a 2×2 block (`.tt-color-grid`), because its four English choices need about 321px, more than the
  section's row offers at the default drawer width. The page's
  `.radio-group` radios are visually hidden but focusable (the Trope Tutor's rule, with
  `position:relative` on the group so they scroll with the drawer), so the lists stay
  keyboard-operable like the switches they replaced; the drawer's focus trap skips unchecked
  radios. Every `.radio-group` on the page is a `role="group"` named by `aria-labelledby` from its
  visible label; the two karaoke groups also take the *Karaoke highlighting* section heading
  (`torah.settings.panel_karaoke`, `#lblKaraokeHdr`, on the Audio tab), so their Highlight does not sound
  like the color lists'.

- **Taxonomy**: `TROPE_CHAR_TO_FAMILY` maps codepoints to 7 families (`sofpasuk`, `etnachta`,
  `katon`, `segol`, `revia`, `geresh`, `rare`; ordered defs in `TROPE_COLOR_DEFS` — the single
  source of truth: `TROPE_FAMILIES`, the pickers, the legend chips and the print key are derived
  from it). Sof pasuk is **positional** — the last Hebrew token of each verse (tokenizeHebrew is
  one-verse-per-call); U+05BD is never mapped (Unicode unifies siluk with meteg). **The Etnachta
  clause is half positional:** the etnachta mark (U+0591) is its own family, while mercha, tipcha
  and munach map to `sofpasuk` per mark, and `tokenizeHebrew` then moves every `sofpasuk` word
  before the verse's etnachta word into `etnachta` (the first half leads into etnachta, the second
  into sof pasuk). A verse without an etnachta keeps them all; in a double-cantillation verse
  the last word resolved to `etnachta` splits; a realign desync that stops short of the
  etnachta uncolors those words rather than guess their half. Etnachta's default is orange
  beside sof pasuk's red. Zarqa/zinor U+0598 **and** U+05AE
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
- **The underline look**: `body.trope-underline-fallback` switches words from background tint
  to a thick `text-decoration` clause underline (offset below the nikkud) when the teacher
  chooses Underline, **or automatically by the collision rule**: nikkud coloring on **and** any
  vowel look but Underline (`colorCodingMode !== 'underline'`: Highlight's syllable tints would
  stack with the word tint, and Letter's colored letters measured 1.85–2.1:1 on it; an unknown
  mode draws as Letter) with nikkud shown, whatever the trope list says (the tip says so). The
  one class carries both causes. The translit-under rules read it, and so do the
  legend's swatches, which switch from the tint to the solid `-line` color under it (`--tt-sw-bg` /
  `--tt-sw-line`). The copy path (`_inlineCopyStyles`) never reads it: it applies the same rule to
  the copy's own options and marks (Copy → Nikkud can include vowels the screen hides, or drop ones
  it shows). Print always underlines.
- **Legend** `#ttTropeLegend` sits above `#ttReading` (renderText never touches it); chips are
  generated once at init from `TROPE_COLOR_DEFS`, and swatches read the body vars (the tint, or
  the solid line color while `body.trope-underline-fallback` is set), so theme, picker and look
  changes recolor them for free. It shows only when trope coloring is on **and** a
  reading is loaded (hidden over the empty state). The "Learn the trope names →" link renders
  only when `const TROPE_TUTOR_URL` is non-null — set to `'trope_tutor.html'` since the Trope
  Tutor shipped (see its section below). **A Rosh Hashanah or Yom Kippur reading links to the
  tutor's High Holiday melody instead:** the four readings carry `melody:'highholiday'` in
  `HOLIDAY_READINGS`, `readingTutorMelody()` reads it off the loaded reading (custom scope +
  `holidayKey`, so a range narrowed inside the reading keeps it), and then the legend shows its
  twin link `#ttTropeTutorLinkHH` (each link has its own static `data-i18n`; `syncTropeTutorLink()`,
  called from `applyTropeColors`, flips `hidden` and sets the hrefs) and the reading header adds
  `.tt-hh-link` whether or not trope colour is on (screen-only like the header; off in fullscreen).
  Both open `trope_tutor.html?melody=highholiday`. **A haftarah links to the tutor's Haftarah melody the same
  way:** `readingTutorMelody()` returns `'haftarah'` for the haftarah scope (it is also what the Trope staff
  draws), the legend's third link `#ttTropeTutorLinkHaf` and the header link (`torah.reading.haf_trope_link`)
  open `?melody=haftarah`, and the recording chip stays off — PocketTorah's haftarah recordings are in that
  melody. The chant recordings for those readings are
  still PocketTorah's year-round melody, and the header says so: while Chant can play the reading
  (`currentReadingChantable()`), a `.tt-notice-chip` right after `.tt-hh-link` reads
  `torah.reading.hh_chant_chip`, and its tap tip (`torah.reading.hh_chant_tip`) says the day's
  reading is chanted to the High Holiday melody the tutor's staffs show. It carries its own
  `aria-label` (`bindTip` names a chip without one "More information", hiding its text from a
  screen reader); like the page's other notice chip it stays in fullscreen, where the link is left
  off, and is print-hidden. On paper the color→family key travels via the **print
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

**The staff engine is `js/trope-staff.js`**, one classic same-origin script both this page and the Torah
Trainer load right before their inline `<script>` (plain globals): the `TROPES` taxonomy, the pitch model
(`keySignature`, `motifPitchPos`, `shiftedKey`…), the staff primitives, `layoutPhraseStaff` /
`renderPhraseStaff`, the phrase-file validation, and the reading-staff functions the Trainer's *Trope staff*
layout uses (below). It reads no `settings`, no `I18n` and no DOM but `createElementNS`; a function that
needs a page's state (`tuneShiftVal`, `staffKey`, `noteNameAt`, `renderMotifStaff`, the tune players)
stays in its page. A change to the engine is proved by snapshotting every Learn and Phrases staff's
`outerHTML` before and after (the melody × key × voice × note-names matrix) — the two must be byte-identical
unless the change means to move a note; the reading-staff half the tutor never calls (`tropeUnitsOfVerse`,
`tropeContextsOf`, `tropeChooseFigures`, `tropeBuildReadingRow`, `tropeSubRow`, `tropeSplitSystems`) is proved by
`node scripts/smoke-trope-staff.mjs` instead.

A standalone Learn + Phrases + Drill page for the cantillation marks. **Zero runtime Sefaria dependency** —
it consumes only the pre-built static index plus PocketTorah MP3 streams. Its CSP therefore has
**no `sefaria.org`** (and no `esm.sh`); if a change seems to need either, the design has drifted —
stop and reconsider. Shell (dark mode, tooltips, tour, toast, My Fonts) is copied from
`torah_trainer.html`. **Settings are the last tab**
(Learn | Phrases | Drill | Settings) laid out like the Font Maker's Settings tab: a serif heading per group over a
hairline rule, the group's items in a grid (three across, two below 1024px, one below 640px) with small
uppercase item labels, and nothing to collapse — so the page carries no panel-collapse memory. The
groups are names and tradition (primary names, melody), sing along (key, voice, note names — see *Key and
voice* and *Note names* below), drill, Hebrew font, and a shared row of progress, cloud saves and about.
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
  middle line: the chart's tonic A4 is `-2`, its low A3 `-14`) and `d` = relative duration 1–4,
  read from the row as `docs/tropepatterns.md` section A says: anything shorter than a quarter
  (a triplet note or a grace note included) is 1, and a longer note, tied notes merged, takes the
  nearest of 2 (quarter), 3 (dotted quarter) and 4 (half). The
  top-level `key` is a major key name (`"A"`); the page draws that signature and spells in-key
  notes without accidentals, so a natural appears only where the chart prints one. A note outside
  the key is spelled by `motifPitchPos`'s rule — raised 1st and 4th, lowered 3rd, 6th and 7th —
  which gives the charts' own spellings: A major's lowered seventh is G♮, and C major writes F♯ and
  B♭.
  **The file is the Learn cards' staff, nothing else** — the drill's Melody questions play
  PocketTorah recordings, not the motifs — and it is fetched `?v=6`. **Every shipped entry is `verified:true`,
  hand-transcribed from the printed Ashkenazi cantillation chart recorded in
  `docs/tropepatterns.md`** (each `source` names the chart row it comes from; the row is read onto
  the staff's four values as section A there says — a grace note is a full eighth, since the staff has
  no smaller value (zarka's F♯4 before KA, the D4 each telisha sings T′ on, yetiv's Y′), tied notes are
  one held note, rests drop; pazer holds its two opening D4s as one quarter, the maintainer's
  correction of the print; `geresh_muqdam` has no figure and no entry). **`node
  scripts/build-trope-phrases.mjs` checks both motif files on each run**: they must carry exactly the
  cards section A's table names, each `verified:true`, its `source` naming the table's row, with
  whole-number `p` and `d` 1–4, and each must equal its row reduced as above. It fails on a
  difference, printing the notes the row gives. The pazer correction is applied before it compares,
  and only while row 30 still prints PA D4(e) ZER D4(s): otherwise the build fails with "departure no
  longer applies". To change a motif, fix the row in `docs/tropepatterns.md` first, edit the JSON by hand
  to match, keep `verified:true`, run the phrases builder green, bump the `?v=`, and audition it
  with the card's tune button. Figures longer than eight notes widen their staff, and one reaching
  below A3 deepens it; the card header wraps it below the names (and on a phone a staff too wide for
  its card shrinks to fit, `max-inline-size:100%`).
  **The High Holiday melody is a second file, `data/trope/trope_motifs_hh.json`** (same shape,
  `system:"highholiday"`, `key:"C"` — no signature, so its B♭ and telisha ketana's F♯ draw with their
  accidentals), transcribed from the same book's High Holiday chart for the 21 marks it covers;
  shalshelet, mercha kefula, karnei parah and yerach ben yomo have no entry (they never occur in the
  Rosh Hashanah or Yom Kippur readings). Its one grace note, yetiv's Y′, is a full eighth as in the
  Torah file (A4 A4 G4; the Torah yetiv is B4 B4 A4). It is fetched `?v=4` beside the Torah file and validated the same way,
  each file on its own, so one failing never blanks the other melody's staffs. **The Haftarah melody is a third
  file, `data/trope/trope_motifs_haftarah.json`** (`system:"haftarah"`, `key:"F"` — D minor written with F major's
  one flat), which the phrases builder **derives** from `docs/tropepatterns.md` section H through section A's
  Haftarah column on every run (never hand-edited; each entry `verified:false` while its row carries
  `[unverified]`), fetched `?v=1` and validated like the others; every mark but geresh muqdam has a figure in it.
  **Settings → Melody** (`settings.melody`, `'torah'` by default, `'highholiday'` or `'haftarah'` — the Haftarah
  radio's label carries the suite's Beta badge, `shared.badge.beta`) picks which file draws the staffs and feeds
  the tune button; any other stored value shows the year-round staffs and stays stored (`melodyKey()`), so a
  newer page's choice survives a round trip. **`?melody=highholiday`, `?melody=haftarah` or `?melody=torah`** (the
  Torah Trainer's Rosh Hashanah and Yom Kippur readings link with the first, its haftarot with the second) shows
  that melody for the visit only — `_melodyOverride`, read once at init, never saved or synced, silent on any
  other value; the Settings radios show it. Choosing a melody in Settings, or Reset all, replaces it and
  drops the param with `history.replaceState` (the other params and the hash stay), so a reload
  after a choice does not bring the link's melody back. While the High Holiday or the Haftarah melody is on, the
  Learn tab shows a banner naming it (`#tuMelodyNote`, one span per melody with its own static `data-i18n` — it
  prints with the chart; its Change button, which opens the setting, does not), a card with no High Holiday
  figure says why where its staff would be, the staff's aria-label names the melody, and on the Haftarah melody
  the key bar and Settings readout name the relative minor (`keyNameText` through `trope.key.name_minor`, as the
  Trainer's staff readout does). The motif builder never reads or writes the High Holiday
  file — there are no High Holiday recordings to draft from — so it is edited by hand like a verified
  entry (the phrases builder checks it against its rows), and its `?v=` is bumped on every change.
  **The tune button** (beside the names on every card with a motif) plays the staff as Web Audio
  oscillator tones at the staff's pitch — the written pitch (B4 = 493.88 Hz, the octave children and
  women sing) moved by the Key setting, an octave lower with Low voices (below) — one
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
- **Phrases**: `data/trope/trope_phrases.json` — every row of both printed charts note for note (41
  Torah, 33 High Holiday + row 20's second setting), for a staff of a whole reading, and the 36 Haftarah
  rows of section H (an unverified rendering written from memory, drawn only by the Torah Trainer's Trope
  staff: the tutor reads the file through `melodyKey()`, which names the two charts, so the third melody is
  inert here). The Phrases tab fetches it (`?v=2`, in `docs/reference/ops.md`'s list); bump that with every
  rebuild that changes it.
  - It is built by `node scripts/build-trope-phrases.mjs` from the fenced row blocks in
    `docs/tropepatterns.md` sections B, C and H, which are **the only hand-edited copy of the notes**:
    fix a note there and re-run the builder, never edit the JSON. A melody without a motif file (the
    Haftarah rows) skips the Learn-card check; its rows are smoke-tested on their own (every mark printed,
    the four verse endings as closings, A3–B♭4).
  - Zero dependencies, offline. It writes `docs/trope_phrases_report.md`: every figure of every mark
    in every printed context, and the staff check above.
  - **Shape.** `{v:1, built, license, source, tpq:48, values, melodies:{torah|highholiday|haftarah:{key, rows}},
    figures}`. Each row is flat: `{n, he, tags, notes:[{p, v, t, g?, r?, tie?, a?}], syl:[{t, hyphen,
    unit, from, to}], units:[{k, from, to}], tup:[{from, to}], slur:[{from, to, dashed?}]}`.
    - `p` is semitones from B4, as in the motif files; a rest (`r`) has no `p`.
    - `t` is ticks at 48 to the quarter; a triplet note carries its real length.
    - Syllables, marks, triplets and slurs are spans of note indices, so a triplet or slur may cross
      from one mark into the next. `dashed` marks a dashed slur (`~~`), which no row prints yet.
    - `figures.<melody>.<mark>` lists each distinct figure as `{refs, prev, next}`: `refs` holds the
      `[row, mark index]` pairs that sing it, and `prev`/`next` the marks printed before and after
      it (`^` and `$` are the row's edges).
  - **Checks.** The builder refuses any line that does not read back exactly as written. It also
    refuses:
    - a missing or doubled row;
    - an unknown mark or value;
    - a Torah F, C or G written without its ♯ or ♮;
    - an accidental the chart never prints;
    - a triplet that is not at least two sounding notes worth three of one value;
    - a tie across two mark lines, from a rest or touching a grace note, and a slur from a rest;
    - a syllable of rests only, or a `-` on a mark line's last syllable;
    - a tag anywhere but right after the row number, or a bracket or Latin letter in the Hebrew;
    - a header whose Hebrew marks differ from its lines, compared one for one (a two-word mark
      name printed with its mark on both words counts once: telisha gedola in this chart, and zakef
      gadol or karnei parah if a print doubles them).

    `--doc` and `--lenient` build a second reading, so they need an `--out` outside `data/` and
    `docs/`. `built` keeps its date when nothing changed, so a re-run is byte-identical. It is CC BY-SA 4.0,
    like the motif files.
  - It reads the **`TROPES` taxonomy** from both carriers, which it requires to be byte-identical, and
    adds `munach_legarmeh`; it carries no copy of the block.
  - **`--census`** is the one networked path. It reads the whole Torah text (Sefaria's public export,
    the same gitignored `source-data/trope-cache/merged-<Book>.json` files and curl fallback as the
    index builder) and the four `melody:'highholiday'` readings parsed from `torah_trainer.html`'s
    `HOLIDAY_READINGS`. It counts every mark-before-mark context against the chart and writes
    `docs/trope_contexts_report.md`; nothing is written until the census passes too.
    - The report names the phrase JSON's sha1 on its Chart line, and a plain run warns when the JSON
      it builds differs (re-run with `--census`). It keeps its own date while its content is unchanged.
    - The aliyot are `data/pockettorah/aliyah.json`'s (the Torah Trainer's), each paired with its
      parasha by its first verse; the report notes the two aliyah ends Hebcal's calendar puts elsewhere.
    - A maqaf compound is one word. The text draws the legarmeh line full-size and a paseq small
      (`<small>׀</small>`): the line after a munach makes it munach legarmeh, and a paseq leaves the
      mark before it as it is. The loader refuses any edition but *Miqra according to the Masorah*,
      and the census fails if no small paseq is found.
    - Genesis 35:22 and the two Decalogues are left out, because they carry two cantillation systems.
    - Its smoke tests: Genesis 1:1's seven marks, 5,846 verses, 122 High Holiday verses, and none of
      the four marks the High Holiday chart omits in those readings.
    - **Real examples.** The same run writes `data/trope/trope_phrase_examples.json` (CC BY-SA 4.0,
      budget 64 KB): up to four places where the Torah sings each chart row. A match is a run of
      consecutive words carrying the row's marks, one mark per word, with no paseq or legarmeh line
      inside it; runs no conjunctive leads into are preferred, and an `[aliyah-end]` row's run ends an
      aliyah while no other row's does.
      - Year-round rows are `{p, a, ref, he, s, e}`: PocketTorah's parasha and aliyah and the clip
        from the first word's onset to the next word's; `e` is `null` at an aliyah's end, where the
        clip plays out. High Holiday rows are `{ref, he}`: PocketTorah recorded only the year-round
        melody. Their aliyah ends are the builder's `HH_ALIYAH_ENDS`.
      - An aliyah is used only when its words and taps agree one for one (a maqaf-joined word takes
        one tap per piece; 375 of 378 do). A run is dropped when its onsets step back, repeat or wait
        over 4 s (10 s where a rare mark is sung), or when it lies in `TIMING_SLIPS`.
      - **`TIMING_SLIPS`** lists the stretches where the taps slip by a word while the count still
        matches: an extra tap in one place and a missing one in another. **`--census --audit-audio`**
        re-derives the table by listening. It downloads every recording once (about 640 MB), decodes
        it with `mpg123-decoder` as the motif builder does, and keeps only a 10 ms loudness envelope in
        the gitignored `source-data/trope-cache/audio-env/`. Nearly every verse opens after a pause,
        and a good tap for a verse's first word sits right beside it. The run fails unless the table
        is exactly what it hears, and unless Bereshit 1 listens clean.
      - Smoke tests: row 1 finds Genesis 1:3 at Bereshit 1 (23.60–26.30 s); row 40 has Numbers 35:5
        alone; only row 41 has `e: null`; Shemini 6 is slipped at Leviticus 11:9; and each of the
        five backward or repeated onsets fails the gap rule.
      - The file keeps its own `built` date while unchanged, and a plain run warns when its rows no
        longer follow the chart. The contexts report's last section lists every pick with its clip
        times: listen to a few before trusting a new build.
    - `docs/tropepatterns.md` → *G. Toward a parasha staff* reads the result.
- **The Phrases tab** (`#phrasesView`) draws that file: one clause group at a time (`PHRASE_GROUPS`, the
  charts' own teaching order, 12 Torah, 11 High Holiday and 12 Haftarah groups; a row the table misses joins a last
  "More phrases" group, so every row shows exactly once), in the melody Settings chooses.
  - **A card per row**: its number, the Hebrew as printed, a chip per mark (glyph and name in the chosen
    tradition; it opens that mark's Learn card through `openLearnFor`, and hovering or focusing it lights
    the mark's notes, bar and syllables), the staff, and a play button.
    - Munach legarmeh has no Learn card (it is not in `TROPES`): its chip is a plain label, from the
      page-local `PHRASE_LEGARMEH`.
    - The chips row is pinned LTR like the staff, so the chips stand in the notes' order in either
      language.
  - **`renderPhraseStaff(row, opts)`** is full notation and pure: `layoutPhraseStaff` places everything
    around the middle line from the row, `{key, shift}` and (with note names on) the caller's `names` alone,
    and the drawing turns that into SVG with the staff primitives the Learn staff uses. It is the building
    block of the Torah Trainer's reading staff (`docs/tropepatterns.md` → G; *Trope staff* below), which
    passes the options the tutor never does — all default-off, so the tutor's output is unchanged:
    `opts.lyrics === false` (no syllable text; the syllables neither space the notes nor take a line),
    `row.words` (one label per word, `{from, to, w}`: each is centred under its notes and pushes the
    next one clear; their centres come back as `L.words`), `opts.accidentals === 'unit'` (a sign holds
    to the end of its mark's figure, not the row), `opts.layout` (a layout already computed, so wrapping
    and drawing share one), and `famOf(k, ui, rowUnit)`'s extra arguments. It draws:
    - every value and dot, and a rest of any value at its engraved height (`phraseRestGlyph`): a
      hooked rest has a knob per flag, from the third space down (a 32nd's third in the fourth), on a
      stem to the second line (eighth) or the bottom line; a quarter rest spans the middle three
      spaces; a half rest sits on the middle line; a dot rides in the third space. The layout spaces a
      rest by the glyph's own reach (both charts print only eighth rests);
    - beams per syllable, which break at rests and grace notes and split a run over eight at the
      quarter, with deeper beams and stubs for sixteenths and 32nds; the note farthest from the middle
      line turns a beam's stems;
    - flags, ties, slurs (fitted to clear the notes and accents inside them) and triplets (a bare 3 on
      a beam that is exactly the triplet, else a bracket above);
    - grace notes, small and slashed (row 41's pair is beamed);
    - accents and tenuto lines above the staff;
    - accidentals held to the end of the row, since the chart has no bar lines;
    - the syllables with their hyphens, and a family-coloured bar over each mark's notes;
    - the note names, when shown (*Note names* below), on their own line between the staff and the
      syllables.

    Spacing grows with the log of each note's length and widens for accidentals, dots, flags and
    syllables. A row wider than its card scrolls inside an LTR wrapper, which is also its keyboard stop
    and carries its label.
  - **Examples** (`buildPhraseExamples`, screen only) come from `data/trope/trope_phrase_examples.json`
    (`?v=1`; *Real examples* above), checked like the chart. A row whose marks (`k`) no longer match the
    chart shows *Examples could not be loaded* rather than another phrase's words.
    - Each example's words light every mark in its own word (the Learn cards' `renderMarkedWord`, one
      word at a time), with the parasha and verse as the Learn cards write them.
    - On the year-round melody a button plays PocketTorah's recording of those words through
      `playClip`. It stays pressed until the clip ends or anything stops it (`_pexId`, reset from
      `stopClip`).
    - An `[aliyah-end]` example has `e: null`: `playClip` then sets `_stopAt` to `Infinity`, so the
      seek watcher still heals a snapped-back seek, and the recording's `ended` event closes the clip
      and calls its `onEnd`.
    - On the High Holiday melody the examples are words only, named by their reading (Rosh Hashanah,
      day 1 or 2; Yom Kippur morning or afternoon). The melody banner says there are no recordings,
      and a row the readings never sing says so.
    - On the Haftarah melody a card has no examples block at all (the census reads no Nevi'im text); the
      melody banner (`#tuPhrMelodyNote`, one span per melody) says so.
  - **The tune** is `togglePhraseTune`, on the Learn tune's scale (an eighth is 0.32 s at 1×): ties sound
    as one note, a rest is silent for its whole value and lit while it lasts (the note before it goes
    dark, so nothing looks held through the pause), and a grace note is quick and borrowed from the
    note it leads into.
    No other note is shorter than `PHRASE_MIN_NOTE` (0.1 s at 1×, scaled by the speed setting). The
    chart's 32nds (80 ms at this tempo) and triplet 32nds (53 ms: gershayim's turn, the High Holiday
    segol's run) would blur into one sound, so they are held that long and the tune stretches around
    them. The staff still shows the printed rhythm.
    Both tunes go through `_playTuneCore`, so `stopTune()` stops either, and a clip, a tab switch or a
    settings change stops both. A phrase tune's id is `phrase:<melody>:<row>`.
  - **One key bar.** `setMode` moves `#tuKeyBar` into `#tuKeySlotPhrases` and back above the family
    chips. On the Phrases tab, `syncTuneControls` names the phrase chart's key and waits for that file,
    not the motif file.
  - **Rendering is read-only and lazy.** The tab renders when it is shown, and then only while it is
    showing: through `renderPhrasesIfShown()` beside every `renderLearn()` (melody, key, voice,
    tradition, reset, cloud reread, retry) and in `applyI18n`. The group on screen belongs to the visit
    and is never stored.
  - **Failure.** The file is parsed with `ivritSafeParse` and checked row by row (`_validPhraseRow`); a
    row that does not hold together is left out. A missing or bad file never touches Learn or Drill:
    the tab says so and offers *Try again* (`retryLoadData`).
  - **Print.** Ctrl+P or *Print phrases* on this tab sets `body.tu-print-phrases` and prints
    `#tuPhrasePrintSheet`: every group of the melody, built by the same card builder, in the key on
    screen (the key bar's line prints while the staffs are moved), without controls or examples. From
    any other tab, the Learn chart prints as before.
- **Key and voice** (Settings → *Sing along*, and the key bar `#tuKeyBar`, on the Learn and Phrases tabs). Two fields of the
  settings blob move every staff and its tune; the motif files are never touched.
  - **`tuneShift`** (whole half steps, −6…6, default 0) moves every note of both melodies and redraws the
    staff in the key it lands on: `staffKey()` = `shiftedKey(file key, shift)`, which reads the tonic's new
    pitch class off `MAJOR_KEY_BY_PC` (C, D♭, D, E♭, E, F, F♯, G, A♭, A, B♭, B — the fewer-accidentals
    spelling, F♯ for the tritone), and an unmoved chart keeps its own key name. `keySignature` and
    `motifPitchPos` take the new key as they took the printed one, so the chart's chromatic notes keep
    their degree — the lowered 7th and the High Holiday raised 4th — which is why D♭ major writes C♭ and
    F♯ major B♯: respelling them would bend the figure's shape. Every combination was checked note by
    note (spelled pitch = sounding pitch), and at 0 every staff is byte-identical to the unmoved page.
    The deepest staff is the High Holiday melody at −6 (C♯3, four ledger lines; the existing height
    rule deepens it), the highest note F5 (Torah +6), so nothing grows at the top.
  - **`tuneVoice`** (`'high'` or `'low'`, read through `tuneVoiceKey()`: any other stored value shows as
    high and stays stored) never moves a note: Low voices writes a small `8` under the clef (the treble
    clef that sounds an octave down, as men sing the printed chart) and the tune plays an octave lower,
    in a fuller tone — a cached `PeriodicWave` of five harmonics, falling back to the triangle if one
    cannot be built — because a triangle's faint overtones cannot carry A2–B3 through a phone or
    Chromebook speaker.
  - **One writer, one reader.** `setTuneShift(v)` (clamped through `_sliderNum`, like `loadSettings`) is
    called by the Settings slider, the bar's arrows (`stepTuneShift`; `aria-disabled` at the ends so
    focus stays) and both resets; it saves, stops a playing tune (the `setMelody` precedent) and
    re-renders Learn. `setTuneVoice(v)` does the same for the voice. `syncTuneControls()` is the read-only
    half, called from `renderLearn`, `syncFormToSettings` and `applyI18n`, so a melody change (which
    renames the key: +3 is C major on the year-round staffs, E♭ major on the High Holiday ones), a reset,
    a cloud download and a language switch all repaint both controls. It writes no text before
    `_i18nReady`, and the bar stays hidden until then and while the melody's motif file is missing.
  - **Text.** The key name is `trope.key.name` around one of twelve `trope.key.note_*` names (Hebrew: the
    pointed solfège of the page's intro, "לָה מז'ור"); the distance is `trope.key.rel_*` (plural
    `.one`/`.other`). The Settings readout is the signed number ("+3", pinned `dir="ltr"`) so its width
    never moves the slider's track; the note under it and the slider's `aria-valuetext` name the key.
    Only the bar's own buttons write its polite live region (`#tuKeyLive`), so the slider and a
    language switch do not announce twice.
  - **Paper.** The print chart is built by `renderLearn`, so it prints in the chosen key. The bar prints
    only while moved (`.is-moved`: a shift or Low voices), without its arrows and reset, so a moved chart
    names its key and a printed-key chart carries no key line.
  - The recordings (Learn examples and the drill) keep the reader's own pitch; the Torah Trainer's
    chant pitch is the tool for moving a recording.
- **Note names** (Settings → *Sing along* → Note names: Off, A B C, Do re mi). One field of the settings blob,
  `noteNames` (`'off'` by default, `'letters'` or `'solfa'`, read through `noteNamesKey()`: any other stored
  value shows no names and stays stored), writes a name under every note of every staff, on the Learn cards and
  the Phrases tab alike. The data files are never touched, and with names off every staff is byte-identical to one
  drawn without the feature. The Torah Trainer's Trope staff offers the same choice (`staffNoteNames`; *Trope
  staff* → *Note names* below).
  - **What a name says.** `noteNameAt(p, key, mode)` reads a note where the staff writes it: `motifPitchPos`'s line
    or space, and the alteration it sounds (its own sign, else the key signature's), in the key the staff is drawn
    in. *A B C* is that letter with its ♯ or ♭, so C♯ in A major although the signature carries the sharp.
    *Do re mi* is movable do, not fixed do: do is the tonic of the drawn key (the note the key is named after), so a
    staff moved by the Key setting keeps its names, and a note outside the key carries the sign it takes against the
    signature (A major's G♮ is ti♭, the High Holiday C major's F♯ is fa♯). Every staff's names were checked in all
    13 keys: each letter sounds its note, and each syllable names the note's distance from the tonic and never changes
    with the key.
  - **Text.** The syllables are `trope.notes.solfa_1`…`_7` (English do re mi fa sol la ti; Hebrew the pointed דוֹ רֵה מִי
    פָה סוֹל לָה סִי of the key names). A Hebrew syllable's `<text>` carries `lang="he"` and `direction="rtl"`, so its ♯
    or ♭ reads after it. The key bar still names keys in fixed do in Hebrew (לָה מז'ור), so the Settings note says
    that do starts from the note the key is named after.
  - **Where.** On a Learn card the names share one line under the lowest ink (a head below the staff with its
    accidental, or a stem hanging from a note on or above the middle line), the staff deepening to hold it, and the
    staff widens until no two neighbouring names touch (`noteNameWidth` estimates each at its bold width). On the
    Phrases tab `buildPhraseCard` passes `names` to `renderPhraseStaff` (index-aligned with the row's notes; a rest
    has none and a grace note's is smaller). Its layout gives them the line under the staff, moves the syllables one
    line down, and spaces the notes so that a name never touches the one before it. Every name is a
    `<text class="tu-nn">` inside its note's group.
  - **Lit.** Names are `--muted`. The sounding note's name turns `--gold-text` (dark: `--gold-light`) and bold with
    its head, and a Phrases chip lights its mark's names with its notes: colour and weight only, no motion.
  - **Spoken.** While names are shown, the staff's label ends with them (`trope.notes.staff_aria`): the Learn SVG's
    `aria-label`, and the Phrases scroller's.
  - **One writer.** `setNoteNames(v)` saves, then re-renders Learn and, while it shows, the Phrases tab. A tune that
    is playing keeps playing, since the tune finds its staff again at each note. `syncTuneControls()` checks the
    radios. The staffs draw no names before the dictionary has loaded (`noteNamesMode()`, the key bar's rule), and
    `applyI18n` re-renders them in the new language. Both print sheets carry the names, printed muted.
- **`TROPES` taxonomy** — one `═══`-marked table (26 entries — zarka is a single entry carrying
  both codepoints: key, chars, display, Ashkenazi +
  Sephardi names, family, rare flag) kept **byte-identical** between `scripts/build-trope-index.mjs`
  and `js/trope-staff.js` — the staff engine both the tutor and the Torah Trainer load, which is where
  the tutor reads it from (same convention as the `.ivrit` engine; copy, don't rewrite). Family
  assignment mirrors torah_trainer's `TROPE_CHAR_TO_FAMILY`; family hues mirror
  `TROPE_DEFAULTS_LIGHT/_DARK` — keep both pages' color language in sync. The one difference is
  munach: a card sits in one family, so the tutor's Etnachta clause is munach and etnachta (the
  chart's "munach before etnachta", the figure the munach card sings) and mercha and tipcha stay
  with sof pasuk, while the trainer colors all three by the half of the verse they stand in
  (above). `sof_pasuk` has no chars (positional; siluk = meteg U+05BD, never mapped); `zarka` matches BOTH U+0598 and U+05AE
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
  `hebrewTropeTutor_settings` (tradition ashk/seph, `melody`, `tuneShift`, `tuneVoice`, `noteNames`, hebFont,
  hebFontSize, drill-type toggles, `drillScope`, `drillLength`, playbackRate) and `hebrewTropeTutor_progress` (`{v:1, tropes:{key:{r,w}}, families:{}, pbStreak}`).
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

## Trope staff (beta) — `torah_trainer.html`

A fourth Layout (`settings.layout === 'staff'`, the radio beside Page view on the Text tab's Layout row, with the
suite's `.beta-tag`): the
reading drawn on a music staff, a verse at a time, the words under their notes. Engine: `js/trope-staff.js`
(above); data: `data/trope/trope_phrases.json`, fetched lazily on the first staff render with the **same `?v=`
the tutor uses** (`STAFF_PHRASES_URL`; bump both together) through `ivritSafeParse` + `_phraseSetsFrom`.
Design: `docs/tropepatterns.md` → G.

- **From text to notes.** `tropeUnitsOfVerse(v.hebrew)` reads the verse's marks on the Trainer's own split
  (`/(\s+|־)/`: one *piece* per Hebrew-bearing token, the way `tokenizeHebrew` emits `.tt-word`s): a maqaf
  joins the next piece to the cell (one sung word), a repeated mark counts once, pashta written twice (its
  second glyph is kadma's) is one pashta, the last cell takes `sof_pasuk`, a `׀` token after a munach makes
  it `munach_legarmeh` (**a paseq prints the same and cannot be told apart in the API text — accepted for
  the beta**), and an unmarked cell sings with the cell after it. `tropeContextsOf(set)` indexes every
  printed figure by the marks before and after it; `tropeChooseFigures` picks one per unit — a connecting
  mark by the mark it leads into, else the pause its chain reaches; a pausing mark by its neighbours; then
  the Learn card's row (`TROPE_LEARN_ROW`, § A's table, § H's for the Haftarah rows); then the mark's first
  figure; a mark the High Holiday chart lacks falls back to the year-round chart (the Haftarah rows print
  every mark and stand alone) — and the last verse of a PocketTorah aliyah (`staffIsAliyahEnd`, from
  `aliyahLookup`'s `endC/endV`), or of a haftarah (`staffIsHaftarahEnd`: the `C:V` after the last ` - ` of
  the reading's ref, so a two-part haftarah closes at its second part's end), takes the `[aliyah-end]`
  closing whose marks end it. `tropeBuildReadingRow` stitches the picks into one row in the phrase file's shape (each figure's own
  syllables, which carry the beaming; a triplet or slur only when it lies inside one figure) plus `words`,
  one per cell; `tropeSplitSystems` wraps it between words to `#ttReading`'s width (with `opts.namesOf`, at the
  width each system is drawn at with its note names).
- **The melody** is `staffMelody()` = `readingTutorMelody() || 'torah'`: the four High Holiday readings draw
  the High Holiday chart, a haftarah (`currentReadingCtx.isHaftarah` — the haftarah scope is the only Nevi'im
  text the page shows: practice links and the Custom range picker accept the five Torah books only) the
  Haftarah rows, everything else the year-round chart; the key is `shiftedKey(set.key, staffShift)` — the Haftarah rows are
  D minor written in F, so the drawer's readout names the relative minor (`staffKeyText`, through
  `trope.key.name_minor`); Low voices draws the 8 under every clef. **The Haftarah rows stand alone:**
  `staffSetName()` never falls back to the Torah chart for them (no Haftarah rows in the file → the words alone
  and the `no_haftarah` chip), `fallbackCtx` is null, and the haftarah's last verse takes their `[aliyah-end]`
  closing through `staffIsHaftarahEnd`, never `staffIsAliyahEnd`'s Torah aliyah ends. While the rows carry the
  `unverified` tag (`docs/tropepatterns.md` → H: a rendering from memory, not a transcription of the chart)
  the header shows the `haftarah_beta` chip; dropping the tag retires it with no page change.
- **The markup contract.** `renderStaffView` mirrors `renderInterlinear`'s verse shell — `.tt-verse[data-vk]`,
  the bulk checkbox, `.tt-verse-num`, Read / Chant / **Tune** / Loop / Copy — then `.tt-staff-rows` holding
  one `.tt-staff-sys` per system (`data-svk` = its verse, `data-sys` = its index — **never `data-vk`**, which
  every verse consumer walks: the custom-reading word map in `updateKaraokeWordRefs`, click-to-seek's
  `hebWordIndexInVerse`, the verse observer, bulk select — so a system carrying it was read as a verse, and
  the map lit a later system's words together with the verse's first ones): an SVG (or its `aspect-ratio`
  placeholder, either `--tt-sys-w` wide — the SVG's share of the system's box) over `.tt-staff-words.tt-heb`,
  a row of absolutely placed `.tt-staff-cell`s (`left` in percent of the box, `dir="rtl"` inside) each holding
  its word's piece span(s) — **the very `.tt-word[data-twi]` spans `tokenizeHebrew` emits**,
  collected through its optional `sink` argument, one per piece in reading order, inside `.tt-heb`, inside
  `[data-vk]`. So `updateKaraokeWordRefs`, click-to-seek, `hebWordIndexInVerse`, the rover, the verse
  observer, bulk select and the copy path work unchanged; **never special-case the staff in a `.tt-word`
  consumer.** Every verse's staff is dropped for its interlinear Hebrew row — never a misaligned staff —
  when the data is not there yet (a header chip; the render re-runs on arrival) or failed (chip + Try
  again), for a haftarah only while the loaded file has no Haftarah rows (chip), for a double-cantillation verse
  (`STAFF_DOUBLE_CANT`: Genesis 35:22, the two Decalogues), and when the marks' piece count disagrees with
  the page's.
- **Widths** are measured (canvas `measureText`) in the computed font of two hidden probe spans outside
  `#ttReading` (Hebrew at `--tt-heb-size`, Latin at `--tt-translit-size`), memoized by font + text, so the
  layout spreads figures apart for a long word. The systems are wrapped to `#ttReading`'s width, so
  `staffRelayoutSoon()` re-renders (debounced, this layout only, only when the width really changed, never
  under a playing tune or chant — it waits for the stop or pause) from a `ResizeObserver`, `fonts.ready`,
  the fonts' `loadingdone` (a My Font arrives late), `setHebFont` and `setFontSize`.
- **A system's box and its scaling.** Each `.tt-staff-sys` is a size container (`container-type:inline-size`)
  whose box is the system's natural width on screen; `.tt-staff-words` restates `--tt-heb-size` and
  `--tt-translit-size` in `cqw` of that box (`staffFontPx` — at full width they equal the page's sizes, so the
  screen is unchanged), and the SVG and the cells' `left` are shares of it. A box drawn narrower than its
  container — `max-inline-size:100%` — therefore shrinks its SVG, its cells and their words by the one factor,
  never colliding the words (the Playwright recipe's print emulation cannot show the difference: the resize
  observer re-wraps a live page; `page.pdf()` fires the print events). Without `cqw` support (`STAFF_CQ`) the
  vars are not written and the words keep their size.
- **Paper.** `beforeprint` (`staffPrintEnter`, before `staffEnsureAllSvg`) re-renders once with `_staffPrintWrap`
  on: the systems are wrapped to `STAFF_PRINT_W` (a landscape Letter sheet's reading width at Chrome's default
  margins; A4 landscape is wider) and every system's box is that wrap (a one-word system wider than it keeps its
  own), so a landscape sheet prints them at full size and a portrait one scales the whole page by one factor
  instead of squeezing only the wide systems. The flag lives only around that render; `staffAfterRender` notes
  in `_staffPaperShown` whether the screen holds the paper wrap, `afterprint` (`staffPrintExit`) renders the
  screen wrap back while it does — except under a handout, whose own exit render (its listener runs after) is
  the screen's — and any other render (a resize, a handout exit that beat `afterprint`) is the screen's too, so
  a browser that never fires `afterprint` heals on its next relayout. The handout's geniza marker rides inside
  the reading, so every render on that path is bracketed by `genizaMarkOut` / `genizaMarkIn`. The handout's
  Large / Extra large sizes reach the text layouts only: the staff's words are measured and sized at the
  screen size.
- **Words.** The Translit switch (the Text tab's *Show transliteration*) drives the Latin line here too: with it on, the cells are `tokenizeHebrew`'s
  under-word cells (`.tt-wh` + `.tt-wtl`) whatever the placement radios say (a separate transliteration row
  would duplicate the `.tt-word[data-twi]` spans; the Transliteration section's note on the Text tab says so in this layout), so
  `body.translit-under` is on and `karaokeFollowEffective()` is `'hebrew'`. `staffWords` is the sub-choice under
  the switch — `'both'` (the Hebrew with its Latin line) or `'translit'` (the Latin line alone;
  `body.staff-words-translit` hides `.tt-wh`); a stored `'hebrew'` (the retired third choice) reads `'both'` and
  stays stored. A dead library falls back to the Hebrew with the existing chip, and the handout, which turns the
  switch off, prints the Hebrew alone. The Translation switch (the Text tab's *Show translation*) adds the verse's translation under its systems
  (`.tt-verse-row > .tt-translation`, no row label, left-aligned to the notation, sized by `--tt-english-size`).
- **Lazy SVG.** Layouts are computed for every verse at render (they place the words); each system's SVG is
  drawn by `staffEnsureSvg` when an `IntersectionObserver` sees it near the viewport, when the tune or the
  chant highlight reaches it, and all at once in `beforeprint`. A 146-verse reading lays out in ~130 ms.
- **Tune** (`staffTune(vk)`, the header's *Play tune* = `staffTuneAll`): the verse's notes as oscillator
  tones by the tutor's rules (an eighth is 0.32 s ÷ `staffTuneRate` — the drawer's Tune speed slider, mirrored by
  the audio bar's Tune row in this layout under `body.layout-staff`, one writer `setStaffTuneRate`, read at the
  tune's next play; ties one note; rests silent; a grace
  note quick and borrowed; nothing under `STAFF_MIN_NOTE`; B4 = 493.88 Hz moved by the key, an octave down
  in the 5-harmonic wave with Low voices), on its own lazily created `AudioContext`. Each note lights
  `.tu-pn.is-sounding` (the system `svg.is-playing`) and its word's spans take `.active` — the teacher's
  karaoke style. `stopStaffTune()` is the one exit and is called wherever another sound starts (`speakVerse`,
  `chantVerse`, `startLoop`, both seeks, `chantHolidayWord`, Read all, Chant all, `toggleAudioPlay`, the
  element's `onplay`), by `renderText`, the handout and `beforeprint`; `staffStopOthers()` is the reverse.
  The verse's Tune is a toggle: `aria-pressed` says it is playing and its name stays "Play the tune of verse
  …" (the icon turns to stop). *Play tune* is not one: like *Chant all* it carries no `aria-pressed`, and its
  label says what a press does (*Play tune* / *Stop tune*).
- **Chant** is untouched: `paintKaraokeIdx` additionally calls `staffPaintPiece(twi, on)`, which lights
  `.is-hl` on every `.tu-pn` / `.tu-pbar` of the unit(s) of the sung piece's cell (`_staffUnitsByTwi`,
  rebuilt by `staffAfterRender`) — the whole figure, by section; `clearKaraokeHighlight` clears it. In a
  custom or holiday reading (the word map keyed by verse) the sung word lights alone, because only the
  `.tt-verse` is a `[data-vk]`.
- **Colour.** The bar over each figure takes the piece's Trainer family (positional etnachta / sof pasuk
  halves, from `tokenizeHebrew`'s sink) and is coloured only under `body.trope-on`; the words are coloured,
  underlined and hovered by the reading's own rules. The SVG's class names are the engine's (`tu-pstaff`,
  `tu-pn`, `tu-pbar`), rescoped under `.tt-staff-sys`.
- **Settings** (`DEFAULTS`, clamped in `loadSettings`, read through `staffWordsKey` / `staffShiftVal` /
  `staffVoiceKey` / `staffNoteNamesKey` / `staffRateVal`; one writer each: `setStaffShift`, `setStaffVoice`,
  `setStaffNoteNames`, the Words radios, `setStaffTuneRate` (the drawer's slider, the audio bar's Tune row and
  the reset); `syncStaffControls` the read-only half, also from `applyI18n`): the drawer's *Trope staff* section on the Audio tab — Words, Key (−6…+6; the readout names the key with the
  tutor's `trope.key.*` strings), Voice, Note names, Tune speed. Words, key, voice and note names ride the
  practice link (`LINK_DISPLAY`); the speed syncs in the blob like `karaokeRate` and never travels. The systems are pinned `direction:ltr` in both UIs (notation), and the
  rover's arrows follow the notation there (`onReadingKeydown` flips `delta`) — unless the Direction below is Right to left.
- **Direction** (`staffDir`: `'ltr'` or `'rtl'`, read through `staffDirKey()`; an unknown stored value reads left to right
  and stays stored; one writer `setStaffDir`; the Direction radios in the section; it rides the practice link). Right to
  left is the mirror image, the Hebrew's reading order, as some Hebrew music is printed: `renderStaffView` marks each
  system `.is-rtl`, `staffEnsureSvg` passes `rtl: true` to `renderPhraseStaff`, and the engine draws the row as usual
  inside a `<g class="tu-rtl" transform="matrix(-1 0 0 1 W 0)">` that reflects it about the row's middle, then turns
  every `<text>` (the clef, the 8, the signature and accidentals, the triplet 3, the names, the syllables — collected
  through `_textSink` while it draws) and every rest back upright about its own x, a start-anchored glyph anchoring at
  its end so it keeps its side of the note. The page places each word cell at the mirrored share of the box
  (`natW/boxW − share`), a mirrored system hugs the right edge (`.tt-staff-sys.is-rtl { margin-inline-start:auto }`),
  and the rover's arrows follow the Hebrew. Without the option the engine's tree is byte-identical (the tutor never
  passes it; its Learn and Phrases staffs snapshot the same across melody × key × voice × names, and
  `smoke-trope-staff.mjs` has the rtl case). Tune, chant highlight, click-to-seek and print are untouched: they are
  class- and `data-twi`-based, and the paper render is the same render.
- **The melodies' names.** The maintainer identifies the transcribed charts as the Avery/Binder (Reform) melody (the
  year-round and High Holiday charts; the Haftarah rows stay a beta rendering) and PocketTorah's recordings as the
  Spiro (Conservative) melody. Both pages say so where the staffs and the recordings are: the Trainer's Trope staff
  section (`torah.staff.melody_credit`) and Audio speeds & pitch section (`torah.audio.recording_credit`), both on
  the drawer's Audio tab, audio-bar credit
  (`torah.audio.recording_melody`) and High Holiday recording chip; the tutor's Learn intro, key-bar caption
  (`#tuKeyCredit`, `trope.key.melody_credit`, hidden by `syncTuneControls` on the Haftarah melody), Melody and
  tradition notes, example play buttons, FAQ and footer credit. The repo holds no other source for either name.
- **Note names** (`staffNoteNames`: `'off'`, `'letters'`, `'solfa'`; an unknown stored value shows none and stays
  stored). The tutor's option for the reading: `renderStaffView` builds `namesOf`, a callback giving a row's names
  index-aligned with its notes (a rest has none) from `staffNoteNameAt` — the tutor's `noteNameAt` kept page-local,
  because the engine reads no `I18n` and the tutor's copy shares the global scope — and hands it to
  `tropeSplitSystems` (so a system is wrapped at the width it is drawn at once names widen it) and to each
  system's `layoutPhraseStaff`; `renderPhraseStaff` then draws the `<text class="tu-nn">` from the layout and the
  system's height follows `L.lyricY`. Do re mi waits for the dictionary (`staffNoteNamesMode`: `'solfa'` reads
  `'off'` until `trope.notes.solfa_1` is there; `applyI18n`'s re-render brings it, and a language switch moves it —
  except while Chant, a loop or a clip plays, when `applyI18n` skips the re-render and the names, like the rest of
  the reading, follow at the next `renderText`).
  The names are `--muted`, gold while their note sounds (the tune's `.is-sounding`) or is chanted (`.is-hl`), and
  print muted; the SVG stays hidden from assistive tech, so no spoken list is built.
- **Known beta limits** (said in the section's note): a word sits whole under its figure (no syllable
  placement); a context the chart never prints takes the nearest figure; a triplet or slur cut at a
  figure's edge draws by value; a sheet narrower than the print wrap (portrait, wide margins) prints the
  staff smaller than the chosen size, uniformly.

---

## Settings drawer (`torah_trainer.html`)

`#settingsModal` is still the overlay it was — `#settingsBackdrop`, the `_settingsTrapKey` focus trap (Tab wraps
inside; an unchecked radio is neither end of the loop), Escape from the page's global keydown handler, focus
back to the opener on close, the shared `sidebar-resize` handle `#settingsResize` and the drawer's own dark
toggle — but nothing inside it collapses any more: the collapsible `.panel`s behind Expand all / Collapse all
became **seven tabs of flat sections**, the Trope Tutor's Settings-tab idiom inside a drawer, with Favorites
(saved readings) first.

- **The tab strip.** `.tt-tabs` is a `role="tablist"` (`torah.tabs.aria`) of seven `role="tab"` buttons —
  `TT_TAB_IDS`: `favorites` / `text` / `colors` / `audio` / `calendar` / `share` / `more` → `#ttTabFavorites` …
  `#ttTabMore` — each an inline SVG from the shared header-icons set (star, book, palette, music, calendar,
  link, gear; the star, `hi-star`, is a snippet of the set that so far lives only here — markup, the
  header-icons CSS block is untouched) over its label on a `.hi-lbl` span keyed `torah.tabs.<name>` (the
  `data-i18n` stays on the span, never the button: `applyStaticI18n` would replace the SVG); the page's own
  `.settings-modal .tt-tab` rule stacks icon above label (0.7rem), `.hi-btn` still supplying the alignment.
  Seven labels share the strip, so `.tt-tabs` is a container (`container-type:inline-size`) and two
  `@container` steps placed *after* the base `.tt-tab` rule (same specificity — source order decides) shrink
  the label to 0.6rem when the strip is 345px or narrower and 0.58rem at 318px or narrower: the drawer is
  resized by hand, so a viewport query would be the wrong lever, and a browser without container queries
  keeps the ellipsis. Each tab `aria-controls` one `.tt-tabpanel`
  (`#ttTabPanel<Name>`, `role="tabpanel"`, `aria-labelledby` its tab, `hidden` unless selected).
- **A section** is a flat `.tt-set` carrying `data-set="<key>"` under a `h3.tt-set-title` — serif over a
  hairline rule, the tutor's `.tu-set-title` idiom, `tabindex="-1"` so it takes programmatic focus without
  joining the Tab loop — keyed by the old `torah.settings.panel_*` keys (the handout's heading is
  `torah.handout.title`, `#ttHandoutTitle`); a sub-block inside one is a `.tt-set-sub` (Display's *Font
  sizes*). The twenty-one sections by tab (`TT_SECTION_TAB`):
  - **Favorites** — `favorites` (Favorite readings; *Favorites* below).
  - **Text** — `display` (Display: the Layout row first — the four `ttLayout` radios, Side by side / Interlinear /
    Page view / Trope staff, a `.form-row.tt-color-row` holding a `.radio-group.tt-color-list`, the Colors tab's
    wrap-whole idiom, so a group that does not fit beside its label drops whole to the next line — then the
    show-toggles, the click action, the Font sizes sub-block), `translation` (Translation, right under the
    Layout section: the *Show translation* switch `#ttShowTranslation` and, only while it is on, the version list
    `#ttVersionWrap` / `#ttVersionSelect`, stacked under its label because version titles run long;
    `syncFormToSettings` and the switch write its `display`), `translit` (Transliteration: the *Show
    transliteration* switch `#ttShowTranslit` first, then the placement and scheme controls), and `font` (Hebrew
    font, last: the picker is the tallest section, so the switches a teacher flips most stay above the fold).
  - **Colors** — `vowel_color`, `trope_color` (the two lists of *Trope color coding* above).
  - **Audio** — `audio` (Audio speeds & pitch), `karaoke` (Karaoke highlighting: the Style and Follow groups
    that used to sit under Display's *Karaoke settings* sub-heading; the `h3` keeps `id="lblKaraokeHdr"`, so
    both groups' `aria-labelledby` still name it), `staff` (Trope staff, the BETA badge in the heading beside
    the `data-i18n` span — `openSettingsAtPanel('staff')` lands by `data-set`, so the split heading costs
    nothing).
  - **Calendar** — `schedule` (Reading schedule), `lookup` (Torah portion lookup), `holiday` (Holiday Torah
    readings: `#ttHolidayPicker`, a `.tt-holiday-list` of the seventeen `HOLIDAY_READINGS` buttons that
    `buildHolidayPicker()` builds once — `syncFormToSettings` calls it on every drawer open and it returns when
    the list is already built — and `syncHolidayPickerState()` marks the loaded one (`.active` + `aria-pressed`); a press goes
    through `applyHolidayReading`, the same apply path as the parsha picker's holiday `<optgroup>`). The Custom
    range is not here: it sits in the toolbar (below).
  - **Share** — `print` (Print), `share` (Practice link), `copy` (Copy verses), `handout` (Student handout);
    *The Share tab* below.
  - **More** — `cloud` (Cloud saves, `#cloudSavesPanel`), `about` (About & FAQ), `reset` (Reset).
- **One writer, two openers.** `setSettingsTab(name)` is the only writer of tab state — `aria-selected`,
  the roving `tabindex` (the selected tab alone is in the Tab sequence), `hidden` on every tab panel, and
  `.settings-body` scrolled to the top; an unknown name reads `favorites`. `openSettings()` calls it with
  `'favorites'` before `syncFormToSettings()`: **the drawer always opens on Favorites** — no tab memory, no
  new key.
  `openSettingsAtPanel(key)` keeps its name: it opens the drawer, maps the section key through
  `TT_SECTION_TAB`, scrolls the section to the top of the body and focuses its heading, so the next Tab
  enters the section's controls. Its callers: the Copy bar's *Copy options…* (`'copy'`), the cloud module's
  `open` (`'cloud'`, the header chip's *Cloud saves…* item) and `scripts/smoke-tools.mjs` (`'cloud'`); nothing
  opens it at `'share'` any more — the Share tab is reached through the toolbar's Settings button (`#gearBtn` →
  `openSettings()`) like every other tab.
- **Keyboard.** The tablist's keydown handler is the Trope Tutor's: Left/Right move by **visual** direction
  (the strip mirrors in the Hebrew UI, so under `dir="rtl"` the keys swap), Home/End, wrapping, and moving
  focus activates the tab (automatic activation). Tab inside the drawer is the trap's.
- **The Share tab**, in order: *Print* first — Print this reading → `printReading()`. *Practice link*: `#ttShareWrap` holds Copy link (`#ttShareBtn` → `copyPracticeLink`)
  and the Include my settings switch (`#ttShareSettings` → `settings.shareIncludeDisplay`); `syncShareBtn`,
  re-run per render, hides the wrap and shows the `#ttShareNone` note exactly when `practiceLinkURL()` is
  null. *Copy verses*: a *Select verses to copy…* launcher (`openCopyBarFromDrawer()`: in projector mode —
  `body.fullscreen`, which hides the toolbar and the bars under it — it refuses with the
  `torah.copy.fullscreen_note` toast and stays in the drawer, since it would otherwise open a bar nobody can
  see and arm verse selection on the projected reading; otherwise it closes the drawer — verse selection
  needs the reading clickable and the drawer is modal — opens the inline `#ttCopyBar` through
  `toggleCopyBar` if it is closed, scrolls it into view and focuses `#ttCopyBulkCb`) followed by the
  copy-format options, which `syncFormToSettings` syncs (`syncCopyForm` owns only the bar's own state); the
  three pill rows (Nikkud, Cantillation, Layout) carry the color lists' `.tt-color-row` / `.tt-color-list`
  classes, so a group that does not fit beside its label drops whole. *Student handout*: every control of
  the former `#ttHandoutBar`, same ids, plus Print handout (`printHandout`); `syncFormToSettings` calls
  `syncHandoutForm()`, so the section is synced on every open, reset and cloud re-read, and `cloudReread`
  no longer calls it itself.
- **Favorites** (the `FAVORITES — saved readings` block in the script). A favorite is a reading a teacher
  comes back to — a parsha, an aliyah, a haftarah, a holiday reading or a verse range — saved under a name,
  with a color, optionally with the look it was saved in. The tab holds the *Save current selection as
  favorite* button (`#ttFavAddBtn`, the `hi-plus` glyph) and the list `#ttFavList`.
  - **Store.** `hebrewTorahTrainer_favorites` (`FAV_KEY`) is a flat map `{ [name]: { v:1, ref, color, ts,
    settings? } }` — the name is the identity, as in every preset store of the suite — and
    `hebrewTorahTrainer_favoritesFolders` (`FAV_TREE_KEY`) is its folder tree, owned by the shared folder-tree
    block, which this page now carries (JS + CSS, byte-identical with the other carriers). `color` is one of
    `FAV_PALETTE` (the dashboard's Okabe–Ito preset palette, eight colors; `favColorOf` falls back to grey on
    anything that is not a six-digit hex). `ref` is one of the three forms a practice link carries, never
    `readingCycle` or `triennialYear` (those are how this device reads, not what it reads):
    `{kind:'parsha', parshahKey, scope}` (scope `parsha-full`, `parsha-aliyah-1…7` or `parsha-haftarah`),
    `{kind:'holiday', holidayKey}` (one of `HOLIDAY_READINGS`, whole) or `{kind:'ref', customRef, holidayKey?}`
    (a verse range; the holiday key only while the range sits inside that reading). `favoriteRefNow()` derives
    it from `settings` (the loaded reading, never the Copy bar's selection) and returns null when nothing is
    loaded — the Save button then only toasts `torah.fav.none_loaded`. `settings` (optional) is the
    `LINK_DISPLAY` vocabulary — exactly what *Include my settings* puts in a link — captured by
    `favoriteSettingsNow()` only when the popup's checkbox is ticked: a look whose coloring switch is off is
    dropped (`LINK_LOOK_SWITCH`), and a My Font is refused by `LINK_DISPLAY.hebFont`, which the popup's
    summary line names (`linkFontLeftOut`, `torah.fav.font_left_out`).
  - **The save popup** `#ttFavDialog` (+ `#ttFavBackdrop`) is a sibling of `#settingsModal` in `<body>`, on
    purpose: z 110/120 over the drawer's 100 (below the tour and the toast), with its own Tab trap
    (`_favDialogKey`) so the drawer's trap never sees its keys, and Escape stopped there so the drawer's
    document-level handler does not also close the drawer. Its fields: the reading's label
    (`currentRangeLabel`, else `resolveRef().label`, else the stored form's label), Name (prefilled with that
    label; Enter anywhere but a button or select saves), Folder (a `<select>` of `ftPaths` — the block's own
    "(top level)" / path labels — and a chosen folder files the new item straight into it through
    `ftFolderArray`, because `syncTree` would otherwise append the new name at the root), eight swatches
    (`buildFavSwatches`; the default is the first palette color no favorite uses yet, then round-robin —
    `favNextFreeColor`, the dashboard's `assignPresetColors` idea), the *Also save my display settings*
    checkbox with its summary line (`#ttFavSummary`, layout / translit / translation / font, plus the
    left-out font), and the inline note `#ttFavNote` (`aria-live`, `aria-disabled` on Save) for an empty or
    duplicate name — never an `alert`. The opener gets focus back on close (else `#ttFavAddBtn`).
  - **The list.** `renderFavorites()` mounts the shared component — `mountFolderTree({ treeKey: FAV_TREE_KEY,
    container: '#ttFavList', noun: 'favorite', listItemNames, buildItemRow })` — so folders, drag-drop, the
    Move ▾ menu and folder CRUD are the block's. Each row's fragment: the color dot (`.tt-fav-dot`, a button
    with a 24px hit box — a press cycles the palette, `recolorFavorite`), Open (`openFavorite`), Rename
    (the pencil, `renameFavorite`: a `prompt`, the map re-keyed in place so the list keeps its order,
    `_ftRenameNode` keeping the item in its folder), Duplicate (⧉, `ftDuplicateName` + `ftInsertAfter`) and
    Delete (`hi-close`, after a `confirm`). The dot comes after the name in DOM order (the block owns the
    row) and is placed between the drag handle and the name by CSS `order`, so the block stays
    byte-identical; `'favorite'` is not one of the block's nouns, so its generic empty placeholder is hidden
    by CSS and the page's own `#ttFavEmpty` note speaks instead. `renderFavorites` runs from `applyI18n`
    (the first paint on `I18n.ready`, then every language switch — the buttons are `I18n.t`'d) and from the
    cloud module's `onLocalChanged` for the two favorites kinds; it re-reads its own keys, so a download or
    an import needs nothing else.
  - **Opening one** (`openFavorite(name)`) re-validates the stored `ref` with the deep-link reader's own
    gates — `parshiyotData` by `en`, the scope regex `/^parsha-(full|aliyah-[1-7]|haftarah)$/`, `holidayByKey`,
    `parseSharedRef`, `refWithin` — and toasts `torah.fav.stale` when the reading no longer resolves. Then,
    when the favorite carries `settings`, the snapshot lands **first** as a real saved change, never a link
    view: `linkViewEnd()`, each field through its `LINK_DISPLAY` check into `settings` (a deep copy — the
    color pickers edit the maps in place), then `syncFormToSettings`, `setHebFont`, both color-picker inits,
    `applyTropeColors`, `applyDisplayClasses` (the `cloudReread` repaint tail). After that the reading writes
    the same fields the `?parsha=` / `?holiday=` / `?ref=` branches write (a range seeds `parshahKey` only
    when the device has none, through `parshaContainingRef`), then `saveSettings(); syncParshaSelect();
    fetchAndRender(); closeSettings()` and a `torah.fav.opened` toast. `clearLoop()` runs before either.
  - **Delete and reset.** Deleting a favorite deliberately does **not** call `IvritSaves.forgetRow`: with its
    sync memory kept, the next listing shows *Deleted on this device → Delete from your account / Bring it
    back*; forgetting would make the listing silently download the row again. `resetAllSettings` leaves both
    favorites keys alone (they are not settings).
  - **Where they travel.** Two `IVRIT_SYNC_REGISTRY` rows — `favorite` (map / item, `ivritKey`
    `torahTrainerFavorites`, label `shared.cloud.kind_favorite`) and `favoriteFolders` (tree / page, follows
    `favorite`, `torahTrainerFavoriteFolders`) — with `merges: { favoriteFolders: ftMergeTrees }` passed to
    this page's `IvritSaves.attach` (*Cloud saves* below); no migration was needed (`TorahTrainer` is already
    in `saves.tool`'s CHECK and `kind` is free text). The AllTools file on `index.html` carries both keys
    (`ivritSafeAssign` merge for the map, `ftImportTree(key, incoming, false)` for the tree), its inventory
    counts `favorites`, and its cloud `merges` map names `TorahTrainer: { favoriteFolders: ftMergeTrees }`; the
    Torah Trainer still has no `IVRIT_CFG` of its own, so favorites travel only through AllTools and the
    account. `privacy.legal.*` names "favorite Torah readings" in both its local and account segments.
- **The toolbar and the Copy bar.** `.tt-controls` above the reading holds what a teacher changes in front
  of a class and nothing else: the Parsha row — the ‹ › week-step buttons (`#ttWeekPrev` / `#ttWeekNext` →
  `stepParsha`) around `#parshaSelect`, *Jump to this week's parsha* as an icon-only button (`#ttJumpWeekTop`
  → `goToCurrentParshah`; the calendar glyph, its name on `title` + `aria-label` from the same key; the
  full-text button stays on the Calendar tab) and the Reading scope `#scopeSelect` — plus the two **reveal
  switches**, *Translit* and *Translation* (`#ttShowTranslitBar` / `#ttShowTranslationBar`, the stacked
  `.tt-stack-toggles` pair). Those are mirrors of the Text tab's *Show transliteration* / *Show translation*
  rows — one setting shown twice, the way the audio bar's sliders mirror the Audio tab's: `setShowTranslit` /
  `setShowTranslation` are the only writers, and `syncShowSwitches()` (from `syncFormToSettings`) keeps both
  pairs in step. **The Custom range** is a toolbar button `#ttCustomBtn` (`aria-expanded`, `aria-controls`) that
  unfolds one compact group `#ttCustomWrap` (`.tt-ctrl.tt-custom`, `hidden` until pressed: Book `#ttCustomBook`,
  Chapter `#ttCustomChapter`, Verses `#ttCustomVStart`–`#ttCustomVEnd` and Go → `applyCustomRange()`);
  `toggleCustomRange(force?)` is the one writer of the group's hidden state and focuses the Book select on open;
  `prefillCustomPicker()` runs from `syncParshaSelect`, so Book and Chapter follow the reading on screen after every
  change (the chapter and verse boxes carry aria-labels, their visible text is a placeholder).
  Everything else the toolbar once held lives in the drawer — the Layout radios and the
  Version list on the Text tab; the Holiday Torah readings on the Calendar tab; Print,
  Student handout, Copy and Copy link + Include my settings on the Share tab — and the toolbar's Settings button
  (`#gearBtn`: the gear with its label, primary-styled at the inline end of the Parsha row — the header carries no
  gear any more, so the one door to everything else is in the row a teacher already looks at) is the drawer's one entry. Gone with them: the toolbar's own Share button `#ttShareOpenBtn`,
  `#ttHandoutBar` / `toggleHandoutBar()`, the inline holiday strip's `#ttHolidayBtn` / `toggleHolidayPicker()`
  and the `#ttCustomPicker` bar with `toggleCustomPicker()` (the fullscreen and print hide-lists no longer
  name it). The tour's third step therefore points at `#ttJumpWeekTop`, its text naming the two switches
  beside it and sending the reader to the Text tab for layout and the rest, as the About tab's how-to step 2
  and the JSON-LD how-to do.
  `#ttCopyBar` stays on the page (it is the selection UI), with *Copy options…* → `openSettingsAtPanel('copy')`
  and its own Close button (`closeCopyBar()`: closes through `toggleCopyBar`, which still owns
  `copyBulkRemember` and the bulk mode, then hands focus to the toolbar's Settings button `#gearBtn` — the way back to the
  Share tab — rather than dropping it on `<body>`).
- **Retired.** The panel-collapse memory block, `PANEL_MEM_CFG`, `expandAllMenus` / `collapseAllMenus`,
  `syncPanelTitleAria` and `panelKeyOf` are gone, and `panelsCollapsed` left `DEFAULTS`: an older blob's map
  rides along unread through `ivritSafeAssign`, as on the Trope Tutor, and the cloud row's `'*Collapsed'`
  omit in `js/ivrit-saves.js` is unchanged (it still covers `karaokeBarCollapsed`, the audio bar's own
  state).

---

## Reading schedule, reading cycle & portion lookup (`torah_trainer.html`)

The drawer's *Reading schedule* section (Calendar tab) holds the calendar (`settings.schedule`, `'diaspora'` | `'israel'`), the
reading cycle (`settings.readingCycle`, `'full'` | `'triennial'` | `'weekday'`, read through `cycleKey()`: an unknown
stored value reads Full and stays stored) and the triennial year (`settings.triennialYear`, `'auto'` | 1 | 2 | 3,
`triYearKey()`). All three ride the settings blob (sync, AllTools, reset) and none rides a practice link.

- **The calendar is local.** `js/hebrew-calendar.js` (`window.HebCal`; loaded before `js/trope-staff.js`, in
  `CORE_ASSETS`) carries the dashboard's Reingold-Dershowitz converter and the weekly reading table of a year,
  `sedraForYear(hyear, israel)`: not Hebcal's year-type tables (GPL) but a **count-based fit** — every Shabbat from
  Shabbat Bereshit (the first after 22 Tishrei) to the Shabbat before the next Bereshit, the festival Shabbatot
  dropped (Tishrei 1–2, 10, 15–22, 23 in the Diaspora; Nisan 15–21, 22 in the Diaspora; Sivan 6, 7 in the
  Diaspora), cut by the traditional anchors into segments each fitted on its own: Tishrei after Rosh Hashanah
  (two open Shabbatot → Vayeilech and Ha'azinu, one → Ha'azinu with Nitzavim-Vayeilech doubled), Tisha B'Av →
  Rosh Hashanah (always seven: Va'etchanan … Nitzavim), Bereshit → Pesach (to Tzav, Metzora in a leap year, one
  further to Achrei Mot when the Shabbatot outnumber the parshiyot; short → Vayakhel-Pekudei, then
  Tazria-Metzora), Pesach → Shavuot (to Bamidbar, to Nasso with a spare Shabbat — Israel when Pesach's eighth
  day is one; short → Tazria-Metzora, Achrei Mot-Kedoshim, then Behar-Bechukotai) and Shavuot → Tisha B'Av (to
  Devarim; short → Matot-Masei, then Chukat-Balak). Israel and the Diaspora differ only in their festival
  Shabbatot, so both schedules fall out of the one fit. `parshaForDate(date, {israel})` gives the Shabbat on or
  after a date with its Hebrew date and reading (`kind:'parsha'`, `idx` of one or two parshiyot, or
  `kind:'holiday'` with a key and day); its `hyear` is the *reading year* (a Tishrei Shabbat before Bereshit
  belongs to the year before its date's — the year whose cycle it closes, as the triennial counts).
  **Proof:** `node scripts/smoke-hebrew-calendar.mjs` (converter round-trips over two centuries, known Shabbatot
  on both schedules, every year 5660–5900 placed once each in order) and, with `--hebcal`, every Shabbat of
  5700–5900 on both schedules against `@hebcal/core`'s `getSedra` (installed outside the repo, `HEBCAL_DIR`; the
  oracle is GPL and nothing of it is copied) — 20,976 agree. A change to the rules is not done until both pass.
- **This week** (`goToCurrentParshah`, and the first visit in `init`) reads the local calendar first: a parasha
  opens (a doubled week its first, as the Sefaria path always did), a festival Shabbat whose reading is in
  `HOLIDAY_READINGS` as the table holds it opens it (`holidayKeyForCal`: in Israel Shemini Atzeret is also Simchat
  Torah, so it opens V'Zot HaBerachah), and a Shabbat the table does not hold still asks Sefaria's calendar for the
  day's reading (`fetchCurrentParshah`, the old path, kept as the fallback): Chol HaMoed, and the Diaspora's
  Pesach 8 and Shavuot 2, which on Shabbat read from Deuteronomy 14:22 (the table's entries start at 15:19). Every
  festival Shabbat it opens, 5760–5900 on both calendars (438 of 894), agrees with `@hebcal/leyning`'s Torah
  reading (the oracle, never shipped). An ordinary week therefore needs no network.
- **The cycles.** Full is PocketTorah's `aliyah.json`, as before. Triennial and Weekday read `data/leyning/*.json`
  — `weekday.json` (each parasha's Monday/Thursday reading, its first aliyah in three) and `triennial.json` (the
  three-year divisions: every parasha's `variations`, the seven combined entries' `years` and `patterns`) — built
  by `scripts/build-leyning-data.mjs` from `@hebcal/leyning` and `@hebcal/triennial` (BSD-2-Clause; the license
  sits beside them and the builder pins the versions), keyed by parasha number, fetched `?v=1` the first time a
  non-Full cycle is chosen (`loadLeyningData` / `ensureLeyningData`; the full aliyot stand in until they land,
  the section's note says loading or failed with Try again). `aliyahLookup(parshahEn, cycle)` returns the cycle's
  aliyot (`cycle` defaults to `cycleKey()`; **every audio caller asks for `'full'`** — PocketTorah's files are
  the full-kriyah aliyot whatever the cycle); `resolveRef` builds the Full-reading range from the cycle's first
  and last aliyah and marks the result `overlay: true` with `aliyahNum: null`. The triennial year:
  `triennialContext(p)` = the reading year the parasha next falls in (`HebCal.nextOccurrence`) → `triennialYear`
  (`((hyear − 5744) mod 3) + 1`) unless chosen by hand, and for a sometimes-doubled parasha the cycle's
  Together/Separate pattern (`HebCal.doubledPattern`) — a together year reads the combined entry's `Y.n`, a
  separate year the single's `<letter>.n` where the letter is the combined entry's `patterns[pattern]` (`'Y'`
  for never-doubled and `TTT`), `@hebcal/triennial`'s own rule; the section's note names the year and, in a
  together year, the partner. The Weekday cycle offers aliyot 1–3 and no haftarah: `clampScopeToCycle()` (run
  before every resolve) sends any other stored scope, a link's included, back to the whole reading, and
  `updateScopeSelectState` hides the options (`cycleAliyahMax()` also bounds the fullscreen stepper).
- **Audio for a cycle range is the holiday overlay.** `readingIsOverlay()` = custom scope or a resolved
  `overlay` reading, `overlayRef()` its range; `chantVerse`, click-to-seek, the Loop guard and the verse controls'
  `canLoop` read it, so a Triennial or Weekday verse chants through `chantHolidayWord` (the containing full
  aliyah's file under the reading, the words mapped by verse). *Chant all* on such a range (`chantOverlayNext`,
  `chantAllState.overlay`) plays the full aliyot the range spans under the reading in turn — the first from the
  range's first word — and on the last sets `_verseEndStopAt` at the first word after the range
  (`chantAllState.stopsAtRange`, which the timeupdate stop turns into `stopChantAll`); a holiday reading keeps
  its old navigate-away chain. `readingKey()` adds the cycle (and a triennial range) so `lastPos` never crosses
  cycles.
- **Torah portion lookup** is the Calendar tab's second section: a date field (today by default; never stored) → `lookupRender()`
  writes the Shabbat's civil date (`toLocaleDateString` in the UI's language) and Hebrew date (`torah.lookup.hebdate`
  with the 14 `torah.lookup.month_*` keys), the parasha (`torah.lookup.parsha`, a doubled week joined and noted)
  or the festival (`torah.lookup.holiday_*`, the day for Pesach, Sukkot, Shavuot and Rosh Hashanah) on the chosen
  calendar, and the triennial year while that cycle is on; **Open** (`lookupOpen`) loads the parasha through the
  picker's own writes, or the festival reading when `holidayKeyForCal` names one. The calendar radios, the
  cycle radios and `applyI18n` re-render it.

---

## Chant pitch (`torah_trainer.html`)

The chant transposes in whole semitones (`settings.karaokePitch`, −12…12, default 0) without changing its
tempo: the speed slider stays the element's `playbackRate` time-stretch, and the two compose.

- **The graph.** `<audio id="ttAudio" crossorigin="anonymous">` → `MediaElementAudioSourceNode` →
  `AudioWorkletNode('tt-pitch')` → destination, built lazily by `ensurePitchGraph()`. The processor is
  `js/tt-pitch-worklet.js` (same origin, so `script-src 'self'` covers it — no CSP change; the MP3 host
  sends `access-control-allow-origin: *`, which is what lets the graph read the samples): a time-domain
  WSOLA shifter with a constant latency (~61 ms at 48 kHz) whose 0-semitone output is the input exactly, so
  nothing jumps when the slider passes 0 and the word highlight needs no compensation.
- **When it exists.** Never before a non-zero pitch was chosen. `createMediaElementSource` is called once
  per element for the page's lifetime (the element is reused across aliyot; `teardownKaraokeAudio` only
  drops `src`), and only while the context is `running` — a captured element behind a suspended context is
  silent, so `ensurePitchGraph` leaves the element native until a gesture has started the context. The
  slider's `input` is that gesture; a stored pitch waits for the first tap or key (`_pitchKick`, capturing
  on `document`) or the next `play`. `_pitchGuard` pauses and toasts (`torah.audio.pitch_tap_play`) if a
  captured element is playing while the context is not running (an iOS interruption, an autoplay block).
- **Failing soft.** No `AudioWorklet`, a module that will not load, or a host that refused the CORS load
  (the element's `onerror` retries the same source once plainly; when the plain load succeeds the host, not
  the network, refused CORS — `_pitchState = 'cors'` and later loads stay plain) → `pitchUnavailable()`:
  both sliders `disabled`, a status line under the drawer slider, the chip drops the pitch. The stored
  value is kept — the blob syncs, and a browser that cannot shift must never overwrite the pitch the same
  teacher chose on one that can. The chant keeps playing natively, at its recorded pitch.
- **One writer.** `applyKaraokePitch(v)` (both sliders and the reset); `syncPitchControls()` is the
  read-only settings→controls half (sliders, readouts, `aria-valuetext`, the collapsed-bar chip through
  `syncMiniRate`, and the running node's `semitones` param), called from `syncFormToSettings` and
  `applyI18n`.
- **Storage.** `karaokePitch` lives in the settings blob like `karaokeRate` (it syncs and exports) and is
  never in `LINK_DISPLAY` — a link says how a reading looks, never how it sounds.

---

## Transliteration under each word (`torah_trainer.html`)

`settings.translitPlacement` is `'row'` (the verse-level row / column / block that `tokenizeTranslit`
builds) or `'word'`. With `'word'` and the transliteration on, `renderText` drops the separate row and
`tokenizeHebrew(text, ref, opts, underWord)` makes each word a two-item cell:
`<span class="tt-word" data-twi="N"><span class="tt-wh">Hebrew</span><span class="tt-wtl" lang="he-Latn" dir="ltr">latin</span></span>`.

- **The contract.** There is still exactly one `.tt-word` per Hebrew word, and `.tt-wtl` is never a
  `.tt-word` and never carries `data-twi` — every consumer that counts words (`updateKaraokeWordRefs`,
  `paintKaraokeIdx`, click-to-seek, `computeVerseAudioBounds`, `hebWordIndexInVerse`, the rover, the copy
  path) is unchanged. `body.translit-under` is written by `renderText` only, so it is on exactly when the
  cells exist: never with a dead library (the `_translitDead` chip still decides), never on the empty card.
- **Per word, from the raw token.** `translitForWord(raw, maqafAfter)` transliterates one word at a time
  (the verse-level output cannot tell a maqaf from a Simple-stressed syllable hyphen, so it is never split
  for this), from the RAW token so a hidden-nikkud display still transliterates, memoized by style + word
  in `_wtlMemo` (`wireTranslit` clears it on a style change; `''` is never stored, so the
  `translitlibloaded` rebuild fills the cells). A proclitic is tried with its maqaf first, for the
  library's stress and dagesh context, then plainly. Beneath both placements `applyTranslit` memoizes every
  input by style + text in `_tlMemo` (never `''`; the style is in the key, so nothing clears it), so a
  re-render never runs the library again over a reading it has already transliterated.
- **Follow.** `karaokeFollowEffective()` returns `'hebrew'` while the placement is `'word'` (the Latin line
  moves with its Hebrew cell; a stored `'translit'` would otherwise neutralise every highlight) and is what
  `applyKaraokeAppearance` and `updateKaraokeWordRefs` read; the Follow radios keep their value and
  `#kfUnderNote` says so.
- **CSS.** The cell is an `inline-flex` column (its baseline is the Hebrew item's, so the bare maqaf text
  between cells stays on the line). `text-decoration` on the cell would propagate into both items, so the
  karaoke *Under* style and the trope clause underline (screen fallback and print) are re-homed on
  `.tt-wh` — the family colour rides a `--tt-tl` custom property set beside each `text-decoration-color`;
  backgrounds, outline, hover and focus stay on the whole cell. `.tt-wtl` reads `--tt-translit-size`, so
  the Translit size slider sizes it.
- **Storage.** `translitPlacement` is in the settings blob and in `LINK_DISPLAY` (how a reading looks). The
  copy path never receives `underWord`, so a paste never carries the Latin line; the handout forces the
  transliteration off as before.

---

## Side by side — one row per verse (`torah_trainer.html`)

`renderSideBySide` builds one `.tt-grid-col` per text (translation, transliteration, Hebrew) and gives every
cell an explicit `grid-row` (the verse's row; an aliyah divider owns a row of its own and spans `1 / -1`) and
`grid-column`. With a second text beside the Hebrew the grid carries `.tt-print-parallel` and
`data-print-cols`, and the column wrappers become `display:contents` — on screen above the 720px collapse and on
paper alike — so a verse's cells share one row and can never drift apart; the column count comes from
`data-print-cols`, which the explicit column numbers assume. At 720px and below the columns stack; with the
Hebrew alone the wrappers stay plain blocks.

The column ORDER does not mirror: `.tt-grid` is pinned `direction:ltr`, so column 1 (the translation) is on the
left and the Hebrew, the last column, on the right in the English and the Hebrew UI alike, as in a bilingual
Chumash — on screen and on paper. Each column sets its own direction (the Hebrew column `rtl`, the Latin rows
`ltr`), and `[dir="rtl"] .tt-grid-col h3` gives the headers back the Hebrew UI's direction (they are translated
chrome). An RTL sweep must not "fix" the pin.

---

## Practice link — the sender's look (`?s=`, the link view)

`torah_trainer.html`'s Copy link (`copyPracticeLink`, in the settings drawer's Share tab, reached through the
toolbar's Settings button; the readable-param half is in `shared-components.md` → *Share links*) has an **Include my
settings** switch under it in that tab (`#ttShareSettings` → `settings.shareIncludeDisplay`, remembered and
synced with the blob).

- **What travels.** `LINK_DISPLAY` is the one list of carried keys, each with the check a value must
  pass: layout, the four show-toggles (nikkud, te'amim, transliteration, translation), the
  transliteration style and placement, the Hebrew font and the three text sizes, vowel coding (on, mode, scheme,
  overrides), trope coding (on, look, overrides), karaoke style and follow, and the Trope staff's words, key,
  voice, direction and note names (`staffWords`, `staffShift` as a whole number of half steps, `staffVoice`,
  `staffDir`, `staffNoteNames`; the layout itself travels as `layout: 'staff'`). Enum lists are read from the
  page's own radios and `<option>`s (a color list's No highlight is left out: it travels as the
  on/off boolean, never as a mode, and a list's look travels only while its coloring is on,
  `LINK_LOOK_SWITCH`), colors must be `#rrggbb` (`TROPE_HEX6_RE`), sizes are clamped to
  their sliders, and a font must be in `HEB_FONTS`. **Both ends run the checks:** the sender, so only
  what this page can re-validate ever leaves, and the reader, because anyone can edit a link. `?s=` is
  base64url JSON `{v: LINK_VIEW_V, …}` holding only what differs from `DEFAULTS`.
- **What never travels:** the reading (the readable params carry it), audio speeds and the click
  action, copy and handout preferences, the schedule (the calendar, the reading cycle and the triennial year),
  and **`translationVersion`**. A version title
  would reach Sefaria, and nothing from a link may. A My Font lives on its own device, so it is
  left out, the toast names it, and the reader gets the standard font.
- **The reader's side is a live view, never a save.** `linkViewApply()` runs right after
  `loadSettings()`. It is silent on garbage: the payload must be an object with the current `v`, at
  most 4096 characters. A key the link leaves out takes `DEFAULTS`, so the reader sees the sender's
  whole look rather than a blend with their own. A key it names but whose value fails its check keeps
  the reader's own. A look (`colorCodingMode`, `tropeCodingMode`) is taken only when the coloring the
  view will show is on (the link's value, the reader's own where the link's is refused, `DEFAULTS`,
  off for both, where it is left out); otherwise the reader keeps their own look, untracked, so a
  link carrying a look whose coloring is off raises no note and gives Keep nothing to take. The keys that differ become `_linkView = {own, shown}`, and **`storedSettings()`
  is what every write stores**: `saveSettings`, `saveSettingsFlush` (the cloud `flush`) and the
  handout's pending-save flush. It stores the live settings with each still-shown key put back to
  `own`. A key whose live value no longer equals `shown` was changed by the reader and is saved from
  then on (released). A choice that writes several keys releases all of them at once
  (`linkViewClaim`), because its "on" may equal the link's: a color-list look releases the list's
  on/off and look, No highlight the on/off only, the trope chip both.
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
- **The Torah Trainer's favorites are two rows beside the settings blob** — `favorite` (one row per saved
  reading) and `favoriteFolders` (its tree, merged through the page's `merges: { favoriteFolders: ftMergeTrees }`).
  `onLocalChanged(kind)` branches on the kind: the two favorites kinds only re-render the list
  (`renderFavorites`, which re-reads its keys); everything else takes the handout-guarded `cloudReread`
  below. Deleting a favorite keeps its sync memory on purpose (*Settings drawer → Favorites*).
- **A download during the handout print override waits.** `onLocalChanged` sets `_pendingCloudReread` while
  `_handoutActive` (the module's flush is a no-op then, so the download stays in the store) and `_handoutExit`
  runs `cloudReread()` — the `resetAllSettings()` sequence plus `syncParshaSelect` and the fallback reset
  (`syncFormToSettings` re-syncs the handout section too) — afterwards. The Trope Tutor's hook also rebuilds the drill-scope box (`buildDrillScopeSel`),
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
  device is the next device's starting point, and a favorite is the durable form of the same reading); a
  `?ref=` range seeds `parshahKey` only when the device has none, so a teacher's own week survives opening a
  colleague's link; `lastPos` and `loopVerse` stay per device (omitted — the cross-device memory of *what* to
  read is a favorite, not the scroll position); the Trope merge
  maxes `w` as well as `r` (mastery can read lower after a lossless merge, never higher than either side);
  `progress.v` is maxed and then forced to the current schema version.
