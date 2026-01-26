# ATTOM/AVM - Documentação Consolidada

> **Este documento foi gerado automaticamente consolidando os arquivos:**
> ATTOM_V2_README.md, ATTOM_V2_INTEGRATION_GUIDE.md, ATTOM_V2_INTEGRATED.md, ATTOM_V2_COMPONENT_USAGE_EXAMPLE.md, ATTOM_FREE_TRIAL_TESTED.md, IMPLEMENTACAO_AVM_COMPLETA.md, PROMPT_CORRECOES_AVM_ATTOM.md, REVISAO_TECNICA_AVM_ATTOM.md

---

## Sumário
- [Overview](#overview)
- [Setup e Configuração](#setup-e-configuração)
- [Integração V2](#integração-v2)
- [Sistema AVM](#sistema-avm)
- [Troubleshooting](#troubleshooting)
- [Exemplos de Uso](#exemplos-de-uso)
- [Revisão Técnica e Melhorias](#revisão-técnica-e-melhorias)

---

## Overview

### ATTOM V2 Integration - Arquivos Criados

- src/utils/cityCountyMap.ts: Mapeamento de cidades para counties, essencial para ATTOM V2 API.
- supabase/functions/fetch-comps/attom-v2-functions.ts: Funções ATTOM V2 implementadas.
- src/services/attomV2Service.ts: Service class completo para ATTOM V2.
- supabase/migrations/20260125_attom_v2_support.sql: Migration para adicionar colunas necessárias.
- ATTOM_V2_INTEGRATION_GUIDE.md: Guia passo-a-passo de integração.

#### Próximos Passos
- Executar migration
- Atualizar edge function
- Deploy
- Testar

### ATTOM V2 Integrado na Edge Function

- Integração completa ATTOM V2
- Parser V2 para formato RESPONSE_GROUP implementado
- Fallback para formato legacy mantido
- City-to-County mapping inline adicionado
- Cascata de prioridades: ATTOM V2 → ATTOM V1 → Zillow → Orange County CSV → Demo Data

#### Diferença: V1 vs V2
| Aspecto | V1 (Antigo) | V2 (Novo) |
|---------|-------------|-----------|
| Endpoint | /property/address?postalcode= | /property/v2/salescomparables/address/ |
| Retorno | Propriedades próximas (filtra depois) | Comparáveis diretos |
| Precisão | Média (precisa filtrar vendas) | Alta (já filtra no backend) |
| County | Não precisa | Obrigatório |
| Free Trial | Funciona parcialmente | Testado e funcionando |
| Formato | data.property[] | RESPONSE_GROUP.RESPONSE... |

#### Endpoint V2 Utilizado
https://api.gateway.attomdata.com/property/v2/salescomparables/address/{street}/{city}/{county}/{state}/{zip}

#### Exemplo Real (Testado)
GET https://api.gateway.attomdata.com/property/v2/salescomparables/address/25217%20Mathew%20St/Orlando/Orange/FL/32833
Header: APIKey: ab8b3f3032756d9c17529dc80e07049b

#### City-to-County Mapping (Florida)
Orlando, Winter Park, Ocoee, Apopka → Orange
Kissimmee → Osceola
Tampa → Hillsborough
Jacksonville → Duval
Miami → Miami-Dade
Fort Lauderdale → Broward

**Fallback:** Se cidade contém "orlando" → assume Orange

#### Como Testar
- Deploy da edge function
- Testar com cidade mapeada (Orlando)
- Verificar source no console: "attom-v2"

#### Troubleshooting
- Problema: "County name required for ATTOM V2 API" → Adicionar cidade no map ou usar cidade próxima mapeada
- Problema: "ATTOM V2 returned 0 comps" → Verificar logs e testar com endereço conhecido
- Problema: Ainda usa "source": "demo" → Verificar ATTOM_API_KEY, deploy, mapping

## Setup e Configuração

### Guia de Integração ATTOM V2

- Adicionar mapeamento de counties no topo do arquivo
- Adicionar função ATTOM V2 corrigida
- Atualizar função serve() para usar ATTOM V2
- Testar localmente
- Deploy no Supabase

#### Exemplo de configuração:
```typescript
const CITY_TO_COUNTY_MAP = { ... };
function getCountyByCity(city: string) { ... }
```

#### Deploy
```bash
npx supabase functions deploy fetch-comps --project-ref atwdkhlyrffbaugkaker
```

#### Teste Manual
```bash
curl -X POST http://localhost:54321/functions/v1/fetch-comps \
  -H "Content-Type: application/json" \
  -d '{ "address": "25217 Mathew St", "city": "Orlando", "state": "FL", "zipCode": "32709", "basePrice": 100000 }'
```

#### Documentação Referência
- ATTOM V2 Docs: https://api.developer.attomdata.com/docs
- Sales Comparables Endpoint: GET /salescomparables/address/...
- API Gateway Base: https://api.gateway.attomdata.com/property/v2

#### Troubleshooting
- Erro: "No comparables returned" → Verificar ATTOM_API_KEY, county_name, logs
- Erro: "County not found" → Adicionar city → county ao CITY_TO_COUNTY_MAP
- Continuando com DEMO DATA → Confirmar ATTOM_API_KEY, deploy, logs

## Integração V2

### ATTOM FREE TRIAL - Endpoints Testados e Funcionando

- Endpoints de comparables diretos não estão inclusos no Free Trial
- Endpoints funcionando: Property Detail, Property Address Search, AVM, Sale Detail, Expanded Profile, All Events
- Nova estratégia implementada: buscar por ZIP, filtrar vendas recentes, extrair comparables, calcular distância, retornar comps

#### Exemplo de código:
```typescript
async function fetchFromAttom(address, city, state, radius = 1, zipCode) {
  // 1. Extract ZIP from address
  // 2. Search: property/address?postalcode={ZIP}&radius={radius}
  // 3. Filter: only properties with recent sales (< 1 year)
  // 4. Return: up to 20 comparables
}
```

#### Como testar com dados reais
- Configurar API Key no Supabase
- Deploy da edge function
- Testar no app
- Verificar logs

#### Troubleshooting
- Problema: Ainda retorna demo data → Verificar secret, redeploy, logs
- Problema: "No properties found near ZIP" → Aumentar radius ou testar com ZIP conhecido
- Problema: "No ZIP code found" → Passar zipCode explicitamente

## Sistema AVM

### Implementação Completa - Sistema AVM

- Serviço de cálculo AVM com 3 métodos de reconciliação
- Migration para campos de valuation
- Scripts de deploy para Windows e Linux/Mac
- Guia completo de migration e setup
- Queries de teste e verificação

#### Funcionalidades implementadas
- Cálculo de AVM: ponderado por distância/recência, mediana, média simples, ajustes por sqft, beds, baths
- Validação de comps: quantidade mínima, detecção de dados demo, distância média, quality score
- Validação de propriedades: campos obrigatórios, valores padrão, alertas de baixa confidence

#### Mudanças no banco de dados
- Novas colunas: valuation_method, valuation_confidence, last_valuation_date, avm_min_value, avm_max_value
- Índices criados para performance
- Trigger automático para recalcular valores

#### Próximos passos
- Executar migration
- Deploy da edge function
- Configurar API Keys
- Testar no app

#### Métricas de sucesso
- Console mostra "AVM Calculation Successful"
- Banco mostra valuation_method = 'avm'
- Confidence > 60%
- Min/Max values preenchidos

## Troubleshooting

### Correções já implementadas
- Ajuste de Sqft dinâmico
- County Mapping com fallback
- Combinação de comps V2 + V1
- County Mapping separado
- Trigger SQL removido
- Busca características do banco antes do cálculo

### Correções críticas pendentes
- Confidence score considerar qualidade dos dados
- Logging detalhado na validação V2
- Ajustes de beds/baths dinâmicos
- Métricas de qualidade no breakdown

#### Testes após implementação
- Testar confidence score com comps próximos/distantes
- Testar logging de estrutura V2
- Testar ajustes dinâmicos

#### Instruções de implementação
- Melhorar confidence score
- Adicionar logging detalhado
- Tornar ajustes dinâmicos
- Adicionar métricas de qualidade

## Exemplos de Uso

### Exemplo de Uso: Integrar AttomV2Service no CompsAnalysis Component

- Importar AttomV2Service e getCounryByCity
- Criar referência do serviço
- Adicionar função para obter comparables com ATTOM V2
- Substituir chamadas antigas por fetchComparablesWithAttomV2()
- Mostrar badge indicando fonte de dados
- Adicionar campo de county no form de propriedade
- Preencher automaticamente county ao mudar city

#### Exemplo de código
```typescript
const attomV2Service = new AttomV2Service(process.env.NEXT_PUBLIC_ATTOM_API_KEY || '');
const fetchComparablesWithAttomV2 = useCallback(async (property) => { ... });
```

#### Resultado final esperado
- Badge "Real Data - ATTOM" e confidence
- Valores calculados e salvos no banco
- UI atualizada com dados reais

## Revisão Técnica e Melhorias

### Revisão Técnica Completa - Sistema AVM + ATTOM V2

#### Pontos fortes
- Arquitetura da cascata V2 → V1 → Zillow → Demo
- Sistema AVM com múltiplos métodos de reconciliação
- Integração ATTOM V2 robusta
- Validação de dados e cache multi-camadas

#### Pontos de atenção críticos
- Inconsistência entre trigger SQL e AVM frontend
- County mapping sem fallback
- Confidence score muito otimista

#### Melhorias sugeridas
- Ajustes dinâmicos por características
- Confidence score mais inteligente
- Combinação de fontes
- Validação de estrutura V2
- Buscar características do banco

#### Checklist de implementação
- Remover/corrigir trigger SQL
- Adicionar fallback suggestCounty()
- Ajustar confidence score
- Implementar ajustes dinâmicos
- Combinar comps de múltiplas fontes
- Melhorar busca de características
- Adicionar validação de estrutura V2

---

*Para detalhes completos, consulte os arquivos originais no histórico do projeto.*
