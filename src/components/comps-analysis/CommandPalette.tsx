import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Download, Settings, History, Home } from 'lucide-react';
import type { Property } from './types';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: Property[];
  selectedProperty: Property | null;
  analysis: any;
  onSave: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onSelectProperty: (property: Property) => void;
}

export const CommandPalette = ({
  open,
  onOpenChange,
  properties,
  selectedProperty,
  analysis,
  onSave,
  onExport,
  onOpenSettings,
  onOpenHistory,
  onSelectProperty
}: CommandPaletteProps) => {
  const handleAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0">
        <div className="p-4 border-b">
          <Input
            placeholder="🔍 Search properties, actions... (Cmd+K)"
            className="border-0 focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          <div className="space-y-1">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Quick Actions</p>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onSave)}
              disabled={!selectedProperty || !analysis}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Analysis
              <kbd className="ml-auto px-2 py-0.5 text-xs border rounded">Ctrl+S</kbd>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onExport)}
              disabled={!selectedProperty}
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
              <kbd className="ml-auto px-2 py-0.5 text-xs border rounded">Ctrl+E</kbd>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onOpenSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              API Settings
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleAction(onOpenHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </div>
          {properties.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">Recent Properties</p>
              {properties.slice(0, 5).map(property => (
                <Button
                  key={property.id}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    onSelectProperty(property);
                    onOpenChange(false);
                  }}
                >
                  <Home className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{property.address}, {property.city}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
