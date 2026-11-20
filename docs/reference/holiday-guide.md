# Holiday Guide (`holiday_guide.html`, `holidays/<slug>.html`)

Jewish holiday coloring pages and a picture guide to the holidays: every holiday's own symbol, when it falls and
what it is, the symbols that go with it, and a builder that prints those symbols as a coloring sheet. The page is
**published**: the home page's Discover card links it (its third button), it is in `sitemap.xml`, `llms*.txt` and
`sw.js` `CORE_ASSETS`, and the tool pages' *Related Hebrew Tools* footers and the 404 page link it. It is a page of
the suite in every respect: CSP, i18n (`holidayguide.*`, and `holidaypage.*` on the generated pages), the AllTools
registration of its key, its smoke. It offers no account, carries no tour (as `parsha_emojis.html`) and fetches no
data.

## The parts

| File | What it is |
|---|---|
| `HolidayGuide.md` | **The catalog — the only hand-edited copy** of every holiday's names, other spellings, when it falls, its description (English and Hebrew), its symbol, and its six symbols with their names, captions and drawings |
| `scripts/holiday-catalog.mjs` | The one parser and validator both builders read the catalog through; its header is the format |
| `scripts/build-holiday-guide.mjs` | Writes `js/holiday-guide-data.js` (`window.HolidayGuide`) and the `docs/holiday-guide/` previews; `--check`, `--catalog=<path>` |
| `scripts/holiday-coloring-review.mjs` | Contact sheets in `docs/holiday-coloring-review/`: every drawing as the site shows it (light and dark), as line art and coloured in |
| `holiday_guide.html` | The hub: the next holiday, the sheet builder, the guide, the list of holiday pages |
| `scripts/build-holiday-pages.mjs` | Writes `holidays/<slug>.html`, `holidays/index.html` (the forwarder), `holidays/img/<slug>-coloring-page.png` and `holidays/img/inputs.json`; holds the `PUBLISHED` switch |
| `js/holiday-page.js` | The generated pages' one script: dark toggle, `applyI18n`, the countdown line |
| `js/hebrew-calendar.js` | The holiday dates: `HOLIDAY_KEYS`, `holidaysOfYear`, `holidayOccurrence`, `nextHoliday` |
| `js/coloring-art.js` | The line-art engine, shared with `parsha_emojis.html` |
| `scripts/smoke-holiday-pages.mjs` | The end-to-end check of all of the above |

After a catalog edit: `node scripts/build-holiday-guide.mjs`, `node scripts/holiday-coloring-review.mjs` (look at
every row), `node scripts/build-holiday-pages.mjs`, `node scripts/smoke-holiday-pages.mjs`. Never edit an output.

## The catalog

- **Seventeen sections in a fixed order**: Shabbat and Havdalah (`weekly`), then the fifteen dated holidays in
  `HebCal.HOLIDAY_KEYS` order. A section's `**Key:**` is its calendar key; the parser loads the keys from
  `js/hebrew-calendar.js` itself, so the catalog cannot name a holiday the calendar cannot date. Shemini Atzeret and
  Simchat Torah are one entry (`shmini_atzeret`, the key `festivalShabbatot` already uses).
- **A holiday's own symbol** is `**Symbol:** holiday-icons:<family>` — read out of the shared holiday-icons JS block
  in `classroom_dashboard.html`, so the Dashboard, the Torah Trainer and the guide show one drawing and no second copy
  exists — or, where that block has no family for it, its own drawing. Swapping a shared family's drawing therefore
  also changes the guide: re-run both builders.
- **No symbols yet, or exactly six** (all seventeen have theirs; the empty case stays for a holiday added later). With six a holiday is *complete*: it gets a page under `holidays/` and a line in
  the hub's hand-kept list (`#hgSheets` — the page builder fails while that list and the catalog disagree, and prints
  the lines it should hold). Without, the hub says more symbols are coming and its builder prints the holiday's own
  symbol as one big picture.
- **Names are vocabulary, sentences are prose.** Every Hebrew name (a holiday's, a symbol's, a meaning's) is pointed;
  `plain` is the name for a sheet printed without nikkud — the points removed, unless `**Unpointed:**` gives the full
  spelling Hebrew uses without them (חֲנֻכָּה is חנוכה; סֻכָּה is סוכה). The parser refuses an `**Unpointed:**` that is
  only the points removed. `tr` (`**Transliteration:**`, required on every holiday and symbol) is how the Hebrew name
  sounds, in lower-case Latin letters and the Letter Learner's spelling (ch, tz, a final -ah, ’ between vowels said
  apart): the Hebrew word's own sound, not the English name — סְבִיבוֹן is *sevivon* beside *Dreidel* — and the
  parser checks it has as many words as the Hebrew. Sentences follow the parasha catalog's rules (`scripts/parasha-catalog.mjs` →
  `catalogChecks`, shared): plain text with curly quotes, the Hebrew unpointed with ה׳ and no Latin letters.
- **A meaning** (`**Meaning:** English · עִבְרִית` and a second drawing) is the small picture a symbol can carry under
  its label — what Sukkot's four species stand for. The builder offers *What each symbol stands for* only on a
  holiday that has them.
- **Drawings** follow the parasha emojis' rules (`shared-components.md` → *Parasha icons and notes*): one line of
  inner markup for a 48×48 SVG, every paint a `var(--hol-*)` token. **A drawing that prints badly as line art is
  redrawn; the engine's rules are not retuned for it** (they are shared with the 54 parasha drawings — see *The line
  art* below).

## The dates and the countdown

- `HebCal.holidaysOfYear(hy, { israel })` gives each of the fifteen its first day (a JDN) and its length; the rules
  that move a day are in the module's comment (Purim in Adar II; Yom HaShoah off a Friday or a Sunday; Yom HaAtzmaut
  off a Friday, a Shabbat or a Monday, with Yom HaZikaron the day before; Tisha B'Av off a Shabbat; the second days
  by schedule). `scripts/smoke-hebrew-calendar.mjs` pins first days and countdown cases and, with `--hebcal`,
  compares 5765–5900 on both schedules.
- **A holiday begins the evening before its first day**, so the count runs to the *eve*: `holidayOccurrence` returns
  `eve`, `state` (`before` / `eve` / `during`), `daysToEve` and `day`. The hub says "{name} is in {count} days" with
  "It begins at sundown on {date}", "{name} begins tonight" on the eve, and "Today is day {day} of {days} of {name}"
  while one is under way (`holidayguide.count.*`; the generated pages reuse the same keys).
- **`nextHoliday`** is the holiday under way, or else the one whose eve comes first. Shabbat and Havdalah are not
  calendar keys, so they can never lead. The hub's hero shows it, its card is marked `aria-current`, the cards after
  the weekly two run in that order, and the builder opens on it — so the first sheet on the page is always the next
  holiday's.
- The schedule is the Torah Trainer's own (`hebrewTorahTrainer_settings.schedule`), **read and never written**.
- No timer: the countdown is computed at load and on a language switch.

## The hub's builder

- **A popup, opened from the page's own links.** Nothing of the sheet maker sits in the page. *Make its coloring
  sheet* — a gold button in the hero (`hgActions(h, true)`), a text link on every card — carries `[data-make]` and
  calls `hgOpen(key, opener)`, which shows `#hgOverlay` (`role="dialog"`, `aria-modal`), sets `body.hg-open` and
  focuses the ✕; Escape, the ✕ and a click on the backdrop call `hgClose`, which clears the pages and returns focus
  to the opener (found again by its box and holiday when a language switch redrew it). Tab stays inside the dialog.
  The pages are built only while it is open (`hgBuild` returns early otherwise: the fit is measured on screen).
  Below 860px the popup fills the screen and shows the sheet before its options. The markup and behaviour follow
  `parsha_emojis.html`'s coloring popup. `#hgCards[data-ready="1"]` marks the page as drawn.
- The holiday (`hgHoliday`) and the ticked symbols (`hgChosen`, `-1` = the holiday's own symbol, offered as a seventh
  picture) are **never stored**; every opening starts with that holiday's six ticked. `?holiday=<slug>`
  (`hgDeepLink`, letters-only matching) opens the popup on that holiday; the address is never rewritten. It is where
  a generated page's Print button lands, and how `build-holiday-pages.mjs` reaches each sheet to photograph it.
- **Options** (`hebrewHolidayGuide_settings`, one blob, per device, registered in the hub's AllTools functions and
  `IVRIT_CFG`; unknown fields are kept): `per` (1, 2, 4, 6 symbols a page), the three label lines `lblHe`, `lblTr`,
  `lblEn` (the Hebrew name, its transliteration, the English name — three checkboxes; a version-1 blob's single
  `labels` field is read once and dropped on the next save), the size sliders `sizePic` (50–100), `sizeHe`,
  `sizeTr`, `sizeEn` (50–150, percent, steps of 5, as the Letter Learner's), `nikkud`, `title`, `cut` (the dashed dividing line between the rows — the field keeps its first name), `meanings`,
  `name`, `colored`, `paper` (`letter` / `a4`). One picture alone fills its page whatever `per` says.
- **Sizes** are factors on the sheet (`--sz-pic`, `--sz-he`, `--sz-tr`, `--sz-en`, set by `hgApplySizes`): a drag
  resizes the sheets on screen and fits them again without rebuilding, and the value is stored when the drag ends. A
  picture fills the room its row leaves it, so its slider only goes down — it grows when the words under it are made
  smaller — and a word that outgrows its cell is fitted back by `hgFit`. A slider whose line is off is disabled.
- **A row that is not full is centred** (five symbols on a six-symbol page): a row holds only the cells it has
  symbols for, each as wide as a full row's (`--cols`), and an empty row keeps its place so the pictures above it do
  not swell.
- **The sheet** (`hgBuildSheet`) is literal white paper and black ink in both themes, laid out left to right, every
  size in `cqmin` (the sheet is a size container) so the preview and the printed page scale alike; its proportions
  are the printed box's (`HG_BOX`, the paper less the 0.35in `@page` margins — `parsha_emojis.html`'s `ET_CS_BOX`).
  A sheet whose only label line is Hebrew is a Hebrew sheet (its grid is `dir="rtl"`, its title and name line
  Hebrew); one with no Hebrew line has an English title; with no lines at all the title is in both. The title is
  real text, hollow: white fill inside a black
  `-webkit-text-stroke` with `paint-order: stroke fill`, so the nikkud stay hollow dots (Name Tags' two-layer bubble
  swallows them, which is why it strips them).
- **Fit, never wrap or clip** (`hgFit`): the title gets `--tk` and each label its own `--k`; a title that would
  shrink below two thirds takes two lines, English over Hebrew, and is fitted again. It runs after every build and
  once more when the fonts have loaded, then sets `#hgPages[data-ready="1"]` (what the picture renderer and the
  smoke wait for).
- **Printing**, while the popup is open, is the sheets alone: `#hgPrintArea` (a child of `<body>`) gets one
  `.hg-paper` per page (`hgFillPrint`, also on `beforeprint`, so Ctrl+P prints the same run), the print rules — keyed
  on `body.hg-open` — hide every other child of `<body>`, and `<style id="hgPageSize">` always holds the `@page` rule
  for the chosen paper. With the popup closed the page prints as any page: in the light palette whatever the theme
  (the print block restates every token the dark block overrides, and the headings a `body.dark` rule turns gold-light
  go back to navy), the header white under navy ink, its links and toggles off.
- Printed words follow the sheet's own languages, not the UI's (`HG_PRINTED`, `i18n-ignore`).
- `applyI18n` re-renders everything the script draws and is read-only: it keeps the builder's holiday and ticks.

## The line art

`js/coloring-art.js` holds `etCsConvert`, `etCsMeasure`, their `ET_CS_*` constants and the geometry cache, moved
verbatim out of `parsha_emojis.html` and declared at the top level (the `js/trope-staff.js` shape): a page that loads
it **must not declare any of those names** — a second top-level `const` is a SyntaxError that stops that page's whole
script, and `check-inline-js` parses each block alone, so only a `pageerror` count catches it. Each page keeps its own
step from a drawing to an `<svg>` (`etCsDrawing` there, `hgArt` here) and its own cache of converted drawings; the
geometry cache key is any Map key (a parasha index there; `<slug>`, `<slug>/<n>` and `<slug>/<n>/m` here). The rules
themselves are in `shared-components.md` → *The parsha emojis page*. **A change to the module changes all 54 parasha
pictures**: prove one by hashing `etCsDrawing(i, colored).outerHTML` for 54 × 2 before and after, with
`parasha-coloring-review.mjs`, `smoke-parsha-pages.mjs` and `build-parsha-pages.mjs --check`; a change that is meant
to move them needs `RENDER_VERSION` bumped in both page builders.

## The generated pages

- One per complete holiday, `holidays/<slug>.html` (the slug is the English name, lower case, hyphenated:
  `tu-bishvat`, `rosh-hashanah`), plus the forwarder `holidays/index.html` → `holiday_guide.html#hgSheets`. Every
  path in them is absolute and they fetch no data, which is why they may live in a folder (`ops.md` → *Deploy*).
- Each copies from `holiday_guide.html` at build time: the gtag snippet, the Google Fonts links, both no-flash IIFEs,
  the palette, the header icons and the header-icons and holiday-icons CSS blocks — so the copies cannot drift.
- Content: the picture (the builder's default sheet, rendered by Playwright from `?holiday=<slug>&lang=en` in a
  fresh context and reduced to 64 colours), the Print link, when it falls in both languages, the other spellings,
  the countdown (`#hpNext`), the description in both languages, the six symbols (drawing, both names, both captions,
  the meaning where there is one) and a previous / all / next pager over the complete holidays.
- A picture is re-rendered when its inputs' hash changes (`holidays/img/inputs.json`: the names and the symbols'
  names and drawings, plus `RENDER_VERSION` — bump that when the builder or `js/coloring-art.js` changes how a sheet
  looks).

## Search

The hub's title, description and `h1` target "Jewish
holiday coloring pages" (the builder and its buttons keep saying *coloring sheet*, the thing it prints), with `WebApplication`, `BreadcrumbList`, `FAQPage` and `HowTo` JSON-LD (the FAQ's English
mirrors the footer's, `holidayguide.faq.*`); each generated page's title carries the holiday's best-known other
spelling ("Chanukah (Hanukkah) Coloring Page") — past 60 characters, an other spelling that repeats a word of the
name is left out ("Shemini Atzeret / Simchat Torah Coloring Page"), an English name kept ("Yom HaShoah (Holocaust
Remembrance Day)") — its description names the six symbols as the catalog writes them ("Seder Plate, Four Cups"),
the same list as the picture's alt text, and its `LearningResource`
carries a licensed `ImageObject`. The other spellings are on the page (`**Also spelled:**`) so a search for one finds
it. `<title>` and the descriptions are English and carry no `data-i18n`.

## Publishing

`PUBLISHED` in `scripts/build-holiday-pages.mjs` is the one switch, and it is `true`: every generated page says
`index, follow`, `sitemap.xml` carries the *holiday coloring pages* block (the hub and every page), and the build
fails unless `holiday_guide.html`'s robots tag says `index, follow` too. Being public is these things together, and
`node scripts/smoke-holiday-pages.mjs` fails while one of them disagrees with the switch:

- the switch and the hub's robots tag;
- `index.html`: the Discover card's *Holiday Guide* button (`home.card.discover.cta_holidayguide`), the `ItemList`
  and navigation entries, and the What's-new card's line for it (beside Name Tags');
- `/holiday_guide.html`, `/js/holiday-guide-data.js` and `/js/holiday-page.js` in `sw.js` `CORE_ASSETS`;
- `sitemap.xml` (the builder's block; `node scripts/update-sitemap.mjs` owns the dates) and `llms*.txt`
  (`node scripts/update-llms-txt.mjs` lists the holiday pages as one line).

To hide it again, undo each: `PUBLISHED = false` and the hub's robots tag back to `noindex, follow`, the button and
the two JSON-LD entries out of `index.html` (with the footer links on the tool pages and the 404 page's link), the
three `CORE_ASSETS` entries out and `VERSION` bumped, then `node scripts/build-holiday-pages.mjs` (it removes the
sitemap block) and both generators.

## Adding a holiday's symbols

Write its six `####` subsections in `HolidayGuide.md` (each with its `**Transliteration:**`, and `**Unpointed:**`
wherever a name's plain spelling is not its points removed), run the four commands under *The parts*, add its line to `#hgSheets` in `holiday_guide.html`
(the page builder prints it), and update `holidayguide.faq.a2` (with its fallback text and the FAQ JSON-LD in the page), which names the holidays that have a sheet.
