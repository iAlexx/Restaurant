-- Supabase Storage bucket for menu images and restaurant logo

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu',
  'menu',
  true,
  524288,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read for menu images
CREATE POLICY menu_storage_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'menu');

-- Admin upload/update/delete via authenticated admin (API uses service role for uploads)
CREATE POLICY menu_storage_admin_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'menu'
    AND public.is_admin()
  );

CREATE POLICY menu_storage_admin_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu' AND public.is_admin())
  WITH CHECK (bucket_id = 'menu' AND public.is_admin());

CREATE POLICY menu_storage_admin_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu' AND public.is_admin());
