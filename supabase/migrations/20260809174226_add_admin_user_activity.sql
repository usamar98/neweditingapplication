begin;

create table public.user_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  country_code text check (
    country_code is null or country_code ~ '^[A-Z]{2}$'
  ),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_activity_last_seen_idx
on public.user_activity (last_seen_at desc);

create index user_activity_country_idx
on public.user_activity (country_code)
where country_code is not null;

create trigger user_activity_set_updated_at
before update on public.user_activity
for each row execute function public.set_updated_at();

alter table public.user_activity enable row level security;

create policy user_activity_select_own
on public.user_activity for select to authenticated
using ((select auth.uid()) = user_id);

create policy user_activity_insert_own
on public.user_activity for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy user_activity_update_own
on public.user_activity for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.user_activity from anon, authenticated;
grant select, insert, update on table public.user_activity to authenticated;
grant all on table public.user_activity to service_role;

commit;
