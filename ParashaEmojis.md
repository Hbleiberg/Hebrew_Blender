# Parasha emojis

One small emoji-style picture for each of the 54 weekly Torah portions, made for the classroom dashboard's
parsha line and the Torah Trainer. Each drawing was chosen from three drafts, the way the suite's holiday and
weather icons were, and each portion carries a one-sentence summary.

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
| 13 | Shemot | שְׁמוֹת |  |  |
| 14 | Va'eira | וָאֵרָא |  |  |
| 15 | Bo | בֹּא |  |  |
| 16 | Beshalach | בְּשַׁלַּח |  |  |
| 17 | Yitro | יִתְרוֹ |  |  |
| 18 | Mishpatim | מִשְׁפָּטִים |  |  |
| 19 | Terumah | תְּרוּמָה |  |  |
| 20 | Tetzaveh | תְּצַוֶּה |  |  |
| 21 | Ki Tisa | כִּי תִשָּׂא |  |  |
| 22 | Vayakhel | וַיַּקְהֵל |  |  |
| 23 | Pekudei | פְקוּדֵי |  |  |
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

**Genesis 1:1–6:8.** God creates the world in six days and rests on the seventh, Adam and Eve eat the forbidden
fruit and must leave the Garden of Eden, Cain kills his brother Abel, and by the tenth generation only Noah finds
favor in God’s eyes.

<img src="docs/parasha-emojis/bereshit.svg" width="96" height="96" alt="The earth with the sun, the moon and stars">

**The heavens and the earth:** the newly made world, with the sun, moon and stars set in the sky (Genesis 1:1–19).

```html
<path d="M44 10 L46 10 M42.1 14.5 L43.5 15.9 M37.6 16.4 L37.6 18.4 M33.1 14.5 L31.7 15.9 M31.2 10 L29.2 10 M33.1 5.5 L31.7 4.1 M37.6 3.6 L37.6 1.6 M42.1 5.5 L43.5 4.1" stroke-width="2"/><circle cx="37.6" cy="10" r="4.5" fill="var(--hol-flame)"/><path d="M8.6 3.8 A5.2 5.2 0 1 0 13.7 10.7 A4.3 4.3 0 0 1 8.6 3.8Z" fill="var(--hol-gold-lt)" stroke-width="1.6"/><circle cx="20" cy="29" r="14" fill="var(--hol-blue)" stroke="none"/><path d="M11.4 40 A14 14 0 0 1 9.6 19.6 C12.6 18 16.6 18.6 17.2 21.4 C17.8 24.2 14.4 25 15 27.6 C15.6 30.2 18.6 30.6 18.2 33.6 C17.8 36.6 14.4 37.6 11.4 40Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M25.2 16 A14 14 0 0 1 26.6 41.4 C25.4 39.6 24 36.6 25.6 34.2 C27.2 31.8 30.4 32.2 30.2 29.2 C30 26.2 25.8 26.6 25 23.6 C24.2 20.6 25.6 16.4 25.2 16Z" fill="var(--hol-green)" stroke-width="1.4"/><circle cx="20" cy="29" r="14"/><path d="M23 3.4 Q23.7 5.7 26 6.4 Q23.7 7.1 23 9.4 Q22.3 7.1 20 6.4 Q22.3 5.7 23 3.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41.6 24.5 Q42.2 26.8 44.5 27.4 Q42.2 28 41.6 30.3 Q41 28 38.7 27.4 Q41 26.8 41.6 24.5Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 2. Noach · נֹחַ

**Genesis 6:9–11:32.** Noah builds an ark that carries his family and the animals through the Flood, a dove
brings back an olive leaf, God sets a rainbow in the clouds as a promise never to flood the world again, and the
builders of the Tower of Babel are scattered.

<img src="docs/parasha-emojis/noach.svg" width="96" height="96" alt="A rainbow between two clouds">

**The rainbow:** the rainbow God sets in the clouds as a sign of the promise never to flood the world again (Genesis 9:12–17).

```html
<path d="M5 33.6 A19 19 0 0 1 43 33.6 L40.1 33.6 A16.1 16.1 0 0 0 8 33.6Z" fill="var(--hol-red)" stroke="none"/><path d="M8 33.6 A16.1 16.1 0 0 1 40.1 33.6 L37.1 33.6 A13.1 13.1 0 0 0 10.9 33.6Z" fill="var(--hol-flame)" stroke="none"/><path d="M10.9 33.6 A13.1 13.1 0 0 1 37.1 33.6 L34.2 33.6 A10.1 10.1 0 0 0 13.9 33.6Z" fill="var(--hol-green)" stroke="none"/><path d="M13.9 33.6 A10.1 10.1 0 0 1 34.2 33.6 L31.2 33.6 A7.2 7.2 0 0 0 16.8 33.6Z" fill="var(--hol-blue)" stroke="none"/><path d="M5 33.6 A19 19 0 0 1 43 33.6 M16.8 33.6 A7.2 7.2 0 0 1 31.2 33.6"/><path d="M6.5 37.4 A3.4 3.4 0 0 1 6.7 30.8 A4.6 4.6 0 0 1 15.5 30.8 A3.4 3.4 0 0 1 16.2 37.4Z" fill="var(--hol-paper)"/><path d="M31.8 37.4 A3.4 3.4 0 0 1 32.5 30.8 A4.6 4.6 0 0 1 41.3 30.8 A3.4 3.4 0 0 1 41.5 37.4Z" fill="var(--hol-paper)"/><path d="M7 7.4 Q7.7 9.7 10 10.4 Q7.7 11.1 7 13.4 Q6.3 11.1 4 10.4 Q6.3 9.7 7 7.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M41 7.4 Q41.7 9.7 44 10.4 Q41.7 11.1 41 13.4 Q40.3 11.1 38 10.4 Q40.3 9.7 41 7.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 3. Lech-Lecha · לֶךְ-לְךָ

**Genesis 12:1–17:27.** God tells Abram to leave his land and his father’s house and go to Canaan, promises him
children as many as the stars, and makes a covenant with him, changing his name to Abraham.

<img src="docs/parasha-emojis/lechlecha.svg" width="96" height="96" alt="Two footprints walking forward">

**Go!** Footsteps setting out, as God tells Abram: לֶךְ לְךָ, go from your land (Genesis 12:1).

```html
<path d="M7.1 38.8 C4.5 37 5.2 34.4 6.9 32.2 C8.6 30 9.1 27.5 10.4 25.2 C12.1 22.4 15.1 22 17.5 23.7 C20.2 25.6 20.5 28.7 18.5 30.9 C16.8 32.8 14.2 32.8 12.7 35.3 C11 38 9.6 40.6 7.1 38.8Z" fill="var(--hol-gold-lt)"/><circle cx="21.8" cy="22.6" r="2.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="19.3" cy="19.9" r="1.7" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="16.6" cy="18.9" r="1.5" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="13.8" cy="19.1" r="1.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><path d="M25.6 29.8 C28.2 31.6 30.4 30 31.9 27.7 C33.4 25.4 35.6 24 37.2 22 C39.4 19.5 38.7 16.6 36.3 14.9 C33.6 13 30.6 13.8 29.2 16.4 C27.9 18.7 28.8 21.1 27 23.4 C25 25.8 23 28 25.6 29.8Z" fill="var(--hol-gold-lt)"/><circle cx="35.8" cy="10.5" r="2.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="39.2" cy="11.8" r="1.7" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="41" cy="14" r="1.5" fill="var(--hol-gold-lt)" stroke-width="1.4"/><circle cx="41.8" cy="16.7" r="1.3" fill="var(--hol-gold-lt)" stroke-width="1.4"/>
```

### 4. Vayera · וַיֵּרָא

**Genesis 18:1–22:24.** Abraham welcomes three visitors who promise that Sarah will have a son, Sodom is
destroyed, Isaac is born, and Abraham’s faith is tested at the binding of Isaac, where a ram is offered in
Isaac’s place.

<img src="docs/parasha-emojis/vayera.svg" width="96" height="96" alt="A ram’s head in a green bush">

**The ram in the thicket:** the ram caught by its horns in a bush, offered in Isaac’s place (Genesis 22:13).

```html
<path d="M19.6 16 C17 10.4 11.4 9 8.6 12.6 C5.8 16.2 7.6 21.8 11.6 22 C14.8 22.2 15.6 18.2 13.2 17 M28.4 16 C31 10.4 36.6 9 39.4 12.6 C42.2 16.2 40.4 21.8 36.4 22 C33.2 22.2 32.4 18.2 34.8 17" stroke-width="6"/><path d="M19.6 16 C17 10.4 11.4 9 8.6 12.6 C5.8 16.2 7.6 21.8 11.6 22 C14.8 22.2 15.6 18.2 13.2 17 M28.4 16 C31 10.4 36.6 9 39.4 12.6 C42.2 16.2 40.4 21.8 36.4 22 C33.2 22.2 32.4 18.2 34.8 17" stroke="var(--hol-gold)" stroke-width="3.6"/><path d="M4.4 28.4 C3.4 25 5.2 21.6 8.6 22.2 C9.2 19 13 18.2 15 20.6 C16.6 19.4 18.8 20 19.4 21.8 H28.6 C29.2 20 31.4 19.4 33 20.6 C35 18.2 38.8 19 39.4 22.2 C42.8 21.6 44.6 25 43.6 28.4 C44.8 31 43.8 34.4 40.6 34.6 C39.4 38 34.6 38.6 32.6 36 H15.4 C13.4 38.6 8.6 38 7.4 34.6 C4.2 34.4 3.2 31 4.4 28.4Z" fill="var(--hol-green)"/><path d="M18 22.8 C15.4 21.8 12.2 22.8 11.2 24.8 C13.6 26 16.6 25.6 18.4 24.8Z M30 22.8 C32.6 21.8 35.8 22.8 36.8 24.8 C34.4 26 31.4 25.6 29.6 24.8Z" fill="var(--hol-gold-lt)" stroke-width="1.5"/><path d="M17.2 20.4 C17.2 16 20.4 14 24 14 C27.6 14 30.8 16 30.8 20.4 C30.8 26 29.4 31.6 28.4 35.4 C27.8 37.8 26.2 39.2 24 39.2 C21.8 39.2 20.2 37.8 19.6 35.4 C18.6 31.6 17.2 26 17.2 20.4Z" fill="var(--hol-gold-lt)"/><path d="M17.6 19.6 C15.6 17.8 16.4 14.2 19.2 14 C19.4 11.2 22.6 10 24.4 11.4 C26.2 10 29.4 11 29.4 13.8 C32.2 14 32.8 17.8 30.4 19.6 C28.2 18 20 18 17.6 19.6Z" fill="var(--hol-paper)"/><path d="M19.6 25.2 a1.5 1.5 0 1 0 2.9 0 a1.5 1.5 0 1 0 -2.9 0 M25.6 25.2 a1.5 1.5 0 1 0 2.9 0 a1.5 1.5 0 1 0 -2.9 0" fill="var(--hol-navy)" stroke="none"/><path d="M17.9 29 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0 M27.1 29 a1.5 1.5 0 1 0 3 0 a1.5 1.5 0 1 0 -3 0" fill="var(--hol-flame)" stroke="none"/><path d="M22.4 33 Q24 34 25.6 33 M24 33.6 V37.8 M24 35.2 Q22.6 36.6 21.4 35.8 M24 35.2 Q25.4 36.6 26.6 35.8" stroke="var(--hol-navy)" stroke-width="1.4"/>
```

### 5. Chayei Sara · חַיֵּי שָׂרָה

**Genesis 23:1–25:18.** After Sarah dies, Abraham buys the Cave of Machpelah in Hebron to bury her, and his
servant finds Rebecca at the well, where her kindness to his camels shows she is the right wife for Isaac.

<img src="docs/parasha-emojis/chayeisara.svg" width="96" height="96" alt="A stone well with a water jar">

**Rebecca at the well:** the well and Rebecca’s water jar (Genesis 24:15–20).

```html
<path d="M6 23.6 V35.4 A14.5 6 0 0 0 35 35.4 V23.6Z" fill="var(--hol-gold-lt)"/><path d="M6 29.5 A14.5 6 0 0 0 35 29.5 M13.5 28.9 V34.8 M27.5 28.9 V34.8 M20.5 35.5 V41.4 M8.9 33.1 V39 M32.1 33.1 V39" stroke-width="1.3"/><ellipse cx="20.5" cy="23.6" rx="14.5" ry="6" fill="var(--hol-gold-lt)"/><ellipse cx="20.5" cy="23.900000000000002" rx="10.9" ry="4.2" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M30.9 24.5 C27.4 24.5 25.7 19.4 26.4 16.5 C26.9 14.3 28.3 13.4 28.2 12.2 L28 11.4 L26.7 10.9 L26.3 9.3 L33.3 7.6 L33.7 9.2 L32.7 10.2 L32.9 11 C33.4 12.1 35.1 12.3 36.5 14 C38.5 16.2 39.8 21.4 36.3 23.1Z" fill="var(--hol-flame)"/><path d="M26.4 19.2 C30.4 19.4 34.3 18.5 37.8 16.4" stroke-width="1.3"/><ellipse cx="29.8" cy="8.5" rx="3.1" ry="1.1" transform="rotate(-14 29.8 8.5)" fill="var(--hol-blue)" stroke-width="1.3"/><path d="M24.4 11.3 C25.8 12.8 25.6 14.2 24.4 14.2 C23.2 14.2 23 12.8 24.4 11.3Z" fill="var(--hol-blue)" stroke-width="1.3"/><path d="M23.2 15.7 C25 17.7 24.8 19.5 23.2 19.5 C21.6 19.5 21.4 17.7 23.2 15.7Z" fill="var(--hol-blue)" stroke-width="1.3"/>
```

### 6. Toldot · תּוֹלְדוֹת

**Genesis 25:19–28:9.** Rebecca gives birth to twins, Esau sells his birthright to Jacob for a bowl of red lentil
stew, and Jacob, dressed in goatskins, receives the blessing Isaac meant for Esau.

<img src="docs/parasha-emojis/toldot.svg" width="96" height="96" alt="Two baby faces, one with red hair">

**The twins:** twin babies, Esau with his red hair and his brother Jacob (Genesis 25:24–26).

```html
<circle cx="32.9" cy="29.6" r="11" fill="var(--hol-gold-lt)"/><path d="M31.9 18.6 C30.3 15 34.5 12 36.9 14.2 C38.5 15.8 36.5 18 35.1 16.8" stroke-width="1.8"/><circle cx="29.1" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><circle cx="36.7" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><path d="M30.4 33.2 Q32.9 35.5 35.4 33.2" stroke="var(--hol-navy)" stroke-width="1.5"/><circle cx="26.6" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="39.2" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="15.1" cy="29.6" r="11" fill="var(--hol-gold-lt)"/><path d="M6.9 22.2 C8.1 15 11.5 13.5 13 15.9 C13 12.3 17.9 11.8 18.3 15.2 C20.2 13.1 23.6 15 22.5 18 C24.6 18.8 24.8 21.1 23.3 22.2 C21.9 20.5 19.3 19.7 17.2 21.1 C14.9 19.2 11.5 19.9 10 22Z" fill="var(--hol-red)"/><circle cx="11.3" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><circle cx="18.9" cy="29" r="1.3" fill="var(--hol-navy)" stroke="none"/><path d="M12.6 33.2 Q15.1 35.5 17.6 33.2" stroke="var(--hol-navy)" stroke-width="1.5"/><circle cx="8.8" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/><circle cx="21.4" cy="32.4" r="1.6" fill="var(--hol-red)" stroke="none"/>
```

### 7. Vayetzei · וַיֵּצֵא

**Genesis 28:10–32:3.** Jacob dreams of a ladder reaching to heaven with angels going up and down it, works
twenty years for Laban, marries Leah and Rachel, and his family grows to eleven sons and a daughter.

<img src="docs/parasha-emojis/vayetzei.svg" width="96" height="96" alt="A ladder rising into a cloud">

**Jacob’s ladder:** the ladder reaching up to heaven; the sparkles are the angels going up and down (Genesis 28:12).

```html
<path d="M4.6 41.4 H24.6" stroke-width="2.4"/><path d="M8.2 39.6 L26.7 7.6 M18.1 39.6 L34.1 11.9 M12.1 32.9 L19.5 37.2 M15.1 27.7 L22.5 32 M18.1 22.5 L25.5 26.8 M21.1 17.3 L28.5 21.6 M24.1 12.1 L31.5 16.4" stroke-width="4.8"/><path d="M8.2 39.6 L26.7 7.6 M18.1 39.6 L34.1 11.9 M12.1 32.9 L19.5 37.2 M15.1 27.7 L22.5 32 M18.1 22.5 L25.5 26.8 M21.1 17.3 L28.5 21.6 M24.1 12.1 L31.5 16.4" stroke="var(--hol-gold)" stroke-width="2.4"/><path d="M22 15.6 C18.6 15.6 18.4 10.6 22 10.4 C22.4 6.6 27 5.2 29.6 7.6 C31.4 3.6 38 3.8 39.2 8.4 C42.8 8.2 44.4 12.4 42.2 14.6 C41.6 15.2 40.8 15.6 39.8 15.6Z" fill="var(--hol-paper)"/><path d="M7.4 20.2 Q8.1 22.7 10.6 23.4 Q8.1 24.1 7.4 26.6 Q6.7 24.1 4.2 23.4 Q6.7 22.7 7.4 20.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M33.8 24.4 Q34.5 26.7 36.8 27.4 Q34.5 28.1 33.8 30.4 Q33.1 28.1 30.8 27.4 Q33.1 26.7 33.8 24.4Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M15.8 7.6 Q16.3 9.3 18 9.8 Q16.3 10.3 15.8 12 Q15.3 10.3 13.6 9.8 Q15.3 9.3 15.8 7.6Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 8. Vayishlach · וַיִּשְׁלַח

**Genesis 32:4–36:43.** Jacob sends gifts ahead to Esau, wrestles all night with an angel and is renamed Israel,
the brothers meet in peace, and Rachel dies giving birth to Benjamin.

<img src="docs/parasha-emojis/vayishlach.svg" width="96" height="96" alt="Two hands shaking, with a heart above">

**Making peace:** a handshake as Esau runs to meet Jacob and the brothers make peace; Esau’s sleeve is red, for Edom (Genesis 33:4).

```html
<path d="M38.4 29.5 C34.7 27.6 30.9 26.9 26 26.3 L23.8 37.9 C28.6 38.6 32.5 39.2 36.5 39.3Z" fill="var(--hol-gold-lt)"/><path d="M37.2 27.1 L43.3 27.7 A1 1 0 0 1 44.1 28.8 L41.3 43.1 A1 1 0 0 1 40.2 43.8 L34.3 42.1Z" fill="var(--hol-blue)"/><path d="M10 30.7 C13.1 28.8 15.6 26 19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8 L24.4 27.8 L26.2 38.7 C20 40 16.1 40.4 11.5 40.1Z" fill="var(--hol-gold-lt)"/><path d="M20.8 26.4 L28.4 25.2 A1.6 1.6 0 0 1 28.9 28.4 L30.4 28.1 A1.6 1.6 0 0 1 30.9 31.3 L30.7 31.3 A1.6 1.6 0 0 1 31.2 34.5 L29.9 34.8 A1.6 1.6 0 0 1 30.4 37.9 L22.8 39.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M23.5 25.9 L28.4 25.2 A1.6 1.6 0 0 1 28.9 28.4 L30.4 28.1 A1.6 1.6 0 0 1 30.9 31.3 L30.7 31.3 A1.6 1.6 0 0 1 31.2 34.5 L29.9 34.8 A1.6 1.6 0 0 1 30.4 37.9 L23.6 39"/><path d="M24.8 29 L28.9 28.4 M25.3 32.2 L30.9 31.3 M25.8 35.4 L31.2 34.5" stroke-width="1.4"/><path d="M19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8 L20.3 28Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M19.7 24.2 C22.7 22.9 25.9 22.2 28.8 21.7 A1.8 1.8 0 0 1 29.6 25.2 C26.3 25.9 23.8 26.7 21.8 27.8"/><path d="M11 27.3 L5 27.7 A1 1 0 0 0 4.1 28.8 L6.4 43.1 A1 1 0 0 0 7.5 44 L13.4 42.4Z" fill="var(--hol-red)"/><path d="M26.6 14.6 C25.1 13.3 22.2 11.1 22.2 8.7 C22.2 6.9 23.7 5.8 25 5.8 C25.9 5.8 26.4 6.3 26.6 6.9 C26.8 6.3 27.3 5.8 28.2 5.8 C29.5 5.8 31 6.9 31 8.7 C31 11.1 28.1 13.3 26.6 14.6Z" fill="var(--hol-red)" stroke-width="1.6"/>
```

### 9. Vayeshev · וַיֵּשֶׁב

**Genesis 37:1–40:23.** Jacob gives Joseph a coat of many colors, Joseph’s dreams make his brothers jealous
enough to sell him, and in Egypt he lands in prison, where he explains the dreams of Pharaoh’s butler and baker.

<img src="docs/parasha-emojis/vayeshev.svg" width="96" height="96" alt="A striped coat of many colors">

**The coat of many colors:** Joseph’s coat of many colors, a gift from his father (Genesis 37:3).

```html
<path d="M20.4 5.4 L21.3 6.6 L22.2 7.5 L23.1 8 L24 8.2 L24.9 8 L25.8 7.5 L26.7 6.6 L27.6 5.4 L30.4 6.2 L40.7 13.1 L7.3 13.1 L17.6 6.2Z" fill="var(--hol-red)" stroke="none"/><path d="M40.6 13 L44.2 15.4 L41.6 20.7 L40.3 20.7 L30.8 16.8 L31.6 20.7 L16.4 20.7 L17.2 16.8 L7.7 20.7 L6.4 20.7 L3.8 15.4 L7.4 13Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M41.7 20.6 L41.4 21.2 L40 20.6 L31.6 20.6 L33.1 28.4 L14.9 28.4 L16.4 20.6 L8 20.6 L6.6 21.2 L6.3 20.6Z" fill="var(--hol-blue)" stroke="none"/><path d="M33.1 28.3 L34.7 36 L13.3 36 L14.9 28.3Z" fill="var(--hol-flame)" stroke="none"/><path d="M34.7 35.9 L36.2 43.6 L11.8 43.6 L13.3 35.9Z" fill="var(--hol-green)" stroke="none"/><path d="M7.3 13 H40.7 M6.3 20.7 H7.9 M16.4 20.7 H31.6 M40.1 20.7 H41.7 M14.9 28.3 H33.1 M13.3 36 H34.7" stroke-width="1.2"/><path d="M20.4 5.4 L21.3 6.6 L22.2 7.5 L23.1 8 L24 8.2 L24.9 8 L25.8 7.5 L26.7 6.6 L27.6 5.4 L30.4 6.2 L44.2 15.4 L41.4 21.2 L30.8 16.8 L36.2 43.6 L11.8 43.6 L17.2 16.8 L6.6 21.2 L3.8 15.4 L17.6 6.2Z"/>
```

### 10. Miketz · מִקֵּץ

**Genesis 41:1–44:17.** Joseph explains Pharaoh’s dreams of seven fat and seven thin cows, is put in charge of
Egypt to store grain for the famine, and tests his brothers when they come to buy food by hiding his silver
goblet in Benjamin’s sack.

<img src="docs/parasha-emojis/miketz.svg" width="96" height="96" alt="A silver goblet in a sack of grain">

**The silver goblet in the sack:** Joseph’s silver goblet, hidden in Benjamin’s sack of grain (Genesis 44:1–12).

```html
<path d="M3.6 43.6 H44.4" stroke-width="2.4"/><path d="M19.8 26.2 C16.4 23.8 11.2 20.6 11.8 17.2 A12.2 2.8 0 0 1 36.2 17.2 C36.8 20.6 31.6 23.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M12.8 17.6 C17 11.6 31 11.6 35.2 17.6 A11.2 2.1999999999999997 0 0 1 12.8 17.6Z" fill="var(--hol-gold)"/><path d="M22 22.1 L23.5 15.6 L25.4 16 L24.1 22.5Z" fill="var(--hol-paper)"/><path d="M22.2 16.4 C22.5 15.3 26.4 16.1 26.2 17.2 C25.9 18.4 22 17.5 22.2 16.4Z" fill="var(--hol-paper)" stroke-width="1.5"/><path d="M21.2 5.4 C20.2 10 21.5 14.3 24.6 14.9 C27.7 15.6 30.6 12.2 31.6 7.6Z" fill="var(--hol-paper)"/><path d="M21.2 5.4 C21.6 3.5 32 5.7 31.6 7.6 C31.2 9.5 20.8 7.3 21.2 5.4Z" fill="var(--hol-navy)" stroke-width="1.6"/><path d="M19.8 26.2 C16.4 23.8 11.2 20.6 11.8 17.2 Q14.2 20.6 18.2 19.6 Q21 21.4 24 20 Q27 21.4 29.8 19.6 Q33.8 20.6 36.2 17.2 C36.8 20.6 31.6 23.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M19.8 26.2 C13.8 28.8 8.6 32.2 8.6 37.6 C8.6 41.6 10.4 42.8 13 42.8 L35 42.8 C37.6 42.8 39.4 41.6 39.4 37.6 C39.4 32.2 34.2 28.8 28.2 26.2Z" fill="var(--hol-gold-lt)"/><path d="M14.4 32.8 C12.8 36 13 39.6 14.6 42.6" stroke-width="1.2"/><path d="M18.8 26.4 L29.2 26.4" stroke-width="3.8"/><path d="M18.8 26.4 L29.2 26.4" stroke="var(--hol-red)" stroke-width="1.8"/><path d="M37.4 6.2 Q38.1 8.9 40.8 9.6 Q38.1 10.3 37.4 13 Q36.7 10.3 34 9.6 Q36.7 8.9 37.4 6.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/><path d="M10.8 9.2 Q11.3 10.9 13 11.4 Q11.3 11.9 10.8 13.6 Q10.3 11.9 8.6 11.4 Q10.3 10.9 10.8 9.2Z" fill="var(--hol-gold-lt)" stroke-width="1.3"/>
```

### 11. Vayigash · וַיִּגַּשׁ

**Genesis 44:18–47:27.** Judah offers to stay as a slave in Benjamin’s place, Joseph tells his brothers who he
is, and Jacob’s whole family moves down to Egypt to live in the land of Goshen.

<img src="docs/parasha-emojis/vayigash.svg" width="96" height="96" alt="Two pyramids, a palm tree and the Nile">

**Down to Egypt:** pyramids, a palm tree and the Nile, as Jacob’s family settles in Goshen in Egypt (Genesis 46:5–7, 47:27).

```html
<path d="M36.4 20.5 L44 38 H26.6Z" fill="var(--hol-gold-lt)"/><path d="M36.4 20.5 L39.2 38 H44Z" fill="var(--hol-gold)"/><path d="M25 8.5 L39.8 38 H10.2Z" fill="var(--hol-gold-lt)"/><path d="M25 8.5 L30 38 H39.8Z" fill="var(--hol-gold)"/><path d="M9.6 38.6 C10.6 32 11.8 26 10.8 18.6" stroke-width="4.8"/><path d="M9.6 38.6 C10.6 32 11.8 26 10.8 18.6" stroke="var(--hol-gold)" stroke-width="2.6"/><path d="M10.8 18 Q3.8 16.7 4.2 23.8 Q7.8 21.2 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q18 16.7 18.2 24 Q14.2 21.3 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q10.1 11.6 3.8 13 Q6.8 16.2 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q11 11.7 17.2 13 Q14.5 16.1 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M10.8 18 Q7.6 13 11.6 8.6 Q12.4 13.4 10.8 18Z" fill="var(--hol-green)" stroke-width="1.4"/><path d="M4 39 Q8 37.2 12 39 T20 39 T28 39 T36 39 T44 39 V43.6 H4Z" fill="var(--hol-blue)"/>
```

### 12. Vayechi · וַיְחִי

**Genesis 47:28–50:26.** Jacob blesses Joseph’s sons Ephraim and Manasseh and each of his own twelve sons, is
buried in the Cave of Machpelah, and Joseph makes his brothers promise to carry his bones to the Land of Israel.

<img src="docs/parasha-emojis/vayechi.svg" width="96" height="96" alt="Two crossed arms with open hands">

**Crossed hands of blessing:** Jacob crosses his hands to bless Ephraim and Manasseh, the blessing parents still give their children on Friday night (Genesis 48:13–20).

```html
<path d="M16.1 24.7 L21.3 29.6 L38.5 12.5 L31.8 6.3Z" fill="var(--hol-navy)"/><path d="M16.1 24.7 L21.3 29.6 L23.6 27.3 L18.2 22.3Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M21.9 28.9 C21.2 31.9 19.1 34.4 17.1 35.7 L10.2 29.3 C11.4 27.2 13.8 24.9 16.6 24.1Z" stroke-width="2.2"/><path d="M17.1 33.9 L14.7 39.7 M15.1 32.7 L10.2 39.2 M13.2 31.2 L7.1 37.2 M11.9 29.4 L5.7 33.6 M14.4 26.4 L8.2 26" stroke-width="4.6"/><path d="M21.9 28.9 C21.2 31.9 19.1 34.4 17.1 35.7 L10.2 29.3 C11.4 27.2 13.8 24.9 16.6 24.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M17.1 33.9 L14.7 39.7 M15.1 32.7 L10.2 39.2 M13.2 31.2 L7.1 37.2 M11.9 29.4 L5.7 33.6 M14.4 26.4 L8.2 26" stroke="var(--hol-gold-lt)" stroke-width="2.5"/><path d="M26.7 29.6 L31.9 24.7 L16.2 6.3 L9.5 12.5Z" fill="var(--hol-blue)"/><path d="M26.7 29.6 L31.9 24.7 L29.8 22.3 L24.4 27.3Z" fill="var(--hol-gold)" stroke-width="1.5"/><path d="M26.1 28.9 C26.8 31.9 28.9 34.4 30.9 35.7 L37.8 29.3 C36.6 27.2 34.2 24.9 31.4 24.1Z" stroke-width="2.2"/><path d="M30.9 33.9 L33.3 39.7 M32.9 32.7 L37.8 39.2 M34.8 31.2 L40.9 37.2 M36.1 29.4 L42.3 33.6 M33.6 26.4 L39.8 26" stroke-width="4.6"/><path d="M26.1 28.9 C26.8 31.9 28.9 34.4 30.9 35.7 L37.8 29.3 C36.6 27.2 34.2 24.9 31.4 24.1Z" fill="var(--hol-gold-lt)" stroke="none"/><path d="M30.9 33.9 L33.3 39.7 M32.9 32.7 L37.8 39.2 M34.8 31.2 L40.9 37.2 M36.1 29.4 L42.3 33.6 M33.6 26.4 L39.8 26" stroke="var(--hol-gold-lt)" stroke-width="2.5"/>
```
