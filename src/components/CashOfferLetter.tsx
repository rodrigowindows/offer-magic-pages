import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

interface CashOfferLetterProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  cashOffer: number;
  estimatedValue: number;
  propertySlug: string;
  phone?: string;
  email?: string;
  source?: string;
}

export const CashOfferLetter = ({
  address,
  city,
  state,
  zipCode,
  cashOffer,
  estimatedValue,
  propertySlug,
  phone = "786 882 8251",
  email = "info@mylocalinvest.com",
  source = "letter"
}: CashOfferLetterProps) => {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  const offerUrl = `${window.location.origin}/property/${propertySlug}?src=${source}`;
  
  return (
    <Card className="max-w-2xl mx-auto p-8 bg-[#fffef9] border-2 border-border print:border-0 print:shadow-none">
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">CASH OFFER FOR Your Home!</h1>
          <p className="text-lg text-muted-foreground">{fullAddress}</p>
        </div>

        {/* Offer Box */}
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center space-y-2">
          <p className="text-5xl font-bold text-primary">${cashOffer.toLocaleString()}</p>
          <p className="text-lg text-muted-foreground">Cash Offer</p>
          <p className="text-sm text-muted-foreground">
            (Fair Market Value: ${estimatedValue.toLocaleString()})
          </p>
          <p className="text-xl font-semibold text-foreground mt-4">
            No repairs • No fees • Close in 7 days
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">We Help You:</h2>
          <div className="text-xs leading-tight space-y-0" style={{ display: 'block' }}>
            <p style={{ display: 'block', whiteSpace: 'nowrap', pageBreakInside: 'avoid' }}>
              <span className="text-primary">✓</span> Stop tax foreclosure <span className="mx-1">•</span> <span className="text-primary">✓</span> Pay off your tax debt
            </p>
            <p style={{ display: 'block', whiteSpace: 'nowrap', pageBreakInside: 'avoid' }}>
              <span className="text-primary">✓</span> Sell as-is (any condition) <span className="mx-1">•</span> <span className="text-primary">✓</span> You pick the date
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-accent/20 border-2 border-accent rounded-lg p-6 text-center space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Just Reply "YES"</h2>
          <p className="text-xl">
            Call: <span className="font-bold text-primary">{phone}</span>
          </p>
          <p className="text-base text-muted-foreground">
            We'll send your official offer in writing — no pressure, no cost.
          </p>
          
          {/* QR Code - Only visible in print */}
          <div className="hidden print:block mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Scan to view your offer online:</p>
            <div className="flex justify-center">
              <QRCodeSVG value={offerUrl} size={120} level="H" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{offerUrl}</p>
          </div>
        </div>


        {/* Footer */}
        <div 
          className="text-center space-y-1 pt-3 border-t-2 border-border" 
          style={{ 
            pageBreakInside: 'avoid', 
            breakInside: 'avoid',
            display: 'block'
          }}
        >
          <h3 className="text-xl font-bold text-foreground">MyLocalInvest</h3>
          <p className="text-sm text-muted-foreground">Miami locals since 2015</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <p 
            className="text-xs italic text-muted-foreground pt-1" 
            style={{ 
              whiteSpace: 'nowrap', 
              wordBreak: 'keep-all',
              pageBreakInside: 'avoid',
              pageBreakBefore: 'avoid',
              pageBreakAfter: 'avoid'
            }}
          >
            Zero commissions. Zero closing costs. 100% confidential.
          </p>
        </div>
        <style>{`
          @media print {
            .text-center.space-y-2.pt-4 {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .text-center.space-y-2.pt-4 p {
              page-break-before: avoid !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
          }
        `}</style>
      </div>
    </Card>
  );
};
