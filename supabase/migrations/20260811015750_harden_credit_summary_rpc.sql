begin;

create policy billing_plan_entitlements_select_authenticated
on public.billing_plan_entitlements
for select
to authenticated
using (true);

alter function public.get_my_credit_summary()
security invoker;

commit;
