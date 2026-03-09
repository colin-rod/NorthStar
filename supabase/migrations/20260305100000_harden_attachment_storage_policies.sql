-- Harden storage authorization for the attachments bucket.
-- Enforces that users can only upload/update/delete objects under their own
-- path prefix ({user_id}/...), so the upload step itself is server-enforced
-- rather than relying solely on server-side metadata validation.

-- Users can upload only to their own prefix
CREATE POLICY "Users upload to own prefix"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update only their own objects
CREATE POLICY "Users update own objects"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete only their own objects
CREATE POLICY "Users delete own objects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own objects (non-public paths require signed URLs,
-- but this policy gates direct access; inline images are handled by the
-- separate "Public read for inline images" policy).
CREATE POLICY "Users read own objects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
