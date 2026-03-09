import { describe, it, expect } from 'vitest';
import { generateRuleBasedAnalysis, generateZillowSearchUrl, generateZillowUrls } from '@/utils/aiPropertyAnalyzer';

describe('generateRuleBasedAnalysis', () => {
  it('returns hot market for low offer percentage (<70%)', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 180000);
    expect(result.marketCondition).toBe('hot');
    expect(result.offerPercentage).toBe(60);
  });

  it('returns normal market for moderate offer (70-85%)', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 225000);
    expect(result.marketCondition).toBe('normal');
  });

  it('returns cold market for high offer (>85%)', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 270000);
    expect(result.marketCondition).toBe('cold');
  });

  it('recommends increasing offer when too low (<65%)', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 150000);
    expect(result.recommendation).toContain('TOO LOW');
  });

  it('shows good offer for 65-75% range', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 210000);
    expect(result.recommendation).toContain('GOOD OFFER');
  });

  it('warns about high offer >85%', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 300000, 270000);
    expect(result.recommendation).toContain('HIGH OFFER');
  });

  it('calculates value range with ±10% variance', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 200000, 140000);
    expect(result.estimatedValueRange.low).toBe(180000);
    expect(result.estimatedValueRange.mid).toBe(200000);
    expect(result.estimatedValueRange.high).toBe(220000);
  });

  it('includes zillow URL', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 200000, 140000);
    expect(result.zillowSearchUrl).toContain('zillow.com');
  });

  it('has medium confidence for rule-based', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 200000, 140000);
    expect(result.confidence).toBe('medium');
  });

  it('includes AI analysis text', () => {
    const result = generateRuleBasedAnalysis('123 Main St', 'Orlando', 'FL', '32801', 200000, 140000);
    expect(result.aiAnalysis).toContain('Property Analysis');
    expect(result.aiAnalysis).toContain('123 Main St');
  });
});

describe('generateZillowSearchUrl', () => {
  it('generates encoded search URL', () => {
    const url = generateZillowSearchUrl('123 Main St', 'Orlando', 'FL', '32801');
    expect(url).toContain('zillow.com/homes/');
    expect(url).toContain('123');
  });
});

describe('generateZillowUrls', () => {
  it('returns search, direct, and map URLs', () => {
    const urls = generateZillowUrls('123 Main St', 'Orlando', 'FL', '32801');
    expect(urls.searchUrl).toContain('zillow.com/homes/');
    expect(urls.directUrl).toContain('zillow.com/homedetails/');
    expect(urls.mapUrl).toContain('zillow.com/homes/');
  });
});
