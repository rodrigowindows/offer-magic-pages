import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Save, Download, Share2, ChevronDown, Loader2, FileText, Trash2 } from 'lucide-react';
import type { MarketAnalysis, Property, ComparableProperty, DataSource } from './types';

interface ExecutiveSummaryProps {
  analysis: MarketAnalysis;
  comparables: ComparableProperty[];
  dataSource: DataSource;
  selectedProperty: Property;
  loading: boolean;
  exportingPDF: boolean;
  analysisNotes: string;
  onNotesChange: (notes: string) => void;
  onRefresh: () => void;
  onSave: () => void;
  onExport: (withImages: boolean) => void;
  onExportAll: () => void;
  onExportAllForceRefresh?: () => void;
  onClearCache?: () => void;
  onShare: () => void;
}

const DataQualityBanner = ({ source, count }: { source: DataSource; count: number }) => {
  const qualityConfig = {
    attom: { label: 'MLS Real', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    zillow: { label: 'Zillow API', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
    csv: { label: 'Registros Públicos', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    demo: { label: 'Dados Demo', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  }[source];

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${qualityConfig.bgColor} border border-${qualityConfig.color.replace('bg-', '')}`}>
      <span className={`w-3 h-3 rounded-full ${qualityConfig.color}`}></span>
      <span className={`font-semibold ${qualityConfig.textColor}`}>
        {count} comps via {qualityConfig.label}
      </span>
    </div>
  );
};

export const ExecutiveSummary = ({
  analysis,
  comparables,
  dataSource,
  selectedProperty,
  loading,
  onClearCache,
  exportingPDF,
  analysisNotes,
  onNotesChange,
  onRefresh,
  onSave,
  onExport,
  onExportAll,
  onExportAllForceRefresh,
  onShare
}: ExecutiveSummaryProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Resumo Executivo</h3>
            <DataQualityBanner source={dataSource} count={comparables.length} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Analysis Report</DialogTitle>
                  <DialogDescription>Add optional notes about this analysis</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="save-notes">Analysis Notes</Label>
                    <Textarea
                      id="save-notes"
                      placeholder="Market conditions, adjustments made, observations..."
                      value={analysisNotes}
                      onChange={(e) => onNotesChange(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <p className="font-semibold mb-1">Summary:</p>
                    <p>Property: {selectedProperty.address}</p>
                    <p>Comps: {comparables.length}</p>
                    <p>Value: ${analysis.suggestedValueMin.toLocaleString()} - ${analysis.suggestedValueMax.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onNotesChange('')}>Clear</Button>
                  <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exportingPDF}>
                  {exportingPDF ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onExport(false)} disabled={exportingPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Quick PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(true)} disabled={exportingPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF with Images
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExportAll} disabled={exportingPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Filtered
                </DropdownMenuItem>
                {onExportAllForceRefresh && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onExportAllForceRefresh} disabled={exportingPDF} className="text-orange-600">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Force Refresh & Export All
                    </DropdownMenuItem>
                  </>
                )}

                {onClearCache && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onClearCache} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Limpar Cache Antigo
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={onShare} variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xs md:text-sm text-muted-foreground mb-1">Avg Sale</div>
            <div className="text-lg md:text-2xl font-bold text-blue-600">
              ${(analysis.avgSalePrice / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xs md:text-sm text-muted-foreground mb-1">Price/sqft</div>
            <div className="text-lg md:text-2xl font-bold text-green-600">
              ${analysis.avgPricePerSqft.toFixed(0)}
            </div>
          </div>
          <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xs md:text-sm text-muted-foreground mb-1">Range</div>
            <div className="text-sm md:text-xl font-bold text-indigo-600">
              ${(analysis.suggestedValueMin / 1000).toFixed(0)}K-${(analysis.suggestedValueMax / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="text-center p-3 md:p-4 bg-white rounded-lg shadow-sm">
            <div className="text-xs md:text-sm text-muted-foreground mb-1">Comps</div>
            <div className="text-lg md:text-2xl font-bold text-purple-600">
              {comparables.length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {dataSource === 'attom' ? 'MLS' : dataSource === 'zillow' ? 'Zillow' : dataSource === 'csv' ? 'CSV' : 'Demo'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
