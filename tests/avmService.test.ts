import { AVMService, type ComparableData } from '@/services/avmService';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

const createComp = (overrides: Partial<ComparableData> = {}): ComparableData => ({
  address: '123 Main St',
  city: 'Orlando',
  state: 'FL',
  zipCode: '32801',
  saleDate: daysAgo(30),
  salePrice: 300000,
  beds: 3,
  baths: 2,
  sqft: 1500,
  distance: 0.8,
  source: 'attom-v2',
  ...overrides,
});

describe('AVMService', () => {
  it('keeps confidence and quality metrics stable with partially invalid comp fields', () => {
    const comps: ComparableData[] = [
      createComp({ saleDate: 'invalid-date', distance: Number.NaN }),
      createComp({ saleDate: daysAgo(45), distance: 1.2, salePrice: 320000, sqft: 1600 }),
      createComp({ saleDate: daysAgo(60), distance: 0.5, salePrice: 310000, sqft: 1550 }),
    ];

    const result = AVMService.calculateValueFromComps(comps, 1550, 3, 2);

    expect(Number.isFinite(result.estimatedValue)).toBe(true);
    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(35);
    expect(result.confidence).toBeLessThanOrEqual(95);
    expect(result.breakdown.quality.avgDaysAgo).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.quality.avgDistance).toBeGreaterThanOrEqual(0);
  });

  it('returns higher confidence for recent/near trusted comps than stale/far demo comps', () => {
    const highQualityComps: ComparableData[] = [
      createComp({ saleDate: daysAgo(15), distance: 0.3, source: 'attom-v2' }),
      createComp({ saleDate: daysAgo(40), distance: 0.7, source: 'attom-v2', salePrice: 315000 }),
      createComp({ saleDate: daysAgo(50), distance: 0.9, source: 'attom-v2', salePrice: 305000 }),
      createComp({ saleDate: daysAgo(65), distance: 0.6, source: 'attom-v2', salePrice: 325000 }),
    ];

    const lowQualityComps: ComparableData[] = [
      createComp({ saleDate: daysAgo(800), distance: 4.5, source: 'demo', salePrice: 290000 }),
      createComp({ saleDate: daysAgo(700), distance: 5.2, source: 'demo', salePrice: 285000 }),
      createComp({ saleDate: daysAgo(900), distance: 4.8, source: 'demo', salePrice: 295000 }),
      createComp({ saleDate: daysAgo(650), distance: 5.1, source: 'demo', salePrice: 288000 }),
    ];

    const highResult = AVMService.calculateValueFromComps(highQualityComps, 1550, 3, 2);
    const lowResult = AVMService.calculateValueFromComps(lowQualityComps, 1550, 3, 2);

    expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
  });

  it('scales bed adjustments with market price level', () => {
    const lowBaseline = [
      createComp({ salePrice: 100000, sqft: 1000, beds: 3, baths: 2 }),
      createComp({ salePrice: 102000, sqft: 1020, beds: 3, baths: 2 }),
      createComp({ salePrice: 98000, sqft: 980, beds: 3, baths: 2 }),
    ];
    const lowWithBedMismatch = [
      createComp({ salePrice: 100000, sqft: 1000, beds: 2, baths: 2 }),
      createComp({ salePrice: 102000, sqft: 1020, beds: 3, baths: 2 }),
      createComp({ salePrice: 98000, sqft: 980, beds: 3, baths: 2 }),
    ];

    const highBaseline = [
      createComp({ salePrice: 1000000, sqft: 3000, beds: 3, baths: 2 }),
      createComp({ salePrice: 1020000, sqft: 3050, beds: 3, baths: 2 }),
      createComp({ salePrice: 980000, sqft: 2950, beds: 3, baths: 2 }),
    ];
    const highWithBedMismatch = [
      createComp({ salePrice: 1000000, sqft: 3000, beds: 2, baths: 2 }),
      createComp({ salePrice: 1020000, sqft: 3050, beds: 3, baths: 2 }),
      createComp({ salePrice: 980000, sqft: 2950, beds: 3, baths: 2 }),
    ];

    const lowBaseValue = AVMService.calculateValueFromComps(lowBaseline, 1000, 3, 2).estimatedValue;
    const lowMismatchValue = AVMService.calculateValueFromComps(lowWithBedMismatch, 1000, 3, 2).estimatedValue;
    const highBaseValue = AVMService.calculateValueFromComps(highBaseline, 3000, 3, 2).estimatedValue;
    const highMismatchValue = AVMService.calculateValueFromComps(highWithBedMismatch, 3000, 3, 2).estimatedValue;

    const lowImpact = Math.abs(lowMismatchValue - lowBaseValue);
    const highImpact = Math.abs(highMismatchValue - highBaseValue);

    expect(highImpact).toBeGreaterThan(lowImpact);
  });

  it('returns poor validation when no comps are provided', () => {
    const validation = AVMService.validateComps([]);

    expect(validation.isValid).toBe(false);
    expect(validation.quality).toBe('poor');
    expect(validation.issues).toContain('No comps available');
  });

  it('throws when all comps have zero sqft', () => {
    const comps = [
      createComp({ sqft: 0 }),
      createComp({ sqft: 0 }),
    ];

    expect(() => AVMService.calculateValueFromComps(comps, 1500, 3, 2))
      .toThrow('No valid comparables for calculation');
  });

  it('clamps estimated value min to zero', () => {
    // Very high stdDev scenario with spread prices
    const comps = [
      createComp({ salePrice: 50000, sqft: 500 }),
      createComp({ salePrice: 500000, sqft: 5000 }),
      createComp({ salePrice: 60000, sqft: 600 }),
    ];

    const result = AVMService.calculateValueFromComps(comps, 500, 3, 2);
    expect(result.minValue).toBeGreaterThanOrEqual(0);
    expect(result.maxValue).toBeGreaterThanOrEqual(result.minValue);
  });
});
