# Tefillah Trainer (`tefillah_trainer.html`)

A page for practicing reading the siddur: pick a prayer and a nusach, read it with vowel coloring, transliteration and
translation, print it or copy it. It is the Torah Trainer's page with its audio, karaoke, Trope staff, calendar and
reading assignments removed and a siddur reading model in their place; the `.tt-*` class names, the control ids and
the drawer are the Trainer's, so `docs/reference/torah-and-trope.md` still describes the carried parts (the drawer and
its tabs, vowel and trope coloring, transliteration, the copy bar, the handout, practice links and the link view,
favorites). **There is no audio.** This file covers what is the page's own.

The page is **public**: a hub card after the Torah Trainer's (`home.card.tefillah.*`), `index, follow` with the shared
`og-card.png`, JSON-LD (WebApplication, BreadcrumbList, FAQPage, HowTo — the FAQ and How-To text are the About tab's
CSV rows), `sitemap.xml`, `llms*.txt`, `sw.js` `CORE_ASSETS`, the 404 page and every tool page's *Related Hebrew
Tools* footer (`shared.nav.link_tefillah`). The Torah Trainer's More → About links to it (`torah.about.tefillah_link`).

## The one rule: every word is a source's own

No liturgical text is written, corrected or completed in this repository. Every Hebrew text and every translation comes
from Sefaria (live) or, once files exist, from an Open Siddur snapshot, verbatim, and is shown with its source, its
edition and its licence in the credits under the prayer. What the page changes is display only (hidden marks, hidden
instructions, line numbers, one gendered form), and the credits say so. A text that looks wrong is reported to the
maintainer, never fixed. The fixture smoke builds its texts from ordinary vocabulary words for the same reason.

## The catalog — `data/tefillah/catalog.json`

A curated list, not the Sefaria tree. Fetched as `data/tefillah/catalog.json?v=6` (`CATALOG_URL`); `sw.js` precaches
that exact URL (`DATA_PRECACHE`), so **an edit bumps the `?v=` in both places**.

```jsonc
{ "v": 1,
  "hebrewPreference": ["Metsudah", "Shaliehsaboo", "Torat Emet", "Daat"],   // which open Hebrew edition a whole node shows
  "groups":  [ { "key": "morning-waking", "nameKey": "tefillah.group.morning_waking", "en": "…", "he": "…" } ],
  "prayers": [ { "key": "modeh-ani", "nameKey": "tefillah.prayer.modeh_ani", "en": "Modeh Ani", "he": "…",
                 "group": "morning-waking", "service": ["shacharit"], "days": ["weekday", "shabbat"],
                 "sources": { "ashkenaz": …, "sefard": …, "edot": …, "torah": …, "opensiddur": … } } ] }
```

A source is `null` (the nusach has no such prayer here: it is simply not offered, never filled from another), one part,
or an ordered list of parts. A part is:

| Form | Meaning |
|---|---|
| `"Siddur Ashkenaz, Weekday, Shacharit, …, Modeh Ani"` | a whole **leaf node** of one of the three siddur indexes |
| `{ "ref": "<leaf>:<a-b>", "he": "<edition>", "from": "…", "to": "…" }` | **lines** `a`–`b` of a leaf node, read from that exact Hebrew edition; `from` / `to` are the consonants of the range's first two and last two pointed words |
| `{ …, "en": { "v": "<translation>", "from": "…", "to": "…" } }` | a **pinned translation**: line *n* of that translation stands beside line *n* of the part's Hebrew (below) |
| `{ "ref": "<leaf>", "en": { "v": "…", "he": "<edition>", "from": "…", "to": "…" } }` | a whole node with a pinned translation; `he` names the Hebrew edition the pairing was read against |
| `{ …, "verses": { "lines": [null, "Psalms 115:1-11", "Psalms 115:12-18"] } }` | **lines that are Tanakh verses**: one entry per line of the part (null: an instruction, or a line with no verse of its own); on a whole node also `"he"`, the Hebrew edition whose lines were counted, or a list of such maps, one per edition (below) |
| `"Deuteronomy 6:4-9"` | a Tanakh ref — only inside a `torah` source |
| `{ …, "added": true }` | inside a `torah` source: a line the siddur adds between the verses |
| `"modeh-ani"` (the `opensiddur` source) | the key of a snapshot file, `data/tefillah/opensiddur/<key>.json` |

- **Refs are never guessed.** `scripts/walk-tefillah-index.mjs` prints every leaf path and, with `--lines`, a node line
  by line; a catalog ref is a path it printed and a range is lines it printed. Sefard and Edot HaMizrach hold most
  prayers inside large nodes, so most of their sources are line ranges.
- **`from` / `to` are stamped, never typed**: `node scripts/check-tefillah-refs.mjs --stamp` copies them from Sefaria's
  answer and rewrites the catalog through `formatCatalog`. The page compares them on every load (`rangeEnds`) and shows
  nothing when they differ (`range_moved`): an edit at Sefaria cannot slide a prayer onto its neighbour's lines.
- **A pinned translation (`en`)** exists because Sefaria keeps a translation's lines at the Hebrew's positions, but
  many translations stop early or leave lines empty, so their line count differs and the page cannot tell they pair.
  A pin is added only after a person has read the two side by side (`--lines` of the walker, or the report's last
  section): never by a rule, since some translations follow another Hebrew edition's division. Its `from` / `to` are
  the first three words of the first translated line and the last three of the last (lower case, `a-z0-9` only),
  stamped by `--stamp` like the Hebrew's. The checker fails on a pin whose translation is gone or not open, has no
  translated line there, has a line where the Hebrew has none, or no longer matches its stamp.
- **Lines that are Tanakh verses (`verses`)** exist for Hallel (and Edot HaMizrach's Psalm 150): Sefaria's siddurim
  hold no open translation of it, but every line of its psalms is whole verses, and the Book of Psalms has several
  open translations. An entry is one
  chapter and its verses in the order the line says them (`"Psalms 118:5-24"`, `"Psalms 118:1,3"` for a response
  followed by the next verse); only Psalms may be named (`VERSES_RE`, on the page and in the scripts). Nothing is
  taken on trust: `versesFit` compares the line's own pointed letters with the verses' Hebrew (the first verse of
  each range must be there, in order, the first opening the line; eight letters decide), in the checker — which also
  requires each range's last verse and counts the rest — and again on the page at every load. Psalm 118:25 is two
  halves the siddur says on separate lines: the verse stands beside the first and the second has none. A whole node
  lets a visitor switch its Hebrew edition, and each edition divides its lines its own way, so a whole node carries
  **one map per edition** (the Ashkenaz Hallel psalms: Metsudah's paragraphs, and Daat's one line per psalm); an
  edition with no map shows no translation.
- **`node scripts/check-tefillah-refs.mjs --out docs/tefillah-refs-report.md`** checks every source (the ref resolves
  and is a leaf, the pinned edition is still open, the range's ends match, a pinned translation still pairs, every
  line named as verses opens with them, an Open Siddur key's file exists and is open) and writes the table the catalog
  is reviewed from: edition and licence, other open editions, each open translation and whether it is divided like
  the Hebrew (✓), pinned (⇄), a translation of the verses the lines hold (◇) or none of these (✗), the first and last
  words, and at the end **every pinned pairing and every verse line, line by line**. After a catalog edit, run it and
  commit both. Behind a proxy: `NODE_USE_ENV_PROXY=1`; `TEFILLAH_CACHE_DIR=<dir>` keeps
  Sefaria's answers on disk.
- The page reads the catalog through `normalizeCatalog`: a part that is not one of the forms above drops its whole
  source (a pin or a verse map it cannot read drops only itself: `catalogPin`, `catalogVerses`), a key that is not
  `PRAYER_KEY_RE` drops its prayer, and `prayerByKey` is a `Map` (so `?prayer=constructor`
  finds nothing). Nothing typed in an address reaches a request except by naming a catalog key.
- Names: `catalogName` shows the CSV row a `nameKey` names (`tefillah.prayer.*`, `tefillah.group.*` — written from the
  catalog's own `en` / `he`), else the catalog's value.

## Loading a prayer

`resolveReading()` → `{ prayer, nusach, parts }`; `fetchAndRender()` → `loadReading()` (up to four parts at a time)
→ `buildLines()` → `renderText()`. One part that cannot be shown fails the whole prayer (`TextUnavailable`, with a
reason on the status line and the Try again card): a prayer with a silent gap would be worse than none.

- **Siddur parts** (`loadSiddurPart`): `GET /api/v3/texts/<node>?version=hebrew[|<title>]&return_format=strip_only_footnotes`,
  always the whole node (cached per node and edition in `_nodeCache`; a range is sliced on the page, so the Sefard
  Amidah's blessings cost one request between them). Each segment goes through `parseSegment`: `DOMParser`, then a
  walk that reads `textContent` only. **No markup from Sefaria is ever inserted**: bold and small print become two
  flags per word, which reach the page as its own classes `tt-b` / `tt-sm`.
- **The licence rule** (`licenseName`): only Public Domain, CC0, CC BY, CC BY-SA, CC BY-NC and CC BY-NC-SA. `unknown`,
  an empty value, a "Copyright: …" string and every NoDerivatives licence are refused, and the check is made on the
  version **Sefaria returned**, not the one it listed (it has listed an edition as open and answered with another). This
  is stricter than the Torah Trainer's `isPermissiveLicense`. `scripts/tefillah-sefaria.mjs` holds the same function
  for the scripts: keep the two alike.
- **Hebrew edition**: a ranged part reads the edition its catalog entry pins (`edition_gone` when Sefaria no longer
  offers it openly). A whole node reads the stored choice (`settings.hebEdition`) where the node has it, else the
  first open edition matching `hebrewPreference`; the Text tab's *Hebrew text* section lists the others only where a
  one-part prayer has more than one.
- **Translation** (`pickEnglish`): the stored choice where the node has it; else the translation the catalog pins to
  the part; else the first open translation with as many lines as the Hebrew node (Public Domain or CC0 before CC BY,
  then the rest); else the first open one. A translation stands **line against line** when it has as many lines as the
  Hebrew, or when it is the pinned one and its lines still begin and end as stamped (`englishEnds`; a range's pin
  holds for the range's own Hebrew edition, a whole node's only while the edition it names is the one on screen).
  Any other is shown as one block after the prayer (`.tt-trans-block`), or not at all for a line range (there is no
  telling which of its lines are these), with a note under the version list either way. A translation line with no
  word in it (Sefaria's `[]` placeholder) is an untranslated line and shows nothing. A prayer with no open
  translation says so and shows none.
- **Translations of Tanakh verses** (`loadVerseTranslations`): where no translation of the siddur's own stands beside
  a part's lines and the catalog names their verses (a whole node: only while the edition they were counted in is on
  screen), the page asks Sefaria for each chapter named (`fetchSefariaText("Psalms 113")`, the Tanakh path), checks
  every line with `versesFit`, and offers the open English translations **every** chapter has — the stored choice,
  else JPS 1917, else by licence rank, as the Torah source does. Each line gets its verses joined in order; the
  credit names the book (`en.work`: "Psalms — <title> · <licence>"), the version list is the verses' (so a full Hallel
  lists what all six psalms share, and its two blessings, which have none, do not empty it —
  `readingEnglishVersions` skips parts that offer nothing), and the note under the list says where the translation
  comes from (`tefillah.trans.tanakh_note`). The chapters' Hebrew is fetched with translation off too: the check and
  the list need it. A failed check or request leaves the part without a translation, never the prayer without text.
  **A translation must have every verse the lines hold**: one that leaves a verse out (Sefaria lists a Community
  translation of Psalm 113 that stops after two verses) is passed over for the next choice, remembered for the visit
  (`_thinVerseVersions`) and no longer listed for that chapter; the checker counts each one's verses and lists the
  short ones in the report.
- **Torah parts** (`loadTanakhPart`): the Trainer's `fetchSefariaText` / `parseSefariaResponse`, which also record the
  returned versions' titles and licences. Translation: the stored choice, else JPS 1917, else by licence rank.
- **Open Siddur parts** (`loadOpenSiddurPart`): below.

## The line model

`currentVerses` is the list every renderer, the copy bar and the handout walk — one entry per source segment:
`{ line, seg, part, kind, added, inst, hebrew, flags, marks, teamim, trope, reading, translation, variants, vk, num, label }`.

- `data-line` (the index in the reading) and `data-seg` (`<part>:<source segment>`) are on every row, and every word
  carries `data-twi`: the stable addresses a later recording will need. `data-vk` is the key a line is selected and
  copied by.
- **Line numbers** count only lines that hold prayer text (`1, 2, 3…`); a Torah verse shows `chapter:verse`; the
  siddur's added line among Torah verses is selectable and unnumbered. Hiding numbers or instructions is a body class
  (`hide-linenums`, `hide-inst`), so the numbers never shift.
- **Instructions**: unpointed Hebrew is an instruction or a heading — a whole unpointed segment is a `.tt-instline`
  row with no `data-vk`, an unpointed word inside a text line is a `.tt-inst` span. They are never colored,
  transliterated or copied as prayer text (`reading` is the line's pointed words). `<small>` is not the test: one
  edition wraps prayer text in it.
- **The Metsudah reading marks** (U+0592 over a sounded sheva, U+05AF) are that edition's own aids, not te'amim: hidden
  unless *Show the Metsudah reading marks* is on, and never counted as cantillation (`REAL_TEAMIM_RE`). The row shows
  only for a text that has them.
- **Te'amim and trope**: the te'amim switch is live only when a loaded line carries real accents; trope classes are
  emitted only on Torah verses (`v.trope`), so the legend, its chip and the Colors tab's trope section are off for a
  siddur text, with a note. The stored colour choice is kept.
- **Words are not buttons** in this version: no click action, no roving focus.

## The Shema's Torah text

Sefaria's cantillated siddur Shema has an `unknown` licence, so the Shema and V'ahavta carry a `torah` source: the
verses through the Tanakh path (their own edition and licence in the credits), with the siddur's two added lines from
the Ashkenaz siddur between them, marked *added in the siddur* (`.tt-added-chip`). `#ttTorahLinks` offers *Open in
Torah Trainer*, one link per passage (the Trainer's `?ref=` takes one range).

## Open Siddur — a snapshot, never a live fetch

`data/tefillah/opensiddur/<key>.json` (`{ key, url, title, contributors, license, licenseUrl, retrieved, he, en?,
variants, variantOrder? }`) is written by `scripts/build-tefillah-opensiddur.mjs` from the pages listed in
`data/tefillah/opensiddur-sources.json`; `data/tefillah/opensiddur/README.md` is the how-to. opensiddur.org is not in
the page's CSP and the page never asks it for anything. **The folder holds no text yet** (the site answers a script
with a challenge); until a catalog entry names a key, the nusach list offers no Open Siddur entry.

- The files are fetched with `?v=OPENSIDDUR_DATA_V`: bump it when an existing file changes.
- A file is read like any text: a missing file, a wrong `key`, no Hebrew or a licence that is not open shows nothing.
  A `url` that is not `https://opensiddur.org/…` or a `licenseUrl` that is not on creativecommons.org / opensiddur.org
  is dropped from the credits.
- **Gendered forms** (`settings.genderedForms`: `both` | `m` | `f`): a word the source writes as `A|B` shows as
  "masculine / feminine", or as the one chosen (`genderedText`; `variantOrder` says which side is feminine, `fm` by
  default). The row appears only for a text that has such pairs, the lines are rebuilt from the loaded parts on a
  change, and the credits note when one form was chosen.
- A text keeps its own licence and contributor credit (title, contributors, the licence linked, the page linked):
  never this site's licence.

## Credits

`creditRows()` → `renderCredits()` builds `#ttCredits` with DOM calls: one row per distinct text on screen (role,
siddur or book, edition title, licence label, link), each piece its own bidi island so the row reads in order in the
Hebrew UI. It prints with the reading and the handout (the handout credits only the Hebrew), and
`creditLinesPlain()` puts the same lines under a copied heading. The footer carries no per-text credit.

## Settings, storage, accounts

| Key | Synced as | What it holds |
|---|---|---|
| `hebrewTefillahTrainer_settings` | `TefillahTrainer` / `settings`, single/assign, no `omit` | Every control (`DEFAULTS` is the field list): the prayer and nusach, the picker's filters, the display, colour, transliteration, copy and handout options |
| `hebrewTefillahTrainer_favorites` | `TefillahTrainer` / `favorite`, map/item | `{ [name]: { v: 1, ref: { kind: 'prayer', prayer, nusach }, color, ts, settings? } }` |
| `hebrewTefillahTrainer_favoritesFolders` | `TefillahTrainer` / `favoriteFolders`, tree, follows `favorite` | The folder tree |
| `hebrewTefillahTrainer_tourSeen`, `hebrewTefillahTrainer_drawerW` | never (erase-only) | The tour's pulse flag and the drawer width |

- `getSettings()` returns the stored form (which a practice link's look never reaches); `applySettings(obj, replace)`
  lands a file's fields and repaints through `repaintFromSettings()`, the one repaint a reset, a restore and a
  download from the account share.
- **A stored value the page cannot use is shown as its fallback and kept**: a prayer the catalog does not list or has
  no text for shows the first prayer (`ensureDefaultPrayer`, `_shownPrayerFallback`), a nusach the prayer lacks shows
  its first source (`effectiveNusach`), a translation the prayer lacks shows another (`_versionFallback`).
- A favorite is a pointer looked up in the catalog on every open (`openFavorite`), so a file or an account row can
  name nothing the page will fetch.
- `.ivrit`: `IVRIT_CFG { tool: 'TefillahTrainer' }` (the More tab's Backup section) holds `favorites`,
  `favoriteFolders` and `liveState`; its `apply` also reads the AllTools keys `tefillahTrainerSettings`,
  `tefillahTrainerFavorites` and `tefillahTrainerFavoriteFolders`.
- Deep links: `?prayer=<key>&nusach=<ashkenaz|sefard|edot|opensiddur|torah>`, and `?s=` for a sender's look.
- `saves.tool` names `TefillahTrainer` through `db/migrations/0014_saves_tool_tefillah_trainer.sql`.

## Checks

- `node scripts/smoke-tefillah.mjs` — the reading model against fixtures it serves itself (no Sefaria): markup never
  reaches the page, the reading marks, line ranges whose words moved, the licence refusals, aligned / block / hidden
  translations, a pinned translation (paired by position, refused when its stamp no longer matches), lines that are
  Tanakh verses (their translation chosen from the open ones, refused when a line does not open with them), the Torah source, an Open Siddur snapshot and its gendered forms, the address bar, the Try again card.
- `node scripts/check-tefillah-refs.mjs` — the catalog against Sefaria (above).
- `scripts/smoke-tools.mjs` and `scripts/smoke-migration.mjs` carry the page (the account layer).
- A new vowel key or colour control follows the Torah Trainer's rule (both schemes, and the `.nik-<key>` line here).
