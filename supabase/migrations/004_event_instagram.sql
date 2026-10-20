begin;
alter table public.events add column if not exists instagram_url text not null default '';
do $$begin
 if not exists(select 1 from pg_constraint where conrelid='public.events'::regclass and conname='events_instagram_profile_check') then
  alter table public.events add constraint events_instagram_profile_check check (
   instagram_url='' or (
    length(instagram_url)<=2048
    and instagram_url ~ '^https://(www\.)?instagram\.com/[A-Za-z0-9._]{1,30}/?$'
    and lower(split_part(instagram_url,'/',4)) not in ('p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','privacy','terms','share')
   )
  );
 end if;
end $$;
-- Keep the existing column order and permissions. New fields are appended,
-- so CREATE OR REPLACE preserves dependent functions and existing clients.
create or replace view public.public_events as
 select e.id,e.slug,e.title,e.description,e.category_id,e.venue_id,e.starts_at,e.ends_at,e.venue_name,e.address,e.neighborhood,e.city,e.state,e.organizer,e.is_free,e.price,e.ticket_url,e.age_rating,e.cover_url,e.gallery,e.additional_info,e.status,e.publish_at,e.featured,e.created_at,e.updated_at,
 to_jsonb(c) as categories,
 (select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count,
 e.instagram_url
 from public.events e join public.categories c on c.id=e.category_id
 where c.active and (e.status in ('published','cancelled') or (e.status='scheduled' and e.publish_at<=now()));
create or replace view public.admin_events as
 select e.id,e.slug,e.title,e.description,e.category_id,e.venue_id,e.starts_at,e.ends_at,e.venue_name,e.address,e.neighborhood,e.city,e.state,e.organizer,e.is_free,e.price,e.ticket_url,e.age_rating,e.cover_url,e.gallery,e.additional_info,e.status,e.publish_at,e.featured,e.created_at,e.updated_at,
 to_jsonb(c) as categories,
 (select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count,
 e.instagram_url
 from public.events e join public.categories c on c.id=e.category_id
 where public.is_admin();
notify pgrst, 'reload schema';
commit;
