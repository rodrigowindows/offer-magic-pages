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
      const compsService = new CompsDataService();
      const result = await compsService.searchComparables(
        property.address,
        property.city || '',
        property.state || '',
        property.zip_code || '',
        radius
      );

      setComparables(result.comparables);
      setAnalysis(result.analysis);
      setDataSource(result.source);
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

      const { error } = await supabase
        .from('comps_analysis_history')
        .insert({
          property_id: selectedProperty.id,
          analyst_user_id: user.id,
          analysis_data: { comps: comparables, analysis: analysis },
          comparables_count: comparables.length,
          suggested_value_min: analysis.suggestedValueMin,
          suggested_value_max: analysis.suggestedValueMax,
          notes: notes || null,
          search_radius_miles: 1,
          data_source: dataSource,
        });

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
