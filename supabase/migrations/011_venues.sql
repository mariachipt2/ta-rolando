begin;
-- Extend the original venues table without replacing records or linked event IDs.
alter table public.venues
 add column kind text not null default 'other' check(kind in ('bar','nightclub','other')),
 add column organizer text not null default '' check(length(organizer)<=160),
 add column instagram_url text not null default '',
 add column website text not null default '',
 add column source_key text unique,
 add column source_url text not null default '',
 add column active boolean not null default true,
 add column share_enabled boolean not null default false,
 add column created_at timestamptz,
 add column updated_at timestamptz;
alter table public.venues alter column address set default '',alter column created_at set default now(),alter column updated_at set default now();
alter table public.venues enable row level security;
create policy venues_admin_read on public.venues for select to authenticated using(public.is_admin());
revoke all on public.venues from anon,authenticated;
grant select on public.venues to authenticated;
grant all on public.venues to service_role;
create trigger venues_updated before update on public.venues for each row execute function public.touch_event();
create trigger venues_save_receipt after insert or update on public.venues for each row execute function public.record_admin_save();
create function public.save_venue(p_id uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v venues%rowtype;existing uuid;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 v:=jsonb_populate_record(null::venues,p_data);
 if v.source_key is not null then select id into existing from venues where source_key=v.source_key;end if;
 if existing is not null and existing<>p_id then raise exception 'Este local já foi salvo. Abra o cadastro existente.';end if;
 insert into venues(id,name,kind,address,neighborhood,city,state,organizer,instagram_url,website,source_key,source_url,active,share_enabled)
 values(p_id,v.name,v.kind,coalesce(v.address,''),coalesce(v.neighborhood,''),'Ipatinga','MG',coalesce(v.organizer,''),coalesce(v.instagram_url,''),coalesce(v.website,''),v.source_key,coalesce(v.source_url,''),coalesce(v.active,true),coalesce(v.share_enabled,true))
 on conflict(id) do update set name=excluded.name,kind=excluded.kind,address=excluded.address,neighborhood=excluded.neighborhood,organizer=excluded.organizer,instagram_url=excluded.instagram_url,website=excluded.website,source_key=excluded.source_key,source_url=excluded.source_url,active=excluded.active,share_enabled=excluded.share_enabled
 returning * into v;
 return jsonb_build_object('venue',to_jsonb(v),'saved_at',v.updated_at);
end $$;
revoke execute on function public.save_venue(uuid,jsonb) from public,anon;
grant execute on function public.save_venue(uuid,jsonb) to authenticated;
create function public.submission_venue(p_id uuid) returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object('id',id,'name',name,'kind',kind,'address',address,'neighborhood',neighborhood,'city',city,'state',state,'organizer',organizer,'instagram_url',instagram_url)
 from venues where id=p_id and active and share_enabled
$$;
revoke execute on function public.submission_venue(uuid) from public;
grant execute on function public.submission_venue(uuid) to anon,authenticated;
notify pgrst,'reload schema';
commit;
