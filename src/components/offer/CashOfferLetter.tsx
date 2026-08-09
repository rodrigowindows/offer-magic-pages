import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { Shield, Clock, CheckCircle2, Home, Phone } from "lucide-react";
import { formatOffer, getOfferType, getOfferAverage } from "@/utils/offerUtils";
import { formatPhone } from "@/utils/formatters";
import type { OfferConfig } from "./OfferConfiguration";
import { getLetterTemplate, type LetterTemplateId } from "./letterTemplates";

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
  /** Visual template variant. Defaults to "classic". */
  template?: LetterTemplateId;
}

const content = {
  en: {
    cashOffer: "Your Cash Offer Awaits",
    urgency: "Valid for 14 days",
    orText: "or scan the QR code",
    since: "Trusted Florida Investors Since 2015 • 500+ Happy Homeowners",
    footer: "Zero commissions • Zero closing costs • 100% confidential",
    dear: "Dear",
    guarantee: "100% Free, No Obligation",
    fastClose: "Close in as few as 7 days",
    noCost: "We cover ALL closing costs",
    callOrScan: "Call or Scan to See Your Offer",
  },
  es: {
    cashOffer: "Su Oferta en Efectivo le Espera",
    urgency: "Válida por 14 días",
    orText: "o escanee el código QR",
    since: "Inversionistas de Florida Desde 2015 • 500+ Propietarios Satisfechos",
    footer: "Cero comisiones • Cero costos de cierre • 100% confidencial",
    dear: "Estimado/a",
    guarantee: "100% Gratis, Sin Compromiso",
    fastClose: "Cierre en tan solo 7 días",
    noCost: "Cubrimos TODOS los costos de cierre",
    callOrScan: "Llame o Escanee para Ver Su Oferta",
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
  template = "classic",
}: CashOfferLetterProps) => {
  const fullAddress = `${address}, ${city}, ${state} ${zipCode}`;
  const offerUrl = `${window.location.origin}/property/${propertySlug}?src=${source}`;
  const t = content[language];
  const tpl = getLetterTemplate(template);

  if (template === "developer") {
    return (
      <DeveloperLetter
        ownerName={ownerName}
        mailingAddress={mailingAddress}
        mailingCity={mailingCity}
        mailingState={mailingState}
        mailingZip={mailingZip}
        address={address}
        city={city}
        state={state}
        zipCode={zipCode}
        qrUrl={offerUrl}
      />
    );
  }


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
  void formatOffer;
  void getOfferType(property);
  void (estimatedValue - getOfferAverage(property));

  // Resolve template-specific copy
  const headline = language === "es" ? tpl.headlineEs : tpl.headlineEn;
  const sub = language === "es" ? tpl.subEs : tpl.subEn;
  const ctaTitle = language === "es" ? tpl.ctaEs : tpl.ctaEn;
  const qrCallout = language === "es" ? tpl.qrCalloutEs : tpl.qrCalloutEn;

  // CTA block — phone + QR (always rendered, position varies per template)
  const ctaBlock = (
    <div
      className={`letter-cta rounded-xl p-5 print:p-4 text-center space-y-3 ${tpl.ctaClass}`}
    >
      <h2 className="text-xl font-bold">{ctaTitle}</h2>

      <div className="letter-phone-box bg-white border-2 border-black rounded-lg py-3 px-4 text-black">
        <div className="flex items-center justify-center gap-3 text-3xl print:text-2xl font-extrabold tracking-wide">
          <Phone className="h-7 w-7 print:h-6 print:w-6" />
          <span>{formattedPhone}</span>
        </div>
      </div>

      <div className="pt-3 border-t border-current/20">
        <p className="text-sm mb-3 font-medium print:text-xs">{t.orText}</p>
        <div className="flex flex-col items-center gap-2">
          <div className="letter-qr-box bg-white p-3 rounded-lg border-2 border-black">
            <QRCodeSVG value={offerUrl} size={140} level="H" fgColor="#000000" bgColor="#ffffff" />
          </div>
          <p className="text-sm font-bold leading-tight print:text-xs">{qrCallout}</p>
        </div>
      </div>
    </div>
  );

  const offerBlock = (
    <div
      className={`letter-offer-box relative rounded-xl p-6 print:p-5 text-center ${tpl.offerBoxClass}`}
    >
      {tpl.showUrgencyPill && (
        <div className="letter-urgency absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {t.urgency}
        </div>
      )}

      <p className="text-base text-neutral-700 mb-2 mt-3 print:text-sm">{t.cashOffer}</p>
      <p className="text-3xl print:text-2xl font-black text-black leading-tight">
        {t.callOrScan}
      </p>
    </div>
  );

  const trustBlock = tpl.showTrustBadges && (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="letter-trust-badge bg-white border border-black rounded-lg p-3">
        <Clock className="h-5 w-5 mx-auto text-black mb-1.5" />
        <p className="text-xs font-medium text-black leading-tight">{t.fastClose}</p>
      </div>
      <div className="letter-trust-badge bg-white border border-black rounded-lg p-3">
        <Shield className="h-5 w-5 mx-auto text-black mb-1.5" />
        <p className="text-xs font-medium text-black leading-tight">{t.guarantee}</p>
      </div>
      <div className="letter-trust-badge bg-white border border-black rounded-lg p-3">
        <CheckCircle2 className="h-5 w-5 mx-auto text-black mb-1.5" />
        <p className="text-xs font-medium text-black leading-tight">{t.noCost}</p>
      </div>
    </div>
  );

  return (
    <div className="cash-offer-letter-wrapper print:w-full print:mx-auto">
      <Card
        className={`cash-offer-letter-card max-w-2xl mx-auto print:border-0 print:shadow-none overflow-hidden ${tpl.cardClass}`}
      >
        <div className={`letter-header p-6 print:py-1.5 print:px-3 text-center ${tpl.headerClass}`}>
          <div className="flex items-center justify-center gap-2 mb-1 print:mb-0.5">
            <Home className="h-6 w-6 print:h-4 print:w-4" />
            <span className="text-xl print:text-base font-bold tracking-wide">MyLocalInvest</span>
          </div>
          <p className="text-sm opacity-90 print:hidden">{t.since}</p>
        </div>

        <div className="p-6 space-y-6 print:px-6 print:py-5 print:space-y-5">
          <div className="text-center space-y-2 print:space-y-1.5">
            {ownerName && (
              <p className="text-lg text-neutral-700 print:text-base">
                {t.dear} {ownerName},
              </p>
            )}
            {tpl.accent && (
              <p className="text-xs uppercase tracking-widest text-neutral-700 print:text-[10px]">
                {tpl.accent}
              </p>
            )}
            <h1 className={`leading-tight ${tpl.headlineClass}`}>{headline}</h1>
            <p className="text-base text-neutral-700 print:text-sm">{sub}</p>
            {/* PROPERTY ADDRESS — TOP */}
            <p className="text-sm font-medium text-black pt-1 print:text-[12px] underline underline-offset-2">
              {fullAddress}
            </p>
          </div>

          {/* CTA position: TOP */}
          {tpl.ctaPosition === "top" && ctaBlock}

          {offerBlock}

          {trustBlock}

          {/* CTA position: MIDDLE (after offer + trust) */}
          {tpl.ctaPosition === "middle" && ctaBlock}

          {/* CTA position: BOTTOM (before mailing, mailing always last) */}
          {tpl.ctaPosition === "bottom" && ctaBlock}

          <div className="text-center">
            <p className="text-[11px] print:text-[10px] text-neutral-700 italic leading-tight">
              {email} • {t.footer}
            </p>
          </div>

          {/* OWNER / MAILING ADDRESS — ALWAYS AT THE VERY BOTTOM */}
          <div className="letter-recipient border-t border-black pt-3 mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-700 shrink-0">
              {language === "es" ? "Enviado a:" : "Mail to:"}
            </span>
            <span className="text-xs text-black leading-tight">
              {ownerName && <span className="font-semibold">{ownerName} — </span>}
              {mailLine1}, {mailCity}, {mailState} {mailZip}
            </span>
            {mailingDiffersFromProperty && (
              <span className="text-[10px] text-neutral-700 italic print:hidden">
                ⚠ Different from property
              </span>
            )}
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
            .letter-header,
            .letter-offer-box,
            .letter-cta,
            .letter-trust-badge,
            .letter-qr-box,
            .letter-urgency,
            .letter-phone-box {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}</style>
      </Card>
    </div>
  );
};
