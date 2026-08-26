# Starting Fonts — partner deep-link fonts for the Hebrew Font Maker

Fonts in this folder power `Hebrew_Font_Maker.html?start=<id>`: a partner site (the Open Siddur
Project, https://opensiddur.org/help/fonts/) links here, the Font Maker fetches the font, runs a
short partner onboarding, and opens a fresh project with the font's Hebrew letters, marks, and
anchor positions imported. The derivative's license is locked to the upstream license, and
declared Reserved Font Names force a rename.

## Layout

```
starting-fonts/
  manifest.json          ← {"schema":1,"fonts":[...]} — the runtime's source of truth
  LINKS.md               ← GENERATED copy-paste sheet of every live ?start= link (never hand-edit;
                            rebuilt on every intake, or via add_os_font.py --regen-links)
  <id>/
    <FontFile>.ttf       ← pinned upstream copy (same-origin; never hotlinked)
    LICENSE.txt          ← the upstream license text, verbatim (copyright + RFN lines included)
```

`manifest.json` records, per font: identity (`id`, `file`, `displayName`, optional
`nameTableFamily` when the embedded family name differs), partner provenance (`partner`,
`partnerName`, `partnerUrl`, `upstream`), the detected license (`licenseId`, `licenseName`,
`licenseUrl`, `licenseFile`, `copyright`, `reservedFontNames`), display metadata (`designer`,
`originalVersion`, `hasNikkud`, `hasTrop`), and integrity (`sha256`, `added`). Every value comes
from the font's own name table or its upstream license text — detection, never invention.

## Adding a font

Use the **`/addOSFont`** Claude Code skill (`.claude/skills/addOSFont/SKILL.md`), which drives
`scripts/add_os_font.py`. The script validates the license against the allowlist, refuses
anything else, stages the files, appends the manifest, and prints the live URL + `<a>` snippet
to send the partner. Never hand-edit `manifest.json` or a staged `LICENSE.txt`.

**The gate asks one question: does the license permit MODIFICATION?** A starting font exists to be
edited and re-exported, so every license that allows derivatives is allowlisted — OFL-1.1, GPL v2/v3
(with **or** without the font exception), Apache-2.0, CC0, Ubuntu Font Licence 1.0, LPPL 1.3c and
CC BY / CC BY-SA. Refused: no license text at all, or a license that forbids derivatives (any CC
`*-ND`). Anything ambiguous goes case-by-case with the maintainer and the partner.

**The font exception is NOT about editing.** It only stops a *document* that embeds the font from
inheriting the GPL; it says nothing about whether you may modify the font. Bare-GPL fonts are fully
editable — the derivative is simply GPL too. Treating the exception as an editing gate wrongly
excluded the entire Culmus library once; don't reintroduce that test.

Each license records the **obligations the derivative inherits** (`obligations` in the manifest:
`copyleft`, `changes`, `source`, `rename`, `attribution`). The Font Maker reads them to build the
exported `LICENSE.txt` and, for `rename`, to enforce a new family name the same way it enforces a
Reserved Font Name.

## Serving / caching

Nothing here is precached by the service worker. `sw.js` serves `manifest.json` network-first
(so a newly added font is visible without a cache-version bump) and font binaries through the
runtime cache. **Adding a font therefore needs no `sw.js` VERSION bump.**
