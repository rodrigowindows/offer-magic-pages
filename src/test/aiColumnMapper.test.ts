import { describe, it, expect } from "vitest";
import { fallbackToStringMatching } from "@/utils/aiColumnMapper";

describe("fallbackToStringMatching", () => {
  it("maps address-related columns", () => {
    const result = fallbackToStringMatching(["Input Property Address", "Property City", "Situs State", "Zip Code"]);
    expect(result.find(m => m.csvColumn === "Input Property Address")?.suggestedField).toBe("address");
    expect(result.find(m => m.csvColumn === "Property City")?.suggestedField).toBe("city");
    expect(result.find(m => m.csvColumn === "Zip Code")?.suggestedField).toBe("zip_code");
  });

  it("maps owner-related columns", () => {
    const result = fallbackToStringMatching(["Owner Name", "Owner Phone", "Mailing Address"]);
    expect(result.find(m => m.csvColumn === "Owner Name")?.suggestedField).toBe("owner_name");
    expect(result.find(m => m.csvColumn === "Owner Phone")?.suggestedField).toBe("owner_phone");
    expect(result.find(m => m.csvColumn === "Mailing Address")?.suggestedField).toBe("owner_address");
  });

  it("maps property details", () => {
    const result = fallbackToStringMatching(["Bedrooms", "Bathrooms", "Square Feet", "Year Built", "Lot Size"]);
    expect(result.find(m => m.csvColumn === "Bedrooms")?.suggestedField).toBe("bedrooms");
    expect(result.find(m => m.csvColumn === "Bathrooms")?.suggestedField).toBe("bathrooms");
    expect(result.find(m => m.csvColumn === "Square Feet")?.suggestedField).toBe("square_feet");
    expect(result.find(m => m.csvColumn === "Year Built")?.suggestedField).toBe("year_built");
    expect(result.find(m => m.csvColumn === "Lot Size")?.suggestedField).toBe("lot_size");
  });

  it("maps value-related columns", () => {
    const result = fallbackToStringMatching(["Just Value", "Cash Offer", "Market Value"]);
    expect(result.find(m => m.csvColumn === "Just Value")?.suggestedField).toBe("estimated_value");
    expect(result.find(m => m.csvColumn === "Cash Offer")?.suggestedField).toBe("cash_offer_amount");
  });

  it("skips unknown columns", () => {
    const result = fallbackToStringMatching(["Random Column XYZ"]);
    expect(result[0].suggestedField).toBe("skip");
    expect(result[0].confidence).toBe("low");
  });

  it("maps county and neighborhood", () => {
    const result = fallbackToStringMatching(["County", "Subdivision"]);
    expect(result.find(m => m.csvColumn === "County")?.suggestedField).toBe("county");
    expect(result.find(m => m.csvColumn === "Subdivision")?.suggestedField).toBe("neighborhood");
  });

  it("maps account/folio to origem", () => {
    const result = fallbackToStringMatching(["Account Number", "Folio"]);
    expect(result.find(m => m.csvColumn === "Account Number")?.suggestedField).toBe("origem");
    expect(result.find(m => m.csvColumn === "Folio")?.suggestedField).toBe("origem");
  });

  it("assigns confidence correctly", () => {
    const result = fallbackToStringMatching(["Bedrooms", "Unknown"]);
    expect(result.find(m => m.csvColumn === "Bedrooms")?.confidence).toBe("medium");
    expect(result.find(m => m.csvColumn === "Unknown")?.confidence).toBe("low");
  });
});
