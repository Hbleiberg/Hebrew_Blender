# Hebrew Font Maker — reference

> Binding rules live in `CLAUDE.md`; this file is how the Font Maker's internals work. Line numbers drift constantly — locate everything by pattern.

## Hebrew Font Maker (`Hebrew_Font_Maker.html`)

The largest file in the repo by a wide margin — a single-file app of roughly 20,000 lines and growing fast and unevenly. If a count actually matters, measure it (`wc -l Hebrew_Font_Maker.html`). **Line numbers drift
constantly** — never trust remembered or previously-reported line numbers; locate everything by
pattern (function names, marker comments, element ids).

### Versioning + changelog (mirror of the sw.js/splash rules)
`const FONT_MAKER_VERSION` — "bump on release; add a matching Changelog entry in the About tab."
The changelog is the list of `<li><strong>vX.Y</strong> —…` entries inside `HELP_CONTENT.about`
(prepend the new entry at the top, in the same friendly plain-language voice, with a `(Month Year)`
suffix). For multi-feature work, batch **one** combined bump + entry at the end — not one per feature.

### Backup exemption + localStorage keys
The Font Maker's **project data** is deliberately **NOT** in the index.html AllTools export/import/erase —
it doesn't fit the presets model. Its keys are local-only: `hebrewFontMaker_uiPrefs` (workspace UI
prefs JSON blob — read/modify/write via `wsReadPrefs()`; put new persistent UI prefs **here**, not in
new bare keys), `hebrewFontMaker_tourDone`, `hebrewFontMaker_inputMode`,
`hebrewFontMaker_mobileWarnDismissed`, `hebrewFontMaker_autosave` (image-stripped fallback), and
`hebrewFontMaker_recentProjects` — the old Recent list, now only a browser without IndexedDB's store and the
source of a one-time move (read through `legacyRecentList()`, which keeps only `{name: string, data: object}`
members of an array). The **IndexedDB** db `hebrewFontMaker` (version 2) holds the primary autosave (store
`autosave`, gzip blob, id `'current'`) and the Recent list (stores `recent` `{name, savedAt}` and `recentData`
`{name, json}`, both keyed by the derived name). Every connection closes after its transaction and on a version
change; an upgrade an older tab blocks gives up after 4 s, and the page then uses the localStorage fallbacks.
The autosave is written by
`autosaveNow()` one snapshot at a time: a request while one is being written is not dropped — the writer runs
once more when it finishes (`_autosaveAgain`), so the newest edit always reaches the snapshot. Shared
site-wide key it also reads: `hebrewBlender_darkMode`. **One AllTools exception:**
`hebrewFontMaker_lastAuthor` (the onboarding wizard's remembered author name — a scalar identity pref
like `hebFont`, not project data) IS registered in all five AllTools sites as `fmLastAuthor`. A project's
**cloud copy** (optional, per project, in the signed-in account) is the section below — it is the third
place a project can live, next to the `.hebrewfont` file and this browser's Recent/autosave copies, and
never replaces either.

### Cloud projects (account copies) — `IvritProjects`
The page loads `/js/supabase-config.js`, `/js/ivrit-account.js`, `/js/ivrit-saves.js` and
`/js/ivrit-projects.js` (the last is loaded here and by `account.html`; it owns every `font_projects` and Storage call —
`docs/reference/accounts-and-cloud.md` → Font Maker projects). The page owns the project format and the UI:
- **Identity** rides in the project: `project.cloudId` (the `font_projects` row) and `project.cloudRev` (the
  row's `updated_at` this copy last matched). They are the only two fields written outside `udDo` — identity,
  not undoable content. Absent = never saved to an account. `commitSaveAs` deletes both from the copy (a copy
  is a new project); `loadProjectFile` keeps a file's `cloudId` only when the signed-in account's list has it
  (`fmCloudClaim`); `newProject()` and `applyProjectData()` call `fmCloudReset()`.
- **Pack / unpack at the boundary, never inside the live project**: `fmCloudPack(project)` never copies the
  project (a deep clone of a photo project froze the page at every 10 s save). At every raster slot
  (`fmRasterSlots`: letters' and marks' `source.dataUrl`, `combinedSheets[].dataUrl`,
  `font[cat].combinedImage.dataUrl`) it first names each new photo — decodes the data URL by hand
  (`fmDataUrlToBlob` — the CSP has no `data:` in `connect-src`), keeps the ORIGINAL bytes and type (jpeg / png /
  webp; anything else is redrawn to PNG), hashes them (`fmHashBytes`, 16 hex of SHA-256) — repeating until a
  pass names nothing new, then in one synchronous pass writes the JSON with a replacer that puts the string
  `'cloud:<hash>.<ext>'` in each slot (so the file is one moment's project); drawn letters (`source.kind === 'draw'`) are stripped to `null` (`drawEnsureRaster` rebuilds them),
  SVG sheets and `template.customFonts[].dataB64` stay inline; a `cloudSources` manifest is added. The runtime
  `_cloudNames` map (data URL → object name) means an unchanged photo is never re-encoded or re-uploaded.
  `fmCloudUnpack(data, id)` downloads the referenced objects (4 at a time) and puts data URLs back BEFORE
  `applyProjectData`, so `imgCache` keys, `traceSig` and every synchronous reader see exactly what they see
  today. A photo that fails to download becomes `null` and is counted on the status strip
  (`fontmaker.cloud.photos_missing.one` / `.other`); `fmCloudOpen` leaves that count as the sticky message
  after the open, and says "Opened from your account" only when nothing is missing.
- **Saving**: Save Project ▾ → `fmCloudMenuRow()` (a sign-in row when signed out); `fmCloudSave()` shows one
  dialog the first time, then `fmCloudWrite(mode)`: probe the row (`IvritProjects.get`), compare its
  `updated_at` with `cloudRev` (a mismatch raises the conflict dialog — Overwrite / Keep both via the Save-as
  recipe, its copy named clear of the account's project names as well as Recent's / Not now, which pauses autosave), pack, gzip (rewrapped as `application/gzip`), `IvritProjects.save`
  with progress phases through `status()` inside `ipArm(0)`, then `cloudId`/`cloudRev` are set and a local
  `autosaveNow()` records the revision (`cloudRev` + `cloudClean` on the IndexedDB record). `markDirty()` also
  sets `_cloudDirty`, bumps the edit counter `_cloudGen` and arms a 10 s `fmCloudAutosave()` (skipped while signed
  out, offline, busy or paused; an `online` event re-arms). A save marks the project clean only when no edit came
  in while it uploaded (`_cloudGen` unchanged since the write started); otherwise it stays dirty and re-arms, so an
  edit made during an upload is never recorded as saved. An automatic save (`'auto'`, `'signout'`) only ever updates
  the row the project is linked to: when that row is not in the signed-in account (the project came from another
  teacher's session on a shared browser, or the row was deleted), it does nothing — never an insert into the account
  now signed in — and only an explicit Save makes a new row. The toolbar `#cloudPip` (Saved / Saving… / Unsaved / Couldn't save — click to
  retry) is shown only while the project has a `cloudId` and someone is signed in; `beforeunload` also warns
  while `_cloudDirty || _cloudBusy`. *Continue where you left off* (`_bootLaunchPrompt`, and the `?start=` boot's
  Continue) from a snapshot whose `cloudClean` is `false` — the tab closed, the teacher signed out inside the
  autosave window, or the save failed offline — resumes the cloud save (`fmCloudResumeAfterRestore`: `_cloudDirty`
  set, armed at once when signed in, else at the next sign-in); `fmCloudWrite`'s revision check still catches a
  newer account copy.
- **Opening**: Load Project ▾ gets an "In your account" section (`fmCloudLoadSection` + the asynchronous
  `fmCloudFillLoadMenu`, which writes only into the still-open menu); its rows use their own classes
  (`.load-menu-cdel`, `.load-menu-cdl`) so `reopenLoadMenu`'s 🗑 index keeps counting Recent rows.
  `fmCloudOpen(id)` is local-first (the IndexedDB snapshot with the same `cloudRev` and `cloudClean` needs
  no download), else download → unpack → `applyProjectData`. `fmCloudDelete(id)` closes the menu, confirms,
  removes row + objects, reopens the menu; when the row is the open project's, it drops `cloudId`/`cloudRev` and
  rewrites the local snapshot (`autosaveNow()`), or a reload's Continue would relink the project to a row that is gone. The Exported ✓ dialog gains `fmCloudKeepExport(dlFile)` (the
  snapshotted file, ≤ 5 MB; it passes `cloudRev` and adopts the row's new revision only when no other device moved the
  row first, so a kept export never hides that device's save from the next save's check) and a row with an export shows ⬇
  (`fmCloudDownloadExport`).
- **Guards**: `udShortcutBlocked()` and the global keydown return early while the saves module's device-extras
  card (`.ivsav-overlay`, the one overlay it opens) is up, so a keypress meant for it does not reach the editor's
  own modal. Strings are
  `fontmaker.cloud.*` through `_cT(key, fallback, params)` (the `_pT` shape); `fmMb` formats sizes.
- **The account page** (`account.html`) never opens a project here: its download-everything zip rebuilds a
  `.hebrewfont` from the cloud copy through `IvritProjects.projectFile(id)` — the module's own generic walk over
  the `cloud:` strings the packed manifest names, photos put back as data URLs, `cloudSources` dropped — so the
  file is what Save Project writes. `fmCloudUnpack` stays the path for opening in this page.
- **Signing out** (the chip, the name step's *Sign out instead*): `init()` registers `fmBeforeSignOut` on
  `IvritAccount.onSignOut`, so the last edits are safe before the session goes — the cloud timer is cancelled,
  a dirty project's local snapshot finishes (it waits for one already in flight, runs `autosaveNow()` and waits
  for that one, up to 4 s each), and a cloud project with changes the account has not received is saved to it
  (`fmCloudWrite('signout')`, after up to 6 s for a save already running; a conflict found then raises no dialog
  — the project stays dirty and the snapshot keeps it) — except on a `keepLocal` sign-out (the account is gone or
  going: saving would put a project back into it), while paused, or offline. The account module runs every page's
  hooks in parallel, each bounded at 10 s; anything unfinished stays in the snapshot and resumes later. *Continue*
  from the image-stripped localStorage fallback (`hebrewFontMaker_autosave`) detaches the project from its cloud row
  (`cloudId`/`cloudRev` dropped), so a save of that copy can never replace the account's copy and its photos. The page is not reloaded after a sign-out
  (`IvritSaves.needsReload()` is false on a page that attaches only `Suite`), so the open project stays —
  in this tab's own sign-out and when another tab signs out.
- **The account's own rows**: the boot wiring calls `IvritSaves.attach({ tool: 'Suite' })`, so the suite-wide
  preferences (`hebrewFontMaker_lastAuthor` among them) and My Fonts hydrate here like on every module page (the
  `ivritsuite:fonts` listener re-lists them, and an `ivritsuite:prefs` listener in `init()` follows a downloaded
  theme through `toggleDark()`); the remove-font modal calls `IvritSaves.fontDeleted(name)` while a session is
  stored (`IvritAccount.hasStoredSession()`) — the one way a font leaves the account — and while one is
  stored its body says the font leaves the account and the other devices too
  (`fontmaker.modals.remove_font_body_cloud` in place of `remove_font_body`). No status line
  and no summary hook here: the account page counts the projects.
- **Test**: `node scripts/smoke-fontmaker.mjs --sdk <supabase.js>` (port 8082) replays the whole flow
  against a fake cloud that also fakes Storage.

### "Load Project ▾" menu + the Recent list

**The Recent list has no cap, and nothing leaves it except through its 🗑** (a Recent row can be a project's only
copy). `pushRecentProject(p)` serializes the project at once, then writes both stores in one transaction — the newest
copy of a derived name (`recentNameOf`, the style included) replaces its earlier row, the old doubled "X - X" name
goes with it, and no other row is ever touched; it resolves `false` when the write is refused, and every row stays.
`saveToBrowser()` shows its "couldn't save" modal on `false`; the other savers (To computer, Save as…, the account
save, Keep both) go through `pushRecentQuiet`, which says so in a toast (`fontmaker.status.recent_failed`).
`recentReady()` moves an old localStorage list into IndexedDB once (a newer row already there wins), reads every
name back, and only then removes the key; a failure keeps the key and leaves the old list as the store for that
load. `recentList()` reads only the `{name, savedAt}` rows (newest first) and keeps `_recentNames` in step for the
synchronous `fmUniqueCopyName`; `recentGet(name)` reads one project through `ivritSafeParse`. A browser without
IndexedDB keeps the old localStorage list under the same rule: no cap, a save that does not fit is refused.

`toggleLoadMenu(ev)` only toggles; `openLoadMenu(anchor)` builds and positions the popup and is also
what puts it back after a confirm, so the anchor it was hung off lives in `_loadMenuAnchor`. Two
buttons call it: the toolbar's "Load Project ▾" and the wizard's "Open a project ▾".

The Recent rows arrive asynchronously (`fmRecentFillLoadMenu`, into `#loadMenuRecent`, which scrolls past 45vh,
only while that very menu is open — the same rule as the account rows); names reach the page through
`textContent` and the buttons through listeners. Each Recent row is a `.load-menu-row` flex wrapper holding the load
button **and** a `.load-menu-del` 🗑 as siblings — a button cannot nest inside a button, and keeping them apart also
keeps the trash out of the load hit area. `removeRecentProjectUI(name, savedAt, idx)` closes the menu **before** raising its
`askModal`: `.load-menu` is `z-index: 300` and `#askOverlay` only `201`, so a menu left open paints
over its own confirm. Either answer calls `reopenLoadMenu(idx)`, which re-anchors the menu (skipping
it when the anchor is gone or off-screen) and focuses the neighbouring 🗑, so clearing several stale
rows is Enter, Enter, Enter (it waits for the Recent rows before focusing).

`removeRecentProject(name, savedAt)` deletes by **identity, not index** — the confirm is async, and a save behind it
may have replaced the row with a newer copy, which then stays.
Nothing here touches `project`, so there is no `udDo`/`markDirty` — this is the local Recent cache,
not project state.

### New-font onboarding wizard (`#wizardOverlay`)
Replaces the old welcome card. Boot runs one launch decision from the `I18n.ready`-gated
`maybeRestoreAutosave()`: restorable snapshot → the Continue/Start-fresh prompt (Continue never shows
the wizard); Start fresh or no snapshot → `wizardOpen('gate')` (Esc/backdrop inert — no-op `closeFn` +
no backdrop `onclick`; the header's "Open a project ▾" is the exit; loading any project closes it via
`applyProjectData`). `applyProjectData` treats every `.hfm`/autosave/recents blob as untrusted: a
missing or non-object `font` block, or a `migrateProject` throw, is refused with the "Not a valid
project file" status before `project` is reassigned, and `migrateProject` reduces every collection
(`letters`, `combinedSheets`, `precomposed`, `guides.items`, `template.customFonts`) to its plain-object
members and nulls a letter's malformed `source`/`transform`/`contours`/`curves`/anchor blocks so the
backfills re-seed them. Toolbar **New** = `wizardOpen('new')` (cancellable; Esc/backdrop/Cancel leave the
current project untouched — nothing is discarded until "Create font"). `_launchDecided` makes the boot
decision one-shot; the mobile-warn deferral baton (`_autosavePromptDeferred`) now resumes
`maybeRestoreAutosave` directly. `aCloseModal` re-arms the wizard's focus trap after a stacked modal
(help/`askModal`) closes over it; `udShortcutBlocked()` includes `wizardOverlay`. The wizard's finish
handler goes through the real setters (`setMarkEnabled`, `setAdd*`, `setInputMode`) — keep it that way.

### UI primitives — never hand-roll these
- **Modals**: `.overlay`/`.modal` markup opened via `aOpenModal(id, closeFn)` / closed via
  `aCloseModal(id)`. `_activeModal` + the global keydown provide the focus trap and Escape-to-close —
  never add your own trap. Every `.overlay` shares `z-index: 200`, so DOM order alone decides which paints
  on top; `aOpenModal` therefore lifts a modal opened over another open one to one layer above the highest
  open `.overlay` (an inline `z-index` that `aCloseModal` clears). Without it, Help opened from the wizard's
  license "?" (and Shortcuts reached from that Help) painted beneath the wizard, which sits later in the page.
- **Confirmations**: `askModal(title, bodyHtml, buttons)` with `[{label, cls:'ghost'?, onClick}]`.
  `#askOverlay` sits one z-index layer above the other `.overlay`s, so a confirmation raised over the
  wizard, help, QA, My Fonts or mobile-warn overlay is the one under the pointer.
  It auto-closes before running `onClick`; to make elements inside the body interactive (like the
  export-warning letter chips), wire listeners on `#askBody` **after** the `askModal(...)` call.
- **Toasts**: `status(msg, sticky)` — auto-clears after 4 s (a long message longer: 50 ms per character, 8 s at most) unless `sticky`.
- **Long waits**: `ipArm(delay)` / `ipClose()` — the `#importProgressOverlay` busy modal (the ONLY
  modal in the file that isn't a decision point). `status()` mirrors into its phase line, so every
  message the operation already emits shows where the eye is; `ipOpen` seeds from `#statusMsg`'s
  current text, since the engine's phases fire before the modal opens. Use `ipArm`, never `ipOpen`:
  the delay (default 400ms, and `ipArm(0)` on the partner `?start=` path where a cold engine is
  guaranteed) is what stops a warm run from flashing a modal. It is button-less and Escape-inert
  (cancelling mid-import would leave a half-imported project), so **every** exit path must close it
  — `applyFontImport` does it in a `finally` plus explicitly the moment `renderGrids()` reveals the
  glyphs, which is also what keeps it from suppressing the fidelity report's auto-open. Its
  indeterminate bar carries a **component-local** `@media (prefers-reduced-motion)` neutralizer with
  `animation: none`: a media query adds no specificity (an override in the global block near the top
  of the file loses to the base rule below it), and the global block only shortens the duration —
  an infinite animation never ends, so its keyframes would park the bar off-track.
  - Page-level toast helpers elsewhere in the suite (for the toast-adoption candidate): generator
    `showAppToast` (`hebrew_blend_generator.html`), torah `showHintToast` (`torah_trainer.html`),
    generator preview banner `showPreviewNotice`; plus the `.ivrit` engine's `ivritStatus` for
    save/restore feedback.
- **Escaping**: use `esc()` (escapes all five metacharacters, including `'`). This is the
  canonical helper across the suite; the older `escapeHtml()` (which didn't escape `'`) was
  removed and all its call sites migrated to `esc()`.
- **Global keyboard shortcuts**: start the handler with the `udShortcutBlocked()` guard (blocks
  while typing or when ask/help/QA overlays are open), and register the shortcut in BOTH the `?`
  cheat sheet (`shortcutGroups()`) and the triggering button's `title=` tooltip.
- **A key press that closes a dialog is the dialog's, not a shortcut's.** A dialog closes in the
  middle of the key's own dispatch — the modal trap on Escape, a dialog's own handler on Enter — and
  the handlers that run afterwards for that same key find no dialog and focus back on the opener, so
  nothing told them to stand down: Escape used to clear the points selected in Edit points (or leave
  the step, cancel a keyboard crop box, drop a stroke selection), and Enter to finish a crop or a
  pen contour. Two things stop that. The trap calls `stopImmediatePropagation()` on the Escape it
  spends. And a capture listener on `window` notes the number of open dialogs (`openDialogCount()`:
  `.overlay.open` plus the account screen) before any handler sees a key; `keyClosedADialog()` is
  true while that key is being dispatched and the count has gone down, and `udShortcutBlocked()`
  returns true for it — so every shortcut handler is covered through the guard it already starts
  with, whatever key closed the dialog and whichever handler closed it. The note is dropped when the
  dispatch is over (a paste or a drop asks the same guard a moment later and must not be refused by
  an old key press), and a key that closes nothing is not affected: the guard still lets keys through
  to an open window that is not on its list, which the Edit-shape window's own undo relies on.

### Shortcut keys on buttons — the `KH` table

A button that has a keyboard shortcut shows it. `KH` (beside `modKey()`) is the one table: an entry
per shortcut, each a list of combinations written with `mod` for the platform's modifier
(`undo: ['mod+Z']`, `redo: ['mod+Shift+Z', 'mod+Y']`, `drawLine: ['L']`, `nodeSelect: ['Escape']`).
Three readers, and nothing else spells a key:

| Reader | Gives | Used for |
|---|---|---|
| `khHtml(id, pop)` | the caps, `<span class="kh" aria-hidden="true" dir="ltr"><kbd>…</kbd>…</span>` — the first combination only | the visible hint |
| `khTitle(id)` | `Ctrl+Z` / `⌘+Z` | the `{keys}` placeholder of a title string |
| `khAria(id)` | `Control+Z` / `Meta+Z`, every combination, space-separated | `aria-keyshortcuts` |

`mod` is ⌘ / `Meta` when `IS_MAC`, Ctrl / `Control` otherwise. Keys are never translated; a title is
(`fontmaker.toolbar.undo_title` = `Undo ({keys})`).

**Two forms.** A key *sits on* its button where there is room — the Draw tools (in the button's
corner: the five share one row of the panel and have no width to give), Select / Marquee / Pen in
the Edit points bar, Copy / Paste / Select all in the points panel, and after the label of the
rulers and grid checkboxes in Advanced. Where there is none — Undo and Redo in the toolbar, the Edit
points bar, the Draw panel and the Edit-shape window, and the bar's Grid toggle — it is the
*pop-up* form (`khHtml(id, true)`, `.kh-pop`): a child of the button, out of the row's flow, shown
by CSS on `:hover` and `:focus-visible` after a short delay. The host carries `data-kh-pop`.

**Static and built buttons.** A button in the page's markup carries `data-kh="<id>"` (plus
`data-kh-pop`, and `data-kh-title="<string key>"` in place of a fixed `title`); `khSyncStatic()`
— run at start and from `applyI18n` — sets `aria-keyshortcuts`, the title, and adds the caps once
(a checkbox's caps go after its label). A button built in a template calls the three readers
itself. `khSyncStatic` writes attributes and the caps only; it is safe to run at any time.

**Rules that are easy to break:**
- The caps are `display: none` unless `(pointer: fine)` — the suite's rule for key hints; the
  `aria-keyshortcuts` stays (a keyboard may be attached to a tablet).
- A cap must never change a row: `.kh` has a negative block margin so a button is not taller for
  it, the bar's icons-only layout (`#nodeBar.nb-tight`) drops the on-button caps, and the Draw
  tools use the corner. Measure a new site with the caps hidden and shown.
- A greyed-out button is faded with `opacity`, which would fade a pop-up inside it and make the
  button a layer the following content paints over. So a pop-up host rises on hover / focus
  (`z-index`), and `.tbtn.ghost[data-kh-pop]:disabled` / `.ctl-btn[data-kh-pop]:disabled` fade
  their own colours with `color-mix` instead of `opacity` (inside `@supports`; a browser without
  it keeps the old fade and a paler pop-up). A new pop-up host of another button class needs its
  own line there. Undo is greyed out on every new project, so this is the common case, not an edge.
- A new shortcut that has a button: one `KH` entry, the readers at the button, and its row in
  `shortcutGroups()` — the sheet stays the full list, `KH` only the ones with a button.

### The two dots on a שׁ/שׂ placement screen
`precompTakesHolam(pc)` (base ש + mark ׁ/ׂ) is the **only** form that draws two draggable dots: the
orange one is the form's own mark (`#pcMark`, dragged via `.pcanc`), the blue one is
`precompHolamAnchor` — where a following holam attaches on that dotted letter (`#pcHolamMark`, via
`.pcholam`). Both visible at once IS the stacking check for this case, so they are meant to overlap.

Because they overlap, each carries its **name on the canvas** (`precompDotLabel`): `precompName(pc)`
for the orange, `gName(markName('05B9'))` for the blue — both already-localized name tables, so this
added no strings. The orange label sits above its dot and the blue below, so they stay apart when the
dots coincide, and colour is never the only thing telling them apart. Labels are knocked out in
`stageColors().paper` (the stage's own `var(--white)` background, per theme) and carry
`pointer-events:none`, or they would steal the drag from the handle underneath.

`precompLabelPos` clamps into `_stageVBEdges`, the frame the current render is actually showing: a
shin-dot rides above its letter, so on a tall glyph an unclamped label would be drawn off the top of
the canvas. `movePrecompLabel` reuses that same function during a drag — `renderStage()` re-lays
everything on pointerup, so it only has to cover the live drag. **Single-dot forms get no label**;
there is nothing to disambiguate, and the panel already names the one colour.

### Theme changes and baked ink
The preview SVGs draw with `currentColor` and have that colour **set explicitly on each render**
(`_previewInkColor()` — `--text`, falling back to the literal pair). Nothing about a dark-mode switch
reaches a baked colour on its own, so `toggleDark` has to re-run the renders — and it used to list
them by hand, which is how the kerning pair preview got missed: it kept whichever ink was current
when the Spacing tab last rendered, and after a toggle back to light its two glyphs sat there in pale
dark-mode grey. **`reinkPreviews()` is now the single list**, and a new baked-ink preview is added
there, not to `toggleDark`. Each call no-ops when its host element is absent, so it is safe to call
on any theme change.

The QA grid bakes its ink too and is deliberately *not* in that list: `.overlay` is `position:fixed;
inset:0`, so it covers the header and the dark toggle cannot be reached while the grid is open, and
`openQA()` rebuilds it on every open. There is no OS-theme listener either — `toggleDark` is the only
path a live page changes theme by, which is what makes one list sufficient.

### Coordinate range — why a build can die in fontTools
Every glyph's bounding box is packed as **int16** in `glyf`, so a single point past ±**32767** fails the
whole build with `struct.error: 'h' format requires …` — a Python traceback that names no glyph. The
normal workflow cannot reach it: the tracer's px→unit map (`ifx`/`ify`) is a fixed linear one bounded
by the stage, and `drawFrame` clamps drawn ink, so a full project with every optional surface on and
letters pushed to the stage corners tops out around 2,200 units — roughly 15× inside the limit.

**Typed numbers are the way in, so they are clamped at the source.** `_XFORM_CLAMP` is declared above
`xformMatrix` and used by *both* the live sliders and `xformMatrix` itself, because the Apply button
hands the raw number field straight through — that path clamped only the floor, so a typed `5000`
scaled an outline 50×. The mark editor's piece fields are bounded the same way (`ME_POS_MAX` /
`ME_SIZE_MAX`); a dot's radius already reused its slider's 8–200.

**A single clamp is not enough once a transform can be repeated.** One 400% cannot reach the limit;
four in a row can. So every transform that multiplies coordinates is checked against `GX_COORD_MAX`
(16000 — half the int16 range, the same room `SVG_PASTE_MAX_COORD` leaves for an advance, marks and
composed forms around the glyph) *before* anything is written, and refused whole: the point editor's
`transformSelectedNodes` and `xformLive` predict the mapped bounds with `xformOutOfRange` (handles
included), and the glyph transform engine's plan carries a `refuse.range` list. A refusal leaves the
project, the node model and the undo stack exactly as they were — never a clamp that bends the shape.

`glyphRangeError(spec)` is the backstop, called by **both** build paths right after `buildFontSpec()`
and before Pyodide ever runs: it walks every glyph's contours *and* its curve control points (a
control point can sit outside a polygon that fits) and returns a translated message naming the
letters, which each call site shows in its own idiom — `buildFontBytes` throws it for Preview PDF's
catch, the export path shows the build-fail modal. It exists for a project that already carries such
a point, from a build before those clamps, an import, or a hand-edited `.hebrewfont`. Letter labels
are `esc()`d because both call sites drop the message into `innerHTML` and a custom glyph's name is
the teacher's own text.

### Export delivery — Send / Share / Save as

**Two destinations, one flow.** `FM_SEND_DESTS` maps a dest key → `{addr(), titleKey, subjectKey,
introKey?, freeOnly?}`; `ivrit` goes to the IvritSuite library, `os` to `fonts@opensiddur.org`.
Every step downstream takes that key — `fmSubmitDraft(files, dest)`, `fmSendViaMailto(draft, files,
dest)`, `fmSendPreflightShare(files, draft, dest)`, `fmSendChecklist(files, dest)`,
`fmCopyAddr(dest)`, `fmSubmitAddr(dest)` — so a third recipient is a row in the table plus its
strings, never a second copy of the machinery. An unknown key falls back to `ivrit`.

`fmWireAct` hands the **click event** to its callback, so an in-body button that needs a dest must
be wired with an arrow (`() => fmCopyAddr(dest)`); passing the bare function would make the event
the dest and silently copy the wrong address.

A dest with `introKey` opens its draft with a line saying what the submission is, and on a project
carrying `project.osFont` inserts `fontmaker.send.os_derived` naming the starting font — the
recipient needs "derivative of your X", not "new font". The `ivrit` draft has no `introKey` and is
therefore byte-identical to what it always was.

`freeOnly: true` gates the destination on license: a font left `arr` raises
`fmSendLicenseWarn(dest)` (Change the license → `exportJumpToLicense()`, Send anyway →
`fmSendFont(dest, true)`, Cancel) before any mail app opens. A partner-derived project is skipped —
`project.osFont` means the license is already locked to an open upstream.


`downloadBlob` records `window._lastDownload = {blob, name}` and the Exported ✓ screen snapshots it
(before its LICENSE button can overwrite it) for the file-exit buttons: **📤 Share / Save to Files**
appears only when `navigator.canShare({files})` says yes at runtime (Safari/iOS — Chromium's allowlist
rejects `.ttf`; never UA-sniff), **💾 Save as…** only when `showSaveFilePicker` exists (Chromium
desktop). **📤 Send to IvritSuite** (`fmSendFont`) always sends the TTF + LICENSE.txt: it reuses
`_lastFontBytes` when `_lastFontStem === fontFileStem()`, else rebuilds via `buildFontBytes()`; it
builds the submission draft from the same `resources.fonts.submit.*` keys and runtime-assembled
address as resources.html's `openSubmitFont`, and either opens the share sheet with the files attached
(pre-flight modal; the address is copied in the same gesture) or opens the `mailto:` via the
`fmOpenMailto` seam plus a persistent attach checklist naming both files. Anything that needs a user
gesture (`navigator.share`, `showSaveFilePicker`) is called synchronously from a click — never after
an `await` — so every async preparation runs before the modal whose button makes the call; in-body
checklist buttons are wired with `fmWireAct` after `askModal()` so they don't close the dialog.

### Font size readout

The size of the font is shown in two places, and neither ever starts a build.

- **The Exported ✓ screen** adds one line (`exportSizeLine()`): the size of the file that was just
  downloaded — `TTF · 84 KB`, `WOFF2 · 31 KB`, `ZIP · 118 KB (TTF 84 KB, WOFF2 31 KB)`,
  `UFO (zip) · 60 KB`. `finishDownload` and the UFO branch record it in `window._lastExport`
  (`{ kind, size, ttf?, woff2? }`) from the bytes they hand to `downloadBlob`; the LICENSE button
  on that screen overwrites `_lastDownload`, which is why the line does not read it. Sizes are
  formatted by `fmMb()`, the format names are not translated, and each size is its own
  left-to-right `<bdi>`.
- **Beside the Export button** (`#exportSize`, also the button's `aria-describedby`): the size of
  the last build, for the picked format, **only while that build is still this project's font**.
  Every build — `buildFontBytes()` (Preview PDF, Send, Save to My Fonts) and `doExport` — calls
  `fmBuildKeep(bytes, gen)`, which stores `window._lastBuild = { proj, gen, stem, ref, ttf, woff2 }`:
  the `project` object, the edit count read **together with the spec** (`_editGen`, bumped by
  `markDirty()`), and the file stem. `fmBuildFresh()` is true while all three still hold;
  `exportSizeSync()` shows or empties the readout and is called by `fmBuildKeep`, by `markDirty`
  (only while the readout is showing), by `onExportFormatChange` and by `udClear` (a project just
  arrived or left). The WOFF2 size is known only after a WOFF2 was made from that same build
  (`ref === bytes`); the zip and the UFO show nothing.

Three things to keep:
- The edit count is read with `buildFontSpec()`, not when the bytes come back: the export awaits
  the shaping check and the WOFF2 package after the build, and an edit made meanwhile must leave
  the build an old one.
- The export's own version bump does not go through `markDirty`, so a finished export keeps its
  readout; an undo does (it is an edit of the project), so an old number never returns.
- When the readout is hidden its text **and its title** are removed. A hidden element still
  describes the button it is `aria-describedby` for, and with no text the browser falls back to
  the title — which would tell a screen reader "nothing has changed since" about a font that has.

### Preview PDF — what the specimen shows
`generatePreviewPDF` draws the cover, the letter × nikkud chart (Hebrew letters only — punctuation
takes no nikkud) and one `specimenPage` per enabled add-on set, then **the digits and punctuation
the font actually carries**: `punctSpecimenChars()` is `letterShips`'s own rule (the Include toggle
AND ink), so no cell ever falls back to a system face. One LTR page — a lone bracket is never
mirrored under `direction 'ltr'` and the Hebrew marks are bidi-neutral single glyphs — and the
cover gains a 0–9 line only once all ten digits ship. The chart's anchor readouts
(`fontmaker.canvas.anchor_*`) carry the pair as one `{xy}` placeholder wrapped in a left-to-right
isolate (U+2066 … U+2069 — a canvas has no `unicode-bidi`) and are drawn in the UI's direction, so a
negative pair keeps its order after a Hebrew word and the word still reads first.

jsPDF (the specimen and the template PDFs) and html2canvas (the template sheets, PDF or PNG) load from
cdnjs on the first click that needs each — `ensurePdfLib('pdf' | 'canvas')`, which never rejects and
keeps no failed load — not in `<head>`, where they held every visit's first paint for the CDN; the
callers' `pdfLibsMissing` checks then run as before and name the missing builder. Both callers are thin
wrappers over `_downloadTemplate` / `_generatePreviewPDF` holding a busy flag (`_templateBusy`,
`_previewPdfBusy`), so a second press while one runs does nothing (it drew or built again alongside and
saved a second file), and each says its building sentence on the status line **before** the library
load, cleared again when a library is missing.

### Undo / dirty / autosave contract — the big one
**Never mutate `project` directly.** Route every mutation through `udDo(scopes, label, fn)`
(scopes: `{t:'item',kind,cp}`, `'spacing'`, `'kerning'`, `'kernClasses'`, `'kernChecked'` (the Common
pairs ticks), `'metrics'`, `'guides'`,
`{t:'precomp',target}`, `'tropTune'` — the font-level mark tuning: spread, pairing, meteg gap, mark
nudges, the six mark sizes, the marks' placement / lean under a slanted font (`markLean`) and their
width factor (`markWide`) — and
`'sheetFit'`, each letter sheet's units-per-pixel scale, which
only the glyph transform engine writes under undo). Continuous inputs: slider drags use `udBurstBegin`/`udBurstCommit` (one
undo entry per drag); arrow-key nudges use `udNudgeTick`/`udNudgeCommit`. `udPush` calls
`markDirty()` automatically (debounced IndexedDB autosave), so going through `udDo`/burst/nudge
covers undo + dirty + autosave in one. Pure-UI state (panel collapse, toggles) calls `markDirty()`
directly with no undo entry. Read-only features (tour, QA grid, shortcuts sheet) must touch none of
this — zero project-state changes.

The snapshot `autosaveNow` writes is the gzip of exactly `JSON.stringify(project)`, but it is built by
`autosaveParts(project)`: every string of 4,096+ characters starting `data:` (the photos and sheets)
leaves the JSON as a marker and joins the Blob as its own part, a Blob of its JSON literal kept in
`_autosaveUrlParts` and reused while the project still holds that URL. Never go back to one
`JSON.stringify` + `new Blob([json])` there: any Hebrew in the project makes that string two-byte, and
re-encoding every photo on each autosave froze the page for seconds three seconds after every edit.

An **image assignment needs `withSource: true`** on its item scope (and `withDraw: true` when it can
replace a drawing) — `ITEM_SKIP` holds `source`/`savedAnchors`/`draw` out of snapshots by default, so
without the opt-in `udRestore` keeps the *new* image and rolls back only the geometry around it,
which is a visible half-undo. The cost is that the entry retains a second copy of that item's
`dataUrl` for as long as it sits on the stack; `draw letter`, `auto-detect letters` and
`upload image` all pay it deliberately, and so does every SVG assignment (*SVG import*, below); full
combined sheets never do — they live in `project.combinedSheets`, not in the item.

### Photo upload — one letter or a whole pick
`prepImageForItem(it, file)` does all the async work (file read, decode, `autoThresholdFor`,
`defaultFitTransform`) and hands back the *mutation* as a closure, so a corrupt file changes nothing
and the caller chooses the wrapper. `uploadForCurrent` wraps one closure for the current item (letters
and marks alike — the `markDrop` zone calls it too); `uploadForLetters` wraps a whole pick in ONE
`udDo`, the `adApply` shape, so a mis-picked batch is a single Ctrl+Z.

Distribution: a file whose **name** names a letter (`alef`, `Alef.jpg`, `01-alef`, `05D0`, `uni05D0`,
`א`) claims that letter wherever it sits — `_fileNameToCp` reuses `buildSvgNameMap()` +
`matchSvgEntryToCp`, the same id rules the SVG auto-split uses. Everything else fills the current
letter first, then the following glyphs of the current letter's own tab that are still empty (no
outline, no image, no strokes), in `_drawCycleCps()` order — the list *Save letter & next* walks
(`newglyphset.md` §4), so a pick on the English tab fills English letters, never alef onward, and the
Letters tab's list leaves out digits and punctuation (which ship default outlines). With no letter
selected it starts at alef.
Files with nowhere to go and files that fail to decode are counted in the toast, never dropped
silently. The `multiple` attribute and the hint line under the drop zone are raster-mode only —
SVG mode routes through `uploadSvgForCurrent`, which replaces the trace rather than the photo, and
stays one-at-a-time. `wireDrop(id, cb, multi)`'s third argument opts a zone into whole-`FileList`
drops; every other zone keeps the first-file contract.

**Reading order.** A printed template flows in its script's direction in both UI languages —
`renderTemplateCanvases` pins the sheet: English and Cyrillic left to right, every other set right to
left (alef top-right) — and Auto-detect reads every sheet right to left: a page `adMatchTemplate`
recognises takes that page's letter order cell by cell, a free-form sheet the untraced letters in order.
A template's direction never follows the UI language: a photographed page cannot say which interface
printed it, and a Hebrew-UI page read in the English order swapped every letter in its row. The sheet
view offers Auto-detect only on the Letters tab (`catTabFor(curKind, curCp) === 'letter'`): it assigns
the Hebrew letters (`_adCoreLetters`), so another tab's template would get them and Apply would replace
their photos and outlines.

**Sheet sizing.** Auto-detect crops each letter to its own ink box, so the per-crop fit
(`defaultFitTransform`: the crop's height onto the glyph's band) stretched a yod up to alef's height
and shrank a tall handwritten letter — the "yod was resized" report. `adApply` now sizes the sheet
once: `adPadAndMap` carries each box's unpadded `ink` rect, `adSheetScale(prep)` takes the median of
`(band.top − band.bottom) / ink.h` over the *body* letters (neither `asc`, `desc` nor `high` in
`bandMeta(letterMeta(cp))`; every box when fewer than three have ink), and `sheetFitTransform(ink,
cp, K)` pins each letter by the edge that does not float — a `desc` or `high` glyph (the finals, qof,
yod — the `high:true` flag on 05D9 exists for this; Latin g/p/q, Cyrillic Д/Ц/Щ) hangs its ink top
from `band.top`, everything else sits its ink bottom on `band.bottom`, so a body letter never dips
under the baseline into its seeded sheva. The review dialog's **Sizing** select (`adState.sizing`,
seeded from the per-device `adSizing` pref in `hebrewFontMaker_uiPrefs`, written by `adSetSizing`)
offers the old per-crop fit as *Fit each letter to its guide lines*; the sheet remembers the scale as
`combinedSheets[].fitScale` (a plain number outside undo — undoing the Apply leaves it; a later
fit-each Apply deletes it; `migrateProject` drops a loaded one that is not a finite positive number), and `finalizeCrop` reads it for a letter boxed by hand on that sheet
afterwards, measuring the box's ink with `inkBoundsOf` (detection's own binarize plus its
rule-line and hollow-rectangle filters, so a printed cell border inside a loose box is ignored). Marks
and sheets never auto-detected behave as before. `defaultFitTransform` itself (and `snapFit`, the
Center button) now fits the band's *height*, so a final letter's tail lands on the descender line
instead of being squeezed into 0..600; the numbers are unchanged for every other glyph while the
baseline is 0.

### SVG import — the sanitizer, and paste / drop / the code box

**Every SVG is untrusted, and the importer has to mount it.** `elementToLoops` measures a shape with
the browser's own SVG engine (`getScreenCTM`, `getTotalLength`), which only works on a tree attached to
the page, and the page's CSP allows inline script — so a raw SVG attached there ran its `onload` /
`onerror` handlers and applied its `<style>` to the page. `parseSvgEntries` therefore never mounts what
it parsed: `parseSvgText` returns the inert root of a `DOMParser` document, `svgSanitize(root, opts)`
rebuilds a second tree with `createElementNS`, and only that tree reaches `withSvgHost`. It applies to
every route in — a file upload, a sheet, auto-split, a sheet re-read when a project loads, a paste.
- **Kept:** `svg`, `g` (`a` is walked as `g`; of a `switch` only its first usable child, as a browser
  renders it — Illustrator puts a `foreignObject` first), `path`, `rect`, `circle`, `ellipse`, `line`,
  `polygon`, `polyline`; each shape's geometry attributes, `transform`, an `<svg>`'s `viewBox` /
  `preserveAspectRatio` / `x` `y` `width` `height`, and the three CSS transform properties of an inline
  `style`. Elements are matched by `localName`, so markup pasted without its `xmlns` still imports.
- **Dropped:** everything else with its subtree (`script`, `style`, `image`, `use`, `text`,
  `foreignObject`, the non-rendering `defs` / `clipPath` / `mask` / `marker` / `symbol` / `pattern`),
  every `on*` attribute, every `href`, `class`. An element's `id` and `inkscape:label` ride as
  `data-fm-id` / `data-fm-label` (what auto-split matches on), so no foreign id is ever live in the page.
- **What CSS decided is worked out on the inert tree** by `svgOwnStyle`, a cascade for `display`,
  `visibility`, `fill`, `stroke` and `fill-opacity` only: presentation attribute, then the `<style>`
  rules in source order (`svgStyleRules` reads them through a constructed `CSSStyleSheet` that is never
  adopted, so nothing is fetched; without constructable sheets the classes are simply not read), then
  the inline `style`. `fill`, `stroke` and `visibility` inherit. The old `getComputedStyle` filter on the
  mounted clone is gone: page CSS could hide a shape through it.
- **One reading for every route.** A shape whose fill resolves to `none` (or a `line`, which encloses
  nothing whatever its fill says) is left out and counted in `skipped` — every caller says how many
  (`svgSkippedNote`), and an SVG with nothing but strokes gets its own plain error. `display:none` on a
  group hides its whole subtree, so a hidden layer does not import. `svgInkLoops` drops a loop that
  encloses nothing before any fit measures its box. A sheet is re-parsed when its project loads
  (`cacheSvgSheet`), so these readings apply to a saved sheet's next crop or auto-split too — letters
  already assigned keep the contours they have.
- **`opts.paste`** switches on only the caps (`SVG_PASTE_MAX_*`): a cap must never refuse a sheet a
  saved project already holds.

**`assignSvgContours` is the one commit** for an upload, a crop, an auto-split and a paste, and the
`udDo` around it carries `withSource` and `withDraw` on every item scope: it replaces `it.source`,
which a plain scope leaves out of the snapshot (the undo then brought the outline back and left the
letter marked as SVG, its photo gone), and it clears a drawing. For a letter it also clears what
described the outline that is gone: `lsb` / `rsb`, `markAnchors` (pins), `placementSaved` /
`placementInherited`, `draw` and `drawSig` (the Trace step would otherwise re-trace old strokes over
the new outline) and a `*Source: 'import'` flag (`SVG_IMPORT_FLAGS` — a later import with "keep mine"
would otherwise overwrite the letter). Anchors are re-seeded. One Ctrl+Z restores all of it.

**Paste, drop and the code box** (the *SVG paste* block) put artwork into the open letter whatever
`project.font.svgUpload` says — that setting only decides what the upload zones accept. Three ways in:
the document `paste` listener, `wireStageDrop` on `.stage-wrap` (files only; any other file is told
where it belongs instead of navigating the browser away), and the *Paste SVG code…* buttons beside
every *Copy outline…* button and in the point editor's nothing-selected stack (`openSvgPasteCode`).
`svgFromDataTransfer` reads, in order, `image/svg+xml`, an SVG file item, `text/plain` that
`isProbablySvg` accepts, and `text/html` holding an `<svg>` (taken out through an inert HTML parse,
`svgTextFromHtml` — also the second try for markup too loose for XML). `svgPasteStageOk()` is the one
gate: a project, nothing in `udShortcutBlocked()`, no open overlay, no tour, a letter's stage showing
(not a `cat-settings` tab, not a combined form's placement), no drag or stroke in flight, no file still
being read. Letters only; a mark selected gets a toast.

One dialog (`#svgPasteOverlay`, listed in `udShortcutBlocked`), one `udDo`. The target letter is pinned
when the dialog opens. The size choices are `svgPasteFitChoices(cp)` and their bands `svgPasteSpan`:
*height* (baseline → `glyphBand(cp).top`), *desc* (the `descender` line → band top, only for a `.desc`
glyph), *xheight* (only for a cased glyph), *keep* (1 SVG unit = 1 font unit, on the baseline). Note
the difference from an upload, whose `svgSpanFor` puts a tail at −30 % of the reference height: a paste
reaches the descender line itself. The choice is remembered per device in `hebrewFontMaker_uiPrefs`
— `svgPasteFit` for ordinary letters, `svgPasteFitDesc` for letters with a tail, `svgPasteMode` — and
validated against the closed set on read. Validation is inline (the `aria-live` note and
`aria-disabled` on Insert); nothing is ever raised over the dialog.

- **Replace** (`svgPasteReplace`) is `assignSvgContours` with one difference: the advance is the ink
  plus both default margins with the ink centred (an upload seats the ink at the default left margin).
  It lands on Align through `_setWorkMode`, where the *Imported from SVG* hint and *Next: Nikkud* are;
  an upload lands on the placement step.
- **Add** (`svgPasteAdd`) is a union, and goes through the node model like a point paste. It lands in
  Edit points — the one step that always shows the outline itself. Every stage fills nonzero, and the
  letter and the artwork are each wound one way round, so the union is simply every contour of both,
  each in its own direction: the sum is nonzero exactly where either one is. Nothing is cut, moved or
  re-seated for it. What would spoil it is the automatic nesting rule re-deciding a direction at the
  next rotate, delete or paste (a bar laid across a letter would turn into a hole), so **an add makes
  the letter a kept one** (*Shapes, holes and kept directions*): the contours that are there go
  through `nodeKeepAll()` first — it keeps the fill and turns a letter drawn the other way round into
  this file's convention, so both groups are wound alike — and then every new contour joins flagged,
  running the way its label says. No start point is moved, no point is inserted, and no solid of the
  letter is ever removed; the added contours are the selection afterwards.
  - Two things are decided by asking points "is this ink?" (`svgWinder`, a signed winding number),
    never by a rule about where a contour starts. **The artwork adds nothing** — asked of the artwork
    as a whole (`svgPasteAddsInk`): nowhere does it have ink where the letter has none, tried beside
    its own outline (a little to each side of every edge, never on one: pieces fitted to the same
    band share its top and bottom lines) and on a grid over its box. Then nothing changes and no undo
    entry is made. **A counter of the letter that the new ink covers completely** cuts nothing any
    more and is taken out, so the Contours list keeps no dead hole (`svgPasteDeadHoles`) — only on
    proof: the artwork's outline neither crosses the counter nor comes inside it, and at every point
    asked, just inside its edge and across it, the fill is the same with the counter as without. In
    doubt the artwork is added and the counter stays; the fill is right either way.
  - One limit: a hole that sticks out of its own group's ink is wound the other way round where it
    sticks out, and ink of the other group laid over that spot cancels it. The Contours list already
    flags such a hole in a letter as not cutting; in pasted artwork it comes from overlapping shapes,
    which the importer reads by nesting.
  - QA's outline scan still reports a piece laid across a counter (an outer/hole crossing): the fill
    is right under the nonzero rule, the note is about engines that fill by even-odd.

**Points and artwork share Ctrl/⌘+V.** Only the `paste` event can see the clipboard, so it decides:
SVG there → the dialog (which offers *Paste the copied points instead* when points are waiting), none →
`pasteNodes()`. The Edit-points `keydown` therefore neither pastes nor calls `preventDefault` — either
would stop the event from coming — and only arms `svgPointPasteArm`, a fallback for a browser that
fires no paste event; it waits rather than running on the next tick because on a Mac the event can
arrive a task later than the keydown. `copySelectedNodes` leaves `SVG_POINTS_MARKER` on the system
clipboard (best effort), so artwork copied earlier does not beat points copied just now.

### Installed fonts — "Pick an installed font…" (Local Font Access)

Chrome and Edge on a desktop expose `window.queryLocalFonts()`; each `FontData` has `family`,
`fullName`, `postscriptName`, `style` and `blob()`. `LF_OK` is the feature test, and the two buttons
(`#lfPickImport` in `inputModeBlock`'s font row, `#lfPickRef` in `referencePanelR`'s upload wrap) are
rendered only when it is true — elsewhere there is no button, by omission, like every other
capability-gated control in the file. `lfOpen(target)` calls the API straight from the click (the
browser wants the gesture; a busy flag covers the time its prompt is up). A refusal is one `status()`
line and nothing else: Chromium answers a denial with an **empty list**, not a rejection, so an empty
list is checked against `navigator.permissions` before it is read as "no fonts"; a `SecurityError`
means the page is framed without the `local-fonts` permission (a tool page may be embedded in an LMS).
No CSP change: nothing is fetched.

**The `lf*` reader** is a small bounds-checked sfnt reader over `lfReader(src)`, one async `view(off,
len)` for a Blob (slices) or bytes in memory. It exists for two reasons. The list must answer *has
Hebrew?* for every installed face — hundreds, some of them tens of megabytes — so `lfHasHebrew` reads
only the directory and the `cmap` (formats 4 and 12, the Unicode subtables), three faces at a time
(`lfPump`), and remembers the answer per PostScript name for the session (`_lfHebCache`); *has Hebrew*
means all 22 letters that are not final forms (`LF_HEB`). And the import engine (opentype.js), the
fidelity check and the exporter's reader all refuse a **collection** (`ttcf` — most Hebrew system fonts
on a Mac): `lfPickFace` finds the member whose name ID 6 is the listed PostScript name (then ID 4, then
the first) and `lfStandalone` writes it out as a font of its own — the face's own sfnt version (`OTTO`
stays `OTTO`), the directory **in tag order** (the fidelity check's reader searches it), tables 4-byte
aligned, checksums and `head.checkSumAdjustment` recomputed. `lfNames` reads name records (Windows
English, then any Unicode record, then Mac Roman), capped and stripped of control characters
(`lfClean`). A face over `LF_MAX_BYTES` is not opened.

**The picker** (`#localFontOverlay`, in `udShortcutBlocked` — its list is a focused `div`, which that
guard does not read as typing) reuses the Starting Fonts picker's sheet CSS with one difference: its
scroller is `.lf-list`, a real listbox (`role="listbox"`, `aria-activedescendant`, a `role="group"`
per family, a `role="option"` per face). `lfKey` on the dialog owns the keys: ↑ ↓ Home End PageUp
PageDown move the active option, Enter chooses, a printable key pressed in the list moves focus to the
search box (which then takes the character), and ↑ ↓ Enter in the search box act on the list. **Escape
and Enter are answered there with `stopPropagation()`**: the dialog closes on them, and a key that
travelled on to the document would be read by the editor behind it (Escape clears a selection in Edit
points, Enter places a pen point). With *Has Hebrew* on, a face appears once it is confirmed; the
`aria-live` count doubles as the progress line (it moves in steps, not per font) and carries a read
error while the picker is open (`lfNote` — the status line is dimmed behind an overlay). A Hebrew
face's sample is drawn from the font's **own bytes** under a generated `FontFace` name (`lfPreview`,
lazily through an IntersectionObserver rooted on the list, with a generation token so a late one is
dropped) and stays hidden until that face is in — in a fallback font it would pass for the font's
preview. `lfClose` removes every preview face from `document.fonts`. Every name from the OS goes in
through `textContent`.

**Import target.** `lfChoose` reads the face (`lfFaceBytes`), closes the picker and shows
`lfLicenseNotice`: the font's own name IDs 0, 13 and 14 through `esc()` (the link is an `<a>` built
with `createElement`, and only for an http/https address), the sentence that the teacher is
responsible for having the right to change and share it, and a line when the font has `fvar` (its
default style is what imports). *Continue* calls `uploadSourceFont(new File([bytes], …))` — from there
on it is an uploaded font: the same import-options dialog, the same `applyFontImport`, the same
fidelity report. The `File` carries `hfmInstalled`, which every question of the import dialog closes
over.

**Licence: `'unset'`.** `applyFontImport` calls `lfStampInstalled(file)` before its first change to the
project: for a file that carries `hfmInstalled`, in a project that is not partner-locked, it sets
`project.font.license = 'unset'` and `project.font.sourceFont = { name, copyright, license,
licenseUrl }`, then `syncMetaToForm()` — without that the form still says OFL and the next
`onMetaChange()` (any Font Details keystroke, every save) writes it back. Font metadata is outside
undo, and so is a font import; this rides with it. `#license` has a hidden `unset` option shown only
while active (the `os-passthrough` idiom, but the menu stays enabled), and `syncSourceFontNote()`
(called from `syncOsFontLock`, so `applyI18n` re-runs it) fills `#srcFontNote` with the source font's
words through `textContent`. Nothing may leave the computer while the licence is unset:
`licenseUnsetGate()` stops `exportFont()`, `saveCurrentToMyFonts()` (which builds a font without
passing `exportFont`) and `fmSendFont()`, offering `exportJumpToLicense`. Preview PDF stays available.
And no fallback can say OFL: `LICENSES.unset` and `licenseText()`'s `'unset'` case exist for that.
`migrateProject` keeps `'unset'`, and shape-checks and caps `sourceFont` (`lfCleanSource`). An uploaded
font **file** is unchanged: no notice, licence untouched.

**Reference target: by name, never by bytes.** `lfUseAsReference` registers
`new FontFace(fam, 'local("<PostScript name>")')` and stores `{ name, fam, family, local }` in
`project.template.customFonts` — no `dataB64`, so a project file never carries a system font (an
*uploaded* reference font still stores its bytes, as before). The name must match `LF_PS_RE`; it goes
inside `local("…")`, and `migrateProject` drops a `local` that does not match. `restoreCustomTemplateFonts`
has the `local` branch: on a computer without the font the entry stays in the menu, marked *not
installed here*, its family falls back to the generic font, and one status line says so.

### Workspace model + render pipeline
State: `curKind` (`letter|nikkud|trop`), `curCp`, `workMode` (`align|trace|anchors|nodes`).
Guarded vs guard-bypass pairs: `selectItem` → `_selectItem`, `setWorkMode` → `_setWorkMode` (the
guards protect unsaved anchor moves via `guardPlacement`). Read-only jump-to-letter flows (QA grid,
export-warning chips) legitimately use the `_` versions plus `gotoAnchors('nikkud'|'trop')`.
After mutating state, call `renderStage(); renderControls();` (+ `renderGrids()` if tile status or
selection changed) — `afterUndo` shows the canonical full refresh.

**Not every letter is a Hebrew letter, and `LETTER_ORDER` only knows the Hebrew ones.** English
(`.eng`), Cyrillic (`.cyr`), Phoenician (`.phn`), Imperial Aramaic (`.aram`), Samaritan (`.smr`), custom glyphs (`.custom`) and wide forms (`.wideGlyph`) are `project.letters` entries at
code points `LETTER_ORDER` has never heard of, so any cycler that indexes into it gets `-1` and
silently restarts at alef — walking the user out of the tab they were working in. Each one owns an
ordered list instead: `ENGLISH_CPS` (A–Z, a–z, then the import-only accented forms) for English,
`CYRILLIC_CPS`, `PHOENICIAN_CPS`, `ARAMAIC_CPS` and `SAMARITAN_CPS` for those four, and a `project.letters` filter on the flag for the rest; punctuation (`cat:'punct'`, which IS in
`LETTER_ORDER`) is its own list too, in grid order. `tabDrawCps(cat)` is the one enumerator of a
tab's drawable code points — `_drawCycleCps` (Save letter & next) reads it through `_drawCatOf(cp)`
and so does *Save all drawings*, so the two can never disagree about a tab's members — and
`_placementCycleCps` (the ◀/▶ and `[`/`]` cycle, traced letters only, punctuation skipped because it
is anchor-free) resolves the category the same way. That precedence is `_selectItem`'s, held in one
place, `catTabFor(kind, cp)` (english → wide / specialized → custom → punct → the kind itself), which
`udNavTo` uses too, so a click and a single-item undo land on the same tab. `drawAdvance` walks to
the next glyph that is "still to draw": no outline, **or only its shipped default one** (next).

**Punctuation defaults are placeholders, not the teacher's work.** 17 marks are seeded from
`PUNCT_DEFAULTS` by `blankLetter`; digits and the rest start blank, and there is no provenance flag
on an item. `isStockOutline(l)` answers by value — the contours equal the factory's (JSON memoised
once per code point) and nothing of the teacher's has touched the outline (no `handEdited`, no
`drawSig`, no `source.dataUrl`, not SVG) — so editing a `PUNCT_DEFAULTS` shape reclassifies it in
every saved project. A stock mark opens on Draw in a Draw project (`_defaultStepForCur`, with the
shape ghosted on the stage), counts as still-to-draw for Save letter & next, is a *pending drawing*
once it has strokes (`drawNeedsTrace` — so Trace auto-commits it and `stripImagesForAutosave` keeps
the strokes), and still ships (`letterShips` only asks for ink). *Clear all existing glyphs…* on the
Punctuation tab (`clearAllPunct`) confirms first — the body says how many still carry the built-in
shape and how many carry the teacher's own work — then re-blanks every clearable item **from
`blankLetter`** minus the default, in ONE `udDo` (`withSource` + `withDraw`), so anchors, placement
flags and threshold fields reset together and one Ctrl+Z restores all of it. Its enabled state is
re-stated from `renderControls`, where a stroke lands (`renderGrids` alone would go stale).

`_selectItem` also syncs `englishCase`, because the English grid renders **one case at a time**: the
tab alone is not enough, and landing on a lowercase letter while the switch still reads
`Uppercase A–Z` leaves the tile off-screen with nothing highlighted. `engMeta(cp).case` covers both
bands (A–Z/a–z carry their own case; every import-only form is `'accent'`).

**Cyrillic** (`.cyr`, the *Add Cyrillic letters* toggle) is the English shape minus the accent bands.
`CYRILLIC_LETTERS` is an explicit table of upper/lower pairs in three groups — `ru` (the Russian alphabet),
`ukbe` (the letters Ukrainian and Belarusian add), `srmk` (the letters Serbian and Macedonian add) — and
`CYRILLIC_CPS` lists the upper band then the lower band, each group in order: that order is what
`tabDrawCps('cyrillic')` hands to *Save letter & next* and to the printable template. `catTabFor` routes a
Cyrillic code point right after the English test, `_selectItem` syncs `cyrillicCase` the way it syncs
`englishCase`, and `renderCyrillicGrid` draws the active band as one `.letter-grid` with a `.punct-grp`
label per group (the Punctuation picker's idiom). A Cyrillic letter never enters the placement step:
`_setWorkMode` folds `anchors` back to Align for it, `updateTabs` hides both placement tabs and the two
*Next: Nikkud* buttons skip it, so the English-only accent branches need no twin. The 22 Samaritan alphabet
letters are the one non-Hebrew set that *does* enter it — for their own mark family (*Mark families*
below), never for nikkud; the Samaritan vowel letters and punctuation stay anchor-free like the rest. The letter names carry
the Unicode short name (`А (Cyrillic A, uppercase)`) because `gName` strips non-ASCII from its slug and a
bare `(uppercase)` would collide across the whole band. A font import fills the tab the way it fills
English (`fontCyrillicCoverage`, `CYR_IMPORT_MIN`, `opts.cyrillic` / `opts.cyrMode`, `cyrSource`), the
export declares cp1251 in OS/2 (and the UFO code-page list) only when the shipped cmap carries a
Cyrillic glyph, and `bidiClassOf` reads Cyrillic as strong left-to-right beside Latin. Both the English and
the Cyrillic grid are pinned `direction: ltr` in every UI language (`#englishGrid, #cyrillicGrid`): their
alphabets read that way, and it keeps the tile order in step with the *Save letter & next* cycle, so the
next letter is the tile to the right; the Cyrillic band labels follow the tiles, not the UI direction.
**Phoenician / Paleo-Hebrew** (`.phn`, the *Add Phoenician letters* toggle) is the same shape again, and the
**RTL** reference implementation. Unicode unifies Paleo-Hebrew with Phoenician — block U+10900–U+1091F, script
`Phnx`, bidi class R — so one set carries both names, and the glyphs export at their own code points beside the
square Hebrew rather than replacing it (one font, both scripts; they are not on any keyboard, so a teacher reaches
them by copy-paste). `PHOENICIAN_LETTERS` is a flat table of 29 in three groups — `alphabet` (the 22 letters in
Unicode order), `numbers` (the six numerals, listed **1 2 3 10 20 100**, which is *not* code point order because
NUMBER TWO and THREE were encoded later at 1091A/1091B) and `sep` (the word separator) — and the script is
**caseless**, so there is no case toggle, no `_selectItem` case sync and no `l.case` to normalize. The grid is
deliberately **not** direction-pinned: it inherits the shared `direction: rtl`, its band labels follow the UI
direction the way Punctuation's do, and *Save letter & next* lands on the tile to the **left**. `bidiClassOf`
reads the block as strong RTL beside Hebrew, and the specimen page uses the Hebrew add-on layout
(`{ rtl: true, cols: 8, glyphPx: 44 }`).

**Imperial Aramaic** (`.aram`, the *Add Aramaic letters* toggle) is that same RTL shape a second time — block
U+10840–U+1085F, script `Armi`, bidi class R — the chancery script of the Persian empire and the ancestor of the
square letters. `ARAMAIC_LETTERS` is a flat table of **31** in three groups: `alphabet` (the 22 letters),
`numbers` (the eight numerals) and `section` (the section sign). Two differences from Phoenician are worth
knowing. Its numerals were all encoded together, so numeric order *is* code point order and the table needs no
re-sorting — what departs from code point order is the *band* order, because the lone section sign at 10857 is
listed after the numerals at 10858–1085F. And U+10856 is unassigned, so it is simply absent from the table.
Caseless like Phoenician, so again no case toggle and no `l.case`.

Unlike the Phoenician block, this one is carried by fonts the app already ships: of the 132 Starting Fonts,
`aramaic-imperial-yeb` maps all 31 and `aramaic-viibce` the 22 letters, so `fontAramaicCoverage` clears
`ARAM_IMPORT_MIN` and the *Start from an existing font* wizard pre-ticks the box by itself. Before this set
existed those glyphs were parsed and dropped. (`aramaic-early-br-rkb` is the odd one out: despite the name its
23 mapped code points are **Phoenician**, so it opens that tab instead — correct for its actual cmap, surprising
from its name.)

Phoenician was the **first set in the app above the BMP** (Imperial Aramaic is the second, and rides the same
branch), and that is the one place the pattern needed widening:
a cp is 5 hex digits, so `gname()` names them `u10900` — AGL's SMP form — instead of `uni10900`, which is defined
only for exactly four digits and would ship a `post` table that reverse-maps wrong. That branch keys off
`cp.length`, and every other cp in the app is exactly 4, so a Hebrew-only project's spec is byte-identical to what
it was before (measured, not assumed). Everything downstream already coped: `padStart(4,'0')` and `'%04X'` are
*minimum* widths, the cp→char idiom is `String.fromCodePoint` everywhere, and `cmap[parseInt(cp,16)]` needs no
help — so fontTools adds a **(3,10) format-12** cmap subtable by itself once a key passes 0xFFFF (a format-4-only
font would render paleo as tofu), and `recalcUnicodeRanges` sets OS/2 bit **58** (Phoenician) and bit **57**
(Non-Plane 0). Imperial Aramaic gets bit **57 only**: it was encoded in Unicode 5.2, after the OS/2 v4 bit table
was frozen, so it has **no Unicode-range bit of its own** — a font carrying it is correct, not broken, and a
check that expects an Aramaic bit will fail a good font. `ulCodePageRange` is untouched for both — Windows has
no code page for either block. `normalizeCp()` still gates
*custom glyphs* to the BMP; that is a deliberate limit on that one route, not a glyph-naming one.

Adding another set — LTR or RTL, or a tab of composed forms — is the recipe in `newglyphset.md`, with the
Cyrillic set as its LTR reference implementation and the Phoenician and Imperial Aramaic sets as its RTL ones.

### Vertical metrics — the band model

`glyphBand(cp)` is the single answer to *how tall is this glyph meant to be*. Every guide line, every
scale-to-fit and every upload span goes through it, so they cannot drift apart. It returns the band's
`top`, its `bottom`, and the `lines` the stage draws:

| script | top | extra lines |
|---|---|---|
| Hebrew, Phoenician, Imperial Aramaic, Samaritan (caseless) | `letterTop` 600, or `lamedAscender` 800 when `.asc` | `letterTop` always, plus `lamedAscender` when `.asc` and `descender` when `.desc` |
| Latin / Cyrillic **uppercase** | `capHeight` 700, or `ascender` 725 when `.asc` (Й Ё Ґ Ї Ў Ѓ Ќ) | `capHeight`, `descender` when `.desc` (Q, Д Ц Щ Ђ Џ) |
| Latin / Cyrillic **lowercase** | `xHeight` 510, or `ascender` 725 when `.asc` | `xHeight` always — the bowl of a *b* sits there — plus `descender` when `.desc` |

Until v5.54 there was one top line for everything, which is correct for a caseless script and was the
whole story while the tool was Hebrew-only. Once cased sets arrived it meant a capital `O` and a
lowercase `o` were drawn, fitted and exported at identical heights.

**The defaults are measured, not chosen.** Across the 61 bilingual text faces in `starting-fonts/`, normalised
to 1000 UPM, the medians are `x/cap 0.726`, `Hebrew/cap 0.858`, `ascender/cap 1.038`, descender −208.
Anchoring those on the existing `letterTop = 600` gives cap 700, x-height 510, ascender 725 — within a
few units of Frank Ruhl Libre, the app's own default face. Deriving cap *through* the Hebrew ratio is
what lets **one** reference-font size seat both scripts: `computeTemplateFit` sizes the family once
from `ב` on the Hebrew top line, and the family's own `O` and `o` then land on the cap and x-height
guides by themselves. (It used to measure every character's own ink and stretch each one to the top
line, which is what made O and o identical on the stage and squashed lamed down to alef's height.)

`templateMetrics(family, ch)` is the measurement under it (two 560×560 canvas scans a glyph) and is
cached per family and glyph, but only while `document.fonts.check('24px <primary>', ch)` says the
face that draws **that glyph** is loaded — asked with no text, `check()` asks about a space, which in
a family split by `unicode-range` is the Latin file and never loads for a Hebrew letter, so nothing
would be cached and every stage redraw would measure again. A family with no face at all also answers
true (a stylesheet linked by `loadHebFont` may still be on its way), so the key carries whether the
family has a face (`_tplFamilyHasFace`): what was measured on the fallback is never read once the real
face exists. The stage is redrawn when a face of the reference family lands (`document.fonts`'
`loadingdone`, beside `init()`'s one `fonts.ready` redraw): a stylesheet still on its way when the stage was
drawn has registered no face, so `fonts.ready` is already settled and nothing else would re-seat the letter
before the next click. A face of any other family redraws nothing.

Which letters leave the body band is a per-letter `.asc` / `.desc` flag on the letter table — the same
two booleans Hebrew has always carried for lamed and the finals. Those were classified by measuring
every glyph against its own font's cap height across the same corpus, so they are readings rather than
opinions. Samaritan is the one set measured from a **single** face — `hebrew-square-samaritan` is the
only shipped font that draws the block — and a pen hand at that, with a median letter bottom of
−15/1000, so a raw threshold would have read overshoot as descenders. `SMR_DESC` was cut on ink width
per scanline instead (the five letters still carrying ink at −30), and `SMR_ASC` holds nun alone, which
tops 1.42× the median where the `letterTop`→`lamedAscender` step is 1.33×. Samaritan is also the first
caseless set outside Hebrew to use `.asc`, so `guideLinesSVG` labels that line `asc` rather than
`lamed` when the glyph is Samaritan. Those 22 letters also carry the Samaritan marks' three columns
(*Mark families* below).

On export, `sCapHeight` and `sxHeight` are **measured from the shipped `O`/`H` and `o`/`x` ink** and
omitted when the font carries no cased script — a Hebrew-only export is byte-identical to what it was.
Before v5.54 neither was ever passed to `setupOS2`, so every font this tool produced declared `0` for
both, which tells a layout engine the font has no case at all.

### Glyph transforms — the `gx` engine, Scale all letters, and the size factor
One engine applies a geometric change to many glyphs in **one** undo step. A new whole-font tool
(slant, width…) is a new *operation*, never a new loop over `project.letters`.

**The contract.** An operation is `{ label, affine(letterLike), fontX, fontY, markFactor, … }`:
- `affine` returns the per-glyph map in font units, `[a,b,c,d,e,f]` with `x' = a·x + b·y + e`,
  `y' = c·x + d·y + f` — or a spec `{T, advance, keepRsb, keepLsb, …}` when the defaults are wrong,
  or `null` to skip the glyph. It is also called with a letter-like stand-in for an imported composed
  outline (`pc.src`: `contours`, `curves`, `advance`, and the base letter's `codepoint`), so it may
  read only those.
- A spec may say that the outline step is **more than the affine map**: `out` is a ready outline
  result (`gxOutline`'s record — `keep`, `rings`, `curves`, `lost` — plus `closed`), used in its
  place; `TA` is the map for anchors, pins and a composed form's `anchor` / `holam` when it differs
  from `T` (which stays the map of the photo, the capture box and the stroke centre lines); `penK`
  fixes the pen-width factor (1 = the pen is left exactly as it is, a chisel's nib included);
  `setAdvance` writes the new advance on a letter that was still on the default one.
- `fontX` / `fontY` are the factors for font-wide horizontal / vertical lengths (`null` = leave them);
  `markFactor` is the uniform factor for mark size (`null` = leave marks). The horizontal factor has
  four audiences, each following `fontX` unless the operation names it: letter geometry (`fontX`
  itself — the default side bearings, the trop side-column spread, vertical user guides), spacing and
  kerning (`spaceX`), the vowel–trop pair shift (`pairX`), a typed meteg gap (`gapX`).
- `lean` / `markShape` (a slant), `leanScale` (a width change narrows a lean with the letters),
  `markWide` (the marks' width factor) and `refuse` (the operation cannot be done at all at this
  amount) are described with the operations that use them.
- A map that mirrors (determinant ≤ 0) is refused: it would reverse every contour's direction, and
  flips belong to the point editor.

A set is `{ scope: 'letter' | 'tab' | 'all', cp, cat }`; `tab` is `tabDrawCps(cat)`, `all` is every
item in `project.letters` whatever its tab's switch says (a tab turned on later must not be the old
size — the Generate Bold rule). The font-wide factors and `markFactor` apply only with `all`.

**`gxPlan(op, set)` is pure** — it reads the project and returns every new value plus its findings.
**`gxCommit(plan)`** refuses a plan with a blocking finding, then makes one `udDo` whose body is only
assignments of those precomputed values, so a transform cannot stop half-way through a font. Callers
`udFlushPending()` first (an open slider burst holds a "before" from before the change) and plan
afresh at commit time, never from a preview's copy.

**The census — what a glyph transform has to carry.** Miss one and the font is quietly inconsistent:
- *Outline:* `contours[].points` and `curves` through the **same** map, rounded (the
  `buildWideGlyph` / `translateLetterX` precedent). Curves are kept — an affine maps a Bézier exactly;
  Generate Bold has to drop them, this does not. A contour that collapses is dropped **with** its
  `curves[i]` (the export ships curves only while the two arrays are the same length).
- *Width:* `advance`, `lsb`, `rsb` when stored.
- *Marks' positions:* `anchors[*]` and the pins in `markAnchors`, rounded at the source. A side trop
  column still at its default (centre ± `tropSideOffset`) is re-tied to the new centre ± the spread
  — the new one when the spread scales, the same one when it does not (one letter, one tab) —
  because `setTropSideOffset` recognises "still the default" by exact equality: mapped on its own, the
  column would stop following the slider.
- *Photo:* `l.transform` (image px → stage px) left-multiplied by the map conjugated into stage space
  (`gxStageMatrix`), for every item that has an image — drawn letters too, they carry a frame raster.
  `lineWeight` is a font-unit length and follows; `epsilon` (the Detail slider) does not.
- *Pen strokes:* stroke and carve **centre lines** through the map; order and `cg` untouched. Under
  a uniform scale that is exact (`w`, `tl`, `rim` × the factor). Under any other map a round pen has
  no exact image, so widths take the map's area factor (× √det — 1 for a lean): re-saved, the
  drawing keeps the new shape, a little heavier at a large lean, instead of snapping back. A chisel
  pen *is* exact — its nib edge is a segment, so `na` and `w` are mapped as that segment. A dotted
  pen re-walks its dots. (A stored raster and one rebuilt from the mapped strokes therefore differ
  slightly; `drawEnsureRaster` swaps one for the other on a cloud reopen, harmlessly.) The result
  goes through `sanitizeDraw` **before** `drawSig` is computed: a stored value the loader would
  change makes `drawNeedsTrace` true after a reload, and entering Trace would then silently redraw
  the letter. A drawing that was saved stays saved; one that was waiting stays waiting.
- *Composed forms:* `pc.anchor` (its `auto` flag rides along), `pc.holam`, and `pc.src` /
  `pc.srcDagesh` rebuilt as **new** objects — the `precomp` undo snapshot shares the old ones by
  reference, so mutating one in place would corrupt undo.
- *Font-wide:* the guide lines in `metrics` (not the baseline; the imported typo box is held inside
  its valid range, since an out-of-range value is deleted on the next load), `spacing`, every
  `kerning[].value`, `tropSideOffset`, `vowelPair.dx`, a numeric `metegGap`, user guides by axis, and
  each sheet's `fitScale` (a letter boxed from that sheet later must arrive at the new size).
- *Untouched on purpose:* `handEdited` (one exception: a keep-stems width change marks a **photo**
  letter hand-edited, below), the placement flags, `savedAnchors`, `source`, `kernClasses` (members,
  not lengths), `kernChecked` (pair keys, not lengths), a wide form's `widthScale` (a ratio), `markNudge` (vertical only).
- *Session state the commit resets:* `lastSavedAnchors` (also on undo / redo of the entry —
  `gxAfterHistory`), `_rawTrace`, `_fidelityLast` (the import report measures against the source
  font's bytes and its Apply would write the old positions back), `_hiddenContours`, the node model.

**Mark shapes are never transformed.** Every shipped Hebrew and Samaritan mark is drawn and exported
as *shape × its size setting* about its attach point, so the engine resizes marks by multiplying the
six settings (`markScale`, `dageshScale`, `cholamScale`, `holamScale`, `tropScale`, `smrMarkScale`)
and every per-form `pc.markScale` — exact for built-in and custom marks alike, and `markNudge` needs
no change (it is added before the multiplier). That is why the **stored** mark-size range is wider
than the sliders': `MARK_SIZE_MIN`–`MARK_SIZE_MAX` (10–400%) in the setters and
`sanitizeFontNumbers`, while each slider keeps its 40–180 (a form's dot 30–200) and stretches only as
far as it must to hold the value it finds (`markSizeRange`). Latin accents have no size setting (they
bake at scale 1), so there the shape *is* scaled: an imported accent in place, a built-in one that
actually ships through a scaled custom copy created before the undo snapshot (the Generate Bold
idiom — emptied by undo, it reads as the built-in again).

**An operation may stamp a record and carry Font Details fields.** `op.stamp(letter)` returns fields
to set on every letter the operation changes (`null` removes a key) — still only assignments and
deletes at commit. `gxCommit(plan, meta)` sets Font Details fields with the change — `style`, `width`
(the width name), `italicLean` (a typed Italic angle); `GX_META` is the table of how each is read and
written — and remembers each one's two values on the undo entry (`gxMeta`, a list); undo and redo put
the other value back **only while the field is still what the operation left it at**, so a choice the
teacher made since is never overwritten. These fields are metadata — outside every undo scope — so
every non-form writer of one calls `syncMetaToForm()`: `onMetaChange` reads the values back from the
form, and is called as a flush by Save-as and the cloud save.

**Findings.** *Refuse* (nothing changes): a coordinate, anchor, pin, advance, kerning value or guide
line past `GX_COORD_MAX`; a pen stroke past the loader's −2000…3000; a glyph that would lose every
contour; a mirror; an operation's own `refuse` (`narrow`: a width with no room left for the stems).
*Warn* (Apply stays available): contours lost to rounding; a letter with a photo or drawing whose ink
leaves the window the tracer can rasterize (`GX_TRACE_WIN` — its outline is fine, a later re-trace
would clip it); settings held at a stored limit; `closed` — letters in which a counter closes or
strokes meet (the width step's finding). Letter names in a message go through
`gName`, and through `textContent`.

**The size factor (`metrics.sizeK`, read by `gxK()`).** The anchor seeds (`ANCHOR_Y`, the +40 / 120 /
380 rules, `TROP_GAP_*`), the mark-on-mark gap, the default holam offset, the Auto meteg limits, the
default line box's breathing room and QA's overlap tolerance were written for a 600-unit letter. A
uniform whole-font scale with the guide lines on multiplies `sizeK` by its factor, and those readers
go through `gxKLen` / `gxKY`, so a letter traced **after** a rescale is seeded like its neighbours.
At 1 (absent) every one of them is the integer it always was. It lives in `metrics` so the `metrics`
undo scope carries it and Reset metrics returns it to 1 with the lines. A new constant that means "a
distance at the standard letter size" goes through the same two helpers.

**Scale all letters** (`gxScaleOp`, `#scaleAllOverlay`, `scaleAll*`) is the first operation: a uniform
scale from the baseline. With *spacing and guide lines* on, x scales from the glyph origin, so the
side bearings scale too; off, the ink keeps its left edge and both bearings keep their width. A size
outside 25–400 is "not a size yet" (no preview, Apply off) rather than clamped. Its before / after
strips share one viewBox so the change shows, and `reinkPreviews` repaints them on a theme switch.
A scaled stock punctuation mark becomes an ordinary outline (`isStockOutline` compares by value).

**Slant** (`gxSlantOp`, the dialog's second tool — `SA_TOOLS` in `scaleAll*`; one dialog, a row of
that table per tool) is a horizontal shear about the baseline: `x' = x + tan(angle)·(y − baseline)`,
angle signed, **+ = leans right** (in the file a right lean is a *negative* `italicAngle`). Width,
kerning and the guide lines do not change. The lean direction the controls start from is
`slantDirDefault()`: the project's own last choice (`project.view.slantDir` — a view preference,
`markDirty()` only), else left for Hebrew and right for a Latin-script tab.

**The lean record (`l.slant`, degrees, rounded to 0.1°; composed by adding tangents —
`slantCompose`).** Stamped on every letter a slant changes (a photo-only letter too). It is what the
Italic export declares, and what lets code that assumed an upright letter keep working — each reader
is the identity at 0:
- `uprightExtent(l)`: `finalizeFromRaw`, Fit margins and Reset metrics measure a letter's **width**
  on the un-leaned ink, so a slanted letter traced again keeps its advance instead of gaining its
  overhang.
- `seedAnchors`, `ensureNikkudAnchors`, `ensureTropAnchors` and the QA mirror seed on
  `uprightContours(l)` and then lean the points (`leanAnchorSet`).
- Wide letterforms and digraphs: an x-scale would turn a lean of k into k·w, so `buildWideGlyph`
  un-leans, widens and leans again (`wideXY`), and hands every other site the one map, `g.tx(x, y,
  i)` — the donor's anchors and pins, QA's wide rows. A new site that widens uses `g.tx`, never
  `wideX` on a leaned coordinate.
- Latin accents are baked into their letter, so `markContoursFor(letter, 'accent', cp)` leans the
  accent by that letter's own record.
The record is **cleared** where an outline is replaced from outside (`importLetterOutline`, which
then stamps the source font's own lean; `assignSvgContours`; a new photo, crop or auto-split;
Center image; clearing punctuation) and **copied** where an outline or a picture matrix is copied
(Copy outline, duplicate glyph, convert wide form, apply alignment). A new path that replaces or
copies an outline does the same. The photo "skew" nudges in Align leave no record.

**Marks under a leaning font (`project.font.markLean[kind] = { place, shape }`, tangents, per mark
store, under `tropTune`).** A mark is one glyph for every letter, so following a slant is font-level
state, changed only by a whole-font slant: `place` is how far the letters lean, `shape` how much of
that goes into the mark's own shape. In mark-local space the map is `x' = x + shape·y + (place −
shape)·cy` (cy = the height of the mark's centre). With the box off (`shape` 0) a mark stays upright
and is only slid to where the lean puts it — a built-in shin dot sits 150 units above its anchor and
would otherwise be 32 units off at 12°; with it on, `shape = place` and the mark leans. It is applied
in **one** place: `markGlyphContours`, `markContoursFor` and `markGlyphCurves` wrap `*Raw` twins,
and every view and the export read mark shapes only through the public three. The `*Raw` readers are
for measurements that need the upright shape — `hatafSplit`, `_metegInk` (so the Auto meteg gap and
the pairing do not move), and the hataf-meteg splice, which is assembled upright and leaned once at
the end — and for the mark editor, which shows the upright shape with a one-line note. Importing a
kind's shapes resets that kind (`markLeanReset` — the `markScale = 1` rule). `markMkmkAnchor` follows
the lean; the import-fidelity predictor measures only freshly imported kinds, whose lean is 0.

**Width** (`gxWidthOp`, `gxWidthPlan`, the dialog's third tool) makes letters narrower or wider:
advance and side bearings always scale with the letter, heights never change, `fontX` carries the
letter geometry, the spacing group follows by option (by the typed percentage), and the marks are left
alone unless asked. With the *Keep stem thickness* box off it is a plain X scale — the affine path.

*Keep stem thickness — `gxwShape`.* A plain X scale by s thins every upright stroke by s. The step
undoes exactly that and nothing else: after the scale **every point slides sideways only**. For a
straight stroke of thickness t whose edge runs along the unit direction u *after* the scale, the one
sideways shift per edge that restores the thickness measured **across** the stroke is
`(t/2)·(1 − s·M)/|u.y|` outward, with `M = √(u.x²/s² + u.y²)` — t·(1 − s)/2 for an upright edge, 0 for
a flat one, exact for a diagonal at any angle, negative (thinning back) when s > 1. A point takes the
mean of its two legs' shifts weighted by `u.y²`, so a flat edge never drags a corner, an apex stays
put, and — since no y is ever written — every height and every horizontal stroke is unchanged by
construction. There is deliberately no mitre and no added corner point: nothing that could lift a
corner or tangle a noisy outline.
- *Curves are kept.* A cubic is first cut at its interior x- and y-extrema (`gxwSplitCubic` — a bowl
  drawn as one sweep has flat end tangents and would otherwise get no correction at its sides), then
  each handle rides with its own end point, so smooth joins stay smooth and every control point keeps
  its height. The polygon is moved by the same rule on its own points (direction read over
  `GXW_WIN` units of outline, so a noisy tracing does not jitter); only a `handEdited` letter's
  polygon is re-flattened from its curves (`gxwFlatten`, `nodeContourToPoints`' rule) — elsewhere the
  polygon and the fitted curves agree only to the fit tolerance, and re-flattening would move the
  bounds that the advance and the anchor map are measured on.
- *Which side is ink* is tested per ring on the outline itself (`gxwSides`: a point just left and just
  right of a long edge, by winding number) — never read from `winding` or the direction: imported OTF
  outlines and the built-in punctuation run the other way round from traced letters.
- *Which thickness.* `gxwStem` slices the **un-leaned** polygon horizontally, keeps the ink runs
  bounded by two steep edges, follows them from slice to slice as columns and keeps only a column
  taller than it is wide (a roof bar or a dash is bounded by steep ends too); the median is the
  letter's stem. `gxwCensus` takes each alphabet tab's median (Hebrew and Latin stems differ);
  `gxwStemFor` holds a letter's own value to 0.6–1.6× its tab's, falls back to the tab's, and returns
  null — plain scale — for a font with no measurable stem. Each **edge** then uses
  `min(the letter's stem, the ink's own width across the stroke at that edge)` (`localT`: one
  look-across per leg, edges binned by height — `gxwBins`), so a hairline is not fattened when
  condensing nor eaten when widening; above `GXW_LOCAL_MAX` points the letter's one value is used.
- *A notch narrower than the stems grew* (the crotch of a Latin n): an edge whose two ends passed each
  other closes to a point in the middle instead of leaving the outline crossing itself; and where a
  ring still crosses itself that did not before, the small loop at the notch's tip is cut back to
  where its two sides meet (`gxwUnloop`) and that one contour ships as its polygon (a null curve
  entry). A large loop is a real overlap of two strokes: left as it is and reported by the gap columns.
- *The result* is translated so the ink's left edge lands exactly on s × its old place, rounded, and
  returned as the spec's `out`; `TA` maps old ink edges → new ink edges (`boldGenLetter`'s rule) and
  `penK` is 1, so a re-saved drawing keeps its stems. A **photo** cannot: such a letter is stamped
  `handEdited`, so Trace asks before a re-trace would silently bring the thin stems back.
- *What the percentage means.* Restoring stems gives width back, so the shapes take a smaller factor k
  than the typed s, one for the whole set, chosen so that the set's total advance comes out at s:
  first `(s·ΣA − Σt)/(ΣA − Σt)` (`gxwFirstK`), then corrected from the plan's own outcome, at most
  twice (`gxWidthPlan`; `plan.adv` is the total advance before and after). The dialog's note says
  what the text becomes. `k` outside 0.2–2 is the `narrow` refusal.
- *The `closed` finding — gap columns.* No height moved, so the same horizontal slice cuts the letter
  before and after: every gap between two runs of ink (a counter, or the space between two strokes)
  is followed slice by slice as a column and matched to what is left of it. A column is reported when
  it was open and is now shut — or all but: narrower than a quarter of the stem *and* than half its
  old width — along its **whole** height; a
  ring that collapses or turns inside out is reported when it was a counter. A wedge-shaped notch only
  gets shorter at its tip — which is why this follows columns instead of testing the outline for
  crossings (those fire on every crotch).
- *Lean.* A lean is a tangent, so it narrows with the letter: the stamp scales `l.slant`, `leanScale`
  scales `markLean`'s numbers for a whole-font run, and a typed Italic angle rides `gxMeta`.

**Marks under a width change (`project.font.markWide[kind]`, a factor, under `tropTune`).** Only with
the *also adjust marks* box: one factor per mark store, applied by the same three public readers as
the lean — a sideways squeeze about the attach point (x = 0 in mark-local space), **before** the lean
(`markLeanFn` returns the combined map; `markWideK(kind)` reads the factor, 1 when absent). The `*Raw`
measurements stay unsqueezed and what is built from them is squeezed as one finished mark:
`metegPairFor` / `metegPairRightFor` multiply the pair's two offsets, the hataf-meteg splice goes
through the map at the end, and so a meteg gap (typed or Auto) is a distance in unsqueezed mark space
and is **not** scaled by the engine (`gapX` is null for a width change; the vowel–trop shift, a
letter-space distance, is — `pairX`). Latin accents have no font-level setting, so their shapes are
squeezed in place (x only), as a resize does. Importing a kind's shapes resets it with the lean
(`markLeanReset`); the mark editor shows the unsqueezed shape with its own one-line note. Squeezed
marks are not stem-corrected.

**In the point editor** the Transform section works on the node model, about the centre of the
affected nodes' box, as before. A whole-glyph **scale or horizontal flip** (nothing selected, no
contour hidden) also maps `l.anchors` and the pins about that pivot in the same undo step
(`xformMappedAnchors`; on a flip the left / right columns keep their sides and a side column's pin
keeps its mirrored offset). A rotation, a vertical flip and any selection leave them alone — an
"above" point must stay above, and part of a letter is not the letter. The live slider keeps the
pre-drag anchors in `_xformBase` and re-maps from them each tick, so a release at neutral still
leaves zero undo entries. The sliders run from one table of kinds (`XF_KINDS`: neutral value, undo
label, readout, done-message), and the pivot comes from the map itself (`xformPivot(keys, m)` — a
slant pivots on the baseline through `m.py`), so the nodes, the range check and the anchors can never
use different ones. A whole-glyph **slant** also carries the letter's photo and pen strokes
(`xformSlantCarry`, the engine's own patch) and updates its lean record; the other whole-glyph
transforms keep the record true (`xformSlantAfter`: a flip mirrors it, a Width/Height scale changes
its tangent, a rotation turns it). A selection moves only its points. **Width % with *Keep stem
thickness*** (`xformStemsOn`, `xformWidthStems`) is not a node-model transform at all: it is the
engine's width operation for this one letter — the advance and side bearings follow, the pivot is the
glyph origin, one undo step — offered only for the whole glyph with the pen off; Height and Keep
proportions are switched off while its box is ticked, and it settles any open slider burst first
(`_xformBase = null` — a stale base would write the old model back over the result).

### Font styles — Regular, Bold, Italic, Bold Italic — and width names
`project.font.style` is one of `regular | bold | italic | bolditalic`, and **`FONT_STYLES` is the only
place that knows what that means**. Every test, name and suffix goes through it (`fontStyle()`,
`fontIsBold()`, `fontIsItalic()`, `fontStyleInfo(v)`, `fontStyleOf(v)` to coerce, `fontStyleMake(bold,
italic)`): a style compared by hand somewhere would behave as Regular there — and since the style is
part of a project's identity, its files and its My Fonts / Recent / account names would then replace
the Regular's.

| | nameID 1 | nameID 2 | nameID 4 | nameID 6 | file stem | fsSelection | macStyle | weight |
|---|---|---|---|---|---|---|---|---|
| Regular | Family | Regular | Family | Family-Regular | Family | 0xC0 | 0 | 400 |
| Bold | Family | Bold | Family Bold | Family-Bold | Family-Bold | 0xA0 | 1 | 700 |
| Italic | Family | Italic | Family Italic | Family-Italic | Family-Italic | 0x81 | 2 | 400 |
| Bold Italic | Family | Bold Italic | Family Bold Italic | Family-BoldItalic | Family-BoldItalic | 0xA1 | 3 | 700 |

- nameID 1 identical in all four and nameID 2 exactly these words is what makes Windows and macOS
  group the files as one family whose B and I buttons switch between them; no nameID 16/17 is
  written for a normal-width font (they are for families with more than these four). nameID 6 is cut
  to 63 characters by trimming the family part only as far as that style needs.
- The Python block rebuilds the three style bits of `fsSelection` from scratch (it used to clear the
  italic bit in both branches) and keeps USE_TYPO_METRICS. The spec carries `italic`, `italicAngle`,
  `caretRise`, `caretRun` **only for an italic style**, so a Regular or Bold file is built exactly as
  before. The UFO's fontinfo mirrors it (`styleMapStyleName`, `italicAngle`, the caret slope —
  omitted, never null, for an upright style; `openTypeOS2Selection` stays `[7]`).
- **The declared angle** is `fontItalicLean()` (+ = right; the file gets its negative): the teacher's
  own number from Font Details (`project.font.italicLean`) when set, else the most common lean among
  the drawn letters' records (`fontSlantInfo()`, which also counts how many letters differ — shown
  in the panel and, when the teacher has not chosen, on the Exported screen). Regular and Bold
  declare 0 whatever the letters do. The caret slope is `UPM / round(tan(lean) × UPM)`, or 1 / 0.
- Importing a font flagged italic (fsSelection bit 0, macStyle bit 1 or a declared angle) sets the
  style and stamps the source's angle on each imported letter (`importFontLean`).
- An Italic is its own project, as a Bold is: the same Family name in each. A whole-font slant with
  its Style box ticked turns *this* project into the Italic, its saved copy with it.

**Width names (`project.font.width`, absent = normal; `FONT_WIDTHS`).** The second half of a
project's identity, read only through `fontWidthOf` / `fontWidthInfo`, for the same reason as the
styles. **`fontNameParts(f)` is the one place every name comes from** — `famSfx` (what joins the
family in nameID 1), `sfx` (after the bare family in a full or stored name), `file` (after it in a
file or PostScript name), `sub` (nameID 17) — and `buildFontSpec`, `buildUfoFontInfo`, `fontFileStem`,
the zip's CSS, My Fonts, the specimen, the submit prefill, `fmDerivedProjectName` and `recentNameOf`
all read it. A site that builds a name from `fontStyleInfo(…).sfx` by hand names a Condensed font as
the normal one, and it replaces that font's file, list entry or saved project.

| width | word | `usWidthClass` | stands for | nameID 1 | nameID 4 (Bold) | nameID 6 (Bold) | nameID 16 / 17 (Bold) |
|---|---|---|---|---|---|---|---|
| condensed | Condensed | 3 | 85% | Family Condensed | Family Condensed Bold | Family-CondensedBold | Family / Condensed Bold |
| semicondensed | Semi Condensed | 4 | 92% | Family Semi Condensed | … | Family-SemiCondensedBold | Family / Semi Condensed Bold |
| normal | — | 5 | 100% | Family | Family Bold | Family-Bold | not written |
| semiextended | Semi Extended | 6 | 108% | Family Semi Extended | … | Family-SemiExtendedBold | Family / Semi Extended Bold |
| extended | Extended | 7 | 115% | Family Extended | … | Family-ExtendedBold | Family / Extended Bold |

- The width word joins **nameID 1**, so a condensed font is a family of its own with its own Regular /
  Bold / Italic / Bold Italic (nameID 2 and the style flags are untouched) and installs beside the
  normal-width font; nameID 16 / 17 carry the bare family and "Condensed Bold" for programs that list
  a family's widths together. The spec carries `widthClass` and the two typographic names **only when
  the width is not normal**, so a normal-width font is built exactly as before. In the UFO the pair
  `familyName` / `styleName` is the typographic one and `styleMapFamilyName` is nameID 1.
- The account's `style` column is unchanged; the row's **name** carries the word.
- The Width dialog's box sets the name with the change: `fontWidthAfter(current, pct)` — the nearest
  name (by ratio) to the width the font already stands for × the percentage, so Condensed widened by
  118% is normal again. Only five names; other amounts take the nearest.
- Importing a font reads `usWidthClass`; a family name that already ends in the word gives it up there
  (the export would otherwise say it twice).
- A condensed font is its own project, as a Bold or an Italic is.

### Shapes, holes and kept directions — the point editor's building blocks

Edit points can add a **rectangle**, a **rounded rectangle** or an **ellipse** as one closed contour,
solid or as a **hole**, and can switch any contour between the two. Three facts decide the design.

**A hole is a direction, and it is the points' order, not the label.** `c.winding` ('cw' solid,
'ccw' hole; y-up font units, so a solid's `signedArea` is negative) is only a label. Every view
(`contoursToPath` / `glyphPathAt`: the stages, the QA grid, the Spacing preview, the transform
strips) and the export (`Cu2QuPen` with `reverse_direction=False`, no overlap removal, no direction
fix — TTF and UFO alike) fill by the **nonzero** rule from the order the points are stored in. So a
contour cuts a hole exactly where it runs against the ink it lies in **and** that ink is wound once:
a hole that pokes past the letter's edge prints as ink there, two overlapping holes leave an island
where they overlap, and a hole over two overlapping solids cuts nothing. There is no subtraction;
`holeTroubles(l)` says when a hole is not cutting — it asks "is this ink?" (`gxwEdges` / `gxwInside`)
of points just inside each hole's edge — and the Contours list shows a note under that row.

**Which contours are holes is read in one place, `contourRoles(rings, kept)`** — the Contours rows,
their switch (`contourToggleHole`), `holeTroubles` and `nodeKeepAll` all use it, so a row, its note
and the keep step cannot disagree. In a kept letter a hole is a counter-clockwise contour, nothing
more. An automatic letter is read **relative to itself**: when its largest contour (an outline's
biggest ring is a solid) runs counter-clockwise the whole outline is drawn the other way round — an
imported CFF outline, the stock punctuation marks — and then *clockwise* is the hole, with its
inside on the right of travel; and a contour that stands clear of every other one (their boxes do
not meet) is a solid whichever way it runs. The label is never consulted: a CFF outer is labelled
`'ccw'`, and reading the label called it a hole that was not cutting.

**Nesting cannot decide a block letter.** `renestNodeModel` used to re-derive every contour's
direction, on every structural edit, from how many other rings hold the contour's *first point*.
That is right for a traced letter and wrong for one built from **overlapping solids**: a roof bar
whose first corner lies inside a stem would turn into a hole — a white bite — at the next move, flip
or paste, and a bar laid over a stem's first point would turn the *stem* into one. So a contour may
carry **`dirSet: true`** ("the teacher chose this contour's role"), and a letter is one of two kinds:

| | which contours carry `dirSet` | what `renestNodeModel` does |
|---|---|---|
| **automatic** | none | the nesting rule, exactly as before, on every call |
| **kept** | all | only makes each contour run the way its label says; a contour that arrives without the flag (pen, paste) is decided once by nesting and then flagged |

- A letter becomes kept when a shape is added (`shapeInsert`), a contour is switched
  (`contourToggleHole`), a flagged contour is pasted in, or artwork is added to it (`svgPasteAdd`).
  Each of them calls **`nodeKeepAll()` first**, and that step **never changes the fill**. It takes
  no nesting decision: the nesting rule reads only a contour's first point, and on an imported
  letter of overlapping contours that run the same way it turns one of them into a hole — frozen by
  the flag, that blanked part of the letter. Instead every contour is flagged and labelled from the
  direction it really runs in. An outline drawn the other way round as a whole — its largest
  contour counter-clockwise, as an imported CFF outline and the stock punctuation marks are — has
  *every* contour reversed together (`nodeTurnContour`: curves kept, selected points remapped),
  which leaves the nonzero fill as it was and puts the letter in this file's convention; and a
  contour that stands clear of all the others is turned to run as a solid, which either direction
  fills alike (the stock question mark's hook runs one way, its stem and dot the other). The roles
  are read by `contourRoles(rings, kept)`, so the step freezes exactly what that helper reads. A
  letter that is already kept only has its contours made to run the way their labels say. *Before*
  the new contour is pushed: the letter's own direction has to be read without it.
- `renestNodeModel` is unchanged for an **automatic** letter: a flip, a rotation, pasted points, a
  pen contour and a contour delete still apply the nesting rule to it, which on a letter of
  overlapping same-direction contours (a few letters of the starting fonts are drawn that way) can
  turn one of them into a hole.
- "Run the way its label says" is what handles a **mirror flip** (which reverses every contour) and
  a contour **dragged or nudged inside out** — the point drag's pointer-up and the arrow nudge call
  `renestNodeModel` too, for kept letters only (`nodeKept()`); they never did before.
- The flag lives on `l.contours[i]` and the node-model contour, never on `l.curves[i]`; it is written
  only when true and read as `=== true` (a project file is untrusted). **Where it travels:**
  `buildNodeModel` and `writeThroughRebuild`; copy / paste of a *whole* flagged contour
  (`copySelectedNodes` / `pasteNodes` — a partial copy, and any copy from an automatic letter, pastes
  as before); `svgPasteAdd` (every add makes the letter kept, and its pieces join flagged); Generate
  Bold; Convert wide form (all-or-nothing across the bases it joins); and for free wherever the
  contour object is copied — the transform engine (`gxLetterPatch`), undo, duplicate letter, copy
  outline, save / load, cloud. **Where it is dropped on purpose:** anything that replaces the outline
  from outside (a re-trace, an import, an SVG upload, Clear outline) — the letter is automatic again.
- In a kept letter a hole moved out of the letter stays a hole (it prints as ink, and the note says
  so) until *Make solid* is pressed, and a hole whose parent was deleted likewise. That is the price
  of a role that does not change behind the teacher's back.

**The tool.** State: `_shapeTool` (null / 'rect' / 'round' / 'ellipse' — exclusive with the pen and
the marquee at every site the pen has one), `_shapeHole`, `_shapeRadius` (a UI pref), and the draft
in `nodeDrag` (`type: 'shape'`) — never in the model, like the pen's.
- `shapeNodes(kind, x0, y0, x1, y1, r)` returns the nodes of a **solid** (clockwise) in whole
  numbers: curves are rounded when written, so anything else would come back from an undo or a
  reload as a slightly different shape. An ellipse is four on-curve points with kappa handles
  (`SHAPE_KAPPA`, per-side radii about a whole-number centre); a rounded rectangle is eight points,
  one cubic per corner, its radius clamped to half the shorter side, with coincident points merged (a
  stadium at half a side, a circle at half of both; under 2 units it is a plain rectangle). Node
  `type` is set with `nodeIsSmooth`, which is how `buildNodeModel` will read it back. A hole is the
  same nodes through `reverseNodeContour`.
- **Pick, then place.** A Shapes button picks (`shapePick`; pressing the picked one, the Select
  button or Esc puts the tool away). Then either a **drag** on the stage — `shapePointerDown` /
  `Move` / `Up`, routed from `onStageBgPointerDown` *before* the Alt-insert branch because Alt here
  means "no snapping"; both corners snap like a pen click and light `_snapHit`; Shift makes a square
  or circle (the longer side wins, then one axis may snap and the other follows); the corner is
  clamped to the drawn window, since a captured pointer can leave the stage; a click without a drag
  and a cancelled pointer add nothing — or **Place in the middle** (`shapePlaceMiddle`,
  `shapeDefaultBox`): a solid at 70% of the letter box (`glyphBand(cp)` × `dispAdvance(l)`), a hole
  at half the selected contours' box (a shape just added is selected), else the ink's, else the
  letter box's. There is deliberately **no global Enter key**: the node keydown handler sits on
  `document` and would swallow Enter on a focused panel button.
- `shapeInsert` is the one writer: **one `udDo([itemScope()], …)`** = `nodeKeepAll()`, push,
  `renestNodeModel()`, `writeThroughRebuild(l)`. Afterwards the tool is away and the new contour is
  selected, so the arrows nudge it and the Transform fields size it. No outline moves, so anchors a
  teacher placed stay where they are, as with a pen or pasted contour.
- **The corner radius** (`#shapeRadius`) commits on its own `change`, and again when a shape is about
  to be made: `shapePointerDown` and `shapePlaceMiddle` call `shapeRadiusCommit()`, which reads the
  field with the same clamping. A drag never blurs the field (the stage's pointerdown is
  default-prevented, so the field keeps focus right through it), and without that a radius typed
  just before the drag went to the *next* shape. It is never committed on a keystroke, which would
  rewrite the number while it is being typed. When a shape is inserted with focus in that field,
  `shapeInsert` moves focus to the shape's own button instead of letting the rebuild hand it back:
  in a field the arrow keys step the radius, and the status line says they move the new shape.
- While a shape is picked, `renderNodeChrome` shows none of the three mode buttons pressed but still
  derives the toolbar's single Tab stop from pen / marquee / select — a fourth mode with no bar
  button would leave the whole bar unreachable by Tab.

**A blank letter** has *Build from shapes* beside *Draw with pen* (`buildWithShapes`): the same
one-shot seeding as `_penEntry` (`_shapeEntry` → an empty model), plus `_blankOk = curCp`, which
stands the "no outline → back to Trace" guard in `renderStage` down for that one code point — so an
undo of the first shape stays in Edit points instead of bouncing to Trace (and re-tracing a photo,
which would empty the redo stack). `_setWorkMode` clears it. The first shape in a blank letter also
writes the advance the stage was showing (`dispAdvance` falls from the reference glyph's width to a
default the moment contours exist), in the same undo step.

**Keyboard focus in the left column.** `renderControls` rebuilds that column from scratch on every
render, which used to drop focus to `<body>` after any press. A control that carries
**`data-fk="<key>"`** gets focus back on its rebuilt twin when nothing else took it (`renderControls`
wraps `renderControlsNow`). The Shapes buttons, the Contours switches (`ct:<index>`) and the
Transform buttons opt in; a new keyboard-operable control in that column should too. A press that
came from the keyboard (`event.detail === 0`) moves focus to *Place in the middle*, so "Enter,
Enter" adds a shape.

### Draw step — strokes, holes, and carve generations
A drawn letter keeps its ink as `l.draw.strokes` (each `{w, pr, pts, st?, …}`, points in font units);
the OUTLINE the rest of the app works with only exists once `drawCommit` runs the tracer, and
`drawSig`/`drawNeedsTrace` are what say the two have drifted apart. The three eraser modes differ
only in what pointerup commits: **whole** drops a stroke, **partial** (`drawEraseSplit`) cuts one
into fragments through its full cross-section, and **sculpt** (`drawCarveCommit`) touches the stroke
array as little as it can and instead records the swept path as a hole in the paper,
`l.draw.carves[] = {w, pts}` — the only mode that can shave a sliver off ONE side of a stroke.

**A hole only erases ink that was already on the page when it was swept.** Every stroke carries
`s.cg`, the number of carves that existed when it was committed, and carve *k* erases exactly the
strokes with `cg <= k`. Absent `cg` = generation 0, so a project saved before generations existed
renders and re-traces byte-for-byte as it did. Left global — one hole over everything, forever — a
sculpted patch became permanently un-drawable: redrawing through it and watching the new stroke
vanish as you drew it is the bug this exists to prevent. The three writers of a new stroke tag it
(`drawTagGen`), a partial-erase fragment inherits its parent's `cg` (it is the same ink, cut, not
redrawn), and `sanitizeDraw` pins a reloaded `cg` to the carves that actually survived the load.

Both renderers say the same thing two ways, and must keep agreeing — SVG/canvas parity is what makes
`drawEnsureRaster` deterministic:
- **Stage** (`drawStrokesSVG`): one `<mask id="fmCarveMask<g>">` per generation carrying carves
  `g…N-1`, each wrapping its own generation's strokes inside `#drawStrokes`. `#drawStrokes` itself
  deliberately carries **no** mask — it is the LIVE eraser's target, so `_drawEraseMaskEl` holds only
  the in-flight path (an in-flight sweep is by definition the newest carve and applies to every
  generation at once) and never has to re-state what is already committed. `[data-di]` lookups pierce
  both wrappers, and generations are emitted in ascending order so the stroke replay still reveals
  strokes in drawing order. With no carves nothing extra is emitted at all.
- **Export raster** (`drawRenderCanvas`): the drawing is REPLAYED in the order it happened —
  generation 0's strokes, carve 0, the strokes drawn after it, carve 1 … The canvas is opaque white
  by contract, so painting a carve white IS erasing and the tracer's 128 threshold reads it back as
  paper; replaying chronologically is all it takes for white paint to land only on ink that was
  already down. This is the whole export story for sculpt: `_drawCommitNow` and `drawEnsureRaster`
  both rasterize through here, so a carve reaches the outline, the QA sheet and the exported font.

A carve is fixed in letter space and NOT attached to a stroke, so sliding a stroke out from under one
of its own generation brings it back whole, and a carve over blank paper subtracts nothing. Caps:
`DRAW_STROKE_MAX` / `DRAW_CARVE_MAX` are the runtime ceilings **and** `sanitizeDraw`'s reload
ceilings — they must stay equal, or a reload silently drops ink the editor let you place.

**The live preview is built from the same geometry layer.** `_drawLivePathD` runs
`drawStyleGeom(s) || _drawRoundGeom(s)` — the round pen's own geometry (`drawRadiusAt` /
`drawStrokePoly`, a dot for a tap) in `drawStyleGeom`'s vocabulary — after `_drawTapFloor` and
hollow's no-pressure rule, so the in-flight `<path>` IS what pointerup commits, pressure included.
`drawPointerDown` picks it whenever the width will vary (`g.live`: a styled pen, real pen pressure,
or speed pseudo-pressure on a mouse/finger); a round stroke that will commit at one width keeps the
incremental `<polyline>`. Every path preview goes through `_drawLivePaint`'s rAF gate — one rebuild
per frame, never per sample (that is O(n²) per stroke) — and on that path the round pen costs what
the chisel pen costs (measured; `loop-findings.md`).

**Save all drawings** (`drawCommitAll(cat)`, one button per drawable tab via `drawSaveAllBtnHTML`):
`drawPendingFor(cat)` lists the tab's drawings still waiting for their Save (strokes +
`drawNeedsTrace`, never an SVG-sourced glyph; hand-edited ones split off and named — `drawCommit`'s
own protection, batched). Then `adApply`'s two phases: an async pass that rasterises each drawing
into `imgCache` and captures `drawSig` *at that moment*, then ONE synchronous `udDo` with exactly
`_drawCommitNow`'s writes per glyph, `curKind`/`curCp` retargeted per glyph inside a `try/finally`
(`rasterizeCurrent` and `traceSig` read the current item — `applyOutlineToAll`'s idiom). A drawing
whose signature changed while we were rasterising is skipped and named, never stamped with a
signature its outline did not come from; `_drawSaveAllBusy` guards re-entry and an in-flight
gesture is abandoned first. `syncDrawSaveAllBtns` hides a button with nothing to save and runs from
`renderGrids` and `renderControls`.

**Trace all** (`traceAll(cat)`, a button beside each tab's Save all via `traceAllBtnHTML` / the static
`.trace-all[data-cat]` markup, synced by `syncTraceAllBtns` from the same two places): the batch form of
the enter-Trace courtesy. `tracePendingFor(cat)` lists the tab's letters with a real photo and no outline
— `source.dataUrl` set and not the `'[omitted]'` autosave placeholder, not SVG, no strokes (a drawing,
even over a photo, is Save all drawings' — `source.kind` is re-stamped by `setInputMode`, so the strokes
are the test), `contours` null — so a letter that has an outline (traced, hand-edited, stock
punctuation) is never touched and there is no confirm; a `handEdited` letter whose outline was cleared
has nothing to lose and is traced. Unlike Save all drawings, the *expensive* half of the tracer
(`rawLoopsFontUnits`, plus `innerLoopsFontUnits` for an outline-only letter) runs per letter in the
async phase with a yield between letters — 27 photos traced inside one synchronous `udDo` would freeze
the page for seconds — with `curKind`/`curCp` retargeted around each call and put back after it (a tile
clicked mid-batch is respected); only `finalizeFromRaw` runs inside the one `udDo` (plain item scopes,
label `trace all letters (N)`), each letter re-checked against its captured `traceSig` and
outline-only settings and named as *changed* when they differ. Raw loops live only in the prep list,
never on `project`; `_rawTrace` is dropped afterwards. A batch where nothing traced pushes no undo entry
(`udPush` drops no-op slices), so the toast counts from `done`.

**The curves are checked along every side.** Every trace (a drawing's commit, a photo, Reduce points) ends
in `fitContourCurves`, which splits the simplified polygon at its corners and fits each chain with
Schneider's cubics. That fit measures its error only at the points it is given, and after RDP a straight
side keeps just its two ends — so each chain is first resampled along its own edges (`_densifyChain`,
no two points more than twice the tolerance apart). Without it a drawn stroke's side between its two
round caps became one cubic bowing ~40 units off the outline, and the exported stroke was a lens.

### Spacing preview — sample-text direction
`spacingPreviewLayout` returns `order`, the cell indices in **left-to-right visual order**, and
`spacingLineSVG` always walks it with the pen starting at the left edge. An all-Hebrew line is
unchanged by this (its order is simply reversed), but the panel used to lay out every sample
right-to-left unconditionally, so `Hello` drew *olleH*, `1234` drew *4321*, and the shipped `Mixed`
test phrase — the one that exists to show Hebrew beside digits and Latin — mangled both of its
non-Hebrew runs.

`bidiOrder` is the slice of UAX #9 the panel needs, and no more: **P2/P3** (base direction from the
first strong character; nothing strong → the page's own `dir`, which is what `dir="auto"` on the
input box resolves to, so box and preview cannot disagree), **W7** (a number following a Latin
letter *becomes* Latin — this is what keeps `v5.45` and the space after it in one run), **N1/N2**
(neutrals take the surrounding direction, and a number that stayed a number counts as R when
resolving them), and **L2**'s run reversal. Two embedding levels is the whole ladder: a plain text
field has no markup to nest deeper. Kerning stays a *logical* pair, so `spacingLineSVG` applies
`gaps[min(a,b)]` only between visual neighbours still adjacent in reading order.

Any change here is checked against **Chromium's own bidi**, not against reasoning: render the same
string in an element with `dir="auto"`, read each character's x with a `Range`, and compare the two
orders cell-by-cell. Doing that is what caught W7 and the EN-leans-R rule in N1 — both were wrong on
the first pass and both looked plausible.

The **kerning pair preview** reads its direction from the same place: `kernPairOrder()` runs the
pair's two representative code points through `bidiOrder`, `renderKernPreview` walks that order from
the left edge, and `kernSideCaption()` picks `kern_first`/`kern_second` ("(right)"/"(left)") or their
`_ltr` twins from the same answer — so the caption can never name a side the preview does not draw
on. A class side is judged by the representative glyph the preview already draws. The stored pair
stays in **logical (reading) order** whichever way it is drawn, because that is what the exported
`kern` feature wants; only the drawing flips. `setKernGlyph` refreshes both captions in place, for
the same reason it refreshes the Add/Update button rather than re-rendering: a full rebuild would
drop focus mid-typing, and typing a Latin letter can flip the pair's direction.

### Kerning and Common pairs

**Storage.** `project.font.kerning = [{left:[cp…], right:[cp…], value}]`, always in logical (reading)
order; a side with one code point is a specific pair, with more it is a group ("class") pair.
`project.font.kernClasses` holds the user's named groups. `project.font.kernChecked` holds the Common
pairs ticks as `'first|second'` keys.

**One reader for "what kerning does this pair get": `kernEffective(first, second)`.** It follows
`emitKern` (the export) rule for rule: a specific pair with a real value wins — the last one if the
list holds it twice — a pair at 0 is no rule at all, so a group pair that covers the two letters
shows through, and among group pairs the first in the list. `kernSpecific` is the first half alone.
The big sample (`kernPreviewValue`) and the chips read it, so neither can disagree with the exported
font. In `kernPreviewValue` the pair being edited still shows live; a *group* being edited never hides
a saved specific pair. A new reader of kerning calls `kernEffective`, never walks the list itself.

**Measuring a gap: `kernVisualGap(la, lb)`.** `kernOpticalGap(a, b)` scans both outlines every 20
units and returns the smallest clearance, and it assumes its **second** argument sits to the
**left** — right for Hebrew. `kernPairDir(a, b)` says how a pair is set (`'rtl'`, `'ltr'`, or `null`
for two different scripts, which sit in separate runs and never kern; punctuation and custom glyphs
take their neighbour's side), and `kernVisualGap` hands the letters to `kernOpticalGap` the right
way round. Call `kernVisualGap`; `kernOpticalGap` directly is only right for a pair known to be
Hebrew. The gap ignores the pair's own kerning and includes Letter spacing (`effLetterAdvance`).
*Suggest pairs* (`suggestKernPairs`) uses it, treats a space in the sample as a break, and skips
ticked pairs.

**The Common pairs block** (`renderKernCommon()` → `#kernCommon`, inside `#kerningBody`).
- *The Hebrew list is generated.* `KERN_COMMON_HE` (`[first, second, count]`, top 60) sits between
  the `kern-pairs:start` / `kern-pairs:end` markers and is written only by
  `node scripts/build-kern-pairs.mjs` from `data/hebrew_words.json` (each different `bare` spelling
  once; marks skipped over; anything else breaks a pair; ties by code point). `--check` exits 1 when
  the block differs from what the data builds. There is no CI here, so `--check` is run by hand, and
  after any edit of that data file. A rewrite of the block is an edit of a precached page.
- *The Latin list is hand-kept:* `KERN_COMMON_LATIN`, in its usual order, shown only while
  `project.font.addEnglishLetters` is on. It is not scored — its order is the priority.
- *Ranking* (`kernCommonLists()`): Hebrew pairs by count × min(200, |Auto-tightness target −
  `kernVisualGap`|), ties by frequency. The gap is the un-kerned one on purpose: a chip keeps its
  place while the teacher works along the row. A pair with a letter that has no outline
  (`kernCpTraced`) is left out. The first `KERN_CHIPS_SHOWN` show; *Show all* (`_kernMore`, session
  state) shows the rest. The block re-renders with the section, when a letter is typed into the pair
  boxes (`setKernGlyph`), and on the `change` of the Auto-tightness and Letter spacing sliders.
- *States:* `kerned` (`kernEffective` is not 0 — a group pair counts), else `checked` (ticked), else
  `plain`. Kerned wins over checked, and the tick stays underneath.
- *The tick* is written only by `kernFineToggle()` — one `udDo` over `'kerning'` + `'kernChecked'`
  (ticking also removes a row left at 0 for that pair, which would otherwise sit in Your pairs asking
  for a gap). The toggle is `aria-disabled`, with the reason as its title and as the status line when
  pressed, for a pair that is not listed, a pair that is kerned, or a Gap slider that is not at 0
  (`kernFineSync()` keeps that last one current in place while the slider moves; a ticked pair can
  always be unticked). `migrateProject` keeps only well-formed keys, once each, capped;
  `applyFontImport` clears the list when it replaces the outlines. Nothing else touches it:
  re-tracing a letter leaves ticks as it leaves kerning values, the glyph transform engine does not
  need to know (keys do not scale), and ticks never reach the font.
- *A chip* loads its pair with `kernChipLoad` — the saved row's value, else what a group pair gives
  it — which writes `kernEdit` only. *Next unreviewed pair* (`kernNextUnreviewed`) walks the Hebrew
  list then the Latin one from the pair in the editor to the next `plain` chip, wraps, opens *Show
  all* when that chip is hidden, and refuses — saying so — while the editor holds a gap that differs
  from the saved one (`kernEditSaved`), so walking on never drops a dragged gap.
- *Keyboard.* Each row is `role="toolbar"` with one Tab stop (the current chip, else the first;
  `kernChipFocus` moves it with focus). `kernChipKey` walks the row with the arrow keys in the page's
  direction, Home and End, and **stops the event**: the page's arrow-key nudge listens on the document
  and a focused button does not block it, so without that an arrow on a chip also moves the letter
  open on the stage. A chip is announced by letter name (`kernCpSay`), the value with a real minus
  sign, isolated left-to-right.

**Keyboard focus in the Spacing tab: `fkKeep(rootId, fn)`.** `renderKerningSection` and
`renderSpacingPanel` rebuild their markup wholesale, which drops focus to `<body>`. Both are wrappers
that run their `…Now` twin inside `fkKeep`, which remembers the focused control's `data-fk` key and
focuses its rebuilt twin — looked up again after the rebuild, because `renderSpacingPanel` replaces
`#kerningBody` itself. Undo from a focused Kerning control comes through the outer one. Keys in use:
`kp:<first|second>` (chips), `kp:fine`, `kp:next`, `kp:more`, `kp:add`, `kp:suggest`, `kpd:<row>` (a
row's delete button, so deleting by keyboard lands on the next row). `renderControls` keeps its own
copy of the same idea for the left column.

### QA Check grid (`#qaOverlay`)
`qaBuild()` counts flagged cells per tab into `qaResult.counts` (the tab badges) and `qaResult.total`
(the summary); `qaRenderGrid()` draws `qaRows()` × `qaColumns(qaTab)`. The grid is built in **two
passes**: every cell's `qaCellLayers`/`qaCellReasons` is computed into a matrix first, because
**"Only show problems"** (`qaOnlyProblems`, a per-device pref in `hebrewFontMaker_uiPrefs`) has to
know which rows and columns are clear before the first `<th>` is written. It keeps a letter row with
any flagged cell, then keeps a mark column flagged in any kept row — so a clean tab renders
`fontmaker.qa.filter_clear`, never an empty table, and a section header's `colspan` follows the
*visible* column count. The filter is **view-only**: it changes what the grid draws, never what QA
counts, so the tab badges and the summary stay whole-font at all times. Reasons are still computed
once per cell, exactly as before.

`setQaOnlyProblems(on)` redraws the grid without re-running `qaBuild()`; `qaSyncFilterUI` keeps the
checkbox and its readout in step. The checkbox lives in its own `.qa-filter` row **below** `#qaTabs`,
not inside it — `#qaTabs` is a `role="tablist"` whose `_tabKeydown` ring walks its children (Left/Right by the
strip's computed direction, so a mirrored Hebrew strip advances on ArrowLeft, as every other tool's tab strip).

**Nothing traced yet.** A tab whose rows have no outline (`qaRowsInked` false: a new project, or the Hebrew
tabs of a Samaritan-only or English-only font) renders `fontmaker.qa.none_traced` (`smr_none_traced` on the
Samaritan tab) instead of a grid whose every cell would read clear over an empty box; the no-marks note
(`no_marks` / `smr_none`) still comes first. The summary drops its ✓ / count sentence when `qaHasWork()` finds
no tab pairing a traced letter with a mark column, and the clip-box line while no Hebrew letter is traced
(`coreLetterStats().traced` is 0, so Export refuses and no box expands). The outline-health line stays:
`glyphOutlineScan()` covers every drawn glyph, English included. Once a letter is traced the clip-box line is
real even for a sparse font: every Hebrew letter ships (blank when untraced) with its seeded anchors, and
`fontInkBounds()` counts the marks placed on them.

**The Samaritan marks tab** (`smrmarks`) is listed only while the Samaritan letters are on and enabled by
the family switch — `qaHave()` is the one map behind the tab bar and `openQA`'s fallback (two hand-kept
copies had drifted). Its rows are `qaSmrRows()`: the 22 alphabet letters in `SAMARITAN_LETTERS` order,
untraced ones included like Hebrew rows, labelled by the short name under `lang="und-Samr"` in the
template font (the UI font has no Samaritan glyphs, and the short name has no glyphname key, so the label
skips `gName`). Its columns are one `smrmarks` column per mark in `smrShipList().marks` — exactly what
ships, placed at the column anchor `qaAnchorFor` resolves (pins first) with the global shape, never a
per-letter one (a family ships font-wide only: `markContoursFor` ignores `markShapes` for a family kind)
— then three `smrpair` cells per letter (start×middle, middle×end, start×end): every drawn mark of one
column against every drawn mark of the other, the cell's layers being the first clashing pair in registry
order or else the closest pair, each layer carrying its `cp` so `data-mark` and the jump follow the pair
the cell shows. An `smrmarks` cell keeps the letter-ink test (a mark drawn too low is a real hit; overhang
is not flagged, only intersection); an `smrpair` cell tests mark-vs-mark only, like a Hebrew `pair` cell.
Every cell of the tab shares one frame, `qaSmrFrame` — the Hebrew box lifted to the tallest mark or
letter of the tab, since an imported mark sits 600–1000 units above its anchor and nun rises; width needs
nothing, the 54×62 cell is height-limited and `meet` already shows the start/end overhang. `qaJump`
routes an `smrmarks`/`smrpair` cell to the letter's Place Marks step through `setSmrMark`. A Hebrew-only
project's sheet is unchanged (tab list, `qaResult.counts`, grid markup).

### Page chrome — the footer bar
The `<footer>` is deliberately a one-row bar, not the three-column block the other chrome pages use:
three folded `<details>` (FAQ, About, Related Hebrew Tools — an open one takes the full row,
prose-capped at 720px) with the credits at the end of the line. Same i18n keys and the same FAQ copy
as the head's FAQPage JSON-LD — restyle, don't re-column it.

### v2.0 extension points
- **Guided tour**: `TOUR_STEPS` array + `tourStart()`/`tourEnd()` — non-modal spotlight; steps have
  `target()` (+ optional `reveal()`) and skip gracefully when hidden; must never change project state.
- **Shortcuts sheet**: `shortcutGroups()` + `openShortcuts()`; global `?` handler (suppressed while
  typing / modal open / tour active).
- **Engine warm-up**: `ensurePyodide(opts)` — `opts.background: true` suppresses status toasts;
  phases via `_setPyoPhase` (`download`→`install`→`ready`, resets to `idle` on failure so retry
  works); `maybePrefetchEngine()` runs once at idle after the first traced letter and only downloads
  the engine's files into the browser's HTTP cache (each read to its end, the fontTools wheel named by
  the lock file; skipped for `navigator.connection.saveData`) — it never starts the engine: that start
  is seconds of main-thread work, so it happens only where `ensurePyodide()` is awaited (Export, an
  import), never under a teacher who is drawing; `_pyoWarming` keeps the toolbar badge up meanwhile.
- **Next-step hint**: `renderNextStepHint()` (called from `renderLetterGrid()`) — the "what's next?"
  line under the letter grid.

### Imported-font mark fidelity (`m.attachAnchor`, v5.14)
The app normalizes every mark to *attach-origin-at-(0,0)*: `markGlyphContours`/`markGlyphCurves`/
`markContoursFor` translate mark geometry into mark-local space and `buildFEA` emits `<anchor 0 0>`
for every markClass, so all positioning intelligence lives in per-letter base anchors. The origin
comes from **`markAttachOrigin(m)` — the single choke point and the only sanctioned reader of
`m.attachAnchor`**: a mark imported from a font (anchors option on) carries the source font's own
GPOS `MarkAnchor` there (1000-UPM y-up, same space as its imported contours) and lands exactly
where the original font put it; absent (traced / drawn / built-in marks, older projects) the bbox
convention applies byte-for-byte. Lifecycle: `importMarkGlyph` drops any stale `attachAnchor`
(re-set from the new font's GPOS by `applyFontImport`); `finalizeFromRaw` (the trace commit) and
`assignSvgContours` drop it too; the Edit-shape modal carries it through upload-mode applies and
drops it for editor-mode (pieces) applies; boldGen mutates contours in place and deliberately
leaves it fixed. It rides autosave/`.hfm`/recent-projects for free (deep clones, no whitelists).
The base side has the same guard. `applyImportedAnchors` gives a letter's imported anchors a `savedAnchors`
baseline, as `migrateProject` gives a reloaded project's. The placement step's carry-forward
(`maybeInheritAnchors`, which copies the last letter's anchors onto the next one opened) only touches letters
without a baseline, so it reaches seeded anchors and never replaces a font's own positions.
`hfm_read_anchors` (v2) walks only mark/abvm/blwm-feature lookups, assigns each app key to its
majority GPOS class (marks × Hebrew-letter bases; the old first-wins collapsed split classes), and
folds near-constant per-class deltas into `markAttach` so marks in losing classes (shin dots,
meteg, hataf classes) still land exactly; non-constant deltas become `notes[]` residuals. After a
GPOS-bearing import, `runImportFidelityCheck` shapes every imported-mark × covered-letter pair
against the ORIGINAL bytes with harfbuzzjs and reports measured max/mean (status line + a details
modal listing >3-unit combos). Fail-soft: no harfbuzz ⇒ the import stands and the status says the
check was unavailable. Word-edge-halign trop columns are a deliberate app convention, skipped (and
counted) rather than flagged. A hand-set `pc.anchor` is user truth and is never touched.

**Import fidelity v5.30 — composite-derived anchors, GPOS kerning, spacing, scale reset.** The
anchors read gained a v3 tail: letters the source font composes via ccmp instead of mark-attaching
(dagesh on 20+ letters in typical Hebrew fonts — both partner fonts cover only het/finals/ayin in
the dagesh mark lookup) get their missing base anchors **derived from the precomposed glyf
COMPOSITES** (`anchor = markAttach + (markComponent − baseComponent)`, table-driven over the
FB1D–FB4E decompositions; for letters with neither coverage nor composite, an ink-centred x with
y = `markAttach.y` — the mark's own convention, never the seeded mid-letter y). This is what stopped the imported dagesh floating ~350 units high on bet — the
seeded `center` default assumes bbox-convention marks and is the wrong convention once
`attachAnchor` is present. Read-data always beats derivation (fills only missing keys); the whole
tail is try/except best-effort. Same release: `hfm_read_kern` (same PY_BUILDER, same engine trip,
reusing `hfm_anchor_b64`) reads **GPOS pair kerning** — PairPos fmt 1 + 2, Extension-wrapped
included, logical order so RTL-safe — into `project.font.kerning` (class rows stay class rows;
placement-only and open-class-0 pairs are skipped + counted; gated on `opts.anchors` since it
needs the engine). The legacy `kern` table remains the LTR-only fallback and its Hebrew-pair skip
stays (order genuinely unknowable there). `applyFontImport` also now imports the source space
glyph's advance into `spacing.wordSpacing` (same clamp as the slider) and **resets
markScale/dagesh/holam/cholamScale (nikkud) and tropScale (trop) to 1 when that kind's marks were
imported** — imported shapes are true-size, and a stale multiplier tuned for the replaced marks
was the "vowels import bigger" report. The Spacing preview routes a typed letter+dagesh cell
through its `pc.src` form (same `_subst` as shin-dots/vav-holam) so the preview shows the source's
own combined glyph at its own advance, like the export.

**Fidelity autofix (v5.16) — three vehicles + re-verify.** The modal's Apply button
(`fidelityApplyFixes`, planned by the pure `fidelityFixPlan`) fixes EVERY expressible flagged
combo in one undoable `udDo` batch, then automatically re-measures against the stashed original
bytes and reopens the report with the after numbers. Vehicles, in order: **form** (the v5.14
`pc.anchor` write, unchanged); **anchor** — the letter's shared class anchor moves to the
component-wise median of the group's implied anchors (`real + attachOrigin − markNudge`, over ALL
measured rows of that letter × key, greens included) but only when that strictly reduces off-rows;
**pin** — a NEW per-(letter × mark) override `l.markAnchors = { cp: {x, y, key} }` reproducing the
measured truth exactly (this is what fixes the `classResidual` combos). Rules that keep it sound:
- `baseAnchorPosFor(l, key, cp)` (pin ?? `l.anchors[key]`) is the ONLY sanctioned reader of
  `markAnchors` — predict, stage preview, QA (`qaAnchorFor`), spacing preview, `fontInkBounds`,
  the `builtPerLetter` bake, `buildFEA` and `buildUfoAnchors` all flow through it. A pin applies
  only while its stored `key` matches the key being read (a halign/class change strands it
  harmlessly). **Never pin the center class** — the dagesh keeps one home (`l.anchors.center`),
  mirroring `precompAnchor` ignoring `pc.anchor` for center; off-consensus center rows stay
  flagged instead.
- Export: `buildFEA` splits each pinned mark into its own `@MC_<KEY>_<cp>` markClass with one
  `pos base` line per base glyph (pin ?? shared value — byte-identical FEA when no pins exist).
  The partition happens ONLY at the markClass/`emitBaseAnchors` emission points —
  `byClass`/`tropGroups` stay whole because GDEF, the `NIK_SLIDE_*` filtering sets and `ss01`
  read them by glyph name. A pinned center-halign trop gets its own mkmk lines too (else it
  would lose stacking); wide forms map pins through the same `wideX` transform as anchors; the
  shin/sin holam-slot synthetics drop `above`-key pins. `buildUfoAnchors` mirrors the split as
  `_<key>_<cp>` / `<key>_<cp>` named anchors.
- Lifecycle: manual class-anchor edits go through `moveClassAnchor` (same-key pins translate by
  the same delta — the autofix itself writes RAW, its values being absolutes from one shaping
  run); the anchor editor edits the PIN when the previewed mark is pinned (`writeActiveAnchor`,
  gold ✎ badge, Unpin / Clear-pins, all undoable); a fresh outline/anchor import deletes pins —
  gated on the import's OUTCOME, not its checkboxes (per letter, `opts.outlines || imp`), so an
  anchors-only import whose read yielded nothing changes nothing;
  `boldGenLetter` rescales them with the anchors; `maybeInheritAnchors` skips pinned letters;
  `migrateProject` sanitizes them (`sanitizeMarkAnchors`). Pins ride undo/autosave/`.hfm` for
  free (item deep-clones).
- **Values are ROUNDED at the source** (`implied()`, `row.fix`, and `fidelityMeasure`'s `dev` —
  one lattice, or a row lands flagged in (TOL, TOL+0.5] with every vehicle computing it as already
  on-target: flagged combos no fix is offered for). `markAttachOrigin`'s bbox
  fallback returns midpoints, so a mark with no imported `attachAnchor` yields a fractional origin
  (12 built-ins already do); a fractional value reaches `buildFEA` verbatim and **feaLib rejects the
  whole file** ("Expected a number"). Never write an un-rounded coordinate anywhere near an anchor.
- **A synthetic base must carry pins the way it carries anchors.** `qaSynth*` rows and the `buildFEA`
  precomp/wide branches build a fake letter with `Object.assign({}, base, …)`, which inherits
  `markAnchors` by reference — so a synth that RELOCATES a class anchor drops that key's pins
  (`dropKeyPins`, the שׁ/שׂ holam slot) and one that TRANSFORMS the ink maps them (`mapPinsX`, wide
  forms). Both helpers are shared by the export and its QA mirror precisely so the two can't drift.
- **`pc.anchor` carries provenance**: the autofix writes `{x, y, auto: true}`, every manual writer
  builds a fresh object (so a hand-edit promotes it to user truth), and a fresh outlines/anchors
  import discards the still-`auto` ones — otherwise one font's measured form positions survive into
  the next as untouchable "user truth". Same outcome gate as the pins (`opts.outlines || (imported
  && hadGpos)`), and it sits INSIDE `applyFontImport`'s `try`, so a failed import destroys nothing.
  `appliedTargets` is UNIONed, never replaced.
- The ss01 Sheva Na alternate has no codepoint, so the name-based pin partition would strand it in
  the shared class: `buildFEA` adds `SHEVA_NA_GLYPH` to the sheva's subclass whenever `05B0` is
  pinned, or one vowel would render in two places.
- Re-verify: `_fidelityLast.ctx` stashes `{bytes, upm, importedMarks, markCoverage}`
  RUNTIME-ONLY (never on `project` — autosave/`.hfm` would serialize the whole font);
  `fidelityRerun()` re-measures from it, and `_fidelityLast.appliedTargets` lets THIS session's
  own form fixes re-verify instead of being skipped as user-set. Apply-time user-truth guards
  (D3): a form whose `pc.anchor` is now set, a group whose class anchor moved since measurement
  (its pins step aside with it), or a pin the user moved/removed are skipped and counted in the
  `skipped_changed` line. The **Fidelity report** button in the Nikkud-step under-strip reopens
  the report while `_fidelityLast` exists. Undoing the `'fidelity fixes'` batch clears the report
  (it would otherwise show a green "0 still flagged" over a project that deviates again) by
  **stashing it on the undo entry**, so redo hands the same report — and its runtime-only `ctx`
  bytes — back; the stacks are runtime-only, so nothing reaches autosave.

The fidelity domain (`importedMarks`, `fidelityMeasure`) is nikkud and trop only: the Samaritan marks are
imported and verified by anchor reproduction through their own `hfm_read_anchors` pass (*Mark families*),
never by shaping against Hebrew letters.

### Mark families (`MARK_FAMILY`)
A second script's combining marks are a *mark family*, never rows in `MARK_CLASS` / `MARK_CPS` /
`NIKKUD_MARKS` — those tables drive the Hebrew export, QA and chart loops, and the PUA meteg forms stay
out of them for the same reason. One row today: `smrmarks`, the 21 Samaritan marks (`SAMARITAN_MARKS`:
cp, Unicode short name, column). One identifier does every job — kind = `project.font` store key = picker
tab id = panel/grid id prefix = `curKind` — which is what lets `catTabFor`'s `: kind` fall-through,
`updateTabs`' `project.font[curKind]`, `renderMarkPanel`'s `cat + 'Grid'` and `setMarkEnabled` serve the
family with no new fork. The one exception is the tabbed layout's CSS, which names each mark grid by id:
a grid left out of its *mark grids* rule (rows of 7) falls back to the letter grid's auto-fill columns,
and inside the shrink-to-fit `.mark-gridside` those resolve to a single column. `#smrmarksGrid` is in
that rule, and from a 1850px window it takes one row of all 21 tiles instead. The rule packs the row left; a mark
grid reads right to left in either UI, so on a Hebrew page its `[dir="rtl"]` twin sets `justify-content: safe left`:
a row wider than its panel (a phone) then overflows to the left, the side a right-to-left panel scrolls to.
Every nikkud/trop two-way ternary takes one prefix guard on the table and keeps its Hebrew tail
(`catOfCp` — whose default for an unknown cp is `'nikkud'` — `markName`, `markClassOf`,
`markClassFor`, `pinKeyFor`, `whoHasCp`, `alphabetOwnerOf`, `defaultPieces`, `markTilePreviewSVG`,
`dropKindPins`, `markCatScale`); `MARK_STORE_KINDS` is the one list the outline scan, the autosave
stripper, the cloud packer and the loader walk. A family's marks are font-wide only: the export's
per-letter bake is nikkud-only, so `markContoursFor` ignores a letter's `markShapes` for a family kind,
the placement sidebar's *Edit shape* opens the editor with `{ global: true }`, and the modal's scope note
says so (`markedit_scope_family`). The store is sanitized on load like the accent store's
(closed key domain, `cls` forced, `designMode` closed, `attachAnchor` integral or absent).

- **Columns, not classes.** Every Samaritan mark is `above`; what differs is the column it reads on its
  letter — `smrAboveR` (start, the letter's right edge), `smrAbove` (middle), `smrAboveL` (end) — the way
  the one shipped face that draws the block (Hebrew Square Samaritan) groups them in three mark-to-base
  lookups. Physical L/R like the trop columns, never `center` (`markPinFor` refuses that key). Only the 22
  alphabet letters carry them (`smrMarkBase`); `smrAnchorSeed` seeds them at the nikkud `above` height with
  the sides `SMR_SIDE_FRAC` (0.39) of the ink width out from the middle, rounded at the source, and
  `ensureSmrAnchors` back-fills an older save; `seedAnchors` / `seedAnchorsIfNeeded` carry them,
  `qaAnchors` reports them, `maybeInheritAnchors` carries placement within a family only, and the keys sit
  in `ANCHOR_KEY_SET`, `ANCHOR_LABEL`, `ANCHOR_COL`.
- **The placement step** is the Hebrew one re-routed: `gotoAnchors` sends a Samaritan letter to
  `anchorCat = 'smrmarks'` whatever it was asked for (so the step tab, both *Next* buttons and QA land
  there), `_anchorCtx` shows `SMR_ANCHOR_KEYS`, `activeVowelCp` reads `activeSmrMark[column]`, and the gate
  everywhere is `smrMarkBase(l) && smrMarksOn()` (`_setWorkMode`, `updateTabs`, `updateStepTicks`, the two
  *Next* buttons, `_placementCycleCps`). `#tabAnchors` is reused, relabelled *Place Marks*;
  `renderSmrAnchorLeft` shares the Hebrew sidebar's lifted pieces (`_placementNavRowHTML`,
  `_anchorXYBlockHTML`, `_anchorPinsSectionHTML`) and carries none of the stacking check, meteg or composed
  forms; the family's size is `smrMarkScale` (its own slider, on the `tropTune` undo scope), never the
  nikkud slider.
- **Export, one gate.** `smrShipList()` — the family on and a mark drawn, the tab on and a letter inked —
  is the only predicate `buildFontSpec`'s marks pass, `buildFEA` (through `builtSmr`, the
  `builtMetegForms` precedent), GDEF, `buildUfoAnchors(spec)` and `fontInkBounds` may use, so no line ever
  names an unshipped glyph. The FEA declares `languagesystem samr dflt;`, one `@MC_SMR_<col>` markClass per
  column (a pinned mark in `@MC_SMR_<col>_<cp>`, the `nikSolo` partition), and `emitSmrBaseAnchors`
  appends one `pos base` line per column on each shipped letter after every Hebrew line, so the Hebrew
  prefix of the feature stays byte-identical; no mkmk (one mark per column, columns independent). Family on
  with nothing drawn emits the same file as family off — the byte-bar rule.
- **Import, its own pass.** `hfm_read_anchors(ttf_b64, class_map_json, base_range_json)` takes the base
  domain as a parameter (default the 27 Hebrew letters); the Samaritan read passes
  `smrAnchorClassMapForImport()` and `[0x0800, 0x0815]`, because the shipped face lists the Hebrew vowels
  inside the Samaritan classes and one merged map would hand those classes to the Samaritan keys. The 21
  shapes import like the nikkud (`importMarkGlyph('smrmarks', …)`, `smrSource: 'import'`, the family on at
  true size, the font's own attach points), and each letter takes fresh columns with the font's own points
  on top (`applyImportedAnchors`'s `smrmarks` kind; its temp letter carries `.smr`). The marks ride the
  Samaritan letters' choice (`opts.marksSamaritan` overrides), and "Keep my Samaritan" spares a mark the
  teacher drew.
- **Previews** stack a Samaritan mark on its column in the Spacing sample (a Hebrew vowel typed after a
  Samaritan letter stacks nothing — the export attaches none), the kern suggester skips the marks, and the
  specimen adds an *alaf + each shipped mark* page shaped by the exported font itself. The QA Check sheet
  has a tab of its own (*QA Check grid* above). **Out of scope:** Hebrew nikkud on Samaritan letters, and a
  second Samaritan face to cross-check the column fractions.

### Lazy CDNs + CSP
pyodide v0.26.2 (+ fontTools), harfbuzzjs 0.4.6 (`hb.wasm` fetch — needs `'wasm-unsafe-eval'` +
`connect-src cdn.jsdelivr.net`), opentype.js 1.3.4 — all jsDelivr, all lazy-loaded via
`loadScript()`. The page CSP already allowlists these; any **new** external resource requires
editing this page's CSP meta (Security rule 3 above).
Two engine contracts the exporters depend on: the UFO export writes its `.glif` files by hand
(a small `AbstractPointPen` + `contents.plist` via plistlib) — never import `fontTools.ufoLib` /
`glifLib` in `PY_BUILDER`, they import pyfilesystem2 (`fs`), which Pyodide's fonttools package does
not carry, and the whole export fails (and `buildUfoFontInfo` writes `openTypeOS2Type: []` explicitly —
absent, ufo2ft/fontmake default to fsType 4 while the TTF export writes 0 — and `hfm_build` writes
ufo2ft's own underline, strikeout and sub/superscript fallbacks, since FontBuilder's zeros made
LibreOffice draw underline and strikethrough invisibly; the TTF and a compiled UFO agree field for
field); and every jsPDF `addImage()` call passes `undefined, 'FAST'`
as its last two arguments — without a compression argument jsPDF stores the page raster raw
(~11 MB per page).

### Starting Fonts / partner onboarding (`?start=<id>` + `starting-fonts/`)
The OpenSiddur collaboration: a partner page links `Hebrew_Font_Maker.html?start=<id>`, which
opens that font pre-imported into a fresh, **license-locked** project via a 3-step partner wizard.

- **Data layer**: `starting-fonts/manifest.json` (`{"schema":1,"fonts":[...]}`) + one
  `starting-fonts/<id>/{<Font>.ttf, LICENSE.txt}` per font — vendored same-origin copies, never
  hotlinked. Every manifest value is **detected from the font's own name table / upstream license
  text, never invented** (`nameTableFamily` records a stale embedded family name). Intake goes
  through the **`/addOSFont` skill** → `scripts/add_os_font.py`, whose license gate asks ONE
  question: does the license permit MODIFICATION? Every derivative-permitting license is
  allowlisted (12 ids: OFL-1.1, GPL-with-font-exception,
  bare GPL-2.0/3.0, Apache-2.0, CC0-1.0, UFL-1.0, LPPL-1.3c, CC-BY-SA-3.0/4.0, CC-BY-3.0/4.0),
  each carrying its own obligations (copyleft, rename, state-changes, attribution) into the
  export; a font with no license, or one forbidding derivatives (CC *-ND, all-rights-reserved),
  refuses with printed evidence — a hard STOP, maintainer decides. The maintainer's intake-review
  record lives in `starting-fonts/not-staged.json` (refusals + partner-page/distribution license
  discrepancies; the script only reads it, rendering it into LINKS.md). **Reserved Font Names are
  recorded for EVERY license** (Taamey Frank CLM
  declares one under GPL) and any declared RFN forces a rename at runtime. Never hand-edit the
  manifest, a staged LICENSE.txt, or `starting-fonts/LINKS.md` (the copy-paste sheet of live
  `?start=` links — regenerated from the manifest on every intake / `--regen-links`).
  **Discovery is automated, intake is not:** `scripts/audit-os-fonts.mjs` (run weekly by
  `.github/workflows/os-fonts-audit.yml`, see `ops.md`) fetches the partner's published list
  (`opensiddur.org/wp-content/plugins/custom-fonts-display/data/fonts.json`, falling back to the copy
  committed in the partner's site repo — see `ops.md`), matches it against the manifest — the
  partner's `slug` is our `id` for nearly every font, then `family` against the archive/file stem,
  then name via the listing names recorded in `not-staged.json` — and writes `starting-fonts/AUDIT.md` (new fonts to intake, staged fonts that
  dropped off the list, license-label disagreements, version/date/license changes since the last
  run; the list carries no download URL, so a new font's archive is printed as the *probable*
  `wp-content/uploads/fonts/<family>/<family>.zip`, a hint the intake verifies) plus
  `starting-fonts/opensiddur-fonts.json` (the normalized list as last seen). Both are generated —
  never hand-edit them. The list is the discovery source only; the license text shipped inside the
  archive stays the truth. **Automated intake:** `scripts/stage_os_fonts.py` takes the audit's
  unmatched entries (`--emit-new`), downloads each archive from the partner's site repository
  (`fonts/<family>/<family>.zip`, recorded as the upstream), picks the Regular/Book/Medium/Light face
  and the plain-text LICENSE/OFL/COPYING/README member (preferring the one that states the GPL font
  exception when that is the verdict), runs `add_os_font.py --dry-run`, and stages only when the
  verdict's license family agrees with the partner's label — a coarse "GPL 3.0" label against shipped
  GPL+FE text is staged and appended to `not-staged.json` `discrepancies` (the one machine write to
  that file). `--name` is the catalogue name minus a trailing parenthetical, `--id` the catalogue slug
  when it is a valid manifest id, `--designer` the catalogue typographer (the name-table designer is
  noted in the report). HTML-only licenses, missing license text, label-vs-text disagreements and
  refusals are left for `/addOSFont`. The workflow ships staged fonts as one PR per run
  (`STAGE_TARGET: pr`; `main` pushes directly). The picker's "{count} editable fonts" line is computed
  from the manifest, so no string changes with a count.
- **Runtime**: `init()` strips `?start` immediately (keeps `?lang`); `osStartBoot` runs inside
  `maybeRestoreAutosave` after `_launchDecided` (deferral batons untouched; the no-param tail is
  the verbatim extraction `_bootLaunchPrompt`). A restorable snapshot is arbitrated first ("Open
  {font} / Continue") — `autosaveDiscard()` only on the explicit choice; every fetch/parse failure
  lands in Retry / Continue-to-Font-Maker. `wizardOpen('osfont')` swaps in the static
  `wizStepOs1–3` sections (gate/new untouched; chrome swaps via the data-i18n attribute-swap);
  `wizardOsFinish` seeds `project.osFont` + `font.license='os-passthrough'` then calls the
  existing `applyFontImport` headlessly (`{outlines,marks,anchors:true}`).
- **In-app picker** (`#osPickOverlay`, wizard-header button `#wizStartFromFont` in gate and toolbar-New
  modes): `osPickOpen(origin)` closes the wizard, loads the manifest through the shared
  `osFetchManifest()` (memoized, `ivritSafeParse`, entries filtered to a `/^[a-z0-9-]+$/` id + file +
  displayName + licenseId) and renders one `<button>` card per font (`osPickRender`, createElement +
  textContent only; search / nikkud + trope filters / custom preview text are per-open state with no
  storage key). Each card's real TTF is registered as a throwaway `FontFace` (`HFMOsPick-<id>`) only when
  it scrolls into view (`osPickObserve` IntersectionObserver, `osPickLoadFace`); faces are memoized in
  `_osPickFaces` for the session. The preview field also hosts the shared **test-phrases** chips and
  **hebrew-keyboard** blocks (this page already carried both, so the carrier lists are unchanged):
  `osPickWire` mounts them once against one `getInput`/`onChange` pair (`osPickSetText` — a scripted
  value change fires no `input` event), passes `getFontFlags: () => null` (the grid previews every manifest font,
  not one), and calls `setOpen(false)` so the toggle label renders through I18n at mount. The default
  sample `OS_PICK_SAMPLE` is unpointed; the chips reach nikkud, trop and the rest. The card grid is the
  modal's only flex-grower (every sibling is `flex: 0 0 auto`, the grid keeps a `min-block-size` floor),
  so an open keyboard cannot squeeze it away. The OpenSiddur mark sits beside the intro line
  (`#osPickLogo`, vendored unmodified at `partners/opensiddur/logo.svg` — same-origin like the fonts,
  never hotlinked; the page's `img-src` names no host but its own and the analytics ones). It is decorative (`alt=""`,
  `aria-hidden`) because the intro's own link already points at the partner page, and `osPickRender`
  shows it only while EVERY manifest entry carries `partner: "opensiddur"`, so a second partner's fonts
  hide it rather than mis-credit. It is **CC BY-SA 4.0**, so the required
  attribution (title · author · source · license) sits under the grid as `#osPickLogoCredit` — pinned
  English like the footer credits, `dir="ltr"`, and hidden by the same gate, since a hidden mark has
  nothing to attribute. **Never ship the mark without that line.** ShareAlike binds adaptations, not
  display: the file is shown unmodified, so nothing here is a derivative. Full record:
  `partners/opensiddur/NOTICE.md`. Nothing under `partners/` is precached. `osPickChoose(id)` joins the deep-link path at `osLoadStartCtx(entry)` →
  `_osStartCtx` → `wizardOpen('osfont')`, recording `_osStartOrigin` (`'link' | 'gate' | 'new'`): the
  partner wizard's Cancel returns to that origin wizard and step 1 shows `#wizOsChangeFont` (hidden for
  `'link'`) → `osPickReopen()`. `aCloseModal` hands the focus trap back to the picker the way it does for
  the wizard; `udShortcutBlocked()` includes `osPickOverlay`; `applyI18n` re-renders the cards. A manifest
  that cannot load raises an `askModal` (Retry / "← Back") whose Escape answers "← Back": the gate wizard
  cannot be dismissed, so a dismissed failure must never leave the page without it. Every return to the
  wizard (the picker's close, that "← Back") goes through `osPickBackToWizard()`, which lands on
  `#wizStartFromFont` and keeps the wizard's own opener, so its Cancel still returns to toolbar New.
- **Lock invariants** (`project.osFont` presence = partner-locked; belt-and-braces): `licenseText()`
  dispatches to `osPassthroughText()` **before** reading `font.license`; `buildFontSpec` AND
  `buildUfoFontInfo` carry independent partner branches (combined copyright, "designer; modified
  by contributor", nameID 10 description, upstream license name/URL); `syncMetaToForm`/
  `syncOsFontLock` disable the license select (hidden `os-passthrough` option) + make
  `#reservedName` (upstream RFNs) read-only, and fully re-enable for normal projects;
  `onMetaChange` never reads those two fields from the DOM when locked; `migrateProject`
  re-asserts the lock from `data.osFont` and heals an orphaned `'os-passthrough'` back to `'ofl'`;
  `saveProjectAs` keeps upstream RFNs on partner copies; `exportFont` opens with a **blocking**
  RFN-collision guard (no export-anyway) → `exportJumpToFontDetails()`. The IvritSuite line on
  partner exports is **informational only** — never phrased as required (OFL/GPL forbid added
  restrictions); the required-line wording stays for born-in-tool fonts only.
- **sw.js**: `/starting-fonts/manifest.json` is **network-first** (mirrors `/locales/`) so an
  intake is visible without a VERSION bump; font binaries ride the cache-first catch-all; nothing
  under `starting-fonts/` is ever precached. **Adding a font = no sw bump.** (Changing this
  runtime's code still bumps VERSION like any precached-page edit.)

---

