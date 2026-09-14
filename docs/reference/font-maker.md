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
new bare keys), `hebrewFontMaker_tourDone`, `hebrewFontMaker_inputMode`, `hebrewFontMaker_recentProjects` (read through
`getRecentProjects()`, which keeps only `{name: string, data: object}` members of an array — any other
stored shape reads as empty and is rewritten on the next save),
`hebrewFontMaker_mobileWarnDismissed`, `hebrewFontMaker_autosave` (image-stripped fallback). Primary
autosave is **IndexedDB** db `hebrewFontMaker`, store `autosave` (gzip blob, id `'current'`). Shared
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
- **Pack / unpack at the boundary, never inside the live project**: `fmCloudPack(project)` deep-clones and,
  at every raster slot (`fmRasterSlots`: letters' and marks' `source.dataUrl`, `combinedSheets[].dataUrl`,
  `font[cat].combinedImage.dataUrl`), decodes the data URL by hand (`fmDataUrlToBlob` — the CSP has no
  `data:` in `connect-src`), keeps the ORIGINAL bytes and type (jpeg / png / webp; anything else is redrawn
  to PNG), hashes them (`fmHashBytes`, 16 hex of SHA-256) and writes the string `'cloud:<hash>.<ext>'` in the
  clone; drawn letters (`source.kind === 'draw'`) are stripped to `null` (`drawEnsureRaster` rebuilds them),
  SVG sheets and `template.customFonts[].dataB64` stay inline; a `cloudSources` manifest is added. The runtime
  `_cloudNames` map (data URL → object name) means an unchanged photo is never re-encoded or re-uploaded.
  `fmCloudUnpack(data, id)` downloads the referenced objects (4 at a time) and puts data URLs back BEFORE
  `applyProjectData`, so `imgCache` keys, `traceSig` and every synchronous reader see exactly what they see
  today. A photo that fails to download becomes `null` and is counted in a toast.
- **Saving**: Save Project ▾ → `fmCloudMenuRow()` (a sign-in row when signed out); `fmCloudSave()` shows one
  dialog the first time, then `fmCloudWrite(mode)`: probe the row (`IvritProjects.get`), compare its
  `updated_at` with `cloudRev` (a mismatch raises the conflict dialog — Overwrite / Keep both via the Save-as
  recipe / Not now, which pauses autosave), pack, gzip (rewrapped as `application/gzip`), `IvritProjects.save`
  with progress phases through `status()` inside `ipArm(0)`, then `cloudId`/`cloudRev` are set and a local
  `autosaveNow()` records the revision (`cloudRev` + `cloudClean` on the IndexedDB record). `markDirty()` also
  sets `_cloudDirty` and arms a 10 s `fmCloudAutosave()` (skipped while signed out, offline, busy or paused;
  an `online` event re-arms). The toolbar `#cloudPip` (Saved / Saving… / Unsaved / Couldn't save — click to
  retry) is shown only while the project has a `cloudId` and someone is signed in; `beforeunload` also warns
  while `_cloudDirty || _cloudBusy`.
- **Opening**: Load Project ▾ gets an "In your account" section (`fmCloudLoadSection` + the asynchronous
  `fmCloudFillLoadMenu`, which writes only into the still-open menu); its rows use their own classes
  (`.load-menu-cdel`, `.load-menu-cdl`) so `reopenLoadMenu`'s 🗑 index keeps counting Recent rows.
  `fmCloudOpen(id)` is local-first (the IndexedDB snapshot with the same `cloudRev` and `cloudClean` needs
  no download), else download → unpack → `applyProjectData`. `fmCloudDelete(id)` closes the menu, confirms,
  removes row + objects, reopens the menu. The Exported ✓ dialog gains `fmCloudKeepExport(dlFile)` (the
  snapshotted file, ≤ 5 MB) and a row with an export shows ⬇ (`fmCloudDownloadExport`).
- **Guards**: `udShortcutBlocked()` and the global keydown return early while the account screen
  (`.ivsav-overlay`) is open, so its Escape does not close the editor's own modal. Strings are
  `fontmaker.cloud.*` through `_cT(key, fallback, params)` (the `_pT` shape); `fmMb` formats sizes.
- **The account page** (`account.html`) never opens a project here: its download-everything zip rebuilds a
  `.hebrewfont` from the cloud copy through `IvritProjects.projectFile(id)` — the module's own generic walk over
  the `cloud:` strings the packed manifest names, photos put back as data URLs, `cloudSources` dropped — so the
  file is what Save Project writes. `fmCloudUnpack` stays the path for opening in this page.
- **Test**: `node scripts/smoke-fontmaker.mjs --sdk <supabase.js>` (port 8082) replays the whole flow
  against a fake cloud that also fakes Storage.

### "Load Project ▾" menu + the Recent list

`toggleLoadMenu(ev)` only toggles; `openLoadMenu(anchor)` builds and positions the popup and is also
what puts it back after a confirm, so the anchor it was hung off lives in `_loadMenuAnchor`. Two
buttons call it: the toolbar's "Load Project ▾" and the wizard's "Open a project ▾".

Each Recent row is a `.load-menu-row` flex wrapper holding the load button **and** a `.load-menu-del`
🗑 as siblings — a button cannot nest inside a button, and keeping them apart also keeps the trash
out of the load hit area. `removeRecentProjectUI(idx)` closes the menu **before** raising its
`askModal`: `.load-menu` is `z-index: 300` and `#askOverlay` only `201`, so a menu left open paints
over its own confirm. Either answer calls `reopenLoadMenu(idx)`, which re-anchors the menu (skipping
it when the anchor is gone or off-screen) and focuses the neighbouring 🗑, so clearing several stale
rows is Enter, Enter, Enter.

`removeRecentProject(name, savedAt)` filters by **identity, not index** — the confirm is async, and a
`saveToBrowser()` behind it unshifts a row and slides every index down one. It writes back the list
`getRecentProjects()` already cleaned, so a malformed stored entry is dropped by the same write.
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
  never add your own trap.
- **Confirmations**: `askModal(title, bodyHtml, buttons)` with `[{label, cls:'ghost'?, onClick}]`.
  `#askOverlay` sits one z-index layer above the other `.overlay`s, so a confirmation raised over the
  wizard, help, QA, My Fonts or mobile-warn overlay is the one under the pointer.
  It auto-closes before running `onClick`; to make elements inside the body interactive (like the
  export-warning letter chips), wire listeners on `#askBody` **after** the `askModal(...)` call.
- **Toasts**: `status(msg, sticky)` — auto-clears in 4s unless `sticky`.
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

### Undo / dirty / autosave contract — the big one
**Never mutate `project` directly.** Route every mutation through `udDo(scopes, label, fn)`
(scopes: `{t:'item',kind,cp}`, `'spacing'`, `'kerning'`, `'kernClasses'`, `'metrics'`, `'guides'`,
`{t:'precomp',target}`). Continuous inputs: slider drags use `udBurstBegin`/`udBurstCommit` (one
undo entry per drag); arrow-key nudges use `udNudgeTick`/`udNudgeCommit`. `udPush` calls
`markDirty()` automatically (debounced IndexedDB autosave), so going through `udDo`/burst/nudge
covers undo + dirty + autosave in one. Pure-UI state (panel collapse, toggles) calls `markDirty()`
directly with no undo entry. Read-only features (tour, QA grid, shortcuts sheet) must touch none of
this — zero project-state changes.

An **image assignment needs `withSource: true`** on its item scope (and `withDraw: true` when it can
replace a drawing) — `ITEM_SKIP` holds `source`/`savedAnchors`/`draw` out of snapshots by default, so
without the opt-in `udRestore` keeps the *new* image and rolls back only the geometry around it,
which is a visible half-undo. The cost is that the entry retains a second copy of that item's
`dataUrl` for as long as it sits on the stack; `draw letter`, `auto-detect letters` and
`upload image` all pay it deliberately, full combined sheets never do.

### Photo upload — one letter or a whole pick
`prepImageForItem(it, file)` does all the async work (file read, decode, `autoThresholdFor`,
`defaultFitTransform`) and hands back the *mutation* as a closure, so a corrupt file changes nothing
and the caller chooses the wrapper. `uploadForCurrent` wraps one closure for the current item (letters
and marks alike — the `markDrop` zone calls it too); `uploadForLetters` wraps a whole pick in ONE
`udDo`, the `adApply` shape, so a mis-picked batch is a single Ctrl+Z.

Distribution: a file whose **name** names a letter (`alef`, `Alef.jpg`, `01-alef`, `05D0`, `uni05D0`,
`א`) claims that letter wherever it sits — `_fileNameToCp` reuses `buildSvgNameMap()` +
`matchSvgEntryToCp`, the same id rules the SVG auto-split uses. Everything else fills the current
letter first, then the following letters in `LETTER_ORDER` that are still empty (no outline, no
image, no strokes), skipping `cat:'punct'` (digits and punctuation, which ship default outlines).
Files with nowhere to go and files that fail to decode are counted in the toast, never dropped
silently. The `multiple` attribute and the hint line under the drop zone are raster-mode only —
SVG mode routes through `uploadSvgForCurrent`, which replaces the trace rather than the photo, and
stays one-at-a-time. `wireDrop(id, cb, multi)`'s third argument opts a zone into whole-`FileList`
drops; every other zone keeps the first-file contract.

### Workspace model + render pipeline
State: `curKind` (`letter|nikkud|trop`), `curCp`, `workMode` (`align|trace|anchors|nodes`).
Guarded vs guard-bypass pairs: `selectItem` → `_selectItem`, `setWorkMode` → `_setWorkMode` (the
guards protect unsaved anchor moves via `guardPlacement`). Read-only jump-to-letter flows (QA grid,
export-warning chips) legitimately use the `_` versions plus `gotoAnchors('nikkud'|'trop')`.
After mutating state, call `renderStage(); renderControls();` (+ `renderGrids()` if tile status or
selection changed) — `afterUndo` shows the canonical full refresh.

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
not inside it — `#qaTabs` is a `role="tablist"` whose `_tabKeydown` ring walks its children.

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
  works); `maybePrefetchEngine()` prefetches once at idle after the first traced letter, skipped for
  `navigator.connection.saveData`.
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

### Lazy CDNs + CSP
pyodide v0.26.2 (+ fontTools), harfbuzzjs 0.4.6 (`hb.wasm` fetch — needs `'wasm-unsafe-eval'` +
`connect-src cdn.jsdelivr.net`), opentype.js 1.3.4 — all jsDelivr, all lazy-loaded via
`loadScript()`. The page CSP already allowlists these; any **new** external resource requires
editing this page's CSP meta (Security rule 3 above).
Two engine contracts the exporters depend on: the UFO export writes its `.glif` files by hand
(a small `AbstractPointPen` + `contents.plist` via plistlib) — never import `fontTools.ufoLib` /
`glifLib` in `PY_BUILDER`, they import pyfilesystem2 (`fs`), which Pyodide's fonttools package does
not carry, and the whole export fails (and `buildUfoFontInfo` writes `openTypeOS2Type: []` explicitly —
absent, ufo2ft/fontmake default to fsType 4 while the TTF export writes 0); and every jsPDF `addImage()` call passes `undefined, 'FAST'`
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
  never hotlinked; the page's CSP allows `img-src 'self'` only). It is decorative (`alt=""`,
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
  the wizard; `udShortcutBlocked()` includes `osPickOverlay`; `applyI18n` re-renders the cards.
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

