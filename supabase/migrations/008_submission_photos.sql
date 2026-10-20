begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('submission-images','submission-images',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy submission_images_admin_read on storage.objects for select to authenticated using(bucket_id='submission-images' and public.is_admin());
commit;
