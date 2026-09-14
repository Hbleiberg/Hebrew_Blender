-- IvritSuite accounts & cloud saves — migration 1: profiles, saves, font_projects, buckets, RLS.
--
-- How to apply: paste the whole file into the Supabase SQL editor (Database → SQL Editor → New query →
-- Run), or let Claude Code apply it through the Supabase connector. It is meant to run exactly once:
-- running it again stops on "already exists" and changes nothing. Never edit this file after it has
-- been applied — the next change goes in db/migrations/0002_<name>.sql.
--
-- Rules every block follows:
--   * Row Level Security is ON for every table, and every policy is limited to signed-in users
--     (`to authenticated`) comparing `(select auth.uid())` with the row's user id. The publishable key
--     alone reads nothing, and one teacher can never see another teacher's rows or files.
--   * Functions pin an empty search_path and name every object with its schema (Supabase's linter
--     flags anything else).
--   * Nothing here deletes data. Deletes only ever happen through the client, on the user's own rows,
--     or by Postgres when an account itself is deleted (on delete cascade).

-- ═══════════════════════════════════ 1. profiles ═══════════════════════════════════
-- One row per account, created automatically the moment the account is created. Holds the display
-- name shown in the header chip and nothing else. Removed automatically with the auth user.

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;
grant select, update on table public.profiles to authenticated;

create policy "profiles: read own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Keeps updated_at honest on every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Creates the profile row when an auth user is created. `security definer` because the auth service's
-- own database role cannot write to public tables (the pattern Supabase documents); execute is revoked
-- from the API roles so the function is not callable over the REST API.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that already exist get their profile row now.
insert into public.profiles (id, display_name)
select
  u.id,
  left(coalesce(
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(u.email, ''), '@', 1)
  ), 80)
from auth.users u
on conflict (id) do nothing;

-- ═══════════════════════════════════ 2. saves ═══════════════════════════════════
-- One row per saved item: a worksheet preset, a flash-card deck, a student profile, a word list, a
-- class roster, a tool's settings. `tool` + `kind` + `name` identify it within an account; `data` is
-- the item exactly as the tool stores it in the browser (at most 2 MB). The server clock (`updated_at`)
-- is the only ordering signal; `client_updated_at` is display-only because device clocks drift.

create table public.saves (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tool              text not null check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard')),
  kind              text not null check (kind ~ '^[A-Za-z]{1,32}$'),
  name              text not null check (char_length(name) between 1 and 120),
  data              jsonb not null,
  data_hash         text check (data_hash is null or char_length(data_hash) <= 64),
  bytes             integer not null default 0,
  client_updated_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint saves_one_name_per_kind unique (user_id, tool, kind, name),
  constraint saves_data_max_2mb check (octet_length(data::text) <= 2097152)
);

-- Fills `bytes` and `updated_at` on every write and caps an account at 2000 items. The count runs
-- under the caller's own row-level security, so it only ever sees that account's rows.
create or replace function public.saves_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.saves where user_id = new.user_id) >= 2000 then
    raise exception 'Save limit reached: an account can hold 2000 saved items'
      using errcode = 'check_violation';
  end if;
  new.bytes := octet_length(new.data::text);
  new.updated_at := now();
  return new;
end;
$$;

create trigger saves_before_write
  before insert or update on public.saves
  for each row execute function public.saves_before_write();

alter table public.saves enable row level security;
revoke all on table public.saves from anon;
revoke all on table public.saves from authenticated;
grant select, insert, update, delete on table public.saves to authenticated;

create policy "saves: read own"
  on public.saves for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "saves: insert own"
  on public.saves for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "saves: update own"
  on public.saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "saves: delete own"
  on public.saves for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ═══════════════════════════════ 3. font_projects ═══════════════════════════════
-- One row per Font Maker project kept in the cloud. The project itself (gzipped JSON) and its images
-- and exports live in Storage under `<user id>/<project id>/…`; this row is the catalogue entry.

create table public.font_projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 120),
  family_name     text check (family_name is null or char_length(family_name) <= 120),
  style           text check (style is null or char_length(style) <= 60),
  schema_version  integer,
  letters_done    integer not null default 0 check (letters_done >= 0),
  has_images      boolean not null default false,
  project_path    text check (project_path is null or (char_length(project_path) <= 300 and project_path like (user_id::text || '/%'))),
  project_bytes   bigint not null default 0 check (project_bytes >= 0),
  sources_bytes   bigint not null default 0 check (sources_bytes >= 0),
  export_path     text check (export_path is null or (char_length(export_path) <= 300 and export_path like (user_id::text || '/%'))),
  exported_at     timestamptz,
  client_saved_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint font_projects_one_name unique (user_id, name)
);

-- Caps an account at 25 cloud projects and keeps updated_at honest.
create or replace function public.font_projects_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.font_projects where user_id = new.user_id) >= 25 then
    raise exception 'Project limit reached: an account can hold 25 cloud font projects'
      using errcode = 'check_violation';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger font_projects_before_write
  before insert or update on public.font_projects
  for each row execute function public.font_projects_before_write();

alter table public.font_projects enable row level security;
revoke all on table public.font_projects from anon;
revoke all on table public.font_projects from authenticated;
grant select, insert, update, delete on table public.font_projects to authenticated;

create policy "font_projects: read own"
  on public.font_projects for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "font_projects: insert own"
  on public.font_projects for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "font_projects: update own"
  on public.font_projects for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "font_projects: delete own"
  on public.font_projects for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ═══════════════════════════════════ 4. buckets ═══════════════════════════════════
-- Three private buckets. Every object path starts with the owner's user id, and the policies below
-- only ever let a signed-in user touch the folder named after their own id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('font-projects', 'font-projects', false, 20971520, array['application/gzip', 'application/x-gzip']),
  ('font-exports',  'font-exports',  false, 5242880,  array['font/ttf', 'font/woff2', 'application/zip', 'application/octet-stream']),
  ('font-sources',  'font-sources',  false, 2097152,  array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "font buckets: read own folder"
  on storage.objects for select to authenticated
  using (bucket_id in ('font-projects', 'font-exports', 'font-sources')
         and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "font buckets: upload into own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('font-projects', 'font-exports', 'font-sources')
              and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "font buckets: replace own files"
  on storage.objects for update to authenticated
  using (bucket_id in ('font-projects', 'font-exports', 'font-sources')
         and (storage.foldername(name))[1] = (select auth.uid()::text))
  with check (bucket_id in ('font-projects', 'font-exports', 'font-sources')
              and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "font buckets: delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('font-projects', 'font-exports', 'font-sources')
         and (storage.foldername(name))[1] = (select auth.uid()::text));

-- ═══════════════════════════════ 5. advisor hygiene ═══════════════════════════════
-- Supabase installs `public.rls_auto_enable()` (an event trigger that switches RLS on for new tables)
-- as a security-definer function that the API roles may execute; its own linter warns about that.
-- Event triggers fire from DDL run by the postgres role, never through the API, so revoking execute
-- from the API roles is safe. Guarded so the migration also runs on a project without the helper.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

-- ═══════════════════════════════════ notes ═══════════════════════════════════
-- * Deleting an auth user (Authentication → Users → Delete) removes their profiles / saves /
--   font_projects rows through the cascades above, but NOT their Storage files. Remove those through
--   the dashboard (Storage → bucket → the folder named after the user id → Delete) or the Storage
--   API; deleting rows from storage.objects with SQL would leave orphan files behind.
-- * Self-service "delete my account" (files + rows + the auth user in one go) is the Phase 6 Edge
--   Function; it needs the service-role key, which never ships in the browser.
-- * The remaining security-advisor notice, "Leaked Password Protection Disabled", is a dashboard
--   toggle (Authentication → Sign In / Providers → Email). IvritSuite never uses passwords; switching
--   it on is harmless and silences the notice.
