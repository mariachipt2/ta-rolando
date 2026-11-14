begin;

create or replace view public.public_events as
select
  e.id,e.slug,e.title,e.description,e.category_id,e.venue_id,e.starts_at,e.ends_at,e.venue_name,e.address,e.neighborhood,e.city,e.state,e.organizer,e.is_free,e.price,e.ticket_url,e.age_rating,e.cover_url,e.gallery,e.additional_info,e.status,e.publish_at,e.featured,e.created_at,e.updated_at,
  to_jsonb(c) as categories,(select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count,e.instagram_url,
  e.family_friendly,e.deleted_at,e.change_notice,e.change_at,e.recurrence_group,e.recurrence_index,
  exists (
    select 1
    from public.venues v
    where v.active and v.kind in ('bar','nightclub')
      and (
        v.id=e.venue_id
        or (
          e.venue_id is null
          and lower(trim(v.name))=lower(trim(e.venue_name))
          and lower(trim(v.city))=lower(trim(e.city))
          and upper(trim(v.state))=upper(trim(e.state))
          and (nullif(trim(v.neighborhood),'') is null
            or nullif(trim(e.neighborhood),'') is null
            or lower(trim(v.neighborhood))=lower(trim(e.neighborhood)))
        )
      )
  ) as nightlife_venue
from public.events e
join public.categories c on c.id=e.category_id
where e.deleted_at is null and c.active
  and (e.status in ('published','cancelled') or (e.status='scheduled' and e.publish_at<=now()));

notify pgrst,'reload schema';
commit;
