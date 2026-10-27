# Total Torah clip index — build report

- **Built:** 2026-10-27
- **Recordings:** Cantor Arianne Brown, Adas Israel Congregation — *Tricks of the Trope – Total Torah* (https://www.adasisrael.org/trope), used by written
  permission; the per-verse MP3s the Torah Trainer streams (`TT_AUDIO_BASE`), never redistributed. This index holds
  clip bounds only.
- **Text:** Sefaria's public export (storage.googleapis.com/sefaria-export, Hebrew merged.json per Torah book, the
  *Miqra according to the Masorah* edition the timings were aligned against); each verse split by `tropeUnitsOfVerse`
  (`js/trope-staff.js`, loaded in a vm), so piece *i* is timings index *i*.
- **Output:** `data/trope/trope_index_totaltorah.json` — 103,493 bytes (budget 163,840)
- **Verses:** 5,846 in the text; 2 without a recording (Genesis 28:5, Genesis 28:6);
  27 double-cantillation verses left out (Genesis 35:22 and the two Decalogues); 0 excluded
  (below); **5,817 aligned** (79,710 words, 68,171 sung words).
- **Selection:** a sung word (a maqaf compound joined; an unmarked word with the marked neighbour it sings with) whose
  marks map to exactly one Learn-card key; the verse's last word is the `sof_pasuk` pool and plays to the file's end
  (`e: null`); clip 0.35–6 s (8 s for rare-flagged marks, 15 s for shalshelet — the
  cantor chants more slowly than PocketTorah's reader, and the long marks' length is the lesson), the
  0.6–3 s band first, one per parasha per pass spread through the Torah, cap 40 per mark, in Torah order.
- **Sung words skipped:** two marks on one word 585 (a kadma or munach with its zakef, a mercha with its tevir…), munach legarmeh 313 (no Learn card), a paseq inside the word 0, shorter than 0.35 s 479, longer than the mark's ceiling 33.

## Per-trope corpus counts

Median = the median length of every one-mark sung word carrying the mark, before the bounds (what the ceilings answer to).

| Trope | Family | Sung words | Median s | Candidates | Selected | Parashot | Videos | Longest s | Ceiling s | Rare |
|---|---|---|---|---|---|---|---|---|---|---|
| mercha | sofpasuk | 9,059 | 1.04 | 8,961 | 40 | 40 | 40 | 2.46 | 6 |  |
| tipcha | sofpasuk | 11,232 | 1.44 | 11,209 | 40 | 40 | 40 | 2.78 | 6 |  |
| munach | etnachta | 8,705 | 1.22 | 8,664 | 40 | 40 | 40 | 2.64 | 6 |  |
| etnachta | etnachta | 5,462 | 1.78 | 5,460 | 40 | 40 | 40 | 2.60 | 6 |  |
| sof_pasuk | sofpasuk | 5,815 | 0.92 | 5,513 | 40 | 40 | 40 | 2.44 | 6 |  |
| mahpach | katon | 3,024 | 1.66 | 3,021 | 40 | 40 | 40 | 2.88 | 6 |  |
| pashta | katon | 5,405 | 1.46 | 5,402 | 40 | 40 | 40 | 2.28 | 6 |  |
| yetiv | katon | 355 | 1.20 | 353 | 40 | 40 | 40 | 1.88 | 6 |  |
| zakef_katon | katon | 6,438 | 1.72 | 6,436 | 40 | 40 | 40 | 2.98 | 6 |  |
| zakef_gadol | katon | 525 | 3.00 | 525 | 40 | 40 | 40 | 3.46 | 6 |  |
| zarka | segol | 370 | 3.06 | 370 | 40 | 40 | 40 | 4.90 | 6 |  |
| segol | segol | 368 | 1.97 | 368 | 40 | 40 | 40 | 2.58 | 6 |  |
| shalshelet | segol | 4 | 12.33 | 4 | 4 | 4 | 4 | 13.81 | 15 | yes |
| revia | revia | 2,422 | 2.68 | 2,419 | 40 | 40 | 40 | 2.98 | 6 |  |
| darga | revia | 1,085 | 1.94 | 1,085 | 40 | 40 | 40 | 2.84 | 6 |  |
| tevir | revia | 2,650 | 2.26 | 2,646 | 40 | 40 | 40 | 2.90 | 6 |  |
| kadma | geresh | 1,907 | 1.14 | 1,902 | 40 | 40 | 40 | 2.66 | 6 |  |
| geresh | geresh | 1,069 | 1.96 | 1,069 | 40 | 40 | 40 | 2.96 | 6 |  |
| geresh_muqdam | geresh | 0 | 0.00 | 0 | 0 | 0 | 0 | 0.00 | 8 | yes |
| gershayim | geresh | 506 | 2.76 | 506 | 40 | 40 | 40 | 2.96 | 6 |  |
| telisha_ketana | geresh | 450 | 3.12 | 446 | 40 | 40 | 40 | 4.84 | 6 |  |
| telisha_gedola | geresh | 263 | 4.52 | 257 | 40 | 40 | 40 | 5.96 | 6 |  |
| pazer | geresh | 152 | 4.94 | 138 | 40 | 40 | 40 | 5.96 | 6 |  |
| mercha_kefula | rare | 5 | 1.88 | 5 | 5 | 5 | 5 | 2.66 | 8 | yes |
| karnei_parah | rare | 1 | 6.56 | 1 | 1 | 1 | 1 | 6.56 | 8 | yes |
| yerach_ben_yomo | rare | 1 | 2.10 | 1 | 1 | 1 | 1 | 2.10 | 8 | yes |

## Excluded verses (0)

_None — every recorded verse outside the double-cantillation passages aligned._

## Genesis 1:1 smoke test

Words (timings indices 0–6): בְּרֵאשִׁ֖ית · בָּרָ֣א · אֱלֹהִ֑ים · אֵ֥ת · הַשָּׁמַ֖יִם · וְאֵ֥ת · הָאָֽרֶץ׃
Timings: 0.14, 2.262, 3.723, 5.465, 6.286, 8.127, 9.168, 10.569

- tipcha w0 0.14–2.26: ✓
- munach w1 2.26–3.72: ✓
- etnachta w2 3.72–5.47: ✓
- mercha w3 5.47–6.29: ✓
- tipcha w4 6.29–8.13: ✓
- mercha w5 8.13–9.17: ✓
- sof_pasuk w6 9.17–end: ✓
- the selected tipcha and sof_pasuk clips include Bereshit 1:1: ✓

## Permission

Written permission (email), October 2026: free access, full credit with links back, no modification beyond cutting the audio into verses, Adas Israel retains the rights to the verse-cut files, every verse links to the complete video on YouTube.
All rights reserved. Not CC-licensed; do not redistribute.

**All smoke tests passed.**
