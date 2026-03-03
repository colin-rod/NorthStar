-- Allow public (unauthenticated) read access to inline images
-- stored in the attachments bucket under {userId}/inline-images/
-- These are embedded in issue descriptions and must be publicly accessible.
CREATE POLICY "Public read for inline images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND name LIKE '%/inline-images/%'
  );
