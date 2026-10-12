---
name: addTOTT
description: >-
  Intake one more "Tricks of the Trope – Total Torah" aliyah video (Cantor Arianne Brown, Adas Israel) into the
  Torah Trainer's Total Torah recording source — add the video to the whitelist, get its audio (the metadata by
  yt-dlp; the audio itself usually from a signed-in machine, because YouTube refuses cloud addresses), find the
  verse boundaries by alignment (every video opens with a spoken intro), cut the verse MP3s + FLACs, align the word
  timings, hand the maintainer the listening checklist, bump the data cache-buster, verify, and open or update the
  draft PR. Use this whenever the user invokes /addTOTT or asks to add, import, cut or wire up another Total Torah
  / Tricks of the Trope aliyah, parasha or video for the Torah Trainer ("add Bereshit aliyah 2", "next TOTT video",
  "bring in Noach from Adas").
---
# /addTOTT — add a Tricks of the Trope – Total Torah aliyah

Read first: `docs/reference/torah-and-trope.md` → *Recording sources* (how the page uses the files), and the
header comments of `scripts/build-totaltorah-audio.mjs` and `scripts/build-totaltorah-timings.mjs`. The
permission terms (`THIRD_PARTY_LICENSES.md` → Total Torah) bound everything here: verse cuts only, full credit,
every verse links to its complete video, nothing redistributed.

## Facts that hold for every video (learned on the first one)

- **There is ALWAYS a spoken intro before the chanting** (the aliyah's name). It must never reach a verse file.
  The boundaries step detects it as the first silence after at least a second of sound and prints it; confirm by
  ear and override with `--intro <s>` when it is wrong.
- **Silence alone never finds the verses.** The cantor's mid-verse pauses (etnachta, zakef) are quieter than her
  breaths between verses, so `silencedetect` cuts inside verses and misses the verse ends. The cut comes from one
  whole-file forced alignment (`--boundaries <id>`), midway through each inter-verse gap. Never hand-guess from
  the silence table; never let `split` run without `--boundaries auto` (it will refuse anyway).
- **YouTube's bot gate refuses unauthenticated downloads from cloud addresses** ("Sign in to confirm you're not a
  bot", 429). `fetch` still saves the metadata JSON (title, duration, upload date — the manifest's credit reads
  it), then fails on the media. Do not pass cookies or route through another service. Ask the maintainer to
  download the audio on a signed-in machine (`/ytdownload <url> -a`, or any extractor) and attach it; drop it in
  the cache as `source-data/totaltorah-cache/<id>.mp3` (or `.m4a`) beside `<id>.info.json`. Sanity: ffprobe
  duration within 2 s of the metadata's, mean volume above −50 dB.
- **One video = one triennial aliyah.** Its `ref` is the aliyah's full verse range; `split` cross-checks it
  against `data/leyning/triennial.json` (`parshiyot[n].variations["Y.<year>"][aliyah]`) and reports a mismatch —
  report it in the PR, never "fix" the data.
- **Nothing plays until the maintainer listens.** Every manifest entry is written `verified:false` /
  `timingsVerified:false`; only `build-totaltorah-audio.mjs verify` flips them, by hand. Alignment scores for
  chant are modest (sustained vowels, melismas): a word under 0.5 is a hint to listen, not a failure.
- **The manifest is one `/data/` file with a cache-buster.** Adding entries changes it, so bump `TT_DATA_V` in
  `torah_trainer.html` (the manifest and every timings file share it) and `VERSION` in `sw.js`. New MP3s and
  timings files are new URLs and need no bump of their own.
- **The venv and model are not in the repo** (`source-data/totaltorah-cache/align-env/`, ~1.2 GB, gitignored). In
  a fresh container run `--setup` once; it needs `huggingface.co` and `download.pytorch.org` reachable.
- The data is **not** sized for the repo beyond the mockup: ~130 KB per verse at today's setting, ~35 h of audio
  for the whole Torah. The PR body's *Phase 2 hosting* section is the plan (R2 + one `media-src` origin).

## Steps

1. **Whitelist the video.** Add a row to `scripts/totaltorah-videos.mjs`:
   `<id>: { parsha: '<English name as data/parshiyot.json spells it>', year: <1|2|3>, aliyah: <1–7>, ref: '<Book> C:V-C:V' }`.
   The id is the 11-character YouTube id from https://www.adasisrael.org/trope; the parasha and aliyah are in the
   video's title ("B'reishit, Year 1 Aliyah 1"); the ref is that triennial aliyah's range (read it from
   `data/leyning/triennial.json`, never from memory).
2. **Metadata + audio.** `node scripts/build-totaltorah-audio.mjs fetch --video <id>` — on a cloud address expect
   the media to fail after the metadata is saved; get the audio from the maintainer as above and place it in the
   cache. (If the download succeeds, the m4a is already there.)
3. **Boundaries.** `node scripts/build-totaltorah-timings.mjs --boundaries <id>` (add `--setup` the first time in
   a container). Read the silence table, the intro end and the per-verse ranges it prints; a gap under 0.3 s
   between verses is flagged — listen there. Re-run with `--intro <s>` if the intro end is wrong.
4. **Cut.** `node scripts/build-totaltorah-audio.mjs split --video <id> --boundaries auto` → `data/totaltorah/audio/`
   MP3s, `source-data/totaltorah-cache/verses/` FLACs (the hand-back set for Adas), the manifest entries, the
   triennial cross-check and the per-verse sizes.
5. **Timings.** `node scripts/build-totaltorah-timings.mjs --audit [--only "<Book> C:V,…"]` → the timings files,
   the per-word table with scores, the wall-clock, and `source-data/totaltorah-cache/audit.html`.
6. **Page.** Bump `TT_DATA_V` in `torah_trainer.html` and `VERSION` in `sw.js`. Nothing else in the page changes
   for a new aliyah (the Recording row, the chip and the credit read the manifest).
7. **Verify.** `node --experimental-vm-modules scripts/check-inline-js.mjs`, `node scripts/check-i18n.js`, the
   Playwright recipe (`docs/reference/ops.md`) on the new range with `?ref=<Book> C:V-C:V&reader=totaltorah`,
   serving `data/totaltorah/` with the new entries treated as verified for the capture only; `pageerror` 0, a Loop
   per verse, the chip, the credit's two links, a word lit at a timing. Re-capture the previews only if the
   maintainer asks.
8. **Commit** `scripts/totaltorah-videos.mjs`, `data/totaltorah/` (audio, timings, manifest), the two bumps —
   never the cache. Draft PR (or the open one) with: the video, the intro end, the boundaries, the triennial
   cross-check, the per-word table with scores and the flagged words, the wall-clock, the sizes, and the two
   `verify` commands for the maintainer.
9. **Hand over the listening pass.** The maintainer listens (verse files, then the audit page with karaoke on)
   and runs the two `verify` commands the scripts printed; only then does the live page play the new aliyah.

## Never

- Fetch a video not named in the whitelist, or a playlist. Never commit anything under `source-data/`.
- Cut by the silence table alone, merge or split a segment to make the count fit, or ship a verse whose word count
  disagrees with the page's (the timings script refuses; so does the trope index builder — same rule).
- Flip `verified` / `timingsVerified` yourself, embed YouTube, or add a `frame-src`.
