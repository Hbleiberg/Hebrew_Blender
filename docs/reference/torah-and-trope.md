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

- **The drawer's two color panels are one list each, and the list is the on/off switch.** Vowel
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
  is a 2×2 block (`.tt-color-grid`), because its four English choices need about 321px of the
  default drawer's 317px row. The page's
  `.radio-group` radios are visually hidden but focusable (the Trope Tutor's rule, with
  `position:relative` on the group so they scroll with the drawer), so the lists stay
  keyboard-operable like the switches they replaced; the drawer's focus trap skips unchecked
  radios. Every `.radio-group` on the page is a `role="group"` named by `aria-labelledby` from its
  visible label; the two karaoke groups also take the *Karaoke settings* heading, so their
  Highlight does not sound like the color lists'.

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
  chooses Underline, **or automatically by the collision rule**: nikkud coloring on **and**
  `colorCodingMode === 'highlight'` (and nikkud shown), whatever the trope list says (the tip
  says so). The one class carries both causes. The translit-under rules read it, and so do the
  legend's swatches, which switch from the tint to the solid `-line` color under it (`--tt-sw-bg` /
  `--tt-sw-line`). The copy path (`_inlineCopyStyles`) never reads it: it decides from the copy's
  own options, the Underline choice or syllable highlights actually in the copy (Copy → Nikkud can
  include vowels the screen hides, or drop ones it shows). Print always underlines.
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
groups are names and tradition (primary names, melody), sing along (key, voice — see *Key and voice*
below), drill, Hebrew font, and a shared row of progress, cloud saves and about.
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
  be, and the staff's aria-label names the melody. The motif builder never reads or writes this
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
  Torah, 33 High Holiday + row 20's second setting), for a staff of a whole reading. **No page fetches
  it yet**; the first page to load it adds a `?v=1` and joins `docs/reference/ops.md`'s list.
  - It is built by `node scripts/build-trope-phrases.mjs` from the fenced row blocks in
    `docs/tropepatterns.md` sections B and C, which are **the only hand-edited copy of the notes**:
    fix a note there and re-run the builder, never edit the JSON.
  - Zero dependencies, offline. It writes `docs/trope_phrases_report.md`: every figure of every mark
    in every printed context, and the staff check above.
  - **Shape.** `{v:1, built, license, source, tpq:48, values, melodies:{torah|highholiday:{key, rows}},
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
    - `docs/tropepatterns.md` → *G. Toward a parasha staff* reads the result.
- **Key and voice** (Settings → *Sing along*, and the Learn tab's key bar `#tuKeyBar`). Two fields of the
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
- **`TROPES` taxonomy** — one `═══`-marked table (26 entries — zarka is a single entry carrying
  both codepoints: key, chars, display, Ashkenazi +
  Sephardi names, family, rare flag) kept **byte-identical** between `scripts/build-trope-index.mjs`
  and `trope_tutor.html` (same convention as the `.ivrit` engine; copy, don't rewrite). Family
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
  `hebrewTropeTutor_settings` (tradition ashk/seph, `melody`, `tuneShift`, `tuneVoice`, hebFont,
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
  library's stress and dagesh context, then plainly.
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

## Practice link — the sender's look (`?s=`, the link view)

`torah_trainer.html`'s Copy link (`copyPracticeLink`; the readable-param half is in
`shared-components.md` → *Share links*) has an **Include my settings** switch beside it
(`#ttShareSettings` → `settings.shareIncludeDisplay`, remembered and synced with the blob).

- **What travels.** `LINK_DISPLAY` is the one list of carried keys, each with the check a value must
  pass: layout, the four show-toggles (nikkud, te'amim, transliteration, translation), the
  transliteration style and placement, the Hebrew font and the three text sizes, vowel coding (on, mode, scheme,
  overrides), trope coding (on, look, overrides), karaoke style and follow. Enum lists are read from the
  page's own radios and `<option>`s (a color list's No highlight is left out: it travels as the
  on/off boolean, never as a mode, and a list's look travels only while its coloring is on,
  `LINK_LOOK_SWITCH`), colors must be `#rrggbb` (`TROPE_HEX6_RE`), sizes are clamped to
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
