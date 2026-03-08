/**
 * Consolidated multi-property CMA PDF export
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { PropertyData, ComparableProperty, MarketAnalysis } from './types';
import {
  addHeader, addFooter, loadImageAsBase64, generateMapboxStaticMap,
  validatePropertyData, SOURCE_COLORS,
} from './helpers';

const SOURCE_CONFIG: Record<string, { label: string; color: number[] }> = {
  attom: { label: 'MLS Data', color: [34, 197, 94] },
  'attom-v2': { label: 'MLS Data (V2)', color: [34, 197, 94] },
  'attom-v1': { label: 'MLS Data (V1)', color: [34, 197, 94] },
  zillow: { label: 'Zillow API', color: [59, 130, 246] },
  'zillow-api': { label: 'Zillow API', color: [59, 130, 246] },
  'county-csv': { label: 'Public Records', color: [249, 115, 22] },
  demo: { label: 'Demo Data', color: [156, 163, 175] },
  combined: { label: 'Combined', color: [34, 197, 94] },
};

const OFFER_PERCENTAGES = [
  { label: '60%', percent: 0.60, color: [185, 28, 28] },
  { label: '70%', percent: 0.70, color: [239, 68, 68] },
  { label: '75%', percent: 0.75, color: [249, 115, 22] },
  { label: '80%', percent: 0.80, color: [251, 191, 36] },
  { label: '85%', percent: 0.85, color: [234, 179, 8] },
  { label: '90%', percent: 0.90, color: [34, 197, 94] },
];

function addPropertyImage(doc: jsPDF, property: PropertyData, currentY: number) {
  if (property.property_image_url) {
    return loadImageAsBase64(property.property_image_url).then(imageData => {
      if (imageData) {
        doc.addImage(imageData, 'JPEG', 110, currentY + 3, 80, 55);
      } else {
        drawImagePlaceholder(doc, currentY, 'No Image');
      }
    }).catch(() => { /* skip */ });
  } else {
    drawImagePlaceholder(doc, currentY, 'No Image Available');
    return Promise.resolve();
  }
}

function drawImagePlaceholder(doc: jsPDF, y: number, text: string) {
  doc.setDrawColor(200, 200, 200);
  doc.rect(110, y + 3, 80, 55);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(text, 150, y + 30, { align: 'center' });
}

function addOfferBadge(doc: jsPDF, property: PropertyData, analysis: MarketAnalysis, y: number): number {
  if (!property.cash_offer_amount || !analysis.avgSalePrice) return y;

  const percentDiff = (1 - property.cash_offer_amount / analysis.avgSalePrice) * 100;
  const isBelow = percentDiff > 0;

  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  if (isBelow) {
    doc.setFillColor(220, 252, 231);
    doc.rect(20, y, 55, 8, 'F');
    doc.setTextColor(22, 163, 74);
    doc.text(`${percentDiff.toFixed(1)}% below avg`, 22, y + 6);
  } else {
    doc.setFillColor(254, 226, 226);
    doc.rect(20, y, 55, 8, 'F');
    doc.setTextColor(220, 38, 38);
    doc.text(`${Math.abs(percentDiff).toFixed(1)}% above avg`, 22, y + 6);
  }
  doc.setFont(undefined, 'normal');
  return y + 12;
}

function addOfferCalculator(doc: jsPDF, avgPrice: number, y: number): number {
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Quick Offer Calculator:', 20, y);
  y += 6;

  const cardW = 27, cardH = 14, spacing = 2;
  OFFER_PERCENTAGES.forEach((offer, i) => {
    const x = 20 + i * (cardW + spacing);
    const val = Math.round(avgPrice * offer.percent);
    doc.setFillColor(offer.color[0], offer.color[1], offer.color[2]);
    doc.rect(x, y, cardW, cardH, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.text(offer.label, x + cardW / 2, y + 5, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`$${Math.round(val / 1000)}K`, x + cardW / 2, y + 11, { align: 'center' });
    doc.setFont(undefined, 'normal');
  });

  return y + 20;
}

function addDataSourceBadge(doc: jsPDF, analysis: MarketAnalysis, y: number): number {
  const dataSource = analysis.dataSource || 'database';
  const config = SOURCE_CONFIG[dataSource];

  if (config) {
    doc.setFillColor(config.color[0], config.color[1], config.color[2]);
    doc.rect(140, y - 2, 50, 7, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(config.label, 165, y + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }

  if (analysis.isDemo) {
    doc.setFontSize(6);
    doc.setTextColor(239, 68, 68);
    doc.text('⚠ Demo', 165, y + 8, { align: 'center' });
    y += 3;
  }

  return y;
}

/**
 * Export consolidated PDF with multiple properties
 */
export const exportConsolidatedCompsPDF = async (
  properties: PropertyData[],
  getComparablesForProperty: (property: PropertyData) => Promise<{ comparables: ComparableProperty[]; analysis: MarketAnalysis }>,
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

  for (let i = 0; i < properties.length; i++) {
    const property = validatePropertyData(properties[i]);
    onProgress?.(i + 1, properties.length);

    doc.addPage();
    addHeader(doc, `Property ${i + 1} of ${properties.length}`);
    let currentY = 65;

    // Property info
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Subject Property', 20, currentY);
    currentY += 8;

    doc.setFillColor(249, 250, 251);
    doc.rect(20, currentY, 170, 60, 'F');

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, 'bold');
    const addressLines = doc.splitTextToSize(property.address, 120);
    addressLines.forEach((line: string, idx: number) => doc.text(line, 25, currentY + 8 + idx * 6));

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const offset = (addressLines.length - 1) * 6;
    doc.text(`${property.city}, ${property.state} ${property.zip_code}`, 25, currentY + 15 + offset);
    currentY += offset;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont(undefined, 'bold');
    doc.text(`Current Offer: $${(property.cash_offer_amount || 0).toLocaleString()}`, 25, currentY + 25);
    doc.setFont(undefined, 'normal');

    if (property.min_offer_amount && property.max_offer_amount) {
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Offer Range: $${property.min_offer_amount.toLocaleString()} - $${property.max_offer_amount.toLocaleString()}`, 25, currentY + 32);
    }

    await addPropertyImage(doc, property, currentY);
    currentY += 62;

    try {
      const { comparables, analysis } = await getComparablesForProperty(property);

      currentY = addOfferBadge(doc, property, analysis, currentY);

      // Analysis cards
      const cW = 38, cH = 18, cS = 5;
      [
        { label: 'Estimated Value', value: `$${Math.round((analysis.avgSalePrice || 0) / 1000)}K` },
        { label: 'Avg $/Sqft', value: `$${Math.round(analysis.avgPricePerSqft || 0)}` },
      ].forEach((card, idx) => {
        const x = 20 + idx * (cW + cS);
        doc.setFillColor(239, 246, 255);
        doc.rect(x, currentY, cW, cH, 'F');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(card.label, x + 2, currentY + 5);
        doc.setFontSize(11);
        doc.setTextColor(37, 99, 235);
        doc.text(card.value, x + 2, currentY + 13);
      });

      // Suggested value card (wider)
      const svX = 20 + 2 * (cW + cS);
      doc.setFillColor(239, 246, 255);
      doc.rect(svX, currentY, cW + 20, cH, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Suggested Value', svX + 2, currentY + 5);
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
      doc.text(`$${Math.round((analysis.suggestedValueMin || 0) / 1000)}K - $${Math.round((analysis.suggestedValueMax || 0) / 1000)}K`, svX + 2, currentY + 13);

      currentY += 25;

      if (currentY > 240) {
        doc.addPage();
        addHeader(doc, `Property ${i + 1} of ${properties.length} - Offers`);
        currentY = 65;
      }

      currentY = addOfferCalculator(doc, analysis.avgSalePrice || property.estimated_value || 0, currentY);
      currentY = addDataSourceBadge(doc, analysis, currentY);

      // Comparables table
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Comparable Sales', 20, currentY);
      currentY += 3;

      const tableData = comparables.map((comp, idx) => {
        const addr = comp.address.length > 30 ? comp.address.substring(0, 27) + '...' : comp.address;
        const hasUrl = !!(comp as any).url;
        return [
          `#${idx + 1}`, hasUrl ? addr + ' [link]' : addr,
          format(comp.saleDate, 'MM/dd/yy'),
          `$${Math.round(comp.salePrice / 1000)}K`, comp.sqft.toLocaleString(),
          `$${Math.round(comp.pricePerSqft || 0)}`,
          `${comp.beds}/${comp.baths}`,
          `${((comp as any).distanceMiles || 0).toFixed(1)}mi`,
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Address', 'Date', 'Price', 'Sqft', '$/Sqft', 'Bd/Ba', 'Dist']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [71, 85, 105] },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: { 0: { cellWidth: 5 }, 1: { cellWidth: 44 }, 2: { cellWidth: 17 }, 3: { cellWidth: 15 }, 4: { cellWidth: 13 }, 5: { cellWidth: 13 }, 6: { cellWidth: 11 }, 7: { cellWidth: 9 } },
        margin: { left: 20, right: 20 },
        tableWidth: 127,
        styles: { overflow: 'linebreak', cellPadding: { top: 1, right: 1, bottom: 1, left: 1 }, halign: 'left' },
        didDrawCell: (data: any) => {
          if (data.column.index === 1 && data.section === 'body') {
            const url = (comparables[data.row.index] as any).url;
            if (url) doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url });
          }
        },
      });

      // Mini map
      const finalTableY = (doc as any).lastAutoTable?.finalY || currentY + 40;
      if (finalTableY < 200) {
        try {
          const mapUrl = generateMapboxStaticMap(property, comparables, 400, 200);
          if (mapUrl) {
            const mapImg = await loadImageAsBase64(mapUrl);
            if (mapImg) {
              doc.setFontSize(10);
              doc.setTextColor(15, 23, 42);
              doc.text('Location Map', 20, finalTableY + 8);
              doc.addImage(mapImg, 'PNG', 20, finalTableY + 12, 170, 85);
            }
          }
        } catch { /* skip */ }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes('No valid comparables found')) {
        console.error(`Error processing property ${property.address}:`, error);
      }

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
    }

    addFooter(doc, pageNumber++);
  }

  doc.save(`Consolidated_CMA_${properties.length}_Properties_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
