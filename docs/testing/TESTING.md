# Guia Consolidado de Testes

## Visão Geral

Este guia reúne todas as práticas, estratégias, scripts e checklists para testes do sistema, incluindo A/B Testing, API, integrações e validação de produção.

---

## A/B Testing

### Estratégia e Variantes
- Testar diferentes abordagens para maximizar conversão e qualidade de leads.
- Variantes implementadas: Ultra-Simples, Email-First, Social Proof, Video Personal, Urgency/Scarcity.
- Sistema atribui variantes, rastreia eventos e calcula métricas de funil e vencedor.

### Como Integrar
1. Rodar migração no Supabase.
2. Envolver página com `<ABTestWrapper>`.
3. Adicionar `<ABTestAnalytics>` para dashboard.

### Métricas e Análise
- Funil: page_view, email_submitted, offer_revealed, form_submitted, phone_collected.
- Vencedor determinado por taxa de conversão.
- Dashboard mostra comparativo e recomendações.

---

## Testes de API

### Como Testar
- Usar UI interna (Test Mode) ou ferramentas como Postman, cURL, Thunder Client.
- Endpoints principais: `/health`, `/send`.
- Test Mode simula envios, Production Mode executa comunicações reais.

### Exemplo de Request
```json
{
  "name": "John Doe",
  "phone_number": "(407) 555-1234",
  "email": "john@example.com",
  ...
  "test_mode": true
}
```

---

## Scripts e Validação de Produção

### Scripts de Teste
- `test-comps-api.js`: Valida resposta da API de comparables.
- `test-retell-webhook.js`: Testa formato do webhook Retell AI.

### Validação de Produção
- Testar endpoints após deploy.
- Verificar se dados retornados são reais (não DEMO).
- Usar logs do Supabase para depuração.

---

## Checklist de Testes

### Correções Recentes
- Webhook Retell AI: formato corrigido.
- Geocodificação de comparables: usa endereço completo.
- Cache de comparables: evita chamadas repetidas.
- PDF: mapa com marcadores corretos.

### Testes a Realizar
- Teste Retell Webhook: status, formato, variáveis.
- Teste Mapa de Comparables: marcadores, agrupamento, console.
- Teste Export PDF: mapa, marcadores, imagem.
- Teste Export All Filtered: processamento em lote, sem erros.

---

## Relatórios e Resultados

### Resumo Final dos Testes
- Sistema funcionando, mas usando dados DEMO se ATTOM_API_KEY não estiver configurada.
- Edge Function responde corretamente, mas pode retornar dados simulados.
- Scripts de teste validam resposta, alertam sobre dados demo.

### Solução para Dados DEMO
1. Configurar ATTOM_API_KEY no Supabase:
   ```bash
   npx supabase secrets set ATTOM_API_KEY=SEU_TOKEN --project-ref SEU_PROJECT_REF
   ```
2. Fazer deploy da edge function:
   ```bash
   npx supabase functions deploy fetch-comps --project-ref SEU_PROJECT_REF
   ```
3. Testar novamente com `node test-comps-api.js`.

### Observações
- Se persistir `isDemo: false` mas `source: "demo"`, redeployar função e limpar cache.
- Logs: `npx supabase functions logs fetch-comps --tail`.

---

## Referências e Arquivos Originais

Conteúdo consolidado de:
- AB_TESTING_SUMMARY.md
- AB_TESTING_STRATEGY.md
- AB_TESTING_INTEGRATION_GUIDE.md
- AB_TESTING_IMPLEMENTATION_PROMPT.md
- API_TESTING_GUIDE.md
- TESTING_CHECKLIST.md
- RESUMO_TESTES_FINAL.md
- RELATORIO_TESTE_COMPLETO.md
- RELATORIO_TESTES_COMPLETA.md

Para detalhes históricos, consulte os arquivos originais.
