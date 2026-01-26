export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  estimated_value?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  valuation_method?: string;
  valuation_confidence?: number;
  created_at?: string;
  [key: string]: any;
}

export const validatePropertyData = (property: Property): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} => {
  const issues: string[] = [];
  const warnings: string[] = [];

  // VALIDAÇÕES CRÍTICAS
  if (!property.address) {
    issues.push('❌ Missing address');
  }

  if (!property.estimated_value || property.estimated_value <= 0) {
    issues.push('❌ Missing or invalid estimated_value');
  }

  if (property.estimated_value === 100000 && !property.valuation_method) {
    issues.push('❌ Using default $100K value (needs AVM calculation)');
  }

  if (!property.latitude || !property.longitude) {
    issues.push('❌ Missing coordinates (geocoding required)');
  }

  // VALIDAÇÕES DE QUALIDADE
  if (!property.beds || property.beds <= 0) {
    warnings.push('⚠️ Missing bedrooms');
  }

  if (!property.baths || property.baths <= 0) {
    warnings.push('⚠️ Missing bathrooms');
  }

  if (!property.sqft || property.sqft <= 0) {
    warnings.push('⚠️ Missing square footage');
  }

  if (property.valuation_confidence && property.valuation_confidence < 50) {
    warnings.push(`⚠️ Low confidence score: ${property.valuation_confidence}%`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings
  };
};

export const formatPropertyForReport = (property: Property) => {
  return {
    address: property.address || 'N/A',
    city: property.city || 'N/A',
    state: property.state || 'FL',
    zipCode: property.zipCode || 'N/A',
    estimatedValue: property.estimated_value ? `$${property.estimated_value.toLocaleString()}` : 'N/A',
    valuationMethod: property.valuation_method || 'Unknown',
    valuationConfidence: property.valuation_confidence ? `${Math.round(property.valuation_confidence)}%` : 'N/A',
    beds: property.beds || 'N/A',
    baths: property.baths || 'N/A',
    sqft: property.sqft ? `${property.sqft.toLocaleString()}` : 'N/A'
  };
};
