-- IvritSuite accounts & cloud saves — migration 11: one permissive policy per table and command.
--
-- THE ONE EXCEPTION TO "NEVER A DROP": the maintainer asked for it explicitly, to clear the performance advisor's
-- seven multiple_permissive_policies findings. It drops only policies, and only after creating the policy that
-- replaces them; the connector applies a migration as one transaction (so this file carries no begin/commit of its
-- own, as none of the others does), so no request ever sees the table without its rule. No table, column,
-- row, grant or function is touched.
--
-- Why it is safe: Postgres combines the permissive policies for one role and command with OR — every USING clause
-- OR'd together, and separately every WITH CHECK clause. So one policy whose USING is the OR of the old USINGs
-- (and, for the UPDATE, whose WITH CHECK is the OR of the old WITH CHECKs) admits exactly the rows the old set
-- did. Each clause below is the old policy's own text, unchanged, in its own parentheses. The advisor's point is
-- that the planner evaluates one policy instead of two or three per row; the rows a role reaches do not change.
--
-- The restrictive "not for student accounts" policies (0008 §9) are on saves, font_projects and storage, none of
-- which is here, and every policy merged is `to authenticated` for one command (none is `for all`), so no insert
-- or delete rule is folded into a read rule.
--
-- Read back afterwards (db/README.md → Checking the live project): pg_policies lists exactly one permissive
-- policy per table for SELECT on the six tables and one for UPDATE on submissions, each with the clauses below;
-- has_table_privilege() is unchanged; scripts/test-rls-assignments.mjs replays every migration green (it proves
-- the reachable rows case by case, so a merge that admitted or refused one row more would fail it); the
-- performance advisor no longer lists multiple_permissive_policies.


-- profiles (0001's own row, 0008's teacher-reads-own-students)
create policy "profiles: read own or own students"
  on public.profiles for select to authenticated
  using (
    ((select auth.uid()) = id)
    or (public.app_role() = 'teacher' and exists (
      select 1 from public.students s where s.id = profiles.id and s.teacher_id = (select auth.uid())))
  );
drop policy "profiles: read own" on public.profiles;
drop policy "profiles: teacher reads own students" on public.profiles;

-- students
create policy "students: own row or teacher reads own students"
  on public.students for select to authenticated
  using (
    ((select auth.uid()) = id)
    or ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
  );
drop policy "students: own row" on public.students;
drop policy "students: teacher reads own students" on public.students;

-- assignments
create policy "assignments: teacher reads own or member reads"
  on public.assignments for select to authenticated
  using (
    ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
    or (public.is_member(id))
  );
drop policy "assignments: teacher reads own" on public.assignments;
drop policy "assignments: member reads" on public.assignments;

-- assignment_members
create policy "members: student reads own or teacher reads own assignments"
  on public.assignment_members for select to authenticated
  using (
    ((select auth.uid()) = student_id)
    or (public.app_role() = 'teacher' and public.owns_assignment(assignment_id))
  );
drop policy "members: student reads own" on public.assignment_members;
drop policy "members: teacher reads for own assignments" on public.assignment_members;

-- submissions: the three reads
create policy "submissions: read own, classmates' current, or teacher's"
  on public.submissions for select to authenticated
  using (
    ((select auth.uid()) = student_id)
    or (is_current and upload_status = 'uploaded' and public.app_role() = 'student' and public.peers_allowed(assignment_id))
    or (public.app_role() = 'teacher' and public.owns_assignment(assignment_id))
  );
drop policy "submissions: student reads own" on public.submissions;
drop policy "submissions: classmates hear current uploads" on public.submissions;
drop policy "submissions: teacher reads for own assignments" on public.submissions;

-- submissions: the two updates (USING and WITH CHECK each the OR of the old ones)
create policy "submissions: student updates own or teacher updates own"
  on public.submissions for update to authenticated
  using (
    ((select auth.uid()) = student_id)
    or (public.app_role() = 'teacher' and public.owns_assignment(assignment_id))
  )
  with check (
    ((select auth.uid()) = student_id)
    or (public.app_role() = 'teacher' and public.owns_assignment(assignment_id))
  );
drop policy "submissions: student updates own" on public.submissions;
drop policy "submissions: teacher updates for own assignments" on public.submissions;

-- feedback
create policy "feedback: student reads own or teacher reads own assignments"
  on public.feedback for select to authenticated
  using (
    (exists (
      select 1 from public.submissions s where s.id = feedback.submission_id and s.student_id = (select auth.uid())))
    or (public.app_role() = 'teacher' and public.owns_assignment((select s.assignment_id from public.submissions s where s.id = feedback.submission_id)))
  );
drop policy "feedback: student reads own" on public.feedback;
drop policy "feedback: teacher reads for own assignments" on public.feedback;
