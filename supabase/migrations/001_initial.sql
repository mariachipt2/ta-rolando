begin;
create table public.admin_profiles(user_id uuid primary key references auth.users(id) on delete cascade, active boolean not null default true);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from admin_profiles where user_id=auth.uid() and active) $$;
create table public.categories(id uuid primary key default gen_random_uuid(),name text not null unique,icon text not null default 'Sparkles',active boolean not null default true);
create table public.venues(id uuid primary key default gen_random_uuid(),name text not null,address text not null,neighborhood text not null default '',city text not null default 'Ipatinga',state text not null default 'MG');
create table public.events(
 id uuid primary key default gen_random_uuid(),slug text not null unique,title text not null check(length(title) between 3 and 160),description text not null,
 category_id uuid not null references categories(id),venue_id uuid references venues(id),starts_at timestamptz not null,ends_at timestamptz,
 venue_name text not null,address text not null,neighborhood text not null default '',city text not null default 'Ipatinga',state text not null default 'MG',organizer text not null default '',
 is_free boolean not null default true,price text not null default '',ticket_url text not null default '' check(ticket_url='' or ticket_url like 'https://%'),age_rating text not null default 'Livre',
 cover_url text not null default '',gallery jsonb not null default '[]',additional_info text not null default '',status text not null default 'draft' check(status in ('draft','published','scheduled','cancelled')),
 publish_at timestamptz,featured boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(ends_at is null or ends_at>starts_at),check(status<>'scheduled' or publish_at is not null)
);
create index events_date_status_idx on events(status,starts_at);
create index events_category_idx on events(category_id,starts_at);
create index events_city_idx on events(city,starts_at);
create index events_search_idx on events using gin(to_tsvector('portuguese',title||' '||venue_name||' '||neighborhood));
create table public.event_attendance(event_id uuid not null references events(id) on delete cascade,visitor_hash text not null,created_at timestamptz not null default now(),primary key(event_id,visitor_hash));
create index attendance_visitor_idx on event_attendance(visitor_hash);
create index attendance_time_idx on event_attendance(created_at);
create table public.event_metrics(event_id uuid not null references events(id) on delete cascade,day date not null default current_date,views bigint not null default 0,ticket_clicks bigint not null default 0,interests_added bigint not null default 0,interests_removed bigint not null default 0,primary key(event_id,day));
create table public.site_settings(key text primary key,value jsonb not null);
create table public.request_limits(key text primary key,window_start timestamptz not null default now(),hits integer not null default 1);
create function public.touch_event() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();return new;end$$;
create trigger events_updated before update on events for each row execute function touch_event();
alter table admin_profiles enable row level security;
alter table categories enable row level security;
alter table venues enable row level security;
alter table events enable row level security;
alter table event_attendance enable row level security;
alter table event_metrics enable row level security;
alter table site_settings enable row level security;
alter table request_limits enable row level security;
create policy self_admin on admin_profiles for select to authenticated using(user_id=auth.uid());
create policy categories_public on categories for select to anon,authenticated using(active or is_admin());
create policy categories_admin on categories for all to authenticated using(is_admin()) with check(is_admin());
create policy venues_admin on venues for all to authenticated using(is_admin()) with check(is_admin());
create policy events_admin on events for all to authenticated using(is_admin()) with check(is_admin());
create policy metrics_admin on event_metrics for select to authenticated using(is_admin());
create policy settings_admin on site_settings for all to authenticated using(is_admin()) with check(is_admin());
-- Explicit publication predicate. View exposes counts, never visitor identifiers.
create view public.public_events as select e.*,to_jsonb(c) as categories,(select count(*) from event_attendance a where a.event_id=e.id) as interest_count from events e join categories c on c.id=e.category_id where c.active and (e.status in ('published','cancelled') or (e.status='scheduled' and e.publish_at<=now()));
grant select on public.public_events to anon,authenticated;
grant select on categories to anon;
grant select,insert,update,delete on events,categories,venues,site_settings to authenticated;
grant select on admin_profiles,event_metrics to authenticated;
revoke all on event_attendance,request_limits from anon,authenticated;
grant all on all tables in schema public to service_role;
create function public.consume_limit(p_key text,p_max integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;begin
 insert into request_limits(key) values(p_key) on conflict(key) do update set hits=case when request_limits.window_start<now()-make_interval(secs=>p_seconds) then 1 else request_limits.hits+1 end,window_start=case when request_limits.window_start<now()-make_interval(secs=>p_seconds) then now() else request_limits.window_start end returning hits into n;
 return n<=p_max;end$$;
create function public.set_attendance(p_event uuid,p_visitor text,p_attending boolean) returns bigint language plpgsql security definer set search_path=public as $$
declare changed integer;n bigint;begin
 if not exists(select 1 from public_events where id=p_event and status<>'cancelled' and coalesce(ends_at,starts_at)>now()) and p_attending then raise exception 'Evento indisponível';end if;
 if p_attending then insert into event_attendance(event_id,visitor_hash) values(p_event,p_visitor) on conflict do nothing;
 else delete from event_attendance where event_id=p_event and visitor_hash=p_visitor;end if;
 get diagnostics changed=row_count;
 if changed>0 then insert into event_metrics(event_id,day,interests_added,interests_removed) values(p_event,(now() at time zone 'America/Sao_Paulo')::date,case when p_attending then 1 else 0 end,case when p_attending then 0 else 1 end) on conflict(event_id,day) do update set interests_added=event_metrics.interests_added+excluded.interests_added,interests_removed=event_metrics.interests_removed+excluded.interests_removed;end if;
 select count(*) into n from event_attendance where event_id=p_event;return n;end$$;
create function public.record_metric(p_event uuid,p_kind text) returns void language plpgsql security definer set search_path=public as $$begin
 if p_kind not in ('view','ticket') or not exists(select 1 from public_events where id=p_event) then return;end if;
 insert into event_metrics(event_id,day,views,ticket_clicks) values(p_event,(now() at time zone 'America/Sao_Paulo')::date,case when p_kind='view' then 1 else 0 end,case when p_kind='ticket' then 1 else 0 end) on conflict(event_id,day) do update set views=event_metrics.views+excluded.views,ticket_clicks=event_metrics.ticket_clicks+excluded.ticket_clicks;end$$;
create function public.cleanup_private_data() returns void language plpgsql security definer set search_path=public as $$begin
 delete from event_attendance a using events e where a.event_id=e.id and coalesce(e.ends_at,e.starts_at)<now()-interval '180 days';
 delete from request_limits where window_start<now()-interval '1 day';end$$;
revoke execute on function consume_limit(text,integer,integer),set_attendance(uuid,text,boolean),record_metric(uuid,text),cleanup_private_data() from public,anon,authenticated;
grant execute on function consume_limit(text,integer,integer),set_attendance(uuid,text,boolean),record_metric(uuid,text),cleanup_private_data() to service_role;
insert into categories(name,icon) values ('Shows e música','Music2'),('Festas e baladas','PartyPopper'),('Bares e vida noturna','Wine'),('Gastronomia','Utensils'),('Cultura e teatro','Theater'),('Cinema','Clapperboard'),('Esportes','Trophy'),('Eventos infantis','Baby'),('Feiras e exposições','Store'),('Eventos religiosos','Church'),('Cursos e palestras','GraduationCap'),('Eventos comunitários','Users'),('Outros','Sparkles');
insert into site_settings values('location','{"city":"Ipatinga","state":"MG"}');
commit;
