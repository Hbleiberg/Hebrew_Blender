# Trope traditions — the other charts, transcribed

The Trope Tutor and the Torah Trainer's Trope staff draw the Binder–Avery and Portnoy & Wolff charts of
`docs/tropepatterns.md` by default. This file holds the **other traditions** a teacher may choose instead,
twenty of them, each under the reading it is sung for:

- the common (Lithuanian) melody of most Conservative and Orthodox synagogues, for the Torah and the haftarah,
  each from a Conservative congregation's printed learner's chart;
- Hazzan Pinchas Spiro's High Holy Day Torah chart;
- seventeen columns of the cantillation tables of the *Jewish Encyclopedia* (1901–1906, article
  "Cantillation", Francis L. Cohen): the Western Ashkenazi, Spanish & Portuguese, Moroccan, Syrian and
  Baghdadi readings of the Torah, the haftarah, the High Holy Days, Esther, Eicha and the festival megillot, and
  Reuchlin's 1518 Ashkenazi notation as the table re-sets it.

**Every row here was transcribed from scans with AI help (the "Ta'amei HaMikra Trope Atlas") and has not yet
been checked against the originals.** No tradition reaches a student until the maintainer has compared it with
its source on `trope_review.html` and approved it in `data/trope/trope_approvals.json` — one line per tradition,
holding the fingerprint of the rows approved, so an edit to an approved tradition's rows hides it again until it
is re-approved. `?preview=traditions` on either page shows the rest, marked *Unverified transcription*
(`docs/reference/torah-and-trope.md` → *Traditions*). The melodies are traditional; the JE tables are in the
public domain; this transcription is CC BY-SA 4.0, like the data file it feeds.

**This file is data.** `node scripts/build-trope-phrases.mjs` reads its `trope-system` and `trope-row` blocks
together with `docs/tropepatterns.md`'s and writes every tradition into `data/trope/trope_phrases.json`, beside
the six charts. To change a note, edit its row here and re-run the builder; never edit the JSON.

## How to read this file

The rows are written in `docs/tropepatterns.md`'s grammar (its *How to read this file*: `#<row> [tags] <Hebrew>`,
one line per mark, `PITCH(VALUE)` notes, `rest(VALUE)`, `~` slurs, `=` ties, `N{ … }` brackets, `3{ … }` a
triplet scaled to two-thirds), with these differences:

- **A `trope-system <id>` block opens each tradition**, one `name: value` per line:
  - `group` — the reading it is sung for: `torah`, `haftarah`, `hhd` (the High Holy Day Torah reading), `esther`,
    `eicha` or `megillot` (Shir HaShirim, Ruth and Kohelet);
  - `key` — the key its staff is written in (a major key name: `C`, `G`, `F`, `D`…);
  - `rows` — how many rows follow (each in a `trope-row <id>` block; a row number may carry a letter, `1a`);
  - `underlay` — `syllables` (the chart prints its own syllables under the notes) or `names` (the JE tables
    print only the sign's name: its lines carry notes alone, and the builder writes the sign's name under its
    first note, spanning the sign — a label, never a sung syllable);
  - `accidentals` — the signs the chart prints beyond its key signature (`B♭ F♯ G♯`; `—` for none); the builder
    refuses any other;
  - `lacks` — the marks it prints no figure for (`—` for none); the builder checks this against the rows, and
    the pages say so on those marks' cards and offer the default chart's figure instead;
  - `label`, `short`, `trad`, `sub`, `note` — its names and description, as the atlas gives them;
  - `source` and `license` — the citation and terms both pages show in their sources list.
- **Spelling.** Every note is written as it sounds, a key-signature letter always with its sign (`F♯4` in G,
  `B♭4` in F) or its natural (`F♮4`), any other letter bare unless the chart prints a sign. Each pitch is spelled
  one way throughout a tradition, and **the staff draws every note exactly as it is written here**: where a
  tradition spells a chromatic note otherwise than the charts' rule (raised first and fourth, lowered third, sixth
  and seventh), the builder stores that tradition's `chroma` — the raised fifth of six JE columns, G♯ in C and
  D♯ in G, which a staff moved up three half steps from C writes B♮ in E♭ — and checks the staff engine's
  spelling note by note.
- **Syllables** keep the chart's own case and hyphens (`Mer- chaw`, `T'vir`).
- **`,opt`** after the value is a pickup the chart prints in parentheses (Spiro's optional notes for unstressed
  syllables): the staff draws it in parentheses, unbeamed. **`,fermata`** is a fermata over the note; the tunes
  hold it longer.
- **`src: …`** under a row's header names where the row stands in its source, as the atlas records it: the page and
  system of the Common melody's Torah (`tt1 s1`) and haftarah (`ht1 s1`) charts, Spiro's line (`Spiro 3`).
- **`3!{ … }`** is a bracket the transcription numbers 3 although its notes do not make a triplet (they do not
  add up to three of one value): it is kept at the written values, flagged on the review page, and waits for the
  scan to decide.
- The range runs from E3 to C6.

### What the transcription was changed in

The atlas's data was converted to these rows by a one-time script, and the build reads them back exactly but for
these deliberate changes, all listed on the review page:

- a bracket of 3 whose notes add up to three of one value is a triplet (`3{`), its notes at two-thirds of their
  written length (127 brackets; the atlas kept them at full length) — the other 18 are `3!{`;
- a syllable runs to the next syllable, so it covers the rests and notes after it within its mark (the atlas
  left some of them under no syllable), and a JE sign's name spans its sign;
- in the Common Torah melody's rows 9 and 10 the telisha's first note (C4) stood before its first syllable; the
  syllable now starts on it.

The six charts the atlas shares with `docs/tropepatterns.md` are not repeated here: they matched that file note for
note, and it stays their only copy.

## Torah · Common melody (`cons_torah`)

Conservative / Orthodox — The common Eastern-European (Lithuanian) Torah melody, from a Conservative congregation’s printed chart.

```trope-system cons_torah
group: torah
key: C
rows: 31
underlay: syllables
accidentals: B♭
lacks: yetiv zakef_gadol geresh_muqdam pazer
label: Torah · Common melody
short: Common (Lithuanian)
trad: Conservative / Orthodox
sub: The common Eastern-European (Lithuanian) Torah melody, from a Conservative congregation’s printed chart
source: A Conservative congregation’s printed learner’s chart of the common (Lithuanian) Torah melody, pages 1–4 and 6 (page 5 was not available)
license: The melody is traditional. This transcription is CC BY-SA 4.0.
note: The “common melody” of most Conservative and Orthodox synagogues in America (the Lithuanian–Polish Torah tune, as codified by Rosowsky and taught at JTS). Transcribed from a Conservative congregation’s printed learner’s chart; its page 5 (pazer, yetiv, zakef gadol and the first zarka–segol rows) was not available, so those rows are missing.
```

```trope-row cons_torah
#1a מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: tt1 s1
mercha           Mer- E4(e) chaw G4(de)
tipcha           tip- G4(s) chaw A4(de) ~C5(s) ~G4(e) C5(e)
munach           mu- G4(e) nach F4(e) ~D4(e)
etnachta         es- C4(e) nach- C4(e) taw G4(q)
```

```trope-row cons_torah
#1b מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
src: tt1 s2
mercha           Mer- E4(e) chaw G4(de)
tipcha           tip- G4(s) chaw A4(de) ~C5(s) ~G4(e) C5(e)
etnachta         es- C4(e) nach- C4(e) taw G4(q)
```

```trope-row cons_torah
#1c טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: tt1 s3
tipcha           tip- A4(e) chaw A4(de) ~C5(s) ~G4(e) C5(e)
munach           mu- G4(e) nach F4(e) ~D4(e)
etnachta         es- C4(e) nach- C4(e) taw G4(q)
```

```trope-row cons_torah
#2a מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: tt1 s4
mercha           Mer- E4(e) chaw G4(de)
tipcha           tip- G4(s) chaw A4(de) ~C5(s) ~G4(e) C5(e)
mercha           mer- E4(e) chaw G4(e)
sof_pasuk        sof G4(e) paw- G4(e) suk F4(e) ~C4(dq)
```

```trope-row cons_torah
#2b מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: tt1 s5
mercha           Mer- E4(e) chaw G4(de)
tipcha           tip- G4(s) chaw A4(de) ~C5(s) ~G4(e) C5(e)
sof_pasuk        sof G4(e) paw- G4(e) suk F4(e) ~C4(dq)
```

```trope-row cons_torah
#2c טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: tt2 s1
tipcha           tip- A4(e) chaw A4(de) ~C5(s) ~G4(e) C5(e)
mercha           mer- E4(e) chaw G4(e)
sof_pasuk        sof G4(e) paw- G4(e) suk F4(e) ~C4(dq)
```

```trope-row cons_torah
#2d טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: tt2 s2
tipcha           tip- A4(e) chaw A4(de) ~C5(s) ~G4(e) C5(e)
sof_pasuk        sof G4(e) paw- G4(e) suk F4(e) ~C4(dq)
```

```trope-row cons_torah
#3a קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: tt2 s3
kadma            kad- F4(e) maw A4(de)
mahpach          mah- A4(s) pach A4(e) ~C4(s) ~F4(s)
pashta           pash- F4(e) taw ~C5(q) rest(q)
munach           mu- A4(e) nach 3!{A4(s) ~G4(s) ~A4(de)}
zakef_katon      kaw- A4(s) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#3b קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
src: tt2 s4
kadma            kad- F4(e) maw A4(de)
mahpach          mah- A4(s) pach A4(e) ~C4(s) ~F4(s)
pashta           pash- F4(e) taw ~C5(q) rest(q)
zakef_katon      kaw- A4(e) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#3c פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: tt2 s5
pashta           pash- F4(e) taw ~C5(q) rest(q)
munach           mu- A4(e) nach 3!{A4(s) ~G4(s) ~A4(de)}
zakef_katon      kaw- A4(s) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#3d פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
src: tt2 s6
pashta           pash- F4(e) taw ~C5(dq)
zakef_katon      kaw- A4(e) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#3e מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: tt2 s7
munach           mu- C5(e) nach C5(s) ~A4(s) ~C5(s) ~C5(e)
mahpach          mah- A4(e) pach A4(e) ~C4(s) ~F4(s)
pashta           pash- F4(e) taw C5(e) rest(e)
munach           mu- A4(e) nach 3!{A4(s) ~G4(s) ~A4(de)}
zakef_katon      ko- A4(s) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#3f מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
src: tt3 s1
munach           mu- C5(e) nach C5(s) ~A4(s) ~C5(s) ~C5(e)
mahpach          mah- A4(e) pach A4(e) ~C4(s) ~F4(s)
pashta           pash- F4(e) taw C5(dq)
zakef_katon      kaw- A4(e) ton C5(e) ~G4(dq)
```

```trope-row cons_torah
#4a דַּרְגָּ֧א תְּבִ֛יר
src: tt3 s2
darga            dar- A4(e) gaw C5(de) ~B♭4(32) ~A4(32) ~G4(de)
tevir            te- G4(s) vir 3{F4(e) ~E4(s) ~F4(s) ~G4(e)} ~G4(q)
```

```trope-row cons_torah
#4b מֵרְכָ֥א תְּבִ֛יר
src: tt3 s3
mercha           Mer- A4(e) chaw C5(e) ~G4(q)
tevir            te- G4(e) vir 3{F4(e) ~E4(s) ~F4(s) ~G4(e)} ~G4(q)
```

```trope-row cons_torah
#4c מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
src: tt3 s4
munach           mu- C5(e) nach C5(s) ~A4(s) ~C5(s) ~C5(e)
darga            dar- A4(e) gaw C5(de) ~B♭4(32) ~A4(32) ~G4(de)
tevir            te- G4(s) vir 3{F4(e) ~E4(s) ~F4(s) ~G4(e)} ~G4(q)
```

```trope-row cons_torah
#4d מֻנָּ֣ח מֵרְכָ֥א תְּבִ֛יר
src: tt3 s5
munach           mu- C5(e) nach C5(s) ~A4(s) ~C5(s) ~C5(e)
mercha           mer- A4(e) chaw C5(e) ~G4(q)
tevir            te- G4(e) vir 3{F4(e) ~E4(s) ~F4(s) ~G4(e)} ~G4(q)
```

```trope-row cons_torah
#5 גֵּרְשַׁ֞יִם
src: tt3 s6
gershayim        ger- F4(s) sha- F4(s) yim A4(q) ~A4(e) ~A4(32) ~G4(32) ~F4(32) ~G4(32) ~A4(e) rest(e)
```

```trope-row cons_torah
#6a מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
src: tt4 s1
munach_legarmeh  mu- F4(e) nach F4(s) ~G4(s) ~A4(s) ~F4(s) ~G4(e) rest(e)
munach           mu- G4(e) nach C5(e) ~A4(q)
revia            re- A4(e) vi- G4(e) ~F4(s) ~E4(s) a D4(q)
```

```trope-row cons_torah
#6b מֻנָּ֣ח רְבִ֗יעַ
src: tt4 s2
munach           mu- G4(e) nach C5(e) ~A4(q)
revia            re- A4(e) vi- G4(e) ~F4(s) ~E4(s) a D4(q)
```

```trope-row cons_torah
#7 קַדְמָ֨א וְאַזְלָ֜א
src: tt4 s3
kadma            kad- F4(e) maw A4(e)
geresh           v'- A4(s) az- A4(s) law D5(e) ~C5(dq)
```

```trope-row cons_torah
#8a קַדְמָ֨א וְאַזְלָ֜א
src: tt4 s4
kadma            kad- F4(s) maw A4(s)
geresh           ge- 3{C5(e) ~A4(e) ~D5(e)} resh C5(q)
```

```trope-row cons_torah
#8b גֵּ֜רֵשׁ
src: tt4 s5
geresh           ge- 3{C5(e) ~A4(e) ~D5(e)} resh C5(q)
```

```trope-row cons_torah
#9 מֻנָּ֣ח תְּ֠לִישָׁא־גְדוֹלָה
src: tt4 s6
munach           mu- F4(e) nach A4(e) ~G4(e)
telisha_gedola   t'li- C5(e) 3{F4(s) shaw F4(s) g'do- F4(s)} law F4(e) ~G4(s) ~A4(s) ~B♭4(s) 3{~C5(e,-) ~A4(e,-) ~G4(e,-)} ~F4(q,-)
```

```trope-row cons_torah
#10 מֻנָּ֣ח תְּלִישָׁא־קְטַנָּה֩
src: tt4 s7
munach           mu- F4(e) nach A4(e) ~G4(e)
telisha_ketana   t'li- C5(e) 3{F4(s) shaw F4(s) k'ta- F4(s)} naw F4(e) ~E4(s) ~F4(s) ~G4(e) ~F4(q)
```

```trope-row cons_torah
#11c מֻנָּ֣ח זַרְקָא֮ סֶגּוֹל֒
src: tt6 s1
munach           mu- B♭4(e) nach 3{A4(e) ~G4(e)
zarka            zar- G4(e)} rest(e) kaw G4(e) ~G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(e) ~C4(e) rest(e)
segol            se- G4(e) gol A4(e) ~G4(dq)
```

```trope-row cons_torah
#11d זַרְקָא֮ סֶגּוֹל֒
src: tt6 s2
zarka            zar- G4(e) rest(e) kaw G4(e) ~G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(e) ~C4(e) rest(e)
segol            se- G4(e) gol A4(e) ~G4(dq)
```

```trope-row cons_torah
#15a שַׁלְשֶׁ֓לֶת
src: tt6 s3 first version
shalshelet       shal- F4(e) she F4(s) ~A4(s) ~C5(s) ~A4(s) ~F4(s) ~A4(s) ~C5(s) ~A4(s) ~F4(s) ~A4(s) ~C5(s) ~A4(s) ~D5(e) les ~C5(dq)
```

```trope-row cons_torah
#15b שַׁלְשֶׁ֓לֶת
src: tt6 s4 alternate version
shalshelet       shal- F4(e) she F4(32) ~G4(32) 3{~A4(32) ~B♭4(32) ~C5(32)} ~D5(e) ~C5(e) ~F4(32) ~G4(32) 3{~A4(32) ~B♭4(32) ~C5(32)} ~D5(e) ~C5(e) ~F4(32) ~G4(32) ~A4(32) ~B♭4(32) ~C5(32) 3{~D5(e,-) ~C5(e,-) les A4(e,-)} ~G4(q,-)
```

```trope-row cons_torah
#16 דַּרְגָּ֧א מֵרְכָא־כְּפוּלָ֦ה
src: tt6 s5
darga            dar- A4(e) gaw C5(de) ~B♭4(32) ~A4(32) ~G4(e) rest(e)
mercha_kefula    mer- G4(s) chaw G4(s) c'hfu- G4(s) law 3!{G4(s) ~A4(s) ~B♭4(e)} 3{~C5(32) ~B♭4(32) ~A4(32)} ~G4(q)
```

```trope-row cons_torah
#17 יָרֵחַ־בֶּן־יוֹמ֪וֹ קַרְנֵי־פָרָה֟
src: tt6 s6
yerach_ben_yomo  ye- F4(s) rach F4(s) ben F4(s) yo- F4(s) moh A4(e) ~G4(q)
karnei_parah     kar- F4(s) ne F4(s) faw 3{F4(e) raw E4(e) ~F4(e)} ~G4(e) ~F4(de) ~F4(s) ~G4(32) ~A4(32) ~B♭4(32) 3{~C5(e,-) ~A4(e,-) ~G4(e,-)} ~F4(q,-)
```

## Haftarah · Common melody (`cons_haftarah`)

Conservative / Orthodox — The common Eastern-European haftarah melody, from a Conservative congregation’s printed chart.

```trope-system cons_haftarah
group: haftarah
key: F
rows: 36
underlay: syllables
accidentals: B♮
lacks: shalshelet geresh_muqdam karnei_parah yerach_ben_yomo
label: Haftarah · Common melody
short: Common (Lithuanian)
trad: Conservative / Orthodox
sub: The common Eastern-European haftarah melody, from a Conservative congregation’s printed chart
source: A Conservative congregation’s six-page printed learner’s chart of the common haftarah melody
license: The melody is traditional. This transcription is CC BY-SA 4.0.
note: The haftarah tune of most Conservative and Orthodox synagogues, written here with one flat (the mode centres on D, with the characteristic lowered seventh). Transcribed from a Conservative congregation’s six-page learner’s chart; rhythms are the chart’s own.
```

```trope-row cons_haftarah
#1a מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: ht1 s1
mercha           Mer- D4(e) chaw G4(de) ~G4(s)
tipcha           tip- F4(e) chaw D4(e)
munach           mu- C5(e) nach D4(e)
etnachta         es- G4(e) nach- G4(e) taw D4(s) ~F4(s) ~D4(s) ~F4(s) ~A4(q) ~G4(q)
```

```trope-row cons_haftarah
#1b מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
src: ht1 s2
mercha           Mer- D4(e) chaw G4(de) ~G4(s)
tipcha           tip- F4(e) chaw D4(e)
etnachta         es- D4(e) nach- D4(e) taw F4(s) ~D4(s) ~F4(s) ~A4(q) ~G4(q)
```

```trope-row cons_haftarah
#1c טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: ht1 s3
tipcha           tip- D4(e) chaw D4(e)
munach           mu- A4(s) nach G4(s) ~G4(e)
etnachta         es- G4(e) nach- D4(e) taw D4(s) ~F4(s) ~D4(s) ~F4(s) ~A4(q) ~G4(q)
```

```trope-row cons_haftarah
#1d טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: ht1 s4
tipcha           tip- D4(e) chaw D4(e)
munach           mu- A4(s) nach G4(s) ~G4(e)
etnachta         es- D4(e) nach- D4(e) taw F4(s) ~D4(s) ~F4(s) ~A4(q) ~G4(q)
```

```trope-row cons_haftarah
#2a מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: ht1 s5
mercha           Mer- D4(e) chaw F4(de) ~D4(s)
tipcha           tip- G4(e) chaw C5(q)
mercha           mer- C4(e) chaw C4(e)
sof_pasuk        sof D4(e) paw- D4(e) suk F4(e) ~D4(q)
```

```trope-row cons_haftarah
#2b מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: ht1 s6
mercha           Mer- D4(e) chaw F4(de) ~D4(s)
tipcha           tip- G4(e) chaw C5(q)
sof_pasuk        sof C4(e) paw- D4(e) suk F4(e) ~D4(q)
```

```trope-row cons_haftarah
#2c טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: ht2 s1
tipcha           tip- D4(e) chaw C5(q)
mercha           mer- C4(e) chaw C4(e)
sof_pasuk        sof D4(e) paw- D4(e) suk F4(e) ~D4(q)
```

```trope-row cons_haftarah
#2d טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: ht2 s2
tipcha           tip- D4(e) chaw D4(s) ~C5(s) ~A4(s)
sof_pasuk        sof C4(e) paw- D4(e) suk F4(e) ~D4(q)
```

```trope-row cons_haftarah
#3a קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: ht2 s3
kadma            kad- D4(e) maw G4(de) ~G4(s)
mahpach          mah- G4(e) pach D4(s) ~C4(s) ~D4(s)
pashta           pash- D4(e) taw B♮4(e) rest(e)
munach           mu- C5(e) nach F4(s) ~F4(s) ~D4(e)
zakef_katon      kaw- B♮4(e) ton A4(s) ~G4(s) ~F4(dq)
```

```trope-row cons_haftarah
#3b מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: ht2 s4
mahpach          mah- G4(e) pach G4(e) ~D4(s) ~C4(s) ~D4(s)
pashta           pash- D4(e) taw B♮4(e) rest(e)
munach           mu- C5(e) nach F4(s) ~F4(s) ~D4(e)
zakef_katon      ko- B♮4(e) ton A4(s) ~G4(s) ~F4(dq)
```

```trope-row cons_haftarah
#3c פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: ht2 s5
pashta           pash- D4(e) taw B♮4(e) rest(e)
munach           mu- C5(e) nach F4(s) ~F4(s) ~D4(e)
zakef_katon      kaw- B♮4(e) ton A4(s) ~G4(s) ~F4(dq)
```

```trope-row cons_haftarah
#3d פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
src: ht2 s6
pashta           pash- D4(e) taw B♮4(e)
zakef_katon      kaw- A4(e) ton G4(e) ~F4(dq)
```

```trope-row cons_haftarah
#3e מֻנָּ֣ח מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: ht3 s1
munach           mu- G4(e) nach G4(s) ~F4(s) ~G4(s) ~A4(s) ~G4(e)
mahpach          mah- G4(e) pach G4(e) ~D4(s) ~C4(s) ~D4(s)
pashta           pash- D4(e) taw B♮4(e) rest(e)
munach           mu- C5(e) nach F4(s) ~F4(s) ~D4(e)
zakef_katon      kaw- B♮4(e) ton A4(s) ~G4(s) ~F4(dq)
```

```trope-row cons_haftarah
#4a דַּרְגָּ֧א תְּבִ֛יר
src: ht3 s2
darga            dar- G4(e) gaw D5(e) ~D5(s) ~C5(s) ~B♮4(s) ~A4(s) ~G4(de)
tevir            te- G4(e) vir D4(e) ~D4(e) ~C4(s) ~D4(s) ~F4(s) ~E4(s) ~D4(q)
```

```trope-row cons_haftarah
#4b מֵרְכָ֥א תְּבִ֛יר
src: ht3 s3
mercha           Mer- G4(e) chaw D5(q) ~G4(q)
tevir            te- D4(e) vir D4(e) ~C4(s) ~D4(s) ~F4(s) ~E4(s) ~D4(q)
```

```trope-row cons_haftarah
#4c מֻנָּ֣ח דַּרְגָּ֧א תְּבִ֛יר
src: ht3 s4
munach           mu- G4(e) nach G4(s) ~F4(s) ~G4(s) ~A4(s) ~G4(e)
darga            dar- G4(e) gaw D5(e) ~D5(s) ~C5(s) ~B♮4(s) ~A4(s) ~G4(de)
tevir            te- G4(e) vir D4(e) ~D4(e) ~C4(s) ~D4(s) ~F4(s) ~E4(s) ~D4(q)
```

```trope-row cons_haftarah
#5 גֵּרְשַׁ֞יִם
src: ht3 s5
gershayim        ger- D4(e) sha- D4(e) yim G4(s) ~A4(s) ~B♮4(s) ~A4(s) ~G4(s) ~A4(e) ~B♮4(q)
```

```trope-row cons_haftarah
#6a מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
src: ht4 s1
munach_legarmeh  mu- D4(e) nach 5{D4(s) ~E4(s) ~F4(s) ~D4(s) ~G4(s)} rest(e)
munach           mu- G4(s) nach D5(s) 3!{~D5(s) ~G4(s) ~G4(e)}
revia            re- G4(de) vi- F4(s) ~D4(s) a F4(e) ~D4(dq)
```

```trope-row cons_haftarah
#6b מֻנָּ֣ח רְבִ֗יעַ
src: ht4 s2
munach           mu- G4(e) nach D5(e) ~G4(e)
revia            re- G4(de) vi- F4(s) ~D4(s) a F4(e) ~D4(dq)
```

```trope-row cons_haftarah
#7 קַדְמָ֨א וְאַזְלָ֜א
src: ht4 s3
kadma            kad- D4(e) maw G4(de)
geresh           ve- A4(s) az- A4(s) ~B♮4(s) 3{~C5(e) ~A4(e) ~G4(e)} law D5(q) ~G4(dq)
```

```trope-row cons_haftarah
#8a קַדְמָ֨א וְאַזְלָ֜א
src: ht4 s4
kadma            kad- D4(e) maw G4(de)
geresh           ge- G4(s) ~A4(s) ~B♮4(s) ~A4(s) ~C5(s) ~B♮4(s) ~A4(s) ~G4(s) resh A4(e) ~G4(q)
```

```trope-row cons_haftarah
#8b גֵּ֜רֵשׁ
src: ht4 s5
geresh           ge- G4(s) ~A4(s) ~B♮4(s) ~A4(s) ~C5(s) ~B♮4(s) ~A4(s) ~G4(s) resh A4(e) ~G4(q)
```

```trope-row cons_haftarah
#9a מֻנָּ֣ח תְּ֠לִישָׁא־גְדוֹלָה
src: ht4 s6
munach           mu- D4(e) nach G4(e) ~F4(e)
telisha_gedola   t'li- D4(s) shaw D4(s) g'do- D4(s) law 3{E4(e) ~F4(e) ~D5(e)} ~G4(s) 3{~F4(e) ~E4(e) ~D4(e)}
```

```trope-row cons_haftarah
#9b מֻנָּ֣ח תְּלִישָׁא־קְטַנָּה֩
src: ht4 s7
munach           mu- D4(e) nach G4(e) ~F4(e)
telisha_ketana   t'li- D4(s) shaw D4(s) k'ta- D4(s) naw G4(e) ~G4(e) ~F4(s) ~G4(s) ~A4(s) ~F4(s) ~D4(q)
```

```trope-row cons_haftarah
#10 מֻנָּ֣ח פָּזֵ֡ר
src: ht5 s1
munach           mu- D4(e) nach G4(de) ~F4(s)
pazer            paw- D4(e) zer G4(s) ~A4(s) ~B♮4(s) ~C5(s) ~D5(s) ~C5(s) ~A4(s) ~G4(s) ~F4(s) ~G4(s) ~A4(s) ~G4(q)
```

```trope-row cons_haftarah
#11a יְ֚תִיב מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: ht5 s2
yetiv            ye- G5(g) siv D5(q) ~D4(q) rest(e)
munach           mu- D4(e) nach A4(s) ~G4(s)
zakef_katon      kaw- A4(e) ton G4(s) ~F4(s) ~D4(dq)
```

```trope-row cons_haftarah
#11b יְ֚תִיב זָקֵף־קָטֹ֔ן
src: ht5 s3
yetiv            ye- G5(g) siv D5(q) ~D4(q) rest(e)
zakef_katon      kaw- A4(e) ton G4(s) ~F4(s) ~D4(dq)
```

```trope-row cons_haftarah
#12a מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
src: ht5 s4
munach           mu- G4(e) nach 3{B♮4(e) ~A4(e) ~G4(e)}
zarka            zar- C5(e) kaw G4(s) ~F4(s) ~G4(s) ~A4(s) ~B♮4(s) ~C5(s) ~A4(s) ~F4(s) ~A4(de) ~A4(s) ~F4(s) ~F4(e)
munach           mu- E4(e) nach D4(e)
segol            se- C5(e) gol D4(e) ~G4(e) ~G4(e) ~A4(de) ~F4(s) ~A4(e) ~G4(q)
```

```trope-row cons_haftarah
#12b זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
src: ht5 s5
zarka            zar- G4(e) kaw F4(s) ~G4(s) ~A4(s) ~B♮4(s) ~C5(s) ~A4(s) ~F4(s) ~A4(de) ~A4(s) ~F4(s) ~E4(s) ~D4(s)
munach           mu- C5(e) nach D4(e)
segol            se- G4(e) gol G4(e) ~G4(e) ~F4(e) ~A4(e) ~G4(q)
```

```trope-row cons_haftarah
#12c זַרְקָא֮ סֶגּוֹל֒
src: ht5 s6
zarka            zar- G4(e) kaw F4(s) ~G4(s) ~A4(s) ~B♮4(s) ~C5(s) ~A4(s) ~F4(s) ~A4(de) ~A4(s) ~F4(s) ~E4(s) ~D4(s) rest(q)
segol            se- C5(e) gol G4(e) ~G4(e) ~F4(e) ~A4(e) ~G4(q)
```

```trope-row cons_haftarah
#13 זָקֵף־גָּד֕וֹל
src: ht6 s1
zakef_gadol      zaw- 3{D4(e) kef D4(e) gaw- D4(e)} 3{~A4(e) ~F4(e) ~D4(e)} dol G4(e) ~F4(dq)
```

```trope-row cons_haftarah
#14 דַּרְגָּ֧א מֵרְכָא־כְּפוּלָ֦ה
src: ht6 s2
darga            dar- G4(e) gaw D5(e) ~D5(s) ~C5(s) ~B♮4(s) ~A4(s) ~G4(de)
mercha_kefula    mer- G4(e) chaw 3{G4(e) ~G4(e) ~G4(e)} c'hfu- G4(s) ~A4(s) ~B♮4(s) ~C5(s) law B♮4(s) ~A4(s) ~G4(q)
```

```trope-row cons_haftarah
#15a מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: ht6 s3 final cadence
mercha           Mer- F4(e) chaw B♮4(de) ~B♮4(s)
tipcha           tip- B♮4(e) chaw A4(s) ~G4(s) ~C5(s) ~F4(e) rest(e)
mercha           mer- F4(e) chaw F4(e)
sof_pasuk        sof F4(e) paw- 3{F4(e) ~F4(e) ~F4(e)} suk G4(e) ~F4(dq)
```

```trope-row cons_haftarah
#15b טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
src: ht6 s4
tipcha           tip- B♮4(e) chaw B♮4(s) ~A4(s) ~G4(s) ~C5(s) ~F4(e) rest(e)
mercha           mer- F4(e) chaw F4(e)
sof_pasuk        sof F4(e) paw- 3{F4(e) ~F4(e) ~F4(e)} suk G4(e) ~F4(dq)
```

```trope-row cons_haftarah
#15c מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: ht6 s5
mercha           Mer- F4(e) chaw B♮4(de) ~B♮4(s)
tipcha           tip- B♮4(e) chaw A4(s) ~G4(s) ~C5(s) ~F4(e) rest(e)
sof_pasuk        sof F4(e) paw- F4(e) suk G4(e) ~F4(dq)
```

```trope-row cons_haftarah
#15d טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: ht6 s6
tipcha           tip- B♮4(e) chaw B♮4(s) ~A4(s) ~G4(s) ~C5(s) ~F4(e) rest(e)
sof_pasuk        sof F4(e) paw- F4(e) suk G4(e) ~F4(dq)
```

## High Holy Day Torah · Spiro (`spiro_hhd`)

Conservative — Hazzan Pinchas Spiro’s chart (Conservative), 20 lines.

```trope-system spiro_hhd
group: hhd
key: C
rows: 20
underlay: syllables
accidentals: B♭ F♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo munach_legarmeh
label: High Holy Day Torah · Spiro
short: Spiro
trad: Conservative
sub: Hazzan Pinchas Spiro’s chart (Conservative), 20 lines
source: Hazzan Pinchas Spiro, High Holy Day Torah trope chart (20 lines)
license: The melody is traditional. This transcription is CC BY-SA 4.0.
note: Pinchas Spiro’s High Holy Day Torah trope chart, widely used in Conservative congregations. Notes in parentheses are the chart’s optional pickups for unstressed syllables; the chart writes no key signature and spells the mode with B♭ and F♯ as needed.
```

```trope-row spiro_hhd
#1 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
src: Spiro 1
mercha           Mer- D4(e,opt) chah D4(q)
tipcha           Tip- E4(e,opt) chah F4(de) ~G4(s) ~E4(e) rest(e)
munach           Mu- E4(e,opt) nach D4(q)
etnachta         Et- C4(e,opt) nach- F4(s) ~E4(s) tah D4(dq)
```

```trope-row spiro_hhd
#2 מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: Spiro 2
mercha           Mer- D4(e,opt) chah D4(q)
tipcha           Tip- E4(e,opt) chah G4(s) ~F4(s) ~B4(s) ~E4(e) rest(e)
sof_pasuk        Si- D4(e,opt) luk D4(s) ~C4(s) ~B3(s) ~D4(s) ~C4(q,fermata)
```

```trope-row spiro_hhd
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
src: Spiro 3
mahpach          Mah- G4(e,opt) pach 3{G4(e) ~D4(e) ~C4(e)} ~D4(q)
pashta           Pash- D4(e,opt) tah A4(e) ~E5(s) ~G4(e) rest(e)
zakef_katon      Ka- F♯4(e,opt) ton G4(e) ~D5(s) ~D4(e) rest(e)
```

```trope-row spiro_hhd
#4 קַדְמָ֨א מַהְפָּ֤ךְ פַּשְׁטָא֙ מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: Spiro 4
kadma            Kad- D4(e,opt) mah G4(q)
mahpach          Mah- G4(e,opt) pach 3{G4(e) ~D4(e) ~C4(e)} ~D4(q)
pashta           Pash- D4(e,opt) tah A4(e) ~E5(s) ~G4(e) rest(e)
munach           Mu- D4(e,opt) nach F♯4(e) ~D4(e) ~G4(s)
zakef_katon      Ka- F♯4(e,opt) ton G4(e) ~D5(s) ~D4(e) rest(e)
```

```trope-row spiro_hhd
#5 זָקֵף־גָּד֕וֹל
src: Spiro 5
zakef_gadol      Ga- D4(e,opt) dol B4(e) ~A4(e) ~G4(e) ~F4(e) ~E4(e) ~F4(de) ~B4(s) ~D4(de) rest(e)
```

```trope-row spiro_hhd
#6 מֻנָּ֣ח מֻנָּ֣ח רְבִ֗יעַ
src: Spiro 6
munach           Mu- D4(e,opt) nach 3{D4(e) ~D4(e) ~D4(e)} ~D4(dq) rest(e)
munach           Mu- D4(e,opt) nach A4(e) ~G4(de)
revia            R'vi- G4(e,opt) ee 3{G4(e) ~F4(e) ~D5(e)} ~E4(e) ~D4(e) ~E4(s) ~D4(s) ~C4(dq)
```

```trope-row spiro_hhd
#7 תְּבִ֛יר
src: Spiro 7
tevir            T'- E4(e,opt) vir E4(q) ~E4(s) ~D4(s) ~C4(s) ~D4(de) rest(e)
```

```trope-row spiro_hhd
#8 דַּרְגָּ֧א תְּבִ֛יר
src: Spiro 8
darga            Dar- G4(e,opt) gah G4(s) ~A4(s) ~G4(e) ~D4(q)
tevir            T'- C4(e,opt) vir C4(e) ~D4(s) ~F4(s) ~E4(e) ~D4(de) rest(e)
```

```trope-row spiro_hhd
#9 מֵרְכָ֥א תְּבִ֛יר
src: Spiro 9
mercha           Mer- G4(e,opt) chah G4(s) ~D5(s) ~D4(e) rest(e)
tevir            T'- C4(e,opt) vir C4(e) ~D4(s) ~F4(s) ~E4(e) ~D4(de) rest(e)
```

```trope-row spiro_hhd
#10 קַדְמָ֨א וְאַזְלָ֜א
src: Spiro 10
kadma            Kad- D4(e,opt) mah G4(q)
geresh           Az- F♯4(e,opt) lah A4(e) ~D5(s) ~G4(e) rest(e)
```

```trope-row spiro_hhd
#11 גֵּ֜רֵשׁ
src: Spiro 11
geresh           Ge- D4(e,opt) resh B4(e) ~B♭4(s) ~A4(s) ~G4(s) ~A4(s) ~G4(de) rest(e)
```

```trope-row spiro_hhd
#12 קַדְמָ֨א וְאַזְלָ֜א
src: Spiro 12
kadma            Kad- D4(e,opt) mah G4(q)
geresh           Ge- D4(e,opt) resh B4(e) ~B♭4(s) ~A4(s) ~G4(s) ~A4(s) ~G4(de) rest(e)
```

```trope-row spiro_hhd
#13 גֵּרְשַׁ֞יִם
src: Spiro 13
gershayim        Ger- D4(e,opt) sha- G4(s) ~F♯4(s) yim G4(e) ~A4(s) ~G4(e) rest(e)
```

```trope-row spiro_hhd
#14 תְּלִישָׁא־קְטַנָּה֩
src: Spiro 14
telisha_ketana   K'ta- D4(e,opt) nah G4(e) ~F♯4(s) ~G4(s) ~B4(s) ~D4(e) rest(e)
```

```trope-row spiro_hhd
#15 תְּ֠לִישָׁא־גְדוֹלָה
src: Spiro 15
telisha_gedola   G'do- D4(e,opt) lah D4(e) ~D4(e) ~G4(s) ~E4(s) ~F4(s) ~D4(e) ~C4(q) rest(e)
```

```trope-row spiro_hhd
#16 פָּזֵ֡ר
src: Spiro 16
pazer            Pa- D4(e,opt) zer G4(e) ~A4(s) ~B♭4(s) ~C5(s) ~D5(s) ~C5(s) ~B♭4(s) ~A4(s) ~G4(s) ~F♯4(s) ~A4(e) ~G4(e) rest(e)
```

```trope-row spiro_hhd
#17 מֻנָּ֣ח זַרְקָא֮ מֻנָּ֣ח סֶגּוֹל֒
src: Spiro 17
munach           Mu- D4(e,opt) nach D4(q)
zarka            Zar- D4(e,opt) kah D4(s) ~D4(s) ~B3(s) ~B3(s) ~C4(s) ~B3(s) ~A3(s) ~A4(s)
munach           Mu- D4(e,opt) nach G4(q)
segol            Se- G4(e,opt) gol 5{G4(s) ~F4(s) ~E4(s) ~D4(s) ~E4(s)} ~F4(s) ~E4(s) ~D4(dq)
```

```trope-row spiro_hhd
#18 יְ֚תִיב מֻנָּ֣ח זָקֵף־קָטֹ֔ן
src: Spiro 18
yetiv            Y'- B♭4(s) ~A4(s) tiv B4(s) ~D5(s) ~G4(e) rest(e)
munach           Mu- D4(e,opt) nach F♯4(e) ~D4(e) ~G4(s)
zakef_katon      Ka- F♯4(e,opt) ton G4(e) ~D5(s) ~D4(e) rest(e)
```

```trope-row spiro_hhd
#19 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א אֶתְנַחְתָּ֑א
src: Spiro 19 (end of aliyah)
mercha           Mer- D4(e,opt) chah D4(q)
tipcha           Tip- E4(e,opt) chah F4(de) ~G4(s) ~B4(s) ~E4(e) rest(e)
etnachta         Et- C4(e,opt) nach- F4(e) ~E4(e) tah D4(dq)
```

```trope-row spiro_hhd
#20 [aliyah-end] מֵרְכָ֥א טִפְּחָ֖א סוֹף־פָּסֽוּק׃
src: Spiro 20 (end of aliyah)
mercha           Mer- D4(e,opt) chah D4(q)
tipcha           Tip- E4(e,opt) chah A4(e) ~G4(e) ~F4(e) ~E4(e) ~D4(e) ~D4(dq) rest(e)
sof_pasuk        Sof D4(e) Ha- E4(e) Che- E4(e) ~D4(e) ~C4(e) ~C4(e) lek D4(e) ~D4(dq,fermata)
```

## Torah · Western Ashkenazi (`je_torah_western`)

British – Western Europe — Jewish Encyclopedia 1901, “Ashkenazim, 1902”.

```trope-system je_torah_western
group: torah
key: G
rows: 16
underlay: names
accidentals: F♮
lacks: geresh_muqdam
label: Torah · Western Ashkenazi
short: Western Ashkenazi (1902)
trad: British – Western Europe
sub: Jewish Encyclopedia 1901, “Ashkenazim, 1902”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Ashkenazim, 1902”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Torah tune of the German and English (“Western”) Ashkenazi synagogues as sung in London around 1900; this is the line Trope Trainer calls British – Western Europe. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_western
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            G4(q) 3{A4(e) B4(e) C5(e)} 3{D5(e) B4(e) G4(e)} A4(e) 3{G4(32) F♯4(32) E4(32)} E4(s)
segol            B4(q) rest(q)
```

```trope-row je_torah_western
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           G4(dq) F♯4(s) G4(s) A4(e) F♯4(e)
revia            A4(q) C5(q) ~B4(h) G4(q) A4(dq) G4(32) F♯4(32) E4(s) E4(q) E4(e)
```

```trope-row je_torah_western
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          E4(e) ~G4(e) G4(e) B4(e)
pashta           G4(e) D5(s) F♯4(s) B4(q) ~A4(h) B4(q)
zakef_katon      B4(e) ~G4(e) G4(e) A4(s) B4(s) G4(e)
```

```trope-row je_torah_western
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            G4(e) G4(e) D5(dq) B4(e) rest(e) A4(e)
zakef_katon      B4(e) ~G4(e) G4(e) A4(s) B4(s) G4(e)
```

```trope-row je_torah_western
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      G4(e) G4(e) G4(e) B4(e) ~G4(e) ~D4(dq) D4(e)
```

```trope-row je_torah_western
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(e) A4(e)
tipcha           G4(s) B4(e) ~E4(e) E4(e)
munach           B4(e) ~A4(e)
etnachta         E4(s) E4(s) G4(e) ~D4(e,fermata)
```

```trope-row je_torah_western
#7 פָּזֵ֡ר
pazer            B4(e) ~B4(h) D4(q) G4(e) ~G4(s) A4(s) B4(s) C5(s) B4(s) C5(s) B4(s) A4(s) B4(s) A4(s) D5(s) B4(s) A4(h) ~A4(q) rest(q)
```

```trope-row je_torah_western
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(de) A4(s) 3{B4(e) A4(e) G4(e)} A4(e) G4(e) G4(q)
```

```trope-row je_torah_western
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) A4(s) G4(s) F♯4(s) G4(s) ~D4(h)
```

```trope-row je_torah_western
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            G4(dq) G4(e) B4(q)
geresh           C5(dh) G4(e) B4(e) C5(h) B4(q)
```

```trope-row je_torah_western
#11 גֵּרְשַׁ֞יִם
gershayim        G4(q) B4(q) ~B4(s) A4(s) G4(s) A4(s) B4(e) B4(e)
```

```trope-row je_torah_western
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) 3{D5(s) C5(s) B4(s)} 3{A4(s) G4(s) A4(s)} B4(e) A4(e) ~A4(e)
tevir            E4(e) 3{E4(s) D4(s) E4(s)} G4(dh)
```

```trope-row je_torah_western
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           D4(de) D4(s)
tipcha           A4(q) G4(e) A4(e) G4(e) ~E4(e)
mercha           E4(de) E4(s)
sof_pasuk        B4(e) ~A4(e) E4(e) G4(q,fermata)
```

```trope-row je_torah_western
#14 שַׁלְשֶׁ֓לֶת
shalshelet       G4(de) F♯4(s) E4(s) F♯4(s) G4(s) F♯4(s) E4(s) F♯4(s) G4(s) F♯4(s) F♯4(s) G4(s) A4(s) B4(s) C5(s) D5(s) 3{C5(s) B4(s) A4(s)} G4(s) A4(q) G4(q)
```

```trope-row je_torah_western
#15 מֵרְכָא־כְּפוּלָ֦ה
mercha_kefula    C5(de) B4(s) A4(de) B4(s) C5(de) D5(s) E5(e) D5(e) C5(e) B4(e) A4(e)
```

```trope-row je_torah_western
#16 קַרְנֵי־פָרָה֟ יָרֵחַ־בֶּן־יוֹמ֪וֹ
karnei_parah     G4(q) 3{G4(s) A4(s) G4(s)} F♮4(s) G4(s) A4(de) D4(s) C5(de) A4(s)
yerach_ben_yomo  G4(s) A4(s) G4(s) F♮4(s) G4(s) A4(e) D4(s) A4(s) 3{B4(s) A4(s) G4(s)} A4(e) ~G4(h)
```

## Torah · Ashkenazi 1518 (Reuchlin) (`je_torah_reuchlin`)

Historical — Jewish Encyclopedia 1901, after Reuchlin, De accentibus (1518).

```trope-system je_torah_reuchlin
group: torah
key: G
rows: 15
underlay: names
accidentals: F♮
lacks: shalshelet geresh_muqdam
label: Torah · Ashkenazi 1518 (Reuchlin)
short: Ashkenazi 1518
trad: Historical
sub: Jewish Encyclopedia 1901, after Reuchlin, De accentibus (1518)
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: after Reuchlin, De accentibus (1518)
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The oldest printed notation of the Ashkenazi Torah chant, from Johannes Reuchlin’s De accentibus et orthographia linguae hebraicae (1518), as re-set in the Encyclopedia table. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_reuchlin
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            G4(q) 3{F♯4(e) G4(e) A4(e)} B4(e) G4(e) 3{A4(e) G4(e) E4(e)} G4(e)
segol            G4(dh)
```

```trope-row je_torah_reuchlin
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           B4(q) ~A4(h) G4(q)
revia            B4(q) ~A4(h) A4(q) G4(e) F♯4(e) G4(e) E4(e) D4(q) D4(e)
```

```trope-row je_torah_reuchlin
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          E4(e) ~G4(e) G4(e)
pashta           G4(e) B4(h) ~G4(q)
zakef_katon      A4(e) B4(e) G4(e)
```

```trope-row je_torah_reuchlin
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            D4(e) G4(e) ~G4(e) rest(e) A4(e)
zakef_katon      A4(e) B4(e) G4(e)
```

```trope-row je_torah_reuchlin
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      G4(e) G4(e) G4(e) B4(e) ~D4(e) ~G4(h) E4(dq) E4(s)
```

```trope-row je_torah_reuchlin
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(e) G4(e)
tipcha           G4(e) ~E4(e) E4(e)
munach           E4(q)
etnachta         E4(s) G4(s) A4(e) ~G4(e,fermata)
```

```trope-row je_torah_reuchlin
#7 פָּזֵ֡ר
pazer            B4(q) ~B4(h) D4(q) G4(e) B4(e) D5(e) E5(e) D5(e) B4(e) B4(e) C5(e) A4(e) ~A4(h) rest(e)
```

```trope-row je_torah_reuchlin
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(e) D4(e) ~G4(e) 3{B4(e) A4(e) G4(e)} A4(e) G4(e) ~G4(e)
```

```trope-row je_torah_reuchlin
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) G4(e) A4(e) B4(e) G4(e) ~G4(q) G4(q)
```

```trope-row je_torah_reuchlin
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            A4(dq) G4(e) A4(q)
geresh           A4(dh) rest(q) C5(h) B4(q)
```

```trope-row je_torah_reuchlin
#11 גֵּרְשַׁ֞יִם
gershayim        G4(e) ~A4(e) C5(h) B4(q)
```

```trope-row je_torah_reuchlin
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            B4(de) B4(s) 3{B4(e) A4(e) G4(e)} A4(e) G4(e) ~G4(e)
tevir            E4(e) 3{E4(s) D4(s) E4(s)} G4(dh)
```

```trope-row je_torah_reuchlin
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) E4(s)
tipcha           A4(q) G4(e) G4(e) ~E4(e)
mercha           E4(de) E4(s)
sof_pasuk        G4(q) A4(e) G4(q,fermata)
```

```trope-row je_torah_reuchlin
#14 מֵרְכָא־כְּפוּלָ֦ה
mercha_kefula    B4(e) A4(e) G4(e) A4(q) G4(e)
```

```trope-row je_torah_reuchlin
#15 קַרְנֵי־פָרָה֟ יָרֵחַ־בֶּן־יוֹמ֪וֹ
karnei_parah     E4(q) E4(h) F♮4(q) E4(e) E4(e)
yerach_ben_yomo  E4(e) G4(e) A4(e) B4(e) A4(e) G4(e) A4(s) G4(s) E4(dh)
```

## Torah · Spanish & Portuguese (`je_torah_sp`)

Sephardi (Europe) — Jewish Encyclopedia 1901, “Sephardim (Europe)”.

```trope-system je_torah_sp
group: torah
key: C
rows: 15
underlay: names
accidentals: B♭ F♯ G♯
lacks: geresh_muqdam karnei_parah yerach_ben_yomo
label: Torah · Spanish & Portuguese
short: Spanish & Portuguese
trad: Sephardi (Europe)
sub: Jewish Encyclopedia 1901, “Sephardim (Europe)”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Sephardim (Europe)”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Western Sephardi (London–Amsterdam Spanish & Portuguese) Torah reading, the rite of Moses Gaster’s Bevis Marks congregation. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_sp
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            A4(dq) G4(e) 3{A4(e) B4(e) C5(e)} C5(h) C5(q)
segol            C5(q) ~A4(h)
```

```trope-row je_torah_sp
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  A4(q)
munach           A4(h) E5(e) A4(e) rest(e) A4(q)
revia            F4(e) G4(e) A4(h) A4(q) G4(q) C5(e) ~A4(q) A4(e) A4(e)
```

```trope-row je_torah_sp
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          D5(e) ~C5(e) C5(e) A4(e)
pashta           D5(e) C5(e) A4(e) G♯4(e) ~G♯4(q) D5(q)
zakef_katon      G♯4(e) ~F♯4(e) G4(e) A4(q)
```

```trope-row je_torah_sp
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) A4(e) G♯4(e) ~G4(dq) rest(e) G4(e)
zakef_katon      G♯4(e) ~F♯4(e) G4(e) A4(q)
```

```trope-row je_torah_sp
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      D5(e) D5(e) D5(e) D5(e) C5(e) A4(h) ~A4(dq) A4(s)
```

```trope-row je_torah_sp
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(e) A4(e)
tipcha           A4(e) G♯4(e) G4(e)
munach           G♯4(q)
etnachta         G4(e) G4(e) A4(h,fermata)
```

```trope-row je_torah_sp
#7 פָּזֵ֡ר
pazer            A4(h) ~A4(e) E5(e,fermata) rest(q) A4(e) A4(q) B4(e) C5(e) D5(e) E5(s) D5(s) C5(s) B4(s) A4(h) rest(q)
```

```trope-row je_torah_sp
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   A4(q) A4(de) G4(s) A4(s) G4(s) F4(h)
```

```trope-row je_torah_sp
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   A4(q) A4(de) G4(32) A4(32) G4(s) ~G4(h)
```

```trope-row je_torah_sp
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            D5(q) D5(q) B4(q) E5(de) E5(s) D5(q)
geresh           C5(q) ~C5(h) rest(q) C5(de) G4(32) D5(32) C5(s) B4(s) A4(e) A4(q)
```

```trope-row je_torah_sp
#11 גֵּרְשַׁ֞יִם
gershayim        A4(e) ~B4(e) C5(de) G4(32) D5(32) C5(s) B4(s) A4(q) A4(q)
```

```trope-row je_torah_sp
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            A4(de) A4(s) A4(dq) B4(32) C5(32) 3{E5(e) C5(e) B4(e)} C5(e) ~A4(e)
tevir            A4(de) G4(s) A4(s) G4(s) F4(s) G4(s) G4(e)
```

```trope-row je_torah_sp
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           B4(de) A4(s)
tipcha           A4(q) A4(e) A4(e) G♯4(s) ~G4(s)
mercha           G4(de) G4(s)
sof_pasuk        G4(q) G4(s) A4(s) A4(q,fermata)
```

```trope-row je_torah_sp
#14 שַׁלְשֶׁ֓לֶת
shalshelet       F4(de) G4(s) A4(q) G5(e) ~G4(e) 3{A4(e) B4(e) C5(e)} D5(q) E5(s) D5(s) C5(s) D5(s) A5(q)
```

```trope-row je_torah_sp
#15 מֵרְכָא־כְּפוּלָ֦ה
mercha_kefula    B♭4(q) A4(e) G4(e) F4(e) E4(e) F4(e) G4(e) A4(h)
```

## Torah · Moroccan (`je_torah_morocco`)

Sephardi (North Africa) — Jewish Encyclopedia 1901, “Morocco”.

```trope-system je_torah_morocco
group: torah
key: C
rows: 14
underlay: names
accidentals: B♭ F♯
lacks: geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Torah · Moroccan
short: Moroccan (1901)
trad: Sephardi (North Africa)
sub: Jewish Encyclopedia 1901, “Morocco”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Morocco”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Moroccan Torah cantillation as noted around 1900. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_morocco
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            G4(q) A4(e) C5(e) C5(h) B4(q)
segol            C5(q) ~A4(h)
```

```trope-row je_torah_morocco
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  A4(q)
munach           A4(h) ~E5(e) A4(e) rest(e) A4(q)
revia            F4(e) G4(e) A4(h) G4(q) 3{C5(s) D5(s) C5(s)} B4(32) C5(32) A4(q) A4(e) A4(e)
```

```trope-row je_torah_morocco
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          3{B4(s) C5(s) B4(s)} A4(e) C5(e)
pashta           E5(e) D5(e) 3{C5(s) D5(s) B4(s)} A4(s) B4(s) G4(e) ~D5(q)
zakef_katon      G4(e) C4(e) A4(e)
```

```trope-row je_torah_morocco
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) A4(dq) ~E5(e) rest(e) F4(e)
zakef_katon      G4(e) C4(e) A4(e)
```

```trope-row je_torah_morocco
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      D5(e) D5(q) E5(q) D5(s) C5(s) B4(s) C5(s) ~C5(h) F4(dq) G4(s)
```

```trope-row je_torah_morocco
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(s) 3{B♭4(s) A4(s) G4(s)} F4(e)
tipcha           G4(e) G4(e)
munach           G4(q)
etnachta         G4(e) G4(s) D5(s) A4(e) ~A4(dq,fermata)
```

```trope-row je_torah_morocco
#7 פָּזֵ֡ר
pazer            D5(s) C5(s) B4(s) C5(s) C5(q,fermata) G4(q) G4(q) A4(q) A4(h) ~A4(h) rest(q)
```

```trope-row je_torah_morocco
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   D5(q) C5(e) G4(e) ~A4(e) G4(e) ~G4(e)
```

```trope-row je_torah_morocco
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   D5(q) C5(e) G4(e) A4(e) G4(e) ~G4(q) F4(q)
```

```trope-row je_torah_morocco
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            F4(e) ~G4(dq) G4(e) G4(q)
geresh           G4(q) ~A4(h) rest(q) D5(s) C5(s) B4(s) C5(s) B4(s) C5(s) A4(q) A4(q)
```

```trope-row je_torah_morocco
#11 גֵּרְשַׁ֞יִם
gershayim        G4(e) ~E5(e) D5(s) C5(s) B4(s) C5(s) A4(q) A4(q)
```

```trope-row je_torah_morocco
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) 3!{A4(s) B4(s) C5(e)} C5(h) B4(q)
tevir            A4(e) 3{G4(s) F4(s) G4(s)} G4(h)
```

```trope-row je_torah_morocco
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           F4(de) G4(s)
tipcha           A4(e) 3!{B♭4(s) A4(s)} G4(e) F4(e)
mercha           F4(q) G4(e)
sof_pasuk        G4(de) G4(s) G4(q) G4(e) A4(s) A4(q,fermata)
```

```trope-row je_torah_morocco
#14 שַׁלְשֶׁ֓לֶת
shalshelet       F♯4(q) G4(de) F♯4(s) F♯4(s) G4(s) F♯4(s) G4(s) F♯4(s) E4(s) F♯4(s) C5(q)
```

## Torah · Syrian (Egypt & Syria) (`je_torah_syria`)

Sephardi (Levant) — Jewish Encyclopedia 1901, “Egypt and Syria”.

```trope-system je_torah_syria
group: torah
key: G
rows: 14
underlay: names
accidentals: D♯
lacks: geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Torah · Syrian (Egypt & Syria)
short: Syrian (1901)
trad: Sephardi (Levant)
sub: Jewish Encyclopedia 1901, “Egypt and Syria”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Egypt and Syria”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Levantine reading of Egypt and Syria, the family to which the Aleppo (Halab) tradition belongs. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_syria
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            D4(q) A4(dq) B4(e) A4(s) G4(s) G4(h) G4(q)
segol            E4(h) ~G4(q)
```

```trope-row je_torah_syria
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           G4(dh) G4(q)
revia            G4(dq) F♯4(s) G4(s) A4(e) F♯4(e) D4(q) 3{G4(e) F♯4(e) G4(e)} A4(e) G4(e) E4(s) E4(s) E4(e)
```

```trope-row je_torah_syria
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          G4(s) ~A4(s) B4(s) C5(s) D5(s) E5(e) C5(s) C5(s) G4(e) ~G4(dh) G4(q)
pashta           G4(q) G4(dh) B4(q)
zakef_katon      A4(e) F♯4(e) F♯4(e)
```

```trope-row je_torah_syria
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) G4(dq) ~F♯4(e) rest(q) G4(e)
zakef_katon      A4(e) F♯4(e) F♯4(e)
```

```trope-row je_torah_syria
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) B4(dq) B4(e) A4(s) B4(s) C5(s) D5(s) E5(s) D5(s) C5(s) B4(s) A4(dq) G4(e) G4(e) G4(dh)
```

```trope-row je_torah_syria
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(de) F♯4(s)
tipcha           F♯4(e) F♯4(e) E4(e) E4(e)
munach           E4(q)
etnachta         E4(e) E4(e) F♯4(q,fermata)
```

```trope-row je_torah_syria
#7 פָּזֵ֡ר
pazer            G4(dh) E4(q) G4(dh) F♯4(e) G4(s) G4(s) ~G4(h) rest(q)
```

```trope-row je_torah_syria
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   D4(q) G4(e) A4(s) B4(s) A4(s) G4(s) A4(s) G4(s) F♯4(s) E4(e)
```

```trope-row je_torah_syria
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   B3(q) E4(s) 3{C5(s) G4(s) F♯4(s)} F♯4(de) E4(s) D4(e) G4(q)
```

```trope-row je_torah_syria
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            G4(q) ~E4(e) E4(e) D4(q)
geresh           A4(dh) D4(q) ~D4(e) G4(s) A4(s) F♯4(de) E4(s) D4(q)
```

```trope-row je_torah_syria
#11 גֵּרְשַׁ֞יִם
gershayim        D4(q) A4(s) A4(s) A4(s) G4(s) A4(s) F♯4(de) E4(s) D4(q) ~D4(h) rest(q)
```

```trope-row je_torah_syria
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) A4(s) G4(s) A4(de) B4(s) A4(s) B4(de) 3{A4(s) B4(s) A4(s)} G4(de) F♯4(s) G4(de)
tevir            F♯4(s) E4(e) D♯4(s) E4(s) F♯4(h)
```

```trope-row je_torah_syria
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           F♯4(de) F♯4(s)
tipcha           F♯4(q) F♯4(e) F♯4(e) E4(e)
mercha           E4(de) E4(s)
sof_pasuk        E4(q) E4(e) F♯4(q,fermata)
```

```trope-row je_torah_syria
#14 שַׁלְשֶׁ֓לֶת
shalshelet       D4(q) E4(e) F♯4(e) G4(e) A4(e) B4(q)
```

## Torah · Baghdadi (`je_torah_baghdad`)

Mizrahi (Iraq) — Jewish Encyclopedia 1901, “Bagdad”.

```trope-system je_torah_baghdad
group: torah
key: G
rows: 16
underlay: names
accidentals: B♭ D♯
lacks: geresh_muqdam
label: Torah · Baghdadi
short: Baghdadi (1901)
trad: Mizrahi (Iraq)
sub: Jewish Encyclopedia 1901, “Bagdad”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Bagdad”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Iraqi (Baghdadi) Torah reading. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_torah_baghdad
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            G4(q) 3{E4(e) F♯4(e) G4(e)} A4(e) G4(e) F♯4(q) E4(s) F♯4(s)
segol            G4(dh)
```

```trope-row je_torah_baghdad
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           G4(h) ~D5(e) F♯4(e) rest(e) G4(q)
revia            G4(h) ~G4(e) D5(e) rest(e) G4(q) B4(dq) A4(e) 3{B4(e) A4(e) G4(e)} G4(e)
```

```trope-row je_torah_baghdad
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          D5(e) B4(e) G4(q)
pashta           C5(e) B4(e) A4(e) A4(e) G4(e) G4(e) G4(q)
zakef_katon      C5(e) B4(e) A4(e) G4(e)
```

```trope-row je_torah_baghdad
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            G4(e) D5(e) ~D4(e) rest(e) rest(q) G4(e)
zakef_katon      C5(e) B4(e) A4(e) G4(e)
```

```trope-row je_torah_baghdad
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      G4(q) rest(q) rest(e) G4(e) G4(e) C5(e) B4(e) ~B♭4(e) A4(h) ~A4(dq) G4(e)
```

```trope-row je_torah_baghdad
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           E4(e) ~D♯4(e)
tipcha           E4(e) F♯4(q) F♯4(e)
munach           F♯4(q)
etnachta         G4(e) G4(e) D4(q,fermata)
```

```trope-row je_torah_baghdad
#7 פָּזֵ֡ר
pazer            G4(dh) B4(s) G4(s) G4(de) F♯4(s) ~F♯4(s) B4(de) F♯4(s) B4(e) B4(de) F♯4(s) ~F♯4(h) rest(q)
```

```trope-row je_torah_baghdad
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   A4(e) ~B4(e) B4(dh)
```

```trope-row je_torah_baghdad
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) G4(s) A4(s) 3!{G4(s) F♯4(s) E4(h)}
```

```trope-row je_torah_baghdad
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            C5(q) C5(dq) B4(e) ~B4(h)
geresh           B4(e) B♭4(s) A4(s) G4(q) rest(h) B4(e) B♭4(e) 3{A4(e) G4(e) G4(e)} rest(q)
```

```trope-row je_torah_baghdad
#11 גֵּרְשַׁ֞יִם
gershayim        D5(e) ~B4(e) B4(de) A4(s) G4(q) rest(q)
```

```trope-row je_torah_baghdad
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) G4(dh) G4(q)
tevir            A4(e) ~E4(e) G4(h)
```

```trope-row je_torah_baghdad
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           G4(de) F♯4(s)
tipcha           E4(e) ~D♯4(e) E4(e) F♯4(e)
mercha           F♯4(de) F♯4(s)
sof_pasuk        F♯4(q) G4(e) D4(q,fermata)
```

```trope-row je_torah_baghdad
#14 שַׁלְשֶׁ֓לֶת
shalshelet       G4(q) G4(de) A4(s) B4(e) C5(e) D5(q)
```

```trope-row je_torah_baghdad
#15 מֵרְכָא־כְּפוּלָ֦ה
mercha_kefula    B4(s) A4(s) B4(e) E4(q) A4(s) F♯4(s) G4(e) ~E4(e)
```

```trope-row je_torah_baghdad
#16 קַרְנֵי־פָרָה֟ יָרֵחַ־בֶּן־יוֹמ֪וֹ
karnei_parah     A4(e) F♯4(e) E4(dq) A4(s) A4(s) C5(e) A4(e) A4(e)
yerach_ben_yomo  G4(q) A4(s) G4(s) F♯4(s) E4(s) E4(e) ~D4(e)
```

## High Holy Day Torah · Western Ashkenazi (`je_hhd_western`)

British – Western Europe — Jewish Encyclopedia 1901, “Pentateuch on Penitential Days”.

```trope-system je_hhd_western
group: hhd
key: G
rows: 13
underlay: names
accidentals: C♯ F♮
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: High Holy Day Torah · Western Ashkenazi
short: Western Ashkenazi (1902)
trad: British – Western Europe
sub: Jewish Encyclopedia 1901, “Pentateuch on Penitential Days”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Pentateuch on Penitential Days”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Western Ashkenazi Torah tune for Rosh Hashanah and Yom Kippur. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_hhd_western
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            F♯4(e) G4(e) A4(q) B4(32) A4(32) G4(32) F♯4(32) E4(q) E4(q)
segol            B4(q) ~A4(h)
```

```trope-row je_hhd_western
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  A4(q)
munach           F♯4(q) ~A4(q) A4(q)
revia            F♮5(q) ~D5(q) D5(q) D5(dq) 3{C5(s) B4(s) A4(s)} G4(q) G4(e)
```

```trope-row je_hhd_western
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          F♯4(e) ~A4(e) A4(e)
pashta           A4(e) F♮5(q) ~D5(h) A4(q)
zakef_katon      D5(q) C♯5(e) D5(e) ~G4(e)
```

```trope-row je_hhd_western
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) E5(q) ~D5(q) rest(q) A4(e)
zakef_katon      D5(q) C♯5(e) D5(e) ~G4(e)
```

```trope-row je_hhd_western
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      A4(e) A4(e) A4(e) D5(e) ~F♯4(e) ~A4(h) D4(dq) D4(s)
```

```trope-row je_hhd_western
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(e) A4(e)
tipcha           B4(q) B4(e)
munach           B4(e) ~G4(e)
etnachta         G4(s) G4(s) B4(e) ~A4(e,fermata)
```

```trope-row je_hhd_western
#7 פָּזֵ֡ר
pazer            A4(q) F♯4(de) D4(s) B4(s) A4(s) B4(s) C♯5(s) D5(s) 3{E5(s) F♯5(s) D5(s)} F♯5(q) ~D5(q) ~D5(h) rest(q)
```

```trope-row je_hhd_western
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   A4(de) B4(s) C5(e) 3{B4(e) A4(e) B4(e)} A4(e) ~A4(e)
```

```trope-row je_hhd_western
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   A4(de) B4(s) 3{C5(e) B4(e) A4(e)} G4(h)
```

```trope-row je_hhd_western
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            A4(q) C5(dq) B4(e) D5(e) ~B4(e) F♯5(e) ~D5(q)
geresh           A4(e) ~D5(e) G5(h) ~G5(q) D5(q)
```

```trope-row je_hhd_western
#11 גֵּרְשַׁ֞יִם
gershayim        A4(q) D5(q) ~D5(s) C5(s) B4(s) C5(s) D5(e) D5(e)
```

```trope-row je_hhd_western
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            A4(de) A4(s) 3{D5(s) C5(s) B4(s)} 3{A4(s) G4(s) A4(s)} B4(e) A4(e) ~A4(e)
tevir            A4(e) 3{G4(s) F♯4(s) G4(s)} A4(dh)
```

```trope-row je_hhd_western
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) D4(s)
tipcha           A4(q) A4(e) A4(e) 3!{C5(e) B4(e)}
mercha           A4(de) A4(s)
sof_pasuk        B4(e) ~G4(e) G4(e) B4(e) A4(q,fermata)
```

## Haftarah · Western Ashkenazi (`je_haf_western`)

British – Western Europe — Jewish Encyclopedia 1901, “Prophets, Ashkenazim”.

```trope-system je_haf_western
group: haftarah
key: G
rows: 13
underlay: names
accidentals: —
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Haftarah · Western Ashkenazi
short: Western Ashkenazi (1902)
trad: British – Western Europe
sub: Jewish Encyclopedia 1901, “Prophets, Ashkenazim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Prophets, Ashkenazim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Western Ashkenazi haftarah melody. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_haf_western
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            F♯4(e) G4(e) A4(q) B4(32) A4(32) G4(32) F♯4(32) E4(q) E4(q)
segol            B4(q) ~A4(h)
```

```trope-row je_haf_western
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  E4(q)
munach           3{G4(e) A4(e) G4(e)} F♯4(h) E4(q)
revia            G4(q) ~F♯4(h) E4(q) A4(dq) G4(32) F♯4(32) E4(s) E4(q) E4(e)
```

```trope-row je_haf_western
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          E4(e) ~A4(e) A4(e)
pashta           A4(e) D5(q) ~C5(h) A4(q)
zakef_katon      A4(e) G4(e) F♯4(e) G4(e)
```

```trope-row je_haf_western
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) D5(q) ~C5(q) rest(q) E4(e)
zakef_katon      A4(e) G4(e) F♯4(e) G4(e)
```

```trope-row je_haf_western
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      G4(e) G4(e) G4(e) B4(e) ~D4(e) ~G4(h) E4(dq) E4(s)
```

```trope-row je_haf_western
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(e) A4(e)
tipcha           C5(e) ~B4(e) A4(e)
munach           B4(q)
etnachta         B4(s) A4(s) A4(e) ~E4(e,fermata)
```

```trope-row je_haf_western
#7 פָּזֵ֡ר
pazer            B4(e) ~B4(h) D4(q) G4(e) ~G4(s) A4(s) B4(s) C5(s) B4(s) C5(s) B4(s) A4(s) B4(s) A4(s) D5(s) B4(s) A4(h) ~A4(q) rest(q)
```

```trope-row je_haf_western
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(de) A4(s) 3{B4(e) A4(e) G4(e)} A4(e) G4(e) ~G4(e)
```

```trope-row je_haf_western
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) A4(s) G4(s) F♯4(s) G4(s) ~D4(h)
```

```trope-row je_haf_western
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            G4(q) B4(e) G4(e) B4(e) D5(s) C5(s) B4(s) A4(de) ~A4(e) rest(e)
geresh           C5(h) ~C5(q) E4(q)
```

```trope-row je_haf_western
#11 גֵּרְשַׁ֞יִם
gershayim        A4(q) ~A4(s) G4(s) F♯4(s) G4(s) A4(e) A4(e)
```

```trope-row je_haf_western
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) G4(s) A4(s) B4(s) G4(s) C5(e) B4(e) A4(e) ~G4(h) rest(e)
tevir            E4(e) E4(e) 3{E4(s) D4(s) E4(s)} G4(dh)
```

```trope-row je_haf_western
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) E4(s)
tipcha           C5(dq) B4(e) A4(e) 3{A4(s) B4(s) A4(s)} G4(e)
mercha           E4(de) E4(s)
sof_pasuk        G4(de) D4(s) E4(q,fermata)
```

## Haftarah · Spanish & Portuguese (`je_haf_sp`)

Sephardi (Europe) — Jewish Encyclopedia 1901, “Prophets, Sephardim”.

```trope-system je_haf_sp
group: haftarah
key: G
rows: 13
underlay: names
accidentals: D♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Haftarah · Spanish & Portuguese
short: Spanish & Portuguese
trad: Sephardi (Europe)
sub: Jewish Encyclopedia 1901, “Prophets, Sephardim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Prophets, Sephardim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Spanish & Portuguese haftarah melody. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_haf_sp
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            B4(q) B4(dq) A4(e) B4(s) E5(s) F♯4(dq) G4(q)
segol            F♯4(s) B4(s) E4(dq) ~E4(h)
```

```trope-row je_haf_sp
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  E4(q)
munach           E4(h) ~B4(e) rest(e) E4(q)
revia            E4(h) ~B4(e) rest(e) B4(q) A4(dq) G4(32) F♯4(32) E4(s) E4(q) E4(e)
```

```trope-row je_haf_sp
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          3{B4(s) A4(s) C5(s)} B4(s) A4(e) A4(e) B4(e)
pashta           B4(e) B4(s) 3{A4(32) C5(32) B4(32)} A4(s) B4(s) F♯4(e) ~E4(q)
zakef_katon      G4(dq) F♯4(e) F♯4(e) E4(e) ~E4(e)
```

```trope-row je_haf_sp
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            B4(e) B4(e) ~F♯4(e) rest(e) F♯4(e) F♯4(dq) F♯4(e)
zakef_katon      G4(dq) F♯4(e) F♯4(e) E4(e) ~E4(e)
```

```trope-row je_haf_sp
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) B4(e) B4(e) A4(dq) G4(s) F♯4(s) G4(s) F♯4(s) E4(e) ~E4(dq) F♯4(s)
```

```trope-row je_haf_sp
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(e) ~A4(e)
tipcha           G4(e) F♯4(e) G4(e)
munach           G4(q)
etnachta         G4(s) F♯4(s) F♯4(e) E4(e) ~E4(dq,fermata)
```

```trope-row je_haf_sp
#7 פָּזֵ֡ר
pazer            A4(q) B4(s) A4(s) G4(s) G4(s) A4(s) G4(q) G4(q)
```

```trope-row je_haf_sp
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   F♯4(q) G4(s) A4(s) B4(s) A4(s) F♯4(e) A4(q)
```

```trope-row je_haf_sp
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) F♯4(s) G4(s) A4(s) B4(s) G4(s) A4(s) ~A4(q)
```

```trope-row je_haf_sp
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            B4(de) B4(e) A4(e) 3{A4(s) G4(s) F♯4(s)} E4(e)
geresh           A4(s) G4(s) F♯4(s) 3!{F♯4(e) E4(de)} E4(q)
```

```trope-row je_haf_sp
#11 גֵּרְשַׁ֞יִם
gershayim        A4(q) B4(de) A4(s) A4(s) ~G4(s) F♯4(s) F♯4(e) E4(e) E4(e) E4(e)
```

```trope-row je_haf_sp
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            E4(de) E4(s) E4(dq) G4(s) F♯4(s) 3{E4(s) F♯4(s) E4(s)} D4(e) ~D4(e) D♯4(e) C4(e)
tevir            D4(dq) E4(s) F♯4(s) E4(e)
```

```trope-row je_haf_sp
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) F♯4(s)
tipcha           G4(e) ~A4(e) G4(e) G4(e)
mercha           F♯4(de) F♯4(s)
sof_pasuk        A4(s) E4(s) F♯4(de) G4(de) F♯4(s) E4(q,fermata)
```

## Haftarah · Baghdadi (`je_haf_baghdad`)

Mizrahi (Iraq) — Jewish Encyclopedia 1901, “Prophets, Bagdad”.

```trope-system je_haf_baghdad
group: haftarah
key: D
rows: 13
underlay: names
accidentals: G♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Haftarah · Baghdadi
short: Baghdadi (1901)
trad: Mizrahi (Iraq)
sub: Jewish Encyclopedia 1901, “Prophets, Bagdad”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Prophets, Bagdad”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Iraqi haftarah melody. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_haf_baghdad
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            D4(q) D4(q) ~E4(q) A4(dq) G♯4(s) A4(q)
segol            F♯4(q) ~E4(h)
```

```trope-row je_haf_baghdad
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  E4(q)
munach           E4(q) ~F♯4(h) E4(q)
revia            E4(q) ~F♯4(h) E4(q) F♯4(h) F♯4(e) F♯4(s) F♯4(s)
```

```trope-row je_haf_baghdad
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          D4(q) D4(e) ~E4(s) F♯4(s)
pashta           E4(q) A4(de) G♯4(s) F♯4(q) E4(q)
zakef_katon      F♯4(e) F♯4(e) F♯4(s) E4(e) ~E4(e)
```

```trope-row je_haf_baghdad
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            F♯4(e) F♯4(e) ~F♯4(de) E4(s) G4(e) F♯4(e) F♯4(e)
zakef_katon      F♯4(e) F♯4(e) F♯4(s) E4(e) ~E4(e)
```

```trope-row je_haf_baghdad
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      E4(e) E4(e) E4(e) F♯4(dq) E4(s) F♯4(s) E4(e) ~E4(dq) E4(s)
```

```trope-row je_haf_baghdad
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           F♯4(e) E4(e)
tipcha           E4(s) D4(s) C♯4(s) D4(e) D4(e)
munach           F♯4(q)
etnachta         E4(e) E4(e) F♯4(q,fermata)
```

```trope-row je_haf_baghdad
#7 פָּזֵ֡ר
pazer            A4(s) G4(s) F♯4(e) E4(e) ~E4(h) ~E4(h)
```

```trope-row je_haf_baghdad
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   F♯4(q) 3{E4(s) F♯4(s) E4(s)} D4(s) E4(s) F♯4(h)
```

```trope-row je_haf_baghdad
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   D4(q) 3{D4(q) C♯4(q) D4(q)} E4(h)
```

```trope-row je_haf_baghdad
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            E4(q) A4(de) G♯4(s) A4(de) F♯4(s) E4(q)
geresh           rest(q) 3!{G4(de) F♯4(e) E4(e)}
```

```trope-row je_haf_baghdad
#11 גֵּרְשַׁ֞יִם
gershayim        A4(de) F♯4(s) 3!{G4(de) F♯4(e) E4(e)}
```

```trope-row je_haf_baghdad
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            D4(de) D4(s) D4(h) ~E4(q) E4(q)
tevir            E4(e) 3!{D4(e) C♯4(e)} D4(q)
```

```trope-row je_haf_baghdad
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) E4(s)
tipcha           F♯4(q) E4(e) E4(e) D4(s) C♯4(s) D4(e)
mercha           D4(de) D4(s)
sof_pasuk        F♯4(q) E4(e) E4(q,fermata)
```

## Esther · Western Ashkenazi (`je_esther_western`)

British – Western Europe — Jewish Encyclopedia 1901, “Esther, Ashkenazim”.

```trope-system je_esther_western
group: esther
key: G
rows: 13
underlay: names
accidentals: G♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Esther · Western Ashkenazi
short: Western Ashkenazi (1902)
trad: British – Western Europe
sub: Jewish Encyclopedia 1901, “Esther, Ashkenazim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Esther, Ashkenazim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Megillat Esther in the Western Ashkenazi tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_esther_western
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            A4(q) 3!{E4(e) A4(s) C5(s)} E5(s) F♯5(32) D5(32) C5(32) B4(32) A4(e) 3{E4(e) F♯4(e) G♯4(e)}
segol            B4(q) ~A4(h)
```

```trope-row je_esther_western
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  F♯4(q)
munach           G4(e) 3{F♯4(s) G4(s) A4(s)} G4(h) B4(q)
revia            E5(q) ~D5(h) B4(q) B4(dq) A4(e) 3{G4(32) F♯4(32) E4(32)} E4(q) E4(e)
```

```trope-row je_esther_western
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          E4(e) ~G4(e) G4(e)
pashta           B4(e) D5(dh) G4(q)
zakef_katon      A4(q) A4(e) A4(s) F♯4(s) E5(s) D4(e)
```

```trope-row je_esther_western
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            G4(e) D5(q) G4(e) A4(q) F♯4(e)
zakef_katon      A4(q) A4(e) A4(s) F♯4(s) E5(s) D4(e)
```

```trope-row je_esther_western
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      G4(e) G4(e) G4(e) D5(s) B4(s) ~G4(e) ~G4(h) B4(dq) B4(s)
```

```trope-row je_esther_western
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           B4(e) B4(e)
tipcha           B4(de) G4(s) E5(s) B4(e) B4(e)
munach           B4(q)
etnachta         E4(s) F♯4(s) G4(s) C5(s) E4(e,fermata)
```

```trope-row je_esther_western
#7 פָּזֵ֡ר
pazer            C5(dh) G4(q) G4(de) E5(s) E4(e) B4(s) C5(s) D5(e) 3{E5(s) F♯5(s) E5(s)} 3{F♯5(e) G5(e) D5(e)} D5(q)
```

```trope-row je_esther_western
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(de) B4(s) 3{B4(e) A4(e) G4(e)} A4(e) G4(e) ~G4(e)
```

```trope-row je_esther_western
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) 3{A4(e) G4(e) F♯4(e)} A4(e) G4(e) ~G4(q) D5(q)
```

```trope-row je_esther_western
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            D5(q) D5(dq) B4(e) D5(e) G5(e) ~D5(e)
geresh           C5(h) D5(q) B4(q)
```

```trope-row je_esther_western
#11 גֵּרְשַׁ֞יִם
gershayim        D5(q) ~D5(s) C5(s) B4(s) C5(s) D5(e) D5(e)
```

```trope-row je_esther_western
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) 3{D5(s) C5(s) A4(s)} 3{A4(s) G4(s) A4(s)} B4(e) A4(e) ~A4(e)
tevir            E4(e) 3{E4(s) D4(s) E4(s)} G4(dh)
```

```trope-row je_esther_western
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           B4(de) B4(s)
tipcha           B4(q) B4(e) B4(de) G4(s) E5(e) B4(e)
mercha           B4(de) B4(s)
sof_pasuk        B4(e) E4(e) E4(s) F♯4(s) G4(e) B4(e) ~A4(q,fermata)
```

## Esther · Spanish & Portuguese (`je_esther_sp`)

Sephardi (Europe) — Jewish Encyclopedia 1901, “Esther, Sephardim”.

```trope-system je_esther_sp
group: esther
key: G
rows: 13
underlay: names
accidentals: D♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Esther · Spanish & Portuguese
short: Spanish & Portuguese
trad: Sephardi (Europe)
sub: Jewish Encyclopedia 1901, “Esther, Sephardim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Esther, Sephardim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Megillat Esther in the Spanish & Portuguese tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_esther_sp
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            D5(q) D5(dh) B4(q)
segol            3{A4(s) B4(s) A4(s)} G4(s) F♯4(32) E4(32) E4(h)
```

```trope-row je_esther_sp
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           G4(h) ~D5(e) G4(e) rest(e) G4(q)
revia            G4(h) ~G4(e) D5(e) rest(e) B4(q) 3{A4(s) B4(s) A4(s)} G4(s) F♯4(32) E4(32) E4(q) E4(q)
```

```trope-row je_esther_sp
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          G4(q) G4(e) D5(e)
pashta           G4(q) D5(dh) G4(q)
zakef_katon      B4(q) A4(e) A4(s) G4(s) F♯4(s) E4(e) ~D4(e)
```

```trope-row je_esther_sp
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            G4(e) D5(e) G4(e) B4(q)
zakef_katon      B4(q) A4(e) A4(s) G4(s) F♯4(s) E4(e) ~D4(e)
```

```trope-row je_esther_sp
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) B4(e) B4(e) 3{A4(s) B4(s) A4(s)} G4(s) F♯4(s) G4(s) F♯4(s) E4(h) F♯4(dq) F♯4(s)
```

```trope-row je_esther_sp
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(e) A4(s) G4(s)
tipcha           G4(e) G4(q) G4(e)
munach           A4(q)
etnachta         G4(e) G4(e) G4(q,fermata)
```

```trope-row je_esther_sp
#7 פָּזֵ֡ר
pazer            G4(h) ~G4(e) D5(e,fermata) rest(q) B4(q) 3{A4(s) B4(s) A4(s)} G4(e) F♯4(e) ~F♯4(h)
```

```trope-row je_esther_sp
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   B4(q) A4(e) G4(s) F♯4(s) F♯4(h)
```

```trope-row je_esther_sp
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   B4(q) A4(e) G4(s) F♯4(s) ~F♯4(h)
```

```trope-row je_esther_sp
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            F♯4(q) F♯4(dq) F♯4(e) G4(e) A4(e)
geresh           B4(h) B4(h)
```

```trope-row je_esther_sp
#11 גֵּרְשַׁ֞יִם
gershayim        B4(q) F♯4(q) F♯4(e) G4(e) A4(e) B4(e) B4(e)
```

```trope-row je_esther_sp
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            E4(de) E4(s) E4(s) F♯4(s) E4(s) D4(s) C4(dq) D4(e)
tevir            E4(e) F♯4(e) E4(s) D♯4(s) F♯4(s) D4(e)
```

```trope-row je_esther_sp
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           F♯4(de) F♯4(s)
tipcha           G4(e) A4(s) G4(e) G4(q) G4(q)
mercha           G4(de) G4(s)
sof_pasuk        A4(q) G4(e) G4(q,fermata)
```

## Eicha · Western Ashkenazi (`je_eicha_western`)

British – Western Europe — Jewish Encyclopedia 1901, “Lamentations, Ashkenazim”.

```trope-system je_eicha_western
group: eicha
key: G
rows: 13
underlay: names
accidentals: —
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Eicha · Western Ashkenazi
short: Western Ashkenazi (1902)
trad: British – Western Europe
sub: Jewish Encyclopedia 1901, “Lamentations, Ashkenazim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Lamentations, Ashkenazim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Lamentations in the Western Ashkenazi tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_eicha_western
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            E5(q) E5(q) 3{D5(e) C5(e) B4(e)} A4(q) C5(q)
segol            C5(q) ~A4(h)
```

```trope-row je_eicha_western
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           G4(e) 3{F♯4(s) G4(s) A4(s)} G4(h) B4(q)
revia            E5(q) ~D5(h) B4(q) B4(e) A4(e) 3{G4(s) F♯4(s) G4(s)} E4(e) D4(q) D4(e)
```

```trope-row je_eicha_western
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          D4(e) ~G4(e) G4(e)
pashta           B4(e) E5(q) ~D5(h) G4(q)
zakef_katon      G4(e) A4(e) B4(e) ~G4(e)
```

```trope-row je_eicha_western
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            B4(e) E5(dq) ~D5(e) rest(e) G4(e)
zakef_katon      G4(e) A4(e) B4(e) ~G4(e)
```

```trope-row je_eicha_western
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) B4(e) B4(e) D4(e) ~G4(e) ~G4(h) D4(dq) D4(s)
```

```trope-row je_eicha_western
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           A4(dq) B4(e) C5(s) 3!{C5(s) F♯4(e) B4(e)}
tipcha           A4(e) A4(e)
munach           B4(q)
etnachta         3{G4(e) G4(e) F♯4(e)} E4(q,fermata)
```

```trope-row je_eicha_western
#7 פָּזֵ֡ר
pazer            B4(e) ~B4(h) D4(q) G4(e) ~G4(s) A4(s) B4(s) C5(s) D5(s) C5(s) B4(s) A4(s) B4(s) A4(s) D5(s) B4(s) A4(h) ~A4(q) rest(q)
```

```trope-row je_eicha_western
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(de) B4(s) 3{B4(e) A4(e) B4(e)} A4(e) A4(e) ~A4(e)
```

```trope-row je_eicha_western
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) G4(e) E4(s) F♯4(s) G4(s) A4(s) G4(e) B4(q)
```

```trope-row je_eicha_western
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            D5(dq) D5(e) B4(e) E5(e) ~D5(e)
geresh           C5(h) D5(q) A4(q)
```

```trope-row je_eicha_western
#11 גֵּרְשַׁ֞יִם
gershayim        D5(q) ~D5(s) C5(s) B4(s) C5(s) D5(e) D5(e)
```

```trope-row je_eicha_western
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            C5(de) C5(s) 3{E5(s) D5(s) C5(s)} 3{B4(s) G4(s) A4(s)} B4(e) A4(e) ~A4(e)
tevir            E4(e) 3{E4(s) D4(s) E4(s)} G4(dh)
```

```trope-row je_eicha_western
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) E4(s)
tipcha           A4(dq) B4(e) C5(e) ~C5(de) B4(s) A4(e)
mercha           A4(de) A4(s)
sof_pasuk        B4(dq) G4(e) F♯4(e) E4(q,fermata)
```

## Eicha · Spanish & Portuguese (`je_eicha_sp`)

Sephardi (Europe) — Jewish Encyclopedia 1901, “Lamentations, Sephardim”.

```trope-system je_eicha_sp
group: eicha
key: G
rows: 13
underlay: names
accidentals: D♯ G♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Eicha · Spanish & Portuguese
short: Spanish & Portuguese
trad: Sephardi (Europe)
sub: Jewish Encyclopedia 1901, “Lamentations, Sephardim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Lamentations, Sephardim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Lamentations in the Spanish & Portuguese tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_eicha_sp
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            D5(q) D5(dh) A4(q)
segol            G♯4(e) A4(e) F♯4(h)
```

```trope-row je_eicha_sp
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  A4(q)
munach           A4(h) ~E5(e) A4(e) rest(e) A4(q)
revia            A4(h) ~E5(e) A4(e) rest(e) A4(e) G♯4(e) A4(e) A4(e) F♯4(e) F♯4(e) E4(q) E4(e) rest(e)
```

```trope-row je_eicha_sp
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          B4(s) D5(s) C5(s) B4(e)
pashta           B4(q) B4(s) D5(s) C5(s) B4(s) ~A4(h) D4(q)
zakef_katon      A4(q) G4(e) A4(e) A4(e) ~E4(e)
```

```trope-row je_eicha_sp
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            B4(e) B4(e) ~A4(e) A4(e) G4(q) A4(e)
zakef_katon      A4(q) G4(e) A4(e) A4(e) ~E4(e)
```

```trope-row je_eicha_sp
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      E4(e) A4(e) G♯4(e) ~G4(e) A4(e) A4(e) ~E4(e) E4(dq) F♯4(s)
```

```trope-row je_eicha_sp
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(dq) A4(e)
tipcha           3{G4(s) A4(s) G4(s)} F♯4(s) E4(e) ~E4(e) E4(e)
munach           F♯4(q)
etnachta         3{F♯4(s) G4(s) F♯4(s)} E4(s) D4(s) E4(dq,fermata)
```

```trope-row je_eicha_sp
#7 פָּזֵ֡ר
pazer            3{G4(s) F♯4(s) E4(s)} E4(h) E4(q) E4(q) F♯4(e) G4(e) A4(q) B4(s) A4(s) G4(s) F♯4(s) ~F♯4(h) rest(q)
```

```trope-row je_eicha_sp
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   E4(q) E4(de) D4(s) E4(s) D4(s) D4(h)
```

```trope-row je_eicha_sp
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   E4(q) E4(de) G4(32) D4(s) E4(s) D4(s) ~D4(h) A4(q)
```

```trope-row je_eicha_sp
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            A4(q) 3{A4(s) B4(s) A4(s)} G♯4(de) A4(s) A4(q) A4(e) E4(e)
geresh           G♯4(e) A4(e) ~A4(h) E4(q)
```

```trope-row je_eicha_sp
#11 גֵּרְשַׁ֞יִם
gershayim        A4(q) 3{A4(s) B4(s) A4(s)} G♯4(q) A4(q) A4(e) E4(e)
```

```trope-row je_eicha_sp
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            F♯4(de) F♯4(s) E4(e) F♯4(e) E4(e) D4(e) C4(dq) D4(e)
tevir            E4(e) 3!{F♯4(s) E4(s)} D♯4(s) F♯4(s) E4(e)
```

```trope-row je_eicha_sp
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           E4(de) F♯4(s)
tipcha           G4(q) A4(e) G4(e) 3!{A4(s) G4(s)} F♯4(s) E4(s)
mercha           E4(de) F♯4(s)
sof_pasuk        E4(e) D4(e) C4(e) D4(e) E4(q,fermata)
```

## Eicha · Syrian (Egypt & Syria) (`je_eicha_syria`)

Sephardi (Levant) — Jewish Encyclopedia 1901, “Lamentations, Egypt and Syria”.

```trope-system je_eicha_syria
group: eicha
key: C
rows: 13
underlay: names
accidentals: F♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Eicha · Syrian (Egypt & Syria)
short: Syrian (1901)
trad: Sephardi (Levant)
sub: Jewish Encyclopedia 1901, “Lamentations, Egypt and Syria”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Lamentations, Egypt and Syria”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Lamentations in the Levantine tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_eicha_syria
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            D5(q) D5(dh) E5(q)
segol            E5(q) 3{D5(e) C5(e) B4(e)} A4(h)
```

```trope-row je_eicha_syria
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  A4(q)
munach           A4(h) ~E5(e) A4(e) rest(e) A4(q)
revia            A4(h) ~E5(e) A4(e) rest(e) D5(q) 3{D5(e) C5(e) B4(e)} A4(q) A4(e) rest(e)
```

```trope-row je_eicha_syria
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          A4(q) A4(e) D5(e)
pashta           A4(q) F5(e) E5(e) ~E5(h) A4(q)
zakef_katon      C5(e) ~D5(e) B4(s) ~B4(s) A4(q)
```

```trope-row je_eicha_syria
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            A4(e) D5(e) A4(q)
zakef_katon      C5(e) ~D5(e) B4(s) ~B4(s) A4(q)
```

```trope-row je_eicha_syria
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      E5(e) D5(e) C5(e) B4(e) A4(q) A4(dq) A4(s)
```

```trope-row je_eicha_syria
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           B4(q) B4(e)
tipcha           G4(q) G4(e)
munach           G4(q)
etnachta         A4(e) A4(e) A4(q,fermata)
```

```trope-row je_eicha_syria
#7 פָּזֵ֡ר
pazer            D5(e) 3{C5(e) B4(e) A4(e)} A4(h)
```

```trope-row je_eicha_syria
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   E5(q) D5(e) 3{C5(e) C5(e) A4(e)} A4(h)
```

```trope-row je_eicha_syria
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   E5(q) 3{D5(e) C5(e) B4(e)} A4(h) A4(q)
```

```trope-row je_eicha_syria
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            F5(dq) E5(e) D5(q) C5(e) A4(e)
geresh           A4(h) rest(q) rest(q) C5(h) A4(q)
```

```trope-row je_eicha_syria
#11 גֵּרְשַׁ֞יִם
gershayim        A4(q) F5(q) E5(e) D5(q) C5(e) A4(e) A4(dh)
```

```trope-row je_eicha_syria
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) G4(dh) G4(q)
tevir            G4(e) 3{G4(e) F♯4(e) G4(e)} A4(h)
```

```trope-row je_eicha_syria
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           A4(de) A4(s)
tipcha           B4(q) A4(e) A4(e) G4(e)
mercha           G4(de) G4(s)
sof_pasuk        B4(q) G4(e) A4(q,fermata)
```

## Ruth · Spanish & Portuguese (`je_ruth_sp`)

Sephardi (Europe) — Jewish Encyclopedia 1901, “Ruth, Sephardim”.

```trope-system je_ruth_sp
group: megillot
key: G
rows: 13
underlay: names
accidentals: —
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Ruth · Spanish & Portuguese
short: Spanish & Portuguese
trad: Sephardi (Europe)
sub: Jewish Encyclopedia 1901, “Ruth, Sephardim”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Ruth, Sephardim”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: Ruth (and by custom the other festival scrolls) in the Spanish & Portuguese tradition. Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_ruth_sp
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            F♯4(q) 3{B4(e) C5(e) B4(e)} A4(s) B4(s) G4(e) A4(q) C5(e) A4(e)
segol            G4(q) ~F♯4(h)
```

```trope-row je_ruth_sp
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  G4(q)
munach           F♯4(h) ~D5(e) F♯4(e) rest(e) G4(q)
revia            F♯4(h) ~D5(e) F♯4(e) rest(e) F♯4(q) 3{B4(s) C5(s) B4(s)} A4(e) F♯4(s) G4(s) A4(s) 3{G4(s) F♯4(s) G4(s)} F♯4(e) ~F♯4(e) F♯4(e)
```

```trope-row je_ruth_sp
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          3{B4(s) C5(s) B4(s)} F♯4(e) ~F♯4(e) B4(e)
pashta           B4(e) 3{A4(s) B4(s) A4(s)} G4(h) F♯4(q)
zakef_katon      A4(dq) G4(e) G4(e) 3{A4(s) B4(s) A4(s)} F♯4(e) ~F♯4(e)
```

```trope-row je_ruth_sp
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            F♯4(e) B4(dq) A4(e) A4(dq) G4(e)
zakef_katon      A4(dq) G4(e) G4(e) 3{A4(s) B4(s) A4(s)} F♯4(e) ~F♯4(e)
```

```trope-row je_ruth_sp
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) A4(e) ~G4(e) A4(e) 3{G4(s) A4(s) G4(s)} 3{F♯4(s) G4(s) F♯4(s)} F♯4(dq) B4(s)
```

```trope-row je_ruth_sp
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           3{A4(s) B4(s) A4(s)} G4(e) F♯4(e)
tipcha           F♯4(s) 3{G4(s) A4(s) G4(s)} F♯4(e) E4(e) F♯4(e)
munach           F♯4(q)
etnachta         F♯4(e) D4(e) F♯4(q,fermata)
```

```trope-row je_ruth_sp
#7 פָּזֵ֡ר
pazer            3{G4(s) F♯4(s) E4(s)} F♯4(h) G4(q) F♯4(e) ~F♯4(h) ~F♯4(q) A4(q) 3{B4(s) C5(s) B4(s)} A4(e) ~A4(e) G4(e) F♯4(e)
```

```trope-row je_ruth_sp
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(q) E4(e) G4(s) A4(s) 3{B4(e) A4(e) G4(e)}
```

```trope-row je_ruth_sp
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   G4(q) F♯4(e) G4(e) A4(e) 3{B4(e) A4(e) G4(e)} F♯4(e) F♯4(q)
```

```trope-row je_ruth_sp
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            B4(e) C5(s) B4(s) A4(e) G4(e) A4(q) G4(e) A4(s) G4(s)
geresh           F♯4(h) rest(q) rest(q) A4(q) G4(e) A4(s) G4(s)
```

```trope-row je_ruth_sp
#11 גֵּרְשַׁ֞יִם
gershayim        F♯4(q) F♯4(q) B4(e) C5(s) B4(s) A4(e) G4(s) A4(e) G4(s) 3!{A4(s) G4(s)} F♯4(dh)
```

```trope-row je_ruth_sp
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            G4(de) G4(s) G4(e) A4(e) G4(h) G4(q)
tevir            E4(e) F♯4(e) 3{G4(e) A4(e) G4(e)} F♯4(q)
```

```trope-row je_ruth_sp
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           A4(de) B4(s)
tipcha           3{A4(s) B4(s) A4(s)} G4(e) F♯4(e) F♯4(s) 3{F♯4(s) G4(s) F♯4(s)} E4(e)
mercha           F♯4(de) F♯4(s)
sof_pasuk        F♯4(q) F♯4(s) D4(s) F♯4(q,fermata)
```

## Ketuvim · Baghdadi (`je_ketuvim_baghdad`)

Mizrahi (Iraq) — Jewish Encyclopedia 1901, “Hagiographa, Bagdad”.

```trope-system je_ketuvim_baghdad
group: megillot
key: G
rows: 13
underlay: names
accidentals: C♯
lacks: shalshelet geresh_muqdam mercha_kefula karnei_parah yerach_ben_yomo
label: Ketuvim · Baghdadi
short: Baghdadi (1901)
trad: Mizrahi (Iraq)
sub: Jewish Encyclopedia 1901, “Hagiographa, Bagdad”
source: The Jewish Encyclopedia (New York: Funk & Wagnalls, 1901–1906), article “Cantillation” (Francis L. Cohen), the cantillation tables: “Hagiographa, Bagdad”
license: The table is in the public domain (published 1901–1906). This transcription is CC BY-SA 4.0.
note: The Baghdadi chant for the Writings (the scrolls read in synagogue). Transcribed from the cantillation tables of the Jewish Encyclopedia (1901–06, art. “Cantillation”, Francis L. Cohen), which set each tradition’s rendering of every sign side by side. The table gives each sign in a standard context, so these rows are the table’s columns regrouped into phrases.
```

```trope-row je_ketuvim_baghdad
#1 זַרְקָא֮ סֶגּוֹל֒
zarka            G4(q) A4(dq) G4(e) A4(q) A4(q)
segol            G4(q) ~F♯4(h)
```

```trope-row je_ketuvim_baghdad
#2 מֻנָּ֣ח׀ מֻנָּ֣ח רְבִ֗יעַ
munach_legarmeh  F♯4(q)
munach           E4(h) ~C♯5(e) E4(e) rest(e) F♯4(q)
revia            E4(h) ~C♯5(e) E4(e) rest(e) G4(dq) F♯4(e) F♯4(q)
```

```trope-row je_ketuvim_baghdad
#3 מַהְפָּ֤ךְ פַּשְׁטָא֙ זָקֵף־קָטֹ֔ן
mahpach          D5(q) B4(e) A4(q)
pashta           B4(q) 3{B4(s) A4(s) B4(s)} A4(s) ~A4(h) F♯4(q)
zakef_katon      G4(e) F♯4(q)
```

```trope-row je_ketuvim_baghdad
#4 יְ֚תִיב זָקֵף־קָטֹ֔ן
yetiv            F♯4(e) A4(q) F♯4(e) A4(q) G4(e)
zakef_katon      G4(e) F♯4(q)
```

```trope-row je_ketuvim_baghdad
#5 זָקֵף־גָּד֕וֹל
zakef_gadol      B4(e) A4(q) B4(s) A4(s) G4(s) F♯4(s) G4(e) ~F♯4(e) A4(dq) A4(s)
```

```trope-row je_ketuvim_baghdad
#6 מֵרְכָ֥א טִפְּחָ֖א מֻנָּ֣ח אֶתְנַחְתָּ֑א
mercha           G4(e) F♯4(s) E4(s) E4(e)
tipcha           E4(e)
munach           A4(q)
etnachta         A4(e) A4(e) G4(e) F♯4(e,fermata)
```

```trope-row je_ketuvim_baghdad
#7 פָּזֵ֡ר
pazer            G4(e) E4(e) F♯4(e) G4(e) A4(q)
```

```trope-row je_ketuvim_baghdad
#8 תְּ֠לִישָׁא־גְדוֹלָה
telisha_gedola   G4(q) F♯4(e) G4(e) A4(h)
```

```trope-row je_ketuvim_baghdad
#9 תְּלִישָׁא־קְטַנָּה֩
telisha_ketana   F♯4(q) E4(q) G4(q) F♯4(q) G4(q)
```

```trope-row je_ketuvim_baghdad
#10 קַדְמָ֨א וְאַזְלָ֜א
kadma            G4(q) A4(dq) A4(e) A4(e) G4(e)
geresh           F♯4(h) rest(q) G4(h) F♯4(q)
```

```trope-row je_ketuvim_baghdad
#11 גֵּרְשַׁ֞יִם
gershayim        F♯4(q) B4(de) A4(s) A4(de) F♯4(s) G4(e) F♯4(e)
```

```trope-row je_ketuvim_baghdad
#12 דַּרְגָּ֧א תְּבִ֛יר
darga            F♯4(de) D4(s) F♯4(h) G4(q)
tevir            A4(e) G4(e) A4(h)
```

```trope-row je_ketuvim_baghdad
#13 מֵרְכָ֥א טִפְּחָ֖א מֵרְכָ֥א סוֹף־פָּסֽוּק׃
mercha           A4(de) A4(s)
tipcha           G4(q) F♯4(s) E4(s) E4(q)
mercha           A4(de) A4(s)
sof_pasuk        G4(q) A4(e) G4(e) F♯4(q,fermata)
```
