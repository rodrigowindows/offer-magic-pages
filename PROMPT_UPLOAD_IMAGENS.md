# Prompt para Lovable - Criar Bucket e Configurar Storage

Copie e cole no Lovable:

---

Preciso criar um storage bucket no Supabase para as imagens das propriedades e configurar as políticas de acesso.

Execute este SQL no Supabase SQL Editor (https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/sql):

```sql
-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880,  -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon upload" ON storage.objects;

-- Allow public read access to images
CREATE POLICY "Allow public read property images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- Allow anon users to upload images
CREATE POLICY "Allow anon upload property images"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'property-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'property-images' );
```

Depois de executar o SQL, confirme que o bucket foi criado em:
https://atwdkhlyrffbaugkaker.supabase.co/project/atwdkhlyrffbaugkaker/storage/buckets

---

Quando terminar, me avise para eu fazer upload das 242 imagens.
