import { PropertyCardView } from "./PropertyCardView";
import { PropertyCardMinimal } from "./PropertyCardMinimal";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_image_url: string | null;
  estimated_value: number;
  cash_offer_amount: number;
  approval_status?: string;
  rejection_reason?: string;
  rejection_notes?: string;
  approved_by_name?: string;
  tags?: string[];
  comparative_price?: number;
  airbnb_eligible?: boolean;
  focar?: string;
  owner_name?: string;
  owner_phone?: string;
}

interface AdaptivePropertyCardProps {
  property: Property;
  isSelected: boolean;
  onToggleSelect: () => void;
  isMinimalDesign: boolean;
  // Props para design clássico
  onAnalyze?: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUploadImage?: () => void;
  onManageTags?: () => void;
  onCheckAirbnb?: () => void;
  onEdit?: () => void;
  onAddNotes?: () => void;
  onGenerateOffer?: () => void;
  onViewPage?: () => void;
  onCopyLink?: () => void;
  onGenerateQR?: () => void;
}

export const AdaptivePropertyCard = ({
  property,
  isSelected,
  onToggleSelect,
  isMinimalDesign,
  onAnalyze,
  onApprove,
  onReject,
  onUploadImage,
  onManageTags,
  onCheckAirbnb,
  onEdit,
  onAddNotes,
  onGenerateOffer,
  onViewPage,
  onCopyLink,
  onGenerateQR,
}: AdaptivePropertyCardProps) => {
  if (isMinimalDesign) {
    return (
      <PropertyCardMinimal
        property={property}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        onApprove={onApprove}
        onReject={onReject}
        onViewDetails={onViewPage || (() => {})}
        onCall={(phone) => window.open(`tel:${phone}`, '_self')}
        onEmail={(id) => {
          // Email functionality to be implemented
        }}
      />
    );
  }

  return (
    <PropertyCardView
      property={property}
      isSelected={isSelected}
      onToggleSelect={onToggleSelect}
      onAnalyze={onAnalyze || (() => {})}
      onApprove={onApprove}
      onReject={onReject}
      onUploadImage={onUploadImage || (() => {})}
      onManageTags={onManageTags || (() => {})}
      onCheckAirbnb={onCheckAirbnb || (() => {})}
      onEdit={onEdit || (() => {})}
      onAddNotes={onAddNotes || (() => {})}
      onGenerateOffer={onGenerateOffer || (() => {})}
      onViewPage={onViewPage || (() => {})}
      onCopyLink={onCopyLink || (() => {})}
      onGenerateQR={onGenerateQR || (() => {})}
    />
  );
};
