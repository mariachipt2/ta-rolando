begin;
create function public.attach_draft_artists(p_event uuid,p_artists uuid[],p_cover_url text default null) returns jsonb
language plpgsql security definer set search_path=public as $$
declare current_event events%rowtype; combined uuid[]; attach_cover boolean;
begin
  select * into current_event from events where id=p_event and status='draft' and deleted_at is null for update;
  if not found then return null; end if;
  if cardinality(p_artists)>20 or array_position(p_artists,null) is not null then raise exception 'Artistas inválidos.'; end if;
  combined=array(select distinct artist from unnest(current_event.artist_ids || coalesce(p_artists,'{}')) artist order by artist);
  attach_cover=p_cover_url is not null and coalesce(current_event.cover_url,'')='';
  if attach_cover and (p_cover_url not like 'https://%' or length(p_cover_url)>2048) then raise exception 'Capa inválida.'; end if;
  if combined is distinct from current_event.artist_ids or attach_cover then
    update events set artist_ids=combined,cover_url=case when attach_cover then p_cover_url else cover_url end where id=p_event returning * into current_event;
  end if;
  return jsonb_build_object('id',current_event.id,'saved_at',current_event.updated_at,'artist_ids',current_event.artist_ids,'cover_attached',attach_cover);
end $$;
revoke execute on function public.attach_draft_artists(uuid,uuid[],text) from public,anon,authenticated;
grant execute on function public.attach_draft_artists(uuid,uuid[],text) to service_role;
notify pgrst,'reload schema';
commit;
