alter type public.job_kind add value if not exists 'generate_image';
alter type public.job_kind add value if not exists 'generate_video';

begin;

create type public.generation_kind as enum ('image', 'video');

create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  kind public.generation_kind not null,
  status public.job_status not null default 'queued',
  prompt text not null check (char_length(prompt) between 3 and 4000),
  settings jsonb not null default '{}'::jsonb,
  routing_profile text not null default 'balanced'
    check (routing_profile in ('quality', 'balanced', 'speed', 'cost')),
  model_endpoint text check (model_endpoint is null or char_length(model_endpoint) <= 240),
  routing_reason text check (routing_reason is null or char_length(routing_reason) <= 500),
  output_bucket text check (output_bucket in ('video-assets', 'video-outputs')),
  output_path text check (output_path is null or char_length(output_path) between 1 and 1024),
  output_mime text check (output_mime is null or char_length(output_mime) <= 100),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_seconds numeric(12, 3) check (duration_seconds is null or duration_seconds > 0),
  seed bigint,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((output_bucket is null) = (output_path is null))
);

create index generations_user_created_idx
on public.generations(user_id, created_at desc);
create index generations_user_kind_created_idx
on public.generations(user_id, kind, created_at desc);

create trigger generations_set_updated_at
before update on public.generations
for each row execute function public.set_updated_at();

alter table public.jobs alter column project_id drop not null;
alter table public.jobs
  add column generation_id uuid references public.generations(id) on delete cascade;
alter table public.jobs
  add constraint jobs_exactly_one_target_check
  check (num_nonnulls(project_id, generation_id) = 1);

create index jobs_generation_created_idx
on public.jobs(generation_id, created_at desc)
where generation_id is not null;
create unique index jobs_one_active_kind_per_generation_idx
on public.jobs(generation_id, kind)
where generation_id is not null
  and status in ('queued', 'processing', 'retrying');

alter table public.usage_events
  add column generation_id uuid references public.generations(id) on delete set null;
create index usage_events_generation_idx
on public.usage_events(generation_id)
where generation_id is not null;
alter table public.usage_events drop constraint usage_events_event_type_check;
alter table public.usage_events
  add constraint usage_events_event_type_check
  check (event_type in (
    'upload_bytes',
    'video_seconds_analyzed',
    'video_seconds_exported',
    'ai_transcription_seconds',
    'ai_analysis_request',
    'ai_image_generation',
    'ai_video_generation'
  ));

alter table public.generations enable row level security;

create policy generations_select_own
on public.generations for select to authenticated
using ((select auth.uid()) = user_id);

drop policy jobs_select_own on public.jobs;
create policy jobs_select_own
on public.jobs for select to authenticated
using (
  (select auth.uid()) = user_id
  and (
    (
      project_id is not null
      and exists (
        select 1 from public.projects p
        where p.id = project_id and p.user_id = (select auth.uid())
      )
    )
    or
    (
      generation_id is not null
      and exists (
        select 1 from public.generations g
        where g.id = generation_id and g.user_id = (select auth.uid())
      )
    )
  )
);

grant select on table public.generations to authenticated;
grant all on table public.generations to service_role;

update storage.buckets
set allowed_mime_types = array[
  'application/json',
  'text/vtt',
  'application/x-subrip',
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id = 'video-assets';

do $$
begin
  alter publication supabase_realtime add table public.generations;
exception
  when duplicate_object then null;
end;
$$;

commit;
