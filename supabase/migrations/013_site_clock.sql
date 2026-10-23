begin;
create function public.site_clock() returns timestamptz language sql volatile set search_path=pg_catalog as $$ select clock_timestamp() $$;
revoke execute on function public.site_clock() from public;
grant execute on function public.site_clock() to anon,authenticated,service_role;
notify pgrst,'reload schema';
commit;
