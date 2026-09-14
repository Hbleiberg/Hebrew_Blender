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
| `account-test.html` | Throwaway harness (own CSP, `noindex`, not in the sitemap/`llms.txt`/`sw.js`, skipped by `check-i18n`). Mounts the real chip, mirrors state, and runs the URL self-checks. |
| `scripts/smoke-account.mjs` | Headless Playwright smoke: anonymous with the CDN blocked, remembered session offline, SDK served locally, auth-error URL contracts, Hebrew + dark at 800 px. |

Load order on a page (all deferred, so `window.I18n` and `window.IVRIT_SUPABASE` exist when the module runs):
```html
<script src="/js/i18n.js" defer></script>
<script src="/js/supabase-config.js" defer></script>
<script src="/js/ivrit-account.js" defer></script>
```
Both `js/` files are in `sw.js` `CORE_ASSETS` (network-first like every same-origin script), so editing
either bumps `VERSION`.

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
`23505`; anything RLS refuses is `42501`. The saves adapter (Phase 3) maps these to the panel's strings.

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

## Manual Supabase setup (done once in the dashboard)

The step-by-step walkthrough lives in `README.md` § "Accounts (optional, Supabase)": URL configuration
and redirect allow-list (`https://ivritsuite.com/**`, `http://localhost:8080/**`), Email provider + the
two email templates (*Confirm signup* and *Magic Link*) carrying `{{ .Token }}` only, Google OAuth
client and callback, and the custom SMTP provider that is **required before anyone but the project's
team members can receive a sign-in email** (the built-in sender refuses other addresses and allows only
a few messages per hour).

## Roadmap pointers (what is not built yet)

Schema + Storage buckets + RLS (`supabase/migrations/`), the generic saves adapter (`js/ivrit-saves.js`
with the one declarative `IVRIT_SYNC_REGISTRY`), per-tool adoption, Font Maker projects, the account
page, the delete-account Edge Function, and the keep-alive workflow follow in later phases; the
tool pages carry no account script until their phase.
