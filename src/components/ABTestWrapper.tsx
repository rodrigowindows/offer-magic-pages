import { useEffect, useState } from "react";
import { getABVariant, trackABEvent, type ABVariant } from "@/utils/abTesting";
import { UltraSimpleVariant } from "@/components/variants/UltraSimpleVariant";
import { EmailFirstVariant } from "@/components/variants/EmailFirstVariant";
import { type OfferData } from "@/utils/offerUtils";

interface ABTestWrapperProps {
  property: OfferData & {
    id: string;
    address: string;
    city: string;
    state: string;
    estimated_value: number;
  };
}

export const ABTestWrapper = ({ property }: ABTestWrapperProps) => {
  const [variant, setVariant] = useState<ABVariant | null>(null);

  useEffect(() => {
    // Get assigned variant
    const assignedVariant = getABVariant(property.id);
    setVariant(assignedVariant);

    // Track page view
    trackABEvent(property.id, assignedVariant, 'page_view');

    // Track exit
    const handleBeforeUnload = () => {
      trackABEvent(property.id, assignedVariant, 'exit');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [property.id]);

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

    case 'progressive':
      // TODO: Implement ProgressiveVariant
      return <EmailFirstVariant property={property} />;

    case 'social-proof':
      // TODO: Implement SocialProofVariant
      return <UltraSimpleVariant property={property} />;

    case 'urgency':
      // TODO: Implement UrgencyVariant
      return <UltraSimpleVariant property={property} />;

    default:
      return <UltraSimpleVariant property={property} />;
  }
};
