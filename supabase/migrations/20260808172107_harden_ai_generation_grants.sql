revoke all privileges on table public.generations from public, anon, authenticated;

grant select on table public.generations to authenticated;
grant all privileges on table public.generations to service_role;
