import { useState } from "react";
import { SimpleLeadCapture } from "@/components/SimpleLeadCapture";
import { OfferRevealCard } from "@/components/OfferRevealCard";
import { InterestCapture } from "@/components/InterestCapture";
import { formatOffer, getOfferType, type OfferData } from "@/utils/offerUtils";

interface EmailFirstVariantProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

export const EmailFirstVariant = ({ property }: EmailFirstVariantProps) => {
  const [step, setStep] = useState<'gate' | 'revealed' | 'interested'>('gate');
  const [email, setEmail] = useState('');

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    setStep('revealed');
  };

  const handleInterestSubmit = async (data: {
    fullName: string;
    phone: string;
    sellingTimeline: string;
  }) => {
    setStep('interested');
  };

  const offerType = getOfferType(property);
  const offerAmount = offerType === 'range'
    ? (property.min_offer_amount! + property.max_offer_amount!) / 2
    : property.cash_offer_amount!;

  return (
    <div className="space-y-6">
      {step === 'gate' && (
        <SimpleLeadCapture
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleEmailSubmit}
          propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
          offerAmount={offerAmount}
        />
      )}

      {step === 'revealed' && (
        <>
          <OfferRevealCard
            cashOfferAmount={offerAmount}
            estimatedValue={property.estimated_value}
            propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
            leadName="there"
          />

          <InterestCapture
            email={email}
            onSubmit={handleInterestSubmit}
          />
        </>
      )}

      {step === 'interested' && (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Perfect! 🎉</h2>
          <p className="text-lg text-muted-foreground">
            We'll call you shortly to discuss next steps.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Expect a call within 2 hours during business hours
          </p>
        </div>
      )}
    </div>
  );
};

