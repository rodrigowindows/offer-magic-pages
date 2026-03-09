import { describe, it, expect } from 'vitest';
import { calculateCompsPricing } from '@/services/compsPricing';

describe('calculateCompsPricing', () => {
  it('returns zeros for empty comps', () => {
    const result = calculateCompsPricing([], 1500);
    expect(result.validCount).toBe(0);
    expect(result.avgPricePerSqft).toBe(0);
    expect(result.estimatedARV).toBe(0);
  });

  it('filters out invalid comps (zero/null values)', () => {
    const comps = [
      { sale_price: 300000, square_feet: 1500 },
      { sale_price: 0, square_feet: 1200 },
      { sale_price: 250000, square_feet: 0 },
      { sale_price: undefined, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 1500);
    expect(result.validCount).toBe(1);
    expect(result.totalCount).toBe(4);
  });

  it('calculates avg $/sqft correctly', () => {
    const comps = [
      { sale_price: 300000, square_feet: 1500 }, // $200/sqft
      { sale_price: 250000, square_feet: 1250 }, // $200/sqft
    ];
    const result = calculateCompsPricing(comps, 1500);
    expect(result.avgPricePerSqft).toBe(200);
    expect(result.estimatedARV).toBe(300000);
  });

  it('calculates estimated ARV using subject sqft', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 }, // $200/sqft
    ];
    const result = calculateCompsPricing(comps, 2000);
    expect(result.estimatedARV).toBe(400000);
  });

  it('returns 0 ARV when subjectSqft is 0', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 0);
    expect(result.estimatedARV).toBe(0);
  });

  it('removes outliers with IQR when >= 4 comps', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 }, // $200
      { sale_price: 210000, square_feet: 1000 }, // $210
      { sale_price: 220000, square_feet: 1000 }, // $220
      { sale_price: 230000, square_feet: 1000 }, // $230
      { sale_price: 1000000, square_feet: 1000 }, // $1000 outlier
    ];
    const result = calculateCompsPricing(comps, 1000, true);
    expect(result.outliersRemoved).toBeGreaterThan(0);
    expect(result.avgPricePerSqft).toBeLessThan(500);
  });

  it('does not remove outliers when disabled', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 210000, square_feet: 1000 },
      { sale_price: 220000, square_feet: 1000 },
      { sale_price: 230000, square_feet: 1000 },
      { sale_price: 1000000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 1000, false);
    expect(result.outliersRemoved).toBe(0);
    expect(result.validCount).toBe(5);
  });

  it('does not apply IQR with < 4 comps', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 1000000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 1000, true);
    expect(result.outliersRemoved).toBe(0);
  });

  it('marks outliers in details', () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 210000, square_feet: 1000 },
      { sale_price: 220000, square_feet: 1000 },
      { sale_price: 230000, square_feet: 1000 },
      { sale_price: 1000000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 1000, true);
    const outliers = result.details.filter(d => d.isOutlier);
    expect(outliers.length).toBeGreaterThan(0);
  });
});
