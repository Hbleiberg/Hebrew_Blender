# Trope motifs build report

- **Built:** 2026-07-22
- **Source:** PocketTorah aliyah recordings (raw.githubusercontent.com/rneiss/PocketTorah), clips selected from `data/trope/trope_index.json`
- **Output:** `data/trope/trope_motifs.json` — 2933 bytes (budget 16,384)
- **Decoder:** mpg123-decoder (WASM); pitch detection: YIN (80–400 Hz band, 10 ms hop, threshold 0.15)
- **Reference pitch:** each clip's final sustained segment (≥120 ms); p = semitones relative to it (notated as B, middle line, treble clef)
- **Examples analyzed:** 71 clips across 36 aliyah MP3s (1 downloaded, 35 cache hits)
- **Run mode:** default (verified entries kept verbatim)
- **License:** transcriptions derived from PocketTorah audio © Russel Neiss & Rabbi Charlie Schwartz — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); this report and the output JSON are likewise CC BY-SA 4.0.

Every non-kept entry is `verified: false` — a machine draft awaiting by-ear
verification (audition via `trope_tutor.html?debug=motifs`, correct the JSON,
flip `verified` to `true`; re-runs keep verified entries).

## Per-trope contours

### mercha

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Beha'alotcha 8:1 | וַיְדַבֵּ֥ר | 2.17s | 23% | -3:1 · -4:3 · 0:1 |
| Bechukotai 26:4 | וְנָתַתִּ֥י | 1.46s | 39% | 1:1 · 0:2 · 3:1 · 0:2 |
| Achrei Mot 16:1 | בְּקׇרְבָתָ֥ם | 1.37s | 31% | 0:1 · -2:2 · 0:1 |

- Chosen: example 3 (medoid, Σdist 3.67)
- Motif: `0:1 · -2:2 · 0:1`
- Warnings: low voiced ratio 31%

### tipcha

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Bechukotai 26:3 | בְּחֻקֹּתַ֖י | 1.19s | 53% | 1:3 · 0:2 · 2:1 · 0:3 |
| Vayikra 1:1 | וַיִּקְרָ֖א | 2.04s | 13% | 0:1 |
| Yitro 18:1 | וּלְיִשְׂרָאֵ֖ל | 1.53s | 64% | -1:1 · 0:4 · 2:1 · 0:1 · 7:1 |

- Chosen: example 1 (medoid, Σdist 4.67)
- Motif: `1:3 · 0:2 · 2:1 · 0:3`
- Warnings: (none)

### munach

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Chukat 19:1 | וַיְדַבֵּ֣ר | 2.43s | 56% | -3:4 · -5:1 · 0:2 |
| Vayakhel 35:1 | וַיַּקְהֵ֣ל | 1.82s | 14% | -4:1 · -2:1 · 0:2 |
| Tetzaveh 27:20 | תְּצַוֶּ֣ה | 2.05s | 41% | -1:1 · 0:1 · 2:1 · -2:2 · 0:3 |

- Chosen: example 2 (medoid, Σdist 4.33)
- Motif: `-4:1 · -2:1 · 0:2`
- Warnings: low voiced ratio 14%

### etnachta

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Achrei Mot 16:1 | אַהֲרֹ֑ן | 0.96s | 39% | 1:1 · 0:4 |
| Vayakhel 35:1 | אֲלֵהֶ֑ם | 1.21s | 38% | 0:1 |
| Metzora 14:2 | טׇהֳרָת֑וֹ | 1.6s | 49% | -2:1 · 0:2 |

- Chosen: example 3 (medoid, Σdist 2)
- Motif: `-2:1 · 0:2`
- Warnings: low voiced ratio 49%

### sof_pasuk

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Yitro 18:1 | מִמִּצְרָֽיִם׃ | 1.52s | 70% | 2:3 · 5:2 · -1:1 · 0:4 |
| Shemini 9:1 | יִשְׂרָאֵֽל׃ | 1.65s | 33% | 2:1 · 0:2 |
| Pekudei 38:21 | הַכֹּהֵֽן׃ | 1.55s | 40% | 2:1 · 0:2 |

- Chosen: example 2 (medoid, Σdist 2)
- Motif: `2:1 · 0:2`
- Warnings: low voiced ratio 33%

### mahpach

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Vayakhel 35:5 | מֵֽאִתְּכֶ֤ם | 1.63s | 40% | 0:3 · -1:1 · 0:2 · -5:1 · -4:1 |
| Behar 25:1 | וַיְדַבֵּ֤ר | 2.25s | 34% | -3:2 · 1:4 · 0:2 · -1:1 |
| Lech Lecha 12:1 | וַיֹּ֤אמֶר | 2.18s | 26% | 0:4 · -7:1 |

- Chosen: example 2 (medoid, Σdist 6.67)
- Motif: `-3:2 · 1:4 · 0:2 · -1:1`
- Warnings: low voiced ratio 34%; final note p=-1 (≠0)

### pashta

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Shemini 9:1 | וַֽיְהִי֙ | 1.99s | 9% | 3:1 · 0:2 |
| Pekudei 38:21 | הַמִּשְׁכָּן֙ | 1.37s | 38% | -3:1 · -4:1 · 2:2 · 0:3 |
| Shemot 1:1 | שְׁמוֹת֙ | 2.29s | 24% | 0:2 · -2:2 · -7:1 |

- Chosen: example 1 (medoid, Σdist 5)
- Motif: `3:1 · 0:2`
- Warnings: low voiced ratio 9%

### yetiv

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Shemot 1:9 | עַ֚ם | 1.72s | 39% | 6:1 · 3:1 · 0:2 |
| Noach 6:9 | אֵ֚לֶּה | 1.75s | 34% | 3:1 · 2:2 · 0:4 |
| Beshalach 13:17 | דֶּ֚רֶךְ | 1.63s | 34% | 0:1 |

- Chosen: example 1 (medoid, Σdist 3.33)
- Motif: `6:1 · 3:1 · 0:2`
- Warnings: low voiced ratio 39%

### zakef_katon

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Metzora 14:2 | הַמְּצֹרָ֔ע | 1.61s | 50% | 5:1 · 0:1 · 2:1 · 0:3 |
| Shemini 9:1 | הַשְּׁמִינִ֔י | 1.58s | 36% | 4:2 · 0:2 · 2:1 · 1:1 · 0:2 |
| Pekudei 38:21 | הָעֵדֻ֔ת | 1.39s | 57% | 0:1 · 1:1 · 2:3 · 0:3 |

- Chosen: example 1 (medoid, Σdist 2.67)
- Motif: `5:1 · 0:1 · 2:1 · 0:3`
- Warnings: low voiced ratio 50%

### zakef_gadol

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Vayakhel 35:5 | יְבִיאֶ֕הָ | 2.46s | 49% | -2:2 · 3:2 · 6:1 · 5:3 · 2:2 · 0:3 |
| Beshalach 14:8 | וַיִּרְדֹּ֕ף | 2.49s | 69% | -3:1 · -2:4 · 2:2 · 5:2 · 2:1 · 0:2 |
| Kedoshim 19:35 | בַּמִּדָּ֕ה | 2.85s | 54% | -3:1 · -2:1 · 2:1 · 5:4 · 2:1 · 0:1 |

- Chosen: example 2 (medoid, Σdist 2.33)
- Motif: `-3:1 · -2:4 · 2:2 · 5:2 · 2:1 · 0:2`
- Warnings: (none)

### zarka

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Kedoshim 20:2 | יִשְׂרָאֵל֮ | 3.23s | 47% | 7:2 · 4:2 · 2:1 · 0:1 |
| Pinchas 26:57 | הַלֵּוִי֮ | 3.88s | 60% | 2:4 · 3:1 · 1:2 · 0:2 · -3:1 · -2:1 · 0:1 · -4:1 |
| Emor 23:3 | יָמִים֮ | 2.83s | 67% | 6:4 · 8:1 · 6:3 · 4:1 · 3:1 · 2:1 · 0:1 · 3:1 |

- Chosen: example 1 (medoid, Σdist 10)
- Motif: `7:2 · 4:2 · 2:1 · 0:1`
- Warnings: low voiced ratio 47%

### segol

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Yitro 18:10 | יִתְרוֹ֒ | 2.49s | 76% | 0:1 · 1:1 · 0:1 · -2:2 · 0:1 · 2:2 · -1:1 · 0:4 |
| Shemini 9:9 | אֵלָיו֒ | 2.44s | 47% | 0:1 · -1:1 · 0:1 · 2:1 · 0:3 |
| Pinchas 26:57 | לְמִשְׁפְּחֹתָם֒ | 3.72s | 48% | -7:1 · 0:3 · -2:2 · 2:1 · 0:2 |

- Chosen: example 2 (medoid, Σdist 5.33)
- Motif: `0:1 · -1:1 · 0:1 · 2:1 · 0:3`
- Warnings: low voiced ratio 47%

### shalshelet

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Vayera 19:16 | וַֽיִּתְמַהְמָ֓הּ | 6.47s | 41% | -2:1 · 1:1 · 4:2 · 0:2 · -1:2 · 0:2 · -3:4 · 0:1 |
| Chayei Sara 24:12 | וַיֹּאמַ֓ר | 6.65s | 51% | -1:2 · 1:3 · 2:1 · 5:1 · -1:1 · 2:1 · 7:2 · 2:2 |
| Tzav 8:23 | וַיִּשְׁחָ֓ט | 7.52s | 54% | 1:2 · 4:2 · 5:2 · 7:1 · 5:3 · 7:1 · 5:2 · 0:2 |

- Chosen: example 2 (medoid, Σdist 9.67)
- Motif: `-1:2 · 1:3 · 2:1 · 5:1 · -1:1 · 2:1 · 7:2 · 2:2`
- Warnings: note cap applied; final note p=2 (≠0)

### revia

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Yitro 18:2 | וַיִּקַּ֗ח | 2.39s | 70% | 7:4 · 8:1 · 5:2 · 3:1 · 2:3 · 0:4 |
| Metzora 14:6 | הַֽחַיָּ֗ה | 2.07s | 42% | 5:4 · 4:1 · 2:1 · 0:2 |
| Bereshit 1:2 | וְהָאָ֗רֶץ | 2.34s | 54% | 8:3 · 6:4 · 4:1 · 2:1 · -1:1 · 0:1 |

- Chosen: example 2 (medoid, Σdist 4.67)
- Motif: `5:4 · 4:1 · 2:1 · 0:2`
- Warnings: low voiced ratio 42%

### darga

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Chukat 19:4 | אֶלְעָזָ֧ר | 1.99s | 73% | 1:3 · 2:3 · 6:1 · 5:2 · 2:2 · 0:4 · 5:2 · 0:4 |
| Metzora 14:4 | וְלָקַ֧ח | 2.04s | 43% | 0:2 · 5:2 · 3:1 · 1:1 · 0:3 |
| Bereshit 1:4 | וַיַּ֧רְא | 2.12s | 66% | 0:4 · 5:4 · 2:1 · 0:1 · 2:2 · 0:3 |

- Chosen: example 3 (medoid, Σdist 5)
- Motif: `0:4 · 5:4 · 2:1 · 0:1 · 2:2 · 0:3`
- Warnings: (none)

### tevir

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Metzora 14:4 | לַמִּטַּהֵ֛ר | 2.34s | 32% | -1:1 · 0:4 |
| Pekudei 38:22 | וּבְצַלְאֵ֛ל | 2.42s | 56% | 0:2 · -2:2 · -3:2 · -2:1 · 0:4 |
| Vayetzei 28:14 | וּפָרַצְתָּ֛ | 2.37s | 65% | -2:2 · 0:1 · -1:3 · -3:3 · -4:2 · -3:1 · -2:2 · 0:2 |

- Chosen: example 2 (medoid, Σdist 6.67)
- Motif: `0:2 · -2:2 · -3:2 · -2:1 · 0:4`
- Warnings: (none)

### kadma

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Noach 6:13 | וַיֹּ֨אמֶר | 1.61s | 14% | 0:1 |
| Vayetzei 28:11 | וַיִּפְגַּ֨ע | 1.55s | 64% | -5:1 · -3:3 · 0:4 |
| Vayigash 44:20 | וַיִּוָּתֵ֨ר | 1.44s | 54% | 4:1 · -3:2 · 0:2 |

- Chosen: example 2 (medoid, Σdist 3)
- Motif: `-5:1 · -3:3 · 0:4`
- Warnings: (none)

### geresh

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Shemini 9:4 | וָאַ֜יִל | 1.74s | 61% | -3:2 · 0:1 · -4:3 · 1:2 · -1:1 · 0:4 |
| Bereshit 1:9 | הַמַּ֜יִם | 1.74s | 66% | -3:3 · 0:3 · -4:1 · -3:2 · 2:2 · 0:4 |
| Vayigash 44:18 | אֵלָ֜יו | 2.11s | 87% | -14:1 · -2:1 · -3:1 · -1:1 · -3:1 · 2:1 · 0:4 |

- Chosen: example 2 (medoid, Σdist 5)
- Motif: `-3:3 · 0:3 · -4:1 · -3:2 · 2:2 · 0:4`
- Warnings: (none)

### gershayim

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Chukat 19:4 | וְלָקַ֞ח | 2.42s | 72% | -6:1 · -4:2 · -2:2 · 0:2 · -5:2 · -4:2 · -2:2 · 0:3 |
| Shemini 9:7 | וַעֲשֵׂ֞ה | 2.27s | 32% | -4:1 · -2:3 · 0:4 |
| Pekudei 38:23 | אׇהֳלִיאָ֞ב | 2.21s | 44% | -4:1 · -2:2 · 0:1 |

- Chosen: example 3 (medoid, Σdist 5)
- Motif: `-4:1 · -2:2 · 0:1`
- Warnings: low voiced ratio 44%

### telisha_ketana

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Pinchas 27:14 | כַּאֲשֶׁר֩ | 3.19s | 55% | -1:1 · 3:2 · 4:4 · 2:4 · 0:2 |
| Vayechi 48:14 | וַיִּשְׁלַח֩ | 2.29s | 58% | 4:2 · 5:1 · 4:3 · 5:2 · 9:2 · 7:2 · -1:1 · 0:4 |
| Vayeshev 37:28 | וַיַּֽעַבְרוּ֩ | 2.16s | 54% | 1:4 · 0:1 |

- Chosen: example 1 (medoid, Σdist 9)
- Motif: `-1:1 · 3:2 · 4:4 · 2:4 · 0:2`
- Warnings: (none)

### telisha_gedola

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Shemot 2:14 | וַ֠יֹּ֠אמֶר | 3.73s | 43% | -1:1 · 0:2 · 4:1 · 5:1 · 7:2 · 4:1 · 1:2 · 0:4 |
| Terumah 27:9 | תֵּ֠ימָ֠נָה | 3.39s | 89% | -1:1 · 0:1 · 3:2 · 5:1 · 7:1 · 9:1 · 2:1 · 0:2 |
| Vayeshev 37:7 | וְ֠הִנֵּ֠ה | 3.92s | 74% | 1:1 · 0:4 · 2:1 · 3:1 · 5:2 · 4:1 · 2:1 · 0:2 |

- Chosen: example 1 (medoid, Σdist 4.67)
- Motif: `-1:1 · 0:2 · 4:1 · 5:1 · 7:2 · 4:1 · 1:2 · 0:4`
- Warnings: note cap applied; low voiced ratio 43%

### pazer

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Chukat 19:13 | הַנֹּגֵ֡עַ | 2.71s | 86% | 0:2 · 1:1 · 2:1 · 3:2 · 6:1 · -5:1 · 2:1 · 0:3 |
| Bereshit 1:21 | הָֽרֹמֶ֡שֶׂת | 3.57s | 54% | 0:2 · -2:3 · 3:1 · 4:2 · 7:2 · 5:1 · 2:1 · 0:1 |
| Vayechi 48:15 | הָֽאֱלֹהִ֡ים | 3.72s | 85% | -2:4 · 1:1 · 3:1 · 5:1 · 7:1 · 5:1 · 2:1 · 0:3 |

- Chosen: example 2 (medoid, Σdist 5)
- Motif: `0:2 · -2:3 · 3:1 · 4:2 · 7:2 · 5:1 · 2:1 · 0:1`
- Warnings: note cap applied

### mercha_kefula

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Shemot 5:15 | תַעֲשֶׂ֦ה | 2.73s | 64% | 1:1 · 0:2 · 2:2 · 3:2 · 5:2 · 3:2 · 2:1 · 0:4 |
| Shemini 10:1 | לֹ֦א | 2.95s | 70% | 0:1 · 2:1 · 3:1 · 5:1 · 3:1 · 2:1 · 0:3 |
| Sh'lach 14:3 | ט֦וֹב | 2.42s | 71% | -2:2 · -3:2 · -2:2 · 0:2 · -1:1 · 0:1 · 2:1 · 0:2 |

- Chosen: example 2 (medoid, Σdist 6.67)
- Motif: `0:1 · 2:1 · 3:1 · 5:1 · 3:1 · 2:1 · 0:3`
- Warnings: (none)

### karnei_parah

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Masei 35:5 | בָּֽאַמָּ֟ה | 4.86s | 53% | 2:1 · 4:1 · 3:2 · 5:1 · 1:1 · 3:1 · 5:2 · 0:3 |

- Chosen: example 1 (medoid, Σdist 0)
- Motif: `2:1 · 4:1 · 3:2 · 5:1 · 1:1 · 3:1 · 5:2 · 0:3`
- Warnings: note cap applied

### yerach_ben_yomo

| Example | Word | Dur | Voiced% | Contour (p:d) |
|---|---|---|---|---|
| Masei 35:5 | אַלְפַּ֪יִם | 4.47s | 46% | 8:1 · 6:1 · 7:2 · 4:1 · 6:1 · 8:2 · 0:4 |

- Chosen: example 1 (medoid, Σdist 0)
- Motif: `8:1 · 6:1 · 7:2 · 4:1 · 6:1 · 8:2 · 0:4`
- Warnings: note cap applied; low voiced ratio 46%

## Smoke tests

**All smoke tests passed.**
