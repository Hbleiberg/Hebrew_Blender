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
| `hebrewNameTags_panels` | never (AllTools only) | The shared panel-collapse map |
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

## Transliteration

The Dictionary's lazy loader (`window.HebrewTransliterator`, `hebrew-transliteration@2.9.1` from esm.sh, jsDelivr as
the fallback; the "Keep in sync" copies) supplies the library; the page builds its own two schemes from
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
- **Bubble letters** are two layers of the same text: a round-joined stroke of `2 × (puff + edge)` in the ink colour,
  then a stroke and fill of `2 × puff` in the inside colour (white to colour in, or a chosen colour). Puff is in font
  units (`2 + slider × 0.05`); past about 7 the letters' counters fill in. The nikkud is left out in bubble mode.
- **Plain paper:** Letter or A4 at a 0.35 in `@page` margin, a 0.3 in gutter with a dashed cut line down its middle;
  1 and 4 a page turn the paper (`NT_PLAIN`). **Desk tent cards** (plain paper, 1 or 2 a page) split each cell at a
  dashed fold line and turn the top face 180°.
- **Avery labels** (`NT_AVERY`, Letter, `@page` margin 0, labels placed from the paper's edge): 5165 (1), 5126 (2),
  5168 (4 — its labels are taller than wide, so the tag is laid out turned 90°), 5164 (6), 5395 (8, name badges),
  5163 (10). Sizes, first-label offsets and pitches are the gLabels template database's; measured from a printed PDF
  the label corners land within the pixel and corner-radius tolerance. *Print the label outlines too* adds the
  label shapes to the print (a test page on plain paper).
- **The preview is the print.** Each sheet is drawn at its real size in a frame scaled by `--nt-k`; print CSS drops
  the scale and everything around the sheets, and `#ntPageSize` holds the `@page` rule `ntPageStyle` writes on every
  render. The sheet is laid out in physical coordinates (pinned `direction: ltr`, like the keyboard's qwerty rows),
  and its ink and paper are literal light colours in either theme.

## From the Classroom Dashboard, and back

Both are **one-time copies**; nothing links a list to its source afterwards.
- **Dashboard → Name Tags:** *From the Classroom Dashboard* lists the dashboard's classes that have names
  (`hebrewDashboard_settings.rosters`, as this device holds them — signed in, the note says the account's classes
  arrive when the dashboard opens on this device; the page does not `alsoPull` the Dashboard, whose `settings` kind
  would reach this page's `onLocalChanged`). A roster line is one student typed any way: `ntSplitName` puts its
  words with Hebrew letters in the Hebrew name and the rest in the English name, dropping the separators between
  them (`/`, `|`, `·`, brackets, a free-standing dash), so "David / דָּוִד", "דוד כהן David Cohen" and
  "בַּת־שֶׁבַע - Batsheva" each fill both; a hyphenated or maqaf name stays whole. The rows then take the CSV import's
  path (Add / New list, named after the class / Replace).
- **Name Tags → Dashboard:** the dashboard's *Make a class from a Name Tags list* (`docs/reference/dashboard.md` →
  Student Picker), shown only on a device that holds Name Tags lists.

## CSV

`ntParseDelimited` is `scripts/build-locales.js`'s RFC-4180 parser with the delimiter sniffed (tab, semicolon,
comma). `ntImportRows` finds columns by an English or Hebrew header (`NT_HEADERS`: Hebrew/עברית, English/Name/First
plus Last, Transliteration/Pronunciation/תעתיק, Extra/Class/Grade/כיתה) or, headerless, by content (the column of
Hebrew letters, then the first and second Latin columns). A file is decoded as UTF-8, falling back to windows-1255.
The import offers Add / New list (named from the file) / Replace (a `confirm()` naming the account-wide effect when
signed in); an import that brings extra-line values turns the extra line on. Export and the template write a UTF-8
BOM (Excel) and prefix a cell that starts like a formula with `'`.
