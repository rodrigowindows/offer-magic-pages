import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Mail,
  FileDown,
  Trash2,
  X,
  Tag,
  QrCode,
  FileText,
} from "lucide-react";

interface FloatingBulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onAddToCampaign: () => void;
  onExport: () => void;
  onBulkDelete: () => void;
  onGenerateQRCodes?: () => void;
  onPrintOffers?: () => void;
  onAddTags?: () => void;
}

export const FloatingBulkActionsToolbar = ({
  selectedCount,
  onClearSelection,
  onApproveAll,
  onRejectAll,
  onAddToCampaign,
  onExport,
  onBulkDelete,
  onGenerateQRCodes,
  onPrintOffers,
  onAddTags,
}: FloatingBulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <Card className="shadow-2xl border-2 border-blue-500 bg-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3 pr-4">
              <Checkbox checked={true} className="pointer-events-none" />
              <span className="font-semibold text-gray-900">
                {selectedCount} {selectedCount === 1 ? 'property' : 'properties'} selected
              </span>
            </div>

            <Separator orientation="vertical" className="h-10" />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={onApproveAll}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve All
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={onRejectAll}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <XCircle className="h-4 w-4" />
                Reject All
              </Button>

              <Separator orientation="vertical" className="h-10" />

              <Button
                size="sm"
                variant="outline"
                onClick={onAddToCampaign}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Add to Campaign
              </Button>

              {onAddTags && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAddTags}
                  className="gap-2"
                >
                  <Tag className="h-4 w-4" />
                  Add Tags
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export
              </Button>

              {onGenerateQRCodes && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onGenerateQRCodes}
                  className="gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  QR Codes
                </Button>
              )}

              {onPrintOffers && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrintOffers}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Print Offers
                </Button>
              )}

              <Separator orientation="vertical" className="h-10" />

              <Button
                size="sm"
                variant="outline"
                onClick={onBulkDelete}
                className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>

            <Separator orientation="vertical" className="h-10" />

            {/* Clear Selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="gap-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
