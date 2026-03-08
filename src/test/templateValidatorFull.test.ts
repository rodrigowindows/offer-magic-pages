import { describe, it, expect } from "vitest";
import {
  validateTemplate,
  getTemplateScoreColor,
  getTemplateScoreLabel,
} from "@/utils/templateValidator";
import type { SavedTemplate } from "@/types/marketing.types";

const makeTemplate = (overrides: Partial<SavedTemplate>): SavedTemplate => ({
  id: "1",
  name: "Test",
  channel: "sms",
  body: "Hi {name}, cash offer {cash_offer} for {address}. Call {phone}.",
  is_default: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe("validateTemplate - SMS", () => {
  it("valid SMS with all required vars", () => {
    const result = validateTemplate(makeTemplate({ channel: "sms" }));
    expect(result.isValid).toBe(true);
  });

  it("invalid SMS missing {cash_offer}", () => {
    const result = validateTemplate(makeTemplate({
      channel: "sms",
      body: "Hi {name}, call {phone}.",
    }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.type === "error")).toBe(true);
  });

  it("warns for SMS > 160 chars", () => {
    const result = validateTemplate(makeTemplate({
      channel: "sms",
      body: "A".repeat(200) + " {cash_offer} {phone}",
    }));
    expect(result.issues.some(i => i.type === "warning" && i.message.includes("longo"))).toBe(true);
  });
});

describe("validateTemplate - Email", () => {
  it("valid email with subject", () => {
    const result = validateTemplate(makeTemplate({
      channel: "email",
      subject: "Cash Offer",
      body: "<!DOCTYPE html><html>{name} {cash_offer} {phone}</html>",
    }));
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it("invalid email without subject", () => {
    const result = validateTemplate(makeTemplate({
      channel: "email",
      subject: "",
      body: "{name} {cash_offer} {phone}",
    }));
    expect(result.isValid).toBe(false);
  });

  it("warns for long subject", () => {
    const result = validateTemplate(makeTemplate({
      channel: "email",
      subject: "A".repeat(70),
      body: "{name} {cash_offer} {phone}",
    }));
    expect(result.issues.some(i => i.message.includes("Assunto muito longo"))).toBe(true);
  });
});

describe("validateTemplate - Call", () => {
  it("warns for long voicemail", () => {
    const longBody = Array(60).fill("word").join(" ") + " {name} {cash_offer} {phone}";
    const result = validateTemplate(makeTemplate({ channel: "call", body: longBody }));
    expect(result.issues.some(i => i.message.includes("longa"))).toBe(true);
  });

  it("suggests greeting", () => {
    const result = validateTemplate(makeTemplate({
      channel: "call",
      body: "{name} {cash_offer} {phone}",
    }));
    expect(result.suggestions.some(s => s.includes("saudação"))).toBe(true);
  });
});

describe("validateTemplate - general", () => {
  it("detects double spaces", () => {
    const result = validateTemplate(makeTemplate({
      body: "Hi  {name} {cash_offer} {phone}",
    }));
    expect(result.issues.some(i => i.message.includes("espaços duplos"))).toBe(true);
  });

  it("score clamped to 0-100", () => {
    // Missing everything
    const result = validateTemplate(makeTemplate({ channel: "email", subject: "", body: "" }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("getTemplateScoreColor", () => {
  it("green for >= 80", () => {
    expect(getTemplateScoreColor(80)).toContain("green");
  });

  it("yellow for 60-79", () => {
    expect(getTemplateScoreColor(65)).toContain("yellow");
  });

  it("red for < 60", () => {
    expect(getTemplateScoreColor(40)).toContain("red");
  });
});

describe("getTemplateScoreLabel", () => {
  it("returns correct labels", () => {
    expect(getTemplateScoreLabel(90)).toBe("Excelente");
    expect(getTemplateScoreLabel(70)).toBe("Bom");
    expect(getTemplateScoreLabel(50)).toBe("Regular");
    expect(getTemplateScoreLabel(20)).toBe("Precisa Melhorar");
  });
});
