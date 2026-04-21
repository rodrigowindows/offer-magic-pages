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
  mailingAddress,
  mailingCity,
  mailingState,
  mailingZip,
}: CashOfferLetterProps) => {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  const offerUrl = `${window.location.origin}/property/${propertySlug}?src=${source}`;
  const t = content[language];

  const formattedPhone = formatPhone(phone) || "786 882 8251";

  const mailLine1 = mailingAddress || address;
  const mailCity = mailingCity || city;
  const mailState = mailingState || state;
  const mailZip = mailingZip || zipCode;
  const mailingFullAddress = `${mailLine1}, ${mailCity}, ${mailState} ${mailZip}`;
  const mailingDiffersFromProperty =
    !!mailingAddress &&
    mailingFullAddress.trim().toLowerCase() !== fullAddress.trim().toLowerCase();

  const currentOfferConfig = offerConfig || {
    type: minOffer && maxOffer ? "range" : "fixed",
    fixedAmount: cashOffer,
    rangeMin: minOffer,
    rangeMax: maxOffer,
    estimatedValue: estimatedValue,
  };

  const property = {
    cash_offer_amount: currentOfferConfig.fixedAmount,
    min_offer_amount: currentOfferConfig.rangeMin,
    max_offer_amount: currentOfferConfig.rangeMax,
  };

  const offerType = getOfferType(property);
  const averageOffer = getOfferAverage(property);
  const savings = estimatedValue - averageOffer;

  void formatOffer;
  void offerType;
  void savings;

  return (
    <div className="cash-offer-letter-wrapper print:w-full print:mx-auto">
      <Card className="cash-offer-letter-card max-w-2xl mx-auto bg-background border-2 border-primary/20 print:border-0 print:shadow-none overflow-hidden">
        <div className="letter-header bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 print:py-1.5 print:px-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1 print:mb-0.5">
            <Home className="h-6 w-6 print:h-4 print:w-4" />
            <span className="text-xl print:text-base font-bold tracking-wide">MyLocalInvest</span>
          </div>
          <p className="text-sm opacity-90 print:hidden">{t.since}</p>
        </div>

        <div className="p-6 space-y-6 print:px-6 print:py-5 print:space-y-5">
          <div className="text-center space-y-2 print:space-y-1.5">
            {ownerName && (
              <p className="text-lg text-muted-foreground print:text-base">{t.dear} {ownerName},</p>
            )}
            <h1 className="text-3xl print:text-2xl font-bold text-foreground leading-tight">{t.headline}</h1>
            <p className="text-base text-muted-foreground print:text-sm">{t.subheadline}</p>
            <p className="text-sm font-medium text-primary pt-1 print:text-[12px]">{fullAddress}</p>
          </div>

          <div className="letter-offer-box relative bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary rounded-xl p-6 print:p-5 text-center">
            <div className="letter-urgency absolute -top-3 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t.urgency}
            </div>

            <p className="text-base text-muted-foreground mb-2 mt-3 print:text-sm">{t.cashOffer}</p>
            <p className="text-3xl print:text-2xl font-black text-primary leading-tight">
              {language === "es" ? "Llame o Escanee para Ver Su Oferta" : "Call or Scan to See Your Offer"}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="letter-trust-badge bg-muted/50 rounded-lg p-3">
              <Clock className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-medium text-foreground leading-tight">{t.fastClose}</p>
            </div>
            <div className="letter-trust-badge bg-muted/50 rounded-lg p-3">
              <Shield className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-medium text-foreground leading-tight">{t.guarantee}</p>
            </div>
            <div className="letter-trust-badge bg-muted/50 rounded-lg p-3">
              <CheckCircle2 className="h-5 w-5 mx-auto text-primary mb-1.5" />
              <p className="text-xs font-medium text-foreground leading-tight">{t.noCost}</p>
            </div>
          </div>

          <div className="letter-cta bg-primary text-primary-foreground rounded-xl p-5 print:p-4 text-center space-y-3">
            <h2 className="text-xl font-bold">{t.cta}</h2>

            <div className="letter-phone-box bg-white/10 rounded-lg py-3 px-4">
              <div className="flex items-center justify-center gap-3 text-3xl print:text-2xl font-extrabold tracking-wide">
                <Phone className="h-7 w-7 print:h-6 print:w-6" />
                <span>{formattedPhone}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-primary-foreground/20">
              <p className="text-sm opacity-90 mb-3 font-medium print:text-xs">{t.orText}</p>
              <div className="flex flex-col items-center gap-2">
                <div className="letter-qr-box bg-white p-3 rounded-lg shadow-lg">
                  <QRCodeSVG value={offerUrl} size={140} level="H" />
                </div>
                <p className="text-sm font-bold text-primary-foreground leading-tight print:text-xs">{t.qrCallout}</p>
              </div>
            </div>
          </div>

          <div className="letter-recipient border-t border-border pt-3 mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              {language === "es" ? "Enviado a:" : "Mail to:"}
            </span>
            <span className="text-xs text-foreground leading-tight">
              {ownerName && <span className="font-semibold">{ownerName} — </span>}
              {mailLine1}, {mailCity}, {mailState} {mailZip}
            </span>
            {mailingDiffersFromProperty && (
              <span className="text-[10px] text-muted-foreground italic print:hidden">
                ⚠ Different from property
              </span>
            )}
          </div>

          <div className="text-center">
            <p className="text-[11px] print:text-[10px] text-muted-foreground italic leading-tight">
              {email} • {t.footer}
            </p>
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

            .letter-header {
              background: #fff !important;
              color: #000 !important;
              border-bottom: 3px solid #000 !important;
            }

            .letter-offer-box {
              background: #fff !important;
              border: 2px solid #000 !important;
            }

            .letter-urgency {
              background: #fff !important;
              color: #000 !important;
              border: 1.5px solid #000 !important;
            }

            .letter-trust-badge {
              background: #fff !important;
              border: 1px solid #666 !important;
            }

            .letter-testimonial {
              background: #fff !important;
              border: 1px solid #999 !important;
            }

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

            .letter-qr-box {
              background: #fff !important;
              border: 1px solid #000 !important;
            }

            .letter-header *,
            .letter-offer-box *,
            .letter-trust-badge *,
            .letter-cta * {
              color: #000 !important;
            }

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
