-- Retire the one-time welcome allocation while preserving historical ledger rows.
begin;

drop function if exists public.claim_welcome_credits(uuid);

create or replace function app_private.reject_retired_welcome_reservations()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.credit_accounts account
    where account.id = new.credit_account_id
      and account.plan_key = 'welcome'
  ) then
    raise exception using errcode = 'P0001', message = 'SUBSCRIPTION_REQUIRED';
  end if;
  return new;
end;
$$;

revoke all on function app_private.reject_retired_welcome_reservations()
from public, anon, authenticated;

drop trigger if exists credit_reservations_reject_retired_welcome
on public.credit_reservations;

create trigger credit_reservations_reject_retired_welcome
before insert on public.credit_reservations
for each row execute function app_private.reject_retired_welcome_reservations();

comment on table public.billing_plan_entitlements is
  'Paid plan configuration. The legacy welcome row is retained only for historical credit-account foreign keys.';

commit;
