create policy "Users read own dream images"
on storage.objects for select to authenticated
using (bucket_id = 'dream-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users upload own dream images"
on storage.objects for insert to authenticated
with check (bucket_id = 'dream-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users delete own dream images"
on storage.objects for delete to authenticated
using (bucket_id = 'dream-images' and auth.uid()::text = (storage.foldername(name))[1]);