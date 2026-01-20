# 📊 Análise Completa do Fluxo de Comps (Manual + Automático)

## 🎯 Visão Geral

O sistema de Comps possui **2 modos principais**:
1. **Automático (APIs)** - Busca dados via APIs e edge function
2. **Manual (Links)** - Salva links de Trulia/Zillow/Redfin

---

## 🔄 FLUXO 1: Comps Automáticos (via APIs)

### 📍 Componentes Envolvidos:

```
CompsAnalysis.tsx (UI)
    ↓
CompsDataService.ts (Service Layer)
    ↓
Edge Function: fetch-comps (Server-side)
    ↓
[Google → Nominatim → City → Default]
    ↓
CompsMapboxMap.tsx (Visualização no Mapa)
```

### 🔧 Como Funciona:

#### 1. **Usuário Seleciona Propriedade**
**Arquivo:** `CompsAnalysis.tsx` linha 128
```typescript
const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
```

#### 2. **Trigger Automático de Geração**
**Arquivo:** `CompsAnalysis.tsx` linha 167-171
```typescript
useEffect(() => {
  if (selectedProperty) {
    generateComparables(selectedProperty);
  }
}, [selectedProperty]);
```

#### 3. **Chamada ao Service**
**Arquivo:** `CompsAnalysis.tsx` linha 239-252
```typescript
const generateComparables = async (property: Property) => {
  const realComps = await CompsDataService.getComparables(
    property.address,
    property.city,
    property.state,
    searchRadius,  // Raio configurável (1-10 milhas)
    10,           // Limite de resultados
    property.estimated_value || 250000
  );
```

#### 4. **Service com Cache**
**Arquivo:** `compsDataService.ts` linha 76-130
```typescript
static async getComparables(
  address, city, state, radius, limit, basePrice, useCache = true
) {
  // 1. Verifica cache (TTL: 5 minutos)
  const cacheKey = `${address}-${city}-${state}-${basePrice}-${radius}`;
  if (useCache && cache.has(cacheKey)) {
    return cached.data;
  }

  // 2. Chama edge function
  const { data } = await supabase.functions.invoke('fetch-comps', {
    body: { address, city, state, radius, limit, basePrice }
  });

  // 3. Salva no cache
  cache.set(cacheKey, { data, timestamp, source });

  return data;
}
```

#### 5. **Edge Function - Cascade de APIs**
**Arquivo:** `supabase/functions/fetch-comps/index.ts`

**Tentativa 1: Attom Data API**
```typescript
// FREE: 1000 requests/mês
async function fetchFromAttom(address, city, state, radius) {
  const url = `https://api.attomdata.com/.../radius=${radius}&maxComps=10`;
  // Retorna dados reais de vendas
}
```

**Tentativa 2: Zillow via RapidAPI**
```typescript
// FREE: 100 requests/mês
async function fetchFromZillow(address, city, state) {
  const url = `https://zillow-com1.p.rapidapi.com/...`;
  // Retorna comps do Zillow
}
```

**Tentativa 3: Orange County CSV**
```typescript
// FREE: dados públicos locais
async function fetchFromOrangeCountyCSV(city, state, basePrice, radius) {
  // Lê arquivo CSV com vendas históricas
}
```

**Tentativa 4: Demo Data (Fallback)**
```typescript
function generateDemoComps(basePrice, city, count = 6) {
  // Gera dados mockados realistas
  // Baseado em variação de ±30% do preço base
}
```

#### 6. **Detecção de Fonte**
**Arquivo:** `CompsAnalysis.tsx` linha 308-310
```typescript
if (realComps && realComps.length > 0) {
  const source = realComps[0].source || 'demo';
  setDataSource(source);  // 'attom', 'zillow', 'county-csv', ou 'demo'
}
```

#### 7. **Banner de Discovery**
**Arquivo:** `CompsAnalysis.tsx` linha 563-597
```typescript
{dataSource === 'demo' && (
  <Alert className="border-blue-500">
    <AlertTitle>🎭 Você está usando dados demo</AlertTitle>
    <AlertDescription>
      Configure APIs grátis para obter dados reais
      <Button onClick={() => setShowApiConfig(true)}>
        Configurar APIs Agora
      </Button>
    </AlertDescription>
  </Alert>
)}
```

#### 8. **Geocoding dos Comps**
**Arquivo:** `CompsAnalysis.tsx` linha 179-216
```typescript
useEffect(() => {
  const geocodeAll = async () => {
    // Geocode subject property
    const location = await geocodeAddress(
      selectedProperty.address,
      selectedProperty.city,
      selectedProperty.state
    );

    // Geocode each comparable
    for (const comp of comparables) {
      await geocodeAddress(comp.address);
      // Service handles rate limiting (1 req/s)
    }
  };
}, [selectedProperty, comparables]);
```

#### 9. **Exibição no Mapa**
**Arquivo:** `CompsAnalysis.tsx` linha 1010-1020
```typescript
<CompsMapboxMap
  subjectProperty={{
    address: selectedProperty.address,
    location: geocodedLocations[fullAddress]
  }}
  comparables={comparables.map(comp => ({
    ...comp,
    location: geocodedLocations[comp.address]
  }))}
/>
```

#### 10. **Análise de Mercado**
**Arquivo:** `CompsAnalysis.tsx` linha 410-470
```typescript
const calculateAnalysis = () => {
  // Calcula médias
  const avgSalePrice = average(comps.map(c => c.salePrice));
  const avgPricePerSqft = average(comps.map(c => c.pricePerSqft));
  const avgCapRate = average(comps.map(c => c.capRate));

  // Determina tendência de mercado
  const marketTrend = determineMarketTrend(comps);

  setAnalysis({
    avgSalePrice,
    avgPricePerSqft,
    suggestedValueMin: avgSalePrice * 0.85,
    suggestedValueMax: avgSalePrice * 1.15,
    marketTrend,
    avgCapRate,
    avgNOI
  });
};
```

---

## 🔄 FLUXO 2: Comps Manuais (via Links Salvos)

### 📍 Componentes Envolvidos:

```
CompsAnalysis.tsx (Tabs)
    ↓
ManualCompsManager.tsx (UI para salvar links)
    ↓
Supabase: manual_comps_links (Database)
    ↓
External Sites (Trulia, Zillow, Redfin)
```

### 🔧 Como Funciona:

#### 1. **Usuário Clica na Aba Manual**
**Arquivo:** `CompsAnalysis.tsx` linha 786-796
```typescript
<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'auto' | 'manual')}>
  <TabsList>
    <TabsTrigger value="auto">
      <Database className="w-4 h-4 mr-2" />
      Busca Automática (APIs)
    </TabsTrigger>
    <TabsTrigger value="manual">
      <LinkIcon className="w-4 h-4 mr-2" />
      Links Salvos (Manual)
    </TabsTrigger>
  </TabsList>
```

#### 2. **Renderiza ManualCompsManager**
**Arquivo:** `CompsAnalysis.tsx` linha 1644-1646
```typescript
<TabsContent value="manual">
  <ManualCompsManager />
</TabsContent>
```

#### 3. **Carrega Propriedades Disponíveis**
**Arquivo:** `ManualCompsManager.tsx` linha 76-89
```typescript
const loadProperties = async () => {
  const { data } = await supabase
    .from('properties')
    .select('id, address, city, state, zip_code')
    .order('created_at', { ascending: false })
    .limit(100);

  setProperties(data || []);
};
```

#### 4. **Usuário Seleciona Propriedade**
**Arquivo:** `ManualCompsManager.tsx` linha 92-102
```typescript
const handlePropertySelect = (propertyId: string) => {
  setSelectedPropertyId(propertyId);

  if (propertyId === 'manual') {
    setPropertyAddress(''); // Entrada manual
    return;
  }

  const property = properties.find(p => p.id === propertyId);
  if (property) {
    setPropertyAddress(`${property.address}, ${property.city}, ${property.state}`);
  }
};
```

#### 5. **Usuário Cola Link de Comps**
**Arquivo:** `ManualCompsManager.tsx` linha 324-380
```typescript
<Input
  placeholder="https://www.trulia.com/sold/..."
  value={compsUrl}
  onChange={(e) => setCompsUrl(e.target.value)}
/>

<Textarea
  placeholder="Notas sobre estes comps (opcional)"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>
```

#### 6. **Detecta Fonte Automaticamente**
**Arquivo:** `ManualCompsManager.tsx` linha 104-111
```typescript
const detectSource = (url: string): 'trulia' | 'zillow' | 'redfin' | 'realtor' | 'other' => {
  if (url.includes('trulia.com')) return 'trulia';
  if (url.includes('zillow.com')) return 'zillow';
  if (url.includes('redfin.com')) return 'redfin';
  if (url.includes('realtor.com')) return 'realtor';
  return 'other';
};
```

#### 7. **Salva no Supabase**
**Arquivo:** `ManualCompsManager.tsx` linha 147-209
```typescript
const handleSaveLink = async () => {
  // Validações
  if (!propertyAddress.trim()) {
    toast({ title: '⚠️ Endereço necessário' });
    return;
  }

  if (!compsUrl.trim() || !compsUrl.startsWith('http')) {
    toast({ title: '⚠️ URL inválida' });
    return;
  }

  // Verifica autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({ title: '❌ Você precisa estar logado' });
    return;
  }

  // Salva no banco
  const { error } = await supabase
    .from('manual_comps_links')
    .insert({
      property_address: propertyAddress,
      property_id: selectedPropertyId !== 'manual' ? selectedPropertyId : null,
      url: compsUrl,
      source: detectSource(compsUrl),
      notes: notes || null,
      user_id: user.id
    });

  if (!error) {
    toast({
      title: '✅ Link salvo!',
      description: `${getSourceLabel(detectSource(compsUrl))} adicionado`
    });

    // Limpa form
    setCompsUrl('');
    setNotes('');

    // Recarrega lista
    loadLinks();
  }
};
```

#### 8. **Exibe Links Salvos**
**Arquivo:** `ManualCompsManager.tsx` linha 435-530
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Endereço</TableHead>
      <TableHead>Fonte</TableHead>
      <TableHead>Data</TableHead>
      <TableHead>Ações</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredLinks.map(link => (
      <TableRow key={link.id}>
        <TableCell>{link.property_address}</TableCell>
        <TableCell>
          <Badge>{getSourceIcon(link.source)} {getSourceLabel(link.source)}</Badge>
        </TableCell>
        <TableCell>{formatDate(link.created_at)}</TableCell>
        <TableCell>
          <Button onClick={() => window.open(link.url, '_blank')}>
            <ExternalLink /> Abrir
          </Button>
          <Button onClick={() => handleCopyLink(link.url)}>
            <Copy /> Copiar
          </Button>
          <Button onClick={() => handleDelete(link.id)}>
            <Trash2 /> Remover
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

#### 9. **Filtro por Propriedade**
**Arquivo:** `ManualCompsManager.tsx` linha 396-420
```typescript
<Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
  <SelectTrigger>
    <SelectValue placeholder="Todas as propriedades" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todas as Propriedades</SelectItem>
    {properties.map(property => (
      <SelectItem key={property.id} value={property.id}>
        {property.address}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

// Filtragem
const filteredLinks = savedLinks.filter(link => {
  if (filterPropertyId === 'all') return true;
  return link.property_id === filterPropertyId;
});
```

---

## 🗄️ Database Schema

### Tabela: `manual_comps_links`

```sql
CREATE TABLE manual_comps_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source TEXT CHECK (source IN ('trulia', 'zillow', 'redfin', 'realtor', 'other')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- RLS Policies
ALTER TABLE manual_comps_links ENABLE ROW LEVEL SECURITY;

-- Users can only see their own links
CREATE POLICY "Users can view own links"
  ON manual_comps_links FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert own links"
  ON manual_comps_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own links"
  ON manual_comps_links FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_manual_comps_links_user_id ON manual_comps_links(user_id);
CREATE INDEX idx_manual_comps_links_property_id ON manual_comps_links(property_id);
```

---

## ⚙️ Configurações do Usuário

### 1. **Raio de Busca**
**Arquivo:** `CompsAnalysis.tsx` linha 156-159, 487-494
```typescript
const [searchRadius, setSearchRadius] = useState(() => {
  const saved = localStorage.getItem('comps_search_radius');
  return saved ? parseFloat(saved) : 1; // Default: 1 milha
});

const handleRadiusChange = (value: number) => {
  setSearchRadius(value);
  localStorage.setItem('comps_search_radius', value.toString());
};
```

**UI:**
```typescript
<Input
  type="number"
  min="0.5"
  max="10"
  step="0.5"
  value={searchRadius}
  onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
/>
```

### 2. **API Keys (Opcional)**
**Componente:** `CompsApiSettings.tsx`

**Variáveis de Ambiente (Supabase Secrets):**
```bash
ATTOM_API_KEY=sua_key_attom
RAPIDAPI_KEY=sua_key_rapidapi
GOOGLE_MAPS_API_KEY=sua_key_google
```

---

## 🎯 Casos de Uso

### Caso 1: Investidor Iniciante (Sem API Keys)
1. ✅ Usa dados demo para aprender o sistema
2. ✅ Vê banner explicando como configurar APIs
3. ✅ Pode usar modo manual (Trulia/Zillow)
4. ✅ Não precisa de conhecimento técnico

### Caso 2: Investidor Avançado (Com API Keys)
1. ✅ Configura Attom + RapidAPI (grátis)
2. ✅ Obtém dados reais de vendas
3. ✅ Banner desaparece automaticamente
4. ✅ Cache reduz consumo de API

### Caso 3: Equipe de Vendas (Modo Manual)
1. ✅ Usa aba Manual
2. ✅ Salva links de Trulia/Zillow
3. ✅ Links organizados por propriedade
4. ✅ Compartilha com time (mesmo user_id)

### Caso 4: Análise Híbrida
1. ✅ Usa APIs para dados quantitativos
2. ✅ Salva links manuais para referência visual
3. ✅ Combina ambos na análise final

---

## 🔍 Gaps Identificados

### ✅ **Implementado Corretamente:**
- ✅ Tabs separando Auto vs Manual
- ✅ Integração com Supabase (manual_comps_links)
- ✅ RLS policies para segurança multi-user
- ✅ Detecção automática de fonte (Trulia/Zillow/etc)
- ✅ Property selection com auto-fill
- ✅ Filtro de links por propriedade
- ✅ Cache de comps (5 min TTL)
- ✅ Geocoding com fallbacks
- ✅ Discovery banner (só aparece com demo data)
- ✅ Raio configurável (0.5-10 milhas)

### ⚠️ **Possíveis Melhorias (Opcionais):**

#### 1. **Integração Entre Modos**
**Status:** ❌ Não existe
**Gap:** Links manuais não aparecem no mapa junto com comps automáticos

**Solução Sugerida:**
```typescript
// Buscar dados de links manuais e mesclar com comps automáticos
const manualComps = await fetchManualCompsForProperty(selectedProperty.id);
const allComps = [...autoComps, ...manualCompsFromLinks];
```

#### 2. **Preview de Links Manuais**
**Status:** ❌ Não existe
**Gap:** Usuário precisa abrir link externo para ver comps

**Solução Sugerida:**
- Usar iframe ou Open Graph tags
- Mostrar preview da página (screenshot/meta)

#### 3. **Extração Automática de Dados**
**Status:** ❌ Não existe
**Gap:** Links salvos não extraem preço/sqft automaticamente

**Solução Sugerida:**
```typescript
// Web scraping ou API dos sites
async function extractDataFromUrl(url: string) {
  // Trulia, Zillow têm APIs
  // Ou usar scraping com Puppeteer
}
```

#### 4. **Export de Links Manuais**
**Status:** ❌ Não existe
**Gap:** Não exporta links junto com PDF

**Solução Sugerida:**
```typescript
// Adicionar seção no PDF com links salvos
const pdfContent = {
  autoComps: [...],
  manualLinks: savedLinks.filter(l => l.property_id === property.id)
};
```

#### 5. **Notificações de Novos Comps**
**Status:** ❌ Não existe
**Gap:** Usuário não sabe quando novos comps estão disponíveis

**Solução Sugerida:**
```typescript
// Background job que verifica APIs diariamente
// Email quando encontrar novos comps
```

---

## 📊 Fluxograma Visual

```
┌─────────────────────────────────────────────────────────┐
│           COMPS ANALYSIS - PÁGINA PRINCIPAL              │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ├─ Seleciona Propriedade
                       │
         ┌─────────────┴──────────────┐
         │                            │
    ┌────▼────┐                  ┌───▼────┐
    │ ABA AUTO│                  │ABA MANUAL│
    └────┬────┘                  └───┬────┘
         │                            │
         │ 1. generateComparables()   │ 1. ManualCompsManager
         │ 2. CompsDataService        │ 2. Select Property
         │ 3. fetch-comps edge fn     │ 3. Paste URL
         │ 4. [Attom→Zillow→CSV→Demo] │ 4. Detect Source
         │ 5. setDataSource()         │ 5. Save to Supabase
         │ 6. geocodeAddress()        │ 6. Display Table
         │ 7. CompsMapboxMap          │ 7. Filter by Property
         │ 8. calculateAnalysis()     │ 8. Open/Copy/Delete
         │                            │
         └─────────┬──────────────────┘
                   │
         ┌─────────▼──────────┐
         │  COMMON OUTPUTS:    │
         │  - PDF Export       │
         │  - Market Analysis  │
         │  - Offer Calculation│
         └────────────────────┘
```

---

## ✅ Conclusão

### **Fluxo Automático:**
- ✅ **100% Funcional**
- ✅ Cascade de APIs (Attom → Zillow → CSV → Demo)
- ✅ Cache de 5 minutos
- ✅ Geocoding com fallbacks
- ✅ Discovery banner para guiar usuário
- ✅ Raio configurável

### **Fluxo Manual:**
- ✅ **100% Funcional**
- ✅ Salva links no Supabase
- ✅ RLS policies (multi-user seguro)
- ✅ Property selection com auto-fill
- ✅ Filtro por propriedade
- ✅ Detecção automática de fonte

### **Integração:**
- ⚠️ **Separados mas completos**
- Os dois modos funcionam independentemente
- Usuário pode usar um, outro, ou ambos
- Não há conflito entre os modos

### **Recomendação:**
**O sistema está completo e funcional como está.** As melhorias sugeridas são **opcionais** e não críticas para o funcionamento.

**Prioridade de implementação (se quiser):**
1. 🟡 Integração de links no mapa (mesclar auto + manual)
2. 🟡 Export de links no PDF
3. 🟢 Preview de links (nice-to-have)
4. 🟢 Extração automática (complexo)
5. 🟢 Notificações (low priority)

**Sem implementar nada disso, o sistema já entrega valor:**
- Investidores iniciantes: modo demo + manual
- Investidores avançados: APIs reais
- Times de vendas: organização de links
