# The home page (`index.html`), the navy footer and the kintsugi cracks — reference

The hub shows every tool at once: sixteen tiles in five groups named for who each serves, under a headline and one
sentence, between the navy header and a navy footer in columns. It also hosts the AllTools window (Import / Export /
Erase All Settings, My IvritSuite Fonts, the account block — `storage-and-backup.md`, `accounts-and-cloud.md`) and the
one-time What's-new card (`storage-and-backup.md`). Its `<title>`, meta tags and JSON-LD are the suite's own and are
not part of the layout.

## Groups and tiles

`#mainContent` (`<div class="hero" role="main" tabindex="-1">`, the skip link's target and the What's-new card's focus
fallback) holds `.home-intro` (the `h2.home-headline`, `p.home-lede` and `p.home-tools`) and `.tool-groups`.

- **`p.home-tools` names the tools in the words people search for** (`home.hero.tools`: Hebrew worksheets, flash
  cards, the alef-bet, a Hebrew dictionary, Torah and trope, a font maker). The tiles are short on purpose, and the
  old cards' long descriptions went with them, so this line is where the page's body text says what the suite
  holds. A reworded line keeps "Hebrew" and each tool's plain name.

- **A group** is `<section class="tool-group" aria-labelledby="tg<Id>" style="--n:<tiles>">`: a `.tg-head` with the
  small-caps *who it is for* line (`p.tg-for`, `home.group.<id>.for`) and the `h3` title (`home.group.<id>.title`),
  then `ul.tool-tiles`. The groups, in order: `teach`, `read`, `torah`, `create`, `explore`.
- **`--n` is the group's tile count.** The CSS sizes a group from it (`flex: var(--n) 1 calc(var(--n) * 130px + 34px)`),
  so the groups share a row in proportion to their tiles and wrap by themselves; a group whose `--n` disagrees with its
  tiles leaves a gap or squeezes them.
- **The Hebrew word beside a group title** (`span.tg-heb`, `lang="he" dir="rtl" aria-hidden="true"`) is pinned Hebrew
  for the English interface, never a key; the CSS hides it in the Hebrew interface, where the title is Hebrew already.
- **A tile** is `<li><a class="tool-tile" href="…">` holding `.icon` (the drawing), `.tt-name`
  (`home.tile.<key>.name`) and `.tt-desc` (`home.tile.<key>.desc`, one sentence). **The name is an `h4`**, so the
  page's outline lists every tool under its group's `h3` (the old cards' names were headings; a crawler and a screen
  reader both read the outline). The My Fonts tile is a button, which cannot hold a heading, so its name is a span. A badge sits between the name and the
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

Every page ends in the same navy footer. Its rules ride inside the shared header-icons CSS block
(`shared-components.md` → *Icons*), byte-identical on every carrier, so a page carries markup only.

```html
<footer class="site-footer [sf-tools] [sf-src] [sf-home]">
  <div class="page-help">…</div>        <!-- the page's own fold-outs (FAQ, How To Use), where it has any -->
  <div class="sf-bar">                  <!-- the navy bar -->
    <div class="kin" aria-hidden="true">…</div>
    <div class="hf-inner">brand · [seam · tools · seam] · [settings] · about · follow · [source credits]</div>
  </div>
</footer>
```

- **The bar is navy in both themes**, with the header's gold line along its top. The `<footer>` element itself is
  bare (no ground, no padding), so a page's older `footer { … }` rules no longer paint anything; what they set that
  inherits (alignment, type size) still reaches `.page-help`, which is why each page's fold-outs look as they did.
- **Brand:** the lockup (48px, 38px under 600px; both images, as in the header, marked `data-nosnippet`), the
  pinned-English credit and the licence line.
- **About** (`nav`, `shared.footer.about_header`): Contact, Privacy, Terms, GitHub and *Hebrew Fonts*
  (`resources.html?view=fonts`), the same five on every page.
- **Follow** (`shared.footer.follow_header`): the shared `.footer-social` group, markup unchanged, drawn as 44px round
  buttons (40px under 340px, so the lockup and all three stay on one row at 320px) with the platform names kept for a
  screen reader.
- **Two labels per link.** Each About link (and each of the home page's settings links) carries `.lbl-long`, shown in
  the columns, and `.lbl-short` (`shared.footer.short.*`), shown on a phone, where the links run in wrapping rows. The
  short ones carry `data-nosnippet`, so a search snippet built from page text never reads both — Google honours that
  attribute on a `span`, never on an `a` or a `nav`.
- **A tool page (`.sf-tools`)** adds its *Related Hebrew Tools* between the brand and About: the page's own list, in
  its own order, two columns, the links' descriptive wording kept (it is what a search engine reads; CSS capitalises
  the first letter). On a phone the list folds under a button (`.hf-fold`, `aria-expanded`, `aria-controls`); on
  wider screens the button is not rendered and a plain heading stands over the open list. The heading's words appear
  twice in the markup for that reason, the button's copy marked `data-nosnippet`.
- **Source credits (`.sf-src`, `.hf-src`)**: what a page owes its sources (Sefaria, PocketTorah, Kaikki, the Trope
  Atlas's transcriptions) is one small line along the bottom of the bar. The Torah Trainer's line is written by the
  page as the reading changes; its spans keep their ids.
- **The page's fold-outs** (*Frequently Asked Questions*, *How To Use*) sit in `.page-help`, on the page's own ground
  just above the bar and still inside the `<footer>`, so the page's `footer details` rules and its print rules reach
  them as before. They are the visible twins of the page's FAQPage / HowTo JSON-LD: never drop one.
- **The home page (`.sf-home`)** has no tool list (its tiles are the list). It adds the settings column (the account
  page, My IvritSuite Fonts, Import / Export All Settings, Bookmark this page with `#bookmarkTip`) and Sefaria's badge
  in the brand block. Its settings labels are `data-nosnippet`: *My IvritSuite Fonts* would otherwise be the one
  sentence of body text that names the site (`ops.md` → *Search snippets*).
- **The Font Maker** keeps its one compact row, because its workspace fills the screen; it takes the navy ground by
  restating the palette tokens on its `<footer>`, so the row and its fold-outs follow without a rule each. It shows no
  cracks. The Dashboard has no footer.
- **The generated pages** (`parsha/`, `holidays/`, the coloring pages hub) take `.sf-bar` whole from the page their
  builder copies its chrome from, with the addresses made absolute.
- **The Worksheet Generator** reserves the height of its frozen *Generate* bar inside `.sf-bar`, so no link ends under
  it at the page's end.
- **Phones:** the logo and the social buttons first, then the tool list's button, the links, the credits, the source
  line; the Tab order follows the source.
- **Paper:** a white footer in navy ink. The home page prints its About links; every other page prints one compact
  line of credits (and its source line), so the footer never takes a sheet of its own. Social buttons, settings, the
  tool list and the cracks are off paper everywhere.

## Kintsugi cracks

Thin gold cracks in the navy header and footer, after the craft of mending pottery with gold. Decoration only:
`aria-hidden`, no pointer events, absent from print and from forced colours. The home page places them from the edges
of its two bars (the points below, down to *Run the smoke*); every other page's header shows the header drawings in the
gap between its title and its controls (*The header gap on every other page*, after them).

- **Generated, never drawn by hand.** `brand/kintsugi/fractures.json` is the only hand-kept copy: eighteen *fractures*
  (a crack and its branches), each a list of centre-line points with a stroke width for every run of three segments.
  `node scripts/build-kintsugi.mjs` writes one `brand/kintsugi/<id>.svg` per fracture; `--print` also prints the two
  `<div class="kin" aria-hidden="true">` blocks and the position rules the home page carries, and the gap markup and
  rules of the other pages; `--check` fails when a file on disk differs from what the JSON builds, or when a root
  page's gap markup or the shared gap rules differ from what `--print` prints. Never edit an SVG; after a rebuild,
  bump `sw.js` `VERSION`.
- **Anchors.** A fracture is placed from the edge it is anchored to (`start`, `center` or `end`; `top` or `bottom`),
  with logical insets and at its drawn size, so a wider or taller bar never stretches a crack or moves it relative to
  what it sits beside. Never scale, move or redraw one.
- **Two sets.** `kin-wide` (header and footer) was drawn for 1280px bars and shows from 1280px up; `kin-narrow`
  was drawn for a 390px phone and shows up to 600px: four drawings on every page's footer, and two in the home
  page's header. Between 601px and 1279px there are no cracks, and every other page's header has none below 1280px:
  its title and controls leave no clear path there.
- **The home page's header on a phone.** On a narrow phone the header's controls wrap to a row of their own, which
  leaves the space beside the lockup free: two drawings (`area: "header-phone"`), anchored to the bar's end edge and
  its top, sit there. Where the controls come back up beside the lockup, a gate hides both. That width follows the
  account chip, so it is measured with the narrowest chip there is (a one-letter name) as well as the widest; the
  wrap rules' own widths are no guide (they say where the header *may* wrap, not where it does).
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
- **A footer's gates follow what it holds.** A plain footer and the home page's show all seven wide fractures. A tool
  page's list of links fills the middle of the bar, so `.sf-tools` hides the three that run there and shows one drawing
  in the **seam** on each side of the list instead (`.hf-seam`: a spacer as wide as the column gap it replaces, its
  drawing anchored to the bar's top edge; `gap.seams` in the JSON); `.sf-src` hides the one that runs under the source
  line, whose wording changes with what the page shows; and the end-edge fracture waits for 1320px on a tool page,
  where the social buttons sit nearer the edge. On a phone every footer shares the home page's one gate.
- **Gates are measured, never chosen.** `node scripts/smoke-kintsugi.mjs` measures the rule at every width each set
  shows at, in English and Hebrew, light and dark, with a mouse and with a finger, and for the header signed out and
  signed in with a 16-letter first name (the phone header also with a one-letter name); it also checks that each set
  shows only in its own range. `--report` shows
  every fracture whatever its gate says and prints the widths at which each is clear: a gate hides its fracture below
  the first width from which it stays clear (the phone header's two are clear only *up to* a width, so their gate is
  a `min-width` rule). The smoke needs the real UI fonts (it fetches Google Fonts and Sefaria's
  badge through the environment's proxy) and skips loudly without the fonts.
- **Run the smoke** whenever a header control, a page's title or tagline, a header's padding, a footer link or its
  label, the lockup's size, the Sefaria badge or `fractures.json` changes. `--home` runs the home page alone, `--gaps`
  the other pages alone, `--only <page>` one page's gap.

### The header gap on every other page

The home page's header holds only the lockup and three controls, so its cracks can be placed from the bar's edges.
Every other header has a title, a tagline and its own row of buttons where those positions fall, and their widths
change with the language and the sign-in state. So there the header drawings are placed in the one space that is
always free: the gap between the title and the controls.

- **`.kin-gap` is a spacer in the header's row**, the element right after the title block. From 1280px it takes the
  row's free space, and a container query on its own width shows as many
  drawings as fit: one from 64px, two from 232px, three from 320px, four from 736px. Each step adds a drawing; none
  moves relative to the others, because they keep the home page's spacing, and the group is centred in the gap.
- **The 6px rule holds by construction**: a drawing lies whole inside the spacer with 6px to spare at each end, the
  spacer ends where the controls begin, and it starts a column gap after the title's own box, which is as wide as
  its longest line. Every line of text and every control keeps the place it had without the spacer, in every state.
- **A title block that grows to fill the row (`flex:1`) carries `.kin-title`.** Its box would otherwise swallow the
  gap, so from 1280px the shared rules make it as wide as its text (`flex:0 1 auto`) and stop everything after it
  from shrinking: when a long account name leaves the row tight, the title alone gives way, exactly as it did when
  it filled the row. A title that is already as wide as its text (the pages whose button row is pushed to the end by
  an auto margin) takes no class. Below 1280px nothing changes. The Font Maker's header may wrap, and a title as
  wide as its text would push its buttons to a second line there, so that page keeps one row from 1280px.
- **Each drawing is anchored to the bar edge it starts from** (`gap.set[].edge` in the JSON: `top` or `bottom`), so
  in a taller or shorter bar a crack is cut at its thin far end, never at its root.
- **Each page states its own header's block padding and column gap** in one line just below the shared block
  (`header{--kin-pt:…;--kin-pb:…;--kin-gap:…;}`): the spacer's negative margins take it to the bar's edges, and a
  negative end margin gives back the column gap it adds. The smoke fails when the spacer misses an edge, so a
  change to a header's padding changes that line too.
- **The rules ride inside the shared header-icons CSS block** (`shared-components.md` → *Icons*), byte-identical on
  every carrier; the markup is one `<span class="kin-gap" aria-hidden="true">` of lazy images, printed by the
  builder. A set that does not show is never downloaded.
- **Two headers are built differently.** The 404 page has no title, so its gap follows the lockup's own box. Flash
  Cards centres its title in a grid, so from 1280px its grid has a spacer on each side of the title (the title keeps
  its place between them); the second holds the one drawing no other page has room for (`gap.alone`, `.kg-b`).
- **The generated pages** (`parsha/`, `holidays/`, the coloring pages hub) take the markup from the page their
  builder copies its header parts from, and state their header numbers in the builder's own CSS.
- **The smoke** measures every root page that carries a gap, and one parsha page and one holiday page after checking
  that all pages of a kind carry the same header: at 1280–1920px in 8px steps and beyond, in English and Hebrew, with
  a mouse and a finger, signed out and signed in, in the dark theme (its *Light* label is the widest). A drawing
  that shows is 6px or more from text and whole inside its gap, the gap reaches the bar's edges (a header that
  wrapped onto a second row would fail here), nothing shows below 1280px, and every gap shows a drawing on a wide
  screen.
- **A long title leaves no gap.** Where a title and its controls fill the row (the Worksheet Generator, Word Lookup,
  the Dashboard and the Letter Learner on a small laptop), that header shows no crack until the screen is wider.
  Never shorten the 6px rule or draw over text to change that.

## Checks

- `node scripts/build-kintsugi.mjs --check`, `node scripts/smoke-kintsugi.mjs`.
- `node scripts/smoke-tools.mjs --only index.html` (the account wiring), `node scripts/smoke-holiday-pages.mjs` (the
  page must contain the literal `href="holiday_guide.html"` while the guide is published).
- The header's wrap gates and the print sheet have their own probes under `scripts/loop/probes/`.
- The Playwright recipe (`ops.md`): English and Hebrew, light and dark, from 320px to 1920px, with no horizontal
  scroll at any width.
