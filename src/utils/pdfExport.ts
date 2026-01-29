/**
 * PDF Export Utility
 * Generates professional CMA reports with images and complete data
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  min_offer_amount?: number;
  max_offer_amount?: number;
  property_image_url?: string | null;
  latitude?: number;
  longitude?: number;
}

interface ComparableProperty {
  id: string;
  address: string;
  saleDate: Date;
  salePrice: number;
  sqft: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  lotSize?: number;
  distanceMiles: number;
  daysOnMarket?: number;
  adjustment: number;
  pricePerSqft: number;
  latitude?: number;
  longitude?: number;
  source?: string; // Fonte individual do comp (attom, zillow, etc)
}

interface MarketAnalysis {
  avgSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  dataSource?: string;
  isDemo?: boolean;
  comparablesCount?: number;
}

/**
 * Validate comparables values to check if they make sense
 */
function validateCompsValues(
  comparables: ComparableProperty[],
  basePrice: number
): {
  isValid: boolean;
  warnings: string[];
  avgPricePerSqft: number;
  priceRange: { min: number; max: number };
} {
  const warnings: string[] = [];

  if (comparables.length === 0) {
    return {
      isValid: false,
      warnings: ['No comparables available'],
      avgPricePerSqft: 0,
      priceRange: { min: 0, max: 0 },
    };
  }

  const prices = comparables.map((c) => c.salePrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Validar se preços estão próximos do basePrice (±50%)
  const priceDiff = Math.abs(avgPrice - basePrice) / basePrice;
  if (priceDiff > 0.5) {
    warnings.push(
      `Average comp price ($${Math.round(avgPrice / 1000)}K) differs significantly from base price ($${Math.round(basePrice / 1000)}K)`
    );
  }

  // Validar range de preços (deve ter variação razoável)
  const priceRange = maxPrice - minPrice;
  if (priceRange < basePrice * 0.15) {
    warnings.push('Price range is narrow - comps may be very similar');
  }

  // Validar $/sqft (Orlando normal: $30-$150)
  const avgPricePerSqft =
    comparables.reduce((sum, c) => sum + (c.pricePerSqft || 0), 0) /
    comparables.length;
  if (avgPricePerSqft < 30 || avgPricePerSqft > 150) {
    warnings.push(
      `Price per sqft ($${Math.round(avgPricePerSqft)}) outside normal Orlando range ($30-$150)`
    );
  }

  // Validar se há poucos comps
  if (comparables.length < 3) {
    warnings.push(
      `Only ${comparables.length} comparable(s) found - consider expanding search radius`
    );
  }

  // Detectar padrões de dados demo (generic street names)
  const genericStreets = [
    'Colonial Dr', 'Pine Ave', 'Palm Way', 'Main St', 'Cedar Ln',
    'Sunset Blvd', 'Oak St', 'Maple Dr', 'Park Ave', 'Lake View Dr'
  ];

  const genericCount = comparables.filter(c => {
    const street = c.address.split(' ').slice(-2).join(' ');
    return genericStreets.includes(street);
  }).length;

  if (genericCount >= comparables.length * 0.8) {
    warnings.push('⚠️ High percentage of generic street names detected - data may be demo');
  }

  // Validar distâncias (muitos 0.0mi é suspeito)
  const zeroDistanceCount = comparables.filter(comp => comp.distanceMiles === 0).length;
  if (zeroDistanceCount > comparables.length * 0.5) {
    warnings.push(
      `${zeroDistanceCount} properties show 0.0mi distance - geocoding may have failed`
    );
  }

  return {
    isValid: warnings.length === 0,
    warnings,
    avgPricePerSqft,
    priceRange: { min: minPrice, max: maxPrice },
  };
}

/**
 * Load image as base64 from URL
 */
const loadImageAsBase64 = async (url: string): Promise<string | null> => {
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

/**
 * Generate Mapbox Static Map URL with subject property and comparables
 * Uses actual coordinates when available for accurate positioning
 */
const generateMapboxStaticMap = (
  subjectProperty: PropertyData,
  comparables: ComparableProperty[],
  width: number = 600,
  height: number = 400
): string | null => {
  try {
    // Get token from localStorage
    const mapboxToken = localStorage.getItem('mapbox_token');
    if (!mapboxToken) {
      console.warn('No Mapbox token found, skipping map generation');
      return null;
    }

    // Build markers overlay with actual coordinates when available
    const markers: string[] = [];
    let centerLng = -81.3792; // Orlando default
    let centerLat = 28.5383;

    // Subject property marker (large red pin with coordinates if available)
    if (subjectProperty.longitude && subjectProperty.latitude) {
      markers.push(`pin-l-home+ff0000(${subjectProperty.longitude},${subjectProperty.latitude})`);
      centerLng = subjectProperty.longitude;
      centerLat = subjectProperty.latitude;
    } else {
      markers.push('pin-l-home+ff0000()');
    }

    // Comparable markers (small blue pins) - limit to 10 to avoid URL length issues
    // Use actual coordinates when available
    const limitedComps = comparables.slice(0, 10);
    limitedComps.forEach((comp) => {
      if (comp.longitude && comp.latitude) {
        markers.push(`pin-s-circle+4299e1(${comp.longitude},${comp.latitude})`);
      } else {
        markers.push('pin-s-circle+4299e1()');
      }
    });

    // Construct Static Map URL
    // If we have coordinates, use them as center; otherwise geocode address
    let centerPart: string;
    if (subjectProperty.longitude && subjectProperty.latitude) {
      centerPart = `${centerLng},${centerLat},12`;
    } else {
      const centerAddress = `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state}`;
      centerPart = `${encodeURIComponent(centerAddress)},12`;
    }

    // Format: https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom}/{width}x{height}
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `${markers.join(',')}/` +
      `${centerPart}/` +
      `${width}x${height}@2x?` +
      `access_token=${mapboxToken}`;

    console.log('📍 Generated map URL with', markers.length, 'markers');
    return mapUrl;
  } catch (error) {
    console.error('Error generating static map:', error);
    return null;
  }
};

/**
 * Add logo/header to PDF
 */
const addHeader = (doc: jsPDF, reportTitle: string) => {
  // Company Name/Logo
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // Blue color
  doc.text('MyLocalInvest', 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Gray color
  doc.text('Orlando Real Estate Investment', 20, 32);

  // Report Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Dark color
  doc.text(reportTitle, 20, 45);

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Date: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 52);

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, 56, 190, 56);
};

/**
 * Add footer to PDF
 */
const addFooter = (doc: jsPDF, pageNumber: number) => {
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

/**
 * Normaliza endereço removendo informações duplicadas
 */
function normalizeAddress(address: string, city?: string): {
  street: string;
  zipCode?: string;
} {
  if (!address) return { street: '' };
  
  let cleaned = address.trim();
  
  // Remove palavras comuns que não fazem parte do endereço
  cleaned = cleaned
    .replace(/\bUNINCORPORATED\b/gi, '')
    .replace(/\bINCORPORATED\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extrai ZIP code (5 dígitos no final)
  const zipMatch = cleaned.match(/\b(\d{5})\b\s*$/);
  const zipCode = zipMatch ? zipMatch[1] : undefined;
  if (zipCode) {
    cleaned = cleaned.replace(/\b\d{5}\b\s*$/, '').trim();
  }
  
  // Remove nomes de cidades conhecidas do final do endereço
  const knownCities = [
    'ORLANDO', 'EATONVILLE', 'APOPKA', 'BELLE ISLE', 'WINTER GARDEN',
    'WINTER PARK', 'OVIEDO', 'WINDERMERE', 'DR. PHILLIPS', 'CLARCONA',
    'OCOEE', 'WINTER SPRINGS', 'MAITLAND', 'LAKE MARY', 'KISSIMMEE',
    'SANFORD', 'ALTAMONTE SPRINGS', 'LONGWOOD', 'CASSELBERRY'
  ];
  
  // Remove cidade se estiver no final do endereço
  for (const cityName of knownCities) {
    const cityRegex = new RegExp(`\\b${cityName.replace(/\s+/g, '\\s+')}\\s*$`, 'i');
    if (cityRegex.test(cleaned)) {
      cleaned = cleaned.replace(cityRegex, '').trim();
      break; // Remove apenas a primeira cidade encontrada
    }
  }
  
  // Se a cidade do campo property.city estiver no endereço, removê-la também
  if (city) {
    const cityRegex = new RegExp(`\\b${city.replace(/\s+/g, '\\s+')}\\s*$`, 'i');
    cleaned = cleaned.replace(cityRegex, '').trim();
  }
  
  return {
    street: cleaned,
    zipCode,
  };
}

/**
 * Formata endereço para exibição consistente
 */
function formatAddressForDisplay(address: string): string {
  if (!address) return '';
  
  const streetAbbreviations = ['ST', 'AVE', 'RD', 'DR', 'LN', 'CT', 'BLVD', 'WAY', 'CIR', 'PL'];
  
  return address
    .split(' ')
    .map(word => {
      const upperWord = word.toUpperCase();
      if (streetAbbreviations.includes(upperWord)) {
        return upperWord;
      }
      // Direções
      if (['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'].includes(upperWord)) {
        return upperWord;
      }
      // Capitaliza primeira letra
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Valida e corrige dados da propriedade
 */
function validatePropertyData(property: PropertyData): PropertyData {
  const normalized = normalizeAddress(property.address, property.city);
  
  return {
    ...property,
    address: formatAddressForDisplay(normalized.street),
    zip_code: normalized.zipCode || property.zip_code || '',
    city: property.city || 'Orlando',
  };
}

/**
 * Export CMA Report to PDF with images
 */
export const exportCompsToPDF = async (
  property: PropertyData,
  comparables: ComparableProperty[],
  analysis: MarketAnalysis
): Promise<void> => {
  try {
    const doc = new jsPDF();
    let currentY = 65;

    // Add Header
    addHeader(doc, 'Comparative Market Analysis Report');

    // ===== SUBJECT PROPERTY SECTION =====
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Subject Property', 20, currentY);
    currentY += 8;

    // Property Details Box
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY - 5, 170, 35, 'F');

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    doc.text(`Address: ${property.address}`, 25, currentY + 2);
    doc.text(`City: ${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 9);
    doc.text(`Estimated Value: $${(property.estimated_value || 0).toLocaleString()}`, 25, currentY + 16);
    
    // Current Offer - larger and darker
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42); // Darker text
    doc.setFont(undefined, 'bold');
    doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 24);
    doc.setFont(undefined, 'normal');
    
    // Offer Range (60% min/max) if available
    if (property.min_offer_amount && property.max_offer_amount) {
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Offer Range: $${property.min_offer_amount.toLocaleString()} - $${property.max_offer_amount.toLocaleString()}`, 25, currentY + 31);
    }
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);

    currentY += 40;

    // Try to load and add property image
    if (property.property_image_url) {
      try {
        const imageData = await loadImageAsBase64(property.property_image_url);
        if (imageData) {
          doc.addImage(imageData, 'JPEG', 20, currentY, 80, 60);
          currentY += 65;
        }
      } catch (error) {
        console.error('Error adding property image:', error);
      }
    }

    // ===== MARKET ANALYSIS SECTION =====
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Market Analysis Summary', 20, currentY);
    currentY += 8;

    // Analysis Cards
    const cardWidth = 40;
    const cardHeight = 20;
    const cardSpacing = 3;

    // Card 1: Avg Sale Price
    doc.setFillColor(239, 246, 255);
    doc.rect(20, currentY, cardWidth, cardHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Avg Sale Price', 22, currentY + 5);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${analysis.avgSalePrice.toLocaleString()}`, 22, currentY + 13);

    // Card 2: Avg $/Sqft
    doc.setFillColor(239, 246, 255);
    doc.rect(20 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Avg Price/Sqft', 22 + cardWidth + cardSpacing, currentY + 5);
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${Math.round(analysis.avgPricePerSqft || 0)}`, 22 + cardWidth + cardSpacing, currentY + 13);

    // Card 3: Value Range
    doc.setFillColor(239, 246, 255);
    doc.rect(20 + (cardWidth + cardSpacing) * 2, currentY, cardWidth + 15, cardHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Suggested Value Range', 22 + (cardWidth + cardSpacing) * 2, currentY + 5);
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `$${analysis.suggestedValueMin.toLocaleString()} - $${analysis.suggestedValueMax.toLocaleString()}`,
      22 + (cardWidth + cardSpacing) * 2,
      currentY + 13
    );

    // Card 4: Market Trend
    doc.setFillColor(239, 246, 255);
    doc.rect(20 + (cardWidth + cardSpacing) * 2 + cardWidth + 18, currentY, cardWidth - 10, cardHeight, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Market Trend', 22 + (cardWidth + cardSpacing) * 2 + cardWidth + 18, currentY + 5);
    doc.setFontSize(10);
    const trendColor = analysis.marketTrend === 'up' ? [34, 197, 94] : analysis.marketTrend === 'down' ? [239, 68, 68] : [100, 116, 139];
    doc.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
    doc.text(
      `${analysis.trendPercentage > 0 ? '+' : ''}${analysis.trendPercentage}%`,
      22 + (cardWidth + cardSpacing) * 2 + cardWidth + 18,
      currentY + 13
    );

    currentY += 30;

    // ===== DATA SOURCE & VALIDATION =====
    const sourceLabels: Record<string, string> = {
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

    const sourceColors: Record<string, number[]> = {
      attom: [34, 197, 94], // green
      'attom-v2': [34, 197, 94], // green
      'attom-v1': [34, 197, 94], // green
      zillow: [59, 130, 246], // blue
      'zillow-api': [59, 130, 246], // blue
      'county-csv': [249, 115, 22], // orange
      demo: [156, 163, 175], // gray
      database: [168, 85, 247], // purple
      manual: [139, 92, 246], // purple/violet
      combined: [34, 197, 94], // green (same as attom)
    };

    // Always show data source (default to 'database' if undefined)
    const dataSource = analysis.dataSource || 'database';
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Data Source:', 20, currentY);

    const color = sourceColors[dataSource] || [168, 85, 247];
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(sourceLabels[dataSource] || 'Database Cache', 50, currentY);
    doc.setFont('helvetica', 'normal');

    if (analysis.isDemo) {
      doc.setTextColor(239, 68, 68); // red
      doc.setFontSize(7);
      doc.text('⚠ Demo data - Configure API keys for real market data', 100, currentY);
    }

    currentY += 7;

    // Validate comparables and show warnings if needed
    const validation = validateCompsValues(comparables, property.estimated_value);
    if (validation.warnings.length > 0) {
      const warningHeight = 12 + validation.warnings.length * 5;
      doc.setFillColor(254, 252, 232); // yellow background
      doc.rect(20, currentY, 170, warningHeight, 'F');

      doc.setFontSize(8);
      doc.setTextColor(161, 98, 7); // yellow-dark text
      doc.setFont('helvetica', 'bold');
      doc.text('⚠ Data Quality Warnings:', 25, currentY + 5);
      doc.setFont('helvetica', 'normal');

      validation.warnings.forEach((warning, idx) => {
        doc.setFontSize(7);
        doc.text(`• ${warning}`, 25, currentY + 10 + idx * 4);
      });

      currentY += warningHeight + 5;
    }

    // ===== COMPARABLE SALES TABLE =====
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Comparable Sales', 20, currentY);
    currentY += 5;

    // Prepare table data
    const tableData = comparables.map((comp, index) => [
      `#${index + 1}`,
      comp.address,
      format(comp.saleDate, 'MM/dd/yyyy'),
      `$${comp.salePrice.toLocaleString()}`,
      comp.sqft.toLocaleString(),
      `$${Math.round(comp.pricePerSqft || 0)}`,
      `${comp.beds}/${comp.baths}`,
      `${((comp as any).distanceMiles || (comp as any).distance || 0).toFixed(2)} mi`,
      comp.daysOnMarket || '-',
      comp.adjustment !== 0 ? `$${comp.adjustment.toLocaleString()}` : '-',
      `$${(comp.salePrice + comp.adjustment).toLocaleString()}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Address', 'Sale Date', 'Sale Price', 'Sqft', '$/Sqft', 'Bd/Ba', 'Distance', 'DOM', 'Adj.', 'Adj. Price']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 6,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 6,
        textColor: [71, 85, 105],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
      tableWidth: 170,
      styles: { overflow: 'linebreak', cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 6 },
        1: { cellWidth: 35 },
        2: { cellWidth: 16 },
        3: { cellWidth: 16 },
        4: { cellWidth: 13 },
        5: { cellWidth: 13 },
        6: { cellWidth: 11 },
        7: { cellWidth: 11 },
        8: { cellWidth: 10 },
        9: { cellWidth: 12 },
        10: { cellWidth: 15 },
      },
    });

    // Get final Y position after table
    const finalY = (doc as any).lastAutoTable.finalY || currentY + 40;

    // ===== NOTES SECTION =====
    if (finalY < 250) {
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Analysis Notes:', 20, finalY + 10);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      const notes = [
        '• Comparable properties selected based on proximity (within 1 mile), similar square footage, and recent sales (last 6 months)',
        '• Adjustments made to account for differences in property features, condition, and market timing',
        '• Market trend calculated based on price per square foot comparison over time',
        '• This analysis is for informational purposes and should not be considered a formal appraisal',
      ];

      let noteY = finalY + 17;
      notes.forEach((note) => {
        doc.text(note, 20, noteY);
        noteY += 5;
      });
    }

    // ===== LOCATION MAP (NEW PAGE) =====
    doc.addPage();
    addHeader(doc, property.address);
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Property Location & Comparables Map', 20, 65);
    
    // Try to add Mapbox static map
    try {
      const mapUrl = generateMapboxStaticMap(property, comparables, 550, 350);
      if (mapUrl) {
        const mapImageData = await loadImageAsBase64(mapUrl);
        if (mapImageData) {
          doc.addImage(mapImageData, 'PNG', 20, 75, 170, 110);
          
          // Add legend
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text('Legend:', 20, 192);
          
          // Red marker
          doc.setFillColor(239, 68, 68);
          doc.circle(25, 197, 2, 'F');
          doc.text('Subject Property', 30, 198);
          
          // Blue marker
          doc.setFillColor(66, 153, 225);
          doc.circle(25, 202, 2, 'F');
          doc.text('Comparable Properties (up to 10 shown)', 30, 203);
        } else {
          doc.setFontSize(10);
          doc.setTextColor(156, 163, 175);
          doc.text('Map unavailable - unable to load image', 20, 100);
        }
      } else {
        doc.setFontSize(10);
        doc.setTextColor(156, 163, 175);
        doc.text('Map unavailable - Mapbox token not configured', 20, 100);
        doc.setFontSize(8);
        doc.text('To enable maps, add your Mapbox token in Settings', 20, 110);
      }
    } catch (mapError) {
      console.error('Error adding map to PDF:', mapError);
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175);
      doc.text('Map unavailable - error loading map', 20, 100);
    }

    // Add Footer
    addFooter(doc, 1);

    // Save PDF
    const filename = `CMA_Report_${property.address.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

/**
 * Generate a simplified version without images (faster)
 */
export const exportCompsToSimplePDF = (
  property: PropertyData,
  comparables: ComparableProperty[],
  analysis: MarketAnalysis
): void => {
  const doc = new jsPDF();
  let currentY = 65;

  addHeader(doc, 'Comparative Market Analysis Report');

  // Subject Property
  doc.setFontSize(14);
  doc.text('Subject Property', 20, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.text(`${property.address}, ${property.city}, ${property.state}`, 20, currentY);
  currentY += 6;
  doc.text(`Estimated Value: $${(property.estimated_value || 0).toLocaleString()}`, 20, currentY);
  currentY += 15;

  // Market Analysis
  doc.setFontSize(14);
  doc.text('Market Analysis', 20, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.text(`Average Sale Price: $${(analysis.avgSalePrice || 0).toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Average $/Sqft: $${Math.round(analysis.avgPricePerSqft || 0)}`, 20, currentY);
  currentY += 6;
  doc.text(`Value Range: $${(analysis.suggestedValueMin || 0).toLocaleString()} - $${(analysis.suggestedValueMax || 0).toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Market Trend: ${analysis.marketTrend} (${analysis.trendPercentage}%)`, 20, currentY);
  currentY += 15;

  // Comparables Table
  const tableData = comparables.map((comp, index) => [
    `#${index + 1}`,
    comp.address,
    format(comp.saleDate, 'MM/dd/yyyy'),
    `$${comp.salePrice.toLocaleString()}`,
    comp.sqft.toLocaleString(),
    `$${Math.round(comp.pricePerSqft || 0)}`,
    `${comp.beds}/${comp.baths}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Address', 'Date', 'Price', 'Sqft', '$/Sqft', 'Bd/Ba']],
    body: tableData,
    theme: 'striped',
  });

  addFooter(doc, 1);

  const filename = `CMA_${property.address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(filename);
};

/**
 * Export consolidated PDF with multiple properties and their comparables
 */
export const exportConsolidatedCompsPDF = async (
  properties: PropertyData[],
  getComparablesForProperty: (property: PropertyData) => Promise<{ comparables: ComparableProperty[], analysis: MarketAnalysis }>,
  onProgress?: (current: number, total: number) => void
) => {
  const doc = new jsPDF();
  let pageNumber = 1;

  // Cover page
  doc.setFontSize(28);
  doc.setTextColor(37, 99, 235);
  doc.text('MyLocalInvest', 105, 100, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Consolidated CMA Report', 105, 115, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`${properties.length} Properties Analyzed`, 105, 125, { align: 'center' });
  doc.text(format(new Date(), 'MMMM dd, yyyy'), 105, 135, { align: 'center' });

  addFooter(doc, pageNumber++);

  // Process each property
  for (let i = 0; i < properties.length; i++) {
    const property = validatePropertyData(properties[i]);

    // Progress callback
    if (onProgress) {
      onProgress(i + 1, properties.length);
    }

    // New page for each property
    doc.addPage();

    addHeader(doc, `Property ${i + 1} of ${properties.length}`);
    let currentY = 65;

    // Property info section with photo
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Subject Property', 20, currentY);
    currentY += 8;

    // Property details box (larger to accommodate bigger image)
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, 170, 60, 'F');

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, 'bold');
    
    // Quebra endereço longo em múltiplas linhas se necessário
    const addressLines = doc.splitTextToSize(property.address, 120);
    addressLines.forEach((line: string, idx: number) => {
      doc.text(line, 25, currentY + 8 + (idx * 6));
    });

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const addressLineOffset = (addressLines.length - 1) * 6;
    doc.text(`${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 15 + addressLineOffset);
    
    // Ajustar currentY baseado no número de linhas do endereço
    currentY += addressLineOffset;

    // Property details - Current Offer larger and darker
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Darker text
    doc.setFont(undefined, 'bold');
    doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 25);
    doc.setFont(undefined, 'normal');
    
    // Offer Range (60% min/max) if available
    if (property.min_offer_amount && property.max_offer_amount) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Offer Range: $${property.min_offer_amount.toLocaleString()} - $${property.max_offer_amount.toLocaleString()}`, 25, currentY + 32);
    }

    // Add property image if available (larger size)
    if (property.property_image_url) {
      try {
        const imageData = await loadImageAsBase64(property.property_image_url);
        if (imageData) {
          doc.addImage(imageData, 'JPEG', 110, currentY + 3, 80, 55);
        } else {
          // Placeholder if image fails
          doc.setDrawColor(200, 200, 200);
          doc.rect(110, currentY + 3, 80, 55);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('No Image', 150, currentY + 30, { align: 'center' });
        }
      } catch (error) {
        console.error('Error adding image:', error);
      }
    } else {
      // No image placeholder
      doc.setDrawColor(200, 200, 200);
      doc.rect(110, currentY + 3, 80, 55);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('No Image Available', 150, currentY + 30, { align: 'center' });
    }

    currentY += 62;

    // Get comparables for this property
    try {
      const { comparables, analysis } = await getComparablesForProperty(property);

      // Add offer vs comps percentage difference badge
      if (property.cash_offer_amount && property.cash_offer_amount > 0 && analysis.avgSalePrice) {
        const percentDiff = ((1 - property.cash_offer_amount / analysis.avgSalePrice) * 100);
        const isBelow = percentDiff > 0;

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');

        if (isBelow) {
          // Below market (green badge)
          doc.setFillColor(220, 252, 231);
          doc.rect(20, currentY, 50, 8, 'F');
          doc.setTextColor(22, 163, 74);
          doc.text(`↓ ${percentDiff.toFixed(1)}% below avg`, 22, currentY + 6);
        } else {
          // Above market (red badge)
          doc.setFillColor(254, 226, 226);
          doc.rect(20, currentY, 50, 8, 'F');
          doc.setTextColor(220, 38, 38);
          doc.text(`↑ ${Math.abs(percentDiff).toFixed(1)}% above avg`, 22, currentY + 6);
        }

        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);
        currentY += 12; // Add space after badge
      }

      // Analysis summary cards
      const cardWidth = 38;
      const cardHeight = 18;
      const cardSpacing = 5;

      // Card 1: Avg Sale Price
      doc.setFillColor(239, 246, 255);
      doc.rect(20, currentY, cardWidth, cardHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Avg Sale Price', 22, currentY + 5);
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235);
      doc.text(`$${Math.round((analysis.avgSalePrice || 0) / 1000)}K`, 22, currentY + 13);

      // Card 2: Avg $/Sqft
      doc.setFillColor(239, 246, 255);
      doc.rect(20 + cardWidth + cardSpacing, currentY, cardWidth, cardHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Avg $/Sqft', 22 + cardWidth + cardSpacing, currentY + 5);
      doc.setFontSize(11);
      doc.setTextColor(37, 99, 235);
      doc.text(`$${Math.round(analysis.avgPricePerSqft || 0)}`, 22 + cardWidth + cardSpacing, currentY + 13);

      // Card 3: Suggested Value Range
      doc.setFillColor(239, 246, 255);
      doc.rect(20 + (cardWidth + cardSpacing) * 2, currentY, cardWidth + 20, cardHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Suggested Value', 22 + (cardWidth + cardSpacing) * 2, currentY + 5);
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(
        `$${Math.round((analysis.suggestedValueMin || 0) / 1000)}K - $${Math.round((analysis.suggestedValueMax || 0) / 1000)}K`,
        22 + (cardWidth + cardSpacing) * 2,
        currentY + 13
      );

      currentY += 25;

      // ===== OFFER PERCENTAGES CARDS =====
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Quick Offer Calculator:', 20, currentY);
      currentY += 6;

      const avgPrice = analysis.avgSalePrice || property.estimated_value || 0;
      const offers = [
        { label: '60%', percent: 0.60, color: [185, 28, 28] },    // dark red
        { label: '70%', percent: 0.70, color: [239, 68, 68] },    // red
        { label: '75%', percent: 0.75, color: [249, 115, 22] },   // orange
        { label: '80%', percent: 0.80, color: [251, 191, 36] },   // amber
        { label: '85%', percent: 0.85, color: [234, 179, 8] },    // yellow
        { label: '90%', percent: 0.90, color: [34, 197, 94] },    // green
      ];

      const offerCardWidth = 27;  // Reduced from 32 to fit 6 cards
      const offerCardHeight = 14;
      const offerSpacing = 2;

      offers.forEach((offer, index) => {
        const x = 20 + index * (offerCardWidth + offerSpacing);
        const offerValue = Math.round(avgPrice * offer.percent);

        // Card background
        doc.setFillColor(offer.color[0], offer.color[1], offer.color[2]);
        doc.rect(x, currentY, offerCardWidth, offerCardHeight, 'F');

        // Label
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.text(offer.label, x + offerCardWidth / 2, currentY + 5, { align: 'center' });

        // Value
        doc.setFontSize(8);
        doc.text(`$${Math.round(offerValue / 1000)}K`, x + offerCardWidth / 2, currentY + 11, { align: 'center' });
        doc.setFont(undefined, 'normal');
      });

      currentY += 20;

      // Data Source Badge - Only show for non-manual sources
      const sourceConfig: Record<string, { label: string; color: number[] }> = {
        attom: { label: 'MLS Data', color: [34, 197, 94] },
        'attom-v2': { label: 'MLS Data (V2)', color: [34, 197, 94] },
        'attom-v1': { label: 'MLS Data (V1)', color: [34, 197, 94] },
        zillow: { label: 'Zillow API', color: [59, 130, 246] },
        'zillow-api': { label: 'Zillow API', color: [59, 130, 246] },
        'county-csv': { label: 'Public Records', color: [249, 115, 22] },
        demo: { label: 'Demo Data', color: [156, 163, 175] },
        combined: { label: 'Combined', color: [34, 197, 94] },
      };

      // Default to 'database' if dataSource is undefined
      const dataSource = analysis.dataSource || 'database';
      const config = sourceConfig[dataSource];

      // Only draw badge if we have a valid config (skip manual/database sources)
      if (config) {
        // Draw badge rectangle
        doc.setFillColor(config.color[0], config.color[1], config.color[2]);
        doc.rect(140, currentY - 2, 50, 7, 'F');

        // Draw badge text
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(config.label, 165, currentY + 3, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      }

      // Demo warning below badge
      if (analysis.isDemo) {
        doc.setFontSize(6);
        doc.setTextColor(239, 68, 68);
        doc.text('⚠ Demo', 165, currentY + 8, { align: 'center' });
        currentY += 3; // Extra space for demo warning
      }

      // Comparables table
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Comparable Sales', 20, currentY);
      currentY += 3;

      const tableData = comparables.map((comp, index) => [
        `#${index + 1}`,
        comp.address.length > 30 ? comp.address.substring(0, 27) + '...' : comp.address,
        format(comp.saleDate, 'MM/dd/yy'),
        `$${Math.round(comp.salePrice / 1000)}K`,
        comp.sqft.toLocaleString(),
        `$${Math.round(comp.pricePerSqft || 0)}`,
        `${comp.beds}/${comp.baths}`,
        `${((comp as any).distanceMiles || (comp as any).distance || 0).toFixed(1)}mi`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Address', 'Date', 'Price', 'Sqft', '$/Sqft', 'Bd/Ba', 'Dist']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
        },
        bodyStyles: {
          fontSize: 7,
          textColor: [71, 85, 105],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        columnStyles: {
          0: { cellWidth: 5 },   // # (reduzido)
          1: { cellWidth: 44 },  // Address (reduzido)
          2: { cellWidth: 17 },  // Date (reduzido)
          3: { cellWidth: 15 },  // Price (reduzido)
          4: { cellWidth: 13 },  // Sqft (reduzido)
          5: { cellWidth: 13 },  // $/Sqft (reduzido)
          6: { cellWidth: 11 },  // Bd/Ba (reduzido)
          7: { cellWidth: 9 },   // Dist (reduzido)
        },
        margin: { left: 20, right: 20 },
        tableWidth: 127,  // Nova soma: 5+44+17+15+13+13+11+9 = 127
        styles: {
          overflow: 'linebreak',
          cellPadding: { top: 1, right: 1, bottom: 1, left: 1 },
          halign: 'left',
        },
      });

      // Add mini map if possible (small version for consolidated PDF)
      const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;

      if (finalTableY < 200) {
        try {
          const mapUrl = generateMapboxStaticMap(property, comparables, 400, 200);
          if (mapUrl) {
            const mapImageData = await loadImageAsBase64(mapUrl);
            if (mapImageData) {
              doc.setFontSize(10);
              doc.setTextColor(15, 23, 42);
              doc.text('Location Map', 20, finalTableY + 8);
              doc.addImage(mapImageData, 'PNG', 20, finalTableY + 12, 170, 85);
            }
          }
        } catch (mapError) {
          console.warn('Could not add map to consolidated PDF:', mapError);
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Only log unexpected errors (not "No valid comparables found" which is expected)
      if (!errorMessage.includes('No valid comparables found')) {
        console.error(`Error processing property ${property.address}:`, error);
      }
      
      // Show error message in PDF with more details
      doc.setFillColor(254, 242, 242);
      doc.rect(20, currentY, 170, 50, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text('⚠ Unable to Load Comparables', 25, currentY + 12);
      
      doc.setFontSize(9);
      doc.setTextColor(127, 29, 29);
      doc.text(`Address: ${property.address}`, 25, currentY + 22);
      doc.text('No manual comparables found for this address.', 25, currentY + 30);
      doc.text('Please add manual comps using the Manual Comps Manager.', 25, currentY + 38);
      doc.setFontSize(8);
      doc.text('• No manual entries in database for this property', 30, currentY + 45);
      doc.text('• Add comparables manually to generate this report', 30, currentY + 52);
      
      currentY += 58;
    }

    addFooter(doc, pageNumber++);
  }

  // Save the consolidated PDF
  const filename = `Consolidated_CMA_${properties.length}_Properties_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};
