# Hebrew Blender — Claude Instructions

## Git
- Always commit and push directly to `main`
- Do not create feature branches

## Import / Export All Settings (`index.html`)

`index.html` has a gear button that opens a modal with **Export All Settings**, **Import All Settings**, and **Erase All Settings**. These functions bundle every tool's localStorage data into a single JSON blob so users can back up and restore everything in one step.

### Current localStorage keys included

| Blob key | localStorage key | What it holds |
|---|---|---|
| `generatorPresets` | `hebrewBlender_presets` | Hebrew Blend Generator saved presets |
| `dashboardPresets` | `hebrewDashboard_presets` | Classroom Dashboard saved presets |
| `dashboardSchedules` | `hebrewDashboard_schedules` | Classroom Dashboard saved schedules |
| `dashboardSettings` | `hebrewDashboard_settings` | All Classroom Dashboard settings (zoom, video URL, header size, Jewish-calendar widget toggles `showHolidayCountdown`/`showShabbatTimes` (Shabbat times reuse the weather `location`), Timer toggles `showTimer`/`showTimerFullscreen`, Omer toggles `showOmerCounter`/`showOmerEnglish`/`showOmerProgress`, etc.) |
| `flashCardPresets` | `hebrewFlashCards_presets` | Flash Cards saved presets |
| `flashCardPbStreak` | `hebrewFlashCards_pbStreak` | Flash Cards personal-best streak (scalar string; imported as the **max** of existing vs incoming) |
| `dictAudioEnabled` / `dictTranslitStyle` / `dictTtsRate` / `dictEmojiSettings` | `hebrewDictionary_*` | Hebrew Dictionary settings |
| `torahTrainerSettings` | `hebrewTorahTrainer_settings` | Torah Trainer settings |
| `inputMode` | `hebrewBlender_inputMode` | Backup UI preference: `'auto'` (.ivrit file) or `'manual'` (text block) — see ".ivrit Save Files" below |

### Rule: any new tool with persistent data must be added here

When a new tool is added to this site that saves **any** data to `localStorage`, its key(s) must be added to all three functions in `index.html`:

**`exportAllSettings`** — add one entry to the blob object:
```js
myToolPresets: JSON.parse(localStorage.getItem('hebrewMyTool_presets') || '{}'),
```

**`importAllSettings`** — add a corresponding merge block:
```js
if (parsed.myToolPresets) {
  const existing = JSON.parse(localStorage.getItem('hebrewMyTool_presets') || '{}');
  localStorage.setItem('hebrewMyTool_presets', JSON.stringify(Object.assign(existing, parsed.myToolPresets)));
}
```
Use `Object.assign` so importing merges with existing data rather than wiping it. If a key holds a flat settings object (not a presets map), use `Object.assign` the same way — the imported values overwrite the existing ones field-by-field.

**`eraseAllSettings`** — add the key to the array:
```js
'hebrewMyTool_presets',
```

### Naming convention for localStorage keys

Follow the existing pattern: `hebrew<ToolCamelCase>_<dataType>`.

Examples:
- `hebrewBlender_presets` — Generator presets
- `hebrewDashboard_presets` — Dashboard presets
- `hebrewDashboard_settings` — Dashboard settings blob
- `hebrewDashboard_schedules` — Dashboard schedules

---

## .ivrit Save Files (Automatic Input) — **REQUIRED on every tool with presets/settings**

Users back up and restore via a downloadable **`.ivrit` file** (a plain JSON text file with a custom extension) — a portable "save file" they keep on their own computer. This is the **default, preferred** backup mechanism going forward. Every tool's backup area has an **Automatic Input / Manual Input** toggle at the top:

- **Automatic Input** (default) — a *Save to .ivrit file* button plus a drag-and-drop / browse zone for restoring. **This is the norm — build it into every new tool.**
- **Manual Input** — the legacy copy-and-paste textarea (kept for users who already have text backups).

The toggle choice is remembered site-wide in `localStorage['hebrewBlender_inputMode']` (`'auto'` | `'manual'`).

Implemented on: `hebrew_blend_generator.html` (tool `Worksheet`), `classroom_dashboard.html` (`Dashboard`), `flash_cards.html` (`FlashCards`), and `index.html` (`AllTools`). The Dictionary and Torah Trainer have no presets of their own — their settings are backed up **only** through the `AllTools` file on `index.html`.

### File format

```jsonc
{
  "_ivritSuite": 1,
  "format": "ivrit-save",     // gate: anything else is rejected
  "version": 1,
  "tool": "Worksheet",        // tool identity — survives the user renaming the file
  "savedAt": "2026-05-30T...",// ISO timestamp
  "data": { /* presets + liveState, or the AllTools bundle */ }
}
```

- **Filename**: `<Month>_<Day>_<Year>_<Tool>.ivrit` — e.g. `May_30_2026_Worksheet.ivrit`, `August_15_1994_Dashboard.ivrit`, `April_27_2008_AllTools.ivrit`. Built by `ivritDateStamp()` + `IVRIT_CFG.tool`.
- **`tool` is the source of truth**, NOT the filename. On import, the embedded `tool` is compared to the page's `IVRIT_CFG.tool`; a mismatch warns the user before proceeding (an `AllTools` file is accepted on any page; single-tool files are accepted on the matching page). This is why the tool name lives *inside* the file.
- A single-tool `data` holds **both** `presets` (the full named-preset collection) **and** `liveState` (the result of `getSettings()` — the current on-screen configuration). The `AllTools` `data` holds the same bundle object as `exportAllSettings`.

### Import behavior — always **ask Merge vs Replace**

`ivritRestore()` shows a small modal (`ivritAskMode()`) on every import:
- **Merge** — keep current data, add the file's (matching keys overwritten via `Object.assign`).
- **Replace** — clear current data first, then load only the file's.

### Pattern: per-file `IVRIT_CFG` + shared engine

Each file defines a small **`IVRIT_CFG`** object, then pastes the **shared engine** verbatim (the block between the `═══ IvritSuite .ivrit save-file engine ═══` comment markers — it is byte-for-byte identical across all files; copy it, don't rewrite it).

```js
const IVRIT_CFG = {
  tool: 'MyTool',                 // also becomes the filename suffix + embedded tag
  gather() {                      // what a Save writes
    return {
      presets: JSON.parse(localStorage.getItem('hebrewMyTool_presets') || '{}'),
      liveState: getSettings()    // current controls — see Preset Save/Restore rule below
    };
  },
  apply(data, mode) {             // what a Restore does; mode is 'merge' | 'replace'
    const incoming = data.presets || data.myToolPresets; // also accept an AllTools bundle key
    if (incoming) {
      const base = mode === 'replace' ? {} : JSON.parse(localStorage.getItem('hebrewMyTool_presets') || '{}');
      localStorage.setItem('hebrewMyTool_presets', JSON.stringify(Object.assign(base, incoming)));
      renderPresets();
    }
    if (data.liveState) applySettings(data.liveState);
  }
  // needsReload: true  → set this if there is no clean live re-apply path; the engine then skips the success alert and you reload in apply()
};
```

The shared engine provides: `ivritDateStamp`, `ivritStatus`, `setIvritMode`, `ivritSaveFile`, `ivritAskMode`, `ivritToolMismatch`, `ivritRestore`, `ivritReadFile`, `ivritInit` (auto-runs on DOM ready). It depends only on `IVRIT_CFG` and the standard UI element IDs.

### Required UI markup (in the backup area)

The shared `.ivrit-*` CSS block (with `var(..., fallback)` colors so it works on any page) + the toggle + `#ivritAuto` (Save button, `#ivritDrop`, `#ivritFileInput`, `#ivritStatus`) + `#ivritManual` (the legacy textarea, `display:none` by default). Copy an existing page's markup (e.g. the Generator's "Backup Presets" sub-panel).

### Rules for new tools / new options

1. **Every new tool that saves presets or settings MUST implement this** (toggle + `IVRIT_CFG` + shared engine + UI markup) and register its key(s) in the `index.html` AllTools functions (see section above).
2. **Anything captured by `getSettings()` is automatically saved in the `.ivrit` file** via `liveState` — so the Preset Save/Restore rule below (add every new control to `getSettings()`/`applySettings()`) is also what keeps `.ivrit` files complete. New options need no extra `.ivrit` wiring beyond that.

---

## Preset Save/Restore
Whenever a new UI control is added to `hebrew_blend_generator.html`, it must be included in both:
- `getSettings()` — serialize the control's current value
- `applySettings()` — restore the value and call any related UI toggle functions (e.g. `toggleGematriaMode()`, `toggleCwBlendOpts()`) so dependent rows update correctly

Because `.ivrit` save files store `liveState = getSettings()`, keeping `getSettings()`/`applySettings()` complete is what makes both presets **and** `.ivrit` files capture every control. No separate `.ivrit` step is needed per control.

---

## Preset Lists — Nested Folders (file tree)

All six saved-item lists are organized by a **nested folder tree** with drag-and-drop and a
touch-friendly **"Move ▾"** menu, via one shared component:

- Generator presets, Flash Cards presets, Flash Cards profiles, Dashboard presets, Dashboard
  saved schedules. (Flash Cards' active-profile dropdown stays a flat list.)

### Sidecar overlay model — never restructure the stores
The item store stays a flat `{name:...}` object and is the **source of truth for which items
exist**. Folders live in a SEPARATE per-list localStorage key as a tree that *references items by
name*. This keeps existing presets, `.ivrit` files, Teacher Share Code, and `DEFAULT_PRESET`
seeding working untouched. Tree shape:
```jsonc
{ "v":1, "root":[ {"t":"item","name":"X"},
                  {"t":"folder","id":"f_ab12","name":"Unit 1","collapsed":false,"children":[ ... ]} ] }
```
Five folder keys (naming `hebrew<Tool>_<thing>Folders`): `hebrewBlender_presetsFolders`,
`hebrewFlashCards_presetsFolders`, `hebrewFlashCards_profilesFolders`,
`hebrewDashboard_presetsFolders`, `hebrewDashboard_schedulesFolders`.

### Shared component (one byte-identical block per file, like the `.ivrit` engine)
Marked `/* ═══ IvritSuite folder-tree component (shared, identical across pages) ═══ */` (JS) plus a
matching `.ft-*` CSS block. Entry point:
```js
mountFolderTree({ treeKey, container, listItemNames(), buildItemRow(name)→actionButtonsDOM, noun, onAfterChange? })
```
- `syncTree(tree, names)` runs on every render: prunes item nodes whose name left the store, dedupes
  (first occurrence wins), repairs folder ids/fields, appends new store names at root. Store↔tree
  stays consistent automatically — so a renamed/deleted/imported preset just re-surfaces at root.
- Items reuse the existing `.preset-item` styling; folders use `.ft-folder*`. All names render via
  `textContent` (XSS-safe — no inline `onclick` interpolation).
- DnD = reorder + drop-into-folder (modeled as pure tree transforms then full re-render; a folder
  can't drop into itself/a descendant). The **Move ▾ menu** (`ftPaths` → Root + every folder
  breadcrumb) is the authoritative path and the only one that works on touch (HTML5 DnD doesn't
  fire on touch). The menu is appended to `<body>` with `position:fixed` so it escapes any
  `overflow:hidden` panel (e.g. the dashboard settings drawer).
- Folder CRUD: New folder / New subfolder / Rename (`prompt`) / Delete (`confirm`; children move up
  — underlying items are NEVER deleted). Collapse state lives on the folder node (persists + backs up).

### Rule for any new preset-bearing list
1. Render it with `mountFolderTree(cfg)` (don't hand-roll rows; reuse the existing action functions
   in `buildItemRow`). The old `makeSortable` is superseded for foldered lists (kept only for the
   dashboard's live schedule-builder rows).
2. Register its folder key in **`index.html`** all three functions (`exportAllSettings` +
   `importAllSettings` via `ftImportTree(key, incoming, false)` + `eraseAllSettings`) AND the AllTools
   `IVRIT_CFG.gather/apply`.
3. Add the key to the tool's own `IVRIT_CFG.gather()`/`apply()` (gather via `ftRead`, apply via
   `ftImportTree(key, incoming, mode==='replace')`) so folders travel with the tool's `.ivrit`.
   **Never `Object.assign` a tree** — that clobbers `root`; always go through `ftImportTree`.
4. Give each item a **Duplicate (⧉)** button. The per-tool `duplicate<Thing>(name)` deep-copies the
   stored value under `ftDuplicateName(name, existsFn)` (file-system style: "X" → "X 1" → "X 2"; the
   trailing number is the base for the next free one), then places the copy right after the original
   in the same folder via `ftInsertAfter(treeKey, name, newName)`, then re-renders. It's additive, so
   no `confirm`. `ftDuplicateName`/`ftInsertAfter` live in the shared folder-tree block.

## Preset Lists — Drag-to-Reorder (superseded for the six foldered lists above)

Every preset list (`.preset-list` / `.saved-schedule-list`) must support drag-to-reorder. Use the shared `makeSortable` helper defined in each file.

### Pattern

**CSS** (same block in both files):
```css
.drag-handle { cursor: grab; color: var(--muted); font-size: 0.85rem; padding: 0 2px; flex-shrink: 0; line-height: 1; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.preset-item.drag-over { border-color: var(--gold); background: rgba(201,146,42,0.08); }
.preset-item.dragging  { opacity: 0.4; }
```

**Each `.preset-item` must have:**
```html
<div class="preset-item" draggable="true">
  <span class="drag-handle" title="Drag to reorder">⠿</span>
  <!-- name + action buttons -->
</div>
```

**`makeSortable` helper** (defined once per file, called at the end of every render function):
```js
function makeSortable(listEl, getKeys, reorderFn) {
  let dragSrc = null;
  listEl.querySelectorAll('.preset-item').forEach(item => {
    item.addEventListener('dragstart', e => {
      dragSrc = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      listEl.querySelectorAll('.preset-item').forEach(i => i.classList.remove('drag-over'));
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      listEl.querySelectorAll('.preset-item').forEach(i => i.classList.remove('drag-over'));
      if (item !== dragSrc) item.classList.add('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      if (!dragSrc || dragSrc === item) return;
      const keys = getKeys();
      const fromIdx = [...listEl.querySelectorAll('.preset-item')].indexOf(dragSrc);
      const toIdx   = [...listEl.querySelectorAll('.preset-item')].indexOf(item);
      const reordered = [...keys];
      reordered.splice(toIdx, 0, reordered.splice(fromIdx, 1)[0]);
      reorderFn(reordered);
    });
  });
}
```

**Call at the end of each render function:**
```js
// Dashboard presets
makeSortable(list, () => Object.keys(presets), reordered => {
  const newPresets = {};
  reordered.forEach(k => { newPresets[k] = presets[k]; });
  presets = newPresets;
  savePresetsStorage();
  renderPresets();
});

// Dashboard saved schedules
makeSortable(list, () => Object.keys(savedSchedules), reordered => {
  const newSched = {};
  reordered.forEach(k => { newSched[k] = savedSchedules[k]; });
  savedSchedules = newSched;
  saveSchedulesStorage();
  renderSavedSchedules();
});

// Generator (reads/writes localStorage directly)
makeSortable(list, () => Object.keys(JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}')), reordered => {
  const stored = JSON.parse(localStorage.getItem('hebrewBlender_presets') || '{}');
  const newPresets = {};
  reordered.forEach(k => { newPresets[k] = stored[k]; });
  localStorage.setItem('hebrewBlender_presets', JSON.stringify(newPresets));
  renderPresets();
});
```

**Key points:**
- Order is preserved via JS object insertion order (reliable in all modern engines for string keys)
- `makeSortable` is defined once per file and reused for all lists in that file
- The `⠿` braille character is the drag handle glyph

---

## Dark Mode (`classroom_dashboard.html`)

### No-flash IIFE
A small inline `<script>` at the top of `<head>` adds `dark-early` to `<html>` before the page renders:
```js
(function(){try{if(localStorage.getItem('hebrewBlender_darkMode')==='1'){document.documentElement.classList.add('dark-early');}}catch(e){}})()
```
The CSS selector `html.dark-early body, body.dark` applies the dark token overrides for both the initial load and runtime toggle.

### CSS tokens (light → dark)
```css
:root {
  --navy: #1a2744;   --navy-deep: #0d1220;
  --gold: #c9922a;   --gold-light: #f0d080;
  --cream: #fdf8ef;  --warm-gray: #e8e0d0;
  --text: #1a2744;   --muted: #6b6050;
  --border: #c8bfa8; --white: #ffffff;
  --heb-font: 'Frank Ruhl Libre', serif;
}
html.dark-early body, body.dark {
  --gold: #e0a832;   --gold-light: #f5d97a;
  --cream: #161c2a;  --warm-gray: #1e2535;
  --text: #dde4f0;   --muted: #8a94a8;
  --border: #2a3349; --white: #1e2535;  /* ← dark surface color, NOT white */
}
```

### Key pitfall: `--white` is NOT white in dark mode
`--white` becomes `#1e2535` (dark surface). Any text using `color: var(--white)` on a navy background will be **invisible** in dark mode.

**Rule:** Use `color: #fff` (literal) for text that sits on `--navy` / `--navy-deep` surfaces (headers, panel titles, buttons). Reserve `var(--white)` for backgrounds only.

### Toggle function
```js
function toggleDark() {
  document.documentElement.classList.remove('dark-early');
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('hebrewBlender_darkMode', isDark ? '1' : '0');
  document.getElementById('darkBtn').textContent = isDark ? '☀️' : '🌙';
  if (settings.colorCodeNikkud) { updateDateTimeDisplay(); renderDaysList(); renderWeather(); }
}
```
After toggling, any nikkud-colorized content must be re-rendered because `getNikudColor()` reads `document.body.classList.contains('dark')` at call time.

---

## Hebrew Font UI (`classroom_dashboard.html`)

### `HEB_FONTS` array
Each entry: `{ section, name, family, load }`. `load` is `null` for pre-loaded fonts, or:
```js
{ type: 'gfonts', url: 'https://fonts.googleapis.com/...' }
{ type: 'face',   css: '@font-face { ... }' }
```
Sections: `'Block'` (8 fonts) and `'Cursive'` (5 fonts).

### `loadHebFont(font)`
Injects a `<link>` (gfonts) or `<style>` (@font-face) into `<head>`. Deduplicates by element ID derived from `font.name`. Called at init for all fonts (preloads them) and again on selection.

### `initFontSelector()`
Builds the font picker UI inside `#fontOptions`. Groups fonts under section headers (`Block Fonts` / `Cursive / Script`). Each button shows:
- A preview span styled with `font.family` displaying `אֶרֶץ`
- The font name

Frank Ruhl Libre is the default font (`settings.hebFont` default). Its button appends `[DEFAULT]` in small muted text after the name — same pattern as the generator:
```js
`${font.name}${font.name === 'Frank Ruhl Libre' ? ' <span style="font-size:0.6rem;color:var(--muted);font-weight:400;">[DEFAULT]</span>' : ''}`
```

### `setHebFont(name)`
```js
function setHebFont(name) {
  const f = HEB_FONTS.find(x => x.name === name) || HEB_FONTS[0];
  settings.hebFont = f.name;
  loadHebFont(f);
  document.documentElement.style.setProperty('--heb-font', f.family);
  document.querySelectorAll('.font-opt').forEach(el =>
    el.classList.toggle('active', el.dataset.fontName === f.name));
}
```
The active font is applied via the CSS custom property `--heb-font` on `:root`. All Hebrew text elements use `font-family: var(--heb-font)`.

---

## My Fonts — shared font store, picker integration & upload (**every font-selector tool**)

Custom fonts built in the **Hebrew Font Maker** (and fonts users upload) live in a single
**IndexedDB** database that is automatically shared by every page because all tools are served from the
same origin. So a font saved in one tool appears in **every** tool's picker — no per-tool key needed.

### Shared store — byte-identical block
The store + helpers are delivered as one copy-identical block (like the `.ivrit` engine), marked
`/* ═══ shared: ivritsuite-fonts ═══ */ … /* ═══ end shared: ivritsuite-fonts ═══ */`. It defines:
- Constants: `IV_FONTS_DB = 'ivritsuite-fonts'`, `IV_FONTS_STORE = 'fonts'`, `IV_FONTS_CAP = 10`
  (keyPath `name`; record `{ name, family, bytes:ArrayBuffer, created }`).
- `listUserFonts()` → `[{name,family,created,size}]` newest-first (no bytes); `getUserFont(name)`;
  `saveUserFont(name, bytes, family)` (upsert; auto-prunes to the newest 10); `deleteUserFont(name)`;
  `loadUserFont(name)` → registers the stored bytes as a CSS-usable `FontFace` named exactly `name`.

Present (verbatim) in `index.html`, `Hebrew_Font_Maker.html`, and all five font-selector tools.

### Consumer pattern (in the picker)
Each font-selector tool keeps the block plus: `let MY_FONTS = []` + `const _loadedUserFonts = new Set()`,
`allFonts() { return MY_FONTS.concat(HEB_FONTS); }`, and `async function refreshMyFonts()` which maps
`listUserFonts()` into font objects `{ section:'My Fonts', name, family-or-stack:"'<name>', serif",
load:{type:'userfont'} }`, then calls `initFontSelector()` and re-applies a persisted user font.
`loadHebFont` gains a `userfont` branch (`loadUserFont(font.name)` via FontFace, deduped by
`_loadedUserFonts`); `initFontSelector` renders a **"My Fonts"** section header. Call `refreshMyFonts()`
at init. (Use `family` or `stack` to match whatever property that tool's `setHebFont` reads.)

### "Upload your own font?" — byte-identical block
A second shared block `/* ═══ My Fonts uploader (shared, identical across pages) ═══ */` defines
`ivUploadFontFromFile(file)` (validates via `new FontFace(name, bytes).load()`, de-dupes the name,
`saveUserFont`s it) and a thin `onUploadFontPick(input)` that does `refreshMyFonts()` + `setHebFont(name)`.
Each picker has a small **"⬆ Upload your own font?"** `<label>` (hidden `<input type="file"
accept=".ttf,.otf,.woff,.woff2">`) directly **below the font grid**. `index.html`'s gear-modal My Fonts
manager has the same uploader (its handler instead calls `renderMyFontsManager()` + `refreshFontsBackupCache()`).

### Backup (no extra wiring)
User fonts ride along in the `index.html` AllTools export as `userFonts` (base64 via
`refreshFontsBackupCache` / `_fontsBackupCache`) and are restored with `saveUserFont(... _ivB64ToBytes ...)`.
Because they live in IndexedDB (not `localStorage`), they need **no** per-tool key in the
export/import/erase functions beyond that already-present `userFonts` handling.

### Rule for any new tool with a Hebrew font selector
It **must**: (1) paste the shared `ivritsuite-fonts` block, (2) implement the consumer pattern above so a
**"My Fonts"** group appears and `refreshMyFonts()` runs at init, and (3) paste the **My Fonts uploader**
block + the "Upload your own font?" control below its picker. Custom fonts then work and upload everywhere
automatically.

---

## Nikkud Color Coding UI (`classroom_dashboard.html`)

### Constants

**`NIKUD_CHAR_TO_KEY`** — maps Hebrew nikkud characters to semantic color keys:
```js
{ 'ָ':'a','ַ':'patah','ֲ':'hpatah','ֳ':'hkamatz',
  'ֶ':'e','ֱ':'hsegol','ֵ':'tzere','ִ':'i',
  'ֹ':'o','ֻ':'u','ְ':'sh' }
```
Vav + holam (`וֹ`) → `'vcholam'` and vav + dagesh (`וּ`) → `'shuruk'` are handled as special cases in `colorizeHebrew()`.

**`NIKUD_DEFAULTS_LIGHT` / `NIKUD_DEFAULTS_DARK`** — default colors per key for each mode:
```js
// light                          // dark
a:'#0099bb'  patah/hpatah/hkamatz  a:'#33ccee'
e:'#cc3333'  hsegol                e:'#ee5555'
tzere:'#7777aa'                    tzere:'#aaaadd'
i:'#228833'                        i:'#44cc66'
o:'#bb8800'  vcholam               o:'#ddaa00'
u:'#3355cc'  shuruk                u:'#6688ff'
sh:'#8833bb'                       sh:'#bb66ee'
```

**`VOWEL_COLOR_DEFS`** — ordered list of `{ key, name, example }` used to build the color picker rows. 13 entries (kamatz through shva), including vav-holam and shuruk.

### `getNikudColor(key)`
```js
function getNikudColor(key) {
  if (settings.nikudColorOverrides?.[key] !== undefined)
    return settings.nikudColorOverrides[key];
  return (document.body.classList.contains('dark')
    ? NIKUD_DEFAULTS_DARK : NIKUD_DEFAULTS_LIGHT)[key] || '#888';
}
```
Checks `settings.nikudColorOverrides` first (user customizations), then falls back to light/dark defaults.

### `colorizeHebrew(text, mode)`
Walks the string character by character. For each Hebrew letter, collects the following nikkud marks, determines the color key (with special-case logic for vav-holam and shuruk; skips bare dagesh), then wraps the letter+marks in a `<span>`:
- `'letter'` mode → `style="color:…"`
- `'highlight'` mode → `style="background-color:…50"` (50 = 31% opacity hex)
- `'underline'` mode → `style="text-decoration:underline solid …"`

### `hebDisplay(s)`
```js
function hebDisplay(s) {
  if (!settings.showNikkud) return stripNikkud(s);
  if (settings.colorCodeNikkud) return colorizeHebrew(s, settings.colorCodingMode);
  return s;
}
```
Single entry point for all Hebrew text rendering. Call this everywhere instead of using the raw string.

### `initColorPickers()`
Dynamically builds `<div class="color-pick-row">` entries inside `#colorPickerList`. Each row: example glyph · vowel name · `<input type="color">`. On `input` event, writes to `settings.nikudColorOverrides[key]` and re-renders all Hebrew content.

### `resetNikudColors()`
Clears `settings.nikudColorOverrides = {}` then calls `initColorPickers()` (which re-reads defaults) and re-renders if color coding is active.

### Settings keys
```js
showNikkud: true,          // strip all nikkud when false
colorCodeNikkud: false,    // enable color coding
colorCodingMode: 'letter', // 'letter' | 'highlight' | 'underline'
nikudColorOverrides: {},   // key → hex string
```
When toggling `colorCodeNikkud` on, always call `initColorPickers()` to populate the picker inputs with current colors.

---

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
key-based helpers (`getNikudColor`, All/Main/None) work under either scheme.

---

## Settings Drawer & Panel Collapse (`classroom_dashboard.html`)

### Drawer structure
The settings UI is a slide-in modal from the right edge. Three elements:

| Element | Role |
|---|---|
| `.settings-backdrop` | Full-screen dark overlay; click closes drawer |
| `.settings-modal` | The 380px panel (`max-width: 92vw`); slides in via `transform: translateX` |
| `.settings-header` | Navy bar with title + close button (`×`) |
| `.settings-body` | Scrollable content area holding all `.panel` blocks |

Open/close is controlled by toggling the `.open` class on both backdrop and modal:
```js
function openSettings() {
  document.getElementById('settingsBackdrop').classList.add('open');
  document.getElementById('settingsModal').classList.add('open');
  syncFormToSettings();
}
function closeSettings() {
  document.getElementById('settingsBackdrop').classList.remove('open');
  document.getElementById('settingsModal').classList.remove('open');
  saveSettingsToStorage();
}
```
Settings are saved to `localStorage` on close.

### Drawer CSS
```css
.settings-backdrop {
  position: fixed; inset: 0;
  background: rgba(13, 18, 32, 0.45);
  z-index: 90;
  opacity: 0; pointer-events: none;
  transition: opacity 0.3s;
}
.settings-backdrop.open { opacity: 1; pointer-events: auto; }

.settings-modal {
  position: fixed; top: 0; right: 0;
  width: 380px; max-width: 92vw; height: 100vh;
  background: var(--white);
  border-left: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  z-index: 100;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  display: flex; flex-direction: column;
}
.settings-modal.open { transform: translateX(0); }

.settings-header {
  padding: 14px 20px;
  background: var(--navy);    /* use #fff for text, not var(--white) */
  color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
body.dark .settings-header { background: var(--navy-deep); }

.settings-header h2 {
  font-family: 'Libre Baskerville', serif;
  font-size: 1rem; letter-spacing: 0.05em; color: #fff;
}

.settings-close {
  background: rgba(255,255,255,0.12); color: #fff;
  border: none; border-radius: 4px;
  width: 32px; height: 32px;
  cursor: pointer; font-size: 1.2rem;
}
.settings-close:hover { background: rgba(255,255,255,0.22); }

.settings-body { flex: 1; overflow-y: auto; padding: 16px; }
```

### Panel (collapsible section) CSS
```css
.panel {
  background: var(--cream);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 14px;
  overflow: hidden;
}
body.dark .panel { background: var(--navy-deep); }

.panel-title {
  background: var(--navy); color: #fff;   /* always #fff, not var(--white) */
  font-family: 'Libre Baskerville', serif;
  font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
  padding: 9px 14px;
  cursor: pointer; user-select: none;
  display: flex; justify-content: space-between; align-items: center;
}
body.dark .panel-title { background: #0a0f1c; }

/* Collapse indicator — ▾ rotates −90° when collapsed (matches generator/dictionary) */
.panel-title::after { content: '▾'; color: var(--gold-light); font-size: 1rem; transition: transform 0.2s; flex-shrink: 0; }
.panel.collapsed .panel-title::after { transform: rotate(-90deg); }

.panel-body { padding: 14px; }
.panel.collapsed .panel-body { display: none; }
```

### Panel collapse JS
```js
function initPanelCollapse() {
  document.querySelectorAll('.panel-title').forEach(t => {
    t.addEventListener('click', () => t.parentElement.classList.toggle('collapsed'));
  });
}
```
Called once at `DOMContentLoaded`. Toggling `.collapsed` on the `.panel` element hides `.panel-body` and swaps the `::after` arrow via CSS.

---

## Tooltips (`classroom_dashboard.html`)

### Why not pure CSS

`.panel` has `overflow: hidden` (needed to clip `.panel-title` to rounded corners) and `.settings-body` has `overflow-y: auto`. Both cut off `position: absolute` children, clipping any CSS-only tooltip bubble.

### Pattern: `position: fixed` floating div driven by JS

**Single floating element** — one `<div id="tipFloat">` is appended to `<body>` at init time and reused for all tooltips.

**Markup** — use `.tip-wrap` with `data-tip` on the wrapper and `.tip-icon` on the `?` badge. No child bubble span needed:
```html
<span class="tip-wrap" data-tip="Your tooltip text here."><i class="tip-icon">?</i></span>
```

**CSS:**
```css
.tip-wrap { display: inline-flex; align-items: center; }
.tip-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 15px; height: 15px; border-radius: 50%;
  background: var(--border); color: var(--muted);
  font-size: 0.65rem; font-weight: 700; font-style: normal;
  cursor: default; margin-left: 5px; flex-shrink: 0; line-height: 1;
}
body.dark .tip-icon { background: var(--warm-gray); }
#tipFloat {
  display: none; position: fixed;
  background: var(--navy); color: #fff;
  font-size: 0.72rem; font-weight: 400; line-height: 1.45;
  padding: 6px 9px; border-radius: 6px;
  max-width: 220px; z-index: 9999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  pointer-events: none;
}
body.dark #tipFloat { background: #0a0f1c; }
```

**JS** (runs in an IIFE after DOM is ready, at end of `<script>`):
```js
(function() {
  const tip = document.createElement('div');
  tip.id = 'tipFloat';
  document.body.appendChild(tip);
  document.querySelectorAll('.tip-wrap').forEach(wrap => {
    wrap.addEventListener('mouseenter', () => {
      const text = wrap.dataset.tip;
      if (!text) return;
      tip.textContent = text;
      tip.style.display = 'block';
      const r = wrap.querySelector('.tip-icon').getBoundingClientRect();
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      // Appear above the icon, centered; clamp to viewport edges
      let left = r.left + r.width / 2 - tw / 2;
      let top  = r.top - th - 6;
      if (left < 6) left = 6;
      if (left + tw > window.innerWidth - 6) left = window.innerWidth - tw - 6;
      if (top < 6) top = r.bottom + 6; // flip below if no room above
      tip.style.left = left + 'px';
      tip.style.top  = top  + 'px';
    });
    wrap.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  });
})();
```

**Key points:**
- `position: fixed` escapes all `overflow` clipping from `.panel` and `.settings-body`
- Tooltip appears **above** the `?` icon by default; flips **below** if near the top of the viewport
- Viewport clamping prevents left/right overflow
- One `#tipFloat` element is reused for all tooltips — never create per-tooltip bubble spans

---

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

## App Version & Splash Screens (`splash/`)

The PWA launch (splash) screens live in `splash/` and are generated by
`splash/gen_splash.py` (Python 3 + Pillow; Libre Baskerville is bundled in
`splash/fonts/`, OFL-licensed). They show the gold Star of David, the
**IvritSuite** wordmark, and a 3-line footer ending in `v<VERSION>`.

- **iOS** uses them via the `apple-touch-startup-image` `<link>` tags in
  **every** HTML page's `<head>` (alongside the `apple-mobile-web-app-capable`
  meta), so the app installs with a splash no matter which page is added to the
  Home Screen. The full tag block is mirrored in `splash/apple-startup-links.html`.
- **Android** ignores them — Chrome builds its own splash from
  `manifest.webmanifest` (`name` + `background_color` + icon).

### Updating the version number

The version is a single constant at the top of `splash/gen_splash.py`:

```py
VERSION = "1.0"   # shown as "v{VERSION}" on the splash
```

**When asked to update / bump the version number:**
1. Edit `VERSION` in `splash/gen_splash.py`. **This is all a plain version bump
   does** — just the constant.
2. **Do NOT regenerate the splash images unless the user explicitly asks.**
   The `VERSION` constant is the source of truth; the rendered `splash/splash-*.png`
   are only re-rendered on request. So the splash PNGs may lag the constant until
   a regeneration is requested — that's expected.

**When the user explicitly asks to regenerate the splash images:**
1. Make sure `VERSION` is set as desired in `splash/gen_splash.py`.
2. Run `python3 splash/gen_splash.py` — re-renders every `splash/splash-*.png`
   and rewrites `splash/apple-startup-links.html`.
3. Only if `DEVICES` changed (NOT for a plain version bump): re-sync the
   `apple-touch-startup-image` block in **all 8 HTML pages** from
   `splash/apple-startup-links.html` (the block is identical in each). A version
   bump alone keeps the same filenames, so the pages need no change.
4. Commit & push.

Notes:
- This is the **user-facing app version** shown on the splash. It is separate
  from the service-worker cache version (`VERSION` in `sw.js`), which only
  controls offline-cache invalidation.
- iOS caches the launch image, so an already-installed user sees the new
  version only after removing and re-adding the app to the Home Screen.

---

## Service Worker & Caching (`sw.js`)

`sw.js` precaches the app shell into a cache named `ivritsuite-v<VERSION>`.

- **Pages and scripts (`pwa.js`) are network-first:** when online the browser
  always gets the fresh file, so a deploy is never hidden behind a stale cached
  page. The cache is only the offline fallback for these.
- **Static media (icons, splash images, manifest) is cache-first** for speed.
- Cross-origin requests (Google Fonts, Analytics, Sefaria, PocketTorah) bypass
  the worker, so those resources are **not** available offline.

### Rule: bump the cache version when you change a precached asset

After editing **any** file that the service worker serves — an HTML page, `pwa.js`,
an icon, a splash image, the manifest, or `CORE_ASSETS` itself — bump `VERSION`
in `sw.js`:

```js
const VERSION = 'v3';   // cache "ivritsuite-v3" — bump to 'v4', etc.
```

Renaming the cache makes the new worker delete the old cache on activate and
re-precache from scratch. Pages and `pwa.js` are network-first so they self-refresh
online, but bumping `VERSION` is the safe catch-all (and the only way to refresh
the **cache-first** static assets and the offline copy). This is the service-worker
cache version — separate from the user-facing splash version (`VERSION` in
`splash/gen_splash.py`).
