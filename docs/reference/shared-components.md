# Shared components — reference

> Binding rules live in `CLAUDE.md`; this file is how each shared block and suite-wide UX convention works, plus where each is implemented. Verify carrier lists by grep/sha before relying on them.

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

Present (verbatim — sha-verify when you touch it) in **9 files**: `index.html`, `Hebrew_Font_Maker.html`, the six
font-selector tools (generator, flash cards, dashboard, dictionary, torah trainer, trope tutor), and
`resources.html` (a store *consumer* — its font gallery reads `listUserFonts` but has no picker/uploader).

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
`saveUserFont`s it). The block contains ONLY that function (identical across all 7 carriers); the thin **pick handler lives BELOW the end marker and is per-page**: the five tool pickers
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

## On-Screen Hebrew Keyboard — shared component (`resources.html`)

A collapsible click-to-type Hebrew keyboard (Letters / Nikkud / Trop tabs) that inserts characters
into a host text input at the caret — for users with no Hebrew layout installed (and for nikkud/trop,
which almost nobody can type). First shipped in the `resources.html` font-preview modal; built as a
shared component so any tool can adopt it.

### The two shared blocks (byte-identical, like the `.ivrit` engine)
- `/* ═══ shared: hebrew-keyboard CSS ═══ … ═══ end shared: hebrew-keyboard CSS ═══ */` — all `.hk-*`
  rules — and `/* ═══ shared: hebrew-keyboard ═══ … ═══ end shared: hebrew-keyboard ═══ */` — data
  tables + `mountHebrewKeyboard(cfg)`. **Copy both verbatim; never rewrite.** Current carriers:
  `resources.html` (font-preview modal), `hebrew_dictionary.html` (search box),
  `Hebrew_Font_Maker.html` (the Spacing tab's sample-text field), and
  `classroom_dashboard.html` (the student-picker roster textarea — the field whose
  own placeholder is already Hebrew names). When a page adopts
  the keyboard, re-true the carrier list in the marker comments of **all** carriers (same rule as
  the app-toast block) — and re-verify byte-identity by sha, don't eyeball it.
  **⚑ Use a multi-line anchor when you re-true it.** `resources.html` and `Hebrew_Font_Maker.html`
  each carry the **test-phrases** block too, whose header repeats the same
  "…byte-identical across carriers; carriers: …), then mount per page:" sentence with a *different*
  carrier set — so a one-line search-and-replace silently edits the wrong block's list (measured:
  2 matches per file). Anchor on the carrier line **plus** its predecessor, and sha-verify
  both blocks afterwards, not just the one you meant to touch.
- Everything is `HK_`/`hk`-prefixed and self-contained (own `hkSetPressed`, own `HK_GLYPH_CARRIER`),
  so the block drops safely into pages that already define `GLYPH_CARRIER`, `setPressed`, `esc`, etc.
  Per-page wiring lives **below** the end marker (the My-Fonts-uploader convention).

### Adding it to another tool (the whole recipe)
1. Copy the CSS block into the page `<style>` and the JS block into the inline script.
2. Add the two host elements next to the target input:
   `<button type="button" class="hk-toggle" id="…Toggle" aria-expanded="false" aria-controls="…Panel">⌨ Show Hebrew Keyboard</button>`
   + `<div class="hk-panel" id="…Panel" hidden></div>`. The button carries **no `data-i18n`** — its
   label is state-dependent (Show/Hide), JS owns it; the English text is only the pre-`I18n.ready`
   fallback (`applyStaticI18n` would stomp the expanded-state label on language switch).
3. From inside `DOMContentLoaded`, mount and keep the controller:
   ```js
   _hk = mountHebrewKeyboard({
     container: panelEl, toggleBtn: buttonEl,
     getInput: () => inputEl,          // target <input>/<textarea>
     onChange: reRenderPreview,        // REQUIRED: setRangeText fires NO 'input' event — the host
                                       // re-renders through this callback, never via input listeners
     getFontFlags: () => null          // or () => ({nikkud, trop, name}) to enable the coverage hint
   });
   ```
4. **If the host rebuilds its own markup, re-mount — don't mount once.** `resources.html` and the
   dictionary hold static toggle/panel/input nodes, so a single `DOMContentLoaded` mount lasts the
   page's life. The Font Maker's Spacing panel does not: `renderSpacingPanel()` replaces
   `#spacingBody.innerHTML` (and `renderGrids()` calls it on nearly every state change), discarding
   all three nodes and stranding the controller. There, read the state **before** the rebuild and
   re-mount at the tail of the render:
   ```js
   function renderSpacingPanel() {
     const kbd = hkSampleState();   // {open, tab} — read BEFORE innerHTML discards the old nodes
     body.innerHTML = '… hk-toggle button + empty hk-panel …';
     mountSampleKeyboard(kbd);      // mount, then setOpen(kbd.open) + re-click the saved tab
   }
   ```
   Mounting is cheap (the panel body only builds while open). Such a page needs **no**
   `_hk.applyI18n()` hook: `setOpen()` re-runs the toggle label through I18n, so
   `applyI18n()` → `renderGrids()` → `renderSpacingPanel()` → re-mount already re-localizes.
   Where the field feeds an undo-tracked model, `onChange` must also route through the field's own
   setter and **close the burst** (`setSpacingSample(v); udBurstCommit();`) — an open burst blocks
   Ctrl+Z, and the input's `change` event never fires for a programmatic `setRangeText` edit.
5. Call `_hk.applyI18n()` from the page's `applyI18n()` (pure re-render, read-only — safe; skip it
   on a re-mounting host per step 4), and `_hk.refresh()` whenever what `getFontFlags()` reports may
   have changed.
6. The keyboard needs **no CSP change** (no external resources) and **no new CSV rows** — all strings
   are `shared.kbd.*` (~99 rows, already translated). The page must load a Hebrew font named
   `'Frank Ruhl Libre'` (every tool already does) — key glyphs render in it, deliberately NOT in any
   user-selected/previewed font, so keys stay legible even when the previewed font has gaps.
7. Finish per the Definition of done: the page is precached → **bump `sw.js` VERSION**; run
   `check-inline-js.mjs` + `check-i18n.js`; verify headless light+dark / desktop+~800px / EN+HE.
   (Adopting it into the Font Maker is a shipped feature → also bump `FONT_MAKER_VERSION` + add the
   changelog entry, in both `HELP_CONTENT.about` and the `fontmaker.changelog.*` CSV/`CUR_KEY` pair.)

### Behavior contract (don't regress these when touching the block)
- **Focus/caret:** the panel's delegated `pointerdown` calls `preventDefault()` so clicking keys never
  steals focus or collapses the caret (the standard on-screen-keyboard trick); keyboard activation
  (Tab + Enter) still works — every edit ends with `input.focus()`. Selection is read live with a
  remembered `{s,e}` fallback (tracked on `input/click/keyup/select/focus`), clamped to the value.
- **Backspace deletes ONE UTF-16 code unit** (all Hebrew letters/marks are BMP) — so it peels a single
  nikkud/trop mark off a pointed letter, which is the desired teaching behavior; a surrogate-pair
  guard keeps emoji whole. With a selection, it deletes the selection.
- **Layout toggle** (Letters tab only): alef-bet grid (`direction:rtl`, finals adjacent) vs Israeli
  SI-1452 rows (`ק ר א ט ו ן ם פ / ש ד ג כ ע י ח ל ך ף / ז ס ב ה נ מ צ ת ץ`). The qwerty rows are
  **pinned `direction:ltr` even in the Hebrew UI** — a physical layout is a coordinate system and
  must not mirror (same documented exception as the Font-Maker stage; don't "fix" it in an RTL sweep).
  The choice persists in `localStorage['hebrewBlender_kbdLayout']` (`'abc'` default | `'qwerty'`) —
  **site-wide and already registered at all five AllTools sites in `index.html`; adopters must NOT
  re-register it.** Panel open/closed state is deliberately NOT persisted (collapsed on page load,
  retained across modal reopens within the session).
- **Character-set rules:** vav-holam/shuruk insert **decomposed** two-char strings (`ו`+mark — the
  suite-wide "stored decomposed" rule; never FB-block precomposed codepoints). Trop covers the full
  Unicode range U+0591–U+05AF + meteg (32 keys, family-ordered, rare/poetic in a labeled row); there
  is deliberately **no sof-pasuk trop key** — Unicode unifies siluk with meteg (U+05BD), and the `׃`
  terminator lives in the Letters-tab punctuation row. Lone marks render on `HK_GLYPH_CARRIER = '◌'`
  (flip to `'א'` if a carrier font floats marks); glyph spans carry `lang="he" dir="rtl"`, and every
  key gets an `aria-label` with its localized name (glyph shapes mean nothing to a screen reader).
- **DOM-built rendering** (`createElement`/`textContent`, zero `innerHTML`), plain string concat
  (zero template literals — inline-script safety), colors via `var(--token, fallback)` only (dark
  mode = the token swap, no `body.dark` rules), logical CSS properties, keys ≥40px tall (34px utility
  row; ≥24px floor), and a **self-contained** reduced-motion tail inside the CSS block so the
  component stays correct on a page without the universal neutralizer.
- **Coverage hint:** when `getFontFlags()` reports `nikkud:false`/`trop:false`, the matching tab shows
  a `shared.kbd.hint_no_nikkud`/`_no_trop` note naming the font ({name} param); keys stay enabled.

---

## Test-phrase chips — shared component (font pages only)

A row of one-click Hebrew sample phrases that fill a font-preview field: **Shalom · Pangram ·
Alef-bet · Nikkud · Trop · Mixed**. Each phrase isolates **one** thing, so a font builder can tell
which part of a font a problem is in — letters vs. vowels vs. cantillation vs. mixed script —
instead of squinting at one sentence that mixes them. Modeled on the Open Siddur catalogue's
"Test your text in every font" popup.

### Rule: add these ONLY when asked
They belong on pages *about fonts*, where the field feeds a type specimen. A search box, a worksheet
title or a video URL has no specimen to show, and a row of chips there is noise — so this is not a
pattern new tools adopt by default, unlike the `.ivrit` engine or panel-collapse memory. Current
carriers: **`Hebrew_Font_Maker.html`** (the Spacing tab's sample-text field) and **`resources.html`**
(the font-download page's preview modal). Deliberately **not** on `hebrew_dictionary.html`, which
carries the on-screen keyboard on its search box but has nothing to specimen.

### The two shared blocks (byte-identical, like the keyboard)
`/* ═══ shared: test-phrases CSS ═══ … */` (the `.tp-*` rules) and
`/* ═══ shared: test-phrases ═══ … */` (`TP_PHRASES` + `mountTestPhrases`). **Copy both verbatim;
never rewrite.** When a page adopts them, re-true the carrier list in the marker comments of **all**
carriers and re-verify byte-identity by sha. Everything is `TP_`/`tp`-prefixed and the DOM is built
with `createElement`/`textContent`, so the block drops safely into any page; per-page wiring lives
**below** the end marker.

### Host contract
```js
tp = mountTestPhrases({ container, getInput, onChange });   // container: an empty <div class="tp-row">
```
- On a page that also carries the keyboard, **pass the same `getInput`/`onChange`** — the two
  components edit one field and re-render through one callback.
- `onChange` is **required**, for the same reason it is on the keyboard: a scripted `input.value =`
  fires **no `input` event**, so the host's own `oninput` never runs.
- A chip **replaces** the field's contents (a phrase is a whole specimen, not an insertion), parks
  the caret at the end, and refocuses the field.
- Call `tp.applyI18n()` from the page's `applyI18n()`; a host that rebuilds its own markup
  re-mounts instead (the row holds no state — see the keyboard's re-mount rule, step 4).
- Where the field feeds an undo-tracked model, `onChange` closes the burst the same way the keyboard
  does (`setSpacingSample(v); udBurstCommit();`), so one chip is one undoable step.

### Data + i18n rules
- **The phrases are Hebrew content and are never translated** (`i18n-ignore`) — only the chip labels
  and their `title` tips are, under `shared.phrases.*`. Those **13 rows are already in the CSV, so
  adopting the block adds none.**
- Vav-holam/shuruk stay **decomposed** inside the phrase strings, like everywhere else in the suite;
  never an FB-block precomposed codepoint.
- Adding or changing a phrase means adding its `shared.phrases.<key>` **and** `<key>_tip` rows (en
  **and** he, so Check B stays clean), and keeping the one-phrase-one-purpose split — don't fold
  trop into the nikkud sample or the tester stops localizing faults.

---

## Resizable panels (sidebars, drawers, rails) — shared component

Every fixed-width side panel is drag-resizable through one shared engine: grab the seam (or focus
it and use arrow keys) to scale the panel; double-click or Enter restores the default. Current
surfaces: the **Dictionary + Generator options sidebars**, the **settings drawers** on the
Dashboard / Torah Trainer / Trope Tutor, and the **Dashboard's two widget rails**. The Font
Maker's `.ws-split` workspace rails predate this block and deliberately stay on their own engine
(pointer-only) — don't fold them in as a drive-by.

### The two shared blocks (byte-identical, like the keyboard)
`/* ═══ shared: sidebar-resize ═══ … */` (JS — `mountSidebarResize(cfg)`) and
`/* ═══ shared: sidebar-resize CSS ═══ … */` (the `.sbr-*` rules). **Copy both verbatim; never
rewrite.** Carriers: `hebrew_dictionary.html`, `hebrew_blend_generator.html`,
`classroom_dashboard.html`, `torah_trainer.html`, `trope_tutor.html`. When a page adopts them,
re-true the carrier list in the marker comments of **all** carriers and re-verify byte-identity
by sha (same rule as the keyboard/app-toast blocks). Per-page wiring — the cfg object inside a
small `init…Resize()` mount call — lives **below** the end marker. The CSS block is
self-contained including its own reduced-motion tail, so a page whose reduced-motion block
enumerates selectors (the Trope Tutor) needs no extra entry.

### Host contract
```js
mountSidebarResize({
  handle,      // the .sbr-split element (canonical markup below)
  cssVar,      // '--tool-sidebar-w' — written on `scope` (default document.documentElement, so
               //   fixed cousins such as collapse tabs follow one write)
  scope,       // optional element that receives the var. A custom-property write restyles the
               //   writer's whole subtree every drag frame, so name the consumers' nearest common
               //   ancestor (the dashboard: .dashboard for its rails, the drawer for --drawer-w) and,
               //   when the consumer is that element itself, register the var `@property … inherits:
               //   false` so the frame restyles one element instead of the subtree. Leave the default
               //   when a fixed cousin outside any smaller ancestor reads the var (the dictionary's
               //   sidebar toggle) — measurements in loop-findings.
  storageKey,  // bare per-device key 'hebrew<Tool>_<thing>W' (registration rule below)
  anchor,      // 'start' | 'end' — the inline edge the PANEL is anchored to
  min, dflt,   // px floor + the dblclick / Enter-Space reset width
  max,         // number, or () => px for a dynamic ceiling (keep the neighbor column usable)
  onChange     // optional; fires with the width on every apply, drag frames included
}) → { set(px, persist), refresh() } | null
```
- Drag sign = `(anchor==='end' ? -1 : 1) × (dir==='rtl' ? -1 : 1)`, applied to pointer deltas
  **and** ArrowLeft/Right — the seam always follows the pointer/arrow *visually*. Keyboard is the
  APG window-splitter set: Arrow ±16, Shift+Arrow ±48, Home/End = bounds, Enter/Space = default.
- **One storage write per drag** (on pointerup), never per frame. A window resize re-clamps
  (debounced 150ms) from the user's pre-clamp *desired* width, so a squeeze is temporary.
- Pointer deltas divide by the handle's visual/layout scale (`getBoundingClientRect().width ÷
  offsetWidth`), so a zoomed ancestor (the dashboard's `style.zoom`) still tracks 1:1.
  `refresh()` re-applies the desired width — call it when a dynamic max's inputs change
  (`updateDashboardGrid` does, for the rails).

### Canonical handle markup
```html
<div class="sbr-split sbr-flex" id="sidebarSplit" role="separator" aria-orientation="vertical"
     tabindex="0" aria-valuemin="260" aria-valuemax="640" aria-valuenow="320"
     title="Drag to resize the sidebar (double-click to reset)"
     aria-label="Drag to resize the sidebar (double-click to reset)"
     data-i18n-title="shared.resize.sidebar_title"
     data-i18n-aria-label="shared.resize.sidebar_title"></div>
```
The three CSV keys already exist — `shared.resize.sidebar_title` / `.drawer_title` /
`.rail_title` — so adopting the component adds **no** rows. The `aria-value*` numbers are just
seeds; the mount rewrites them live. The inline English `title`/`aria-label` stay as pre-i18n
fallbacks beside their `data-i18n-*` siblings (standard pattern).

### Three geometry recipes — and what stays per-page
Every carrier keeps per-page: the `:root { --…-w: Npx; }` seed, the panel's
`width: var(--…-w, Npx)`, the handle's placement rule, and the kill rules (stacked media query,
print list, collapse interplay, ak-view-style overrides).
1. **In-flow sidebar** (dictionary, generator): handle class `sbr-split sbr-flex`, inserted as
   the aside's **immediate next sibling** — the collapse rule
   `#appSidebar.hidden + .sbr-split { display:none; }` depends on that adjacency. `anchor:'start'`.
   Dynamic max keeps the main column usable: `() => Math.min(HARD_MAX, window.innerWidth - MAIN_MIN)`.
   Add `.sbr-split` to the stacked-breakpoint kill and to any print / `body.ak-view` hide list.
   (Generator extra: `positionSidebarTab` is the `onChange`, and the fixed hide-tab sits at the
   seam's inline-end **+4px** so it never swallows drags — the dictionary's collapse tab bakes the
   same 4px into its `inset-inline-start: calc(var(--dict-sidebar-w) + 4px)`.)
2. **Settings drawer** (dashboard, torah, trope): handle class `sbr-split sbr-abs`, **first child**
   of `#settingsModal`, page rule `#settingsResize { inset-inline-start:-4px; }` (straddles the
   border seam; the handle intercepts its own pointerdowns, so a drag start never reaches the
   backdrop's click-to-close). `anchor:'end'`;
   `max: () => Math.min(640, Math.round(window.innerWidth * 0.92))` mirrors the CSS
   `max-width:92vw`. Hide it ≤560px (a `touch-action:none` edge strip would eat phone swipes).
   The `%`-based `translateX` closed state works at any width, and the `_settingsTrapKey` focus
   trap picks the handle up automatically (`[tabindex]:not([tabindex="-1"])`).
3. **Layout rail** (dashboard zones): handle class `sbr-split sbr-abs` as the zone's **last
   child** (stable under `renderPanelLayout`'s reparenting), positioned into the grid gap
   (`#zoneLeft > .sbr-split { inset-inline-end:-19px; width:14px; }` — a 14px strip centered in
   the 24px gap; left rail `anchor:'start'`, right rail `anchor:'end'`). Rail widths flow through
   custom properties referenced by the base `.dashboard` template AND every `.cols-*` variant —
   **never an inline `grid-template-columns`** (it would beat the ≤980px single-column query).
   Because the handle lives inside the zone, `updateDashboardGrid`'s `display:none` on an empty
   zone hides it for free; that function's tail calls `refresh()` on both rails so the survivor's
   dynamic max re-clamps. Rail max math measures **layout px** (`clientWidth` + computed
   padding/gap), never `window.innerWidth` — the dashboard's `style.zoom` scales the visual box
   only.

### Collapse / close interplay
Resize never touches the collapse machinery — `toggleSidebar()`, `openSettings()`/
`closeSettings()`, Escape and backdrop behavior are unchanged, and whole-sidebar collapse state
stays deliberately unpersisted. The obligation runs the other way: a collapsed or hidden panel
must hide its handle (the `+` adjacency rule, the in-zone containment, the ak-view/print lists),
and the engine's pointerdown guard (`getComputedStyle(handle).display === 'none'`) makes a hidden
handle inert regardless.

### Per-device width keys — erase-only registration
Every width key is `hebrew<Tool>_<thing>W`, a bare scalar holding the px number. It **tracks the
monitor, not the teacher**, so register it ONLY in `index.html` `eraseAllSettings()` (next to the
existing per-device comment) — never in `exportAllSettings`/`importAllSettings`/`IVRIT_CFG`, and
never inside a tool's settings blob or `getSettings()`. Current keys:
`hebrewDictionary_sidebarW`, `hebrewBlender_sidebarW`, `hebrewDashboard_drawerW`,
`hebrewDashboard_railLeftW`, `hebrewDashboard_railRightW`, `hebrewTorahTrainer_drawerW`,
`hebrewTropeTutor_drawerW`.

### Rule for any new tool
A new fixed-width options sidebar, settings drawer, or layout rail ships drag-resize via these
two blocks + a cfg — never a hand-rolled resizer. Pick the matching geometry recipe, mint the
width key per the rule above, and finish per the Definition of done (the page is precached →
**bump `sw.js` VERSION**; run `check-inline-js.mjs` + `check-i18n.js`; verify headless light+dark
/ EN+HE / desktop+stacked, including one RTL drag).

---

## Fullscreen idle-hide — shared block (every fullscreen-capable tool)
The exit-fullscreen control is only shown while the presenter is moving the mouse: after 3 s without
pointer, key, touch or wheel activity in fullscreen the block sets `body.fs-idle`; the next activity
clears it, and leaving fullscreen clears it. Nothing is saved.
- **Carriers (byte-identical JS, `/* ═══ shared: fullscreen idle-hide ═══ */`):** `Hebrew_Font_Maker.html`,
  `classroom_dashboard.html`, `flash_cards.html`, `hebrew_blend_generator.html`, `hebrew_dictionary.html`,
  `torah_trainer.html`, `trope_tutor.html` (7). Pasted directly above each page's `toggleFullscreen()`;
  sha-verify after touching it.
- **Host contract (per-page CSS, deliberately not identical):** one rule
  `body.fs-idle <exit control>:not(:focus-visible) { opacity: 0; pointer-events: none; }` plus `opacity`
  in that control's `transition`, and a component-local `@media (prefers-reduced-motion: reduce)`
  neutralizer for it. The `:focus-visible` exception is what keeps a keyboard user from being timed out;
  `pointer-events: none` is what makes the first tap on a touch device reveal rather than activate.
  What fades: the floating `#fsExitBtn` (Font Maker also `#fsPanelsBtn`; dashboard/generator/torah), the
  dictionary's floating `#fsBtn`, and on flash cards / Trope Tutor (whose header stays visible in
  fullscreen) the header `#fsBtn`. The dashboard strip and torah `#ttFsBar` keep their own 4 s show/hide.
- **Verify** with a stubbed Fullscreen API (headless Chromium cannot enter real fullscreen): define
  `document.fullscreenElement` as a getter, dispatch `fullscreenchange`, then measure the control at
  t=0, after 3.3 s idle, after a `page.mouse.move`, while focused past the idle time, and after exit.

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
  `torah_trainer.html`, `Hebrew_Font_Maker.html`, `flash_cards.html`, and `trope_tutor.html`
  — **all 7 tools**, but as **per-file engines**, not yet a single shared block. Flags are
  `hebrew<Tool>_tourSeen` except Font Maker's legacy `hebrewFontMaker_tourDone`. The generator's engine is
  a copy of Font Maker's; flash cards' and the trope tutor's are copies of the generator/torah lineage
  ("keep the engines in sync"). **Not** on `index.html` or `resources.html`.
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
  + `bindTip`), and `flash_cards.html` (its `tooltipIIFE` carries the `bindTip` wiring
  adapted to `.has-tip` triggers + the `#tipFloat` `.show`/opacity model; its one native-`<button>`
  trigger is hover/focus-only by design). The dashboard's `wire()` carries `aria-expanded`/
  `aria-describedby`, so all tooltip carriers meet the full contract.
  `trope_tutor.html` carries a verbatim copy of the torah_trainer `bindTip` IIFE.
- **Rule:** no new hover-only tooltips anywhere. New `data-tip`s must inherit the page's accessible
  handler automatically (don't hand-roll a one-off).

### 3. Share links (`?s=` state in the URL)
Serialize the tool's shareable state as a **diff against a pristine-defaults baseline** (so the URL stays
short), URL-safe-encode it into a **`?s=`** param, and restore it on init with **silent failure on garbage**.
Writing a link **never navigates**; loading a link **never clobbers** the user's saved presets/profiles
— it only sets the live view (that clobber-guard measured clean on all four carriers).
- **Implemented on: FOUR tools** — verify by grep before trusting this line; it has gone stale before. `hebrew_dictionary.html`
  (`serializeDictState`/`applyDictState`, also persists `hebrewDictionary_lastState`) and
  `hebrew_blend_generator.html` (`shareB64Encode`, auto-restores on load) both write `?s=` **and** mirror
  it into the address bar with `history.replaceState`. `flash_cards.html` ships **both** mechanisms — the
  paste-in teacher share code (`shareCodeEncode`/`shareCodeDecode`) **and** a `?s=` URL twin
  (`copyShareLink`) read back at init; it is NOT paste-code-only.
  `torah_trainer.html`'s practice link (`copyPracticeLink`/`practiceLinkURL`) deliberately uses
  **readable params** (`?parsha=&scope=&v=`) rather than an opaque blob — a link a student can read —
  and only a parsha reading has a URL form, so `syncShareBtn` HIDES the button (never disables it) for
  holiday and custom-range scopes.
- **`replaceState` is NOT universal:** the generator and dictionary mirror the link into the address bar;
  `torah_trainer` and `flash_cards` copy to the clipboard and leave it alone. Measured and deliberately
  LEFT as-is (both persist their state independently, so a refresh loses nothing, and the
  flash-cards payload would fill the bar with a long blob) — do not "converge" it without asking.
- **Rule:** any tool that gains shareable state uses `?s=` (a paste code may coexist where one already
  does; readable params are acceptable where the link is meant to be human-legible, as torah's is).
- **Button label:** the affordance is **🔗**-prefixed on all four carriers — not a
  clipboard or paperclip glyph, which read as "copy text" and "attachment" rather than "link".

### 4. Reduced motion
Every page must carry a `@media (prefers-reduced-motion: reduce)` block, and **every** animation added
anywhere — first-visit pulses, tour transitions, timer/omer pulsing, fades — must be neutralized inside it.
- **Implemented on:** every page with any animation — `torah_trainer.html`,
  `hebrew_blend_generator.html`, `hebrew_dictionary.html`, `classroom_dashboard.html`,
  `Hebrew_Font_Maker.html`, `404.html`, `flash_cards.html`, `index.html`, `resources.html`,
  `contact.html`, `trope_tutor.html` (**11 files**, complete; measured at runtime).
  (`privacy.html` and `terms.html` declare zero animations/transitions, so a block on either would
  be a no-op — their reduced-motion result is *blind*, not clean, and proves nothing about coverage.)
- **Two block shapes, and which to use.** Nine of the eleven open with the **universal neutralizer**
  (`*, *::before, *::after { animation-duration: .001ms !important; … }`, then page-specific rules
  below it) — prefer this for any new block: at (0,0,0) it loses to every class selector, so static
  cues still win, and it cannot silently miss a declaration added later. `404.html` and
  `trope_tutor.html` still **enumerate** their selectors; both measure 0 animating under `reduce`
  today (controls: 2 and 67 animating with `reduce` off), so they are correct, not pending — but an
  enumeration has to be extended by hand every time that page grows. Use `0.001ms`, never `0`: a
  zero-duration animation never fires `animationend`, and cleanup code depends on it.
- **Rule:** if you add an animation to a page, that page needs the reduced-motion block, and your
  animation must honor it. Verify by **measuring the live page** under
  `newContext({reducedMotion:'reduce'})`, not by grepping for the block — coverage is the property
  that breaks, and a page can carry a block that no longer covers it. Always run the `reduce`-off
  control too, so a zero that had nothing to neutralize is not mistaken for a zero that earned it.

### 5. Inline validation, never `alert()`
Validation should surface as **inline notes in the owning panel** plus a short summary near the primary
action; a primary action that can't run gets `aria-disabled` + a stated reason rather than a dead click or
a modal `alert()`. (`confirm()` for genuinely destructive actions — erase, reset-both-schemes — stays.)
- **Implemented on:** **preset-save flows only, as a first slice.** The generator and flash
  cards preset panels now validate empty names inline (`#presetNameNote` + `aria-live="polite"`, and
  `aria-disabled` on `#savePresetBtn`) via a shared `_setPresetNameNote(msg)` helper per file — replacing
  the generator's blocking `alert()` and flash cards' silent input-focus. Everywhere else, blocking
  `alert()` is still the norm (≈15–21 calls each in the generator, flash cards, index, and dashboard).
  Migrate the remaining call sites toward inline validation opportunistically as you touch each panel.
- **Rule:** do not add **new** `alert()`-driven validation; wire new validation inline. Leave existing
  `confirm()` destructive-action guards in place.
- **Rule:** a standing note retires as soon as the input it complains about changes (the generator's
  `toggleLetter` and flash cards' `_retireStartNote(key, ok)`), never only on the next press of the primary
  action — otherwise the button stays announced as `aria-disabled` after the teacher has fixed the problem.

### 6. First-run affordances
One-time nudges / setup cards / starter layouts, each gated by a `hebrew<Tool>_<flag>` localStorage flag so
they show **once** and never again; never a modal wall, never an auto-launching tour.
- **Implemented on:** `classroom_dashboard.html` (`STARTERS` starter-layout card, `hebrewDashboard_setupSeen`),
  `hebrew_blend_generator.html` (`QUICK_START_RECIPES` quick-start drawer/chips), and `Hebrew_Font_Maker.html`
  (mobile warning via `hebrewFontMaker_mobileWarnDismissed`; the old welcome card + `hebrewBlender_welcomeSeen`
  were replaced by the new-font onboarding wizard — see the Font Maker section).
- **Rule:** gate every first-run affordance behind its own `*_seen`/`*_dismissed` flag (which is
  export-exempt but erase-cleared — see the localStorage flag guidance above). **Deliberate exception:**
  the Font Maker's onboarding wizard is a *launcher*, not a nudge — it opens on every fresh start with
  no restorable autosave ("autosave wins": the Continue/Start-fresh prompt always runs first, and
  Continue never shows it), so it is intentionally not gated by a seen-flag.

### 7. Keyboard / touch parity
Documented keyboard shortcuts get visible `<kbd>` hint rows (surfaced on keyboard-capable devices);
touch-primary tools get gesture equivalents; every new interactive element must be keyboard-operable.
- **Implemented on** (census measured across all seven tools):
  **One heavy surface.** `Hebrew_Font_Maker.html` carries the full treatment — global shortcut handler +
  `?` cheat sheet via `shortcutGroups()`/`openShortcuts()` + `<kbd>` hints + 5 `aria-keyshortcuts`
  (the three node-panel mode buttons — `Escape`/`M`/`P` — plus undo `Control+Z` and redo
  `Control+Shift+Z Control+Y`). The right shape for a tool with dozens of shortcuts, and the only one.
  **Three light surfaces, all `<kbd>` hint rows without a cheat sheet.** `flash_cards.html`:
  two `.fc-kh-set` rows under the card nav that swap with `setListenChrome()`, because a listening round
  takes different keys (no flip, no Y/N), plus numbered `.lc-key` badges on the listening tiles — the
  first home the 1–9 tile keys ever had. `torah_trainer.html`: one `.tt-key-hints`
  row under `#ttReading` documenting the reading rover's five keys (Enter/Space play a word, arrows move
  word by word, Home/End jump to the ends), which had been implemented since the rover shipped and
  surfaced **nowhere** — no `<kbd>`, no `aria-keyshortcuts`, no `title`, no visible copy.
  `hebrew_dictionary.html`: a single inline `<kbd>/</kbd>` beside the search box.
  All are gated `@media (pointer: fine)` — a touch device has no keys to press.
  **⚑ The arrow caps do NOT mirror the same way in the two carriers that have them, and that is
  deliberate.** Flash cards' caps carry `.dir-arrow` because its nav follows *visual* direction via
  `_rtlNav()`, so RTL shows the RIGHT arrow as "previous". Torah Trainer's caps deliberately do **not**:
  its rover follows the *Hebrew*, which is always RTL, so `onReadingKeydown` hardcodes ArrowLeft = next
  word — measured identical in the EN and HE UIs. Mirroring those caps would make the hint state the
  opposite of what the keys do. Do not "converge" them in an RTL sweep.
  **`aria-keyshortcuts` is the suite's way of exposing a shortcut whose visible badge is `aria-hidden`**:
  the dictionary's `/`, and flash cards' Y/N buttons and 1–9 listening tiles. It states the key
  without touching the element's accessible name. Not added where the key is a role's *default*
  activation (Space/Enter on a `role="button"`), per ARIA authoring practice.
  **Nothing surfaced in the other three, and that is correct, not a gap:** `hebrew_blend_generator.html`,
  `classroom_dashboard.html` and `trope_tutor.html` have no documented *global* shortcuts to surface.
  Their document-level handlers bind only Escape-to-close (dashboard, trope) and, in the generator,
  Escape plus Enter/Space — and that Enter/Space is default activation on a focused tooltip trigger,
  not a shortcut. Nothing there is a key a user must be told about. Beyond that,
  `trope_tutor.html` applies APG-standard **widget** keyboard operability: roving arrow-key nav
  on its `role="tablist"` plus `aria-pressed`/`role="radiogroup"` toggles — an application of the
  keyboard-operability rule below, not a documented shortcut needing a `<kbd>` hint.
  **No tool currently ships touch-gesture equivalents** (no `touchstart`/swipe handlers anywhere —
  Flash Cards flips on plain tap).
- **Rule:** any new shortcut is shown as a `<kbd>` hint (and registered in the cheat sheet on the one tool
  that has one) **and** named in the triggering control's `title`; if its visible badge is `aria-hidden`,
  it also carries `aria-keyshortcuts`. Any new interactive element is reachable and operable by keyboard.

### 8. Hebrew text carries `lang="he"` (at rendering chokepoints)
Hebrew content must be marked `lang="he"` so screen readers switch to a Hebrew voice instead of
mispronouncing it with an English one. Mark at the **rendering chokepoint / nearest stable ancestor**,
not per-letter: wrap the shared colorizer's return (`colorizeHebrew` in the dictionary and flash cards,
`hebDisplay` in the dashboard) in a single `<span lang="he">…</span>`, and add `lang="he"` to the
builder template strings for glyph tiles (letter/vowel selectors, worksheet `.heb` cells). Put the
attribute in the **template/builder string** so it survives re-render. Never place `lang="he"` output
inside an HTML **attribute** value (the wrapper's quotes would break it), and don't mark a container
whose text is majority-English (e.g. mixed `<option>` labels). Verify: `document.querySelectorAll('[lang="he"]').length > 0` after render.
- **Implemented on:** `torah_trainer.html` (verse containers), `hebrew_dictionary.html`,
  `flash_cards.html`, `hebrew_blend_generator.html`, `classroom_dashboard.html`,
  `Hebrew_Font_Maker.html` (glyph tiles), `trope_tutor.html` (glyph tiles +
  example/question words).
- **Rule:** any new Hebrew-rendering surface marks its output `lang="he"` at the chokepoint.

### 9. Panel-collapse memory — a drawer that was tidied once stays tidy
A teacher who collapses the panels they don't use should not have to do it again next lesson. Every
collapsible `.panel` remembers its open/closed state across visits, via one `═══`-marked shared block
(`/* ═══ IvritSuite panel-collapse memory ═══ */ … /* ═══ end shared: panel-collapse memory ═══ */`),
byte-identical across all six carriers (sha-verify when you touch it) — copy it, don't
rewrite it. It exposes `panelMemSave()` / `panelMemApply()` and depends only on a per-page
**`PANEL_MEM_CFG`** (the `IVRIT_CFG` pattern):
```js
const PANEL_MEM_CFG = {
  scope: '.panel-title',                 // '#settingsModal .panel-title' where the page has panels outside the drawer
  read()      { return settings.panelsCollapsed; },              // or ivritSafeParse(localStorage…)
  write(map)  { settings.panelsCollapsed = map; saveSettings(); },
  afterApply() { syncPanelTitleAria(); }                          // the page's own aria-expanded sync
};
```
- **Panels are keyed by the `data-i18n` key on their title**, so identity is language-independent (a
  layout saved in English restores in Hebrew) and there are no ids to invent or keep in sync. Every
  `.panel-title` in the suite already carries one; a title without one is simply not remembered.
- **A key absent from the stored map keeps that panel's markup default** (captured once, pre-restore, in
  `PANEL_MEM_DEFAULTS`) — so a panel added in a later release opens or closes per its own markup instead
  of inheriting a neighbour's state. This is why the engine never treats "missing" as "expanded".
- **Where the map lives is per-page, and the engine never touches localStorage itself.** Tools with a
  settings blob keep it there as `settings.panelsCollapsed` (dashboard, torah, trope — so it rides the
  existing AllTools entry for free); the other three use a dedicated `hebrew<Tool>_panels` key, read via
  `ivritSafeParse` and registered in all five AllTools sites.
- **Implemented on:** all six collapse carriers — `torah_trainer.html` (the origin, later converged onto the shared block, with a read-side migration for its
  older bare-tail keys), `classroom_dashboard.html`, `trope_tutor.html`,
  `hebrew_blend_generator.html`, `flash_cards.html`, `hebrew_dictionary.html`. Sub-section headers
  (`.sub-section-hdr`, `.adv-section-title`, `.pos-sec-hdr`, `.rw-section-header`) are **not** covered —
  only `.panel`.
- **Rule:** a new tool with collapsible panels ships this block + its `PANEL_MEM_CFG`, calls
  `panelMemApply()` immediately after `initPanelCollapse()` at init, and calls `panelMemSave()` from
  **every** writer of `.collapsed` — the click/keyboard toggle *and* any Expand-all / Collapse-all
  button. Give each new `.panel-title` a `data-i18n` key (it needs one for translation anyway) and it
  is remembered automatically; nothing else per-panel is required.

---

