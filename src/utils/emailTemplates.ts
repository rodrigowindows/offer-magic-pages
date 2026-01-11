/**
 * Property Offer Email Template
 * HTML email template for property cash offers
 */

interface EmailTemplateProps {
  property: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
    offerAmount: number;
    closingDays: number;
    propertyType?: string;
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
  };
  recipientName?: string;
  trackingUrl?: string;
  acceptUrl?: string;
  questionsUrl?: string;
  pdfUrl?: string;
  propertyUrl?: string;
  qrCodeUrl?: string;
}

export const generatePropertyOfferEmail = ({
  property,
  recipientName = 'Property Owner',
  trackingUrl = '#',
  acceptUrl = '#',
  questionsUrl = '#',
  pdfUrl = '#',
  propertyUrl,
  qrCodeUrl
}: EmailTemplateProps): string => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Create property slug for URL if not provided
  const createPropertySlug = (address: string, city: string) => {
    return `${address.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')}-${city.toLowerCase()}`;
  };

  const propertySlug = createPropertySlug(property.address, property.city);
  const offerUrl = propertyUrl || `${window.location.origin}/property/${propertySlug}?src=email`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cash Offer for Your Property</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
        }
        .container {
            background-color: white;
            margin: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .offer-amount {
            font-size: 48px;
            font-weight: bold;
            margin: 10px 0;
        }
        .property-address {
            font-size: 18px;
            margin: 10px 0;
        }
        .content {
            padding: 30px 20px;
        }
        .benefits-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .benefit-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #10b981;
        }
        .benefit-icon {
            width: 24px;
            height: 24px;
            margin-right: 12px;
            color: #10b981;
        }
        .benefit-text h4 {
            margin: 0 0 4px 0;
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }
        .benefit-text p {
            margin: 0;
            font-size: 14px;
            color: #6b7280;
        }
        .cta-button {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            text-align: center;
            margin: 20px 0;
            width: 100%;
            box-sizing: border-box;
        }
        .secondary-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 20px 0;
        }
        .secondary-button {
            display: inline-block;
            background-color: #f3f4f6;
            color: #374151;
            padding: 12px 20px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            text-align: center;
            border: 1px solid #d1d5db;
        }
        .property-details {
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .property-details h4 {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
        }
        .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
        }
        .detail-item {
            text-align: center;
        }
        .detail-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
        }
        .next-steps {
            background-color: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .next-steps h4 {
            margin: 0 0 15px 0;
            color: #1e40af;
            font-size: 18px;
        }
        .step {
            display: flex;
            align-items: flex-start;
            margin-bottom: 12px;
        }
        .step-number {
            background-color: #3b82f6;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            margin-right: 12px;
            flex-shrink: 0;
        }
        .step-content h5 {
            margin: 0 0 2px 0;
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
        }
        .step-content p {
            margin: 0;
            font-size: 13px;
            color: #6b7280;
        }
        .qr-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
        }
        .qr-code {
            margin: 20px 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .footer p {
            margin: 5px 0;
        }
        .tracking-pixel {
            display: none;
        }
        @media (max-width: 600px) {
            .benefits-grid {
                grid-template-columns: 1fr;
            }
            .secondary-buttons {
                grid-template-columns: 1fr;
            }
            .offer-amount {
                font-size: 36px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">💰</span>
            </div>
            <div class="offer-amount">${formatCurrency(property.offerAmount)}</div>
            <div class="property-address">
                ${property.address}<br>
                ${property.city}, ${property.state} ${property.zipCode || ''}
            </div>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Cash Offer for Your Property</p>
        </div>

        <div class="content">
            <p>Dear ${recipientName},</p>

            <p>We're excited to present you with a <strong>cash offer</strong> for your property. We've reviewed the market data and are ready to move forward quickly.</p>

            <div class="benefits-grid">
                <div class="benefit-item">
                    <div class="benefit-icon">⏱️</div>
                    <div class="benefit-text">
                        <h4>Close in ${property.closingDays} Days</h4>
                        <p>Fast closing guaranteed</p>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">🛡️</div>
                    <div class="benefit-text">
                        <h4>No Repairs Needed</h4>
                        <p>We buy as-is</p>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">🏠</div>
                    <div class="benefit-text">
                        <h4>No Realtor Fees</h4>
                        <p>Save thousands</p>
                    </div>
                </div>

                <div class="benefit-item">
                    <div class="benefit-icon">✅</div>
                    <div class="benefit-text">
                        <h4>Cash Buyer</h4>
                        <p>No financing contingencies</p>
                    </div>
                </div>
            </div>

            ${property.propertyType || property.bedrooms || property.bathrooms || property.squareFeet ? `
            <div class="property-details">
                <h4>🏠 Property Details</h4>
                <div class="details-grid">
                    ${property.propertyType ? `<div class="detail-item">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${property.propertyType}</div>
                    </div>` : ''}
                    ${property.bedrooms ? `<div class="detail-item">
                        <div class="detail-label">Bedrooms</div>
                        <div class="detail-value">${property.bedrooms}</div>
                    </div>` : ''}
                    ${property.bathrooms ? `<div class="detail-item">
                        <div class="detail-label">Bathrooms</div>
                        <div class="detail-value">${property.bathrooms}</div>
                    </div>` : ''}
                    ${property.squareFeet ? `<div class="detail-item">
                        <div class="detail-label">Sq Ft</div>
                        <div class="detail-value">${property.squareFeet.toLocaleString()}</div>
                    </div>` : ''}
                </div>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
                <a href="${acceptUrl}" class="cta-button" style="color: white; text-decoration: none;">
                    ✅ Accept This Offer
                </a>
            </div>

            <div class="secondary-buttons">
                <a href="${questionsUrl}" class="secondary-button" style="color: #374151; text-decoration: none;">
                    📞 I Have Questions
                </a>
                <a href="${pdfUrl}" class="secondary-button" style="color: #374151; text-decoration: none;">
                    📄 Download PDF
                </a>
            </div>

            <!-- QR Code and Property Link Section -->
            <div class="qr-section">
                <h4 style="margin: 0 0 10px 0; color: #1f2937;">Scan to view your personalized offer page:</h4>
                ${qrCodeUrl ? `
                <div class="qr-code">
                    <img src="${qrCodeUrl}" alt="QR Code for offer page" style="max-width: 150px; height: auto;" />
                </div>
                ` : ''}
                <p style="margin: 10px 0; color: #6b7280;">Or click here:</p>
                <a href="${offerUrl}" style="color: #3b82f6; text-decoration: underline; word-break: break-all;">
                    View Full Offer Details
                </a>
            </div>

            <div class="next-steps">
                <h4>📋 Next Steps</h4>
                <div class="step">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h5>Accept the offer</h5>
                        <p>Click "Accept This Offer" above</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h5>Property inspection</h5>
                        <p>We'll schedule a quick walkthrough</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h5>Title search & closing</h5>
                        <p>Fast ${property.closingDays}-day closing process</p>
                    </div>
                </div>
                <div class="step">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h5>Get paid</h5>
                        <p>Cash payment at closing</p>
                    </div>
                </div>
            </div>

            <p style="margin-top: 30px;">This offer is valid for 30 days. Contact us immediately if you have any questions or would like to discuss the details.</p>

            <p>Best regards,<br>
            Your Local Cash Buyer Team</p>
        </div>

        <div class="footer">
            <p>This offer is subject to property inspection and title search.</p>
            <p>All information is confidential and for the intended recipient only.</p>
            <p>© 2024 Local Cash Buyer. All rights reserved.</p>
        </div>
    </div>

    <!-- Tracking pixel -->
    <img src="${trackingUrl}" class="tracking-pixel" alt="" />
</body>
</html>`;
}