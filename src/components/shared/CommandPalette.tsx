/**
 * Global Command Palette (⌘K) — Quick navigation and search across the app
 */
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  LayoutDashboard, Shield, Upload, Users, Send, History,
  Settings, TestTube2, Rocket, BarChart3, Home, Mail,
  UserCheck, Webhook, FileText, Target, Zap, ListChecks,
  Search, Phone,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { id: 'home', label: 'Home / Landing Page', icon: Home, action: () => go('/'), keywords: ['landing', 'index'], group: 'Navigation' },
    { id: 'admin', label: 'Admin Dashboard', icon: Shield, action: () => go('/admin'), keywords: ['dashboard', 'properties', 'manage'], group: 'Navigation' },
    { id: 'process', label: 'Investment Process', icon: ListChecks, action: () => go('/process'), keywords: ['workflow', 'steps', 'review'], group: 'Navigation' },
    { id: 'marketing', label: 'Marketing Dashboard', icon: LayoutDashboard, action: () => go('/marketing'), keywords: ['campaigns', 'stats'], group: 'Navigation' },
    { id: 'auth', label: 'Sign In / Sign Up', icon: Users, action: () => go('/auth'), keywords: ['login', 'register'], group: 'Navigation' },

    // Admin actions
    { id: 'import', label: 'Import Properties (CSV)', icon: Upload, action: () => go('/admin/import'), keywords: ['csv', 'bulk', 'upload'], group: 'Admin' },
    { id: 'skip-trace', label: 'Skip Trace Data', icon: Phone, action: () => go('/skip-trace'), keywords: ['contacts', 'phone', 'lookup'], group: 'Admin' },
    { id: 'features', label: 'Features Guide', icon: FileText, action: () => go('/features'), keywords: ['help', 'docs'], group: 'Admin' },

    // Marketing
    { id: 'quick-campaigns', label: 'Quick Campaigns', icon: Zap, action: () => go('/marketing/quick'), keywords: ['fast', 'simple'], group: 'Marketing' },
    { id: 'campaigns', label: 'Campaign Manager', icon: Rocket, action: () => go('/marketing/campaigns'), keywords: ['send', 'sms', 'email'], group: 'Marketing' },
    { id: 'analytics', label: 'Click Analytics', icon: BarChart3, action: () => go('/marketing/analytics'), keywords: ['clicks', 'stats', 'reports'], group: 'Marketing' },
    { id: 'comps', label: 'Comps Analysis', icon: Home, action: () => go('/marketing/comps'), keywords: ['comparable', 'valuation', 'arv'], group: 'Marketing' },
    { id: 'leads', label: 'Leads Manager', icon: UserCheck, action: () => go('/marketing/leads'), keywords: ['contacts', 'prospects'], group: 'Marketing' },
    { id: 'letters', label: 'Letter Generator', icon: Mail, action: () => go('/marketing/letters'), keywords: ['mail', 'print', 'postcard'], group: 'Marketing' },
    { id: 'ab-testing', label: 'A/B Testing', icon: Target, action: () => go('/marketing/ab-testing'), keywords: ['variants', 'experiment'], group: 'Marketing' },
    { id: 'templates', label: 'Templates', icon: FileText, action: () => go('/marketing/templates'), keywords: ['message', 'template'], group: 'Marketing' },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, action: () => go('/marketing/webhooks'), keywords: ['api', 'integration'], group: 'Marketing' },
    { id: 'send', label: 'New Communication', icon: Send, action: () => go('/marketing/send'), keywords: ['wizard', 'new'], group: 'Marketing' },
    { id: 'history', label: 'Communication History', icon: History, action: () => go('/marketing/history'), keywords: ['past', 'log'], group: 'Marketing' },
    { id: 'settings', label: 'Marketing Settings', icon: Settings, action: () => go('/marketing/settings'), keywords: ['config'], group: 'Marketing' },
    { id: 'mcp', label: 'MCP Tester', icon: TestTube2, action: () => go('/marketing/mcp-tester'), keywords: ['debug', 'test'], group: 'Marketing' },
  ], [go]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    commands.forEach(cmd => {
      const group = map.get(cmd.group) || [];
      group.push(cmd);
      map.set(cmd.group, group);
    });
    return map;
  }, [commands]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Array.from(groups.entries()).map(([groupName, items], idx) => (
          <div key={groupName}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={groupName}>
              {items.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.label} ${cmd.keywords?.join(' ') || ''}`}
                    onSelect={cmd.action}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{cmd.label}</span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
