import { describe, it, expect } from "vitest";
import {
  autoTagProperty,
  getTierFromScore,
  suggestTags,
  getTagInfo,
  type PropertyCharacteristics,
} from "@/utils/autoTagger";

const baseCharacteristics: PropertyCharacteristics = {
  score: 0,
  deed_certified: false,
  vacant: false,
  has_pool: false,
  owner_out_of_state: false,
  is_estate: false,
  equity_percentage: 0,
};

describe("autoTagProperty", () => {
  it("tags tier-1 and hot-lead for score >= 85", () => {
    const tags = autoTagProperty({ ...baseCharacteristics, score: 90 });
    expect(tags).toContain("tier-1");
    expect(tags).toContain("hot-lead");
  });

  it("tags tier-2 for score 70-84", () => {
    const tags = autoTagProperty({ ...baseCharacteristics, score: 75 });
    expect(tags).toContain("tier-2");
    expect(tags).not.toContain("hot-lead");
  });

  it("tags tier-3 for score 50-69", () => {
    const tags = autoTagProperty({ ...baseCharacteristics, score: 55 });
    expect(tags).toContain("tier-3");
  });

  it("returns empty for score < 50 with no characteristics", () => {
    const tags = autoTagProperty({ ...baseCharacteristics, score: 30 });
    expect(tags).toHaveLength(0);
  });

  it("adds characteristic-based tags", () => {
    const tags = autoTagProperty({
      ...baseCharacteristics,
      score: 60,
      vacant: true,
      has_pool: true,
      equity_percentage: 60,
      owner_out_of_state: true,
      is_estate: true,
      deed_certified: true,
    });
    expect(tags).toContain("tier-3");
    expect(tags).toContain("vacant");
    expect(tags).toContain("pool-distress");
    expect(tags).toContain("high-equity");
    expect(tags).toContain("out-of-state");
    expect(tags).toContain("estate-trust");
    expect(tags).toContain("deed-certified");
  });

  it("does not add high-equity for <= 50%", () => {
    const tags = autoTagProperty({ ...baseCharacteristics, equity_percentage: 50 });
    expect(tags).not.toContain("high-equity");
  });
});

describe("getTierFromScore", () => {
  it("returns correct tier", () => {
    expect(getTierFromScore(90)).toBe("tier-1");
    expect(getTierFromScore(85)).toBe("tier-1");
    expect(getTierFromScore(70)).toBe("tier-2");
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

  it("does not suggest low-offer when offer >= 70%", () => {
    const tags = suggestTags({ estimated_value: 100000, cash_offer_amount: 75000 });
    expect(tags).not.toContain("low-offer");
  });

  it("suggests out-of-state when owner city differs", () => {
    const tags = suggestTags({ city: "Miami", owner_address: "123 Main St, Orlando FL" });
    expect(tags).toContain("out-of-state");
  });

  it("returns empty for minimal data", () => {
    expect(suggestTags({})).toHaveLength(0);
  });
});

describe("getTagInfo", () => {
  it("returns known tag info", () => {
    const info = getTagInfo("hot-lead");
    expect(info.label).toBe("Hot Lead");
    expect(info.color).toBe("red");
  });

  it("returns fallback for unknown tag", () => {
    const info = getTagInfo("custom-tag");
    expect(info.label).toBe("custom-tag");
    expect(info.color).toBe("gray");
  });
});
