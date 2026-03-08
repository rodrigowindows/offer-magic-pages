import { describe, it, expect } from "vitest";
import {
  calculateLeadScore,
  getLeadTier,
  getLeadTierColor,
  getLeadTierLabel,
  type LeadSignals,
} from "@/utils/leadScoring";

const base: LeadSignals = {
  pageViews: 0, phoneClicks: 0, emailClicks: 0,
  formSubmitted: false, multipleVisits: false, isMobile: false,
  source: "direct", timeOnPageSeconds: 0,
};

describe("calculateLeadScore edge cases", () => {
  it("email clicks capped at 2", () => {
    expect(calculateLeadScore({ ...base, emailClicks: 10 })).toBe(20);
  });

  it("mobile adds 5 points", () => {
    expect(calculateLeadScore({ ...base, isMobile: true })).toBe(5);
  });

  it("multiple visits adds 15", () => {
    expect(calculateLeadScore({ ...base, multipleVisits: true })).toBe(15);
  });

  it("email and call sources add bonus", () => {
    expect(calculateLeadScore({ ...base, source: "email" })).toBe(10);
    expect(calculateLeadScore({ ...base, source: "call" })).toBe(10);
  });

  it("non-campaign source gets no bonus", () => {
    expect(calculateLeadScore({ ...base, source: "google" })).toBe(0);
  });

  it("combined signals compute correctly", () => {
    const signals: LeadSignals = {
      pageViews: 3, phoneClicks: 1, emailClicks: 1,
      formSubmitted: true, multipleVisits: true, isMobile: true,
      source: "sms", timeOnPageSeconds: 90,
    };
    // 15 + 20 + 10 + 30 + 15 + 5 + 10 + 10 = 115, capped at 100
    expect(calculateLeadScore(signals)).toBe(100);
  });
});

describe("getLeadTierColor", () => {
  it("returns correct colors", () => {
    expect(getLeadTierColor("hot")).toBe("text-destructive");
    expect(getLeadTierColor("warm")).toBe("text-warning");
    expect(getLeadTierColor("cold")).toBe("text-muted-foreground");
  });
});

describe("getLeadTierLabel", () => {
  it("returns correct labels", () => {
    expect(getLeadTierLabel("hot")).toContain("Hot");
    expect(getLeadTierLabel("warm")).toContain("Warm");
    expect(getLeadTierLabel("cold")).toContain("Cold");
  });
});
