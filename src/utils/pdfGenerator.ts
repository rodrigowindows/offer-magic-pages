/**
 * PDF Offer Generator
 * Generates professional PDF offers for property owners
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PropertyData {
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  offerAmount: number;
  estimatedValue?: number;
  closingDays: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
}

interface OfferPDFOptions {
  property: PropertyData;
  recipientName?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  companyName?: string;
  offerDate?: Date;
  expirationDate?: Date;
}

export const generatePropertyOfferPDF = async (options: OfferPDFOptions): Promise<Blob> => {
  const {
    property,
    recipientName = 'Property Owner',
    agentName = 'Your Local Cash Buyer',
    agentPhone = '(555) 123-4567',
    agentEmail = 'offers@localcashbuyer.com',
    companyName = 'Local Cash Buyer',
    offerDate = new Date(),
    expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  } = options;

  // Create new PDF document
  const pdf = new jsPDF();

  // Set up colors and fonts
  const primaryColor: [number, number, number] = [16, 185, 129]; // Green
  const secondaryColor: [number, number, number] = [55, 65, 81]; // Gray-700
  const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  let yPosition = 20;

  // Header with company branding
  pdf.setFillColor(...primaryColor);
  pdf.rect(0, 0, 210, 40, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(companyName, 20, 25);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Cash Offers for Property Owners', 20, 35);

  yPosition = 60;

  // Offer amount highlight
  pdf.setFillColor(...lightGray);
  pdf.rect(20, yPosition - 10, 170, 30, 'F');

  pdf.setTextColor(...primaryColor);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CASH OFFER AMOUNT', 25, yPosition);

  pdf.setFontSize(28);
  pdf.text(formatCurrency(property.offerAmount), 25, yPosition + 15);

  yPosition += 50;

  // Property information
  pdf.setTextColor(...secondaryColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Property Information', 20, yPosition);

  yPosition += 10;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Address: ${property.address}`, 20, yPosition);
  yPosition += 8;
  pdf.text(`City: ${property.city}, ${property.state} ${property.zipCode || ''}`, 20, yPosition);
  yPosition += 8;

  if (property.propertyType) {
    pdf.text(`Property Type: ${property.propertyType}`, 20, yPosition);
    yPosition += 8;
  }

  if (property.bedrooms || property.bathrooms || property.squareFeet) {
    const details = [];
    if (property.bedrooms) details.push(`${property.bedrooms} Bedrooms`);
    if (property.bathrooms) details.push(`${property.bathrooms} Bathrooms`);
    if (property.squareFeet) details.push(`${property.squareFeet.toLocaleString()} Sq Ft`);
    pdf.text(`Details: ${details.join(' • ')}`, 20, yPosition);
    yPosition += 8;
  }

  yPosition += 10;

  // Key benefits section
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Benefits of Our Cash Offer', 20, yPosition);

  yPosition += 15;

  const benefits = [
    { icon: '⏱️', title: `Close in ${property.closingDays} Days`, description: 'Fast closing guaranteed' },
    { icon: '🛡️', title: 'No Repairs Needed', description: 'We buy as-is' },
    { icon: '🏠', title: 'No Realtor Fees', description: 'Save thousands in commissions' },
    { icon: '✅', title: 'Cash Buyer', description: 'No financing contingencies' }
  ];

  benefits.forEach((benefit, index) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${benefit.icon} ${benefit.title}`, 25, yPosition);

    pdf.setFont('helvetica', 'normal');
    pdf.text(benefit.description, 25, yPosition + 6);

    yPosition += 20;
  });

  yPosition += 10;

  // Savings calculation
  if (property.estimatedValue && property.estimatedValue > property.offerAmount) {
    const savings = property.estimatedValue - property.offerAmount;

    pdf.setFillColor(...primaryColor);
    pdf.rect(20, yPosition - 5, 170, 20, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`💰 SAVE ${formatCurrency(savings)} vs. Traditional Selling!`, 25, yPosition + 5);

    yPosition += 30;
  }

  // Terms and conditions
  pdf.setTextColor(...secondaryColor);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Terms & Conditions', 20, yPosition);

  yPosition += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const terms = [
    `• This cash offer of ${formatCurrency(property.offerAmount)} is valid until ${formatDate(expirationDate)}`,
    '• Offer is subject to satisfactory property inspection and clear title',
    '• All cash offers are made by licensed real estate investors',
    '• Closing costs and fees will be discussed during due diligence',
    '• Property must be vacant or tenant must be given proper notice',
    '• This offer does not include any personal property unless specifically stated'
  ];

  terms.forEach(term => {
    pdf.text(term, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Next steps
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Next Steps', 20, yPosition);

  yPosition += 15;

  const steps = [
    '1. Review and accept this offer',
    '2. Schedule property inspection (1-2 days)',
    '3. Complete due diligence and title search',
    `4. Close in ${property.closingDays} days and receive payment`
  ];

  steps.forEach(step => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(step, 25, yPosition);
    yPosition += 8;
  });

  yPosition += 20;

  // Contact information
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Information', 20, yPosition);

  yPosition += 12;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Agent: ${agentName}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Phone: ${agentPhone}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Email: ${agentEmail}`, 20, yPosition);
  yPosition += 6;
  pdf.text(`Offer Date: ${formatDate(offerDate)}`, 20, yPosition);

  yPosition += 20;

  // Signature line
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Offer Acceptance', 20, yPosition);

  yPosition += 15;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Property Owner Signature: ___________________________ Date: __________', 20, yPosition);

  yPosition += 20;

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This document is confidential and intended only for the property owner. All offers are subject to change.', 20, yPosition);
  yPosition += 5;
  pdf.text('© 2024 Local Cash Buyer. All rights reserved.', 20, yPosition);

  // Return the PDF as a Blob
  return pdf.output('blob');
};

// Utility function to download the PDF
export const downloadPropertyOfferPDF = async (options: OfferPDFOptions, filename?: string): Promise<void> => {
  const pdfBlob = await generatePropertyOfferPDF(options);

  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `cash-offer-${options.property.address.replace(/\s+/g, '-').toLowerCase()}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};