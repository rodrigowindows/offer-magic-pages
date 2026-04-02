import { Check, MessageCircle, Phone, Mail, Calendar, PhoneCall } from "lucide-react";
import ContactFormModal from "@/components/lead/ContactFormModal";

interface CashOfferSectionBProps {
  offerAmount?: string;
  onViewOffer?: () => void;
  propertyAddress?: string;
  propertyId?: string;
}

const CashOfferSectionB = ({
  offerAmount = "$285,000",
  onViewOffer,
  propertyAddress = "",
  propertyId
}: CashOfferSectionBProps) => {

  const phoneNumber = "7868828251";

  return (
    <section className="py-12 bg-gradient-to-br from-secondary/10 to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <p className="text-lg text-muted-foreground font-medium">Your Fair Cash Offer</p>

          <div className="text-6xl md:text-7xl font-black text-secondary">
            {offerAmount}
          </div>

          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            For {propertyAddress || 'your property'}
          </p>

          {/* Preliminary offer disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-lg mx-auto">
            <p className="text-sm font-semibold text-amber-900">
              This is a preliminary offer. In many cases, we significantly improve it.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 max-w-sm mx-auto">
            <div className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-base font-medium">Close in 7-14 Days</span>
            </div>
            <p className="text-xs text-muted-foreground">Fast closing guaranteed</p>

            <div className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-base font-medium">No Repairs Needed</span>
            </div>
            <p className="text-xs text-muted-foreground">We buy as-is</p>

            <div className="flex items-center justify-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-base font-medium">No Realtor Fees</span>
            </div>
            <p className="text-xs text-muted-foreground">Save thousands</p>
          </div>

          {/* Accept offer button */}
          <ContactFormModal
            propertyAddress={propertyAddress}
            propertyId={propertyId}
            onSubmit={onViewOffer}
            buttonText="Accept This Offer"
            buttonClassName="bg-green-600 hover:bg-green-700 text-white text-lg px-10 py-6 h-auto font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
          />

          {/* Communication buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto pt-2">
            <a
              href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Hi, I'm interested in the offer for ${propertyAddress}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
            <a
              href={`sms:${phoneNumber}?body=${encodeURIComponent(`Hi, I'm interested in the offer for ${propertyAddress}`)}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
            >
              <Phone className="h-4 w-4" />
              SMS
            </a>
            <a
              href={`mailto:offers@mylocalinvest.com?subject=${encodeURIComponent(`Question about offer for ${propertyAddress}`)}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
            >
              <Calendar className="h-4 w-4" />
              Schedule Call
            </a>
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors sm:col-span-1 col-span-2"
            >
              <PhoneCall className="h-4 w-4" />
              Call Now
            </a>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            <ContactFormModal
              propertyAddress={propertyAddress}
              propertyId={propertyId}
              onSubmit={onViewOffer}
              buttonText="I Have Questions"
              buttonClassName="text-primary underline hover:no-underline text-xs bg-transparent hover:bg-transparent p-0 h-auto font-normal"
            />
            {' · '}
            <span>Call: 786 882 8251</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default CashOfferSectionB;
