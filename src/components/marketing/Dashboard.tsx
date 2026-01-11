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
  Settings,
  Rocket,
} from 'lucide-react';
import { useMemo, useEffect } from 'react';
import { TestModeToggle } from './TestModeToggle';
import { QuickApiTest } from './QuickApiTest';
import { CreateTestProperty } from './CreateTestProperty';
import { ClickTrackingDashboard } from '../ClickTrackingDashboard';
import { LeadScoringDashboard } from '../LeadScoringDashboard';
import { AutomatedSequences } from '../AutomatedSequences';
import SmartScheduling from '../SmartScheduling';
import { RealTimeNotifications } from '../RealTimeNotifications';
import { ROIAnalytics } from '../ROIAnalytics';
import { ExternalToolsIntegration } from '../ExternalToolsIntegration';
import { CampaignPerformanceDashboard } from './CampaignPerformanceDashboard';
import { RealTimeClickNotifications } from '../RealTimeClickNotifications';

export const Dashboard = () => {
  const navigate = useNavigate();
  const history = useMarketingStore((state) => state.history);
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const settings = useMarketingStore((state) => state.settings);

  // Console de debug - mostra estado atual
  useEffect(() => {
  }, [history, testMode, settings]);

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
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your marketing communications
        </p>
      </div>

      {/* Test Mode Toggle - Destaque */}
      <Card className={testMode ? 'border-orange-500 bg-orange-50/50' : 'border-green-500 bg-green-50/50'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {testMode ? (
                  <TestTube2 className="w-5 h-5 text-orange-600" />
                ) : (
                  <Send className="w-5 h-5 text-green-600" />
                )}
                Test Mode Configuration
              </CardTitle>
              <CardDescription>
                {testMode
                  ? 'Communications are currently simulated (safe for testing)'
                  : 'Communications will be sent LIVE to real recipients'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/marketing/settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TestModeToggle />
        </CardContent>
      </Card>

      {/* Quick API Test - Prominent */}
      <QuickApiTest />

      {/* Create Test Property - For Testing */}
      <CreateTestProperty />

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

      {/* Real-time Click Notifications */}
      <RealTimeClickNotifications />



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

      {/* Click Tracking Analytics */}
      <ClickTrackingDashboard />

      {/* Lead Scoring & Analytics */}
      <LeadScoringDashboard />

      {/* Automated Sequences */}
      <AutomatedSequences />

      {/* Smart Scheduling */}
      <SmartScheduling />

      {/* Real-time Notifications */}
      <RealTimeNotifications />

      {/* ROI Analytics & Reports */}
      <ROIAnalytics />

      {/* External Tools Integration */}
      <ExternalToolsIntegration />

      {/* Console de Debug - Estado do Sistema */}
      <Card className="border-blue-500/50 bg-slate-50 dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <span className="text-blue-600">{'>'}</span> Sistema Console
          </CardTitle>
          <CardDescription>
            Estado em tempo real do Marketing System (abra DevTools Console para mais detalhes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="text-muted-foreground">Test Mode:</span>
              <span className={testMode ? 'text-orange-600 font-bold' : 'text-green-600 font-bold'}>
                {testMode ? '🧪 ATIVO (Safe)' : '🚀 DESATIVADO (Live)'}
              </span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="text-muted-foreground">Total Communications:</span>
              <span className="font-bold">{stats.total}</span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="text-muted-foreground">Test/Production Split:</span>
              <span className="font-bold">
                {stats.testCommunications} test / {stats.prodCommunications} prod
              </span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="text-green-600 font-bold">{stats.successRate}%</span>
            </div>
            <div className="flex justify-between p-2 bg-white dark:bg-slate-800 rounded border">
              <span className="text-muted-foreground">API Endpoint:</span>
              <span className="text-xs text-blue-600 truncate">{settings.api.marketing_url}</span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200 text-xs">
                💡 <strong>Dica:</strong> Abra o Console do navegador (F12) para ver logs detalhados em tempo real
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

