import { useState } from "react";
import { SimpleLeadCapture } from "@/components/SimpleLeadCapture";
import { OfferRevealCard } from "@/components/OfferRevealCard";
import { InterestCapture } from "@/components/InterestCapture";
import { getOfferAverage, getOfferType, type OfferData } from "@/utils/offerUtils";
import { trackABEvent } from "@/utils/abTesting";
import { supabase } from "@/integrations/supabase/client";

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

  const getEmailDomain = (value: string) => {
    const normalized = value.trim().toLowerCase();
    const parts = normalized.split('@');
    return parts.length > 1 ? parts[1] : null;
  };

  const handleEmailSubmit = async (submittedEmail: string) => {
    const normalizedEmail = submittedEmail.trim().toLowerCase();

    void trackABEvent(property.id, 'email-first', 'email_submitted', {
      email_domain: getEmailDomain(normalizedEmail),
    });

    const { error } = await supabase
      .from('property_leads')
      .upsert(
        {
          property_id: property.id,
          email: normalizedEmail,
          interest_level: 'email-only',
          status: 'new',
          notes: 'Email captured via email-first variant',
          offer_viewed_at: new Date().toISOString(),
          user_agent: navigator.userAgent,
        },
        {
          onConflict: 'property_id,email,interest_level',
          ignoreDuplicates: true,
        },
      );

    if (error) {
      console.error('Error storing email-first lead:', error);
    }

    setEmail(normalizedEmail);
    setStep('revealed');

    void trackABEvent(property.id, 'email-first', 'offer_revealed');
  };

  const handleInterestSubmit = async (data: {
    fullName: string;
    phone: string;
    sellingTimeline: string;
  }) => {
    const sanitizedPhone = data.phone.trim();

    void trackABEvent(property.id, 'email-first', 'form_submitted', {
      selling_timeline: data.sellingTimeline,
      has_phone: Boolean(sanitizedPhone),
    });

    if (sanitizedPhone) {
      void trackABEvent(property.id, 'email-first', 'phone_collected', {
        phone_last4: sanitizedPhone.replace(/\D/g, '').slice(-4),
      });
    }

    const { error } = await supabase.from('property_leads').upsert(
      {
        property_id: property.id,
        email,
        full_name: data.fullName.trim(),
        phone: sanitizedPhone,
        selling_timeline: data.sellingTimeline,
        interest_level: 'interested',
        status: 'interested',
        notes: 'Lead submitted full interest form from email-first variant',
        user_agent: navigator.userAgent,
      },
      {
        onConflict: 'property_id,email,interest_level',
      },
    );

    if (error) {
      throw error;
    }

    setStep('interested');
  };

  const offerType = getOfferType(property);
  const offerAmount = offerType === 'range'
    ? Math.round(getOfferAverage(property))
    : Math.round(property.cash_offer_amount || property.estimated_value * 0.7);

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
            onInterestedClick={() => {
              void trackABEvent(property.id, 'email-first', 'clicked_interested');
              void trackABEvent(property.id, 'email-first', 'form_started');
            }}
            onJustEmailClick={() => {
              void trackABEvent(property.id, 'email-first', 'clicked_questions');
            }}
          />
        </>
      )}

      {step === 'interested' && (
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">Perfect</h2>
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

