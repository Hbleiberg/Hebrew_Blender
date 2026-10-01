# Accounts & the account's saves (Supabase) — reference

> Binding rules live in `CLAUDE.md`; this file is how the account layer works. Keep it free of session ids, dates and digests.

## What exists

Accounts are **optional**. Signed out, the device is its own: anonymous use, localStorage, `.ivrit` files
and JSON import are exactly as they were, and the module writes no key, sends no request and opens no
IndexedDB. Signed in, **the account is where saves live**: each tool's registered localStorage keys are that
device's cache of the account — hydrated at every signed-in page load, written through two seconds after the
page's last edit. Four shared files own every line that talks to Supabase — no tool page ever calls the SDK
directly:

| File | Role |
|---|---|
| `js/supabase-config.js` | Public project values: `url`, publishable `anonKey`, the pinned SDK URL + its Subresource Integrity hash, and the `enabled` kill switch. The only file that changes when the project changes. |
| `js/ivrit-account.js` | `window.IvritAccount` — session state, sign-in/out (with the sign-out hooks), lazy SDK loading, the header chip, the required-name step. |
| `js/ivrit-saves.js` | `window.IvritSaves` — the saves adapter: `IVRIT_SYNC_REGISTRY`, the local and cloud backends, the per-item state table and its hydration actions, the `Storage.prototype` write-through hook, the status line, the device-extras card, the sign-out removal. |
| `js/ivrit-projects.js` | `window.IvritProjects` — Font Maker cloud projects: the `font_projects` rows and the three Storage buckets (project file, photos, latest export). Loaded by `Hebrew_Font_Maker.html` and by `account.html` (the download-everything zip). |
| `account-test.html` | Throwaway harness (own CSP, `noindex`, not in the sitemap/`llms.txt`/`sw.js`, skipped by `check-i18n`). Mounts the real chip (the name step included), mirrors state, runs the URL self-checks and the Phase 2 table/bucket checks. |
| `saves-test.html` | Same rules. Mounts the real status line with four page-only registry entries and `hydrate: false` (nothing runs by itself against the real project: no automatic hydration, no card, no write-through), runs the local round trip, the pure self-checks (the hydration-action table included) and the scripted cloud checks through `_test.hydrate` / `_test.flush`. |
| `account.html` | The account page (in the sitemap, precached, own CSP): who the account is and its display name (required there), what it holds tool by tool, **Download everything** (one zip) and **Delete my account** (the backup offer first, then the confirmation). Only the shared modules talk to Supabase; see "The account page and data rights" below. |
| `db/functions/delete-account/` | The one Edge Function: removes the caller's Storage files, then the auth user (rows cascade). Deployed through the connector with the platform's JWT check on; `db/README.md` says how, and why it is not under `supabase/`. |
| `scripts/smoke-account.mjs`, `scripts/smoke-saves.mjs` | Headless Playwright smokes: anonymous with the CDN blocked, remembered session offline, SDK served locally, URL contracts, Hebrew + dark at 800 px. The account smoke also replays the emailed link (the code stripped and filled in, nothing sent before *Verify code*, the address filled in only where it was asked from), the required-name step (a nameless sign-in gets one step, *Not now* after a failed save, *Sign out instead* asks the chip's confirm and signs out, a failing `getUser()` or a named sign-in gets none) and checks every analytics tag leaves the code out; the saves smoke runs the local round trip, the pure checks and the status line's fail-soft states. |
| `scripts/smoke-sync.mjs` | Headless end-to-end test of the signed-in model against a fake cloud (`--sdk` required, port 8081): a fresh device hydrates with no clicks; a tool opened later on a hydrated device takes the account's settings; another tab's write is re-read; two tabs (a stale whole-blob write deletes nothing, a page-write stamp never replaces a live setup); write-through (insert, conditional update, conditional delete, nothing on an unchanged hash, the `pagehide` flush, the `online` retry); Replace hidden from the `.ivrit` restore while a session is stored; deletions propagating both ways; folder trees converging; fonts (landing at load, the eleventh refused quietly, an eleventh upload evicting locally while the account keeps the row, an explicit delete propagating); the device-extras card (fonts and progress listed; after *Remove* the settings blob goes up only once changed); the sign-out cases (memory-confirmed rows gone and the rosters stripped from the Dashboard's key, preferences kept, an edit made moments before reaching the account, an unsynced item surviving, *Sign out instead* on a nameless sign-in leaving no rosters, auth unreachable, a second tab following the broadcast, an account deleted elsewhere removing nothing, an old-module tab beside a new one leaving the v2 memory intact, a v1 memory with a newer local edit uploaded rather than reverted); same-named items in two tools landing in their own keys; `DASHBOARD_DEFAULT_PRESET_CANON` matching the page; the Trope watermark surviving a reload; Erase All signed in sending no DELETE and a cancelled Erase leaving write-through on; then the data-safety cases (`D1`…): a stale tab's save merged with another tab's write, a refused update re-hydrating into a field-by-field merge, a v1 hint never reverting an edit, a self-ended session keeping the memory so an edit made signed out goes up, the dashboard's `.ivrit` Merge keeping every class, the Torah Trainer's per-device fields surviving a sign-out, a following tab sending nothing yet keeping its change for the next sign-in, *Reset all settings* writing the defaults, the replaced copy's note (Download, Dismiss), an empty listing for a live account removing nothing, a deletion made before the first hydration honoured, *Remove* holding back across a reload, an old broadcast ignored by a new session, a sign-out checking the account first, the hub's Trope restore honouring the watermark, Flash Cards keeping a field it does not know, a stale second tab at the sign-out never reverting a newer settings field, an older copy restored while signed out kept beside the account's newer one, a setting both devices changed keeping the other version downloadable, a hidden background tab not replaying its older copy, a listing shortened by a deletion between two pages refused, the Dictionary's `?wl=` link leaving the remembered setup alone, a board typed in an unfocused window surviving another tab's download, a stale tab that closes offline never reverting the account at the next load, a slow listing never letting the starter card replace the account's settings. |
| `scripts/smoke-fontmaker.mjs` | Headless end-to-end test of Font Maker cloud projects (`--sdk` required, port 8082): the fake cloud also answers the Storage endpoints and the page's `Suite` listing; anonymous control (no overlay opens by itself), save, autosave, open in a fresh browser, conflict (Overwrite / Keep both), delete, export keep, a refused upload, the `?start=` contract, Hebrew + dark; then the sign-out cases (an unsaved account project saved before the logout and the page not reloaded, another tab's sign-out leaving this tab's edit and snapshot alone), *Continue where you left off* resuming a pending account save, and a font removed while the SDK has not loaded deleted from the account at the next signed-in load. |
| `scripts/smoke-account-page.mjs` | Headless end-to-end test of the account page (`--sdk` required, port 8083): anonymous control, the listing, the required display name, the download-everything zip parsed and checked in Node, the two-step deletion (the backup offer's buttons following the listing — both waiting while it loads, Download disabled on an empty account, both enabled after a failed listing — then the confirmation, accepted and refused; the sync memory and the hydrated mark gone afterwards, a tool's own key untouched), no name step on this page, Hebrew + dark. |
| `scripts/smoke-migration.mjs` | The golden migration replay (`--sdk` required, port 8084): the six pages' real default blobs are captured, device A is built from them with every boolean flipped, enums moved, folders nested two deep, students, word lists, classes, a weekly grid and the suite-wide preferences; A opens every tool once, its first hydration lists the device's own items on the card and *Add to my account* sends them (the row count is the expected one); a fresh device B hydrates and opens every tool until quiet; then every localStorage difference between A and B is classified — EXPECTED-OMIT, EXPECTED-NEVER-SYNC, EXPECTED-ENVELOPE, EXPECTED-SEED, LOADER-NORMALIZED (an allowlist, each line justified) — and anything UNEXPECTED fails the run (the table is printed either way). Then: deletions made on B reaching A, the second-device story (every tool opened anonymously before signing in) through the same classifier, and the upgrade of a v1 sync memory (a row deleted here and a row the account lost: no DELETE is sent and nothing is removed locally). |

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
only, no status line), and only `Hebrew_Font_Maker.html` and `account.html` add the fifth. Loading the saves
module is not the same as attaching to it: the module starts listening at boot on every page that loads it
(the sign-out hook, the name-step follow-up, the cross-tab stamps), but **only an `attach()` starts a
hydration** — so those two pages, which render no registry key, call `IvritSaves.attach({ tool: 'Suite' })`
(the suite-wide preferences and My Fonts land there; no status host) and use `inventory` / `bundleAll` /
`forgetUser` / `errorText` directly.

## `IvritAccount` API

| Member | Meaning |
|---|---|
| `ready` | Promise → `user|null` once the initial state is known (immediately `null` for an anonymous visitor with no stored session) |
| `status()` | `'disabled' \| 'anonymous' \| 'loading' \| 'signed-in' \| 'offline' \| 'unavailable'` |
| `user()` | `{ id, email, name, provider }` or `null` in every non-signed-in state — `null` while loading and offline too, so page code keys its "signed in" branches on `hasStoredSession()`, never on this |
| `onChange(fn)` | `fn(user|null, status)` — once when known, then on every change, including sign-outs in other tabs |
| `signIn('google')` | Full-page OAuth redirect and back to the same page |
| `signIn('email', {email})` | Sends the email: a 6-digit code and a link that opens this page with the code filled in (`db/email-templates/sign-in-code.html`); on success remembers the address in `ivritSuite_signInRequest` |
| `verifyCode(email, code)` | Signs in with the emailed code — works in any browser or device |
| `signOut(opts)` | This device only (`scope: 'local'`). Runs every `onSignOut` hook first — awaited, each bounded to 10 s, a failing hook never stops the sign-out — while the token is still valid, so the saves module can flush the last edits and remove the account's cached rows; then the SDK sign-out. The device is signed out whether or not the server call succeeds, and the chip and the name step reload either way — unless `IvritSaves.needsReload()` says the page holds nothing a reload must drop (a page that attaches only `Suite`: the Font Maker, the account page). `{ keepLocal: true }` (account deletion) tells the hooks to leave the device's copies alone. Records the uid for `signOutHandled()` |
| `client()` | Promise → the Supabase client, loading the SDK on demand; rejects with `err.code` `'disabled' \| 'offline' \| 'blocked'` |
| `mountChip(target)` | element, selector, or `'auto'` (a `[data-ivacct-slot]` if the page has one, else right after the first `[data-i18n-switcher]`) |
| `init({ mount, nameStep })` | Optional; `mount: false` suppresses the auto-mount (which runs at `DOMContentLoaded`); `nameStep: false` suppresses the required-name step (`account.html`, whose own name field is `required`) |
| `t(key, fallback)` | The `pwa.js`-style translator (I18n when loaded, else English) — reused by the saves module |
| `onSignOut(fn)` | `fn(uid, { keepLocal })` → `void \| Promise`, run in turn and awaited before the SDK sign-out; the saves module registers its cache removal here at boot, the Font Maker its last save (`fmBeforeSignOut`) |
| `onNameStep(fn)` | `fn('named' \| 'later' \| 'none')` — how the required-name step ended on this page load (`'none'`: the account already has a name, or the step could not be shown); the saves module opens its device-extras card on any outcome |
| `needsName()` | `true` while the signed-in account has no display name |
| `hasStoredSession()` | `true` when a session is signed in, loading, or remembered but offline (accounts enabled and the SDK's session key present) — what page code keys every "signed in" branch on: the `_cloud` confirms, the `.ivrit` note swap, the Merge-only restore |
| `storedUserId()` | the signed-in account's id, else the stored session's read without the SDK (`null` when there is none, it is unreadable, or accounts are off) — what `IvritSaves.fontDeleted` keys a deliberate deletion to while the SDK is still loading or offline |
| `signOutHandled()` | the uid this tab's own `signOut()` handled (or `null`) — how the saves module tells an explicit sign-out (`keepLocal` included) from a session that ended by itself |
| `openNameStep()` | shows the required-name step (the saves module never calls it; tests do) |
| `sessionSource()` | `'new'` when this page load established the session (a sign-in here, or an auth callback), `'restored'` when it came from storage, `null` when signed out — informational; nothing in the modules decides on it any more |
| `openMenu()` | Opens the chip's menu (`false` when no chip is mounted) — what the status line's own Sign in button calls |
| `focusChip()` | Puts the focus on the chip (`false` when none is shown) — where the name step and the device-extras card hand it when their opener is gone |
| `profile()` | Promise → `{ displayName, createdAt }` from the account's `profiles` row |
| `setDisplayName(name)` | 1–80 characters: writes the user's metadata (`full_name`, what the chip reads everywhere) and mirrors it into `profiles.display_name` — fail-soft: a failed mirror is logged and the name stands, while `invalid_name` stays strict; the chip re-renders on the SDK's `USER_UPDATED` |
| `deleteAccount()` | Calls the `delete-account` Edge Function with the session's token, then `signOut({ keepLocal: true })`: this device forgets the session and keeps its copies as its own data; resolves with the function's `{ ok, deleted: {saves, projects, files} }` |
| `errorText(err)` | One localized sentence for a failure of any call above (the account page's status lines) |
| `_test` | Pure URL helpers and the name-step outcome for the smoke test |

## How the SDK is loaded (and why anonymous pages pay nothing)

```
read IVRIT_SUPABASE
  ├─ missing or enabled:false                 → 'disabled': no chip, no network
  ├─ auth callback in the URL, or a stored session → load the SDK now ('loading')
  ├─ an emailed link (#ivsignin=)             → 'anonymous'; the menu opens by itself at the code step,
  │                                             which warms the SDK as any open does (a sign-in under way)
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
  `AUTH_QUERY_KEYS` removed, and with the hash dropped when it carries the emailed link's `#ivsignin=`
  (`LINK_HASH_KEY`, below). `location.href` itself must stay intact — the SDK reads `?code=` from it
  to complete the exchange — so never "simplify" this by cleaning the URL before the SDK runs, and
  keep the key list and the hash key in step with the module (an inline tag cannot read a deferred
  module). The five pages with the tag but without the module (404, contact, privacy, resources, terms)
  never receive a link — no code is asked from them — so only their tag has to hold.
- **`account.html` refuses to render in a frame**; the tool pages stay embeddable on purpose, so a
  teacher can put one in an LMS. `frame-ancestors` is not an option: it is **ignored in a `<meta>` tag**
  (measured — the same directive works as an HTTP header) and GitHub Pages serves no custom headers.
  So an inline script sets `.ivframed` on `<html>` when `window.top !== window.self` and CSS hides
  everything but a `target="_top"` link out. Deleting an account was never clickjackable anyway: it
  needs the account's own email typed into a field.
- **Email sends a 6-digit code, and a link that only fills it in.** `signInWithOtp` (`shouldCreateUser:
  true`) sends it; `verifyOtp` (type `email`, with the address) signs in anywhere — another device, a
  mail app's in-app browser, the installed PWA. The email's text is `db/email-templates/sign-in-code.html`,
  pasted into both dashboard templates (*Confirm signup* for a person's first email, *Magic Link* after
  that), and it **never carries `{{ .ConfirmationURL }}`**: school mail filters open every link in an
  incoming email to scan it, which spends Supabase's one-time link seconds after it is sent (two scanners
  hit the first real sign-in link before the teacher could), and that link signs in whoever opens it. Its
  one link is `{{ .RedirectTo }}#ivsignin={{ .Token }}` — back to the page the code was asked from (the
  module's `redirectTarget()`), with the code in the hash, which never reaches a server:
  - `consumeLinkHash()` runs first in `boot()` — before the SDK, and even with accounts switched off — and
    takes the code out of the address bar (`history.replaceState`) so it is never bookmarked or shared; it
    waits in memory (`pendingCode`).
  - `settleLink()` decides once the session state is known: already signed in here, the code is dropped
    silently; otherwise the menu opens once at the code step with the code filled in, and the address
    too when this browser asked for the code (`ivritSuite_signInRequest`, written by a successful
    `signIn('email')`, ignored after 24 h, removed by a sign-in and by Erase All). Focus goes to *Verify
    code*, or to the address field when it is empty; the note says which (`shared.account.link_filled` /
    `link_filled_email`).
  - **Nothing is sent until *Verify code* is pressed**, and the code is verified with the address in the
    field — the one typed in this browser, never one taken from the link. A code is valid only for the
    address it was sent to, so a scanner that opens the link spends nothing, and a link someone else sent
    cannot sign this browser into their account (their code fails against this person's address). A link
    carrying a token hash would lose both properties: that is why the template carries the code.
  - Verify without a valid address is refused inline (`shared.account.error_email`) and sends nothing; a
    used or expired code reads `error_invalid_code`; a new code sent from the menu clears the old one from
    the field.
  The link-handling code for Supabase's own links stays — `?code=` callbacks and the expired /
  other-browser notes — because Google OAuth returns through the same path. Inside an installed app the
  email option is listed first.
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
(`.ivacct-btn`, `aria-haspopup="dialog"`, `aria-expanded`, `aria-label` from `shared.account.chip_aria`:
the words on the chip, then "account", so a voice command naming what it shows reaches it) + popover (`.ivacct-menu`, `role="dialog"`,
`aria-modal="false"`, `aria-label` from `shared.account.menu_aria`). Signed out: Google button, email
field, "Email me a sign-in code", then the code field + Verify; an `aria-live="polite"` note
carries progress and errors. An emailed link opens the menu by itself at the code step (see *Auth flow
decisions*). A rebuild — the page's dictionary landing after that auto-open, a language switch, the first
sign-in's `INITIAL_SESSION` — keeps the typed or filled-in code and puts the focus back on the same
control (each carries a `data-ivk` key), instead of dropping it onto the page body. While a sign-in or sign-out is in flight every menu button is locked by a
module flag the handlers check (`aria-disabled` alone is only a look, and a mid-send rebuild drops it),
re-applied by each rebuild and cleared when the action settles, so a double-click sends one code. The Google row (`.ivacct-gbtn`, a flex row) leads with Google's four-colour
"G", built as an inline `<svg>` by `googleMark()` from the official path data — inline so no carrier
page's CSP grows and an offline visitor still sees it, unmodified because Google's branding terms allow
the mark on a sign-in button only as-is, and `aria-hidden` because the button's own label already says
Google. It sits on the inline-start edge, so it mirrors to the right under the Hebrew UI. Signed in: *Signed in
as {email}*, **Account…** (an `<a>` to `/account.html`) and **Sign out** — a `confirm` built by
`signOutConfirmText()`, the one question the name step's *Sign out instead* asks too
(`shared.account.sign_out_confirm`; its `_kept` plural naming how many items `IvritSaves.pendingSignOut()`
counts as not in the account yet, which stay as the device's own data; `sign_out_confirm_unknown` when
`pendingSignOut().unknown` says this page could not compare everything with the account — a hydration that has
not succeeded, a write in flight), then `signOut()` and a `location.reload()` whether the SDK call succeeded or
not (the page holds in-memory copies of its settings, and a reload is the one reliable way to drop them) —
skipped where `IvritSaves.needsReload()` is false (`reloadAfterSignOut`). Keyboard: Enter/Space/click toggle, ↓ opens, focus lands on the first control,
Tab/Shift+Tab wrap inside, ↓/↑ move between controls (not inside text fields), Escape closes and returns
focus to the button, an outside click closes without moving focus. A sign-in by code or Sign out closes the
menu and hands the focus to the button only if the focus is still in the menu or nowhere: the name step or
the device-extras card a sign-in may open keeps it (*The name step and the device-extras card*, below). One injected `<style id="ivacct-style">`,
classes `ivacct-*`, logical properties, palette vars with fallbacks, `body.dark` / `html.dark-early`
aware, transitions neutralized under `prefers-reduced-motion`. Sized to match the language switcher
(30 px min-height, `align-self: stretch`). The email and code fields take the label's compact size on a
desktop and 16 px under `(pointer:coarse)`: iOS Safari zooms the page into a focused text field under
16 px and leaves it zoomed. Labels are `shared.account.*` keys and re-render on
`I18n.ready` / `I18n.onChange`.

## Storage keys the account layer touches (all exempt from AllTools export/import)

| Key | Written by | Notes |
|---|---|---|
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token` | the SDK | the session; erase-only (Erase All = signed out on this device; a button Sign out removes it together with the account's cached rows) |
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token-code-verifier` | the SDK | transient, only during a PKCE round trip |
| `ivritSuite_accountCache` | the module | `{email, name}` for the loading/offline chip; erase-only |
| `ivritSuite_signInRequest` | the module | `{e, at}`: the address this browser last asked a sign-in code for, as typed, and when — what lets an emailed link fill in the address too; written by a successful `signIn('email')`, ignored after 24 h, removed by any sign-in; erase-only, never exported |
| `ivritSuite_syncMeta2` | `js/ivrit-saves.js` | what this device last synced, per account (v2): `{v:2, users:{[uid]:{[tool]:{[kind]:{[name]:{h, id, u, at, deleted?}}}}}, legacy:{[uid]:…}, hydrated:{[uid]: ISO}, noUpload:{[uid]:{'tool/kind/name': hash}}, held}` — `users` is the memory (the hash both sides had after the last successful write, the row id and its `updated_at`; `deleted` marks a font `fontDeleted` removed here whose account row is still to go); `legacy` is a stored v1 memory (the old key's `users`), read once on first run and kept only as a **hint that tells "newer here" from "newer in the account" on a row's first classification** — never a deletion, never "the account lost it" — and consumed once the row is remembered in v2; `hydrated[uid]` is the mark that the account is set up on this device (the device-extras card has been asked) — dropped (`dropHydrated`) by a sign-out, by a session that ended by itself, by the account-gone signal and, for every account, by a page load with no stored session, while the memory stays (only `forgetUser`, after an account deletion, drops it whole); `noUpload[uid]` the settings rows and folder trees *Remove from this device* held back at their hash then; `held` the `SUITE_PREFS` fields this build could not apply. A new key, so a tab still running the old module cannot overwrite it. Erase-only, never exported |
| `ivritSuite_syncMeta` | `js/ivrit-saves.js` | now only the cross-tab stamps both module versions read — `written[tool][kind]` (a module write), `pageWrites[tool][kind]` (a page write the hook saw), `lastWrite {tool, kind, name, at, source}` — and the sign-out broadcast `signedOut: {uid, at, rows}` (`rows`: what the removal took, each `{tool, kind, name, h, id, u}`), which other open tabs of a button sign-out follow through the key's `storage` event. Two tabs read-modify-write it, so `stampsSave()` re-reads the stored copy first and keeps the newer stamp per tool and kind. Erase-only, never exported |
| `ivritSuite_syncBase` | `js/ivrit-saves.js` | the **base** of each settings row (`merge: 'assign'`), per account: `{v:1, users:{[uid]:{'tool/kind/name': {h, text}}}}` — the projected value as canonical JSON, written after a successful write when the store still hashes to what was remembered (`rememberBase`), deleted with its memory record; what a field-by-field merge compares both sides against (*Conflicts on a settings row*, below). Erase-only, never exported |
| `ivritSuite_replaced` | `js/ivrit-saves.js` | a settings version a merge did not keep, per account: `{v:1, users:{[uid]:{'tool/kind/name' or 'tool/kind/name#both': {tool, kind, name, at, why, value}}}}` (one slot per reason, so a later conflict never overwrites the copy kept at a first sign-in; a later conflict of the same kind replaces the earlier other version) — `why` `signin`: the device's own settings the account's copy replaced (`useCloud` on a row this device never synced); `both`: the other side's version where both changed the same setting — offered as an `.ivrit` download on the tool's status line until *Dismiss*; the key is removed when the last entry goes. Erase-only, never exported |

Signed in, the hub's `eraseAllSettings` first sends every tool's pending edits (`IvritSaves.flush`, bounded at
5 s) and reads `pendingSignOut()`, so its final confirm names what is not in the account and would be gone for
good (`home.alltools.erase_confirm2_signed_in_unsynced.*`, or `_unknown` when the page could not compare
everything). It calls `IvritSaves.suspend()` right after that confirm and before the first
`removeItem` (write-through stops, so nothing erased goes up as a deletion; a cancelled Erase leaves it on),
removes every `sb-` key plus the six `ivritSuite_*` keys above (Erase All = signed out on this device) and reloads
the page when a session was there, so the chip, the status lines and the SDK's in-memory session all start
from the emptied storage.

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
| `saves` | saved item | `data` ≤ 2 MB (a real CHECK); 2000 rows per account (**trigger-raised on `INSERT` only** — an `UPDATE` never re-checks it) | `(user_id, tool, kind, name)` is unique — the client never upserts: a new row is an `insert` (`23505` = created meanwhile), an existing one a conditional `update` on its listed `updated_at`, a removal a conditional `delete` on it; `user_id` defaults to `auth.uid()` and is never sent; `bytes` and `updated_at` are set by a trigger (`updated_at` is the only ordering signal for rows; `client_updated_at`, the writing device's clock, is read in one place — which side changed a settings field last in a field-by-field merge); `tool` is a **hard CHECK constraint** listing Suite / Worksheet / FlashCards / Dictionary / TorahTrainer / TropeTutor / Dashboard, mirroring `var TOOLS` in the module — **an eighth tool needs a migration widening it**, or every upload from that tool returns an opaque `23514`; `data_hash` is capped at 64 chars by its own CHECK; `kind` matches `^[A-Za-z]{1,32}$`; `name` 1–120 chars |
| `font_projects` | cloud Font Maker project | 25 per account | catalogue row for a project whose gzipped JSON, downscaled images and exports live in Storage; `project_path` / `export_path` must start with the owner's id |

**The 2 MB server cap is not the one a teacher meets.** The module guards at `MAX_BYTES = 1887436`
(1.8 MB of canonical JSON) before uploading, because the server's 2 MB is measured over its own slightly
wider text — so an oversize row is always refused client-side and the `23514` size path is unreachable from
a browser. 1.8 MB is the number to quote when a deck will not upload. Listing and loading are paged at
`PAGE_SIZE = 1000` (PostgREST's maximum), so a full 2000-row account is two round trips per tool. The listing
is the only signal that a row left the account, so it must be complete: its first page asks for the exact
count (`{ count: 'exact' }`) and paging goes on until that many rows arrived (a server whose page size is below
`PAGE_SIZE` would otherwise end it early, and every row past it would read as deleted); without a count, until
a short page. Rows are kept once by id (a row inserted elsewhere between two pages shifts the next page by one),
and a listing that still ends with fewer rows than its count — a row deleted elsewhere between two pages shifts
another out of sight — throws `listing_suspect`: the hydration stops, removes nothing, and the next one retries.

Limits come back as Postgres `check_violation` (`23514`) with a readable message; a duplicate name is
`23505`; anything RLS refuses is `42501`. The saves adapter maps these to the status line's strings (`errorText`);
in a hydration or a flush, `23514` (the account's row limit) and `22P05` (a value the server cannot store) are
row errors — that item is skipped and named, the rest goes on.
A call that comes back **401** is retried once after the session is re-read (`withClient`): an expired token,
or a request that reached the database as not signed in, which is what a listing fired while another tab
refreshes the same sign-in can do (PostgREST answers an anonymous `42501` with 401 and a signed-in one with
403, which is not retried). A PostgREST error carries no status of its own, so `unwrap` copies the
response's onto it; without that the retry never fired and the status line said the cloud refused.

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

**Signed out, the device is its own; signed in, the account is where saves live.** Anonymous use never
writes anything: no localStorage key, no request, no IndexedDB open, and `Storage.prototype` untouched.
Signed in, each tool's registered localStorage keys are that device's cache of the account:

- **Hydrate** — at every page load with a session (and after a sign-in) one listing, without data, for the
  tools this page reads (its own, `Suite`, and its `alsoPull` list); rows whose hash differs are fetched and
  written into the keys, items before their folder trees, and the page's `onLocalChanged` re-renders.
- **Write-through** — a `Storage.prototype.setItem`/`removeItem` hook, installed only after a signed-in
  hydration, marks a registered kind dirty, waits 2 s after the last write to that tool, then diffs the store
  against this device's sync memory: insert / conditional update / conditional delete (only names this tab
  saw) / nothing when the hash is unchanged. When a page is hidden or left, every kind of its tool is compared
  and sent if it changed.
- **Conflicts never open a dialog**: an item keeps both, a settings blob takes the account's fields on a row
  this device never synced (the device's own copy kept for download) and is merged field by field afterwards
  against the value both sides last agreed on, progress / rosters / word lists / trees merge losslessly; each
  tab compares against the copy it last saw, so a tab with an older view never reverts a newer write.
  **Deletions propagate both ways and the later human action wins**; a `single`/`scalar` row gone from the
  account is re-inserted, a font evicted by the cap is not a deletion (it lands again once there is room), and a
  listing that lacks every remembered row is checked with `getUser()` before anything is removed (only a
  definite "gone" counts, and an empty listing for a live account removes nothing).
- **One decision gate** — the first hydration for an account on a device lists every tool and asks once about
  the device's own saves that are not in the account (Add / Download a backup / Remove).
- **A button sign-out** flushes, then removes what the account is known to hold (unsynced rows stay as the
  device's own data; the suite-wide preferences, My Fonts and a settings row's per-device fields stay); a
  session that ends by itself removes nothing and keeps the sync memory, so the next sign-in sends up what
  changed meanwhile.

Every entry point resolves or rejects; nothing throws into the page. The DOM is `createElement`/`textContent`,
and JSON from the cloud passes through a prototype-safe parser. The 2 s debounce and the Font Maker's 10 s
autosave are the only timers in the layer: no polling, no Realtime, no `wss:` in any CSP.

### The registry

`IVRIT_SYNC_REGISTRY` (an array inside the module) is the only place that names synced keys — one entry
per localStorage key: `{ tool, kind, lsKey, shape, path?, nameField?, envelope?, merge, omit?, follows?, ivritKey?, label?, skipUpload?, noDeleteByAbsence?, watermark? }`
(or `virtual` in place of `lsKey`, see below). A localStorage key syncs only by having a row here, never by
accident, and a settings field the machine decides goes in that row's `omit`.

| Field | Meaning |
|---|---|
| `shape` | `map` (`{name: value}` → one row per name), `mapIn` (`{…, [path]: {key: value}}` → one row per key; label from `value[nameField]` — for a row only the account holds, read from the row's data once per row version, `cloudLabelFor`, so the status line and the account page name a class list or word list rather than show its id, and the read that hashes a hashless row supplies it too; `envelope` = the other top-level fields, e.g. `{v:1}`), `single` (one settings object → one row named `default`), `tree` (`{v:1, root:[…]}` → `default`, synced after `follows`), `scalar` (a plain string → `default`, travelling as `{value}`) |
| `merge` | how a downloaded copy lands on a differing local one: `item` (replace that item), `assign` (cloud fields over a copy of local — the `.ivrit` Merge teachers know; a conflict on such a row is merged field by field, *Conflicts on a settings row*), `deepMax` (lossless: numbers max, booleans or, objects recurse, arrays keep local), `max` (scalar), `page` (the page's pure `merges[kind](local, cloud) → merged`) |
| `omit` | field names (a trailing/leading `*` glob allowed) that never travel: stripped before hashing and upload, this device's values put back after a download, cloud values of them dropped |
| `follows` | trees only: the kind whose items the tree names |
| `ivritKey` | the AllTools bundle key, so the account backup and the device-extras backup write an `.ivrit` the hub imports (else `tool` + `data:{[kind]: …}`) |
| `label` | an i18n key for the kind (falls back to the raw kind) |
| `virtual` | in place of `lsKey`: a store assembled from several keys (`{ read, write, remove, applied }`); the suite-wide preferences row is the one such store |
| `skipUpload` | `(name, value) → true` for a local item that is only a seed: the roster entry's for an untouched empty class named "My class" (the literal or the localized default), the Dashboard preset entry's for the untouched "Default" preset every fresh device mints (`canonJson(value) === DASHBOARD_DEFAULT_PRESET_CANON`, a canonical-JSON constant in the module that `smoke-sync` asserts still equals the page's `DEFAULT_PRESET.Default`; `skipUpload` is synchronous, so a constant, not a hash). A seed is never listed as a device extra and never uploaded by itself; a device that changes it stops it being a seed; a seed with a same-named row in the account takes the account's copy; an already-uploaded copy is a normal row. A seed's name is also left out of the projected form of the folder tree that follows its kind (`project` → `stripSeedItems`): the shared tree component appends every local name and prunes every name it lacks, so a seed named in the account's tree would make a device that holds the seed and one that does not trade a tree write on every load |
| `noDeleteByAbsence` | fonts: the shared uploader block evicts the oldest font at the ten-font cap, which is not a deletion — a font missing from the store never deletes its account row (neither the flush nor a *deleted here* row does; the row stays in the account and lands here again once My Fonts has room), and a font row leaves the account only through `IvritSaves.fontDeleted(name)` (its memory record marked `deleted`); a font row gone from the account still leaves this device |
| `watermark` | `deepMax` only: the name of a timestamp field (the Trope Tutor's `resetAt`) — the side whose watermark is older than the other's counts as empty (only its watermark-free scaffolding survives) and the merge keeps the newest watermark, so a reset made here is not undone by another device's older mastery |

**The suite-wide preferences row** (`Suite` / `prefs`, `virtual: SUITE_PREFS` beside the registry, single/assign,
`ivritKey: suitePrefs`): one row assembled from the small site-wide keys every page reads — `hebrewBlender_lang`,
`_darkMode`, `_kbdLayout`, `_inputMode`, `_hebFont`, `_hebFontSize`, `_livePreview`, `hebrewFontMaker_lastAuthor`,
`hebrewDictionary_translitStyle`, `_ttsRate`, `_emojiSettings`, `_nikudColors`; the three `*_panels` maps, the Dictionary's audio
switch and its last search stay per device. Every page hydrates it (`Suite` is first in `TOOLS`, so a language change
lands before the tools' own rows); only the hub mounts its status line (`#cloudStatus`), and the Font Maker and the
account page attach `Suite` explicitly for it. Each of its keys maps to the row in the write-through hook, so a
language or theme switch goes up like any edit; as an `assign` row it takes the account's fields on a device that
never synced it (no replaced copy is kept for it) and is merged field by field afterwards, and is never asked about on
the card. `write` sets each field it
can validate (the language against `I18n.supported`, the two-value switches, the slider ranges, the six romanization
styles, a plain object for the emoji settings) and never removes a key. A field this build cannot apply — an unknown
language, a value out of range, a field a newer build added — is **held** in the sync memory (`held: { field: { v, was } }`)
and reported as the row's value while that key still holds `was`, so the tail sees both sides equal instead of pushing
a degraded copy down; a change to the key here drops the hold and the row goes up as this device's. Once the tail
settled the row the module applies the language itself (`I18n.setLang`, live on every converted page) and fires
`ivritsuite:prefs` on `window`; each page's `initCloudSaves` follows the theme from that event (its own `toggleDark()`
when the stored value and `body.dark` disagree — the dashboard's re-renders the nikkud colors as its rule requires),
and so do the Font Maker's `init()` and the account page's boot wiring;
the other fields show at the next load. In the account backup the row is `suitePrefs`, which the hub's two import
paths unfold into the flat AllTools keys (`uiLang`, `darkMode`, …) their validated branches already apply.

**A teacher's own fonts** (`Suite` / `font`, `virtual: USER_FONTS`, map/item, `ivritKey: userFonts`,
`noDeleteByAbsence`): one row per font, the TTF base64 inside it, in exactly the `{name, b64, family}` shape the
AllTools export has always used — so the account file and the device file carry a font the same way, and the hub's
import takes either an array or one entry per name. The per-device `created` stamp is deliberately left out of the
row, or the same font would hash differently on every device. The bytes live where they always did, the origin-wide
`ivritsuite-fonts` IndexedDB; the module carries its own small reader and writer for it, because a virtual store
backed by something asynchronous must be read before the plan is built — every hydration calls `prime()` on the
virtual entries first, and only when signed in, so an anonymous visit still opens nothing it would not have opened.
**A download never evicts.** The shared `saveUserFont` drops the oldest font past `IV_FONTS_CAP` (the page-side
shared-block name; the module keeps its own deliberately separate copy of the IndexedDB constants as `FONTS_DB` /
`FONTS_STORE` / `FONTS_CAP`), which is right for an upload the teacher chose and wrong for a sync: at the cap the
row is skipped quietly and not even fetched (a font row can be about 2 MB) — the status line carries a note naming
it (`shared.cloud.status_font_full`), never a toast — so the account keeps the font and the
device keeps all of its own. A font this device cannot store at all (no IndexedDB, as in some private windows) is
skipped with a console warning, and the hydration goes on. A teacher with ten different fonts on two devices
therefore has twenty in the account and ten on each, which is the honest reading of a per-device limit. After a
write the module fires `ivritsuite:fonts` on `window`; each picker page (the Font Maker and the hub included)
listens and re-runs `refreshMyFonts()`, which also re-applies a face the page had chosen by name but could not show
until then. The upload side is the block's own `saveUserFont`, which the module wraps once the hook is armed (after
it resolves: `USER_FONTS.prime()`, then a `Suite`/`font` flush of that one name — an eleventh upload evicts locally as
the block always did, and the account keeps the evicted row, which lands here again once there is room — a *deleted
here* font row downloads, it never deletes); `deleteUserFont` is deliberately not wrapped (the block's cap eviction
calls it), so an explicit delete — the hub's `deleteMyFontFile`, the Font Maker's remove-font modal, both with a
signed-in wording that says the font leaves the account and the other devices
(`home.alltools.myfonts.remove_confirm_cloud`, `fontmaker.modals.remove_font_body_cloud`) — calls
`IvritSaves.fontDeleted(name)` while a session is stored. It drops the module's cached copy of the font at once (a
later flush would otherwise upload it again) and marks the memory record `deleted` before any request, keyed to the
stored session's id (`IvritAccount.storedUserId()`), so it works while the SDK is still loading or offline; the
conditional delete is sent at once when signed in, and when it cannot be sent then (no client yet, offline, a
failure) the next hydration sends it (`deleted-here` with `deleted` → `deleteCloud`). A row another device changed
since is not deleted: its newer copy lands again.

`attach({ tool, status?, entries?, merges?, flush?, finalFlush?, onLocalChanged?, alsoPull?, paused?, editing?, hydrate? })`
is the whole per-page surface: `status` (element or selector) is where the status line is mounted; `entries` is
for harnesses (real tools list theirs in the registry); `merges` supplies the `page` helpers; `flush()` must cancel
any debounced writer and write now — the module calls it at every hydration and before every write-through, so it
must never throw the teacher out of an edit; `finalFlush()` runs only on `pagehide` and sign-out (the dashboard
exits its in-place editor there); `editing()` returning `true` says a live edit is open (the dashboard: a board, an
Intermission screen or a class list being typed), so another tab's download is held as it is for a focused tab — the
kind marked stale, merged at this page's next save — instead of re-rendered over the typing in a window that lost the
focus; `onLocalChanged(kind, name, names, { pending })` must re-read that key into
memory and re-render (`pending` while the device-extras card is still asking, so a page's own same-name fold
waits); `alsoPull` names other tools this page reads, whose rows land and go up with this page's hooks (the
generator and Flash Cards pull the Dictionary's word lists, the hub every tool); `paused()` returning `true` only
postpones the debounced flush (a handout print, an answer-key view); `hydrate: false` (the harness) suppresses the
automatic hydration, the all-tools first listing, the card and the hook. The old `panel`, `title`, `open` and
`deviceBackup` are refused with a console warning (`panel` maps to `status`). A `single` / `scalar` / `tree` /
`mapIn` entry is **downloadable only when the page gave `onLocalChanged`** (otherwise upload-only, with a console
warning; a `virtual` store applies a download itself, so the suite-wide preferences land on every attaching page): those tools keep their settings in memory and rewrite the whole blob on the next change, which would
undo a download and then push the stale blob back up as "newer here". A page that renders no registry key (the
Font Maker, the account page) still calls `attach({ tool: 'Suite' })`: only an `attach()` starts a hydration, so a
late-attaching page is never mistaken for one that does not attach. `attach()` also records what the page loaded
(`snapshotLocal`: each item of its tools as this tab's view), so a deletion the teacher makes before the first
hydration of the page load finishes is a deletion; a sign-in records it again.

### Hashes and the state table

Postgres `jsonb` rewrites JSON (key order, spacing), so every hash is SHA-256 (`crypto.subtle`, prefix
`1.`, base64url) over the **canonical** form of the value — keys sorted at every depth — after `omit`;
the row's `data_hash` is only a listing shortcut, a row with a null or foreign hash is fetched and hashed
here. Object key order therefore does not survive the cloud (tools read by key; list order comes from
the local store and the folder tree). `ivritSuite_syncMeta2` remembers, per account, the hash both sides
had after the last successful write plus the row id and its `updated_at`.

Every hydration classifies each row (`planTool` → `classify`) and `hydrateActionFor(row, first, saw)` — pure,
exported through `_test` — says what the device does about it; `first` is true until the device-extras card
has been asked for this account on this device (`ivritSuite_syncMeta2.hydrated[uid]`, which a sign-out or a
session that ended by itself drops again), and `saw` is whether this tab saw the item (`sawHere`, below).
`actionFor(tool, row, first)` then adjusts that action for this tab's own view (*This tab's view*, below).

| Situation (L = local hash, C = cloud hash, M = v2 memory) | State | Hydration action |
|---|---|---|
| local only, no M | `local-only` | a seed → nothing; on the first hydration a `map`/`mapIn` item, a font or a progress/streak row (`deepMax`/`max`) is a **device extra** (the card decides); anything else → insert |
| local only, M names a row (the account lost it) | `local-only` | a `map`/`mapIn` item with L = M.h → removed here too (`removeLocal`, the page notified — a deletion made elsewhere); a changed item, or a `single`/`scalar`/tree row → re-inserted (the later human action wins) |
| cloud only, no M | `cloud-only` | download |
| cloud only, M names that very row (M.id = the row, and M.u = its `updated_at` or M.h = C) — synced here once and gone here | `deleted-here` | M marked `deleted` (a `fontDeleted` that could not be sent then) → `cloudRemoveIf(id, M.u)`, on any hydration; otherwise after the first hydration, and only when this tab saw the item (`sawHere`: in its view recorded at attach / sign-in, after its last hydration or at its last flush) → `cloudRemoveIf(id, M.u)`: 0 rows back means it moved since → download instead; during the first hydration, or for a name this tab never saw (another tab added it, or this page rewrote the key from a stale in-memory copy) → download; a font (`noDeleteByAbsence`) → download (evicted by the cap, it lands again once there is room; a full My Fonts skips it unfetched) |
| L = C, or neither side moved since M | `synced` | nothing (the memory is refreshed when stale) |
| L = M.h, cloud moved (`updated_at` ≠ M.u and C ≠ M.h) | `cloud-changed` | download (`restoreOmitted` puts this device's `omit` fields back) |
| cloud unchanged (`updated_at` = M.u or C = M.h), L ≠ M.h — or no M but a `legacy` hint says the account did not move | `local-changed` | conditional update; on a first hydration an item keeps both (the account's copy lands as "{name} (from another device)") and a mergeable row merges |
| both moved, or no M (and no hint) and L ≠ C | `conflict` | `item` → **keep both** (the account's version is inserted as "{name} (from another device)", this device's `name` goes over the row with the conditional update, the copy is written here and read back); `assign` → when v2 memory or a `legacy` hint exists (this device moved since; merged, never reverted) `keepMine`: the field-by-field merge against the base, or without a base this device's fields with the fields only the account has surviving; when neither exists `useCloud`: the account's fields (a fresh device's blob is often defaults, not a choice — the module cannot tell, so this device's own copy is kept for download; per-device `omit` fields kept); `deepMax` / `max` / `page` → the lossless merge; a seed → download |

A row a page cannot re-read (a `single`/`scalar`/`tree`/`mapIn` row on a page without `onLocalChanged`) takes
no download-shaped action (`keepMine` in a conflict). A v1 `deletedCloud` tombstone (`cloud-deleted`) is
treated as `local-only`. **The account-gone guard**: when, for any listed tool, the listing returns none of
the rows the memory holds, the module asks `c.auth.getUser()` and reads the account's `profiles` row before
believing it (`accountAlive`). Only a definite answer means the account is gone — the auth server no longer
knows the user, or the `profiles` row is missing; a network failure, a timeout or a 5xx is "don't know", which
counts as alive (nothing is ever removed on a guess). Gone: only the mark is dropped (`dropHydrated`; the memory
and the hint stay), **nothing on the device is removed**, the status line reads the session error and
`signOut({ keepLocal: true })` follows. A deleted account can still answer a valid token with an empty list,
and "the account lost it" would otherwise remove every copy here. Alive, yet the listing holds no row at all
although the device remembers some: the listing cannot be trusted (a policy or a grant broken on the server), so
the hydration stops with `listing_suspect` (the status line's error, with Retry) and removes nothing.

**Conflicts on a settings row.** Every `assign` row (a tool's settings blob, the suite-wide preferences, the
generator's remembered setup) keeps a **base**: after each successful write, the projected value both sides then
held, as canonical JSON with its hash (`rememberBase` into `ivritSuite_syncBase`, only while the store still hashes
to what was remembered). When both sides changed such a row (`keepMine` on a conflict) the account's copy is
fetched and merged per top-level field (`merge3(base, local, cloud, preferLocal)`): a field only one side changed
since the base takes that side's value; a field both changed to different values takes the side changed last —
this device's when the stamp of its last flushed page write of that kind (`pageWrites`) is newer than the row's
`client_updated_at`, the other device's otherwise; a field removed on the winning side stays removed. The result
goes to both sides (`writeBothSides`: the conditional update, the local write and its tail), this device's `omit`
fields put back. A base is used only when its hash equals the memory's; without one — a row remembered before
bases were kept, or the old module's `legacy` hint — this device's fields win and the fields only the account has
survive. **Neither side's change is lost:** when the merge drops a value a side had changed since the base (a
setting both changed, or every differing field when there is no base), that side's projected version is kept in
`ivritSuite_replaced` with `why: 'both'` (`keepLosingSide`, also run by the per-tab `tabMerge`) and the status line
shows `shared.cloud.both_note` with **Download the other version (.ivrit)**
(`IvritSuite_<tool>_settings_other_version_<date>.ivrit`) and **Dismiss**.

**The replaced copy.** `useCloud` lands the account's settings over a device that holds its own copy of the row
but no memory of it (a first sign-in here, or a tool first synced since). The module cannot tell untouched
defaults from years of work, so when the device's projected copy differs from the account's it is kept in
`ivritSuite_replaced` (never for the virtual preferences row, and not for a row a button sign-out removed from this device — `markStripped` / `takeStripped` in `ivritSuite_syncMeta2.stripped[uid]`: what the page wrote there since is its own defaults or signed-out use, so the note would be a false alarm at every sign-in on a shared computer), and that tool's status line — every tool's on the
hub — shows a note (`shared.cloud.replaced_note`, one box per tool and reason) with **Download the earlier settings (.ivrit)**
(`replacedDownload`: a `partial` AllTools file from `bundleFromRows`, `IvritSuite_<tool>_settings_before_sign_in_<date>.ivrit`,
which any tool's Backup panel or the hub restores as a Merge) and **Dismiss** (`replacedDrop`). `forgetUser` and
Erase All remove it too.

**This tab's view.** Each tab records, per item, the hash it last saw (`seenNames[tool][kind][name]`; `true`
until a hash is known) and, for a settings row, the value (`tabBase`): at attach and at a sign-in
(`snapshotLocal` — what the page loaded), after each hydration (`snapshotNames`, once the page was told about
every landing) and when a flush lands a write. `sawHere` reads it: a remembered row absent here is a deletion
made here only when this tab saw it. And when the device's memory of a row has moved past what this tab saw
(another tab here uploaded it, or downloaded another device's newer copy), this tab's copy is not "changed
here": `actionFor` turns an upload, `keepMine`, `keepBoth` or `useCloud` into a **download** when this tab changed
nothing since its view; for a settings row it did change, **`tabMerge`** (`actTabMerge`: `merge3` against this
tab's view, a field both changed taking this tab's value when the tab has the focus — the teacher is working
here — and the other's otherwise; `keepMine` without a view or a re-read hook); keep both for an item; the
lossless merge for a mergeable kind. `flushKind` never writes such a row itself — it asks for a hydration, which
decides by the same rule.

**Order inside one hydration** (`hydrateInner`): the attached pages' `flush()` under the module's self-write
guard, `primeVirtual('Suite')`, one listing (`cloudList`; an array of tools selects `'tool, ' + ROW_COLS` and
the first hydration lists every tool in `TOOLS`, since the extras diff is device-wide), the account-gone
guard, a plan per tool; then (1) `Suite` first, then each tool's downloads — what the account has that this
device lacks or holds older; (2) on the first hydration the card, and after *Add* the extras' inserts (a
same-named row → keep both), after *Remove* the extras' removal, then every settings row and folder tree the
device holds is held back at its present hash (`holdBack` into `ivritSuite_syncMeta2.noUpload[uid]`, so a reload
does not release it; it goes up only once it changes), then a fresh listing; (3) uploads, merges (`tabMerge`
among them), the account's deletions and this device's deletions; (4) a fresh listing and the folder trees,
never on a stale plan, then this tab's view recorded (`snapshotNames`); finally the status line (`saved` with the newest `updated_at`, `error_row` naming skipped
rows, `error` with Retry, or `offline_pending`), `hydratedTools[tool] = uid`, the hook armed,
`ivritsuite:hydrated` `{ tools, ok, first, landed }` on `window`, and a flush of the kinds a page wrote
meanwhile. A row's own trouble (too big, an impossible name, a malformed cloud copy, no merge helper on this
page, moved between the listing and the action, a page hook that failed, the account's row limit `23514`, a value
the server cannot store `22P05`) skips that row and names it; a font this device has no room for is a quiet note
(`status_font_full`) and is not fetched, and one it cannot store (no IndexedDB) a console warning; only an error every row would share (the
connection, the session) stops the run, and Retry, an `online` event or the next load resumes.

Cloud writes to an existing row are **conditional** (`update … eq('updated_at', listed)`,
`delete … eq('updated_at', …).select('id')`): zero rows back means another device wrote first, the tool is
hydrated again and the later state decides. New rows are `insert`s (`23505` = created meanwhile → hydrate
again). Every local write the module makes ends the same way (`settleLocalWrite`): the page's
`onLocalChanged()` (a hook that throws fails the action with `hook`, nothing remembered), then the page's
`flush()`, then the store is re-read and compared with the account — equal, the cloud row is remembered;
different (the page re-applied the value its own way), the store's projection is put in the account with the
conditional update and *that* row is remembered. Remembering the store's hash as the cloud's would hide a
lossy re-apply behind "same"; pushing makes both sides hold the page's normalized form. A merge is checked
against the account's limits before anything is written on either side.

**Other tabs.** Every module write stamps `written[tool][kind]` and `lastWrite` into `ivritSuite_syncMeta`,
and every page write the hook sees stamps `pageWrites[tool][kind]` and `lastWrite` with `source: 'page'` **at
once** (`stampPageWrite`, at most once per kind every 250 ms; local only), not only when the flush sends it 2 s
later, so no other tab works from a copy it does not know is older during that window; any
*other* open tab of that tool reads the stamps when the key's `storage` event arrives, when it becomes
visible and when it returns from the back-forward cache (`recheckWrites()` — a background tab on iOS may
never get the event). A **module-write** stamp (a download in the other tab) → `notifyPage` and a
re-hydration, so an in-memory copy never reverts the download — except when it arrives by the `storage` event in
a tab that has the focus (`recheckWrites(true)`; the teacher may be typing there) or whose page reports a live edit
(`editing()`, focus or not): for a tool that page renders
the kind is only marked stale and the stamp stays unread, so the tab re-reads it when it is shown again
(`visibilitychange`, `pageshow`), and an edit it flushes meanwhile is merged against its view (*This tab's
view*); a **page-write** stamp → that kind is marked **stale** in this tab only (its next flush hydrates before
diffing, and the hydration decides by this tab's view), because replacing a live setup or a board mid-edit with
another tab's write would be worse than a moment's staleness. A **hidden** tab already wrote what it had when it
was hidden (`finalFlushNow` on `visibilitychange`); while it stays hidden and holds such a stale mark for a tool,
the module never asks its page to write again (`staleWhileHidden`: no `flushPage` from a background hydration or
retry, no `finalFlush` when the background tab is closed), because its in-memory copy is the older one and would
undo the other tab's edit before it reached the account. And whenever a tab does write a kind it holds a stale mark
for (its own page's writer on `visibilitychange`, a typed edit, the last-chance flush), every row of that kind it saw
at an older version than the memory's is **remembered against that view** (`persistStaleView` → `rememberView`: the
memory takes this tab's seen hash with no stamp, and a settings row's base becomes this tab's view). The tab may close
before its corrective hydration runs (no network, end of the day); whichever tab compares the row next — tomorrow's
fresh one included — then reads the account's copy as the newer side: an unchanged older copy downloads it, a changed
settings row merges field by field against the view, an item keeps both and a class list merges. The sign-out path
uses the same `rememberView`. `hydrate()` coalesces: callers that ask while a hydration is queued share it, so a sign-in lists
each tool once. An account event for the user already listed — a token refresh, a refocus — hydrates nothing
(`listen()` keeps, per tool, the user an event last listed it for); a page that attaches after the first
event hydrates itself when a user is already known; a sign-in for a new user records each attached page's view
(`snapshotLocal`) and when this tab first saw that account (`signedInAt`); a sign-out forgets them all.

**Trees follow their items**: the shared tree component prunes nodes whose names are not in the store,
so a tree is never a row in the list. At the end of every hydration, on a fresh listing, each tree entry is
reconciled once all `follows` items exist on this device, by the classify rule read through the tree's own
sync memory: neither side moved → nothing; only the account moved → its tree lands here; only this device
moved → its tree goes up; both moved, or no memory yet → the page's pure `ftMergeTrees` (folders by name, an
item once, filed beats unfiled, this device's placement when both file it), and the merge goes up, so the
other device then reads "cloud changed" and takes it — one round, both hold the same tree. A flat local tree
takes the account's folders wholesale. The tail applies here too: what the store holds after the page's own
re-render is what is hashed and sent, never the merge itself. Write-through flushes a tree like one row
(hash against memory → conditional update or insert; a refusal → hydrate).

### The name step and the device-extras card

Two modal gates, both shown only after a sign-in, both failing soft offline; nothing else in the layer opens a
dialog.

**The name step** (`js/ivrit-account.js`). After a signed-in event for an account without a display name
(`needsName()`: `user_metadata.full_name` empty — `profiles.display_name` cannot be the flag, the trigger
always fills it from the email's local part), asked at most once per page load, only when
`navigator.onLine !== false`, after `DOMContentLoaded` (so a page's `init({ nameStep: false })` — `account.html`,
whose own name field is `required` — has run), and only after `c.auth.getUser()` succeeds (a metadata name it
returns is adopted silently). A small `ivacct-*` modal (`role="dialog"`, `aria-modal`, Tab wrap, no ✕, Escape
ignored): a `<label for>`-tied input (`maxlength=80`, `autocomplete=name`), a `role="status"` note,
**Continue** (`aria-disabled` until 1–80 trimmed characters; a locked press says why; Enter presses it) →
`setDisplayName` → outcome `'named'`, focus to the chip; a failure that is not the name's fault reveals
**Not now — ask again next time** → `'later'`; **Sign out instead** → the chip's own confirm
(`signOutConfirmText()`; Cancel leaves the step open), then `signOut()` and the reload (the ordinary button path —
the first hydration may already have downloaded rosters, so this removes them). `getUser()`
failing, offline, or a named account → `'none'`. The outcome reaches `onNameStep` listeners once per load;
Google users with a name never see the step. Strings `shared.account.card_name_*`.

**The device-extras card** (`js/ivrit-saves.js`, `openCard`). The first hydration for an account on this
device (`!hydrated[uid]`) lists every tool and collects the **extras**: local-only rows with no memory that
are `map`/`mapIn` items, fonts, or progress/streak rows (a previous user's work on a shared computer counts
too), minus seeds. Settings blobs and the suite-wide preferences are never asked about: the account's copy
wins when it has one, otherwise they upload silently — or, after *Remove*, only once changed. No extras → no
card, the mark is set. Otherwise, once the name step has settled (any outcome — the card waits for
`onNameStep`) and the DOM is ready, an overlay (`.ivsav-overlay` / `.ivsav-card`, `role="dialog"` +
`aria-modal`, Tab wrap, no ✕, no outside click, Escape ignored; the Font Maker's shortcut guards key on
`.ivsav-overlay`) lists per tool and kind counts (`shared.cloud.card_saves_kind`) and offers: **Add to my
account** (`cloudInsert` each; a same-named row keeps both), **Download a backup (.ivrit)** (`bundleFromRows`
over exactly the extras, `IvritSuite_device_saves_<date>.ivrit`, a `partial` AllTools file; the card stays
open and says how many items it wrote), **Remove from this device** (a `confirm`, then `localRemove` each —
fonts through the IndexedDB store — and the page notified; then every settings row and folder tree this device
holds is held back at its present hash in `ivritSuite_syncMeta2.noUpload[uid]`, which survives reloads: it goes
up only once it differs from that hash). After Add or Remove: `hydrated[uid] = now`, a fresh
listing, the deferred conflicts, merges and the Dashboard's same-name fold run (they were
`notifyPage(…, { pending: true })` meanwhile), and `ivritsuite:hydrated` fires with `first: true`. When it
closes the focus goes to the chip, or to the opener. A sign-out closes the card without an answer.

### The status line

`mountStatus(target, tool)` — or `attach({ status })` — renders `div.ivsav.ivsav-statusline[data-tool]` with one
`p.ivsav-status[role=status][aria-live=polite]` into the host: classes `ivsav-*`, one injected
`<style id="ivsav-style">`, palette vars with fallbacks, `body.dark` aware, logical properties, reduced-motion
neutraliser. Signed out: the invitation (`shared.cloud.signed_out`) and a **Sign in** button (opens the chip's
menu); loading: *Checking your account…*; offline / unavailable: the matching line. Signed in, one line per
state: `loading` (*Loading your account…*), `saving` (*Saving…*, set the moment a page writes), `saved`
(*Saved in your account · {when}* — *just now* after a flush, the newest `updated_at` after a hydration — or
*Nothing saved in your account yet*, plus the quiet font note), `error_row` (*Couldn't save "{name}": {why}*,
one per skipped row), `error` (*Couldn't save — will retry.* + the reason + a **Retry** button: hydrate, then
flush), `offline_pending` (*Offline — your changes are saved to your account when you are back online.*).
Below any of these, a tool whose
settings the account's copy replaced shows its note with **Download the earlier settings (.ivrit)** and **Dismiss**
(*The replaced copy*, above; the hub's line lists every tool's). Errors also go to the page's `showAppToast` when
it has one; nothing else toasts. Re-rendered on `I18n.ready` /
`I18n.onChange` and on every account change. The hosts are `#cloudSavesPanel` on the tool pages (the
Dictionary mounts into `#wlCloudPanel` inside its Word Lists manager on each render) and `#cloudStatus` in the
hub's AllTools modal; every heading over one reads "Your account". Public surface: `attach`, `mountStatus`,
`hydrate`, `flush`, `suspend`, `fontDeleted`, `needsReload`, `pendingSignOut`, `lastPlan`, `inventory`, `bundleAll`,
`forgetUser`, `errorText`, `local`, `cloud`, `registry`, `t`, `_test`.

### Write-through

The hook (`installHook`) wraps `Storage.prototype.setItem` and `removeItem` once, and only after the first
signed-in hydration (`armHook`); `hookOn` drops on any transition to no user, on `suspend()` and during a
sign-out's purge. Its contract: while `purging` (a button sign-out is removing the cache) a write to a
tool's registered key returns **without touching storage** — the pages' own `pagehide` writers must not re-create
what was just removed — while a suite-wide preference key (one only `Suite` entries name) is written as usual,
since a sign-out never removes it; otherwise the original runs first and its exception propagates unchanged (`writeText`
relies on `QuotaExceededError`), and only then, guarded, the module notes the write: for every registry entry
on that key (`entriesByKey`, which also maps each `SUITE_PREFS` field's key to the preferences row) whose tool
this tab has hydrated for the current user, `markDirty(tool, kind)` runs — the status line says *Saving…* and a 2 s timer (`FLUSH_DEBOUNCE_MS`) is (re)armed per tool. The module's own
writes are wrapped in `withSelfWrite` and never count.

`flush(tool)` (public; the timer, `pagehide`, `visibilitychange` → hidden, the end of a hydration and a
sign-out call it): a `paused()` page or a hydration in flight only postpones it; otherwise, through the
tool's queue, the page's `flush()` runs under the self-write guard, each dirty kind stamps `pageWrites` for
other tabs, a kind another tab marked stale hydrates before diffing, and then per kind (`flushKind`): every
local item (seeds skipped) is projected, guarded (`guardUpload`: size, name) and hashed against the memory —
no memory → nothing while *Remove from this device* holds it back at this very hash (`heldBack`; a different hash
releases it), else `cloudInsert` (a `legacy` hint with an id and `updated_at` → a conditional update of that old
row instead; `23505` → hydrate); equal hash → nothing; different, but the memory has moved past this tab's view
of the item (another tab synced it since) → no write, the tool is hydrated and `actionFor` decides (the newer
copy, a merge, or both); different → `cloudUpdateIf(memory.id, memory.u)` → `remember` (and the base of a
settings row, here and in this tab's view); a refusal (`changed`) → hydrate. Then **delete by absence, only for
names this tab saw present** (at attach / sign-in, its last hydration or flush; `seenNames[tool][kind]`): a remembered name no longer in the store →
`cloudRemoveIf(id, memory.u)` → `metaDelete`; a remembered name this tab never saw (another tab's item) →
hydrate instead, never a delete. Trees flush like one row (`flushTree`). A row error (too big, a bad name) is
named on the status line and the item stays, retried on its next change; a connection error keeps the kinds
dirty, sets `error` or `offline_pending`, and the `online` event, Retry or the next load resumes.
**The last chance**: `finalFlushNow` (on `pagehide` and when the page is hidden) runs each attached page's
`finalFlush()` — or its `flush()` when it has none — under the self-write guard, marks every non-virtual kind of
that page's hydrated tool dirty and flushes at once, so every kind is compared with the memory and sent if it
changed: the page's own `pagehide` writers may run after this listener, and a write made under the guard marks
nothing dirty.

Fonts go through the wrapped `saveUserFont` (one name, through the `Suite` queue) and `fontDeleted(name)`,
never through the key hook. `suspend()` (the hub's Erase All) turns the hook off, cancels the timers and drops
what was dirty. `pendingSignOut()` is a synchronous estimate for the sign-out confirm and the hub's Erase All — `unsynced`: rows the last plans
classified as local-only, local-changed or conflict, plus dirty kinds; `unknown`: this page could not compare
everything (a tool's queue still running, or an attached tool not hydrated for the current account).

### Sign-out and self-ending sessions

`removeAccountCache(uid, opts)` is registered with `IvritAccount.onSignOut` at boot and awaited (the account
module gives each hook 10 s) before the SDK call, while the token is still valid. The removal is decided per row
against the sync memory: only a row whose projected hash still equals what the account was last known to hold
leaves the device.

1. The card closes; the debounce timers are cancelled. `keepLocal` (account deletion): only the mark goes
   (`dropHydrated`; the account page then calls `forgetUser`, which drops the rest), the hook turns off, nothing
   else — the device keeps its copies as its own data.
2. Otherwise each attached page's `finalFlush()` (or `flush()`) runs under the self-write guard — no purging
   yet, so a class list being typed becomes device data — every hydrated kind is marked dirty and
   `flushAllNow()` sends the last edits, bounded at `SIGNOUT_FLUSH_MS` (6 s, inside the hook's 10 s: the account
   check, the removal and the broadcast follow it).
3. **The account check** (`accountAliveWithin(2500)`): a definite "gone" — the account was deleted on another
   device — removes nothing (the mark goes, the hook turns off, both copies stay: the device's are now the only
   ones); a timeout or a network failure counts as alive.
4. Then the hook is installed if it was not, `purging` starts (a page's writes to a tool's registered key are
   swallowed until the reload; a preference key is written as usual), and for every tool but `Suite`: each local
   item whose hash equals its memory's (**memory-confirmed**: the account is known to hold exactly this) is
   removed — `localRemove` for `map`/`mapIn` items; for a `single`/`scalar` row the key, unless a sibling entry
   shares it or the row has per-device fields (`omit`), in which case only the fields that travel are stripped
   (`localStripProjected`, which removes the key when nothing is left: the Dashboard's settings and its rosters
   share `hebrewDashboard_settings` and each side is decided on its own; the Torah Trainer, Trope Tutor and Flash
   Cards settings keep their per-device fields) — and its memory deleted; a tree goes when its hash matches.
   Rows with no memory, a differing hash, or a flush that did not finish **stay as this device's own data** and
   keep their memory, so a later sign-in reads them as changed here. The suite-wide preferences and My Fonts are
   never touched.
5. `hydrated[uid]` goes (`dropHydrated`), `signedOut: {uid, at, rows}` is written to `ivritSuite_syncMeta` (the
   broadcast; `rows` names what was removed, each with its hash, row id and `updated_at`, so a tab whose memory
   records this tab already deleted still recognises the same rows as the account's), the account module signs
   out and the chip or the name step reloads — unless `IvritSaves.needsReload()` is false: a page whose only
   attachment is `Suite` (the Font Maker, the account page) holds nothing in memory the removal could be undone
   by, and a reload there would cut off the Font Maker's asynchronous autosave. Such a page stays `purging` until
   the next sign-in.

**A tab following another tab's sign-out** — the broadcast's `storage` event (or `recheckWrites` on becoming
visible), within 120 s, not older than this tab's own session (`signedInAt`), in a tab that did not handle the
sign-out itself (`signOutHandled()`): the pages' `finalFlush()` / `flush()` write their in-memory state to
storage so the comparison sees it, but **nothing is sent** (that session is ending); each row is compared with
this device's memory or, where the first tab already deleted that record, with the row the broadcast names; a
row this tab changed stays and keeps (or gets back) its memory, so the next sign-in sends the change up instead
of replacing it with the account's copy; then the reload, where `needsReload()`. A tab whose view of a row is
older than that memory (another tab or device wrote it since this tab last read it) is judged against its own
view (`seenNames`): a copy equal to what it saw is the older one and goes like a synced row; a copy it changed
stays, remembered against that view with no stamp and with that view as the row's base, so the next sign-in
merges a settings row field by field (the other tab's newer fields and this tab's change both survive) and keeps
both copies of an item. The tab that pressed Sign out applies the same rule to a row its own flush did not
settle.

A **null transition with no broadcast** and no sign-out handled by this tab — an expired or revoked token, the
account deleted on another device — is a session that ended by itself: only the mark is dropped
(`dropHydrated`; **the memory stays**), the hook turns off, **nothing is removed and nothing reloads**; the device
keeps its copies until Erase All. A page load with no stored session drops every account's mark the same way
(the device was signed out since). The next sign-in is therefore a first hydration: the device's own new items
go on the card, a remembered item absent here is downloaded (never deleted from the account), and an edit made
since — one that did not reach the account before the session ended, or one made signed out — reads as changed
here (`local-changed`) and goes up instead of being replaced by the account's older copy — a settings row as
the merged value, an **item by keeping both** (the device's copy under its name, the account's as "{name} (from
another device)"), a class list, word list, student profile or progress by its lossless merge, because a copy changed while the device was its own may be an older `.ivrit` restored then, and
the account's newer copy must not be overwritten by it. The account-gone guard (above) ends the same way, through
`signOut({ keepLocal: true })`.

**A reset or an item delete on a syncing page is a write like any other** and reaches the account, and every
other signed-in device at its next load. While a session is stored (`IvritAccount.hasStoredSession()`) its
confirm names the account-wide effect (`torah.confirm.reset_all_cloud`, `trope.confirm.reset_all_cloud`,
`trope.confirm.reset_progress_cloud`, the `*_delete_confirm_cloud` keys of presets, schedules, classes,
favorites, word lists and student profiles, `worksheet.lastsetup.start_fresh_title_cloud`). Some resets
need more than a write: the Trope Tutor's progress reset stamps `resetAt` (the registry's `watermark`) so the
lossless merge cannot bring older mastery back; and a reset never removes a `single` row's key — a row gone from
the account would be re-inserted by another device's copy, while a written value travels as the newer one — so
the generator's *Start fresh* writes a pristine marker `{ v: 1, pristine: true }` and the Torah Trainer's and the
Trope Tutor's *Reset all settings* write the defaults. `lastPlan(tool)` returns the last classification for a tool without
recomputing it (the dashboard's same-name fold reads a row's state from it).

**Checking it from the browser**: `saves-test.html` § 2 runs the local backend signed out (every other key
byte-identical, no sync memory), § 3 mounts the real status line (`hydrate: false`), § 4 the pure checks
(canonical hash vector, the state table, the hydration-action table, merges — the reset watermark included —
omit, `safeParse`, guards, error mapping), § 5 the scripted cloud run against the real project through
`_test.hydrate` / `_test.flush` (no other tool listed, no card, no hook; its cleanup wipes what it wrote).
`scripts/smoke-saves.mjs` runs § 2 and § 4 headless with the CDN blocked, a fake session with the API
unreachable (the status line fails soft), and Hebrew + dark at 800 px.

### Implemented on

| Page | Registry rows (`kind` · shape/merge · key) | Hooks passed to `attach()` | Status host |
|---|---|---|---|
| `trope_tutor.html` (`TropeTutor`) | `progress` single/deepMax, `watermark: 'resetAt'` `hebrewTropeTutor_progress` · `settings` single/assign (omit `panelsCollapsed`, a retired field older blobs still carry) `hebrewTropeTutor_settings` | `status`; `flush: saveSettingsFlush`; `onLocalChanged` resets `settings` / `progress` to their DEFAULTS clone, re-loads (`loadProgress` keeps `resetAt`), re-applies the Hebrew size and font, re-syncs the Settings controls and the drill selects, re-renders Learn (under `_i18nRerender`; the staffs follow a downloaded `melody`, `tuneShift`, `tuneVoice` and `noteNames`) and the drill line. `resetProgress()` writes `PROGRESS_DEFAULTS` plus `resetAt = Date.now()` (the hub's `tropeProgressMerge` and the `.ivrit` apply carry the newest watermark), `resetAllSettings()` writes the `DEFAULTS` clone (a pending debounced save cancelled first) instead of removing the key — both writes like any other, each with a `_cloud` confirm | the Settings tab's *Your account* group (`#setCloud`, heading `trope.settings.panel_cloud`, hosting `#cloudSavesPanel`) between *Progress* and *About* |
| `torah_trainer.html` (`TorahTrainer`) | `settings` single/assign (omit `*Collapsed`, `lastPos`, `loopVerse` — the reading position carries a timestamp on every scroll and would keep the row "newer" forever; the cross-device memory of *what* to read is a favorite row, the scroll position stays per device) `hebrewTorahTrainer_settings` · `favorite` map/item `hebrewTorahTrainer_favorites` (one row per saved reading, label `shared.cloud.kind_favorite`; a value is `{v, ref, color, ts, settings?}`, replaced whole) · `favoriteFolders` tree/page follows `favorite` `hebrewTorahTrainer_favoritesFolders` | `status`; `flush: saveSettingsFlush` (a no-op during a handout print, by design; during a practice link's view it stores the reader's own display values, through `storedSettings()`); `paused: () => _handoutActive` (a handout print's override is not the teacher's settings); `merges: { favoriteFolders: ftMergeTrees }` (the shared block's pure merge); `onLocalChanged(kind)`: `favorite` / `favoriteFolders` → `renderFavorites()` only (the list re-reads its own keys), anything else → `cloudReread()` — the `resetAllSettings()` sequence on a fresh DEFAULTS clone plus `syncParshaSelect()` and `fetchAndRender()`, ending a practice link's view first — deferred while a handout print is up (`_pendingCloudReread`). Deleting a favorite and `resetAllSettings()` (which leaves the favorites keys alone and writes the defaults through `storedSettings()` instead of removing the key — not while a handout print is up) are writes like any other, each with a `_cloud` confirm | the settings drawer's More tab, *Your account* section (`torah.settings.panel_cloud`, `#cloudSavesPanel`) above *About & FAQ* and *Reset* |
| `flash_cards.html` (`FlashCards`) | `preset` map/item `hebrewFlashCards_presets` · `presetFolders` tree/page follows `preset` · `settings` single/assign `hebrewFlashCards_settings` omitting `audioEnabled`, `ttsRate`, `hideHomeBtn`, `sheetDuplex` (the four fields the machine decides, not the lesson: speakers, voice speed, a kiosk's hidden home button, a printer's two sides; `listening` still travels, since a browser without speech only gates the toggle, and the `.ivrit` backup still carries all four) · `pbStreak` scalar/max · `profile` mapIn (`path: profiles`, envelope `{activeProfile: null}`, one row per student) merge page · `profileFolders` tree/page follows `profile` | `status`; `flush: saveSettings`; `alsoPull: ['Dictionary']` (the `?wl=` link and the picker read word lists here); no `paused` — `saveSettings` already no-ops under a ladder or a shared drill, and a student's results written mid-ladder must go up; `merges`: the two trees through the shared pure `ftMergeTrees`, `profile` through the pure `mergeProfileEntry` that `mergeProfilesBlob` (the `.ivrit` import) also calls — results unioned by `savedAt`, newest 50 kept, ladder best-of; `onLocalChanged`: `wordList` ignored (read on demand), presets/folders → `renderPresets()`, profiles/folders → `renderProfiles()`, streak → `loadPbStreak()` + `updateStatsBar()`, settings → `loadSettings()` then `saveSettings()` (the inner saves of `applySettings` write a partial blob; the whole one must be in the store before the module's tail compares), or — while a Learner Ladder level runs — the new blob replaces `_ladderActive.snapshot` so `_ladderExit()` restores it instead of the pre-ladder state, and while a `?s=` link's drill runs (`_sharedDrill`, which like the ladder makes `saveSettings` a no-op) nothing is applied until the setup screen loads the store again. The page round-trips what it cannot show: `saveSettings` writes `getSettings()` over the stored blob, so a field this build does not know (a newer build wrote it, here or on another device) is kept; the listening preference stays stored on a browser without speech (only the toggle is gated), a font name this device lacks stays chosen (no face highlighted, `shared.fonts.missing_note` once My Fonts has answered), and word lists travel by id with their names kept verbatim while the selection is unchanged. Deleting or merging a profile and deleting a preset carry `_cloud` confirms | Advanced Settings, a *Your account* sub-section (`flashcards.advanced.cloud_head`, `#cloudSavesPanel`) after Backup Presets |
| `hebrew_blend_generator.html` (`Worksheet`) | `preset` map/item `hebrewBlender_presets` · `presetFolders` tree/page follows `preset` · `lastState` single/assign `hebrewBlender_lastState` (the remembered setup the page restores on load) | `status`; `flush: rememberSetup` (the setup is read off the live controls); `merges`: the tree through the shared pure `ftMergeTrees`; `alsoPull: ['Dictionary']` (word lists for `?wl=` and the Real Words picker; *⭑ Save as Word List* writes one into that store, and it goes up with this page's hooks); `paused: () => _answerKeyView` (the answer-key view has no setup of its own to send); `onLocalChanged`: `wordList` ignored, `lastState` → `restoreLastSetup()` unless `_answerKeyView` or `_urlSetupActive` (a `?s=` / `?wl=` link's setup stays; the re-apply runs under `_lastSetupRestoring`, and the next Generate uses the controls), else `renderPresets()`. A link's setup is not the teacher's own: while the controls still equal it as it arrived (`_urlSetupText`), `rememberSetup` writes nothing — not on Generate, `pagehide` or the module's flush — so an opened link is neither remembered nor sent until a control changes. `startFreshSetup()` writes the pristine marker while signed in (`worksheet.lastsetup.start_fresh_title_cloud`) | Advanced, a nested *Your account* sub-panel (`worksheet.advanced.cloud_title`, `#cloudSavesPanel`) right after Backup Presets |
| `hebrew_dictionary.html` (`Dictionary`) | `wordList` mapIn (`path: lists`, `nameField: name`, envelope `{v: 1}`, one row per list) merge page `ivritSuite_wordLists` — the page's small display prefs stay per device | `merges.wordList` = the pure, **uncapped** `mergeWordList` (words unioned by their `word` string, mine first; a cap would silently drop the other side's words, so a merged list may exceed 200 until words are removed); `onLocalChanged` re-renders the manager when it is showing; no `flush` (lists are written synchronously); no `status` in `attach` — `wlRenderManagerInto` calls `mountStatus(host, 'Dictionary')` into `#wlCloudPanel` on every render of the Word Lists manager. The generator's *⭑ Save as Word List* writes one new list into this store, which goes up from that page. The page's last-search replay (`hebrewDictionary_lastState`, per device) defers to the stored emoji settings for the emoji mode, gender and excluded categories (`_dictWithStoredEmoji`): a per-device snapshot must not put an older copy back over the synced preference — a `?s=` link keeps its own. Deleting a word list carries a `_cloud` confirm | inside the Word Lists manager (`#wlCloudPanel`) |
| `classroom_dashboard.html` (`Dashboard`) | `preset` map/item `hebrewDashboard_presets` (`skipUpload`: the untouched "Default" seed, `DASHBOARD_DEFAULT_PRESET_CANON`) · `presetFolders` tree/page follows `preset` · `schedule` map/item `hebrewDashboard_schedules` (a value is either a v2 weekly grid or a legacy day array; replaced whole) · `scheduleFolders` tree/page follows `schedule` · `settings` single/assign `hebrewDashboard_settings` omitting `rosters`, `activeRosterId`, `pickerSessions`, `_geoCoords`, `*Collapsed`, `panelLayout`, `videoLayout`, `zoomLevel`, `hideZoomBar`, `keepAwake`, `lockPanelWidths`, `showTextSizeOptions` · `roster` mapIn over the **same key** (`path: rosters`, `nameField: name`, one row per class; `skipUpload`: the untouched empty default class) merge page — two entries on one key work because the settings row omits what the roster rows carry | `status`; `flush`: `flushRosterIfTyping()` + a non-exiting commit of the in-place editor (`syncActive()`) + `saveSettingsToStorage()` (synchronous; it reads the board text off the editor) — the module calls it at every hydration and before every write-through, so it never throws a teacher out of an edit; `finalFlush`: `exitInPlaceEdit(true)` + the same, on `pagehide` and sign-out only; `merges`: the two trees through the shared pure `ftMergeTrees`, `roster` through the pure `mergeRoster` (names unioned, mine first, no cap; the name stays mine unless it is the default — and the page's own re-parse of a class, the drawer's commit and a backup restore, keeps whatever the class already holds beyond the picker's cap, so a merged or restored list is never cut back to it: `parseRoster(str, keep)`); `onLocalChanged(kind, name, names, { pending })`: presets → `loadPresets()` + `renderPresets()`, schedules → `loadSchedulesStorage()` + `renderSavedSchedules()`, roster → `loadSettingsFromStorage()`, `foldSameNamedClass` for each landed name unless `pending`, `ensureActiveClass()`, `normalizePickerSession()`, the class manager and the student picker re-rendered, `adoptClassFromAccount()`, `checkSchedule()`; settings → the in-memory object replaced outright (every own key deleted, `PRISTINE_DEFAULTS` back, the stored blob on top) then the `IVRIT_CFG.apply` tail (`applySettings` on a clone, the three render caches nulled, week summary / schedule UI / editor re-rendered, the weather and Shabbat times refetched when `location` changed). `deleteClass` carries a `_cloud` confirm. A Merge of a `.ivrit` file never swaps the class-list map: a settings blob's `rosters` are merged by id with the file's class lists, and this device's pick sessions and active class stay (only a Replace swaps them). The first-run card: `isFirstVisit` is captured at `DOMContentLoaded`; with a stored session `openFirstRun()` waits for a one-shot `ivritsuite:hydrated` naming `Dashboard` and opens only if no `settings` row landed and the last listing (`IvritSaves.lastPlan('Dashboard')`) shows none in the account; the 10 s fallback waits while the device-extras card is open, then asks the same | the settings drawer's More tab, a *Your account* section (`dashboard.settings.cloud_head`, `#cloudSavesPanel`) between *Backup* (the `.ivrit` file) and *About & FAQ* |
| `index.html` (the hub; no rows of its own) | — | **one** `attach({ tool: 'Suite', status: '#cloudStatus', alsoPull: [the six tools], merges: { presetFolders, profileFolders, scheduleFolders, favoriteFolders: ftMergeTrees }, onLocalChanged })` — nothing on the hub holds a tool's state in memory, so every shape may land here (the place to bring a fresh browser up to date); `onLocalChanged` = `renderIvritInventory()` (the "This file will contain:" counts read storage) plus, for `font`, `refreshFontsBackupCache()` + `renderMyFontsManager()`; a profile or word list changed in both places is left for the tool that owns that merge. `deleteMyFontFile` calls `IvritSaves.fontDeleted(name)` while a session is stored (its confirm then says the font leaves the account, `home.alltools.myfonts.remove_confirm_cloud`); a Merge import or paste of a dashboard settings blob merges its class lists by id (`dashboardSettingsSplit` → `mergeDashboardRosters`; this device's pick sessions and active class stay), only a Replace swaps the blob; `tropeProgressMerge` drops a side whose `resetAt` is older than the newest; Erase All calls `suspend()` first (*Storage keys* above); its `ivritAskMode` carries the same signed-in Merge-only rule as the three tool carriers | the AllTools modal's *Your account* block (`#cloudSavesSection`: an `h4` `home.alltools.cloud.title`, `#cloudStatus`, a note linking `account.html`) between *My Fonts* and *Erase* |

**`Hebrew_Font_Maker.html`** has no registry rows: its projects are `font_projects` rows plus Storage objects,
through `js/ivrit-projects.js` — see *Font Maker projects* below. It loads the same three scripts plus that
module and calls `IvritSaves.attach({ tool: 'Suite' })` in its boot wiring, so the suite-wide preferences (the
author name among them) and My Fonts hydrate there too (no status host; its `ivritsuite:fonts` listener
re-lists My Fonts, and an `ivritsuite:prefs` listener follows a downloaded theme); its remove-font modal calls
`IvritSaves.fontDeleted(name)` while a session is stored (the modal then says the font leaves the account,
`fontmaker.modals.remove_font_body_cloud`), and its shortcut guards return early while a `.ivsav-overlay` (the
device-extras card) is open. The chip, the name step and the sign-out removal work there because the saves
module listens at boot. A sign-out in this tab also runs the page's own hook (`fmBeforeSignOut`, registered on
`IvritAccount.onSignOut`): the local snapshot finishes, and a cloud project with changes the account has not
received is saved to it — not on a `keepLocal` sign-out (the account is gone or going), nor offline. The page is not
reloaded afterwards (`IvritSaves.needsReload()` is false here), so the open project stays; a snapshot whose
account copy was not clean resumes its cloud save after *Continue where you left off*
(`docs/reference/font-maker.md` → Cloud projects).

`scripts/smoke-tools.mjs` loads every page in this table with the CDN blocked and proves: 0 `pageerror`, the
chip beside the language switcher, the status host holding the module's sign-in line,
`IvritSaves.local.list(tool)` returning exactly the seeded items, no overlay opening by itself, and a
localStorage dump byte-identical to a control run with the three account scripts blocked; then a remembered
session with the API unreachable (the status line fails soft, no name step and no card), and Hebrew + dark at
800 px.

## Font Maker projects (`js/ivrit-projects.js`)

A project is one `font_projects` row (the catalogue entry: name, family, style, schema version, letters
done, sizes, the current `project_path`, the latest `export_path`, `client_saved_at`) plus objects under
`<user id>/<project id>/` in three buckets: `font-projects/…/project-<rev>.json.gz` (the packed project),
`font-sources/…/<sha256-16hex>.<jpg|png|webp>` (one object per distinct photo, original bytes and type —
the maintainer chose full size over shrinking; a photo-heavy project is 20–40 MB, so sizes are shown in
the Load menu and on the account page, and the free plan's 1 GB / 5 GB egress a month is the budget),
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
| `count()` / `onChange(fn)` | the project count, `{n, bytes}`; a callback after every write |
| `refresh()` | drops the 30 s memo so the next `list()` re-fetches |
| `projectFile(id)` | the packed cloud copy for the account page's download-everything zip |
| `errorCode(err)` | the raw error → the code vocabulary below |
| `limits` | `{gz, source, export, projects}` — the same numbers the size guards use, so a page states them without hardcoding |

Errors reject with a code `IvritSaves.errorText` knows: Storage's shapes are normalised (`file_too_big`
413, `bad_type` 415, `not_found` 404) and the cap's `23514` becomes `project_limit`. Rule 2 names this
module as the fourth and last file that talks to Supabase.

## The account page and data rights (`account.html`)

The page an account-holder reaches from the chip's **Account…** item, the hub's account block and the privacy
policy. It is a plain root page (own CSP, in the sitemap, precached) whose script only renders, asks and packs;
every cloud call goes through the three modules. It calls `IvritAccount.init({ nameStep: false })` (its own
name field is `required`, so the modal step never doubles it) and `IvritSaves.attach({ tool: 'Suite' })` (the
preferences and My Fonts hydrate here like everywhere; no status host; an `ivritsuite:prefs` listener follows a
downloaded theme). A sign-out from the chip here does not reload the page (`IvritSaves.needsReload()` is false on a
page that attaches only `Suite`): the page's own account listener shows the signed-out tile. Four tiles, shown only while signed in
(signed out: one line and a Sign in button that opens the chip's menu; offline or with the SDK blocked: one
line, nothing else):

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
  Import / Export modal restores it, merging — and while signed in there, the merge writes through and refills
  the account), `<date>` being the teacher's local date as in the zip's own name; and per project
  `font-projects/<name>/<stem>.hebrewfont` from `IvritProjects.projectFile()` (the stem keeps the name's ASCII
  letters, digits, `.` and `-`, else `font`; the folder keeps the name, minus a trailing dot or space, with `_`
  before a Windows device name such as `CON` or `COM1`, and numbered `-2`, `-3`… when another folder already
  has it in any letter case, because Windows and macOS disks ignore case) — the cloud copy with its photos put
  back where the page took them out (a generic walk over the `cloud:` strings the packed manifest names, photos
  downloaded three at a time, a failed one left empty and counted) — next to the exported font when one is
  kept. Progress goes to the status line (project i of n, photo j of m); the done line names what could not be
  downloaded, photos and exported fonts counted apart; the button is disabled while the account holds nothing.
- **Delete my account** — two steps. First the **backup offer** (`#delBefore`, `account.delete.before_*`):
  **Download everything (.zip)** (the same `downloadAll`, its progress on the box's own `role="status"` line),
  **Continue without downloading** and **Cancel**. Its buttons follow the listing: while it loads both wait
  (`account.holds.checking`); an empty account disables Download and says so (`before_empty`); a failed listing
  enables both and says the count is unknown (`before_unknown`). Continue opens the **confirmation**
  (`#delConfirm`, "Are you sure? This cannot be undone."): a ticked checkbox ("I have downloaded everything I
  want to keep, or I do not need it") and the account's email address typed (the field's label names it;
  compared case-insensitively); the red button stays `aria-disabled` until both hold, and a press while it is
  locked says what is still missing on the box's status line. Escape or Cancel in either box returns to the
  **Delete my account…** button. Then `IvritAccount.deleteAccount()` calls the `delete-account` Edge Function
  (`db/functions/delete-account/index.ts`): the platform's JWT check runs first, the function asks Auth who the
  token belongs to, removes every object under `<uid>/` in the three buckets (paged, subfolders included), then
  `auth.admin.deleteUser(uid)` — the `profiles`, `saves` and `font_projects` rows cascade. It answers only the
  site's own origins (CORS) and returns the counts. Back in the page: the module signs this device out with
  `keepLocal` (the sign-out call itself may 401 — the session is already dead — which is ignored),
  `IvritSaves.forgetUser(uid)` drops everything this device kept for that account — the sync memory, the
  `legacy` hint, the hydrated mark, the held-back rows, the settings bases and any replaced copy — and the
  "deleted" tile shows the counts. Nothing stored on any device is touched: this device keeps its copies as its
  own data, `.ivrit` and `.hebrewfont` files stay, and another signed-in device's session ends by itself at its
  next load — which removes nothing there either. A failed call leaves the confirmation open with one error line
  and the session intact.

The download is offered before a deletion but not forced (a photo project can be tens of megabytes, and a
failed forced download would block the deletion); the checkbox states the choice instead. The privacy
policy's section 5 names the page as the way to see, download and delete everything (EN + HE, accounts rule 8).

`node scripts/smoke-account-page.mjs --sdk <supabase.js>` replays all of it against a fake cloud — the two-step
deletion included — and parses the zip in Node (the CRC of every entry, the bundle's keys, the `.hebrewfont`'s
photos byte for byte).

## Manual Supabase setup (done once in the dashboard)

The step-by-step walkthrough lives in `README.md` § "Accounts (optional, Supabase)": URL configuration
and redirect allow-list (`https://ivritsuite.com/**`, `http://localhost:8080/**`), Email provider + the
two email templates (*Confirm signup* and *Magic Link*), both the text of `db/email-templates/sign-in-code.html`
(the code, and a link that fills it in — never `{{ .ConfirmationURL }}`; `db/README.md` says how to paste and
check it), Google OAuth
client and callback, and the custom SMTP provider that is **required before anyone but the project's
team members can receive a sign-in email** (the built-in sender refuses other addresses and allows only
a few messages per hour).

## Operations

Everything in the plan is built. Keeping the free project awake (`.github/workflows/supabase-keepalive.yml` and
migration 0003), the before-other-people-sign-in checklist, rotating the publishable key, upgrading the SDK,
restoring a person's data from their zip and where to look when something fails are in the README's *Keeping it
running*; the plain-language map of what talks to what is `docs/backend-architecture.md`.
