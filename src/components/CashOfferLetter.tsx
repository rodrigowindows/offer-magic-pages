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
  ownerName?: string;
  language?: "en" | "es";
}

const content = {
  en: {
    headline: "CASH OFFER FOR Your Home!",
    cashOffer: "Cash Offer",
    fairMarketValue: "Fair Market Value",
    benefits: "No repairs • No fees • Close in 7 days",
    weHelpYou: "We Help You:",
    benefit1: "Stop tax foreclosure",
    benefit2: "Pay off your tax debt",
    benefit3: "Sell as-is (any condition)",
    benefit4: "You pick the date",
    cta: 'Just Reply "YES"',
    call: "Call",
    ctaDescription: "We'll send your official offer in writing — no pressure, no cost.",
    scanToView: "Scan to view your offer online:",
    since: "Miami locals since 2015",
    footer: "Zero commissions. Zero closing costs. 100% confidential.",
    dear: "Dear",
  },
  es: {
    headline: "¡OFERTA EN EFECTIVO Para Su Casa!",
    cashOffer: "Oferta en Efectivo",
    fairMarketValue: "Valor de Mercado",
    benefits: "Sin reparaciones • Sin comisiones • Cierre en 7 días",
    weHelpYou: "Le Ayudamos a:",
    benefit1: "Detener la ejecución fiscal",
    benefit2: "Pagar su deuda de impuestos",
    benefit3: "Vender tal como está",
    benefit4: "Usted elige la fecha",
    cta: 'Responda "SÍ"',
    call: "Llame",
    ctaDescription: "Le enviaremos su oferta oficial por escrito — sin presión, sin costo.",
    scanToView: "Escanee para ver su oferta en línea:",
    since: "Locales de Miami desde 2015",
    footer: "Cero comisiones. Cero costos de cierre. 100% confidencial.",
    dear: "Estimado/a",
  },
};

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
  source = "letter",
  ownerName,
  language = "en",
}: CashOfferLetterProps) => {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  const offerUrl = `${window.location.origin}/property/${propertySlug}?src=${source}`;
  const t = content[language];
  
  return (
    <Card className="max-w-2xl mx-auto p-8 bg-[#fffef9] border-2 border-border print:border-0 print:shadow-none">
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="text-center space-y-2">
          {ownerName && (
            <p className="text-lg text-muted-foreground">{t.dear} {ownerName},</p>
          )}
          <h1 className="text-3xl font-bold text-foreground">{t.headline}</h1>
          <p className="text-lg text-muted-foreground">{fullAddress}</p>
        </div>

        {/* Offer Box */}
        <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center space-y-2">
          <p className="text-5xl font-bold text-primary">${cashOffer.toLocaleString()}</p>
          <p className="text-lg text-muted-foreground">{t.cashOffer}</p>
          <p className="text-sm text-muted-foreground">
            ({t.fairMarketValue}: ${estimatedValue.toLocaleString()})
          </p>
          <p className="text-xl font-semibold text-foreground mt-4">
            {t.benefits}
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-1">
          <h2 className="text-base font-bold text-foreground">{t.weHelpYou}</h2>
          <div className="text-xs leading-tight space-y-0" style={{ display: 'block' }}>
            <p style={{ display: 'block', whiteSpace: 'nowrap', pageBreakInside: 'avoid' }}>
              <span className="text-primary">✓</span> {t.benefit1} <span className="mx-1">•</span> <span className="text-primary">✓</span> {t.benefit2}
            </p>
            <p style={{ display: 'block', whiteSpace: 'nowrap', pageBreakInside: 'avoid' }}>
              <span className="text-primary">✓</span> {t.benefit3} <span className="mx-1">•</span> <span className="text-primary">✓</span> {t.benefit4}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-accent/20 border-2 border-accent rounded-lg p-6 text-center space-y-3">
          <h2 className="text-2xl font-bold text-foreground">{t.cta}</h2>
          <p className="text-xl">
            {t.call}: <span className="font-bold text-primary">{phone}</span>
          </p>
          <p className="text-base text-muted-foreground">
            {t.ctaDescription}
          </p>
          
          {/* QR Code */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">{t.scanToView}</p>
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
          <p className="text-sm text-muted-foreground">{t.since}</p>
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
            {t.footer}
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
