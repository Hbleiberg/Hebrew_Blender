-- IvritSuite accounts & cloud saves — migration 6: a new table or function in public is granted to no API role by
-- default.
--
-- Why: until now the project's default privileges handed every table, sequence and function the postgres role
-- creates in public to anon, authenticated and service_role the moment it existed, so a new table was reachable
-- through the Data API before its own migration had enabled RLS or said who may read it, and a new function was
-- callable by anyone holding the publishable key. Supabase is moving every project to opt-in exposure; this file
-- makes the switch now, so a missing grant shows up while the migration that needs it is being written, not after
-- the platform changes underneath a live table.
--
-- What it does: changes the default privileges, and nothing else. No existing table, sequence, function,
-- policy or grant is touched — profiles, saves and font_projects keep exactly what 0001 gave them (default
-- privileges apply only to objects created afterwards), and keepalive() keeps the execute grant 0003 gave it.
-- From now on the migration that creates a table or a function grants it explicitly, in the same file:
-- CLAUDE.md → Accounts rule 10, db/README.md → How to apply.
--
-- `revoke all`, not only select/insert/update/delete: the default being removed also grants truncate,
-- references, trigger and maintain on tables and update on sequences, and truncate empties a table without
-- consulting RLS. Revoking everything leaves nothing to be granted by accident.
--
-- Functions: the same two lines Supabase's own opt-in uses. The first removes the three API roles' explicit
-- execute grant. The second changes nothing on its own, kept to match that script: Postgres's built-in default
-- grants execute on every new function to `public` (every role), and a per-schema revoke cannot remove a global
-- default — measured on a scratch cluster, a function created after these lines is still executable by anon,
-- authenticated and service_role. So a new function's own migration still revokes it from public and grants
-- execute to the roles that call it, as 0003 does for keepalive() (CLAUDE.md → Accounts rule 10).
--
-- Not covered: the supabase_admin role's default privileges (Supabase's own internal objects; the postgres role
-- cannot change them, and no migration here runs as that role).
--
-- Read the default privileges back first, and again afterwards (under owner postgres, no anon, authenticated or
-- service_role entry left for r = tables, S = sequences or f = functions — only postgres's own):
--   select pg_get_userbyid(defaclrole) as owner, defaclobjtype, defaclacl
--     from pg_default_acl where defaclnamespace = 'public'::regnamespace order by 1, 2;
--
-- How to apply: like 0005 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (revoking a default nobody holds changes nothing).

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;
