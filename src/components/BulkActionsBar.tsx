import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, QrCode, Trash2, FileText, Sparkles, Rocket, Play, CheckCircle2 } from "lucide-react";
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
  onStartSequence?: () => void;
  allApproved?: boolean;
  propertiesWithPreferredContacts?: number;
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
  onStartSequence,
  allApproved = false,
  propertiesWithPreferredContacts = 0,
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
          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${allApproved ? 'bg-green-100' : 'bg-primary/10'}`}>
            <span className={`text-sm font-semibold ${allApproved ? 'text-green-700' : 'text-primary'}`}>{selectedCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground">
              {selectedCount} {selectedCount === 1 ? 'property' : 'properties'} selected
              {allApproved && <span className="ml-2 text-green-600 font-semibold">✓ Approved</span>}
            </span>
            {propertiesWithPreferredContacts > 0 && (
              <Badge variant="outline" className="gap-1 h-5 px-2 w-fit bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3" />
                {propertiesWithPreferredContacts} with preferred contacts
              </Badge>
            )}
          </div>
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
          variant="default"
          size="sm"
          onClick={onStartCampaign}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Rocket className="h-4 w-4" />
          🚀 Campaign
        </Button>

        {onStartSequence && (
          <Button
            variant="default"
            size="sm"
            onClick={onStartSequence}
            className="gap-2 bg-chart-2 hover:bg-chart-2/90"
          >
            <Play className="h-4 w-4" />
            Sequence
          </Button>
        )}

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