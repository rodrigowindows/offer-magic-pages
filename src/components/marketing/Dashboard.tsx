/**
 * Dashboard de Marketing
 * Estatísticas e visão geral das comunicações
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMarketingStore } from '@/store/marketingStore';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  History,
  MessageSquare,
  Mail,
  Phone,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  TestTube2,
} from 'lucide-react';
import { useMemo } from 'react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const history = useMarketingStore((state) => state.history);
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);

  // Estatísticas computadas
  const stats = useMemo(() => {
    const total = history.length;
    const successful = history.filter((h) => h.status === 'sent').length;
    const failed = history.filter((h) => h.status === 'failed').length;
    const testCommunications = history.filter((h) => h.test_mode).length;
    const prodCommunications = history.filter((h) => !h.test_mode).length;

    // Por canal
    const smsCount = history.filter((h) => h.channels.includes('sms')).length;
    const emailCount = history.filter((h) => h.channels.includes('email')).length;
    const callCount = history.filter((h) => h.channels.includes('call')).length;

    // Últimos 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const last7Days = history.filter(
      (h) => new Date(h.timestamp) >= sevenDaysAgo
    ).length;

    return {
      total,
      successful,
      failed,
      testCommunications,
      prodCommunications,
      smsCount,
      emailCount,
      callCount,
      last7Days,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(1) : '0',
    };
  }, [history]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your marketing communications
        </p>
      </div>

      {/* Test Mode Indicator */}
      {testMode && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TestTube2 className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-900">
                Test Mode is currently active - new communications will be simulated
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          size="lg"
          onClick={() => navigate('/send')}
          className="h-auto py-6"
        >
          <Send className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">New Communication</div>
            <div className="text-xs opacity-80">Send SMS, Email, or Call</div>
          </div>
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => navigate('/history')}
          className="h-auto py-6"
        >
          <History className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">View History</div>
            <div className="text-xs opacity-80">See past communications</div>
          </div>
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Communications */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Communications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.total}</div>
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.last7Days} in last 7 days
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.successRate}%</div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.successful} successful, {stats.failed} failed
            </p>
          </CardContent>
        </Card>

        {/* Test vs Prod */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Test / Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {stats.testCommunications} / {stats.prodCommunications}
              </div>
              <TestTube2 className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Test mode simulations vs real sends
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{stats.last7Days}</div>
              <History className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channels Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Channels Overview</CardTitle>
          <CardDescription>
            Distribution of communications by channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* SMS */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.smsCount}</div>
                <div className="text-sm text-muted-foreground">SMS Sent</div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-purple-100 rounded-full">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.emailCount}</div>
                <div className="text-sm text-muted-foreground">Emails Sent</div>
              </div>
            </div>

            {/* Calls */}
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="p-3 bg-green-100 rounded-full">
                <Phone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.callCount}</div>
                <div className="text-sm text-muted-foreground">Calls Made</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Communications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
          <CardDescription>
            Last 5 communications sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No communications yet. Click "New Communication" to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {item.status === 'sent' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {item.recipient.name}
                        {item.test_mode && (
                          <span className="ml-2 text-xs text-orange-600">🧪 Test</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.channels.join(', ')} • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.status === 'sent' ? 'Success' : 'Failed'}
                  </div>
                </div>
              ))}
              {history.length > 5 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/history')}
                >
                  View All History
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
