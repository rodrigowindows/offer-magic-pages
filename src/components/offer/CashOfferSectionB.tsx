import { Check } from "lucide-react";
import OfferActionsHub from "./OfferActionsHub";

interface CashOfferSectionBProps {
  offerAmount?: string;
  onViewOffer?: () => void;
  propertyAddress?: string;
  propertyId?: string;
  currentOfferAmount?: number;
  onDownloadPdf?: () => void;
}

const CashOfferSectionB = ({
  offerAmount = "$285,000",
  onViewOffer,
  propertyAddress = "",
  propertyId,
  currentOfferAmount,
  onDownloadPdf,
}: CashOfferSectionBProps) => {
  return (
    <section className="py-12 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Heading */}
          <div className="text-center space-y-3">
            <p className="text-base text-gray-600 font-medium">Your fair cash offer</p>
            <div className="text-6xl md:text-7xl font-black text-green-600 tracking-tight">
              {offerAmount}
            </div>
            <p className="text-sm text-gray-500">
              For {propertyAddress || "your property"}
            </p>
          </div>

          {/* Beige preliminary disclaimer */}
          <div className="rounded-xl p-5 border" style={{ backgroundColor: "#FDF4E3", borderColor: "#F0DFB6" }}>
            <p className="text-sm font-semibold text-amber-900 leading-relaxed">
              This is a preliminary offer. In many cases, we significantly improve it after talking with you.
            </p>
          </div>

          {/* Bullets */}
          <div className="space-y-3">
            {[
              { title: "Close in 7-14 days", subtitle: null },
              { title: "No repairs needed", subtitle: "we buy as-is" },
              { title: "No realtor fees", subtitle: "save thousands" },
            ].map((b) => (
              <div key={b.title} className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-green-700" />
                </div>
                <p className="text-base text-gray-800">
                  <span className="font-semibold">{b.title}</span>
                  {b.subtitle && <span className="text-gray-600"> — {b.subtitle}</span>}
                </p>
              </div>
            ))}
          </div>

          {/* New action hub: Increase Offer + Schedule + Channels + PDF */}
          <OfferActionsHub
            propertyId={propertyId}
            propertyAddress={propertyAddress}
            currentOffer={currentOfferAmount}
            onDownloadPdf={onDownloadPdf}
            onTrack={(action) => {
              if (action === "increase_offer" || action === "schedule_call") onViewOffer?.();
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default CashOfferSectionB;
