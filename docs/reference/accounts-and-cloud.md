# Accounts & cloud saves (Supabase) — reference

> Binding rules live in `CLAUDE.md`; this file is how the account layer works. Keep it free of session ids, dates and digests.

## What exists

Accounts are **optional and additive**. Anonymous use, localStorage, `.ivrit` files and JSON import are
untouched; the cloud is a third place to keep copies. Two shared files own every line that talks to
Supabase — no tool page ever calls the SDK directly:

| File | Role |
|---|---|
| `js/supabase-config.js` | Public project values: `url`, publishable `anonKey`, the pinned SDK URL + its Subresource Integrity hash, and the `enabled` kill switch. The only file that changes when the project changes. |
| `js/ivrit-account.js` | `window.IvritAccount` — session state, sign-in/out, lazy SDK loading, the header chip. |
| `js/ivrit-saves.js` | `window.IvritSaves` — the saves adapter: `IVRIT_SYNC_REGISTRY`, the local and cloud backends, the per-item state table, the cloud-saves panel. |
| `account-test.html` | Throwaway harness (own CSP, `noindex`, not in the sitemap/`llms.txt`/`sw.js`, skipped by `check-i18n`). Mounts the real chip, mirrors state, runs the URL self-checks and the Phase 2 table/bucket checks. |
| `saves-test.html` | Same rules. Mounts the real panel with four page-only registry entries, runs the local round trip, the pure self-checks and the scripted cloud checks. |
| `scripts/smoke-account.mjs`, `scripts/smoke-saves.mjs` | Headless Playwright smokes: anonymous with the CDN blocked, remembered session offline, SDK served locally, URL contracts, Hebrew + dark at 800 px. |

Load order on a page (all deferred, so `window.I18n` and `window.IVRIT_SUPABASE` exist when the module runs):
```html
<script src="/js/i18n.js" defer></script>
<script src="/js/supabase-config.js" defer></script>
<script src="/js/ivrit-account.js" defer></script>
<script src="/js/ivrit-saves.js" defer></script>
```
All three `js/` files are in `sw.js` `CORE_ASSETS` (network-first like every same-origin script), so editing
any of them bumps `VERSION`. A page that only offers sign-in leaves the fourth line out.

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
| `openMenu()` | Opens the chip's menu (`false` when no chip is mounted) — what the saves panel's own Sign in button calls |
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
carries progress and errors. Signed in: "Signed in as {email}", "Cloud saves…" (when registered), "Sign
out (this device)". Keyboard: Enter/Space/click toggle, ↓ opens, focus lands on the first control,
Tab/Shift+Tab wrap inside, ↓/↑ move between controls (not inside text fields), Escape closes and returns
focus to the button, an outside click closes without moving focus. One injected `<style id="ivacct-style">`,
classes `ivacct-*`, logical properties, palette vars with fallbacks, `body.dark` / `html.dark-early`
aware, transitions neutralized under `prefers-reduced-motion`. Sized to match the language switcher
(30 px min-height, `align-self: stretch`). Labels are `shared.account.*` keys and re-render on
`I18n.ready` / `I18n.onChange`.

## Storage keys the account layer touches (all exempt from AllTools export/import)

| Key | Written by | Notes |
|---|---|---|
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token` | the SDK | the session; erase-only (Erase All = signed out on this device) |
| `sb-hhkmqwpjsyxdeuhvcyis-auth-token-code-verifier` | the SDK | transient, only during a PKCE round trip |
| `ivritSuite_accountCache` | the module | `{email, name}` for the loading/offline chip; erase-only |
| `ivritSuite_syncMeta` | `js/ivrit-saves.js` | what this device last synced, per account: `{v:1, users:{[uid]:{[tool]:{[kind]:{[name]:{h, id, u, at}}}}}}`; erase-only, never exported |

The hub's `eraseAllSettings` registers these when it adopts the module (Phase 4); until then they are
consciously unregistered.

## CSP origins a page needs to offer accounts

`script-src` += `https://cdn.jsdelivr.net` (the SDK), `connect-src` += `https://hhkmqwpjsyxdeuhvcyis.supabase.co`
(Auth, PostgREST, Storage all live on that host). Nothing else: no `img-src` (avatars are initials),
no `frame-src`, no `wss:` (Realtime is not used). The test harness carries exactly these.

## Database, buckets and policies (Phase 2)

The SQL lives in `db/migrations/` (one file per change, applied in order; `db/README.md` explains how to
apply one and why the folder is not `supabase/`). Everything a browser can reach is guarded by Row Level
Security: every policy is `to authenticated` and compares `(select auth.uid())` with the row's owner, so
the publishable key alone reads nothing and no account can see another account's rows or files.

| Table | One row per | Caps | Notes |
|---|---|---|---|
| `profiles` | account | — | `display_name` (≤ 80) filled by the `handle_new_user` trigger from Google's name or the email's local part; the client may read and update its own row only; rows are created by the trigger and removed by the cascade from `auth.users` |
| `saves` | saved item | `data` ≤ 2 MB; 2000 rows per account | `(user_id, tool, kind, name)` is unique, so the client upserts on it; `user_id` defaults to `auth.uid()` and is never sent; `bytes` and `updated_at` are set by a trigger (`updated_at` is the only ordering signal, `client_updated_at` is display-only); `tool` ∈ Suite / Worksheet / FlashCards / Dictionary / TorahTrainer / TropeTutor / Dashboard; `kind` matches `^[A-Za-z]{1,32}$`; `name` 1–120 chars |
| `font_projects` | cloud Font Maker project | 25 per account | catalogue row for a project whose gzipped JSON, downscaled images and exports live in Storage; `project_path` / `export_path` must start with the owner's id |

Limits come back as Postgres `check_violation` (`23514`) with a readable message; a duplicate name is
`23505`; anything RLS refuses is `42501`. The saves adapter maps these to the panel's strings (`errorText`).

**Buckets** (all private): `font-projects` (20 MB, gzip), `font-exports` (5 MB, ttf / woff2 / zip),
`font-sources` (2 MB, jpeg / png). Every object path is `<user id>/<project id>/<file>`, and the four
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
per localStorage key: `{ tool, kind, lsKey, shape, path?, nameField?, envelope?, merge, omit?, follows?, ivritKey?, label? }`.

| Field | Meaning |
|---|---|
| `shape` | `map` (`{name: value}` → one row per name), `mapIn` (`{…, [path]: {key: value}}` → one row per key; label from `value[nameField]`; `envelope` = the other top-level fields, e.g. `{v:1}`), `single` (one settings object → one row named `default`), `tree` (`{v:1, root:[…]}` → `default`, synced after `follows`), `scalar` (a plain string → `default`, travelling as `{value}`) |
| `merge` | how a downloaded copy lands on a differing local one: `item` (replace that item), `assign` (cloud fields over a copy of local — the `.ivrit` Merge teachers know; also the "Use cloud copy" button), `deepMax` (lossless: numbers max, booleans or, objects recurse, arrays keep local), `max` (scalar), `page` (the page's pure `merges[kind](local, cloud) → merged`) |
| `omit` | field names (a trailing/leading `*` glob allowed) that never travel: stripped before hashing and upload, this device's values put back after a download, cloud values of them dropped |
| `follows` | trees only: the kind whose items the tree names |
| `ivritKey` | the AllTools bundle key, so *Download file* writes an `.ivrit` the hub imports (else `tool` + `data:{[kind]: …}`) |
| `label` | an i18n key for the kind (falls back to the raw kind) |

`attach({ tool, panel, title?, entries?, merges?, flush?, onLocalChanged?, open? })` is the whole per-page
surface: `entries` is for harnesses (real tools list theirs in the registry), `merges` supplies the
`page` helpers, `flush()` must cancel any debounced writer and write now, `onLocalChanged(kind, name)`
must re-read that key into memory and re-render, `open` is registered with `IvritAccount.onOpenSaves`,
`title: false` drops the panel's own title (the page's panel heading is the heading) and an i18n key
replaces it (the hub names each panel after its tool).
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

Conflict buttons: `item` → **Keep both** (the cloud version is written here as `name (cloud copy)`, read
back, then the local `name` goes over the cloud row, then the copy goes up — one click, nothing lost,
converges), *Use cloud copy*, *Keep mine*; `assign` → *Use cloud copy*, *Keep mine*; the rest → *Merge*.
A `page` merge whose helper the current page did not supply (the hub) shows no button at all: the row
stays listed as *Changed in both places* and the tool that owns the merge resolves it.
Cloud writes to an existing row are **conditional** (`update … eq('updated_at', listed)`): zero rows back
means another device wrote first, the list is refreshed and the person chooses again. New rows are
`insert`s (`23505` = created meanwhile). **Sync now** runs every safe action in order, stops at the first
error (re-running resumes) and leaves conflicts listed — except rows the client-side guard refuses (too
big, an impossible name), which are skipped, counted and reported so one oversized item cannot block a
sync forever. Nothing runs on a timer. Before any local write the module calls `flush()`, after it
`onLocalChanged()`, and downloads add the "reload other tabs" hint. Two more guards against a page's
in-memory copy: a listing calls `flush()` first when signed in (a pending debounced write would otherwise
land between the listing and the first action and fail it as "changed"), and every module write stamps
`lastWrite` into `ivritSuite_syncMeta`, whose `storage` event makes any *other* open tab of that tool
re-read the key and list again (its next save would otherwise revert the download unseen). `refresh()`
coalesces: callers that ask while a listing is queued share it, so sign-in lists each tool once.

**Trees follow their items**: the shared tree component prunes nodes whose names are not in the store,
and `ftImportTree` is additive, so a tree is never a row. After actions and after Sync, each tree entry
is reconciled once all `follows` items exist on this device: a flat local tree takes the cloud's folders
wholesale, two real trees go through the page's helper, and the result lands on whichever side differs.
Preset downloaded one at a time may land at the root of the folder list; *Sync now* keeps the folders.

### The panel

`mountPanel(target, tool)` or `attach({ panel })`: classes `ivsav-*`, one injected `<style id="ivsav-style">`,
palette vars with fallbacks, `body.dark` aware, logical properties, reduced-motion neutraliser. Signed out:
one line + a Sign in button (opens the chip's menu). Offline / unavailable: the matching line. Signed in:
title, *Refresh*, *Sync now (n)*, an `aria-live="polite"` status line, then one list — a row per kind + name
across both sides, grouped by kind — with the plain-words state, size, the cloud `updated_at`, and the
buttons the state allows; cloud rows also get *Download file* and *Delete from cloud* (`confirm()`; the
local copy stays). No Rename (a preset rename would orphan its folder-tree node; `mapIn` names are ids).
All cloud work runs through one per-tool promise queue; buttons are `aria-disabled` meanwhile;
`showAppToast` is used when the page has it. Strings `shared.cloud.*`, re-rendered on `I18n.ready` /
`I18n.onChange`. Public surface: `attach`, `mountPanel`, `refresh`, `plan`, `syncNow`, `act(tool, action, row)`,
`local`, `cloud`, `registry`, `t`, `_test`.

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
| `trope_tutor.html` (`TropeTutor`) | `progress` single/deepMax `hebrewTropeTutor_progress` · `settings` single/assign (omit `panelsCollapsed`) `hebrewTropeTutor_settings` | `flush: saveSettingsFlush`; `onLocalChanged` resets `settings` / `progress` to their DEFAULTS clone, re-loads, re-applies font and drawer memory, re-renders Learn (under `_i18nRerender`) and the drill line — the `resetAllSettings()` / `resetProgress()` sequence | settings drawer, its own collapsible panel (`trope.settings.panel_cloud`) between *Progress* and *About*, `title: false` |
| `torah_trainer.html` (`TorahTrainer`) | `settings` single/assign (omit `*Collapsed`, `lastPos`, `loopVerse` — the reading position carries a timestamp on every scroll and would keep the row "newer" forever; a cross-device bookmark is a later row of its own) `hebrewTorahTrainer_settings` | `flush: saveSettingsFlush` (a no-op during a handout print, by design); `onLocalChanged` = the `resetAllSettings()` sequence on a fresh DEFAULTS clone plus `syncParshaSelect()` and `fetchAndRender()` | settings drawer, its own panel (`torah.settings.panel_cloud`) just above *Reset*; `open` = `openSettingsAtPanel('cloud')` |
| `flash_cards.html` (`FlashCards`) | `preset` map/item `hebrewFlashCards_presets` · `presetFolders` tree/page follows `preset` · `settings` single/assign `hebrewFlashCards_settings` · `pbStreak` scalar/max · `profile` mapIn (`path: profiles`, envelope `{activeProfile: null}`, one row per student) merge page · `profileFolders` tree/page follows `profile` | `flush: saveSettings`; `merges`: the two trees through the page's `ftImportTree` (write-through, read back), `profile` through the pure `mergeProfileEntry` that `mergeProfilesBlob` (the `.ivrit` import) also calls — results unioned by `savedAt`, newest 50 kept, ladder best-of; `onLocalChanged`: presets/folders → `renderPresets()`, profiles/folders → `renderProfiles()`, streak → `loadPbStreak()` + `updateStatsBar()`, settings → `loadSettings()`, or — while a Learner Ladder level runs — the new blob replaces `_ladderActive.snapshot` so `_ladderExit()` restores it instead of the pre-ladder state | Advanced Settings, a "Cloud saves" sub-section (`flashcards.advanced.cloud_head`) after Backup Presets, `title: false`; `open` un-collapses the panel and the sub-section through their own click handlers |
| `hebrew_blend_generator.html` (`Worksheet`) | `preset` map/item `hebrewBlender_presets` · `presetFolders` tree/page follows `preset` · `lastState` single/assign `hebrewBlender_lastState` (the remembered setup the page restores on load) | `flush: rememberSetup` (the setup is read off the live controls); `merges`: the tree through `ftImportTree`; `onLocalChanged`: presets/folders → `renderPresets()`, last setup → `restoreLastSetup()` (re-applies the controls under `_lastSetupRestoring`; the next Generate uses them) | Advanced, a nested "Cloud saves" sub-panel (`worksheet.advanced.cloud_title`) right after Backup Presets, `title: false`; `open` un-collapses both through their own click handlers |
| `hebrew_dictionary.html` (`Dictionary`) | `wordList` mapIn (`path: lists`, `nameField: name`, envelope `{v: 1}`, one row per list) merge page `ivritSuite_wordLists` — the page's small display prefs stay per device | `merges.wordList` = the pure, **uncapped** `mergeWordList` (words unioned by their `word` string, mine first; a cap would silently drop the other side's words, so a merged list may exceed 200 until words are removed); `onLocalChanged` re-renders the manager when it is showing; no `flush` (lists are written synchronously) | inside the Word Lists manager (rebuilt on every refresh, so `wlRenderManagerInto` mounts the panel each render; the manager lists again each time it opens signed in); `open` = `wlOpenManager()` |

`scripts/smoke-tools.mjs` loads every page in this table with the CDN blocked and proves: 0 `pageerror`,
the chip beside the language switcher, the panel's sign-in line, `plan()` returning exactly the seeded
items, and a localStorage dump byte-identical to a control run with the three account scripts blocked;
then a remembered session with the API unreachable, and Hebrew + dark at 800 px.

## Manual Supabase setup (done once in the dashboard)

The step-by-step walkthrough lives in `README.md` § "Accounts (optional, Supabase)": URL configuration
and redirect allow-list (`https://ivritsuite.com/**`, `http://localhost:8080/**`), Email provider + the
two email templates (*Confirm signup* and *Magic Link*) carrying `{{ .Token }}` only, Google OAuth
client and callback, and the custom SMTP provider that is **required before anyone but the project's
team members can receive a sign-in email** (the built-in sender refuses other addresses and allows only
a few messages per hour).

## Roadmap pointers (what is not built yet)

The remaining tool pages (see *Implemented on* for what is wired), Font Maker projects (their own
table and buckets), the account page, the delete-account Edge Function, and the keep-alive workflow
follow in later phases; a tool page carries no account or saves script until its turn.
