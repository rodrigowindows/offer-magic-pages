import { describe, it, expect } from "vitest";
import {
  autoTagProperty,
  getTierFromScore,
  suggestTags,
  getTagInfo,
  AVAILABLE_TAGS,
  type PropertyCharacteristics,
} from "@/utils/autoTagger";

describe("autoTagProperty comprehensive", () => {
  const base: PropertyCharacteristics = {
    score: 0, deed_certified: false, vacant: false,
    has_pool: false, owner_out_of_state: false,
    is_estate: false, equity_percentage: 0,
  };

  it("tier-2 for score 70-84", () => {
    const tags = autoTagProperty({ ...base, score: 75 });
    expect(tags).toContain("tier-2");
    expect(tags).not.toContain("hot-lead");
  });

  it("tier-3 for score 50-69", () => {
    const tags = autoTagProperty({ ...base, score: 55 });
    expect(tags).toContain("tier-3");
  });

  it("no tier for score < 50", () => {
    const tags = autoTagProperty({ ...base, score: 30 });
    expect(tags).not.toContain("tier-1");
    expect(tags).not.toContain("tier-2");
    expect(tags).not.toContain("tier-3");
  });

  it("combines multiple characteristics", () => {
    const tags = autoTagProperty({
      score: 90, deed_certified: true, vacant: true,
      has_pool: true, owner_out_of_state: true,
      is_estate: true, equity_percentage: 80,
    });
    expect(tags).toContain("tier-1");
    expect(tags).toContain("hot-lead");
    expect(tags).toContain("deed-certified");
    expect(tags).toContain("vacant");
    expect(tags).toContain("pool-distress");
    expect(tags).toContain("out-of-state");
    expect(tags).toContain("estate-trust");
    expect(tags).toContain("high-equity");
  });

  it("equity at exactly 50 is not high-equity", () => {
    const tags = autoTagProperty({ ...base, equity_percentage: 50 });
    expect(tags).not.toContain("high-equity");
  });

  it("equity at 51 is high-equity", () => {
    const tags = autoTagProperty({ ...base, equity_percentage: 51 });
    expect(tags).toContain("high-equity");
  });
});

describe("getTierFromScore", () => {
  it("returns correct tiers at boundaries", () => {
    expect(getTierFromScore(85)).toBe("tier-1");
    expect(getTierFromScore(84)).toBe("tier-2");
    expect(getTierFromScore(70)).toBe("tier-2");
    expect(getTierFromScore(69)).toBe("tier-3");
    expect(getTierFromScore(50)).toBe("tier-3");
    expect(getTierFromScore(49)).toBe("low-priority");
    expect(getTierFromScore(0)).toBe("low-priority");
  });
});

describe("suggestTags", () => {
  it("suggests low-offer when offer < 70% of value", () => {
    const tags = suggestTags({ estimated_value: 100000, cash_offer_amount: 60000 });
    expect(tags).toContain("low-offer");
  });

  it("no low-offer when offer >= 70%", () => {
    const tags = suggestTags({ estimated_value: 100000, cash_offer_amount: 75000 });
    expect(tags).not.toContain("low-offer");
  });

  it("suggests out-of-state when owner city differs", () => {
    const tags = suggestTags({ owner_address: "123 Main St, New York", city: "Miami" });
    expect(tags).toContain("out-of-state");
  });

  it("no out-of-state when owner address contains city", () => {
    const tags = suggestTags({ owner_address: "123 Main St, Miami FL", city: "Miami" });
    expect(tags).not.toContain("out-of-state");
  });

  it("handles missing data gracefully", () => {
    expect(suggestTags({})).toEqual([]);
  });
});

describe("getTagInfo", () => {
  it("returns known tag info", () => {
    const info = getTagInfo("tier-1");
    expect(info.label).toBe("Tier 1");
    expect(info.color).toBe("red");
  });

  it("returns default for unknown tag", () => {
    const info = getTagInfo("unknown-tag");
    expect(info.value).toBe("unknown-tag");
    expect(info.color).toBe("gray");
  });
});

describe("AVAILABLE_TAGS", () => {
  it("has unique values", () => {
    const values = AVAILABLE_TAGS.map(t => t.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it("all have required fields", () => {
    AVAILABLE_TAGS.forEach(tag => {
      expect(tag.value).toBeTruthy();
      expect(tag.label).toBeTruthy();
      expect(tag.color).toBeTruthy();
    });
  });
});
