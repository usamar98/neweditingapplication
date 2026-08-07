begin;

create extension if not exists pgmq;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create type public.project_status as enum (
  'uploading',
  'uploaded',
  'analyzing',
  'ready',
  'exporting',
  'completed',
  'failed'
);

create type public.job_status as enum (
  'queued',
  'processing',
  'retrying',
  'completed',
  'failed',
  'cancelled'
);

create type public.job_kind as enum ('analyze', 'export');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 2048),
  plan text not null default 'starter' check (plan in ('starter', 'creator', 'studio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status public.project_status not null default 'uploading',
  source_path text not null check (char_length(source_path) between 1 and 1024),
  source_filename text not null check (char_length(source_filename) between 1 and 255),
  source_mime text not null,
  source_size_bytes bigint not null check (source_size_bytes > 0 and source_size_bytes <= 2147483648),
  duration_seconds numeric(12, 3) check (duration_seconds is null or duration_seconds >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  frame_rate numeric(10, 4) check (frame_rate is null or frame_rate > 0),
  thumbnail_path text,
  export_path text,
  transcript jsonb not null default '{"language":null,"segments":[],"text":""}'::jsonb,
  analysis jsonb not null default '{"scenes":[],"silences":[],"fillers":[],"highlights":[]}'::jsonb,
  edit_settings jsonb not null default '{"trimStart":0,"trimEnd":null,"aspectRatio":"original","removeSilences":false,"removeFillers":false,"audio":{"muted":false,"volume":1,"noiseReduction":false},"captions":{"enabled":true,"font":"Inter","fontSize":42,"position":"bottom","textColor":"#FFFFFF","backgroundColor":"#000000","backgroundOpacity":0.72}}'::jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.job_kind not null,
  status public.job_status not null default 'queued',
  progress smallint not null default 0 check (progress between 0 and 100),
  stage text not null default 'Waiting for a worker' check (char_length(stage) <= 160),
  attempt smallint not null default 0 check (attempt >= 0),
  max_attempts smallint not null default 3 check (max_attempts between 1 and 10),
  queue_message_id bigint,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  job_id uuid references public.jobs(id) on delete set null,
  event_type text not null check (event_type in ('upload_bytes', 'video_seconds_analyzed', 'video_seconds_exported', 'ai_transcription_seconds', 'ai_analysis_request')),
  units numeric(18, 4) not null check (units >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.request_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (char_length(scope) between 1 and 80),
  window_started_at timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, scope, window_started_at)
);

create index projects_user_created_idx on public.projects(user_id, created_at desc);
create index projects_user_status_idx on public.projects(user_id, status);
create index jobs_user_created_idx on public.jobs(user_id, created_at desc);
create index jobs_project_created_idx on public.jobs(project_id, created_at desc);
create index jobs_status_created_idx on public.jobs(status, created_at) where status in ('queued', 'retrying', 'processing');
create unique index jobs_one_active_kind_per_project_idx
on public.jobs(project_id, kind)
where status in ('queued', 'processing', 'retrying');
create index usage_events_user_created_idx on public.usage_events(user_id, created_at desc);
create index request_counters_updated_idx on public.request_counters(updated_at);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
before update on public.jobs
for each row execute function public.set_updated_at();

create function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', ''), 2048), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  nullif(left(coalesce(raw_user_meta_data ->> 'display_name', ''), 80), ''),
  nullif(left(coalesce(raw_user_meta_data ->> 'avatar_url', ''), 2048), '')
from auth.users
on conflict (id) do nothing;

create function public.consume_rate_limit(
  scope_name text,
  request_limit integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_window timestamptz;
  new_count integer;
begin
  if current_user_id is null then
    return false;
  end if;

  if char_length(scope_name) not between 1 and 80
    or request_limit not between 1 and 10000
    or window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate-limit configuration';
  end if;

  current_window := date_bin(
    make_interval(secs => window_seconds),
    now(),
    timestamptz '2020-01-01 00:00:00+00'
  );

  insert into public.request_counters (
    user_id,
    scope,
    window_started_at,
    request_count
  )
  values (current_user_id, scope_name, current_window, 1)
  on conflict (user_id, scope, window_started_at)
  do update set
    request_count = public.request_counters.request_count + 1,
    updated_at = now()
  returning request_count into new_count;

  return new_count <= request_limit;
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.jobs enable row level security;
alter table public.usage_events enable row level security;
alter table public.request_counters enable row level security;

create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy profiles_delete_own
on public.profiles for delete to authenticated
using ((select auth.uid()) = id);

create policy projects_select_own
on public.projects for select to authenticated
using ((select auth.uid()) = user_id);

create policy projects_insert_own
on public.projects for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy projects_update_own
on public.projects for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy projects_delete_own
on public.projects for delete to authenticated
using ((select auth.uid()) = user_id);

create policy jobs_select_own
on public.jobs for select to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  )
);

create policy jobs_insert_own
on public.jobs for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  )
);

create policy jobs_update_own
on public.jobs for update to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  )
);

create policy jobs_delete_own
on public.jobs for delete to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = (select auth.uid())
  )
);

create policy usage_events_select_own
on public.usage_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy usage_events_insert_own
on public.usage_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy usage_events_update_own
on public.usage_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy usage_events_delete_own
on public.usage_events for delete to authenticated
using ((select auth.uid()) = user_id);

create policy request_counters_select_own
on public.request_counters for select to authenticated
using ((select auth.uid()) = user_id);

create policy request_counters_insert_own
on public.request_counters for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy request_counters_update_own
on public.request_counters for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy request_counters_delete_own
on public.request_counters for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on table
  public.profiles,
  public.projects
to authenticated;
grant select on table
  public.jobs,
  public.usage_events,
  public.request_counters
to authenticated;
grant all on table
  public.profiles,
  public.projects,
  public.jobs,
  public.usage_events,
  public.request_counters
to service_role;
grant usage, select on sequence public.usage_events_id_seq to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.consume_rate_limit(text, integer, integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'video-sources',
    'video-sources',
    false,
    2147483648,
    array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska']
  ),
  (
    'video-outputs',
    'video-outputs',
    false,
    4294967296,
    array['video/mp4']
  ),
  (
    'video-assets',
    'video-assets',
    false,
    104857600,
    array['application/json', 'text/vtt', 'application/x-subrip', 'image/jpeg', 'image/png']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy video_files_select_own
on storage.objects for select to authenticated
using (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_update_own
on storage.objects for update to authenticated
using (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

grant select, insert, update, delete on table storage.objects to authenticated;

select pgmq.create('video_processing');
alter table pgmq.q_video_processing enable row level security;
alter table pgmq.a_video_processing enable row level security;

create function public.queue_video_job(message jsonb)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select pgmq.send('video_processing', message, 0);
$$;

create function public.dequeue_video_jobs(
  visibility_timeout integer default 900,
  batch_size integer default 1
)
returns table (
  msg_id bigint,
  read_ct bigint,
  enqueued_at timestamptz,
  vt timestamptz,
  message jsonb
)
language sql
security invoker
set search_path = ''
as $$
  select
    queued.msg_id,
    queued.read_ct,
    queued.enqueued_at,
    queued.vt,
    queued.message
  from pgmq.read('video_processing', visibility_timeout, batch_size) queued;
$$;

create function public.archive_video_job(message_id bigint)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select pgmq.archive('video_processing', message_id);
$$;

revoke all on function public.queue_video_job(jsonb) from public, anon, authenticated;
revoke all on function public.dequeue_video_jobs(integer, integer) from public, anon, authenticated;
revoke all on function public.archive_video_job(bigint) from public, anon, authenticated;
grant execute on function public.queue_video_job(jsonb) to service_role;
grant execute on function public.dequeue_video_jobs(integer, integer) to service_role;
grant execute on function public.archive_video_job(bigint) to service_role;
grant usage on schema pgmq to service_role;
grant execute on function pgmq.send(text, jsonb, integer) to service_role;
grant execute on function pgmq.read(text, integer, integer) to service_role;
grant execute on function pgmq.archive(text, bigint) to service_role;

do $$
begin
  alter publication supabase_realtime add table public.jobs;
exception
  when duplicate_object then null;
end;
$$;

commit;
