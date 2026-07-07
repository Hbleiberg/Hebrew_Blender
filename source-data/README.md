# source-data/

Build-pipeline **inputs**, not served assets. These CSVs are the sources the
`data/*.json` corpora are generated from — nothing on the site fetches them at
runtime, so they live outside `data/` (and out of the service-worker cache).

- `hebrew_dictionary_4_19_2026.csv` → builds `data/hebrew_words.json`
- `hebrew_emojis.csv` → builds `data/hebrew_emojis.json`
