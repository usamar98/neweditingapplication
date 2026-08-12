begin;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  fallback_username text := concat(
    'creator_',
    left(replace(new.id::text, '-', ''), 22)
  );
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
    requested_username := fallback_username;
  end if;

  begin
    insert into public.profiles (id, display_name, avatar_url, username)
    values (
      new.id,
      nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''),
      nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', ''), 2048), ''),
      requested_username
    )
    on conflict (id) do nothing;
  exception
    when unique_violation then
      -- Availability is checked before signup, but the unique index is still
      -- authoritative. If two requests race for the same username, preserve
      -- Auth account creation with a collision-resistant temporary username.
      insert into public.profiles (id, display_name, avatar_url, username)
      values (
        new.id,
        nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), ''),
        nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', ''), 2048), ''),
        fallback_username
      )
      on conflict (id) do nothing;
  end;

  return new;
end;
$$;

revoke all on function app_private.handle_new_user() from public, anon, authenticated;

commit;
