# source-data/

Build-pipeline **inputs**, not served assets. These CSVs are the sources the
`data/*.json` corpora are generated from — nothing on the site fetches them at
runtime, so they live outside `data/` (and out of the service-worker cache).

- `hebrew_dictionary_4_19_2026.csv` → builds `data/hebrew_words.json`
- `hebrew_emojis.csv` → builds `data/hebrew_emojis.json`
- `totaltorah-adas/<book>.tsv` → builds `scripts/totaltorah-videos.mjs` (the Total Torah whitelist) through
  `node scripts/build-totaltorah-bulk.mjs adas --accept`: one row per video link on each Adas Israel book page
  (https://www.adasisrael.org/trope-breishit … -dvarim), as read off the page — parasha heading, entry label, column
  position (1–3 = the year), YouTube id, verse range as printed. Re-read the pages and edit these when Adas adds or
  replaces a video; never hand-edit the generated whitelist for what these files say.

The gitignored folders beside them (`*-cache/`, `totaltorah-out/`) are the pipelines' scratch space.
