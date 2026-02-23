import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, CheckCircle, XCircle, Clock, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface UserStats {
  user_id: string;
  user_name: string;
  approved_count: number;
  rejected_count: number;
  total_count: number;
  approval_rate: number;
  avg_time_minutes?: number;
  today_count: number;
  week_count: number;
  month_count: number;
}

interface TeamMetrics {
  total_processed: number;
  total_approved: number;
  total_rejected: number;
  total_pending: number;
  team_approval_rate: number;
  today_processed: number;
  week_processed: number;
  active_users: number;
}

export const TeamActivityDashboard = () => {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("week");

  useEffect(() => {
    fetchTeamActivity();
  }, [timeRange]);

  const fetchTeamActivity = async () => {
    try {
      setIsLoading(true);

      // Calculate date filters
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let dateFilter = "";
      if (timeRange === "today") {
        dateFilter = today.toISOString();
      } else if (timeRange === "week") {
        dateFilter = weekAgo.toISOString();
      } else if (timeRange === "month") {
        dateFilter = monthAgo.toISOString();
      }

      // Fetch all properties with approval data
      const query = supabase
        .from("properties")
        .select("approved_by, approved_by_name, approval_status, approved_at");

      if (dateFilter && timeRange !== "all") {
        query.gte("approved_at", dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate user stats
      const userMap = new Map<string, UserStats>();
      let totalApproved = 0;
      let totalRejected = 0;
      let todayCount = 0;
      let weekCount = 0;

      data?.forEach((prop) => {
        if (!prop.approved_by) return;

        const userId = prop.approved_by;
        const userName = prop.approved_by_name || "Unknown User";
        const approvedAt = new Date(prop.approved_at);

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            user_name: userName,
            approved_count: 0,
            rejected_count: 0,
            total_count: 0,
            approval_rate: 0,
            today_count: 0,
            week_count: 0,
            month_count: 0,
          });
        }

        const user = userMap.get(userId)!;
        user.total_count++;

        if (prop.approval_status === "approved") {
          user.approved_count++;
          totalApproved++;
        } else if (prop.approval_status === "rejected") {
          user.rejected_count++;
          totalRejected++;
        }

        // Time-based counts
        if (approvedAt >= today) {
          user.today_count++;
          todayCount++;
        }
        if (approvedAt >= weekAgo) {
          user.week_count++;
          weekCount++;
        }
        if (approvedAt >= monthAgo) {
          user.month_count++;
        }

        user.approval_rate = (user.approved_count / user.total_count) * 100;
      });

      const userList = Array.from(userMap.values()).sort(
        (a, b) => b.total_count - a.total_count
      );

      setUserStats(userList);

      // Get pending count
      const { count: pendingCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .or("approval_status.is.null,approval_status.eq.pending");

      // Calculate team metrics
      const totalProcessed = totalApproved + totalRejected;
      setTeamMetrics({
        total_processed: totalProcessed,
        total_approved: totalApproved,
        total_rejected: totalRejected,
        total_pending: pendingCount || 0,
        team_approval_rate: totalProcessed > 0 ? (totalApproved / totalProcessed) * 100 : 0,
        today_processed: todayCount,
        week_processed: weekCount,
        active_users: userList.length,
      });
    } catch (error) {
      console.error("Error fetching team activity:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTopPerformer = () => {
    if (userStats.length === 0) return null;
    return userStats.reduce((prev, current) =>
      current.total_count > prev.total_count ? current : prev
    );
  };

  const getMostApprover = () => {
    if (userStats.length === 0) return null;
    return userStats.reduce((prev, current) =>
      current.approved_count > prev.approved_count ? current : prev
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 animate-pulse" />
            Carregando Dashboard...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const topPerformer = getTopPerformer();
  const mostApprover = getMostApprover();

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Dashboard de Atividade do Time
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe a produtividade e performance da equipe
          </p>
        </div>
        <div className="flex gap-2">
          {(["today", "week", "month", "all"] as const).map((range) => (
            <Badge
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setTimeRange(range)}
            >
              {range === "today" && "Hoje"}
              {range === "week" && "Semana"}
              {range === "month" && "Mês"}
              {range === "all" && "Tudo"}
            </Badge>
          ))}
        </div>
      </div>

      {/* Team Metrics Cards */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Processado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teamMetrics.total_processed}</div>
              <p className="text-xs text-gray-500 mt-1">
                {teamMetrics.today_processed} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {teamMetrics.team_approval_rate.toFixed(1)}%
              </div>
              <Progress value={teamMetrics.team_approval_rate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {teamMetrics.total_pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Aguardando revisão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Usuários Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {teamMetrics.active_users}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Membros do time
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              🏆 Leaderboard - Total Processado
            </CardTitle>
            <CardDescription>
              Ranking por quantidade de propriedades revisadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userStats.slice(0, 5).map((user, index) => (
                <div key={user.user_id} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold">
                    {index === 0 && "🥇"}
                    {index === 1 && "🥈"}
                    {index === 2 && "🥉"}
                    {index > 2 && index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{user.user_name}</div>
                    <div className="text-sm text-gray-500">
                      {user.total_count} propriedades
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      ✓ {user.approved_count}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      ✗ {user.rejected_count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Details Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Estatísticas Detalhadas
            </CardTitle>
            <CardDescription>
              Performance individual de cada membro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userStats.map((user) => (
                <div key={user.user_id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{user.user_name}</span>
                    <Badge className={
                      user.approval_rate >= 70 ? "bg-green-500" :
                      user.approval_rate >= 50 ? "bg-yellow-500" :
                      "bg-red-500"
                    }>
                      {user.approval_rate.toFixed(0)}% aprovação
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div>
                      <Clock className="h-3 w-3 inline mr-1" />
                      Hoje: {user.today_count}
                    </div>
                    <div>
                      <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                      {user.approved_count}
                    </div>
                    <div>
                      <XCircle className="h-3 w-3 inline mr-1 text-red-600" />
                      {user.rejected_count}
                    </div>
                  </div>
                  <Progress
                    value={user.approval_rate}
                    className="mt-2 h-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      {topPerformer && mostApprover && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-purple-600" />
              Destaques da {timeRange === "today" ? "Hoje" : timeRange === "week" ? "Semana" : timeRange === "month" ? "Mês" : "Equipe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">🏆 Mais Produtivo</div>
                <div className="text-xl font-bold text-purple-700">{topPerformer.user_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {topPerformer.total_count} propriedades processadas
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">✅ Mais Aprovações</div>
                <div className="text-xl font-bold text-green-700">{mostApprover.user_name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {mostApprover.approved_count} propriedades aprovadas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
