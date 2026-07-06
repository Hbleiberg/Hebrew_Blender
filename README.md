# IvritSuite (Hebrew Blender)

A suite of browser-based tools for Hebrew literacy instruction — no installation, no build step, no server required. Open any HTML file directly in a browser or serve the folder statically.

**IvritSuite** is the brand the live site carries (every page's `<title>`); **Hebrew Blender** is the repository/project name and the name in the license credit. They refer to the same thing.

**Live site:** [ivritsuite.com](https://ivritsuite.com)

---

## Tools

### Worksheet Generator (`hebrew_blend_generator.html`)
Creates printable Hebrew decoding worksheets, bingo cards, and vocabulary drills. 

- **Blend mode** — generate 1-, 2-, or **3-letter** (Beta) syllable grids from a custom letter + vowel selection, plus a **Vowels Only** mode, with a live "X possible combinations" counter and a pool-size readout
- **Worksheet types** — Reading, Inverse, Fill Vowels, **Bingo**, **Gematria**, **Name the Letter**, and **Tracing** layouts
- **Real Words drills** — draw from the full word list to build **Word Search**, **Crossword** (with word bank + answer key), and **Number Practice** (0–9999) worksheets
- **Class Sets** — generate multiple unique versions (Version A / B / …) of one worksheet in a single pass
- Phonotactically valid output only — illegal sofit placements, mater lectionis conflicts, and shva-nucleus sequences are filtered out automatically (see `docs/phonotactic_blending_filter_spec.md`)
- **Nikkud color-coding** with **Default and TaL AM** vowel-color schemes; three styles (color / highlight / underline)
- **Share links** — copy a shareable `?s=` URL that reconstructs the current setup on the recipient's screen
- Save/load presets in nested folders, live preview, guided tour, dark mode, print stylesheet, mobile-collapsing sidebar

### Word Lookup / Dictionary (`hebrew_dictionary.html`)
Browse, filter, and export from the full Hebrew word list.

- Full-text search across Hebrew, transliteration, and English translation, with filters for word length, part of speech, era, and a **position-based letter filter**
- **Vowel filters** — grouped vowel-chip filter grid to narrow results by vowel
- **Shoresh (root) Explorer** — look up a three-letter root and see related words and patterns
- **Emoji vocabulary mode** — browse a categorized emoji↔word tree with a masculine / feminine / both gender toggle
- **Gematria** — show each word's gematria value, filter by a gematria range, and sort ascending/descending
- **Bulk copy + export** — multi-select words and export decks formatted for **Anki** or **Quizlet**
- **Text-to-speech** — per-word `he-IL` speech with an audio-enabled toggle and adjustable rate
- Shareable `?s=` filtered-view links that restore the last filters, Hebrew font/size picker, transliteration-style setting, guided tour, dark mode

### Flash Cards (`flash_cards.html`) — Beta
Interactive, mobile-first flash cards for practicing Hebrew reading.

- **Syllable modes** — drill 1-, 2-, or 3-letter syllables generated from the same letter + vowel pools as the generator, with configurable vowel position and letter/vowel locking
- **Other modes** — Numbers, Colors, and an **Emoji** mode with its own category tree and gender toggle
- **Profiles + weakness tracking** — save named student profiles, keep a results history, and use **Practice My Weaknesses** / **View Weaknesses** to re-drill the cards a student misses most
- **Streaks + personal best** — running streak counter with a persisted personal-best
- **Teacher share codes** — generate a code a teacher can hand out, and paste a code from your teacher to load their deck
- **Skip / re-queue** — skipped cards come back once so the whole set is seen; re-queued slots are excluded from scoring
- Inverse mode, scoring + results review, presets in nested folders, Hebrew font picker, nikkud color-coding, TTS, dark mode

### Classroom Dashboard (`classroom_dashboard.html`)
A live display board designed for classroom projectors and SmartBoards.

- **Live Hebrew date + clock** (Reingold-Dershowitz calendar, 12/24-hr, Hebrew/English formats) and **Hebrew days of the week** with today / yesterday / tomorrow markers
- **Live weather** — Open-Meteo geocoded weather (no API key), 30-minute refresh, °F/°C, Hebrew or English labels
- **Jewish-calendar widgets** — Shabbat candle-lighting times, an **Omer counter** (Hebrew/English + progress bar), and a holiday countdown line
- **Schedule Sync** — assign a preset + end time per period; the board auto-switches configurations with a live Now/Next display and countdown
- **Classroom timer** with warn / urgent / done states, and a **video embed** sidebar card
- **Rich-text board message** — bold, italic, RTL/LTR, color, size — edited in place
- **Keep-screen-awake** wake lock, fullscreen mode, projector zoom, first-run setup card with starter layouts
- Full 13-font Hebrew picker (Block + Cursive), nikkud color-coding (Default/TaL AM), presets in nested folders, guided tour, no-flash dark mode

### Torah Trainer (`torah_trainer.html`)
A reader for the weekly Torah portion (parsha) with toggleable translit, translation, vowel coloring, cantillation, TTS, and chanted-audio karaoke.

- **All 54 parshiyot** + Haftarot, with current-week auto-detection via Sefaria's calendar (diaspora or Israel schedule) and a custom chapter/verse range picker
- **Aliyah navigation** — aliyah picker, sticky jump-chip nav, "you are here" readout, and inline aliyah dividers
- **Layouts** — interlinear (Hebrew / translit / translation stacked) or side-by-side columns; mobile collapses to one column
- **Translations** — version dropdown from Sefaria, filtered to openly-licensed editions (defaults to JPS 1917 Public Domain)
- **Cantillation + nikkud toggles** — strip te'amim (U+0591–U+05AF) independently of vowel points
- **Vowel color coding** with per-vowel pickers, three modes, and Default/TaL AM schemes
- **Chanted-audio karaoke** — streams [PocketTorah](https://pockettorah.com) audio on demand with word-level highlighting synced to playback and a speed slider
- **Verse looping** — loop a single verse for practice (with configurable silence between repeats) plus an audio-bar loop-stop control
- Hebrew TTS (per-verse + read-all), transliteration styles, Hebrew font picker, fullscreen for projection

### Hebrew Font Maker (`Hebrew_Font_Maker.html`) — Beta
Turn your own handwritten Hebrew letters into a real, installable font — entirely in the browser. (Currently v2.0.)

- **Trace from images** — upload one letter per image, one sheet of all letters (marquee-crop each), or import an existing TTF/OTF; sub-pixel marching-squares tracing with cubic-Bézier fitting and a point editor
- **Nikkud & trop anchors** — place vowel and cantillation marks per letter; exports real GPOS mark-to-base (nikkud) and mark-to-mark (trop) positioning, plus pair kerning
- **Printable handwriting templates** — letters, vowels, trop, and punctuation/digit worksheets to fill in and scan back
- **QA Check** — a collision grid flags any letter × mark overlaps before you export
- **Export** — TrueType (TTF), WOFF2, or editable UFO source, each with a license of your choice (CC0 / OFL / MIT / CC-BY / All Rights Reserved)
- **Use in IvritSuite** — save a finished font in the browser and pick it from any other tool's font picker
- Recent-projects list + autosave, guided tour, changelog in the About tab; built client-side with Pyodide + fontTools (loaded on first export)

### Teaching Resources (`resources.html`)
A curated, filterable directory of external Hebrew and Jewish-education resources.

- **Category filter** — Lesson Planning, Printables, Tanakh, Hebrew, Culture, Miscellaneous
- **Age-group filter** — Early Learners (K–2), Elementary (3–5), Middle/High (6–12), Adult/Teacher
- Each resource has a title, short description, age-range label, and outbound link
- All entries live in a single `RESOURCES` array inside the file — easy to add to or curate

### Contact (`contact.html`)
A contact form (web3forms + hCaptcha) for feedback and support, plus a support/donation link.

### Landing Page (`index.html`)
Home page with navigation cards to all the tools above. Also hosts the global **Import / Export / Erase All Settings** modal (gear icon) that round-trips every tool's `localStorage` data — either as a single **`.ivrit` save file** or as a copy-and-paste JSON blob — and a **My Fonts** manager for fonts built in the Font Maker.

---

## Suite-wide features

These work the same across the tools (all pages are served from one origin, so shared browser storage is visible everywhere):

- **Dark mode** — a no-flash dark theme remembered site-wide (`localStorage`), toggled from any page.
- **`.ivrit` save files** — portable backups (see the next section).
- **AllTools backup** — the gear modal on the landing page bundles every tool's settings into one export/import/erase, either as an `.ivrit` file or a JSON blob.
- **My Fonts** — custom fonts made (or uploaded) in the Hebrew Font Maker are stored in the browser and appear in **every** tool's font picker automatically; you can upload your own `.ttf`/`.otf`/`.woff`/`.woff2` from any picker.
- **Nikkud color-coding** — vowel-by-color rendering with two selectable schemes, **Default** and **TaL AM** (matching the TaL AM curriculum poster), in three styles (color / highlight / underline).
- **Guided tours** — all six tools (Generator, Dictionary, Dashboard, Flash Cards, Torah Trainer, Font Maker) ship a first-visit "❓ Tour" walk-through that never changes your data.
- **Share links** — the Generator and Dictionary produce shareable `?s=` URLs; Flash Cards uses a paste-in teacher share code.
- **Installable PWA + offline shell** — `manifest.webmanifest` + `sw.js` let the suite install to a home screen and run its app shell offline; iOS launch/splash screens live in `splash/`. (Remote resources — Google Fonts, Sefaria, PocketTorah audio — are not available offline.)

---

## Backups & Save Files (`.ivrit`)

Every tool that stores presets — the **Worksheet Generator**, **Classroom Dashboard**, and **Flash Cards** — plus the global modal on the **landing page**, lets you back up and restore your work as a portable **save file** with an `.ivrit` extension. (It's plain JSON text under the hood, so it's universally readable and safe to email or store anywhere.)

In each tool's **Backup** area there's an **Automatic Input / Manual Input** toggle:

- **Automatic Input** (the default) — click **Save to .ivrit file** to download a save file, or **drag-and-drop** (or browse for) an `.ivrit` file to restore. The download is named for today's date and the tool, e.g. `May_30_2026_Worksheet.ivrit`, `August_15_1994_Dashboard.ivrit`, or `April_27_2008_AllTools.ivrit`.
- **Manual Input** — the classic copy-and-paste text box, for anyone who already keeps text backups.

How it works:

- A save file stores **both** your full collection of named presets **and** your current on-screen settings, so restoring brings everything back.
- The landing-page **AllTools** save file bundles *every* tool at once (Generator, Dashboard, Flash Cards, Dictionary, and Torah Trainer settings — plus any fonts you built in the Hebrew Font Maker).
- Each file knows which tool it came from (recorded inside the file, so it still works even if you rename it). Dropping the wrong kind of file onto a tool warns you first.
- On restore you choose **Merge** (add to what you have) or **Replace** (start fresh from the file).

---

## Files

| File / directory | Description |
|---|---|
| `index.html` | Landing page — navigation hub, AllTools backup modal, My Fonts manager |
| `hebrew_blend_generator.html` | Worksheet / bingo / drill generator (main app) |
| `hebrew_dictionary.html` | Interactive word lookup, filters, Shoresh Explorer, and Anki/Quizlet export |
| `flash_cards.html` | Interactive flash cards with profiles and weakness tracking — Beta |
| `classroom_dashboard.html` | Live classroom projector / SmartBoard dashboard |
| `torah_trainer.html` | Weekly parsha reader with translit, vowel coloring, cantillation, TTS, PocketTorah karaoke, and verse looping |
| `Hebrew_Font_Maker.html` | Make a real installable Hebrew font from your handwriting — trace, anchor nikkud/trop, export TTF/WOFF2/UFO — Beta |
| `resources.html` | Curated directory of external Hebrew / Jewish-education resources |
| `contact.html` | Contact / feedback form (web3forms + hCaptcha) |
| `privacy.html` | Privacy policy |
| `404.html` | Custom not-found page |
| `pwa.js` | Service-worker registration + install-prompt handling |
| `sw.js` | Service worker — precaches the app shell for offline use (cache `ivritsuite-v<VERSION>`) |
| `manifest.webmanifest` | PWA manifest (name, icons, theme/background color) |
| `THIRD_PARTY_LICENSES.md` | License terms for bundled/streamed third-party data (PocketTorah, Sefaria, fonts, etc.) |
| `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `favicon.svg` | Static-site plumbing (custom domain, crawler hints, sitemap, Jekyll opt-out, favicon) |
| `data/hebrew_words.json` | Structured word data (~2.93 MB, 13,081 entries) loaded by the generator and dictionary via `fetch()` |
| `data/hebrew_dictionary_4_19_2026.csv` | Source CSV used to build `data/hebrew_words.json` (Hebrew w/ nikkud, transliteration, translation, POS, era) |
| `data/hebrew_emojis.json` / `data/hebrew_emojis.csv` | Hebrew word ↔ emoji mappings used by the dictionary and flash-card emoji modes |
| `data/parshiyot.json` | All 54 parshiyot with Hebrew/English names, Sefaria refs, and PocketTorah keys |
| `data/pockettorah/aliyah.json` | Mirrored from [PocketTorah](https://github.com/rneiss/PocketTorah) — full kriyah verse ranges per parsha |
| `data/pockettorah/manifest.json` | Maps each parsha+aliyah to its actual upstream label filename |
| `data/pockettorah/timings/*.txt` | Mirrored PocketTorah word-level timing files (432 files, ~2 MB) |
| `docs/phonotactic_blending_filter_spec.md` | Linguistic specification for the phonotactic validity filter used by the generator |
| `splash/` | iOS launch/splash screens + `gen_splash.py` generator (and its bundled Libre Baskerville fonts) |
| `icons/`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-card.png` | PWA / home-screen / social-card icons |
| `fonts/` | Bundled Hebrew display fonts (Frank Ruhl Libre, Reuben, TzviScript, TzviScript Stroke Guide) + their license files |
| `LICENSE` | CC BY-NC-SA 4.0 |
| `CLAUDE.md` | Instructions for the AI coding assistant used during development |

### `data/hebrew_words.json` structure

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
  "3": [ ]
}
```

Top-level keys are consonant counts. There are **13,081 entries** across keys ranging from `"1"` to `"42"` (the buckets are sparse above `"6"` — most words are 2–6 consonants, and only a handful are longer). Each entry has:

- `word` — Hebrew with nikkud (vowel points)
- `bare` — Hebrew consonants only (no nikkud)
- `letters` — ordered array of consonants in the word
- `uniqueLetters` — deduplicated consonant set
- `translation` — English gloss
- `pos` — part of speech (`noun`, `proper noun`, `verb`, `adjective`, `adverb`, `pronoun`, etc.)
- `translit` — romanized transliteration
- `era` — `"Biblical"`, `"Modern"`, or `"Both"`

---

## Attribution

### Word data
The word data in `data/hebrew_words.json` and `data/hebrew_dictionary_4_19_2026.csv` is derived from **[Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html)**, a freely available structured dictionary extracted from Wiktionary.

**If you adapt or redistribute this project**, please credit Kaikki.org alongside the project author:

> Word data sourced from [Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html), derived from Wiktionary contributors under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Kaikki's underlying data is Wiktionary content, which is licensed CC BY-SA 3.0. The curation, filtering, transliteration fields, era classification, and JSON structure in this project are original work licensed under CC BY-NC-SA 4.0 (see below).

### Torah audio & timings
The Torah Trainer's chanted-audio karaoke uses **[PocketTorah](https://pockettorah.com)** by Russel Neiss & Rabbi Charlie Schwartz — word-level timing files (mirrored into `data/pockettorah/`) and cantillation audio (streamed on demand) — licensed **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Sefaria translations are shown under their individual licenses, and only openly-licensed versions are offered. See [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) for the full terms.

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

No build step needed. Clone the repo and open `index.html` in a browser — **or** serve the folder over HTTP so that the `fetch()` calls for `data/*.json` work without CORS issues:

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

1. Edit `data/hebrew_dictionary_4_19_2026.csv` (or replace with a new export)
2. Run whatever processing script converts the CSV to `data/hebrew_words.json`
3. Bump the cache-busting version in **both** files that fetch the JSON — `hebrew_blend_generator.html` and `hebrew_dictionary.html`:
   ```js
   fetch('data/hebrew_words.json?v=4')   // increment v= each time the JSON changes
   ```
4. Commit both the new JSON and the HTML version bumps together. (If you edited any precached file, also bump `VERSION` in `sw.js` — see `CLAUDE.md`.)

---

## Author

Created by **[Harrison Bleiberg](https://harrisonbleiberg.wpcomstaging.com/)**

Feedback and contributions welcome — open an issue or pull request.
