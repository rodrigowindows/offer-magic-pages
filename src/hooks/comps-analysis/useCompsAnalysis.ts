import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Property, ComparableProperty, MarketAnalysis, DataSource } from '@/components/comps-analysis/types';
import { CompsDataService } from '@/services/compsDataService';

export const useCompsAnalysis = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const { toast } = useToast();

  const fetchProperties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, address, city, state, zip_code, estimated_value, cash_offer_amount, property_image_url, approval_status, approved_at, square_feet, bedrooms, bathrooms, year_built, lot_size, property_type')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setProperties(data || []);
    } catch (error: any) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchComparables = useCallback(async (property: Property, radius: number = 1) => {
    if (!property) return;

    setLoading(true);
    try {
      const result = await CompsDataService.getComparables(
        property.address,
        property.city || '',
        property.state || '',
        radius,
        10,
        property.estimated_value || 250000
      );

      // Map ComparableData to ComparableProperty
      const mappedComparables: ComparableProperty[] = result.map((comp, index) => ({
        id: `comp-${index}-${comp.address}`,
        address: comp.address,
        city: comp.city,
        state: comp.state,
        zipCode: comp.zipCode,
        salePrice: comp.salePrice,
        saleDate: comp.saleDate,
        beds: comp.beds,
        baths: comp.baths,
        sqft: comp.sqft,
        pricePerSqft: comp.sqft > 0 ? comp.salePrice / comp.sqft : 0,
        distance: comp.distance || 0,
        yearBuilt: comp.yearBuilt,
        propertyType: comp.propertyType,
        // Legacy fields
        sale_price: comp.salePrice,
        sale_date: comp.saleDate,
        bedrooms: comp.beds,
        bathrooms: comp.baths,
        square_feet: comp.sqft,
        price_per_sqft: comp.sqft > 0 ? comp.salePrice / comp.sqft : 0,
        property_type: comp.propertyType,
      }));

      setComparables(mappedComparables);

      // Calculate market analysis
      if (mappedComparables.length > 0) {
        const prices = mappedComparables.map(c => c.salePrice);
        const pricesPerSqft = mappedComparables.map(c => c.pricePerSqft);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const avgPricePerSqft = pricesPerSqft.reduce((a, b) => a + b, 0) / pricesPerSqft.length;
        const sortedPrices = [...prices].sort((a, b) => a - b);
        const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];

        setAnalysis({
          avgSalePrice: avgPrice,
          medianSalePrice: medianPrice,
          avgPricePerSqft: avgPricePerSqft,
          suggestedValueMin: avgPrice * 0.95,
          suggestedValueMax: avgPrice * 1.05,
          trendPercentage: 0,
          marketTrend: 'stable',
          comparablesCount: mappedComparables.length,
        });
      }

      setDataSource('demo');
    } catch (error: any) {
      console.error('Error fetching comparables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comparables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveAnalysis = useCallback(async (notes: string) => {
    if (!selectedProperty || !analysis || comparables.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to save reports',
          variant: 'destructive',
        });
        return;
      }

      const insertData = {
        property_id: selectedProperty.id,
        analyst_user_id: user.id,
        analysis_data: { comps: comparables, analysis: analysis },
        comparables_count: comparables.length,
        suggested_value_min: analysis.suggestedValueMin,
        suggested_value_max: analysis.suggestedValueMax,
        notes: notes || null,
        search_radius_miles: 1,
        data_source: dataSource,
      };

      const { error } = await supabase
        .from('comps_analysis_history')
        .insert(insertData as any);

      if (error) throw error;

      toast({
        title: '✅ Analysis Saved Successfully',
        description: `Saved ${comparables.length} comps for ${selectedProperty.address}`,
      });
    } catch (error: any) {
      console.error('Error saving analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to save analysis',
        variant: 'destructive',
      });
    }
  }, [selectedProperty, analysis, comparables, dataSource, toast]);

  return {
    properties,
    selectedProperty,
    setSelectedProperty,
    comparables,
    analysis,
    loading,
    dataSource,
    fetchProperties,
    fetchComparables,
    saveAnalysis,
  };
};
