# 📊 Como Obter Dados REAIS de Comparáveis

## 🎯 Status Atual

**ATUALMENTE:** Os dados exibidos são **100% DEMO** (gerados aleatoriamente)

Para usar **dados REAIS**, você precisa de uma das seguintes opções:

---

## ✅ OPÇÃO 1: Attom Data API (RECOMENDADO - GRÁTIS)

### **Por que Attom Data?**
- ✅ Dados oficiais de MLS (Multiple Listing Service)
- ✅ 1,000 requests GRÁTIS por mês
- ✅ Sem cartão de crédito
- ✅ Dados precisos e atualizados
- ✅ API simples e confiável

### **Como obter API Key (5 minutos):**

1. **Criar Conta:**
   - Acesse: https://api.developer.attomdata.com/signup
   - Preencha nome, email, empresa
   - Clique em "Sign Up"

2. **Verificar Email:**
   - Abra seu email
   - Clique no link de verificação

3. **Obter API Key:**
   - Login em: https://api.developer.attomdata.com/login
   - Vá para "API Keys" no menu
   - Clique em "Create API Key"
   - Copie a chave (ex: `a1b2c3d4e5f6g7h8i9j0`)

4. **Adicionar ao Projeto:**
   - Copie o arquivo `.env.example` para `.env`
   - Cole sua chave:
     ```
     VITE_ATTOM_API_KEY="sua_chave_aqui"
     ```
   - Salve o arquivo

5. **Restart o Servidor:**
   ```bash
   npm run dev
   ```

**Pronto!** Agora a tela de comps vai buscar dados REAIS automaticamente! 🎉

---

## ✅ OPÇÃO 2: RapidAPI + Zillow (BACKUP - GRÁTIS)

### **Quando usar?**
- Backup caso Attom Data falhe
- 500 requests grátis por mês

### **Como obter:**

1. **Criar Conta RapidAPI:**
   - https://rapidapi.com/auth/sign-up
   - Login com Google/GitHub (mais rápido)

2. **Assinar API do Zillow:**
   - https://rapidapi.com/apimaker/api/zillow-com1/pricing
   - Clique em "Subscribe to Test" (plano FREE)
   - **NÃO precisa cartão de crédito**

3. **Copiar API Key:**
   - Vá para "Endpoints" tab
   - Copie `X-RapidAPI-Key` do code snippet
   - Exemplo: `1234abcd5678efgh...`

4. **Adicionar ao `.env`:**
   ```
   VITE_RAPID_API_KEY="sua_chave_rapidapi"
   ```

---

## ✅ OPÇÃO 3: Orange County Property Appraiser (100% GRÁTIS)

### **Quando usar?**
- Propriedades em Orlando/Orange County
- Dados públicos oficiais
- **Sem limite de requests**
- **Sem API key necessária**

### **Como funciona:**
- Sistema já está configurado
- Busca automaticamente em: https://ocpafl.org
- Dados de vendas recentes públicas

**ATENÇÃO:** Funciona APENAS para propriedades em Orange County, FL

---

## ✅ OPÇÃO 4: Adicionar Manualmente no Supabase

### **Quando usar?**
- Você tem poucos comps (5-10)
- Quer controle total dos dados
- Dados de fontes específicas

### **Como adicionar:**

1. **Abra Supabase:**
   - https://app.supabase.com
   - Vá para seu projeto
   - Table Editor → `comparables`

2. **Adicione um Comp:**
   ```sql
   INSERT INTO comparables (
     address, city, state, zip_code,
     sale_date, sale_price,
     sqft, beds, baths, year_built,
     source
   ) VALUES (
     '123 Main St', 'Orlando', 'FL', '32801',
     '2025-01-10', 250000,
     1500, 3, 2, 2010,
     'manual'
   );
   ```

3. **Repetir** para cada comp que você tiver

---

## 📊 Como o Sistema Prioriza as Fontes

O sistema tenta buscar dados nesta ordem:

```
1️⃣ Supabase Database (seus comps manuais)
   ↓ (se não tiver 3+ comps)

2️⃣ Attom Data API (se tiver API key)
   ↓ (se falhar)

3️⃣ Orange County Records (grátis, público)
   ↓ (se falhar)

4️⃣ Zillow via RapidAPI (se tiver API key)
   ↓ (se falhar)

5️⃣ Dados DEMO (para testes)
```

---

## 🔍 Como Verificar se Está Funcionando

1. **Abra DevTools (F12)**
2. **Vá para Console**
3. **Selecione uma propriedade**
4. **Procure por:**
   - ✅ `✅ Found X comps from attom` → Funcionou!
   - ⚠️ `⚠️ No real comps found` → Usando demo

---

## 📝 Arquivo Criado para Você

Foi criado: `src/services/compsDataService.ts`

Este arquivo contém:
- ✅ Integração com Attom Data
- ✅ Integração com Zillow
- ✅ Integração com Orange County
- ✅ Fallback automático
- ✅ Cache no Supabase

---

## ⚡ Quick Start (Modo Fácil)

**Para ter dados REAIS em 5 minutos:**

1. Cadastre-se em: https://api.developer.attomdata.com/signup
2. Copie sua API key
3. Edite `.env`:
   ```
   VITE_ATTOM_API_KEY="sua_chave_aqui"
   ```
4. Restart: `npm run dev`
5. **PRONTO!** 🎉

---

## ❓ Perguntas Frequentes

**Q: Posso usar SEM API keys?**
A: Sim! O sistema usa Orange County public records (grátis) e seus dados manuais no Supabase.

**Q: Attom Data é realmente grátis?**
A: Sim, 1000 requests/mês sem cartão de crédito.

**Q: E se eu exceder 1000 requests?**
A: Sistema automaticamente usa Orange County ou seus dados no Supabase.

**Q: Funciona fora de Orlando?**
A: Sim com Attom Data ou Zillow. Orange County só funciona para Orlando/Orange County.

**Q: Como sei qual fonte foi usada?**
A: Olhe no console do navegador (F12) - mostra a fonte de cada comp.

---

## 🚀 Próximos Passos

1. ✅ Crie conta Attom Data (5 min)
2. ✅ Adicione API key no `.env`
3. ✅ Teste selecionando uma propriedade
4. ✅ Veja dados REAIS aparecerem!

**Boa sorte! 🎉**
