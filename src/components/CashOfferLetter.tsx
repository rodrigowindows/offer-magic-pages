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
    cashOffer: "Your Cash Offer Awaits",
    fairMarketValue: "",
    urgency: "This offer is valid for 14 days",
    weHelpYou: "Why Sell to Us?",
    benefit1: "Stop tax foreclosure",
    benefit2: "Pay off your tax debt",
    benefit3: "Sell as-is (any condition)",
    benefit4: "You pick the closing date",
    cta: "Get Your Cash Offer Now",
    ctaDescription: "Call now for your free, no-obligation consultation",
    orText: "or scan the QR code below",
    scanToView: "Scan for instant offer details",
    qrCallout: "Scan Now for Your Exclusive Offer",
    qrSubtext: "Instant Access • No Email Required",
    since: "Trusted Miami Investors Since 2015 • 500+ Happy Homeowners",
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
    cashOffer: "Su Oferta en Efectivo le Espera",
    fairMarketValue: "",
    urgency: "Esta oferta es válida por 14 días",
    weHelpYou: "¿Por Qué Vendernos?",
    benefit1: "Detener la ejecución fiscal",
    benefit2: "Pagar su deuda de impuestos",
    benefit3: "Vender tal como está",
    benefit4: "Usted elige la fecha de cierre",
    cta: "Obtenga Su Oferta Ahora",
    ctaDescription: "Llame ahora para su consulta gratuita y sin compromiso",
    orText: "o escanee el código QR abajo",
    scanToView: "Escanee para ver detalles",
    qrCallout: "Escanee Ahora para Su Oferta Exclusiva",
    qrSubtext: "Acceso Instantáneo • Sin Email Requerido",
    since: "Inversionistas de Miami Desde 2015 • 500+ Propietarios Satisfechos",
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

  // Format phone number for better readability
  const formatPhone = (phoneNumber: string | null | undefined): string => {
    if (!phoneNumber) return "786 882 8251"; // Default phone
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  };
  const formattedPhone = formatPhone(phone);

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
    <div className="print:scale-[3.3] print:origin-top-left print:w-[30.3%]">
      <Card className="max-w-2xl mx-auto bg-background border-2 border-primary/20 print:border-0 print:shadow-none overflow-hidden">
        {/* Professional Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 print:p-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Home className="h-6 w-6 print:h-8 print:w-8" />
          <span className="text-xl print:text-2xl font-bold tracking-wide">MyLocalInvest</span>
        </div>
        <p className="text-sm print:text-base opacity-90">{t.since}</p>
      </div>

      <div className="p-6 space-y-5 print:p-6 print:space-y-4">
        {/* Personalized Greeting & Property */}
        <div className="text-center space-y-1">
          {ownerName && (
            <p className="text-lg print:text-xl text-muted-foreground">{t.dear} {ownerName},</p>
          )}
          <h1 className="text-2xl print:text-3xl font-bold text-foreground">{t.headline}</h1>
          <p className="text-base print:text-lg text-muted-foreground">{t.subheadline}</p>
          <p className="text-sm print:text-base font-medium text-primary mt-2">{fullAddress}</p>
        </div>

        {/* Main Offer Box with Urgency - NO PRICE SHOWN */}
        <div className="relative bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary rounded-xl p-5 print:p-6 text-center">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs print:text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3 print:h-4 print:w-4" />
            {t.urgency}
          </div>

          <p className="text-lg print:text-xl text-muted-foreground mb-1 mt-4">{t.cashOffer}</p>
          <p className="text-3xl print:text-4xl font-black text-primary mt-3 mb-4">
            {language === 'es' ? 'Llame o Escanee para Ver Su Oferta' : 'Call or Scan to See Your Offer'}
          </p>
        </div>

        {/* Trust Badges Row */}
        <div className="grid grid-cols-3 gap-2 print:gap-4 text-center">
          <div className="bg-muted/50 rounded-lg p-2 print:p-3">
            <Clock className="h-4 w-4 print:h-6 print:w-6 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-sm font-medium text-foreground">{t.fastClose}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 print:p-3">
            <Shield className="h-4 w-4 print:h-6 print:w-6 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-sm font-medium text-foreground">{t.guarantee}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 print:p-3">
            <CheckCircle2 className="h-4 w-4 print:h-6 print:w-6 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-sm font-medium text-foreground">{t.noCost}</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-1 print:space-y-2">
          <h2 className="text-sm print:text-base font-bold text-foreground text-center">{t.weHelpYou}</h2>
          <div className="grid grid-cols-2 gap-1 print:gap-2 text-xs print:text-sm">
            <div className="flex items-center gap-1 print:gap-2">
              <CheckCircle2 className="h-3 w-3 print:h-4 print:w-4 text-primary shrink-0" />
              <span>{t.benefit1}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-2">
              <CheckCircle2 className="h-3 w-3 print:h-4 print:w-4 text-primary shrink-0" />
              <span>{t.benefit2}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-2">
              <CheckCircle2 className="h-3 w-3 print:h-4 print:w-4 text-primary shrink-0" />
              <span>{t.benefit3}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-2">
              <CheckCircle2 className="h-3 w-3 print:h-4 print:w-4 text-primary shrink-0" />
              <span>{t.benefit4}</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-muted/30 border border-border rounded-lg p-3 print:p-4 text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3 w-3 print:h-4 print:w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs print:text-sm italic text-muted-foreground">{t.testimonial}</p>
          <p className="text-xs print:text-sm font-medium text-foreground mt-1">{t.testimonialAuthor}</p>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-xl p-4 print:p-5 text-center space-y-2 print:space-y-3">
          <h2 className="text-xl print:text-2xl font-bold">{t.cta}</h2>

          {/* Phone Number - HIGHLIGHTED */}
          <div className="bg-white/10 rounded-lg py-3 px-4 print:py-4 print:px-6">
            <div className="flex items-center justify-center gap-3 text-3xl print:text-4xl font-extrabold tracking-wide">
              <Phone className="h-8 w-8 print:h-10 print:w-10" />
              <span>{formattedPhone}</span>
            </div>
          </div>

          <p className="text-sm print:text-base opacity-90 font-medium">{t.ctaDescription}</p>

          {/* QR Code */}
          <div className="pt-3 border-t border-primary-foreground/20 mt-3">
            <p className="text-sm opacity-90 mb-3 font-medium">{t.orText}</p>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-lg shadow-lg">
                <QRCodeSVG value={offerUrl} size={144} level="H" />
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm font-bold text-primary-foreground">{t.qrCallout}</p>
                <p className="text-xs opacity-75 mt-1">{t.qrSubtext}</p>
              </div>
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
