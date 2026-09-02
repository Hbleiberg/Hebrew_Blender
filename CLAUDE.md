# Hebrew Blender — Claude Instructions

Every rule here is binding. How each existing system *works* lives in `docs/reference/` (see the
index below) — read the file for the area you are touching before you touch it.

## Git
- Always commit and push directly to `main`
- Do not create feature branches

## Where things go (keeps this file small)
- **A binding rule** → one sentence here, with its "why" in one clause.
- **How a component works** (contracts, markup, carrier lists, "implemented on" censuses) → the
  matching `docs/reference/<topic>.md`.
- **History, session ids, dates, digests, line numbers** → the improvement loop's files only
  (`docs/IMPROVEMENT_LOG.md` for current state, `docs/IMPROVEMENT_ARCHIVE.md` for history,
  `docs/reference/loop-findings.md` for measurements and refutations). Never in this file or in
  the other `docs/reference/` files.
- Reference docs are plain pointers, never `@`-imports (an import is inlined into every session).

## Reference index — read before touching
| Touching… | Read first |
|---|---|
| localStorage keys, AllTools export/import/erase, `.ivrit` files, presets, folder trees | `docs/reference/storage-and-backup.md` |
| Any UI string, CSV/locale build, `check-i18n` details, adding a language | `docs/reference/i18n.md` |
| A `═══`-marked shared block (fonts store, keyboard, test phrases, resize, toast, panel memory), tours, tooltips, share links, reduced motion, `<kbd>` hints | `docs/reference/shared-components.md` |
| `Hebrew_Font_Maker.html` (undo/autosave, modals, fidelity, Starting Fonts) | `docs/reference/font-maker.md` |
| `classroom_dashboard.html` (dark mode, font picker, nikkud colors, drawer, tooltips) | `docs/reference/dashboard.md` |
| `hebrew_blend_generator.html` selectors or worksheet build | `docs/reference/generator.md` |
| `torah_trainer.html` / `trope_tutor.html`, vowel color schemes, trope coloring | `docs/reference/torah-and-trope.md` |
| `sw.js`, `splash/`, deploy, sitemap/`llms.txt`, the Playwright recipe | `docs/reference/ops.md` |
| The improvement loop (`/improveloop`), its ledger, its size rules | `.claude/skills/improveloop/SKILL.md`, `scripts/ledger-rules.mjs` |

## Definition of done — check EVERY item before finishing a change
- [ ] Edited a precached file (any root HTML page, `pwa.js`, an icon, the manifest)? → **bump `VERSION` in `sw.js`**. The most-missed step — the live site serves stale copies until it's done.
- [ ] Shipped a Font Maker feature? → bump `FONT_MAKER_VERSION` + prepend one changelog `<li>` in the About tab (one combined entry per release).
- [ ] Added an external script/font/fetch/wasm/iframe? → update that page's **CSP meta tag** (Security rule 3).
- [ ] Edited a file under `data/`? → **bump that corpus's `?v=N` on every page that fetches it** (same value everywhere) — the `/data/` cache is cache-first and exact-URL-keyed, so without a bump the edit reaches nobody.
- [ ] New UI control in a preset-bearing tool? → wire `getSettings()`/`applySettings()` (+ AllTools export/import/erase keys if it's a new localStorage store).
- [ ] Added a collapsible `.panel`, or new code that writes `.collapsed`? → give the title a `data-i18n` key and call `panelMemSave()` from that writer.
- [ ] Added/changed a user-facing string or new CSS? → `I18n.t()`/`data-i18n*` + a key in `locales/ui-strings.csv`, then `node scripts/build-locales.js`; logical CSS props; run **`node scripts/check-i18n.js`** (no NEW violations).
- [ ] Edited any inline `<script>` in a root HTML page? → run **`node --experimental-vm-modules scripts/check-inline-js.mjs`**. One syntax error kills that page's whole JS while the HTML still renders. **Never put a raw `` ` ``, `${`, or `</script>` inside HTML authored in a template literal** — use `&#96;`, `&#36;{`, `<\/script>`.
- [ ] Verified headless with the Playwright recipe (below): light + dark, desktop + ~800px.
- [ ] Added or meaningfully changed a page's content? → `node scripts/update-sitemap.mjs` last (needs an unshallowed clone).
- [ ] Changed a page's `<title>`, meta description or JSON-LD, or added/removed a page? → `node scripts/update-llms-txt.mjs`. **Never hand-edit `llms.txt`/`llms-full.txt`.**
- [ ] Changed a binding rule or how a component works? → one sentence here, or the `docs/reference/` file — never session ids, dates, digests or line numbers in either.
- [ ] Committed + pushed to `main`, and the **Pages deploy run concluded `success`** (code on `main` is not yet the live site).

## Security — REQUIRED patterns
The sharing surface (`.ivrit` files, share codes, `?s=` params, the AllTools blob) carries untrusted data between teachers.
1. **Never bare-`JSON.parse` untrusted or import-target data.** Any JSON from a file, share code, URL param, or a localStorage key that an import writes goes through `ivritSafeParse(str)` (drops `__proto__`/`constructor`/`prototype` at every depth). Import-side merges use `ivritSafeAssign(target, src)`, never bare `Object.assign`. Trusted and exempt: `JSON.parse(JSON.stringify(...))` clones, Pyodide/HarfBuzz return values, `res.json()` on same-origin `data/*.json`.
2. **Any user- or network-supplied string in HTML passes through `esc()`** (escapes all five of `& < > " '`) or is assigned via `textContent`/`createElement`. Sources: user inputs, localStorage/`.ivrit`/share codes, remote APIs (Hebcal, Sefaria, Open-Meteo/Nominatim, PocketTorah, web3forms). For an inline event handler or a `javascript:`-capable attribute `esc()` is not enough — rebuild with `addEventListener`.
3. **Adding a loaded resource** (`<script src>`, stylesheet, `@font-face url()`, `fetch`/`import()`, `new Worker`, `<iframe>`, `<img>`/`<audio>` src, `.wasm`) **requires adding its origin to that page's CSP meta tag** (right after `<meta charset>`). Per-page allowlist: `docs/reference/ops.md`.

## Internationalization (i18n / RTL)
The suite ships a full Hebrew UI; `js/i18n.js` (`window.I18n`) is on every page and `locales/ui-strings.csv` is the single source of truth. Full pipeline detail: `docs/reference/i18n.md`.
1. **Never hardcode a user-facing UI string.** Static HTML → `data-i18n` / `-title` / `-aria-label` / `-placeholder` / `-tip` / `-html`. Dynamic JS (incl. `alert`/`confirm`/`prompt`, `.textContent`, labels, `setAttribute`) → `I18n.t('key', {params})`. Never concatenate English fragments — one key per sentence with `{placeholder}`s. A raw `page.feature.x` on screen means a missing key.
2. **CSV workflow:** add the row to `locales/ui-strings.csv` (`key,en,he,context,notes`; `en` is the fallback), then `node scripts/build-locales.js` (compiles committed `locales/<lang>.json`). Inner quotes in a quoted cell are doubled (`""`) — an undoubled one is silently deleted from the build. Plurals split `.one`/`.other`.
3. **Key naming:** `page.feature.element`, lowercase dot-separated; cross-tool chrome under `shared.*`; glyph names under `*.glyphname.*`.
4. **Translate UI chrome only.** Never translate — mark with an inline `i18n-ignore` comment: printed worksheet/answer-key/flash-card output (follows `headerLang`); dashboard projected content (`headerLang`/`dowLang`/`showOmerEnglish`, independent of `I18n.lang`); `<title>`/meta descriptions (SEO); Hebrew instructional content, transliteration, Sefaria/PocketTorah text, trope pronunciation names, brand credits, third-party directory data.
5. **Logical CSS only:** `margin/padding/inset/border-inline-*`, `text-align: start/end`. Hebrew-content containers get `dir="rtl" lang="he"` at the render chokepoint. Exceptions that must NOT mirror: the Font Maker glyph stage and the keyboard's physical qwerty rows (pinned `direction:ltr`).
6. **`applyI18n()` wiring:** every page defines `applyI18n()` = `I18n.applyStaticI18n()` + a re-render of its JS-built content, wired **inside** `DOMContentLoaded`: `if (window.I18n) { I18n.ready.then(applyI18n); I18n.onChange(applyI18n); }` (`window.I18n` is undefined at parse time). `applyI18n` is read-only — never touches undo/dirty/project state or in-flight audio/animation.
7. **Gate:** `node scripts/check-i18n.js` before finishing. Check A (hardcoded literals), C (executable JS or `{placeholder}` in a `data-i18n-html` cell) and D (CSV quoting) are blocking. Accept an intentional literal with `i18n-ignore`, not the baseline. A green gate is not proof of zero untranslated strings (template-literal and `setAttribute`-ternary shapes escape it).

## Storage & backup
Naming: `hebrew<ToolCamelCase>_<dataType>` (`hebrewDashboard_settings`). Key table, `.ivrit` format, engine API, folder-tree model: `docs/reference/storage-and-backup.md`.
- **Every localStorage key a tool writes is either registered in all three `index.html` AllTools functions (`exportAllSettings`, `importAllSettings`, `eraseAllSettings`) and the AllTools `IVRIT_CFG.gather/apply`, or consciously exempt.** Real cross-machine data (settings, presets, profiles, folder trees, last-session state, display prefs) → register. One-time "don't show again" flags (`*_tourSeen`, `*_setupSeen`, `*_mobileWarnDismissed`…), per-device prefs (zoom, `hebrew<Tool>_<thing>W` widths), and caches → erase-only. A data key missing from export/import is a bug.
- Import merges via `ivritSafeAssign` (object blobs), max/union merges for progress/streaks, and **`ftImportTree(key, incoming, replace)` for folder trees — never `Object.assign` a tree** (it clobbers `root`). Leave `eraseAllSettings`' orphan-key cleanup (`ivritsuite-impact-*`) in place.
- **Every tool with presets/settings ships `.ivrit` save files:** the Automatic/Manual toggle, a per-file `IVRIT_CFG { tool, gather(), apply(data, mode) }`, the shared engine block pasted verbatim, and the standard markup. Restore always asks **Merge vs Replace**. `tool` inside the file is the identity, not the filename. `index.html` carries a deliberately adapted AllTools superset of the engine — don't "fix" it back.
- **`getSettings()`/`applySettings()` must cover every control** (generator, flash cards, dashboard); tools with a single settings object add every control to that object's save/restore. `liveState = getSettings()` is what makes presets and `.ivrit` files complete. **Restore numeric/boolean fields with `??`, never `||`** (a stored `0`/`false` must survive).
- **Preset lists render with `mountFolderTree(cfg)`** (the flat store stays the source of truth; folders are a sidecar tree in `hebrew<Tool>_<thing>Folders`), each item has a Duplicate button via `ftDuplicateName` + `ftInsertAfter`, and the folder key is registered at all AllTools sites and in the tool's own `IVRIT_CFG`.

## Shared blocks — copy verbatim, never rewrite
Cross-page code ships as `/* ═══ … ═══ */`-marked blocks that are **byte-identical across their carriers**: the `.ivrit` engine, `app-toast` (JS + CSS), `ivritsuite-fonts` store, My Fonts uploader, folder-tree component, `hebrew-keyboard` (JS + CSS), `test-phrases` (JS + CSS), `sidebar-resize` (JS + CSS), `panel-collapse memory`, and the Trope Tutor/index-builder `TROPES` table. Rules:
- Paste the block; put per-page wiring **below** the end marker (the cfg object, pick handler, mount call).
- When a page adopts a block, re-true the carrier list in the marker comments of **all** carriers, anchoring on a multi-line match (the keyboard and test-phrases headers share a sentence), then **sha-verify** identity across carriers — don't eyeball it.
- The `.ivrit-*` CSS is convention-shared but deliberately not byte-identical (indentation differs per page) — don't "fix" it.
- Carriers, host contracts and adoption recipes: `docs/reference/shared-components.md`.

## Shared UX rules (every tool, every new feature)
1. **Tours never auto-launch**; entry is a "❓ Tour" button with a one-time pulse gated by `hebrew<Tool>_tourSeen`; a tour is a read-only overlay. When you next touch a tour engine, extract it into a shared block.
2. **No hover-only tooltips.** Tap/click and Enter/Space toggle; Escape/outside/blur close; `tabindex="0"`, `role="button"`, `aria-expanded`, `aria-describedby`. New `data-tip`s inherit the page's handler.
3. **Shareable state uses `?s=`** (a diff against pristine defaults, silent on garbage, never navigates, never clobbers saved presets). Button label is 🔗-prefixed. The generator/dictionary mirror into the address bar; torah/flash cards don't — leave that as is.
4. **Every animation is neutralized in the page's `@media (prefers-reduced-motion: reduce)` block** (prefer the universal `0.001ms` neutralizer — never `0`, `animationend` must still fire). Verify by measuring under `reducedMotion:'reduce'` with a `reduce`-off control.
5. **Validation is inline** (`aria-live` note + `aria-disabled` on the primary action), never a new `alert()`. Keep existing `confirm()` guards on destructive actions.
6. **First-run affordances are gated by their own `hebrew<Tool>_<flag>`**, shown once; never a modal wall. (Exception: the Font Maker onboarding wizard is a launcher, ungated by design.)
7. **Every shortcut gets a `<kbd>` hint** (`@media (pointer:fine)`), is named in the control's `title`, and carries `aria-keyshortcuts` when its badge is `aria-hidden`. Every interactive element is keyboard-operable. Arrow-cap mirroring differs on purpose between flash cards (visual) and Torah Trainer (Hebrew) — don't converge.
8. **Hebrew output carries `lang="he"`** at the rendering chokepoint (colorizer return, builder template) — never inside an attribute value, never on majority-English containers.
9. **Collapsible panels remember state** via the shared panel-collapse block: `PANEL_MEM_CFG`, `panelMemApply()` right after `initPanelCollapse()`, `panelMemSave()` from every writer of `.collapsed`. Panels are keyed by the title's `data-i18n` key.
10. **Test-phrase chips go only on font pages, only when asked.**
11. **A new fixed-width sidebar, settings drawer or layout rail ships drag-resize via the shared `sidebar-resize` blocks** (never a hand-rolled resizer); its width key `hebrew<Tool>_<thing>W` is per-device and erase-only.

## Tool-specific contracts
- **Generator:** reading `#worksheet` right after a render? Call `flushWorksheetBuild()` first (large class sets build in chunks); a foreign writer of `#worksheet.innerHTML` calls `cancelWorksheetBuild()`.
- **Dashboard:** all Hebrew rendering goes through `hebDisplay(s)`; after a dark toggle re-render nikkud-colored content (`getNikudColor` reads the body class at call time).

## Hebrew fonts
- Every Hebrew font picker pastes the `ivritsuite-fonts` block, shows a **"My Fonts"** group from `refreshMyFonts()` at init (IndexedDB is shared across the origin, so no per-tool key), and adds the My Fonts uploader block + "⬆ Upload your own font?" control below the grid. User fonts ride the AllTools export as `userFonts` with no extra wiring.
- The page must load `'Frank Ruhl Libre'` (default font; keyboard keys render in it deliberately).

## Color coding (nikkud / trope)
- Two vowel schemes (`vowelColorScheme: 'default' | 'talam'`) on the dashboard, generator, flash cards and Torah Trainer. **A new vowel key or color control goes into both schemes:** both default maps, both ordered picker-def arrays, both group arrays (generator + flash cards), then `getSettings()`/`applySettings()`; Torah Trainer also needs its `.nik-<key>` CSS var line. Keys stay identical across schemes.
- `resetNikudColors()` must `confirm()` first (overrides are shared across schemes).
- Dark mode: `--white` is a dark surface in dark mode — use literal `#fff` for text on navy; the no-flash IIFE and the on-load init use the same OS-aware condition; every dark toggle syncs `aria-pressed`.
- Trope coloring is class-based (`trope-<fam>` + body CSS vars, `:where()`-wrapped), reads the original verse text, and bails to uncolored on any desync — no color, never wrong color. Details: `docs/reference/torah-and-trope.md`.

## Hebrew Font Maker — contract
Full internals: `docs/reference/font-maker.md`. Locate everything by pattern — line numbers drift constantly.
- **Never mutate `project` directly.** Every mutation goes through `udDo(scopes, label, fn)`; slider drags use `udBurstBegin`/`udBurstCommit`, arrow nudges `udNudgeTick`/`udNudgeCommit`. That covers undo + dirty + autosave in one. Pure-UI state calls `markDirty()`; read-only features (tour, QA grid, shortcuts) touch none of it.
- **Never hand-roll UI primitives:** modals via `aOpenModal`/`aCloseModal`, confirmations via `askModal`, toasts via `status()`, long waits via `ipArm()` (every exit path closes it), escaping via `esc()`. Global shortcuts start with `udShortcutBlocked()` and are registered in `shortcutGroups()` + the button's `title`.
- **Release = bump `FONT_MAKER_VERSION` + one combined changelog entry** (`HELP_CONTENT.about` and the `fontmaker.changelog.*` CSV/`CUR_KEY` pair).
- Project data is deliberately **not** in AllTools (only `hebrewFontMaker_lastAuthor` is); new persistent UI prefs go in `hebrewFontMaker_uiPrefs` via `wsReadPrefs()`, not new bare keys.
- Mark anchors: `markAttachOrigin(m)` is the only reader of `m.attachAnchor`; `baseAnchorPosFor(l, key, cp)` the only reader of `l.markAnchors`; never pin the center class; **every anchor coordinate is rounded at the source** (a fractional value makes feaLib reject the whole file). Synthetic bases carry pins the way they carry anchors (`dropKeyPins`/`mapPinsX`).
- Starting Fonts (`?start=<id>`): intake only through the `/addOSFont` skill; never hand-edit `starting-fonts/manifest.json`, a staged `LICENSE.txt`, or `LINKS.md`; `project.osFont` presence = license-locked, and partner exports never phrase the IvritSuite line as required.
- The Trope Tutor's CSP has no `sefaria.org` and no `esm.sh` — if a change seems to need either, the design has drifted.

## Service worker & data cache (`sw.js`)
- Precached app shell lives in `ivritsuite-v<VERSION>`; pages and `pwa.js` are network-first, static media cache-first. **Bump `VERSION` after editing any precached file.**
- `/data/` corpora live in the version-independent `ivritsuite-data-v1`, cache-first and **exact-URL-keyed**: every `/data/` fetch carries `?v=N`, an edit bumps it, and pages sharing a corpus use the same value (mismatches evict each other). `starting-fonts/manifest.json` is network-first, so a font intake needs no bump.
- The user-facing app version is `VERSION` in `splash/gen_splash.py`; a version bump edits only that constant — regenerate the splash PNGs only when explicitly asked.
- The Trope Tutor's index/motifs builders rewrite `data/trope/*.json` + their `docs/*_report.md` together — commit both and bump that fetch's `?v=`. `build-trope-motifs.mjs --force` discards human-verified motifs; prefer `--only=<key>`.

## Deploy (GitHub Pages, no build step)
- A push to `main` triggers the "pages build and deployment" run; **that run's `success` is the deploy**, and rapid pushes cancel in-flight runs — batch, then confirm the last run. A hung/failed deploy is re-triggered with an empty commit.
- Pages stay at repo root (every tool fetches `data/…` relatively); never move a page into a subfolder.
- "Can't see the change" order: bytes on `main` → latest Pages run → `sw.js` VERSION bumped? → hard refresh / reopen the PWA.
- `scripts/update-sitemap.mjs` and `scripts/update-llms-txt.mjs` are idempotent generators; the sitemap one refuses a shallow clone (`git fetch --unshallow` first). Details: `docs/reference/ops.md`.

## Verifying changes — headless Playwright
Full recipe and quirks: `docs/reference/ops.md`. The essentials:
- `import pkg from '/opt/node22/lib/node_modules/playwright/index.js'; const { chromium } = pkg;` — Chromium is preinstalled; never run `playwright install`.
- **Serve the repo root over local HTTP** (`python3 -m http.server 8080`) and load `http://localhost:8080/<page>.html` — not `file://` (root-absolute `/js/i18n.js` would fail and i18n render paths throw).
- Register `page.route('**/*', …)` **before** `goto` to abort every non-localhost/`data:`/`blob:` origin, or the load hangs. Assert on `pageerror` count (0), not console errors.
- **Testing a failure/offline path? `browser.newContext({ serviceWorkers: 'block' })`** — the worker bypasses `page.route` and serves `/data/` from cache, silently turning a failure test into a happy-path one.
- Dismiss auto-open modals (`.overlay.open` → remove `open`; on the Font Maker wait for the wizard gate first). Test light **and** dark, ~1280px **and** ~800px, EN **and** HE where UI text changed. Large class-set worksheets build in chunks — poll for the final `.sheet` count.
