import { useState, useEffect } from "react";
import { AdaptivePropertyCard } from "./AdaptivePropertyCard";
import { PropertyCardSkeleton } from "./PropertyCardSkeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

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

interface ResponsivePropertyGridProps {
  properties: Property[];
  isLoading: boolean;
  isMinimalDesign: boolean;
  selectedProperties: string[];
  onToggleSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUploadImage: (id: string) => void;
  onManageTags: (id: string) => void;
  onCheckAirbnb: (id: string) => void;
  onEdit: (property: Property) => void;
  onAddNotes: (id: string) => void;
  onGenerateOffer: (property: Property) => void;
  onViewPage: (slug: string) => void;
  onCopyLink: (slug: string) => void;
  onGenerateQR: (slug: string) => void;
}

export const ResponsivePropertyGrid = ({
  properties,
  isLoading,
  isMinimalDesign,
  selectedProperties,
  onToggleSelect,
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
}: ResponsivePropertyGridProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [itemsToShow, setItemsToShow] = useState(12);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLoadMore = () => {
    setItemsToShow((prev) => prev + 12);
  };

  const visibleProperties = properties.slice(0, itemsToShow);
  const hasMore = properties.length > itemsToShow;

  if (isLoading) {
    return (
      <div
        className={
          isMobile
            ? 'space-y-4'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <PropertyCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
        <p className="text-gray-500 mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={
          isMobile
            ? 'space-y-4'
            : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }
      >
        {visibleProperties.map((property) => (
          <AdaptivePropertyCard
            key={property.id}
            property={property}
            isSelected={selectedProperties.includes(property.id)}
            onToggleSelect={() => onToggleSelect(property.id)}
            isMinimalDesign={isMinimalDesign}
            onAnalyze={() => onAnalyze(property.id)}
            onApprove={() => onApprove(property.id)}
            onReject={() => onReject(property.id)}
            onUploadImage={() => onUploadImage(property.id)}
            onManageTags={() => onManageTags(property.id)}
            onCheckAirbnb={() => onCheckAirbnb(property.id)}
            onEdit={() => onEdit(property)}
            onAddNotes={() => onAddNotes(property.id)}
            onGenerateOffer={() => onGenerateOffer(property)}
            onViewPage={() => onViewPage(property.slug)}
            onCopyLink={() => onCopyLink(property.slug)}
            onGenerateQR={() => onGenerateQR(property.slug)}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="gap-2"
          >
            Load More ({properties.length - itemsToShow} remaining)
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
