import { describe, it, expect } from "vitest";
import { calculateLeadScore, getLeadTier, type LeadSignals } from "@/utils/leadScoring";

const base: LeadSignals = {
  pageViews: 0, phoneClicks: 0, emailClicks: 0,
  formSubmitted: false, multipleVisits: false, isMobile: false,
  source: "direct", timeOnPageSeconds: 0,
};

describe("calculateLeadScore boundary cases", () => {
  it("page views capped at 5", () => {
    expect(calculateLeadScore({ ...base, pageViews: 100 })).toBe(25);
  });

  it("phone clicks capped at 2", () => {
    expect(calculateLeadScore({ ...base, phoneClicks: 10 })).toBe(40);
  });

  it("time on page 30s gives 5 points", () => {
    expect(calculateLeadScore({ ...base, timeOnPageSeconds: 30 })).toBe(5);
  });

  it("time on page 59s still gives 5 points (not 10)", () => {
    expect(calculateLeadScore({ ...base, timeOnPageSeconds: 59 })).toBe(5);
  });

  it("time on page 60s gives 10 points", () => {
    expect(calculateLeadScore({ ...base, timeOnPageSeconds: 60 })).toBe(10);
  });

  it("sms source counts as paid", () => {
    expect(calculateLeadScore({ ...base, source: "sms" })).toBe(10);
  });

  it("direct source gives no bonus", () => {
    expect(calculateLeadScore({ ...base, source: "direct" })).toBe(0);
  });

  it("zero signals gives zero score", () => {
    expect(calculateLeadScore(base)).toBe(0);
  });
});

describe("getLeadTier boundaries", () => {
  it("59 is warm", () => expect(getLeadTier(59)).toBe("warm"));
  it("60 is hot", () => expect(getLeadTier(60)).toBe("hot"));
  it("29 is cold", () => expect(getLeadTier(29)).toBe("cold"));
  it("30 is warm", () => expect(getLeadTier(30)).toBe("warm"));
  it("0 is cold", () => expect(getLeadTier(0)).toBe("cold"));
  it("100 is hot", () => expect(getLeadTier(100)).toBe("hot"));
});
