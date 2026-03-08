import { describe, it, expect } from "vitest";
import { getVisualCategory, parseTags, hasRealValue, getPreDenialSuggestions, countByVisual } from "@/components/review/helpers";

describe("getVisualCategory", () => {
  it("extracts category from evaluation string", () => {
    expect(getVisualCategory("Visual:HOT some text")).toBe("HOT");
    expect(getVisualCategory("Visual:COLD")).toBe("COLD");
    expect(getVisualCategory("Visual:WARM extra")).toBe("WARM");
    expect(getVisualCategory("Visual:LAND")).toBe("LAND");
  });

  it("returns null for missing or invalid evaluation", () => {
    expect(getVisualCategory(null)).toBeNull();
    expect(getVisualCategory("")).toBeNull();
    expect(getVisualCategory("no visual here")).toBeNull();
  });
});

describe("parseTags", () => {
  it("returns array as-is", () => {
    expect(parseTags(["a", "b"])).toEqual(["a", "b"]);
  });

  it("parses JSON string", () => {
    expect(parseTags("['tag1','tag2']")).toEqual(["tag1", "tag2"]);
  });

  it("returns empty array for null", () => {
    expect(parseTags(null)).toEqual([]);
  });

  it("returns empty array for non-JSON string", () => {
    expect(parseTags("just text")).toEqual([]);
  });
});

describe("hasRealValue", () => {
  it("returns false for empty/null/placeholder values", () => {
    expect(hasRealValue(null)).toBe(false);
    expect(hasRealValue("")).toBe(false);
    expect(hasRealValue("—")).toBe(false);
    expect(hasRealValue("-")).toBe(false);
    expect(hasRealValue("$0")).toBe(false);
    expect(hasRealValue("$0.00")).toBe(false);
    expect(hasRealValue("0")).toBe(false);
  });

  it("returns true for real values", () => {
    expect(hasRealValue("$150,000")).toBe(true);
    expect(hasRealValue("3")).toBe(true);
    expect(hasRealValue("Miami")).toBe(true);
  });
});

describe("getPreDenialSuggestions", () => {
  const baseProp = {
    id: "1",
    address: "123 Main St",
    city: "Miami",
    state: "FL",
    zip_code: "33101",
    estimated_value: 200000,
    cash_offer_amount: 100000,
    property_type: "single family",
    owner_name: "John Doe",
    tags: [] as string[],
    year_built: 1980,
    evaluation: null,
  } as any;

  it("detects address without number", () => {
    const prop = { ...baseProp, address: "Main Street" };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "no-address-number")).toBe(true);
  });

  it("detects new construction", () => {
    const prop = { ...baseProp, year_built: new Date().getFullYear() - 5 };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "new-construction")).toBe(true);
  });

  it("detects multi-family", () => {
    const prop = { ...baseProp, property_type: "multi-family" };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "multi-family")).toBe(true);
  });

  it("detects LLC owner", () => {
    const prop = { ...baseProp, owner_name: "ACME HOLDINGS LLC" };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "llc-owned")).toBe(true);
  });

  it("detects no wholesale margin", () => {
    const prop = { ...baseProp, cash_offer_amount: 180000, estimated_value: 200000 };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "no-wholesale-margin")).toBe(true);
  });

  it("detects condominium", () => {
    const prop = { ...baseProp, address: "123 Main St APT 5" };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "condominium")).toBe(true);
  });

  it("detects land", () => {
    const prop = { ...baseProp, property_type: "vacant land" };
    const suggestions = getPreDenialSuggestions(prop);
    expect(suggestions.some(s => s.reason === "land")).toBe(true);
  });

  it("returns no suggestions for clean property", () => {
    const suggestions = getPreDenialSuggestions(baseProp);
    expect(suggestions.length).toBe(0);
  });
});

describe("countByVisual", () => {
  it("counts categories correctly", () => {
    const props = [
      { evaluation: "Visual:HOT" },
      { evaluation: "Visual:HOT" },
      { evaluation: "Visual:COLD" },
      { evaluation: null },
    ] as any[];
    const counts = countByVisual(props);
    expect(counts).toEqual({ HOT: 2, COLD: 1 });
  });

  it("returns empty for no properties", () => {
    expect(countByVisual([])).toEqual({});
  });
});
