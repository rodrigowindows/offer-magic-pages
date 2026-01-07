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
    console.log('🔧 Test Mode Toggle clicked!');
    console.log('  Current mode:', testMode ? 'TEST' : 'PRODUCTION');
    console.log('  Switching to:', newMode ? 'TEST' : 'PRODUCTION');

    updateSettings({
      defaults: {
        channels: settings.defaults.channels,
        voicemail_style: settings.defaults.voicemail_style,
        test_mode: newMode,
      },
    });

    // Force re-render confirmation
    setTimeout(() => {
      console.log('✅ Mode changed to:', newMode ? '🧪 TEST MODE' : '🚀 PRODUCTION MODE');
    }, 100);
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTestMode}
        className={testMode ? "text-orange-500" : "text-green-500"}
      >
        {testMode ? (
          <TestTube2 className="w-5 h-5" />
        ) : (
          <Rocket className="w-5 h-5" />
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          {testMode ? (
            <TestTube2 className="w-6 h-6 text-orange-500" />
          ) : (
            <Rocket className="w-6 h-6 text-green-500" />
          )}
          <div>
            <p className="font-medium text-lg">
              {testMode ? '🧪 Test Mode' : '🚀 Production Mode'}
            </p>
            <p className="text-sm text-muted-foreground">
              {testMode
                ? 'Communications are SIMULATED'
                : 'Sending to +12405814595 & rodrigowindows@gmail.com'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={toggleTestMode}
          variant={testMode ? "default" : "destructive"}
          size="lg"
          className="font-bold"
        >
          {testMode ? 'Activate PRODUCTION' : 'Back to TEST'}
        </Button>
      </div>

      {testMode && (
        <Alert variant="default" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <TestTube2 className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>🧪 TEST MODE:</strong> No real communications. Click "Activate PRODUCTION" to send real messages.
          </AlertDescription>
        </Alert>
      )}

      {!testMode && (
        <Alert variant="destructive">
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            <strong>🚀 PRODUCTION ACTIVE!</strong> Real SMS, Emails, and Calls will be sent!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default TestModeToggle;
