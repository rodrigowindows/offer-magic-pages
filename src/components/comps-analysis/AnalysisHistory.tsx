/**
 * AnalysisHistory Component
 * Display and manage historical comp analyses
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Download, Eye, Trash2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AnalysisHistoryItem } from './types';

export interface AnalysisHistoryProps {
  history: AnalysisHistoryItem[];
  onLoadHistory: (item: AnalysisHistoryItem) => void;
  onDeleteHistory: (itemId: string) => void;
  onExportHistory: (item: AnalysisHistoryItem) => void;
  currentPropertyId?: string;
  className?: string;
}

export const AnalysisHistory = ({
  history,
  onLoadHistory,
  onDeleteHistory,
  onExportHistory,
  currentPropertyId,
  className = '',
}: AnalysisHistoryProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSourceBadge = (source?: string) => {
    const sourceConfig = {
      attom: { label: 'ATTOM', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      zillow: { label: 'Zillow', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      csv: { label: 'CSV', color: 'bg-green-100 text-green-800 border-green-200' },
      demo: { label: 'Demo', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      manual: { label: 'Manual', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    };

    const config = sourceConfig[source as keyof typeof sourceConfig] || sourceConfig.demo;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Group history by property
  const historyByProperty = history.reduce((acc, item) => {
    const propertyId = item.property_id || 'unknown';
    if (!acc[propertyId]) {
      acc[propertyId] = [];
    }
    acc[propertyId].push(item);
    return acc;
  }, {} as Record<string, AnalysisHistoryItem[]>);

  // Sort each property's history by date (newest first)
  Object.keys(historyByProperty).forEach((propertyId) => {
    historyByProperty[propertyId].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Analysis History
          <Badge variant="outline" className="ml-auto">
            {history.length} {history.length === 1 ? 'record' : 'records'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No analysis history yet</p>
            <p className="text-xs mt-1">Save an analysis to see it here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(historyByProperty).map(([propertyId, items]) => (
              <div key={propertyId} className="space-y-2">
                {/* Property Header */}
                <div className="flex items-center gap-2 pb-2 border-b">
                  <h4 className="text-sm font-semibold flex-1">
                    Property ID: {propertyId.substring(0, 8)}...
                  </h4>
                  {propertyId === currentPropertyId && (
                    <Badge className="bg-green-100 text-green-800">Current</Badge>
                  )}
                </div>

                {/* History Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      {/* Timeline Dot */}
                      <div className="flex-shrink-0 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {item.comparables_count || 0} comparables
                              </span>
                              {getSourceBadge(item.data_source || undefined)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Value Range */}
                        {item.suggested_value_min && item.suggested_value_max && (
                          <div className="flex items-baseline gap-2 text-sm">
                            <span className="text-muted-foreground">Value Range:</span>
                            <span className="font-semibold text-green-700">
                              {formatCurrency(item.suggested_value_min)} - {formatCurrency(item.suggested_value_max)}
                            </span>
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic truncate">
                            &quot;{item.notes}&quot;
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onLoadHistory(item)}
                            className="h-7 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExportHistory(item)}
                            className="h-7 text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteHistory(item.id)}
                            className="h-7 text-xs text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
