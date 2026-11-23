begin;
alter table public.events add column environment text check(environment in ('coberto','ao_ar_livre','misto'));
alter table public.venues add column environment text check(environment in ('coberto','ao_ar_livre','misto'));
comment on column public.events.environment is 'Cobertura da área usada pelo evento; NULL significa não confirmada. Não é previsão meteorológica.';
comment on column public.venues.environment is 'Sugestão de cobertura do local; pode ser ajustada em cada evento.';
do $$
declare definition text; view_name text;
begin
 foreach view_name in array array['public_events','admin_events'] loop
  definition=rtrim(pg_get_viewdef(('public.'||view_name)::regclass,true), E';\n ');
  execute format('create or replace view public.%I as select base.*,e.environment from (%s) base join public.events e on e.id=base.id',view_name,definition);
 end loop;
 definition=pg_get_functiondef('public.insert_event_data(jsonb,text)'::regprocedure);
 if position('artist_ids,time_tbd)' in definition)=0 or position('coalesce(e.time_tbd,false)) returning' in definition)=0 then raise exception 'Unexpected insert_event_data definition';end if;
 definition=replace(definition,'artist_ids,time_tbd)','artist_ids,time_tbd,environment)');
 definition=replace(definition,'coalesce(e.time_tbd,false)) returning','coalesce(e.time_tbd,false),e.environment) returning');execute definition;
 definition=pg_get_functiondef('public.restore_event_version(uuid)'::regprocedure);
 if position('update events set time_tbd=' in definition)=0 then raise exception 'Unexpected restore_event_version definition';end if;
 definition=replace(definition,'update events set time_tbd=','update events set environment=case when v.snapshot ? ''environment'' then e.environment else events.environment end,time_tbd=');execute definition;
 definition=pg_get_functiondef('public.event_change_notice()'::regprocedure);
 if position('new.time_tbd)' in definition)=0 then raise exception 'Unexpected event_change_notice definition';end if;
 definition=replace(replace(definition,'new.time_tbd)','new.time_tbd,new.environment)'),'old.time_tbd)','old.time_tbd,old.environment)');execute definition;
 definition=pg_get_functiondef('public.save_venue(uuid,jsonb)'::regprocedure);
 if position('active,share_enabled)' in definition)=0 or position('coalesce(v.share_enabled,true))' in definition)=0 then raise exception 'Unexpected save_venue definition';end if;
 definition=replace(definition,'active,share_enabled)','active,share_enabled,environment)');
 definition=replace(definition,'coalesce(v.share_enabled,true))','coalesce(v.share_enabled,true),v.environment)');
 definition=replace(definition,'share_enabled=excluded.share_enabled','share_enabled=excluded.share_enabled,environment=case when p_data ? ''environment'' then excluded.environment else venues.environment end');execute definition;
 definition=pg_get_functiondef('public.submission_venue(uuid)'::regprocedure);
 definition=replace(definition,'''instagram_url'',instagram_url)','''instagram_url'',instagram_url,''environment'',environment)');execute definition;
end $$;
-- A public, limited directory only for venues explicitly enabled for sharing.
create function public.venue_directory() returns table(name text,neighborhood text,environment text,city text,state text)
language sql stable security definer set search_path=public as $$
 select name,neighborhood,environment,city,state from public.venues where active and share_enabled order by name,id
$$;
revoke execute on function public.venue_directory() from public;
grant execute on function public.venue_directory() to anon,authenticated,service_role;
-- Initial dictionary: no existing event or venue is overwritten. Unknown shelter stays NULL.
insert into public.venues(name,neighborhood,environment,address,kind,share_enabled,created_at,updated_at)
select seed.name,seed.neighborhood,seed.environment,'','other',true,now(),now() from (values
 ('Garajão','Novo Centro',null::text),
 ('Estação do Chopp','',null),
 ('Mansão Music Hall','Veneza',null),
 ('Dedo de Prosa Casa Bistrô','Iguaçu',null),
 ('Mais Eventos','Cidade Nobre',null),
 ('Butiquim Carioca','Veneza',null),
 ('Bar da Santa','Cariru',null),
 ('The House Pub','Iguaçu',null),
 ('Pizzaria do Jayme','Iguaçu',null),
 ('Meat House 360°','Cidade Nobre',null),
 ('Centro Cultural Usiminas','Industrial','misto'),
 ('Teatro do Centro Cultural Usiminas','Industrial','coberto'),
 ('Parque Ipanema','Veneza','ao_ar_livre')
) seed(name,neighborhood,environment)
where not exists(select 1 from public.venues v where lower(trim(v.name))=lower(seed.name) and lower(trim(v.city))='ipatinga');
notify pgrst,'reload schema';
commit;
