begin;

alter table public.jobs
  add column if not exists dismissed_at timestamptz;

alter table public.generations
  add column if not exists dismissed_at timestamptz;

create index if not exists jobs_user_visible_created_idx
on public.jobs (user_id, created_at desc)
where dismissed_at is null;

create index if not exists generations_user_visible_created_idx
on public.generations (user_id, created_at desc)
where dismissed_at is null;

create or replace function app_private.dismiss_job(
  p_job_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_job public.jobs%rowtype;
  reservation public.credit_reservations%rowtype;
  safely_cancelled boolean := false;
begin
  if p_job_id is null or p_user_id is null then
    raise exception using errcode = 'P0001', message = 'INVALID_DISMISSAL_REQUEST';
  end if;

  select * into target_job
  from public.jobs
  where id = p_job_id and user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'JOB_NOT_FOUND';
  end if;

  if target_job.status in ('queued', 'processing', 'retrying') then
    select * into reservation
    from public.credit_reservations
    where job_id = target_job.id
    for update;

    safely_cancelled := reservation.id is null
      or reservation.status <> 'reserved'
      or reservation.provider_started_at is null;

    if safely_cancelled and reservation.id is not null and reservation.status = 'reserved' then
      update public.credit_accounts
      set reserved_credits = reserved_credits - reservation.credits_reserved
      where id = reservation.credit_account_id
        and user_id = reservation.user_id;

      update public.credit_reservations
      set
        failure_reason = 'Cancelled by the user before provider billing started',
        released_at = now(),
        status = 'released'
      where id = reservation.id;

      insert into public.credit_ledger (
        user_id,
        credit_account_id,
        reservation_id,
        entry_type,
        credits_delta,
        model_key,
        description,
        idempotency_key
      )
      values (
        reservation.user_id,
        reservation.credit_account_id,
        reservation.id,
        'release',
        reservation.credits_reserved,
        reservation.model_key,
        'Released credits after user cancellation before provider billing',
        concat('release:', reservation.id)
      )
      on conflict (idempotency_key) do nothing;
    end if;

    if safely_cancelled then
      update public.jobs
      set
        dismissed_at = now(),
        error_code = 'USER_CANCELLED',
        error_message = 'Cancelled by the user.',
        finished_at = now(),
        stage = 'Cancelled by user',
        status = 'cancelled'
      where id = target_job.id;

      if target_job.generation_id is not null then
        update public.generations
        set
          dismissed_at = now(),
          last_error = null,
          status = 'cancelled'
        where id = target_job.generation_id and user_id = p_user_id;
      elsif target_job.project_id is not null then
        update public.projects
        set
          last_error = null,
          status = case
            when target_job.kind = 'analyze' then 'uploaded'::public.project_status
            else 'ready'::public.project_status
          end
        where id = target_job.project_id and user_id = p_user_id;
      end if;
    end if;
  end if;

  if not safely_cancelled then
    update public.jobs
    set dismissed_at = now()
    where id = target_job.id;

    if target_job.generation_id is not null then
      update public.generations
      set dismissed_at = now()
      where id = target_job.generation_id and user_id = p_user_id;
    end if;
  end if;

  return jsonb_build_object(
    'action', case when safely_cancelled then 'cancelled' else 'dismissed' end,
    'jobId', target_job.id,
    'queueMessageId', target_job.queue_message_id
  );
end;
$$;

create or replace function public.dismiss_job_admin(
  p_job_id uuid,
  p_user_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select app_private.dismiss_job(p_job_id, p_user_id);
$$;

create or replace function public.dismiss_generation_admin(
  p_generation_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_job_id uuid;
  result jsonb;
begin
  perform 1
  from public.generations
  where id = p_generation_id and user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'GENERATION_NOT_FOUND';
  end if;

  select id into target_job_id
  from public.jobs
  where generation_id = p_generation_id and user_id = p_user_id
  order by created_at desc
  limit 1;

  if target_job_id is null then
    update public.generations
    set dismissed_at = now()
    where id = p_generation_id and user_id = p_user_id;

    return jsonb_build_object(
      'action', 'dismissed',
      'generationId', p_generation_id,
      'jobId', null,
      'queueMessageId', null
    );
  end if;

  result := app_private.dismiss_job(target_job_id, p_user_id);

  update public.generations
  set dismissed_at = now()
  where id = p_generation_id and user_id = p_user_id;

  return result || jsonb_build_object('generationId', p_generation_id);
end;
$$;

revoke all on function app_private.dismiss_job(uuid, uuid) from public, anon, authenticated;
revoke all on function public.dismiss_job_admin(uuid, uuid) from public, anon, authenticated;
revoke all on function public.dismiss_generation_admin(uuid, uuid) from public, anon, authenticated;

grant usage on schema app_private to service_role;
grant execute on function app_private.dismiss_job(uuid, uuid) to service_role;
grant execute on function public.dismiss_job_admin(uuid, uuid) to service_role;
grant execute on function public.dismiss_generation_admin(uuid, uuid) to service_role;

commit;
