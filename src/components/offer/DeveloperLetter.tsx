/**
 * Developer Outreach Letter (DelfinOne) — B/W print-safe.
 * Full business letter with recipient block, body copy, signature and QR code.
 */
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";

export interface DeveloperLetterProps {
  /** Recipient name */
  ownerName?: string;
  /** Recipient company (optional) */
  companyName?: string;
  /** Mailing address lines */
  mailingAddress?: string | null;
  mailingCity?: string | null;
  mailingState?: string | null;
  mailingZip?: string | null;
  /** Fallback property address (used if no mailing address) */
  address: string;
  city: string;
  state: string;
  zipCode: string;
  /** URL encoded in the QR code */
  qrUrl?: string;
}

const SUBJECT =
  "From lot to lender-ready in minutes: The new standard for Florida developers";

const BULLETS: Array<{ title: string; text: string }> = [
  {
    title: "Analyze and simulate before you buy",
    text: "Test land prices, sales assumptions, construction costs, and timelines to see the immediate impact on profitability, required equity, and investor returns.",
  },
  {
    title: "Generate instant pitchbooks",
    text: "Create lender- and investor-ready pitchbooks directly from your simulations.",
  },
  {
    title: "Benchmark pricing",
    text: "Compare your assumptions against relevant comparable sales and active listings.",
  },
  {
    title: "Secure capital",
    text: "Evolve active projects with detailed budgets and seamlessly access construction financing from $500K to $25M through our lending partners.",
  },
];

export const DeveloperLetter = ({
  ownerName,
  companyName,
  mailingAddress,
  mailingCity,
  mailingState,
  mailingZip,
  address,
  city,
  state,
  zipCode,
  qrUrl = "https://delfinone.com",
}: DeveloperLetterProps) => {
  const line1 = mailingAddress || address;
  const cityLine = `${mailingCity || city}, ${mailingState || state} ${mailingZip || zipCode}`;
  const name = ownerName || "Developer";

  return (
    <div className="cash-offer-letter-wrapper print:w-full print:mx-auto">
      <Card className="cash-offer-letter-card max-w-2xl mx-auto bg-white text-black border border-neutral-300 print:border-0 print:shadow-none overflow-hidden">
        <div className="p-8 print:p-6 space-y-4 print:space-y-3 text-[13px] print:text-[11px] leading-relaxed">
          {/* Letterhead */}
          <div className="flex items-baseline justify-between border-b border-black pb-2">
            <span className="text-xl print:text-lg font-bold tracking-tight">DelfinOne</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-700">
              Coconut Grove, FL
            </span>
          </div>

          {/* Subject */}
          <p className="font-semibold">
            <span className="uppercase text-[10px] tracking-widest text-neutral-700 mr-2">
              Subject:
            </span>
            {SUBJECT}
          </p>

          {/* Recipient block */}
          <div className="pt-1">
            <p className="font-semibold">{name}</p>
            {companyName && <p>{companyName}</p>}
            <p>{line1}</p>
            <p>{cityLine}</p>
          </div>

          <p>Dear {name},</p>

          <p>
            Whether you are taking your next residential development from initial analysis to
            budgeting, creating pitchbooks, or compiling a complete financing package, you need a
            system that works at your speed.
          </p>

          <p>
            DelfinOne is the AI-powered construction project management, analysis, and financing
            platform built specifically for Florida residential real estate developers. We help you
            go from lot to lender- and investor-ready in minutes.
          </p>

          <p>With one continuous workflow, our platform allows you to:</p>

          <ul className="space-y-1.5 print:space-y-1 pl-4 list-disc">
            {BULLETS.map((b) => (
              <li key={b.title}>
                <span className="font-semibold">{b.title}:</span> {b.text}
              </li>
            ))}
          </ul>

          <p>
            We would love to show you how DelfinOne can streamline your next project. Please scan
            the QR code below to explore our Developer Portal and see the platform in action.
          </p>

          {/* QR */}
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="letter-qr-box bg-white p-3 border-2 border-black rounded-lg">
              <QRCodeSVG value={qrUrl} size={130} level="H" fgColor="#000000" bgColor="#ffffff" />
            </div>
            <p className="text-[11px] font-semibold">Scan to explore the Developer Portal</p>
          </div>

          {/* Signature */}
          <div className="pt-2 border-t border-neutral-300">
            <p>Best regards,</p>
            <p className="font-semibold mt-2">The DelfinOne Team</p>
            <p>Info@delfinone.com</p>
            <p>2601 S. Bayshore Dr, Suite 1200</p>
            <p>Coconut Grove, FL 33133</p>
          </div>
        </div>

        <style>{`
          @media print {
            .cash-offer-letter-wrapper { width:100% !important; max-width:100% !important; page-break-inside: avoid; break-inside: avoid; }
            .cash-offer-letter-card { width:100% !important; max-width:100% !important; }
            .letter-qr-box { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}</style>
      </Card>
    </div>
  );
};
