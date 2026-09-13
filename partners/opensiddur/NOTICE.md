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

The file is a **pinned, unmodified copy** supplied by the maintainer — same rule as the fonts under
`starting-fonts/`: vendored same-origin, never hotlinked (the Font Maker's CSP allows images from
`'self'` only), and never re-encoded, so it stays byte-identical to what the Open Siddur Project
published. Re-verify with the sha256 above before replacing it.

## LICENSE — NOT YET RECORDED

**No license text has been staged for this file, because none was verified.** The source page above
was unreachable from the environment the picker was built in, so the license was neither read nor
detected — and this repository's rule for partner assets is *detected, never invented*.

Before this ships publicly, the maintainer should record here:

- the license the logo is offered under (name + version), and its URL;
- any attribution wording that license requires;
- confirmation that the Open Siddur Project is content for its mark to appear in the Font Maker's
  interface — a license permitting reuse and a project agreeing to be represented in another
  product are separate questions.

If the answer to the last point is no, delete this directory and the `#osPickLogo` markup, CSS and
`osPickRender` gate in `Hebrew_Font_Maker.html`; the picker's text credit and link stand on their own.

## Runtime

The logo renders **only** while every entry in `starting-fonts/manifest.json` carries
`partner: "opensiddur"`. Stage a font from a second partner and it hides itself, so no partner's mark
is ever shown over another's fonts. Nothing under `partners/` is precached by `sw.js`; the file rides
the runtime cache-first catch-all, so replacing it needs no VERSION bump (editing the page does).
