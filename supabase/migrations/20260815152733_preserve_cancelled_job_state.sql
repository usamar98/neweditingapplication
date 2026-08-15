begin;

create or replace function app_private.preserve_cancelled_job_state()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.status = 'cancelled'::public.job_status then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists jobs_preserve_cancelled_state on public.jobs;
create trigger jobs_preserve_cancelled_state
before update on public.jobs
for each row execute function app_private.preserve_cancelled_job_state();

revoke all on function app_private.preserve_cancelled_job_state() from public, anon, authenticated;

commit;
