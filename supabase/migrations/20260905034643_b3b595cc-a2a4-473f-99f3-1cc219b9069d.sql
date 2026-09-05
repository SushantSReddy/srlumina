create policy "Users update own dream images"
on storage.objects for update to authenticated
using (bucket_id = 'dream-images' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'dream-images' and auth.uid()::text = (storage.foldername(name))[1]);