/**
 * Extracts comps quality metadata from saved comps data
 * for use in property alerts validation.
 */

interface SavedCompInput {
  comp_data?: {
    sale_price?: number;
    square_feet?: number;
    address?: string;
    zip_code?: string;
    property_type?: string;
  } | null;
}

export interface CompsQualityMetadata {
  comps_count: number;
  comps_zip_codes: string[];
  comps_min_sqft: number | null;
  comps_avg_sqft: number | null;
  comps_property_types: string[];
}

/**
 * Extract ZIP code from a comp address string.
 * Looks for 5-digit ZIP code patterns.
 */
function extractZipFromAddress(address: string): string | null {
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : null;
}

/**
 * Extracts quality metadata from an array of saved comps.
 * This data feeds into propertyAlerts validation to detect:
 * - Comps from wrong ZIP codes
 * - Land properties with house comps
 * - Comps with corrupted sqft data
 */
export function extractCompsQualityMetadata(comps: SavedCompInput[]): CompsQualityMetadata {
  const zipCodes: string[] = [];
  const sqftValues: number[] = [];
  const propertyTypes: string[] = [];

  for (const comp of comps) {
    const data = comp.comp_data;
    if (!data) continue;

    // Extract ZIP from comp data (prefer explicit zip_code, fallback to address parsing)
    if (data.zip_code) {
      zipCodes.push(data.zip_code);
    } else if (data.address) {
      const zip = extractZipFromAddress(data.address);
      if (zip) zipCodes.push(zip);
    }

    // Track sqft values
    if (data.square_feet != null && data.square_feet >= 0) {
      sqftValues.push(data.square_feet);
    }

    // Track property types
    if (data.property_type) {
      propertyTypes.push(data.property_type);
    }
  }

  return {
    comps_count: comps.length,
    comps_zip_codes: zipCodes,
    comps_min_sqft: sqftValues.length > 0 ? Math.min(...sqftValues) : null,
    comps_avg_sqft: sqftValues.length > 0 ? Math.round(sqftValues.reduce((s, v) => s + v, 0) / sqftValues.length) : null,
    comps_property_types: propertyTypes,
  };
}
