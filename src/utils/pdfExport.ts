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
    doc.text(`Estimated Value: $${property.estimated_value.toLocaleString()}`, 25, currentY + 16);
    doc.text(`Current Offer: $${property.cash_offer_amount.toLocaleString()}`, 25, currentY + 23);

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
    doc.text(`$${analysis.avgPricePerSqft}`, 22 + cardWidth + cardSpacing, currentY + 13);

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
      `$${comp.pricePerSqft}`,
      `${comp.beds}/${comp.baths}`,
      `${comp.distanceMiles.toFixed(2)} mi`,
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
  doc.text(`Estimated Value: $${property.estimated_value.toLocaleString()}`, 20, currentY);
  currentY += 15;

  // Market Analysis
  doc.setFontSize(14);
  doc.text('Market Analysis', 20, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.text(`Average Sale Price: $${analysis.avgSalePrice.toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Average $/Sqft: $${analysis.avgPricePerSqft}`, 20, currentY);
  currentY += 6;
  doc.text(`Value Range: $${analysis.suggestedValueMin.toLocaleString()} - $${analysis.suggestedValueMax.toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Market Trend: ${analysis.marketTrend} (${analysis.trendPercentage}%)`, 20, currentY);
  currentY += 15;

  // Comparables Table
  const tableData = comparables.map((comp, i) => [
    `${i + 1}`,
    comp.address,
    format(comp.saleDate, 'MM/dd/yy'),
    `$${comp.salePrice.toLocaleString()}`,
    comp.sqft.toLocaleString(),
    `$${comp.pricePerSqft}`,
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
