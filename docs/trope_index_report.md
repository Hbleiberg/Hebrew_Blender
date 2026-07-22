# Trope index build report

- **Built:** 2026-07-22
- **Source:** Sefaria public text export bucket (storage.googleapis.com/sefaria-export, Hebrew merged.json per Torah book)
- **Output:** `data/trope/trope_index.json` — 75,340 bytes (budget 256,000)
- **Aligned aliyot:** 320 of 378 (64,908 sung words)
- **Selection:** words whose in-range marks (U+0591–05AF) map to exactly one trope key
  (single-occurrence marks preferred), clip 0.35–4s (8s for
  rare-flagged marks, whose melodies are deliberately long), round-robin across
  parshiyot, cap 40/trope. Aliyah-final words are never selected (no end timing).
  Verse-final words with zero in-range marks are the positional `sof_pasuk` pool.

## Per-trope corpus counts

| Trope | Family | Candidates | Selected | Parshiyot | Rare |
|---|---|---|---|---|---|
| mercha | sofpasuk | 7216 | 40 | 40 |  |
| tipcha | sofpasuk | 9005 | 40 | 40 |  |
| munach | sofpasuk | 7340 | 40 | 40 |  |
| etnachta | sofpasuk | 4387 | 40 | 40 |  |
| sof_pasuk | sofpasuk | 4347 | 40 | 40 |  |
| mahpach | katon | 2437 | 40 | 40 |  |
| pashta | katon | 4358 | 40 | 40 |  |
| yetiv | katon | 302 | 40 | 40 |  |
| zakef_katon | katon | 5295 | 40 | 40 |  |
| zakef_gadol | katon | 379 | 40 | 40 |  |
| zarka | segol | 287 | 40 | 40 |  |
| segol | segol | 295 | 40 | 40 |  |
| shalshelet | segol | 3 | 3 | 3 | yes |
| revia | revia | 1989 | 40 | 40 |  |
| darga | revia | 899 | 40 | 40 |  |
| tevir | revia | 2156 | 40 | 40 |  |
| kadma | geresh | 1644 | 40 | 40 |  |
| geresh | geresh | 900 | 40 | 40 |  |
| geresh_muqdam | geresh | 0 | 0 | 0 | yes |
| gershayim | geresh | 406 | 40 | 40 |  |
| telisha_ketana | geresh | 375 | 40 | 40 |  |
| telisha_gedola | geresh | 204 | 40 | 40 |  |
| pazer | geresh | 92 | 40 | 34 |  |
| mercha_kefula | rare | 4 | 4 | 4 | yes |
| karnei_parah | rare | 1 | 1 | 1 | yes |
| yerach_ben_yomo | rare | 1 | 1 | 1 | yes |

## Excluded aliyot (58)

- Bereshit aliyah 4: word/timing count mismatch (288 words vs 285 timings)
- Bereshit aliyah 6: word/timing count mismatch (329 words vs 325 timings)
- Noach aliyah 2: word/timing count mismatch (230 words vs 227 timings)
- Noach aliyah 4: word/timing count mismatch (207 words vs 206 timings)
- Noach aliyah 6: word/timing count mismatch (411 words vs 408 timings)
- Lech Lecha aliyah 4: word/timing count mismatch (286 words vs 285 timings)
- Chayei Sara aliyah 4: word/timing count mismatch (383 words vs 382 timings)
- Toldot aliyah 1: word/timing count mismatch (273 words vs 272 timings)
- Toldot aliyah 5: word/timing count mismatch (402 words vs 401 timings)
- Toldot aliyah 6: word/timing count mismatch (359 words vs 358 timings)
- Vayetzei aliyah 3: word/timing count mismatch (377 words vs 376 timings)
- Vayishlach aliyah 6: word/timing count mismatch (461 words vs 459 timings)
- Vayeshev aliyah 6: word/timing count mismatch (247 words vs 246 timings)
- Miketz aliyah 3: word/timing count mismatch (220 words vs 212 timings)
- Miketz aliyah 6: word/timing count mismatch (202 words vs 201 timings)
- Vayigash aliyah 5: word/timing count mismatch (324 words vs 320 timings)
- Shemot aliyah 2: word/timing count mismatch (205 words vs 200 timings)
- Shemot aliyah 5: word/timing count mismatch (383 words vs 382 timings)
- Beshalach aliyah 5: word/timing count mismatch (204 words vs 202 timings)
- Beshalach aliyah 7: word/timing count mismatch (253 words vs 246 timings)
- Mishpatim aliyah 1: word/timing count mismatch (200 words vs 199 timings)
- Terumah aliyah 3: word/timing count mismatch (318 words vs 315 timings)
- Tetzaveh aliyah 2: word/timing count mismatch (242 words vs 239 timings)
- Tetzaveh aliyah 3: word/timing count mismatch (182 words vs 181 timings)
- Ki Tisa aliyah 4: word/timing count mismatch (86 words vs 80 timings)
- Ki Tisa aliyah 5: word/timing count mismatch (151 words vs 147 timings)
- Vayakhel aliyah 5: word/timing count mismatch (420 words vs 419 timings)
- Pekudei aliyah 2: word/timing count mismatch (263 words vs 262 timings)
- Tzav aliyah 1: word/timing count mismatch (166 words vs 162 timings)
- Tzav aliyah 3: word/timing count mismatch (373 words vs 364 timings)
- Kedoshim aliyah 2: word/timing count mismatch (125 words vs 120 timings)
- Emor aliyah 1: word/timing count mismatch (186 words vs 185 timings)
- Behar aliyah 5: word/timing count mismatch (141 words vs 140 timings)
- Bamidbar aliyah 1: word/timing count mismatch (161 words vs 157 timings)
- Nasso aliyah 6: word/timing count mismatch (330 words vs 332 timings)
- Beha'alotcha aliyah 4: word/timing count mismatch (256 words vs 253 timings)
- Beha'alotcha aliyah 5: word/timing count mismatch (254 words vs 256 timings)
- Sh'lach aliyah 4: word/timing count mismatch (356 words vs 355 timings)
- Korach aliyah 1: word/timing count mismatch (186 words vs 185 timings)
- Chukat aliyah 7: word/timing count mismatch (225 words vs 224 timings)
- Balak aliyah 1: word/timing count mismatch (188 words vs 185 timings)
- Balak aliyah 5: word/timing count mismatch (178 words vs 177 timings)
- Pinchas aliyah 1: word/timing count mismatch (178 words vs 167 timings)
- Pinchas aliyah 2: word/timing count mismatch (443 words vs 442 timings)
- Matot aliyah 6: word/timing count mismatch (261 words vs 260 timings)
- Masei aliyah 3: word/timing count mismatch (306 words vs 305 timings)
- Va'etchanan aliyah 4: word/timing count mismatch (262 words vs 261 timings)
- Eikev aliyah 6: word/timing count mismatch (177 words vs 173 timings)
- Shoftim aliyah 7: word/timing count mismatch (306 words vs 305 timings)
- Ki Teitzei aliyah 2: word/timing count mismatch (161 words vs 157 timings)
- Ki Teitzei aliyah 3: word/timing count mismatch (414 words vs 409 timings)
- Ki Tavo aliyah 5: word/timing count mismatch (239 words vs 234 timings)
- Ki Tavo aliyah 6: word/timing count mismatch (935 words vs 933 timings)
- Nitzavim aliyah 3: word/timing count mismatch (249 words vs 248 timings)
- Ha'azinu aliyah 1: word/timing count mismatch (67 words vs 63 timings)
- Ha'azinu aliyah 3: word/timing count mismatch (68 words vs 67 timings)
- V'Zot HaBerachah aliyah 1: word/timing count mismatch (80 words vs 79 timings)
- V'Zot HaBerachah aliyah 6: word/timing count mismatch (48 words vs 44 timings)

## Zarka codepoint finding

Unicode's ZARQA (U+0598) and ZINOR (U+05AE) names are swapped relative to traditional
usage. Empirically, in this corpus the segol-clause zarka is carried by **U+05AE (Unicode "ZINOR")**
(verse-level co-occurrence with segol U+0592 shown below); the index maps BOTH codepoints
to the `zarka` key, and the tutor displays the dominant one.

| Book | U+0598 | U+05AE | segol U+0592 | verses w/ segol+U+0598 | verses w/ segol+U+05AE |
|---|---|---|---|---|---|
| Genesis | 13 | 73 | 90 | 13 | 72 |
| Exodus | 15 | 82 | 101 | 15 | 81 |
| Leviticus | 7 | 56 | 65 | 7 | 55 |
| Numbers | 10 | 96 | 117 | 10 | 96 |
| Deuteronomy | 14 | 68 | 78 | 14 | 68 |

Stray poetic accents U+05AB/U+05AC/U+05AD: none found.

## Genesis 1:1 smoke test

Words (aliyah word indices 0–6): בְּרֵאשִׁ֖ית · בָּרָ֣א · אֱלֹהִ֑ים · אֵ֥ת · הַשָּׁמַ֖יִם · וְאֵ֥ת · הָאָֽרֶץ׃

- word 0 carries tipcha U+0596: ✓
- word 1 carries munach U+05A3: ✓
- word 2 carries etnachta U+0591: ✓
- final word bare of in-range marks (positional sof_pasuk): ✓

**All smoke tests passed.**
