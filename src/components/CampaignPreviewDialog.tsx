import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, ExternalLink, Link2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTrackablePropertyLink } from "@/lib/trackingLinks";

interface Property {
  id: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  owner_name?: string;
  owner_phone?: string;
  cash_offer_amount: number;
}

interface CampaignPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyIds: string[];
  onConfirm: () => void;
}

export const CampaignPreviewDialog = ({
  open,
  onOpenChange,
  propertyIds,
  onConfirm,
}: CampaignPreviewDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [sellerName, setSellerName] = useState("Alex");

  useEffect(() => {
    if (open && propertyIds.length > 0) {
      fetchProperties();
      fetchSettings();
    }
  }, [open, propertyIds]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("id, slug, address, city, state, zip_code, owner_name, owner_phone, cash_offer_amount")
        .in("id", propertyIds);

      if (error) throw error;
      setProperties((data || []) as Property[]);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("email_settings")
        .select("headers")
        .limit(1)
        .maybeSingle();

      if (data?.headers) {
        setSellerName((data.headers as Record<string, string>)?.seller_name || "Alex");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generatePreviewMessage = (property: Property) => {
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;
    const trackableLink = generateTrackablePropertyLink(property.slug, crypto.randomUUID());
    
    return {
      to: property.owner_phone || "No phone",
      name: property.owner_name || "Property Owner",
      address: fullAddress,
      offerAmount: formatCurrency(property.cash_offer_amount),
      trackableUrl: trackableLink.trackingUrl,
      originalUrl: trackableLink.originalUrl,
    };
  };

  const propertiesWithPhone = properties.filter(p => p.owner_phone);
  const propertiesWithoutPhone = properties.filter(p => !p.owner_phone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Campaign Preview
          </DialogTitle>
          <DialogDescription>
            Review messages before sending to {properties.length} properties
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <Badge variant="default" className="text-sm">
                {propertiesWithPhone.length} with phone
              </Badge>
              {propertiesWithoutPhone.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {propertiesWithoutPhone.length} without phone
                </Badge>
              )}
            </div>

            {/* Preview Cards */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {properties.map((property) => {
                  const preview = generatePreviewMessage(property);
                  return (
                    <Card key={property.id} className={!property.owner_phone ? "opacity-60" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{preview.name}</span>
                          {!property.owner_phone && (
                            <Badge variant="destructive" className="text-xs">
                              No phone
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">
                            <strong>To:</strong> {preview.to}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Property:</strong> {preview.address}
                          </p>
                          <p className="text-muted-foreground">
                            <strong>Offer:</strong> {preview.offerAmount}
                          </p>
                        </div>

                        {/* Message Preview */}
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <p>
                            Hi {preview.name}, this is {sellerName}. I'm interested in purchasing your property at{" "}
                            <strong>{property.address}</strong> for <strong>{preview.offerAmount}</strong> cash.
                            No repairs needed, quick close. Click below for details:
                          </p>
                        </div>

                        {/* Trackable Link Preview */}
                        <div className="flex items-center gap-2 text-xs">
                          <Link2 className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Trackable link:</span>
                          <a
                            href={preview.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            View offer page
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onConfirm();
                }}
                disabled={propertiesWithPhone.length === 0}
              >
                Send {propertiesWithPhone.length} Campaign{propertiesWithPhone.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
