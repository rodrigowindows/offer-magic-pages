# 🚀 Recursos Avançados - Filtros, Fotos e Airbnb

## 📋 O que foi criado

### 1. **Filtros Avançados**
- Filtrar por Cidade (multi-select)
- Filtrar por County (multi-select)
- Filtrar por Tipo de Propriedade
- Filtrar por Lote de Importação
- Filtrar por Data de Importação (range)
- Filtrar por Faixa de Preço
- Filtrar por Quartos (mínimo)
- Filtrar por Airbnb Elegível
- Filtrar por "Tem Foto"

### 2. **Exibição de Fotos**
- Grid de fotos na lista
- Zoom ao clicar
- Placeholder quando não tem foto
- Error handling se foto falhar

### 3. **Check de Elegibilidade Airbnb**
- Verifica regulamentações locais
- Base de dados de cidades da Flórida
- Salva resultado no banco
- Mostra: permite STR, requer licença, min/max noites

---

## 🗄️ Migration SQL

**Arquivo:** `supabase/migrations/20251216000002_add_filters_and_airbnb.sql`

**Colunas adicionadas:**

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `import_date` | date | Data que foi importado |
| `import_batch` | text | Lote (ex: "orlando-tier1-dec2025") |
| `last_contact_date` | date | Última vez que contatou |
| `next_followup_date` | date | Próximo follow-up agendado |
| `airbnb_eligible` | boolean | Se pode fazer Airbnb |
| `airbnb_check_date` | timestamp | Quando verificou |
| `airbnb_regulations` | jsonb | JSON com detalhes |
| `airbnb_notes` | text | Notas sobre Airbnb |
| `county` | text | County (Orange, Osceola, etc) |
| `property_type` | text | Single Family, Condo, etc |
| `bedrooms` | integer | Número de quartos |
| `bathrooms` | numeric | Número de banheiros |
| `square_feet` | integer | Área em pés quadrados |
| `lot_size` | numeric | Tamanho do terreno |
| `year_built` | integer | Ano de construção |

---

## 💻 Como Usar os Componentes

### 1. Filtros Avançados

**Importar:**
```tsx
import { AdvancedPropertyFilters, PropertyFilters } from "@/components/AdvancedPropertyFilters";
import { useState, useEffect } from "react";
```

**Usar:**
```tsx
const [filters, setFilters] = useState<PropertyFilters>({});

<AdvancedPropertyFilters
  filters={filters}
  onFiltersChange={(newFilters) => {
    setFilters(newFilters);
    // Recarregar lista com novos filtros
    fetchProperties(newFilters);
  }}
/>
```

**Aplicar filtros na query:**
```tsx
const fetchProperties = async (filters: PropertyFilters) => {
  let query = supabase.from("properties").select("*");

  // Filtro por cidades
  if (filters.city && filters.city.length > 0) {
    query = query.in("city", filters.city);
  }

  // Filtro por county
  if (filters.county && filters.county.length > 0) {
    query = query.in("county", filters.county);
  }

  // Filtro por tipo
  if (filters.propertyType && filters.propertyType.length > 0) {
    query = query.in("property_type", filters.propertyType);
  }

  // Filtro por lote
  if (filters.importBatch && filters.importBatch.length > 0) {
    query = query.in("import_batch", filters.importBatch);
  }

  // Filtro por data de importação
  if (filters.importDateFrom) {
    query = query.gte("import_date", filters.importDateFrom.toISOString());
  }
  if (filters.importDateTo) {
    query = query.lte("import_date", filters.importDateTo.toISOString());
  }

  // Filtro por preço
  if (filters.priceMin) {
    query = query.gte("estimated_value", filters.priceMin);
  }
  if (filters.priceMax) {
    query = query.lte("estimated_value", filters.priceMax);
  }

  // Filtro por quartos
  if (filters.bedrooms) {
    query = query.gte("bedrooms", filters.bedrooms);
  }

  // Filtro por Airbnb
  if (filters.airbnbEligible) {
    query = query.eq("airbnb_eligible", true);
  }

  // Filtro por tem foto
  if (filters.hasImage) {
    query = query.not("property_image_url", "is", null);
  }

  const { data, error } = await query;
  return data;
};
```

---

### 2. Exibição de Foto

**Importar:**
```tsx
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
```

**Usar na lista (thumbnail):**
```tsx
<PropertyImageDisplay
  imageUrl={property.property_image_url}
  address={property.address}
  className="w-full h-48"
  showZoom={true}
/>
```

**Usar em detalhes (grande):**
```tsx
<PropertyImageDisplay
  imageUrl={property.property_image_url}
  address={property.address}
  className="w-full h-96"
  showZoom={true}
/>
```

**Features:**
- Se não tem foto: mostra placeholder "Sem foto"
- Se foto falhar: mostra "Erro ao carregar"
- Hover: mostra botão "Ver Ampliado"
- Click: abre dialog com foto em tamanho grande

---

### 3. Check de Airbnb

**Importar:**
```tsx
import { AirbnbEligibilityChecker } from "@/components/AirbnbEligibilityChecker";
```

**Usar:**
```tsx
<AirbnbEligibilityChecker
  propertyId={property.id}
  propertyAddress={property.address}
  city={property.city}
  state={property.state}
  currentEligible={property.airbnb_eligible}
  currentRegulations={property.airbnb_regulations}
  currentNotes={property.airbnb_notes}
  lastCheckDate={property.airbnb_check_date}
  onCheckComplete={() => {
    // Recarregar propriedade após check
    fetchProperties();
  }}
/>
```

**Visual:**
- Badge: "Não Verificado" (cinza), "Airbnb OK" (verde), "Não Permitido" (vermelho)
- Click: abre dialog com detalhes
- Botão "Verificar Elegibilidade" ou "Verificar Novamente"

**Cidades com regras conhecidas:**
- Orlando: ✅ Permitido com licença
- Kissimmee: ✅ Permitido com licença
- Miami: ❌ Proibido (mínimo 180 dias)
- Tampa: ✅ Permitido com licença
- Fort Lauderdale: ❌ Proibido
- Jacksonville: ✅ Permitido
- Davenport: ✅ Permitido (área turística)
- Clermont: ✅ Permitido

---

## 🎨 Exemplo Completo - Admin.tsx com Tudo

```tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdvancedPropertyFilters, PropertyFilters } from "@/components/AdvancedPropertyFilters";
import { PropertyImageDisplay } from "@/components/PropertyImageDisplay";
import { AirbnbEligibilityChecker } from "@/components/AirbnbEligibilityChecker";
import { PropertyApprovalDialog } from "@/components/PropertyApprovalDialog";
import { PropertyTagsManager } from "@/components/PropertyTagsManager";
import { PropertyImageUpload } from "@/components/PropertyImageUpload";

const Admin = () => {
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);

    let query = supabase.from("properties").select("*");

    // Aplicar todos os filtros
    if (filters.city?.length) {
      query = query.in("city", filters.city);
    }
    if (filters.county?.length) {
      query = query.in("county", filters.county);
    }
    if (filters.propertyType?.length) {
      query = query.in("property_type", filters.propertyType);
    }
    if (filters.importBatch?.length) {
      query = query.in("import_batch", filters.importBatch);
    }
    if (filters.importDateFrom) {
      query = query.gte("import_date", filters.importDateFrom.toISOString());
    }
    if (filters.importDateTo) {
      query = query.lte("import_date", filters.importDateTo.toISOString());
    }
    if (filters.priceMin) {
      query = query.gte("estimated_value", filters.priceMin);
    }
    if (filters.priceMax) {
      query = query.lte("estimated_value", filters.priceMax);
    }
    if (filters.bedrooms) {
      query = query.gte("bedrooms", filters.bedrooms);
    }
    if (filters.airbnbEligible) {
      query = query.eq("airbnb_eligible", true);
    }
    if (filters.hasImage) {
      query = query.not("property_image_url", "is", null);
    }

    const { data, error } = await query;

    if (data) {
      setProperties(data);
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Gestão de Propriedades</h1>

      {/* Filtros Avançados */}
      <div className="mb-6">
        <AdvancedPropertyFilters
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Lista de Propriedades */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="border rounded-lg overflow-hidden shadow-lg">
              {/* Foto da Propriedade */}
              <PropertyImageDisplay
                imageUrl={property.property_image_url}
                address={property.address}
                className="w-full h-48"
                showZoom={true}
              />

              {/* Informações */}
              <div className="p-4">
                <h3 className="font-bold text-lg">{property.address}</h3>
                <p className="text-sm text-muted-foreground">
                  {property.city}, {property.state} {property.zip_code}
                </p>

                {property.bedrooms && property.bathrooms && (
                  <p className="text-sm mt-2">
                    🛏️ {property.bedrooms} quartos | 🚿 {property.bathrooms} banheiros
                  </p>
                )}

                {property.estimated_value && (
                  <p className="text-sm font-semibold text-green-600 mt-2">
                    💰 ${property.estimated_value.toLocaleString()}
                  </p>
                )}

                {/* Botões de Ação */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Upload de Foto */}
                  <PropertyImageUpload
                    propertyId={property.id}
                    propertySlug={property.slug}
                    currentImageUrl={property.property_image_url}
                    onImageUploaded={fetchProperties}
                  />

                  {/* Tags */}
                  <PropertyTagsManager
                    propertyId={property.id}
                    currentTags={property.tags}
                    onTagsUpdated={fetchProperties}
                  />

                  {/* Airbnb Check */}
                  <AirbnbEligibilityChecker
                    propertyId={property.id}
                    propertyAddress={property.address}
                    city={property.city}
                    state={property.state}
                    currentEligible={property.airbnb_eligible}
                    currentRegulations={property.airbnb_regulations}
                    currentNotes={property.airbnb_notes}
                    lastCheckDate={property.airbnb_check_date}
                    onCheckComplete={fetchProperties}
                  />

                  {/* Aprovação */}
                  <PropertyApprovalDialog
                    propertyId={property.id}
                    propertyAddress={property.address}
                    currentStatus={property.approval_status}
                    rejectionReason={property.rejection_reason}
                    rejectionNotes={property.rejection_notes}
                    onStatusChange={fetchProperties}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {properties.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-12">
          <p>Nenhuma propriedade encontrada com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
```

---

## 📦 Importação em Lote com Filtros

### Quando importar do Step 4, adicione metadados:

```python
# No script de importação
import_batch_name = "orlando-tier1-dec2025"
import_date = datetime.today().strftime("%Y-%m-%d")

for property in properties:
    property_record = {
        # ... campos normais ...
        'import_date': import_date,
        'import_batch': import_batch_name,
        'county': 'Orange County',  # Extrair do Step 4
        'property_type': 'Single Family',  # Extrair do Step 4
        'bedrooms': property.get('bedrooms'),
        'bathrooms': property.get('bathrooms'),
        'square_feet': property.get('living_area'),
        'lot_size': property.get('lot_size'),
        'year_built': property.get('year_built'),
    }
```

Assim você pode filtrar:
- "Mostrar apenas importações de dezembro 2025"
- "Mostrar apenas Orange County"
- "Mostrar apenas Single Family de 3+ quartos"

---

## 🔍 Queries Úteis

### Propriedades elegíveis para Airbnb em Orlando

```tsx
const { data } = await supabase
  .from("properties")
  .select("*")
  .eq("city", "Orlando")
  .eq("airbnb_eligible", true);
```

### Propriedades importadas essa semana com foto

```tsx
const oneWeekAgo = new Date();
oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

const { data } = await supabase
  .from("properties")
  .select("*")
  .gte("import_date", oneWeekAgo.toISOString())
  .not("property_image_url", "is", null);
```

### Propriedades de 3+ quartos abaixo de $200k

```tsx
const { data } = await supabase
  .from("properties")
  .select("*")
  .gte("bedrooms", 3)
  .lte("estimated_value", 200000);
```

---

## ✅ Checklist de Implementação

- [ ] Executar migration `20251216000002_add_filters_and_airbnb.sql`
- [ ] Importar `AdvancedPropertyFilters` no Admin
- [ ] Importar `PropertyImageDisplay` no Admin
- [ ] Importar `AirbnbEligibilityChecker` no Admin
- [ ] Aplicar filtros na query do Supabase
- [ ] Testar filtro por cidade
- [ ] Testar filtro por data
- [ ] Testar exibição de fotos
- [ ] Testar zoom de foto
- [ ] Testar check de Airbnb
- [ ] Adicionar `import_batch` ao importar propriedades

---

## 🚀 APIs Pagas (Opcionais)

### AirDNA API
**URL:** https://www.airdna.co/business/api
**Preço:** ~$200/mês
**Features:**
- Receita média estimada por propriedade
- Taxa de ocupação da área
- Número de competidores
- Análise de temporadas

**Integração:**
```tsx
// Substituir em src/utils/airbnbChecker.ts
export const getAirbnbMarketData = async (address, city, state) => {
  const response = await fetch(`https://api.airdna.co/v1/property/analytics`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRDNA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address, city, state }),
  });

  const data = await response.json();
  return data;
};
```

### Alternativas (Mais Baratas):

1. **Mashvisor API** - ~$50/mês
   - URL: https://www.mashvisor.com/api
   - Tem dados de Airbnb + análise de mercado

2. **Zillow API** (Property Data) - Grátis
   - URL: https://www.zillow.com/howto/api/APIOverview.htm
   - Dados básicos de propriedade (não tem Airbnb)

---

## 📊 Dashboard de Estatísticas

**Criar dashboard com contadores:**

```tsx
const [stats, setStats] = useState({
  total: 0,
  withPhotos: 0,
  airbnbEligible: 0,
  byCity: {},
});

const loadStats = async () => {
  const { data } = await supabase.from("properties").select("*");

  if (data) {
    const stats = {
      total: data.length,
      withPhotos: data.filter(p => p.property_image_url).length,
      airbnbEligible: data.filter(p => p.airbnb_eligible).length,
      byCity: data.reduce((acc, p) => {
        acc[p.city] = (acc[p.city] || 0) + 1;
        return acc;
      }, {}),
    };

    setStats(stats);
  }
};
```

---

## 🎉 Pronto!

Agora você tem:
- ✅ Filtros super avançados (10+ opções)
- ✅ Grid de fotos com zoom
- ✅ Check de elegibilidade Airbnb
- ✅ Base de dados de cidades da Flórida
- ✅ Tudo integrado no Lovable

**Próximos passos:**
1. Executar as 2 migrations
2. Integrar componentes no Admin.tsx
3. Importar propriedades com metadados (batch, tipo, quartos, etc.)
4. Testar filtros
5. (Opcional) Integrar AirDNA API para dados de mercado

**Dúvidas?** Veja os componentes em `src/components/` e utilitários em `src/utils/`
