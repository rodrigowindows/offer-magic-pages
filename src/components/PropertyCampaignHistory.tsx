import { CampaignAnalytics } from "./CampaignAnalytics";
import { CampaignExport } from "./CampaignExport";
import { ResponseTimeAnalytics } from "./ResponseTimeAnalytics";
import { LeadScoreBadge } from "./LeadScoreBadge";

interface PropertyCampaignHistoryProps {
  propertyId: string;
  leadStatus: string;
  hasPhone: boolean;
  hasEmail?: boolean;
}

export function PropertyCampaignHistory({
  propertyId,
  leadStatus,
  hasPhone,
  hasEmail,
}: PropertyCampaignHistoryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Campaign History</h3>
          <LeadScoreBadge
            propertyId={propertyId}
            leadStatus={leadStatus}
            hasPhone={hasPhone}
            hasEmail={hasEmail}
          />
        </div>
        <CampaignExport propertyId={propertyId} />
      </div>
      
      <ResponseTimeAnalytics propertyId={propertyId} />
      
      <CampaignAnalytics propertyId={propertyId} />
    </div>
  );
}
