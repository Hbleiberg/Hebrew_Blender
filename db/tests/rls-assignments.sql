-- IvritSuite — the Row Level Security proof for migration 0008 (reading assignments).
--
-- Run by scripts/test-rls-assignments.mjs on a throwaway cluster after db/tests/supabase-shim.sql and every
-- migration in order; never against the live project. Each case runs a statement as one identity (a Postgres
-- role plus the JWT claims PostgREST would set) inside a subtransaction, and records what came back: `ok:N`
-- (N rows touched) or the SQLSTATE and message. A case passes when the outcome starts with what was expected.
-- `42501` is insufficient_privilege (a missing grant, or one of 0008's guards); a claim that misses answers
-- `ok:0` (no rows, by design — see the function's comment); `23505` a unique violation; `23514` a CHECK.
--
-- Identities (fixed ids so the cases read plainly):
--   T1, T2  teachers      S1, S2 students of T1      S3 student of T2
--   C1      a class of T1
--   A1      T1's assignment, code "sunny-fox-38", classmates may NOT listen
--   A2      T1's assignment, code "river cat 55", classmates MAY listen
--   A3      T2's assignment, code "sunny-fox-38" (the same code as A1 — codes are per teacher)
--   A4      T1's assignment, closed

create schema tst;
create table tst.results (n serial primary key, label text, got text, want text, ok boolean);
grant usage on schema tst to anon, authenticated, service_role;
grant select, insert on tst.results to anon, authenticated, service_role;
grant usage, select on sequence tst.results_n_seq to anon, authenticated, service_role;

-- Become `r` with PostgREST's claims for `uid` (null = the anonymous key).
create function tst.who(r text, uid text, approle text default null)
returns void language plpgsql as $$
begin
  execute format('set local role %I', r);
  if uid is null then
    perform set_config('request.jwt.claims', json_build_object('role', r)::text, true);
  else
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', r, 'aud', r, 'app_metadata', json_build_object('role', approle))::text, true);
  end if;
end $$;
-- A statement: records ok:<rows> or the SQLSTATE + message.
create function tst.x(label text, sql text, want text)
returns void language plpgsql as $$
declare got text; n integer;
begin
  begin
    execute sql; get diagnostics n = row_count; got := 'ok:' || n;
  exception when others then got := sqlstate || ' ' || left(sqlerrm, 70);
  end;
  insert into tst.results (label, got, want, ok) values (label, got, want, got like want || '%');
end $$;
-- A scalar query: records its one value (or the SQLSTATE).
create function tst.q(label text, sql text, want text)
returns void language plpgsql as $$
declare got text;
begin
  begin
    execute sql into got;
  exception when others then got := sqlstate;
  end;
  got := coalesce(got, '<null>');
  insert into tst.results (label, got, want, ok) values (label, got, want, got = want);
end $$;
grant execute on all functions in schema tst to anon, authenticated, service_role;

\set T1 '''00000000-0000-4000-8000-000000000001'''
\set T2 '''00000000-0000-4000-8000-000000000002'''
\set S1 '''00000000-0000-4000-8000-000000000011'''
\set S2 '''00000000-0000-4000-8000-000000000012'''
\set S3 '''00000000-0000-4000-8000-000000000013'''
\set C1 '''00000000-0000-4000-8000-000000000021'''
\set A1 '''00000000-0000-4000-8000-000000000031'''
\set A2 '''00000000-0000-4000-8000-000000000032'''
\set A3 '''00000000-0000-4000-8000-000000000033'''
\set A4 '''00000000-0000-4000-8000-000000000034'''
\set SB1 '''00000000-0000-4000-8000-000000000041'''
\set SB2 '''00000000-0000-4000-8000-000000000042'''
\set SB3 '''00000000-0000-4000-8000-000000000043'''
\set SB4 '''00000000-0000-4000-8000-000000000044'''
\set SB5 '''00000000-0000-4000-8000-000000000045'''
\set F1 '''00000000-0000-4000-8000-000000000051'''

begin;

-- ───────── 0. accounts, as Supabase Auth and the Edge Function would make them ─────────
insert into auth.users (id, email, raw_user_meta_data) values
  (:T1, 't1@example.com', '{"full_name":"Morah Leah"}'),
  (:T2, 't2@example.com', '{"full_name":"Rabbi Dan"}');
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data) values
  (:S1, 'ruth.k@students.ivritsuite.com', '{"full_name":"Ruth"}', '{"role":"student"}'),
  (:S2, 'noam.b@students.ivritsuite.com', '{"full_name":"Noam"}', '{"role":"student"}'),
  (:S3, 'tal.r@students.ivritsuite.com',  '{"full_name":"Tal"}',  '{"role":"student"}');
select tst.q('sign-up trigger: a teacher profile is role teacher', format('select role from public.profiles where id = %L', :T1), 'teacher');
select tst.q('sign-up trigger: a student profile is role student', format('select role from public.profiles where id = %L', :S1), 'student');

select tst.who('service_role', null);
select tst.x('service role creates the students rows (the Edge Function)',
  format('insert into public.students (id, teacher_id, username) values (%L,%L,''ruth.k''),(%L,%L,''noam.b''),(%L,%L,''tal.r'')', :S1, :T1, :S2, :T1, :S3, :T2), 'ok:3');
select tst.x('students.username refuses an email-shaped name',
  format('insert into public.students (id, teacher_id, username) values (gen_random_uuid(), %L, ''x@y.z'')', :T1), '23514');

-- ───────── 1. the teacher's own tables ─────────
select tst.who('authenticated', :T1, 'teacher');
select tst.x('T1 creates a class', format('insert into public.classes (id, name) values (%L, ''Kitah Gimel'')', :C1), 'ok:1');
select tst.x('T1 moves S1 into the class', format('update public.students set class_id = %L where id = %L', :C1, :S1), 'ok:1');
select tst.x('T1 cannot change a student''s username', format('update public.students set username = ''hacker'' where id = %L', :S1), '42501');
select tst.x('T1 cannot change a student''s teacher', format('update public.students set teacher_id = %L where id = %L', :T2, :S1), '42501');
select tst.x('T1 cannot insert a students row (the Edge Function does)', format('insert into public.students (id, teacher_id, username) values (gen_random_uuid(), %L, ''newkid'')', :T1), '42501');
select tst.q('T1 sees both of their students', 'select count(*) from public.students', '2');
select tst.q('T1 reads their students'' display names', format('select display_name from public.profiles where id = %L', :S1), 'Ruth');
select tst.q('T1 does not see T2''s student''s profile', format('select count(*) from public.profiles where id = %L', :S3), '0');
select tst.x('T1 cannot change their own role', format('update public.profiles set role = ''student'' where id = %L', :T1), '42501');
select tst.x('T1 can change their display name (as before)', format('update public.profiles set display_name = ''Morah L.'' where id = %L', :T1), 'ok:1');

select tst.x('T1 creates A1 (classmates may not listen)',
  format('insert into public.assignments (id, title, code_word, ref, ref_label, reading, class_id) values (%L, ''Bereshit 1:1-5'', ''sunny-fox-38'', ''Genesis 1:1-5'', ''Bereshit 1:1–5'', ''{"parshahKey":"Bereshit"}'', %L)', :A1, :C1), 'ok:1');
select tst.x('T1 creates A2 (classmates may listen)',
  format('insert into public.assignments (id, title, code_word, ref, ref_label, peers_can_listen) values (%L, ''Noach'', ''river cat 55'', ''Genesis 6:9-22'', ''Noach 6:9–22'', true)', :A2), 'ok:1');
select tst.x('T1 creates A4 and closes it',
  format('insert into public.assignments (id, title, code_word, ref, ref_label, is_open) values (%L, ''Old one'', ''apple-tree-29'', ''Exodus 1:1-7'', ''Shemot 1:1–7'', false)', :A4), 'ok:1');
select tst.q('closing stamps closed_at on the server', format('select (closed_at is not null)::text from public.assignments where id = %L', :A4), 'true');
select tst.x('the same code twice for one teacher is refused', format('insert into public.assignments (title, code_word, ref, ref_label) values (''dup'', ''SUNNY FOX 38'', ''Genesis 1:1-5'', ''x'')'), '23505');
select tst.x('a code too short after normalisation is refused', 'insert into public.assignments (title, code_word, ref, ref_label) values (''short'', ''ab-1'', ''Genesis 1:1-5'', ''x'')', '23514');
select tst.x('a ref outside the Torah is refused', 'insert into public.assignments (title, code_word, ref, ref_label) values (''bad'', ''ruth-book-77'', ''Ruth 1:1-5'', ''x'')', '23514');
select tst.x('a ref that is not a verse range is refused', 'insert into public.assignments (title, code_word, ref, ref_label) values (''bad'', ''ruth-book-77'', ''Genesis <script>'', ''x'')', '23514');
select tst.x('T1 cannot file an assignment under another teacher', format('insert into public.assignments (teacher_id, title, code_word, ref, ref_label) values (%L, ''x'', ''other-teacher-11'', ''Genesis 1:1-5'', ''x'')', :T2), '42501');
select tst.x('T1 cannot attach another teacher''s class', format('insert into public.assignments (title, code_word, ref, ref_label, class_id) values (''x'', ''wrong-class-11'', ''Genesis 1:1-5'', ''x'', gen_random_uuid())', :T2), '42501');

select tst.who('authenticated', :T2, 'teacher');
select tst.x('T2 creates A3 with the same code word as A1 (codes are per teacher)',
  format('insert into public.assignments (id, title, code_word, ref, ref_label) values (%L, ''Lech Lecha'', ''sunny-fox-38'', ''Genesis 12:1-9'', ''Lech Lecha 12:1–9'')', :A3), 'ok:1');
select tst.q('T2 sees only their own assignment', 'select count(*) from public.assignments', '1');
select tst.q('T2 sees none of T1''s students', 'select count(*) from public.students', '1');
select tst.x('T2 cannot close T1''s assignment (0 rows)', format('update public.assignments set is_open = false where id = %L', :A1), 'ok:0');
select tst.x('T2 cannot delete T1''s assignment (0 rows)', format('delete from public.assignments where id = %L', :A1), 'ok:0');

-- ───────── 2. the student claims by code ─────────
select tst.who('authenticated', :S1, 'student');
select tst.q('S1 sees no assignment before claiming', 'select count(*) from public.assignments', '0');
select tst.x('S1 cannot read an assignment by its code', 'select * from public.assignments where code_norm = ''sunnyfox38''', 'ok:0');
select tst.x('S1 cannot insert a membership directly', format('insert into public.assignment_members (assignment_id, student_id) values (%L, %L)', :A1, :S1), '42501');
select tst.x('a wrong code is not_found', 'select * from public.claim_assignment(''wrong-code-99'')', 'ok:0');
select tst.x('T2''s code is not_found for T1''s student', 'select * from public.claim_assignment(''lech-lecha-00'')', 'ok:0');
select tst.x('a closed assignment''s code is not_found', 'select * from public.claim_assignment(''apple-tree-29'')', 'ok:0');
select tst.q('the right code, typed with caps and spaces, joins A1', 'select title from public.claim_assignment('' Sunny  FOX-38 '')', 'Bereshit 1:1-5');
select tst.q('claiming again is harmless', 'select title from public.claim_assignment(''sunnyfox38'')', 'Bereshit 1:1-5');
select tst.q('S1 now sees A1 and only A1', 'select count(*) from public.assignments', '1');
select tst.q('the claim returns no teacher id', 'select position(''teacher_id'' in pg_get_function_result(''public.claim_assignment(text)''::regprocedure))::text', '0');
select tst.q('S1 also joins A2', 'select title from public.claim_assignment(''RIVER CAT 55'')', 'Noach');
select tst.x('S1 cannot read the attempt log', 'select * from public.code_attempts', '42501');
select tst.x('S1 cannot create an assignment', 'insert into public.assignments (title, code_word, ref, ref_label) values (''x'', ''kid-made-11'', ''Genesis 1:1-5'', ''x'')', '42501');
select tst.x('S1 cannot create a class', 'insert into public.classes (name) values (''x'')', '42501');
select tst.q('S1 sees their own students row', 'select username from public.students', 'ruth.k');
select tst.q('S1 does not see S2''s students row', format('select count(*) from public.students where id = %L', :S2), '0');
select tst.q('S1 does not see S2''s profile', format('select count(*) from public.profiles where id = %L', :S2), '0');
select tst.x('S1 cannot promote themselves', format('update public.profiles set role = ''teacher'' where id = %L', :S1), '42501');
select tst.x('S1 cannot write a save (0001''s table is closed to students)', 'insert into public.saves (tool, kind, name, data) values (''TorahTrainer'', ''settings'', ''default'', ''{}'')', '42501');
select tst.x('S1 cannot create a Font Maker project', 'insert into public.font_projects (name) values (''x'')', '42501');
select tst.x('S1 cannot upload to Storage', format('insert into storage.objects (bucket_id, name) values (''font-sources'', %L)', :S1 || '/x.png'), '42501');

-- the lockout: S2 misses ten times, then the right code is refused too
select tst.who('authenticated', :S2, 'student');
select tst.x('S2 miss 1', 'select * from public.claim_assignment(''nope-nope-11'')', 'ok:0');
select tst.x('S2 miss 2', 'select * from public.claim_assignment(''nope-nope-12'')', 'ok:0');
select tst.x('S2 miss 3', 'select * from public.claim_assignment(''nope-nope-13'')', 'ok:0');
select tst.x('S2 miss 4', 'select * from public.claim_assignment(''nope-nope-14'')', 'ok:0');
select tst.x('S2 miss 5', 'select * from public.claim_assignment(''nope-nope-15'')', 'ok:0');
select tst.x('S2 miss 6', 'select * from public.claim_assignment(''nope-nope-16'')', 'ok:0');
select tst.x('S2 miss 7', 'select * from public.claim_assignment(''nope-nope-17'')', 'ok:0');
select tst.x('S2 miss 8', 'select * from public.claim_assignment(''nope-nope-18'')', 'ok:0');
select tst.x('S2 miss 9', 'select * from public.claim_assignment(''nope-nope-19'')', 'ok:0');
select tst.x('S2 miss 10', 'select * from public.claim_assignment(''nope-nope-20'')', 'ok:0');
select tst.x('S2 is locked out even with the right code', 'select * from public.claim_assignment(''sunny-fox-38'')', '42501 too_many_attempts');
-- the lock is per student: lift it for the rest of the run by pruning as the service role would
select tst.who('service_role', null);
select tst.x('the service role prunes the attempt log (the reconcile)', format('delete from public.code_attempts where user_id = %L', :S2), 'ok:10');
select tst.q('S1''s misses were cleared by the hit (the lock is per student)', format('select count(*)::text from public.code_attempts where user_id = %L', :S1), '0');
select tst.who('authenticated', :S2, 'student');
select tst.q('S2 joins A1 after the prune', 'select title from public.claim_assignment(''sunny-fox-38'')', 'Bereshit 1:1-5');
select tst.q('S2 joins A2', 'select title from public.claim_assignment(''river-cat-55'')', 'Noach');
select tst.who('authenticated', :S3, 'student');
select tst.q('S3 (T2''s student) joins A3 with the code T1 also uses', 'select title from public.claim_assignment(''sunny-fox-38'')', 'Lech Lecha');
select tst.who('authenticated', :T1, 'teacher');
select tst.x('a teacher cannot claim', 'select * from public.claim_assignment(''sunny-fox-38'')', '42501 not_a_student');
select tst.who('anon', null);
select tst.x('the anonymous key cannot claim', 'select * from public.claim_assignment(''sunny-fox-38'')', '42501');

-- ───────── 3. submissions ─────────
select tst.who('authenticated', :S1, 'student');
select tst.x('S1 submits to A1 (pending)', format('insert into public.submissions (id, assignment_id, title, mime_type, duration_seconds) values (%L, %L, ''Ruth''''s recording'', ''audio/webm;codecs=opus'', 42)', :SB1, :A1), 'ok:1');
select tst.q('the key is derived from the ids, never chosen', format('select r2_key from public.submissions where id = %L', :SB1), 'submissions/' || :A1 || '/' || :S1 || '/' || :SB1 || '.webm');
select tst.q('version 1, current, pending, submitted', format('select version || '' '' || is_current || '' '' || upload_status || '' '' || status from public.submissions where id = %L', :SB1), '1 true pending submitted');
select tst.x('S1 cannot pre-mark a submission uploaded on insert (trigger resets it)', format('insert into public.submissions (assignment_id, title, mime_type, upload_status, status) values (%L, ''sneaky'', ''audio/webm'', ''uploaded'', ''approved'')', :A2), 'ok:1');
select tst.q('…it is pending and submitted', format('select upload_status || '' '' || status from public.submissions where assignment_id = %L and title = ''sneaky''', :A2), 'pending submitted');
select tst.x('a chosen r2_key is overwritten by the trigger, not kept', format('insert into public.submissions (id, assignment_id, title, mime_type, r2_key) values (%L, %L, ''take 2'', ''audio/mp4'', ''submissions/x/y/z.mp4'')', :SB3, :A2), 'ok:1');
select tst.q('…and lands under its own ids', format('select r2_key from public.submissions where id = %L', :SB3), 'submissions/' || :A2 || '/' || :S1 || '/' || :SB3 || '.mp4');
select tst.x('S1 marks the A2 take uploaded', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 5 where id = %L', :SB3), 'ok:1');
select tst.x('S1 cannot submit as S2', format('insert into public.submissions (assignment_id, student_id, title, mime_type) values (%L, %L, ''x'', ''audio/webm'')', :A1, :S2), '42501');
select tst.x('S1 cannot submit to an assignment they did not join', format('insert into public.submissions (assignment_id, title, mime_type) values (%L, ''x'', ''audio/webm'')', :A4), '42501');
select tst.x('S1 cannot submit with a non-audio type', format('insert into public.submissions (assignment_id, title, mime_type) values (%L, ''x'', ''text/html'')', :A1), '23514');
select tst.x('S1 marks SB1 uploaded (what the Worker does as the student)', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 240000 where id = %L', :SB1), 'ok:1');
select tst.x('S1 cannot flip it back to pending', format('update public.submissions set upload_status = ''pending'' where id = %L', :SB1), '42501');
select tst.x('S1 cannot approve their own recording', format('update public.submissions set status = ''approved'' where id = %L', :SB1), '42501');
select tst.x('S1 cannot move a recording to another assignment', format('update public.submissions set assignment_id = %L where id = %L', :A2, :SB1), '42501');
select tst.x('S1 cannot rename the key', format('update public.submissions set r2_key = ''submissions/other'' where id = %L', :SB1), '42501');
select tst.x('S1 may retitle', format('update public.submissions set title = ''Ruth reads Bereshit'' where id = %L', :SB1), 'ok:1');
select tst.x('S1 cannot delete a submission (no policy: 0 rows)', format('delete from public.submissions where id = %L', :SB1), 'ok:0');

select tst.who('authenticated', :S2, 'student');
select tst.x('S2 submits to A1', format('insert into public.submissions (id, assignment_id, title, mime_type) values (%L, %L, ''Noam 1'', ''audio/webm'')', :SB2, :A1), 'ok:1');
select tst.x('S2 marks it uploaded', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 1000 where id = %L', :SB2), 'ok:1');
select tst.x('S2 submits to A2', format('insert into public.submissions (id, assignment_id, title, mime_type) values (%L, %L, ''Noam Noach'', ''audio/webm'')', :SB4, :A2), 'ok:1');
select tst.x('S2 marks it uploaded', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 1000 where id = %L', :SB4), 'ok:1');
select tst.q('S2 sees nothing of S1 in A1 (classmates may not listen)', format('select count(*) from public.submissions where assignment_id = %L and student_id <> %L', :A1, :S2), '0');
select tst.q('S2 hears S1''s current upload in A2 (classmates may listen)', format('select title from public.submissions where assignment_id = %L and student_id = %L', :A2, :S1), 'take 2');
select tst.x('S2 cannot retitle S1''s recording (0 rows)', format('update public.submissions set title = ''vandal'' where id = %L', :SB3), 'ok:0');
select tst.x('S2 cannot approve S1''s recording (0 rows)', format('update public.submissions set status = ''approved'' where id = %L', :SB3), 'ok:0');

-- S1 re-records in A2: a new version; the old one stops being current, and a classmate hears only the new one
select tst.who('authenticated', :S1, 'student');
select tst.x('S1 re-records in A2 (version 3; the sneaky row was version 1)', format('insert into public.submissions (id, assignment_id, title, mime_type) values (%L, %L, ''take 3'', ''audio/webm'')', :SB5, :A2), 'ok:1');
select tst.q('version 3 is current', format('select version || '' '' || is_current from public.submissions where id = %L', :SB5), '3 true');
select tst.q('version 2 is no longer current', format('select is_current::text from public.submissions where id = %L', :SB3), 'false');
select tst.x('S1 marks version 3 uploaded', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 6 where id = %L', :SB5), 'ok:1');
select tst.who('authenticated', :S2, 'student');
select tst.q('a classmate hears only S1''s current take', format('select string_agg(title, '','' order by title) from public.submissions where assignment_id = %L and student_id = %L', :A2, :S1), 'take 3');

-- the teacher
select tst.who('authenticated', :T1, 'teacher');
select tst.q('T1 sees every submission in A1', format('select count(*) from public.submissions where assignment_id = %L', :A1), '2');
select tst.q('T1 sees every version in A2 (history kept)', format('select count(*) from public.submissions where assignment_id = %L and student_id = %L', :A2, :S1), '3');
select tst.x('T1 approves SB1', format('update public.submissions set status = ''approved'' where id = %L', :SB1), 'ok:1');
select tst.x('T1 cannot retitle a student''s recording', format('update public.submissions set title = ''teacher title'' where id = %L', :SB1), '42501');
select tst.x('T1 cannot touch the upload fields', format('update public.submissions set size_bytes = 1 where id = %L', :SB1), '42501');
select tst.who('authenticated', :S1, 'student');
select tst.x('S1 cannot retitle an approved recording (locked)', format('update public.submissions set title = ''late edit'' where id = %L', :SB1), '42501');
select tst.who('authenticated', :T2, 'teacher');
select tst.q('T2 sees none of T1''s submissions', 'select count(*) from public.submissions', '0');
select tst.x('T2 cannot approve T1''s student''s recording (0 rows)', format('update public.submissions set status = ''approved'' where id = %L', :SB2), 'ok:0');
select tst.x('T2 cannot delete it (0 rows)', format('delete from public.submissions where id = %L', :SB2), 'ok:0');

-- ───────── 4. feedback ─────────
select tst.who('authenticated', :T1, 'teacher');
select tst.x('T1 asks S2 to re-record SB2', format('insert into public.feedback (id, submission_id, comment, request_rerecord) values (%L, %L, ''Slow down on the trope, lovely start'', true)', :F1, :SB2), 'ok:1');
select tst.q('…which sets the status', format('select status from public.submissions where id = %L', :SB2), 'needs_rerecord');
select tst.x('a second comment on the same submission is refused (one overall comment)', format('insert into public.feedback (submission_id, comment) values (%L, ''again'')', :SB2), '23505');
select tst.x('T1 withdraws the request', format('update public.feedback set request_rerecord = false where id = %L', :F1), 'ok:1');
select tst.q('…and the status returns to submitted', format('select status from public.submissions where id = %L', :SB2), 'submitted');
select tst.x('T1 approves SB2, then edits the comment', format('update public.submissions set status = ''approved'' where id = %L', :SB2), 'ok:1');
select tst.x('…the comment edit', format('update public.feedback set comment = ''Beautiful.'' where id = %L', :F1), 'ok:1');
select tst.q('…keeps the approval', format('select status from public.submissions where id = %L', :SB2), 'approved');
select tst.x('T1 cannot file feedback as T2', format('insert into public.feedback (submission_id, teacher_id, comment) values (%L, %L, ''x'')', :SB1, :T2), '42501');
select tst.who('authenticated', :T2, 'teacher');
select tst.x('T2 cannot leave feedback on T1''s student''s recording', format('insert into public.feedback (submission_id, comment) values (%L, ''x'')', :SB1), '42501');
select tst.q('T2 sees no feedback', 'select count(*) from public.feedback', '0');
select tst.who('authenticated', :S2, 'student');
select tst.q('S2 reads the feedback on their own recording', format('select comment from public.feedback where submission_id = %L', :SB2), 'Beautiful.');
select tst.x('S2 cannot change it (0 rows)', format('update public.feedback set comment = ''A+'' where id = %L', :F1), 'ok:0');
select tst.x('S2 cannot leave feedback', format('insert into public.feedback (submission_id, comment) values (%L, ''x'')', :SB1), '42501');
select tst.who('authenticated', :S1, 'student');
select tst.q('S1 (a classmate who may listen in A2) sees no feedback at all', 'select count(*) from public.feedback', '0');

-- ───────── 5. closing, and the service role ─────────
select tst.who('authenticated', :T1, 'teacher');
select tst.x('T1 closes A2', format('update public.assignments set is_open = false where id = %L', :A2), 'ok:1');
select tst.who('authenticated', :S1, 'student');
select tst.x('S1 cannot submit to a closed assignment', format('insert into public.submissions (assignment_id, title, mime_type) values (%L, ''late'', ''audio/webm'')', :A2), '42501');
select tst.x('S1 cannot retitle in a closed assignment', format('update public.submissions set title = ''late'' where id = %L', :SB5), '42501');
select tst.q('S1 still reads their recordings (3 own + 1 classmate''s) after the close', format('select count(*) from public.submissions where assignment_id = %L', :A2), '4');
select tst.who('authenticated', :T1, 'teacher');
select tst.x('T1 reopens A2', format('update public.assignments set is_open = true where id = %L', :A2), 'ok:1');
select tst.q('reopening clears closed_at', format('select (closed_at is null)::text from public.assignments where id = %L', :A2), 'true');
select tst.who('service_role', null);
select tst.x('the service role (reconcile) may mark a pending row uploaded', format('update public.submissions set upload_status = ''uploaded'', size_bytes = 7 where assignment_id = %L and title = ''sneaky''', :A2), 'ok:1');
select tst.x('the service role may not change a title', format('update public.submissions set title = ''x'' where id = %L', :SB1), '42501');
select tst.x('the service role may not change a status', format('update public.submissions set status = ''submitted'' where id = %L', :SB1), '42501');
select tst.x('the service role deletes a stale row (reconcile)', format('delete from public.submissions where id = %L', :SB4), 'ok:1');

-- ───────── 6. deletion cascades ─────────
select tst.who('authenticated', :T1, 'teacher');
select tst.x('T1 deletes S1''s approved recording', format('delete from public.submissions where id = %L', :SB1), 'ok:1');
select tst.x('T1 deletes A1', format('delete from public.assignments where id = %L', :A1), 'ok:1');
select tst.q('…its memberships, submissions and feedback went with it', format('select count(*) from public.feedback where id = %L', :F1), '0');
reset role;  -- Supabase Auth deletes the user; the shim has no API role on auth.users
select tst.x('removing a student account (the Edge Function) cascades their rows', format('delete from auth.users where id = %L', :S1), 'ok:1');
select tst.q('…no submissions of S1 remain', format('select count(*) from public.submissions where student_id = %L', :S1), '0');
select tst.q('…no students row of S1 remains', format('select count(*) from public.students where id = %L', :S1), '0');
select tst.x('removing a teacher account cascades classes, assignments and the students rows', format('delete from auth.users where id = %L', :T1), 'ok:1');
select tst.q('…T1''s assignments are gone', format('select count(*) from public.assignments where teacher_id = %L', :T1), '0');
select tst.q('…but S2''s auth user is NOT gone by cascade (delete-account must remove it)', format('select count(*) from auth.users where id = %L', :S2), '1');

-- ───────── 7. the anonymous key and the privilege matrix ─────────
select tst.who('anon', null);
select tst.x('anon: classes', 'select * from public.classes', '42501');
select tst.x('anon: students', 'select * from public.students', '42501');
select tst.x('anon: assignments', 'select * from public.assignments', '42501');
select tst.x('anon: assignment_members', 'select * from public.assignment_members', '42501');
select tst.x('anon: submissions', 'select * from public.submissions', '42501');
select tst.x('anon: feedback', 'select * from public.feedback', '42501');
select tst.x('anon: code_attempts', 'select * from public.code_attempts', '42501');
reset role;
select tst.q('anon holds no privilege on any new table',
  $q$select count(*)::text from (values ('classes'),('students'),('assignments'),('assignment_members'),('submissions'),('feedback'),('code_attempts')) t(tbl)
      where has_table_privilege('anon', 'public.' || t.tbl, 'select') or has_table_privilege('anon', 'public.' || t.tbl, 'insert')
         or has_table_privilege('anon', 'public.' || t.tbl, 'update') or has_table_privilege('anon', 'public.' || t.tbl, 'delete')$q$, '0');
select tst.q('authenticated cannot insert students or members, nor read code_attempts',
  $q$select (has_table_privilege('authenticated', 'public.students', 'insert') or has_table_privilege('authenticated', 'public.assignment_members', 'insert')
             or has_table_privilege('authenticated', 'public.code_attempts', 'select'))::text$q$, 'false');
select tst.q('RLS is on for every new table',
  $q$select count(*)::text from pg_tables where schemaname = 'public' and rowsecurity
      and tablename in ('classes','students','assignments','assignment_members','submissions','feedback','code_attempts')$q$, '7');
select tst.q('no public-executable new function', 
  $q$select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname in ('claim_assignment','submissions_guard','students_guard','profiles_guard','feedback_apply_status','submissions_before_insert','assignments_before_write')
        and has_function_privilege('anon', p.oid, 'execute')$q$, '0');

commit;


select n, case when ok then 'PASS' else 'FAIL' end as result, label, got, want from tst.results order by n;
select count(*) filter (where ok) as passed, count(*) filter (where not ok) as failed from tst.results;
