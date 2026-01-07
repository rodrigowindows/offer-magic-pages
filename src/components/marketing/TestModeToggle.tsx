import { useMarketingStore } from '@/store/marketingStore';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube2, Rocket } from 'lucide-react';

interface TestModeToggleProps {
  compact?: boolean;
}

export function TestModeToggle({ compact = false }: TestModeToggleProps) {
  const testMode = useMarketingStore((state) => state.settings.defaults.test_mode);
  const updateSettings = useMarketingStore((state) => state.updateSettings);

  const settings = useMarketingStore((state) => state.settings);
  
  const toggleTestMode = (enabled: boolean) => {
    console.log('🔧 Test Mode Toggle:', enabled ? 'ATIVANDO' : 'DESATIVANDO');
    console.log('  Modo anterior:', testMode);
    console.log('  Modo novo:', enabled);

    updateSettings({
      defaults: {
        channels: settings.defaults.channels,
        voicemail_style: settings.defaults.voicemail_style,
        test_mode: enabled,
      },
    });

    // Log confirmação
    setTimeout(() => {
      console.log('✅ Test Mode atualizado com sucesso!');
      console.log('  Estado atual:', enabled ? '🧪 TEST MODE (Safe)' : '🚀 PRODUCTION MODE (Live)');
      if (!enabled) {
        console.warn('⚠️ ATENÇÃO: PRODUCTION MODE ATIVO - Comunicações serão enviadas REALMENTE!');
      } else {
        console.info('✅ SAFE MODE: Comunicações serão apenas simuladas');
      }
    }, 100);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-center p-2 rounded-lg border bg-card">
        {testMode ? (
          <TestTube2 className="w-5 h-5 text-orange-500" />
        ) : (
          <Rocket className="w-5 h-5 text-green-500" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          {testMode ? (
            <TestTube2 className="w-5 h-5 text-orange-500" />
          ) : (
            <Rocket className="w-5 h-5 text-green-500" />
          )}
          <div>
            <p className="font-medium">
              {testMode ? 'Test Mode (Safe)' : 'Production Mode (Live)'}
            </p>
            <p className="text-sm text-muted-foreground">
              {testMode
                ? 'Click switch to enable REAL sending'
                : 'Communications will be sent LIVE'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {testMode ? 'Test' : 'Live'}
          </span>
          <Switch 
            checked={!testMode} 
            onCheckedChange={(checked) => toggleTestMode(!checked)} 
          />
        </div>
      </div>

      {testMode && (
        <Alert variant="default" className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <TestTube2 className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>🧪 TEST MODE:</strong> Communications are simulated. Turn ON the switch above to send REAL messages.
          </AlertDescription>
        </Alert>
      )}

      {!testMode && (
        <Alert variant="destructive" className="border-red-500/50">
          <Rocket className="h-4 w-4" />
          <AlertDescription>
            <strong>🚀 PRODUCTION:</strong> Real SMS, Emails, and Calls will be sent to {' '}
            <span className="font-mono">+12405814595</span> and{' '}
            <span className="font-mono">rodrigowindows@gmail.com</span>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default TestModeToggle;
