import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScoresTable } from "./ScoresTable";
import type { QueueProperty } from "./types";

// Base mock property for testing
const baseProperty: QueueProperty = {
  id: "1",
  address: "123 Main St",
  city: "Miami",
  state: "FL",
  zip_code: "33101",
  neighborhood: null,
  owner_name: "John Doe",
  property_image_url: null,
  estimated_value: 200000,
  cash_offer_amount: 100000,
  approval_status: null,
  approved_by_name: null,
  approved_at: null,
  rejection_reason: null,
  rejection_notes: null,
  decision_photos: null,
  property_type: "single family",
  year_built: 1980,
  square_feet: 1200,
  bedrooms: 3,
  bathrooms: 2,
  lot_size: 0.25,
  owner_phone: null,
  lead_score: null,
  zillow_url: null,
  focar: null,
  evaluation: null,
  tags: null,
  owner_address: null,
  origem: null,
  ai_score: null,
  ai_reasoning: null,
  mao: null,
  total_tax_due: null,
  years_delinquent: null,
  taxable_value: null,
  arv: null,
  avg_price_per_sqft: null,
  dnc_flag: null,
  deceased: null,
  wholesale_value: null,
  wholesale_pct: null,
  renovation_value: null,
  renovation_pct: null,
  email1: null,
  email2: null,
  last_sale_price: null,
  last_sale_date: null,
  latitude: null,
  longitude: null,
  answer_flag: null,
  lead_status: null,
  flood_zone: null,
  flood_zone_checked_at: null,
};

describe("ScoresTable FEMA Badge", () => {
  describe("renders badge for high-risk zones", () => {
    const highRiskZones = ["AE", "VE", "A", "V", "AH", "AO"];

    highRiskZones.forEach((zone) => {
      it(`renders FEMA badge for zone ${zone}`, () => {
        const property = { ...baseProperty, flood_zone: zone };
        render(<ScoresTable property={property} />);
        expect(screen.getByText(/FLOOD RISK/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(`Zone ${zone}`))).toBeInTheDocument();
      });
    });

    it("renders badge for lowercase zone codes", () => {
      const property = { ...baseProperty, flood_zone: "ae" };
      render(<ScoresTable property={property} />);
      expect(screen.getByText(/FLOOD RISK/i)).toBeInTheDocument();
      expect(screen.getByText(/Zone AE/i)).toBeInTheDocument();
    });

    it("renders badge for mixed-case zone codes", () => {
      const property = { ...baseProperty, flood_zone: "aE" };
      render(<ScoresTable property={property} />);
      expect(screen.getByText(/FLOOD RISK/i)).toBeInTheDocument();
      expect(screen.getByText(/Zone AE/i)).toBeInTheDocument();
    });
  });

  describe("does NOT render badge for safe/minimal risk zones", () => {
    const safeZones = ["X", "B", "C", "D", "X1", "X2", "0.2 PCT"];

    safeZones.forEach((zone) => {
      it(`does not render FEMA badge for zone ${zone}`, () => {
        const property = { ...baseProperty, flood_zone: zone };
        render(<ScoresTable property={property} />);
        expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("does NOT render badge for invalid or missing data", () => {
    it("does not render badge when flood_zone is null", () => {
      const property = { ...baseProperty, flood_zone: null };
      render(<ScoresTable property={property} />);
      expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
    });

    it("does not render badge when flood_zone is undefined", () => {
      const property = { ...baseProperty, flood_zone: undefined };
      render(<ScoresTable property={property} />);
      expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
    });

    it("does not render badge when flood_zone is empty string", () => {
      const property = { ...baseProperty, flood_zone: "" };
      render(<ScoresTable property={property} />);
      expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
    });

    it("does not render badge for unknown zone codes", () => {
      const property = { ...baseProperty, flood_zone: "UNKNOWN" };
      render(<ScoresTable property={property} />);
      expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
    });

    it("does not render badge for numeric zone codes", () => {
      const property = { ...baseProperty, flood_zone: "1" };
      render(<ScoresTable property={property} />);
      expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
    });

    it("does not render badge for similar-looking but invalid codes", () => {
      const invalidCodes = ["AE1", "AEO", "VE1", "AH2", "AOO", "AHH"];
      invalidCodes.forEach((zone) => {
        const property = { ...baseProperty, flood_zone: zone };
        const { unmount } = render(<ScoresTable property={property} />);
        expect(screen.queryByText(/FLOOD RISK/i)).not.toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("FEMA high-risk zone list matches spec", () => {
    it("only recognizes AE, VE, A, V, AH, AO as high-risk", () => {
      const expectedHighRisk = ["AE", "VE", "A", "V", "AH", "AO"];

      expectedHighRisk.forEach((zone) => {
        const property = { ...baseProperty, flood_zone: zone };
        const { unmount } = render(<ScoresTable property={property} />);
        expect(screen.getByText(/FLOOD RISK/i)).toBeInTheDocument();
        unmount();
      });
    });
  });
});
