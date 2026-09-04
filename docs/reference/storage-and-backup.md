# Storage & backup — reference

> Binding rules live in `CLAUDE.md`; this file is how the existing systems work. Keep it free of session ids, dates and digests.

## Import / Export All Settings (`index.html`)

`index.html` has a gear button that opens a modal with **Export All Settings**, **Import All Settings**, and **Erase All Settings**. These functions bundle every tool's localStorage data into a single JSON blob so users can back up and restore everything in one step.

### Current localStorage keys included

| Blob key | localStorage key | What it holds |
|---|---|---|
| `generatorPresets` | `hebrewBlender_presets` | Hebrew Blend Generator saved presets |
| `dashboardPresets` | `hebrewDashboard_presets` | Classroom Dashboard saved presets |
| `dashboardSchedules` | `hebrewDashboard_schedules` | Classroom Dashboard saved schedules (legacy single-day `[{preset,until}]` arrays AND v2 weekly entries `{v:2, week:{…}}` — both shapes coexist in the same map) |
| `dashboardSettings` | `hebrewDashboard_settings` | All Classroom Dashboard settings (zoom, video URL, header size, Jewish-calendar widget toggles `showHolidayCountdown`/`showShabbatTimes` (Shabbat times reuse the weather `location`), Timer toggles `showTimer`/`showTimerFullscreen`, Omer toggles `showOmerCounter`/`showOmerEnglish`/`showOmerProgress`, the weekly Schedule Sync grid `scheduleWeek` (present only once a user builds/imports one — its presence selects the weekly engine) + the class-color map `presetColors`, the drawer's `panelsCollapsed` map, etc.) |
| `flashCardPresets` | `hebrewFlashCards_presets` | Flash Cards saved presets |
| `blenderLastState` | `hebrewBlender_lastState` | Generator last-session state (the `?s=` share-state diff, persisted on change); object blob, empty = never-set (skipped on import) |
| `generatorPresetFolders` / `dashboardPresetFolders` / `dashboardScheduleFolders` / `flashCardPresetFolders` / `flashCardProfileFolders` | `hebrewBlender_presetsFolders` / `hebrewDashboard_presetsFolders` / `hebrewDashboard_schedulesFolders` / `hebrewFlashCards_presetsFolders` / `hebrewFlashCards_profilesFolders` | The five folder trees (`{v:1,root:[…]}`) that organize the preset lists — see "Nested Folders" below. Always merged via `ftImportTree(key, incoming, false)`, **never** `Object.assign` (that clobbers `root`) |
| `flashCardSettings` | `hebrewFlashCards_settings` | All Flash Cards live settings (mode, selected letters/vowels, color-coding, fonts, timer, number/color/emoji sub-modes, word-list selections, etc.); flat settings blob merged field-by-field via `ivritSafeAssign` |
| `flashCardPbStreak` | `hebrewFlashCards_pbStreak` | Flash Cards personal-best streak (scalar string; imported as the **max** of existing vs incoming) |
| `flashCardProfiles` | `hebrewFlashCards_profiles` | Flash Cards saved profiles (import merges via `mergeFlashCardProfiles`) |
| `dictAudioEnabled` / `dictTranslitStyle` / `dictTtsRate` / `dictEmojiSettings` | `hebrewDictionary_*` | Hebrew Dictionary settings |
| `dictLastState` | `hebrewDictionary_lastState` | Dictionary last filter/session state (`getDictState()` minus the search query); object blob merged via `ivritSafeAssign`, empty = never-set (skipped on import) |
| `wordLists` | `ivritSuite_wordLists` | Suite-wide saved Word Lists (`{v:1,lists:{}}`); merged one level deep via `wlMergeIntoStorage` so a shallow assign can't clobber `lists` |
| `torahTrainerSettings` | `hebrewTorahTrainer_settings` | Torah Trainer settings |
| `tropeTutorSettings` | `hebrewTropeTutor_settings` | Trope Tutor settings (tradition, font, drill toggles, playback rate); object blob merged via `ivritSafeAssign`, empty = never-set (skipped on import) |
| `tropeTutorProgress` | `hebrewTropeTutor_progress` | Trope Tutor mastery (`{v:1,tropes:{key:{r,w}},families:{},pbStreak}`); imported via `tropeProgressMerge` — per-trope `r`/`w` and `pbStreak` as **max** of existing vs incoming, visited families as **union** (never a shallow assign) |
| `userFonts` | *(IndexedDB `ivritsuite-fonts`, not localStorage)* | Custom fonts, base64-bundled at export — see "My Fonts" section |
| `inputMode` | `hebrewBlender_inputMode` | Backup UI preference: `'auto'` (.ivrit file) or `'manual'` (text block) — see ".ivrit Save Files" below |
| `hebFont` / `hebFontSize` | `hebrewBlender_hebFont` / `_hebFontSize` | Shared Generator+Dictionary display prefs (selected Hebrew font + size); scalar strings, empty = never-set (skipped on import) |
| `livePreview` | `hebrewBlender_livePreview` | Generator live-preview toggle (`'1'`/`'0'`); scalar string, empty = never-set (skipped on import) |
| `kbdLayout` | `hebrewBlender_kbdLayout` | On-screen Hebrew keyboard letter-layout choice (`'abc'` \| `'qwerty'`), site-wide across every keyboard carrier; scalar string, empty = never-set (skipped on import) |
| `fmLastAuthor` | `hebrewFontMaker_lastAuthor` | Font Maker onboarding wizard's remembered author name; scalar string, empty = never-set (skipped on import) |
| `uiLang` / `darkMode` | `hebrewBlender_lang` / `hebrewBlender_darkMode` | The suite-wide UI-language choice (`'en'`\|`'he'`) and theme choice (`'1'`\|`'0'`). Registered on the maintainer's call: these are **identity** prefs, not per-device ones — the language especially is what a Hebrew-reading teacher would most notice losing on a new machine. `uiLang` is **validated on import** against `I18n.supported` (via `_ivLangOk`) because every page's no-flash `<head>` IIFE reads the stored value unvalidated; `darkMode` accepts only the two literal strings, so a stored `'0'` survives the surrounding truthiness tests |
| `generatorPanels` / `flashCardPanels` / `dictPanels` | `hebrewBlender_panels` / `hebrewFlashCards_panels` / `hebrewDictionary_panels` | Which collapsible panels the user left open, for the three tools with no settings blob of their own (the dashboard, Torah Trainer and Trope Tutor carry theirs as `panelsCollapsed` inside their own settings blob). Flat `{data-i18n key: bool}` maps merged via `ivritSafeAssign`; empty = never-set (skipped on import). See [Panel-collapse memory](#shared-ux-components--the-conventions-all-tools-are-converging-on) |

### Rule: any new tool with persistent data must be added here

When a new tool is added to this site that saves **any** data to `localStorage`, its key(s) must be added to all three functions in `index.html`:

**`exportAllSettings`** — add one entry to the blob object:
```js
myToolPresets: JSON.parse(localStorage.getItem('hebrewMyTool_presets') || '{}'),
```

**`importAllSettings`** — add a corresponding merge block:
```js
if (parsed.myToolPresets) {
  const existing = ivritSafeParse(localStorage.getItem('hebrewMyTool_presets') || '{}');
  localStorage.setItem('hebrewMyTool_presets', JSON.stringify(ivritSafeAssign(existing, parsed.myToolPresets)));
}
```
Use `ivritSafeAssign` (never bare `Object.assign` — CLAUDE.md Security rule 1) so importing merges with existing data rather than wiping it, drops the prototype-pollution keys, and ignores a non-object value (a string or array would otherwise spread element-by-element into garbage entries). If a key holds a flat settings object (not a presets map), use `ivritSafeAssign` the same way — the imported values overwrite the existing ones field-by-field.

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
  means fresh start**, so add them to `eraseAllSettings`. Also in this erase-only set today:
  `hebrewDashboard_purgeDismissed`, `hebrewBlender_pwaDismissed`, `hebrewFontMaker_inputMode`, and the
  Font Maker's `hebrewFontMaker_uiPrefs` workspace-prefs blob. (Per-device UI prefs like `hebrewBlender_zoom`,
  `hebrewBlender_hideZoomBar`, the resizable-panel width keys (`hebrew<Tool>_<thing>W` — see
  [Resizable panels](#resizable-panels-sidebars-drawers-rails--shared-component), all erase-registered),
  and transient caches like `hebrewDashboard_shabbatCache` are also legitimately export-exempt.)

Reconcile whenever you touch storage: every key a tool writes should be *either* registered in all three
functions *or* consciously in the exempt set above. Treat a key that is real data yet missing from
export/import as a bug to fix, not a pattern to copy.

---

## .ivrit Save Files (Automatic Input) — **REQUIRED on every tool with presets/settings**

Users back up and restore via a downloadable **`.ivrit` file** (a plain JSON text file with a custom extension) — a portable "save file" they keep on their own computer. This is the **default, preferred** backup mechanism going forward. Every tool's backup area has an **Automatic Input / Manual Input** toggle at the top:

- **Automatic Input** (default) — a *Save to .ivrit file* button plus a drag-and-drop / browse zone for restoring. **This is the norm — build it into every new tool.**
- **Manual Input** — the legacy copy-and-paste textarea (kept for users who already have text backups).

The toggle choice is remembered site-wide in `localStorage['hebrewBlender_inputMode']` (`'auto'` | `'manual'`).

Implemented on: `hebrew_blend_generator.html` (tool `Worksheet`), `classroom_dashboard.html` (`Dashboard`), `flash_cards.html` (`FlashCards`), and `index.html` (`AllTools`). The Dictionary, Torah Trainer, and Trope Tutor have no presets of their own — their settings are backed up **only** through the `AllTools` file on `index.html`.

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
- **Merge** — keep current data, add the file's (matching keys overwritten via `ivritSafeAssign`).
- **Replace** — clear current data first, then load only the file's.
- The prompt is an accessible dialog on every carrier, the hub's adapted copy included: `role="dialog"` + `aria-modal` + `aria-labelledby=ivritAskTitle`, focus lands on Merge, Tab is trapped across the three buttons, Escape cancels, and focus returns to the opener. The hub's copy additionally stops the handled Escape/Tab so its document-level AllTools-modal handler does not close that modal behind the prompt — keep that when re-syncing it from the engine.

### Pattern: per-file `IVRIT_CFG` + shared engine

Each file defines a small **`IVRIT_CFG`** object, then pastes the **shared engine** verbatim (the block between the `═══ IvritSuite .ivrit save-file engine ═══` comment markers — it is byte-for-byte identical across the three tool pages (generator, flash cards, dashboard; the `showAppToast` interleave that once broke this was extracted into its own shared block, re-unifying the engine); copy it, don't rewrite it. The restore-success path calls the shared **`showAppToast`** (non-blocking toast), not a blocking `alert()`. **Exception:** `index.html` carries a deliberately adapted AllTools superset of the engine — extra `wlMergeIntoStorage`, a legacy-blob payload shape, and a "reload open tool pages" success `alert()` (kept as a blocking, actionable instruction; index has no `showAppToast`) — do not "fix" it back to the shared text).

**Shared `app-toast` block.** `showAppToast(msg, ms = 2600)` + `let _appToastTimer` live in a byte-identical `/* ═══ shared: app-toast ═══ … ═══ end shared: app-toast ═══ */` JS block placed immediately **before** the `.ivrit` engine block, with a matching `/* ═══ shared: app-toast CSS ═══ … */` block (the `#appToast` rules + a self-contained `@media (prefers-reduced-motion)` neutralizer) in each `<style>`. Both blocks are identical across `hebrew_blend_generator.html`, `classroom_dashboard.html`, `flash_cards.html`, and `hebrew_dictionary.html` — copy verbatim, like `ivritsuite-fonts` / folder-tree. The dictionary has **no `.ivrit` engine** (AllTools-only backup), so its copy sits immediately before the shared `ivritsuite-fonts` block instead — the placement rule is "before the page's first shared block", and the marker comment's carrier list must be re-trued in **all** carriers whenever one is added, so the blocks stay byte-identical. `index.html` does **not** carry it. Torah Trainer's `showHintToast` and the Trope Tutor's `showToast` are separate sibling toasts with distinct ids/selectors — not part of this block.

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
      localStorage.setItem('hebrewMyTool_presets', JSON.stringify(ivritSafeAssign(base, incoming)));
      renderPresets();
    }
    if (data.liveState) applySettings(data.liveState);
  }
  // needsReload: true  → set this if there is no clean live re-apply path; the engine then skips the success alert and you reload in apply()
};
```

The shared engine provides: `ivritDateStamp`, `ivritStatus`, `setIvritMode`, `ivritSaveFile`, `ivritAskMode`, `ivritToolMismatch`, `ivritRestore`, `ivritReadFile`, `ivritInit` (auto-runs on DOM ready). It depends only on `IVRIT_CFG` and the standard UI element IDs.

### Required UI markup (in the backup area)

The shared `.ivrit-*` CSS block (with `var(..., fallback)` colors so it works on any page) + the toggle + `#ivritAuto` (Save button, `#ivritDrop`, `#ivritFileInput`, `#ivritStatus` — which carries `role="status"` so save/restore feedback is announced to screen readers) + `#ivritManual` (the legacy textarea, `display:none` by default). Copy an existing page's markup (e.g. the Generator's "Backup Presets" sub-panel).

Unlike the JS shared blocks, this `.ivrit-*` CSS is **convention-shared but deliberately NOT `═══`-marked byte-identical**: the *rules* are identical across the generator/dashboard/flash_cards copies, but leading indentation legitimately differs because the block sits at a different `<style>` nesting depth in each file. A Pass F consistency sweep should treat that indentation delta as expected, not drift — do not "fix" it to byte-identity (it would only mis-indent two of the three copies against their surrounding CSS). 

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

(`torah_trainer.html`, `hebrew_dictionary.html`, and `trope_tutor.html` have no preset collection
of their own — they persist a single `settings`/last-state object instead, so the equivalent
obligation there is to add every new control to that object's save/restore path.)

**Restore paths use `??`, never `||`, for numeric/boolean fields.** `x = s.field || default`
silently discards a legitimately-stored `0`/`''`/`false` (the recurring "falsy-zero" bug —
`cardCount || 10` turns a saved 0 into 10). Use nullish-coalescing (`s.field ?? default`) so only
`null`/`undefined` fall back. This applies to counts, sizes, positions, indices, and toggles-as-
numbers in `applySettings`/size-setter restores. Leave `||` for genuine display fallbacks on
possibly-missing DOM and for array/object defaults (`s.list || []`), which carry no falsy-zero risk.

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
  `overflow:hidden` panel (e.g. the dashboard settings drawer). **Keyboard contract** (the flash
  cards sheet-menu idiom — keep it when re-syncing the block): the Move ▾ / ↗ trigger carries
  `aria-haspopup="menu"` + `aria-expanded`; the menu is `role="menu"` of `role="menuitem"` buttons,
  labelled from the trigger; focus moves to the first item on open; Tab/Shift+Tab and ↓/↑ cycle
  inside it (it sits at the end of `<body>`, so Tab would otherwise leave the page); Escape closes
  it and returns focus to the trigger, and is stopped there so a page-level Escape (the dashboard
  drawer's) does not also fire; an outside click closes without moving focus; choosing a
  destination re-renders the tree and puts focus on the moved node's own Move button.
- Folder CRUD: New folder / New subfolder / Rename (`prompt`) / Delete (`confirm`; children move up
  — underlying items are NEVER deleted). Collapse state lives on the folder node (persists + backs up).

### Rule for any new preset-bearing list
1. Render it with `mountFolderTree(cfg)` (don't hand-roll rows; reuse the existing action functions
   in `buildItemRow`). The old `makeSortable` is superseded for foldered lists. (The dashboard no
   longer carries `makeSortable` at all — its last consumer, the schedule row builder, was replaced
   by the weekly Schedule Sync grid editor; the generator/flash-cards copies remain
   for their own non-foldered rows.)
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

