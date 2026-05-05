# Third-Party Licenses

This project uses the following third-party libraries. Their licenses are reproduced below in compliance with their terms.

---

## hebrew-transliteration

- **Project:** https://github.com/charlesLoder/hebrew-transliteration
- **Author:** Charles Loder
- **License:** MIT

```
MIT License

Copyright 2022 Charles Loder

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

---

## PocketTorah (chanted Torah audio + word-level timings)

- **Project:** https://pockettorah.com
- **Source repo:** https://github.com/rneiss/PocketTorah
- **Authors:** Russel Neiss & Rabbi Charlie Schwartz
- **License:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) — https://creativecommons.org/licenses/by-sa/4.0/

**Used by `torah_trainer.html`:**
- Word-timing label files (`data/torah/labels/*.txt`) are mirrored into `/data/pockettorah/timings/` in this repository.
- MP3 cantillation audio files (`data/audio/*.mp3`) are streamed on demand from `raw.githubusercontent.com/rneiss/PocketTorah/master/data/audio/`. They are not redistributed in this repository.
- `data/pockettorah/aliyah.json` is mirrored from upstream `data/aliyah.json`.

**Per the CC BY-SA 4.0 license:** any IvritSuite material that incorporates PocketTorah audio (the karaoke feature in `torah_trainer.html`) inherits the CC BY-SA 4.0 license. Visible attribution is shown in the karaoke audio bar and on the Torah Trainer page footer.

---

## Sefaria

- **Project:** https://www.sefaria.org
- **API:** https://www.sefaria.org/developers
- **Texts license (Hebrew Tanakh):** Public domain.
- **Translations license:** Generally Creative Commons Attribution-ShareAlike 3.0 (CC BY-SA 3.0) for community translations; some specific versions (e.g. JPS 1985) carry their own publisher licenses — see Sefaria's per-version metadata.

**Used by `torah_trainer.html`:** Hebrew text and English translations are fetched at runtime via Sefaria's public REST API. Attribution is shown in the page footer.
