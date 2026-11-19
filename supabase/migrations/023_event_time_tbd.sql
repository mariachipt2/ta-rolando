begin;
alter table public.events add column time_tbd boolean not null default false;
create function public.normalize_event_time() returns trigger language plpgsql set search_path=public as $$
begin
 if new.time_tbd then
  if new.ends_at is not null then raise exception 'Deixe o encerramento vazio enquanto o horário estiver a confirmar.';end if;
  new.starts_at=date_trunc('day',new.starts_at at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
 end if;
 return new;
end $$;
create trigger events_00_time before insert or update of starts_at,ends_at,time_tbd on public.events for each row execute function public.normalize_event_time();
revoke execute on function public.normalize_event_time() from public,anon,authenticated;
do $$
declare definition text; view_name text;
begin
 foreach view_name in array array['public_events','admin_events'] loop
  definition=rtrim(pg_get_viewdef(('public.'||view_name)::regclass,true), E';\n ');
  execute format('create or replace view public.%I as select base.*,e.time_tbd from (%s) base join public.events e on e.id=base.id',view_name,definition);
 end loop;
 definition=pg_get_functiondef('public.insert_event_data(jsonb,text)'::regprocedure);
 if position('recurrence_index,artist_ids)' in definition)=0 then raise exception 'Unexpected insert_event_data definition';end if;
 definition=replace(definition,'recurrence_index,artist_ids)','recurrence_index,artist_ids,time_tbd)');
 definition=replace(definition,'coalesce(e.artist_ids,''{}'')) returning','coalesce(e.artist_ids,''{}''),coalesce(e.time_tbd,false)) returning');
 execute definition;
 definition=pg_get_functiondef('public.restore_event_version(uuid)'::regprocedure);
 definition=replace(definition,'update events set title=e.title','update events set time_tbd=coalesce(e.time_tbd,false),title=e.title');
 execute definition;
 definition=pg_get_functiondef('public.event_change_notice()'::regprocedure);
 definition=replace(replace(definition,'new.artist_ids)','new.artist_ids,new.time_tbd)'),'old.artist_ids)','old.artist_ids,old.time_tbd)');
 execute definition;
end $$;
notify pgrst,'reload schema';
commit;
