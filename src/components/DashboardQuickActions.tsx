import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  Plus,
  FileDown,
  Zap,
  Rocket,
  Send,
  Users,
  Mail,
  Phone,
  CheckCircle
} from "lucide-react";

interface DashboardQuickActionsProps {
  onStartReview?: () => void;
  onAddProperty?: () => void;
  onExportData?: () => void;
  onStartCampaign?: () => void;
  onStartApprovedCampaign?: () => void;
  pendingCount?: number;
}

export const DashboardQuickActions = ({
  onStartReview,
  onAddProperty,
  onExportData,
  onStartCampaign,
  onStartApprovedCampaign,
  pendingCount = 0,
}: DashboardQuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-500" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Ações rápidas para aumentar sua produtividade
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Main Actions Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Start Review */}
          <Button
            onClick={onStartReview}
            className="h-20 flex-col gap-2 relative"
            variant="outline"
          >
            <Target className="h-5 w-5" />
            <div className="text-center">
              <div className="font-semibold text-xs">Review Queue</div>
              {pendingCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  {pendingCount} pending
                </div>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount > 99 ? "99+" : pendingCount}
              </div>
            )}
          </Button>

          {/* Campaign Approved - Primary Action */}
          <Button
            onClick={onStartApprovedCampaign}
            className="h-20 flex-col gap-2"
            variant="default"
          >
            <Rocket className="h-5 w-5" />
            <div className="text-center">
              <div className="font-semibold text-xs">🚀 Campaign</div>
              <div className="text-xs opacity-90">Approved</div>
            </div>
          </Button>

          {/* Add Property */}
          <Button
            onClick={onAddProperty}
            className="h-20 flex-col gap-2"
            variant="outline"
          >
            <Plus className="h-5 w-5" />
            <div className="font-semibold text-xs">Add Property</div>
          </Button>

          {/* Export Data */}
          <Button
            onClick={onExportData}
            className="h-20 flex-col gap-2"
            variant="outline"
          >
            <FileDown className="h-5 w-5" />
            <div className="font-semibold text-xs">Export Data</div>
          </Button>
        </div>

        {/* Campaign Tools Row */}
        <div className="border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Mail className="h-3 w-3" />
            Campaign Tools
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Start Custom Campaign */}
            <Button
              onClick={onStartCampaign}
              className="h-16 flex-col gap-1"
              variant="ghost"
              size="sm"
            >
              <Send className="h-4 w-4" />
              <div className="text-center">
                <div className="font-medium text-xs">Custom Campaign</div>
                <div className="text-xs opacity-70">Select properties</div>
              </div>
            </Button>

            {/* Placeholder for future campaign tools */}
            <div className="h-16 border-2 border-dashed border-muted rounded-md flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <CheckCircle className="h-4 w-4 mx-auto mb-1 opacity-50" />
                <div className="text-xs">More tools</div>
                <div className="text-xs opacity-70">coming soon</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
