import { supabase } from "@/integrations/supabase/client";

/**
 * Airbnb Eligibility Checker
 *
 * Uses multiple APIs to check if a property can be used for Airbnb:
 * - AirDNA API (requires subscription)
 * - Mashvisor API (alternative)
 * - Or manual regex rules based on city/county regulations
 *
 * For FREE checking, we use regex rules + Supabase storage for known cities.
 */

interface AirbnbCheckResult {
  eligible: boolean;
  regulations: {
    city: string;
    state: string;
    allowsShortTermRentals: boolean;
    requiresLicense: boolean;
    minNights?: number;
    maxNightsPerYear?: number;
    notes: string;
  };
  lastChecked: string;
}

// Known Florida cities with STR (Short-Term Rental) regulations
const FLORIDA_STR_REGULATIONS: Record<string, any> = {
  "Orlando": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Requires Tourist Development Tax registration. Most areas allow STR with proper licensing.",
  },
  "Kissimmee": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Popular vacation rental area. Requires business tax receipt and tourist development tax.",
  },
  "Miami": {
    allowsShortTermRentals: false,
    requiresLicense: false,
    minNights: 180,
    maxNightsPerYear: null,
    notes: "Miami Beach and many neighborhoods prohibit STR under 6 months. Check specific zoning.",
  },
  "Tampa": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Allowed with proper licensing. Some HOAs may restrict.",
  },
  "Fort Lauderdale": {
    allowsShortTermRentals: false,
    requiresLicense: false,
    minNights: 180,
    maxNightsPerYear: null,
    notes: "Generally prohibits STR under 6 months in residential zones.",
  },
  "Jacksonville": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Allowed with business tax receipt. Beach areas may have additional rules.",
  },
  "Davenport": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Very popular vacation rental area near Disney. Requires licensing.",
  },
  "Clermont": {
    allowsShortTermRentals: true,
    requiresLicense: true,
    minNights: 1,
    maxNightsPerYear: null,
    notes: "Allows STR with proper permits in most zones.",
  },
};

/**
 * Check Airbnb eligibility using local rules
 */
export const checkAirbnbEligibility = async (
  address: string,
  city: string,
  state: string,
  zipCode?: string
): Promise<AirbnbCheckResult> => {
  // Normalize city name
  const normalizedCity = city.trim();

  // Check if we have local rules for this city
  const cityRules = FLORIDA_STR_REGULATIONS[normalizedCity];

  if (cityRules) {
    return {
      eligible: cityRules.allowsShortTermRentals,
      regulations: {
        city: normalizedCity,
        state: state,
        allowsShortTermRentals: cityRules.allowsShortTermRentals,
        requiresLicense: cityRules.requiresLicense,
        minNights: cityRules.minNights,
        maxNightsPerYear: cityRules.maxNightsPerYear,
        notes: cityRules.notes,
      },
      lastChecked: new Date().toISOString(),
    };
  }

  // Default: assume eligible but requires verification
  return {
    eligible: true,
    regulations: {
      city: normalizedCity,
      state: state,
      allowsShortTermRentals: true,
      requiresLicense: true,
      minNights: 1,
      notes: "City regulations not found in database. Manual verification recommended. Most Florida cities allow STR with proper licensing.",
    },
    lastChecked: new Date().toISOString(),
  };
};

/**
 * Check Airbnb for a property and save to database
 */
export const checkAndSaveAirbnbEligibility = async (propertyId: string) => {
  try {
    // Get property details
    const { data: property, error: fetchError } = await supabase
      .from("properties")
      .select("address, city, state, zip_code")
      .eq("id", propertyId)
      .single();

    if (fetchError || !property) {
      throw new Error("Property not found");
    }

    // Check eligibility
    const result = await checkAirbnbEligibility(
      property.address,
      property.city,
      property.state,
      property.zip_code
    );

    // Save to database
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        airbnb_eligible: result.eligible,
        airbnb_check_date: new Date().toISOString(),
        airbnb_regulations: result.regulations,
        airbnb_notes: result.regulations.notes,
      } as any)
      .eq("id", propertyId);

    if (updateError) throw updateError;

    return result;
  } catch (error) {
    console.error("Error checking Airbnb eligibility:", error);
    throw error;
  }
};

/**
 * Batch check Airbnb for multiple properties
 */
export const batchCheckAirbnb = async (propertyIds: string[]) => {
  const results = [];

  for (const propertyId of propertyIds) {
    try {
      const result = await checkAndSaveAirbnbEligibility(propertyId);
      results.push({ propertyId, success: true, result });
    } catch (error) {
      results.push({ propertyId, success: false, error });
    }
  }

  return results;
};

/**
 * Get Airbnb market data (requires AirDNA API key)
 * This is a placeholder - you'd need to implement actual API calls
 */
export const getAirbnbMarketData = async (
  city: string,
  state: string
): Promise<any> => {
  // TODO: Implement AirDNA API integration
  // Requires API key from https://www.airdna.co/

  console.warn("AirDNA API not implemented. Using local rules only.");

  return {
    message: "Upgrade to AirDNA API for detailed market data",
    averageRevenue: null,
    occupancyRate: null,
    competitorCount: null,
  };
};
