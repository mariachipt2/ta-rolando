-- Fila privada de buscas do OpenBot. Nenhuma busca publica ou cria eventos.
create table public.openbot_search_jobs (
 id uuid primary key default gen_random_uuid(),
 source text not null check(source in ('socialyte','pystta','lhever')),
 requested_by uuid not null references auth.users(id),
 status text not null default 'queued' check(status in ('queued','running','completed','failed','cancelled')),
 requested_at timestamptz not null default now(),
 started_at timestamptz, finished_at timestamptz, heartbeat_at timestamptz,
 lease_token uuid, result jsonb, error text
);
create index openbot_search_latest on public.openbot_search_jobs(source,requested_at desc);
create unique index openbot_search_one_active on public.openbot_search_jobs(source) where status in ('queued','running');
alter table public.openbot_search_jobs enable row level security;
revoke all on public.openbot_search_jobs from anon,authenticated;
-- Somente a Edge Function autenticada manipula a fila. O site nao recebe lease ou credenciais.
grant all on public.openbot_search_jobs to service_role;
create function public.claim_openbot_search() returns setof public.openbot_search_jobs
language plpgsql security definer set search_path=public as $$
begin
 update openbot_search_jobs set status='failed',finished_at=now(),error='A busca foi interrompida no computador. Solicite uma nova busca.',lease_token=null
 where status='running' and heartbeat_at<now()-interval '3 minutes';
 return query with next_job as (
  select id from openbot_search_jobs where status='queued' order by requested_at for update skip locked limit 1
 ) update openbot_search_jobs j set status='running',started_at=now(),heartbeat_at=now(),lease_token=gen_random_uuid()
 from next_job n where j.id=n.id returning j.*;
end $$;
revoke execute on function public.claim_openbot_search() from public,anon,authenticated;
grant execute on function public.claim_openbot_search() to service_role;
