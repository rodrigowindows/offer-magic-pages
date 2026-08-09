/**
 * Letter template variants — BLACK & WHITE ONLY.
 *
 * 10 visual styles for the cash-offer letter. All templates are strictly
 * monochrome (black, white, gray) so they print perfectly on any B/W printer.
 *
 * Shared invariants across every template:
 *  - Property address on TOP
 *  - QR code + phone number always present (position varies)
 *  - Owner / mailing address at the BOTTOM
 *
 * Each template differs in:
 *  - Headline / sub-headline / CTA copy
 *  - Position of the QR+phone CTA block (top | middle | bottom)
 *  - Typography (serif/sans/mono/italic, weight, case)
 *  - Borders, density, decorative accents
 */

export type LetterTemplateId =
  | "classic"
  | "bold"
  | "minimal"
  | "newspaper"
  | "postcard"
  | "official"
  | "handwritten"
  | "modern"
  | "urgent"
  | "premium"
  | "developer";

export type CtaPosition = "top" | "middle" | "bottom";

export interface LetterTemplate {
  id: LetterTemplateId;
  name: string;
  description: string;

  /** Headline override (English) */
  headlineEn: string;
  /** Headline override (Spanish) */
  headlineEs: string;
  /** Sub-headline override (English) */
  subEn: string;
  /** Sub-headline override (Spanish) */
  subEs: string;
  /** CTA heading shown above phone+QR block (English) */
  ctaEn: string;
  /** CTA heading shown above phone+QR block (Spanish) */
  ctaEs: string;
  /** Small line above QR (English) */
  qrCalloutEn: string;
  /** Small line above QR (Spanish) */
  qrCalloutEs: string;

  /** Where the phone+QR CTA block is rendered in the letter flow */
  ctaPosition: CtaPosition;

  /** Tailwind class applied to the outer card */
  cardClass: string;
  /** Tailwind class applied to the header band */
  headerClass: string;
  /** Tailwind class applied to the offer/CTA mid box */
  offerBoxClass: string;
  /** Tailwind class applied to the phone+QR CTA block */
  ctaClass: string;
  /** Tailwind class applied to headline text */
  headlineClass: string;
  /** Whether to show the trust-badge row (3 icons) */
  showTrustBadges: boolean;
  /** Whether to show the urgency pill above the offer box */
  showUrgencyPill: boolean;
  /** Decorative accent shown above the headline (text only — no emoji color) */
  accent?: string;
}

/**
 * Monochrome design tokens used across all templates.
 * - bg-white / bg-black / bg-neutral-100 / bg-neutral-200
 * - text-black / text-white / text-neutral-700
 * - border-black / border-neutral-300
 * No `primary`, `accent`, `destructive` tokens — printer-safe.
 */
export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Timeless serif headline, framed letter, CTA in the middle.",
    headlineEn: "A Cash Offer for Your Home",
    headlineEs: "Una Oferta en Efectivo para Su Casa",
    subEn: "No repairs. No fees. Close on your timeline.",
    subEs: "Sin reparaciones. Sin comisiones. Cierre cuando quiera.",
    ctaEn: "Get Your Cash Offer",
    ctaEs: "Reciba Su Oferta",
    qrCalloutEn: "Scan to view your private offer",
    qrCalloutEs: "Escanee para ver su oferta privada",
    ctaPosition: "middle",
    cardClass: "bg-white border-2 border-black text-black",
    headerClass: "bg-white text-black border-b-2 border-black",
    offerBoxClass: "bg-white border-2 border-black text-black",
    ctaClass: "bg-white border-2 border-black text-black",
    headlineClass: "text-3xl print:text-2xl font-serif font-bold text-black",
    showTrustBadges: true,
    showUrgencyPill: true,
  },
  {
    id: "bold",
    name: "Bold Impact",
    description: "Heavy black header, oversized uppercase headline, CTA on top.",
    headlineEn: "We Buy Your House. Cash. Fast.",
    headlineEs: "Compramos Su Casa. Efectivo. Rápido.",
    subEn: "One call. One offer. No middleman.",
    subEs: "Una llamada. Una oferta. Sin intermediarios.",
    ctaEn: "Call Now Before It Expires",
    ctaEs: "Llame Antes Que Expire",
    qrCalloutEn: "Or scan — instant access",
    qrCalloutEs: "O escanee — acceso instantáneo",
    ctaPosition: "top",
    cardClass: "bg-white border-4 border-black text-black",
    headerClass: "bg-white text-black border-b-4 border-black",
    offerBoxClass: "bg-white border-4 border-black text-black",
    ctaClass: "bg-white text-black border-2 border-black",
    headlineClass:
      "text-4xl print:text-3xl font-black uppercase tracking-tight text-black",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "EXCLUSIVE OFFER",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Lots of white space, thin lines, light typography, CTA at bottom.",
    headlineEn: "An honest offer, on your terms.",
    headlineEs: "Una oferta honesta, a su manera.",
    subEn: "Quiet, direct, and zero pressure.",
    subEs: "Tranquila, directa y sin presión.",
    ctaEn: "When you're ready",
    ctaEs: "Cuando esté listo",
    qrCalloutEn: "Scan when convenient",
    qrCalloutEs: "Escanee cuando quiera",
    ctaPosition: "bottom",
    cardClass: "bg-white border border-neutral-300 text-black",
    headerClass: "bg-white text-black border-b border-neutral-300",
    offerBoxClass: "bg-white border border-neutral-300 text-black",
    ctaClass: "bg-white border border-neutral-300 text-black",
    headlineClass:
      "text-2xl print:text-xl font-light tracking-wide text-black",
    showTrustBadges: false,
    showUrgencyPill: false,
  },
  {
    id: "newspaper",
    name: "Newspaper",
    description: "Serif headline, double-rule frame, CTA in the middle column.",
    headlineEn: "Local Investor Seeks to Purchase This Property",
    headlineEs: "Inversionista Local Busca Comprar Esta Propiedad",
    subEn: "A direct cash purchase — no listing required.",
    subEs: "Una compra directa en efectivo — sin necesidad de listar.",
    ctaEn: "Reply Today — Limited Window",
    ctaEs: "Responda Hoy — Cupo Limitado",
    qrCalloutEn: "Scan for full details",
    qrCalloutEs: "Escanee para ver detalles",
    ctaPosition: "middle",
    cardClass: "bg-white border-2 border-black text-black",
    headerClass:
      "bg-white text-black border-b-4 border-double border-black",
    offerBoxClass: "bg-white border border-black text-black",
    ctaClass: "bg-white border-2 border-black text-black",
    headlineClass:
      "text-3xl print:text-2xl font-serif font-bold text-black",
    showTrustBadges: true,
    showUrgencyPill: false,
    accent: "— SPECIAL NOTICE —",
  },
  {
    id: "postcard",
    name: "Postcard",
    description: "Friendly rounded layout, casual greeting, CTA on top.",
    headlineEn: "Hi neighbor — quick note about your home.",
    headlineEs: "Hola vecino — una nota rápida sobre su casa.",
    subEn: "Friendly local buyer • Real cash • No agents",
    subEs: "Comprador local amistoso • Efectivo real • Sin agentes",
    ctaEn: "Say hello — let's talk",
    ctaEs: "Salude — conversemos",
    qrCalloutEn: "Scan to chat",
    qrCalloutEs: "Escanee para conversar",
    ctaPosition: "top",
    cardClass: "bg-white border-2 border-black rounded-2xl text-black",
    headerClass: "bg-white text-black border-b border-black",
    offerBoxClass:
      "bg-white border-2 border-black rounded-xl text-black",
    ctaClass:
      "bg-white border-2 border-black rounded-xl text-black",
    headlineClass:
      "text-3xl print:text-2xl font-bold text-black",
    showTrustBadges: true,
    showUrgencyPill: false,
    accent: "Greetings from MyLocalInvest",
  },
  {
    id: "official",
    name: "Official Notice",
    description: "Stamp-like formal layout, dashed offer frame, CTA at bottom.",
    headlineEn: "Notice of Cash Purchase Offer",
    headlineEs: "Aviso de Oferta de Compra en Efectivo",
    subEn: "Please review the terms outlined below.",
    subEs: "Por favor revise los términos a continuación.",
    ctaEn: "Confirm receipt and respond",
    ctaEs: "Confirme recepción y responda",
    qrCalloutEn: "Scan to acknowledge offer",
    qrCalloutEs: "Escanee para confirmar oferta",
    ctaPosition: "bottom",
    cardClass: "bg-white border-2 border-black text-black",
    headerClass:
      "bg-white text-black border-b-2 border-black",
    offerBoxClass:
      "bg-white border-2 border-dashed border-black text-black",
    ctaClass: "bg-white border-2 border-black text-black",
    headlineClass:
      "text-2xl print:text-xl font-bold uppercase tracking-widest text-black",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "OFFICIAL PURCHASE OFFER",
  },
  {
    id: "handwritten",
    name: "Personal Note",
    description: "Italic, warm tone like a hand-written neighborly note. CTA middle.",
    headlineEn: "I'd like to buy your home.",
    headlineEs: "Me gustaría comprar su casa.",
    subEn: "Honest offer • No pressure • Real local buyer",
    subEs: "Oferta honesta • Sin presión • Comprador local real",
    ctaEn: "Give me a quick call",
    ctaEs: "Llámeme un momento",
    qrCalloutEn: "or scan — takes 10 seconds",
    qrCalloutEs: "o escanee — toma 10 segundos",
    ctaPosition: "middle",
    cardClass: "bg-white border border-neutral-300 text-black",
    headerClass: "bg-white text-black",
    offerBoxClass:
      "bg-white border border-neutral-400 rounded-lg text-black",
    ctaClass:
      "bg-white border-2 border-black rounded-lg text-black",
    headlineClass:
      "text-3xl print:text-2xl italic font-medium text-black",
    showTrustBadges: false,
    showUrgencyPill: false,
    accent: "A personal note for you,",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean sans-serif, accent rule on the left, CTA on top.",
    headlineEn: "Sell direct. Skip the listing.",
    headlineEs: "Venda directo. Sin listar.",
    subEn: "A simple cash process from a local team.",
    subEs: "Un proceso simple en efectivo con un equipo local.",
    ctaEn: "Start in under a minute",
    ctaEs: "Comience en menos de un minuto",
    qrCalloutEn: "Scan to begin",
    qrCalloutEs: "Escanee para comenzar",
    ctaPosition: "top",
    cardClass:
      "bg-white border border-black rounded-xl text-black",
    headerClass:
      "bg-white text-black border-l-8 border-black",
    offerBoxClass:
      "bg-white border-l-4 border-black rounded-lg text-black",
    ctaClass:
      "bg-white text-black rounded-lg border-2 border-black",
    headlineClass:
      "text-3xl print:text-2xl font-semibold tracking-tight text-black",
    showTrustBadges: true,
    showUrgencyPill: false,
  },
  {
    id: "urgent",
    name: "Urgent",
    description: "Maximum urgency — heavy borders, deadline pill, CTA on top.",
    headlineEn: "Final Cash Offer — Act Now",
    headlineEs: "Oferta Final en Efectivo — Actúe Ya",
    subEn: "This window closes in 14 days.",
    subEs: "Este plazo cierra en 14 días.",
    ctaEn: "Call Today — Don't Miss This",
    ctaEs: "Llame Hoy — No Lo Pierda",
    qrCalloutEn: "Scan immediately",
    qrCalloutEs: "Escanee de inmediato",
    ctaPosition: "top",
    cardClass: "bg-white border-4 border-black text-black",
    headerClass: "bg-white text-black border-b-4 border-black",
    offerBoxClass:
      "bg-white border-2 border-black text-black",
    ctaClass: "bg-white text-black border-4 border-black",
    headlineClass:
      "text-4xl print:text-3xl font-black uppercase text-black",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "TIME-SENSITIVE",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Refined feel, double-rule header, CTA at bottom.",
    headlineEn: "A Discreet, Premium Cash Offer",
    headlineEs: "Una Oferta Discreta y Premium en Efectivo",
    subEn: "Private, professional, and on your schedule.",
    subEs: "Privada, profesional y a su tiempo.",
    ctaEn: "Reserve a private call",
    ctaEs: "Reserve una llamada privada",
    qrCalloutEn: "Scan to schedule",
    qrCalloutEs: "Escanee para agendar",
    ctaPosition: "bottom",
    cardClass: "bg-white border-2 border-black text-black",
    headerClass:
      "bg-white text-black border-b-4 border-double border-black",
    offerBoxClass:
      "bg-white border-2 border-black rounded-xl text-black",
    ctaClass:
      "bg-white border-2 border-black rounded-xl text-black",
    headlineClass:
      "text-3xl print:text-2xl font-bold tracking-wide text-black",
    showTrustBadges: true,
    showUrgencyPill: true,
    accent: "PREMIUM CASH OFFER",
  },
];

export const getLetterTemplate = (id?: LetterTemplateId | null): LetterTemplate =>
  LETTER_TEMPLATES.find((t) => t.id === id) ?? LETTER_TEMPLATES[0];
