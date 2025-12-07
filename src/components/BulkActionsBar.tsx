import { Button } from "@/components/ui/button";
import { X, QrCode, Trash2, FileText, Sparkles, Rocket } from "lucide-react";
import { LeadStatusSelect } from "./LeadStatusSelect";
import { LeadStatus } from "./LeadStatusBadge";
import { useState } from "react";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange: (status: LeadStatus) => void;
  onBulkDelete: () => void;
  onGenerateQRCodes: () => void;
  onPrintOffers: () => void;
  onStartCampaign: () => void;
  onAISuggestions: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
  onGenerateQRCodes,
  onPrintOffers,
  onStartCampaign,
  onAISuggestions,
}: BulkActionsBarProps) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('new');

  const handleStatusChange = (status: LeadStatus) => {
    setSelectedStatus(status);
    onBulkStatusChange(status);
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">{selectedCount}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'property' : 'properties'} selected
          </span>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Change Status:</span>
          <LeadStatusSelect 
            value={selectedStatus}
            onValueChange={handleStatusChange}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateQRCodes}
          className="gap-2"
        >
          <QrCode className="h-4 w-4" />
          QR Codes
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onPrintOffers}
          className="gap-2 bg-primary"
        >
          <FileText className="h-4 w-4" />
          Print Offers
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onAISuggestions}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          AI Suggestions
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="secondary"
          size="sm"
          onClick={onStartCampaign}
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          Start Campaign
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
};