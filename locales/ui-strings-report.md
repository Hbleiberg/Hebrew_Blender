# UI-string extraction report — `locales/ui-strings.csv`

> **Historical snapshot (2026-07-11, the extraction that seeded the CSV).** Everything below describes the CSV on that day. The `he` column has since been fully translated and the row count has grown — `node scripts/check-i18n.js` reports the live state, and `docs/reference/i18n.md` documents the pipeline that maintains it.

**Purpose.** Source-of-truth inventory of every user-facing **UI-chrome** string across IvritSuite,
for the Hebrew-first localization effort. Extraction only — **no source files were modified**. The
`he` column is intentionally empty (translation is a later phase).

**Result:** **3,631 rows** (+ header), UTF-8, RFC-4180, sorted by key, one physical line per record
(embedded newlines encoded as literal `\n`). Validated: 0 duplicate keys, every key matches
`^[a-z0-9_]+(\.[a-z0-9_]+)+$`, every row has exactly 5 columns, `he` empty throughout, and a 60-string
fidelity sample matched source 60/60.

### Rows per top-level namespace

| namespace | rows | namespace | rows |
|---|---|---|---|
| `fontmaker` | 1253 | `resources` | 132 |
| `worksheet` (generator) | 492 | `home` (index) | 68 |
| `dashboard` | 394 | `privacy` | 38 |
| `dictionary` | 349 | `contact` | 29 |
| `flashcards` | 333 | `notfound` (404) | 11 |
| `torah` | 253 | `pwa` | 4 |
| `trope` | 199 | `shared` | 76 |

### Flag counts (from the `notes` column)

`glyph-name` 359 · `mixed UI+content` 107 · `plural` 80 (40 pairs) · `canvas` 30 ·
`print-adjacent empty state` 19 · `RTL / hebDisplay` 13 · `contains \n` 25 · `leading-emoji` 240 ·
`shared.*` 76.

### Conventions used

- **Keys** semantic + dot-namespaced by page/feature, never the English text.
- **`en`** verbatim with HTML entities decoded and leading emoji kept; interpolated values →
  `{placeholder}` templates (`{name}`, `{count}`, `{tool}`, `{verseRef}`, `{cp}`, …). The literal
  `U+` is kept before a `{cp}`.
- **Plurals** split into `key.one` / `key.other` (both flagged `plural`).
- **Glyph/letter/vowel/trope names** live under `*.glyphname.*`, flagged `glyph-name` (per your
  decision — localize-or-keep-English is deferred).
- **Shared components** extracted once under `shared.*`; `notes` lists carrier files.

---

## (a) Scope-ambiguous strings — reviewer decisions

Each was resolved with a default (below); flip any you disagree with. Ordered roughly by impact.

| # | item (namespace / count) | decision | rationale & reviewer note |
|---|---|---|---|
| 1 | Dashboard **weather vocabulary** `dashboard.weather.wmo_*` / `simple_*` / `descriptor_*` (~52) | **INCLUDED** | Weather descriptions shown in the widget ("Clear sky", "Light rain"…). Borderline data-vocabulary; largest ambiguous bucket. Exclude if you'd rather ship weather text from a library. |
| 2 | Dashboard **weekday names** `dashboard.days.dow_sunday…saturday` (7) | **INCLUDED** | UI labels, but each has a paired Hebrew form (bilingual calendar data). |
| 3 | Flash Cards **color names** (Red/Blue/Green/… COLOR_DATA, 13) | **EXCLUDED** | Dual-use: they are both the color-tile **picker labels** *and* the drilled **card vocabulary**. Treated as card content. If the picker labels should localize, add them under `flashcards.colors.*`. |
| 4 | `HEB_MONTHS_TRANSLIT` (Tishrei…Elul) | **EXCLUDED** | Romanized Hebrew-month names shown in the Hebrew-date widget → transliteration output. Include if a Hebrew-month UI is wanted. |
| 5 | Landing **card descriptions** `home.card.*.desc` (8) | **INCLUDED** | Visible homepage marketing copy — but parallels the `resources` `desc:` fields excluded as content. Confirm you want these localized. |
| 6 | Resources **font-submission mailto** `resources.fonts.submit.*` (~11) | **INCLUDED** | User-facing prose, but it's a prefilled `mailto:` payload (analogous to the excluded Anki/Quizlet export payloads). Confirm. |
| 7 | Generator **self-check on-screen subtitles** ("Tap each card to reveal…", ~4) | **EXCLUDED** | Rendered on-screen in interactive flip modes (arguably chrome) but sit on the printed-subtitle boundary. Include if interactive-mode subtitles should localize. |
| 8 | Trope **Learn-card teaching prose** `trope.learn.*_note` (~22) | **INCLUDED** | Instructional prose about cantillation (not verse text); included per your "all in-app prose" decision. |
| 9 | Torah/Trope **cantillation family + trope names** (`*.glyphname.*`, ~53) | **INCLUDED (glyph-name)** | Cantillation term labels (proper-noun-ish); same deferral as letter/vowel names. |
| 10 | Torah **book names** in custom-range dropdown `torah.custom.book_*` (5) | **INCLUDED** | Proper-noun content shown as UI labels. |
| 11 | `worksheet.layout.title_default` = "Hebrew Blends" | **INCLUDED (chrome only)** | The editable Title field's default; the *same string* is also a printed-title fallback (excluded). Keyed once, as chrome. |
| 12 | Font Maker **engine/technical status** ("Font engine ready.", "Installing fontTools…") | **INCLUDED (status)** | Technical/library terms; you may prefer to keep them English. |
| 13 | Hebrew-only radio labels (עברית) | **EXCLUDED** | Their English siblings ("English/Both/None") were extracted; the Hebrew label itself is content. |

**Known non-issues (no action needed):**
- Three keys end `.one`/`.other` for non-plural reasons — `dictionary.pos.other` = "Other" (part-of-speech),
  `worksheet.realwords.pos.other` = "Other", `worksheet.modes.practice.one` = "1-Letter". None carry a
  `plural` note, so a plural-aware consumer keying on the note (not the suffix) is unaffected.
- "Version A" appears only inside explanatory **tooltips** for the class-set feature — the excluded
  printed `Version A` / `גרסה א` label was **not** extracted.

---

## (b) Canvas-rendered strings (30) — need special runtime handling

All canvas text in the suite is in **`Hebrew_Font_Maker.html` only** (confirmed: 18 `fillText`/
`strokeText` calls; every other page draws UI via the DOM). These are drawn with `ctx.fillText` into
the **Preview-PDF specimen/chart generator** and the **printable template pages** — i.e. baked into a
downloadable PDF/PNG, not on-screen DOM. A runtime i18n layer must swap these **at draw time** and
re-measure layout (widths/columns), not via `textContent`. All 30 carry `notes: canvas`.

| key | en |
|---|---|
| `fontmaker.canvas.specimen_subtitle` | `Hebrew Font Maker specimen · v{version}` |
| `fontmaker.canvas.my_font` | `My Font` (family-name fallback) |
| `fontmaker.canvas.special_forms` | `special & precomposed forms` |
| `fontmaker.canvas.letter_nikkud` | `Letter × Nikkud` (chart title) |
| `fontmaker.canvas.continued` | ` (continued)` (page suffix) |
| `fontmaker.canvas.section_english` | `English letters` |
| `fontmaker.canvas.section_specialized` | `Specialized — wide letterforms` |
| `fontmaker.canvas.section_yiddish` | `Yiddish forms` |
| `fontmaker.canvas.section_ladino` | `Ladino forms` |
| `fontmaker.canvas.section_custom` | `Custom glyphs` |
| `fontmaker.canvas.anchor_below` / `_above` / `_center` | `below {x},{y}` / `above {x},{y}` / `center {x},{y}` |
| `fontmaker.canvas.chart_bare … chart_sheva` (11) | nikkud column headers: `bare`, `dagesh`, `qamats`, `patach`, `tsere`, `segol`, `hiriq`, `holam`, `qubuts`, `sheva` — **also glyph-name-like** |
| `fontmaker.canvas.tpl_letters` / `tpl_nikkud` / `tpl_trop` / `tpl_punct` / `tpl_english` | printable-template page titles: `Hebrew Letters`, `Vowels (Nikkud)`, `Trop (Cantillation)`, `Punctuation & More`, `English Letters` |
| `fontmaker.canvas.tpl_page_of` | `{title} · page {n} of {total}` |
| `fontmaker.canvas.tpl_instruction` | `Write one glyph per box in DARK ink, kept inside the box — the light blue grid will not scan.` |

**Note:** 7 nearby strings that *looked* canvas-adjacent are actually the on-screen **Templates-tab UI**
(buttons `PDF` / `Picture (PNG)`, row meta like `27 letters · 2 pages`). They were re-namespaced to
**`fontmaker.templates.*`** (DOM UI, not canvas) so `fontmaker.canvas.*` stays purely canvas-drawn.

---

## (c) Mixed UI+content strings (107) — the dangerous ones

Strings that fuse translatable UI wording with data that must **not** be translated, or with inline
Hebrew. Each is flagged `mixed UI+content — do not translate {…}` in `notes`. Counts by namespace:
`fontmaker` 40 · `dashboard` 20 · `dictionary` 12 · `shared` 12 · `worksheet` 9 · `torah` 6 ·
`flashcards` 5 · `home` 1 · `notfound` 1 · `resources` 1.

**The categories, with the highest-risk examples:**

1. **Interpolated names/refs that must stay verbatim** — `{tool}`, `{name}`, `{source}`, `{filename}`,
   `{error}`, `{verseRef}`, `{path}`, `{cp}`, glyph names:
   - `shared.ivrit.tool_mismatch_confirm` — embeds two tool names.
   - `dashboard.picker.delete_class_confirm`, `dashboard.picker.class_option` — class names.
   - `flashcards.profile.delete_confirm` / `merge_confirm` — **student names (PII)**.
   - `torah.*.verse_*_aria` / `jump_chip_aria`, `torah.resume` — verse refs / aliyah labels.
   - Font Maker `precomp` titles, glyph-status messages — glyph names / codepoints.
2. **Inline Hebrew inside English chrome** — translate the wrapper, keep the Hebrew example:
   - `notfound.subtitle` — English + vocalized Hebrew `(לֹא נִמְצָא, lo nimtza)` + transliteration wordplay.
   - `dashboard.picker.roster_placeholder` — English + Hebrew sample names (`Ava / Noah / דָּוִד / מַיָה`), with `\n`.
   - `dictionary.shoresh.*` (`e.g. כ-ת-ב`), `dictionary.pos.root` (`Root (שׁורש)`), `worksheet.realwords.pos.root`.
   - `resources.filters.ftype_cursive` (`Cursive (כתב)`), Font Maker kern `Finals (ך ם ן ף ץ)`, Yiddish/Ladino hints.
   - Font Maker **changelog** entries with inline Hebrew examples (v1.2, v1.6 `יְרוּשָׁלִַם`, v1.9, v3.1).
3. **Hard-coded product / proper-noun lists** — do not translate the names:
   - `home.alltools.note` — "the Generator, Dashboard, Flash Cards, …" tool-name list.
   - `shared.footer.created_by` ("Harrison Bleiberg"), `shared.footer.word_data` ("Kaikki.org").
4. **RTL / `hebDisplay` language forks** (13 rows, flagged `RTL / hebDisplay`) — English extracted; the
   app already renders a colloquial Hebrew fork for some of these (a nascent `isHeb` UI concept):
   - `dashboard.groups.group_title` — `Group {n}` vs `hebDisplay('קְבוּצָה {n}')`.
   - The four live-card `*.col_title`, `dashboard.video.header`, and the three `dashboard.days.marker_*`.

---

## Shared-component key inventory (`shared.*`, 76 rows)

Extracted **once** here; each row's `notes` lists carrier files. Carriers were told to skip these so
they aren't duplicated per page.

| sub-namespace | rows | what it covers | carriers |
|---|---|---|---|
| `shared.ivrit.*` | 23 | `.ivrit` save-file engine: Automatic/Manual toggle, drop zone, Merge/Replace restore dialog, save/restore statuses, error alerts, tool-mismatch confirm, manual Export/Import/Copy | generator, dashboard, flash_cards, index (AllTools variant) |
| `shared.folders.*` | 15 | folder-tree: Move ▾, New folder/subfolder, Rename/Delete + prompts/confirm, empty states, drag tooltips, move-menu Root/path | generator, dashboard, flash_cards |
| `shared.fonts.*` | 9 | My Fonts uploader label/title + 3 font-error alerts; font-picker section headers (`My Fonts`, `Cursive / Script`, `{section} Fonts`, `[DEFAULT]`) | 7 font-selector tools |
| `shared.footer.*` | 7 | footer credits/links (About, Created by, Word Data/Kaikki.org, license sentence + link, GitHub, Privacy Policy) | all pages |
| `shared.nav.*` | 8 | "Related Hebrew Tools" nav header + 7 tool links | all tool pages |
| `shared.tour.*` | 5 | in-tour nav only (Back, Next, Done, End tour, `Step {count} of {total}`) | all 7 tools |
| `shared.toast.*` | 3 | generic toasts (Copied!, ✓ Copied!, Imported successfully.) | generator, dashboard, flash_cards |
| `shared.darkmode.*` | 3 | toggle title/aria + labeled Light/Dark variants | all pages |
| `shared.fullscreen.*` | 3 | enter/exit titles + aria-label | most tools |

**Deliberately NOT shared (kept per-tool):** the **tour launcher** button/first-run link — its label
varies (`❓ Tour` vs `Take a tour →` vs `▶ Take a tour`), so each tool keys its own under
`<tool>.tour.launch_*`. The **manual-backup textarea placeholder** and **JSON-error alert** also diverge
per tool (generator `⬇ Import from backup`, dashboard `Paste backup JSON here…`, index `Copy to Clipboard`),
so they're page-specific. Font Maker carries **neither** the `.ivrit` engine nor the shared uploader (it
uses `.hebrewfont` files + its own My-Fonts manager).

---

## How this was produced / how to regenerate

Six per-file extraction passes (walking static HTML attributes, JS message strings, and content
registries + canvas `fillText`) wrote CSV fragments under a shared conventions spec; the `shared.*` set
was extracted centrally from representative carriers; all fragments were merged, de-duplicated, plural-split,
and validated into the single sorted CSV. Fragments and the merge/validate scripts live in the session
scratchpad. To extend to a new tool: add its page-specific rows under a new `<tool>.*` namespace, reuse the
existing `shared.*` keys, and re-run the merge + validation checks.

## Out of scope (excluded, per plan)

Page `<title>`/`<meta>`/OpenGraph/JSON-LD (SEO stays English); printed worksheet/answer-key output;
flash-card face/answer content; Hebrew instructional/glyph content; the transliteration feature output;
Sefaria/Torah verse text; data-export payload formatting. Verified absent from the CSV via canary greps.
