# Verificação de Dados da API

## Análise dos Dados do PDF

Baseado no PDF fornecido, os endereços dos comparables são:

**Property 1 (25217 Mathew ST):**
- 3820 Colonial Dr
- 4609 Pine Ave
- 7506 Palm Way
- 4811 Main St
- 3684 Cedar Ln
- 5891 Cedar Ln

**Property 2 (5528 Long Lake DR):**
- 9052 Colonial Dr
- 705 Main St
- 6693 Pine Ave
- 4822 Sunset Blvd
- 2723 Main St
- 4007 Oak St

## ⚠️ INDICADORES DE DADOS DEMO

Todos esses nomes de ruas aparecem na função `generateDemoComps`:
- Colonial Dr ✅
- Pine Ave ✅
- Palm Way ✅
- Main St ✅
- Cedar Ln ✅
- Sunset Blvd ✅
- Oak St ✅
- Maple Dr ✅
- Park Ave ✅
- Lake View Dr ✅

## Como Verificar

1. **Testar API diretamente:**
   ```bash
   curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/fetch-comps" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs" \
     -d '{"address":"25217 Mathew ST","city":"Orlando","state":"FL","basePrice":100000,"radius":3}'
   ```

2. **Verificar resposta:**
   - Se `source: "demo"` → Dados são gerados
   - Se `source: "attom-v2"` ou `"attom-v1"` → Dados reais da API Attom
   - Se `source: "zillow-api"` → Dados reais do Zillow
   - Se `source: "county-csv"` → Dados reais do Orange County CSV

3. **Verificar API Keys no Supabase:**
   - Dashboard → Settings → Edge Functions → Secrets
   - Verificar se `ATTOM_API_KEY` está configurada
   - Verificar se `RAPIDAPI_KEY` está configurada

## Próximos Passos

1. Testar a API diretamente
2. Verificar logs da edge function no Supabase
3. Se for demo, configurar as API keys
