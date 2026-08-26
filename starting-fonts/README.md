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
  LINKS.md               ← GENERATED: copy-paste sheet of every live ?start= link, plus the
                            not-staged record (never hand-edit; rebuilt on every intake, or via
                            add_os_font.py --regen-links)
  not-staged.json        ← requested fonts deliberately REFUSED, with the reason, plus any place
                            the partner's font page and a font's own distribution disagree about
                            its license. Rendered into LINKS.md; edit this, never LINKS.md.
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

**License allowlist:** OFL-1.1 · GPL v2/v3 **with** font exception · Apache-2.0 · CC0 / public
domain. Bare GPL (no font exception), LPPL, UFL, and unknown/ambiguous licenses are refused —
those go case-by-case with the maintainer and the partner.

**A combined license file must be read per-font.** Culmus ships ONE `LICENSE` covering 13
families in which the font-exception clause appears only in some sections; a whole-file search
for "As a special exception" wrongly clears all 13. The exception counts only when it sits in
that font's own copyright section — otherwise the font is bare GPL and is refused. Record every
refusal in `not-staged.json` so the next intake doesn't re-litigate it.

## Serving / caching

Nothing here is precached by the service worker. `sw.js` serves `manifest.json` network-first
(so a newly added font is visible without a cache-version bump) and font binaries through the
runtime cache. **Adding a font therefore needs no `sw.js` VERSION bump.**
