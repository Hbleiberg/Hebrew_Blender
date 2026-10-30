-- IvritSuite accounts & cloud saves — migration 8: Torah Trainer reading assignments.
--
-- What it adds, in plain language: student accounts a teacher creates (one `students` row per account, the
-- account itself made by the `manage-students` Edge Function with a password and no real email), optional
-- classes, assignments (a Torah portion under a code word), the memberships a student earns by typing the
-- code, the recordings a student submits (the rows only — the audio lives in a private Cloudflare R2 bucket,
-- reached only through the audio Worker in workers/audio/), the teacher's feedback, and the attempt log that
-- limits code-word guessing. Browser side: js/ivrit-assignments.js; how it all fits:
-- docs/reference/accounts-and-cloud.md → Reading assignments.
--
-- The rules every block follows (the same as 0001, plus three this feature needs):
--   * Row Level Security is ON for every table; every policy is `to authenticated` comparing
--     `(select auth.uid())` with the row's owner. A new table is granted explicitly in this file (0006 made
--     that the only way) to `authenticated` and `service_role`, narrower where the table needs less, and never
--     to `anon`. Functions pin an empty search_path and name every object with its schema.
--   * WHO IS A STUDENT is read from the token, never from a table: the Edge Function creates a student's auth
--     user with app_metadata {role: 'student'}, which only the service role can write and which Supabase puts
--     into every access token. `public.app_role()` reads it (no table). A policy that read `profiles` to learn
--     the role would recurse into the `profiles` policies that read other tables (42P17). `profiles.role` is
--     only the human-readable mirror, filled by the sign-up trigger and read-only afterwards. The one place a
--     policy must ask about ANOTHER table — is the caller a member of this assignment, does the caller own it —
--     goes through four `security definer` helpers (section 5) that read only rows tied to auth.uid(), because
--     assignments asking memberships and memberships asking assignments under RLS is a cycle Postgres refuses.
--   * WHICH COLUMNS EACH SIDE MAY CHANGE is a trigger, not a grant: a student and a teacher are both the
--     Postgres role `authenticated`, so column grants cannot tell them apart, and an RLS `with check` cannot see
--     the old row. `submissions_guard()` and `students_guard()` compare old and new per caller.
--   * Nothing here deletes data, drops an object, or edits an applied file: `handle_new_user` is replaced
--     (`create or replace`, 0001's text untouched) to copy the role in. Deletes happen only through the client
--     on rows a policy allows, through the service role in the Edge Functions and the Worker's daily reconcile,
--     or by cascade when an account is deleted.
--
-- Read back afterwards (db/README.md → Checking the live project): pg_tables shows RLS on for the six new
-- tables, pg_policies lists every policy below, has_table_privilege() reads false for anon on all of them, and
-- the security advisor shows nothing new.
--
-- How to apply: like 0001 — paste the whole file into the SQL editor, or let Claude Code apply it through the
-- Supabase connector. It runs once; a second run stops at the first "already exists".

-- ═══════════════════════════════ 1. the role, from the token ═══════════════════════════════

-- 'student' for an account the Edge Function created, 'teacher' for everyone else (every account that existed
-- before this migration carries no app_metadata role, and signs up as a teacher).
create or replace function public.app_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case when (auth.jwt() -> 'app_metadata' ->> 'role') = 'student' then 'student' else 'teacher' end;
$$;
revoke all on function public.app_role() from public;
grant execute on function public.app_role() to anon, authenticated, service_role;


alter table public.profiles
  add column role text not null default 'teacher' check (role in ('teacher', 'student'));

-- The sign-up trigger now copies the role in. Same body as 0001 otherwise.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80),
    case when (new.raw_app_meta_data ->> 'role') = 'student' then 'student' else 'teacher' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- The role column is read-only over the API (the client updates display_name and nothing else).
create or replace function public.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    raise exception 'profiles.role is read-only' using errcode = 'insufficient_privilege';
  end if;
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'profiles identity is read-only' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke execute on function public.profiles_guard() from public, anon, authenticated;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- ═══════════════════════════════ 2. classes ═══════════════════════════════
-- Optional grouping of a teacher's students. Used for "who has not submitted" and for assigning a reading to
-- one class. Removed with the teacher's account.

create table public.classes (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_one_name_per_teacher unique (teacher_id, name)
);
create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
revoke all on table public.classes from anon, authenticated, service_role;
grant select, insert, update, delete on table public.classes to authenticated, service_role;

create policy "classes: teacher reads own"
  on public.classes for select to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "classes: teacher inserts own"
  on public.classes for insert to authenticated
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "classes: teacher updates own"
  on public.classes for update to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "classes: teacher deletes own"
  on public.classes for delete to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');

-- ═══════════════════════════════ 3. students ═══════════════════════════════
-- One row per student account, written only by the manage-students Edge Function (service role). The row
-- names the teacher who made the account and the username the student signs in with; the display name is
-- in `profiles` like everyone's. A student sees their own row; a teacher sees their students and may move
-- one between classes — and nothing else (students_guard).

create table public.students (
  id         uuid primary key references auth.users (id) on delete cascade,
  teacher_id uuid not null references auth.users (id) on delete cascade,
  class_id   uuid references public.classes (id) on delete set null,
  username   text not null unique check (username ~ '^[a-z0-9][a-z0-9.]{1,28}[a-z0-9]$'),
  created_at timestamptz not null default now()
);
create index students_teacher_idx on public.students (teacher_id);

create or replace function public.students_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.teacher_id is distinct from old.teacher_id
     or new.username is distinct from old.username or new.created_at is distinct from old.created_at then
    raise exception 'only class_id may change on a students row' using errcode = 'insufficient_privilege';
  end if;
  if new.class_id is not null and not exists (
       select 1 from public.classes c where c.id = new.class_id and c.teacher_id = old.teacher_id) then
    raise exception 'class_id must name one of the teacher''s own classes' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke execute on function public.students_guard() from public, anon, authenticated;

create trigger students_guard
  before update on public.students
  for each row execute function public.students_guard();

alter table public.students enable row level security;
revoke all on table public.students from anon, authenticated, service_role;
grant select, update on table public.students to authenticated;
grant select, insert, update, delete on table public.students to service_role;

create policy "students: own row"
  on public.students for select to authenticated
  using ((select auth.uid()) = id);
create policy "students: teacher reads own students"
  on public.students for select to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "students: teacher updates own students"
  on public.students for update to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');

-- A teacher may read the display names of their own students (the submissions list names them).
create policy "profiles: teacher reads own students"
  on public.profiles for select to authenticated
  using (public.app_role() = 'teacher' and exists (
    select 1 from public.students s where s.id = profiles.id and s.teacher_id = (select auth.uid())));

-- ═══════════════════════════════ 4. assignments ═══════════════════════════════
-- A Torah portion under a code word. `ref` is the canonical "Book C:V-C:V" the Trainer trusts; `reading` is
-- the Trainer's own view identifiers (parasha, scope, holiday) so a student sees the same page, and is never
-- trusted for the text. `code_norm` is the code as a student may type it (case, spaces and dashes ignored),
-- unique per teacher — a student's lookup is scoped to their own teacher, so another teacher's codes are
-- invisible, not merely refused. Students never read this table by code: only through a membership.

create table public.assignments (
  id               uuid primary key default gen_random_uuid(),
  teacher_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  class_id         uuid references public.classes (id) on delete set null,
  title            text not null check (char_length(title) between 1 and 120),
  code_word        text not null check (char_length(code_word) between 1 and 40),
  code_norm        text generated always as (lower(regexp_replace(code_word, '[\s\-_]', '', 'g'))) stored,
  ref              text not null check (ref ~ '^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy) [0-9]{1,3}:[0-9]{1,3}(-([0-9]{1,3}:)?[0-9]{1,3})?$'),
  ref_label        text not null check (char_length(ref_label) between 1 and 200),
  reading          jsonb not null default '{}'::jsonb check (octet_length(reading::text) <= 2000),
  peers_can_listen boolean not null default false,
  is_open          boolean not null default true,
  closed_at        timestamptz,
  max_minutes      integer not null default 10 check (max_minutes between 1 and 30),
  due_date         date,
  retention_days   integer not null default 30 check (retention_days between 7 and 180),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint assignments_code_norm_shape check (code_norm ~ '^[[:alnum:]]{6,40}$'),
  constraint assignments_one_code_per_teacher unique (teacher_id, code_norm)
);
create index assignments_teacher_idx on public.assignments (teacher_id);

-- Keeps updated_at honest and stamps closed_at the moment is_open turns false (cleared when it reopens), so
-- the retention clock is the server's, not the page's.
create or replace function public.assignments_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if not new.is_open then new.closed_at := now(); end if;
  else
    if new.is_open and not old.is_open then new.closed_at := null; end if;
    if not new.is_open and old.is_open then new.closed_at := now(); end if;
    if new.id is distinct from old.id or new.teacher_id is distinct from old.teacher_id
       or new.created_at is distinct from old.created_at then
      raise exception 'assignment identity is read-only' using errcode = 'insufficient_privilege';
    end if;
    new.updated_at := now();
  end if;
  if new.class_id is not null and not exists (
       select 1 from public.classes c where c.id = new.class_id and c.teacher_id = new.teacher_id) then
    raise exception 'class_id must name one of the teacher''s own classes' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke execute on function public.assignments_before_write() from public, anon, authenticated;

create trigger assignments_before_write
  before insert or update on public.assignments
  for each row execute function public.assignments_before_write();

alter table public.assignments enable row level security;
revoke all on table public.assignments from anon, authenticated, service_role;
grant select, insert, update, delete on table public.assignments to authenticated, service_role;

create policy "assignments: teacher reads own"
  on public.assignments for select to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "assignments: teacher inserts own"
  on public.assignments for insert to authenticated
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "assignments: teacher updates own"
  on public.assignments for update to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "assignments: teacher deletes own"
  on public.assignments for delete to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');

-- ═══════════════════════════════ 5. assignment_members ═══════════════════════════════
-- A student who typed the right code word. Written only by claim_assignment() below; a teacher may un-enrol.

create table public.assignment_members (
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  student_id    uuid not null references public.students (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
create index assignment_members_student_idx on public.assignment_members (student_id);

-- Four yes/no questions about the CALLER, answered as the tables' owner so a policy can ask them without
-- being sent back through the other table's policies (assignments ask about memberships, memberships ask
-- about assignments — evaluated under RLS that is a cycle, which Postgres refuses as 42P17). Each takes an
-- assignment id and reads only rows tied to auth.uid(), so they reveal nothing a membership or ownership
-- would not; a definer function with no caller id in it answers "no".
create or replace function public.owns_assignment(aid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assignments a where a.id = aid and a.teacher_id = (select auth.uid()));
$$;
create or replace function public.is_member(aid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assignment_members m where m.assignment_id = aid and m.student_id = (select auth.uid()));
$$;
create or replace function public.can_submit(aid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assignment_members m join public.assignments a on a.id = m.assignment_id
                  where m.assignment_id = aid and m.student_id = (select auth.uid()) and a.is_open);
$$;
create or replace function public.peers_allowed(aid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.assignment_members m join public.assignments a on a.id = m.assignment_id
                  where m.assignment_id = aid and m.student_id = (select auth.uid()) and a.peers_can_listen);
$$;
revoke all on function public.owns_assignment(uuid), public.is_member(uuid), public.can_submit(uuid), public.peers_allowed(uuid) from public, anon;
grant execute on function public.owns_assignment(uuid), public.is_member(uuid), public.can_submit(uuid), public.peers_allowed(uuid) to authenticated, service_role;

alter table public.assignment_members enable row level security;
revoke all on table public.assignment_members from anon, authenticated, service_role;
grant select, delete on table public.assignment_members to authenticated;
grant select, insert, update, delete on table public.assignment_members to service_role;

create policy "members: student reads own"
  on public.assignment_members for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "members: teacher reads for own assignments"
  on public.assignment_members for select to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment(assignment_id));
create policy "members: teacher removes from own assignments"
  on public.assignment_members for delete to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment(assignment_id));

-- A student may read the assignments they joined — and only those; there is no way to read one by its code.
create policy "assignments: member reads"
  on public.assignments for select to authenticated
  using (public.is_member(id));

-- ═══════════════════════════════ 6. submissions ═══════════════════════════════
-- One row per recording a student submits. The audio itself is an R2 object at `r2_key`, which the insert
-- trigger derives from the ids — a client never chooses a key, so one student cannot write into another's
-- place. `version` counts a student's takes for one assignment (a re-recording is a new row; the history
-- stays); `is_current` marks the latest, which is the only one a classmate may hear. `upload_status` moves
-- pending → uploaded once, set by the audio Worker as the student after the bytes are stored; rows left
-- pending are reconciled by the Worker's daily job. `status` is the teacher's: submitted → needs_rerecord
-- (through feedback) or approved.

create table public.submissions (
  id               uuid primary key default gen_random_uuid(),
  assignment_id    uuid not null references public.assignments (id) on delete cascade,
  student_id       uuid not null default auth.uid() references public.students (id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 80),
  version          integer not null default 1 check (version >= 1),
  is_current       boolean not null default true,
  r2_key           text not null default '' check (char_length(r2_key) <= 200),
  mime_type        text not null check (mime_type in ('audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus')),
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 1800),
  size_bytes       integer not null default 0 check (size_bytes between 0 and 16777216),
  upload_status    text not null default 'pending' check (upload_status in ('pending', 'uploaded')),
  status           text not null default 'submitted' check (status in ('submitted', 'needs_rerecord', 'approved')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint submissions_one_version unique (assignment_id, student_id, version),
  constraint submissions_r2_key_unique unique (r2_key)
);
create unique index submissions_one_current on public.submissions (assignment_id, student_id) where is_current;
create index submissions_assignment_idx on public.submissions (assignment_id);
create index submissions_pending_idx on public.submissions (created_at) where upload_status = 'pending';

-- Sets the version and the object key, and retires the student's previous take. `security definer` so the
-- retiring update runs as the table's owner (the guard below lets it through by trigger depth); it touches
-- only the (assignment, student) pair of the row being inserted, which the insert policy has already pinned
-- to the caller.
create or replace function public.submissions_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare ext text;
begin
  select coalesce(max(s.version), 0) + 1 into new.version
    from public.submissions s where s.assignment_id = new.assignment_id and s.student_id = new.student_id;
  new.is_current := true;
  ext := case when new.mime_type like 'audio/webm%' then 'webm' when new.mime_type = 'audio/mp4' then 'mp4' else 'ogg' end;
  new.r2_key := 'submissions/' || new.assignment_id::text || '/' || new.student_id::text || '/' || new.id::text || '.' || ext;
  new.upload_status := 'pending';
  new.status := 'submitted';
  new.size_bytes := 0;
  new.created_at := now();
  new.updated_at := now();
  update public.submissions s set is_current = false
    where s.assignment_id = new.assignment_id and s.student_id = new.student_id and s.is_current;
  return new;
end;
$$;
revoke execute on function public.submissions_before_insert() from public, anon, authenticated;

create trigger submissions_before_insert
  before insert on public.submissions
  for each row execute function public.submissions_before_insert();

-- Who may change which column. The owning student: the title, and upload_status pending → uploaded together
-- with the size and duration, only while the teacher has not acted (status = submitted) and the assignment is
-- open. The teacher of the assignment: status, nothing else. The service role (the Worker's daily reconcile):
-- the upload fields. Identity columns never change. Depth > 1 is the insert trigger retiring the previous take.
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
    if not public.can_submit(old.assignment_id) then
      raise exception 'this assignment is closed' using errcode = 'insufficient_privilege';
    end if;
  elsif public.owns_assignment(old.assignment_id) then
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
revoke execute on function public.submissions_guard() from public, anon, authenticated;

create trigger submissions_guard
  before update on public.submissions
  for each row execute function public.submissions_guard();

alter table public.submissions enable row level security;
revoke all on table public.submissions from anon, authenticated, service_role;
grant select, insert, update, delete on table public.submissions to authenticated, service_role;

create policy "submissions: student reads own"
  on public.submissions for select to authenticated
  using ((select auth.uid()) = student_id);
create policy "submissions: student inserts own while open"
  on public.submissions for insert to authenticated
  with check ((select auth.uid()) = student_id and public.app_role() = 'student' and public.can_submit(assignment_id));
create policy "submissions: student updates own"
  on public.submissions for update to authenticated
  using ((select auth.uid()) = student_id)
  with check ((select auth.uid()) = student_id);
create policy "submissions: classmates hear current uploads"
  on public.submissions for select to authenticated
  using (is_current and upload_status = 'uploaded' and public.app_role() = 'student' and public.peers_allowed(assignment_id));
create policy "submissions: teacher reads for own assignments"
  on public.submissions for select to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment(assignment_id));
create policy "submissions: teacher updates for own assignments"
  on public.submissions for update to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment(assignment_id))
  with check (public.app_role() = 'teacher' and public.owns_assignment(assignment_id));
create policy "submissions: teacher deletes for own assignments"
  on public.submissions for delete to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment(assignment_id));

-- What the Worker's daily reconcile asks (service role only): the rows whose assignment has been closed for
-- longer than its retention period. The Worker deletes each one's object first, then the rows, in chunks.
create or replace function public.retention_due()
returns table (id uuid, r2_key text)
language sql
stable
security invoker
set search_path = ''
as $$
  select s.id, s.r2_key
    from public.submissions s join public.assignments a on a.id = s.assignment_id
   where a.closed_at is not null and a.closed_at + make_interval(days => a.retention_days) < now()
   limit 1000;
$$;
revoke all on function public.retention_due() from public, anon, authenticated;
grant execute on function public.retention_due() to service_role;

-- ═══════════════════════════════ 7. feedback ═══════════════════════════════
-- One overall comment per submission, by the teacher of its assignment. The student reads their own; a
-- classmate never does (no policy says so). Asking for a re-recording sets the submission's status, through a
-- trigger that re-checks the teacher owns the assignment rather than trusting the policy that let the row in.

create table public.feedback (
  id               uuid primary key default gen_random_uuid(),
  submission_id    uuid not null unique references public.submissions (id) on delete cascade,
  teacher_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  comment          text not null default '' check (char_length(comment) <= 2000),
  request_rerecord boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create or replace function public.feedback_apply_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  update public.submissions s
     set status = case when new.request_rerecord then 'needs_rerecord'
                       when s.status = 'needs_rerecord' then 'submitted'
                       else s.status end
    from public.assignments a
   where s.id = new.submission_id and a.id = s.assignment_id and a.teacher_id = (select auth.uid());
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'feedback may only be left by the teacher of the assignment' using errcode = 'insufficient_privilege';
  end if;
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.submission_id is distinct from old.submission_id
       or new.teacher_id is distinct from old.teacher_id or new.created_at is distinct from old.created_at then
      raise exception 'feedback identity is read-only' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.feedback_apply_status() from public, anon, authenticated;

-- `before`, so a refused status change refuses the feedback row with it.
create trigger feedback_apply_status
  before insert or update on public.feedback
  for each row execute function public.feedback_apply_status();
create trigger feedback_set_updated_at
  before update on public.feedback
  for each row execute function public.set_updated_at();

alter table public.feedback enable row level security;
revoke all on table public.feedback from anon, authenticated, service_role;
grant select, insert, update, delete on table public.feedback to authenticated, service_role;

create policy "feedback: student reads own"
  on public.feedback for select to authenticated
  using (exists (
    select 1 from public.submissions s where s.id = feedback.submission_id and s.student_id = (select auth.uid())));
create policy "feedback: teacher reads for own assignments"
  on public.feedback for select to authenticated
  using (public.app_role() = 'teacher' and public.owns_assignment((select s.assignment_id from public.submissions s where s.id = feedback.submission_id)));
create policy "feedback: teacher inserts for own assignments"
  on public.feedback for insert to authenticated
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher' and public.owns_assignment((select s.assignment_id from public.submissions s where s.id = feedback.submission_id)));
create policy "feedback: teacher updates for own assignments"
  on public.feedback for update to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher')
  with check ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');
create policy "feedback: teacher deletes for own assignments"
  on public.feedback for delete to authenticated
  using ((select auth.uid()) = teacher_id and public.app_role() = 'teacher');

-- ═══════════════════════════════ 8. code words ═══════════════════════════════
-- The attempt log nobody reads over the API: RLS on, no policies, no grants to the API roles except the
-- service role's prune (the Worker's daily job removes rows older than a day). claim_assignment() writes it
-- as the function's owner.

create table public.code_attempts (
  user_id      uuid not null references auth.users (id) on delete cascade,
  attempted_at timestamptz not null default now()
);
create index code_attempts_user_idx on public.code_attempts (user_id, attempted_at);
alter table public.code_attempts enable row level security;
revoke all on table public.code_attempts from anon, authenticated, service_role;
grant select, delete on table public.code_attempts to service_role;

-- The one way a student joins an assignment. Signed-in students only; the code is matched the way a child
-- types it (case, spaces and dashes ignored) against the student's own teacher's open assignments; a wrong
-- code, a closed assignment's code and another teacher's code all answer the same way — NO ROWS, not an
-- error, because an exception would roll the attempt row back with it and the lockout would never trip; ten
-- misses in ten minutes raise `too_many_attempts` for the rest of that window, and a hit clears the misses. `security definer` because the student may read neither assignments by code
-- nor the attempt log; everything it returns is what the membership would let them read anyway.
create or replace function public.claim_assignment(code text)
returns table (
  id uuid, title text, ref text, ref_label text, reading jsonb,
  peers_can_listen boolean, max_minutes integer, due_date date, is_open boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  teacher uuid;
  norm text;
  found_id uuid;
begin
  if uid is null then
    raise exception 'not_signed_in' using errcode = 'insufficient_privilege';
  end if;
  select s.teacher_id into teacher from public.students s where s.id = uid;
  if teacher is null then
    raise exception 'not_a_student' using errcode = 'insufficient_privilege';
  end if;
  if (select count(*) from public.code_attempts c
       where c.user_id = uid and c.attempted_at > now() - interval '10 minutes') >= 10 then
    raise exception 'too_many_attempts' using errcode = 'insufficient_privilege';
  end if;
  norm := lower(regexp_replace(coalesce(code, ''), '[\s\-_]', '', 'g'));
  select a.id into found_id from public.assignments a
   where a.teacher_id = teacher and a.code_norm = norm and a.is_open;
  if found_id is null then
    insert into public.code_attempts (user_id) values (uid);
    return;
  end if;
  delete from public.code_attempts c where c.user_id = uid;
  insert into public.assignment_members (assignment_id, student_id) values (found_id, uid)
    on conflict do nothing;
  return query
    select a.id, a.title, a.ref, a.ref_label, a.reading, a.peers_can_listen, a.max_minutes, a.due_date, a.is_open
      from public.assignments a where a.id = found_id;
end;
$$;
revoke all on function public.claim_assignment(text) from public, anon;
grant execute on function public.claim_assignment(text) to authenticated, service_role;

-- ═══════════════════════════════ 9. what a student account cannot do ═══════════════════════════════
-- Everything 0001 opened to any signed-in account stays for teachers and closes for students: no saves, no
-- Font Maker projects, no Storage files. Restrictive policies, so they narrow the existing ones instead of
-- widening them. (A student's Trainer never attaches the saves module either; this is the server's word.)

create policy "saves: not for student accounts"
  on public.saves as restrictive for all to authenticated
  using (public.app_role() <> 'student') with check (public.app_role() <> 'student');
create policy "font_projects: not for student accounts"
  on public.font_projects as restrictive for all to authenticated
  using (public.app_role() <> 'student') with check (public.app_role() <> 'student');
create policy "storage: not for student accounts"
  on storage.objects as restrictive for all to authenticated
  using (public.app_role() <> 'student') with check (public.app_role() <> 'student');

-- ═══════════════════════════════ notes ═══════════════════════════════
-- * The audio is not in Supabase. Deleting a submission row (a teacher, a cascade, the reconcile) leaves an
--   object in R2 until the Worker's daily job removes every object with no row; the Worker's own /delete
--   removes the object first and the row second, so nothing is ever left pointing at nothing for long.
-- * A teacher's account deletion must remove their students' auth users too: `students.teacher_id` cascades
--   the rows, not the accounts. db/functions/delete-account does that (and refuses a student caller).
-- * Supabase's own "leaked password protection" and the minimum password length are dashboard settings
--   (Authentication → Sign In / Providers → Email); the Edge Function generates 3-word passphrases that clear
--   both. Switching them on is part of the manual steps in workers/audio/README.md.
