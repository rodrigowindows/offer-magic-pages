import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Target,
  Keyboard,
  TrendingUp
} from "lucide-react";
import { PropertyApprovalDialog } from "./PropertyApprovalDialog";
import { PropertyImageDisplay } from "./PropertyImageDisplay";
import { EmptyState } from "./EmptyState";

interface QueueProperty {
  id: string;
  property_address: string;
  owner_name: string;
  property_image_url: string | null;
  estimated_value: number;
  tax_amount: number;
  account_number: string;
  approval_status: string | null;
}

interface DailyStats {
  reviewed_today: number;
  approved_today: number;
  rejected_today: number;
  total_pending: number;
  user_rank: number;
  total_users: number;
}

export const ReviewQueue = () => {
  const [properties, setProperties] = useState<QueueProperty[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const currentProperty = properties[currentIndex];
  const progress = properties.length > 0 ? ((currentIndex + 1) / properties.length) * 100 : 0;

  useEffect(() => {
    fetchPendingProperties();
    if (user) {
      fetchDailyStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPendingProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("id, property_address, owner_name, property_image_url, estimated_value, tax_amount, account_number, approval_status")
        .or("approval_status.is.null,approval_status.eq.pending")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar fila",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    if (!user) return;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get today's reviews by current user
      const { data: userReviews, error: userError } = await supabase
        .from("properties")
        .select("approval_status")
        .eq("approved_by", user.id)
        .gte("approved_at", today.toISOString());

      if (userError) throw userError;

      const reviewed_today = userReviews?.length || 0;
      const approved_today = userReviews?.filter(p => p.approval_status === "approved").length || 0;
      const rejected_today = userReviews?.filter(p => p.approval_status === "rejected").length || 0;

      // Get total pending
      const { count: totalPending, error: countError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");

      if (countError) throw countError;

      // Get all users' stats for ranking
      const { data: allUsers, error: rankError } = await supabase
        .from("properties")
        .select("approved_by")
        .not("approved_by", "is", null)
        .gte("approved_at", today.toISOString());

      if (rankError) throw rankError;

      // Calculate user counts
      const userCounts = new Map<string, number>();
      allUsers?.forEach(p => {
        const count = userCounts.get(p.approved_by) || 0;
        userCounts.set(p.approved_by, count + 1);
      });

      const sortedUsers = Array.from(userCounts.entries())
        .sort((a, b) => b[1] - a[1]);

      const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

      setDailyStats({
        reviewed_today,
        approved_today,
        rejected_today,
        total_pending: totalPending || 0,
        user_rank: userRank || sortedUsers.length + 1,
        total_users: sortedUsers.length,
      });
    } catch (error: any) {
      console.error("Error fetching daily stats:", error);
    }
  };

  const handleNext = () => {
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast({
        title: "🎉 Parabéns!",
        description: "Você revisou todas as propriedades da fila!",
      });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleStatusChange = async () => {
    await fetchPendingProperties();
    await fetchDailyStats();

    // Move to next property after approval/rejection
    if (currentIndex < properties.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }

    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle}
        title="Fila Vazia! 🎉"
        description="Parabéns! Não há propriedades pendentes para revisar. Você está em dia com o trabalho!"
        action={{
          label: "Ver Todas as Propriedades",
          onClick: () => {
            const tabs = document.querySelector('[value="properties"]') as HTMLElement;
            tabs?.click();
          },
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{dailyStats?.reviewed_today || 0}</div>
              <p className="text-xs text-muted-foreground">Revisadas Hoje</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{dailyStats?.approved_today || 0}</div>
              <p className="text-xs text-muted-foreground">Aprovadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <div className="text-2xl font-bold">{dailyStats?.rejected_today || 0}</div>
              <p className="text-xs text-muted-foreground">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{dailyStats?.total_pending || 0}</div>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">
                #{dailyStats?.user_rank || "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                Ranking ({dailyStats?.total_users || 0} users)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Review Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revisar Propriedades</CardTitle>
              <CardDescription>
                Propriedade {currentIndex + 1} de {properties.length}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {properties.length - currentIndex} restantes
            </Badge>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Property Display */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image */}
            <div className="space-y-4">
              <PropertyImageDisplay
                propertyId={currentProperty.id}
                propertyImageUrl={currentProperty.property_image_url}
                accountNumber={currentProperty.account_number}
              />
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold mb-2">{currentProperty.property_address}</h3>
                <p className="text-muted-foreground">Owner: {currentProperty.owner_name}</p>
                <p className="text-sm text-muted-foreground">Account: {currentProperty.account_number}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Estimated Value</p>
                  <p className="text-xl font-bold">
                    ${currentProperty.estimated_value?.toLocaleString() || "N/A"}
                  </p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Tax Amount</p>
                  <p className="text-xl font-bold">
                    ${currentProperty.tax_amount?.toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Keyboard className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold text-blue-900">Atalhos de Teclado</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded">A</kbd>
                    <span>Aprovar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded">R</kbd>
                    <span>Rejeitar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded">→</kbd>
                    <span>Próxima</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-2 py-1 bg-white border rounded">←</kbd>
                    <span>Anterior</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            <Button
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              className="px-8"
            >
              Revisar Propriedade
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={currentIndex === properties.length - 1}
            >
              Próxima
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      {currentProperty && (
        <PropertyApprovalDialog
          propertyId={currentProperty.id}
          propertyAddress={currentProperty.property_address}
          currentStatus={currentProperty.approval_status || undefined}
          onStatusChange={handleStatusChange}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
};
