drop policy "notes public read" on storage.objects;
create policy "notes read approved or own" on storage.objects for select to anon, authenticated using (
  bucket_id = 'notes' and (
    exists (select 1 from public.resources r where r.file_path = storage.objects.name and r.status = 'approved')
    or (auth.uid() is not null and (storage.foldername(name))[1] = auth.uid()::text)
    or (auth.uid() is not null and public.has_role(auth.uid(), 'admin'))
  )
);