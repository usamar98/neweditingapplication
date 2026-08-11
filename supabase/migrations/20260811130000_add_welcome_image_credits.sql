-- Adds an explicitly claimed, one-time image allowance after paid billing is installed.
begin;

alter table public.billing_plan_entitlements
  drop constraint if exists billing_plan_entitlements_plan_key_check,
  drop constraint if exists billing_plan_entitlements_monthly_price_cents_check;

alter table public.billing_plan_entitlements
  add constraint billing_plan_entitlements_plan_key_check
    check (plan_key in ('welcome', 'creator', 'studio', 'business')),
  add constraint billing_plan_entitlements_monthly_price_cents_check
    check (monthly_price_cents >= 0);

insert into public.billing_plan_entitlements (
  plan_key,
  monthly_credits,
  concurrency_limit,
  hourly_generation_limit,
  monthly_price_cents
)
values ('welcome', 20, 1, 4, 0)
on conflict (plan_key) do update
set
  monthly_credits = excluded.monthly_credits,
  concurrency_limit = excluded.concurrency_limit,
  hourly_generation_limit = excluded.hourly_generation_limit,
  monthly_price_cents = excluded.monthly_price_cents,
  updated_at = now();

create unique index credit_accounts_one_welcome_per_user_idx
on public.credit_accounts (user_id)
where plan_key = 'welcome';

create or replace function public.claim_welcome_credits(
  p_user_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account public.credit_accounts%rowtype;
  claim_time timestamptz := now();
  claimed_now boolean := false;
begin
  if p_user_id is null then
    raise exception using errcode = 'P0001', message = 'INVALID_USER';
  end if;

  insert into public.credit_accounts (
    user_id,
    plan_key,
    period_start,
    period_end,
    allocated_credits
  )
  values (
    p_user_id,
    'welcome',
    claim_time,
    claim_time + interval '100 years',
    20
  )
  on conflict (user_id) where plan_key = 'welcome' do nothing
  returning * into account;

  claimed_now := found;

  if not claimed_now then
    select * into account
    from public.credit_accounts
    where user_id = p_user_id and plan_key = 'welcome'
    for update;
  end if;

  if account.id is null then
    raise exception using errcode = 'P0001', message = 'WELCOME_CLAIM_FAILED';
  end if;

  if claimed_now then
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
      20,
      'One-time welcome image credit allocation',
      concat('welcome-allocation:', p_user_id)
    )
    on conflict (idempotency_key) do nothing;
  end if;

  return jsonb_build_object(
    'accountId', account.id,
    'claimedNow', claimed_now,
    'allocatedCredits', account.allocated_credits,
    'remainingCredits', account.allocated_credits - account.reserved_credits - account.consumed_credits
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
  paid_active boolean := false;
  access_mode text;
  active_count integer;
  hourly_count integer;
  remaining integer;
  stale_job record;
begin
  if p_credits <= 0 or p_estimated_provider_cost_micros < 0 then
    raise exception using errcode = 'P0001', message = 'INVALID_CREDIT_QUOTE';
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

  select * into billing
  from public.billing_accounts
  where user_id = p_user_id
  for update;

  paid_active := billing.user_id is not null
    and billing.subscription_status in ('active', 'trialing')
    and billing.plan_key is not null
    and billing.current_period_start is not null
    and billing.current_period_end is not null
    and now() >= billing.current_period_start
    and now() < billing.current_period_end;

  if paid_active then
    access_mode := 'paid';

    select * into entitlement
    from public.billing_plan_entitlements
    where plan_key = billing.plan_key;
    if not found or entitlement.plan_key = 'welcome' then
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
  else
    access_mode := 'welcome';

    if p_operation_key <> 'generate_image' then
      raise exception using errcode = 'P0001', message = 'SUBSCRIPTION_REQUIRED';
    end if;

    if p_model_key <> 'fal-ai/flux-2/turbo' or p_credits <> 5 then
      raise exception using errcode = 'P0001', message = 'WELCOME_MODEL_RESTRICTED';
    end if;

    select * into entitlement
    from public.billing_plan_entitlements
    where plan_key = 'welcome';

    select * into account
    from public.credit_accounts
    where user_id = p_user_id and plan_key = 'welcome'
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'WELCOME_CREDITS_NOT_CLAIMED';
    end if;
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
    'accessMode', access_mode,
    'idempotent', false
  );
end;
$$;

create or replace function public.get_my_credit_summary()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  billing public.billing_accounts%rowtype;
  paid_entitlement public.billing_plan_entitlements%rowtype;
  welcome_entitlement public.billing_plan_entitlements%rowtype;
  display_entitlement public.billing_plan_entitlements%rowtype;
  paid_account public.credit_accounts%rowtype;
  welcome_account public.credit_accounts%rowtype;
  display_account public.credit_accounts%rowtype;
  paid_active boolean := false;
  active_count integer := 0;
  welcome_remaining integer := 0;
  access_mode text := 'none';
begin
  if current_user_id is null then
    raise exception using errcode = 'P0001', message = 'UNAUTHENTICATED';
  end if;

  select * into billing
  from public.billing_accounts
  where user_id = current_user_id;

  paid_active := billing.user_id is not null
    and billing.subscription_status in ('active', 'trialing')
    and billing.plan_key is not null
    and billing.current_period_start is not null
    and billing.current_period_end is not null
    and now() >= billing.current_period_start
    and now() < billing.current_period_end;

  if paid_active then
    select * into paid_entitlement
    from public.billing_plan_entitlements
    where plan_key = billing.plan_key;

    select * into paid_account
    from public.credit_accounts
    where user_id = current_user_id
      and period_start = billing.current_period_start
    order by period_start desc
    limit 1;
  end if;

  select * into welcome_entitlement
  from public.billing_plan_entitlements
  where plan_key = 'welcome';

  select * into welcome_account
  from public.credit_accounts
  where user_id = current_user_id and plan_key = 'welcome'
  order by created_at desc
  limit 1;

  if welcome_account.id is not null then
    welcome_remaining := greatest(
      0,
      welcome_account.allocated_credits - welcome_account.reserved_credits - welcome_account.consumed_credits
    );
  end if;

  if paid_active then
    access_mode := 'paid';
    display_account := paid_account;
    display_entitlement := paid_entitlement;
  elsif welcome_account.id is not null then
    if welcome_remaining >= 5 then
      access_mode := 'welcome';
    end if;
    display_account := welcome_account;
    display_entitlement := welcome_entitlement;
  end if;

  select count(*) into active_count
  from public.credit_reservations
  where user_id = current_user_id and status = 'reserved';

  return jsonb_build_object(
    'active', paid_active,
    'accessMode', access_mode,
    'plan', case
      when paid_active then billing.plan_key
      when welcome_account.id is not null then 'welcome'
      else null
    end,
    'status', billing.subscription_status,
    'periodStart', case when paid_active then billing.current_period_start else null end,
    'periodEnd', case when paid_active then billing.current_period_end else null end,
    'allocatedCredits', coalesce(display_account.allocated_credits, 0),
    'reservedCredits', coalesce(display_account.reserved_credits, 0),
    'consumedCredits', coalesce(display_account.consumed_credits, 0),
    'remainingCredits', greatest(
      0,
      coalesce(display_account.allocated_credits - display_account.reserved_credits - display_account.consumed_credits, 0)
    ),
    'activeGenerations', active_count,
    'concurrencyLimit', coalesce(display_entitlement.concurrency_limit, 0),
    'hourlyGenerationLimit', coalesce(display_entitlement.hourly_generation_limit, 0),
    'canClaimWelcomeCredits', welcome_account.id is null,
    'welcomeClaimed', welcome_account.id is not null,
    'welcomeRemainingCredits', welcome_remaining,
    'welcomeImagesRemaining', floor(welcome_remaining / 5.0)::integer
  );
end;
$$;

revoke all on function public.claim_welcome_credits(uuid) from public, anon, authenticated;
grant execute on function public.claim_welcome_credits(uuid) to service_role;

revoke all on function public.reserve_job_credits(uuid, uuid, text, text, text, integer, bigint, text) from public, anon, authenticated;
grant execute on function public.reserve_job_credits(uuid, uuid, text, text, text, integer, bigint, text) to service_role;

revoke all on function public.get_my_credit_summary() from public, anon;
grant execute on function public.get_my_credit_summary() to authenticated;

commit;
