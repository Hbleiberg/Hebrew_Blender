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
  Tutor shipped (see its section below). On paper the color→family key travels via the **print
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
  gets none (measured S324 on 30 PDFs, every margin setting). The in-flow legend card and
  `.tt-ref-hdr` are print-hidden (the band replaces them on paper); on-screen legend behavior
  is unchanged. The band never prints spuriously — beforeprint hides it when no reading is
  loaded, and its chips render only with trope coloring on.

---

## Trope Tutor (`trope_tutor.html`)

A standalone Learn + Drill page for the cantillation marks. **Zero runtime Sefaria dependency** —
it consumes only the pre-built static index plus PocketTorah MP3 streams. Its CSP therefore has
**no `sefaria.org`** (and no `esm.sh`); if a change seems to need either, the design has drifted —
stop and reconsider. Shell (dark mode, settings drawer, tooltips, tour, toast, My Fonts) is copied
from `torah_trainer.html`.

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
- **Melody motifs**: `data/trope/trope_motifs.json` — `{v:1, system:"torah", built, license,
  tropes:{<key>:{notes:[{p,d}], verified}}}`, where `p` = pitch in semitones relative to the clip's
  final sustained tone (rendered as B on the treble middle line) and `d` = relative duration 1–4.
  It feeds the drill's **Melody** questions and is fetched `?v=2`. Built offline by
  **`node scripts/build-trope-motifs.mjs`** `[--force] [--only=<tropeKey>]`, which pitch-tracks
  (YIN) the same PocketTorah clips the Learn cards play and takes the medoid contour across 2–3
  examples; it rewrites `docs/trope_motifs_report.md`, so **commit both files together and bump the
  `?v=` on the page's motifs fetch**, exactly as for the index above. Three things that make this
  builder unlike every other script here:
  - **`verified:true` entries are HUMAN work and the default run preserves them verbatim.** Every
    emitted motif starts `verified:false` (a machine draft); a person auditions it via the page's
    `?debug=motifs` mode, hand-corrects the JSON, and flips the flag. **`--force` re-analyzes
    verified entries too and will silently discard those corrections** — it is the one destructive
    flag in `scripts/`. Prefer `--only=<tropeKey>`, which carries every other entry through untouched.
    (At the time of writing **0 of the 25 entries are verified**, so `--force` currently destroys nothing —
    but that is a fact about today's data, not a property of the flag. 25, not 26: `geresh_muqdam`
    has no corpus occurrence to analyze.)
  - **It is the ONE builder with an npm dependency** — a deliberate, documented exception to the
    repo's zero-dep rule: MP3 decoding needs `mpg123-decoder` (`npm install` it at the repo root;
    `node_modules/`, `package.json`, `package-lock.json` are gitignored, so nothing is committed).
    Downloads go through `curl` because Node's `fetch` ignores `HTTPS_PROXY`; MP3s cache in
    gitignored `source-data/motif-cache/`, so re-runs are offline and byte-identical.
  - **Its output is CC BY-SA 4.0**, not the repo's license — the transcriptions derive from
    PocketTorah recordings (© Russel Neiss & Rabbi Charlie Schwartz). Both the JSON and the report
    carry that notice; keep it on anything derived from them.
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
  Postpositive/prepositive marks sitting at word edges is **correct**, not a bug.
- **Persistence** (no presets, no `.ivrit` engine — AllTools-only backup):
  `hebrewTropeTutor_settings` (tradition ashk/seph, hebFont, hebFontSize, drill-type toggles,
  playbackRate) and `hebrewTropeTutor_progress` (`{v:1, tropes:{key:{r,w}}, families:{}, pbStreak}`).
  Registered in all five AllTools sites in `index.html`; progress imports go through
  `tropeProgressMerge` (r/w/pbStreak = max, families = union). `hebrewTropeTutor_tourSeen` is the
  export-exempt, erase-cleared tour flag.
- **Drill**: 10 questions/session; three types (Identify / Hear / Melody) toggleable in settings
  (last one refuses to uncheck **inline**, no alert). Answers sampled weighted by
  `0.35 + (1 − mastery)` (rare ×0.5, no adjacent repeats); questions stable-sorted by clip file key
  to minimize MP3 hops; distractors sampled without replacement, weighted toward same-family ∪
  `CONFUSABLE_PAIRS` (pashta↔kadma etc.) as the answer's mastery rises. Melody choices are two-tap:
  first tap plays, second tap answers.

---

