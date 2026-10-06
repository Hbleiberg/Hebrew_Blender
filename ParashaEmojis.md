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
| 2 | Noach | נֹחַ |  |  |
| 3 | Lech-Lecha | לֶךְ-לְךָ |  |  |
| 4 | Vayera | וַיֵּרָא |  |  |
| 5 | Chayei Sara | חַיֵּי שָׂרָה |  |  |
| 6 | Toldot | תּוֹלְדוֹת |  |  |
| 7 | Vayetzei | וַיֵּצֵא |  |  |
| 8 | Vayishlach | וַיִּשְׁלַח |  |  |
| 9 | Vayeshev | וַיֵּשֶׁב |  |  |
| 10 | Miketz | מִקֵּץ |  |  |
| 11 | Vayigash | וַיִּגַּשׁ |  |  |
| 12 | Vayechi | וַיְחִי |  |  |
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
