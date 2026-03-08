import { describe, it, expect } from "vitest";
import { validateRecipientInfo, validateBatchCSV, cleanPhoneNumber } from "@/utils/validators";

describe("validateRecipientInfo", () => {
  const validData = {
    name: "John Doe",
    phone_number: "7861234567",
    email: "john@example.com",
    address: "123 Main St, Miami FL",
  };

  it("passes with valid data", () => {
    const result = validateRecipientInfo(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with invalid email", () => {
    const result = validateRecipientInfo({ ...validData, email: "not-email" });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === "email")).toBe(true);
  });

  it("fails with short phone", () => {
    const result = validateRecipientInfo({ ...validData, phone_number: "123" });
    expect(result.isValid).toBe(false);
  });

  it("fails with empty name", () => {
    const result = validateRecipientInfo({ ...validData, name: "" });
    expect(result.isValid).toBe(false);
  });

  it("fails with short address", () => {
    const result = validateRecipientInfo({ ...validData, address: "abc" });
    expect(result.isValid).toBe(false);
  });
});

describe("validateBatchCSV", () => {
  it("passes with all required headers", () => {
    const result = validateBatchCSV(["name", "phone_number", "email", "address"]);
    expect(result.isValid).toBe(true);
  });

  it("fails with missing headers", () => {
    const result = validateBatchCSV(["name", "email"]);
    expect(result.isValid).toBe(false);
    expect(result.errors[0].message).toContain("phone_number");
    expect(result.errors[0].message).toContain("address");
  });

  it("passes with extra headers", () => {
    const result = validateBatchCSV(["name", "phone_number", "email", "address", "extra_col"]);
    expect(result.isValid).toBe(true);
  });
});

describe("cleanPhoneNumber", () => {
  it("removes all non-digit characters", () => {
    expect(cleanPhoneNumber("(786) 882-8251")).toBe("7868828251");
    expect(cleanPhoneNumber("+1-786-882-8251")).toBe("17868828251");
    expect(cleanPhoneNumber("786.882.8251")).toBe("7868828251");
  });
});
