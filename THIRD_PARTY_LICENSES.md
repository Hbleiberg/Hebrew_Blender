# Third-Party Licenses

This project uses the following third-party libraries, data sources, and fonts. Their licenses are reproduced (or referenced) below in compliance with their terms.

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

## JavaScript & Python Libraries

The tools load these at runtime from public CDNs (jsDelivr, cdnjs, esm.sh); none are bundled or redistributed in this repository. Each is credited below with its copyright holder, license, and project home. (*hebrew-transliteration* is the same library whose full MIT text appears in the section above; it is repeated here for a complete inventory.)

| Library | Used by | Copyright | License | Project |
|---|---|---|---|---|
| html2canvas 1.4.1 | Worksheet, Font Maker (PNG / PDF capture) | © 2012 Niklas von Hertzen | MIT | https://github.com/niklasvh/html2canvas |
| jsPDF 2.5.1 | Worksheet, Font Maker (PDF export) | © 2010–2021 James Hall; © 2015–2021 yWorks GmbH | MIT | https://github.com/parallax/jsPDF |
| opentype.js 1.3.4 | Font Maker (reading an existing font) | © Frederik De Bleser | MIT | https://github.com/opentypejs/opentype.js |
| Pyodide 0.26.2 | Font Maker (in-browser Python runtime) | © Pyodide contributors | Mozilla Public License 2.0 | https://github.com/pyodide/pyodide |
| fontTools | Font Maker (builds the TTF / UFO / WOFF2 via Pyodide) | © Just van Rossum & the fontTools Authors | MIT | https://github.com/fonttools/fonttools |
| Brotli | Font Maker (WOFF2 compression via Pyodide) | © the Brotli Authors (Google) | MIT | https://github.com/google/brotli |
| HarfBuzz / harfbuzzjs 0.4.6 | Font Maker (QA shaping check) | © the HarfBuzz Project authors | "Old MIT" (permissive) | https://github.com/harfbuzz/harfbuzzjs |
| hebrew-transliteration 2.9.1 | Worksheet, Dictionary, Flash Cards, Torah Trainer | © 2022 Charles Loder | MIT | https://github.com/charlesLoder/hebrew-transliteration |

**The MIT-licensed libraries above** (html2canvas, jsPDF, opentype.js, fontTools, Brotli, hebrew-transliteration) are governed by the MIT License below — each project's own copyright notice, as listed in the table, applies:

```
MIT License

Copyright (c) <the respective holder listed above, per library>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

- **Pyodide** is licensed under the **Mozilla Public License 2.0** — full text at https://www.mozilla.org/MPL/2.0/. The Pyodide distribution it loads from the CDN also bundles CPython (Python Software Foundation License) and assorted packages; their notices ship within that distribution.
- **HarfBuzz / harfbuzzjs** use the permissive "Old MIT" license — full text at https://github.com/harfbuzz/harfbuzz/blob/main/COPYING.

### Analytics

The site loads **Google Analytics 4** (`gtag.js`) from `googletagmanager.com` on each page. This is a proprietary Google service governed by the [Google Analytics Terms of Service](https://marketingplatform.google.com/about/analytics/terms/us/) — not an open-source library — and the data it collects is described in `privacy.html`.

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
- **API:** https://developers.sefaria.org
- **Hebrew Tanakh text:** Public domain (Masoretic Text).
- **English translations:** Each Sefaria version has its own license (Public Domain, CC0, CC BY, CC BY-SA, CC BY-NC, CC BY-NC-SA, or proprietary "Copyright: …" for publisher-licensed editions like JPS 1985 and Robert Alter's translation).

**Used by `torah_trainer.html`:** Hebrew text and English translations are fetched at runtime via Sefaria's REST API (`/api/v3/texts/...` for text, `/api/texts/versions/...` for the per-book version list, and `/api/calendars` for the current parsha).

**Translation filtering:** the page filters the version dropdown by the `license` field returned for each version. Only translations licensed Public Domain, CC0, CC BY, CC BY-SA, CC BY-NC, or CC BY-NC-SA are offered. Versions with a "Copyright: …" license (e.g. *Tanakh: The Holy Scriptures, JPS 1985*; Robert Alter's *The Hebrew Bible*; the JPS *Contemporary Torah, 2006*) are excluded so that copyrighted text is not republished on ivritsuite.com without permission. The default selection is *The Holy Scriptures: A New Translation (JPS 1917)* (Public Domain) when present.

The active translation's title and license are displayed in the page footer per the attribution requirement of CC BY / CC BY-SA / CC BY-NC / CC BY-NC-SA.

If you re-host or fork this page, double-check Sefaria's version metadata yourself before relaxing the license filter.

---

## Fonts

IvritSuite displays Hebrew and Latin text in a number of openly-licensed typefaces. **Most are loaded at runtime from Google Fonts; a handful are self-hosted via a jsDelivr CDN mirror of the [`aharonium/fonts`](https://github.com/aharonium/fonts) collection.** The font binaries redistributed in this repository are:

- `splash/fonts/` — **Libre Baskerville** (OFL 1.1; license text at `splash/fonts/OFL.txt`), bundled so `splash/gen_splash.py` can render the app launch screens offline.
- `fonts/FrankRuhlLibre-Regular.ttf` — **Frank Ruhl Libre** (OFL 1.1; license text at `fonts/OFL.txt`), self-hosted and precached by the service worker as the suite's default Hebrew face.
- `fonts/Reuben.ttf` — **Reuben** by Baruch Sienna (CC0), made with the IvritSuite Hebrew Font Maker and offered for download in the Resources gallery; its CC0 dedication is declared in the gallery entry and in the notice generated with each download.
- `fonts/TzviScript.ttf` and `fonts/TzviScriptStrokeGuide.ttf` — **TzviScript** / **TzviScript Stroke Guide** by Harrison Bleiberg (OFL 1.1; full texts at `fonts/TzviScript-LICENSE.txt` and `fonts/TzviScriptStrokeGuide-LICENSE.txt`), made with the Hebrew Font Maker and offered in the Resources gallery.

Other fonts a user creates with the Hebrew Font Maker are that user's own work and are not covered here.

Every typeface the site requests is listed below, grouped by license. The two licenses in use — the **SIL Open Font License 1.1** and the **GNU GPL v2 with the Font Exception** (the Culmus Project fonts) — follow the tables.

### Fonts under the SIL Open Font License 1.1

| Font | Designer / Author | Loaded via | More info |
|---|---|---|---|
| Libre Baskerville | Pablo Impallari, Rodrigo Fuenzalida | Google Fonts (also bundled in `splash/fonts/`) | https://github.com/impallari/Libre-Baskerville |
| Source Sans 3 | Paul D. Hunt — Adobe | Google Fonts | https://github.com/adobe-fonts/source-sans |
| Frank Ruhl Libre | Yanek Iontef | Google Fonts (also bundled in `fonts/`) | https://github.com/fontef/frankruhllibre |
| David Libre | Yanek Iontef | Google Fonts | https://fonts.google.com/specimen/David+Libre |
| Noto Sans Hebrew | Google / Noto Project | Google Fonts | https://fonts.google.com/noto/specimen/Noto+Sans+Hebrew |
| Noto Serif Hebrew | Google / Noto Project | Google Fonts | https://fonts.google.com/noto/specimen/Noto+Serif+Hebrew |
| Noto Rashi Hebrew | Google / Noto Project | Google Fonts | https://fonts.google.com/noto/specimen/Noto+Rashi+Hebrew |
| Alef | HaGilda & Mushon Zer-Aviv | Google Fonts | https://alef.hagilda.com/ |
| Solitreo | Nathan Gross & Bryan Kirschen | Google Fonts | https://fonts.google.com/specimen/Solitreo |
| Gveret Levin | Gili Levin | Google Fonts | https://fonts.google.com/specimen/Gveret+Levin |
| Playpen Sans Hebrew | TypeTogether | Google Fonts | https://fonts.google.com/specimen/Playpen+Sans+Hebrew |
| Heebo | Oded Ezer | Google Fonts | https://fonts.google.com/specimen/Heebo |
| Assistant | Ben Nathan | Google Fonts | https://fonts.google.com/specimen/Assistant |
| Ezra SIL | SIL International | self-hosted (jsDelivr · `aharonium/fonts`) | https://software.sil.org/ezra/ |
| Shlomo | Shlomo Orbach | self-hosted (jsDelivr · `aharonium/fonts`) | https://github.com/aharonium/fonts |
| Shlomo SemiStam | Shlomo Orbach | self-hosted (jsDelivr · `aharonium/fonts`) | https://github.com/aharonium/fonts |
| Shlomo Stam | Shlomo Orbach | self-hosted (jsDelivr · `aharonium/fonts`) | https://github.com/aharonium/fonts |
| Dyslexia Hebrew | Jake Shoag | self-hosted (jsDelivr · `aharonium/fonts`) | https://github.com/aharonium/fonts |
| Nunito | Vernon Adams, Cyreal, Jacques Le Bailly | Google Fonts | https://fonts.google.com/specimen/Nunito |
| Quicksand | Andrew Paglinawan | Google Fonts | https://fonts.google.com/specimen/Quicksand |
| Merriweather | Eben Sorkin — Sorkin Type | Google Fonts | https://fonts.google.com/specimen/Merriweather |
| Lora | Cyreal | Google Fonts | https://fonts.google.com/specimen/Lora |
| Patrick Hand | Patrick Wagesreiter | Google Fonts | https://fonts.google.com/specimen/Patrick+Hand |
| Schoolbell | Font Diner (Stuart Sandler) | Google Fonts | https://fonts.google.com/specimen/Schoolbell |
| Comic Neue | Craig Rozynski | Google Fonts | https://fonts.google.com/specimen/Comic+Neue |
| Atkinson Hyperlegible | Braille Institute of America | Google Fonts | https://fonts.google.com/specimen/Atkinson+Hyperlegible |
| Lexend | Bonnie Shaver-Troup, Thomas Jockin | Google Fonts | https://fonts.google.com/specimen/Lexend |

Each OFL font is © its respective authors, with its own Reserved Font Name as stated in its distribution. The full license text (identical for all of the above; a copy also ships at `splash/fonts/OFL.txt`) follows:

```
-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### Fonts under the GNU GPL v2 with Font Exception (Culmus Project)

These three Hebrew typefaces are by **Yoram Gnat**, part of the **Culmus Project** (https://culmus.sourceforge.io/), and are loaded at runtime from the jsDelivr CDN mirror of `aharonium/fonts` — their binaries are not redistributed in this repository.

| Font | Designer / Author | Loaded via | More info |
|---|---|---|---|
| Shmulik CLM | Yoram Gnat — Culmus Project | self-hosted (jsDelivr · `aharonium/fonts`) | https://culmus.sourceforge.io/ |
| Keter Aram Sova | Yoram Gnat — Culmus Project | self-hosted (jsDelivr · `aharonium/fonts`) | https://culmus.sourceforge.io/ |
| Shofar | Yoram Gnat — Culmus Project | self-hosted (jsDelivr · `aharonium/fonts`) | https://culmus.sourceforge.io/ |

They are licensed under the **GNU General Public License, version 2** (or, at your option, any later version) — full text at https://www.gnu.org/licenses/old-licenses/gpl-2.0.html — **with the following Font Exception**, which allows the fonts to be embedded in a document without that document becoming subject to the GPL:

```
As a special exception, if you create a document which uses this font, and
embed this font or unaltered portions of this font into the document, this
font does not by itself cause the resulting document to be covered by the
GNU General Public License. This exception does not however invalidate any
other reasons why the document might be covered by the GNU General Public
License. If you modify this font, you may extend this exception to your
version of the font, but you are not obligated to do so. If you do not wish
to do so, delete this exception statement from your version.
```
