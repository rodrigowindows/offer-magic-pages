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
  it("returns range when min and max exist (legacy fields)", () => {
    expect(getOfferType({ min_offer_amount: 100, max_offer_amount: 200 })).toBe("range");
  });

  it("returns range when cash_offer_min/max exist", () => {
    expect(getOfferType({ cash_offer_min: 100, cash_offer_max: 200 })).toBe("range");
  });

  it("returns fixed when only cash_offer_amount", () => {
    expect(getOfferType({ cash_offer_amount: 150000 })).toBe("fixed");
  });

  it("returns fixed as fallback for empty object", () => {
    expect(getOfferType({})).toBe("fixed");
  });
});

describe("formatOffer", () => {
  it("formats fixed offer", () => {
    const result = formatOffer({ cash_offer_amount: 150000 });
    expect(result).toBe("$150,000");
  });

  it("formats zero offer", () => {
    const result = formatOffer({});
    expect(result).toBe("$0");
  });

  it("formats range offer", () => {
    const result = formatOffer({ min_offer_amount: 100000, max_offer_amount: 150000 });
    expect(result).toContain("100,000");
    expect(result).toContain("150,000");
  });

  it("formats with shortForm", () => {
    const result = formatOffer({ cash_offer_amount: 150000 }, { shortForm: true });
    expect(result).toContain("150,000");
  });
});

describe("formatOfferForTemplate", () => {
  it("formats fixed amount", () => {
    expect(formatOfferForTemplate({ cash_offer_amount: 200000 })).toBe("$200,000");
  });

  it("formats range with cash_offer_min/max", () => {
    const result = formatOfferForTemplate({ cash_offer_min: 100000, cash_offer_max: 150000 });
    expect(result).toContain("100,000");
    expect(result).toContain("150,000");
  });
});

describe("getOfferAverage", () => {
  it("returns average for range", () => {
    expect(getOfferAverage({ min_offer_amount: 100000, max_offer_amount: 200000 })).toBe(150000);
  });

  it("returns fixed amount", () => {
    expect(getOfferAverage({ cash_offer_amount: 175000 })).toBe(175000);
  });

  it("returns 0 for empty", () => {
    expect(getOfferAverage({})).toBe(0);
  });
});

describe("isValidOffer", () => {
  it("valid fixed offer", () => {
    expect(isValidOffer({ cash_offer_amount: 100000 })).toBe(true);
  });

  it("invalid fixed offer with 0", () => {
    expect(isValidOffer({ cash_offer_amount: 0 })).toBe(false);
  });

  it("valid range offer", () => {
    expect(isValidOffer({ min_offer_amount: 100000, max_offer_amount: 200000 })).toBe(true);
  });

  it("invalid range where min >= max", () => {
    expect(isValidOffer({ min_offer_amount: 200000, max_offer_amount: 100000 })).toBe(false);
  });

  it("invalid range with 0 values", () => {
    expect(isValidOffer({ min_offer_amount: 0, max_offer_amount: 200000 })).toBe(false);
  });
});

describe("getOfferDescription", () => {
  it("describes fixed offer", () => {
    expect(getOfferDescription({ cash_offer_amount: 150000 })).toBe("Fixed: $150000");
  });

  it("describes range offer", () => {
    const desc = getOfferDescription({ min_offer_amount: 100000, max_offer_amount: 200000 });
    expect(desc).toContain("Range");
    expect(desc).toContain("100000");
    expect(desc).toContain("200000");
  });
});
