-- IvritSuite accounts & cloud saves — migration 3: a heartbeat function for the keep-alive workflow.
--
-- Why: a Free-plan Supabase project is paused after about a week with too little *database* activity, and
-- a paused project refuses every sign-in until someone presses Restore in the dashboard (local saves keep
-- working; the tools fail soft, but every sign-in and sync then fails with one error line). The
-- GitHub Actions workflow .github/workflows/supabase-keepalive.yml calls this function once a day with the
-- site's publishable key. That is a real, tiny query to the database — the kind of activity Supabase
-- counts — and it needs no account and no secret.
--
-- What it is: public.keepalive() returns the text 'ok'. It reads no table, takes no input and writes
-- nothing, so anyone holding the publishable key can call it and learns nothing. `stable` lets PostgREST
-- serve it with a plain GET (GET /rest/v1/rpc/keepalive); `security invoker` (the default, stated on
-- purpose) and the pinned empty search_path follow the same rules as every function in 0001.
--
-- How to apply: like 0001 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (create or replace; the grants are idempotent).

create or replace function public.keepalive()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select 'ok'::text;
$$;

comment on function public.keepalive() is
  'Heartbeat for the daily keep-alive workflow (.github/workflows/supabase-keepalive.yml): returns ''ok'', reads nothing.';

revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
