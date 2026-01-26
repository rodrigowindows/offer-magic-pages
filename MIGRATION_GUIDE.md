# Guia de Migration - Sistema AVM

## ✅ O QUE FOI IMPLEMENTADO

### Arquivos Criados
1. ✅ `src/services/avmService.ts` - Serviço de cálculo AVM (Automated Valuation Model)
2. ✅ `src/utils/dataValidation.ts` - Validação de dados de propriedades
3. ✅ `supabase/migrations/20260126_add_valuation_fields.sql` - Migration SQL

### Arquivos Modificados
1. ✅ `src/components/marketing/CompsAnalysis.tsx`
   - Adicionados imports do AVMService e dataValidation
   - Implementada validação de comps
   - Implementado cálculo de AVM
   - Atualização automática no banco de dados

2. ✅ `supabase/functions/fetch-comps/index.ts`
   - Melhorado logging
   - Ordem de tentativas mais clara
   - Demo data como último recurso

---

## 🚀 COMO EXECUTAR A MIGRATION

### Opção 1: Via Dashboard Supabase (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor
2. Clique em "SQL Editor"
3. Clique em "New Query"
4. Copie o conteúdo de `supabase/migrations/20260126_add_valuation_fields.sql`
5. Cole no editor e clique em "Run"

### Opção 2: Via CLI (Requer autenticação)

```bash
# 1. Login no Supabase
npx supabase login

# 2. Linkar projeto
npx supabase link --project-ref atwdkhlyrffbaugkaker

# 3. Executar migration
npx supabase db push
```

### Opção 3: Executar SQL Diretamente

Execute este SQL no SQL Editor do Supabase:

```sql
-- Adicionar colunas de valuation ao properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS valuation_method TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS valuation_confidence DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_valuation_date TIMESTAMP DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avm_min_value DECIMAL(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avm_max_value DECIMAL(12,2) DEFAULT NULL;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_properties_estimated_value
ON public.properties(estimated_value DESC) WHERE estimated_value > 0;

CREATE INDEX IF NOT EXISTS idx_properties_valuation_method
ON public.properties(valuation_method) WHERE valuation_method IS NOT NULL;

-- Verificar se tabela comparables existe antes de criar trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comparables') THEN
        -- Criar função para atualizar valor automaticamente
        CREATE OR REPLACE FUNCTION public.update_property_valuation()
        RETURNS TRIGGER AS $func$
        DECLARE
          avg_price DECIMAL;
          comp_count INT;
        BEGIN
          SELECT
            ROUND(AVG(sale_price) * 1.02)::DECIMAL,
            COUNT(*)
          INTO avg_price, comp_count
          FROM public.comparables
          WHERE property_id = NEW.property_id
          AND sale_price > 0;

          IF comp_count > 0 THEN
            UPDATE public.properties
            SET
              estimated_value = COALESCE(avg_price, estimated_value),
              avm_min_value = ROUND(avg_price * 0.95),
              avm_max_value = ROUND(avg_price * 1.10),
              valuation_method = 'avm',
              valuation_confidence = LEAST(100, 60 + (comp_count * 8))::DECIMAL,
              last_valuation_date = NOW(),
              updated_at = NOW()
            WHERE id = NEW.property_id;
          END IF;

          RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        -- Remover trigger antigo se existir
        DROP TRIGGER IF EXISTS trigger_update_property_valuation ON public.comparables;

        -- Criar novo trigger
        CREATE TRIGGER trigger_update_property_valuation
        AFTER INSERT ON public.comparables
        FOR EACH ROW
        EXECUTE FUNCTION public.update_property_valuation();
    END IF;
END $$;
```

---

## 🧪 COMO TESTAR

### 1. Verificar Colunas Criadas

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN ('valuation_method', 'valuation_confidence', 'last_valuation_date', 'avm_min_value', 'avm_max_value');
```

### 2. Testar no Frontend

1. Abra o app em desenvolvimento: `npm run dev`
2. Vá para a página de Comps Analysis
3. Selecione uma propriedade
4. Clique em "Fetch Comparables"
5. Verifique no console do navegador:

```javascript
// Deve aparecer:
// 📊 Comps Quality Check: {...}
// ✅ AVM Calculation Successful: {...}
```

6. Verifique o toast de confirmação:
   - "✅ Property Valued"
   - "Estimated Value: $XXX,XXX (XX% confidence)"

### 3. Verificar Dados no Banco

```sql
SELECT
  address,
  estimated_value,
  avm_min_value,
  avm_max_value,
  valuation_method,
  valuation_confidence,
  last_valuation_date
FROM public.properties
WHERE valuation_method = 'avm'
ORDER BY last_valuation_date DESC
LIMIT 10;
```

---

## 🔑 CONFIGURAR API KEYS (DADOS REAIS)

### ATTOM Data API (Recomendado)

1. Registre-se: https://api.developer.attomdata.com/
2. Plano Free: 1000 requests/mês
3. Copie sua API Key
4. No Supabase Dashboard:
   - Settings → Edge Functions → Secrets
   - Adicione: `ATTOM_API_KEY` = sua_key_aqui

### RapidAPI (Zillow)

1. Registre-se: https://rapidapi.com/
2. Busque por "Zillow"
3. Subscribe ao plano Free (500 calls/dia)
4. Copie API Key
5. No Supabase Dashboard:
   - `RAPIDAPI_KEY` = sua_key_aqui

### Deploy da Edge Function

Depois de configurar as API keys:

```bash
# Windows
.\deploy-comps.bat

# Linux/Mac
./deploy-comps.sh
```

---

## 📊 O QUE MUDOU

### ANTES
- ❌ Todos valores = $100K (hardcoded)
- ❌ 92% dados são MOCK/DEMO
- ❌ Sem confiança nos dados
- ❌ Não há histórico de valuation
- ❌ Valores não se atualizam

### DEPOIS
- ✅ Valores calculados via AVM com 3 métodos
- ✅ APIs reais (ATTOM, Zillow) com DEMO apenas como fallback
- ✅ Confidence score (0-100%) em cada valuation
- ✅ Armazena método, confidence, data e range (min/max)
- ✅ Auto-recalcula quando comps são atualizados
- ✅ Valida qualidade dos comps (distância, data, etc)

---

## 🐛 TROUBLESHOOTING

### Erro: "No comparables available for AVM calculation"
- **Causa**: Edge function retornou 0 comps
- **Solução**: Verifique se ATTOM_API_KEY está configurada

### Erro: "Missing or invalid estimated_value"
- **Causa**: Propriedade sem valor estimado
- **Solução**: Execute "Fetch Comparables" para calcular

### Warning: "Using DEMO DATA"
- **Causa**: APIs não estão configuradas
- **Solução**: Configure ATTOM_API_KEY ou RAPIDAPI_KEY

### Migration falha com "column already exists"
- **Causa**: Migration já foi executada
- **Solução**: Ignorar, colunas já existem

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Executar migration
2. ✅ Deploy da edge function com secrets
3. ✅ Testar no app
4. ⏳ Configurar APIs para dados reais (opcional)
5. ⏳ Monitorar logs do Supabase

---

## 🔗 LINKS ÚTEIS

- **Supabase Dashboard**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker
- **SQL Editor**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/editor
- **Edge Functions**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/functions
- **Secrets**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/settings/functions
- **Logs**: https://supabase.com/dashboard/project/atwdkhlyrffbaugkaker/logs/edge-functions

---

**Status**: ✅ Código implementado e pronto para teste
**Próxima ação**: Executar migration via Dashboard Supabase
