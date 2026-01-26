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

-- Criar função para atualizar valor automaticamente quando comps são salvos
CREATE OR REPLACE FUNCTION public.update_property_valuation()
RETURNS TRIGGER AS $$
DECLARE
  avg_price DECIMAL;
  comp_count INT;
BEGIN
  -- Calcular média dos comps
  SELECT
    ROUND(AVG(sale_price) * 1.02)::DECIMAL,
    COUNT(*)
  INTO avg_price, comp_count
  FROM public.comparables
  WHERE property_id = NEW.property_id
  AND sale_price > 0;

  -- Atualizar propriedade se temos comps
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
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_update_property_valuation ON public.comparables;

-- Criar novo trigger
CREATE TRIGGER trigger_update_property_valuation
AFTER INSERT ON public.comparables
FOR EACH ROW
EXECUTE FUNCTION public.update_property_valuation();

-- Limpar valores padrão antigos (propriedades com $100K que precisam recalcular)
UPDATE public.properties
SET estimated_value = NULL,
    valuation_method = NULL,
    valuation_confidence = NULL
WHERE estimated_value = 100000
  AND created_at < NOW() - INTERVAL '1 day';
