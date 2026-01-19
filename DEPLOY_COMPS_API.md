# 🚀 Deploy da Fetch Comps API - Guia Completo

## ✅ O que foi implementado:

Implementei **3 fontes gratuitas de dados reais** em cascata:

1. **Attom Data API** (1000 requests grátis/mês) - Dados MLS
2. **Zillow RapidAPI** (100 requests grátis/mês) - Dados Zillow
3. **Orange County CSV** (100% grátis, ilimitado) - Dados públicos FL

## 📋 Passo a Passo para Deploy

### 1. Login no Supabase

```bash
cd "Step 5 - Outreach & Campaigns"
npx supabase login
```

Se pedir token, pegue em: https://supabase.com/dashboard/account/tokens

### 2. Deploy da Edge Function

```bash
npx supabase functions deploy fetch-comps
```

### 3. Configurar API Keys (Opcional mas Recomendado)

#### Opção A: Via Dashboard (Mais fácil)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Edge Functions** > **Manage secrets**
4. Adicione:

```
ATTOM_API_KEY=sua_chave_aqui
RAPIDAPI_KEY=sua_chave_aqui
```

#### Opção B: Via CLI

```bash
# Definir secrets
npx supabase secrets set ATTOM_API_KEY=sua_chave_aqui
npx supabase secrets set RAPIDAPI_KEY=sua_chave_aqui

# Verificar
npx supabase secrets list
```

### 4. Testar a API

```bash
# Substitua YOUR_PROJECT_REF e YOUR_ANON_KEY
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

## 🔑 Como Obter as API Keys (GRÁTIS!)

### 1. Attom Data (1000 free/mês)

**Tempo: 2 minutos**

1. Acesse: https://api.developer.attomdata.com/
2. Clique **Sign Up** (grátis)
3. Preencha: Nome, Email, Empresa
4. Confirme email
5. Dashboard > API Keys > Copie a key
6. Cole no Supabase: `ATTOM_API_KEY=sua_chave`

### 2. RapidAPI Zillow (100 free/mês)

**Tempo: 3 minutos**

1. Acesse: https://rapidapi.com/apimaker/api/zillow-com1
2. Clique **Sign Up** (grátis)
3. Escolha plano **Basic** (FREE - 100 req/mês)
4. Click **Subscribe to Test**
5. Copie **X-RapidAPI-Key** do code snippet
6. Cole no Supabase: `RAPIDAPI_KEY=sua_chave`

### 3. Orange County CSV

**Não precisa de nada! É 100% público e grátis.**

## 🎯 Cenários de Uso

### Cenário 1: Sem API Keys (MVP/Demo)
- ✅ Funciona imediatamente
- ✅ Usa dados demo realistas
- ⚠️ Não são dados reais
- **Ideal para**: Testes, MVP, protótipos

### Cenário 2: Só Orange County CSV (100% Grátis)
- ✅ 100% grátis, ilimitado
- ✅ Dados reais de vendas em Orlando/FL
- ⚠️ Só funciona para Florida
- ⚠️ Atualizado mensalmente
- **Ideal para**: Produção em Orlando/FL sem custo

### Cenário 3: Attom + RapidAPI + Orange County (Recomendado)
- ✅ 1100 requests grátis/mês
- ✅ Dados MLS + Zillow + County
- ✅ Cobertura nacional
- ✅ Dados mais precisos
- **Ideal para**: Produção séria

## 📊 Como a Cascata Funciona

A função tenta em ordem:

```
1. Attom Data API     ───> Dados MLS (1000 free/mês)
   │ Falhou ou sem key?
   ↓
2. Zillow RapidAPI    ───> Dados Zillow (100 free/mês)
   │ Falhou ou sem key?
   ↓
3. Orange County CSV  ───> Dados públicos FL (ilimitado)
   │ Falhou ou fora de FL?
   ↓
4. Demo Data          ───> Dados realistas baseados no preço
```

## 🧪 Verificar Status da API

Depois do deploy, teste:

```javascript
// No browser console ou app
const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/fetch-comps', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    address: '1025 S WASHINGTON AVE',
    city: 'Orlando',
    state: 'FL',
    basePrice: 250000
  })
});

const data = await response.json();
console.log('Source:', data.source); // 'attom', 'zillow-api', 'county-csv', ou 'demo'
console.log('Comps:', data.comps);
console.log('API Keys configured:', data.apiKeysConfigured);
```

## 📝 Response Esperado

Com API keys configuradas:

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

Sem API keys:

```json
{
  "success": true,
  "source": "demo",
  "count": 6,
  "apiKeysConfigured": {
    "attom": false,
    "rapidapi": false
  },
  "comps": [ /* demo data */ ]
}
```

## 🔍 Ver Logs

```bash
# Real-time logs
npx supabase functions logs fetch-comps --tail

# Ou no dashboard
# Edge Functions > fetch-comps > Logs
```

## ⚠️ Troubleshooting

### "Access token not provided"
```bash
npx supabase login
```

### "Function not found"
```bash
npx supabase functions deploy fetch-comps
```

### Comps retornando "demo"
1. Verifique se as API keys estão configuradas
2. Verifique os logs: `npx supabase functions logs fetch-comps`
3. Teste as APIs manualmente

### CSV parsing error
- Normal! O CSV do Orange County pode ter formato diferente
- Outras fontes vão funcionar normalmente

## 💰 Custos

- **Grátis até 1100 requests/mês** (Attom 1000 + RapidAPI 100)
- **Orange County CSV**: Ilimitado e grátis
- **Demo data**: Ilimitado e grátis

Para mais de 1100 requests/mês, considere:
- Attom Data pago: $49/mês (10k requests)
- RapidAPI Pro: $10/mês (1000 requests)

## ✅ Checklist de Deploy

- [ ] Login no Supabase: `npx supabase login`
- [ ] Deploy function: `npx supabase functions deploy fetch-comps`
- [ ] Sign up Attom Data (2 min)
- [ ] Sign up RapidAPI (3 min)
- [ ] Adicionar secrets no Supabase
- [ ] Testar API
- [ ] Ver logs para confirmar fonte de dados

## 🎉 Pronto!

Agora você tem **3 fontes gratuitas de dados reais de comps** funcionando em cascata!
