begin;

create function app_private.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and account_status = 'active'
  );
$$;

revoke all on function app_private.is_active_user() from public, anon;
grant execute on function app_private.is_active_user() to authenticated;

drop policy profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id and (select app_private.is_active_user()))
with check ((select auth.uid()) = id and (select app_private.is_active_user()));

drop policy projects_select_own on public.projects;
drop policy projects_insert_own on public.projects;
drop policy projects_update_own on public.projects;
drop policy projects_delete_own on public.projects;

create policy projects_select_own
on public.projects for select to authenticated
using ((select auth.uid()) = user_id and (select app_private.is_active_user()));

create policy projects_insert_own
on public.projects for insert to authenticated
with check ((select auth.uid()) = user_id and (select app_private.is_active_user()));

create policy projects_update_own
on public.projects for update to authenticated
using ((select auth.uid()) = user_id and (select app_private.is_active_user()))
with check ((select auth.uid()) = user_id and (select app_private.is_active_user()));

create policy projects_delete_own
on public.projects for delete to authenticated
using ((select auth.uid()) = user_id and (select app_private.is_active_user()));

drop policy jobs_select_own on public.jobs;
create policy jobs_select_own
on public.jobs for select to authenticated
using (
  (select app_private.is_active_user())
  and (select auth.uid()) = user_id
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

drop policy generations_select_own on public.generations;
create policy generations_select_own
on public.generations for select to authenticated
using ((select auth.uid()) = user_id and (select app_private.is_active_user()));

drop policy usage_events_select_own on public.usage_events;
create policy usage_events_select_own
on public.usage_events for select to authenticated
using ((select auth.uid()) = user_id and (select app_private.is_active_user()));

drop policy video_files_select_own on storage.objects;
drop policy video_files_insert_own on storage.objects;
drop policy video_files_update_own on storage.objects;
drop policy video_files_delete_own on storage.objects;

create policy video_files_select_own
on storage.objects for select to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_insert_own
on storage.objects for insert to authenticated
with check (
  (select app_private.is_active_user())
  and bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_update_own
on storage.objects for update to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  (select app_private.is_active_user())
  and bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy video_files_delete_own
on storage.objects for delete to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy avatar_files_insert_own on storage.objects;
drop policy avatar_files_update_own on storage.objects;
drop policy avatar_files_delete_own on storage.objects;

create policy avatar_files_insert_own
on storage.objects for insert to authenticated
with check (
  (select app_private.is_active_user())
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy avatar_files_update_own
on storage.objects for update to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  (select app_private.is_active_user())
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy avatar_files_delete_own
on storage.objects for delete to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy background_inputs_select_own on storage.objects;
drop policy background_inputs_insert_own on storage.objects;
drop policy background_inputs_update_own on storage.objects;
drop policy background_inputs_delete_own on storage.objects;

create policy background_inputs_select_own
on storage.objects for select to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_insert_own
on storage.objects for insert to authenticated
with check (
  (select app_private.is_active_user())
  and bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_update_own
on storage.objects for update to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  (select app_private.is_active_user())
  and bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy background_inputs_delete_own
on storage.objects for delete to authenticated
using (
  (select app_private.is_active_user())
  and bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

commit;
