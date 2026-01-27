# Verificação: Os Dados São Reais ou Demo?

## ❌ CONCLUSÃO: Os dados no PDF são DEMO (vindos do cache antigo)

### Evidências:

1. **Nomes de Ruas Genéricos:**
   Todos os endereços no PDF usam nomes que aparecem na função `generateDemoComps`:
   - Colonial Dr, Pine Ave, Palm Way, Main St, Cedar Ln, Sunset Blvd, Oak St, Maple Dr, Park Ave, Lake View Dr

2. **Fonte dos Dados:**
   Os dados estão vindo do **cache do banco de dados** (`comps_analysis_history`), não da API atual.
   - O código primeiro verifica o cache do banco (linha 775-813 em `CompsAnalysis.tsx`)
   - Se encontrar dados salvos, usa esses dados mesmo que sejam demo
   - A função `generateDemoComps` foi removida, mas os dados demo antigos ainda estão no banco

### Como Verificar:

#### 1. Testar a API Diretamente:

```bash
curl -X POST "https://atwdkhlyrffbaugkaker.supabase.co/functions/v1/fetch-comps" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0d2RraGx5cmZmYmF1Z2tha2VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxOTg3ODUsImV4cCI6MjA3ODc3NDc4NX0.F3AWhNZgtPInVXxpwt-WJzxLQKNl-R0QGy68F6wgtXs" \
  -d '{"address":"25217 Mathew ST","city":"Orlando","state":"FL","basePrice":100000,"radius":3}'
```

**Verifique na resposta:**
- `"source": "attom-v2"` ou `"attom-v1"` → Dados reais ✅
- `"source": "demo"` → Dados gerados ❌
- `"apiKeysConfigured": { "attom": false }` → API key não configurada

#### 2. Verificar Cache no Banco:

Execute no Supabase SQL Editor:

```sql
-- Ver quantos registros são demo
SELECT 
  data_source,
  COUNT(*) as count
FROM comps_analysis_history
GROUP BY data_source;

-- Ver propriedades com dados demo
SELECT 
  p.address,
  p.city,
  h.data_source,
  h.created_at
FROM comps_analysis_history h
JOIN properties p ON p.id = h.property_id
WHERE h.data_source = 'demo'
ORDER BY h.created_at DESC;
```

### Solução:

#### Opção 1: Limpar Cache Demo (Recomendado)

Execute no Supabase SQL Editor:

```sql
-- Deletar análises com dados demo
DELETE FROM comps_analysis_history 
WHERE data_source = 'demo';

-- Deletar comparables demo do cache
DELETE FROM comparables_cache 
WHERE source = 'demo';
```

Depois, **regenere os comparables** na interface (deletar e re-adicionar as propriedades, ou usar o botão "Regenerate").

#### Opção 2: Verificar API Keys

1. Supabase Dashboard → Settings → Edge Functions → Secrets
2. Verificar se `ATTOM_API_KEY` está configurada
3. Se não estiver, adicionar a chave (1000 requests/mês grátis)

#### Opção 3: Forçar Nova Busca

No código, você pode forçar uma nova busca ignorando o cache:

```typescript
// Em CompsAnalysis.tsx, linha ~775
// Comentar temporariamente a verificação do cache do banco
// Ou adicionar um parâmetro para ignorar cache
```

### Próximos Passos:

1. ✅ Testar a API diretamente (comando curl acima)
2. ✅ Verificar se `ATTOM_API_KEY` está configurada no Supabase
3. ✅ Limpar cache demo do banco de dados
4. ✅ Regenerar comparables para as propriedades
5. ✅ Verificar se novos dados são reais (source = 'attom-v2' ou 'attom-v1')

### Nota Importante:

A função `generateDemoComps` foi **removida** do código (linha 78 de `fetch-comps/index.ts`), mas os dados demo antigos ainda estão salvos no banco de dados. Por isso, mesmo que a API esteja funcionando e retornando dados reais, o PDF ainda mostra dados demo porque está usando o cache antigo.
