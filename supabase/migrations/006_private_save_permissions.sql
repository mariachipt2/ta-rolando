-- Supabase projects may grant table privileges by default. Keep these private
-- tables explicitly limited even when those default privileges are present.
begin;
revoke all on public.event_submissions from anon,authenticated;
revoke all on public.admin_save_state from anon,authenticated;
grant select on public.event_submissions,public.admin_save_state to authenticated;
grant all on public.event_submissions,public.admin_save_state to service_role;
notify pgrst,'reload schema';
commit;
