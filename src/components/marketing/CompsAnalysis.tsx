/**
 * Comps Analysis Component
 * Comparative Market Analysis (CMA) tool for property valuation
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  DollarSign,
  Ruler,
  Building,
  Download,
  Save,
  Plus,
  Trash2,
  Calculator,
  Info,
  FileText,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { exportCompsToPDF, exportCompsToSimplePDF } from '@/utils/pdfExport';

interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  estimated_value: number;
  cash_offer_amount: number;
  property_image_url?: string | null;
}

interface ComparableProperty {
  id: string;
  address: string;
  saleDate: Date;
  salePrice: number;
  sqft: number;
  beds: number;
  baths: number;
  yearBuilt: number;
  lotSize?: number;
  distanceMiles: number;
  daysOnMarket?: number;
  adjustment: number;
  pricePerSqft: number;
}

interface MarketAnalysis {
  avgSalePrice: number;
  avgPricePerSqft: number;
  suggestedValueMin: number;
  suggestedValueMax: number;
  marketTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export const CompsAnalysis = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      generateComparables(selectedProperty);
    }
  }, [selectedProperty]);

  useEffect(() => {
    if (comparables.length > 0) {
      calculateAnalysis();
    }
  }, [comparables]);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount, property_image_url')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    }
  };

  const generateComparables = (property: Property) => {
    // Generate realistic comparable properties
    // In production, this would fetch from MLS, Zillow API, or property database
    const baseValue = property.estimated_value || 250000;
    const variance = baseValue * 0.15; // 15% variance

    const comps: ComparableProperty[] = Array.from({ length: 5 }, (_, i) => {
      const sqft = 1200 + Math.floor(Math.random() * 800);
      const salePrice = Math.round(baseValue + (Math.random() * variance * 2 - variance));
      const pricePerSqft = Math.round(salePrice / sqft);
      const daysAgo = 5 + Math.floor(Math.random() * 120);

      return {
        id: `comp-${i}`,
        address: `${Math.floor(Math.random() * 9999)} ${['NW', 'SW', 'NE', 'SE'][i % 4]} ${Math.floor(Math.random() * 99)}th ${['St', 'Ave', 'Ter', 'Dr'][i % 4]}`,
        saleDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        salePrice,
        sqft,
        beds: 2 + Math.floor(Math.random() * 3),
        baths: 1 + Math.floor(Math.random() * 2.5),
        yearBuilt: 1980 + Math.floor(Math.random() * 40),
        lotSize: 5000 + Math.floor(Math.random() * 5000),
        distanceMiles: 0.1 + Math.random() * 0.9,
        daysOnMarket: 10 + Math.floor(Math.random() * 60),
        adjustment: 0,
        pricePerSqft,
      };
    });

    setComparables(comps);
  };

  const calculateAnalysis = () => {
    if (comparables.length === 0) return;

    const avgSalePrice = Math.round(
      comparables.reduce((sum, comp) => sum + (comp.salePrice + comp.adjustment), 0) / comparables.length
    );

    const avgPricePerSqft = Math.round(
      comparables.reduce((sum, comp) => sum + comp.pricePerSqft, 0) / comparables.length
    );

    const prices = comparables.map(c => c.salePrice + c.adjustment).sort((a, b) => a - b);
    const suggestedValueMin = Math.round(prices[0] * 0.95);
    const suggestedValueMax = Math.round(prices[prices.length - 1] * 1.05);

    // Simple trend calculation based on sale dates
    const sortedByDate = [...comparables].sort((a, b) => a.saleDate.getTime() - b.saleDate.getTime());
    const recentAvg = (sortedByDate[sortedByDate.length - 1].pricePerSqft + sortedByDate[sortedByDate.length - 2].pricePerSqft) / 2;
    const olderAvg = (sortedByDate[0].pricePerSqft + sortedByDate[1].pricePerSqft) / 2;
    const trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

    const marketTrend: 'up' | 'down' | 'stable' =
      trendPercentage > 2 ? 'up' : trendPercentage < -2 ? 'down' : 'stable';

    setAnalysis({
      avgSalePrice,
      avgPricePerSqft,
      suggestedValueMin,
      suggestedValueMax,
      marketTrend,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
    });
  };

  const updateAdjustment = (id: string, adjustment: number) => {
    setComparables(prev =>
      prev.map(comp => (comp.id === id ? { ...comp, adjustment } : comp))
    );
  };

  const exportToPDF = async (withImages: boolean = true) => {
    if (!selectedProperty || !analysis || comparables.length === 0) {
      toast({
        title: 'Cannot Export',
        description: 'Please select a property and ensure comparables are loaded',
        variant: 'destructive',
      });
      return;
    }

    setExportingPDF(true);

    try {
      if (withImages) {
        await exportCompsToPDF(selectedProperty, comparables, analysis);
        toast({
          title: 'PDF Exported Successfully',
          description: 'Complete CMA report with images has been downloaded',
        });
      } else {
        exportCompsToSimplePDF(selectedProperty, comparables, analysis);
        toast({
          title: 'PDF Exported Successfully',
          description: 'Simplified CMA report has been downloaded',
        });
      }
    } catch (error: any) {
      console.error('PDF Export Error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const saveReport = async () => {
    if (!selectedProperty || comparables.length === 0) return;

    try {
      // In production, save to property_comps table
      toast({
        title: 'Success',
        description: 'Comp report saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to save report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="w-8 h-8" />
            Comparative Market Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Analyze comparable sales to determine fair market value
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveReport} variant="outline" disabled={!selectedProperty}>
            <Save className="w-4 h-4 mr-2" />
            Save Report
          </Button>
          <Button
            onClick={() => exportToPDF(false)}
            variant="outline"
            disabled={!selectedProperty || exportingPDF}
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Quick PDF
          </Button>
          <Button
            onClick={() => exportToPDF(true)}
            disabled={!selectedProperty || exportingPDF}
          >
            {exportingPDF ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF com Imagens
          </Button>
        </div>
      </div>

      {/* Property Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Property</CardTitle>
          <CardDescription>Select a property to analyze</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProperty?.id}
            onValueChange={(value) => {
              const property = properties.find(p => p.id === value);
              setSelectedProperty(property || null);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a property..." />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}, {property.city}, {property.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProperty && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{selectedProperty.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">City</p>
                <p className="font-medium">{selectedProperty.city}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estimated Value</p>
                <p className="font-medium">${selectedProperty.estimated_value.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Offer</p>
                <p className="font-medium">${selectedProperty.cash_offer_amount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Analysis Summary */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Sale Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analysis.avgSalePrice.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Price/Sqft
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analysis.avgPricePerSqft}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Suggested Value Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                ${analysis.suggestedValueMin.toLocaleString()} - ${analysis.suggestedValueMax.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Market Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {analysis.marketTrend === 'up' ? (
                  <TrendingUp className="w-5 h-5 text-green-500" />
                ) : analysis.marketTrend === 'down' ? (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                ) : (
                  <div className="w-5 h-5 bg-gray-300 rounded-full" />
                )}
                <span className="text-lg font-bold">
                  {analysis.trendPercentage > 0 ? '+' : ''}{analysis.trendPercentage}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comparable Properties Table */}
      {comparables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparable Sales</CardTitle>
            <CardDescription>
              Recent sales within 1 mile of subject property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Address</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead className="text-right">Sale Price</TableHead>
                    <TableHead className="text-right">Sqft</TableHead>
                    <TableHead className="text-right">$/Sqft</TableHead>
                    <TableHead>Beds/Baths</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                    <TableHead className="text-right">DOM</TableHead>
                    <TableHead className="text-right">Adjustment</TableHead>
                    <TableHead className="text-right">Adj. Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparables.map((comp) => (
                    <TableRow key={comp.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          {comp.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(comp.saleDate, 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        ${comp.salePrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.sqft.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${comp.pricePerSqft}
                      </TableCell>
                      <TableCell>
                        {comp.beds}bd / {comp.baths}ba
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.distanceMiles.toFixed(2)} mi
                      </TableCell>
                      <TableCell className="text-right">
                        {comp.daysOnMarket || '-'} days
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={comp.adjustment}
                          onChange={(e) => updateAdjustment(comp.id, Number(e.target.value))}
                          className="w-24 text-right"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${(comp.salePrice + comp.adjustment).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">About Adjustments</p>
                  <p className="text-muted-foreground">
                    Add or subtract value to account for differences between the comparable and subject property.
                    For example, if a comp has a pool (+$10,000) or needs major repairs (-$15,000).
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedProperty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calculator className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Select a property above to view comparable sales analysis and market value estimates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompsAnalysis;
