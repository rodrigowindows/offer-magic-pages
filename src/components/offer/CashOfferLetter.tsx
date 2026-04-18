import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Clock, CheckCircle2, Home, Phone, Star } from "lucide-react";
import { formatOffer, getOfferType, getOfferAverage } from "@/utils/offerUtils";
import { formatPhone } from "@/utils/formatters";
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
  // Recipient mailing block (envelope-style). Falls back to property address when missing.
  mailingAddress?: string | null;
  mailingCity?: string | null;
  mailingState?: string | null;
  mailingZip?: string | null;
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
    since: "Trusted Florida Investors Since 2015 • 500+ Happy Homeowners",
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
    since: "Inversionistas de Florida Desde 2015 • 500+ Propietarios Satisfechos",
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

  const formattedPhone = formatPhone(phone) || "786 882 8251";

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
    <div className="cash-offer-letter-wrapper print:w-full print:mx-auto">
      <Card className="cash-offer-letter-card max-w-2xl mx-auto bg-background border-2 border-primary/20 print:border-0 print:shadow-none overflow-hidden">
        {/* Professional Header */}
        <div className="letter-header bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 print:py-2.5 print:px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Home className="h-6 w-6 print:h-6 print:w-6" />
          <span className="text-xl print:text-xl font-bold tracking-wide">MyLocalInvest</span>
        </div>
        <p className="text-sm print:text-sm opacity-90">{t.since}</p>
      </div>

      <div className="p-6 space-y-5 print:px-6 print:py-3 print:space-y-2.5">
        {/* Personalized Greeting & Property */}
        <div className="text-center space-y-1 print:space-y-0.5">
          {ownerName && (
            <p className="text-lg print:text-lg text-muted-foreground">{t.dear} {ownerName},</p>
          )}
          <h1 className="text-2xl print:text-2xl font-bold text-foreground">{t.headline}</h1>
          <p className="text-base print:text-base text-muted-foreground">{t.subheadline}</p>
          <p className="text-sm print:text-sm font-medium text-primary mt-2 print:mt-1">{fullAddress}</p>
        </div>

        {/* Main Offer Box with Urgency - NO PRICE SHOWN */}
        <div className="letter-offer-box relative bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary rounded-xl p-5 print:p-3 print:pt-4 text-center">
          <div className="letter-urgency absolute -top-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs print:text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3 print:h-3.5 print:w-3.5" />
            {t.urgency}
          </div>

          <p className="text-lg print:text-base text-muted-foreground mb-1 mt-4 print:mt-2">{t.cashOffer}</p>
          <p className="text-3xl print:text-2xl font-black text-primary mt-3 mb-4 print:mt-1 print:mb-2">
            {language === 'es' ? 'Llame o Escanee para Ver Su Oferta' : 'Call or Scan to See Your Offer'}
          </p>
        </div>

        {/* Trust Badges Row */}
        <div className="grid grid-cols-3 gap-2 print:gap-2 text-center">
          <div className="letter-trust-badge bg-muted/50 rounded-lg p-2 print:p-2">
            <Clock className="h-4 w-4 print:h-5 print:w-5 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-xs font-medium text-foreground">{t.fastClose}</p>
          </div>
          <div className="letter-trust-badge bg-muted/50 rounded-lg p-2 print:p-2">
            <Shield className="h-4 w-4 print:h-5 print:w-5 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-xs font-medium text-foreground">{t.guarantee}</p>
          </div>
          <div className="letter-trust-badge bg-muted/50 rounded-lg p-2 print:p-2">
            <CheckCircle2 className="h-4 w-4 print:h-5 print:w-5 mx-auto text-primary mb-1" />
            <p className="text-xs print:text-xs font-medium text-foreground">{t.noCost}</p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="space-y-1 print:space-y-1">
          <h2 className="text-sm print:text-sm font-bold text-foreground text-center">{t.weHelpYou}</h2>
          <div className="grid grid-cols-2 gap-1 print:gap-1.5 text-xs print:text-sm">
            <div className="flex items-center gap-1 print:gap-1.5">
              <CheckCircle2 className="h-3 w-3 print:h-3.5 print:w-3.5 text-primary shrink-0" />
              <span>{t.benefit1}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-1.5">
              <CheckCircle2 className="h-3 w-3 print:h-3.5 print:w-3.5 text-primary shrink-0" />
              <span>{t.benefit2}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-1.5">
              <CheckCircle2 className="h-3 w-3 print:h-3.5 print:w-3.5 text-primary shrink-0" />
              <span>{t.benefit3}</span>
            </div>
            <div className="flex items-center gap-1 print:gap-1.5">
              <CheckCircle2 className="h-3 w-3 print:h-3.5 print:w-3.5 text-primary shrink-0" />
              <span>{t.benefit4}</span>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="letter-testimonial bg-muted/30 border border-border rounded-lg p-3 print:p-2 text-center">
          <div className="flex justify-center gap-0.5 mb-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="letter-star h-3 w-3 print:h-3.5 print:w-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <p className="text-xs print:text-sm italic text-muted-foreground">{t.testimonial}</p>
          <p className="text-xs print:text-sm font-medium text-foreground mt-1">{t.testimonialAuthor}</p>
        </div>

        {/* CTA Section */}
        <div className="letter-cta bg-primary text-primary-foreground rounded-xl p-4 print:p-3 text-center space-y-2 print:space-y-1.5">
          <h2 className="text-xl print:text-xl font-bold">{t.cta}</h2>

          {/* Phone Number - HIGHLIGHTED */}
          <div className="letter-phone-box bg-white/10 rounded-lg py-3 px-4 print:py-2 print:px-4">
            <div className="flex items-center justify-center gap-3 text-3xl print:text-3xl font-extrabold tracking-wide">
              <Phone className="h-8 w-8 print:h-7 print:w-7" />
              <span>{formattedPhone}</span>
            </div>
          </div>

          <p className="text-sm print:text-sm opacity-90 font-medium">{t.ctaDescription}</p>

          {/* QR Code */}
          <div className="pt-3 border-t border-primary-foreground/20 mt-3 print:pt-1.5 print:mt-1.5">
            <p className="text-sm print:text-sm opacity-90 mb-3 print:mb-2 font-medium">{t.orText}</p>
            <div className="flex print:flex-row print:justify-center print:items-center flex-col items-center gap-2 print:gap-4">
              <div className="letter-qr-box bg-white p-3 print:p-2 rounded-lg shadow-lg print:w-[140px] print:h-[140px] print:flex print:items-center print:justify-center">
                <QRCodeSVG value={offerUrl} size={170} style={{ width: '100%', height: '100%' }} level="H" />
              </div>
              <div className="mt-2 print:mt-0 text-center">
                <p className="text-sm print:text-sm font-bold text-primary-foreground">{t.qrCallout}</p>
                <p className="text-xs print:text-xs opacity-75 mt-1">{t.qrSubtext}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center pt-3 print:pt-1 border-t border-border"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <p className="text-xs print:text-xs text-muted-foreground">{email}</p>
          <p className="text-xs print:text-xs italic text-muted-foreground mt-1 print:mt-0">{t.footer}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .cash-offer-letter-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .cash-offer-letter-card {
            max-width: 100% !important;
            width: 100% !important;
          }

          /* ── Ink-saver: header — white bg, black border ── */
          .letter-header {
            background: #fff !important;
            color: #000 !important;
            border-bottom: 3px solid #000 !important;
          }

          /* ── Ink-saver: offer box ── */
          .letter-offer-box {
            background: #fff !important;
            border: 2px solid #000 !important;
          }

          /* ── Ink-saver: urgency badge — thin black pill ── */
          .letter-urgency {
            background: #fff !important;
            color: #000 !important;
            border: 1.5px solid #000 !important;
          }

          /* ── Ink-saver: trust badges ── */
          .letter-trust-badge {
            background: #fff !important;
            border: 1px solid #666 !important;
          }

          /* ── Ink-saver: testimonial ── */
          .letter-testimonial {
            background: #fff !important;
            border: 1px solid #999 !important;
          }

          /* ── Ink-saver: CTA — white bg, thick black border ── */
          .letter-cta {
            background: #fff !important;
            color: #000 !important;
            border: 3px solid #000 !important;
          }
          .letter-cta * {
            color: #000 !important;
          }
          .letter-cta .letter-phone-box {
            background: #f0f0f0 !important;
            border: 2px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* ── QR code ── */
          .letter-qr-box {
            background: #fff !important;
            border: 1px solid #000 !important;
          }

          /* ── All text/icons black ── */
          .letter-header *,
          .letter-offer-box *,
          .letter-trust-badge *,
          .letter-cta * {
            color: #000 !important;
          }

          /* ── Stars — outline only ── */
          .letter-star {
            fill: #000 !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      </Card>
    </div>
  );
};
