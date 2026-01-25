# 🧪 Testing Checklist - Recent Fixes

## ✅ Correções Implementadas

### 1. **Retell AI Webhook Format** ✅
- **Problema**: Webhook retornava formato errado com wrappers extras
- **Correção**: Agora retorna APENAS `{ call_inbound: { dynamic_variables: {...} } }`
- **Arquivo**: `supabase/functions/retell-webhook-handler/index.ts`

### 2. **Geocodificação de Comparables** ✅
- **Problema**: Comparables geocodificados sem cidade/estado (apareciam espalhados)
- **Correção**: Usa endereço completo `"address, city, state zip"`
- **Arquivo**: `src/components/marketing/CompsMapboxMap.tsx`

### 3. **Coordenadas nos Dados DEMO** ✅
- **Problema**: Dados DEMO não tinham latitude/longitude
- **Correção**: Gera coordenadas em raio de 0.02° (~2.2km) da propriedade
- **Arquivo**: `supabase/functions/fetch-comps/index.ts`

### 4. **Mapa no PDF** ✅
- **Problema**: Marcadores no PDF eram genéricos sem coordenadas
- **Correção**: Usa coordenadas reais quando disponíveis
- **Arquivo**: `src/utils/pdfExport.ts`

### 5. **Cache de Comparables** ✅
- **Problema**: Chamava API repetidamente para mesma propriedade
- **Correção**: Cache permanente (para sempre) em memória
- **Arquivo**: `src/components/marketing/CompsAnalysis.tsx`

### 6. **Migration para Coordenadas** ✅
- **Novo**: Tabela `comparables_cache` para salvar comps
- **Novo**: Campos `latitude`, `longitude` na tabela `properties`
- **Arquivo**: `supabase/migrations/20260124000000_add_property_coords_and_comps_cache.sql`

---

## 📋 Testes a Fazer

### Teste 1: Retell Webhook ⏳
```bash
# Executar:
node test-retell-webhook.js

# Verificar:
- Status 200
- Formato correto: { "call_inbound": { "dynamic_variables": {...} } }
- Variáveis: customer_name, property_address, cash_offer, etc
- SEM wrappers: success, retell_response, webhook_data
```

**Resultado Esperado:**
```json
{
  "call_inbound": {
    "dynamic_variables": {
      "customer_name": "IVERSON DELLA M",
      "property_address": "1025 S WASHINGTON AVE",
      "property_city": "Orlando",
      "property_state": "FL",
      "property_zip": "32801",
      "estimated_value": "100000",
      "cash_offer": "99576",
      "dnc_status": "Clear",
      "deceased_status": "Active"
    }
  }
}
```

---

### Teste 2: Mapa de Comparables ⏳
```
1. Abrir https://offer.mylocalinvest.com/marketing/comps
2. Selecionar uma propriedade aprovada com oferta
3. Esperar carregar comparables (dados DEMO)
4. Abrir aba "Map"

Verificar:
✅ Marcador vermelho (subject property) no centro
✅ Marcadores azuis (comparables) próximos (não espalhados)
✅ Todos os marcadores em Orlando/FL
✅ Console mostra: "Using cached coordinates for..." OU "Geocoding: [address], Orlando, FL 32801"
✅ Popup dos comps mostra endereço + cidade/estado
```

---

### Teste 3: Export PDF com Mapa ⏳
```
1. Na mesma tela de Comps Analysis
2. Clicar "Export" > "Quick PDF"
3. Abrir PDF gerado

Verificar:
✅ Seção "Property Location & Comparables Map" presente
✅ Mapa mostra marcadores agrupados (não espalhados)
✅ Marcador vermelho (subject) visível
✅ Marcadores azuis (comps) próximos ao vermelho
✅ Imagem do mapa carregou corretamente
```

---

### Teste 4: Export All Filtered ⏳
```
1. Aplicar filtros: "Approved" + "With Offer"
2. Clicar "Export All Filtered" (botão roxo)
3. Aguardar processamento (vários minutos para 28 propriedades)

Verificar:
✅ Console mostra: "Using cached data for export: [address]" (maioria)
✅ Console mostra: "Fetching new data for export: [address]" (poucos)
✅ Console mostra: "Exporting 1/28 properties..." até "28/28"
✅ PDF gerado com 28 propriedades
✅ Não teve erros "Cannot read properties of undefined"
```

---

### Teste 5: Cache Funcionando ⏳
```
1. Selecionar propriedade A
2. Esperar carregar comps
3. Selecionar propriedade B
4. Voltar para propriedade A

Verificar Console:
✅ 1ª vez: "Fetching new comparables for property: [A]"
✅ 2ª vez (ao voltar): "Using cached comparables for property: [A]"
✅ Dados carregam instantaneamente
✅ Sem chamadas à API na segunda vez
```

---

## 🚀 Próximos Passos (Pendentes)

### Pendente 1: Salvar Comps no Supabase
- [ ] Modificar `CompsDataService` para salvar em `comparables_cache`
- [ ] Buscar do cache antes de chamar API
- [ ] Cache persistente entre sessões
- [ ] **Benefício**: Economia massiva de API calls

### Pendente 2: Usar Coordenadas de Cada Propriedade
- [ ] Passar lat/lng da propriedade para edge function
- [ ] Gerar comps DEMO ao redor da propriedade específica
- [ ] Cada propriedade tem seus próprios comps próximos
- [ ] **Benefício**: Comps geograficamente precisos

### Pendente 3: Migration no Supabase
- [ ] Rodar migration: `20260124000000_add_property_coords_and_comps_cache.sql`
- [ ] Verificar tabela `comparables_cache` criada
- [ ] Verificar campos `latitude`, `longitude` em `properties`
- [ ] **Benefício**: Estrutura pronta para cache persistente

---

## ❓ Como Reportar Problemas

Se algo não funcionar:

1. **Abrir Console do navegador** (F12)
2. **Copiar mensagens de erro**
3. **Screenshot da tela com problema**
4. **Descrever passos para reproduzir**

Exemplos de problemas para reportar:
- ❌ Marcadores ainda aparecem espalhados
- ❌ PDF sem mapa ou mapa vazio
- ❌ Erro "Cannot read properties of undefined"
- ❌ Cache não está funcionando (sempre busca da API)
- ❌ Webhook retorna formato errado

---

## 📊 Status dos Testes

| Teste | Status | Notas |
|-------|--------|-------|
| Retell Webhook | ⏳ Pendente | Executar `node test-retell-webhook.js` |
| Mapa Comparables | ⏳ Pendente | Verificar marcadores agrupados |
| PDF com Mapa | ⏳ Pendente | Verificar mapa no PDF |
| Export All Filtered | ⏳ Pendente | Testar com 28 propriedades |
| Cache Funcionando | ⏳ Pendente | Verificar console logs |

---

**Última atualização**: 2026-01-24 20:30 EST
