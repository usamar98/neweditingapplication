begin;

create extension if not exists pgtap with schema extensions;
select plan(39);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.jobs'::regclass), 'jobs has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.usage_events'::regclass), 'usage_events has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.request_counters'::regclass), 'request_counters has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.generations'::regclass), 'generations has RLS');

select is(
  (select count(*)::integer from storage.buckets where id in ('video-sources', 'video-outputs', 'video-assets') and not public),
  3,
  'all video buckets are private'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'video_files_%'),
  4,
  'storage has ownership policies for all CRUD operations'
);

select ok(has_table_privilege('authenticated', 'public.jobs', 'SELECT'), 'authenticated users can read owned jobs');
select ok(not has_table_privilege('authenticated', 'public.jobs', 'INSERT'), 'authenticated users cannot forge jobs');
select ok(not has_table_privilege('authenticated', 'public.jobs', 'UPDATE'), 'authenticated users cannot forge progress');
select ok(has_table_privilege('authenticated', 'public.usage_events', 'SELECT'), 'authenticated users can read owned usage');
select ok(not has_table_privilege('authenticated', 'public.usage_events', 'INSERT'), 'authenticated users cannot forge usage');
select ok(not has_table_privilege('authenticated', 'public.request_counters', 'UPDATE'), 'authenticated users cannot reset rate counters');
select ok(not has_table_privilege('authenticated', 'public.request_counters', 'DELETE'), 'authenticated users cannot delete rate counters');

select ok(has_function_privilege('authenticated', 'public.consume_rate_limit(text,integer,integer)', 'EXECUTE'), 'authenticated can call rate limiter');
select ok(not has_function_privilege('authenticated', 'public.queue_video_job(jsonb)', 'EXECUTE'), 'authenticated cannot submit arbitrary queue messages');
select ok(has_function_privilege('service_role', 'public.queue_video_job(jsonb)', 'EXECUTE'), 'service role can submit queue messages');
select ok(has_table_privilege('authenticated', 'public.generations', 'SELECT'), 'authenticated users can read owned generations');
select ok(not has_table_privilege('anon', 'public.generations', 'SELECT'), 'anonymous users cannot read generations');
select ok(not has_table_privilege('authenticated', 'public.generations', 'INSERT'), 'authenticated users cannot forge generation state');
select ok(has_table_privilege('service_role', 'public.generations', 'INSERT'), 'service role can create generations');
select ok(has_column('public', 'jobs', 'generation_id'), 'jobs can target a generation');
select ok(has_column('public', 'jobs', 'dismissed_at'), 'jobs can be hidden from the workspace without deleting billing records');
select ok(has_column('public', 'generations', 'dismissed_at'), 'generations can be hidden from the workspace without deleting billing records');
select ok(not has_function_privilege('authenticated', 'public.dismiss_job_admin(uuid,uuid)', 'EXECUTE'), 'authenticated clients cannot call the privileged job dismissal function');
select ok(not has_function_privilege('authenticated', 'public.dismiss_generation_admin(uuid,uuid)', 'EXECUTE'), 'authenticated clients cannot call the privileged generation dismissal function');
select ok(has_function_privilege('service_role', 'public.dismiss_job_admin(uuid,uuid)', 'EXECUTE'), 'service role can atomically dismiss owned jobs');
select ok(has_function_privilege('service_role', 'public.dismiss_generation_admin(uuid,uuid)', 'EXECUTE'), 'service role can atomically dismiss owned generations');
select ok(
  exists(select 1 from pg_trigger where tgrelid = 'public.jobs'::regclass and tgname = 'jobs_preserve_cancelled_state' and not tgisinternal),
  'cancelled jobs cannot be reopened by a worker race'
);
select ok(has_table_privilege('service_role', 'pgmq.q_video_processing', 'SELECT'), 'service role can inspect queued messages');
select ok(has_table_privilege('service_role', 'pgmq.q_video_processing', 'INSERT'), 'service role can enqueue messages');
select ok(has_table_privilege('service_role', 'pgmq.q_video_processing', 'UPDATE'), 'service role can claim messages');
select ok(has_table_privilege('service_role', 'pgmq.q_video_processing', 'DELETE'), 'service role can remove archived messages');
select ok(has_table_privilege('service_role', 'pgmq.a_video_processing', 'SELECT'), 'service role can inspect archived messages');
select ok(has_table_privilege('service_role', 'pgmq.a_video_processing', 'INSERT'), 'service role can archive messages');
select ok(
  exists(select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'jobs'),
  'jobs publishes Realtime changes'
);
select ok(
  exists(select 1 from pg_indexes where schemaname = 'public' and indexname = 'jobs_one_active_kind_per_project_idx'),
  'active jobs have a concurrency guard'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'pgmq.q_video_processing'::regclass)
  and (select relrowsecurity from pg_class where oid = 'pgmq.a_video_processing'::regclass),
  'queue and archive tables have RLS'
);

select * from finish();
rollback;
