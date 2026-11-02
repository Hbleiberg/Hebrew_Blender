-- IvritSuite accounts & cloud saves — migration 12: the security advisor's findings that a migration can fix.
--
-- 1. The five policy helpers leave the API schema. owns_assignment, is_member, can_submit, peers_allowed (0008)
--    and is_my_student (0009) are `security definer` functions that the row-level policies call; living in
--    `public`, each was also callable directly as /rest/v1/rpc/<name> by any signed-in account (the advisor's
--    authenticated_security_definer_function_executable). They move to a new schema, `private`, which the API
--    does not serve. Nothing else about them changes: same bodies, same owner, same `security definer` and
--    `set search_path = ''`, same grants (execute for `authenticated` and `service_role` only, which the
--    policies need, because a policy runs its functions as the querying role). The schema gives those two roles
--    `usage` and nobody else anything.
--    Policies hold a function by its internal id, not its name, so every policy that calls a helper follows the
--    move by itself (pg_policies then prints `private.owns_assignment(...)`). One function calls helpers by
--    NAME, the submissions_guard trigger (a plpgsql body is resolved when it runs), so it is redefined below with
--    the two names changed and not one other character — `create or replace` keeps its id, owner, grants and
--    trigger.
--
-- 2. code_attempts gets an explicit deny. It never had a policy on purpose (RLS on, no grants to the API roles,
--    written only by claim_assignment as the table's owner); the advisor reads "no policy" as "forgot one"
--    (rls_enabled_no_policy). A restrictive policy that admits nothing, for anon and authenticated, states the
--    intent in the database itself. The grants are unchanged, so an API read is still refused with 42501 before
--    any policy is consulted; the table's owner (claim_assignment) and the service role bypass RLS as before.
--
-- Not here, and why:
--  - claim_assignment stays in `public`, executable by signed-in accounts: it IS the API call a student's code
--    word goes through (js/ivrit-assignments.js → rpc('claim_assignment')), and it must be `security definer` to
--    read an assignment by code and write the attempt log. The advisor's one remaining WARN of this kind is that
--    function, by design.
--  - Leaked-password protection is an Auth dashboard setting (Authentication → Sign In / Providers → Email), not
--    something SQL can change, and Supabase offers it on the Pro plan and above only.
--
-- Read back afterwards (db/README.md → Checking the live project): the five helpers are in `private` and none
-- is left in `public`; has_function_privilege() for each is execute for authenticated and service_role, not
-- anon; has_schema_privilege() on `private` is usage for authenticated and service_role only; submissions_guard
-- names private.can_submit and private.owns_assignment; code_attempts' privileges are unchanged;
-- scripts/test-rls-assignments.mjs replays every migration green; the security advisor no longer lists the five
-- helpers or rls_enabled_no_policy.

-- 1. the helpers
create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter function public.owns_assignment(uuid) set schema private;
alter function public.is_member(uuid)       set schema private;
alter function public.can_submit(uuid)      set schema private;
alter function public.peers_allowed(uuid)   set schema private;
alter function public.is_my_student(uuid)   set schema private;

-- The one caller by name: 0008's body exactly, with public.can_submit / public.owns_assignment → private.
create or replace function public.submissions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare uid uuid := (select auth.uid());
begin
  if pg_trigger_depth() > 1 then
    new.updated_at := now();
    return new;
  end if;
  if new.id is distinct from old.id or new.assignment_id is distinct from old.assignment_id
     or new.student_id is distinct from old.student_id or new.version is distinct from old.version
     or new.r2_key is distinct from old.r2_key or new.mime_type is distinct from old.mime_type
     or new.is_current is distinct from old.is_current or new.created_at is distinct from old.created_at then
    raise exception 'submission identity is read-only' using errcode = 'insufficient_privilege';
  end if;
  if new.upload_status is distinct from old.upload_status
     and not (old.upload_status = 'pending' and new.upload_status = 'uploaded') then
    raise exception 'upload_status only moves from pending to uploaded' using errcode = 'insufficient_privilege';
  end if;
  if current_user = 'service_role' then
    if new.title is distinct from old.title or new.status is distinct from old.status then
      raise exception 'the service role changes only the upload fields' using errcode = 'insufficient_privilege';
    end if;
  elsif uid = old.student_id then
    if new.status is distinct from old.status then
      raise exception 'a student cannot change status' using errcode = 'insufficient_privilege';
    end if;
    if old.status <> 'submitted' then
      raise exception 'this recording is locked (the teacher has acted on it)' using errcode = 'insufficient_privilege';
    end if;
    if not private.can_submit(old.assignment_id) then
      raise exception 'this assignment is closed' using errcode = 'insufficient_privilege';
    end if;
  elsif private.owns_assignment(old.assignment_id) then
    if new.title is distinct from old.title or new.upload_status is distinct from old.upload_status
       or new.size_bytes is distinct from old.size_bytes or new.duration_seconds is distinct from old.duration_seconds then
      raise exception 'a teacher changes only status' using errcode = 'insufficient_privilege';
    end if;
  else
    raise exception 'not allowed' using errcode = 'insufficient_privilege';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- 2. code_attempts: closed to the API roles, said in a policy as well as in the grants
create policy "code_attempts: no API access"
  on public.code_attempts as restrictive for all to anon, authenticated
  using (false) with check (false);
