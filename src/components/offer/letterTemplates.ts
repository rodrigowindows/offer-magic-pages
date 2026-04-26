/**
 * Letter template variants.
 *
 * 10 visual styles for the cash-offer letter. All templates share:
 *  - Property address on TOP
 *  - QR code + phone number prominently shown
 *  - Owner / mailing address at the BOTTOM
 *
 * Each template only changes typography, color treatment, layout density,
 * decorative elements and tone of the headline. Business data (offer URL,
 * QR target, phone digits, addresses) is identical across all variants.
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
  | "premium";

export interface LetterTemplate {
  id: LetterTemplateId;
  name: string;
  description: string;
  /** Headline override (English) */
  headlineEn?: string;
  /** Headline override (Spanish) */
  headlineEs?: string;
  /** Sub-headline override (English) */
  subEn?: string;
  /** Sub-headline override (Spanish) */
  subEs?: string;
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
  /** Decorative accent shown above the headline (emoji / short text) */
  accent?: string;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: "classic",
    name: "Classic Blue",
    description: "Default trusted look — gradient header, full trust row, urgency pill.",
    cardClass: "bg-background border-2 border-primary/20",
    headerClass: "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground",
    offerBoxClass: "bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary",
    ctaClass: "bg-primary text-primary-foreground",
    headlineClass: "text-3xl print:text-2xl font-bold text-foreground",
    showTrustBadges: true,
    showUrgencyPill: true,
  },
  {
    id: "bold",
    name: "Bold Impact",
    description: "Oversized headline, heavy black header, no trust row — direct & loud.",
    cardClass: "bg-background border-4 border-foreground",
    headerClass: "bg-foreground text-background",
    offerBoxClass: "bg-background border-4 border-foreground",
    ctaClass: "bg-foreground text-background",
    headlineClass: "text-4xl print:text-3xl font-black uppercase tracking-tight text-foreground",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "★ EXCLUSIVE OFFER ★",
  },
  {
    id: "minimal",
    name: "Minimal White",
    description: "Lots of white space, thin borders, no urgency pill, refined feel.",
    cardClass: "bg-background border border-border",
    headerClass: "bg-background text-foreground border-b border-border",
    offerBoxClass: "bg-background border border-border",
    ctaClass: "bg-muted text-foreground border border-border",
    headlineClass: "text-2xl print:text-xl font-light tracking-wide text-foreground",
    showTrustBadges: false,
    showUrgencyPill: false,
  },
  {
    id: "newspaper",
    name: "Newspaper",
    description: "Serif headline, framed look, evokes a printed news ad.",
    cardClass: "bg-background border-2 border-foreground",
    headerClass: "bg-background text-foreground border-b-4 border-double border-foreground",
    offerBoxClass: "bg-muted/40 border border-foreground",
    ctaClass: "bg-background text-foreground border-2 border-foreground",
    headlineClass: "text-3xl print:text-2xl font-serif font-bold text-foreground",
    showTrustBadges: true,
    showUrgencyPill: false,
    accent: "— SPECIAL NOTICE —",
  },
  {
    id: "postcard",
    name: "Postcard",
    description: "Friendly accent header, rounded corners, casual tone.",
    cardClass: "bg-background border-2 border-accent rounded-2xl",
    headerClass: "bg-accent text-accent-foreground",
    offerBoxClass: "bg-accent/10 border-2 border-accent rounded-xl",
    ctaClass: "bg-accent text-accent-foreground rounded-xl",
    headlineClass: "text-3xl print:text-2xl font-bold text-foreground",
    showTrustBadges: true,
    showUrgencyPill: true,
    accent: "Greetings from MyLocalInvest",
  },
  {
    id: "official",
    name: "Official Notice",
    description: "Formal stamp-like layout, looks like a county notice.",
    cardClass: "bg-background border-2 border-foreground",
    headerClass: "bg-muted text-foreground border-b-2 border-foreground",
    offerBoxClass: "bg-background border-2 border-dashed border-foreground",
    ctaClass: "bg-muted text-foreground border-2 border-foreground",
    headlineClass: "text-2xl print:text-xl font-bold uppercase tracking-widest text-foreground",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "OFFICIAL PURCHASE OFFER",
    headlineEn: "Notice of Cash Purchase Offer",
    headlineEs: "Aviso de Oferta de Compra en Efectivo",
  },
  {
    id: "handwritten",
    name: "Personal Note",
    description: "Warm, personal tone — looks like a hand-written note from a neighbor.",
    cardClass: "bg-background border border-border",
    headerClass: "bg-background text-foreground",
    offerBoxClass: "bg-muted/30 border border-border rounded-lg",
    ctaClass: "bg-primary/90 text-primary-foreground rounded-lg",
    headlineClass: "text-3xl print:text-2xl italic font-medium text-foreground",
    showTrustBadges: false,
    showUrgencyPill: false,
    accent: "A personal note for you,",
    headlineEn: "I'd like to buy your home",
    headlineEs: "Me gustaría comprar su casa",
    subEn: "Honest offer • No pressure • Real local buyer",
    subEs: "Oferta honesta • Sin presión • Comprador local real",
  },
  {
    id: "modern",
    name: "Modern Tech",
    description: "Clean SaaS-style — primary accent bars, sans-serif, balanced spacing.",
    cardClass: "bg-background border border-primary/40 rounded-xl",
    headerClass: "bg-background text-foreground border-l-8 border-primary",
    offerBoxClass: "bg-primary/5 border-l-4 border-primary rounded-lg",
    ctaClass: "bg-primary text-primary-foreground rounded-lg",
    headlineClass: "text-3xl print:text-2xl font-semibold tracking-tight text-foreground",
    showTrustBadges: true,
    showUrgencyPill: false,
  },
  {
    id: "urgent",
    name: "Urgent Red",
    description: "Maximum urgency — destructive accents, deadline pill, bold CTA.",
    cardClass: "bg-background border-4 border-destructive",
    headerClass: "bg-destructive text-destructive-foreground",
    offerBoxClass: "bg-destructive/10 border-2 border-destructive",
    ctaClass: "bg-destructive text-destructive-foreground",
    headlineClass: "text-4xl print:text-3xl font-black uppercase text-destructive",
    showTrustBadges: false,
    showUrgencyPill: true,
    accent: "⏰ TIME-SENSITIVE",
    headlineEn: "Final Cash Offer — Act Now",
    headlineEs: "Oferta Final en Efectivo — Actúe Ya",
  },
  {
    id: "premium",
    name: "Premium Gold",
    description: "Upscale feel — accent gold borders, refined headline, full trust row.",
    cardClass: "bg-background border-2 border-accent",
    headerClass: "bg-gradient-to-r from-accent to-accent/70 text-accent-foreground",
    offerBoxClass: "bg-accent/5 border-2 border-accent rounded-xl",
    ctaClass: "bg-accent text-accent-foreground rounded-xl",
    headlineClass: "text-3xl print:text-2xl font-bold tracking-wide text-foreground",
    showTrustBadges: true,
    showUrgencyPill: true,
    accent: "PREMIUM CASH OFFER",
  },
];

export const getLetterTemplate = (id?: LetterTemplateId | null): LetterTemplate =>
  LETTER_TEMPLATES.find((t) => t.id === id) ?? LETTER_TEMPLATES[0];
