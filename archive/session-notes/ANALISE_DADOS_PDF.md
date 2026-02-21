# Análise dos Dados do PDF

## ❌ CONCLUSÃO: Os dados são DEMO (não reais da API)

### Evidências:

1. **Nomes de Ruas Genéricos:**
   Todos os endereços dos comparables no PDF usam nomes de ruas que aparecem na função `generateDemoComps`:
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

2. **Padrão de Números:**
   - Números de rua altos (3000-9000)
   - Padrão aleatório típico de dados gerados

3. **Distâncias:**
   - Muitos comps mostram "0.0mi" de distância
   - Indica dados gerados próximos ao endereço base

4. **Valores:**
   - Preços variam ±15% do `basePrice` ($100K)
   - $/sqft entre $36-$79 (range normal, mas valores parecem calculados)

### Como Verificar na API:

Execute este comando para testar diretamente:

```bash
curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/fetch-comps" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs" \
  -d '{"address":"25217 Mathew ST","city":"Orlando","state":"FL","basePrice":100000,"radius":3}'
```

**Verifique na resposta:**
- Se `"source": "demo"` → Dados são gerados
- Se `"source": "attom-v2"` ou `"attom-v1"` → Dados reais
- Se `"apiKeysConfigured": { "attom": false }` → API key não configurada

### Solução:

1. **Configurar API Keys no Supabase:**
   - Dashboard → Settings → Edge Functions → Secrets
   - Adicionar `ATTOM_API_KEY` (tem 1000 requests/mês grátis)
   - Adicionar `RAPIDAPI_KEY` (opcional, para Zillow)

2. **Limpar Cache:**
   - Os dados podem estar em cache no banco de dados
   - Deletar e re-adicionar as propriedades para forçar nova busca

3. **Verificar Logs:**
   - Supabase Dashboard → Edge Functions → Logs
   - Ver se há erros nas chamadas da API Attom

### Próximos Passos:

1. Testar a API diretamente (comando curl acima)
2. Verificar se `ATTOM_API_KEY` está configurada no Supabase
3. Se não estiver, configurar a chave
4. Limpar cache e regenerar os comparables
