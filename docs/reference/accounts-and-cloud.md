# Accounts & cloud saves (Supabase) — reference

> Binding rules live in `CLAUDE.md`; this file is how the account layer works. Keep it free of session ids, dates and digests.

## What exists

Accounts are **optional and additive**. Anonymous use, localStorage, `.ivrit` files and JSON import are
untouched; the cloud is a third place to keep copies. Four shared files own every line that talks to
Supabase — no tool page ever calls the SDK directly:

| File | Role |
|---|---|
| `js/supabase-config.js` | Public project values: `url`, publishable `anonKey`, the pinned SDK URL + its Subresource Integrity hash, and the `enabled` kill switch. The only file that changes when the project changes. |
| `js/ivrit-account.js` | `window.IvritAccount` — session state, sign-in/out, lazy SDK loading, the header chip. |
| `js/ivrit-saves.js` | `window.IvritSaves` — the saves adapter: `IVRIT_SYNC_REGISTRY`, the local and cloud backends, the per-item state table, the cloud-saves panel, the account screen. |
| `js/ivrit-projects.js` | `window.IvritProjects` — Font Maker cloud projects: the `font_projects` rows and the three Storage buckets (project file, photos, latest export). Loaded by `Hebrew_Font_Maker.html` and by `account.html` (the download-everything zip). |
| `account-test.html` | Throwaway harness (own CSP, `noindex`, not in the sitemap/`llms.txt`/`sw.js`, skipped by `check-i18n`). Mounts the real chip, mirrors state, runs the URL self-checks and the Phase 2 table/bucket checks. |
| `saves-test.html` | Same rules. Mounts the real panel with four page-only registry entries, runs the local round trip, the pure self-checks and the scripted cloud checks. |
| `account.html` | The account page (in the sitemap, precached, own CSP): who the account is and its display name, what it holds tool by tool, **Download everything** (one zip) and **Delete my account**. Only the shared modules talk to Supabase; see "The account page and data rights" below. |
| `db/functions/delete-account/` | The one Edge Function: removes the caller's Storage files, then the auth user (rows cascade). Deployed through the connector with the platform's JWT check on; `db/README.md` says how, and why it is not under `supabase/`. |
| `scripts/smoke-account.mjs`, `scripts/smoke-saves.mjs` | Headless Playwright smokes: anonymous with the CDN blocked, remembered session offline, SDK served locally, URL contracts, Hebrew + dark at 800 px. |
| `scripts/smoke-sync.mjs` | Headless end-to-end sync test against a fake cloud (`--sdk` required, port 8081): Playwright answers the project's `/rest/v1/saves` from an in-memory table and replays the second-device flow — settings changed in both places, Sync everything, the account screen's settings choice, the dashboard opening with Schedule Sync live, the picker switching to the first class from the account when this device's own is the untouched default, and the resume-time re-read of another tab's write; then the Phase 9 scenarios — a page re-apply pushed up as one PATCH, skipped rows named and a run that reaches the dashboard past a bad row, deletions that read *Deleted on this device* / *Removed from your account* and never propagate by themselves, a preset naming its class, a same-named class folding into the account's, a weekly grid removed elsewhere removed here, the suite-wide preferences applying live (Hebrew and dark without a reload; a field this build cannot apply held), and the hub's account screen — the signpost to the owning tool, the split counts, a run that outlives the screen, the seed that is never uploaded; and a teacher's own font travelling, with the eleventh refused by name on a device whose My Fonts is already full rather than one of theirs being evicted. |
| `scripts/smoke-fontmaker.mjs` | Headless end-to-end test of Font Maker cloud projects (`--sdk` required, port 8082): the fake cloud also answers the Storage endpoints; anonymous control, save, autosave, open in a fresh browser, conflict (Overwrite / Keep both), delete, export keep, a refused upload, the `?start=` contract, Hebrew + dark. |
| `scripts/smoke-account-page.mjs` | Headless end-to-end test of the account page (`--sdk` required, port 8083): anonymous control, the listing, the display name, the download-everything zip parsed and checked in Node, delete (accepted and refused), Hebrew + dark. |
| `scripts/smoke-migration.mjs` | The golden migration replay (`--sdk` required, port 8084): the six pages' real default blobs are captured, device A is built from them with every boolean flipped, enums moved, folders nested two deep, students, word lists, classes, a weekly grid and the suite-wide preferences; A opens every tool once and uploads everything; a fresh device B syncs, takes the account's settings where the screen asks, opens every tool and syncs until quiet; then every localStorage difference between A and B is classified — EXPECTED-OMIT, EXPECTED-NEVER-SYNC, EXPECTED-ENVELOPE, EXPECTED-SEED, LOADER-NORMALIZED (an allowlist, each line justified) — and anything UNEXPECTED fails the run (the table is printed either way). Then: a round trip B → A, a folder move, a student and a class deleted on B (never propagating by themselves), the account backup on a third device, and the second-device story (every tool opened anonymously before signing in) through the same classifier. |

Load order on a page (all deferred, so `window.I18n` and `window.IVRIT_SUPABASE` exist when the module runs):
```html
<script src="/js/i18n.js" defer></script>
<script src="/js/supabase-config.js" defer></script>
<script src="/js/ivrit-account.js" defer></script>
<script src="/js/ivrit-saves.js" defer></script>
<script src="/js/ivrit-projects.js" defer></script>   <!-- Font Maker and the account page only -->
```
All four of those `js/` files — config, account, saves **and projects** — are in `sw.js` `CORE_ASSETS`
(network-first like every same-origin script), so editing **any** of them bumps `VERSION`, `ivrit-projects.js`
included. Two pages depart from the block: `account-test.html` stops at the third line (it offers sign-in
only, no panel), and only `Hebrew_Font_Maker.html` and `account.html` add the fifth. Loading the saves
module is not the same as attaching to it — those same two pages never call `attach()`; they rely on the
module's own boot listener and use `inventory` / `bundleAll` / `forgetUser` / `errorText` directly.

## `IvritAccount` API

| Member | Meaning |
|---|---|
| `ready` | Promise → `user|null` once the initial state is known (immediately `null` for an anonymous visitor with no stored session) |
| `status()` | `'disabled' \| 'anonymous' \| 'loading' \| 'signed-in' \| 'offline' \| 'unavailable'` |
| `user()` | `{ id, email, name, provider }` or `null` in every non-signed-in state |
| `onChange(fn)` | `fn(user|null, status)` — once when known, then on every change, including sign-outs in other tabs |
| `signIn('google')` | Full-page OAuth redirect and back to the same page |
| `signIn('email', {email})` | Sends the email (a sign-in link **and** a 6-digit code) |
| `verifyCode(email, code)` | Signs in with the emailed code — works in any browser or device |
| `signOut()` | This device only (`scope: 'local'`) |
| `client()` | Promise → the Supabase client, loading the SDK on demand; rejects with `err.code` `'disabled' \| 'offline' \| 'blocked'` |
| `mountChip(target)` | element, selector, or `'auto'` (a `[data-ivacct-slot]` if the page has one, else right after the first `[data-i18n-switcher]`) |
| `init({ mount })` | Optional; `mount: false` suppresses the auto-mount. Auto-mount runs at `DOMContentLoaded` |
| `t(key, fallback)` | The `pwa.js`-style translator (I18n when loaded, else English) — reused by the saves module |
| `onOpenSaves(fn)` | A tool registers how to open its cloud panel; "Cloud saves…" appears in the menu only then |
| `onOpenAccount(fn)` | The saves module registers its account screen; "Account…" appears in the menu only then |
| `sessionSource()` | `'new'` when this page load established the session (a sign-in here, or an auth callback), `'restored'` when it came from storage, `null` when signed out — what decides the sign-in splash |
| `openMenu()` | Opens the chip's menu (`false` when no chip is mounted) — what the saves panel's own Sign in button calls |
| `profile()` | Promise → `{ displayName, createdAt }` from the account's `profiles` row |
| `setDisplayName(name)` | 1–80 characters: writes the user's metadata (`full_name`, what the chip reads everywhere) and mirrors it into `profiles.display_name`; the chip re-renders on the SDK's `USER_UPDATED` |
| `deleteAccount()` | Calls the `delete-account` Edge Function with the session's token, then signs this device out; resolves with the function's `{ ok, deleted: {saves, projects, files} }`. Nothing on the device is touched |
| `errorText(err)` | One localized sentence for a failure of any call above (the account page's status lines) |
| `_test` | Pure URL helpers for the smoke test |

## How the SDK is loaded (and why anonymous pages pay nothing)

```
read IVRIT_SUPABASE
  ├─ missing or enabled:false                 → 'disabled': no chip, no network
  ├─ auth callback in the URL, or a stored session → load the SDK now ('loading')
  └─ otherwise                                → 'anonymous': chip says "Sign in"; SDK loads on first click
```
- The session key is `sb-<project ref>-auth-token`; the module derives it from the config URL and hands
  the same string to `createClient` as `auth.storageKey`, so the two can never drift.
- The SDK `<script>` carries `crossorigin="anonymous"` + `integrity` (the pinned file's SHA-384) and a
  12 s timeout. Failure → `'offline'` when `navigator.onLine` is false, else `'unavailable'`; the chip
  says so, `ready` resolves `null`, an `online` event re-arms a retry. Nothing throws into the page.
- `ivritSuite_accountCache` (`{email, name}`) lets the chip show a name/initials while loading and an
  "Offline" label when a session is remembered but the SDK cannot load; `user()` is `null` there.

## Auth flow decisions

- **PKCE, never implicit.** Implicit flow puts the access *and refresh* token in the URL fragment,
  and every page's synchronous analytics snippet sends `page_view` with the full URL before any
  deferred script could clean it. PKCE leaves only a one-time `?code=`, useless without the verifier
  stored in the browser that started the flow.
  **The one-time `?code=` is still kept out of Analytics.** `stripAuthParams` cleans the address bar,
  but it lives in a deferred module and the inline `gtag('config', …)` runs during parse, so GA4's
  default `page_location` (= `document.location.href`) carried the code and any `?error_description=`.
  Every carrier's `config` call therefore passes an **explicit `page_location`** with the four
  `AUTH_QUERY_KEYS` removed. `location.href` itself must stay intact — the SDK reads `?code=` from it
  to complete the exchange — so never "simplify" this by cleaning the URL before the SDK runs, and
  keep the key list in step with `AUTH_QUERY_KEYS` (an inline tag cannot read a deferred module).
- **`account.html` refuses to render in a frame**; the tool pages stay embeddable on purpose, so a
  teacher can put one in an LMS. `frame-ancestors` is not an option: it is **ignored in a `<meta>` tag**
  (measured — the same directive works as an HTTP header) and GitHub Pages serves no custom headers.
  So an inline script sets `.ivframed` on `<html>` when `window.top !== window.self` and CSS hides
  everything but a `target="_top"` link out. Deleting an account was never clickjackable anyway: it
  needs the account's own email typed into a field.
- **Email sends a 6-digit code.** `signInWithOtp` (`shouldCreateUser: true`) sends it; `verifyOtp`
  (type `email`) signs in anywhere — another device, a mail app's in-app browser, the installed PWA.
  The dashboard templates (*Confirm signup* for a person's first email, *Magic Link* after that) are
  **code-only, with no `{{ .ConfirmationURL }}`**: school mail filters open every link in an incoming
  email to scan it, which spends a one-time link seconds after it is sent (two scanners hit the first
  real sign-in link before the teacher could). The link-handling code stays — `?code=` callbacks and the
  expired / other-browser notes — because Google OAuth returns through the same path and a template
  could re-add the link. Inside an installed app the email option is listed first.
- **Redirects return to the same page with its own params intact.** `redirectTarget()` = the current
  URL minus `code`, `error`, `error_code`, `error_description` and minus the hash. After the round
  trip the SDK removes `code`; the module removes any remaining auth keys (`stripAuthParams`) and
  nothing else — `?s=`, `?ak=`, `?wl=`, `?parsha=&v=`, `?lang=`, `?view=`, `?submit&name=` survive.
  The Font Maker's `?start=` is consumed by its own `init()` before anyone can click the chip.
- **Auth errors in the URL are read and stripped before the SDK loads.** Otherwise the SDK treats an
  expired link as a failed callback and drops the stored session. The error is shown once in the
  chip's note, and the menu opens itself that one time (the person just clicked a link).
- **A `?code=` with no verifier in this browser** means the link was opened elsewhere: it is stripped
  and the note steers to the emailed code. A stored session survives it.

## The chip

Mounted by `createElement`/`textContent` only; email and name never touch `innerHTML`. Button
(`.ivacct-btn`, `aria-haspopup="dialog"`, `aria-expanded`) + popover (`.ivacct-menu`, `role="dialog"`,
`aria-modal="false"`, `aria-label` from `shared.account.menu_aria`). Signed out: Google button, email
field, "Email me a sign-in link and code", then the code field + Verify; an `aria-live="polite"` note
carries progress and errors. While a sign-in or sign-out is in flight every menu button is locked by a
module flag the handlers check (`aria-disabled` alone is only a look, and a mid-send rebuild drops it),
re-applied by each rebuild and cleared when the action settles, so a double-click sends one code. The Google row (`.ivacct-gbtn`, a flex row) leads with Google's four-colour
"G", built as an inline `<svg>` by `googleMark()` from the official path data — inline so no carrier
page's CSP grows and an offline visitor still sees it, unmodified because Google's branding terms allow
the mark on a sign-in button only as-is, and `aria-hidden` because the button's own label already says
Google. It sits on the inline-start edge, so it mirrors to the right under the Hebrew UI. Signed in: "Signed in as {email}", "Cloud saves…" (when registered), "Sign
out (this device)". Keyboard: Enter/Space/click toggle, ↓ opens, focus lands on the first control,
Tab/Shift+Tab wrap inside, ↓/↑ move between controls (not inside text fields), Escape closes and returns
focus to the button, an outside click closes without moving focus. One injected `<style id="ivacct-style">`,
classes `ivacct-*`, logical properties, palette vars with fallbacks, `body.dark` / `html.dark-early`
aware, transitions neutralized under `prefers-reduced-motion`. Sized to match the language switcher
(30 px min-height, `align-self: stretch`). The email and code fields take the label's compact size on a
desktop and 16 px under `(pointer:coarse)`: iOS Safari zooms the page into a focused text field under
16 px and leaves it zoomed. Labels are `shared.account.*` keys and re-render on
`I18n.ready` / `I18n.onChange`.

## Storage keys the account layer touches (all exempt from AllTools export/import)

| Key | Written by | Notes |
|---|---|---|
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token` | the SDK | the session; erase-only (Erase All = signed out on this device) |
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token-code-verifier` | the SDK | transient, only during a PKCE round trip |
| `ivritSuite_accountCache` | the module | `{email, name}` for the loading/offline chip; erase-only |
| `ivritSuite_syncMeta` | `js/ivrit-saves.js` | what this device last synced, per account: `{v:1, users:{[uid]:…}}` keyed `[tool][kind][name]` → `{h, id, u, at}`, **plus four more fields at the same top level**: `held` (the `SUITE_PREFS` fields this build could not apply), `welcomed`, `lastWrite` and `written`. Two tabs read-modify-write this key, so `metaSave()` re-reads the stored copy first and keeps the newer write stamp per tool and kind. Erase-only, never exported |

The hub's `eraseAllSettings` removes every `sb-` key plus the two `ivritSuite_*` keys (Erase All = signed
out on this device) and reloads the page when a session was there, so the chip, the panels and the SDK's
in-memory session all start from the emptied storage.

## CSP origins a page needs to offer accounts

`script-src` += `https://cdn.jsdelivr.net` (the SDK), `connect-src` += `https://hhkmqwpjsyxdeuhvcyis.supabase.co`
(Auth, PostgREST, Storage all live on that host). Nothing else: no `img-src` (avatars are initials),
no `frame-src`, no `wss:` (Realtime is not used). The test harness carries exactly these.

## Database, buckets and policies (Phase 2)

The SQL lives in `db/migrations/` (one file per change, applied in order; `db/README.md` explains how to
apply one and why the folder is not `supabase/`). Everything a browser can reach is guarded by Row Level
Security, and the publishable key is stopped by a second mechanism people routinely confuse with it.
Every policy is `to authenticated` and compares `(select auth.uid())` with the row's owner, so no account
can see another account's rows or files. What stops the **anonymous key** is the explicit
`revoke all on table … from anon` in migration 0001: an anonymous request is refused by Postgres with
`42501` before any policy is consulted. RLS on its own would hand back an **empty result set, not an
error**. The distinction is load-bearing — the keep-alive workflow asserts the literal `42501` in the
response body, so what it re-proves every morning is the revoke, not the policy (a gateway-level 401
would not satisfy it).

| Table | One row per | Caps | Notes |
|---|---|---|---|
| `profiles` | account | — | `display_name` (≤ 80) filled by the `handle_new_user` trigger from Google's name or the email's local part; the client may read and update its own row only; rows are created by the trigger and removed by the cascade from `auth.users` |
| `saves` | saved item | `data` ≤ 2 MB (a real CHECK); 2000 rows per account (**trigger-raised on `INSERT` only** — an `UPDATE` never re-checks it) | `(user_id, tool, kind, name)` is unique, so the client upserts on it; `user_id` defaults to `auth.uid()` and is never sent; `bytes` and `updated_at` are set by a trigger (`updated_at` is the only ordering signal, `client_updated_at` is display-only); `tool` is a **hard CHECK constraint** listing Suite / Worksheet / FlashCards / Dictionary / TorahTrainer / TropeTutor / Dashboard, mirroring `var TOOLS` in the module — **an eighth tool needs a migration widening it**, or every upload from that tool returns an opaque `23514`; `data_hash` is capped at 64 chars by its own CHECK; `kind` matches `^[A-Za-z]{1,32}$`; `name` 1–120 chars |
| `font_projects` | cloud Font Maker project | 25 per account | catalogue row for a project whose gzipped JSON, downscaled images and exports live in Storage; `project_path` / `export_path` must start with the owner's id |

**The 2 MB server cap is not the one a teacher meets.** The module guards at `MAX_BYTES = 1887436`
(1.8 MB of canonical JSON) before uploading, because the server's 2 MB is measured over its own slightly
wider text — so an oversize row is always refused client-side and the `23514` size path is unreachable from
a browser. 1.8 MB is the number to quote when a deck will not upload. Listing and loading are paged at
`PAGE_SIZE = 1000` (PostgREST's maximum), looping until a short page, so a full 2000-row account is exactly
two round trips per tool.

Limits come back as Postgres `check_violation` (`23514`) with a readable message; a duplicate name is
`23505`; anything RLS refuses is `42501`. The saves adapter maps these to the panel's strings (`errorText`).

**Buckets** (all private): `font-projects` (20 MB, gzip), `font-exports` (5 MB; `font/ttf`, `font/woff2`, `application/zip` **and `application/octet-stream`** — the fourth is not optional, it is what a browser often types a `.ttf` `Blob` as),
`font-sources` (15 MB, jpeg / png / webp — raised from 2 MB by migration 0002 so photos keep their
original size). Every object path is `<user id>/<project id>/<file>`, and the four
`storage.objects` policies allow a signed-in user to read, upload (`upsert` needs update + select),
replace and delete only inside the folder named after their own id.

**Account deletion**: deleting an auth user cascades the rows but not the files; the self-service path
that removes both is the Phase 6 Edge Function. The migration file carries the manual cleanup note.

**Checking it from the browser**: `account-test.html` § 4 saves, lists and deletes a `Suite/test/phase2`
row and runs cloud self-checks (other users' rows invisible, the anon key reads nothing, inserting as
someone else is refused, a PNG uploads into the caller's folder while a text file and a foreign folder
are refused, the probe is removed).

## The saves adapter (`js/ivrit-saves.js`)

A **local-first mirror**. The localStorage keys a tool already renders from stay the source of truth;
the `saves` table holds one row per saved item, which the person uploads and downloads from a panel.
Anonymous use never writes anything (no key, no request). Nothing on the device is ever deleted by the
module, and nothing newer is overwritten by something older unless the person chooses that on a
"changed in both places" row. Every entry point resolves or rejects; the DOM is `createElement`/`textContent`.

### The registry

`IVRIT_SYNC_REGISTRY` (an array inside the module) is the only place that names synced keys — one entry
per localStorage key: `{ tool, kind, lsKey, shape, path?, nameField?, envelope?, merge, omit?, follows?, ivritKey?, label? }`
(or `virtual` in place of `lsKey`, see below).

| Field | Meaning |
|---|---|
| `shape` | `map` (`{name: value}` → one row per name), `mapIn` (`{…, [path]: {key: value}}` → one row per key; label from `value[nameField]`; `envelope` = the other top-level fields, e.g. `{v:1}`), `single` (one settings object → one row named `default`), `tree` (`{v:1, root:[…]}` → `default`, synced after `follows`), `scalar` (a plain string → `default`, travelling as `{value}`) |
| `merge` | how a downloaded copy lands on a differing local one: `item` (replace that item), `assign` (cloud fields over a copy of local — the `.ivrit` Merge teachers know; also the "Use cloud copy" button), `deepMax` (lossless: numbers max, booleans or, objects recurse, arrays keep local), `max` (scalar), `page` (the page's pure `merges[kind](local, cloud) → merged`) |
| `omit` | field names (a trailing/leading `*` glob allowed) that never travel: stripped before hashing and upload, this device's values put back after a download, cloud values of them dropped |
| `follows` | trees only: the kind whose items the tree names |
| `ivritKey` | the AllTools bundle key, so *Download file* writes an `.ivrit` the hub imports (else `tool` + `data:{[kind]: …}`) |
| `label` | an i18n key for the kind (falls back to the raw kind) |
| `virtual` | in place of `lsKey`: a store assembled from several keys (`{ read, write, remove, applied }`); the suite-wide preferences row is the one such store |
| `skipUpload` | `(name, value) → true` for a local item that is only a seed — the roster entry's says so for an untouched empty class named "My class" (the literal or the localized default): the row reads *Empty default — not uploaded*, has no button and is never sent by itself (a device that adds a name to it stops it being a seed); an already-uploaded copy stays a normal row |

**The suite-wide preferences row** (`Suite` / `prefs`, `virtual: SUITE_PREFS` beside the registry, single/assign,
`ivritKey: suitePrefs`): one row assembled from the small site-wide keys every page reads — `hebrewBlender_lang`,
`_darkMode`, `_kbdLayout`, `_inputMode`, `_hebFont`, `_hebFontSize`, `_livePreview`, `hebrewFontMaker_lastAuthor`,
`hebrewDictionary_translitStyle`, `_ttsRate`, `_emojiSettings`, `_nikudColors`; the three `*_panels` maps, the Dictionary's audio
switch and its last search stay per device. Every page syncs it (`Suite` is first in `TOOLS`, so a language change
lands before the tools' own rows); only the hub shows its panel. `write` sets each field it can validate (the
language against `I18n.supported`, the two-value switches, the slider ranges, the six romanization styles, a plain
object for the emoji settings) and never removes a key. A field this build cannot apply — an unknown language, a
value out of range, a field a newer build added — is **held** in the sync memory (`held: { field: { v, was } }`) and
reported as the row's value while that key still holds `was`, so the tail sees both sides equal instead of pushing a
degraded copy down; a change to the key here drops the hold and the row reads *Newer on this device*. Once the tail
settled the row the module applies the language itself (`I18n.setLang`, live on every converted page) and fires
`ivritsuite:prefs` on `window`; each page's `initCloudSaves` follows the theme from that event (its own `toggleDark()`
when the stored value and `body.dark` disagree — the dashboard's re-renders the nikkud colors as its rule requires);
the other fields show at the next load and the done line says so (`shared.cloud.suite_reload_hint`). The account
screen, built in the language of the moment, is rebuilt in the new one between runs and listings, keeping its last
final line. In the account backup the row is `suitePrefs`, which the hub's two import paths unfold into the flat
AllTools keys (`uiLang`, `darkMode`, …) their validated branches already apply.

**A teacher's own fonts** (`Suite` / `font`, `virtual: USER_FONTS`, map/item, `ivritKey: userFonts`): one row
per font, the TTF base64 inside it, in exactly the `{name, b64, family}` shape the AllTools export has always
used — so the account file and the device file carry a font the same way, and the hub's import takes either an
array or one entry per name. The per-device `created` stamp is deliberately left out of the row, or the same
font would hash differently on every device. The bytes live where they always did, the origin-wide
`ivritsuite-fonts` IndexedDB; the module carries its own small reader and writer for it, because a virtual
store backed by something asynchronous must be read before the plan is built — `planTool` calls `prime()` on
every virtual entry first, and only when signed in, so an anonymous visit still opens nothing it would not
have opened. **A download never evicts.** The shared `saveUserFont` drops the oldest font past
`IV_FONTS_CAP` (the page-side shared-block name; the module keeps its own deliberately separate copy of the
IndexedDB constants as `FONTS_DB` / `FONTS_STORE` / `FONTS_CAP`), which is right for an upload the teacher chose and wrong for a sync: at the cap the row is
refused with `cap` and the run names it ("this device already holds ten fonts"), so the account keeps the font
and the device keeps all of its own. A teacher with ten different fonts on two devices therefore has twenty in
the account and ten on each, which is the honest reading of a per-device limit. After a write the module fires
`ivritsuite:fonts` on `window`; each picker page listens and re-runs `refreshMyFonts()`, which also re-applies
a face the page had chosen by name but could not show until then.

`attach({ tool, panel, title?, entries?, merges?, flush?, onLocalChanged?, open?, deviceBackup? })` is the whole per-page
surface: `entries` is for harnesses (real tools list theirs in the registry), `merges` supplies the
`page` helpers, `flush()` must cancel any debounced writer and write now, `onLocalChanged(kind, name)`
must re-read that key into memory and re-render, `open` is registered with `IvritAccount.onOpenSaves`,
`title: false` drops the panel's own title (the page's panel heading is the heading) and an i18n key
replaces it (the hub names each panel after its tool), `deviceBackup` is how the page saves everything
on the device to an `.ivrit` file (only the hub passes one).
A `single` / `scalar` / `tree` / `mapIn` entry is **downloadable only when the page gave `onLocalChanged`**
(otherwise upload-only, with a console warning): those tools keep their settings in memory and rewrite
the whole blob on the next change, which would undo a download and then push the stale blob back up
as "newer on this device".

### Hashes and the state table

Postgres `jsonb` rewrites JSON (key order, spacing), so every hash is SHA-256 (`crypto.subtle`, prefix
`1.`, base64url) over the **canonical** form of the value — keys sorted at every depth — after `omit`;
the row's `data_hash` is only a listing shortcut, a row with a null or foreign hash is fetched and hashed
here. Object key order therefore does not survive the cloud (tools read by key; list order comes from
the local store and the folder tree). `ivritSuite_syncMeta` remembers, per account, the hash both sides
had after the last successful upload/download plus the row id and its `updated_at`.

| Situation (L = local hash, C = cloud hash, M = memory) | State | Safe action |
|---|---|---|
| local only | Only on this device | Upload |
| cloud only | Only in the cloud | Download |
| L = C, or neither side moved since M | Same | — |
| L = M.h, cloud moved (`updated_at` ≠ M.u and C ≠ M.h) | Newer in the cloud | Download |
| cloud unchanged (`updated_at` = M.u or C = M.h), L ≠ M.h | Newer on this device | Upload |
| both moved, or no memory yet and L ≠ C | Changed in both places | none for `item`/`assign`; Merge for `deepMax`/`max`/`page` |
| cloud only, and M knows that very row (M.id = the row, M.u = its `updated_at` or M.h = C) — it was synced here once and is gone here | Deleted on this device | none: **Delete from your account too** / **Bring it back** |
| local only, and M carries the tombstone *Delete from cloud* left with M.h = L | Removed from your account | none: **Upload again** (a local change makes it a normal local-only row) |
| local only, and the entry's `skipUpload(name, value)` says it is a seed (an untouched empty default class) | Empty default — not uploaded | none, no button; not counted among the safe actions |

Conflict buttons: `item` → **Keep both** (the cloud version is inserted in the account as `name (cloud
copy)` first, then the local `name` goes over the cloud row with the conditional update — a refusal there
removes the copy just made — then the copy is written here and read back: one click, nothing lost,
converges), *Use cloud copy*, *Keep mine*; `assign` → *Use cloud copy*, *Keep mine* (this device's fields
win, a field only the account had survives); the rest → *Merge*. A deletion is never automatic: *Delete
from cloud* leaves a tombstone in the memory so the untouched local copy is not uploaded again by itself,
and a row this device synced once and then deleted or renamed reads *Deleted on this device* until the
person chooses (Erase All Settings removes the memory, so an erased device downloads everything afresh).
A `page` merge whose helper the current page did not supply (the hub) shows no button at all: the row
stays listed as *Changed in both places* and the tool that owns the merge resolves it.
Cloud writes to an existing row are **conditional** (`update … eq('updated_at', listed)`): zero rows back
means another device wrote first, the list is refreshed and the person chooses again. New rows are
`insert`s (`23505` = created meanwhile). **Sync now** runs every safe action in order and leaves conflicts
and deletions listed. A row's own trouble — too big, an impossible name, characters the cloud cannot
store, a malformed cloud copy, no merge helper on this page, moved between the listing and the action,
a page hook that failed — skips that row, and the finishing line names each skipped row with its reason;
only an error every row would share (the connection, the session, the device's storage, the server) stops
the tool, and re-running resumes. In a bulk run on the account screen a stopped tool ends the run only
when its error was the connection or the session; the stop line names the tool, the counts so far and
the tools not reached, and each stopped tool's panel carries its own stop line. Nothing runs on a timer.
Every local write the module makes ends the same way (`settleLocalWrite`): the page's `onLocalChanged()`
(a hook that throws fails the action with `hook`, nothing remembered), then the page's `flush()`, then
the store is re-read and compared with the account — equal, the cloud row is remembered; different (the
page re-applied the value its own way), the store's projection is put in the account with the
conditional update and *that* row is remembered. Remembering the store's hash as the cloud's would hide a
lossy re-apply behind "Same"; pushing makes both sides hold the page's normalized form. A merge is checked
against the account's limits before anything is written on either side. Downloads add the "reload other
tabs" hint. Two more guards against a page's
in-memory copy: a listing calls `flush()` first when signed in (a pending debounced write would otherwise
land between the listing and the first action and fail it as "changed"), and every module write stamps
`lastWrite` and `written[tool][kind]` into `ivritSuite_syncMeta`: any *other* open tab of that tool
re-reads the key and lists again when the key's `storage` event arrives — and again, per tool and kind
against the stamps it last saw, whenever it becomes visible or returns from the back-forward cache
(`recheckWrites()`; a background tab on iOS may never get the event, and its next in-memory save would
otherwise revert the download unseen; a tab's own writes are already seen). `refresh()` coalesces:
callers that ask while a listing is queued share it, so sign-in lists each tool once.

**Trees follow their items**: the shared tree component prunes nodes whose names are not in the store,
so a tree is never a row. After actions and after Sync, each tree entry is reconciled once all `follows`
items exist on this device, by the classify rule read through the tree's own sync memory: neither side
moved → nothing; only the account moved → its tree lands here; only this device moved → its tree goes
up; both moved, or no memory yet → the page's pure `ftMergeTrees` (folders by name, an item once, filed
beats unfiled, this device's placement when both file it), and the merge goes up, so the other device
then reads "cloud changed" and takes it — one round, both hold the same tree. A flat local tree takes
the account's folders wholesale. The tail applies here too: what the store holds after the page's own
re-render is what is hashed and sent, never the merge itself. A layout that differs counts as a safe
action (`plan.treesDiffer`, the panel's "Folder layout: different here and in your account" note under
the group it follows, the account line's "the folder layout differs"), so the Sync buttons enable for a
folder move alone, and the finishing line counts a tree that changed as merged. A preset downloaded on
its own may land at the root of the folder list; *Sync now* keeps the folders.

### The account screen

`IvritSaves.openAccount()` — an overlay (`.ivsav-overlay` / `.ivsav-card`, `role="dialog"`, Escape and
an outside click close it, focus returns to the opener) reached from the chip's **Account…** item. Under
the title it says when the account was last saved (the newest `updated_at` across every tool's rows) or
that nothing is saved yet, then lists every tool that has anything, on either side, with plain counts
("3 not in your account yet", "2 only in your account", "1 changed in both places" — rows a button on this
page can resolve — "1 to merge inside Hebrew Word Lookup" — a page-merge row this page has no helper for,
counted apart so "still need a choice" never names something this page cannot do — "1 deleted on this
device", or "everything is in your account"), and offers one primary action for the state it found:

- **Sync everything** (the account holds items) — each tool's *Sync now* in turn: downloads, uploads and
  lossless merges, conflicts left listed; a tool this page does not render may take its settings blob
  too (nothing of it is in memory here; other tabs re-read through the write stamp), while its folder
  trees are merged only through the page's own helper, so a real tree on both sides is left as is. The
  screen's close controls stay live during a run, and closing it stops only the screen's updates, never
  the run: every tool is still checked, and the finishing line goes to the page's toast when it has one.
  The finishing line names the rows only a tool can merge ("1 to merge inside a tool's own Cloud saves
  panel"), the skipped rows, a folder pass that failed, and — after the suite-wide preferences changed —
  what shows after a reload.
- **Upload everything on this device** (the account is empty) — every upload the per-tool plans call
  safe, tool by tool, then the trees follow. It is a copy: nothing is removed from the device (the note
  says so). Rows the client-side guard refuses are skipped and counted; a network/server error stops
  the run and says so.
- **Download everything in your account (.ivrit)** — one AllTools-shaped file of every cloud row across
  tools (`bundleFromRows` folds each kind into the bundle key the hub imports: a map kind → `{name: value}`,
  a mapIn kind → its envelope + `{path: {id: value}}`, single/tree → the value, scalar → the plain value).
- **Back up everything on this device (.ivrit)** — the page's `deviceBackup` hook when one was passed to
  `attach()` (the hub opens its Import / Export modal); every other page opens `index.html?alltools=open`
  in a new tab (`noopener`; navigating away when the popup is blocked), so a Font Maker canvas or a running
  drill stays as it is.
- **Settings that differ** — shown only while some tool's settings blob (an `assign` row) is *Changed in
  both places* and this page may write it. That is the everyday case on a second device, not a rare
  clash: every tool writes its settings blob the first time it opens there, so with no sync memory yet
  the module cannot tell which side is newer and *Sync everything* leaves the row alone (the live report
  behind this block: a phone that took every dashboard preset and schedule but not Schedule Sync, which
  lives in the settings blob). The block names the tools and offers **Use my account's settings** (each
  such row's *Use cloud copy*: the account's fields land over a copy of this device's, per-device `omit`
  fields kept, then both sides hold the result — the button's title says the result goes back up too —
  and the memory remembers it) or **Keep this device's settings** (each row's *Keep mine*: this device's
  projection goes up). Items named the same on both sides (a preset, a deck) keep their per-row choices
  in the tool's panel; a hint says so while any remain. A row only its own tool can merge (a student
  profile, a word list or a class list on a page with no helper for it) is counted apart ("to merge
  inside {tool}") and its panel row carries a signpost — "Changed in both places — open {tool} to merge
  it" — with the tool's name a link to its page (`TOOL_PAGES`; the Dictionary's opens its Word Lists
  manager). While the account holds items this device does not, a hint points at *Sync everything*. The
  finishing line of every account-screen action stays on the status line through the re-listing that
  follows it.

It opens by itself in two cases. **After every fresh sign-in** — the page load that established the
session, as `IvritAccount.sessionSource()` reports (`'new'` for a sign-in during this load or an auth
callback, `'restored'` for a session read from storage) — it is titled *Sync settings from your last
login?* with the last-saved date under it, at most once per page load. Otherwise **once per account on
each device**: a device that already holds saved items gets the welcome at once; a device with nothing
saved gets *Sync settings from your last login?* once the first signed-in listing finds rows in the
account (`offerOnce`, after the attached tools' listings), so a teacher already signed in elsewhere is not
left without the way in. `ivritSuite_syncMeta.welcomed[uid]` is set only when such a screen was actually
shown (`openAccount` with `first` / `splash`). Both dismiss with *Not now*. A link under the backup
buttons leads to the account page (`account.html`): the download-everything zip and *Delete my account*.

### The panel

`mountPanel(target, tool)` or `attach({ panel })`: classes `ivsav-*`, one injected `<style id="ivsav-style">`,
palette vars with fallbacks, `body.dark` aware, logical properties, reduced-motion neutraliser. Signed out:
one line + a Sign in button (opens the chip's menu). Offline / unavailable: the matching line. Signed in:
title, *Refresh*, *Sync now (n)*, an `aria-live="polite"` status line, then one list — a row per kind + name
across both sides, grouped by kind — with the plain-words state, size, the cloud `updated_at`, and the
buttons the state allows; cloud rows also get *Download file* and *Delete from cloud* (`confirm()`; the
local copy stays). No Rename (a preset rename would orphan its folder-tree node; `mapIn` names are ids).
*Keep both* on an id-keyed row (a word list, a class list) mints a fresh id for the copy (`mintId`, the
tools' own base-36 shape) and suffixes the item's own name on both sides (`copyLabelFor`), so two lists never
share one label.
All cloud work runs through one per-tool promise queue; buttons are `aria-disabled` meanwhile;
`showAppToast` is used when the page has it. Strings `shared.cloud.*`, re-rendered on `I18n.ready` /
`I18n.onChange`. Public surface: `attach`, `mountPanel`, `refresh`, `plan`, `lastPlan`, `syncNow`, `act(tool, action, row)`,
`forgetRow`, `openAccount`, `closeAccount`, `registerSummary`, `inventory`, `bundleAll`, `forgetUser`,
`errorText`, `local`, `cloud`, `registry`, `t`, `_test`.

**`forgetRow(tool, kind)` is an obligation, not a convenience.** A page whose "Reset all settings" or
"Reset progress" button also syncs **must** call it from that handler (`torah_trainer.html` and
`trope_tutor.html` do; the pattern is `if (signedIn && window.IvritSaves && typeof IvritSaves.forgetRow
=== 'function')`). It forgets what this device last synced for that row, so the next listing **asks**
(a settings blob) or **merges** (progress) instead of reading the wiped local copy as "newer here" and
pushing the reset up. Without it a local reset silently becomes an account-wide reset — the one way this
layer can destroy a teacher's work rather than duplicate it. `lastPlan(tool)` returns the last plan
computed for a tool without recomputing it (the dashboard reads it to decide whether a sync landed).

**Checking it from the browser**: `saves-test.html` § 2 runs the local backend signed out (every other
key byte-identical, no sync memory), § 4 the pure checks (canonical hash vector, the state table, merges,
omit, `safeParse`, guards, error mapping), § 5 the scripted cloud run (upload, a change from "another
device" with no hash, download, keep-both, a settings and a score conflict, a stale conditional write
refused, a download refused when the device changed meanwhile, folders following, delete, cleanup).
`scripts/smoke-saves.mjs` runs § 2 and § 4 headless with the CDN blocked, a fake session with the API
unreachable, and Hebrew + dark at 800 px.

### Implemented on

| Page | Registry rows (`kind` · shape/merge · key) | Hooks passed to `attach()` | Panel |
|---|---|---|---|
| `trope_tutor.html` (`TropeTutor`) | `progress` single/deepMax `hebrewTropeTutor_progress` · `settings` single/assign (omit `panelsCollapsed`, a retired field older blobs still carry) `hebrewTropeTutor_settings` | `flush: saveSettingsFlush`; `onLocalChanged` resets `settings` / `progress` to their DEFAULTS clone, re-loads, re-applies the Hebrew size and font, re-syncs the Settings controls and the drill selects, re-renders Learn (under `_i18nRerender`; the staffs follow a downloaded `melody`) and the drill line — the `resetAllSettings()` / `resetProgress()` sequence | the Settings tab's *Cloud saves* group (`#setCloud`, heading `trope.settings.panel_cloud`) between *Progress* and *About*, `title: false` |
| `torah_trainer.html` (`TorahTrainer`) | `settings` single/assign (omit `*Collapsed`, `lastPos`, `loopVerse` — the reading position carries a timestamp on every scroll and would keep the row "newer" forever; a cross-device bookmark is a later row of its own) `hebrewTorahTrainer_settings` | `flush: saveSettingsFlush` (a no-op during a handout print, by design; during a practice link's view it stores the reader's own display values, through `storedSettings()`); `onLocalChanged` = the `resetAllSettings()` sequence on a fresh DEFAULTS clone plus `syncParshaSelect()` and `fetchAndRender()`, ending a practice link's view first | settings drawer, its own panel (`torah.settings.panel_cloud`) just above *Reset*; `open` = `openSettingsAtPanel('cloud')` |
| `flash_cards.html` (`FlashCards`) | `preset` map/item `hebrewFlashCards_presets` · `presetFolders` tree/page follows `preset` · `settings` single/assign `hebrewFlashCards_settings` omitting `audioEnabled`, `ttsRate`, `hideHomeBtn`, `sheetDuplex` (the four fields the machine decides, not the lesson: speakers, voice speed, a kiosk's hidden home button, a printer's two sides; `listening` still travels, since a browser without speech only gates the toggle, and the `.ivrit` backup still carries all four) · `pbStreak` scalar/max · `profile` mapIn (`path: profiles`, envelope `{activeProfile: null}`, one row per student) merge page · `profileFolders` tree/page follows `profile` | `flush: saveSettings`; `merges`: the two trees through the shared pure `ftMergeTrees`, `profile` through the pure `mergeProfileEntry` that `mergeProfilesBlob` (the `.ivrit` import) also calls — results unioned by `savedAt`, newest 50 kept, ladder best-of; `onLocalChanged`: presets/folders → `renderPresets()`, profiles/folders → `renderProfiles()`, streak → `loadPbStreak()` + `updateStatsBar()`, settings → `loadSettings()` then `saveSettings()` (the inner saves of `applySettings` write a partial blob; the whole one must be in the store before the module's tail compares), or — while a Learner Ladder level runs — the new blob replaces `_ladderActive.snapshot` so `_ladderExit()` restores it instead of the pre-ladder state, and while a `?s=` link's drill runs (`_sharedDrill`, which like the ladder makes `saveSettings` a no-op) nothing is applied until the setup screen loads the store again. The page round-trips what it cannot show: the listening preference stays stored on a browser without speech (only the toggle is gated), a font name this device lacks stays chosen (no face highlighted, `shared.fonts.missing_note` once My Fonts has answered), and word lists travel by id with their names kept verbatim while the selection is unchanged | Advanced Settings, a "Cloud saves" sub-section (`flashcards.advanced.cloud_head`) after Backup Presets, `title: false`; `open` un-collapses the panel and the sub-section through their own click handlers |
| `hebrew_blend_generator.html` (`Worksheet`) | `preset` map/item `hebrewBlender_presets` · `presetFolders` tree/page follows `preset` · `lastState` single/assign `hebrewBlender_lastState` (the remembered setup the page restores on load) | `flush: rememberSetup` (the setup is read off the live controls); `merges`: the tree through the shared pure `ftMergeTrees`; `onLocalChanged`: presets/folders → `renderPresets()`, last setup → `restoreLastSetup()` (re-applies the controls under `_lastSetupRestoring`; the next Generate uses them) | Advanced, a nested "Cloud saves" sub-panel (`worksheet.advanced.cloud_title`) right after Backup Presets, `title: false`; `open` un-collapses both through their own click handlers |
| `hebrew_dictionary.html` (`Dictionary`) | `wordList` mapIn (`path: lists`, `nameField: name`, envelope `{v: 1}`, one row per list) merge page `ivritSuite_wordLists` — the page's small display prefs stay per device | `merges.wordList` = the pure, **uncapped** `mergeWordList` (words unioned by their `word` string, mine first; a cap would silently drop the other side's words, so a merged list may exceed 200 until words are removed); `onLocalChanged` re-renders the manager when it is showing; no `flush` (lists are written synchronously). The generator's *⭑ Save as Word List* also writes one new list into this store, which the next listing here or on the hub shows as *Only on this device* (an upload the teacher chooses; nothing is removed or overwritten). The page's last-search replay (`hebrewDictionary_lastState`, per device) defers to the stored emoji settings for the emoji mode, gender and excluded categories (`_dictWithStoredEmoji`): a per-device snapshot must not put an older copy back over the synced preference — a `?s=` link keeps its own | inside the Word Lists manager (rebuilt on every refresh, so `wlRenderManagerInto` mounts the panel each render; the manager lists again each time it opens signed in); `open` = `wlOpenManager()` |
| `classroom_dashboard.html` (`Dashboard`) | `preset` map/item `hebrewDashboard_presets` · `presetFolders` tree/page follows `preset` · `schedule` map/item `hebrewDashboard_schedules` (a value is either a v2 weekly grid or a legacy day array; replaced whole) · `scheduleFolders` tree/page follows `schedule` · `settings` single/assign `hebrewDashboard_settings` omitting `rosters`, `activeRosterId`, `pickerSessions`, `_geoCoords`, `*Collapsed`, `panelLayout`, `videoLayout`, `zoomLevel`, `hideZoomBar`, `keepAwake`, `lockPanelWidths`, `showTextSizeOptions` · `roster` mapIn over the **same key** (`path: rosters`, `nameField: name`, one row per class) merge page — two entries on one key work because the settings row omits what the roster rows carry | `flush: saveSettingsToStorage` (synchronous; it also reads the board text off the editor); `merges`: the two trees through the shared pure `ftMergeTrees`, `roster` through the pure `mergeRoster` (names unioned, mine first, no cap; the name stays mine unless it is the default); `onLocalChanged`: presets → `loadPresets()` + `renderPresets()`, schedules → `loadSchedulesStorage()` + `renderSavedSchedules()`, settings → `loadSettingsFromStorage()` then the `IVRIT_CFG.apply` tail (`applySettings` on a clone, the three render caches nulled, week summary / schedule UI / editor re-rendered), roster → `loadSettingsFromStorage()` + `ensureActiveClass()` + `normalizePickerSession()` + the drawer form and the student picker re-rendered | settings drawer, a "Cloud saves" sub-section (`dashboard.settings.cloud_head`) at the end of the *Presets* panel under the `.ivrit` backup, `title: false`; `open` = `openSettings()` + un-collapse the panel through its own title |
| `index.html` (the hub; no rows of its own) | — | **one** `attach()` call, inside a `forEach` over the `.ie-cloud-host` elements — so adding a tool to the hub is a markup change (`<div class="ie-cloud-host" data-tool="…">`), never a new call. One host per tool above, plus one for the suite-wide preferences row (`<details data-tool="Suite">`, first in the block, titled `shared.cloud.kind_suite_prefs`) — each with `title: false` into its own `<details>` inside the AllTools modal's "Cloud saves" block; `merges` = the folder trees through the hub's own `ftMergeTrees` copy only (a profile or word list changed in both places shows no button here and is merged inside its tool); `onLocalChanged` = `renderIvritInventory()` (nothing is in memory on the hub, so every shape is downloadable — the place to bring a fresh browser up to date) | the AllTools modal, between *My Fonts* and *Erase*; `open` opens the modal and scrolls to the block |

**`Hebrew_Font_Maker.html`** has no registry rows: its projects are `font_projects` rows plus Storage objects,
through `js/ivrit-projects.js` — see *Font Maker projects* below. It loads the same three scripts plus
that module; the chip's *Account…* item and the sign-in splash work there because `IvritSaves` now starts
listening at boot, and the account screen shows "Hebrew Font Maker: n projects in your account (size)"
through `IvritSaves.registerSummary(fn)` (a line, never part of the sync counts).

`scripts/smoke-tools.mjs` loads every page in this table with the CDN blocked and proves: 0 `pageerror`,
the chip beside the language switcher, the panel's sign-in line, `plan()` returning exactly the seeded
items, and a localStorage dump byte-identical to a control run with the three account scripts blocked;
then a remembered session with the API unreachable, and Hebrew + dark at 800 px.

## Font Maker projects (`js/ivrit-projects.js`)

A project is one `font_projects` row (the catalogue entry: name, family, style, schema version, letters
done, sizes, the current `project_path`, the latest `export_path`, `client_saved_at`) plus objects under
`<user id>/<project id>/` in three buckets: `font-projects/…/project-<rev>.json.gz` (the packed project),
`font-sources/…/<sha256-16hex>.<jpg|png|webp>` (one object per distinct photo, original bytes and type —
the maintainer chose full size over shrinking; a photo-heavy project is 20–40 MB, so sizes are shown in
the Load menu and on the account screen, and the free plan's 1 GB / 5 GB egress a month is the budget),
`font-exports/…/<stem>.<ttf|woff2|zip>` (the latest export only). The page packs and unpacks the project
(`docs/reference/font-maker.md` → Cloud projects); the module moves bytes and rows:

| Call | What happens |
|---|---|
| `list({fresh})` | the account's rows, newest first; memoised 30 s per user, every write invalidates |
| `get(id)` | one row or null — never memoised (the conflict probe) |
| `save({id?, name, meta, projectGz, sources, expectedUpdatedAt, onProgress})` | size guards first (name 1–120, gz ≤ 20 MiB, every photo ≤ 15 MiB — refused by label before any request); a new project inserts its row FIRST so the 25-row cap and a taken name (`23505`) surface before a byte moves; the folder is listed once and only missing photos upload (3 at a time, `upsert`, a 409 counts as done); the project file goes up under a **versioned name** and the row is switched to it with a conditional update on `updated_at` — zero rows back means another device wrote first (`changed`), our file is removed and nothing of theirs was touched; then the previous file and unreferenced photos are removed (best effort); a fresh row whose uploads failed is deleted again |
| `open(id)` / `downloadSource(id, name)` / `listSources(id)` | the project file's bytes; one photo; the folder's photos |
| `remove(id)` | every object in the three buckets, then the row (an orphaned row is visible and retryable; orphaned objects would not be) |
| `saveExport(id, blob, name)` / `downloadExport(id)` | one export slot per project (older objects in the folder removed), `export_path` + `exported_at` on the row |
| `count()` / `onChange(fn)` | the account-screen line; a callback after every write |
| `refresh()` | drops the 30 s memo so the next `list()` re-fetches |
| `projectFile(id)` | the packed cloud copy for the account page's download-everything zip |
| `errorCode(err)` | the raw error → the code vocabulary below |
| `limits` | `{gz, source, export, projects}` — the same numbers the size guards use, so a page states them without hardcoding |

Errors reject with a code `IvritSaves.errorText` knows: Storage's shapes are normalised (`file_too_big`
413, `bad_type` 415, `not_found` 404) and the cap's `23514` becomes `project_limit`. Rule 2 names this
module as the fourth and last file that talks to Supabase.

## The account page and data rights (`account.html`)

The page an account-holder reaches from the account screen's link and from the privacy policy. It is a plain
root page (own CSP, in the sitemap, precached) whose script only renders, asks and packs; every cloud call goes
through the three modules. Four tiles, shown only while signed in (signed out: one line and a Sign in button
that opens the chip's menu; offline or with the SDK blocked: one line, nothing else):

- **Who** — the email, how the account signs in (Google or an emailed code), when it was created
  (`profiles.created_at`), and the display name. Saving a name calls `IvritAccount.setDisplayName()`: the
  user's metadata first (what the chip reads on every page — it re-renders on the SDK's `USER_UPDATED`), then
  `profiles.display_name`. An empty or over-long name is refused before any request.
- **What your account holds** — `IvritSaves.inventory()` (one listing per tool, no data): per kind a count and
  the bytes, with the names expandable where a row's name is the item's own (presets, decks, student profiles)
  and never where it is an id (word lists, class lists); then `IvritProjects.list()` for the Font Maker
  projects (letters done, size, last edit, whether an export is kept); then one total line. Folder trees count
  in the totals but are not listed.
- **Download everything** — one store-only zip built in the page (the writer `resources.html` uses for font
  bundles, with UTF-8 names; every entry stamped with the download's local time): `README.txt`;
  `IvritSuite-account-<date>.ivrit`, the AllTools-shaped bundle from `IvritSaves.bundleAll()` (the hub's
  Import / Export modal restores it), `<date>` being the teacher's local date as in the zip's own name; and per
  project `font-projects/<name>/<stem>.hebrewfont` from `IvritProjects.projectFile()` (the stem keeps the name's
  ASCII letters, digits, `.` and `-`, else `font`; the folder keeps the name, minus a trailing dot or space,
  with `_` before a Windows device name such as `CON` or `COM1`, and numbered `-2`, `-3`… when another folder
  already has it in any letter case, because Windows and macOS disks ignore case) — the cloud copy with its photos
  put back where the page took them out (a generic walk over the `cloud:` strings the packed manifest names,
  photos downloaded three at a time, a failed one left empty and counted) — next to the exported font when one
  is kept. Progress goes to the status line (project i of n, photo j of m); the done line names what could not
  be downloaded, photos and exported fonts counted apart; the button is disabled while the account holds
  nothing.
- **Delete my account** — a confirmation box that needs a ticked checkbox ("I have downloaded everything I want
  to keep, or I do not need it") and the account's email address typed (compared case-insensitively); the red
  button stays `aria-disabled` until both hold. Then `IvritAccount.deleteAccount()` calls the `delete-account`
  Edge Function (`db/functions/delete-account/index.ts`): the platform's JWT check runs first, the function asks
  Auth who the token belongs to, removes every object under `<uid>/` in the three buckets (paged, subfolders
  included), then `auth.admin.deleteUser(uid)` — the `profiles`, `saves` and `font_projects` rows cascade. It
  answers only the site's own origins (CORS) and returns the counts. Back in the page: the module signs this
  device out (the sign-out call itself may 401 — the session is already dead — which is ignored),
  `IvritSaves.forgetUser(uid)` drops the sync memory and the welcome mark, and the "deleted" tile shows the
  counts. Nothing stored on any device is touched: browsers keep their copies, `.ivrit` and `.hebrewfont` files
  stay. A failed call leaves the box open with one error line and the session intact.

The download is not forced before a deletion (a photo project can be tens of megabytes, and a failed forced
download would block the deletion); the checkbox states the choice instead. The privacy policy's section 5
names the page as the way to see, download and delete everything (EN + HE, accounts rule 8).

`node scripts/smoke-account-page.mjs --sdk <supabase.js>` replays all of it against a fake cloud and parses the
zip in Node (the CRC of every entry, the bundle's keys, the `.hebrewfont`'s photos byte for byte).

## Manual Supabase setup (done once in the dashboard)

The step-by-step walkthrough lives in `README.md` § "Accounts (optional, Supabase)": URL configuration
and redirect allow-list (`https://ivritsuite.com/**`, `http://localhost:8080/**`), Email provider + the
two email templates (*Confirm signup* and *Magic Link*) carrying `{{ .Token }}` only, Google OAuth
client and callback, and the custom SMTP provider that is **required before anyone but the project's
team members can receive a sign-in email** (the built-in sender refuses other addresses and allows only
a few messages per hour).

## Operations

Everything in the plan is built. Keeping the free project awake (`.github/workflows/supabase-keepalive.yml` and
migration 0003), the before-other-people-sign-in checklist, rotating the publishable key, upgrading the SDK,
restoring a person's data from their zip and where to look when something fails are in the README's *Keeping it
running*; the plain-language map of what talks to what is `docs/backend-architecture.md`.
