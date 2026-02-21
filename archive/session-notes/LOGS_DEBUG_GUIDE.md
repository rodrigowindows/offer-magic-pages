# LOGS_DEBUG_GUIDE.md

## Onde encontrar os logs
- **Frontend (browser):** Abra o console do navegador (F12 > Console)
- **Edge Function (backend):** Supabase Dashboard > Edge Functions > Logs
- **Script de limpeza:** Terminal onde rodar o script

## Como interpretar os logs

## Tipos de log
## Como usar o script de limpeza

### 1. Configure as chaves Supabase
No início do arquivo `scripts/clean-mock-data.ts`, preencha:
```
const SUPABASE_URL = 'https://SEU_SUPABASE_URL.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'SEU_SERVICE_ROLE_KEY_AQUI';
```
Esses valores podem ser obtidos no painel do Supabase (Project Settings > API > Service Role Key).

**Atenção:** Nunca suba a chave service_role para repositórios públicos ou produção!

### 2. Execute o script
- Para simular (dry-run): `npx tsx scripts/clean-mock-data.ts`
- Para deletar de verdade: `npx tsx scripts/clean-mock-data.ts --execute`

O script mostra quantos registros mock/demo existem e só deleta se rodar com `--execute`.
- **[AVM]**: Logs de cálculo de AVM
- **[DB]**: Logs de operações no banco de dados
## Exemplos de logs

### Edge Function
```
[2026-01-26T12:00:00.000Z] [REQUEST-abc123] 🔍 Fetching comps: { address: 'Rua X', city: 'Orlando', ... }
[2026-01-26T12:00:01.000Z] [REQUEST-abc123] ✅ ATTOM V2 response: { status: 'success', timeMs: 350, comps: 6 }
[2026-01-26T12:00:01.100Z] [REQUEST-abc123] ⚠️ ATTOM V2 returned 2 comps, combining with V1 fallback...
[2026-01-26T12:00:01.300Z] [REQUEST-abc123] ❌ ATTOM V1 failed or returned insufficient comps (0)
[2026-01-26T12:00:01.400Z] [REQUEST-abc123] 📦 Response: { success: true, source: 'attom-v2', count: 6, ... }
```

### Frontend
```
[2026-01-26T12:00:00.000Z] [COMPS] 🔎 [CompsAnalysis] Iniciando geração de comparáveis { property: { ... } }
[2026-01-26T12:00:00.500Z] [COMPS] 💾 [CompsAnalysis] Usando comparáveis do cache { property: 'Rua X' }
[2026-01-26T12:00:01.000Z] [COMPS] 🌐 [CompsAnalysis] Buscando novos comparáveis { property: 'Rua X' }
[2026-01-26T12:00:01.200Z] [COMPS] 📊 [CompsAnalysis] Validação dos comps { validation: { quality: 'good', ... } }
[2026-01-26T12:00:01.300Z] [COMPS] ✅ [CompsAnalysis] AVM calculado { avm: { estimatedValue: 350000, confidence: 85 } }
[2026-01-26T12:00:01.400Z] [COMPS] ✅ [CompsAnalysis] Auto-salvo no banco de dados { property: 'Rua X' }
```

### Script de limpeza
```
==== LIMPEZA DE DADOS MOCK/DEMO ====
Modo: DRY-RUN (não deleta)
🔎 comparables (demo): 12 registros encontrados para exclusão.
🔎 comparables (source null): 0 registros encontrados para exclusão.
🔎 comps_analysis_history (demo): 3 registros encontrados para exclusão.
🔎 comps_analysis_history (source null): 0 registros encontrados para exclusão.
🔎 comparables_cache (todos): 0 registros encontrados para exclusão.
Para deletar de verdade, rode com --execute
```

### Edge Function
```
[2026-01-26T12:00:00.000Z] [REQUEST-1234] 🔍 Fetching comps: { address: ..., city: ..., ... }
[2026-01-26T12:00:01.000Z] [REQUEST-1234] ✅ ATTOM V2 response: status=200, time=350ms, comps=6
[2026-01-26T12:00:01.100Z] [REQUEST-1234] ⚠️ Fallback to ATTOM V1
[2026-01-26T12:00:01.300Z] [REQUEST-1234] ❌ ATTOM V1 failed: status=500
[2026-01-26T12:00:01.400Z] [REQUEST-1234] 📦 Final response: { ... }
```

### Frontend
```
[2026-01-26T12:00:00.000Z] [COMPS] 🏠 Property: { id: ..., address: ..., coordinates: ... }
[2026-01-26T12:00:00.500Z] [COMPS] 🔄 Calling edge function with: { ... }
[2026-01-26T12:00:01.000Z] [COMPS] ✅ Received comps: { source: 'attom-v2', count: 6 }
[2026-01-26T12:00:01.200Z] [AVM] 📊 Calculating AVM: { compsCount: 6, sqft: 1800, ... }
[2026-01-26T12:00:01.300Z] [AVM] ✅ AVM result: { estimatedValue: 350000, confidence: 85 }
[2026-01-26T12:00:01.400Z] [DB] 💾 Saving comps_analysis_history: { property_id: ..., comps_count: 6 }
```

## Como usar o script de limpeza
- Execute: `node scripts/clean-mock-data.ts` (ou `--execute` para deletar de verdade)
- O script mostra quantos registros mock existem e pede confirmação antes de deletar

## Logs normais vs logs de erro
- **Normal:** `[COMPS] ✅ Received comps: ...`
- **Erro:** `[DB] ❌ Error saving comps_analysis_history: ...`

---

Dúvidas? Consulte este arquivo ou peça exemplos de logs para debugging.
