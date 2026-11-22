# The home page (`index.html`) — reference

The hub shows every tool at once: sixteen tiles in five groups named for who each serves, under a headline and one
sentence, between the navy header and a navy footer in columns. It also hosts the AllTools window (Import / Export /
Erase All Settings, My IvritSuite Fonts, the account block — `storage-and-backup.md`, `accounts-and-cloud.md`) and the
one-time What's-new card (`storage-and-backup.md`). Its `<title>`, meta tags and JSON-LD are the suite's own and are
not part of the layout.

## Groups and tiles

`#mainContent` (`<div class="hero" role="main" tabindex="-1">`, the skip link's target and the What's-new card's focus
fallback) holds `.home-intro` (the `h2.home-headline` and `p.home-lede`) and `.tool-groups`.

- **A group** is `<section class="tool-group" aria-labelledby="tg<Id>" style="--n:<tiles>">`: a `.tg-head` with the
  small-caps *who it is for* line (`p.tg-for`, `home.group.<id>.for`) and the `h3` title (`home.group.<id>.title`),
  then `ul.tool-tiles`. The groups, in order: `teach`, `read`, `torah`, `create`, `explore`.
- **`--n` is the group's tile count.** The CSS sizes a group from it (`flex: var(--n) 1 calc(var(--n) * 130px + 34px)`),
  so the groups share a row in proportion to their tiles and wrap by themselves; a group whose `--n` disagrees with its
  tiles leaves a gap or squeezes them.
- **The Hebrew word beside a group title** (`span.tg-heb`, `lang="he" dir="rtl" aria-hidden="true"`) is pinned Hebrew
  for the English interface, never a key; the CSS hides it in the Hebrew interface, where the title is Hebrew already.
- **A tile** is `<li><a class="tool-tile" href="…">` holding three spans: `.icon` (the drawing), `.tt-name`
  (`home.tile.<key>.name`) and `.tt-desc` (`home.tile.<key>.desc`, one sentence). A badge sits between the name and the
  sentence: `.beta-tag` (`home.badge.beta`) or `.new-tag` (`home.badge.new`).
- **The *New* badge is hand-kept**: it comes off a tile when its tool stops being new, and nothing else changes.
- **My Fonts is not a page.** Its tile is a `<button type="button" class="tool-tile">` calling `openMyFonts()`, which
  opens the AllTools window scrolled to *My IvritSuite Fonts* with the focus on that section's heading; Escape returns
  the focus to the control that opened it (`openIEModal` remembers it). The footer's *My IvritSuite Fonts* link calls
  the same function.
- **Tile icons** are one duotone set, inline SVG on a cream 72px tile (58px on a phone): a 64px grid, an `--ik-ink`
  line at 2.2px, `--ik-paper` / `--ik-paper2` fills and one `--ik-gold` accent whose parts carry `.ik-g` (a fill) or
  `.ik-gs` (a stroke) and brighten with the tile's border on hover. Every colour is a variable, so dark mode and
  print need nothing extra. A Hebrew letter inside one is an outline, never text, so no font is needed. Decorative:
  `aria-hidden`. An existing drawing is moved, never redrawn.
- **Phones (600px and under):** one group per row, four tiles across, names only. The sentence and the badge are
  visually hidden by the CSS, not removed, so a screen reader still reads them.
- **The seven `home.card.<tool>.name` rows stay in the CSV** although no card shows them: `js/ivrit-saves.js`
  (`TOOL_NAMES`) reads them for the account's listing.

### Adding a tool

1. The tile, in the group it belongs to, and that group's `--n` raised by one.
2. Two CSV rows, `home.tile.<key>.name` and `home.tile.<key>.desc` (the spans' fallback text is the `en` cell), then
   `node scripts/build-locales.js`.
3. The page's entry in the hub's JSON-LD `ItemList` and navigation list, then `node scripts/update-llms-txt.mjs`.
4. The sitemap (`node scripts/update-sitemap.mjs`), `sw.js` `CORE_ASSETS` and whatever else the tool's own reference
   lists (the 404 page, the *Related Hebrew Tools* footers).
5. `node scripts/smoke-kintsugi.mjs` only if the header or the footer changed; a tile changes neither.

## Header

The header is the suite's (the lockup as the `h1`, the language switcher, the account chip, the dark toggle —
`shared-components.md`), with two things of this page's own: from 1280px up the lockup is 56px tall and the header's
content keeps to the page's centred 1200px column; below 1280px nothing differs, so the wrap gates are the measured
ones. Its first child is the header's `.kin` block (below). On paper it takes the white plate every page gives its
header, under the print lockup's navy ink.

## Footer

`<footer class="home-footer">` is this page's alone (every other page keeps the suite's centred footer): navy in both
themes, in the source order **brand, settings, about, follow**, which is the reading order of the columns.

- **Brand:** the lockup (48px, 38px under 600px; both images, as in the header), the pinned-English credit and licence
  line, and the Sefaria credit (`home.footer.sefaria_note` and Sefaria's badge as a real link). The footer is navy in
  both themes, so the screen always shows the badge drawn for a dark ground and paper shows the other; it is drawn 28px
  tall, the size at which its wordmark reads.
- **Settings** (`nav`, `home.footer.settings_header`): the account page, My IvritSuite Fonts, Import / Export All
  Settings and Bookmark this page, with `#bookmarkTip` (`role="status"`, the only response to the Bookmark button).
- **About** (`nav`, `shared.footer.about_header`): Contact, Privacy, Terms, GitHub, and *Hebrew Fonts*
  (`resources.html?view=fonts`).
- **Follow:** the shared `.footer-social` group, markup unchanged; this page's CSS draws its three links as 44px round
  buttons (40px under 340px, so the lockup and all three stay on one row at 320px) and hides the platform names
  visually.
- **Two labels per link.** Each settings and about link carries `.lbl-long` (shown in the columns) and `.lbl-short`
  (`home.footer.short.*`, shown on a phone, where the links run in two wrapping rows); the CSS shows one at a time. The
  short ones carry `data-nosnippet`, so a search snippet built from page text never reads both — Google honours that
  attribute on a `span`, never on an `a` or a `nav`. Existing strings are reused for the long labels wherever the words
  are the same.
- **Phones:** the CSS shows the logo and the social buttons first and the credits last; the Tab order follows the
  source.
- **Paper:** a white footer in navy ink, the settings column and the social row hidden (they do nothing on paper).

## Kintsugi cracks

Thin gold cracks in the navy header and footer, after the craft of mending pottery with gold. Decoration only:
`aria-hidden`, no pointer events, absent from print and from forced colours.

- **Generated, never drawn by hand.** `brand/kintsugi/fractures.json` is the only hand-kept copy: sixteen *fractures*
  (a crack and its branches), each a list of centre-line points with a stroke width for every run of three segments.
  `node scripts/build-kintsugi.mjs` writes one `brand/kintsugi/<id>.svg` per fracture; `--print` also prints the two
  `<div class="kin" aria-hidden="true">` blocks and the position rules the page carries, and `--check` fails when a
  file on disk differs from what the JSON builds. Never edit an SVG; after a rebuild, bump `sw.js` `VERSION`.
- **Anchors.** A fracture is placed from the edge it is anchored to (`start`, `center` or `end`; `top` or `bottom`),
  with logical insets and at its drawn size, so a wider or taller bar never stretches a crack or moves it relative to
  what it sits beside. Never scale, move or redraw one.
- **Two sets.** `kin-wide` (header and footer) was drawn for 1280px bars and shows from 1280px up; `kin-narrow`
  (footer only) was drawn for a 390px footer and shows up to 600px. Between 601px and 1279px there are no cracks, and
  the header has none below 1280px: its controls leave no clear path there.
- **Lazy loading is deliberate.** Every crack image is `loading="lazy"`, so a set that is `display:none` is never
  downloaded: a phone fetches the narrow files, a desktop the wide ones, a tablet none. The files are decorative and
  the service worker's cache-first catch-all stores them on first view, so they are not in `CORE_ASSETS`.
- **Hebrew.** The logical insets mirror the positions and `[dir="rtl"] .kin-f { transform: scaleX(-1) }` mirrors each
  drawing.
- **No stacking context on the header.** The account chip's menu has to stay in the page's own stacking order, so the
  CSS positions the header's children over the cracks (`header > :not(.kin) { position: relative }`). Never switch to
  `z-index:-1` or `isolation`.
- **The 6px rule.** Wherever a fracture shows, its centre line stays 6px or more from what is drawn in its bar: the
  box of a control that has one (the lockup, the header's controls, the social buttons, Sefaria's badge) and the line
  boxes of the words everywhere else (a footer link is words alone; its tap row on a phone is not ink). Where a layout
  cannot give it that, a **gate** — a `max-width` rule beside the position rules — hides the fracture. Hiding is the
  only remedy.
- **Gates are measured, never chosen.** `node scripts/smoke-kintsugi.mjs` measures the rule at every width each set
  shows at, in English and Hebrew, light and dark, with a mouse and with a finger, and for the header signed out and
  signed in with a 16-letter first name; it also checks that each set shows only in its own range. `--report` shows
  every fracture whatever its gate says and prints the widths at which each is clear: a gate hides its fracture below
  the first width from which it stays clear. The smoke needs the real UI fonts (it fetches Google Fonts and Sefaria's
  badge through the environment's proxy) and skips loudly without the fonts.
- **Run the smoke** whenever a header control, a footer link or its label, the lockup's size, the Sefaria badge or
  `fractures.json` changes.

## Checks

- `node scripts/build-kintsugi.mjs --check`, `node scripts/smoke-kintsugi.mjs`.
- `node scripts/smoke-tools.mjs --only index.html` (the account wiring), `node scripts/smoke-holiday-pages.mjs` (the
  page must contain the literal `href="holiday_guide.html"` while the guide is published).
- The header's wrap gates and the print sheet have their own probes under `scripts/loop/probes/`.
- The Playwright recipe (`ops.md`): English and Hebrew, light and dark, from 320px to 1920px, with no horizontal
  scroll at any width.
