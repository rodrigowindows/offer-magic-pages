# Prompt de Testes - Execucao Completa

**Objetivo**: Executar apenas testes e validar resultado. NAO implementar novas funcionalidades.

---

## Parte 1: Verificacao de Alteracoes (Revisao de Codigo)

### 1.1 REVIEW_AND_CHANGES.md - 3 Correcoes Criticas

| Item | Arquivo | O que verificar |
|------|---------|-----------------|
| TestModeToggle com prop `compact` | `src/components/marketing/TestModeToggle.tsx` | Verificar `interface TestModeToggleProps { compact?: boolean }` e render condicional `if (compact)` |
| MarketingApp sem BrowserRouter | `src/components/marketing/MarketingApp.tsx` | Confirmar que NAO ha `<BrowserRouter>` duplicado; usar apenas `<MarketingAppContent />` |
| Rotas com prefixo /marketing | `src/components/marketing/MarketingApp.tsx` | Verificar paths: `/marketing`, `/marketing/send`, `/marketing/history`, `/marketing/settings` e fallback `* -> /marketing` |
| Rota no App principal | `src/App.tsx` | Verificar `<Route path="/marketing/*" element={<MarketingApp />} />` |

**Status**: VERIFICADO - Todas as 3 correcoes estao implementadas corretamente.

### 1.2 TESTING_CHECKLIST.md - 5 Correcoes

| Correcao | Arquivo | O que verificar |
|----------|---------|-----------------|
| Retell webhook formato | `supabase/functions/retell-webhook-handler/index.ts` | Resposta APENAS `{ call_inbound: { dynamic_variables: {...} } }`, sem wrappers extras |
| Geocodificacao comps | `src/components/marketing/CompsMapboxMap.tsx` | Usa endereco completo `"address, city, state zip"` |
| Coordenadas em dados DEMO | `supabase/functions/fetch-comps/index.ts` | Geracao de lat/lng em raio ~0.02° da propriedade |
| Mapa no PDF | `src/utils/pdfExport.ts` | Uso de coordenadas reais para marcadores |
| Cache de comparables | `src/components/marketing/CompsAnalysis.tsx` | Cache em memoria via `compsCache` state |

**Status**: VERIFICADO - Todas as 5 correcoes estao implementadas.

---

## Parte 2: Testes Unitarios (Vitest)

### Requisitos
```bash
# Instalar dependencias de teste (se nao instaladas)
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom

# Executar
npm run test:unit
```

### Resultado Esperado
- Todos os testes em `tests/*.test.tsx` passando
- Zero falhas

### Se houver falhas
Listar:
- Arquivo + nome do teste
- Mensagem de erro exata
- NAO corrigir codigo, apenas reportar

---

## Parte 3: Testes E2E (Playwright)

### Requisitos
```bash
# Instalar Playwright (se nao instalado)
npm install -D @playwright/test
npx playwright install

# App deve estar rodando em http://localhost:5173 ou http://localhost:8080
npm run dev &

# Executar testes E2E
npm run test:e2e
```

### Testes Especificos
- `e2e/click-tracking.spec.ts`: tracking de link de email, botao com atribuicao, pixel de abertura

### Resultado Esperado
- Todas as specs passando
- Se falhar, listar erro exato

---

## Parte 4: Testes Manuais - Marketing System

### 4.1 Navegacao
| Teste | Rota | Resultado Esperado |
|-------|------|---------------------|
| Dashboard | `/marketing` | Mostra Dashboard |
| Send | `/marketing/send` | Mostra Wizard |
| History | `/marketing/history` | Mostra historico |
| Settings | `/marketing/settings` | Mostra configuracoes |
| Rota invalida | `/marketing/xyz` | Redireciona para `/marketing` |

### 4.2 Test Mode
| Teste | Acao | Resultado Esperado |
|-------|------|---------------------|
| Toggle ON | Ligar Test Mode | Alerta laranja "TEST MODE" |
| Toggle OFF | Desligar Test Mode | Aviso vermelho "PRODUCTION" |
| Enviar em test | Enviar comunicado com test mode ON | Toast "Test communication sent (simulated)" |
| Enviar em producao | Enviar comunicado com test mode OFF | Dialog de confirmacao + toast de sucesso |

### 4.3 Wizard Flow
| Step | Teste | Resultado Esperado |
|------|-------|---------------------|
| Step 1 | Preencher recipient/CSV | Pode avancar para Step 2 |
| Step 2 | Selecionar canais | Pelo menos 1 canal obrigatorio |
| Step 3 | Customizar mensagem | Preview atualiza em tempo real |
| Step 4 | Revisar e enviar | Todos os dados exibidos corretamente |

### 4.4 History
| Teste | Resultado Esperado |
|-------|---------------------|
| Visualizar historico | Mostra todas comunicacoes enviadas |
| Filtrar por status | Funciona corretamente |
| Filtrar por canal | Funciona corretamente |
| Filtrar por modo (test/prod) | Funciona corretamente |
| Busca | Filtra resultados |
| Export CSV | Baixa arquivo |

### 4.5 Settings
| Teste | Resultado Esperado |
|-------|---------------------|
| Atualizar company info | Salva no localStorage |
| Atualizar LLM config | Salva no localStorage |
| Atualizar API URLs | Salva no localStorage |
| Recarregar pagina | Configuracoes persistem |

---

## Parte 5: Testes Manuais - Comps e Integracoes

### 5.1 Retell Webhook
```bash
node test-retell-webhook.js
```

**Verificar**:
- Status 200
- Formato correto: `{ "call_inbound": { "dynamic_variables": {...} } }`
- Variaveis presentes: `customer_name`, `property_address`, `cash_offer`, etc.
- SEM wrappers: `success`, `retell_response`, `webhook_data`

**Resultado Esperado**:
```json
{
  "call_inbound": {
    "dynamic_variables": {
      "customer_name": "NOME DO PROPRIETARIO",
      "property_address": "ENDERECO",
      "cash_offer": "VALOR"
    }
  }
}
```

### 5.2 Mapa de Comparables
1. Acessar `/marketing/comps`
2. Selecionar propriedade aprovada com oferta
3. Esperar carregar comparables
4. Abrir aba "Map"

**Verificar**:
- Marcador vermelho (subject property) no centro
- Marcadores azuis (comps) proximos (nao espalhados pelo mundo)
- Todos em Orlando/FL
- Console mostra: "Using cached coordinates" ou "Geocoding: [address], Orlando, FL..."

### 5.3 Export PDF com Mapa
1. Na tela de Comps Analysis
2. Clicar "Export" > "Quick PDF"
3. Abrir PDF gerado

**Verificar**:
- Secao "Property Location & Comparables Map" presente
- Mapa com marcadores agrupados
- Marcador vermelho (subject) visivel
- Marcadores azuis (comps) proximos

### 5.4 Export All Filtered
1. Aplicar filtros: "Approved" + "With Offer"
2. Clicar "Export All Filtered"
3. Aguardar processamento

**Verificar**:
- Console mostra "Using cached data..." ou "Fetching new data..."
- Console mostra progresso "1/N ... N/N"
- PDF gerado sem erros "Cannot read properties of undefined"

### 5.5 Cache de Comparables
1. Selecionar propriedade A
2. Esperar carregar comps
3. Selecionar propriedade B
4. Voltar para propriedade A

**Verificar Console**:
- 1a vez: "Fetching new comparables for property: [A]"
- 2a vez (ao voltar): "Using cached comparables for property: [A]"
- Dados carregam instantaneamente na 2a vez

---

## Parte 6: Formato de Resposta

Responda no formato abaixo:

```
## Resultado dos Testes

### Unit Tests (Vitest)
- Status: PASSOU / FALHOU / NAO EXECUTADO
- Falhas (se houver):
  - [arquivo:linha] nome_do_teste - mensagem de erro

### E2E Tests (Playwright)
- Status: PASSOU / FALHOU / NAO EXECUTADO
- Falhas (se houver):
  - [spec] descricao - mensagem de erro

### Testes Manuais - Marketing
- Navegacao: OK / FALHA (detalhar)
- Test Mode: OK / FALHA (detalhar)
- Wizard Flow: OK / FALHA (detalhar)
- History: OK / FALHA (detalhar)
- Settings: OK / FALHA (detalhar)

### Testes Manuais - Comps
- Retell Webhook: OK / FALHA (detalhar)
- Mapa Comparables: OK / FALHA (detalhar)
- Export PDF: OK / FALHA (detalhar)
- Export All Filtered: OK / FALHA (detalhar)
- Cache: OK / FALHA (detalhar)

### Resumo
- Total de testes: X
- Passaram: X
- Falharam: X
- Nao executados: X
```

---

## Notas Importantes

1. **NAO** implementar novas funcionalidades
2. **NAO** alterar codigo (exceto se absolutamente necessario para corrigir teste)
3. **APENAS** executar testes e reportar resultados
4. Se encontrar erro critico que impede execucao, reportar e parar

---

**Ultima atualizacao**: 2026-02-03
**Baseado em**: REVIEW_AND_CHANGES.md, TESTING_CHECKLIST.md, docs/testing/TESTING.md
