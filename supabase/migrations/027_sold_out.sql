begin;
alter table public.events add column sold_out boolean not null default false;
comment on column public.events.sold_out is 'Ingressos esgotados: ocultar das vitrines de descoberta, preservando cadastro e link direto.';
do $$
declare definition text; view_name text;
begin
 foreach view_name in array array['public_events','admin_events'] loop
  definition=rtrim(pg_get_viewdef(('public.'||view_name)::regclass,true), E';\n ');
  execute format('create or replace view public.%I as select base.*,e.sold_out from (%s) base join public.events e on e.id=base.id',view_name,definition);
 end loop;
 definition=pg_get_functiondef('public.insert_event_data(jsonb,text)'::regprocedure);
 if position('time_tbd,environment)' in definition)=0 or position('e.environment) returning' in definition)=0 then raise exception 'Unexpected insert_event_data definition';end if;
 definition=replace(definition,'time_tbd,environment)','time_tbd,environment,sold_out)');
 definition=replace(definition,'e.environment) returning','e.environment,coalesce(e.sold_out,false)) returning');execute definition;
 definition=pg_get_functiondef('public.restore_event_version(uuid)'::regprocedure);
 if position('update events set environment=' in definition)=0 then raise exception 'Unexpected restore_event_version definition';end if;
 definition=replace(definition,'update events set environment=','update events set sold_out=case when v.snapshot ? ''sold_out'' then coalesce(e.sold_out,false) else events.sold_out end,environment=');execute definition;
 definition=pg_get_functiondef('public.event_change_notice()'::regprocedure);
 if position('new.environment)' in definition)=0 then raise exception 'Unexpected event_change_notice definition';end if;
 definition=replace(replace(definition,'new.environment)','new.environment,new.sold_out)'),'old.environment)','old.environment,old.sold_out)');execute definition;
end $$;
notify pgrst,'reload schema';
commit;
