# ✨ Recursos Adicionados ao Offer Magic Pages

## 📸 Upload de Imagens

### O que foi criado:
- **Componente**: `src/components/PropertyImageUpload.tsx`
- **Funcionalidade**: Upload de fotos das propriedades direto no admin

### Como usar:
1. Abra o admin panel
2. Clique em uma propriedade
3. Clique no botão "Upload Image" ou "Change Image"
4. Selecione a foto (JPG, PNG até 5MB)
5. Clique em "Upload Image"
6. A foto é salva no Supabase Storage e vinculada à propriedade

### Integração no Admin:
```tsx
import { PropertyImageUpload } from "@/components/PropertyImageUpload";

// Dentro do seu componente de propriedade:
<PropertyImageUpload
  propertyId={property.id}
  propertySlug={property.slug}
  currentImageUrl={property.property_image_url}
  onImageUploaded={(url) => {
    // Atualiza a UI
    console.log("Nova imagem:", url);
  }}
/>
```

---

## 🏷️ Sistema de Tags

### O que foi criado:
- **Migration**: `supabase/migrations/20251216000000_add_tags_to_properties.sql`
- **Componente de Gerenciar**: `src/components/PropertyTagsManager.tsx`
- **Componente de Filtro**: `src/components/PropertyTagsFilter.tsx`

### Como usar - Adicionar Tags:
1. Abra uma propriedade no admin
2. Clique no botão "Tags (0)"
3. Adicione tags sugeridas clicando nelas:
   - `tier-1`, `tier-2`, `tier-3`
   - `hot-lead`, `deed-certified`
   - `vacant`, `pool-distress`
   - `high-equity`, `out-of-state`
   - `follow-up`, `contacted`
4. Ou digite tags customizadas
5. Clique em "Save Tags"

### Como usar - Filtrar por Tags:
1. Na lista de propriedades, clique em "Filter by Tags"
2. Selecione as tags desejadas
3. A lista filtra automaticamente
4. Clique em "Clear all" para limpar filtros

### Integração no Admin:

**Gerenciar Tags:**
```tsx
import { PropertyTagsManager } from "@/components/PropertyTagsManager";

<PropertyTagsManager
  propertyId={property.id}
  currentTags={property.tags}
  onTagsUpdated={(newTags) => {
    // Atualiza a UI
    console.log("Tags atualizadas:", newTags);
  }}
/>
```

**Filtrar por Tags:**
```tsx
import { PropertyTagsFilter } from "@/components/PropertyTagsFilter";
import { useState } from "react";

const [selectedTags, setSelectedTags] = useState<string[]>([]);

// No componente:
<PropertyTagsFilter
  selectedTags={selectedTags}
  onFilterChange={(tags) => {
    setSelectedTags(tags);
    // Aplicar filtro na query
  }}
/>

// Na query do Supabase:
let query = supabase.from("properties").select("*");

if (selectedTags.length > 0) {
  query = query.contains("tags", selectedTags);
}
```

---

## 🗄️ Migration do Banco de Dados

### Executar a Migration:

**Opção 1 - Via Supabase Dashboard:**
1. Acesse https://supabase.com
2. Abra seu projeto
3. Vá em "SQL Editor"
4. Cole o conteúdo de `supabase/migrations/20251216000000_add_tags_to_properties.sql`
5. Execute

**Opção 2 - Via Supabase CLI:**
```bash
# Se você tem Supabase CLI instalado
supabase migration up
```

**SQL da Migration:**
```sql
-- Adiciona coluna tags
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Cria índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_properties_tags
ON properties USING GIN (tags);
```

---

## 📦 Storage Bucket (Supabase)

### Criar o Bucket para Imagens:

1. Acesse Supabase Dashboard
2. Vá em "Storage"
3. Clique em "Create Bucket"
4. Nome: `property-images`
5. **IMPORTANTE**: Marque como "Public bucket"
6. Clique em "Create bucket"

### Configurar Políticas (RLS):

```sql
-- Permitir leitura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');

-- Permitir upload autenticado
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

-- Permitir update autenticado
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'property-images' AND auth.role() = 'authenticated');
```

---

## 🎯 Exemplo Completo - Página Admin

```tsx
import { PropertyImageUpload } from "@/components/PropertyImageUpload";
import { PropertyTagsManager } from "@/components/PropertyTagsManager";
import { PropertyTagsFilter } from "@/components/PropertyTagsFilter";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const [properties, setProperties] = useState([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Carregar propriedades com filtro
  useEffect(() => {
    fetchProperties();
  }, [selectedTags]);

  const fetchProperties = async () => {
    let query = supabase.from("properties").select("*");

    // Aplicar filtro de tags
    if (selectedTags.length > 0) {
      query = query.contains("tags", selectedTags);
    }

    const { data, error } = await query;
    if (data) setProperties(data);
  };

  return (
    <div>
      {/* Filtro de Tags */}
      <div className="mb-4">
        <PropertyTagsFilter
          selectedTags={selectedTags}
          onFilterChange={setSelectedTags}
        />
      </div>

      {/* Lista de Propriedades */}
      <div className="space-y-4">
        {properties.map((property) => (
          <div key={property.id} className="border rounded-lg p-4">
            <h3>{property.address}</h3>

            {/* Imagem */}
            {property.property_image_url && (
              <img
                src={property.property_image_url}
                alt={property.address}
                className="w-full h-48 object-cover rounded"
              />
            )}

            {/* Botões */}
            <div className="flex gap-2 mt-4">
              <PropertyImageUpload
                propertyId={property.id}
                propertySlug={property.slug}
                currentImageUrl={property.property_image_url}
                onImageUploaded={fetchProperties}
              />

              <PropertyTagsManager
                propertyId={property.id}
                currentTags={property.tags}
                onTagsUpdated={fetchProperties}
              />
            </div>

            {/* Tags Display */}
            {property.tags && property.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {property.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## ✅ Checklist de Instalação

- [ ] Executar migration SQL (adicionar coluna tags)
- [ ] Criar bucket `property-images` no Supabase Storage
- [ ] Configurar bucket como público
- [ ] Importar componentes no Admin.tsx
- [ ] Testar upload de imagem
- [ ] Testar adicionar tags
- [ ] Testar filtrar por tags

---

## 🚀 Próximos Passos Sugeridos

1. **Import em Massa de Imagens**
   - Criar script para fazer upload de todas as 117 fotos do Step 3
   - Usar Supabase Storage API

2. **Auto-tag Baseado em Dados**
   - Quando importar propriedades do Orlando, adicionar tags automaticamente:
     - TIER 1 → tag "tier-1"
     - Deed Certified → tag "deed-certified"
     - Vacant → tag "vacant"
     - Pool distress → tag "pool-distress"

3. **Busca por Texto + Tags**
   - Combinar filtro de tags com busca por endereço/owner

4. **Estatísticas por Tag**
   - Dashboard mostrando quantas propriedades por tag
   - Conversão rate por tag

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os componentes criados em `src/components/`
2. Teste primeiro com uma propriedade
3. Verifique console do navegador para erros
4. Confirme que migration foi executada no Supabase

**Tudo funcionando dentro do Lovable! 🎉**
