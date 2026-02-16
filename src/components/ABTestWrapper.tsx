import { useEffect, useMemo, useState } from "react";
import { getABVariant, trackABEvent, type ABEventType, type ABVariant } from "@/utils/abTesting";
import { useFeatureToggle } from "@/contexts/FeatureToggleContext";
import { UltraSimpleVariant } from "@/components/variants/UltraSimpleVariant";
import { EmailFirstVariant } from "@/components/variants/EmailFirstVariant";
import { ProgressiveVariant } from "@/components/variants/ProgressiveVariant";
import { SocialProofVariant } from "@/components/variants/SocialProofVariant";
import { UrgencyVariant } from "@/components/variants/UrgencyVariant";
import PropertyPageMinimal from "@/components/PropertyPageMinimal";
import { type OfferData } from "@/utils/offerUtils";

interface ABTestWrapperProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
    zip_code?: string;
    property_image_url?: string | null;
    cash_offer_amount?: number;
  };
}

export const ABTestWrapper = ({ property }: ABTestWrapperProps) => {
  const { flags } = useFeatureToggle();
  const [variant, setVariant] = useState<ABVariant | null>(null);

  const minimalProperty = useMemo(() => ({
    ...property,
    slug: property.address?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown',
    status: 'active' as const,
    owner_name: null,
    neighborhood: null,
    zip_code: property.zip_code || '',
    property_image_url: property.property_image_url || null,
    cash_offer_amount: property.cash_offer_amount || property.estimated_value * 0.7,
  }), [property]);

  const trackMinimalEvent = (event: string, activeVariant: ABVariant) => {
    const eventMap: Record<string, ABEventType> = {
      viewed_offer: 'offer_revealed',
      form_started: 'form_started',
      form_submitted: 'form_submitted',
      clicked_accept: 'clicked_accept',
      clicked_questions: 'clicked_questions',
      clicked_interested: 'clicked_interested',
      phone_collected: 'phone_collected',
    };

    const mappedEvent = eventMap[event];
    if (mappedEvent) {
      void trackABEvent(property.id, activeVariant, mappedEvent);
    }
  };

  useEffect(() => {
    let assignedVariant: ABVariant;

    if (flags.forcePropertyVariant) {
      assignedVariant = flags.forcePropertyVariant as ABVariant;
    } else if (!flags.enableABTesting) {
      assignedVariant = 'default';
    } else {
      assignedVariant = getABVariant(property.id);
    }

    setVariant(assignedVariant);

    void trackABEvent(property.id, assignedVariant, 'page_view');

    let hasTrackedExit = false;
    const trackExit = () => {
      if (hasTrackedExit) {
        return;
      }

      hasTrackedExit = true;
      void trackABEvent(property.id, assignedVariant, 'exit');
    };

    const handleBeforeUnload = () => trackExit();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackExit();
    };
  }, [property.id, flags.enableABTesting, flags.forcePropertyVariant]);

  if (!variant) {
    // Loading state
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render variant
  switch (variant) {
    case 'ultra-simple':
      return <UltraSimpleVariant property={property} />;

    case 'email-first':
      return <EmailFirstVariant property={property} />;

    case 'minimal':
      return (
        <PropertyPageMinimal
          property={minimalProperty}
          onFormSubmit={() => {
            void trackABEvent(property.id, variant, 'form_started');
          }}
          trackEvent={(event: string) => {
            trackMinimalEvent(event, variant);
          }}
        />
      );

    case 'progressive':
      return <ProgressiveVariant property={property} />;

    case 'social-proof':
      return <SocialProofVariant property={property} />;

    case 'urgency':
      return <UrgencyVariant property={property} />;

    default:
      // Use PropertyPageMinimal for the default offer page layout
      return (
        <PropertyPageMinimal
          property={minimalProperty}
          onFormSubmit={() => {
            void trackABEvent(property.id, variant, 'form_started');
          }}
          trackEvent={(event: string) => {
            trackMinimalEvent(event, variant);
          }}
        />
      );
  }
};
