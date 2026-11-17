begin;

create table if not exists public.organizer_profiles (
  id uuid primary key,
  source_key text unique,
  name text not null check (length(trim(name)) between 2 and 160),
  instagram_url text not null default '',
  venue_name text not null default '',
  address text not null default '',
  neighborhood text not null default '',
  city text not null default 'Ipatinga',
  state text not null default 'MG',
  updated_at timestamptz not null default now()
);

alter table public.organizer_profiles enable row level security;
revoke all on public.organizer_profiles from anon, authenticated;
grant select, insert, update on public.organizer_profiles to authenticated;
drop policy if exists organizer_profiles_admin on public.organizer_profiles;
create policy organizer_profiles_admin on public.organizer_profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop trigger if exists organizer_profiles_updated on public.organizer_profiles;
create trigger organizer_profiles_updated before update on public.organizer_profiles
  for each row execute function public.touch_event();
drop trigger if exists organizer_profiles_receipt on public.organizer_profiles;
create trigger organizer_profiles_receipt after insert or update on public.organizer_profiles
  for each row execute function public.record_admin_save();

notify pgrst,'reload schema';
commit;
