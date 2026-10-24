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
every verse links to its complete video, nothing redistributed. One video at a time is the recipe below; the whole
series (a dump of the maintainer's own downloads) is *Bulk intake* at the end — same scripts, driven by
`scripts/build-totaltorah-bulk.mjs`.

## Facts that hold for every video (learned on the first one)

- **Nearly every video opens with a spoken English announcement** ("Parashat B'reishit, Year 1, Aliyah 4"; a
  maftir says "Maftir"; a few videos open on the chant itself) that must never reach a verse file. The boundaries
  step reads it with an English speech model (`facebook/wav2vec2-base-960h`, pinned in `totaltorah-lib.mjs`),
  finds the aliyah number's timestamp and cuts at the first pause after it; it prints the transcript, the match
  and both rules' values. Silence alone cannot do it: in two of seven Bereshit videos the cantor runs straight
  from the announcement into the first words, in one she pauses inside the announcement, and a fifth of the
  series has no 0.6 s silence anywhere (the first-silence rule then says 0). A Hebrew forced alignment cannot
  either — it parks the first words on the English and scores the rest no worse. A video the transcript cannot
  settle (no "aliyah N" heard, an announcement that goes on — "and maftir for the parsha" — or no pause after it)
  is cut by the fallback and flagged `introUnconfirmed` in the ledger (`status` lists them): listen to its first
  verse before verifying. `--intro <s>` overrides by ear, `--intro silence` is the old rule alone.
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
  a fresh container run `--setup` once; it needs `huggingface.co` and `download.pytorch.org` reachable (the two
  models, ≈ 1.6 GB together, download on first use into the Hugging Face cache).
- The MP3s are **not** sized for this repo: ~165 KB per verse, ≈ 1 GB for the whole Torah. The Trainer plays them
  from the Cloudflare R2 bucket `totaltorah-audio` (`TT_AUDIO_BASE`, the bucket's custom domain `audio.ivritsuite.com`; CORS for the
  site's origins set on the bucket), and the private `Hbleiberg/TotalTorahAudio` repository (`audio/<file>.mp3`,
  the same `LICENSE.txt`, a README) is their master copy. A new or re-cut verse file goes to both — a push to the
  repository, and one `PUT https://api.cloudflare.com/client/v4/accounts/<account>/r2/buckets/totaltorah-audio/objects/audio/<file>`
  with a Workers R2 Storage: Edit token the maintainer holds (never in a file, never in the chat) — and only the
  manifest entry and the timings file go into `data/totaltorah/` here.

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
   MP3s (moved to the audio repository before the commit — they are never committed here),
   `source-data/totaltorah-cache/verses/` FLACs (the hand-back set for Adas), the manifest entries, the
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

- Fetch a video not named in the whitelist, or a playlist. Never commit anything under `source-data/*-cache/` or
  `source-data/totaltorah-out/` (the Adas listings in `source-data/totaltorah-adas/` are committed inputs).
- Cut by the silence table alone, merge or split a segment to make the count fit, or ship a verse whose word count
  disagrees with the page's (the timings script refuses; so does the trope index builder — same rule).
- Flip `verified` / `timingsVerified` yourself, embed YouTube, or add a `frame-src`.
- Commit an MP3 here: the verse files are served from the R2 bucket and kept in `Hbleiberg/TotalTorahAudio`
  (≈ 1 GB for the series); this repo holds the manifest and the timings.

## Bulk intake — the whole series (`scripts/build-totaltorah-bulk.mjs`)

Six resumable steps, each safe to re-run: `adas`, `meta`, `inventory`, `stage`, `run`, `status` (the header comment
has every flag). Facts learned preparing the first pass (Oct 2026):

- **The Adas page lists every video with its verse range.** Five book pages (`/trope-breishit` … `/trope-dvarim`):
  under each "Parshat X" heading, Year 1 / 2 / 3 columns, rows Aliyah 1–7 (one link per year) and Maftir entries,
  each followed by a chapter:verse range — 1,031 links. The site answers 406 to a cloud address (curl and headless
  Chromium alike), so the pages were read through the WebFetch tool and kept as `source-data/totaltorah-adas/<book>.tsv`,
  the committed input of `adas --accept`, which writes `scripts/totaltorah-videos.mjs` with every range cross-checked
  against hebcal's triennial tables. The page's own division wins when it chains with its neighbours (Adas cuts a few
  readings differently: Achrei Mot-Kedoshim Y2 A6/A7, Matot-Masei Y2 A5/A6); a range that breaks the chain or lies
  outside its parasha is a typo and hebcal's stands; the row's `note` says which. Doubled parshiyot are listed
  combined and follow the pair's combined table; Ha'azinu and V'Zot HaBerachah have one set for all three years
  (`year: null`). One entry has no link (Bereshit Y2 A4, Genesis 3:1–3:21): it gets a row once its id is known.
- **The series repeats readings.** Yitro's Decalogue (years 2 and 3), Va'etchanan's, Beshalach's Song, Shemini's
  chapter 11, the end of Ki Tavo — 30 ranges have two or three videos. `run` cuts each verse once (`split
  --keep-existing`; the first video in Torah order wins) and marks the rest `duplicate`. Maftir and "w/Chazak"
  videos repeat verses an aliyah already holds, so `run` skips them unless `--maftir` / `--chazak` is given.
- **YouTube's bot gate also refuses metadata from a cloud address after a call or two.** `meta` reads each title
  through the oEmbed endpoint instead (no gate, ~0.4 s each; title and channel only) and records `check` on the row:
  the title ("B'reishit, Year 1 Aliyah 1") must name the row's parasha, year and aliyah. `meta --ytdlp` fetches the
  fuller info JSON (duration, upload date) where the gate allows; without it, `stage` synthesizes `<id>.info.json`
  from the row and ffprobe (a dump's own yt-dlp sidecars are used as they are).
- **The maintainer's dump names each file by its YouTube title and ships a video list** (`Tricks of the Trope -
  Video List.txt`: one "<title> - https://www.youtube.com/watch?v=<id>" line per video, lessons and Megillat Esther
  included). `inventory` reads any such `.txt` and matches by id, because names alone go wrong: the channel
  re-uploaded five aliyot under titles that differ by a comma (Bereshit Y2 A3; Noach Y1 A1, A5, A6; Noach Y2 A2) and
  the Adas page links one of each pair. Three page links are dead (Behar-Bechukotai Y3 A7 and its Chazak answer 403,
  Nasso Y1 A7 404) and Bereshit Y2 A4 has none; the channel's working uploads are hand rows in the whitelist, each
  with a `note` naming the page's id. The rest of the dump (the lessons, Esther, the off-page uploads) stays
  unmatched on purpose.
- **Some announcements go on past the aliyah number**, and the transcript walk follows them: "… Aliyah 7 and
  maftir for the parsha" (a Y3 A7 that doubles as the maftir), "… Year 2 Aliyah 1 and Year 3 Aliyah 1" (one video for
  a reading two years share — the whole of Yitro's year 2, Beshalach's Song, Ki Tavo's end). Two videos open with a
  spoken lesson no word list can follow ("within this aliyah you will hear the special journeys melody…": Matot-Masei
  Y2 A6 `trWHG-GpADQ`, the Tochechah of Behar-Bechukotai Y2 A7 `iPtBgpnYK-k`); they were cut with `run --only <id>
  --redo --intro <s>` after reading the English transcript word by word. One video opens on the chant with no
  announcement at all (Beshalach Y2 A3 `jIqnsc45oOQ`, cut at 0 s). One recording does not hold its range: Toldot Y3
  A7 `-CmdgOZKR14` (page and hebcal say Genesis 28:5–28:9) chants from 28:7 — every verse scores near zero and the
  words come twice as fast as anywhere else; the alignment-plausibility scan (mean word score, words per second,
  zero-score verses) is how such a video shows itself, and the maintainer decides its range by ear. A range so
  decided goes into the row's `ref` with a `heard` note (Toldot Y3 A7: 28:7–28:9, its announcement's maftir;
  28:5–28:6 have no recording anywhere in the series), and `adas` keeps a `heard` row's ref over the page's.
- **Never two aligners at default threads on one machine.** Two torch processes spinning on four cores slowed a
  video from 35 s to 290 s; two chains run with `OMP_NUM_THREADS=2` each (together about 1.5× one chain's pace),
  on different books, each with its own `--out` and `--ledger`, as detached processes (a harness background
  command is cut off after two hours). `status` reads every ledger, the later run's entry winning.
- **A long aliyah does not fit one attention pass.** 360 s of audio took 8.7 GB in one pass on this machine; the
  aligner runs the network in 40 s windows (4 s overlap, half dropped on each side) and force-aligns the stitched
  emission once — 2.6 GB and 77 s for the same file, ≈ 0.2 s of CPU per second of audio. The model loads once per
  run (`align_totaltorah.py --serve`, pinned to its commit in `totaltorah-lib.mjs`).
- **The intro end is read off the English transcript** (the fact above); the scored-candidates rule that preceded
  it chose the file's start in four of eight Bereshit videos (a forced alignment of the Hebrew from 0 s parks the
  first two words on the English and scores higher), so it is gone. The alignment itself is sound: re-aligning the
  verified pilot video reproduced the maintainer-approved cuts within 0.1 s on every verse but the intro one.
- **A cut ends at the first pause after the verse's last word, not at the word's aligned end.** The alignment ends a
  held note early: with the old rule (aligned end + 0.4 s, + the 0.15 s pad) the last verse of about a third of the
  series lost its closing cadence — by more than half a second in 181 videos, 4.7 s at the end of Genesis — and the
  maintainer heard it on Toldot Y3 A7's 28:9. `extendEndsToPauses` (in the boundaries pass, and `ends --apply` for
  files already cut) moves a boundary later to the pause (−45 dB for 0.15 s, + 0.1 s), only where the old cut ended
  more than 0.1 s before it, never within 0.2 s of the next verse's first word.
- **A video that ends with a spoken announcement gets an `outro`.** Vayechi Y3 A7 (`URmDtWg75tg`, "with Chazak") and
  V'Zot HaBerachah A6 (`8f_kHQdPwJs`) end with "the congregation says chazak chazak v'nitchazek" and the reader's
  repeat, with no pause long enough for the end rule; the whole-file alignment also stretched the last two words
  over that speech, so the highlighting stalled. The row's `outro` (the speech's start, read off the English
  transcript of the tail and the silence before it) stops the alignment and the cut there; `adas` keeps it. A verse
  whose highlighting the maintainer hears drifting can be re-timed alone with the per-verse pass (`alignVerses`, the
  `realign` timings) — it fixed Genesis 21:13, where the whole-file pass stretched *ben* over *ben-ha'amah*.
- **Timings come from the whole-file alignment by default** (`--timings derive`; `realign` is the per-verse second
  pass of the recipe above), so each video is aligned once: the series' ≈ 34 h of audio is about 7–8 h of CPU here,
  plus ffmpeg (the source is decoded once per video since the same pass).
- **The corpus never goes into this repo.** ≈ 1 GB of MP3 for the whole Torah. `run` refuses more than ~400 verses
  into `data/totaltorah/` without `--into-repo`; the series goes `--out source-data/totaltorah-out` (gitignored,
  one folder per book when two chains run), the folders are merged, the manifest + timings (≈ 4 MB) move into
  `data/totaltorah/`, and the MP3s are pushed to `Hbleiberg/TotalTorahAudio` one book per commit (a push of the
  whole gigabyte at once is refused by the proxy) and uploaded to the R2 bucket through the Cloudflare API, six
  at a time (about four files a second; the API allows ~1,200 requests per five minutes).

Steps:
1. `node scripts/build-totaltorah-bulk.mjs adas --accept` — only when the TSVs change; the whitelist is committed.
2. `node scripts/build-totaltorah-bulk.mjs meta` — once; resumable; commit the rows it fills in.
3. `node scripts/build-totaltorah-bulk.mjs inventory --from <dump>` — any layout (book / parasha / year folders or
   flat; English in any spelling or Hebrew; ids in `[brackets]`, yt-dlp sidecars, or a video list `.txt` in the dump).
   Read the unmatched list, fix names, repeat until it is empty.
4. `node scripts/build-totaltorah-bulk.mjs stage --from <dump> --apply` (hard links; `--copy` across filesystems).
5. `node scripts/build-totaltorah-timings.mjs --setup` once per container, then
   `node scripts/build-totaltorah-bulk.mjs run --parsha Bereshit` (a pilot) or
   `run --book <Book> --out source-data/totaltorah-out/<book> --ledger <name>` (the series, two chains on
   different books at once, `OMP_NUM_THREADS=2` each). `status` is the ledger; `--redo` recomputes; a failed video
   is listed and retried on the next run.
6. The listening pass: `status` prints the `verify --parsha` pair for every parasha with cut, unheard verses;
   `verify --video <id>` flips one aliyah. Nothing plays until flipped.
7. Commit the whitelist, the manifest and timings of what was accepted, and only a pilot's MP3s; bump `TT_DATA_V`
   and `VERSION` as in step 6 above.
