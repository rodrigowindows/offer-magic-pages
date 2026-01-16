import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Clock, CheckCircle2, Home, Phone, Star } from "lucide-react";
import { formatOffer, getOfferType, getOfferAverage } from "@/utils/offerUtils";
import type { OfferConfig } from "./OfferConfiguration";

interface CashOfferLetterProps {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  offerConfig?: OfferConfig;
  // Legacy props for backward compatibility
  cashOffer?: number;
  minOffer?: number;
  maxOffer?: number;
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
    headline: "We Want to Buy Your Home",
    subheadline: "No Repairs • No Fees • Close When You Want",
    cashOffer: "Your Cash Offer",
    fairMarketValue: "Market Value",
    urgency: "This offer is valid for 14 days",
    weHelpYou: "Why Sell to Us?",
    benefit1: "Stop tax foreclosure",
    benefit2: "Pay off your tax debt",
    benefit3: "Sell as-is (any condition)",
    benefit4: "You pick the closing date",
    cta: "Claim Your Cash Offer Today",
    ctaDescription: "Call now for your free, no-obligation consultation",
    orText: "or scan to view online",
    scanToView: "Scan for instant offer details",
    since: "Trusted Miami Investors Since 2015",
    footer: "Zero commissions • Zero closing costs • 100% confidential",
    dear: "Dear",
    guarantee: "100% Free, No Obligation",
    testimonial: '"They made selling my home so easy. Closed in just 10 days!"',
    testimonialAuthor: "— Maria G., Homeowner",
    fastClose: "Close in as few as 7 days",
    noCost: "We cover ALL closing costs",
  },
  es: {
    headline: "Queremos Comprar Su Casa",
    subheadline: "Sin Reparaciones • Sin Comisiones • Cierre Cuando Quiera",
    cashOffer: "Su Oferta en Efectivo",
    fairMarketValue: "Valor de Mercado",
    urgency: "Esta oferta es válida por 14 días",
    weHelpYou: "¿Por Qué Vendernos?",
    benefit1: "Detener la ejecución fiscal",
    benefit2: "Pagar su deuda de impuestos",
    benefit3: "Vender tal como está",
    benefit4: "Usted elige la fecha de cierre",
    cta: "Reclame Su Oferta Hoy",
    ctaDescription: "Llame ahora para su consulta gratuita y sin compromiso",
    orText: "o escanee para ver en línea",
    scanToView: "Escanee para ver detalles",
    since: "Inversionistas de Miami Desde 2015",
    footer: "Cero comisiones • Cero costos de cierre • 100% confidencial",
    dear: "Estimado/a",
    guarantee: "100% Gratis, Sin Compromiso",
    testimonial: '"Hicieron que vender mi casa fuera muy fácil. ¡Cerrado en solo 10 días!"',
    testimonialAuthor: "— María G., Propietaria",
    fastClose: "Cierre en tan solo 7 días",
    noCost: "Cubrimos TODOS los costos de cierre",
  },
};

export const CashOfferLetter = ({
  address,
  city,
  state,
  zipCode,
  offerConfig,
  // Legacy props
  cashOffer,
  minOffer,
  maxOffer,
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

  // Use new offer config or fallback to legacy props
  const currentOfferConfig = offerConfig || {
    type: (minOffer && maxOffer) ? 'range' : 'fixed',
    fixedAmount: cashOffer,
    rangeMin: minOffer,
    rangeMax: maxOffer,
    estimatedValue: estimatedValue,
  };

  // Create property object for offer formatting
  const property = {
    cash_offer_amount: currentOfferConfig.fixedAmount,
    min_offer_amount: currentOfferConfig.rangeMin,
    max_offer_amount: currentOfferConfig.rangeMax
  };
  const offerType = getOfferType(property);
  const averageOffer = getOfferAverage(property);
  const savings = estimatedValue - averageOffer;
  
  return (
    <div className="print:scale-[3.5] print:origin-top-left print:w-[28.57%]">
      <Card className="max-w-2xl mx-auto bg-background border-2 border-primary/20 print:border-0 print:shadow-none overflow-hidden">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="h-6 w-6" />
          <span className="text-xl font-bold tracking-wide">MyLocalInvest</span>
        </div>
        <p className="text-sm opacity-90">{t.since}</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Personalized Greeting & Property */}
        <div className="text-center space-y-1">
          {ownerName && (
            <p className="text-lg text-muted-foreground">{t.dear} {ownerName},</p>
          )}
          <h1 className="text-2xl font-bold text-foreground">{t.headline}</h1>
          <p className="text-base text-muted-foreground">{t.subheadline}</p>
          <p className="text-sm font-medium text-primary mt-2">{fullAddress}</p>
        </div>

        {/* Main Offer Box with Urgency */}
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary rounded-xl p-5 text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {t.urgency}
          </div>

          <p className="text-sm text-muted-foreground mb-1 mt-2">{t.cashOffer}</p>
          <p className="text-5xl font-black text-primary">{formatOffer(property)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t.fairMarketValue}: ${estimatedValue.toLocaleString()}
          </p>
        </div>

        {/* Trust Badges Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium text-foreground">{t.fastClose}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <Shield className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium text-foreground">{t.guarantee}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <CheckCircle2 className="h-4 w-4 mx-auto text-primary mb-1" />
            <p className="text-xs font-medium text-foreground">{t.noCost}</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-foreground text-center">{t.weHelpYou}</h2>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
              <span>{t.benefit1}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
              <span>{t.benefit2}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
              <span>{t.benefit3}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
              <span>{t.benefit4}</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-xs italic text-muted-foreground">{t.testimonial}</p>
          <p className="text-xs font-medium text-foreground mt-1">{t.testimonialAuthor}</p>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-xl p-4 text-center space-y-2">
          <h2 className="text-lg font-bold">{t.cta}</h2>
          <div className="flex items-center justify-center gap-2 text-xl font-bold">
            <Phone className="h-5 w-5" />
            {phone}
          </div>
          <p className="text-xs opacity-90">{t.ctaDescription}</p>
          
          {/* QR Code */}
          <div className="pt-2 border-t border-primary-foreground/20 mt-3">
            <p className="text-xs opacity-75 mb-2">{t.orText}</p>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeSVG value={offerUrl} size={80} level="H" />
              </div>
              <a
                href={offerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow text-xs mt-1"
              >
                View Full Offer Details
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center pt-3 border-t border-border"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <p className="text-xs text-muted-foreground">{email}</p>
          <p className="text-xs italic text-muted-foreground mt-1">{t.footer}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .bg-gradient-to-r,
          .bg-gradient-to-br,
          .bg-primary,
          .bg-muted,
          .bg-muted\\/50,
          .bg-muted\\/30 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      </Card>
    </div>
  );
};
