-- IvritSuite accounts & cloud saves — migration 9: a teacher enrols their own students in their own assignments.
--
-- Until now a student joined an assignment only by typing its code word (public.claim_assignment, 0008). A
-- teacher can now also enrol students directly — a whole class, or chosen students — so the student's Torah
-- Trainer shows "you have an assignment" with nothing to type; the code word stays as the way in for anyone
-- not enrolled. One table gains one privilege and one policy; nothing is dropped, nothing deleted, 0008 untouched.
--
-- The rules are 0008's: every policy `to authenticated` on `(select auth.uid())`, the cross-table question
-- ("is this one of my students?") answered by a `security definer` helper that reads only rows tied to the
-- caller, the grant explicit and never to `anon`, `set search_path = ''` everywhere.
--
-- Read back afterwards (db/README.md → Checking the live project): `authenticated` now holds insert on
-- assignment_members (and nothing new anywhere else), pg_policies lists the one policy below, the helper is
-- executable by `authenticated` and `service_role` only, and the security advisor adds one expected WARN for
-- the helper (a definer function signed-in users may call — it answers only about their own students).

-- Is `sid` one of the caller's students? Definer, so the members policy can ask without walking the students
-- policies; it names the caller's own id, never a parameter's, so it reveals nothing a teacher cannot already see.
create or replace function public.is_my_student(sid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.students s where s.id = sid and s.teacher_id = (select auth.uid()));
$$;
revoke all on function public.is_my_student(uuid) from public, anon;
grant execute on function public.is_my_student(uuid) to authenticated, service_role;

grant insert on table public.assignment_members to authenticated;

-- A teacher may write a membership only for their own assignment and their own student; a student still cannot
-- (the insert policy is the only one, and it requires the teacher role), so claim_assignment stays a student's
-- one way in. `joined_at` keeps its default; a duplicate is refused by the primary key (the client upserts with
-- "ignore duplicates", which is an insert … on conflict do nothing).
create policy "members: teacher enrols own students in own assignments"
  on public.assignment_members for insert to authenticated
  with check (public.app_role() = 'teacher' and public.owns_assignment(assignment_id) and public.is_my_student(student_id));
