# Open Siddur texts for the Tefillah Trainer

This folder holds a curated snapshot of prayer texts from the [Open Siddur Project](https://opensiddur.org):
one `<key>.json` per prayer, written by `scripts/build-tefillah-opensiddur.mjs` from the pages listed in
`data/tefillah/opensiddur-sources.json`. The Tefillah Trainer reads these files; it never asks opensiddur.org for
anything, and opensiddur.org is not in its CSP.

**It is empty for now.** opensiddur.org answers a script's request with a challenge (HTTP 403), so no page could be
read when the Tefillah Trainer was built, and no text is ever typed in by hand. Until files arrive, every prayer is
read from Sefaria alone and the nusach list offers no Open Siddur entry.

## What a file holds

```jsonc
{ "key": "modeh-ani",              // the catalog key and the file name
  "url": "https://opensiddur.org/…",
  "title": "…",                    // the page's own title
  "contributors": ["…"],           // as the page credits them
  "license": "CC BY-SA",           // the text's own licence: Public Domain, CC0, CC BY or CC BY-SA
  "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
  "retrieved": "2026-11-22",
  "he": ["…", "…"],                // the Hebrew column, one line per entry, verbatim
  "en": ["…", "…"],                // optional: the English column, only where the page's licence covers it
  "variants": true,                // some line gives a word in two gendered forms, written A|B
  "variantOrder": "fm" }           // which side of A|B is feminine: "fm" (feminine first) or "mf"
```

The page shows each text with its own licence and contributor credit, on screen, in print and on the handout. A text
is never relabelled with this site's licence, and a file whose licence is not one of the four above is refused.

## Adding a text

1. Open the prayer's page on opensiddur.org in a browser and save it as *Web Page, HTML only*.
2. Add an entry to `data/tefillah/opensiddur-sources.json` (the script's header lists every field):
   `{ "key": "modeh-ani", "url": "https://opensiddur.org/…", "html": "path/to/the-saved-page.html" }`
3. Run `node scripts/build-tefillah-opensiddur.mjs --dry`, read what it reports (line count, licence, contributors,
   the first and last words), then run it without `--dry`.
4. Where a page writes gendered pairs (`A|B`), check on the page which side is the feminine form and set
   `"variantOrder"` if it is not the first.
5. Set that prayer's `"opensiddur"` source in `data/tefillah/catalog.json` to its key, run
   `node scripts/check-tefillah-refs.mjs`, and commit the file, the list and the catalog together. When an existing
   file changes, bump `OPENSIDDUR_DATA_V` in `tefillah_trainer.html`.

The script takes the Hebrew column of the page's "Source (Hebrew) | Translation (English)" table and nothing else
unless asked. It has been run against made-up pages of that shape only: the first real page is the test of how it
reads the site's markup, and it writes no file when it cannot find the table, the licence or the contributors.
