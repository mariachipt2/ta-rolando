begin;
create table public.site_special_theme(
 id uuid primary key default gen_random_uuid(),
 singleton boolean not null default true unique check(singleton),
 enabled boolean not null default false,
 theme text not null default 'ice' check(theme in ('ice','halloween')),
 motion text not null default 'soft' check(motion in ('off','soft','full')),
 event_id uuid references public.events(id) on delete set null,
 starts_at timestamptz,
 ends_at timestamptz,
 updated_at timestamptz not null default now(),
 check(starts_at is null or ends_at is null or ends_at>starts_at)
);
insert into public.site_special_theme(singleton) values(true);
alter table public.site_special_theme enable row level security;
create policy theme_read on public.site_special_theme for select to anon,authenticated using(true);
revoke all on public.site_special_theme from anon,authenticated;
grant select on public.site_special_theme to anon,authenticated;
grant all on public.site_special_theme to service_role;
create trigger special_theme_updated before update on public.site_special_theme for each row execute function public.touch_event();
create trigger special_theme_receipt after update on public.site_special_theme for each row execute function public.record_admin_save();
create function public.save_special_theme(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v site_special_theme%rowtype;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if coalesce((p_data->>'enabled')::boolean,false) and (p_data->>'event_id' is null or not exists(select 1 from events where id=(p_data->>'event_id')::uuid and deleted_at is null and status in ('published','scheduled'))) then raise exception 'Selecione um evento publicado ou agendado.';end if;
 update site_special_theme set enabled=(p_data->>'enabled')::boolean,theme=p_data->>'theme',motion=p_data->>'motion',event_id=(p_data->>'event_id')::uuid,starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz where singleton returning * into v;
 return jsonb_build_object('settings',to_jsonb(v),'saved_at',v.updated_at);
end $$;
revoke execute on function public.save_special_theme(jsonb) from public,anon;
grant execute on function public.save_special_theme(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
