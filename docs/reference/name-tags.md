# Name Tags (`name_tags.html`)

Printable student name tags from a class list. The page is **unlisted** (no link or card on the hub, `noindex`,
absent from `sitemap.xml`, `llms*.txt` and `sw.js` `CORE_ASSETS` — `docs/reference/ops.md` → *An unlisted page*);
in every other respect it is a full tool page: CSP, i18n (`nametags.*`), the account chip and sync, `.ivrit` files,
the AllTools registration of its keys, a tour, and the backend smokes.

## Storage

| Key | Synced as | What it holds |
|---|---|---|
| `hebrewNameTags_lists` | `NameTags` / `list`, map/item — one row per list, named by the list | `{ "<list name>": { v: 1, rows: [{ he, en, tr?, ex? }], extra } }`. `tr` is stored only when typed (the automatic transliteration is computed at render and never stored, so it cannot differ between devices); `ex` overrides the list's `extra` for one student |
| `hebrewNameTags_settings` | `NameTags` / `settings`, single/assign, no `omit` | The design and print options (`NT_DEFAULTS` is the field list and order) |
| `hebrewNameTags_activeList` | never (per device, erase-only) | Which list this device last had open |
| `hebrewNameTags_panels` | never (AllTools only) | The shared panel-collapse map: the sidebar panels and the class list's fold (`nametags.list.heading`) |
| `hebrewNameTags_sidebarW`, `hebrewNameTags_tourSeen` | never (erase-only) | The sidebar width and the tour's pulse flag |

- **Nothing is written on load.** A first visit shows an unsaved list named by `nametags.list.default_name`; it is
  written the moment the teacher types into it, so no seed ever reaches an account.
- **Lists:** only the open list is held in memory (`ntCur`), edited in place so unknown fields (a newer build's)
  survive; every save re-reads the store and writes the open list into it (`ntSaveList`), so a list another tab or
  device sent is never overwritten. A rename rebuilds the store with the new key in the old place (a rename is a
  delete and an add, one account row per name) and refuses a taken name; Duplicate uses `ftDuplicateName`'s
  "X" → "X 1" rule; the list menu is sorted by name (the account does not keep key order).
- **Settings:** the Parsha Emojis pattern — the stored object (`ntSetRaw`) is edited in place and `ntSet` is its
  normalized view; sliders and colour wells update the look on `input` and write on `change`.
- **`ntFlush`** (the module's `flush`) only applies the two-tab rule to both keys: a store that moved under this tab
  is adopted. `onLocalChanged('settings')` adopts and writes back; `onLocalChanged('list')` re-reads and re-renders,
  keeping the focused cell and caret, and never writes back.
- **Limits:** 30 lists, 200 students a list, 120 characters a field or list name, a CSV of 1 MB; each refusal is an
  inline note, never an `alert()`.
- **Row order is the `rows` array**, so the save, the sync, the CSV, the `.ivrit` file and the printed sheets all follow
  it (a tag's pastel follows its place). Each row ends in a grip (`[data-move]`): a drag uses pointer events, never
  HTML5 drag-and-drop (which does not fire on touch), with the pointer captured on the `<tbody>` (it never moves, so
  the capture survives the rows being reordered under it) and `touch-action:none` on the grip; the carried `<tr>`
  moves live, the page scrolls near the window's edge but never past the table's ends, and the drop commits through
  `ntMoveRow` (which also keeps the on-screen keyboard on the same student and drops a remove-Undo from the old
  order). A focused grip moves its row with ↑/↓; Escape, a cancelled pointer or a re-render mid-drag (a sync's
  `onLocalChanged('list')`) puts the order back.

## Layout: the class list's fold and the hidden sidebar
- **The class list folds** from its heading (`#ntListToggle`, a real button) so the preview rises beside the options;
  folded, the heading shows the open list's menu text. It rides the shared panel-collapse memory unchanged: the
  section is a `.panel` to that engine only (an override drops the sidebar panels' look) and `PANEL_MEM_CFG.scope`
  names the toggle.
- **The options sidebar hides** from the generator's pair of edge tabs on `.nt-app.sidebar-hidden`, per visit only
  (`docs/reference/shared-components.md` → *Collapse / close interplay*). The hide tab is placed by
  `ntPositionSidebarTab` (the seam's `onChange`, window resize, `applyI18n`); at ≤800px there are no tabs and the
  sidebar always shows. The tab glyphs are plain `‹ ›` with no `.dir-arrow` flip: they are bidi-mirrored characters,
  so the Hebrew UI already turns them.
- **The Tour button runs `ntTourStart`**, which shows the sidebar and opens a folded class list on screen (no memory
  save) before the shared engine, which skips any step whose target is hidden.

- **The class list's headings follow their columns' script.** Each cell's own `dir` places its text — a Hebrew name at the
  cell's right edge, a transliteration or English name at the left — in both UIs, so the headings take the same physical
  side (`th.nt-col-he` right, `th.nt-col-tr` / `th.nt-col-en` left): the page's one alignment by script rather than by the
  UI's direction, like the sheets' pinned LTR. The extra line is `dir="auto"`, so its heading keeps `start`.

## Transliteration

The Dictionary's lazy loader (`window.HebrewTransliterator`, `hebrew-transliteration@2.9.1` from esm.sh, jsDelivr as
the fallback; the "Keep in sync" copies, and the Torah Trainer's compact variant) supplies the library. Each copy must
pass `translitWorks` (a known word comes back as plain Latin letters) before it is used: jsDelivr's `+esm` build carries
havarotjs's word classes twice and answers every word with `[object Object]`, so today that fallback always counts as a
failed load and each page's offline path takes over. The page builds its own two schemes from
`HebrewTransliterator.lib.SBL` in `ntSchemas()` (`NT_TR_BASE`): **ch** for ח and כ, **tz** for צ, a final kamatz-he
as a plain *a* (Shira, Rivka), no doubled letters (`DAGESH_CHAZAQ: false`), tzere-yod as *ei* (Eitan), vocal sheva
*e*. **Modern** reads kamatz as *a* and ת as *t*; **Ashkenazi** reads kamatz as *o* and a ת without a dagesh as *s*
(Dovid, Avrohom, Rus). Before the library reads a name, `ntTrPrep` drops a word-initial sheva unless the letter is
י ל מ נ ר or the next one is א ה ח ע צ (Yehuda, Menachem, Betzalel — but Shmuel, Tzvi, Dvora); `ntTrClean` strips
the library's diacritics, drops a word-final *h* after a vowel, and capitalizes each word. A name with no vowel points
gets no automatic transliteration (the library would return consonants), and the note under the table says how
many. The library loads only when an automatic transliteration is needed; offline, the note says so and typed
transliterations still print.

## Rendering and layouts

- **Every line is an SVG `<text>`** sized in inches: its slot is the slider's share of the tag's inner height, its
  `viewBox` the text's canvas-measured box (`ntMeasure`, in the same face at 100 px, the vertical extent widened to a
  reference string so every tag's letters share one size); a line wider than its tag keeps its slot and scales down
  (`preserveAspectRatio` meet). The memo is cleared and the preview re-rendered when a face finishes loading.
- **A tag missing a line lets its own lines grow.** `ntFullLines(list)` collects the kinds of line (`he`, `tr`, `en`,
  `ex` — each line object's `kind`) that any tag in the rendered list carries; a tag with fewer scales its slots up
  together into the height the full set would take (capped at the inner height), at most 2½ times their slider size,
  so a one-name student's tag (a Dashboard roster line, a Hebrew name without nikkud for the transliteration) is not
  half empty. A list whose tags all carry the same lines prints at the slider sizes. **A transliteration that spells the
  English name** (David / David — most of a class; letters only, case and accents ignored, so Dovid / David both print) **is
  left off the tag** (`omit` on its line in `ntLinesFor`): the line still counts as present, so that tag keeps the slider
  sizes rather than growing, and the set stays uniform.
- **Bubble letters** are two layers of the same text: a round-joined stroke of `2 × (puff + edge)` in the ink colour,
  then a stroke and fill of `2 × puff` in the inside colour (white to colour in, or a chosen colour). Puff is in font
  units (`2 + slider × 0.05`); past about 7 the letters' counters fill in. The nikkud is left out in bubble mode.
- **Plain paper:** Letter or A4 at a 0.35 in `@page` margin, a 0.3 in gutter with a dashed cut line down its middle;
  1 and 4 a page turn the paper (`NT_PLAIN`). **Desk tent cards** (plain paper, 1 or 2 a page) split each cell at a
  dashed fold line and turn the top face 180°.
- **Avery labels** (`NT_AVERY`, Letter, `@page` margin 0, labels placed from the paper's edge): 5165 (1), 5126 (2),
  5168 (4 — its labels are taller than wide, so the tag is laid out turned 90°, placed at the label's centre by its own offsets
  in inches: a percent translate on that bordered, turned box made Chrome's print draw a phantom border side down to the
  paper's edge and shift the lower labels), 5164 (6), 5395 (8, name badges),
  5163 (10). Sizes, first-label offsets and pitches are the gLabels template database's; measured from a printed PDF
  the label corners land within the pixel and corner-radius tolerance. *Print the label outlines too* adds the
  label shapes to the print (a test page on plain paper).
- **The preview is the print.** Each sheet is drawn at its real size in a frame scaled by `--nt-k`; print CSS drops
  the scale and everything around the sheets, and `#ntPageSize` holds the `@page` rule `ntPageStyle` writes on every
  render. On paper each sheet's box is a hair (0.02in) shorter than the printable area so rounding never adds a blank
  page, and its clip reaches that hair back (`overflow:clip` with `overflow-clip-margin`), so the last row's bottom
  border prints as whole as the first row's top; a browser without the clip margin keeps the sliver. The sheet is laid out in physical coordinates (pinned `direction: ltr`, like the keyboard's qwerty rows),
  and its ink and paper are literal light colours in either theme.
- **One render a frame, and a pause while typing into a long list.** Every change queues one rebuild of all the
  sheets on the next frame (`ntQueuePreview`); a keystroke in a list of more than 40 students — in a cell or in the
  extra line, which sits on every tag — waits for a 250 ms pause in the typing instead (`ntQueuePreviewTyping`), so each
  keystroke on a phone stays cheap. Print and a browser print (`beforeprint`) draw a pending render at once.
- **A sheet off-screen costs nothing to rebuild.** `.nt-frame` carries `content-visibility:auto`, so only the sheets near
  the viewport are styled, laid out and painted after a rebuild (a slider drag on a long list otherwise laid out every
  tag on every frame); the frame's own size is explicit, so the column's height and scroll never change, and the print
  block pins `content-visibility:visible` so every sheet prints. The frame's contents are paint-contained, so their
  screen pixels sit on the frame's own raster alignment (glyph edges differ from an uncontained sheet by a sub-pixel
  phase; the markup, the print and the geometry do not).

## From the Classroom Dashboard, and back

Both are **one-time copies**; nothing links a list to its source afterwards.
- **Dashboard → Name Tags:** *From the Classroom Dashboard* lists the dashboard's classes that have names
  (`hebrewDashboard_settings.rosters`, as this device holds them — signed in, the note says the account's classes
  arrive when the dashboard opens on this device; the page does not `alsoPull` the Dashboard, whose `settings` kind
  would reach this page's `onLocalChanged`). A roster line is one student typed any way: `ntSplitName` puts its
  words with Hebrew letters in the Hebrew name and the rest in the English name, dropping the separators between
  them (`/`, `|`, `·`, brackets, a free-standing dash), so "David / דָּוִד", "דוד כהן David Cohen" and
  "בַּת־שֶׁבַע - Batsheva" each fill both; a hyphenated or maqaf name stays whole. The rows then take the CSV import's
  path (Add / New list, named after the class / Replace), so copying a class into a list that already has it adds
  only its new students (*Add matches by name*, below).
- **Name Tags → Dashboard:** the dashboard's *Make a class from a Name Tags list* (`docs/reference/dashboard.md` →
  Student Picker), shown only on a device that holds Name Tags lists.

## CSV

`ntParseDelimited` is `scripts/build-locales.js`'s RFC-4180 parser with the delimiter sniffed (tab, semicolon,
comma). `ntImportRows` finds columns by an English or Hebrew header (`NT_HEADERS`: Hebrew/עברית, English/Name/First
plus Last, Transliteration/Pronunciation/תעתיק, Extra/Class/Grade/כיתה) and, when no header names a name column
(no header row, or "Full Name" / "שם מלא" / "תלמיד" beside a class), by content among the columns left (the column of
Hebrew letters, then the first and second Latin columns). A name in the other script's column — Hebrew first and last
names under שם פרטי / שם משפחה, "דָּוִד David" in one Name column, the two columns swapped — is sorted by script with
`ntSplitName`, as a Dashboard roster line is; a row with no name and no transliteration (a class column alone) is not a
student. A file is decoded as UTF-16 when it carries a byte-order mark or its NULs sit on one side of every byte pair (Excel's
"Unicode Text"), else as UTF-8, falling back to windows-1255.
The import offers Add / New list (named from the file) / Replace (a `confirm()` naming the account-wide effect when
signed in); an import that brings extra-line values turns the extra line on.

**Add matches by name** (`ntMergeRows`, every Add: a file, a paste, a Dashboard class). Names are compared by
`ntMatchKey` — capitals, spacing and nikkud ignored, a maqaf read as a hyphen and a geresh as an apostrophe. An
incoming row names a student already on the list when every name both have agrees and they share at least one
(so "David" matches "דָּוִד / David", and "רבקה" never matches "Rivka" — they share no name); pairs agreeing on both
names are matched first, and each student on the list is matched at most once, so two students who share a name stay
two. A match only fills what the list lacks: a blank Hebrew name, English name, transliteration or extra line, and the
nikkud of an unpointed Hebrew name with the same letters; nothing typed is replaced. The note counts the students
added, those already on the list and those filled in (`nametags.csv.added` / `.already` / `.filled`, or
`.all_there` when nobody was new). New list and Replace start empty, so they match nothing. Export and the template write a UTF-8
BOM (Excel) and prefix a cell that starts like a formula with `'`.
