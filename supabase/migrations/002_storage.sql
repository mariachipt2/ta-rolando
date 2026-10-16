insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('event-images','event-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy event_images_read on storage.objects for select to anon,authenticated using(bucket_id='event-images');
create policy event_images_admin on storage.objects for all to authenticated using(bucket_id='event-images' and public.is_admin()) with check(bucket_id='event-images' and public.is_admin());
