DROP POLICY IF EXISTS "notes read approved or own" ON storage.objects;
CREATE POLICY "notes read approved files" ON storage.objects FOR SELECT TO anon, authenticated USING (
  bucket_id = 'notes' AND EXISTS (SELECT 1 FROM public.resources r WHERE r.file_path = storage.objects.name AND r.status = 'approved')
);
CREATE POLICY "notes owner reads own files" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'notes' AND (storage.foldername(name))[1] = (SELECT auth.uid()::text)
);
CREATE POLICY "notes moderators read files" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'notes' AND public.has_role((SELECT auth.uid()), 'admin')
);