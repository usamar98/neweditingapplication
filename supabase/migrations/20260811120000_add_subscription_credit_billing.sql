begin;

alter table public.billing_accounts
  add column current_period_start timestamptz,
  add column current_period_end timestamptz,
  add column latest_paid_invoice_id text,
  add constraint billing_accounts_period_check check (
    (current_period_start is null and current_period_end is null)
    or (
      current_period_start is not null
      and current_period_end is not null
      and current_period_end > current_period_start
    )
  );

create table public.billing_plan_entitlements (
  plan_key text primary key check (plan_key in ('creator', 'studio', 'business')),
  monthly_credits integer not null check (monthly_credits > 0),
  concurrency_limit smallint not null check (concurrency_limit between 1 and 20),
  hourly_generation_limit integer not null check (hourly_generation_limit between 1 and 10000),
  monthly_price_cents integer not null check (monthly_price_cents > 0),
  updated_at timestamptz not null default now()
);

insert into public.billing_plan_entitlements (
  plan_key,
  monthly_credits,
  concurrency_limit,
  hourly_generation_limit,
  monthly_price_cents
)
values
  ('creator', 1500, 1, 30, 2999),
  ('studio', 3500, 2, 90, 4999),
  ('business', 8000, 4, 240, 9999);

create table public.credit_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_key text not null references public.billing_plan_entitlements(plan_key),
  period_start timestamptz not null,
  period_end timestamptz not null,
  allocated_credits integer not null check (allocated_credits > 0),
  reserved_credits integer not null default 0 check (reserved_credits >= 0),
  consumed_credits integer not null default 0 check (consumed_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_accounts_period_check check (period_end > period_start),
  constraint credit_accounts_balance_check check (
    reserved_credits + consumed_credits <= allocated_credits
  ),
  unique (id, user_id),
  unique (user_id, period_start)
);

create table public.credit_reservations (
  id uuid primary key default gen_random_uuid(),
  credit_account_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null unique references public.jobs(id) on delete cascade,
  operation_key text not null check (char_length(operation_key) between 2 and 80),
  model_key text not null check (char_length(model_key) between 2 and 240),
  pricing_version text not null check (char_length(pricing_version) between 1 and 40),
  credits_reserved integer not null check (credits_reserved > 0),
  estimated_provider_cost_micros bigint not null check (estimated_provider_cost_micros >= 0),
  actual_provider_cost_micros bigint check (actual_provider_cost_micros is null or actual_provider_cost_micros >= 0),
  status text not null default 'reserved' check (status in ('reserved', 'settled', 'released')),
  provider_started_at timestamptz,
  settled_at timestamptz,
  released_at timestamptz,
  failure_reason text check (failure_reason is null or char_length(failure_reason) <= 500),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_reservations_terminal_state_check check (
    (status = 'reserved' and settled_at is null and released_at is null)
    or (status = 'settled' and settled_at is not null and released_at is null)
    or (status = 'released' and released_at is not null and settled_at is null)
  ),
  constraint credit_reservations_account_owner_fkey
    foreign key (credit_account_id, user_id)
    references public.credit_accounts(id, user_id)
    on delete restrict
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_account_id uuid not null,
  reservation_id uuid references public.credit_reservations(id) on delete set null,
  entry_type text not null check (entry_type in ('allocation', 'reservation', 'settlement', 'release', 'adjustment')),
  credits_delta integer not null,
  provider_cost_micros bigint not null default 0 check (provider_cost_micros >= 0),
  model_key text check (model_key is null or char_length(model_key) <= 240),
  description text not null check (char_length(description) between 1 and 500),
  idempotency_key text not null unique check (char_length(idempotency_key) between 8 and 240),
  created_at timestamptz not null default now(),
  constraint credit_ledger_account_owner_fkey
    foreign key (credit_account_id, user_id)
    references public.credit_accounts(id, user_id)
    on delete restrict
);

create table public.billing_revenue_events (
  id bigint generated always as identity primary key,
  stripe_event_id text not null unique check (stripe_event_id ~ '^evt_[A-Za-z0-9]+$'),
  stripe_invoice_id text not null unique check (stripe_invoice_id ~ '^in_[A-Za-z0-9]+$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_key text not null references public.billing_plan_entitlements(plan_key),
  amount_paid_cents integer not null check (amount_paid_cents >= 0),
  currency text not null check (currency ~ '^[a-z]{3}$'),
  period_start timestamptz not null,
  period_end timestamptz not null,
  paid_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint billing_revenue_period_check check (period_end > period_start)
);

create index credit_accounts_user_period_idx
on public.credit_accounts (user_id, period_start desc);

create index credit_reservations_user_status_created_idx
on public.credit_reservations (user_id, status, created_at desc);

create index credit_reservations_account_status_idx
on public.credit_reservations (credit_account_id, status);

create index credit_ledger_user_created_idx
on public.credit_ledger (user_id, created_at desc);

create index credit_ledger_model_created_idx
on public.credit_ledger (model_key, created_at desc)
where entry_type = 'settlement';

create index billing_revenue_paid_idx
on public.billing_revenue_events (paid_at desc);

create trigger credit_accounts_set_updated_at
before update on public.credit_accounts
for each row execute function public.set_updated_at();

create trigger credit_reservations_set_updated_at
before update on public.credit_reservations
for each row execute function public.set_updated_at();

create trigger billing_plan_entitlements_set_updated_at
before update on public.billing_plan_entitlements
for each row execute function public.set_updated_at();

alter table public.billing_plan_entitlements enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_reservations enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.billing_revenue_events enable row level security;

create policy credit_accounts_select_own
on public.credit_accounts for select to authenticated
using ((select auth.uid()) = user_id);

create policy credit_reservations_select_own
on public.credit_reservations for select to authenticated
using ((select auth.uid()) = user_id);

create policy credit_ledger_select_own
on public.credit_ledger for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
);

drop policy if exists video_files_insert_own on storage.objects;
create policy video_files_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
);

drop policy if exists video_files_update_own on storage.objects;
create policy video_files_update_own
on storage.objects for update to authenticated
using (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
)
with check (
  bucket_id in ('video-sources', 'video-outputs', 'video-assets')
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
);

drop policy if exists background_inputs_insert_own on storage.objects;
create policy background_inputs_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
);

drop policy if exists background_inputs_update_own on storage.objects;
create policy background_inputs_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
)
with check (
  bucket_id = 'background-inputs'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (
    select 1
    from public.billing_accounts billing
    where billing.user_id = (select auth.uid())
      and billing.subscription_status in ('active', 'trialing')
      and billing.current_period_start <= now()
      and billing.current_period_end > now()
  )
);

revoke all on table public.billing_plan_entitlements from public, anon, authenticated;
revoke all on table public.credit_accounts from public, anon, authenticated;
revoke all on table public.credit_reservations from public, anon, authenticated;
revoke all on table public.credit_ledger from public, anon, authenticated;
revoke all on table public.billing_revenue_events from public, anon, authenticated;

grant select on table public.billing_plan_entitlements to authenticated;
grant select on table public.credit_accounts to authenticated;
grant select on table public.credit_reservations to authenticated;
grant select on table public.credit_ledger to authenticated;

grant all on table public.billing_plan_entitlements to service_role;
grant all on table public.credit_accounts to service_role;
grant all on table public.credit_reservations to service_role;
grant all on table public.credit_ledger to service_role;
grant all on table public.billing_revenue_events to service_role;
grant usage, select on sequence public.credit_ledger_id_seq to service_role;
grant usage, select on sequence public.billing_revenue_events_id_seq to service_role;

create or replace function public.sync_credit_period(
  p_user_id uuid,
  p_plan_key text,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  entitlement public.billing_plan_entitlements%rowtype;
  account public.credit_accounts%rowtype;
  allocation_delta integer;
begin
  if p_period_end <= p_period_start then
    raise exception using errcode = 'P0001', message = 'INVALID_BILLING_PERIOD';
  end if;

  select * into entitlement
  from public.billing_plan_entitlements
  where plan_key = p_plan_key;
  if not found then
    raise exception using errcode = 'P0001', message = 'UNKNOWN_BILLING_PLAN';
  end if;

  perform 1
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  select * into account
  from public.credit_accounts
  where user_id = p_user_id and period_start = p_period_start
  for update;

  if not found then
    insert into public.credit_accounts (
      user_id,
      plan_key,
      period_start,
      period_end,
      allocated_credits
    )
    values (
      p_user_id,
      p_plan_key,
      p_period_start,
      p_period_end,
      entitlement.monthly_credits
    )
    returning * into account;

    insert into public.credit_ledger (
      user_id,
      credit_account_id,
      entry_type,
      credits_delta,
      description,
      idempotency_key
    )
    values (
      p_user_id,
      account.id,
      'allocation',
      entitlement.monthly_credits,
      concat(p_plan_key, ' monthly credit allocation'),
      concat('allocation:', p_user_id, ':', extract(epoch from p_period_start)::bigint)
    )
    on conflict (idempotency_key) do nothing;
  else
    allocation_delta := greatest(
      0,
      entitlement.monthly_credits - account.allocated_credits
    );

    update public.credit_accounts
    set
      allocated_credits = greatest(
        entitlement.monthly_credits,
        reserved_credits + consumed_credits
      ),
      period_end = p_period_end,
      plan_key = p_plan_key
    where id = account.id
    returning * into account;

    if allocation_delta > 0 then
      insert into public.credit_ledger (
        user_id,
        credit_account_id,
        entry_type,
        credits_delta,
        description,
        idempotency_key
      )
      values (
        p_user_id,
        account.id,
        'adjustment',
        allocation_delta,
        concat(p_plan_key, ' in-period plan credit increase'),
        concat('plan-adjustment:', p_user_id, ':', extract(epoch from p_period_start)::bigint, ':', p_plan_key)
      )
      on conflict (idempotency_key) do nothing;
    end if;
  end if;

  return jsonb_build_object(
    'accountId', account.id,
    'allocatedCredits', account.allocated_credits,
    'periodStart', account.period_start,
    'periodEnd', account.period_end
  );
end;
$$;

create or replace function public.reserve_job_credits(
  p_user_id uuid,
  p_job_id uuid,
  p_operation_key text,
  p_model_key text,
  p_pricing_version text,
  p_credits integer,
  p_estimated_provider_cost_micros bigint,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  billing public.billing_accounts%rowtype;
  entitlement public.billing_plan_entitlements%rowtype;
  account public.credit_accounts%rowtype;
  reservation public.credit_reservations%rowtype;
  billable_job public.jobs%rowtype;
  active_count integer;
  hourly_count integer;
  remaining integer;
  stale_job record;
begin
  if p_credits <= 0 or p_estimated_provider_cost_micros < 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_CREDIT_QUOTE';
  end if;

  select * into billing
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  if not found
    or billing.subscription_status not in ('active', 'trialing')
    or billing.plan_key is null
    or billing.current_period_start is null
    or billing.current_period_end is null
    or now() < billing.current_period_start
    or now() >= billing.current_period_end then
    raise exception using errcode = 'P0001', message = 'SUBSCRIPTION_REQUIRED';
  end if;

  select * into billable_job
  from public.jobs
  where id = p_job_id and user_id = p_user_id and status = 'queued'
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'INVALID_BILLING_JOB';
  end if;

  select * into reservation
  from public.credit_reservations
  where idempotency_key = p_idempotency_key or job_id = p_job_id
  limit 1;
  if found then
    return jsonb_build_object(
      'reservationId', reservation.id,
      'creditsReserved', reservation.credits_reserved,
      'idempotent', true
    );
  end if;

  select * into entitlement
  from public.billing_plan_entitlements
  where plan_key = billing.plan_key;
  if not found then
    raise exception using errcode = 'P0001', message = 'SUBSCRIPTION_REQUIRED';
  end if;

  select * into account
  from public.credit_accounts
  where user_id = p_user_id
    and period_start = billing.current_period_start
  for update;

  if not found then
    perform public.sync_credit_period(
      p_user_id,
      billing.plan_key,
      billing.current_period_start,
      billing.current_period_end
    );
    select * into account
    from public.credit_accounts
    where user_id = p_user_id
      and period_start = billing.current_period_start
    for update;
  end if;

  for stale_job in
    select jobs.id, jobs.max_attempts
    from public.credit_reservations reservations
    join public.jobs jobs on jobs.id = reservations.job_id
    where reservations.user_id = p_user_id
      and reservations.status = 'reserved'
      and reservations.updated_at < now() - interval '24 hours'
      and jobs.status in ('queued', 'processing', 'retrying')
    order by reservations.updated_at
    limit 20
  loop
    perform public.fail_job_with_credits(
      stale_job.id,
      stale_job.max_attempts,
      'RESERVATION_EXPIRED',
      'The operation did not reach a terminal state within 24 hours.',
      'Credit reservation expired',
      true
    );
  end loop;

  select * into account
  from public.credit_accounts
  where id = account.id
  for update;

  select count(*) into active_count
  from public.credit_reservations
  where user_id = p_user_id and status = 'reserved';
  if active_count >= entitlement.concurrency_limit then
    raise exception using errcode = 'P0001', message = 'CONCURRENCY_LIMIT_REACHED';
  end if;

  select count(*) into hourly_count
  from public.credit_reservations
  where user_id = p_user_id
    and created_at >= now() - interval '1 hour';
  if hourly_count >= entitlement.hourly_generation_limit then
    raise exception using errcode = 'P0001', message = 'GENERATION_LIMIT_REACHED';
  end if;

  remaining := account.allocated_credits - account.reserved_credits - account.consumed_credits;
  if remaining < p_credits then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.credit_reservations (
    credit_account_id,
    user_id,
    job_id,
    operation_key,
    model_key,
    pricing_version,
    credits_reserved,
    estimated_provider_cost_micros,
    idempotency_key
  )
  values (
    account.id,
    p_user_id,
    p_job_id,
    p_operation_key,
    p_model_key,
    p_pricing_version,
    p_credits,
    p_estimated_provider_cost_micros,
    p_idempotency_key
  )
  returning * into reservation;

  update public.credit_accounts
  set reserved_credits = reserved_credits + p_credits
  where id = account.id;

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
    p_user_id,
    account.id,
    reservation.id,
    'reservation',
    -p_credits,
    p_model_key,
    concat('Reserved credits for ', p_operation_key),
    concat('reservation:', reservation.id)
  );

  return jsonb_build_object(
    'reservationId', reservation.id,
    'creditsReserved', p_credits,
    'remainingCredits', remaining - p_credits,
    'concurrencyLimit', entitlement.concurrency_limit,
    'idempotent', false
  );
end;
$$;

create or replace function public.mark_job_provider_started(
  p_job_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed uuid;
begin
  update public.credit_reservations
  set provider_started_at = coalesce(provider_started_at, now())
  where job_id = p_job_id and status = 'reserved'
  returning id into changed;

  if changed is not null then
    return true;
  end if;

  return exists (
    select 1 from public.credit_reservations
    where job_id = p_job_id and provider_started_at is not null
  );
end;
$$;

create or replace function public.complete_job_with_credits(
  p_job_id uuid,
  p_stage text,
  p_result jsonb,
  p_actual_provider_cost_micros bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.jobs%rowtype;
  reservation public.credit_reservations%rowtype;
  final_cost bigint;
begin
  select * into job from public.jobs where id = p_job_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'BILLING_JOB_NOT_FOUND';
  end if;

  select * into reservation
  from public.credit_reservations
  where job_id = p_job_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'CREDIT_RESERVATION_NOT_FOUND';
  end if;

  perform 1 from public.billing_accounts where user_id = job.user_id for update;

  if reservation.status = 'reserved' then
    final_cost := coalesce(p_actual_provider_cost_micros, reservation.estimated_provider_cost_micros);
    update public.credit_accounts
    set
      reserved_credits = reserved_credits - reservation.credits_reserved,
      consumed_credits = consumed_credits + reservation.credits_reserved
    where id = reservation.credit_account_id;

    update public.credit_reservations
    set
      actual_provider_cost_micros = p_actual_provider_cost_micros,
      settled_at = now(),
      status = 'settled'
    where id = reservation.id;

    insert into public.credit_ledger (
      user_id,
      credit_account_id,
      reservation_id,
      entry_type,
      credits_delta,
      provider_cost_micros,
      model_key,
      description,
      idempotency_key
    )
    values (
      reservation.user_id,
      reservation.credit_account_id,
      reservation.id,
      'settlement',
      0,
      final_cost,
      reservation.model_key,
      'Settled completed job',
      concat('settlement:', reservation.id)
    )
    on conflict (idempotency_key) do nothing;
  end if;

  update public.jobs
  set
    error_code = null,
    error_message = null,
    finished_at = now(),
    progress = 100,
    result = p_result,
    stage = left(p_stage, 160),
    status = 'completed'
  where id = p_job_id;

  return jsonb_build_object(
    'status', 'settled',
    'creditsConsumed', reservation.credits_reserved,
    'providerCostMicros', coalesce(final_cost, reservation.actual_provider_cost_micros)
  );
end;
$$;

create or replace function public.fail_job_with_credits(
  p_job_id uuid,
  p_attempt integer,
  p_error_code text,
  p_error_message text,
  p_stage text,
  p_force_terminal boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  job public.jobs%rowtype;
  reservation public.credit_reservations%rowtype;
  exhausted boolean;
  disposition text := 'held_for_retry';
begin
  select * into job from public.jobs where id = p_job_id for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'BILLING_JOB_NOT_FOUND';
  end if;

  exhausted := p_force_terminal or p_attempt >= job.max_attempts;

  update public.jobs
  set
    attempt = greatest(attempt, p_attempt),
    error_code = left(p_error_code, 120),
    error_message = left(p_error_message, 1000),
    finished_at = case when exhausted then now() else null end,
    progress = 0,
    stage = left(p_stage, 160),
    status = case when exhausted then 'failed'::public.job_status else 'retrying'::public.job_status end
  where id = p_job_id;

  if exhausted then
    select * into reservation
    from public.credit_reservations
    where job_id = p_job_id
    for update;

    if found and reservation.status = 'reserved' then
      perform 1 from public.billing_accounts where user_id = job.user_id for update;
      update public.credit_accounts
      set reserved_credits = reserved_credits - reservation.credits_reserved
      where id = reservation.credit_account_id;

      if reservation.provider_started_at is null then
        disposition := 'released';
        update public.credit_reservations
        set
          failure_reason = left(p_error_message, 500),
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
          'Released credits because the job failed before provider billing',
          concat('release:', reservation.id)
        )
        on conflict (idempotency_key) do nothing;
      else
        disposition := 'settled_after_provider_start';
        update public.credit_accounts
        set consumed_credits = consumed_credits + reservation.credits_reserved
        where id = reservation.credit_account_id;

        update public.credit_reservations
        set
          actual_provider_cost_micros = null,
          failure_reason = left(p_error_message, 500),
          settled_at = now(),
          status = 'settled'
        where id = reservation.id;

        insert into public.credit_ledger (
          user_id,
          credit_account_id,
          reservation_id,
          entry_type,
          credits_delta,
          provider_cost_micros,
          model_key,
          description,
          idempotency_key
        )
        values (
          reservation.user_id,
          reservation.credit_account_id,
          reservation.id,
          'settlement',
          0,
          reservation.estimated_provider_cost_micros,
          reservation.model_key,
          'Settled terminal failure after provider billing began',
          concat('settlement:', reservation.id)
        )
        on conflict (idempotency_key) do nothing;
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'exhausted', exhausted,
    'creditDisposition', disposition
  );
end;
$$;

create or replace function public.get_my_credit_summary()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  billing public.billing_accounts%rowtype;
  entitlement public.billing_plan_entitlements%rowtype;
  account public.credit_accounts%rowtype;
  active_count integer := 0;
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;

  select * into billing
  from public.billing_accounts
  where user_id = current_user_id;

  if not found or billing.plan_key is null then
    return jsonb_build_object(
      'active', false,
      'plan', null,
      'status', billing.subscription_status,
      'allocatedCredits', 0,
      'reservedCredits', 0,
      'consumedCredits', 0,
      'remainingCredits', 0,
      'activeGenerations', 0
    );
  end if;

  select * into entitlement
  from public.billing_plan_entitlements
  where plan_key = billing.plan_key;

  select * into account
  from public.credit_accounts
  where user_id = current_user_id
    and period_start = billing.current_period_start
  order by period_start desc
  limit 1;

  select count(*) into active_count
  from public.credit_reservations
  where user_id = current_user_id and status = 'reserved';

  return jsonb_build_object(
    'active', billing.subscription_status in ('active', 'trialing')
      and billing.current_period_end is not null
      and now() < billing.current_period_end,
    'plan', billing.plan_key,
    'status', billing.subscription_status,
    'periodStart', billing.current_period_start,
    'periodEnd', billing.current_period_end,
    'allocatedCredits', coalesce(account.allocated_credits, 0),
    'reservedCredits', coalesce(account.reserved_credits, 0),
    'consumedCredits', coalesce(account.consumed_credits, 0),
    'remainingCredits', coalesce(account.allocated_credits - account.reserved_credits - account.consumed_credits, 0),
    'activeGenerations', active_count,
    'concurrencyLimit', entitlement.concurrency_limit,
    'hourlyGenerationLimit', entitlement.hourly_generation_limit
  );
end;
$$;

revoke all on function public.sync_credit_period(uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.reserve_job_credits(uuid, uuid, text, text, text, integer, bigint, text) from public, anon, authenticated;
revoke all on function public.mark_job_provider_started(uuid) from public, anon, authenticated;
revoke all on function public.complete_job_with_credits(uuid, text, jsonb, bigint) from public, anon, authenticated;
revoke all on function public.fail_job_with_credits(uuid, integer, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.get_my_credit_summary() from public, anon;

grant execute on function public.sync_credit_period(uuid, text, timestamptz, timestamptz) to service_role;
grant execute on function public.reserve_job_credits(uuid, uuid, text, text, text, integer, bigint, text) to service_role;
grant execute on function public.mark_job_provider_started(uuid) to service_role;
grant execute on function public.complete_job_with_credits(uuid, text, jsonb, bigint) to service_role;
grant execute on function public.fail_job_with_credits(uuid, integer, text, text, text, boolean) to service_role;
grant execute on function public.get_my_credit_summary() to authenticated;

commit;
