-- Server-checked admin view avoids transferring visitor-level records just to count.
create view public.admin_events as
select e.*, to_jsonb(c) as categories,
 (select count(*) from public.event_attendance a where a.event_id=e.id) as interest_count
from public.events e join public.categories c on c.id=e.category_id
where public.is_admin();
grant select on public.admin_events to authenticated;
revoke all on public.admin_events from anon;
