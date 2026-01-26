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



-- Limpar valores padrão antigos (propriedades com $100K que precisam recalcular)
UPDATE public.properties
SET estimated_value = NULL,
    valuation_method = NULL,
    valuation_confidence = NULL
WHERE estimated_value = 100000
  AND created_at < NOW() - INTERVAL '1 day';
