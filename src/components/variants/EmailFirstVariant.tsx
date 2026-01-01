import { useState } from "react";
import { SimpleLeadCapture } from "@/components/SimpleLeadCapture";
import { OfferRevealCard } from "@/components/OfferRevealCard";
import { InterestCapture } from "@/components/InterestCapture";
import { trackABEvent } from "@/utils/abTesting";
import { supabase } from "@/lib/supabase";

interface EmailFirstVariantProps {
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    cash_offer_amount: number;
    estimated_value: number;
  };
}

export const EmailFirstVariant = ({ property }: EmailFirstVariantProps) => {
  const [step, setStep] = useState<'gate' | 'revealed' | 'interested'>('gate');
  const [email, setEmail] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);

  const handleEmailSubmit = async (submittedEmail: string) => {
    // Track event
    trackABEvent(property.id, 'email-first', 'email_submitted', { email: submittedEmail });

    // Save to database
    const { data, error } = await supabase
      .from('property_leads')
      .insert({
        property_id: property.id,
        email: submittedEmail,
        interest_level: 'email-only',
        offer_viewed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving lead:', error);
      throw error;
    }

    setEmail(submittedEmail);
    setLeadId(data.id);

    // Track offer revealed
    trackABEvent(property.id, 'email-first', 'offer_revealed');

    setStep('revealed');
  };

  const handleInterestSubmit = async (data: {
    fullName: string;
    phone: string;
    sellingTimeline: string;
  }) => {
    // Track event
    trackABEvent(property.id, 'email-first', 'phone_collected', data);

    // Update lead in database
    const { error } = await supabase
      .from('property_leads')
      .update({
        full_name: data.fullName,
        phone: data.phone,
        selling_timeline: data.sellingTimeline,
        interest_level: 'interested',
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead:', error);
      throw error;
    }

    trackABEvent(property.id, 'email-first', 'form_submitted');
    setStep('interested');
  };

  return (
    <div className="space-y-6">
      {step === 'gate' && (
        <SimpleLeadCapture
          isOpen={true}
          onClose={() => {}}
          onSubmit={handleEmailSubmit}
          propertyAddress={`${property.address}, ${property.city}, ${property.state}`}
          offerAmount={property.cash_offer_amount}
        />
      )}

      {step === 'revealed' && (
        <>
          <OfferRevealCard
            cashOfferAmount={property.cash_offer_amount}
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
