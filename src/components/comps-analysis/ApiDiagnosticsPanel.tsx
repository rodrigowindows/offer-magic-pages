/**
 * API Diagnostics Panel
 * Allows testing individual APIs (Attom, Zillow, County CSV) separately
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Activity,
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Property } from './types';

interface ApiTestResult {
  status: 'idle' | 'testing' | 'success' | 'error';
  result?: {
    count: number;
    source: string;
    responseTime?: number;
    firstComp?: any;
  };
  error?: string;
  details?: any;
}

interface ApiDiagnosticsPanelProps {
  property: Property;
  compsFilters?: { maxDistance?: number };
}

export const ApiDiagnosticsPanel: React.FC<ApiDiagnosticsPanelProps> = ({
  property,
  compsFilters = { maxDistance: 3 },
}) => {
  const { toast } = useToast();
  const [results, setResults] = useState<{
    attom: ApiTestResult;
    zillow: ApiTestResult;
    county: ApiTestResult;
  }>({
    attom: { status: 'idle' },
    zillow: { status: 'idle' },
    county: { status: 'idle' },
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const testAPI = async (source: 'attom-v2' | 'zillow' | 'county-csv') => {
    const startTime = Date.now();
    
    setResults(prev => ({
      ...prev,
      [source]: { status: 'testing' },
    }));

    try {
      const { data, error } = await supabase.functions.invoke('fetch-comps', {
        body: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          basePrice: property.estimated_value || 100000,
          radius: compsFilters.maxDistance || 3,
          latitude: property.latitude,
          longitude: property.longitude,
          testSource: source, // Flag to test only this API
        },
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        setResults(prev => ({
          ...prev,
          [source]: {
            status: 'error',
            error: error.message || 'Unknown error',
            details: error,
          },
        }));
        toast({
          title: `${source} Test Failed`,
          description: error.message || 'Unknown error',
          variant: 'destructive',
        });
        return;
      }

      if (!data?.comps || data.comps.length === 0) {
        setResults(prev => ({
          ...prev,
          [source]: {
            status: 'error',
            error: data?.error || 'No comparables found',
            details: data,
            result: {
              count: 0,
              source: data?.source || source,
              responseTime,
            },
          },
        }));
        toast({
          title: `${source} Test: No Results`,
          description: data?.error || 'No comparables found for this address',
          variant: 'default',
        });
        return;
      }

      setResults(prev => ({
        ...prev,
        [source]: {
          status: 'success',
          result: {
            count: data.comps.length,
            source: data.source || source,
            responseTime,
            firstComp: data.comps[0],
          },
          details: data,
        },
      }));

      toast({
        title: `${source} Test: Success`,
        description: `Found ${data.comps.length} comparables in ${responseTime}ms`,
      });
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        [source]: {
          status: 'error',
          error: err?.message || String(err),
          details: err,
        },
      }));
      toast({
        title: `${source} Test: Error`,
        description: err?.message || 'Failed to test API',
        variant: 'destructive',
      });
    }
  };

  const testAll = async () => {
    await testAPI('attom-v2');
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAPI('zillow');
    await new Promise(resolve => setTimeout(resolve, 500));
    await testAPI('county-csv');
  };

  const copyError = (error: string) => {
    navigator.clipboard.writeText(error);
    toast({
      title: 'Copied',
      description: 'Error details copied to clipboard',
    });
  };

  const getStatusIcon = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ApiTestResult['status']) => {
    switch (status) {
      case 'testing':
        return <Badge variant="outline" className="bg-blue-50">Testing...</Badge>;
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <Card className="mt-4 border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Diagnostics & Testing
            </CardTitle>
            <CardDescription>
              Test individual APIs to diagnose data fetching issues
            </CardDescription>
          </div>
          <Button onClick={testAll} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Test All APIs
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Info */}
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <strong>Testing for:</strong> {property.address}, {property.city}, {property.state} {property.zip_code}
        </div>

        {/* Attom V2 API */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.attom.status)}
                <span className="font-semibold">Attom Data API V2</span>
                {getStatusBadge(results.attom.status)}
              </div>
              <div className="flex items-center gap-2">
                {results.attom.result && (
                  <span className="text-sm text-muted-foreground">
                    {results.attom.result.count} comps
                    {results.attom.result.responseTime && ` in ${results.attom.result.responseTime}ms`}
                  </span>
                )}
                <Button
                  onClick={() => testAPI('attom-v2')}
                  size="sm"
                  variant="outline"
                  disabled={results.attom.status === 'testing'}
                >
                  {results.attom.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </div>

            {results.attom.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 font-medium">Error: {results.attom.error}</span>
                  <Button
                    onClick={() => copyError(results.attom.error || '')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {results.attom.result?.firstComp && (
              <Collapsible
                open={expanded.attom}
                onOpenChange={(open) => setExpanded(prev => ({ ...prev, attom: open }))}
              >
                <CollapsibleTrigger className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  {expanded.attom ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View first comp example
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <pre className="overflow-auto">
                    {JSON.stringify(results.attom.result.firstComp, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Zillow API */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.zillow.status)}
                <span className="font-semibold">Zillow RapidAPI</span>
                {getStatusBadge(results.zillow.status)}
              </div>
              <div className="flex items-center gap-2">
                {results.zillow.result && (
                  <span className="text-sm text-muted-foreground">
                    {results.zillow.result.count} comps
                    {results.zillow.result.responseTime && ` in ${results.zillow.result.responseTime}ms`}
                  </span>
                )}
                <Button
                  onClick={() => testAPI('zillow')}
                  size="sm"
                  variant="outline"
                  disabled={results.zillow.status === 'testing'}
                >
                  {results.zillow.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </div>

            {results.zillow.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 font-medium">Error: {results.zillow.error}</span>
                  <Button
                    onClick={() => copyError(results.zillow.error || '')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {results.zillow.result?.firstComp && (
              <Collapsible
                open={expanded.zillow}
                onOpenChange={(open) => setExpanded(prev => ({ ...prev, zillow: open }))}
              >
                <CollapsibleTrigger className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  {expanded.zillow ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View first comp example
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <pre className="overflow-auto">
                    {JSON.stringify(results.zillow.result.firstComp, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* County CSV */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(results.county.status)}
                <span className="font-semibold">Orange County CSV (Public Records)</span>
                {getStatusBadge(results.county.status)}
              </div>
              <div className="flex items-center gap-2">
                {results.county.result && (
                  <span className="text-sm text-muted-foreground">
                    {results.county.result.count} comps
                    {results.county.result.responseTime && ` in ${results.county.result.responseTime}ms`}
                  </span>
                )}
                <Button
                  onClick={() => testAPI('county-csv')}
                  size="sm"
                  variant="outline"
                  disabled={results.county.status === 'testing'}
                >
                  {results.county.status === 'testing' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Test'
                  )}
                </Button>
              </div>
            </div>

            {results.county.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-red-700 font-medium">Error: {results.county.error}</span>
                  <Button
                    onClick={() => copyError(results.county.error || '')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {results.county.result?.firstComp && (
              <Collapsible
                open={expanded.county}
                onOpenChange={(open) => setExpanded(prev => ({ ...prev, county: open }))}
              >
                <CollapsibleTrigger className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  {expanded.county ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View first comp example
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded text-xs">
                  <pre className="overflow-auto">
                    {JSON.stringify(results.county.result.firstComp, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Tip:</strong> If all APIs fail, check:
          <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
            <li>API keys are configured in Supabase Edge Functions secrets</li>
            <li>Address format is correct (street, city, state, zip)</li>
            <li>Property coordinates (latitude/longitude) are available</li>
            <li>Check browser console and logs panel for detailed error messages</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
