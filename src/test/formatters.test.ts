import { describe, it, expect } from "vitest";
import { formatPhone } from "@/utils/formatters";

describe("formatPhone", () => {
  it("returns empty string for null/undefined", () => {
    expect(formatPhone(null)).toBe("");
    expect(formatPhone(undefined)).toBe("");
    expect(formatPhone("")).toBe("");
  });

  it("formats 10-digit US phone", () => {
    expect(formatPhone("7868828251")).toBe("(786) 882-8251");
  });

  it("formats 11-digit with country code", () => {
    expect(formatPhone("17868828251")).toBe("+1 (786) 882-8251");
  });

  it("handles scientific notation", () => {
    expect(formatPhone("4.08E+09")).toBe("(408) 000-0000");
  });

  it("returns original for non-standard lengths", () => {
    expect(formatPhone("12345")).toBe("12345");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatPhone("(786) 882-8251")).toBe("(786) 882-8251");
  });
});
