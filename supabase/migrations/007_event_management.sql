begin;
alter table public.events add column family_friendly boolean, add column deleted_at timestamptz,
 add column change_notice text not null default '', add column change_at timestamptz,
 add column recurrence_group uuid, add column recurrence_index integer;
alter table public.event_submissions add column photo_path text;
create table public.event_versions(id uuid primary key default gen_random_uuid(),event_id uuid not null,
 snapshot jsonb not null,changes jsonb not null default '{}',action text not null,created_at timestamptz not null default clock_timestamp(),actor_id uuid);
create index versions_event_idx on public.event_versions(event_id,created_at desc);
create table public.event_series(id uuid primary key,base_data jsonb not null,frequency text not null,count integer not null,created_at timestamptz not null default now());
create table public.event_reports(id uuid primary key,event_id uuid not null references public.events(id),visitor_hash text not null,
 kind text not null check(kind in ('date','venue','cancelled','ticket','other')),details text not null check(length(details) between 10 and 2000),
 status text not null default 'pending' check(status in ('pending','resolved','dismissed')),created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),reviewed_by uuid references auth.users(id));
create index reports_pending_idx on public.event_reports(status,created_at desc);
alter table public.event_versions enable row level security;
alter table public.event_series enable row level security;
alter table public.event_reports enable row level security;
revoke all on public.event_versions,public.event_series,public.event_reports from anon,authenticated;
grant select on public.event_versions,public.event_series,public.event_reports to authenticated;
grant all on public.event_versions,public.event_series,public.event_reports to service_role;
create policy versions_admin on public.event_versions for select to authenticated using(public.is_admin());
create policy series_admin on public.event_series for select to authenticated using(public.is_admin());
create policy reports_admin on public.event_reports for select to authenticated using(public.is_admin());
-- Deleting a row is replaced by a reversible move to the bin.
revoke delete on public.events from authenticated;

create function public.event_change_notice() returns trigger language plpgsql set search_path=public as $$begin
 if old.deleted_at is not null and new.deleted_at is null then
  new.change_at=clock_timestamp();new.change_notice='Evento disponível novamente. Confira os detalhes.';
 elsif (old.status in ('published','cancelled') or (old.status='scheduled' and old.publish_at<=now())) and
  (row(new.title,new.description,new.starts_at,new.ends_at,new.venue_name,new.address,new.price,new.is_free,new.status,new.family_friendly,new.age_rating,new.ticket_url,new.neighborhood,new.city,new.state,new.organizer,new.additional_info,new.instagram_url,new.category_id) is distinct from row(old.title,old.description,old.starts_at,old.ends_at,old.venue_name,old.address,old.price,old.is_free,old.status,old.family_friendly,old.age_rating,old.ticket_url,old.neighborhood,old.city,old.state,old.organizer,old.additional_info,old.instagram_url,old.category_id)) then
  new.change_at=clock_timestamp();
  if new.status='cancelled' then new.change_notice='Este evento foi cancelado.';
  elsif new.change_notice='' or new.change_notice=old.change_notice then new.change_notice='As informações deste evento foram alteradas. Confira os detalhes atualizados.';end if;
 elsif new.change_notice is distinct from old.change_notice then new.change_at=clock_timestamp();end if;
 return new;end$$;
create trigger events_notice before update on public.events for each row execute function public.event_change_notice();
create function public.record_event_version() returns trigger language plpgsql security definer set search_path=public as $$
declare delta jsonb;label text;begin
 if tg_op='INSERT' then label='created';delta='{}';
 else
  select coalesce(jsonb_object_agg(n.key,jsonb_build_object('before',to_jsonb(old)->n.key,'after',n.value)),'{}') into delta from jsonb_each(to_jsonb(new)) n where n.key not in ('updated_at','change_at') and n.value is distinct from to_jsonb(old)->n.key;
  if delta='{}' then return null;end if;
  label=case when old.deleted_at is null and new.deleted_at is not null then 'trashed' when old.deleted_at is not null and new.deleted_at is null then 'restored' when current_setting('app.event_history_action',true)='version_restored' then 'version_restored' else 'updated' end;
 end if;
 insert into event_versions(event_id,snapshot,changes,action,actor_id) values(new.id,to_jsonb(new),delta,label,auth.uid());return null;end$$;
create trigger events_history after insert or update on public.events for each row execute function public.record_event_version();
insert into public.event_versions(event_id,snapshot,action) select id,to_jsonb(e),'baseline' from public.events e;

-- Append fields to preserve existing view column names and dependent functions.
create or replace view public.public_events as select
 e.id,e.slug,e.title,e.description,e.category_id,e.venue_id,e.starts_at,e.ends_at,e.venue_name,e.address,e.neighborhood,e.city,e.state,e.organizer,e.is_free,e.price,e.ticket_url,e.age_rating,e.cover_url,e.gallery,e.additional_info,e.status,e.publish_at,e.featured,e.created_at,e.updated_at,
 to_jsonb(c) as categories,(select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count,e.instagram_url,
 e.family_friendly,e.deleted_at,e.change_notice,e.change_at,e.recurrence_group,e.recurrence_index
 from public.events e join public.categories c on c.id=e.category_id where e.deleted_at is null and c.active and (e.status in ('published','cancelled') or(e.status='scheduled' and e.publish_at<=now()));
create or replace view public.admin_events as select
 e.id,e.slug,e.title,e.description,e.category_id,e.venue_id,e.starts_at,e.ends_at,e.venue_name,e.address,e.neighborhood,e.city,e.state,e.organizer,e.is_free,e.price,e.ticket_url,e.age_rating,e.cover_url,e.gallery,e.additional_info,e.status,e.publish_at,e.featured,e.created_at,e.updated_at,
 to_jsonb(c) as categories,(select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count,e.instagram_url,
 e.family_friendly,e.deleted_at,e.change_notice,e.change_at,e.recurrence_group,e.recurrence_index
 from public.events e join public.categories c on c.id=e.category_id where public.is_admin();

create function public.insert_event_data(p_data jsonb,p_slug text) returns public.events language plpgsql security definer set search_path=public as $$
declare e events%rowtype;result events%rowtype;begin
 e=jsonb_populate_record(null::events,p_data);
 insert into events(slug,title,description,category_id,starts_at,ends_at,venue_name,address,neighborhood,city,state,organizer,is_free,price,ticket_url,age_rating,cover_url,gallery,additional_info,status,publish_at,featured,instagram_url,family_friendly,change_notice,recurrence_group,recurrence_index)
 values(p_slug,e.title,e.description,e.category_id,e.starts_at,e.ends_at,e.venue_name,e.address,coalesce(e.neighborhood,''),coalesce(e.city,'Ipatinga'),coalesce(e.state,'MG'),coalesce(e.organizer,''),coalesce(e.is_free,true),coalesce(e.price,''),coalesce(e.ticket_url,''),coalesce(e.age_rating,'Livre'),coalesce(e.cover_url,''),coalesce(e.gallery,'[]'),coalesce(e.additional_info,''),e.status,e.publish_at,coalesce(e.featured,false),coalesce(e.instagram_url,''),e.family_friendly,coalesce(e.change_notice,''),e.recurrence_group,e.recurrence_index) returning * into result;return result;
end$$;
revoke execute on function public.insert_event_data(jsonb,text) from public,anon,authenticated;

create function public.create_event_series(p_key uuid,p_event jsonb,p_frequency text,p_count integer) returns jsonb language plpgsql security definer set search_path=public as $$
declare batch event_series%rowtype;e events%rowtype;item jsonb;shift interval;i integer;ids jsonb='[]';stamp timestamptz;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_frequency not in ('none','weekly','fortnightly','monthly') or p_count<1 or p_count>24 or(p_frequency='none' and p_count<>1) then raise exception 'Recorrência inválida';end if;
 perform pg_advisory_xact_lock(hashtext(p_key::text));select * into batch from event_series where id=p_key;
 if found then
  if batch.base_data<>p_event or batch.frequency<>p_frequency or batch.count<>p_count then raise exception 'Identificador de envio já utilizado';end if;
  select jsonb_agg(id order by recurrence_index),max(updated_at) into ids,stamp from events where recurrence_group=p_key or (p_count=1 and slug='evento-'||p_key::text||'-0');return jsonb_build_object('ids',ids,'saved_at',stamp);
 end if;
 insert into event_series values(p_key,p_event,p_frequency,p_count,now());
 for i in 0..p_count-1 loop
  shift=case p_frequency when 'weekly' then make_interval(days=>7*i) when 'fortnightly' then make_interval(days=>14*i) when 'monthly' then make_interval(months=>i) else interval '0' end;
  item=p_event||jsonb_build_object('starts_at',(((p_event->>'starts_at')::timestamptz at time zone 'America/Sao_Paulo')+shift) at time zone 'America/Sao_Paulo','recurrence_group',case when p_count>1 then p_key else null end,'recurrence_index',i);
  if p_event->>'ends_at' is not null then item=item||jsonb_build_object('ends_at',(((p_event->>'starts_at')::timestamptz at time zone 'America/Sao_Paulo')+shift+(((p_event->>'ends_at')::timestamptz at time zone 'America/Sao_Paulo')-((p_event->>'starts_at')::timestamptz at time zone 'America/Sao_Paulo'))) at time zone 'America/Sao_Paulo');end if;
  e=insert_event_data(item,'evento-'||p_key::text||'-'||i);ids=ids||jsonb_build_array(e.id);stamp=e.updated_at;
 end loop;return jsonb_build_object('ids',ids,'saved_at',stamp);
end$$;
create function public.set_event_trash(p_id uuid,p_deleted boolean) returns jsonb language plpgsql security definer set search_path=public as $$declare e events%rowtype;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 update events set deleted_at=case when p_deleted then coalesce(deleted_at,clock_timestamp()) else null end where id=p_id returning * into e;
 if not found then raise exception 'Evento não encontrado';end if;return jsonb_build_object('id',e.id,'saved_at',e.updated_at);end$$;
create function public.restore_event_version(p_version uuid) returns jsonb language plpgsql security definer set search_path=public as $$declare v event_versions%rowtype;e events%rowtype;r events%rowtype;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 select * into v from event_versions where id=p_version;if not found then raise exception 'Versão não encontrada';end if;
 e=jsonb_populate_record(null::events,v.snapshot);perform set_config('app.event_history_action','version_restored',true);
 update events set title=e.title,description=e.description,category_id=e.category_id,starts_at=e.starts_at,ends_at=e.ends_at,venue_name=e.venue_name,address=e.address,neighborhood=e.neighborhood,city=e.city,state=e.state,organizer=e.organizer,is_free=e.is_free,price=e.price,ticket_url=e.ticket_url,age_rating=e.age_rating,cover_url=e.cover_url,gallery=e.gallery,additional_info=e.additional_info,status=e.status,publish_at=e.publish_at,featured=e.featured,instagram_url=e.instagram_url,family_friendly=e.family_friendly,change_notice=e.change_notice where id=v.event_id returning * into r;
 if not found then raise exception 'Evento não encontrado';end if;return jsonb_build_object('id',r.id,'saved_at',r.updated_at);end$$;
create function public.review_event_report(p_id uuid,p_status text) returns jsonb language plpgsql security definer set search_path=public as $$declare r event_reports%rowtype;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_status not in ('resolved','dismissed') then raise exception 'Status inválido';end if;
 update event_reports set status=p_status,updated_at=clock_timestamp(),reviewed_by=auth.uid() where id=p_id returning * into r;
 if not found then raise exception 'Aviso não encontrado';end if;return jsonb_build_object('id',r.id,'saved_at',r.updated_at);end$$;
create trigger reports_save_receipt after update on public.event_reports for each row execute function public.record_admin_save();

create or replace function public.review_submission(p_id uuid,p_decision text,p_event jsonb default null) returns jsonb language plpgsql security definer set search_path=public as $$
declare s event_submissions%rowtype;e events%rowtype;stamp timestamptz;begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_decision not in ('approved','rejected') then raise exception 'Decisão inválida';end if;
 select * into s from event_submissions where id=p_id for update;if not found then raise exception 'Sugestão não encontrada';end if;
 if s.status<>'pending' then if s.status=p_decision then return jsonb_build_object('id',s.id,'event_id',s.approved_event_id,'saved_at',s.updated_at);end if;raise exception 'Esta sugestão já foi analisada';end if;
 if p_decision='approved' then
  if p_event is null or coalesce(p_event->>'status','') not in ('published','draft','scheduled') then raise exception 'Revise os dados do evento';end if;
  e=insert_event_data(p_event,'evento-'||p_id::text);
 end if;
 stamp=clock_timestamp();update event_submissions set status=p_decision,updated_at=stamp,reviewed_at=stamp,reviewed_by=auth.uid(),approved_event_id=case when p_decision='approved' then e.id else null end where id=p_id;
 return jsonb_build_object('id',p_id,'event_id',e.id,'saved_at',stamp);
end$$;
revoke execute on function public.create_event_series(uuid,jsonb,text,integer),public.set_event_trash(uuid,boolean),public.restore_event_version(uuid),public.review_event_report(uuid,text) from public,anon;
grant execute on function public.create_event_series(uuid,jsonb,text,integer),public.set_event_trash(uuid,boolean),public.restore_event_version(uuid),public.review_event_report(uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
