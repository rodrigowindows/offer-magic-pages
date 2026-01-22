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
  property_image_url?: string | null;
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
}

interface MarketAnalysis {
  avgSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
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

    // Build markers overlay
    const markers: string[] = [];

    // Subject property marker (large red pin)
    markers.push('pin-l-home+ff0000()');

    // Comparable markers (small blue pins) - limit to 10 to avoid URL length issues
    const limitedComps = comparables.slice(0, 10);
    limitedComps.forEach(() => {
      markers.push('pin-s-circle+4299e1()');
    });

    // Use subject property address as center (Mapbox will geocode it)
    const centerAddress = `${subjectProperty.address}, ${subjectProperty.city}, ${subjectProperty.state}`;
    const encodedAddress = encodeURIComponent(centerAddress);

    // Construct Static Map URL
    // Format: https://api.mapbox.com/styles/v1/{username}/{style_id}/static/{overlay}/{lon},{lat},{zoom}/{width}x{height}
    const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/` +
      `${markers.join(',')}/` +
      `${encodedAddress}/` +
      `12/${width}x${height}@2x?` +
      `access_token=${mapboxToken}`;

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
    doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 23);

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
      `${(comp.distanceMiles || comp.distance || 0).toFixed(2)} mi`,
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
        fontSize: 8,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [71, 85, 105],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 20, right: 20 },
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
    const property = properties[i];

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

    // Property details box
    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, 170, 45, 'F');

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, 'bold');
    doc.text(property.address, 25, currentY + 8);

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 15);

    // Property details
    doc.setFontSize(9);
    doc.text(`Estimated Value: $${(property.estimated_value || 0).toLocaleString()}`, 25, currentY + 25);
    doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 32);

    // Add property image if available
    if (property.property_image_url) {
      try {
        const imageData = await loadImageAsBase64(property.property_image_url);
        if (imageData) {
          doc.addImage(imageData, 'JPEG', 130, currentY + 3, 55, 38);
        } else {
          // Placeholder if image fails
          doc.setDrawColor(200, 200, 200);
          doc.rect(130, currentY + 3, 55, 38);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text('No Image', 157.5, currentY + 23, { align: 'center' });
        }
      } catch (error) {
        console.error('Error adding image:', error);
      }
    } else {
      // No image placeholder
      doc.setDrawColor(200, 200, 200);
      doc.rect(130, currentY + 3, 55, 38);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('No Image Available', 157.5, currentY + 23, { align: 'center' });
    }

    currentY += 52;

    // Get comparables for this property
    try {
      const { comparables, analysis } = await getComparablesForProperty(property);

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

      // Card 4: Market Trend
      doc.setFillColor(239, 246, 255);
      doc.rect(20 + (cardWidth + cardSpacing) * 2 + cardWidth + 25, currentY, cardWidth - 10, cardHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Trend', 22 + (cardWidth + cardSpacing) * 2 + cardWidth + 25, currentY + 5);
      doc.setFontSize(10);
      const trendColor = analysis.marketTrend === 'up' ? [34, 197, 94] : analysis.marketTrend === 'down' ? [239, 68, 68] : [100, 116, 139];
      doc.setTextColor(trendColor[0], trendColor[1], trendColor[2]);
      doc.text(
        `${(analysis.trendPercentage || 0) > 0 ? '+' : ''}${analysis.trendPercentage || 0}%`,
        22 + (cardWidth + cardSpacing) * 2 + cardWidth + 25,
        currentY + 13
      );

      currentY += 25;

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
        `${(comp.distanceMiles || comp.distance || 0).toFixed(1)}mi`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Address', 'Date', 'Price', 'Sqft', '$/Sqft', 'Bd/Ba', 'Dist']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 55 },
          2: { cellWidth: 22 },
          3: { cellWidth: 20 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 15 },
          7: { cellWidth: 15 },
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
      console.error(`Error processing property ${property.address}:`, error);
      
      // Show error message in PDF
      doc.setFillColor(254, 242, 242);
      doc.rect(20, currentY, 170, 40, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(220, 38, 38);
      doc.text('⚠ Unable to load comparables', 25, currentY + 12);
      
      doc.setFontSize(9);
      doc.setTextColor(127, 29, 29);
      doc.text('No comparable properties found for this address.', 25, currentY + 22);
      doc.text('This property will be skipped in the analysis.', 25, currentY + 30);
      
      currentY += 45;
    }

    addFooter(doc, pageNumber++);
  }

  // Save the consolidated PDF
  const filename = `Consolidated_CMA_${properties.length}_Properties_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};
