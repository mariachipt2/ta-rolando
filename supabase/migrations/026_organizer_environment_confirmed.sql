begin;
alter table public.organizer_profiles add column environment text check(environment in ('coberto','ao_ar_livre','misto'));
comment on column public.organizer_profiles.environment is 'Ambiente padrão do local usado pelo organizador, editável em cada evento.';
-- Confirmado diretamente pela Maria: Garajão coberto, Estação do Chopp misto.
update venues set environment=case when name='Garajão' then 'coberto' else 'misto' end
 where city='Ipatinga' and name in ('Garajão','Estação do Chopp');
-- Reuse existing contact/address data, without inventing new contacts or changing event addresses.
insert into organizer_profiles(id,source_key,name,venue_name,address,neighborhood,city,state,instagram_url,environment)
select gen_random_uuid(),'venue:'||v.id,v.name,v.name,coalesce(nullif(v.address,''),e.address,''),coalesce(nullif(v.neighborhood,''),e.neighborhood,''),v.city,v.state,coalesce(nullif(v.instagram_url,''),e.instagram_url,''),v.environment
from venues v left join lateral (
 select address,neighborhood,instagram_url from events where deleted_at is null and city=v.city and venue_name=v.name order by updated_at desc,id limit 1
) e on true
where v.city='Ipatinga' and v.name in ('Garajão','Estação do Chopp')
 and not exists(select 1 from organizer_profiles p where p.city=v.city and (p.venue_name=v.name or p.name=v.name));
update organizer_profiles set environment=case when venue_name in ('Garajão','Garajão - Ipatinga') or (venue_name='' and name='Garajão') then 'coberto' else 'misto' end
where city='Ipatinga' and (venue_name in ('Garajão','Garajão - Ipatinga','Estação do Chopp') or (venue_name='' and name in ('Garajão','Estação do Chopp')));
update events set environment=case when venue_name in ('Garajão','Garajão - Ipatinga') then 'coberto' else 'misto' end
where deleted_at is null and city='Ipatinga' and venue_name in ('Garajão','Garajão - Ipatinga','Estação do Chopp')
and environment is distinct from case when venue_name in ('Garajão','Garajão - Ipatinga') then 'coberto' else 'misto' end;
notify pgrst,'reload schema';
commit;
