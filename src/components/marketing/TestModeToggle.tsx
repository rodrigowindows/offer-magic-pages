import { useMarketingStore } from '@/store/marketingStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube2, Rocket } from 'lucide-react';

interface TestModeToggleProps {
  compact?: boolean;
}

export function TestModeToggle({ compact = false }: TestModeToggleProps) {
  const settings = useMarketingStore((state) => state.settings);
  const testMode = settings?.defaults?.test_mode ?? true;
  const updateSettings = useMarketingStore((state) => state.updateSettings);

  const toggleTestMode = () => {
    const newMode = !testMode;

    updateSettings({
      defaults: {
        channels: settings.defaults.channels,
        voicemail_style: settings.defaults.voicemail_style,
        test_mode: newMode,
      },
    });

    // Force re-render confirmation
    setTimeout(() => {
    }, 100);
  };

  // Sidebar compact version - shows clickable button
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTestMode}
        className={testMode ? "text-orange-500 hover:text-orange-600" : "text-green-500 hover:text-green-600"}
        title={testMode ? "Test Mode - Click for Production" : "Production Mode - Click for Test"}
      >
        {testMode ? (
          <TestTube2 className="w-5 h-5" />
        ) : (
          <Rocket className="w-5 h-5" />
        )}
      </Button>
    );
  }

  // Sidebar expanded version - shows card with button
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          {testMode ? (
            <TestTube2 className="w-5 h-5 text-orange-500 flex-shrink-0" />
          ) : (
            <Rocket className="w-5 h-5 text-green-500 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-medium text-sm">
              {testMode ? 'Test Mode' : 'Production'}
            </p>
            <p className="text-xs text-muted-foreground">
              {testMode ? '(Safe)' : '(Live)'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={toggleTestMode}
          variant={testMode ? "default" : "destructive"}
          size="sm"
          className="w-full font-semibold"
        >
          {testMode ? '🚀 Go LIVE' : '🧪 Back to TEST'}
        </Button>
      </div>

      {testMode && (
        <Alert variant="default" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 p-2">
          <div className="flex items-start gap-2">
            <TestTube2 className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
              <strong>🧪 TEST MODE:</strong> Communications are simulated. Turn ON the switch above to send REAL messages.
            </p>
          </div>
        </Alert>
      )}

      {!testMode && (
        <Alert variant="destructive" className="p-2">
          <div className="flex items-start gap-2">
            <Rocket className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-xs">
              <strong>🚀 LIVE:</strong> Real SMS/Email/Calls will be sent!
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
}

export default TestModeToggle;

