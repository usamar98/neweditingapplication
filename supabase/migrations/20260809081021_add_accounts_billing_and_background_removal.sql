alter type public.job_kind add value if not exists 'generate_background_removal';
alter type public.generation_kind add value if not exists 'background_removal';

begin;

alter table public.profiles
  add column username text,
  add column account_status text not null default 'active',
  add column deactivated_at timestamptz;

update public.profiles profile
set username = concat(
  coalesce(
    nullif(
      left(
        regexp_replace(lower(split_part(coalesce(auth_user.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'),
        20
      ),
      ''
    ),
    'creator'
  ),
  '_',
  left(profile.id::text, 6)
)
from auth.users auth_user
where auth_user.id = profile.id
  and profile.username is null;

update public.profiles
set username = concat('creator_', left(id::text, 8))
where username is null;

alter table public.profiles
  alter column username set not null,
  add constraint profiles_username_format_check
    check (username ~ '^[a-z0-9_]{3,30}$'),
  add constraint profiles_account_status_check
    check (account_status in ('active', 'inactive')),
  add constraint profiles_deactivation_state_check
    check (
      (account_status = 'active' and deactivated_at is null)
      or (account_status = 'inactive' and deactivated_at is not null)
    );

create unique index profiles_username_lower_unique_idx
on public.profiles (lower(username));

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('starter', 'creator', 'studio', 'business'));

create table public.billing_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique check (
    stripe_customer_id is null or stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'
  ),
  stripe_subscription_id text unique check (
    stripe_subscription_id is null or stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'
  ),
  stripe_price_id text check (
    stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'
  ),
  plan_key text check (plan_key is null or plan_key in ('creator', 'studio', 'business')),
  subscription_status text check (
    subscription_status is null or subscription_status in (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  ),
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger billing_accounts_set_updated_at
before update on public.billing_accounts
for each row execute function public.set_updated_at();

alter table public.billing_accounts enable row level security;

create policy billing_accounts_select_own
on public.billing_accounts for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.billing_accounts from anon, authenticated;
grant select on table public.billing_accounts to authenticated;
grant all on table public.billing_accounts to service_role;

revoke update on table public.profiles from authenticated;
grant update (display_name, username, avatar_url) on table public.profiles to authenticated;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data ->> 'username', ''),
      '[^a-z0-9_]',
      '',
      'g'
    )
  );

  if requested_username !~ '^[a-z0-9_]{3,30}$' then
    requested_username := concat('creator_', left(new.id::text, 8));
  end if;

  insert into public.profiles (id, display_name, avatar_url, username)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', ''), 2048), ''),
    requested_username
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

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
    'ai_video_generation',
    'background_removal'
  ));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'background-inputs',
    'background-inputs',
    false,
    20971520,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_files_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy avatar_files_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy avatar_files_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_select_own
on storage.objects for select to authenticated
using (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
