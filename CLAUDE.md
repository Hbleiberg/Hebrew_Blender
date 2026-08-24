# Hebrew Blender — Claude Instructions

## Contents

**Binding rules (every change must comply)**
- [Git](#git)
- [Definition of done](#definition-of-done--check-every-item-before-finishing-a-change)
- [Security — required patterns (`ivritSafeParse` / `esc()` / CSP)](#security--required-patterns-safe-json-parse-esc-csp)
- [Internationalization (i18n / RTL) — `I18n.t()` / `data-i18n*` / logical CSS](#internationalization-i18n--rtl)
- [Import / Export All Settings — AllTools registration](#import--export-all-settings-indexhtml)
- [localStorage flag guidance — what belongs in AllTools](#localstorage-flag-guidance--what-belongs-in-alltools)
- [.ivrit save files](#ivrit-save-files-automatic-input--required-on-every-tool-with-presetssettings)
- [Preset Save/Restore (`getSettings()`/`applySettings()`)](#preset-saverestore)
- [Preset Lists — Nested Folders](#preset-lists--nested-folders-file-tree)
- [My Fonts — shared font store](#my-fonts--shared-font-store-picker-integration--upload-every-font-selector-tool)
- [Vowel Color Scheme — Default / TaL AM](#vowel-color-scheme--default--tal-am-all-three-picker-tools)
- [Trope Color Coding](#trope-color-coding-torah_trainerhtml)
- [Trope Tutor](#trope-tutor-trope_tutorhtml)
- [Shared UX components](#shared-ux-components--the-conventions-all-tools-are-converging-on)
- [App Version & Splash Screens](#app-version--splash-screens-splash)
- [Service Worker & Caching](#service-worker--caching-swjs)
- [Deploy — how changes reach ivritsuite.com](#deploy--how-changes-reach-ivritsuitecom-github-pages)

**Component reference (how existing systems work)**
- [Preset Lists — Drag-to-Reorder](#preset-lists--drag-to-reorder-superseded-for-the-six-foldered-lists-above)
- [Dark Mode](#dark-mode-classroom_dashboardhtml)
- [Hebrew Font UI](#hebrew-font-ui-classroom_dashboardhtml)
- [On-Screen Hebrew Keyboard — shared component](#on-screen-hebrew-keyboard--shared-component-resourceshtml)
- [Test-phrase chips — shared component](#test-phrase-chips--shared-component-font-pages-only)
- [Hebrew Font Maker](#hebrew-font-maker-hebrew_font_makerhtml)
- [Nikkud Color Coding UI](#nikkud-color-coding-ui-classroom_dashboardhtml)
- [Settings Drawer & Panel Collapse](#settings-drawer--panel-collapse-classroom_dashboardhtml) (persistence: [Panel-collapse memory](#shared-ux-components--the-conventions-all-tools-are-converging-on))
- [Tooltips](#tooltips-classroom_dashboardhtml)
- [Letter Selector](#letter-selector-hebrew_blend_generatorhtml)
- [Vowel Selector](#vowel-selector-hebrew_blend_generatorhtml)
- [Worksheet Chunked Build](#worksheet-chunked-build-hebrew_blend_generatorhtml)
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
- [ ] Added a collapsible `.panel`, or new code that writes `.collapsed`? → give the title a `data-i18n` key and call `panelMemSave()` from that writer (see Panel-collapse memory) — otherwise the drawer silently forgets that panel.
- [ ] Added/changed a user-facing UI string or new CSS? → route the string through `I18n.t()`/`data-i18n*` (+ a key in `locales/ui-strings.csv`, then `node scripts/build-locales.js`); use **logical** CSS props (`*-inline-*`, `text-align:start/end`); run **`node scripts/check-i18n.js`** (must report no NEW violations). See Internationalization.
- [ ] Edited any inline `<script>` in a root HTML page? → run **`node --experimental-vm-modules scripts/check-inline-js.mjs`**.
      Every page is a single-file app, so ONE syntax error kills that page's entire JavaScript while the static
      HTML still renders — it looks like a CSS glitch, not a dead page. This is not hypothetical: a literal
      backtick inside `HELP_CONTENT.about` (a JS template literal) closed the string early and took the whole
      Font Maker down in production on 2026-08-21. **Never put a raw `` ` ``, `${`, or `</script>` inside authored
      HTML that lives in a template literal — use `&#96;`, `&#36;{`, and `<\/script>`.**
- [ ] Verified headless with the **Playwright recipe** (see "Verifying changes" section): light + dark mode, desktop + ~800px.
- [ ] Added or meaningfully changed a page's content? → run **`node scripts/update-sitemap.mjs`** as your last step so each `<lastmod>` reflects this change's commit date (see Deploy section). Idempotent; safe to run every session.
- [ ] Changed a page's `<title>`, `<meta name="description">` or JSON-LD (incl. its `HowTo` steps or `FAQPage` Q&A), or added/removed a page? → run **`node scripts/update-llms-txt.mjs`** to regenerate `llms.txt` + `llms-full.txt` (see Deploy section). **Never hand-edit either file** — they are generated, and the next run overwrites them. Idempotent; `--check` reports staleness without writing.
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

## Internationalization (i18n / RTL)

The suite ships a full Hebrew UI (English default). Every page loads the shared runtime
`js/i18n.js` (`window.I18n`) and mounts an EN/עברית switcher. **All 13 pages + `pwa.js` are localized;
`locales/ui-strings.csv` is the single source of truth.** These rules are binding for every change —
a new feature that hardcodes English or uses physical CSS silently breaks the Hebrew experience.
Enforced by **`node scripts/check-i18n.js`** (run it before finishing; see rule 7).

### 1. Never hardcode a user-facing UI string — route it through `I18n.t()` / `data-i18n*`
- **Static HTML** → a `data-i18n*` attribute (filled by `I18n.applyStaticI18n`): `data-i18n` (textContent),
  `data-i18n-title`, `data-i18n-aria-label`, `data-i18n-placeholder`, `data-i18n-tip` (→ `data-tip`),
  `data-i18n-html` (innerHTML, trusted CSV only). A visible `title=`/`aria-label=` literal may stay as the
  pre-JS fallback **only** alongside its `data-i18n-*` sibling.
- **Dynamic JS** → `I18n.t('key')` or `I18n.t('key', {name, count})` (`{placeholder}` substitution). This
  covers `alert`/`confirm`/`prompt`, `.textContent`/`.innerHTML`, button/option labels, `.placeholder`/
  `.title`, and `setAttribute('aria-label'|'title'|'placeholder', …)`. A **missing key returns the key
  string** (and `console.warn`s), so a raw `page.feature.x` on screen means an unbuilt/typo'd key.
- Never build a UI string by concatenating English literals; put the whole sentence in one key with params.

### 2. CSV workflow
New keys go in `locales/ui-strings.csv`. The schema is **column-driven**: `key`, then one column per
language (**the first must be `en`** — the fallback source; currently `key,en,he,context,notes`), then
`context,notes` as the last two columns; every row carries exactly one field per header column. Then run
**`node scripts/build-locales.js`** — it compiles a committed `locales/<lang>.json` per language column
(no deploy-time build). An empty non-`en` cell falls back to English and is tracked debt (reported per
language by `build-locales` and `check-i18n`). Plurals are split `.one`/`.other` (tag `plural` in notes);
interpolation uses `{placeholder}` tokens. Any precached-file edit still bumps `sw.js VERSION`.

### 3. Key naming
`page.feature.element` — lowercase, dot-separated (e.g. `dashboard.picker.close_aria`,
`fontmaker.modals.save_project_title`). Cross-tool chrome lives under `shared.*` (`shared.nav.*`,
`shared.footer.*`, `shared.darkmode.*`, `shared.fonts.*`, `shared.ivrit.*`, `shared.folders.*`, `shared.lang.*`). Glyph names
under `*.glyphname.*`.

### 4. Scope boundary — what translates vs. what stays content
**TRANSLATE (UI chrome):** every control, dialog, tooltip, placeholder, aria-label, toast/status, empty
state, help/FAQ. **NEVER translate** (stays English, a content-language toggle, or pinned Hebrew — mark such
a literal with an inline `i18n-ignore` comment so `check-i18n` skips it):
- **Printed worksheet / answer-key / flash-card-face output.** The printed Name/Date/Class header follows
  **`headerLang`**, not `I18n.lang`; the printed **answer-key banner + QR caption** are printed output
  (English/`headerLang`) — only the QR *sidebar controls* translate.
- **Dashboard projected/student-facing widget content** (dates, days, weather, Omer, column titles, picker
  group labels) → the existing **`headerLang`/`dowLang`/`showOmerEnglish`** toggles, **independent of
  `I18n.lang`**. Only the teacher-facing settings drawer + chrome follow the UI language.
- **Browser tab `<title>`s + `<meta name="description">`** stay English on all 13 pages (SEO — the
  statically-served source is what crawlers index; nothing writes `document.title`, and none of these
  carry `data-i18n`). A documented decision, not a gap.
- Hebrew instructional/example content, transliteration, Sefaria/PocketTorah content, the taught
  Ashkenazi/Sephardi **trope pronunciation names**, footer brand/attribution credits, and third-party
  resource-directory data.

### 5. RTL / CSS — logical properties, not physical
New CSS uses **logical properties** so chrome mirrors in Hebrew and is a no-op in English:
`margin-inline-start/end`, `padding-inline-*`, `inset-inline-start/end` (not `left`/`right`),
`border-inline-*`, `text-align: start/end` (not `left`/`right`). Hebrew-**content** containers get an explicit
`dir="rtl" lang="he"` at the render chokepoint. **Known exception:** coordinate systems that must NOT mirror
— the Font-Maker glyph-edit stage (`.stage-wrap`/`#stage`/`#meStage`/`.ws-center`) — stay pinned
`direction:ltr`; a `dir=rtl`-conditional sign-flip is used where a physical delta drives a mirrored grid
(the `.ws-split` column resize).

### 6. The `applyI18n` wiring rule
Every page defines `applyI18n()` = `I18n.applyStaticI18n()` **plus** a re-render of its JS-built dynamic
content (and a re-sync of state-dependent labels like the dark-toggle). Wire it **inside** the page's
`DOMContentLoaded` handler: `if (window.I18n) { I18n.ready.then(applyI18n); I18n.onChange(applyI18n); }`
— the deferred `js/i18n.js` means `window.I18n` is **undefined at inline-script parse time**, so top-level
wiring silently no-ops. `applyI18n` must be read-only: never mutate undo/dirty/project state, and never
disrupt in-flight audio/animation (see torah_trainer/trope_tutor/Font Maker for the guarded versions).

### 7. Enforcement — `scripts/check-i18n.js`
Run **`node scripts/check-i18n.js`** before finishing. It flags hardcoded English literals that don't go
through `I18n.t()` (**Check A**, a hard gate — exit 1 on any **new** violation) and reports empty-`he`
translation debt + untranslated `title`/`aria-label`/`placeholder` tooltip attributes (warn-only). A
baseline (`scripts/check-i18n-baseline.txt`) holds accepted Check-A findings that don't fail the gate —
currently only the permanent printed answer-key / QR-caption output (the initial rollout's untranslated-UI
backlog was wired up in the first **Pass K** run, 2026-07-12; see `docs/IMPROVEMENT_LOG.md`). To accept a
new intentional non-translatable literal, prefer a same-line **`i18n-ignore`** comment; reserve the baseline
for genuinely-permanent printed-output cases (regenerate with `--update-baseline`, then re-apply its header).
**Known blind spot:** Check A only sees plain-literal JS assignments and static markup (script regions are
blanked), so an English `title=`/`aria-label=` built inside a JS **template literal** (or passed as a plain
function argument) escapes it — don't treat a green gate as proof there are zero untranslated tooltips. The
remaining backlog of that shape (Font-Maker-heavy) is tracked for Pass K run 2 in `docs/IMPROVEMENT_LOG.md`.

### 8. Adding a new UI language
The pipeline is N-language-ready; Hebrew is just the first non-English locale. To add language `X`
(LTR example `fr`, RTL example `yi`):
1. **CSV** — add an `X` column to `locales/ui-strings.csv` after the last language column (header order =
   column order; `context,notes` stay last); fill translations — empty cells fall back to English as
   tracked debt.
2. **Build + gate** — `node scripts/build-locales.js` emits `locales/X.json` automatically (the schema is
   column-driven), and `check-i18n` Check B reports the new column's debt automatically. No script edits.
3. **`js/i18n.js`** — add `'X'` to `SUPPORTED`; if right-to-left, add it to `RTL_LANGS` (lang→dir is
   list-driven — no other dir code); add a `SWITCHER_LANGS` entry (`{code, label, aria}`) — the switcher on
   every page grows the new button automatically.
4. **The inline no-flash IIFE** in every production page `<head>` hardcodes the supported codes + the
   `he`→`rtl` map (locate all copies by grepping `hebrewBlender_lang` → 14 root HTML files: the 13
   production pages + the non-production `i18n-test.html` harness; plus the template comment at the top of
   `js/i18n.js`) — update each copy to accept `X` (and map it to `rtl` if RTL).
5. **`sw.js`** — add `/locales/X.json` to `CORE_ASSETS` and bump `VERSION`.
6. **Caveat — plurals:** call sites pick keys with the English binary rule (`n === 1 ? '.one' : '.other'`);
   Hebrew ships with that approximation. A language whose plural categories differ (French 0/1, Slavic
   forms) needs an `Intl.PluralRules`-based helper plus a call-site sweep — a deliberate future refactor,
   not part of this mechanical recipe.

(The `headerLang`/`dowLang`/`showOmerEnglish` **content**-language toggles are a separate system — adding a
UI language does NOT add a printed/projected content language.)

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
- **Merge** — keep current data, add the file's (matching keys overwritten via `Object.assign`).
- **Replace** — clear current data first, then load only the file's.

### Pattern: per-file `IVRIT_CFG` + shared engine

Each file defines a small **`IVRIT_CFG`** object, then pastes the **shared engine** verbatim (the block between the `═══ IvritSuite .ivrit save-file engine ═══` comment markers — it is byte-for-byte identical across the three tool pages (generator, flash cards, dashboard; re-verified 2026-07-24 — the S39 `showAppToast` interleave that had broken this was extracted into its own shared block in **S59**, re-unifying the engine); copy it, don't rewrite it. The restore-success path calls the shared **`showAppToast`** (non-blocking toast), not a blocking `alert()`. **Exception:** `index.html` carries a deliberately adapted AllTools superset of the engine — extra `wlMergeIntoStorage`, a legacy-blob payload shape, and a "reload open tool pages" success `alert()` (kept as a blocking, actionable instruction; index has no `showAppToast`) — do not "fix" it back to the shared text).

**Shared `app-toast` block (S59).** `showAppToast(msg, ms = 2600)` + `let _appToastTimer` live in a byte-identical `/* ═══ shared: app-toast ═══ … ═══ end shared: app-toast ═══ */` JS block placed immediately **before** the `.ivrit` engine block, with a matching `/* ═══ shared: app-toast CSS ═══ … */` block (the `#appToast` rules + a self-contained `@media (prefers-reduced-motion)` neutralizer) in each `<style>`. Both blocks are identical across `hebrew_blend_generator.html`, `classroom_dashboard.html`, `flash_cards.html`, and — since S155 — `hebrew_dictionary.html` (sha-verified 2026-07-24: JS `fcf5e4c4`, CSS `b8210cc4`) — copy verbatim, like `ivritsuite-fonts` / folder-tree. The dictionary has **no `.ivrit` engine** (AllTools-only backup), so its copy sits immediately before the shared `ivritsuite-fonts` block instead — the placement rule is "before the page's first shared block", and the marker comment's carrier list must be re-trued in **all** carriers whenever one is added, so the blocks stay byte-identical. `index.html` does **not** carry it. Torah Trainer's `showHintToast` and the Trope Tutor's `showToast` are separate sibling toasts with distinct ids/selectors — not part of this block.

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

The shared `.ivrit-*` CSS block (with `var(..., fallback)` colors so it works on any page) + the toggle + `#ivritAuto` (Save button, `#ivritDrop`, `#ivritFileInput`, `#ivritStatus` — which carries `role="status"` so save/restore feedback is announced to screen readers) + `#ivritManual` (the legacy textarea, `display:none` by default). Copy an existing page's markup (e.g. the Generator's "Backup Presets" sub-panel).

Unlike the JS shared blocks, this `.ivrit-*` CSS is **convention-shared but deliberately NOT `═══`-marked byte-identical**: the *rules* are identical across the generator/dashboard/flash_cards copies, but leading indentation legitimately differs because the block sits at a different `<style>` nesting depth in each file. A Pass F consistency sweep should treat that indentation delta as expected, not drift — do not "fix" it to byte-identity (it would only mis-indent two of the three copies against their surrounding CSS). Decided S145 (2026-07-24).

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
  `overflow:hidden` panel (e.g. the dashboard settings drawer).
- Folder CRUD: New folder / New subfolder / Rename (`prompt`) / Delete (`confirm`; children move up
  — underlying items are NEVER deleted). Collapse state lives on the folder node (persists + backs up).

### Rule for any new preset-bearing list
1. Render it with `mountFolderTree(cfg)` (don't hand-roll rows; reuse the existing action functions
   in `buildItemRow`). The old `makeSortable` is superseded for foldered lists. (The dashboard no
   longer carries `makeSortable` at all — its last consumer, the schedule row builder, was replaced
   by the weekly Schedule Sync grid editor on 2026-08-06; the generator/flash-cards copies remain
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

## Dark Mode (`classroom_dashboard.html`)

### No-flash IIFE
A small inline `<script>` at the top of `<head>` adds `dark-early` to `<html>` before the page renders.
It is **OS-aware** (suite-wide as of S24): an explicit saved choice always wins, and when there is no
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

Present (verbatim; sha-verified 2026-07-24) in **9 files**: `index.html`, `Hebrew_Font_Maker.html`, the six
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
`saveUserFont`s it). The block contains ONLY that function (sha-verified identical across all 7 carriers,
2026-07-24); the thin **pick handler lives BELOW the end marker and is per-page**: the five tool pickers
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
  `Hebrew_Font_Maker.html` (the Spacing tab's sample-text field). When a page adopts
  the keyboard, re-true the carrier list in the marker comments of **all** carriers (same rule as
  the app-toast block) — and re-verify byte-identity by sha, don't eyeball it.
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
  `torah_trainer.html`, `Hebrew_Font_Maker.html`, `flash_cards.html` (2026-07-06), and `trope_tutor.html`
  (2026-07-09) — **all 7 tools**, but as **per-file engines**, not yet a single shared block. Flags are
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
  + `bindTip`), and `flash_cards.html` (2026-07-06 — its `tooltipIIFE` now carries the `bindTip` wiring
  adapted to `.has-tip` triggers + the `#tipFloat` `.show`/opacity model; its one native-`<button>`
  trigger is hover/focus-only by design). The dashboard's `wire()` gained `aria-expanded`/
  `aria-describedby` on 2026-07-06, so all tooltip carriers meet the full contract.
  `trope_tutor.html` (2026-07-09) carries a verbatim copy of the torah_trainer `bindTip` IIFE.
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
  `contact.html`, `trope_tutor.html` (**11 files**, complete; re-measured at runtime 2026-08-15).
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
- **Implemented on:** **preset-save flows only, as a first slice (2026-07-07).** The generator and flash
  cards preset panels now validate empty names inline (`#presetNameNote` + `aria-live="polite"`, and
  `aria-disabled` on `#savePresetBtn`) via a shared `_setPresetNameNote(msg)` helper per file — replacing
  the generator's blocking `alert()` and flash cards' silent input-focus. Everywhere else, blocking
  `alert()` is still the norm (≈15–21 calls each in the generator, flash cards, index, and dashboard).
  Migrate the remaining call sites toward inline validation opportunistically as you touch each panel.
- **Rule:** do not add **new** `alert()`-driven validation; wire new validation inline. Leave existing
  `confirm()` destructive-action guards in place.

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
- **Implemented on:** only `Hebrew_Font_Maker.html` carries the full treatment (global shortcut handler +
  `?` cheat sheet via `shortcutGroups()`/`openShortcuts()` + `<kbd>` hints). **No tool currently ships
  touch-gesture equivalents** (no `touchstart`/swipe handlers anywhere — Flash Cards flips on plain tap).
  Beyond that shortcut treatment, `trope_tutor.html` applies APG-standard **widget** keyboard operability
  (S51–S55): roving arrow-key nav on its `role="tablist"` plus `aria-pressed`/`role="radiogroup"` toggles —
  an application of the keyboard-operability rule below, not a documented shortcut with a `<kbd>` hint.
- **Rule:** any new shortcut is registered in the cheat sheet **and** the triggering control's `title`, and
  shown as a `<kbd>` hint; any new interactive element is reachable and operable by keyboard.

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
  `Hebrew_Font_Maker.html` (glyph tiles) (2026-07-07), `trope_tutor.html` (glyph tiles +
  example/question words, 2026-07-09).
- **Rule:** any new Hebrew-rendering surface marks its output `lang="he"` at the chokepoint.

### 9. Panel-collapse memory — a drawer that was tidied once stays tidy
A teacher who collapses the panels they don't use should not have to do it again next lesson. Every
collapsible `.panel` remembers its open/closed state across visits, via one `═══`-marked shared block
(`/* ═══ IvritSuite panel-collapse memory ═══ */ … /* ═══ end shared: panel-collapse memory ═══ */`),
byte-identical across all six carriers (sha-verified 2026-08-15: `b58130835987`) — copy it, don't
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
- **Implemented on:** all six collapse carriers — `torah_trainer.html` (the origin; shipped as the S202
  micro-feature and converged onto the shared block in 2026-08, with a read-side migration for its
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

## Hebrew Font Maker (`Hebrew_Font_Maker.html`)

The largest file in the repo by a wide margin — a single-file app that measured ~13,900 lines in
2026-07, ~15,700 on 2026-08-13 and **~18,400 on 2026-08-22**. Growth is fast and *uneven* — that
last 2,700 lines landed in nine days — so do not extrapolate from any figure here; if a count
actually matters, measure it (`wc -l Hebrew_Font_Maker.html`). **Line numbers drift
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
new bare keys), `hebrewFontMaker_tourDone`, `hebrewFontMaker_inputMode`, `hebrewFontMaker_recentProjects`,
`hebrewFontMaker_mobileWarnDismissed`, `hebrewFontMaker_autosave` (image-stripped fallback). Primary
autosave is **IndexedDB** db `hebrewFontMaker`, store `autosave` (gzip blob, id `'current'`). Shared
site-wide key it also reads: `hebrewBlender_darkMode`. **One AllTools exception:**
`hebrewFontMaker_lastAuthor` (the onboarding wizard's remembered author name — a scalar identity pref
like `hebFont`, not project data) IS registered in all five AllTools sites as `fmLastAuthor`.

### New-font onboarding wizard (`#wizardOverlay`)
Replaces the old welcome card. Boot runs one launch decision from the `I18n.ready`-gated
`maybeRestoreAutosave()`: restorable snapshot → the Continue/Start-fresh prompt (Continue never shows
the wizard); Start fresh or no snapshot → `wizardOpen('gate')` (Esc/backdrop inert — no-op `closeFn` +
no backdrop `onclick`; the header's "Open a project ▾" is the exit; loading any project closes it via
`applyProjectData`). Toolbar **New** = `wizardOpen('new')` (cancellable; Esc/backdrop/Cancel leave the
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
  removed on 2026-07-07 and all its call sites migrated to `esc()`.
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

### Starting Fonts / partner onboarding (`?start=<id>` + `starting-fonts/`)
The Open Siddur collaboration: a partner page links `Hebrew_Font_Maker.html?start=<id>`, which
opens that font pre-imported into a fresh, **license-locked** project via a 3-step partner wizard.

- **Data layer**: `starting-fonts/manifest.json` (`{"schema":1,"fonts":[...]}`) + one
  `starting-fonts/<id>/{<Font>.ttf, LICENSE.txt}` per font — vendored same-origin copies, never
  hotlinked. Every manifest value is **detected from the font's own name table / upstream license
  text, never invented** (`nameTableFamily` records a stale embedded family name). Intake goes
  through the **`/addOSFont` skill** → `scripts/add_os_font.py` (license allowlist: OFL-1.1,
  GPL+font-exception, Apache-2.0, CC0; anything else refuses with printed evidence — a hard STOP,
  maintainer decides). **Reserved Font Names are recorded for EVERY license** (Taamey Frank CLM
  declares one under GPL) and any declared RFN forces a rename at runtime. Never hand-edit the
  manifest, a staged LICENSE.txt, or `starting-fonts/LINKS.md` (the copy-paste sheet of live
  `?start=` links — regenerated from the manifest on every intake / `--regen-links`).
- **Runtime**: `init()` strips `?start` immediately (keeps `?lang`); `osStartBoot` runs inside
  `maybeRestoreAutosave` after `_launchDecided` (deferral batons untouched; the no-param tail is
  the verbatim extraction `_bootLaunchPrompt`). A restorable snapshot is arbitrated first ("Open
  {font} / Continue") — `autosaveDiscard()` only on the explicit choice; every fetch/parse failure
  lands in Retry / Continue-to-Font-Maker. `wizardOpen('osfont')` swaps in the static
  `wizStepOs1–3` sections (gate/new untouched; chrome swaps via the data-i18n attribute-swap);
  `wizardOsFinish` seeds `project.osFont` + `font.license='os-passthrough'` then calls the
  existing `applyFontImport` headlessly (`{outlines,marks,anchors:true}`).
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
  **Torah Trainer exception (S60):** its `colorizeHebrew` no longer bakes inline `style=` per
  syllable — it emits `<span class="nik nik-<key>">`, and a single **`applyNikkudColors()`** pushes
  the active palette into `--nikv-<key>`/`--nikh-<key>` body vars + a `body.nik-mode-<mode>` class
  (mirroring the trope layer's CSS-var model). So on the Torah page a color / mode / scheme / dark
  change is a **var+class swap with no reading re-render** (the heavy `renderText` tokenize+innerHTML
  is skipped — `data-twi` karaoke indices are untouched); only `showNikkud`/`showCantillation`/
  layout/on-off, which change the actual text or span presence, still call `renderText`. The other
  three tools still recolor via a re-render.
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
key-based helpers (`getNikudColor`, All/Main/None) work under either scheme. **Torah Trainer also
needs a matching `.nik-<key>{--nik-c:var(--nikv-<key>);--nik-h:var(--nikh-<key>)}` CSS line** (the
`applyNikkudColors()` loop over `VOWEL_COLOR_DEFS` sets the vars for any new key automatically, but
the CSS class→var mapping is manual).

---

## Trope Color Coding (`torah_trainer.html`)

A second, composable color dimension alongside nikkud coloring: each **word** is classed by its
cantillation **clause family**. Settings keys (in the `hebrewTorahTrainer_settings` blob, so no
AllTools wiring): `colorCodeTrope` (bool) + `tropeColorOverrides` (family → hex, validated on
every read with the **strict `TROPE_HEX6_RE`** (`#rrggbb` only, not the looser `HEX_COLOR_RE`) —
imported blobs are untrusted, AND the value takes an appended `59` alpha suffix and seeds
`<input type=color>`, both of which require the 6-digit form).

- **Taxonomy**: `TROPE_CHAR_TO_FAMILY` maps codepoints to 6 families (`sofpasuk`, `katon`,
  `segol`, `revia`, `geresh`, `rare`; ordered defs in `TROPE_COLOR_DEFS` — the single source of
  truth: `TROPE_FAMILIES` and the legend chips are derived from it). Sof pasuk is
  **positional** — the last Hebrew token of each verse (tokenizeHebrew is one-verse-per-call);
  U+05BD is never mapped (Unicode unifies siluk with meteg). Zarqa/zinor U+0598 **and** U+05AE
  both map to `segol` (Unicode names are swapped in the wild). U+05AB/AC/AD (poetic accents)
  deliberately unmapped. Multi-family word → **last** mark wins (`tropeFamilyOf`). The chart is
  a **deliberate per-mark pedagogical approximation**: conjunctives (munach, mercha, kadma,
  darga) serve several clause types in real leining (munach often serves zakef katon/revia), so
  a munach word can show a different family than its disjunctive — known and accepted;
  context-aware clause propagation is a possible future refinement.
- **Detection reads the ORIGINAL verse text** (parallel split zipped by index) so trope coloring
  works with cantillation hidden. `stripNikkud`'s range swallows maqaf/paseq, so the zip is
  guarded by an array-length equality check; on mismatch `tropeRealignFamilies` recovers each
  display word's family by letter-matching (letters are never stripped), bailing to uncolored on
  any desync — no color, never wrong color. The splitter and `data-twi` sequencing are
  untouched — karaoke timing alignment depends on them.
- **Presentation is class-based, never inline styles**: `trope-<fam>` classes on `.tt-word` +
  `--trope-<fam>-bg`/`-line` CSS vars set on `<body>` by `applyTropeColors()` (the chokepoint,
  called at the top of `renderText()`). All trope selectors are **`:where()`-wrapped** at
  (0,1,0) specificity so `.tt-word:hover` and karaoke `.active` always win — keep it that way.
- **Collision rule (automatic, no setting)**: nikkud coloring on **and** `colorCodingMode ===
  'highlight'` (and nikkud shown) → `body.trope-underline-fallback` switches words from
  background tint to a thick `text-decoration` clause underline (offset below the nikkud).
- **Legend** `#ttTropeLegend` sits above `#ttReading` (renderText never touches it); chips are
  generated once at init from `TROPE_COLOR_DEFS`, and swatches read the body vars so
  theme/picker changes recolor them for free. It shows only when trope coloring is on **and** a
  reading is loaded (hidden over the empty state). The "Learn the trope names →" link renders
  only when `const TROPE_TUTOR_URL` is non-null — set to `'trope_tutor.html'` since the Trope
  Tutor shipped (see its section below). On paper the color→family key travels via the **print
  band** (S207, superseding the S90 in-flow legend print): `#ttPrintBand`, a print-only running
  identifier (range label + compact clause key) populated by `buildPrintBand()` in the
  beforeprint handler and re-stamped on **every** printed sheet via `position:fixed` inside the
  print block's enlarged `@page` top margin — sheets 2..N used to be unidentified/un-decodable,
  and the old card's 35%-tint (`--trope-<fam>-bg`) swatches collapsed into one grey band on a
  greyscale copier, so the band's swatches use the SOLID `--trope-<fam>-line` ink the printed
  underlines use. The in-flow legend card and `.tt-ref-hdr` are print-hidden (the band replaces
  them on paper); on-screen legend behavior is unchanged. The band never prints spuriously —
  beforeprint hides it when no reading is loaded, and its chips render only with trope coloring
  on. Do not "restore" the printed key to sheet-1-only.

---

## Trope Tutor (`trope_tutor.html`)

A standalone Learn + Drill page for the cantillation marks. **Zero runtime Sefaria dependency** —
it consumes only the pre-built static index plus PocketTorah MP3 streams. Its CSP therefore has
**no `sefaria.org`** (and no `esm.sh`); if a change seems to need either, the design has drifted —
stop and reconsider. Shell (dark mode, settings drawer, tooltips, tour, toast, My Fonts) is copied
from `torah_trainer.html`.

- **Index**: `data/trope/trope_index.json` — `{v:1, system:"torah", built, tropes:{<key>:[{p,a,w,ref,he,s,e}]}}`
  where `p` = parsha pocket key, `a` = aliyah "1"–"7", `w` = 0-based sung-word index (= timings
  index), `s`/`e` = clip bounds in seconds (**`0` is valid — never `||`-default these**). Built
  offline by **`node scripts/build-trope-index.mjs`** (plain Node, zero deps; `--source=export`
  default = Sefaria's public GCS text export, `--source=api` mirrors the live v3 endpoint; HTTP
  cache in gitignored `source-data/trope-cache/`). The builder excludes any aliyah whose word count
  doesn't match its PocketTorah timings — never a shifted clip. Timings semantics (audio-audited
  2026-07-22, mirrored in torah_trainer's `loadKaraoke`): a leading `0.0` is word 0's *nominal
  onset*, NEVER a droppable lead-in sentinel; in the two files with one extra timing (Shemot-1,
  Bamidbar-3) the extra value is a TRAILING end-of-last-word marker, dropped before the count
  check. (The old leading-drop rule shifted those two aliyot one word late.) The builder also
  fails loudly on its Genesis 1:1 smoke test. It rewrites `docs/trope_index_report.md`; re-run it,
  commit both files together, AND bump the `?v=` on the page's index fetch (the sw.js `DATA_CACHE`
  matches exact URLs — the `?v=` bump is what refreshes returning users) whenever the taxonomy or
  selection rules change.
- **`TROPES` taxonomy** — one `═══`-marked table (26 entries — zarka is a single entry carrying
  both codepoints: key, chars, display, Ashkenazi +
  Sephardi names, family, rare flag) kept **byte-identical** between `scripts/build-trope-index.mjs`
  and `trope_tutor.html` (same convention as the `.ivrit` engine; copy, don't rewrite). Family
  assignment mirrors torah_trainer's `TROPE_CHAR_TO_FAMILY`; family hues mirror
  `TROPE_DEFAULTS_LIGHT/_DARK` — keep both pages' color language in sync. `sof_pasuk` has no chars
  (positional; siluk = meteg U+05BD, never mapped); `zarka` matches BOTH U+0598 and U+05AE
  (Unicode's swapped names) and displays corpus-dominant U+05AE; `geresh_muqdam` has zero corpus
  occurrences (the Learn card handles example-less tropes).
- **Audio clip engine**: ONE `<audio id="tuAudio">`; `playClip({p,a,w,ref,he,s,e})` resolves the MP3
  via `manifest[p].audioBase` (URL = `POCKET_AUDIO_BASE + encodeURIComponent(audioBase + '-' + a + '.mp3')`),
  swaps `src` only when the aliyah file changes, seeks after `loadedmetadata`, and stops at `e` via
  an rAF watcher + `timeupdate` fallback (the `_verseEndStopAt` pattern; iOS timeupdate is ~4 Hz).
  `playbackRate` is re-asserted in the `play` handler (iOS resets it). Failures add the file to
  `_badFiles` and call `onError` — drills **never dead-end**: substitute example → regenerate
  question (different trope) → skip, with a toast at each step.
- **Rendering is DOM-built** (`createElement`/`textContent`) for all index-derived Hebrew —
  `renderMarkedWord` clusters base letters + combining marks (U+0591–U+05C7) and wraps the hit
  cluster in `.mark-hit`; index strings never pass through `innerHTML`. Glyph tiles render marks on
  the `GLYPH_CARRIER` (`'◌'` dotted circle — one constant; flip to `'א'` if a font floats marks).
  Postpositive/prepositive marks sitting at word edges is **correct**, not a bug.
- **Persistence** (no presets, no `.ivrit` engine — AllTools-only backup):
  `hebrewTropeTutor_settings` (tradition ashk/seph, hebFont, hebFontSize, drill-type toggles,
  playbackRate) and `hebrewTropeTutor_progress` (`{v:1, tropes:{key:{r,w}}, families:{}, pbStreak}`).
  Registered in all five AllTools sites in `index.html`; progress imports go through
  `tropeProgressMerge` (r/w/pbStreak = max, families = union). `hebrewTropeTutor_tourSeen` is the
  export-exempt, erase-cleared tour flag.
- **Drill**: 10 questions/session; three types (Identify / Hear / Melody) toggleable in settings
  (last one refuses to uncheck **inline**, no alert). Answers sampled weighted by
  `0.35 + (1 − mastery)` (rare ×0.5, no adjacent repeats); questions stable-sorted by clip file key
  to minimize MP3 hops; distractors sampled without replacement, weighted toward same-family ∪
  `CONFUSABLE_PAIRS` (pashta↔kadma etc.) as the answer's mastery rises. Melody choices are two-tap:
  first tap plays, second tap answers.

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
    t.addEventListener('click', () => { t.parentElement.classList.toggle('collapsed'); panelMemSave(); });
  });
}
```
Called once at `DOMContentLoaded`. Toggling `.collapsed` on the `.panel` element hides `.panel-body` and
swaps the `::after` arrow via CSS. The `panelMemSave()` call — and the `panelMemApply()` that must follow
`initPanelCollapse()` at init — are the shared panel-collapse memory; see
[Shared UX components → Panel-collapse memory](#shared-ux-components--the-conventions-all-tools-are-converging-on).

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

## Worksheet Chunked Build (`hebrew_blend_generator.html`)

Large Class-Set standard-blend builds (> ~600 cells) are **chunked**: `renderWorksheet` builds
version 0 synchronously, then streams the remaining versions in `setTimeout(0)` chunks
(`_wsBuildQueue`/`_wsBuildToken`/`_wsBuildTimer`/`_wsBuildAnchor`, defined just above
`renderWorksheet`). Small/single-version worksheets remain fully synchronous. Contract rules:

- **Reading `#worksheet` right after triggering a render?** Call **`flushWorksheetBuild()`** first —
  it synchronously finishes any in-flight build. Already wired: the `beforeprint` listener (covers
  both print buttons + Ctrl+P), `exportPDF`, and `liveGenerate`'s rollback snapshot.
- **Writing `#worksheet.innerHTML` outside `renderWorksheet`?** The connectivity sentinel
  (`_wsBuildAnchor`) makes pending chunks self-cancel when a foreign render replaces the worksheet —
  but a new writer *should* still call **`cancelWorksheetBuild()`** explicitly (belt-and-braces;
  `renderWorksheet` itself cancels at the top).
- The queued thunks read live control state (QR toggle, title, header language, dagesh toggle) at
  **execution** time; every such control currently re-renders via `renderWorksheet` on change (which
  cancels the build). Keep that invariant for any new control those builders read.
- Headless verification must **poll** for the final `.sheet` count (or `_wsBuildQueue.length === 0`)
  after a large-class-set Generate — never count synchronously.

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
   `apple-touch-startup-image` block in **all 13 HTML pages** (every root `*.html`: 404,
   Hebrew_Font_Maker, classroom_dashboard, contact, flash_cards, hebrew_blend_generator,
   hebrew_dictionary, index, privacy, resources, terms, torah_trainer, trope_tutor) from
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
- **Serve the repo root over local HTTP and load the page as `http://localhost:<port>/<page>.html` —
  NOT `file://`.** Every page loads `/js/i18n.js` **root-absolute**, so under `file://` it resolves to
  the filesystem root, `window.I18n` stays undefined, and i18n-dependent render paths throw (the
  Font-Maker render pipeline especially — documented at S85); `fetch('data/…')` corpora also need a
  web root. Any preinstalled static server works — `http-server -p 8080 -c-1`, `serve -l 8080`, or
  `python3 -m http.server 8080` — run from the repo root (background it). Still **route-abort every
  external origin** (Google Fonts, gtag, the CDNs) or `page.goto` hangs on them; keep your localhost
  origin alongside `data:`/`blob:`:
  ```js
  const BASE = 'http://localhost:8080';
  await page.route('**/*', r => { const u = r.request().url();  // register BEFORE goto
    (u.startsWith(BASE)||u.startsWith('data:')||u.startsWith('blob:')) ? r.continue() : r.abort(); });
  await page.goto(BASE + '/<page>.html', { waitUntil: 'domcontentloaded' });
  ```
  The aborted resources produce console "Failed to load" errors — expected noise. Assert on the
  `pageerror` event count (should be 0) instead of console errors. A bare `file://` load still works
  for a page with no i18n/`data/` dependency, but local HTTP is the reliable default the recent
  discovery passes standardized on.
- **Testing a failure/offline path? Open the context with `serviceWorkers: 'block'`.** `sw.js` calls
  `skipWaiting()` + `clients.claim()`, so the worker activates on the first load and then serves
  `/data/` out of the version-independent `DATA_CACHE` — and **service-worker requests bypass
  `page.route` entirely**. Without the block, a route that aborts `/data/` silently stops blocking
  once the worker is live: the fetch succeeds, no failure path runs, and the test reports whatever
  the happy path rendered. That cost S165 a fabricated "Flash Cards is silent on failure" finding
  (its real message, `flashcards.words.load_failed`, shows correctly once the worker is blocked).
  ```js
  const ctx = await browser.newContext({ serviceWorkers: 'block' });   // required for offline tests
  ```
- Dismiss auto-open modals before testing:
  `document.querySelectorAll('.overlay.open').forEach(o => o.classList.remove('open'))`.
  (On the Font Maker, a clean profile now auto-opens the `#wizardOverlay` onboarding gate after
  `I18n.ready` resolves — the same sweep clears it, but wait for it to appear first if your test
  needs the post-boot state.)
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
  **It refuses to run on a shallow clone** (exit 1, nothing written): `git log -1` returns the
  shallow boundary commit for any file not touched inside the window, so on a `--depth 1` clone
  every `<lastmod>` collapses to one inflated date while the script reports success. Run
  `git fetch --unshallow` first — and treat the same caution as standing for **any** date-based
  receipt from `git log`/`git diff` in this container.
- **`llms.txt` + `llms-full.txt` are GENERATED — regenerate them, never hand-edit them.**
  `node scripts/update-llms-txt.mjs` (plain Node, no deps) rewrites both: the curated plain-text site
  map for LLMs and fetching agents ([llmstxt.org](https://llmstxt.org)). `llms.txt` is the **short
  index** (one line per tool — what an agent reads to orient); `llms-full.txt` is the **expanded**
  companion (each tool's fuller description + `HowTo` steps + `FAQPage` Q&A — what an agent reads to
  answer "does it work offline?" without parsing 15,000-line HTML). Nothing in either is authored
  twice: the tool list — names, URLs, order, one-line descriptions — comes from **`index.html`'s
  JSON-LD `ItemList`**, the page set and its order from **`sitemap.xml`**, and the per-tool prose,
  steps and questions from **each page's own JSON-LD** (`WebApplication`/`CollectionPage`
  description, `HowTo.step`, `FAQPage.mainEntity`), falling back to `<title>` /
  `<meta name="description">`. Note the **deliberate inversion**: `llms.txt` prefers the curated
  `ItemList` blurb (short), `llms-full.txt` prefers the page's own self-description (rich) — that's
  why Torah Trainer reads differently in the two files. The **only** hand-maintained prose is the
  `SITE_INTRO` constant at the top of the script — edit it there. Extractors read the **`<head>`
  slice only**, because the Font Maker's inline JS contains `<title>${title}</title>` template
  literals that a whole-file regex mis-reads as the document title. Idempotent; `--check` exits 1 if
  **either** file is stale and writes nothing; a `<loc>` with no file on disk warns and is skipped;
  an empty sitemap or a missing `ItemList` is a hard stop rather than a silently-empty map. Run it
  whenever a page's title/description/JSON-LD changes or a page is added or removed. Neither file is
  precached (no `sw.js VERSION` bump needed), and neither is a `sitemap.xml` entry — sitemaps list
  indexable HTML pages. A run reports its own coverage (tools / steps / questions, and any tool with
  no `FAQPage`), so a page whose JSON-LD regressed shows up in the console.
  **Set expectations honestly:** no major AI provider consumes `llms.txt` in production, and Google
  Search explicitly ignores it (June 2026 docs; Illyes/Mueller confirmed no support and no plans).
  It is a cheap forward hedge plus a readable inventory for an agent pointed at the site — **not** an
  SEO mechanism, and not a reason to deprioritize the `sitemap.xml` + per-page JSON-LD that search
  engines actually read (and that this script reads *from*).
