# 🎯 PROMPT DETALHADO - Correções Sistema AVM + ATTOM V2

**Data:** 26 de Janeiro de 2026  
**Status Atual:** Muitas correções já implementadas ✅

---

## ✅ **CORREÇÕES JÁ IMPLEMENTADAS**

1. ✅ **Ajuste de Sqft Dinâmico** - Já calcula baseado em preço médio dos comps
2. ✅ **County Mapping com Fallback** - Já usa `suggestCounty()` como fallback
3. ✅ **Combinação de Comps** - Já combina V2 + V1 quando < 3 comps
4. ✅ **County Mapping Separado** - Já tem arquivo `cityCountyMap.ts` no edge function
5. ✅ **Trigger SQL Removido** - Migration não tem mais trigger
6. ✅ **Busca Características do Banco** - Já busca sqft/beds/baths do banco antes de calcular

---

## 🔴 **CORREÇÕES CRÍTICAS PENDENTES**

### **1. Confidence Score - Adicionar Consideração de Qualidade dos Dados**

**Arquivo:** `src/services/avmService.ts` (linhas 126-134)

**Problema Atual:**
```typescript
// Confidence score (0-95%)
// 50% base + 5% por comp + bônus de qualidade
let qualityBonus = 0;
// Exemplo de cálculo de qualidade (pode ser ajustado conforme validação real)
if (validComps.length >= 5) qualityBonus = 10;
else if (validComps.length >= 3) qualityBonus = 5;
const baseConfidence = 50;
const compBonus = validComps.length * 5; // Max 25% (5 comps)
const confidence = Math.min(95, baseConfidence + compBonus + qualityBonus);
```

**O que falta:**
- Não considera distância média dos comps
- Não considera recência das vendas
- Não considera qualidade da fonte (attom-v2 vs demo)
- Não usa resultado de `validateComps()` que já existe

**Solução:**
```typescript
// Confidence score (0-95%)
// 50% base + 5% por comp + bônus de qualidade + penalidades
const baseConfidence = 50;
const compBonus = validComps.length * 5; // 5% por comp (max 25% com 5 comps)

// Calcular distância média
const avgDistance = validComps.reduce((sum, c) => sum + (c.distance || 0), 0) / validComps.length;
const distancePenalty = avgDistance > 2 ? -10 : avgDistance > 1 ? -5 : 0;

// Calcular recência média (dias desde venda)
const avgDaysAgo = validComps.reduce((sum, c) => {
  const daysAgo = Math.floor((Date.now() - new Date(c.saleDate).getTime()) / (1000 * 60 * 60 * 24));
  return sum + daysAgo;
}, 0) / validComps.length;
const recencyBonus = avgDaysAgo < 90 ? 10 : avgDaysAgo < 180 ? 5 : 0;

// Bônus por qualidade da fonte
const sourceBonus = validComps.every(c => c.source === 'attom-v2' || c.source === 'attom') ? 5 : 0;

// Usar validação existente
const validation = this.validateComps(validComps);
const qualityBonus = validation.quality === 'excellent' ? 10 : 
                     validation.quality === 'good' ? 5 : 
                     validation.quality === 'fair' ? 0 : -5;

const confidence = Math.min(95, baseConfidence + compBonus + qualityBonus + recencyBonus + sourceBonus + distancePenalty);
```

**Localização:** `src/services/avmService.ts` linhas 126-134

---

## 🟡 **MELHORIAS MÉDIAS PENDENTES**

### **2. Validação de Estrutura V2 - Adicionar Logging Detalhado**

**Arquivo:** `supabase/functions/fetch-comps/index.ts` (função `extractAttomV2Comparables`)

**Problema Atual:**
- Se API mudar formato, retorna array vazio sem erro claro
- Não loga estrutura recebida para debugging

**Solução:**
```typescript
function extractAttomV2Comparables(data: any, defaults: { city: string; state: string; zipCode: string }): ComparableData[] {
  const results: ComparableData[] = [];

  // Log estrutura recebida para debugging
  console.log('📦 ATTOM V2 Response Structure:', JSON.stringify(Object.keys(data || {})));
  
  // V2 format (RESPONSE_GROUP)
  const v2Props = data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;
  
  if (Array.isArray(v2Props)) {
    console.log(`✅ Found V2 format with ${v2Props.length} properties`);
    const parsedV2 = v2Props
      .map((entry: any) => parseAttomV2Comparable(entry, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];
    results.push(...parsedV2);
  } else if (v2Props) {
    console.log('⚠️ V2 format found but not an array:', typeof v2Props);
  } else {
    console.log('⚠️ V2 format (RESPONSE_GROUP) not found in response');
  }

  // Fallback for legacy format (data.property)
  if (Array.isArray(data?.property)) {
    console.log(`✅ Found legacy format with ${data.property.length} properties`);
    const parsedLegacy = data.property
      .map((prop: any) => parseLegacyComparable(prop, defaults))
      .filter((comp: ComparableData | null) => comp !== null && comp.salePrice > 0) as ComparableData[];
    results.push(...parsedLegacy);
  } else if (data?.property) {
    console.log('⚠️ Legacy format found but not an array:', typeof data.property);
  }

  if (results.length === 0) {
    console.error('❌ No comparables extracted from ATTOM V2 response');
    console.log('📋 Full response structure:', JSON.stringify(data, null, 2).substring(0, 1000));
  }

  return results;
}
```

**Localização:** `supabase/functions/fetch-comps/index.ts` função `extractAttomV2Comparables`

---

### **3. Ajustes de Beds/Baths - Tornar Dinâmicos**

**Arquivo:** `src/services/avmService.ts` (linhas 64-76)

**Problema Atual:**
```typescript
// Ajuste por bedrooms ($5k per bed)
if (comp.beds !== subjectBeds) {
  const bedAdjustment = (subjectBeds - comp.beds) * 5000;
  // ...
}

// Ajuste por baths ($3k per bath)
if (comp.baths !== subjectBaths) {
  const bathAdjustment = (subjectBaths - comp.baths) * 3000;
  // ...
}
```

**Solução:**
```typescript
// Calcular preço médio por sqft para usar como base
const avgPricePerSqft = validComps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / validComps.length;

// Ajuste por bedrooms (proporcional ao preço médio)
if (comp.beds !== subjectBeds) {
  // $5K por bed ou 2% do preço médio, o que for maior
  const bedValuePerUnit = Math.max(5000, avgPricePerSqft * 100 * 0.02);
  const bedAdjustment = (subjectBeds - comp.beds) * bedValuePerUnit;
  price += bedAdjustment;
  adjustments += bedAdjustment;
}

// Ajuste por baths (proporcional ao preço médio)
if (comp.baths !== subjectBaths) {
  // $3K por bath ou 1.5% do preço médio, o que for maior
  const bathValuePerUnit = Math.max(3000, avgPricePerSqft * 100 * 0.015);
  const bathAdjustment = (subjectBaths - comp.baths) * bathValuePerUnit;
  price += bathAdjustment;
  adjustments += bathAdjustment;
}
```

**Localização:** `src/services/avmService.ts` linhas 64-76

---

## 🟢 **MELHORIAS BAIXAS (OPCIONAIS)**

### **4. Adicionar Métricas de Qualidade no Breakdown**

**Arquivo:** `src/services/avmService.ts` (função `calculateValueFromComps`)

**Adicionar ao breakdown:**
```typescript
const breakdown = {
  estimatedValue,
  minValue,
  maxValue,
  confidence,
  usedComps: validComps.length,
  methods: {
    weighted: Math.round(weightedValue),
    median: Math.round(medianValue),
    average: Math.round(averageValue)
  },
  stdDev: Math.round(stdDev),
  adjustments: {
    sqft: subjectSqft,
    beds: subjectBeds,
    baths: subjectBaths
  },
  // NOVO: Métricas de qualidade
  quality: {
    avgDistance: Math.round(avgDistance * 10) / 10,
    avgDaysAgo: Math.round(avgDaysAgo),
    sources: [...new Set(validComps.map(c => c.source))],
    validation: validation.quality
  }
};
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Prioridade ALTA (Crítico):**
- [ ] **1. Confidence Score** - Adicionar consideração de distância, recência e fonte
  - Arquivo: `src/services/avmService.ts` linhas 126-134
  - Tempo estimado: 30 minutos

### **Prioridade MÉDIA:**
- [ ] **2. Validação Estrutura V2** - Adicionar logging detalhado
  - Arquivo: `supabase/functions/fetch-comps/index.ts` função `extractAttomV2Comparables`
  - Tempo estimado: 20 minutos

- [ ] **3. Ajustes Beds/Baths Dinâmicos** - Tornar proporcional ao preço médio
  - Arquivo: `src/services/avmService.ts` linhas 64-76
  - Tempo estimado: 20 minutos

### **Prioridade BAIXA (Opcional):**
- [ ] **4. Métricas de Qualidade** - Adicionar ao breakdown
  - Arquivo: `src/services/avmService.ts` função `calculateValueFromComps`
  - Tempo estimado: 15 minutos

---

## 🧪 **TESTES APÓS IMPLEMENTAÇÃO**

### **Teste 1: Confidence Score**
```typescript
// Testar com comps próximos e recentes
const compsProximos = [
  { distance: 0.5, saleDate: '2025-12-01', source: 'attom-v2', ... },
  { distance: 0.8, saleDate: '2025-11-15', source: 'attom-v2', ... }
];
// Esperado: confidence > 80%

// Testar com comps distantes e antigos
const compsDistantes = [
  { distance: 3.5, saleDate: '2024-06-01', source: 'demo', ... },
  { distance: 4.2, saleDate: '2024-05-15', source: 'demo', ... }
];
// Esperado: confidence < 60%
```

### **Teste 2: Validação Estrutura V2**
- Fazer request para ATTOM V2
- Verificar logs no console do edge function
- Confirmar que estrutura é logada mesmo se vazia

### **Teste 3: Ajustes Dinâmicos**
- Testar com propriedade de $500K (alta)
- Testar com propriedade de $100K (baixa)
- Verificar que ajustes são proporcionais

---

## 📝 **INSTRUÇÕES DE IMPLEMENTAÇÃO**

### **Passo 1: Confidence Score Melhorado**
1. Abrir `src/services/avmService.ts`
2. Localizar função `calculateValueFromComps` (linha ~24)
3. Encontrar cálculo de confidence (linhas 126-134)
4. Substituir pelo código da solução acima
5. Importar `validateComps` se necessário (já existe na classe)

### **Passo 2: Logging V2**
1. Abrir `supabase/functions/fetch-comps/index.ts`
2. Localizar função `extractAttomV2Comparables` (linha ~230)
3. Adicionar logs conforme solução acima
4. Testar com request real

### **Passo 3: Ajustes Dinâmicos**
1. Abrir `src/services/avmService.ts`
2. Localizar ajustes de beds/baths (linhas 64-76)
3. Calcular `avgPricePerSqft` antes dos ajustes
4. Aplicar fórmula proporcional

---

## ✅ **VALIDAÇÃO FINAL**

Após implementar todas as correções:

1. **Executar testes:**
   ```bash
   npm run dev
   # Testar com: 25217 Mathew St, Orlando, FL
   ```

2. **Verificar logs:**
   - Console do navegador (confidence score)
   - Supabase Edge Function logs (estrutura V2)

3. **Validar resultados:**
   - Confidence score deve variar entre 50-95%
   - Ajustes devem ser proporcionais ao preço
   - Logs devem mostrar estrutura V2

---

## 🎯 **RESUMO**

**Status Atual:** 6/9 correções já implementadas ✅

**Pendente:**
- 🔴 **1 crítica:** Confidence score considerar qualidade
- 🟡 **2 médias:** Logging V2 + Ajustes dinâmicos beds/baths
- 🟢 **1 baixa:** Métricas de qualidade (opcional)

**Tempo Total Estimado:** 1-2 horas

**Pronto para produção após:** Correção crítica do confidence score
