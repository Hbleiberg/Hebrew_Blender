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
