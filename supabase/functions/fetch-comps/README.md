# Fetch Comps Edge Function

Esta edge function busca comparáveis de propriedades (comps) usando **múltiplas fontes gratuitas** em cascata.

## 🎯 Fontes de Dados (em ordem de qualidade)

### 1️⃣ Attom Data API (MELHOR - Dados MLS reais)
- ✅ **1000 requests grátis/mês**
- ✅ Dados de MLS (Multiple Listing Service)
- ✅ Mais preciso e atualizado
- 📝 Sign up: https://api.developer.attomdata.com/

### 2️⃣ Zillow RapidAPI (BOM)
- ✅ **100 requests grátis/mês**
- ✅ Dados do Zillow
- ✅ Boa cobertura nacional
- 📝 Sign up: https://rapidapi.com/apimaker/api/zillow-com1

### 3️⃣ Orange County CSV (100% GRÁTIS)
- ✅ **Ilimitado e 100% grátis**
- ✅ Dados públicos de vendas do Orange County, FL
- ✅ Funciona apenas para Orlando/FL
- ⚠️ Atualizado mensalmente
- 📝 URL: https://www.ocpafl.org/downloads/sales.csv

### 4️⃣ Demo Data (Fallback)
- Se nenhuma fonte funcionar, retorna dados demo realistas
- Baseado no preço da propriedade

## 🔑 Como Configurar as API Keys

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Vá em **Edge Functions** > **Manage secrets**
3. Adicione as seguintes secrets:

```bash
ATTOM_API_KEY=sua_chave_aqui
RAPIDAPI_KEY=sua_chave_aqui
```

### Opção B: Via Supabase CLI

```bash
# Definir secrets
supabase secrets set ATTOM_API_KEY=sua_chave_aqui
supabase secrets set RAPIDAPI_KEY=sua_chave_aqui

# Verificar secrets
supabase secrets list

# Deploy da função
supabase functions deploy fetch-comps
```

## 📊 Como Funciona a Cascata

```
┌─────────────────────────────────┐
│ 1. Tentar Attom Data API        │
│    (1000 free/mês)              │
└────────────┬────────────────────┘
             │ Falhou?
             ▼
┌─────────────────────────────────┐
│ 2. Tentar Zillow RapidAPI       │
│    (100 free/mês)               │
└────────────┬────────────────────┘
             │ Falhou?
             ▼
┌─────────────────────────────────┐
│ 3. Tentar Orange County CSV     │
│    (100% grátis, ilimitado)     │
└────────────┬────────────────────┘
             │ Falhou?
             ▼
┌─────────────────────────────────┐
│ 4. Retornar Demo Data           │
│    (baseado no preço)           │
└─────────────────────────────────┘
```

## 📝 Como Obter as API Keys

### 1. Attom Data API (1000 free/mês)

1. Acesse: https://api.developer.attomdata.com/
2. Clique em **Sign Up** (grátis)
3. Preencha o formulário
4. Confirme seu email
5. Acesse **Dashboard** > **API Keys**
6. Copie sua API key
7. Adicione ao Supabase: `ATTOM_API_KEY=sua_chave_aqui`

### 2. Zillow via RapidAPI (100 free/mês)

1. Acesse: https://rapidapi.com/apimaker/api/zillow-com1
2. Clique em **Sign Up** (grátis)
3. Escolha o plano **Basic** (100 requests/mês grátis)
4. Clique em **Subscribe to Test**
5. Copie sua **X-RapidAPI-Key** (aparece nos code snippets)
6. Adicione ao Supabase: `RAPIDAPI_KEY=sua_chave_aqui`

### 3. Orange County CSV (100% grátis)

Não precisa de API key! É 100% público e gratuito.

## 🧪 Testar Localmente

```bash
# Deploy da função
supabase functions deploy fetch-comps

# Testar
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-comps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "address": "1025 S WASHINGTON AVE",
    "city": "Orlando",
    "state": "FL",
    "basePrice": 250000
  }'
```

## 📈 Response Format

```json
{
  "success": true,
  "source": "attom",
  "count": 8,
  "apiKeysConfigured": {
    "attom": true,
    "rapidapi": true
  },
  "comps": [
    {
      "address": "123 Main St",
      "city": "Orlando",
      "state": "FL",
      "zipCode": "32801",
      "saleDate": "2024-01-15",
      "salePrice": 245000,
      "beds": 3,
      "baths": 2,
      "sqft": 1450,
      "yearBuilt": 1995,
      "propertyType": "Single Family",
      "source": "attom"
    }
  ]
}
```

## 🎯 Recomendações

- **MVP/Demo**: Use sem API keys (dados demo funcionam bem)
- **Produção pequena**: Configure apenas Orange County CSV (grátis ilimitado para FL)
- **Produção séria**: Configure Attom + RapidAPI + Orange County (1100 requests/mês grátis)
- **Alta escala**: Considere planos pagos do Attom Data

## ⚠️ Limites de Rate

- **Attom Data**: 1000 requests/mês (free tier)
- **RapidAPI**: 100 requests/mês (free tier)
- **Orange County CSV**: Ilimitado (mas download ~1-2MB por request)
- **Demo Data**: Ilimitado

## 🔍 Logs

Para ver os logs da edge function:

```bash
supabase functions logs fetch-comps --tail
```

Ou no dashboard: Edge Functions > fetch-comps > Logs
