# Hebrew Blender — Claude Instructions

## Git
- Always commit and push directly to `main`
- Do not create feature branches

## Preset Save/Restore
Whenever a new UI control is added to `hebrew_blend_generator.html`, it must be included in both:
- `getSettings()` — serialize the control's current value
- `applySettings()` — restore the value and call any related UI toggle functions (e.g. `toggleGematriaMode()`, `toggleCwBlendOpts()`) so dependent rows update correctly

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
