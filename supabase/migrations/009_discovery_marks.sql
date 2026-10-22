begin;
create table public.discovery_marks (
 id uuid primary key default gen_random_uuid(),
 source_url text not null check(length(source_url)<=2048 and source_url ~ '^https://socialyte[.]com[.]br/eventos/'),
 starts_at timestamptz not null,
 status text not null check(status in ('pending','added','ignored')),
 updated_at timestamptz not null default clock_timestamp(),
 updated_by uuid references auth.users(id),
 unique(source_url,starts_at)
);
alter table public.discovery_marks enable row level security;
create policy discovery_marks_admin_read on public.discovery_marks for select to authenticated using(public.is_admin());
revoke all on public.discovery_marks from anon,authenticated;
grant select on public.discovery_marks to authenticated;
grant all on public.discovery_marks to service_role;
create trigger discovery_marks_save_receipt after insert or update on public.discovery_marks for each row execute function public.record_admin_save();
create function public.mark_discovery(p_source_url text,p_starts_at timestamptz,p_status text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare saved discovery_marks%rowtype;
begin
 if not public.is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if p_status not in ('pending','added','ignored') or p_status is null then raise exception 'Marcação inválida';end if;
 insert into discovery_marks(source_url,starts_at,status,updated_at,updated_by)
 values(p_source_url,p_starts_at,p_status,clock_timestamp(),auth.uid())
 on conflict(source_url,starts_at) do update set status=excluded.status,updated_at=excluded.updated_at,updated_by=excluded.updated_by
 returning * into saved;
 return jsonb_build_object('mark',jsonb_build_object('source_url',saved.source_url,'starts_at',saved.starts_at,'status',saved.status,'updated_at',saved.updated_at),'saved_at',saved.updated_at);
end $$;
revoke execute on function public.mark_discovery(text,timestamptz,text) from public,anon;
grant execute on function public.mark_discovery(text,timestamptz,text) to authenticated;
notify pgrst,'reload schema';
commit;
