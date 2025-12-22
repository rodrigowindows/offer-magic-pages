// Auto-Scoring System for Properties

export interface PropertyScore {
  total: number; // 0-100
  factors: {
    location: number;
    value: number;
    condition: number;
    marketTrend: number;
  };
  recommendation: 'approve' | 'review' | 'reject';
  confidence: number; // 0-1
  reasoning: string[];
}

interface ScoringConfig {
  locationWeights: Record<string, number>;
  valueThresholds: {
    excellent: number; // < 60% of value
    good: number; // 60-75%
    fair: number; // 75-85%
    poor: number; // > 85%
  };
}

const defaultConfig: ScoringConfig = {
  locationWeights: {
    'Orlando': 85,
    'Winter Park': 90,
    'Lake Nona': 88,
    'Dr. Phillips': 87,
    'Windermere': 92,
    'Kissimmee': 70,
    'Apopka': 68,
    'Sanford': 65,
    // Add more cities as needed
  },
  valueThresholds: {
    excellent: 0.60,
    good: 0.75,
    fair: 0.85,
    poor: 0.85,
  },
};

export const calculateLocationScore = (city: string, config = defaultConfig): number => {
  // Return configured score or default to 70
  return config.locationWeights[city] || 70;
};

export const calculateValueScore = (
  cashOffer: number,
  estimatedValue: number,
  config = defaultConfig
): number => {
  if (estimatedValue === 0) return 50;

  const ratio = cashOffer / estimatedValue;
  const { excellent, good, fair } = config.valueThresholds;

  // Better deal (lower ratio) = higher score
  if (ratio < excellent) return 100; // Excellent deal
  if (ratio < good) return 85; // Good deal
  if (ratio < fair) return 70; // Fair deal
  return 50; // Not great deal
};

export const calculateConditionScore = (property: {
  condition_score?: number;
  condition_category?: string;
  visible_issues?: string[];
  distress_indicators?: string[];
}): number => {
  // If we have explicit condition score, use it
  if (property.condition_score) {
    return property.condition_score * 20; // Convert 1-5 to 0-100
  }

  // Otherwise, infer from condition data
  let score = 70; // Default

  if (property.condition_category) {
    const categoryScores: Record<string, number> = {
      'EXCELLENT': 95,
      'GOOD': 85,
      'FAIR': 70,
      'POOR': 50,
      'VERY POOR': 30,
    };
    score = categoryScores[property.condition_category] || 70;
  }

  // Penalize for issues
  const issueCount = (property.visible_issues?.length || 0) + (property.distress_indicators?.length || 0);
  score -= issueCount * 5;

  return Math.max(0, Math.min(100, score));
};

export const calculateMarketTrendScore = (
  city: string,
  estimatedValue: number
): number => {
  // Simplified market trend scoring
  // In production, this would fetch real market data

  // Higher value properties in good areas = better trend
  const hotMarkets = ['Winter Park', 'Lake Nona', 'Dr. Phillips', 'Windermere'];
  const isHotMarket = hotMarkets.includes(city);

  if (isHotMarket && estimatedValue > 300000) return 90;
  if (isHotMarket && estimatedValue > 200000) return 80;
  if (estimatedValue > 250000) return 75;
  if (estimatedValue > 150000) return 70;
  return 60;
};

export const autoScoreProperty = (property: {
  city: string;
  estimated_value: number;
  cash_offer_amount: number;
  condition_score?: number;
  condition_category?: string;
  visible_issues?: string[];
  distress_indicators?: string[];
}): PropertyScore => {
  const locationScore = calculateLocationScore(property.city);
  const valueScore = calculateValueScore(property.cash_offer_amount, property.estimated_value);
  const conditionScore = calculateConditionScore(property);
  const marketTrendScore = calculateMarketTrendScore(property.city, property.estimated_value);

  // Weighted average
  const total = Math.round(
    locationScore * 0.25 +
    valueScore * 0.35 +
    conditionScore * 0.25 +
    marketTrendScore * 0.15
  );

  // Determine recommendation
  let recommendation: 'approve' | 'review' | 'reject';
  let confidence: number;
  const reasoning: string[] = [];

  if (total >= 80) {
    recommendation = 'approve';
    confidence = 0.9;
    reasoning.push('Strong investment opportunity');
    if (valueScore >= 85) reasoning.push('Excellent price-to-value ratio');
    if (locationScore >= 85) reasoning.push('Premium location');
    if (conditionScore >= 80) reasoning.push('Good property condition');
  } else if (total >= 60) {
    recommendation = 'review';
    confidence = 0.6;
    reasoning.push('Requires manual review');
    if (valueScore < 70) reasoning.push('Consider negotiating price');
    if (conditionScore < 70) reasoning.push('Inspect property condition');
    if (locationScore < 70) reasoning.push('Assess market conditions');
  } else {
    recommendation = 'reject';
    confidence = 0.85;
    reasoning.push('Not recommended at current terms');
    if (valueScore < 60) reasoning.push('Price too high for value');
    if (conditionScore < 60) reasoning.push('Poor property condition');
    if (locationScore < 65) reasoning.push('Weak market location');
  }

  return {
    total,
    factors: {
      location: locationScore,
      value: valueScore,
      condition: conditionScore,
      marketTrend: marketTrendScore,
    },
    recommendation,
    confidence,
    reasoning,
  };
};

// Batch scoring
export const batchScoreProperties = (properties: any[]): Map<string, PropertyScore> => {
  const scores = new Map<string, PropertyScore>();

  properties.forEach(property => {
    scores.set(property.id, autoScoreProperty(property));
  });

  return scores;
};

// Get scoring summary statistics
export const getScoringStats = (scores: PropertyScore[]) => {
  const totalScores = scores.map(s => s.total);
  const avgScore = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;

  return {
    average: Math.round(avgScore),
    highest: Math.max(...totalScores),
    lowest: Math.min(...totalScores),
    approveCount: scores.filter(s => s.recommendation === 'approve').length,
    reviewCount: scores.filter(s => s.recommendation === 'review').length,
    rejectCount: scores.filter(s => s.recommendation === 'reject').length,
  };
};
