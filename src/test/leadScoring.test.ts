import { describe, it, expect } from "vitest";
import { calculateLeadScore, getLeadTier, type LeadSignals } from "@/utils/leadScoring";

const baseSignals: LeadSignals = {
  pageViews: 0,
  phoneClicks: 0,
  emailClicks: 0,
  formSubmitted: false,
  multipleVisits: false,
  isMobile: false,
  source: "direct",
  timeOnPageSeconds: 0,
};

describe("calculateLeadScore", () => {
  it("returns 0 for no engagement", () => {
    expect(calculateLeadScore(baseSignals)).toBe(0);
  });

  it("scores page views capped at 5", () => {
    expect(calculateLeadScore({ ...baseSignals, pageViews: 10 })).toBe(25);
  });

  it("scores form submission as 30 points", () => {
    expect(calculateLeadScore({ ...baseSignals, formSubmitted: true })).toBe(30);
  });

  it("scores phone clicks capped at 2", () => {
    expect(calculateLeadScore({ ...baseSignals, phoneClicks: 5 })).toBe(40);
  });

  it("never exceeds 100", () => {
    const maxSignals: LeadSignals = {
      pageViews: 100,
      phoneClicks: 100,
      emailClicks: 100,
      formSubmitted: true,
      multipleVisits: true,
      isMobile: true,
      source: "sms",
      timeOnPageSeconds: 120,
    };
    expect(calculateLeadScore(maxSignals)).toBe(100);
  });

  it("adds source bonus for campaign sources", () => {
    const sms = calculateLeadScore({ ...baseSignals, source: "sms" });
    const direct = calculateLeadScore({ ...baseSignals, source: "direct" });
    expect(sms - direct).toBe(10);
  });

  it("adds time on page bonus", () => {
    const short = calculateLeadScore({ ...baseSignals, timeOnPageSeconds: 10 });
    const mid = calculateLeadScore({ ...baseSignals, timeOnPageSeconds: 45 });
    const long = calculateLeadScore({ ...baseSignals, timeOnPageSeconds: 90 });
    expect(mid - short).toBe(5);
    expect(long - short).toBe(10);
  });
});

describe("getLeadTier", () => {
  it("returns cold for low scores", () => {
    expect(getLeadTier(0)).toBe("cold");
    expect(getLeadTier(29)).toBe("cold");
  });

  it("returns warm for mid scores", () => {
    expect(getLeadTier(30)).toBe("warm");
    expect(getLeadTier(59)).toBe("warm");
  });

  it("returns hot for high scores", () => {
    expect(getLeadTier(60)).toBe("hot");
    expect(getLeadTier(100)).toBe("hot");
  });
});
