/**
 * Shared PDF helpers: header, footer, image loading, address utils, validation
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { PropertyData, ComparableProperty } from './types';

// ─── Image Loading ───────────────────────────────────────────────

export const loadImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading image:', error);
    return null;
  }
};

// ─── Mapbox Static Map ───────────────────────────────────────────

export const generateMapboxStaticMap = (
  subjectProperty: PropertyData,
  comparables: ComparableProperty[],
  width = 600,
  height = 400
): string | null => {
  try {
    const mapboxToken = localStorage.getItem('mapbox_token');
    if (!mapboxToken) return null;

    const markers: string[] = [];
    let centerLng = -81.3792;
    let centerLat = 28.5383;

    if (subjectProperty.longitude && subjectProperty.latitude) {
      markers.push(`pin-l-home+ff0000(${subjectProperty.longitude},${subjectProperty.latitude})`);
      centerLng = subjectProperty.longitude;
      centerLat = subjectProperty.latitude;
    } else {
      markers.push('pin-l-home+ff0000()');
    }

    comparables.slice(0, 10).forEach((comp) => {
      if (comp.longitude && comp.latitude) {
        markers.push(`pin-s-circle+4299e1(${comp.longitude},${comp.latitude})`);
      } else {
        markers.push('pin-s-circle+4299e1()');
      }
    });

    let centerPart: string;
    if (subjectProperty.longitude && subjectProperty.latitude) {
      centerPart = `${centerLng},${centerLat},12`;
    } else {
      const centerAddress = `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state}`;
      centerPart = `${encodeURIComponent(centerAddress)},12`;
    }

    return (
      `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `${markers.join(',')}/` +
      `${centerPart}/` +
      `${width}x${height}@2x?` +
      `access_token=${mapboxToken}`
    );
  } catch {
    return null;
  }
};

// ─── Header & Footer ─────────────────────────────────────────────

export const addHeader = (doc: jsPDF, reportTitle: string) => {
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235);
  doc.text('MyLocalInvest', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Orlando Real Estate Investment', 20, 32);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(reportTitle, 20, 45);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Date: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 52);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 56, 190, 56);
};

export const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Page ${pageNumber} | MyLocalInvest | (407) 555-0123 | info@mylocalinvest.com`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
};

// ─── Address Utilities ───────────────────────────────────────────

const KNOWN_CITIES = [
  'ORLANDO', 'EATONVILLE', 'APOPKA', 'BELLE ISLE', 'WINTER GARDEN',
  'WINTER PARK', 'OVIEDO', 'WINDERMERE', 'DR. PHILLIPS', 'CLARCONA',
  'OCOEE', 'WINTER SPRINGS', 'MAITLAND', 'LAKE MARY', 'KISSIMMEE',
  'SANFORD', 'ALTAMONTE SPRINGS', 'LONGWOOD', 'CASSELBERRY',
];

function normalizeAddress(address: string, city?: string): { street: string; zipCode?: string } {
  if (!address) return { street: '' };

  let cleaned = address.trim()
    .replace(/\bUNINCORPORATED\b/gi, '')
    .replace(/\bINCORPORATED\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const zipMatch = cleaned.match(/\b(\d{5})\b\s*$/);
  const zipCode = zipMatch?.[1];
  if (zipCode) cleaned = cleaned.replace(/\b\d{5}\b\s*$/, '').trim();

  for (const cityName of KNOWN_CITIES) {
    const cityRegex = new RegExp(`\\b${cityName.replace(/\s+/g, '\\s+')}\\s*$`, 'i');
    if (cityRegex.test(cleaned)) {
      cleaned = cleaned.replace(cityRegex, '').trim();
      break;
    }
  }

  if (city) {
    const cityRegex = new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\s*$`, 'i');
    cleaned = cleaned.replace(cityRegex, '').trim();
  }

  return { street: cleaned, zipCode };
}

function formatAddressForDisplay(address: string): string {
  if (!address) return '';
  const abbreviations = ['ST', 'AVE', 'RD', 'DR', 'LN', 'CT', 'BLVD', 'WAY', 'CIR', 'PL'];
  const directions = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];

  return address.split(' ').map(word => {
    const upper = word.toUpperCase();
    if (abbreviations.includes(upper) || directions.includes(upper)) return upper;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

export function validatePropertyData(property: PropertyData): PropertyData {
  const normalized = normalizeAddress(property.address, property.city);
  return {
    ...property,
    address: formatAddressForDisplay(normalized.street),
    zip_code: normalized.zipCode || property.zip_code || '',
    city: property.city || 'Orlando',
  };
}

// ─── Comp Validation ─────────────────────────────────────────────

export function validateCompsValues(
  comparables: ComparableProperty[],
  basePrice: number
): { isValid: boolean; warnings: string[]; avgPricePerSqft: number; priceRange: { min: number; max: number } } {
  const warnings: string[] = [];

  if (comparables.length === 0) {
    return { isValid: false, warnings: ['No comparables available'], avgPricePerSqft: 0, priceRange: { min: 0, max: 0 } };
  }

  const prices = comparables.map(c => c.salePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  if (Math.abs(avgPrice - basePrice) / basePrice > 0.5) {
    warnings.push(`Average comp price ($${Math.round(avgPrice / 1000)}K) differs significantly from base price ($${Math.round(basePrice / 1000)}K)`);
  }

  if (maxPrice - minPrice < basePrice * 0.15) {
    warnings.push('Price range is narrow - comps may be very similar');
  }

  const avgPricePerSqft = comparables.reduce((sum, c) => sum + (c.pricePerSqft || 0), 0) / comparables.length;
  if (avgPricePerSqft < 30 || avgPricePerSqft > 150) {
    warnings.push(`Price per sqft ($${Math.round(avgPricePerSqft)}) outside normal Orlando range ($30-$150)`);
  }

  if (comparables.length < 3) {
    warnings.push(`Only ${comparables.length} comparable(s) found - consider expanding search radius`);
  }

  const genericStreets = ['Colonial Dr', 'Pine Ave', 'Palm Way', 'Main St', 'Cedar Ln', 'Sunset Blvd', 'Oak St', 'Maple Dr', 'Park Ave', 'Lake View Dr'];
  const genericCount = comparables.filter(c => genericStreets.includes(c.address.split(' ').slice(-2).join(' '))).length;
  if (genericCount >= comparables.length * 0.8) {
    warnings.push('⚠️ High percentage of generic street names detected - data may be demo');
  }

  const zeroDistanceCount = comparables.filter(c => c.distanceMiles === 0).length;
  if (zeroDistanceCount > comparables.length * 0.5) {
    warnings.push(`${zeroDistanceCount} properties show 0.0mi distance - geocoding may have failed`);
  }

  return { isValid: warnings.length === 0, warnings, avgPricePerSqft, priceRange: { min: minPrice, max: maxPrice } };
}

// ─── Data Source Config ──────────────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  attom: 'MLS Data (Attom API)',
  'attom-v2': 'MLS Data (Attom V2)',
  'attom-v1': 'MLS Data (Attom V1)',
  zillow: 'Zillow API',
  'zillow-api': 'Zillow API',
  'county-csv': 'Public Records (Orange County)',
  demo: 'Demo Data',
  database: 'Cached Database',
  manual: 'Manual Entry',
  combined: 'Combined (API + Manual)',
};

export const SOURCE_COLORS: Record<string, number[]> = {
  attom: [34, 197, 94],
  'attom-v2': [34, 197, 94],
  'attom-v1': [34, 197, 94],
  zillow: [59, 130, 246],
  'zillow-api': [59, 130, 246],
  'county-csv': [249, 115, 22],
  demo: [156, 163, 175],
  database: [168, 85, 247],
  manual: [139, 92, 246],
  combined: [34, 197, 94],
};
