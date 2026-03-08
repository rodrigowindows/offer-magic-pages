import { describe, it, expect } from "vitest";
import { calculateCompsPricing } from "@/services/compsPricing";

describe("calculateCompsPricing", () => {
  it("returns zeros for empty comps", () => {
    const result = calculateCompsPricing([], 1000);
    expect(result.validCount).toBe(0);
    expect(result.avgPricePerSqft).toBe(0);
    expect(result.estimatedARV).toBe(0);
  });

  it("calculates avg price per sqft correctly", () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 }, // $200/sqft
      { sale_price: 300000, square_feet: 1000 }, // $300/sqft
    ];
    const result = calculateCompsPricing(comps, 1200, false);
    expect(result.avgPricePerSqft).toBe(250);
    expect(result.estimatedARV).toBe(300000);
    expect(result.validCount).toBe(2);
  });

  it("filters out invalid comps", () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 0, square_feet: 1000 },
      { sale_price: 300000, square_feet: 0 },
      {},
    ];
    const result = calculateCompsPricing(comps, 1000, false);
    expect(result.validCount).toBe(1);
    expect(result.totalCount).toBe(4);
  });

  it("applies IQR outlier removal with >= 4 comps", () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 }, // $200
      { sale_price: 210000, square_feet: 1000 }, // $210
      { sale_price: 220000, square_feet: 1000 }, // $220
      { sale_price: 205000, square_feet: 1000 }, // $205
      { sale_price: 900000, square_feet: 1000 }, // $900 outlier
    ];
    const result = calculateCompsPricing(comps, 1000, true);
    expect(result.outliersRemoved).toBeGreaterThan(0);
    expect(result.avgPricePerSqft).toBeLessThan(400); // Without outlier
  });

  it("skips outlier removal with < 4 comps", () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 900000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 0, true);
    expect(result.outliersRemoved).toBe(0);
    expect(result.validCount).toBe(2);
  });

  it("returns 0 ARV when subjectSqft is 0", () => {
    const comps = [{ sale_price: 200000, square_feet: 1000 }];
    const result = calculateCompsPricing(comps, 0);
    expect(result.estimatedARV).toBe(0);
    expect(result.avgPricePerSqft).toBe(200);
  });

  it("details include outlier flags", () => {
    const comps = [
      { sale_price: 200000, square_feet: 1000 },
      { sale_price: 210000, square_feet: 1000 },
      { sale_price: 220000, square_feet: 1000 },
      { sale_price: 205000, square_feet: 1000 },
      { sale_price: 900000, square_feet: 1000 },
    ];
    const result = calculateCompsPricing(comps, 1000, true);
    const outliers = result.details.filter(d => d.isOutlier);
    expect(outliers.length).toBeGreaterThan(0);
  });
});
