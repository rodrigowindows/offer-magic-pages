export interface ComparableData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  saleDate: string;
  salePrice: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt?: number;
  distance: number;
  propertyType?: string;
  source?: string;
  latitude?: number;
  longitude?: number;
}

export class AVMService {
  /**
   * Calcular valor estimado baseado em comparáveis reais
   * Usa 3 métodos diferentes e reconcilia os resultados
   */
  static calculateValueFromComps(
    comps: ComparableData[],
    subjectSqft: number = 1500,
    subjectBeds: number = 3,
    subjectBaths: number = 2
  ): {
    estimatedValue: number;
    minValue: number;
    maxValue: number;
    confidence: number;
    breakdown: any;
  } {
    if (!comps || comps.length === 0) {
      throw new Error('No comparables available for AVM calculation');
    }

    // Filtrar comps válidos
    const validComps = comps.filter(c =>
      c.salePrice > 0 &&
      c.sqft > 0 &&
      c.beds > 0
    );

    if (validComps.length === 0) {
      throw new Error('No valid comparables for calculation');
    }

    // Calcular ajustes por características
    const adjustedPrices = validComps.map(comp => {
      let price = comp.salePrice;
      let adjustments = 0;

      // Ajuste por sqft (média $30/sqft no mercado)
      if (comp.sqft !== subjectSqft) {
        const sqftAdjustment = (subjectSqft - comp.sqft) * 30;
        price += sqftAdjustment;
        adjustments += sqftAdjustment;
      }

      // Ajuste por bedrooms ($5k per bed)
      if (comp.beds !== subjectBeds) {
        const bedAdjustment = (subjectBeds - comp.beds) * 5000;
        price += bedAdjustment;
        adjustments += bedAdjustment;
      }

      // Ajuste por baths ($3k per bath)
      if (comp.baths !== subjectBaths) {
        const bathAdjustment = (subjectBaths - comp.baths) * 3000;
        price += bathAdjustment;
        adjustments += bathAdjustment;
      }

      return {
        originalPrice: comp.salePrice,
        adjustedPrice: price,
        adjustments,
        adjustmentPercent: (adjustments / comp.salePrice) * 100
      };
    });

    // Calcular pesos (comps mais recentes e próximos = mais peso)
    const weights = validComps.map((comp, i) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(comp.saleDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recencyWeight = Math.max(0.5, 1 - (daysAgo / 180)); // Decai em 6 meses
      const distanceWeight = 1 / (1 + comp.distance / 2); // Closer = mais peso
      return recencyWeight * distanceWeight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // MÉTODO 1: Valor ponderado (60%)
    const weightedValue = adjustedPrices.reduce(
      (sum, price, i) => sum + (price.adjustedPrice * normalizedWeights[i]),
      0
    );

    // MÉTODO 2: Mediana (25%)
    const medianValue = this.getMedian(adjustedPrices.map(p => p.adjustedPrice));

    // MÉTODO 3: Média simples (15%)
    const averageValue =
      adjustedPrices.reduce((sum, p) => sum + p.adjustedPrice, 0) / adjustedPrices.length;

    // Reconciliar 3 métodos
    const estimatedValue = Math.round(
      (weightedValue * 0.6) + (medianValue * 0.25) + (averageValue * 0.15)
    );

    // Calcular desvio padrão para intervalo de confiança
    const stdDev = this.calculateStdDev(
      adjustedPrices.map(p => p.adjustedPrice),
      estimatedValue
    );

    const minValue = Math.round(estimatedValue - stdDev * 0.67); // -1σ (68% confidence)
    const maxValue = Math.round(estimatedValue + stdDev * 0.67); // +1σ

    // Confidence score (0-100%)
    // 60% base + 8% per comp up to 100%
    const confidence = Math.min(100, 60 + (validComps.length * 8));

    const breakdown = {
      estimatedValue,
      minValue,
      maxValue,
      confidence,
      usedComps: validComps.length,
      methods: {
        weighted: Math.round(weightedValue),
        median: Math.round(medianValue),
        average: Math.round(averageValue)
      },
      stdDev: Math.round(stdDev),
      adjustments: {
        sqft: subjectSqft,
        beds: subjectBeds,
        baths: subjectBaths
      }
    };

    console.log('📊 AVM CALCULATION COMPLETE:', breakdown);

    return {
      estimatedValue,
      minValue,
      maxValue,
      confidence,
      breakdown
    };
  }

  private static getMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private static calculateStdDev(values: number[], mean: number): number {
    const variance = values.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Validar qualidade dos dados dos comparáveis
   */
  static validateComps(comps: ComparableData[]): {
    isValid: boolean;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
  } {
    const issues: string[] = [];

    if (comps.length < 3) {
      issues.push(`Only ${comps.length} comps available (minimum 3 recommended)`);
    }

    if (comps.length > 10) {
      issues.push(`${comps.length} comps is excessive, use top 10 only`);
    }

    const demoComps = comps.filter(c => c.source === 'demo');
    if (demoComps.length > comps.length * 0.5) {
      issues.push(`${demoComps.length}/${comps.length} comps are DEMO DATA (should be < 50%)`);
    }

    const avgDistance = comps.reduce((sum, c) => sum + c.distance, 0) / comps.length;
    if (avgDistance > 3) {
      issues.push(`Average distance ${avgDistance.toFixed(2)} miles is too far (< 1 mile preferred)`);
    }

    // Determinar qualidade
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (issues.length > 0) quality = 'good';
    if (demoComps.length > 0) quality = 'fair';
    if (issues.length > 2) quality = 'poor';

    return {
      isValid: issues.length === 0,
      quality,
      issues
    };
  }
}
