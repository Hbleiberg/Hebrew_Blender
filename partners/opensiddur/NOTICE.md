# Open Siddur Project — partner mark

`logo.png` is the Open Siddur Project's logo, shown beside the partner credit in the Hebrew Font
Maker's "Start from an existing font" picker (`#osPickLogo`).

| | |
|---|---|
| Work | Logo for the Open Siddur Project |
| Creator | Aharon Varady |
| Year | 2009 |
| Source page | https://opensiddur.org/miscellanea/art/logo-for-the-open-siddur-project-by-aharon-varady-2009/ |
| Partner site | https://opensiddur.org/help/fonts/ |
| File | `logo.png`, 500×500 PNG, RGBA, 29,465 bytes |
| sha256 | `f041a2cab821370e040caf9ae48aa56f097b65ca9471a24784e4dba9425fda16` |

## Provenance

The file is a **pinned, unmodified copy** sent by Aharon Varady — the logo's creator — to the
maintainer, and staged here byte-for-byte as received. Same rule as the fonts under
`starting-fonts/`: vendored same-origin, never hotlinked (the Font Maker's CSP allows images from
`'self'` only), and never re-encoded, so it stays byte-identical to what the Open Siddur Project
published. Re-verify with the sha256 above before replacing it.

## License

**CC BY-SA 4.0** — Creative Commons Attribution-ShareAlike 4.0 International,
https://creativecommons.org/licenses/by-sa/4.0/ (confirmed by the maintainer, 2026-09-13).

Attribution is required, and the picker carries it verbatim beneath the font grid
(`#osPickLogoCredit`, pinned English, hidden whenever the mark itself is hidden):

> [Logo for the Open Siddur Project](https://opensiddur.org/miscellanea/art/logo-for-the-open-siddur-project-by-aharon-varady-2009/)
> by Aharon Varady (2009) · [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

That is the standard title · author · source · license form. **Keep the credit and the mark
together** — removing the line while the logo still renders puts the page out of compliance.

ShareAlike binds adaptations, not display. The file is shown unmodified and never re-encoded, so
nothing here is an adaptation and the share-alike term is not triggered. If the logo is ever
recoloured, cropped or redrawn for this project, that derivative must itself be CC BY-SA 4.0.

### Permission

**Granted.** Aharon Varady — creator of the logo and of the Open Siddur Project — gave his blessing
for the mark to appear in the Hebrew Font Maker's interface, and supplied the file himself
(maintainer, 2026-09-13). That settles the question the license could not: a license permits reuse,
but it does not speak for the project being represented.

Should that ever be withdrawn, remove this directory together with the `#osPickLogo` /
`#osPickLogoCredit` markup, CSS and `osPickRender` gate in `Hebrew_Font_Maker.html`; the picker's
text credit and link stand on their own.

## Runtime

The logo renders **only** while every entry in `starting-fonts/manifest.json` carries
`partner: "opensiddur"`. Stage a font from a second partner and it hides itself, so no partner's mark
is ever shown over another's fonts. Nothing under `partners/` is precached by `sw.js`; the file rides
the runtime cache-first catch-all, so replacing it needs no VERSION bump (editing the page does).
