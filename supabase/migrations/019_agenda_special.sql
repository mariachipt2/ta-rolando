begin;

create table public.site_agenda_special (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  enabled boolean not null default false,
  title text not null check (length(trim(title)) between 3 and 70),
  start_date date not null check (start_date between '2000-01-01' and '2099-12-31'),
  end_date date not null check (end_date between start_date and start_date + 30),
  visible_from date not null check (visible_from between '2000-01-01' and end_date),
  updated_at timestamptz not null default now()
);

alter table public.site_agenda_special enable row level security;
revoke all on public.site_agenda_special from anon, authenticated;
grant select on public.site_agenda_special to anon, authenticated;
grant all on public.site_agenda_special to service_role;
create policy agenda_special_read on public.site_agenda_special for select to anon, authenticated using (true);
create trigger agenda_special_updated before update on public.site_agenda_special
  for each row execute function public.touch_event();
create trigger agenda_special_receipt after insert or update on public.site_agenda_special
  for each row execute function public.record_admin_save();

insert into public.site_agenda_special (enabled,title,start_date,end_date,visible_from)
values (true,'Seu feriadão tá aqui','2026-11-19','2026-11-22','2026-11-18');

create function public.save_agenda_special(p_data jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare saved site_agenda_special%rowtype;
begin
  if not public.is_admin() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  update site_agenda_special set
    enabled = (p_data->>'enabled')::boolean,
    title = trim(p_data->>'title'),
    start_date = (p_data->>'start_date')::date,
    end_date = (p_data->>'end_date')::date,
    visible_from = (p_data->>'visible_from')::date
  where singleton returning * into saved;
  if not found then raise exception 'Configuração do especial ausente.'; end if;
  return jsonb_build_object('settings',to_jsonb(saved),'saved_at',saved.updated_at);
end $$;
revoke execute on function public.save_agenda_special(jsonb) from public, anon;
grant execute on function public.save_agenda_special(jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
