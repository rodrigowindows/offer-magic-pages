import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2, MinusCircle } from 'lucide-react';

interface ApiDiagnosticsPanelProps {
  property: any;
  apiTestResults: {
    attom?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
    zillow?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
    county?: { status: 'testing' | 'success' | 'error', result?: any, error?: string };
  };
  onTestAttom: () => void;
  onTestZillow: () => void;
  onTestCounty: () => void;
  onTestAll?: () => void;
}

const statusIcon = (status?: string) => {
  if (status === 'testing') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  if (status === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'error') return <XCircle className="h-4 w-4 text-red-600" />;
  return <MinusCircle className="h-4 w-4 text-gray-400" />;
};

export const ApiDiagnosticsPanel: React.FC<ApiDiagnosticsPanelProps> = ({
  property,
  apiTestResults,
  onTestAttom,
  onTestZillow,
  onTestCounty,
  onTestAll
}) => {
  return (
    <Card style={{ margin: '16px 0', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg">API Diagnostics & Testing</span>
          {onTestAll && (
            <Button size="sm" variant="outline" onClick={onTestAll}>Test All</Button>
          )}
        </div>
        <div className="space-y-4">
          {/* Attom */}
          <div className="flex items-center gap-3">
            {statusIcon(apiTestResults.attom?.status)}
            <span className="font-medium">Attom V2</span>
            <Button size="sm" variant="outline" onClick={onTestAttom} disabled={apiTestResults.attom?.status === 'testing'}>Test</Button>
            {apiTestResults.attom?.status === 'success' && (
              <span className="text-green-700 text-xs ml-2">{apiTestResults.attom.result?.count} comps</span>
            )}
            {apiTestResults.attom?.status === 'error' && (
              <span className="text-red-700 text-xs ml-2">{apiTestResults.attom.error}</span>
            )}
          </div>
          {/* Zillow */}
          <div className="flex items-center gap-3">
            {statusIcon(apiTestResults.zillow?.status)}
            <span className="font-medium">Zillow</span>
            <Button size="sm" variant="outline" onClick={onTestZillow} disabled={apiTestResults.zillow?.status === 'testing'}>Test</Button>
            {apiTestResults.zillow?.status === 'success' && (
              <span className="text-green-700 text-xs ml-2">{apiTestResults.zillow.result?.count} comps</span>
            )}
            {apiTestResults.zillow?.status === 'error' && (
              <span className="text-red-700 text-xs ml-2">{apiTestResults.zillow.error}</span>
            )}
          </div>
          {/* County CSV */}
          <div className="flex items-center gap-3">
            {statusIcon(apiTestResults.county?.status)}
            <span className="font-medium">County CSV</span>
            <Button size="sm" variant="outline" onClick={onTestCounty} disabled={apiTestResults.county?.status === 'testing'}>Test</Button>
            {apiTestResults.county?.status === 'success' && (
              <span className="text-green-700 text-xs ml-2">{apiTestResults.county.result?.count} comps</span>
            )}
            {apiTestResults.county?.status === 'error' && (
              <span className="text-red-700 text-xs ml-2">{apiTestResults.county.error}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
