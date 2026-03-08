import { describe, it, expect } from "vitest";
import {
  getOfferType,
  formatOffer,
  formatOfferForTemplate,
  getOfferAverage,
  isValidOffer,
  getOfferDescription,
} from "@/utils/offerUtils";

describe("getOfferType", () => {
  it("returns 'range' when min and max are set", () => {
    expect(getOfferType({ min_offer_amount: 100000, max_offer_amount: 150000 })).toBe("range");
  });

  it("returns 'fixed' when only cash_offer_amount is set", () => {
    expect(getOfferType({ cash_offer_amount: 120000 })).toBe("fixed");
  });

  it("returns 'fixed' as fallback", () => {
    expect(getOfferType({})).toBe("fixed");
  });

  it("supports cash_offer_min/max fields", () => {
    expect(getOfferType({ cash_offer_min: 90000, cash_offer_max: 110000 })).toBe("range");
  });
});

describe("formatOffer", () => {
  it("formats fixed offer", () => {
    const result = formatOffer({ cash_offer_amount: 250000 });
    expect(result).toBe("$250,000");
  });

  it("formats range offer", () => {
    const result = formatOffer({ min_offer_amount: 200000, max_offer_amount: 250000 });
    expect(result).toBe("$200,000 - $250,000");
  });

  it("handles zero amount", () => {
    expect(formatOffer({})).toBe("$0");
  });
});

describe("formatOfferForTemplate", () => {
  it("formats fixed offer for template", () => {
    expect(formatOfferForTemplate({ cash_offer_amount: 100000 })).toBe("$100,000");
  });

  it("formats range offer for template", () => {
    expect(formatOfferForTemplate({ cash_offer_min: 80000, cash_offer_max: 120000 })).toBe("$80,000 - $120,000");
  });
});

describe("getOfferAverage", () => {
  it("returns average for range", () => {
    expect(getOfferAverage({ min_offer_amount: 100000, max_offer_amount: 200000 })).toBe(150000);
  });

  it("returns cash_offer_amount for fixed", () => {
    expect(getOfferAverage({ cash_offer_amount: 120000 })).toBe(120000);
  });

  it("returns 0 when no data", () => {
    expect(getOfferAverage({})).toBe(0);
  });
});

describe("isValidOffer", () => {
  it("validates fixed offer", () => {
    expect(isValidOffer({ cash_offer_amount: 100000 })).toBe(true);
    expect(isValidOffer({ cash_offer_amount: 0 })).toBe(false);
    expect(isValidOffer({})).toBe(false);
  });

  it("validates range offer", () => {
    expect(isValidOffer({ min_offer_amount: 100000, max_offer_amount: 150000 })).toBe(true);
    expect(isValidOffer({ min_offer_amount: 150000, max_offer_amount: 100000 })).toBe(false);
  });
});

describe("getOfferDescription", () => {
  it("describes fixed offer", () => {
    expect(getOfferDescription({ cash_offer_amount: 100000 })).toBe("Fixed: $100000");
  });

  it("describes range offer", () => {
    expect(getOfferDescription({ min_offer_amount: 80000, max_offer_amount: 120000 })).toBe("Range: $80000 - $120000");
  });
});
