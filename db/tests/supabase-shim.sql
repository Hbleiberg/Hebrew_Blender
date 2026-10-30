-- IvritSuite — a stand-in for the parts of a Supabase project that the migrations in db/migrations/ lean on,
-- so every file can be replayed, in order and unchanged, on a plain Postgres cluster that holds no real data.
--
-- What it creates (and nothing else): the three API roles (`anon`, `authenticated`, `service_role`, the last
-- with BYPASSRLS as on Supabase), the `auth` schema with a minimal `auth.users` and the three helpers the
-- policies call (`auth.uid()`, `auth.jwt()`, `auth.role()`, reading the `request.jwt.claims` setting exactly as
-- PostgREST sets it), and the `storage` schema with `buckets`, `objects` and `storage.foldername()`.
--
-- It is loaded only by scripts/test-rls-assignments.mjs, before the migrations, on a throwaway cluster the
-- script creates and destroys. It is never applied to the live project — Supabase provides all of this.
-- Production runs Postgres 17; the container's cluster is 16. RLS, grants and plpgsql behave the same.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;

-- ───────────────────────── auth ─────────────────────────
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  raw_app_meta_data  jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb;
$$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(coalesce(
    current_setting('request.jwt.claim.sub', true),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  ), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text;
$$;

grant execute on function auth.jwt(), auth.uid(), auth.role() to anon, authenticated, service_role;

-- ───────────────────────── storage ─────────────────────────
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id                 text primary key,
  name               text not null,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz not null default now()
);

create table storage.objects (
  id         uuid primary key default gen_random_uuid(),
  bucket_id  text references storage.buckets (id),
  name       text,
  owner      uuid,
  created_at timestamptz not null default now(),
  metadata   jsonb
);
alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.buckets, storage.objects to anon, authenticated, service_role;

-- Supabase's foldername(): every path part but the last.
create or replace function storage.foldername(name text)
returns text[]
language plpgsql
immutable
as $$
declare parts text[];
begin
  parts := string_to_array(name, '/');
  return parts[1 : array_length(parts, 1) - 1];
end;
$$;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;
