-- IvritSuite accounts & cloud saves — migration 10: the performance advisor's index and key findings.
--
-- Additive only: four indexes and one column. Nothing is dropped, nothing deleted, no policy, grant or
-- function changes, 0008 and 0009 untouched.
--
-- 1. Four foreign keys from 0008 had no index on their referencing column, so a delete or update on the parent
--    (a class removed, a teacher's or a student's account deleted) scans the child table to find the rows its
--    `on delete` rule touches, and a join on the column has nothing to use. One plain index each:
--      assignments.class_id   → classes        (on delete set null)
--      students.class_id      → classes        (on delete set null)
--      submissions.student_id → students       (on delete cascade; the existing indexes all lead with assignment_id)
--      feedback.teacher_id    → auth.users     (on delete cascade)
--
-- 2. code_attempts had no primary key. It gains `id`, an identity column, as one; the rows already there are
--    numbered as the column is added. claim_assignment() still inserts only `user_id` (the identity fills `id`)
--    and runs as the table's owner, and the service role's daily prune only selects and deletes, so no API role
--    writes the table and the identity's sequence needs no grant (db/README.md's rule: narrower where the table
--    needs less). The table stays RLS-on with no policies and the same grants.
--
-- Not here: the seven "multiple permissive policies" findings. Clearing them means merging each pair of
-- policies into one, which needs a `drop policy` — a migration in this repository never drops.
--
-- Read back afterwards (db/README.md → Checking the live project): the four indexes and code_attempts_pkey
-- exist, has_table_privilege() is unchanged for anon / authenticated / service_role on all five tables, and the
-- performance advisor no longer lists unindexed_foreign_keys or no_primary_key.

create index assignments_class_idx   on public.assignments (class_id);
create index students_class_idx      on public.students (class_id);
create index submissions_student_idx on public.submissions (student_id);
create index feedback_teacher_idx    on public.feedback (teacher_id);

alter table public.code_attempts add column id bigint generated always as identity primary key;
