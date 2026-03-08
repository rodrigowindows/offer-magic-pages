import { describe, it, expect } from "vitest";
import {
  validateTemplate,
  getTemplateScoreColor,
  getTemplateScoreLabel,
} from "@/utils/templateValidator";
import type { SavedTemplate } from "@/types/marketing.types";

const makeTemplate = (overrides: Partial<SavedTemplate>): SavedTemplate => ({
  id: "test-1",
  name: "Test Template",
  channel: "sms" as const,
  body: "Hi {name}, cash offer {cash_offer} for your property at {address}. Call {phone}",
  subject: "",
  is_default: false,
  version: 1,
  edited_manually: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

describe("validateTemplate", () => {
  it("passes for valid SMS template", () => {
    const result = validateTemplate(makeTemplate({}));
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("fails when missing required SMS variables", () => {
    const result = validateTemplate(makeTemplate({ body: "Hello there!" }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.type === "error")).toBe(true);
  });

  it("warns for long SMS (>160 chars)", () => {
    const longBody = "{cash_offer} {phone} " + "x".repeat(160);
    const result = validateTemplate(makeTemplate({ body: longBody }));
    expect(result.issues.some(i => i.type === "warning" && i.message.includes("longo"))).toBe(true);
  });

  it("validates email requires subject", () => {
    const result = validateTemplate(makeTemplate({
      channel: "email" as const,
      body: "Hi {name}, offer {cash_offer}. Call {phone}",
      subject: "",
    }));
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.field === "subject")).toBe(true);
  });

  it("warns for long email subject", () => {
    const result = validateTemplate(makeTemplate({
      channel: "email" as const,
      body: "<!DOCTYPE html><html>{name} {cash_offer} {phone} Call now!</html>",
      subject: "A".repeat(65),
    }));
    expect(result.issues.some(i => i.field === "subject" && i.type === "warning")).toBe(true);
  });

  it("warns for long call scripts", () => {
    const words = Array(55).fill("word").join(" ");
    const result = validateTemplate(makeTemplate({
      channel: "call" as const,
      body: `Olá {name}, ${words} {cash_offer} {phone}`,
    }));
    expect(result.issues.some(i => i.type === "warning" && i.message.includes("palavras"))).toBe(true);
  });

  it("suggests greeting for call templates", () => {
    const result = validateTemplate(makeTemplate({
      channel: "call" as const,
      body: "{name}, we have {cash_offer} for you. {phone}",
    }));
    expect(result.suggestions.some(s => s.includes("saudação"))).toBe(true);
  });

  it("detects double spaces", () => {
    const result = validateTemplate(makeTemplate({
      body: "{cash_offer}  {phone} hello  there",
    }));
    expect(result.issues.some(i => i.type === "info")).toBe(true);
  });

  it("score stays between 0-100", () => {
    // Template with many issues
    const result = validateTemplate(makeTemplate({
      channel: "email" as const,
      body: "",
      subject: "",
    }));
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("getTemplateScoreColor", () => {
  it("returns green for >= 80", () => {
    expect(getTemplateScoreColor(80)).toContain("green");
    expect(getTemplateScoreColor(100)).toContain("green");
  });

  it("returns yellow for 60-79", () => {
    expect(getTemplateScoreColor(60)).toContain("yellow");
  });

  it("returns red for < 60", () => {
    expect(getTemplateScoreColor(50)).toContain("red");
  });
});

describe("getTemplateScoreLabel", () => {
  it("returns correct labels", () => {
    expect(getTemplateScoreLabel(90)).toBe("Excelente");
    expect(getTemplateScoreLabel(65)).toBe("Bom");
    expect(getTemplateScoreLabel(45)).toBe("Regular");
    expect(getTemplateScoreLabel(20)).toBe("Precisa Melhorar");
  });
});
