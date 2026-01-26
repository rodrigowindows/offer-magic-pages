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

    // Calcular preço médio por sqft para ajustes dinâmicos
    const avgPricePerSqft = validComps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / validComps.length;

    // Calcular ajustes por características
    const adjustedPrices = validComps.map(comp => {
      let price = comp.salePrice;
      let adjustments = 0;

      // Ajuste por sqft dinâmico baseado na média dos comps
      if (comp.sqft !== subjectSqft) {
        const sqftAdjustment = (subjectSqft - comp.sqft) * (avgPricePerSqft * 0.8); // 80% do valor médio
        price += sqftAdjustment;
        adjustments += sqftAdjustment;
      }

      // Ajuste por bedrooms (dinâmico)
      if (comp.beds !== subjectBeds) {
        // $5K por bed ou 2% do preço médio, o que for maior
        const bedValuePerUnit = Math.max(5000, avgPricePerSqft * 100 * 0.02);
        const bedAdjustment = (subjectBeds - comp.beds) * bedValuePerUnit;
        price += bedAdjustment;
        adjustments += bedAdjustment;
      }

      // Ajuste por baths (dinâmico)
      if (comp.baths !== subjectBaths) {
        // $3K por bath ou 1.5% do preço médio, o que for maior
        const bathValuePerUnit = Math.max(3000, avgPricePerSqft * 100 * 0.015);
        const bathAdjustment = (subjectBaths - comp.baths) * bathValuePerUnit;
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
      const recencyWeight = Math.max(0.3, 1 - (daysAgo / 365)); // Decai em 12 meses
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

    const minValue = Math.round(estimatedValue - stdDev * 1.5); // -1.5σ (~87% confidence)
    const maxValue = Math.round(estimatedValue + stdDev * 1.5); // +1.5σ

    // Métricas de qualidade para confidence score
    const avgDistance = validComps.reduce((sum, c) => sum + (c.distance || 0), 0) / validComps.length;
    const avgDaysAgo = validComps.reduce((sum, c) => {
      const daysAgo = Math.floor((Date.now() - new Date(c.saleDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + daysAgo;
    }, 0) / validComps.length;
    const sourceBonus = validComps.every(c => c.source === 'attom-v2' || c.source === 'attom') ? 5 : 0;

    // Usar validação existente
    const validation = this.validateComps(validComps);
    const qualityBonus = validation.quality === 'excellent' ? 10 : 
                         validation.quality === 'good' ? 5 : 
                         validation.quality === 'fair' ? 0 : -5;

    const baseConfidence = 50;
    const compBonus = validComps.length * 5; // 5% por comp (max 25% com 5 comps)
    const distancePenalty = avgDistance > 2 ? -10 : avgDistance > 1 ? -5 : 0;
    const recencyBonus = avgDaysAgo < 90 ? 10 : avgDaysAgo < 180 ? 5 : 0;

    const confidence = Math.min(95, baseConfidence + compBonus + qualityBonus + recencyBonus + sourceBonus + distancePenalty);

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
      },
      // NOVO: Métricas de qualidade
      quality: {
        avgDistance: Math.round(avgDistance * 10) / 10,
        avgDaysAgo: Math.round(avgDaysAgo),
        sources: [...new Set(validComps.map(c => c.source))],
        validation: validation.quality
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
   * Estimar sqft/beds/baths do subject baseado nos comps
   * Usa mediana para evitar outliers
   */
  static estimateSubjectProperties(comps: ComparableData[]): {
    sqft: number;
    beds: number;
    baths: number;
  } {
    if (!comps || comps.length === 0) {
      console.warn('⚠️ No comps available for estimation, using market averages');
      return { sqft: 1500, beds: 3, baths: 2 };
    }

    const validComps = comps.filter(c => c.sqft > 0 && c.beds > 0 && c.baths > 0);

    if (validComps.length === 0) {
      console.warn('⚠️ No valid comps for estimation, using market averages');
      return { sqft: 1500, beds: 3, baths: 2 };
    }

    const sqfts = validComps.map(c => c.sqft).sort((a, b) => a - b);
    const beds = validComps.map(c => c.beds).sort((a, b) => a - b);
    const baths = validComps.map(c => c.baths).sort((a, b) => a - b);

    const estimatedSqft = Math.round(this.getMedian(sqfts));
    const estimatedBeds = Math.round(this.getMedian(beds));
    const estimatedBaths = Math.round(this.getMedian(baths) * 2) / 2; // Round to nearest 0.5

    console.log(`📊 Estimated subject properties from ${validComps.length} comps:`, {
      sqft: estimatedSqft,
      beds: estimatedBeds,
      baths: estimatedBaths
    });

    return {
      sqft: estimatedSqft,
      beds: estimatedBeds,
      baths: estimatedBaths
    };
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
