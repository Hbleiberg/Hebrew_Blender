# Adding a glyph set to the Hebrew Font Maker — recipe

> Binding rules live in `CLAUDE.md`; this is how a new glyph set (an optional alphabet tab such as
> English or Cyrillic, or a tab of forms composed from the Hebrew letters) is added so that it seeds,
> draws, cycles, exports, reloads, imports and prints like the ones already there. Locate everything by
> pattern — line numbers drift. The **Cyrillic set is the reference implementation** for an LTR set, and the
> **Phoenician set** (`grep -n "isPhn(\|\.phn\b\|addPhoenicianLetters\|PHOENICIAN_" Hebrew_Font_Maker.html`)
> for an RTL one and for a set above the BMP. **Imperial Aramaic**
> (`grep -n "isAram(\|\.aram\b\|addAramaicLetters\|ARAMAIC_" Hebrew_Font_Maker.html`) is that same RTL recipe
> worked a second time, so diffing the two stems shows which sites are per-set and which are boilerplate. Cyrillic is the minimal
> alphabet set (no accent bands), so `grep -n "isCyr(\|\.cyr\b\|addCyrillicLetters\|CYRILLIC_"
> Hebrew_Font_Maker.html` lists every site a new set needs a twin at. English carries the same sites
> plus its import-only accent bands (`LATIN_*`, `engSupportsAccents`, `renderEngAccentLeft`), which a
> new set only copies if it has ready-made composed forms of its own.

## 0. Decide the set's kind first — it picks the pattern you copy

| Kind | Copy | Direction | Examples |
|---|---|---|---|
| **LTR alphabet** — whole letters, no Hebrew marks | Cyrillic (`.cyr` items in `project.letters`) | grid pinned `direction:ltr` | Latin, Cyrillic, Greek, Armenian |
| **RTL alphabet without Hebrew marks** | Phoenician (`.phn` items) or Imperial Aramaic (`.aram`), with the RTL rules in §3 | grid inherits the shared `direction:rtl` | Samaritan, Nabataean, Judeo-Arabic base letters (Paleo-Hebrew is done — it *is* the Phoenician set) |
| **Forms composed from the Hebrew letters** | Yiddish / Ladino / Specialized / Wide (`project.precomposed`) | RTL | a dotted form, a ligature, a wide variant |
| **Letters that take nikkud or trop** | not a glyph set — that is the Hebrew pipeline (`LETTERS`, anchors, QA, FEA); plan it as its own feature from the anchor sections of `font-maker.md` | | |

A composed-forms tab is a table of `{target, base, mark}` rows seeded into `project.precomposed` by
`ensurePrecompSeeded(FORMS, p)`, gated by one flag in `EXTRA_TAB_FLAG` (which feeds
`activeExtraTargets()` and `precompExportable`), rendered by `renderFormPanel(panelId, targets, intro)`,
exported by the precomposed passes of `buildFontSpec`, and listed in `qaRows()`; grep `addLadino` for its
eight sites. The rest of this file is the **alphabet** pattern, LTR or RTL.

## 1. Names — one stem, used everywhere

Pick a short stem and a category id, e.g. stem `cyr`, id `cyrillic` (English: `eng` / `english`).
Every identifier below derives from them, so a grep for the stem finds the whole set later:

- Data: `<STEM>_LETTERS` (`{cp, name, case?, group?}`; `cp` is an uppercase hex string — 4 digits in the BMP,
  5 or 6 above it; a caseless script omits `case` and everything keyed to it), `<STEM>_CPS`,
  `is<Stem>(cp)` (a `Set` — it runs per spacing-preview cell and per tile), `<stem>Meta(cp)`,
  `<stem>UserMade(l)`; item flags `.<stem>` + `.case` (+ `.<stem>Source = 'import'`).
- Flag: `project.font.add<Stem>Letters` (default `false` in `newProject()`); setter
  `setAdd<Stem>Letters(on)`; seeder `ensure<Stem>Seeded(p)`.
- UI: panel `data-cat="<id>"`, `#<id>Grid`, `#<id>Progress`, `#<stem>CaseUpper` / `#<stem>CaseLower`,
  `<stem>Case` + `set<Stem>Case(c)`, `render<Stem>Grid()`, `#add<Stem>LettersChk`, wizard boxes
  `#wiz<Stem>` and `#wizOs<Stem>` + `#wizOs<Stem>Hint`, template `data-fmact="tpl-<id>-pdf|png"`,
  `TEMPLATE_SPECS.<id>letters` with `kind:'<id>'`.
- Import: `fontCyrillicCoverage`-style `font<Stem>Coverage(font)`, `<STEM>_IMPORT_MIN`, `opts.<id>`,
  `opts.<stem>Mode`, the `ask<Stem>` modal.
- Strings (`locales/ui-strings.csv`, EN + HE): `fontmaker.panels.adv_<id>_label`, `adv_add_<id>`,
  `adv_<id>_hint` (html — no `{placeholder}`), `panels.<id>`, `<stem>_case_upper`, `<stem>_case_lower`,
  `<stem>_progress`, `<stem>_group_<g>` (one per section), `tabs.cat_<id>`, `canvas.section_<id>`,
  `canvas.tpl_<id>`, `modals.replace_<id>_title` / `replace_<id>_body.one` / `.other` /
  `keep_my_<id>` / `replace_<id>`, `status.import_loaded_<id>.one` / `.other`,
  `oswizard.<id>_hint_yes` / `_no`, and the release's `changelog.v<N>` row.

Letter names: `<char> + ' (<Script> <Unicode short name>, uppercase|lowercase)'`, e.g.
`'А (Cyrillic A, uppercase)'`. `gName()` slugs a name with `/[^a-z0-9]+/`, so a non-ASCII character
vanishes from the slug and a bare `'А (uppercase)'` would give every capital the same
`fontmaker.glyphname.uppercase` key; the short name keeps each slug unique. No `glyphname.*` CSV rows
are needed — the raw name is the fallback, as for English. Tiles show the character itself as
`.lt-name`.

## 2. The table — order is behaviour

`<STEM>_LETTERS` is built from an explicit table of `[upperCp, lowerCp, shortName]` rows per group
(explicit pairs, because case mapping is irregular: Ё 0401 ↔ ё 0451, Ґ 0490 ↔ ґ 0491). Emit the
**upper band first, then the lower band, each band group by group** in the set's alphabetical order.
That emitted order is `<STEM>_CPS`, and `<STEM>_CPS` is three things at once: the tile order
`render<Stem>Grid` lays out, the *Save letter & next* cycle (§4), and the printable template's box
order. Never sort one of them differently from the others.

Sections inside a band (Russian / Ukrainian & Belarusian / Serbian & Macedonian) are `group` values;
the grid appends one `<div class="punct-grp" data-i18n="fontmaker.panels.<stem>_group_<g>">` heading
inside the same `.letter-grid` whenever the group changes — `renderPunctGrid`'s idiom, no new CSS.
A set without sections has no `group` and no headings.

## 3. Direction rules — LTR and RTL sets differ in exactly these places

The shared `.letter-grid` is pinned `direction: rtl` for the Hebrew tiles and `.lt-heb` is
`direction: rtl` too. Everything else about direction follows from the script.

### LTR set (Latin, Cyrillic, Greek …)
- **Pin the grid**: `#<id>Grid { direction: ltr; }` beside the `#englishGrid, #cyrillicGrid` rule, and
  `#<id>Grid .punct-grp { direction: ltr; }` if it has section headings, so each heading sits with the
  list it starts instead of following the UI direction. Add the grid to the exception list in
  `CLAUDE.md` → *Internationalization* rule 5 (a later logical-CSS sweep would otherwise "fix" it).
- **Tiles**: the `.lt-heb` span gets inline `direction:ltr` and **no** `lang="he"`.
- **Bidi**: `bidiClassOf` returns `BIDI_L` for the set (`isEng(cell.cp) || isCyr(cell.cp) || is<Stem>(…)`).
  A letter left `BIDI_NEUTRAL` takes its neighbours' direction and reverses inside a mixed sample.
- **Specimen page**: `{ rtl: false, cols: 9, glyphPx: 38 }`. **Template**: add `kind === '<id>'` to the
  standalone list in `templateCellHTML` (no dotted circle).
- **Save letter & next** lands on the tile immediately to the **right**; the status dot sits top-left.

### RTL set (Samaritan, Paleo-Hebrew, Judeo-Arabic letters …)
- **Do not pin**: the grid inherits `direction: rtl`; do not add a `.punct-grp` override — the headings
  keep following the UI direction, as the Punctuation grid's do.
- **Tiles**: leave `.lt-heb` at its default direction; add `lang="<bcp47>"` on the span when the
  script has a tag (Hebrew tiles carry `lang="he"`), so a screen reader picks the right voice.
- **Bidi**: `bidiClassOf` returns `BIDI_R` for the set — add `is<Stem>(cell.cp)` to the Hebrew-block
  test. Kerning pairs stay in logical (reading) order; the FEA convention is direction-agnostic.
- **Specimen page**: `{ rtl: true, cols: 8, glyphPx: 44 }`, like the Hebrew add-on sections.
  **Template**: the same `kind` line as LTR — standalone glyph, no dotted circle.
- **Save letter & next** lands on the tile immediately to the **left**.
- **Marks**: an RTL set that must carry the Hebrew nikkud is the fourth row of §0, not this recipe.

### Both
- The step tabs and the two *Next: Nikkud →* buttons are hidden for the set (§4, rule 8): a set with
  no marks has no placement step, whichever way it reads.
- `updateStepTicks` nulls the placement tick; `_placementCycleCps` gets the mirror branch anyway.
- OS/2 code pages are derived from the shipped cmap in both exporters (§5) — never declared for a
  block the font does not carry.

## 4. Save & stay / Save letter & next — the contract

Both buttons live in `renderDrawStageBelow`: `drawCommit(false)` (stay) and `drawCommit(true)` (next)
→ `_drawCommitNow(advance)` → `drawAdvance()`, which walks `_drawCycleCps()` =
`tabDrawCps(_drawCatOf(curCp))` to the next glyph that is still to draw. A set behaves only when all
eight hold:

1. **`tabDrawCps('<id>')` returns `<STEM>_CPS` filtered to the items that exist with the flag** — the one
   enumerator (`drawCommitAll`, `drawPendingFor` and the Save-all badge read it too), in the table's
   order, which is the grid's reading order (§2).
2. **`_drawCatOf(cp)` returns `'<id>'` for every code point of the set**, tested right after the
   English line and before the wide / custom / punctuation fallbacks. Miss this and `tabDrawCps` gets
   `'letter'`, `indexOf` returns −1, and "next" walks the user back to alef.
3. **`catTabFor(kind, cp)` routes to `'<id>'`** in the same position (after English), so a click, an
   undo (`udNavTo`) and the advance all land on the same tab.
4. **`_selectItem` syncs the case band**: `if (kind === 'letter' && is<Stem>(cp)) { <stem>Case =
   <stem>Meta(cp).case; }` — the grid shows one case at a time, and without this a lowercase landing
   leaves the tile off-screen with nothing highlighted.
5. **The grid direction matches the script (§3)**, so the letter "next" lands on is the visual neighbour
   in reading direction — right for LTR, left for RTL. A cycle that disagrees with the tiles is the
   bug this whole section exists to prevent.
6. **The Save-all button** is the static
   `<button class="ctl-btn draw-save-all" data-cat="<id>" onclick="drawCommitAll('<id>')">` copied from
   the English panel (or `drawSaveAllBtnHTML('<id>')` in a JS-built panel); `syncDrawSaveAllBtns`
   finds it by `[data-cat]` and hides it when nothing is pending.
7. **`_placementCycleCps` gets the mirror branch** (`is<Stem>(curCp)` → the set's traced items) even
   though the set never enters the placement step — it keeps that precedence identical to `catTabFor`.
8. **No placement step**: add `is<Stem>(curCp)` to `_setWorkMode`'s anchors→align fallback (every
   writer of anchors mode passes through it — `gotoAnchors`, `qaJump`, `exportJumpToLetter`,
   `_selectItem`'s re-entry, the SVG-upload and font-import tails); in `updateTabs` hide `#tabAnchors`
   and `#tabTrop` for the set; null the tick in `updateStepTicks`; and add `&& !is<Stem>(l.codepoint)`
   to the two `_pT('next_nikkud'` buttons (`renderAlignStageBelow`, `renderTraceStageBelow`). The
   English-only accent branches (`templateGlyphSVG`, the stage caption, `attachAnchorDrag`,
   `renderAnchorLeft/Under/StageBelow`) then need no twin.

`drawAdvance` skips glyphs that already carry a non-stock outline and shows the generic
`fontmaker.draw.all_done_toast` when nothing is left; the last tile of the upper band wraps into the
lower band without leaving the tab.

**Verify with real clicks, not by reading the code** (the headless recipe in `ops.md`; serve on 8080,
abort every non-localhost origin, wait for the wizard gate, create the project through
`wizardCreate()` with the set's box ticked, assert 0 page errors):
- `JSON.stringify(tabDrawCps('<id>')) === JSON.stringify(<STEM>_CPS)`; `_drawCatOf(<first cp>) === '<id>'`.
- Give the first letter a stroke (`curLetter().draw = { v:1, strokes:[{ w:70, pr:0, pts:[[150,120,1],
  [450,120,1],[450,650,1],[150,650,1],[150,120,1]] }] }; renderStage(); renderControls();`), click
  `#stageBelow button[onclick="drawCommit(true)"]`, wait for `curCp` to change: it is the second
  letter, `catTab` is still `'<id>'`, and the `.ltile.sel` tile's box is the immediate neighbour of
  the first tile's box on the same row — greater x for LTR, smaller x for RTL.
- Repeat on that letter with `button[onclick="drawCommit(false)"]`: contours appear and `curCp` stays.
- Draw on the last upper-band letter and click next: the first lower-band letter, same tab, case
  switch flipped.
- Do it in both UI languages (`I18n.setLang('he')`) — the tile flow must not change with the UI.

## 5. Every other site — the checklist, in edit order

Anchor patterns are the English / Cyrillic lines to sit beside.

1. **Data** (§1–2), after `engSupportsAccents`; `add<Stem>Letters: false` in `newProject()`;
   `letterMeta(cp)` gains `|| <stem>Meta(cp)` (the single name hook: `curGlyphLabel`,
   `outOfRangeGlyphs`, `blankLetter` names).
2. **Settings cell** after the English one in the Settings panel (`data-cat="advanced"`): label,
   checkbox `onchange="setAdd<Stem>Letters(this.checked)"`, `data-i18n-html` hint with the two
   `data-fmact` template links; the `data-fmact` click dispatcher gains the two cases.
3. **Setter + seeder**: `setAdd<Stem>Letters` is the `setAddEnglishLetters` body (flag, `markDirty()`
   — never `udDo`, the toggle is not undoable; seed on; leave the editor with
   `selectItem('letter', LETTER_ORDER[0])` when unchecking on one of its letters; `renderGrids()`).
   Unchecking never deletes: the items stay and re-enabling shows them again.
4. **Panel** after the English panel: `<div class="panel collapsed cat-panel" data-cat="<id>">`, title span
   + `#<id>Progress`, the `.mode-toggle` case buttons, the Save-all button, `<div class="letter-grid"
   id="<id>Grid">`. **Grid**: `render<Stem>Grid()` = `renderEnglishGrid` minus the accent band (+ the
   section headings); hook it into `renderGrids()` **and** the tail of `renderLetterGrid()`.
5. **Tab bar** `renderCatTabs()`: sync `#add<Stem>LettersChk` from the flag; `NAMES.<id>`; a splice at
   `cats.indexOf('punct') + 1` — later splices land **earlier** on screen, so the line's position sets
   the order (Cyrillic's sits between the customglyphs and english splices to read … English, Cyrillic,
   Custom glyphs …).
6. **Routing / cycling / step tabs**: §4.
7. **Export** `buildFontSpec`: a base pass after the Cyrillic one (`gname` — `uni` + 4 hex digits in the BMP,
   `u` + 5–6 above it, AGL's rule, which `gname()` already branches on by `cp.length`; skip when a
   custom glyph already owns the name, `glyphOrder` + `baseGlyphNames` + `cmap`); `fontInkBounds`
   folds the set's ink into the clip box (descenders clip in Word otherwise); the fidelity filter
   gains `!l.<stem>`. OS/2: the TTF builder derives `ulCodePageRange1` from `spec["cmap"]` and the
   UFO's `openTypeOS2CodePageRanges` from `spec.cmap` — extend the range test for the new block only
   if Windows has a code page for it (bit 0 cp1252 Latin-1, 1 cp1250 Latin-2, 2 cp1251 Cyrillic,
   3 cp1253 Greek, 4 cp1254 Turkish, 5 cp1255 Hebrew, 6 cp1256 Arabic, 7 cp1257 Baltic, 8 cp1258
   Vietnamese); `ulUnicodeRange` is recalculated from the cmap by itself — SMP bits and bit 57 (Non-Plane 0)
   included, so a set **above the BMP** declares nothing by hand, and fontTools adds the (3,10) format-12
   cmap subtable on its own once a key passes 0xFFFF. Verify both on the exported bytes, not by reading the
   code: the `recalcUnicodeRanges` call sits behind a bare `except: pass`, and a format-4-only font fails
   only at render time, as tofu. Do not assume the block *has* a bit: the OS/2 v4 table was frozen before
   Unicode 5.2, so Phoenician gets bit 58 but Imperial Aramaic gets only bit 57 (Non-Plane 0) — a check
   expecting an Aramaic bit fails a perfectly good font. Glyph naming, the FEA
   (`DFLT` + `hebr` only), kerning and the UFO `.glif` writer need nothing.
8. **Persistence** `migrateProject`: the preservation guard `(l.custom || l.eng || l.cyr || l.<stem> ||
   l.wideGlyph)`; a hygiene block after the `.cyr` one (drop unless the code point is a string in the
   set — a junk one becomes `cmap[NaN]` and fails the whole export; normalise `case`; close
   `<stem>Source` to `'import'`; backfill `name`); `&& !l.<stem>` on the wide-form line; the flag
   backfill `== null → false` and `ensure<Stem>Seeded(data)` when on (this is also what grows an old
   project's tab when the table gains a letter).
9. **Font import**: `font<Stem>Coverage`, `<STEM>_IMPORT_MIN = 20`, `<stem>Risk` + `ask<Stem>` chained
   after `askCyr` (`askEng(() => askCyr(() => ask<Stem>(run)))` at both call sites), the Hebrew
   "existing" count excludes `!x.<stem>`, the import block after the Cyrillic one (flag on, seed,
   `importLetterOutline` per seeded letter, `keepMine` skips user-made ones, stamp `<stem>Source`),
   the toast and the `no_hebrew_body` append.
10. **Wizards**: `#wiz<Stem>` under *Extra alphabets* (reset list in `wizardOpen`, read + `if (x)
    setAdd<Stem>Letters(true)` in `wizardCreate` — through the real setter, never a direct flag write);
    `#wizOs<Stem>` + `#wizOs<Stem>Hint` (key swapped by coverage in `wizardOsPrefill`), read in
    `wizardOsFinish`, passed as `<id>: x` in the `applyFontImport` opts.
11. **Preview PDF**: a specimen section after the Cyrillic one (§3 for `rtl`). **Template**:
    `TEMPLATE_SPECS.<id>letters` (`title` stays English — it is the filename stem; `cols × rowsPerPage`
    decides pages) + the `templateCellHTML` kind line. **Help → Download Templates**: a row with the
    PDF / Picture buttons and the page count in the multi-page tip (authored English HTML inside a
    template literal: no raw backtick, `${` or `</script>`), and the same count in the
    `fontmaker.help.body_templates` prose (EN + HE).
12. **i18n**: the rows of §1 beside their English siblings; `node scripts/build-locales.js`;
    `node scripts/check-i18n.js` must stay clean (the hint cell is quoted with doubled inner quotes;
    the plural pairs carry `.one`/`.other`).
13. **Release**: bump `FONT_MAKER_VERSION`, one combined `<li>` at the top of `HELP_CONTENT.about`
    **and** the matching `fontmaker.changelog.v<N>` CSV row (EN + HE) with `CUR_KEY` moved and the
    previous version prepended to `CHANGELOG_ORDER`; bump `VERSION` in `sw.js`; a sentence in
    `font-maker.md`'s "Not every letter is a Hebrew letter" paragraph; for an LTR set, the grid id in
    `CLAUDE.md`'s direction-pin list. `node --experimental-vm-modules scripts/check-inline-js.mjs`.

## 6. Definition of done for a glyph set

- [ ] The grep census: every `isCyr(` / `.cyr` / `addCyrillicLetters` / `CYRILLIC_` site has a twin
      (English's extra accent sites excepted), and the counts per stem are within one of Cyrillic's.
- [ ] Both wizards and the Settings checkbox enable it; unchecking hides the tab and keeps the letters.
- [ ] The grid flows in the script's direction in **both** UI languages; section headings sit where §3 says.
- [ ] §4's real-click verification passes: next = the neighbour tile in reading direction, stay stays,
      the band wraps, `tabDrawCps` equals the table.
- [ ] `buildFontSpec()` ships the traced letters and nothing when the flag is off; the code-page lists
      change only when the set's block is in the cmap.
- [ ] `bidiOrder` keeps a word of the set in reading order beside Hebrew.
- [ ] A save/reload round trip keeps the letters, the flag and the outlines; a junk item is dropped.
- [ ] `check-i18n`, `check-inline-js`, `build-locales` clean; light + dark, 1280 + 800 px, EN + HE
      screenshots; `sw.js` and `FONT_MAKER_VERSION` bumped with one combined changelog entry.
