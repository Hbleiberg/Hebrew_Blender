---
name: addOSFont
description: >-
  Intake a partner "starting font" for the IvritSuite Hebrew Font Maker's ?start= deep link —
  validate a TTF/OTF against the partner license allowlist, stage it under starting-fonts/<id>/
  with its upstream LICENSE.txt, append starting-fonts/manifest.json, and print the live
  Hebrew_Font_Maker.html?start=<id> URL plus a paste-ready <a> snippet to send the partner
  (Open Siddur Project). Use this whenever the user invokes /addOSFont, drops a font file and asks
  to "add this font to the starting fonts", "make an Open Siddur edit link for this font", "add a
  partner font", "stage this font for the Font Maker deep link", or mentions "OS font intake" —
  even loosely phrased ("get this ttf onto Aharon's page", "new starting font").
---

# /addOSFont — partner starting-font intake

You are staging a font that outside users will open through
`https://ivritsuite.com/Hebrew_Font_Maker.html?start=<id>` and legally build derivatives of.
**Truth comes from the font file and its upstream license text — never invent or guess metadata.**
The workhorse is `scripts/add_os_font.py` (Python 3 + fontTools; if it exits 2, run
`pip install fonttools` and retry).

## Protocol — in order, no skipping

1. **Input.** A `.ttf`/`.otf` file path (dragged into the session, or fetched from the partner's
   repo — record the exact upstream URL you took it from). Refuse other formats and TTC
   collections. Locate the upstream license file that ships WITH the font (a LICENSE/OFL/README
   next to it in the source repo); if the license text only exists inside an HTML page, extract
   the license block verbatim to a `.txt` first — transcribe, never rewrite.
2. **Extract truth (dry run).** Run:
   `python3 scripts/add_os_font.py <font> --upstream <url> --license-file <path> --dry-run`
   Read what it detected: license classification + evidence, copyright lines, Reserved Font
   Names, cmap coverage, embedded family name. Pass `--name` only when the embedded family name
   is stale/wrong for the distribution (the script records the embedded one as
   `nameTableFamily`); pass `--designer` only with a cited source (folder attribution, README,
   copyright line).
3. **License gate — a hard STOP, never bypass it.** Allowlist: OFL-1.1, GPL v2/v3 **with** font
   exception, Apache-2.0, CC0/public domain. If the script refuses (bare GPL, LPPL, UFL,
   unknown, OFL≠1.1, ambiguous multi-license) or anything about the provenance looks off
   (filename/folder disagrees with embedded metadata and you can't resolve it from the
   distribution's own docs): **stop and ask the maintainer**, printing exactly what was found
   and, if upstream info is missing, a suggested email to send Aharon. Do not stage, do not
   "pick the closest license".
4. **Stage.** Re-run without `--dry-run` (confirm the slug with the maintainer if it collides —
   `--force` replaces — or reads oddly). The script copies the font + LICENSE.txt into
   `starting-fonts/<id>/`, appends the manifest, and self-smokes (≥27 Hebrew base letters,
   sha256 match, manifest re-parses). Warn-don't-block findings (missing finals/marks) go in
   your report.
5. **Hand-off.** Relay the script's printout: the live URL, the
   `<a href="…">Edit this font using IvritSuite</a>` snippet, and the one-line summary for
   Aharon (font, license, reserved names honored).
6. **Ship.** `git add starting-fonts/ && git commit` per the repo's git rules. **No `sw.js`
   VERSION bump is needed for an intake** — the manifest is served network-first and font
   binaries are fetched on demand (see CLAUDE.md → Starting Fonts). Append a one-liner to
   `docs/IMPROVEMENT_LOG.md` noting the intake.

## Invariants (from the runtime's contract — do not break)

- `id` is a URL-safe slug; `file`/`licenseFile` are paths relative to `starting-fonts/`.
- `copyright` and `reservedFontNames` are verbatim detections. Reserved names are recorded for
  **every** license, not just OFL — if the upstream reserves a name, the Font Maker forces the
  derivative to be renamed, whatever the license.
- LICENSE.txt is the upstream's own text, byte-faithful (plus nothing).
- Never hand-edit `manifest.json` shape; the script owns it (`{"schema":1,"fonts":[...]}`).
