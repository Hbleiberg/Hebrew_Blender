# Hebrew Blender

A suite of browser-based tools for Hebrew literacy instruction — no installation, no build step, no server required. Open any HTML file directly in a browser or serve the folder statically.

**Live site:** [hbleiberg.github.io/Hebrew_Blender](https://hbleiberg.github.io/Hebrew_Blender)

---

## Tools

### Worksheet Generator (`hebrew_blend_generator.html`)
Creates printable Hebrew decoding worksheets, bingo cards, and vocabulary drills.

- **Blend mode** — generate CV / CVC / CVCVC syllable grids from a custom letter + vowel selection, with a live "X possible combinations" counter
- **Real words mode** — draw from the full word list, filtered by consonant count (1–6), part of speech, era (Biblical / Modern / Both), and optional "include shorter words" toggle
- **Nikud mode** — display words with full vowel pointing
- Phonotactically valid output only — illegal sofit placements, mater lectionis conflicts, and shva-nucleus sequences are filtered out automatically (see `phonotactic_blending_filter_spec.md`)
- Dark mode, print stylesheet, sidebar that collapses on mobile

### Word Lookup (`hebrew_dictionary.html`)
Browse and filter the full Hebrew word list.

- Full-text search across Hebrew, transliteration, and English translation
- Filter by word length (consonant count), part of speech, and era
- Position-based letter filter — narrow results to words with a specific letter in position 1, 2, 3, etc. (mirrors the "letter locking" concept in the generator)
- Paginated results (100 per page) with an expandable sidebar
- Dark mode synced with the generator via `localStorage`

### Flash Cards (`flash_cards.html`) — Beta
Interactive flash cards for practicing Hebrew syllables — mobile-first.

- **Letter modes** — drill 1, 2, or 3-letter syllables (CV / CVC / CVCVC) algorithmically generated from the same letter + vowel pools as the generator
- **Configurable vowel position** — choose which slot inside the syllable carries the vowel
- **Letter & vowel locking** — pin a specific letter or vowel to a specific position (mirrors the generator's lock concept)
- **Inverse mode** — show transliteration on the front and Hebrew on the back
- **Scoring & results** — mark each card right/wrong, then review missed cards on a results screen
- **Presets** — save and load deck configurations
- Tap to flip; same Hebrew font picker, nikkud color-coding, Hebrew TTS, and dark mode as the rest of the suite

### Classroom Dashboard (`classroom_dashboard.html`) — Beta
A live display board designed for classroom projectors and SmartBoards.

- **Hebrew days of the week** — full column with color-coded today / yesterday / tomorrow markers
- **Live Hebrew date + clock** — correct Hebrew calendar (Reingold-Dershowitz algorithm), 12/24-hr time, English and Hebrew date formats
- **Live weather** — Open-Meteo geocoded weather (no API key), 30-minute refresh, Fahrenheit/Celsius, Hebrew or English labels
- **Configurable dashboard text** — rich-text editor (bold, italic, RTL/LTR, color, size) displayed prominently in the center column
- **Settings drawer** — Location, Date & Time, Weather, Day of Week, Dashboard Text, Presets, Hebrew Settings (full font picker + nikkud color-coding)
- **Nikkud color-coding** — same vowel-color scheme as the Worksheet Generator; three styles: color, highlight, underline
- Full 13-font picker (Block and Cursive sections) with dynamic loading
- Dark mode (no-flash), fullscreen mode, ESC-to-close, presets save/load/export/import
- SmartBoard compatible — responsive at any display resolution

### Teaching Resources (`resources.html`)
A curated, filterable directory of external Hebrew and Jewish-education resources.

- **Category filter** — Lesson Planning, Printables, Tanakh, Hebrew, Culture, Miscellaneous
- **Age-group filter** — Early Learners (K–2), Elementary (3–5), Middle/High (6–12), Adult/Teacher
- Each resource has a title, short description, age-range label, and outbound link
- All entries live in a single `RESOURCES` array inside the file — easy to add to or curate

### Landing Page (`index.html`)
Home page with navigation cards to all the tools above. Also hosts the global Import / Export / Erase All Settings modal (gear icon) that round-trips every tool's `localStorage` data as a single JSON blob.

---

## Files

| File | Description |
|---|---|
| `index.html` | Landing page — navigation hub linking to all tools |
| `hebrew_blend_generator.html` | Worksheet / bingo / drill generator (main app) |
| `hebrew_dictionary.html` | Interactive word lookup and filter page |
| `flash_cards.html` | Interactive syllable flash cards — Beta |
| `classroom_dashboard.html` | Live classroom projector / SmartBoard dashboard — Beta |
| `resources.html` | Curated directory of external Hebrew / Jewish-education resources |
| `hebrew_words.json` | Structured word data (~2 MB, ~9,400 entries) loaded by both HTML pages via `fetch()` |
| `hebrew_dictionary_4_19_2026.csv` | Source CSV used to build and update `hebrew_words.json`; includes Hebrew (nikkud), transliteration, translation, POS, and era fields |
| `phonotactic_blending_filter_spec.md` | Detailed linguistic specification for the phonotactic validity filter used by the generator; cites Bolozky, Bat-El, Asherov & Bat-El, and the Academy of the Hebrew Language |
| `LICENSE` | CC BY-NC-SA 4.0 |
| `CLAUDE.md` | Instructions for the AI coding assistant used during development |

### `hebrew_words.json` structure

```json
{
  "2": [
    {
      "word": "אָב",
      "bare": "אב",
      "letters": ["א", "ב"],
      "uniqueLetters": ["א", "ב"],
      "translation": "father",
      "pos": "noun",
      "translit": "av",
      "era": "Both"
    }
  ],
  "3": [ ... ]
}
```

Top-level keys are consonant counts (`"1"` through `"6"`). Each entry has:

- `word` — Hebrew with nikkud (vowel points)
- `bare` — Hebrew consonants only (no nikkud)
- `letters` — ordered array of consonants in the word
- `uniqueLetters` — deduplicated consonant set
- `translation` — English gloss
- `pos` — part of speech (`noun`, `proper noun`, `verb`, `adjective`, `adverb`, etc.)
- `translit` — romanized transliteration
- `era` — `"Biblical"`, `"Modern"`, or `"Both"`

---

## Word Data Attribution

The word data in `hebrew_words.json` and `hebrew_dictionary_4_19_2026.csv` is derived from **[Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html)**, a freely available structured dictionary extracted from Wiktionary.

**If you adapt or redistribute this project**, please credit Kaikki.org alongside the project author:

> Word data sourced from [Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html), derived from Wiktionary contributors under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Kaikki's underlying data is Wiktionary content, which is licensed CC BY-SA 3.0. The curation, filtering, transliteration fields, era classification, and JSON structure in this project are original work licensed under CC BY-NC-SA 4.0 (see below).

---

## License

**CC BY-NC-SA 4.0** — Free to use and adapt for non-commercial educational purposes with attribution.

- Share and adapt freely for educational, non-commercial use
- Credit required: *Hebrew Blender by Harrison Bleiberg*
- Derivatives must carry the same license
- Commercial use is not permitted

Full license text: [creativecommons.org/licenses/by-nc-sa/4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## Running Locally

No build step needed. Clone the repo and open `index.html` in a browser — **or** serve the folder over HTTP so that the `fetch()` call for `hebrew_words.json` works without CORS issues:

```bash
# Python 3
python3 -m http.server 8080
# then open http://localhost:8080
```

```bash
# Node (npx)
npx serve .
```

---

## Updating the Word Data

1. Edit `hebrew_dictionary_4_19_2026.csv` (or replace with a new export)
2. Run whatever processing script converts the CSV to `hebrew_words.json`
3. Bump the cache-busting version in both HTML files:
   ```js
   fetch('hebrew_words.json?v=3')   // increment v= each time JSON changes
   ```
4. Commit both the new JSON and the HTML version bump together

---

## Author

Created by **[Harrison Bleiberg](https://harrisonbleiberg.wpcomstaging.com/)**

Feedback and contributions welcome — open an issue or pull request.
