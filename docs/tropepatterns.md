# Trope patterns — the printed cantillation chart, transcribed

The Trope Tutor's Learn-card staffs follow the standard Ashkenazi melodies as printed in the
teacher's cantillation chart: Appendix H, *Torah Cantillation* (41 numbered phrase patterns, treble
clef, three sharps = A major), the source of `data/trope/trope_motifs.json`, and *High Holiday Torah
Cantillation* (33 patterns, no key signature), the source of `data/trope/trope_motifs_hh.json`. This
file is the transcription of those pages, every row note for note, read from clean scans of the
chart. The scans are not in the repository (the pages are copyrighted); the melodies themselves are
traditional. This transcription is CC BY-SA 4.0, like the data files it feeds.

**Sections B and C are data.** `node scripts/build-trope-phrases.mjs` reads their row blocks and writes
`data/trope/trope_phrases.json` — every row's notes, syllables, triplets, ties and slurs, the input for
a staff of a whole parasha (section G) — together with `docs/trope_phrases_report.md`, which lists
every figure of every mark in every context the chart prints and checks the tutor's staffs against
their rows. To change a note, edit its row here and re-run the builder; never edit the JSON.

## How to read this file

- **Pitches** are scientific pitch names as printed in the treble clef: C4 is middle C, A3 the A
  below it, so the Torah chart lives between A3 and B4 and the High Holiday chart between G3 and
  B♭4 (men sing both an octave lower).
- **Key and accidentals.** In the Torah chart every F, C and G is sharp unless a natural sign is
  printed; the rows write every one of them with its sign (`F♯4`, `C♯4`, `G♮4`), so a letter without
  one cannot pass for a misreading, and the builder refuses any accidental the chart does not print.
  A row has no bar lines, so a printed accidental holds to the end of its row: mercha kefula's second
  G carries no sign and is G♮ (row 39). The High Holiday chart has no key signature and prints each
  accidental where it wants one: a flat on `B♭`, and one sharp, on telisha ketana's `F♯`.
- **Scale degrees** are given relative to A for the Torah chart (A = 1, B = 2, C♯ = 3, D = 4,
  E = 5, F♯ = 6, G♯ = 7; ′ is the octave above). The tutor stores `p` = semitones from B4 (B♭4 = −1,
  A4 = −2, G4 = −4, F♯4 = −5, F4 = −6, E4 = −7, D4 = −9, C♯4 = −10, C4 = −11, B3 = −12, A3 = −14,
  G3 = −16).
- **The row blocks** (sections B and C) are fenced ` ```trope-torah ` / ` ```trope-hh ` blocks:

  ```
  #<row> [tag] <the Hebrew names with their marks>
  <mark>  <SYL>[-] <note> <note> … <SYL>[-] <note> …
  ```

  - The first line is the row number (High Holiday row 20's parenthesized second setting is `#20b`),
    then the tags — `[aliyah-end]` for the closing formula of an aliyah's last verse (Torah 41, High
    Holiday 30–33), `[unverified]` for a row the scans could not settle (none is) — then the Hebrew.
    Its marks must name the same marks as the lines below (׃ counts as sof pasuk; a ׀ after a munach
    makes it munach legarmeh).
  - Then one line per mark, left to right as printed. The mark is the tutor's key (`TROPES` in
    `trope_tutor.html`) or `munach_legarmeh`.
  - A syllable (MER, CHA, T′ …) starts at the note printed above it and runs to the next syllable; a
    `-` after it means the next syllable continues the same word.
  - A note is `PITCH(VALUE)`, with `,>` for an accent and `,-` for a tenuto line. Values: `32` a
    thirty-second, `s` a sixteenth, `ds` a dotted sixteenth, `e` an eighth, `de` a dotted eighth, `q` a
    quarter, `dq` a dotted quarter, `h` a half, `dh` a dotted half, `g` a grace note (small; no time of
    its own). `rest(e)` is a rest.
  - Before a note, `~` is a slur arriving from the note before, `~~` a dashed slur, `=` a tie (one
    held sound) and `~=` a tie under a slur.
  - `3{` … `}` wraps a printed triplet, three notes in the time of two; the values inside are the
    printed ones, and a triplet may run from one mark's line into the next.
  - Beams are not written: they follow from the values.

## A. One figure per mark (the Learn-card staffs)

Each Learn card draws one figure per melody: the mark's line in the row named below — the row where
the mark stands alone, or last, in its phrase. The staff has four values (`d` 1–4: eighth, quarter,
dotted quarter, half), so a row is read onto it like this: a grace note becomes an eighth, tied notes
become one held note, rests drop, anything shorter than a quarter is drawn as an eighth (a dotted
eighth or a triplet note included), and a longer note takes the nearest of the other three values.
The builder checks every staff against its row on each run (`docs/trope_phrases_report.md` → *The
Trope Tutor's staffs against their rows*); the figures themselves, for both melodies and in every
context, are listed in the same report.

| Mark (tutor key) | Torah row | High Holiday row | On the staff |
|---|---|---|---|
| mercha | 1 | 1 | |
| tipcha | 4 | 4 | |
| munach (before etnachta) | 2 | 2 | |
| etnachta | 4 | 4 | |
| sof_pasuk | 8 | 8 | |
| mahpach | 11 | 11 | |
| pashta | 13 | 10 | |
| yetiv | 33 | 24 | Y′ is sung on a grace note, drawn as an eighth |
| zakef_katon | 13 | 10 | |
| zakef_gadol | 31 | 25 | |
| zarka | 37 | 29 | Torah: the grace note on F♯4 before KA is drawn as an eighth |
| segol | 37 | 29 | |
| shalshelet | 38 | — | |
| revia | 19 | 16 | |
| darga | 21 | 13 | |
| tevir | 22 | 13 | |
| kadma (in kadma v'azla) | 15 | 20 | |
| geresh (azla) | 16 | 21 | |
| gershayim | 20 | 22 | |
| telisha_ketana | 29 | 18 | Torah: T′ is sung on a grace note, drawn as an eighth |
| telisha_gedola | 28 | 17 | Torah: as telisha ketana |
| pazer | 30 | 19 | Torah: PA-ZER's two D4s are held as one quarter — the maintainer's correction of the print; the High Holiday staff keeps both |
| mercha_kefula | 39 | — | |
| karnei_parah | 40 | — | |
| yerach_ben_yomo | 40 | — | |
| munach legarmeh (no card) | 17 | 15 | |
| sof pasuk at the end of an aliyah (no card) | 41 | 30–33 | |

`geresh_muqdam` has no figure in either chart and no entry (it never occurs in the Torah text either;
see section G). Shalshelet, mercha kefula, karnei parah and yerach ben yomo have no High Holiday row:
they never occur in the Rosh Hashanah or Yom Kippur readings (the census in section G checks this).

The lowered seventh is printed with a natural sign (G♮) in the Torah chart's darga, telisha gedola,
pazer, mercha kefula and karnei parah, and on the munach before zarka (rows 34–35); the High Holiday
chart writes it B♭ (pazer, kadma v'azla, geresh). Articulation is printed, not left to the reader:
accents on shalshelet's B4, zarka's C♯4 and karnei parah's E4 and A4, tenuto lines on pazer's
B4 A4 F♯4 and zakef gadol's ZA-KEF-GA; in the High Holiday chart, accents on the last three notes of
zakef gadol and pazer and tenuto dashes on zarka's closing B3 A3 G3. The staffs do not draw these marks.

## B. The 41 Torah phrase patterns

Read note for note from the clean scans, once by hand and once more independently; the two readings
were compared note by note and every difference was settled at 8–12× zoom, and every row was then
engraved back from the data and laid under its scan. A pixel note-head detector agreed with every
pitch it could measure.

```trope-torah
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנַּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
munach    MU- E4(e) NACH D4(e) ~B3(e)
etnachta  ET- A3(s) NACH- A3(s) TA E4(q)
```

```trope-torah
#2 טִפְּחָ֖א מֻנַּ֣ח אֶתְנַחְתָּ֑א
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
#5 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסוּק׃
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
mercha    MER- C♯4(e) CHA E4(e)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#6 טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסוּק׃
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
mercha    MER- C♯4(e) CHA E4(e)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#7 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסוּק׃
mercha    MER- C♯4(e) CHA E4(de)
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#8 טִפְּחָ֖א סוֹף־פָּסוּק׃
tipcha    TIP- E4(s) CHA F♯4(de) ~A4(s) ~E4(dq)
sof_pasuk SOF- E4(s) PA- E4(s) SUK D4(q) ~A3(q)
```

```trope-torah
#9 קַדְמָ֨א מַהְפַּ֤ךְ פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
kadma     KAD- D4(e) MA F♯4(dq)
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#10 מַהְפַּ֤ךְ פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
munach    MU- F♯4(e) NACH F♯4(s) ~E4(s) ~F♯4(de)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#11 מַהְפַּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
mahpach   MA- F♯4(e) PACH F♯4(s) ~A3(s) ~D4(q)
pashta    PASH- D4(e) TA A4(dq)
zakef_katon KA- F♯4(s) TON A4(q) ~E4(q)
```

```trope-torah
#12 פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
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
#14 מֻנַּ֣ח מַהְפַּ֤ךְ פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
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
#16 גֵּרֵ֜שׁ
geresh    GE- A4(e) ~F♯4(e) ~B4(q) RESH A4(e)
```

```trope-torah
#17 מֻנַּ֣ח ׀ מֻנַּ֣ח רְבִ֗יעִי
munach_legarmeh MU- D4(e) NACH D4(s) ~E4(s) ~F♯4(s) ~D4(s) ~E4(q) rest(e)
munach    MU- E4(e) NACH 3{~A4(e) ~F♯4(e)
revia     R'VI- F♯4(e)} I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#18 מֻנַּ֣ח רְבִ֗יעִי
munach    MU- E4(e) NACH 3{~A4(e) ~F♯4(e)
revia     R'VI- F♯4(e)} I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#19 רְבִ֗יעִי
revia     R'VI- F♯4(e) I E4(de) ~D4(32) ~C♯4(32) ~B3(e)
```

```trope-torah
#20 גֵּרְשַׁ֞יִם
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
#27 מֻנַּ֣ח דַּרְגָּ֧א תְּבִ֛יר
munach    MU- A4(e) NACH A4(s) ~F♯4(s) ~A4(de)
darga     DAR- F♯4(s) GA A4(e) ~G♮4(s) ~F♯4(s) ~E4(de)
tevir     T'- E4(s) VIR 3{D4(q) ~C♯4(q) ~D4(q)} ~E4(q)
```

```trope-torah
#28 מֻנַּ֣ח תְּ֠לִישָׁא גְדוֹלָה
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
telisha_gedola T'- D4(g) LI- D4(e) SHA D4(e) G'DO- D4(e) LA D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(e) ~F♯4(e) ~E4(e) ~D4(q)
```

```trope-torah
#29 מֻנַּ֣ח תְּלִישָׁא קְטַנָּה֩
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
telisha_ketana T'- D4(g) LI- D4(e) SHA D4(e) K'TA- D4(e) NA D4(s) ~C♯4(s) ~D4(s) ~E4(s) ~D4(e)
```

```trope-torah
#30 מֻנַּ֣ח פָּזֵ֡ר
munach    MU- D4(e) NACH F♯4(e) ~E4(e)
pazer     PA- D4(e) ZER D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(s) ~B4(e,-) ~A4(e,-) ~F♯4(e,-) ~E4(q)
```

```trope-torah
#31 זָקֵ֕ף גָּד֕וֹל
zakef_gadol ZA- D4(e,-) KEF D4(e,-) GA- F♯4(e,-) DOL A4(e) ~B4(s) ~A4(s) ~F♯4(e) ~E4(q)
```

```trope-torah
#32 יְ֚תִיב מֻנַּ֣ח קָטֹ֔ן
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
#34 מֻנַּ֣ח זַרְקָא֮ מֻנַּ֣ח סֶגּוֹל֒
munach    MU- G♮4(e) NACH F♯4(e) ~E4(e)
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
munach    MU- A3(e) NACH D4(e) =D4(s)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#35 מֻנַּ֣ח זַרְקָא֮ סֶגּוֹל֒
munach    MU- G♮4(e) NACH F♯4(e) ~E4(e)
zarka     ZAR- E4(e) F♯4(g) KA ~E4(de) ~D4(s) ~C♯4(s) ~B3(s) ~C♯4(e,>) ~A3(q)
segol     SE- D4(s) GOL F♯4(q) ~E4(e)
```

```trope-torah
#36 זַרְקָא֮ מֻנַּ֣ח סֶגּוֹל֒
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
#39 מֵרְכָא֦ כְפוּלָה
mercha_kefula MER- E4(e) CHA E4(e) CH'FU- E4(e) LA E4(e) ~F♯4(e) ~G♮4(e) ~A4(e) ~G♮4(e) ~F♯4(e) ~E4(q)
```

```trope-torah
#40 יֵרַח֪ בֶּן־יוֹמ֪וֹ קַרְנֵי֟ פָרָה֟
yerach_ben_yomo YE- D4(s) RACH D4(s) BEN- D4(s) YO- D4(s) MO F♯4(q) ~E4(q)
karnei_parah KAR- D4(e) NEI D4(e) FA- 3{D4(s) RA ~C♯4(s) ~D4(s)} ~E4(e,>) ~D4(e) D4(s) ~E4(s) ~F♯4(s) ~G♮4(s) ~A4(e,>) ~F♯4(e) ~E4(e) ~D4(q)
```

```trope-torah
#41 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסוּק׃
mercha    MER- B3(e) CHA 3{D4(e) ~C♯4(e)
tipcha    TIP- B3(e)} CHA B4(e) ~F♯4(q)
mercha    MER- D4(e) CHA 3{D4(e)
sof_pasuk SOF- E4(e) PA- F♯4(e)} E4(g) F♯4(g) SUK E4(h) ~B3(h)
```

**What the clean scans changed.** The earlier reading of this chart came from rougher photographs.
Against it, the clean scans show:

- **Phrase-final notes held.** Mahpach's closing D4 (rows 9–11, 14), tevir's closing E4 (22–27),
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
- **Row 41 is settled.** Its last note is B3: measured 1½ spaces below the staff, where the print
  leaves out the ledger line. The two small notes between PA and SUK are grace notes, E4 F♯4.

The tutor's staffs were corrected to match (section E).

## C. The 33 High Holiday phrase patterns

The set has no key signature and sits on C/D: its sof pasuk ends on C4, its etnachta on D4. It
prints B♭ where the Torah chart prints G♮ (the same lowered seventh), and its one other accidental
is the F♯ in telisha ketana's run (row 18). Rows 1–8 pair with Torah rows 1–8, and rows 30–33 are
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

Notes that differ from the first pass:

- **The munach before the telishas and pazer** (17–19) is C4, then E4 D4. It is an eighth, not the
  grace note the first pass saw.
- **The munach before revia** (15–16) holds its G4: a quarter tied to an eighth in row 15, two tied
  eighths in row 16.
- **Munach legarmeh** (15) is D4 B3 D4 in eighths.
- **The end-of-aliyah rows** (30–33). Tipcha's CHA is an A4 tied into a thirty-second run,
  A4 G4 F4 E4, then D4. The mercha before sof pasuk is E4 F4 E4, not D4 D4 E4.
- **Row 20b** (the second kadma v'azla) ends A4 G4, the G4 a dotted quarter. There is no E4.
- **Zarka's closing B3 A3 G3** each carry a short dash above the stem, read as a tenuto. The
  first pass took these dashes for notes.
- **Segol** (26–29). GOL's G4 is tied into the first note of its run, so the figure has two G4s, not
  three. Its closing D4 is tied into a quarter. The High Holiday segol staff was corrected (section E).

```trope-hh
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנַּ֣ח אֶתְנַחְתָּ֑א
mercha    MER- D4(e) CHA D4(de)
tipcha    TIP- D4(s) CHA G4(e) ~D4(q)
munach    MU- D4(e) NACH 3{C4(e)
etnachta  ET- C4(e) NACH- C4(e)} TA F4(de) ~E4(s) ~D4(q)
```

```trope-hh
#2 טִפְּחָ֖א מֻנַּ֣ח אֶתְנַחְתָּ֑א
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
#9 קַדְמָ֨א מַהְפַּ֤ךְ פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
kadma     KAD- D4(e) MA G4(de)
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
munach    MU- F4(e) NACH F4(s) ~D4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(e) ~D4(dq)
```

```trope-hh
#10 קַדְמָ֨א מַהְפַּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
kadma     KAD- D4(e) MA G4(de)
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
zakef_katon KA- G4(e) TON G4(e) ~D4(dq)
```

```trope-hh
#11 מַהְפַּ֤ךְ פַּשְׁטָא֙ מֻנַּ֣ח קָטֹ֔ן
mahpach   MA- G4(s) PACH G4(s) ~D4(s) ~C4(s)
pashta    PASH- D4(s) TA A4(e) ~G4(e) rest(e)
munach    MU- F4(e) NACH F4(s) ~D4(s) ~G4(ds)
zakef_katon KA- G4(32) TON G4(e) ~D4(dq)
```

```trope-hh
#12 מֻנַּ֣ח מַהְפַּ֤ךְ פַּשְׁטָא֙ קָטֹ֔ן
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
#15 מֻנַּ֣ח ׀ מֻנַּ֣ח רְבִ֗יעִי
munach_legarmeh MU- D4(e) NACH B3(e) ~D4(e) rest(e)
munach    MU- D4(e) NACH D4(s) ~A4(s) ~G4(q) ~=G4(e)
revia     R'- G4(e) VI- G4(e) I G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) ~D4(e) ~C4(q)
```

```trope-hh
#16 מֻנַּ֣ח רְבִ֗יעִי
munach    MU- D4(e) NACH D4(s) ~A4(s) ~G4(e) ~=G4(e)
revia     R'- G4(e) VI- G4(e) I G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) ~D4(e) ~C4(q)
```

```trope-hh
#17 מֻנַּ֣ח תְּ֠לִישָׁא גְדוֹלָה
munach    MU- C4(e) NACH E4(e) ~D4(e) rest(e)
telisha_gedola T'- D4(32) LI- D4(32) SHA- D4(32) G'DO- D4(32) LA D4(s) ~E4(s) ~F4(s) ~G4(s) ~F4(s) ~E4(s) ~D4(q)
```

```trope-hh
#18 מֻנַּ֣ח תְּלִישָׁא קְטַנָּה֩
munach    MU- C4(e) NACH E4(e) ~D4(e) rest(e)
telisha_ketana T'- D4(32) LI- D4(32) SHA- D4(32) K'TA- D4(32) NAH G4(s) ~F♯4(s) ~G4(s) ~D4(s) ~=D4(q)
```

```trope-hh
#19 מֻנַּ֣ח פָּזֵ֡ר
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
#21 גֵּרֵ֜שׁ
geresh    GE- 3{B♭4(e) ~A4(e) ~G4(e)} ~A4(e) RESH G4(q)
```

```trope-hh
#22 גֵּרְשַׁ֞יִם
gershayim GER- D4(e) SHA- D4(e) YIM D4(32) ~E4(32) ~F4(32) ~C4(32) ~G4(e) ~=G4(q)
```

```trope-hh
#23 יְ֚תִיב מֻנַּ֣ח קָטֹ֔ן
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
#25 זָקֵ֕ף גָּד֕וֹל
zakef_gadol ZA- 3{D4(e) KEF D4(e) GA- D4(e)} DOL A4(s) ~G4(s) ~F4(s) ~E4(s) ~F4(e,>) ~E4(e,>) ~D4(q,>)
```

```trope-hh
#26 מֻנַּ֣ח זַרְקָא֮ מֻנַּ֣ח סֶגוֹל֒
munach    MU- C4(e) NACH 3{E4(e) ~D4(e)
zarka     ZAR- D4(e)} KA D4(e) ~D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
munach    MU- D4(e) NACH G4(de)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#27 זַרְקָא֮ מֻנַּ֣ח סֶגוֹל֒
zarka     ZAR- D4(e) KA D4(e) ~D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
munach    MU- D4(e) NACH G4(de)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#28 מֻנַּ֣ח זַרְקָא֮ סֶגוֹל֒
munach    MU- C4(e) NACH 3{E4(e) D4(e)
zarka     ZAR- D4(e)} KA D4(e) ~=D4(32) ~C4(32) ~B3(32) ~A3(32) ~B3(e,-) ~A3(e,-) ~G3(q,-) rest(e)
segol     SE- G4(s) GOL G4(e) ~=G4(32) ~F4(32) ~E4(32) ~D4(32) ~E4(e) 3{~F4(32) ~E4(32) ~D4(32)} ~=D4(q)
```

```trope-hh
#29 זַרְקָא֮ סֶגוֹל֒
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
  - before zakef katon: F♯4, then F♯4–E4–F♯4 (9–12);
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
  geresh of row 16 (A4 F♯4 B4 A4; the geresh holds its B4). That is why the tutor's Sephardi name
  for kadma is Azla, and why the card note says kadma "leads straight into a geresh".
- **The last verse of an aliyah has its own ending** (row 41; High Holiday rows 30–33): a higher,
  longer formula in which mercha and tipcha change as well as sof pasuk. The tutor's sof pasuk card
  does not show it. The Torah chart prints it only for mercha–tipcha–mercha–sof pasuk. The High Holiday
  chart prints all four common closings; see section G for how often each occurs.
- **The lowered seventh is part of the mode.** Every run that touches the seventh degree flattens
  it (G♮ in A major, B♭ in the High Holiday set), so the melody is Mixolydian on those notes even
  though the signature says major.
- **Ornaments are notated, not improvised.** Grace notes:
  - in front of zarka's KA;
  - under the telishas' T′ and yetiv's Y′;
  - before the end-of-aliyah SUK.

  Triplets sit inside tevir, gershayim, karnei parah and the High Holiday pazer, and run from one
  word into the next in munach–revia and the end-of-aliyah phrases. Accents and tenuto lines are
  listed in section A.
- **The chart's own order is a teaching order:**
  - the etnachta clause (1–4);
  - the sof pasuk clause (5–8);
  - the zakef katon clause (9–14);
  - the geresh group (15–21);
  - the tevir group (22–27);
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
  - `scripts/build-trope-phrases.mjs` checks every entry against its row on each run, reduced as
    section A says, and fails on any difference, printing the notes the row gives. The pazer
    correction is applied before the comparison.
  - The clean scans corrected eight staffs:
    - the closing note becomes a quarter in mahpach, zarka, tevir, telisha gedola, pazer and karnei
      parah;
    - yetiv gains the grace note Y′ is sung on;
    - karnei parah gains its missing E4;
    - the High Holiday segol loses the G4 that is tied into its run.
- The file's top-level `key: "A"` tells the Learn-card staff to draw three sharps and to spell
  in-key notes without accidentals, so a natural sign appears only where the chart prints one. A
  note outside the key is spelled the way the charts print chromatic notes (raised 1st and 4th,
  lowered 3rd, 6th and 7th): G♮ here, F♯ and B♭ in the High Holiday file.
- Rhythm is reduced to the staff's four values (`d` 1–4), as section A says. A grace note is drawn as
  a full eighth: zarka's F♯4 before KA, the D4 each telisha sings T′ on, and yetiv's Y′ (B4; A4 in the
  High Holiday file). Pazer's two opening D4s are one quarter note on the year-round staff (section A).
  Shalshelet, karnei parah and telisha gedola keep their full length (up to sixteen notes), so those
  staffs widen.
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
key bar described in section E.)

1. High Holiday recordings for the Torah Trainer's Rosh Hashanah and Yom Kippur readings: those
   readings now link to the tutor on the High Holiday melody, but their chant buttons still play
   PocketTorah's year-round recordings.
2. A phrases tab: the rows above as playable, printable lines grouped by clause, with the Hebrew
   phrase and mark chips. Its data exists: `data/trope/trope_phrases.json`.
3. A "what comes next" drill: a phrase with one mark hidden, or the marks of a phrase to put in
   order.
4. Context variants on the Learn card: munach's shapes and the tevir-context mercha and kadma,
   each with the phrase they belong to (the figures are in `docs/trope_phrases_report.md`).
5. Teaching the end-of-aliyah sof pasuk, on the card and as a highlight of an aliyah's last verse
   in the Torah Trainer.
6. A munach legarmeh card.
7. A one-sheet phrase chart to print in the teacher's chosen key (the key bar's setting).
8. A staff for a whole reading, a verse to a parasha, drawn and played under the Hebrew (section G).

## G. Toward a parasha staff

The aim is a staff under any reading — a verse, an aliyah, a whole parasha — that draws and plays its
cantillation. The chart supplies the figures. This section records what a builder of that staff needs
to know, and what the chart leaves open.

- **The data** is `data/trope/trope_phrases.json`, built from sections B and C. No page fetches it
  yet; the first page to load it adds a `?v=1` (`docs/reference/torah-and-trope.md`). For each
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
  - A disjunctive has the same figure wherever the chart prints it, except in the last verse of an
    aliyah, whose closing mercha, tipcha and sof pasuk take the `[aliyah-end]` rows.
  - The melody (`torah` or `highholiday`) picks the half of the file.
- **Words, as the text gives them.** A word joined to the next by a maqaf (־) has no mark of its own,
  so the pair is one word with one figure. A vertical line (׀) after a munach is one of two signs
  that print alike. It is either the legarmeh line, which makes the munach munach legarmeh, or a
  paseq, a short pause that leaves the munach a connecting mark (Genesis 22:11, אַבְרָהָ֣ם ׀ אַבְרָהָ֑ם).
  The census's text draws the paseq smaller, and a staff builder's text has to tell the two apart as
  well. A double pashta, and the doubled telishas, segol and zarka, are one mark written twice: one sign at the
  word's edge, the other on its stressed syllable. A word can carry two different marks, most often a
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
    pasuk) fits 65 of the 376 aliyah-final verses the census reads. The two others end inside the
    excluded Decalogues. Of the rest, 139 end mercha tipcha sof pasuk, 100 tipcha mercha sof pasuk,
    71 tipcha sof pasuk and one sof pasuk alone. The High Holiday chart prints all four common closings,
    but in its own melody.
  - **The High Holiday readings.** In the four Rosh Hashanah and Yom Kippur readings, 94.0% of the
    conjunctives stand before a printed context, 95.2% with the fallback. None of the four marks the
    High Holiday chart leaves out occurs there.
  - **Left out.** Genesis 35:22 and the two Decalogues are marked with two cantillation systems at
    once, so the census leaves them out.

  Each gap is a place where a parasha staff needs a decision, a recording to listen to or a second
  source. The report lists every one with an example verse.
