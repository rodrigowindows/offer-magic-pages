/**
 * Property URL Preview Modal
 * Shows property URL, QR code, and download options
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Download, ExternalLink, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Channel } from '@/types/marketing.types';

interface PropertyUrlPreviewModalProps {
  property: {
    id: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    owner_name?: string;
    cash_offer_amount?: number;
  } | null;
  channel: Channel;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to create SEO-friendly URL slug
const createPropertySlug = (address: string, city: string, zip: string): string => {
  const addressSlug = address
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const citySlug = city
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();

  return `${addressSlug}-${citySlug}-${zip}`;
};

// Generate property URL
const generatePropertyUrl = (property: any, channel: Channel): string => {
  const propertySlug = createPropertySlug(
    property.address || 'property',
    property.city || 'orlando',
    property.zip_code || '00000'
  );
  return `https://offer.mylocalinvest.com/property/${propertySlug}?src=${channel.toLowerCase()}`;
};

// Generate QR Code URL
const generateQrCodeUrl = (propertyUrl: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(propertyUrl)}`;
};

export const PropertyUrlPreviewModal = ({
  property,
  channel,
  isOpen,
  onClose,
}: PropertyUrlPreviewModalProps) => {
  const { toast } = useToast();

  if (!property) return null;

  const propertyUrl = generatePropertyUrl(property, channel);
  const qrCodeUrl = generateQrCodeUrl(propertyUrl);

  // Copy URL to clipboard
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      toast({
        title: 'URL Copied!',
        description: 'Property URL copied to clipboard',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  // Download QR Code
  const downloadQrCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-code-${createPropertySlug(property.address, property.city, property.zip_code)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'QR Code Downloaded!',
        description: `QR code for ${property.address} saved successfully`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Could not download QR code',
        variant: 'destructive',
      });
    }
  };

  // Open URL in new tab
  const openUrl = () => {
    window.open(propertyUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-blue-600" />
            Property Link & QR Code Preview
          </DialogTitle>
          <DialogDescription>
            View and download the marketing materials for this property
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Property Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{property.address}</h3>
                <p className="text-sm text-gray-600">
                  {property.city}, {property.state} {property.zip_code}
                </p>
                {property.owner_name && (
                  <p className="text-sm text-gray-600 mt-1">Owner: {property.owner_name}</p>
                )}
              </div>
              <Badge className="bg-blue-600 text-white">
                {channel.toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Property URL */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Property URL:</label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUrl}
                  className="h-8"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openUrl}
                  className="h-8"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <code className="text-sm text-blue-600 break-all font-mono">
                {propertyUrl}
              </code>
            </div>
            <p className="text-xs text-gray-500">
              ℹ️ This URL includes tracking parameter <code className="bg-gray-100 px-1 py-0.5 rounded">?src={channel}</code> to monitor {channel.toUpperCase()} campaign performance
            </p>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">QR Code:</label>
              <Button
                size="sm"
                variant="default"
                onClick={downloadQrCode}
                className="h-8 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-3 w-3 mr-1" />
                Download PNG
              </Button>
            </div>
            <div className="flex justify-center p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 border-4 border-white shadow-lg rounded"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              💡 Scan this QR code to test the link on your mobile device
            </p>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-blue-600 font-medium mb-1">Channel</div>
              <div className="text-lg font-semibold text-blue-900">{channel.toUpperCase()}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-green-600 font-medium mb-1">
                {property.cash_offer_amount ? 'Cash Offer' : 'Property Value'}
              </div>
              <div className="text-lg font-semibold text-green-900">
                {property.cash_offer_amount
                  ? `$${property.cash_offer_amount.toLocaleString()}`
                  : 'TBD'
                }
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Ready to use in your {channel} campaign
          </p>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
