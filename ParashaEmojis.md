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
| 24 | Vayikra | וַיִּקְרָא |  |  |
| 25 | Tzav | צַו |  |  |
| 26 | Shemini | שְׁמִינִי |  |  |
| 27 | Tazria | תַזְרִיעַ |  |  |
| 28 | Metzora | מְצֹרָע |  |  |
| 29 | Achrei Mot | אַחֲרֵי מוֹת |  |  |
| 30 | Kedoshim | קְדֹשִׁים |  |  |
| 31 | Emor | אֱמֹר |  |  |
| 32 | Behar | בְּהַר |  |  |
| 33 | Bechukotai | בְּחֻקֹּתַי |  |  |
| 34 | Bamidbar | בְּמִדְבַּר |  |  |
| 35 | Nasso | נָשֹׂא |  |  |
| 36 | Beha'alotcha | בְּהַעֲלֹתְךָ |  |  |
| 37 | Sh'lach | שְׁלַח לְךָ |  |  |
| 38 | Korach | קֹרַח |  |  |
| 39 | Chukat | חֻקַּת |  |  |
| 40 | Balak | בָּלָק |  |  |
| 41 | Pinchas | פִּינְחָס |  |  |
| 42 | Matot | מַטּוֹת |  |  |
| 43 | Masei | מַסְעֵי |  |  |
| 44 | Devarim | דְּבָרִים |  |  |
| 45 | Va'etchanan | וָאֶתְחַנַּן |  |  |
| 46 | Eikev | עֵקֶב |  |  |
| 47 | Re'eh | רְאֵה |  |  |
| 48 | Shoftim | שֹׁפְטִים |  |  |
| 49 | Ki Teitzei | כִּי-תֵצֵא |  |  |
| 50 | Ki Tavo | כִּי-תָבוֹא |  |  |
| 51 | Nitzavim | נִצָּבִים |  |  |
| 52 | Vayeilech | וַיֵּלֶךְ |  |  |
| 53 | Ha'azinu | הַאֲזִינוּ |  |  |
| 54 | V'Zot HaBerachah | וְזֹאת הַבְּרָכָה |  |  |

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
