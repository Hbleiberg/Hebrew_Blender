# Letter Discrimination (beta) — `letter_discrimination.html`

An unlisted research instrument (`docs/reference/ops.md` → *An unlisted page*): does a Hebrew **font** change how
well a reader tells look-alike letters apart? It is the on-screen form of a paper worksheet — a grid of letters and a
color key; the participant colors every letter with its key color — played once per font and scored for accuracy and
time. One self-contained page; no module of its own.

## What it deliberately does not have
- **No analytics** (no gtag, no analytics origin in its CSP) and **no account layer**: participants may be children,
  and `connect-src` is `'self'` — a result cannot leave the device by any path but the CSV download.
- **No localStorage key of its own**, so nothing to register in AllTools, the sync registry, `.ivrit` files or the
  legal text. It reads only the suite-wide `hebrewBlender_darkMode` / `hebrewBlender_lang`. A change that makes it
  persist a study or its results brings all of those rules with it (`docs/reference/storage-and-backup.md`), and
  stored results about students need the maintainer's say-so first (research ethics, not just code).
- Not in `index.html`, the sitemap, `llms.txt` or `sw.js` `CORE_ASSETS`.

## The three screens
| Screen | Who | What |
|---|---|---|
| Setup (`#ldSetup`) | researcher | letters (look-alike group chips `LD_GROUPS` + the alef-bet chips; 2–8), a color per letter slot, grid size (2–12 each way), the fonts in the study (`HEB_FONTS` + My Fonts, at least two), an optional participant **code** |
| Round (`#ldRound`) | participant | a "ready" card with **Start**, then the paper: grid + key in the round's font, Eraser, Done |
| Results (`#ldResults`) | researcher | per-font table, the session's confusion table (letter in the square × letter whose color it got), **Download CSV** |

`S` is the whole study (`letters`, `colors`, `rows`, `cols`, `fonts`); the defaults (`ldDefaults()`) are the paper
worksheet: 9×9, ד ר ב כ ז ו ע צ, its eight colors.

## Contracts
- **The paper is the stimulus and must not vary with the UI**: white with black ink in light and dark mode, and
  `.ld-stage` is pinned `direction:ltr` (grid left, key right) in the Hebrew UI too; the grid and key themselves are
  `dir="rtl" lang="he"`. A painted square keeps its letter (ink chosen by `ldInk`) and takes an inset ring, so a
  square painted **white** still differs from an unpainted one.
- **A round is recorded under a font only if that face really loaded** (`ldFontUsable` reads the `FontFaceSet`;
  `document.fonts.check()` answers true for an undeclared family). A font that does not load is skipped, listed on
  the results screen and in the CSV's `skipped_fonts`, and does not count in "Round n of total" — never drawn in a
  fallback face.
- **The font's name is hidden during a round** (blind condition); it appears only on the results screen.
- **Timing** is `performance.now()` from two animation frames after the grid is shown (the participant's own Start
  press) to Done — no interval timer and no visible clock. Done with unpainted squares warns inline once; a second
  press finishes.
- **Reproducibility**: one seeded generator (`ldRng`, seed in the CSV) shuffles the font order and builds every grid;
  each letter appears equally often (±1), in a fresh arrangement per round. `?seed=<integer>` fixes the seed (tests,
  or a study that wants identical grids for everyone); otherwise it is random per session.
- **Study link** (`?s=`, or `#s=` when long): a base64url JSON diff against the defaults — `l` letters, `c` colors,
  `r` rows, `k` columns, `f` built-in font names. Parsed with `ivritSafeParse`, every field validated, silent on
  garbage, never navigates. My Fonts cannot travel in it (they live on one device) and the copy note says so.
- **Results live in memory** (`ALL_ROWS`) for every session since the page was opened, so one tablet can run a class
  and download once; `beforeunload` warns while rows are undownloaded.
- **CSV** (`LD_CSV_COLS`, long format, one row per square, the round's totals repeated): column names stay English;
  cells go through `ldCsvCell` (formula-injection guard) and the file carries a UTF-8 BOM. `paint_count` counts every
  change to a square, erasing included.
- **On a touch screen** the grid's height budget (the screen's height less 250px of chrome) is read from the small
  viewport and never drops below `min(360px, the screen − 24px)`, so a landscape phone's grid fills the screen once the
  page scrolls past the header; a portrait phone's grid still fills the width (the 560px rule). `ldFitPaper()` opens a
  paper that does not fit below the round bar from its own top edge (a phone: the grid, the key and Done on one
  screen), because the swipe made to reach the rest would land on the grid and paint. A mouse sees neither.
- **Input**: tap or drag (the grid is `touch-action:none`), arrow keys in a roving-tabindex grid (Left = next square,
  the grid being right-to-left), Space/Enter paint, `1`–`8` pick a color, `0` the eraser.
- `applyI18n` re-labels only; it never touches a round's cells or clock.

## Shared blocks carried
`header-icons CSS`, `ivritsuite-fonts`, the My Fonts uploader (pick handler: add the font to the study), and the
Dictionary's `HEB_FONTS` list. No toast, keyboard, tour, panel-memory or `.ivrit` block.

## Verifying
The Playwright recipe aborts Google Fonts and jsDelivr, so only Frank Ruhl Libre loads; put two test faces in My Fonts
(`saveUserFont` with the bytes of two files under `/fonts/`) to get a multi-round session, and leave one remote font
ticked to exercise the skip path. Remote font loading itself is checked on the deployed page.
