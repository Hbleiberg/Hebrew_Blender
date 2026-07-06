# Hebrew Blender — Claude Instructions

## Contents

**Binding rules (every change must comply)**
- [Git](#git)
- [Definition of done](#definition-of-done--check-every-item-before-finishing-a-change)
- [Security — required patterns (`ivritSafeParse` / `esc()` / CSP)](#security--required-patterns-safe-json-parse-esc-csp)
- [Import / Export All Settings — AllTools registration](#import--export-all-settings-indexhtml)
- [localStorage flag guidance — what belongs in AllTools](#localstorage-flag-guidance--what-belongs-in-alltools)
- [.ivrit save files](#ivrit-save-files-automatic-input--required-on-every-tool-with-presetssettings)
- [Preset Save/Restore (`getSettings()`/`applySettings()`)](#preset-saverestore)
- [Preset Lists — Nested Folders](#preset-lists--nested-folders-file-tree)
- [My Fonts — shared font store](#my-fonts--shared-font-store-picker-integration--upload-every-font-selector-tool)
- [Vowel Color Scheme — Default / TaL AM](#vowel-color-scheme--default--tal-am-all-three-picker-tools)
- [Shared UX components](#shared-ux-components--the-conventions-all-tools-are-converging-on)
- [App Version & Splash Screens](#app-version--splash-screens-splash)
- [Service Worker & Caching](#service-worker--caching-swjs)
- [Deploy — how changes reach ivritsuite.com](#deploy--how-changes-reach-ivritsuitecom-github-pages)

**Component reference (how existing systems work)**
- [Preset Lists — Drag-to-Reorder](#preset-lists--drag-to-reorder-superseded-for-the-six-foldered-lists-above)
- [Dark Mode](#dark-mode-classroom_dashboardhtml)
- [Hebrew Font UI](#hebrew-font-ui-classroom_dashboardhtml)
- [Hebrew Font Maker](#hebrew-font-maker-hebrew_font_makerhtml)
- [Nikkud Color Coding UI](#nikkud-color-coding-ui-classroom_dashboardhtml)
- [Settings Drawer & Panel Collapse](#settings-drawer--panel-collapse-classroom_dashboardhtml)
- [Tooltips](#tooltips-classroom_dashboardhtml)
- [Letter Selector](#letter-selector-hebrew_blend_generatorhtml)
- [Vowel Selector](#vowel-selector-hebrew_blend_generatorhtml)
- [Verifying changes — headless Playwright recipe](#verifying-changes--headless-playwright-recipe)

---

## Git
- Always commit and push directly to `main`
- Do not create feature branches

## Definition of done — check EVERY item before finishing a change

- [ ] Edited a precached file (any root HTML page, `pwa.js`, an icon, the manifest)? → **bump `VERSION` in `sw.js`** (see Service Worker section). This is the most-missed step — the live site serves stale copies until it's done.
- [ ] Shipped a Font Maker feature? → bump `FONT_MAKER_VERSION` + prepend a matching changelog `<li>` in the About tab (one **combined** bump/entry per release, not per sub-feature).
- [ ] Added an external script/font/fetch/wasm/iframe? → update that page's **CSP meta tag** (Security rule 3).
- [ ] New UI control in a preset-bearing tool? → wire `getSettings()`/`applySettings()` (+ AllTools export/import/erase keys if it's a new localStorage store).
- [ ] Verified headless with the **Playwright recipe** (see "Verifying changes" section): light + dark mode, desktop + ~800px.
- [ ] Added or meaningfully changed a page's content? → run **`node scripts/update-sitemap.mjs`** as your last step so each `<lastmod>` reflects this change's commit date (see Deploy section). Idempotent; safe to run every session.
- [ ] Committed + pushed directly to `main`, and the **Pages deploy run concluded `success`** (see Deploy section — code on `main` is not yet the live site).

## Security — REQUIRED patterns (safe JSON parse, `esc()`, CSP)

These three rules are binding for every tool. They exist because the suite's sharing surface
(`.ivrit` files, share codes, `?s=` URL params, the AllTools blob) carries untrusted data between
teachers.

### 1. Never bare-`JSON.parse` untrusted or import-target data — use `ivritSafeParse`
Any JSON that originates from a **file, share code, URL param, or a localStorage key that an import
writes** must go through `ivritSafeParse(str)` (a `JSON.parse` reviver that drops `__proto__`,
`constructor`, and `prototype` keys at every depth) — never bare `JSON.parse`. It lives in the shared
`.ivrit` engine block (so it's identical in the four engine files); the three non-engine tools
(Font Maker, Dictionary, Torah Trainer) carry a small local copy. Import-side **merges** must use
`ivritSafeAssign(target, src)` (an `Object.assign` that skips those three keys), never bare
`Object.assign`, so a future missed parse-site still can't pollute `Object.prototype`. Leave
`JSON.parse(JSON.stringify(...))` clones, Pyodide/HarfBuzz return-value parses, and `res.json()` on
same-origin `data/*.json` alone — those are trusted.

### 2. Any user- or network-supplied string in HTML must pass through `esc()` (or `textContent`)
Every tool defines a canonical `esc(s)` that escapes all five HTML metacharacters
(`& < > " '`). Any value that comes from a user input, localStorage/`.ivrit`/share code, or a remote
API (Hebcal, Sefaria, Open-Meteo/Nominatim, PocketTorah, web3forms) and is interpolated into
`innerHTML`/`insertAdjacentHTML`/`outerHTML` must be wrapped in `esc()` — or, preferably, assigned via
`textContent`/`createElement`. Example: `el.innerHTML = '<div>' + esc(place.name) + '</div>';`. Static
markup is fine as-is. For a value going into an inline event handler or a `javascript:`-capable
attribute, `esc()` is **not** sufficient — rebuild that spot with `addEventListener`.

### 3. Adding an external script/font/fetch/iframe requires updating that page's CSP meta tag
Every page has a `<meta http-equiv="Content-Security-Policy">` right after `<meta charset>` (before any
script/style). It uses `script-src 'unsafe-inline'` (all app JS is inline by design); its job is
blocking remote script injection, `object-src`, `base-uri` hijacks, and unexpected `connect-src`/
`frame-src` origins. When you add any **loaded** resource (`<script src>`, stylesheet, `@font-face`
`url()`, `fetch`/`import()`, `new Worker`, `<iframe src>`, `<img>`/`<audio>` src, a `.wasm` fetch), add
its origin to the correct directive on that page. Reference allowlist by page: Google Fonts + gtag
baseline everywhere (flash_cards included as of 2026-07-06); `esm.sh`/`cdn.jsdelivr.net` for the transliteration
ESM + Ezra SIL font (generator, flash cards, dictionary, torah); `cdnjs.cloudflare.com` for
html2canvas/jspdf (generator, Font Maker); `'wasm-unsafe-eval'` + `cdn.jsdelivr.net` for Font Maker's
HarfBuzz WASM; `hebcal.com`/`api.open-meteo.com`/`geocoding-api.open-meteo.com`/
`nominatim.openstreetmap.org` + `youtube.com` frame for the dashboard; `sefaria.org` +
`raw.githubusercontent.com` media for Torah Trainer; `web3forms.com`/`api.web3forms.com` +
`*.hcaptcha.com` for contact/resources. `data:`/`blob:` stay in `img-src` (and `media-src`) for
PDF/PNG/`.ivrit` export. Meta CSP can't express `frame-ancestors` or `report-uri` and doesn't cover
content parsed before the tag — hence the placement right after `<meta charset>`.

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
| `flashCardSettings` | `hebrewFlashCards_settings` | All Flash Cards live settings (mode, selected letters/vowels, color-coding, fonts, timer, number/color/emoji sub-modes, word-list selections, etc.); flat settings blob merged field-by-field via `ivritSafeAssign` |
| `flashCardPbStreak` | `hebrewFlashCards_pbStreak` | Flash Cards personal-best streak (scalar string; imported as the **max** of existing vs incoming) |
| `flashCardProfiles` | `hebrewFlashCards_profiles` | Flash Cards saved profiles (import merges via `mergeFlashCardProfiles`) |
| `dictAudioEnabled` / `dictTranslitStyle` / `dictTtsRate` / `dictEmojiSettings` | `hebrewDictionary_*` | Hebrew Dictionary settings |
| `dictLastState` | `hebrewDictionary_lastState` | Dictionary last filter/session state (`getDictState()` minus the search query); object blob merged via `ivritSafeAssign`, empty = never-set (skipped on import) |
| `wordLists` | `ivritSuite_wordLists` | Suite-wide saved Word Lists (`{v:1,lists:{}}`); merged one level deep via `wlMergeIntoStorage` so a shallow assign can't clobber `lists` |
| `torahTrainerSettings` | `hebrewTorahTrainer_settings` | Torah Trainer settings |
| `userFonts` | *(IndexedDB `ivritsuite-fonts`, not localStorage)* | Custom fonts, base64-bundled at export — see "My Fonts" section |
| `inputMode` | `hebrewBlender_inputMode` | Backup UI preference: `'auto'` (.ivrit file) or `'manual'` (text block) — see ".ivrit Save Files" below |
| `hebFont` / `hebFontSize` | `hebrewBlender_hebFont` / `_hebFontSize` | Shared Generator+Dictionary display prefs (selected Hebrew font + size); scalar strings, empty = never-set (skipped on import) |
| `livePreview` | `hebrewBlender_livePreview` | Generator live-preview toggle (`'1'`/`'0'`); scalar string, empty = never-set (skipped on import) |

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

Note: `eraseAllSettings` also purges the orphaned `ivritsuite-impact-v1` / `ivritsuite-impact-optout`
keys — leftovers of a removed community-impact feature. Leave that cleanup in place; don't "fix" or
re-add those keys.

### Naming convention for localStorage keys

Follow the existing pattern: `hebrew<ToolCamelCase>_<dataType>`.

Examples:
- `hebrewBlender_presets` — Generator presets
- `hebrewDashboard_presets` — Dashboard presets
- `hebrewDashboard_settings` — Dashboard settings blob
- `hebrewDashboard_schedules` — Dashboard schedules

### localStorage flag guidance — what belongs in AllTools

Not every key belongs in the three AllTools functions. Split them:

- **Real cross-machine data → MUST register** (all three functions, per the rule above). Anything a
  user would expect back on a new machine: settings blobs, presets, saved profiles/schedules, folder
  trees, last-session state, and live-preview/display preferences. If a tool persists it and losing it
  on a new device would upset the user, it's data.
- **One-time UI flags → EXEMPT from export/import, but `eraseAllSettings` SHOULD clear them.** Flags
  whose only job is "don't show this again" — `*_tourSeen` / `hebrewFontMaker_tourDone`, `*_setupSeen`,
  `*_welcomeSeen`, `*_hintSeen`, `*_mobileWarnDismissed`, and similar dismissals. Backing these up would
  just re-suppress first-run help on a fresh machine, so they stay out of export/import — but **erase
  means fresh start**, so add them to `eraseAllSettings`. (Per-device UI prefs like `hebrewBlender_zoom`,
  `hebrewBlender_hideZoomBar`, and transient caches like `hebrewDashboard_shabbatCache` are also legitimately
  export-exempt.)

Reconcile whenever you touch storage: every key a tool writes should be *either* registered in all three
functions *or* consciously in the exempt set above. Treat a key that is real data yet missing from
export/import as a bug to fix, not a pattern to copy. (The last such gap —
`hebrewDictionary_lastState`, previously erase-only — was registered as `dictLastState` on 2026-07-06.)

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

Each file defines a small **`IVRIT_CFG`** object, then pastes the **shared engine** verbatim (the block between the `═══ IvritSuite .ivrit save-file engine ═══` comment markers — it is byte-for-byte identical across the three tool pages (generator, flash cards, dashboard; re-verified 2026-07-06); copy it, don't rewrite it. **Exception:** `index.html` carries a deliberately adapted AllTools superset of the engine — extra `wlMergeIntoStorage`, a legacy-blob payload shape, and a "reload open tool pages" success alert — do not "fix" it back to the shared text).

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
This rule applies to **every tool that defines `getSettings()`/`applySettings()`** —
currently `hebrew_blend_generator.html`, `flash_cards.html`, and `classroom_dashboard.html`.
Whenever a new UI control is added to one of those tools, it must be included in both:
- `getSettings()` — serialize the control's current value
- `applySettings()` — restore the value and call any related UI toggle functions (e.g. `toggleGematriaMode()`, `toggleCwBlendOpts()`) so dependent rows update correctly

Because `.ivrit` save files store `liveState = getSettings()`, keeping `getSettings()`/`applySettings()` complete is what makes both presets **and** `.ivrit` files capture every control. No separate `.ivrit` step is needed per control.

(`torah_trainer.html` and `hebrew_dictionary.html` have no preset collection of their own — they
persist a single `settings`/last-state object instead, so the equivalent obligation there is to add
every new control to that object's save/restore path.)

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
matching `.ft-*` CSS block. Carried by generator, flash_cards, dashboard (which render trees and have
the `.ft-*` CSS) **and `index.html`**, which deliberately uses only the block's data helpers
(`ftRead`/`ftImportTree`/`ftDuplicateName`) for AllTools import/export — it never calls
`mountFolderTree` and has no `.ft-*` CSS. That's by design, not dead code. Entry point:
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

Present (verbatim; sha-verified 2026-07-06) in **8 files**: `index.html`, `Hebrew_Font_Maker.html`, and the six
font-selector tools (generator, flash cards, dashboard, dictionary, torah trainer, resources).

### Consumer pattern (in the picker)
Each font-selector tool keeps the block plus: `let MY_FONTS = []` + `const _loadedUserFonts = new Set()`,
`allFonts() { return MY_FONTS.concat(HEB_FONTS); }`, and `async function refreshMyFonts()` which maps
`listUserFonts()` into font objects `{ section:'My Fonts', name, family-or-stack:"'<name>', serif",
load:{type:'userfont'} }`, then calls `initFontSelector()` and re-applies a persisted user font.
`loadHebFont` gains a `userfont` branch (`loadUserFont(font.name)` via FontFace, deduped by
`_loadedUserFonts`); `initFontSelector` renders a **"My Fonts"** section header. Call `refreshMyFonts()`
at init. (Use `family` or `stack` to match whatever property that tool's `setHebFont` reads.)

### "Upload your own font?" — byte-identical block + per-page pick handler
A second shared block `/* ═══ My Fonts uploader (shared, identical across pages) ═══ */` defines
`ivUploadFontFromFile(file)` (validates via `new FontFace(name, bytes).load()`, de-dupes the name,
`saveUserFont`s it). The block contains ONLY that function (sha-verified identical across all 6 carriers,
2026-07-06); the thin **pick handler lives BELOW the end marker and is per-page**: the four tool pickers
use `onUploadFontPick(input)` (`refreshMyFonts()` + `setHebFont(name)`), the dashboard adds an extra
`onUploadEngFontPick` (routes to `setEngFont`), and `index.html`'s gear-modal manager uses
`onUploadFontPickIndex` (`renderMyFontsManager()` + `refreshFontsBackupCache()`). Each picker has a small
**"⬆ Upload your own font?"** `<label>` (hidden `<input type="file" accept=".ttf,.otf,.woff,.woff2">`)
directly **below the font grid**.

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

## Shared UX components — the conventions all tools are converging on

These are the cross-tool UX patterns the suite is standardizing, documented the same way as the
`.ivrit` engine and folder-tree component: **canonical pattern, then a rule for new tools**, plus an
**Implemented on:** line that states the *current* reality (which may be "not yet implemented anywhere").
These lines are a snapshot — verify by grep before relying on them, and update them when a pattern spreads.

### 1. Guided tour engine
Non-modal spotlight: a dim full-page overlay with a spotlight cutout computed from the target's
`getBoundingClientRect()`, a floating card (title, 1–2 sentences, "Step X of N", Back / Next / ✕ End),
Escape to end, arrow keys to navigate, resize-safe, `scrollIntoView` the target first, and **zero project/
settings mutations**. It **never auto-launches** — entry is a header **"❓ Tour"** button with a one-time
first-visit pulse gated by a `hebrew<Tool>_tourSeen` flag (set once so the pulse never returns).
- **Implemented on:** `hebrew_blend_generator.html`, `hebrew_dictionary.html`, `classroom_dashboard.html`,
  `torah_trainer.html`, `Hebrew_Font_Maker.html`, `flash_cards.html` (2026-07-06) — **all 6 tools**, but as
  **per-file engines**, not yet a single shared block. Flags are `hebrew<Tool>_tourSeen` except Font Maker's
  legacy `hebrewFontMaker_tourDone`. The generator's engine is a copy of Font Maker's, and flash cards' is
  a copy of the generator's ("keep the engines in sync"). **Not** on `index.html` or `resources.html`.
- **Rule:** when you next touch a tour engine, extract it into a `═══`-marked shared block (house
  convention, byte-identical across files) so the six copies stop drifting. Any **new** tool ships a tour.
  A tour must touch none of the undo/dirty/state machinery — read-only overlay only.

### 2. Accessible tooltips (tap + keyboard, not hover-only)
Hover is preserved, **and** tap/click plus Enter/Space toggle the bubble; Escape, an outside click, or
blur closes it; only one is open at a time; the bubble is viewport-clamped and has **no** fixed-duration
auto-hide timer. The trigger carries `tabindex="0"`, `role="button"`, `aria-expanded`, and
`aria-describedby` pointing at the bubble.
- **Implemented on:** `hebrew_blend_generator.html` (via `.tooltip-wrap`/`.tooltip-box`), plus
  `hebrew_dictionary.html`, `torah_trainer.html`, and `classroom_dashboard.html` (via `.tip-wrap`/`data-tip`
  + `bindTip`), and `flash_cards.html` (2026-07-06 — its `tooltipIIFE` now carries the `bindTip` wiring
  adapted to `.has-tip` triggers + the `#tipFloat` `.show`/opacity model; its one native-`<button>`
  trigger is hover/focus-only by design). Note the dashboard's `wire()` predates the
  `aria-expanded`/`aria-describedby` attributes — verify before relying on them there.
- **Rule:** no new hover-only tooltips anywhere. New `data-tip`s must inherit the page's accessible
  handler automatically (don't hand-roll a one-off).

### 3. Share links (`?s=` state in the URL)
Serialize the tool's shareable state as a **diff against a pristine-defaults baseline** (so the URL stays
short), URL-safe-encode it into a **`?s=`** param, and restore it on init with **silent failure on garbage**.
Writing a link uses `history.replaceState` (never a navigation); loading a link **never clobbers** the
user's saved presets/profiles — it only sets the live view.
- **Implemented on:** `hebrew_dictionary.html` (`serializeDictState`/`applyDictState`, also persists
  `hebrewDictionary_lastState`) and `hebrew_blend_generator.html` (`shareB64Encode`, auto-restores on load).
  `flash_cards.html` ships a **paste-in teacher "share code"** (`shareCodeEncode`/`shareCodeDecode`) rather
  than a URL param — the two mechanisms coexist and both are fine where they already are.
- **Rule:** any tool that gains shareable state uses `?s=` (a paste code may coexist where one already does).

### 4. Reduced motion
Every page must carry a `@media (prefers-reduced-motion: reduce)` block, and **every** animation added
anywhere — first-visit pulses, tour transitions, timer/omer pulsing, fades — must be neutralized inside it.
- **Implemented on:** every page with any animation — `torah_trainer.html`,
  `hebrew_blend_generator.html`, `hebrew_dictionary.html`, `classroom_dashboard.html`,
  `Hebrew_Font_Maker.html`, `404.html`, `flash_cards.html`, `index.html`, `resources.html`,
  `contact.html` (**10 files**, complete as of 2026-07-06). (`privacy.html` has zero
  animations/transitions, so a block there would be a no-op.)
- **Rule:** if you add an animation to a page, that page needs the reduced-motion block, and your
  animation must honor it.

### 5. Inline validation, never `alert()`
Validation should surface as **inline notes in the owning panel** plus a short summary near the primary
action; a primary action that can't run gets `aria-disabled` + a stated reason rather than a dead click or
a modal `alert()`. (`confirm()` for genuinely destructive actions — erase, reset-both-schemes — stays.)
- **Implemented on:** **not yet — this is a target, not current reality.** Blocking `alert()` is still the
  norm across the suite (≈15–21 calls each in the generator, flash cards, index, and dashboard; a handful
  in the others). Migrate call sites toward inline validation opportunistically as you touch each panel.
- **Rule:** do not add **new** `alert()`-driven validation; wire new validation inline. Leave existing
  `confirm()` destructive-action guards in place.

### 6. First-run affordances
One-time nudges / setup cards / starter layouts, each gated by a `hebrew<Tool>_<flag>` localStorage flag so
they show **once** and never again; never a modal wall, never an auto-launching tour.
- **Implemented on:** `classroom_dashboard.html` (`STARTERS` starter-layout card, `hebrewDashboard_setupSeen`),
  `hebrew_blend_generator.html` (`QUICK_START_RECIPES` quick-start drawer/chips), and `Hebrew_Font_Maker.html`
  (welcome modal via `hebrewBlender_welcomeSeen` + `hebrewFontMaker_mobileWarnDismissed`).
- **Rule:** gate every first-run affordance behind its own `*_seen`/`*_dismissed` flag (which is
  export-exempt but erase-cleared — see the localStorage flag guidance above).

### 7. Keyboard / touch parity
Documented keyboard shortcuts get visible `<kbd>` hint rows (surfaced on keyboard-capable devices);
touch-primary tools get gesture equivalents; every new interactive element must be keyboard-operable.
- **Implemented on:** only `Hebrew_Font_Maker.html` carries the full treatment (global shortcut handler +
  `?` cheat sheet via `shortcutGroups()`/`openShortcuts()` + `<kbd>` hints). **No tool currently ships
  touch-gesture equivalents** (no `touchstart`/swipe handlers anywhere — Flash Cards flips on plain tap).
- **Rule:** any new shortcut is registered in the cheat sheet **and** the triggering control's `title`, and
  shown as a `<kbd>` hint; any new interactive element is reachable and operable by keyboard.

---

## Hebrew Font Maker (`Hebrew_Font_Maker.html`)

The largest file in the repo (~9,900 lines, single-file app). **Line numbers drift constantly** —
never trust remembered or previously-reported line numbers; locate everything by pattern
(function names, marker comments, element ids).

### Versioning + changelog (mirror of the sw.js/splash rules)
`const FONT_MAKER_VERSION` — "bump on release; add a matching Changelog entry in the About tab."
The changelog is the list of `<li><strong>vX.Y</strong> —…` entries inside `HELP_CONTENT.about`
(prepend the new entry at the top, in the same friendly plain-language voice, with a `(Month Year)`
suffix). For multi-feature work, batch **one** combined bump + entry at the end — not one per feature.

### Backup exemption + localStorage keys
The Font Maker is deliberately **NOT** in the index.html AllTools export/import/erase — its project
data doesn't fit the presets model. Its keys are local-only: `hebrewFontMaker_uiPrefs` (workspace UI
prefs JSON blob — read/modify/write via `wsReadPrefs()`; put new persistent UI prefs **here**, not in
new bare keys), `hebrewFontMaker_tourDone`, `hebrewFontMaker_inputMode`, `hebrewFontMaker_recentProjects`,
`hebrewFontMaker_mobileWarnDismissed`, `hebrewFontMaker_autosave` (image-stripped fallback). Primary
autosave is **IndexedDB** db `hebrewFontMaker`, store `autosave` (gzip blob, id `'current'`). Shared
site-wide keys it also reads: `hebrewBlender_darkMode`, `hebrewBlender_welcomeSeen`.

### UI primitives — never hand-roll these
- **Modals**: `.overlay`/`.modal` markup opened via `aOpenModal(id, closeFn)` / closed via
  `aCloseModal(id)`. `_activeModal` + the global keydown provide the focus trap and Escape-to-close —
  never add your own trap.
- **Confirmations**: `askModal(title, bodyHtml, buttons)` with `[{label, cls:'ghost'?, onClick}]`.
  It auto-closes before running `onClick`; to make elements inside the body interactive (like the
  export-warning letter chips), wire listeners on `#askBody` **after** the `askModal(...)` call.
- **Toasts**: `status(msg, sticky)` — auto-clears in 4s unless `sticky`.
- **Escaping**: prefer `esc()` (all five metacharacters) over the older `escapeHtml()` (doesn't
  escape `'`). Both exist in this file.
- **Global keyboard shortcuts**: start the handler with the `udShortcutBlocked()` guard (blocks
  while typing or when ask/help/QA overlays are open), and register the shortcut in BOTH the `?`
  cheat sheet (`shortcutGroups()`) and the triggering button's `title=` tooltip.

### Undo / dirty / autosave contract — the big one
**Never mutate `project` directly.** Route every mutation through `udDo(scopes, label, fn)`
(scopes: `{t:'item',kind,cp}`, `'spacing'`, `'kerning'`, `'kernClasses'`, `'metrics'`, `'guides'`,
`{t:'precomp',target}`). Continuous inputs: slider drags use `udBurstBegin`/`udBurstCommit` (one
undo entry per drag); arrow-key nudges use `udNudgeTick`/`udNudgeCommit`. `udPush` calls
`markDirty()` automatically (debounced IndexedDB autosave), so going through `udDo`/burst/nudge
covers undo + dirty + autosave in one. Pure-UI state (panel collapse, toggles) calls `markDirty()`
directly with no undo entry. Read-only features (tour, QA grid, shortcuts sheet) must touch none of
this — zero project-state changes.

### Workspace model + render pipeline
State: `curKind` (`letter|nikkud|trop`), `curCp`, `workMode` (`align|trace|anchors|nodes`).
Guarded vs guard-bypass pairs: `selectItem` → `_selectItem`, `setWorkMode` → `_setWorkMode` (the
guards protect unsaved anchor moves via `guardPlacement`). Read-only jump-to-letter flows (QA grid,
export-warning chips) legitimately use the `_` versions plus `gotoAnchors('nikkud'|'trop')`.
After mutating state, call `renderStage(); renderControls();` (+ `renderGrids()` if tile status or
selection changed) — `afterUndo` shows the canonical full refresh.

### v2.0 extension points
- **Guided tour**: `TOUR_STEPS` array + `tourStart()`/`tourEnd()` — non-modal spotlight; steps have
  `target()` (+ optional `reveal()`) and skip gracefully when hidden; must never change project state.
- **Shortcuts sheet**: `shortcutGroups()` + `openShortcuts()`; global `?` handler (suppressed while
  typing / modal open / tour active).
- **Engine warm-up**: `ensurePyodide(opts)` — `opts.background: true` suppresses status toasts;
  phases via `_setPyoPhase` (`download`→`install`→`ready`, resets to `idle` on failure so retry
  works); `maybePrefetchEngine()` prefetches once at idle after the first traced letter, skipped for
  `navigator.connection.saveData`.
- **Next-step hint**: `renderNextStepHint()` (called from `renderLetterGrid()`) — the "what's next?"
  line under the letter grid.

### Lazy CDNs + CSP
pyodide v0.26.2 (+ fontTools), harfbuzzjs 0.4.6 (`hb.wasm` fetch — needs `'wasm-unsafe-eval'` +
`connect-src cdn.jsdelivr.net`), opentype.js 1.3.4 — all jsDelivr, all lazy-loaded via
`loadScript()`. The page CSP already allowlists these; any **new** external resource requires
editing this page's CSP meta (Security rule 3 above).

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

> **Accessibility note:** the dashboard's `.tip-wrap`/`data-tip` tooltips have adopted the shared
> **accessible tooltip** pattern (tap/click + Enter/Space toggle, `aria-expanded`, Escape/outside/blur
> to close, one open at a time) — see [Shared UX components → Accessible tooltips](#shared-ux-components--the-conventions-all-tools-are-converging-on).
> The `position: fixed` floating-div mechanics below are still the delivery vehicle; the JS now also
> wires the keyboard/tap handlers, not hover alone.

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
VERSION = "1.2"   # shown as "v{VERSION}" on the splash — bump whatever value you find
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
   `apple-touch-startup-image` block in **all 11 HTML pages** (every root `*.html`: 404,
   Hebrew_Font_Maker, classroom_dashboard, contact, flash_cards, hebrew_blend_generator,
   hebrew_dictionary, index, privacy, resources, torah_trainer) from
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
- **`/data/` corpora live in a separate, version-independent cache**
  (`DATA_CACHE = 'ivritsuite-data-v1'`): a routine `VERSION` bump does NOT evict
  the ~7 MB of dictionary/emoji/parshiyot/pockettorah data, so users don't
  re-download it on every deploy. Bump the `DATA_CACHE` name only if the
  `/data/` eviction semantics themselves change.
- Cross-origin requests (Google Fonts, Analytics, Sefaria, PocketTorah) bypass
  the worker, so those resources are **not** available offline.

### Rule: bump the cache version when you change a precached asset

After editing **any** file that the service worker serves — an HTML page, `pwa.js`,
an icon, a splash image, the manifest, or `CORE_ASSETS` itself — bump `VERSION`
in `sw.js`:

```js
const VERSION = 'v154';   // cache "ivritsuite-v154" — bump whatever value you find (v154 → v155, etc.)
```

Renaming the cache makes the new worker delete the old cache on activate and
re-precache from scratch. Pages and `pwa.js` are network-first so they self-refresh
online, but bumping `VERSION` is the safe catch-all (and the only way to refresh
the **cache-first** static assets and the offline copy). This is the service-worker
cache version — separate from the user-facing splash version (`VERSION` in
`splash/gen_splash.py`).

---

## Verifying changes — headless Playwright recipe

The repo has **no test infrastructure** (no package.json, no test files — hand-authored static
HTML). Verify changes end-to-end by driving the real page headless. Proven recipe:

- Playwright is preinstalled globally. Import in an `.mjs` script as:
  ```js
  import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
  const { chromium } = pkg;   // CJS module — a named import fails
  ```
  Chromium is preinstalled (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`) — never run `playwright install`.
- Load the page as `file://…/<page>.html` with `waitUntil: 'domcontentloaded'`, and **route-abort
  every non-`file:`/`data:`/`blob:` request** — otherwise `page.goto` hangs on Google Fonts/gtag:
  ```js
  await page.route('**/*', r => { const u = r.request().url();
    (u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) ? r.continue() : r.abort(); });
  ```
  The aborted resources produce console "Failed to load" errors — expected noise. Assert on the
  `pageerror` event count (should be 0) instead of console errors.
- Dismiss auto-open modals before testing:
  `document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'))`.
- Font Maker fixtures: a traced letter's contours are `[{points: [[x,y], …]}]` — renderers like
  `glyphPathAt` read `.points`, and wrong shapes throw deep inside `renderSpacingPreview`. To test
  export paths offline, stub `window.loadPyodide` with a fake returning
  `{loadPackage: async()=>{}, runPython: ()=>{}, globals: {set: ()=>{}}}`.
- Headless focus quirk: `el.focus()` on the page's real inputs may not stick (activeElement stays
  BODY). When testing typing guards, inject a temporary `<input>` and use `page.focus()` on it.
- Test matrix: light **and** dark (`toggleDark()`), desktop (~1280px) **and** stacked (~800px) viewports.

---

## Deploy — how changes reach ivritsuite.com (GitHub Pages)

Static GitHub Pages, custom domain `ivritsuite.com` (`CNAME`), `.nojekyll`, **no CI/build step**.
Every push to `main` auto-triggers a "pages build and deployment" Actions run — that run, not the
push, is what updates the live site.

- **Rapid successive pushes cancel in-flight deploys** — after a burst of commits only the last
  deploy runs. Prefer batching; always confirm the final run concluded `success`.
- **Transient Pages failures happen** (observed: the "Deploy to GitHub Pages" step hanging to a
  10-minute timeout, fast "Deployment failed, try again later" errors, and job re-runs wedging in
  `queued`). The build/artifact steps succeeding while deploy fails = GitHub-side issue. The
  reliable re-trigger is an **empty commit pushed to `main`**; if it keeps failing, wait for the
  incident to clear (githubstatus.com) rather than hammering.
- **"I can't see the changes" debug order**: (1) confirm the file bytes on `main` (GitHub file
  view/API); (2) check the latest pages-build-deployment run's conclusion; (3) was `sw.js`
  `VERSION` bumped for the edited precached files?; (4) browser cache — hard refresh
  (Cmd/Ctrl+Shift+R) or fully reopen the installed PWA.
- **Pages must stay at repo root**: every tool fetches its data by relative path
  (`fetch('data/…')`), and cross-page links/manifest/sw registrations assume root. Never move a
  page into a subfolder (this is also why extensionless "clean URLs" via `foo/index.html`
  restructuring was evaluated and rejected — it breaks every relative `data/` fetch).
- **Keep `sitemap.xml` `<lastmod>` fresh** with `node scripts/update-sitemap.mjs` (plain Node, no
  deps). It maps each `<loc>` to its file, reads that file's last commit date via
  `git log -1 --format=%cs`, and rewrites only the `<lastmod>` values (changefreq/priority/format
  untouched). Run it as the **last step** of any session that changed page content, so dates reflect
  that session's commit. It's idempotent (re-running with no new commits is a no-op) and produces
  per-file dates. When you add a new page, add its `<url>` block to `sitemap.xml` first, then run
  the script. Sits alongside the `sw.js VERSION` bump in the end-of-session checklist above.
