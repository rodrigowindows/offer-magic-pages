/**
 * Auto-tagging utility for Orlando properties
 * Tags properties based on score and characteristics
 */

export interface PropertyCharacteristics {
  score: number;
  deed_certified: boolean;
  vacant: boolean;
  has_pool: boolean;
  owner_out_of_state: boolean;
  is_estate: boolean;
  equity_percentage: number;
}

/**
 * Auto-tag property based on score and characteristics
 */
export const autoTagProperty = (characteristics: PropertyCharacteristics): string[] => {
  const tags: string[] = [];

  // Tier based on score
  if (characteristics.score >= 85) {
    tags.push("tier-1", "hot-lead");
  } else if (characteristics.score >= 70) {
    tags.push("tier-2");
  } else if (characteristics.score >= 50) {
    tags.push("tier-3");
  }

  // Property characteristics
  if (characteristics.deed_certified) {
    tags.push("deed-certified");
  }

  if (characteristics.vacant) {
    tags.push("vacant");
  }

  if (characteristics.has_pool) {
    tags.push("pool-distress");
  }

  if (characteristics.equity_percentage > 50) {
    tags.push("high-equity");
  }

  if (characteristics.owner_out_of_state) {
    tags.push("out-of-state");
  }

  if (characteristics.is_estate) {
    tags.push("estate-trust");
  }

  return tags;
};

/**
 * Get tier from score
 */
export const getTierFromScore = (score: number): string => {
  if (score >= 85) return "tier-1";
  if (score >= 70) return "tier-2";
  if (score >= 50) return "tier-3";
  return "low-priority";
};

/**
 * Suggest tags based on property data
 */
export const suggestTags = (property: {
  score?: number;
  estimated_value?: number;
  cash_offer_amount?: number;
  owner_address?: string;
  city?: string;
  [key: string]: any;
}): string[] => {
  const suggestions: string[] = [];

  // Offer percentage
  if (property.estimated_value && property.cash_offer_amount) {
    const offerPercentage = (property.cash_offer_amount / property.estimated_value) * 100;
    if (offerPercentage < 70) {
      suggestions.push("low-offer");
    }
  }

  // Out of state (different city in owner address)
  if (property.owner_address && property.city) {
    const ownerCity = property.owner_address.toLowerCase();
    const propCity = property.city.toLowerCase();
    if (!ownerCity.includes(propCity)) {
      suggestions.push("out-of-state");
    }
  }

  return suggestions;
};

/**
 * All available tags with descriptions
 */
export const AVAILABLE_TAGS = [
  { value: "tier-1", label: "Tier 1", description: "Top priority (score ≥85)", color: "red" },
  { value: "tier-2", label: "Tier 2", description: "High priority (score 70-84)", color: "orange" },
  { value: "tier-3", label: "Tier 3", description: "Medium priority (score 50-69)", color: "yellow" },
  { value: "hot-lead", label: "Hot Lead", description: "Immediate action required", color: "red" },
  { value: "deed-certified", label: "Deed Certified", description: "Title verified", color: "green" },
  { value: "vacant", label: "Vacant", description: "Property is vacant", color: "blue" },
  { value: "pool-distress", label: "Pool Distress", description: "Pool needs repair", color: "cyan" },
  { value: "high-equity", label: "High Equity", description: "Equity >50%", color: "green" },
  { value: "out-of-state", label: "Out of State", description: "Owner not local", color: "purple" },
  { value: "estate-trust", label: "Estate/Trust", description: "Estate or trust owned", color: "indigo" },
  { value: "follow-up", label: "Follow Up", description: "Needs follow-up contact", color: "yellow" },
  { value: "contacted", label: "Contacted", description: "Owner was contacted", color: "blue" },
  { value: "interested", label: "Interested", description: "Owner showed interest", color: "green" },
  { value: "not-interested", label: "Not Interested", description: "Owner not interested", color: "gray" },
  { value: "low-offer", label: "Low Offer", description: "Offer <70% of value", color: "orange" },
];

/**
 * Get tag label and color
 */
export const getTagInfo = (tagValue: string) => {
  return AVAILABLE_TAGS.find(t => t.value === tagValue) || {
    value: tagValue,
    label: tagValue,
    description: "",
    color: "gray",
  };
};
