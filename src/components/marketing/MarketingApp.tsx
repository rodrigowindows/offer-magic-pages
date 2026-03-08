/**
 * Marketing App - Main Entry Point
 * Roteamento e layout principal do sistema de marketing
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMarketing } from '@/hooks/useMarketing';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Components
import { Dashboard } from './Dashboard';
import { WizardLayout } from './WizardLayout';
import { History } from './History';
import { Settings } from './Settings';
import { TestModeToggle } from './TestModeToggle';
import McpTester from './McpTester';
import { CampaignManager } from './CampaignManager';
import { AdvancedWebhookManager } from './AdvancedWebhookManager';
import { AutomatedABTesting } from './AutomatedABTesting';
import { ABTestAnalytics } from '@/components/ab-testing/ABTestAnalytics';
import TemplateManager from './TemplateManager';
import { SimpleCampaignDashboard } from '../campaign/SimpleCampaignDashboard';
import { ClicksAnalytics } from './ClicksAnalytics';
import { LeadsManagerEnhanced } from './LeadsManagerEnhanced';
import { LetterGenerator } from './LetterGenerator';
import { CompsAnalysis } from './CompsAnalysis';

// Layout Components
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Send,
  History as HistoryIcon,
  Settings as SettingsIcon,
  TestTube2,
  Rocket,
  Menu,
  FileText,
  Zap,
  BarChart3,
  Webhook,
  TestTube,
  Brain,
  UserCheck,
  Mail,
  Home,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

export const MarketingApp = () => {
  return <MarketingAppContent />;
};

const MarketingAppContent = () => {
  const location = useLocation();

  useKeyboardShortcuts();

  const { performHealthCheck } = useMarketing();
  useEffect(() => {
    const isCompsPage = location.pathname.includes('/comps');
    if (!isCompsPage) {
      performHealthCheck();
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8 bg-background overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quick" element={<SimpleCampaignDashboard />} />
            <Route path="/campaigns" element={<ErrorBoundary><CampaignManager /></ErrorBoundary>} />
            <Route path="/analytics" element={<ClicksAnalytics />} />
            <Route path="/comps" element={<CompsAnalysis />} />
            <Route path="/leads" element={<LeadsManagerEnhanced />} />
            <Route path="/letters" element={<LetterGenerator />} />
            <Route path="/ab-testing" element={<ABTestAnalytics />} />
            <Route path="/follow-ups" element={<Dashboard />} />
            <Route path="/webhooks" element={<AdvancedWebhookManager />} />
            <Route path="/send" element={<WizardLayout />} />
            <Route path="/templates" element={<TemplateManager />} />
            <Route path="/history" element={<History />} />
            <Route path="/mcp-tester" element={<McpTester />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/marketing" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const NAV_ITEMS = [
  { path: '/marketing', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/marketing/quick', icon: Zap, label: 'Quick Campaigns' },
  { path: '/marketing/campaigns', icon: Rocket, label: 'Campaigns' },
  { path: '/marketing/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/marketing/comps', icon: Home, label: 'Comps Analysis' },
  { path: '/marketing/leads', icon: UserCheck, label: 'Leads' },
  { path: '/marketing/letters', icon: Mail, label: 'Letter Generator' },
  { path: '/marketing/ab-testing', icon: TestTube, label: 'A/B Testing' },
  { path: '/marketing/follow-ups', icon: Brain, label: 'Follow-ups' },
  { path: '/marketing/webhooks', icon: Webhook, label: 'Webhooks' },
  { path: '/marketing/send', icon: Send, label: 'New Communication' },
  { path: '/marketing/templates', icon: FileText, label: 'Templates' },
  { path: '/marketing/history', icon: HistoryIcon, label: 'History' },
  { path: '/marketing/mcp-tester', icon: TestTube2, label: 'MCP Tester' },
  { path: '/marketing/settings', icon: SettingsIcon, label: 'Settings' },
] as const;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`${
          collapsed ? 'w-16' : 'w-60'
        } bg-card border-r transition-all duration-200 flex flex-col min-h-screen sticky top-0 z-50 shadow-sm`}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold truncate">Marketing</h2>
              <p className="text-[10px] text-muted-foreground truncate">Communication System</p>
            </div>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setCollapsed(!collapsed)}>
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        {/* Test Mode Toggle */}
        <div className="px-3 py-2 border-b">
          <TestModeToggle compact={collapsed} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            const button = (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                className={`w-full h-8 ${collapsed ? 'justify-center px-2' : 'justify-start px-3'}`}
                onClick={() => navigate(item.path)}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${collapsed ? '' : 'mr-2'}`} />
                {!collapsed && <span className="truncate text-xs">{item.label}</span>}
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t text-[10px] text-muted-foreground text-center space-y-0.5">
            <div className="font-medium">Shortcuts</div>
            <div>⌘K Search · ⌘N New · ⌘H History</div>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
};

export default MarketingApp;