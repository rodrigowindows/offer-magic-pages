import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import { MoreVertical, TrendingUp, DollarSign } from "lucide-react";

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
  focar?: string; // score
  owner_name?: string;
  owner_phone?: string;
}

interface PropertyCardViewProps {
  property: Property;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUploadImage: (id: string) => void;
  onManageTags: (id: string) => void;
  onCheckAirbnb: (id: string) => void;
  onEdit: (id: string) => void;
  onAddNotes: (id: string) => void;
  onGenerateOffer: (id: string) => void;
  onViewPage: (slug: string) => void;
  onCopyLink: (slug: string) => void;
  onGenerateQR: (slug: string) => void;
}

export const PropertyCardView = ({
  property,
  isSelected,
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
}: PropertyCardViewProps) => {
  const offerPercentage = ((property.cash_offer_amount / property.estimated_value) * 100).toFixed(1);
  const score = property.focar ? parseInt(property.focar) : 0;

  // Determine approval status color
  const getStatusBadge = () => {
    const status = property.approval_status || "pending";
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    };
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  // Get rejection reason label
  const REJECTION_REASONS: Record<string, string> = {
    "too-good-condition": "Casa muito boa",
    "llc-owned": "LLC",
    "commercial": "Comercial",
    "duplicate": "Duplicado",
    "wrong-location": "Localização errada",
    "no-equity": "Sem equity",
    "already-contacted": "Já contatado",
    "occupied-rented": "Ocupado/Alugado",
    "recent-sale": "Venda recente",
    "hoa-restrictions": "Restrições HOA",
    "title-issues": "Problemas título",
    "other": "Outro",
  };

  const getRejectionLabel = () => {
    if (!property.rejection_reason) return null;
    return REJECTION_REASONS[property.rejection_reason] || property.rejection_reason;
  };

  // Determine score color and label
  const getScoreInfo = () => {
    if (score >= 85) return { color: "text-red-600", label: "🔥 HOT", bg: "bg-red-50" };
    if (score >= 70) return { color: "text-orange-600", label: "🟠 WARM", bg: "bg-orange-50" };
    if (score >= 50) return { color: "text-yellow-600", label: "🟡 COOL", bg: "bg-yellow-50" };
    return { color: "text-gray-600", label: "⚪ LOW", bg: "bg-gray-50" };
  };

  const scoreInfo = getScoreInfo();

  return (
    <Card className="hover:shadow-lg transition-all duration-200 relative">
      {/* Selection Checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(property.id)}
          className="bg-white dark:bg-gray-800 shadow-md"
        />
      </div>

      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative h-48 bg-muted">
          <PropertyImageDisplay
            imageUrl={property.property_image_url || ""}
            address={property.address}
            className="w-full h-full"
            showZoom={true}
          />

          {/* Status Badge Overlay */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
            {getStatusBadge()}
            {property.approval_status === "rejected" && getRejectionLabel() && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                {getRejectionLabel()}
              </Badge>
            )}
            {property.approved_by_name && (
              <span className="text-xs text-white bg-black/50 px-1 rounded">
                por {property.approved_by_name}
              </span>
            )}
          </div>

          {/* Score Badge */}
          {score > 0 && (
            <div className={`absolute bottom-2 left-2 px-3 py-1 rounded-full ${scoreInfo.bg} ${scoreInfo.color} font-bold text-sm shadow-md`}>
              {score} {scoreInfo.label}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-3">
          {/* Address */}
          <div>
            <h3 className="font-bold text-lg line-clamp-1">{property.address}</h3>
            <p className="text-sm text-muted-foreground">
              {property.city}, {property.state} {property.zip_code}
            </p>
            {property.owner_name && (
              <p className="text-xs text-muted-foreground mt-1">
                Proprietário: {property.owner_name}
              </p>
            )}
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="font-semibold">${property.estimated_value.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Oferta</p>
                <p className="font-semibold text-green-600">
                  ${property.cash_offer_amount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Offer Percentage Bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>% da Oferta</span>
              <span className="font-semibold">{offerPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  parseFloat(offerPercentage) < 65
                    ? "bg-red-500"
                    : parseFloat(offerPercentage) < 75
                    ? "bg-green-500"
                    : parseFloat(offerPercentage) < 85
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
                style={{ width: `${Math.min(parseFloat(offerPercentage), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>60%</span>
              <span>70%</span>
              <span>80%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Tags */}
          {property.tags && property.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {property.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {property.tags.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{property.tags.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2 text-xs">
            {property.comparative_price && (
              <Badge variant="outline" className="gap-1">
                🤖 AI: ${property.comparative_price.toLocaleString()}
              </Badge>
            )}
            {property.airbnb_eligible && (
              <Badge variant="outline" className="gap-1">
                ✅ Airbnb OK
              </Badge>
            )}
            {property.owner_phone && (
              <Badge variant="outline" className="gap-1">
                📞 Tem Telefone
              </Badge>
            )}
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              onClick={() => onAnalyze(property.id)}
              variant="default"
              size="sm"
              className="w-full"
            >
              📊 Analisar
            </Button>
            <Button
              onClick={() => onApprove(property.id)}
              variant="default"
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              ✓ Aprovar
            </Button>
            <Button
              onClick={() => onReject(property.id)}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              ✗ Rejeitar
            </Button>
          </div>

          {/* Secondary Actions - Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <MoreVertical className="h-4 w-4 mr-2" />
                Mais Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={() => onUploadImage(property.id)}>
                📷 Upload Imagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageTags(property.id)}>
                🏷️ Gerenciar Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCheckAirbnb(property.id)}>
                🏠 Verificar Airbnb
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(property.id)}>
                ✏️ Editar Propriedade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddNotes(property.id)}>
                📝 Adicionar Notas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateOffer(property.id)}>
                💰 Gerar Carta de Oferta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewPage(property.slug)}>
                🌐 Ver Landing Page
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCopyLink(property.slug)}>
                📋 Copiar Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onGenerateQR(property.slug)}>
                📱 Gerar QR Code
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

// Grid wrapper component
interface PropertyCardsGridProps {
  properties: Property[];
  selectedProperties: string[];
  onToggleSelect: (id: string) => void;
  onAnalyze: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onUploadImage: (id: string) => void;
  onManageTags: (id: string) => void;
  onCheckAirbnb: (id: string) => void;
  onEdit: (id: string) => void;
  onAddNotes: (id: string) => void;
  onGenerateOffer: (id: string) => void;
  onViewPage: (slug: string) => void;
  onCopyLink: (slug: string) => void;
  onGenerateQR: (slug: string) => void;
}

export const PropertyCardsGrid = ({
  properties,
  selectedProperties,
  ...actions
}: PropertyCardsGridProps) => {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">Nenhuma propriedade encontrada</p>
        <p className="text-sm">Ajuste os filtros ou importe novas propriedades</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {properties.map((property) => (
        <PropertyCardView
          key={property.id}
          property={property}
          isSelected={selectedProperties.includes(property.id)}
          {...actions}
        />
      ))}
    </div>
  );
};
