/**
 * Comps Analysis Component - REFACTORED VERSION
 * Comparative Market Analysis (CMA) tool for property valuation
 *
 * NOW USING MODULAR COMPONENTS:
 * - Phase 1: OnboardingTour, CommandPalette, SmartInsights, ExecutiveSummary
 * - Phase 2: PropertySelector, CompsFilters, CompsTable, AnalysisHistory, CompareDialog
 * - Hooks: useCompsAnalysis, useAnalysisHistory, useFavorites
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Map, BarChart3, History as HistoryIcon, Edit2, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Modular Components - Phase 1
import {
  OnboardingTour,
  CommandPalette,
  SmartInsights,
  ExecutiveSummary,
} from '@/components/comps-analysis';

// Modular Components - Phase 2
import {
  PropertySelector,
  CompsFilters,
  CompsTable,
  AnalysisHistory,
  CompareDialog,
} from '@/components/comps-analysis';

// Types
import type {
  Property,
  ComparableProperty,
  MarketAnalysis,
  SmartInsights as SmartInsightsType,
  CompsFiltersConfig,
} from '@/components/comps-analysis/types';

// Hooks
import { useFavorites } from '@/hooks/comps-analysis/useFavorites';
import { useAnalysisHistory } from '@/hooks/comps-analysis/useAnalysisHistory';

// Legacy components (still needed)
import { CompsMapboxMap } from './CompsMapboxMap';
import { CompsComparison } from './CompsComparison';
import { CompsApiSettings } from '@/components/CompsApiSettings';
import { ManualCompsManager } from '@/components/ManualCompsManager';
import { AdjustmentCalculator } from '@/components/AdjustmentCalculator';

// Services
import { CompsDataService } from '@/services/compsDataService';
import { supabase } from '@/integrations/supabase/client';
import { exportCompsToPDF, exportCompsToSimplePDF, exportConsolidatedCompsPDF } from '@/utils/pdfExport';

/**
 * Main CompsAnalysis Component
 */
export const CompsAnalysis = () => {
  const { toast } = useToast();

  // ========================================
  // STATE MANAGEMENT
  // ========================================

  // Properties & Selection
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [offerFilter, setOfferFilter] = useState<'all' | 'with-offer' | 'no-offer'>('all');

  // Offer Management
  const [editingOffer, setEditingOffer] = useState(false);
  const [offerAmount, setOfferAmount] = useState<number>(0);

  // Comparables & Analysis
  const [comparables, setComparables] = useState<ComparableProperty[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [smartInsights, setSmartInsights] = useState<SmartInsightsType | null>(null);

  // Cache for comparables to avoid redundant API calls
  const [compsCache, setCompsCache] = useState<Record<string, { comparables: ComparableProperty[], analysis: MarketAnalysis, timestamp: number }>>({});

  // Filters
  const [compsFilters, setCompsFilters] = useState<CompsFiltersConfig>({
    maxDistance: 3,
    saleWithin: 12,
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'combined' | 'map'>('auto');

  // Dialogs
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [showAdjustmentCalc, setShowAdjustmentCalc] = useState(false);

  // Notes
  const [analysisNotes, setAnalysisNotes] = useState('');

  // Data Source
  const [dataSource, setDataSource] = useState<'attom' | 'zillow' | 'csv' | 'demo'>('demo');

  // Manual Comps
  const [manualComps, setManualComps] = useState<any[]>([]);
  const [manualLinksCount, setManualLinksCount] = useState(0);

  // Comparison
  const [selectedForComparison, setSelectedForComparison] = useState<ComparableProperty[]>([]);

  // ========================================
  // CUSTOM HOOKS
  // ========================================

  const {
    favorites,
    toggleFavorite,
    isFavorite,
  } = useFavorites();

  const {
    history: analysisHistoryData,
    loading: historyLoading,
    saveAnalysis: saveToHistory,
    deleteHistory,
    loadHistoryItem,
  } = useAnalysisHistory();

  // ========================================
  // COMPUTED VALUES (MEMOIZED)
  // ========================================

  /**
   * Filter comparables based on active filters
   */
  const filteredComparables = useMemo(() => {
    return comparables.filter((comp) => {
      // Distance filter
      if (compsFilters.maxDistance && comp.distance && comp.distance > compsFilters.maxDistance) {
        return false;
      }

      // Sale date filter
      if (compsFilters.saleWithin && comp.sale_date) {
        const monthsAgo = new Date();
        monthsAgo.setMonth(monthsAgo.getMonth() - compsFilters.saleWithin);
        if (new Date(comp.sale_date) < monthsAgo) {
          return false;
        }
      }

      // Property type filter
      if (compsFilters.propertyType && comp.property_type !== compsFilters.propertyType) {
        return false;
      }

      // Bedrooms range
      if (compsFilters.minBeds && comp.bedrooms && comp.bedrooms < compsFilters.minBeds) {
        return false;
      }
      if (compsFilters.maxBeds && comp.bedrooms && comp.bedrooms > compsFilters.maxBeds) {
        return false;
      }

      // Bathrooms range
      if (compsFilters.minBaths && comp.bathrooms && comp.bathrooms < compsFilters.minBaths) {
        return false;
      }
      if (compsFilters.maxBaths && comp.bathrooms && comp.bathrooms > compsFilters.maxBaths) {
        return false;
      }

      // Square feet range
      if (compsFilters.minSqft && comp.square_feet && comp.square_feet < compsFilters.minSqft) {
        return false;
      }
      if (compsFilters.maxSqft && comp.square_feet && comp.square_feet > compsFilters.maxSqft) {
        return false;
      }

      // Price range
      if (compsFilters.minPrice && comp.sale_price && comp.sale_price < compsFilters.minPrice) {
        return false;
      }
      if (compsFilters.maxPrice && comp.sale_price && comp.sale_price > compsFilters.maxPrice) {
        return false;
      }

      return true;
    });
  }, [comparables, compsFilters]);

  /**
   * Filtered properties based on status and offer filters
   */
  const filteredProperties = useMemo(() => {
    return properties.filter(p => {
      // Approval status filter
      if (approvalStatusFilter === 'approved' && p.approval_status !== 'approved') return false;
      if (approvalStatusFilter === 'pending' && p.approval_status !== 'pending' && p.approval_status != null) return false;
      if (approvalStatusFilter === 'rejected' && p.approval_status !== 'rejected') return false;

      // Offer filter
      if (offerFilter === 'with-offer' && (!p.cash_offer_amount || p.cash_offer_amount === 0)) return false;
      if (offerFilter === 'no-offer' && p.cash_offer_amount && p.cash_offer_amount > 0) return false;

      return true;
    });
  }, [properties, approvalStatusFilter, offerFilter]);

  /**
   * Generate smart insights based on analysis
   */
  const computedInsights = useMemo((): SmartInsightsType | null => {
    if (!analysis || !selectedProperty) return null;

    const marketHeat: 'hot' | 'cold' | 'stable' =
      analysis.marketTrend === 'up' ? 'hot' :
      analysis.marketTrend === 'down' ? 'cold' : 'stable';

    const avgDaysOnMarket = comparables.reduce((sum, c) => sum + (c.days_on_market || 0), 0) / comparables.length;

    const suggestions = [];
    if (analysis.avgPricePerSqft > 200) {
      suggestions.push('High-value market - Consider premium positioning');
    }
    if (avgDaysOnMarket < 30) {
      suggestions.push('Fast-moving market - Act quickly');
    }
    if (comparables.length < 5) {
      suggestions.push('Limited comps - Consider expanding search radius');
    }

    return {
      marketHeat,
      trend: analysis.trendPercentage,
      avgDaysOnMarket: Math.round(avgDaysOnMarket),
      offerVsMarket: selectedProperty.cash_offer_amount
        ? ((selectedProperty.cash_offer_amount / analysis.avgSalePrice - 1) * 100)
        : 0,
      suggestions,
    };
  }, [analysis, selectedProperty, comparables]);

  // ========================================
  // DATA FETCHING
  // ========================================

  /**
   * Fetch all properties from database
   */
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: 'Error',
        description: 'Failed to load properties',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Generate comparables for selected property
   */
  const generateComparables = useCallback(async (property: Property) => {
    if (!property) return;

    try {
      setLoadingComps(true);

      // Create cache key based on property and filters
      const cacheKey = `${property.id}-${compsFilters.maxDistance || 3}`;
      const cached = compsCache[cacheKey];

      // Check if we have valid cached data (cache never expires)
      if (cached) {
        console.log('Using cached comparables for property:', property.address);
        setComparables(cached.comparables);
        setAnalysis(cached.analysis);
        setLoadingComps(false);
        return;
      }

      console.log('Fetching new comparables for property:', property.address);

      // Call CompsDataService with correct parameters
      const compsData = await CompsDataService.getComparables(
        property.address || '',
        property.city || 'Orlando',
        property.state || 'FL',
        compsFilters.maxDistance || 3,
        10, // limit
        property.estimated_value || 250000
      );

      if (compsData && compsData.length > 0) {
        // Convert to ComparableProperty format with validation
        const formattedComps: ComparableProperty[] = compsData
          .filter(comp => comp.salePrice && comp.sqft && comp.sqft > 0) // Filter invalid data
          .map((comp, index) => ({
            id: `comp-${index}`,
            address: comp.address || 'Unknown',
            city: comp.city || property.city,
            state: comp.state || property.state,
            zip_code: comp.zipCode || '',
            sale_price: Number(comp.salePrice) || 0,
            sale_date: comp.saleDate || new Date().toISOString(),
            square_feet: Number(comp.sqft) || 1,
            bedrooms: Number(comp.beds) || 0,
            bathrooms: Number(comp.baths) || 0,
            price_per_sqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
            distance: Number(comp.distance) || 0,
            similarity_score: 0.8,
            property_type: comp.propertyType || 'Single Family',
            year_built: comp.yearBuilt || null,
          }));

        if (formattedComps.length === 0) {
          throw new Error('No valid comparables found');
        }

        setComparables(formattedComps);

        // Calculate analysis with safe defaults
        const avgPrice = formattedComps.reduce((sum, c) => sum + (c.sale_price || 0), 0) / formattedComps.length || 0;
        const avgPricePerSqft = formattedComps.reduce((sum, c) => sum + (c.price_per_sqft || 0), 0) / formattedComps.length || 0;

        const calculatedAnalysis = {
          avgSalePrice: avgPrice,
          avgPricePerSqft: avgPricePerSqft,
          suggestedValueMin: avgPrice * 0.9,
          suggestedValueMax: avgPrice * 1.1,
          marketTrend: 'stable' as const,
          trendPercentage: 0,
          medianSalePrice: avgPrice,
          comparablesCount: formattedComps.length,
        };

        setAnalysis(calculatedAnalysis);

        // Save to cache
        const cacheKey = `${property.id}-${compsFilters.maxDistance || 3}`;
        setCompsCache(prev => ({
          ...prev,
          [cacheKey]: {
            comparables: formattedComps,
            analysis: calculatedAnalysis,
            timestamp: Date.now()
          }
        }));

        toast({
          title: 'Success',
          description: `Found ${formattedComps.length} comparable properties (source: ${compsData[0].source})`,
        });
      } else {
        throw new Error('No comparables found');
      }
    } catch (error) {
      console.error('Error generating comparables:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate comparables',
        variant: 'destructive',
      });
    } finally {
      setLoadingComps(false);
    }
  }, [compsFilters.maxDistance, compsCache, toast]);

  /**
   * Load manual comps count
   */
  const loadManualLinksCount = useCallback(async (propertyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setManualLinksCount(0);
        setManualComps([]);
        return;
      }

      const { data, count, error } = await supabase
        .from('manual_comps_links')
        .select('*', { count: 'exact' })
        .eq('property_id', propertyId)
        .eq('user_id', user.id);

      if (error) throw error;
      setManualLinksCount(count || 0);
      setManualComps(data || []);
    } catch (error) {
      console.error('Error loading manual links count:', error);
      setManualLinksCount(0);
      setManualComps([]);
    }
  }, []);

  // ========================================
  // ACTIONS
  // ========================================

  /**
   * Save analysis report
   */
  const saveReport = useCallback(async () => {
    if (!selectedProperty || !analysis || comparables.length === 0) {
      toast({
        title: 'Cannot Save',
        description: 'No analysis data to save',
        variant: 'destructive',
      });
      return;
    }

    await saveToHistory({
      property_id: selectedProperty.id,
      analysis_data: {
        comparables: comparables.slice(0, 10), // Save top 10
        analysis,
      },
      comparables_count: comparables.length,
      suggested_value_min: analysis.suggestedValueMin,
      suggested_value_max: analysis.suggestedValueMax,
      search_radius_miles: compsFilters.maxDistance || 3,
      data_source: dataSource,
      notes: analysisNotes,
    });

    toast({
      title: 'Saved',
      description: 'Analysis saved to history',
    });
  }, [selectedProperty, analysis, comparables, dataSource, analysisNotes, saveToHistory, toast]);

  /**
   * Save offer amount
   */
  const saveOfferAmount = useCallback(async () => {
    if (!selectedProperty || offerAmount <= 0) {
      toast({
        title: 'Invalid Offer',
        description: 'Please enter a valid offer amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('properties')
        .update({ cash_offer_amount: offerAmount })
        .eq('id', selectedProperty.id);

      if (error) throw error;

      // Update local state
      setSelectedProperty({ ...selectedProperty, cash_offer_amount: offerAmount });
      setProperties(properties.map(p =>
        p.id === selectedProperty.id ? { ...p, cash_offer_amount: offerAmount } : p
      ));

      setEditingOffer(false);

      toast({
        title: 'Success',
        description: `Offer of $${offerAmount.toLocaleString()} saved`,
      });
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save offer amount',
        variant: 'destructive',
      });
    }
  }, [selectedProperty, offerAmount, properties, toast]);

  /**
   * Export to PDF
   */
  const exportToPDF = useCallback(async (withImages: boolean = false) => {
    if (!selectedProperty || !analysis) return;

    try {
      setExportingPDF(true);

      if (withImages) {
        await exportCompsToPDF(selectedProperty, comparables, analysis);
      } else {
        await exportCompsToSimplePDF(selectedProperty, comparables, analysis);
      }

      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
  }, [selectedProperty, comparables, analysis, toast]);

  /**
   * Export all filtered properties to PDF
   */
  const exportAllAnalyses = useCallback(async () => {
    if (filteredProperties.length === 0) {
      toast({
        title: 'No Properties',
        description: 'No properties match the current filters',
        variant: 'destructive',
      });
      return;
    }

    try {
      setExportingPDF(true);

      // Function to get comparables for each property
      const getComparablesForProperty = async (property: Property) => {
        // Check cache first (cache never expires)
        const cacheKey = `${property.id}-${compsFilters.maxDistance || 3}`;
        const cached = compsCache[cacheKey];

        if (cached) {
          console.log('Using cached data for export:', property.address);
          return { comparables: cached.comparables, analysis: cached.analysis };
        }

        // Check if we already have comparables for this property (current selection)
        if (selectedProperty?.id === property.id && comparables.length > 0 && analysis) {
          return { comparables, analysis };
        }

        // Otherwise, fetch new comparables
        console.log('Fetching new data for export:', property.address);
        const compsData = await CompsDataService.getComparables(
          property.address || '',
          property.city || 'Orlando',
          property.state || 'FL',
          compsFilters.maxDistance || 3,
          10,
          property.estimated_value || 250000
        );

        // Convert and calculate analysis with validation
        const formattedComps = compsData
          .filter((comp: any) => comp.salePrice && comp.sqft && comp.sqft > 0) // Filter invalid data
          .map((comp: any, index: number) => ({
            id: `comp-${index}`,
            address: comp.address || 'Unknown',
            city: comp.city || property.city,
            state: comp.state || property.state,
            zipCode: comp.zipCode || '',
            salePrice: Number(comp.salePrice) || 0,
            saleDate: comp.saleDate || new Date().toISOString(),
            beds: Number(comp.beds) || 0,
            baths: Number(comp.baths) || 0,
            sqft: Number(comp.sqft) || 1,
            distance: Number(comp.distance) || 0,
            pricePerSqft: Number(comp.salePrice) / Number(comp.sqft) || 0,
          }));

        if (formattedComps.length === 0) {
          throw new Error('No valid comparables found for this property');
        }

        const avgSalePrice = formattedComps.reduce((sum: number, c: any) => sum + (c.salePrice || 0), 0) / formattedComps.length || 0;
        const avgPricePerSqft = formattedComps.reduce((sum: number, c: any) => sum + (c.pricePerSqft || 0), 0) / formattedComps.length || 0;

        const calculatedAnalysis = {
          avgSalePrice,
          medianSalePrice: avgSalePrice,
          avgPricePerSqft,
          suggestedValueMin: avgSalePrice * 0.95,
          suggestedValueMax: avgSalePrice * 1.05,
          trendPercentage: 0,
          marketTrend: 'stable' as const,
          comparablesCount: formattedComps.length,
        };

        return { comparables: formattedComps, analysis: calculatedAnalysis };
      };

      await exportConsolidatedCompsPDF(
        filteredProperties,
        getComparablesForProperty,
        (current, total) => {
          console.log(`Exporting ${current}/${total} properties...`);
        }
      );

      toast({
        title: 'Success',
        description: `PDF exported with ${filteredProperties.length} filtered properties`,
      });
    } catch (error) {
      console.error('Error exporting consolidated PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to export consolidated PDF',
        variant: 'destructive',
      });
    } finally {
      setExportingPDF(false);
    }
  }, [filteredProperties, selectedProperty, comparables, analysis, compsFilters, compsCache, toast]);

  /**
   * Share analysis
   */
  const shareAnalysis = useCallback(() => {
    if (!selectedProperty || !analysis) return;

    const shareText = `Property Analysis for ${selectedProperty.address}\n` +
      `Value Range: $${analysis.suggestedValueMin.toLocaleString()} - $${analysis.suggestedValueMax.toLocaleString()}\n` +
      `Avg Price/sqft: $${analysis.avgPricePerSqft.toFixed(0)}\n` +
      `Based on ${comparables.length} comparables`;

    navigator.clipboard.writeText(shareText);

    toast({
      title: 'Copied',
      description: 'Analysis summary copied to clipboard',
    });
  }, [selectedProperty, analysis, comparables, toast]);

  /**
   * Refresh comparables
   */
  const refreshComparables = useCallback(() => {
    if (selectedProperty) {
      generateComparables(selectedProperty);
    }
  }, [selectedProperty, generateComparables]);

  /**
   * Handle property selection
   */
  const handleSelectProperty = useCallback((propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  }, [properties]);

  /**
   * Handle comp details view
   */
  const handleViewCompDetails = useCallback((comp: ComparableProperty) => {
    // TODO: Open comp details dialog
    console.log('View comp details:', comp);
  }, []);

  /**
   * Handle open on map
   */
  const handleOpenOnMap = useCallback((comp: ComparableProperty) => {
    setActiveTab('map');
    // TODO: Center map on comp
  }, []);

  /**
   * Handle export history item
   */
  const handleExportHistory = useCallback(async (item: any) => {
    // TODO: Export specific history item
    console.log('Export history item:', item);
  }, []);

  /**
   * Add/remove comp from comparison
   */
  const toggleCompareSelection = useCallback((comp: ComparableProperty) => {
    setSelectedForComparison(prev => {
      const exists = prev.find(c => c.id === comp.id);
      if (exists) {
        return prev.filter(c => c.id !== comp.id);
      } else if (prev.length < 4) {
        return [...prev, comp];
      }
      return prev;
    });
  }, []);

  /**
   * Remove comp from comparison
   */
  const removeFromComparison = useCallback((compId: string) => {
    setSelectedForComparison(prev => prev.filter(c => c.id !== compId));
  }, []);

  // ========================================
  // EFFECTS
  // ========================================

  // Load properties on mount
  useEffect(() => {
    fetchProperties();

    // Check if first time user
    const hasSeenOnboarding = localStorage.getItem('comps_onboarding_seen');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [fetchProperties]);

  // Generate comps when property selected
  useEffect(() => {
    if (selectedProperty) {
      generateComparables(selectedProperty);
      loadManualLinksCount(selectedProperty.id);
      // Load offer amount
      setOfferAmount(selectedProperty.cash_offer_amount || 0);
      setEditingOffer(false);
    }
  }, [selectedProperty, generateComparables, loadManualLinksCount]);

  // Update insights when analysis changes
  useEffect(() => {
    if (computedInsights) {
      setSmartInsights(computedInsights);
    }
  }, [computedInsights]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveReport();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToPDF(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshComparables();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [saveReport, exportToPDF, refreshComparables]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="space-y-6 p-6">
      {/* Onboarding Tour */}
      <OnboardingTour
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />

      {/* Command Palette */}
      <CommandPalette
        open={showCommandPalette}
        onOpenChange={setShowCommandPalette}
        properties={properties}
        selectedProperty={selectedProperty}
        analysis={analysis}
        onSave={saveReport}
        onExport={() => exportToPDF(false)}
        onOpenSettings={() => setShowApiConfig(true)}
        onOpenHistory={() => setActiveTab('auto')} // TODO: Add history tab
        onSelectProperty={handleSelectProperty}
      />

      {/* Compare Dialog */}
      <CompareDialog
        open={showCompareDialog}
        onOpenChange={setShowCompareDialog}
        comparables={selectedForComparison}
        onRemoveComparable={removeFromComparison}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comps Analysis</h1>
          <p className="text-muted-foreground">Comparative Market Analysis Tool</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowApiConfig(true)}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Approval Status Filter */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Filter by Status:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={approvalStatusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApprovalStatusFilter('all')}
                  className={approvalStatusFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  All ({properties.length})
                </Button>
                <Button
                  variant={approvalStatusFilter === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApprovalStatusFilter('approved')}
                  className={approvalStatusFilter === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  ✓ Approved ({properties.filter(p => p.approval_status === 'approved').length})
                </Button>
                <Button
                  variant={approvalStatusFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApprovalStatusFilter('pending')}
                  className={approvalStatusFilter === 'pending' ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : ''}
                >
                  ⏱ Pending ({properties.filter(p => !p.approval_status || p.approval_status === 'pending').length})
                </Button>
                <Button
                  variant={approvalStatusFilter === 'rejected' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setApprovalStatusFilter('rejected')}
                  className={approvalStatusFilter === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                  ✗ Rejected ({properties.filter(p => p.approval_status === 'rejected').length})
                </Button>
              </div>
            </div>

            {/* Offer Filter */}
            <div className="border-t pt-3">
              <Label className="text-sm font-semibold mb-2 block">Filter by Offer:</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={offerFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOfferFilter('all')}
                  className={offerFilter === 'all' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                >
                  All Properties
                </Button>
                <Button
                  variant={offerFilter === 'with-offer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOfferFilter('with-offer')}
                  className={offerFilter === 'with-offer' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}
                >
                  💰 With Offer ({properties.filter(p => p.cash_offer_amount && p.cash_offer_amount > 0).length})
                </Button>
                <Button
                  variant={offerFilter === 'no-offer' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOfferFilter('no-offer')}
                  className={offerFilter === 'no-offer' ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}
                >
                  📝 No Offer ({properties.filter(p => !p.cash_offer_amount || p.cash_offer_amount === 0).length})
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Selection */}
      <Card>
        <CardContent className="pt-6">
          <PropertySelector
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={handleSelectProperty}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            filter="all"
          />
        </CardContent>
      </Card>

      {/* Offer Management - Show when property is selected */}
      {selectedProperty && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Cash Offer Amount:</Label>
                {!editingOffer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingOffer(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {editingOffer ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-700">$</span>
                      <Input
                        type="number"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="text-lg font-semibold"
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button onClick={saveOfferAmount} className="bg-green-600 hover:bg-green-700 text-white">
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setEditingOffer(false);
                    setOfferAmount(selectedProperty.cash_offer_amount || 0);
                  }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div
                  className="text-2xl font-bold text-green-700 cursor-pointer hover:bg-green-100 p-3 rounded-lg transition-colors border-2 border-dashed border-green-300"
                  onClick={() => setEditingOffer(true)}
                  title="Click to edit offer amount"
                >
                  {selectedProperty.cash_offer_amount
                    ? `$${selectedProperty.cash_offer_amount.toLocaleString()}`
                    : '💰 Click to set offer amount'}
                </div>
              )}

              {analysis && selectedProperty.cash_offer_amount && selectedProperty.cash_offer_amount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Offer vs Market Avg: {selectedProperty.cash_offer_amount < analysis.avgSalePrice ? (
                    <span className="text-green-600 font-semibold">
                      {((1 - selectedProperty.cash_offer_amount / analysis.avgSalePrice) * 100).toFixed(1)}% below market
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold">
                      {((selectedProperty.cash_offer_amount / analysis.avgSalePrice - 1) * 100).toFixed(1)}% above market
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Property Selected */}
      {!selectedProperty && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Select a property above to begin analysis
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {selectedProperty && (
        <>
          {/* Executive Summary */}
          {analysis && (
            <ExecutiveSummary
              analysis={analysis}
              comparables={filteredComparables}
              dataSource={dataSource}
              selectedProperty={selectedProperty}
              loading={loadingComps}
              exportingPDF={exportingPDF}
              analysisNotes={analysisNotes}
              onNotesChange={setAnalysisNotes}
              onRefresh={refreshComparables}
              onSave={saveReport}
              onExport={exportToPDF}
              onExportAll={exportAllAnalyses}
              onShare={shareAnalysis}
            />
          )}

          {/* Smart Insights */}
          {smartInsights && selectedProperty && (
            <SmartInsights
              insights={smartInsights}
              property={selectedProperty}
            />
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="auto">
                Auto Comps ({filteredComparables.length})
              </TabsTrigger>
              <TabsTrigger value="manual">
                Manual ({manualLinksCount})
              </TabsTrigger>
              <TabsTrigger value="map">
                <Map className="h-4 w-4 mr-2" />
                Map
              </TabsTrigger>
              <TabsTrigger value="history">
                <HistoryIcon className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            {/* Auto Comps Tab */}
            <TabsContent value="auto" className="space-y-4">
              {/* Filters */}
              <CompsFilters
                filters={compsFilters}
                onFiltersChange={setCompsFilters}
                onClearFilters={() => setCompsFilters({ maxDistance: 3, saleWithin: 12 })}
                totalComps={comparables.length}
                filteredComps={filteredComparables.length}
              />

              {/* Comparables Table */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Comparable Properties</h3>
                    {selectedForComparison.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setShowCompareDialog(true)}
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Compare ({selectedForComparison.length})
                      </Button>
                    )}
                  </div>

                  <CompsTable
                    comparables={filteredComparables}
                    onViewDetails={handleViewCompDetails}
                    onOpenMap={handleOpenOnMap}
                    onToggleFavorite={toggleFavorite}
                    favorites={favorites}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manual Comps Tab */}
            <TabsContent value="manual">
              <ManualCompsManager
                selectedProperty={selectedProperty}
                onCompsUpdated={() => loadManualLinksCount(selectedProperty.id)}
              />
            </TabsContent>

            {/* Map Tab */}
            <TabsContent value="map">
              <CompsMapboxMap
                subjectProperty={selectedProperty}
                comparables={filteredComparables}
              />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history">
              <AnalysisHistory
                history={analysisHistoryData}
                onLoadHistory={loadHistoryItem}
                onDeleteHistory={deleteHistory}
                onExportHistory={handleExportHistory}
                currentPropertyId={selectedProperty.id}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* API Settings Dialog */}
      {showApiConfig && (
        <CompsApiSettings
          open={showApiConfig}
          onOpenChange={setShowApiConfig}
        />
      )}

      {/* Adjustment Calculator */}
      {showAdjustmentCalc && selectedProperty && (
        <AdjustmentCalculator
          open={showAdjustmentCalc}
          onOpenChange={setShowAdjustmentCalc}
          subjectProperty={selectedProperty}
          comparables={filteredComparables}
        />
      )}
    </div>
  );
};

export default CompsAnalysis;
