# 🚀 Guia de Pré-Deploy - Orlando Real Estate App

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Ferramentas Disponíveis](#ferramentas-disponíveis)
3. [Processo de Deploy](#processo-de-deploy)
4. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Este guia fornece todas as ferramentas e checklists necessários para garantir que o código está **100% livre de erros** antes de fazer deploy para produção.

### Arquivos Criados

- **[FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md)** - Checklist manual completo
- **[scripts/check-errors.js](./scripts/check-errors.js)** - Script automatizado de verificação
- **[PRE_DEPLOY_GUIDE.md](./PRE_DEPLOY_GUIDE.md)** - Este arquivo

---

## Ferramentas Disponíveis

### 1. 🤖 Verificação Automatizada

Execute o script de verificação antes de cada deploy:

```bash
npm run check:errors
```

**O que verifica:**
- ✅ `.map()` sem prop `key`
- ✅ `console.log` esquecidos
- ✅ Acessos a arrays sem verificação null-safe
- ✅ `useEffect` sem cleanup em código assíncrono
- ✅ Imports com paths muito profundos (sugerir `@/` alias)
- ✅ Hooks condicionais (viola Rules of Hooks)
- ✅ Acessos profundos a propriedades sem optional chaining (`?.`)

**Exemplo de saída:**
```
🔍 VERIFICAÇÃO DE ERROS FRONTEND
=============================================================

⚠️  AVISOS (12)

⚠️  Possível .map() sem prop "key" (3 ocorrências)
   📁 src/components/PropertyList.tsx:45
      {properties.map(prop => <PropertyCard property={prop} />)}

⚠️  console.log encontrado (remover antes de deploy) (2 ocorrências)
   📁 src/hooks/useSkipTraceData.ts:78
      console.log('Fetched data:', result)

📊 Resumo:
   Erros críticos: 0
   Warnings: 12

✅ Sem erros críticos, mas revise os warnings.
```

### 2. 📋 Checklist Manual

Abra [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md) e siga todos os itens:

- Console Errors
- Network Errors
- Estados Vazios
- Responsividade
- Formulários
- Autenticação
- Edge Functions
- UI/UX
- Performance
- Dados e Integrações

### 3. 🛠️ Prompt para Lovable

Quando encontrar erros, use este prompt no Lovable:

```
Revise TODO o código do projeto e corrija os seguintes problemas:

1. **TypeError/undefined**: Adicione verificações null-safe usando optional chaining (?.) e nullish coalescing (??)
   - Procure por: .map(), .filter(), .find(), acessos a propriedades aninhadas

2. **Keys faltando**: Adicione prop "key" única em todos os .map() que renderizam JSX

3. **Memory leaks**: Adicione cleanup functions em useEffect com chamadas assíncronas

4. **Imports quebrados**: Verifique todos os imports (paths, case-sensitivity)

5. **Estados loading/error**: Garanta que toda chamada async tem estados de loading e error tratados

6. **Console.log esquecidos**: Remova todos os console.log de debug

7. **Type safety**: Adicione verificações de tipo (Array.isArray, typeof, etc)

**TESTE**: Navegue por cada página e garanta **0 erros no console**.

Arquivos críticos para revisar:
- src/pages/ImportProperties.tsx
- src/components/skip-trace/SkipTraceDataViewer.tsx
- src/hooks/useSkipTraceData.ts
- src/services/marketingService.ts
```

---

## Processo de Deploy

### 🔹 Passo 1: Verificação Automatizada

```bash
# Rodar script de verificação
npm run check:errors
```

Se encontrar warnings/erros:
1. Revise cada item
2. Corrija ou documente por que não é um problema
3. Execute novamente até ficar 100% limpo

### 🔹 Passo 2: Build Local

```bash
# Build de produção
npm run build
```

**IMPORTANTE**: O script `check:errors` roda automaticamente antes do build (prebuild hook).

Se o build falhar:
1. Leia a mensagem de erro
2. Corrija o problema
3. Execute `npm run build` novamente

### 🔹 Passo 3: Preview Local

```bash
# Testar build localmente
npm run preview
```

Navegue pela aplicação e teste:
- ✅ Todas as páginas carregam
- ✅ Nenhum erro no console
- ✅ Todas as funcionalidades funcionam

### 🔹 Passo 4: Checklist Manual

Abra [FRONTEND_CHECKLIST.md](./FRONTEND_CHECKLIST.md) e marque cada item:

```markdown
- [x] Console: 0 erros
- [x] Network: 0 erros 4xx/5xx
- [x] Estados vazios funcionam
- [x] Responsivo mobile/tablet/desktop
- [x] Formulários validam corretamente
- [x] Auth funciona
- [x] Edge Functions retornam dados
```

### 🔹 Passo 5: Deploy

**Supabase Edge Functions:**
```bash
# Deploy de edge functions (se alteradas)
supabase functions deploy get-skip-trace-data
```

**Frontend (Lovable):**
1. Commit e push para o repositório
2. Lovable fará deploy automaticamente
3. Ou use o botão "Deploy" no Lovable

### 🔹 Passo 6: Verificação Pós-Deploy

Após deploy, teste em produção:

```bash
# Verificar logs de edge functions
supabase functions logs get-skip-trace-data --follow
```

Navegue pela aplicação em produção:
- ✅ Console sem erros
- ✅ Network sem erros
- ✅ Funcionalidades críticas funcionam

---

## Troubleshooting

### ❌ Build falha com erros TypeScript

**Problema:** Erros de tipo durante build

**Solução:**
```bash
# Verificar erros TypeScript
npx tsc --noEmit

# Revisar arquivos com erros
# Adicionar tipos corretos ou usar 'any' temporariamente (não recomendado)
```

### ❌ Script check-errors.js falha

**Problema:** `node scripts/check-errors.js` retorna erro

**Solução:**
```bash
# Verificar se o arquivo existe
ls scripts/check-errors.js

# Verificar permissões (Linux/Mac)
chmod +x scripts/check-errors.js

# Executar diretamente com node
node scripts/check-errors.js
```

### ❌ Muitos warnings no check-errors

**Problema:** Script retorna 50+ warnings

**Solução:**
1. **Não ignore os warnings!** Cada um pode ser um bug em potencial
2. Corrija os mais críticos primeiro (hooks condicionais, memory leaks)
3. Use o prompt do Lovable para correções em lote
4. Execute novamente até warnings < 10

### ❌ Erro "Cannot read property of undefined" em produção

**Problema:** App funciona localmente mas quebra em produção

**Solução:**
1. Abra DevTools no ambiente de produção
2. Veja o erro exato e linha
3. Adicione verificações null-safe:

```typescript
// ❌ Antes
const total = data.summary.total_phones

// ✅ Depois
const total = data?.summary?.total_phones ?? 0
```

### ❌ Edge Function retorna 500

**Problema:** Supabase Edge Function falha

**Solução:**
```bash
# Ver logs em tempo real
supabase functions logs get-skip-trace-data --follow

# Testar localmente
supabase functions serve

# Re-deploy
supabase functions deploy get-skip-trace-data
```

### ❌ CORS Error ao chamar Edge Function

**Problema:** Browser bloqueia request para Edge Function

**Solução:**
Verificar headers CORS na Edge Function:

```typescript
// No arquivo supabase/functions/get-skip-trace-data/index.ts
return new Response(JSON.stringify(result), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // ou domínio específico
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  },
})
```

---

## 📊 Métricas de Qualidade

Antes de fazer deploy, garanta:

| Métrica | Meta | Como Verificar |
|---------|------|----------------|
| Console Errors | 0 | DevTools → Console |
| TypeScript Errors | 0 | `npx tsc --noEmit` |
| Build Warnings | < 5 | `npm run build` |
| Check Script Errors | 0 | `npm run check:errors` |
| Check Script Warnings | < 10 | `npm run check:errors` |
| Network Errors (4xx/5xx) | 0 | DevTools → Network |
| Lighthouse Performance | > 80 | DevTools → Lighthouse |
| Lighthouse Accessibility | > 90 | DevTools → Lighthouse |

---

## 🎯 Próximos Passos

Após completar este guia:

1. ✅ **Monitoramento**: Configure Sentry ou LogRocket para monitorar erros em produção
2. ✅ **CI/CD**: Automatize `npm run check:errors` no pipeline de CI/CD
3. ✅ **Testes**: Adicione testes unitários (Jest) e E2E (Cypress/Playwright)
4. ✅ **Performance**: Otimize bundle size, lazy loading, code splitting

---

## 📝 Template de Checklist de Deploy

Copie e cole antes de cada deploy:

```markdown
## Deploy Checklist - [Data: YYYY-MM-DD]

### Pré-Deploy
- [ ] `npm run check:errors` - 0 erros
- [ ] `npm run build` - sucesso
- [ ] `npm run preview` - testado localmente
- [ ] Console: 0 erros
- [ ] Network: 0 erros 4xx/5xx
- [ ] Responsividade OK (mobile/tablet/desktop)
- [ ] Formulários validam
- [ ] Auth funciona
- [ ] Edge Functions retornam dados

### Deploy
- [ ] Edge Functions deployadas
- [ ] Frontend deployado
- [ ] DNS/domínio configurado (se aplicável)

### Pós-Deploy
- [ ] Produção carrega sem erros
- [ ] Console produção: 0 erros
- [ ] Funcionalidades críticas testadas
- [ ] Edge Functions logs OK
- [ ] Notificar time/cliente

**Deployed by:** [Seu nome]
**Version:** [git tag/commit hash]
**Notes:** [Notas adicionais]
```

---

**Criado em**: 2026-01-10
**Versão**: 1.0
**Projeto**: Orlando - Step 5 - Outreach & Campaigns
**Autor**: Claude Code Assistant
