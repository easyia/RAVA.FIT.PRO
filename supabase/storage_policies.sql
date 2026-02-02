-- Storage Policies for 'meals' bucket
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access'
    ) THEN
        CREATE POLICY "Public Access"
        ON storage.objects FOR SELECT
        TO public
        USING ( bucket_id = 'meals' );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Student Upload'
    ) THEN
        CREATE POLICY "Student Upload"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'meals' 
            AND (storage.foldername(name))[2] = auth.uid()::text
        );
    END IF;
END
$$;
