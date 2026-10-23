begin;
create table public.publication_notifications(
 id uuid primary key default gen_random_uuid(),event_id uuid not null,title text not null,
 scheduled_at timestamptz not null,confirmed_at timestamptz not null default clock_timestamp(),
 unique(event_id,scheduled_at)
);
create table public.publication_notification_reads(
 notification_id uuid not null references public.publication_notifications(id),
 user_id uuid not null references auth.users(id) on delete cascade,read_at timestamptz not null default clock_timestamp(),
 primary key(notification_id,user_id)
);
alter table public.publication_notifications enable row level security;
alter table public.publication_notification_reads enable row level security;
revoke all on public.publication_notifications,public.publication_notification_reads from anon,authenticated;
grant all on public.publication_notifications,public.publication_notification_reads to service_role;
-- Use precisely the same visibility predicate as the public site, without changing event status or save receipts.
create function public.collect_publication_notifications() returns void language sql security definer set search_path=public as $$
 insert into publication_notifications(event_id,title,scheduled_at)
 select e.id,e.title,e.publish_at from events e join categories c on c.id=e.category_id
 where e.status='scheduled' and e.publish_at<=now() and e.deleted_at is null and c.active
 on conflict(event_id,scheduled_at) do nothing;
$$;
revoke execute on function public.collect_publication_notifications() from public,anon,authenticated;
grant execute on function public.collect_publication_notifications() to service_role;
-- Capture a due publication before an edit/cancellation/category change could hide it between cron checks.
create function public.capture_publication_before_change() returns trigger language plpgsql security definer set search_path=public as $$begin
 perform collect_publication_notifications();return old;
end$$;
create trigger publication_before_event_change before update or delete on public.events for each statement execute function public.capture_publication_before_change();
create trigger publication_before_category_change before update or delete on public.categories for each statement execute function public.capture_publication_before_change();
create function public.admin_publication_notifications() returns jsonb language plpgsql security definer set search_path=public as $$
declare result jsonb;begin
 if not is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 perform collect_publication_notifications();
 select jsonb_build_object('checked_at',clock_timestamp(),'unread_count',(select count(*) from publication_notifications n where not exists(select 1 from publication_notification_reads r where r.notification_id=n.id and r.user_id=auth.uid())),
 'items',coalesce((select jsonb_agg(to_jsonb(x) order by (x.read_at is null) desc,x.confirmed_at desc,x.id) from (
 select n.*,r.read_at,e.slug,
 coalesce(e.deleted_at is null and c.active and (e.status in ('published','cancelled') or(e.status='scheduled' and e.publish_at<=now())),false) as public_now,
 coalesce(e.status='cancelled',false) as cancelled_now
 from publication_notifications n left join publication_notification_reads r on r.notification_id=n.id and r.user_id=auth.uid()
 left join events e on e.id=n.event_id left join categories c on c.id=e.category_id
 order by (r.read_at is null) desc,n.confirmed_at desc,n.id limit 100
 ) x),'[]'::jsonb)) into result;return result;
end$$;
create function public.read_publication_notification(p_id uuid default null,p_before timestamptz default null) returns void language plpgsql security definer set search_path=public as $$begin
 if not is_admin() then raise exception 'Acesso negado' using errcode='42501';end if;
 if (p_id is null)=(p_before is null) then raise exception 'Informe um aviso ou uma data de corte';end if;
 insert into publication_notification_reads(notification_id,user_id)
 select id,auth.uid() from publication_notifications where (p_id is not null and id=p_id) or(p_before is not null and confirmed_at<=least(p_before,clock_timestamp()))
 on conflict(notification_id,user_id) do nothing;
end$$;
revoke execute on function public.admin_publication_notifications() from public,anon;
revoke execute on function public.read_publication_notification(uuid,timestamptz) from public,anon;
grant execute on function public.admin_publication_notifications() to authenticated;
grant execute on function public.read_publication_notification(uuid,timestamptz) to authenticated;
notify pgrst,'reload schema';
commit;
