# 🔍 Como Verificar se os Dados são de Produção

Este guia explica como verificar se o sistema de Comps está retornando dados **REAIS** de produção (não dados demo/simulados).

---

## ⚠️ **IMPORTANTE**

O sistema tem uma flag `isDemo` que indica se os dados são simulados ou reais. **Sempre verifique esta flag antes de usar os dados em produção!**

---

## 🎯 **Verificação Rápida**

### **Via Script Node.js**

```bash
node test-comps-api.js
```

O script vai:
- ✅ Testar com endereço real (25217 Mathew St, Orlando, FL)
- ✅ Verificar flag `isDemo`
- ✅ Validar source (attom-v2, attom-v1, etc)
- ✅ Mostrar alertas claros se estiver usando dados demo

### **Via Script Bash (Linux/Mac)**

```bash
chmod +x test-comps-production.sh
./test-comps-production.sh
```

### **Via Script PowerShell (Windows)**

```powershell
.\test-comps-production.ps1
```

### **Via cURL Manual**

```bash
curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/fetch-comps" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyODUzODcsImV4cCI6MjA0OTg2MTM4N30.yMSiS4bnkjKQe9_YXAuAOLaZcHs8xpBmS2-qhkBw-Aw" \
  -d '{
    "address": "25217 Mathew St",
    "city": "Orlando",
    "state": "FL",
    "basePrice": 250000,
    "radius": 3,
    "zipCode": "32833"
  }'
```

---

## ✅ **Dados de Produção (isDemo: false)**

### **Resposta Esperada:**

```json
{
  "success": true,
  "isDemo": false,
  "source": "attom-v2",
  "apiKeysConfigured": {
    "attom": true,
    "rapidapi": false
  },
  "comps": [
    {
      "address": "25302 Mathew St",
      "city": "Orlando",
      "state": "FL",
      "salePrice": 115000,
      "source": "attom",
      "latitude": 28.5383,
      "longitude": -81.3792,
      "distance": 0.3
    }
  ],
  "count": 3,
  "message": "Found 3 real comparables from attom-v2"
}
```

### **Indicadores de Produção:**

- ✅ `isDemo: false`
- ✅ `source` é um dos: `"attom-v2"`, `"attom-v1"`, `"attom"`, `"zillow-api"`, `"county-csv"`
- ✅ `apiKeysConfigured.attom: true`
- ✅ Comps têm `latitude` e `longitude` reais
- ✅ Addresses são endereços reais (não gerados)
- ✅ Comps têm `source` individual real (não "demo")

---

## ⚠️ **Dados Demo (isDemo: true)**

### **Resposta com Dados Demo:**

```json
{
  "success": true,
  "isDemo": true,
  "source": "demo",
  "apiKeysConfigured": {
    "attom": false,
    "rapidapi": false
  },
  "comps": [
    {
      "address": "1234 Oak St",
      "city": "Orlando",
      "state": "FL",
      "salePrice": 250000,
      "source": "demo",
      "latitude": 28.5383,
      "longitude": -81.3792
    }
  ],
  "count": 6,
  "message": "⚠️ Using simulated demo data. Configure ATTOM_API_KEY for real comparables."
}
```

### **Indicadores de Demo:**

- ❌ `isDemo: true`
- ❌ `source: "demo"`
- ❌ `apiKeysConfigured.attom: false`
- ⚠️ Mensagem de aviso clara

---

## 🔧 **Como Configurar para Produção**

Se você receber `isDemo: true`, siga estes passos:

### **1. Configurar ATTOM_API_KEY no Supabase**

**Via Dashboard:**
1. Acesse: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions
2. Vá em "Secrets"
3. Adicione: `ATTOM_API_KEY` = `ab8b3f3032756d9c17529dc80e07049b`

**Via CLI:**
```bash
# Fazer login primeiro
npx supabase login

# Configurar secret
npx supabase secrets set ATTOM_API_KEY=ab8b3f3032756d9c17529dc80e07049b --project-ref atwdkhlyrffbaugkaker
```

### **2. Fazer Deploy da Edge Function**

```bash
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker
```

### **3. Testar Novamente**

Execute o script de teste novamente:
```bash
node test-comps-api.js
```

---

## 🧪 **Testes de Validação**

### **Teste 1: Verificar Flag isDemo**

```javascript
const response = await fetch('...');
const data = await response.json();

if (data.isDemo === true) {
  console.error('❌ Usando dados DEMO!');
} else {
  console.log('✅ Dados de produção');
}
```

### **Teste 2: Verificar Source**

```javascript
const REAL_SOURCES = ['attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv'];

if (REAL_SOURCES.includes(data.source)) {
  console.log('✅ Fonte de dados real');
} else {
  console.error('❌ Fonte desconhecida ou demo');
}
```

### **Teste 3: Verificar API Keys**

```javascript
if (data.apiKeysConfigured?.attom === true) {
  console.log('✅ ATTOM_API_KEY configurada');
} else {
  console.error('❌ ATTOM_API_KEY não configurada');
}
```

### **Teste 4: Verificar Comps Individuais**

```javascript
const demoComps = data.comps.filter(c => c.source === 'demo');
if (demoComps.length > 0) {
  console.error(`❌ ${demoComps.length} comps são DEMO`);
} else {
  console.log('✅ Todos os comps são reais');
}
```

---

## 📊 **Interpretação dos Resultados**

### **Cenário 1: Tudo OK ✅**

```
✅ isDemo: false
✅ source: "attom-v2"
✅ ATTOM_API_KEY configurada
✅ Todos os comps são reais
```

**Ação:** Nenhuma - sistema está funcionando corretamente!

---

### **Cenário 2: API Key Não Configurada ⚠️**

```
❌ isDemo: true
❌ source: "demo"
❌ ATTOM_API_KEY não configurada
```

**Ação:** 
1. Configurar `ATTOM_API_KEY` no Supabase
2. Fazer deploy da edge function
3. Testar novamente

---

### **Cenário 3: API Key Configurada mas Retornando Demo ⚠️**

```
⚠️ isDemo: true (mas apiKeysConfigured.attom: true)
⚠️ source: "demo"
```

**Possíveis causas:**
- API key inválida ou expirada
- Endpoint ATTOM não disponível no Free Trial
- Erro na edge function (verificar logs)

**Ação:**
1. Verificar logs da edge function: `npx supabase functions logs fetch-comps --tail`
2. Testar API ATTOM diretamente
3. Verificar se API key está ativa no dashboard ATTOM

---

## 🔍 **Troubleshooting**

### **Problema: Sempre retorna isDemo: true**

**Solução:**
1. Verificar se secret está configurado: `npx supabase secrets list --project-ref atwdkhlyrffbaugkaker`
2. Verificar se edge function foi deployada: `npx supabase functions list --project-ref atwdkhlyrffbaugkaker`
3. Verificar logs: `npx supabase functions logs fetch-comps --tail`

### **Problema: API Key configurada mas retorna 401**

**Solução:**
1. Verificar se API key está correta
2. Verificar se Free Trial ainda está ativo
3. Testar endpoint ATTOM diretamente com a key

### **Problema: Retorna comps mas source é "demo"**

**Solução:**
1. Verificar se cascata de fontes está funcionando
2. Verificar logs da edge function para ver qual fonte foi tentada
3. Verificar se todas as APIs falharam antes de usar demo

---

## 📝 **Checklist de Validação**

Antes de considerar o sistema "em produção", verifique:

- [ ] `isDemo: false` na resposta
- [ ] `source` é um dos: "attom-v2", "attom-v1", "attom", "zillow-api", "county-csv"
- [ ] `apiKeysConfigured.attom: true`
- [ ] Comps têm coordenadas reais (latitude/longitude)
- [ ] Addresses são endereços reais (não gerados)
- [ ] Comps individuais têm `source` real (não "demo")
- [ ] Mensagem não contém aviso de dados demo

---

## 🎯 **Resumo**

**Dados de Produção:**
- ✅ `isDemo: false`
- ✅ `source` real (attom-v2, attom-v1, etc)
- ✅ `apiKeysConfigured.attom: true`

**Dados Demo:**
- ❌ `isDemo: true`
- ❌ `source: "demo"`
- ❌ `apiKeysConfigured.attom: false`

**Sempre verifique a flag `isDemo` antes de usar os dados!**
