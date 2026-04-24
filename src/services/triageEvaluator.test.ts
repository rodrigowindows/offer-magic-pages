import { describe, it, expect } from "vitest";
import { evaluateTriage, enforceFloodZoneWarningGuard, HIGH_RISK_FLOOD_ZONES } from "./triageEvaluator";
import type { QueueProperty } from "@/components/review/types";

const baseProp = {
  id: "1",
  address: "123 Main St",
  city: "Miami",
  state: "FL",
  zip_code: "33101",
  owner_name: "John Doe",
  property_image_url: "https://example.com/img.jpg",
  estimated_value: 200000,
  cash_offer_amount: 100000,
  property_type: "single family",
  year_built: 1980,
  square_feet: 1200,
  bedrooms: 3,
  bathrooms: 2,
  tags: [],
  flood_zone: null,
  last_sale_date: null,
} as unknown as QueueProperty;

describe("enforceFloodZoneWarningGuard", () => {
  it("downgrades flood-zone block → warn", () => {
    const result = enforceFloodZoneWarningGuard({
      key: "flood-zone",
      label: "Flood Zone (FEMA)",
      severity: "block",
      rejectionCode: "flood-zone",
    });
    expect(result.severity).toBe("warn");
    expect(result.detail).toContain("[guard]");
  });

  it("downgrades by rejectionCode match even if key differs", () => {
    const result = enforceFloodZoneWarningGuard({
      key: "some-other-key",
      label: "Custom",
      severity: "block",
      rejectionCode: "flood-zone",
    });
    expect(result.severity).toBe("warn");
  });

  it("downgrades alert-flood-* keys", () => {
    const result = enforceFloodZoneWarningGuard({
      key: "alert-flood-risk",
      label: "Property in flood area",
      severity: "block",
    });
    expect(result.severity).toBe("warn");
  });

  it("downgrades when label mentions flood", () => {
    const result = enforceFloodZoneWarningGuard({
      key: "x",
      label: "High Flood Risk Detected",
      severity: "block",
    });
    expect(result.severity).toBe("warn");
  });

  it("does NOT modify non-flood blocks", () => {
    const result = enforceFloodZoneWarningGuard({
      key: "llc-owned",
      label: "LLC",
      severity: "block",
    });
    expect(result.severity).toBe("block");
  });

  it("does NOT modify flood checks already at warn or pass", () => {
    expect(enforceFloodZoneWarningGuard({ key: "flood-zone", label: "x", severity: "warn" }).severity).toBe("warn");
    expect(enforceFloodZoneWarningGuard({ key: "flood-zone", label: "x", severity: "pass" }).severity).toBe("pass");
  });
});

describe("evaluateTriage flood-zone guard integration", () => {
  it.each(HIGH_RISK_FLOOD_ZONES)("zone %s never produces a block severity", (zone) => {
    const prop = { ...baseProp, flood_zone: zone } as QueueProperty;
    const checks = evaluateTriage(prop);
    const floodCheck = checks.find(c => c.key === "flood-zone");
    expect(floodCheck).toBeDefined();
    expect(floodCheck!.severity).not.toBe("block");
    expect(floodCheck!.severity).toBe("warn");
  });

  it("safe zone produces pass", () => {
    const prop = { ...baseProp, flood_zone: "X" } as QueueProperty;
    const floodCheck = evaluateTriage(prop).find(c => c.key === "flood-zone");
    expect(floodCheck!.severity).toBe("pass");
  });

  it("no flood check ever returns block, regardless of property combo", () => {
    const prop = {
      ...baseProp,
      flood_zone: "AE",
      owner_name: "ACME LLC",
      property_type: "condo",
      year_built: new Date().getFullYear() - 2,
    } as QueueProperty;
    const checks = evaluateTriage(prop);
    const floodChecks = checks.filter(c =>
      c.key === "flood-zone" || c.rejectionCode === "flood-zone" || /flood/i.test(c.label)
    );
    floodChecks.forEach(c => expect(c.severity).not.toBe("block"));
    // Other blocking rules still fire
    expect(checks.some(c => c.key === "llc-owned" && c.severity === "block")).toBe(true);
  });
});
