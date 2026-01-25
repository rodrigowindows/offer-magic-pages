# 📋 Como Validar Dados no Supabase

A API key fornecida não está funcionando via curl (pode ter RLS ativo nas tabelas).

**Use um destes 3 métodos:**

---

## ✅ MÉTODO 1: Supabase Dashboard (RECOMENDADO)

### Passo 1: Acessar SQL Editor

1. Ir para https://supabase.com/dashboard
2. Selecionar projeto: `atwdkhlyrffbaugkaker`
3. Menu lateral → **SQL Editor**
4. Clicar em **New Query**

### Passo 2: Rodar Queries de Validação

**Query 1: Verificar Estimated Values**
```sql
SELECT
  estimated_value,
  COUNT(*) as property_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM properties
WHERE estimated_value IS NOT NULL
GROUP BY estimated_value
ORDER BY property_count DESC
LIMIT 10;
```

**Resultado Esperado:**
- ❌ Se aparecer: `100000 | 28 | 100.00%` → PROBLEMA! Todos $100K
- ✅ Se aparecer vários valores diferentes → OK

---

**Query 2: Verificar Distâncias dos Comps**
```sql
SELECT
  COUNT(*) as total_comps,
  SUM(CASE WHEN distance = 0 OR distance IS NULL THEN 1 ELSE 0 END) as zero_distance,
  SUM(CASE WHEN distance > 0 THEN 1 ELSE 0 END) as valid_distance,
  ROUND(AVG(distance), 2) as avg_distance,
  ROUND(MIN(distance), 2) as min_distance,
  ROUND(MAX(distance), 2) as max_distance
FROM comparables_cache;
```

**Resultado Esperado:**
- ❌ `zero_distance > 30%` → PROBLEMA! Muitos comps sem distância
- ✅ `zero_distance < 10%` → BOM! Poucos problemas

---

**Query 3: Verificar Fonte dos Dados**
```sql
SELECT
  source,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM comparables_cache
GROUP BY source
ORDER BY count DESC;
```

**Resultado Esperado:**
- ❌ `demo | 150 | 92.00%` → PROBLEMA! Usando fallback data
- ✅ `attom | 100 | 60.00%` → BOM! Usando API real

---

**Query 4: Encontrar Property #1 (Problema)**
```sql
SELECT id, address, city, zip_code, estimated_value
FROM properties
WHERE address LIKE '%25217 MATHEW%'
   OR address LIKE '%MATHEW ST%';
```

**Resultado Esperado:**
- Se retornar alguma linha → DELETE essa property
- Se vazio → Já foi deletada (OK)

---

**Query 5: Comps Recentes (Validar Fix)**
```sql
SELECT
  address,
  distance,
  source,
  created_at::date as added_date
FROM comparables_cache
ORDER BY created_at DESC
LIMIT 20;
```

**Resultado Esperado:**
- ✅ Comps recentes (últimos 7 dias) com `distance > 0` → Fix funcionando!
- ❌ Comps recentes com `distance = 0` → Fix NÃO deployed ainda

---

## ✅ MÉTODO 2: Browser Console

### Passo 1: Abrir App
1. Ir para seu app: https://seu-app.vercel.app (ou localhost)
2. Fazer login
3. Abrir DevTools (F12)
4. Ir para aba **Console**

### Passo 2: Copiar e Colar Script
```javascript
// Copie TODO o conteúdo do arquivo: test-supabase-database.js
// Cole no console e pressione Enter
```

**Arquivo:** [test-supabase-database.js](test-supabase-database.js)

### Passo 3: Analisar Resultados
O script vai rodar 5 testes automáticos e mostrar:
- ✅ Estimated values distribution
- ✅ Distance analysis
- ✅ Data source distribution
- ✅ Problem properties
- ✅ Recent comps quality

---

## ✅ MÉTODO 3: Supabase Table Editor

### Passo 1: Acessar Tables
1. Dashboard → **Table Editor**
2. Selecionar tabela: **properties**

### Passo 2: Verificar Manualmente
**Colunas para checar:**
- `estimated_value` → Todos $100,000? ❌
- `latitude`, `longitude` → Preenchidos? ✅

### Passo 3: Verificar Comparables
1. Mudar para tabela: **comparables_cache**
2. Verificar colunas:
   - `distance` → Tem zeros? ❌
   - `source` → Maioria é 'demo'? ❌
   - `latitude`, `longitude` → Preenchidos? ✅

---

## 📊 RESULTADOS ESPERADOS

### ✅ BANCO SAUDÁVEL (Health Score > 90%)
```
Estimated Values:
  - Vários valores diferentes ($92K, $96K, $103K, etc.)
  - Não todos iguais ✅

Distances:
  - 0% com distance = 0
  - Avg distance: 0.5-1.2 mi
  - Max distance: < 3.0 mi ✅

Data Sources:
  - attom: 40%
  - zillow: 30%
  - county-csv: 20%
  - demo: 10% ✅
```

### ❌ PROBLEMAS DETECTADOS (Health Score < 70%)
```
Estimated Values:
  - TODOS = $100,000 ❌ PROBLEMA!

Distances:
  - 30-40% com distance = 0 ❌ PROBLEMA!
  - Muitos comps gerados antes do fix

Data Sources:
  - demo: 92% ❌ PROBLEMA!
  - APIs não configuradas ou falhando
```

---

## 🔧 AÇÕES BASEADAS NOS RESULTADOS

### Se Estimated Value = $100K (todos):
```bash
# Implementar cálculo de AVM
# Ver arquivo: COMPS-VALIDATION-REPORT.md seção "Issue #2"
```

### Se Distance = 0 (>30%):
```bash
# Deploy edge function fix
supabase functions deploy fetch-comps

# Deletar properties problemáticas
# Regenerar properties
```

### Se Demo Data (>50%):
```bash
# Verificar API keys no Supabase
# Dashboard → Edge Functions → Environment Variables
# Adicionar:
ATTOM_API_KEY=...
RAPIDAPI_KEY=...
```

---

## 📁 ARQUIVOS DE SUPORTE

1. [SUPABASE-DATABASE-VALIDATION.sql](SUPABASE-DATABASE-VALIDATION.sql) - 12 queries SQL completas
2. [test-supabase-database.js](test-supabase-database.js) - Script browser console
3. [COMPS-VALIDATION-REPORT.md](COMPS-VALIDATION-REPORT.md) - Relatório completo
4. [analyze-comps-database-quality.js](analyze-comps-database-quality.js) - Análise local

---

## 🎯 PRÓXIMO PASSO

**Escolha UM método acima e execute.**

Depois me envie os resultados e eu vou dizer exatamente o que fazer! 🚀
