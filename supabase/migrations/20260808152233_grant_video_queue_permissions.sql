begin;

-- PGMQ functions are security invoker. Executing the RPC wrappers is not
-- sufficient: the trusted server role also needs the table privileges used by
-- send, read, and archive.
grant select, insert, update, delete
on table pgmq.q_video_processing
to service_role;

grant select, insert
on table pgmq.a_video_processing
to service_role;

commit;
