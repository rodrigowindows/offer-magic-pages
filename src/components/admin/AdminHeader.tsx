import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { FullDatabaseExport } from '@/components/shared/FullDatabaseExport';
import { ApprovedPropertiesExport } from '@/components/shared/ApprovedPropertiesExport';
import { DesignModeToggle } from '@/components/ab-testing/DesignModeToggle';
import { HeaderActionsMenu } from '@/components/shared/HeaderActionsMenu';
import { NotificationsPanel } from '@/components/shared/NotificationsPanel';

interface AdminHeaderProps {
  title: string;
  totalCount: number;
  isMinimal: boolean;
  onToggleDesignMode: () => void;
  onLogout: () => void;
  onBulkImport: () => void;
  onGeminiSettings?: () => void;
  exportFilters: {
    userId?: string;
    tags: string[];
    searchQuery: string;
    batch?: string;
  };
}

export const AdminHeader = ({
  title,
  totalCount,
  isMinimal,
  onToggleDesignMode,
  onLogout,
  onBulkImport,
  onGeminiSettings,
  onMarketingSettings,
  exportFilters,
}: AdminHeaderProps) => (
  <header className="border-b bg-white shadow-sm">
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 tracking-tight truncate">{title}</h1>
          <Badge variant="secondary" className="text-xs font-medium">{totalCount} total</Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <FullDatabaseExport />
          <ApprovedPropertiesExport filters={exportFilters} />
          <DesignModeToggle isMinimal={isMinimal} onToggle={onToggleDesignMode} />
          <HeaderActionsMenu onBulkImport={onBulkImport} onGeminiSettings={onGeminiSettings} onMarketingSettings={onMarketingSettings} />
          <NotificationsPanel />
          <Button onClick={onLogout} variant="outline" size="sm" className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  </header>
);
