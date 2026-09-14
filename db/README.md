# Database migrations (Supabase)

Everything the cloud side of IvritSuite needs in Postgres and Storage is written down here as plain
SQL files, one per change, applied in order. The live project is `IvritSuite` (`hhkmqwpjsyxdeuhvcyis`,
free plan). How the tables are used from the browser: `docs/reference/accounts-and-cloud.md`.

## The files

| File | What it creates |
|---|---|
| `migrations/0001_accounts_and_saves.sql` | `profiles` (display name per account, filled by a trigger), `saves` (one row per saved item, ≤ 2 MB, 2000 per account), `font_projects` (catalogue rows for cloud Font Maker projects, 25 per account), the three private buckets `font-projects` / `font-exports` / `font-sources`, and the Row Level Security policies that keep every row and file private to its owner |

Each file starts with a comment that explains every block in plain language.

## Why `db/` and not `supabase/`

The Supabase GitHub integration is installed on this repository with the production database linked to
the `main` branch. That integration watches a `supabase/` folder and can create a **paid preview
database branch** for every pull request that touches it. Keeping the SQL under `db/` keeps the
"Supabase Preview" check harmless (it shows as skipped). If you ever adopt the Supabase CLI, move the
files to `supabase/migrations/` — nothing inside them changes.

## Applying a migration

Two ways; both are fine, and both record the migration in the project's `supabase_migrations` history.

1. **Through Claude Code** (the way these were first applied): ask it to apply the file through the
   Supabase connector. It applies the SQL, then reads back the tables, the migration list and the
   security/performance advisors so you get a plain-language confirmation.
2. **By hand**: Supabase dashboard → *SQL Editor* → *New query* → paste the whole file → *Run*.
   Then *Database → Tables* should show the new tables with the RLS shield, and *Security Advisor*
   (under *Database*) should show nothing new.

A migration runs once. Running it again stops at the first `already exists` and changes nothing, so
a second run is harmless. **Never edit an applied file** — write the next change as
`migrations/0002_<short_name>.sql`, keeping the same style: RLS on for every table, policies
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
- The free plan pauses a project after about a week without traffic; the dashboard offers *Restore*.
  Sign-ins fail while it is paused, local saves are unaffected.
