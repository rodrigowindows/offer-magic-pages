import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions";
import { AdminDashboardOverview } from "@/components/dashboard/AdminDashboardOverview";
import { TeamActivityDashboard } from "@/components/dashboard/TeamActivityDashboard";
import { TeamReportExporter } from "@/components/dashboard/TeamReportExporter";
import { FollowUpManager } from "@/components/follow-up/FollowUpManager";
import { FollowUpAutomationRules } from "@/components/follow-up/FollowUpAutomationRules";
import { AIDailyDigest } from "@/components/ai/AIDailyDigest";
import type { AdminProperty } from "@/hooks/useAdminProperties";

interface Props {
  properties: AdminProperty[];
  pendingCount: number;
  onStartReview: () => void;
  onAddProperty: () => void;
  onStartCampaign: () => void;
  onStartApprovedCampaign: () => void;
}

export const AdminDashboardTab = ({
  properties, pendingCount, onStartReview, onAddProperty,
  onStartCampaign, onStartApprovedCampaign,
}: Props) => (
  <div className="space-y-6">
    <MetricsDashboard properties={properties} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <DashboardQuickActions
          onStartReview={onStartReview}
          onAddProperty={onAddProperty}
          onExportData={() => {}}
          onStartCampaign={onStartCampaign}
          onStartApprovedCampaign={onStartApprovedCampaign}
          pendingCount={pendingCount}
        />
      </div>
      <div>
        <AIDailyDigest />
      </div>
    </div>
    <AdminDashboardOverview />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <FollowUpAutomationRules />
      <TeamActivityDashboard />
    </div>
    <div className="max-w-md"><TeamReportExporter /></div>
    <FollowUpManager />
  </div>
);
