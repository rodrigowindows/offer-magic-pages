import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AB_TEST_CONFIG,
  getLocalEvents,
  clearVariantAssignment,
} from "@/utils/abTesting";

// Mock supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => ({ error: null }),
    }),
  },
}));

describe("AB_TEST_CONFIG", () => {
  it("has enabled flag", () => {
    expect(typeof AB_TEST_CONFIG.enabled).toBe("boolean");
  });

  it("has variants with required fields", () => {
    AB_TEST_CONFIG.variants.forEach((v) => {
      expect(v).toHaveProperty("variant");
      expect(v).toHaveProperty("weight");
      expect(v).toHaveProperty("active");
      expect(typeof v.weight).toBe("number");
    });
  });

  it("active variant weights sum to 100", () => {
    const total = AB_TEST_CONFIG.variants
      .filter((v) => v.active)
      .reduce((sum, v) => sum + v.weight, 0);
    expect(total).toBe(100);
  });
});

describe("getLocalEvents", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when no events stored", () => {
    expect(getLocalEvents()).toEqual([]);
  });

  it("returns stored events", () => {
    const events = [{ property_id: "1", variant: "ultra-simple", event: "page_view", session_id: "s1" }];
    localStorage.setItem("ab-events", JSON.stringify(events));
    expect(getLocalEvents()).toEqual(events);
  });

  it("handles corrupt data gracefully", () => {
    localStorage.setItem("ab-events", "not-json");
    expect(getLocalEvents()).toEqual([]);
  });
});

describe("clearVariantAssignment", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes variant from localStorage", () => {
    localStorage.setItem("ab-variant-prop1", "ultra-simple");
    clearVariantAssignment("prop1");
    expect(localStorage.getItem("ab-variant-prop1")).toBeNull();
  });
});
