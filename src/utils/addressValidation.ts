// src/utils/addressValidation.ts

export const validateAddressForAPI = (
  address: string,
  city: string,
  state: string,
  zipCode?: string
): {
  isValid: boolean;
  normalized: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  warnings: string[];
} => {
  const warnings: string[] = [];

  // Normalize address
  let normalizedAddress = address.trim();

  // Check for street number
  if (!/^\d+/.test(normalizedAddress)) {
    warnings.push('Address missing street number - may cause API lookup failures');
  }

  // Extract zipCode
  let extractedZip = zipCode;
  if (!extractedZip) {
    const zipMatch = normalizedAddress.match(/\b\d{5}(?:-\d{4})?\b/);
    extractedZip = zipMatch ? zipMatch[0] : undefined;
  }

  if (!extractedZip) {
    warnings.push('ZIP code not found - required for some APIs');
  }

  return {
    isValid: !!normalizedAddress && !!city && !!state,
    normalized: {
      address: normalizedAddress,
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zipCode: extractedZip || ''
    },
    warnings
  };
};
