/**
 * compsPricing - Serviço reutilizável para cálculo de média $/sqft
 * com filtragem de outliers e transparência na fórmula.
 */

export interface CompDataInput {
  sale_price?: number;
  square_feet?: number;
}

export interface PricingResult {
  /** Comps válidos usados no cálculo */
  validCount: number;
  /** Total de comps fornecidos */
  totalCount: number;
  /** Média $/sqft */
  avgPricePerSqft: number;
  /** ARV estimado (avgPricePerSqft * subjectSqft) */
  estimatedARV: number;
  /** Detalhes individuais por comp */
  details: { salePrice: number; sqft: number; pricePerSqft: number; isOutlier: boolean }[];
  /** Quantos outliers foram removidos */
  outliersRemoved: number;
}

/**
 * Estratégia de outlier: IQR (Interquartile Range)
 * Remove valores fora de Q1 - 1.5*IQR e Q3 + 1.5*IQR
 * Só aplica se houver >= 4 comps para ter IQR significativo.
 */
function removeOutliers(values: number[]): { kept: number[]; removedCount: number } {
  if (values.length < 4) return { kept: values, removedCount: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  const kept = values.filter(v => v >= lower && v <= upper);
  return { kept, removedCount: values.length - kept.length };
}

/**
 * Calcula média de $/sqft com transparência.
 * @param comps - Array de comp_data
 * @param subjectSqft - Área do imóvel alvo (para calcular ARV)
 * @param applyOutlierFilter - Aplica filtro IQR (default: true)
 */
export function calculateCompsPricing(
  comps: CompDataInput[],
  subjectSqft: number = 0,
  applyOutlierFilter = true,
): PricingResult {
  const totalCount = comps.length;

  // Filtra comps válidos
  const validComps = comps.filter(
    c => c.sale_price && c.sale_price > 0 && c.square_feet && c.square_feet > 0,
  );

  if (validComps.length === 0) {
    return {
      validCount: 0,
      totalCount,
      avgPricePerSqft: 0,
      estimatedARV: 0,
      details: [],
      outliersRemoved: 0,
    };
  }

  const pricesPerSqft = validComps.map(c => c.sale_price! / c.square_feet!);

  let finalPrices = pricesPerSqft;
  let outliersRemoved = 0;

  if (applyOutlierFilter) {
    const result = removeOutliers(pricesPerSqft);
    finalPrices = result.kept;
    outliersRemoved = result.removedCount;
  }

  const avgPricePerSqft =
    finalPrices.length > 0
      ? Math.round(finalPrices.reduce((sum, v) => sum + v, 0) / finalPrices.length)
      : 0;

  const estimatedARV = subjectSqft > 0 ? Math.round(avgPricePerSqft * subjectSqft) : 0;

  // Build details with outlier flag
  const outlierSet = new Set(
    pricesPerSqft.filter(p => !finalPrices.includes(p)),
  );

  const details = validComps.map((c, i) => ({
    salePrice: c.sale_price!,
    sqft: c.square_feet!,
    pricePerSqft: Math.round(pricesPerSqft[i]),
    isOutlier: outlierSet.has(pricesPerSqft[i]),
  }));

  return {
    validCount: finalPrices.length,
    totalCount,
    avgPricePerSqft,
    estimatedARV,
    details,
    outliersRemoved,
  };
}
