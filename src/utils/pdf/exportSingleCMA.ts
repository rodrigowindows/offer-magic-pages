/**
 * Single property CMA PDF export (full and simple versions)
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { PropertyData, ComparableProperty, MarketAnalysis } from './types';
import {
  addHeader, addFooter, loadImageAsBase64, generateMapboxStaticMap,
  validateCompsValues, SOURCE_LABELS, SOURCE_COLORS,
} from './helpers';

/**
 * Export full CMA Report to PDF with images and map
 */
export const exportCompsToPDF = async (
  property: PropertyData,
  comparables: ComparableProperty[],
  analysis: MarketAnalysis
): Promise<void> => {
  const doc = new jsPDF();
  let currentY = 65;

  addHeader(doc, 'Comparative Market Analysis Report');

  // ── Subject Property ──
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Subject Property', 20, currentY);
  currentY += 8;

  doc.setFillColor(249, 250, 251);
  doc.rect(20, currentY - 5, 170, 35, 'F');

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Address: ${property.address}`, 25, currentY + 2);
  doc.text(`City: ${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 9);
  doc.text(`Estimated Value: $${(property.estimated_value || 0).toLocaleString()}`, 25, currentY + 16);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont(undefined, 'bold');
  doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 24);
  doc.setFont(undefined, 'normal');

  if (property.min_offer_amount && property.max_offer_amount) {
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Offer Range: $${property.min_offer_amount.toLocaleString()} - $${property.max_offer_amount.toLocaleString()}`, 25, currentY + 31);
  }

  currentY += 40;

  // Property image
  if (property.property_image_url) {
    try {
      const imageData = await loadImageAsBase64(property.property_image_url);
      if (imageData) {
        doc.addImage(imageData, 'JPEG', 20, currentY, 80, 60);
        currentY += 65;
      }
    } catch { /* skip */ }
  }

  // ── Market Analysis Cards ──
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Market Analysis Summary', 20, currentY);
  currentY += 8;

  const cardW = 40, cardH = 20, gap = 3;
  const cards = [
    { label: 'Avg Sale Price', value: `$${analysis.avgSalePrice.toLocaleString()}` },
    { label: 'Avg Price/Sqft', value: `$${Math.round(analysis.avgPricePerSqft || 0)}` },
    { label: 'Suggested Value Range', value: `$${analysis.suggestedValueMin.toLocaleString()} - $${analysis.suggestedValueMax.toLocaleString()}`, wide: true },
  ];

  let cardX = 20;
  cards.forEach(card => {
    const w = card.wide ? cardW + 15 : cardW;
    doc.setFillColor(239, 246, 255);
    doc.rect(cardX, currentY, w, cardH, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, cardX + 2, currentY + 5);
    doc.setFontSize(card.wide ? 10 : 12);
    doc.setTextColor(15, 23, 42);
    doc.text(card.value, cardX + 2, currentY + 13);
    cardX += w + gap;
  });

  // Trend card
  doc.setFillColor(239, 246, 255);
  doc.rect(cardX, currentY, cardW - 10, cardH, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Market Trend', cardX + 2, currentY + 5);
  const tc = analysis.marketTrend === 'up' ? [34, 197, 94] : analysis.marketTrend === 'down' ? [239, 68, 68] : [100, 116, 139];
  doc.setFontSize(10);
  doc.setTextColor(tc[0], tc[1], tc[2]);
  doc.text(`${analysis.trendPercentage > 0 ? '+' : ''}${analysis.trendPercentage}%`, cardX + 2, currentY + 13);

  currentY += 30;

  // ── Data Source ──
  const dataSource = analysis.dataSource || 'database';
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Data Source:', 20, currentY);
  const color = SOURCE_COLORS[dataSource] || [168, 85, 247];
  doc.setTextColor(color[0], color[1], color[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(SOURCE_LABELS[dataSource] || 'Database Cache', 50, currentY);
  doc.setFont('helvetica', 'normal');

  if (analysis.isDemo) {
    doc.setTextColor(239, 68, 68);
    doc.setFontSize(7);
    doc.text('⚠ Demo data - Configure API keys for real market data', 100, currentY);
  }
  currentY += 7;

  // ── Validation Warnings ──
  const validation = validateCompsValues(comparables, property.estimated_value);
  if (validation.warnings.length > 0) {
    const warnH = 12 + validation.warnings.length * 5;
    doc.setFillColor(254, 252, 232);
    doc.rect(20, currentY, 170, warnH, 'F');
    doc.setFontSize(8);
    doc.setTextColor(161, 98, 7);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ Data Quality Warnings:', 25, currentY + 5);
    doc.setFont('helvetica', 'normal');
    validation.warnings.forEach((w, i) => {
      doc.setFontSize(7);
      doc.text(`• ${w}`, 25, currentY + 10 + i * 4);
    });
    currentY += warnH + 5;
  }

  // ── Comparables Table ──
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Comparable Sales', 20, currentY);
  currentY += 5;

  const tableData = comparables.map((comp, i) => [
    `#${i + 1}`, comp.address, format(comp.saleDate, 'MM/dd/yyyy'),
    `$${comp.salePrice.toLocaleString()}`, comp.sqft.toLocaleString(),
    `$${Math.round(comp.pricePerSqft || 0)}`, `${comp.beds}/${comp.baths}`,
    `${((comp as any).distanceMiles || 0).toFixed(2)} mi`,
    comp.daysOnMarket || '-',
    comp.adjustment !== 0 ? `$${comp.adjustment.toLocaleString()}` : '-',
    `$${(comp.salePrice + comp.adjustment).toLocaleString()}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Address', 'Sale Date', 'Sale Price', 'Sqft', '$/Sqft', 'Bd/Ba', 'Distance', 'DOM', 'Adj.', 'Adj. Price']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 6, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6, textColor: [71, 85, 105] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 20, right: 20 },
    tableWidth: 170,
    styles: { overflow: 'linebreak', cellPadding: 1 },
    columnStyles: { 0: { cellWidth: 6 }, 1: { cellWidth: 35 }, 2: { cellWidth: 16 }, 3: { cellWidth: 16 }, 4: { cellWidth: 13 }, 5: { cellWidth: 13 }, 6: { cellWidth: 11 }, 7: { cellWidth: 11 }, 8: { cellWidth: 10 }, 9: { cellWidth: 12 }, 10: { cellWidth: 15 } },
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY + 40;

  // Notes
  if (finalY < 250) {
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Analysis Notes:', 20, finalY + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    ['• Comparable properties selected based on proximity, similar square footage, and recent sales',
     '• Adjustments made to account for differences in features, condition, and timing',
     '• Market trend calculated based on price per square foot comparison over time',
     '• This analysis is for informational purposes and should not be considered a formal appraisal',
    ].forEach((note, i) => doc.text(note, 20, finalY + 17 + i * 5));
  }

  // ── Map Page ──
  doc.addPage();
  addHeader(doc, property.address);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('Property Location & Comparables Map', 20, 65);

  try {
    const mapUrl = generateMapboxStaticMap(property, comparables, 550, 350);
    if (mapUrl) {
      const mapImg = await loadImageAsBase64(mapUrl);
      if (mapImg) {
        doc.addImage(mapImg, 'PNG', 20, 75, 170, 110);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('Legend:', 20, 192);
        doc.setFillColor(239, 68, 68);
        doc.circle(25, 197, 2, 'F');
        doc.text('Subject Property', 30, 198);
        doc.setFillColor(66, 153, 225);
        doc.circle(25, 202, 2, 'F');
        doc.text('Comparable Properties (up to 10 shown)', 30, 203);
      }
    }
  } catch { /* skip map */ }

  addFooter(doc, 1);

  const filename = `CMA_Report_${property.address.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

/**
 * Simplified CMA PDF without images (faster)
 */
export const exportCompsToSimplePDF = (
  property: PropertyData,
  comparables: ComparableProperty[],
  analysis: MarketAnalysis
): void => {
  const doc = new jsPDF();
  let currentY = 65;

  addHeader(doc, 'Comparative Market Analysis Report');

  doc.setFontSize(14);
  doc.text('Subject Property', 20, currentY);
  currentY += 8;
  doc.setFontSize(10);
  doc.text(`${property.address}, ${property.city}, ${property.state}`, 20, currentY);
  currentY += 6;
  doc.text(`Estimated Value: $${(property.estimated_value || 0).toLocaleString()}`, 20, currentY);
  currentY += 15;

  doc.setFontSize(14);
  doc.text('Market Analysis', 20, currentY);
  currentY += 8;
  doc.setFontSize(10);
  doc.text(`Estimated Value: $${(analysis.avgSalePrice || 0).toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Average $/Sqft: $${Math.round(analysis.avgPricePerSqft || 0)}`, 20, currentY);
  currentY += 6;
  doc.text(`Value Range: $${(analysis.suggestedValueMin || 0).toLocaleString()} - $${(analysis.suggestedValueMax || 0).toLocaleString()}`, 20, currentY);
  currentY += 6;
  doc.text(`Market Trend: ${analysis.marketTrend} (${analysis.trendPercentage}%)`, 20, currentY);
  currentY += 15;

  const tableData = comparables.map((comp, i) => [
    `#${i + 1}`, comp.address, format(comp.saleDate, 'MM/dd/yyyy'),
    `$${comp.salePrice.toLocaleString()}`, comp.sqft.toLocaleString(),
    `$${Math.round(comp.pricePerSqft || 0)}`, `${comp.beds}/${comp.baths}`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Address', 'Date', 'Price', 'Sqft', '$/Sqft', 'Bd/Ba']],
    body: tableData,
    theme: 'striped',
  });

  addFooter(doc, 1);
  doc.save(`CMA_${property.address.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};
