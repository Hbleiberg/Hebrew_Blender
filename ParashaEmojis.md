# Parasha emojis

One small emoji-style picture for each of the 54 weekly Torah portions, made for the classroom dashboard's
parsha line and the Torah Trainer. Each drawing was chosen from three drafts, the way the suite's holiday and
weather icons were. Each portion's section gives its reading, a one-sentence summary of the parasha, the emoji and
what it shows, why it was chosen, and its markup.

## How the drawings are built

- Each entry is the **inner markup of a 48×48 SVG**. A page wraps it the way `holidayIconFor()` wraps a holiday
  icon: `<span class="hol-ico" aria-hidden="true"><svg viewBox="0 0 48 48" focusable="false">…</svg></span>`.
- The drawings use the holiday icons' style and palette (`docs/reference/shared-components.md` → Holiday icons).
  The outline comes from `.hol-ico svg` (`stroke: var(--hol-line)`, width 2, round caps and joins, `fill: none`)
  and every fill is a `var(--hol-*)` token, so the dark palette applies without a re-render.
- No `id`, `<defs>`, gradient, clip path or `<text>`: a page can show the same icon more than once, and a Hebrew
  letter is drawn as a path, never set in a font.
- Each preview image is `docs/parasha-emojis/<key>.svg`: the same markup with both palettes built in (the dark one
  under `prefers-color-scheme: dark`), so it can be opened on its own.

## All 54 portions

| # | Parasha | Hebrew | Emoji | Drawing |
|--:|---|---|:-:|---|
| 1 | Bereshit | בְּרֵאשִׁית | <img src="docs/parasha-emojis/bereshit.svg" width="28" height="28" alt=""> | The heavens and the earth |
| 2 | Noach | נֹחַ | <img src="docs/parasha-emojis/noach.svg" width="28" height="28" alt=""> | The rainbow |
| 3 | Lech-Lecha | לֶךְ-לְךָ | <img src="docs/parasha-emojis/lechlecha.svg" width="28" height="28" alt=""> | Go! |
| 4 | Vayera | וַיֵּרָא | <img src="docs/parasha-emojis/vayera.svg" width="28" height="28" alt=""> | The ram in the thicket |
| 5 | Chayei Sara | חַיֵּי שָׂרָה | <img src="docs/parasha-emojis/chayeisara.svg" width="28" height="28" alt=""> | Rebecca at the well |
| 6 | Toldot | תּוֹלְדוֹת | <img src="docs/parasha-emojis/toldot.svg" width="28" height="28" alt=""> | The twins |
| 7 | Vayetzei | וַיֵּצֵא | <img src="docs/parasha-emojis/vayetzei.svg" width="28" height="28" alt=""> | Jacob’s ladder |
| 8 | Vayishlach | וַיִּשְׁלַח | <img src="docs/parasha-emojis/vayishlach.svg" width="28" height="28" alt=""> | Making peace |
| 9 | Vayeshev | וַיֵּשֶׁב | <img src="docs/parasha-emojis/vayeshev.svg" width="28" height="28" alt=""> | The coat of many colors |
| 10 | Miketz | מִקֵּץ | <img src="docs/parasha-emojis/miketz.svg" width="28" height="28" alt=""> | The silver goblet in the sack |
| 11 | Vayigash | וַיִּגַּשׁ | <img src="docs/parasha-emojis/vayigash.svg" width="28" height="28" alt=""> | Down to Egypt |
| 12 | Vayechi | וַיְחִי | <img src="docs/parasha-emojis/vayechi.svg" width="28" height="28" alt=""> | Crossed hands of blessing |
| 13 | Shemot | שְׁמוֹת | <img src="docs/parasha-emojis/shemot.svg" width="28" height="28" alt=""> | The basket in the reeds |
| 14 | Va'eira | וָאֵרָא | <img src="docs/parasha-emojis/vaeira.svg" width="28" height="28" alt=""> | The Nile turned to blood |
| 15 | Bo | בֹּא | <img src="docs/parasha-emojis/bo.svg" width="28" height="28" alt=""> | The marked doorway |
| 16 | Beshalach | בְּשַׁלַּח | <img src="docs/parasha-emojis/beshalach.svg" width="28" height="28" alt=""> | The split sea |
| 17 | Yitro | יִתְרוֹ | <img src="docs/parasha-emojis/yitro.svg" width="28" height="28" alt=""> | The Ten Commandments |
| 18 | Mishpatim | מִשְׁפָּטִים | <img src="docs/parasha-emojis/mishpatim.svg" width="28" height="28" alt=""> | Help with the load |
| 19 | Terumah | תְּרוּמָה | <img src="docs/parasha-emojis/terumah.svg" width="28" height="28" alt=""> | The Ark of the Covenant |
| 20 | Tetzaveh | תְּצַוֶּה | <img src="docs/parasha-emojis/tetzaveh.svg" width="28" height="28" alt=""> | The breastplate |
| 21 | Ki Tisa | כִּי תִשָּׂא | <img src="docs/parasha-emojis/kitisa.svg" width="28" height="28" alt=""> | The golden calf |
| 22 | Vayakhel | וַיַּקְהֵל | <img src="docs/parasha-emojis/vayakhel.svg" width="28" height="28" alt=""> | Shabbat candles |
| 23 | Pekudei | פְקוּדֵי | <img src="docs/parasha-emojis/pekudei.svg" width="28" height="28" alt=""> | Cloud by day, fire by night |
| 24 | Vayikra | וַיִּקְרָא | <img src="docs/parasha-emojis/vayikra.svg" width="28" height="28" alt=""> | The flour offering |
| 25 | Tzav | צַו | <img src="docs/parasha-emojis/tzav.svg" width="28" height="28" alt=""> | The fire that never goes out |
| 26 | Shemini | שְׁמִינִי | <img src="docs/parasha-emojis/shemini.svg" width="28" height="28" alt=""> | Fire from heaven |
| 27 | Tazria | תַזְרִיעַ | <img src="docs/parasha-emojis/tazria.svg" width="28" height="28" alt=""> | A new baby |
| 28 | Metzora | מְצֹרָע | <img src="docs/parasha-emojis/metzora.svg" width="28" height="28" alt=""> | Cedar, hyssop and red thread |
| 29 | Achrei Mot | אַחֲרֵי מוֹת | <img src="docs/parasha-emojis/achreimot.svg" width="28" height="28" alt=""> | White linen clothes |
| 30 | Kedoshim | קְדֹשִׁים | <img src="docs/parasha-emojis/kedoshim.svg" width="28" height="28" alt=""> | The corner of the field |
| 31 | Emor | אֱמֹר | <img src="docs/parasha-emojis/emor.svg" width="28" height="28" alt=""> | The four species |
| 32 | Behar | בְּהַר | <img src="docs/parasha-emojis/behar.svg" width="28" height="28" alt=""> | The land rests |
| 33 | Bechukotai | בְּחֻקֹּתַי | <img src="docs/parasha-emojis/bechukotai.svg" width="28" height="28" alt=""> | Grapes and wheat |
| 34 | Bamidbar | בְּמִדְבַּר | <img src="docs/parasha-emojis/bamidbar.svg" width="28" height="28" alt=""> | In the wilderness |
| 35 | Nasso | נָשֹׂא | <img src="docs/parasha-emojis/nasso.svg" width="28" height="28" alt=""> | The Priestly Blessing |
| 36 | Beha'alotcha | בְּהַעֲלֹתְךָ | <img src="docs/parasha-emojis/behaalotcha.svg" width="28" height="28" alt=""> | The quail |
| 37 | Sh'lach | שְׁלַח לְךָ | <img src="docs/parasha-emojis/shlach.svg" width="28" height="28" alt=""> | Milk and honey |
| 38 | Korach | קֹרַח | <img src="docs/parasha-emojis/korach.svg" width="28" height="28" alt=""> | The ground opens |
| 39 | Chukat | חֻקַּת | <img src="docs/parasha-emojis/chukat.svg" width="28" height="28" alt=""> | Water from the rock |
| 40 | Balak | בָּלָק | <img src="docs/parasha-emojis/balak.svg" width="28" height="28" alt=""> | How good are your tents |
| 41 | Pinchas | פִּינְחָס | <img src="docs/parasha-emojis/pinchas.svg" width="28" height="28" alt=""> | Passing the staff to Joshua |
| 42 | Matot | מַטּוֹת | <img src="docs/parasha-emojis/matot.svg" width="28" height="28" alt=""> | Purifying vessels |
| 43 | Masei | מַסְעֵי | <img src="docs/parasha-emojis/masei.svg" width="28" height="28" alt=""> | The journeys |
| 44 | Devarim | דְּבָרִים | <img src="docs/parasha-emojis/devarim.svg" width="28" height="28" alt=""> | At the edge of the land |
| 45 | Va'etchanan | וָאֶתְחַנַּן | <img src="docs/parasha-emojis/vaetchanan.svg" width="28" height="28" alt=""> | The mezuzah |
| 46 | Eikev | עֵקֶב | <img src="docs/parasha-emojis/eikev.svg" width="28" height="28" alt=""> | The seven species |
| 47 | Re'eh | רְאֵה | <img src="docs/parasha-emojis/reeh.svg" width="28" height="28" alt=""> | Open your hand |
| 48 | Shoftim | שֹׁפְטִים | <img src="docs/parasha-emojis/shoftim.svg" width="28" height="28" alt=""> | Justice, justice |
| 49 | Ki Teitzei | כִּי-תֵצֵא | <img src="docs/parasha-emojis/kiteitzei.svg" width="28" height="28" alt=""> | A railing for your roof |
| 50 | Ki Tavo | כִּי-תָבוֹא | <img src="docs/parasha-emojis/kitavo.svg" width="28" height="28" alt=""> | The first-fruits basket |
| 51 | Nitzavim | נִצָּבִים | <img src="docs/parasha-emojis/nitzavim.svg" width="28" height="28" alt=""> | Returning |
| 52 | Vayeilech | וַיֵּלֶךְ | <img src="docs/parasha-emojis/vayeilech.svg" width="28" height="28" alt=""> | A quill writing the Torah |
| 53 | Ha'azinu | הַאֲזִינוּ | <img src="docs/parasha-emojis/haazinu.svg" width="28" height="28" alt=""> | The song of Moses |
| 54 | V'Zot HaBerachah | וְזֹאת הַבְּרָכָה | <img src="docs/parasha-emojis/vzothaberachah.svg" width="28" height="28" alt=""> | The Simchat Torah flag |

## Genesis

### 1. Bereshit · בְּרֵאשִׁית

<img src="docs/parasha-emojis/bereshit.svg" width="96" height="96" alt="The earth with the sun, the moon and stars">

**Reading:** Genesis 1:1–6:8

**Summary:** God creates the world in six days and rests on the seventh, Adam and Eve eat the forbidden fruit and
must leave the Garden of Eden, Cain kills his brother Abel, and by the tenth generation only Noah finds favor in
God’s eyes.

**Emoji: The heavens and the earth.** The newly made world, with the sun, moon and stars set in the sky (Genesis
1:1–19).

**Why this emoji:** Bereshit opens with the creation of the world, and its first verse, “In the beginning God
created the heavens and the earth,” is exactly what the globe, sun, moon and stars show; one picture covers the
whole first week of creation.

```html
<path d="M44 10 L46 10 M42.1 14.5 L43.5 15.9 M37.6 16.4 L37.6 18.4 M33.1 14.5 L31.7 15.9 M31.2 10 L29.2 10 M33.1 5.5 L31.7 4.1 M37.6 3.6 L37.6 1.6 M42.1 5.5 L43.5 4.1" stroke-width="2"/><circle cx="37.6" cy="10" r="4.5" fill="var(--hol-flame)"/><path d="M8.6 3.8 A5.2 5.2 0 1 0 13.7 10.7 A4.3 4.3 0 0 1 8.6 3.8Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><circle cx="20" cy="29" r="14" fill="var(--hol-blue)" stroke="none"/><path d="M11.4 40 A14 14 0 0 1 9.6 19.6 C12.6 18 16.6 18.6 17.2 21.4 C17.8 24.2 14.4 25 15 27.6 C15.6 30.2 18.6 30.6 18.2 33.6 C17.8 36.6 14.4 37.6 11.4 40Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M25.2 16 A14 14 0 0 1 26.6 41.4 C25.4 39.6 24 36.6 25.6 34.2 C27.2 31.8 30.4 32.2 30.2 29.2 C30 26.2 25.8 26.6 25 23.6 C24.2 20.6 25.6 16.4 25.2 16Z" fill="var(--hol-green)" stroke-width="1.4"/><circle cx="20" cy="29" r="14"/><path d="M23 3.4 Q23.7 5.7 26 6.4 Q23.7 7.1 23 9.4 Q22.3 7.1 20 6.4 Q22.3 5.7 23 3.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41.6 24.5 Q42.2 26.8 44.5 27.4 Q42.2 28 41.6 30.3 Q41 28 38.7 27.4 Q41 26.8 41.6 24.5Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 2. Noach · נֹחַ

<img src="docs/parasha-emojis/noach.svg" width="96" height="96" alt="A rainbow between two clouds">

**Reading:** Genesis 6:9–11:32

**Summary:** Noah builds an ark that carries his family and the animals through the Flood, a dove brings back an
olive leaf, God sets a rainbow in the clouds as a promise never to flood the world again, and the builders of the
Tower of Babel are scattered.

**Emoji: The rainbow.** The rainbow God sets in the clouds as a sign of the promise never to flood the world
again (Genesis 9:12–17).

**Why this emoji:** The rainbow is the sign of God’s promise after the Flood, so it carries the whole story of
the ark and ends it with hope, and it is the picture children connect most with Noah.

```html
<path d="M5 33.6 A19 19 0 0 1 43 33.6 L40.1 33.6 A16.1 16.1 0 0 0 8 33.6Z" fill="var(--hol-red)" stroke="none"/><path d="M8 33.6 A16.1 16.1 0 0 1 40.1 33.6 L37.1 33.6 A13.1 13.1 0 0 0 10.9 33.6Z" fill="var(--hol-flame)" stroke="none"/><path d="M10.9 33.6 A13.1 13.1 0 0 1 37.1 33.6 L34.2 33.6 A10.1 10.1 0 0 0 13.9 33.6Z" fill="var(--hol-green)" stroke="none"/><path d="M13.9 33.6 A10.1 10.1 0 0 1 34.2 33.6 L31.2 33.6 A7.2 7.2 0 0 0 16.8 33.6Z" fill="var(--hol-blue)" stroke="none"/><path d="M5 33.6 A19 19 0 0 1 43 33.6 M16.8 33.6 A7.2 7.2 0 0 1 31.2 33.6"/><path d="M6.5 37.4 A3.4 3.4 0 0 1 6.7 30.8 A4.6 4.6 0 0 1 15.5 30.8 A3.4 3.4 0 0 1 16.2 37.4Z" fill="var(--hol-paper)"/><path d="M31.8 37.4 A3.4 3.4 0 0 1 32.5 30.8 A4.6 4.6 0 0 1 41.3 30.8 A3.4 3.4 0 0 1 41.5 37.4Z" fill="var(--hol-paper)"/><path d="M7 7.4 Q7.7 9.7 10 10.4 Q7.7 11.1 7 13.4 Q6.3 11.1 4 10.4 Q6.3 9.7 7 7.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41 7.4 Q41.7 9.7 44 10.4 Q41.7 11.1 41 13.4 Q40.3 11.1 38 10.4 Q40.3 9.7 41 7.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 3. Lech-Lecha · לֶךְ-לְךָ

<img src="docs/parasha-emojis/lechlecha.svg" width="96" height="96" alt="Two footprints walking forward">

**Reading:** Genesis 12:1–17:27

**Summary:** God tells Abram to leave his land and his father’s house and go to Canaan, promises him children as
many as the stars, and makes a covenant with him, changing his name to Abraham.

**Emoji: Go!** Footsteps setting out, as God tells Abram: לֶךְ לְךָ, go from your land (Genesis 12:1).

**Why this emoji:** The parasha is named for God’s first words to Abram, “Lech lecha, go,” and the footprints
show that journey away from home to a new land, the act of faith that begins the story of the Jewish people.

```html
<path d="M7.1 38.8 C4.5 37 5.2 34.4 6.9 32.2 C8.6 30 9.1 27.5 10.4 25.2 C12.1 22.4 15.1 22 17.5 23.7 C20.2 25.6 20.5 28.7 18.5 30.9 C16.8 32.8 14.2 32.8 12.7 35.3 C11 38 9.6 40.6 7.1 38.8Z" fill="var(--hol-gold-lt)"/><circle cx="21.8" cy="22.6" r="2.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="19.3" cy="19.9" r="1.7" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="16.6" cy="18.9" r="1.5" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="13.8" cy="19.1" r="1.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M25.6 29.8 C28.2 31.6 30.4 30 31.9 27.7 C33.4 25.4 35.6 24 37.2 22 C39.4 19.5 38.7 16.6 36.3 14.9 C33.6 13 30.6 13.8 29.2 16.4 C27.9 18.7 28.8 21.1 27 23.4 C25 25.8 23 28 25.6 29.8Z" fill="var(--hol-gold-lt)"/><circle cx="35.8" cy="10.5" r="2.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="39.2" cy="11.8" r="1.7" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="41" cy="14" r="1.5" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="41.8" cy="16.7" r="1.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/>
```

### 4. Vayera · וַיֵּרָא

<img src="docs/parasha-emojis/vayera.svg" width="96" height="96" alt="A ram’s head in a green bush">

**Reading:** Genesis 18:1–22:24

**Summary:** Abraham welcomes three visitors who promise that Sarah will have a son, Sodom is destroyed, Isaac is
born, and Abraham’s faith is tested at the binding of Isaac, where a ram is offered in Isaac’s place.

**Emoji: The ram in the thicket.** The ram caught by its horns in a bush, offered in Isaac’s place (Genesis
22:13).

**Why this emoji:** The binding of Isaac is the high point of the parasha and is read on the second day of Rosh
Hashanah; the ram caught by its horns shows the moment Isaac is spared, so the picture tells the story gently,
and its horns recall the shofar.

```html
<path d="M19.6 16 C17 10.4 11.4 9 8.6 12.6 C5.8 16.2 7.6 21.8 11.6 22 C14.8 22.2 15.6 18.2 13.2 17 M28.4 16 C31 10.4 36.6 9 39.4 12.6 C42.2 16.2 40.4 21.8 36.4 22 C33.2 22.2 32.4 18.2 34.8 17" stroke-width="6"/><path d="M19.6 16 C17 10.4 11.4 9 8.6 12.6 C5.8 16.2 7.6 21.8 11.6 22 C14.8 22.2 15.6 18.2 13.2 17 M28.4 16 C31 10.4 36.6 9 39.4 12.6 C42.2 16.2 40.4 21.8 36.4 22 C33.2 22.2 32.4 18.2 34.8 17" stroke="var(--hol-gold)" stroke-width="3.6"/><path d="M4.4 28.4 C3.4 25 5.2 21.6 8.6 22.2 C9.2 19 13 18.2 15 20.6 C16.6 19.4 18.8 20 19.4 21.8 H28.6 C29.2 20 31.4 19.4 33 20.6 C35 18.2 38.8 19 39.4 22.2 C42.8 21.6 44.6 25 43.6 28.4 C44.8 31 43.8 34.4 40.6 34.6 C39.4 38 34.6 38.6 32.6 36 H15.4 C13.4 38.6 8.6 38 7.4 34.6 C4.2 34.4 3.2 31 4.4 28.4Z" fill="var(--hol-green)"/><path d="M18 22.8 C15.4 21.8 12.2 22.8 11.2 24.8 C13.6 26 16.6 25.6 18.4 24.8Z M30 22.8 C32.6 21.8 35.8 22.8 36.8 24.8 C34.4 26 31.4 25.6 29.6 24.8Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M17.2 20.4 C17.2 16 20.4 14 24 14 C27.6 14 30.8 16 30.8 20.4 C30.8 26 29.4 31.6 28.4 35.4 C27.8 37.8 26.2 39.2 24 39.2 C21.8 39.2 20.2 37.8 19.6 35.4 C18.6 31.6 17.2 26 17.2 20.4Z" fill="var(--hol-gold-lt)"/><path d="M17.6 19.6 C15.6 17.8 16.4 14.2 19.2 14 C19.4 11.2 22.6 10 24.4 11.4 C26.2 10 29.4 11 29.4 13.8 C32.2 14 32.8 17.8 30.4 19.6 C28.2 18 20 18 17.6 19.6Z" fill="var(--hol-paper)"/><path d="M19.6 25.2 a1.5 1.5 0 1 0 2.9 0 a1.5 1.5 0 1 0 -2.9 0 M25.6 25.2 a1.5 1.5 0 1 0 2.9 0 a1.5 1.5 0 1 0 -2.9 0" fill="var(--hol-navy)" stroke="none"/><path d="M17.9 29 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M27.1 29 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0" fill="var(--hol-flame)" stroke="none"/><path d="M22.4 33 Q24 34 25.6 33 M24 33.6 V37.8 M24 35.2 Q22.6 36.6 21.4 35.8 M24 35.2 Q25.4 36.6 26.6 35.8" stroke="var(--hol-navy)" stroke-width="1.4"/>
```

### 5. Chayei Sara · חַיֵּי שָׂרָה

<img src="docs/parasha-emojis/chayeisara.svg" width="96" height="96" alt="A stone well with a water jar">

**Reading:** Genesis 23:1–25:18

**Summary:** After Sarah dies, Abraham buys the Cave of Machpelah in Hebron to bury her, and his servant finds
Rebecca at the well, where her kindness to his camels shows she is the right wife for Isaac.

**Emoji: Rebecca at the well.** The well and Rebecca’s water jar (Genesis 24:15–20).

**Why this emoji:** The longest story in the parasha is the search for a wife for Isaac, and it turns on the
well, where Rebecca’s kindness in drawing water for the servant and all his camels shows who she is.

```html
<path d="M6 23.6 V35.4 A14.5 6 0 0 0 35 35.4 V23.6Z" fill="var(--hol-gold-lt)"/><path d="M6 29.5 A14.5 6 0 0 0 35 29.5 M13.5 28.9 V34.8 M27.5 28.9 V34.8 M20.5 35.5 V41.4 M8.9 33.1 V39 M32.1 33.1 V39" stroke-width="1.3"/><ellipse cx="20.5" cy="23.6" rx="14.5" ry="6" fill="var(--hol-gold-lt)"/><ellipse cx="20.5" cy="23.900000000000002" rx="10.9" ry="4.2" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M30.9 24.5 C27.4 24.5 25.7 19.4 26.4 16.5 C26.9 14.3 28.3 13.4 28.2 12.2 L28 11.4 L26.7 10.9 L26.3 9.3 L33.3 7.6 L33.7 9.2 L32.7 10.2 L32.9 11 C33.4 12.1 35.1 12.3 36.5 14 C38.5 16.2 39.8 21.4 36.3 23.1Z" fill="var(--hol-flame)"/><path d="M26.4 19.2 C30.4 19.4 34.3 18.5 37.8 16.4" stroke-width="1.3"/><ellipse cx="29.8" cy="8.5" rx="3.1" ry="1.1" transform="rotate(-14 29.8 8.5)" fill="var(--hol-blue)" stroke-width="1.3"/><path d="M24.4 11.3 C25.8 12.8 25.6 14.2 24.4 14.2 C23.2 14.2 23 12.8 24.4 11.3Z" fill="var(--hol-blue)" stroke-width="1.3"/><path d="M23.2 15.7 C25 17.7 24.8 19.5 23.2 19.5 C21.6 19.5 21.4 17.7 23.2 15.7Z" fill="var(--hol-blue)" stroke-width="1.3"/>
```

### 6. Toldot · תּוֹלְדוֹת

<img src="docs/parasha-emojis/toldot.svg" width="96" height="96" alt="Two baby faces, one with red hair">

**Reading:** Genesis 25:19–28:9

**Summary:** Rebecca gives birth to twins, Esau sells his birthright to Jacob for a bowl of red lentil stew, and
Jacob, dressed in goatskins, receives the blessing Isaac meant for Esau.

**Emoji: The twins.** Twin babies, Esau with his red hair and his brother Jacob (Genesis 25:24–26).

**Why this emoji:** Toldot means “generations,” and the parasha is the story of Rebecca’s twins; the two babies,
one with Esau’s red hair, stand for the rivalry that runs through every scene, from the lentil stew to the stolen
blessing.

```html
<circle cx="32.9" cy="29.6" r="11" fill="var(--hol-gold-lt)"/><path d="M31.9 18.6 C30.3 15 34.5 12 36.9 14.2 C38.5 15.8 36.5 18 35.1 16.8" stroke-width="1.8"/><circle cx="29.1" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><circle cx="36.7" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><path d="M30.4 33.2 Q32.9 35.5 35.4 33.2" stroke="var(--hol-navy)" stroke-width="1.5"/><circle cx="26.6" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="39.2" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="15.1" cy="29.6" r="11" fill="var(--hol-gold-lt)"/><path d="M6.9 22.2 C8.1 15 11.5 13.5 13 15.9 C13 12.3 17.9 11.8 18.3 15.2 C20.2 13.1 23.6 15 22.5 18 C24.6 18.8 24.8 21.1 23.3 22.2 C21.9 20.5 19.3 19.7 17.2 21.1 C14.9 19.2 11.5 19.9 10 22Z" fill="var(--hol-red)"/><circle cx="11.3" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><circle cx="18.9" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><path d="M12.6 33.2 Q15.1 35.5 17.6 33.2" stroke="var(--hol-navy)" stroke-width="1.5"/><circle cx="8.8" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="21.4" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/>
```

### 7. Vayetzei · וַיֵּצֵא

<img src="docs/parasha-emojis/vayetzei.svg" width="96" height="96" alt="A ladder rising into a cloud">

**Reading:** Genesis 28:10–32:3

**Summary:** Jacob dreams of a ladder reaching to heaven with angels going up and down it, works twenty years for
Laban, marries Leah and Rachel, and his family grows to eleven sons and a daughter.

**Emoji: Jacob’s ladder.** The ladder reaching up to heaven; the sparkles are the angels going up and down
(Genesis 28:12).

**Why this emoji:** Jacob’s dream of the ladder, with angels going up and down, opens the parasha and is its
best-known moment, when God promises to protect Jacob on his journey away from home.

```html
<path d="M4.6 41.4 H24.6" stroke-width="2.4"/><path d="M8.2 39.6 L26.7 7.6 M18.1 39.6 L34.1 11.9 M12.1 32.9 L19.5 37.2 M15.1 27.7 L22.5 32 M18.1 22.5 L25.5 26.8 M21.1 17.3 L28.5 21.6 M24.1 12.1 L31.5 16.4" stroke-width="4.8"/><path d="M8.2 39.6 L26.7 7.6 M18.1 39.6 L34.1 11.9 M12.1 32.9 L19.5 37.2 M15.1 27.7 L22.5 32 M18.1 22.5 L25.5 26.8 M21.1 17.3 L28.5 21.6 M24.1 12.1 L31.5 16.4" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M22 15.6 C18.6 15.6 18.4 10.6 22 10.4 C22.4 6.6 27 5.2 29.6 7.6 C31.4 3.6 38 3.8 39.2 8.4 C42.8 8.2 44.4 12.4 42.2 14.6 C41.6 15.2 40.8 15.6 39.8 15.6Z" fill="var(--hol-paper)"/><path d="M7.4 20.2 Q8.1 22.7 10.6 23.4 Q8.1 24.1 7.4 26.6 Q6.7 24.1 4.2 23.4 Q6.7 22.7 7.4 20.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M33.8 24.4 Q34.5 26.7 36.8 27.4 Q34.5 28.1 33.8 30.4 Q33.1 28.1 30.8 27.4 Q33.1 26.7 33.8 24.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M15.8 7.6 Q16.3 9.3 18 9.8 Q16.3 10.3 15.8 12 Q15.3 10.3 13.6 9.8 Q15.3 9.3 15.8 7.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 8. Vayishlach · וַיִּשְׁלַח

<img src="docs/parasha-emojis/vayishlach.svg" width="96" height="96" alt="Two hands shaking, with a heart above">

**Reading:** Genesis 32:4–36:43

**Summary:** Jacob sends gifts ahead to Esau, wrestles all night with an angel and is renamed Israel, the
brothers meet in peace, and Rachel dies giving birth to Benjamin.

**Emoji: Making peace.** A handshake as Esau runs to meet Jacob and the brothers make peace; Esau’s sleeve is
red, for Edom (Genesis 33:4).

**Why this emoji:** After twenty years apart, the brothers’ meeting is the parasha’s central moment: Jacob
prepares for the worst, but Esau runs to embrace him, and the handshake, with Esau’s sleeve red for Edom, shows
that peace.

```html
<path d="M38.4 29.5 C34.7 27.6 30.9 26.9 26 26.3 L23.8 37.9 C28.6 38.6 32.5 39.2 36.5 39.3Z" fill="var(--hol-gold-lt)"/><path d="M37.2 27.1 L43.3 27.7 A1 1 0 0 1 44.1 28.8 L41.3 43.1 A1 1 0 0 1 40.2 43.8 L34.3 42.1Z" fill="var(--hol-blue)"/><path d="M10 30.7 C13.1 28.8 15.6 26 19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8 L24.4 27.8 L26.2 38.7 C20 40 16.1 40.4 11.5 40.1Z" fill="var(--hol-gold-lt)"/><path d="M20.8 26.4 L28.4 25.2 A1.6 1.6 0 0 1 28.9 28.4 L30.4 28.1 A1.6 1.6 0 0 1 30.9 31.3 L30.7 31.3 A1.6 1.6 0 0 1 31.2 34.5 L29.9 34.8 A1.6 1.6 0 0 1 30.4 37.9 L22.8 39.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M23.5 25.9 L28.4 25.2 A1.6 1.6 0 0 1 28.9 28.4 L30.4 28.1 A1.6 1.6 0 0 1 30.9 31.3 L30.7 31.3 A1.6 1.6 0 0 1 31.2 34.5 L29.9 34.8 A1.6 1.6 0 0 1 30.4 37.9 L23.6 39"/><path d="M24.8 29 L28.9 28.4 M25.3 32.2 L30.9 31.3 M25.8 35.4 L31.2 34.5" stroke-width="1.4"/><path d="M19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8 L20.3 28Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8"/><path d="M11 27.3 L5 27.7 A1 1 0 0 0 4.1 28.8 L6.4 43.1 A1 1 0 0 0 7.5 44 L13.4 42.4Z" fill="var(--hol-red)"/><path d="M26.6 14.6 C25.1 13.3 22.2 11.1 22.2 8.7 C22.2 6.9 23.7 5.8 25 5.8 C25.9 5.8 26.4 6.3 26.6 6.9 C26.8 6.3 27.3 5.8 28.2 5.8 C29.5 5.8 31 6.9 31 8.7 C31 11.1 28.1 13.3 26.6 14.6Z" fill="var(--hol-red)" stroke-width="1.6"/>
```

### 9. Vayeshev · וַיֵּשֶׁב

<img src="docs/parasha-emojis/vayeshev.svg" width="96" height="96" alt="A striped coat of many colors">

**Reading:** Genesis 37:1–40:23

**Summary:** Jacob gives Joseph a coat of many colors, Joseph’s dreams make his brothers jealous enough to sell
him, and in Egypt he lands in prison, where he explains the dreams of Pharaoh’s butler and baker.

**Emoji: The coat of many colors.** Joseph’s coat of many colors, a gift from his father (Genesis 37:3).

**Why this emoji:** Jacob’s gift of the special coat sets off the brothers’ jealousy and everything that happens
to Joseph afterward, and it is the most recognizable image of his story.

```html
<path d="M20.4 5.4 L21.3 6.6 L22.2 7.5 L23.1 8 L24 8.2 L24.9 8 L25.8 7.5 L26.7 6.6 L27.6 5.4 L30.4 6.2 L40.7 13.1 L7.3 13.1 L17.6 6.2Z" fill="var(--hol-red)" stroke="none"/><path d="M40.6 13 L44.2 15.4 L41.6 20.7 L40.3 20.7 L30.8 16.8 L31.6 20.7 L16.4 20.7 L17.2 16.8 L7.7 20.7 L6.4 20.7 L3.8 15.4 L7.4 13Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M41.7 20.6 L41.4 21.2 L40 20.6 L31.6 20.6 L33.1 28.4 L14.9 28.4 L16.4 20.6 L8 20.6 L6.6 21.2 L6.3 20.6Z" fill="var(--hol-blue)" stroke="none"/><path d="M33.1 28.3 L34.7 36 L13.3 36 L14.9 28.3Z" fill="var(--hol-flame)" stroke="none"/><path d="M34.7 35.9 L36.2 43.6 L11.8 43.6 L13.3 35.9Z" fill="var(--hol-green)" stroke="none"/><path d="M7.3 13 H40.7 M6.3 20.7 H7.9 M16.4 20.7 H31.6 M40.1 20.7 H41.7 M14.9 28.3 H33.1 M13.3 36 H34.7" stroke-width="1.2"/><path d="M20.4 5.4 L21.3 6.6 L22.2 7.5 L23.1 8 L24 8.2 L24.9 8 L25.8 7.5 L26.7 6.6 L27.6 5.4 L30.4 6.2 L44.2 15.4 L41.4 21.2 L30.8 16.8 L36.2 43.6 L11.8 43.6 L17.2 16.8 L6.6 21.2 L3.8 15.4 L17.6 6.2Z"/>
```

### 10. Miketz · מִקֵּץ

<img src="docs/parasha-emojis/miketz.svg" width="96" height="96" alt="A silver goblet in a sack of grain">

**Reading:** Genesis 41:1–44:17

**Summary:** Joseph explains Pharaoh’s dreams of seven fat and seven thin cows, is put in charge of Egypt to
store grain for the famine, and tests his brothers when they come to buy food by hiding his silver goblet in
Benjamin’s sack.

**Emoji: The silver goblet in the sack.** Joseph’s silver goblet, hidden in Benjamin’s sack of grain (Genesis
44:1–12).

**Why this emoji:** The goblet hidden in Benjamin’s sack is the parasha’s cliffhanger: Joseph uses it to test
whether his brothers have changed, and the reading stops with Benjamin about to be kept as a slave.

```html
<path d="M3.6 43.6 H44.4" stroke-width="2.4"/><path d="M19.8 26.2 C16.4 23.8 11.2 20.6 11.8 17.2 A12.2 2.8 0 0 1 36.2 17.2 C36.8 20.6 31.6 23.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M12.8 17.6 C17 11.6 31 11.6 35.2 17.6 A11.2 2.1999999999999997 0 0 1 12.8 17.6Z" fill="var(--hol-gold)"/><path d="M22 22.1 L23.5 15.6 L25.4 16 L24.1 22.5Z" fill="var(--hol-paper)"/><path d="M22.2 16.4 C22.5 15.3 26.4 16.1 26.2 17.2 C25.9 18.4 22 17.5 22.2 16.4Z" fill="var(--hol-paper)" stroke-width="1.5"/><path d="M21.2 5.4 C20.2 10 21.5 14.3 24.6 14.9 C27.7 15.6 30.6 12.2 31.6 7.6Z" fill="var(--hol-paper)"/><path d="M21.2 5.4 C21.6 3.5 32 5.7 31.6 7.6 C31.2 9.5 20.8 7.3 21.2 5.4Z" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M19.8 26.2 C16.4 23.8 11.2 20.6 11.8 17.2 Q14.2 20.6 18.2 19.6 Q21 21.4 24 20 Q27 21.4 29.8 19.6 Q33.8 20.6 36.2 17.2 C36.8 20.6 31.6 23.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M19.8 26.2 C13.8 28.8 8.6 32.2 8.6 37.6 C8.6 41.6 10.4 42.8 13 42.8 L35 42.8 C37.6 42.8 39.4 41.6 39.4 37.6 C39.4 32.2 34.2 28.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M14.4 32.8 C12.8 36 13 39.6 14.6 42.6" stroke-width="1.2"/><path d="M18.8 26.4 L29.2 26.4" stroke-width="3.8"/><path d="M18.8 26.4 L29.2 26.4" stroke="var(--hol-red)" stroke-width="1.8"/><path d="M37.4 6.2 Q38.1 8.9 40.8 9.6 Q38.1 10.3 37.4 13 Q36.7 10.3 34 9.6 Q36.7 8.9 37.4 6.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M10.8 9.2 Q11.3 10.9 13 11.4 Q11.3 11.9 10.8 13.6 Q10.3 11.9 8.6 11.4 Q10.3 10.9 10.8 9.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 11. Vayigash · וַיִּגַּשׁ

<img src="docs/parasha-emojis/vayigash.svg" width="96" height="96" alt="Two pyramids, a palm tree and the Nile">

**Reading:** Genesis 44:18–47:27

**Summary:** Judah offers to stay as a slave in Benjamin’s place, Joseph tells his brothers who he is, and
Jacob’s whole family moves down to Egypt to live in the land of Goshen.

**Emoji: Down to Egypt.** Pyramids, a palm tree and the Nile, as Jacob’s family settles in Goshen in Egypt
(Genesis 46:5–7, 47:27).

**Why this emoji:** The parasha ends with Jacob’s whole family settling in Egypt, the move that sets up the rest
of the Torah’s story, from slavery to the Exodus, and pyramids with the Nile say “Egypt” at a glance.

```html
<path d="M36.4 20.5 L44 38 H26.6Z" fill="var(--hol-gold-lt)"/><path d="M36.4 20.5 L39.2 38 H44Z" fill="var(--hol-gold)"/><path d="M25 8.5 L39.8 38 H10.2Z" fill="var(--hol-gold-lt)"/><path d="M25 8.5 L30 38 H39.8Z" fill="var(--hol-gold)"/><path d="M9.6 38.6 C10.6 32 11.8 26 10.8 18.6" stroke-width="4.8"/><path d="M9.6 38.6 C10.6 32 11.8 26 10.8 18.6" stroke="var(--hol-gold)" stroke-width="2.6"/><path d="M10.8 18 Q3.8 16.7 4.2 23.8 Q7.8 21.2 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q18 16.7 18.2 24 Q14.2 21.3 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q10.1 11.6 3.8 13 Q6.8 16.2 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q11 11.7 17.2 13 Q14.5 16.1 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q7.6 13 11.6 8.6 Q12.4 13.4 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M4 39 Q8 37.2 12 39 T20 39 T28 39 T36 39 T44 39 V43.6 H4Z" fill="var(--hol-blue)"/>
```

### 12. Vayechi · וַיְחִי

<img src="docs/parasha-emojis/vayechi.svg" width="96" height="96" alt="Two crossed arms with open hands">

**Reading:** Genesis 47:28–50:26

**Summary:** Jacob blesses Joseph’s sons Ephraim and Manasseh and each of his own twelve sons, is buried in the
Cave of Machpelah, and Joseph makes his brothers promise to carry his bones to the Land of Israel.

**Emoji: Crossed hands of blessing.** Jacob crosses his hands to bless Ephraim and Manasseh, the blessing parents
still give their children on Friday night (Genesis 48:13–20).

**Why this emoji:** Vayechi is a parasha of blessings, and Jacob crossing his hands to bless Ephraim and Manasseh
is the blessing parents still give their children every Friday night, a link children know from home.

```html
<path d="M16.1 24.7 L21.3 29.6 L38.5 12.5 L31.8 6.3Z" fill="var(--hol-navy)"/><path d="M16.1 24.7 L21.3 29.6 L23.6 27.3 L18.2 22.3Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M21.9 28.9 C21.2 31.9 19.1 34.4 17.1 35.7 L10.2 29.3 C11.4 27.2 13.8 24.9 16.6 24.1Z" stroke-width="2.2"/><path d="M17.1 33.9 L14.7 39.7 M15.1 32.7 L10.2 39.2 M13.2 31.2 L7.1 37.2 M11.9 29.4 L5.7 33.6 M14.4 26.4 L8.2 26" stroke-width="4.6"/><path d="M21.9 28.9 C21.2 31.9 19.1 34.4 17.1 35.7 L10.2 29.3 C11.4 27.2 13.8 24.9 16.6 24.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M17.1 33.9 L14.7 39.7 M15.1 32.7 L10.2 39.2 M13.2 31.2 L7.1 37.2 M11.9 29.4 L5.7 33.6 M14.4 26.4 L8.2 26" stroke="var(--hol-gold-lt)" stroke-width="2.5"/><path d="M26.7 29.6 L31.9 24.7 L16.2 6.3 L9.5 12.5Z" fill="var(--hol-blue)"/><path d="M26.7 29.6 L31.9 24.7 L29.8 22.3 L24.4 27.3Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M26.1 28.9 C26.8 31.9 28.9 34.4 30.9 35.7 L37.8 29.3 C36.6 27.2 34.2 24.9 31.4 24.1Z" stroke-width="2.2"/><path d="M30.9 33.9 L33.3 39.7 M32.9 32.7 L37.8 39.2 M34.8 31.2 L40.9 37.2 M36.1 29.4 L42.3 33.6 M33.6 26.4 L39.8 26" stroke-width="4.6"/><path d="M26.1 28.9 C26.8 31.9 28.9 34.4 30.9 35.7 L37.8 29.3 C36.6 27.2 34.2 24.9 31.4 24.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M30.9 33.9 L33.3 39.7 M32.9 32.7 L37.8 39.2 M34.8 31.2 L40.9 37.2 M36.1 29.4 L42.3 33.6 M33.6 26.4 L39.8 26" stroke="var(--hol-gold-lt)" stroke-width="2.5"/>
```

## Exodus

### 13. Shemot · שְׁמוֹת

<img src="docs/parasha-emojis/shemot.svg" width="96" height="96" alt="A woven basket floating among reeds">

**Reading:** Exodus 1:1–6:1

**Summary:** A new Pharaoh makes the Israelites slaves, baby Moses is saved from the Nile in a basket, and God
speaks to Moses from a burning bush and sends him to tell Pharaoh, “Let My people go.”

**Emoji: The basket in the reeds.** Baby Moses’ basket hidden among the reeds of the Nile, where Pharaoh’s
daughter finds him (Exodus 2:3–6).

**Why this emoji:** Shemot begins the story of the Exodus, and Moses’ basket on the Nile is where it turns: a
baby saved from Pharaoh’s decree grows up to lead his people out of Egypt, and the basket is the picture children
remember.

```html
<path d="M13.2 38.2 Q15.5 24 12.6 9.4 Q9.3 23.5 8 37.8Z M10.3 37.7 Q8.7 22.4 4.6 7.4 Q2.3 23.1 4.9 38.3Z M40.2 37.8 Q38.8 24.5 35.4 11.4 Q32.6 25 35 38.2Z M43.1 38.2 Q45.6 22.5 43.2 6.4 Q39.2 22 37.7 37.8Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M9.4 38 V17.4 M9.4 10 V7.8 M38.8 38 V19.4 M38.8 12.4 V10.2" stroke-width="1.6"/><path d="M7.8 15.8 V11.6 A1.6 1.6 0 0 1 11 11.6 V15.8 A1.6 1.6 0 0 1 7.8 15.8Z M37.2 17.8 V14 A1.6 1.6 0 0 1 40.4 14 V17.8 A1.6 1.6 0 0 1 37.2 17.8Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M21.4 26.4 V20.4 C24.8 18.2 29 18.2 31.6 20.6 C34.4 19.2 35.8 21.4 35 26.4Z" fill="var(--hol-paper)"/><path d="M31.6 20.6 C32.4 22 32.4 23.4 31.8 24.8 M22.6 23.2 C26.4 21.8 29.4 22 31 22.8" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M11.4 25.4 A10 9.4 0 0 1 21.4 16 V25.4Z" fill="var(--hol-gold)"/><path d="M21.4 18.6 L14.6 25.4 M12.8 20.8 L17.4 25.4 M17 17 L21.4 21.4" stroke-width="1.2"/><path d="M21.2 17.2 V25.4" stroke-width="4.6"/><path d="M21.2 17.2 V25.4" stroke="var(--hol-gold-lt)" stroke-width="2.6"/><path d="M12 26.4 C11.2 33.4 15 39 21 39 H27 C33 39 36.8 33.4 36 26.4Z" fill="var(--hol-gold)"/><path d="M11 35 L15 39 M12.6 27.4 L11 29 M11.4 27.4 L23 39 M20.6 27.4 L11 37 M19.4 27.4 L31 39 M28.6 27.4 L17 39 M27.4 27.4 L37 37 M36.6 27.4 L25 39 M35.4 27.4 L37 29 M37 35 L33 39" stroke-width="1.2"/><rect x="10.4" y="24.1" width="27.2" height="4.6" rx="2.3" fill="var(--hol-gold-lt)"/><path d="M4 37.6 Q8 35.6 12 37.6 T20 37.6 T28 37.6 T36 37.6 T44 37.6 V43.6 H4Z" fill="var(--hol-blue)"/>
```

### 14. Va'eira · וָאֵרָא

<img src="docs/parasha-emojis/vaeira.svg" width="96" height="96" alt="Red river waves with reeds and a water jar">

**Reading:** Exodus 6:2–9:35

**Summary:** God promises to bring the Israelites out of Egypt, Aaron’s staff turns into a snake, and Egypt is
struck by the first seven plagues, from the Nile turning to blood to frogs and hail.

**Emoji: The Nile turned to blood.** The first plague: the water of the Nile turns to blood (Exodus 7:14–25).

**Why this emoji:** Va’eira brings the first seven plagues, and the first one strikes the Nile, the river all of
Egypt depended on, opening the contest between God and Pharaoh that fills the parasha.

```html
<path d="M12.4 29 V14.4 M12.4 6.4 V4.2" stroke-width="1.6"/><path d="M11.2 28.7 Q9.4 17.3 5.6 6.2 Q3.2 18.1 6 29.3Z M18.5 29.5 Q21.7 20.5 19.6 10.4 Q15.8 19.3 13.5 28.5Z M21.6 29.9 Q25.4 24.7 24.4 17.6 Q20.5 22.7 17.6 28.1Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 12.8 V8 A1.6 1.6 0 0 1 14 8 V12.8 A1.6 1.6 0 0 1 10.8 12.8Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M30.7 11.5 C25.8 10.4 24.7 15.2 27.8 16.6 M37.7 11.5 C42.6 10.4 43.7 15.2 40.6 16.6" stroke-width="1.8"/><path d="M30.5 28 C25.6 26.9 25 19.6 26.9 16.3 C28.3 14.1 30.5 13.5 30.9 11.9 L30.9 10.8 L29.4 9.7 L29.4 7.8 L39 7.8 L39 9.7 L37.5 10.8 L37.5 11.9 C37.9 13.5 40.1 14.1 41.5 16.3 C43.4 19.6 42.8 26.9 37.9 28Z" fill="var(--hol-flame)"/><path d="M26.3 20.1 C31.3 21.6 37.1 21.6 42.1 20.1" stroke="var(--hol-navy)" stroke-width="1.3"/><ellipse cx="34.2" cy="7.8" rx="4" ry="1.4" fill="var(--hol-red)" stroke-width="1.4"/><path d="M5.6 29 Q8.7 26.8 11.7 29 Q14.8 31.2 17.9 29 Q20.9 26.8 24 29 Q27.1 31.2 30.1 29 Q33.2 26.8 36.3 29 Q39.3 31.2 42.4 29 M11.7 35 Q14.8 37.2 17.9 35 Q20.9 32.8 24 35 Q27.1 37.2 30.1 35 Q33.2 32.8 36.3 35 M5.6 40.8 Q8.7 38.6 11.7 40.8 Q14.8 43 17.9 40.8 Q20.9 38.6 24 40.8 Q27.1 43 30.1 40.8 Q33.2 38.6 36.3 40.8 Q39.3 43 42.4 40.8" stroke-width="5.8"/><path d="M5.6 29 Q8.7 26.8 11.7 29 Q14.8 31.2 17.9 29 Q20.9 26.8 24 29 Q27.1 31.2 30.1 29 Q33.2 26.8 36.3 29 Q39.3 31.2 42.4 29 M11.7 35 Q14.8 37.2 17.9 35 Q20.9 32.8 24 35 Q27.1 37.2 30.1 35 Q33.2 32.8 36.3 35 M5.6 40.8 Q8.7 38.6 11.7 40.8 Q14.8 43 17.9 40.8 Q20.9 38.6 24 40.8 Q27.1 43 30.1 40.8 Q33.2 38.6 36.3 40.8 Q39.3 43 42.4 40.8" stroke="var(--hol-red)" stroke-width="3.4"/>
```

### 15. Bo · בֹּא

<img src="docs/parasha-emojis/bo.svg" width="96" height="96" alt="A doorway with red marks on its posts">

**Reading:** Exodus 10:1–13:16

**Summary:** Locusts and darkness strike Egypt, God gives the mitzvah of the new month, and after the tenth
plague the Israelites eat the first Passover meal and leave Egypt in a hurry.

**Emoji: The marked doorway.** The Israelites mark their doorposts on the night of the first Passover (Exodus
12:7, 12:13).

**Why this emoji:** Bo is the parasha of the first Passover, and the marked doorposts are its central sign: the
Israelites mark their homes, God passes over them, and that night they leave Egypt, the moment retold every year
at the Seder.

```html
<path d="M4.2 41.6 H43.8" stroke-width="2.4"/><rect x="18" y="13.6" width="12" height="28" fill="var(--hol-gold-lt)"/><path d="M20.4 16.6 H27.6 V24.8 H20.4Z M20.4 29.2 H27.6 V37.2 H20.4Z" stroke="var(--hol-navy)" stroke-width="1.3"/><circle cx="27.4" cy="27" r="1.1" fill="var(--hol-navy)" stroke="none"/><path d="M11.8 12.6 H18 V41.6 H11.8Z M30 12.6 H36.2 V41.6 H30Z" fill="var(--hol-gold)"/><rect x="9.2" y="6.6" width="29.6" height="6.4" rx="1.4" fill="var(--hol-gold)"/><rect x="10.2" y="38" width="27.6" height="3.6" rx="0.8" fill="var(--hol-gold-lt)"/><path d="M14.6 10.1 Q24 8.9 33.4 10 M14.9 16.6 Q15.4 22.6 14.7 28.6 M33.1 16.6 Q32.6 22.6 33.3 28.6" stroke="var(--hol-red)" stroke-width="2.8"/>
```

### 16. Beshalach · בְּשַׁלַּח

<img src="docs/parasha-emojis/beshalach.svg" width="96" height="96" alt="Two walls of water with a dry path between them">

**Reading:** Exodus 13:17–17:16

**Summary:** The Israelites cross the sea on dry land and sing the Song of the Sea, Miriam leads the women with
timbrels, and in the desert God feeds the people with manna and brings water from a rock.

**Emoji: The split sea.** The sea splits so the Israelites can walk through on dry land (Exodus 14:21–29).

**Why this emoji:** The crossing of the sea is the high point of the Exodus, and this Shabbat is called Shabbat
Shirah after the song the Israelites sing on the far shore; two walls of water with a dry path show the miracle
at a glance.

```html
<path d="M14 43.5 V20 Q24 17.4 34 20 V43.5Z" fill="var(--hol-gold)"/><path d="M17.4 43.5 L22.9 18.4 H25.1 L30.6 43.5Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M6.4 43.5 C6.4 34 7.4 26 7.8 20 C8.2 10.6 9.8 5 13.6 5 C18.8 5 21.6 9 20.4 12.6 C19.4 15.2 16.4 15.8 15.2 13.8 C14.4 12.6 13 13.4 13.4 15.6 C13.8 17.6 15.6 18.6 15.6 21 L15.6 43.5Z M41.6 43.5 C41.6 34 40.6 26 40.2 20 C39.8 10.6 38.2 5 34.4 5 C29.2 5 26.4 9 27.6 12.6 C28.6 15.2 31.6 15.8 32.8 13.8 C33.6 12.6 35 13.4 34.6 15.6 C34.2 17.6 32.4 18.6 32.4 21 L32.4 43.5Z" fill="var(--hol-blue)"/><path d="M9.4 21 C9 13.8 11.2 8.6 14.8 8.6 C17.4 8.6 18.4 11 17 12.4 M38.6 21 C39 13.8 36.8 8.6 33.2 8.6 C30.6 8.6 29.6 11 31 12.4" stroke="var(--hol-paper)" stroke-width="2.2"/><path d="M7.6 30.6 Q9.6 28.8 11.6 30.6 T15.6 30.6 M7 37.4 Q9 35.6 11 37.4 T15 37.4 M40.4 30.6 Q38.4 28.8 36.4 30.6 T32.4 30.6 M41 37.4 Q39 35.6 37 37.4 T33 37.4" stroke="var(--hol-paper)" stroke-width="1.5"/>
```

### 17. Yitro · יִתְרוֹ

<img src="docs/parasha-emojis/yitro.svg" width="96" height="96" alt="The two tablets shining on a hill">

**Reading:** Exodus 18:1–20:23

**Summary:** Moses’s father-in-law Jethro advises him to appoint judges to help him, and at Mount Sinai, with
thunder, lightning and the sound of the shofar, God gives the Ten Commandments.

**Emoji: The Ten Commandments.** The two tablets of the Ten Commandments, shining on Mount Sinai (Exodus
20:1–14).

**Why this emoji:** Yitro is the parasha of Mount Sinai, and the Ten Commandments are its heart, so much so that
many congregations stand while they are read; the rays and the mountaintop mark the moment they were given and
set it apart from the Shavuot holiday icon, which shows two plain tablets.

```html
<path d="M10.5 26 L6.2 27.2 M10.5 18.8 L6.2 17.6 M14.1 12.5 L11 9.4 M20.4 8.9 L19.2 4.6 M27.6 8.9 L28.8 4.6 M33.9 12.5 L37 9.4 M37.5 18.8 L41.8 17.6 M37.5 26 L41.8 27.2" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M3.6 43.4 C8.4 37.2 15.6 32.4 24 32.4 C32.4 32.4 39.6 37.2 44.4 43.4Z" fill="var(--hol-gold-lt)"/><path d="M28.4 32.8 C35 33.8 40.6 38 44.4 43.4 H33.6 C33 39 31.4 35.4 28.4 32.8Z" fill="var(--hol-gold)" stroke="none"/><path d="M3.6 43.4 C8.4 37.2 15.6 32.4 24 32.4 C32.4 32.4 39.6 37.2 44.4 43.4Z"/><path d="M15 33.4 V15.8 A4.5 4.5 0 0 1 24 15.8 A4.5 4.5 0 0 1 33 15.8 V33.4Z" fill="var(--hol-paper)"/><path d="M24 16 V33.2" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M17.4 18.8 H21.8 M26.2 18.8 H30.6 M17.4 23 H21.8 M26.2 23 H30.6 M17.4 27.2 H21.8 M26.2 27.2 H30.6 M17.4 31.4 H20.6 M26.2 31.4 H29.4" stroke="var(--hol-navy)" stroke-width="1.5"/>
```

### 18. Mishpatim · מִשְׁפָּטִים

<img src="docs/parasha-emojis/mishpatim.svg" width="96" height="96" alt="A donkey carrying a load">

**Reading:** Exodus 21:1–24:18

**Summary:** God gives laws for living together fairly, such as caring for the stranger, the widow and the orphan
and returning a lost animal, and the people promise, “We will do and we will listen.”

**Emoji: Help with the load.** A donkey with a heavy load: the Torah says to help even someone you dislike when
their donkey falls under its load (Exodus 23:4–5).

**Why this emoji:** Mishpatim is a parasha of everyday laws, and helping with a fallen donkey’s load, even the
donkey of someone you dislike, shows its idea of fairness and kindness in a picture children understand.

```html
<path d="M18.4 31 V40.4 M22.8 31 V40.4 M31.6 31 V40.4 M35.8 31 V40.4" stroke-width="5"/><path d="M18.4 31 V40.4 M22.8 31 V40.4 M31.6 31 V40.4 M35.8 31 V40.4" stroke="var(--hol-gold-lt)" stroke-width="2.8"/><path d="M16.4 41.6 H20.4 M20.8 41.6 H24.8 M29.6 41.6 H33.6 M33.8 41.6 H37.8" stroke-width="2.6" stroke-linecap="butt"/><path d="M38.6 25.4 C41 26.6 41.8 29.4 41.6 32.6" stroke-width="1.8"/><path d="M41.6 31.4 C43 32.6 43 35 41.6 36 C40.2 35 40.2 32.6 41.6 31.4Z" fill="var(--hol-navy)" stroke-width="1.3"/><path d="M15.6 12.4 C15.4 8.6 16.4 5.4 18.4 3.6 C19.8 6 19.4 9.8 17.8 13Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><path d="M6.4 22.6 C9 23.6 11.6 22.6 13.4 21.4 C14.6 23.4 15 26.4 15.2 29 C15.4 32 17 33.6 20 33.6 L33 33.6 C37 33.6 39.2 31.4 39.2 27.6 C39.2 23.8 37 21.8 33.4 21.8 L22.6 21.8 C20 21.8 18.8 18 17.6 14.6 C17 12.6 15.4 11 13.4 11.2 C11 11.4 8.6 14 6.6 17 C5 19.2 4.6 21.8 6.4 22.6Z" fill="var(--hol-gold-lt)"/><path d="M12.2 12.2 C11 8.6 11.2 5 12.6 3.4 C14.6 5.4 15.2 9.2 14.6 12.6Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><circle cx="11.6" cy="15.4" r="1.25" fill="var(--hol-navy)" stroke="none"/><path d="M6 20.4 Q7 19.6 7.8 20.6" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M19.6 21.8 H36.2 V26.6 Q36.2 28.4 34.4 28.4 H21.4 Q19.6 28.4 19.6 26.6Z" fill="var(--hol-blue)" stroke-width="1.6"/><rect x="20" y="12.2" width="18" height="9.8" rx="4.9" fill="var(--hol-red)"/><path d="M25.2 12.4 V21.8 M32.8 12.4 V21.8" stroke="var(--hol-gold-lt)" stroke-width="1.9"/>
```

### 19. Terumah · תְּרוּמָה

<img src="docs/parasha-emojis/terumah.svg" width="96" height="96" alt="The Ark with two pairs of golden wings">

**Reading:** Exodus 25:1–27:19

**Summary:** God asks the Israelites to bring gifts to build the Mishkan, a portable sanctuary, and describes the
Ark with its golden cherubim, the table, the menorah and the curtains.

**Emoji: The Ark of the Covenant.** The Ark of the Covenant with its two golden cherubim (Exodus 25:10–22).

**Why this emoji:** Terumah describes the Mishkan and everything in it, and the Ark comes first: it holds the
tablets of the covenant and stands in the holiest place, with the golden cherubim on its cover.

```html
<path d="M9.7 23.8 C6.1 18.5 5.6 12.2 8.9 8.3 C11.1 5.7 14.3 4.3 17.2 4.2 Q18.6 5.9 16.9 7.3 Q18.1 9 16.2 10.4 Q17.3 12 15.3 13.3 Q16.5 14.8 14.5 16 C14.5 18.3 15.2 20.3 16.3 22.1Z M38.3 23.8 C41.9 18.5 42.4 12.2 39.1 8.3 C36.9 5.7 33.7 4.3 30.8 4.2 Q29.4 5.9 31.1 7.3 Q29.9 9 31.8 10.4 Q30.7 12 32.7 13.3 Q31.5 14.8 33.5 16 C33.5 18.3 32.8 20.3 31.7 22.1Z" fill="var(--hol-gold)"/><path d="M9.6 23.2 C7.4 17.2 8.4 11 12.6 8 C15.4 6 18.8 5.4 21.6 6 Q22.6 8 20.6 9 Q21.4 10.9 19.2 11.8 Q19.9 13.6 17.6 14.4 Q18.4 16.1 16.2 16.8 C15.6 19 15.8 21.2 16.4 23.2Z M38.4 23.2 C40.6 17.2 39.6 11 35.4 8 C32.6 6 29.2 5.4 26.4 6 Q25.4 8 27.4 9 Q26.6 10.9 28.8 11.8 Q28.1 13.6 30.4 14.4 Q29.6 16.1 31.8 16.8 C32.4 19 32.2 21.2 31.6 23.2Z" fill="var(--hol-gold-lt)"/><path d="M20.6 9 C17.4 9 14.2 10.4 12 13 M19.2 11.8 C16.8 12 14.4 13.4 13 15.8 M17.6 14.4 C15.8 14.6 14.4 16 13.6 18 M27.4 9 C30.6 9 33.8 10.4 36 13 M28.8 11.8 C31.2 12 33.6 13.4 35 15.8 M30.4 14.4 C32.2 14.6 33.6 16 34.4 18" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M5.6 35.4 H42.4" stroke-width="4.2"/><path d="M5.6 35.4 H42.4" stroke="var(--hol-gold)" stroke-width="2.2"/><rect x="8" y="23.2" width="32" height="3.6" rx="0.8" fill="var(--hol-gold-lt)"/><rect x="10" y="26.8" width="28" height="13.8" fill="var(--hol-gold)"/><rect x="14" y="29.8" width="20" height="5" rx="1" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M5 38.6 H43" stroke-width="4.6"/><path d="M5 38.6 H43" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M11.8 35.4 H15 V41.8 H11.8Z M33 35.4 H36.2 V41.8 H33Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/>
```

### 20. Tetzaveh · תְּצַוֶּה

<img src="docs/parasha-emojis/tetzaveh.svg" width="96" height="96" alt="A breastplate with twelve colored stones">

**Reading:** Exodus 27:20–30:10

**Summary:** God commands pure olive oil for a lamp that always burns and describes the special clothes of Aaron
and his sons, including the breastplate with twelve stones for the twelve tribes.

**Emoji: The breastplate.** The High Priest’s breastplate with twelve stones, one for each tribe (Exodus
28:15–21).

**Why this emoji:** Tetzaveh is about the priests’ clothes, and the breastplate is the most striking of them: its
twelve stones carry the names of the twelve tribes, so the High Priest brings all of Israel with him when he
serves.

```html
<rect x="8" y="8.6" width="32" height="32" rx="2.8" fill="var(--hol-gold)"/><path d="M13.6 11.8 H17.2 L18.8 13.4 V15.4 L17.2 17 H13.6 L12 15.4 V13.4Z M30.8 25.4 H34.4 L36 27 V29 L34.4 30.6 H30.8 L29.2 29 V27Z" fill="var(--hol-red)" stroke-width="1.4"/><path d="M22.2 11.8 H25.8 L27.4 13.4 V15.4 L25.8 17 H22.2 L20.6 15.4 V13.4Z M22.2 32.2 H25.8 L27.4 33.8 V35.8 L25.8 37.4 H22.2 L20.6 35.8 V33.8Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M30.8 11.8 H34.4 L36 13.4 V15.4 L34.4 17 H30.8 L29.2 15.4 V13.4Z M13.6 32.2 H17.2 L18.8 33.8 V35.8 L17.2 37.4 H13.6 L12 35.8 V33.8Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M13.6 18.6 H17.2 L18.8 20.2 V22.2 L17.2 23.8 H13.6 L12 22.2 V20.2Z M30.8 32.2 H34.4 L36 33.8 V35.8 L34.4 37.4 H30.8 L29.2 35.8 V33.8Z" fill="var(--hol-blue)" stroke-width="1.4"/><path d="M22.2 18.6 H25.8 L27.4 20.2 V22.2 L25.8 23.8 H22.2 L20.6 22.2 V20.2Z" fill="var(--hol-paper)" stroke-width="1.4"/><path d="M30.8 18.6 H34.4 L36 20.2 V22.2 L34.4 23.8 H30.8 L29.2 22.2 V20.2Z M13.6 25.4 H17.2 L18.8 27 V29 L17.2 30.6 H13.6 L12 29 V27Z" fill="var(--hol-flame)" stroke-width="1.4"/><path d="M22.2 25.4 H25.8 L27.4 27 V29 L25.8 30.6 H22.2 L20.6 29 V27Z" fill="var(--hol-navy)" stroke-width="1.4"/><path d="M9.9 8.6 a1.9 1.9 0 1 0 3.8 0 a1.9 1.9 0 1 0 -3.8 0 M34.3 8.6 a1.9 1.9 0 1 0 3.8 0 a1.9 1.9 0 1 0 -3.8 0" fill="var(--hol-gold-lt)" stroke-width="1.4"/>
```

### 21. Ki Tisa · כִּי תִשָּׂא

<img src="docs/parasha-emojis/kitisa.svg" width="96" height="96" alt="A golden calf on a pedestal">

**Reading:** Exodus 30:11–34:35

**Summary:** Everyone gives a half-shekel, the people build a golden calf while Moses is on Mount Sinai, Moses
breaks the tablets and prays for forgiveness, and he comes down with new tablets, his face shining.

**Emoji: The golden calf.** The golden calf the people make while Moses is on the mountain (Exodus 32:1–6).

**Why this emoji:** The golden calf is the turning point of Ki Tisa: the people’s mistake while Moses is on the
mountain leads to the broken tablets, Moses’ prayer for forgiveness and the second tablets, a story of going
wrong and starting again.

```html
<path d="M8.4 8.2 Q9.1 10.9 11.8 11.6 Q9.1 12.3 8.4 15 Q7.7 12.3 5 11.6 Q7.7 10.9 8.4 8.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M19 5.6 Q19.5 7.5 21.4 8 Q19.5 8.5 19 10.4 Q18.5 8.5 16.6 8 Q18.5 7.5 19 5.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M9 36.4 H39 V40 H9Z M6.4 40 H41.6 V43.6 H6.4Z" fill="var(--hol-gold-lt)"/><path d="M14.5 28 L14.5 34.8 Q14.5 36.4 16.1 36.4 L17.5 36.4 Q19.1 36.4 19.1 34.8 L19.1 28Z M27.1 28 L27.1 34.8 Q27.1 36.4 28.7 36.4 L30.1 36.4 Q31.7 36.4 31.7 34.8 L31.7 28Z" fill="var(--hol-gold)"/><path d="M10.9 23.6 C8.4 24.4 7.4 26.8 8 29.4" stroke-width="1.8"/><path d="M6.5 30.4 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0" fill="var(--hol-gold)" stroke-width="1.4"/><path d="M12.8 21.2 C15 18.8 21.4 18.2 26.6 18.8 C30.8 19.2 33 22 32.8 25.6 C32.6 29.4 30 31.4 26 31.4 H17.2 C13 31.4 10.4 29.2 10.6 25.6 C10.7 23.6 11.4 22.2 12.8 21.2Z" fill="var(--hol-gold)"/><path d="M11.9 28 L11.9 34.8 Q11.9 36.4 13.5 36.4 L14.9 36.4 Q16.5 36.4 16.5 34.8 L16.5 28Z M24.5 28 L24.5 34.8 Q24.5 36.4 26.1 36.4 L27.5 36.4 Q29.1 36.4 29.1 34.8 L29.1 28Z" fill="var(--hol-gold)"/><path d="M31.2 11.2 C30.2 9.6 30.4 7.6 31.6 6.4 C32.2 7.8 33 8.8 34.2 9.6Z M37.2 9.8 C38 8.4 39.2 7.4 40.6 7.2 C40.8 8.8 40.2 10.2 39.2 11.2Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M29.6 14.4 C27.4 13.2 24.6 13.4 23.4 15 C25.2 16.6 27.8 16.8 29.8 16.2Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M28.6 16.4 C28.4 12.2 31.4 9.8 34.8 9.8 C38.4 9.8 40.8 12.4 40.8 15.8 C40.8 17.8 41.6 19 41.8 20.4 C42 22.6 40.2 24 37.6 24 C34.2 24 31.4 22.8 29.8 20.6 C29 19.4 28.6 18 28.6 16.4Z" fill="var(--hol-gold)"/><path d="M35.6 20.6 C37.2 19.6 40.2 19.4 41.4 20.6 C42.4 21.8 41.2 23.8 38.4 24 C36.4 24.1 35 23.2 34.9 22 C34.8 21.4 35.1 20.9 35.6 20.6Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M32.7 15.4 a1.3 1.3 0 1 0 2.6 0 a1.3 1.3 0 1 0 -2.6 0" fill="var(--hol-navy)" stroke="none"/>
```

### 22. Vayakhel · וַיַּקְהֵל

<img src="docs/parasha-emojis/vayakhel.svg" width="96" height="96" alt="Two Shabbat candles">

**Reading:** Exodus 35:1–38:20

**Summary:** Moses gathers the people to keep Shabbat and to build the Mishkan, and they bring so many gifts that
they are told to stop, while Betzalel and the other skilled workers build it.

**Emoji: Shabbat candles.** Shabbat candles: Vayakhel opens with the mitzvah of keeping Shabbat (Exodus 35:1–3).

**Why this emoji:** Vayakhel opens with Shabbat before any of the building, teaching that even the work on the
Mishkan stops for Shabbat, and Shabbat candles are the picture of Shabbat children know best.

```html
<path d="M7 42.8 C7 39.4 10.6 38.6 12.4 37.2 L16 37.2 C17.8 38.6 21.4 39.4 21.4 42.8Z M26.6 42.8 C26.6 39.4 30.2 38.6 32 37.2 L35.6 37.2 C37.4 38.6 41 39.4 41 42.8Z" fill="var(--hol-gold)"/><path d="M12.4 30.2 L12.4 37.6 H16 L16 30.2Z M32 30.2 L32 37.6 H35.6 L35.6 30.2Z" fill="var(--hol-gold)"/><path d="M10.8 33.4 A3.4 1.9 0 1 0 17.6 33.4 A3.4 1.9 0 1 0 10.8 33.4Z M30.4 33.4 A3.4 1.9 0 1 0 37.2 33.4 A3.4 1.9 0 1 0 30.4 33.4Z" fill="var(--hol-gold)"/><path d="M8 28.2 H20.4 C20 30.4 16.8 30.8 16 31 H12.4 C11.6 30.8 8.4 30.4 8 28.2Z M27.6 28.2 H40 C39.6 30.4 36.4 30.8 35.6 31 H32 C31.2 30.8 28 30.4 27.6 28.2Z" fill="var(--hol-gold)"/><path d="M11.6 16.6 H16.8 A1 1 0 0 1 17.8 17.6 V27.2 A1 1 0 0 1 16.8 28.2 H11.6 A1 1 0 0 1 10.6 27.2 V17.6 A1 1 0 0 1 11.6 16.6Z M31.2 16.6 H36.4 A1 1 0 0 1 37.4 17.6 V27.2 A1 1 0 0 1 36.4 28.2 H31.2 A1 1 0 0 1 30.2 27.2 V17.6 A1 1 0 0 1 31.2 16.6Z" fill="var(--hol-paper)"/><path d="M14.2 16.6 V14.8 M33.8 16.6 V14.8" stroke-width="1.4"/><path d="M14.2 3.9 C15.7 7 18.5 8.5 18.1 11.7 C17.8 14.5 15.9 15.6 14.2 15.6 C12.5 15.6 10.6 14.5 10.3 11.7 C9.9 8.5 12.7 7 14.2 3.9Z M33.8 3.9 C35.3 7 38.1 8.5 37.7 11.7 C37.4 14.5 35.5 15.6 33.8 15.6 C32.1 15.6 30.2 14.5 29.9 11.7 C29.5 8.5 32.3 7 33.8 3.9Z" fill="var(--hol-flame)"/><path d="M14.2 9.1 C15.7 10.8 15.9 13.9 14.2 14 C12.5 13.9 12.7 10.8 14.2 9.1Z M33.8 9.1 C35.3 10.8 35.5 13.9 33.8 14 C32.1 13.9 32.3 10.8 33.8 9.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M6.2 6.1 Q6.7 7.9 8.5 8.4 Q6.7 8.9 6.2 10.7 Q5.7 8.9 3.9 8.4 Q5.7 7.9 6.2 6.1Z M41.8 6.1 Q42.3 7.9 44.1 8.4 Q42.3 8.9 41.8 10.7 Q41.3 8.9 39.5 8.4 Q41.3 7.9 41.8 6.1Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 23. Pekudei · פְקוּדֵי

<img src="docs/parasha-emojis/pekudei.svg" width="96" height="96" alt="A cloud and a pillar of fire">

**Reading:** Exodus 38:21–40:38

**Summary:** Moses counts the gold, silver and copper given for the Mishkan, the priests’ clothes are made, the
Mishkan is set up, and God’s cloud fills it, leading the people by day with fire by night.

**Emoji: Cloud by day, fire by night.** The cloud by day and the fire by night that lead the Israelites on their
journeys (Exodus 40:36–38).

**Why this emoji:** Exodus ends with God’s cloud filling the finished Mishkan and leading the Israelites on their
journeys, a cloud by day and fire by night, so the book closes with God’s presence traveling with the people.

```html
<path d="M3.6 43 V40.6 C9 38 15 37.8 21.6 39.4 C28 41 35 37.6 44.4 39.6 V43Z" fill="var(--hol-gold-lt)"/><path d="M7.8 28.8 C4.4 28.8 3.6 24.3 6.6 23.2 C5.9 19.6 9.3 17.3 12.1 18.5 C11.1 13.8 15.5 10.4 19.2 12.1 C22.8 10.9 26 14.1 24.7 17.7 C27.5 18.5 27.7 22.2 26 23.3 C28.1 25 27.1 28.8 24.3 28.8Z" fill="var(--hol-paper)"/><path d="M30.4 39.4 C27.6 35.6 28.6 30.4 30.2 26.4 C31.4 23.2 30.4 20.4 30.6 17.6 C32.4 19.4 32.8 21.6 33 23.4 C33.8 18.6 33.4 12.4 36.6 7.4 C37.2 11.6 38.6 13.8 40 16.6 C40.6 14.8 40.6 13.2 40.4 11.6 C43.6 15.8 44.2 21.4 43.2 26.4 C42.4 30.8 43.6 35.4 41.2 39.4Z" fill="var(--hol-flame)"/><path d="M32.4 39.2 C31.2 35.6 32.4 32.2 33.8 29.6 C34.6 28 34.6 26 34.4 24.4 C36 26 36.6 28 36.8 29.8 C37.6 27.4 37.8 25 37.4 22.6 C39.8 25.4 41 29.4 40.6 33 C40.4 35.6 40 37.6 39.2 39.2Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M28.6 6.8 Q29.1 8.7 31 9.2 Q29.1 9.7 28.6 11.6 Q28.1 9.7 26.2 9.2 Q28.1 8.7 28.6 6.8Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M43.2 4.6 Q43.6 5.8 44.8 6.2 Q43.6 6.6 43.2 7.8 Q42.8 6.6 41.6 6.2 Q42.8 5.8 43.2 4.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

## Leviticus

### 24. Vayikra · וַיִּקְרָא

<img src="docs/parasha-emojis/vayikra.svg" width="96" height="96" alt="A bowl of flour with oil pouring from a jug">

**Reading:** Leviticus 1:1–5:26

**Summary:** God calls to Moses from the Mishkan and teaches the different offerings, from animals and birds to a
simple offering of flour and oil, so that even a poor person can bring a gift to God.

**Emoji: The flour offering.** Fine flour with oil poured on it, an offering even a poor person could bring
(Leviticus 2:1–2).

**Why this emoji:** Vayikra teaches the offerings, and the simplest is fine flour with oil, so even the poorest
person can bring a gift to God; Rashi teaches that God counts it as if the giver had offered their very soul.

```html
<path d="M16 41.4 L15 44.4 H25.4 L24.4 41.4Z" fill="var(--hol-blue)"/><path d="M6 32.6 C10.4 31 15.6 27 18.8 25.2 Q20.2 24.4 21.6 25.2 C24.8 27 30 31 34.4 32.6 A14.8 3.2 0 0 1 6 32.6Z" fill="var(--hol-paper)"/><path d="M5.4 32.6 A14.8 3.2 0 0 0 35 32.6 C35 39.2 27.6 42.2 20.2 42.2 C12.8 42.2 5.4 39.2 5.4 32.6Z" fill="var(--hol-blue)"/><path d="M7 36.8 C16.2 39.2 24.2 39.2 33.4 36.8" stroke="var(--hol-gold-lt)" stroke-width="1.8"/><path d="M29.6 11.5 C27.5 6.3 32.3 3.4 36 6.5" stroke-width="3.8"/><path d="M29.6 11.5 C27.5 6.3 32.3 3.4 36 6.5" stroke="var(--hol-flame)" stroke-width="1.8"/><path d="M43 14.9 C42.8 18.7 37.2 20.1 34.5 17.7 C33.1 16.5 32.6 15.4 31.6 15.4 L29.9 15.6 C29.5 16.5 28.6 17.8 27.6 19 C27.1 16.8 26.8 13.6 27 11.4 C27.7 10.9 28.5 11 29.1 11.6 L31 11.3 C32 11 32.1 9.8 33.1 8.3 C35.1 5.2 40.9 4.9 42.1 8.6Z" fill="var(--hol-flame)"/><path d="M27.3 21.2 C29.3 23.3 29 25.2 27.3 25.2 C25.6 25.2 25.4 23.3 27.3 21.2Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/>
```

### 25. Tzav · צַו

<img src="docs/parasha-emojis/tzav.svg" width="96" height="96" alt="A steady flame on two crossed logs">

**Reading:** Leviticus 6:1–8:36

**Summary:** God teaches the priests how to bring each offering and to keep the fire on the altar burning always,
and Moses dresses and anoints Aaron and his sons for seven days to begin their service.

**Emoji: The fire that never goes out.** The fire on the altar is kept burning day and night and never goes out
(Leviticus 6:5–6).

**Why this emoji:** Tzav commands that the fire on the altar must never go out, and every morning the priests add
wood to keep it burning, a picture of faith kept alight day and night.

```html
<path d="M4.4 42.6 H43.6" stroke-width="2.4"/><path d="M24 8.6 C27.4 13.2 33.4 17.2 33 25 C32.8 30 29 33 24 33 C19 33 15.2 30 15 25 C14.8 20.6 17.2 17.8 19.4 16.6 C19.2 19 20 20.6 21.4 21.4 C21 16.8 22.4 12.2 24 8.6Z" fill="var(--hol-flame)"/><path d="M24 20 C26.4 22.6 28.4 25 28.2 28 C28 30.4 26.2 32 24 32 C21.8 32 20 30.4 19.8 28 C19.6 25 21.6 22.6 24 20Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M11.2 34.6 L35.7 29.4 L36.8 34.6 L12.3 39.8Z" fill="var(--hol-gold)"/><path d="M12.3 29.4 L36.8 34.6 L35.7 39.8 L11.2 34.6Z" fill="var(--hol-gold)"/><path d="M36.2 34.5 A1.7 2.7 0 1 1 36.2 39.9 A1.7 2.7 0 1 1 36.2 34.5Z M11.8 34.5 A1.7 2.7 0 1 1 11.8 39.9 A1.7 2.7 0 1 1 11.8 34.5Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><path d="M10.6 11.2 Q11.2 13.4 13.4 14 Q11.2 14.6 10.6 16.8 Q10 14.6 7.8 14 Q10 13.4 10.6 11.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M38.6 9.2 Q39.1 10.9 40.8 11.4 Q39.1 11.9 38.6 13.6 Q38.1 11.9 36.4 11.4 Q38.1 10.9 38.6 9.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 26. Shemini · שְׁמִינִי

<img src="docs/parasha-emojis/shemini.svg" width="96" height="96" alt="Fire coming down from a cloud onto an altar">

**Reading:** Leviticus 9:1–11:47

**Summary:** On the eighth day the Mishkan begins its service and fire from God comes down onto the altar,
Aaron’s sons Nadav and Avihu die after offering a fire God had not commanded, and God teaches which animals, fish
and birds may be eaten.

**Emoji: Fire from heaven.** On the eighth day fire from God comes down onto the altar, and the people shout for
joy (Leviticus 9:23–24).

**Why this emoji:** Shemini begins on the eighth day, when the Mishkan’s service starts and fire from God comes
down onto the altar, the sign that God accepts the people’s offerings and dwells among them.

```html
<path d="M4.4 42.6 H43.6" stroke-width="2.4"/><path d="M10.6 34 L10.6 31.6 C10.6 30.4 11 29.6 12 29.2 C13.6 30.4 14 31.8 14 34Z M37.4 34 L37.4 31.6 C37.4 30.4 37 29.6 36 29.2 C34.4 30.4 34 31.8 34 34Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M11.4 34 H36.6 V42.6 H11.4Z" fill="var(--hol-gold)"/><path d="M11.4 37.2 H36.6 V40 H11.4Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M10.2 33.4 H37.8" stroke-width="2"/><path d="M24 21.2 C25.8 23.6 28.9 25.7 28.7 29.8 C28.6 32.4 26.6 33.9 24 33.9 C21.4 33.9 19.4 32.4 19.3 29.8 C19.2 27.5 20.5 26 21.6 25.4 C21.5 26.6 21.9 27.5 22.6 27.9 C22.4 25.5 23.2 23.1 24 21.2Z" fill="var(--hol-flame)"/><path d="M24 27.2 C25.2 28.5 26.3 29.8 26.2 31.3 C26.1 32.6 25.1 33.4 24 33.4 C22.9 33.4 21.9 32.6 21.8 31.3 C21.7 29.8 22.8 28.5 24 27.2Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M15.1 22.6 A1.9 1.9 0 1 0 18.9 21.8 L14.8 12.6Z M22.2 16.8 A1.8 1.8 0 1 0 25.8 16.8 L24 12Z M29.1 21.8 A1.9 1.9 0 1 0 32.9 22.6 L33.2 12.6Z" fill="var(--hol-flame)" stroke-width="1.6"/><path d="M16.1 21.8 A0.8 0.8 0 1 0 17.6 21.4 L15.6 16.2Z M23.2 16.5 A0.8 0.8 0 1 0 24.8 16.5 L24 13.8Z M30.4 21.4 A0.8 0.8 0 1 0 31.9 21.8 L32.4 16.2Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M17 11.6 C14.5 11.6 14.4 7.9 17 7.8 C17.3 4.9 20.7 3.9 22.7 5.7 C24 2.7 28.9 2.9 29.8 6.3 C32.4 6.1 33.6 9.2 32 10.9 C31.5 11.3 31 11.6 30.2 11.6Z" fill="var(--hol-paper)"/><path d="M7.2 21.8 Q7.8 23.8 9.8 24.4 Q7.8 25 7.2 27 Q6.6 25 4.6 24.4 Q6.6 23.8 7.2 21.8Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41 22.2 Q41.5 23.9 43.2 24.4 Q41.5 24.9 41 26.6 Q40.5 24.9 38.8 24.4 Q40.5 23.9 41 22.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 27. Tazria · תַזְרִיעַ

<img src="docs/parasha-emojis/tazria.svg" width="96" height="96" alt="A swaddled sleeping baby">

**Reading:** Leviticus 12:1–13:59

**Summary:** The Torah teaches what a mother does after a baby is born, including the brit milah on the eighth
day, and how the kohen examines tzara’at, a skin affliction that can also appear on clothing.

**Emoji: A new baby.** A newborn baby: a boy has his brit milah on the eighth day (Leviticus 12:1–3).

**Why this emoji:** Tazria opens with the birth of a baby and the brit milah on the eighth day, a joyful way into
a parasha that is mostly about tzara’at, and a picture every child understands.

```html
<path d="M10.8 26 A13.1 13.1 0 0 1 34 13.6 C38.5 22.2 39.7 30.1 37.7 34.7 Q33.7 41.1 26.2 40.9 C21.2 39.9 15.4 34.5 10.8 26Z" fill="var(--hol-blue)"/><circle cx="23" cy="20.9" r="9.4" fill="var(--hol-gold-lt)"/><path d="M15.6 34.3 C24.2 31.7 33 30.4 39.2 30.8 M25.2 40.4 C28.1 37 33.4 34.2 37.9 33.7" stroke-width="1.6"/><path d="M17.4 21 Q19.9 23 21.1 20.1 M24.3 19.3 Q26.7 21.3 28 18.4" stroke="var(--hol-navy)" stroke-width="1.6"/><path d="M22.5 25.2 Q24.3 26 25.5 24.4" stroke="var(--hol-navy)" stroke-width="1.5"/><circle cx="18.1" cy="25.2" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="29.3" cy="22.4" r="1.6" fill="var(--hol-red)" stroke="none"/><path d="M40 6.4 Q40.7 8.9 43.2 9.6 Q40.7 10.3 40 12.8 Q39.3 10.3 36.8 9.6 Q39.3 8.9 40 6.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M9.6 37.6 Q10.2 39.6 12.2 40.2 Q10.2 40.8 9.6 42.8 Q9 40.8 7 40.2 Q9 39.6 9.6 37.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 28. Metzora · מְצֹרָע

<img src="docs/parasha-emojis/metzora.svg" width="96" height="96" alt="A cedar stick and a hyssop sprig tied with red thread">

**Reading:** Leviticus 14:1–15:33

**Summary:** A person healed of tzara’at is purified with cedar wood, red thread, hyssop and two birds, one of
which is set free, and the Torah teaches what to do when tzara’at appears on the walls of a house.

**Emoji: Cedar, hyssop and red thread.** The cedar wood, hyssop and red thread used to purify a person healed of
tzara’at (Leviticus 14:4–6).

**Why this emoji:** Metzora is about becoming pure again, and the cedar, hyssop and red thread begin the
purification; Rashi reads the tall cedar and the low hyssop as a lesson to set pride aside for humility.

```html
<path d="M31.8 40.4 L17.1 10.4" stroke-width="1.7"/><path d="M24.9 26.3 Q22.1 22.5 18 24.8 Q20.8 28.6 24.9 26.3Z M24.9 26.3 Q29.2 24.5 28 20 Q23.6 21.8 24.9 26.3Z M22.6 21.5 Q19.8 17.7 15.7 20 Q18.5 23.8 22.6 21.5Z M22.6 21.5 Q26.9 19.7 25.6 15.2 Q21.3 17 22.6 21.5Z M20.4 17 Q17.6 13.2 13.5 15.5 Q16.3 19.3 20.4 17Z M20.4 17 Q24.7 15.2 23.4 10.7 Q19.1 12.5 20.4 17Z M17.1 10.4 Q16.1 5.8 11.5 6.2 Q12.5 10.8 17.1 10.4Z M17.1 10.4 Q20.4 7 17.4 3.4 Q14.2 6.8 17.1 10.4Z M17.1 10.4 Q18.3 5.6 13.8 3.6 Q12.7 8.3 17.1 10.4Z" fill="var(--hol-green)" stroke-width="1.3"/><path d="M20.2 42.8 L36 13.2 A3.1 3.1 0 0 0 30.5 10.3 L14.8 39.9Z" fill="var(--hol-gold)"/><ellipse cx="17.5" cy="41.4" rx="1.5" ry="3.1" transform="rotate(-62 17.5 41.4)" fill="var(--hol-gold-lt)" stroke-width="1.6"/><path d="M32.6 28.3 L17.8 28.1 M32.6 25.7 L17.8 25.5 M32.7 23.1 L17.9 22.9" stroke-width="3.6"/><path d="M32.6 28.3 L17.8 28.1 M32.6 25.7 L17.8 25.5 M32.7 23.1 L17.9 22.9" stroke="var(--hol-red)" stroke-width="1.6"/><path d="M32.8 25.6 C36.4 26.4 35 30.2 37.8 32 M32.8 26.2 C34.4 29 32.4 31.6 33.6 34.2" stroke="var(--hol-red)" stroke-width="1.9"/>
```

### 29. Achrei Mot · אַחֲרֵי מוֹת

<img src="docs/parasha-emojis/achreimot.svg" width="96" height="96" alt="A white linen tunic, sash and turban">

**Reading:** Leviticus 16:1–18:30

**Summary:** God teaches the Yom Kippur service, when the High Priest enters the Holy of Holies in white linen
and one goat is sent into the wilderness carrying the people’s sins, and gives laws for living a holy life.

**Emoji: White linen clothes.** On Yom Kippur the High Priest wears plain white linen (Leviticus 16:4).

**Why this emoji:** Achrei Mot describes the Yom Kippur service, when the High Priest sets aside his golden
garments for plain white linen, which is why many people still wear white on Yom Kippur.

```html
<path d="M15.6 9.8 C16.2 11.8 17.6 12.8 19.6 12.8 C21.6 12.8 23 11.8 23.6 9.8 L29.4 11.4 L35.4 27 L31 28.6 L27.6 20.6 L28.6 43.8 H10.6 L11.6 20.6 L8.2 28.6 L3.8 27 L9.8 11.4Z" fill="var(--hol-paper)"/><path d="M16.4 10.4 C17.2 12.6 18.2 13.8 19.6 13.8 C21 13.8 22 12.6 22.8 10.4" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M11.6 20.6 L11.4 24.4 M27.6 20.6 L27.8 24.4 M5.4 25.6 L7.6 26.4 M33.8 25.6 L31.6 26.4" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M13.4 30 L12.8 38.6 L15.2 38.2 L15.6 30.2 M15.6 30.4 L17.8 37.6" stroke="var(--hol-navy)" stroke-width="1.4" fill="var(--hol-paper)"/><path d="M11.3 26.4 H27.9 L28 30.4 H11.2Z" fill="var(--hol-paper)" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M16.6 26.8 L18.4 30 M21.6 26.8 L23.4 30" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M33.3 13.4 C32.4 10.3 32.9 6.8 35.1 5 C36.8 3.7 40.4 3.7 42.1 5 C44.3 6.8 44.8 10.3 43.9 13.4Z" fill="var(--hol-paper)"/><path d="M33.9 12.5 C35.5 10.7 36.8 9.7 38.6 9.4 M43.3 12.5 C41.7 10.7 40.4 9.7 38.6 9.4 M33.6 8.5 C35.5 8.3 37.3 7.2 38.6 5.8 M43.6 8.5 C41.7 8.3 39.9 7.2 38.6 5.8" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M7.2 4 Q7.7 5.9 9.6 6.4 Q7.7 6.9 7.2 8.8 Q6.7 6.9 4.8 6.4 Q6.7 5.9 7.2 4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M40.6 32.8 Q41.2 34.8 43.2 35.4 Q41.2 36 40.6 38 Q40 36 38 35.4 Q40 34.8 40.6 32.8Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 30. Kedoshim · קְדֹשִׁים

<img src="docs/parasha-emojis/kedoshim.svg" width="96" height="96" alt="Tall wheat left standing in one corner of a cut field">

**Reading:** Leviticus 19:1–20:27

**Summary:** God tells the people, “You shall be holy,” and shows how: love your neighbor as yourself, leave the
corners of your field for the poor, do not spread gossip, honor the elderly and be honest in business.

**Emoji: The corner of the field.** A field cut short except for one corner, left standing for the poor
(Leviticus 19:9–10).

**Why this emoji:** Kedoshim shows that holiness lives in everyday life, and the corner of the field left for the
poor makes that a picture of a shared harvest, the way Ruth later gathers grain in Boaz’s field.

```html
<path d="M6 42 L5.2 36.6 M9.9 42 L10.2 34.4 M13.9 42 L13.2 35.8 M17.8 42 L18.4 34.8 M21.8 42 L21.4 36.4" stroke-width="4.4"/><path d="M6 42 L5.2 36.6 M9.9 42 L10.2 34.4 M13.9 42 L13.2 35.8 M17.8 42 L18.4 34.8 M21.8 42 L21.4 36.4" stroke="var(--hol-gold)" stroke-width="2.2"/><path d="M3.8 42.6 H44.2" stroke-width="2.4"/><path d="M28 42 L26.8 23.4 M33.4 42 L33.2 20 M38.8 42 L39.2 23.4" stroke-width="4.6"/><path d="M28 42 L26.8 23.4 M33.4 42 L33.2 20 M38.8 42 L39.2 23.4" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M28 12.9 L30.5 8 M24.2 13.1 L21 8.6 M35 9.6 L37.8 4.8 M31.2 9.6 L28.3 4.9 M41.3 13 L44.3 8.4 M37.5 12.9 L34.8 8.2" stroke-width="1.3"/><path d="M26.8 24.4 Q30.7 22.5 28.9 19.9 Q30.5 17.6 28.4 15.6 Q29.5 12.8 25.9 10.8 Q22.7 13.2 24 15.9 Q22.3 18.1 24.2 20.2 Q22.7 23 26.8 24.4Z M33.2 21 Q37.2 19.3 35.5 16.6 Q37.2 14.4 35.3 12.3 Q36.5 9.5 33.1 7.4 Q29.7 9.6 30.9 12.3 Q29 14.5 30.8 16.7 Q29.2 19.4 33.2 21Z M39.2 24.4 Q43.2 22.9 41.6 20.1 Q43.4 18 41.6 15.7 Q42.9 13.1 39.5 10.8 Q36 12.9 37.2 15.7 Q35.2 17.8 36.9 20 Q35.2 22.7 39.2 24.4Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M18.8 19.4 Q19.6 22.2 22.4 23 Q19.6 23.8 18.8 26.6 Q18 23.8 15.2 23 Q18 22.2 18.8 19.4Z" fill="var(--hol-paper)" stroke-width="1.3"/><path d="M10.2 13 Q10.7 14.9 12.6 15.4 Q10.7 15.9 10.2 17.8 Q9.7 15.9 7.8 15.4 Q9.7 14.9 10.2 13Z" fill="var(--hol-paper)" stroke-width="1.3"/>
```

### 31. Emor · אֱמֹר

<img src="docs/parasha-emojis/emor.svg" width="96" height="96" alt="A lulav and an etrog">

**Reading:** Leviticus 21:1–24:23

**Summary:** God gives special rules for the kohanim and lists the holy days of the year, from Shabbat, Pesach
and Shavuot to Rosh Hashanah, Yom Kippur and Sukkot, with the counting of the Omer and the four species.

**Emoji: The four species.** The lulav and etrog, taken on Sukkot (Leviticus 23:40).

**Why this emoji:** Emor lists the holy days of the year, and the lulav and etrog, commanded here for Sukkot,
turn that list into something children can hold in their hands, while staying apart from the suite’s sukkah icon
for Sukkot itself.

```html
<path d="M11.3 35.5 Q15.7 27.7 15.2 16.9 Q10.5 26.6 11.3 35.5Z M9.9 35.9 Q12.1 29.5 9.2 22 Q7.2 29.8 9.9 35.9Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M16 41.3 L26.3 25.9" stroke-width="1.3"/><path d="M20.9 35.4 C21.6 34 22.3 33.7 23.4 34.3 C24.5 34.8 24.6 35.6 23.9 37 C23.2 38.4 22.5 38.7 21.4 38.2 C20.3 37.6 20.1 36.9 20.9 35.4Z M21 31.7 C21.7 30.3 22.4 29.9 23.5 30.5 C24.6 31.1 24.7 31.8 24 33.2 C23.3 34.7 22.6 35 21.5 34.4 C20.4 33.9 20.3 33.1 21 31.7Z M24 29.4 C24.7 28 25.4 27.6 26.5 28.2 C27.6 28.8 27.7 29.5 27 30.9 C26.3 32.4 25.6 32.7 24.5 32.1 C23.4 31.6 23.2 30.8 24 29.4Z M24.6 25.9 C25.3 24.5 26 24.2 27.1 24.7 C28.2 25.3 28.4 26 27.6 27.5 C26.9 28.9 26.2 29.2 25.1 28.6 C24 28.1 23.9 27.3 24.6 25.9Z" fill="var(--hol-green)" stroke-width="1.3"/><path d="M13.7 33.4 C15 26.2 19.9 17.5 23.7 12.6 C26.7 9.7 28.9 7.4 30.2 5.9 C29.8 7.9 29.2 11 28.6 15.1 C26.9 21 22.7 30.1 17.6 35.4Z" fill="var(--hol-green)"/><path d="M16.1 33.5 L28.4 9.4" stroke="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M11.2 43.1 L13 39.7 M8.9 41 L10.3 38.4 M14.3 43.8 L15.6 41.1" stroke-width="2"/><path d="M7.4 37.8 L17.9 43.2 L18.9 41.2 L8.4 35.8Z M9.2 34.4 L19.7 39.8 L20.7 37.8 L10.2 32.5Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M26.2 37.9 L24 38.4" stroke-width="2.4"/><path d="M26.3 37.8 C27.8 43.6 33.3 43.2 36 42.2 C39.9 40.9 42.2 37.9 42.9 34.4 L44.1 33.4 L42.6 33 C40.3 30.3 36.9 28.7 32.8 29.4 C29.9 29.8 24.9 32 26.3 37.8Z" fill="var(--hol-gold-lt)"/><path d="M38.3 37.7 Q35.5 40.2 31.8 39.7" stroke="var(--hol-gold)" stroke-width="1.5"/>
```

### 32. Behar · בְּהַר

<img src="docs/parasha-emojis/behar.svg" width="96" height="96" alt="A sign with the number 7, a resting plow and wildflowers">

**Reading:** Leviticus 25:1–26:2

**Summary:** Every seventh year the land rests, in the fiftieth year, the Jubilee, the shofar proclaims freedom
throughout the land, and the Torah commands helping a neighbor who becomes poor.

**Emoji: The land rests.** In the seventh year the plow rests and the field grows on its own (Leviticus 25:2–7).

**Why this emoji:** Behar teaches that every seventh year the land rests, a Shabbat for the earth, and the sign
with its 7 and the plow set aside show that rest at a glance; the mitzvah is still kept in Israel today as
shemitah.

```html
<path d="M3.8 42.6 H44.2" stroke-width="2.4"/><rect x="10" y="20.6" width="3.6" height="21.4" fill="var(--hol-gold)" stroke-width="1.6"/><rect x="3.8" y="6" width="16" height="15.6" rx="2.4" fill="var(--hol-gold-lt)"/><path d="M8 10 H15.8 L11.3 17.6" stroke="var(--hol-navy)" stroke-width="3"/><path d="M5.2 40.4 C9 38.8 13.2 38.4 17.8 39.4" stroke-width="4.8"/><path d="M5.2 40.4 C9 38.8 13.2 38.4 17.8 39.4" stroke="var(--hol-gold)" stroke-width="2.6"/><path d="M16.2 39.4 C17.4 37 18.4 34.8 19.4 32.6" stroke-width="4.4"/><path d="M16.2 39.4 C17.4 37 18.4 34.8 19.4 32.6" stroke="var(--hol-gold)" stroke-width="2.2"/><path d="M15 37.6 L23 40.2 Q23.6 41 22.6 41.5 L15 41.6 Q13.6 39.6 15 37.6Z" fill="var(--hol-navy)" stroke-width="1.5"/><path d="M27.2 42 Q28 35.2 28.2 28.4 M35.8 42 Q35 31.2 34.8 20.4 M42 42 Q41.2 35.7 41 29.5" stroke="var(--hol-green)" stroke-width="2"/><path d="M28.4 35.8 Q26.5 33.3 23.6 34.4 Q25.5 36.9 28.4 35.8Z M40.6 36.2 Q43.6 36.7 44.8 33.9 Q41.9 33.5 40.6 36.2Z M34.4 33.2 Q37.9 33.8 39.7 30.8 Q36.2 30.2 34.4 33.2Z" fill="var(--hol-green)" stroke-width="1.3"/><path d="M24.8 22.3 L26.7 24.5 L28.2 22 L29.7 24.5 L31.6 22.3 C31.9 27.1 30.2 29.1 28.2 29.1 C26.2 29.1 24.5 27.1 24.8 22.3Z M37.9 23.9 L39.6 25.9 L41 23.6 L42.4 25.9 L44.1 23.9 C44.4 28.2 42.9 30.1 41 30.1 C39.1 30.1 37.6 28.2 37.9 23.9Z" fill="var(--hol-red)" stroke-width="1.4"/><path d="M34.8 20.4 C32.2 16.3 33.3 14.4 34.8 15 C36.3 14.4 37.4 16.3 34.8 20.4Z M34.8 20.4 C37.9 16.7 40.1 17.1 39.9 18.7 C41 20 39.5 21.6 34.8 20.4Z M34.8 20.4 C39.3 22.2 39.6 24.4 38 24.8 C37.1 26.2 35.1 25.2 34.8 20.4Z M34.8 20.4 C34.5 25.2 32.5 26.2 31.6 24.8 C30 24.4 30.3 22.2 34.8 20.4Z M34.8 20.4 C30.1 21.6 28.6 20 29.7 18.7 C29.5 17.1 31.7 16.7 34.8 20.4Z" fill="var(--hol-flame)" stroke-width="1.4"/><circle cx="34.8" cy="20.4" r="1.7" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 33. Bechukotai · בְּחֻקֹּתַי

<img src="docs/parasha-emojis/bechukotai.svg" width="96" height="96" alt="A bunch of grapes with ears of wheat">

**Reading:** Leviticus 26:3–27:34

**Summary:** God promises rain in its season, plentiful harvests and peace if the people follow the commandments,
warns of what will happen if they do not, and Leviticus ends with the laws of gifts dedicated to God.

**Emoji: Grapes and wheat.** Grapes and wheat: the threshing will last until the grape harvest (Leviticus 26:5).

**Why this emoji:** Bechukotai opens with the blessings of rain in its season and harvests so rich that one runs
into the next, and grapes with wheat show that plenty, closing Leviticus on a note of blessing.

```html
<path d="M24.6 42.6 L12.6 20.8 M26.8 42.6 L18 16.8 M28.8 42.6 L23.6 15.6" stroke-width="3.8"/><path d="M24.6 42.6 L12.6 20.8 M26.8 42.6 L18 16.8 M28.8 42.6 L23.6 15.6" stroke="var(--hol-gold)" stroke-width="1.8"/><path d="M9.9 12.9 L9.9 8.7 M7.4 14.3 L3.8 12.1 M16.7 8.6 L17.5 4.4 M14 9.5 L10.9 6.7 M23.4 7.3 L24.8 3.3 M20.7 7.8 L17.9 4.6" stroke-width="1.3"/><path d="M12.6 20.8 Q14.6 18.4 12.6 17.2 Q13 15.2 11 14.5 Q10.8 12.4 7.9 12.2 Q6.4 14.8 8.2 16.1 Q7.7 18.1 9.6 18.9 Q9.5 21.2 12.6 20.8Z M18 16.8 Q20.4 14.7 18.6 13.3 Q19.3 11.4 17.5 10.3 Q17.7 8.2 14.8 7.5 Q13 9.8 14.4 11.4 Q13.6 13.3 15.3 14.4 Q14.8 16.6 18 16.8Z M23.6 15.6 Q26.3 13.9 24.7 12.2 Q25.7 10.4 24 9.1 Q24.5 7 21.7 6 Q19.6 8 20.8 9.7 Q19.7 11.6 21.3 12.8 Q20.5 15 23.6 15.6Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M29.6 17.7 C29.6 15.4 31 13.4 32.8 14.4 M30.4 14.2 C26.8 13.6 26.2 10 28.4 9.4 C30 9 30.4 11 29.2 11.6" stroke-width="1.6"/><path d="M37.2 14.2 Q33.3 16.9 30.8 11.1 Q32.2 10.1 34.2 10.3 Q33.2 8.6 33.1 6.3 Q35.1 7.2 36.4 8.7 Q37 6.8 38.5 4.7 Q39.3 7.2 39.1 9.2 Q40.8 8.2 43.1 8.1 Q42.2 10.1 40.7 11.4 Q42.6 12 43.4 13.3 Q41.1 16.9 38.2 13.9 Z" fill="var(--hol-green)"/><path d="M36.5 13.4 L34.6 8.4 M37.2 12.2 L39.1 8.2 M37.2 12.2 L33.3 11.5" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M20.1 20.4 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M26.8 20.2 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M32.7 20.6 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M17 25.4 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M23.1 24.9 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M29.7 25.1 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M36.5 24.9 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M20.4 29.6 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M26.2 30 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M33.2 30.1 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M23.1 34.3 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0 M29.7 34.5 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M26.2 39.4 a3.1 3.1 0 1 0 6.2 0 a3.1 3.1 0 1 0 -6.2 0" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M21.4 19.3 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M28.2 19.1 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M34 19.5 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M18.4 24.3 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M24.4 23.8 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M31.1 24 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M37.8 23.8 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M21.7 28.5 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M27.6 28.9 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M34.5 29 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M24.4 33.2 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M31.1 33.4 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0 M27.6 38.3 a0.8 0.8 0 1 0 1.5 0 a0.8 0.8 0 1 0 -1.5 0" fill="var(--hol-gold-lt)" stroke="none"/>
```

## Numbers

### 34. Bamidbar · בְּמִדְבַּר

<img src="docs/parasha-emojis/bamidbar.svg" width="96" height="96" alt="A tent among desert dunes under the stars">

**Reading:** Numbers 1:1–4:20

**Summary:** In the wilderness of Sinai Moses counts the Israelites, each tribe camps around the Mishkan under
its own banner, and the Levites are given the work of carrying the Mishkan.

**Emoji: In the wilderness.** Bamidbar means “in the wilderness”: the people camp in the desert of Sinai (Numbers
1:1).

**Why this emoji:** Bamidbar means “in the wilderness,” and the whole book follows the Israelites through the
desert, so a tent among the dunes sets the scene for Numbers; the Sages teach that the Torah was given in the
wilderness, a place that belongs to no one, so that it would belong to everyone.

```html
<path d="M10 6.4 Q10.8 9.4 13.8 10.2 Q10.8 11 10 14 Q9.2 11 6.2 10.2 Q9.2 9.4 10 6.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M20.6 3.5 Q21.2 5.5 23.1 6 Q21.2 6.6 20.6 8.5 Q20.1 6.6 18.1 6 Q20.1 5.5 20.6 3.5Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M37.4 6.5 Q38 8.8 40.3 9.4 Q38 10 37.4 12.3 Q36.8 10 34.5 9.4 Q36.8 8.8 37.4 6.5Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M12 42.6 C17 32 25.6 20.2 32.6 19 C37.4 18.6 41.6 23 44 27 V42.6Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M32.6 19 C30.2 25 28 32 28.6 42.6 H12 C17 32 25.6 20.2 32.6 19Z" fill="var(--hol-gold)" stroke="none"/><path d="M12 42.6 C17 32 25.6 20.2 32.6 19 C37.4 18.6 41.6 23 44 27 V42.6Z"/><path d="M4 30.4 C7 28.4 10.4 27.6 13.4 27.8 C20.6 28.2 30.4 34 44 36.4 V42.6 H4Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M13.4 27.8 C14.4 32 13.6 37.6 11.6 42.6 H4 V30.4 C7 28.4 10.4 27.6 13.4 27.8Z" fill="var(--hol-gold)" stroke="none"/><path d="M4 30.4 C7 28.4 10.4 27.6 13.4 27.8 C20.6 28.2 30.4 34 44 36.4 V42.6 H4Z"/><path d="M22.6 38.4 L29.4 26 L36.2 38.4Z" fill="var(--hol-red)"/><path d="M29.4 26 L27.6 38.4 H31.2Z" fill="var(--hol-navy)" stroke-width="1.3"/><path d="M29.4 26 V23.2" stroke-width="1.7"/><path d="M4 42.6 H44" stroke-width="2.4"/>
```

### 35. Nasso · נָשֹׂא

<img src="docs/parasha-emojis/nasso.svg" width="96" height="96" alt="Two hands raised in the Priestly Blessing">

**Reading:** Numbers 4:21–7:89

**Summary:** The Levite families receive their tasks, the Torah teaches about the nazir who gives up wine, the
kohanim are given the Priestly Blessing, and the twelve tribal leaders bring the same gifts to dedicate the
Mishkan.

**Emoji: The Priestly Blessing.** The kohanim’s hands raised for the Priestly Blessing, still given in synagogues
today (Numbers 6:22–27).

**Why this emoji:** Nasso holds the Priestly Blessing, the words kohanim still bless the congregation with and
many parents say over their children on Friday night, so the raised hands link the parasha to something children
see and hear.

```html
<path d="M6.8 19.6 C6.1 23.6 6.6 28.4 9 32 L17 32 C17.6 29.6 18 26 18.4 23.4 C18.6 22 18.8 21 18.8 19.8Z" stroke-width="2"/><path d="M7.9 20.8 L5.7 11.2 M11.1 20 L8.1 7.4 M14.3 20.2 L16.2 6.5 M17.5 20.6 L19.2 8.7" stroke-width="5.2"/><path d="M16.4 29.6 L22.1 26.2" stroke-width="5.6"/><path d="M6.8 19.6 C6.1 23.6 6.6 28.4 9 32 L17 32 C17.6 29.6 18 26 18.4 23.4 C18.6 22 18.8 21 18.8 19.8Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M7.9 20.8 L5.7 11.2 M11.1 20 L8.1 7.4 M14.3 20.2 L16.2 6.5 M17.5 20.6 L19.2 8.7" stroke="var(--hol-gold-lt)" stroke-width="3.2"/><path d="M16.4 29.6 L22.1 26.2" stroke="var(--hol-gold-lt)" stroke-width="3.6"/><path d="M41.2 19.6 C41.9 23.6 41.4 28.4 39 32 L31 32 C30.4 29.6 30 26 29.6 23.4 C29.4 22 29.2 21 29.2 19.8Z" stroke-width="2"/><path d="M40.1 20.8 L42.3 11.2 M36.9 20 L39.9 7.4 M33.7 20.2 L31.8 6.5 M30.5 20.6 L28.8 8.7" stroke-width="5.2"/><path d="M31.6 29.6 L25.9 26.2" stroke-width="5.6"/><path d="M41.2 19.6 C41.9 23.6 41.4 28.4 39 32 L31 32 C30.4 29.6 30 26 29.6 23.4 C29.4 22 29.2 21 29.2 19.8Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M40.1 20.8 L42.3 11.2 M36.9 20 L39.9 7.4 M33.7 20.2 L31.8 6.5 M30.5 20.6 L28.8 8.7" stroke="var(--hol-gold-lt)" stroke-width="3.2"/><path d="M31.6 29.6 L25.9 26.2" stroke="var(--hol-gold-lt)" stroke-width="3.6"/><path d="M9.1 18.8 L7.4 11.4 M16.1 18.8 L17.5 9.1 M38.9 18.8 L40.6 11.4 M31.9 18.8 L30.5 9.1" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M8.2 31 L17.6 31 C18.4 35.4 19.4 40 20.6 44.2 L5.4 44.2 C6.2 40 7.2 35.4 8.2 31Z M39.8 31 L30.4 31 C29.6 35.4 28.6 40 27.4 44.2 L42.6 44.2 C41.8 40 40.8 35.4 39.8 31Z" fill="var(--hol-paper)"/><path d="M7.9 33 L18 33 L18.6 36 L7.2 36Z M40.2 33 L30 33 L29.4 36 L40.8 36Z" fill="var(--hol-blue)" stroke-width="1.4"/>
```

### 36. Beha'alotcha · בְּהַעֲלֹתְךָ

<img src="docs/parasha-emojis/behaalotcha.svg" width="96" height="96" alt="A round quail">

**Reading:** Numbers 8:1–12:16

**Summary:** Aaron lights the menorah, the Israelites leave Sinai following the cloud and the call of silver
trumpets, the people complain about the manna and receive quail, and Moses prays for his sister Miriam to be
healed.

**Emoji: The quail.** The quail God sends when the people complain about the manna (Numbers 11:31–32).

**Why this emoji:** The quail tell the parasha’s main story of the people complaining in the desert and wanting
meat instead of manna, and the round little bird makes that story friendly and easy to remember.

```html
<path d="M4 42.6 H44" stroke-width="2.4"/><path d="M19.4 37.6 V42 M16.8 42 H21.4 M26.6 37.6 V42 M24.4 42 H29" stroke-width="1.8"/><path d="M10.4 27.6 L4.8 21.8 C4.2 21 4.8 20.2 5.8 20.4 L13.4 22.6Z" fill="var(--hol-gold)"/><path d="M9.4 30.6 C9.4 22.8 15.4 18.6 23 18.6 C30.6 18.6 36.4 23 36.4 29.6 C36.4 35.8 30.4 39.6 23 39.6 C15.6 39.6 9.4 36.4 9.4 30.6Z" fill="var(--hol-gold-lt)"/><path d="M25.4 29.6 Q27 31.6 28.6 29.6 M29.6 28.4 Q31.2 30.4 32.8 28.4 M27.6 33.6 Q29.2 35.6 30.8 33.6 M22.8 34 Q24.4 36 26 34" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M11.4 26.4 C14 22.6 19.6 22 23.4 24.6 C25.6 26.2 25 29.8 21.6 31.4 C17.6 33.2 12.4 32.4 11.4 29.4 C11 28.4 11 27.4 11.4 26.4Z" fill="var(--hol-gold)"/><path d="M14.7 26.8 a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 M18.7 26 a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 M17.1 29.6 a0.9 0.9 0 1 0 1.8 0 a0.9 0.9 0 1 0 -1.8 0 M13.2 29.8 a0.8 0.8 0 1 0 1.6 0 a0.8 0.8 0 1 0 -1.6 0" fill="var(--hol-navy)" stroke="none"/><path d="M32 12.2 C31.6 9.6 32.4 7.4 34.6 6.6 C36.4 6 37.8 7.2 37.2 8.6 C36.6 9.8 35 9.4 34.8 8.4" stroke-width="1.7"/><circle cx="32.6" cy="17.4" r="6.4" fill="var(--hol-gold)"/><path d="M38.8 15.8 L42.6 17.6 L38.8 19.2Z" fill="var(--hol-flame)" stroke-width="1.5"/><circle cx="34.6" cy="16.2" r="1.4" fill="var(--hol-navy)" stroke="none"/><circle cx="35.1" cy="15.7" r="0.5" fill="var(--hol-paper)" stroke="none"/>
```

### 37. Sh'lach · שְׁלַח לְךָ

<img src="docs/parasha-emojis/shlach.svg" width="96" height="96" alt="A jug of milk beside a honeycomb">

**Reading:** Numbers 13:1–15:41

**Summary:** Moses sends twelve spies into Canaan, they return with a giant cluster of grapes, ten of them
frighten the people, and the Israelites must wander forty years; the parasha ends with the mitzvah of tzitzit.

**Emoji: Milk and honey.** “A land flowing with milk and honey,” as the spies describe Canaan (Numbers 13:27).

**Why this emoji:** Even the frightened spies agree that Canaan is “a land flowing with milk and honey,” and milk
with a honeycomb shows that good land, which is why their fear was mistaken; the honeycomb keeps it apart from
the Rosh Hashanah apple and honey.

```html
<g transform="translate(1.2 0)"><path d="M9 18.6 C2.6 17 2.4 25.6 6 27.8" stroke-width="4.6"/><path d="M9 18.6 C2.6 17 2.4 25.6 6 27.8" stroke="var(--hol-blue)" stroke-width="2.2"/><path d="M8.2 13 C8.6 15 9.2 16 9.4 17.4 C5.6 20 4.6 25 5 30 C5.4 35 7.2 39.4 9 42.4 L21 42.4 C22.8 39.4 24.6 35 25 30 C25.4 25 24.4 20 20.6 17.4 C20.8 16 21.4 14.6 22 13.4 L25.6 11.2 C24.6 10.4 23 10.6 21.6 11 C18 10 12 10 8.2 13Z" fill="var(--hol-blue)"/><path d="M8.6 13 C11 11 19 11 21.8 13.2 C21.6 14.4 21 15.4 20.4 15.6 C19.6 15.8 19.4 17.2 19.4 18.4 A1.5 1.5 0 0 1 16.4 18.4 C16.4 17.2 16.2 16.2 15 16.2 C13.8 16.2 13.4 17.6 13.4 20.4 A1.5 1.5 0 0 1 10.4 20.4 C10.4 17.8 10.2 16.4 9.4 15.4 C8.8 14.8 8.6 13.8 8.6 13Z" fill="var(--hol-paper)" stroke-width="1.4"/></g><path d="M29.2 18.1 L32.9 20.3 L32.9 24.5 L29.2 26.7 L25.5 24.5 L25.5 20.3Z M25.5 24.5 L29.2 26.7 L29.2 31 L25.5 33.2 L21.8 31 L21.8 26.7Z M40.4 24.5 L44.1 26.7 L44.1 31 L40.4 33.2 L36.6 31 L36.6 26.7Z M29.2 31 L32.9 33.2 L32.9 37.4 L29.2 39.6 L25.5 37.4 L25.5 33.2Z M36.6 31 L40.4 33.2 L40.4 37.4 L36.6 39.6 L32.9 37.4 L32.9 33.2Z" fill="var(--hol-gold-lt)"/><path d="M36.6 18.1 L40.4 20.3 L40.4 24.5 L36.6 26.7 L32.9 24.5 L32.9 20.3Z M32.9 24.5 L36.6 26.7 L36.6 31 L32.9 33.2 L29.2 31 L29.2 26.7Z" fill="var(--hol-gold)"/><path d="M32.9 20.3 L32.9 24.5 M32.9 24.5 L29.2 26.7 M29.2 26.7 L25.5 24.5 M40.4 24.5 L36.6 26.7 M36.6 26.7 L32.9 24.5 M29.2 26.7 L29.2 31 M29.2 31 L25.5 33.2 M36.6 26.7 L36.6 31 M36.6 31 L32.9 33.2 M32.9 33.2 L29.2 31 M40.4 33.2 L36.6 31 M32.9 33.2 L32.9 37.4" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M35 38.6 L36.6 39.6 L38.2 38.6 C38.3 41 38.6 41.6 38.6 42.6 A2 2 0 0 1 34.6 42.6 C34.6 41.6 34.9 41 35 38.6Z" fill="var(--hol-gold)" stroke-width="1.5"/>
```

### 38. Korach · קֹרַח

<img src="docs/parasha-emojis/korach.svg" width="96" height="96" alt="A crack opening in the desert ground">

**Reading:** Numbers 16:1–18:32

**Summary:** Korach leads a rebellion against Moses and Aaron, the earth opens and swallows the rebels, and
Aaron’s staff blossoms overnight with flowers and almonds to show that God chose him.

**Emoji: The ground opens.** The ground opens up beneath the rebels (Numbers 16:31–33).

**Why this emoji:** The ground opening beneath Korach’s followers is the turning point of the parasha, showing
that God chose Moses and Aaron, and a calm crack in the earth tells it without frightening children.

```html
<path d="M2.6 23 H24 V24.4 H45.4 V45.4 H2.6Z" fill="var(--hol-gold)" stroke="none"/><path d="M2.6 23 H24 V24.4 H45.4 V29.4 Q34 31.4 24 28.6 Q12 26.8 2.6 29Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M3.8 23 H16.6 M31.8 24.4 H44.2" stroke-width="2.4"/><path d="M16.6 23.6 L20.6 28 L18 31.8 L21.7 35.4 L21 38.4 L23.8 43.4 L26.5 38.2 L27.2 35 L30.4 31.4 L27.9 28.2 L31.8 25Z" fill="var(--hol-navy)" stroke-width="1.8"/><path d="M22.2 29.6 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M20.5 17 a1.7 1.7 0 1 0 3.4 0 a1.7 1.7 0 1 0 -3.4 0 M25.8 12.4 a1.4 1.4 0 1 0 2.8 0 a1.4 1.4 0 1 0 -2.8 0" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M20.8 13.6 V11.6 M26 9 V7.2" stroke-width="1.3"/><path d="M9.4 22.6 Q8.8 19.8 7.4 19 M9.8 22.6 Q10.6 19.6 12.2 18.8 M38.2 24 Q37.6 21.2 36.2 20.4 M38.6 24 Q39.4 21 41 20.2" stroke="var(--hol-green)" stroke-width="1.8"/>
```

### 39. Chukat · חֻקַּת

<img src="docs/parasha-emojis/chukat.svg" width="96" height="96" alt="Water pouring from a rock, with a staff beside it">

**Reading:** Numbers 19:1–22:1

**Summary:** The Torah teaches the law of the red heifer, Miriam dies and the water runs out, Moses strikes the
rock instead of speaking to it, Aaron dies, and a copper snake on a pole heals people bitten by snakes.

**Emoji: Water from the rock.** Moses strikes the rock and water pours out for the people (Numbers 20:7–11).

**Why this emoji:** Water from the rock is the parasha’s best-known story and its hardest lesson: Moses was told
to speak to the rock but struck it, and because of that he would not enter the Land of Israel.

```html
<path d="M6.2 42.7 L5.6 32.5 L9 22.9 L14.7 17 L21.9 15.5 L27.7 18.4 L30.7 25.5 L31 34.2 L29.3 42.7Z" fill="var(--hol-gold-lt)"/><path d="M30.7 25.5 L31 34.2 L29.3 42.7 L23.3 42.7 L25.9 33.2 L25.3 24.6 L27.7 18.4Z" fill="var(--hol-gold)" stroke-width="1.4"/><path d="M14.7 17 L17.4 23.7 L13.3 32" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M27.8 21.6 L30.4 20.4 L30.2 27 L27.6 25.6Z" fill="var(--hol-navy)" stroke-width="1.4"/><path d="M24.6 40.6 C24.6 37.8 29.4 36.6 34.6 36.4 C35.6 34.6 36.6 33.6 38 33.4 C39.4 33.6 40.2 34.4 41 36.2 C43.2 36.6 44.4 38 44.4 40.6 C44.4 42.4 40 43.6 34.6 43.6 C29.2 43.6 24.6 42.4 24.6 40.6Z" fill="var(--hol-blue)"/><path d="M29.4 20.6 C34.6 18.4 40.6 20.6 41.8 27.4 C42.4 30.6 41.6 33.6 41 36.4 L35.2 36.4 C35.8 33.6 36 31.4 35.2 29.6 C34 27.2 31.8 26.6 29.4 26.8Z" fill="var(--hol-blue)"/><path d="M31.8 22.4 C35 21.4 38.4 22.8 39.4 26.4 M32.6 25 C34.8 24.8 36.6 26 37.2 28 M28.4 40.4 Q30.4 39.2 32.4 40.4 M37.4 40.8 Q39.4 39.6 41.4 40.8" stroke="var(--hol-paper)" stroke-width="1.3"/><path d="M43.4 28.2 C43.7 29 44.4 29.7 44.4 30.6 A1 1 0 0 1 42.4 30.6 C42.4 29.7 43.1 29 43.4 28.2Z M32.4 30.9 C32.7 31.7 33.4 32.3 33.4 33.2 A1 1 0 0 1 31.5 33.2 C31.5 32.3 32.1 31.7 32.4 30.9Z M38.4 13.4 C38.7 14.2 39.4 14.9 39.4 15.8 A1 1 0 0 1 37.4 15.8 C37.4 14.9 38.1 14.2 38.4 13.4Z" fill="var(--hol-blue)" stroke-width="1.2"/><path d="M7.6 42.2 L13.8 7.6" stroke-width="5.6"/><path d="M7.6 42.2 L13.8 7.6" stroke="var(--hol-gold)" stroke-width="3.2"/><path d="M40.6 5.2 Q41.2 7.4 43.4 8 Q41.2 8.6 40.6 10.8 Q40 8.6 37.8 8 Q40 7.4 40.6 5.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 40. Balak · בָּלָק

<img src="docs/parasha-emojis/balak.svg" width="96" height="96" alt="Three tents in a row under the stars">

**Reading:** Numbers 22:2–25:9

**Summary:** King Balak hires the prophet Balaam to curse the Israelites, Balaam’s donkey sees an angel and
speaks, and every curse Balaam tries comes out as a blessing, including “How good are your tents, O Jacob.”

**Emoji: How good are your tents.** “How good are your tents, O Jacob,” the words that open the Mah Tovu prayer
(Numbers 24:5).

**Why this emoji:** Balaam comes to curse but blesses instead, and his words “How good are your tents, O Jacob”
open the Mah Tovu prayer said on entering a synagogue, so the row of tents ties the parasha to daily prayer.

```html
<path d="M11 23.6 V21.4" stroke-width="1.8"/><path d="M11 23.6 C9.8 29 6.7 35.8 3.5 41.6 H18.5 C15.3 35.8 12.3 29 11 23.6Z" fill="var(--hol-red)" stroke-width="1.6"/><path d="M11 31.2 L8.5 41.6 H13.6Z" fill="var(--hol-navy)" stroke="none"/><path d="M37 23.6 V21.4" stroke-width="1.8"/><path d="M37 23.6 C35.8 29 32.7 35.8 29.5 41.6 H44.5 C41.3 35.8 38.3 29 37 23.6Z" fill="var(--hol-blue)" stroke-width="1.6"/><path d="M37 31.2 L34.5 41.6 H39.6Z" fill="var(--hol-navy)" stroke="none"/><path d="M24 23.6 V21.4" stroke-width="1.8"/><path d="M24 23.6 C22.8 29 19.7 35.8 16.5 41.6 H31.5 C28.3 35.8 25.3 29 24 23.6Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><path d="M24 31.2 L21.5 41.6 H26.6Z" fill="var(--hol-navy)" stroke="none"/><path d="M3.8 41.6 H44.2" stroke-width="2.4"/><path d="M34.6 6.8 Q35.4 9.8 38.4 10.6 Q35.4 11.4 34.6 14.4 Q33.8 11.4 30.8 10.6 Q33.8 9.8 34.6 6.8Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M14 11 Q14.5 12.9 16.4 13.4 Q14.5 13.9 14 15.8 Q13.5 13.9 11.6 13.4 Q13.5 12.9 14 11Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 41. Pinchas · פִּינְחָס

<img src="docs/parasha-emojis/pinchas.svg" width="96" height="96" alt="Two hands passing a shepherd’s staff">

**Reading:** Numbers 25:10–30:1

**Summary:** Pinchas is given God’s covenant of peace, the five daughters of Tzelofchad win the right to inherit
their father’s land, Joshua is chosen to lead after Moses, and the offerings for each holiday are listed.

**Emoji: Passing the staff to Joshua.** Moses lays his hands on Joshua and makes him the next leader (Numbers
27:18–23).

**Why this emoji:** In Pinchas, Moses asks God for a leader to follow him and lays his hands on Joshua, and the
staff passed from hand to hand shows that handover and Moses’ care for the people’s future.

```html
<path d="M18.8 42.3 L27.1 9.1 A4.1 4.1 0 0 1 35.1 11.1 L34.5 13.4" stroke-width="5"/><path d="M18.8 42.3 L27.1 9.1 A4.1 4.1 0 0 1 35.1 11.1 L34.5 13.4" stroke="var(--hol-gold)" stroke-width="2.8"/><path d="M15.6 14.4 C17.8 14.1 20 13.1 22.8 13 C24.9 13 26.9 13.4 28.7 13.8 A1.1 1.1 0 0 1 28.3 16 C26.3 15.7 24.6 15.5 23.2 15.7 L24.7 16.3 L23 23.1 C19.1 22.3 16.7 21.6 14.1 20.3Z M31.3 33.4 C29.5 32 28 30.1 25.5 28.7 C23.7 27.8 21.7 27.1 19.9 26.7 A1.1 1.1 0 0 0 19.3 28.8 C21.3 29.5 22.8 30.1 24 30.9 L22.4 30.7 L20.7 37.5 C24.5 38.7 26.9 39.2 29.8 39.3Z" fill="var(--hol-gold-lt)"/><path d="M22.9 14.6 L27.6 15.7 A1 1 0 0 1 27.1 17.7 L28.1 18 A1 1 0 0 1 27.6 19.9 L27.5 19.9 A1 1 0 0 1 27 21.9 L26.2 21.7 A1 1 0 0 1 25.7 23.7 L21 22.5Z M24.7 30.1 L20 28.9 A1 1 0 0 0 19.5 30.9 L18.6 30.6 A1 1 0 0 0 18.1 32.6 L18.2 32.6 A1 1 0 0 0 17.7 34.6 L18.5 34.8 A1 1 0 0 0 18 36.8 L22.7 38Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M24.6 15 L27.6 15.7 A1 1 0 0 1 27.1 17.7 L28.1 18 A1 1 0 0 1 27.6 19.9 L27.5 19.9 A1 1 0 0 1 27 21.9 L26.2 21.7 A1 1 0 0 1 25.7 23.7 L21.4 22.6 M23 29.6 L20 28.9 A1 1 0 0 0 19.5 30.9 L18.6 30.6 A1 1 0 0 0 18.1 32.6 L18.2 32.6 A1 1 0 0 0 17.7 34.6 L18.5 34.8 A1 1 0 0 0 18 36.8 L22.2 37.9"/><path d="M24.6 17.1 L27.1 17.7 M24.1 19.1 L27.6 19.9 M23.6 21.1 L27 21.9 M22 31.5 L19.5 30.9 M21.5 33.5 L18.1 32.6 M21.1 35.5 L17.7 34.6" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M22.8 13 C24.9 13 26.9 13.4 28.7 13.8 A1.1 1.1 0 0 1 28.3 16 C26.3 15.7 24.6 15.5 23.2 15.7 L22.2 15.4Z M25.5 28.7 C23.7 27.8 21.7 27.1 19.9 26.7 A1.1 1.1 0 0 0 19.3 28.8 C21.3 29.5 22.8 30.1 24 30.9 L24.9 31.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M22.8 13 C24.9 13 26.9 13.4 28.7 13.8 A1.1 1.1 0 0 1 28.3 16 C26.3 15.7 24.6 15.5 23.2 15.7 M25.5 28.7 C23.7 27.8 21.7 27.1 19.9 26.7 A1.1 1.1 0 0 0 19.3 28.8 C21.3 29.5 22.8 30.1 24 30.9"/><path d="M14.8 21.4 L5.3 19.9 L7.6 10.8 L16.7 13.9Z" fill="var(--hol-blue)"/><path d="M30.5 32.3 L40 33.9 L37.8 43 L28.6 39.9Z" fill="var(--hol-green)"/><path d="M14.8 21.4 L12.1 20.8 L14 13.1 L16.7 13.9Z M30.5 32.3 L33.3 32.9 L31.3 40.7 L28.6 39.9Z" fill="var(--hol-gold)" stroke-width="1.5"/>
```

### 42. Matot · מַטּוֹת

<img src="docs/parasha-emojis/matot.svg" width="96" height="96" alt="A silver pot of water over a small fire, with sparkles">

**Reading:** Numbers 30:2–32:42

**Summary:** The Torah teaches that a promise must be kept and that metal vessels are made pure with fire and
water, and the tribes of Reuben and Gad ask to settle east of the Jordan with their flocks, promising to fight
beside the other tribes first.

**Emoji: Purifying vessels.** Metal vessels are made pure with fire and others with water, the source of
kashering pots (Numbers 31:21–23).

**Why this emoji:** Matot teaches how vessels are made pure with fire and water, the source of kashering pots and
of dipping new dishes in a mikveh, things children see at home, especially before Pesach.

```html
<path d="M14.4 35.4 C16.3 38.4 20 39.4 20 41.3 C20 42.9 17.8 43.2 15.6 43.2 C13.4 43.2 11.2 42.9 11.2 41.3 C11.2 39.4 13.7 38.4 14.4 35.4Z M30.4 35.4 C31.1 38.4 33.6 39.4 33.6 41.3 C33.6 42.9 31.4 43.2 29.2 43.2 C27 43.2 24.8 42.9 24.8 41.3 C24.8 39.4 28.5 38.4 30.4 35.4Z M22.4 33.8 C23.8 37.4 27.2 38.7 27.2 41 C27.2 42.9 24.8 43.2 22.4 43.2 C20 43.2 17.6 42.9 17.6 41 C17.6 38.7 21 37.4 22.4 33.8Z" stroke-width="4"/><path d="M14.4 35.4 C16.3 38.4 20 39.4 20 41.3 C20 42.9 17.8 43.2 15.6 43.2 C13.4 43.2 11.2 42.9 11.2 41.3 C11.2 39.4 13.7 38.4 14.4 35.4Z M30.4 35.4 C31.1 38.4 33.6 39.4 33.6 41.3 C33.6 42.9 31.4 43.2 29.2 43.2 C27 43.2 24.8 42.9 24.8 41.3 C24.8 39.4 28.5 38.4 30.4 35.4Z M22.4 33.8 C23.8 37.4 27.2 38.7 27.2 41 C27.2 42.9 24.8 43.2 22.4 43.2 C20 43.2 17.6 42.9 17.6 41 C17.6 38.7 21 37.4 22.4 33.8Z" fill="var(--hol-flame)" stroke="none"/><path d="M22.4 37 C23.1 39 24.8 39.7 24.8 41 C24.8 42.1 23.6 42.4 22.4 42.4 C21.2 42.4 20 42.1 20 41 C20 39.7 21.7 39 22.4 37Z" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M9.7 19.4 C4.7 18.6 4.5 25 9.7 24.6 M35.1 19.4 C40.1 18.6 40.3 25 35.1 24.6" stroke-width="2.8"/><path d="M9.9 16 C8.3 21.8 10.3 27.2 15.3 28.8 L29.5 28.8 C34.5 27.2 36.5 21.8 34.9 16Z" fill="var(--hol-paper)"/><path d="M9.3 21.4 C17.9 24 26.9 24 35.5 21.4 M14.3 24.6 C14.5 26.6 15.5 28 16.9 28.8" stroke="var(--hol-navy)" stroke-width="1.5"/><ellipse cx="22.4" cy="16" rx="13.1" ry="3.4" fill="var(--hol-paper)"/><ellipse cx="22.4" cy="16.3" rx="10.7" ry="2.1" fill="var(--hol-blue)" stroke-width="1.4"/><path d="M31.4 6.1 C32.6 9.1 31.7 11.1 29.8 10.4 C27.9 9.7 28.5 7.6 31.4 6.1 Z" fill="var(--hol-blue)" stroke-width="1.4"/><path d="M36.8 4.1 C37.4 6.8 36.3 8.2 34.9 7.4 C33.5 6.6 34.2 5 36.8 4.1 Z" fill="var(--hol-blue)" stroke-width="1.4"/><path d="M6.8 5.2 Q7.5 7.9 10.2 8.6 Q7.5 9.3 6.8 12 Q6.1 9.3 3.4 8.6 Q6.1 7.9 6.8 5.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41.2 11.6 Q41.7 13.5 43.6 14 Q41.7 14.5 41.2 16.4 Q40.7 14.5 38.8 14 Q40.7 13.5 41.2 11.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 43. Masei · מַסְעֵי

<img src="docs/parasha-emojis/masei.svg" width="96" height="96" alt="A map with a dotted route to a tent">

**Reading:** Numbers 33:1–36:13

**Summary:** The Torah lists all forty-two stops on the Israelites’ journey through the wilderness, sets the
borders of the Land of Israel, and sets aside cities of refuge where someone who caused a death by accident could
be safe.

**Emoji: The journeys.** The route of the Israelites’ journeys, with every stop along the way (Numbers 33:1–49).

**Why this emoji:** Masei opens with the list of all forty-two stops between Egypt and the Jordan, and the dotted
route to a tent shows the whole forty-year journey that closes the book of Numbers.

```html
<path d="M9.6 8.2 C15.6 6.2 20.4 9.6 26.6 8.2 C32.6 6.8 40.2 5.6 42.8 10.8 C44.8 15 41.8 19.4 43 24.8 C44.2 30.2 45.4 36.4 41.4 40.2 C37.4 44 30.4 40.8 24.6 42.4 C18.4 44.2 10.4 45.4 6.4 41.4 C3.2 37.8 6.4 32.6 5 27.2 C3.6 21.8 3 15.6 5.4 11.8 C6.6 10 7.8 8.8 9.6 8.2Z" fill="var(--hol-gold-lt)"/><path d="M10.8 37.2 C19.4 40.2 30.2 38.6 32.2 33.8 C34.2 29 15.6 30.2 13.4 24.8 C11.4 19.4 19.6 15.4 26.4 19.6" stroke="var(--hol-navy)" stroke-width="1.8" stroke-dasharray="2.2 2.4"/><circle cx="10.8" cy="37.2" r="2.9" fill="var(--hol-red)" stroke-width="1.5"/><circle cx="31.7" cy="34.8" r="2.7" fill="var(--hol-blue)" stroke-width="1.5"/><circle cx="21.5" cy="28.9" r="2.6" fill="var(--hol-green)" stroke-width="1.5"/><circle cx="15.8" cy="19" r="2.5" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M34.2 11.4 L34.2 9" stroke-width="1.6"/><path d="M34.2 11.4 L40.4 23 Q40.8 24 41.2 24 L27.2 24 Q27.6 24 28 23Z" fill="var(--hol-red)" stroke-width="1.8"/><path d="M34.2 18.2 L35.6 24 L32.8 24Z" fill="var(--hol-navy)" stroke-width="1.2"/>
```

## Deuteronomy

### 44. Devarim · דְּבָרִים

<img src="docs/parasha-emojis/devarim.svg" width="96" height="96" alt="The Jordan River with green hills and a palm tree beyond">

**Reading:** Deuteronomy 1:1–3:22

**Summary:** On the plains of Moab, Moses begins his farewell speeches, retelling the forty years in the
wilderness, from appointing judges to the sin of the spies and the victory over the giant king Og, as the people
prepare to enter the land.

**Emoji: At the edge of the land.** The people camp by the Jordan, with the land they are about to enter on the
other side (Deuteronomy 1:1–5).

**Why this emoji:** Devarim opens with the people camped by the Jordan, about to enter the land after forty
years, and all of Moses’ speeches look across that river, so the river with the land beyond it sets the scene for
the whole book.

```html
<path d="M13.5 16.4 L10.9 14.9 M16.4 13.5 L14.9 10.9 M20.4 12.4 L20.4 9.4 M24.4 13.5 L25.9 10.9 M27.3 16.4 L29.9 14.9" stroke-width="1.8"/><circle cx="20.4" cy="20.4" r="5.6" fill="var(--hol-gold-lt)"/><path d="M4.4 31 L4.4 21.4 C8.6 16.4 15.4 16.4 20.4 21.2 C24.6 16.2 31.6 13.6 37.2 16.2 C40 17.4 42.2 19.4 43.6 21.6 L43.6 31Z" fill="var(--hol-green)"/><path d="M34.8 28.8 Q36 21.6 35.6 14.4" stroke-width="3.9"/><path d="M34.8 28.8 Q36 21.6 35.6 14.4" stroke="var(--hol-gold)" stroke-width="2.1"/><path d="M35.6 14.4 Q30.2 13.5 28.9 18.8 Q32.4 16.9 35.6 14.4Z M35.6 14.4 Q41 13.5 42.3 18.8 Q38.8 16.9 35.6 14.4Z M35.6 14.4 Q33.7 10.3 29.9 12.7 Q32.6 14.2 35.6 14.4Z M35.6 14.4 Q37.5 10.3 41.3 12.7 Q38.6 14.2 35.6 14.4Z M35.6 14.4 Q33.2 11.4 36 8.7 Q37.2 11.7 35.6 14.4Z" fill="var(--hol-green)" stroke-width="1.3"/><path d="M4.4 28.8 C11 27.4 17 29.4 24 28.4 C31 27.4 37 27.6 43.6 28 L43.6 35.4 C37 35.8 31 34.6 24 35.6 C17 36.6 11 35.2 4.4 36.6Z" fill="var(--hol-blue)"/><path d="M10.4 32.4 Q12.4 31.1 14.4 32.4 Q16.4 33.7 18.4 32.4 M28.6 31.6 Q30.6 30.3 32.6 31.6 Q34.6 32.9 36.6 31.6" stroke="var(--hol-paper)" stroke-width="1.5"/><path d="M4.4 36.2 C11 34.8 17 36.2 24 35.2 C31 34.2 37 35.4 43.6 35 L43.6 41.4 Q43.6 43.6 41.4 43.6 L6.6 43.6 Q4.4 43.6 4.4 41.4Z" fill="var(--hol-gold-lt)"/><path d="M10 41.4 Q9.6 39.4 7.8 38.2 M10.4 41.4 L10.6 37.4 M10.8 41.4 Q11.4 39.4 13.2 38.4 M30.2 40.6 Q29.9 38.8 28.3 37.7 M30.6 40.6 L30.8 37 M31 40.6 Q31.5 38.8 33.1 37.9" stroke="var(--hol-green)" stroke-width="1.6"/>
```

### 45. Va'etchanan · וָאֶתְחַנַּן

<img src="docs/parasha-emojis/vaetchanan.svg" width="96" height="96" alt="A mezuzah on a doorpost">

**Reading:** Deuteronomy 3:23–7:11

**Summary:** Moses pleads to enter the land, repeats the Ten Commandments, and teaches the Shema, with the
mitzvot of loving God, teaching your children, tefillin and the mezuzah.

**Emoji: The mezuzah.** The mezuzah on the doorpost, with the words of the Shema inside (Deuteronomy 6:9).

**Why this emoji:** Va’etchanan teaches the Shema, and its words are written on the parchment inside every
mezuzah, so the mezuzah children touch at the doorway carries the parasha into every Jewish home.

```html
<path d="M12.6 3.6 H33.4 V44.4 H12.6Z" fill="var(--hol-gold)" stroke="none"/><path d="M12.6 3.6 H17.6 V44.4 H12.6Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M29.8 3.6 V44.4" stroke="var(--hol-gold-lt)" stroke-width="1.8" stroke-linecap="butt"/><path d="M12.6 3.6 V44.4 M17.6 3.6 V44.4 M33.4 3.6 V44.4" stroke-linecap="butt"/><g transform="translate(24.6 24.4) rotate(-20)"><rect x="-5.4" y="-16.6" width="10.8" height="33.2" rx="2.6" fill="var(--hol-blue)"/><path d="M-2.8 -8.4 L-2.8 -4.7 Q-2.8 -2.6 -0.7 -2.6 L0.7 -2.6 Q2.8 -2.6 2.8 -4.7 L2.8 -8.4 M0.1 -8.1 L-0.3 -2.6" stroke="var(--hol-gold-lt)" stroke-width="1.8"/><path d="M-4 -8.6 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 M-1.1 -8.3 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 M1.6 -8.6 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0" fill="var(--hol-gold-lt)" stroke="none"/><path d="M-1.1 -13.6 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 M-1.1 13.6 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0" fill="var(--hol-gold-lt)" stroke-width="1.2"/><path d="M-2.8 3.4 V9.8" stroke="var(--hol-paper)" stroke-width="1.5"/></g><path d="M6.6 27.4 Q7.2 29.4 9.2 30 Q7.2 30.6 6.6 32.6 Q6 30.6 4 30 Q6 29.4 6.6 27.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M40.4 15.2 Q40.9 16.9 42.6 17.4 Q40.9 17.9 40.4 19.6 Q39.9 17.9 38.2 17.4 Q39.9 16.9 40.4 15.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 46. Eikev · עֵקֶב

<img src="docs/parasha-emojis/eikev.svg" width="96" height="96" alt="A basket of the seven species">

**Reading:** Deuteronomy 7:12–11:25

**Summary:** Moses promises blessings if the people keep the mitzvot, praises the land of the seven species,
teaches the blessing after meals, and recalls the golden calf and the second tablets.

**Emoji: The seven species.** A basket of the seven species: wheat, barley, grapes, figs, pomegranates, olives
and dates (Deuteronomy 8:8).

**Why this emoji:** Eikev praises the Land of Israel as a land of wheat, barley, grapes, figs, pomegranates,
olives and dates, the seven species children learn about on Tu BiShvat, and a basket of them shows the blessing
of the land.

```html
<path d="M13.6 29 L11.4 19.2 M16.8 29 L16.4 17.4" stroke-width="3.8"/><path d="M13.6 29 L11.4 19.2 M16.8 29 L16.4 17.4" stroke="var(--hol-gold)" stroke-width="1.8"/><path d="M9.9 7.5 L11.2 3.6 M7.3 8.1 L4.6 5 M18.1 7.7 L20.3 4.7 M15.7 7.4 L14.4 3.9 " stroke-width="1.2"/><path d="M10.4 16.2 Q12.9 14.4 11.4 12.7 Q12.2 10.8 10.6 9.5 Q11 7.3 8.3 6.2 Q6.2 8.3 7.5 10.1 Q6.5 12 8.1 13.4 Q7.4 15.6 10.4 16.2Z M15.8 15.4 Q18.5 14.6 17.7 12.6 Q19 11.3 18 9.6 Q19 7.9 17.1 6.1 Q14.8 7.3 15.3 9.2 Q13.9 10.6 14.7 12.2 Q13.5 13.9 15.8 15.4Z " fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M32.4 19.6 Q37.2 18.9 39.4 14.5 Q34.5 15.2 32.4 19.6Z M32.4 19.6 Q36.3 21.6 40 19.3 Q36.1 17.4 32.4 19.6Z " fill="var(--hol-green)" stroke-width="1.3"/><path d="M34.2 16.6 a1.6 1.6 0 1 0 3.2 0 a1.6 1.6 0 1 0 -3.2 0 M37.9 19.4 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0" fill="var(--hol-navy)" stroke-width="1.2"/><path d="M7.2 28.4 C5.6 25.6 6.8 22.2 9.8 21.6 C11.2 21.4 12.2 20.6 12.8 19.6 C14.6 21.6 16.6 24 15.8 27.6Z" fill="var(--hol-green)" stroke-width="1.8"/><path d="M23.7 12.4 L23.7 10.1 L22 7.7 L23.6 8.7 L24.1 6.7 L25.1 8.7 L26 6.6 L26.4 8.8 L27.8 7.1 L27.9 9.1 L29.7 8.5 L27.4 10.4 L27 12.8Z" fill="var(--hol-red)" stroke-width="1.6"/><path d="M25.4 11.9 C30.6 12.1 33.8 15.8 33.1 20.8 C32.4 26 28.2 28.4 23.7 28 C19.2 27.5 15.7 24.2 16 19 C16.4 14 20.3 11 25.4 11.9Z" fill="var(--hol-red)"/><path d="M19.1 16.8 C19.9 14.2 22.1 12.9 24.5 12.8" stroke="var(--hol-gold-lt)" stroke-width="1.8"/><path d="M13.9 29.1 A2.7 1.7 -24 1 0 18.9 26.9 A2.7 1.7 -24 1 0 13.9 29.1Z M18.7 28.2 A2.7 1.7 8 1 0 24.1 29 A2.7 1.7 8 1 0 18.7 28.2Z M27.9 28.8 A2.6 1.7 -14 1 0 32.9 27.6 A2.6 1.7 -14 1 0 27.9 28.8Z" fill="var(--hol-flame)" stroke-width="1.4"/><path d="M6.8 30.2 L10.4 40.4 Q11 42.8 13.6 42.8 H34.4 Q37 42.8 37.6 40.4 L41.2 30.2Z" fill="var(--hol-gold)"/><path d="M8.8 34.8 H39.2 M10 39.2 H38 M11.6 31.6 V33.6 M13.8 36 V38 M16 31.6 V33.6 M18.2 36 V38 M20.4 31.6 V33.6 M22.6 36 V38 M24.8 31.6 V33.6 M27 36 V38 M29.2 31.6 V33.6 M31.4 36 V38 M33.6 31.6 V33.6 M35.8 36 V38 M38 31.6 V33.6 M40.2 36 V38" stroke="var(--hol-navy)" stroke-width="1.2"/><rect x="5.2" y="28" width="37.6" height="4.4" rx="2.2" fill="var(--hol-gold-lt)"/><path d="M35 22.4 C35.4 20.6 36.6 19.8 38.2 19.6" stroke-width="1.6"/><path d="M33.8 24.6 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 M37.9 25.4 a2.5 2.5 0 1 0 5 0 a2.5 2.5 0 1 0 -5 0 M35.2 28.6 a2.6 2.6 0 1 0 5.2 0 a2.6 2.6 0 1 0 -5.2 0 M39.2 29.6 a2.4 2.4 0 1 0 4.8 0 a2.4 2.4 0 1 0 -4.8 0 M36.9 32.6 a2.3 2.3 0 1 0 4.6 0 a2.3 2.3 0 1 0 -4.6 0" fill="var(--hol-blue)" stroke-width="1.5"/>
```

### 47. Re'eh · רְאֵה

<img src="docs/parasha-emojis/reeh.svg" width="96" height="96" alt="A coin dropping from a hand into a tzedakah box">

**Reading:** Deuteronomy 11:26–16:17

**Summary:** Moses sets before the people a blessing and a curse, and teaches the laws of kosher food, giving
tzedakah with an open hand, and celebrating Pesach, Shavuot and Sukkot.

**Emoji: Open your hand.** A coin for the tzedakah box: “Open your hand to the poor and the needy.” (Deuteronomy
15:7–11).

**Why this emoji:** Re’eh commands giving to the poor with an open hand and an open heart, the source of
tzedakah, and a coin dropping into a tzedakah box is a mitzvah children practice themselves.

```html
<path d="M28.4 30 L35 25.4 L35 38.8 L28.4 43.4Z" fill="var(--hol-navy)"/><path d="M6 30 L28.4 30 L28.4 43.4 L6 43.4Z" fill="var(--hol-blue)"/><path d="M6 30 L12.6 25.4 L35 25.4 L28.4 30Z" fill="var(--hol-paper)"/><path d="M13.4 27.7 H25.8" stroke="var(--hol-navy)" stroke-width="2.4"/><rect x="10.6" y="32.1" width="13.2" height="9.2" rx="2" fill="var(--hol-paper)" stroke-width="1.5"/><path d="M17.2 40.1 C16 39.1 13.8 37.4 13.8 35.6 C13.8 34.2 15 33.3 16 33.3 C16.7 33.3 17.1 33.7 17.2 34.2 C17.3 33.7 17.7 33.3 18.4 33.3 C19.4 33.3 20.6 34.2 20.6 35.6 C20.6 37.4 18.4 39.1 17.2 40.1Z" fill="var(--hol-red)" stroke-width="1.4"/><circle cx="19.6" cy="20.4" r="4.9" fill="var(--hol-gold)"/><path d="M16.9 19.4 A2.9 2.9 0 0 1 18.8 17.6" stroke="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M40 13.1 C38.2 14.6 36 15.8 33.7 16.5 L30.2 8.5 C32.2 7.2 34.6 6.3 36.8 6.1Z" stroke-width="1.7"/><path d="M33.4 15.4 L30.2 18.8 M32.1 13.6 L26.8 16.9 M31.2 11.6 L25 13.6 M30.8 9.4 L25.1 9.8" stroke-width="3.9"/><path d="M34.7 7.6 L30.6 4.7" stroke-width="4.2"/><path d="M40 13.1 C38.2 14.6 36 15.8 33.7 16.5 L30.2 8.5 C32.2 7.2 34.6 6.3 36.8 6.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M33.4 15.4 L30.2 18.8 M32.1 13.6 L26.8 16.9 M31.2 11.6 L25 13.6 M30.8 9.4 L25.1 9.8" stroke="var(--hol-gold-lt)" stroke-width="2.3"/><path d="M34.7 7.6 L30.6 4.7" stroke="var(--hol-gold-lt)" stroke-width="2.5"/><path d="M39.8 13.9 L36.1 5.7 L40.1 3.9 L43.8 12.2Z" fill="var(--hol-red)" stroke-width="1.7"/><path d="M9 9 Q9.6 11.2 11.8 11.8 Q9.6 12.4 9 14.6 Q8.4 12.4 6.2 11.8 Q8.4 11.2 9 9Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 48. Shoftim · שֹׁפְטִים

<img src="docs/parasha-emojis/shoftim.svg" width="96" height="96" alt="A judge’s gavel">

**Reading:** Deuteronomy 16:18–21:9

**Summary:** The people must appoint fair judges and pursue justice, the rules for a king, a prophet and the
cities of refuge are given, and even in war the fruit trees must not be cut down.

**Emoji: Justice, justice.** A judge’s gavel: “Justice, justice you shall pursue.” (Deuteronomy 16:20).

**Why this emoji:** Shoftim begins with appointing judges and the call “Justice, justice you shall pursue,” and
the gavel says “justice” at a glance while staying apart from the Yom Kippur scales.

```html
<path d="M6.4 35.4 V39.6 A15 4 0 0 0 36.4 39.6 V35.4 A15 4 0 0 1 6.4 35.4Z" fill="var(--hol-gold)"/><ellipse cx="21.4" cy="35.4" rx="15" ry="4" fill="var(--hol-gold-lt)"/><path d="M23.2 20.8 L37 27.6" stroke-width="5"/><path d="M23.2 20.8 L37 27.6" stroke="var(--hol-gold-lt)" stroke-width="3"/><circle cx="37.4" cy="27.8" r="2.6" fill="var(--hol-gold-lt)"/><path d="M17.7 12.8 L25.3 16.5 L21.1 25.2 L13.5 21.5Z" fill="var(--hol-gold)"/><path d="M18.3 9.4 L27.7 13.9 L26.2 17 L16.8 12.4Z M12.6 21 L22 25.6 L20.5 28.6 L11.1 24.1Z" fill="var(--hol-gold)"/><path d="M17.5 12.7 L25.5 16.7 L24.8 18.1 L16.8 14.2Z M14 19.9 L22 23.8 L21.3 25.3 L13.3 21.3Z" fill="var(--hol-navy)" stroke-width="1.4"/><path d="M39.8 7.6 Q40.5 9.9 42.8 10.6 Q40.5 11.3 39.8 13.6 Q39.1 11.3 36.8 10.6 Q39.1 9.9 39.8 7.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M9.6 7.4 Q10 9 11.6 9.4 Q10 9.8 9.6 11.4 Q9.2 9.8 7.6 9.4 Q9.2 9 9.6 7.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 49. Ki Teitzei · כִּי-תֵצֵא

<img src="docs/parasha-emojis/kiteitzei.svg" width="96" height="96" alt="A house with a railing around its roof">

**Reading:** Deuteronomy 21:10–25:19

**Summary:** Ki Teitzei holds more mitzvot than any other parasha, from returning lost things and sending away
the mother bird to building a railing on your roof and paying workers on time.

**Emoji: A railing for your roof.** Build a railing around your roof so that no one falls (Deuteronomy 22:8).

**Why this emoji:** Ki Teitzei holds more mitzvot than any other parasha, and the railing around the roof shows
one that children can picture right away: taking care of other people’s safety before anything happens.

```html
<path d="M31 27.4 L39 18.8 L39 34 L31 42.6Z" fill="var(--hol-gold)"/><path d="M5 27.4 L31 27.4 L39 18.8 L13 18.8Z" fill="var(--hol-paper)"/><path d="M13 18.8 L13 14 M5 22.6 L13 14 L39 14" stroke-width="2.8"/><path d="M13 18.8 L13 14 M5 22.6 L13 14 L39 14" stroke="var(--hol-gold)" stroke-width="1.3"/><path d="M15.4 17.9 V8.4 M15.4 14.7 Q10.7 13 10.5 9.8 Q13.9 10.7 15.4 14.7Z M15.4 13 Q19.9 12.2 20.5 9 Q16.9 9.2 15.4 13Z" fill="var(--hol-green)" stroke-width="1.5"/><path d="M15.4 4.3 A1.6 1.6 0 0 1 17.6 5.9 A1.6 1.6 0 0 1 16.8 8.6 A1.6 1.6 0 0 1 14 8.6 A1.6 1.6 0 0 1 13.2 5.9 A1.6 1.6 0 0 1 15.4 4.3 Z" fill="var(--hol-red)" stroke-width="1.3"/><path d="M12.2 17.5 H18.6 L17.8 23.2 H13Z" fill="var(--hol-flame)" stroke-width="1.5"/><rect x="5" y="27.4" width="26" height="15.2" fill="var(--hol-gold-lt)"/><path d="M11.2 42.6 V35.2 Q11.2 31.6 14.6 31.6 Q18 31.6 18 35.2 V42.6Z" fill="var(--hol-navy)"/><rect x="21.7" y="31.7" width="5.8" height="5.8" rx="0.6" fill="var(--hol-blue)" stroke-width="1.6"/><path d="M5 27.4 L5 22.6 M11.5 27.4 L11.5 22.6 M18 27.4 L18 22.6 M24.5 27.4 L24.5 22.6 M31 27.4 L31 22.6 M35 23.1 L35 18.3 M39 18.8 L39 14" stroke-width="2.9"/><path d="M5 27.4 L5 22.6 M11.5 27.4 L11.5 22.6 M18 27.4 L18 22.6 M24.5 27.4 L24.5 22.6 M31 27.4 L31 22.6 M35 23.1 L35 18.3 M39 18.8 L39 14" stroke="var(--hol-gold)" stroke-width="1.3"/><path d="M5 22.6 L31 22.6 L39 14" stroke-width="3.8"/><path d="M5 22.6 L31 22.6 L39 14" stroke="var(--hol-gold)" stroke-width="2"/><path d="M4 42.6 H44" stroke-width="2.4"/><path d="M41.4 6 Q41.9 7.9 43.8 8.4 Q41.9 8.9 41.4 10.8 Q40.9 8.9 39 8.4 Q40.9 7.9 41.4 6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 50. Ki Tavo · כִּי-תָבוֹא

<img src="docs/parasha-emojis/kitavo.svg" width="96" height="96" alt="A basket of first fruits with a flower garland">

**Reading:** Deuteronomy 26:1–29:8

**Summary:** Farmers bring their first fruits to the Temple with a declaration of thanks, the Torah is to be
written on stones after crossing the Jordan, and Moses describes the blessings and curses that follow the
people’s choices.

**Emoji: The first-fruits basket.** The basket of first fruits brought to the Temple with a declaration of thanks
(Deuteronomy 26:1–11).

**Why this emoji:** Ki Tavo opens with the bikkurim, the first fruits brought to the Temple in a basket with
words of thanks, a picture of gratitude that children recreate with baskets of fruit on Shavuot.

```html
<path d="M15.2 8 L16.8 4 M12.3 8.6 L9.4 5.3" stroke-width="1.3"/><path d="M18 26 L15.2 16.4" stroke-width="1.8"/><path d="M15.2 16.4 Q18.1 14.7 16.5 13 Q17.6 11.2 15.8 9.9 Q16.4 7.8 13.5 6.7 Q11.1 8.8 12.4 10.5 Q11.2 12.3 12.8 13.6 Q11.9 15.8 15.2 16.4Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M6.4 15.9 L5.5 13.9" stroke-width="1.6"/><path d="M6.3 15.7 C7.6 15.3 8.9 16.2 10.4 16.6 C12.8 17.2 14.4 19 14.6 20.9 C14.9 22.7 13.9 24.2 12.6 25.1 C11.4 25.9 9.6 26.3 7.9 25.4 C6.3 24.4 5.3 22.3 5.6 19.8 C5.8 18.3 5.4 16.8 6.3 15.7Z" fill="var(--hol-green)"/><path d="M8 22.1 Q9 23.9 10.7 24.1" stroke="var(--hol-gold-lt)" stroke-width="1.2"/><path d="M25.3 15.4 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z M30.9 15.4 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z M36.5 15.4 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M28.1 20.1 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z M33.7 20.1 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M30.9 24.8 a2.7 2.7 0 1 0 5.4 0 a2.7 2.7 0 1 0 -5.4 0Z" fill="var(--hol-blue)" stroke-width="1.5"/><path d="M26.4 14.4 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z M32 14.4 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z M37.6 14.4 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z M29.2 19.1 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z M34.8 19.1 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z M32 23.8 a0.7 0.7 0 1 0 1.4 0 a0.7 0.7 0 1 0 -1.4 0Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M17.8 15 L17.8 12.4 L15.8 9.6 L18.8 11 L20.4 8.8 L22 11 L25 9.6 L23 12.4 L23 15Z" fill="var(--hol-red)" stroke-width="1.4"/><path d="M20.4 13.2 C24.9 13.2 27.9 16.8 27.7 21 C27.6 25.4 24 27.6 20.4 27.6 C16.8 27.6 13.2 25.4 13.1 21 C12.9 16.8 15.9 13.2 20.4 13.2Z" fill="var(--hol-red)"/><path d="M16.4 17.8 Q16 21.4 18 24" stroke="var(--hol-paper)" stroke-width="1.4"/><path d="M7.4 29.6 C7.8 37 10.8 43 15.4 43 H32.6 C37.2 43 40.2 37 40.6 29.6Z" fill="var(--hol-gold)"/><path d="M10.9 38.1 L14.6 41.8 M8.6 30.6 L19.8 41.8 M13.8 30.6 L25 41.8 M19 30.6 L30.2 41.8 M24.2 30.6 L35.4 41.8 M10.2 30.6 L9 31.8 M29.4 30.6 L37.1 38.3 M15.4 30.6 L10.2 35.8 M34.6 30.6 L38.3 34.3 M20.6 30.6 L11.4 39.8 M25.8 30.6 L14.6 41.8 M31 30.6 L19.8 41.8 M36.2 30.6 L25 41.8 M38.5 33.5 L30.2 41.8 M36.3 40.9 L35.4 41.8" stroke="var(--hol-navy)" stroke-width="1.2"/><rect x="5" y="27.2" width="38" height="4.8" rx="2.4" fill="var(--hol-gold)"/><path d="M8.6 31.2 Q16.3 37.6 24 31.2 Q31.7 37.6 39.4 31.2" stroke-width="3.6"/><path d="M8.6 31.2 Q16.3 37.6 24 31.2 Q31.7 37.6 39.4 31.2" stroke="var(--hol-green)" stroke-width="1.8"/><path d="M7.4 29.2 A1.2 1.2 0 1 1 9.8 29.2 A1.2 1.2 0 1 1 10.5 31.4 A1.2 1.2 0 1 1 8.6 32.8 A1.2 1.2 0 1 1 6.7 31.4 A1.2 1.2 0 1 1 7.4 29.2 Z M38.2 29.2 A1.2 1.2 0 1 1 40.6 29.2 A1.2 1.2 0 1 1 41.3 31.4 A1.2 1.2 0 1 1 39.4 32.8 A1.2 1.2 0 1 1 37.5 31.4 A1.2 1.2 0 1 1 38.2 29.2 Z " fill="var(--hol-red)" stroke-width="1.3"/><path d="M22.8 29.2 A1.2 1.2 0 1 1 25.2 29.2 A1.2 1.2 0 1 1 25.9 31.4 A1.2 1.2 0 1 1 24 32.8 A1.2 1.2 0 1 1 22.1 31.4 A1.2 1.2 0 1 1 22.8 29.2 Z " fill="var(--hol-paper)" stroke-width="1.3"/><path d="M7.6 30.8 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0Z M23 30.8 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0Z M38.4 30.8 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0Z " fill="var(--hol-gold-lt)" stroke="none"/>
```

### 51. Nitzavim · נִצָּבִים

<img src="docs/parasha-emojis/nitzavim.svg" width="96" height="96" alt="A road that turns back to a little house">

**Reading:** Deuteronomy 29:9–30:20

**Summary:** The whole people stands together to enter God’s covenant, Moses promises that anyone can return to
God, teaches that the Torah is “not in heaven” but close to us, and urges, “Choose life.”

**Emoji: Returning.** A path that turns back home: anyone can return to God (Deuteronomy 30:1–10).

**Why this emoji:** Nitzavim is always read just before Rosh Hashanah and promises that anyone can return to God,
so the path that turns back home shows teshuvah, the theme of the season.

```html
<path d="M7 14 H31 A10.4 10.4 0 0 1 31 34.8 H23" stroke-width="7.8"/><path d="M7 14 H31 A10.4 10.4 0 0 1 31 34.8 H23" stroke="var(--hol-gold-lt)" stroke-width="5.6"/><path d="M11 14 H31 A10.4 10.4 0 0 1 31 34.8 H26.4" stroke="var(--hol-green)" stroke-width="2.4"/><path d="M29.2 31.4 L24.8 34.8 L29.2 38.2" stroke="var(--hol-green)" stroke-width="2.4"/><rect x="5.6" y="29" width="17" height="13" fill="var(--hol-paper)"/><path d="M4 30.2 L14.1 21 L24.2 30.2Z" fill="var(--hol-red)"/><rect x="7.6" y="32.4" width="5.2" height="5.6" rx="0.6" fill="var(--hol-gold-lt)" stroke="var(--hol-navy)" stroke-width="1.4"/><path d="M10.2 32.4 V38 M7.6 35.2 H12.8" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M15.2 42 V35.4 Q15.2 33 17.6 33 Q20 33 20 35.4 V42Z" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M4.2 42.6 H25.2" stroke-width="2.4"/>
```

### 52. Vayeilech · וַיֵּלֶךְ

<img src="docs/parasha-emojis/vayeilech.svg" width="96" height="96" alt="A quill, an inkwell and a parchment">

**Reading:** Deuteronomy 31:1–31:30

**Summary:** At 120 years old, Moses tells Joshua and the people to be strong and brave, writes down the Torah,
and commands that it be read to the whole people every seven years.

**Emoji: A quill writing the Torah.** Moses writes the Torah, and every Jew is commanded to write one
(Deuteronomy 31:9, 31:19).

**Why this emoji:** In Vayeilech, Moses writes down the Torah and gives it to the people, and the last of the 613
mitzvot is for every Jew to write a Torah scroll, so the quill links Moses’ work to each of us.

```html
<path d="M8 27.6 H27.6 Q28.8 27.6 28.8 28.8 V41.4 Q28.8 42.6 27.6 42.6 H8Z" fill="var(--hol-gold-lt)"/><rect x="4" y="26.2" width="6.4" height="17.8" rx="3" fill="var(--hol-gold)"/><path d="M14.6 31.8 H25 M13 35.2 H25 M17.4 38.6 H25" stroke="var(--hol-navy)" stroke-width="1.5"/><path d="M30.4 42.6 C29.6 39 29.6 35.6 31.4 33.6 C32.6 32.4 34.4 32 36.6 32 C38.8 32 40.6 32.4 41.8 33.6 C43.6 35.6 43.6 39 42.8 42.6Z" fill="var(--hol-blue)"/><ellipse cx="36.6" cy="32.4" rx="4.4" ry="1.6" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M35.1 30.3 L11.2 6.2" stroke-width="2"/><path d="M28.2 23.4 C28.3 17.6 23.3 11.2 17.5 7.4 C14.2 5.3 11.4 4.4 9.6 4.6 C9 7.3 9.7 10.9 13.6 15.5 C17.9 19.8 23.5 23.8 28.2 23.4Z" fill="var(--hol-paper)"/><path d="M23 17.9 L24.4 13.3 M18.8 13.6 L20 9.2 M23.8 19.2 L19.4 20.4 M19.6 14.9 L14.8 16.4 M15.3 10.6 L11.3 11.9" stroke="var(--hol-navy)" stroke-width="1.2"/><path d="M28.2 23.4 L11.2 6.2" stroke="var(--hol-navy)" stroke-width="1.3"/>
```

### 53. Ha'azinu · הַאֲזִינוּ

<img src="docs/parasha-emojis/haazinu.svg" width="96" height="96" alt="Two music notes with sound waves">

**Reading:** Deuteronomy 32:1–32:52

**Summary:** Moses sings a song calling on heaven and earth to listen, reminding the people how God cared for
them like an eagle over its nest, and God tells Moses to climb Mount Nebo to see the land.

**Emoji: The song of Moses.** Ha’azinu is a song: “Listen, O heavens, and let the earth hear.” (Deuteronomy
32:1).

**Why this emoji:** Ha’azinu is the song of Moses, written in a Torah scroll in its own special two-column
layout, and music notes show at a glance that this parasha is a song.

```html
<path d="M15.4 36.6 V12.9 M32.3 32.2 V8.5" stroke-width="6.6"/><path d="M16.4 34.4 A5.4 3.9 -24 1 1 6.6 38.8 A5.4 3.9 -24 1 1 16.4 34.4Z M33.3 30 A5.4 3.9 -24 1 1 23.5 34.4 A5.4 3.9 -24 1 1 33.3 30Z M14.1 12.2 L33.6 7.1 L33.6 12.1 L14.1 17.2Z" fill="var(--hol-line)" stroke-width="4"/><path d="M15.4 36.6 V12.9 M32.3 32.2 V8.5" stroke="var(--hol-gold)" stroke-width="2.6"/><path d="M16.4 34.4 A5.4 3.9 -24 1 1 6.6 38.8 A5.4 3.9 -24 1 1 16.4 34.4Z M33.3 30 A5.4 3.9 -24 1 1 23.5 34.4 A5.4 3.9 -24 1 1 33.3 30Z M14.1 12.2 L33.6 7.1 L33.6 12.1 L14.1 17.2Z" fill="var(--hol-gold)" stroke="none"/><path d="M8.3 36.8 Q8.9 34.2 11.7 34 M25.2 32.4 Q25.8 29.8 28.6 29.6" stroke="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M37.2 20.5 A5.2 5.2 0 0 1 37.2 27.5 M40.4 17.7 A9.4 9.4 0 0 1 40.4 30.3" stroke-width="2"/><path d="M7.2 5.2 Q7.9 7.9 10.6 8.6 Q7.9 9.3 7.2 12 Q6.5 9.3 3.8 8.6 Q6.5 7.9 7.2 5.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41 39 Q41.6 41 43.6 41.6 Q41.6 42.2 41 44.2 Q40.4 42.2 38.4 41.6 Q40.4 41 41 39Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M5.6 21.6 Q6 23.2 7.6 23.6 Q6 24 5.6 25.6 Q5.2 24 3.6 23.6 Q5.2 23.2 5.6 21.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 54. V'Zot HaBerachah · וְזֹאת הַבְּרָכָה

<img src="docs/parasha-emojis/vzothaberachah.svg" width="96" height="96" alt="A Simchat Torah flag with a little Torah scroll">

**Reading:** Deuteronomy 33:1–34:12

**Summary:** Moses blesses each of the tribes, climbs Mount Nebo to see the whole land, and dies there; this last
parasha is read on Simchat Torah, when the Torah ends and begins again.

**Emoji: The Simchat Torah flag.** A flag for Simchat Torah, when this parasha is read and the Torah begins again
(Deuteronomy 33:1).

**Why this emoji:** V’Zot HaBerachah is the one parasha never read on a Shabbat: it is read on Simchat Torah,
when the Torah ends and begins again with Bereshit, so the flag children wave that day closes the circle back to
the first icon.

```html
<g transform="rotate(12 8.9 43.6)"><path d="M8.9 9.4 L8.9 42.4" stroke-width="4.8"/><path d="M8.9 9.4 L8.9 42.4" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M10.4 12 L11.9 11.3 L13.4 10.6 L14.9 10 L16.4 9.6 L17.8 9.3 L19.3 9.2 L20.8 9.3 L22.3 9.6 L23.8 10 L25.3 10.6 L26.8 11.3 L28.3 12 L29.8 12.7 L31.2 13.4 L32.7 14 L34.2 14.4 L35.7 14.7 L37.2 14.8 L37.2 34.8 L35.7 34.7 L34.2 34.4 L32.7 34 L31.2 33.4 L29.8 32.7 L28.3 32 L26.8 31.3 L25.3 30.6 L23.8 30 L22.3 29.6 L20.8 29.3 L19.3 29.2 L17.8 29.3 L16.4 29.6 L14.9 30 L13.4 30.6 L11.9 31.3 L10.4 32Z" fill="var(--hol-paper)"/><path d="M13 13.4 L14.2 12.9 L15.4 12.4 L16.6 12.1 L17.8 11.9 L19 11.8 L20.2 11.8 L21.4 12 L22.6 12.2 L23.8 12.6 L25 13.1 L26.2 13.6 L27.4 14.2 L28.6 14.8 L29.8 15.3 L31 15.9 L32.2 16.4 L33.4 16.8 L34.6 17.1 L34.6 31.9 L33.4 31.6 L32.2 31.2 L31 30.7 L29.8 30.1 L28.6 29.6 L27.4 29 L26.2 28.4 L25 27.9 L23.8 27.4 L22.6 27 L21.4 26.8 L20.2 26.6 L19 26.6 L17.8 26.7 L16.6 26.9 L15.4 27.2 L14.2 27.7 L13 28.2Z" stroke="var(--hol-blue)" stroke-width="2.2"/><rect x="19.6" y="16.3" width="8.4" height="7.4" fill="var(--hol-gold-lt)" stroke="var(--hol-navy)" stroke-width="1.3"/><path d="M21.2 18.8 H26.4 M21.2 21.4 H25.2" stroke="var(--hol-navy)" stroke-width="1.1"/><path d="M17.2 16 A1.2 1.2 0 0 1 19.6 16 V24 A1.2 1.2 0 0 1 17.2 24Z M28 16 A1.2 1.2 0 0 1 30.4 16 V24 A1.2 1.2 0 0 1 28 24Z" fill="var(--hol-gold)" stroke="var(--hol-navy)" stroke-width="1.3"/><circle cx="8.9" cy="8.2" r="3" fill="var(--hol-red)"/><circle cx="7.9" cy="7.2" r="0.8" fill="var(--hol-paper)" stroke="none"/></g><path d="M38.8 5.4 Q39.5 7.9 42 8.6 Q39.5 9.3 38.8 11.8 Q38.1 9.3 35.6 8.6 Q38.1 7.9 38.8 5.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M5.8 19.2 Q6.3 20.9 8 21.4 Q6.3 21.9 5.8 23.6 Q5.3 21.9 3.6 21.4 Q5.3 20.9 5.8 19.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M42.6 39.4 Q43.1 41.1 44.8 41.6 Q43.1 42.1 42.6 43.8 Q42.1 42.1 40.4 41.6 Q42.1 41.1 42.6 39.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```
