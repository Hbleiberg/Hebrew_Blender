# Phonotactic filter specification for a Modern Israeli Hebrew CV/CVC decoder generator

## Executive summary

Modern Israeli Hebrew (MIH) is phonotactically very permissive at the single-syllable level, and most orthographic distinctions inherited from Tiberian grammar either collapse or become stylistic in MIH. A principled filter for your *Chaverim Ba'Ivrit* decoder must therefore reject only a small, well-defined set of sequences: **(1) letter+shva as a standalone syllable (no vowel nucleus), (2) sofit letters outside final position, (3) matres lectionis (וֹ, וּ) treated as consonants, (4) a nikud on a mater, and (5) non-sofit forms of מנצפ"ך in word-final position.** At the CVCV/CVCVC/CVCVCV depth, only sofit placement, matres placement, and a narrow list of impossible word-initial clusters (when shva-na elision would create them) add further filtering. Crucially, identical-consonant sequences (/dada/, /mama/, /lala/), dagesh-qal distribution (בּ vs. ב, etc.), and root-tier OCP effects are **not** filter-worthy — they produce pronounceable syllables. The rule set below follows Asherov & Bat-El (2019), Bolozky (1978, 1997, 2006, 2013), Bat-El (1989, 2002, 2006), Schwarzwald (2001, 2005, 2013), and the Academy of the Hebrew Language's rulings on shva, matres, and sofit.

---

## 1. Rule taxonomy

Each rule below is stated as a filter predicate. "INCLUDE" means reject the generator output; the "EXCLUDES" note shows what the rule deliberately does **not** capture so that pronounceable syllables are not over-filtered.

### Rule N1 — Shva is not a syllable nucleus

**Statement.** In MIH, the syllable nucleus must be a full vowel (/a, e, i, o, u/); syllabic consonants are prohibited. A consonant bearing only shva does not constitute a syllable.

**Source.** Asherov & Bat-El (2019: 71) "the nucleus in Hebrew is always a vowel, i.e., syllabic consonants are prohibited"; Academy of the Hebrew Language, "עיקרי תורת הניקוד" ("שווא נע הוא מעין תנועה קצרה, חצי תנועה... בהגייה כיום לעיתים גם השווא הנע נהגה כאפס תנועה"); Bolozky (1997, 2013 *EHLL*).

**Example.** בְ (bet + shva) alone is not a pronounceable CV syllable; nor is לְ alone, nor מְ alone. In connected text, shva either closes a syllable silently (shva nach) or triggers an epenthetic [e] before a phonotactically illicit cluster.

**Excludes.** This rule does **not** exclude shva appearing *as the nikud under C3 of a CVC* (= shva nach, silent coda-closer) in multisyllabic output. It also does not exclude chataf-vowels conceptually, though chatafs are not in the generator inventory.

### Rule N2 — Sofit letters occur only word-finally

**Statement.** The five mantzepach forms — ך, ם, ן, ף, ץ — are orthographic variants restricted to word-final position. They cannot appear as C1 of a CV, C1 of a CVC, or any non-final consonant of CVCV/CVCVC/CVCVCV.

**Source.** Talmud Shabbat 104a (origin of the מנצפ"ך set); Academy of the Hebrew Language, *Kelalei haketiv hasar haniqud* (1996, revised); Schwarzwald (2001); Bolozky (2013 *EHLL*, vol. 3: 112–122).

**Example.** ךָ as a first letter is orthographically impossible. ם as a medial consonant is impossible. A sofit may legitimately appear as C3 of a CVC token, and ך may carry its own vowel there (e.g., לְךָ).

**Excludes.** This is not a sound rule — the phoneme produced is identical for sofit and non-sofit. The exclusion is purely graphemic and positional, but it *does* render the string non-realizable as a Hebrew word form.

### Rule N3 — Non-sofit forms must convert to sofit word-finally

**Statement.** When כ, מ, נ, פ, or צ occupies the final C of a word (C3 of a CVC token, or the last C of a CVCVC/CVCV that ends in a consonant), the sofit form is mandatory in standard MIH orthography.

**Source.** Academy of the Hebrew Language, *Kelalei haketiv*; Schwarzwald (2013 *EHLL*); Bolozky (2013 *EHLL*).

**Example.** דַכ (dalet-kamatz-chaf non-sofit) as a complete word is orthographically ill-formed; required form is דַךְ.

**Excludes.** This rule does not apply when the letter is non-final in the larger sequence. In a CVCVC, the C3 slot is medial, so the non-sofit form is required there, not the sofit form.

### Rule N4 — Matres lectionis וֹ and וּ are vowels, not consonants

**Statement.** The graphemes וֹ (vav+cholam dot = holam male = /o/) and וּ (vav+shuruk dot = shuruk = /u/) are vowel letters. They cannot (a) serve as a consonantal onset, (b) be marked with an additional nikud, or (c) serve as a coda C3 in a single closed syllable.

**Source.** Academy of the Hebrew Language, *Kelalei haketiv hasar haniqud* (explicit holam-male and shuruk rules); Schwarzwald (2001 *Modern Hebrew*, chapter on orthography); Webster, *Cambridge Introduction to Biblical Hebrew*, ch. on matres lectionis. The shuruk dot is graphically identical to dagesh but phonologically a vowel marker, not a consonant diacritic.

**Example.** וֹ + kamatz is impossible (two vowels stacked on one nucleus). וּ as the opening letter of a CV is impossible (no consonantal onset to read). בוֹ + segol stacked on the mater is impossible.

**Excludes.** Bare ו (without cholam/shuruk dots) **is** a consonant (/v/) and can freely carry any nikud — /va/, /ve/, /vi/, /vo/, /vu/ are all valid CVs. The filter targets only the dotted composites וֹ and וּ.

### Rule N5 — Dagesh-qal distribution is NOT a pronounceability constraint

**Statement.** In classical Hebrew, בּ/ב, כּ/כ, פּ/פ alternated allophonically based on preceding syllable structure. In MIH these are phonemicized (/b/~/v/, /k/~/χ/, /p/~/f/ are independent phonemes with minimal pairs). A CV or CVC token with either member is fully pronounceable.

**Source.** Bolozky (1997) "Israeli Hebrew Phonology" *in* Kaye (ed.); Bat-El (1989); Schwarzwald (2001). Minimal pairs *sibá* 'cause' ~ *sivá* 'he caused' establish phonemic status.

**Example.** Both בָּ and בָ are valid, pronounceable CVs. The generator should emit both. Likewise for כָּ/כָ and פָּ/פָ.

**Excludes.** This rule is stated to prevent over-filtering. It means the educator should **not** reject a form because the dagesh would be prescriptively disallowed in that position by Tiberian rules.

### Rule N6 — Dagesh chazak (gemination) is phonetically lost in MIH

**Statement.** Classical gemination does not surface as lengthening in MIH. Consequently, the classical ban on dagesh chazak in gutturals (א, ה, ח, ע) and ר has no active pronounceability role. Identical consonants separated by a vowel are *not* geminates and are fully pronounceable.

**Source.** Bat-El (1989, 2006 *LI* 37: 179–210); Bolozky, "Surface Geminates in Israeli Hebrew"; Schwarzwald (2001); Wikipedia "Dagesh" summary of Academy rulings. The only audible residue is the stop/fricative choice on בּ/כּ/פּ.

**Example.** /dada/, /mama/, /lala/, /baba/ are all pronounceable CVCV sequences despite the "gemination" on the root tier.

**Excludes.** This rule specifically rejects the misapplication of OCP or antigemination to CVCV surface forms. It also prevents flagging C2=C3 in a CVC as impossible.

### Rule N7 — OCP is a root-level constraint, not a surface filter

**Statement.** Hebrew's ban on C1=C2 in triliteral roots (McCarthy 1981, 1986) is a morphological constraint on the consonantal root tier. It does not filter surface wordforms and does not apply to pedagogical decoding syllables.

**Source.** McCarthy (1981, 1986); Greenberg (1950); Bat-El (2002, 2006 *LI* 37); Bolozky (1997); Yeverechyahu (2019 *BJALL* 11(1)). Reduplicative patterns (*difdef*, *cilcel*, *šikšek*, *kirker*, *zimzem*) overtly violate root-level OCP and are native and productive.

**Example.** /dada/, /gaga/, /susu/, /nini/ are pronounceable and must not be filtered.

**Excludes.** This rule explicitly blocks the naive "identical consonants = impossible" filter.

### Rule N8 — In MIH, א, ה, ע do not surface as codas

**Statement.** Glottal stop /ʔ/ (א, ע) and /h/ (ה) do not appear in coda position in MIH; final orthographic א, ה, ע are silent or function as matres lectionis.

**Source.** Asherov & Bat-El (2019: 72) "the glottal stop (ʔ) and glottal fricative (h) … do not appear in coda position"; Bolozky (1978, 1997); Faust & Enguehard (2018 *LI* 49); Bolozky (2013 *EHLL*).

**Example.** A CVC like בָה, דָא, לָע in MIH is phonetically [ba], [da], [la] — pronounceable, but with C3 silent. This is *not* an impossibility; it is a fact about surface realization.

**Excludes.** **Do not filter** such CVCs; they are pronounceable (as CV). This rule is stated only so the educator knows the C3 is silent; the sequence is still a valid decodable token.

### Rule N9 — Word-initial cluster bans (relevant only when shva-na elides)

**Statement.** If a generator uses shva on C1 of a multisyllabic token such that MIH reading would elide the shva to yield a word-initial CC cluster, the cluster must satisfy MIH onset constraints. The categorical bans are:
- `*#SonC-` (sonorant as C1 of initial cluster): *nl-, *nr-, *ml-, *mr-, *lm-, *ln-, *rm-, *rn-
- `*#CC where C1=C2` (initial geminate): *bb-, *dd-, *mm-, *ss-, *tt-, *kk-
- `*#C + /ʔ/-` (any C before an aleph onset): *tʔ-, *pʔ-, *kʔ-

**Source.** Bolozky (2006) *Hebrew Studies* 47: 227–235; Schwarzwald (2005) in Ravid & Bat-Zeev Shyldkrot eds.; Asherov & Bat-El (2019 *BJALL*); Rosén (1957).

**Example.** A pointed form נְלַבַּשׁ that would elide to *nlabaš* is blocked; MIH inserts /e/: *nelabaš*.

**Excludes.** This rule only fires if the generator permits shva on C1 *and* the downstream reader elides it. For a strictly CV/CVC pedagogical generator with a fixed full-vowel V slot, the rule is dormant.

---

## 2. Exhaustive CV impossibility table (168 combinations, 63 impossible, 105 pronounceable)

The generator's 28 × 6 matrix produces 168 candidate CV tokens. Below is every impossible one, with the violated rule. Combinations not listed are pronounceable.

### 2.1 Sofit letters as C1 — violates Rule N2 (30 impossible)

| C1 | kamatz | segol | chirik | cholam | kubutz | shva |
|----|--------|-------|--------|--------|--------|------|
| ך  | ✗ N2   | ✗ N2  | ✗ N2   | ✗ N2   | ✗ N2   | ✗ N2 |
| ם  | ✗ N2   | ✗ N2  | ✗ N2   | ✗ N2   | ✗ N2   | ✗ N2 |
| ן  | ✗ N2   | ✗ N2  | ✗ N2   | ✗ N2   | ✗ N2   | ✗ N2 |
| ף  | ✗ N2   | ✗ N2  | ✗ N2   | ✗ N2   | ✗ N2   | ✗ N2 |
| ץ  | ✗ N2   | ✗ N2  | ✗ N2   | ✗ N2   | ✗ N2   | ✗ N2 |

### 2.2 Matres וֹ and וּ as C1 — violates Rule N4 (12 impossible)

| C1 | kamatz | segol | chirik | cholam | kubutz | shva |
|----|--------|-------|--------|--------|--------|------|
| וֹ  | ✗ N4   | ✗ N4  | ✗ N4   | ✗ N4   | ✗ N4   | ✗ N4 |
| וּ  | ✗ N4   | ✗ N4  | ✗ N4   | ✗ N4   | ✗ N4   | ✗ N4 |

(Both violations have a dual justification: the letter is not a consonant, AND it already carries its own vowel, so any added nikud is phonologically incoherent.)

### 2.3 All other consonants + shva alone — violates Rule N1 (21 impossible)

| C1  | + shva |
|-----|--------|
| א   | ✗ N1   |
| בּ  | ✗ N1   |
| ב   | ✗ N1   |
| ג   | ✗ N1   |
| ד   | ✗ N1   |
| ה   | ✗ N1   |
| ו   | ✗ N1   |
| ז   | ✗ N1   |
| ח   | ✗ N1   |
| ט   | ✗ N1   |
| י   | ✗ N1   |
| כּ  | ✗ N1   |
| כ   | ✗ N1   |
| ל   | ✗ N1   |
| מ   | ✗ N1   |
| נ   | ✗ N1   |
| ס   | ✗ N1   |
| ע   | ✗ N1   |
| פּ  | ✗ N1   |
| פ   | ✗ N1   |
| צ   | ✗ N1   |
| ק   | ✗ N1   |
| ר   | ✗ N1   |
| ש / שׂ | ✗ N1 each |
| ת   | ✗ N1   |

(Sofit letters with shva and matres with shva are already excluded under N2 and N4; they are not re-counted. Using the 28-consonant inventory, the 21 "other" consonants + shva yields 21 rows.)

### 2.4 Pronounceable CV totals

**Impossible: 63 of 168 (30 sofit + 12 mater + 21 other+shva).**
**Pronounceable: 105 of 168.** These are all combinations of the 21 non-sofit, non-mater consonants with any of the five full vowels (21 × 5 = 105).

Note: The letter ו (bare consonantal vav) + any of the five full vowels is included in the pronounceable 105. The בּ/ב, כּ/כ, פּ/פ pairs each count as two separate consonants in the inventory per Rule N5 and yield 10 pronounceable CVs per pair (all five vowels each side).

---

## 3. Exhaustive CVC impossibility, grouped by rule

The 28 × 6 × 28 space is 4,704 combinations. Rather than enumerating every row, the impossibilities fall into five pattern classes; the union (after removing overlap) is presented as counts plus representative examples.

### 3.1 Class A — C1 is a sofit letter (Rule N2)

**Pattern:** {ך, ם, ן, ף, ץ} × {any V} × {any C3}
**Count:** 5 × 6 × 28 = 840 combinations

*Representative impossibles:* ךָב, ם‍ִ‍ל, ןוֹד, ףַר, ץֻנ.

### 3.2 Class B — C1 is a mater (Rule N4)

**Pattern:** {וֹ, וּ} × {any V} × {any C3}
**Count:** 2 × 6 × 28 = 336 combinations

*Representative impossibles:* וֹ+ָ+ב, וּ+ִ+ל.

### 3.3 Class C — V slot is shva (Rule N1, CVC has no nucleus)

**Pattern:** {any C1} × {shva} × {any C3}
**Count:** 28 × 1 × 28 = 784 combinations

**Important subtraction for overlap with Classes A and B:**
- Overlap with A: 5 × 1 × 28 = 140 (C1 sofit + shva + C3)
- Overlap with B: 2 × 1 × 28 = 56 (C1 mater + shva + C3)

**Unique C-impossibles: 784 − 140 − 56 = 588**

*Representative impossibles:* בְק, דְל, מְר, סְן — in each case no vowel nucleus and nothing in the syllable to license a shva-na reading.

*Conceptual note:* A shva in the V slot of a *standalone* CVC gives a consonant-consonant cluster with no nucleus. It is neither shva na (no downstream syllable to host it) nor shva nach (nothing preceding to close). It is therefore categorically impossible as a single syllable.

### 3.4 Class D — C3 is a non-sofit form of a sofit-requiring letter (Rule N3)

**Pattern:** {any C1} × {any V} × {כ, מ, נ, פ, צ}
**Count:** 28 × 6 × 5 = 840 combinations

**Overlap subtractions:**
- With A: 5 × 6 × 5 = 150
- With B: 2 × 6 × 5 = 60
- With C: 28 × 1 × 5 = 140; minus double-counts already in A∩C = 5 × 1 × 5 = 25 and B∩C = 2 × 1 × 5 = 10, leaving 140 − 25 − 10 = 105

**Unique D-impossibles: 840 − 150 − 60 − 105 = 525**

*Representative impossibles:* בַכ (must be בַךְ), דִמ (must be דִם), לָנ (must be לָן), סֻפ (must be סֻף), רוֹצ (must be רוֹץ).

### 3.5 Class E — C3 is a mater (Rule N4)

**Pattern:** {any C1} × {any V} × {וֹ, וּ}
**Count:** 28 × 6 × 2 = 336 combinations

**Overlap subtractions:**
- With A (C1 sofit): 5 × 6 × 2 = 60
- With B (C1 mater): 2 × 6 × 2 = 24
- With C (V=shva): 28 × 1 × 2 = 56; minus overlaps already counted in A∩C=10, B∩C=4 → 56 − 10 − 4 = 42
- With D: impossible (D requires C3 ∈ {כ,מ,נ,פ,צ}, disjoint from {וֹ, וּ})

**Unique E-impossibles: 336 − 60 − 24 − 42 = 210**

*Representative impossibles:* בַוֹ (mater as coda creates V+V+V), דִוּ, לָוֹ.

### 3.6 CVC totals (with inclusion-exclusion over the 4,704 space)

| Class | Rule | Raw count | Unique after overlap removal |
|-------|------|-----------|------------------------------|
| A     | N2   | 840       | 840                          |
| B     | N4   | 336       | 336                          |
| C     | N1   | 784       | 588                          |
| D     | N3   | 840       | 525                          |
| E     | N4   | 336       | 210                          |
| **Total impossible** | | | **2,499** |

**Pronounceable CVC tokens: 4,704 − 2,499 = 2,205.**

These 2,205 surviving CVCs are the full set the generator should pass to students. They comprise C1 ∈ {21 non-sofit, non-mater consonants} × V ∈ {5 full vowels} × C3 ∈ {23 consonants: all 28 minus וֹ, וּ, כ, מ, נ, פ, צ, plus the 5 sofit forms ך, ם, ן, ף, ץ}, i.e. 21 × 5 × 21 = 2,205. (The 21 valid C3s consist of: א, בּ, ב, ג, ד, ה, ו, ז, ח, ט, י, כּ, ל, ס, ע, פּ, ק, ר, ש, שׂ, ת, plus the five sofits — 21 + 5 = 26; after subtracting the five non-sofit מנצפ"ך forms that already fail N3, exactly 2,205 remain.)

**Pedagogical note on Rule N8 (silent codas א, ה, ע).** CVCs with C3 ∈ {א, ה, ע} are *pronounceable* in MIH — they are read with a silent coda, i.e., phonetically identical to the corresponding CV. They are included in the 2,205 pronounceable set. The teacher may still wish to exclude them from beginner drills because they confuse letter-sound mapping, but they are **not** phonotactically impossible and should not be filtered by the rules above. This distinction is exactly the one the requester flagged: spelling convention versus unpronounceability.

---

## 4. Rules plus representative examples for CVCV, CVCVC, CVCVCV

### 4.1 Constraints at multisyllabic depth

At these depths, four rules remain operative. All other filters from Section 1 either do not apply (N1, N8) or apply with the same force as at CVC (N2, N3, N4).

**MS-1. Sofit positioning (generalization of N2/N3).** Sofit letters may appear only in the *absolute final* C slot. Non-sofit forms of כ, מ, נ, פ, צ may appear only in non-final C slots.

**MS-2. Matres as vowels, not consonants (generalization of N4).** וֹ and וּ may never occupy a C slot and may never carry an additional nikud. Any V slot is filled by one of the five full vowels (kamatz, segol, chirik, cholam, kubutz); at multisyllabic depth, a shva in a medial V position forces rejection (no nucleus) unless the implementation re-interprets the shva as epenthetic [e] — which is outside the strict CVCV/CVCVC/CVCVCV schema.

**MS-3. Every V slot must be a full vowel (generalization of N1).** At these depths a shva would have no legitimate phonological interpretation: it cannot be a nucleus, it cannot be shva nach between two V-slot full vowels, and the generator is not running an epenthesis rule. Reject any output whose V slot is shva.

**MS-4. Initial cluster bans (Rule N9, conservative dormant rule).** Only relevant if a future version of the generator places shva on an onset consonant that would elide. The standard bans apply: `*#SonC-`, `*#CC (identical)`, `*#C + /ʔ/-`, `*#homorganic-stop-stop`.

### 4.2 What is explicitly NOT a filter at these depths

- **Identical consonants across syllables** (/dada/, /mama/, /lala/, /nana/, /susu/) — **pronounceable, do not filter** (Bat-El 2002, 2006; Bolozky 1997).
- **Hebrew-root OCP patterns** — root legality is not a surface phonotactic filter (McCarthy 1986; Bat-El 2006; Yeverechyahu 2019).
- **"Unusual" medial C.C clusters** — MIH is highly permissive medially (Schwarzwald 2005; Bolozky 1978).
- **Silent-coda letters** (C3 ∈ {א, ה, ע}) — pronounceable, just with silent coda (Asherov & Bat-El 2019: 72).
- **Dagesh-qal alternants** in medial position — both members of בּ/ב, כּ/כ, פּ/פ are valid wherever they appear.

### 4.3 Representative impossible examples

**CVCV (5 examples):**
1. ךָבָ — sofit ך in C1 (MS-1 violates).
2. בַםָ — sofit ם in C3 medial position (MS-1).
3. וֹבַ — mater וֹ in C1 (MS-2).
4. בְלָ — shva in first V slot as pedagogical CV-syllable rendering (MS-3, given strict schema).
5. דַוֹ — mater וֹ in C3 medial position (MS-2).

**CVCVC (5 examples):**
1. מַךְדָר — sofit ך in medial C3 (MS-1).
2. דַםָב — sofit ם in medial C3 (MS-1).
3. כַרַכ — non-sofit כ as final C (MS-1 requires ך: כַרַךְ).
4. בַוֹדָר — mater as medial consonant (MS-2).
5. Under shva-na elision pointing: a generated נְלַבַש would read *nlabash* with a banned `#nl-` onset (MS-4; Bolozky 2006).

**CVCVCV (5 examples):**
1. בַךְדָרָה — sofit ך as C3 (non-final) (MS-1).
2. ץַבָדָרָ — sofit ץ as C1 (MS-1).
3. דַוֹמָרָ — mater וֹ in a C slot (MS-2).
4. בָדְלָרָ — shva as V slot between two full-vowel syllables; no legitimate interpretation at this schema depth (MS-3).
5. A generator outputting כַמַנַצ with non-sofit ending fails MS-1; canonical form is כַמַנַץ.

Note the consistent pattern: virtually all multisyllabic "impossibles" are orthographic-positional (sofit/mater misplacement) or V-slot-integrity failures. No purely segmental sequence of MIH phonemes is unpronounceable at these depths. This is the key empirical generalization from Bat-El, Bolozky, and Schwarzwald.

---

## 5. Implementation-ready filter specification

Below is a decision tree plus pseudocode. The pseudocode operates on tokenized input where each position holds either a consonant grapheme (with optional dagesh encoded in the grapheme, e.g., `"BET_DAGESH"` for בּ) or a mater composite (`"VAV_HOLAM"` for וֹ, `"VAV_SHURUK"` for וּ), and each V slot holds one of `{kamatz, segol, chirik, cholam, kubutz, shva, NONE}`.

### 5.1 Decision tree

```
FOR each generator output token of shape [C1, V1, (C2, V2, ...)]:

  STEP 1 — Sofit placement (Rule N2 / MS-1)
    IF any C_i is in {KAF_SOFIT, MEM_SOFIT, NUN_SOFIT, PEH_SOFIT, TZADI_SOFIT}
       AND i != last consonant position:
       REJECT (reason: N2 / MS-1, sofit non-final)

  STEP 2 — Non-sofit requirement in final position (Rule N3 / MS-1)
    IF the last consonant position is the final C of a word form
       AND C_last is in {KAF, MEM, NUN, PEH, TZADI} (non-sofit forms):
       REJECT (reason: N3, must be sofit word-finally)

  STEP 3 — Mater consonant-slot violation (Rule N4 / MS-2)
    IF any C_i is in {VAV_HOLAM, VAV_SHURUK}:
       REJECT (reason: N4 / MS-2, mater used as consonant)

  STEP 4 — Shva as V slot (Rule N1 / MS-3)
    IF this is a standalone CV token AND V1 = shva:
       REJECT (reason: N1, no nucleus)
    IF this is a standalone CVC token AND V1 = shva:
       REJECT (reason: N1, no nucleus)
    IF this is CVCV / CVCVC / CVCVCV AND any V_i = shva:
       REJECT (reason: MS-3, no nucleus in V slot)

  STEP 5 — Silent-coda and dagesh-qal are NOT filter reasons
    DO NOT reject based on:
      - C3 ∈ {ALEPH, HEH, AYIN}    [Rule N8: pronounceable with silent coda]
      - begadkefat dagesh distribution   [Rule N5]
      - identical consonants across syllables   [Rule N6, N7]
      - medial cluster "oddness"   [no rule]

  STEP 6 — (Optional, conditional on future shva-na pointing)
    IF the schema permits shva on any onset consonant AND elision would yield #CC:
       Compute the hypothetical initial cluster C1+C2 after eliding the shva.
       IF C1 is a sonorant (n, m, l, r, ʁ): REJECT (*#SonC-)
       IF C1 == C2 (identical): REJECT (*#CC geminate)
       IF C2 is ALEPH or AYIN: REJECT (*#C+/ʔ/-)
    ELSE: continue.

  OTHERWISE: ACCEPT.
```

### 5.2 Python-style pseudocode

```python
SOFIT = {"KAF_SOFIT", "MEM_SOFIT", "NUN_SOFIT", "PEH_SOFIT", "TZADI_SOFIT"}
NEEDS_SOFIT_AT_END = {"KAF", "MEM", "NUN", "PEH", "TZADI"}
MATRES = {"VAV_HOLAM", "VAV_SHURUK"}
FULL_VOWELS = {"kamatz", "segol", "chirik", "cholam", "kubutz"}
SONORANTS = {"NUN", "MEM", "LAMED", "RESH"}

def is_pronounceable(token):
    """
    token: list like [C1, V1] for CV, [C1, V1, C3] for CVC,
           [C1, V1, C2, V2] for CVCV, etc.
    Returns (accept: bool, reason: str).
    """
    consonants = [token[i] for i in range(0, len(token), 2)]
    vowels     = [token[i] for i in range(1, len(token), 2)]
    n_C = len(consonants)

    # Rule N2 / MS-1: sofit only in final consonant slot
    for i, c in enumerate(consonants):
        if c in SOFIT and i != n_C - 1:
            return False, "N2: sofit in non-final position"

    # Rule N3: non-sofit form in final position where sofit is required
    # (applies only when the token ends with a consonant, i.e. CV-like with
    #  final C, or CVC, CVCVC)
    ends_with_consonant = (len(token) % 2 == 1)
    if ends_with_consonant:
        last = consonants[-1]
        if last in NEEDS_SOFIT_AT_END:
            return False, "N3: non-sofit form in word-final position"

    # Rule N4 / MS-2: matres cannot occupy consonant slots
    for c in consonants:
        if c in MATRES:
            return False, "N4: mater lectionis in consonant slot"

    # Rule N1 / MS-3: shva cannot be a nucleus
    for v in vowels:
        if v == "shva":
            return False, "N1: shva as V slot (no nucleus)"

    # Rule N9 (dormant unless shva-na pointing is added; skipped here)

    # All checks passed
    return True, "accept"
```

### 5.3 Worked filter acceptance count

Applied to the full generator output of the three depths requested:

| Depth | Total combinations | Impossible (rejected) | Pronounceable (accepted) |
|-------|--------------------|-----------------------|--------------------------|
| CV    | 168                | 63                    | 105                      |
| CVC   | 4,704              | 2,499                 | 2,205                    |
| CVCV, CVCVC, CVCVCV | — | (enumeration deferred per specification) | — |

For CV, the 105 pronounceable tokens are the cross product of 21 "true onset" consonants (the 28-letter inventory minus 5 sofits minus 2 matres) with 5 full vowels. For CVC, the 2,205 pronounceable tokens are the product of 21 valid C1s × 5 full vowels × 21 valid C3s (the 28-letter inventory minus 2 matres minus 5 non-sofit forms of sofit-requiring letters, retaining the 5 sofits as eligible C3s).

---

## 6. Design notes and epistemic flags

Three places in the research literature show genuine disagreement that the educator should be aware of:

**Guttural status.** Whether MIH has underlying א/ע/ה in all contexts (Faust & Enguehard 2018) or only variable realization (Bolozky 1997, 2003; Matras & Schiff 2005) is open. The filter above takes the consensus MIH-pedagogical position: treat them as valid onsets (pronounceable, possibly glottal-stop) and as non-codas (silent when written final). This is consistent with the Chaverim Ba'Ivrit curriculum's treatment.

**Shva pronunciation norms.** The Academy of the Hebrew Language has explicitly *declined* to mandate shva-na pronunciation rules, stating only that current MIH speakers realize shva as [e] in five specific environments (before sonorants, before gutturals, on שימוש prepositions, after shva nach, and marginally after long vowels). The filter above treats shva as non-functional in a V slot of a standalone syllable; this is phonotactically correct for pedagogical decoding and does not contradict the Academy.

**OCP and identical consonants.** Experimental work (Berent & Shimron 1997; Berent, Everett & Shimron 2001) shows that native speakers *do* encode root-level C1=C2 avoidance psycholinguistically. This is consistent with — not contradictory to — the claim that surface wordforms with identical consonants are fully pronounceable. The filter correctly does not reject them.

**Key takeaway for the generator design.** The most common mistake in Hebrew-decoder phonotactic filtering is to import classical/Tiberian rules (dagesh-qal distribution, guttural gemination bans, root OCP) that are either morphological, dead, or purely prescriptive in MIH. This filter is deliberately narrow: five rules (N1–N4, applied across depths; N9 held in reserve) cover every genuinely unpronounceable or non-realizable output in the generator's combinatoric space, while letting through every phonotactically legal sequence the student should practice — including pairs like /dada/, /mama/, /babab/, and /koko/ that might look "wrong" to a prescriptivist but are perfectly decodable MIH syllable sequences. That is exactly the space of outputs a *Chaverim Ba'Ivrit* student needs to read.