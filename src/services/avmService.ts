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

    // Filter to comps that have enough numeric data for valuation
    const validComps = comps.filter(c =>
      Number.isFinite(c.salePrice) &&
      c.salePrice > 0 &&
      Number.isFinite(c.sqft) &&
      c.sqft > 0
    );

    if (validComps.length === 0) {
      throw new Error('No valid comparables for calculation');
    }

    // Average market signals used by dynamic adjustments
    const avgPricePerSqft = validComps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / validComps.length;
    const avgSalePrice = validComps.reduce((sum, c) => sum + c.salePrice, 0) / validComps.length;

    // Apply feature adjustments to each comp
    const adjustedPrices = validComps.map(comp => {
      let price = comp.salePrice;
      let adjustments = 0;
      const compBeds = Number.isFinite(comp.beds) && comp.beds > 0 ? comp.beds : subjectBeds;
      const compBaths = Number.isFinite(comp.baths) && comp.baths > 0 ? comp.baths : subjectBaths;

      // Sqft adjustment (primary driver)
      if (comp.sqft !== subjectSqft) {
        const sqftAdjustment = (subjectSqft - comp.sqft) * (avgPricePerSqft * 0.8);
        price += sqftAdjustment;
        adjustments += sqftAdjustment;
      }

      // Bedroom adjustment scales with local price level
      if (compBeds !== subjectBeds) {
        const bedValuePerUnit = Math.max(5000, avgSalePrice * 0.015);
        const bedAdjustment = (subjectBeds - compBeds) * bedValuePerUnit;
        price += bedAdjustment;
        adjustments += bedAdjustment;
      }

      // Bathroom adjustment scales with local price level
      if (compBaths !== subjectBaths) {
        const bathValuePerUnit = Math.max(3000, avgSalePrice * 0.01);
        const bathAdjustment = (subjectBaths - compBaths) * bathValuePerUnit;
        price += bathAdjustment;
        adjustments += bathAdjustment;
      }

      // Guardrail against extreme negative adjustments
      price = Math.max(10000, price);

      return {
        originalPrice: comp.salePrice,
        adjustedPrice: price,
        adjustments,
        adjustmentPercent: (adjustments / comp.salePrice) * 100
      };
    });

    // Weight recent and nearby sales higher
    const weights = validComps.map((comp, i) => {
      const daysAgo = this.getDaysAgo(comp.saleDate);
      const recencyWeight = Math.max(0.2, 1 - (daysAgo / 730)); // Decays over ~24 months
      const distance = this.normalizeDistance(comp.distance);
      const distanceWeight = 1 / (1 + distance / 2);
      const weight = recencyWeight * distanceWeight;
      return Number.isFinite(weight) && weight > 0 ? weight : 0.2;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights =
      totalWeight > 0
        ? weights.map(w => w / totalWeight)
        : weights.map(() => 1 / weights.length);

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

    // Confidence interval from adjusted distribution
    const stdDev = this.calculateStdDev(
      adjustedPrices.map(p => p.adjustedPrice),
      averageValue
    );

    const minValue = Math.max(0, Math.round(estimatedValue - stdDev * 1.5));
    const maxValue = Math.max(minValue, Math.round(estimatedValue + stdDev * 1.5));

    // Quality metrics for confidence score
    const avgDistance = validComps.reduce((sum, c) => sum + this.normalizeDistance(c.distance), 0) / validComps.length;
    const avgDaysAgo = validComps.reduce((sum, c) => {
      return sum + this.getDaysAgo(c.saleDate);
    }, 0) / validComps.length;
    const trustedSourceCount = validComps.filter(c =>
      c.source &&
      ['attom-v2', 'attom-v1', 'attom', 'zillow-api', 'county-csv', 'manual'].includes(c.source)
    ).length;
    const trustedSourceRatio = trustedSourceCount / validComps.length;
    const sourceBonus = trustedSourceRatio >= 0.8 ? 5 : trustedSourceRatio >= 0.5 ? 2 : 0;

    // Existing validation influences confidence
    const validation = this.validateComps(validComps);
    const qualityBonus = validation.quality === 'excellent'
      ? 10
      : validation.quality === 'good'
        ? 5
        : validation.quality === 'fair'
          ? 0
          : -5;

    const baseConfidence = 50;
    const compBonus = Math.min(25, validComps.length * 5);
    const distancePenalty = avgDistance > 3 ? -10 : avgDistance > 2 ? -6 : avgDistance > 1 ? -3 : 0;
    const recencyBonus = avgDaysAgo < 90 ? 10 : avgDaysAgo < 180 ? 5 : avgDaysAgo < 365 ? 2 : 0;

    const rawConfidence = baseConfidence + compBonus + qualityBonus + recencyBonus + sourceBonus + distancePenalty;
    const confidence = Math.max(35, Math.min(95, Math.round(rawConfidence)));

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
        validation: validation.quality,
        validationIssues: validation.issues
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
    if (values.length < 2) return 0;
    const variance = values.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private static getDaysAgo(dateValue: string): number {
    const parsedDate = Date.parse(dateValue);
    if (!Number.isFinite(parsedDate)) {
      return 365; // Treat invalid dates as stale data
    }

    const diffDays = Math.floor((Date.now() - parsedDate) / (1000 * 60 * 60 * 24));
    if (!Number.isFinite(diffDays)) {
      return 365;
    }

    return Math.max(0, diffDays);
  }

  private static normalizeDistance(distance: number | undefined): number {
    if (!Number.isFinite(distance)) {
      return 3;
    }
    return Math.max(0, Number(distance));
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

    if (!comps || comps.length === 0) {
      return {
        isValid: false,
        quality: 'poor',
        issues: ['No comps available']
      };
    }

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

    const avgDistance = comps.reduce((sum, c) => sum + this.normalizeDistance(c.distance), 0) / comps.length;
    if (avgDistance > 3) {
      issues.push(`Average distance ${avgDistance.toFixed(2)} miles is too far (< 1 mile preferred)`);
    }

    const avgDaysAgo = comps.reduce((sum, c) => sum + this.getDaysAgo(c.saleDate), 0) / comps.length;
    if (avgDaysAgo > 365) {
      issues.push(`Average sale recency ${Math.round(avgDaysAgo)} days is too old (< 180 preferred)`);
    }

    // Determinar qualidade
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    if (issues.length > 0) quality = 'good';
    if (demoComps.length > comps.length * 0.3) quality = 'fair';
    if (issues.length > 2 || demoComps.length > comps.length * 0.5) quality = 'poor';

    return {
      isValid: issues.length === 0,
      quality,
      issues
    };
  }
}
