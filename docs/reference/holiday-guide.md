# Holiday Guide (`holiday_guide.html`, `holidays/<slug>.html`)

Jewish holiday coloring sheets and a picture guide to the holidays: every holiday's own symbol, when it falls and
what it is, the symbols that go with it, and a builder that prints those symbols as a coloring sheet. The page is
**unlisted** (`docs/reference/ops.md` → *An unlisted page*): `noindex`, no hub card or link, absent from
`sitemap.xml`, `llms*.txt` and `sw.js` `CORE_ASSETS`. In every other respect it is a page of the suite: CSP, i18n
(`holidayguide.*`, and `holidaypage.*` on the generated pages), the AllTools registration of its key, its smoke. It
offers no account, carries no tour (as `parsha_emojis.html`) and fetches no data.

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
  only the points removed. Sentences follow the parasha catalog's rules (`scripts/parasha-catalog.mjs` →
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

- In the page, not a popup. The holiday (`hgHoliday`) and the ticked symbols (`hgChosen`, `-1` = the holiday's own
  symbol, offered as a seventh picture) are **never stored**; every visit starts on the next holiday with its six
  ticked. `?holiday=<slug>` (`hgDeepLink`, letters-only matching) opens the builder on that holiday and scrolls to it;
  the address is never rewritten. It is where a generated page's Print button lands.
- **Options** (`hebrewHolidayGuide_settings`, one blob, per device, registered in the hub's AllTools functions and
  `IVRIT_CFG`; unknown fields are kept): `per` (1, 2, 4, 6 symbols a page), `labels` (`both` / `he` / `en` / `none`),
  `nikkud`, `title`, `cut`, `meanings`, `name`, `colored`, `paper` (`letter` / `a4`). One picture alone fills its
  page whatever `per` says.
- **The sheet** (`hgBuildSheet`) is literal white paper and black ink in both themes, laid out left to right, every
  size in `cqmin` (the sheet is a size container) so the preview and the printed page scale alike; its proportions
  are the printed box's (`HG_BOX`, the paper less the 0.35in `@page` margins — `parsha_emojis.html`'s `ET_CS_BOX`).
  A Hebrew-only sheet's grid is `dir="rtl"`. The title is real text, hollow: white fill inside a black
  `-webkit-text-stroke` with `paint-order: stroke fill`, so the nikkud stay hollow dots (Name Tags' two-layer bubble
  swallows them, which is why it strips them).
- **Fit, never wrap or clip** (`hgFit`): the title gets `--tk` and each label its own `--k`; a title that would
  shrink below two thirds takes two lines, English over Hebrew, and is fitted again. It runs after every build and
  once more when the fonts have loaded, then sets `#hgPages[data-ready="1"]` (what the picture renderer and the
  smoke wait for).
- **Printing** is the sheets alone: `#hgPrintArea` (a child of `<body>`) gets one `.hg-paper` per page
  (`hgFillPrint`, also on `beforeprint`, so Ctrl+P prints the same run), the print rules hide every other child of
  `<body>`, and `<style id="hgPageSize">` always holds the `@page` rule for the chosen paper.
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

The SEO markup is written and stays ready while the page is hidden: the hub's title and description target "Jewish
holiday coloring sheets", with `WebApplication`, `BreadcrumbList`, `FAQPage` and `HowTo` JSON-LD (the FAQ's English
mirrors the footer's, `holidayguide.faq.*`); each generated page's title carries the holiday's best-known other
spelling ("Chanukah (Hanukkah) Coloring Page"), its description names the six symbols, and its `LearningResource`
carries a licensed `ImageObject`. The other spellings are on the page (`**Also spelled:**`) so a search for one finds
it. `<title>` and the descriptions are English and carry no `data-i18n`.

## Publishing

`PUBLISHED` in `scripts/build-holiday-pages.mjs` is the one switch. While it is `false` every generated page says
`noindex, follow`, `sitemap.xml` has no *holiday coloring pages* block (one found there is removed), and the build
fails unless `holiday_guide.html`'s robots tag says `noindex, follow` too. To publish:

1. Set `PUBLISHED = true` and change `holiday_guide.html`'s robots tag to `index, follow` (remove the comment above it).
2. `node scripts/build-holiday-pages.mjs` — the pages turn `index`, and the sitemap gains the hub and every page.
3. Add the hub's card, `ItemList` entry and What's-new line to `index.html` with their strings.
4. Add `/holiday_guide.html`, `/js/holiday-guide-data.js` and `/js/holiday-page.js` to `sw.js` `CORE_ASSETS`; bump `VERSION`.
5. `node scripts/update-sitemap.mjs`, then `node scripts/update-llms-txt.mjs` (it lists the pages as one line).
6. Move the page out of `ops.md`'s unlisted list and drop "unlisted" here and in `README.md`.
7. `node scripts/smoke-holiday-pages.mjs` — its last section checks that every one of those agrees.

## Adding a holiday's symbols

Write its six `####` subsections in `HolidayGuide.md` (and `**Unpointed:**` wherever a name's plain spelling is not
its points removed), run the four commands under *The parts*, add its line to `#hgSheets` in `holiday_guide.html`
(the page builder prints it), and update `holidayguide.faq.a2` (with its fallback text and the FAQ JSON-LD in the page), which names the holidays that have a sheet.
