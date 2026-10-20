begin;
create table if not exists public.event_submissions (
 id uuid primary key, visitor_hash text not null, event_data jsonb not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 submitted_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 reviewed_at timestamptz, reviewed_by uuid references auth.users(id),
 approved_event_id uuid references public.events(id) on delete set null
);
create index if not exists submissions_pending_idx on public.event_submissions(status,submitted_at desc);
alter table public.event_submissions enable row level security;
create policy submissions_admin_read on public.event_submissions for select to authenticated using(public.is_admin());
revoke all on public.event_submissions from authenticated;
grant select on public.event_submissions to authenticated;
grant all on public.event_submissions to service_role;
revoke all on public.event_submissions from anon;

alter table public.categories add column if not exists updated_at timestamptz;
alter table public.categories alter column updated_at set default now();
create trigger categories_updated before update on public.categories for each row execute function public.touch_event();

create table public.admin_save_state (
 singleton boolean primary key default true check(singleton), saved_at timestamptz, entity text, record_id uuid, operation text
);
alter table public.admin_save_state enable row level security;
create policy save_state_admin_read on public.admin_save_state for select to authenticated using(public.is_admin());
revoke all on public.admin_save_state from anon,authenticated;
grant select on public.admin_save_state to authenticated;
grant all on public.admin_save_state to service_role;
insert into public.admin_save_state(singleton,saved_at,entity) select true,max(updated_at),'events' from public.events;
create function public.record_admin_save() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into admin_save_state(singleton,saved_at,entity,record_id,operation)
 values(true,clock_timestamp(),tg_table_name,case when tg_op='DELETE' then old.id else new.id end,tg_op)
 on conflict(singleton) do update set saved_at=excluded.saved_at,entity=excluded.entity,record_id=excluded.record_id,operation=excluded.operation;
 return null;
end $$;
create trigger events_save_receipt after insert or update or delete on public.events for each row execute function public.record_admin_save();
create trigger categories_save_receipt after insert or update or delete on public.categories for each row execute function public.record_admin_save();
create trigger submissions_save_receipt after update on public.event_submissions for each row execute function public.record_admin_save();

create function public.review_submission(p_id uuid,p_decision text,p_event jsonb default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s event_submissions%rowtype; e events%rowtype; stamp timestamptz;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_decision not in ('approved','rejected') then raise exception 'Decisão inválida';end if;
 select * into s from event_submissions where id=p_id for update;
 if not found then raise exception 'Sugestão não encontrada';end if;
 if s.status<>'pending' then
  if s.status=p_decision then return jsonb_build_object('id',s.id,'event_id',s.approved_event_id,'saved_at',s.updated_at);end if;
  raise exception 'Esta sugestão já foi analisada';
 end if;
 if p_decision='approved' then
  if p_event is null or coalesce(p_event->>'status','') not in ('published','draft','scheduled') then raise exception 'Revise os dados do evento';end if;
  e:=jsonb_populate_record(null::events,p_event);
  insert into events(slug,title,description,category_id,starts_at,ends_at,venue_name,address,neighborhood,city,state,organizer,is_free,price,ticket_url,age_rating,cover_url,gallery,additional_info,status,publish_at,featured,instagram_url)
  values('evento-'||p_id::text,e.title,e.description,e.category_id,e.starts_at,e.ends_at,e.venue_name,e.address,coalesce(e.neighborhood,''),coalesce(e.city,'Ipatinga'),coalesce(e.state,'MG'),coalesce(e.organizer,''),coalesce(e.is_free,true),coalesce(e.price,''),coalesce(e.ticket_url,''),coalesce(e.age_rating,'Livre'),coalesce(e.cover_url,''),coalesce(e.gallery,'[]'),coalesce(e.additional_info,''),e.status,e.publish_at,coalesce(e.featured,false),coalesce(e.instagram_url,'')) returning * into e;
 end if;
 stamp:=clock_timestamp();
 update event_submissions set status=p_decision,updated_at=stamp,reviewed_at=stamp,reviewed_by=auth.uid(),approved_event_id=case when p_decision='approved' then e.id else null end where id=p_id;
 return jsonb_build_object('id',p_id,'event_id',e.id,'saved_at',stamp);
end $$;
revoke execute on function public.review_submission(uuid,text,jsonb) from public,anon;
grant execute on function public.review_submission(uuid,text,jsonb) to authenticated;
create or replace function public.cleanup_private_data() returns void language plpgsql security definer set search_path=public as $$begin
 delete from event_attendance a using events e where a.event_id=e.id and coalesce(e.ends_at,e.starts_at)<now()-interval '180 days';
 delete from request_limits where window_start<now()-interval '1 day';
 delete from event_submissions where submitted_at<now()-interval '180 days';
end$$;
notify pgrst,'reload schema';
commit;
