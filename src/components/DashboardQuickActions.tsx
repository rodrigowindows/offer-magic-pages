import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target,
  Plus,
  FileDown,
  Zap,
  TrendingUp,
  Users,
  Mail,
  Phone
} from "lucide-react";

interface DashboardQuickActionsProps {
  onStartReview?: () => void;
  onAddProperty?: () => void;
  onExportData?: () => void;
  onStartCampaign?: () => void;
  pendingCount?: number;
}

export const DashboardQuickActions = ({
  onStartReview,
  onAddProperty,
  onExportData,
  onStartCampaign,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Start Review */}
          <Button
            onClick={onStartReview}
            className="h-24 flex-col gap-2 relative"
            variant="outline"
          >
            <Target className="h-6 w-6" />
            <div className="text-center">
              <div className="font-semibold text-sm">Start Review</div>
              {pendingCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  {pendingCount} pending
                </div>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                {pendingCount > 99 ? "99+" : pendingCount}
              </div>
            )}
          </Button>

          {/* Add Property */}
          <Button
            onClick={onAddProperty}
            className="h-24 flex-col gap-2"
            variant="outline"
          >
            <Plus className="h-6 w-6" />
            <div className="font-semibold text-sm">Add Property</div>
          </Button>

          {/* Export Data */}
          <Button
            onClick={onExportData}
            className="h-24 flex-col gap-2"
            variant="outline"
          >
            <FileDown className="h-6 w-6" />
            <div className="font-semibold text-sm">Export Data</div>
          </Button>

          {/* Start Campaign */}
          <Button
            onClick={onStartCampaign}
            className="h-24 flex-col gap-2"
            variant="outline"
          >
            <Mail className="h-6 w-6" />
            <div className="font-semibold text-sm">New Campaign</div>
          </Button>
        </div>

        {/* Secondary Actions */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" className="justify-start">
            <Users className="h-4 w-4 mr-2" />
            Team Activity
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Phone className="h-4 w-4 mr-2" />
            Call Queue
          </Button>
          <Button variant="ghost" size="sm" className="justify-start">
            <Mail className="h-4 w-4 mr-2" />
            Email Queue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
