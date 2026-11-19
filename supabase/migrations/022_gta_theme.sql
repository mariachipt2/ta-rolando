begin;
alter table public.site_special_theme drop constraint site_special_theme_theme_check;
alter table public.site_special_theme add constraint site_special_theme_theme_check check(theme in ('ice','halloween','christmas','newyear','muertos','gta'));
create or replace function public.save_special_theme(p_data jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare v site_special_theme%rowtype;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if coalesce((p_data->>'enabled')::boolean,false) then
   if p_data->>'event_id' is null then
     if p_data->>'theme' is distinct from 'gta' then raise exception 'Selecione um evento publicado ou agendado.';end if;
   elsif not exists(select 1 from events where id=(p_data->>'event_id')::uuid and deleted_at is null and status in ('published','scheduled')) then
     raise exception 'Selecione um evento publicado ou agendado.';
   end if;
 end if;
 update site_special_theme set enabled=(p_data->>'enabled')::boolean,theme=p_data->>'theme',motion=p_data->>'motion',event_id=(p_data->>'event_id')::uuid,starts_at=(p_data->>'starts_at')::timestamptz,ends_at=(p_data->>'ends_at')::timestamptz where singleton returning * into v;
 return jsonb_build_object('settings',to_jsonb(v),'saved_at',v.updated_at);
end $$;
revoke execute on function public.save_special_theme(jsonb) from public,anon;
grant execute on function public.save_special_theme(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
