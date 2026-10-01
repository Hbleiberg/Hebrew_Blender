# Classroom Dashboard — reference

> Binding rules live in `CLAUDE.md`; this file is how the dashboard's UI systems work (several are copied by the other tools).

## Dark Mode (`classroom_dashboard.html`)

### No-flash IIFE
A small inline `<script>` at the top of `<head>` adds `dark-early` to `<html>` before the page renders.
It is **OS-aware** (suite-wide): an explicit saved choice always wins, and when there is no
saved preference it falls back to `prefers-color-scheme: dark`.
```js
(function(){try{var s=localStorage.getItem('hebrewBlender_darkMode');if(s==='1'||(s===null&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark-early');}}catch(e){}})()
```
The CSS selector `html.dark-early body, body.dark` applies the dark token overrides for both the initial
load and runtime toggle. The page's on-load init must use the **same** OS-aware condition (otherwise a
`dark-early` `<html>` with a light-only init would flash to light). `classroom_dashboard.html` and
`hebrew_blend_generator.html` carry an equivalent multi-line form of this IIFE. Every dark toggle also
carries `aria-pressed` (synced in both `toggleDark` and the on-load init), and the icon-only toggles
carry `aria-label="Toggle dark mode"`.

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
  const _db = document.getElementById('darkBtn');
  _db.textContent = isDark ? '☀️' : '🌙';
  _db.setAttribute('aria-pressed', isDark ? 'true' : 'false');   // toggle exposes on/off state (suite-wide)
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

### Panel-width lock (`settings.lockPanelWidths`)
An opt-in teacher guard, off by default: **Settings → Display Options → Lock panel widths**.
`applyPanelWidthLock()` puts `body.widths-locked` on, flips every `.sbr-split` to
`aria-disabled="true" tabindex="-1"` with the locked tooltip, and blurs a focused handle; one
capture-phase document listener (`pointerdown`/`click`/`dblclick`/`keydown`) swallows the
interaction before the handle's own listeners see it — **the shared sidebar-resize block is never
forked or modified**, and the mounts keep serving their stored widths. `click` is in that list so
a press on the drawer's edge handle still can't fall through to the backdrop's click-to-close.
Being a `settings` field it rides presets, share codes and `.ivrit` files; `applyI18n` re-calls
the apply so a language switch can't restore an unlocked tooltip on a locked seam.

## Settings drawer (`classroom_dashboard.html`)

`#settingsModal` is still the overlay it was — `#settingsBackdrop` (a click closes), the `_settingsTrapKey` →
`_trapTabWithin` focus trap (Tab wraps inside; a roving `tabindex="-1"` tab and an unchecked radio are neither end
of the loop — the two filters also guard the first-run card and the student-picker overlay, which share the trap),
Escape from the page's global keydown handler, focus back to the opener on close, the shared `sidebar-resize` handle
`#settingsResize` (`--drawer-w`, written on the drawer itself — see [Resizable panels](#resizable-panels-sidebars-drawers-rails--shared-component))
and the drawer's own dark toggle `#drawerDarkBtn` — but nothing inside it collapses any more: the thirteen
collapsible `.panel`s behind *Expand all menus / Collapse all menus* became **seven tabs of flat sections**, the
Torah Trainer's drawer idiom (itself the Trope Tutor's Settings tab inside a drawer), copied rather than reinvented.

### Structure
| Element | Role |
|---|---|
| `.settings-backdrop` | Full-screen dark overlay; click closes the drawer |
| `.settings-modal` | The drawer (`width: var(--drawer-w, 380px)`, `max-width: 92vw`), slides in via `transform: translateX`; `role="dialog" aria-modal="true"` |
| `.settings-header` | Navy bar: the shared `hi-gear` + `dashboard.settings.header`, the dark toggle, the close button (`#fff` text, never `var(--white)`) |
| `.tt-tabs` | The tab strip — a sibling of the body, so it stays put while the body scrolls; `role="tablist"` (`dashboard.tabs.aria`) |
| `.settings-body` | Scrolls; holds the seven `.tt-tabpanel`s |

`openSettings()` commits an in-place board edit first, remembers the opener, adds `.open` to backdrop and drawer,
arms the trap, calls **`setSettingsTab('display')`** — every open starts on Display, no tab memory, no new key — then
`syncFormToSettings()` and focuses the close button. `closeSettings()` reverses it and `saveSettingsToStorage()`.

### The tab strip
- **`TT_TAB_IDS`**: `display` / `calendar` / `weather` / `class` / `text` / `presets` / `more` → `#dashTabDisplay` …
  `#dashTabMore`. Each is a `role="tab"` button carrying an inline SVG from the shared header-icons set over its
  label on a `.hi-lbl` span keyed `dashboard.tabs.<name>` — the `data-i18n` stays on the span, never on the button
  (`applyStaticI18n` would replace the SVG). Glyphs, in order: `hi-layout` (new, markup only — a board with a header
  bar and a side column), `hi-calendar`, `hi-weather` (new, markup only — a sun behind a cloud), `hi-group`,
  `hi-pencil`, `hi-bookmark` (copied from the hub), `hi-gear`.
- **CSS.** `.settings-modal .tt-tab` stacks icon above label (0.7rem, 700), `.hi-btn` still supplying the alignment;
  `.tt-tabs` is a container (`container-type: inline-size`) and two `@container` steps placed *after* the base rule
  (same specificity — source order decides) shrink the label to 0.6rem at 345px or narrower and 0.58rem at 318px or
  narrower — the drawer is resized by hand, so a viewport query would be the wrong lever, and a browser without
  container queries keeps the ellipsis. Measured headless in the sandbox's fallback font: at the 380px default each
  tab has ~53px and the longest labels need 48px ("Calendar") and 45px ("מזג אוויר"); a 360px phone gives a 330px
  strip (0.6rem: 41px / 38px) and the 320px minimum a 319px strip (0.58rem: 40px / 37px) — no label ellipsizes at
  any of the three, in either language. The tab has no transition, so there is nothing to neutralize under reduced
  motion (the old `.panel-title::after` arrow left that list).
- Each tab `aria-controls` one `.tt-tabpanel` (`#dashTabPanel<Name>`, `role="tabpanel"`, `aria-labelledby` its
  tab, `hidden` unless selected).

### Sections
A section is a flat `.tt-set` carrying `data-set="<key>"` — the key is the old panel key — under a
`h3.tt-set-title` (serif over a hairline rule, `tabindex="-1"` so it takes programmatic focus without joining the
Tab loop) keyed by the old `dashboard.settings.panel_*` string; a group inside one is a `.tt-set-sub` label (the
former `.sub-section-hdr`s: *English Date* / *Hebrew Date* / *Time*, *Schedule Sync Options*, *Hebrew Font*).
`.tt-set hr` keeps the rule the panels drew between groups; `.tt-set details > summary:hover` the FAQ rows' underline.
The sixteen sections by tab (`TT_SECTION_TAB`):
- **Display** — `display` (Display Options; keeps `id="displayPanel"`).
- **Calendar** — `datetime`, `dow`, `omer` (last; keeps `id="omerSettingsPanel"` and its inline `display:none` —
  `updateOmerDisplay()` shows the section only during the Omer, so out of season the tab holds two sections).
- **Weather** — `location` (the first-run card captures location on its own, so first-run never needs this tab; the
  Shabbat-times hint on the Calendar tab, `dashboard.days.shabbat_location_hint`, points here), `weather`.
- **Class** — `timer`, `picker`.
- **Text** — `dashtext`, `intermission` (Intermission screen: the mini rendering `#intermissionPreview` and its three
  buttons — *Presenter sheets* below; the hidden `#engFontUploadInput` follows it, outside both toolbar copies),
  `hebrew`.
- **Presets** — `presets` (keeps `id="presetsPanel"`: the tour's Quick-start step and `scripts/smoke-sync.mjs` read
  it), `schedule` (keeps `id="schedulePanel"`, the tour's target).
- **More** — `backup` (`dashboard.settings.panel_backup`: the `.ivrit` engine's standard markup with its inline
  `<style>`, which used to sit at the end of Presets under an `<hr>` — every control id is unchanged), `cloud`
  (`dashboard.settings.cloud_head`, "Your account"; hosts `#cloudSavesPanel`, where `IvritSaves.attach({ status })`
  mounts the shared account status line), `about`.

### One writer, two openers
`setSettingsTab(name)` is the only writer of tab state — `aria-selected`, the roving `tabIndex` (the selected tab
alone is in the Tab sequence), `hidden` on every tab panel, and `.settings-body` scrolled to the top; an unknown
name reads `display`. `openSettingsAtPanel(key)` opens the drawer, maps the section key through `TT_SECTION_TAB`,
scrolls the section to the top of the body and focuses its heading, so the next Tab enters the section's controls.
Its caller: `scripts/smoke-tools.mjs` (`'cloud'`) — the chip's menu no longer opens a
section. The tour's three drawer steps target controls, not sections, so their
`reveal` calls `_tourOpenDrawer()` then `setSettingsTab('display')` (Move panels) or `setSettingsTab('presets')`
(Quick-start layouts, Schedule Sync); `tourEnd` closes a drawer it opened and restores nothing else — the drawer
reopens on Display anyway.

### Keyboard
The tablist's keydown handler (in `wireFormListeners()`) is the Trope Tutor's: Left/Right move by **visual**
direction (the strip mirrors in the Hebrew UI, so under `dir="rtl"` the keys swap), Home/End, wrapping, and moving
focus activates the tab (automatic activation). Tab inside the drawer is the trap's.

### Retired
The shared panel-collapse memory block, `PANEL_MEM_CFG`, `expandAllMenus` / `collapseAllMenus`, `_syncPanelHdrAria`,
the tour's `_tourExpandPanel` and `panelsCollapsed` in `DEFAULTS` are gone — an older blob's map rides along unread
through `ivritSafeAssign`, and the cloud row's `*Collapsed` omit still covers the board columns' and video panel's
own `dowCollapsed` / `weatherCollapsed` / `timerCollapsed` / `pickerCollapsed` / `videoCollapsed`. The `.panel*` CSS
is gone with them. What stays: the `.sub-section*` CSS and `initSubSectionCollapse()` (through `_wireCollapseHdr`,
which the board column titles also use) for the one collapsible left on the page, the week editor's *Saved
Schedules*; and the `.radio-group { flex-wrap: wrap }` rule under 430px (the drawer still clips at its edge).

---

## Tooltips (`classroom_dashboard.html`)

> **Accessibility note:** the dashboard's `.tip-wrap`/`data-tip` tooltips have adopted the shared
> **accessible tooltip** pattern (tap/click + Enter/Space toggle, `aria-expanded`, Escape/outside/blur
> to close, one open at a time) — see [Shared UX components → Accessible tooltips](#shared-ux-components--the-conventions-all-tools-are-converging-on).
> The `position: fixed` floating-div mechanics below are still the delivery vehicle; the JS now also
> wires the keyboard/tap handlers, not hover alone.

### Why not pure CSS

`.settings-body` has `overflow-y: auto` (and the collapsible `.panel` the drawer used to hold clipped with `overflow: hidden` too), which cuts off `position: absolute` children, clipping any CSS-only tooltip bubble.

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
- `position: fixed` escapes the `overflow` clipping of `.settings-body`
- Tooltip appears **above** the `?` icon by default; flips **below** if near the top of the viewport
- Viewport clamping prevents left/right overflow
- One `#tipFloat` element is reused for all tooltips — never create per-tooltip bubble spans

---

## Timer and Student Picker — small contracts (`classroom_dashboard.html`)

- **Timer:** `timerTotal` is the chosen duration (a preset or the custom field) and `timerRemaining` the
  countdown; `timerReset()` returns to `timerTotal`. **"+1 min" (`timerAddMinute`) changes `timerRemaining`
  only** — Reset still returns to the preset — and keeps a running clock running, resumes one that just hit
  "Time!" (the 3-second hold is `timerFinishTimeout`, which `timerStart` / `timerReset` clear so a restart
  inside it is never snapped back to the full duration), and leaves a paused or idle one where it is.
- **Timer finish sound:** `timerFinish()` calls `timerPlayFinishSound()`, the one dispatcher over
  `TIMER_SOUNDS` — a table of `(ctx, out, t0)` recipes (`beep` is the default and the pre-picker sound;
  `none` is silent) synthesized from the page's single `timerAudioCtx`, so there is no asset to fetch,
  nothing in the CSP and nothing to precache. Everything plays through one `timerMasterGain` whose gain is
  `(timerVolume/100)²` — a square curve for perceived loudness, calibrated so the default `70` reproduces
  the 0.25 the lone beep used. The context is unlocked inside a click (`timerStart`, and the drawer's Test
  button, which is why the button must keep calling `ensureTimerAudio()`); recipes stay under ~1.8 s so
  they land inside the "Time!" hold. `timerSound` and `timerVolume` both travel with the account —
  `timerSoundId()` maps an id this build doesn't know to `beep`, never to silence, so an older blob can
  never quietly mute a classroom — own keys only, so an inherited name (`constructor`, `toString`) is
  unknown too. Restore `timerVolume` with `??`: a stored `0` is a deliberate mute. `timerVolumePct()` is
  the one reader (the gain and the drawer's slider), and it reads a value that is not a number as `70`.
- **Repeat until dismissed** (`timerRepeat`, off by default): `timerFinish()` swaps the 3-second hold for
  an alert that waits to be acknowledged — the sound repeats on a per-sound interval (`TIMER_SOUND_MS`;
  the recipes run 0.3–1.3 s, so one fixed spacing would either talk over the shofar or leave a gap after
  the beep) and "Time!" stays up. Three things end it and they are **not** interchangeable: a dismissal
  stops the sound *and* clears the display; the `timerRepeatMaxSec` cutoff and a hidden tab stop only the
  sound, leaving the alert on screen and still dismissible, so a teacher back from the hall still sees
  that the timer ended. Hence the split between `timerEndAlert()` (teardown only — the four timer controls
  call this, because each already owns its own display and countdown state; `timerAddMinute` would
  otherwise add `timerTotal + 60`) and `timerDismissAlert()` (teardown **plus** clearing the display).
  `timerRepeatMaxSec` is seconds with `0` = never, restored with `??`. The dismiss listeners are
  **capture-phase and attached only while alerting** — capture because the blackout's Escape handler calls
  `stopImmediatePropagation()`, and a blanked screen during a work period is exactly when a timer rings —
  and they never `preventDefault()`, so the dismissing tap still does whatever it was going to do. A plain
  key is ignored while a text surface has focus (the `B`-shortcut guard), Escape is not. The document-level
  fallback is load-bearing, not a convenience: `#timerDisplay` is hidden when the panel is collapsed or
  `showTimerFullscreen` is off, and then the visible Stop does not exist. The "tap to stop" hint is a
  **sibling** of `#timerDisplay`, never a child — `.done` runs `timerFlash`, which would strobe a child —
  and being static text it is also the only visual cue left under reduced motion, which kills that flash.
- **Student Picker:** a class's `picked` / `absent` lists live in `settings.pickerSessions[rosterId]` —
  localStorage only, stripped from presets, share codes, `.ivrit` files and the cloud row — and absences
  persist across days on purpose. `resetPickerCycle()` empties `picked` ("🔄 New round");
  `clearAbsences()` empties `absent` ("✅ Everyone's here", rendered in `#pickerProgress` only while someone
  is marked absent, whether or not the fair cycle is on). Both act on the active class only.

---

## Presenter sheets — Blank and Intermission (`classroom_dashboard.html`)

- **Two full-black sheets on one layer.** `#blackout` (Blank) and `#intermission` sit at z-index 100000,
  above every other layer, and never stack: `setBlackout(true)` closes the Intermission screen and
  `setIntermission(true)` closes Blank, so **B** over one swaps to the other. Both are **transient** — no
  storage key for open/closed (a sheet that survived a reload would read as a broken dashboard). Blank has
  a header button and a strip button; Intermission lives on the fullscreen strip only (right after Blank)
  plus its **I** key, which works in and out of fullscreen.
- **One key handler serves both.** Escape closes whichever sheet is up (`stopImmediatePropagation`, so the
  drawer underneath never closes with it); B and I are bare letters that yield to every text surface and
  to the tour. The strip's two buttons carry the keys as `.fss-key` badges (`@media (pointer: fine)`),
  `aria-keyshortcuts` and their `title`.
- **Intermission's words** are `settings.intermissionHTML` — sanitized HTML, `''` meaning "the default
  word", which is projected content and so follows `headerLang` (`'he'` → `hebDisplay('הַפְסָקָה')` with
  `lang="he"`, otherwise *Intermission*), never `I18n.lang`. `#intermissionText` deliberately has no
  `data-i18n` (`applyStaticI18n` would overwrite the teacher's words); `renderIntermission()` fills it on
  every open and from `applySettings`, and skips while it is being edited. It is **one message for the
  whole board**: deleted from `getSettings({forPreset:true})` (Schedule Sync would otherwise swap it at every
  period change) and from `PRISTINE_DEFAULTS` (a starter layout never wipes it), while `.ivrit` files,
  AllTools and the cloud settings row carry it. Every write into the page goes through `sanitizeDashHTML`.
- **Tap to return, except…** the sheet's click closes it unless the click is on the pencil, on a link or a
  spoiler in the text (the shared `spoilerClick` stops propagation once it reveals), inside the text while
  editing, or **the tap that just finished an edit** — `_inplaceOutside` records that pointerdown and the
  sheet's own pointerdown/click pair compares against it, so the first tap outside ends the edit and the
  next one closes the sheet. Opening focuses the sheet (so Tab reaches the pencil) and closing hands focus
  back first; like Blank, Tab past the pencil walks the live board beneath, by design. The closed sheet is
  `visibility: hidden` once its fade ends (it holds a button, unlike Blank's lone hint). The **sheet** is the
  scroller for a message too tall for the screen, and the text centres with `margin: auto`: a scroller on
  the text itself became a Tab stop on every one-word screen, because a font's ascent/descent outgrows
  `line-height: 1.2` by a few pixels.
- **The drawer's Intermission screen section** (Text tab, under Dashboard Text) is the sheet's mirror in the
  settings: `#intermissionPreview`, a 16:9 black card that is a size container, holds `#intermissionPreviewText`, and
  `renderIntermission()` fills both surfaces from the same words through `renderIntermissionInto(el, interactive)` —
  the sheet's text (interactive: `normalizeSpoilers` makes its spoilers buttons; skipped while it is being edited)
  and the preview (a picture, `aria-hidden`, its spoilers left as plates). The typography moved from the id to the
  shared class **`.im-text`** (both elements carry it), placed after the board's spoiler and effect rules so its class
  selectors win by order where the id used to win by specificity; each surface keeps its own box and `--im-size` —
  the sheet's `clamp(2.5rem, 11vmin, 9rem)` and `92vw`, the preview's `11cqmin` and `92cqw` of its card, so the
  words scale with the card the way they scale with the screen (a browser without container units shows the card
  with the drawer's text size). The preview refreshes wherever the words or their look can change: every
  `renderIntermission()` caller (the sheet opening, an edit ending, `applySettings`), `syncFormToSettings` (init and
  every drawer open), the `headerLang` radios (the default word follows them) and the form's `refreshAll` (the
  nikkud switches reach `hebDisplay`). Under the card sits **the words' editor**: `#intermissionToolbar` (built from
  `EDITOR_COMMANDS` like the other two toolbars, rebuilt on a language switch) over `#intermissionEditor`, a
  contenteditable that is black like the sheet and wears `.im-text` (a readable `--im-size` of its own), so colours,
  the two effects, spoilers and `<font size>` read as they will project. It shows the stored words, or the default word
  as a plain-text seed (`intermissionSeedText()`, `_imEdSeed`) exactly as the sheet's in-place edit does; every
  keystroke runs `intermissionEditorMirror()` — the seed unchanged or an emptied editor keeps the field `''`, anything
  else is `sanitizeDashHTML`'d into `intermissionHTML` — and re-renders the preview and the sheet
  (`renderIntermission({ skipEditor: true })`, so the editor is never rewritten under the caret; `syncIntermissionEditor()`
  refills it on every other render while it is not focused, and on blur only when it was emptied — a rewrite while
  words stand would detach the toolbar's saved selection). Its buttons: *Show screen* → `setIntermission(true)` (the
  sheet opens over the drawer, which stays; Escape closes the sheet first); *Edit on the screen* →
  `editIntermissionFromDrawer()` = `setIntermission(true)` + `enterIntermissionEdit()`, the sheet's own in-place editor
  at full size; *Use the default word* → `resetIntermissionWords()`, a `confirm()` then `intermissionHTML = ''`,
  disabled by `syncIntermissionControls()` while the sheet already shows the default. No new setting: the section
  reads and writes `intermissionHTML` only.

### The shared toolbar serves three surfaces
The toolbar commands act on `activeEditor()` = `_activeEditable || document.getElementById(_drawerEditorId)`: an
in-place surface while one is being edited, else **the drawer editor the toolbar is about** — `_drawerEditorId`
(`dashEditor` by default) follows `focusin` on either drawer editor and any `mousedown` or `focusin` on a drawer
toolbar, each of which names its editor in `data-editor` (`setDrawerEditor(id)`; the switch drops a saved selection
that lies in the other editor for a caret at this one's end, and `restoreEditorFocus` refuses to restore another
editor's range). `syncActive()` mirrors the drawer's Intermission editor through `intermissionEditorMirror()`;
`pickEditorFont` with nothing selected restyles that editor's whole text, as it does the sheet's. The two in-place
surfaces below are unchanged. The pencil on the
sheet calls `enterIntermissionEdit()`, which makes `#intermissionText` the `_activeEditable`, adds
`body.im-editing` (lifting `#inplaceToolbar` above the sheet) and registers the same capture listeners.
**`exitInPlaceEdit()` dispatches** to `exitIntermissionEdit()` when the Intermission text is active, so
every existing caller — Done, Escape, an outside tap, the drawer, a schedule switch, leaving fullscreen,
`pagehide` — reaches the right surface unchanged. Both Done and Escape keep the words there (what Escape
effectively does on the board's message too). `syncActive()` returns early for this surface (it would
re-render the board's message); an `input` mirror keeps `settings.intermissionHTML` current for the
visibility/pagehide saves. An untouched screen is seeded with its default word as plain text, and a commit
that leaves the seed unchanged keeps the field `''`. With nothing selected, the font menu restyles the whole
Intermission text rather than the page-wide `settings.engFont`, which belongs to the board's message. On
this surface `<font size>` scales from its own base (`--im-size`), because the toolbar's Small…XXL are
absolute keywords that would all come out smaller than a projected word.

## Text effects — Glow and Shadow (`classroom_dashboard.html`)
Two toolbar buttons after Strikethrough (both toolbars are built from `EDITOR_COMMANDS`), each toggling a
class-carrying span through `toggleWrapClass(cls)` — the spoiler's wrap/unwrap algorithm, which
`insertSpoiler()` now calls too. The sanitizer keeps `class`, so `fx-glow` / `fx-shadow` survive save,
paste, presets, `.ivrit` and the cloud. Each sets its own custom property (`--fx-glow`, `--fx-shadow`) and
both feed one `text-shadow`, so a run can wear both, nested either way. Light surfaces get a gold halo and
a dark drop shadow; dark ones (`body.dark`, and always the black Intermission sheet) a neon glow in the
text's own colour and a light offset. An unrevealed spoiler on a display surface gets `text-shadow: none`
(it paints even when the text is transparent, so the effect would draw the hidden letters). The buttons'
faces are sample letters, so `nameFromTitle` gives them their title as the accessible name.

---

## Your account (optional accounts)

The shared module (`docs/reference/accounts-and-cloud.md`) owns everything that talks to Supabase; the
dashboard only says which keys it owns and how to re-read them. Signed in, the account is where its presets,
schedules, settings and class lists live: they land at every load (one listing, then only what differs) and
every save, delete or reset reaches the account two seconds after the last write — the *Your account* section
of the More tab holds the module's status line, nothing else. What matters here: `flush` is
`flushRosterIfTyping()` + a non-exiting commit of the in-place editor (`syncActive()`) + `saveSettingsToStorage()`
(synchronous, and it reads `#dashEditor` into `settings` first) — the module calls it at every hydration and
before every write-through, so it must never throw a teacher out of an edit; `finalFlush` adds
`exitInPlaceEdit(true)` and runs only on `pagehide` and sign-out, as the page's own `pagehide` handler does. The
settings row **omits** every per-device field (`*Collapsed`, `panelLayout`, `videoLayout`, `zoomLevel`,
`hideZoomBar`, `keepAwake`, `lockPanelWidths`, `showTextSizeOptions`), the ephemeral `pickerSessions`, the
derived `_geoCoords`, the live `activeRosterId` and the `rosters` — the class lists are their own rows on the
same key (one per class, labelled by the class name), so a projector's zoom or layout never lands on the laptop,
and a sign-out that removes the account's rows strips only the fields each row carries (`localStripProjected`:
the settings blob's fields and the rosters are decided on their own). After the module writes the settings key
the page re-reads it (`loadSettingsFromStorage()`), then runs the `IVRIT_CFG.apply` tail — `applySettings` on a
clone, the three render caches nulled, `renderWeekSummary` / `renderScheduleUI` / the week editor — and
`ensureActiveClass()` self-heals a dangling class pointer after a roster landed. The pointer is per device, so a
second device that receives the account's classes would keep showing its own untouched default (`My class`, no
names): `adoptClassFromAccount()` switches it to the first class from the account — after each roster row lands,
and once per signed-in load (`IvritAccount.onChange`) for rows that landed on another page — and says so
(`dashboard.picker.cloud_switched`: the drawer's class note plus a toast). A class list that lands under the same
name as a class this device made itself and never synced (the module's last listing,
`IvritSaves.lastPlan('Dashboard')`, said *only on this device*) is folded into the landed one —
`foldSameNamedClass`: names unioned, pick session and pointer moved, the duplicate dropped, a toast
(`dashboard.picker.merged_same_name`); the fold waits while the device-extras card is still asking
(`onLocalChanged(kind, name, names, { pending })`), and a class synced before, or one that differs, stays as a
second class. The settings branch of the hook replaces the in-memory object outright (every own key deleted,
`PRISTINE_DEFAULTS` back, the stored blob on top) so a weekly grid removed elsewhere is removed here too — a
merge could never delete a field; when `location` changed it drops `_geoCoords` and refetches weather and
Shabbat times, and it repaints the holiday countdown, the Shabbat block and the Omer display at once. Presets
carry the class **name** (`activeRosterName`, written by `getSettings({forPreset:true})`, never the per-device
id): `applySettings` picks the class with that name here, else an older preset's id when it exists here, else
keeps the current class; `presetClassName` (the schedule's class-for-preset lookup) resolves by name first.
`IVRIT_CFG.apply` also takes class lists (`dashboardRosters` from the account backup, `roster` from a single
row's file), merged by id, and returns whether anything landed. On a Merge it never assigns a settings blob's
`rosters` (signed in, swapping the map would delete every class the file lacks from the account and every
device): the blob's classes join the file's class lists in that same merge by id, and the blob's
`pickerSessions` and `activeRosterId` are dropped, so this device's pick sessions and active class stay; a
Replace swaps them. The hub's import and paste split a `dashboardSettings` blob the same way
(`dashboardSettingsSplit` → `mergeDashboardRosters`). A blob a hydration wrote before this dashboard
was ever opened here (class lists only) still counts as a first run (`_storedBlobIsFirstRun`), and with a
stored session the Quick-start card (`openFirstRun()`) waits for the first `ivritsuite:hydrated` naming
`Dashboard` and opens only if no settings row landed and the last listing (`IvritSaves.lastPlan('Dashboard')`)
shows none in the account — a starter would overwrite them. Its 10 s fallback (a hydration that never finishes)
waits while the device-extras card (`.ivsav-overlay`) is open, since the hydration holds there for as long as
the teacher reads it, then asks the same. Deleting a class (`deleteClass`) is a
write like any other and reaches the account; while a session is stored its confirm says so
(`dashboard.picker.delete_class_confirm_cloud`). The 30-second `checkSchedule` can write storage at a period
boundary (through `applySettings` → `applyZoom`); the module re-reads the store after every write and treats a
row that moved between its listing and an action as a skip, not a stop.

Two seeds are never sent by themselves: an untouched empty default class ("My class", no names — the one every
fresh device mints) and the untouched "Default" preset `loadPresets()` seeds (the registry's `skipUpload` on
the roster and preset entries; the preset's is a canonical-JSON constant, `DASHBOARD_DEFAULT_PRESET_CANON`,
that `smoke-sync` asserts still equals `DEFAULT_PRESET.Default`). Neither is listed on the device-extras card
nor uploaded; a name added to the class, or any change to the preset, makes it an item like any other, and a
seed with a same-named row in the account takes the account's copy. The ninth "My class" row a phone once
uploaded was such a seed.

---

## Hebrew calendar converter (`classroom_dashboard.html`)

The dashboard's Hebrew date and Omer count come from its inline Reingold-Dershowitz block (`gregorianToJDN`,
`hebrewCalendarElapsedDays`, `hebrewToJDN`, `jdnToHebrew`, `numToHebLetters`, `formatHebDate`). The same converter
is the first block of `js/hebrew-calendar.js`, the Torah Trainer's module (which adds the weekly reading table;
`torah-and-trope.md` → *Reading schedule*). The two copies are meant to stay identical; making the dashboard load
the module instead of its inline copy is the next adoption, not yet done. The parasha is never computed here.
