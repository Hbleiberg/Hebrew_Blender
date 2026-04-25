# Classroom Dashboard — Implementation Plan

## Context
Adding a new self-contained "Classroom Dashboard" page (`classroom_dashboard.html`) to the Hebrew Blender website. The page is a live, display-oriented board meant for showing on a classroom projector: Hebrew days of week, Hebrew date + time, live weather, and configurable dashboard text. A settings drawer (gear icon) gives the teacher full control over display options. A "Beta" card is added to `index.html`.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `/home/user/Hebrew_Blender/classroom_dashboard.html` | **Create** (new, ~1400 lines) |
| `/home/user/Hebrew_Blender/index.html` | **Modify** — add Beta card + `.beta-tag` CSS |

---

## index.html Changes

**Add `.beta-tag` CSS** after line 49 (after `.page-card:hover .go-btn{...}`):
```css
.beta-tag{display:inline-block;background:var(--gold);color:var(--white);font-size:0.55rem;font-weight:700;letter-spacing:0.06em;padding:2px 6px;border-radius:4px;vertical-align:middle;margin-left:6px;text-transform:uppercase;}
```

**Add card** after line 89 (after closing `</a>` of dictionary card), before `</div>` of `.cards`:
```html
<a class="page-card" href="classroom_dashboard.html">
  <div class="icon">🏫</div>
  <h2>Classroom Dashboard <span class="beta-tag">Beta</span></h2>
  <p>Live Hebrew date, time, weather, and days of week for classroom display.</p>
  <div class="go-btn">Open Dashboard →</div>
</a>
```

---

## classroom_dashboard.html Structure

### HTML Layout
```
<head>
  GA tag (G-CMLC81Z0HC)
  Google Fonts (Frank Ruhl Libre, Libre Baskerville, Source Sans 3)
  Early dark-mode IIFE (same as index.html line 17)
  <style> block

<body>
  <header>
    ✡ star | h1 "Classroom Dashboard" | p subtitle
    .hright → ← Home | 🌙 dark | ⚙️ gear | fullscreen SVG btn

  <div class="dashboard">   ← 3-column CSS grid
    .dash-left   → #daysList (days of week, rendered by JS)
    .dash-center → #dateTimeBlock (date + heb date + time)
                   #dashTextWrap (dashboard text display)
    .dash-right  → #weatherBlock (weather, rendered by JS)

  .settings-backdrop  (click-to-close overlay)
  .settings-modal     (right-side drawer, 360px wide)
    .settings-header (gear + close btn)
    .settings-body (scrollable)
      Section: Location input + Update button
      <hr>
      Panel: Date/Time Settings (radio + toggles)
      Panel: Weather Display (radio + toggles)
      Panel: Day of Week Display (radio + toggle)
      Panel: Dashboard Text (toggle + contenteditable editor + toolbar)
      Panel: Dashboard Presets (save/load/export/import — same as generator)
      Panel: Hebrew Settings (font picker + nikkud toggles)

  <script> block
```

### CSS Sections (all inline in `<style>`)
1. **`:root` design tokens** — copy verbatim from generator (`--navy`, `--gold`, `--gold-light`, `--cream`, `--warm-gray`, `--text`, `--muted`, `--border`, `--white`, `--heb-font`)
2. **Dark mode overrides** — `html.dark-early body, body.dark { ... }` — copy verbatim
3. **Base reset + body**
4. **Header** — copy from generator; add `#gearBtn` + `#fsBtn` styled like `darkToggle`
5. **`.dashboard` grid** — `grid-template-columns: 240px 1fr 240px`; `min-height: calc(100vh - header)`
6. **Date/time block** — `.eng-date` (Libre Baskerville 1.4rem), `.heb-date` (heb-font 2rem, direction:rtl), `.current-time` (2.4rem)
7. **Days list** — `.day-item` rows; `.day-item.day-sunday` red bg; `.day-item.day-shabbat` purple/rainbow gradient; `.day-item.day-today` gold border highlight
8. **Weather block** — large emoji (4rem), Hebrew label, temp, Hebrew descriptor word (חָם/נָעִים/קַר)
9. **Settings modal** — `position:fixed; right:0; top:0; width:360px; height:100vh`; backdrop behind it
10. **Panel/toggle/button/preset** — copy verbatim from generator (`.panel`, `.panel-title::after`, `.toggle`, `.slider`, `.btn-xs`, `.preset-item`, `.preset-row`, `.font-opt`, `.color-mode-btn`)
11. **Dashboard text editor toolbar** — formatting buttons + color input
12. **Fullscreen overrides** — `body.fullscreen header { display:none }`

---

## JavaScript Functions

### Constants
```js
const DAYS = [
  {heb:'יוֹם רִאשׁוֹן', eng:'Sunday',    cls:'day-sunday'},
  {heb:'יוֹם שֵׁנִי',   eng:'Monday',    cls:''},
  {heb:'יוֹם שְׁלִישִׁי',eng:'Tuesday',   cls:''},
  {heb:'יוֹם רְבִיעִי', eng:'Wednesday', cls:''},
  {heb:'יוֹם חֲמִישִׁי',eng:'Thursday',  cls:''},
  {heb:'יוֹם שִׁישִּׁי', eng:'Friday',    cls:''},
  {heb:'יוֹם שַׁבָּת',  eng:'Saturday',  cls:'day-shabbat'},
];

const HEB_MONTHS_HE = ['תִּשְׁרֵי','חֶשְׁוָן','כִּסְלֵו','טֵבֵת','שְׁבָט','אֲדָר','אֲדָר א׳','אֲדָר ב׳','נִיסָן','אִיָּר','סִיוָן','תַּמּוּז','אָב','אֱלוּל'];
const HEB_MONTHS_TRANSLIT = ['Tishrei','Cheshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II','Nisan','Iyar','Sivan','Tammuz','Av','Elul'];

const WEATHER_WMO = {
  0:   {emoji:'☀️', he:'שֶׁמֶשׁ',         en:'Clear'},
  1:   {emoji:'🌤️', he:'מְעֻנָּן חֶלְקִית',en:'Partly Cloudy'},
  2:   {emoji:'🌤️', he:'מְעֻנָּן חֶלְקִית',en:'Partly Cloudy'},
  3:   {emoji:'☁️', he:'עֲנָנִים',         en:'Overcast'},
  45:  {emoji:'🌫️', he:'עֲרָפֶל',          en:'Fog'},
  48:  {emoji:'🌫️', he:'עֲרָפֶל',          en:'Fog'},
  51:  {emoji:'🌦️', he:'טַפְטוּף',         en:'Drizzle'},
  53:  {emoji:'🌦️', he:'טַפְטוּף',         en:'Drizzle'},
  55:  {emoji:'🌦️', he:'טַפְטוּף',         en:'Drizzle'},
  61:  {emoji:'🌧️', he:'גֶּשֶׁם',           en:'Rain'},
  63:  {emoji:'🌧️', he:'גֶּשֶׁם',           en:'Rain'},
  65:  {emoji:'🌧️', he:'גֶּשֶׁם',           en:'Rain'},
  71:  {emoji:'❄️', he:'שֶׁלֶג',            en:'Snow'},
  73:  {emoji:'❄️', he:'שֶׁלֶג',            en:'Snow'},
  75:  {emoji:'❄️', he:'שֶׁלֶג',            en:'Snow'},
  80:  {emoji:'🌧️', he:'גֶּשֶׁם',           en:'Rain'},
  95:  {emoji:'⛈️', he:'סְעָרָה',           en:'Thunderstorm'},
  96:  {emoji:'⛈️', he:'סְעָרָה',           en:'Thunderstorm'},
  99:  {emoji:'⛈️', he:'סְעָרָה',           en:'Thunderstorm'},
};
```

### Hebrew Calendar (Dershowitz-Reingold inline, ~70 lines)
```
gregorianToJDN(y, m, d)     → integer Julian Day Number
hebrewLeapYear(y)           → bool — formula: (7*y+1)%19 < 7
hebrewMonthsInYear(y)       → 12 or 13
hebrewDaysInMonth(m, y)     → integer (handles variable Cheshvan/Kislev)
hebrewElapsedDays(y)        → days from epoch to 1 Tishrei year y
hebrewNewYearJDN(y)         → JDN of 1 Tishrei year y (epoch = JDN 347997)
jdnToHebrew(jdn)            → {year, month, day}
formatHebDate(script)       → string e.g. "27 Nisan 5786" or "כ״ז נִיסָן תשפ״ו"
```
Verified test: April 25, 2026 → JDN 2461150 → 27 Nisan 5786.

### Clock & Date Display
```
updateDateTimeDisplay()   — rebuilds #engDate, #hebDate, #currentTime per current settings
startClock()              — setInterval(updateDateTimeDisplay, 1000)
```

### Days of Week
```
renderDaysList()
  — iterates DAYS[0..6], today = new Date().getDay()
  — yesterday = (today+6)%7, tomorrow = (today+1)%7
  — applies annotations: 🥚 אֶתְמוֹל הָיָה | 🐣 הַיּוֹם | 🐔 מָחָר יִהְיֶה
  — respects settings.showYestTomorrow and settings.dowLang
```

### Weather
```
fetchWeather()
  — geocode: GET https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1
  — forecast: GET https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weathercode
  — calls renderWeather(data, cityName)
  — schedule: fetch on load + setInterval every 30 min

renderWeather(data, city)
  — tempC = data.current.temperature_2m
  — tempDisplay = F or C per settings
  — descriptor: >25°C → חָם | <15°C → קַר | else → נָעִים
  — lookup WEATHER_WMO[code] → emoji + label
  — builds #weatherBlock innerHTML
```

### Settings Modal
```
openSettings()    — adds .open class to backdrop + modal; syncs all form states
closeSettings()   — removes .open; calls saveSettingsToStorage()
```

### Settings State (`settings` object — single source of truth)
```js
let settings = {
  location:'New York', engDateFmt:'MDY', showEngDOW:false, hideEngDate:false,
  hebDateScript:'he', hideHebDate:false, timeFmt:'12', hideTime:false,
  tempUnit:'F', weatherLabelLang:'he', hideWeather:false,
  dowLang:'he', showYestTomorrow:true, enableDashText:false, dashTextHTML:'',
  hebFont:'Frank Ruhl Libre', showNikkud:true, colorCodeNikkud:false,
  nikudColorMode:'letter', nikudColorOverrides:{}
};

getSettings()     → serializes settings + live form values
applySettings(s)  → merges into settings, sets all form states, calls render functions
saveSettingsToStorage()  → localStorage 'hebrewDashboard_settings'
loadSettingsFromStorage() → merges saved over defaults on page load
```

### Preset System (exact pattern from `hebrew_blend_generator.html`)
```
savePreset()    — reads #presetName, stores getSettings() under key in 'hebrewDashboard_presets'
loadPreset(n)   — calls applySettings(presets[n])
deletePreset(n) — removes from localStorage, re-renders list
renderPresets() — builds #presetList with .preset-item divs (Load + ✕ buttons)
exportPresets() — writes JSON to #presetBackupBox
importPresets() — parses #presetBackupBox, merges with existing
```

### Dashboard Text Editor
```
fmt(cmd, val)     — document.execCommand(cmd, false, val); refocus editor
setAlign(dir)     — execCommand('justifyLeft/Center/Right')
syncDashText()    — copies editor innerHTML → #dashTextDisplay; triggers nikkud colorize if on
toggleDashText(on)— shows/hides editor wrap and display div
```

### Copied verbatim from `hebrew_blend_generator.html`
- `HEB_FONTS[]` array + `initFontSelector()`, `loadHebFont()`, `setHebFont()`
- `VOWEL_GROUPS[]`, `NIKUD_DEFAULTS_LIGHT/DARK`, nikkud color-coding system
- `initPanelCollapse()` — wires all `.panel-title` click → toggle `.collapsed`
- `toggleFullscreen()` + `fullscreenchange` listener + `FS_ENTER_ICON`/`FS_EXIT_ICON` SVGs
- `toggleDark()` + dark mode `DOMContentLoaded` init

### Init Sequence (DOMContentLoaded)
```
loadSettingsFromStorage()
initDarkMode()
initFontSelector()
initPanelCollapse()
applySettings(settings)
renderDaysList()
startClock()
scheduleWeatherRefresh()
renderPresets()
```

---

## Verification / Testing

1. Open `classroom_dashboard.html` in browser → 3-column layout renders
2. Check English date = April 25, 2026 (Saturday) and Hebrew date = כ״ז נִיסָן תשפ״ו (verify at hebcal.com)
3. Clock ticks every second in both 12h/24h mode
4. יום שבת row has purple/rainbow gradient; יום ראשון row is red
5. Annotations: יום שישי = 🥚 אֶתְמוֹל הָיָה, יום שבת = 🐣 הַיּוֹם, יום ראשון = 🐔 מָחָר יִהְיֶה
6. Enter "New York" in settings → weather loads (temp + emoji + label)
7. Toggle F/C → temperature unit updates
8. Toggle weatherLabelLang → Hebrew/English emoji labels switch
9. Enable dashboard text → type Hebrew → displays in center; formatting toolbar works
10. Save/load/delete preset → all settings including editor content restore correctly
11. Export preset → JSON in textarea; paste + import → merges correctly
12. Font picker in Hebrew Settings → changes Hebrew text font site-wide
13. Dark mode toggle → dark theme applies; page refresh keeps dark state (no flash)
14. Fullscreen button → enters browser fullscreen; header hides; icon changes
15. `index.html` → new card appears with 🏫 icon and gold "Beta" badge; link works
