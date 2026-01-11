import { Card } from "@/components/ui/card";
import { formatOfferForTemplate } from "@/utils/offerUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import {
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  owner_name?: string;
  owner_phone?: string;
}

interface PropertyCardMinimalProps {
  property: Property;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
  onCall?: (phone: string) => void;
  onEmail?: (id: string) => void;
}

export const PropertyCardMinimal = ({
  property,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetails,
  onCall,
  onEmail,
}: PropertyCardMinimalProps) => {
  const isPending = !property.approval_status || property.approval_status === 'pending';
  const isApproved = property.approval_status === 'approved';
  const isRejected = property.approval_status === 'rejected';

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
      {/* Selection Checkbox - Minimal */}
      <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          className="bg-white shadow-lg"
        />
      </div>

      {/* Status Badge - Top Right */}
      {!isPending && (
        <div className="absolute top-3 right-3 z-10">
          {isApproved && (
            <Badge className="bg-green-500 text-white border-0 shadow-lg">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aprovado
            </Badge>
          )}
          {isRejected && (
            <Badge className="bg-red-500 text-white border-0 shadow-lg">
              <XCircle className="h-3 w-3 mr-1" />
              Rejeitado
            </Badge>
          )}
        </div>
      )}

      {/* Image */}
      <div className="relative h-56 overflow-hidden">
        <PropertyImageDisplay
          imageUrl={property.property_image_url || ""}
          address={property.address}
          className="w-full h-full"
          showZoom={false}
        />

        {/* Hover Overlay with Quick Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1 bg-white/90 hover:bg-white text-gray-900"
              onClick={onViewDetails}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Detalhes
            </Button>
            {property.owner_phone && onCall && (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white text-gray-900"
                onClick={() => onCall(property.owner_phone!)}
              >
                <Phone className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content - Clean and Minimal */}
      <div className="p-5 space-y-4">
        {/* Address */}
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 mb-1">
            {property.address}
          </h3>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            {property.city}, {property.state} {property.zip_code}
          </div>
        </div>

        {/* Owner Info - If Available */}
        {property.owner_name && (
          <div className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">
            <div className="font-medium">{property.owner_name}</div>
            {property.owner_phone && (
              <div className="text-gray-500">{property.owner_phone}</div>
            )}
          </div>
        )}

        {/* Price Section - Clean */}
        <div className="flex items-baseline justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Oferta</div>
            <div className="text-2xl font-bold text-green-600">
              {formatOfferForTemplate(property)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Valor</div>
            <div className="text-lg font-semibold text-gray-700">
              ${(property.estimated_value / 1000).toFixed(0)}k
            </div>
          </div>
        </div>

        {/* Actions - Only if Pending */}
        {isPending && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0"
              onClick={onApprove}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={onReject}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
