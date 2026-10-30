# Database migrations and Edge Functions (Supabase)

Everything the cloud side of IvritSuite needs in Postgres and Storage is written down here as plain
SQL files, one per change, applied in order — plus the one server-side function the browser cannot do
itself (`functions/`, below) and the text of the sign-in email (`email-templates/`, below). The live project is `IvritSuite` (`hhkmqwpjsyxdeuhvcyis`, free plan). How
the tables are used from the browser: `docs/reference/accounts-and-cloud.md`.

## The files

| File | Live? | What it creates |
|---|---|---|
| `migrations/0001_accounts_and_saves.sql` | yes — sign-in and every panel work | `profiles`, `saves`, `font_projects`, the three private buckets, and the policies that keep every row and file private to its owner. **Four functions, four triggers and a backfill besides** — see *What 0001 actually contains* below |
| `migrations/0002_font_sources_originals.sql` | yes — a photo over 2 MiB uploads | raises the `font-sources` bucket's per-file cap from 2 MiB to 15 MiB and adds WebP to its accepted types, so a Font Maker project's photos are kept at their original size (Phase 5); nothing else changes |
| `migrations/0003_keepalive.sql` | yes — a green keep-alive run | `public.keepalive()`, a function that returns `'ok'` and reads nothing, callable with the publishable key: the daily GitHub Actions workflow `.github/workflows/supabase-keepalive.yml` calls it so the free project counts as active and is never paused (Phase 8); no table, no policy changes |
| `migrations/0004_saves_tool_letter_learner.sql` | yes — applied through the connector; `saves_tool_check` read back with eight ids and the migrations list records it (before it, every upload from the Letter Learner was refused with `23514`, which the status line could only call "limit of saved items") | widens `saves.tool`'s CHECK to eight ids (adds `LetterLearner`, mirroring `var TOOLS`): the one constraint dropped and re-created inside a single transaction — the only way Postgres offers to change a CHECK; no table, row, policy or function is dropped |
| `migrations/0005_saves_tool_emoji_torah.sql` | yes — applied through the connector before the page reached `main`; `saves_tool_check` read back with nine ids and the migrations list records it; the security advisors show nothing new | widens `saves.tool`'s CHECK to nine ids (adds `EmojiTorah`, the Parsha Emojis page's coloring-sheet options, mirroring `var TOOLS`): the same one-constraint swap as 0004, inside a single transaction; no table, row, policy or function is dropped |
| `migrations/0006_no_default_grants.sql` | yes — applied through the connector; the default privileges read back with no `anon`, `authenticated` or `service_role` entry under `postgres` for tables, sequences or functions, the three tables' and six functions' privileges read back identical to before, the migrations list records it, and the security advisors show only the Auth leaked-password setting, which no migration touches | stops the project granting new `public` tables, sequences and functions to `anon`, `authenticated` and `service_role` automatically (its default privileges), so a table is reachable only through the grants its own migration writes — a function still needs its own `revoke … from public`, because Postgres's built-in grant of execute to every role is global and outlives a schema-level revoke; no existing table, sequence, function, policy or grant changes — `profiles`, `saves` and `font_projects` keep what 0001 gave them, `keepalive()` what 0003 gave it |
| `migrations/0007_saves_tool_name_tags.sql` | yes — applied through the connector before the page reached `main`; `saves_tool_check` read back with ten ids and the migrations list records it; `anon` still holds no privilege on `saves`; the security advisors show only the Auth leaked-password setting, which no migration touches | widens `saves.tool`'s CHECK to ten ids (adds `NameTags`, the Name Tags page's class lists and design options, mirroring `var TOOLS`): the same one-constraint swap as 0004 and 0005, inside a single transaction; no table, row, policy or function is dropped |
| `migrations/0008_reading_assignments.sql` | yes — applied through the connector and recorded in the migrations list; read back afterwards: the seven new tables exist with RLS on and no rows, `has_table_privilege()` is false for `anon` on every table and matches the file's grants for `authenticated` and `service_role` (`code_attempts` reachable only by `service_role`, select and delete), the policy count per table matches the file with one restrictive policy each on `saves`, `font_projects` and `storage.objects`, every existing profile reads `role = 'teacher'`, and the function privileges are as written. The security advisor adds one WARN, expected and left as is: the four definer helpers and `claim_assignment()` are executable by signed-in users over RPC — the policies evaluate as the caller, so `authenticated` must hold execute, and each answers only about `auth.uid()`; an INFO that `code_attempts` has no policy is the design. Before the apply the file was replayed on a throwaway local cluster by `node scripts/test-rls-assignments.mjs` (157 cases green) | Torah Trainer reading assignments: `profiles.role` (the mirror of the token's `app_metadata.role`; the sign-up trigger replaced to copy it in), `classes`, `students`, `assignments`, `assignment_members`, `submissions`, `feedback`, `code_attempts`, the `claim_assignment()` code-word function, `retention_due()` for the Worker's nightly reconcile, four definer helpers the policies ask about membership and ownership, the per-caller column guards (triggers, since a student and a teacher are both the `authenticated` role; the after-delete trigger makes the latest remaining take current again), and three **restrictive** policies that close `saves`, `font_projects` and Storage to student accounts. The audio itself never enters Supabase (a private R2 bucket behind `workers/audio/`). Nothing dropped, no row deleted; `handle_new_user` is `create or replace`d, 0001's file untouched |
| `migrations/0009_assignment_enrolment.sql` | yes — applied through the connector and recorded in the migrations list; read back: `authenticated` holds insert on `assignment_members` (and no other insert changed), `anon` still nothing, four policies on the table, `is_my_student()` executable by `authenticated` and `service_role` only; the security advisor adds the helper to its expected definer-function WARN. Replayed first on the throwaway cluster by `node scripts/test-rls-assignments.mjs` (164 cases green) | A teacher enrols their own students in their own assignments (a class at once, or chosen students), so a student's Torah Trainer can say "you have an assignment" with nothing to type: one definer helper `is_my_student(uuid)`, `grant insert on assignment_members to authenticated`, and one insert policy requiring the teacher role, ownership of the assignment and ownership of the student. A student still joins only through `claim_assignment()`. Nothing dropped, no row deleted, 0008 untouched |

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
| `set_updated_at()` | function + one trigger, on `profiles` only | `updated_at` is the **only** ordering signal for conditional writes; `client_updated_at` (the writing device's clock) only breaks a tie inside a settings row's field-by-field merge — which side changed a field last. `saves` and `font_projects` do not use this trigger — each sets its own `updated_at` inside its `before_write` function |
| `handle_new_user()` | `security definer` function + a trigger **on `auth.users`** (`after insert`) | creates the `profiles` row from Google's name or the email's local part. The only object outside `public` / `storage`, and the one a rebuild forgets |
| `saves_before_write()` | function + trigger (`before insert or update`) | sets `bytes` and `updated_at`, and raises the 2000-row cap |
| `font_projects_before_write()` | function + trigger (`before insert or update`) | sets `updated_at`, and raises the 25-project cap |
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

Two more shapes worth knowing before you change them: `saves.tool` is a **CHECK listing the ten tool
names** (0001 wrote seven; 0004 added the Letter Learner, 0005 the Parsha Emojis page, 0007 the Name Tags page), mirroring `var TOOLS` in
`js/ivrit-saves.js` — an eleventh tool needs a migration widening it the way 0004, 0005 and 0007 do (that one constraint dropped and re-created in a
single transaction, the only way Postgres offers), or every upload from that tool fails with an unexplained
`23514`. And the four `storage.objects` policies are
**per command, spanning all three buckets** (`bucket_id in (…)`), not one policy per bucket — so a fourth
bucket means editing all four, under a house rule that forbids `drop`.

`public.keepalive()` must stay **`stable`**: that is what lets PostgREST serve it as a plain
`GET /rest/v1/rpc/keepalive`, which is what the workflow's `curl` calls. Making it `volatile` would require a
POST and break the workflow without changing anything the function returns. Its grant pair (`revoke all …
from public`, then `grant execute … to anon, authenticated`) is equally load-bearing.

### Proving the policies without the project (`tests/`)

`node scripts/test-rls-assignments.mjs` boots a throwaway Postgres cluster in a temp directory (the server
binaries only; nothing is installed and nothing touches the live project), loads `tests/supabase-shim.sql`
(stand-ins for the roles, `auth.uid()`, `auth.jwt()` and the `storage` tables), replays **every** migration in
order and unchanged, then runs `tests/rls-assignments.sql`: each case is one statement as one identity (a
Postgres role plus the JWT claims PostgREST would set), and what comes back — rows touched, or the SQLSTATE —
is compared with what the policy promises. It prints the failures and the counts; `--verbose` prints every
case, `--keep` leaves the cluster running. A change to any policy, guard or grant is proved there first.
The container's cluster is Postgres 16 and production is 17; RLS, grants and plpgsql behave the same.

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
| `functions/delete-account/` | **Delete my account** (the button on `account.html`). For the signed-in caller only: removes every file under that user's folder in the three Font Maker buckets, deletes the student logins this teacher created (their auth users; the rows cascade, the audio goes at the Worker's next reconcile), then deletes the auth user, which takes the `profiles`, `saves`, `font_projects`, `classes` and `assignments` rows with it (on delete cascade). A student account cannot call it (`student_forbidden`). It runs on Supabase's servers because those steps need the project's *secret* key, which never ships in a page; the platform gives the function that key as an environment variable, so nothing is configured by hand. It answers only the site's own origins (CORS) and is deployed with the platform's JWT check on, then checks the token again itself, so it can only ever delete the account that is calling it. Redeployed through the connector with the students step (version 4, JWT check on; the deployed file read back identical to this one). |
| `functions/manage-students/` | **Student logins for Torah Trainer reading assignments** (`reading_assignments.html`). For a signed-in teacher only (a student's token is refused): `create` makes one auth user per row — `<username>@students.ivritsuite.com`, the password, `email_confirm`, `user_metadata.full_name` (the sign-up trigger copies it into `profiles.display_name`) and `app_metadata.role = 'student'` (only this key can write it; every token the student gets carries it) — then the `students` row, refusing a taken username first and removing a half-made user; `reset_password`; `delete` (the auth user; rows cascade). Caps: 60 per call, 200 per teacher. `reset_passwords` (`{ ids, password }`, up to 60 of the teacher's students, one password, per-id results) serves the class setup page's *one password for everyone shown*. Same CORS list, same key handling, same JWT check as `delete-account`. Deployed through the connector (version 1, JWT check on; the deployed file read back identical to this one; an unauthenticated call answers `401`). Redeployed through the connector with `reset_passwords` (version 4, JWT check on; the deployed file read back identical to this one). A password Auth refuses as leaked (the dashboard's leaked-password protection) answers `weak_password`, told apart from the length rule's `invalid_password`; redeployed with it (version 6, JWT check on; read back identical). |

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

## The sign-in email (`email-templates/`)

| File | Live? | Where it goes |
|---|---|---|
| `email-templates/sign-in-code.html` | no — until it is pasted; the project still sends Supabase's default emails, which hold Supabase's own link and no code | Supabase dashboard → *Authentication → Emails → Templates* → **both** *Confirm signup* and *Magic Link*: subject **Your IvritSuite sign-in code**, body = the whole file |

Supabase writes the sign-in email from two templates kept in its dashboard, not in this repository, so a
push never changes what a teacher receives: the file here is the text to paste, and *Live?* says whether
the dashboard holds it. A person's **first** email uses *Confirm signup*; every later one uses *Magic
Link*. Both get the same text, and the site's sign-in box accepts the code from either (`verifyOtp` with
type `email`).

**The code, and a link that only fills it in.** The body carries `{{ .Token }}` (the 6-digit code) and
one link, `{{ .RedirectTo }}#ivsignin={{ .Token }}`: back to the page the code was asked from (its own
parameters kept — the address the site sent, checked against the dashboard's redirect list, else the Site
URL), where `js/ivrit-account.js` takes the code out of the address bar, fills it into the sign-in box and
waits for a press on *Verify code* (`docs/reference/accounts-and-cloud.md` → *Auth flow decisions*). The
body never carries `{{ .ConfirmationURL }}` or a link built from `{{ .TokenHash }}` — not even inside an
HTML comment, since the template engine fills in variables there too. Those are Supabase's own sign-in
links, and two things go wrong with them. First, school mail filters open every link in an incoming email
to scan it, which spends a one-time sign-in link before the teacher can tap it. Opening IvritSuite's link
spends nothing. Second, a sign-in link works for whoever opens it, so a link someone else sent could sign
a browser into their account. A code is checked against the address it is typed with, so that cannot happen.

**Checking it:** ask for a code from any page's *Sign in* chip. The email should show a large 6-digit
number and a *Sign in to IvritSuite* button; the button opens that page with the menu open and the code
filled in, and nothing happens until *Verify code* is pressed. In *Authentication → Logs*, a code arriving
by either route shows up as a `POST /verify`; a `GET /verify` means someone opened Supabase's own link, so
the old template is still in place.

The other templates (*Invite user*, *Change email address*, *Reset password*, *Reauthentication*) are
never sent: teachers have no passwords, invitations or email changes, and a student login's address
(`<username>@students.ivritsuite.com`, a domain with a null MX record) receives no mail at all — its password is
set and reset by the teacher through `manage-students`, never by email.

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
`to authenticated` with `(select auth.uid())`, functions with `set search_path = ''`, no `drop` (0004's, 0005's and
0007's constraint swaps are the one reading of that rule: a CHECK can only be changed by dropping and re-creating
it, and it removes nothing that holds data), and nothing that deletes rows. **A new table also writes its own
grants, in the file that creates it** — since 0006 the project grants a new table to nobody, so without them every
request answers `42501`: `select, insert, update, delete` to `authenticated` and `service_role` (narrower where the
table needs less, as `profiles` does), `usage, select` on any sequence it uses (an identity or `serial` column) to
the same two roles, and nothing to `anon` unless the maintainer asks for it. A new function likewise needs
`revoke all on function … from public` and a `grant execute` naming only the roles that call it, as 0003 does for
`keepalive()` — 0006 cannot do that part, since Postgres grants execute on a new function to every role by a global
default that a schema-level revoke does not reach. After applying, read the grants back with the `has_table_privilege` query below.

## Checking the live project

Useful read-only queries for the SQL editor:

```sql
-- every table in the public schema and whether RLS is on
select tablename, rowsecurity from pg_tables where schemaname = 'public' order by 1;

-- every policy, with its role
select tablename, policyname, roles, cmd from pg_policies where schemaname in ('public', 'storage') order by 1, 2;

-- the project's default privileges in public (since 0006, under owner postgres: no anon, authenticated or
-- service_role entry for r = tables, S = sequences or f = functions)
select pg_get_userbyid(defaclrole) as owner, defaclobjtype, defaclacl
  from pg_default_acl where defaclnamespace = 'public'::regnamespace order by 1, 2;

-- what each API role may do on each table (replace the table list with the new table's name after a migration)
select t.tbl, r.role,
       has_table_privilege(r.role, 'public.' || t.tbl, 'select') as sel,
       has_table_privilege(r.role, 'public.' || t.tbl, 'insert') as ins,
       has_table_privilege(r.role, 'public.' || t.tbl, 'update') as upd,
       has_table_privilege(r.role, 'public.' || t.tbl, 'delete') as del
  from (values ('font_projects'), ('profiles'), ('saves')) t(tbl)
 cross join (values ('anon'), ('authenticated'), ('service_role')) r(role) order by 1, 2;

-- the buckets and their limits
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by 1;

-- how much each account stores (rows only; files are counted in the dashboard's Storage page)
select user_id, count(*) as items, pg_size_pretty(sum(bytes)::bigint) as size from saves group by 1;
```

## If something goes wrong

- *"permission denied"* from a tool page → almost always a missing policy or a query that names a
  column the policy does not allow; check `pg_policies` first. *"permission denied for table …"* with a hint
  naming a `GRANT` → the table's migration wrote no grant for that role (since 0006 nothing is granted by
  default); add it in a new migration, never in the dashboard.
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
