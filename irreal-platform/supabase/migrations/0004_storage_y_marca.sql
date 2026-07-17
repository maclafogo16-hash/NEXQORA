-- ============================================================
-- IRREAL — Almacenamiento de imágenes + marca blanca extendida
-- Agrega: bucket de Supabase Storage para fotos de producto,
-- y campos de marca (portada) en organizations para que el
-- Motor Web se vea como un sitio propio, no genérico.
-- ============================================================

-- ---------- Marca blanca: portada del restaurante ----------
alter table organizations
  add column if not exists cover_image_url text,
  add column if not exists tagline text;  -- frase corta bajo el nombre, ej. "Comida santandereana a domicilio"

-- ---------- Bucket de imágenes de producto ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ---------- Políticas de storage ----------
-- Lectura pública: el Motor Web necesita mostrar las fotos sin login.
create policy "public can read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Escritura: solo staff autenticado, y solo dentro de la carpeta de SU
-- organización. Convención de ruta: {organization_id}/{archivo}
create policy "staff can upload own org product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_user_organization_id()::text
  );

create policy "staff can update own org product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_user_organization_id()::text
  );

create policy "staff can delete own org product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_user_organization_id()::text
  );
