import { describe, it, expect } from "vitest";
import {
  detectSource,
  extractAddressFromUrl,
  extractDataFromUrlParams,
  extractDataFromUrl,
  formatExtractedAddress,
  isValidExtractedData,
} from "@/utils/urlDataExtractor";

describe("detectSource", () => {
  it("detects zillow", () => {
    expect(detectSource("https://www.zillow.com/homedetails/123-Main-St")).toBe("zillow");
  });

  it("detects redfin", () => {
    expect(detectSource("https://www.redfin.com/FL/Orlando/123-Main")).toBe("redfin");
  });

  it("detects trulia", () => {
    expect(detectSource("https://www.trulia.com/p/fl/orlando/123-main")).toBe("trulia");
  });

  it("detects realtor", () => {
    expect(detectSource("https://www.realtor.com/realestateandhomes-detail/123")).toBe("realtor");
  });

  it("returns other for unknown", () => {
    expect(detectSource("https://example.com")).toBe("other");
  });
});

describe("extractAddressFromUrl", () => {
  it("extracts from zillow URL", () => {
    const result = extractAddressFromUrl("https://www.zillow.com/homedetails/123-Main-St-Orlando-FL-32801/12345_zpid");
    expect(result.source).toBe("zillow");
    expect(result.state).toBe("FL");
    expect(result.zipCode).toBe("32801");
  });

  it("extracts from redfin URL", () => {
    const result = extractAddressFromUrl("https://www.redfin.com/FL/Orlando/123-Main-St-32801/home/12345");
    expect(result.source).toBe("redfin");
    expect(result.state).toBe("FL");
    expect(result.city).toBe("Orlando");
    expect(result.zipCode).toBe("32801");
  });

  it("extracts from trulia URL", () => {
    const result = extractAddressFromUrl("https://www.trulia.com/p/fl/orlando/123-main-st-32801--12345");
    expect(result.source).toBe("trulia");
    expect(result.state).toBe("FL");
    expect(result.city).toBe("orlando");
  });

  it("extracts from realtor URL", () => {
    const result = extractAddressFromUrl("https://www.realtor.com/realestateandhomes-detail/123-Main-St_Orlando_FL_32801_M12345");
    expect(result.source).toBe("realtor");
    expect(result.state).toBe("FL");
    expect(result.city).toBe("Orlando");
    expect(result.zipCode).toBe("32801");
  });

  it("handles invalid URL gracefully", () => {
    const result = extractAddressFromUrl("not-a-url");
    expect(result.source).toBe("other");
  });
});

describe("extractDataFromUrlParams", () => {
  it("extracts price, beds, baths, sqft from query params", () => {
    const result = extractDataFromUrlParams("https://example.com?price=250000&beds=3&baths=2&sqft=1500");
    expect(result.price).toBe(250000);
    expect(result.beds).toBe(3);
    expect(result.baths).toBe(2);
    expect(result.sqft).toBe(1500);
  });

  it("returns undefined for missing params", () => {
    const result = extractDataFromUrlParams("https://example.com");
    expect(result.price).toBeUndefined();
    expect(result.beds).toBeUndefined();
  });

  it("handles invalid URL gracefully", () => {
    const result = extractDataFromUrlParams("not-a-url");
    expect(result).toEqual({});
  });
});

describe("extractDataFromUrl", () => {
  it("combines address and param data", () => {
    const result = extractDataFromUrl("https://www.zillow.com/homedetails/123-Main-St-Orlando-FL-32801/12345_zpid?price=250000");
    expect(result.source).toBe("zillow");
    expect(result.price).toBe(250000);
    expect(result.state).toBe("FL");
  });
});

describe("formatExtractedAddress", () => {
  it("formats complete address", () => {
    const result = formatExtractedAddress({
      address: "123 Main St", city: "Orlando", state: "FL", zipCode: "32801", source: "zillow",
    });
    expect(result).toBe("123 Main St, Orlando, FL, 32801");
  });

  it("omits missing parts", () => {
    const result = formatExtractedAddress({ address: "123 Main St", source: "other" });
    expect(result).toBe("123 Main St");
  });
});

describe("isValidExtractedData", () => {
  it("valid with address", () => {
    expect(isValidExtractedData({ address: "123 Main", source: "other" })).toBe(true);
  });

  it("valid with city + state", () => {
    expect(isValidExtractedData({ city: "Orlando", state: "FL", source: "other" })).toBe(true);
  });

  it("invalid with nothing", () => {
    expect(isValidExtractedData({ source: "other" })).toBe(false);
  });
});
