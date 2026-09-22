# IvritSuite (Hebrew Blender)

A suite of browser-based tools for Hebrew literacy instruction — no installation, no build step, no server required (accounts are optional and additive). Open any HTML file directly in a browser or serve the folder statically.

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
- Inverse mode, **custom card count**, scoring + results review, presets in nested folders, **Hebrew and English/Latin font pickers**, nikkud color-coding, TTS, dark mode, and a **Present/fullscreen mode** for projectors

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

### Trope Tutor (`trope_tutor.html`)
An interactive tutor for the Torah cantillation marks (trope / te'amim) — the companion to the Torah Trainer's trope color coding.

- **Learn mode** — the marks taught one clause family at a time: symbol, **Ashkenazi and Sephardi names** (switchable primary tradition), a teaching note, and 3–4 **real chanted examples** per mark with one-tap playback
- **Drill mode** — 10-question sessions in three directions: see a marked word → name the trope; hear a clip → pick the symbol; see a symbol → pick the matching melody
- **Per-trope mastery + personal-best streak** — misses resurface more often, and distractors lean into same-shape confusables (pashta vs. kadma) as you improve
- **Real audio, zero live dependencies** — every example is clipped from [PocketTorah](https://pockettorah.com)'s recordings using their word-level timings, via a pre-built static index (`data/trope/trope_index.json`, generated offline by `scripts/build-trope-index.mjs` from Sefaria's Hebrew text)
- Hebrew font picker (incl. My Fonts), dark mode, guided tour, playback-speed control

### Hebrew Font Maker (`Hebrew_Font_Maker.html`) — Beta
Turn your own handwritten Hebrew letters into a real, installable font — entirely in the browser. (The current version is shown in the tool's About tab.)

- **Trace from images** — upload one letter per image, one sheet of all letters (marquee-crop each), or import an existing TTF/OTF; sub-pixel marching-squares tracing with cubic-Bézier fitting and a point editor
- **Nikkud & trop anchors** — place vowel and cantillation marks per letter; exports real GPOS mark-to-base (nikkud) and mark-to-mark (trop) positioning, plus pair kerning
- **Printable handwriting templates** — letters, vowels, trop, and punctuation/digit worksheets to fill in and scan back
- **QA Check** — a collision grid flags any letter × mark overlaps before you export
- **Export** — TrueType (TTF), WOFF2, or editable UFO source, each with a license of your choice (CC0 / OFL / MIT / CC-BY / All Rights Reserved)
- **Use in IvritSuite** — save a finished font in the browser and pick it from any other tool's font picker
- **Save to your account** — with a free account, keep whole projects (photos included) in the cloud and open them on any device; see *Accounts* below
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
- **Hebrew interface** — every page has an EN / עברית switcher (`js/i18n.js` + `locales/`); in Hebrew the UI mirrors to right-to-left, while worksheets, cards and projected content keep their own language settings.
- **`.ivrit` save files** — portable backups (see the next section).
- **AllTools backup** — the gear modal on the landing page bundles every tool's settings into one export/import/erase, either as an `.ivrit` file or a JSON blob.
- **My Fonts** — custom fonts made (or uploaded) in the Hebrew Font Maker are stored in the browser and appear in **every** tool's font picker automatically; you can upload your own `.ttf`/`.otf`/`.woff`/`.woff2` from any picker.
- **Nikkud color-coding** — vowel-by-color rendering with two selectable schemes, **Default** and **TaL AM** (matching the TaL AM curriculum poster), in three styles (color / highlight / underline).
- **Guided tours** — all seven tools (Generator, Dictionary, Dashboard, Flash Cards, Torah Trainer, Trope Tutor, Font Maker) ship a first-visit "❓ Tour" walk-through that never changes your data.
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
- The landing-page **AllTools** save file bundles *every* tool at once (Generator, Dashboard, Flash Cards, Dictionary, Torah Trainer, and Trope Tutor settings/progress — plus any fonts you built in the Hebrew Font Maker).
- Each file knows which tool it came from (recorded inside the file, so it still works even if you rename it). Dropping the wrong kind of file onto a tool warns you first.
- On restore you choose **Merge** (add to what you have) or **Replace** (start fresh from the file).

---

## Accounts (optional, Supabase)

Accounts are optional: everything works anonymously exactly as before, and the cloud is a third place
to keep copies of your work next to the browser's own storage and `.ivrit` files. The whole account
layer is four shared files — `js/supabase-config.js` (public project settings), `js/ivrit-account.js`
(sign-in, sign-out, the header chip), `js/ivrit-saves.js` (the cloud-saves panel and the sync rules) and
`js/ivrit-projects.js` (Font Maker projects) — plus two throwaway pages for trying it out,
`account-test.html` and `saves-test.html`. The chip and the panel are on the home page, the Worksheet
Generator, Flash Cards, the Dictionary, the Torah Trainer, the Trope Tutor and the Classroom Dashboard;
the Font Maker keeps whole projects instead (next paragraph).
How it works inside: `docs/reference/accounts-and-cloud.md`.

**Where the config values come from** (Supabase dashboard → project *IvritSuite*):
- `url` — Project Settings → API → Project URL.
- `anonKey` — Project Settings → API Keys → the *publishable* key (`sb_publishable_…`). It is safe to
  commit: it only names the project, and Row Level Security keeps every user's rows private. To
  rotate it: create a new publishable key in the dashboard, paste it into `js/supabase-config.js`, bump
  `VERSION` in `sw.js`, deploy, then disable the old key. **Keep `url:` and `anonKey:` at the start of their
  lines, in single quotes** — the keep-alive workflow reads them out of the file with a plain text search, so
  double quotes, a template literal or a one-line object break it with "Could not read url / anonKey".
- `sdk` / `sdkIntegrity` — the pinned `@supabase/supabase-js` build on jsDelivr and its integrity hash
  (the file header explains how to recompute it when upgrading).
- `enabled: false` switches accounts off site-wide (no chip, no downloads, no network calls).

**One-time dashboard setup** (Authentication section unless noted):
1. *URL Configuration* — Site URL `https://ivritsuite.com`; Redirect URLs `https://ivritsuite.com/**`,
   `http://localhost:8080/**`, `http://127.0.0.1:8080/**` (the last two are for local testing). The
   delete-account Edge Function keeps its own hardcoded copy of this list — changing one means changing both.
2. *Sign In / Providers → Email* — enabled, sign-ups allowed, Email OTP length 6. Passwords are never
   used; people get an email with a 6-digit code.
3. *Emails → Templates* — make **both** *Confirm signup* (a person's first email) and *Magic Link*
   (every later one) code-only: the body shows `{{ .Token }}` and has **no** `{{ .ConfirmationURL }}`
   link. School mail filters open every link in an incoming email to scan it, which spends a one-time
   sign-in link seconds after it is sent (seen in the auth logs: two scanners hit the link before the
   teacher could); a code cannot be spent that way. Suggested subject: "Your IvritSuite sign-in code".
   If the *Email OTP Expiration* setting changes, change the "expires in" wording in the templates too.
4. *Emails → SMTP Settings* — **required before anyone but the project's team members can sign in**:
   Supabase's built-in sender refuses other addresses ("Email address not authorized") and allows only a
   few messages per hour. Use a transactional provider with a free tier (Resend, Brevo, Postmark), sender
   `no-reply@ivritsuite.com`, and add the SPF/DKIM records it gives you at Cloudflare. Then raise
   *Rate Limits → emails per hour* above the default 30.
5. *Sign In / Providers → Google* — in Google Cloud Console (Google Auth Platform) create the consent
   screen (External, app name IvritSuite, authorized domains `ivritsuite.com` and
   `hhkmqwpjsyxdeuhvcyis.supabase.co`, basic scopes only, then **Publish**; with no logo and only basic
   scopes Google needs no verification review) and a *Web application* OAuth client with redirect URI
   `https://hhkmqwpjsyxdeuhvcyis.supabase.co/auth/v1/callback`; paste the client id + secret into
   Supabase and enable the provider.

**Trying it:** `python3 -m http.server 8080` from the repo root and open
`http://localhost:8080/account-test.html` — or, without a local server, merge and open
`https://ivritsuite.com/account-test.html` (the page is `noindex` and loads nothing on any tool page).
Use the chip (or the buttons) to sign in with your email or Google, watch the state box and the
console, sign out. `node scripts/smoke-account.mjs` runs the
headless checks (with `--sdk <path to dist/umd/supabase.js>` it also exercises the loaded SDK).

**Privacy, in one paragraph:** nothing is stored on a server unless a signed-in person clicks upload.
An account holds the email address (and a Google name when Google is used), a display name and only the
items uploaded from a tool's *Cloud saves* panel — which, when a teacher chooses it, can include student
names and practice results from Flash Cards and class lists from the Classroom Dashboard. Accounts are for teachers and other adults; students never
need one. Every cloud item can be downloaded as a file or deleted from the panel, and nothing on the
device is ever deleted by the cloud. The full wording lives in `privacy.html` and `terms.html` (the
`privacy.legal.*` / `terms.legal.*` rows of `locales/ui-strings.csv`, English and Hebrew); a change to
what an account can store updates that text in the same commit.

**Database:** the tables, buckets and Row Level Security policies are plain SQL files under
`db/migrations/`, applied once per file; `db/README.md` explains how to apply one and how to check the
live project. The one server-side function (delete my account) lives under `db/functions/`, in the same README.

**Cloud saves:** each tool's saved items stay in the browser exactly as before; signed in, a "Cloud saves"
panel lists them next to the copies in your account with plain words (*Only on this device*, *Newer in
the cloud*, *Changed in both places*…) and one button per row — Upload, Download, Merge, Keep both. Nothing
on the device is ever deleted by the cloud, and nothing newer is overwritten by something older unless you
choose it. Where the panel sits: the Generator and Flash Cards under *Advanced* next to the `.ivrit` backup,
the Dictionary inside the Word Lists manager, the Torah Trainer, Trope Tutor and Classroom Dashboard in their
settings drawer, and
the home page's *Import / Export All Settings* modal holds one panel per tool — the place to bring a fresh
browser up to date. The chip's **Account…** item opens the account screen: when the account was last
saved, what each tool holds on this device and in the account, **Sync everything** (or, while the account
is empty, **Upload everything on this device** — a copy; nothing is removed from the device), and two
backup buttons — everything in the account as one `.ivrit` file, or the home page's modal for everything
on the device. It opens by itself after every fresh sign-in ("Sync settings from your last login?") and
once on a device that already has saved items. When a tool's settings differ on this device and in the
account — the usual case on a second device, which wrote its own settings the first time the tool opened —
the screen offers **Use my account's settings** or **Keep this device's settings** in one step (per-device
choices such as zoom stay either way). The site-wide preferences — language, theme, keyboard layout, the
Hebrew font and size, the Font Maker author name, the Dictionary's romanization, speech rate, emoji choices and nikkud colours
— sync as one row, **IvritSuite preferences**, and the language and theme switch live when it lands. Fonts you
made or uploaded travel too, one row each, so a font chosen on the laptop actually renders on the phone; a
device already holding the ten My Fonts allows says so rather than dropping one of yours to make room. A preset,
deck, student or class deleted on one device is never removed anywhere by itself: its row reads *Deleted on
this device* with *Bring it back* / *Delete from your account too*, and *Sync everything* leaves it alone.
The account's `.ivrit` backup is *partial* — the account's copies only — so the home page merges it without
the Merge/Replace question, class lists included. `saves-test.html` exercises the panel on a set of throwaway test items;
`node scripts/smoke-saves.mjs` and `node scripts/smoke-tools.mjs` run the headless checks, and
`node scripts/smoke-sync.mjs --sdk <supabase.js>` replays the second-device sync flow against a fake cloud.

**Font Maker projects:** *Save Project ▾ → Save to my account* keeps a whole project — the outlines, the
settings, and the photos you traced from, at full size — in your account, and *Load Project ▾ → In your
account* opens it on any device. From then on changes keep saving by themselves (a ☁ badge next to Save
shows Saved, Saving or Unsaved); a change made on another device is never overwritten without asking
(Overwrite / Keep both / Not now); an exported font can be kept with the project. Your `.hebrewfont` files
and the browser's Recent copies are untouched. Photo projects are large (often 20–40 MB), so the Load menu
and the account screen show each project's size; an account holds up to 25 projects.
`node scripts/smoke-fontmaker.mjs --sdk <supabase.js>` replays the whole flow against a fake cloud.
**Your account page** (`account.html`, linked from the account screen and the privacy policy): who the
account is and its display name; everything it holds tool by tool (counts, sizes, the names of presets and
student profiles); **Download everything** — one zip with an `.ivrit` of every saved item plus each Font
Maker project as a `.hebrewfont` with its photos and its exported font; and **Delete my account**, which
asks for a checkbox and the account's email address, then removes the account with everything in it through
the one piece of code that runs outside the browser (`db/functions/delete-account/`, a Supabase Edge
Function — it needs the project's secret key, which never ships in a page). A deletion touches nothing on any
device. `node scripts/smoke-account-page.mjs --sdk <supabase.js>` replays the page against a fake cloud.

`node scripts/smoke-migration.mjs --sdk <supabase.js>` is the golden migration replay: a device A built from the
tools' real defaults (every setting changed, folders, students, word lists, classes, a weekly grid, the suite-wide
preferences) uploads everything, a fresh device B syncs it all, and every difference left between the two is
classified — anything unexplained fails the run. It also replays a round trip, a folder move, deletions that never
propagate by themselves, the account backup on a third device, and a second device that opened every tool before
signing in.

**Keeping it running (operations):**
- **The free project must stay awake.** Supabase pauses a Free-plan project after about a week with too little
  *database* activity, and a paused project refuses every sign-in until someone presses *Restore* in the Supabase
  dashboard (local saves, `.ivrit` files and everything anonymous keep working; the chip looks normal, but every
  sign-in and sync fails with one error line). `.github/workflows/supabase-keepalive.yml` makes one tiny database
  request a day with the publishable key (`rpc/keepalive`, the function from `db/migrations/0003_keepalive.sql`)
  and, with the same key, checks that the three account tables still refuse an anonymous read. A failed run opens
  one tracking issue (the next green run closes it), and a new issue notifies you like any other; GitHub's own
  e-mail for a failed scheduled run goes only to whoever last edited the schedule line of the workflow, so edit
  that line once from your own GitHub account after merging (any change to the minute will do — the commits so
  far carry no GitHub identity). The schedule runs only from `main`; a push that touches the workflow or
  `js/supabase-config.js` runs it once on any branch. GitHub switches a scheduled workflow off after 60 days
  without commits — the Actions tab then shows *Enable workflow*. If the project was paused anyway: Supabase
  dashboard → the project → *Restore* (possible within Supabase's restore window — 90 days at the time of writing;
  check the current policy); nothing in the repository changes.
- **Before other people sign in** (once): custom SMTP configured and proven with a sign-in from an address that is
  not on the project's team (dashboard step 4 above — the built-in sender refuses other addresses); *Rate Limits →
  emails per hour* raised; the Google consent screen published (step 5); the redirect URLs (step 1); a
  scheduled run of the keep-alive on `main` green (Actions → *Supabase keep-alive*).
- **Rotating the publishable key:** create the new key in the dashboard (*Project Settings → API Keys*), paste it
  into `js/supabase-config.js`, bump `VERSION` in `sw.js`, deploy, confirm a sign-in, then disable the old key. The
  workflow reads the key from that file and runs once on that push, so the new key is proven at once. The key is public by design; rotating it is
  housekeeping, not an emergency.
- **Upgrading the pinned SDK:** change the version in the `sdk` URL and recompute `sdkIntegrity` as the file's
  header shows, bump `VERSION` in `sw.js`, then run **all seven** smokes with the new file —
  `smoke-account`, `smoke-saves`, `smoke-tools` (port 8080, one at a time), then `smoke-sync` (8081),
  `smoke-fontmaker` (8082), `smoke-account-page` (8083) and `smoke-migration` (8084), each as
  `node scripts/<name>.mjs --sdk <path>`. The last four refuse to run without `--sdk`; the first three
  quietly skip their signed-in scenarios instead, so a pass without it is only a partial pass. The fixture
  is `npm pack @supabase/supabase-js@<version>` → `package/dist/umd/supabase.js`, and it must be the
  version you just pinned. Full table: `docs/reference/ops.md` → *Backend smokes*.
- **A database change** is a new `db/migrations/NNNN_<name>.sql` applied once; **a change to the delete-account
  function** is a redeploy — both in `db/README.md`. Never a `supabase/` folder (the GitHub integration would open
  a paid preview branch).
- **Restoring a person's data from their *Download everything* zip:** the `.ivrit` inside goes through the home
  page's *Import / Export All Settings → Import* (choose *Merge*; it restores every tool's saved items on that
  device); each `font-projects/<name>/<name>.hebrewfont` opens in the Font Maker through *Load Project ▾ → 📂 Load
  from computer…*; an exported `.ttf` (unzip a zip export first) can be added to *My Fonts* through the *Upload
  your own font* control under any tool's Hebrew font picker. Then, signed in, *Upload everything on this device* (the account screen)
  and *Save to my account* (the Font Maker) fill the account again. A deleted account cannot be recovered on the
  server side — the zip is the only copy.
- **When something fails:** the browser console first (the modules log one line per failure and never throw into
  the page); then the Supabase dashboard → *Logs* (API, Auth, Postgres, Storage, and Edge Functions →
  delete-account), *Advisors* (security + performance; should stay clean), *Authentication → Users*;
  `account-test.html` and `saves-test.html` reproduce a sign-in and a sync without a tool page; the smokes replay
  every flow against a fake cloud. The plain-language map of what talks to what: `docs/backend-architecture.md`.
- **Free-plan limits that matter** (check the numbers on Supabase's pricing page — they change): roughly 500 MB
  of database, 1 GB of file storage, 5 GB of egress a month, 50,000 monthly active users, two free projects per
  person, no backups. Saved items are small (a preset is about 2 KB); Font Maker photo projects are what fill
  storage (often 20–40 MB each, sent again to every device that opens them), so glance at *Storage* and *Usage*
  in the dashboard first. Upgrading the organization to Pro removes the pausing rule and adds daily backups.

## Files

| File / directory | Description |
|---|---|
| `index.html` | Landing page — navigation hub, AllTools backup modal, My Fonts manager |
| `hebrew_blend_generator.html` | Worksheet / bingo / drill generator (main app) |
| `hebrew_dictionary.html` | Interactive word lookup, filters, Shoresh Explorer, and Anki/Quizlet export |
| `flash_cards.html` | Interactive flash cards with profiles and weakness tracking — Beta |
| `classroom_dashboard.html` | Live classroom projector / SmartBoard dashboard |
| `torah_trainer.html` | Weekly parsha reader with translit, vowel coloring, cantillation, TTS, PocketTorah karaoke, and verse looping |
| `trope_tutor.html` | Learn + drill the Torah cantillation marks with real chanted examples (PocketTorah clips via a pre-built index) |
| `Hebrew_Font_Maker.html` | Make a real installable Hebrew font from your handwriting — trace, anchor nikkud/trop, export TTF/WOFF2/UFO — Beta |
| `resources.html` | Curated directory of external Hebrew / Jewish-education resources |
| `contact.html` | Contact / feedback form (web3forms + hCaptcha) |
| `account.html` | Your account (optional accounts): what it holds, download everything as one zip, delete the account |
| `privacy.html` | Privacy policy |
| `terms.html` | Terms of use |
| `404.html` | Custom not-found page |
| `i18n-test.html` | Developer harness for the i18n runtime (not indexed, not precached) |
| `account-test.html`, `saves-test.html` | Developer harnesses for the account and cloud-saves modules — each exercises one `js/ivrit-*.js` module on its own, away from a real tool page (not linked, not indexed, not precached) |
| `pwa.js` | Service-worker registration + install-prompt handling |
| `sw.js` | Service worker — precaches the app shell for offline use (cache `ivritsuite-v<VERSION>`) |
| `manifest.webmanifest` | PWA manifest (name, icons, theme/background color) |
| `js/i18n.js` | Shared i18n runtime (`window.I18n`) loaded by every page — the EN / עברית switcher, `data-i18n*` filling, RTL flip |
| `js/supabase-config.js`, `js/ivrit-account.js`, `js/ivrit-saves.js`, `js/ivrit-projects.js` | The optional account layer — public project settings, sign-in + the header chip, cloud saves + the account screen, Font Maker cloud projects; the only files that talk to Supabase (see *Accounts*) |
| `locales/ui-strings.csv`, `locales/<lang>.json` | UI strings — the CSV is the single source of truth; `scripts/build-locales.js` compiles the committed per-language JSON |
| `scripts/check-i18n.js` (+ `check-i18n-baseline.txt`) | Gate for hardcoded UI strings, physical CSS and CSV quoting; the baseline lists accepted findings |
| `scripts/check-inline-js.mjs` | Parses every inline `<script>` in every root page — one syntax error kills a page's whole app while the HTML still renders |
| `THIRD_PARTY_LICENSES.md` | License terms for bundled/streamed third-party data (PocketTorah, Sefaria, fonts, etc.) |
| `CNAME`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `favicon.svg` | Static-site plumbing (custom domain, crawler hints, sitemap, Jekyll opt-out, favicon) |
| `llms.txt`, `llms-full.txt` | Curated plain-text site map for LLMs / fetching agents ([llmstxt.org](https://llmstxt.org)) — the short index and its expanded companion (how-to steps + Q&A). **Generated**, never hand-edited |
| `scripts/update-llms-txt.mjs` | Regenerates both from `sitemap.xml` + each page's JSON-LD and `<head>` metadata (plain Node, zero deps; `--check` reports staleness) |
| `scripts/update-sitemap.mjs` | Refreshes every `<lastmod>` in `sitemap.xml` from each page's last git commit (refuses to run on a shallow clone) |
| `.github/workflows/os-fonts-audit.yml`, `.github/workflows/supabase-keepalive.yml` | The two authored GitHub Actions workflows: the weekly OpenSiddur font-list audit + intake, and the daily Supabase keep-alive (one database query with the publishable key, plus a check that the account tables refuse an anonymous read) |
| `data/hebrew_words.json` | Structured word data (~2.93 MB, 13,081 entries) loaded by the generator and dictionary via `fetch()` |
| `source-data/hebrew_dictionary_4_19_2026.csv` | Pipeline-input CSV used to build `data/hebrew_words.json` (Hebrew w/ nikkud, transliteration, translation, POS, era); not served at runtime |
| `data/hebrew_emojis.json` (+ `source-data/hebrew_emojis.csv` pipeline input) | Hebrew word ↔ emoji mappings used by the dictionary and flash-card emoji modes |
| `data/parshiyot.json` | All 54 parshiyot with Hebrew/English names, Sefaria refs, and PocketTorah keys |
| `data/pockettorah/aliyah.json` | Mirrored from [PocketTorah](https://github.com/rneiss/PocketTorah) — full kriyah verse ranges per parsha |
| `data/pockettorah/manifest.json` | Maps each parsha+aliyah to its actual upstream label filename |
| `data/pockettorah/timings/*.txt` | Mirrored PocketTorah word-level timing files (432 files, ~2 MB) |
| `data/trope/trope_index.json` | Pre-built Trope Tutor index — example words + audio clip bounds per cantillation mark (~75 KB) |
| `scripts/build-trope-index.mjs` | Offline builder for the trope index (plain Node, zero deps); writes `docs/trope_index_report.md` |
| `docs/trope_index_report.md` | Build report for the trope index — per-trope counts, excluded aliyot, zarka codepoint finding |
| `data/trope/trope_motifs.json` | Pre-built melodic motif (Western notation) per cantillation mark, shown on the Trope Tutor's Learn cards |
| `scripts/build-trope-motifs.mjs` | Offline builder for the motifs — pitch-tracks the same PocketTorah clips; writes `docs/trope_motifs_report.md` (`--force` discards human-verified motifs; prefer `--only=<key>`) |
| `docs/trope_motifs_report.md` | Build report for the motifs — per-mark confidence and the hand-verified overrides |
| `docs/phonotactic_blending_filter_spec.md` | Linguistic specification for the phonotactic validity filter used by the generator |
| `docs/theme_tagging_report.md` | Build report for the dictionary's `themes` tags (an offline, LLM-assisted pipeline with adversarial review); the spot-check surface — to fix a word, edit its `themes` array in `data/hebrew_words.json` and bump the `?v=` |
| `docs/reference/` | How each component works (storage, i18n, shared blocks, Font Maker, dashboard, generator, Torah/trope, ops) — indexed from `CLAUDE.md` |
| `docs/backend-architecture.md` | The plain-language map of the account layer — what talks to what, the keys, where the data lives, what runs on a schedule, where to look when something fails |
| `db/migrations/`, `db/functions/`, `db/README.md` | The database side of accounts: one SQL file per change (applied once), the delete-account Edge Function, and how to apply and check them |
| `docs/IMPROVEMENT_LOG.md`, `docs/IMPROVEMENT_ARCHIVE.md`, `docs/reference/loop-findings.md` | The improvement loop's ledger (current state), its history, and its measurements; guarded by `scripts/check-ledger.mjs`, compacted by `scripts/compact-ledger.mjs`, limits in `scripts/ledger-rules.mjs` |
| `splash/` | iOS launch/splash screens + `gen_splash.py` generator (and its bundled Libre Baskerville fonts) |
| `starting-fonts/` + `scripts/add_os_font.py`, `scripts/audit-os-fonts.mjs`, `scripts/stage_os_fonts.py` | Partner "starting fonts" behind `Hebrew_Font_Maker.html?start=<id>` (manifest + each font's upstream license). Staged either by hand through the `/addOSFont` skill or by the weekly workflow, which audits the partner's published list and runs the same license gate on whatever is new |
| `partners/` | Partner marks shown inside a tool — currently the Open Siddur Project's logo beside the Font Maker's starting-font picker, vendored unmodified with its provenance and license terms in `NOTICE.md` (not precached) |
| `icons/`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-card.png`, `og-fontmaker.png` | PWA / home-screen icons and the social cards (the suite's, and the Font Maker's own) |
| `zelle-qr.jpg` | Donation QR code shown on the contact page |
| `fonts/` | Bundled Hebrew fonts + their license files: the display faces (Frank Ruhl Libre, Lakhish Bold, Reuben, TzviScript, TzviScript Stroke Guide) and `NotoSerifHebrew-Taamim.ttf`, the Hebrew-block subset of Noto Serif Hebrew declared as `'IvritSuite Taamim'` — the te'amim fallback every Hebrew font stack ends with, because Frank Ruhl Libre has no cantillation glyphs |
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
- `themes` — optional; thematic tags (`animals`, `food`, `body`, `colors`, …) on about 1,400 nouns, used by the dictionary's theme filter (see `docs/theme_tagging_report.md`)

---

## Attribution

### Word data
The word data in `data/hebrew_words.json` and `source-data/hebrew_dictionary_4_19_2026.csv` is derived from **[Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html)**, a freely available structured dictionary extracted from Wiktionary.

**If you adapt or redistribute this project**, please credit Kaikki.org alongside the project author:

> Word data sourced from [Kaikki.org](https://kaikki.org/dictionary/Hebrew/index.html), derived from Wiktionary contributors under [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

Kaikki's underlying data is Wiktionary content, which is licensed CC BY-SA 3.0. The curation, filtering, transliteration fields, era classification, and JSON structure in this project are original work licensed under CC BY-NC-SA 4.0 (see below).

### Torah audio & timings
The Torah Trainer's chanted-audio karaoke and the Trope Tutor's example clips use **[PocketTorah](https://pockettorah.com)** by Russel Neiss & Rabbi Charlie Schwartz — word-level timing files (mirrored into `data/pockettorah/`) and cantillation audio (streamed on demand) — licensed **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Sefaria translations are shown under their individual licenses, and only openly-licensed versions are offered. See [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) for the full terms.

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

1. Edit `source-data/hebrew_dictionary_4_19_2026.csv` (or replace with a new export)
2. Run whatever processing script converts the CSV to `data/hebrew_words.json`
3. Bump the cache-busting version in **all three** files that fetch the JSON — `hebrew_blend_generator.html`, `hebrew_dictionary.html`, and `flash_cards.html`:
   ```js
   fetch('data/hebrew_words.json?v=6')   // increment v= each time the JSON changes
   ```
4. Commit both the new JSON and the HTML version bumps together. (If you edited any precached file, also bump `VERSION` in `sw.js` — see `CLAUDE.md`.)

---

## Author

Created by **[Harrison Bleiberg](https://harrisonbleiberg.wpcomstaging.com/)**

Feedback and contributions welcome — open an issue or pull request.
