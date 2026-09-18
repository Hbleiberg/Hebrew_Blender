# Hebrew Blend Generator — reference

> Binding rules live in `CLAUDE.md`; this file is how the generator's selectors and worksheet build work.

## Letter Selector (`hebrew_blend_generator.html`)

### CSS

```css
/* Control buttons row above the grid */
.letter-controls { display: flex; gap: 6px; margin-bottom: 10px; }

/* Small action buttons (All, None, No Sofit, Dagesh Tav checkbox) */
.btn-xs {
  font-size: 0.72rem; padding: 3px 8px;
  border: 1px solid var(--border); border-radius: 4px;
  background: var(--white); cursor: pointer;
  font-family: inherit; color: var(--navy); transition: background 0.15s;
}
.btn-xs:hover { background: var(--warm-gray); }

/* Main blend grid — 5 columns RTL */
.letter-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; direction: rtl; }

/* Letter tile */
.letter-tile {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  padding: 5px 3px; border: 1px solid var(--border); border-radius: 5px;
  cursor: pointer; transition: all 0.15s; user-select: none; background: var(--white);
}
.letter-tile:hover    { border-color: var(--gold); }
.letter-tile.selected { background: var(--navy); border-color: var(--navy); color: var(--white); }
.letter-tile .heb  { font-size: 1.2rem; font-family: var(--heb-font); direction: rtl; }
.letter-tile .name { font-size: 0.55rem; text-align: center; line-height: 1.2; opacity: 0.75; direction: ltr; }

/* Dark mode */
body.dark .letter-tile          { background: #1e2535; border-color: var(--border); color: #dde4f0; }
body.dark .letter-tile.selected { background: #2a4070; border-color: #4a6aaa; }
body.dark .letter-tile:hover    { border-color: var(--gold); }

/* Real-word grid (6 cols) and lock grids (5 cols) use .rw-letter-tile / .lock-letter-tile
   with the same selected/hover/dark rules but slightly smaller font-sizes (1rem / 0.95rem) */
@media (max-width: 700px) { .letter-grid { grid-template-columns: repeat(4, 1fr); } }
```

### HTML structure

```html
<div class="letter-controls">
  <button class="btn-xs" onclick="selectAllLetters()">All</button>
  <button class="btn-xs" onclick="clearAllLetters()">None</button>
  <button class="btn-xs" onclick="selectNoSofit()">No Sofit</button>
  <label class="btn-xs" style="display:flex;align-items:center;gap:5px;cursor:pointer;">
    <input type="checkbox" id="dageshTavToggle" onchange="setDageshTav(this.checked)"
      style="accent-color:var(--gold);width:13px;height:13px;">
    Dagesh Tav / Sav
  </label>
</div>
<div class="letter-grid" id="letterGrid"></div>
```

Each tile is generated dynamically:
```html
<div class="letter-tile [selected]" data-heb="[CHAR]">
  <span class="heb">[CHAR]</span>
  <span class="name">[name]</span>       <!-- e.g. "Alef", "Kaf sofit" -->
</div>
```

Sofit letters are rendered as sibling tiles immediately after their base letter tile, with `.name` text `"[name] sofit"`.

### Key JS functions

| Function | What it does |
|---|---|
| `initLetters()` | Builds the grid; skips vav-variants, normalTav/dageshTav depending on `dageshTavEnabled` |
| `toggleLetter(heb, el)` | Adds/removes from `selectedLetters` Set; toggles `.selected` class |
| `selectAllLetters()` | Selects all non-sofit + all sofit letters |
| `clearAllLetters()` | Clears `selectedLetters`; removes all `.selected` |
| `selectNoSofit()` | Selects all base letters, deselects sofits |
| `setDageshTav(bool)` | Swaps tav ת ↔ dagesh-tav תּ + sav in all grids; calls `initLetters()` |
| `updateCombosCount()` | Recalculates possible combinations and updates `#combosCount` display |

### State
```js
let dageshTavEnabled = false;
let selectedLetters  = new Set(/* all letters except dageshTav/savVariant */);
```

---

## Vowel Selector (`hebrew_blend_generator.html`)

### VOWEL_GROUPS data structure

Each group defines one colored collapsible box:
```js
{
  key: 'aqua',                          // identifier
  sound: 'AH',                          // phonetic label in header
  colorName: 'Aqua',
  colorHtml: '<u>A</u>qua',            // header color label (underlined first letter)
  label: 'AH sound',
  bg: 'rgba(0,180,210,0.18)',           // light mode section background
  border: '#00b4d2',                    // light mode border + header text color
  darkBg: 'rgba(0,160,190,0.25)',       // dark mode background
  darkBorder: '#00c4e0',                // dark mode border + header text color
  vowels: [
    { key:'a',      label:'Kamatz',       sub:'AH sound', nikud:'אָ', isMain:true  },
    { key:'patah',  label:'Patach',       sub:'AH sound', nikud:'אַ', isMain:true  },
    { key:'hpatah', label:'Hataf Patach', sub:'short AH', nikud:'אֲ', isMain:false },
    { key:'hkamatz',label:'Hataf Kamatz', sub:'short AH', nikud:'אֳ', isMain:false },
  ]
}
```

Seven groups: `aqua` (AH), `red` (EH), `grey` (EY/Tzere), `green` (EE), `yellow` (OH), `blue` (OO), `purple` (Shva).

### CSS

```css
.vowel-grid { display: flex; flex-direction: column; gap: 0; }

/* Each group section — background/border set inline from group data */
.vowel-group-section { transition: background 0.15s; }

/* 2-column chip grid inside each section */
.vowel-group-chips { display: grid; grid-template-columns: 1fr 1fr; }

/* Individual vowel chip (label wrapping checkbox + text) */
.vowel-chip {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.78rem; cursor: pointer; user-select: none;
  padding: 4px; border-radius: 4px; transition: background 0.15s;
}
.vowel-chip:hover { background: var(--warm-gray); }
.vowel-chip input { accent-color: var(--gold); width: 14px; height: 14px; cursor: pointer; }

body.dark .vowel-chip       { color: #dde4f0; }
body.dark .vowel-chip:hover { background: rgba(255,255,255,0.06); }
```

### HTML structure (dynamically generated per group)

```html
<div class="vowel-group-section" data-group="aqua"
     style="background:rgba(0,180,210,0.18); border:1.5px solid #00b4d2; border-radius:6px; padding:5px 7px; margin-bottom:4px;">

  <!-- Collapsible header — click toggles chipsWrap visibility, rotates arrow -->
  <div style="font-size:0.68rem; font-weight:700; letter-spacing:0.04em; color:#00b4d2;
              display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
    <span>AH Sound – <u>A</u>qua</span>
    <span class="vg-arrow" style="font-size:0.75rem; transition:transform 0.2s;">▾</span>
  </div>

  <!-- Vowel chips grid (hidden when collapsed; arrow rotates -90deg) -->
  <div class="vowel-group-chips">
    <label class="vowel-chip" data-key="a">
      <input type="checkbox" onchange="toggleVowel('a', this.checked)">
      <span style="display:flex; align-items:center; gap:6px;">
        <span style="font-family:var(--heb-font); font-size:1.4rem; direction:rtl; min-width:24px; text-align:center;">אָ</span>
        <span><strong>Kamatz</strong><br><span style="color:var(--muted); font-size:0.72rem;">AH sound</span></span>
      </span>
    </label>
    <!-- …more chips -->
  </div>
</div>
```

### Controls above the grid

```html
<div style="display:flex; gap:5px; margin-bottom:8px;">
  <button class="btn-xs" onclick="setAllVowels(true)">All</button>
  <button class="btn-xs" onclick="setMainVowels()">Main</button>
  <button class="btn-xs" onclick="setAllVowels(false)">None</button>
</div>
```

### vcholam / shuruk "Count as letter" toggle

Shown only when vcholam (`וֹ`) or shuruk (`וּ`) is selected:
```html
<div id="vavAsLetterRow" style="display:none; margin-top:10px; border-top:1px solid var(--border); padding-top:8px;">
  <label style="display:flex; align-items:center; gap:6px; font-size:0.78rem; cursor:pointer;">
    <input type="checkbox" id="vavAsLetterCheck" onchange="setVavAsLetter(this.checked)" checked
      style="accent-color:var(--gold); width:13px; height:13px;">
    Count <span style="font-family:var(--heb-font); direction:rtl;">וֹ/וּ</span> as a letter
    <!-- tooltip explaining standalone vav vs. vowel-marker behavior -->
  </label>
</div>
```

### Key JS functions

| Function | What it does |
|---|---|
| `initVowels()` | Builds all group sections + chip checkboxes dynamically; wires collapse toggle |
| `toggleVowel(key, checked)` | Updates `selectedVowels` Set; calls `updateCombosCount()` + `updateVavAsLetterVisibility()` |
| `setAllVowels(bool)` | Adds/removes all vowel keys; syncs all checkboxes |
| `setMainVowels()` | Selects only vowels with `isMain:true` |
| `setVavAsLetter(val)` | Sets `vavAsLetter` bool (affects blend generation) |
| `updateVavAsLetterVisibility()` | Shows `#vavAsLetterRow` only when vcholam or shuruk is selected |
| `refreshVowelGroupColors()` | Re-applies group bg/border colors after dark-mode toggle |

### State
```js
let selectedVowels = new Set(/* MAIN_VOWEL_KEYS by default */);
let vavAsLetter    = true;
```

---

## Worksheet Chunked Build (`hebrew_blend_generator.html`)

Large Class-Set standard-blend builds (> ~600 cells) are **chunked**: `renderWorksheet` builds
version 0 synchronously, then streams the remaining versions in `setTimeout(0)` chunks
(`_wsBuildQueue`/`_wsBuildToken`/`_wsBuildTimer`/`_wsBuildAnchor`, defined just above
`renderWorksheet`). Small/single-version worksheets remain fully synchronous. Contract rules:

- **Reading `#worksheet` right after triggering a render?** Call **`flushWorksheetBuild()`** first —
  it synchronously finishes any in-flight build. Already wired: the `beforeprint` listener (covers
  both print buttons + Ctrl+P), `exportPDF`, and `liveGenerate`'s rollback snapshot.
- **Writing `#worksheet.innerHTML` outside `renderWorksheet`?** The connectivity sentinel
  (`_wsBuildAnchor`) makes pending chunks self-cancel when a foreign render replaces the worksheet —
  but a new writer *should* still call **`cancelWorksheetBuild()`** explicitly (belt-and-braces;
  `renderWorksheet` itself cancels at the top).
- The queued thunks read live control state (QR toggle, title, header language, dagesh toggle) at
  **execution** time; every such control currently re-renders via `renderWorksheet` on change (which
  cancels the build). Keep that invariant for any new control those builders read.
- Headless verification must **poll** for the final `.sheet` count (or `_wsBuildQueue.length === 0`)
  after a large-class-set Generate — never count synchronously.

---

## Page count under Print / Export PDF (`updatePrintCount`)

Print and Export PDF both send one page per `.sheet` (student sheets, `.answer-key-sheet`, tracing
pages), `.bingo-page` and `.caller-sheet` — the same units `exportPDF` captures — so `#printCount`
(the live region under the sidebar's Print / PDF buttons) and `#genFabCount` (its `aria-hidden` twin
on the frozen footer, wrapped onto its own line) say how many pages a click will send before it
happens. The count is not called from the renderers: one `MutationObserver` on `#worksheet`'s child
list (every page unit is a direct child; the tracing probe sheet is appended and removed in the same
task) coalesces to a frame and re-counts, which is what keeps it right through a presentation-only
re-render (Answer Key on/off) and the chunked Class Set pump that appends sheets after
`enableButtons()` already ran. Zero units (the empty state, before the first Generate) hides both
hosts; `applyI18n()` re-renders the text on a language switch. The sidebar's `padding-bottom` and
the mobile `.main-content` padding reserve the footer's taller post-Generate height.

---

## Settings restore guard

`applySettings()` keeps only known letter/vowel keys (`isKnownLetterKey`/`isKnownVowelKey`, built from `LETTERS` heb + sofit and `VOWELS` keys) when it rebuilds `selectedLetters`/`selectedVowels`; unknown members from a share link, preset or `.ivrit` file are dropped one by one, never the whole set, so `getLetter()` can't return undefined inside `generate()`.

The same guard applies per value: every `<select>` restores through `applySelectValue(id, v)` (only an option the select offers), every number/range input through `applyNumberValue(id, v)` (finite numbers only), and every button-row enum (`npGender`, `npDisplay`, `rwStarPage`, `traceLineStyle`, `cwClueLang`, `matchTarget`, `rwDrillType`…) through `isOffered(v, list | rowSelector, dataKey)`, which reads the allowed set from the row's own `data-*` attributes so a new button is covered without a second list. An unoffered value leaves the current pick; nothing is written to the control as `""` or `NaN`, so the remembered setup never saves garbage back. `setHebFontSize(val)` (called directly by presets and the shared `hebrewBlender_hebFontSize` key) clamps to 0–100 and falls back to 50 for a non-finite value. Keep the legacy `colorCodingMode` migration ahead of its check.

**What this device cannot show still travels through it.** A restore records each value the guards above could not apply in `_unapplied` (`field → { value, live }`, `live` = the control's own value at that moment, filled in at the end of `applySettings`); `rememberSetup()` overlays `value` onto the remembered setup as long as the control still reads `live` (untouched since), so a setup synced from another device — a select option or an enum this build does not offer — goes back up unchanged, and a deliberate change here wins. The same rule for fonts: `setHebFont(name)` with a name this device lacks (a My Font made elsewhere) keeps the choice — writes `hebrewBlender_hebFont` when asked, highlights no `.font-opt`, leaves the CSS face — and, once `refreshMyFonts()` has answered (`_myFontsLoaded`), names it in `#hebFontMissing` (`shared.fonts.missing_note`). Saved word lists travel by **id** (`selectedWordListIds`, kept as given whether or not the list is here yet; the picker renders what exists and the pool skips the rest) with the names beside them: `wlNamesForSetup()` emits the names the last applied setup carried, verbatim, while the selection is unchanged (`_wlAppliedNames`), else resolves them afresh; an older blob with names only is resolved through `wlNameIndex()`.

**The remembered setup (`hebrewBlender_lastState`).** `rememberSetup(force)` writes nothing on a `?ak=` load (`_answerKeyView`: the answer-key view has a pristine sidebar) and nothing while a setup the page could not apply is *held* (`_lastSetupHeld`, set by `restoreLastSetup()` instead of deleting the key) unless forced — `generate()` and a restored `.ivrit` file force, the `pagehide` save and the cloud module's flush do not. A pristine setup is the absence of a setup: with no key stored and every control at `SHARE_DEFAULTS`, nothing is written, so *Start fresh* leaves no blank setup behind to be synced over a real one (signed in, its tooltip `worksheet.lastsetup.start_fresh_title_cloud` says the account's copy stays). A honoured `?s=` or `?wl=` link is stripped from the address bar (`_stripShareParams()`, the other params kept) once applied, so a reload reopens the remembered setup instead of replaying the link; *Copy link* still mirrors the current setup into the bar.

---

## Worksheet header — the Name / Date line

`wsMetaHTML()` is the single source of the `Name: ___ Date: ___` block (English or עברית after
`headerLang`), called from every sheet builder's header template and from the tracing probe — bingo
cards and caller sheets never carried it. The Layout panel's *Name / Date line* toggle
(`#nameDateToggle`, default on) is its one gate, read live so the chunked Class Set thunks follow it;
off, the function returns `''` and `.ws-header` (flex, space-between) keeps just the title block.
`toggleNameDate(on)` re-renders in place through `rerenderCurrentSheet()` when a `.sheet` exists; the
setting travels as `showNameDate` (getSettings → presets, the remembered setup, `.ivrit`, `?s=`, the
cloud row) and is a `LIVE_PRESENTATION_KEYS` member (same items, no reshuffle); a blob without the key
leaves the line on.

---

## Practice-type subtitle (`#headerSub`)

The worksheet header's subtitle is static markup (`data-i18n="worksheet.header_sub"`). `setBlendType(type)` overwrites it with a per-type line from the CSV (`worksheet.header_sub_two` / `_one` / `_three` / `_nikud`) through `I18n.t`, only once the locale has loaded (an unresolved key leaves the static line in place). `applyI18n()` re-applies the static key, so a language switch shows the generic subtitle until the next type click — a known two-slot quirk, kept until the maintainer picks one wording.

---

## PDF export (`exportPDF`)

Each `.sheet` (or `.bingo-page` / `.caller-sheet`) is captured with html2canvas at `scale: 2` and placed with
one `pdf.addImage(..., undefined, 'FAST')` per page. **The `'FAST'` compression argument is required** —
without it jsPDF stores the decoded raster raw (~10 MB per page, 107 MB for an 8-card bingo set). Bingo
cut lines are drawn as vector primitives after the image, at positions measured from the captured canvas.
The capture itself is synchronous and costs ~0.3–1 s of main thread per page; the button reads
"Generating…" for the duration.
