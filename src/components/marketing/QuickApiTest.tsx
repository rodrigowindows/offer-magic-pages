/**
 * Quick API Test Button
 * Simple one-click test for API connectivity
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Globe
} from 'lucide-react';
import { checkHealth, sendCommunication } from '@/services/marketingService';
import { useMarketingStore } from '@/store/marketingStore';

export const QuickApiTest = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    status: 'idle' | 'success' | 'error' | 'cors';
    message?: string;
    details?: any;
    timestamp?: Date;
  }>({ status: 'idle' });

  const apiUrl = useMarketingStore((state) => state.settings.api.marketing_url);

  const runQuickTest = async () => {
    setTesting(true);
    setResult({ status: 'idle' });

    try {
      console.log('🧪 Starting Quick API Test...');
      console.log('📡 API URL:', apiUrl);

      // Test 1: Health Check
      console.log('🏥 Testing /health endpoint...');
      const healthResponse = await checkHealth();
      console.log('✅ Health check passed:', healthResponse);

      // Test 2: Simple communication test
      console.log('📨 Testing /start endpoint...');
      const testPayload = {
        name: "Test User",
        phone: "+1 (407) 555-0123",
        email: "test@example.com",
        address: "123 Test St, Orlando, FL",
        channels: ["sms"] as ("sms" | "email" | "call")[],
        test_mode: true,
        company_name: "Test Company",
        contact_phone: "+1 (407) 555-9999",
        contact_phone_alt: "+1 (407) 555-8888",
        city: "Orlando",
      };

      const response = await sendCommunication(testPayload);
      console.log('✅ Communication test passed:', response);

      setResult({
        status: 'success',
        message: 'API está funcionando perfeitamente! ✅',
        details: {
          health: healthResponse,
          communication: response,
        },
        timestamp: new Date(),
      });

    } catch (error: any) {
      console.error('❌ API Test failed:', error);

      // Detect CORS error
      if (error.message?.includes('Network Error') ||
          error.code === 'ERR_NETWORK' ||
          error.message?.includes('CORS')) {
        setResult({
          status: 'cors',
          message: 'Erro de CORS - Backend não configurado',
          details: {
            error: error.message,
            apiUrl,
            solution: 'O servidor precisa adicionar headers CORS',
          },
          timestamp: new Date(),
        });
      } else {
        setResult({
          status: 'error',
          message: error.message || 'Erro desconhecido',
          details: error,
          timestamp: new Date(),
        });
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600" />
          Quick API Test
        </CardTitle>
        <CardDescription>
          Test connection to marketing API with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API URL Display */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <code className="bg-muted px-2 py-1 rounded text-xs">
            {apiUrl}
          </code>
        </div>

        {/* Test Button */}
        <Button
          onClick={runQuickTest}
          disabled={testing}
          className="w-full"
          size="lg"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing API...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Run Quick Test
            </>
          )}
        </Button>

        {/* Results */}
        {result.status !== 'idle' && (
          <Alert
            variant={result.status === 'success' ? 'default' : 'destructive'}
            className={result.status === 'success' ? 'border-green-500 bg-green-50' : ''}
          >
            <div className="flex items-start gap-2">
              {result.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />}
              {result.status === 'error' && <XCircle className="w-5 h-5 mt-0.5" />}
              {result.status === 'cors' && <AlertTriangle className="w-5 h-5 mt-0.5" />}

              <div className="flex-1 space-y-2">
                <AlertDescription className="font-semibold">
                  {result.message}
                </AlertDescription>

                {result.timestamp && (
                  <p className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </p>
                )}

                {/* CORS Specific Help */}
                {result.status === 'cors' && (
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="font-semibold">🔧 Como resolver:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Acesse o código do backend</li>
                      <li>Adicione headers CORS para: <code className="bg-muted px-1">offer.mylocalinvest.com</code></li>
                      <li>Exemplo (Flask):
                        <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
{`from flask_cors import CORS
CORS(app, origins=["https://offer.mylocalinvest.com"])`}
                        </pre>
                      </li>
                      <li>OU use proxy local para desenvolvimento (veja documentação)</li>
                    </ol>
                  </div>
                )}

                {/* Success Details */}
                {result.status === 'success' && result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer hover:underline">
                      Ver detalhes técnicos
                    </summary>
                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}

                {/* Error Details */}
                {result.status === 'error' && result.details && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer hover:underline">
                      Ver erro completo
                    </summary>
                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          {result.status === 'idle' && (
            <Badge variant="outline">
              Aguardando teste
            </Badge>
          )}
          {result.status === 'success' && (
            <Badge variant="default" className="bg-green-600">
              ✅ API OK
            </Badge>
          )}
          {result.status === 'cors' && (
            <Badge variant="destructive">
              🚫 CORS Error
            </Badge>
          )}
          {result.status === 'error' && (
            <Badge variant="destructive">
              ❌ Error
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};