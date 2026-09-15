# Database migrations and Edge Functions (Supabase)

Everything the cloud side of IvritSuite needs in Postgres and Storage is written down here as plain
SQL files, one per change, applied in order — plus the one server-side function the browser cannot do
itself (`functions/`, below). The live project is `IvritSuite` (`hhkmqwpjsyxdeuhvcyis`, free plan). How
the tables are used from the browser: `docs/reference/accounts-and-cloud.md`.

## The files

| File | Live? | What it creates |
|---|---|---|
| `migrations/0001_accounts_and_saves.sql` | yes — sign-in and every panel work | `profiles`, `saves`, `font_projects`, the three private buckets, and the policies that keep every row and file private to its owner. **Four functions, five triggers and a backfill besides** — see *What 0001 actually contains* below |
| `migrations/0002_font_sources_originals.sql` | yes — a photo over 2 MiB uploads | raises the `font-sources` bucket's per-file cap from 2 MiB to 15 MiB and adds WebP to its accepted types, so a Font Maker project's photos are kept at their original size (Phase 5); nothing else changes |
| `migrations/0003_keepalive.sql` | yes — a green keep-alive run | `public.keepalive()`, a function that returns `'ok'` and reads nothing, callable with the publishable key: the daily GitHub Actions workflow `.github/workflows/supabase-keepalive.yml` calls it so the free project counts as active and is never paused (Phase 8); no table, no policy changes |

Each file starts with a comment that explains every block in plain language.

**The *Live?* column is evidence, not a record.** A migration applied through the connector is recorded in
`supabase_migrations`; one pasted into the SQL editor is not, so the repository cannot prove what ran. Check
the project itself rather than trusting this column — `select name from supabase_migrations.schema_migrations
order by 1;` for the recorded ones, and the read-only queries under *Checking the live project* for the rest.
Keep the column honest when you add a file: `no` until you have applied it.

### What 0001 actually contains

The table row above covers the objects a reader goes looking for. These are the rest, and they are the ones
most easily lost if the project is ever rebuilt from scratch:

| Object | Kind | Why it matters |
|---|---|---|
| `set_updated_at()` | function + triggers on all three tables | `updated_at` is the **only** ordering signal the sync uses; `client_updated_at` is display-only |
| `handle_new_user()` | `security definer` function + a trigger **on `auth.users`** | creates the `profiles` row from Google's name or the email's local part. The only object outside `public` / `storage`, and the one a rebuild forgets |
| `saves_before_write()` | function + trigger | sets `bytes` and `updated_at`, and raises the 2000-row cap |
| `font_projects_before_write()` | function + trigger | sets `updated_at`, and raises the 25-project cap |
| a backfill `insert` | one-time statement | gives `profiles` rows to accounts that already existed when the trigger was added |
| per-table `revoke all` + narrow grants | permissions | **this**, not RLS, is what makes the publishable key read nothing: an anonymous request is refused with `42501` before a policy is consulted. The daily keep-alive asserts that exact code |
| an advisor-hygiene `revoke` | permissions | drops `execute` on `public.rls_auto_enable()` from `public`/`anon`/`authenticated`, guarded so it is a no-op when the function is absent |

Two consequences the SQL states only implicitly:

- **`profiles` is granted `select, update` — no `insert`, no `delete`.** A client can never create or repair
  its own profile row, so if `handle_new_user` ever fails for an account, `IvritAccount.profile()` has no
  recovery path and the fix is a migration, not a retry in the page.
- **The 2000-row and 25-project caps are raised by triggers, and only on `INSERT`.** An `UPDATE` never
  re-checks them. The 2 MB `data` cap, by contrast, is a real CHECK constraint (`saves_data_max_2mb`), as is
  `char_length(data_hash) <= 64`. All of them surface as the same `23514`, so the error code alone will not
  tell you which one you hit.

Two more shapes worth knowing before you change them: `saves.tool` is a **CHECK listing the seven tool
names**, mirroring `var TOOLS` in `js/ivrit-saves.js` — an eighth tool needs a migration widening it, or
every upload from that tool fails with an unexplained `23514`. And the four `storage.objects` policies are
**per command, spanning all three buckets** (`bucket_id in (…)`), not one policy per bucket — so a fourth
bucket means editing all four, under a house rule that forbids `drop`.

`public.keepalive()` must stay **`stable`**: that is what lets PostgREST serve it as a plain
`GET /rest/v1/rpc/keepalive`, which is what the workflow's `curl` calls. Making it `volatile` would require a
POST and break the workflow without changing anything the function returns. Its grant pair (`revoke all …
from public`, then `grant execute … to anon, authenticated`) is equally load-bearing.

## Why `db/` and not `supabase/`

The Supabase GitHub integration is installed on this repository with the production database linked to
the `main` branch. That integration watches a `supabase/` folder and can create a **paid preview
database branch** for every pull request that touches it. Keeping the SQL (and the function source)
under `db/` keeps the "Supabase Preview" check harmless (it shows as skipped). If you ever adopt the
Supabase CLI, move the files to `supabase/migrations/` and `supabase/functions/` — nothing inside them
changes.

## Edge Functions (`functions/`)

| Folder | What it does |
|---|---|
| `functions/delete-account/` | **Delete my account** (the button on `account.html`). For the signed-in caller only: removes every file under that user's folder in the three Font Maker buckets, then deletes the auth user, which takes the `profiles`, `saves` and `font_projects` rows with it (on delete cascade). It runs on Supabase's servers because two of those steps need the project's *secret* key, which never ships in a page; the platform gives the function that key as an environment variable, so nothing is configured by hand. It answers only the site's own origins (CORS) and is deployed with the platform's JWT check on, then checks the token again itself, so it can only ever delete the account that is calling it. |

Deploying one (the code is a single `index.ts`; the platform keeps every deployed version):

1. **Through Claude Code** (how it was first deployed): ask it to deploy `db/functions/<name>/index.ts`
   through the Supabase connector with JWT verification on. It reads back the function list afterwards.
2. **By hand**: Supabase dashboard → *Edge Functions* → *Deploy a new function* → *Via Editor* → name it
   exactly as the folder (`delete-account`), paste the whole file, keep *Verify JWT* on → *Deploy*.

Nothing in the browser changes when a function is redeployed; a new version is live at once. The function's
own logs (every call, every error) are under *Edge Functions → delete-account → Logs*.

**What `delete-account` answers**, so a caller can be read without guessing:

| Status | Code | When |
|---|---|---|
| 405 | `method_not_allowed` | anything but `POST` |
| 401 | `no_token` | no bearer token on the request |
| 401 | `invalid_token` | Auth could not say whose token it is |
| 500 | `not_configured` | `SUPABASE_URL` or the secret key is missing from the environment |
| 500 | `delete_failed` | anything thrown along the way — the real error reaches `console.error` only, so the logs are the only place to read it |
| 200 | — | `{ok, deleted:{saves, projects, files}}` |

The platform's own JWT check answers its **own** 401 before the function runs at all; that is a different
401 from the two above, and it is the one you get when *Verify JWT* is on and the token is absent or stale.

`deleted.saves` and `deleted.projects` are counted **before** the delete — the rows go by cascade and are
never re-counted, and `profiles` is not counted at all — so they report what the account held, not what was
verified gone. `deleted.files` is counted as files are removed, 100 at a time, recursing into each project's
folder (an entry with no `id` is treated as a folder). The secret key is read from `SUPABASE_SECRET_KEYS`
(a JSON object, `.default`) and falls back to `SUPABASE_SERVICE_ROLE_KEY`.

**Two things about this function are known and deliberate**, recorded here so they are not rediscovered as
surprises:

- It imports the SDK as `npm:@supabase/supabase-js@2` — a floating major version. The browser side is
  pinned to an exact build with an integrity hash; the server side is not, so redeploying on a different
  day can pull a newer SDK than the one last tested. Pinning it is a one-word edit **plus a redeploy**,
  which is a live action against the one production project — not something a push can do.
- `ALLOWED_ORIGINS` is a hardcoded list of four: the two real origins (`https://ivritsuite.com`,
  `https://www.ivritsuite.com`) and `http://localhost:8080` / `http://127.0.0.1:8080`, left in from
  development. They are untidy rather than dangerous — a caller still needs a valid token for the account
  it is deleting — but adding or removing an origin means editing the function and redeploying it, not a
  dashboard setting.

## Applying a migration

Two ways; both are fine. The connector (like the Supabase CLI) also records the migration in the project's
`supabase_migrations` history; a paste into the SQL editor does not — add the file's row to the table above
either way.

1. **Through Claude Code** (the way these were first applied): ask it to apply the file through the
   Supabase connector. It applies the SQL, then reads back the tables, the migration list and the
   security/performance advisors so you get a plain-language confirmation.
2. **By hand**: Supabase dashboard → *SQL Editor* → *New query* → paste the whole file → *Run*.
   Then *Database → Tables* should show the new tables with the RLS shield, and *Security Advisor*
   (under *Database*) should show nothing new.

A migration runs once. Running it again stops at the first `already exists` and changes nothing, so
a second run is harmless. **Never edit an applied file** — write the next change as
`migrations/<next number>_<short_name>.sql`, keeping the same style: RLS on for every table, policies
`to authenticated` with `(select auth.uid())`, functions with `set search_path = ''`, no `drop`, and
nothing that deletes rows.

## Checking the live project

Useful read-only queries for the SQL editor:

```sql
-- every table in the public schema and whether RLS is on
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;

-- every policy, with its role
select tablename, policyname, roles, cmd from pg_policies where schemaname in ('public', 'storage') order by 1, 2;

-- the buckets and their limits
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by 1;

-- how much each account stores (rows only; files are counted in the dashboard's Storage page)
select user_id, count(*) as items, pg_size_pretty(sum(bytes)::bigint) as size from saves group by 1;
```

## If something goes wrong

- *"permission denied"* from a tool page → almost always a missing policy or a query that names a
  column the policy does not allow; check `pg_policies` first.
- *"new row violates row-level security policy"* on a Storage upload → the object path does not start
  with the signed-in user's id, or the bucket is not one of the three above.
- *"mime type … is not supported"* → the bucket's allow-list; extend it in a new migration
  (`update storage.buckets set allowed_mime_types = … where id = …`), never by hand in the dashboard,
  so the repository keeps matching the project.
- The free plan pauses a project after about a week with too little database activity;
  `.github/workflows/supabase-keepalive.yml` prevents that with one query a day (migration 0003). If it
  happens anyway — the workflow was disabled, or GitHub was down for a week — the dashboard offers *Restore*
  (within Supabase's restore window: 90 days at the time of writing).
  Sign-ins fail while it is paused, local saves are unaffected.
