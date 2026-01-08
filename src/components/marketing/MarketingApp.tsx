/**
 * Marketing App - Main Entry Point
 * Roteamento e layout principal do sistema de marketing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMarketing } from '@/hooks/useMarketing';
import { useEffect } from 'react';

// Components
import { Dashboard } from './Dashboard';
import { WizardLayout } from './WizardLayout';
import { History } from './History';
import { Settings } from './Settings';
import { TestModeToggle } from './TestModeToggle';
import McpTester from './McpTester';
import CampaignManager from './CampaignManager';
import TemplateManager from './TemplateManager';
import { SimpleCampaignDashboard } from '../SimpleCampaignDashboard';

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
} from 'lucide-react';
import { useState } from 'react';

/**
 * OPÇÃO B: App Integrado (recomendado - este projeto já tem BrowserRouter)
 * Use esta versão pois estamos integrando em um app React existente
 */
export const MarketingApp = () => {
  return <MarketingAppContent />;
};

/**
 * OPÇÃO A: App Standalone (com BrowserRouter próprio)
 * Use esta versão somente se o Marketing System for um app independente
 *
 * export const MarketingApp = () => {
 *   return (
 *     <BrowserRouter>
 *       <MarketingAppContent />
 *     </BrowserRouter>
 *   );
 * };
 */

const MarketingAppContent = () => {
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Health check on mount
  const { performHealthCheck } = useMarketing();
  useEffect(() => {
    performHealthCheck();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />

      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 bg-background overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quick" element={<SimpleCampaignDashboard />} />
            <Route path="/campaigns" element={<CampaignManager />} />
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

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/marketing', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/marketing/quick', icon: Zap, label: 'Quick Campaigns' },
    { path: '/marketing/campaigns', icon: Rocket, label: 'Campaigns' },
    { path: '/marketing/send', icon: Send, label: 'New Communication' },
    { path: '/marketing/templates', icon: FileText, label: 'Templates' },
    { path: '/marketing/history', icon: HistoryIcon, label: 'History' },
    { path: '/marketing/mcp-tester', icon: TestTube2, label: 'MCP Tester' },
    { path: '/marketing/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-card border-r transition-all duration-200 flex flex-col min-h-screen sticky top-0 z-50 shadow-md`}
    >
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between">
        {!collapsed && (
          <div>
            <h2 className="text-lg font-bold">Marketing</h2>
            <p className="text-xs text-muted-foreground">Communication System</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Test Mode Toggle */}
      <div className="p-4 border-b">
        <TestModeToggle compact={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Button
              key={item.path}
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full ${collapsed ? 'justify-center' : 'justify-start'}`}
              onClick={() => navigate(item.path)}
            >
              <Icon className={`w-4 h-4 ${collapsed ? '' : 'mr-2'}`} />
              {!collapsed && item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-muted-foreground text-center">
        {!collapsed && (
          <>
            <div className="mb-2">Keyboard Shortcuts</div>
            <div className="space-y-1">
              <div>Cmd/Ctrl + K: Search</div>
              <div>Cmd/Ctrl + N: New</div>
              <div>Cmd/Ctrl + H: History</div>
              <div>Cmd/Ctrl + /: Help</div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default MarketingApp;
