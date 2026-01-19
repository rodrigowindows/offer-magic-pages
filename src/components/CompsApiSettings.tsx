import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Database,
  Home
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ApiKeyStatus {
  attom: boolean;
  rapidapi: boolean;
}

export const CompsApiSettings = () => {
  const { toast } = useToast();
  const [attomKey, setAttomKey] = useState('');
  const [rapidApiKey, setRapidApiKey] = useState('');
  const [showAttomKey, setShowAttomKey] = useState(false);
  const [showRapidKey, setShowRapidKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<ApiKeyStatus>({ attom: false, rapidapi: false });
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [searchRadius, setSearchRadius] = useState(1);

  // Check current status on mount and load saved radius
  useEffect(() => {
    checkApiStatus();

    // Load saved search radius from localStorage
    const savedRadius = localStorage.getItem('comps_search_radius');
    if (savedRadius) {
      setSearchRadius(parseFloat(savedRadius));
    }
  }, []);

  const checkApiStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: '1025 S WASHINGTON AVE',
          city: 'Orlando',
          state: 'FL',
          basePrice: 250000
        }
      });

      if (!error && data?.apiKeysConfigured) {
        setStatus(data.apiKeysConfigured);
        setLastTestResult(data);
      }
    } catch (error) {
      console.error('Error checking API status:', error);
    }
  };

  const handleSaveKeys = async () => {
    setSaving(true);

    try {
      // Save keys to Supabase secrets via edge function
      const { error } = await supabase.functions.invoke('update-comps-keys', {
        body: {
          ATTOM_API_KEY: attomKey || null,
          RAPIDAPI_KEY: rapidApiKey || null
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: '✅ API Keys Saved',
        description: 'Your API keys have been securely stored. Testing connection...',
      });

      // Test the keys
      await handleTestKeys();
    } catch (error: any) {
      console.error('Error saving keys:', error);
      toast({
        title: '❌ Error',
        description: error.message || 'Failed to save API keys',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestKeys = async () => {
    setTesting(true);

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: '1025 S WASHINGTON AVE',
          city: 'Orlando',
          state: 'FL',
          basePrice: 250000
        }
      });

      if (error) {
        throw error;
      }

      setLastTestResult(data);
      setStatus(data.apiKeysConfigured || { attom: false, rapidapi: false });

      const sourceLabel = {
        'attom': '🏆 Attom Data (MLS)',
        'zillow-api': '🏠 Zillow API',
        'county-csv': '🍊 Orange County CSV',
        'demo': '🎭 Demo Data'
      }[data.source] || data.source;

      toast({
        title: '✅ Test Successful',
        description: `Found ${data.count} comps from: ${sourceLabel}`,
      });
    } catch (error: any) {
      console.error('Error testing keys:', error);
      toast({
        title: '❌ Test Failed',
        description: error.message || 'Failed to test API connection',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'attom': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'zillow-api': return <Home className="w-4 h-4 text-blue-500" />;
      case 'county-csv': return <Database className="w-4 h-4 text-orange-500" />;
      default: return <Database className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleRadiusChange = (value: number) => {
    setSearchRadius(value);
    localStorage.setItem('comps_search_radius', value.toString());
    toast({
      title: '✅ Raio atualizado',
      description: `Raio de busca definido para ${value} milha(s)`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Comps Data API Configuration
          </CardTitle>
          <CardDescription>
            Configure API keys to fetch real comparable sales data. All keys are free tier!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <Alert className={lastTestResult?.source === 'demo' ? 'border-orange-500' : 'border-green-500'}>
            <div className="flex items-center gap-2">
              {getSourceIcon(lastTestResult?.source)}
              <AlertTitle>
                Current Data Source: {
                  {
                    'attom': '🏆 Attom Data (MLS - Best Quality)',
                    'zillow-api': '🏠 Zillow API (Good Quality)',
                    'county-csv': '🍊 Orange County CSV (Free & Unlimited)',
                    'demo': '🎭 Demo Data (Configure APIs for real data)'
                  }[lastTestResult?.source] || 'Not tested yet'
                }
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {lastTestResult && (
                <div className="space-y-1 text-sm">
                  <div>✅ API Keys: Attom: {status.attom ? '✓' : '✗'} | RapidAPI: {status.rapidapi ? '✓' : '✗'}</div>
                  <div>📊 Last test: {lastTestResult.count} comparables found</div>
                </div>
              )}
            </AlertDescription>
          </Alert>

          {/* Attom Data API */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Attom Data API
                  {status.attom && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {!status.attom && <XCircle className="w-4 h-4 text-gray-400" />}
                </Label>
                <p className="text-sm text-muted-foreground">
                  🏆 Best quality - MLS data | 1000 free requests/month
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://api.developer.attomdata.com/', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Get Key (Free)
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showAttomKey ? 'text' : 'password'}
                placeholder="Enter your Attom API key..."
                value={attomKey}
                onChange={(e) => setAttomKey(e.target.value)}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowAttomKey(!showAttomKey)}
              >
                {showAttomKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* RapidAPI Zillow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-500" />
                  Zillow via RapidAPI
                  {status.rapidapi && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {!status.rapidapi && <XCircle className="w-4 h-4 text-gray-400" />}
                </Label>
                <p className="text-sm text-muted-foreground">
                  🏠 Good quality - Zillow data | 100 free requests/month
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://rapidapi.com/apimaker/api/zillow-com1', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Get Key (Free)
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showRapidKey ? 'text' : 'password'}
                placeholder="Enter your RapidAPI key..."
                value={rapidApiKey}
                onChange={(e) => setRapidApiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowRapidKey(!showRapidKey)}
              >
                {showRapidKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Orange County Info */}
          <Alert>
            <Database className="w-4 h-4" />
            <AlertTitle>🍊 Orange County CSV (Always Available)</AlertTitle>
            <AlertDescription>
              100% free and unlimited! Public records for Orlando/FL. No API key needed.
              Automatically used as fallback for Florida properties.
            </AlertDescription>
          </Alert>

          {/* Search Radius Configuration */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-base font-semibold">📍 Raio de Busca</Label>
            <p className="text-sm text-muted-foreground">
              Define a distância máxima para buscar comparáveis próximos
            </p>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={searchRadius}
                onChange={(e) => handleRadiusChange(parseFloat(e.target.value) || 1)}
                className="w-32"
              />
              <span className="text-sm font-medium">{searchRadius === 1 ? 'milha' : 'milhas'}</span>
              <span className="text-xs text-muted-foreground">
                ({(searchRadius * 1.609).toFixed(1)} km)
              </span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                ℹ️ Como funciona a busca?
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✅ Busca no raio de <strong>{searchRadius} milha(s)</strong> do endereço</li>
                <li>✅ Mesmo bairro/área quando possível</li>
                <li>✅ Tipo similar (Single Family, Condo, etc)</li>
                <li>✅ Tamanho similar (±30% sqft)</li>
                <li>✅ Vendas recentes (últimos 6 meses prioritariamente)</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSaveKeys}
              disabled={!attomKey && !rapidApiKey}
              variant="secondary"
              className="flex-1"
            >
              📋 Copy Setup Instructions
            </Button>
            <Button
              variant="outline"
              onClick={handleTestKeys}
              disabled={testing}
            >
              {testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>

          {/* Help Text */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-semibold">💡 How to setup:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Enter your API keys above (get free keys using the "Get Key" buttons)</li>
              <li>Click "Copy Setup Instructions" to get the commands</li>
              <li>Go to Supabase Dashboard → Edge Functions → Manage secrets</li>
              <li>Add the secrets or run the CLI commands</li>
              <li>Click "Test Connection" to verify everything works!</li>
            </ol>
            <p className="text-muted-foreground mt-2">
              💡 <strong>No keys?</strong> Orange County CSV (FL) and Demo data work immediately without setup!
            </p>
          </div>

          {/* Cost Info */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600">$0</div>
              <div className="text-xs text-muted-foreground">Monthly Cost</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600">1100</div>
              <div className="text-xs text-muted-foreground">Free Requests/mo</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-xs text-muted-foreground">Orange County CSV</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
