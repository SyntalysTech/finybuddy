-- =====================================================
-- FINYBUDDY - STORAGE BUCKETS
-- =====================================================

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Bucket para exportaciones de datos (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    false,
    52428800, -- 50MB
    ARRAY['text/csv', 'application/json', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Políticas para bucket de avatares
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Avatars are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Políticas para bucket de exportaciones
CREATE POLICY "Users can upload own exports"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'exports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own exports"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'exports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own exports"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'exports' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
