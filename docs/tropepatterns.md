# Trope patterns — the printed cantillation chart, transcribed

The Trope Tutor's Learn-card staffs follow the standard Ashkenazi melodies as printed in the
teacher's cantillation chart: Appendix H, *Torah Cantillation* (41 numbered phrase patterns, treble
clef, three sharps = A major), the source of `data/trope/trope_motifs.json`, and *High Holiday Torah
Cantillation* (33 patterns, no key signature), the source of `data/trope/trope_motifs_hh.json`. This file is the transcription of those pages,
kept so the tutor's data can be re-checked against its source without the book, and so the phrase
patterns are on hand for future features. The page photographs are not in the repository (they are
copyrighted scans); the melodies themselves are traditional. This transcription is CC BY-SA 4.0,
like the motif file it feeds.

## How to read this file

- **Pitches** are scientific pitch names as printed in the treble clef: C4 is middle C, A3 the A
  below it, so the Torah chart lives between A3 and B4 and the High Holiday chart between G3 and
  B♭4 (men sing both an octave lower).
- **Key.** In the Torah chart every F, C and G is sharp unless a natural sign is printed; the
  chart's own naturals are written `G♮`. The High Holiday chart has no key signature and prints a
  flat where it wants `B♭`.
- **Values:** `e` eighth, `s` sixteenth, `q` quarter, `de` dotted eighth, `dq` dotted quarter,
  `h` half, `t` triplet eighth (three in the time of two, bracketed `3` in the print). `~` is a
  slur to the next note, `>` an accent, *grace* a small slashed grace note. `|` separates the
  words of a phrase; syllables are the chart's own (MER-CHA, TIP-CHA …).
- **Scale degrees** are given relative to A for the Torah chart (A = 1, B = 2, C♯ = 3, D = 4,
  E = 5, F♯ = 6, G♯ = 7). The tutor stores `p` = semitones from B4 (B♭4 = −1, A4 = −2, G4 = −4,
  F4 = −6, E4 = −7, D4 = −9, C♯4 = −10, C4 = −11, B3 = −12, A3 = −14, G3 = −16) and `d` = 1 for
  eighths, sixteenths and triplet eighths, 2 for quarters, 3 for dotted quarters, 4 for halves.

## A. One figure per mark (Torah chart)

The row named in the last column is the one whose reading feeds the tutor's motif for that mark:
the row where the mark stands alone, or last, in its phrase. Grace notes are omitted from the
motif; everything else is note for note.

| Mark (tutor key) | Figure as printed | Degrees | Chart row |
|---|---|---|---|
| mercha | C♯4(e) E4(de) | 3 5 | Torah #1 |
| tipcha | E4(s) F♯4(de) A4(s) ~E4(dq) | 5 6 1′ 5 | Torah #4 |
| munach (before etnachta) | E4(e) D4(e) ~B3(e) | 5 4 2 | Torah #2 |
| etnachta | A3(s) A3(s) E4(q) | 1 1 5 | Torah #4 |
| sof_pasuk | E4(s) E4(s) D4(q) ~A3(q) | 5 5 4 1 | Torah #8 |
| mahpach | F♯4(e) F♯4(s) ~A3(s) D4(s) | 6 6 1 4 | Torah #11 |
| pashta | D4(e) A4(dq) | 4 1′ | Torah #13 |
| yetiv | B4(q) ~A4(de) | 2′ 1′ | Torah #33 |
| zakef_katon | F♯4(e) A4(q) ~E4(q) | 6 1′ 5 | Torah #13 |
| zakef_gadol | D4(e) D4(e) F♯4(e) A4(e) ~B4(e) A4(e) F♯4(e) E4(q) | 4 4 6 1′ 2′ 1′ 6 5 | Torah #31 |
| zarka | E4(e) *grace* E4(de) ~D4(s) C♯4(s) B3(s) C♯4(s) A3(e >) | 5 5 4 3 2 3 1 | Torah #37 |
| segol | D4(s) F♯4(q) ~E4(e) | 4 6 5 | Torah #37 |
| shalshelet | D4(e) D4(e) ~F♯4 A4 F♯4 D4 F♯4 A4 F♯4 D4 F♯4 A4 F♯4 (e) B4(q >) ~A4(q) | 4 4 6 1′ 6 4 … 2′ 1′ | Torah #38 |
| revia | F♯4(e) E4(de) ~D4(s) C♯4(s) B3(e) | 6 5 4 3 2 | Torah #19 |
| darga | F♯4(e) A4(e) ~G♮4(s) F♯4(s) E4(e) | 6 1′ ♭7 6 5 | Torah #21 |
| tevir | E4(e) D4(t) C♯4(t) D4(t) E4(e) | 5 4 3 4 5 | Torah #22 |
| kadma (in kadma v'azla) | A3(e) D4(e) | 1 4 | Torah #15 |
| geresh (azla) | A4(e) ~F♯4(e) B4(q) A4(e) | 1′ 6 2′ 1′ | Torah #16 |
| gershayim | D4(e) E4(e) F♯4(de) ~E4 D4 E4 (triplet s) F♯4(e) | 4 5 6 5 4 5 6 | Torah #20 |
| telisha_ketana | *grace* D4 D4(e) D4(e) D4(e) D4(e) ~C♯4 D4 E4 D4 (e) | 4 4 4 4 3 4 5 4 | Torah #29 |
| telisha_gedola | *grace* D4 D4(e) D4(e) D4(e) D4(e) ~E4 F♯4 G♮4 A4 F♯4 E4 D4 (e) | 4 4 4 4 5 6 ♭7 1′ 6 5 4 | Torah #28 |
| pazer | D4(e) D4(s) ~E4 F♯4 G♮4 A4 (s) B4 A4 F♯4 E4 (e, tenuto on B4 A4 F♯4) | 4 4 5 6 ♭7 1′ 2′ 1′ 6 5 | Torah #30 |
| mercha_kefula | E4(e) E4(e) E4(e) E4(e) ~F♯4 G♮4 A4 G♮4 F♯4 (e) E4(q) | 5 5 5 5 6 ♭7 1′ ♭7 6 5 | Torah #39 |
| karnei_parah | D4(e) D4(e) D4(e) ~C♯4 D4 D4 (triplet s, > on the last) D4 E4 F♯4 G♮4 A4 F♯4 E4 D4 (s) | 4 4 4 3 4 4 4 5 6 ♭7 1′ 6 5 4 | Torah #40 |
| yerach_ben_yomo | D4(s) D4(s) D4(s) D4(s) F♯4(q) ~E4(q) | 4 4 4 4 6 5 | Torah #40 |
| munach legarmeh (no tutor card) | D4(e) D4(s) E4(s) F♯4(s) D4(s) ~E4(q) | 4 4 5 6 4 5 | Torah #17 |
| sof pasuk, end of an aliyah (no tutor card) | see Torah #41 | | Torah #41 |

`geresh_muqdam` has no figure in the chart and keeps no entry, as before.

Three things the chart does that the staffs cannot show: the lowered seventh (G♮ in A major) is
printed with a natural sign in darga, telisha gedola, pazer, mercha kefula and karnei parah, and in
mercha kefula the second G carries no sign (a natural persists through the phrase, so it is read
as G♮ too); zarka and both telishas open with a small slashed grace note on the first pitch; and
pazer, zakef gadol, zarka, shalshelet and karnei parah carry accent or tenuto marks on the notes
shown above.

## B. The 41 Torah phrase patterns

| # | Phrase | As printed |
|---|---|---|
| 1 | מֵרְכָא טִפְּחָא מֻנַּח אֶתְנַחְתָּא | MER C♯4(e) CHA E4(de) \| TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| MU E4(e) NACH D4(e) ~B3(e) \| ET A3(s) NACH A3(s) TA E4(q) |
| 2 | טִפְּחָא מֻנַּח אֶתְנַחְתָּא | TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| MU E4(e) NACH D4(e) ~B3(e) \| ET A3(s) NACH A3(s) TA E4(q) |
| 3 | מֵרְכָא טִפְּחָא אֶתְנַחְתָּא | MER C♯4(e) CHA E4(de) \| TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| ET A3(s) NACH A3(s) TA E4(q) |
| 4 | טִפְּחָא אֶתְנַחְתָּא | TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| ET A3(s) NACH A3(s) TA E4(q) |
| 5 | מֵרְכָא טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ | MER C♯4(e) CHA E4(de) \| TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| MER C♯4(e) CHA E4(e) \| SOF E4(s) PA E4(s) SUK D4(q) ~A3(q) |
| 6 | טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ | TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| MER C♯4(e) CHA E4(e) \| SOF E4(s) PA E4(s) SUK D4(q) ~A3(q) |
| 7 | מֵרְכָא טִפְּחָא סוֹף־פָּסוּק׃ | MER C♯4(e) CHA E4(de) \| TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| SOF E4(s) PA E4(s) SUK D4(q) ~A3(q) |
| 8 | טִפְּחָא סוֹף־פָּסוּק׃ | TIP E4(s) CHA F♯4(de) A4(s) ~E4(dq) \| SOF E4(s) PA E4(s) SUK D4(q) ~A3(q) |
| 9 | קַדְמָא מַהְפַּךְ פַּשְׁטָא מֻנַּח קָטֹן | KAD D4(e) MA F♯4(dq) \| MA F♯4(e) PACH F♯4(s) ~A3(s) D4(s) \| PASH D4(e) TA A4(dq) \| MU F♯4(e) NACH F♯4(s) ~E4(s) F♯4(de) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 10 | מַהְפַּךְ פַּשְׁטָא מֻנַּח קָטֹן | MA F♯4(e) PACH F♯4(s) ~A3(s) D4(s) \| PASH D4(e) TA A4(dq) \| MU F♯4(e) NACH F♯4(s) ~E4(s) F♯4(de) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 11 | מַהְפַּךְ פַּשְׁטָא קָטֹן | MA F♯4(e) PACH F♯4(s) ~A3(s) D4(s) \| PASH D4(e) TA A4(dq) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 12 | פַּשְׁטָא מֻנַּח קָטֹן | PASH D4(e) TA A4(dq) \| MU F♯4(e) NACH F♯4(s) ~E4(s) F♯4(de) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 13 | פַּשְׁטָא קָטֹן | PASH D4(e) TA A4(dq) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 14 | מֻנַּח מַהְפַּךְ פַּשְׁטָא מֻנַּח קָטֹן | MU A4(e) NACH A4(s) ~F♯4(s) A4(de) \| MA F♯4(e) PACH F♯4(s) ~A3(s) D4(s) \| PASH D4(e) TA A4(dq) \| MU F♯4(e) NACH F♯4(s) ~E4(s) F♯4(de) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 15 | קַדְמָא וְאַזְלָא | KAD A3(e) MA D4(e) \| V' D4(s) AZ F♯4(s) LA A4(e) ~F♯4(e) B4(e) A4(e) |
| 16 | גֵּרֵשׁ | GE A4(e) ~F♯4(e) B4(q) RESH A4(e) |
| 17 | מֻנַּח׀ מֻנַּח רְבִיעִי | MU D4(e) NACH D4(s) E4(s) F♯4(s) D4(s) ~E4(q) \| (eighth rest) MU E4(e) NACH A4(t) F♯4(t) \| R'VI F♯4(t) I E4(de) ~D4(s) C♯4(s) B3(e) |
| 18 | מֻנַּח רְבִיעִי | MU E4(e) NACH A4(t) F♯4(t) \| R'VI F♯4(t) I E4(de) ~D4(s) C♯4(s) B3(e) |
| 19 | רְבִיעִי | R'VI F♯4(e) I E4(de) ~D4(s) C♯4(s) B3(e) |
| 20 | גֵּרְשַׁיִם | GER D4(e) SHA E4(e) YIM F♯4(de) ~E4 D4 E4 (triplet s) F♯4(e) |
| 21 | דַּרְגָּא | DAR F♯4(e) GA A4(e) ~G♮4(s) F♯4(s) E4(e) |
| 22 | תְּבִיר | T' E4(e) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 23 | דַּרְגָּא תְּבִיר | DAR F♯4(e) GA A4(e) ~G♮4(s) F♯4(s) E4(de) \| T' E4(s) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 24 | מֵרְכָא תְּבִיר | MER F♯4(e) CHA A4(e) ~E4(de) \| T' E4(s) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 25 | קַדְמָא דַּרְגָּא תְּבִיר | KAD D4(e) MA F♯4(de) \| DAR F♯4(s) GA A4(e) ~G♮4(s) F♯4(s) E4(de) \| T' E4(s) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 26 | קַדְמָא מֵרְכָא תְּבִיר | KAD D4(e) MA F♯4(de) \| MER F♯4(s) CHA A4(e) ~E4(de) \| T' E4(s) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 27 | מֻנַּח דַּרְגָּא תְּבִיר | MU A4(e) NACH A4(s) ~F♯4(s) A4(de) \| DAR F♯4(s) GA A4(e) ~G♮4(s) F♯4(s) E4(de) \| T' E4(s) VIR D4(t) C♯4(t) D4(t) E4(e) |
| 28 | מֻנַּח תְּלִישָׁא גְדוֹלָה | MU D4(e) NACH F♯4(e) ~E4(e) \| T' *grace* D4 LI D4(e) SHA D4(e) G'DO D4(e) LA D4(e) ~E4 F♯4 G♮4 A4 F♯4 E4 D4 (e) |
| 29 | מֻנַּח תְּלִישָׁא קְטַנָּה | MU D4(e) NACH F♯4(e) ~E4(e) \| T' *grace* D4 LI D4(e) SHA D4(e) KTA D4(e) NA D4(e) ~C♯4 D4 E4 D4 (e) |
| 30 | מֻנַּח פָּזֵר | MU D4(e) NACH F♯4(e) ~E4(e) \| PA D4(e) ZER D4(s) ~E4 F♯4 G♮4 A4 (s) B4 A4 F♯4 E4 (e; tenuto on B4 A4 F♯4) |
| 31 | זָקֵף גָּדוֹל | ZA D4(e, tenuto) KEF D4(e, tenuto) GA F♯4(e) DOL A4(e) ~B4(e) A4(e) F♯4(e) E4(q) |
| 32 | יְתִיב מֻנַּח קָטֹן | (eighth rest) Y' B4(q) ~TIV A4(de) \| MU F♯4(s) NACH F♯4(s) ~E4(s) F♯4(de) \| KA F♯4(e) TON A4(q) ~E4(q) |
| 33 | יְתִיב קָטֹן | (eighth rest) Y' B4(q) ~TIV A4(de) \| KA F♯4(s) TON A4(q) ~E4(q) |
| 34 | מֻנַּח זַרְקָא מֻנַּח סֶגוֹל | MU G♮4(e) NACH F♯4(e) ~E4(e) \| ZAR E4(e) KA *grace* E4(de) ~D4(s) C♯4(s) B3(s) C♯4(s) A3(e >) \| MU A3(q) NACH D4(e) ~D4(e) \| SE D4(s) GOL F♯4(q) ~E4(e) |
| 35 | מֻנַּח זַרְקָא סֶגוֹל | MU G♮4(e) NACH F♯4(e) ~E4(e) \| ZAR E4(e) KA *grace* E4(de) ~D4(s) C♯4(s) B3(s) C♯4(s) A3(e >) \| SE D4(s) GOL F♯4(q) ~E4(e) |
| 36 | זַרְקָא מֻנַּח סֶגוֹל | ZAR E4(e) KA *grace* E4(de) ~D4(s) C♯4(s) B3(s) C♯4(s) A3(e >) \| MU A3(q) NACH D4(e) ~D4(e) \| SE D4(s) GOL F♯4(q) ~E4(e) |
| 37 | זַרְקָא סֶגוֹל | ZAR E4(e) KA *grace* E4(de) ~D4(s) C♯4(s) B3(s) C♯4(s) A3(e >) \| SE D4(s) GOL F♯4(q) ~E4(e) |
| 38 | שַׁלְשֶׁלֶת | SHAL D4(e) SHE D4(e) ~F♯4 A4 F♯4 D4 F♯4 A4 F♯4 D4 F♯4 A4 F♯4 (e) LET B4(q >) ~A4(q) |
| 39 | מֵרְכָא כְפוּלָה | MER E4(e) CHA E4(e) CH'FU E4(e) LA E4(e) ~F♯4 G♮4 A4 G♮4 F♯4 (e) E4(q) |
| 40 | יֵרַח בֶּן יוֹמוֹ קַרְנֵי פָרָה | YE D4(s) RACH D4(s) BEN D4(s) YO D4(s) MO F♯4(q) ~E4(q) \| KAR D4(e) NEI D4(e) FA D4(e) ~C♯4 D4 D4 (triplet s, >) RA D4(s) ~E4 F♯4 G♮4 A4(>) F♯4 E4 D4 (s) |
| 41 | מֵרְכָא טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ (last verse of an aliyah) | MER B3(e) CHA D4(t) ~C♯4(t) \| TIP B3(t) CHA B4(e) ~F♯4(q) \| MER D4(e) CHA D4(e) \| SOF E4(e) PA F♯4(e) F♯4(s) F♯4(s) SUK E4(h) ~B3(h) — the print draws no ledger line under the final B3; check this row by ear before teaching it |

## C. The 33 High Holiday phrase patterns

The set has no key signature and sits on C/D: its sof pasuk ends on C4, its etnachta on D4, and it
prints B♭ where the Torah chart prints G♮ (the same lowered seventh). Rows 1–8 pair with Torah rows
1–8, rows 30–33 are the end-of-aliyah endings. The phrase table is a first-pass reading, pitch by
pitch from the photographs with the rhythm sketched. Each mark's figure was then re-read note by
note from zoomed crops (the table after this one, which feeds the tutor); that reading wins
wherever the two differ, and the first-pass slips it found are listed after it.

| # | Phrase | As printed (first pass) |
|---|---|---|
| 1 | מֵרְכָא טִפְּחָא מֻנַּח אֶתְנַחְתָּא | MER D4(e) CHA D4(e) \| TIP D4(e) G4(e) ~CHA D4(q) \| MU D4(e) NACH C4(t) \| ET C4(t) NACH C4(t) TA F4(e) ~E4(e) D4(q) |
| 2 | טִפְּחָא מֻנַּח אֶתְנַחְתָּא | TIP D4(e) G4(e) ~CHA D4(q) \| MU D4(e) NACH C4(t) \| ET C4(t) NACH C4(t) TA F4(e) ~E4(e) D4(q) |
| 3 | מֵרְכָא טִפְּחָא אֶתְנַחְתָּא | MER D4(e) CHA D4(e) \| TIP D4(e) G4(e) ~CHA D4(q) \| ET C4(e) NACH C4(e) TA F4(e) ~E4(e) D4(q) |
| 4 | טִפְּחָא אֶתְנַחְתָּא | TIP D4(e) G4(e) ~CHA D4(q) \| ET C4(e) NACH C4(e) TA F4(e) ~E4(e) D4(q) |
| 5 | מֵרְכָא טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ | MER D4(e) CHA D4(de) E4(s) \| TIP F4(e) CHA G4(e) ~E4(e) \| MER D4(e) CHA D4(e) C4(e) \| SOF B3(e) PA B3(s) B3(s) SUK B3(e) ~D4(e) C4(e) C4(q) |
| 6 | טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ | TIP E4(e) CHA F4(e) G4(e) ~E4(e) \| MER D4(e) CHA D4(e) C4(e) \| SOF B3 PA B3 B3 SUK B3 ~D4 C4 C4(q) |
| 7 | מֵרְכָא טִפְּחָא סוֹף־פָּסוּק׃ | MER D4(e) CHA D4(e) E4(e) \| TIP F4(e) CHA G4(e) ~E4(e) \| SOF B3 PA B3 B3 SUK B3 ~D4 C4 C4(q) |
| 8 | טִפְּחָא סוֹף־פָּסוּק׃ | TIP E4 or F4(e) F4 CHA G4 ~E4 \| SOF B3 PA B3 B3 SUK B3 ~D4 C4 C4(q) |
| 9 | קַדְמָא מַהְפַּךְ פַּשְׁטָא מֻנַּח קָטֹן | KAD D4(e) MA G4(de) G4(s) \| MA G4(e) PACH ~D4(s) C4(s) D4(e) \| PASH A4(e) TA G4(de) \| (rest) MU F4(e) NACH D4 G4 G4 \| KA G4(e) TON G4(e) ~D4(q) |
| 10 | קַדְמָא מַהְפַּךְ פַּשְׁטָא קָטֹן | KAD D4 MA G4 G4 \| MA G4 PACH D4 C4 D4 \| PASH A4 TA G4 \| KA G4 G4 TON G4 ~D4 |
| 11 | מַהְפַּךְ פַּשְׁטָא מֻנַּח קָטֹן | MA G4 PACH D4 C4 D4 \| PASH A4 TA G4 \| MU F4 NACH F4 D4 G4 G4 \| KA G4 TON ~D4 |
| 12 | מֻנַּח מַהְפַּךְ פַּשְׁטָא קָטֹן | MU G4 F4 G4 \| MA G4 PACH G4 D4 C4 D4 \| PASH A4 TA G4 \| KA G4 G4 TON G4 ~D4 |
| 13 | דַּרְגָּא תְּבִיר | DAR D4(e) GA A4(e) ~G4(e) F4(e) E4(e) D4 D4 \| T' D4(de) VIR C4(s) D4(e) F4(de) E4(s) D4(q) |
| 14 | מֵרְכָא תְּבִיר | MER A4(e) CHA D4 D4 D4 \| T' C4 D4 VIR F4 E4 D4 |
| 15 | מֻנַּח׀ מֻנַּח רְבִיעִי | MU D4(e) NACH B3(q) ~D4(e) \| (rest) MU D4(e) NACH D4(s) A4(s) G4(s) G4(e) G4(e) \| R'VI G4(e) G4(e) I G4(s) F4(s) E4(s) D4(s) E4(e) D4(e) ~C4(q) |
| 16 | מֻנַּח רְבִיעִי | MU D4(e) NACH D4 A4 G4 G4 G4 \| R'VI G4 G4 I G4 F4 E4 D4 E4 D4 ~C4(q) |
| 17 | מֻנַּח תְּלִישָׁא גְדוֹלָה | MU E4(e) NACH D4(e) ~D4(e) \| T' D4 LI D4(e) SHA D4(e) G'DO D4(e) LA E4 F4 G4 F4 E4 ~D4 (e) |
| 18 | מֻנַּח תְּלִישָׁא קְטַנָּה | MU E4(e) NACH D4(e) \| T' D4 LI D4 SHA D4 KTA D4 NAH G4 F4 G4 D4 ~D4 |
| 19 | מֻנַּח פָּזֵר | MU E4(e) ~D4(e) \| (rest) PA D4(e) ZER D4 E4 F4 G4 A4 B♭4 A4 G4 F4 E4 D4 (s) G4(e >) E4(e >) D4(e >) |
| 20 | קַדְמָא וְאַזְלָא | KAD D4(e) MA G4(e) \| V' G4(e) AZ A4(e) LA B♭4 G4 A4 (t) A4(e) A4(e) — then in parentheses a second setting: KAD D4(e) MA G4 G4 G4 (t) V'-AZ A4(e) LA E4 ~G4(q) |
| 21 | גֵּרֵשׁ | GE B♭4(t) ~A4(t) G4(t) A4(e) RESH G4(q) |
| 22 | גֵּרְשַׁיִם | GER D4(e) SHA D4(e) YIM D4(e) ~E4(e) F4(e) C4 or D4(e) G4(e) ~G4(q) |
| 23 | יְתִיב מֻנַּח קָטֹן | Y' C5(e) TIV A4(e) ~E4(e) \| (rest) MU F4(e) NACH F4(s) ~D4(s) G4(de) \| KA G4(e) TON G4(e) ~D4(q) |
| 24 | יְתִיב קָטֹן | Y' C5(e) TIV A4(e) ~E4(e) \| (rest) KA G4(e) TON G4(e) ~D4(q) |
| 25 | זָקֵף גָּדוֹל | ZA D4(t) KEF D4(t) GA D4(t) DOL A4(e) ~G4(e) F4(e) E4(e) F4(e >) E4(e >) D4(q >) |
| 26 | מֻנַּח זַרְקָא מֻנַּח סֶגוֹל | MU C4(e) ~NACH D4 D4 D4 (t) \| ZAR D4(e) KA D4(de) ~C4(s) B3(s) A3(s) B3(s) (A3) G4(e) A4(e) C5(e) \| MU D4(e) NACH G4(de) G4(e) \| SE G4(e) GOL G4 F4 E4 D4 E4 F4 E4 D4 (s) ~D4(q) |
| 27 | זַרְקָא מֻנַּח סֶגוֹל | ZAR D4(e) D4(e) KA D4(de) ~C4(s) B3(s) A3(s) B3(s) A3(e) C5(e) \| MU D4(e) NACH G4(de) G4(e) \| SE G4(e) GOL G4 F4 E4 D4 E4 F4 E4 D4 (s) ~D4(q) |
| 28 | מֻנַּח זַרְקָא סֶגוֹל | MU C4(e) ~D4 D4 D4 \| ZAR D4 KA D4(de) C4 B3 A3 B3 (A3) … C5 \| SE G4 GOL G4 F4 E4 D4 E4 F4 E4 D4 ~D4 |
| 29 | זַרְקָא סֶגוֹל | ZAR D4 D4 KA D4(de) C4 B3 A3 B3 A3 C5 \| SE G4 GOL G4 F4 E4 D4 E4 F4 E4 D4 ~D4 |
| 30 | מֵרְכָא טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ (end of aliyah) | MER D4(t) CHA D4(t) D4(t) \| TIP D4(e) CHA G4 F4 E4 D4 (s) \| (rest) MER D4(e) CHA D4(e) ~E4(q) \| SOF D4(e) PA E4(e) SUK E4(s) D4(s) C4(s) B3(s) ~D4(e) C4(q) |
| 31 | מֵרְכָא טִפְּחָא סוֹף־פָּסוּק׃ (end of aliyah) | MER D4 CHA D4 D4 \| TIP-CHA G4 F4 E4 D4 (s) \| (rest) SOF D4 PA E4 SUK E4 D4 C4 B3 ~D4 C4(q) |
| 32 | טִפְּחָא מֵרְכָא סוֹף־פָּסוּק׃ (end of aliyah) | TIP A4(e) CHA G4 F4 G4 F4 E4 D4 \| (rest) MER E4 CHA D4 ~E4 \| SOF D4 PA E4 SUK E4 D4 C4 B3 ~D4 C4(q) |
| 33 | טִפְּחָא סוֹף־פָּסוּק׃ (end of aliyah) | TIP A4(e) CHA E4(e) ~G4 F4 E4 D4 (s) \| (rest) SOF D4(e) PA E4(e) SUK E4(s) D4(s) C4(s) B3(s) ~D4(e) C4(q) |

### High Holiday figure per mark

These readings feed `data/trope/trope_motifs_hh.json`. As in section A, grace notes are left out
(except yetiv's, below) and a tie becomes one held note. Values are marked only where a note is longer than an eighth —
(q) a quarter, (dq) a dotted quarter or a tie merged into one longer note — because the staff draws
eighths, sixteenths and triplet eighths alike. Shalshelet, mercha kefula, karnei parah and yerach
ben yomo have no row: they never occur in the Rosh Hashanah or Yom Kippur readings.

| Mark (tutor key) | Figure | Chart row |
|---|---|---|
| mercha | D4 D4 | High Holiday #1 |
| tipcha | D4 G4 D4(q) | High Holiday #4 |
| munach (before etnachta) | D4 C4 | High Holiday #2 |
| etnachta | C4 C4 F4 E4 D4(q) | High Holiday #4 |
| sof_pasuk | B3 B3 B3 D4 C4(dq) | High Holiday #8 |
| mahpach | G4 G4 D4 C4 | High Holiday #11 |
| pashta | D4 A4 G4 | High Holiday #10 |
| yetiv | A4 A4 G4 | High Holiday #24 |
| zakef_katon | G4 G4 D4(dq) | High Holiday #10 |
| zakef_gadol | D4 D4 D4 A4 G4 F4 E4 F4 E4 D4(q) | High Holiday #25 |
| zarka | D4 D4 D4 C4 B3 A3 B3 A3 G3(q) | High Holiday #29 |
| segol | G4 G4 G4 F4 E4 D4 E4 F4 E4 D4(q) | High Holiday #29 |
| revia | G4 G4 G4 F4 E4 D4 E4 D4 C4(q) | High Holiday #16 |
| darga | D4 A4 G4 F4 E4 D4(dq) | High Holiday #13 |
| tevir | D4 D4 C4 D4 F4 E4 D4(q) | High Holiday #13 |
| kadma | D4 G4 | High Holiday #20 |
| geresh | B♭4 A4 G4 A4 G4(q) | High Holiday #21 |
| gershayim | D4 D4 D4 E4 F4 C4 G4(dq) | High Holiday #22 |
| telisha_ketana | D4 D4 D4 D4 G4 F4 G4 D4(dq) | High Holiday #18 |
| telisha_gedola | D4 D4 D4 D4 D4 E4 F4 G4 F4 E4 D4(q) | High Holiday #17 |
| pazer | D4 D4 E4 F4 G4 A4 B♭4 A4 G4 F4 E4 D4 G4 E4 D4(q) | High Holiday #19 |

- Yetiv's Y′ and the munach before the telishas each sing their first syllable on a small grace
  note. Yetiv's sits on A4, the pitch of the note after it, and the tutor draws it as a full eighth
  so the syllable has its own note on the staff and in the tune (the munach before the telishas is
  not a tutor figure).
- Zakef gadol opens with a triplet (ZA-KEF-GA) and, like pazer, accents its last three notes. Zarka
  ends on G3 below two ledger lines, the lowest note in either chart.
- Azla, the second word of kadma v'azla (row 20), sings the geresh figure, as in the Torah chart.

**First-pass slips the figure reading corrected** (the phrase table above still shows the first
pass):

- Sof pasuk (rows 5–8): three B3s, not four — SOF B3, PA B3, SUK B3 ~D4 C4, the C4 tied into the
  closing quarter (row 8).
- Mahpach and pashta (rows 9–12): mahpach is G4 G4 D4 C4, and the D4 the first pass gave
  mahpach's end is pashta's first note (pashta D4 A4 G4; rows 10–11).
- Darga and tevir (row 13): darga's closing D4 is a quarter tied to an eighth, and T′ is a D4
  eighth of its own, so tevir opens D4 D4.
- Munach before the telishas (rows 17–18): MU is a grace note and NACH is E4 ~D4, then an eighth
  rest; telisha gedola's LA starts on a fifth D4 before its run up to G4 (row 17).
- Gershayim (row 22): the fourth note of YIM's run is C4 (the print draws C4 with no ledger line
  throughout).
- Yetiv (rows 23–24): Y′ is a grace note on A4 (measured against the staff lines; it sits in the
  same space as the note after it) and TIV is A4 ~G4 in two slurred eighths, then an eighth rest —
  not C5 A4 E4.
- Zarka (rows 26–29): the "C5" after the melisma is an eighth rest; the run is D4 C4 B3 A3 (s),
  B3 A3, and it ends on G3 (q) (row 29).
- Segol (rows 26–29): SE is a sixteenth G4, and GOL repeats G4 before its run — G4, then
  G4 F4 E4 D4 (s), E4 (e), F4 E4 D4 (s, triplet) tied into the closing D4 (row 29).

## D. What the chart teaches beyond single marks

- **The connecting marks change shape with the pause they lead into.** Munach is E4 D4–B3
  before etnachta (rows 1–2), F♯4 then F♯4–E4–F♯4 before zakef katon (9–12), A4 then A4–F♯4–A4
  before mahpach and darga (14, 27), E4 then A4–F♯4 before revia (17–18), D4 then F♯4–E4 before
  the telishas and pazer (28–30), G♮4 then F♯4–E4 before zarka (34–35), a held A3 then D4–D4
  before segol (34, 36), and the munach legarmeh of row 17 is its own six-note figure. Mercha is
  C♯4–E4 before tipcha but F♯4 then A4–E4 before tevir (24, 26). Kadma is A3–D4 in kadma v'azla
  but D4–F♯4 before mahpach, darga and mercha (9, 25, 26). Tipcha's opening E4 is an eighth when it
  starts a phrase and a sixteenth after a mercha's dotted eighth.
- **Azla is the geresh melody.** The four-note tail of kadma v'azla (row 15) is note for note the
  geresh of row 16, which is why the tutor's Sephardi name for kadma is Azla and the card note
  says kadma "leads straight into a geresh".
- **The last verse of an aliyah has its own sof pasuk** (row 41; High Holiday rows 30–33): a
  higher, longer formula that the tutor's sof pasuk card does not show.
- **The lowered seventh is part of the mode.** Every run that touches the seventh degree flattens
  it (G♮ in A major, B♭ in the High Holiday set), so the melody is Mixolydian on those notes even
  though the signature says major.
- **Ornaments are notated, not improvised:** grace notes open zarka and the telishas, triplets
  sit inside tevir, gershayim, karnei parah, munach-revia and the end-of-aliyah mercha, and
  accents mark the peak of pazer, zakef gadol, zarka, shalshelet and karnei parah.
- **The chart's own order is a teaching order:** the etnachta clause (1–4), the sof pasuk clause
  (5–8), the zakef katon clause (9–14), the geresh group (15–21), the tevir group (22–27), the
  telishas and pazer (28–30), zakef gadol and yetiv (31–33), the segol clause (34–37), the rare
  marks (38–40) and the closing formula (41).

## E. How the tutor uses this

- Every entry in `data/trope/trope_motifs.json` is `verified: true` and carries
  `source: "tropepatterns.md Torah #N"`, pointing at the row in section A. The builder
  (`scripts/build-trope-motifs.mjs`) copies verified entries through untouched; only `--force`
  would replace them with machine drafts.
- The file's top-level `key: "A"` tells the Learn-card staff to draw three sharps and to spell
  in-key notes without accidentals, so a natural sign appears only where the chart prints one.
- Rhythm is reduced to the staff's four values (`d` 1–4); a dotted eighth and a triplet eighth
  both draw as an eighth. Grace notes are not drawn, except the High Holiday yetiv's, which carries
  the syllable Y′ and is drawn as a full eighth. Shalshelet, karnei parah and telisha gedola
  keep their full length (up to sixteen notes), so those staffs widen.
- To re-verify an entry: read its row in section A, convert with the `p` scale above (A4 = −2,
  each semitone down is −1), and compare with the JSON; the card's play button plays the staff as
  tones, lighting each note, so the tune can be checked by ear.
- The High Holiday figures (section C) live in `data/trope/trope_motifs_hh.json`
  (`system: "highholiday"`, `key: "C"`: no signature, and B♭ drawn as a flat), each entry
  `verified: true` with `source: "tropepatterns.md High Holiday #N"`. The builder never reads or
  writes that file (there are no High Holiday recordings to draft from), so it is edited by hand.
  The tutor draws it when Settings → Melody is *High Holidays*; the four marks it lacks say so on
  their cards.

## F. Ideas this chart suggests

1. Opening the tutor from the Torah Trainer's Rosh Hashanah and Yom Kippur readings with the High
   Holiday melody already chosen (the melody setting itself is built).
2. A phrases tab: the 41 rows above as playable, printable lines grouped by clause, with the
   Hebrew phrase and mark chips.
3. A "what comes next" drill: a phrase with one mark hidden, or the marks of a phrase to put in
   order.
4. Context variants on the Learn card: munach's shapes and the tevir-context mercha and kadma,
   each with the phrase they belong to.
5. A key control for the tune button, so a teacher can move the tones into a student's range
   (the Settings speed slider already sets its tempo).
6. Teaching the end-of-aliyah sof pasuk, on the card and as a highlight of an aliyah's last verse
   in the Torah Trainer.
7. A munach legarmeh card.
8. A one-sheet phrase chart to print in the teacher's chosen key.
