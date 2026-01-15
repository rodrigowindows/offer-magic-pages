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
  CheckCircle2,
  XCircle,
  Settings,
  Rocket,
} from 'lucide-react';
import { useMemo } from 'react';
import { LeadScoringDashboard } from '../LeadScoringDashboard';
import { AutomatedSequences } from '../AutomatedSequences';
import { CampaignPerformanceDashboard } from './CampaignPerformanceDashboard';

export const Dashboard = () => {
  const navigate = useNavigate();
  const history = useMarketingStore((state) => state.history);

  // Estatísticas computadas
  const stats = useMemo(() => {
    const total = history.length;
    const successful = history.filter((h) => h.status === 'sent').length;
    const failed = history.filter((h) => h.status === 'failed').length;
    const testCommunications = history.filter((h) => h.test_mode).length;
    const prodCommunications = history.filter((h) => !h.test_mode).length;

    // Por canal - safely check if channels is an array
    const smsCount = history.filter((h) => Array.isArray(h.channels) && h.channels.includes('sms')).length;
    const emailCount = history.filter((h) => Array.isArray(h.channels) && h.channels.includes('email')).length;
    const callCount = history.filter((h) => Array.isArray(h.channels) && h.channels.includes('call')).length;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Follow-ups & Analytics</h1>
          <p className="text-muted-foreground">
            Track campaign performance and manage automated follow-ups
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/marketing/settings')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          onClick={() => navigate('/marketing/campaigns')}
          className="h-auto py-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Rocket className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">Create Campaign</div>
            <div className="text-xs opacity-80">Bulk send to properties</div>
          </div>
        </Button>
        <Button
          size="lg"
          onClick={() => navigate('/marketing/send')}
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
          onClick={() => navigate('/marketing/history')}
          className="h-auto py-6"
        >
          <History className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-bold">View History</div>
            <div className="text-xs opacity-80">See past communications</div>
          </div>
        </Button>
      </div>

      {/* Campaign Performance Dashboard - Main Analytics */}
      <CampaignPerformanceDashboard />

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

      {/* Lead Scoring & Analytics */}
      <LeadScoringDashboard />

      {/* Automated Sequences */}
      <AutomatedSequences />
    </div>
  );
};

export default Dashboard;

