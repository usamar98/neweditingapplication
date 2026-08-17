begin;

create or replace function public.retry_video_job(
  message_id bigint,
  retry_delay_seconds integer default 15
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if message_id is null or retry_delay_seconds not between 1 and 900 then
    return false;
  end if;

  perform 1
  from pgmq.set_vt('video_processing', message_id, retry_delay_seconds);
  return found;
end;
$$;

revoke all on function public.retry_video_job(bigint, integer) from public, anon, authenticated;
grant execute on function public.retry_video_job(bigint, integer) to service_role;
grant execute on function pgmq.set_vt(text, bigint, integer) to service_role;

commit;
