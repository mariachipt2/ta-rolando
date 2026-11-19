begin;

create table public.artists (
  id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 180),
  name text not null check (length(trim(name)) between 2 and 160),
  kind text not null default 'cantor' check (kind in ('cantor','banda','dj','outro')),
  genre text not null default '' check (length(genre) <= 160),
  bio text not null default '' check (length(bio) <= 1000),
  instagram_url text not null default '',
  photo_url text not null default '',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.artists enable row level security;
revoke all on public.artists from anon, authenticated;
grant select on public.artists to anon, authenticated;
grant insert, update on public.artists to authenticated;
grant all on public.artists to service_role;
create policy artists_read on public.artists for select to anon, authenticated using (active or public.is_admin());
create policy artists_insert on public.artists for insert to authenticated with check (public.is_admin());
create policy artists_update on public.artists for update to authenticated using (public.is_admin()) with check (public.is_admin());
create trigger artists_updated before update on public.artists for each row execute function public.touch_event();
create trigger artists_receipt after insert or update on public.artists for each row execute function public.record_admin_save();

alter table public.events add column artist_ids uuid[] not null default '{}'
  check (cardinality(artist_ids) <= 20 and array_position(artist_ids,null) is null);

create table public.event_artists (
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.artists(id),
  primary key (event_id,artist_id)
);
create index event_artists_artist_idx on public.event_artists(artist_id,event_id);
alter table public.event_artists enable row level security;
revoke all on public.event_artists from anon, authenticated;
grant select on public.event_artists to anon, authenticated;
grant all on public.event_artists to service_role;
create function public.artist_event_visible(p_event uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.events e join public.categories c on c.id=e.category_id
    where e.id=p_event and e.deleted_at is null and c.active
    and (e.status in ('published','cancelled') or (e.status='scheduled' and e.publish_at<=now())));
$$;
revoke execute on function public.artist_event_visible(uuid) from public;
grant execute on function public.artist_event_visible(uuid) to anon,authenticated;
create policy event_artists_read on public.event_artists for select to anon, authenticated using (
  public.is_admin() or (
    exists (select 1 from public.artists a where a.id=artist_id and a.active)
    and public.artist_event_visible(event_id)
  )
);

create function public.validate_event_artists() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if cardinality(new.artist_ids)>20 or array_position(new.artist_ids,null) is not null then
    raise exception 'Selecione até 20 artistas válidos.';
  end if;
  if exists (select 1 from unnest(new.artist_ids) artist_id where not exists (select 1 from artists where id=artist_id)) then
    raise exception 'Artista não encontrado. Recarregue a lista antes de salvar.';
  end if;
  new.artist_ids = array(select distinct artist_id from unnest(new.artist_ids) artist_id order by artist_id);
  return new;
end $$;
create trigger events_artists_validate before insert or update of artist_ids on public.events
  for each row execute function public.validate_event_artists();

create function public.sync_event_artists() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  delete from event_artists where event_id=new.id and not (artist_id=any(new.artist_ids));
  insert into event_artists(event_id,artist_id) select new.id,artist_id from unnest(new.artist_ids) artist_id on conflict do nothing;
  return null;
end $$;
create trigger events_sync_artists after insert or update of artist_ids on public.events
  for each row execute function public.sync_event_artists();
revoke execute on function public.validate_event_artists(),public.sync_event_artists() from public,anon,authenticated;

do $$
declare definition text; view_name text; active_filter text;
begin
  foreach view_name in array array['public_events','admin_events'] loop
    definition = rtrim(pg_get_viewdef(('public.'||view_name)::regclass,true), E';\n ');
    active_filter = case when view_name='public_events' then ' and a.active' else '' end;
    execute format('create or replace view public.%I as select base.*,e.artist_ids,
      coalesce((select jsonb_agg(to_jsonb(a) order by a.name,a.id) from public.artists a
        join public.event_artists ea on ea.artist_id=a.id where ea.event_id=e.id%s),''[]''::jsonb) as artists
      from (%s) base join public.events e on e.id=base.id',view_name,active_filter,definition);
  end loop;
end $$;

create or replace function public.insert_event_data(p_data jsonb,p_slug text) returns public.events language plpgsql security definer set search_path=public as $$
declare e events%rowtype;result events%rowtype;begin
 e=jsonb_populate_record(null::events,p_data);
 insert into events(slug,title,description,category_id,starts_at,ends_at,venue_name,address,neighborhood,city,state,organizer,is_free,price,ticket_url,age_rating,cover_url,gallery,additional_info,status,publish_at,featured,instagram_url,family_friendly,change_notice,recurrence_group,recurrence_index,artist_ids)
 values(p_slug,e.title,e.description,e.category_id,e.starts_at,e.ends_at,e.venue_name,e.address,coalesce(e.neighborhood,''),coalesce(e.city,'Ipatinga'),coalesce(e.state,'MG'),coalesce(e.organizer,''),coalesce(e.is_free,true),coalesce(e.price,''),coalesce(e.ticket_url,''),coalesce(e.age_rating,'Livre'),coalesce(e.cover_url,''),coalesce(e.gallery,'[]'),coalesce(e.additional_info,''),e.status,e.publish_at,coalesce(e.featured,false),coalesce(e.instagram_url,''),e.family_friendly,coalesce(e.change_notice,''),e.recurrence_group,e.recurrence_index,coalesce(e.artist_ids,'{}')) returning * into result;return result;
end$$;
create or replace function public.restore_event_version(p_version uuid) returns jsonb language plpgsql security definer set search_path=public as $$declare v event_versions%rowtype;e events%rowtype;r events%rowtype;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 select * into v from event_versions where id=p_version;if not found then raise exception 'Versão não encontrada';end if;
 e=jsonb_populate_record(null::events,v.snapshot);perform set_config('app.event_history_action','version_restored',true);
 update events set title=e.title,description=e.description,category_id=e.category_id,starts_at=e.starts_at,ends_at=e.ends_at,venue_name=e.venue_name,address=e.address,neighborhood=e.neighborhood,city=e.city,state=e.state,organizer=e.organizer,is_free=e.is_free,price=e.price,ticket_url=e.ticket_url,age_rating=e.age_rating,cover_url=e.cover_url,gallery=e.gallery,additional_info=e.additional_info,status=e.status,publish_at=e.publish_at,featured=e.featured,instagram_url=e.instagram_url,family_friendly=e.family_friendly,change_notice=e.change_notice,artist_ids=case when v.snapshot ? 'artist_ids' then coalesce(e.artist_ids,'{}') else events.artist_ids end where id=v.event_id returning * into r;
 if not found then raise exception 'Evento não encontrado';end if;return jsonb_build_object('id',r.id,'saved_at',r.updated_at);end$$;

create or replace function public.event_change_notice() returns trigger language plpgsql set search_path=public as $$begin
 if old.deleted_at is not null and new.deleted_at is null then
  new.change_at=clock_timestamp();new.change_notice='Evento disponível novamente. Confira os detalhes.';
 elsif (old.status in ('published','cancelled') or (old.status='scheduled' and old.publish_at<=now())) and
  (row(new.title,new.description,new.starts_at,new.ends_at,new.venue_name,new.address,new.price,new.is_free,new.status,new.family_friendly,new.age_rating,new.ticket_url,new.neighborhood,new.city,new.state,new.organizer,new.additional_info,new.instagram_url,new.category_id,new.artist_ids) is distinct from row(old.title,old.description,old.starts_at,old.ends_at,old.venue_name,old.address,old.price,old.is_free,old.status,old.family_friendly,old.age_rating,old.ticket_url,old.neighborhood,old.city,old.state,old.organizer,old.additional_info,old.instagram_url,old.category_id,old.artist_ids)) then
  new.change_at=clock_timestamp();
  if new.status='cancelled' then new.change_notice='Este evento foi cancelado.';
  elsif new.change_notice='' or new.change_notice=old.change_notice then new.change_notice='As informações deste evento foram alteradas. Confira os detalhes atualizados.';end if;
 elsif new.change_notice is distinct from old.change_notice then new.change_at=clock_timestamp();end if;
 return new;end$$;

insert into public.artists(id,slug,name,kind)
values ('c1c5e00a-a620-4ad0-a655-38d56f0fc689','brenda-brandao-c1c5e00a','Brenda Brandão','cantor');

notify pgrst,'reload schema';
commit;
