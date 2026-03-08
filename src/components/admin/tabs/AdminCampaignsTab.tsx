import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { SequenceManager } from "@/components/follow-up/SequenceManager";
import { ResponseTimeAnalytics } from "@/components/dashboard/ResponseTimeAnalytics";
import { CampaignAnalytics } from "@/components/campaign/CampaignAnalytics";
import { EmailCampaignStats } from "@/components/campaign/EmailCampaignStats";
import { CampaignExport } from "@/components/campaign/CampaignExport";

interface Props {
  onOpenTemplates: () => void;
}

export const AdminCampaignsTab = ({ onOpenTemplates }: Props) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-semibold text-foreground">Campaign Management</h2>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onOpenTemplates}>
          <FileText className="h-4 w-4 mr-2" />Templates
        </Button>
        <CampaignExport />
      </div>
    </div>
    <SequenceManager />
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      <ResponseTimeAnalytics />
      <CampaignAnalytics />
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-4">Email Campaigns</h3>
      <EmailCampaignStats />
    </div>
  </div>
);
