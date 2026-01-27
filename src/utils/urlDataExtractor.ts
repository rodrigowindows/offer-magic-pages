/**
 * URL Data Extractor
 * Extracts property data from Zillow, Redfin, Trulia, Realtor.com URLs
 */

interface ExtractedData {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  source: 'zillow' | 'redfin' | 'trulia' | 'realtor' | 'other';
}

/**
 * Detect source from URL
 */
export function detectSource(url: string): ExtractedData['source'] {
  const lower = url.toLowerCase();
  if (lower.includes('zillow.com')) return 'zillow';
  if (lower.includes('redfin.com')) return 'redfin';
  if (lower.includes('trulia.com')) return 'trulia';
  if (lower.includes('realtor.com')) return 'realtor';
  return 'other';
}

/**
 * Extract address from URL path
 * Examples:
 * - zillow.com/homedetails/123-Main-St-Orlando-FL-32801/12345_zpid
 * - redfin.com/FL/Orlando/123-Main-St-32801/home/12345
 * - trulia.com/p/fl/orlando/123-main-st-orlando-fl-32801--12345
 */
export function extractAddressFromUrl(url: string): Partial<ExtractedData> {
  try {
    const source = detectSource(url);
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove /homedetails/, /p/, /home/, etc
    let cleanPath = pathname
      .replace(/\/(homedetails|p|home|property)\//gi, '/')
      .replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes

    // Extract parts
    const parts = cleanPath.split('/');

    // For Zillow: /123-Main-St-Orlando-FL-32801/12345_zpid
    // For Redfin: /FL/Orlando/123-Main-St-32801/home/12345
    // For Trulia: /fl/orlando/123-main-st-orlando-fl-32801--12345

    let addressPart = '';
    let state = '';
    let city = '';
    let zipCode = '';

    if (source === 'zillow') {
      // Format: 123-Main-St-Orlando-FL-32801
      addressPart = parts[0] || '';
      const match = addressPart.match(/(.*?)-(FL|TX|CA|NY|GA|NC|SC|TN|VA|AL|MS|LA|AR|OK|KS|MO|IA|IL|IN|MI|OH|WI|MN|ND|SD|NE|MT|WY|CO|NM|AZ|UT|NV|ID|WA|OR)-(\d{5})/i);
      if (match) {
        const streetPart = match[1].replace(/-/g, ' ');
        state = match[2].toUpperCase();
        zipCode = match[3];

        // Extract city (usually second to last part before state)
        const cityMatch = addressPart.match(/-([\w-]+)-(?:FL|TX|CA|NY|GA|NC|SC|TN|VA|AL|MS|LA|AR|OK|KS|MO|IA|IL|IN|MI|OH|WI|MN|ND|SD|NE|MT|WY|CO|NM|AZ|UT|NV|ID|WA|OR)-\d{5}/i);
        if (cityMatch) {
          city = cityMatch[1].replace(/-/g, ' ');
          // Remove city from street address
          const cityRegex = new RegExp(`-${city.replace(/\s/g, '-')}$`, 'i');
          addressPart = streetPart.replace(cityRegex, '').trim();
        } else {
          addressPart = streetPart;
        }
      }
    } else if (source === 'redfin') {
      // Format: /FL/Orlando/123-Main-St-32801/home/12345
      if (parts.length >= 3) {
        state = parts[0].toUpperCase();
        city = parts[1].replace(/-/g, ' ');
        addressPart = parts[2].replace(/-/g, ' ');

        // Extract zipCode from address part
        const zipMatch = addressPart.match(/\b(\d{5})\b/);
        if (zipMatch) {
          zipCode = zipMatch[1];
          addressPart = addressPart.replace(zipMatch[0], '').trim();
        }
      }
    } else if (source === 'trulia') {
      // Format: /fl/orlando/123-main-st-orlando-fl-32801--12345
      if (parts.length >= 3) {
        state = parts[0].toUpperCase();
        city = parts[1].replace(/-/g, ' ');
        addressPart = parts[2].split('--')[0].replace(/-/g, ' ');

        // Extract zipCode
        const zipMatch = addressPart.match(/\b(\d{5})\b/);
        if (zipMatch) {
          zipCode = zipMatch[1];
          // Clean up address (remove city, state, zip duplicates)
          addressPart = addressPart
            .replace(new RegExp(`\\s+${city}\\s+`, 'gi'), ' ')
            .replace(new RegExp(`\\s+${state}\\s+`, 'gi'), ' ')
            .replace(zipMatch[0], '')
            .trim();
        }
      }
    } else if (source === 'realtor') {
      // Format: /realestateandhomes-detail/123-Main-St_Orlando_FL_32801_M12345
      const match = pathname.match(/([^_\/]+)_([^_]+)_([A-Z]{2})_(\d{5})/i);
      if (match) {
        addressPart = match[1].replace(/-/g, ' ');
        city = match[2].replace(/-/g, ' ');
        state = match[3].toUpperCase();
        zipCode = match[4];
      }
    }

    return {
      address: addressPart || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      source,
    };
  } catch (error) {
    console.warn('Failed to extract address from URL:', error);
    return { source: 'other' };
  }
}

/**
 * Try to extract price, beds, baths, sqft from URL parameters
 * Some sites include this in the URL or query params
 */
export function extractDataFromUrlParams(url: string): Partial<ExtractedData> {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    return {
      price: params.get('price') ? parseInt(params.get('price')!) : undefined,
      beds: params.get('beds') ? parseInt(params.get('beds')!) : undefined,
      baths: params.get('baths') ? parseFloat(params.get('baths')!) : undefined,
      sqft: params.get('sqft') ? parseInt(params.get('sqft')!) : undefined,
    };
  } catch (error) {
    return {};
  }
}

/**
 * Main function: Extract all available data from URL
 */
export function extractDataFromUrl(url: string): ExtractedData {
  const addressData = extractAddressFromUrl(url);
  const paramsData = extractDataFromUrlParams(url);

  return {
    ...addressData,
    ...paramsData,
    source: addressData.source || 'other',
  };
}

/**
 * Format extracted address for display
 */
export function formatExtractedAddress(data: ExtractedData): string {
  const parts = [
    data.address,
    data.city,
    data.state,
    data.zipCode,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Validate extracted data
 */
export function isValidExtractedData(data: ExtractedData): boolean {
  // At minimum, should have address OR (city + state)
  return !!(data.address || (data.city && data.state));
}
