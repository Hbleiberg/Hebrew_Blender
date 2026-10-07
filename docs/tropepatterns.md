# Trope patterns — the printed cantillation charts, transcribed

The Trope Tutor's Learn-card staffs follow the standard Ashkenazi melodies as printed in two books.
The teacher's cantillation chart — Appendix H, *Torah Cantillation* (41 numbered phrase patterns,
treble clef, three sharps = A major), the source of `data/trope/trope_motifs.json`, and *High Holiday
Torah Cantillation* (33 patterns, no key signature), the source of `data/trope/trope_motifs_hh.json` —
gives sections B and C. *The Art of Cantillation, Volume 2* (Marshall Portnoy and Josée Wolff, UAHC
Press, 2001) gives the Haftarah chart of section H (Appendix D: 40 patterns, three flats = E♭ major),
the source of `data/trope/trope_motifs_haftarah.json`, the Esther chart of section I (Appendix E:
41 patterns, three flats = E♭ major), the source of `data/trope/trope_motifs_esther.json`, and the chart
for Shir HaShirim, Ruth and Kohelet of section J (Appendix F: 39 patterns and an end-of-book setting,
no key signature), the source of `data/trope/trope_motifs_megillot.json`, and the Eicha chart of
section K (Appendix G: 38 patterns, three flats = E♭ major), the source of
`data/trope/trope_motifs_eicha.json`. This file is the transcription of those pages, every row note
for note, read from scans of the charts. The scans are not in the repository (the pages
are copyrighted; they live in the gitignored `source-data/charts/`); the melodies themselves are
traditional. This transcription is CC BY-SA 4.0, like the data files it feeds.

**Sections B, C and H–K are data.** `node scripts/build-trope-phrases.mjs` reads their row blocks and writes
`data/trope/trope_phrases.json` — every row's notes, syllables, triplets, ties and slurs, the input for
a staff of a whole parasha (section G) — together with `docs/trope_phrases_report.md`, which lists
every figure of every mark in every context the chart prints and checks the tutor's staffs against
their rows. To change a note, edit its row here and re-run the builder; never edit the JSON.

## How to read this file

- **Pitches** are scientific pitch names as printed in the treble clef: C4 is middle C, A3 the A
  below it, so the Torah chart lives between A3 and B4, the High Holiday chart between G3 and
  B♭4, the Haftarah chart between B♭3 and C5, the Esther chart between B♭3 and E♭5, the Megillot
  chart between C4 and D5 and the Eicha chart between B♭3 and C5 (men sing all of them an octave
  lower).
- **Key and accidentals.** In the Torah chart every F, C and G is sharp unless a natural sign is
  printed; the rows write every one of them with its sign (`F♯4`, `C♯4`, `G♮4`), so a letter without
  one cannot pass for a misreading, and the builder refuses any accidental the chart does not print.
  A row has no bar lines, so a printed accidental holds to the end of its row: mercha kefula's second
  G carries no sign and is G♮ (row 39). The High Holiday chart has no key signature and prints each
  accidental where it wants one: a flat on `B♭`, and one sharp, on telisha ketana's `F♯`. The Haftarah
  chart has three flats and prints no accidental, so every B, E and A carries its sign (`B♭4`, `E♭4`,
  `A♭4`; a natural would be written too, and none occurs) and no other sign appears (section H). The
  Esther chart has three flats too and prints one accidental, the E♮ of its segol clause (rows 35–39,
  41), so every B, E and A carries its sign (`B♭4`, `E♭4`, `A♭4`, `E♮4`) and no other sign appears
  (section I). The
  Megillot chart has no key signature and prints no accidental at all (section J). The Eicha chart
  has three flats, like the Haftarah chart, and prints one accidental, the E♮ of its segol clause
  (rows 34–37), so every B, E and A carries its sign and no other sign appears (section K).
- **Scale degrees** are given relative to A for the Torah chart (A = 1, B = 2, C♯ = 3, D = 4,
  E = 5, F♯ = 6, G♯ = 7; ′ is the octave above). The tutor stores `p` = semitones from B4 (B♭4 = −1,
  A4 = −2, G4 = −4, F♯4 = −5, F4 = −6, E4 = −7, D4 = −9, C♯4 = −10, C4 = −11, B3 = −12, A3 = −14,
  G3 = −16).
- **The row blocks** (sections B, C and H–K) are fenced ` ```trope-torah ` / ` ```trope-hh ` /
  ` ```trope-haftarah ` / ` ```trope-esther ` / ` ```trope-megillot ` / ` ```trope-eicha ` blocks:

  ```
  #<row> [tag] <the Hebrew names, pointed and marked as printed>
  <mark>  <SYL>[-] <note> <note> … <SYL>[-] <note> …
  ```

  - The first line is the row number (High Holiday row 20's parenthesized second setting is `#20b`,
    and the Megillot chart's "(end of book)" setting of its row 39 is `#39a`; neither is given Hebrew
    of its own, so each repeats its row's). Then come the tags, right after
    the number and in lowercase: `[aliyah-end]` for the closing formula of an aliyah's last verse
    (Torah 41, High Holiday 30–33, Haftarah 40 and its derived 40b–40d, Esther 41, Megillot 39 and
    39a and Eicha 38 — the end of a chapter, or of the book, in a book read without aliyot),
    `[unverified]` for a
    row that
    has not been checked against a printed chart (no row carries it today), and `[derived]` for a
    row the chart does not print but a reader derives from a printed one: its number is the printed
    row's plus a letter, it carries that row's tags, and its marks are the printed row's in order with
    some left out, each unit kept note for note (the builder checks all of this).
    Then the Hebrew exactly as printed, with its points, dagesh and marks on the letters where the
    chart puts them (High Holiday row 12, whose printed line is a misprint, follows its staff; see
    section C). It holds no brackets or Latin letters, and its marks must name the same marks as the
    lines below, one for one: ׃ counts as sof pasuk, a ׀ after a munach makes it munach legarmeh,
    and telisha gedola, printed at both ends of its name, counts once.
  - Then one line per mark, left to right as printed. The mark is the tutor's key (`TROPES` in
    `js/trope-staff.js`, the staff engine both pages load) or `munach_legarmeh`.
  - A syllable (MER, CHA, T′ …) starts at the note printed above it and runs to the next syllable; a
    `-` after it means the next syllable continues the same word. Each mark's line is whole words, so
    its last syllable has no `-`, and every syllable has at least one sounding note.
  - A note is `PITCH(VALUE)`, with `,>` for an accent and `,-` for a tenuto line. Values: `64` a
    sixty-fourth (only the Megillot telishas, rows 29–30 of section J), `32` a thirty-second, `s` a
    sixteenth, `ds` a dotted sixteenth, `e` an eighth, `de` a dotted eighth, `q` a quarter, `dq` a
    dotted quarter, `h` a half, `dh` a dotted half, `g` a grace note (small; no time of its own).
    `rest(e)` is a rest.
  - Before a note, `~` is a slur arriving from the note before, `~~` a dashed slur, `=` a tie (one
    held sound) and `~=` a tie under a slur. A tie stays inside one mark's line and never touches a
    grace note, and a slur never arrives from a rest.
  - `N{` … `}` wraps a printed bracket of N notes. `3{` is a triplet: at least two sounding notes whose
    written values add up to three of one value, sung in the time of two (usually three eighths or three
    sixteenths; High Holiday rows 5–6 write e e s s). Any other number (the charts print 4, 5, 6, 8 and
    11) is the book's bracket over a run of exactly that many notes, grace notes aside: it groups the run
    and implies no ratio, so the notes keep their written values (a printed 6 sits over e e e s s s as
    readily as over six eighths). The values inside are the printed ones, and a bracket may run from one
    mark's line into the next.
  - Beams are not written: they follow from the values.

## A. One figure per mark (the Learn-card staffs)

Each Learn card draws one figure per melody: the mark's line in the row named below. For a
disjunctive that is usually a row where it stands alone or ends the phrase; a connecting mark, and
pashta, tipcha, yetiv and zarka, which never end a row, come from a row where they lead into their
usual partner. The staff has four values (`d` 1–4: eighth, quarter,
dotted quarter, half), so a row is read onto it like this: a grace note becomes an eighth, tied notes
become one held note, rests drop, anything shorter than a quarter is drawn as an eighth (a dotted
eighth or a triplet note included), and a longer note takes the nearest of the other three values.
The builder checks every staff against its row on each run (`docs/trope_phrases_report.md` → *The
Trope Tutor's staffs against their rows*); the figures themselves, for every melody and in every
context, are listed in the same report.

| Mark (tutor key) | Torah row | High Holiday row | Haftarah row | Esther row | Megillot row | Eicha row | On the staff |
|---|---|---|---|---|---|---|---|
| mercha | 1 | 1 | 1 | 1 | 1 | 1 | |
| tipcha | 4 | 4 | 4 | 4 | 4 | 4 | |
| munach (before etnachta) | 2 | 2 | 2 | 2 | 2 | 2 | |
| etnachta | 4 | 4 | 4 | 4 | 4 | 4 | |
| sof_pasuk | 8 | 8 | 8 | 8 | 8 | 8 | |
| mahpach | 11 | 11 | 11 | 11 | 11 | 11 | |
| pashta | 13 | 10 | 13 | 13 | 13 | 13 | |
| yetiv | 33 | 24 | 34 | 34 | 34 | 33 | Y′ is sung on a grace note, drawn as an eighth |
| zakef_katon | 13 | 10 | 13 | 13 | 13 | 13 | |
| zakef_gadol | 31 | 25 | 32 | 32 | 32 | 31 | |
| zarka | 37 | 29 | 38 | 38 | 38 | 37 | Torah: the grace note on F♯4 before KA is drawn as an eighth |
| segol | 37 | 29 | 38 | 38 | 38 | 37 | |
| shalshelet | 38 | — | — | — | — | — | |
| revia | 19 | 16 | 19 | 19 | 19 | 19 | |
| darga | 21 | 13 | 22 | 22 | 22 | 22 | |
| tevir | 22 | 13 | 23 | 23 | 23 | 23 | |
| kadma (in kadma v'azla) | 15 | 20 | 15 | 15 | 15 | 15 | |
| geresh (azla) | 16 | 21 | 16 | 16 | 16 | 16 | |
| gershayim | 20 | 22 | 20 | 20 | 20 | 20 | |
| telisha_ketana | 29 | 18 | 30 | 30 | 30 | 30 | Torah: T′ is sung on a grace note, drawn as an eighth |
| telisha_gedola | 28 | 17 | 29 | 29 | 29 | 29 | Torah: as telisha ketana |
| pazer | 30 | 19 | 31 | 31 | 31 | — | Torah: PA-ZER's two D4s are held as one quarter — the maintainer's correction of the print; the High Holiday staff keeps both |
| mercha_kefula | 39 | — | 39 | — | — | — | |
| karnei_parah | 40 | — | — | 40 | — | — | |
| yerach_ben_yomo | 40 | — | — | 39 | — | — | |
| munach legarmeh (no card) | 17 | 15 | 17 | 17 | 17 | 17 | |
| sof pasuk at the end of an aliyah (no card) | 41 | 30–33 | 40, 40b–40d | 41 | 39, 39a | 38 | |

`geresh_muqdam` has no figure in either chart and no entry (it never occurs in the Torah text either;
see section G). Shalshelet, mercha kefula, karnei parah and yerach ben yomo have no High Holiday row:
they never occur in the Rosh Hashanah or Yom Kippur readings (the census in section G checks this).
The Haftarah column names section H's rows: shalshelet, karnei parah and yerach ben yomo have no
Haftarah row (the chart prints none, so a haftarah word carrying one draws no notes), and the builder
derives `data/trope/trope_motifs_haftarah.json` from the column (section H) rather than checking a
hand-edited file. The Esther column names section I's rows the same way: shalshelet and mercha kefula
have no Esther row (the chart prints none), karnei parah and yerach ben yomo have one each (rows 40
and 39), and `data/trope/trope_motifs_esther.json` is derived from the column. The Megillot column
names section J's rows: shalshelet, mercha kefula, karnei parah and yerach ben yomo have no row there
(the chart prints none), and `data/trope/trope_motifs_megillot.json` is derived from the column. The
Eicha column names section K's rows: pazer has no Eicha row either — the chart prints none, which is
why its rows from zakef gadol on are numbered one lower than the Haftarah chart's — nor have
shalshelet, mercha kefula, karnei parah and yerach ben yomo, and `data/trope/trope_motifs_eicha.json`
is derived from the column.

The lowered seventh is printed with a natural sign (G♮) in the Torah chart's darga, telisha gedola,
pazer, mercha kefula and karnei parah, and on the munach before zarka (rows 34–35); the High Holiday
chart writes it B♭ (pazer, kadma v'azla, geresh). Articulation is printed, not left to the reader:
accents on shalshelet's B4, zarka's C♯4 and karnei parah's E4 and A4, tenuto lines on pazer's
B4 A4 F♯4 and zakef gadol's ZA-KEF-GA; in the High Holiday chart, accents on the last three notes of
zakef gadol and pazer and tenuto dashes on zarka's closing B3 A3 G3; in the Esther chart, accents on
tevir's last three notes (23–28), tenuto dashes on telisha gedola's last three (29) and a marcato
wedge over yetiv's TIV (33–34), written `>` in the rows; in the Megillot chart, tenuto dashes on zakef
katon's TON (9–14) and on telisha gedola's last three notes (29); in the Eicha chart, tenuto dashes on
the last three notes of etnachta and sof pasuk (1–8), revia (17–19), tevir (23–28) and zakef gadol
(31). The staffs do not draw these marks.

## B. The 41 Torah phrase patterns

Read note for note from the clean scans, once by hand and once more independently; the two readings
were compared note by note and every difference was settled at 8–12× zoom, and every row was then
engraved back from the data and laid under its scan. A pixel note-head detector agreed with every
pitch it could measure.

```trope-torah
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
munach    MU- E4(e) NACH D4(e) ~B3(e)
etnachta  ET- A3(s) NACH- A3(s) TA E4(q)
```

```trope-torah
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
munach    MU- E4(e) NACH D4(e) ~B3(e)
etnachta  ET- A3(s) NACH- A3(s) TA E4(q)
```

```trope-torah
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
etnachta  ET- A3(s) NACH- A3(s) TA E4(q)
```

```trope-torah
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
etnachta  ET- A3(s) NACH- A3(s) TA E4(q)
```

```trope-torah
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
mercha    MER- C♯4(e) CHA E4(e)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
mercha    MER- C♯4(e) CHA E4(e)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma     KAD- D4(e) MA F♯4(dq)
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#10 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#12 פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#13 פַּשְׁטָא֙ קָטֹ֔ן
pashta    PASH- D4(e) TA A4(dq)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#14 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
munach    MU- A4(e) NACH A4(s) ~F♯4(s) ~A4(de)
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#15 קַדְמָ֨א וְאַזְלָ֜א
kadma     KAD- A3(e) MA D4(e)
geresh    V'- D4(s) AZ- F♯4(s) LA A4(e) ~F♯4(e) ~B4(e) ~A4(e)
```

```trope-torah
#16 גֵּ֜רֵשׁ
geresh    GE- A4(e) ~F♯4(e) ~B4(q) RESH A4(e)
```

```trope-torah
#17 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- D4(e) NACH D4(s) ~E4(s) ~F♯4(s) ~D4(s) ~E4(q) rest(e)
munach    MU- E4(e) NACH 3{~A4(e) ~F♯4(e)
revia     R'VI- F♯4(e)} I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#18 מֻנָּ֣ח רְבִיעִ֗י
munach    MU- E4(e) NACH 3{~A4(e) ~F♯4(e)
revia     R'VI- F♯4(e)} I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#19 רְבִיעִ֗י
revia     R'VI- F♯4(e) I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#20 גֵּרְשַׁיִ֞ם
gershayim GER- D4(e) SHA- E4(e) YIM F♯4(de) 3{~E4(32) ~D4(32) ~E4(32)} ~F♯4(e)
```

```trope-torah
#21 דַּרְגָּ֧א
darga     DAR- F♯4(e) GA A4(e) ~G♮4(s) ~F♯4(s) ~E4(e)
```

```trope-torah
#22 תְּבִ֛יר
tevir     T'- E4(e) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#23 דַּרְגָּ֧א תְּבִ֛יר
darga     DAR- F♯4(e) GA A4(e) ~G♮4(s) ~F♯4(s) ~E4(de)
tevir     T'- E4(s) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#24 מֵרְכָ֥א תְּבִ֛יר
mercha    MER- F♯4(e) CHA A4(e) ~E4(e)
tevir     T'- E4(s) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#25 קַדְמָ֨א דַּרְגָּ֧א תְּבִ֛יר
kadma     KAD- D4(e) MA F♯4(de)
darga     DAR- F♯4(s) GA A4(e) ~G♮4(s) ~F♯4(s) ~E4(de)
tevir     T'- E4(s) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#26 קַדְמָ֨א מֵרְכָ֥א תְּבִ֛יר
kadma     KAD- D4(e) MA F♯4(de)
mercha    MER- F♯4(s) CHA A4(e) ~E4(e)
tevir     T'- E4(e) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#27 מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach    MU- A4(e) NACH A4(s) ~F♯4(s) ~A4(de)
darga     DAR- F♯4(s) GA A4(e) ~G♮4(s) ~F♯4(s) ~E4(de)
tevir     T'- E4(s) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#28 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
telisha_gedola T'- D4(g) LI- D4(e) SHA D4(e) G'DO- D4(e) LA D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(e) ~F♯4(e) ~E4(e) ~D4(q)
```

```trope-torah
#29 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
telisha_ketana T'- D4(g) LI- D4(e) SHA D4(e) K'TA- D4(e) NA D4(s) ~C♯4(s) ~D4(s) ~E4(s) ~D4(e)
```

```trope-torah
#30 מֻנָּ֣ח פָּזֵ֡ר
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
pazer     PA- D4(e) ZER D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(s) ~B4(e,-) ~A4(e,-) ~F♯4(e,-) ~E4(q)
```

```trope-torah
#31 זָקֵף גָּד֕וֹל
zakef_gadol ZA- D4(e,-) KEF D4(e,-) GA- F♯4(e,-) DOL A4(e) ~B4(s) ~A4(s) ~F♯4(e) ~E4(q)
```

```trope-torah
#32 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv     Y'- B4(g) TIV B4(q) ~A4(de)
munach    MU- F♯4(s) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#33 יְ֚תִיב קָטֹ֔ן
yetiv     Y'- B4(g) TIV B4(q) ~A4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#34 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach    MU- G♮4(e) NACH F♯4(e) ~E4(e)
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
munach    MU- A3(e) NACH D4(e) =D4(s)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#35 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach    MU- G♮4(e) NACH F♯4(e) ~E4(e)
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#36 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
munach    MU- A3(e) NACH D4(e) =D4(s)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#37 זַרְקָא֮ סֶגּוֹל֒
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#38 שַׁלְשֶׁ֓לֶת
shalshelet SHAL- D4(e) SHE- D4(s) ~F♯4(s) ~A4(s) ~F♯4(s) ~D4(s) ~F♯4(s) ~A4(s) ~F♯4(s) ~D4(s) ~F♯4(s) ~A4(s) ~F♯4(s) B4(q,>) LET A4(q)
```

```trope-torah
#39 מֵרְכָא כְּפוּלָ֦ה
mercha_kefula MER- E4(e) CHA E4(e) CH'FU- E4(e) LA E4(e) ~F♯4(e) ~G♮4(e) ~A4(e) ~G♮4(e) ~F♯4(e) ~E4(q)
```

```trope-torah
#40 יָרֵחַ בֶּן יוֹמ֪וֹ קַרְנֵי פָּרָה֟
yerach_ben_yomo YE- D4(s) RACH D4(s) BEN- D4(s) YO- D4(s) MO F♯4(q) ~E4(q)
karnei_parah KAR- D4(e) NEI D4(e) FA- 3{D4(s) RA ~C♯4(s) ~D4(s)} ~E4(e,>) ~D4(e) D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(e,>) ~F♯4(e) ~E4(e) ~D4(q)
```

```trope-torah
#41 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- B3(e) CHA 3{D4(e) ~C♯4(e)
tipcha    TIP- B3(e)} CHA B4(e) ~F♯4(q)
mercha    MER- D4(e) CHA 3{D4(e)
sof_pasuk SOF- E4(e) PA- F♯4(e)} E4(g) F♯4(g) SUK E4(h) ~B3(h)
```

**What the clean scans changed.** The earlier reading of this chart came from rougher photographs.
Against it, the clean scans show:

- **Closing notes held.** Mahpach's closing D4 (rows 9–11, 14), tevir's closing E4 (22–27),
  telisha gedola's closing D4 (28), pazer's closing E4 (30), zarka's closing A3 (34–37) and karnei
  parah's closing D4 (40) are quarter notes.
- **Tevir's VIR** is a triplet of quarters, D4 C♯4 D4 (22–27).
- **Faster runs.** Revia's D4 C♯4 (17–19) and gershayim's E4 D4 E4 (20) are thirty-seconds.
  Telisha gedola's run opens with four sixteenths, D4 E4 F♯4 G♮4 (28), and shalshelet's run is
  sixteenths (38), with LET printed under the closing A4. Zakef gadol's B4 A4 are sixteenths, and
  GA carries a tenuto line like ZA and KEF (31).
- **Yetiv** (32–33): Y′ is sung on a grace note on B4, which the earlier reading took for an eighth
  rest. It is the same device as the High Holiday yetiv's Y′.
- **Zarka** (34–37): the accent sits on the C♯4 before the closing A3. The grace F♯4 is printed
  before KA, and KA starts on the dotted E4.
- **Munach before segol** (34, 36): the A3 is an eighth, and the D4 after it is tied into a sixteenth.
- **Karnei parah** (40): FA's triplet (D4 C♯4 D4) is followed by an accented E4 and a D4 before
  the closing run. The earlier reading missed the E4. RA is printed under the triplet's C♯4.
- **Smaller rhythm corrections**, none of which reaches a staff: zakef katon's KA is a sixteenth,
  not an eighth (rows 9–14, 32); the mercha before tevir ends on an eighth, not a dotted eighth (24,
  26); T′ is an eighth in row 26; telisha ketana's run is in sixteenths (29); zarka's accented C♯4 is
  an eighth (34–37); karnei parah's accented A4 and the F♯4 E4 after it are eighths (40); and in row
  41 a triplet runs from the second mercha's CHA into sof pasuk.
- **Row 41 is settled.** Its last note is B3: measured 1½ spaces below the staff, where the print
  leaves out the ledger line. The two small notes between PA and SUK are grace notes, E4 F♯4.

The tutor's staffs were corrected to match (section E).

## C. The 33 High Holiday phrase patterns

The set has no key signature and sits on C/D: its sof pasuk ends on C4, its etnachta on D4. Its
accidentals are the B♭4 of pazer, kadma v'azla and geresh (rows 19–21; B3 below stays natural) and
the F♯ in telisha ketana's run (row 18). Rows 1–8 pair with Torah rows 1–8, and rows 30–33 are
the end-of-aliyah endings. Row 20 prints a second, parenthesized setting of kadma v'azla, given
here as `#20b`.

These rows were read in the same two independent passes as section B, with every difference settled
at 8–12×.

**What the clean scans changed.** The earlier table here was a first pass, "pitch by pitch from the
photographs with the rhythm sketched". The per-mark figures had already been re-read from zoomed crops,
and all but one stand; the rhythm is now as printed:

- **Dotted pairs.** For example etnachta's TA is F4 E4 as a dotted eighth and a sixteenth.
- **Thirty-second runs.** Revia's I, zarka's KA, segol's GOL, gershayim's YIM, tevir's VIR and the
  end-of-aliyah tipcha.
- **Triplets that run from one mark into the next.** Munach into etnachta (rows 1–2), mercha into
  sof pasuk (5–6), munach into zarka (26, 28), mercha into tipcha (30–31) and kadma into azla (20b).
- **Rests.** An eighth rest follows pashta (9–12), munach legarmeh (15), the munach before the
  telishas and pazer (17–19), yetiv (23–24), zarka (26–29) and the end-of-aliyah tipcha (30–33).

Notes that differ from the earlier readings (the first-pass table, or the per-mark figures re-read
from zoomed crops):

- **The munach before the telishas and pazer** (17–19) is C4, then E4 D4. The C4 is an eighth: the
  figure re-reading took it for a grace note, and the first pass left it out.
- **The munach before revia** (15–16) holds its G4: a quarter tied to an eighth in row 15, two tied
  eighths in row 16.
- **Munach legarmeh** (15) is D4 B3 D4 in eighths.
- **The end-of-aliyah rows** (30–33). Tipcha's CHA is an A4 tied into a thirty-second run,
  A4 G4 F4 E4, then D4. The mercha before sof pasuk is E4 F4 E4, not D4 D4 E4 (row 30) or E4 D4 E4
  (row 32).
- **Row 20b** (the second kadma v'azla) ends A4 G4, the G4 a dotted quarter. There is no E4.
- **Zarka's closing B3 A3 G3** each carry a short dash above the stem, read as a tenuto. The
  first pass took these dashes for notes.
- **Segol** (26–29). SE is a sixteenth, and GOL's G4 is tied into the first note of its run under
  the long slur, so the figure sings two G4s, not the figure re-reading's three. All four rows print
  the same figure. Its closing D4 is tied into a quarter. The High Holiday segol staff was corrected
  (section E).

**One misprint in the chart:** row 12's Hebrew line repeats row 9's words (קַדְמָא מַהְפַּךְ פַּשְׁטָא
מֻנַּח קָטֹן), but its staff sings MU-NACH MA-PACH PASH-TA KA-TON. The block's header follows the staff.

```trope-hh
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- D4(e) CHA D4(de)
tipcha    TIP- D4(s) CHA G4(e) ~D4(q)
munach    MU- D4(e) NACH 3{C4(e)
etnachta  ET- C4(e) NACH- C4(e)} TA F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- D4(s) CHA G4(e) ~D4(q)
munach    MU- D4(e) NACH 3{C4(e)
etnachta  ET- C4(e) NACH- C4(e)} TA F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- D4(e) CHA D4(de)
tipcha    TIP- D4(s) CHA G4(e) ~D4(q)
etnachta  ET- C4(s) NACH- C4(s) TA F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- D4(s) CHA G4(e) ~D4(q)
etnachta  ET- C4(s) NACH- C4(s) TA F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- D4(e) CHA D4(de)
tipcha    TIP- E4(s) CHA F4(s) ~G4(s) ~E4(e)
mercha    MER- D4(e) CHA 3{D4(e) ~C4(e)
sof_pasuk SOF- B3(s) PA- B3(s)} SUK B3(s) ~D4(s) ~C4(e) ~=C4(q)
```

```trope-hh
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- E4(s) CHA F4(s) ~G4(s) ~E4(e)
mercha    MER- D4(e) CHA 3{D4(e) ~C4(e)
sof_pasuk SOF- B3(s) PA- B3(s)} SUK B3(s) ~D4(s) ~C4(e) ~=C4(q)
```

```trope-hh
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- D4(e) CHA D4(de)
tipcha    TIP- E4(s) CHA F4(s) ~G4(s) ~E4(e)
sof_pasuk SOF- B3(s) PA- B3(s) SUK B3(s) ~D4(s) ~C4(e) ~=C4(q)
```

```trope-hh
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- F4(s) CHA F4(s) ~G4(s) ~E4(e)
sof_pasuk SOF- B3(s) PA- B3(s) SUK B3(s) ~D4(s) ~C4(e) ~=C4(q)
```

```trope-hh
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma     KAD- D4(e) MA G4(de)
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
munach    MU- F4(e) NACH F4(s) ~D4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(e) ~D4(dq)
```

```trope-hh
#10 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
kadma     KAD- D4(e) MA G4(de)
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
zakef_katon KA- G4(e) TON G4(e) ~D4(dq)
```

```trope-hh
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
munach    MU- F4(e) NACH F4(s) ~D4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(e) ~D4(dq)
```

```trope-hh
#12 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
munach    MU- G4(e) NACH G4(s) ~F4(s) ~G4(s)
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
zakef_katon KA- G4(e) TON G4(e) ~D4(dq)
```

```trope-hh
#13 דַּרְגָּ֧א תְּבִ֛יר
darga     DAR- D4(e) GA A4(s) ~G4(s) ~F4(s) ~E4(s) ~D4(q) ~=D4(e)
tevir     T'- D4(e) VIR D4(de) ~C4(32) ~D4(32) ~F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#14 מֵרְכָ֥א תְּבִ֛יר
mercha    MER- D4(e) CHA A4(e) ~D4(q)
tevir     T'- D4(e) VIR D4(de) ~C4(32) ~D4(32) ~F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#15 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- D4(e) NACH B3(e) ~D4(e) rest(e)
munach    MU- D4(e) NACH D4(s) ~A4(s) ~G4(q) ~=G4(e)
revia     R'- G4(e) VI- G4(e) I G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) ~D4(e) ~C4(q)
```

```trope-hh
#16 מֻנָּ֣ח רְבִיעִ֗י
munach    MU- D4(e) NACH D4(s) ~A4(s) ~G4(e) ~=G4(e)
revia     R'- G4(e) VI- G4(e) I G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) ~D4(e) ~C4(q)
```

```trope-hh
#17 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach    MU- C4(e) NACH E4(e) ~D4(e) rest(e)
telisha_gedola T'- D4(32) LI- D4(32) SHA- D4(32) G'DO- D4(32) LA D4(s) ~E4(s) ~F4(s) ~G4(s) ~F4(s) ~E4(s) ~D4(q)
```

```trope-hh
#18 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach    MU- C4(e) NACH E4(e) ~D4(e) rest(e)
telisha_ketana T'- D4(32) LI- D4(32) SHA- D4(32) K'TA- D4(32) NAH G4(s) ~F♯4(s) ~G4(s) ~D4(s) ~=D4(q)
```

```trope-hh
#19 מֻנָּ֣ח פָּזֵ֡ר
munach    MU- C4(e) NACH E4(e) ~D4(e) rest(e)
pazer     PA- D4(e) ZER D4(s) ~E4(s) ~F4(s) ~G4(s) ~A4(s) ~B♭4(s) ~A4(s) ~G4(s) 3{~F4(s) ~E4(s) ~D4(s)} ~G4(e,>) ~E4(e,>) ~D4(q,>)
```

```trope-hh
#20 קַדְמָ֨א וְאַזְלָ֜א
kadma     KAD- D4(e) MA G4(e)
geresh    V'- G4(e) AZ- A4(e) LA 3{B♭4(e) ~A4(e) ~G4(e)} ~A4(e) ~G4(q)
```

```trope-hh
#20b קַדְמָ֨א וְאַזְלָ֜א
kadma     KAD- D4(e) MA 3{G4(e)
geresh    V'- G4(e) AZ- G4(e)} LA A4(e) ~G4(dq)
```

```trope-hh
#21 גֵּ֜רֵשׁ
geresh    GE- 3{B♭4(e) ~A4(e) ~G4(e)} ~A4(e) RESH G4(q)
```

```trope-hh
#22 גֵּרְשַׁיִ֞ם
gershayim GER- D4(e) SHA- D4(e) YIM D4(32) ~E4(32) ~F4(32) ~C4(32) ~G4(e) ~=G4(q)
```

```trope-hh
#23 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv     Y'- A4(g) TIV A4(e) ~G4(e) rest(e)
munach    MU- F4(e) NACH F4(s) ~D4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(e) ~D4(q)
```

```trope-hh
#24 יְ֚תִיב קָטֹ֔ן
yetiv     Y'- A4(g) TIV A4(e) ~G4(e) rest(e)
zakef_katon KA- G4(32) TON G4(e) ~D4(q)
```

```trope-hh
#25 זָקֵף גָּד֕וֹל
zakef_gadol ZA- 3{D4(e) KEF D4(e) GA- D4(e)} DOL A4(s) ~G4(s) ~F4(s) ~E4(s) ~F4(e,>) ~E4(e,>) ~D4(q,>)
```

```trope-hh
#26 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach    MU- C4(e) NACH 3{E4(e) ~D4(e)
zarka     ZAR- D4(e)} KA D4(e) ~D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
munach    MU- D4(e) NACH G4(de)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#27 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka     ZAR- D4(e) KA D4(e) ~D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
munach    MU- D4(e) NACH G4(de)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#28 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach    MU- C4(e) NACH 3{E4(e) D4(e)
zarka     ZAR- D4(e)} KA D4(e) ~=D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#29 זַרְקָא֮ סֶגּוֹל֒
zarka     ZAR- D4(e) KA D4(e) ~D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#30 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- 3{D4(e) CHA D4(e)
tipcha    TIP- D4(e)} CHA A4(e) ~=A4(32) ~G4(32) ~F4(32) ~E4(32) ~D4(q) rest(e)
mercha    MER- E4(e) CHA F4(e) ~E4(q)
sof_pasuk SOF- D4(e) PA- E4(e) SUK E4(s) ~D4(s) ~C4(s) ~B3(s) ~D4(e) ~C4(q)
```

```trope-hh
#31 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- 3{D4(e) CHA D4(e)
tipcha    TIP- D4(e)} CHA A4(e) ~=A4(32) ~G4(32) ~F4(32) ~E4(32) ~D4(q) rest(e)
sof_pasuk SOF- D4(e) PA- E4(e) SUK E4(s) ~D4(s) ~C4(s) ~B3(s) ~D4(e) ~C4(q)
```

```trope-hh
#32 [aliyah-end] טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- A4(e) CHA A4(e) ~=A4(32) ~G4(32) ~F4(32) ~E4(32) ~D4(q) rest(e)
mercha    MER- E4(e) CHA F4(e) ~E4(q)
sof_pasuk SOF- D4(e) PA- E4(e) SUK E4(s) ~D4(s) ~C4(s) ~B3(s) ~D4(e) ~C4(q)
```

```trope-hh
#33 [aliyah-end] טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- A4(e) CHA A4(e) ~=A4(32) ~G4(32) ~F4(32) ~E4(32) ~D4(q) rest(e)
sof_pasuk SOF- D4(e) PA- E4(e) SUK E4(s) ~D4(s) ~C4(s) ~B3(s) ~D4(e) ~C4(q)
```

## D. What the chart teaches beyond single marks

- **Connecting marks change shape with the pause they lead into.** Munach:
  - before etnachta: E4, then D4–B3 (rows 1–2);
  - before zakef katon: F♯4, then F♯4–E4–F♯4 (9, 10, 12, 14; after yetiv, row 32, MU is a sixteenth);
  - before mahpach and darga: A4, then A4–F♯4–A4 (14, 27);
  - before revia: E4, then A4–F♯4 as the start of a triplet (17–18);
  - before the telishas and pazer: D4, then F♯4–E4 (28–30);
  - before zarka: G♮4, then F♯4–E4 (34–35);
  - before segol: A3, then a D4 tied into a sixteenth (34, 36).

  The munach legarmeh of row 17 is a six-note figure of its own. Mercha is C♯4–E4 before tipcha but
  F♯4, then A4–E4, before tevir (24, 26). Kadma is A3–D4 in kadma v'azla but D4–F♯4 before mahpach,
  darga and mercha (9, 25, 26). The report lists every such figure with the marks around it.
- **Short pickups vary between rows that look alike.** Mercha's CHA is a dotted eighth before tipcha
  and a plain eighth before sof pasuk (row 5). T′ is an eighth in rows 22 and 26 but a sixteenth in 23–25
  and 27, and DAR is an eighth in 21 and 23 but a sixteenth in 25 and 27. A note after a dotted eighth
  is usually a sixteenth. The data keeps each variant as printed.
- **Azla is the geresh melody.** The tail of kadma v'azla (row 15) sings the same four pitches as the
  geresh of row 16 (A4 F♯4 B4 A4; the geresh holds its B4), after two quick notes of its own: the
  azla is a geresh sung after a kadma. The card note says the same of kadma, "usually leading
  straight into a geresh".
- **The last verse of an aliyah has its own ending** (row 41; High Holiday rows 30–33): a higher,
  longer formula in which mercha and tipcha change as well as sof pasuk. The tutor's sof pasuk card
  does not show it. The Torah chart prints it only for mercha–tipcha–mercha–sof pasuk. The High Holiday
  chart prints all four common closings; see section G for how often each occurs.
- **The lowered seventh.** The Torah chart never sings G♯: every G is G♮, so the melody is
  Mixolydian though the signature says A major. The High Holiday chart flattens only its upper B,
  B♭4 in pazer, kadma v'azla and geresh (rows 19–21); B3 below stays natural in sof pasuk, zarka and
  munach legarmeh.
- **Ornaments are notated, not improvised.** Grace notes:
  - in front of zarka's KA;
  - under the telishas' T′ and yetiv's Y′;
  - before the end-of-aliyah SUK.

  Triplets sit inside tevir, gershayim and karnei parah, and run from one word into the next in
  munach–revia and the end-of-aliyah phrase (rows 17–18, 41). In the High Holiday chart they sit
  inside pazer, geresh, zakef gadol and segol, and the ones that cross from one mark into the next are
  listed in section C. Accents and tenuto lines are listed in section A.
- **The chart's own order is a teaching order:**
  - the etnachta clause (1–4);
  - the sof pasuk clause (5–8);
  - the zakef katon clause (9–14);
  - kadma v'azla and geresh (15–16);
  - revia (17–19);
  - gershayim (20);
  - darga and tevir (21–27);
  - the telishas and pazer (28–30);
  - zakef gadol and yetiv (31–33);
  - the segol clause (34–37);
  - the rare marks (38–40);
  - the closing formula (41).

## E. How the tutor uses this

- Every entry in `data/trope/trope_motifs.json` is `verified: true` and carries
  `source: "tropepatterns.md Torah #N"`, the row in section B that section A names.
  - The motif builder (`scripts/build-trope-motifs.mjs`) copies verified entries through untouched;
    only `--force` would replace them with machine drafts.
  - `scripts/build-trope-phrases.mjs` checks on each run that each motif file carries exactly the
    cards section A's table names, each `verified: true` with the `source` the table gives, and that
    every entry equals its row reduced as section A says. It fails on any difference, printing the
    notes the row gives. The pazer correction is applied before the comparison, and only while row 30
    still prints PA D4(e) ZER D4(s).
  - The clean scans corrected eight staffs:
    - the closing note becomes a quarter in mahpach, zarka, tevir, telisha gedola, pazer and karnei
      parah;
    - yetiv gains the grace note Y′ is sung on;
    - karnei parah gains its missing E4;
    - the High Holiday segol loses the G4 that is tied into its run.
- The file's top-level `key: "A"` tells the Learn-card staff to draw three sharps and to spell
  in-key notes without accidentals, so a natural sign appears only where the chart prints one. A
  note outside the key is spelled by the tutor's rule (raised 1st and 4th, lowered 3rd, 6th and
  7th), which gives the charts' own spellings: G♮ here, F♯ and B♭ in the High Holiday file.
- Rhythm is reduced to the staff's four values (`d` 1–4), as section A says. A grace note is drawn as
  a full eighth: zarka's F♯4 before KA, the D4 each telisha sings T′ on, and yetiv's Y′ (B4; A4 in the
  High Holiday file). Pazer's two opening D4s are one quarter note on the year-round staff (section A).
  Every figure keeps its full length, and a staff with more than eight notes widens; the longest,
  shalshelet, karnei parah and the High Holiday pazer, have fifteen.
- To re-verify an entry by hand:
  - read the mark's line in its row;
  - reduce it as section A says;
  - convert it with the `p` scale above (A4 = −2; each semitone down is −1);
  - compare it with the JSON.

  The card's play button plays the staff as tones, lighting each note, so the tune can be checked by
  ear.
- The High Holiday figures (section C) live in `data/trope/trope_motifs_hh.json`
  (`system: "highholiday"`, `key: "C"`: no signature, so B♭ and F♯ carry their accidentals), each entry
  `verified: true` with `source: "tropepatterns.md High Holiday #N"`. The motif builder never reads or
  writes that file (there are no High Holiday recordings to draft from), so it is edited by hand; the
  phrases builder checks it like the Torah file. The tutor draws it when Settings → Melody is *High
  Holidays*; the four marks it lacks say so on their cards.
- Neither file is ever rewritten for another key.
  - The Learn tab's key bar (and Settings → Sing along → Key) moves every note of the melody on
    screen by whole half steps, up to six either way, and redraws the staff in the key it lands on.
  - The chart's chromatic notes keep their degree (the lowered 7th, the High Holiday raised 4th), so
    each figure keeps its printed shape.
  - *Low voices* leaves the notes where they are, writes the small 8 under the clef and sounds the tune
    an octave down, the octave men sing both charts in.

  `docs/reference/torah-and-trope.md` → *Key and voice* has the details.

## F. Ideas this chart suggests

Each of these is a Feature seed in the improvement loop's ledger (`docs/IMPROVEMENT_LOG.md`), so a loop
session can pick one up. (The key control for the tune button that stood fifth here has shipped, as the
key bar described in section E, and so has the phrases tab that stood second: the Trope Tutor's
Phrases tab, with real Torah examples of each row.)

1. High Holiday recordings for the Torah Trainer's Rosh Hashanah and Yom Kippur readings: those
   readings now link to the tutor on the High Holiday melody, but their chant buttons still play
   PocketTorah's year-round recordings (a chip beside the link says so).
2. A "what comes next" drill: a phrase with one mark hidden, or the marks of a phrase to put in
   order.
3. Context variants on the Learn card: munach's shapes and the tevir-context mercha and kadma,
   each with the phrase they belong to (the figures are in `docs/trope_phrases_report.md`).
4. Teaching the end-of-aliyah sof pasuk, on the card and as a highlight of an aliyah's last verse
   in the Torah Trainer.
5. A munach legarmeh card.
6. A one-sheet phrase chart to print in the teacher's chosen key (the Phrases tab prints the
   whole chart in that key, over several sheets).
7. A staff for a whole reading, a verse to a parasha, drawn and played under the Hebrew (section G) —
   shipped as the Torah Trainer's *Trope staff* layout (beta): `js/trope-staff.js`'s `tropeUnitsOfVerse`,
   `tropeChooseFigures`, `tropeBuildReadingRow` and `tropeSplitSystems` are section G's rules as code;
   `docs/reference/torah-and-trope.md` → *Trope staff* is the contract.

## G. Toward a parasha staff

*Implemented (beta) as the Torah Trainer's Trope staff layout — see `docs/reference/torah-and-trope.md` →
Trope staff for what the code does with each point below, and which it leaves open.*

The aim is a staff under any reading — a verse, an aliyah, a whole parasha — that draws and plays its
cantillation. The chart supplies the figures. This section records what a builder of that staff needs
to know, and what the chart leaves open.

- **The data** is `data/trope/trope_phrases.json`, built from sections B, C and H–K. The Trope Tutor's
  Phrases tab draws every row of it, and its renderer (`renderPhraseStaff`,
  `docs/reference/torah-and-trope.md`) is the first building block of this staff. For each
  melody it gives the key and every row as flat arrays:
  - `notes`: `p` in semitones from B4, `v` the printed value, `t` ticks at 48 to the quarter with a
    triplet note's real length, `g` grace, `r` rest, `tie` tied to the next, and `a` accents and
    tenuto lines;
  - `syl`: each syllable's text, whether a hyphen follows, its mark and the notes it covers;
  - `units`: each mark's notes;
  - `tup`: the triplets;
  - `slur`: the slurs, `dashed` for a dashed one.

  `figures.<melody>.<mark>` lists each mark's distinct figures by `[row, mark index]`, with the marks
  printed before (`prev`) and after (`next`) it; `^` and `$` are the row's edges.
- **Choosing a figure for a word.** The mark alone does not decide it.
  - A conjunctive — munach, mercha, mahpach, kadma, darga, telisha ketana, mercha kefula or yerach
    ben yomo — takes the figure whose `next` names the mark that follows it (section D).
  - Where the chart has no such figure, the fallback is its figure before the disjunctive the chain
    leads to; failing that, any figure of the mark.
  - A disjunctive's figure can change too. In the Torah chart the changes are small: revia's first
    note is a triplet eighth when the munach's triplet runs into it (rows 17–18), tevir's T′ is an
    eighth or a sixteenth (section D), and a geresh after kadma, the azla, opens with two quick
    notes (row 15). The High Holiday chart changes more: its tipcha before etnachta (rows 1–4) is
    not the tipcha of the sof pasuk clause (5–8), and its etnachta, sof pasuk, zakef katon, zarka
    and geresh each have two or three forms. So a disjunctive's figure is chosen like a
    conjunctive's, by `prev` and `next`, and the last verse of an aliyah takes the `[aliyah-end]`
    rows for its closing mercha, tipcha and sof pasuk.
  - The melody (`torah`, `highholiday` or `haftarah`) picks its part of the file.
- **Words, as the text gives them.** A word joined to the next by a maqaf (־) usually has no mark
  of its own, so the pair is one word with one figure. Where the first word keeps one (a kadma 84
  times in the Torah, a tipcha once, Genesis 8:18), the pair is one word with two marks, sung in
  order. A vertical line (׀) after a munach is one of two signs that print alike. It is either the
  legarmeh line, which makes the munach munach legarmeh, or a paseq, a short pause that leaves the
  munach a connecting mark (Genesis 22:11, אַבְרָהָ֣ם ׀ אַבְרָהָ֑ם). The census's text draws the
  paseq smaller, and a staff builder's text has to tell the two apart as well. A double pashta, and
  the doubled telishas, segol and zarka, are one mark written twice: one sign at the word's edge,
  the other on its stressed syllable. A word can carry two different marks, most often a
  munach or kadma on an earlier syllable before a zakef katon, or a kadma before a geresh. They are sung
  in order, like two words.
- **Placing a figure on a real word** is the one thing the chart cannot give.
  - The chart sings every figure on its mark's own name (MER-CHA, T′-LI-SHA G′DO-LA), and the name's
    stress is no guide: pashta's high note falls on TA, not on the stressed PASH.
  - So the data keeps the printed underlay and adds no accent field.
  - The usual teaching puts the figure's opening notes on the syllables before the stressed one and its
    melisma from the stressed syllable on. That is a convention for the builder to confirm by ear
    against the PocketTorah recordings the tutor already plays.
  - Most marks sit on the stressed syllable. Pashta, zarka, segol and telisha ketana sit on a word's
    last letter and telisha gedola and yetiv on its first, so the stress has to come from the text.
- **Keys and voices.** The tutor's key bar functions (`shiftedKey`, `motifPitchPos`) transpose and
  spell these notes the way they do the Learn-card staffs, and *Low voices* works the same way.
- **What the Torah needs that the chart does not print.** `node scripts/build-trope-phrases.mjs --census`
  reads the whole Torah text (Sefaria's public export, the *Miqra according to the Masorah* edition)
  and writes `docs/trope_contexts_report.md`.
  - **Every mark has a figure.** Geresh muqdam, the only mark without one, never occurs.
  - **Conjunctives.** 95.4% of them stand before a mark the chart prints them before, and 96.1% with
    the chain fallback.
  - **The largest gaps:**
    - telisha ketana before kadma: 450, since the chart prints telisha ketana only at the end of a row;
    - kadma before zakef katon on one word: 159;
    - mercha before pashta: 147;
    - munach before munach: 141, nearly all covered by the fallback;
    - munach before gershayim: 59;
    - darga before munach: 59;
    - kadma before a munach that leads to zarka: 41;
    - munach before mercha: 37, all covered by the fallback;
    - mercha before zarka: 31.
  - **The last verse of an aliyah.** The Torah chart's one closing formula (mercha tipcha mercha sof
    pasuk) fits 65 of the 376 aliyah-final verses the census reads (PocketTorah's aliyot, the ones the
    Torah Trainer shows). The two others end inside the excluded Decalogues. Of the rest, 139 end
    mercha tipcha sof pasuk, 100 tipcha mercha sof pasuk, 71 tipcha sof pasuk and one sof pasuk alone.
    Hebcal's calendar ends two aliyot elsewhere (Terumah 2 at Exodus 25:40, Masei 1 at Numbers
    33:10); with its ends, 64 verses fit the chart's formula and 72 end tipcha sof pasuk. The High
    Holiday chart prints all four common closings, but in its own melody.
  - **The High Holiday readings.** In the four Rosh Hashanah and Yom Kippur readings, 94.0% of the
    conjunctives stand before a printed context, 95.2% with the fallback. None of the four marks the
    High Holiday chart leaves out occurs there.
  - **Left out.** Genesis 35:22 and the two Decalogues are marked with two cantillation systems at
    once, so the census leaves them out.

  Each gap is a place where a parasha staff needs a decision, a recording to listen to or a second
  source. The report lists every one with an example verse.

## H. The 40 Haftarah phrase patterns

Transcribed note for note from the haftarah chart in *The Art of Cantillation, Volume 2* (Marshall
Portnoy and Josée Wolff, UAHC Press, 2001), Appendix D, pages 83–84: rows 1–20 on the first page, 21–40
on the second, the last marked "(end of haftarah)". The scan was cropped a row at a time at 400 dpi and
read twice — by eye, and by a note-head detector that names each head from the staff lines beside it —
with the beams counted in the pixel columns between the stems and every disagreement settled at 4–6×.
The melody is the traditional one; the transcription is CC BY-SA 4.0 like the rest of this file. The
Torah Trainer's Trope staff draws a haftarah from these rows alone, and the Trope Tutor's Haftarah
melody (Settings → Melody) takes its Learn-card staffs from `data/trope/trope_motifs_haftarah.json`,
which the builder derives from these rows through section A's Haftarah column on every run — never edit
that file by hand; a change here bumps the `?v=` of both files.

**Key and range.** Three flats, E♭ major, and the chart prints no accidental: every B, E and A is written
with its flat (`B♭4`, `E♭4`, `A♭4`), nothing else is altered, and the builder refuses any other sign
(`key: Eb`). The rows lie between B♭3 and C5: the sof pasuk ends on C4, the etnachta on F4, and the
tune sits on C — the two pages' key readouts name the relative minor, *C minor*, for this melody. Row
numbers are the chart's own.

**The rows.** The chart's order: the etnachta clause (1–4) and the sof pasuk clause (5–8); the zakef
katon clause (9–14); kadma v'azla and geresh (15–16); revia (17–19); gershayim (20–21); darga and tevir
(22–28); the telishas (29–30); pazer (31); zakef gadol (32); yetiv (33–34); the segol clause (35–38);
mercha kefula (39); the closing formula (40). The chart prints no shalshelet, karnei parah or yerach ben
yomo, so those marks have no row and no Learn card (section A). As the book says of this melody (p. 15),
**mercha and tipcha before etnachta are not the mercha and tipcha before sof pasuk**: rows 1–4 sing
MER-CHA as C4 E♭4 C4 and TIP-CHA as E♭4 F4, rows 5–8 as C4 E♭4 and F4 G4 E♭4 B♭3. The Hebrew of each
row is the printed row of section B with the same marks (rows 21 and 31, which the Torah chart lacks,
are built from its words).

**Brackets, grace notes, variants.** The chart prints a `3` over its triplets — three eighths (15, 32),
tevir's three quarter notes (23–28), e e s s over the telishas' name (29–30) — and three of them run
from one mark into the next: munach's NACH into R′ (17–18), mercha's CHA into T′ (25, 27) and the
closing MER-CHA into SOF (40). Its other brackets count a run and imply no ratio: `4` over munach
legarmeh's run (17), `5` over munach's five sixteenths before mahpach and gershayim (14, 21; row 28
prints the same five sixteenths before darga with no number), `6` over telisha gedola's LAH (29: three
eighths, a grace note, three sixteenths) and mercha kefula's six eighths (39), `8` over the geresh run
(16), and `11` over pazer's run of twelve sixteenths (31: the transcription puts it over the eleven
after the first). Grace notes: yetiv's Y′ on C5 (33–34), a G4 before zarka's KA (35–38), a G4 inside
telisha gedola's run (29) and the pair B♭4 C5 before the closing SUK (40). Darga's GA is B♭4 dotted
and a falling run: rows 22 and 24 print the run as three sixteenths, rows 26 and 28 as two
thirty-seconds and a sixteenth, on the same pitches.

**Rows 40b–40d are not printed.** The chart closes only mercha–tipcha–mercha–sof pasuk, and most
haftarot end on one of the three shorter endings the census counts (section G); a reader sings the
printed closing with the missing marks left out, and that is what the three derived rows are: row 40
with units dropped, every kept unit note for note, tagged `[aliyah-end] [derived]` (the builder checks
the derivation). Dropping the second mercha dissolves the triplet it shared with SOF, so 40c and 40d
sing SOF as a plain eighth. The Trainer closes a haftarah's last verse on the longest of the four whose
marks end it.

**Known differences from Binder.** Every row was also set against the same phrase in Binder's
*Biblical Chant* (Chart 2, printed a tone higher with one flat) and the HUC handwritten page for the
Prophets, by the contour of each figure: the note-head detector read Binder's staves as it read these,
and each figure's rises and falls were compared row by row. The two charts agree, note for note after
transposition, on the etnachta's TA, the munach's five-sixteenth run (14, 21), kadma v'azla and
geresh (15–16), munach legarmeh and revia (17–19), gershayim (20), the telishas (29–30), the pazer's
run (31), zakef gadol (32), mercha kefula (39) and on where every clause ends. Where they differ,
this chart's reading was re-checked against its own page and kept, Portnoy and Wolff being the source
of record: Binder's mercha before etnachta rises a fourth and falls back a step, and his tipcha,
before etnachta and before sof pasuk alike, falls to C4 (rows 1–8; here the mercha is C4 E♭4 C4,
and the tipcha rises to F4 before etnachta and climbs F4 G4 before sof pasuk); his pashta climbs
from below the staff to A♭4 in sixteenths and his zakef katon walks down a third to E♭4 (9–14; here
the pashta touches G4 and KA-TON turns F4 G4 E♭4); his darga rises a fifth to C5 (22–28; a fourth to
B♭4 here); his tevir carries on past E♭4 and falls through a flattened D to C4 (23–28; here it ends
on E♭4); his yetiv falls an octave (33–34; a fifth here); his zarka opens with a rising run, E♭4 up
to A♭4, before the fall (35–38; here it starts at the top); and his final cadence ends on C4 like
any sof pasuk (here row 40 rises through the grace pair to end on A♭4). The HUC page, read for
contour only, shows Binder's falling tipcha and rising zarka where it is legible, and nothing in it
contradicts the rest. All of these rows are on the ear-check list.

```trope-haftarah
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- C4(e) CHA E♭4(e) ~C4(e)
tipcha    TIP- E♭4(e) CHA F4(q)
munach    MU- F4(e) NACH E♭4(e)
etnachta  ET- C4(e) NACH- C4(e) TA E♭4(s) ~C4(s) ~E♭4(s) ~G4(s) ~F4(q)
```

```trope-haftarah
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- E♭4(e) CHA F4(q)
munach    MU- F4(e) NACH E♭4(e)
etnachta  ET- C4(e) NACH- C4(e) TA E♭4(s) ~C4(s) ~E♭4(s) ~G4(s) ~F4(q)
```

```trope-haftarah
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- C4(e) CHA E♭4(e) ~C4(e)
tipcha    TIP- E♭4(e) CHA F4(q)
etnachta  ET- C4(e) NACH- C4(e) TA E♭4(s) ~C4(s) ~E♭4(s) ~G4(s) ~F4(q)
```

```trope-haftarah
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- E♭4(e) CHA F4(q)
etnachta  ET- C4(e) NACH- C4(e) TA E♭4(s) ~C4(s) ~E♭4(s) ~G4(s) ~F4(q)
```

```trope-haftarah
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- C4(e) CHA E♭4(e)
tipcha    TIP- F4(e) CHA G4(e) ~E♭4(e) ~B♭3(dq)
mercha    MER- B♭3(e) CHA B♭3(e)
sof_pasuk SOF- B♭3(s) PA- C4(s) SUK E♭4(q) ~C4(q)
```

```trope-haftarah
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- F4(e) CHA G4(e) ~E♭4(e) ~B♭3(dq)
mercha    MER- B♭3(e) CHA B♭3(e)
sof_pasuk SOF- B♭3(s) PA- C4(s) SUK E♭4(q) ~C4(q)
```

```trope-haftarah
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- C4(e) CHA E♭4(e)
tipcha    TIP- F4(e) CHA G4(e) ~E♭4(e) ~B♭3(dq)
sof_pasuk SOF- B♭3(s) PA- C4(s) SUK E♭4(q) ~C4(q)
```

```trope-haftarah
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- F4(e) CHA G4(e) ~E♭4(e) ~B♭3(dq)
sof_pasuk SOF- B♭3(s) PA- C4(s) SUK E♭4(q) ~C4(q)
```

```trope-haftarah
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma       KAD- C4(e) MA F4(dq)
mahpach     MA- F4(e) PACH F4(e) ~C4(e)
pashta      PASH- C4(e) TA G4(e) ~F4(e)
munach      MU- F4(e) NACH F4(s) ~C4(s) ~A♭4(e) ~G4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#10 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach     MA- F4(e) PACH F4(e) ~C4(e)
pashta      PASH- C4(e) TA G4(e) ~F4(e)
munach      MU- F4(e) NACH F4(s) ~C4(s) ~A♭4(e) ~G4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach     MA- F4(e) PACH F4(e) ~C4(e)
pashta      PASH- C4(e) TA G4(e) ~F4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#12 פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
pashta      PASH- C4(e) TA G4(e) ~F4(e)
munach      MU- F4(e) NACH F4(s) ~C4(s) ~A♭4(e) ~G4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#13 פַּשְׁטָא֙ קָטֹ֔ן
pashta      PASH- C4(e) TA G4(e) ~F4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#14 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
munach      MU- F4(e) NACH 5{F4(s) ~E♭4(s) ~F4(s) ~G4(s) ~F4(s)}
mahpach     MA- F4(e) PACH F4(e) ~C4(e)
pashta      PASH- C4(e) TA G4(e) ~F4(e)
munach      MU- F4(e) NACH F4(s) ~C4(s) ~A♭4(e) ~G4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#15 קַדְמָ֨א וְאַזְלָ֜א
kadma   KAD- C4(e) MA F4(e)
geresh  V'- F4(s) AZ- G4(s) LA 3{A♭4(e) ~G4(e) ~F4(e)} ~C5(e) ~F4(dq)
```

```trope-haftarah
#16 גֵּ֜רֵשׁ
geresh  GE- 8{F4(s) ~G4(s) ~A♭4(s) ~G4(s) ~B♭4(s) ~A♭4(s) ~G4(s) ~F4(s)} ~G4(q) RESH F4(q)
```

```trope-haftarah
#17 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- C4(e) NACH 4{C4(s) ~D4(s) ~E♭4(s) ~C4(s)} ~F4(de)
munach          MU- F4(s) NACH 3{C5(e) ~F4(e)
revia           R'- F4(e)} VI- F4(de) I F4(de) ~E♭4(s) ~D4(s) ~C4(s) ~E♭4(s) ~C4(q)
```

```trope-haftarah
#18 מֻנָּ֣ח רְבִיעִ֗י
munach  MU- F4(s) NACH 3{C5(e) ~F4(e)
revia   R'- F4(e)} VI- F4(de) I F4(de) ~E♭4(s) ~D4(s) ~C4(s) ~E♭4(s) ~C4(q)
```

```trope-haftarah
#19 רְבִיעִ֗י
revia   R'- F4(e) VI- F4(de) I F4(de) ~E♭4(s) ~D4(s) ~C4(s) ~E♭4(s) ~C4(q)
```

```trope-haftarah
#20 גֵּרְשַׁיִ֞ם
gershayim GER- C4(e) SHA- C4(e) YIM F4(s) ~G4(s) ~A♭4(s) ~F4(s) ~A♭4(e)
```

```trope-haftarah
#21 מֻנָּ֣ח גֵּרְשַׁיִ֞ם
munach    MU- F4(e) NACH 5{F4(s) ~E♭4(s) ~F4(s) ~G4(s) ~F4(s)}
gershayim GER- C4(e) SHA- C4(e) YIM F4(s) ~G4(s) ~A♭4(s) ~F4(s) ~A♭4(e)
```

```trope-haftarah
#22 דַּרְגָּ֧א
darga  DAR- F4(e) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(s)
```

```trope-haftarah
#23 תְּבִ֛יר
tevir  T'- F4(e) VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#24 דַּרְגָּ֧א תְּבִ֛יר
darga  DAR- F4(e) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(s)
tevir  T'- F4(e) VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#25 מֵרְכָ֥א תְּבִ֛יר
mercha MER- F4(e) CHA 3{B♭4(e) ~F4(e)
tevir  T'- F4(e)} VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#26 קַדְמָ֨א דַּרְגָּ֧א תְּבִ֛יר
kadma  KAD- C4(e) MA F4(e)
darga  DAR- F4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(s)
tevir  T'- F4(e) VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#27 קַדְמָ֨א מֵרְכָ֥א תְּבִ֛יר
kadma  KAD- C4(e) MA F4(e)
mercha MER- F4(e) CHA 3{B♭4(e) ~F4(e)
tevir  T'- F4(e)} VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#28 מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach MU- F4(e) NACH F4(s) ~E♭4(s) ~F4(s) ~G4(s) ~F4(s)
darga  DAR- F4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(s)
tevir  T'- F4(e) VIR 3{C4(q) ~B♭3(q) ~C4(q)} ~E♭4(q)
```

```trope-haftarah
#29 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach         MU- C4(e) NACH F4(e) ~E♭4(e)
telisha_gedola T'LI- 3{C4(e) SHA- C4(e) G'- C4(s) DO- C4(s)} LAH 6{C4(e) ~D4(e) ~E♭4(e) ~G4(g) ~F4(s) ~E♭4(s) ~D4(s)} ~C4(e)
```

```trope-haftarah
#30 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach         MU- C4(e) NACH F4(e) ~E♭4(e)
telisha_ketana T'LI- 3{C4(e) SHA- C4(e) K'- C4(s) TA- C4(s)} NAH F4(e) ~E♭4(s) ~F4(s) ~G4(s) ~E♭4(s) ~C4(q)
```

```trope-haftarah
#31 מֻנָּ֣ח מֻנָּ֣ח פָּזֵ֡ר
munach MU- C4(e) NACH F4(e) ~E♭4(e)
munach MU- C4(e) NACH F4(e) ~E♭4(e)
pazer  PA- C4(e) ZER F4(s) 11{~G4(s) ~A♭4(s) ~B♭4(s) ~C5(s) ~B♭4(s) ~A♭4(s) ~G4(s) ~F4(s) ~E♭4(s) ~F4(s) ~G4(s)} ~F4(e)
```

```trope-haftarah
#32 זָקֵף גָּד֕וֹל
zakef_gadol ZA- C4(e) KEF C4(e) GA- C4(e) DOL 3{G4(e) ~E♭4(e) ~C4(e)} ~F4(q) ~E♭4(q)
```

```trope-haftarah
#33 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv       Y'- C5(g) TIV C5(s) ~F4(de)
munach      MU- F4(e) NACH F4(s) ~C4(s) ~A♭4(e) ~G4(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#34 יְ֚תִיב קָטֹ֔ן
yetiv       Y'- C5(g) TIV C5(s) ~F4(de)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(e)
```

```trope-haftarah
#35 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach MU- C4(e) NACH F4(e)
zarka  ZAR- F4(s) G4(g) KA ~F4(e) ~E♭4(s) ~D4(s) ~C4(s) ~D4(s) ~B♭3(e)
munach MU- B♭3(e) NACH E♭4(e)
segol  SE- E♭4(e) GOL G4(q) ~F4(e)
```

```trope-haftarah
#36 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach MU- C4(e) NACH F4(e)
zarka  ZAR- F4(s) G4(g) KA ~F4(e) ~E♭4(s) ~D4(s) ~C4(s) ~D4(s) ~B♭3(e)
segol  SE- E♭4(e) GOL G4(q) ~F4(e)
```

```trope-haftarah
#37 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka  ZAR- F4(s) G4(g) KA ~F4(e) ~E♭4(s) ~D4(s) ~C4(s) ~D4(s) ~B♭3(e)
munach MU- B♭3(e) NACH E♭4(e)
segol  SE- E♭4(e) GOL G4(q) ~F4(e)
```

```trope-haftarah
#38 זַרְקָא֮ סֶגּוֹל֒
zarka  ZAR- F4(s) G4(g) KA ~F4(e) ~E♭4(s) ~D4(s) ~C4(s) ~D4(s) ~B♭3(e)
segol  SE- E♭4(e) GOL G4(q) ~F4(e)
```

```trope-haftarah
#39 מֵרְכָא כְּפוּלָ֦ה
mercha_kefula MER- F4(e) CHA F4(e) K'- F4(e) FU- F4(e) LAH 6{F4(e) ~G4(e) ~A♭4(e) ~B♭4(e) ~A♭4(e) ~G4(e)} ~F4(q)
```

```trope-haftarah
#40 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- E♭4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(de) ~G4(s) ~F4(s) ~E♭4(s) ~F4(s) ~E♭4(e)
mercha    MER- 3{E♭4(e) CHA E♭4(e)
sof_pasuk SOF- F4(e)} PA- G4(q) SUK B♭4(g) C5(g) ~B♭4(q) ~A♭4(q)
```

```trope-haftarah
#40b [aliyah-end] [derived] טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- A♭4(s) CHA A♭4(de) ~G4(s) ~F4(s) ~E♭4(s) ~F4(s) ~E♭4(e)
mercha    MER- 3{E♭4(e) CHA E♭4(e)
sof_pasuk SOF- F4(e)} PA- G4(q) SUK B♭4(g) C5(g) ~B♭4(q) ~A♭4(q)
```

```trope-haftarah
#40c [aliyah-end] [derived] מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- E♭4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(de) ~G4(s) ~F4(s) ~E♭4(s) ~F4(s) ~E♭4(e)
sof_pasuk SOF- F4(e) PA- G4(q) SUK B♭4(g) C5(g) ~B♭4(q) ~A♭4(q)
```

```trope-haftarah
#40d [aliyah-end] [derived] טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- A♭4(s) CHA A♭4(de) ~G4(s) ~F4(s) ~E♭4(s) ~F4(s) ~E♭4(e)
sof_pasuk SOF- F4(e) PA- G4(q) SUK B♭4(g) C5(g) ~B♭4(q) ~A♭4(q)
```

## I. The 41 Esther phrase patterns

Transcribed note for note from the Esther chart in *The Art of Cantillation, Volume 2* (Marshall
Portnoy and Josée Wolff, UAHC Press, 2001), Appendix E, pages 89–90: rows 1–20 on the first page, 21–41
on the second, the last marked "(end of each chapter)". The scan was read the way the Haftarah chart
was (section H): a row at a time at 400 dpi, by eye and by the note-head detector, with the beams
counted between the stems and every flag, dot and rest in doubt compared at 6–8× against a glyph of
the same page whose value was certain. The melody is the traditional one; the transcription is
CC BY-SA 4.0 like the rest of this file. No page reads these rows yet — the Trope Tutor's Melody picker
and the Torah Trainer's staff know the Torah, High Holiday and Haftarah sets only (the wiring is a
candidate in `docs/IMPROVEMENT_LOG.md`) — but the builder derives `data/trope/trope_motifs_esther.json`
from these rows through section A's Esther column on every run, so the Learn cards are ready for it;
never edit that file by hand.

**Key and range.** Three flats, E♭ major, like the book's Haftarah and Eicha charts, and one printed
accidental: the E♮ of the figure F4 E♮4 F4 that closes zarka, segol, yerach ben yomo and the final
tipcha (rows 35–39, 41). Every B, E and A is written with its sign (`B♭4`, `E♭4`, `A♭4`, `E♮4`),
nothing else is altered, and the builder refuses any other sign (`key: Eb`). The rows lie between B♭3
and E♭5: the etnachta closes on C4, the sof pasuk and the end of a chapter on F4. Row numbers are the
chart's own. (A first reading of the signature as two flats put every A of this section a semitone
too high; the cross-check against Binder's chart, which prints the same three flats, caught it.)

**The rows.** The chart's order: the etnachta clause (1–4) and the sof pasuk clause (5–8); the zakef
katon clause (9–14); kadma v'azla and geresh (15–16); revia (17–19); gershayim (20–21); darga and
tevir (22–28); the telishas (29–30); pazer (31); zakef gadol (32); yetiv (33–34); the segol clause
(35–38); yerach ben yomo (39) and karnei parah (40), each with its own row here; the closing formula
(41). The chart prints no shalshelet and no mercha kefula, so those marks have no row and no Learn card
(section A). The Hebrew of each row is the printed row of section B or H with the same marks; rows 39
and 40 are built from section B's row 40. The syllables are the chart's own (KAR-NE PA-RAH, BEN-YO-MO,
T′-LI-SHA G′-DO-LAH), spelled as section B spells the same mark where the two agree.

**Figures that change with their neighbours** (as printed; the report lists every figure). Mercha and
tipcha before etnachta (1–4: MER-CHA on G4 G4, TIP-CHA on G4 C5 G4) are not those before sof pasuk
(5–8: TIP-CHA on G4 G4 C4), and in rows 1, 3, 5 and 7 the mercha's two eighths and the tipcha's first
make one triplet. Tevir's T′ is a sixteenth after darga's dotted eighth (24, 26, 28) and alone (23),
an eighth after mercha's quarter (25, 27). The munach before zarka ends on a dotted eighth and ZAR is
the sixteenth that completes it (35–36); zarka opening a row begins on an eighth (37–38). Mahpach's MA
is a sixteenth in rows 9 and 11 (a stub beam) and an eighth in rows 10 and 14 (a single flag, the same
flag as every eighth on the page) — the print's own difference, kept. The chapter's closing row sings
its second mercha on a sixteenth (41) where rows 5–8 print an eighth.

**Brackets, grace notes, rests, articulation.** The chart prints a `3` over its triplets — three
eighths (the MER-CHA-TIP of 1, 3, 5, 7; geresh 16; zakef gadol's ZA-KEF-GA 32; F4 E♮4 F4 in 35–39
and 41), e e s s in kadma v'azla (15) and the five notes of each telisha's name (32 32 s 32 32, rows
29–30; the Haftarah chart's e e s s) — and a `5` over the five sixteenths of munach legarmeh (17).
Grace notes: a B♭4 before NACH in the munach before telisha, pazer and yerach ben yomo (29–31, 39)
and yetiv's Y′ on B♭4 (33–34). Rests are printed and the rows keep them: an eighth rest after the
tipcha (1–8), after pashta's TA (9–13; row 14 prints none), after munach legarmeh's run (17), after the munach before the
telishas, pazer and yerach ben yomo (29–31, 39) and after yetiv's TIV (33–34); a sixteenth rest after
kadma's MA (9) and after the C4 that ends zarka's and the final tipcha's run (35–38, 41) — there the
beam runs on across the rest to the next note (9, 41). Articulation: accents on tevir's last three
notes (23–28), tenuto lines on telisha gedola's G4 F4 E♭4 (29) and a marcato wedge over yetiv's TIV
(33–34), written `>` (the grammar has no wedge). Telisha ketana ends on the chart's only half note
(30).

**The closing row.** Row 41, "(end of each chapter)", is the one `[aliyah-end]` row: the Megillah is
read without aliyot, so the tag here means the end of a chapter, and the chart gives the shorter
endings no rows of their own, so none is derived (a reader who needs one sings the printed row with
the missing marks left out).

**Known differences from Binder.** The same comparison was made against Binder's Esther chart
(Chart 4), printed in the same key with the same three flats, and the HUC Esther page (one flat).
Binder's chart agrees with this one, note for note, in every clause: the etnachta and sof pasuk
clauses (1–8), the zakef katon clause (9–14), kadma v'azla and geresh (15–16), the revia rows
(17–19), gershayim (20–21), darga and tevir (22–28), telisha gedola and the munach before it (29),
pazer (31), zakef gadol (32), yetiv (33–34), the segol clause with its E♮ (35–38), yerach ben yomo
(39), karnei parah (40) and the chapter's closing (41, which Binder also heads as the cadence for the
end of each chapter) — and it was this agreement that exposed the misread signature noted above. The
one difference is telisha ketana (30): Binder's rises from F4 through G4 and A♭4 to B♭4 and ends
there, the shape of his pazer, where this chart's stays on E♭4 and closes E♭4 D4 E♭4 F4 E♭4 — a row
for the ear check. The HUC page (handwritten) was read for contour only; nothing legible in it
contradicts either chart.

```trope-esther
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- 3{G4(e) CHA G4(e)
tipcha    TIP- G4(e)} CHA C5(e) ~G4(e) rest(e)
munach    MU- C4(e) NACH F4(e)
etnachta  ET- E♭4(s) NACH- E♭4(s) TA D4(e) ~C4(q)
```

```trope-esther
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- G4(e) CHA C5(e) ~G4(e) rest(e)
munach    MU- C4(e) NACH F4(e)
etnachta  ET- E♭4(s) NACH- E♭4(s) TA D4(e) ~C4(q)
```

```trope-esther
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- 3{G4(e) CHA G4(e)
tipcha    TIP- G4(e)} CHA C5(e) ~G4(e) rest(e)
etnachta  ET- E♭4(s) NACH- E♭4(s) TA D4(e) ~C4(q)
```

```trope-esther
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- G4(e) CHA C5(e) ~G4(e) rest(e)
etnachta  ET- E♭4(s) NACH- E♭4(s) TA D4(e) ~C4(q)
```

```trope-esther
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- 3{G4(e) CHA G4(e)
tipcha    TIP- G4(e)} CHA G4(e) ~C4(e) rest(e)
mercha    MER- C4(e) CHA A♭4(e)
sof_pasuk SOF- A♭4(s) PA- A♭4(s) SUK G4(q) ~F4(q)
```

```trope-esther
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- G4(e) CHA G4(e) ~C4(e) rest(e)
mercha    MER- C4(e) CHA A♭4(e)
sof_pasuk SOF- A♭4(s) PA- A♭4(s) SUK G4(q) ~F4(q)
```

```trope-esther
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- 3{G4(e) CHA G4(e)
tipcha    TIP- G4(e)} CHA G4(e) ~C4(e) rest(e)
sof_pasuk SOF- A♭4(s) PA- A♭4(s) SUK G4(q) ~F4(q)
```

```trope-esther
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- G4(e) CHA G4(e) ~C4(e) rest(e)
sof_pasuk SOF- A♭4(s) PA- A♭4(s) SUK G4(q) ~F4(q)
```

```trope-esther
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma       KAD- E♭4(e) MA G4(e) rest(s)
mahpach     MA- B♭3(s) PACH E♭4(de)
pashta      PASH- G4(s) TA B♭4(q) rest(e)
munach      MU- B♭3(e) NACH F4(s) ~D4(s) ~F4(ds)
zakef_katon KA- F4(32) TON F4(e) ~D4(dq)
```

```trope-esther
#10 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach     MA- B♭3(e) PACH E♭4(de)
pashta      PASH- G4(s) TA B♭4(q) rest(e)
munach      MU- B♭3(e) NACH F4(s) ~D4(s) ~F4(ds)
zakef_katon KA- F4(32) TON F4(e) ~D4(dq)
```

```trope-esther
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach     MA- B♭3(s) PACH E♭4(de)
pashta      PASH- G4(s) TA B♭4(q) rest(e)
zakef_katon KA- F4(e) TON F4(e) ~D4(dq)
```

```trope-esther
#12 פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
pashta      PASH- G4(s) TA B♭4(q) rest(e)
munach      MU- B♭3(e) NACH F4(s) ~D4(s) ~F4(ds)
zakef_katon KA- F4(32) TON F4(e) ~D4(dq)
```

```trope-esther
#13 פַּשְׁטָא֙ קָטֹ֔ן
pashta      PASH- G4(s) TA B♭4(q) rest(e)
zakef_katon KA- F4(e) TON F4(e) ~D4(dq)
```

```trope-esther
#14 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
munach      MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(q)
mahpach     MA- B♭3(e) PACH E♭4(de)
pashta      PASH- G4(s) TA B♭4(q)
munach      MU- B♭3(e) NACH F4(s) ~D4(s) ~F4(ds)
zakef_katon KA- F4(32) TON F4(e) ~D4(dq)
```

```trope-esther
#15 קַדְמָ֨א וְאַזְלָ֜א
kadma  KAD- G4(e) MA 3{B♭4(e) ~G4(e)
geresh V'- B♭4(s) AZ- B♭4(s)} LA E♭5(e) ~B♭4(dq)
```

```trope-esther
#16 גֵּ֜רֵשׁ
geresh GE- 3{B♭4(e) ~G4(e) ~C5(e)} RESH B♭4(q)
```

```trope-esther
#17 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- E♭4(e) NACH 5{E♭4(s) ~D4(s) ~E♭4(s) ~F4(s) ~E♭4(s)} rest(e)
munach MU- G4(e) NACH C5(e) ~B♭4(e) ~G4(ds)
revia  R'- G4(32) VI- G4(e) I G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(q)
```

```trope-esther
#18 מֻנָּ֣ח רְבִיעִ֗י
munach MU- G4(e) NACH C5(e) ~B♭4(e) ~G4(ds)
revia  R'- G4(32) VI- G4(e) I G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(q)
```

```trope-esther
#19 רְבִיעִ֗י
revia  R'- G4(32) VI- G4(e) I G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(q)
```

```trope-esther
#20 גֵּרְשַׁיִ֞ם
gershayim GER- G4(e) SHA- G4(e) YIM B♭4(e) ~B♭4(s) ~A♭4(s) ~G4(s) ~A♭4(s) ~B♭4(q)
```

```trope-esther
#21 מֻנָּ֣ח גֵּרְשַׁיִ֞ם
munach    MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(q)
gershayim GER- G4(e) SHA- G4(e) YIM B♭4(e) ~B♭4(s) ~A♭4(s) ~G4(s) ~A♭4(s) ~B♭4(q)
```

```trope-esther
#22 דַּרְגָּ֧א
darga  DAR- E♭4(s) ~G4(s) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(de)
```

```trope-esther
#23 תְּבִ֛יר
tevir  T'- E♭4(s) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#24 דַּרְגָּ֧א תְּבִ֛יר
darga  DAR- E♭4(s) ~G4(s) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(de)
tevir  T'- E♭4(s) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#25 מֵרְכָ֥א תְּבִ֛יר
mercha MER- G4(e) CHA B♭4(e) ~F4(q)
tevir  T'- E♭4(e) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#26 קַדְמָ֨א דַּרְגָּ֧א תְּבִ֛יר
kadma  KAD- E♭4(e) MA G4(e)
darga  DAR- E♭4(s) ~G4(s) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(de)
tevir  T'- E♭4(s) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#27 קַדְמָ֨א מֵרְכָ֥א תְּבִ֛יר
kadma  KAD- E♭4(e) MA G4(e)
mercha MER- G4(e) CHA B♭4(e) ~F4(q)
tevir  T'- E♭4(e) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#28 מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(q)
darga  DAR- E♭4(s) ~G4(s) GA B♭4(de) ~A♭4(s) ~G4(s) ~F4(de)
tevir  T'- E♭4(s) VIR E♭4(de) ~D4(32) ~E♭4(32) ~F4(de,>) ~E♭4(s,>) ~D4(q,>)
```

```trope-esther
#29 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach         MU- G4(e) NACH B♭4(g) ~A♭4(e) ~G4(e) rest(e)
telisha_gedola T'- 3{E♭4(32) LI- E♭4(32) SHA E♭4(s) G'- E♭4(32) DO- E♭4(32)} LAH E♭4(s) ~F4(s) ~G4(s) ~A♭4(s) ~G4(e,-) ~F4(e,-) ~E♭4(q,-)
```

```trope-esther
#30 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach         MU- G4(e) NACH B♭4(g) ~A♭4(e) ~G4(e) rest(e)
telisha_ketana T'- 3{E♭4(32) LI- E♭4(32) SHA E♭4(s) K'- E♭4(32) TA- E♭4(32)} NAH E♭4(s) ~D4(s) ~E♭4(s) ~F4(s) ~E♭4(h)
```

```trope-esther
#31 מֻנָּ֣ח פָּזֵ֡ר
munach MU- G4(e) NACH B♭4(g) ~A♭4(e) ~G4(e) rest(e)
pazer  PA- A♭4(s) ~G4(s) ZER F4(32) ~G4(32) ~A♭4(32) ~B♭4(32) ~C5(e) ~B♭4(dq)
```

```trope-esther
#32 זָקֵף גָּד֕וֹל
zakef_gadol ZA- 3{E♭4(e) KEF E♭4(e) GA- G4(e)} DOL B♭4(e) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(32) ~G4(e) ~F4(e) ~E♭4(q)
```

```trope-esther
#33 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv       Y'- B♭4(g) TIV B♭4(q,>) rest(e)
munach      MU- B♭3(e) NACH F4(s) ~D4(s) ~F4(ds)
zakef_katon KA- F4(32) TON F4(e) ~D4(dq)
```

```trope-esther
#34 יְ֚תִיב קָטֹ֔ן
yetiv       Y'- B♭4(g) TIV B♭4(q,>) rest(e)
zakef_katon KA- F4(e) TON F4(e) ~D4(dq)
```

```trope-esther
#35 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach MU- F4(e) NACH A♭4(e) ~G4(e) ~F4(de)
zarka  ZAR- F4(s) KA C5(q) ~C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) 3{~F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(e) rest(s)
munach MU- C4(e) NACH A♭4(e) ~G4(q)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(dq)
```

```trope-esther
#36 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach MU- F4(e) NACH A♭4(e) ~G4(e) ~F4(de)
zarka  ZAR- F4(s) KA C5(q) ~C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) 3{~F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(e) rest(s)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(dq)
```

```trope-esther
#37 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka  ZAR- F4(e) KA C5(q) ~C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) 3{~F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(e) rest(s)
munach MU- C4(e) NACH A♭4(e) ~G4(q)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(dq)
```

```trope-esther
#38 זַרְקָא֮ סֶגּוֹל֒
zarka  ZAR- F4(e) KA C5(q) ~C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) 3{~F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(e) rest(s)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(dq)
```

```trope-esther
#39 מֻנָּ֣ח יָרֵחַ בֶּן יוֹמ֪וֹ
munach          MU- G4(e) NACH B♭4(g) ~A♭4(e) ~G4(e) rest(e)
yerach_ben_yomo YE- F4(s) RACH F4(s) BEN- F4(s) YO- F4(s) MO 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(q)
```

```trope-esther
#40 קַרְנֵי פָּרָה֟
karnei_parah KAR- 3{F4(e) NE F4(e) PA- F4(e)} RAH F4(s) ~G4(s) ~A♭4(s) ~B♭4(s) ~C5(e) ~B♭4(dq) ~E♭4(s) ~F4(s) ~G4(s) ~A♭4(s) ~G4(e) ~F4(e) ~E♭4(q)
```

```trope-esther
#41 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- G4(e) CHA G4(e)
tipcha    TIP- C5(e) CHA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) 3{~F4(e) ~E♮4(e) ~F4(e)} ~G4(e) ~F4(e) ~C4(e) rest(s)
mercha    MER- C4(s) CHA A♭4(e)
sof_pasuk SOF- A♭4(s) PA- A♭4(s) SUK G4(e) ~F4(dq)
```

## J. The 39 Shir HaShirim / Ruth / Kohelet phrase patterns

Transcribed note for note from the chart for the three festival Megillot in *The Art of Cantillation,
Volume 2* (Marshall Portnoy and Josée Wolff, UAHC Press, 2001), Appendix F, pages 91–93: rows 1–11 on
the first page, 12–31 on the second, 32–39 and the end-of-book setting on the third. The scan was read
as the Haftarah and Esther charts were (sections H and I): a row at a time at 400 dpi, by eye and by the
note-head detector, with the beams counted in the pixel columns between the stems, every dot, flag,
rest and curve in doubt dumped pixel by pixel, and the rhythm of each figure compared against the same
figure elsewhere on the page. The melody is the traditional one for Shir HaShirim, Ruth and Kohelet;
the transcription is CC BY-SA 4.0 like the rest of this file. No page reads these rows yet (the wiring
is a candidate in `docs/IMPROVEMENT_LOG.md`), but the builder derives
`data/trope/trope_motifs_megillot.json` from them through section A's Megillot column on every run, so
the Learn cards are ready; never edit that file by hand.

**Key and range.** No key signature and no accidental anywhere on the chart, so every pitch is a plain
letter (`key: C`; the builder refuses any sign). The rows lie between C4 and D5: the etnachta closes on
E4, the sof pasuk and the end of a chapter on C4. Row numbers are the chart's own; the chart prints its
row 39 twice, "(end of each chapter)" and "(end of book)", and the second is `#39a`, like High Holiday
`#20b` — a printed row, not a derived one.

**The rows.** The chart's order: the etnachta clause (1–4) and the sof pasuk clause (5–8); the zakef
katon clause (9–14); kadma v'azla and geresh (15–16); revia (17–19); gershayim (20–21); darga and
tevir (22–28); the telishas (29–30); pazer (31); zakef gadol (32); yetiv (33–34); the segol clause
(35–38); the closing formula (39, 39a). The chart prints no shalshelet, mercha kefula, karnei parah or
yerach ben yomo, so those marks have no row and no Learn card (section A). The Hebrew of each row is
the printed row of section B or H with the same marks.

**Figures that change with their neighbours** (as printed; the report lists every figure). Tipcha's
CHA ends on a quarter before etnachta (1–4) and on an eighth, followed by an eighth rest, before sof
pasuk (5–8); its TIP is the sixteenth that completes mercha's dotted eighth (1, 3, 5, 7) and a plain
eighth when it opens the row (2, 4, 6, 8). Munach–etnachta sings NACH, ET and NACH as a triplet of
eighths (1–2); without the munach, ET and NACH are a pair of sixteenths (3–4), and sof pasuk's SOF and
PA follow the same rule (5–6 against 7–8). Zarka's ZAR and segol's SE are the sixteenth that completes
the munach's dotted eighth (35–37) and an eighth when the mark opens the row (37–38). Kadma's MA is a
dotted eighth and two sixteenths (9, 26, 27), tied on into an eighth in row 9, where the mahpach's own
MA follows on the same A4; row 9 draws both beams up to the dotted eighth's stem where rows 26 and 27
print the usual partial beam, and the three rows are read alike. Zakef katon's KA is a thirty-second
beamed onto the munach's run (9, 10, 12, 14, 33) and an eighth when it opens the word (11, 13, 34), and
its TON is a dotted eighth, a sixteenth and a quarter, each with a tenuto line, in rows 9–14 — printed
after yetiv (33–34) as a dotted sixteenth, a thirty-second and a quarter with no tenuto marks, which
the rows keep as printed (one for the ear check). Darga's GA and segol's GOL, the sof pasuk's SUK
(39, 39a) and zarka's KA all run an eighth into four thirty-seconds, as the darga does in the other
charts of the book.

**Brackets, rests, articulation.** The chart prints a `3` over its triplets — the munach–etnachta and
mercha–sof pasuk groups (1–2, 5–6), kadma v'azla's and geresh's C5 B4 A4 (15–16) and zakef gadol's
three groups (32: ZA-KEF-GA, DOL's B4 G4 E4, and G4 F4 E4 written as a dotted eighth, a sixteenth and
an eighth) — and a `6` under the closing tipcha's six sixteenths (39, 39a). The telishas' name is
three thirty-seconds and two sixty-fourths (29–30; the fourth beam under the last two notes is
printed in both rows, and the five notes last an eighth, as the Esther chart's bracketed five do):
row 30 hyphenates K′-TA and row 29 sets G′DO as one block over its two notes, both kept as printed.
Rests are printed and the rows keep them: an eighth rest after the tipcha before sof pasuk (5–8),
after munach legarmeh's run (17), after the munach before the telishas and pazer (29–31) and after
yetiv's TIV (33–34); a sixteenth rest after pashta's TA (9–14) and after the C4 that ends zarka's run
(35–38). Yetiv's Y′ is a grace note on B4 (33–34), the chart's only grace. Articulation: tenuto lines
on zakef katon's TON (9–14) and on telisha gedola's last three notes (29), written `,-`; the chart
prints no accent. Ties: the etnachta's TA ends on an eighth tied into a quarter under the slur (1–4),
tevir's VIR the same (23–28), gershayim's YIM ends on a sixteenth tied into a quarter (20–21), and the
kadma's A4 is tied into the eighth that follows it (9).

**The closing rows.** Rows 39 and 39a are the two `[aliyah-end]` rows: the Megillot are read without
aliyot, so the tag means the end of a chapter (39) or of the book (39a), which differ only in the
penultimate note (E4 against G4). The chart gives the shorter endings no rows, so none is derived.

**Known differences from Binder.** The same comparison was made against Binder's chart for Ruth,
Shir HaShirim and Kohelet (Chart 5, printed a tone higher with two sharps) and the HUC Shir HaShirim
page (one sharp). Binder's chart agrees with this one, note for note after transposition, in every
clause — the etnachta and sof pasuk clauses (1–8), the zakef katon clause (9–14), kadma v'azla and
geresh (15–16), the revia rows (17–19), gershayim (20–21), darga and tevir (22–28), both telishas
(29–30), the pazer's run (31; Binder prints one munach before it where this chart prints two), zakef
gadol (32), yetiv (33–34), the segol clause (35–38) and the closing with its six sixteenths (39) —
and no difference was found; the TON of rows 33–34 and the sixty-fourths of the telishas (29–30) are
on the ear-check list for their engraving here, not for any disagreement. The HUC page (handwritten)
was read for contour only; nothing legible in it contradicts either chart.

```trope-megillot
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- E4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA G4(e) ~E4(q)
munach    MU- E4(e) NACH 3{E4(e)
etnachta  ET- D4(e) NACH- C4(e)} TA C4(de) ~F4(s) ~E4(e) ~=E4(q)
```

```trope-megillot
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- E4(e) CHA G4(e) ~E4(q)
munach    MU- E4(e) NACH 3{E4(e)
etnachta  ET- D4(e) NACH- C4(e)} TA C4(de) ~F4(s) ~E4(e) ~=E4(q)
```

```trope-megillot
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- E4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA G4(e) ~E4(q)
etnachta  ET- D4(s) NACH- C4(s) TA C4(de) ~F4(s) ~E4(e) ~=E4(q)
```

```trope-megillot
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- E4(e) CHA G4(e) ~E4(q)
etnachta  ET- D4(s) NACH- C4(s) TA C4(de) ~F4(s) ~E4(e) ~=E4(q)
```

```trope-megillot
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- E4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA G4(e) ~E4(e) rest(e)
mercha    MER- E4(e) CHA 3{E4(e)
sof_pasuk SOF- D4(e) PA- C4(e)} SUK D4(e) ~C4(dq)
```

```trope-megillot
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- E4(e) CHA G4(e) ~E4(e) rest(e)
mercha    MER- E4(e) CHA 3{E4(e)
sof_pasuk SOF- D4(e) PA- C4(e)} SUK D4(e) ~C4(dq)
```

```trope-megillot
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- E4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA G4(e) ~E4(e) rest(e)
sof_pasuk SOF- D4(s) PA- C4(s) SUK D4(e) ~C4(dq)
```

```trope-megillot
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- E4(e) CHA G4(e) ~E4(e) rest(e)
sof_pasuk SOF- D4(s) PA- C4(s) SUK D4(e) ~C4(dq)
```

```trope-megillot
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma       KAD- E4(e) MA E4(de) ~B4(s) ~A4(s) =A4(e)
mahpach     MA- A4(e) PACH G4(s) ~F4(s) ~E4(q)
pashta      PASH- E4(e) TA B4(e) rest(s)
munach      MU- G4(e) NACH G4(s) ~E4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#10 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach     MA- A4(e) PACH G4(s) ~F4(s) ~E4(q)
pashta      PASH- E4(e) TA B4(e) rest(s)
munach      MU- G4(e) NACH G4(s) ~E4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach     MA- A4(e) PACH G4(s) ~F4(s) ~E4(q)
pashta      PASH- E4(e) TA B4(e) rest(s)
zakef_katon KA- G4(e) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#12 פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
pashta      PASH- E4(e) TA B4(e) rest(s)
munach      MU- G4(e) NACH G4(s) ~E4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#13 פַּשְׁטָא֙ קָטֹ֔ן
pashta      PASH- E4(e) TA B4(e) rest(s)
zakef_katon KA- G4(e) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#14 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
munach      MU- A4(e) NACH A4(s) ~G4(s) ~A4(e)
mahpach     MA- A4(e) PACH G4(s) ~F4(s) ~E4(q)
pashta      PASH- E4(e) TA B4(e) rest(s)
munach      MU- G4(e) NACH G4(s) ~E4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(de,-) ~F4(s,-) ~E4(q,-)
```

```trope-megillot
#15 קַדְמָ֨א וְאַזְלָ֜א
kadma  KAD- E4(e) MA A4(e)
geresh V'- B4(s) AZ- B4(s) LA 3{C5(e) ~B4(e) ~A4(e)} ~B4(e) ~A4(dq)
```

```trope-megillot
#16 גֵּ֜רֵשׁ
geresh GE- 3{C5(e) ~B4(e) ~A4(e)} ~B4(e) RESH ~A4(dq)
```

```trope-megillot
#17 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- E4(e) NACH E4(32) F4(32) G4(32) E4(32) A4(e) rest(e)
munach          MU- E4(e) NACH G4(de)
revia           R'- G4(s) VI- G4(s) I G4(q) ~G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(q)
```

```trope-megillot
#18 מֻנָּ֣ח רְבִיעִ֗י
munach MU- E4(e) NACH G4(de)
revia  R'- G4(s) VI- G4(s) I G4(q) ~G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(q)
```

```trope-megillot
#19 רְבִיעִ֗י
revia  R'- G4(s) VI- G4(s) I G4(q) ~G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(q)
```

```trope-megillot
#20 גֵּרְשַׁיִ֞ם
gershayim GER- E4(e) SHA- E4(e) YIM E4(s) ~F4(s) ~G4(s) ~E4(s) ~A4(s) ~=A4(q)
```

```trope-megillot
#21 מֻנָּ֣ח גֵּרְשַׁיִ֞ם
munach    MU- A4(e) NACH A4(s) ~G4(s) ~A4(e)
gershayim GER- E4(e) SHA- E4(e) YIM E4(s) ~F4(s) ~G4(s) ~E4(s) ~A4(s) ~=A4(q)
```

```trope-megillot
#22 דַּרְגָּ֧א
darga  DAR- G4(e) GA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~G4(de)
```

```trope-megillot
#23 תְּבִ֛יר
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#24 דַּרְגָּ֧א תְּבִ֛יר
darga  DAR- G4(e) GA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~G4(de)
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#25 מֵרְכָ֥א תְּבִ֛יר
mercha MER- G4(e) CHA G4(de)
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#26 קַדְמָ֨א דַּרְגָּ֧א תְּבִ֛יר
kadma  KAD- E4(e) MA E4(de) ~B4(s) ~A4(s)
darga  DAR- G4(e) GA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~G4(de)
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#27 קַדְמָ֨א מֵרְכָ֥א תְּבִ֛יר
kadma  KAD- E4(e) MA E4(de) ~B4(s) ~A4(s)
mercha MER- G4(e) CHA G4(de)
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#28 מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach MU- A4(e) NACH A4(s) ~G4(s) ~A4(e)
darga  DAR- G4(e) GA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~G4(de)
tevir  T'- C4(e) VIR C4(32) ~D4(32) ~E4(32) ~D4(32) ~E4(e) ~=E4(q)
```

```trope-megillot
#29 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach         MU- E4(e) NACH A4(q) rest(e)
telisha_gedola T'- C4(32) LI- C4(32) SHA- C4(32) G'DO- C4(64) C4(64) LAH C4(32) ~D4(32) ~E4(32) ~F4(32) ~E4(e,-) ~D4(e,-) ~C4(q,-)
```

```trope-megillot
#30 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach         MU- E4(e) NACH A4(q) rest(e)
telisha_ketana T'- E4(32) LI- E4(32) SHA- E4(32) K'- E4(64) TA- E4(64) NAH A4(s) ~G4(s) ~A4(s) ~E4(s) ~E4(q)
```

```trope-megillot
#31 מֻנָּ֣ח מֻנָּ֣ח פָּזֵ֡ר
munach MU- E4(e) NACH A4(q)
munach MU- E4(e) NACH A4(q) rest(e)
pazer  PA- E4(e) ZER A4(s) ~B4(s) ~C5(s) ~B4(s) ~D5(s) ~C5(s) ~B4(s) ~A4(s) ~B4(e) ~A4(q)
```

```trope-megillot
#32 זָקֵף גָּד֕וֹל
zakef_gadol ZA- 3{E4(e) KEF E4(e) GA- E4(e)} DOL 3{B4(e) ~G4(e) ~E4(e)} 3{~G4(de) ~F4(s) ~E4(e)} ~E4(q)
```

```trope-megillot
#33 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv       Y'- B4(g) TIV B4(e) ~E4(e) rest(e)
munach      MU- G4(e) NACH G4(s) ~E4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(ds) ~F4(32) ~E4(q)
```

```trope-megillot
#34 יְ֚תִיב קָטֹ֔ן
yetiv       Y'- B4(g) TIV B4(e) ~E4(e) rest(e)
zakef_katon KA- G4(e) TON G4(ds) ~F4(32) ~E4(q)
```

```trope-megillot
#35 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach MU- C4(e) NACH G4(de)
zarka  ZAR- G4(s) KA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(s) ~D4(s) ~C4(e) rest(s)
munach MU- C4(e) NACH G4(de)
segol  SE- G4(s) GOL G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~A4(e) ~E4(dq)
```

```trope-megillot
#36 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach MU- C4(e) NACH G4(de)
zarka  ZAR- G4(s) KA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(s) ~D4(s) ~C4(e) rest(s)
segol  SE- G4(e) GOL G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~A4(e) ~E4(dq)
```

```trope-megillot
#37 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka  ZAR- G4(e) KA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(s) ~D4(s) ~C4(e) rest(s)
munach MU- C4(e) NACH G4(de)
segol  SE- G4(s) GOL G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~A4(e) ~E4(dq)
```

```trope-megillot
#38 זַרְקָא֮ סֶגּוֹל֒
zarka  ZAR- G4(e) KA G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(s) ~D4(s) ~C4(e) rest(s)
segol  SE- G4(e) GOL G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~A4(e) ~E4(dq)
```

```trope-megillot
#39 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- E4(e) CHA E4(e)
tipcha    TIP- G4(e) CHA 6{C5(s) ~B4(s) ~A4(s) ~G4(s) ~A4(s) ~B4(s)} ~A4(q)
mercha    MER- G4(e) CHA G4(e)
sof_pasuk SOF- G4(s) PA- G4(s) SUK G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) ~C4(dq)
```

```trope-megillot
#39a [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- E4(e) CHA E4(e)
tipcha    TIP- G4(e) CHA 6{C5(s) ~B4(s) ~A4(s) ~G4(s) ~A4(s) ~B4(s)} ~A4(q)
mercha    MER- G4(e) CHA G4(e)
sof_pasuk SOF- G4(s) PA- G4(s) SUK G4(e) ~G4(32) ~F4(32) ~E4(32) ~D4(32) ~G4(e) ~C4(dq)
```
## K. The 38 Eicha phrase patterns

Transcribed note for note from the Eicha (Lamentations) chart in *The Art of Cantillation, Volume 2*
(Marshall Portnoy and Josée Wolff, UAHC Press, 2001), Appendix G, pages 94–96: rows 1–9 on the first
page, 10–29 on the second, 30–38 on the third, the last marked "(end of each chapter)". The scan was
read as the book's other three charts were (sections H–J): a row at a time at 400 dpi, by eye from
re-cropped rows that keep their bracket numbers and by the note-head detector, with the beams counted
run by run in the pixel columns between the stems, every dot, flag, rest, grace note and curve in doubt
magnified to 4–8× or dumped pixel by pixel, and each figure compared against the same figure elsewhere
on the page. The melody is the traditional one for Eicha on Tisha B'Av; the transcription is
CC BY-SA 4.0 like the rest of this file. No page reads these rows yet (the wiring is a candidate in
`docs/IMPROVEMENT_LOG.md`), but the builder derives `data/trope/trope_motifs_eicha.json` from them
through section A's Eicha column on every run, so the Learn cards are ready; never edit that file by
hand.

**Key and range.** Three flats, E♭ major, like the Haftarah chart, and one printed accidental: the E♮
of the figure F4 E♮4 F4 that opens segol's GOL (rows 34–37). Every B, E and A is written with its sign
(`B♭4`, `E♭4`, `E♮4`, `A♭4`), nothing else is altered, and the builder refuses any other sign
(`key: Eb`). The rows lie between B♭3 and C5, the Haftarah chart's compass: the etnachta and the sof
pasuk both close on C4, the revia on the B♭3 below the staff, and nothing rises above C5. Row numbers
are the chart's own.

**The rows.** The chart's order: the etnachta clause (1–4) and the sof pasuk clause (5–8); the zakef
katon clause (9–14); kadma v'azla and geresh (15–16); revia (17–19); gershayim (20–21); darga and
tevir (22–28); the telishas (29–30); zakef gadol (31); yetiv (32–33); the segol clause (34–37); the
closing formula (38). There is no pazer row: the chart prints none, as it prints no shalshelet, mercha
kefula, karnei parah or yerach ben yomo, so those five marks have no row and no Learn card (section A),
and the rows from zakef gadol on are numbered one lower than the Haftarah chart's, whose row 31 is the
pazer this chart lacks. The Hebrew of each row is the printed row of section B or H with the same
marks. The syllables are the chart's own (K′-TA-NA with no final H, G′-DO-LAH), spelled as section B
spells the same mark where the two agree.

**Figures that change with their neighbours** (as printed; the report lists every figure). Mercha's
CHA is a dotted eighth and tipcha's TIP the sixteenth that completes it (1, 3, 5, 7); a TIP that opens
the row is an eighth (2, 4, 6, 8). Tipcha's CHA is four notes before etnachta, A♭4 G4 F4 F4 (1–4),
and three before sof pasuk (5–8), where the last F4 is left out and an eighth rest follows; before
etnachta its last note is beamed on into the munach's MU (1–2) and flagged on its own when no munach
follows (3–4). Mercha's
CHA, SOF and PA make a triplet of eighths (5, 6, 38); SOF and PA alone are a pair of sixteenths (7, 8).
Kadma's MA is a dotted eighth before mahpach (9), whose own MA is the sixteenth that completes it, and
a plain eighth before darga and mercha (26, 27); a mahpach that opens the row begins on an eighth (10,
11, 14). Pashta's PASH is a sixteenth: beamed onto the mahpach's three sixteenths after a mahpach
(9–11, 14), flagged on its own after none (12, 13). Zakef katon's KA is F4 in every row — the third
note of the munach's triplet after a munach (9, 10, 12, 14, 32) and a flagged eighth after none (11,
13, 33) — and its TON, G4 then E♭4, ends on a quarter after pashta (9–14) and on a dotted quarter
after yetiv (32, 33). Darga's GA ends on a dotted quarter in rows 22, 24 and 26 and on a plain
quarter in row 28; mercha's CHA before tevir ends on a quarter in row 25 and on a dotted quarter in
row 27 — the print's own differences, kept, and listed for the ear check. Tevir's T′ is a plain
eighth in every row (23–28). Revia's R′ is a sixteenth, beamed onto the munach's NACH (17, 18) and
flagged on its own (19). Gershayim's GER and SHA are a beamed pair in row 20; in row 21 GER is flagged
and SHA is beamed onto YIM's first note instead, and row 20 closes with an eighth rest that row 21
lacks. The munach before zarka sings NACH on A♭4 G4 F4 with the ZAR beamed onto its last note (34,
35); a zarka that opens the row begins on a flagged eighth (36, 37).

**Brackets, grace notes, rests, articulation.** The chart prints a `3` over its triplets — mercha's
CHA with SOF and PA (5, 6, 38), munach's NACH with zakef katon's KA (9, 10, 12, 14, 32), kadma
v'azla's s s e e (15: the bracket runs from MA into V′-AZ), geresh's three eighths (16), munach
legarmeh's E♭4 D4 E♭4 (17), tevir's VIR (23–28), telisha ketana's NA (30) and segol's F4 E♮4 F4
(34–37) — and a `5` over the five thirty-seconds of revia's I (17–19). Grace notes: yetiv's Y′ on C5
(32, 33), and a pair of small notes in parentheses, B♭4 C5, printed before mahpach's PACH in every
mahpach row (9–11, 14), written as two `(g)` notes at the start of PACH. Rests are printed and the
rows keep them: an eighth rest after the tipcha before sof pasuk (5–8), after munach legarmeh's run
(17), after gershayim's last note (20),
after the munach before the telishas (29, 30), after yetiv's TIV (32, 33), after zarka's last note
(34–37) and after the closing tipcha's (38). Articulation: tenuto lines on the last three notes of
etnachta's TA and sof pasuk's SUK (1–8), of revia's I (17–19), of tevir's VIR (23–28) and of zakef
gadol's DOL (31); the closing row prints none, and no accent or marcato wedge appears on the chart.

**The closing row.** Row 38, "(end of each chapter)", is the one `[aliyah-end]` row: Eicha is read
without aliyot, so the tag means the end of a chapter, and the chart gives the shorter endings no rows
of their own, so none is derived (a reader who needs one sings the printed row with the missing marks
left out). Its tipcha opens as the Esther chart's closing tipcha does (section I, row 41), C5 C5 and
four thirty-seconds down to F4, but settles on a quarter and an eighth rest where Esther's runs on
through F4 E♮4 F4.

**Known differences from Binder.** The same comparison was made against Binder's Eicha chart (Chart
6, printed a tone higher with one flat) and the HUC Lamentations page (one flat). Binder's chart
agrees with this one, note for note after transposition, in every clause — the etnachta and sof
pasuk clauses with their rests (1–8), the zakef katon clause down to the two small notes before
mahpach's PACH (9–14), kadma v'azla and geresh (15–16), the revia rows with the `5` over the run
(17–19), gershayim (20–21), darga and tevir (22–28), both telishas (29–30), zakef gadol (31), yetiv
(32–33), the segol clause, where Binder prints the same raised lower neighbour in the triplet as a
sharp in his key (34–37), and the chapter's closing (38) — and no difference was found. The HUC page
shows the same sharpened note in segol and the same closing shape; read for contour only, nothing
legible in it contradicts either chart. (Binder also prints three shorter closings; this chart does
not, and none is derived here.)

```trope-eicha
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- C4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(s) ~G4(s) ~F4(e) ~F4(e)
munach    MU- F4(e) NACH F4(32) ~C4(32) ~F4(s)
etnachta  ET- F4(s) NACH- F4(s) TA E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#2 טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
tipcha    TIP- A♭4(e) CHA A♭4(s) ~G4(s) ~F4(e) ~F4(e)
munach    MU- F4(e) NACH F4(32) ~C4(32) ~F4(s)
etnachta  ET- F4(s) NACH- F4(s) TA E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#3 מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
mercha    MER- C4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(s) ~G4(s) ~F4(e) ~F4(e)
etnachta  ET- F4(s) NACH- F4(s) TA E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#4 טִפְּחָ֖א אֶתְנַחְתָּ֑א
tipcha    TIP- A♭4(e) CHA A♭4(s) ~G4(s) ~F4(e) ~F4(e)
etnachta  ET- F4(s) NACH- F4(s) TA E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- C4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(s) ~G4(s) ~F4(e) rest(e)
mercha    MER- C4(e) CHA 3{F4(e)
sof_pasuk SOF- F4(e) PA- F4(e)} SUK E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
tipcha    TIP- A♭4(e) CHA A♭4(s) ~G4(s) ~F4(e) rest(e)
mercha    MER- C4(e) CHA 3{F4(e)
sof_pasuk SOF- F4(e) PA- F4(e)} SUK E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
mercha    MER- C4(e) CHA A♭4(de)
tipcha    TIP- A♭4(s) CHA A♭4(s) ~G4(s) ~F4(e) rest(e)
sof_pasuk SOF- F4(s) PA- F4(s) SUK E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#8 טִפְּחָ֖א סוֹף־פָּסֽוּק׃
tipcha    TIP- A♭4(e) CHA A♭4(s) ~G4(s) ~F4(e) rest(e)
sof_pasuk SOF- F4(s) PA- F4(s) SUK E♭4(de,-) ~D4(s,-) ~C4(q,-)
```

```trope-eicha
#9 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
kadma       KAD- G4(e) MA B♭4(de)
mahpach     MA- B♭4(s) PACH B♭4(g) C5(g) B♭4(s) ~G4(s) ~E♭4(s)
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
munach      MU- B♭3(e) NACH 3{B♭3(e) ~E♭4(e)
zakef_katon KA- F4(e)} TON G4(e) ~E♭4(q)
```

```trope-eicha
#10 מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
mahpach     MA- B♭4(e) PACH B♭4(g) C5(g) B♭4(s) ~G4(s) ~E♭4(s)
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
munach      MU- B♭3(e) NACH 3{B♭3(e) ~E♭4(e)
zakef_katon KA- F4(e)} TON G4(e) ~E♭4(q)
```

```trope-eicha
#11 מַהְפָּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach     MA- B♭4(e) PACH B♭4(g) C5(g) B♭4(s) ~G4(s) ~E♭4(s)
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(q)
```

```trope-eicha
#12 פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
munach      MU- B♭3(e) NACH 3{B♭3(e) ~E♭4(e)
zakef_katon KA- F4(e)} TON G4(e) ~E♭4(q)
```

```trope-eicha
#13 פַּשְׁטָא֙ קָטֹ֔ן
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(q)
```

```trope-eicha
#14 מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח קָטֹ֔ן
munach      MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(e)
mahpach     MA- B♭4(e) PACH B♭4(g) C5(g) B♭4(s) ~G4(s) ~E♭4(s)
pashta      PASH- G4(s) TA C5(e) ~B♭4(q)
munach      MU- B♭3(e) NACH 3{B♭3(e) ~E♭4(e)
zakef_katon KA- F4(e)} TON G4(e) ~E♭4(q)
```

```trope-eicha
#15 קַדְמָ֨א וְאַזְלָ֜א
kadma  KAD- G4(e) MA 3{B♭4(s) ~G4(s)
geresh V'- G4(e) AZ- G4(e)} LA C5(e) ~B♭4(dq)
```

```trope-eicha
#16 גֵּ֜רֵשׁ
geresh GE- 3{B♭4(e) ~G4(e) ~C5(e)} RESH B♭4(q)
```

```trope-eicha
#17 מֻנָּ֣ח ׀ מֻנָּ֣ח רְבִיעִ֗י
munach_legarmeh MU- E♭4(e) NACH 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(e) ~E♭4(e) rest(e)
munach MU- G4(e) NACH C5(s) ~B♭4(s) ~G4(e)
revia  R'- G4(s) VI- G4(e) I 5{G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(32)} ~D4(e,-) ~C4(e,-) ~B♭3(e,-)
```

```trope-eicha
#18 מֻנָּ֣ח רְבִיעִ֗י
munach MU- G4(e) NACH C5(s) ~B♭4(s) ~G4(e)
revia  R'- G4(s) VI- G4(e) I 5{G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(32)} ~D4(e,-) ~C4(e,-) ~B♭3(e,-)
```

```trope-eicha
#19 רְבִיעִ֗י
revia  R'- G4(s) VI- G4(e) I 5{G4(32) ~F4(32) ~E♭4(32) ~D4(32) ~C4(32)} ~D4(e,-) ~C4(e,-) ~B♭3(e,-)
```

```trope-eicha
#20 גֵּרְשַׁיִ֞ם
gershayim GER- G4(e) SHA- G4(e) YIM B♭4(e) ~B♭4(32) ~A♭4(32) ~G4(32) ~A♭4(32) ~B♭4(e) rest(e)
```

```trope-eicha
#21 מֻנָּ֣ח גֵּרְשַׁיִ֞ם
munach    MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(e)
gershayim GER- G4(e) SHA- G4(e) YIM B♭4(e) ~B♭4(32) ~A♭4(32) ~G4(32) ~A♭4(32) ~B♭4(e)
```

```trope-eicha
#22 דַּרְגָּ֧א
darga DAR- G4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(dq)
```

```trope-eicha
#23 תְּבִ֛יר
tevir T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#24 דַּרְגָּ֧א תְּבִ֛יר
darga DAR- G4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(dq)
tevir T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#25 מֵרְכָ֥א תְּבִ֛יר
mercha MER- G4(e) CHA B♭4(e) ~F4(q)
tevir  T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#26 קַדְמָ֨א דַּרְגָּ֧א תְּבִ֛יר
kadma KAD- G4(e) MA B♭4(e)
darga DAR- G4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(dq)
tevir T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#27 קַדְמָ֨א מֵרְכָ֥א תְּבִ֛יר
kadma  KAD- G4(e) MA B♭4(e)
mercha MER- G4(e) CHA B♭4(e) ~F4(dq)
tevir  T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#28 מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach MU- B♭4(e) NACH B♭4(s) ~G4(s) ~B♭4(e)
darga  DAR- G4(e) GA B♭4(de) ~A♭4(32) ~G4(32) ~F4(q)
tevir  T'- E♭4(e) VIR 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(de,-) ~E♭4(s,-) ~D4(q,-)
```

```trope-eicha
#29 מֻנָּ֣ח תְּ֠לִישָׁא גְּדוֹלָה֠
munach         MU- E♭4(e) NACH G4(e) ~F4(e) rest(e)
telisha_gedola T'- E♭4(32) LI- E♭4(32) SHA E♭4(s) G'- E♭4(32) DO- E♭4(32) LAH E♭4(s) ~F4(s) ~G4(s) ~A♭4(s) ~G4(e) ~F4(e) ~E♭4(q)
```

```trope-eicha
#30 מֻנָּ֣ח תְּלִישָׁא קְטַנָּה֩
munach         MU- E♭4(e) NACH G4(e) ~F4(e) rest(e)
telisha_ketana T'- E♭4(32) LI- E♭4(32) SHA E♭4(s) K'- E♭4(32) TA- E♭4(32) NA 3{E♭4(e) ~D4(e) ~E♭4(e)} ~F4(e) ~E♭4(dq)
```

```trope-eicha
#31 זָקֵף גָּד֕וֹל
zakef_gadol ZA- E♭4(e) KEF E♭4(e) GA- G4(e) DOL B♭4(q) ~B♭4(s) ~A♭4(s) ~G4(s) ~F4(s) ~G4(e,-) ~F4(e,-) ~E♭4(q,-)
```

```trope-eicha
#32 יְ֚תִיב מֻנָּ֣ח קָטֹ֔ן
yetiv       Y'- C5(g) TIV C5(e) ~B♭4(e) rest(e)
munach      MU- B♭3(e) NACH 3{B♭3(e) ~E♭4(e)
zakef_katon KA- F4(e)} TON G4(e) ~E♭4(dq)
```

```trope-eicha
#33 יְ֚תִיב קָטֹ֔ן
yetiv       Y'- C5(g) TIV C5(e) ~B♭4(e) rest(e)
zakef_katon KA- F4(e) TON G4(e) ~E♭4(dq)
```

```trope-eicha
#34 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
munach MU- F4(e) NACH A♭4(e) ~G4(e) ~F4(e)
zarka  ZAR- F4(e) KA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(e) rest(e)
munach MU- F4(e) NACH A♭4(e) ~G4(q)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(q) ~F4(q)
```

```trope-eicha
#35 מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach MU- F4(e) NACH A♭4(e) ~G4(e) ~F4(e)
zarka  ZAR- F4(e) KA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(e) rest(e)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(q) ~F4(q)
```

```trope-eicha
#36 זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
zarka  ZAR- F4(e) KA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(e) rest(e)
munach MU- F4(e) NACH A♭4(e) ~G4(q)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(q) ~F4(q)
```

```trope-eicha
#37 זַרְקָא֮ סֶגּוֹל֒
zarka  ZAR- F4(e) KA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(e) rest(e)
segol  SE- F4(e) GOL 3{F4(e) ~E♮4(e) ~F4(e)} ~G4(q) ~F4(q)
```

```trope-eicha
#38 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha    MER- G4(e) CHA G4(e)
tipcha    TIP- C5(e) CHA C5(e) ~C5(32) ~B♭4(32) ~A♭4(32) ~G4(32) ~F4(q) rest(e)
mercha    MER- C4(e) CHA 3{F4(e)
sof_pasuk SOF- C4(e) PA- F4(e)} SUK E♭4(de) ~D4(s) ~C4(q)
```
