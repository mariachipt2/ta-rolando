begin;
-- Publish only aggregate engagement for events already visible to visitors.
do $$
declare definition text;
begin
 definition=rtrim(pg_get_viewdef('public.public_events'::regclass,true), E';\n ');
 execute format('create or replace view public.public_events as
 select base.*,coalesce(activity.views,0)::bigint as recent_views,
 coalesce(activity.ticket_clicks,0)::bigint as recent_ticket_clicks
 from (%s) base left join lateral (
   select sum(m.views) as views,sum(m.ticket_clicks) as ticket_clicks
   from public.event_metrics m where m.event_id=base.id
   and m.day between (now() at time zone ''America/Sao_Paulo'')::date-6
     and (now() at time zone ''America/Sao_Paulo'')::date
 ) activity on true',definition);
end $$;
notify pgrst,'reload schema';
commit;
