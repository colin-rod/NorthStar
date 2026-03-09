-- Narrow the public read policy for inline images.
-- Replaces the broad LIKE '%/inline-images/%' match with a strict regex
-- anchored to: {uuid}/inline-images/{filename} (no subdirectories).

DROP POLICY IF EXISTS "Public read for inline images" ON storage.objects;

CREATE POLICY "Public read for inline images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/inline-images/[^/]+$'
  );
