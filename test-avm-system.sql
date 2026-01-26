-- ═══════════════════════════════════════════════════════════════════════════════
-- COMANDOS DE TESTE - SISTEMA AVM
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Verificar se as colunas foram criadas
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'properties'
  AND column_name IN (
    'valuation_method',
    'valuation_confidence',
    'last_valuation_date',
    'avm_min_value',
    'avm_max_value'
  )
ORDER BY column_name;

-- Resultado esperado: 5 linhas


-- 2. Verificar índices criados
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'properties'
  AND indexname IN (
    'idx_properties_estimated_value',
    'idx_properties_valuation_method'
  );

-- Resultado esperado: 2 linhas


-- 3. Ver propriedades com valores AVM calculados
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  id,
  address,
  city,
  state,
  estimated_value,
  avm_min_value,
  avm_max_value,
  valuation_method,
  ROUND(valuation_confidence::numeric, 0) as confidence_pct,
  last_valuation_date,
  updated_at
FROM public.properties
WHERE valuation_method = 'avm'
ORDER BY last_valuation_date DESC NULLS LAST
LIMIT 10;

-- Resultado esperado: Propriedades com AVM calculado (se já testou no app)


-- 4. Ver todas as propriedades (resumo)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  COUNT(*) as total_properties,
  COUNT(estimated_value) as with_estimated_value,
  COUNT(valuation_method) as with_valuation_method,
  COUNT(CASE WHEN valuation_method = 'avm' THEN 1 END) as with_avm,
  COUNT(CASE WHEN valuation_method IS NULL THEN 1 END) as without_valuation,
  ROUND(AVG(estimated_value), 0) as avg_estimated_value,
  ROUND(AVG(valuation_confidence::numeric), 0) as avg_confidence
FROM public.properties;

-- Resultado esperado: 1 linha com estatísticas


-- 5. Propriedades com valor padrão de $100K (precisam recálculo)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  id,
  address,
  city,
  estimated_value,
  valuation_method,
  created_at
FROM public.properties
WHERE estimated_value = 100000
  AND valuation_method IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Resultado esperado: Propriedades antigas com $100K


-- 6. Ver função e trigger criados
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_property_valuation';

-- Resultado esperado: 1 linha (função)

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_property_valuation';

-- Resultado esperado: 1 linha (trigger)


-- 7. Atualizar manualmente uma propriedade para testar
-- ═══════════════════════════════════════════════════════════════════════════════
-- ATENÇÃO: Substitua 'SEU_PROPERTY_ID' pelo ID real de uma propriedade

-- UPDATE public.properties
-- SET
--   estimated_value = 350000,
--   avm_min_value = 332500,
--   avm_max_value = 367500,
--   valuation_method = 'avm',
--   valuation_confidence = 84,
--   last_valuation_date = NOW()
-- WHERE id = 'SEU_PROPERTY_ID';

-- Resultado esperado: 1 row updated


-- 8. Ver distribuição de valores estimados
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  CASE
    WHEN estimated_value < 100000 THEN '< $100K'
    WHEN estimated_value < 200000 THEN '$100K - $200K'
    WHEN estimated_value < 300000 THEN '$200K - $300K'
    WHEN estimated_value < 400000 THEN '$300K - $400K'
    WHEN estimated_value < 500000 THEN '$400K - $500K'
    ELSE '> $500K'
  END as price_range,
  COUNT(*) as count,
  ROUND(AVG(valuation_confidence::numeric), 0) as avg_confidence
FROM public.properties
WHERE estimated_value IS NOT NULL
GROUP BY price_range
ORDER BY MIN(estimated_value);

-- Resultado esperado: Distribuição de preços


-- 9. Propriedades com baixa confiança (< 60%)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  id,
  address,
  city,
  estimated_value,
  avm_min_value,
  avm_max_value,
  ROUND(valuation_confidence::numeric, 0) as confidence,
  valuation_method
FROM public.properties
WHERE valuation_confidence < 60
  AND valuation_method IS NOT NULL
ORDER BY valuation_confidence ASC
LIMIT 10;

-- Resultado esperado: Propriedades com baixa confiança


-- 10. Propriedades recentemente avaliadas (últimas 24h)
-- ═══════════════════════════════════════════════════════════════════════════════
SELECT
  id,
  address,
  city,
  estimated_value,
  valuation_method,
  ROUND(valuation_confidence::numeric, 0) as confidence,
  last_valuation_date,
  ROUND(EXTRACT(EPOCH FROM (NOW() - last_valuation_date)) / 3600, 1) as hours_ago
FROM public.properties
WHERE last_valuation_date > NOW() - INTERVAL '24 hours'
ORDER BY last_valuation_date DESC;

-- Resultado esperado: Avaliações recentes


-- ═══════════════════════════════════════════════════════════════════════════════
-- COMANDOS DE MANUTENÇÃO
-- ═══════════════════════════════════════════════════════════════════════════════

-- Limpar valores $100K antigos (forçar recálculo)
-- DESCOMENTE PARA EXECUTAR:
/*
UPDATE public.properties
SET
  estimated_value = NULL,
  valuation_method = NULL,
  valuation_confidence = NULL
WHERE estimated_value = 100000
  AND valuation_method IS NULL
  AND created_at < NOW() - INTERVAL '1 day';
*/


-- Recalcular todas as propriedades com comps
-- DESCOMENTE PARA EXECUTAR:
/*
UPDATE public.properties p
SET
  estimated_value = subquery.avg_price,
  avm_min_value = ROUND(subquery.avg_price * 0.95),
  avm_max_value = ROUND(subquery.avg_price * 1.10),
  valuation_method = 'avm',
  valuation_confidence = LEAST(100, 60 + (subquery.comp_count * 8)),
  last_valuation_date = NOW()
FROM (
  SELECT
    property_id,
    ROUND(AVG(sale_price) * 1.02) as avg_price,
    COUNT(*) as comp_count
  FROM public.comparables
  WHERE sale_price > 0
  GROUP BY property_id
  HAVING COUNT(*) >= 3
) subquery
WHERE p.id = subquery.property_id;
*/


-- ═══════════════════════════════════════════════════════════════════════════════
-- FIM DOS COMANDOS DE TESTE
-- ═══════════════════════════════════════════════════════════════════════════════
