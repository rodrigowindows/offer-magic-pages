import { describe, it, expect } from "vitest";
import {
  validateRecipientInfo,
  validateBatchCSV,
  cleanPhoneNumber,
  phoneSchema,
  emailSchema,
  nameSchema,
  addressSchema,
} from "@/utils/validators";

describe("phoneSchema", () => {
  it("accepts 10-digit phone", () => {
    expect(phoneSchema.safeParse("7868828251").success).toBe(true);
  });

  it("rejects non-10-digit", () => {
    expect(phoneSchema.safeParse("123").success).toBe(false);
    expect(phoneSchema.safeParse("12345678901").success).toBe(false);
  });

  it("rejects letters", () => {
    expect(phoneSchema.safeParse("abcdefghij").success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("test@example.com").success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-email").success).toBe(false);
    expect(emailSchema.safeParse("@domain.com").success).toBe(false);
  });
});

describe("nameSchema", () => {
  it("accepts valid name", () => {
    expect(nameSchema.safeParse("John Doe").success).toBe(true);
  });

  it("rejects too short", () => {
    expect(nameSchema.safeParse("J").success).toBe(false);
  });

  it("rejects too long", () => {
    expect(nameSchema.safeParse("A".repeat(101)).success).toBe(false);
  });
});

describe("addressSchema", () => {
  it("accepts valid address", () => {
    expect(addressSchema.safeParse("123 Main Street").success).toBe(true);
  });

  it("rejects too short", () => {
    expect(addressSchema.safeParse("Hi").success).toBe(false);
  });
});

describe("validateRecipientInfo", () => {
  const validData = {
    name: "John Doe",
    phone_number: "7868828251",
    email: "john@example.com",
    address: "123 Main Street, Miami FL",
  };

  it("passes with valid data", () => {
    const result = validateRecipientInfo(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails with invalid phone", () => {
    const result = validateRecipientInfo({ ...validData, phone_number: "123" });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === "phone_number")).toBe(true);
  });

  it("fails with invalid email", () => {
    const result = validateRecipientInfo({ ...validData, email: "bad" });
    expect(result.isValid).toBe(false);
  });

  it("fails with missing name", () => {
    const result = validateRecipientInfo({ ...validData, name: "" });
    expect(result.isValid).toBe(false);
  });

  it("fails with short address", () => {
    const result = validateRecipientInfo({ ...validData, address: "Hi" });
    expect(result.isValid).toBe(false);
  });

  it("accepts optional seller_name", () => {
    const result = validateRecipientInfo({ ...validData, seller_name: "Agent Smith" });
    expect(result.isValid).toBe(true);
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
    const result = validateBatchCSV(["name", "phone_number", "email", "address", "extra"]);
    expect(result.isValid).toBe(true);
  });
});

describe("cleanPhoneNumber", () => {
  it("strips non-digits", () => {
    expect(cleanPhoneNumber("(786) 882-8251")).toBe("7868828251");
  });

  it("handles already clean number", () => {
    expect(cleanPhoneNumber("7868828251")).toBe("7868828251");
  });

  it("handles empty string", () => {
    expect(cleanPhoneNumber("")).toBe("");
  });
});
