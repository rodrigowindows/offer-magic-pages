import { describe, it, expect } from "vitest";
import { getLeadTierColor, getLeadTierLabel } from "@/utils/leadScoring";

describe("getLeadTierColor", () => {
  it("returns correct color for each tier", () => {
    expect(getLeadTierColor("hot")).toBe("text-destructive");
    expect(getLeadTierColor("warm")).toBe("text-warning");
    expect(getLeadTierColor("cold")).toBe("text-muted-foreground");
  });
});

describe("getLeadTierLabel", () => {
  it("returns correct label for each tier", () => {
    expect(getLeadTierLabel("hot")).toBe("🔥 Hot Lead");
    expect(getLeadTierLabel("warm")).toBe("🌤️ Warm Lead");
    expect(getLeadTierLabel("cold")).toBe("❄️ Cold Lead");
  });
});
