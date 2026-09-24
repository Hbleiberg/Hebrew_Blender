# Trope motifs build report

- **Built:** 2026-09-24
- **Source:** PocketTorah aliyah recordings (raw.githubusercontent.com/rneiss/PocketTorah), clips selected from `data/trope/trope_index.json`
- **Output:** `data/trope/trope_motifs.json` — 4528 bytes (budget 16,384)
- **Decoder:** mpg123-decoder (WASM); pitch detection: YIN (80–400 Hz band, 10 ms hop, threshold 0.15)
- **Reference pitch:** each clip's final sustained segment (≥120 ms); p = semitones relative to it (notated as B, middle line, treble clef)
- **Examples analyzed:** 0 clips across 0 aliyah MP3s (0 downloaded, 0 cache hits)
- **Run mode:** default (verified entries kept verbatim)
- **License:** transcriptions derived from PocketTorah audio © Russel Neiss & Rabbi Charlie Schwartz — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); this report and the output JSON are likewise CC BY-SA 4.0.

Every non-kept entry is `verified: false` — a machine draft awaiting by-ear
verification (audition via `trope_tutor.html?debug=motifs`, correct the JSON,
flip `verified` to `true`; re-runs keep verified entries).

## Per-trope contours

### mercha

- **kept (human-verified)** — motif: `-10:1 · -7:1` (verified: true)

### tipcha

- **kept (human-verified)** — motif: `-7:1 · -5:1 · -2:1 · -7:3` (verified: true)

### munach

- **kept (human-verified)** — motif: `-7:1 · -9:1 · -12:1` (verified: true)

### etnachta

- **kept (human-verified)** — motif: `-14:1 · -14:1 · -7:2` (verified: true)

### sof_pasuk

- **kept (human-verified)** — motif: `-7:1 · -7:1 · -9:2 · -14:2` (verified: true)

### mahpach

- **kept (human-verified)** — motif: `-5:1 · -5:1 · -14:1 · -9:1` (verified: true)

### pashta

- **kept (human-verified)** — motif: `-9:1 · -2:3` (verified: true)

### yetiv

- **kept (human-verified)** — motif: `0:2 · -2:1` (verified: true)

### zakef_katon

- **kept (human-verified)** — motif: `-5:1 · -2:2 · -7:2` (verified: true)

### zakef_gadol

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -5:1 · -2:1 · 0:1 · -2:1 · -5:1 · -7:2` (verified: true)

### zarka

- **kept (human-verified)** — motif: `-7:1 · -7:1 · -9:1 · -10:1 · -12:1 · -10:1 · -14:1` (verified: true)

### segol

- **kept (human-verified)** — motif: `-9:1 · -5:2 · -7:1` (verified: true)

### shalshelet

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -5:1 · -2:1 · -5:1 · -9:1 · -5:1 · -2:1 · -5:1 · -9:1 · -5:1 · -2:1 · -5:1 · 0:2 · -2:2` (verified: true)

### revia

- **kept (human-verified)** — motif: `-5:1 · -7:1 · -9:1 · -10:1 · -12:1` (verified: true)

### darga

- **kept (human-verified)** — motif: `-5:1 · -2:1 · -4:1 · -5:1 · -7:1` (verified: true)

### tevir

- **kept (human-verified)** — motif: `-7:1 · -9:1 · -10:1 · -9:1 · -7:1` (verified: true)

### kadma

- **kept (human-verified)** — motif: `-14:1 · -9:1` (verified: true)

### geresh

- **kept (human-verified)** — motif: `-2:1 · -5:1 · 0:2 · -2:1` (verified: true)

### gershayim

- **kept (human-verified)** — motif: `-9:1 · -7:1 · -5:1 · -7:1 · -9:1 · -7:1 · -5:1` (verified: true)

### telisha_ketana

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -9:1 · -9:1 · -10:1 · -9:1 · -7:1 · -9:1` (verified: true)

### telisha_gedola

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -9:1 · -9:1 · -7:1 · -5:1 · -4:1 · -2:1 · -5:1 · -7:1 · -9:1` (verified: true)

### pazer

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -7:1 · -5:1 · -4:1 · -2:1 · 0:1 · -2:1 · -5:1 · -7:1` (verified: true)

### mercha_kefula

- **kept (human-verified)** — motif: `-7:1 · -7:1 · -7:1 · -7:1 · -5:1 · -4:1 · -2:1 · -4:1 · -5:1 · -7:2` (verified: true)

### karnei_parah

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -9:1 · -10:1 · -9:1 · -9:1 · -9:1 · -7:1 · -5:1 · -4:1 · -2:1 · -5:1 · -7:1 · -9:1` (verified: true)

### yerach_ben_yomo

- **kept (human-verified)** — motif: `-9:1 · -9:1 · -9:1 · -9:1 · -5:2 · -7:2` (verified: true)

## Smoke tests

**All smoke tests passed.**
